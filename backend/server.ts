import dotenv from 'dotenv';
import path from 'path';

// Загружаем переменные окружения
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { app, server } from './src/app';
import { connectDatabase } from './src/config/database';
import { connectRedis } from './src/config';
import { setupDirectories } from './src/utils/setupDirectories';
import { logger } from './src/utils/logger';

const PORT = process.env.PORT || 3000;

async function startServer(): Promise<void> {
  try {
    // Создаем необходимые директории
    await setupDirectories();
    logger.info('Directories setup completed');

    // Подключаемся к базе данных
    await connectDatabase();
    logger.info('Database connected successfully');

    // Подключаемся к Redis
    await connectRedis();
    logger.info('Redis connected successfully');

    // Запускаем сервер
    server.listen(PORT, () => {
      logger.info(`🚀 Server is running on port ${PORT}`);
      logger.info(`📡 Socket.io server is ready`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
      
      if (process.env.NODE_ENV === 'development') {
        logger.info(`📱 Frontend URL: ${process.env.FRONTEND_URL}`);
      }
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Обработка неожиданных ошибок
process.on('unhandledRejection', (reason: unknown, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception thrown:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Запускаем сервер
startServer();