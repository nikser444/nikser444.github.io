import { Router } from 'express';
import { MessageController } from '../controllers/MessageController';
import { auth } from '../middleware/auth';
import { validation } from '../middleware/validation';
import { upload } from '../middleware/upload';
import { body, query, param } from 'express-validator';

const router = Router();
const messageController = new MessageController();

// Валидация для отправки сообщения
const sendMessageValidation = [
  body('chatId')
    .isUUID()
    .withMessage('Некорректный ID чата'),
  body('content')
    .optional()
    .isLength({ min: 1, max: 4000 })
    .withMessage('Содержимое сообщения должно содержать от 1 до 4000 символов')
    .trim(),
  body('type')
    .isIn(['text', 'image', 'file', 'audio', 'video', 'location', 'contact'])
    .withMessage('Некорректный тип сообщения'),
  body('replyToId')
    .optional()
    .isUUID()
    .withMessage('Некорректный ID сообщения для ответа'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Метаданные должны быть объектом')
];

// Валидация ID сообщения
const messageIdValidation = [
  param('messageId')
    .isUUID()
    .withMessage('Некорректный ID сообщения')
];

// Валидация для обновления сообщения
const updateMessageValidation = [
  body('content')
    .isLength({ min: 1, max: 4000 })
    .withMessage('Содержимое сообщения должно содержать от 1 до 4000 символов')
    .trim()
];

// Валидация для получения сообщений чата
const getChatMessagesValidation = [
  param('chatId')
    .isUUID()
    .withMessage('Некорректный ID чата'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Номер страницы должен быть положительным числом'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Лимит должен быть числом от 1 до 100'),
  query('before')
    .optional()
    .isISO8601()
    .withMessage('Некорректная дата before'),
  query('after')
    .optional()
    .isISO8601()
    .withMessage('Некорректная дата after')
];

// Валидация для поиска сообщений
const searchMessagesValidation = [
  query('q')
    .isLength({ min: 1, max: 100 })
    .withMessage('Поисковый запрос должен содержать от 1 до 100 символов')
    .trim(),
  query('chatId')
    .optional()
    .isUUID()
    .withMessage('Некорректный ID чата'),
  query('type')
    .optional()
    .isIn(['text', 'image', 'file', 'audio', 'video', 'location', 'contact'])
    .withMessage('Некорректный тип сообщения'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Номер страницы должен быть положительным числом'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Лимит должен быть числом от 1 до 50')
];

// Отправить текстовое сообщение
router.post('/', 
  auth, 
  sendMessageValidation, 
  validation, 
  messageController.sendMessage.bind(messageController)
);

// Отправить сообщение с файлом
router.post('/file', 
  auth, 
  upload.single('file'),
  body('chatId')
    .isUUID()
    .withMessage('Некорректный ID чата'),
  body('caption')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Подпись не должна превышать 1000 символов')
    .trim(),
  body('replyToId')
    .optional()
    .isUUID()
    .withMessage('Некорректный ID сообщения для ответа'),
  validation,
  messageController.sendFileMessage.bind(messageController)
);

// Отправить голосовое сообщение
router.post('/voice', 
  auth, 
  upload.single('voice'),
  body('chatId')
    .isUUID()
    .withMessage('Некорректный ID чата'),
  body('duration')
    .optional()
    .isInt({ min: 1, max: 600 })
    .withMessage('Длительность должна быть от 1 до 600 секунд'),
  validation,
  messageController.sendVoiceMessage.bind(messageController)
);

// Получить сообщения чата
router.get('/chat/:chatId', 
  auth, 
  getChatMessagesValidation, 
  validation, 
  messageController.getChatMessages.bind(messageController)
);

// Получить сообщение по ID
router.get('/:messageId', 
  auth, 
  messageIdValidation, 
  validation, 
  messageController.getMessageById.bind(messageController)
);

// Обновить сообщение
router.put('/:messageId', 
  auth, 
  messageIdValidation, 
  updateMessageValidation, 
  validation, 
  messageController.updateMessage.bind(messageController)
);

// Удалить сообщение
router.delete('/:messageId', 
  auth, 
  messageIdValidation, 
  validation, 
  messageController.deleteMessage.bind(messageController)
);

// Удалить сообщение для всех
router.delete('/:messageId/for-everyone', 
  auth, 
  messageIdValidation, 
  validation, 
  messageController.deleteMessageForEveryone.bind(messageController)
);

// Переслать сообщение
router.post('/:messageId/forward', 
  auth, 
  messageIdValidation,
  body('chatIds')
    .isArray({ min: 1, max: 10 })
    .withMessage('chatIds должен быть массивом от 1 до 10 элементов'),
  body('chatIds.*')
    .isUUID()
    .withMessage('Некорректный ID чата'),
  validation,
  messageController.forwardMessage.bind(messageController)
);

// Добавить реакцию на сообщение
router.post('/:messageId/reaction', 
  auth, 
  messageIdValidation,
  body('emoji')
    .isLength({ min: 1, max: 10 })
    .withMessage('Эмодзи должно содержать от 1 до 10 символов'),
  validation,
  messageController.addReaction.bind(messageController)
);

// Удалить реакцию с сообщения
router.delete('/:messageId/reaction', 
  auth, 
  messageIdValidation,
  body('emoji')
    .isLength({ min: 1, max: 10 })
    .withMessage('Эмодзи должно содержать от 1 до 10 символов'),
  validation,
  messageController.removeReaction.bind(messageController)
);

// Закрепить сообщение
router.post('/:messageId/pin', 
  auth, 
  messageIdValidation, 
  validation, 
  messageController.pinMessage.bind(messageController)
);

// Открепить сообщение
router.delete('/:messageId/pin', 
  auth, 
  messageIdValidation, 
  validation, 
  messageController.unpinMessage.bind(messageController)
);

// Получить закрепленные сообщения чата
router.get('/chat/:chatId/pinned', 
  auth, 
  param('chatId')
    .isUUID()
    .withMessage('Некорректный ID чата'),
  validation,
  messageController.getPinnedMessages.bind(messageController)
);

// Поиск сообщений
router.get('/', 
  auth, 
  searchMessagesValidation, 
  validation, 
  messageController.searchMessages.bind(messageController)
);

// Отметить сообщения как прочитанные
router.post('/mark-read', 
  auth, 
  body('messageIds')
    .isArray({ min: 1, max: 100 })
    .withMessage('messageIds должен быть массивом от 1 до 100 элементов'),
  body('messageIds.*')
    .isUUID()
    .withMessage('Некорректный ID сообщения'),
  validation,
  messageController.markAsRead.bind(messageController)
);

// Получить информацию о доставке сообщения
router.get('/:messageId/delivery', 
  auth, 
  messageIdValidation, 
  validation, 
  messageController.getDeliveryInfo.bind(messageController)
);

// Получить историю редактирования сообщения
router.get('/:messageId/edit-history', 
  auth, 
  messageIdValidation, 
  validation, 
  messageController.getEditHistory.bind(messageController)
);

export default router;