import { io, Socket } from 'socket.io-client';
import { Message, Chat, User } from '../types';
import { logger } from './logger';

interface ServerToClientEvents {
  'message:receive': (message: Message) => void;
  'message:sent': (message: Message) => void;
  'message:updated': (message: Message) => void;
  'message:deleted': (messageId: string) => void;
  'chat:created': (chat: Chat) => void;
  'chat:updated': (chat: Chat) => void;
  'user:online': (userId: string) => void;
  'user:offline': (userId: string) => void;
  'user:typing': (data: { userId: string; chatId: string; isTyping: boolean }) => void;
  'call:incoming': (data: { callId: string; caller: User; type: 'audio' | 'video' }) => void;
  'call:accepted': (data: { callId: string; peerId: string }) => void;
  'call:declined': (data: { callId: string }) => void;
  'call:ended': (data: { callId: string; reason?: string }) => void;
  'friend:request:received': (data: { requestId: string; sender: User }) => void;
  'friend:request:accepted': (data: { requestId: string; friend: User }) => void;
  'friend:request:declined': (data: { requestId: string }) => void;
  'notification:new': (notification: any) => void;
  'error': (error: { message: string; code?: string }) => void;
  'connect': () => void;
  'disconnect': (reason: string) => void;
  'reconnect': (attemptNumber: number) => void;
  'reconnect_error': (error: Error) => void;
  'connect_error': (error: Error) => void;
}

interface ClientToServerEvents {
  'message:send': (data: { chatId: string; content: string; type?: string; fileUrl?: string }) => void;
  'message:update': (data: { messageId: string; content: string }) => void;
  'message:delete': (messageId: string) => void;
  'chat:join': (chatId: string) => void;
  'chat:leave': (chatId: string) => void;
  'user:typing:start': (chatId: string) => void;
  'user:typing:stop': (chatId: string) => void;
  'call:initiate': (data: { targetUserId: string; type: 'audio' | 'video' }) => void;
  'call:accept': (data: { callId: string; peerId: string }) => void;
  'call:decline': (callId: string) => void;
  'call:end': (callId: string) => void;
  'webrtc:offer': (data: { callId: string; offer: RTCSessionDescriptionInit }) => void;
  'webrtc:answer': (data: { callId: string; answer: RTCSessionDescriptionInit }) => void;
  'webrtc:ice-candidate': (data: { callId: string; candidate: RTCIceCandidate }) => void;
  'screen:share:start': (callId: string) => void;
  'screen:share:stop': (callId: string) => void;
}

class SocketManager {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private eventHandlers = new Map<string, Function[]>();

  constructor() {
    this.setupEventHandlers();
  }

  connect(token: string): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      if (this.isConnecting) {
        return;
      }

      this.isConnecting = true;

      const serverUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:3001';

      this.socket = io(serverUrl, {
        auth: {
          token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      this.socket.on('connect', () => {
        logger.info('Socket connected successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.setupDefaultListeners();
        resolve(this.socket!);
      });

      this.socket.on('connect_error', (error) => {
        logger.error('Socket connection error:', error);
        this.isConnecting = false;
        this.reconnectAttempts++;
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        logger.warn('Socket disconnected:', reason);
        this.handleDisconnection(reason);
      });

      this.socket.on('reconnect', (attemptNumber) => {
        logger.info('Socket reconnected after', attemptNumber, 'attempts');
        this.reconnectAttempts = 0;
      });

      this.socket.on('reconnect_error', (error) => {
        logger.error('Socket reconnection error:', error);
        this.reconnectAttempts++;
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventHandlers.clear();
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Event emitters
  sendMessage(chatId: string, content: string, type?: string, fileUrl?: string): void {
    if (!this.socket?.connected) {
      logger.error('Socket not connected');
      return;
    }

    this.socket.emit('message:send', {
      chatId,
      content,
      type,
      fileUrl
    });
  }

  updateMessage(messageId: string, content: string): void {
    if (!this.socket?.connected) {
      logger.error('Socket not connected');
      return;
    }

    this.socket.emit('message:update', { messageId, content });
  }

  deleteMessage(messageId: string): void {
    if (!this.socket?.connected) {
      logger.error('Socket not connected');
      return;
    }

    this.socket.emit('message:delete', messageId);
  }

  joinChat(chatId: string): void {
    if (!this.socket?.connected) {
      logger.error('Socket not connected');
      return;
    }

    this.socket.emit('chat:join', chatId);
  }

  leaveChat(chatId: string): void {
    if (!this.socket?.connected) {
      logger.error('Socket not connected');
      return;
    }

    this.socket.emit('chat:leave', chatId);
  }

  startTyping(chatId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('user:typing:start', chatId);
  }

  stopTyping(chatId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('user:typing:stop', chatId);
  }

  initiateCall(targetUserId: string, type: 'audio' | 'video'): void {
    if (!this.socket?.connected) {
      logger.error('Socket not connected');
      return;
    }

    this.socket.emit('call:initiate', { targetUserId, type });
  }

  acceptCall(callId: string, peerId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('call:accept', { callId, peerId });
  }

  declineCall(callId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('call:decline', callId);
  }

  endCall(callId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('call:end', callId);
  }

  sendWebRTCOffer(callId: string, offer: RTCSessionDescriptionInit): void {
    if (!this.socket?.connected) return;
    this.socket.emit('webrtc:offer', { callId, offer });
  }

  sendWebRTCAnswer(callId: string, answer: RTCSessionDescriptionInit): void {
    if (!this.socket?.connected) return;
    this.socket.emit('webrtc:answer', { callId, answer });
  }

  sendICECandidate(callId: string, candidate: RTCIceCandidate): void {
    if (!this.socket?.connected) return;
    this.socket.emit('webrtc:ice-candidate', { callId, candidate });
  }

  startScreenShare(callId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('screen:share:start', callId);
  }

  stopScreenShare(callId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('screen:share:stop', callId);
  }

  // Event listeners
  on<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    
    this.eventHandlers.get(event)?.push(handler);

    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  off<K extends keyof ServerToClientEvents>(
    event: K,
    handler?: ServerToClientEvents[K]
  ): void {
    if (handler) {
      const handlers = this.eventHandlers.get(event) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    } else {
      this.eventHandlers.delete(event);
    }

    if (this.socket) {
      if (handler) {
        this.socket.off(event, handler);
      } else {
        this.socket.off(event);
      }
    }
  }

  private setupEventHandlers(): void {
    // Настройка базовых обработчиков событий
  }

  private setupDefaultListeners(): void {
    if (!this.socket) return;

    // Восстановление слушателей после переподключения
    for (const [event, handlers] of this.eventHandlers.entries()) {
      handlers.forEach(handler => {
        this.socket?.on(event as any, handler as any);
      });
    }
  }

  private handleDisconnection(reason: string): void {
    logger.warn('Handling disconnection:', reason);
    
    if (reason === 'io server disconnect') {
      // Сервер принудительно отключил соединение
      // Возможно, истек токен авторизации
      this.disconnect();
    }
  }

  getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket;
  }
}

// Singleton instance
export const socketManager = new SocketManager();

// Helper functions
export const connectSocket = (token: string): Promise<Socket> => {
  return socketManager.connect(token);
};

export const disconnectSocket = (): void => {
  socketManager.disconnect();
};

export const isSocketConnected = (): boolean => {
  return socketManager.isConnected();
};

export const getSocket = (): Socket<ServerToClientEvents, ClientToServerEvents> | null => {
  return socketManager.getSocket();
};

export default socketManager;