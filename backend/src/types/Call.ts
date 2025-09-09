import { BaseEntity, CallType, CallStatus, CallStats } from './Base';
import { PublicUser } from './User';

// Основной интерфейс звонка
export interface Call extends BaseEntity {
  callerId: string;
  caller?: PublicUser;
  receiverId?: string;
  receiver?: PublicUser;
  chatId?: string;
  type: CallType;
  status: CallStatus;
  startedAt?: Date;
  endedAt?: Date;
  duration: number; // в секундах
  isIncoming: boolean;
  isMissed: boolean;
  quality?: 'poor' | 'fair' | 'good' | 'excellent';
  endReason?: CallEndReason;
  recordingUrl?: string;
  stats?: CallStats;
  participants: CallParticipant[];
  maxParticipants?: number;
  isRecording: boolean;
  isScreenSharing: boolean;
  screenSharerId?: string;
}

// Участник звонка
export interface CallParticipant {
  userId: string;
  user?: PublicUser;
  joinedAt: Date;
  leftAt?: Date;
  status: 'connecting' | 'connected' | 'disconnected' | 'muted' | 'on_hold';
  role: 'host' | 'participant' | 'observer';
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  connectionQuality: 'poor' | 'fair' | 'good' | 'excellent';
  audioLevel: number; // 0-100
  peerId?: string; // для WebRTC
}

// Причина завершения звонка
export type CallEndReason = 
  | 'completed' 
  | 'declined' 
  | 'missed' 
  | 'cancelled' 
  | 'busy' 
  | 'no_answer' 
  | 'connection_failed' 
  | 'network_error' 
  | 'timeout' 
  | 'kicked';

// Данные для инициации звонка
export interface InitiateCallData {
  receiverId?: string;
  receiverIds?: string[];
  chatId?: string;
  type: CallType;
  videoEnabled?: boolean;
  audioEnabled?: boolean;
  maxParticipants?: number;
  recordingEnabled?: boolean;
}

// Ответ на входящий звонок
export interface CallAnswerData {
  callId: string;
  accept: boolean;
  videoEnabled?: boolean;
  audioEnabled?: boolean;
}

// Обновление настроек звонка
export interface UpdateCallSettings {
  callId: string;
  isMuted?: boolean;
  isVideoEnabled?: boolean;
  isScreenSharing?: boolean;
  audioLevel?: number;
}

// Конференц-звонок
export interface ConferenceCall extends Call {
  roomId: string;
  roomName?: string;
  roomPassword?: string;
  inviteLink: string;
  maxParticipants: number;
  waitingRoom: boolean;
  requireApproval: boolean;
  allowRecording: boolean;
  allowScreenShare: boolean;
  hostControls: ConferenceHostControls;
}

// Управление хостом конференции
export interface ConferenceHostControls {
  canMuteAll: boolean;
  canMuteParticipants: boolean;
  canRemoveParticipants: boolean;
  canEndCallForAll: boolean;
  canControlRecording: boolean;
  canControlScreenShare: boolean;
  canAssignModerator: boolean;
}

// Приглашение на конференцию
export interface ConferenceInvite {
  callId: string;
  roomId: string;
  inviteLink: string;
  invitedBy: string;
  inviter?: PublicUser;
  invitedUsers: string[];
  invitedEmails?: string[];
  message?: string;
  scheduledFor?: Date;
  duration?: number; // минуты
  createdAt: Date;
}

// Запланированный звонок
export interface ScheduledCall extends BaseEntity {
  organizerId: string;
  organizer?: PublicUser;
  title: string;
  description?: string;
  type: CallType;
  scheduledFor: Date;
  duration: number; // минуты
  timezone: string;
  participants: ScheduledCallParticipant[];
  reminderMinutes: number[];
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  roomId?: string;
  inviteLink?: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  actualCallId?: string;
}

// Участник запланированного звонка
export interface ScheduledCallParticipant {
  userId?: string;
  user?: PublicUser;
  email?: string;
  name?: string;
  status: 'invited' | 'accepted' | 'declined' | 'maybe';
  respondedAt?: Date;
  reminderSent: boolean;
}

// Паттерн повторения звонков
export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // каждые N дней/недель/месяцев
  daysOfWeek?: number[]; // 0-6, для еженедельных
  dayOfMonth?: number; // 1-31, для ежемесячных
  endDate?: Date;
  occurrences?: number; // количество повторений
}

// Напоминание о звонке
export interface CallReminder {
  scheduledCallId: string;
  userId: string;
  user?: PublicUser;
  reminderTime: Date;
  minutesBefore: number;
  sent: boolean;
  sentAt?: Date;
}

// История звонков
export interface CallHistory {
  userId: string;
  calls: CallHistoryItem[];
  totalCalls: number;
  totalDuration: number;
  hasMore: boolean;
}

// Элемент истории звонков
export interface CallHistoryItem {
  id: string;
  type: CallType;
  status: CallStatus;
  participants: PublicUser[];
  startedAt: Date;
  duration: number;
  isIncoming: boolean;
  isMissed: boolean;
  quality?: string;
}

// Настройки звонков пользователя
export interface CallSettings {
  userId: string;
  autoAcceptFromFriends: boolean;
  videoQuality: 'low' | 'medium' | 'high';
  audioQuality: 'low' | 'medium' | 'high';
  enableEchoCancellation: boolean;
  enableNoiseSuppression: boolean;
  enableAutoGainControl: boolean;
  defaultMicrophoneId?: string;
  defaultCameraId?: string;
  defaultSpeakerId?: string;
  showPreviewBeforeCall: boolean;
  recordCallsByDefault: boolean;
  muteOnJoin: boolean;
  disableVideoOnJoin: boolean;
}

// Устройства для звонков
export interface CallDevice {
  deviceId: string;
  label: string;
  type: 'microphone' | 'camera' | 'speaker';
  isDefault: boolean;
  isAvailable: boolean;
}

// Статистика звонка в реальном времени
export interface RealTimeCallStats {
  callId: string;
  participantId: string;
  timestamp: Date;
  audioStats: {
    bitrate: number;
    packetsLost: number;
    packetsReceived: number;
    jitter: number;
    roundTripTime: number;
  };
  videoStats?: {
    bitrate: number;
    framerate: number;
    resolution: { width: number; height: number; };
    packetsLost: number;
    packetsReceived: number;
  };
  networkStats: {
    connectionType: string;
    bandwidth: number;
    latency: number;
  };
}

// Запись звонка
export interface CallRecording {
  id: string;
  callId: string;
  call?: Call;
  startedAt: Date;
  endedAt?: Date;
  duration: number;
  fileUrl: string;
  fileSize: number;
  format: string;
  quality: string;
  recordedBy: string;
  recorder?: PublicUser;
  isProcessing: boolean;
  isAvailable: boolean;
  expiresAt?: Date;
}

// Демонстрация экрана
export interface ScreenShare {
  id: string;
  callId: string;
  userId: string;
  user?: PublicUser;
  startedAt: Date;
  endedAt?: Date;
  screenType: 'full_screen' | 'window' | 'tab';
  windowTitle?: string;
  resolution: { width: number; height: number; };
  frameRate: number;
  isActive: boolean;
}

// Виртуальный фон
export interface VirtualBackground {
  id: string;
  userId: string;
  name: string;
  type: 'blur' | 'image' | 'video';
  url?: string;
  thumbnailUrl?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
}

// Экспорт всех типов звонков
export type {
  Call,
  CallParticipant,
  CallEndReason,
  InitiateCallData,
  CallAnswerData,
  UpdateCallSettings,
  ConferenceCall,
  ConferenceHostControls,
  ConferenceInvite,
  ScheduledCall,
  ScheduledCallParticipant,
  RecurringPattern,
  CallReminder,
  CallHistory,
  CallHistoryItem,
  CallSettings,
  CallDevice,
  RealTimeCallStats,
  CallRecording,
  ScreenShare,
  VirtualBackground
};