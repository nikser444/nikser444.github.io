// frontend/src/services/userService.ts
import { api } from './api';
import { User } from '../types/user';
import { ApiResponse } from '../types/api';

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: File;
  status?: 'online' | 'offline' | 'away' | 'busy';
  customStatus?: string;
}

export interface SearchUsersParams {
  query: string;
  limit?: number;
  excludeIds?: string[];
}

export interface UserSettingsData {
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  notifications?: {
    sound?: boolean;
    desktop?: boolean;
    email?: boolean;
  };
  privacy?: {
    showOnlineStatus?: boolean;
    showLastSeen?: boolean;
    allowDirectMessages?: 'everyone' | 'friends' | 'none';
  };
}

export interface BlockUserData {
  userId: string;
  reason?: string;
}

class UserService {
  private readonly ENDPOINTS = {
    USERS: '/users',
    PROFILE: '/users/profile',
    SEARCH: '/users/search',
    UPLOAD_AVATAR: '/users/avatar',
    SETTINGS: '/users/settings',
    BLOCK: '/users/block',
    UNBLOCK: '/users/unblock',
    BLOCKED: '/users/blocked',
    ONLINE_STATUS: '/users/status',
  };

  // === Профиль пользователя ===

  // Получение профиля текущего пользователя
  async getProfile(): Promise<User> {
    try {
      const response = await api.get<User>(this.ENDPOINTS.PROFILE);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка получения профиля');
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  // Получение пользователя по ID
  async getUserById(userId: string): Promise<User> {
    try {
      const response = await api.get<User>(`${this.ENDPOINTS.USERS}/${userId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка получения пользователя');
    } catch (error) {
      console.error('Get user by ID error:', error);
      throw error;
    }
  }

  // Обновление профиля пользователя
  async updateProfile(data: UpdateUserData): Promise<User> {
    try {
      let response: ApiResponse<User>;

      if (data.avatar) {
        // Если есть аватар, используем multipart/form-data
        const formData = new FormData();
        if (data.firstName) formData.append('firstName', data.firstName);
        if (data.lastName) formData.append('lastName', data.lastName);
        if (data.bio) formData.append('bio', data.bio);
        if (data.status) formData.append('status', data.status);
        if (data.customStatus) formData.append('customStatus', data.customStatus);
        formData.append('avatar', data.avatar);

        response = await api.put<User>(this.ENDPOINTS.PROFILE, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await api.put<User>(this.ENDPOINTS.PROFILE, data);
      }
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка обновления профиля');
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Загрузка аватара
  async uploadAvatar(file: File, onProgress?: (progress: number) => void): Promise<string> {
    try {
      const response = await api.uploadFile<{ avatarUrl: string }>(
        this.ENDPOINTS.UPLOAD_AVATAR,
        file,
        onProgress
      );
      
      if (response.success && response.data) {
        return response.data.avatarUrl;
      }
      
      throw new Error(response.message || 'Ошибка загрузки аватара');
    } catch (error) {
      console.error('Upload avatar error:', error);
      throw error;
    }
  }

  // Удаление аватара
  async removeAvatar(): Promise<void> {
    try {
      const response = await api.delete(this.ENDPOINTS.UPLOAD_AVATAR);
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка удаления аватара');
      }
    } catch (error) {
      console.error('Remove avatar error:', error);
      throw error;
    }
  }

  // === Поиск пользователей ===

  // Поиск пользователей
  async searchUsers(params: SearchUsersParams): Promise<User[]> {
    try {
      const url = api.createUrlWithParams(this.ENDPOINTS.SEARCH, {
        query: params.query,
        limit: params.limit,
        excludeIds: params.excludeIds?.join(','),
      });

      const response = await api.get<User[]>(url);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка поиска пользователей');
    } catch (error) {
      console.error('Search users error:', error);
      throw error;
    }
  }

  // Получение пользователя по email
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const response = await api.get<User>(`${this.ENDPOINTS.USERS}/email/${email}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('Get user by email error:', error);
      return null;
    }
  }

  // === Настройки пользователя ===

  // Получение настроек пользователя
  async getSettings(): Promise<UserSettingsData> {
    try {
      const response = await api.get<UserSettingsData>(this.ENDPOINTS.SETTINGS);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка получения настроек');
    } catch (error) {
      console.error('Get settings error:', error);
      throw error;
    }
  }

  // Обновление настроек пользователя
  async updateSettings(settings: UserSettingsData): Promise<UserSettingsData> {
    try {
      const response = await api.put<UserSettingsData>(this.ENDPOINTS.SETTINGS, settings);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка обновления настроек');
    } catch (error) {
      console.error('Update settings error:', error);
      throw error;
    }
  }

  // === Статус пользователя ===

  // Обновление статуса онлайн
  async updateOnlineStatus(status: 'online' | 'offline' | 'away' | 'busy'): Promise<void> {
    try {
      const response = await api.post(this.ENDPOINTS.ONLINE_STATUS, { status });
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка обновления статуса');
      }
    } catch (error) {
      console.error('Update online status error:', error);
      throw error;
    }
  }

  // Обновление кастомного статуса
  async updateCustomStatus(customStatus: string): Promise<void> {
    try {
      const response = await api.post(`${this.ENDPOINTS.ONLINE_STATUS}/custom`, { 
        customStatus 
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка обновления статуса');
      }
    } catch (error) {
      console.error('Update custom status error:', error);
      throw error;
    }
  }

  // === Блокировка пользователей ===

  // Заблокировать пользователя
  async blockUser(data: BlockUserData): Promise<void> {
    try {
      const response = await api.post(this.ENDPOINTS.BLOCK, data);
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка блокировки пользователя');
      }
    } catch (error) {
      console.error('Block user error:', error);
      throw error;
    }
  }

  // Разблокировать пользователя
  async unblockUser(userId: string): Promise<void> {
    try {
      const response = await api.post(this.ENDPOINTS.UNBLOCK, { userId });
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка разблокировки пользователя');
      }
    } catch (error) {
      console.error('Unblock user error:', error);
      throw error;
    }
  }

  // Получение списка заблокированных пользователей
  async getBlockedUsers(): Promise<User[]> {
    try {
      const response = await api.get<User[]>(this.ENDPOINTS.BLOCKED);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка получения заблокированных пользователей');
    } catch (error) {
      console.error('Get blocked users error:', error);
      throw error;
    }
  }

  // === Утилитарные методы ===

  // Проверка, заблокирован ли пользователь
  async isUserBlocked(userId: string): Promise<boolean> {
    try {
      const response = await api.get<{ isBlocked: boolean }>(`${this.ENDPOINTS.BLOCK}/${userId}`);
      
      if (response.success && response.data) {
        return response.data.isBlocked;
      }
      
      return false;
    } catch (error) {
      console.error('Check if user blocked error:', error);
      return false;
    }
  }

  // Получение онлайн статуса пользователя
  async getUserOnlineStatus(userId: string): Promise<{ 
    status: 'online' | 'offline' | 'away' | 'busy'; 
    lastSeen?: Date;
    customStatus?: string;
  }> {
    try {
      const response = await api.get<{
        status: 'online' | 'offline' | 'away' | 'busy';
        lastSeen?: string;
        customStatus?: string;
      }>(`${this.ENDPOINTS.ONLINE_STATUS}/${userId}`);
      
      if (response.success && response.data) {
        return {
          ...response.data,
          lastSeen: response.data.lastSeen ? new Date(response.data.lastSeen) : undefined,
        };
      }
      
      throw new Error(response.message || 'Ошибка получения статуса пользователя');
    } catch (error) {
      console.error('Get user online status error:', error);
      throw error;
    }
  }

  // Получение статистики пользователя
  async getUserStats(userId?: string): Promise<{
    totalMessages: number;
    totalChats: number;
    friendsCount: number;
    joinDate: Date;
  }> {
    try {
      const endpoint = userId ? `${this.ENDPOINTS.USERS}/${userId}/stats` : `${this.ENDPOINTS.PROFILE}/stats`;
      const response = await api.get<{
        totalMessages: number;
        totalChats: number;
        friendsCount: number;
        joinDate: string;
      }>(endpoint);
      
      if (response.success && response.data) {
        return {
          ...response.data,
          joinDate: new Date(response.data.joinDate),
        };
      }
      
      throw new Error(response.message || 'Ошибка получения статистики');
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  }

  // Проверка доступности пользователя для чата
  async checkUserAvailability(userId: string): Promise<{
    available: boolean;
    reason?: string;
  }> {
    try {
      const response = await api.get<{
        available: boolean;
        reason?: string;
      }>(`${this.ENDPOINTS.USERS}/${userId}/availability`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return { available: false, reason: 'Неизвестная ошибка' };
    } catch (error) {
      console.error('Check user availability error:', error);
      return { available: false, reason: 'Ошибка проверки доступности' };
    }
  }

  // Получение общих чатов с пользователем
  async getMutualChats(userId: string): Promise<any[]> {
    try {
      const response = await api.get<any[]>(`${this.ENDPOINTS.USERS}/${userId}/mutual-chats`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Get mutual chats error:', error);
      return [];
    }
  }
}

export const userService = new UserService();
export default userService;