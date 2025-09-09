# Система типов мессенджера

Полная система TypeScript типов для мессенджера с поддержкой реального времени, звонков и видеозвонков.

## Структура папки types

```
src/types/
├── Base.ts          # Базовые типы и интерфейсы
├── User.ts          # Типы пользователя и аутентификации
├── Chat.ts          # Типы чатов и участников
├── Message.ts       # Типы сообщений и медиа
├── Friend.ts        # Типы системы друзей
├── Call.ts          # Типы звонков и WebRTC
├── Notification.ts  # Типы уведомлений
└── index.ts         # Главный файл экспорта
```

## Основные компоненты

### Base.ts - Базовые типы
- **UserStatus, UserRole, VerificationStatus** - основные перечисления
- **BaseModel** - базовый интерфейс для всех моделей данных
- **PaginationOptions, PaginationResult** - типы для пагинации
- **ApiResponse, ApiError** - стандартные ответы API
- **FileInfo** - информация о файлах и медиа
- **PrivacySettings, NotificationSettings** - пользовательские настройки

### User.ts - Пользователи
- **User** - полная модель пользователя
- **PublicUserProfile, UserSummary** - публичные данные
- **CreateUserDto, UpdateUserDto** - DTO для CRUD операций
- **LoginCredentials, RegisterCredentials** - аутентификация
- **AuthTokens, JwtPayload** - JWT токены
- **UserSearchQuery, UserActivity** - поиск и активность

### Chat.ts - Чаты
- **Chat** - модель чата/беседы
- **ChatMember** - участники чата с ролями и статусами
- **ChatType, ChatMemberRole, ChatMemberStatus** - перечисления
- **CreateChatDto, UpdateChatDto** - управление чатами
- **ChatInvitation** - приглашения в чат
- **ChatStatistics, ChatModerationAction** - статистика и модерация

### Message.ts - Сообщения
- **Message** - модель сообщения
- **MessageType, MessageStatus** - типы и статусы сообщений
- **MessageMetadata** - дополнительные данные (геолокация, опросы, превью ссылок)
- **MessagePoll, PollOption** - функциональность опросов
- **MessageReaction, MessageReadInfo** - реакции и прочтение
- **CreateMessageDto, UpdateMessageDto** - управление сообщениями
- **ScheduledMessage, MessageDraft** - планирование и черновики

### Friend.ts - Друзья
- **FriendRequest** - заявки в друзья
- **Friendship** - дружеские связи
- **FriendRequestStatus, FriendshipStatus** - статусы
- **FriendSuggestion** - предложения друзей
- **BlockedUser** - заблокированные пользователи
- **FriendActivity** - активность друзей
- **FriendsPrivacySettings** - настройки приватности

### Call.ts - Звонки
- **Call** - модель звонка
- **CallParticipant** - участники звонка
- **CallType, CallStatus, ParticipantStatus** - перечисления
- **WebRTCSignal, RTCOfferDto, RTCAnswerDto** - WebRTC сигналинг
- **CallRecording, ScreenShare** - запись и демонстрация экрана
- **CallStatistics, CallDiagnostics** - статистика и диагностика
- **UserCallSettings** - пользовательские настройки звонков

### Notification.ts - Уведомления
- **Notification** - модель уведомления
- **NotificationType, NotificationPriority** - типы и приоритеты
- **UserNotificationSettings** - настройки пользователя
- **PushSubscription** - push-уведомления
- **NotificationTemplate** - шаблоны уведомлений
- **NotificationStatistics, NotificationAnalytics** - аналитика

## Socket.IO типы

### ServerToClientEvents
События, отправляемые сервером клиентам:

#### Сообщения
- `message:new` - новое сообщение
- `message:updated` - обновление сообщения
- `message:deleted` - удаление сообщения
- `message:typing` - индикатор печати
- `message:read` - прочтение сообщения
- `message:reaction` - реакция на сообщение

#### Звонки
- `call:initiated` - инициация звонка
- `call:accepted` - принятие звонка
- `call:declined` - отклонение звонка
- `call:ended` - завершение звонка
- `call:participant:joined` - присоединение участника
- `call:participant:left` - выход участника

#### WebRTC сигналинг
- `webrtc:offer` - WebRTC offer
- `webrtc:answer` - WebRTC answer
- `webrtc:ice-candidate` - ICE кандидат

#### Пользователи и чаты
- `user:online/offline` - статус пользователя
- `chat:created/updated` - изменения чата
- `friend:request:*` - события друзей

### ClientToServerEvents
События, отправляемые клиентами серверу:

#### Аутентификация
- `auth` - аутентификация пользователя
- `join:room/chat` - присоединение к комнате/чату

#### Сообщения
- `message:send` - отправка сообщения
- `message:edit` - редактирование
- `message:delete` - удаление
- `message:typing:start/stop` - начало/конец печати

#### Звонки
- `call:initiate` - инициация звонка
- `call:join/leave` - присоединение/выход
- `call:accept/decline` - принятие/отклонение

## Использование

### Импорт типов
```typescript
// Импорт конкретных типов
import { User, Message, Call } from '../types';

// Импорт всех типов
import * as Types from '../types';

// Импорт Socket.IO типов
import { ServerToClientEvents, ClientToServerEvents } from '../types';
```

### Типизация Socket.IO сервера
```typescript
import { Server } from 'socket.io';
import { ServerToClientEvents, ClientToServerEvents } from '../types';

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server);

io.on('connection', (socket) => {
  socket.on('message:send', (data, callback) => {
    // data автоматически типизирован как CreateMessageDto
    // callback типизирован с правильным response типом
  });
});
```

### Типизация API контроллеров
```typescript
import { RequestWithUser, CreateMessageDto, Message } from '../types';

export const sendMessage = async (req: RequestWithUser, res: Response) => {
  const messageData: CreateMessageDto = req.body;
  const senderId = req.user!.id;
  
  // Логика отправки сообщения
  const message: Message = await messageService.create({
    ...messageData,
    senderId
  });
  
  res.json({ success: true, data: message });
};
```

## Константы и лимиты

Система включает предустановленные константы для лимитов:

- **DEFAULT_PAGINATION** - настройки пагинации по умолчанию
- **MESSAGE_LIMITS** - лимиты сообщений (длина, файлы, время редактирования)
- **CALL_LIMITS** - лимиты звонков (участники, продолжительность, размер записи)
- **CHAT_LIMITS** - лимиты чатов (участники, длина заголовка)
- **USER_LIMITS** - лимиты пользователей (друзья, размер аватара)

## Валидация

Все DTO типы включают необходимые поля для валидации:

```typescript
import { CreateUserDto } from '../types';

const validateUser = (userData: CreateUserDto) => {
  // TypeScript автоматически проверит наличие обязательных полей
  return {
    email: userData.email,     // обязательное поле
    username: userData.username, // обязательное поле
    password: userData.password, // обязательное поле
    firstName: userData.firstName // необязательное поле
  };
};
```

## Расширение типов

Для добавления новых типов:

1. Создайте новый файл в папке `types/`
2. Определите интерфейсы и типы
3. Добавьте экспорт в `index.ts`
4. Обновите Socket.IO события при необходимости

```typescript
// types/CustomFeature.ts
export interface CustomFeature extends BaseModel {
  name: string;
  data: any;
}

export interface CreateCustomFeatureDto {
  name: string;
  data: any;
}

// types/index.ts
export * from './CustomFeature';
```

## Обработка ошибок

Используйте предопределенные коды ошибок:

```typescript
import { SocketErrorCodes, SocketError } from '../types';

const handleError = (error: any): SocketError => {
  return {
    code: SocketErrorCodes.VALIDATION_ERROR,
    message: error.message,
    timestamp: new Date()
  };
};
```

## Лучшие практики

1. **Всегда используйте типы** - избегайте `any` в пользу конкретных типов
2. **DTO для API** - используйте DTO типы для входных данных API
3. **Валидация** - проверяйте типы на runtime с помощью библиотек валидации
4. **Версионирование** - при изменении типов учитывайте обратную совместимость
5. **Документация** - документируйте сложные типы и их использование

## Зависимости

Система типов зависит от:
- `express` - для типов Request/Response
- `socket.io` - для WebSocket типов
- Standard TypeScript lib types для DOM и WebRTC

Убедитесь, что все зависимости установлены:
```bash
npm install @types/express @types/node
```