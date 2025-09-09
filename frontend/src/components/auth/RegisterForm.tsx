// RegisterForm.tsx - Форма регистрации
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader, Check, X } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

export const RegisterForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser, isLoading } = useAuth();
  const { showNotification } = useNotifications();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    setError,
    clearErrors
  } = useForm<RegisterFormData>({
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false
    }
  });

  const password = watch('password');

  // Проверка силы пароля
  const getPasswordStrength = (password: string): PasswordStrength => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    
    // Длина
    if (password.length >= 8) score++;
    // Цифры
    if (/\d/.test(password)) score++;
    // Строчные буквы
    if (/[a-z]/.test(password)) score++;
    // Заглавные буквы
    if (/[A-Z]/.test(password)) score++;
    // Специальные символы
    if (/[^A-Za-z0-9]/.test(password)) score++;

    switch (score) {
      case 0:
      case 1:
        return { score, label: 'Слабый', color: 'text-red-500' };
      case 2:
        return { score, label: 'Слабый', color: 'text-red-500' };
      case 3:
        return { score, label: 'Средний', color: 'text-yellow-500' };
      case 4:
        return { score, label: 'Сильный', color: 'text-green-500' };
      case 5:
        return { score, label: 'Очень сильный', color: 'text-green-600' };
      default:
        return { score: 0, label: '', color: '' };
    }
  };

  const passwordStrength = getPasswordStrength(password);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      clearErrors();
      
      await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password
      });
      
      showNotification('Регистрация прошла успешно! Добро пожаловать!', 'success');
      navigate('/chat', { replace: true });
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Ошибка при регистрации';
      
      if (error?.response?.status === 409) {
        setError('email', { 
          type: 'manual', 
          message: 'Пользователь с таким email уже существует' 
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
      {/* Имя и фамилия */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <Input
            {...register('firstName', {
              required: 'Имя обязательно',
              minLength: {
                value: 2,
                message: 'Имя должно быть не менее 2 символов'
              },
              maxLength: {
                value: 50,
                message: 'Имя должно быть не более 50 символов'
              },
              pattern: {
                value: /^[а-яёА-ЯЁa-zA-Z\s-]+$/,
                message: 'Имя может содержать только буквы, пробелы и дефисы'
              }
            })}
            label="Имя"
            placeholder="Иван"
            autoComplete="given-name"
            error={errors.firstName?.message}
            disabled={isLoading}
          />
        </div>

        <div>
          <Input
            {...register('lastName', {
              required: 'Фамилия обязательна',
              minLength: {
                value: 2,
                message: 'Фамилия должна быть не менее 2 символов'
              },
              maxLength: {
                value: 50,
                message: 'Фамилия должна быть не более 50 символов'
              },
              pattern: {
                value: /^[а-яёА-ЯЁa-zA-Z\s-]+$/,
                message: 'Фамилия может содержать только буквы, пробелы и дефисы'
              }
            })}
            label="Фамилия"
            placeholder="Иванов"
            autoComplete="family-name"
            error={errors.lastName?.message}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Email */}
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

      {/* Пароль */}
      <div>
        <div className="relative">
          <Input
            {...register('password', {
              required: 'Пароль обязателен',
              minLength: {
                value: 8,
                message: 'Пароль должен быть не менее 8 символов'
              },
              validate: (value) => {
                const strength = getPasswordStrength(value);
                if (strength.score < 3) {
                  return 'Пароль слишком слабый. Используйте заглавные и строчные буквы, цифры и символы';
                }
                return true;
              }
            })}
            type={showPassword ? 'text' : 'password'}
            label="Пароль"
            placeholder="Создайте надежный пароль"
            autoComplete="new-password"
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
        
        {/* Индикатор силы пароля */}
        {password && (
          <div className="mt-2">
            <div className="flex items-center justify-between">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 w-6 rounded ${
                      i < passwordStrength.score
                        ? passwordStrength.score <= 2
                          ? 'bg-red-500'
                          : passwordStrength.score <= 3
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                        : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              {passwordStrength.label && (
                <span className={`text-xs ${passwordStrength.color}`}>
                  {passwordStrength.label}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Подтверждение пароля */}
      <div>
        <div className="relative">
          <Input
            {...register('confirmPassword', {
              required: 'Подтвердите пароль',
              validate: (value) =>
                value === password || 'Пароли не совпадают'
            })}
            type={showConfirmPassword ? 'text' : 'password'}
            label="Подтверждение пароля"
            placeholder="Повторите пароль"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            disabled={isLoading}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isLoading}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Согласие с условиями */}
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            {...register('agreeToTerms', {
              required: 'Необходимо согласиться с условиями'
            })}
            id="agree-terms"
            type="checkbox"
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            disabled={isLoading}
          />
        </div>
        <div className="ml-3">
          <label htmlFor="agree-terms" className="text-sm text-gray-700 dark:text-gray-300">
            Я согласен с{' '}
            <Link to="/terms" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              условиями использования
            </Link>{' '}
            и{' '}
            <Link to="/privacy" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              политикой конфиденциальности
            </Link>
          </label>
          {errors.agreeToTerms && (
            <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms.message}</p>
          )}
        </div>
      </div>

      {/* Общая ошибка */}
      {errors.root && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{errors.root.message}</p>
        </div>
      )}

      {/* Кнопка регистрации */}
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
            Создание аккаунта...
          </>
        ) : (
          'Создать аккаунт'
        )}
      </Button>

      {/* Ссылка на вход */}
      <div className="text-center">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Уже есть аккаунт?{' '}
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Войти
          </Link>
        </span>
      </div>
    </form>
  );
};