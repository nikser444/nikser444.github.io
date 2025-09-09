import { Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import validator from 'validator';

/**
 * Обработчик результатов валидации
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Ошибка валидации',
      errors: errors.array().map(error => ({
        field: error.type === 'field' ? (error as any).path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? (error as any).value : undefined
      }))
    });
    return;
  }
  
  next();
};

/**
 * Валидация регистрации пользователя
 */
export const validateRegister: ValidationChain[] = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Имя пользователя должно быть от 3 до 30 символов')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Имя пользователя может содержать только буквы, цифры, _ и -'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Некорректный email адрес')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Пароль должен содержать минимум 8 символов')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Пароль должен содержать минимум одну заглавную букву, одну строчную букву и одну цифру'),
  
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Имя должно быть от 1 до 50 символов'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Фамилия должна быть от 1 до 50 символов')
];

/**
 * Валидация входа пользователя
 */
export const validateLogin: ValidationChain[] = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Некорректный email адрес')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Пароль обязателен')
];

/**
 * Валидация создания чата
 */
export const validateCreateChat: ValidationChain[] = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Название чата должно быть от 1 до 100 символов'),
  
  body('type')
    .isIn(['private', 'group'])
    .withMessage('Тип чата должен быть private или group'),
  
  body('members')
    .isArray({ min: 1 })
    .withMessage('Должен быть указан минимум один участник')
    .custom((members: string[]) => {
      members.forEach(memberId => {
        if (!validator.isUUID(memberId)) {
          throw new Error('Некорректный ID участника');
        }
      });
      return true;
    }),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Описание не должно превышать 500 символов')
];

/**
 * Валидация отправки сообщения
 */
export const validateSendMessage: ValidationChain[] = [
  body('chatId')
    .isUUID()
    .withMessage('Некорректный ID чата'),
  
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Сообщение должно быть от 1 до 2000 символов'),
  
  body('type')
    .isIn(['text', 'image', 'file', 'audio', 'video'])
    .withMessage('Некорректный тип сообщения'),
  
  body('replyTo')
    .optional()
    .isUUID()
    .withMessage('Некорректный ID сообщения для ответа'),
  
  // Кастомная валидация для проверки контента в зависимости от типа
  body().custom((body) => {
    if (body.type === 'text' && !body.content) {
      throw new Error('Текстовое сообщение должно содержать контент');
    }
    if (body.type !== 'text' && !body.fileUrl) {
      throw new Error('Медиа сообщение должно содержать URL файла');
    }
    return true;
  })
];

/**
 * Валидация добавления друга
 */
export const validateAddFriend: ValidationChain[] = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Некорректный email адрес')
    .normalizeEmail(),
  
  body('message')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Сообщение не должно превышать 200 символов')
];

/**
 * Валидация обновления профиля
 */
export const validateUpdateProfile: ValidationChain[] = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Имя должно быть от 1 до 50 символов'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Фамилия должна быть от 1 до 50 символов'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('О себе не должно превышать 500 символов'),
  
  body('status')
    .optional()
    .isIn(['online', 'away', 'busy', 'invisible'])
    .withMessage('Некорректный статус'),
  
  body('theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('Некорректная тема оформления'),
  
  body('notifications')
    .optional()
    .isObject()
    .withMessage('Настройки уведомлений должны быть объектом')
];

/**
 * Валидация смены пароля
 */
export const validateChangePassword: ValidationChain[] = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Текущий пароль обязателен'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Новый пароль должен содержать минимум 8 символов')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Новый пароль должен содержать минимум одну заглавную букву, одну строчную букву и одну цифру'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Пароли не совпадают');
      }
      return true;
    })
];

/**
 * Валидация создания звонка
 */
export const validateCreateCall: ValidationChain[] = [
  body('type')
    .isIn(['audio', 'video'])
    .withMessage('Тип звонка должен быть audio или video'),
  
  body('participants')
    .isArray({ min: 1, max: 10 })
    .withMessage('Должен быть от 1 до 10 участников')
    .custom((participants: string[]) => {
      participants.forEach(participantId => {
        if (!validator.isUUID(participantId)) {
          throw new Error('Некорректный ID участника');
        }
      });
      return true;
    }),
  
  body('chatId')
    .optional()
    .isUUID()
    .withMessage('Некорректный ID чата')
];

/**
 * Валидация поиска пользователей
 */
export const validateSearchUsers: ValidationChain[] = [
  body('query')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Поисковый запрос должен быть от 2 до 100 символов'),
  
  body('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Лимит должен быть от 1 до 50'),
  
  body('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Смещение должно быть не отрицательным')
];

/**
 * Валидация параметров запроса (query parameters)
 */
export const validateQueryParams = {
  page: (req: Request, res: Response, next: NextFunction): void => {
    const page = parseInt(req.query.page as string) || 1;
    if (page < 1) {
      res.status(400).json({
        success: false,
        message: 'Номер страницы должен быть больше 0'
      });
      return;
    }
    req.query.page = page.toString();
    next();
  },

  limit: (req: Request, res: Response, next: NextFunction): void => {
    const limit = parseInt(req.query.limit as string) || 20;
    if (limit < 1 || limit > 100) {
      res.status(400).json({
        success: false,
        message: 'Лимит должен быть от 1 до 100'
      });
      return;
    }
    req.query.limit = limit.toString();
    next();
  },

  chatId: (req: Request, res: Response, next: NextFunction): void => {
    const chatId = req.params.chatId || req.query.chatId;
    if (chatId && !validator.isUUID(chatId as string)) {
      res.status(400).json({
        success: false,
        message: 'Некорректный ID чата'
      });
      return;
    }
    next();
  },

  userId: (req: Request, res: Response, next: NextFunction): void => {
    const userId = req.params.userId || req.query.userId;
    if (userId && !validator.isUUID(userId as string)) {
      res.status(400).json({
        success: false,
        message: 'Некорректный ID пользователя'
      });
      return;
    }
    next();
  }
};

/**
 * Универсальная функция для создания валидаторов параметров маршрута
 */
export const validateParam = (paramName: string, validationType: 'uuid' | 'number' | 'string') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.params[paramName];
    
    if (!value) {
      res.status(400).json({
        success: false,
        message: `Параметр ${paramName} обязателен`
      });
      return;
    }

    switch (validationType) {
      case 'uuid':
        if (!validator.isUUID(value)) {
          res.status(400).json({
            success: false,
            message: `Некорректный формат ${paramName}`
          });
          return;
        }
        break;
      case 'number':
        if (!validator.isNumeric(value)) {
          res.status(400).json({
            success: false,
            message: `${paramName} должен быть числом`
          });
          return;
        }
        break;
      case 'string':
        if (typeof value !== 'string' || value.trim().length === 0) {
          res.status(400).json({
            success: false,
            message: `${paramName} не должен быть пустым`
          });
          return;
        }
        break;
    }

    next();
  };
};