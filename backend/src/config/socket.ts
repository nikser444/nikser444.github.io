import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyAccessToken } from './jwt';
import { redis } from './database';

// Интерфейс для данных пользователя в сокете
export interface SocketUser {
  userId: string;
  email: string;
  username: string;
  avatar?: string;
}

// Расширение интерфейса Socket для добавления пользовательских данных
declare module 'socket.io' {
  interface Socket {
    user?: SocketUser;
  }
}

// Конфигурация Socket.IO
export const socketConfig = {
  // CORS настройки
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
  
  // Настройки подключения
  pingTimeout: 60000, // 60 секунд
  pingInterval: 25000, // 25 секунд
  upgradeTimeout: 10000, // 10 секунд
  maxHttpBufferSize: 1e6, // 1MB
  
  // Настройки транспорта
  transports: ['websocket', 'polling'],
  
  // Настройки адаптера
  adapter: undefined, // будет настроен позже для кластера
};

// Создание Socket.IO сервера
export const createSocketServer = (httpServer: HttpServer): SocketIOServer => {
  const io = new SocketIOServer(httpServer, socketConfig);
  
  // Middleware для аутентификации
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        throw new Error('Токен авторизации не найден');
      }
      
      // Верификация токена
      const payload = verifyAccessToken(token);
      
      // Получение данных пользователя из кеша или БД
      const userKey = `user:${payload.userId}`;
      const userData = await redis.get(userKey);
      
      if (!userData) {
        throw new Error('Пользователь не найден');
      }
      
      const user = JSON.parse(userData);
      socket.user = {
        userId: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
      };
      
      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error('Authentication failed'));
    }
  });
  
  return io;
};

// Функция для получения комнаты пользователя
export const getUserRoom = (userId: string): string => {
  return `user:${userId}`;
};

// Функция для получения комнаты чата
export const getChatRoom = (chatId: string): string => {
  return `chat:${chatId}`;
};

// Функция для получения комнаты звонка
export const getCallRoom = (callId: string): string => {
  return `call:${callId}`;
};

// Функция для получения онлайн пользователей
export const getOnlineUsers = async (): Promise<SocketUser[]> => {
  try {
    const onlineUsersKey = 'online_users';
    const onlineUsersData = await redis.sMembers(onlineUsersKey);
    
    const users = await Promise.all(
      onlineUsersData.map(async (userId) => {
        const userKey = `user:${userId}`;
        const userData = await redis.get(userKey);
        return userData ? JSON.parse(userData) : null;
      })
    );
    
    return users.filter(Boolean);
  } catch (error) {
    console.error('Ошибка получения онлайн пользователей:', error);
    return [];
  }
};

// Функция для добавления пользователя в онлайн
export const setUserOnline = async (userId: string, socketId: string): Promise<void> => {
  try {
    const onlineUsersKey = 'online_users';
    const userSocketKey = `user_socket:${userId}`;
    
    // Добавляем пользователя в список онлайн
    await redis.sadd(onlineUsersKey, userId);
    
    // Сохраняем связь пользователь -> socket
    await redis.set(userSocketKey, socketId, { EX: 3600 }); // TTL 1 час
    
    console.log(`👤 Пользователь ${userId} онлайн (socket: ${socketId})`);
  } catch (error) {
    console.error('Ошибка установки пользователя онлайн:', error);
  }
};

// Функция для удаления пользователя из онлайн
export const setUserOffline = async (userId: string): Promise<void> => {
  try {
    const onlineUsersKey = 'online_users';
    const userSocketKey = `user_socket:${userId}`;
    
    // Удаляем пользователя из списка онлайн
    await redis.srem(onlineUsersKey, userId);
    
    // Удаляем связь пользователь -> socket
    await redis.del(userSocketKey);
    
    console.log(`👤 Пользователь ${userId} оффлайн`);
  } catch (error) {
    console.error('Ошибка установки пользователя оффлайн:', error);
  }
};

// Функция для получения socket ID пользователя
export const getUserSocketId = async (userId: string): Promise<string | null> => {
  try {
    const userSocketKey = `user_socket:${userId}`;
    return await redis.get(userSocketKey);
  } catch (error) {
    console.error('Ошибка получения socket ID пользователя:', error);
    return null;
  }
};

// События Socket.IO
export const SOCKET_EVENTS = {
  // Соединение
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // Сообщения
  MESSAGE_SEND: 'message:send',
  MESSAGE_RECEIVE: 'message:receive',
  MESSAGE_TYPING: 'message:typing',
  MESSAGE_STOP_TYPING: 'message:stop_typing',
  
  // Звонки
  CALL_INITIATE: 'call:initiate',
  CALL_ACCEPT: 'call:accept',
  CALL_DECLINE: 'call:decline',
  CALL_END: 'call:end',
  CALL_CANDIDATE: 'call:candidate',
  CALL_OFFER: 'call:offer',
  CALL_ANSWER: 'call:answer',
  
  // Демонстрация экрана
  SCREEN_SHARE_START: 'screen:share:start',
  SCREEN_SHARE_STOP: 'screen:share:stop',
  
  // Статус пользователя
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  USER_STATUS_CHANGE: 'user:status:change',
  
  // Чаты
  CHAT_JOIN: 'chat:join',
  CHAT_LEAVE: 'chat:leave',
  CHAT_CREATED: 'chat:created',
  
  // Уведомления
  NOTIFICATION: 'notification',
} as const;