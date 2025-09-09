/**
 * Центральный экспорт всех утилит backend'а
 */

// Утилиты хеширования
export { HashUtils, default as hashUtils } from './hash';

// Утилиты JWT
export { 
  JWTUtils, 
  default as jwtUtils,
  type TokenPayload,
  type RefreshTokenPayload
} from './jwt';

// Утилиты валидации
export { 
  ValidationUtils, 
  default as validationUtils,
  type ValidationResult,
  type UserValidationData,
  type MessageValidationData
} from './validation';

// Система логирования
export { 
  logger, 
  Logger,
  LogLevel,
  type LogContext
} from './logger';

/**
 * Общие утилиты приложения
 */
export class AppUtils {
  /**
   * Генерация уникального ID
   * @returns уникальный ID
   */
  static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Форматирование даты в ISO строку
   * @param date - дата для форматирования
   * @returns отформатированная дата
   */
  static formatDate(date: Date = new Date()): string {
    return date.toISOString();
  }

  /**
   * Проверка является ли объект пустым
   * @param obj - объект для проверки
   * @returns true если объект пустой
   */
  static isEmpty(obj: any): boolean {
    if (obj === null || obj === undefined) return true;
    if (typeof obj === 'string') return obj.trim().length === 0;
    if (Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
  }

  /**
   * Глубокое клонирование объекта
   * @param obj - объект для клонирования
   * @returns клонированный объект
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
    if (obj instanceof Array) {
      const copy = [] as unknown as T;
      (obj as unknown as any[]).forEach((item, index) => {
        (copy as unknown as any[])[index] = this.deepClone(item);
      });
      return copy;
    }
    if (typeof obj === 'object') {
      const copy = {} as T;
      Object.keys(obj).forEach(key => {
        (copy as any)[key] = this.deepClone((obj as any)[key]);
      });
      return copy;
    }
    return obj;
  }

  /**
   * Задержка выполнения
   * @param ms - миллисекунды задержки
   * @returns Promise
   */
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry функция с экспоненциальной задержкой
   * @param fn - функция для выполнения
   * @param maxAttempts - максимальное количество попыток
   * @param baseDelay - базовая задержка в мс
   * @returns результат функции
   */
  static async retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let attempt = 1;
    
    while (attempt <= maxAttempts) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await this.delay(delay);
        attempt++;
      }
    }
    
    throw new Error('Max attempts reached');
  }

  /**
   * Конвертация строки в slug
   * @param str - строка для конвертации
   * @returns slug строка
   */
  static slugify(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Обрезка строки с многоточием
   * @param str - строка для обрезки
   * @param length - максимальная длина
   * @returns обрезанная строка
   */
  static truncate(str: string, length: number): string {
    if (str.length <= length) return str;
    return str.substring(0, length).trim() + '...';
  }

  /**
   * Форматирование размера файла
   * @param bytes - размер в байтах
   * @returns отформатированная строка
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Генерация случайного числа в диапазоне
   * @param min - минимальное значение
   * @param max - максимальное значение
   * @returns случайное число
   */
  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Проверка типа MIME файла
   * @param mimetype - MIME тип
   * @returns категория файла
   */
  static getFileCategory(mimetype: string): 'image' | 'video' | 'audio' | 'document' | 'other' {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ];
    
    if (documentTypes.includes(mimetype)) return 'document';
    return 'other';
  }

  /**
   * Маскирование email для отображения
   * @param email - email адрес
   * @returns замаскированный email
   */
  static maskEmail(email: string): string {
    const [name, domain] = email.split('@');
    if (name.length <= 2) return email;
    
    const maskedName = name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
    return `${maskedName}@${domain}`;
  }

  /**
   * Проверка окружения разработки
   * @returns true если development
   */
  static isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  /**
   * Проверка окружения продакшена
   * @returns true если production
   */
  static isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  /**
   * Получение версии приложения из package.json
   * @returns версия приложения
   */
  static getAppVersion(): string {
    try {
      const packageJson = require('../../package.json');
      return packageJson.version || '1.0.0';
    } catch (error) {
      return '1.0.0';
    }
  }

  /**
   * Создание объекта ошибки с дополнительными данными
   * @param message - сообщение об ошибке
   * @param code - код ошибки
   * @param data - дополнительные данные
   * @returns объект ошибки
   */
  static createError(message: string, code: string = 'UNKNOWN_ERROR', data?: any): Error & { code: string; data?: any } {
    const error = new Error(message) as Error & { code: string; data?: any };
    error.code = code;
    if (data) error.data = data;
    return error;
  }

  /**
   * Проверка является ли объект Error
   * @param obj - объект для проверки
   * @returns true если объект является Error
   */
  static isError(obj: any): obj is Error {
    return obj instanceof Error || (
      typeof obj === 'object' &&
      obj !== null &&
      typeof obj.message === 'string' &&
      typeof obj.name === 'string'
    );
  }
}

// Экспортируем по умолчанию объект со всеми утилитами
export default {
  HashUtils,
  JWTUtils,
  ValidationUtils,
  AppUtils,
  logger
};