// frontend/src/services/authService.ts
import { api } from './api';
import { User } from '../types/user';
import { ApiResponse } from '../types/api';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

class AuthService {
  private readonly ENDPOINTS = {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    ME: '/auth/me',
  };

  // Вход в систему
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>(this.ENDPOINTS.LOGIN, data);
      
      if (response.success && response.data) {
        this.setTokens(response.data.token, response.data.refreshToken);
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка входа в систему');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Регистрация
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>(this.ENDPOINTS.REGISTER, data);
      
      if (response.success && response.data) {
        this.setTokens(response.data.token, response.data.refreshToken);
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка регистрации');
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  // Выход из системы
  async logout(): Promise<void> {
    try {
      await api.post(this.ENDPOINTS.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  // Обновление токена
  async refreshToken(): Promise<string> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('Refresh token not found');
      }

      const response = await api.post<{ token: string; refreshToken: string }>(
        this.ENDPOINTS.REFRESH,
        { refreshToken }
      );

      if (response.success && response.data) {
        this.setTokens(response.data.token, response.data.refreshToken);
        return response.data.token;
      }

      throw new Error('Не удалось обновить токен');
    } catch (error) {
      console.error('Refresh token error:', error);
      this.clearTokens();
      throw error;
    }
  }

  // Забыли пароль
  async forgotPassword(data: ForgotPasswordData): Promise<void> {
    try {
      const response = await api.post(this.ENDPOINTS.FORGOT_PASSWORD, data);
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка отправки письма');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  // Сброс пароля
  async resetPassword(data: ResetPasswordData): Promise<void> {
    try {
      const response = await api.post(this.ENDPOINTS.RESET_PASSWORD, data);
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка сброса пароля');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  // Изменение пароля
  async changePassword(data: ChangePasswordData): Promise<void> {
    try {
      const response = await api.post(this.ENDPOINTS.CHANGE_PASSWORD, data);
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка изменения пароля');
      }
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  // Подтверждение email
  async verifyEmail(token: string): Promise<void> {
    try {
      const response = await api.post(this.ENDPOINTS.VERIFY_EMAIL, { token });
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка подтверждения email');
      }
    } catch (error) {
      console.error('Verify email error:', error);
      throw error;
    }
  }

  // Повторная отправка письма подтверждения
  async resendVerification(): Promise<void> {
    try {
      const response = await api.post(this.ENDPOINTS.RESEND_VERIFICATION);
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка отправки письма');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  }

  // Получение информации о текущем пользователе
  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get<User>(this.ENDPOINTS.ME);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка получения данных пользователя');
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  // Утилитарные методы для работы с токенами
  private setTokens(token: string, refreshToken: string): void {
    localStorage.setItem('authToken', token);
    localStorage.setItem('refreshToken', refreshToken);
    api.setToken(token);
  }

  private clearTokens(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    api.removeToken();
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Проверяем, не истек ли токен
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  // Декодирование JWT токена
  decodeToken(token?: string): any {
    const tokenToUse = token || this.getToken();
    if (!tokenToUse) return null;

    try {
      const payload = JSON.parse(atob(tokenToUse.split('.')[1]));
      return payload;
    } catch {
      return null;
    }
  }

  // Получение ID пользователя из токена
  getUserId(): string | null {
    const payload = this.decodeToken();
    return payload?.userId || payload?.id || null;
  }

  // Проверка роли пользователя
  hasRole(role: string): boolean {
    const payload = this.decodeToken();
    return payload?.role === role || payload?.roles?.includes(role);
  }
}

export const authService = new AuthService();
export default authService;