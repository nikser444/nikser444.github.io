import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { loginSuccess, loginFailure, logout, setLoading } from '../store/authSlice';
import { authService } from '../services/authService';
import type { User, LoginCredentials, RegisterCredentials } from '../types/user';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading, error } = useSelector((state: RootState) => state.auth);
  
  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      dispatch(setLoading(true));
      const response = await authService.login(credentials);
      
      if (response.success) {
        dispatch(loginSuccess({
          user: response.user,
          token: response.token
        }));
        
        // Сохраняем токен в localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        return true;
      } else {
        dispatch(loginFailure(response.message || 'Ошибка входа'));
        return false;
      }
    } catch (error: any) {
      dispatch(loginFailure(error.message || 'Произошла ошибка при входе'));
      return false;
    }
  }, [dispatch]);

  const register = useCallback(async (credentials: RegisterCredentials): Promise<boolean> => {
    try {
      dispatch(setLoading(true));
      const response = await authService.register(credentials);
      
      if (response.success) {
        dispatch(loginSuccess({
          user: response.user,
          token: response.token
        }));
        
        // Сохраняем токен в localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        return true;
      } else {
        dispatch(loginFailure(response.message || 'Ошибка регистрации'));
        return false;
      }
    } catch (error: any) {
      dispatch(loginFailure(error.message || 'Произошла ошибка при регистрации'));
      return false;
    }
  }, [dispatch]);

  const handleLogout = useCallback(() => {
    // Очищаем localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Очищаем состояние
    dispatch(logout());
    
    // Вызываем API для выхода на сервере
    authService.logout().catch(console.error);
  }, [dispatch]);

  const checkAuth = useCallback(async (): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (!token || !savedUser) {
        return;
      }

      dispatch(setLoading(true));
      
      // Проверяем валидность токена на сервере
      const response = await authService.verifyToken();
      
      if (response.success) {
        dispatch(loginSuccess({
          user: response.user,
          token
        }));
      } else {
        // Токен недействителен, очищаем данные
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch(logout());
      }
    } catch (error) {
      // В случае ошибки очищаем данные
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      dispatch(logout());
    }
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(loginFailure(''));
  }, [dispatch]);

  // Проверяем авторизацию при монтировании
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout: handleLogout,
    checkAuth,
    clearError
  };
};