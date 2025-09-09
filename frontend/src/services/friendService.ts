// frontend/src/services/friendService.ts
import { api } from './api';
import { User } from '../types/user';
import { ApiResponse } from '../types/api';

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  sender: User;
  receiver: User;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SendFriendRequestData {
  email?: string;
  userId?: string;
  message?: string;
}

export interface GetFriendRequestsParams {
  type: 'sent' | 'received';
  status?: 'pending' | 'accepted' | 'declined';
  limit?: number;
  page?: number;
}

export interface SearchFriendsParams {
  query: string;
  limit?: number;
}

class FriendService {
  private readonly ENDPOINTS = {
    FRIENDS: '/friends',
    FRIEND_REQUESTS: '/friends/requests',
    SEND_REQUEST: '/friends/add',
    ACCEPT_REQUEST: '/friends/accept',
    DECLINE_REQUEST: '/friends/decline',
    REMOVE_FRIEND: '/friends/remove',
    SEARCH_FRIENDS: '/friends/search',
    MUTUAL_FRIENDS: '/friends/mutual',
  };

  // === Управление друзьями ===

  // Получение списка друзей
  async getFriends(): Promise<User[]> {
    try {
      const response = await api.get<User[]>(this.ENDPOINTS.FRIENDS);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка получения списка друзей');
    } catch (error) {
      console.error('Get friends error:', error);
      throw error;
    }
  }

  // Отправка заявки в друзья
  async sendFriendRequest(data: SendFriendRequestData): Promise<FriendRequest> {
    try {
      if (!data.email && !data.userId) {
        throw new Error('Необходимо указать email или ID пользователя');
      }

      const response = await api.post<FriendRequest>(this.ENDPOINTS.SEND_REQUEST, data);
      
      if (response.success && response.data) {
        return {
          ...response.data,
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
        };
      }
      
      throw new Error(response.message || 'Ошибка отправки заявки в друзья');
    } catch (error) {
      console.error('Send friend request error:', error);
      throw error;
    }
  }

  // Принятие заявки в друзья
  async acceptFriendRequest(requestId: string): Promise<void> {
    try {
      const response = await api.post(`${this.ENDPOINTS.ACCEPT_REQUEST}/${requestId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка принятия заявки в друзья');
      }
    } catch (error) {
      console.error('Accept friend request error:', error);
      throw error;
    }
  }

  // Отклонение заявки в друзья
  async declineFriendRequest(requestId: string): Promise<void> {
    try {
      const response = await api.post(`${this.ENDPOINTS.DECLINE_REQUEST}/${requestId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка отклонения заявки в друзья');
      }
    } catch (error) {
      console.error('Decline friend request error:', error);
      throw error;
    }
  }

  // Удаление из друзей
  async removeFriend(userId: string): Promise<void> {
    try {
      const response = await api.delete(`${this.ENDPOINTS.REMOVE_FRIEND}/${userId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка удаления из друзей');
      }
    } catch (error) {
      console.error('Remove friend error:', error);
      throw error;
    }
  }

  // === Управление заявками в друзья ===

  // Получение заявок в друзья
  async getFriendRequests(params: GetFriendRequestsParams): Promise<FriendRequest[]> {
    try {
      const url = api.createUrlWithParams(this.ENDPOINTS.FRIEND_REQUESTS, {
        type: params.type,
        status: params.status,
        limit: params.limit,
        page: params.page,
      });

      const response = await api.get<FriendRequest[]>(url);
      
      if (response.success && response.data) {
        return response.data.map(request => ({
          ...request,
          createdAt: new Date(request.createdAt),
          updatedAt: new Date(request.updatedAt),
        }));
      }
      
      throw new Error(response.message || 'Ошибка получения заявок в друзья');
    } catch (error) {
      console.error('Get friend requests error:', error);
      throw error;
    }
  }

  // Получение входящих заявок в друзья
  async getReceivedRequests(): Promise<FriendRequest[]> {
    try {
      return await this.getFriendRequests({ 
        type: 'received', 
        status: 'pending' 
      });
    } catch (error) {
      console.error('Get received requests error:', error);
      throw error;
    }
  }

  // Получение исходящих заявок в друзья
  async getSentRequests(): Promise<FriendRequest[]> {
    try {
      return await this.getFriendRequests({ 
        type: 'sent', 
        status: 'pending' 
      });
    } catch (error) {
      console.error('Get sent requests error:', error);
      throw error;
    }
  }

  // Отмена заявки в друзья
  async cancelFriendRequest(requestId: string): Promise<void> {
    try {
      const response = await api.delete(`${this.ENDPOINTS.FRIEND_REQUESTS}/${requestId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка отмены заявки в друзья');
      }
    } catch (error) {
      console.error('Cancel friend request error:', error);
      throw error;
    }
  }

  // === Поиск и проверки ===

  // Поиск среди друзей
  async searchFriends(params: SearchFriendsParams): Promise<User[]> {
    try {
      const url = api.createUrlWithParams(this.ENDPOINTS.SEARCH_FRIENDS, {
        query: params.query,
        limit: params.limit,
      });

      const response = await api.get<User[]>(url);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка поиска друзей');
    } catch (error) {
      console.error('Search friends error:', error);
      throw error;
    }
  }

  // Получение общих друзей с пользователем
  async getMutualFriends(userId: string): Promise<User[]> {
    try {
      const response = await api.get<User[]>(`${this.ENDPOINTS.MUTUAL_FRIENDS}/${userId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка получения общих друзей');
    } catch (error) {
      console.error('Get mutual friends error:', error);
      throw error;
    }
  }

  // Проверка статуса дружбы с пользователем
  async getFriendshipStatus(userId: string): Promise<{
    isFriend: boolean;
    hasIncomingRequest: boolean;
    hasOutgoingRequest: boolean;
    requestId?: string;
  }> {
    try {
      const response = await api.get<{
        isFriend: boolean;
        hasIncomingRequest: boolean;
        hasOutgoingRequest: boolean;
        requestId?: string;
      }>(`${this.ENDPOINTS.FRIENDS}/status/${userId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return {
        isFriend: false,
        hasIncomingRequest: false,
        hasOutgoingRequest: false,
      };
    } catch (error) {
      console.error('Get friendship status error:', error);
      return {
        isFriend: false,
        hasIncomingRequest: false,
        hasOutgoingRequest: false,
      };
    }
  }

  // Проверка, является ли пользователь другом
  async isFriend(userId: string): Promise<boolean> {
    try {
      const status = await this.getFriendshipStatus(userId);
      return status.isFriend;
    } catch (error) {
      console.error('Is friend check error:', error);
      return false;
    }
  }

  // === Статистика и утилиты ===

  // Получение количества друзей
  async getFriendsCount(): Promise<number> {
    try {
      const response = await api.get<{ count: number }>(`${this.ENDPOINTS.FRIENDS}/count`);
      
      if (response.success && response.data) {
        return response.data.count;
      }
      
      return 0;
    } catch (error) {
      console.error('Get friends count error:', error);
      return 0;
    }
  }

  // Получение количества входящих заявок
  async getPendingRequestsCount(): Promise<number> {
    try {
      const response = await api.get<{ count: number }>(`${this.ENDPOINTS.FRIEND_REQUESTS}/pending-count`);
      
      if (response.success && response.data) {
        return response.data.count;
      }
      
      return 0;
    } catch (error) {
      console.error('Get pending requests count error:', error);
      return 0;
    }
  }

  // Получение онлайн друзей
  async getOnlineFriends(): Promise<User[]> {
    try {
      const response = await api.get<User[]>(`${this.ENDPOINTS.FRIENDS}/online`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка получения онлайн друзей');
    } catch (error) {
      console.error('Get online friends error:', error);
      throw error;
    }
  }

  // Получение недавно добавленных друзей
  async getRecentFriends(limit: number = 5): Promise<User[]> {
    try {
      const response = await api.get<User[]>(`${this.ENDPOINTS.FRIENDS}/recent?limit=${limit}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка получения недавних друзей');
    } catch (error) {
      console.error('Get recent friends error:', error);
      throw error;
    }
  }

  // Блокировка пользователя (удаляет из друзей, если они были друзьями)
  async blockUser(userId: string): Promise<void> {
    try {
      const response = await api.post(`${this.ENDPOINTS.FRIENDS}/block/${userId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка блокировки пользователя');
      }
    } catch (error) {
      console.error('Block user error:', error);
      throw error;
    }
  }

  // === Массовые операции ===

  // Принятие нескольких заявок в друзья
  async acceptMultipleFriendRequests(requestIds: string[]): Promise<{ 
    accepted: string[]; 
    failed: string[] 
  }> {
    try {
      const response = await api.post<{ 
        accepted: string[]; 
        failed: string[] 
      }>(`${this.ENDPOINTS.ACCEPT_REQUEST}/multiple`, { requestIds });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка принятия заявок');
    } catch (error) {
      console.error('Accept multiple requests error:', error);
      throw error;
    }
  }

  // Отклонение нескольких заявок в друзья
  async declineMultipleFriendRequests(requestIds: string[]): Promise<{ 
    declined: string[]; 
    failed: string[] 
  }> {
    try {
      const response = await api.post<{ 
        declined: string[]; 
        failed: string[] 
      }>(`${this.ENDPOINTS.DECLINE_REQUEST}/multiple`, { requestIds });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка отклонения заявок');
    } catch (error) {
      console.error('Decline multiple requests error:', error);
      throw error;
    }
  }

  // Удаление нескольких друзей
  async removeMultipleFriends(userIds: string[]): Promise<{ 
    removed: string[]; 
    failed: string[] 
  }> {
    try {
      const response = await api.post<{ 
        removed: string[]; 
        failed: string[] 
      }>(`${this.ENDPOINTS.REMOVE_FRIEND}/multiple`, { userIds });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка удаления друзей');
    } catch (error) {
      console.error('Remove multiple friends error:', error);
      throw error;
    }
  }
}

export const friendService = new FriendService();
export default friendService;