// useOnlineStatus.ts - Хук для отслеживания статуса подключения к интернету

import { useState, useEffect } from 'react';

interface UseOnlineStatusReturn {
  isOnline: boolean;
  wasOffline: boolean;
}

export function useOnlineStatus(): UseOnlineStatusReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Можно добавить логику восстановления соединения
        console.log('Соединение восстановлено');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      console.log('Соединение потеряно');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
}

// usePersistentState.ts - Хук для постоянного хранения состояния

import { useState, useEffect, Dispatch, SetStateAction } from 'react';

type SetStateAction<S> = S | ((prevState: S) => S);

interface UsePersistentStateOptions {
  storage?: Storage;
  serializer?: {
    stringify: (value: any) => string;
    parse: (value: string) => any;
  };
}

export function usePersistentState<T>(
  key: string,
  defaultValue: T,
  options: UsePersistentStateOptions = {}
): [T, Dispatch<SetStateAction<T>>] {
  const {
    storage = localStorage,
    serializer = {
      stringify: JSON.stringify,
      parse: JSON.parse
    }
  } = options;

  // Инициализация состояния из хранилища
  const [state, setState] = useState<T>(() => {
    try {
      const item = storage.getItem(key);
      return item ? serializer.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Ошибка чтения из хранилища для ключа "${key}":`, error);
      return defaultValue;
    }
  });

  // Сохранение состояния в хранилище при изменении
  useEffect(() => {
    try {
      if (state === undefined) {
        storage.removeItem(key);
      } else {
        storage.setItem(key, serializer.stringify(state));
      }
    } catch (error) {
      console.error(`Ошибка записи в хранилище для ключа "${key}":`, error);
    }
  }, [key, state, storage, serializer]);

  return [state, setState];
}

// useMediaQuery.ts - Хук для отслеживания медиа-запросов

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Устанавливаем начальное значение
    setMatches(mediaQuery.matches);

    // Добавляем слушатель
    if (mediaQuery.addListener) {
      mediaQuery.addListener(handler);
    } else {
      mediaQuery.addEventListener('change', handler);
    }

    // Очистка
    return () => {
      if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handler);
      } else {
        mediaQuery.removeEventListener('change', handler);
      }
    };
  }, [query]);

  return matches;
}

// Предустановленные брейкпоинты для удобства
export const useBreakpoints = () => {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');
  const isSmallDesktop = useMediaQuery('(min-width: 1025px) and (max-width: 1440px)');
  const isLargeDesktop = useMediaQuery('(min-width: 1441px)');

  // Дополнительные утилиты
  const isTouchDevice = useMediaQuery('(hover: none) and (pointer: coarse)');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  return {
    isMobile,
    isTablet,
    isDesktop,
    isSmallDesktop,
    isLargeDesktop,
    isTouchDevice,
    prefersReducedMotion,
    prefersDarkMode,
    // Группированные брейкпоинты
    isSmallScreen: isMobile,
    isMediumScreen: isTablet,
    isLargeScreen: isDesktop
  };
};

// useWindowSize.ts - Хук для отслеживания размера окна

import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>(() => {
    if (typeof window !== 'undefined') {
      return {
        width: window.innerWidth,
        height: window.innerHeight
      };
    }
    return { width: 0, height: 0 };
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    
    // Устанавливаем актуальные размеры при монтировании
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return windowSize;
}

// useClickOutside.ts - Хук для обработки кликов вне элемента

import { useEffect, RefObject } from 'react';

export function useClickOutside(
  ref: RefObject<HTMLElement>,
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const element = ref.current;
      
      // Если клик произошел внутри элемента, игнорируем
      if (!element || element.contains(event.target as Node)) {
        return;
      }

      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, enabled]);
}

// useKeyPress.ts - Хук для обработки нажатий клавиш

import { useState, useEffect } from 'react';

export function useKeyPress(targetKey: string): boolean {
  const [keyPressed, setKeyPressed] = useState(false);

  useEffect(() => {
    const downHandler = (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        setKeyPressed(true);
      }
    };

    const upHandler = (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        setKeyPressed(false);
      }
    };

    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);

    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
  }, [targetKey]);

  return keyPressed;
}

// useHotkeys.ts - Хук для обработки горячих клавиш

import { useEffect } from 'react';

interface HotkeyConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
}

export function useHotkeys(
  hotkey: HotkeyConfig | string,
  handler: (event: KeyboardEvent) => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      let config: HotkeyConfig;

      if (typeof hotkey === 'string') {
        config = { key: hotkey };
      } else {
        config = hotkey;
      }

      const {
        key,
        ctrl = false,
        shift = false,
        alt = false,
        meta = false
      } = config;

      // Проверяем соответствие модификаторов
      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        event.ctrlKey === ctrl &&
        event.shiftKey === shift &&
        event.altKey === alt &&
        event.metaKey === meta
      ) {
        event.preventDefault();
        handler(event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [hotkey, handler, enabled]);
}

// useInterval.ts - Хук для работы с интервалами

import { useEffect, useRef } from 'react';

export function useInterval(
  callback: () => void,
  delay: number | null,
  immediate: boolean = false
): void {
  const savedCallback = useRef<() => void>();

  // Сохраняем актуальный callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Устанавливаем интервал
  useEffect(() => {
    if (delay === null) {
      return;
    }

    const tick = () => {
      if (savedCallback.current) {
        savedCallback.current();
      }
    };

    // Вызываем сразу, если immediate === true
    if (immediate) {
      tick();
    }

    const id = setInterval(tick, delay);
    
    return () => {
      clearInterval(id);
    };
  }, [delay, immediate]);
}

// usePrevious.ts - Хук для получения предыдущего значения

import { useRef, useEffect } from 'react';

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

// useToggle.ts - Хук для переключения boolean значений

import { useState, useCallback } from 'react';

export function useToggle(
  initialValue: boolean = false
): [boolean, (value?: boolean) => void] {
  const [state, setState] = useState<boolean>(initialValue);

  const toggle = useCallback((value?: boolean) => {
    setState(prevState => value !== undefined ? value : !prevState);
  }, []);

  return [state, toggle];
}

// useAsync.ts - Хук для работы с асинхронными операциями

import { useState, useEffect, useCallback } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  dependencies: any[] = []
): AsyncState<T> & { execute: () => Promise<void> } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await asyncFunction();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error as Error });
    }
  }, dependencies);

  useEffect(() => {
    execute();
  }, [execute]);

  return { ...state, execute };
}

// useCopyToClipboard.ts - Хук для копирования в буфер обмена

import { useState, useCallback } from 'react';

export function useCopyToClipboard(): [
  string | null,
  (text: string) => Promise<boolean>
] {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copy = useCallback(async (text: string): Promise<boolean> => {
    if (!navigator.clipboard) {
      // Fallback для старых браузеров
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const success = document.execCommand('copy');
        textArea.remove();
        
        if (success) {
          setCopiedText(text);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Ошибка копирования (fallback):', error);
        return false;
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      return true;
    } catch (error) {
      console.error('Ошибка копирования:', error);
      setCopiedText(null);
      return false;
    }
  }, []);

  return [copiedText, copy];
}

// useGeolocation.ts - Хук для получения геолокации

import { useState, useEffect } from 'react';

interface GeolocationState {
  loading: boolean;
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  timestamp: number | null;
  error: GeolocationPositionError | null;
}

export function useGeolocation(
  options: PositionOptions = {}
): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    loading: true,
    accuracy: null,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    latitude: null,
    longitude: null,
    speed: null,
    timestamp: null,
    error: null
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: {
          code: 0,
          message: 'Geolocation не поддерживается этим браузером'
        } as GeolocationPositionError
      }));
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      setState({
        loading: false,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed: position.coords.speed,
        timestamp: position.timestamp,
        error: null
      });
    };

    const onError = (error: GeolocationPositionError) => {
      setState(prev => ({
        ...prev,
        loading: false,
        error
      }));
    };

    const watchId = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      options
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [options]);

  return state;
}