import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { EmailService } from '../services/EmailService';
import { User } from '../models/User';
import { validateEmail, validatePassword } from '../utils/validation';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export class AuthController {
  private authService: AuthService;
  private emailService: EmailService;

  constructor() {
    this.authService = new AuthService();
    this.emailService = new EmailService();
  }

  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, username, fullName } = req.body;

      // Валидация данных
      if (!email || !password || !username || !fullName) {
        res.status(400).json({
          success: false,
          message: 'Все поля обязательны для заполнения'
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

      if (!validatePassword(password)) {
        res.status(400).json({
          success: false,
          message: 'Пароль должен содержать минимум 8 символов, включая цифры и буквы'
        });
        return;
      }

      // Проверка существующего пользователя
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'Пользователь с таким email уже существует'
        });
        return;
      }

      const existingUsername = await User.findByUsername(username);
      if (existingUsername) {
        res.status(409).json({
          success: false,
          message: 'Пользователь с таким именем уже существует'
        });
        return;
      }

      // Создание пользователя
      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = await User.create({
        email,
        password: hashedPassword,
        username,
        fullName,
        isEmailVerified: false,
        isOnline: false,
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Генерация JWT токена
      const token = await this.authService.generateTokens(newUser.id);

      // Отправка welcome email
      await this.emailService.sendWelcomeEmail(email, fullName);

      res.status(201).json({
        success: true,
        message: 'Пользователь успешно зарегистрирован',
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            username: newUser.username,
            fullName: newUser.fullName,
            avatar: newUser.avatar,
            isOnline: newUser.isOnline,
            isEmailVerified: newUser.isEmailVerified
          },
          tokens: token
        }
      });

    } catch (error) {
      console.error('Ошибка при регистрации:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Валидация данных
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email и пароль обязательны'
        });
        return;
      }

      // Поиск пользователя
      const user = await User.findByEmail(email);
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Неверный email или пароль'
        });
        return;
      }

      // Проверка пароля
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Неверный email или пароль'
        });
        return;
      }

      // Обновление статуса онлайн
      await User.updateOnlineStatus(user.id, true);

      // Генерация токенов
      const tokens = await this.authService.generateTokens(user.id);

      res.status(200).json({
        success: true,
        message: 'Успешный вход',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            fullName: user.fullName,
            avatar: user.avatar,
            isOnline: true,
            isEmailVerified: user.isEmailVerified,
            status: user.status
          },
          tokens
        }
      });

    } catch (error) {
      console.error('Ошибка при входе:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
        return;
      }

      // Обновление статуса оффлайн
      await User.updateOnlineStatus(userId, false);

      // Инвалидация токена (добавить в blacklist в Redis)
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        await this.authService.invalidateToken(token);
      }

      res.status(200).json({
        success: true,
        message: 'Успешный выход'
      });

    } catch (error) {
      console.error('Ошибка при выходе:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token обязателен'
        });
        return;
      }

      const tokens = await this.authService.refreshTokens(refreshToken);
      
      res.status(200).json({
        success: true,
        message: 'Токены обновлены',
        data: { tokens }
      });

    } catch (error) {
      console.error('Ошибка обновления токена:', error);
      res.status(401).json({
        success: false,
        message: 'Недействительный refresh token'
      });
    }
  };

  public verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.params;

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await User.findById(decoded.userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Пользователь не найден'
        });
        return;
      }

      await User.verifyEmail(user.id);

      res.status(200).json({
        success: true,
        message: 'Email успешно подтвержден'
      });

    } catch (error) {
      console.error('Ошибка подтверждения email:', error);
      res.status(400).json({
        success: false,
        message: 'Недействительная ссылка подтверждения'
      });
    }
  };

  public forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email обязателен'
        });
        return;
      }

      const user = await User.findByEmail(email);
      if (!user) {
        // Не показываем, что пользователь не существует из соображений безопасности
        res.status(200).json({
          success: true,
          message: 'Если пользователь с таким email существует, инструкции отправлены на почту'
        });
        return;
      }

      await this.authService.sendPasswordResetEmail(email);

      res.status(200).json({
        success: true,
        message: 'Инструкции по восстановлению пароля отправлены на почту'
      });

    } catch (error) {
      console.error('Ошибка восстановления пароля:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  };

  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Токен и новый пароль обязательны'
        });
        return;
      }

      if (!validatePassword(newPassword)) {
        res.status(400).json({
          success: false,
          message: 'Пароль должен содержать минимум 8 символов, включая цифры и буквы'
        });
        return;
      }

      await this.authService.resetPassword(token, newPassword);

      res.status(200).json({
        success: true,
        message: 'Пароль успешно изменен'
      });

    } catch (error) {
      console.error('Ошибка сброса пароля:', error);
      res.status(400).json({
        success: false,
        message: 'Недействительный токен или токен истек'
      });
    }
  };
}