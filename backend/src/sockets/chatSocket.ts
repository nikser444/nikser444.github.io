import { Server, Socket } from 'socket.io';
import { Message, Chat, User } from '../models';
import { verifySocketAuth } from '../middleware/auth';
import { logger } from '../utils/logger';
import { MessageService } from '../services';

interface AuthSocket extends Socket {
  userId?: string;
  user?: User;
}

interface MessageData {
  chatId: string;
  content: string;
  type?: 'text' | 'image' | 'file' | 'audio' | 'video';
  replyTo?: string;
  attachments?: Array<{
    type: string;
    url: string;
    name: string;
    size: number;
  }>;
}

interface TypingData {
  chatId: string;
  isTyping: boolean;
}

export class ChatSocketHandler {
  constructor(private io: Server) {
    this.setupChatHandlers();
  }

  private setupChatHandlers() {
    this.io.use(verifySocketAuth);
    
    this.io.on('connection', (socket: AuthSocket) => {
      logger.info(`User ${socket.userId} connected to chat`);

      // Присоединение к комнатам пользователя
      this.joinUserRooms(socket);

      // Обработчики событий чата
      socket.on('message:send', (data: MessageData) => this.handleSendMessage(socket, data));
      socket.on('message:read', (data: { messageId: string }) => this.handleReadMessage(socket, data));
      socket.on('message:edit', (data: { messageId: string; content: string }) => this.handleEditMessage(socket, data));
      socket.on('message:delete', (data: { messageId: string }) => this.handleDeleteMessage(socket, data));
      socket.on('typing:start', (data: TypingData) => this.handleTypingStart(socket, data));
      socket.on('typing:stop', (data: TypingData) => this.handleTypingStop(socket, data));
      socket.on('chat:join', (data: { chatId: string }) => this.handleJoinChat(socket, data));
      socket.on('chat:leave', (data: { chatId: string }) => this.handleLeaveChat(socket, data));

      // Обработчик отключения
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }

  private async joinUserRooms(socket: AuthSocket) {
    try {
      if (!socket.userId) return;

      // Получаем все чаты пользователя
      const userChats = await Chat.findAll({
        include: [{
          model: User,
          where: { id: socket.userId },
          through: { attributes: [] }
        }]
      });

      // Присоединяемся к комнатам чатов
      for (const chat of userChats) {
        socket.join(`chat:${chat.id}`);
        socket.join(`user:${socket.userId}`);
      }

      logger.info(`User ${socket.userId} joined ${userChats.length} chat rooms`);
    } catch (error) {
      logger.error('Error joining user rooms:', error);
    }
  }

  private async handleSendMessage(socket: AuthSocket, data: MessageData) {
    try {
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      // Проверяем доступ к чату
      const chat = await Chat.findOne({
        where: { id: data.chatId },
        include: [{
          model: User,
          where: { id: socket.userId },
          through: { attributes: [] }
        }]
      });

      if (!chat) {
        socket.emit('error', { message: 'Chat not found or access denied' });
        return;
      }

      // Создаем сообщение
      const message = await Message.create({
        chatId: data.chatId,
        senderId: socket.userId,
        content: data.content,
        type: data.type || 'text',
        replyTo: data.replyTo || null,
        attachments: data.attachments || []
      });

      // Получаем полную информацию о сообщении
      const fullMessage = await Message.findByPk(message.id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'avatar', 'status']
          },
          {
            model: Message,
            as: 'replyToMessage',
            include: [{
              model: User,
              as: 'sender',
              attributes: ['id', 'username']
            }]
          }
        ]
      });

      // Обновляем последнее сообщение в чате
      await chat.update({
        lastMessageId: message.id,
        lastMessageAt: new Date()
      });

      // Отправляем сообщение всем участникам чата
      this.io.to(`chat:${data.chatId}`).emit('message:receive', {
        message: fullMessage,
        chatId: data.chatId
      });

      // Отправляем уведомления offline пользователям
      await MessageService.sendNotificationsForMessage(message.id);

      logger.info(`Message sent by user ${socket.userId} to chat ${data.chatId}`);
    } catch (error) {
      logger.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  private async handleReadMessage(socket: AuthSocket, data: { messageId: string }) {
    try {
      if (!socket.userId) return;

      const message = await Message.findByPk(data.messageId);
      if (!message) return;

      // Проверяем доступ к чату
      const chat = await Chat.findOne({
        where: { id: message.chatId },
        include: [{
          model: User,
          where: { id: socket.userId },
          through: { attributes: [] }
        }]
      });

      if (!chat) return;

      // Отмечаем сообщение как прочитанное
      await message.update({
        readBy: [...(message.readBy || []), {
          userId: socket.userId,
          readAt: new Date()
        }]
      });

      // Уведомляем отправителя о прочтении
      this.io.to(`chat:${message.chatId}`).emit('message:read', {
        messageId: data.messageId,
        userId: socket.userId,
        readAt: new Date()
      });

    } catch (error) {
      logger.error('Error marking message as read:', error);
    }
  }

  private async handleEditMessage(socket: AuthSocket, data: { messageId: string; content: string }) {
    try {
      if (!socket.userId) return;

      const message = await Message.findOne({
        where: {
          id: data.messageId,
          senderId: socket.userId
        }
      });

      if (!message) {
        socket.emit('error', { message: 'Message not found or access denied' });
        return;
      }

      // Обновляем сообщение
      await message.update({
        content: data.content,
        editedAt: new Date()
      });

      // Получаем обновленное сообщение
      const updatedMessage = await Message.findByPk(message.id, {
        include: [{
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'avatar']
        }]
      });

      // Отправляем обновление всем участникам чата
      this.io.to(`chat:${message.chatId}`).emit('message:edit', {
        message: updatedMessage
      });

    } catch (error) {
      logger.error('Error editing message:', error);
      socket.emit('error', { message: 'Failed to edit message' });
    }
  }

  private async handleDeleteMessage(socket: AuthSocket, data: { messageId: string }) {
    try {
      if (!socket.userId) return;

      const message = await Message.findOne({
        where: {
          id: data.messageId,
          senderId: socket.userId
        }
      });

      if (!message) {
        socket.emit('error', { message: 'Message not found or access denied' });
        return;
      }

      // Помечаем сообщение как удаленное (мягкое удаление)
      await message.update({
        content: 'Сообщение удалено',
        isDeleted: true,
        deletedAt: new Date()
      });

      // Уведомляем всех участников чата
      this.io.to(`chat:${message.chatId}`).emit('message:delete', {
        messageId: data.messageId,
        chatId: message.chatId
      });

    } catch (error) {
      logger.error('Error deleting message:', error);
      socket.emit('error', { message: 'Failed to delete message' });
    }
  }

  private async handleTypingStart(socket: AuthSocket, data: TypingData) {
    try {
      if (!socket.userId) return;

      // Проверяем доступ к чату
      const chat = await Chat.findOne({
        where: { id: data.chatId },
        include: [{
          model: User,
          where: { id: socket.userId },
          through: { attributes: [] }
        }]
      });

      if (!chat) return;

      // Уведомляем других участников чата о начале набора
      socket.to(`chat:${data.chatId}`).emit('typing:start', {
        userId: socket.userId,
        chatId: data.chatId,
        username: socket.user?.username
      });

    } catch (error) {
      logger.error('Error handling typing start:', error);
    }
  }

  private async handleTypingStop(socket: AuthSocket, data: TypingData) {
    try {
      if (!socket.userId) return;

      // Уведомляем других участников чата о завершении набора
      socket.to(`chat:${data.chatId}`).emit('typing:stop', {
        userId: socket.userId,
        chatId: data.chatId
      });

    } catch (error) {
      logger.error('Error handling typing stop:', error);
    }
  }

  private async handleJoinChat(socket: AuthSocket, data: { chatId: string }) {
    try {
      if (!socket.userId) return;

      // Проверяем доступ к чату
      const chat = await Chat.findOne({
        where: { id: data.chatId },
        include: [{
          model: User,
          where: { id: socket.userId },
          through: { attributes: [] }
        }]
      });

      if (chat) {
        socket.join(`chat:${data.chatId}`);
        logger.info(`User ${socket.userId} joined chat ${data.chatId}`);
      }

    } catch (error) {
      logger.error('Error joining chat:', error);
    }
  }

  private handleLeaveChat(socket: AuthSocket, data: { chatId: string }) {
    socket.leave(`chat:${data.chatId}`);
    logger.info(`User ${socket.userId} left chat ${data.chatId}`);
  }

  private handleDisconnect(socket: AuthSocket) {
    logger.info(`User ${socket.userId} disconnected from chat`);
    
    // Уведомляем о том, что пользователь больше не печатает
    if (socket.userId) {
      this.io.emit('typing:stop', { userId: socket.userId });
    }
  }

  // Публичные методы для использования из других частей приложения
  public sendMessageToChat(chatId: string, event: string, data: any) {
    this.io.to(`chat:${chatId}`).emit(event, data);
  }

  public sendMessageToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }
}