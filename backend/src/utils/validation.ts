import validator from 'validator';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface UserValidationData {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}

export interface MessageValidationData {
  content?: string;
  chatId?: string;
}

/**
 * Утилиты для валидации данных
 */
export class ValidationUtils {
  private static readonly PASSWORD_MIN_LENGTH = 8;
  private static readonly PASSWORD_MAX_LENGTH = 128;
  private static readonly USERNAME_MIN_LENGTH = 3;
  private static readonly USERNAME_MAX_LENGTH = 30;
  private static readonly NAME_MIN_LENGTH = 2;
  private static readonly NAME_MAX_LENGTH = 50;
  private static readonly MESSAGE_MAX_LENGTH = 4000;

  /**
   * Валидация email адреса
   * @param email - email для проверки
   * @returns результат валидации
   */
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];

    if (!email) {
      errors.push('Email обязателен');
    } else if (!validator.isEmail(email)) {
      errors.push('Неверный формат email');
    } else if (email.length > 254) {
      errors.push('Email слишком длинный');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Валидация пароля
   * @param password - пароль для проверки
   * @returns результат валидации
   */
  static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];

    if (!password) {
      errors.push('Пароль обязателен');
    } else {
      if (password.length < this.PASSWORD_MIN_LENGTH) {
        errors.push(`Пароль должен содержать минимум ${this.PASSWORD_MIN_LENGTH} символов`);
      }
      
      if (password.length > this.PASSWORD_MAX_LENGTH) {
        errors.push(`Пароль должен содержать максимум ${this.PASSWORD_MAX_LENGTH} символов`);
      }

      if (!/[a-z]/.test(password)) {
        errors.push('Пароль должен содержать строчные буквы');
      }

      if (!/[A-Z]/.test(password)) {
        errors.push('Пароль должен содержать заглавные буквы');
      }

      if (!/\d/.test(password)) {
        errors.push('Пароль должен содержать цифры');
      }

      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Пароль должен содержать специальные символы');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Валидация имени пользователя
   * @param username - имя пользователя
   * @returns результат валидации
   */
  static validateUsername(username: string): ValidationResult {
    const errors: string[] = [];

    if (!username) {
      errors.push('Имя пользователя обязательно');
    } else {
      if (username.length < this.USERNAME_MIN_LENGTH) {
        errors.push(`Имя пользователя должно содержать минимум ${this.USERNAME_MIN_LENGTH} символа`);
      }

      if (username.length > this.USERNAME_MAX_LENGTH) {
        errors.push(`Имя пользователя должно содержать максимум ${this.USERNAME_MAX_LENGTH} символов`);
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        errors.push('Имя пользователя может содержать только буквы, цифры, подчеркивания и дефисы');
      }

      if (username.startsWith('_') || username.startsWith('-')) {
        errors.push('Имя пользователя не может начинаться с подчеркивания или дефиса');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Валидация имени/фамилии
   * @param name - имя для проверки
   * @param fieldName - название поля
   * @returns результат валидации
   */
  static validateName(name: string, fieldName: string = 'Имя'): ValidationResult {
    const errors: string[] = [];

    if (!name) {
      errors.push(`${fieldName} обязательно`);
    } else {
      if (name.length < this.NAME_MIN_LENGTH) {
        errors.push(`${fieldName} должно содержать минимум ${this.NAME_MIN_LENGTH} символа`);
      }

      if (name.length > this.NAME_MAX_LENGTH) {
        errors.push(`${fieldName} должно содержать максимум ${this.NAME_MAX_LENGTH} символов`);
      }

      if (!/^[a-zA-Zа-яА-Я\s-']+$/.test(name)) {
        errors.push(`${fieldName} может содержать только буквы, пробелы, дефисы и апострофы`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Валидация UUID
   * @param id - ID для проверки
   * @returns результат валидации
   */
  static validateUUID(id: string): ValidationResult {
    const errors: string[] = [];

    if (!id) {
      errors.push('ID обязателен');
    } else if (!validator.isUUID(id)) {
      errors.push('Неверный формат ID');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Валидация содержимого сообщения
   * @param content - содержимое сообщения
   * @returns результат валидации
   */
  static validateMessageContent(content: string): ValidationResult {
    const errors: string[] = [];

    if (!content || content.trim().length === 0) {
      errors.push('Сообщение не может быть пустым');
    } else if (content.length > this.MESSAGE_MAX_LENGTH) {
      errors.push(`Сообщение не может содержать более ${this.MESSAGE_MAX_LENGTH} символов`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Валидация данных пользователя при регистрации
   * @param data - данные пользователя
   * @returns результат валидации
   */
  static validateUserRegistration(data: UserValidationData): ValidationResult {
    const allErrors: string[] = [];

    if (data.email) {
      const emailValidation = this.validateEmail(data.email);
      allErrors.push(...emailValidation.errors);
    }

    if (data.password) {
      const passwordValidation = this.validatePassword(data.password);
      allErrors.push(...passwordValidation.errors);
    }

    if (data.firstName) {
      const firstNameValidation = this.validateName(data.firstName, 'Имя');
      allErrors.push(...firstNameValidation.errors);
    }

    if (data.lastName) {
      const lastNameValidation = this.validateName(data.lastName, 'Фамилия');
      allErrors.push(...lastNameValidation.errors);
    }

    if (data.username) {
      const usernameValidation = this.validateUsername(data.username);
      allErrors.push(...usernameValidation.errors);
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors
    };
  }

  /**
   * Валидация данных сообщения
   * @param data - данные сообщения
   * @returns результат валидации
   */
  static validateMessage(data: MessageValidationData): ValidationResult {
    const allErrors: string[] = [];

    if (data.content) {
      const contentValidation = this.validateMessageContent(data.content);
      allErrors.push(...contentValidation.errors);
    }

    if (data.chatId) {
      const chatIdValidation = this.validateUUID(data.chatId);
      allErrors.push(...chatIdValidation.errors);
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors
    };
  }

  /**
   * Очистка и нормализация строки
   * @param str - строка для очистки
   * @returns очищенная строка
   */
  static sanitizeString(str: string): string {
    return validator.escape(str.trim());
  }

  /**
   * Проверка на XSS
   * @param str - строка для проверки
   * @returns true если строка безопасна
   */
  static isXSSSafe(str: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
    ];

    return !xssPatterns.some(pattern => pattern.test(str));
  }

  /**
   * Валидация размера файла
   * @param size - размер файла в байтах
   * @param maxSize - максимальный размер в байтах
   * @returns результат валидации
   */
  static validateFileSize(size: number, maxSize: number = 50 * 1024 * 1024): ValidationResult {
    const errors: string[] = [];

    if (size > maxSize) {
      errors.push(`Размер файла не должен превышать ${Math.round(maxSize / (1024 * 1024))} MB`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Валидация типа файла
   * @param mimetype - MIME тип файла
   * @param allowedTypes - разрешенные типы
   * @returns результат валидации
   */
  static validateFileType(mimetype: string, allowedTypes: string[]): ValidationResult {
    const errors: string[] = [];

    if (!allowedTypes.includes(mimetype)) {
      errors.push(`Тип файла ${mimetype} не разрешен`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default ValidationUtils;