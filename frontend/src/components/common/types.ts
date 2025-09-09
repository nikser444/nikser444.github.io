// Общие интерфейсы и типы для компонентов

// Базовые типы размеров
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ExtendedSize = Size | '2xl';

// Статусы пользователя
export type UserStatus = 'online' | 'offline' | 'away' | 'busy';

// Варианты кнопок
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'ghost' | 'outline';

// Варианты полей ввода
export type InputVariant = 'default' | 'filled' | 'outlined';

// Позиции для тултипов и выпадающих меню
export type Position = 'top' | 'bottom' | 'left' | 'right';

// Типы форм
export type FormVariant = 'default' | 'filled' | 'outlined';

// Типы уведомлений
export interface Notification {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
  read?: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: ButtonVariant;
}

// Базовые пропсы для компонентов
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Пропсы для кликабельных элементов
export interface ClickableProps {
  onClick?: (event: React.MouseEvent) => void;
  onKeyPress?: (event: React.KeyboardEvent) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

// Пропсы для элементов с фокусом
export interface FocusableProps {
  onFocus?: (event: React.FocusEvent) => void;
  onBlur?: (event: React.FocusEvent) => void;
  tabIndex?: number;
}

// Типы для анимаций
export type AnimationType = 'none' | 'fade' | 'slide' | 'scale' | 'pulse' | 'bounce';

// Типы для тем
export type ThemeMode = 'light' | 'dark' | 'system';

// Типы для валидации форм
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | undefined;
}

export interface FormFieldState {
  value: any;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

// Типы для модальных окон
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalAction {
  label: string;
  onClick: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  isLoading?: boolean;
}

// Типы для аватаров
export interface AvatarData {
  src?: string | null;
  alt: string;
  status?: UserStatus;
}

// Типы для меню и навигации
export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  onClick?: () => void;
  badge?: number;
  disabled?: boolean;
  children?: MenuItem[];
}

// Типы для загрузки файлов
export interface FileUploadOptions {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadProgress?: number;
  error?: string;
}

// Типы для поиска
export interface SearchOptions {
  placeholder?: string;
  minLength?: number;
  debounceMs?: number;
  showSuggestions?: boolean;
}

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  avatar?: string;
  type: 'user' | 'chat' | 'message' | 'file';
}

// Типы для пагинации
export interface PaginationOptions {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Типы для сортировки
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Типы для фильтрации
export interface FilterOption {
  key: string;
  label: string;
  value: any;
  count?: number;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  multiple?: boolean;
}

// Экспорт всех типов для удобного импорта
export * from './Button';
export * from './Input';
export * from './Avatar';
export * from './Modal';
export * from './Tooltip';
export * from './LoadingSpinner';