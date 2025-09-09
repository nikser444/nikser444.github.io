export interface ICall {
  id: string;
  initiatorId: string;
  receiverId?: string; // for direct calls
  chatId?: string; // for group calls
  type: CallType;
  status: CallStatus;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number; // in seconds
  quality: CallQuality;
  participants: ICallParticipant[];
  settings: ICallSettings;
  recording?: ICallRecording;
  createdAt: Date;
  updatedAt: Date;
}

export enum CallType {
  AUDIO = 'audio',
  VIDEO = 'video',
  SCREEN_SHARE = 'screen_share',
  CONFERENCE = 'conference'
}

export enum CallStatus {
  INITIATING = 'initiating',
  RINGING = 'ringing',
  CONNECTING = 'connecting',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  ENDED = 'ended',
  MISSED = 'missed',
  DECLINED = 'declined',
  FAILED = 'failed',
  BUSY = 'busy'
}

export enum CallQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor'
}

export interface ICallParticipant {
  id: string;
  callId: string;
  userId: string;
  username: string;
  avatar?: string;
  role: CallParticipantRole;
  status: CallParticipantStatus;
  joinedAt?: Date;
  leftAt?: Date;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  audioLevel: number; // 0-100
  connectionQuality: CallQuality;
  deviceInfo: IParticipantDevice;
}

export enum CallParticipantRole {
  HOST = 'host',
  MODERATOR = 'moderator',
  PARTICIPANT = 'participant'
}

export enum CallParticipantStatus {
  INVITED = 'invited',
  JOINING = 'joining',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  DISCONNECTED = 'disconnected',
  LEFT = 'left'
}

export interface IParticipantDevice {
  hasCamera: boolean;
  hasMicrophone: boolean;
  hasScreenShare: boolean;
  browser?: string;
  os?: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
}

export interface ICallSettings {
  isRecordingEnabled: boolean;
  isWaitingRoomEnabled: boolean;
  maxParticipants?: number;
  requirePermissionToJoin: boolean;
  allowScreenShare: boolean;
  allowChat: boolean;
  muteOnJoin: boolean;
  videoOnJoin: boolean;
  endCallForAll: boolean;
}

export interface ICallRecording {
  id: string;
  callId: string;
  filename: string;
  url: string;
  size: number;
  duration: number;
  startedAt: Date;
  endedAt: Date;
  startedBy: string;
  status: CallRecordingStatus;
}

export enum CallRecordingStatus {
  RECORDING = 'recording',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface ICallInvite {
  id: string;
  callId: string;
  inviterId: string;
  inviteeId: string;
  status: CallInviteStatus;
  sentAt: Date;
  respondedAt?: Date;
  expiresAt: Date;
}

export enum CallInviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired'
}

export interface ICallInitiateInput {
  type: CallType;
  receiverId?: string;
  chatId?: string;
  settings?: Partial<ICallSettings>;
}

export interface ICallJoinInput {
  callId: string;
  deviceInfo: IParticipantDevice;
}

export interface ICallUpdateInput {
  status?: CallStatus;
  settings?: Partial<ICallSettings>;
}

export interface ICallParticipantUpdateInput {
  isMuted?: boolean;
  isVideoEnabled?: boolean;
  isScreenSharing?: boolean;
  isHandRaised?: boolean;
}

export interface ICallStats {
  totalCalls: number;
  totalDuration: number;
  averageDuration: number;
  callsByType: Record<CallType, number>;
  callsByStatus: Record<CallStatus, number>;
  callsByQuality: Record<CallQuality, number>;
}

export interface ICallHistory {
  calls: ICallHistoryItem[];
  total: number;
  hasMore: boolean;
}

export interface ICallHistoryItem {
  id: string;
  type: CallType;
  status: CallStatus;
  initiatorId: string;
  initiatorUsername: string;
  initiatorAvatar?: string;
  participants: ICallParticipantSummary[];
  startedAt?: Date;
  duration?: number;
  quality: CallQuality;
  createdAt: Date;
}

export interface ICallParticipantSummary {
  userId: string;
  username: string;
  avatar?: string;
  joinedAt?: Date;
  leftAt?: Date;
}

export interface ICallNotification {
  id: string;
  callId: string;
  type: CallNotificationType;
  userId: string;
  fromUserId: string;
  fromUsername: string;
  fromAvatar?: string;
  callType: CallType;
  isRead: boolean;
  createdAt: Date;
}

export enum CallNotificationType {
  INCOMING_CALL = 'incoming_call',
  MISSED_CALL = 'missed_call',
  CALL_ENDED = 'call_ended',
  CALL_DECLINED = 'call_declined',
  PARTICIPANT_JOINED = 'participant_joined',
  PARTICIPANT_LEFT = 'participant_left'
}

export interface IScreenShareSession {
  id: string;
  callId: string;
  participantId: string;
  startedAt: Date;
  endedAt?: Date;
  isActive: boolean;
  shareType: ScreenShareType;
  resolution: IScreenResolution;
  quality: CallQuality;
}

export enum ScreenShareType {
  ENTIRE_SCREEN = 'entire_screen',
  APPLICATION = 'application',
  BROWSER_TAB = 'browser_tab'
}

export interface IScreenResolution {
  width: number;
  height: number;
  frameRate: number;
}

export interface ICallMessage {
  id: string;
  callId: string;
  senderId: string;
  senderUsername: string;
  content: string;
  type: CallMessageType;
  timestamp: Date;
}

export enum CallMessageType {
  TEXT = 'text',
  EMOJI = 'emoji',
  SYSTEM = 'system'
}

export interface IWaitingRoom {
  id: string;
  callId: string;
  participants: IWaitingRoomParticipant[];
  isEnabled: boolean;
}

export interface IWaitingRoomParticipant {
  userId: string;
  username: string;
  avatar?: string;
  joinedAt: Date;
  deviceInfo: IParticipantDevice;
  status: 'waiting' | 'admitted' | 'denied';
}

export interface ICallPermissions {
  canMuteOthers: boolean;
  canRemoveParticipants: boolean;
  canManageWaitingRoom: boolean;
  canStartRecording: boolean;
  canChangeSettings: boolean;
  canEndCallForAll: boolean;
}

export interface ICallFeedback {
  id: string;
  callId: string;
  userId: string;
  rating: number; // 1-5 stars
  issues: CallIssue[];
  comment?: string;
  submittedAt: Date;
}

export enum CallIssue {
  POOR_AUDIO_QUALITY = 'poor_audio_quality',
  POOR_VIDEO_QUALITY = 'poor_video_quality',
  CONNECTION_ISSUES = 'connection_issues',
  ECHO_NOISE = 'echo_noise',
  DELAY_LAG = 'delay_lag',
  DROPPED_CALL = 'dropped_call',
  OTHER = 'other'
}

export interface ICallAnalytics {
  callId: string;
  totalParticipants: number;
  maxConcurrentParticipants: number;
  averageParticipants: number;
  totalDuration: number;
  networkStats: INetworkStats;
  audioStats: IAudioStats;
  videoStats: IVideoStats;
  participantStats: IParticipantAnalytics[];
}

export interface INetworkStats {
  averageLatency: number;
  packetLoss: number;
  bandwidth: {
    upload: number;
    download: number;
  };
  reconnections: number;
}

export interface IAudioStats {
  averageBitrate: number;
  audioLevel: number;
  mutedDuration: number;
  qualityScore: number;
}

export interface IVideoStats {
  averageBitrate: number;
  resolution: IScreenResolution;
  frameRate: number;
  videoDuration: number;
  qualityScore: number;
}

export interface IParticipantAnalytics {
  userId: string;
  joinDuration: number;
  speakingTime: number;
  mutedTime: number;
  videoTime: number;
  screenShareTime: number;
  connectionIssues: number;
  averageQuality: CallQuality;
}

// Default call settings
export const DEFAULT_CALL_SETTINGS: ICallSettings = {
  isRecordingEnabled: false,
  isWaitingRoomEnabled: false,
  requirePermissionToJoin: false,
  allowScreenShare: true,
  allowChat: true,
  muteOnJoin: false,
  videoOnJoin: true,
  endCallForAll: false,
};

// Call permissions by role
export const CALL_PERMISSIONS: Record<CallParticipantRole, ICallPermissions> = {
  [CallParticipantRole.HOST]: {
    canMuteOthers: true,
    canRemoveParticipants: true,
    canManageWaitingRoom: true,
    canStartRecording: true,
    canChangeSettings: true,
    canEndCallForAll: true,
  },
  [CallParticipantRole.MODERATOR]: {
    canMuteOthers: true,
    canRemoveParticipants: true,
    canManageWaitingRoom: true,
    canStartRecording: false,
    canChangeSettings: false,
    canEndCallForAll: false,
  },
  [CallParticipantRole.PARTICIPANT]: {
    canMuteOthers: false,
    canRemoveParticipants: false,
    canManageWaitingRoom: false,
    canStartRecording: false,
    canChangeSettings: false,
    canEndCallForAll: false,
  },
};

// Call status labels
export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  [CallStatus.INITIATING]: 'Инициирование...',
  [CallStatus.RINGING]: 'Звонок...',
  [CallStatus.CONNECTING]: 'Подключение...',
  [CallStatus.ACTIVE]: 'Активный',
  [CallStatus.ON_HOLD]: 'На удержании',
  [CallStatus.ENDED]: 'Завершён',
  [CallStatus.MISSED]: 'Пропущенный',
  [CallStatus.DECLINED]: 'Отклонён',
  [CallStatus.FAILED]: 'Не удался',
  [CallStatus.BUSY]: 'Занято',
};

// Call type labels
export const CALL_TYPE_LABELS: Record<CallType, string> = {
  [CallType.AUDIO]: 'Аудиозвонок',
  [CallType.VIDEO]: 'Видеозвонок',
  [CallType.SCREEN_SHARE]: 'Демонстрация экрана',
  [CallType.CONFERENCE]: 'Конференция',
};

// Call validation rules
export const CALL_VALIDATION = {
  MAX_PARTICIPANTS: 50,
  MAX_CALL_DURATION: 24 * 60 * 60, // 24 hours in seconds
  MIN_CALL_DURATION: 1, // 1 second
  RING_TIMEOUT: 60, // seconds
  CONNECTION_TIMEOUT: 30, // seconds
  MAX_RECORDING_SIZE: 5 * 1024 * 1024 * 1024, // 5GB
};

// WebRTC configuration
export const WEBRTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

export interface ICallEvent {
  type: CallEventType;
  callId: string;
  participantId?: string;
  data?: any;
  timestamp: Date;
}

export enum CallEventType {
  CALL_INITIATED = 'call_initiated',
  CALL_ANSWERED = 'call_answered',
  CALL_DECLINED = 'call_declined',
  CALL_ENDED = 'call_ended',
  PARTICIPANT_JOINED = 'participant_joined',
  PARTICIPANT_LEFT = 'participant_left',
  PARTICIPANT_MUTED = 'participant_muted',
  PARTICIPANT_UNMUTED = 'participant_unmuted',
  VIDEO_ENABLED = 'video_enabled',
  VIDEO_DISABLED = 'video_disabled',
  SCREEN_SHARE_STARTED = 'screen_share_started',
  SCREEN_SHARE_STOPPED = 'screen_share_stopped',
  RECORDING_STARTED = 'recording_started',
  RECORDING_STOPPED = 'recording_stopped',
  HAND_RAISED = 'hand_raised',
  HAND_LOWERED = 'hand_lowered',
  QUALITY_CHANGED = 'quality_changed',
}