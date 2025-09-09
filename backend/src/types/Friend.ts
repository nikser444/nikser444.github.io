import { BaseEntity, FriendRequestStatus } from './Base';
import { PublicUser } from './User';

// Заявка в друзья
export interface FriendRequest extends BaseEntity {
  senderId: string;
  sender?: PublicUser;
  receiverId: string;
  receiver?: PublicUser;
  status: FriendRequestStatus;
  message?: string;
  respondedAt?: Date;
  expiresAt?: Date;
  isExpired: boolean;
}

// Дружба между пользователями
export interface Friendship extends BaseEntity {
  userId1: string;
  user1?: PublicUser;
  userId2: string;
  user2?: PublicUser;
  requestId: string;
  becameFriendsAt: Date;
  isActive: boolean;
  blockedBy?: string;
  blockedAt?: Date;
  commonChats?: string[];
  interactionCount: number;
  lastInteraction?: Date;
}

// Данные для отправки заявки в друзья
export interface SendFriendRequestData {
  receiverEmail?: string;
  receiverUsername?: string;
  receiverId?: string;
  message?: string;
}

// Ответ на заявку в друзья
export interface RespondFriendRequestData {
  requestId: string;
  action: 'accept' | 'decline' | 'block';
  message?: string;
}

// Информация о друге для списка
export interface FriendListItem {
  id: string;
  userId: string;
  friend: PublicUser;
  isOnline: boolean;
  lastSeen: Date;
  mutualFriends: number;
  sharedChats: string[];
  canCall: boolean;
  canMessage: boolean;
  isFavorite: boolean;
  nickname?: string;
  notes?: string;
  becameFriendsAt: Date;
}

// Результат поиска друзей
export interface FriendSearchResult {
  friends: FriendListItem[];
  total: number;
  hasMore: boolean;
}

// Параметры поиска друзей
export interface FriendSearchParams {
  query: string;
  onlineOnly?: boolean;
  favorites?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'lastSeen' | 'becameFriends';
  sortOrder?: 'asc' | 'desc';
}

// Предложения друзей
export interface FriendSuggestion {
  user: PublicUser;
  reason: 'mutual_friends' | 'contacts' | 'same_groups' | 'location' | 'interests';
  score: number;
  mutualFriends?: PublicUser[];
  mutualChats?: string[];
  details?: any;
}

// Заблокированный пользователь
export interface BlockedUser extends BaseEntity {
  blockerId: string;
  blocker?: PublicUser;
  blockedId: string;
  blocked?: PublicUser;
  reason?: string;
  blockedAt: Date;
  isActive: boolean;
}

// Данные для блокировки пользователя
export interface BlockUserData {
  userId: string;
  reason?: string;
  deleteHistory?: boolean;
  reportUser?: boolean;
}

// Избранные друзья
export interface FavoriteFriend {
  userId: string;
  friendId: string;
  friend?: PublicUser;
  addedAt: Date;
  order: number;
}

// Никнейм друга
export interface FriendNickname {
  userId: string;
  friendId: string;
  nickname: string;
  updatedAt: Date;
}

// Заметки о друге
export interface FriendNote {
  userId: string;
  friendId: string;
  note: string;
  isPrivate: boolean;
  updatedAt: Date;
}

// Группы друзей
export interface FriendGroup extends BaseEntity {
  userId: string;
  name: string;
  description?: string;
  color: string;
  friendIds: string[];
  isDefault: boolean;
  order: number;
}

// Член группы друзей
export interface FriendGroupMember {
  groupId: string;
  friendId: string;
  friend?: PublicUser;
  addedAt: Date;
  addedBy: string;
}

// Настройки приватности для друзей
export interface FriendPrivacySettings {
  userId: string;
  friendId: string;
  canSeeOnlineStatus: boolean;
  canSeeLastSeen: boolean;
  canSeeProfile: boolean;
  canCall: boolean;
  canMessage: boolean;
  canSeeStories: boolean;
  updatedAt: Date;
}

// Статистика дружбы
export interface FriendshipStats {
  totalFriends: number;
  onlineFriends: number;
  mutualFriends: number;
  pendingRequests: number;
  sentRequests: number;
  blockedUsers: number;
  friendsSince: { [year: string]: number };
  topMutualFriends: PublicUser[];
}

// История взаимодействий с другом
export interface FriendInteraction extends BaseEntity {
  userId: string;
  friendId: string;
  type: 'message' | 'call' | 'video_call' | 'game' | 'shared_content';
  details?: any;
  timestamp: Date;
}

// Рекомендации на основе друзей
export interface FriendRecommendation {
  type: 'chat' | 'group' | 'event' | 'content';
  title: string;
  description: string;
  friends: PublicUser[];
  actionUrl?: string;
  createdAt: Date;
}

// Синхронизация контактов
export interface ContactSync {
  userId: string;
  contacts: {
    name: string;
    phone?: string;
    email?: string;
  }[];
  matches: {
    contact: any;
    user: PublicUser;
    confidence: number;
  }[];
  syncedAt: Date;
}

// Приглашение по ссылке
export interface FriendInviteLink extends BaseEntity {
  userId: string;
  user?: PublicUser;
  token: string;
  url: string;
  maxUses?: number;
  usedCount: number;
  expiresAt?: Date;
  isActive: boolean;
  description?: string;
}

// Использование пригласительной ссылки
export interface InviteLinkUsage {
  linkId: string;
  link?: FriendInviteLink;
  usedBy: string;
  user?: PublicUser;
  usedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

// Экспорт всех типов системы друзей
export type {
  FriendRequest,
  Friendship,
  SendFriendRequestData,
  RespondFriendRequestData,
  FriendListItem,
  FriendSearchResult,
  FriendSearchParams,
  FriendSuggestion,
  BlockedUser,
  BlockUserData,
  FavoriteFriend,
  FriendNickname,
  FriendNote,
  FriendGroup,
  FriendGroupMember,
  FriendPrivacySettings,
  FriendshipStats,
  FriendInteraction,
  FriendRecommendation,
  ContactSync,
  FriendInviteLink,
  InviteLinkUsage
};