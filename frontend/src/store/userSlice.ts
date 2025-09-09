// frontend/src/store/userSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { userService } from '../services';
import type { User } from '../types/user';

// Типы для статуса пользователя
export type UserStatus = 'online' | 'away' | 'busy' | 'offline';

// Типы для настроек пользователя
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'ru' | 'en';
  notifications: {
    sound: boolean;
    desktop: boolean;
    email: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
    showLastSeen: boolean;
    allowCalls: 'everyone' | 'friends' | 'nobody';
  };
}

// Состояние пользователя
export interface UserState {
  profile: User | null;
  status: UserStatus;
  settings: UserSettings;
  onlineUsers: string[];
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  lastSeen: Record<string, number>;
}

// Начальные настройки
const defaultSettings: UserSettings = {
  theme: 'system',
  language: 'ru',
  notifications: {
    sound: true,
    desktop: true,
    email: true,
  },
  privacy: {
    showOnlineStatus: true,
    showLastSeen: true,
    allowCalls: 'everyone',
  },
};

// Начальное состояние
const initialState: UserState = {
  profile: null,
  status: 'offline',
  settings: defaultSettings,
  onlineUsers: [],
  isLoading: false,
  isUpdating: false,
  error: null,
  lastSeen: {},
};

// Асинхронные thunks
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userService.getProfile();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка загрузки профиля'
      );
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (
    profileData: Partial<User>,
    { rejectWithValue }
  ) => {
    try {
      const response = await userService.updateProfile(profileData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка обновления профиля'
      );
    }
  }
);

export const uploadAvatar = createAsyncThunk(
  'user/uploadAvatar',
  async (file: File, { rejectWithValue }) => {
    try {
      const response = await userService.uploadAvatar(file);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка загрузки аватара'
      );
    }
  }
);

export const updateUserSettings = createAsyncThunk(
  'user/updateSettings',
  async (
    settings: Partial<UserSettings>,
    { rejectWithValue }
  ) => {
    try {
      const response = await userService.updateSettings(settings);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка обновления настроек'
      );
    }
  }
);

export const updateUserStatus = createAsyncThunk(
  'user/updateStatus',
  async (status: UserStatus, { rejectWithValue }) => {
    try {
      const response = await userService.updateStatus(status);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка обновления статуса'
      );
    }
  }
);

export const searchUsers = createAsyncThunk(
  'user/searchUsers',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await userService.searchUsers(query);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка поиска пользователей'
      );
    }
  }
);

// Создаем slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserStatus: (state, action: PayloadAction<UserStatus>) => {
      state.status = action.payload;
    },
    setOnlineUsers: (state, action: PayloadAction<string[]>) => {
      state.onlineUsers = action.payload;
    },
    addOnlineUser: (state, action: PayloadAction<string>) => {
      if (!state.onlineUsers.includes(action.payload)) {
        state.onlineUsers.push(action.payload);
      }
    },
    removeOnlineUser: (state, action: PayloadAction<string>) => {
      state.onlineUsers = state.onlineUsers.filter(id => id !== action.payload);
    },
    updateLastSeen: (state, action: PayloadAction<{ userId: string; timestamp: number }>) => {
      const { userId, timestamp } = action.payload;
      state.lastSeen[userId] = timestamp;
    },
    updateSettings: (state, action: PayloadAction<Partial<UserSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    updateNotificationSettings: (
      state,
      action: PayloadAction<Partial<UserSettings['notifications']>>
    ) => {
      state.settings.notifications = {
        ...state.settings.notifications,
        ...action.payload
      };
    },
    updatePrivacySettings: (
      state,
      action: PayloadAction<Partial<UserSettings['privacy']>>
    ) => {
      state.settings.privacy = {
        ...state.settings.privacy,
        ...action.payload
      };
    },
    clearError: (state) => {
      state.error = null;
    },
    resetUserState: (state) => {
      state.profile = null;
      state.status = 'offline';
      state.onlineUsers = [];
      state.lastSeen = {};
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload.user;
        state.settings = { ...defaultSettings, ...action.payload.settings };
        state.status = action.payload.status || 'online';
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isUpdating = false;
        if (state.profile) {
          state.profile = { ...state.profile, ...action.payload };
        }
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // Upload avatar
    builder
      .addCase(uploadAvatar.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.isUpdating = false;
        if (state.profile) {
          state.profile.avatar = action.payload.avatarUrl;
        }
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // Update settings
    builder
      .addCase(updateUserSettings.fulfilled, (state, action) => {
        state.settings = { ...state.settings, ...action.payload };
      });

    // Update status
    builder
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        state.status = action.payload.status;
      });
  },
});

// Экспортируем действия
export const {
  setUserStatus,
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  updateLastSeen,
  updateSettings,
  updateNotificationSettings,
  updatePrivacySettings,
  clearError,
  resetUserState,
} = userSlice.actions;

// Селекторы
export const selectUserProfile = (state: { user: UserState }) => state.user.profile;
export const selectUserStatus = (state: { user: UserState }) => state.user.status;
export const selectUserSettings = (state: { user: UserState }) => state.user.settings;
export const selectOnlineUsers = (state: { user: UserState }) => state.user.onlineUsers;
export const selectUserLoading = (state: { user: UserState }) => state.user.isLoading;
export const selectUserUpdating = (state: { user: UserState }) => state.user.isUpdating;
export const selectUserError = (state: { user: UserState }) => state.user.error;
export const selectLastSeen = (state: { user: UserState }, userId: string) =>
  state.user.lastSeen[userId];
export const selectIsUserOnline = (state: { user: UserState }, userId: string) =>
  state.user.onlineUsers.includes(userId);

// Экспортируем reducer
export default userSlice.reducer;