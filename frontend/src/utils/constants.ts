// API конфигурация
export const API_CONFIG = {
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://api.messenger.com' 
    : 'http://localhost:3001',
  SOCKET_URL: process.env.NODE_ENV === 'production'
    ? 'https://api.messenger.com'
    : 'http://localhost:3001',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
} as const;

// API эндпоинты
export const API_ENDPOINTS = {
  // Авторизация
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    VERIFY_EMAIL: '/api/auth/verify-email',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password'
  },
  
  // Пользователи
  USERS: {
    PROFILE: '/api/users/profile',
    UPDATE_PROFILE: '/api/users/profile',
    SEARCH: '/api/users/search',
    GET_BY_ID: (id: string) => `/api/users/${id}`,
    UPDATE_STATUS: '/api/users/status',
    UPLOAD_AVATAR: '/api/users/avatar'
  },
  
  // Чаты
  CHATS: {
    LIST: '/api/chats',
    CREATE: '/api/chats',
    GET_BY_ID: (id: string) => `/api/chats/${id}`,
    UPDATE: (id: string) => `/api/chats/${id}`,
    DELETE: (id: string) => `/api/chats/${id}`,
    MEMBERS: (id: string) => `/api/chats/${id}/members`,
    ADD_MEMBER: (id: string) => `/api/chats/${id}/members`,
    REMOVE_MEMBER: (id: string, userId: string) => `/api/chats/${id}/members/${userId}`,
    LEAVE: (id: string) => `/api/chats/${id}/leave`
  },
  
  // Сообщения
  MESSAGES: {
    LIST: (chatId: string) => `/api/messages?chatId=${chatId}`,
    SEND: '/api/messages',
    GET_BY_ID: (id: string) => `/api/messages/${id}`,
    UPDATE: (id: string) => `/api/messages/${id}`,
    DELETE: (id: string) => `/api/messages/${id}`,
    MARK_READ: (id: string) => `/api/messages/${id}/read`,
    SEARCH: '/api/messages/search'
  },
  
  // Друзья
  FRIENDS: {
    LIST: '/api/friends',
    REQUESTS: '/api/friends/requests',
    SEND_REQUEST: '/api/friends/requests',
    ACCEPT_REQUEST: (id: string) => `/api/friends/requests/${id}/accept`,
    DECLINE_REQUEST: (id: string) => `/api/friends/requests/${id}/decline`,
    REMOVE: (id: string) => `/api/friends/${id}`,
    SEARCH: '/api/friends/search'
  },
  
  // Звонки
  CALLS: {
    INITIATE: '/api/calls/initiate',
    ACCEPT: (id: string) => `/api/calls/${id}/accept`,
    DECLINE: (id: string) => `/api/calls/${id}/decline`,
    END: (id: string) => `/api/calls/${id}/end`,
    HISTORY: '/api/calls/history',
    CONFERENCE: '/api/calls/conference'
  },
  
  // Файлы
  FILES: {
    UPLOAD: '/api/files/upload',
    DOWNLOAD: (id: string) => `/api/files/${id}`,
    DELETE: (id: string) => `/api/files/${id}`
  },
  
  // Уведомления
  NOTIFICATIONS: {
    LIST: '/api/notifications',
    MARK_READ: (id: string) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: '/api/notifications/read-all',
    SETTINGS: '/api/notifications/settings'
  }
} as const;

// WebSocket события
export const SOCKET_EVENTS = {
  // Подключение
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',
  RECONNECT_ERROR: 'reconnect_error',
  CONNECT_ERROR: 'connect_error',
  
  // Сообщения
  MESSAGE_SEND: 'message:send',
  MESSAGE_RECEIVE: 'message:receive',
  MESSAGE_SENT: 'message:sent',
  MESSAGE_UPDATED: 'message:updated',
  MESSAGE_DELETED: 'message:deleted',
  
  // Чаты
  CHAT_JOIN: 'chat:join',
  CHAT_LEAVE: 'chat:leave',
  CHAT_CREATED: 'chat:created',
  CHAT_UPDATED: 'chat:updated',
  
  // Пользователи
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  USER_TYPING_START: 'user:typing:start',
  USER_TYPING_STOP: 'user:typing:stop',
  USER_TYPING: 'user:typing',
  
  // Звонки
  CALL_INITIATE: 'call:initiate',
  CALL_INCOMING: 'call:incoming',
  CALL_ACCEPTED: 'call:accepted',
  CALL_DECLINED: 'call:declined',
  CALL_ENDED: 'call:ended',
  
  // WebRTC
  WEBRTC_OFFER: 'webrtc:offer',
  WEBRTC_ANSWER: 'webrtc:answer',
  WEBRTC_ICE_CANDIDATE: 'webrtc:ice-candidate',
  
  // Демонстрация экрана
  SCREEN_SHARE_START: 'screen:share:start',
  SCREEN_SHARE_STOP: 'screen:share:stop',
  
  // Друзья
  FRIEND_REQUEST_RECEIVED: 'friend:request:received',
  FRIEND_REQUEST_ACCEPTED: 'friend:request:accepted',
  FRIEND_REQUEST_DECLINED: 'friend:request:declined',
  
  // Уведомления
  NOTIFICATION_NEW: 'notification:new',
  
  // Ошибки
  ERROR: 'error'
} as const;

// Типы сообщений
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  AUDIO: 'audio',
  VIDEO: 'video',
  SYSTEM: 'system'
} as const;

// Статусы пользователей
export const USER_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  AWAY: 'away',
  BUSY: 'busy'
} as const;

// Типы чатов
export const CHAT_TYPES = {
  PRIVATE: 'private',
  GROUP: 'group',
  CHANNEL: 'channel'
} as const;

// Роли в чатах
export const CHAT_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  MEMBER: 'member'
} as const;

// Типы звонков
export const CALL_TYPES = {
  AUDIO: 'audio',
  VIDEO: 'video',
  CONFERENCE: 'conference'
} as const;

// Состояния звонков
export const CALL_STATES = {
  IDLE: 'idle',
  CALLING: 'calling',
  RINGING: 'ringing',
  CONNECTED: 'connected',
  ENDED: 'ended',
  DECLINED: 'declined',
  FAILED: 'failed'
} as const;

// Типы файлов
export const FILE_TYPES = {
  IMAGE: 'image',
  DOCUMENT: 'document',
  AUDIO: 'audio',
  VIDEO: 'video',
  ARCHIVE: 'archive',
  OTHER: 'other'
} as const;

// Размеры файлов (в байтах)
export const FILE_SIZE_LIMITS = {
  AVATAR: 2 * 1024 * 1024, // 2MB
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 20 * 1024 * 1024, // 20MB
  AUDIO: 10 * 1024 * 1024, // 10MB
  VIDEO: 50 * 1024 * 1024, // 50MB
  GENERAL: 10 * 1024 * 1024 // 10MB
} as const;

// Поддерживаемые форматы файлов
export const SUPPORTED_FILE_FORMATS = {
  IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'],
  DOCUMENT: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'],
  AUDIO: ['mp3', 'wav', 'ogg', 'flac', 'm4a'],
  VIDEO: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
  ARCHIVE: ['zip', 'rar', '7z', 'tar', 'gz']
} as const;

// MIME типы
export const MIME_TYPES = {
  // Изображения
  'image/jpeg': FILE_TYPES.IMAGE,
  'image/jpg': FILE_TYPES.IMAGE,
  'image/png': FILE_TYPES.IMAGE,
  'image/gif': FILE_TYPES.IMAGE,
  'image/webp': FILE_TYPES.IMAGE,
  'image/bmp': FILE_TYPES.IMAGE,
  
  // Документы
  'application/pdf': FILE_TYPES.DOCUMENT,
  'application/msword': FILE_TYPES.DOCUMENT,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FILE_TYPES.DOCUMENT,
  'application/vnd.ms-excel': FILE_TYPES.DOCUMENT,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FILE_TYPES.DOCUMENT,
  'text/plain': FILE_TYPES.DOCUMENT,
  
  // Аудио
  'audio/mpeg': FILE_TYPES.AUDIO,
  'audio/wav': FILE_TYPES.AUDIO,
  'audio/ogg': FILE_TYPES.AUDIO,
  'audio/flac': FILE_TYPES.AUDIO,
  'audio/mp4': FILE_TYPES.AUDIO,
  
  // Видео
  'video/mp4': FILE_TYPES.VIDEO,
  'video/avi': FILE_TYPES.VIDEO,
  'video/quicktime': FILE_TYPES.VIDEO,
  'video/x-msvideo': FILE_TYPES.VIDEO,
  'video/webm': FILE_TYPES.VIDEO,
  
  // Архивы
  'application/zip': FILE_TYPES.ARCHIVE,
  'application/x-rar-compressed': FILE_TYPES.ARCHIVE,
  'application/x-7z-compressed': FILE_TYPES.ARCHIVE
} as const;

// Уровни логирования
export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal'
} as const;

// Темы оформления
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
} as const;

// Языки интерфейса
export const LANGUAGES = {
  RU: 'ru',
  EN: 'en',
  DE: 'de',
  FR: 'fr',
  ES: 'es'
} as const;

// Настройки уведомлений
export const NOTIFICATION_SETTINGS = {
  TYPES: {
    MESSAGE: 'message',
    FRIEND_REQUEST: 'friend_request',
    CALL: 'call',
    SYSTEM: 'system'
  },
  METHODS: {
    PUSH: 'push',
    EMAIL: 'email',
    SOUND: 'sound'
  }
} as const;

// Настройки конфиденциальности
export const PRIVACY_SETTINGS = {
  WHO_CAN: {
    EVERYONE: 'everyone',
    FRIENDS: 'friends',
    NOBODY: 'nobody'
  },
  SETTINGS: {
    SEE_ONLINE_STATUS: 'see_online_status',
    SEE_LAST_SEEN: 'see_last_seen',
    SEND_MESSAGES: 'send_messages',
    ADD_TO_GROUPS: 'add_to_groups',
    CALL: 'call'
  }
} as const;

// Debounce задержки
export const DEBOUNCE_DELAYS = {
  SEARCH: 300,
  INPUT: 500,
  TYPING: 1000,
  RESIZE: 250,
  SCROLL: 100,
  API_CALL: 500,
  AUTO_SAVE: 2000
} as const;

// Таймауты
export const TIMEOUTS = {
  TYPING_INDICATOR: 3000,
  TOAST_NOTIFICATION: 5000,
  IDLE_TIMEOUT: 15 * 60 * 1000, // 15 минут
  TOKEN_REFRESH: 5 * 60 * 1000, // 5 минут до истечения
  RECONNECT_DELAY: 1000,
  CALL_TIMEOUT: 30000 // 30 секунд
} as const;

// Лимиты
export const LIMITS = {
  MESSAGE_LENGTH: 4000,
  CHAT_NAME_LENGTH: 100,
  USERNAME_LENGTH: 30,
  DISPLAY_NAME_LENGTH: 50,
  BIO_LENGTH: 500,
  SEARCH_RESULTS: 50,
  MESSAGES_PER_PAGE: 50,
  CHATS_PER_PAGE: 20,
  MAX_GROUP_MEMBERS: 200,
  MAX_FILE_UPLOADS: 10
} as const;

// Валидация
export const VALIDATION_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  USERNAME: /^[a-zA-Z0-9._-]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
} as const;

// Клавиши клавиатуры
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  SPACE: ' ',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  TAB: 'Tab',
  BACKSPACE: 'Backspace',
  DELETE: 'Delete',
  HOME: 'Home',
  END: 'End'
} as const;

// Коды клавиш
export const KEY_CODES = {
  ENTER: 13,
  ESCAPE: 27,
  SPACE: 32,
  ARROW_UP: 38,
  ARROW_DOWN: 40,
  ARROW_LEFT: 37,
  ARROW_RIGHT: 39,
  TAB: 9,
  BACKSPACE: 8,
  DELETE: 46
} as const;

// Размеры экранов (Tailwind breakpoints)
export const SCREEN_SIZES = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536
} as const;

// Z-index уровни
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  NOTIFICATION: 1080,
  MAXIMUM: 9999
} as const;

// Анимации
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 200,
  SLOW: 300,
  SLOWER: 500
} as const;

// Цвета статусов
export const STATUS_COLORS = {
  [USER_STATUS.ONLINE]: '#10B981', // green-500
  [USER_STATUS.AWAY]: '#F59E0B',   // yellow-500  
  [USER_STATUS.BUSY]: '#EF4444',   // red-500
  [USER_STATUS.OFFLINE]: '#6B7280' // gray-500
} as const;

// Иконки статусов
export const STATUS_ICONS = {
  [USER_STATUS.ONLINE]: '🟢',
  [USER_STATUS.AWAY]: '🟡',
  [USER_STATUS.BUSY]: '🔴',
  [USER_STATUS.OFFLINE]: '⚫'
} as const;

// WebRTC конфигурация
export const WEBRTC_CONFIG = {
  ICE_SERVERS: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    {
      urls: 'turn:numb.viagenie.ca',
      credential: 'muazkh',
      username: 'webrtc@live.com'
    }
  ],
  ICE_CANDIDATE_POOL_SIZE: 10,
  ICE_TRANSPORT_POLICY: 'all' as RTCIceTransportPolicy
} as const;

// Медиа ограничения
export const MEDIA_CONSTRAINTS = {
  AUDIO: {
    DEFAULT: {
      audio: true,
      video: false
    },
    HIGH_QUALITY: {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: false
    }
  },
  VIDEO: {
    DEFAULT: {
      audio: true,
      video: true
    },
    HD: {
      audio: true,
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      }
    },
    MOBILE: {
      audio: true,
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 24 }
      }
    }
  },
  SCREEN_SHARE: {
    video: {
      cursor: 'always' as const,
      displaySurface: 'monitor' as const
    },
    audio: true
  }
} as const;

// Звуковые файлы
export const SOUND_FILES = {
  NOTIFICATION: '/sounds/notification.mp3',
  MESSAGE: '/sounds/message.mp3',
  CALL_INCOMING: '/sounds/call-incoming.mp3',
  CALL_OUTGOING: '/sounds/call-outgoing.mp3',
  CALL_END: '/sounds/call-end.mp3',
  TYPING: '/sounds/typing.mp3',
  SUCCESS: '/sounds/success.mp3',
  ERROR: '/sounds/error.mp3'
} as const;

// Эмодзи категории
export const EMOJI_CATEGORIES = {
  RECENT: 'recent',
  PEOPLE: 'people',
  NATURE: 'nature',
  FOOD: 'food',
  ACTIVITY: 'activity',
  TRAVEL: 'travel',
  OBJECTS: 'objects',
  SYMBOLS: 'symbols',
  FLAGS: 'flags'
} as const;

// Частые эмодзи
export const COMMON_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
  '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
  '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
  '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
  '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
  '👍', '👎', '👌', '🤘', '🤞', '✌️', '👋', '🤚',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍'
] as const;

// Регионы и часовые пояса
export const TIME_ZONES = {
  'Europe/Moscow': 'Москва (MSK)',
  'Europe/London': 'Лондон (GMT)',
  'America/New_York': 'Нью-Йорк (EST)',
  'America/Los_Angeles': 'Лос-Анджелес (PST)',
  'Asia/Tokyo': 'Токио (JST)',
  'Asia/Shanghai': 'Шанхай (CST)',
  'Australia/Sydney': 'Сидней (AEST)'
} as const;

// Форматы даты
export const DATE_FORMATS = {
  FULL: 'full',
  LONG: 'long',
  MEDIUM: 'medium',
  SHORT: 'short',
  TIME_ONLY: 'time',
  DATE_ONLY: 'date',
  RELATIVE: 'relative',
  MESSAGE: 'message'
} as const;

// Настройки локализации
export const LOCALE_SETTINGS = {
  DEFAULT_LOCALE: 'ru-RU',
  DEFAULT_TIMEZONE: 'Europe/Moscow',
  DEFAULT_DATE_FORMAT: DATE_FORMATS.MEDIUM,
  SUPPORTED_LOCALES: ['ru-RU', 'en-US', 'de-DE', 'fr-FR', 'es-ES']
} as const;

// Настройки производительности
export const PERFORMANCE_SETTINGS = {
  VIRTUAL_SCROLL_THRESHOLD: 100,
  IMAGE_LAZY_LOADING_THRESHOLD: 50,
  DEBOUNCE_SEARCH: 300,
  THROTTLE_SCROLL: 100,
  CACHE_TTL: 5 * 60 * 1000, // 5 минут
  MAX_CACHE_SIZE: 100
} as const;

// Настройки безопасности
export const SECURITY_SETTINGS = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 минут
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 часа
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRE_SPECIAL_CHARS: true,
  ENABLE_2FA: false
} as const;

// Метрики и аналитика
export const ANALYTICS_EVENTS = {
  // Пользовательские действия
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_REGISTER: 'user_register',
  
  // Сообщения
  MESSAGE_SENT: 'message_sent',
  MESSAGE_RECEIVED: 'message_received',
  FILE_UPLOADED: 'file_uploaded',
  
  // Звонки
  CALL_STARTED: 'call_started',
  CALL_ENDED: 'call_ended',
  CALL_DECLINED: 'call_declined',
  
  // Чаты
  CHAT_CREATED: 'chat_created',
  CHAT_JOINED: 'chat_joined',
  CHAT_LEFT: 'chat_left',
  
  // Ошибки
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',
  NETWORK_ERROR: 'network_error'
} as const;

// Коды ошибок
export const ERROR_CODES = {
  // Общие ошибки
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // Ошибки авторизации
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Ошибки валидации
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  PASSWORD_TOO_WEAK: 'PASSWORD_TOO_WEAK',
  
  // Ошибки пользователей
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  
  // Ошибки чатов
  CHAT_NOT_FOUND: 'CHAT_NOT_FOUND',
  CHAT_ACCESS_DENIED: 'CHAT_ACCESS_DENIED',
  CHAT_MEMBER_LIMIT_EXCEEDED: 'CHAT_MEMBER_LIMIT_EXCEEDED',
  
  // Ошибки файлов
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  
  // Ошибки звонков
  CALL_FAILED: 'CALL_FAILED',
  MICROPHONE_ACCESS_DENIED: 'MICROPHONE_ACCESS_DENIED',
  CAMERA_ACCESS_DENIED: 'CAMERA_ACCESS_DENIED',
  WEBRTC_NOT_SUPPORTED: 'WEBRTC_NOT_SUPPORTED'
} as const;

// Сообщения об ошибках
export const ERROR_MESSAGES = {
  [ERROR_CODES.UNKNOWN_ERROR]: 'Произошла неизвестная ошибка',
  [ERROR_CODES.NETWORK_ERROR]: 'Ошибка сети. Проверьте подключение к интернету',
  [ERROR_CODES.TIMEOUT_ERROR]: 'Превышено время ожидания запроса',
  [ERROR_CODES.UNAUTHORIZED]: 'Необходима авторизация',
  [ERROR_CODES.FORBIDDEN]: 'Недостаточно прав для выполнения действия',
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Неверный логин или пароль',
  [ERROR_CODES.TOKEN_EXPIRED]: 'Сессия истекла. Войдите заново',
  [ERROR_CODES.VALIDATION_ERROR]: 'Ошибка валидации данных',
  [ERROR_CODES.INVALID_EMAIL]: 'Некорректный email адрес',
  [ERROR_CODES.INVALID_PASSWORD]: 'Некорректный пароль',
  [ERROR_CODES.PASSWORD_TOO_WEAK]: 'Пароль слишком простой',
  [ERROR_CODES.USER_NOT_FOUND]: 'Пользователь не найден',
  [ERROR_CODES.USER_ALREADY_EXISTS]: 'Пользователь уже существует',
  [ERROR_CODES.EMAIL_ALREADY_EXISTS]: 'Email уже используется',
  [ERROR_CODES.CHAT_NOT_FOUND]: 'Чат не найден',
  [ERROR_CODES.CHAT_ACCESS_DENIED]: 'Нет доступа к чату',
  [ERROR_CODES.CHAT_MEMBER_LIMIT_EXCEEDED]: 'Превышен лимит участников чата',
  [ERROR_CODES.FILE_TOO_LARGE]: 'Файл слишком большой',
  [ERROR_CODES.UNSUPPORTED_FILE_TYPE]: 'Неподдерживаемый тип файла',
  [ERROR_CODES.UPLOAD_FAILED]: 'Ошибка загрузки файла',
  [ERROR_CODES.CALL_FAILED]: 'Не удалось совершить звонок',
  [ERROR_CODES.MICROPHONE_ACCESS_DENIED]: 'Нет доступа к микрофону',
  [ERROR_CODES.CAMERA_ACCESS_DENIED]: 'Нет доступа к камере',
  [ERROR_CODES.WEBRTC_NOT_SUPPORTED]: 'Звонки не поддерживаются в этом браузере'
} as const;

// Успешные сообщения
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Вход выполнен успешно',
  REGISTER_SUCCESS: 'Регистрация завершена успешно',
  PROFILE_UPDATED: 'Профиль обновлен',
  MESSAGE_SENT: 'Сообщение отправлено',
  FILE_UPLOADED: 'Файл загружен',
  FRIEND_REQUEST_SENT: 'Заявка в друзья отправлена',
  FRIEND_REQUEST_ACCEPTED: 'Заявка в друзья принята',
  CHAT_CREATED: 'Чат создан',
  SETTINGS_SAVED: 'Настройки сохранены',
  PASSWORD_CHANGED: 'Пароль изменен',
  EMAIL_VERIFIED: 'Email подтвержден'
} as const;

// Роуты приложения
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  CHAT: '/chat',
  CHAT_WITH_ID: (id: string) => `/chat/${id}`,
  FRIENDS: '/friends',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  CALLS: '/calls',
  CALL_WITH_ID: (id: string) => `/call/${id}`,
  NOT_FOUND: '/404'
} as const;

// Ключи для localStorage
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PROFILE: 'user_profile',
  THEME: 'theme',
  LANGUAGE: 'language',
  NOTIFICATION_SETTINGS: 'notification_settings',
  PRIVACY_SETTINGS: 'privacy_settings',
  CHAT_DRAFTS: 'chat_drafts',
  RECENT_EMOJIS: 'recent_emojis',
  CALL_SETTINGS: 'call_settings',
  ERROR_LOGS: 'app_error_logs'
} as const;

// Настройки по умолчанию
export const DEFAULT_SETTINGS = {
  THEME: THEMES.AUTO,
  LANGUAGE: LANGUAGES.RU,
  NOTIFICATIONS: {
    [NOTIFICATION_SETTINGS.TYPES.MESSAGE]: true,
    [NOTIFICATION_SETTINGS.TYPES.FRIEND_REQUEST]: true,
    [NOTIFICATION_SETTINGS.TYPES.CALL]: true,
    [NOTIFICATION_SETTINGS.TYPES.SYSTEM]: false
  },
  PRIVACY: {
    [PRIVACY_SETTINGS.SETTINGS.SEE_ONLINE_STATUS]: PRIVACY_SETTINGS.WHO_CAN.FRIENDS,
    [PRIVACY_SETTINGS.SETTINGS.SEE_LAST_SEEN]: PRIVACY_SETTINGS.WHO_CAN.FRIENDS,
    [PRIVACY_SETTINGS.SETTINGS.SEND_MESSAGES]: PRIVACY_SETTINGS.WHO_CAN.EVERYONE,
    [PRIVACY_SETTINGS.SETTINGS.ADD_TO_GROUPS]: PRIVACY_SETTINGS.WHO_CAN.FRIENDS,
    [PRIVACY_SETTINGS.SETTINGS.CALL]: PRIVACY_SETTINGS.WHO_CAN.FRIENDS
  },
  AUDIO: {
    VOLUME: 0.7,
    ENABLE_NOTIFICATIONS: true,
    ENABLE_CALL_SOUNDS: true,
    ENABLE_MESSAGE_SOUNDS: true
  }
} as const;

// Экспорт всех констант как единый объект для удобства импорта
export const CONSTANTS = {
  API_CONFIG,
  API_ENDPOINTS,
  SOCKET_EVENTS,
  MESSAGE_TYPES,
  USER_STATUS,
  CHAT_TYPES,
  CHAT_ROLES,
  CALL_TYPES,
  CALL_STATES,
  FILE_TYPES,
  FILE_SIZE_LIMITS,
  SUPPORTED_FILE_FORMATS,
  MIME_TYPES,
  LOG_LEVELS,
  THEMES,
  LANGUAGES,
  NOTIFICATION_SETTINGS,
  PRIVACY_SETTINGS,
  DEBOUNCE_DELAYS,
  TIMEOUTS,
  LIMITS,
  VALIDATION_PATTERNS,
  KEYBOARD_KEYS,
  KEY_CODES,
  SCREEN_SIZES,
  Z_INDEX,
  ANIMATION_DURATION,
  STATUS_COLORS,
  STATUS_ICONS,
  WEBRTC_CONFIG,
  MEDIA_CONSTRAINTS,
  SOUND_FILES,
  EMOJI_CATEGORIES,
  COMMON_EMOJIS,
  TIME_ZONES,
  DATE_FORMATS,
  LOCALE_SETTINGS,
  PERFORMANCE_SETTINGS,
  SECURITY_SETTINGS,
  ANALYTICS_EVENTS,
  ERROR_CODES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ROUTES,
  STORAGE_KEYS,
  DEFAULT_SETTINGS
} as const;