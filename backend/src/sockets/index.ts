import { Server } from 'socket.io';
import { createServer } from 'http';
import { Express } from 'express';
import { ChatSocketHandler } from './chatSocket';
import { CallSocketHandler } from './callSocket';
import { VideoSocketHandler } from './videoSocket';
import { ScreenSocketHandler } from './screenSocket';
import { logger } from '../utils/logger';
import { User } from '../models';

interface AuthSocket extends Socket {
  userId?: string;
  user?: User;
}

export class SocketManager {
  private io: Server;
  private chatHandler: ChatSocketHandler;
  private callHandler: CallSocketHandler;
  private videoHandler: VideoSocketHandler;
  private screenHandler: ScreenSocketHandler;

  // Хранилище активных пользователей
  private onlineUsers = new Map<string, {
    socketId: string;
    status: 'online' | 'away' | 'busy' | 'invisible';
    lastSeen: Date;
  }>();

  constructor(app: Express) {
    // Создаем HTTP сервер
    const httpServer = createServer(app);
    
    // Инициализируем Socket.io с настройками CORS
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    // Инициализируем обработчики
    this.initializeHandlers();
    
    // Запускаем глобальные обработчики
    this.setupGlobalHandlers();
    
    logger.info('Socket.io server initialized successfully');
  }

  private initializeHandlers() {
    this.chatHandler = new ChatSocketHandler(this.io);
    this.callHandler = new CallSocketHandler(this.io);
    this.videoHandler = new VideoSocketHandler(this.io);
    this.screenHandler = new ScreenSocketHandler(this.io);
  }

  private setupGlobalHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`Socket connected: ${socket.id}`);

      // Обработчики пользовательского статуса
      socket.on('user:status:set', (data) => this.handleSetUserStatus(socket as AuthSocket, data));
      socket.on('user:status:get', (data) => this.handleGetUserStatus(socket as AuthSocket, data));
      
      // Обработчики уведомлений
      socket.on('notification:mark:read', (data) => this.handleMarkNotificationRead(socket as AuthSocket, data));
      socket.on('notification:mark:all:read', () => this.handleMarkAllNotificationsRead(socket as AuthSocket));
      
      // Ping-pong для поддержания соединения
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // Обработчик подключения аутентифицированного пользователя
      socket.on('user:authenticate', (data) => this.handleUserAuthenticate(socket as AuthSocket, data));

      // Обработчик отключения
      socket.on('disconnect', (reason) => this.handleGlobalDisconnect(socket as AuthSocket, reason));
    });

    // Периодическая очистка неактивных соединений
    setInterval(() => {
      this.cleanupInactiveConnections();
    }, 5 * 60 * 1000); // каждые 5 минут
  }

  private async handleUserAuthenticate(socket: AuthSocket, data: { token: string }) {
    try {
      // Верификация токена уже происходит в middleware
      if (socket.userId) {
        // Обновляем статус пользователя
        this.onlineUsers.set(socket.userId, {
          socketId: socket.id,
          status: 'online',
          lastSeen: new Date()
        });

        // Уведомляем друзей о том, что пользователь онлайн
        await this.notifyFriendsAboutStatus(socket.userId, 'online');

        // Присоединяем к персональной комнате
        socket.join(`user:${socket.userId}`);

        socket.emit('user:authenticated', {
          userId: socket.userId,
          status: 'online'
        });

        logger.info(`User ${socket.userId} authenticated and set online`);
      }
    } catch (error) {
      logger.error('Error authenticating user:', error);
      socket.emit('auth:error', { message: 'Authentication failed' });
    }
  }

  private async handleSetUserStatus(socket: AuthSocket, data: { status: 'online' | 'away' | 'busy' | 'invisible' }) {
    try {
      if (!socket.userId) return;

      const userInfo = this.onlineUsers.get(socket.userId);
      if (userInfo) {
        userInfo.status = data.status;
        userInfo.lastSeen = new Date();
        this.onlineUsers.set(socket.userId, userInfo);

        // Обновляем статус в базе данных
        await User.update(
          { status: data.status, lastSeen: new Date() },
          { where: { id: socket.userId } }
        );

        // Уведомляем друзей об изменении статуса
        if (data.status !== 'invisible') {
          await this.notifyFriendsAboutStatus(socket.userId, data.status);
        }

        socket.emit('user:status:updated', {
          status: data.status,
          timestamp: new Date()
        });
      }
    } catch (error) {
      logger.error('Error setting user status:', error);
    }
  }

  private async handleGetUserStatus(socket: AuthSocket, data: { userId: string }) {
    try {
      const userInfo = this.onlineUsers.get(data.userId);
      const user = await User.findByPk(data.userId, {
        attributes: ['id', 'status', 'lastSeen']
      });

      const status = userInfo ? userInfo.status : (user?.status || 'offline');
      const lastSeen = userInfo ? userInfo.lastSeen : user?.lastSeen;

      socket.emit('user:status:response', {
        userId: data.userId,
        status: status === 'invisible' ? 'offline' : status,
        lastSeen,
        isOnline: !!userInfo
      });
    } catch (error) {
      logger.error('Error getting user status:', error);
    }
  }

  private async handleMarkNotificationRead(socket: AuthSocket, data: { notificationId: string }) {
    try {
      if (!socket.userId) return;

      // Здесь должна быть логика отметки уведомления как прочитанного
      // Это зависит от вашей модели уведомлений

      socket.emit('notification:marked:read', {
        notificationId: data.notificationId
      });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
    }
  }

  private async handleMarkAllNotificationsRead(socket: AuthSocket) {
    try {
      if (!socket.userId) return;

      // Здесь должна быть логика отметки всех уведомлений как прочитанных
      
      socket.emit('notification:all:marked:read');
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
    }
  }

  private async handleGlobalDisconnect(socket: AuthSocket, reason: string) {
    if (socket.userId) {
      logger.info(`User ${socket.userId} disconnected: ${reason}`);

      // Обновляем статус пользователя
      const userInfo = this.onlineUsers.get(socket.userId);
      if (userInfo) {
        userInfo.status = 'offline';
        userInfo.lastSeen = new Date();
        this.onlineUsers.delete(socket.userId);

        // Обновляем в базе данных
        await User.update(
          { status: 'offline', lastSeen: new Date() },
          { where: { id: socket.userId } }
        );

        // Уведомляем друзей об оффлайн статусе
        await this.notifyFriendsAboutStatus(socket.userId, 'offline');
      }
    }

    logger.info(`Socket disconnected: ${socket.id}, reason: ${reason}`);
  }

  private async notifyFriendsAboutStatus(userId: string, status: string) {
    try {
      // Получаем список друзей пользователя
      const user = await User.findByPk(userId, {
        include: [{
          model: User,
          as: 'friends',
          attributes: ['id'],
          through: { attributes: [] }
        }]
      });

      if (user?.friends) {
        // Отправляем уведомления всем друзьям
        for (const friend of user.friends) {
          this.io.to(`user:${friend.id}`).emit('friend:status:changed', {
            userId,
            status,
            timestamp: new Date()
          });
        }
      }
    } catch (error) {
      logger.error('Error notifying friends about status:', error);
    }
  }

  private cleanupInactiveConnections() {
    const now = new Date();
    const timeout = 10 * 60 * 1000; // 10 минут

    for (const [userId, userInfo] of this.onlineUsers.entries()) {
      if (now.getTime() - userInfo.lastSeen.getTime() > timeout) {
        logger.info(`Cleaning up inactive connection for user ${userId}`);
        this.onlineUsers.delete(userId);
      }
    }
  }

  // Публичные методы для взаимодействия с другими частями приложения
  
  /**
   * Отправить сообщение конкретному пользователю
   */
  public sendToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Отправить сообщение в чат
   */
  public sendToChat(chatId: string, event: string, data: any) {
    this.chatHandler.sendMessageToChat(chatId, event, data);
  }

  /**
   * Отправить уведомление пользователю
   */
  public sendNotification(userId: string, notification: any) {
    this.sendToUser(userId, 'notification:new', notification);
  }

  /**
   * Получить список онлайн пользователей
   */
  public getOnlineUsers(): string[] {
    return Array.from(this.onlineUsers.keys());
  }

  /**
   * Проверить, онлайн ли пользователь
   */
  public isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  /**
   * Получить статус пользователя
   */
  public getUserStatus(userId: string) {
    return this.onlineUsers.get(userId);
  }

  /**
   * Принудительно отключить пользователя
   */
  public disconnectUser(userId: string, reason?: string) {
    const userInfo = this.onlineUsers.get(userId);
    if (userInfo) {
      const socket = this.io.sockets.sockets.get(userInfo.socketId);
      if (socket) {
        socket.emit('force:disconnect', { reason: reason || 'Server disconnect' });
        socket.disconnect(true);
      }
    }
  }

  /**
   * Отправить системное сообщение всем пользователям
   */
  public broadcastSystemMessage(message: string, type: 'info' | 'warning' | 'error' = 'info') {
    this.io.emit('system:message', {
      message,
      type,
      timestamp: new Date()
    });
  }

  /**
   * Получить статистику сокетов
   */
  public getSocketStats() {
    return {
      totalConnections: this.io.engine.clientsCount,
      onlineUsers: this.onlineUsers.size,
      rooms: Array.from(this.io.sockets.adapter.rooms.keys())
    };
  }

  /**
   * Завершить звонок принудительно
   */
  public forceEndCall(callId: string, reason?: string) {
    // Используем обработчик звонков для завершения
    const activeCall = this.callHandler.getActiveCall(callId);
    if (activeCall) {
      this.io.to(`call:${callId}`).emit('call:ended', {
        callId,
        reason: reason || 'force_ended',
        endedBy: 'system'
      });
    }
  }

  /**
   * Завершить демонстрацию экрана принудительно
   */
  public forceEndScreenShare(callId: string, reason?: string) {
    this.screenHandler.forceStopScreenShare(callId, reason);
  }

  /**
   * Получить HTTP сервер для запуска
   */
  public getHttpServer() {
    return this.io.httpServer;
  }

  /**
   * Получить экземпляр Socket.io
   */
  public getIO() {
    return this.io;
  }
}

// Экспортируем обработчики для использования в других модулях
export { ChatSocketHandler } from './chatSocket';
export { CallSocketHandler } from './callSocket';
export { VideoSocketHandler } from './videoSocket';
export { ScreenSocketHandler } from './screenSocket';