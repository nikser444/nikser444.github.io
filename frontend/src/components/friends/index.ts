// Центральный файл экспорта всех компонентов друзей
export { FriendsList } from './FriendsList';
export { FriendItem } from './FriendItem';
export { AddFriendModal } from './AddFriendModal';
export { FriendRequests } from './FriendRequests';

// Экспорт типов для удобства использования
export type { 
  Friend, 
  FriendRequest, 
  FriendStatus, 
  FriendRequestStatus 
} from '../../../types/user';

// Экспорт утилит для работы с друзьями
export const friendsUtils = {
  /**
   * Форматирует время последней активности пользователя
   */
  formatLastSeen: (lastSeen: Date): string => {
    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'недавно';
    if (hours < 24) return `${hours}ч назад`;
    if (days < 7) return `${days}д назад`;
    return lastSeen.toLocaleDateString();
  },

  /**
   * Проверяет, находится ли пользователь онлайн
   */
  isUserOnline: (lastSeen: Date, onlineThreshold: number = 5): boolean => {
    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    return diff <= onlineThreshold * 60 * 1000; // 5 минут по умолчанию
  },

  /**
   * Сортирует друзей по статусу онлайн и алфавиту
   */
  sortFriends: (friends: Friend[], onlineFriends: string[]): Friend[] => {
    return [...friends].sort((a, b) => {
      const aIsOnline = onlineFriends.includes(a.id);
      const bIsOnline = onlineFriends.includes(b.id);
      
      // Сначала онлайн пользователи
      if (aIsOnline && !bIsOnline) return -1;
      if (!aIsOnline && bIsOnline) return 1;
      
      // Затем по алфавиту
      return a.username.localeCompare(b.username);
    });
  },

  /**
   * Фильтрует друзей по поисковому запросу
   */
  filterFriends: (friends: Friend[], query: string): Friend[] => {
    if (!query.trim()) return friends;
    
    const searchQuery = query.toLowerCase();
    return friends.filter(friend => 
      friend.username.toLowerCase().includes(searchQuery) ||
      friend.email.toLowerCase().includes(searchQuery)
    );
  },

  /**
   * Валидирует email для добавления друга
   */
  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Валидирует имя пользователя
   */
  validateUsername: (username: string): boolean => {
    return username.trim().length >= 3 && username.trim().length <= 30;
  }
};

// Константы для компонентов друзей
export const FRIENDS_CONSTANTS = {
  MAX_SEARCH_RESULTS: 10,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 30,
  ONLINE_THRESHOLD_MINUTES: 5,
  REQUEST_EXPIRY_DAYS: 30,
  MAX_FRIENDS_COUNT: 1000
} as const;