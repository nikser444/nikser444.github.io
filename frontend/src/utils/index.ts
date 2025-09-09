// Экспорт всех утилит из одного места для удобного импорта

// Socket утилиты
export {
  socketManager,
  connectSocket,
  disconnectSocket,
  isSocketConnected,
  getSocket
} from './socket';

// WebRTC утилиты
export {
  webrtcManager,
  isWebRTCSupported,
  isScreenShareSupported
} from './webrtc';
export type {
  WebRTCConfig,
  MediaConstraints,
  CallState
} from './webrtc';

// Валидация
export {
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateUsername,
  validateDisplayName,
  validateMessageContent,
  validateChatName,
  validateFile,
  validateImageFile,
  validateAvatar,
  validateDocumentFile,
  validateUrl,
  validatePhoneNumber,
  validateAge,
  validateForm,
  validateMultiple,
  sanitizeInput,
  sanitizeHtml,
  VALIDATION_RULES
} from './validation';
export type {
  ValidationResult,
  PasswordValidationOptions,
  FileValidationOptions
} from './validation';

// Форматирование
export {
  formatDate,
  formatFileSize,
  formatPhoneNumber,
  formatUsername,
  formatFullName,
  truncateText,
  formatMemberCount,
  formatMessageCount,
  formatUnreadCount,
  formatCallDuration,
  formatUserStatus,
  formatFileType,
  formatAddress,
  formatPercentage,
  formatCurrency,
  formatNumber,
  formatNamesList,
  formatUrlForDisplay,
  formatTimeUntil,
  formatDataUsage,
  formatSpeed,
  formatIPAddress,
  formatVersion,
  formatHash,
  formatSearchQuery,
  formatTags,
  formatTemperature,
  formatRating,
  maskPassword,
  formatCardNumber,
  formatOrderNumber,
  capitalize,
  toCamelCase,
  toKebabCase,
  formatJSON,
  extractEmailDomain,
  formatNotificationMessage,
  formatStats,
  formatOnlineTime,
  FORMAT_CONSTANTS
} from './formatters';
export type {
  DateFormatType,
  FormatOptions
} from './formatters';

// Debounce утилиты
export {
  debounce,
  simpleDebounce,
  createSearchDebounce,
  createInputDebounce,
  createButtonDebounce,
  createScrollDebounce,
  createResizeDebounce,
  throttle,
  debouncePromise,
  GroupDebouncer,
  useAutoCleanupDebounce,
  DEBOUNCE_DELAYS,
  presetDebouncers
} from './debounce';
export type {
  DebounceFunction,
  DebounceOptions,
  DebouncedFunction
} from './debounce';

// Логирование
export {
  logger,
  authLogger,
  apiLogger,
  socketLogger,
  webrtcLogger,
  uiLogger,
  logError,
  logInfo,
  logDebug,
  logWarn,
  logMethod,
  logPerformance,
  LOG_LEVELS
} from './logger';
export type {
  LogLevel,
  LogEntry,
  LoggerConfig,
  LogContext
} from './logger';

// Аудио утилиты
export {
  audioManager,
  playNotification,
  playMessage,
  playIncomingCall,
  playOutgoingCall,
  stopAllSounds,
  setVolume,
  getVolume
} from './audio';
export type {
  AudioConfig,
  NotificationSoundOptions
} from './audio';

// CSS классы
export {
  cn,
  conditionalClass,
  mergeClasses,
  createVariantClassNames,
  stateClasses,
  tailwindUtils,
  animationClasses,
  responsiveUtils,
  colorUtils,
  messengerClasses,
  formClasses,
  composeClasses,
  createConditionalClasses,
  debugUtils,
  classUtils
} from './cn';

// Константы
export {
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
  THEMES,
  LANGUAGES,
  NOTIFICATION_SETTINGS,
  PRIVACY_SETTINGS,
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
  DEFAULT_SETTINGS,
  CONSTANTS
} from './constants';

// Комбинированные утилиты для частых случаев использования
export const utils = {
  // Форматирование
  format: {
    date: formatDate,
    fileSize: formatFileSize,
    phone: formatPhoneNumber,
    username: formatUsername,
    fullName: formatFullName,
    truncate: truncateText,
    memberCount: formatMemberCount,
    messageCount: formatMessageCount,
    unreadCount: formatUnreadCount,
    callDuration: formatCallDuration,
    userStatus: formatUserStatus
  },
  
  // Валидация
  validate: {
    email: validateEmail,
    password: validatePassword,
    username: validateUsername,
    displayName: validateDisplayName,
    message: validateMessageContent,
    chatName: validateChatName,
    file: validateFile,
    image: validateImageFile,
    avatar: validateAvatar
  },
  
  // Классы
  classes: {
    cn,
    conditional: conditionalClass,
    merge: mergeClasses,
    state: stateClasses,
    tailwind: tailwindUtils,
    animation: animationClasses,
    responsive: responsiveUtils,
    color: colorUtils,
    messenger: messengerClasses,
    form: formClasses
  },
  
  // Debounce
  debounce: {
    create: debounce,
    simple: simpleDebounce,
    search: createSearchDebounce,
    input: createInputDebounce,
    button: createButtonDebounce,
    scroll: createScrollDebounce,
    resize: createResizeDebounce,
    throttle: throttle,
    promise: debouncePromise
  },
  
  // Аудио
  audio: {
    manager: audioManager,
    notification: playNotification,
    message: playMessage,
    incomingCall: playIncomingCall,
    outgoingCall: playOutgoingCall,
    stopAll: stopAllSounds,
    setVolume,
    getVolume
  },
  
  // Сокеты
  socket: {
    manager: socketManager,
    connect: connectSocket,
    disconnect: disconnectSocket,
    isConnected: isSocketConnected,
    get: getSocket
  },
  
  // WebRTC
  webrtc: {
    manager: webrtcManager,
    isSupported: isWebRTCSupported,
    isScreenShareSupported
  },
  
  // Логирование
  log: {
    error: logError,
    info: logInfo,
    debug: logDebug,
    warn: logWarn,
    performance: logPerformance
  }
};

// Хелперы для быстрого доступа к частым функциям
export const quickUtils = {
  // Быстрая валидация email
  isValidEmail: (email: string) => validateEmail(email).isValid,
  
  // Быстрая валидация пароля
  isValidPassword: (password: string) => validatePassword(password).isValid,
  
  // Быстрое форматирование времени для сообщений
  messageTime: (date: Date | string) => formatDate(date, 'message'),
  
  // Быстрое форматирование размера файла
  fileSize: (bytes: number) => formatFileSize(bytes),
  
  // Быстрое объединение классов
  cx: cn,
  
  // Быстрый debounce для поиска
  searchDebounce: <T extends (...args: any[]) => any>(func: T) => 
    createSearchDebounce(func),
  
  // Быстрый throttle
  throttle: <T extends (...args: any[]) => any>(func: T, limit: number) => 
    throttle(func, limit),
  
  // Быстрая проверка подключения сокета
  isSocketReady: () => isSocketConnected(),
  
  // Быстрая проверка поддержки WebRTC
  canMakeCalls: () => isWebRTCSupported(),
  
  // Быстрое логирование ошибки
  logError: (message: string, error?: any) => logError(message, error),
  
  // Быстрое воспроизведение звука уведомления
  playNotificationSound: () => playNotification(),
  
  // Быстрое получение статуса пользователя
  getUserStatusText: (status: string, lastSeen?: Date | string) => 
    formatUserStatus(status as any, lastSeen),
  
  // Быстрое сокращение текста
  truncate: (text: string, length: number = 100) => truncateText(text, length),
  
  // Быстрая капитализация
  capitalize: (str: string) => capitalize(str),
  
  // Быстрая проверка типа файла по MIME
  getFileType: (mimeType: string) => MIME_TYPES[mimeType as keyof typeof MIME_TYPES] || FILE_TYPES.OTHER,
  
  // Быстрое получение цвета статуса
  getStatusColor: (status: string) => STATUS_COLORS[status as keyof typeof STATUS_COLORS],
  
  // Быстрая генерация ID
  generateId: () => Math.random().toString(36).substring(2) + Date.now().toString(36),
  
  // Быстрая проверка мобильного устройства
  isMobile: () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  
  // Быстрая проверка темной темы
  isDarkTheme: () => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,
  
  // Быстрое копирование в буфер обмена
  copyToClipboard: async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  },
  
  // Быстрое получение текущего времени в Unix timestamp
  now: () => Date.now(),
  
  // Быстрая проверка онлайн статуса
  isOnline: () => navigator.onLine,
  
  // Быстрое получение пути к звуку
  getSoundPath: (soundKey: keyof typeof SOUND_FILES) => SOUND_FILES[soundKey],
  
  // Быстрая задержка
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Быстрая проверка поддержки функций браузера
  browserSupport: {
    webrtc: () => isWebRTCSupported(),
    notifications: () => 'Notification' in window,
    serviceWorker: () => 'serviceWorker' in navigator,
    webSocket: () => 'WebSocket' in window,
    localStorage: () => {
      try {
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch {
        return false;
      }
    },
    fileReader: () => 'FileReader' in window,
    mediaDevices: () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    clipboard: () => !!(navigator.clipboard && navigator.clipboard.writeText)
  }
};

// Типы для экспорта
export type Utils = typeof utils;
export type QuickUtils = typeof quickUtils;

// Функции-хелперы для работы с константами
export const constants = {
  // Проверка валидности статуса пользователя
  isValidUserStatus: (status: string): status is keyof typeof USER_STATUS => 
    Object.values(USER_STATUS).includes(status as any),
  
  // Проверка валидности типа сообщения
  isValidMessageType: (type: string): type is keyof typeof MESSAGE_TYPES => 
    Object.values(MESSAGE_TYPES).includes(type as any),
  
  // Проверка валидности типа чата
  isValidChatType: (type: string): type is keyof typeof CHAT_TYPES => 
    Object.values(CHAT_TYPES).includes(type as any),
  
  // Проверка валидности типа звонка
  isValidCallType: (type: string): type is keyof typeof CALL_TYPES => 
    Object.values(CALL_TYPES).includes(type as any),
  
  // Получение всех поддерживаемых расширений файлов
  getAllSupportedExtensions: (): string[] => 
    Object.values(SUPPORTED_FILE_FORMATS).flat(),
  
  // Получение расширений для конкретного типа файла
  getExtensionsForType: (fileType: keyof typeof SUPPORTED_FILE_FORMATS): string[] => 
    SUPPORTED_FILE_FORMATS[fileType] || [],
  
  // Проверка поддержки расширения файла
  isFileExtensionSupported: (extension: string): boolean => 
    constants.getAllSupportedExtensions().includes(extension.toLowerCase()),
  
  // Получение максимального размера для типа файла
  getMaxFileSizeForType: (fileType: keyof typeof FILE_SIZE_LIMITS): number => 
    FILE_SIZE_LIMITS[fileType] || FILE_SIZE_LIMITS.GENERAL,
  
  // Получение сообщения об ошибке по коду
  getErrorMessage: (errorCode: keyof typeof ERROR_CODES): string => 
    ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.UNKNOWN_ERROR,
  
  // Получение всех доступных тем
  getAvailableThemes: (): string[] => Object.values(THEMES),
  
  // Получение всех доступных языков
  getAvailableLanguages: (): string[] => Object.values(LANGUAGES),
  
  // Проверка валидности роута
  isValidRoute: (route: string): boolean => 
    Object.values(ROUTES).includes(route) || 
    Object.values(ROUTES).some(r => typeof r === 'function'),
  
  // Получение всех поддерживаемых локалей
  getSupportedLocales: (): string[] => LOCALE_SETTINGS.SUPPORTED_LOCALES,
  
  // Проверка является ли локаль поддерживаемой
  isLocaleSupported: (locale: string): boolean => 
    LOCALE_SETTINGS.SUPPORTED_LOCALES.includes(locale)
};

// Экспорт дополнительных утилит
export const additionalUtils = {
  // Утилиты для работы с URL
  url: {
    // Добавление параметров к URL
    addParams: (url: string, params: Record<string, string>) => {
      const urlObj = new URL(url, window.location.origin);
      Object.entries(params).forEach(([key, value]) => {
        urlObj.searchParams.set(key, value);
      });
      return urlObj.toString();
    },
    
    // Получение параметров из URL
    getParams: (url?: string) => {
      const urlObj = new URL(url || window.location.href);
      const params: Record<string, string> = {};
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });
      return params;
    },
    
    // Проверка является ли URL абсолютным
    isAbsolute: (url: string) => /^https?:\/\//.test(url)
  },
  
  // Утилиты для работы с датами
  date: {
    // Проверка является ли дата сегодня
    isToday: (date: Date | string) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      const today = new Date();
      return d.toDateString() === today.toDateString();
    },
    
    // Проверка является ли дата вчера
    isYesterday: (date: Date | string) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return d.toDateString() === yesterday.toDateString();
    },
    
    // Получение начала дня
    startOfDay: (date: Date | string) => {
      const d = typeof date === 'string' ? new Date(date) : new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    },
    
    // Получение конца дня
    endOfDay: (date: Date | string) => {
      const d = typeof date === 'string' ? new Date(date) : new Date(date);
      d.setHours(23, 59, 59, 999);
      return d;
    }
  },
  
  // Утилиты для работы с массивами
  array: {
    // Удаление дубликатов
    unique: <T>(arr: T[]): T[] => [...new Set(arr)],
    
    // Группировка по ключу
    groupBy: <T, K extends keyof T>(arr: T[], key: K): Record<string, T[]> => {
      return arr.reduce((groups, item) => {
        const groupKey = String(item[key]);
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(item);
        return groups;
      }, {} as Record<string, T[]>);
    },
    
    // Разделение массива на части
    chunk: <T>(arr: T[], size: number): T[][] => {
      const chunks: T[][] = [];
      for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
      }
      return chunks;
    },
    
    // Перемешивание массива
    shuffle: <T>(arr: T[]): T[] => {
      const shuffled = [...arr];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }
  },
  
  // Утилиты для работы с объектами
  object: {
    // Глубокое клонирование
    deepClone: <T>(obj: T): T => JSON.parse(JSON.stringify(obj)),
    
    // Проверка пустого объекта
    isEmpty: (obj: Record<string, any>): boolean => Object.keys(obj).length === 0,
    
    // Выборка полей из объекта
    pick: <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
      const result = {} as Pick<T, K>;
      keys.forEach(key => {
        if (key in obj) {
          result[key] = obj[key];
        }
      });
      return result;
    },
    
    // Исключение полей из объекта
    omit: <T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
      const result = { ...obj };
      keys.forEach(key => {
        delete result[key];
      });
      return result;
    }
  },
  
  // Утилиты для работы с цветами
  color: {
    // Конвертация hex в rgba
    hexToRgba: (hex: string, alpha: number = 1): string => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },
    
    // Проверка темного цвета
    isDark: (hex: string): boolean => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness < 128;
    }
  }
};

// Экспорт всего как default для удобства
export default {
  ...utils,
  quick: quickUtils,
  constants,
  additional: additionalUtils
};