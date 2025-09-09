import { Express } from 'express';
import { SocketManager } from './index';
import { logger } from '../utils/logger';

// Глобальная переменная для менеджера сокетов
let socketManager: SocketManager | null = null;

/**
 * Инициализация Socket.io с Express приложением
 */
export function initializeSocketIO(app: Express): SocketManager {
  try {
    if (socketManager) {
      logger.warn('Socket.io already initialized');
      return socketManager;
    }

    socketManager = new SocketManager(app);
    logger.info('Socket.io initialized successfully');
    
    return socketManager;
  } catch (error) {
    logger.error('Failed to initialize Socket.io:', error);
    throw error;
  }
}

/**
 * Получить экземпляр менеджера сокетов
 */
export function getSocketManager(): SocketManager {
  if (!socketManager) {
    throw new Error('Socket.io not initialized. Call initializeSocketIO first.');
  }
  return socketManager;
}

/**
 * Закрыть все сокет-соединения
 */
export function closeSocketIO(): void {
  if (socketManager) {
    socketManager.getIO().close();
    socketManager = null;
    logger.info('Socket.io closed');
  }
}

/**
 * Middleware для добавления socketManager к объекту запроса
 */
export function attachSocketManager(req: any, res: any, next: any) {
  req.socketManager = socketManager;
  next();
}

// События для интеграции с другими сервисами
export const SocketEvents = {
  // Чат события
  CHAT: {
    MESSAGE_SEND: 'message:send',
    MESSAGE_RECEIVE: 'message:receive',
    MESSAGE_READ: 'message:read',
    MESSAGE_EDIT: 'message:edit',
    MESSAGE_DELETE: 'message:delete',
    TYPING_START: 'typing:start',
    TYPING_STOP: 'typing:stop',
    CHAT_JOIN: 'chat:join',
    CHAT_LEAVE: 'chat:leave'
  },

  // События звонков
  CALL: {
    INITIATE: 'call:initiate',
    INCOMING: 'call:incoming',
    ACCEPT: 'call:accept',
    DECLINE: 'call:decline',
    END: 'call:end',
    CANCEL: 'call:cancel',
    TIMEOUT: 'call:timeout'
  },

  // События видео
  VIDEO: {
    STREAM_START: 'video:stream:start',
    STREAM_STOP: 'video:stream:stop',
    CONTROL_TOGGLE: 'video:control:toggle',
    QUALITY_CHANGE: 'video:quality:change',
    OFFER: 'video:offer',
    ANSWER: 'video:answer',
    ICE_CANDIDATE: 'video:ice-candidate'
  },

  // События демонстрации экрана
  SCREEN: {
    SHARE_START: 'screen:share:start',
    SHARE_STOP: 'screen:share:stop',
    CONTROL: 'screen:share:control',
    REMOTE_REQUEST: 'screen:remote:request',
    REMOTE_GRANT: 'screen:remote:grant',
    ANNOTATION_ADD: 'screen:annotation:add',
    ANNOTATION_REMOVE: 'screen:annotation:remove'
  },

  // Пользовательские события
  USER: {
    AUTHENTICATE: 'user:authenticate',
    STATUS_SET: 'user:status:set',
    STATUS_GET: 'user:status:get',
    ONLINE: 'user:online',
    OFFLINE: 'user:offline'
  },

  // Системные события
  SYSTEM: {
    ERROR: 'error',
    DISCONNECT: 'disconnect',
    RECONNECT: 'reconnect',
    PING: 'ping',
    PONG: 'pong'
  },

  // Уведомления
  NOTIFICATION: {
    NEW: 'notification:new',
    MARK_READ: 'notification:mark:read',
    MARK_ALL_READ: 'notification:mark:all:read'
  }
};

/**
 * Типы для TypeScript
 */
export interface SocketResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'video';
  createdAt: Date;
  editedAt?: Date;
  replyTo?: string;
  attachments?: Array<{
    type: string;
    url: string;
    name: string;
    size: number;
  }>;
}

export interface CallData {
  id: string;
  callerId: string;
  receiverId?: string;
  chatId?: string;
  callType: 'audio' | 'video';
  status: 'ringing' | 'active' | 'ended' | 'declined' | 'cancelled';
  isConference: boolean;
  initiatedAt: Date;
  acceptedAt?: Date;
  endedAt?: Date;
}

export interface UserStatus {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'invisible' | 'offline';
  lastSeen: Date;
  isOnline: boolean;
}

export interface VideoStreamInfo {
  userId: string;
  hasVideo: boolean;
  hasAudio: boolean;
  quality: 'low' | 'medium' | 'high' | 'hd';
}

export interface ScreenShareInfo {
  callId: string;
  presenter: string;
  hasAudio: boolean;
  quality: string;
  isActive: boolean;
  permissions: {
    remoteControl: boolean;
    annotations: boolean;
  };
}

export interface NotificationData {
  id: string;
  userId: string;
  type: 'message' | 'call' | 'friend_request' | 'system';
  title: string;
  content: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

/**
 * Утилиты для работы с сокетами
 */
export class SocketUtils {
  private static manager: SocketManager | null = null;

  static setManager(manager: SocketManager) {
    this.manager = manager;
  }

  /**
   * Отправить сообщение в чат через сокеты
   */
  static async sendChatMessage(chatId: string, message: ChatMessage) {
    if (!this.manager) return false;
    
    try {
      this.manager.sendToChat(chatId, SocketEvents.CHAT.MESSAGE_RECEIVE, {
        message,
        chatId
      });
      return true;
    } catch (error) {
      logger.error('Error sending chat message via socket:', error);
      return false;
    }
  }

  /**
   * Уведомить пользователя о входящем звонке
   */
  static async notifyIncomingCall(userId: string, callData: CallData, caller: any) {
    if (!this.manager) return false;

    try {
      this.manager.sendToUser(userId, SocketEvents.CALL.INCOMING, {
        callId: callData.id,
        caller: {
          id: caller.id,
          username: caller.username,
          avatar: caller.avatar
        },
        callType: callData.callType,
        chatId: callData.chatId
      });
      return true;
    } catch (error) {
      logger.error('Error notifying incoming call:', error);
      return false;
    }
  }

  /**
   * Отправить уведомление пользователю
   */
  static async sendNotification(userId: string, notification: NotificationData) {
    if (!this.manager) return false;

    try {
      this.manager.sendNotification(userId, notification);
      return true;
    } catch (error) {
      logger.error('Error sending notification:', error);
      return false;
    }
  }

  /**
   * Обновить статус пользователя для всех друзей
   */
  static async updateUserStatusForFriends(userId: string, status: string) {
    if (!this.manager) return false;

    try {
      // Логика получения друзей и отправки им обновления статуса
      // должна быть реализована здесь
      return true;
    } catch (error) {
      logger.error('Error updating user status for friends:', error);
      return false;
    }
  }

  /**
   * Принудительно завершить звонок
   */
  static async forceEndCall(callId: string, reason?: string) {
    if (!this.manager) return false;

    try {
      this.manager.forceEndCall(callId, reason);
      return true;
    } catch (error) {
      logger.error('Error force ending call:', error);
      return false;
    }
  }

  /**
   * Получить статистику сокетов
   */
  static getStats() {
    if (!this.manager) return null;
    return this.manager.getSocketStats();
  }

  /**
   * Проверить, онлайн ли пользователь
   */
  static isUserOnline(userId: string): boolean {
    if (!this.manager) return false;
    return this.manager.isUserOnline(userId);
  }

  /**
   * Отправить системное сообщение всем пользователям
   */
  static broadcastSystemMessage(message: string, type: 'info' | 'warning' | 'error' = 'info') {
    if (!this.manager) return false;

    try {
      this.manager.broadcastSystemMessage(message, type);
      return true;
    } catch (error) {
      logger.error('Error broadcasting system message:', error);
      return false;
    }
  }
}

/**
 * Декоратор для методов, которые требуют активное сокет-соединение
 */
export function requireSocket(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;

  descriptor.value = function (...args: any[]) {
    if (!socketManager) {
      throw new Error('Socket.io not initialized');
    }
    return method.apply(this, args);
  };
}

/**
 * Валидаторы для сокет-событий
 */
export class SocketValidators {
  static validateChatMessage(data: any): boolean {
    return !!(
      data &&
      typeof data.chatId === 'string' &&
      typeof data.content === 'string' &&
      data.content.trim().length > 0
    );
  }

  static validateCallInitiate(data: any): boolean {
    return !!(
      data &&
      typeof data.receiverId === 'string' &&
      ['audio', 'video'].includes(data.callType)
    );
  }

  static validateUserStatus(data: any): boolean {
    return !!(
      data &&
      ['online', 'away', 'busy', 'invisible'].includes(data.status)
    );
  }

  static validateScreenShare(data: any): boolean {
    return !!(
      data &&
      typeof data.callId === 'string' &&
      typeof data.hasAudio === 'boolean'
    );
  }
}

/**
 * Константы для конфигурации сокетов
 */
export const SocketConfig = {
  TIMEOUTS: {
    CALL_TIMEOUT: 60 * 1000, // 60 секунд
    TYPING_TIMEOUT: 3 * 1000, // 3 секунды
    RECONNECT_TIMEOUT: 5 * 1000, // 5 секунд
    PING_INTERVAL: 25 * 1000, // 25 секунд
    PING_TIMEOUT: 60 * 1000 // 60 секунд
  },
  
  LIMITS: {
    MAX_MESSAGE_LENGTH: 4096,
    MAX_CONCURRENT_CALLS: 5,
    MAX_CONFERENCE_PARTICIPANTS: 50,
    MAX_FILE_SIZE: 100 * 1024 * 1024 // 100MB
  },

  ROOMS: {
    USER: (userId: string) => `user:${userId}`,
    CHAT: (chatId: string) => `chat:${chatId}`,
    CALL: (callId: string) => `call:${callId}`,
    VIDEO: (callId: string) => `video:${callId}`,
    SCREEN: (callId: string) => `screen:${callId}`
  }
};

/**
 * Хелпер для создания стандартных ответов сокетов
 */
export class SocketResponseHelper {
  static success<T>(data?: T): SocketResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date()
    };
  }

  static error(error: string): SocketResponse {
    return {
      success: false,
      error,
      timestamp: new Date()
    };
  }

  static withData<T>(data: T): SocketResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date()
    };
  }
}

// Экспорт для использования в других модулях
export default {
  initializeSocketIO,
  getSocketManager,
  closeSocketIO,
  attachSocketManager,
  SocketEvents,
  SocketUtils,
  SocketValidators,
  SocketConfig,
  SocketResponseHelper
};