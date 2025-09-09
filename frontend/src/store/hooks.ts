// Проверка, онлайн ли пользователь
export const useIsUserOnline = (userId: string) => {
  return useAppSelector((state) => 
    state.user.onlineUsers.includes(userId)
  );
};

// Получение сообщений для конкретного чата
export const useChatMessages = (chatId: string) => {
  return useAppSelector((state) => 
    state.chat.messages[chatId] || []
  );
};

// Получение счетчика непрочитанных сообщений для чата
export const useUnreadCount = (chatId: string) => {
  return useAppSelector((state) => 
    state.chat.unreadCounts[chatId] || 0
  );
};

// Получение пользователей, которые печатают в чате
export const useTypingUsers = (chatId: string) => {
  return useAppSelector((state) => 
    state.chat.typingUsers[chatId] || []
  );
};

// Получение времени последнего посещения пользователя
export const useLastSeen = (userId: string) => {
  return useAppSelector((state) => 
    state.user.lastSeen[userId]
  );
};

// Получение потока для конкретного пользователя в звонке
export const useRemoteStream = (userId: string) => {
  return useAppSelector((state) => 
    state.call.remoteStreams[userId]
  );
};

// Проверка, включены ли уведомления определенного типа
export const useNotificationTypeEnabled = (type: string) => {
  return useAppSelector((state) => 
    state.notification.settings.types[type as keyof typeof state.notification.settings.types]
  );
};

// Проверка режима "Не беспокоить"
export const useIsDoNotDisturb = () => {
  return useAppSelector((state) => {
    const { doNotDisturb } = state.notification.settings;
    if (!doNotDisturb.enabled) return false;
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return currentTime >= doNotDisturb.from || currentTime <= doNotDisturb.to;
  });
};

// Получение общего количества непрочитанных сообщений
export const useTotalUnreadCount = () => {
  return useAppSelector((state) => 
    Object.values(state.chat.unreadCounts).reduce((total, count) => total + count, 0)
  );
};

// Проверка, есть ли активный звонок
export const useHasActiveCall = () => {
  return useAppSelector((state) => 
    !!(state.call.currentCall || state.call.incomingCall)
  );
};

// Получение настроек темы
export const useTheme = () => {
  return useAppSelector((state) => state.user.settings.theme);
};

// Получение настроек языка
export const useLanguage = () => {
  return useAppSelector((state) => state.user.settings.language);
};

// Проверка, есть ли ошибки в любом из слайсов
export const useHasErrors = () => {
  return useAppSelector((state) => 
    !!(state.auth.error || 
       state.chat.error || 
       state.user.error || 
       state.friend.error || 
       state.call.error || 
       state.notification.error)
  );
};

// Получение всех ошибок
export const useAllErrors = () => {
  return useAppSelector((state) => ({
    auth: state.auth.error,
    chat: state.chat.error,
    user: state.user.error,
    friend: state.friend.error,
    call: state.call.error,
    notification: state.notification.error,
  }));
};

// Проверка, идет ли загрузка в любом из слайсов
export const useIsLoading = () => {
  return useAppSelector((state) => 
    state.auth.isLoading || 
    state.chat.isLoading || 
    state.user.isLoading || 
    state.friend.isLoading || 
    state.notification.isLoading ||
    state.call.isConnecting
  );
}; frontend/src/store/hooks.ts
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

// Типизированные хуки для работы с Redux
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Дополнительные хуки для удобства

// Хук для получения состояния авторизации
export const useAuth = () => {
  return useAppSelector((state) => ({
    user: state.auth.user,
    token: state.auth.token,
    isAuthenticated: state.auth.isAuthenticated,
    isLoading: state.auth.isLoading,
    error: state.auth.error,
    lastActivity: state.auth.lastActivity,
  }));
};

// Хук для получения состояния чатов
export const useChat = () => {
  return useAppSelector((state) => ({
    chats: state.chat.chats,
    activeChat: state.chat.activeChat,
    messages: state.chat.messages,
    isLoading: state.chat.isLoading,
    isLoadingMessages: state.chat.isLoadingMessages,
    error: state.chat.error,
    typingUsers: state.chat.typingUsers,
    unreadCounts: state.chat.unreadCounts,
    searchResults: state.chat.searchResults,
    isSearching: state.chat.isSearching,
  }));
};

// Хук для получения состояния пользователя
export const useUser = () => {
  return useAppSelector((state) => ({
    profile: state.user.profile,
    status: state.user.status,
    settings: state.user.settings,
    onlineUsers: state.user.onlineUsers,
    isLoading: state.user.isLoading,
    isUpdating: state.user.isUpdating,
    error: state.user.error,
    lastSeen: state.user.lastSeen,
  }));
};

// Хук для получения состояния друзей
export const useFriend = () => {
  return useAppSelector((state) => ({
    friends: state.friend.friends,
    sentRequests: state.friend.sentRequests,
    receivedRequests: state.friend.receivedRequests,
    searchResults: state.friend.searchResults,
    suggestions: state.friend.suggestions,
    blockedUsers: state.friend.blockedUsers,
    isLoading: state.friend.isLoading,
    isSearching: state.friend.isSearching,
    error: state.friend.error,
    requestsCount: state.friend.requestsCount,
  }));
};

// Хук для получения состояния звонков
export const useCall = () => {
  return useAppSelector((state) => ({
    currentCall: state.call.currentCall,
    incomingCall: state.call.incomingCall,
    callHistory: state.call.callHistory,
    isConnecting: state.call.isConnecting,
    isInCall: state.call.isInCall,
    mediaSettings: state.call.mediaSettings,
    availableDevices: state.call.availableDevices,
    callStats: state.call.callStats,
    error: state.call.error,
    isScreenSharing: state.call.isScreenSharing,
    participants: state.call.participants,
    localStream: state.call.localStream,
    remoteStreams: state.call.remoteStreams,
  }));
};

// Хук для получения состояния уведомлений
export const useNotification = () => {
  return useAppSelector((state) => ({
    notifications: state.notification.notifications,
    toasts: state.notification.toasts,
    unreadCount: state.notification.unreadCount,
    settings: state.notification.settings,
    isLoading: state.notification.isLoading,
    error: state.notification.error,
    permission: state.notification.permission,
    soundEnabled: state.notification.soundEnabled,
  }));
};

// Хуки для конкретных селекторов

// Проверка, является ли пользователь другом
export const useIsFriend = (userId: string) => {
  return useAppSelector((state) => 
    state.friend.friends.some(friend => friend.id === userId)
  );
};

// Проверка, заблокирован ли пользователь
export const useIsBlocked = (userId: string) => {
  return useAppSelector((state) => 
    state.friend.blockedUsers.some(user => user.id === userId)
  );
};

//