// AuthLayout.tsx - Макет страниц авторизации
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  children, 
  title, 
  subtitle 
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Перенаправляем аутентифицированных пользователей на главную страницу
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/chat" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Логотип и заголовок */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>

        {/* Контент формы */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          {children}
        </div>

        {/* Футер */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            Используя наш сервис, вы соглашаетесь с{' '}
            <a href="/terms" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              условиями использования
            </a>{' '}
            и{' '}
            <a href="/privacy" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              политикой конфиденциальности
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};