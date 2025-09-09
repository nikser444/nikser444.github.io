export interface IMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderUsername: string;
  senderAvatar?: string;
  type: MessageType;
  content: string;
  metadata?: IMessageMetadata;
  attachments: IMessageAttachment[];
  replyTo?: IMessageReply;
  reactions: IMessageReaction[];
  mentions: IMessageMention[];
  isEdited: boolean;
  editedAt?: Date;
  isPinned: boolean;
  pinnedAt?: Date;
  pinnedBy?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  readBy: IMessageRead[];
  deliveredTo: IMessageDelivery[];
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
  VOICE = 'voice',
  LOCATION = 'location',
  CONTACT = 'contact',
  STICKER = 'sticker',
  GIF = 'gif',
  POLL = 'poll',
  SYSTEM = 'system',
  CALL = 'call'
}

export interface IMessageMetadata {
  // For text messages
  formatting?: ITextFormatting[];
  
  // For media messages
  duration?: number; // for audio/video
  dimensions?: { width: number; height: number }; // for images/videos
  size?: number; // file size in bytes
  thumbnail?: string; // thumbnail URL for videos/images
  
  // For location messages
  latitude?: number;
  longitude?: number;
  address?: string;
  
  // For contact messages
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  
  // For system messages
  systemEventType?: SystemEventType;
  systemEventData?: any;
  
  // For call messages
  callDuration?: number;
  callType?: 'audio' | 'video';
  callStatus?: 'completed' | 'missed' | 'declined';
}

export interface ITextFormatting {
  type: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'link';
  start: number;
  end: number;
  url?: string; // for links
}

export enum SystemEventType {
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  USER_ADDED = 'user_added',
  USER_REMOVED = 'user_removed',
  CHAT_CREATED = 'chat_created',
  CHAT_NAME_CHANGED = 'chat_name_changed',
  CHAT_AVATAR_CHANGED = 'chat_avatar_changed',
  USER_ROLE_CHANGED = 'user_role_changed'
}

export interface IMessageAttachment {
  id: string;
  messageId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
  };
  uploadedAt: Date;
}

export interface IMessageReply {
  messageId: string;
  senderId: string;
  senderUsername: string;
  content: string;
  type: MessageType;
}

export interface IMessageReaction {
  id: string;
  messageId: string;
  userId: string;
  username: string;
  emoji: string;
  createdAt: Date;
}

export interface IMessageMention {
  id: string;
  messageId: string;
  userId: string;
  username: string;
  start: number;
  end: number;
}

export interface IMessageRead {
  messageId: string;
  userId: string;
  readAt: Date;
}

export interface IMessageDelivery {
  messageId: string;
  userId: string;
  deliveredAt: Date;
}

export interface IMessageCreateInput {
  chatId: string;
  type: MessageType;
  content: string;
  attachments?: File[];
  replyToMessageId?: string;
  mentions?: string[]; // user IDs
  metadata?: Partial<IMessageMetadata>;
}

export interface IMessageUpdateInput {
  content?: string;
  metadata?: Partial<IMessageMetadata>;
}

export interface IMessageSearchQuery {
  query: string;
  chatId?: string;
  senderId?: string;
  type?: MessageType;
  startDate?: Date;
  endDate?: Date;
  hasAttachments?: boolean;
  limit?: number;
  offset?: number;
}

export interface IMessageSearchResult {
  messages: IMessage[];
  total: number;
  hasMore: boolean;
}

export interface IMessageListQuery {
  chatId: string;
  limit?: number;
  before?: string; // message ID
  after?: string; // message ID
}

export interface IMessageStats {
  total: number;
  byType: Record<MessageType, number>;
  totalAttachments: number;
  totalSize: number; // in bytes
}

export interface IPollOption {
  id: string;
  text: string;
  votes: IPollVote[];
  voteCount: number;
}

export interface IPollVote {
  userId: string;
  username: string;
  votedAt: Date;
}

export interface IPoll {
  id: string;
  messageId: string;
  question: string;
  options: IPollOption[];
  allowMultipleChoices: boolean;
  isAnonymous: boolean;
  expiresAt?: Date;
  createdAt: Date;
  totalVotes: number;
}

export interface IMessageBatch {
  messages: IMessage[];
  hasMore: boolean;
  nextCursor?: string;
  totalCount: number;
}

// System message templates
export const SYSTEM_MESSAGE_TEMPLATES: Record<SystemEventType, string> = {
  [SystemEventType.USER_JOINED]: '{username} присоединился к чату',
  [SystemEventType.USER_LEFT]: '{username} покинул чат',
  [SystemEventType.USER_ADDED]: '{username} был добавлен в чат',
  [SystemEventType.USER_REMOVED]: '{username} был удален из чата',
  [SystemEventType.CHAT_CREATED]: 'Чат создан',
  [SystemEventType.CHAT_NAME_CHANGED]: 'Название чата изменено на "{newName}"',
  [SystemEventType.CHAT_AVATAR_CHANGED]: 'Аватар чата изменен',
  [SystemEventType.USER_ROLE_CHANGED]: 'Роль {username} изменена на {newRole}',
};

// Message validation rules
export const MESSAGE_VALIDATION = {
  MAX_TEXT_LENGTH: 4000,
  MAX_ATTACHMENTS: 10,
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_IMAGE_SIZE: 20 * 1024 * 1024,  // 20MB
  MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_AUDIO_SIZE: 50 * 1024 * 1024,  // 50MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],
  ALLOWED_AUDIO_TYPES: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'],
};