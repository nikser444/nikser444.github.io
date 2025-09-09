// frontend/src/services/chatService.ts
import { api } from './api';
import { Chat } from '../types/chat';
import { Message } from '../types/message';
import { User } from '../types/user';
import { ApiResponse } from '../types/api';

export interface CreateChatData {
  name?: string;
  description?: string;
  type: 'private' | 'group';
  participants: string[]; // user IDs
  avatar?: File;
}

export interface UpdateChatData {
  name?: string;
  description?: string;
  avatar?: File;
}

export interface SendMessageData {
  chatId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'video';
  file?: File;
  replyTo?: string; // message ID для ответа
}

export interface GetMessagesParams {
  chatId: string;
  page?: number;
  limit?: number;
  before?: string; // message ID
  after?: string; // message ID
}

export interface SearchChatsParams {
  query: string;
  type?: 'private' | 'group';
  limit?: number;
}

export interface SearchMessagesParams {
  chatId?: string;
  query: string;
  limit?: number;
}

class ChatService {
  private readonly ENDPOINTS = {
    CHATS: '/chats',
    MESSAGES: '/messages',
    SEARCH_CHATS: '/chats/search',
    SEARCH_MESSAGES: '/messages/search',
    UPLOAD_AVATAR: '/chats/avatar',
    TYPING: '/chats/typing',
    READ: '/messages/read',
  };

  // === Методы для чатов ===

  // Получение списка чатов пользователя
  async getChats(): Promise<Chat[]> {
    try {
      const response = await api.get<Chat[]>(this.ENDPOINTS.CHATS);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка получения чатов');
    } catch (error) {
      console.error('Get chats error:', error);
      throw error;
    }
  }

  // Получение информации о чате по ID
  async getChatById(chatId: string): Promise<Chat> {
    try {
      const response = await api.get<Chat>(`${this.ENDPOINTS.CHATS}/${chatId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка получения чата');
    } catch (error) {
      console.error('Get chat by ID error:', error);
      throw error;
    }
  }

  // Создание нового чата
  async createChat(data: CreateChatData): Promise<Chat> {
    try {
      let response: ApiResponse<Chat>;

      if (data.avatar) {
        // Если есть аватар, используем multipart/form-data
        const formData = new FormData();
        formData.append('name', data.name || '');
        formData.append('description', data.description || '');
        formData.append('type', data.type);
        formData.append('participants', JSON.stringify(data.participants));
        formData.append('avatar', data.avatar);

        response = await api.post<Chat>(this.ENDPOINTS.CHATS, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await api.post<Chat>(this.ENDPOINTS.CHATS, data);
      }
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка создания чата');
    } catch (error) {
      console.error('Create chat error:', error);
      throw error;
    }
  }

  // Обновление чата
  async updateChat(chatId: string, data: UpdateChatData): Promise<Chat> {
    try {
      let response: ApiResponse<Chat>;

      if (data.avatar) {
        const formData = new FormData();
        if (data.name) formData.append('name', data.name);
        if (data.description) formData.append('description', data.description);
        formData.append('avatar', data.avatar);

        response = await api.put<Chat>(`${this.ENDPOINTS.CHATS}/${chatId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await api.put<Chat>(`${this.ENDPOINTS.CHATS}/${chatId}`, data);
      }
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка обновления чата');
    } catch (error) {
      console.error('Update chat error:', error);
      throw error;
    }
  }

  // Удаление чата
  async deleteChat(chatId: string): Promise<void> {
    try {
      const response = await api.delete(`${this.ENDPOINTS.CHATS}/${chatId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка удаления чата');
      }
    } catch (error) {
      console.error('Delete chat error:', error);
      throw error;
    }
  }

  // Добавление участника в чат
  async addParticipant(chatId: string, userId: string): Promise<void> {
    try {
      const response = await api.post(`${this.ENDPOINTS.CHATS}/${chatId}/participants`, {
        userId
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка добавления участника');
      }
    } catch (error) {
      console.error('Add participant error:', error);
      throw error;
    }
  }

  // Удаление участника из чата
  async removeParticipant(chatId: string, userId: string): Promise<void> {
    try {
      const response = await api.delete(`${this.ENDPOINTS.CHATS}/${chatId}/participants/${userId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка удаления участника');
      }
    } catch (error) {
      console.error('Remove participant error:', error);
      throw error;
    }
  }

  // Покидание чата
  async leaveChat(chatId: string): Promise<void> {
    try {
      const response = await api.post(`${this.ENDPOINTS.CHATS}/${chatId}/leave`);
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка выхода из чата');
      }
    } catch (error) {
      console.error('Leave chat error:', error);
      throw error;
    }
  }

  // === Методы для сообщений ===

  // Получение сообщений чата
  async getMessages(params: GetMessagesParams): Promise<Message[]> {
    try {
      const url = api.createUrlWithParams(`${this.ENDPOINTS.MESSAGES}/${params.chatId}`, {
        page: params.page,
        limit: params.limit,
        before: params.before,
        after: params.after,
      });

      const response = await api.get<Message[]>(url);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка получения сообщений');
    } catch (error) {
      console.error('Get messages error:', error);
      throw error;
    }
  }

  // Отправка сообщения
  async sendMessage(data: SendMessageData): Promise<Message> {
    try {
      let response: ApiResponse<Message>;

      if (data.file) {
        const formData = new FormData();
        formData.append('chatId', data.chatId);
        formData.append('content', data.content);
        formData.append('type', data.type);
        formData.append('file', data.file);
        if (data.replyTo) formData.append('replyTo', data.replyTo);

        response = await api.post<Message>(this.ENDPOINTS.MESSAGES, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await api.post<Message>(this.ENDPOINTS.MESSAGES, data);
      }
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка отправки сообщения');
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }

  // Редактирование сообщения
  async editMessage(messageId: string, content: string): Promise<Message> {
    try {
      const response = await api.put<Message>(`${this.ENDPOINTS.MESSAGES}/${messageId}`, {
        content
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка редактирования сообщения');
    } catch (error) {
      console.error('Edit message error:', error);
      throw error;
    }
  }

  // Удаление сообщения
  async deleteMessage(messageId: string): Promise<void> {
    try {
      const response = await api.delete(`${this.ENDPOINTS.MESSAGES}/${messageId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка удаления сообщения');
      }
    } catch (error) {
      console.error('Delete message error:', error);
      throw error;
    }
  }

  // Отметка сообщений как прочитанные
  async markAsRead(chatId: string, messageIds: string[]): Promise<void> {
    try {
      const response = await api.post(this.ENDPOINTS.READ, {
        chatId,
        messageIds
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка отметки сообщений');
      }
    } catch (error) {
      console.error('Mark as read error:', error);
      throw error;
    }
  }

  // === Методы поиска ===

  // Поиск чатов
  async searchChats(params: SearchChatsParams): Promise<Chat[]> {
    try {
      const url = api.createUrlWithParams(this.ENDPOINTS.SEARCH_CHATS, params);
      const response = await api.get<Chat[]>(url);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка поиска чатов');
    } catch (error) {
      console.error('Search chats error:', error);
      throw error;
    }
  }

  // Поиск сообщений
  async searchMessages(params: SearchMessagesParams): Promise<Message[]> {
    try {
      const url = api.createUrlWithParams(this.ENDPOINTS.SEARCH_MESSAGES, params);
      const response = await api.get<Message[]>(url);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка поиска сообщений');
    } catch (error) {
      console.error('Search messages error:', error);
      throw error;
    }
  }

  // === Утилитарные методы ===

  // Уведомление о наборе текста
  async sendTyping(chatId: string, isTyping: boolean): Promise<void> {
    try {
      await api.post(this.ENDPOINTS.TYPING, {
        chatId,
        isTyping
      });
    } catch (error) {
      console.error('Send typing error:', error);
      // Не выбрасываем ошибку, так как это не критично
    }
  }

  // Загрузка аватара чата
  async uploadChatAvatar(chatId: string, file: File, onProgress?: (progress: number) => void): Promise<string> {
    try {
      const response = await api.uploadFile<{ avatarUrl: string }>(
        `${this.ENDPOINTS.UPLOAD_AVATAR}/${chatId}`,
        file,
        onProgress
      );
      
      if (response.success && response.data) {
        return response.data.avatarUrl;
      }
      
      throw new Error(response.message || 'Ошибка загрузки аватара');
    } catch (error) {
      console.error('Upload chat avatar error:', error);
      throw error;
    }
  }

  // Получение участников чата
  async getChatParticipants(chatId: string): Promise<User[]> {
    try {
      const response = await api.get<User[]>(`${this.ENDPOINTS.CHATS}/${chatId}/participants`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка получения участников');
    } catch (error) {
      console.error('Get chat participants error:', error);
      throw error;
    }
  }

  // Получение непрочитанных сообщений
  async getUnreadCount(): Promise<{ [chatId: string]: number }> {
    try {
      const response = await api.get<{ [chatId: string]: number }>('/messages/unread-count');
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return {};
    } catch (error) {
      console.error('Get unread count error:', error);
      return {};
    }
  }
}

export const chatService = new ChatService();
export default chatService;