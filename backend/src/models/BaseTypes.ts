// Base response types for API
export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: IApiError;
  message?: string;
  timestamp: Date;
}

export interface IApiError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

// Pagination types
export interface IPaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface IPaginationResponse<T> {
  items: T[];
  pagination: IPaginationMeta;
}

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// File upload types
export interface IFileUpload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface IFileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Search types
export interface ISearchQuery {
  q: string;
  filters?: Record<string, any>;
  sort?: string;
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ISearchResult<T> {
  items: T[];
  total: number;
  query: string;
  took: number; // search time in ms
  suggestions?: string[];
}

// Notification types
export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  isPush: boolean;
  isEmail: boolean;
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
}

export enum NotificationType {
  MESSAGE = 'message',
  FRIEND_REQUEST = 'friend_request',
  FRIEND_ACCEPTED = 'friend_accepted',
  CALL_INCOMING = 'call_incoming',
  CALL_MISSED = 'call_missed',
  CHAT_INVITE = 'chat_invite',
  MENTION = 'mention',
  REACTION = 'reaction',
  SYSTEM = 'system'
}

// Activity types
export interface IUserActivity {
  id: string;
  userId: string;
  type: UserActivityType;
  description: string;
  metadata?: any;
  createdAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export enum UserActivityType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  PASSWORD_CHANGED = 'password_changed',
  PROFILE_UPDATED = 'profile_updated',
  FRIEND_ADDED = 'friend_added',
  CHAT_CREATED = 'chat_created',
  CHAT_JOINED = 'chat_joined',
  CALL_INITIATED = 'call_initiated',
  FILE_UPLOADED = 'file_uploaded'
}

// Device/Session types
export interface IUserSession {
  id: string;
  userId: string;
  token: string;
  deviceInfo: IDeviceInfo;
  ipAddress: string;
  location?: ILocationInfo;
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
  expiresAt: Date;
}

export interface IDeviceInfo {
  deviceId: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  os: string;
  osVersion: string;
  browser: string;
  browserVersion: string;
  userAgent: string;
}

export interface ILocationInfo {
  country: string;
  region: string;
  city: string;
  timezone: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Real-time event types
export interface ISocketEvent {
  type: SocketEventType;
  data: any;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

export enum SocketEventType {
  // Connection events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  
  // User events
  USER_ONLINE = 'user:online',
  USER_OFFLINE = 'user:offline',
  USER_TYPING = 'user:typing',
  USER_STOP_TYPING = 'user:stop_typing',
  USER_STATUS_CHANGED = 'user:status_changed',
  
  // Message events
  MESSAGE_SENT = 'message:sent',
  MESSAGE_RECEIVED = 'message:received',
  MESSAGE_EDITED = 'message:edited',
  MESSAGE_DELETED = 'message:deleted',
  MESSAGE_REACTION = 'message:reaction',
  MESSAGE_READ = 'message:read',
  
  // Chat events
  CHAT_CREATED = 'chat:created',
  CHAT_UPDATED = 'chat:updated',
  CHAT_MEMBER_ADDED = 'chat:member_added',
  CHAT_MEMBER_REMOVED = 'chat:member_removed',
  CHAT_MEMBER_ROLE_CHANGED = 'chat:member_role_changed',
  
  // Friend events
  FRIEND_REQUEST_SENT = 'friend:request_sent',
  FRIEND_REQUEST_RECEIVED = 'friend:request_received',
  FRIEND_REQUEST_ACCEPTED = 'friend:request_accepted',
  FRIEND_REQUEST_DECLINED = 'friend:request_declined',
  FRIEND_ADDED = 'friend:added',
  FRIEND_REMOVED = 'friend:removed',
  
  // Call events
  CALL_INITIATED = 'call:initiated',
  CALL_ANSWERED = 'call:answered',
  CALL_DECLINED = 'call:declined',
  CALL_ENDED = 'call:ended',
  CALL_PARTICIPANT_JOINED = 'call:participant_joined',
  CALL_PARTICIPANT_LEFT = 'call:participant_left',
  CALL_PARTICIPANT_MUTED = 'call:participant_muted',
  CALL_PARTICIPANT_UNMUTED = 'call:participant_unmuted',
  CALL_SCREEN_SHARE_STARTED = 'call:screen_share_started',
  CALL_SCREEN_SHARE_STOPPED = 'call:screen_share_stopped',
  
  // Notification events
  NOTIFICATION_SENT = 'notification:sent',
  NOTIFICATION_READ = 'notification:read',
  
  // Error events
  ERROR = 'error'
}

// Cache types
export interface ICacheEntry<T = any> {
  key: string;
  value: T;
  ttl?: number;
  createdAt: Date;
  expiresAt?: Date;
}

// Configuration types
export interface IAppConfig {
  server: {
    port: number;
    host: string;
    cors: {
      origin: string[];
      credentials: boolean;
    };
  };
  database: {
    host: string;
    port: number;
    name: string;
    username: string;
    password: string;
    ssl: boolean;
    maxConnections: number;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  email: {
    provider: 'smtp' | 'sendgrid' | 'mailgun';
    from: string;
    smtp?: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
    apiKey?: string;
  };
  storage: {
    provider: 'local' | 's3' | 'gcs';
    local?: {
      uploadPath: string;
      maxFileSize: number;
    };
    s3?: {
      bucket: string;
      region: string;
      accessKeyId: string;
      secretAccessKey: string;
    };
  };
  webrtc: {
    stunServers: string[];
    turnServers?: {
      urls: string[];
      username?: string;
      credential?: string;
    }[];
  };
}

// Audit log types
export interface IAuditLog {
  id: string;
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  PERMISSION_GRANT = 'permission_grant',
  PERMISSION_REVOKE = 'permission_revoke'
}

// Rate limiting types
export interface IRateLimit {
  identifier: string; // IP or user ID
  action: string;
  count: number;
  windowStart: Date;
  expiresAt: Date;
}

export interface IRateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// Health check types
export interface IHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  services: Record<string, IServiceHealth>;
  version: string;
}

export interface IServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  error?: string;
  lastCheck: Date;
}

// Metrics types
export interface IMetrics {
  timestamp: Date;
  users: {
    total: number;
    online: number;
    newToday: number;
  };
  messages: {
    total: number;
    todayCount: number;
    averagePerUser: number;
  };
  calls: {
    total: number;
    active: number;
    todayCount: number;
    averageDuration: number;
  };
  system: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkIn: number;
    networkOut: number;
  };
}

// WebRTC types
export interface IWebRTCOffer {
  callId: string;
  participantId: string;
  sdp: string;
  type: 'offer';
}

export interface IWebRTCAnswer {
  callId: string;
  participantId: string;
  sdp: string;
  type: 'answer';
}

export interface IWebRTCIceCandidate {
  callId: string;
  participantId: string;
  candidate: string;
  sdpMLineIndex: number;
  sdpMid: string;
}

// Emoji and reactions
export interface IEmoji {
  id: string;
  name: string;
  unicode: string;
  category: EmojiCategory;
  keywords: string[];
  isCustom: boolean;
  url?: string; // for custom emojis
}

export enum EmojiCategory {
  PEOPLE = 'people',
  NATURE = 'nature',
  FOOD = 'food',
  ACTIVITY = 'activity',
  TRAVEL = 'travel',
  OBJECTS = 'objects',
  SYMBOLS = 'symbols',
  FLAGS = 'flags',
  CUSTOM = 'custom'
}

// Theme and appearance
export interface ITheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
  fonts: {
    primary: string;
    secondary: string;
    mono: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
}

// Localization
export interface ILocale {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  translations: Record<string, string>;
}

// Privacy and security
export interface IPrivacySettings {
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  allowMessageRequests: boolean;
  allowCallsFrom: 'everyone' | 'friends' | 'nobody';
  allowGroupInvites: 'everyone' | 'friends' | 'nobody';
  readReceipts: boolean;
  typingIndicators: boolean;
  profileVisibility: 'public' | 'friends' | 'private';
}

export interface ISecuritySettings {
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  sessionTimeout: number;
  allowedDevices: string[];
  blockedUsers: string[];
  suspiciousActivityAlerts: boolean;
}

// Backup and export
export interface IDataExport {
  id: string;
  userId: string;
  type: ExportType;
  status: ExportStatus;
  progress: number;
  fileUrl?: string;
  fileSize?: number;
  requestedAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
}

export enum ExportType {
  MESSAGES = 'messages',
  MEDIA = 'media',
  CONTACTS = 'contacts',
  FULL = 'full'
}

export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

// Integration types
export interface IWebhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  isActive: boolean;
  lastTriggered?: Date;
  failureCount: number;
  createdAt: Date;
}

export enum WebhookEvent {
  MESSAGE_SENT = 'message.sent',
  USER_JOINED = 'user.joined',
  CALL_STARTED = 'call.started',
  CALL_ENDED = 'call.ended'
}

// Bot and automation types
export interface IBot {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  token: string;
  permissions: BotPermission[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}

export enum BotPermission {
  READ_MESSAGES = 'read_messages',
  SEND_MESSAGES = 'send_messages',
  MANAGE_CHATS = 'manage_chats',
  MANAGE_USERS = 'manage_users',
  ACCESS_CALL_HISTORY = 'access_call_history'
}

// Error handling
export interface IErrorLog {
  id: string;
  level: ErrorLevel;
  message: string;
  stack?: string;
  userId?: string;
  sessionId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  userAgent?: string;
  ipAddress?: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export enum ErrorLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

// Queue and job types
export interface IJob {
  id: string;
  type: JobType;
  data: any;
  priority: number;
  attempts: number;
  maxAttempts: number;
  status: JobStatus;
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
}

export enum JobType {
  SEND_EMAIL = 'send_email',
  PROCESS_UPLOAD = 'process_upload',
  GENERATE_THUMBNAIL = 'generate_thumbnail',
  BACKUP_DATA = 'backup_data',
  CLEANUP_FILES = 'cleanup_files',
  SEND_NOTIFICATION = 'send_notification'
}

export enum JobStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
  STUCK = 'stuck'
}

// Constants
export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
};

export const FILE_LIMITS = {
  MAX_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_FILES: 10,
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
};

export const RATE_LIMITS = {
  LOGIN: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 minutes
  MESSAGE: { windowMs: 60 * 1000, maxRequests: 60 }, // 60 messages per minute
  FILE_UPLOAD: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 uploads per minute
  FRIEND_REQUEST: { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 10 requests per hour
};

export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  ERROR: 'error',
};