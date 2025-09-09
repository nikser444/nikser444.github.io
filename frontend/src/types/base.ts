// frontend/src/types/base.ts
// Базовые типы для всего приложения

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SearchParams {
  query?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface FileUpload {
  file: File;
  preview?: string;
  progress?: number;
  error?: string;
}

export interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
  lastUpdated?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export type Status = 'online' | 'offline' | 'away' | 'busy' | 'invisible';
export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'ru' | 'es' | 'fr' | 'de';

export interface AppSettings {
  theme: Theme;
  language: Language;
  notifications: {
    sound: boolean;
    desktop: boolean;
    email: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
    showLastSeen: boolean;
    allowFriendRequests: boolean;
  };
}

export interface WebSocketEvent<T = any> {
  type: string;
  data: T;
  timestamp: string;
  userId?: string;
  chatId?: string;
}