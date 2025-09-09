export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  data?: any;
  stack?: string;
  category?: string;
  userId?: string;
  sessionId?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  enableRemote: boolean;
  maxStorageEntries: number;
  remoteUrl?: string;
  categories?: string[];
  formatters?: {
    console?: (entry: LogEntry) => string;
    storage?: (entry: LogEntry) => string;
  };
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  category?: string;
  metadata?: Record<string, any>;
}

class Logger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private context: LogContext = {};
  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4
  };

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: 'info',
      enableConsole: true,
      enableStorage: false,
      enableRemote: false,
      maxStorageEntries: 1000,
      categories: [],
      ...config
    };

    this.initializeSessionId();
    this.setupErrorHandlers();
  }

  private initializeSessionId(): void {
    if (!this.context.sessionId) {
      this.context.sessionId = this.generateSessionId();
    }
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private setupErrorHandlers(): void {
    // Глобальный обработчик ошибок
    window.addEventListener('error', (event) => {
      this.error('Global error caught:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    });

    // Обработчик необработанных промисов
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection:', {
        reason: event.reason,
        promise: event.promise
      });
    });
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.config.level];
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: any,
    stack?: string
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date(),
      data,
      stack,
      category: this.context.category,
      userId: this.context.userId,
      sessionId: this.context.sessionId
    };
  }

  private formatConsoleMessage(entry: LogEntry): string {
    if (this.config.formatters?.console) {
      return this.config.formatters.console(entry);
    }

    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const category = entry.category ? `[${entry.category}]` : '';
    const userId = entry.userId ? `[User:${entry.userId}]` : '';
    
    return `${timestamp} ${level} ${category}${userId} ${entry.message}`;
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const formattedMessage = this.formatConsoleMessage(entry);
    const consoleMethod = entry.level === 'debug' ? 'debug' :
                         entry.level === 'info' ? 'info' :
                         entry.level === 'warn' ? 'warn' :
                         'error';

    if (entry.data) {
      console[consoleMethod](formattedMessage, entry.data);
    } else {
      console[consoleMethod](formattedMessage);
    }

    if (entry.stack && entry.level === 'error') {
      console.error('Stack trace:', entry.stack);
    }
  }

  private logToStorage(entry: LogEntry): void {
    if (!this.config.enableStorage) return;

    this.logs.push(entry);

    // Ограничиваем количество записей в памяти
    if (this.logs.length > this.config.maxStorageEntries) {
      this.logs = this.logs.slice(-this.config.maxStorageEntries);
    }

    // Сохраняем в localStorage (только критичные ошибки)
    if (entry.level === 'error' || entry.level === 'fatal') {
      try {
        const storedLogs = localStorage.getItem('app_error_logs') || '[]';
        const errorLogs = JSON.parse(storedLogs);
        errorLogs.push(entry);
        
        // Храним максимум 50 ошибок в localStorage
        const trimmedLogs = errorLogs.slice(-50);
        localStorage.setItem('app_error_logs', JSON.stringify(trimmedLogs));
      } catch (error) {
        console.error('Failed to save error to localStorage:', error);
      }
    }
  }

  private async logToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteUrl) return;

    try {
      await fetch(this.config.remoteUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      console.error('Failed to send log to remote server:', error);
    }
  }

  private log(level: LogLevel, message: string, data?: any, stack?: string): void {
    if (!this.shouldLog(level)) return;

    // Фильтрация по категориям
    if (this.config.categories && this.config.categories.length > 0) {
      if (!this.context.category || !this.config.categories.includes(this.context.category)) {
        return;
      }
    }

    const entry = this.createLogEntry(level, message, data, stack);

    this.logToConsole(entry);
    this.logToStorage(entry);
    
    // Отправляем на сервер асинхронно
    if (this.config.enableRemote) {
      this.logToRemote(entry).catch(() => {
        // Ошибки отправки логов не должны влиять на основную логику
      });
    }
  }

  // Публичные методы логирования
  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, error?: Error | any): void {
    let stack: string | undefined;
    let errorData = error;

    if (error instanceof Error) {
      stack = error.stack;
      errorData = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    this.log('error', message, errorData, stack);
  }

  fatal(message: string, error?: Error | any): void {
    let stack: string | undefined;
    let errorData = error;

    if (error instanceof Error) {
      stack = error.stack;
      errorData = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    this.log('fatal', message, errorData, stack);
  }

  // Методы управления контекстом
  setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context };
  }

  setUserId(userId: string): void {
    this.context.userId = userId;
  }

  setCategory(category: string): void {
    this.context.category = category;
  }

  clearContext(): void {
    this.context = { sessionId: this.context.sessionId };
  }

  // Создание logger с конкретной категорией
  withCategory(category: string): Logger {
    const categoryLogger = new Logger(this.config);
    categoryLogger.context = { ...this.context, category };
    categoryLogger.logs = this.logs; // Используем тот же массив логов
    return categoryLogger;
  }

  // Создание logger с дополнительным контекстом
  withContext(context: Partial<LogContext>): Logger {
    const contextLogger = new Logger(this.config);
    contextLogger.context = { ...this.context, ...context };
    contextLogger.logs = this.logs; // Используем тот же массив логов
    return contextLogger;
  }

  // Методы управления конфигурацией
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  enableConsole(): void {
    this.config.enableConsole = true;
  }

  disableConsole(): void {
    this.config.enableConsole = false;
  }

  enableStorage(): void {
    this.config.enableStorage = true;
  }

  disableStorage(): void {
    this.config.enableStorage = false;
  }

  enableRemoteLogging(url: string): void {
    this.config.enableRemote = true;
    this.config.remoteUrl = url;
  }

  disableRemoteLogging(): void {
    this.config.enableRemote = false;
  }

  // Методы получения логов
  getLogs(filter?: {
    level?: LogLevel;
    category?: string;
    since?: Date;
    limit?: number;
  }): LogEntry[] {
    let filteredLogs = this.logs;

    if (filter?.level) {
      const minPriority = this.levelPriority[filter.level];
      filteredLogs = filteredLogs.filter(log => 
        this.levelPriority[log.level] >= minPriority
      );
    }

    if (filter?.category) {
      filteredLogs = filteredLogs.filter(log => log.category === filter.category);
    }

    if (filter?.since) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.since!);
    }

    if (filter?.limit) {
      filteredLogs = filteredLogs.slice(-filter.limit);
    }

    return filteredLogs;
  }

  getErrorLogs(): LogEntry[] {
    return this.getLogs({ level: 'error' });
  }

  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Экспорт логов
  exportLogs(format: 'json' | 'csv' | 'txt' = 'json'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(this.logs, null, 2);
      
      case 'csv':
        const headers = ['timestamp', 'level', 'category', 'message', 'userId', 'sessionId'];
        const csvLines = [headers.join(',')];
        
        this.logs.forEach(log => {
          const row = [
            log.timestamp.toISOString(),
            log.level,
            log.category || '',
            `"${log.message.replace(/"/g, '""')}"`,
            log.userId || '',
            log.sessionId || ''
          ];
          csvLines.push(row.join(','));
        });
        
        return csvLines.join('\n');
      
      case 'txt':
        return this.logs.map(log => {
          const timestamp = log.timestamp.toISOString();
          const level = log.level.toUpperCase().padEnd(5);
          const category = log.category ? `[${log.category}]` : '';
          const userId = log.userId ? `[User:${log.userId}]` : '';
          
          let line = `${timestamp} ${level} ${category}${userId} ${log.message}`;
          
          if (log.data) {
            line += `\nData: ${JSON.stringify(log.data)}`;
          }
          
          if (log.stack) {
            line += `\nStack: ${log.stack}`;
          }
          
          return line;
        }).join('\n\n');
      
      default:
        return JSON.stringify(this.logs, null, 2);
    }
  }

  // Очистка логов
  clearLogs(): void {
    this.logs = [];
  }

  clearStoredLogs(): void {
    try {
      localStorage.removeItem('app_error_logs');
    } catch (error) {
      console.error('Failed to clear stored logs:', error);
    }
  }

  // Получение логов из localStorage
  getStoredErrorLogs(): LogEntry[] {
    try {
      const storedLogs = localStorage.getItem('app_error_logs');
      return storedLogs ? JSON.parse(storedLogs) : [];
    } catch (error) {
      console.error('Failed to retrieve stored logs:', error);
      return [];
    }
  }

  // Методы измерения производительности
  time(label: string): void {
    console.time(label);
    this.debug(`Timer started: ${label}`);
  }

  timeEnd(label: string): void {
    console.timeEnd(label);
    this.debug(`Timer ended: ${label}`);
  }

  // Группировка логов
  group(label: string): void {
    console.group(label);
    this.debug(`Group started: ${label}`);
  }

  groupEnd(): void {
    console.groupEnd();
    this.debug('Group ended');
  }

  // Подсчет логов
  count(label?: string): void {
    const countLabel = label || 'default';
    console.count(countLabel);
    this.debug(`Count: ${countLabel}`);
  }

  // Трассировка стека
  trace(message: string): void {
    console.trace(message);
    this.debug(`Trace: ${message}`, { stack: new Error().stack });
  }

  // Статистика логирования
  getStats(): {
    totalLogs: number;
    logsByLevel: Record<LogLevel, number>;
    logsByCategory: Record<string, number>;
    sessionsCount: number;
    usersCount: number;
  } {
    const stats = {
      totalLogs: this.logs.length,
      logsByLevel: {} as Record<LogLevel, number>,
      logsByCategory: {} as Record<string, number>,
      sessionsCount: 0,
      usersCount: 0
    };

    const sessions = new Set<string>();
    const users = new Set<string>();

    // Инициализируем счетчики уровней
    Object.keys(this.levelPriority).forEach(level => {
      stats.logsByLevel[level as LogLevel] = 0;
    });

    this.logs.forEach(log => {
      // Подсчет по уровням
      stats.logsByLevel[log.level]++;

      // Подсчет по категориям
      if (log.category) {
        stats.logsByCategory[log.category] = (stats.logsByCategory[log.category] || 0) + 1;
      }

      // Подсчет сессий
      if (log.sessionId) {
        sessions.add(log.sessionId);
      }

      // Подсчет пользователей
      if (log.userId) {
        users.add(log.userId);
      }
    });

    stats.sessionsCount = sessions.size;
    stats.usersCount = users.size;

    return stats;
  }
}

// Создание глобального экземпляра logger
export const logger = new Logger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  enableConsole: true,
  enableStorage: true,
  enableRemote: false
});

// Специализированные logger-ы для разных частей приложения
export const authLogger = logger.withCategory('auth');
export const apiLogger = logger.withCategory('api');
export const socketLogger = logger.withCategory('socket');
export const webrtcLogger = logger.withCategory('webrtc');
export const uiLogger = logger.withCategory('ui');

// Функции-хелперы для быстрого логирования
export const logError = (message: string, error?: Error | any) => {
  logger.error(message, error);
};

export const logInfo = (message: string, data?: any) => {
  logger.info(message, data);
};

export const logDebug = (message: string, data?: any) => {
  logger.debug(message, data);
};

export const logWarn = (message: string, data?: any) => {
  logger.warn(message, data);
};

// Декораторы для автоматического логирования
export function logMethod(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const className = target.constructor.name;
    const methodName = propertyKey;
    
    logger.debug(`Calling ${className}.${methodName}`, { args });
    
    try {
      const result = originalMethod.apply(this, args);
      
      if (result instanceof Promise) {
        return result
          .then(res => {
            logger.debug(`${className}.${methodName} completed successfully`);
            return res;
          })
          .catch(error => {
            logger.error(`${className}.${methodName} failed`, error);
            throw error;
          });
      }
      
      logger.debug(`${className}.${methodName} completed successfully`);
      return result;
    } catch (error) {
      logger.error(`${className}.${methodName} failed`, error);
      throw error;
    }
  };

  return descriptor;
}

// Функция для логирования производительности
export function logPerformance<T>(
  operation: string,
  func: () => T
): T {
  const startTime = performance.now();
  logger.debug(`Starting performance measurement: ${operation}`);
  
  try {
    const result = func();
    
    if (result instanceof Promise) {
      return result.then(res => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        logger.info(`Performance: ${operation} completed in ${duration.toFixed(2)}ms`);
        return res;
      }).catch(error => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        logger.error(`Performance: ${operation} failed after ${duration.toFixed(2)}ms`, error);
        throw error;
      }) as T;
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    logger.info(`Performance: ${operation} completed in ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    logger.error(`Performance: ${operation} failed after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}

// Константы уровней логирования
export const LOG_LEVELS: Record<LogLevel, LogLevel> = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
  fatal: 'fatal'
};

export default logger;