import { Router } from 'express';
import { ChatController } from '../controllers/ChatController';
import { auth } from '../middleware/auth';
import { validation } from '../middleware/validation';
import { upload } from '../middleware/upload';
import { body, query, param } from 'express-validator';

const router = Router();
const chatController = new ChatController();

// Валидация для создания чата
const createChatValidation = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Название чата должно содержать от 1 до 100 символов')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Описание чата не должно превышать 500 символов')
    .trim(),
  body('type')
    .isIn(['private', 'group'])
    .withMessage('Тип чата должен быть private или group'),
  body('participants')
    .isArray({ min: 1, max: 100 })
    .withMessage('Участники должны быть массивом от 1 до 100 элементов'),
  body('participants.*')
    .isUUID()
    .withMessage('Некорректный ID участника')
];

// Валидация для обновления чата
const updateChatValidation = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Название чата должно содержать от 1 до 100 символов')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Описание чата не должно превышать 500 символов')
    .trim()
];

// Валидация ID чата
const chatIdValidation = [
  param('chatId')
    .isUUID()
    .withMessage('Некорректный ID чата')
];

// Валидация для добавления участников
const addParticipantsValidation = [
  body('participants')
    .isArray({ min: 1, max: 50 })
    .withMessage('Участники должны быть массивом от 1 до 50 элементов'),
  body('participants.*')
    .isUUID()
    .withMessage('Некорректный ID участника')
];

// Валидация для удаления участника
const removeParticipantValidation = [
  param('userId')
    .isUUID()
    .withMessage('Некорректный ID пользователя')
];

// Валидация для настроек чата
const chatSettingsValidation = [
  body('muteNotifications')
    .optional()
    .isBoolean()
    .withMessage('muteNotifications должно быть boolean'),
  body('theme')
    .optional()
    .isIn(['default', 'dark', 'blue', 'green'])
    .withMessage('Некорректная тема чата'),
  body('customBackground')
    .optional()
    .isURL()
    .withMessage('Некорректный URL фона')
];

// Получить список чатов пользователя
router.get('/', 
  auth, 
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Номер страницы должен быть положительным числом'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Лимит должен быть числом от 1 до 50'),
  query('type')
    .optional()
    .isIn(['private', 'group', 'all'])
    .withMessage('Тип должен быть private, group или all'),
  validation,
  chatController.getUserChats.bind(chatController)
);

// Создать новый чат
router.post('/', 
  auth, 
  createChatValidation, 
  validation, 
  chatController.createChat.bind(chatController)
);

// Получить информацию о чате
router.get('/:chatId', 
  auth, 
  chatIdValidation, 
  validation, 
  chatController.getChatById.bind(chatController)
);

// Обновить информацию о чате
router.put('/:chatId', 
  auth, 
  chatIdValidation, 
  updateChatValidation, 
  validation, 
  chatController.updateChat.bind(chatController)
);

// Удалить чат
router.delete('/:chatId', 
  auth, 
  chatIdValidation, 
  validation, 
  chatController.deleteChat.bind(chatController)
);

// Покинуть чат
router.post('/:chatId/leave', 
  auth, 
  chatIdValidation, 
  validation, 
  chatController.leaveChat.bind(chatController)
);

// Получить участников чата
router.get('/:chatId/participants', 
  auth, 
  chatIdValidation, 
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Номер страницы должен быть положительным числом'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Лимит должен быть числом от 1 до 100'),
  validation,
  chatController.getChatParticipants.bind(chatController)
);

// Добавить участников в чат
router.post('/:chatId/participants', 
  auth, 
  chatIdValidation, 
  addParticipantsValidation, 
  validation, 
  chatController.addParticipants.bind(chatController)
);

// Удалить участника из чата
router.delete('/:chatId/participants/:userId', 
  auth, 
  chatIdValidation, 
  removeParticipantValidation, 
  validation, 
  chatController.removeParticipant.bind(chatController)
);

// Назначить администратора чата
router.post('/:chatId/admin/:userId', 
  auth, 
  chatIdValidation, 
  removeParticipantValidation, 
  validation, 
  chatController.promoteToAdmin.bind(chatController)
);

// Снять администратора чата
router.delete('/:chatId/admin/:userId', 
  auth, 
  chatIdValidation, 
  removeParticipantValidation, 
  validation, 
  chatController.demoteFromAdmin.bind(chatController)
);

// Загрузить аватар чата
router.post('/:chatId/avatar', 
  auth, 
  chatIdValidation, 
  validation,
  upload.single('avatar'), 
  chatController.uploadChatAvatar.bind(chatController)
);

// Удалить аватар чата
router.delete('/:chatId/avatar', 
  auth, 
  chatIdValidation, 
  validation, 
  chatController.deleteChatAvatar.bind(chatController)
);

// Получить настройки чата пользователя
router.get('/:chatId/settings', 
  auth, 
  chatIdValidation, 
  validation, 
  chatController.getChatSettings.bind(chatController)
);

// Обновить настройки чата пользователя
router.put('/:chatId/settings', 
  auth, 
  chatIdValidation, 
  chatSettingsValidation, 
  validation, 
  chatController.updateChatSettings.bind(chatController)
);

// Закрепить чат
router.post('/:chatId/pin', 
  auth, 
  chatIdValidation, 
  validation, 
  chatController.pinChat.bind(chatController)
);

// Открепить чат
router.delete('/:chatId/pin', 
  auth, 
  chatIdValidation, 
  validation, 
  chatController.unpinChat.bind(chatController)
);

// Архивировать чат
router.post('/:chatId/archive', 
  auth, 
  chatIdValidation, 
  validation, 
  chatController.archiveChat.bind(chatController)
);

// Разархивировать чат
router.delete('/:chatId/archive', 
  auth, 
  chatIdValidation, 
  validation, 
  chatController.unarchiveChat.bind(chatController)
);

// Отметить сообщения как прочитанные
router.post('/:chatId/mark-read', 
  auth, 
  chatIdValidation, 
  validation, 
  chatController.markAsRead.bind(chatController)
);

// Получить количество непрочитанных сообщений
router.get('/:chatId/unread-count', 
  auth, 
  chatIdValidation, 
  validation, 
  chatController.getUnreadCount.bind(chatController)
);

export default router;