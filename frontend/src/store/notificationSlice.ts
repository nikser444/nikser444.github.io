// frontend/src/store/notificationSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { notificationService } from '../services';

// Типы уведомлений
export type NotificationType = 
  | 'message' 
  | 'friend_request' 
  | 'call_incoming' 
  | 'call_missed' 
  | 'system' 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info';

// Интерфейс уведомления
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  userId?: string;
  chatId?: string;
  callId?: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
}

// Действия уведомлений
export interface NotificationAction {
  id: string;
  label: string;
  action: string;
  style?: 'primary' | 'secondary' | 'danger';
}

// Настройки уведомлений
export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  email: boolean;
  types: Record<NotificationType, boolean>;
  doNotDisturb: {
    enabled: boolean;
    from: string; // время в формате HH:mm
    to: string; // время в формате HH:mm
  };
  priority: {
    calls: boolean;
    friendRequests: boolean;
    mentions: boolean;
  };
}

// Toast уведомления (временные)
export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Состояние уведомлений
export interface NotificationState {
  notifications: Notification[];
  toasts: ToastNotification[];
  unreadCount: number;
  settings: NotificationSettings;
  isLoading: boolean;
  error: string | null;
  permission: NotificationPermission;
  soundEnabled: boolean;
}

// Начальные настройки
const defaultSettings: NotificationSettings = {
  enabled: true,
  sound: true,
  desktop: true,
  email: true,
  types: {
    message: true,
    friend_request: true,
    call_incoming: true,
    call_missed: true,
    system: true,
    success: true,
    error: true,
    warning: true,
    info: true,
  },
  doNotDisturb: {
    enabled: false,
    from: '22:00',
    to: '08:00',
  },
  priority: {
    calls: true,
    friendRequests: true,
    mentions: true,
  },
};

// Начальное состояние
const initialState: NotificationState = {
  notifications: [],
  toasts: [],
  unreadCount: 0,
  settings: defaultSettings,
  isLoading: false,
  error: null,
  permission: 'default',
  soundEnabled: true,
};

// Асинхронные thunks
export const fetchNotifications = createAsyncThunk(
  'notification/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationService.getNotifications();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка загрузки уведомлений'
      );
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await notificationService.markAsRead(notificationId);
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка отметки как прочитанное'
      );
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  'notification/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.markAllAsRead();
      return null;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка отметки всех как прочитанные'
      );
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notification/delete',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await notificationService.deleteNotification(notificationId);
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка удаления уведомления'
      );
    }
  }
);

export const clearAllNotifications = createAsyncThunk(
  'notification/clearAll',
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.clearAll();
      return null;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка очистки уведомлений'
      );
    }
  }
);

export const updateNotificationSettings = createAsyncThunk(
  'notification/updateSettings',
  async (
    settings: Partial<NotificationSettings>,
    { rejectWithValue }
  ) => {
    try {
      const response = await notificationService.updateSettings(settings);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка обновления настроек'
      );
    }
  }
);

export const requestNotificationPermission = createAsyncThunk(
  'notification/requestPermission',
  async (_, { rejectWithValue }) => {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission;
      } else {
        throw new Error('Уведомления не поддерживаются в этом браузере');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Ошибка запроса разрешения');
    }
  }
);

// Создаем slice
const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      const notification = action.payload;
      
      // Проверяем, не существует ли уже такое уведомление
      const exists = state.notifications.find(n => n.id === notification.id);
      if (!exists) {
        state.notifications.unshift(notification);
        
        if (!notification.read) {
          state.unreadCount += 1;
        }
        
        // Ограничиваем количество уведомлений (например, последние 100)
        if (state.notifications.length > 100) {
          state.notifications = state.notifications.slice(0, 100);
        }
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      
      if (notification && !notification.read) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      
      state.notifications = state.notifications.filter(n => n.id !== notificationId);
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    addToast: (state, action: PayloadAction<ToastNotification>) => {
      const toast = action.payload;
      
      // Проверяем, не существует ли уже такой toast
      const exists = state.toasts.find(t => t.id === toast.id);
      if (!exists) {
        state.toasts.push(toast);
      }
    },
    removeToast: (state, action: PayloadAction<string>) => {
      const toastId = action.payload;
      state.toasts = state.toasts.filter(t => t.id !== toastId);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },
    updateSettings: (state, action: PayloadAction<Partial<NotificationSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    toggleNotificationType: (
      state, 
      action: PayloadAction<NotificationType>
    ) => {
      const type = action.payload;
      state.settings.types[type] = !state.settings.types[type];
    },
    toggleDoNotDisturb: (state) => {
      state.settings.doNotDisturb.enabled = !state.settings.doNotDisturb.enabled;
    },
    setDoNotDisturbTime: (
      state, 
      action: PayloadAction<{ from: string; to: string }>
    ) => {
      const { from, to } = action.payload;
      state.settings.doNotDisturb.from = from;
      state.settings.doNotDisturb.to = to;
    },
    setSoundEnabled: (state, action: PayloadAction<boolean>) => {
      state.soundEnabled = action.payload;
      state.settings.sound = action.payload;
    },
    setNotificationPermission: (state, action: PayloadAction<NotificationPermission>) => {
      state.permission = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch notifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
        
        // Обновляем настройки, если они пришли с сервера
        if (action.payload.settings) {
          state.settings = { ...state.settings, ...action.payload.settings };
        }
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Mark as read
    builder
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notificationId = action.payload;
        const notification = state.notifications.find(n => n.id === notificationId);
        
        if (notification && !notification.read) {
          notification.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });

    // Mark all as read
    builder
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach(notification => {
          notification.read = true;
        });
        state.unreadCount = 0;
      });

    // Delete notification
    builder
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const notificationId = action.payload;
        const notification = state.notifications.find(n => n.id === notificationId);
        
        if (notification && !notification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        
        state.notifications = state.notifications.filter(n => n.id !== notificationId);
      });

    // Clear all notifications
    builder
      .addCase(clearAllNotifications.fulfilled, (state) => {
        state.notifications = [];
        state.unreadCount = 0;
      });

    // Update settings
    builder
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.settings = { ...state.settings, ...action.payload };
      });

    // Request permission
    builder
      .addCase(requestNotificationPermission.fulfilled, (state, action) => {
        state.permission = action.payload;
      });
  },
});

// Экспортируем действия
export const {
  addNotification,
  removeNotification,
  markNotificationAsRead,
  addToast,
  removeToast,
  clearToasts,
  updateSettings,
  toggleNotificationType,
  toggleDoNotDisturb,
  setDoNotDisturbTime,
  setSoundEnabled,
  setNotificationPermission,
  clearError,
  setUnreadCount,
} = notificationSlice.actions;

// Селекторы
export const selectNotifications = (state: { notification: NotificationState }) => 
  state.notification.notifications;
export const selectUnreadNotifications = (state: { notification: NotificationState }) => 
  state.notification.notifications.filter(n => !n.read);
export const selectUnreadCount = (state: { notification: NotificationState }) => 
  state.notification.unreadCount;
export const selectToasts = (state: { notification: NotificationState }) => 
  state.notification.toasts;
export const selectNotificationSettings = (state: { notification: NotificationState }) => 
  state.notification.settings;
export const selectNotificationLoading = (state: { notification: NotificationState }) => 
  state.notification.isLoading;
export const selectNotificationError = (state: { notification: NotificationState }) => 
  state.notification.error;
export const selectNotificationPermission = (state: { notification: NotificationState }) => 
  state.notification.permission;
export const selectSoundEnabled = (state: { notification: NotificationState }) => 
  state.notification.soundEnabled;
export const selectIsDoNotDisturb = (state: { notification: NotificationState }) => {
  const { doNotDisturb } = state.notification.settings;
  if (!doNotDisturb.enabled) return false;
  
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  return currentTime >= doNotDisturb.from || currentTime <= doNotDisturb.to;
};

// Экспортируем reducer
export default notificationSlice.reducer;