export interface IChat {
  id: string;
  type: ChatType;
  name?: string;
  description?: string;
  avatar?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: ILastMessage;
  isArchived: boolean;
  isPinned: boolean;
  members: IChatMember[];
  settings: IChatSettings;
}

export enum ChatType {
  DIRECT = 'direct',
  GROUP = 'group',
  CHANNEL = 'channel'
}

export interface IChatMember {
  userId: string;
  chatId: string;
  role: ChatMemberRole;
  joinedAt: Date;
  permissions: IChatPermissions;
  isTyping: boolean;
  lastReadMessageId?: string;
  unreadCount: number;
  isMuted: boolean;
  muteUntil?: Date;
}

export enum ChatMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  MEMBER = 'member'
}

export interface IChatPermissions {
  canSendMessages: boolean;
  canSendMedia: boolean;
  canAddMembers: boolean;
  canRemoveMembers: boolean;
  canEditChat: boolean;
  canDeleteMessages: boolean;
  canPinMessages: boolean;
  canManagePermissions: boolean;
}

export interface IChatSettings {
  isPublic: boolean;
  allowInviteLink: boolean;
  requireApproval: boolean;
  maxMembers?: number;
  messageRetention?: number; // days
  allowFileSharing: boolean;
  allowCalls: boolean;
  allowScreenShare: boolean;
}

export interface ILastMessage {
  id: string;
  content: string;
  type: string;
  senderId: string;
  senderUsername: string;
  timestamp: Date;
  isEdited: boolean;
}

export interface IChatCreateInput {
  type: ChatType;
  name?: string;
  description?: string;
  members: string[]; // user IDs
  isPublic?: boolean;
}

export interface IChatUpdateInput {
  name?: string;
  description?: string;
  avatar?: string;
  settings?: Partial<IChatSettings>;
}

export interface IChatListItem {
  id: string;
  type: ChatType;
  name?: string;
  avatar?: string;
  lastMessage?: ILastMessage;
  unreadCount: number;
  isArchived: boolean;
  isPinned: boolean;
  isMuted: boolean;
  isOnline?: boolean; // for direct chats
  members: IChatMemberSummary[];
}

export interface IChatMemberSummary {
  userId: string;
  username: string;
  avatar?: string;
  role: ChatMemberRole;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface IChatInfo {
  id: string;
  type: ChatType;
  name?: string;
  description?: string;
  avatar?: string;
  createdBy: string;
  createdAt: Date;
  membersCount: number;
  members: IChatMemberSummary[];
  settings: IChatSettings;
  isArchived: boolean;
  isPinned: boolean;
}

export interface ITypingIndicator {
  chatId: string;
  userId: string;
  username: string;
  isTyping: boolean;
}

export interface IChatInviteLink {
  id: string;
  chatId: string;
  token: string;
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
}

export interface IJoinChatRequest {
  chatId: string;
  userId: string;
  requestedAt: Date;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
}

// Default permissions for different roles
export const DEFAULT_PERMISSIONS: Record<ChatMemberRole, IChatPermissions> = {
  [ChatMemberRole.OWNER]: {
    canSendMessages: true,
    canSendMedia: true,
    canAddMembers: true,
    canRemoveMembers: true,
    canEditChat: true,
    canDeleteMessages: true,
    canPinMessages: true,
    canManagePermissions: true,
  },
  [ChatMemberRole.ADMIN]: {
    canSendMessages: true,
    canSendMedia: true,
    canAddMembers: true,
    canRemoveMembers: true,
    canEditChat: true,
    canDeleteMessages: true,
    canPinMessages: true,
    canManagePermissions: false,
  },
  [ChatMemberRole.MODERATOR]: {
    canSendMessages: true,
    canSendMedia: true,
    canAddMembers: false,
    canRemoveMembers: false,
    canEditChat: false,
    canDeleteMessages: true,
    canPinMessages: true,
    canManagePermissions: false,
  },
  [ChatMemberRole.MEMBER]: {
    canSendMessages: true,
    canSendMedia: true,
    canAddMembers: false,
    canRemoveMembers: false,
    canEditChat: false,
    canDeleteMessages: false,
    canPinMessages: false,
    canManagePermissions: false,
  },
};

// Default chat settings
export const DEFAULT_CHAT_SETTINGS: IChatSettings = {
  isPublic: false,
  allowInviteLink: true,
  requireApproval: false,
  allowFileSharing: true,
  allowCalls: true,
  allowScreenShare: true,
};