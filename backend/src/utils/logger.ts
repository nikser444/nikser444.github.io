import winston from 'winston';
import path from 'path';
import fs from 'fs';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly'
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  [key: string]: any;
}

/**
 * Система логирования для приложения
 */
class Logger {
  private winston: winston.Logger;
  private logsDir: string;

  constructor() {
    this.logsDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
    this.winston = this.createLogger();
  }

  /**
   * Создание директории для логов
   */
  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  /**
   * Создание Winston logger
   */
  private createLogger(): winston.Logger {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    const formats = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    const transports: winston.transport[] = [];

    // Console транспорт для development
    if (isDevelopment) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
              return `${timestamp} [${level}]: ${message} ${metaStr}`;
            })
          )
        })
      );
    }

    // File транспорты
    transports.push(
      // Общие логи
      new winston.transports.File({
        filename: path.join(this.logsDir, 'app.log'),
        format: formats,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5
      }),
      
      // Логи ошибок
      new winston.transports.File({
        filename: path.join(this.logsDir, 'error.log'),
        level: 'error',
        format: formats,
        maxsize: 10 * 1024 * 1024,
        maxFiles: 5
      }),

      // HTTP логи
      new winston.transports.File({
        filename: path.join(this.logsDir, 'http.log'),
        level: 'http',
        format: formats,
        maxsize: 10 * 1024 * 1024,
        maxFiles: 3
      }),

      // Аудит логи (важные действия)
      new winston.transports.File({
        filename: path.join(this.logsDir, 'audit.log'),
        format: formats,
        maxsize: 10 * 1024 * 1024,
        maxFiles: 10
      })
    );

    return winston.createLogger({
      level: isDevelopment ? 'debug' : 'info',
      format: formats,
      transports,
      exceptionHandlers: [
        new winston.transports.File({
          filename: path.join(this.logsDir, 'exceptions.log'),
          maxsize: 10 * 1024 * 1024,
          maxFiles: 3
        })
      ],
      rejectionHandlers: [
        new winston.transports.File({
          filename: path.join(this.logsDir, 'rejections.log'),
          maxsize: 10 * 1024 * 1024,
          maxFiles: 3
        })
      ]
    });
  }

  /**
   * Форматирование сообщения с контекстом
   */
  private formatMessage(message: string, context?: LogContext): any {
    if (!context) return message;

    return {
      message,
      ...context
    };
  }

  /**
   * Логирование ошибок
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const logData: any = this.formatMessage(message, context);
    
    if (error) {
      logData.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    this.winston.error(logData);
  }

  /**
   * Логирование предупреждений
   */
  warn(message: string, context?: LogContext): void {
    this.winston.warn(this.formatMessage(message, context));
  }

  /**
   * Логирование информационных сообщений
   */
  info(message: string, context?: LogContext): void {
    this.winston.info(this.formatMessage(message, context));
  }

  /**
   * Логирование HTTP запросов
   */
  http(message: string, context?: LogContext): void {
    this.winston.http(this.formatMessage(message, context));
  }

  /**
   * Логирование отладочной информации
   */
  debug(message: string, context?: LogContext): void {
    this.winston.debug(this.formatMessage(message, context));
  }

  /**
   * Подробное логирование
   */
  verbose(message: string, context?: LogContext): void {
    this.winston.verbose(this.formatMessage(message, context));
  }

  /**
   * Логирование аудита (важные действия пользователей)
   */
  audit(action: string, context: LogContext): void {
    this.winston.info({
      message: `AUDIT: ${action}`,
      audit: true,
      ...context
    });
  }

  /**
   * Логирование безопасности
   */
  security(message: string, context?: LogContext): void {
    this.winston.warn({
      message: `SECURITY: ${message}`,
      security: true,
      ...context
    });
  }

  /**
   * Логирование производительности
   */
  performance(message: string, duration: number, context?: LogContext): void {
    this.winston.info({
      message: `PERFORMANCE: ${message}`,
      performance: true,
      duration,
      ...context
    });
  }

  /**
   * Логирование запросов к API
   */
  apiRequest(method: string, url: string, statusCode: number, responseTime: number, context?: LogContext): void {
    this.http('API Request', {
      method,
      url,
      statusCode,
      responseTime,
      ...context
    });
  }

  /**
   * Логирование авторизации
   */
  auth(action: 'login' | 'logout' | 'register' | 'failed_login', context: LogContext): void {
    this.audit(`Auth: ${action}`, context);
  }

  /**
   * Логирование действий с чатами
   */
  chatAction(action: string, chatId: string, context?: LogContext): void {
    this.info(`Chat action: ${action}`, {
      chatId,
      ...context
    });
  }

  /**
   * Логирование звонков
   */
  callAction(action: string, callId: string, context?: LogContext): void {
    this.info(`Call action: ${action}`, {
      callId,
      ...context
    });
  }

  /**
   * Логирование ошибок базы данных
   */
  dbError(operation: string, error: Error, context?: LogContext): void {
    this.error(`Database error in ${operation}`, error, {
      operation,
      ...context
    });
  }

  /**
   * Логирование подключений к WebSocket
   */
  socketConnection(event: 'connect' | 'disconnect', socketId: string, context?: LogContext): void {
    this.info(`Socket ${event}`, {
      socketId,
      event,
      ...context
    });
  }

  /**
   * Получение статистики логов
   */
  async getLogStats(): Promise<{
    totalLogs: number;
    errorLogs: number;
    httpLogs: number;
    auditLogs: number;
    logFiles: string[];
  }> {
    return new Promise((resolve) => {
      const stats = {
        totalLogs: 0,
        errorLogs: 0,
        httpLogs: 0,
        auditLogs: 0,
        logFiles: fs.readdirSync(this.logsDir)
      };

      // В реальном приложении здесь была бы логика подсчета логов
      // Для упрощения возвращаем базовую информацию
      resolve(stats);
    });
  }

  /**
   * Очистка старых логов
   */
  async cleanupOldLogs(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    try {
      const files = fs.readdirSync(this.logsDir);
      
      for (const file of files) {
        const filePath = path.join(this.logsDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          this.info(`Removed old log file: ${file}`);
        }
      }
    } catch (error) {
      this.error('Failed to cleanup old logs', error as Error);
    }
  }

  /**
   * Создание контекста для HTTP запроса
   */
  createHttpContext(req: any): LogContext {
    return {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      sessionId: req.sessionId
    };
  }

  /**
   * Middleware для логирования HTTP запросов
   */
  httpMiddleware() {
    return (req: any, res: any, next: any) => {
      const start = Date.now();
      const context = this.createHttpContext(req);

      res.on('finish', () => {
        const duration = Date.now() - start;
        this.apiRequest(
          req.method,
          req.originalUrl || req.url,
          res.statusCode,
          duration,
          context
        );
      });

      next();
    };
  }
}

// Создаем singleton instance
export const logger = new Logger();

// Экспортируем класс для тестирования
export { Logger };

export default logger;