import { BaseEntity, MessageType, MessageStatus, FileInfo, Location } from './Base';
import { PublicUser } from './User';

// Основной интерфейс сообщения
export interface Message extends BaseEntity {
  chatId: string;
  senderId: string;
  sender?: PublicUser;
  content: string;
  type: MessageType;
  status: MessageStatus;
  replyToMessageId?: string;
  replyToMessage?: Message;
  forwardedFromChatId?: string;
  forwardedFromMessageId?: string;
  forwardedMessage?: Message;
  editedAt?: Date;
  isEdited: boolean;
  isPinned: boolean;
  pinnedAt?: Date;
  pinnedBy?: string;
  reactions: MessageReaction[];
  mentions: MessageMention[];
  attachments: MessageAttachment[];
  metadata?: MessageMetadata;
  expiresAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}

// Реакции на сообщение
export interface MessageReaction {
  emoji: string;
  count: number;
  userIds: string[];
  users?: PublicUser[];
}

// Упоминания в сообщении
export interface MessageMention {
  userId: string;
  user?: PublicUser;
  startIndex: number;
  length: number;
  username: string;
}

// Вложения сообщения
export interface MessageAttachment {
  id: string;
  file: FileInfo;
  type: 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact';
  thumbnail?: FileInfo;
  duration?: number; // для аудио/видео в секундах
  dimensions?: {
    width: number;
    height: number;
  };
  location?: Location;
  contact?: MessageContact;
}

// Контакт в сообщении
export interface MessageContact {
  name: string;
  phone?: string;
  email?: string;
  avatar?: FileInfo;
}

// Метаданные сообщения
export interface MessageMetadata {
  linkPreview?: LinkPreview;
  poll?: MessagePoll;
  location?: Location;
  quotedText?: string;
  systemAction?: SystemAction;
}

// Превью ссылки
export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: FileInfo;
  siteName?: string;
  favicon?: string;
}

// Опрос в сообщении
export interface MessagePoll {
  id: string;
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  isAnonymous: boolean;
  expiresAt?: Date;
  totalVotes: number;
  isExpired: boolean;
}

// Вариант ответа в опросе
export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
  percentage: number;
  voters?: PublicUser[];
}

// Голос в опросе
export interface PollVote {
  pollId: string;
  optionId: string;
  userId: string;
  user?: PublicUser;
  votedAt: Date;
}

// Системное действие
export interface SystemAction {
  type: 'user_joined' | 'user_left' | 'chat_created' | 'chat_renamed' | 'avatar_changed' | 'member_promoted' | 'member_demoted';
  actorId?: string;
  actor?: PublicUser;
  targetId?: string;
  target?: PublicUser;
  oldValue?: string;
  newValue?: string;
}

// Данные для создания сообщения
export interface CreateMessageData {
  chatId: string;
  content: string;
  type: MessageType;
  replyToMessageId?: string;
  attachments?: MessageAttachmentData[];
  mentions?: MessageMentionData[];
  metadata?: Partial<MessageMetadata>;
  expiresIn?: number; // секунды
}

// Данные вложения при создании
export interface MessageAttachmentData {
  fileId: string;
  type: MessageAttachment['type'];
  thumbnail?: string;
  duration?: number;
  dimensions?: { width: number; height: number; };
  location?: Location;
  contact?: MessageContact;
}

// Данные упоминания при создании
export interface MessageMentionData {
  userId: string;
  startIndex: number;
  length: number;
}

// Данные для обновления сообщения
export interface UpdateMessageData {
  content?: string;
  attachments?: MessageAttachmentData[];
  mentions?: MessageMentionData[];
  metadata?: Partial<MessageMetadata>;
}

// Информация о прочтении сообщения
export interface MessageReadInfo {
  messageId: string;
  userId: string;
  user?: PublicUser;
  readAt: Date;
}

// Статус доставки сообщения
export interface MessageDelivery {
  messageId: string;
  userId: string;
  user?: PublicUser;
  status: MessageStatus;
  timestamp: Date;
}

// История редактирования сообщения
export interface MessageEditHistory {
  messageId: string;
  version: number;
  content: string;
  editedAt: Date;
  editedBy: string;
  editor?: PublicUser;
}

// Результат поиска сообщений
export interface MessageSearchResult {
  messages: Message[];
  total: number;
  hasMore: boolean;
  highlights: { [messageId: string]: string[] };
}

// Параметры поиска сообщений
export interface MessageSearchParams {
  query: string;
  chatId?: string;
  senderId?: string;
  type?: MessageType;
  fromDate?: Date;
  toDate?: Date;
  hasAttachments?: boolean;
  limit?: number;
  offset?: number;
}

// Черновик сообщения
export interface MessageDraft {
  chatId: string;
  userId: string;
  content: string;
  replyToMessageId?: string;
  attachments?: MessageAttachmentData[];
  mentions?: MessageMentionData[];
  savedAt: Date;
}

// Пересылаемое сообщение
export interface ForwardMessageData {
  messageIds: string[];
  toChatIds: string[];
  withCaption?: boolean;
  caption?: string;
}

// Статистика сообщений
export interface MessageStats {
  totalMessages: number;
  messagesByType: { [key in MessageType]: number };
  messagesByDay: { date: string; count: number; }[];
  topSenders: {
    userId: string;
    username: string;
    count: number;
  }[];
  averageLength: number;
  totalAttachments: number;
}

// Экспорт сообщений
export interface MessageExportData {
  chatId: string;
  messages: Message[];
  exportedAt: Date;
  exportedBy: string;
  format: 'json' | 'html' | 'txt';
}

// Автоматическое удаление сообщений
export interface MessageAutoDelete {
  chatId: string;
  enabled: boolean;
  duration: number; // секунды
  lastCleanup: Date;
}

// Шаблоны быстрых ответов
export interface QuickReply {
  id: string;
  userId: string;
  text: string;
  shortcut: string;
  usageCount: number;
  isActive: boolean;
  createdAt: Date;
}

// Экспорт всех типов сообщений
export type {
  Message,
  MessageReaction,
  MessageMention,
  MessageAttachment,
  MessageContact,
  MessageMetadata,
  LinkPreview,
  MessagePoll,
  PollOption,
  PollVote,
  SystemAction,
  CreateMessageData,
  MessageAttachmentData,
  MessageMentionData,
  UpdateMessageData,
  MessageReadInfo,
  MessageDelivery,
  MessageEditHistory,
  MessageSearchResult,
  MessageSearchParams,
  MessageDraft,
  ForwardMessageData,
  MessageStats,
  MessageExportData,
  MessageAutoDelete,
  QuickReply
};