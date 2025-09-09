// frontend/src/types/api.ts
import { ApiResponse, PaginatedResponse, SearchParams } from './base';
import { User, AuthUser, LoginCredentials, RegisterData, UpdateProfileData, ChangePasswordData } from './user';
import { Chat, CreateChatData, UpdateChatData, ChatMember } from './chat';
import { Message, SendMessageData, EditMessageData, VoiceMessageData } from './message';
import { Friend, FriendRequest, SendFriendRequestData, RespondToFriendRequestData } from './friend';
import { Call, InitiateCallData, JoinCallData, CallHistory } from './call';
import { Notification, NotificationSettings } from './notification';

// Auth API Types
export interface AuthAPI {
  login: (credentials: LoginCredentials) => Promise<ApiResponse<AuthUser>>;
  register: (data: RegisterData) => Promise<ApiResponse<AuthUser>>;
  logout: () => Promise<ApiResponse<void>>;
  refreshToken: () => Promise<ApiResponse<{ accessToken: string }>>;
  verifyEmail: (token: string) => Promise<ApiResponse<void>>;
  forgotPassword: (email: string) => Promise<ApiResponse<void>>;
  resetPassword: (token: string, password: string) => Promise<ApiResponse<void>>;
  changePassword: (data: ChangePasswordData) => Promise<ApiResponse<void>>;
}

// User API Types
export interface UserAPI {
  getProfile: () => Promise<ApiResponse<User>>;
  updateProfile: (data: UpdateProfileData) => Promise<ApiResponse<User>>;
  uploadAvatar: (file: File) => Promise<ApiResponse<{ avatarUrl: string }>>;
  deleteAvatar: () => Promise<ApiResponse<void>>;
  getUserById: (id: string) => Promise<ApiResponse<User>>;
  searchUsers: (params: UserSearchParams) => Promise<PaginatedResponse<User>>;
  blockUser: (userId: string) => Promise<ApiResponse<void>>;
  unblockUser: (userId: string) => Promise<ApiResponse<void>>;
  getBlockedUsers: () => Promise<ApiResponse<User[]>>;
  updateStatus: (status: string) => Promise<ApiResponse<void>>;
  updateSettings: (settings: any) => Promise<ApiResponse<void>>;
}

export interface UserSearchParams extends SearchParams {
  email?: string;
  username?: string;
  excludeFriends?: boolean;
  onlineOnly?: boolean;
}

// Chat API Types
export interface ChatAPI {
  getChats: (params?: ChatListParams) => Promise<PaginatedResponse<Chat>>;
  getChatById: (id: string) => Promise<ApiResponse<Chat>>;
  createChat: (data: CreateChatData) => Promise<ApiResponse<Chat>>;
  updateChat: (id: string, data: UpdateChatData) => Promise<ApiResponse<Chat>>;
  deleteChat: (id: string) => Promise<ApiResponse<void>>;
  leaveChat: (id: string) => Promise<ApiResponse<void>>;
  getChatMembers: (id: string, params?: SearchParams) => Promise<PaginatedResponse<ChatMember>>;
  addMembers: (chatId: string, userIds: string[]) => Promise<ApiResponse<void>>;
  removeMembers: (chatId: string, userIds: string[]) => Promise<ApiResponse<void>>;
  updateMemberRole: (chatId: string, userId: string, role: string) => Promise<ApiResponse<void>>;
  muteChat: (id: string, until?: string) => Promise<ApiResponse<void>>;
  unmuteChat: (id: string) => Promise<ApiResponse<void>>;
  pinChat: (id: string) => Promise<ApiResponse<void>>;
  unpinChat: (id: string) => Promise<ApiResponse<void>>;
  archiveChat: (id: string) => Promise<ApiResponse<void>>;
  unarchiveChat: (id: string) => Promise<ApiResponse<void>>;
}

export interface ChatListParams extends SearchParams {
  type?: string;
  hasUnread?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  participantId?: string;
}

// Message API Types
export interface MessageAPI {
  getMessages: (chatId: string, params?: MessageListParams) => Promise<PaginatedResponse<Message>>;
  getMessageById: (id: string) => Promise<ApiResponse<Message>>;
  sendMessage: (data: SendMessageData) => Promise<ApiResponse<Message>>;
  editMessage: (id: string, data: EditMessageData) => Promise<ApiResponse<Message>>;
  deleteMessage: (id: string, forEveryone?: boolean) => Promise<ApiResponse<void>>;
  forwardMessages: (messageIds: string[], chatIds: string[]) => Promise<ApiResponse<void>>;
  pinMessage: (id: string) => Promise<ApiResponse<void>>;
  unpinMessage: (id: string) => Promise<ApiResponse<void>>;
  reactToMessage: (id: string, emoji: string) => Promise<ApiResponse<void>>;
  removeReaction: (id: string, emoji: string) => Promise<ApiResponse<void>>;
  markAsRead: (chatId: string, messageIds: string[]) => Promise<ApiResponse<void>>;
  sendVoiceMessage: (data: VoiceMessageData) => Promise<ApiResponse<Message>>;
  uploadAttachment: (file: File, type: string) => Promise<ApiResponse<{ url: string; id: string }>>;
  searchMessages: (params: MessageSearchParams) => Promise<PaginatedResponse<Message>>;
}

export interface MessageListParams extends SearchParams {
  before?: string;
  after?: string;
  type?: string;
  senderId?: string;
  hasAttachments?: boolean;
}

export interface MessageSearchParams extends SearchParams {
  chatId?: string;
  senderId?: string;
  type?: string;
  hasAttachments?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

// Friend API Types
export interface FriendAPI {
  getFriends: (params?: FriendListParams) => Promise<PaginatedResponse<Friend>>;
  getFriendRequests: (type?: 'sent' | 'received') => Promise<ApiResponse<FriendRequest[]>>;
  sendFriendRequest: (data: SendFriendRequestData) => Promise<ApiResponse<FriendRequest>>;
  respondToFriendRequest: (data: RespondToFriendRequestData) => Promise<ApiResponse<void>>;
  removeFriend: (userId: string) => Promise<ApiResponse<void>>;
  getFriendSuggestions: () => Promise<ApiResponse<Friend[]>>;
  importContacts: (contacts: any[]) => Promise<ApiResponse<any[]>>;
  addToFavorites: (userId: string) => Promise<ApiResponse<void>>;
  removeFromFavorites: (userId: string) => Promise<ApiResponse<void>>;
}

export interface FriendListParams extends SearchParams {
  status?: string;
  isOnline?: boolean;
  isFavorite?: boolean;
}

// Call API Types
export interface CallAPI {
  getCalls: (params?: CallListParams) => Promise<PaginatedResponse<Call>>;
  getCallById: (id: string) => Promise<ApiResponse<Call>>;
  initiateCall: (data: InitiateCallData) => Promise<ApiResponse<Call>>;
  joinCall: (data: JoinCallData) => Promise<ApiResponse<void>>;
  leaveCall: (callId: string) => Promise<ApiResponse<void>>;
  endCall: (callId: string) => Promise<ApiResponse<void>>;
  acceptCall: (callId: string) => Promise<ApiResponse<void>>;
  declineCall: (callId: string) => Promise<ApiResponse<void>>;
  getCallHistory: (params?: SearchParams) => Promise<PaginatedResponse<CallHistory>>;
  updateMediaState: (callId: string, state: any) => Promise<ApiResponse<void>>;
  createConference: (data: any) => Promise<ApiResponse<Call>>;
}

export interface CallListParams extends SearchParams {
  type?: string;
  status?: string;
  participantId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Notification API Types
export interface NotificationAPI {
  getNotifications: (params?: NotificationListParams) => Promise<PaginatedResponse<Notification>>;
  getNotificationById: (id: string) => Promise<ApiResponse<Notification>>;
  markAsRead: (ids: string[]) => Promise<ApiResponse<void>>;
  markAllAsRead: () => Promise<ApiResponse<void>>;
  deleteNotifications: (ids: string[]) => Promise<ApiResponse<void>>;
  getSettings: () => Promise<ApiResponse<NotificationSettings>>;
  updateSettings: (settings: NotificationSettings) => Promise<ApiResponse<void>>;
  subscribeToPush: (subscription: any) => Promise<ApiResponse<void>>;
  unsubscribeFromPush: () => Promise<ApiResponse<void>>;
  testNotification: (type: string) => Promise<ApiResponse<void>>;
}

export interface NotificationListParams extends SearchParams {
  type?: string;
  isRead?: boolean;
  priority?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Upload API Types
export interface UploadAPI {
  uploadFile: (file: File, type: 'avatar' | 'attachment' | 'media') => Promise<ApiResponse<UploadResult>>;
  uploadFiles: (files: File[], type: string) => Promise<ApiResponse<UploadResult[]>>;
  deleteFile: (fileId: string) => Promise<ApiResponse<void>>;
  getUploadUrl: (filename: string, type: string) => Promise<ApiResponse<{ uploadUrl: string; fileId: string }>>;
}

export interface UploadResult {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

// WebSocket API Types
export interface SocketEvents {
  // Connection events
  'connect': () => void;
  'disconnect': (reason: string) => void;
  'error': (error: any) => void;
  
  // Message events
  'message:new': (message: Message) => void;
  'message:updated': (message: Message) => void;
  'message:deleted': (messageId: string) => void;
  'message:reaction': (data: { messageId: string; emoji: string; user: User }) => void;
  
  // Chat events
  'chat:updated': (chat: Chat) => void;
  'chat:member:added': (data: { chatId: string; member: ChatMember }) => void;
  'chat:member:removed': (data: { chatId: string; userId: string }) => void;
  'chat:typing': (data: { chatId: string; userId: string; isTyping: boolean }) => void;
  
  // Call events
  'call:incoming': (call: Call) => void;
  'call:started': (call: Call) => void;
  'call:ended': (callId: string) => void;
  'call:participant:joined': (data: { callId: string; participant: any }) => void;
  'call:participant:left': (data: { callId: string; userId: string }) => void;
  
  // User events
  'user:status': (data: { userId: string; status: string; lastSeen: string }) => void;
  'user:online': (userId: string) => void;
  'user:offline': (userId: string) => void;
  
  // Friend events
  'friend:request': (request: FriendRequest) => void;
  'friend:accepted': (friendship: Friend) => void;
  'friend:removed': (userId: string) => void;
  
  // Notification events
  'notification:new': (notification: Notification) => void;
  'notification:updated': (notification: Notification) => void;
}

// Error Types
export interface ApiError {
  message: string;
  code: string;
  status: number;
  errors?: Record<string, string[]>;
  details?: any;
}

export interface ValidationError extends ApiError {
  field: string;
  value: any;
  constraint: string;
}

// Request/Response interceptors
export interface RequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  data?: any;
  params?: Record<string, any>;
  timeout?: number;
  retry?: boolean;
  retryCount?: number;
}

export interface ResponseData<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
}