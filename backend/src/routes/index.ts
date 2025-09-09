import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import chatRoutes from './chats';
import messageRoutes from './messages';
import friendRoutes from './friends';
import callRoutes from './calls';
import { cors } from '../middleware/cors';
import { security } from '../middleware/security';

const router = Router();

// Применение базовых middleware для всех маршрутов
router.use(cors);
router.use(security);

// Регистрация всех маршрутов с префиксами
router.use('/api/auth', authRoutes);
router.use('/api/users', userRoutes);
router.use('/api/chats', chatRoutes);
router.use('/api/messages', messageRoutes);
router.use('/api/friends', friendRoutes);
router.use('/api/calls', callRoutes);

// Обработка несуществующих маршрутов
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Маршрут не найден',
    path: req.originalUrl
  });
});

// Глобальная обработка ошибок
router.use((error: any, req: any, res: any, next: any) => {
  console.error('Ошибка в маршруте:', error);
  
  // Если ошибка уже была обработана
  if (res.headersSent) {
    return next(error);
  }

  // Обработка различных типов ошибок
  let statusCode = 500;
  let message = 'Внутренняя ошибка сервера';

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Ошибка валидации данных';
  } else if (error.name === 'UnauthorizedError' || error.message === 'Unauthorized') {
    statusCode = 401;
    message = 'Не авторизован';
  } else if (error.name === 'ForbiddenError' || error.message === 'Forbidden') {
    statusCode = 403;
    message = 'Доступ запрещен';
  } else if (error.name === 'NotFoundError' || error.message === 'Not Found') {
    statusCode = 404;
    message = 'Ресурс не найден';
  } else if (error.name === 'ConflictError' || error.message === 'Conflict') {
    statusCode = 409;
    message = 'Конфликт данных';
  } else if (error.message) {
    message = error.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error
    })
  });
});

export default router;