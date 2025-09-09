export interface IUser {
  id: string;
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  status: UserStatus;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  settings: IUserSettings;
}

export enum UserStatus {
  ONLINE = 'online',
  AWAY = 'away',
  BUSY = 'busy',
  INVISIBLE = 'invisible',
  OFFLINE = 'offline'
}

export interface IUserSettings {
  theme: 'light' | 'dark';
  language: string;
  notifications: {
    sound: boolean;
    desktop: boolean;
    email: boolean;
    friendRequests: boolean;
    messages: boolean;
  };
  privacy: {
    showLastSeen: boolean;
    showOnlineStatus: boolean;
    allowCallsFrom: 'everyone' | 'friends' | 'nobody';
  };
}

export interface IUserProfile {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  status: UserStatus;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
}

export interface IUserCreateInput {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface IUserUpdateInput {
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  status?: UserStatus;
  settings?: Partial<IUserSettings>;
}

export interface IUserSearchResult {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isOnline: boolean;
}

export interface ILoginCredentials {
  email: string;
  password: string;
}

export interface IRegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
}

export interface IUserStats {
  totalFriends: number;
  totalChats: number;
  totalMessages: number;
  totalCalls: number;
}

// Default settings for new users
export const DEFAULT_USER_SETTINGS: IUserSettings = {
  theme: 'light',
  language: 'ru',
  notifications: {
    sound: true,
    desktop: true,
    email: true,
    friendRequests: true,
    messages: true,
  },
  privacy: {
    showLastSeen: true,
    showOnlineStatus: true,
    allowCallsFrom: 'friends',
  },
};