import { Request, Response } from 'express';
import { FriendRequest } from '../models/FriendRequest';
import { User } from '../models/User';
import { Chat } from '../models/Chat';
import { NotificationService } from '../services/NotificationService';
import { ChatService } from '../services/ChatService';
import { validateEmail } from '../utils/validation';

export class FriendController {
  private notificationService: NotificationService;
  private chatService: ChatService;

  constructor() {
    this.notificationService = new NotificationService();
    this.chatService = new ChatService();
  }

  public sendFriendRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { email, message } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email получателя обязателен'
        });
        return;
      }

      if (!validateEmail(email)) {
        res.status(400).json({
          success: false,
          message: 'Некорректный email адрес'
        });
        return;
      }

      // Находим пользователя по email
      const targetUser = await User.findByEmail(email);
      if (!targetUser) {
        res.status(404).json({
          success: false,
          message: 'Пользователь с таким email не найден'
        });
        return;
      }

      // Нельзя отправить заявку самому себе
      if (targetUser.id === userId) {
        res.status(400).json({
          success: false,
          message: 'Нельзя отправить заявку в друзья самому себе'
        });
        return;
      }

      // Проверяем, не являются ли пользователи уже друзьями
      const areAlreadyFriends = await FriendRequest.areFriends(userId, targetUser.id);
      if (areAlreadyFriends) {
        res.status(400).json({
          success: false,
          message: 'Вы уже друзья с этим пользователем'
        });
        return;
      }

      // Проверяем, нет ли уже активной заявки
      const existingRequest = await FriendRequest.findPendingRequest(userId, targetUser.id);
      if (existingRequest) {
        if (existingRequest.senderId === userId) {
          res.status(400).json({
            success: false,
            message: 'Заявка в друзья уже отправлена этому пользователю'
          });
          return;
        } else {
          // Если есть входящая заявка, предлагаем принять её
          res.status(400).json({
            success: false,
            message: 'У вас есть входящая заявка от этого пользователя. Примите её в разделе заявок.'
          });
          return;
        }
      }

      // Создаем заявку в друзья
      const friendRequest = await FriendRequest.create({
        senderId: userId,
        receiverId: targetUser.id,
        message: message || '',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Отправляем уведомление получателю
      await this.notificationService.notifyFriendRequest(targetUser.id, userId, friendRequest);

      res.status(201).json({
        success: true,
        message: 'Заявка в друзья отправлена',
        data: { friendRequest }
      });

    } catch (error) {
      console.error('Ошибка отправки заявки в друзья:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public acceptFriendRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { requestId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      // Находим заявку
      const friendRequest = await FriendRequest.findById(requestId);
      if (!friendRequest) {
        res.status(404).json({
          success: false,
          message: 'Заявка в друзья не найдена'
        });
        return;
      }

      // Проверяем, что заявка адресована текущему пользователю
      if (friendRequest.receiverId !== userId) {
        res.status(403).json({
          success: false,
          message: 'Это не ваша заявка в друзья'
        });
        return;
      }

      // Проверяем статус заявки
      if (friendRequest.status !== 'pending') {
        res.status(400).json({
          success: false,
          message: 'Заявка уже обработана'
        });
        return;
      }

      // Принимаем заявку
      await FriendRequest.updateStatus(requestId, 'accepted');

      // Создаем приватный чат между друзьями
      const chat = await this.chatService.createChat({
        type: 'private',
        createdBy: userId,
        participantIds: [userId, friendRequest.senderId]
      });

      // Отправляем уведомление отправителю заявки
      await this.notificationService.notifyFriendRequestAccepted(friendRequest.senderId, userId);

      res.status(200).json({
        success: true,
        message: 'Заявка в друзья принята',
        data: { chat }
      });

    } catch (error) {
      console.error('Ошибка принятия заявки в друзья:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public declineFriendRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { requestId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      // Находим заявку
      const friendRequest = await FriendRequest.findById(requestId);
      if (!friendRequest) {
        res.status(404).json({
          success: false,
          message: 'Заявка в друзья не найдена'
        });
        return;
      }

      // Проверяем права на отклонение (получатель или отправитель могут отменить)
      if (friendRequest.receiverId !== userId && friendRequest.senderId !== userId) {
        res.status(403).json({
          success: false,
          message: 'Недостаточно прав для отклонения заявки'
        });
        return;
      }

      // Проверяем статус заявки
      if (friendRequest.status !== 'pending') {
        res.status(400).json({
          success: false,
          message: 'Заявка уже обработана'
        });
        return;
      }

      // Отклоняем заявку
      await FriendRequest.updateStatus(requestId, 'declined');

      const action = friendRequest.receiverId === userId ? 'отклонена' : 'отменена';

      res.status(200).json({
        success: true,
        message: `Заявка в друзья ${action}`
      });

    } catch (error) {
      console.error('Ошибка отклонения заявки в друзья:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public getFriendRequests = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { type = 'received', page = 1, limit = 20 } = req.query;

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

      let requests;
      let total;

      if (type === 'sent') {
        // Отправленные заявки
        requests = await FriendRequest.findSentRequests(userId, limitNum, offset);
        total = await FriendRequest.countSentRequests(userId);
      } else {
        // Полученные заявки
        requests = await FriendRequest.findReceivedRequests(userId, limitNum, offset);
        total = await FriendRequest.countReceivedRequests(userId);
      }

      // Дополняем информацией о пользователях
      const requestsWithUsers = await Promise.all(
        requests.map(async (request) => {
          const otherUserId = type === 'sent' ? request.receiverId : request.senderId;
          const user = await User.findById(otherUserId);
          
          return {
            ...request,
            user: {
              id: user?.id,
              username: user?.username,
              fullName: user?.fullName,
              avatar: user?.avatar,
              isOnline: user?.isOnline,
              lastSeen: user?.lastSeen,
              status: user?.status
            }
          };
        })
      );

      res.status(200).json({
        success: true,
        data: {
          requests: requestsWithUsers,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
          }
        }
      });

    } catch (error) {
      console.error('Ошибка получения заявок в друзья:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public getFriends = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 50, search } = req.query;

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

      let friends;
      let total;

      if (search && typeof search === 'string') {
        friends = await FriendRequest.searchFriends(userId, search, limitNum, offset);
        total = await FriendRequest.countSearchFriends(userId, search);
      } else {
        friends = await FriendRequest.findUserFriends(userId, limitNum, offset);
        total = await FriendRequest.countUserFriends(userId);
      }

      res.status(200).json({
        success: true,
        data: {
          friends: friends.map(friend => ({
            id: friend.id,
            username: friend.username,
            fullName: friend.fullName,
            avatar: friend.avatar,
            isOnline: friend.isOnline,
            lastSeen: friend.lastSeen,
            status: friend.status,
            friendsSince: friend.friendsSince
          })),
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
          }
        }
      });

    } catch (error) {
      console.error('Ошибка получения списка друзей:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public removeFriend = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { friendId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      // Проверяем, что пользователи действительно друзья
      const areFriends = await FriendRequest.areFriends(userId, friendId);
      if (!areFriends) {
        res.status(404).json({
          success: false,
          message: 'Этот пользователь не ваш друг'
        });
        return;
      }

      // Удаляем из друзей
      await FriendRequest.removeFriend(userId, friendId);

      // Находим и архивируем приватный чат (не удаляем полностью)
      const privateChat = await Chat.findPrivateChat(userId, friendId);
      if (privateChat) {
        await Chat.archiveChat(privateChat.id);
      }

      res.status(200).json({
        success: true,
        message: 'Пользователь удален из друзей'
      });

    } catch (error) {
      console.error('Ошибка удаления из друзей:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public blockUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { targetUserId } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      if (!targetUserId) {
        res.status(400).json({
          success: false,
          message: 'ID пользователя для блокировки обязателен'
        });
        return;
      }

      if (userId === targetUserId) {
        res.status(400).json({
          success: false,
          message: 'Нельзя заблокировать самого себя'
        });
        return;
      }

      // Проверяем, что пользователь существует
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        res.status(404).json({
          success: false,
          message: 'Пользователь не найден'
        });
        return;
      }

      // Проверяем, не заблокирован ли уже
      const isBlocked = await FriendRequest.isBlocked(userId, targetUserId);
      if (isBlocked) {
        res.status(400).json({
          success: false,
          message: 'Пользователь уже заблокирован'
        });
        return;
      }

      // Блокируем пользователя
      await FriendRequest.blockUser(userId, targetUserId);

      // Удаляем из друзей, если были друзьями
      const areFriends = await FriendRequest.areFriends(userId, targetUserId);
      if (areFriends) {
        await FriendRequest.removeFriend(userId, targetUserId);
      }

      // Отклоняем все активные заявки
      await FriendRequest.declineAllPendingRequests(userId, targetUserId);

      res.status(200).json({
        success: true,
        message: 'Пользователь заблокирован'
      });

    } catch (error) {
      console.error('Ошибка блокировки пользователя:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public unblockUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { targetUserId } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      if (!target