// backend/src/services/AuthService.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { EmailService } from './EmailService';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/jwt';
import { IUser } from '../types/User';

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  fullName?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: IUser;
  token: string;
}

export class AuthService {
  private static saltRounds = 12;

  static async register(data: RegisterData): Promise<AuthResponse> {
    const { email, password, username, fullName } = data;

    // Проверяем, существует ли пользователь с таким email
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new Error('Пользователь с таким email уже существует');
    }

    // Проверяем, существует ли пользователь с таким username
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      throw new Error('Пользователь с таким именем уже существует');
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, this.saltRounds);

    // Создаем пользователя
    const user = await User.create({
      email,
      password: hashedPassword,
      username,
      fullName: fullName || username,
      avatar: null,
      isOnline: false,
      lastSeen: new Date(),
      status: 'offline',
      isEmailVerified: false,
    });

    // Отправляем приветственное письмо
    try {
      await EmailService.sendWelcomeEmail(user.email, user.username);
    } catch (error) {
      console.error('Ошибка отправки приветственного письма:', error);
    }

    // Генерируем токен
    const token = this.generateToken(user);

    return {
      user: this.formatUser(user),
      token,
    };
  }

  static async login(data: LoginData): Promise<AuthResponse> {
    const { email, password } = data;

    // Находим пользователя
    const user = await User.findByEmail(email);
    if (!user) {
      throw new Error('Неверный email или пароль');
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Неверный email или пароль');
    }

    // Обновляем статус пользователя
    await User.update(user.id, {
      isOnline: true,
      lastSeen: new Date(),
      status: 'online',
    });

    // Генерируем токен
    const token = this.generateToken(user);

    return {
      user: this.formatUser(user),
      token,
    };
  }

  static async logout(userId: string): Promise<void> {
    await User.update(userId, {
      isOnline: false,
      lastSeen: new Date(),
      status: 'offline',
    });
  }

  static async refreshToken(token: string): Promise<AuthResponse> {
    const decoded = this.verifyToken(token);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      throw new Error('Пользователь не найден');
    }

    const newToken = this.generateToken(user);

    return {
      user: this.formatUser(user),
      token: newToken,
    };
  }

  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Пользователь не найден');
    }

    // Проверяем текущий пароль
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Неверный текущий пароль');
    }

    // Хешируем новый пароль
    const hashedNewPassword = await bcrypt.hash(newPassword, this.saltRounds);

    // Обновляем пароль
    await User.update(userId, {
      password: hashedNewPassword,
    });
  }

  static async resetPassword(email: string): Promise<void> {
    const user = await User.findByEmail(email);
    if (!user) {
      throw new Error('Пользователь с таким email не найден');
    }

    // Генерируем временный пароль
    const tempPassword = this.generateTempPassword();
    const hashedTempPassword = await bcrypt.hash(tempPassword, this.saltRounds);

    // Обновляем пароль в БД
    await User.update(user.id, {
      password: hashedTempPassword,
    });

    // Отправляем новый пароль по email
    await EmailService.sendPasswordResetEmail(user.email, tempPassword);
  }

  static async verifyEmail(userId: string): Promise<void> {
    await User.update(userId, {
      isEmailVerified: true,
    });
  }

  static generateToken(user: any): string {
    const payload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }

  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Недействительный токен');
    }
  }

  private static formatUser(user: any): IUser {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      avatar: user.avatar,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private static generateTempPassword(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  static async getUserByToken(token: string): Promise<IUser> {
    const decoded = this.verifyToken(token);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      throw new Error('Пользователь не найден');
    }

    return this.formatUser(user);
  }
}