// frontend/src/types/notification.ts
import { BaseEntity } from './base';
import { PublicUser } from './user';
import { Message } from './message';
import { Call } from './call';
import { FriendRequest } from './friend';

export type NotificationType = 
  | 'message'
  | 'friend_request'
  | 'friend_accepted'
  | 'call_incoming'
  | 'call_missed'
  | 'group_invitation'
  | 'group_mention'
  | 'system'
  | 'update';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification extends BaseEntity {
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  data: NotificationData;
  userId: string;
  isRead: boolean;
  isDelivered: boolean;
  readAt?: string;
  deliveredAt?: string;
  expiresAt?: string;
  actions?: NotificationAction[];
}

export interface NotificationData {
  [key: string]: any;
  // Specific data based on notification type
  messageId?: string;
  chatId?: string;
  callId?: string;
  friendRequestId?: string;
  userId?: string;
  url?: string;
}

export interface NotificationAction {
  id: string;
  title: string;
  icon?: string;
  action: string;
  url?: string;
  destructive?: boolean;
}

export interface MessageNotification extends Notification {
  type: 'message';
  data: NotificationData & {
    messageId: string;
    chatId: string;
    senderId: string;
    sender: PublicUser;
    message: Message;
    chatName?: string;
    isGroupMessage: boolean;
  };
}

export interface FriendRequestNotification extends Notification {
  type: 'friend_request';
  data: NotificationData & {
    friendRequestId: string;
    senderId: string;
    sender: PublicUser;
    request: FriendRequest;
  };
}

export interface CallNotification extends Notification {
  type: 'call_incoming' | 'call_missed';
  data: NotificationData & {
    callId: string;
    callerId: string;
    caller: PublicUser;
    call: Call;
    callType: 'audio' | 'video';
  };
}

export interface GroupInvitationNotification extends Notification {
  type: 'group_invitation';
  data: NotificationData & {
    chatId: string;
    inviterId: string;
    inviter: PublicUser;
    chatName: string;
    chatAvatar?: string;
  };
}

export interface SystemNotification extends Notification {
  type: 'system' | 'update';
  data: NotificationData & {
    version?: string;
    updateUrl?: string;
    maintenanceStart?: string;
    maintenanceEnd?: string;
  };
}

export interface NotificationSettings {
  enabled: boolean;
  types: Record<NotificationType, NotificationTypeSettings>;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string; // HH:mm format
    timezone: string;
  };
  devices: {
    desktop: boolean;
    mobile: boolean;
    email: boolean;
    sms: boolean;
  };
  sound: {
    enabled: boolean;
    volume: number;
    customSounds: Record<NotificationType, string>;
  };
}

export interface NotificationTypeSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  showPreview: boolean;
  priority: NotificationPriority;
  grouping: boolean;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId: string;
  deviceType: 'desktop' | 'mobile';
  userAgent: string;
  isActive: boolean;
  subscribedAt: string;
}

export interface NotificationBatch {
  id: string;
  notifications: Notification[];
  count: number;
  type: NotificationType;
  title: string;
  summary: string;
  createdAt: string;
  isCollapsed: boolean;
}

export interface NotificationFilter {
  type?: NotificationType;
  isRead?: boolean;
  priority?: NotificationPriority;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
  todayCount: number;
  weekCount: number;
}

export interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
  canRequest: boolean;
}

export interface WebPushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
  actions?: {
    action: string;
    title: string;
    icon?: string;
  }[];
  data?: any;
}

export interface NotificationQueue {
  pending: Notification[];
  processing: Notification[];
  failed: Notification[];
  retryCount: Record<string, number>;
  maxRetries: number;
}