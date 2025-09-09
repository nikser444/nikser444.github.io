import { BaseEntity, NotificationType, NotificationPriority } from './Base';
import { PublicUser } from './User';

// Основной интерфейс уведомления
export interface Notification extends BaseEntity {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
  isRead: boolean;
  readAt?: Date;
  priority: NotificationPriority;
  actionUrl?: string;
  actionLabel?: string;
  imageUrl?: string;
  senderId?: string;
  sender?: PublicUser;
  chatId?: string;
  expiresAt?: Date;
  isExpired: boolean;
  deliveryStatus: NotificationDeliveryStatus[];
}

// Данные уведомления (специфичные для типа)
export interface NotificationData {
  messageId?: string;
  callId?: string;
  friendRequestId?: string;
  chatInviteId?: string;
  userId?: string;
  chatId?: string;
  additionalInfo?: any;
}

// Статус доставки уведомления
export interface NotificationDeliveryStatus {
  platform: 'web' | 'mobile' | 'email' | 'sms';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'clicked';
  sentAt?: Date;
  deliveredAt?: Date;
  clickedAt?: Date;
  error?: string;
}

// Данные для создания уведомления
export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
  priority?: NotificationPriority;
  actionUrl?: string;
  actionLabel?: string;
  imageUrl?: string;
  senderId?: string;
  chatId?: string;
  expiresIn?: number; // секунды
  platforms?: ('web' | 'mobile' | 'email' | 'sms')[];
}

// Настройки уведомлений пользователя
export interface NotificationPreferences {
  userId: string;
  globalEnabled: boolean;
  webPushEnabled: boolean;
  mobilePushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "08:00"
  preferences: NotificationTypePreferences;
  mutedChats: string[];
  mutedUsers: string[];
  keywords: string[]; // ключевые слова для уведомлений
  updatedAt: Date;
}

// Настройки по типам уведомлений
export interface NotificationTypePreferences {
  [NotificationType.MESSAGE]: NotificationChannelSettings;
  [NotificationType.FRIEND_REQUEST]: NotificationChannelSettings;
  [NotificationType.CALL]: NotificationChannelSettings;
  [NotificationType.SYSTEM]: NotificationChannelSettings;
  [NotificationType.CHAT_INVITE]: NotificationChannelSettings;
}

// Настройки каналов уведомлений
export interface NotificationChannelSettings {
  enabled: boolean;
  webPush: boolean;
  mobilePush: boolean;
  email: boolean;
  sms: boolean;
  sound: boolean;
  vibration: boolean;
  priority: NotificationPriority;
  customSound?: string;
}

// Push подписка
export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  platform: 'web' | 'android' | 'ios';
  userAgent?: string;
  isActive: boolean;
  createdAt: Date;
  lastUsed: Date;
}

// Шаблон уведомления
export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  language: string;
  variables: string[]; // переменные для подстановки
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Группа уведомлений
export interface NotificationGroup {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  count: number;
  latestNotification: Notification;
  notifications: string[]; // ID уведомлений в группе
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Статистика уведомлений
export interface NotificationStats {
  userId: string;
  totalSent: number;
  totalRead: number;
  totalClicked: number;
  readRate: number;
  clickRate: number;
  byType: { [key in NotificationType]: NotificationTypeStats };
  byPlatform: { [platform: string]: PlatformStats };
  trends: NotificationTrend[];
}

// Статистика по типу уведомлений
export interface NotificationTypeStats {
  sent: number;
  read: number;
  clicked: number;
  readRate: number;
  clickRate: number;
}

// Статистика по платформе
export interface PlatformStats {
  sent: number;
  delivered: number;
  failed: number;
  clicked: number;
  deliveryRate: number;
  clickRate: number;
}

// Тренд уведомлений
export interface NotificationTrend {
  date: string;
  sent: number;
  read: number;
  clicked: number;
}

// Массовое уведомление
export interface BulkNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  targetUsers: string[];
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  clickedCount: number;
  scheduledFor?: Date;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  createdBy: string;
  creator?: PublicUser;
  createdAt: Date;
  sentAt?: Date;
}

// Фильтр для массовых уведомлений
export interface BulkNotificationFilter {
  userIds?: string[];
  registeredAfter?: Date;
  registeredBefore?: Date;
  lastActiveAfter?: Date;
  lastActiveBefore?: Date;
  hasCompletedProfile?: boolean;
  location?: string;
  language?: string;
  customFilter?: any;
}

// Результат поиска уведомлений
export interface NotificationSearchResult {
  notifications: Notification[];
  groups: NotificationGroup[];
  total: number;
  hasMore: boolean;
}

// Параметры поиска уведомлений
export interface NotificationSearchParams {
  query?: string;
  types?: NotificationType[];
  isRead?: boolean;
  priority?: NotificationPriority;
  fromDate?: Date;
  toDate?: Date;
  senderId?: string;
  chatId?: string;
  limit?: number;
  offset?: number;
  groupSimilar?: boolean;
}

// Действие над уведомлением
export interface NotificationAction {
  id: string;
  notificationId: string;
  userId: string;
  action: 'read' | 'clicked' | 'dismissed' | 'snoozed';
  actionData?: any;
  timestamp: Date;
  platform: 'web' | 'mobile' | 'email';
}

// Отложенное уведомление
export interface SnoozedNotification {
  id: string;
  notificationId: string;
  userId: string;
  snoozedUntil: Date;
  originalCreatedAt: Date;
  snoozeCount: number;
  isActive: boolean;
}

// Экспорт всех типов уведомлений
export type {
  Notification,
  NotificationData,
  NotificationDeliveryStatus,
  CreateNotificationData,
  NotificationPreferences,
  NotificationTypePreferences,
  NotificationChannelSettings,
  PushSubscription,
  NotificationTemplate,
  NotificationGroup,
  NotificationStats,
  NotificationTypeStats,
  PlatformStats,
  NotificationTrend,
  BulkNotification,
  BulkNotificationFilter,
  NotificationSearchResult,
  NotificationSearchParams,
  NotificationAction,
  SnoozedNotification
};