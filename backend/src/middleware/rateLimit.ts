import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

// Создаем подключение к Redis для rate limiting
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
});

/**
 * Базовая конфигурация rate limiter
 */
const createRateLimiter = (
  windowMs: number,
  max: number,
  message: string,
  skipSuccessfulRequests = false,
  skipFailedRequests = false
) => {
  const store = process.env.NODE_ENV === 'production' 
    ? new RedisStore({
        sendCommand: (...args: string[]) => redisClient.call(...args),
      })
    : undefined;

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    store,
    skipSuccessfulRequests,
    skipFailedRequests,
    keyGenerator: (req: Request) => {
      // Используем IP и User ID если есть
      const userId = (req as any).user?.id;
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      return userId ? `${userId}:${ip}` : ip;
    }
  });
};

/**
 * Rate limiter для API запросов (общий)
 */
export const generalApiLimit = createRateLimiter(
  15 * 60 * 1000, // 15 минут
  1000, // 1000 запросов на IP
  'Слишком много запросов с этого IP, попробуйте позже'
);

/**
 * Rate limiter для авторизации
 */
export const authLimit = createRateLimiter(
  15 * 60 * 1000, // 15 минут
  5, // 5 попыток авторизации
  'Слишком много попыток авторизации, попробуйте через 15 минут',
  true // пропускаем успешные запросы
);

/**
 * Rate limiter для регистрации
 */
export const registerLimit = createRateLimiter(
  60 * 60 * 1000, // 1 час
  3, // 3 регистрации с одного IP
  'Слишком много попыток регистрации, попробуйте через час',
  true
);

/**
 * Rate limiter для отправки сообщений
 */
export const messageLimit = createRateLimiter(
  1 * 60 * 1000, // 1 минута
  60, // 60 сообщений в минуту
  'Слишком много сообщений, замедлите темп'
);

/**
 * Rate limiter для загрузки файлов
 */
export const uploadLimit = createRateLimiter(
  5 * 60 * 1000, // 5 минут
  10, // 10 загрузок
  'Слишком много загрузок файлов, попробуйте позже'
);

/**
 * Rate limiter для звонков
 */
export const callLimit = createRateLimiter(
  5 * 60 * 1000, // 5 минут
  20, // 20 попыток звонков
  'Слишком много попыток звонков, попробуйте позже'
);

/**
 * Rate limiter для добавления друзей
 */
export const friendRequestLimit = createRateLimiter(
  60 * 60 * 1000, // 1 час
  10, // 10 заявок в друзья
  'Слишком много заявок в друзья, попробуйте позже'
);

/**
 * Rate limiter для поиска
 */
export const searchLimit = createRateLimiter(
  1 * 60 * 1000, // 1 минута
  30, // 30 поисковых запросов
  'Слишком много поисковых запросов, замедлите темп'
);

/**
 * Rate limiter для смены пароля
 */
export const passwordChangeLimit = createRateLimiter(
  60 * 60 * 1000, // 1 час
  3, // 3 смены пароля
  'Слишком много попыток смены пароля, попробуйте через час'
);

/**
 * Rate limiter для восстановления пароля
 */
export const passwordResetLimit = createRateLimiter(
  60 * 60 * 1000, // 1 час
  5, // 5 запросов на восстановление
  'Слишком много запросов на восстановление пароля, попробуйте через час'
);

/**
 * Rate limiter для отправки email
 */
export const emailLimit = createRateLimiter(
  60 * 60 * 1000, // 1 час
  10, // 10 email
  'Слишком много отправленных писем, попробуйте через час'
);

/**
 * Кастомный rate limiter для WebSocket соединений
 */
const socketConnections = new Map<string, { count: number; lastReset: number }>();

export const socketRateLimit = (
  maxConnections: number = 5,
  windowMs: number = 60 * 1000 // 1 минута
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    let connectionData = socketConnections.get(ip);
    
    if (!connectionData || (now - connectionData.lastReset) > windowMs) {
      connectionData = { count: 0, lastReset: now };
      socketConnections.set(ip, connectionData);
    }
    
    connectionData.count++;
    
    if (connectionData.count > maxConnections) {
      res.status(429).json({
        success: false,
        message: 'Слишком много WebSocket соединений',
        retryAfter: Math.ceil(windowMs / 1000)
      });
      return;
    }
    
    next();
  };
};

/**
 * Middleware для логирования rate limit событий
 */
export const logRateLimit = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const originalSend = res.send;
  
  res.send = function(body: any) {
    if (res.statusCode === 429) {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const userId = (req as any).user?.id || 'anonymous';
      const userAgent = req.get('User-Agent') || 'unknown';
      const endpoint = `${req.method} ${req.path}`;
      
      console.warn(`[RATE_LIMIT] IP: ${ip}, User: ${userId}, Endpoint: ${endpoint}, UA: ${userAgent}`);
    }
    
    return originalSend.call(this, body);
  };
  
  next();
};

/**
 * Динамический rate limiter на основе пользователя
 */
export const createUserRateLimit = (
  getUserLimits: (userId: string) => { windowMs: number; max: number }
) => {
  const userLimiters = new Map<string, any>();
  
  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      // Если пользователь не авторизован, используем общий лимит
      return generalApiLimit(req, res, next);
    }
    
    let userLimiter = userLimiters.get(userId);
    
    if (!userLimiter) {
      const limits = getUserLimits(userId);
      userLimiter = createRateLimiter(
        limits.windowMs,
        limits.max,
        'Превышен лимит запросов для вашего аккаунта'
      );
      userLimiters.set(userId, userLimiter);
    }
    
    userLimiter(req, res, next);
  };
};

/**
 * Middleware для очистки старых записей rate limit
 */
export const cleanupRateLimit = (): void => {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 час
  
  for (const [ip, data] of socketConnections.entries()) {
    if (now - data.lastReset > maxAge) {
      socketConnections.delete(ip);
    }
  }
};

// Запускаем очистку каждые 30 минут
setInterval(cleanupRateLimit, 30 * 60 * 1000);

/**
 * Rate limiter для административных действий
 */
export const adminLimit = createRateLimiter(
  5 * 60 * 1000, // 5 минут
  100, // 100 административных действий
  'Слишком много административных действий'
);

/**
 * Whitelist IP адресов (например, для внутренних сервисов)
 */
const WHITELISTED_IPS = [
  '127.0.0.1',
  '::1',
  process.env.INTERNAL_API_IP
].filter(Boolean) as string[];

/**
 * Middleware для обхода rate limit для whitelisted IP
 */
export const skipRateLimitForWhitelisted = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const ip = req.ip || req.connection.remoteAddress || '';
  
  if (WHITELISTED_IPS.includes(ip)) {
    // Пропускаем rate limiting для whitelisted IP
    (req as any).skipRateLimit = true;
  }
  
  next();
};