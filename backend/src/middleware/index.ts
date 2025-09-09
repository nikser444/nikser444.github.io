/**
 * Главный файл для экспорта всех middleware
 * Централизованное управление всеми middleware приложения
 */

// Авторизация и аутентификация
export {
  authenticateToken,
  requireRole,
  requireAdmin,
  optionalAuth,
  AuthenticatedRequest
} from './auth';

// Валидация данных
export {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateCreateChat,
  validateSendMessage,
  validateAddFriend,
  validateUpdateProfile,
  validateChangePassword,
  validateCreateCall,
  validateSearchUsers,
  validateQueryParams,
  validateParam
} from './validation';

// Загрузка файлов
export {
  uploadAvatar,
  uploadChatImages,
  uploadChatFiles,
  uploadAudio,
  uploadVideo,
  handleUploadError,
  processImage,
  processAvatar,
  extractFileMetadata,
  validateFileContent,
  cleanupOnError,
  checkUserQuota,
  logFileUpload,
  deleteFile,
  getFileUrl,
  checkFileExists,
  uploadConfigs
} from './upload';

// CORS
export {
  corsMiddleware,
  socketCorsMiddleware,
  preflightMiddleware
} from './cors';

// Rate Limiting
export {
  generalApiLimit,
  authLimit,
  registerLimit,
  messageLimit,
  uploadLimit,
  callLimit,
  friendRequestLimit,
  searchLimit,
  passwordChangeLimit,
  passwordResetLimit,
  emailLimit,
  socketRateLimit,
  logRateLimit,
  createUserRateLimit,
  cleanupRateLimit,
  adminLimit,
  skipRateLimitForWhitelisted
} from './rateLimit';

// Безопасность
export {
  helmetMiddleware,
  hppMiddleware,
  mongoSanitizeMiddleware,
  xssProtection,
  inputSanitization,
  suspiciousActivityDetection,
  validateContentType,
  addCSPNonce,
  validateUserAgent,
  validateRequestSize,
  csrfProtection,
  securityLogger,
  ipBlacklist,
  blockIP,
  unblockIP,
  geoLocation,
  requireHTTPS,
  securityHeaders,
  securityMiddleware
} from './security';

// Дополнительные middleware
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware для логирования запросов
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  const userId = (req as any).user?.id || 'anonymous';

  console.log(`[REQUEST] ${req.method} ${req.path} - IP: ${ip}, User: ${userId}`);

  const originalSend = res.send;
  res.send = function(body: any) {
    const responseTime = Date.now() - startTime;
    console.log(`[RESPONSE] ${res.statusCode} ${req.method} ${req.path} - ${responseTime}ms`);
    return originalSend.call(this, body);
  };

  next();
};

/**
 * Middleware для обработки ошибок 404
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    message: 'Запрашиваемый ресурс не найден',
    path: req.path,
    method: req.method
  });
};

/**
 * Глобальный обработчик ошибок
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Глобальная ошибка:', error);

  // Логируем стек ошибки в развитии
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack trace:', error.stack);
  }

  // Определяем тип ошибки и соответствующий код ответа
  let statusCode = 500;
  let message = 'Внутренняя ошибка сервера';

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Ошибка валидации данных';
  } else if (error.name === 'UnauthorizedError' || error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Ошибка авторизации';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Доступ запрещен';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Ресурс не найден';
  } else if (error.code === 'ENOENT') {
    statusCode = 404;
    message = 'Файл не найден';
  } else if (error.code === 'EACCES') {
    statusCode = 403;
    message = 'Нет прав доступа';
  } else if (error.code === 'EMFILE' || error.code === 'ENFILE') {
    statusCode = 507;
    message = 'Недостаточно места на сервере';
  }

  // Отправляем ответ об ошибке
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      error: error.message,
      stack: error.stack
    })
  });
};

/**
 * Middleware для проверки технического обслуживания
 */
export const maintenanceMode = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (process.env.MAINTENANCE_MODE === 'true') {
    // Разрешаем админам доступ во время обслуживания
    const userRole = (req as any).user?.role;
    if (userRole !== 'admin') {
      res.status(503).json({
        success: false,
        message: 'Сервис временно недоступен. Ведутся технические работы.',
        retryAfter: 3600 // 1 час
      });
      return;
    }
  }

  next();
};

/**
 * Middleware для добавления метаданных ответа
 */
export const responseMetadata = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const originalJson = res.json;

  res.json = function(body: any) {
    // Добавляем метаданные к успешным ответам
    if (body && typeof body === 'object' && body.success !== false) {
      const enhancedBody = {
        ...body,
        timestamp: new Date().toISOString(),
        requestId: req.get('X-Request-ID') || 'unknown',
        version: process.env.API_VERSION || '1.0.0'
      };
      return originalJson.call(this, enhancedBody);
    }

    return originalJson.call(this, body);
  };

  next();
};

/**
 * Middleware для установки заголовков кэширования
 */
export const cacheControl = (maxAge: number = 0, isPrivate: boolean = true) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (maxAge > 0) {
      const cacheType = isPrivate ? 'private' : 'public';
      res.set('Cache-Control', `${cacheType}, max-age=${maxAge}`);
    } else {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    }

    next();
  };
};

/**
 * Middleware для проверки версии API
 */
export const apiVersionCheck = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const clientVersion = req.get('X-API-Version') || req.get('X-Client-Version');
  const serverVersion = process.env.API_VERSION || '1.0.0';

  if (clientVersion && clientVersion !== serverVersion) {
    console.warn(`[API_VERSION] Client version mismatch: ${clientVersion} vs ${serverVersion}`);
    
    // В будущем можно добавить логику обратной совместимости
    res.set('X-API-Version', serverVersion);
    res.set('X-API-Deprecated', 'false');
  }

  next();
};

/**
 * Middleware для проверки Content-Length
 */
export const validateContentLength = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentLength = req.get('Content-Length');
    
    if (!contentLength && Object.keys(req.body || {}).length > 0) {
      res.status(411).json({
        success: false,
        message: 'Content-Length header обязателен'
      });
      return;
    }
  }

  next();
};

/**
 * Комплексные middleware наборы для разных типов роутов
 */
export const middlewareSets = {
  // Базовые middleware для всех роутов
  base: [
    requestId,
    compressionMiddleware,
    corsMiddleware,
    helmetMiddleware,
    securityHeaders,
    requestLogger,
    apiVersionCheck,
    healthCheck,
    gracefulShutdown,
    performanceMonitoring,
    botDetection,
    localization
  ],

  // Middleware для публичных API
  public: [
    generalApiLimit,
    validateContentType(['application/json', 'multipart/form-data']),
    normalizeQuery,
    inputSanitization,
    suspiciousActivityDetection,
    clientRequirements,
    conditionalRequests
  ],

  // Middleware для авторизованных API  
  protected: [
    authenticateToken,
    maintenanceMode,
    userActivity,
    sessionManagement,
    abTesting,
    paginationMetadata,
    responseMetadata
  ],

  // Middleware для административных API
  admin: [
    requireAdmin,
    adminLimit,
    logRateLimit
  ],

  // Middleware для загрузки файлов
  upload: [
    uploadLimit,
    checkUserQuota,
    logFileUpload,
    validateFileContent,
    processImage,
    extractFileMetadata
  ],

  // Middleware для аутентификации
  auth: [
    authLimit,
    validateContentType(['application/json']),
    skipRateLimitForWhitelisted
  ],

  // Middleware для WebSocket подключений
  websocket: [
    webSocketCors,
    socketCorsMiddleware,
    socketRateLimit(),
    optionalAuth
  ],

  // Middleware для статических файлов
  static: [
    staticCache(),
    conditionalRequests,
    checkFileExists
  ],

  // Полный набор безопасности
  security: [
    ...securityMiddleware,
    ipBlacklist,
    requireHTTPS,
    validateUserAgent,
    csrfProtection
  ]
};