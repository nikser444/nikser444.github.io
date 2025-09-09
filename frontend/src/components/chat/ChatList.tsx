import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setActiveChat } from '../../store/chatSlice';
import { useSocket } from '../../hooks/useSocket';
import { chatService } from '../../services/chatService';
import { Chat } from '../../types/chat';
import { User } from '../../types/user';
import Avatar from '../common/Avatar';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ChatListProps {
  className?: string;
}

const ChatList: React.FC<ChatListProps> = ({ className = '' }) => {
  const dispatch = useDispatch();
  const { chats, activeChat, loading } = useSelector((state: RootState) => state.chat);
  const { user } = useSelector((state: RootState) => state.auth);
  const { socket, isConnected } = useSocket();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadChats = async () => {
      try {
        await chatService.getChats();
      } catch (error) {
        console.error('Ошибка загрузки чатов:', error);
      }
    };

    if (user) {
      loadChats();
    }
  }, [user]);

  useEffect(() => {
    if (socket && isConnected) {
      // Обновление списка чатов при новом сообщении
      socket.on('message:receive', (message) => {
        // Обновляем lastMessage в чате
      });

      // Обновление статуса пользователей
      socket.on('user:online', (userId: string) => {
        // Обновляем статус пользователя
      });

      socket.on('user:offline', (userId: string) => {
        // Обновляем статус пользователя
      });

      return () => {
        socket.off('message:receive');
        socket.off('user:online');
        socket.off('user:offline');
      };
    }
  }, [socket, isConnected]);

  const handleChatSelect = (chat: Chat) => {
    dispatch(setActiveChat(chat));
  };

  const getLastMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: ru
    });
  };

  const getChatName = (chat: Chat): string => {
    if (chat.type === 'group') {
      return chat.name || 'Групповой чат';
    }
    
    // Для личного чата берем имя собеседника
    const otherParticipant = chat.participants.find((p: User) => p.id !== user?.id);
    return otherParticipant ? `${otherParticipant.firstName} ${otherParticipant.lastName}` : 'Неизвестный пользователь';
  };

  const getChatAvatar = (chat: Chat): string | null => {
    if (chat.type === 'group') {
      return chat.avatar || null;
    }
    
    const otherParticipant = chat.participants.find((p: User) => p.id !== user?.id);
    return otherParticipant?.avatar || null;
  };

  const getOnlineStatus = (chat: Chat): boolean => {
    if (chat.type === 'group') return false;
    
    const otherParticipant = chat.participants.find((p: User) => p.id !== user?.id);
    return otherParticipant?.isOnline || false;
  };

  const filteredChats = chats.filter((chat) =>
    getChatName(chat).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedChats = [...filteredChats].sort((a, b) => {
    if (!a.lastMessage && !b.lastMessage) return 0;
    if (!a.lastMessage) return 1;
    if (!b.lastMessage) return -1;
    return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
  });

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col ${className}`}>
      {/* Поиск */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <input
            type="text"
            placeholder="Поиск чатов..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Список чатов */}
      <div className="flex-1 overflow-y-auto">
        {sortedChats.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <svg
              className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {searchTerm ? 'Чаты не найдены' : 'У вас пока нет чатов'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleChatSelect(chat)}
                className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  activeChat?.id === chat.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-r-4 border-blue-500'
                    : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar
                      src={getChatAvatar(chat)}
                      alt={getChatName(chat)}
                      size="md"
                      fallback={getChatName(chat).charAt(0).toUpperCase()}
                    />
                    {chat.type === 'private' && getOnlineStatus(chat) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {getChatName(chat)}
                      </h3>
                      {chat.lastMessage && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getLastMessageTime(chat.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {chat.lastMessage ? (
                          <>
                            {chat.lastMessage.senderId === user?.id && (
                              <span className="text-blue-500">Вы: </span>
                            )}
                            {chat.lastMessage.type === 'text' 
                              ? chat.lastMessage.content 
                              : chat.lastMessage.type === 'image' 
                              ? '📷 Изображение'
                              : chat.lastMessage.type === 'file'
                              ? '📎 Файл'
                              : 'Сообщение'
                            }
                          </>
                        ) : (
                          'Нет сообщений'
                        )}
                      </p>
                      
                      {chat.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-500 rounded-full">
                          {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Статус подключения */}
      {!isConnected && (
        <div className="p-2 bg-red-100 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <div className="flex items-center justify-center text-sm text-red-600 dark:text-red-400">
            <div className="animate-pulse w-2 h-2 bg-red-500 rounded-full mr-2"></div>
            Подключение...
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatList;