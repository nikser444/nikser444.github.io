// Экспорт всех компонентов для звонков
export { default as CallWindow } from './CallWindow';
export { default as VideoCall } from './VideoCall';
export { default as AudioCall } from './AudioCall';
export { default as ScreenShare } from './ScreenShare';
export { default as Conference } from './Conference';
export { default as CallControls } from './CallControls';

// Типы для компонентов звонков
export interface CallParticipant {
  id: string;
  name: string;
  avatar?: string;
  isMuted?: boolean;
  isVideoEnabled?: boolean;
  isScreenSharing?: boolean;
  stream?: MediaStream;
  isSpeaking?: boolean;
  isPinned?: boolean;
  status?: 'online' | 'offline' | 'away' | 'busy';
}

export interface CallWindowProps {
  callId: string;
  onClose?: () => void;
}

export interface VideoCallProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
}

export interface AudioCallProps {
  participant: CallParticipant;
  isConnected: boolean;
  duration: number;
}

export interface ScreenShareProps {
  stream: MediaStream | null;
  isLocalShare?: boolean;
}

export interface ConferenceProps {
  participants: CallParticipant[];
}

export interface CallControlsProps {
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  callType: 'audio' | 'video';
  isConnected: boolean;
}

export type CallLayout = 'grid' | 'speaker' | 'presentation';

export type AudioOutput = 'speaker' | 'headphones';

export type CallStatus = 'connecting' | 'ringing' | 'connected' | 'ended' | 'failed';

export type VideoQuality = 'SD' | 'HD' | 'Full HD' | '4K';

// Константы для звонков
export const CALL_CONSTANTS = {
  MAX_PARTICIPANTS: 50,
  MAX_GRID_SIZE: 16,
  DEFAULT_AUDIO_BITRATE: 64000,
  DEFAULT_VIDEO_BITRATE: 1000000,
  SCREEN_SHARE_BITRATE: 2000000,
  CONNECTION_TIMEOUT: 30000,
  RECONNECTION_ATTEMPTS: 3,
  PING_INTERVAL: 5000
} as const;

// Утилитарные функции для звонков
export const formatCallDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const getGridDimensions = (participantCount: number): { cols: number; rows: number } => {
  if (participantCount <= 1) return { cols: 1, rows: 1 };
  if (participantCount <= 4) return { cols: 2, rows: 2 };
  if (participantCount <= 6) return { cols: 3, rows: 2 };
  if (participantCount <= 9) return { cols: 3, rows: 3 };
  if (participantCount <= 12) return { cols: 4, rows: 3 };
  return { cols: 4, rows: Math.ceil(participantCount / 4) };
};

export const detectVideoQuality = (stream: MediaStream): VideoQuality => {
  const videoTrack = stream.getVideoTracks()[0];
  if (!videoTrack) return 'SD';

  const settings = videoTrack.getSettings();
  const height = settings.height || 0;

  if (height >= 2160) return '4K';
  if (height >= 1080) return 'Full HD';
  if (height >= 720) return 'HD';
  return 'SD';
};

export const generateCallId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};