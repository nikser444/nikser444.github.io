// frontend/src/store/middleware.ts
import { Middleware } from '@reduxjs/toolkit';
import type { RootState } from './index';
import { addToast } from './notificationSlice';
import { clearAuth } from './authSlice';

// Middleware для обработки ошибок API
export const apiErrorMiddleware: Middleware<{}, RootState> = 
  (storeAPI) => (next) => (action: any) => {
    const result = next(action);
    
    // Проверяем, если это rejected action от async thunk
    if (action.type.endsWith('/rejected')) {
      const error = action.payload || action.error?.message;
      
      // Обрабатываем ошибки авторизации
      if (action.type.includes('auth/') && error?.includes('401')) {
        storeAPI.dispatch(clearAuth());
        storeAPI.dispatch(addToast({
          id: Date.now().toString(),
          type: 'error',
          message: 'Сессия истекла. Пожалуйста, войдите снова.',
          duration: 5000,
        }));
      }
      
      // Показываем toast для критических ошибок
      if (error && typeof error === 'string') {
        const criticalErrors = [
          'Network Error',
          'Connection failed',
          'Server Error',
          '500',
          '502',
          '503',
          '504'
        ];
        
        const isCritical = criticalErrors.some(criticalError => 
          error.toLowerCase().includes(criticalError.toLowerCase())
        );
        
        if (isCritical) {
          storeAPI.dispatch(addToast({
            id: Date.now().toString(),
            type: 'error',
            title: 'Ошибка подключения',
            message: 'Проблемы с подключением к серверу. Попробуйте позже.',
            duration: 7000,
          }));
        }
      }
    }
    
    // Обрабатываем успешные действия
    if (action.type.endsWith('/fulfilled')) {
      // Показываем success toast для определенных действий
      const successActions = [
        'auth/registerUser',
        'friend/sendRequest',
        'friend/acceptRequest',
        'user/updateProfile',
        'user/uploadAvatar',
      ];
      
      if (successActions.some(successAction => action.type.includes(successAction))) {
        const messages = {
          'auth/registerUser': 'Регистрация прошла успешно!',
          'friend/sendRequest': 'Заявка в друзья отправлена!',
          'friend/acceptRequest': 'Заявка в друзья принята!',
          'user/updateProfile': 'Профиль обновлен!',
          'user/uploadAvatar': 'Аватар загружен!',
        };
        
        const matchedAction = successActions.find(successAction => 
          action.type.includes(successAction)
        );
        
        if (matchedAction) {
          storeAPI.dispatch(addToast({
            id: Date.now().toString(),
            type: 'success',
            message: messages[matchedAction as keyof typeof messages],
            duration: 3000,
          }));
        }
      }
    }
    
    return result;
  };

// Middleware для логирования действий (только в development)
export const loggingMiddleware: Middleware<{}, RootState> = 
  (storeAPI) => (next) => (action: any) => {
    if (process.env.NODE_ENV === 'development') {
      const prevState = storeAPI.getState();
      const result = next(action);
      const nextState = storeAPI.getState();
      
      console.group(`🚀 Action: ${action.type}`);
      console.log('⏰ Time:', new Date().toLocaleTimeString());
      console.log('📥 Action:', action);
      console.log('📊 Previous State:', prevState);
      console.log('📊 Next State:', nextState);
      console.groupEnd();
      
      return result;
    }
    
    return next(action);
  };

// Middleware для отслеживания активности пользователя
export const activityMiddleware: Middleware<{}, RootState> = 
  (storeAPI) => (next) => (action: any) => {
    const result = next(action);
    
    // Список действий, которые считаются активностью пользователя
    const userActivityActions = [
      'chat/sendMessage',
      'chat/setActiveChat',
      'message/send',
      'call/initiate',
      'call/accept',
      'user/updateStatus',
    ];
    
    if (userActivityActions.some(activityAction => 
        action.type.includes(activityAction))) {
      
      const state = storeAPI.getState();
      if (state.auth.isAuthenticated) {
        // Здесь можно добавить логику для обновления времени последней активности
        // Например, отправить heartbeat на сервер
        console.log('User activity detected:', action.type);
      }
    }
    
    return result;
  };

// Middleware для автоматического сохранения настроек
export const settingsMiddleware: Middleware<{}, RootState> = 
  (storeAPI) => (next) => (action: any) => {
    const result = next(action);
    
    // Автоматически сохраняем настройки пользователя при их изменении
    const settingsActions = [
      'user/updateSettings',
      'user/updateNotificationSettings',
      'user/updatePrivacySettings',
      'notification/updateSettings',
      'notification/toggleNotificationType',
      'notification/toggleDoNotDisturb',
    ];
    
    if (settingsActions.some(settingsAction => 
        action.type.includes(settingsAction))) {
      
      const state = storeAPI.getState();
      
      // Сохраняем настройки в localStorage как резервную копию
      try {
        const settings = {
          user: state.user.settings,
          notification: state.notification.settings,
        };
        localStorage.setItem('userSettings', JSON.stringify(settings));
      } catch (error) {
        console.error('Failed to save settings to localStorage:', error);
      }
    }
    
    return result;
  };

// Middleware для валидации состояния
export const validationMiddleware: Middleware<{}, RootState> = 
  (storeAPI) => (next) => (action: any) => {
    const result = next(action);
    
    if (process.env.NODE_ENV === 'development') {
      const state = storeAPI.getState();
      
      // Проверяем консистентность данных
      const validationRules = [
        // Проверяем, что если пользователь аутентифицирован, то у него есть профиль
        () => {
          if (state.auth.isAuthenticated && !state.auth.user) {
            console.warn('🚨 Validation Warning: User is authenticated but no user data found');
          }
        },
        
        // Проверяем, что активный чат существует в списке чатов
        () => {
          if (state.chat.activeChat) {
            const chatExists = state.chat.chats.some(chat => chat.id === state.chat.activeChat?.id);
            if (!chatExists) {
              console.warn('🚨 Validation Warning: Active chat not found in chats list');
            }
          }
        },
        
        // Проверяем, что количество непрочитанных уведомлений соответствует фактическому количеству
        () => {
          const unreadNotifications = state.notification.notifications.filter(n => !n.read);
          if (unreadNotifications.length !== state.notification.unreadCount) {
            console.warn('🚨 Validation Warning: Unread count mismatch', {
              actual: unreadNotifications.length,
              stored: state.notification.unreadCount
            });
          }
        },
      ];
      
      validationRules.forEach(rule => {
        try {
          rule();
        } catch (error) {
          console.error('Validation rule failed:', error);
        }
      });
    }
    
    return result;
  };

// Middleware для обработки WebSocket событий
export const websocketMiddleware: Middleware<{}, RootState> = 
  (storeAPI) => (next) => (action: any) => {
    const result = next(action);
    
    // Обрабатываем действия, которые должны быть отправлены через WebSocket
    const websocketActions = [
      'chat/sendMessage',
      'chat/setTypingUsers',
      'user/updateStatus',
      'call/initiate',
      'call/accept',
      'call/decline',
      'call/end',
    ];
    
    if (websocketActions.some(wsAction => action.type.includes(wsAction))) {
      // Здесь будет логика для отправки данных через WebSocket
      // Это будет интегрировано с WebSocket клиентом
      console.log('WebSocket action:', action.type, action.payload);
    }
    
    return result;
  };

// Экспортируем все middleware
export const customMiddleware = [
  apiErrorMiddleware,
  activityMiddleware,
  settingsMiddleware,
  validationMiddleware,
  websocketMiddleware,
  // Добавляем loggingMiddleware только в development
  ...(process.env.NODE_ENV === 'development' ? [loggingMiddleware] : []),
];