import { socketManager } from './socket';
import { logger } from './logger';

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  iceTransportPolicy?: 'all' | 'relay';
  iceCandidatePoolSize?: number;
}

export interface MediaConstraints {
  audio: boolean | MediaTrackConstraints;
  video: boolean | MediaTrackConstraints;
}

export interface CallState {
  callId: string;
  isInitiator: boolean;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  screenStream?: MediaStream;
  peerConnection?: RTCPeerConnection;
  state: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
  type: 'audio' | 'video';
}

class WebRTCManager {
  private peerConnections = new Map<string, RTCPeerConnection>();
  private localStreams = new Map<string, MediaStream>();
  private remoteStreams = new Map<string, MediaStream>();
  private screenStreams = new Map<string, MediaStream>();
  private callStates = new Map<string, CallState>();
  
  private config: WebRTCConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: 'turn:numb.viagenie.ca',
        credential: 'muazkh',
        username: 'webrtc@live.com'
      }
    ],
    iceCandidatePoolSize: 10,
  };

  constructor() {
    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    socketManager.on('webrtc:offer', async (data) => {
      await this.handleOffer(data.callId, data.offer);
    });

    socketManager.on('webrtc:answer', async (data) => {
      await this.handleAnswer(data.callId, data.answer);
    });

    socketManager.on('webrtc:ice-candidate', async (data) => {
      await this.handleICECandidate(data.callId, data.candidate);
    });

    socketManager.on('call:ended', (data) => {
      this.endCall(data.callId);
    });
  }

  // Инициация звонка
  async initiateCall(
    callId: string,
    targetUserId: string,
    type: 'audio' | 'video',
    constraints?: MediaConstraints
  ): Promise<void> {
    try {
      logger.info('Initiating call:', { callId, targetUserId, type });

      const mediaConstraints: MediaConstraints = constraints || {
        audio: true,
        video: type === 'video'
      };

      // Получаем локальный поток
      const localStream = await this.getUserMedia(mediaConstraints);
      this.localStreams.set(callId, localStream);

      // Создаем peer connection
      const peerConnection = this.createPeerConnection(callId);
      this.peerConnections.set(callId, peerConnection);

      // Добавляем треки в peer connection
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });

      // Создаем состояние звонка
      const callState: CallState = {
        callId,
        isInitiator: true,
        localStream,
        peerConnection,
        state: 'calling',
        type
      };
      this.callStates.set(callId, callState);

      // Создаем и отправляем offer
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === 'video'
      });

      await peerConnection.setLocalDescription(offer);
      socketManager.sendWebRTCOffer(callId, offer);

      logger.info('Call initiated successfully:', callId);
    } catch (error) {
      logger.error('Failed to initiate call:', error);
      this.endCall(callId);
      throw error;
    }
  }

  // Принятие входящего звонка
  async acceptCall(callId: string, type: 'audio' | 'video', constraints?: MediaConstraints): Promise<void> {
    try {
      logger.info('Accepting call:', { callId, type });

      const mediaConstraints: MediaConstraints = constraints || {
        audio: true,
        video: type === 'video'
      };

      // Получаем локальный поток
      const localStream = await this.getUserMedia(mediaConstraints);
      this.localStreams.set(callId, localStream);

      // Создаем peer connection
      const peerConnection = this.createPeerConnection(callId);
      this.peerConnections.set(callId, peerConnection);

      // Добавляем треки в peer connection
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });

      // Создаем состояние звонка
      const callState: CallState = {
        callId,
        isInitiator: false,
        localStream,
        peerConnection,
        state: 'connected',
        type
      };
      this.callStates.set(callId, callState);

      logger.info('Call accepted successfully:', callId);
    } catch (error) {
      logger.error('Failed to accept call:', error);
      this.endCall(callId);
      throw error;
    }
  }

  // Завершение звонка
  endCall(callId: string): void {
    logger.info('Ending call:', callId);

    const callState = this.callStates.get(callId);
    if (callState) {
      callState.state = 'ended';
    }

    // Закрываем peer connection
    const peerConnection = this.peerConnections.get(callId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(callId);
    }

    // Останавливаем локальный поток
    const localStream = this.localStreams.get(callId);
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      this.localStreams.delete(callId);
    }

    // Очищаем удаленный поток
    this.remoteStreams.delete(callId);

    // Останавливаем экранный поток
    const screenStream = this.screenStreams.get(callId);
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      this.screenStreams.delete(callId);
    }

    // Удаляем состояние звонка
    this.callStates.delete(callId);

    socketManager.endCall(callId);
    logger.info('Call ended successfully:', callId);
  }

  // Включение/выключение микрофона
  toggleAudio(callId: string): boolean {
    const localStream = this.localStreams.get(callId);
    if (!localStream) return false;

    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return audioTrack.enabled;
    }
    return false;
  }

  // Включение/выключение видео
  toggleVideo(callId: string): boolean {
    const localStream = this.localStreams.get(callId);
    if (!localStream) return false;

    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      return videoTrack.enabled;
    }
    return false;
  }

  // Демонстрация экрана
  async startScreenShare(callId: string): Promise<MediaStream | null> {
    try {
      logger.info('Starting screen share for call:', callId);

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      this.screenStreams.set(callId, screenStream);

      const peerConnection = this.peerConnections.get(callId);
      if (peerConnection) {
        // Заменяем видео трек на экранный
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );

        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }

        // Обрабатываем завершение демонстрации экрана
        videoTrack.onended = () => {
          this.stopScreenShare(callId);
        };
      }

      socketManager.startScreenShare(callId);
      return screenStream;
    } catch (error) {
      logger.error('Failed to start screen share:', error);
      return null;
    }
  }

  // Остановка демонстрации экрана
  async stopScreenShare(callId: string): Promise<void> {
    try {
      logger.info('Stopping screen share for call:', callId);

      const screenStream = this.screenStreams.get(callId);
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        this.screenStreams.delete(callId);
      }

      const peerConnection = this.peerConnections.get(callId);
      const localStream = this.localStreams.get(callId);

      if (peerConnection && localStream) {
        // Возвращаем оригинальный видео трек
        const videoTrack = localStream.getVideoTracks()[0];
        const sender = peerConnection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );

        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }
      }

      socketManager.stopScreenShare(callId);
    } catch (error) {
      logger.error('Failed to stop screen share:', error);
    }
  }

  // Получение медиа потока
  private async getUserMedia(constraints: MediaConstraints): Promise<MediaStream> {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      logger.error('Failed to get user media:', error);
      throw new Error('Не удалось получить доступ к камере/микрофону');
    }
  }

  // Создание peer connection
  private createPeerConnection(callId: string): RTCPeerConnection {
    const peerConnection = new RTCPeerConnection(this.config);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketManager.sendICECandidate(callId, event.candidate);
      }
    };

    peerConnection.ontrack = (event) => {
      logger.info('Received remote track for call:', callId);
      this.remoteStreams.set(callId, event.streams[0]);
      
      const callState = this.callStates.get(callId);
      if (callState) {
        callState.remoteStream = event.streams[0];
        callState.state = 'connected';
      }
    };

    peerConnection.onconnectionstatechange = () => {
      logger.info('Connection state changed:', peerConnection.connectionState);
      
      const callState = this.callStates.get(callId);
      if (callState) {
        if (peerConnection.connectionState === 'connected') {
          callState.state = 'connected';
        } else if (peerConnection.connectionState === 'failed' || 
                   peerConnection.connectionState === 'disconnected') {
          this.endCall(callId);
        }
      }
    };

    peerConnection.onicegatheringstatechange = () => {
      logger.info('ICE gathering state:', peerConnection.iceGatheringState);
    };

    return peerConnection;
  }

  // Обработка входящего offer
  private async handleOffer(callId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      logger.info('Handling offer for call:', callId);

      const peerConnection = this.peerConnections.get(callId);
      if (!peerConnection) {
        logger.error('No peer connection found for call:', callId);
        return;
      }

      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socketManager.sendWebRTCAnswer(callId, answer);
    } catch (error) {
      logger.error('Failed to handle offer:', error);
      this.endCall(callId);
    }
  }

  // Обработка входящего answer
  private async handleAnswer(callId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      logger.info('Handling answer for call:', callId);

      const peerConnection = this.peerConnections.get(callId);
      if (!peerConnection) {
        logger.error('No peer connection found for call:', callId);
        return;
      }

      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      logger.error('Failed to handle answer:', error);
      this.endCall(callId);
    }
  }

  // Обработка ICE candidate
  private async handleICECandidate(callId: string, candidate: RTCIceCandidate): Promise<void> {
    try {
      const peerConnection = this.peerConnections.get(callId);
      if (!peerConnection) {
        logger.error('No peer connection found for call:', callId);
        return;
      }

      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      logger.error('Failed to handle ICE candidate:', error);
    }
  }

  // Проверка поддержки WebRTC
  static isWebRTCSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.RTCPeerConnection
    );
  }

  // Проверка поддержки демонстрации экрана
  static isScreenShareSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
  }

  // Получение состояния звонка
  getCallState(callId: string): CallState | undefined {
    return this.callStates.get(callId);
  }

  // Получение локального потока
  getLocalStream(callId: string): MediaStream | undefined {
    return this.localStreams.get(callId);
  }

  // Получение удаленного потока
  getRemoteStream(callId: string): MediaStream | undefined {
    return this.remoteStreams.get(callId);
  }

  // Получение экранного потока
  getScreenStream(callId: string): MediaStream | undefined {
    return this.screenStreams.get(callId);
  }

  // Получение статистики звонка
  async getCallStats(callId: string): Promise<RTCStatsReport | null> {
    const peerConnection = this.peerConnections.get(callId);
    if (!peerConnection) return null;

    try {
      return await peerConnection.getStats();
    } catch (error) {
      logger.error('Failed to get call stats:', error);
      return null;
    }
  }

  // Обновление конфигурации WebRTC
  updateConfig(config: Partial<WebRTCConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Singleton instance
export const webrtcManager = new WebRTCManager();

// Helper functions
export const isWebRTCSupported = WebRTCManager.isWebRTCSupported;
export const isScreenShareSupported = WebRTCManager.isScreenShareSupported;

export default webrtcManager;