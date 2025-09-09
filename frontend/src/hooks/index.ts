// Главный файл экспорта всех кастомных хуков
// Централизованный экспорт для удобного импорта в компонентах

// Основные хуки приложения
export { useAuth } from './useAuth';
export { useSocket } from './useSocket';
export { useWebRTC } from './useWebRTC';
export { useChat } from './useChat';
export { useNotifications } from './useNotifications';

// Утилитарные хуки
export { useLocalStorage, useLocalStorageWithPrefix, useLocalStorageSettings } from './useLocalStorage';
export { useDebounce, useDebouncedCallback, useAdvancedDebounce, useDebouncedSearch } from './useDebounce';
export { 
  useOnlineStatus,
  usePersistentState,
  useMediaQuery,
  useBreakpoints,
  useWindowSize,
  useClickOutside,
  useKeyPress,
  useHotkeys,
  useInterval,
  usePrevious,
  useToggle,
  useAsync,
  useCopyToClipboard,
  useGeolocation
} from './utilityHooks';

// Типы для внешнего использования
export type { UseAuthReturn } from './useAuth';
export type { UseSocketReturn } from './useSocket';  
export type { UseWebRTCReturn } from './useWebRTC';
export type { UseChatReturn } from './useChat';
export type { UseNotificationsReturn } from './useNotifications';

// Дополнительные типы
export type { UseLocalStorageReturn } from './useLocalStorage';

/*
Пример использования хуков в компонентах:

import { 
  useAuth, 
  useSocket, 
  useWebRTC, 
  useChat, 
  useNotifications,
  useDebounce,
  useMediaQuery,
  useLocalStorage 
} from '../hooks';

const MyComponent = () => {
  const { user, login, logout } = useAuth();
  const { socket, isConnected, sendMessage } = useSocket();
  const { chats, activeChat, loadChats } = useChat();
  const { notifications, showNotification } = useNotifications();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { value: settings } = useLocalStorage('appSettings', {});
  
  // Логика компонента...
  
  return (
    // JSX...
  );
};
*/