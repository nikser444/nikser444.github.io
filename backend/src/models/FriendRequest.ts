export interface IFriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendRequestStatus;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
  respondedAt?: Date;
}

export enum FriendRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  BLOCKED = 'blocked'
}

export interface IFriendship {
  id: string;
  userId1: string;
  userId2: string;
  status: FriendshipStatus;
  createdAt: Date;
  updatedAt: Date;
  blockedBy?: string;
  isFavorite1: boolean; // for userId1
  isFavorite2: boolean; // for userId2
}

export enum FriendshipStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked'
}

export interface IFriendRequestWithUser {
  id: string;
  status: FriendRequestStatus;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
  respondedAt?: Date;
  sender: IUserBasicInfo;
  receiver: IUserBasicInfo;
}

export interface IUserBasicInfo {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
  status: string;
}

export interface IFriendInfo {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
  status: string;
  friendshipId: string;
  friendsSince: Date;
  isFavorite: boolean;
  isBlocked: boolean;
  mutualFriends: number;
}

export interface ISendFriendRequestInput {
  receiverEmail: string;
  message?: string;
}

export interface IFriendRequestResponse {
  requestId: string;
  accept: boolean;
}

export interface IFriendRequestListQuery {
  type: 'sent' | 'received';
  status?: FriendRequestStatus;
  limit?: number;
  offset?: number;
}

export interface IFriendListQuery {
  search?: string;
  isOnline?: boolean;
  isFavorite?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'username' | 'lastSeen' | 'friendsSince';
  sortOrder?: 'asc' | 'desc';
}

export interface IFriendStats {
  totalFriends: number;
  onlineFriends: number;
  favoriteFriends: number;
  pendingRequests: number;
  sentRequests: number;
  mutualFriends: number;
}

export interface IBlockedUser {
  id: string;
  userId: string; // who blocked
  blockedUserId: string; // who was blocked
  blockedAt: Date;
  reason?: string;
  blockedUser: IUserBasicInfo;
}

export interface IBlockUserInput {
  userId: string;
  reason?: string;
}

export interface IMutualFriend {
  id: string;
  username: string;
  avatar?: string;
  isOnline: boolean;
}

export interface IFriendSuggestion {
  user: IUserBasicInfo;
  mutualFriends: IMutualFriend[];
  mutualFriendsCount: number;
  reason: FriendSuggestionReason;
}

export enum FriendSuggestionReason {
  MUTUAL_FRIENDS = 'mutual_friends',
  CONTACTS = 'contacts',
  RECENT_ACTIVITY = 'recent_activity',
  COMMON_INTERESTS = 'common_interests'
}

export interface IFriendActivity {
  id: string;
  userId: string;
  friendId: string;
  activityType: FriendActivityType;
  timestamp: Date;
  metadata?: any;
}

export enum FriendActivityType {
  BECAME_FRIENDS = 'became_friends',
  STATUS_CHANGED = 'status_changed',
  AVATAR_CHANGED = 'avatar_changed',
  JOINED_CHAT = 'joined_chat',
  STARTED_CALL = 'started_call'
}

export interface IFriendRequestNotification {
  id: string;
  requestId: string;
  userId: string;
  type: 'friend_request_received' | 'friend_request_accepted' | 'friend_request_declined';
  isRead: boolean;
  createdAt: Date;
  sender: IUserBasicInfo;
}

// Friend request validation rules
export const FRIEND_REQUEST_VALIDATION = {
  MAX_MESSAGE_LENGTH: 500,
  COOLDOWN_MINUTES: 60, // Cannot send another request to same user for 60 minutes
  MAX_PENDING_REQUESTS: 50, // Maximum pending friend requests per user
};

// Friend request templates
export const FRIEND_REQUEST_TEMPLATES = {
  DEFAULT_MESSAGE: 'Привет! Давайте добавимся в друзья в мессенджере.',
  MUTUAL_FRIENDS_MESSAGE: 'Привет! Я видел, что у нас есть общие друзья. Давайте знакомиться!',
  COLLEAGUE_MESSAGE: 'Привет! Мы работаем вместе, было бы здорово поддерживать связь.',
};

// Friendship status helpers
export const FRIENDSHIP_STATUS_LABELS: Record<FriendshipStatus, string> = {
  [FriendshipStatus.ACTIVE]: 'В друзьях',
  [FriendshipStatus.BLOCKED]: 'Заблокирован',
};

export const FRIEND_REQUEST_STATUS_LABELS: Record<FriendRequestStatus, string> = {
  [FriendRequestStatus.PENDING]: 'Ожидает ответа',
  [FriendRequestStatus.ACCEPTED]: 'Принята',
  [FriendRequestStatus.DECLINED]: 'Отклонена',
  [FriendRequestStatus.BLOCKED]: 'Заблокирована',
};