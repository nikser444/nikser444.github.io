import { Server, Socket } from 'socket.io';
import { Call, User } from '../models';
import { verifySocketAuth } from '../middleware/auth';
import { logger } from '../utils/logger';

interface AuthSocket extends Socket {
  userId?: string;
  user?: User;
}

interface VideoStreamData {
  callId: string;
  stream: MediaStream;
  userId: string;
}

interface VideoControlData {
  callId: string;
  action: 'mute_video' | 'unmute_video' | 'mute_audio' | 'unmute_audio';
  enabled: boolean;
}

interface VideoQualityData {
  callId: string;
  quality: 'low' | 'medium' | 'high' | 'hd';
}

export class VideoSocketHandler {
  private videoStreams = new Map<string, {
    participants: Map<string, {
      hasVideo: boolean;
      hasAudio: boolean;
      quality: string;
    }>;
    callType: 'video' | 'conference';
  }>();

  constructor(private io: Server) {
    this.setupVideoHandlers();
  }

  private setupVideoHandlers() {
    this.io.use(verifySocketAuth);
    
    this.io.on('connection', (socket: AuthSocket) => {
      logger.info(`User ${socket.userId} connected to video handler`);

      // Обработчики видео событий
      socket.on('video:stream:start', (data) => this.handleStreamStart(socket, data));
      socket.on('video:stream:stop', (data) => this.handleStreamStop(socket, data));
      socket.on('video:control:toggle', (data: VideoControlData) => this.handleVideoControl(socket, data));
      socket.on('video:quality:change', (data: VideoQualityData) => this.handleQualityChange(socket, data));
      
      // WebRTC специфичные события для видео
      socket.on('video:offer', (data) => this.handleVideoOffer(socket, data));
      socket.on('video:answer', (data) => this.handleVideoAnswer(socket, data));
      socket.on('video:ice-candidate', (data) => this.handleVideoICECandidate(socket, data));
      
      // События для конференц-видеозвонков
      socket.on('conference:video:join', (data) => this.handleConferenceVideoJoin(socket, data));
      socket.on('conference:video:leave', (data) => this.handleConferenceVideoLeave(socket, data));
      socket.on('conference:layout:change', (data) => this.handleLayoutChange(socket, data));
      
      // Обработчик отключения
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }

  private async handleStreamStart(socket: AuthSocket, data: { callId: string; hasVideo: boolean; hasAudio: boolean }) {
    try {
      if (!socket.userId) return;

      // Проверяем, что звонок существует и пользователь является участником
      const call = await Call.findByPk(data.callId);
      if (!call) {
        socket.emit('video:error', { message: 'Call not found' });
        return;
      }

      const isParticipant = call.callerId === socket.userId || 
                           call.receiverId === socket.userId ||
                           call.isConference;

      if (!isParticipant) {
        socket.emit('video:error', { message: 'Access denied' });
        return;
      }

      // Инициализируем или обновляем информацию о потоке
      let videoStream = this.videoStreams.get(data.callId);
      if (!videoStream) {
        videoStream = {
          participants: new Map(),
          callType: call.isConference ? 'conference' : 'video'
        };
        this.videoStreams.set(data.callId, videoStream);
      }

      videoStream.participants.set(socket.userId, {
        hasVideo: data.hasVideo,
        hasAudio: data.hasAudio,
        quality: 'medium'
      });

      // Присоединяемся к комнате видеозвонка
      socket.join(`video:${data.callId}`);

      // Уведомляем других участников о начале трансляции
      socket.to(`video:${data.callId}`).emit('video:stream:started', {
        callId: data.callId,
        userId: socket.userId,
        username: socket.user?.username,
        avatar: socket.user?.avatar,
        hasVideo: data.hasVideo,
        hasAudio: data.hasAudio
      });

      // Отправляем информацию о существующих потоках новому участнику
      const existingStreams = Array.from(videoStream.participants.entries())
        .filter(([userId]) => userId !== socket.userId)
        .map(([userId, streamInfo]) => ({
          userId,
          hasVideo: streamInfo.hasVideo,
          hasAudio: streamInfo.hasAudio,
          quality: streamInfo.quality
        }));

      if (existingStreams.length > 0) {
        socket.emit('video:existing:streams', {
          callId: data.callId,
          streams: existingStreams
        });
      }

      logger.info(`Video stream started: ${data.callId} by ${socket.userId}`);

    } catch (error) {
      logger.error('Error starting video stream:', error);
      socket.emit('video:error', { message: 'Failed to start video stream' });
    }
  }

  private async handleStreamStop(socket: AuthSocket, data: { callId: string }) {
    try {
      if (!socket.userId) return;

      const videoStream = this.videoStreams.get(data.callId);
      if (!videoStream) return;

      // Удаляем участника из потока
      videoStream.participants.delete(socket.userId);
      socket.leave(`video:${data.callId}`);

      // Уведомляем других участников об остановке трансляции
      socket.to(`video:${data.callId}`).emit('video:stream:stopped', {
        callId: data.callId,
        userId: socket.userId
      });

      // Если участников больше нет, удаляем поток
      if (videoStream.participants.size === 0) {
        this.videoStreams.delete(data.callId);
      }

      logger.info(`Video stream stopped: ${data.callId} by ${socket.userId}`);

    } catch (error) {
      logger.error('Error stopping video stream:', error);
    }
  }

  private handleVideoControl(socket: AuthSocket, data: VideoControlData) {
    if (!socket.userId) return;

    const videoStream = this.videoStreams.get(data.callId);
    if (!videoStream || !videoStream.participants.has(socket.userId)) return;

    const participant = videoStream.participants.get(socket.userId)!;

    // Обновляем состояние участника
    switch (data.action) {
      case 'mute_video':
      case 'unmute_video':
        participant.hasVideo = data.enabled;
        break;
      case 'mute_audio':
      case 'unmute_audio':
        participant.hasAudio = data.enabled;
        break;
    }

    videoStream.participants.set(socket.userId, participant);

    // Уведомляем других участников об изменении
    socket.to(`video:${data.callId}`).emit('video:control:changed', {
      callId: data.callId,
      userId: socket.userId,
      action: data.action,
      enabled: data.enabled
    });

    logger.info(`Video control changed: ${data.callId} by ${socket.userId}, action: ${data.action}, enabled: ${data.enabled}`);
  }

  private handleQualityChange(socket: AuthSocket, data: VideoQualityData) {
    if (!socket.userId) return;

    const videoStream = this.videoStreams.get(data.callId);
    if (!videoStream || !videoStream.participants.has(socket.userId)) return;

    const participant = videoStream.participants.get(socket.userId)!;
    participant.quality = data.quality;
    videoStream.participants.set(socket.userId, participant);

    // Уведомляем других участников об изменении качества
    socket.to(`video:${data.callId}`).emit('video:quality:changed', {
      callId: data.callId,
      userId: socket.userId,
      quality: data.quality
    });

    logger.info(`Video quality changed: ${data.callId} by ${socket.userId} to ${data.quality}`);
  }

  private handleVideoOffer(socket: AuthSocket, data: any) {
    if (!socket.userId) return;

    // Переадресуем offer указанному получателю
    if (data.to) {
      this.io.to(`user:${data.to}`).emit('video:offer', {
        ...data,
        from: socket.userId
      });
    } else {
      // Если получатель не указан, отправляем всем в комнате (для конференций)
      socket.to(`video:${data.callId}`).emit('video:offer', {
        ...data,
        from: socket.userId
      });
    }
  }

  private handleVideoAnswer(socket: AuthSocket, data: any) {
    if (!socket.userId) return;

    // Переадресуем answer указанному получателю
    if (data.to) {
      this.io.to(`user:${data.to}`).emit('video:answer', {
        ...data,
        from: socket.userId
      });
    } else {
      socket.to(`video:${data.callId}`).emit('video:answer', {
        ...data,
        from: socket.userId
      });
    }
  }

  private handleVideoICECandidate(socket: AuthSocket, data: any) {
    if (!socket.userId) return;

    // Переадресуем ICE candidate
    if (data.to) {
      this.io.to(`user:${data.to}`).emit('video:ice-candidate', {
        ...data,
        from: socket.userId
      });
    } else {
      socket.to(`video:${data.callId}`).emit('video:ice-candidate', {
        ...data,
        from: socket.userId
      });
    }
  }

  private async handleConferenceVideoJoin(socket: AuthSocket, data: { callId: string }) {
    try {
      if (!socket.userId) return;

      const call = await Call.findByPk(data.callId);
      if (!call || !call.isConference) {
        socket.emit('video:error', { message: 'Conference not found' });
        return;
      }

      // Присоединяемся к видеоконференции
      socket.join(`video:${data.callId}`);

      const videoStream = this.videoStreams.get(data.callId);
      if (videoStream) {
        // Отправляем информацию о существующих участниках
        const participants = Array.from(videoStream.participants.entries()).map(([userId, info]) => ({
          userId,
          hasVideo: info.hasVideo,
          hasAudio: info.hasAudio,
          quality: info.quality
        }));

        socket.emit('conference:video:participants', {
          callId: data.callId,
          participants
        });
      }

      // Уведомляем других участников о присоединении
      socket.to(`video:${data.callId}`).emit('conference:video:participant-joined', {
        callId: data.callId,
        userId: socket.userId,
        username: socket.user?.username,
        avatar: socket.user?.avatar
      });

      logger.info(`User ${socket.userId} joined video conference ${data.callId}`);

    } catch (error) {
      logger.error('Error joining video conference:', error);
      socket.emit('video:error', { message: 'Failed to join video conference' });
    }
  }

  private handleConferenceVideoLeave(socket: AuthSocket, data: { callId: string }) {
    if (!socket.userId) return;

    socket.leave(`video:${data.callId}`);

    const videoStream = this.videoStreams.get(data.callId);
    if (videoStream) {
      videoStream.participants.delete(socket.userId);
      
      if (videoStream.participants.size === 0) {
        this.videoStreams.delete(data.callId);
      }
    }

    // Уведомляем других участников об уходе
    socket.to(`video:${data.callId}`).emit('conference:video:participant-left', {
      callId: data.callId,
      userId: socket.userId
    });

    logger.info(`User ${socket.userId} left video conference ${data.callId}`);
  }

  private handleLayoutChange(socket: AuthSocket, data: { callId: string; layout: 'grid' | 'speaker' | 'sidebar' }) {
    if (!socket.userId) return;

    // Уведомляем других участников об изменении раскладки
    socket.to(`video:${data.callId}`).emit('conference:layout:changed', {
      callId: data.callId,
      layout: data.layout,
      changedBy: socket.userId
    });

    logger.info(`Layout changed in conference ${data.callId} by ${socket.userId} to ${data.layout}`);
  }

  private handleDisconnect(socket: AuthSocket) {
    if (!socket.userId) return;

    logger.info(`User ${socket.userId} disconnected from video handler`);

    // Удаляем пользователя из всех видеопотоков
    for (const [callId, videoStream] of this.videoStreams.entries()) {
      if (videoStream.participants.has(socket.userId)) {
        videoStream.participants.delete(socket.userId);
        
        // Уведомляем других участников
        this.io.to(`video:${callId}`).emit('video:stream:stopped', {
          callId,
          userId: socket.userId,
          reason: 'disconnect'
        });

        if (videoStream.participants.size === 0) {
          this.videoStreams.delete(callId);
        }
      }
    }
  }

  // Публичные методы для использования из других частей приложения
  public getVideoStream(callId: string) {
    return this.videoStreams.get(callId);
  }

  public getCallParticipants(callId: string): string[] {
    const videoStream = this.videoStreams.get(callId);
    return videoStream ? Array.from(videoStream.participants.keys()) : [];
  }

  public forceEndVideoStream(callId: string) {
    const videoStream = this.videoStreams.get(callId);
    if (videoStream) {
      // Уведомляем всех участников о принудительном завершении
      this.io.to(`video:${callId}`).emit('video:stream:force-ended', { callId });
      
      // Очищаем данные
      this.videoStreams.delete(callId);
      
      // Удаляем комнату
      this.io.in(`video:${callId}`).socketsLeave(`video:${callId}`);
    }
  }

  public muteParticipant(callId: string, userId: string, muteType: 'audio' | 'video') {
    const videoStream = this.videoStreams.get(callId);
    if (videoStream && videoStream.participants.has(userId)) {
      const participant = videoStream.participants.get(userId)!;
      
      if (muteType === 'audio') {
        participant.hasAudio = false;
      } else {
        participant.hasVideo = false;
      }
      
      videoStream.participants.set(userId, participant);

      // Уведомляем о принудительном отключении
      this.io.to(`video:${callId}`).emit('video:participant:muted', {
        callId,
        userId,
        muteType,
        forced: true
      });
    }
  }
}