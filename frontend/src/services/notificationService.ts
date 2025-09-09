// frontend/src/services/notificationService.ts
import { api } from './api';
import { ApiResponse } from '../types/api';

export interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'friend_request' | 'call' | 'system' | 'chat_invite';
  title: string;
  content: string;
  data?: Record<string, any>;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  type?: string;
  isRead?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  startDate?: Date;
  endDate?: Date;
}

export interface CreateNotificationData {
  type: 'message' | 'friend_request' | 'call' | 'system' | 'chat_invite';
  title: string;
  content: string;
  data?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  expiresAt?: Date;
  userId?: string; // Для отправки другому пользователю (админ функция)
}

export interface NotificationSettings {
  desktop: boolean;
  sound: boolean;
  email: boolean;
  push: boolean;
  types: {
    messages: boolean;
    friendRequests: boolean;
    calls: boolean;
    system: boolean;
    chatInvites: boolean;
  };
  schedule: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string;   // HH:MM format
    timezone: string;
  };
}

class NotificationService {
  private readonly ENDPOINTS = {
    NOTIFICATIONS: '/notifications',
    MARK_READ: '/notifications/mark-read',
    MARK_ALL_READ: '/notifications/mark-all-read',
    DELETE: '/notifications',
    SETTINGS: '/notifications/settings',
    COUNT: '/notifications/count',
    SUBSCRIBE_PUSH: '/notifications/push/subscribe',
    UNSUBSCRIBE_PUSH: '/notifications/push/unsubscribe',
  };

  private notificationPermission: NotificationPermission = 'default';
  private soundEnabled = true;
  private notificationSound: HTMLAudioElement | null = null;

  constructor() {
    this.initializeNotificationSound();
    this.checkNotificationPermission();
  }

  // === Инициализация ===

  private initializeNotificationSound(): void {
    try {
      this.notificationSound = new Audio('/sounds/notification.mp3');
      this.notificationSound.volume = 0.5;
    } catch (error) {
      console.error('Failed to initialize notification sound:', error);
    }
  }

  private checkNotificationPermission(): void {
    if ('Notification' in window) {
      this.notificationPermission = Notification.permission;
    }
  }

  // === Управление уведомлениями ===

  // Получение уведомлений
  async getNotifications(params: GetNotificationsParams = {}): Promise<Notification[]> {
    try {
      const url = api.createUrlWithParams(this.ENDPOINTS.NOTIFICATIONS, {
        page: params.page,
        limit: params.limit,
        type: params.type,
        isRead: params.isRead,
        priority: params.priority,
        startDate: params.startDate?.toISOString(),
        endDate: params.endDate?.toISOString(),
      });

      const response = await api.get<Notification[]>(url);
      
      if (response.success && response.data) {
        return response.data.map(notification => ({
          ...notification,
          createdAt: new Date(notification.createdAt),
          readAt: notification.readAt ? new Date(notification.readAt) : undefined,
          expiresAt: notification.expiresAt ? new Date(notification.expiresAt) : undefined,
        }));
      }
      
      throw new Error(response.message || 'Ошибка получения уведомлений');
    } catch (error) {
      console.error('Get notifications error:', error);
      throw error;
    }
  }

  // Получение непрочитанных уведомлений
  async getUnreadNotifications(): Promise<Notification[]> {
    try {
      return await this.getNotifications({ isRead: false });
    } catch (error) {
      console.error('Get unread notifications error:', error);
      throw error;
    }
  }

  // Создание уведомления
  async createNotification(data: CreateNotificationData): Promise<Notification> {
    try {
      const response = await api.post<Notification>(this.ENDPOINTS.NOTIFICATIONS, {
        ...data,
        expiresAt: data.expiresAt?.toISOString(),
      });
      
      if (response.success && response.data) {
        const notification = {
          ...response.data,
          createdAt: new Date(response.data.createdAt),
          readAt: response.data.readAt ? new Date(response.data.readAt) : undefined,
          expiresAt: response.data.expiresAt ? new Date(response.data.expiresAt) : undefined,
        };

        // Показываем локальное уведомление
        this.showLocalNotification(notification);

        return notification;
      }
      
      throw new Error(response.message || 'Ошибка создания уведомления');
    } catch (error) {
      console.error('Create notification error:', error);
      throw error;
    }
  }

  // Отметка уведомления как прочитанного
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const response = await api.post(`${this.ENDPOINTS.MARK_READ}/${notificationId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка отметки уведомления');
      }
    } catch (error) {
      console.error('Mark as read error:', error);
      throw error;
    }
  }

  // Отметка нескольких уведомлений как прочитанных
  async markMultipleAsRead(notificationIds: string[]): Promise<void> {
    try {
      const response = await api.post(this.ENDPOINTS.MARK_READ, { notificationIds });
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка отметки уведомлений');
      }
    } catch (error) {
      console.error('Mark multiple as read error:', error);
      throw error;
    }
  }

  // Отметка всех уведомлений как прочитанных
  async markAllAsRead(): Promise<void> {
    try {
      const response = await api.post(this.ENDPOINTS.MARK_ALL_READ);
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка отметки всех уведомлений');
      }
    } catch (error) {
      console.error('Mark all as read error:', error);
      throw error;
    }
  }

  // Удаление уведомления
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const response = await api.delete(`${this.ENDPOINTS.DELETE}/${notificationId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка удаления уведомления');
      }
    } catch (error) {
      console.error('Delete notification error:', error);
      throw error;
    }
  }

  // Удаление нескольких уведомлений
  async deleteMultipleNotifications(notificationIds: string[]): Promise<void> {
    try {
      const response = await api.post(`${this.ENDPOINTS.DELETE}/multiple`, { notificationIds });
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка удаления уведомлений');
      }
    } catch (error) {
      console.error('Delete multiple notifications error:', error);
      throw error;
    }
  }

  // Удаление всех уведомлений
  async deleteAllNotifications(): Promise<void> {
    try {
      const response = await api.delete(`${this.ENDPOINTS.DELETE}/all`);
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка удаления всех уведомлений');
      }
    } catch (error) {
      console.error('Delete all notifications error:', error);
      throw error;
    }
  }

  // === Настройки уведомлений ===

  // Получение настроек уведомлений
  async getSettings(): Promise<NotificationSettings> {
    try {
      const response = await api.get<NotificationSettings>(this.ENDPOINTS.SETTINGS);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка получения настроек уведомлений');
    } catch (error) {
      console.error('Get notification settings error:', error);
      throw error;
    }
  }

  // Обновление настроек уведомлений
  async updateSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    try {
      const response = await api.put<NotificationSettings>(this.ENDPOINTS.SETTINGS, settings);
      
      if (response.success && response.data) {
        // Обновляем локальные настройки
        this.soundEnabled = response.data.sound;
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка обновления настроек уведомлений');
    } catch (error) {
      console.error('Update notification settings error:', error);
      throw error;
    }
  }

  // === Статистика ===

  // Получение количества непрочитанных уведомлений
  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get<{ count: number }>(this.ENDPOINTS.COUNT);
      
      if (response.success && response.data) {
        return response.data.count;
      }
      
      return 0;
    } catch (error) {
      console.error('Get unread count error:', error);
      return 0;
    }
  }

  // Получение статистики уведомлений
  async getStats(): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    try {
      const response = await api.get<{
        total: number;
        unread: number;
        byType: Record<string, number>;
        byPriority: Record<string, number>;
      }>(`${this.ENDPOINTS.NOTIFICATIONS}/stats`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return {
        total: 0,
        unread: 0,
        byType: {},
        byPriority: {},
      };
    } catch (error) {
      console.error('Get notification stats error:', error);
      return {
        total: 0,
        unread: 0,
        byType: {},
        byPriority: {},
      };
    }
  }

  // === Push уведомления ===

  // Подписка на push уведомления
  async subscribeToPush(): Promise<void> {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push уведомления не поддерживаются');
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.REACT_APP_VAPID_PUBLIC_KEY || ''
        ),
      });

      const response = await api.post(this.ENDPOINTS.SUBSCRIBE_PUSH, {
        subscription: subscription.toJSON(),
      });

      if (!response.success) {
        throw new Error(response.message || 'Ошибка подписки на push уведомления');
      }
    } catch (error) {
      console.error('Subscribe to push error:', error);
      throw error;
    }
  }

  // Отписка от push уведомлений
  async unsubscribeFromPush(): Promise<void> {
    try {
      if (!('serviceWorker' in navigator)) {
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      const response = await api.post(this.ENDPOINTS.UNSUBSCRIBE_PUSH);

      if (!response.success) {
        throw new Error(response.message || 'Ошибка отписки от push уведомлений');
      }
    } catch (error) {
      console.error('Unsubscribe from push error:', error);
      throw error;
    }
  }

  // === Локальные уведомления ===

  // Запрос разрешения на показ уведомлений
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Уведомления не поддерживаются в этом браузере');
    }

    if (Notification.permission === 'default') {
      this.notificationPermission = await Notification.requestPermission();
    } else {
      this.notificationPermission = Notification.permission;
    }

    return this.notificationPermission;
  }

  // Показ локального уведомления
  showLocalNotification(notification: Notification): void {
    if (this.notificationPermission !== 'granted') {
      return;
    }

    try {
      const notif = new window.Notification(notification.title, {
        body: notification.content,
        icon: '/icons/notification-icon.png',
        badge: '/icons/badge-icon.png',
        tag: notification.id,
        data: {
          id: notification.id,
          type: notification.type,
          ...notification.data,
        },
        requireInteraction: notification.priority === 'urgent',
      });

      notif.onclick = () => {
        window.focus();
        this.handleNotificationClick(notification);
        notif.close();
      };

      // Воспроизводим звук уведомления
      if (this.soundEnabled && this.notificationSound) {
        this.notificationSound.play().catch(error => {
          console.error('Error playing notification sound:', error);
        });
      }

      // Автоматически закрываем уведомление через некоторое время
      if (notification.priority !== 'urgent') {
        setTimeout(() => {
          notif.close();
        }, 5000);
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  // Обработка клика по уведомлению
  private handleNotificationClick(notification: Notification): void {
    // Отмечаем уведомление как прочитанное
    this.markAsRead(notification.id).catch(console.error);

    // Навигация в зависимости от типа уведомления
    switch (notification.type) {
      case 'message':
        if (notification.data?.chatId) {
          window.location.href = `/chat/${notification.data.chatId}`;
        }
        break;
      case 'friend_request':
        window.location.href = '/friends/requests';
        break;
      case 'call':
        if (notification.data?.callId) {
          window.location.href = `/call/${notification.data.callId}`;
        }
        break;
      case 'chat_invite':
        if (notification.data?.chatId) {
          window.location.href = `/chat/${notification.data.chatId}`;
        }
        break;
      default:
        window.location.href = '/notifications';
        break;
    }
  }

  // === Утилитарные методы ===

  // Конвертация VAPID ключа
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Проверка поддержки уведомлений
  isNotificationSupported(): boolean {
    return 'Notification' in window;
  }

  // Проверка поддержки push уведомлений
  isPushSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Получение статуса разрешений
  getNotificationPermission(): NotificationPermission {
    return this.notificationPermission;
  }

  // Включение/выключение звука уведомлений
  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  // Установка громкости звука уведомлений
  setSoundVolume(volume: number): void {
    if (this.notificationSound) {
      this.notificationSound.volume = Math.max(0, Math.min(1, volume));
    }
  }

  // Тестовое уведомление
  async sendTestNotification(): Promise<void> {
    try {
      const testNotification: CreateNotificationData = {
        type: 'system',
        title: 'Тестовое уведомление',
        content: 'Это тестовое уведомление для проверки работы системы',
        priority: 'low',
      };

      await this.createNotification(testNotification);
    } catch (error) {
      console.error('Send test notification error:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;