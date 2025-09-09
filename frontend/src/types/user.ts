// frontend/src/types/user.ts
import { BaseEntity, Status, AppSettings } from './base';

export interface User extends BaseEntity {
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  status: Status;
  lastSeen: string;
  isOnline: boolean;
  bio?: string;
  phone?: string;
  isEmailVerified: boolean;
  settings: AppSettings;
}

export interface UserProfile extends User {
  friendsCount: number;
  chatsCount: number;
  joinDate: string;
}

export interface PublicUser {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  status: Status;
  lastSeen: string;
  isOnline: boolean;
  bio?: string;
}

export interface UserSearchResult extends PublicUser {
  isFriend: boolean;
  isPendingRequest: boolean;
  mutualFriends: number;
}

export interface AuthUser extends User {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
  acceptTerms: boolean;
}

export interface UpdateProfileData {
  username?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  phone?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserStatus {
  userId: string;
  status: Status;
  lastSeen: string;
  isOnline: boolean;
}

export interface UserActivity {
  userId: string;
  action: 'typing' | 'recording' | 'uploading' | 'idle';
  chatId?: string;
  timestamp: string;
}

export interface BlockedUser extends PublicUser {
  blockedAt: string;
  reason?: string;
}

export interface UserPreferences {
  notifications: {
    messages: boolean;
    friendRequests: boolean;
    calls: boolean;
    groupMessages: boolean;
    sound: boolean;
    vibration: boolean;
  };
  privacy: {
    lastSeen: 'everyone' | 'friends' | 'nobody';
    profilePhoto: 'everyone' | 'friends' | 'nobody';
    status: 'everyone' | 'friends' | 'nobody';
  };
  chat: {
    enterToSend: boolean;
    showPreview: boolean;
    fontSize: 'small' | 'medium' | 'large';
    theme: 'light' | 'dark' | 'auto';
  };
}