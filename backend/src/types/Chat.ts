import { BaseEntity, ChatType, ChatRole, FileInfo } from './Base';
import { PublicUser } from './User';
import { Message } from './Message';

// Основной интерфейс чата
export interface Chat extends BaseEntity {
  name?: string;
  description?: string;
  type: ChatType;
  avatar?: FileInfo;
  isGroup: boolean;
  isChannel: boolean;
  memberCount: number;
  maxMembers?: number;
  ownerId?: string;
  isPublic: boolean;
  inviteLink?: string;
  settings: ChatSettings;
  lastMessage?: Message;
  lastActivity: Date;
  isArchived: boolean;
  isPinned: boolean;
  mutedUntil?: Date;
  unreadCount: number;
}

// Участник чата
export interface ChatMember extends BaseEntity {
  chatId: string;
  userId: string;
  user?: PublicUser;
  role: ChatRole;
  joinedAt: Date;
  invitedBy?: string;
  isActive: boolean;
  lastReadMessageId?: string;
  lastReadAt?: Date;
  permissions: ChatPermissions;
  nickname?: string;
}

// Права участника чата
export interface ChatPermissions {
  canSendMessages: boolean;
  canSendMedia: boolean;
  canSendFiles: boolean;
  canSendLinks: boolean;
  canInviteUsers: boolean;
  canRemoveUsers: boolean;
  canEditInfo: boolean;
  canDeleteMessages: boolean;
  canPinMessages: boolean;
  canManageRoles: boolean;
}

// Настройки чата
export interface ChatSettings {
  allowInvites: boolean;
  requireApproval: boolean;
  muteNotifications: boolean;
  allowFileSharing: boolean;
  allowLinks: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
  messageRetention: number; // дни
  slowMode: number; // секунды между сообщениями
  language?: string;
}

// Данные для создания чата
export interface CreateChatData {
  name?: string;
  description?: string;
  type: ChatType;
  isPublic?: boolean;
  memberIds?: string[];
  settings?: Partial<ChatSettings>;
}

// Данные для обновления чата
export interface UpdateChatData {
  name?: string;
  description?: string;
  isPublic?: boolean;
  settings?: Partial<ChatSettings>;
}

// Приглашение в чат
export interface ChatInvite extends BaseEntity {
  chatId: string;
  chat?: Chat;
  invitedBy: string;
  inviter?: PublicUser;
  invitedUserId?: string;
  invitedUser?: PublicUser;
  email?: string;
  token: string;
  expiresAt: Date;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
}

// Данные для приглашения в чат
export interface InviteChatData {
  chatId: string;
  userIds?: string[];
  emails?: string[];
  message?: string;
  expiresIn?: number; // часы
  maxUses?: number;
}

// Информация о чате для списка
export interface ChatListItem {
  id: string;
  name?: string;
  type: ChatType;
  avatar?: FileInfo;
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    timestamp: Date;
    isRead: boolean;
  };
  unreadCount: number;
  isOnline: boolean;
  isPinned: boolean;
  isMuted: boolean;
  lastActivity: Date;
}

// Результат поиска чатов
export interface ChatSearchResult {
  chats: ChatListItem[];
  total: number;
  hasMore: boolean;
}

// Параметры поиска чатов
export interface ChatSearchParams {
  query: string;
  type?: ChatType;
  limit?: number;
  offset?: number;
  includeArchived?: boolean;
}

// Статистика чата
export interface ChatStats {
  totalMessages: number;
  totalMembers: number;
  messagesPerDay: number;
  activeMembers: number;
  topSenders: {
    userId: string;
    username: string;
    messageCount: number;
  }[];
  createdAt: Date;
  lastActivity: Date;
}

// Архивированный чат
export interface ArchivedChat {
  chatId: string;
  userId: string;
  archivedAt: Date;
  reason?: string;
}

// Закрепленный чат
export interface PinnedChat {
  chatId: string;
  userId: string;
  pinnedAt: Date;
  order: number;
}

// Уведомления чата
export interface ChatNotification {
  chatId: string;
  userId: string;
  enabled: boolean;
  mutedUntil?: Date;
  soundEnabled: boolean;
  previewEnabled: boolean;
}

// Администрирование чата
export interface ChatAdminAction extends BaseEntity {
  chatId: string;
  adminId: string;
  admin?: PublicUser;
  targetUserId?: string;
  targetUser?: PublicUser;
  action: 'kick' | 'ban' | 'unban' | 'promote' | 'demote' | 'mute' | 'unmute';
  reason?: string;
  duration?: number; // минуты для временных действий
  expiresAt?: Date;
}

// Бан пользователя в чате
export interface ChatBan extends BaseEntity {
  chatId: string;
  userId: string;
  user?: PublicUser;
  bannedBy: string;
  banner?: PublicUser;
  reason?: string;
  expiresAt?: Date;
  isActive: boolean;
}

// История изменений чата
export interface ChatHistory extends BaseEntity {
  chatId: string;
  userId: string;
  user?: PublicUser;
  action: string;
  changes: any;
  description: string;
}

// Шаблоны сообщений для чата
export interface ChatTemplate {
  id: string;
  chatId: string;
  name: string;
  content: string;
  createdBy: string;
  creator?: PublicUser;
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
}

// Категории чатов
export interface ChatCategory {
  id: string;
  userId: string;
  name: string;
  color: string;
  chatIds: string[];
  order: number;
  createdAt: Date;
}

// Черновик сообщения в чате
export interface ChatDraft {
  chatId: string;
  userId: string;
  content: string;
  replyToMessageId?: string;
  savedAt: Date;
}

// Экспорт всех типов чата
export type {
  Chat,
  ChatMember,
  ChatPermissions,
  ChatSettings,
  CreateChatData,
  UpdateChatData,
  ChatInvite,
  InviteChatData,
  ChatListItem,
  ChatSearchResult,
  ChatSearchParams,
  ChatStats,
  ArchivedChat,
  PinnedChat,
  ChatNotification,
  ChatAdminAction,
  ChatBan,
  ChatHistory,
  ChatTemplate,
  ChatCategory,
  ChatDraft
};