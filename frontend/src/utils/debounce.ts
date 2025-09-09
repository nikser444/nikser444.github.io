export type DebounceFunction<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => void;

export interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel(): void;
  flush(): ReturnType<T> | undefined;
  pending(): boolean;
}

// Основная функция debounce
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  options: DebounceOptions = {}
): DebouncedFunction<T> {
  const { leading = false, trailing = true, maxWait } = options;
  
  let timeoutId: NodeJS.Timeout | null = null;
  let maxTimeoutId: NodeJS.Timeout | null = null;
  let result: ReturnType<T> | undefined;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;
  let lastArgs: Parameters<T> | undefined;
  let lastThis: any;

  function invokeFunc(time: number): ReturnType<T> {
    const args = lastArgs!;
    const thisArg = lastThis;
    
    lastArgs = undefined;
    lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function startTimer(
    pendingFunc: () => void,
    wait: number
  ): NodeJS.Timeout {
    return setTimeout(pendingFunc, wait);
  }

  function cancelTimer(id: NodeJS.Timeout | null): void {
    if (id !== null) {
      clearTimeout(id);
    }
  }

  function leadingEdge(time: number): ReturnType<T> | undefined {
    lastInvokeTime = time;
    timeoutId = startTimer(timerExpired, delay);
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time: number): number {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = delay - timeSinceLastCall;

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time: number): boolean {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }

  function timerExpired(): void {
    const time = Date.now();
    if (shouldInvoke(time)) {
      trailingEdge(time);
      return;
    }
    timeoutId = startTimer(timerExpired, remainingWait(time));
  }

  function trailingEdge(time: number): ReturnType<T> | undefined {
    timeoutId = null;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = undefined;
    lastThis = undefined;
    return result;
  }

  function cancel(): void {
    if (timeoutId !== null) {
      cancelTimer(timeoutId);
      timeoutId = null;
    }
    if (maxTimeoutId !== null) {
      cancelTimer(maxTimeoutId);
      maxTimeoutId = null;
    }
    lastInvokeTime = 0;
    lastArgs = undefined;
    lastCallTime = undefined;
    lastThis = undefined;
  }

  function flush(): ReturnType<T> | undefined {
    if (timeoutId === null) {
      return result;
    }
    const time = Date.now();
    return trailingEdge(time);
  }

  function pending(): boolean {
    return timeoutId !== null;
  }

  function debounced(this: any, ...args: Parameters<T>): void {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timeoutId === null) {
        leadingEdge(lastCallTime);
        return;
      }
      if (maxWait !== undefined) {
        timeoutId = startTimer(timerExpired, delay);
        return invokeFunc(lastCallTime);
      }
    }
    if (timeoutId === null) {
      timeoutId = startTimer(timerExpired, delay);
    }
  }

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;

  return debounced;
}

// Упрощенная версия debounce для базовых случаев
export function simpleDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): DebounceFunction<T> {
  let timeoutId: NodeJS.Timeout | null = null;

  return function debounced(this: any, ...args: Parameters<T>): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

// Debounce для поиска
export function createSearchDebounce<T extends (...args: any[]) => any>(
  searchFunc: T,
  delay: number = 300
): DebouncedFunction<T> {
  return debounce(searchFunc, delay, {
    leading: false,
    trailing: true
  });
}

// Debounce для ввода текста
export function createInputDebounce<T extends (...args: any[]) => any>(
  inputFunc: T,
  delay: number = 500
): DebouncedFunction<T> {
  return debounce(inputFunc, delay, {
    leading: false,
    trailing: true
  });
}

// Debounce для кнопок с защитой от повторных нажатий
export function createButtonDebounce<T extends (...args: any[]) => any>(
  buttonFunc: T,
  delay: number = 1000
): DebouncedFunction<T> {
  return debounce(buttonFunc, delay, {
    leading: true,
    trailing: false
  });
}

// Debounce для скролла
export function createScrollDebounce<T extends (...args: any[]) => any>(
  scrollFunc: T,
  delay: number = 100
): DebouncedFunction<T> {
  return debounce(scrollFunc, delay, {
    leading: false,
    trailing: true,
    maxWait: 500
  });
}

// Debounce для изменения размера окна
export function createResizeDebounce<T extends (...args: any[]) => any>(
  resizeFunc: T,
  delay: number = 250
): DebouncedFunction<T> {
  return debounce(resizeFunc, delay, {
    leading: false,
    trailing: true,
    maxWait: 1000
  });
}

// Throttle функция (ограничение частоты вызовов)
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): DebouncedFunction<T> {
  return debounce(func, limit, {
    leading: true,
    trailing: false,
    maxWait: limit
  });
}

// Debounce с промисами
export function debouncePromise<T extends (...args: any[]) => Promise<any>>(
  func: T,
  delay: number
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingPromise: Promise<Awaited<ReturnType<T>>> | null = null;

  return function debounced(...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> {
    return new Promise((resolve, reject) => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(async () => {
        try {
          if (!pendingPromise) {
            pendingPromise = func(...args);
          }
          const result = await pendingPromise;
          pendingPromise = null;
          resolve(result);
        } catch (error) {
          pendingPromise = null;
          reject(error);
        }
        timeoutId = null;
      }, delay);
    });
  };
}

// Групповой debounce для объектов с ключами
export class GroupDebouncer<K = string> {
  private timeouts = new Map<K, NodeJS.Timeout>();
  private delay: number;

  constructor(delay: number = 300) {
    this.delay = delay;
  }

  debounce<T extends (...args: any[]) => any>(
    key: K,
    func: T,
    ...args: Parameters<T>
  ): void {
    const existingTimeout = this.timeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(() => {
      func(...args);
      this.timeouts.delete(key);
    }, this.delay);

    this.timeouts.set(key, timeout);
  }

  cancel(key: K): void {
    const timeout = this.timeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(key);
    }
  }

  cancelAll(): void {
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();
  }

  hasPending(key: K): boolean {
    return this.timeouts.has(key);
  }

  getPendingCount(): number {
    return this.timeouts.size;
  }
}

// Утилита для создания debounced колбэков с автоматической очисткой
export function useAutoCleanupDebounce() {
  const debouncedCallbacks = new Set<DebouncedFunction<any>>();

  const createDebounce = <T extends (...args: any[]) => any>(
    func: T,
    delay: number,
    options?: DebounceOptions
  ): DebouncedFunction<T> => {
    const debouncedFunc = debounce(func, delay, options);
    debouncedCallbacks.add(debouncedFunc);
    return debouncedFunc;
  };

  const cleanup = (): void => {
    for (const debouncedFunc of debouncedCallbacks) {
      debouncedFunc.cancel();
    }
    debouncedCallbacks.clear();
  };

  return {
    createDebounce,
    cleanup
  };
}

// Константы для типичных задержек
export const DEBOUNCE_DELAYS = {
  SEARCH: 300,
  INPUT: 500,
  BUTTON: 1000,
  SCROLL: 100,
  RESIZE: 250,
  API_CALL: 500,
  TYPING_INDICATOR: 1000,
  AUTO_SAVE: 2000
} as const;

// Предустановленные debounce функции
export const presetDebouncers = {
  search: <T extends (...args: any[]) => any>(func: T) => 
    createSearchDebounce(func, DEBOUNCE_DELAYS.SEARCH),
  
  input: <T extends (...args: any[]) => any>(func: T) => 
    createInputDebounce(func, DEBOUNCE_DELAYS.INPUT),
  
  button: <T extends (...args: any[]) => any>(func: T) => 
    createButtonDebounce(func, DEBOUNCE_DELAYS.BUTTON),
  
  scroll: <T extends (...args: any[]) => any>(func: T) => 
    createScrollDebounce(func, DEBOUNCE_DELAYS.SCROLL),
  
  resize: <T extends (...args: any[]) => any>(func: T) => 
    createResizeDebounce(func, DEBOUNCE_DELAYS.RESIZE),
};

export default debounce;