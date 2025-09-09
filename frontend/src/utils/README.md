# 🛠️ Utils - Утилиты Frontend

Папка `utils` содержит все вспомогательные функции и утилиты, используемые в frontend части мессенджера. Все функции написаны на TypeScript с полной типизацией и обработкой ошибок.

## 📁 Структура папки

```
utils/
├── socket.ts          # WebSocket соединения и обработка событий
├── webrtc.ts          # WebRTC для видео/аудио звонков
├── validation.ts      # Валидация форм и данных
├── formatters.ts      # Форматирование данных для отображения
├── debounce.ts        # Debounce и throttle функции
├── logger.ts          # Система логирования
├── audio.ts           # Аудио утилиты и звуки
├── cn.ts              # Утилиты для CSS классов
├── constants.ts       # Все константы приложения
└── index.ts           # Центральный экспорт всех утилит
```

## 🚀 Быстрый старт

### Импорт всех утилит
```typescript
import { utils, quickUtils } from '@/utils';

// Или импорт конкретных функций
import { validateEmail, formatDate, cn } from '@/utils';
```

### Быстрые функции
```typescript
import { quickUtils } from '@/utils';

// Проверка email
const isValid = quickUtils.isValidEmail('user@example.com');

// Форматирование времени сообщения
const time = quickUtils.messageTime(new Date());

// Объединение CSS классов
const className = quickUtils.cx('btn', 'btn-primary', { active: true });
```

## 📄 Подробное описание файлов

### 🔌 socket.ts
Управление WebSocket соединениями для real-time коммуникации.

```typescript
import { socketManager, connectSocket } from '@/utils/socket';

// Подключение к серверу
await connectSocket('your-jwt-token');

// Отправка сообщения
socketManager.sendMessage('chat-id', 'Hello world!');

// Слушание событий
socketManager.on('message:receive', (message) => {
  console.log('New message:', message);
});
```

**Основные функции:**
- `connectSocket(token)` - подключение к серверу
- `sendMessage()` - отправка сообщений
- `joinChat()` / `leaveChat()` - управление чатами
- `initiateCall()` - инициация звонков
- Автоматическое переподключение

### 📹 webrtc.ts
WebRTC для аудио/видео звонков и демонстрации экрана.

```typescript
import { webrtcManager } from '@/utils/webrtc';

// Инициация видеозвонка
await webrtcManager.initiateCall('call-id', 'user-id', 'video');

// Принятие звонка
await webrtcManager.acceptCall('call-id', 'video');

// Демонстрация экрана
const screenStream = await webrtcManager.startScreenShare('call-id');
```

**Основные функции:**
- Аудио/видео звонки
- Демонстрация экрана
- Управление медиа потоками
- ICE кандидаты и WebRTC сигналинг

### ✅ validation.ts
Валидация всех типов данных с поддержкой i18n.

```typescript
import { validateEmail, validatePassword, validateForm } from '@/utils/validation';

// Валидация email
const emailResult = validateEmail('user@example.com');
console.log(emailResult.isValid); // true
console.log(emailResult.errors);  // []

// Валидация формы
const formResult = validateForm(
  { email: 'test@test.com', password: 'weak' },
  {
    email: validateEmail,
    password: validatePassword
  }
);
```

**Поддерживаемая валидация:**
- Email адреса
- Пароли (с настройками сложности)
- Имена пользователей
- Содержимое сообщений
- Файлы (размер, тип, расширения)
- Номера телефонов
- URL адреса

### 🎨 formatters.ts
Форматирование данных для отображения пользователю.

```typescript
import { formatDate, formatFileSize, formatUserStatus } from '@/utils/formatters';

// Форматирование времени
const messageTime = formatDate(new Date(), 'message'); // "14:30"
const fullDate = formatDate(new Date(), 'full'); // "Понедельник, 15 января 2024 г. в 14:30:25"

// Размер файлов
const size = formatFileSize(1024000); // "1.02 МБ"

// Статус пользователя
const status = formatUserStatus('online'); // "В сети"
```

**Поддерживаемое форматирование:**
- Даты и время (множество форматов)
- Размеры файлов
- Номера телефонов
- Статусы пользователей
- Валюты и числа
- Длительность звонков

### ⏱️ debounce.ts
Debounce и throttle функции для оптимизации производительности.

```typescript
import { debounce, createSearchDebounce, throttle } from '@/utils/debounce';

// Базовый debounce
const debouncedSearch = debounce(searchFunction, 300);

// Специализированный debounce для поиска
const searchDebouncer = createSearchDebounce(searchAPI, 500);

// Throttle для скролла
const throttledScroll = throttle(onScroll, 100);

// Отмена debounce
debouncedSearch.cancel();
```

**Типы debounce:**
- `createSearchDebounce` - для поиска
- `createInputDebounce` - для ввода текста
- `createButtonDebounce` - для кнопок
- `createScrollDebounce` - для скролла
- `throttle` - ограничение частоты

### 📊 logger.ts
Продвинутая система логирования с поддержкой категорий и удаленной отправки.

```typescript
import { logger, logError, authLogger } from '@/utils/logger';

// Базовое логирование
logger.info('User logged in', { userId: '123' });
logger.error('API request failed', error);

// Категоризированное логирование
authLogger.debug('Token validated');
socketLogger.warn('Connection unstable');

// Быстрое логирование
logError('Something went wrong', error);

// Настройка контекста
logger.setUserId('user-123');
logger.setCategory('api');
```

**Возможности:**
- 5 уровней логирования (debug, info, warn, error, fatal)
- Категории логов
- Сохранение в localStorage
- Отправка на сервер
- Экспорт логов
- Измерение производительности

### 🔊 audio.ts
Управление звуками и аудио уведомлениями.

```typescript
import { audioManager, playNotification, playIncomingCall } from '@/utils/audio';

// Воспроизведение уведомления
await playNotification();

// Звук входящего звонка
await playIncomingCall({ loop: true });

// Настройка громкости
audioManager.setVolume(0.8);

// Отключение звуков
audioManager.disableNotifications();
```

**Поддерживаемые звуки:**
- Уведомления о сообщениях
- Входящие/исходящие звонки
- Системные уведомления
- Настройка громкости
- Web Audio API + HTML Audio fallback

### 🎨 cn.ts
Утилиты для работы с CSS классами и Tailwind.

```typescript
import { cn, stateClasses, messengerClasses } from '@/utils/cn';

// Базовое объединение классов
const className = cn('btn', 'btn-primary', { 'btn-active': isActive });

// Состояния компонентов
const loadingClass = stateClasses.loading(isLoading, 'opacity-50', '');

// Стили для сообщений
const messageClass = messengerClasses.message(true, false); // собственное сообщение
```

**Утилиты:**
- Объединение CSS классов
- Условные классы
- Состояния компонентов
- Адаптивные стили
- Анимации
- Специальные стили для мессенджера

### 📋 constants.ts
Все константы приложения в одном месте.

```typescript
import { API_ENDPOINTS, SOCKET_EVENTS, USER_STATUS } from '@/utils/constants';

// API эндпоинты
const loginUrl = API_ENDPOINTS.AUTH.LOGIN;

// WebSocket события
socket.emit(SOCKET_EVENTS.MESSAGE_SEND, data);

// Статусы пользователей
const status = USER_STATUS.ONLINE;
```

**Категории констант:**
- API конфигурация и эндпоинты
- WebSocket события
- Типы данных (сообщения, чаты, звонки)
- Валидация и лимиты
- Настройки UI/UX
- Коды ошибок и сообщения

## 🔧 Примеры использования

### Создание чата с валидацией и логированием
```typescript
import { validateChatName, formatters, logger, socketManager } from '@/utils';

const createChat = async (name: string, members: string[]) => {
  // Валидация
  const validation = validateChatName(name);
  if (!validation.isValid) {
    logger.error('Chat creation failed: invalid name', validation.errors);
    return { success: false, errors: validation.errors };
  }

  try {
    // Отправка через WebSocket
    socketManager.emit('chat:create', { name, members });
    logger.info('Chat created successfully', { name, memberCount: members.length });
    
    return { success: true };
  } catch (error) {
    logger.error('Chat creation failed', error);
    return { success: false, error };
  }
};
```

### Компонент сообщения с форматированием
```typescript
import { formatDate, cn, messengerClasses } from '@/utils';

const MessageComponent = ({ message, isOwn, isDark }) => {
  return (
    <div className={messengerClasses.message(isOwn, isDark)}>
      <p>{message.content}</p>
      <span className="text-xs opacity-70">
        {formatDate(message.createdAt, 'message')}
      </span>
    </div>
  );
};
```

### Поиск с debounce
```typescript
import { createSearchDebounce, validateInput } from '@/utils';

const SearchComponent = () => {
  const [query, setQuery] = useState('');
  
  const debouncedSearch = createSearchDebounce(async (searchTerm: string) => {
    if (!validateInput(searchTerm).isValid) return;
    
    const results = await searchAPI(searchTerm);
    setResults(results);
  }, 300);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  return <input value={query} onChange={handleChange} />;
};
```

## 🔒 Безопасность

### Валидация и санитизация
```typescript
import { sanitizeInput, validateInput } from '@/utils/validation';

// Всегда валидируем и санитизируем пользовательский ввод
const processUserInput = (input: string) => {
  const validation = validateInput(input);
  if (!validation.isValid) {
    throw new Error('Invalid input');
  }
  
  return sanitizeInput(input);
};
```

### Безопасное логирование
```typescript
import { logger } from '@/utils/logger';

// НЕ логируем чувствительные данные
logger.info('User authenticated', { 
  userId: user.id,
  // НЕ включаем пароли, токены и т.д.
});
```

## ⚡ Производительность

### Оптимизация debounce
```typescript
import { presetDebouncers, GroupDebouncer } from '@/utils/debounce';

// Используйте предустановленные debouncer'ы
const searchDebouncer = presetDebouncers.search(searchFunction);

// Или групповой debouncer для множественных элементов
const groupDebouncer = new GroupDebouncer(300);
groupDebouncer.debounce('search-1', performSearch, query1);
groupDebouncer.debounce('search-2', performSearch, query2);
```

### Эффективное логирование
```typescript
import { logger } from '@/utils/logger';

// В продакшене отключаем debug логи
if (process.env.NODE_ENV === 'development') {
  logger.setLevel('debug');
} else {
  logger.setLevel('warn');
}
```

## 🧪 Тестирование

Все утилиты покрыты unit-тестами и имеют примеры использования:

```typescript
// Пример теста валидации
describe('validateEmail', () => {
  it('should validate correct email', () => {
    const result = validateEmail('test@example.com');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
  
  it('should reject invalid email', () => {
    const result = validateEmail('invalid-email');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Некорректный формат email');
  });
});
```

## 📱 Мобильная оптимизация

Утилиты учитывают особенности мобильных устройств:

```typescript
import { quickUtils } from '@/utils';

// Определение мобильного устройства
if (quickUtils.isMobile()) {
  // Используем мобильные настройки медиа
  const constraints = MEDIA_CONSTRAINTS.VIDEO.MOBILE;
}

// Адаптивные debounce задержки
const delay = quickUtils.isMobile() ? 500 : 300;
const debouncedFn = debounce(fn, delay);
```

## 🌐 Интернационализация

Поддержка множественных языков и локализаций:

```typescript
import { formatDate, LANGUAGES, LOCALE_SETTINGS } from '@/utils';

// Форматирование с учетом локали
const formattedDate = formatDate(date, 'full', {
  locale: LANGUAGES.RU,
  timezone: 'Europe/Moscow'
});
```

## 🔄 Миграции и обновления

При обновлении утилит сохраняется обратная совместимость. Все breaking changes документируются в CHANGELOG.md.

## 💡 Лучшие практики

1. **Всегда валидируйте** пользовательский ввод
2. **Используйте debounce** для частых операций
3. **Логируйте ошибки** для отладки
4. **Применяйте типизацию** TypeScript
5. **Кешируйте результаты** тяжелых вычислений
6. **Тестируйте утилиты** на edge cases
7. **Обрабатывайте ошибки** gracefully

---

## 📞 Поддержка

Если у вас есть вопросы по использованию утилит или предложения по улучшению, создайте issue в репозитории проекта.

**Полезные ссылки:**
- [TypeScript документация](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)