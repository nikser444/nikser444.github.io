import { Request, Response, NextFunction } from 'express';
import cors from 'cors';

/**
 * Разрешенные домены для CORS
 */
const ALLOWED_ORIGINS = [
  'http://localhost:3000', // React dev server
  'http://localhost:5173', // Vite dev server
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL, // Production frontend URL
].filter(Boolean) as string[];

/**
 * Настройки CORS
 */
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Разрешаем запросы без origin (например, мобильные приложения)
    if (!origin) {
      return callback(null, true);
    }

    // Проверяем, разрешен ли origin
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    // В режиме разработки разрешаем localhost с любым портом
    if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
      return callback(null, true);
    }

    callback(new Error('Доступ запрещен CORS политикой'));
  },
  credentials: true, // Разрешаем отправку cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Methods',
    'Access-Control-Allow-Credentials',
    'X-API-Key',
    'X-Client-Version'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Has-Next-Page',
    'X-Has-Prev-Page'
  ],
  maxAge: 86400 // 24 часа
};

/**
 * Middleware для обработки CORS
 */
export const corsMiddleware = cors(corsOptions);

/**
 * Кастомный CORS middleware для WebSocket соединений
 */
export const socketCorsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const origin = req.headers.origin;

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (process.env.NODE_ENV === 'development' && origin?.includes('localhost')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  next();
};

/**
 * Middleware для предварительных запросов (preflight)
 */
export const preflightMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.method === 'OPTIONS') {
    res.status(200).json({
      success: true,
      message: 'Preflight OK'
    });
    return;
  }
  
  next();
};