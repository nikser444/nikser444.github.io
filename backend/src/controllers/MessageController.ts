import { Request, Response } from 'express';
import { Message } from '../models/Message';
import { Chat } from '../models/Chat';
import { User } from '../models/User';
import { NotificationService } from '../services/NotificationService';
import path from 'path';
import fs from 'fs';

export class MessageController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  public sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { chatId, content, type = 'text', replyTo } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      // Валидация обязательных полей
      if (!chatId) {
        res.status(400).json({
          success: false,
          message: 'ID чата обязателен'
        });
        return;
      }

      if (!content && !req.file) {
        res.status(400).json({
          success: false,
          message: 'Содержимое сообщения или файл обязательны'
        });
        return;
      }

      // Проверяем, что чат существует и пользователь является участником
      const chat = await Chat.findById(chatId);
      if (!chat) {
        res.status(404).json({
          success: false,
          message: 'Чат не найден'
        });
        return;
      }

      const isParticipant = await Chat.isUserParticipant(chatId, userId);
      if (!isParticipant) {
        res.status(403).json({
          success: false,
          message: 'Вы не являетесь участником этого чата'
        });
        return;
      }

      // Если это ответ на сообщение, проверяем что оно существует
      if (replyTo) {
        const replyMessage = await Message.findById(replyTo);
        if (!replyMessage || replyMessage.chatId !== chatId) {
          res.status(404).json({
            success: false,
            message: 'Сообщение для ответа не найдено'
          });
          return;
        }
      }

      let messageData: any = {
        chatId,
        senderId: userId,
        content: content || '',
        type,
        replyTo: replyTo || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
}

      // Обработка файлов
      if (req.file) {
        const filePath = `/uploads/files/${req.file.filename}`;
        messageData.attachments = [{
          fileName: req.file.originalname,
          filePath: filePath,
          fileSize: req.file.size,
          mimeType: req.file.mimetype
        }];

        // Определяем тип сообщения на основе файла
        if (req.file.mimetype.startsWith('image/')) {
          messageData.type = 'image';
        } else if (req.file.mimetype.startsWith('video/')) {
          messageData.type = 'video';
        } else if (req.file.mimetype.startsWith('audio/')) {
          messageData.type = 'audio';
        } else {
          messageData.type = 'file';
        }
      }

      // Создаем сообщение
      const message = await Message.create(messageData);

      // Получаем полную информацию о сообщении с отправителем
      const fullMessage = await Message.findWithSender(message.id);

      // Обновляем время последнего сообщения в чате
      await Chat.updateLastMessageTime(chatId);

      // Отправляем уведомления участникам (кроме отправителя)
      await this.notificationService.notifyNewMessage(chatId, userId, fullMessage);

      res.status(201).json({
        success: true,
        message: 'Сообщение отправлено',
        data: { message: fullMessage }
      });

    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      
      // Удаляем файл в случае ошибки
      if (req.file) {
        const filePath = path.join(process.cwd(), 'uploads', 'files', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public getChatMessages = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { chatId } = req.params;
      const { page = 1, limit = 50, before } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      // Проверяем доступ к чату
      const isParticipant = await Chat.isUserParticipant(chatId, userId);
      if (!isParticipant) {
        res.status(403).json({
          success: false,
          message: 'Доступ к чату запрещен'
        });
        return;
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      let messages;
      let total;

      if (before) {
        // Получение сообщений до определенного времени (для пагинации)
        const beforeDate = new Date(before as string);
        messages = await Message.findChatMessagesBefore(chatId, beforeDate, limitNum);
        total = await Message.countChatMessagesBefore(chatId, beforeDate);
      } else {
        // Обычная пагинация
        messages = await Message.findChatMessages(chatId, limitNum, offset);
        total = await Message.countChatMessages(chatId);
      }

      // Отмечаем сообщения как прочитанные
      await Message.markAsRead(chatId, userId);

      res.status(200).json({
        success: true,
        data: {
          messages: messages.reverse(), // Возвращаем в хронологическом порядке
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
            hasMore: offset + messages.length < total
          }
        }
      });

    } catch (error) {
      console.error('Ошибка получения сообщений:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public editMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { messageId } = req.params;
      const { content } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      if (!content || content.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Содержимое сообщения не может быть пустым'
        });
        return;
      }

      // Находим сообщение
      const message = await Message.findById(messageId);
      if (!message) {
        res.status(404).json({
          success: false,
          message: 'Сообщение не найдено'
        });
        return;
      }

      // Проверяем права на редактирование
      if (message.senderId !== userId) {
        res.status(403).json({
          success: false,
          message: 'Вы можете редактировать только свои сообщения'
        });
        return;
      }

      // Проверяем, что сообщение можно редактировать (не старше 24 часов)
      const hoursDiff = Math.abs(new Date().getTime() - message.createdAt.getTime()) / 36e5;
      if (hoursDiff > 24) {
        res.status(400).json({
          success: false,
          message: 'Сообщение можно редактировать только в течение 24 часов'
        });
        return;
      }

      // Можно редактировать только текстовые сообщения
      if (message.type !== 'text') {
        res.status(400).json({
          success: false,
          message: 'Можно редактировать только текстовые сообщения'
        });
        return;
      }

      // Обновляем сообщение
      const updatedMessage = await Message.updateContent(messageId, content);

      // Уведомляем участников об изменении
      await this.notificationService.notifyMessageEdited(message.chatId, userId, updatedMessage);

      res.status(200).json({
        success: true,
        message: 'Сообщение обновлено',
        data: { message: updatedMessage }
      });

    } catch (error) {
      console.error('Ошибка редактирования сообщения:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public deleteMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { messageId } = req.params;
      const { deleteForAll = false } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      // Находим сообщение
      const message = await Message.findById(messageId);
      if (!message) {
        res.status(404).json({
          success: false,
          message: 'Сообщение не найдено'
        });
        return;
      }

      // Проверяем права на удаление
      const canDelete = message.senderId === userId;
      const chat = await Chat.findById(message.chatId);
      const isAdmin = chat && (chat.createdBy === userId || await Chat.isUserAdmin(message.chatId, userId));

      if (!canDelete && !isAdmin) {
        res.status(403).json({
          success: false,
          message: 'Недостаточно прав для удаления сообщения'
        });
        return;
      }

      // Для удаления для всех нужно быть отправителем или админом
      if (deleteForAll && !canDelete && !isAdmin) {
        res.status(403).json({
          success: false,
          message: 'Недостаточно прав для удаления сообщения для всех'
        });
        return;
      }

      // Удаляем файлы, если они есть
      if (message.attachments && message.attachments.length > 0) {
        for (const attachment of message.attachments) {
          const filePath = path.join(process.cwd(), attachment.filePath.replace('/uploads/', 'uploads/'));
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }

      if (deleteForAll) {
        // Полное удаление сообщения
        await Message.deleteMessage(messageId);
        await this.notificationService.notifyMessageDeleted(message.chatId, userId, messageId);
        
        res.status(200).json({
          success: true,
          message: 'Сообщение удалено для всех'
        });
      } else {
        // Удаление только для текущего пользователя
        await Message.deleteForUser(messageId, userId);
        
        res.status(200).json({
          success: true,
          message: 'Сообщение удалено для вас'
        });
      }

    } catch (error) {
      console.error('Ошибка удаления сообщения:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });