import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { addMessage, markAsRead } from '../../store/chatSlice';
import { useSocket } from '../../hooks/useSocket';
import { messageService } from '../../services/chatService';
import { Message } from '../../types/message';
import { User } from '../../types/user';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';
import Avatar from '../common/Avatar';

interface ChatWindowProps {
  className?: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ className = '' }) => {
  const dispatch = useDispatch();
  const { activeChat, messages, loading } = useSelector((state: RootState) => state.chat);
  const { user } = useSelector((state: RootState) => state.auth);
  const { socket, isConnected } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState<{ [key: string]: boolean }>({});
  const [loadingMore, setLoadingMore] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Автоматическая прокрутка к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (activeChat && user) {
      // Загружаем сообщения для активного чата
      const loadMessages = async () => {
        try {
          await messageService.getMessages(activeChat.id);
          // Отмечаем сообщения как прочитанные
          dispatch(markAsRead(activeChat.id));
        } catch (error) {
          console.error('Ошибка загрузки сообщений:', error);
        }
      };

      loadMessages();
    }
  }, [activeChat, user, dispatch]);

  useEffect(() => {
    if (socket && isConnected && activeChat) {
      // Присоединяемся к комнате чата
      socket.emit('chat:join', activeChat.id);

      // Получение новых сообщений
      socket.on('message:receive', (message: Message) => {
        if (message.chatId === activeChat.id) {
          dispatch(addMessage(message));
          // Отмечаем как прочитанное, если чат активен
          if (document.hasFocus()) {
            socket.emit('message:read', { messageId: message.id, chatId: activeChat.id });
          }
        }
      });

      // Получение уведомлений о печатании
      socket.on('user:typing', ({ userId, chatId, isTyping: typing }) => {
        if (chatId === activeChat.id && userId !== user?.id) {
          setIsTyping(prev => ({ ...prev, [userId]: typing }));
          
          if (typing) {
            // Убираем индикатор печатания через 3 секунды
            setTimeout(() => {
              setIsTyping(prev => ({ ...prev, [userId]: false }));
            }, 3000);
          }
        }
      });

      // Уведомления о прочтении сообщений
      socket.on('message:read', ({ messageId, userId }) => {
        // Обновляем статус прочтения сообщения
      });

      return () => {
        socket.emit('chat:leave', activeChat.id);
        socket.off('message:receive');
        socket.off('user:typing');
        socket.off('message:read');
      };
    }
  }, [socket, isConnected, activeChat, user, dispatch]);

  const handleSendMessage = async (content: string, type: 'text' | 'image' | 'file' = 'text', fileUrl?: string, fileName?: string) => {
    if (!activeChat || !user || !content.trim()) return;

    try {
      const messageData = {
        chatId: activeChat.id,
        content,
        type,
        fileUrl,
        fileName
      };

      // Отправляем сообщение через WebSocket для мгновенного отображения
      if (socket && isConnected) {
        socket.emit('message:send', messageData);
      }

      // Дублируем через HTTP API для надежности
      await messageService.sendMessage(messageData);
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (!socket || !activeChat || !user) return;

    socket.emit('user:typing', {
      chatId: activeChat.id,
      userId: user.id,
      isTyping
    });
  };

  const loadMoreMessages = async () => {
    if (!activeChat || loadingMore) return;

    setLoadingMore(true);
    try {
      const oldestMessage = messages[0];
      if (oldestMessage) {
        await messageService.getMessages(activeChat.id, {
          before: oldestMessage.createdAt,
          limit: 20
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const getChatName = (): string => {
    if (!activeChat) return '';
    
    if (activeChat.type === 'group') {
      return activeChat.name || 'Групповой чат';
    }
    
    const otherParticipant = activeChat.participants.find((p: User) => p.id !== user?.id);
    return otherParticipant ? `${otherParticipant.firstName} ${otherParticipant.lastName}` : 'Неизвестный пользователь';
  };

  const getChatAvatar = (): string | null => {
    if (!activeChat) return null;
    
    if (activeChat.type === 'group') {
      return activeChat.avatar || null;
    }
    
    const otherParticipant = activeChat.participants.find((p: User) => p.id !== user?.id);
    return otherParticipant?.avatar || null;
  };

  const getOnlineStatus = (): boolean => {
    if (!activeChat || activeChat.type === 'group') return false;
    
    const otherParticipant = activeChat.participants.find((p: User) => p.id !== user?.id);
    return otherParticipant?.isOnline || false;
  };

  const getTypingUsers = (): string[] => {
    if (!activeChat) return [];
    
    return Object.entries(isTyping)
      .filter(([_, typing]) => typing)
      .map(([userId]) => {
        const user = activeChat.participants.find(p => p.id === userId);
        return user ? user.firstName : 'Пользователь';
      });
  };

  if (!activeChat) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-900 flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <svg
            className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600 mb-4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-lg font-medium mb-2">Выберите чат</h3>
          <p>Выберите чат из списка, чтобы начать общение</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 flex flex-col ${className}`}>
      {/* Заголовок чата */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar
                src={getChatAvatar()}
                alt={getChatName()}
                size="md"
                fallback={getChatName().charAt(0).toUpperCase()}
              />
              {activeChat.type === 'private' && getOnlineStatus() && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
              )}
            </div>
            
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {getChatName()}
              </h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {activeChat.type === 'group' ? (
                  `${activeChat.participants.length} участников`
                ) : getOnlineStatus() ? (
                  <span className="text-green-500">онлайн</span>
                ) : (
                  'не в сети'
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Кнопки действий */}
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Кнопка загрузить еще */}
            {messages.length > 0 && (
              <div className="text-center">
                <button
                  onClick={loadMoreMessages}
                  disabled={loadingMore}
                  className="text-blue-500 hover:text-blue-600 text-sm font-medium disabled:opacity-50"
                >
                  {loadingMore ? 'Загрузка...' : 'Загрузить более старые сообщения'}
                </button>
              </div>
            )}

            {/* Список сообщений */}
            {messages.map((message, index) => {
              const isLastFromUser = 
                index === messages.length - 1 || 
                messages[index + 1]?.senderId !== message.senderId;
              
              const isFirstFromUser = 
                index === 0 || 
                messages[index - 1]?.senderId !== message.senderId;

              return (
                <MessageItem
                  key={message.id}
                  message={message}
                  isOwn={message.senderId === user?.id}
                  showAvatar={isLastFromUser && message.senderId !== user?.id}
                  showTimestamp={isLastFromUser}
                  isFirstFromUser={isFirstFromUser}
                />
              );
            })}

            {/* Индикатор печатания */}
            {getTypingUsers().length > 0 && (
              <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm">
                  {getTypingUsers().join(', ')} печатает...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Поле ввода */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        disabled={!isConnected}
      />
    </div>
  );
};

export default ChatWindow;