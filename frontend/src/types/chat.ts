// frontend/src/types/chat.ts
import { BaseEntity } from './base';
import { PublicUser } from './user';
import { Message } from './message';

export type ChatType = 'direct' | 'group' | 'channel' | 'bot';

export interface Chat extends BaseEntity {
  type: ChatType;
  name?: string;
  description?: string;
  avatar?: string;
  isGroup: boolean;
  membersCount: number;
  lastMessage?: Message;
  lastMessageAt?: string;
  unreadCount: number;
  isMuted: boolean;
  isPinned: boolean;
  isArchived: boolean;
  isBlocked?: boolean;
  permissions: ChatPermissions;
}

export interface DirectChat extends Chat {
  type: 'direct';
  participant: PublicUser;
  isOnline: boolean;
  lastSeen?: string;
}

export interface GroupChat extends Chat {
  type: 'group';
  name: string;
  description?: string;
  avatar?: string;
  adminIds: string[];
  createdBy: string;
  inviteLink?: string;
  isPublic: boolean;
  maxMembers: number;
}

export interface ChatMember {
  user: PublicUser;
  role: ChatRole;
  joinedAt: string;
  addedBy?: string;
  permissions: MemberPermissions;
  isOnline: boolean;
  lastSeen?: string;
}

export type ChatRole = 'owner' | 'admin' | 'moderator' | 'member';

export interface ChatPermissions {
  canSendMessages: boolean;
  canSendMedia: boolean;
  canAddMembers: boolean;
  canRemoveMembers: boolean;
  canChangeInfo: boolean;
  canPinMessages: boolean;
  canManagePermissions: boolean;
}

export interface MemberPermissions extends ChatPermissions {
  canLeave: boolean;
}

export interface CreateChatData {
  type: ChatType;
  name?: string;
  description?: string;
  participantIds: string[];
  isPublic?: boolean;
}

export interface UpdateChatData {
  name?: string;
  description?: string;
  avatar?: File;
}

export interface ChatSettings {
  notifications: boolean;
  soundEnabled: boolean;
  showPreview: boolean;
  autoDownload: {
    photos: boolean;
    videos: boolean;
    files: boolean;
  };
  retention: {
    enabled: boolean;
    duration: number; // in days
  };
}

export interface ChatInvite {
  id: string;
  chatId: string;
  chat: Chat;
  inviteLink: string;
  createdBy: PublicUser;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
  usageCount: number;
  maxUsage?: number;
}

export interface JoinChatRequest {
  inviteCode: string;
  message?: string;
}

export interface ChatActivity {
  chatId: string;
  userId: string;
  action: 'typing' | 'recording' | 'uploading';
  timestamp: string;
}

export interface ChatDraft {
  chatId: string;
  content: string;
  replyToId?: string;
  editMessageId?: string;
  attachments?: File[];
  createdAt: string;
}

export interface ChatFilter {
  type?: ChatType;
  hasUnread?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  isMuted?: boolean;
}

export interface ChatListState {
  chats: Chat[];
  loading: boolean;
  error?: string;
  hasMore: boolean;
  filter: ChatFilter;
  searchQuery: string;
}