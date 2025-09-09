// frontend/src/store/StoreProvider.tsx
import React, { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './index';

// Компонент загрузки для PersistGate
const LoadingComponent: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="text-gray-600 dark:text-gray-400">Загрузка приложения...</p>
    </div>
  </div>
);

// Пропсы для StoreProvider
interface StoreProviderProps {
  children: ReactNode;
  loading?: ReactNode;
}

// Компонент провайдера Redux Store
export const StoreProvider: React.FC<StoreProviderProps> = ({ 
  children, 
  loading = <LoadingComponent />
}) => {
  return (
    <Provider store={store}>
      <PersistGate 
        loading={loading} 
        persistor={persistor}
        onBeforeLift={() => {
          // Логика, которая выполняется перед восстановлением состояния
          console.log('🔄 Восстановление состояния из локального хранилища...');
        }}
      >
        {children}
      </PersistGate>
    </Provider>
  );
};

// HOC для подключения компонентов к Redux
export const withStore = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => (
    <StoreProvider>
      <Component {...props} />
    </StoreProvider>
  );
};

export default StoreProvider;