// LoginForm.tsx - Форма входа
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export const LoginForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();
  const { showNotification } = useNotifications();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
    clearErrors
  } = useForm<LoginFormData>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearErrors();
      await login(data.email, data.password, data.rememberMe);
      showNotification('Добро пожаловать!', 'success');
      navigate('/chat', { replace: true });
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Ошибка при входе';
      
      if (error?.response?.status === 401) {
        setError('password', { 
          type: 'manual', 
          message: 'Неверный email или пароль' 
        });
      } else if (error?.response?.status === 429) {
        setError('root', { 
          type: 'manual', 
          message: 'Слишком много попыток входа. Попробуйте позже' 
        });
      } else {
        setError('root', { 
          type: 'manual', 
          message 
        });
      }
      
      showNotification(message, 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Email поле */}
      <div>
        <Input
          {...register('email', {
            required: 'Email обязателен',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Введите корректный email'
            }
          })}
          type="email"
          label="Email"
          placeholder="your@example.com"
          autoComplete="email"
          error={errors.email?.message}
          disabled={isLoading}
        />
      </div>

      {/* Пароль поле */}
      <div>
        <div className="relative">
          <Input
            {...register('password', {
              required: 'Пароль обязателен',
              minLength: {
                value: 6,
                message: 'Пароль должен быть не менее 6 символов'
              }
            })}
            type={showPassword ? 'text' : 'password'}
            label="Пароль"
            placeholder="Введите пароль"
            autoComplete="current-password"
            error={errors.password?.message}
            disabled={isLoading}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Запомнить меня и забыли пароль */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            {...register('rememberMe')}
            id="remember-me"
            type="checkbox"
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            disabled={isLoading}
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
            Запомнить меня
          </label>
        </div>

        <div className="text-sm">
          <Link
            to="/forgot-password"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Забыли пароль?
          </Link>
        </div>
      </div>

      {/* Общая ошибка */}
      {errors.root && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{errors.root.message}</p>
        </div>
      )}

      {/* Кнопка входа */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={!isValid || isLoading}
      >
        {isLoading ? (
          <>
            <Loader className="w-4 h-4 mr-2 animate-spin" />
            Вход...
          </>
        ) : (
          'Войти'
        )}
      </Button>

      {/* Ссылка на регистрацию */}
      <div className="text-center">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Нет аккаунта?{' '}
          <Link
            to="/register"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Зарегистрироваться
          </Link>
        </span>
      </div>
    </form>
  );
};