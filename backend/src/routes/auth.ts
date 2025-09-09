import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validation } from '../middleware/validation';
import { auth } from '../middleware/auth';
import { body } from 'express-validator';

const router = Router();
const authController = new AuthController();

// Валидация для регистрации
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Некорректный email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Пароль должен содержать минимум 6 символов'),
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Имя пользователя должно содержать от 3 до 20 символов')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Имя пользователя может содержать только латинские буквы, цифры, _ и -'),
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Имя должно содержать от 1 до 50 символов'),
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Фамилия должна содержать от 1 до 50 символов')
];

// Валидация для входа
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Некорректный email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Пароль обязателен')
];

// Валидация для восстановления пароля
const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .withMessage('Некорректный email')
    .normalizeEmail()
];

// Валидация для сброса пароля
const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Токен обязателен'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Пароль должен содержать минимум 6 символов')
];

// Валидация для изменения пароля
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Текущий пароль обязателен'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Новый пароль должен содержать минимум 6 символов')
];

// Регистрация нового пользователя
router.post('/register', 
  registerValidation, 
  validation, 
  authController.register.bind(authController)
);

// Вход в систему
router.post('/login', 
  loginValidation, 
  validation, 
  authController.login.bind(authController)
);

// Выход из системы
router.post('/logout', 
  auth, 
  authController.logout.bind(authController)
);

// Обновление токена
router.post('/refresh', 
  authController.refresh.bind(authController)
);

// Проверка токена
router.get('/verify', 
  auth, 
  authController.verify.bind(authController)
);

// Запрос на восстановление пароля
router.post('/forgot-password', 
  forgotPasswordValidation, 
  validation, 
  authController.forgotPassword.bind(authController)
);

// Сброс пароля
router.post('/reset-password', 
  resetPasswordValidation, 
  validation, 
  authController.resetPassword.bind(authController)
);

// Изменение пароля (для авторизованных пользователей)
router.put('/change-password', 
  auth, 
  changePasswordValidation, 
  validation, 
  authController.changePassword.bind(authController)
);

// Подтверждение email
router.get('/verify-email/:token', 
  authController.verifyEmail.bind(authController)
);

// Повторная отправка письма для подтверждения email
router.post('/resend-verification', 
  auth, 
  authController.resendVerification.bind(authController)
);

export default router;