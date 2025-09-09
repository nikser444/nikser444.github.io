// Центральный экспорт всех страниц для удобного импорта
export { default as LoginPage } from './LoginPage';
export { default as RegisterPage } from './RegisterPage';
export { default as ChatPage } from './ChatPage';
export { default as FriendsPage } from './FriendsPage';
export { default as SettingsPage } from './SettingsPage';
export { default as CallPage } from './CallPage';

// Типы для роутинга
export type PageComponent = 
  | 'LoginPage'
  | 'RegisterPage'
  | 'ChatPage'
  | 'FriendsPage'
  | 'SettingsPage'
  | 'CallPage';

// Конфигурация маршрутов
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  CHAT: '/chat',
  FRIENDS: '/friends',
  SETTINGS: '/settings',
  CALL: '/call/:callId',
} as const;

// Защищённые маршруты (требуют авторизации)
export const PROTECTED_ROUTES = [
  ROUTES.CHAT,
  ROUTES.FRIENDS,
  ROUTES.SETTINGS,
  ROUTES.CALL,
] as const;

// Публичные маршруты (доступны без авторизации)
export const PUBLIC_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
] as const;