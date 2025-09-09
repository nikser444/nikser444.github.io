// index.ts - Главный файл экспорта всех типов
import { Request } from 'express';

// Экспорт всех базовых типов
export * from './Base';

// Экспорт типов пользователей
export * from './User';

// Экспорт типов чатов
export * from './Chat';

// Экспорт типов сообщений
export * from './Message';

// Экспорт типов друзей
export * from './Friend';

// Экспорт типов звонков
export * from './Call';

// Экспорт типов уведомлений
export * from './Notification';

// Дополнительные служебные типы для API
export interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    role: import('./Base').UserRole;
  };
}

// Типы для Socket.IO
export interface ServerToClientEvents {
  // Сообщения
  'message:new': (message: import('./Message').Message) => void;
  'message:updated': (message: import('./Message').Message) => void;
  'message:deleted': (data: { messageId: string; chatId: string }) => void;
  'message:typing': (data: { userId: string; username: string; chatId: string; isTyping: boolean }) => void;
  'message:read': (data: { messageId: string; userId: string; readAt: Date }) => void;
  'message:reaction': (data: { messageId: string; reaction: import('./Message').MessageReaction }) => void;

  // Звонки
  'call:initiated': (call: import('./Call').Call) => void;
  'call:ringing': (data: { callId: string; participantId: string }) => void;
  'call:accepted': (data: { callId: string; participantId: string }) => void;
  'call:declined': (data: { callId: string; participantId: string; reason?: string }) => void;
  'call:ended': (data: { callId: string; endReason: import('./Call').CallEndReason }) => void;
  'call:participant:joined': (data: { callId: string; participant: import('./Call').CallParticipant }) => void;
  'call:participant:left': (data: { callId: string; participantId: string }) => void;
  'call:participant:updated': (data: { callId: string; participant: import('./Call').CallParticipant }) => void;
  'call:settings:updated': (data: { callId: string; settings: any }) => void;
  'call:recording:started': (data: { callId: string; recordingId: string }) => void;
  'call:recording:ended': (data: { callId: string; recordingId: string }) => void;

  // WebRTC сигналинг
  'webrtc:offer': (data: { from: string; to: string; callId: string; offer: RTCSessionDescriptionInit }) => void;
  'webrtc:answer': (data: { from: string; to: string; callId: string; answer: RTCSessionDescriptionInit }) => void;
  'webrtc:ice-candidate': (data: { from: string; to: string; callId: string; candidate: RTCIceCandidate }) => void;
  'webrtc:renegotiate': (data: { from: string; to: string; callId: string }) => void;

  // Демонстрация экрана
  'screen:share:started': (data: { callId: string; screenShare: import('./Call').ScreenShare }) => void;
  'screen:share:ended': (data: { callId: string; participantId: string }) => void;

  // Пользователи
  'user:online': (data: { userId: string; status: import('./Base').UserStatus }) => void;
  'user:offline': (data: { userId: string; lastSeen: Date }) => void;
  'user:status:changed': (data: { userId: string; status: import('./Base').UserStatus }) => void;
  'user:profile:updated': (user: import('./User').PublicUserProfile) => void;

  // Чаты
  'chat:created': (chat: import('./Chat').Chat) => void;
  'chat:updated': (chat: import('./Chat').Chat) => void;
  'chat:deleted': (data: { chatId: string }) => void;
  'chat:member:joined': (data: { chatId: string; member: import('./Chat').ChatMember }) => void;
  'chat:member:left': (data: { chatId: string; memberId: string }) => void;
  'chat:member:updated': (data: { chatId: string; member: import('./Chat').ChatMember }) => void;
  'chat:typing': (data: { chatId: string; userId: string; username: string; isTyping: boolean }) => void;
  'chat:invite': (invitation: import('./Chat').ChatInvitation) => void;

  // Друзья
  'friend:request:sent': (request: import('./Friend').FriendRequest) => void;
  'friend:request:received': (request: import('./Friend').FriendRequest) => void;
  'friend:request:accepted': (data: { requestId: string; friendship: import('./Friend').Friendship }) => void;
  'friend:request:declined': (data: { requestId: string }) => void;
  'friend:added': (friendship: import('./Friend').Friendship) => void;
  'friend:removed': (data: { friendshipId: string }) => void;
  'friend:blocked': (data: { userId: string }) => void;
  'friend:unblocked': (data: { userId: string }) => void;
  'friend:suggestion': (suggestion: import('./Friend').FriendSuggestion) => void;

  // Уведомления
  'notification:new': (notification: import('./Notification').Notification) => void;
  'notification:read': (data: { notificationId: string }) => void;
  'notification:bulk:read': (data: { notificationIds: string[] }) => void;
  'notification:settings:updated': (settings: import('./Notification').UserNotificationSettings) => void;

  // Системные события
  'system:maintenance': (data: { message: string; startTime: Date; duration: number }) => void;
  'system:update': (data: { version: string; features: string[]; mandatory: boolean }) => void;
  'error': (error: { message: string; code?: string; timestamp: Date }) => void;
  'reconnected': () => void;
  'disconnect': (reason: string) => void;
}

export interface ClientToServerEvents {
  // Подключение и аутентификация
  'auth': (token: string, callback: (response: { success: boolean; error?: string }) => void) => void;
  'heartbeat': (callback: (timestamp: Date) => void) => void;

  // Комнаты и каналы
  'join:room': (roomId: string, callback?: (response: { success: boolean; error?: string }) => void) => void;
  'leave:room': (roomId: string, callback?: (response: { success: boolean; error?: string }) => void) => void;
  'join:chat': (chatId: string, callback?: (response: { success: boolean; error?: string }) => void) => void;
  'leave:chat': (chatId: string, callback?: (response: { success: boolean; error?: string }) => void) => void;

  // Сообщения
  'message:send': (data: import('./Message').CreateMessageDto, callback?: (response: { success: boolean; message?: import('./Message').Message; error?: string }) => void) => void;
  'message:edit': (data: { messageId: string; updates: import('./Message').UpdateMessageDto }, callback?: (response: { success: boolean; error?: string }) => void) => void;
  'message:delete': (data: { messageId: string; deleteForEveryone?: boolean }, callback?: (response: { success: boolean; error?: string }) => void) => void;
  'message:typing:start': (data: { chatId: string }) => void;
  'message:typing:stop': (data: { chatId: string }) => void;
  'message:read': (data: { messageIds: string[] }) => void;
  'message:react': (data: import('./Message').AddReactionDto, callback?: (response: { success: boolean; error?: string }) => void) => void;

  // Звонки
  'call:initiate': (data: import('./Call').InitiateCallDto, callback: (response: { success: boolean; call?: import('./Call').Call; error?: string }) => void) => void;
  'call:join': (data: import('./Call').JoinCallDto, callback: (response: import('./Call').JoinCallResponse) => void) => void;
  'call:leave': (data: { callId: string }, callback?: (response: { success: boolean; error?: string }) => void) => void;
  'call:accept': (data: { callId: string }, callback?: (response: { success: boolean; error?: string }) => void) => void;
  'call:decline': (data: { callId: string; reason?: string }, callback?: (response: { success: boolean; error?: string }) => void) => void;
  'call:end': (data: { callId: string }, callback?: (response: { success: boolean; error?: string }) => void) => void;
  'call:settings:update': (data: { callId: string; settings: import('./Call').UpdateParticipantSettingsDto }, callback?: (response: { success: boolean; error?: string }) => void) => void;
  'call:moderate': (data: import('./Call').ModerateParticipantDto, callback?: (response: { success: boolean; error?: string }) => void) => void;

  // WebRTC сигналинг
  'webrtc:offer': (data: import('./Call').RTCOfferDto) => void;
  'webrtc:answer': (data: import('./Call').RTCAnswerDto) => void;
  'webrtc:ice-candidate': (data: import('./Call').RTCIceCandidateDto) => void;
  'webrtc:renegotiate': (data: { callId: string; targetParticipantId: string }) => void;

  // Демонстрация экрана
  'screen:share:start': (data: import('./Call').StartScreenShareDto, callback: (response: { success: boolean; screenShare?: import('./Call').ScreenShare; error?: string }) => void) => void;
  'screen:share:stop': (data: { callId: string }, callback?: (response: { success: boolean; error?: string }) => void) => void;

  // Пользователи
  'user:status:update': (status: import('./Base').UserStatus) => void;
  'user:profile:get': (userId: string, callback: (profile: import('./User').PublicUserProfile | null) => void) => void;

  // Чаты
  'chat:create': (data: import('./Chat').CreateChatDto, callback: (response: { success: boolean; chat?: import('./Chat').Chat; error?: string }) => void) => void;
  'chat:update': (data: { chatId: string; updates: import('./Chat').UpdateChatDto }, callback?: (response: { success: boolean; error?: string }) => void) => void;
  'chat:delete': (data: { chatId: string }, callback?: (response: { success: boolean; error?: string }) => void) => void;
  'chat:member:add': (data: { chatId: string; memberData: import('./Chat').AddMemberDto }, callback?: (response: { success: boolean; error?: string }) => void) => void;
  'chat:member:remove': (data: { chatId: string; memberId: string; removeData?: import('./Chat').RemoveMemberDto }, callback?: (response: { success: boolean; error?: string }) => void) => void;
  'chat:member:update': (data: { chatId: string; memberId: string; updates: import('./Chat').UpdateMemberDto }, callback?: (response: { success: boolean; error?: string }) => void) => void;
  'chat:typing:start': (data: { chatId: string }) => void;
  'chat:typing:stop': (data: { chatId: string }) => void;

  // Друзья
  'friend:request:send': (data: import('./Friend').SendFriendRequestDto, callback: (response: { success: boolean; request?: import('./Friend').FriendRequest; error?: string }) => void) => void;
  'friend:request:respond': (data: import('./Friend').RespondToFriendRequestDto, callback?: (response: { success: boolean; error?: string }) => void) => void;
  'friend:remove': (data: { friendshipId: string }, callback?: (response: { success: boolean; error?: string }) => void) => void;
  'friend:block': (data: import('./Friend').BlockUserDto, callback?: (response: { success: boolean; error?: string }) => void) => void;
  'friend:unblock': (data: import('./Friend').UnblockUserDto, callback?: (response: { success: boolean; error?: string }) => void) => void;

  // Уведомления
  'notification:read': (data: { notificationIds: string[] }) => void;
  'notification:settings:update': (settings: import('./Notification').UpdateUserNotificationSettingsDto, callback?: (response: { success: boolean; error?: string }) => void) => void;

  // Дополнительные события
  'ping': (callback: (pong: { timestamp: Date; latency: number }) => void) => void;
  'get:online:users': (callback: (users: string[]) => void) => void;
  'subscribe:user:status': (userId: string) => void;
  'unsubscribe:user:status': (userId: string) => void;
}

// Типы для middleware
export interface SocketAuthData {
  userId: string;
  username: string;
  email: string;
  role: import('./Base').UserRole;
}

export interface AuthenticatedSocket {
  userId: string;
  user: SocketAuthData;
  rooms: Set<string>;
  lastActivity: Date;
  connectionId: string;
}

// Типы для управления соединениями
export interface ConnectionManager {
  addConnection(socketId: string, userId: string): void;
  removeConnection(socketId: string): void;
  getUserSockets(userId: string): string[];
  getSocketUser(socketId: string): string | null;
  isUserOnline(userId: string): boolean;
  getOnlineUsers(): string[];
  broadcastToUser(userId: string, event: string, data: any): void;
  broadcastToRoom(room: string, event: string, data: any): void;
}

// Типы для валидации WebSocket событий
export interface SocketEventValidator {
  validateAuth(token: string): Promise<SocketAuthData | null>;
  validateJoinRoom(userId: string, roomId: string): Promise<boolean>;
  validateSendMessage(userId: string, data: import('./Message').CreateMessageDto): Promise<boolean>;
  validateInitiateCall(userId: string, data: import('./Call').InitiateCallDto): Promise<boolean>;
  validateChatAccess(userId: string, chatId: string): Promise<boolean>;
}

// Типы ошибок для WebSocket
export interface SocketError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export const SocketErrorCodes = {
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  ACCESS_DENIED: 'ACCESS_DENIED',
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  CHAT_NOT_FOUND: 'CHAT_NOT_FOUND',
  CALL_NOT_FOUND: 'CALL_NOT_FOUND',
  MESSAGE_NOT_FOUND: 'MESSAGE_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  CONNECTION_LOST: 'CONNECTION_LOST',
  ALREADY_CONNECTED: 'ALREADY_CONNECTED',
  CALL_BUSY: 'CALL_BUSY',
  CALL_DECLINED: 'CALL_DECLINED',
  WEBRTC_ERROR: 'WEBRTC_ERROR',
  MEDIA_ACCESS_DENIED: 'MEDIA_ACCESS_DENIED',
  NETWORK_ERROR: 'NETWORK_ERROR'
} as const;

// Типы для rate limiting
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (userId: string, event: string) => string;
}

export interface RateLimitInfo {
  remaining: number;
  resetTime: Date;
  totalHits: number;
}

// Типы для логирования WebSocket событий
export interface SocketLog {
  id: string;
  userId?: string;
  socketId: string;
  event: string;
  data?: any;
  timestamp: Date;
  duration?: number;
  success: boolean;
  error?: SocketError;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    room?: string;
  };
}

// Типы для статистики WebSocket соединений
export interface SocketStatistics {
  totalConnections: number;
  activeConnections: number;
  totalUsers: number;
  activeUsers: number;
  eventCounts: {
    [event: string]: number;
  };
  errorCounts: {
    [errorCode: string]: number;
  };
  averageLatency: number;
  peakConnections: number;
  connectionDuration: {
    min: number;
    max: number;
    average: number;
  };
  bandwidthUsage: {
    incoming: number;
    outgoing: number;
  };
  lastUpdated: Date;
}

// Дополнительные utility типы
export type EventCallback<T = any> = (data: T) => void;
export type EventCallbackWithResponse<T = any, R = any> = (data: T, callback: (response: R) => void) => void;

// Типы для кеширования
export interface CacheConfig {
  ttl: number; // время жизни в секундах
  maxSize: number;
  strategy: 'lru' | 'fifo' | 'ttl';
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  createdAt: Date;
  expiresAt: Date;
  accessCount: number;
  lastAccessed: Date;
}

// Типы для файлов и медиа
export interface FileUploadConfig {
  maxFileSize: number;
  allowedTypes: string[];
  allowedExtensions: string[];
  uploadPath: string;
  generateThumbnails: boolean;
  compressImages: boolean;
}

export interface ThumbnailConfig {
  sizes: Array<{
    width: number;
    height: number;
    quality?: number;
  }>;
  format: 'jpg' | 'png' | 'webp';
  background?: string;
}

// Типы для безопасности
export interface SecurityConfig {
  rateLimiting: RateLimitConfig;
  allowedOrigins: string[];
  corsOptions: any;
  helmet: any;
  sessionConfig: {
    secret: string;
    resave: boolean;
    saveUninitialized: boolean;
    cookie: {
      secure: boolean;
      httpOnly: boolean;
      maxAge: number;
    };
  };
}

// Типы для конфигурации базы данных
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  poolSize?: number;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

// Типы для Redis конфигурации
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  database?: number;
  keyPrefix?: string;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  lazyConnect?: boolean;
}

// Типы для email сервиса
export interface EmailConfig {
  service: string;
  host?: string;
  port?: number;
  secure?: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  replyTo?: string;
  templates: {
    [templateName: string]: {
      subject: string;
      html: string;
      text?: string;
    };
  };
}

// Типы для SMS сервиса
export interface SMSConfig {
  provider: 'twilio' | 'nexmo' | 'aws_sns';
  apiKey: string;
  apiSecret: string;
  fromNumber: string;
  templates: {
    [templateName: string]: string;
  };
}

// Типы для push уведомлений
export interface PushConfig {
  vapid: {
    publicKey: string;
    privateKey: string;
    subject: string;
  };
  gcm?: {
    apiKey: string;
  };
  apn?: {
    token: {
      key: string;
      keyId: string;
      teamId: string;
    };
    production: boolean;
  };
}

// Типы для WebRTC конфигурации
export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  turnServers?: {
    urls: string[];
    username: string;
    credential: string;
  }[];
  mediaConstraints: {
    audio: MediaTrackConstraints;
    video: MediaTrackConstraints;
  };
  codecPreferences?: {
    audio: string[];
    video: string[];
  };
}

// Типы для мониторинга и метрик
export interface MetricsData {
  timestamp: Date;
  cpu: {
    usage: number;
    load: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    incoming: number;
    outgoing: number;
  };
  database: {
    activeConnections: number;
    queryTime: number;
    queries: number;
  };
  redis: {
    usedMemory: number;
    connectedClients: number;
    keyspaceHits: number;
    keyspaceMisses: number;
  };
  application: {
    activeUsers: number;
    totalRequests: number;
    errorRate: number;
    responseTime: number;
  };
}

// Типы для health check
export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  uptime: number;
  services: {
    database: 'up' | 'down' | 'degraded';
    redis: 'up' | 'down' | 'degraded';
    email: 'up' | 'down' | 'degraded';
    websocket: 'up' | 'down' | 'degraded';
    storage: 'up' | 'down' | 'degraded';
  };
  checks: {
    [checkName: string]: {
      status: 'pass' | 'fail' | 'warn';
      time: Date;
      output?: string;
    };
  };
}

// Экспорт дополнительных констант
export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
  maxLimit: 100
} as const;

export const MESSAGE_LIMITS = {
  maxLength: 4000,
  maxAttachments: 10,
  maxFileSize: 100 * 1024 * 1024, // 100MB
  editTimeLimit: 24 * 60 * 60 * 1000, // 24 hours
  deleteTimeLimit: 48 * 60 * 60 * 1000 // 48 hours
} as const;

export const CALL_LIMITS = {
  maxParticipants: 50,
  maxDuration: 8 * 60 * 60 * 1000, // 8 hours
  recordingMaxSize: 5 * 1024 * 1024 * 1024, // 5GB
  screenShareMaxResolution: { width: 1920, height: 1080 }
} as const;

export const CHAT_LIMITS = {
  maxMembers: 1000,
  maxTitleLength: 100,
  maxDescriptionLength: 500,
  maxPinnedMessages: 10
} as const;

export const USER_LIMITS = {
  maxFriends: 5000,
  maxBlockedUsers: 1000,
  maxUsernameLength: 32,
  maxBioLength: 500,
  avatarMaxSize: 5 * 1024 * 1024 // 5MB
} as const;