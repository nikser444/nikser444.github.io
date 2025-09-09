import { Request, Response } from 'express';
import { Chat } from '../models/Chat';
import { User } from '../models/User';
import { Message } from '../models/Message';
import { ChatService } from '../services/ChatService';
import { NotificationService } from '../services/NotificationService';

export class ChatController {
  private chatService: ChatService;
  private notificationService: NotificationService;

  constructor() {
    this.chatService = new ChatService();
    this.notificationService = new NotificationService();
  }

  public createChat = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { participantIds, name, type = 'private', description } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      // Валидация данных
      if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Список участников обязателен'
        });
        return;
      }

      // Для групповых чатов требуется название
      if (type === 'group' && !name) {
        res.status(400).json({
          success: false,
          message: 'Название группового чата обязательно'
        });
        return;
      }

      // Проверяем, что все участники существуют
      const participants = await User.findByIds([userId, ...participantIds]);
      if (participants.length !== participantIds.length + 1) {
        res.status(404).json({
          success: false,
          message: 'Один или несколько участников не найдены'
        });
        return;
      }

      // Для приватного чата проверяем, что участников только двое
      if (type === 'private' && participantIds.length !== 1) {
        res.status(400).json({
          success: false,
          message: 'Приватный чат может содержать только двух участников'
        });
        return;
      }

      // Проверяем, существует ли уже приватный чат между этими пользователями
      if (type === 'private') {
        const existingChat = await Chat.findPrivateChat(userId, participantIds[0]);
        if (existingChat) {
          res.status(200).json({
            success: true,
            data: { chat: existingChat }
          });
          return;
        }
      }

      // Создаем чат
      const chat = await this.chatService.createChat({
        name,
        type,
        description,
        createdBy: userId,
        participantIds: [userId, ...participantIds]
      });

      res.status(201).json({
        success: true,
        message: 'Чат успешно создан',
        data: { chat }
      });

    } catch (error) {
      console.error('Ошибка создания чата:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public getUserChats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 20 } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      const chats = await Chat.findUserChats(userId, limitNum, offset);
      const total = await Chat.countUserChats(userId);

      // Получаем последние сообщения и информацию о непрочитанных
      const chatsWithDetails = await Promise.all(
        chats.map(async (chat) => {
          const lastMessage = await Message.findLastMessage(chat.id);
          const unreadCount = await Message.countUnreadMessages(chat.id, userId);
          const participants = await Chat.getChatParticipants(chat.id);

          return {
            ...chat,
            lastMessage,
            unreadCount,
            participants: participants.map(p => ({
              id: p.id,
              username: p.username,
              fullName: p.fullName,
              avatar: p.avatar,
              isOnline: p.isOnline,
              lastSeen: p.lastSeen
            }))
          };
        })
      );

      res.status(200).json({
        success: true,
        data: {
          chats: chatsWithDetails,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
          }
        }
      });

    } catch (error) {
      console.error('Ошибка получения чатов:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public getChatById = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { chatId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      // Проверяем, является ли пользователь участником чата
      const isParticipant = await Chat.isUserParticipant(chatId, userId);
      if (!isParticipant) {
        res.status(403).json({
          success: false,
          message: 'Доступ к чату запрещен'
        });
        return;
      }

      const chat = await Chat.findById(chatId);
      if (!chat) {
        res.status(404).json({
          success: false,
          message: 'Чат не найден'
        });
        return;
      }

      // Получаем участников чата
      const participants = await Chat.getChatParticipants(chatId);
      const lastMessage = await Message.findLastMessage(chatId);

      res.status(200).json({
        success: true,
        data: {
          chat: {
            ...chat,
            participants: participants.map(p => ({
              id: p.id,
              username: p.username,
              fullName: p.fullName,
              avatar: p.avatar,
              isOnline: p.isOnline,
              lastSeen: p.lastSeen,
              status: p.status
            })),
            lastMessage
          }
        }
      });

    } catch (error) {
      console.error('Ошибка получения чата:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public updateChat = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { chatId } = req.params;
      const { name, description, avatar } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      // Проверяем права на редактирование
      const chat = await Chat.findById(chatId);
      if (!chat) {
        res.status(404).json({
          success: false,
          message: 'Чат не найден'
        });
        return;
      }

      // Только создатель или администратор может редактировать групповой чат
      if (chat.type === 'group' && chat.createdBy !== userId) {
        const isAdmin = await Chat.isUserAdmin(chatId, userId);
        if (!isAdmin) {
          res.status(403).json({
            success: false,
            message: 'Недостаточно прав для редактирования чата'
          });
          return;
        }
      }

      // Приватные чаты нельзя редактировать
      if (chat.type === 'private') {
        res.status(400).json({
          success: false,
          message: 'Приватный чат нельзя редактировать'
        });
        return;
      }

      const updatedChat = await Chat.updateChat(chatId, {
        name,
        description,
        avatar,
        updatedAt: new Date()
      });

      // Уведомляем участников об изменении
      await this.notificationService.notifyChatUpdated(chatId, userId, updatedChat);

      res.status(200).json({
        success: true,
        message: 'Чат успешно обновлен',
        data: { chat: updatedChat }
      });

    } catch (error) {
      console.error('Ошибка обновления чата:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public addParticipant = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { chatId } = req.params;
      const { participantId } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      if (!participantId) {
        res.status(400).json({
          success: false,
          message: 'ID участника обязателен'
        });
        return;
      }

      const chat = await Chat.findById(chatId);
      if (!chat) {
        res.status(404).json({
          success: false,
          message: 'Чат не найден'
        });
        return;
      }

      // Только групповые чаты можно расширять
      if (chat.type !== 'group') {
        res.status(400).json({
          success: false,
          message: 'Участников можно добавлять только в групповые чаты'
        });
        return;
      }

      // Проверяем права на добавление участников
      const isAdmin = await Chat.isUserAdmin(chatId, userId);
      if (!isAdmin && chat.createdBy !== userId) {
        res.status(403).json({
          success: false,
          message: 'Недостаточно прав для добавления участников'
        });
        return;
      }

      // Проверяем, что пользователь существует
      const newParticipant = await User.findById(participantId);
      if (!newParticipant) {
        res.status(404).json({
          success: false,
          message: 'Пользователь не найден'
        });
        return;
      }

      // Проверяем, не является ли пользователь уже участником
      const isAlreadyParticipant = await Chat.isUserParticipant(chatId, participantId);
      if (isAlreadyParticipant) {
        res.status(400).json({
          success: false,
          message: 'Пользователь уже является участником чата'
        });
        return;
      }

      await Chat.addParticipant(chatId, participantId);

      // Уведомляем о добавлении нового участника
      await this.notificationService.notifyParticipantAdded(chatId, userId, participantId);

      res.status(200).json({
        success: true,
        message: 'Участник успешно добавлен в чат'
      });

    } catch (error) {
      console.error('Ошибка добавления участника:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public removeParticipant = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { chatId } = req.params;
      const { participantId } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      if (!participantId) {
        res.status(400).json({
          success: false,
          message: 'ID участника обязателен'
        });
        return;
      }

      const chat = await Chat.findById(chatId);
      if (!chat) {
        res.status(404).json({
          success: false,
          message: 'Чат не найден'
        });
        return;
      }

      // Только групповые чаты
      if (chat.type !== 'group') {
        res.status(400).json({
          success: false,
          message: 'Участников можно удалять только из групповых чатов'
        });
        return;
      }

      // Проверяем права (администратор, создатель или сам пользователь)
      const isAdmin = await Chat.isUserAdmin(chatId, userId);
      const canRemove = isAdmin || chat.createdBy === userId || participantId === userId;
      
      if (!canRemove) {
        res.status(403).json({
          success: false,
          message: 'Недостаточно прав для удаления участника'
        });
        return;
      }

      // Нельзя удалить создателя чата
      if (participantId === chat.createdBy && userId !== chat.createdBy) {
        res.status(400).json({
          success: false,
          message: 'Нельзя удалить создателя чата'
        });
        return;
      }

      await Chat.removeParticipant(chatId, participantId);

      // Если создатель покидает чат, передаем права первому администратору
      if (participantId === chat.createdBy) {
        await Chat.transferOwnership(chatId);
      }

      // Уведомляем об удалении участника
      await this.notificationService.notifyParticipantRemoved(chatId, userId, participantId);

      res.status(200).json({
        success: true,
        message: participantId === userId ? 'Вы покинули чат' : 'Участник удален из чата'
      });

    } catch (error) {
      console.error('Ошибка удаления участника:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public leaveChat = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { chatId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      const chat = await Chat.findById(chatId);
      if (!chat) {
        res.status(404).json({
          success: false,
          message: 'Чат не найден'
        });
        return;
      }

      // Из приватных чатов нельзя выйти
      if (chat.type === 'private') {
        res.status(400).json({
          success: false,
          message: 'Нельзя покинуть приватный чат'
        });
        return;
      }

      // Проверяем, является ли пользователь участником
      const isParticipant = await Chat.isUserParticipant(chatId, userId);
      if (!isParticipant) {
        res.status(400).json({
          success: false,
          message: 'Вы не являетесь участником этого чата'
        });
        return;
      }

      await Chat.removeParticipant(chatId, userId);

      // Если создатель покидает чат, передаем права
      if (userId === chat.createdBy) {
        await Chat.transferOwnership(chatId);
      }

      // Уведомляем других участников
      await this.notificationService.notifyParticipantLeft(chatId, userId);

      res.status(200).json({
        success: true,
        message: 'Вы покинули чат'
      });

    } catch (error) {
      console.error('Ошибка выхода из чата:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public deleteChat = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { chatId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      const chat = await Chat.findById(chatId);
      if (!chat) {
        res.status(404).json({
          success: false,
          message: 'Чат не найден'
        });
        return;
      }

      // Только создатель может удалить чат
      if (chat.createdBy !== userId) {
        res.status(403).json({
          success: false,
          message: 'Только создатель может удалить чат'
        });
        return;
      }

      // Нельзя удалить приватный чат
      if (chat.type === 'private') {
        res.status(400).json({
          success: false,
          message: 'Приватный чат нельзя удалить'
        });
        return;
      }

      await this.chatService.deleteChat(chatId);

      res.status(200).json({
        success: true,
        message: 'Чат успешно удален'
      });

    } catch (error) {
      console.error('Ошибка удаления чата:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public getChatParticipants = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { chatId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      // Проверяем, является ли пользователь участником чата
      const isParticipant = await Chat.isUserParticipant(chatId, userId);
      if (!isParticipant) {
        res.status(403).json({
          success: false,
          message: 'Доступ к информации о чате запрещен'
        });
        return;
      }

      const participants = await Chat.getChatParticipants(chatId);

      res.status(200).json({
        success: true,
        data: {
          participants: participants.map(p => ({
            id: p.id,
            username: p.username,
            fullName: p.fullName,
            avatar: p.avatar,
            isOnline: p.isOnline,
            lastSeen: p.lastSeen,
            status: p.status,
            joinedAt: p.joinedAt
          }))
        }
      });

    } catch (error) {
      console.error('Ошибка получения участников чата:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { chatId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      // Проверяем, является ли пользователь участником чата
      const isParticipant = await Chat.isUserParticipant(chatId, userId);
      if (!isParticipant) {
        res.status(403).json({
          success: false,
          message: 'Доступ к чату запрещен'
        });
        return;
      }

      await Message.markChatAsRead(chatId, userId);

      res.status(200).json({
        success: true,
        message: 'Сообщения отмечены как прочитанные'
      });

    } catch (error) {
      console.error('Ошибка отметки сообщений как прочитанные:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };
}