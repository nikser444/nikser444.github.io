// frontend/src/types/call.ts
import { BaseEntity } from './base';
import { PublicUser } from './user';

export type CallType = 'audio' | 'video' | 'screen';
export type CallStatus = 
  | 'initiating'
  | 'ringing'
  | 'connecting'
  | 'connected'
  | 'ended'
  | 'declined'
  | 'missed'
  | 'failed'
  | 'busy';

export interface Call extends BaseEntity {
  type: CallType;
  status: CallStatus;
  initiatorId: string;
  initiator: PublicUser;
  participantIds: string[];
  participants: CallParticipant[];
  chatId?: string;
  startedAt?: string;
  endedAt?: string;
  duration?: number; // in seconds
  endReason?: CallEndReason;
  isGroup: boolean;
  maxParticipants?: number;
  settings: CallSettings;
}

export interface CallParticipant {
  userId: string;
  user: PublicUser;
  joinedAt?: string;
  leftAt?: string;
  status: ParticipantStatus;
  mediaState: MediaState;
  connectionQuality: ConnectionQuality;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  volume: number;
}

export type ParticipantStatus = 
  | 'invited'
  | 'ringing'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'declined';

export interface MediaState {
  audio: {
    enabled: boolean;
    muted: boolean;
    device?: MediaDeviceInfo;
  };
  video: {
    enabled: boolean;
    device?: MediaDeviceInfo;
    resolution?: VideoResolution;
  };
  screen: {
    sharing: boolean;
    hasAudio: boolean;
  };
}

export interface VideoResolution {
  width: number;
  height: number;
  frameRate: number;
}

export type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'disconnected';

export type CallEndReason = 
  | 'user_ended'
  | 'participant_left'
  | 'connection_lost'
  | 'timeout'
  | 'declined'
  | 'busy'
  | 'error';

export interface CallSettings {
  audioOnly: boolean;
  recordingEnabled: boolean;
  waitingRoomEnabled: boolean;
  participantLimit: number;
  allowScreenShare: boolean;
  allowChat: boolean;
  autoMuteParticipants: boolean;
}

export interface InitiateCallData {
  type: CallType;
  participantIds: string[];
  chatId?: string;
  settings?: Partial<CallSettings>;
}

export interface CallInvitation {
  id: string;
  callId: string;
  call: Call;
  invitedBy: PublicUser;
  invitedAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export interface JoinCallData {
  callId: string;
  mediaState?: Partial<MediaState>;
}

export interface CallHistory extends BaseEntity {
  callId: string;
  type: CallType;
  status: CallStatus;
  participants: PublicUser[];
  duration: number;
  startedAt: string;
  endedAt: string;
  initiatedByMe: boolean;
}

export interface Conference extends Call {
  isGroup: true;
  name: string;
  description?: string;
  moderators: string[];
  settings: ConferenceSettings;
  lobby: ConferenceLobby;
}

export interface ConferenceSettings extends CallSettings {
  isPublic: boolean;
  requirePassword: boolean;
  password?: string;
  startTime?: string;
  endTime?: string;
  timeZone: string;
}

export interface ConferenceLobby {
  enabled: boolean;
  participants: CallParticipant[];
  admissionQueue: string[];
}

export interface ScreenShareSession {
  id: string;
  userId: string;
  user: PublicUser;
  startedAt: string;
  hasAudio: boolean;
  resolution: VideoResolution;
  isActive: boolean;
}

export interface CallStats {
  duration: number;
  participantsCount: number;
  qualityStats: {
    averageQuality: ConnectionQuality;
    dropouts: number;
    latency: number;
    bandwidth: {
      upload: number;
      download: number;
    };
  };
  mediaStats: {
    audioPacketsLost: number;
    videoPacketsLost: number;
    jitter: number;
  };
}

export interface CallNotification {
  callId: string;
  type: CallType;
  caller: PublicUser;
  participants: PublicUser[];
  timestamp: string;
  isIncoming: boolean;
  autoDeclineAt?: string;
}

export interface CallDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
  isDefault: boolean;
  isAvailable: boolean;
}