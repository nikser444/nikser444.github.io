import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import compression from 'compression';

/**
 * Middleware для сжатия ответов
 */
export const compressionMiddleware = compression({
  filter: (req: Request, res: Response) => {
    // Не сжимаем, если клиент отказывается
    if (req.headers['x-no-compression']) {
      return false;
    }

    // Сжимаем все остальное по умолчанию
    return compression.filter(req, res);
  },
  threshold: 1024, // Сжимаем только файлы больше 1KB
  level: 6, // Средний уровень сжатия (0-9)
  chunkSize: 16 * 1024 // 16KB chunks
});

/**
 * Middleware для добавления уникального ID запроса
 */
export const requestId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = req.get('X-Request-ID') || uuidv4();
  (req as any).requestId = requestId;
  res.set('X-Request-ID', requestId);
  next();
};

/**
 * Middleware для измерения производительности
 */
export const performanceMonitoring = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage();

  const originalSend = res.send;
  res.send = function(body: any) {
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    
    const responseTime = Number(endTime - startTime) / 1000000; // Convert to ms
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;

    // Добавляем метрики в заголовки
    res.set({
      'X-Response-Time': `${responseTime.toFixed(2)}ms`,
      'X-Memory-Usage': `${(memoryDelta / 1024 / 1024).toFixed(2)}MB`
    });

    // Логируем медленные запросы
    if (responseTime > 1000) {
      console.warn(`[PERFORMANCE] Slow request: ${responseTime.toFixed(2)}ms for ${req.method} ${req.path}`, {
        memoryDelta: `${(memoryDelta / 1024 / 1024).toFixed(2)}MB`,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    return originalSend.call(this, body);
  };

  next();
};

/**
 * Middleware для проверки здоровья системы
 */
export const healthCheck = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.path === '/health' || req.path === '/api/health') {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    res.status(200).json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
      },
      version: process.env.API_VERSION || '1.0.0',
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || 'development'
    });
    return;
  }

  next();
};

/**
 * Middleware для обработки graceful shutdown
 */
let isShuttingDown = false;

export const gracefulShutdown = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (isShuttingDown) {
    res.status(503).json({
      success: false,
      message: 'Сервер завершает работу, попробуйте позже'
    });
    return;
  }

  next();
};

/**
 * Функция для инициации graceful shutdown
 */
export const initiateShutdown = (): void => {
  isShuttingDown = true;
  console.log('[SHUTDOWN] Сервер начинает graceful shutdown...');
};

/**
 * Middleware для обработки OPTIONS запросов
 */
export const handlePreflight = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
};

/**
 * Middleware для нормализации query параметров
 */
export const normalizeQuery = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.query) {
    // Преобразуем строковые булевы значения
    Object.keys(req.query).forEach(key => {
      const value = req.query[key] as string;
      if (value === 'true') {
        (req.query as any)[key] = true;
      } else if (value === 'false') {
        (req.query as any)[key] = false;
      } else if (value === 'null') {
        (req.query as any)[key] = null;
      } else if (value === 'undefined') {
        (req.query as any)[key] = undefined;
      } else if (!isNaN(Number(value)) && value.trim() !== '') {
        // Преобразуем числовые строки в числа
        (req.query as any)[key] = Number(value);
      }
    });
  }

  next();
};

/**
 * Middleware для добавления метаданных пагинации
 */
export const paginationMetadata = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const originalJson = res.json;

  res.json = function(body: any) {
    if (body && body.data && Array.isArray(body.data)) {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const total = body.total || body.data.length;
      const totalPages = Math.ceil(total / limit);

      const pagination = {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page -