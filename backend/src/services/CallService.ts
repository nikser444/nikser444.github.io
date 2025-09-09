// backend/src/services/CallService.ts
import { Call } from '../models/Call';
import { User } from '../models/User';
import { Chat } from '../models/Chat';
import { ICall } from '../types/Call';
import { NotificationService } from './NotificationService';

export interface CreateCallData {
  callerId: string;
  calleeId?: string;
  chatId?: string;
  type: 'audio' | 'video' | 'screen' | 'conference';
  isGroupCall?: boolean;
}

export interface CallParticipant {
  id: string;
  username: string;
  avatar?: string;
  isOnline: boolean;
  joinedAt?: Date;
  leftAt?: Date;
  isMuted?: boolean;
  isCameraOff?: boolean;
  isScreenSharing?: boolean;
}

export interface CallWithParticipants extends ICall {
  participants: CallParticipant[];
  caller: CallParticipant;
  callee?: CallParticipant;
}

export interface CallStats {
  totalCalls: number;
  activeCalls: number;
  averageDuration: number;
  popularType: 'audio' | 'video' | 'screen' | 'conference';
}

export class CallService {
  private static activeCallParticipants = new Map<string, Set<string>>();
  private static callTimers = new Map<string, NodeJS.Timeout>();

  static async initiateCall(data: CreateCallData): Promise<CallWithParticipants> {
    const { callerId, calleeId, chatId, type, isGroupCall = false } = data;

    // Проверяем существование вызывающего пользователя
    const caller = await User.findById(callerId);
    if (!caller) {
      throw new Error('Пользователь не найден');
    }

    let participants: string[] = [callerId];
    let targetChatId = chatId;

    if (isGroupCall || type === 'conference') {
      // Групповой звонок
      if (!chatId) {
        throw new Error('Для группового звонка необходим chatId');
      }

      const chat = await Chat.findById(chatId);
      if (!chat) {
        throw new Error('Чат не найден');
      }

      // Проверяем, что пользователь является участником чата
      const isMember = await Chat.isMember(chatId, callerId);
      if (!isMember) {
        throw new Error('Вы не являетесь участником этого чата');
      }

      // Получаем всех участников чата
      const chatMembers = await Chat.getMembers(chatId);
      participants = chatMembers.map(m => m.id);

    } else {
      // Приватный звонок
      if (!calleeId) {
        throw new Error('Для приватного звонка необходим calleeId');
      }

      const callee = await User.findById(calleeId);
      if (!callee) {
        throw new Error('Получатель звонка не найден');
      }

      participants = [callerId, calleeId];

      // Создаем или находим приватный чат
      let privateChat = await Chat.findPrivateChat(callerId, calleeId);
      if (!privateChat) {
        privateChat = await Chat.create({
          name: `${caller.username}, ${callee.username}`,
          type: 'private',
          createdBy: callerId,
        });
        await Chat.addMembers(privateChat.id, [callerId, calleeId], callerId);
      }
      targetChatId = privateChat.id;
    }

    // Проверяем, нет ли активных звонков у участников
    const activeCall = await this.checkActiveCall(participants);
    if (activeCall) {
      throw new Error('Один из участников уже участвует в звонке');
    }

    // Создаем звонок
    const call = await Call.create({
      callerId,
      calleeId,
      chatId: targetChatId,
      type,
      status: 'initiating',
      startedAt: new Date(),
    });

    // Добавляем участников к звонку
    await Call.addParticipants(call.id, participants);

    // Отправляем уведомления участникам
    await this.notifyCallParticipants(call.id, 'incoming', callerId);

    // Устанавливаем таймер для автоматического завершения неотвеченного звонка
    this.setCallTimeout(call.id);

    return this.getCallWithParticipants(call.id);
  }

  static async acceptCall(callId: string, userId: string): Promise<CallWithParticipants> {
    const call = await Call.findById(callId);
    if (!call) {
      throw new Error('Звонок не найден');
    }

    // Проверяем, что пользователь является участником звонка
    const isParticipant = await Call.isParticipant(callId, userId);
    if (!isParticipant) {
      throw new Error('Вы не являетесь участником этого звонка');
    }

    // Проверяем статус звонка
    if (call.status !== 'initiating' && call.status !== 'ringing') {
      throw new Error('Звонок нельзя принять в текущем статусе');
    }

    // Принимаем звонок
    await Call.update(callId, {
      status: 'active',
      answeredAt: new Date(),
    });

    // Отмечаем участника как присоединившегося
    await Call.updateParticipant(callId, userId, {
      joinedAt: new Date(),
      status: 'joined',
    });

    // Очищаем таймер
    this.clearCallTimeout(callId);

    // Уведомляем других участников о принятии звонка
    await this.notifyCallParticipants(callId, 'accepted', userId);

    return this.getCallWithParticipants(callId);
  }

  static async declineCall(callId: string, userId: string, reason?: string): Promise<void> {
    const call = await Call.findById(callId);
    if (!call) {
      throw new Error('Звонок не найден');
    }

    // Проверяем, что пользователь является участником звонка
    const isParticipant = await Call.isParticipant(callId, userId);
    if (!isParticipant) {
      throw new Error('Вы не являетесь участником этого звонка');
    }

    // Для приватного звонка отклонение завершает весь звонок
    if (!call.isGroupCall) {
      await Call.update(callId, {
        status: 'declined',
        endedAt: new Date(),
        endReason: reason || 'declined',
      });
    } else {
      // Для группового звонка просто помечаем участника как отклонившего
      await Call.updateParticipant(callId, userId, {
        status: 'declined',
        leftAt: new Date(),
      });
    }

    // Очищаем таймер
    this.clearCallTimeout(callId);

    // Уведомляем участников об отклонении
    await this.notifyCallParticipants(callId, 'declined', userId);
  }

  static async endCall(callId: string, userId: string): Promise<void> {
    const call = await Call.findById(callId);
    if (!call) {
      throw new Error('Звонок не найден');
    }

    // Проверяем, что пользователь является участником звонка
    const isParticipant = await Call.isParticipant(callId, userId);
    if (!isParticipant) {
      throw new Error('Вы не являетесь участником этого звонка');
    }

    // Завершаем звонок
    await Call.update(callId, {
      status: 'ended',
      endedAt: new Date(),
      endReason: 'ended_by_user',
    });

    // Помечаем всех активных участников как покинувших звонок
    await Call.updateAllParticipants(callId, {
      leftAt: new Date(),
      status: 'left',
    });

    // Очищаем таймер
    this.clearCallTimeout(callId);

    // Убираем участников из активных звонков
    this.activeCallParticipants.delete(callId);

    // Уведомляем участников о завершении звонка
    await this.notifyCallParticipants(callId, 'ended', userId);
  }

  static async joinCall(callId: string, userId: string): Promise<CallWithParticipants> {
    const call = await Call.findById(callId);
    if (!call) {
      throw new Error('Звонок не найден');
    }

    // Проверяем статус звонка
    if (call.status !== 'active') {
      throw new Error('Звонок не активен');
    }

    // Для групповых звонков разрешаем присоединение
    if (call.isGroupCall || call.type === 'conference') {
      // Проверяем, что пользователь является участником чата
      if (call.chatId) {
        const isMember = await Chat.isMember(call.chatId, userId);
        if (!isMember) {
          throw new Error('Вы не являетесь участником этого чата');
        }
      }

      // Добавляем участника, если его еще нет
      const isParticipant = await Call.isParticipant(callId, userId);
      if (!isParticipant) {
        await Call.addParticipants(callId, [userId]);
      }

      // Отмечаем участника как присоединившегося
      await Call.updateParticipant(callId, userId, {
        joinedAt: new Date(),
        status: 'joined',
      });

      // Добавляем к активным участникам
      if (!this.activeCallParticipants.has(callId)) {
        this.activeCallParticipants.set(callId, new Set());
      }
      this.activeCallParticipants.get(callId)?.add(userId);

      // Уведомляем других участников
      await this.notifyCallParticipants(callId, 'joined', userId);

      return this.getCallWithParticipants(callId);
    }

    throw new Error('Нельзя присоединиться к приватному звонку');
  }

  static async leaveCall(callId: string, userId: string): Promise<void> {
    const call = await Call.findById(callId);
    if (!call) {
      throw new Error('Звонок не найден');
    }

    // Отмечаем участника как покинувшего звонок
    await Call.updateParticipant(callId, userId, {
      leftAt: new Date(),
      status: 'left',
    });

    // Убираем из активных участников
    this.activeCallParticipants.get(callId)?.delete(userId);

    // Проверяем, остались ли активные участники
    const activeParticipants = await Call.getActiveParticipants(callId);
    if (activeParticipants.length <= 1) {
      // Если участников 1 или меньше, завершаем звонок
      await Call.update(callId, {
        status: 'ended',
        endedAt: new Date(),
        endReason: 'no_participants',
      });
      
      this.activeCallParticipants.delete(callId);
      this.clearCallTimeout(callId);
    }

    // Уведомляем участников
    await this.notifyCallParticipants(callId, 'left', userId);
  }

  static async updateParticipantStatus(
    callId: string,
    userId: string,
    status: {
      isMuted?: boolean;
      isCameraOff?: boolean;
      isScreenSharing?: boolean;
    }
  ): Promise<void> {
    await Call.updateParticipant(callId, userId, status);
    
    // Уведомляем других участников об изменении статуса
    await this.notifyCallParticipants(callId, 'status_updated', userId, status);
  }

  static async getActiveCall(userId: string): Promise<CallWithParticipants | null> {
    const call = await Call.findActiveCallByUser(userId);
    if (!call) {
      return null;
    }

    return this.getCallWithParticipants(call.id);
  }

  static async getUserCallHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<CallWithParticipants[]> {
    const calls = await Call.findUserCalls(userId, limit, offset);
    const callsWithParticipants: CallWithParticipants[] = [];

    for (const call of calls) {
      const callWithParticipants = await this.getCallWithParticipants(call.id);
      callsWithParticipants.push(callWithParticipants);
    }

    return callsWithParticipants;
  }

  static async getCallStats(userId?: string): Promise<CallStats> {
    return Call.getCallStats(userId);
  }

  // Приватные методы
  private static async getCallWithParticipants(callId: string): Promise<CallWithParticipants> {
    const call = await Call.findById(callId);
    if (!call) {
      throw new Error('Звонок не найден');
    }

    const participants = await Call.getParticipants(callId);
    const caller = participants.find(p => p.id === call.callerId);
    const callee = participants.find(p => p.id === call.calleeId);

    return {
      ...call,
      participants,
      caller: caller!,
      callee,
    };
  }

  private static async checkActiveCall(userIds: string[]): Promise<boolean> {
    for (const userId of userIds) {
      const activeCall = await Call.findActiveCallByUser(userId);
      if (activeCall) {
        return true;
      }
    }
    return false;
  }

  private static async notifyCallParticipants(
    callId: string,
    action: 'incoming' | 'accepted' | 'declined' | 'ended' | 'joined' | 'left' | 'status_updated',
    fromUserId: string,
    data?: any
  ): Promise<void> {
    const call = await Call.findById(callId);
    if (!call) return;

    const participants = await Call.getParticipants(callId);
    const fromUser = await User.findById(fromUserId);

    for (const participant of participants) {
      if (participant.id === fromUserId) continue;

      let title = '';
      let message = '';

      switch (action) {
        case 'incoming':
          title = call.type === 'video' ? 'Входящий видеозвонок' : 'Входящий звонок';
          message = `${fromUser?.username} звонит вам`;
          break;
        case 'accepted':
          title = 'Звонок принят';
          message = `${fromUser?.username} принял звонок`;
          break;
        case 'declined':
          title = 'Звонок отклонен';
          message = `${fromUser?.username} отклонил звонок`;
          break;
        case 'ended':
          title = 'Звонок завершен';
          message = `Звонок завершен`;
          break;
        case 'joined':
          title = 'Участник присоединился';
          message = `${fromUser?.username} присоединился к звонку`;
          break;
        case 'left':
          title = 'Участник покинул звонок';
          message = `${fromUser?.username} покинул звонок`;
          break;
      }

      await NotificationService.sendNotification(participant.id, {
        type: 'call',
        title,
        message,
        data: {
          callId,
          action,
          fromUserId,
          ...data,
        },
      });
    }
  }

  private static setCallTimeout(callId: string): void {
    // Устанавливаем таймер на 30 секунд для неотвеченного звонка
    const timeout = setTimeout(async () => {
      const call = await Call.findById(callId);
      if (call && (call.status === 'initiating' || call.status === 'ringing')) {
        await Call.update(callId, {
          status: 'missed',
          endedAt: new Date(),
          endReason: 'timeout',
        });

        await this.notifyCallParticipants(callId, 'ended', call.callerId);
      }
      this.callTimers.delete(callId);
    }, 30000);

    this.callTimers.set(callId, timeout);
  }

  private static clearCallTimeout(callId: string): void {
    const timeout = this.callTimers.get(callId);
    if (timeout) {
      clearTimeout(timeout);
      this.callTimers.delete(callId);
    }
  }
}