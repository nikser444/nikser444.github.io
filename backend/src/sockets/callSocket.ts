import { Server, Socket } from 'socket.io';
import { Call, User, Chat } from '../models';
import { verifySocketAuth } from '../middleware/auth';
import { logger } from '../utils/logger';
import { CallService } from '../services';

interface AuthSocket extends Socket {
  userId?: string;
  user?: User;
}

interface CallInitiateData {
  receiverId: string;
  callType: 'audio' | 'video';
  chatId?: string;
}

interface CallResponseData {
  callId: string;
  action: 'accept' | 'decline';
}

interface WebRTCSignalData {
  callId: string;
  type: 'offer' | 'answer' | 'ice-candidate';
  data: any;
}

interface ConferenceData {
  chatId: string;
  callType: 'audio' | 'video';
}

export class CallSocketHandler {
  private activeCalls = new Map<string, {
    participants: string[];
    callType: 'audio' | 'video';
    status: 'ringing' | 'active' | 'ended';
  }>();

  constructor(private io: Server) {
    this.setupCallHandlers();
  }

  private setupCallHandlers() {
    this.io.use(verifySocketAuth);
    
    this.io.on('connection', (socket: AuthSocket) => {
      logger.info(`User ${socket.userId} connected to call handler`);

      // Присоединяемся к персональной комнате пользователя
      if (socket.userId) {
        socket.join(`user:${socket.userId}`);
      }

      // Обработчики событий звонков
      socket.on('call:initiate', (data: CallInitiateData) => this.handleInitiateCall(socket, data));
      socket.on('call:response', (data: CallResponseData) => this.handleCallResponse(socket, data));
      socket.on('call:end', (data: { callId: string }) => this.handleEndCall(socket, data));
      socket.on('call:cancel', (data: { callId: string }) => this.handleCancelCall(socket, data));
      
      // WebRTC сигналинг
      socket.on('webrtc:signal', (data: WebRTCSignalData) => this.handleWebRTCSignal(socket, data));
      socket.on('webrtc:ice-candidate', (data: WebRTCSignalData) => this.handleICECandidate(socket, data));
      
      // Конференц-звонки
      socket.on('conference:create', (data: ConferenceData) => this.handleCreateConference(socket, data));
      socket.on('conference:join', (data: { callId: string }) => this.handleJoinConference(socket, data));
      socket.on('conference:leave', (data: { callId: string }) => this.handleLeaveConference(socket, data));

      // Обработчик отключения
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }

  private async handleInitiateCall(socket: AuthSocket, data: CallInitiateData) {
    try {
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      // Проверяем, что получатель существует
      const receiver = await User.findByPk(data.receiverId);
      if (!receiver) {
        socket.emit('call:error', { message: 'Receiver not found' });
        return;
      }

      // Проверяем, что пользователи являются друзьями или участниками общего чата
      const canCall = await CallService.canInitiateCall(socket.userId, data.receiverId);
      if (!canCall) {
        socket.emit('call:error', { message: 'Cannot initiate call with this user' });
        return;
      }

      // Проверяем, что получатель не находится в другом звонке
      const receiverInCall = await this.isUserInCall(data.receiverId);
      if (receiverInCall) {
        socket.emit('call:error', { message: 'User is already in a call' });
        return;
      }

      // Создаем запись о звонке в БД
      const call = await Call.create({
        callerId: socket.userId,
        receiverId: data.receiverId,
        chatId: data.chatId || null,
        callType: data.callType,
        status: 'ringing',
        initiatedAt: new Date()
      });

      // Добавляем звонок в активные
      this.activeCalls.set(call.id, {
        participants: [socket.userId, data.receiverId],
        callType: data.callType,
        status: 'ringing'
      });

      // Присоединяем участников к комнате звонка
      socket.join(`call:${call.id}`);

      // Отправляем уведомление о входящем звонке получателю
      this.io.to(`user:${data.receiverId}`).emit('call:incoming', {
        callId: call.id,
        caller: {
          id: socket.userId,
          username: socket.user?.username,
          avatar: socket.user?.avatar
        },
        callType: data.callType,
        chatId: data.chatId
      });

      // Подтверждаем инициатору, что звонок начат
      socket.emit('call:initiated', {
        callId: call.id,
        receiverId: data.receiverId,
        callType: data.callType
      });

      // Устанавливаем таймаут для автоматической отмены звонка
      setTimeout(() => {
        this.handleCallTimeout(call.id);
      }, 60000); // 60 секунд

      logger.info(`Call initiated: ${call.id} from ${socket.userId} to ${data.receiverId}`);

    } catch (error) {
      logger.error('Error initiating call:', error);
      socket.emit('call:error', { message: 'Failed to initiate call' });
    }
  }

  private async handleCallResponse(socket: AuthSocket, data: CallResponseData) {
    try {
      if (!socket.userId) return;

      const call = await Call.findByPk(data.callId);
      if (!call) {
        socket.emit('call:error', { message: 'Call not found' });
        return;
      }

      // Проверяем, что пользователь является получателем звонка
      if (call.receiverId !== socket.userId) {
        socket.emit('call:error', { message: 'Access denied' });
        return;
      }

      const activeCall = this.activeCalls.get(data.callId);
      if (!activeCall) {
        socket.emit('call:error', { message: 'Call is no longer active' });
        return;
      }

      if (data.action === 'accept') {
        // Принимаем звонок
        await call.update({
          status: 'active',
          acceptedAt: new Date()
        });

        activeCall.status = 'active';
        this.activeCalls.set(data.callId, activeCall);

        // Присоединяемся к комнате звонка
        socket.join(`call:${data.callId}`);

        // Уведомляем участников о принятии звонка
        this.io.to(`call:${data.callId}`).emit('call:accepted', {
          callId: data.callId,
          participants: activeCall.participants
        });

        logger.info(`Call accepted: ${data.callId}`);

      } else if (data.action === 'decline') {
        // Отклоняем звонок
        await call.update({
          status: 'declined',
          endedAt: new Date()
        });

        // Уведомляем инициатора об отклонении
        this.io.to(`user:${call.callerId}`).emit('call:declined', {
          callId: data.callId
        });

        // Удаляем из активных звонков
        this.activeCalls.delete(data.callId);

        logger.info(`Call declined: ${data.callId}`);
      }

    } catch (error) {
      logger.error('Error handling call response:', error);
      socket.emit('call:error', { message: 'Failed to process call response' });
    }
  }

  private async handleEndCall(socket: AuthSocket, data: { callId: string }) {
    try {
      if (!socket.userId) return;

      const call = await Call.findByPk(data.callId);
      if (!call) return;

      const activeCall = this.activeCalls.get(data.callId);
      if (!activeCall) return;

      // Проверяем, что пользователь является участником звонка
      if (!activeCall.participants.includes(socket.userId)) return;

      // Завершаем звонок
      await call.update({
        status: 'ended',
        endedAt: new Date()
      });

      // Уведомляем всех участников о завершении звонка
      this.io.to(`call:${data.callId}`).emit('call:ended', {
        callId: data.callId,
        endedBy: socket.userId
      });

      // Удаляем из активных звонков
      this.activeCalls.delete(data.callId);

      // Удаляем комнату
      this.io.in(`call:${data.callId}`).socketsLeave(`call:${data.callId}`);

      logger.info(`Call ended: ${data.callId} by ${socket.userId}`);

    } catch (error) {
      logger.error('Error ending call:', error);
    }
  }

  private async handleCancelCall(socket: AuthSocket, data: { callId: string }) {
    try {
      if (!socket.userId) return;

      const call = await Call.findByPk(data.callId);
      if (!call || call.callerId !== socket.userId) return;

      // Отменяем звонок
      await call.update({
        status: 'cancelled',
        endedAt: new Date()
      });

      // Уведомляем получателя об отмене
      this.io.to(`user:${call.receiverId}`).emit('call:cancelled', {
        callId: data.callId
      });

      // Удаляем из активных звонков
      this.activeCalls.delete(data.callId);

      logger.info(`Call cancelled: ${data.callId}`);

    } catch (error) {
      logger.error('Error cancelling call:', error);
    }
  }

  private handleWebRTCSignal(socket: AuthSocket, data: WebRTCSignalData) {
    if (!socket.userId) return;

    const activeCall = this.activeCalls.get(data.callId);
    if (!activeCall || !activeCall.participants.includes(socket.userId)) return;

    // Переадресуем сигнал другим участникам звонка
    socket.to(`call:${data.callId}`).emit('webrtc:signal', {
      ...data,
      from: socket.userId
    });
  }

  private handleICECandidate(socket: AuthSocket, data: WebRTCSignalData) {
    if (!socket.userId) return;

    const activeCall = this.activeCalls.get(data.callId);
    if (!activeCall || !activeCall.participants.includes(socket.userId)) return;

    // Переадресуем ICE candidate другим участникам
    socket.to(`call:${data.callId}`).emit('webrtc:ice-candidate', {
      ...data,
      from: socket.userId
    });
  }

  private async handleCreateConference(socket: AuthSocket, data: ConferenceData) {
    try {
      if (!socket.userId) return;

      // Проверяем доступ к чату
      const chat = await Chat.findOne({
        where: { id: data.chatId },
        include: [{
          model: User,
          where: { id: socket.userId },
          through: { attributes: [] }
        }]
      });

      if (!chat) {
        socket.emit('call:error', { message: 'Chat not found or access denied' });
        return;
      }

      // Создаем конференц-звонок
      const call = await Call.create({
        callerId: socket.userId,
        chatId: data.chatId,
        callType: data.callType,
        status: 'active',
        isConference: true,
        initiatedAt: new Date(),
        acceptedAt: new Date()
      });

      // Добавляем в активные звонки
      this.activeCalls.set(call.id, {
        participants: [socket.userId],
        callType: data.callType,
        status: 'active'
      });

      socket.join(`call:${call.id}`);

      // Уведомляем всех участников чата о конференции
      this.io.to(`chat:${data.chatId}`).emit('conference:created', {
        callId: call.id,
        creator: {
          id: socket.userId,
          username: socket.user?.username
        },
        callType: data.callType,
        chatId: data.chatId
      });

      socket.emit('conference:created', {
        callId: call.id,
        chatId: data.chatId
      });

      logger.info(`Conference created: ${call.id} in chat ${data.chatId}`);

    } catch (error) {
      logger.error('Error creating conference:', error);
      socket.emit('call:error', { message: 'Failed to create conference' });
    }
  }

  private async handleJoinConference(socket: AuthSocket, data: { callId: string }) {
    try {
      if (!socket.userId) return;

      const call = await Call.findByPk(data.callId);
      if (!call || !call.isConference) {
        socket.emit('call:error', { message: 'Conference not found' });
        return;
      }

      const activeCall = this.activeCalls.get(data.callId);
      if (!activeCall) {
        socket.emit('call:error', { message: 'Conference is not active' });
        return;
      }

      // Проверяем доступ к чату
      if (call.chatId) {
        const chat = await Chat.findOne({
          where: { id: call.chatId },
          include: [{
            model: User,
            where: { id: socket.userId },
            through: { attributes: [] }
          }]
        });

        if (!chat) {
          socket.emit('call:error', { message: 'Access denied' });
          return;
        }
      }

      // Добавляем пользователя к участникам
      if (!activeCall.participants.includes(socket.userId)) {
        activeCall.participants.push(socket.userId);
        this.activeCalls.set(data.callId, activeCall);
      }

      socket.join(`call:${data.callId}`);

      // Уведомляем других участников о присоединении
      socket.to(`call:${data.callId}`).emit('conference:participant-joined', {
        callId: data.callId,
        participant: {
          id: socket.userId,
          username: socket.user?.username,
          avatar: socket.user?.avatar
        }
      });

      // Отправляем текущий список участников новому участнику
      socket.emit('conference:joined', {
        callId: data.callId,
        participants: activeCall.participants
      });

      logger.info(`User ${socket.userId} joined conference ${data.callId}`);

    } catch (error) {
      logger.error('Error joining conference:', error);
      socket.emit('call:error', { message: 'Failed to join conference' });
    }
  }

  private async handleLeaveConference(socket: AuthSocket, data: { callId: string }) {
    try {
      if (!socket.userId) return;

      const activeCall = this.activeCalls.get(data.callId);
      if (!activeCall) return;

      // Удаляем пользователя из участников
      const participantIndex = activeCall.participants.indexOf(socket.userId);
      if (participantIndex > -1) {
        activeCall.participants.splice(participantIndex, 1);
      }

      socket.leave(`call:${data.callId}`);

      // Если участников не осталось, завершаем конференцию
      if (activeCall.participants.length === 0) {
        const call = await Call.findByPk(data.callId);
        if (call) {
          await call.update({
            status: 'ended',
            endedAt: new Date()
          });
        }
        this.activeCalls.delete(data.callId);
      } else {
        this.activeCalls.set(data.callId, activeCall);
        
        // Уведомляем оставшихся участников
        this.io.to(`call:${data.callId}`).emit('conference:participant-left', {
          callId: data.callId,
          participantId: socket.userId
        });
      }

      logger.info(`User ${socket.userId} left conference ${data.callId}`);

    } catch (error) {
      logger.error('Error leaving conference:', error);
    }
  }

  private async handleDisconnect(socket: AuthSocket) {
    if (!socket.userId) return;

    logger.info(`User ${socket.userId} disconnected from call handler`);

    // Завершаем все активные звонки пользователя
    for (const [callId, callData] of this.activeCalls.entries()) {
      if (callData.participants.includes(socket.userId)) {
        await this.handleEndCall(socket, { callId });
      }
    }
  }

  private async handleCallTimeout(callId: string) {
    const activeCall = this.activeCalls.get(callId);
    if (!activeCall || activeCall.status !== 'ringing') return;

    try {
      const call = await Call.findByPk(callId);
      if (call && call.status === 'ringing') {
        await call.update({
          status: 'timeout',
          endedAt: new Date()
        });

        // Уведомляем участников о таймауте
        this.io.to(`user:${call.callerId}`).emit('call:timeout', { callId });
        this.io.to(`user:${call.receiverId}`).emit('call:timeout', { callId });

        // Удаляем из активных звонков
        this.activeCalls.delete(callId);

        logger.info(`Call timeout: ${callId}`);
      }
    } catch (error) {
      logger.error('Error handling call timeout:', error);
    }
  }

  private async isUserInCall(userId: string): Promise<boolean> {
    for (const callData of this.activeCalls.values()) {
      if (callData.participants.includes(userId) && callData.status === 'active') {
        return true;
      }
    }
    return false;
  }

  // Публичные методы для использования из других частей приложения
  public getActiveCall(callId: string) {
    return this.activeCalls.get(callId);
  }

  public getUserCalls(userId: string): string[] {
    const userCalls: string[] = [];
    for (const [callId, callData] of this.activeCalls.entries()) {
      if (callData.participants.includes(userId)) {
        userCalls.push(callId);
      }
    }
    return userCalls;
  }

  public endUserCalls(userId: string) {
    for (const [callId, callData] of this.activeCalls.entries()) {
      if (callData.participants.includes(userId)) {
        this.io.to(`call:${callId}`).emit('call:ended', {
          callId,
          endedBy: userId,
          reason: 'user_disconnected'
        });
        this.activeCalls.delete(callId);
      }
    }
  }
}