export type DateFormatType = 
  | 'full' 
  | 'date' 
  | 'time' 
  | 'relative' 
  | 'short' 
  | 'medium' 
  | 'long' 
  | 'message';

export interface FormatOptions {
  locale?: string;
  timezone?: string;
}

// Форматирование времени и даты
export const formatDate = (
  date: Date | string | number,
  type: DateFormatType = 'medium',
  options: FormatOptions = {}
): string => {
  const { locale = 'ru-RU', timezone = 'Europe/Moscow' } = options;
  
  let dateObj: Date;
  
  if (typeof date === 'string' || typeof date === 'number') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  
  if (isNaN(dateObj.getTime())) {
    return 'Некорректная дата';
  }

  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  switch (type) {
    case 'relative':
      return formatRelativeTime(diffMinutes, diffHours, diffDays, dateObj, now);
    
    case 'message':
      return formatMessageTime(dateObj, now, locale, timezone);
    
    case 'time':
      return dateObj.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone
      });
    
    case 'date':
      return dateObj.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: timezone
      });
    
    case 'short':
      return dateObj.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        timeZone: timezone
      });
    
    case 'medium':
      return dateObj.toLocaleString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone
      });
    
    case 'long':
      return dateObj.toLocaleString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: timezone
      });
    
    case 'full':
      return dateObj.toLocaleString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: timezone
      });
    
    default:
      return dateObj.toLocaleString(locale, { timeZone: timezone });
  }
};

// Относительное время
const formatRelativeTime = (
  diffMinutes: number,
  diffHours: number,
  diffDays: number,
  dateObj: Date,
  now: Date
): string => {
  if (diffMinutes < 1) {
    return 'Только что';
  }
  
  if (diffMinutes < 60) {
    return `${diffMinutes} мин. назад`;
  }
  
  if (diffHours < 24) {
    return `${diffHours} ч. назад`;
  }
  
  if (diffDays < 7) {
    return `${diffDays} дн. назад`;
  }
  
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} нед. назад`;
  }
  
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} мес. назад`;
  }
  
  const years = Math.floor(diffDays / 365);
  return `${years} г. назад`;
};

// Форматирование времени для сообщений
const formatMessageTime = (
  dateObj: Date,
  now: Date,
  locale: string,
  timezone: string
): string => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const diffDays = Math.floor((today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Сегодня - показываем только время
    return dateObj.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone
    });
  }
  
  if (diffDays === 1) {
    // Вчера
    return `Вчера ${dateObj.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone
    })}`;
  }
  
  if (diffDays < 7) {
    // На этой неделе - показываем день недели
    return dateObj.toLocaleDateString(locale, {
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone
    });
  }
  
  if (dateObj.getFullYear() === now.getFullYear()) {
    // В этом году - показываем дату без года
    return dateObj.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone
    });
  }
  
  // В другом году - полная дата
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone
  });
};

// Форматирование размера файла
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Б';
  
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Форматирование номера телефона
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Удаляем все не цифры, кроме +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Российские номера
  if (cleaned.startsWith('+7') || cleaned.startsWith('7')) {
    const number = cleaned.startsWith('+7') ? cleaned.slice(2) : cleaned.slice(1);
    if (number.length === 10) {
      return `+7 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6, 8)}-${number.slice(8)}`;
    }
  }
  
  // Международные номера
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  return phone;
};

// Форматирование имени пользователя
export const formatUsername = (username: string): string => {
  if (!username) return '';
  return `@${username}`;
};

// Форматирование полного имени
export const formatFullName = (firstName?: string, lastName?: string): string => {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.join(' ');
};

// Сокращение длинного текста
export const truncateText = (text: string, maxLength: number = 100, suffix: string = '...'): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
};

// Форматирование количества участников
export const formatMemberCount = (count: number): string => {
  if (count === 0) return 'Нет участников';
  if (count === 1) return '1 участник';
  if (count < 5) return `${count} участника`;
  return `${count} участников`;
};

// Форматирование количества сообщений
export const formatMessageCount = (count: number): string => {
  if (count === 0) return 'Нет сообщений';
  if (count === 1) return '1 сообщение';
  if (count < 5) return `${count} сообщения`;
  return `${count} сообщений`;
};

// Форматирование количества непрочитанных сообщений
export const formatUnreadCount = (count: number): string => {
  if (count === 0) return '';
  if (count > 99) return '99+';
  return count.toString();
};

// Форматирование времени звонка
export const formatCallDuration = (seconds: number): string => {
  if (seconds < 0) return '00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Форматирование статуса пользователя
export const formatUserStatus = (
  status: 'online' | 'offline' | 'away' | 'busy',
  lastSeen?: Date | string
): string => {
  switch (status) {
    case 'online':
      return 'В сети';
    case 'away':
      return 'Не на месте';
    case 'busy':
      return 'Занят';
    case 'offline':
      if (lastSeen) {
        const lastSeenDate = new Date(lastSeen);
        const now = new Date();
        const diffMs = now.getTime() - lastSeenDate.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        
        if (diffMinutes < 5) {
          return 'Был в сети недавно';
        }
        
        return `Был в сети ${formatDate(lastSeenDate, 'relative')}`;
      }
      return 'Не в сети';
    default:
      return 'Неизвестно';
  }
};

// Форматирование типа файла для отображения
export const formatFileType = (mimeType: string): string => {
  const typeMap: Record<string, string> = {
    'image/jpeg': 'Изображение JPEG',
    'image/jpg': 'Изображение JPG',
    'image/png': 'Изображение PNG',
    'image/gif': 'GIF-изображение',
    'image/webp': 'Изображение WebP',
    'application/pdf': 'PDF-документ',
    'application/msword': 'Документ Word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Документ Word',
    'application/vnd.ms-excel': 'Таблица Excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Таблица Excel',
    'text/plain': 'Текстовый файл',
    'audio/mpeg': 'Аудио MP3',
    'audio/wav': 'Аудио WAV',
    'video/mp4': 'Видео MP4',
    'video/avi': 'Видео AVI',
    'video/quicktime': 'Видео MOV'
  };
  
  return typeMap[mimeType] || 'Файл';
};

// Форматирование адреса
export const formatAddress = (address: {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}): string => {
  const parts = [
    address.street,
    address.city,
    address.state,
    address.country,
    address.zipCode
  ].filter(Boolean);
  
  return parts.join(', ');
};

// Форматирование процентов
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

// Форматирование валюты
export const formatCurrency = (
  amount: number,
  currency: string = 'RUB',
  locale: string = 'ru-RU'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Форматирование числа с разделителями
export const formatNumber = (
  value: number,
  locale: string = 'ru-RU',
  options?: Intl.NumberFormatOptions
): string => {
  return new Intl.NumberFormat(locale, options).format(value);
};

// Форматирование списка имен
export const formatNamesList = (names: string[], maxVisible: number = 3): string => {
  if (!names.length) return '';
  
  if (names.length <= maxVisible) {
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} и ${names[1]}`;
    return names.slice(0, -1).join(', ') + ` и ${names[names.length - 1]}`;
  }
  
  const visibleNames = names.slice(0, maxVisible);
  const remaining = names.length - maxVisible;
  return `${visibleNames.join(', ')} и еще ${remaining}`;
};

// Форматирование URL для отображения
export const formatUrlForDisplay = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
};

// Форматирование времени до события
export const formatTimeUntil = (targetDate: Date | string): string => {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  
  if (diffMs < 0) return 'Прошло';
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days} дн. ${hours} ч.`;
  }
  
  if (hours > 0) {
    return `${hours} ч. ${minutes} мин.`;
  }
  
  return `${minutes} мин.`;
};

// Форматирование объема данных
export const formatDataUsage = (bytes: number): string => {
  return formatFileSize(bytes);
};

// Форматирование скорости (байт/сек)
export const formatSpeed = (bytesPerSecond: number): string => {
  const size = formatFileSize(bytesPerSecond);
  return `${size}/с`;
};

// Форматирование IP адреса
export const formatIPAddress = (ip: string): string => {
  // Простая валидация IPv4
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  if (ipv4Regex.test(ip)) {
    return ip;
  }
  
  // Для IPv6 и других форматов возвращаем как есть
  return ip;
};

// Форматирование версии
export const formatVersion = (version: string): string => {
  if (!version) return '';
  if (version.startsWith('v')) return version;
  return `v${version}`;
};

// Форматирование хэша (короткая версия)
export const formatHash = (hash: string, length: number = 8): string => {
  if (!hash) return '';
  if (hash.length <= length) return hash;
  return `${hash.slice(0, length)}...`;
};

// Форматирование строки поиска
export const formatSearchQuery = (query: string): string => {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
};

// Форматирование тегов
export const formatTags = (tags: string[]): string => {
  return tags.map(tag => `#${tag}`).join(' ');
};

// Форматирование температуры
export const formatTemperature = (celsius: number, unit: 'C' | 'F' = 'C'): string => {
  if (unit === 'F') {
    const fahrenheit = (celsius * 9/5) + 32;
    return `${Math.round(fahrenheit)}°F`;
  }
  return `${Math.round(celsius)}°C`;
};

// Форматирование рейтинга
export const formatRating = (rating: number, maxRating: number = 5): string => {
  const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(maxRating - Math.floor(rating));
  return `${stars} (${rating.toFixed(1)})`;
};

// Форматирование пароля для отображения
export const maskPassword = (password: string): string => {
  return '•'.repeat(password.length);
};

// Форматирование номера карты
export const formatCardNumber = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\D/g, '');
  const groups = cleaned.match(/.{1,4}/g) || [];
  return groups.join(' ');
};

// Форматирование номера заказа
export const formatOrderNumber = (orderNumber: string | number): string => {
  return `#${orderNumber}`;
};

// Капитализация первой буквы
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Конвертация в camelCase
export const toCamelCase = (str: string): string => {
  return str.replace(/-(.)/g, (_, letter) => letter.toUpperCase());
};

// Конвертация в kebab-case
export const toKebabCase = (str: string): string => {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
};

// Форматирование JSON для отображения
export const formatJSON = (obj: any): string => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
};

// Извлечение доменного имени из email
export const extractEmailDomain = (email: string): string => {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1] : '';
};

// Форматирование уведомления
export const formatNotificationMessage = (
  type: string,
  data: Record<string, any>
): string => {
  switch (type) {
    case 'message':
      return `Новое сообщение от ${data.senderName}`;
    case 'friend_request':
      return `${data.senderName} отправил вам заявку в друзья`;
    case 'call':
      return `Входящий ${data.type === 'video' ? 'видео' : 'аудио'}звонок от ${data.callerName}`;
    case 'group_invite':
      return `Вас пригласили в группу "${data.groupName}"`;
    default:
      return 'Новое уведомление';
  }
};

// Форматирование статистики
export const formatStats = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}М`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}К`;
  }
  return value.toString();
};

// Форматирование времени онлайн
export const formatOnlineTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} мин.`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours} ч. ${remainingMinutes} мин.` : `${hours} ч.`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  return remainingHours > 0 ? `${days} дн. ${remainingHours} ч.` : `${days} дн.`;
};

// Объект со всеми константами для форматирования
export const FORMAT_CONSTANTS = {
  MAX_TEXT_LENGTH: 100,
  MAX_VISIBLE_NAMES: 3,
  SHORT_HASH_LENGTH: 8,
  MAX_RATING: 5,
  BYTES_IN_KB: 1024,
  BYTES_IN_MB: 1024 * 1024,
  BYTES_IN_GB: 1024 * 1024 * 1024,
  MINUTES_IN_HOUR: 60,
  HOURS_IN_DAY: 24,
  DAYS_IN_WEEK: 7,
  DAYS_IN_MONTH: 30,
  DAYS_IN_YEAR: 365
} as const;