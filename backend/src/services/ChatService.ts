// backend/src/services/ChatService.ts
import { Chat } from '../models/Chat';
import { Message } from '../models/Message';
import { User } from '../models/User';
import { IChat, IChatMember } from '../types/Chat';
import { IMessage } from '../types/Message';
import { IUser } from '../types/User';
import { NotificationService } from './NotificationService';

export interface CreateChatData {
  name?: string;
  type: 'private' | 'group';
  description?: string;
  avatar?: string;
  memberIds: string[];
  createdBy: string;
}

export interface UpdateChatData {
  name?: string;
  description?: string;
  avatar?: string;
}

export interface ChatWithMembers extends IChat {
  members: IChatMember[];
  lastMessage?: IMessage;
  unreadCount?: number;
}

export class ChatService {
  static async createChat(data: CreateChatData): Promise<ChatWithMembers> {
    const { name, type, description, avatar, memberIds, createdBy } = data;

    // Проверяем, что создатель чата включен в список участников
    if (!memberIds.includes(createdBy)) {
      memberIds.push(createdBy);
    }

    // Для приватных чатов проверяем, что участников ровно 2
    if (type === 'private' && memberIds.length !== 2) {
      throw new Error('Приватный чат должен содержать ровно 2 участников');
    }

    // Для приватных чатов проверяем, не существует ли уже такой чат
    if (type === 'private') {
      const existingChat = await Chat.findPrivateChat(memberIds[0], memberIds[1]);
      if (existingChat) {
        return this.getChatWithDetails(existingChat.id, createdBy);
      }
    }

    // Проверяем, что все участники существуют
    const members = await User.findByIds(memberIds);
    if (members.length !== memberIds.length) {
      throw new Error('Некоторые пользователи не найдены');
    }

    // Создаем чат
    const chat = await Chat.create({
      name: name || this.generateChatName(members, type),
      type,
      description,
      avatar,
      createdBy,
    });

    // Добавляем участников
    await Chat.addMembers(chat.id, memberIds, createdBy);

    // Отправляем уведомления новым участникам (кроме создателя)
    const creator = members.find(m => m.id === createdBy);
    const otherMembers = members.filter(m => m.id !== createdBy);

    for (const member of otherMembers) {
      if (type === 'group') {
        await NotificationService.sendNotification(member.id, {
          type: 'chat',
          title: 'Приглашение в группу',
          message: `${creator?.username} добавил вас в группу "${chat.name}"`,
          data: {
            chatId: chat.id,
            fromUserId: createdBy,
          },
        });
      }
    }

    return this.getChatWithDetails(chat.id, createdBy);
  }

  static async getUserChats(userId: string): Promise<ChatWithMembers[]> {
    const chats = await Chat.findUserChats(userId);
    const chatsWithDetails = [];

    for (const chat of chats) {
      const chatWithDetails = await this.getChatWithDetails(chat.id, userId);
      chatsWithDetails.push(chatWithDetails);
    }

    // Сортируем по времени последнего сообщения
    chatsWithDetails.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || a.createdAt;
      const bTime = b.lastMessage?.createdAt || b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    return chatsWithDetails;
  }

  static async getChatById(chatId: string, userId: string): Promise<ChatWithMembers> {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new Error('Чат не найден');
    }

    // Проверяем, что пользователь является участником чата
    const isMember = await Chat.isMember(chatId, userId);
    if (!isMember) {
      throw new Error('Вы не являетесь участником этого чата');
    }

    return this.getChatWithDetails(chatId, userId);
  }

  static async updateChat(
    chatId: string, 
    userId: string, 
    data: UpdateChatData
  ): Promise<ChatWithMembers> {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new Error('Чат не найден');
    }

    // Проверяем права на редактирование
    const canEdit = await this.canUserEditChat(chatId, userId);
    if (!canEdit) {
      throw new Error('У вас нет прав для редактирования этого чата');
    }

    // Обновляем чат
    await Chat.update(chatId, data);

    // Отправляем уведомление участникам об изменении
    const members = await Chat.getMembers(chatId);
    const editor = await User.findById(userId);

    for (const member of members) {
      if (member.id !== userId) {
        await NotificationService.sendNotification(member.id, {
          type: 'chat',
          title: 'Чат обновлен',
          message: `${editor?.username} изменил настройки чата "${chat.name}"`,
          data: {
            chatId: chatId,
            fromUserId: userId,
          },
        });
      }
    }

    return this.getChatWithDetails(chatId, userId);
  }

  static async addMembers(
    chatId: string, 
    userId: string, 
    memberIds: string[]
  ): Promise<ChatWithMembers> {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new Error('Чат не найден');
    }

    if (chat.type === 'private') {
      throw new Error('Нельзя добавлять участников в приватный чат');
    }

    // Проверяем права на добавление участников
    const canAdd = await this.canUserManageMembers(chatId, userId);
    if (!canAdd) {
      throw new Error('У вас нет прав для добавления участников');
    }

    // Проверяем, что пользователи существуют
    const newMembers = await User.findByIds(memberIds);
    if (newMembers.length !== memberIds.length) {
      throw new Error('Некоторые пользователи не найдены');
    }

    // Добавляем участников
    await Chat.addMembers(chatId, memberIds, userId);

    // Отправляем уведомления
    const adder = await User.findById(userId);
    for (const member of newMembers) {
      await NotificationService.sendNotification(member.id, {
        type: 'chat',
        title: 'Добавлен в группу',
        message: `${adder?.username} добавил вас в группу "${chat.name}"`,
        data: {
          chatId: chatId,
          fromUserId: userId,
        },
      });
    }

    return this.getChatWithDetails(chatId, userId);
  }

  static async removeMembers(
    chatId: string, 
    userId: string, 
    memberIds: string[]
  ): Promise<ChatWithMembers> {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new Error('Чат не найден');
    }

    if (chat.type === 'private') {
      throw new Error('Нельзя удалять участников из приватного чата');
    }

    // Проверяем права на удаление участников
    const canRemove = await this.canUserManageMembers(chatId, userId);
    if (!canRemove) {
      throw new Error('У вас нет прав для удаления участников');
    }

    // Нельзя удалить создателя группы
    if (memberIds.includes(chat.createdBy)) {
      throw new Error('Нельзя удалить создателя группы');
    }

    // Удаляем участников
    await Chat.removeMembers(chatId, memberIds);

    // Отправляем уведомления удаленным участникам
    const remover = await User.findById(userId);
    const removedMembers = await User.findByIds(memberIds);

    for (const member of removedMembers) {
      await NotificationService.sendNotification(member.id, {
        type: 'chat',
        title: 'Исключен из группы',
        message: `${remover?.username} исключил вас из группы "${chat.name}"`,
        data: {
          chatId: chatId,
          fromUserId: userId,
        },
      });
    }

    return this.getChatWithDetails(chatId, userId);
  }

  static async leaveChat(chatId: string, userId: string): Promise<void> {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new Error('Чат не найден');
    }

    if (chat.type === 'private') {
      throw new Error('Нельзя покинуть приватный чат');
    }

    // Проверяем, что пользователь является участником
    const isMember = await Chat.isMember(chatId, userId);
    if (!isMember) {
      throw new Error('Вы не являетесь участником этого чата');
    }

    // Если это создатель группы, передаем права другому участнику
    if (chat.createdBy === userId) {
      const members = await Chat.getMembers(chatId);
      const otherMembers = members.filter(m => m.id !== userId);
      
      if (otherMembers.length > 0) {
        await Chat.update(chatId, { createdBy: otherMembers[0].id });
      } else {
        // Если других участников нет, удаляем чат
        await Chat.delete(chatId);
        return;
      }
    }

    // Удаляем участника
    await Chat.removeMembers(chatId, [userId]);

    // Уведомляем остальных участников
    const members = await Chat.getMembers(chatId);
    const leaver = await User.findById(userId);

    for (const member of members) {
      await NotificationService.sendNotification(member.id, {
        type: 'chat',
        title: 'Участник покинул группу',
        message: `${leaver?.username} покинул группу "${chat.name}"`,
        data: {
          chatId: chatId,
          fromUserId: userId,
        },
      });
    }
  }

  static async deleteChat(chatId: string, userId: string): Promise<void> {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new Error('Чат не найден');
    }

    // Только создатель может удалить групповой чат
    if (chat.type === 'group' && chat.createdBy !== userId) {
      throw new Error('Только создатель группы может ее удалить');
    }

    // Для приватного чата проверяем, что пользователь является участником
    if (chat.type === 'private') {
      const isMember = await Chat.isMember(chatId, userId);
      if (!isMember) {
        throw new Error('Вы не являетесь участником этого чата');
      }
    }

    // Получаем участников перед удалением
    const members = await Chat.getMembers(chatId);

    // Удаляем чат
    await Chat.delete(chatId);

    // Уведомляем участников об удалении (для групповых чатов)
    if (chat.type === 'group') {
      const deleter = await User.findById(userId);
      
      for (const member of members) {
        if (member.id !== userId) {
          await NotificationService.sendNotification(member.id, {
            type: 'chat',
            title: 'Группа удалена',
            message: `${deleter?.username} удалил группу "${chat.name}"`,
            data: {
              chatId: chatId,
              fromUserId: userId,
            },
          });
        }
      }
    }
  }

  static async markAsRead(chatId: string, userId: string): Promise<void> {
    // Помечаем все сообщения чата как прочитанные для пользователя
    await Message.markAsRead(chatId, userId);
  }

  static async getChatMessages(
    chatId: string, 
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<IMessage[]> {
    // Проверяем, что пользователь является участником чата
    const isMember = await Chat.isMember(chatId, userId);
    if (!isMember) {
      throw new Error('Вы не являетесь участником этого чата');
    }

    return Message.findByChatId(chatId, limit, offset);
  }

  static async searchChats(userId: string, query: string): Promise<ChatWithMembers[]> {
    const chats = await Chat.searchUserChats(userId, query);
    const chatsWithDetails = [];

    for (const chat of chats) {
      const chatWithDetails = await this.getChatWithDetails(chat.id, userId);
      chatsWithDetails.push(chatWithDetails);
    }

    return chatsWithDetails;
  }

  // Приватные методы
  private static async getChatWithDetails(chatId: string, userId: string): Promise<ChatWithMembers> {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new Error('Чат не найден');
    }

    const [members, lastMessage, unreadCount] = await Promise.all([
      Chat.getMembers(chatId),
      Message.getLastMessage(chatId),
      Message.getUnreadCount(chatId, userId),
    ]);

    return {
      ...chat,
      members,
      lastMessage: lastMessage || undefined,
      unreadCount,
    };
  }

  private static generateChatName(members: IUser[], type: string): string {
    if (type === 'private') {
      return members.map(m => m.username).join(', ');
    }
    
    const names = members.map(m => m.username).slice(0, 3);
    const result = names.join(', ');
    
    if (members.length > 3) {
      return `${result} и еще ${members.length - 3}`;
    }
    
    return result;
  }

  private static async canUserEditChat(chatId: string, userId: string): Promise<boolean> {
    const chat = await Chat.findById(chatId);
    if (!chat) return false;

    // Создатель группы может редактировать
    if (chat.createdBy === userId) return true;

    // В приватном чате оба участника могут редактировать
    if (chat.type === 'private') {
      return Chat.isMember(chatId, userId);
    }

    // Для групповых чатов - только создатель или администраторы
    return false; // TODO: добавить систему ролей
  }

  private static async canUserManageMembers(chatId: string, userId: string): Promise<boolean> {
    const chat = await Chat.findById(chatId);
    if (!chat) return false;

    // Только создатель группы может управлять участниками
    return chat.createdBy === userId;
  }
}