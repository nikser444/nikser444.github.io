// frontend/src/store/friendSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { friendService } from '../services';
import type { User } from '../types/user';

// Типы для заявок в друзья
export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  sender?: User;
  receiver?: User;
}

// Состояние друзей
export interface FriendState {
  friends: User[];
  sentRequests: FriendRequest[];
  receivedRequests: FriendRequest[];
  searchResults: User[];
  suggestions: User[];
  blockedUsers: User[];
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;
  requestsCount: number;
}

// Начальное состояние
const initialState: FriendState = {
  friends: [],
  sentRequests: [],
  receivedRequests: [],
  searchResults: [],
  suggestions: [],
  blockedUsers: [],
  isLoading: false,
  isSearching: false,
  error: null,
  requestsCount: 0,
};

// Асинхронные thunks
export const fetchFriends = createAsyncThunk(
  'friend/fetchFriends',
  async (_, { rejectWithValue }) => {
    try {
      const response = await friendService.getFriends();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка загрузки друзей'
      );
    }
  }
);

export const fetchFriendRequests = createAsyncThunk(
  'friend/fetchRequests',
  async (_, { rejectWithValue }) => {
    try {
      const [sentResponse, receivedResponse] = await Promise.all([
        friendService.getSentRequests(),
        friendService.getReceivedRequests()
      ]);
      
      return {
        sent: sentResponse.data,
        received: receivedResponse.data
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка загрузки заявок'
      );
    }
  }
);

export const sendFriendRequest = createAsyncThunk(
  'friend/sendRequest',
  async (
    { email, message }: { email: string; message?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await friendService.sendFriendRequest(email, message);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка отправки заявки'
      );
    }
  }
);

export const acceptFriendRequest = createAsyncThunk(
  'friend/acceptRequest',
  async (requestId: string, { rejectWithValue }) => {
    try {
      const response = await friendService.acceptFriendRequest(requestId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка принятия заявки'
      );
    }
  }
);

export const declineFriendRequest = createAsyncThunk(
  'friend/declineRequest',
  async (requestId: string, { rejectWithValue }) => {
    try {
      await friendService.declineFriendRequest(requestId);
      return requestId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка отклонения заявки'
      );
    }
  }
);

export const removeFriend = createAsyncThunk(
  'friend/removeFriend',
  async (friendId: string, { rejectWithValue }) => {
    try {
      await friendService.removeFriend(friendId);
      return friendId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка удаления из друзей'
      );
    }
  }
);

export const blockUser = createAsyncThunk(
  'friend/blockUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await friendService.blockUser(userId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка блокировки пользователя'
      );
    }
  }
);

export const unblockUser = createAsyncThunk(
  'friend/unblockUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      await friendService.unblockUser(userId);
      return userId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка разблокировки пользователя'
      );
    }
  }
);

export const fetchFriendSuggestions = createAsyncThunk(
  'friend/fetchSuggestions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await friendService.getFriendSuggestions();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка загрузки рекомендаций'
      );
    }
  }
);

export const searchFriends = createAsyncThunk(
  'friend/searchFriends',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await friendService.searchUsers(query);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка поиска пользователей'
      );
    }
  }
);

export const fetchBlockedUsers = createAsyncThunk(
  'friend/fetchBlockedUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await friendService.getBlockedUsers();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка загрузки заблокированных пользователей'
      );
    }
  }
);

// Создаем slice
const friendSlice = createSlice({
  name: 'friend',
  initialState,
  reducers: {
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.isSearching = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    addFriendRequest: (state, action: PayloadAction<FriendRequest>) => {
      const request = action.payload;
      
      // Добавляем входящую заявку
      if (!state.receivedRequests.find(r => r.id === request.id)) {
        state.receivedRequests.push(request);
        state.requestsCount += 1;
      }
    },
    removeFriendRequest: (state, action: PayloadAction<string>) => {
      const requestId = action.payload;
      
      // Удаляем из входящих заявок
      const receivedIndex = state.receivedRequests.findIndex(r => r.id === requestId);
      if (receivedIndex !== -1) {
        state.receivedRequests.splice(receivedIndex, 1);
        state.requestsCount = Math.max(0, state.requestsCount - 1);
      }
      
      // Удаляем из исходящих заявок
      const sentIndex = state.sentRequests.findIndex(r => r.id === requestId);
      if (sentIndex !== -1) {
        state.sentRequests.splice(sentIndex, 1);
      }
    },
    updateFriendStatus: (state, action: PayloadAction<{ friendId: string; status: string }>) => {
      const { friendId, status } = action.payload;
      const friend = state.friends.find(f => f.id === friendId);
      
      if (friend) {
        friend.status = status as any;
        friend.lastSeen = status === 'offline' ? Date.now() : undefined;
      }
    },
    setRequestsCount: (state, action: PayloadAction<number>) => {
      state.requestsCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch friends
    builder
      .addCase(fetchFriends.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.isLoading = false;
        state.friends = action.payload;
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch friend requests
    builder
      .addCase(fetchFriendRequests.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFriendRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sentRequests = action.payload.sent;
        state.receivedRequests = action.payload.received;
        state.requestsCount = action.payload.received.length;
      })
      .addCase(fetchFriendRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Send friend request
    builder
      .addCase(sendFriendRequest.fulfilled, (state, action) => {
        state.sentRequests.push(action.payload);
      });

    // Accept friend request
    builder
      .addCase(acceptFriendRequest.fulfilled, (state, action) => {
        const { request, friend } = action.payload;
        
        // Удаляем заявку из входящих
        state.receivedRequests = state.receivedRequests.filter(r => r.id !== request.id);
        state.requestsCount = Math.max(0, state.requestsCount - 1);
        
        // Добавляем в друзья
        if (!state.friends.find(f => f.id === friend.id)) {
          state.friends.push(friend);
        }
      });

    // Decline friend request
    builder
      .addCase(declineFriendRequest.fulfilled, (state, action) => {
        const requestId = action.payload;
        
        // Удаляем заявку из входящих
        state.receivedRequests = state.receivedRequests.filter(r => r.id !== requestId);
        state.requestsCount = Math.max(0, state.requestsCount - 1);
      });

    // Remove friend
    builder
      .addCase(removeFriend.fulfilled, (state, action) => {
        const friendId = action.payload;
        state.friends = state.friends.filter(f => f.id !== friendId);
      });

    // Block user
    builder
      .addCase(blockUser.fulfilled, (state, action) => {
        const blockedUser = action.payload;
        
        // Добавляем в заблокированные
        if (!state.blockedUsers.find(u => u.id === blockedUser.id)) {
          state.blockedUsers.push(blockedUser);
        }
        
        // Удаляем из друзей, если был там
        state.friends = state.friends.filter(f => f.id !== blockedUser.id);
        
        // Удаляем все заявки от/к этому пользователю
        state.sentRequests = state.sentRequests.filter(r => 
          r.receiverId !== blockedUser.id
        );
        state.receivedRequests = state.receivedRequests.filter(r => 
          r.senderId !== blockedUser.id
        );
        state.requestsCount = state.receivedRequests.length;
      });

    // Unblock user
    builder
      .addCase(unblockUser.fulfilled, (state, action) => {
        const userId = action.payload;
        state.blockedUsers = state.blockedUsers.filter(u => u.id !== userId);
      });

    // Fetch suggestions
    builder
      .addCase(fetchFriendSuggestions.fulfilled, (state, action) => {
        state.suggestions = action.payload;
      });

    // Search friends
    builder
      .addCase(searchFriends.pending, (state) => {
        state.isSearching = true;
        state.error = null;
      })
      .addCase(searchFriends.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchResults = action.payload;
      })
      .addCase(searchFriends.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.payload as string;
      });

    // Fetch blocked users
    builder
      .addCase(fetchBlockedUsers.fulfilled, (state, action) => {
        state.blockedUsers = action.payload;
      });
  },
});

// Экспортируем действия
export const {
  clearSearchResults,
  clearError,
  addFriendRequest,
  removeFriendRequest,
  updateFriendStatus,
  setRequestsCount,
} = friendSlice.actions;

// Селекторы
export const selectFriends = (state: { friend: FriendState }) => state.friend.friends;
export const selectSentRequests = (state: { friend: FriendState }) => state.friend.sentRequests;
export const selectReceivedRequests = (state: { friend: FriendState }) => state.friend.receivedRequests;
export const selectFriendSearchResults = (state: { friend: FriendState }) => state.friend.searchResults;
export const selectFriendSuggestions = (state: { friend: FriendState }) => state.friend.suggestions;
export const selectBlockedUsers = (state: { friend: FriendState }) => state.friend.blockedUsers;
export const selectFriendLoading = (state: { friend: FriendState }) => state.friend.isLoading;
export const selectFriendSearching = (state: { friend: FriendState }) => state.friend.isSearching;
export const selectFriendError = (state: { friend: FriendState }) => state.friend.error;
export const selectRequestsCount = (state: { friend: FriendState }) => state.friend.requestsCount;
export const selectIsFriend = (state: { friend: FriendState }, userId: string) =>
  state.friend.friends.some(friend => friend.id === userId);
export const selectIsBlocked = (state: { friend: FriendState }, userId: string) =>
  state.friend.blockedUsers.some(user => user.id === userId);

// Экспортируем reducer
export default friendSlice.reducer;