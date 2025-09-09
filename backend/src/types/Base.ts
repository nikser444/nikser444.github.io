// Базовые типы для всего приложения
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Статусы пользователя
export enum UserStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  AWAY = 'away',
  BUSY = 'busy',
  INVISIBLE = 'invisible'
}

// Типы сообщений
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  AUDIO = 'audio',
  VIDEO = 'video',
  SYSTEM = 'system'
}

// Статусы сообщений
export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}

// Типы чатов
export enum ChatType {
  PRIVATE = 'private',
  GROUP = 'group',
  CHANNEL = 'channel'
}

// Роли в чатах
export enum ChatRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  GUEST = 'guest'
}

// Статусы заявок в друзья
export enum FriendRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  BLOCKED = 'blocked'
}

// Типы звонков
export enum CallType {
  AUDIO = 'audio',
  VIDEO = 'video',
  SCREEN_SHARE = 'screen_share',
  CONFERENCE = 'conference'
}

// Статусы звонков
export enum CallStatus {
  INITIATING = 'initiating',
  RINGING = 'ringing',
  ACTIVE = 'active',
  ENDED = 'ended',
  MISSED = 'missed',
  DECLINED = 'declined',
  FAILED = 'failed'
}

// Типы уведомлений
export enum NotificationType {
  MESSAGE = 'message',
  FRIEND_REQUEST = 'friend_request',
  CALL = 'call',
  SYSTEM = 'system',
  CHAT_INVITE = 'chat_invite'
}

// Приоритеты уведомлений
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Базовые ответы API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Файловые типы
export interface FileInfo {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  path: string;
  uploadedBy: string;
  uploadedAt: Date;
}

// Координаты для геолокации
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

// Настройки приватности
export interface PrivacySettings {
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  allowFriendRequests: boolean;
  allowCallsFromFriends: boolean;
  allowCallsFromEveryone: boolean;
}

// Настройки уведомлений
export interface NotificationSettings {
  enablePushNotifications: boolean;
  enableEmailNotifications: boolean;
  enableSoundNotifications: boolean;
  muteUntil?: Date;
  mutedChats: string[];
}

// Медиа настройки
export interface MediaSettings {
  autoDownloadImages: boolean;
  autoDownloadVideos: boolean;
  autoDownloadFiles: boolean;
  maxDownloadSize: number; // в байтах
  videoQuality: 'low' | 'medium' | 'high';
  audioQuality: 'low' | 'medium' | 'high';
}

// Настройки темы
export interface ThemeSettings {
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  compact: boolean;
}

// Объединенные настройки пользователя
export interface UserSettings {
  privacy: PrivacySettings;
  notifications: NotificationSettings;
  media: MediaSettings;
  theme: ThemeSettings;
}

// Ошибки валидации
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// WebSocket события
export interface SocketEvent<T = any> {
  type: string;
  data: T;
  timestamp: number;
  userId?: string;
  chatId?: string;
}

// WebRTC конфигурация
export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  configuration?: RTCConfiguration;
}

// Статистика звонка
export interface CallStats {
  duration: number;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  bitrate: number;
  packetLoss: number;
  jitter: number;
  roundTripTime: number;
}

export default {
  UserStatus,
  MessageType,
  MessageStatus,
  ChatType,
  ChatRole,
  FriendRequestStatus,
  CallType,
  CallStatus,
  NotificationType,
  NotificationPriority
};