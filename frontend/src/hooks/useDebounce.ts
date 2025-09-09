import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Хук для debounce значения
 * Задерживает обновление значения до тех пор, пока не пройдет указанная задержка
 * без изменений
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Хук для debounce функции
 * Возвращает debounced версию переданной функции
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  dependencies: React.DependencyList = []
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay, ...dependencies]
  ) as T;

  // Очищаем таймаут при размонтировании
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Хук для debounce с возможностью отмены
 * Предоставляет дополнительные методы управления
 */
export function useAdvancedDebounce<T>(
  value: T,
  delay: number,
  options: {
    leading?: boolean; // Вызвать сразу при первом изменении
    trailing?: boolean; // Вызвать после задержки (по умолчанию true)
    maxWait?: number; // Максимальное время ожидания
  } = {}
) {
  const {
    leading = false,
    trailing = true,
    maxWait
  } = options;

  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isWaiting, setIsWaiting] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const maxTimeoutRef = useRef<NodeJS.Timeout>();
  const lastCallTime = useRef<number>(0);
  const lastInvokeTime = useRef<number>(0);

  const invokeFunc = useCallback(() => {
    setDebouncedValue(value);
    setIsWaiting(false);
    lastInvokeTime.current = Date.now();
  }, [value]);

  const leadingEdge = useCallback(() => {
    lastInvokeTime.current = Date.now();
    setIsWaiting(true);
    
    if (leading) {
      invokeFunc();
    }
  }, [leading, invokeFunc]);

  const remainingWait = useCallback((time: number) => {
    const timeSinceLastCall = time - lastCallTime.current;
    const timeSinceLastInvoke = time - lastInvokeTime.current;
    const timeWaiting = delay - timeSinceLastCall;

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }, [delay, maxWait]);

  const shouldInvoke = useCallback((time: number) => {
    const timeSinceLastCall = time - lastCallTime.current;
    const timeSinceLastInvoke = time - lastInvokeTime.current;

    return (
      lastCallTime.current === 0 ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }, [delay, maxWait]);

  const timerExpired = useCallback(() => {
    const time = Date.now();
    
    if (shouldInvoke(time)) {
      if (trailing) {
        invokeFunc();
      } else {
        setIsWaiting(false);
      }
    } else {
      // Перезапускаем таймер с оставшимся временем
      const timeoutId = setTimeout(timerExpired, remainingWait(time));
      timeoutRef.current = timeoutId;
    }
  }, [shouldInvoke, trailing, invokeFunc, remainingWait]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = undefined;
    }
    
    lastCallTime.current = 0;
    lastInvokeTime.current = 0;
    setIsWaiting(false);
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      invokeFunc();
      cancel();
    }
  }, [invokeFunc, cancel]);

  useEffect(() => {
    const time = Date.now();
    lastCallTime.current = time;

    if (shouldInvoke(time)) {
      if (lastCallTime.current === time) {
        leadingEdge();
      }
      
      if (trailing) {
        const timeoutId = setTimeout(timerExpired, delay);
        timeoutRef.current = timeoutId;
      }
    } else {
      const timeoutId = setTimeout(timerExpired, remainingWait(time));
      timeoutRef.current = timeoutId;
    }

    // Устанавливаем максимальный таймаут, если указан
    if (maxWait !== undefined && !maxTimeoutRef.current && isWaiting) {
      const maxTimeoutId = setTimeout(() => {
        if (trailing) {
          invokeFunc();
        }
        cancel();
      }, maxWait);
      maxTimeoutRef.current = maxTimeoutId;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
      }
    };
  }, [value, delay, shouldInvoke, leadingEdge, trailing, timerExpired, remainingWait, maxWait, isWaiting, invokeFunc, cancel]);

  return {
    debouncedValue,
    isWaiting,
    cancel,
    flush
  };
}

/**
 * Хук для debounced поиска
 * Специализированная версия для поисковых запросов
 */
export function useDebouncedSearch(
  searchTerm: string,
  delay: number = 300,
  minLength: number = 1
) {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setIsSearching(searchTerm.length >= minLength);

    const timer = setTimeout(() => {
      if (searchTerm.length >= minLength) {
        setDebouncedSearchTerm(searchTerm);
      } else {
        setDebouncedSearchTerm('');
      }
      setIsSearching(false);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [searchTerm, delay, minLength]);

  return {
    debouncedSearchTerm,
    isSearching: isSearching && searchTerm.length >= minLength
  };
}