import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { auth } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { validation } from '../middleware/validation';
import { body, query, param } from 'express-validator';

const router = Router();
const userController = new UserController();

// Валидация для обновления профиля
const updateProfileValidation = [
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Имя должно содержать от 1 до 50 символов')
    .trim(),
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Фамилия должна содержать от 1 до 50 символов')
    .trim(),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Биография не должна превышать 500 символов')
    .trim(),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Некорректная дата рождения'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Некорректный номер телефона')
];

// Валидация для изменения статуса
const updateStatusValidation = [
  body('status')
    .isIn(['online', 'offline', 'away', 'busy'])
    .withMessage('Некорректный статус'),
  body('customStatus')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Кастомный статус не должен превышать 100 символов')
    .trim()
];

// Валидация для поиска пользователей
const searchValidation = [
  query('q')
    .isLength({ min: 1, max: 50 })
    .withMessage('Поисковый запрос должен содержать от 1 до 50 символов')
    .trim(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Лимит должен быть числом от 1 до 50')
];

// Валидация ID пользователя
const userIdValidation = [
  param('userId')
    .isUUID()
    .withMessage('Некорректный ID пользователя')
];

// Получить свой профиль
router.get('/profile', 
  auth, 
  userController.getProfile.bind(userController)
);

// Обновить свой профиль
router.put('/profile', 
  auth, 
  updateProfileValidation, 
  validation, 
  userController.updateProfile.bind(userController)
);

// Загрузить аватар
router.post('/avatar', 
  auth, 
  upload.single('avatar'), 
  userController.uploadAvatar.bind(userController)
);

// Удалить аватар
router.delete('/avatar', 
  auth, 
  userController.deleteAvatar.bind(userController)
);

// Получить профиль пользователя по ID
router.get('/:userId', 
  auth, 
  userIdValidation, 
  validation, 
  userController.getUserById.bind(userController)
);

// Поиск пользователей
router.get('/', 
  auth, 
  searchValidation, 
  validation, 
  userController.searchUsers.bind(userController)
);

// Обновить статус пользователя
router.put('/status', 
  auth, 
  updateStatusValidation, 
  validation, 
  userController.updateStatus.bind(userController)
);

// Получить онлайн статус пользователей
router.post('/status/batch', 
  auth, 
  body('userIds')
    .isArray({ min: 1, max: 100 })
    .withMessage('userIds должен быть массивом от 1 до 100 элементов'),
  body('userIds.*')
    .isUUID()
    .withMessage('Некорректный ID пользователя'),
  validation,
  userController.getUsersStatus.bind(userController)
);

// Заблокировать пользователя
router.post('/:userId/block', 
  auth, 
  userIdValidation, 
  validation, 
  userController.blockUser.bind(userController)
);

// Разблокировать пользователя
router.delete('/:userId/block', 
  auth, 
  userIdValidation, 
  validation, 
  userController.unblockUser.bind(userController)
);

// Получить список заблокированных пользователей
router.get('/blocked/list', 
  auth, 
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Номер страницы должен быть положительным числом'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Лимит должен быть числом от 1 до 50'),
  validation,
  userController.getBlockedUsers.bind(userController)
);

// Настройки приватности
router.put('/privacy', 
  auth, 
  body('profileVisibility')
    .optional()
    .isIn(['public', 'friends', 'private'])
    .withMessage('Некорректная настройка видимости профиля'),
  body('lastSeenVisibility')
    .optional()
    .isIn(['everyone', 'friends', 'nobody'])
    .withMessage('Некорректная настройка видимости времени последнего посещения'),
  body('phoneVisibility')
    .optional()
    .isIn(['everyone', 'friends', 'nobody'])
    .withMessage('Некорректная настройка видимости телефона'),
  validation,
  userController.updatePrivacySettings.bind(userController)
);

// Получить настройки приватности
router.get('/privacy/settings', 
  auth, 
  userController.getPrivacySettings.bind(userController)
);

// Удалить аккаунт
router.delete('/account', 
  auth, 
  body('password')
    .notEmpty()
    .withMessage('Пароль обязателен для удаления аккаунта'),
  validation,
  userController.deleteAccount.bind(userController)
);

export default router;