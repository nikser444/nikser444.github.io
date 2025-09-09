import { Request, Response } from 'express';
import { User } from '../models/User';
import { validateEmail } from '../utils/validation';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';

export class UserController {
  public getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Пользователь не найден'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            fullName: user.fullName,
            avatar: user.avatar,
            status: user.status,
            isOnline: user.isOnline,
            lastSeen: user.lastSeen,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt
          }
        }
      });

    } catch (error) {
      console.error('Ошибка получения профиля:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { fullName, username, status, bio } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      // Проверка уникальности username, если он изменяется
      if (username) {
        const existingUser = await User.findByUsername(username);
        if (existingUser && existingUser.id !== userId) {
          res.status(409).json({
            success: false,
            message: 'Пользователь с таким именем уже существует'
          });
          return;
        }
      }

      const updatedUser = await User.updateProfile(userId, {
        fullName,
        username,
        status,
        bio,
        updatedAt: new Date()
      });

      res.status(200).json({
        success: true,
        message: 'Профиль успешно обновлен',
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            username: updatedUser.username,
            fullName: updatedUser.fullName,
            avatar: updatedUser.avatar,
            status: updatedUser.status,
            bio: updatedUser.bio,
            isOnline: updatedUser.isOnline,
            lastSeen: updatedUser.lastSeen
          }
        }
      });

    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public uploadAvatar = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'Файл не был загружен'
        });
        return;
      }

      // Получаем текущего пользователя для удаления старого аватара
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Пользователь не найден'
        });
        return;
      }

      // Удаляем старый аватар, если он существует
      if (user.avatar && user.avatar !== '/uploads/avatars/default.png') {
        const oldAvatarPath = path.join(process.cwd(), 'uploads', 'avatars', path.basename(user.avatar));
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }

      // Путь к новому аватару
      const avatarPath = `/uploads/avatars/${req.file.filename}`;

      // Обновляем аватар в базе данных
      const updatedUser = await User.updateAvatar(userId, avatarPath);

      res.status(200).json({
        success: true,
        message: 'Аватар успешно обновлен',
        data: {
          avatar: updatedUser.avatar
        }
      });

    } catch (error) {
      console.error('Ошибка загрузки аватара:', error);
      
      // Удаляем загруженный файл в случае ошибки
      if (req.file) {
        const filePath = path.join(process.cwd(), 'uploads', 'avatars', req.file.filename);
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

  public changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Текущий и новый пароль обязательны'
        });
        return;
      }

      // Получаем пользователя
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Пользователь не найден'
        });
        return;
      }

      // Проверяем текущий пароль
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        res.status(400).json({
          success: false,
          message: 'Неверный текущий пароль'
        });
        return;
      }

      // Валидируем новый пароль
      if (newPassword.length < 8) {
        res.status(400).json({
          success: false,
          message: 'Новый пароль должен содержать минимум 8 символов'
        });
        return;
      }

      // Хешируем новый пароль
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Обновляем пароль
      await User.updatePassword(userId, hashedNewPassword);

      res.status(200).json({
        success: true,
        message: 'Пароль успешно изменен'
      });

    } catch (error) {
      console.error('Ошибка смены пароля:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public searchUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { query, page = 1, limit = 10 } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Поисковый запрос обязателен'
        });
        return;
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      const users = await User.searchUsers(query, userId, limitNum, offset);
      const total = await User.countSearchResults(query, userId);

      res.status(200).json({
        success: true,
        data: {
          users: users.map(user => ({
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            avatar: user.avatar,
            isOnline: user.isOnline,
            lastSeen: user.lastSeen,
            status: user.status
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
      console.error('Ошибка поиска пользователей:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.id;

      if (!currentUserId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Пользователь не найден'
        });
        return;
      }

      // Ограничиваем информацию для других пользователей
      const isOwnProfile = userId === currentUserId;
      
      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            avatar: user.avatar,
            status: user.status,
            bio: user.bio,
            isOnline: user.isOnline,
            lastSeen: user.lastSeen,
            ...(isOwnProfile && {
              email: user.email,
              isEmailVerified: user.isEmailVerified,
              createdAt: user.createdAt
            })
          }
        }
      });

    } catch (error) {
      console.error('Ошибка получения пользователя:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public updateOnlineStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { isOnline } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      await User.updateOnlineStatus(userId, isOnline);

      res.status(200).json({
        success: true,
        message: 'Статус онлайн обновлен'
      });

    } catch (error) {
      console.error('Ошибка обновления статуса онлайн:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public deleteAccount = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { password } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      if (!password) {
        res.status(400).json({
          success: false,
          message: 'Пароль обязателен для удаления аккаунта'
        });
        return;
      }

      // Получаем пользователя
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Пользователь не найден'
        });
        return;
      }

      // Проверяем пароль
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(400).json({
          success: false,
          message: 'Неверный пароль'
        });
        return;
      }

      // Удаляем аватар
      if (user.avatar && user.avatar !== '/uploads/avatars/default.png') {
        const avatarPath = path.join(process.cwd(), 'uploads', 'avatars', path.basename(user.avatar));
        if (fs.existsSync(avatarPath)) {
          fs.unlinkSync(avatarPath);
        }
      }

      // Удаляем аккаунт
      await User.deleteAccount(userId);

      res.status(200).json({
        success: true,
        message: 'Аккаунт успешно удален'
      });

    } catch (error) {
      console.error('Ошибка удаления аккаунта:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };
}