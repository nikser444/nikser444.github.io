import { Router } from 'express';
import { FriendController } from '../controllers/FriendController';
import { auth } from '../middleware/auth';
import { validation } from '../middleware/validation';
import { body, query, param } from 'express-validator';

const router = Router();
const friendController = new FriendController();

// Валидация для отправки заявки в друзья
const sendFriendRequestValidation = [
  body('recipientId')
    .optional()
    .isUUID()
    .withMessage('Некорректный ID получателя'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Некорректный email')
    .normalizeEmail(),
  body('username')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('Имя пользователя должно содержать от 3 до 20 символов'),
  body('message')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Сообщение не должно превышать 500 символов')
    .trim()
];

// Валидация ID заявки в друзья
const friendRequestIdValidation = [
  param('requestId')
    .isUUID()
    .withMessage('Некорректный ID заявки в друзья')
];

// Валидация ID друга
const friendIdValidation = [
  param('friendId')
    .isUUID()
    .withMessage('Некорректный ID друга')
];

// Валидация для поиска друзей
const searchFriendsValidation = [
  query('q')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Поисковый запрос должен содержать от 1 до 50 символов')
    .trim(),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Номер страницы должен быть положительным числом'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Лимит должен быть числом от 1 до 50')
];

// Получить список друзей
router.get('/', 
  auth, 
  searchFriendsValidation, 
  validation, 
  friendController.getFriends.bind(friendController)
);

// Отправить заявку в друзья
router.post('/request', 
  auth, 
  sendFriendRequestValidation, 
  validation, 
  friendController.sendFriendRequest.bind(friendController)
);

// Получить входящие заявки в друзья
router.get('/requests/incoming', 
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
  friendController.getIncomingFriendRequests.bind(friendController)
);

// Получить исходящие заявки в друзья
router.get('/requests/outgoing', 
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
  friendController.getOutgoingFriendRequests.bind(friendController)
);

// Принять заявку в друзья
router.post('/requests/:requestId/accept', 
  auth, 
  friendRequestIdValidation, 
  validation, 
  friendController.acceptFriendRequest.bind(friendController)
);

// Отклонить заявку в друзья
router.post('/requests/:requestId/decline', 
  auth, 
  friendRequestIdValidation, 
  validation, 
  friendController.declineFriendRequest.bind(friendController)
);

// Отменить отправленную заявку в друзья
router.delete('/requests/:requestId', 
  auth, 
  friendRequestIdValidation, 
  validation, 
  friendController.cancelFriendRequest.bind(friendController)
);

// Удалить из друзей
router.delete('/:friendId', 
  auth, 
  friendIdValidation, 
  validation, 
  friendController.removeFriend.bind(friendController)
);

// Заблокировать друга
router.post('/:friendId/block', 
  auth, 
  friendIdValidation, 
  validation, 
  friendController.blockFriend.bind(friendController)
);

// Разблокировать друга
router.delete('/:friendId/block', 
  auth, 
  friendIdValidation, 
  validation, 
  friendController.unblockFriend.bind(friendController)
);

// Получить информацию о дружбе
router.get('/:friendId/info', 
  auth, 
  friendIdValidation, 
  validation, 
  friendController.getFriendshipInfo.bind(friendController)
);

// Получить взаимных друзей
router.get('/:friendId/mutual', 
  auth, 
  friendIdValidation,
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Номер страницы должен быть положительным числом'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Лимит должен быть числом от 1 до 50'),
  validation,
  friendController.getMutualFriends.bind(friendController)
);

// Получить предложения друзей
router.get('/suggestions', 
  auth, 
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Лимит должен быть числом от 1 до 20'),
  validation,
  friendController.getFriendSuggestions.bind(friendController)
);

// Скрыть предложение друга
router.post('/suggestions/:userId/hide', 
  auth, 
  param('userId')
    .isUUID()
    .withMessage('Некорректный ID пользователя'),
  validation,
  friendController.hideFriendSuggestion.bind(friendController)
);

// Добавить друга в избранные
router.post('/:friendId/favorite', 
  auth, 
  friendIdValidation, 
  validation, 
  friendController.addToFavorites.bind(friendController)
);

// Удалить друга из избранных
router.delete('/:friendId/favorite', 
  auth, 
  friendIdValidation, 
  validation, 
  friendController.removeFromFavorites.bind(friendController)
);

// Получить избранных друзей
router.get('/favorites', 
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
  friendController.getFavoriteFriends.bind(friendController)
);

// Получить онлайн друзей
router.get('/online', 
  auth, 
  friendController.getOnlineFriends.bind(friendController)
);

// Найти друзей по контактам
router.post('/find-by-contacts', 
  auth, 
  body('contacts')
    .isArray({ min: 1, max: 100 })
    .withMessage('contacts должен быть массивом от 1 до 100 элементов'),
  body('contacts.*')
    .isObject()
    .withMessage('Каждый контакт должен быть объектом'),
  body('contacts.*.name')
    .optional()
    .isString()
    .withMessage('Имя контакта должно быть строкой'),
  body('contacts.*.phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Некорректный номер телефона'),
  body('contacts.*.email')
    .optional()
    .isEmail()
    .withMessage('Некорректный email'),
  validation,
  friendController.findFriendsByContacts.bind(friendController)
);

// Импортировать друзей из социальных сетей
router.post('/import/:provider', 
  auth, 
  param('provider')
    .isIn(['facebook', 'google', 'twitter', 'vk'])
    .withMessage('Некорректный провайдер социальной сети'),
  body('accessToken')
    .notEmpty()
    .withMessage('Токен доступа обязателен'),
  validation,
  friendController.importFromSocialNetwork.bind(friendController)
);

// Получить статистику друзей
router.get('/stats', 
  auth, 
  friendController.getFriendsStats.bind(friendController)
);

export default router;