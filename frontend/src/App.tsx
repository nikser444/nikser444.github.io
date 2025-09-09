import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';

// Store и провайдеры
import { store } from './store';
import { StoreProvider } from './store/StoreProvider';

// Компоненты загрузки
import { LoadingSpinner } from './components/common';

// Страницы
import {
  LoginPage,
  RegisterPage,
  ChatPage,
  FriendsPage,
  SettingsPage,
  CallPage
} from './pages';

// Хуки
import { useAuth, useSocket, useNotifications } from './hooks';

// Утилиты и константы
import { logger } from './utils/logger';
import { setupDirectories } from './utils/constants';

// Стили
import './styles/globals.css';
import './styles/components.css';
import './styles/themes.css';
import './styles/responsive.css';
import 'react-toastify/dist/ReactToastify.css';

/**
 * Компонент для защищенных маршрутов
 * Перенаправляет неавторизованных пользователей на страницу входа
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

/**
 * Компонент для публичных маршрутов
 * Перенаправляет авторизованных пользователей в чат
 */
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/chat" replace />;
  }

  return <>{children}</>;
};

/**
 * Главный компонент приложения
 * Управляет маршрутизацией, авторизацией и глобальным состоянием
 */
const AppContent: React.FC = () => {
  const { user, isLoading, checkAuth } = useAuth();
  const { connect, disconnect } = useSocket();
  const { requestPermission } = useNotifications();

  // Инициализация приложения
  useEffect(() => {
    const initializeApp = async () => {
      try {
        logger.info('Инициализация приложения...');
        
        // Проверяем авторизацию при загрузке
        await checkAuth();
        
        // Запрашиваем разрешение на уведомления
        await requestPermission();
        
        logger.info('Приложение успешно инициализировано');
      } catch (error) {
        logger.error('Ошибка инициализации приложения:', error);
      }
    };

    initializeApp();
  }, [checkAuth, requestPermission]);

  // Управление WebSocket соединением
  useEffect(() => {
    if (user && !isLoading) {
      logger.info('Подключение к WebSocket...', { userId: user.id });
      connect();
      
      return () => {
        logger.info('Отключение от WebSocket...');
        disconnect();
      };
    }
  }, [user, isLoading, connect, disconnect]);

  // Глобальная обработка ошибок
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error('Необработанная ошибка Promise:', event.reason);
      event.preventDefault();
    };

    const handleError = (event: ErrorEvent) => {
      logger.error('Глобальная ошибка:', event.error);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  // Показываем загрузку при инициализации
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Загрузка приложения...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Suspense 
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        }
      >
        <Routes>
          {/* Публичные маршруты */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            } 
          />

          {/* Защищенные маршруты */}
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chat/:chatId" 
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/friends" 
            element={
              <ProtectedRoute>
                <FriendsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/call/:callId" 
            element={
              <ProtectedRoute>
                <CallPage />
              </ProtectedRoute>
            } 
          />

          {/* Перенаправления */}
          <Route 
            path="/" 
            element={
              user ? 
                <Navigate to="/chat" replace /> : 
                <Navigate to="/login" replace />
            } 
          />

          {/* 404 страница */}
          <Route 
            path="*" 
            element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-gray-300 dark:text-gray-600 mb-4">
                    404
                  </h1>
                  <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                    Страница не найдена
                  </p>
                  <button
                    onClick={() => window.history.back()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Вернуться назад
                  </button>
                </div>
              </div>
            } 
          />
        </Routes>
      </Suspense>

      {/* Глобальные уведомления */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
        toastClassName="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
      />
    </div>
  );
};

/**
 * Корневой компонент приложения
 * Оборачивает приложение в провайдеры для состояния и маршрутизации
 */
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <StoreProvider>
        <Router>
          <AppContent />
        </Router>
      </StoreProvider>
    </Provider>
  );
};

export default App;