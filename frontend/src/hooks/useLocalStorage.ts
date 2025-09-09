import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = T | ((val: T) => T);

interface UseLocalStorageReturn<T> {
  value: T;
  setValue: (value: SetValue<T>) => void;
  removeValue: () => void;
  isLoading: boolean;
  error: string | null;
}

/**
 * Кастомный хук для работы с localStorage
 * Автоматически синхронизирует состояние с localStorage
 * Поддерживает JSON сериализацию и десериализацию
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): UseLocalStorageReturn<T> {
  const [value, setStoredValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Чтение значения из localStorage при инициализации
  useEffect(() => {
    try {
      setIsLoading(true);
      setError(null);

      const item = window.localStorage.getItem(key);
      
      if (item === null) {
        setStoredValue(defaultValue);
      } else {
        const parsedValue = JSON.parse(item);
        setStoredValue(parsedValue);
      }
    } catch (error: any) {
      console.error(`Ошибка чтения localStorage для ключа "${key}":`, error);
      setError(`Ошибка чтения данных: ${error.message}`);
      setStoredValue(defaultValue);
    } finally {
      setIsLoading(false);
    }
  }, [key, defaultValue]);

  // Функция для обновления значения
  const setValue = useCallback((newValue: SetValue<T>) => {
    try {
      setError(null);
      
      // Вычисляем новое значение (поддерживаем функциональное обновление)
      const valueToStore = newValue instanceof Function 
        ? newValue(value) 
        : newValue;

      // Сохраняем в state
      setStoredValue(valueToStore);

      // Сохраняем в localStorage
      if (valueToStore === undefined || valueToStore === null) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }

      // Уведомляем другие экземпляры хука о изменении
      window.dispatchEvent(new CustomEvent('localStorage-change', {
        detail: { key, value: valueToStore }
      }));

    } catch (error: any) {
      console.error(`Ошибка записи в localStorage для ключа "${key}":`, error);
      setError(`Ошибка записи данных: ${error.message}`);
    }
  }, [key, value]);

  // Функция для удаления значения
  const removeValue = useCallback(() => {
    try {
      setError(null);
      window.localStorage.removeItem(key);
      setStoredValue(defaultValue);

      // Уведомляем другие экземпляры хука об удалении
      window.dispatchEvent(new CustomEvent('localStorage-change', {
        detail: { key, value: defaultValue, removed: true }
      }));

    } catch (error: any) {
      console.error(`Ошибка удаления из localStorage для ключа "${key}":`, error);
      setError(`Ошибка удаления данных: ${error.message}`);
    }
  }, [key, defaultValue]);

  // Слушаем изменения в других вкладках/экземплярах
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      if ('detail' in e) {
        // Наше кастомное событие
        const detail = e.detail as { key: string; value: any; removed?: boolean };
        if (detail.key === key) {
          setStoredValue(detail.value);
        }
      } else {
        // Стандартное событие storage (изменения из других вкладок)
        if (e.key === key) {
          try {
            const newValue = e.newValue === null 
              ? defaultValue 
              : JSON.parse(e.newValue);
            setStoredValue(newValue);
          } catch (error) {
            console.error(`Ошибка парсинга значения для ключа "${key}":`, error);
            setStoredValue(defaultValue);
          }
        }
      }
    };

    // Слушаем стандартные события изменения localStorage
    window.addEventListener('storage', handleStorageChange as EventListener);
    
    // Слушаем наши кастомные события
    window.addEventListener('localStorage-change', handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange as EventListener);
      window.removeEventListener('localStorage-change', handleStorageChange as EventListener);
    };
  }, [key, defaultValue]);

  return {
    value,
    setValue,
    removeValue,
    isLoading,
    error
  };
}

// Версия хука с префиксом для избежания конфликтов
export function useLocalStorageWithPrefix<T>(
  prefix: string,
  key: string,
  defaultValue: T
): UseLocalStorageReturn<T> {
  const fullKey = `${prefix}_${key}`;
  return useLocalStorage(fullKey, defaultValue);
}

// Хук для работы с объектами настроек
export function useLocalStorageSettings<T extends Record<string, any>>(
  key: string,
  defaultSettings: T
) {
  const { value: settings, setValue: setSettings, ...rest } = useLocalStorage(key, defaultSettings);

  const updateSetting = useCallback(<K extends keyof T>(
    settingKey: K,
    settingValue: T[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      [settingKey]: settingValue
    }));
  }, [setSettings]);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, [setSettings, defaultSettings]);

  return {
    settings,
    setSettings,
    updateSetting,
    resetSettings,
    ...rest
  };
}