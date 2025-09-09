type ClassValue = 
  | string 
  | number 
  | boolean 
  | undefined 
  | null 
  | ClassDictionary 
  | ClassArray;

interface ClassDictionary {
  [id: string]: boolean | undefined | null;
}

interface ClassArray extends Array<ClassValue> {}

/**
 * Утилита для объединения CSS классов
 * Основана на популярной библиотеке clsx с дополнительной интеграцией с Tailwind
 */
export function cn(...classes: ClassValue[]): string {
  return clsx(classes);
}

/**
 * Базовая функция clsx для объединения классов
 */
function clsx(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    if (!input) continue;

    if (typeof input === 'string') {
      classes.push(input);
    } else if (typeof input === 'number') {
      classes.push(String(input));
    } else if (typeof input === 'object') {
      if (Array.isArray(input)) {
        const result = clsx(...input);
        if (result) {
          classes.push(result);
        }
      } else {
        for (const key in input) {
          if (input[key]) {
            classes.push(key);
          }
        }
      }
    }
  }

  return classes.join(' ');
}

/**
 * Утилита для условного применения классов
 */
export function conditionalClass(
  condition: boolean,
  trueClass: string,
  falseClass?: string
): string {
  return condition ? trueClass : (falseClass || '');
}

/**
 * Утилита для объединения базовых классов с вариантами
 */
export function mergeClasses(baseClasses: string, ...variantClasses: ClassValue[]): string {
  return cn(baseClasses, ...variantClasses);
}

/**
 * Создание классов с вариантами (полезно для компонентов)
 */
export function createVariantClassNames<T extends Record<string, Record<string, string>>>(
  variants: T,
  baseClasses?: string
) {
  return function getVariantClasses(
    selectedVariants: Partial<{ [K in keyof T]: keyof T[K] }>
  ): string {
    const variantClasses = Object.keys(selectedVariants).map(key => {
      const variantKey = key as keyof T;
      const selectedValue = selectedVariants[variantKey];
      return selectedValue ? variants[variantKey][selectedValue] : '';
    });

    return cn(baseClasses, ...variantClasses);
  };
}

/**
 * Утилиты для работы с состояниями компонентов
 */
export const stateClasses = {
  // Состояния активности
  active: (isActive: boolean, activeClass = 'active', inactiveClass = '') =>
    conditionalClass(isActive, activeClass, inactiveClass),

  // Состояния загрузки
  loading: (isLoading: boolean, loadingClass = 'loading', normalClass = '') =>
    conditionalClass(isLoading, loadingClass, normalClass),

  // Состояния ошибок
  error: (hasError: boolean, errorClass = 'error', normalClass = '') =>
    conditionalClass(hasError, errorClass, normalClass),

  // Состояния отключенности
  disabled: (isDisabled: boolean, disabledClass = 'disabled opacity-50 cursor-not-allowed', enabledClass = '') =>
    conditionalClass(isDisabled, disabledClass, enabledClass),

  // Состояния видимости
  visible: (isVisible: boolean, visibleClass = 'visible', hiddenClass = 'hidden') =>
    conditionalClass(isVisible, visibleClass, hiddenClass),

  // Состояния выбора
  selected: (isSelected: boolean, selectedClass = 'selected', unselectedClass = '') =>
    conditionalClass(isSelected, selectedClass, unselectedClass)
};

/**
 * Специальные утилиты для Tailwind CSS
 */
export const tailwindUtils = {
  // Утилита для размеров
  size: (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl') => {
    const sizeMap = {
      xs: 'text-xs px-2 py-1',
      sm: 'text-sm px-3 py-1.5',
      md: 'text-base px-4 py-2',
      lg: 'text-lg px-6 py-3',
      xl: 'text-xl px-8 py-4'
    };
    return sizeMap[size] || sizeMap.md;
  },

  // Утилита для вариантов кнопок
  buttonVariant: (variant: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline') => {
    const variantMap = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
      danger: 'bg-red-600 hover:bg-red-700 text-white',
      ghost: 'hover:bg-gray-100 text-gray-900',
      outline: 'border border-gray-300 hover:bg-gray-50 text-gray-900'
    };
    return variantMap[variant] || variantMap.primary;
  },

  // Утилита для теней
  shadow: (level: 'none' | 'sm' | 'md' | 'lg' | 'xl') => {
    const shadowMap = {
      none: 'shadow-none',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl'
    };
    return shadowMap[level] || shadowMap.md;
  },

  // Утилита для скругления углов
  rounded: (size: 'none' | 'sm' | 'md' | 'lg' | 'full') => {
    const roundedMap = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      full: 'rounded-full'
    };
    return roundedMap[size] || roundedMap.md;
  }
};

/**
 * Утилиты для анимаций
 */
export const animationClasses = {
  // Переходы
  transition: (property: 'all' | 'colors' | 'opacity' | 'transform' = 'all', duration = '300') => 
    `transition-${property} duration-${duration} ease-in-out`,

  // Появление/исчезновение
  fadeIn: 'animate-in fade-in duration-200',
  fadeOut: 'animate-out fade-out duration-200',
  
  // Масштабирование
  scaleIn: 'animate-in zoom-in-95 duration-200',
  scaleOut: 'animate-out zoom-out-95 duration-200',
  
  // Скольжение
  slideInUp: 'animate-in slide-in-from-bottom-2 duration-200',
  slideInDown: 'animate-in slide-in-from-top-2 duration-200',
  slideInLeft: 'animate-in slide-in-from-left-2 duration-200',
  slideInRight: 'animate-in slide-in-from-right-2 duration-200',

  // Пульсация
  pulse: 'animate-pulse',
  
  // Вращение
  spin: 'animate-spin',
  
  // Подпрыгивание
  bounce: 'animate-bounce'
};

/**
 * Утилиты для адаптивного дизайна
 */
export const responsiveUtils = {
  // Скрытие на разных экранах
  hideOn: (breakpoint: 'sm' | 'md' | 'lg' | 'xl') => `${breakpoint}:hidden`,
  showOn: (breakpoint: 'sm' | 'md' | 'lg' | 'xl') => `hidden ${breakpoint}:block`,

  // Изменение направления
  flexDirection: (mobile: 'row' | 'col', desktop?: 'row' | 'col') => 
    desktop ? `flex-${mobile} lg:flex-${desktop}` : `flex-${mobile}`,

  // Изменение размера текста
  textSize: (mobile: string, desktop?: string) => 
    desktop ? `text-${mobile} lg:text-${desktop}` : `text-${mobile}`,

  // Изменение отступов
  padding: (mobile: string, desktop?: string) => 
    desktop ? `p-${mobile} lg:p-${desktop}` : `p-${mobile}`,

  // Изменение ширины
  width: (mobile: string, desktop?: string) => 
    desktop ? `w-${mobile} lg:w-${desktop}` : `w-${mobile}`
};

/**
 * Утилиты для цветовых схем
 */
export const colorUtils = {
  // Получение классов для темы
  theme: (isDark: boolean) => ({
    background: isDark ? 'bg-gray-900' : 'bg-white',
    surface: isDark ? 'bg-gray-800' : 'bg-gray-50',
    text: isDark ? 'text-white' : 'text-gray-900',
    textSecondary: isDark ? 'text-gray-300' : 'text-gray-600',
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    hover: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
  }),

  // Статусные цвета
  status: (status: 'success' | 'warning' | 'error' | 'info') => {
    const statusMap = {
      success: 'text-green-600 bg-green-50 border-green-200',
      warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      error: 'text-red-600 bg-red-50 border-red-200',
      info: 'text-blue-600 bg-blue-50 border-blue-200'
    };
    return statusMap[status];
  },

  // Онлайн статус пользователей
  userStatus: (status: 'online' | 'offline' | 'away' | 'busy') => {
    const statusMap = {
      online: 'bg-green-500',
      offline: 'bg-gray-400',
      away: 'bg-yellow-500',
      busy: 'bg-red-500'
    };
    return statusMap[status];
  }
};

/**
 * Утилиты для компонентов мессенджера
 */
export const messengerClasses = {
  // Стили для сообщений
  message: (isOwnMessage: boolean, isDark = false) => cn(
    'max-w-xs lg:max-w-md px-3 py-2 rounded-lg break-words',
    isOwnMessage 
      ? 'ml-auto bg-blue-600 text-white rounded-br-none' 
      : cn(
          'mr-auto rounded-bl-none',
          isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'
        )
  ),

  // Стили для чатов
  chat: (isActive: boolean, hasUnread: boolean, isDark = false) => cn(
    'p-3 cursor-pointer transition-colors duration-200',
    isActive && (isDark ? 'bg-gray-700' : 'bg-blue-50 border-r-2 border-blue-500'),
    !isActive && (isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'),
    hasUnread && 'font-semibold'
  ),

  // Стили для аватаров
  avatar: (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md', isOnline = false) => {
    const sizeMap = {
      xs: 'w-6 h-6',
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16'
    };
    
    return cn(
      sizeMap[size],
      'rounded-full object-cover',
      isOnline && 'ring-2 ring-green-500'
    );
  },

  // Стили для кнопок звонков
  callButton: (type: 'audio' | 'video', isActive = false) => cn(
    'p-3 rounded-full transition-all duration-200',
    type === 'audio' && 'bg-green-600 hover:bg-green-700 text-white',
    type === 'video' && 'bg-blue-600 hover:bg-blue-700 text-white',
    isActive && 'ring-2 ring-white ring-opacity-50'
  ),

  // Стили для статуса набора текста
  typing: 'text-sm text-gray-500 italic animate-pulse',

  // Стили для уведомлений
  notification: (type: 'info' | 'success' | 'warning' | 'error' = 'info') => cn(
    'p-4 rounded-lg border-l-4 mb-4',
    colorUtils.status(type === 'info' ? 'info' : type)
  )
};

/**
 * Утилиты для форм
 */
export const formClasses = {
  // Базовые стили для инпутов
  input: (hasError = false, isDark = false) => cn(
    'w-full px-3 py-2 border rounded-md transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    hasError 
      ? 'border-red-500 bg-red-50' 
      : isDark 
        ? 'border-gray-600 bg-gray-700 text-white' 
        : 'border-gray-300 bg-white'
  ),

  // Стили для лейблов
  label: (isRequired = false, isDark = false) => cn(
    'block text-sm font-medium mb-1',
    isDark ? 'text-gray-300' : 'text-gray-700',
    isRequired && "after:content-['*'] after:text-red-500 after:ml-1"
  ),

  // Стили для ошибок
  error: 'text-red-500 text-sm mt-1',

  // Стили для кнопок
  button: (variant: 'primary' | 'secondary' | 'danger' = 'primary', size: 'sm' | 'md' | 'lg' = 'md', isLoading = false) => cn(
    'inline-flex items-center justify-center font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    tailwindUtils.buttonVariant(variant),
    tailwindUtils.size(size),
    tailwindUtils.rounded('md'),
    isLoading && 'opacity-75 cursor-wait'
  )
};

/**
 * Утилита для создания составных классов
 */
export function composeClasses<T extends Record<string, string>>(
  classMap: T
): (keys: (keyof T)[], additionalClasses?: ClassValue[]) => string {
  return (keys, additionalClasses = []) => {
    const composedClasses = keys.map(key => classMap[key]).filter(Boolean);
    return cn(...composedClasses, ...additionalClasses);
  };
}

/**
 * Утилита для создания conditional классов с типизацией
 */
export function createConditionalClasses<T extends string>(
  conditions: Record<T, boolean>,
  classMap: Record<T, string>
): string {
  const activeClasses = Object.entries(conditions)
    .filter(([, condition]) => condition)
    .map(([key]) => classMap[key as T])
    .filter(Boolean);
  
  return cn(...activeClasses);
}

/**
 * Утилиты для отладки классов
 */
export const debugUtils = {
  // Показать границы элементов
  debug: 'border border-red-500',
  debugBg: 'bg-red-100',
  
  // Визуализация сетки
  grid: 'bg-gradient-to-r from-red-500 to-transparent bg-repeat',
  
  // Показать размеры
  showSize: "before:content-[attr(data-size)] before:absolute before:top-0 before:left-0 before:text-xs before:bg-black before:text-white before:px-1"
};

// Экспорт всех утилит как единый объект
export const classUtils = {
  cn,
  conditionalClass,
  mergeClasses,
  createVariantClassNames,
  stateClasses,
  tailwindUtils,
  animationClasses,
  responsiveUtils,
  colorUtils,
  messengerClasses,
  formClasses,
  composeClasses,
  createConditionalClasses,
  debugUtils
};

export default cn;