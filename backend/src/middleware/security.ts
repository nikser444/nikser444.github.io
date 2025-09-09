import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss';
import validator from 'validator';
import crypto from 'crypto';

/**
 * Базовые настройки безопасности с helmet
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "wss:", "ws:"],
      mediaSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Отключаем для WebRTC
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

/**
 * Защита от HTTP Parameter Pollution
 */
export const hppMiddleware = hpp({
  whitelist: ['tags', 'participants', 'members'] // Поля, которые могут быть массивами
});

/**
 * Защита от NoSQL инъекций
 */
export const mongoSanitizeMiddleware = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ key, req }) => {
    console.warn(`[SECURITY] Potential NoSQL injection attempt: ${key} in ${req.method} ${req.path}`);
  }
});

/**
 * XSS защита для всех текстовых полей
 */
export const xssProtection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      return xss(value, {
        whiteList: {}, // Не разрешаем никаких HTML тегов
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script']
      });
    }
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    if (value && typeof value === 'object') {
      const sanitized: any = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val);
      }
      return sanitized;
    }
    return value;
  };

  // Санитизируем body
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  // Санитизируем query параметры
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }

  next();
};

/**
 * Валидация и санитизация специфических полей
 */
export const inputSanitization = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.body) {
    // Санитизация email
    if (req.body.email && typeof req.body.email === 'string') {
      req.body.email = validator.normalizeEmail(req.body.email.trim()) || '';
    }

    // Санитизация username
    if (req.body.username && typeof req.body.username === 'string') {
      req.body.username = req.body.username.trim().replace(/[^a-zA-Z0-9_-]/g, '');
    }

    // Санитизация текстовых полей
    const textFields = ['firstName', 'lastName', 'bio', 'status', 'content'];
    textFields.forEach(field => {
      if (req.body[field] && typeof req.body[field] === 'string') {
        req.body[field] = req.body[field].trim();
      }
    });
  }

  next();
};

/**
 * Проверка на подозрительные паттерны в запросах
 */
export const suspiciousActivityDetection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const suspicious = {
    sqlInjection: /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)|('|(\\x27)|(\\x2D\\x2D))/i,
    xssAttempt: /(<script|javascript:|vbscript:|onload=|onerror=|onclick=)/i,
    pathTraversal: /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c)/i,
    commandInjection: /(\||;|&|\$\(|\`)/,
    ldapInjection: /(\*|\(|\)|\\|\/)/
  };

  const checkValue = (value: string): string[] => {
    const detected: string[] = [];
    for (const [type, pattern] of Object.entries(suspicious)) {
      if (pattern.test(value)) {
        detected.push(type);
      }
    }
    return detected;
  };

  const scanObject = (obj: any, path = ''): string[] => {
    let detections: string[] = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'string') {
        const detected = checkValue(value);
        if (detected.length > 0) {
          detections = [...detections, ...detected.map(d => `${d} in ${currentPath}`)];
        }
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'string') {
            const detected = checkValue(item);
            if (detected.length > 0) {
              detections = [...detections, ...detected.map(d => `${d} in ${currentPath}[${index}]`)];
            }
          } else if (typeof item === 'object' && item !== null) {
            detections = [...detections, ...scanObject(item, `${currentPath}[${index}]`)];
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        detections = [...detections, ...scanObject(value, currentPath)];
      }
    }
    
    return detections;
  };

  let allDetections: string[] = [];

  // Проверяем body
  if (req.body && typeof req.body === 'object') {
    allDetections = [...allDetections, ...scanObject(req.body, 'body')];
  }

  // Проверяем query параметры
  if (req.query && typeof req.query === 'object') {
    allDetections = [...allDetections, ...scanObject(req.query, 'query')];
  }

  // Проверяем headers на подозрительную активность
  const suspiciousHeaders = ['user-agent', 'referer', 'x-forwarded-for'];
  suspiciousHeaders.forEach(header => {
    const value = req.get(header);
    if (value) {
      const detected = checkValue(value);
      if (detected.length > 0) {
        allDetections = [...allDetections, ...detected.map(d => `${d} in header.${header}`)];
      }
    }
  });

  if (allDetections.length > 0) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const userId = (req as any).user?.id || 'anonymous';
    
    console.warn(`[SECURITY] Suspicious activity detected:`, {
      ip,
      userId,
      userAgent,
      path: req.path,
      method: req.method,
      detections: allDetections
    });

    // В продакшене можно заблокировать такие запросы
    if (process.env.NODE_ENV === 'production' && allDetections.length > 2) {
      res.status(400).json({
        success: false,
        message: 'Запрос содержит недопустимые данные'
      });
      return;
    }
  }

  next();
};

/**
 * Middleware для проверки Content-Type
 */
export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const contentType = req.get('Content-Type');
      
      if (!contentType) {
        res.status(400).json({
          success: false,
          message: 'Content-Type header обязателен'
        });
        return;
      }

      const isAllowed = allowedTypes.some(type => contentType.includes(type));
      
      if (!isAllowed) {
        res.status(415).json({
          success: false,
          message: 'Неподдерживаемый Content-Type'
        });
        return;
      }
    }
    
    next();
  };
};

/**
 * Middleware для добавления nonce в CSP
 */
export const addCSPNonce = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const nonce = crypto.randomBytes(16).toString('base64');
  (req as any).nonce = nonce;
  res.locals.nonce = nonce;
  next();
};

/**
 * Middleware для проверки User-Agent
 */
export const validateUserAgent = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const userAgent = req.get('User-Agent');
  
  if (!userAgent) {
    res.status(400).json({
      success: false,
      message: 'User-Agent header обязателен'
    });
    return;
  }

  // Проверяем на подозрительные User-Agent'ы
  const suspiciousPatterns = [
    /curl/i,
    /wget/i,
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i
  ];

  // В продакшене можем блокировать подозрительные User-Agent'ы
  if (process.env.NODE_ENV === 'production') {
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
    
    if (isSuspicious) {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      console.warn(`[SECURITY] Suspicious User-Agent: ${userAgent} from IP: ${ip}`);
      
      res.status(403).json({
        success: false,
        message: 'Доступ запрещен'
      });
      return;
    }
  }

  next();
};

/**
 * Middleware для проверки размера запроса
 */
export const validateRequestSize = (maxSize: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.get('Content-Length') || '0');
    
    if (contentLength > maxSize) {
      res.status(413).json({
        success: false,
        message: 'Размер запроса слишком большой'
      });
      return;
    }
    
    next();
  };
};

/**
 * Middleware для защиты от CSRF
 */
export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Проверяем CSRF токен только для state-changing операций
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const csrfToken = req.get('X-CSRF-Token') || req.body.csrfToken;
    const sessionToken = (req as any).session?.csrfToken;
    
    // Для API с JWT токенами CSRF менее критичен, но всё же проверяем
    if (req.get('Authorization')) {
      // Если есть Authorization header, считаем что это API запрос
      next();
      return;
    }
    
    if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
      res.status(403).json({
        success: false,
        message: 'CSRF токен недействителен'
      });
      return;
    }
  }
  
  next();
};

/**
 * Middleware для логирования безопасности
 */
export const securityLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();
  const originalSend = res.send;
  
  res.send = function(body: any) {
    const responseTime = Date.now() - startTime;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const userId = (req as any).user?.id || 'anonymous';
    
    // Логируем подозрительные коды ответов
    if (res.statusCode >= 400) {
      console.warn(`[SECURITY] ${res.statusCode} ${req.method} ${req.path}`, {
        ip,
        userId,
        userAgent,
        responseTime,
        contentLength: req.get('Content-Length'),
        referer: req.get('Referer')
      });
    }
    
    // Логируем медленные запросы (возможная атака)
    if (responseTime > 5000) {
      console.warn(`[SECURITY] Slow request: ${responseTime}ms for ${req.method} ${req.path}`, {
        ip,
        userId,
        userAgent
      });
    }
    
    return originalSend.call(this, body);
  };
  
  next();
};

/**
 * Middleware для блокировки IP адресов
 */
const blockedIPs = new Set<string>();

export const ipBlacklist = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const ip = req.ip || req.connection.remoteAddress || '';
  
  if (blockedIPs.has(ip)) {
    res.status(403).json({
      success: false,
      message: 'IP адрес заблокирован'
    });
    return;
  }
  
  next();
};

/**
 * Функция для добавления IP в черный список
 */
export const blockIP = (ip: string): void => {
  blockedIPs.add(ip);
  console.warn(`[SECURITY] IP ${ip} добавлен в черный список`);
};

/**
 * Функция для удаления IP из черного списка
 */
export const unblockIP = (ip: string): void => {
  blockedIPs.delete(ip);
  console.info(`[SECURITY] IP ${ip} удален из черного списка`);
};

/**
 * Middleware для проверки геолокации (если нужно)
 */
export const geoLocation = (allowedCountries: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Здесь можно добавить логику проверки геолокации по IP
    // Например, используя сервис MaxMind или подобный
    
    // Пример заглушки:
    const country = req.get('CloudFront-Viewer-Country') || 'US';
    
    if (allowedCountries.length > 0 && !allowedCountries.includes(country)) {
      res.status(403).json({
        success: false,
        message: 'Доступ из вашей страны ограничен'
      });
      return;
    }
    
    next();
  };
};

/**
 * Middleware для проверки SSL/TLS
 */
export const requireHTTPS = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('X-Forwarded-Proto') !== 'https') {
    res.redirect(301, `https://${req.get('Host')}${req.url}`);
    return;
  }
  
  next();
};

/**
 * Middleware для добавления заголовков безопасности
 */
export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Предотвращаем кеширование чувствительных данных
  if (req.path.includes('/api/')) {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
  }

  // Дополнительные заголовки безопасности
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  });

  next();
};

/**
 * Комбинированный middleware безопасности
 */
export const securityMiddleware = [
  helmetMiddleware,
  requireHTTPS,
  securityHeaders,
  hppMiddleware,
  mongoSanitizeMiddleware,
  xssProtection,
  inputSanitization,
  suspiciousActivityDetection,
  ipBlacklist,
  securityLogger
];