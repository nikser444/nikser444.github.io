// Конфигурация WebRTC для звонков и видеоконференций

// Интерфейс для ICE сервера
export interface ICEServer {
  urls: string | string[];
  username?: string;
  credential?: string;
  credentialType?: 'password' | 'oauth';
}

// Интерфейс для конфигурации WebRTC
export interface WebRTCConfig {
  iceServers: ICEServer[];
  iceCandidatePoolSize?: number;
  iceTransportPolicy?: 'all' | 'relay';
  bundlePolicy?: 'balanced' | 'max-compat' | 'max-bundle';
  rtcpMuxPolicy?: 'negotiate' | 'require';
}

// Основная конфигурация WebRTC
export const webRTCConfig: WebRTCConfig = {
  iceServers: [
    // Публичные STUN серверы Google
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun3.l.google.com:19302',
        'stun:stun4.l.google.com:19302',
      ],
    },
    
    // STUN сервер OpenRelay
    {
      urls: 'stun:openrelay.metered.ca:80',
    },
    
    // TURN сервер (для production обязательно настроить свой)
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp',
      ],
      username: process.env.TURN_USERNAME || 'openrelayproject',
      credential: process.env.TURN_CREDENTIAL || 'openrelayproject',
    },
    
    // Дополнительный TURN сервер (если есть)
    ...(process.env.CUSTOM_TURN_URL ? [{
      urls: process.env.CUSTOM_TURN_URL,
      username: process.env.CUSTOM_TURN_USERNAME,
      credential: process.env.CUSTOM_TURN_CREDENTIAL,
    }] : []),
  ],
  
  // Размер пула ICE кандидатов
  iceCandidatePoolSize: 10,
  
  // Политика транспорта ICE
  iceTransportPolicy: 'all',
  
  // Политика группировки
  bundlePolicy: 'max-bundle',
  
  // Политика RTCP мультиплексирования
  rtcpMuxPolicy: 'require',
};

// Ограничения для аудио
export const audioConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
    sampleSize: 16,
    channelCount: 1,
  },
  video: false,
};

// Ограничения для видео
export const videoConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  video: {
    width: { min: 320, ideal: 1280, max: 1920 },
    height: { min: 240, ideal: 720, max: 1080 },
    frameRate: { min: 15, ideal: 30, max: 60 },
    aspectRatio: { ideal: 16/9 },
    facingMode: 'user', // фронтальная камера
  },
};

// Ограничения для демонстрации экрана
export const screenConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  video: {
    width: { max: 1920 },
    height: { max: 1080 },
    frameRate: { max: 30 },
  },
};

// Ограничения для мобильных устройств
export const mobileVideoConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  video: {
    width: { min: 320, ideal: 640, max: 1280 },
    height: { min: 240, ideal: 480, max: 720 },
    frameRate: { min: 15, ideal: 30, max: 30 },
    aspectRatio: { ideal: 16/9 },
    facingMode: 'user',
  },
};

// Настройки качества видео
export const videoQualitySettings = {
  low: {
    width: 320,
    height: 240,
    frameRate: 15,
    bitrate: 150000, // 150 kbps
  },
  medium: {
    width: 640,
    height: 480,
    frameRate: 24,
    bitrate: 500000, // 500 kbps
  },
  high: {
    width: 1280,
    height: 720,
    frameRate: 30,
    bitrate: 1500000, // 1.5 Mbps
  },
  hd: {
    width: 1920,
    height: 1080,
    frameRate: 30,
    bitrate: 3000000, // 3 Mbps
  },
};

// Конфигурация для групповых звонков
export const conferenceConfig = {
  maxParticipants: parseInt(process.env.MAX_CONFERENCE_PARTICIPANTS || '8'),
  enableSimulcast: true,
  enableLayeredEncoding: true,
  preferredCodec: 'VP8', // VP8, VP9, H264
};

// Настройки кодеков
export const codecPreferences = {
  video: [
    { mimeType: 'video/VP8', clockRate: 90000 },
    { mimeType: 'video/VP9', clockRate: 90000 },
    { mimeType: 'video/H264', clockRate: 90000 },
  ],
  audio: [
    { mimeType: 'audio/opus', clockRate: 48000, channels: 2 },
    { mimeType: 'audio/PCMU', clockRate: 8000 },
    { mimeType: 'audio/PCMA', clockRate: 8000 },
  ],
};

// Функция для определения поддержки WebRTC
export const isWebRTCSupported = (): boolean => {
  return !!(
    typeof window !== 'undefined' &&
    window.RTCPeerConnection &&
    window.RTCSessionDescription &&
    window.RTCIceCandidate &&
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
  );
};

// Функция для получения поддерживаемых кодеков
export const getSupportedCodecs = (): { video: string[], audio: string[] } => {
  if (typeof window === 'undefined' || !('RTCRtpReceiver' in window)) {
    return { video: [], audio: [] };
  }
  
  const videoCapabilities = RTCRtpReceiver.getCapabilities?.('video');
  const audioCapabilities = RTCRtpReceiver.getCapabilities?.('audio');
  
  return {
    video: videoCapabilities?.codecs?.map(codec => codec.mimeType) || [],
    audio: audioCapabilities?.codecs?.map(codec => codec.mimeType) || [],
  };
};

// Функция для детекции мобильного устройства
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Функция для получения оптимальных настроек для устройства
export const getOptimalConstraints = () => {
  const isMobile = isMobileDevice();
  return isMobile ? mobileVideoConstraints : videoConstraints;
};

// Настройки таймаутов
export const timeouts = {
  iceGatheringTimeout: 10000, // 10 секунд для сбора ICE кандидатов
  connectionTimeout: 30000, // 30 секунд для установления соединения
  offerTimeout: 5000, // 5 секунд для создания offer
  answerTimeout: 5000, // 5 секунд для создания answer
};

// События WebRTC
export const WEBRTC_EVENTS = {
  ICE_CANDIDATE: 'icecandidate',
  ICE_CONNECTION_STATE_CHANGE: 'iceconnectionstatechange',
  CONNECTION_STATE_CHANGE: 'connectionstatechange',
  SIGNALING_STATE_CHANGE: 'signalingstatechange',
  TRACK: 'track',
  DATA_CHANNEL: 'datachannel',
  NEGOTIATION_NEEDED: 'negotiationneeded',
} as const;