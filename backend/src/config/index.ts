// Централизованный экспорт всех конфигураций
export * from './database';
export * from './jwt';
export * from './socket';
export * from './webrtc';

// Общие настройки приложения
export const appConfig = {
  // Основные настройки
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || 'localhost',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // URL настройки
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
  
  // Настройки безопасности
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 минут
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'), // максимум запросов
  
  // Настройки файлов
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  
  // Пути для загрузки файлов
  uploadPaths: {
    avatars: 'uploads/avatars',
    files: 'uploads/files',
    temp: 'uploads/temp'
  },
  
  // Email настройки
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    },
    from: process.env.EMAIL_FROM || 'noreply@messenger.com',
    templates: {
      verification: 'verification',
      passwordReset: 'password-reset',
      welcome: 'welcome'
    }
  },
  
  // Настройки логирования
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '14'),
    maxSize: process.env.LOG_MAX_SIZE || '20m'
  },
  
  // Настройки сессий
  session: {
    secret: process.env.SESSION_SECRET || 'messenger-session-secret-key',
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000'), // 24 часа
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const
  },
  
  // Настройки уведомлений
  notifications: {
    pushEnabled: process.env.PUSH_NOTIFICATIONS_ENABLED === 'true',
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
    vapidSubject: process.env.VAPID_SUBJECT || 'mailto:admin@messenger.com'
  },
  
  // Настройки для разработки
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTesting: process.env.NODE_ENV === 'test',
  
  // API версии
  apiVersion: process.env.API_VERSION || 'v1',
  apiPrefix: process.env.API_PREFIX || '/api',
  
  // Настройки кеширования
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '3600'), // 1 час
    maxKeys: parseInt(process.env.CACHE_MAX_KEYS || '1000'),
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD || '600') // 10 минут
  }
};

// Валидация обязательных переменных окружения
const requiredEnvVars = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'DB_PASSWORD'
];

export const validateConfig = (): void => {
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Отсутствуют обязательные переменные окружения:');
    missingVars.forEach(varName => console.error(`  - ${varName}`));
    process.exit(1);
  }
  
  console.log('✅ Конфигурация валидна');
};

// Функция для логирования текущей конфигурации
export const logConfig = (): void => {
  console.log('📋 Текущая конфигурация:');
  console.log(`  - Порт: ${appConfig.port}`);
  console.log(`  - Окружение: ${appConfig.nodeEnv}`);
  console.log(`  - Frontend URL: ${appConfig.frontendUrl}`);
  console.log(`  - API версия: ${appConfig.apiVersion}`);
  console.log(`  - Логирование: ${appConfig.logging.level}`);
};