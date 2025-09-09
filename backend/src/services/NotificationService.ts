// backend/src/services/NotificationService.ts
import { EventEmitter } from 'events';
import { User } from '../models/User';
import { EmailService } from './EmailService';

export interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'call' | 'friend_request' | 'chat' | 'system';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationData {
  type: 'message' | 'call' | 'friend_request' | 'chat' | 'system';
  title: string;
  message: string;
  data?: any;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundNotifications: boolean;
  messageNotifications: boolean;
  callNotifications: boolean;
  friendRequestNotifications: boolean;
  groupInviteNotifications: boolean;
}

export class NotificationService extends EventEmitter {
  private static instance: NotificationService;
  private static notifications = new Map<string, Notification[]>();
  private static userSockets = new Map<string, Set<string>>();

  constructor() {
    super();
  }

  static getInstance(): NotificationService {
    if (!this.instance) {
      this.instance = new NotificationService();
    }
    return this.instance;
  }

  static async sendNotification(userId: string, data: NotificationData): Promise<void> {
    const notification: Notification = {
      id: this.generateId(),
      userId,
      ...data,
      isRead: false,
      createdAt: new Date(),
    };

    // Сохраняем уведомление в памяти (в реальном проекте - в БД)
    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }
    
    const userNotifications = this.notifications.get(userId)!;
    userNotifications.unshift(notification);

    // Ограничиваем количество уведомлений до 100
    if (userNotifications.length > 100) {
      userNotifications.splice(100);
    }

    // Получаем настройки уведомлений пользователя
    const settings = await this.getUserNotificationSettings(userId);
    
    // Отправляем в реальном времени через WebSocket
    this.sendRealTimeNotification(userId, notification);

    // Отправляем email уведомление, если включено
    if (settings.emailNotifications && this.shouldSendEmail(data.type, settings)) {
      await this.sendEmailNotification(userId, notification);
    }

    // Эмитим событие для других сервисов
    this.getInstance().emit('notification:sent', { userId, notification });
  }

  static async getUserNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    const userNotifications = this.notifications.get(userId) || [];
    
    let filtered = userNotifications;
    if (unreadOnly) {
      filtered = userNotifications.filter(n => !n.isRead);
    }

    return filtered.slice(offset, offset + limit);
  }

  static async markAsRead(userId: string, notificationIds: string[]): Promise<void> {
    const userNotifications = this.notifications.get(userId);
    if (!userNotifications) return;

    for (const notification of userNotifications) {
      if (notificationIds.includes(notification.id)) {
        notification.isRead = true;
      }
    }

    // Эмитим событие об обновлении
    this.getInstance().emit('notification:updated', { userId, notificationIds });
  }

  static async markAllAsRead(userId: string): Promise<void> {
    const userNotifications = this.notifications.get(userId);
    if (!userNotifications) return;

    for (const notification of userNotifications) {
      notification.isRead = true;
    }

    // Эмитим событие об обновлении
    this.getInstance().emit('notification:all_read', { userId });
  }

  static async deleteNotification(userId: string, notificationId: string): Promise<void> {
    const userNotifications = this.notifications.get(userId);
    if (!userNotifications) return;

    const index = userNotifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      userNotifications.splice(index, 1);
    }

    // Эмитим событие об удалении
    this.getInstance().emit('notification:deleted', { userId, notificationId });
  }

  static async clearAllNotifications(userId: string): Promise<void> {
    this.notifications.set(userId, []);

    // Эмитим событие об очистке
    this.getInstance().emit('notification:cleared', { userId });
  }

  static async getUnreadCount(userId: string): Promise<number> {
    const userNotifications = this.notifications.get(userId) || [];
    return userNotifications.filter(n => !n.isRead).length;
  }

  static async getUserNotificationSettings(userId: string): Promise<NotificationSettings> {
    // В реальном проекте настройки хранятся в БД
    // Здесь используем настройки по умолчанию
    return {
      emailNotifications: true,
      pushNotifications: true,
      soundNotifications: true,
      messageNotifications: true,
      callNotifications: true,
      friendRequestNotifications: true,
      groupInviteNotifications: true,
    };
  }

  static async updateNotificationSettings(
    userId: string,
    settings: Partial<NotificationSettings>
  ): Promise<NotificationSettings> {
    // В реальном проекте обновляем настройки в БД
    const currentSettings = await this.getUserNotificationSettings(userId);
    const updatedSettings = { ...currentSettings, ...settings };

    // Эмитим событие об обновлении настроек
    this.getInstance().emit('notification:settings_updated', { userId, settings: updatedSettings });

    return updatedSettings;
  }

  // WebSocket методы
  static registerUserSocket(userId: string, socketId: string): void {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
  }

  static unregisterUserSocket(userId: string, socketId: string): void {
    const userSocketIds = this.userSockets.get(userId);
    if (userSocketIds) {
      userSocketIds.delete(socketId);
      if (userSocketIds.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  private static sendRealTimeNotification(userId: string, notification: Notification): void {
    const socketIds = this.userSockets.get(userId);
    if (socketIds) {
      // Эмитим событие для отправки через WebSocket
      this.getInstance().emit('notification:realtime', {
        userId,
        socketIds: Array.from(socketIds),
        notification,
      });
    }
  }

  private static async sendEmailNotification(
    userId: string,
    notification: Notification
  ): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user || !user.email) return;

      let subject = notification.title;
      let htmlContent = this.generateEmailTemplate(notification);

      await EmailService.sendEmail({
        to: user.email,
        subject,
        html: htmlContent,
        text: notification.message,
      });
    } catch (error) {
      console.error('Ошибка отправки email уведомления:', error);
    }
  }

  private static shouldSendEmail(type: string, settings: NotificationSettings): boolean {
    switch (type) {
      case 'message':
        return settings.messageNotifications;
      case 'call':
        return settings.callNotifications;
      case 'friend_request':
        return settings.friendRequestNotifications;
      case 'chat':
        return settings.groupInviteNotifications;
      case 'system':
        return true;
      default:
        return false;
    }
  }

  private static generateEmailTemplate(notification: Notification): string {
    const iconMap = {
      message: '💬',
      call: '📞',
      friend_request: '👥',
      chat: '💬',
      system: '⚙️',
    };

    const icon = iconMap[notification.type] || '📢';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${notification.title}</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4f46e5; margin: 0;">${icon} ${notification.title}</h1>
            </div>
            
            <div style="margin-bottom: 30px;">
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                ${notification.message}
              </p>
              
              <div style="background-color: #f9fafb; border-left: 4px solid #4f46e5; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #6b7280;">
                  <strong>Время:</strong> ${notification.createdAt.toLocaleString('ru-RU')}
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="font-size: 14px; color: #9ca3af;">
                Войдите в приложение, чтобы ответить
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private static generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Специализированные методы для разных типов уведомлений
  static async sendMessageNotification(
    userId: string,
    fromUsername: string,
    message: string,
    chatName?: string
  ): Promise<void> {
    const title = chatName ? `Новое сообщение в ${chatName}` : `Сообщение от ${fromUsername}`;
    const truncatedMessage = message.length > 100 ? message.substring(0, 100) + '...' : message;

    await this.sendNotification(userId, {
      type: 'message',
      title,
      message: `${fromUsername}: ${truncatedMessage}`,
      data: {
        fromUsername,
        chatName,
        originalMessage: message,
      },
    });
  }

  static async sendCallNotification(
    userId: string,
    fromUsername: string,
    callType: 'audio' | 'video',
    callId: string
  ): Promise<void> {
    const title = callType === 'video' ? 'Входящий видеозвонок' : 'Входящий звонок';
    const message = `${fromUsername} звонит вам`;

    await this.sendNotification(userId, {
      type: 'call',
      title,
      message,
      data: {
        fromUsername,
        callType,
        callId,
      },
    });
  }

  static async sendFriendRequestNotification(
    userId: string,
    fromUsername: string,
    requestId: string
  ): Promise<void> {
    await this.sendNotification(userId, {
      type: 'friend_request',
      title: 'Новая заявка в друзья',
      message: `${fromUsername} хочет добавить вас в друзья`,
      data: {
        fromUsername,
        requestId,
      },
    });
  }

  static async sendGroupInviteNotification(
    userId: string,
    fromUsername: string,
    groupName: string,
    chatId: string
  ): Promise<void> {
    await this.sendNotification(userId, {
      type: 'chat',
      title: 'Приглашение в группу',
      message: `${fromUsername} пригласил вас в группу "${groupName}"`,
      data: {
        fromUsername,
        groupName,
        chatId,
      },
    });
  }

  static async sendSystemNotification(
    userId: string,
    title: string,
    message: string,
    data?: any
  ): Promise<void> {
    await this.sendNotification(userId, {
      type: 'system',
      title,
      message,
      data,
    });
  }

  // Массовые уведомления
  static async sendBulkNotification(
    userIds: string[],
    data: NotificationData
  ): Promise<void> {
    const promises = userIds.map(userId => this.sendNotification(userId, data));
    await Promise.all(promises);
  }

  static async sendBroadcastNotification(data: NotificationData): Promise<void> {
    // Получаем всех пользователей (в реальном проекте с пагинацией)
    const allUsers = await User.findAll();
    const userIds = allUsers.map(user => user.id);
    
    await this.sendBulkNotification(userIds, data);
  }
}