// frontend/src/types/index.ts
// Центральный экспорт всех типов для удобного импорта

// Base types
export * from './base';

// User types
export * from './user';

// Chat types  
export * from './chat';

// Message types
export * from './message';

// Friend types
export * from './friend';

// Call types
export * from './call';

// Notification types
export * from './notification';

// API types
export * from './api';

// Re-export commonly used type combinations
export type {
  // User related
  User,
  PublicUser,
  AuthUser,
  UserProfile,
  LoginCredentials,
  RegisterData,
  
  // Chat related
  Chat,
  DirectChat,
  GroupChat,
  ChatMember,
  ChatType,
  CreateChatData,
  
  // Message related
  Message,
  MessageType,
  MessageStatus,
  MessageAttachment,
  SendMessageData,
  
  // Friend related
  Friend,
  FriendRequest,
  Friendship,
  FriendshipStatus,
  SendFriendRequestData,
  
  // Call related
  Call,
  CallType,
  CallStatus,
  CallParticipant,
  InitiateCallData,
  
  // Notification related
  Notification,
  NotificationType,
  NotificationSettings,
  
  // API related
  ApiResponse,
  PaginatedResponse,
  ApiError,
  
  // Base types
  BaseEntity,
  LoadingState,
  Status,
  Theme,
  Language
} from './base';

export type {
  User,
  PublicUser,
  AuthUser,
  UserProfile
} from './user';

export type {
  Chat,
  DirectChat,
  GroupChat,
  ChatMember
} from './chat';

export type {
  Message,
  MessageAttachment,
  MessageReaction
} from './message';

export type {
  Friend,
  FriendRequest,
  Friendship
} from './friend';

export type {
  Call,
  CallParticipant,
  Conference
} from './call';

export type {
  Notification,
  NotificationSettings
} from './notification';

export type {
  ApiResponse,
  PaginatedResponse,
  AuthAPI,
  UserAPI,
  ChatAPI,
  MessageAPI,
  FriendAPI,
  CallAPI,
  NotificationAPI
} from './api';

// Common type guards
export const isDirectChat = (chat: Chat): chat is DirectChat => chat.type === 'direct';
export const isGroupChat = (chat: Chat): chat is GroupChat => chat.type === 'group';
export const isSystemMessage = (message: Message): message is any => message.type === 'system';
export const isMediaMessage = (message: Message): boolean => 
  ['image', 'video', 'audio', 'file', 'voice'].includes(message.type);

// Utility types for common patterns
export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Event handler types
export type EventHandler<T = any> = (data: T) => void;
export type AsyncEventHandler<T = any> = (data: T) => Promise<void>;

// Hook return types
export interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  reset: () => void;
}

export interface UsePaginationState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

// Form types
export interface FormState<T = any> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

export type FormHandler<T> = {
  handleChange: (field: keyof T) => (value: any) => void;
  handleBlur: (field: keyof T) => () => void;
  handleSubmit: (onSubmit: (values: T) => Promise<void> | void) => (e?: React.FormEvent) => Promise<void>;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  reset: () => void;
  validate: () => boolean;
};

// Component props types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
}

export interface LoadingComponentProps extends BaseComponentProps {
  loading?: boolean;
  error?: string | null;
  retry?: () => void;
}

export interface ModalComponentProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
}

// Store state types
export interface RootState {
  auth: AuthState;
  user: UserState;
  chats: ChatsState;
  messages: MessagesState;
  friends: FriendsState;
  calls: CallsState;
  notifications: NotificationsState;
  ui: UIState;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface UserState {
  profile: User | null;
  settings: any;
  loading: boolean;
  error: string | null;
}

export interface ChatsState {
  list: Chat[];
  active: Chat | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
}

export interface MessagesState {
  byChat: Record<string, Message[]>;
  loading: Record<string, boolean>;
  error: string | null;
  hasMore: Record<string, boolean>;
}

export interface FriendsState {
  list: Friend[];
  requests: {
    sent: FriendRequest[];
    received: FriendRequest[];
  };
  loading: boolean;
  error: string | null;
}

export interface CallsState {
  active: Call | null;
  history: CallHistory[];
  loading: boolean;
  error: string | null;
}

export interface NotificationsState {
  list: Notification[];
  unreadCount: number;
  settings: NotificationSettings | null;
  loading: boolean;
  error: string | null;
}

export interface UIState {
  theme: Theme;
  language: Language;
  sidebarCollapsed: boolean;
  activeModal: string | null;
  toasts: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
  }>;
}