import { Router } from 'express';
import { CallController } from '../controllers/CallController';
import { auth } from '../middleware/auth';
import { validation } from '../middleware/validation';
import { body, query, param } from 'express-validator';

const router = Router();
const callController = new CallController();

// Валидация для инициации звонка
const initiateCallValidation = [
  body('recipientId')
    .optional()
    .isUUID()
    .withMessage('Некорректный ID получателя'),
  body('chatId')
    .optional()
    .isUUID()
    .withMessage('Некорректный ID чата'),
  body('type')
    .isIn(['audio', 'video'])
    .withMessage('Тип звонка должен быть audio или video'),
  body('isGroup')
    .optional()
    .isBoolean()
    .withMessage('isGroup должно быть boolean')
];

// Валидация ID звонка
const callIdValidation = [
  param('callId')
    .isUUID()
    .withMessage('Некорректный ID звонка')
];

// Валидация для создания конференции
const createConferenceValidation = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Название конференции должно содержать от 1 до 100 символов')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Описание конференции не должно превышать 500 символов')
    .trim(),
  body('participants')
    .isArray({ min: 1, max: 50 })
    .withMessage('Участники должны быть массивом от 1 до 50 элементов'),
  body('participants.*')
    .isUUID()
    .withMessage('Некорректный ID участника'),
  body('isVideoEnabled')
    .optional()
    .isBoolean()
    .withMessage('isVideoEnabled должно быть boolean'),
  body('isRecorded')
    .optional()
    .isBoolean()
    .withMessage('isRecorded должно быть boolean'),
  body('maxParticipants')
    .optional()
    .isInt({ min: 2, max: 100 })
    .withMessage('Максимальное количество участников должно быть от 2 до 100'),
  body('scheduledAt')
    .optional()
    .isISO8601()
    .withMessage('Некорректная дата запланированного звонка')
];

// Валидация для присоединения к конференции
const joinConferenceValidation = [
  body('password')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Пароль должен содержать от 1 до 50 символов')
];

// Инициировать звонок
router.post('/initiate', 
  auth, 
  initiateCallValidation, 
  validation, 
  callController.initiateCall.bind(callController)
);

// Принять звонок
router.post('/:callId/accept', 
  auth, 
  callIdValidation, 
  validation, 
  callController.acceptCall.bind(callController)
);

// Отклонить звонок
router.post('/:callId/decline', 
  auth, 
  callIdValidation, 
  body('reason')
    .optional()
    .isIn(['busy', 'declined', 'no_answer'])
    .withMessage('Некорректная причина отклонения'),
  validation,
  callController.declineCall.bind(callController)
);

// Завершить звонок
router.post('/:callId/end', 
  auth, 
  callIdValidation, 
  validation, 
  callController.endCall.bind(callController)
);

// Поставить звонок на паузу
router.post('/:callId/hold', 
  auth, 
  callIdValidation, 
  validation, 
  callController.holdCall.bind(callController)
);

// Снять звонок с паузы
router.post('/:callId/unhold', 
  auth, 
  callIdValidation, 
  validation, 
  callController.unholdCall.bind(callController)
);

// Отключить/включить микрофон
router.post('/:callId/mute', 
  auth, 
  callIdValidation,
  body('isMuted')
    .isBoolean()
    .withMessage('isMuted должно быть boolean'),
  validation,
  callController.toggleMute.bind(callController)
);

// Отключить/включить видео
router.post('/:callId/video', 
  auth, 
  callIdValidation,
  body('isVideoEnabled')
    .isBoolean()
    .withMessage('isVideoEnabled должно быть boolean'),
  validation,
  callController.toggleVideo.bind(callController)
);

// Начать демонстрацию экрана
router.post('/:callId/screen-share/start', 
  auth, 
  callIdValidation, 
  validation, 
  callController.startScreenShare.bind(callController)
);

// Остановить демонстрацию экрана
router.post('/:callId/screen-share/stop', 
  auth, 
  callIdValidation, 
  validation, 
  callController.stopScreenShare.bind(callController)
);

// Получить информацию о звонке
router.get('/:callId', 
  auth, 
  callIdValidation, 
  validation, 
  callController.getCallInfo.bind(callController)
);

// Получить историю звонков
router.get('/', 
  auth, 
  query('type')
    .optional()
    .isIn(['all', 'missed', 'incoming', 'outgoing'])
    .withMessage('Некорректный тип истории звонков'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Номер страницы должен быть положительным числом'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Лимит должен быть числом от 1 до 50'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Некорректная начальная дата'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Некорректная конечная дата'),
  validation,
  callController.getCallHistory.bind(callController)
);

// Создать конференцию
router.post('/conference', 
  auth, 
  createConferenceValidation, 
  validation, 
  callController.createConference.bind(callController)
);

// Получить информацию о конференции
router.get('/conference/:conferenceId', 
  auth, 
  param('conferenceId')
    .isUUID()
    .withMessage('Некорректный ID конференции'),
  validation,
  callController.getConferenceInfo.bind(callController)
);

// Присоединиться к конференции
router.post('/conference/:conferenceId/join', 
  auth, 
  param('conferenceId')
    .isUUID()
    .withMessage('Некорректный ID конференции'),
  joinConferenceValidation,
  validation,
  callController.joinConference.bind(callController)
);

// Покинуть конференцию
router.post('/conference/:conferenceId/leave', 
  auth, 
  param('conferenceId')
    .isUUID()
    .withMessage('Некорректный ID конференции'),
  validation,
  callController.leaveConference.bind(callController)
);

// Пригласить участника в конференцию
router.post('/conference/:conferenceId/invite', 
  auth, 
  param('conferenceId')
    .isUUID()
    .withMessage('Некорректный ID конференции'),
  body('participantId')
    .isUUID()
    .withMessage('Некорректный ID участника'),
  validation,
  callController.inviteToConference.bind(callController)
);

// Удалить участника из конференции
router.delete('/conference/:conferenceId/participants/:participantId', 
  auth, 
  param('conferenceId')
    .isUUID()
    .withMessage('Некорректный ID конференции'),
  param('participantId')
    .isUUID()
    .withMessage('Некорректный ID участника'),
  validation,
  callController.removeFromConference.bind(callController)
);

// Получить участников конференции
router.get('/conference/:conferenceId/participants', 
  auth, 
  param('conferenceId')
    .isUUID()
    .withMessage('Некорректный ID конференции'),
  validation,
  callController.getConferenceParticipants.bind(callController)
);

// Начать запись конференции
router.post('/conference/:conferenceId/recording/start', 
  auth, 
  param('conferenceId')
    .isUUID()
    .withMessage('Некорректный ID конференции'),
  validation,
  callController.startRecording.bind(callController)
);

// Остановить запись конференции
router.post('/conference/:conferenceId/recording/stop', 
  auth, 
  param('conferenceId')
    .isUUID()
    .withMessage('Некорректный ID конференции'),
  validation,
  callController.stopRecording.bind(callController)
);

// Получить записи конференции
router.get('/conference/:conferenceId/recordings', 
  auth, 
  param('conferenceId')
    .isUUID()
    .withMessage('Некорректный ID конференции'),
  validation,
  callController.getRecordings.bind(callController)
);

// Заблокировать/разблокировать конференцию
router.post('/conference/:conferenceId/lock', 
  auth, 
  param('conferenceId')
    .isUUID()
    .withMessage('Некорректный ID конференции'),
  body('isLocked')
    .isBoolean()
    .withMessage('isLocked должно быть boolean'),
  validation,
  callController.toggleConferenceLock.bind(callController)
);

// Установить пароль для конференции
router.post('/conference/:conferenceId/password', 
  auth, 
  param('conferenceId')
    .isUUID()
    .withMessage('Некорректный ID конференции'),
  body('password')
    .optional()
    .isLength({ min: 4, max: 50 })
    .withMessage('Пароль должен содержать от 4 до 50 символов'),
  validation,
  callController.setConferencePassword.bind(callController)
);

// Получить статистику звонков
router.get('/stats/summary', 
  auth, 
  query('period')
    .optional()
    .isIn(['day', 'week', 'month', 'year'])
    .withMessage('Некорректный период статистики'),
  validation,
  callController.getCallStats.bind(callController)
);

// Отправить отчет о проблеме со звонком
router.post('/:callId/report', 
  auth, 
  callIdValidation,
  body('issue')
    .isIn(['audio_quality', 'video_quality', 'connection', 'other'])
    .withMessage('Некорректный тип проблемы'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Описание не должно превышать 1000 символов')
    .trim(),
  validation,
  callController.reportCallIssue.bind(callController)
);

export default router;