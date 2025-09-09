import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

// Импорт конфигураций
import { databaseConfig } from './config/database';
import { jwtConfig } from './config/jwt';
import { socketConfig } from './config/socket';
import { webrtcConfig } from './config/webrtc';

// Импорт маршрутов
import mainRouter from './routes';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import chatRoutes from './routes/chats';
import messageRoutes from './routes/messages';
import friendRoutes from './routes/friends';
import callRoutes from './routes/calls';

// Импорт middleware
import { authMiddleware } from './middleware/auth';
import { corsMiddleware } from './middleware/cors';
import { securityMiddleware } from './middleware/security';
import { validationMiddleware } from './middleware/validation';
import { uploadMiddleware } from './middleware/upload';
import { utilsMiddleware } from './middleware/utils';

// Импорт сокетов
import { setupSockets } from './sockets';
import { chatSocketHandlers } from './sockets/chatSocket';
import { callSocketHandlers } from './sockets/callSocket';
import { videoSocketHandlers } from './sockets/videoSocket';
import { screenSocketHandlers } from './sockets/screenSocket';

// Импорт сервисов
import { AuthService } from './services/AuthService';
import { EmailService } from './services/EmailService';
import { ChatService } from './services/ChatService';
import { CallService } from './services/CallService';
import { NotificationService } from './services/NotificationService';

// Импорт утилит
import { logger } from './utils/logger';
import { hashUtils } from './utils/hash';
import { jwtUtils } from './utils/jwt';
import { validationUtils } from './utils/validation';

// Импорт моделей для инициализации БД
import './models';

class MessengerApp {
  public app: express.Application;
  public server: any;
  public io: Server;
  private port: string | number;

  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    
    this.initializeDatabase();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeServer();
    this.initializeSocketIO();
    this.initializeErrorHandling();
    
    logger.info('Messenger application initialized successfully');
  }

  private async initializeDatabase(): Promise<void> {
    try {
      await databaseConfig.authenticate();
      await databaseConfig.sync({ 
        alter: process.env.NODE_ENV === 'development',
        force: false 
      });
      logger.info('Database connected and synchronized successfully');
    } catch (error) {
      logger.error('Database connection failed:', error);
      process.exit(1);
    }
  }

  private initializeMiddlewares(): void {
    // Безопасность
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
    }));

    // CORS
    this.app.use(corsMiddleware);
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Более строгий лимит для авторизации
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // limit each IP to 5 requests per windowMs
      message: {
        error: 'Too many authentication attempts, please try again later.',
      },
    });
    this.app.use('/api/auth/', authLimiter);

    // Логирование
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Парсеры
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Статические файлы
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
    
    // Кастомные middleware
    this.app.use(securityMiddleware);
    this.app.use(utilsMiddleware);

    logger.info('Middlewares initialized successfully');
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // API routes
    this.app.use('/api', mainRouter);
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', authMiddleware, userRoutes);
    this.app.use('/api/chats', authMiddleware, chatRoutes);
    this.app.use('/api/messages', authMiddleware, messageRoutes);
    this.app.use('/api/friends', authMiddleware, friendRoutes);
    this.app.use('/api/calls', authMiddleware, callRoutes);

    // 404 handler для API routes
    this.app.use('/api/*', (req, res) => {
      res.status(404).json({
        error: 'API endpoint not found',
        path: req.originalUrl,
        method: req.method
      });
    });

    // Serve frontend в production
    if (process.env.NODE_ENV === 'production') {
      this.app.use(express.static(path.join(__dirname, '../../frontend/dist')));
      
      this.app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
      });
    }

    logger.info('Routes initialized successfully');
  }

  private initializeServer(): void {
    this.server = createServer(this.app);
    logger.info('HTTP server created successfully');
  }

  private initializeSocketIO(): void {
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    // Middleware для аутентификации сокетов
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          throw new Error('No token provided');
        }

        const decoded = jwtUtils.verifyToken(token);
        socket.userId = decoded.userId;
        socket.userEmail = decoded.email;
        
        next();
      } catch (error) {
        logger.error('Socket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Подключение обработчиков сокетов
    this.io.on('connection', (socket) => {
      logger.info(`User connected: ${socket.userId} (${socket.userEmail})`);

      // Присоединение к комнате пользователя
      socket.join(`user:${socket.userId}`);

      // Уведомление о подключении
      socket.broadcast.emit('user:online', {
        userId: socket.userId,
        timestamp: new Date().toISOString()
      });

      // Регистрация обработчиков
      chatSocketHandlers(socket, this.io);
      callSocketHandlers(socket, this.io);
      videoSocketHandlers(socket, this.io);
      screenSocketHandlers(socket, this.io);

      // Обработка отключения
      socket.on('disconnect', (reason) => {
        logger.info(`User disconnected: ${socket.userId} (reason: ${reason})`);
        
        // Уведомление об отключении
        socket.broadcast.emit('user:offline', {
          userId: socket.userId,
          timestamp: new Date().toISOString(),
          reason
        });

        // Завершение активных звонков
        CallService.handleUserDisconnect(socket.userId, this.io);
      });

      // Обработка ошибок сокета
      socket.on('error', (error) => {
        logger.error(`Socket error for user ${socket.userId}:`, error);
      });
    });

    logger.info('Socket.IO initialized successfully');
  }

  private initializeErrorHandling(): void {
    // Обработка ошибок Express
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Express error:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Не отправляем stack trace в production
      const isDevelopment = process.env.NODE_ENV === 'development';

      res.status(error.status || 500).json({
        error: error.message || 'Internal Server Error',
        ...(isDevelopment && { stack: error.stack }),
        timestamp: new Date().toISOString()
      });
    });

    // Обработка необработанных промисов
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Graceful shutdown
      this.shutdown();
    });

    // Обработка необработанных исключений
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      // Graceful shutdown
      this.shutdown();
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, starting graceful shutdown');
      this.shutdown();
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, starting graceful shutdown');
      this.shutdown();
    });

    logger.info('Error handling initialized successfully');
  }

  public listen(): void {
    this.server.listen(this.port, () => {
      logger.info(`🚀 Messenger server is running on port ${this.port}`);
      logger.info(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Health check: http://localhost:${this.port}/health`);
      
      if (process.env.NODE_ENV === 'development') {
        logger.info(`🌐 API Base URL: http://localhost:${this.port}/api`);
        logger.info(`🔌 WebSocket URL: ws://localhost:${this.port}`);
      }
    });
  }

  private async shutdown(): Promise<void> {
    logger.info('Starting graceful shutdown...');

    // Закрываем HTTP сервер
    if (this.server) {
      this.server.close(() => {
        logger.info('HTTP server closed');
      });
    }

    // Закрываем Socket.IO
    if (this.io) {
      this.io.close(() => {
        logger.info('Socket.IO server closed');
      });
    }

    // Закрываем соединение с базой данных
    try {
      await databaseConfig.close();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database connection:', error);
    }

    logger.info('Graceful shutdown completed');
    process.exit(0);
  }

  // Геттеры для доступа к экземплярам
  public getApp(): express.Application {
    return this.app;
  }

  public getServer(): any {
    return this.server;
  }

  public getIO(): Server {
    return this.io;
  }
}

// Создание и экспорт экземпляра приложения
const messengerApp = new MessengerApp();

export default messengerApp;
export { MessengerApp };