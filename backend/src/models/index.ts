// User models
export * from './User';

// Chat models  
export * from './Chat';

// Message models
export * from './Message';

// Friend request models
export * from './FriendRequest';

// Call models
export * from './Call';

// Re-export commonly used types for convenience
export type {
  // User types
  IUser,
  IUserProfile,
  IUserCreateInput,
  IUserUpdateInput,
  UserStatus,
  
  // Chat types
  IChat,
  IChatMember,
  IChatCreateInput,
  IChatListItem,
  ChatType,
  ChatMemberRole,
  
  // Message types  
  IMessage,
  IMessageCreateInput,
  IMessageAttachment,
  MessageType,
  
  // Friend types
  IFriendRequest,
  IFriendship,
  IFriendInfo,
  FriendRequestStatus,
  FriendshipStatus,
  
  // Call types
  ICall,
  ICallParticipant,
  ICallInitiateInput,
  CallType,
  CallStatus,
  CallParticipantRole
} from './User';

export type {
  IChat,
  IChatMember,
  IChatCreateInput,
  IChatListItem,
  ChatType,
  ChatMemberRole,
} from './Chat';

export type {
  IMessage,
  IMessageCreateInput,
  IMessageAttachment,
  MessageType,
} from './Message';

export type {
  IFriendRequest,
  IFriendship,
  IFriendInfo,
  FriendRequestStatus,
  FriendshipStatus,
} from './FriendRequest';

export type {
  ICall,
  ICallParticipant,
  ICallInitiateInput,
  CallType,
  CallStatus,
  CallParticipantRole
} from './Call';

// Database model interfaces for ORM integration
export interface IDbUser {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  status: string;
  is_online: boolean;
  last_seen: Date;
  created_at: Date;
  updated_at: Date;
  is_email_verified: boolean;
  email_verification_token?: string;
  reset_password_token?: string;
  reset_password_expires?: Date;
  settings: string; // JSON string
}

export interface IDbChat {
  id: string;
  type: string;
  name?: string;
  description?: string;
  avatar?: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  is_archived: boolean;
  is_pinned: boolean;
  settings: string; // JSON string
}

export interface IDbMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  type: string;
  content: string;
  metadata?: string; // JSON string
  reply_to_message_id?: string;
  is_edited: boolean;
  edited_at?: Date;
  is_pinned: boolean;
  pinned_at?: Date;
  pinned_by?: string;
  is_deleted: boolean;
  deleted_at?: Date;
  deleted_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface IDbFriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  message?: string;
  created_at: Date;
  updated_at: Date;
  responded_at?: Date;
}

export interface IDbCall {
  id: string;
  initiator_id: string;
  receiver_id?: string;
  chat_id?: string;
  type: string;
  status: string;
  started_at?: Date;
  ended_at?: Date;
  duration?: number;
  quality: string;
  settings: string; // JSON string
  created_at: Date;
  updated_at: Date;
}

// Model transformation helpers
export class ModelTransformer {
  static userFromDb(dbUser: IDbUser): IUser {
    return {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      password: dbUser.password_hash,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      avatar: dbUser.avatar,
      status: dbUser.status as UserStatus,
      isOnline: dbUser.is_online,
      lastSeen: dbUser.last_seen,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
      isEmailVerified: dbUser.is_email_verified,
      emailVerificationToken: dbUser.email_verification_token,
      resetPasswordToken: dbUser.reset_password_token,
      resetPasswordExpires: dbUser.reset_password_expires,
      settings: JSON.parse(dbUser.settings || '{}'),
    };
  }

  static userToDb(user: Partial<IUser>): Partial<IDbUser> {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      password_hash: user.password,
      first_name: user.firstName,
      last_name: user.lastName,
      avatar: user.avatar,
      status: user.status,
      is_online: user.isOnline,
      last_seen: user.lastSeen,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      is_email_verified: user.isEmailVerified,
      email_verification_token: user.emailVerificationToken,
      reset_password_token: user.resetPasswordToken,
      reset_password_expires: user.resetPasswordExpires,
      settings: user.settings ? JSON.stringify(user.settings) : undefined,
    };
  }

  static chatFromDb(dbChat: IDbChat): Partial<IChat> {
    return {
      id: dbChat.id,
      type: dbChat.type as ChatType,
      name: dbChat.name,
      description: dbChat.description,
      avatar: dbChat.avatar,
      createdBy: dbChat.created_by,
      createdAt: dbChat.created_at,
      updatedAt: dbChat.updated_at,
      isArchived: dbChat.is_archived,
      isPinned: dbChat.is_pinned,
      settings: JSON.parse(dbChat.settings || '{}'),
      members: [], // Will be loaded separately
    };
  }

  static chatToDb(chat: Partial<IChat>): Partial<IDbChat> {
    return {
      id: chat.id,
      type: chat.type,
      name: chat.name,
      description: chat.description,
      avatar: chat.avatar,
      created_by: chat.createdBy,
      created_at: chat.createdAt,
      updated_at: chat.updatedAt,
      is_archived: chat.isArchived,
      is_pinned: chat.isPinned,
      settings: chat.settings ? JSON.stringify(chat.settings) : undefined,
    };
  }

  static messageFromDb(dbMessage: IDbMessage): Partial<IMessage> {
    return {
      id: dbMessage.id,
      chatId: dbMessage.chat_id,
      senderId: dbMessage.sender_id,
      type: dbMessage.type as MessageType,
      content: dbMessage.content,
      metadata: dbMessage.metadata ? JSON.parse(dbMessage.metadata) : undefined,
      isEdited: dbMessage.is_edited,
      editedAt: dbMessage.edited_at,
      isPinned: dbMessage.is_pinned,
      pinnedAt: dbMessage.pinned_at,
      pinnedBy: dbMessage.pinned_by,
      isDeleted: dbMessage.is_deleted,
      deletedAt: dbMessage.deleted_at,
      deletedBy: dbMessage.deleted_by,
      createdAt: dbMessage.created_at,
      updatedAt: dbMessage.updated_at,
      attachments: [], // Will be loaded separately
      reactions: [], // Will be loaded separately
      mentions: [], // Will be loaded separately
      readBy: [], // Will be loaded separately
      deliveredTo: [], // Will be loaded separately
    };
  }

  static messageToDb(message: Partial<IMessage>): Partial<IDbMessage> {
    return {
      id: message.id,
      chat_id: message.chatId,
      sender_id: message.senderId,
      type: message.type,
      content: message.content,
      metadata: message.metadata ? JSON.stringify(message.metadata) : undefined,
      reply_to_message_id: message.replyTo?.messageId,
      is_edited: message.isEdited,
      edited_at: message.editedAt,
      is_pinned: message.isPinned,
      pinned_at: message.pinnedAt,
      pinned_by: message.pinnedBy,
      is_deleted: message.isDeleted,
      deleted_at: message.deletedAt,
      deleted_by: message.deletedBy,
      created_at: message.createdAt,
      updated_at: message.updatedAt,
    };
  }

  static friendRequestFromDb(dbRequest: IDbFriendRequest): IFriendRequest {
    return {
      id: dbRequest.id,
      senderId: dbRequest.sender_id,
      receiverId: dbRequest.receiver_id,
      status: dbRequest.status as FriendRequestStatus,
      message: dbRequest.message,
      createdAt: dbRequest.created_at,
      updatedAt: dbRequest.updated_at,
      respondedAt: dbRequest.responded_at,
    };
  }

  static friendRequestToDb(request: Partial<IFriendRequest>): Partial<IDbFriendRequest> {
    return {
      id: request.id,
      sender_id: request.senderId,
      receiver_id: request.receiverId,
      status: request.status,
      message: request.message,
      created_at: request.createdAt,
      updated_at: request.updatedAt,
      responded_at: request.respondedAt,
    };
  }

  static callFromDb(dbCall: IDbCall): Partial<ICall> {
    return {
      id: dbCall.id,
      initiatorId: dbCall.initiator_id,
      receiverId: dbCall.receiver_id,
      chatId: dbCall.chat_id,
      type: dbCall.type as CallType,
      status: dbCall.status as CallStatus,
      startedAt: dbCall.started_at,
      endedAt: dbCall.ended_at,
      duration: dbCall.duration,
      quality: dbCall.quality as CallQuality,
      settings: JSON.parse(dbCall.settings || '{}'),
      createdAt: dbCall.created_at,
      updatedAt: dbCall.updated_at,
      participants: [], // Will be loaded separately
    };
  }

  static callToDb(call: Partial<ICall>): Partial<IDbCall> {
    return {
      id: call.id,
      initiator_id: call.initiatorId,
      receiver_id: call.receiverId,
      chat_id: call.chatId,
      type: call.type,
      status: call.status,
      started_at: call.startedAt,
      ended_at: call.endedAt,
      duration: call.duration,
      quality: call.quality,
      settings: call.settings ? JSON.stringify(call.settings) : undefined,
      created_at: call.createdAt,
      updated_at: call.updatedAt,
    };
  }
}

// Validation helpers
export class ModelValidator {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  }

  static validatePassword(password: string): boolean {
    return password.length >= 6 && password.length <= 100;
  }

  static validateMessageContent(content: string, type: MessageType): boolean {
    if (type === MessageType.TEXT) {
      return content.length > 0 && content.length <= 4000;
    }
    return true;
  }

  static validateChatName(name: string): boolean {
    return name.length > 0 && name.length <= 100;
  }
}

// Error types for models
export class ModelError extends Error {
  public code: string;
  public field?: string;

  constructor(message: string, code: string, field?: string) {
    super(message);
    this.name = 'ModelError';
    this.code = code;
    this.field = field;
  }
}

export const MODEL_ERRORS = {
  USER: {
    INVALID_EMAIL: 'INVALID_EMAIL',
    INVALID_USERNAME: 'INVALID_USERNAME',
    INVALID_PASSWORD: 'INVALID_PASSWORD',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
    USERNAME_ALREADY_EXISTS: 'USERNAME_ALREADY_EXISTS',
  },
  CHAT: {
    INVALID_NAME: 'INVALID_NAME',
    CHAT_NOT_FOUND: 'CHAT_NOT_FOUND',
    NOT_MEMBER: 'NOT_MEMBER',
    INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  },
  MESSAGE: {
    INVALID_CONTENT: 'INVALID_CONTENT',
    MESSAGE_NOT_FOUND: 'MESSAGE_NOT_FOUND',
    CANNOT_EDIT: 'CANNOT_EDIT',
    CANNOT_DELETE: 'CANNOT_DELETE',
  },
  FRIEND: {
    ALREADY_FRIENDS: 'ALREADY_FRIENDS',
    REQUEST_EXISTS: 'REQUEST_EXISTS',
    CANNOT_ADD_SELF: 'CANNOT_ADD_SELF',
    REQUEST_NOT_FOUND: 'REQUEST_NOT_FOUND',
  },
  CALL: {
    CALL_NOT_FOUND: 'CALL_NOT_FOUND',
    ALREADY_IN_CALL: 'ALREADY_IN_CALL',
    MAX_PARTICIPANTS_REACHED: 'MAX_PARTICIPANTS_REACHED',
    INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  },
};