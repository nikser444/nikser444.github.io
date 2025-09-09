export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PasswordValidationOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
}

export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!email) {
    errors.push('Email обязателен');
    return { isValid: false, errors };
  }

  if (typeof email !== 'string') {
    errors.push('Email должен быть строкой');
    return { isValid: false, errors };
  }

  const emailTrimmed = email.trim();
  
  if (!emailTrimmed) {
    errors.push('Email не может быть пустым');
    return { isValid: false, errors };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(emailTrimmed)) {
    errors.push('Некорректный формат email');
  }

  if (emailTrimmed.length > 320) {
    errors.push('Email слишком длинный');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Password validation
export const validatePassword = (
  password: string, 
  options: PasswordValidationOptions = {}
): ValidationResult => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true
  } = options;

  const errors: string[] = [];
  
  if (!password) {
    errors.push('Пароль обязателен');
    return { isValid: false, errors };
  }

  if (typeof password !== 'string') {
    errors.push('Пароль должен быть строкой');
    return { isValid: false, errors };
  }

  if (password.length < minLength) {
    errors.push(`Пароль должен содержать минимум ${minLength} символов`);
  }

  if (password.length > 128) {
    errors.push('Пароль слишком длинный (максимум 128 символов)');
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Пароль должен содержать минимум одну заглавную букву');
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Пароль должен содержать минимум одну строчную букву');
  }

  if (requireNumbers && !/\d/.test(password)) {
    errors.push('Пароль должен содержать минимум одну цифру');
  }

  if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Пароль должен содержать минимум один специальный символ');
  }

  // Проверка на общие слабые пароли
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Используйте более надежный пароль');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Password confirmation validation
export const validatePasswordConfirmation = (
  password: string,
  confirmPassword: string
): ValidationResult => {
  const errors: string[] = [];

  if (!confirmPassword) {
    errors.push('Подтверждение пароля обязательно');
    return { isValid: false, errors };
  }

  if (password !== confirmPassword) {
    errors.push('Пароли не совпадают');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Username validation
export const validateUsername = (username: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!username) {
    errors.push('Имя пользователя обязательно');
    return { isValid: false, errors };
  }

  if (typeof username !== 'string') {
    errors.push('Имя пользователя должно быть строкой');
    return { isValid: false, errors };
  }

  const usernameTrimmed = username.trim();
  
  if (!usernameTrimmed) {
    errors.push('Имя пользователя не может быть пустым');
    return { isValid: false, errors };
  }

  if (usernameTrimmed.length < 3) {
    errors.push('Имя пользователя должно содержать минимум 3 символа');
  }

  if (usernameTrimmed.length > 30) {
    errors.push('Имя пользователя слишком длинное (максимум 30 символов)');
  }

  const usernameRegex = /^[a-zA-Z0-9._-]+$/;
  if (!usernameRegex.test(usernameTrimmed)) {
    errors.push('Имя пользователя может содержать только буквы, цифры, точки, подчеркивания и дефисы');
  }

  if (usernameTrimmed.startsWith('.') || usernameTrimmed.endsWith('.')) {
    errors.push('Имя пользователя не может начинаться или заканчиваться точкой');
  }

  if (usernameTrimmed.includes('..')) {
    errors.push('Имя пользователя не может содержать две точки подряд');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Display name validation
export const validateDisplayName = (displayName: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!displayName) {
    errors.push('Отображаемое имя обязательно');
    return { isValid: false, errors };
  }

  if (typeof displayName !== 'string') {
    errors.push('Отображаемое имя должно быть строкой');
    return { isValid: false, errors };
  }

  const nameTrimmed = displayName.trim();
  
  if (!nameTrimmed) {
    errors.push('Отображаемое имя не может быть пустым');
    return { isValid: false, errors };
  }

  if (nameTrimmed.length < 2) {
    errors.push('Отображаемое имя должно содержать минимум 2 символа');
  }

  if (nameTrimmed.length > 50) {
    errors.push('Отображаемое имя слишком длинное (максимум 50 символов)');
  }

  // Проверка на недопустимые символы
  const invalidChars = /[<>"/\\&']/;
  if (invalidChars.test(nameTrimmed)) {
    errors.push('Отображаемое имя содержит недопустимые символы');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Message content validation
export const validateMessageContent = (content: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!content) {
    errors.push('Сообщение не может быть пустым');
    return { isValid: false, errors };
  }

  if (typeof content !== 'string') {
    errors.push('Содержимое сообщения должно быть строкой');
    return { isValid: false, errors };
  }

  const contentTrimmed = content.trim();
  
  if (!contentTrimmed) {
    errors.push('Сообщение не может быть пустым');
    return { isValid: false, errors };
  }

  if (contentTrimmed.length > 4000) {
    errors.push('Сообщение слишком длинное (максимум 4000 символов)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Chat name validation
export const validateChatName = (chatName: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!chatName) {
    errors.push('Название чата обязательно');
    return { isValid: false, errors };
  }

  if (typeof chatName !== 'string') {
    errors.push('Название чата должно быть строкой');
    return { isValid: false, errors };
  }

  const nameTrimmed = chatName.trim();
  
  if (!nameTrimmed) {
    errors.push('Название чата не может быть пустым');
    return { isValid: false, errors };
  }

  if (nameTrimmed.length < 2) {
    errors.push('Название чата должно содержать минимум 2 символа');
  }

  if (nameTrimmed.length > 100) {
    errors.push('Название чата слишком длинное (максимум 100 символов)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// File validation
export const validateFile = (
  file: File,
  options: FileValidationOptions = {}
): ValidationResult => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB по умолчанию
    allowedTypes = [],
    allowedExtensions = []
  } = options;

  const errors: string[] = [];

  if (!file) {
    errors.push('Файл обязателен');
    return { isValid: false, errors };
  }

  if (!(file instanceof File)) {
    errors.push('Некорректный файл');
    return { isValid: false, errors };
  }

  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    errors.push(`Размер файла не должен превышать ${maxSizeMB}MB`);
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push(`Неподдерживаемый тип файла: ${file.type}`);
  }

  if (allowedExtensions.length > 0) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      errors.push(`Неподдерживаемое расширение файла: ${extension}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Image file validation
export const validateImageFile = (file: File): ValidationResult => {
  return validateFile(file, {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp']
  });
};

// Avatar validation
export const validateAvatar = (file: File): ValidationResult => {
  return validateFile(file, {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    allowedExtensions: ['jpg', 'jpeg', 'png']
  });
};

// Document file validation
export const validateDocumentFile = (file: File): ValidationResult => {
  return validateFile(file, {
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ],
    allowedExtensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt']
  });
};

// URL validation
export const validateUrl = (url: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!url) {
    errors.push('URL обязателен');
    return { isValid: false, errors };
  }

  if (typeof url !== 'string') {
    errors.push('URL должен быть строкой');
    return { isValid: false, errors };
  }

  try {
    new URL(url);
  } catch {
    errors.push('Некорректный формат URL');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Phone number validation
export const validatePhoneNumber = (phone: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!phone) {
    errors.push('Номер телефона обязателен');
    return { isValid: false, errors };
  }

  if (typeof phone !== 'string') {
    errors.push('Номер телефона должен быть строкой');
    return { isValid: false, errors };
  }

  const phoneTrimmed = phone.trim();
  
  if (!phoneTrimmed) {
    errors.push('Номер телефона не может быть пустым');
    return { isValid: false, errors };
  }

  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  const cleanPhone = phoneTrimmed.replace(/[\s\-\(\)]/g, '');
  
  if (!phoneRegex.test(cleanPhone)) {
    errors.push('Некорректный формат номера телефона');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Age validation
export const validateAge = (age: number): ValidationResult => {
  const errors: string[] = [];
  
  if (age === undefined || age === null) {
    errors.push('Возраст обязателен');
    return { isValid: false, errors };
  }

  if (typeof age !== 'number' || isNaN(age)) {
    errors.push('Возраст должен быть числом');
    return { isValid: false, errors };
  }

  if (age < 13) {
    errors.push('Возраст должен быть не менее 13 лет');
  }

  if (age > 120) {
    errors.push('Некорректный возраст');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Form validation helper
export const validateForm = <T extends Record<string, any>>(
  data: T,
  validators: Record<keyof T, (value: any) => ValidationResult>
): { isValid: boolean; errors: Record<keyof T, string[]> } => {
  const errors = {} as Record<keyof T, string[]>;
  let isValid = true;

  for (const field in validators) {
    if (validators.hasOwnProperty(field)) {
      const result = validators[field](data[field]);
      if (!result.isValid) {
        errors[field] = result.errors;
        isValid = false;
      }
    }
  }

  return { isValid, errors };
};

// Multiple values validation
export const validateMultiple = (...validations: ValidationResult[]): ValidationResult => {
  const allErrors = validations.flatMap(v => v.errors);
  return {
    isValid: validations.every(v => v.isValid),
    errors: allErrors
  };
};

// Sanitization helpers
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>"/\\]/g, '') // Remove potentially dangerous characters
    .slice(0, 1000); // Limit length
};

export const sanitizeHtml = (html: string): string => {
  if (typeof html !== 'string') return '';
  
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\//g, '&#47;');
};

// Validation constants
export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128
  },
  DISPLAY_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50
  },
  MESSAGE: {
    MAX_LENGTH: 4000
  },
  CHAT_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100
  },
  FILE: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    AVATAR_MAX_SIZE: 2 * 1024 * 1024, // 2MB
    DOCUMENT_MAX_SIZE: 20 * 1024 * 1024 // 20MB
  }
} as const;