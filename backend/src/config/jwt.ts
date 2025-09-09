import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';

// Загрузка переменных окружения
dotenv.config();

// Интерфейс для payload JWT токена
export interface TokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role?: string;
}

// Конфигурация JWT
export const jwtConfig = {
  // Секретные ключи
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'access_secret_key_messenger_2024',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'refresh_secret_key_messenger_2024',
  
  // Время жизни токенов
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m', // 15 минут
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d', // 7 дней
  
  // Настройки
  issuer: process.env.JWT_ISSUER || 'messenger-app',
  audience: process.env.JWT_AUDIENCE || 'messenger-users',
  
  // Алгоритм подписи
  algorithm: 'HS256' as const,
};

// Функция для генерации access токена
export const generateAccessToken = (payload: Omit<TokenPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, jwtConfig.accessTokenSecret, {
    expiresIn: jwtConfig.accessTokenExpiry,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
    algorithm: jwtConfig.algorithm,
  });
};

// Функция для генерации refresh токена
export const generateRefreshToken = (payload: Omit<TokenPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, jwtConfig.refreshTokenSecret, {
    expiresIn: jwtConfig.refreshTokenExpiry,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
    algorithm: jwtConfig.algorithm,
  });
};

// Функция для верификации access токена
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, jwtConfig.accessTokenSecret, {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
      algorithms: [jwtConfig.algorithm],
    }) as TokenPayload;
  } catch (error) {
    throw new Error('Недействительный access токен');
  }
};

// Функция для верификации refresh токена
export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, jwtConfig.refreshTokenSecret, {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
      algorithms: [jwtConfig.algorithm],
    }) as TokenPayload;
  } catch (error) {
    throw new Error('Недействительный refresh токен');
  }
};

// Функция для декодирования токена без верификации
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch (error) {
    return null;
  }
};

// Функция для получения времени истечения токена
export const getTokenExpiration = (token: string): Date | null => {
  const decoded = decodeToken(token);
  if (decoded && decoded.exp) {
    return new Date(decoded.exp * 1000);
  }
  return null;
};

// Функция для проверки истечения токена
export const isTokenExpired = (token: string): boolean => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;
  return expiration.getTime() < Date.now();
};

// Функция для генерации пары токенов
export const generateTokenPair = (payload: Omit<TokenPayload, 'iat' | 'exp'>) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};