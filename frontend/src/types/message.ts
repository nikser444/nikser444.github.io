// frontend/src/types/message.ts
import { BaseEntity, MediaFile } from './base';
import { PublicUser } from './user';

export type MessageType = 
  | 'text' 
  | 'image' 
  | 'video' 
  | 'audio' 
  | 'file' 
  | 'voice' 
  | 'location' 
  | 'contact' 
  | 'poll' 
  | 'system';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message extends BaseEntity {
  chatId: string;
  senderId: string;
  sender: PublicUser;
  type: MessageType;
  content: string;
  status: MessageStatus;
  isEdited: boolean;
  editedAt?: string;
  replyTo?: Message;
  forwardedFrom?: ForwardInfo;
  attachments: MessageAttachment[];
  mentions: MessageMention[];
  reactions: MessageReaction[];
  isPinned: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  deletedFor: 'everyone' | 'sender' | null;
}

export interface MessageAttachment extends MediaFile {
  type: 'image' | 'video' | 'audio' | 'file' | 'voice';
  duration?: number; // for audio/video
  waveform?: number[]; // for voice messages
  width?: number; // for images/videos
  height?: number; // for images/videos
}

export interface MessageMention {
  userId: string;
  user: PublicUser;
  startIndex: number;
  length: number;
}

export interface MessageReaction {
  emoji: string;
  users: PublicUser[];
  count: number;
  hasUserReacted: boolean;
}

export interface ForwardInfo {
  originalSenderId: string;
  originalSender: PublicUser;
  originalChatId: string;
  originalMessageId: string;
  forwardedAt: string;
}

export interface SendMessageData {
  chatId: string;
  type: MessageType;
  content: string;
  replyToId?: string;
  attachments?: File[];
  mentions?: string[];
}

export interface EditMessageData {
  messageId: string;
  content: string;
  attachments?: File[];
}

export interface VoiceMessageData {
  chatId: string;
  audioBlob: Blob;
  duration: number;
  waveform: number[];
}

export interface LocationMessage {
  latitude: number;
  longitude: number;
  address?: string;
  venue?: {
    name: string;
    address: string;
  };
}

export interface ContactMessage {
  name: string;
  phone: string;
  userId?: string;
}

export interface PollMessage {
  question: string;
  options: PollOption[];
  isMultipleChoice: boolean;
  isAnonymous: boolean;
  closesAt?: string;
  isClosed: boolean;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[];
  hasUserVoted: boolean;
}

export interface SystemMessage extends Omit<Message, 'senderId' | 'sender'> {
  type: 'system';
  systemType: SystemMessageType;
  data: Record<string, any>;
}

export type SystemMessageType = 
  | 'user_joined'
  | 'user_left'
  | 'user_added'
  | 'user_removed'
  | 'chat_created'
  | 'chat_title_changed'
  | 'chat_description_changed'
  | 'chat_avatar_changed'
  | 'message_pinned'
  | 'message_unpinned';

export interface MessageSearchResult {
  message: Message;
  chat: {
    id: string;
    name?: string;
    type: string;
  };
  highlights: string[];
}

export interface MessageFilter {
  type?: MessageType;
  senderId?: string;
  hasAttachments?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface MessageDraft {
  chatId: string;
  content: string;
  replyToId?: string;
  editMessageId?: string;
  attachments: File[];
  mentions: string[];
  timestamp: string;
}

export interface TypingIndicator {
  chatId: string;
  userId: string;
  user: PublicUser;
  isTyping: boolean;
  timestamp: string;
}

export interface MessageReadReceipt {
  messageId: string;
  userId: string;
  readAt: string;
}