import { BaseEntity, UserStatus, UserSettings, FileInfo } from './Base';

// Основной интерфейс пользователя
export interface User extends BaseEntity {
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: FileInfo;
  status: UserStatus;
  lastSeen: Date;
  isOnline: boolean;
  bio?: string;
  phone?: string;
  dateOfBirth?: Date;
  location?: string;
  settings: UserSettings;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  twoFactorEnabled: boolean;
  language: string;
  timezone: string;
}

// Публичная информация о пользователе (без приватных данных)
export interface PublicUser {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: FileInfo;
  status: UserStatus;
  lastSeen: Date;
  isOnline: boolean;
  bio?: string;
}

// Полное имя пользователя
export interface UserFullName {
  firstName?: string;
  lastName?: string;
  displayName: string;
}

// Статус пользователя с дополнительной информацией
export interface UserStatusInfo {
  status: UserStatus;
  customMessage?: string;
  lastSeen: Date;
  isOnline: boolean;
}

// Данные для создания пользователя
export interface CreateUserData {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: Date;
}

// Данные для обновления пользователя
export interface UpdateUserData {
  username?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  phone?: string;
  dateOfBirth?: Date;
  location?: string;
  language?: string;
  timezone?: string;
}

// Данные для смены пароля
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Данные для восстановления пароля
export interface ResetPasswordData {
  email: string;
  token?: string;
  newPassword?: string;
}

// Данные авторизации
export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Данные регистрации
export interface RegisterData extends CreateUserData {
  confirmPassword: string;
  acceptTerms: boolean;
}

// Ответ после авторизации
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Токены обновления
export interface RefreshTokenData {
  refreshToken: string;
}

// Результат поиска пользователей
export interface UserSearchResult {
  users: PublicUser[];
  total: number;
  hasMore: boolean;
}

// Параметры поиска пользователей
export interface UserSearchParams {
  query: string;
  limit?: number;
  offset?: number;
  excludeIds?: string[];
}

// Статистика пользователя
export interface UserStats {
  totalMessages: number;
  totalChats: number;
  totalFriends: number;
  totalCalls: number;
  callDuration: number;
  registrationDate: Date;
  lastActivity: Date;
}

// Активность пользователя
export interface UserActivity {
  userId: string;
  action: string;
  details?: any;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

// Сессия пользователя
export interface UserSession {
  id: string;
  userId: string;
  deviceInfo: string;
  ipAddress: string;
  location?: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

// Настройки безопасности
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  backupCodes: string[];
  trustedDevices: string[];
  loginAlerts: boolean;
  sessionTimeout: number;
}

// Блокировка пользователя
export interface UserBlock {
  id: string;
  blockerId: string;
  blockedId: string;
  reason?: string;
  createdAt: Date;
}

// Жалоба на пользователя
export interface UserReport {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: Date;
  resolvedAt?: Date;
}

// Верификация email
export interface EmailVerification {
  email: string;
  token: string;
  expiresAt: Date;
}

// Верификация телефона
export interface PhoneVerification {
  phone: string;
  code: string;
  expiresAt: Date;
}

// Контакты пользователя
export interface UserContacts {
  userId: string;
  contacts: {
    name: string;
    phone: string;
    email?: string;
  }[];
  syncedAt: Date;
}

// Экспорт всех типов пользователя
export type {
  User,
  PublicUser,
  UserFullName,
  UserStatusInfo,
  CreateUserData,
  UpdateUserData,
  ChangePasswordData,
  ResetPasswordData,
  LoginData,
  RegisterData,
  AuthResponse,
  RefreshTokenData,
  UserSearchResult,
  UserSearchParams,
  UserStats,
  UserActivity,
  UserSession,
  SecuritySettings,
  UserBlock,
  UserReport,
  EmailVerification,
  PhoneVerification,
  UserContacts
};