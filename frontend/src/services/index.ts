// frontend/src/services/index.ts

// Экспорт основных сервисов
export { api, default as apiClient } from './api';
export { authService, default as AuthService } from './authService';
export { chatService, default as ChatService } from './chatService';
export { userService, default as UserService } from './userService';
export { friendService, default as FriendService } from './friendService';
export { notificationService, default as NotificationService } from './notificationService';
export { callService, default as CallService } from './callService';

// Экспорт типов из сервисов
export type {
  // API types
  ApiResponse,
  ApiError
} from '../types/api';

export type {
  // Auth service types
  LoginData,
  RegisterData,
  AuthResponse,
  ForgotPasswordData,
  ResetPasswordData,
  ChangePasswordData
} from './authService';

export type {
  // Chat service types
  CreateChatData,
  UpdateChatData,
  SendMessageData,
  GetMessagesParams,
  SearchChatsParams,
  SearchMessagesParams
} from './chatService';

export type {
  // User service types
  UpdateUserData,
  SearchUsersParams,
  UserSettingsData,
  BlockUserData
} from './userService';

export type {
  // Friend service types
  FriendRequest,
  SendFriendRequestData,
  GetFriendRequestsParams,
  SearchFriendsParams
} from './friendService';

export type {
  // Notification service types
  Notification,
  GetNotificationsParams,
  CreateNotificationData,
  NotificationSettings
} from './notificationService';

export type {
  // Call service types
  InitiateCallData,
  CreateConferenceData,
  JoinCallData,
  CallSettings,
  CallStats
} from './callService';

// Объект с все сервисами для удобного использования
export const services = {
  api,
  auth: authService,
  chat: chatService,
  user: userService,
  friend: friendService,
  notification: notificationService,
  call: callService,
} as const;

// Типы для объекта services
export type Services = typeof services;
export type ServiceNames = keyof Services;

// Утилитарные функции для работы с сервисами
export const getService = <T extends ServiceNames>(name: T): Services[T] => {
  return services[name];
};

// Проверка доступности сервисов
export const checkServicesHealth = async (): Promise<{
  [K in ServiceNames]: boolean;
}> => {
  const results = {} as { [K in ServiceNames]: boolean };

  try {
    // Проверяем API
    await api.get('/health');
    results.api = true;
  } catch {
    results.api = false;
  }

  try {
    // Проверяем auth сервис
    const token = authService.getToken();
    results.auth = authService.isAuthenticated() && !!token;
  } catch {
    results.auth = false;
  }

  // Остальные сервисы помечаем как доступные, если API работает
  results.chat = results.api;
  results.user = results.api;
  results.friend = results.api;
  results.notification = results.api;
  results.call = results.api && callService.isWebRTCSupported();

  return results;
};

// Инициализация сервисов
export const initializeServices = async (): Promise<void> => {
  try {
    // Проверяем состояние авторизации
    if (authService.isAuthenticated()) {
      // Можно добавить дополнительную логику инициализации
      console.log('Services initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing services:', error);
  }
};

// Очистка сервисов (например, при выходе пользователя)
export const cleanupServices = (): void => {
  try {
    // Очищаем токены авторизации
    authService.logout();
    
    // Можно добавить дополнительную логику очистки
    console.log('Services cleaned up');
  } catch (error) {
    console.error('Error cleaning up services:', error);
  }
};

export default services;