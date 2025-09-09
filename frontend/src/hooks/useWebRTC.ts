import { useRef, useCallback, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setCallState, addParticipant, removeParticipant } from '../store/callSlice';
import { useSocket } from './useSocket';
import type { Call, CallType, CallState } from '../types/call';

interface MediaDevices {
  audioDevices: MediaDeviceInfo[];
  videoDevices: MediaDeviceInfo[];
}

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isCallActive: boolean;
  callState: CallState;
  mediaDevices: MediaDevices;
  initiateCall: (targetUserId: string, type: CallType) => Promise<boolean>;
  acceptCall: (callId: string) => Promise<boolean>;
  declineCall: (callId: string) => void;
  endCall: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  startScreenShare: () => Promise<boolean>;
  stopScreenShare: () => void;
  switchCamera: () => Promise<void>;
  changeAudioDevice: (deviceId: string) => Promise<void>;
  changeVideoDevice: (deviceId: string) => Promise<void>;
}

const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  // TURN сервер (нужно настроить свой)
  // { urls: 'turn:your-turn-server.com:3478', username: 'user', credential: 'pass' }
];

export const useWebRTC = (): UseWebRTCReturn => {
  const dispatch = useDispatch();
  const { socket } = useSocket();
  const { currentCall, callState } = useSelector((state: RootState) => state.call);
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [mediaDevices, setMediaDevices] = useState<MediaDevices>({
    audioDevices: [],
    videoDevices: []
  });
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingIceCandidates = useRef<Map<string, RTCIceCandidate[]>>(new Map());

  // Получаем список доступных устройств
  const getMediaDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      setMediaDevices({ audioDevices, videoDevices });
    } catch (error) {
      console.error('Ошибка получения устройств:', error);
    }
  }, []);

  // Создание peer connection
  const createPeerConnection = useCallback((userId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc:ice-candidate', {
          targetUserId: userId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      remoteStreams.set(userId, remoteStream);
      dispatch(addParticipant({
        userId,
        stream: remoteStream
      }));
    };

    pc.onconnectionstatechange = () => {
      console.log(`Состояние соединения с ${userId}:`, pc.connectionState);
      
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        remoteStreams.delete(userId);
        dispatch(removeParticipant(userId));
      }
    };

    return pc;
  }, [socket, remoteStreams, dispatch]);

  // Получение локального потока
  const getLocalStream = useCallback(async (video: boolean = true): Promise<MediaStream | null> => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: video ? { width: 1280, height: 720 } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Ошибка получения медиапотока:', error);
      return null;
    }
  }, []);

  // Инициация звонка
  const initiateCall = useCallback(async (targetUserId: string, type: CallType): Promise<boolean> => {
    try {
      if (!socket) {
        console.error('Сокет не подключен');
        return false;
      }

      const stream = await getLocalStream(type === 'video');
      if (!stream) {
        return false;
      }

      const pc = createPeerConnection(targetUserId);
      peerConnections.current.set(targetUserId, pc);

      // Добавляем локальный поток в peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Создаем offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Отправляем offer через сокет
      socket.emit('call:offer', {
        targetUserId,
        callType: type,
        offer
      });

      dispatch(setCallState({
        state: 'outgoing',
        callId: Date.now().toString(),
        participants: [targetUserId],
        type
      }));

      return true;
    } catch (error) {
      console.error('Ошибка инициации звонка:', error);
      return false;
    }
  }, [socket, getLocalStream, createPeerConnection, dispatch]);

  // Принятие звонка
  const acceptCall = useCallback(async (callId: string): Promise<boolean> => {
    try {
      if (!socket || !currentCall) {
        return false;
      }

      const stream = await getLocalStream(currentCall.type === 'video');
      if (!stream) {
        return false;
      }

      const targetUserId = currentCall.participants[0];
      const pc = createPeerConnection(targetUserId);
      peerConnections.current.set(targetUserId, pc);

      // Добавляем локальный поток
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Устанавливаем remote description и создаем answer
      if (currentCall.offer) {
        await pc.setRemoteDescription(currentCall.offer);
        
        // Добавляем pending ICE candidates
        const candidates = pendingIceCandidates.current.get(targetUserId) || [];
        for (const candidate of candidates) {
          await pc.addIceCandidate(candidate);
        }
        pendingIceCandidates.current.delete(targetUserId);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('call:answer', {
          targetUserId,
          callId,
          answer
        });
      }

      dispatch(setCallState({
        state: 'connected',
        callId,
        participants: currentCall.participants,
        type: currentCall.type
      }));

      return true;
    } catch (error) {
      console.error('Ошибка принятия звонка:', error);
      return false;
    }
  }, [socket, currentCall, getLocalStream, createPeerConnection, dispatch]);

  // Отклонение звонка
  const declineCall = useCallback((callId: string) => {
    if (!socket) return;

    socket.emit('call:decline', { callId });
    
    dispatch(setCallState({
      state: 'idle',
      callId: null,
      participants: [],
      type: 'audio'
    }));
  }, [socket, dispatch]);

  // Завершение звонка
  const endCall = useCallback(() => {
    // Закрываем все peer connections
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();

    // Останавливаем локальный поток
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    // Очищаем remote streams
    remoteStreams.clear();

    // Уведомляем сервер о завершении звонка
    if (socket && currentCall) {
      socket.emit('call:end', { callId: currentCall.callId });
    }

    dispatch(setCallState({
      state: 'idle',
      callId: null,
      participants: [],
      type: 'audio'
    }));

    setIsScreenSharing(false);
  }, [socket, currentCall, localStream, remoteStreams, dispatch]);

  // Переключение аудио
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  }, [localStream]);

  // Переключение видео
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  }, [localStream]);

  // Начало демонстрации экрана
  const startScreenShare = useCallback(async (): Promise<boolean> => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true, 
        audio: true 
      });

      // Заменяем видео трек на экранный
      if (localStream) {
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnections.current.values().next().value?.getSenders()
          .find((s: RTCRtpSender) => s.track?.kind === 'video');

        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }

        // Заменяем трек в локальном потоке
        const oldVideoTrack = localStream.getVideoTracks()[0];
        if (oldVideoTrack) {
          localStream.removeTrack(oldVideoTrack);
          localStream.addTrack(videoTrack);
        }
      }

      setIsScreenSharing(true);

      // Обработчик окончания демонстрации экрана
      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      return true;
    } catch (error) {
      console.error('Ошибка начала демонстрации экрана:', error);
      return false;
    }
  }, [localStream]);

  // Остановка демонстрации экрана
  const stopScreenShare = useCallback(async () => {
    try {
      // Возвращаем камеру
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoTrack = videoStream.getVideoTracks()[0];

      if (localStream && videoTrack) {
        const sender = peerConnections.current.values().next().value?.getSenders()
          .find((s: RTCRtpSender) => s.track?.kind === 'video');

        if (sender) {
          await sender.replaceTrack(videoTrack);
        }

        // Заменяем трек в локальном потоке
        const oldVideoTrack = localStream.getVideoTracks()[0];
        if (oldVideoTrack) {
          localStream.removeTrack(oldVideoTrack);
          localStream.addTrack(videoTrack);
        }
      }

      setIsScreenSharing(false);
    } catch (error) {
      console.error('Ошибка остановки демонстрации экрана:', error);
    }
  }, [localStream]);

  // Переключение камеры (для мобильных устройств)
  const switchCamera = useCallback(async (): Promise<void> => {
    try {
      if (!localStream) return;

      const videoTrack = localStream.getVideoTracks()[0];
      if (!videoTrack) return;

      // Получаем текущие constraints
      const constraints = videoTrack.getConstraints() as any;
      const facingMode = constraints.facingMode === 'user' ? 'environment' : 'user';

      // Создаем новый поток с другой камерой
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode }
      });

      const newVideoTrack = newStream.getVideoTracks()[0];

      // Заменяем трек в peer connections
      peerConnections.current.forEach(async (pc) => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }
      });

      // Заменяем трек в локальном потоке
      localStream.removeTrack(videoTrack);
      localStream.addTrack(newVideoTrack);
      videoTrack.stop();

    } catch (error) {
      console.error('Ошибка переключения камеры:', error);
    }
  }, [localStream]);

  // Смена аудиоустройства
  const changeAudioDevice = useCallback(async (deviceId: string): Promise<void> => {
    try {
      if (!localStream) return;

      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId },
        video: false
      });

      const newAudioTrack = newStream.getAudioTracks()[0];
      const oldAudioTrack = localStream.getAudioTracks()[0];

      if (newAudioTrack && oldAudioTrack) {
        // Заменяем трек в peer connections
        peerConnections.current.forEach(async (pc) => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'audio');
          if (sender) {
            await sender.replaceTrack(newAudioTrack);
          }
        });

        // Заменяем трек в локальном потоке
        localStream.removeTrack(oldAudioTrack);
        localStream.addTrack(newAudioTrack);
        oldAudioTrack.stop();
      }
    } catch (error) {
      console.error('Ошибка смены аудиоустройства:', error);
    }
  }, [localStream]);

  // Смена видеоустройства
  const changeVideoDevice = useCallback(async (deviceId: string): Promise<void> => {
    try {
      if (!localStream) return;

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId },
        audio: false
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      const oldVideoTrack = localStream.getVideoTracks()[0];

      if (newVideoTrack && oldVideoTrack) {
        // Заменяем трек в peer connections
        peerConnections.current.forEach(async (pc) => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            await sender.replaceTrack(newVideoTrack);
          }
        });

        // Заменяем трек в локальном потоке
        localStream.removeTrack(oldVideoTrack);
        localStream.addTrack(newVideoTrack);
        oldVideoTrack.stop();
      }
    } catch (error) {
      console.error('Ошибка смены видеоустройства:', error);
    }
  }, [localStream]);

  // WebRTC сокет обработчики
  useEffect(() => {
    if (!socket) return;

    // Получение offer
    socket.on('webrtc:offer', async (data: any) => {
      const { fromUserId, offer, callType, callId } = data;
      
      dispatch(setCallState({
        state: 'incoming',
        callId,
        participants: [fromUserId],
        type: callType,
        offer
      }));
    });

    // Получение answer
    socket.on('webrtc:answer', async (data: any) => {
      const { fromUserId, answer } = data;
      const pc = peerConnections.current.get(fromUserId);
      
      if (pc) {
        await pc.setRemoteDescription(answer);
        
        dispatch(setCallState({
          state: 'connected',
          callId: currentCall?.callId || '',
          participants: currentCall?.participants || [],
          type: currentCall?.type || 'audio'
        }));
      }
    });

    // Получение ICE candidate
    socket.on('webrtc:ice-candidate', async (data: any) => {
      const { fromUserId, candidate } = data;
      const pc = peerConnections.current.get(fromUserId);
      
      if (pc && pc.remoteDescription) {
        await pc.addIceCandidate(candidate);
      } else {
        // Сохраняем candidate для последующего добавления
        const candidates = pendingIceCandidates.current.get(fromUserId) || [];
        candidates.push(candidate);
        pendingIceCandidates.current.set(fromUserId, candidates);
      }
    });

    // Звонок завершен
    socket.on('call:ended', () => {
      endCall();
    });

    return () => {
      socket.off('webrtc:offer');
      socket.off('webrtc:answer');
      socket.off('webrtc:ice-candidate');
      socket.off('call:ended');
    };
  }, [socket, currentCall, dispatch, endCall]);

  // Инициализация устройств при монтировании
  useEffect(() => {
    getMediaDevices();
    
    // Обновляем список устройств при изменениях
    navigator.mediaDevices.addEventListener('devicechange', getMediaDevices);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getMediaDevices);
    };
  }, [getMediaDevices]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    localStream,
    remoteStreams,
    isCallActive: callState !== 'idle',
    callState,
    mediaDevices,
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    switchCamera,
    changeAudioDevice,
    changeVideoDevice
  };
};