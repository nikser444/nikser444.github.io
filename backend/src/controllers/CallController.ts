import { Request, Response } from 'express';
import { Call } from '../models/Call';
import { User } from '../models/User';
import { Chat } from '../models/Chat';
import { FriendRequest } from '../models/FriendRequest';
import { CallService } from '../services/CallService';
import { NotificationService } from '../services/NotificationService';

export class CallController {
  private callService: CallService;
  private notificationService: NotificationService;

  constructor() {
    this.callService = new CallService();
    this.notificationService = new NotificationService();
  }

  public initiateCall = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { targetUserId, type = 'audio', isGroupCall = false, chatId } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      // Валидация типа звонка
      if (!['audio', 'video'].includes(type)) {
        res.status(400).json({
          success: false,
          message: 'Неверный тип звонка'
        });
        return;
      }

      let participants: string[] = [userId];
      let chatForCall: any = null;

      if (isGroupCall && chatId) {
        // Групповой звонок в существующем чате
        const chat = await Chat.findById(chatId);
        if (!chat) {
          res.status(404).json({
            success: false,
            message: 'Чат не найден'
          });
          return;
        }

        // Проверяем, что пользователь участник чата
        const isParticipant = await Chat.isUserParticipant(chatId, userId);
        if (!isParticipant) {
          res.status(403).json({
            success: false,
            message: 'Вы не являетесь участником этого чата'
          });
          return;
        }

        // Получаем всех участников чата
        const chatParticipants = await Chat.getChatParticipants(chatId);
        participants = chatParticipants.map(p => p.id);
        chatForCall = chat;

      } else if (!isGroupCall && targetUserId) {
        // Индивидуальный звонок
        if (!targetUserId) {
          res.status(400).json({
            success: false,
            message: 'ID получателя обязателен для индивидуального звонка'
          });
          return;
        }

        if (userId === targetUserId) {
          res.status(400).json({
            success: false,
            message: 'Нельзя позвонить самому себе'
          });
          return;
        }

        // Проверяем, что получатель существует
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
          res.status(404).json({
            success: false,
            message: 'Пользователь не найден'
          });
          return;
        }

        // Проверяем, что пользователи друзья или имеют общий чат
        const areFriends = await FriendRequest.areFriends(userId, targetUserId);
        const privateChat = await Chat.findPrivateChat(userId, targetUserId);
        
        if (!areFriends && !privateChat) {
          res.status(403).json({
            success: false,
            message: 'Вы можете звонить только друзьям'
          });
          return;
        }

        participants = [userId, targetUserId];
        chatForCall = privateChat;

      } else {
        res.status(400).json({
          success: false,
          message: 'Неверные параметры звонка'
        });
        return;
      }

      // Проверяем, что получатели онлайн (для индивидуальных звонков)
      if (!isGroupCall) {
        const targetUser = await User.findById(targetUserId);
        if (!targetUser?.isOnline) {
          res.status(400).json({
            success: false,
            message: 'Пользователь оффлайн'
          });
          return;
        }
      }

      // Проверяем, нет ли активных звонков у инициатора
      const activeCall = await Call.findActiveCallForUser(userId);
      if (activeCall) {
        res.status(400).json({
          success: false,
          message: 'У вас уже есть активный звонок'
        });
        return;
      }

      // Создаем звонок
      const call = await this.callService.createCall({
        initiatorId: userId,
        participants,
        type,
        isGroupCall,
        chatId: chatForCall?.id || null,
        status: 'calling',
        createdAt: new Date()
      });

      // Отправляем уведомления участникам (кроме инициатора)
      const otherParticipants = participants.filter(p => p !== userId);
      for (const participantId of otherParticipants) {
        await this.notificationService.notifyIncomingCall(participantId, call);
      }

      res.status(201).json({
        success: true,
        message: 'Звонок инициирован',
        data: { call }
      });

    } catch (error) {
      console.error('Ошибка инициации звонка:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public answerCall = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { callId } = req.params;
      const { accept = true } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      // Находим звонок
      const call = await Call.findById(callId);
      if (!call) {
        res.status(404).json({
          success: false,
          message: 'Звонок не найден'
        });
        return;
      }

      // Проверяем, что пользователь является участником звонка
      if (!call.participants.includes(userId)) {
        res.status(403).json({
          success: false,
          message: 'Вы не являетесь участником этого звонка'
        });
        return;
      }

      // Проверяем статус звонка
      if (call.status !== 'calling') {
        res.status(400).json({
          success: false,
          message: 'Звонок уже завершен или принят'
        });
        return;
      }

      if (accept) {
        // Принимаем звонок
        const updatedCall = await Call.updateStatus(callId, 'active', {
          answeredAt: new Date(),
          answeredBy: userId
        });

        // Уведомляем инициатора о принятии звонка
        await this.notificationService.notifyCallAnswered(call.initiatorId, userId, updatedCall);

        res.status(200).json({
          success: true,
          message: 'Звонок принят',
          data: { call: updatedCall }
        });
      } else {
        // Отклоняем звонок
        const updatedCall = await Call.updateStatus(callId, 'declined', {
          endedAt: new Date(),
          declinedBy: userId
        });

        // Уведомляем инициатора об отклонении
        await this.notificationService.notifyCallDeclined(call.initiatorId, userId, updatedCall);

        res.status(200).json({
          success: true,
          message: 'Звонок отклонен',
          data: { call: updatedCall }
        });
      }

    } catch (error) {
      console.error('Ошибка ответа на звонок:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public endCall = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { callId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      // Находим звонок
      const call = await Call.findById(callId);
      if (!call) {
        res.status(404).json({
          success: false,
          message: 'Звонок не найден'
        });
        return;
      }

      // Проверяем, что пользователь является участником звонка
      if (!call.participants.includes(userId)) {
        res.status(403).json({
          success: false,
          message: 'Вы не являетесь участником этого звонка'
        });
        return;
      }

      // Проверяем статус звонка
      if (['ended', 'declined'].includes(call.status)) {
        res.status(400).json({
          success: false,
          message: 'Звонок уже завершен'
        });
        return;
      }

      // Завершаем звонок
      const duration = call.answeredAt 
        ? Math.floor((new Date().getTime() - call.answeredAt.getTime()) / 1000)
        : 0;

      const updatedCall = await Call.updateStatus(callId, 'ended', {
        endedAt: new Date(),
        duration,
        endedBy: userId
      });

      // Уведомляем всех участников о завершении звонка
      const otherParticipants = call.participants.filter(p => p !== userId);
      for (const participantId of otherParticipants) {
        await this.notificationService.notifyCallEnded(participantId, userId, updatedCall);
      }

      res.status(200).json({
        success: true,
        message: 'Звонок завершен',
        data: { call: updatedCall }
      });

    } catch (error) {
      console.error('Ошибка завершения звонка:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public getCallHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 20, type, status } = req.query;

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

      const filters: any = {};
      if (type && ['audio', 'video'].includes(type as string)) {
        filters.type = type;
      }
      if (status && ['ended', 'declined', 'missed'].includes(status as string)) {
        filters.status = status;
      }

      const calls = await Call.findUserCalls(userId, limitNum, offset, filters);
      const total = await Call.countUserCalls(userId, filters);

      // Дополняем информацией о участниках
      const callsWithParticipants = await Promise.all(
        calls.map(async (call) => {
          const participants = await Promise.all(
            call.participants
              .filter(id => id !== userId) // Исключаем себя из списка
              .map(async (participantId) => {
                const user = await User.findById(participantId);
                return {
                  id: user?.id,
                  username: user?.username,
                  fullName: user?.fullName,
                  avatar: user?.avatar
                };
              })
          );

          return {
            ...call,
            participants,
            isIncoming: call.initiatorId !== userId,
            isMissed: call.status === 'declined' && call.initiatorId !== userId
          };
        })
      );

      res.status(200).json({
        success: true,
        data: {
          calls: callsWithParticipants,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
          }
        }
      });

    } catch (error) {
      console.error('Ошибка получения истории звонков:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public getActiveCall = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      const activeCall = await Call.findActiveCallForUser(userId);

      if (!activeCall) {
        res.status(404).json({
          success: false,
          message: 'Активных звонков нет'
        });
        return;
      }

      // Получаем информацию об участниках
      const participants = await Promise.all(
        activeCall.participants.map(async (participantId) => {
          const user = await User.findById(participantId);
          return {
            id: user?.id,
            username: user?.username,
            fullName: user?.fullName,
            avatar: user?.avatar,
            isOnline: user?.isOnline
          };
        })
      );

      res.status(200).json({
        success: true,
        data: {
          call: {
            ...activeCall,
            participants
          }
        }
      });

    } catch (error) {
      console.error('Ошибка получения активного звонка:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public joinGroupCall = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { callId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      // Находим звонок
      const call = await Call.findById(callId);
      if (!call) {
        res.status(404).json({
          success: false,
          message: 'Звонок не найден'
        });
        return;
      }

      // Проверяем, что это групповой звонок
      if (!call.isGroupCall) {
        res.status(400).json({
          success: false,
          message: 'Это не групповой звонок'
        });
        return;
      }

      // Проверяем статус звонка
      if (!['calling', 'active'].includes(call.status)) {
        res.status(400).json({
          success: false,
          message: 'Звонок завершен'
        });
        return;
      }

      // Проверяем, что пользователь участник чата
      if (call.chatId) {
        const isParticipant = await Chat.isUserParticipant(call.chatId, userId);
        if (!isParticipant) {
          res.status(403).json({
            success: false,
            message: 'Вы не можете присоединиться к этому звонку'
          });
          return;
        }
      }

      // Проверяем, что пользователь не уже в звонке
      if (call.participants.includes(userId)) {
        res.status(400).json({
          success: false,
          message: 'Вы уже участвуете в этом звонке'
        });
        return;
      }

      // Добавляем пользователя к звонку
      const updatedCall = await Call.addParticipant(callId, userId);

      // Уведомляем других участников
      const otherParticipants = updatedCall.participants.filter(p => p !== userId);
      for (const participantId of otherParticipants) {
        await this.notificationService.notifyParticipantJoined(participantId, userId, updatedCall);
      }

      res.status(200).json({
        success: true,
        message: 'Вы присоединились к групповому звонку',
        data: { call: updatedCall }
      });

    } catch (error) {
      console.error('Ошибка присоединения к групповому звонку:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public leaveGroupCall = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { callId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      // Находим звонок
      const call = await Call.findById(callId);
      if (!call) {
        res.status(404).json({
          success: false,
          message: 'Звонок не найден'
        });
        return;
      }

      // Проверяем, что это групповой звонок
      if (!call.isGroupCall) {
        res.status(400).json({
          success: false,
          message: 'Это не групповой звонок'
        });
        return;
      }

      // Проверяем, что пользователь участник звонка
      if (!call.participants.includes(userId)) {
        res.status(400).json({
          success: false,
          message: 'Вы не участвуете в этом звонке'
        });
        return;
      }

      // Удаляем пользователя из звонка
      let updatedCall = await Call.removeParticipant(callId, userId);

      // Если участников осталось меньше 2, завершаем звонок
      if (updatedCall.participants.length < 2) {
        updatedCall = await Call.updateStatus(callId, 'ended', {
          endedAt: new Date(),
          endedBy: userId
        });
      }

      // Уведомляем остальных участников
      const remainingParticipants = updatedCall.participants.filter(p => p !== userId);
      for (const participantId of remainingParticipants) {
        await this.notificationService.notifyParticipantLeft(participantId, userId, updatedCall);
      }

      res.status(200).json({
        success: true,
        message: 'Вы покинули групповой звонок',
        data: { call: updatedCall }
      });

    } catch (error) {
      console.error('Ошибка выхода из группового звонка:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public createConference = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { name, participantIds, type = 'video', scheduled, description } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      // Валидация данных
      if (!name) {
        res.status(400).json({
          success: false,
          message: 'Название конференции обязательно'
        });
        return;
      }

      if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Список участников обязателен'
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

      // Создаем конференцию
      const conference = await this.callService.createConference({
        name,
        description,
        initiatorId: userId,
        participants: [userId, ...participantIds],
        type,
        isGroupCall: true,
        scheduled: scheduled ? new Date(scheduled) : null,
        status: scheduled ? 'scheduled' : 'calling',
        createdAt: new Date()
      });

      // Если конференция запланированная, отправляем приглашения
      if (scheduled) {
        for (const participantId of participantIds) {
          await this.notificationService.notifyConferenceInvite(participantId, userId, conference);
        }
      } else {
        // Иначе сразу уведомляем о входящем звонке
        for (const participantId of participantIds) {
          await this.notificationService.notifyIncomingCall(participantId, conference);
        }
      }

      res.status(201).json({
        success: true,
        message: scheduled ? 'Конференция запланирована' : 'Конференция создана',
        data: { conference }
      });

    } catch (error) {
      console.error('Ошибка создания конференции:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public getConferences = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 20, status, upcoming = false } = req.query;

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

      const filters: any = { isGroupCall: true };
      
      if (status && ['scheduled', 'active', 'ended'].includes(status as string)) {
        filters.status = status;
      }

      if (upcoming === 'true') {
        filters.upcoming = true;
      }

      const conferences = await Call.findUserConferences(userId, limitNum, offset, filters);
      const total = await Call.countUserConferences(userId, filters);

      // Дополняем информацией об участниках
      const conferencesWithDetails = await Promise.all(
        conferences.map(async (conference) => {
          const participants = await Promise.all(
            conference.participants.map(async (participantId) => {
              const user = await User.findById(participantId);
              return {
                id: user?.id,
                username: user?.username,
                fullName: user?.fullName,
                avatar: user?.avatar,
                isOnline: user?.isOnline
              };
            })
          );

          return {
            ...conference,
            participants,
            canJoin: ['scheduled', 'calling', 'active'].includes(conference.status),
            isHost: conference.initiatorId === userId
          };
        })
      );

      res.status(200).json({
        success: true,
        data: {
          conferences: conferencesWithDetails,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
          }
        }
      });

    } catch (error) {
      console.error('Ошибка получения конференций:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public updateConference = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { conferenceId } = req.params;
      const { name, description, scheduled, participantIds } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      // Находим конференцию
      const conference = await Call.findById(conferenceId);
      if (!conference) {
        res.status(404).json({
          success: false,
          message: 'Конференция не найдена'
        });
        return;
      }

      // Проверяем права на редактирование (только создатель)
      if (conference.initiatorId !== userId) {
        res.status(403).json({
          success: false,
          message: 'Только создатель может редактировать конференцию'
        });
        return;
      }

      // Можно редактировать только запланированные конференции
      if (conference.status !== 'scheduled') {
        res.status(400).json({
          success: false,
          message: 'Можно редактировать только запланированные конференции'
        });
        return;
      }

      // Обновляем конференцию
      const updateData: any = {};
      if (name) updateData.name = name;
      if (description) updateData.description = description;
      if (scheduled) updateData.scheduled = new Date(scheduled);
      if (participantIds) {
        // Проверяем новых участников
        const newParticipants = await User.findByIds(participantIds);
        if (newParticipants.length !== participantIds.length) {
          res.status(404).json({
            success: false,
            message: 'Один или несколько участников не найдены'
          });
          return;
        }
        updateData.participants = [userId, ...participantIds];
      }

      const updatedConference = await Call.updateConference(conferenceId, updateData);

      // Уведомляем участников об изменениях
      const participantsToNotify = updatedConference.participants.filter(p => p !== userId);
      for (const participantId of participantsToNotify) {
        await this.notificationService.notifyConferenceUpdated(participantId, userId, updatedConference);
      }

      res.status(200).json({
        success: true,
        message: 'Конференция обновлена',
        data: { conference: updatedConference }
      });

    } catch (error) {
      console.error('Ошибка обновления конференции:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public deleteConference = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { conferenceId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      // Находим конференцию
      const conference = await Call.findById(conferenceId);
      if (!conference) {
        res.status(404).json({
          success: false,
          message: 'Конференция не найдена'
        });
        return;
      }

      // Проверяем права на удаление (только создатель)
      if (conference.initiatorId !== userId) {
        res.status(403).json({
          success: false,
          message: 'Только создатель может удалить конференцию'
        });
        return;
      }

      // Нельзя удалить активную конференцию
      if (conference.status === 'active') {
        res.status(400).json({
          success: false,
          message: 'Нельзя удалить активную конференцию'
        });
        return;
      }

      // Удаляем конференцию
      await Call.deleteCall(conferenceId);

      // Уведомляем участников об отмене (если была запланированная)
      if (conference.status === 'scheduled') {
        const participantsToNotify = conference.participants.filter(p => p !== userId);
        for (const participantId of participantsToNotify) {
          await this.notificationService.notifyConferenceCancelled(participantId, userId, conference);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Конференция удалена'
      });

    } catch (error) {
      console.error('Ошибка удаления конференции:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public getCallStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { period = '30d' } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      let days = 30;
      switch (period) {
        case '7d': days = 7; break;
        case '30d': days = 30; break;
        case '90d': days = 90; break;
        default: days = 30;
      }

      const stats = await Call.getUserCallStats(userId, days);

      res.status(200).json({
        success: true,
        data: { stats }
      });

    } catch (error) {
      console.error('Ошибка получения статистики звонков:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };
}