import { useEffect, useRef, useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import { RootState } from '../store';
import { addMessage, updateChatLastMessage } from '../store/chatSlice';
import { setUserOnlineStatus } from '../store/userSlice';
import { addNotification } from '../store/notificationSlice';
import type { Message, Chat } from '../types/chat';
import type { User } from '../types/user';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (chatId: string, content: string, type?: 'text' | 'image' | 'file') => void;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  typingStart: (chatId: string) => void;
  typingStop: (chatId: string) => void;
  updateOnlineStatus: (status: 'online' | 'away' | 'busy' | 'offline') => void;
}

export const useSocket = (): UseSocketReturn => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Инициализация сокета
  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    // Создаем подключение к сокету
    const socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3001', {
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    // Обработчики подключения
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Подключение к серверу установлено');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Подключение к серверу разорвано');
    });

    socket.on('connect_error', (error) => {
      console.error('Ошибка подключения:', error);
      setIsConnected(false);
    });

    // Обработчики сообщений
    socket.on('message:receive', (message: Message) => {
      dispatch(addMessage(message));
      dispatch(updateChatLastMessage({
        chatId: message.chatId,
        lastMessage: message,
        lastActivity: new Date().toISOString()
      }));

      // Показываем уведомление если чат не активен
      dispatch(addNotification({
        id: Date.now().toString(),
        type: 'message',
        title: 'Новое сообщение',
        message: `${message.sender.username}: ${message.content}`,
        timestamp: new Date().toISOString(),
        read: false,
        chatId: message.chatId
      }));
    });

    // Обработчики статуса пользователей
    socket.on('user:online', (userData: { userId: string, status: string }) => {
      dispatch(setUserOnlineStatus({
        userId: userData.userId,
        status: userData.status
      }));
    });

    socket.on('user:offline', (userData: { userId: string }) => {
      dispatch(setUserOnlineStatus({
        userId: userData.userId,
        status: 'offline'
      }));
    });

    // Обработчики печатания
    socket.on('typing:start', (data: { chatId: string, userId: string, username: string }) => {
      // Можно добавить в состояние информацию о печатании
      console.log(`${data.username} печатает в чате ${data.chatId}`);
    });

    socket.on('typing:stop', (data: { chatId: string, userId: string }) => {
      // Убираем информацию о печатании
      console.log(`Пользователь ${data.userId} перестал печатать в чате ${data.chatId}`);
    });

    // Обработчики звонков
    socket.on('call:incoming', (callData: any) => {
      dispatch(addNotification({
        id: Date.now().toString(),
        type: 'call',
        title: 'Входящий звонок',
        message: `${callData.caller.username} звонит вам`,
        timestamp: new Date().toISOString(),
        read: false,
        callId: callData.callId
      }));
    });

    // Cleanup при размонтировании
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, user, dispatch]);

  // Отправка сообщения
  const sendMessage = useCallback((chatId: string, content: string, type: 'text' | 'image' | 'file' = 'text') => {
    if (!socketRef.current || !isConnected) {
      console.error('Сокет не подключен');
      return;
    }

    const messageData = {
      chatId,
      content,
      type,
      timestamp: new Date().toISOString()
    };

    socketRef.current.emit('message:send', messageData);
  }, [isConnected]);

  // Присоединение к чату
  const joinChat = useCallback((chatId: string) => {
    if (!socketRef.current || !isConnected) {
      return;
    }

    socketRef.current.emit('chat:join', { chatId });
  }, [isConnected]);

  // Покидание чата
  const leaveChat = useCallback((chatId: string) => {
    if (!socketRef.current || !isConnected) {
      return;
    }

    socketRef.current.emit('chat:leave', { chatId });
  }, [isConnected]);

  // Начало печатания
  const typingStart = useCallback((chatId: string) => {
    if (!socketRef.current || !isConnected) {
      return;
    }

    socketRef.current.emit('typing:start', { chatId });
  }, [isConnected]);

  // Окончание печатания
  const typingStop = useCallback((chatId: string) => {
    if (!socketRef.current || !isConnected) {
      return;
    }

    socketRef.current.emit('typing:stop', { chatId });
  }, [isConnected]);

  // Обновление статуса онлайн
  const updateOnlineStatus = useCallback((status: 'online' | 'away' | 'busy' | 'offline') => {
    if (!socketRef.current || !isConnected) {
      return;
    }

    socketRef.current.emit('user:status:update', { status });
  }, [isConnected]);

  return {
    socket: socketRef.current,
    isConnected,
    sendMessage,
    joinChat,
    leaveChat,
    typingStart,
    typingStop,
    updateOnlineStatus
  };
};