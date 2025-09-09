# WebSocket Обработчики для Мессенджера

Эта папка содержит все WebSocket обработчики для работы мессенджера в реальном времени.

## Структура файлов

```
sockets/
├── index.ts              # Главный менеджер сокетов
├── chatSocket.ts         # Обработчик сообщений чата
├── callSocket.ts         # Обработчик звонков
├── videoSocket.ts        # Обработчик видеозвонков
├── screenSocket.ts       # Обработчик демонстрации экрана
└── socketSetup.ts        # Настройка и утилиты
```

## Основные компоненты

### SocketManager (`index.ts`)
Главный класс для управления всеми Socket.io соединениями и обработчиками.

**Основные функции:**
- Инициализация всех обработчиков
- Управление подключениями пользователей
- Отслеживание онлайн статуса
- Глобальные уведомления

### ChatSocketHandler (`chatSocket.ts`)
Обработчик для сообщений чата в реальном времени.

**События:**
- `message:send` - Отправка сообщения
- `message:receive` - Получение сообщения
- `message:read` - Отметка о прочтении
- `message:edit` - Редактирование сообщения
- `message:delete` - Удаление сообщения
- `typing:start/stop` - Индикация набора

### CallSocketHandler (`callSocket.ts`)
Обработчик для аудио звонков и WebRTC сигналинга.

**События:**
- `call:initiate` - Инициация звонка
- `call:response` - Ответ на звонок (принять/отклонить)
- `call:end` - Завершение звонка
- `webrtc:signal` - WebRTC сигналы
- `conference:create` - Создание конференции

### VideoSocketHandler (`videoSocket.ts`)
Специализированный обработчик для видеозвонков.

**События:**
- `video:stream:start/stop` - Управление видеопотоком
- `video:control:toggle` - Включение/отключение камеры/микрофона
- `video:quality:change` - Изменение качества видео
- `conference:video:join/leave` - Присоединение к видеоконференции

### ScreenSocketHandler (`screenSocket.ts`)
Обработчик для демонстрации экрана и удаленного управления.

**События:**
- `screen:share:start/stop` - Начало/остановка демонстрации
- `screen:remote:request` - Запрос удаленного управления
- `screen:annotation:add` - Добавление аннотаций
- `screen:quality:change` - Изменение качества

## Инициализация

### В основном приложении (`app.ts`)

```typescript
import { initializeSocketIO, attachSocketManager } from './sockets/socketSetup';
import express from 'express';

const app = express();

// Инициализируем Socket.io
const socketManager = initializeSocketIO(app);

// Добавляем middleware для доступа к socketManager в роутах
app.use(attachSocketManager);

// Запускаем сервер
const server = socketManager.getHttpServer();
server.listen(3001, () => {
  console.log('Server running on port 3001');
});
```

### В контроллерах

```typescript
import { getSocketManager, SocketUtils } from '../sockets/socketSetup';

export class MessageController {
  async sendMessage(req: Request, res: Response) {
    // ... логика сохранения сообщения в БД
    
    // Отправляем через WebSocket
    const socketManager = getSocketManager();
    socketManager.sendToChat(chatId, 'message:receive', {
      message: newMessage,
      chatId
    });
    
    // Или используя утилиту
    await SocketUtils.sendChatMessage(chatId, newMessage);
  }
}
```

## Аутентификация

Все сокет-соединения проходят аутентификацию через middleware:

```typescript
// middleware/auth.ts
export const verifySocketAuth = async (socket: Socket, next: Function) => {
  try {
    const token = socket.handshake.auth.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return next(new Error('User not found'));
    }
    
    (socket as AuthSocket).userId = user.id;
    (socket as AuthSocket).user = user;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
};
```

## Использование на фронтенде

```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: localStorage.getItem('token')
  }
});

// Подключение
socket.on('connect', () => {
  console.log('Connected to server');
  socket.emit('user:authenticate', { token: localStorage.getItem('token') });
});

// Отправка сообщения
socket.emit('message:send', {
  chatId: '123',
  content: 'Привет!',
  type: 'text'
});

// Получение сообщений
socket.on('message:receive', (data) => {
  console.log('New message:', data.message);
});

// Звонки
socket.emit('call:initiate', {
  receiverId: 'user123',
  callType: 'video'
});

socket.on('call:incoming', (data) => {
  console.log('Incoming call from:', data.caller.username);
});
```

## События и их параметры

### Чат события

```typescript
// Отправка сообщения
socket.emit('message:send', {
  chatId: string,
  content: string,
  type: 'text' | 'image' | 'file' | 'audio' | 'video',
  replyTo?: string,
  attachments?: Array<{
    type: string,
    url: string,
    name: string,
    size: number
  }>
});

// Начало набора
socket.emit('typing:start', {
  chatId: string,
  isTyping: boolean
});
```

### События звонков

```typescript
// Инициация звонка
socket.emit('call:initiate', {
  receiverId: string,
  callType: 'audio' | 'video',
  chatId?: string
});

// Ответ на звонок
socket.emit('call:response', {
  callId: string,
  action: 'accept' | 'decline'
});
```

### Видео события

```typescript
// Начало видеопотока
socket.emit('video:stream:start', {
  callId: string,
  hasVideo: boolean,
  hasAudio: boolean
});

// Управление видео/аудио
socket.emit('video:control:toggle', {
  callId: string,
  action: 'mute_video' | 'unmute_video' | 'mute_audio' | 'unmute_audio',
  enabled: boolean
});
```

### События демонстрации экрана

```typescript
// Начало демонстрации
socket.emit('screen:share:start', {
  callId: string,
  hasAudio: boolean,
  quality: 'low' | 'medium' | 'high'
});

// Добавление аннотации
socket.emit('screen:annotation:add', {
  callId: string,
  type: 'draw' | 'pointer' | 'text' | 'clear',
  data: any
});
```

## Комнаты (Rooms)

Socket.io использует комнаты для группировки соединений:

- `user:{userId}` - персональная комната пользователя
- `chat:{chatId}` - комната чата
- `call:{callId}` - комната звонка
- `video:{callId}` - комната видеозвонка
- `screen:{callId}` - комната демонстрации экрана

## Обработка ошибок

Все обработчики включают обработку ошибок:

```typescript
socket.on('error', (error) => {
  console.error('Socket error:', error.message);
});

// Специфичные ошибки
socket.on('call:error', (error) => {
  console.error('Call error:', error.message);
});

socket.on('video:error', (error) => {
  console.error('Video error:', error.message);
});
```

## Логирование

Все события логируются через winston logger:

```typescript
import { logger } from '../utils/logger';

logger.info(`User ${userId} connected`);
logger.error('Error in socket handler:', error);
```

## Конфигурация

Основные настройки в `socketSetup.ts`:

```typescript
export const SocketConfig = {
  TIMEOUTS: {
    CALL_TIMEOUT: 60 * 1000, // Таймаут звонка
    TYPING_TIMEOUT: 3 * 1000, // Таймаут набора
  },
  
  LIMITS: {
    MAX_MESSAGE_LENGTH: 4096, // Максимальная длина сообщения
    MAX_CONCURRENT_CALLS: 5, // Максимум одновременных звонков
    MAX_CONFERENCE_PARTICIPANTS: 50 // Максимум участников конференции
  }
};
```

## Безопасность

1. **Аутентификация** - все соединения требуют действительный JWT токен
2. **Авторизация** - проверка прав доступа к чатам и звонкам
3. **Валидация** - валидация всех входящих данных
4. **Лимиты** - ограничения на размер данных и количество подключений

## Тестирование

Для тестирования используйте Socket.io клиент:

```javascript
// Тест подключения
const socket = io('http://localhost:3001', {
  auth: { token: 'your-jwt-token' }
});

// Тест отправки сообщения
socket.emit('message:send', {
  chatId: 'test-chat',
  content: 'Test message'
});
```

## Мониторинг

Получение статистики:

```typescript
const stats = socketManager.getSocketStats();
console.log('Active connections:', stats.totalConnections);
console.log('Online users:', stats.onlineUsers);
```

## Производительность

1. **Пулинг соединений** - переиспользование соединений
2. **Комнаты** - эффективная маршрутизация сообщений
3. **Валидация** - проверка данных на входе
4. **Логирование** - асинхронное логирование
5. **Очистка** - периодическая очистка неактивных соединений