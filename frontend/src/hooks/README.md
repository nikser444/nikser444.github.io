# 🎣 Кастомные React Хуки - Мессенджер

Этот каталог содержит все кастомные React хуки, используемые в мессенджере. Хуки организованы по функциональности и обеспечивают переиспользуемую логику для различных частей приложения.

## 📁 Структура

```
hooks/
├── index.ts                 # Центральный экспорт всех хуков
├── useAuth.ts              # Авторизация и аутентификация
├── useSocket.ts            # WebSocket соединения
├── useWebRTC.ts            # WebRTC для видео/аудио звонков
├── useChat.ts              # Управление чатами и сообщениями
├── useNotifications.ts     # Система уведомлений
├── useLocalStorage.ts      # Работа с localStorage
├── useDebounce.ts          # Debounce функциональность
├── utilityHooks.ts         # Набор утилитарных хуков
└── README.md               # Эта документация
```

## 🔗 Основные хуки приложения

### `useAuth()` - Авторизация

Управляет состоянием аутентификации пользователя.

```typescript
const {
  user,                    // Текущий пользователь
  isAuthenticated,         // Статус авторизации
  isLoading,              // Состояние загрузки
  error,                  // Ошибки авторизации
  login,                  // Функция входа
  register,               // Функция регистрации
  logout,                 // Функция выхода
  checkAuth,              // Проверка авторизации
  clearError              // Очистка ошибок
} = useAuth();
```

**Особенности:**
- Автоматическая проверка токена при загрузке
- Сохранение токена в localStorage
- Интеграция с Redux store
- Обработка ошибок авторизации

### `useSocket()` - WebSocket соединения

Управляет WebSocket соединением для real-time коммуникации.

```typescript
const {
  socket,                 // Экземпляр Socket.IO
  isConnected,           // Статус соединения
  sendMessage,           // Отправка сообщения
  joinChat,              // Присоединение к чату
  leaveChat,             // Выход из чата
  typingStart,           // Начало печатания
  typingStop,            // Окончание печатания
  updateOnlineStatus     // Обновление статуса
} = useSocket();
```

**Особенности:**
- Автоматическое переподключение
- Обработка событий чата и уведомлений
- Управление статусом пользователя
- Интеграция с авторизацией

### `useWebRTC()` - Видео/аудио звонки

Обеспечивает функциональность WebRTC для звонков.

```typescript
const {
  localStream,           // Локальный медиапоток
  remoteStreams,         // Удаленные медиапотоки
  isCallActive,          // Статус активного звонка
  callState,             // Состояние звонка
  mediaDevices,          // Доступные устройства
  initiateCall,          // Инициация звонка
  acceptCall,            // Принятие звонка
  declineCall,           // Отклонение звонка
  endCall,               // Завершение звонка
  toggleAudio,           // Переключение микрофона
  toggleVideo,           // Переключение камеры
  startScreenShare,      // Демонстрация экрана
  stopScreenShare,       // Остановка демонстрации
  switchCamera,          // Переключение камеры
  changeAudioDevice,     // Смена аудиоустройства
  changeVideoDevice      // Смена видеоустройства
} = useWebRTC();
```

**Особенности:**
- Полная поддержка WebRTC API
- Управление медиаустройствами
- Демонстрация экрана
- Конференц-связь
- Обработка ICE кандидатов

### `useChat()` - Управление чатами

Предоставляет полный функционал для работы с чатами.

```typescript
const {
  chats,                 // Список чатов
  activeChat,            // Активный чат
  messages,              // Сообщения активного чата
  isLoading,            // Состояние загрузки
  error,                // Ошибки
  typingUsers,          // Печатающие пользователи
  loadChats,            // Загрузка чатов
  createChat,           // Создание чата
  updateChatInfo,       // Обновление чата
  deleteChat,           // Удаление чата
  setActiveChat,        // Установка активного чата
  loadMessages,         // Загрузка сообщений
  sendMessage,          // Отправка сообщения
  editMessage,          // Редактирование сообщения
  deleteMessage,        // Удаление сообщения
  markAsRead,           // Отметка как прочитанное
  addParticipant,       // Добавление участника
  removeParticipant,    // Удаление участника
  leaveChat,            // Выход из чата
  searchMessages,       // Поиск сообщений
  clearError            // Очистка ошибок
} = useChat();
```

**Особенности:**
- Интеграция с WebSocket для real-time обновлений
- Поддержка файлов и медиа
- Управление участниками
- Поиск по сообщениям
- Индикаторы печатания

### `useNotifications()` - Система уведомлений

Управляет уведомлениями приложения.

```typescript
const {
  notifications,          // Список уведомлений
  unreadCount,           // Количество непрочитанных
  settings,              // Настройки уведомлений
  isPermissionGranted,   // Разрешение браузера
  requestPermission,     // Запрос разрешения
  showNotification,      // Показ уведомления
  dismissNotification,   // Скрытие уведомления
  markNotificationAsRead,// Отметка как прочитанное
  markAllNotificationsAsRead, // Отметка всех
  clearAllNotifications, // Очистка всех
  updateSettings,        // Обновление настроек
  playNotificationSound  // Воспроизведение звука
} = useNotifications();
```

**Особенности:**
- Браузерные push-уведомления
- Звуковые оповещения
- Настройки по типам уведомлений
- DND режим
- Автоматическая очистка старых уведомлений

## 🛠 Утилитарные хуки

### `useLocalStorage()` - Работа с localStorage

```typescript
const { value, setValue, removeValue, isLoading, error } = useLocalStorage('key', defaultValue);
```

### `useDebounce()` - Debounce значений

```typescript
const debouncedValue = useDebounce(value, 300);
const debouncedCallback = useDebouncedCallback(callback, 300);
```

### `useMediaQuery()` - Медиа-запросы

```typescript
const isMobile = useMediaQuery('(max-width: 768px)');
const { isMobile, isTablet, isDesktop } = useBreakpoints();
```

### `useOnlineStatus()` - Статус интернет-соединения

```typescript
const { isOnline, wasOffline } = useOnlineStatus();
```

### `useToggle()` - Переключение boolean значений

```typescript
const [isOpen, toggleOpen] = useToggle(false);
```

### `useCopyToClipboard()` - Копирование в буфер обмена

```typescript
const [copiedText, copy] = useCopyToClipboard();
```

## 📖 Примеры использования

### Компонент авторизации

```typescript
import { useAuth } from '../hooks';

const LoginForm = () => {
  const { login, isLoading, error } = useAuth();
  
  const handleSubmit = async (credentials) => {
    const success = await login(credentials);
    if (success) {
      navigate('/chat');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* форма */}
      {error && <div className="error">{error}</div>}
      <button disabled={isLoading}>
        {isLoading ? 'Вход...' : 'Войти'}
      </button>
    </form>
  );
};
```

### Чат компонент

```typescript
import { useChat, useSocket } from '../hooks';

const ChatWindow = () => {
  const { activeChat, messages, sendMessage, typingUsers } = useChat();
  const { isConnected } = useSocket();
  
  const handleSendMessage = (content) => {
    if (isConnected && content.trim()) {
      sendMessage(content);
    }
  };
  
  return (
    <div className="chat-window">
      <div className="messages">
        {messages.map(message => (
          <MessageItem key={message.id} message={message} />
        ))}
      </div>
      
      {typingUsers.length > 0 && (
        <div className="typing-indicator">
          {typingUsers.join(', ')} печатает...
        </div>
      )}
      
      <MessageInput 
        onSend={handleSendMessage}
        disabled={!isConnected}
      />
    </div>
  );
};
```

### Звонок компонент

```typescript
import { useWebRTC } from '../hooks';

const VideoCall = () => {
  const {
    localStream,
    remoteStreams,
    isCallActive,
    toggleAudio,
    toggleVideo,
    endCall
  } = useWebRTC();
  
  return (
    <div className="video-call">
      {localStream && (
        <video
          ref={ref => ref && (ref.srcObject = localStream)}
          autoPlay
          muted
          className="local-video"
        />
      )}
      
      {Array.from(remoteStreams.entries()).map(([userId, stream]) => (
        <video
          key={userId}
          ref={ref => ref && (ref.srcObject = stream)}
          autoPlay
          className="remote-video"
        />
      ))}
      
      <div className="call-controls">
        <button onClick={toggleAudio}>Микрофон</button>
        <button onClick={toggleVideo}>Камера</button>
        <button onClick={endCall}>Завершить</button>
      </div>
    </div>
  );
};
```

## 🔧 Интеграция с Redux

Хуки интегрированы с Redux store для централизованного управления состоянием:

```typescript
// store/index.ts
export interface RootState {
  auth: AuthState;
  chat: ChatState;
  call: CallState;
  notification: NotificationState;
  user: UserState;
}
```

## ⚡ Производительность

- Все хуки оптимизированы с использованием `useCallback` и `useMemo`
- Debounce для частых операций (поиск, typing indicators)
- Lazy loading для тяжелых операций
- Автоматическая очистка ресурсов при размонтировании

## 🧪 Тестирование

Каждый хук покрыт unit-тестами с использованием `@testing-library/react-hooks`:

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from '../useAuth';

test('должен авторизовать пользователя', async () => {
  const { result } = renderHook(() => useAuth());
  
  await act(async () => {
    await result.current.login({ email: 'test@test.com', password: 'password' });
  });
  
  expect(result.current.isAuthenticated).toBe(true);
});
```

## 📝 Лучшие практики

1. **Именование**: Все хуки начинаются с `use`
2. **Возврат объекта**: Возвращаем объект вместо массива для именованных значений
3. **TypeScript**: Полная типизация всех хуков
4. **Обработка ошибок**: Каждый хук обрабатывает возможные ошибки
5. **Cleanup**: Автоматическая очистка ресурсов при размонтировании
6. **Мемоизация**: Оптимизация производительности с помощью `useCallback` и `useMemo`

## 🚀 Добавление новых хуков

1. Создайте файл `useYourHook.ts`
2. Реализуйте хук с полной типизацией
3. Добавьте экспорт в `index.ts`
4. Покройте тестами
5. Обновите документацию