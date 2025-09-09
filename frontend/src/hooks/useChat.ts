import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { 
  setChats, 
  addChat, 
  updateChat, 
  deleteChat,
  setActiveChat,
  addMessage,
  updateMessage,
  deleteMessage,
  setMessages,
  setLoading,
  setError,
  setChatTyping,
  clearChatTyping
} from '../store/chatSlice';
import { chatService } from '../services/chatService';
import { useSocket } from './useSocket';
import type { Chat, Message, CreateChatData, MessageType } from '../types/chat';

interface UseChatReturn {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  typingUsers: string[];
  loadChats: () => Promise<void>;
  createChat: (data: CreateChatData) => Promise<Chat | null>;
  updateChatInfo: (chatId: string, data: Partial<Chat>) => Promise<boolean>;
  deleteChat: (chatId: string) => Promise<boolean>;
  setActiveChat: (chat: Chat | null) => void;
  loadMessages: (chatId: string, page?: number) => Promise<void>;
  sendMessage: (content: string, type?: MessageType, file?: File) => Promise<boolean>;
  editMessage: (messageId: string, newContent: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  markAsRead: (chatId: string) => Promise<void>;
  addParticipant: (chatId: string, userId: string) => Promise<boolean>;
  removeParticipant: (chatId: string, userId: string) => Promise<boolean>;
  leaveChat: (chatId: string) => Promise<boolean>;
  searchMessages: (query: string, chatId?: string) => Promise<Message[]>;
  clearError: () => void;
}

export const useChat = (): UseChatReturn => {
  const dispatch = useDispatch();
  const { socket, sendMessage: socketSendMessage, joinChat, leaveChat: socketLeaveChat } = useSocket();
  const { 
    chats, 
    activeChat, 
    messages, 
    isLoading, 
    error,
    typingUsers 
  } = useSelector((state: RootState) => state.chat);
  const { user } = useSelector((state: RootState) => state.auth);

  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Загрузка списка чатов
  const loadChats = useCallback(async (): Promise<void> => {
    try {
      dispatch(setLoading(true));
      const response = await chatService.getChats();
      
      if (response.success) {
        dispatch(setChats(response.chats));
      } else {
        dispatch(setError(response.message || 'Ошибка загрузки чатов'));
      }
    } catch (error: any) {
      dispatch(setError(error.message || 'Произошла ошибка при загрузке чатов'));
    }
  }, [dispatch]);

  // Создание нового чата
  const createChat = useCallback(async (data: CreateChatData): Promise<Chat | null> => {
    try {
      dispatch(setLoading(true));
      const response = await chatService.createChat(data);
      
      if (response.success) {
        const newChat = response.chat;
        dispatch(addChat(newChat));
        
        // Присоединяемся к новому чату через сокет
        if (socket) {
          joinChat(newChat.id);
        }
        
        return newChat;
      } else {
        dispatch(setError(response.message || 'Ошибка создания чата'));
        return null;
      }
    } catch (error: any) {
      dispatch(setError(error.message || 'Произошла ошибка при создании чата'));
      return null;
    }
  }, [dispatch, socket, joinChat]);

  // Обновление информации о чате
  const updateChatInfo = useCallback(async (chatId: string, data: Partial<Chat>): Promise<boolean> => {
    try {
      const response = await chatService.updateChat(chatId, data);
      
      if (response.success) {
        dispatch(updateChat({ chatId, updates: data }));
        return true;
      } else {
        dispatch(setError(response.message || 'Ошибка обновления чата'));
        return false;
      }
    } catch (error: any) {
      dispatch(setError(error.message || 'Произошла ошибка при обновлении чата'));
      return false;
    }
  }, [dispatch]);

  // Удаление чата
  const deleteChatHandler = useCallback(async (chatId: string): Promise<boolean> => {
    try {
      const response = await chatService.deleteChat(chatId);
      
      if (response.success) {
        dispatch(deleteChat(chatId));
        
        // Покидаем чат через сокет
        if (socket) {
          socketLeaveChat(chatId);
        }
        
        // Если удаляемый чат был активным, сбрасываем активный чат
        if (activeChat?.id === chatId) {
          dispatch(setActiveChat(null));
        }
        
        return true;
      } else {
        dispatch(setError(response.message || 'Ошибка удаления чата'));
        return false;
      }
    } catch (error: any) {
      dispatch(setError(error.message || 'Произошла ошибка при удалении чата'));
      return false;
    }
  }, [dispatch, socket, socketLeaveChat, activeChat]);

  // Установка активного чата
  const setActiveChatHandler = useCallback((chat: Chat | null) => {
    // Покидаем предыдущий чат
    if (activeChat && socket) {
      socketLeaveChat(activeChat.id);
    }
    
    // Присоединяемся к новому чату
    if (chat && socket) {
      joinChat(chat.id);
    }
    
    dispatch(setActiveChat(chat));
    
    // Загружаем сообщения для нового чата
    if (chat) {
      loadMessages(chat.id);
    }
  }, [dispatch, socket, joinChat, socketLeaveChat, activeChat]);

  // Загрузка сообщений чата
  const loadMessages = useCallback(async (chatId: string, page: number = 1): Promise<void> => {
    try {
      dispatch(setLoading(true));
      const response = await chatService.getMessages(chatId, page);
      
      if (response.success) {
        if (page === 1) {
          dispatch(setMessages(response.messages));
        } else {
          // Добавляем старые сообщения в начало списка
          dispatch(setMessages([...response.messages, ...messages]));
        }
      } else {
        dispatch(setError(response.message || 'Ошибка загрузки сообщений'));
      }
    } catch (error: any) {
      dispatch(setError(error.message || 'Произошла ошибка при загрузке сообщений'));
    }
  }, [dispatch, messages]);

  // Отправка сообщения
  const sendMessage = useCallback(async (content: string, type: MessageType = 'text', file?: File): Promise<boolean> => {
    if (!activeChat || !content.trim()) {
      return false;
    }

    try {
      let messageData: any = {
        chatId: activeChat.id,
        content: content.trim(),
        type
      };

      // Если есть файл, сначала загружаем его
      if (file && type !== 'text') {
        const uploadResponse = await chatService.uploadFile(file);
        if (!uploadResponse.success) {
          dispatch(setError('Ошибка загрузки файла'));
          return false;
        }
        messageData.fileUrl = uploadResponse.fileUrl;
        messageData.fileName = file.name;
        messageData.fileSize = file.size;
      }

      // Отправляем через WebSocket для мгновенной доставки
      if (socket) {
        socketSendMessage(activeChat.id, content, type);
      }

      // Также отправляем через API для надежности
      const response = await chatService.sendMessage(messageData);
      
      if (response.success) {
        // Сообщение уже должно быть добавлено через WebSocket
        return true;
      } else {
        dispatch(setError(response.message || 'Ошибка отправки сообщения'));
        return false;
      }
    } catch (error: any) {
      dispatch(setError(error.message || 'Произошла ошибка при отправке сообщения'));
      return false;
    }
  }, [activeChat, dispatch, socket, socketSendMessage]);

  // Редактирование сообщения
  const editMessage = useCallback(async (messageId: string, newContent: string): Promise<boolean> => {
    try {
      const response = await chatService.editMessage(messageId, newContent);
      
      if (response.success) {
        dispatch(updateMessage({
          messageId,
          updates: {
            content: newContent,
            edited: true,
            editedAt: new Date().toISOString()
          }
        }));
        return true;
      } else {
        dispatch(setError(response.message || 'Ошибка редактирования сообщения'));
        return false;
      }
    } catch (error: any) {
      dispatch(setError(error.message || 'Произошла ошибка при редактировании сообщения'));
      return false;
    }
  }, [dispatch]);

  // Удаление сообщения
  const deleteMessageHandler = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const response = await chatService.deleteMessage(messageId);
      
      if (response.success) {
        dispatch(deleteMessage(messageId));
        return true;
      } else {
        dispatch(setError(response.message || 'Ошибка удаления сообщения'));
        return false;
      }
    } catch (error: any) {
      dispatch(setError(error.message || 'Произошла ошибка при удалении сообщения'));
      return false;
    }
  }, [dispatch]);

  // Отметка сообщений как прочитанные
  const markAsRead = useCallback(async (chatId: string): Promise<void> => {
    try {
      await chatService.markAsRead(chatId);
      
      // Обновляем количество непрочитанных сообщений в чате
      dispatch(updateChat({
        chatId,
        updates: { unreadCount: 0 }
      }));
    } catch (error: any) {
      console.error('Ошибка отметки сообщений как прочитанные:', error);
    }
  }, [dispatch]);

  // Добавление участника
  const addParticipant = useCallback(async (chatId: string, userId: string): Promise<boolean> => {
    try {
      const response = await chatService.addParticipant(chatId, userId);
      
      if (response.success) {
        // Обновляем список участников чата
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
          dispatch(updateChat({
            chatId,
            updates: {
              participants: [...chat.participants, response.participant]
            }
          }));
        }
        return true;
      } else {
        dispatch(setError(response.message || 'Ошибка добавления участника'));
        return false;
      }
    } catch (error: any) {
      dispatch(setError(error.message || 'Произошла ошибка при добавлении участника'));
      return false;
    }
  }, [dispatch, chats]);

  // Удаление участника
  const removeParticipant = useCallback(async (chatId: string, userId: string): Promise<boolean> => {
    try {
      const response = await chatService.removeParticipant(chatId, userId);
      
      if (response.success) {
        // Обновляем список участников чата
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
          dispatch(updateChat({
            chatId,
            updates: {
              participants: chat.participants.filter(p => p.id !== userId)
            }
          }));
        }
        return true;
      } else {
        dispatch(setError(response.message || 'Ошибка удаления участника'));
        return false;
      }
    } catch (error: any) {
      dispatch(setError(error.message || 'Произошла ошибка при удалении участника'));
      return false;
    }
  }, [dispatch, chats]);

  // Покидание чата
  const leaveChat = useCallback(async (chatId: string): Promise<boolean> => {
    try {
      const response = await chatService.leaveChat(chatId);
      
      if (response.success) {
        dispatch(deleteChat(chatId));
        
        // Покидаем чат через сокет
        if (socket) {
          socketLeaveChat(chatId);
        }
        
        // Если покидаемый чат был активным, сбрасываем активный чат
        if (activeChat?.id === chatId) {
          dispatch(setActiveChat(null));
        }
        
        return true;
      } else {
        dispatch(setError(response.message || 'Ошибка выхода из чата'));
        return false;
      }
    } catch (error: any) {
      dispatch(setError(error.message || 'Произошла ошибка при выходе из чата'));
      return false;
    }
  }, [dispatch, socket, socketLeaveChat, activeChat]);

  // Поиск сообщений
  const searchMessages = useCallback(async (query: string, chatId?: string): Promise<Message[]> => {
    try {
      const response = await chatService.searchMessages(query, chatId);
      
      if (response.success) {
        return response.messages;
      } else {
        dispatch(setError(response.message || 'Ошибка поиска сообщений'));
        return [];
      }
    } catch (error: any) {
      dispatch(setError(error.message || 'Произошла ошибка при поиске сообщений'));
      return [];
    }
  }, [dispatch]);

  // Очистка ошибки
  const clearError = useCallback(() => {
    dispatch(setError(null));
  }, [dispatch]);

  // Обработка печатания
  const handleTyping = useCallback((content: string) => {
    if (!activeChat || !socket) return;

    const isCurrentlyTyping = content.length > 0;
    
    if (isCurrentlyTyping && !isTyping) {
      setIsTyping(true);
      socket.emit('typing:start', { chatId: activeChat.id });
    }

    // Очищаем предыдущий таймаут
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Устанавливаем новый таймаут для остановки печатания
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        socket.emit('typing:stop', { chatId: activeChat.id });
      }
    }, 3000);

  }, [activeChat, socket, isTyping]);

  // WebSocket обработчики для печатания
  useEffect(() => {
    if (!socket) return;

    socket.on('typing:start', (data: { chatId: string, userId: string, username: string }) => {
      if (data.chatId === activeChat?.id && data.userId !== user?.id) {
        dispatch(setChatTyping({ userId: data.userId, username: data.username }));
      }
    });

    socket.on('typing:stop', (data: { chatId: string, userId: string }) => {
      if (data.chatId === activeChat?.id) {
        dispatch(clearChatTyping(data.userId));
      }
    });

    return () => {
      socket.off('typing:start');
      socket.off('typing:stop');
    };
  }, [socket, activeChat, user, dispatch]);

  // Загрузка чатов при монтировании
  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user, loadChats]);

  // Отметка сообщений как прочитанные при смене активного чата
  useEffect(() => {
    if (activeChat) {
      markAsRead(activeChat.id);
    }
  }, [activeChat, markAsRead]);

  // Очистка таймаута при размонтировании
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    chats,
    activeChat,
    messages,
    isLoading,
    error,
    typingUsers,
    loadChats,
    createChat,
    updateChatInfo,
    deleteChat: deleteChatHandler,
    setActiveChat: setActiveChatHandler,
    loadMessages,
    sendMessage,
    editMessage,
    deleteMessage: deleteMessageHandler,
    markAsRead,
    addParticipant,
    removeParticipant,
    leaveChat,
    searchMessages,
    clearError
  };
};