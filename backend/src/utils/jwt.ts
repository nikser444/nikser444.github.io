import jwt, { JwtPayload } from 'jsonwebtoken';
import { config } from '../config';

export interface TokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role?: string;
}

export interface RefreshTokenPayload extends JwtPayload {
  userId: string;
  tokenVersion?: number;
}

/**
 * Утилиты для работы с JWT токенами
 */
export class JWTUtils {
  private static readonly ACCESS_TOKEN_EXPIRES_IN = '15m';
  private static readonly REFRESH_TOKEN_EXPIRES_IN = '7d';
  private static readonly RESET_TOKEN_EXPIRES_IN = '1h';

  /**
   * Генерация access токена
   * @param payload - данные для токена
   * @returns access токен
   */
  static generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
      issuer: 'messenger-app',
      audience: 'messenger-users'
    });
  }

  /**
   * Генерация refresh токена
   * @param payload - данные для токена
   * @returns refresh токен
   */
  static generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
      issuer: 'messenger-app',
      audience: 'messenger-users'
    });
  }

  /**
   * Генерация токена для сброса пароля
   * @param userId - ID пользователя
   * @returns токен для сброса пароля
   */
  static generateResetToken(userId: string): string {
    return jwt.sign({ userId }, config.jwt.resetSecret, {
      expiresIn: this.RESET_TOKEN_EXPIRES_IN,
      issuer: 'messenger-app',
      audience: 'messenger-users'
    });
  }

  /**
   * Верификация access токена
   * @param token - токен для верификации
   * @returns декодированный payload
   */
  static verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwt.accessSecret, {
        issuer: 'messenger-app',
        audience: 'messenger-users'
      }) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  /**
   * Верификация refresh токена
   * @param token - токен для верификации
   * @returns декодированный payload
   */
  static verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return jwt.verify(token, config.jwt.refreshSecret, {
        issuer: 'messenger-app',
        audience: 'messenger-users'
      }) as RefreshTokenPayload;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Верификация токена сброса пароля
   * @param token - токен для верификации
   * @returns декодированный payload
   */
  static verifyResetToken(token: string): { userId: string } {
    try {
      return jwt.verify(token, config.jwt.resetSecret, {
        issuer: 'messenger-app',
        audience: 'messenger-users'
      }) as { userId: string };
    } catch (error) {
      throw new Error('Invalid reset token');
    }
  }

  /**
   * Декодирование токена без верификации
   * @param token - токен для декодирования
   * @returns декодированный payload или null
   */
  static decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Проверка истечения токена
   * @param token - токен для проверки
   * @returns true если токен истек
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Получение времени истечения токена
   * @param token - токен
   * @returns время истечения в секундах
   */
  static getTokenExpiration(token: string): number | null {
    try {
      const decoded = this.decodeToken(token);
      return decoded?.exp || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Извлечение токена из заголовка Authorization
   * @param authHeader - заголовок авторизации
   * @returns токен или null
   */
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Генерация пары токенов
   * @param userId - ID пользователя
   * @param email - email пользователя
   * @param role - роль пользователя
   * @param tokenVersion - версия токена для refresh
   * @returns объект с access и refresh токенами
   */
  static generateTokenPair(
    userId: string, 
    email: string, 
    role?: string, 
    tokenVersion?: number
  ): { accessToken: string; refreshToken: string } {
    const accessToken = this.generateAccessToken({ userId, email, role });
    const refreshToken = this.generateRefreshToken({ userId, tokenVersion });
    
    return { accessToken, refreshToken };
  }
}

export default JWTUtils;