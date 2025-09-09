import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/jwt';
import { UserModel } from '../models/User';

// Расширяем интерфейс Request для добавления пользователя
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    role?: string;
  };
}

/**
 * Middleware для проверки JWT токена
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Токен доступа не предоставлен'
      });
      return;
    }

    // Верификация токена
    const decoded = jwt.verify(token, JWT_CONFIG.accessSecret) as any;
    
    // Проверяем, существует ли пользователь в БД
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Пользователь не найден'
      });
      return;
    }

    // Проверяем, не заблокирован ли пользователь
    if (user.isBlocked) {
      res.status(403).json({
        success: false,
        message: 'Аккаунт заблокирован'
      });
      return;
    }

    // Добавляем пользователя в объект запроса
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Токен истек',
        code: 'TOKEN_EXPIRED'
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Недействительный токен'
      });
      return;
    }

    console.error('Ошибка в middleware авторизации:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
};

/**
 * Middleware для проверки роли пользователя
 */
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Пользователь не аутентифицирован'
      });
      return;
    }

    const userRole = req.user.role || 'user';
    if (!roles.includes(userRole)) {
      res.status(403).json({
        success: false,
        message: 'Недостаточно прав доступа'
      });
      return;
    }

    next();
  };
};

/**
 * Middleware для проверки администратора
 */
export const requireAdmin = requireRole(['admin']);

/**
 * Опциональная авторизация (не обязательная)
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_CONFIG.accessSecret) as any;
      const user = await UserModel.findById(decoded.userId);
      
      if (user && !user.isBlocked) {
        req.user = {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        };
      }
    }

    next();
  } catch (error) {
    // Игнорируем ошибки и просто продолжаем без авторизации
    next();
  }
};