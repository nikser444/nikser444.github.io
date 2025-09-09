// frontend/src/types/friend.ts
import { BaseEntity } from './base';
import { PublicUser } from './user';

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked' | 'declined';

export interface Friendship extends BaseEntity {
  requesterId: string;
  requester: PublicUser;
  addresseeId: string;
  addressee: PublicUser;
  status: FriendshipStatus;
  requestedAt: string;
  respondedAt?: string;
  message?: string;
}

export interface FriendRequest extends BaseEntity {
  senderId: string;
  sender: PublicUser;
  receiverId: string;
  receiver: PublicUser;
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  sentAt: string;
  respondedAt?: string;
}

export interface Friend extends PublicUser {
  friendshipId: string;
  friendsSince: string;
  mutualFriends: number;
  lastInteraction?: string;
  isFavorite: boolean;
  isBlocked: boolean;
}

export interface SendFriendRequestData {
  email?: string;
  username?: string;
  userId?: string;
  message?: string;
}

export interface RespondToFriendRequestData {
  requestId: string;
  action: 'accept' | 'decline';
  message?: string;
}

export interface FriendActivity {
  friendId: string;
  friend: PublicUser;
  activity: ActivityType;
  timestamp: string;
  data?: Record<string, any>;
}

export type ActivityType = 
  | 'status_changed'
  | 'profile_updated' 
  | 'joined_chat'
  | 'shared_media'
  | 'birthday';

export interface FriendSuggestion extends PublicUser {
  reason: SuggestionReason;
  score: number;
  mutualFriends: Friend[];
  mutualChats: number;
}

export type SuggestionReason = 
  | 'mutual_friends'
  | 'contacts'
  | 'location'
  | 'interests'
  | 'frequent_contact';

export interface BlockedFriend extends Friend {
  blockedAt: string;
  blockedBy: string;
  reason?: string;
}

export interface FriendsFilter {
  status?: FriendshipStatus;
  isOnline?: boolean;
  isFavorite?: boolean;
  searchQuery?: string;
  sortBy?: 'name' | 'status' | 'lastSeen' | 'friendsSince';
  sortOrder?: 'asc' | 'desc';
}

export interface FriendsListState {
  friends: Friend[];
  friendRequests: {
    sent: FriendRequest[];
    received: FriendRequest[];
  };
  suggestions: FriendSuggestion[];
  blocked: BlockedFriend[];
  loading: {
    friends: boolean;
    requests: boolean;
    suggestions: boolean;
    actions: Record<string, boolean>;
  };
  error?: string;
  filter: FriendsFilter;
  hasMore: boolean;
}

export interface MutualFriend extends PublicUser {
  friendsSince: string;
  isSharedContact: boolean;
}

export interface FriendStats {
  totalFriends: number;
  onlineFriends: number;
  pendingRequests: number;
  mutualConnections: number;
  recentActivity: FriendActivity[];
}

export interface ContactImport {
  name: string;
  phone?: string;
  email?: string;
  isRegistered: boolean;
  user?: PublicUser;
  isAlreadyFriend: boolean;
}