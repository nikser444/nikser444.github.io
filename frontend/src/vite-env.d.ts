/// <reference types="vite/client" />

/**
 * Типы для переменных окружения Vite
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_TURN_SERVER_URL: string;
  readonly VITE_TURN_SERVER_USERNAME: string;
  readonly VITE_TURN_SERVER_CREDENTIAL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_ENVIRONMENT: 'development' | 'production' | 'test';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Расширение глобальных типов для WebRTC
 */
declare global {
  interface Window {
    webkitRTCPeerConnection: typeof RTCPeerConnection;
    mozRTCPeerConnection: typeof RTCPeerConnection;
  }
}

/**
 * Типы для медиа устройств
 */
declare global {
  interface MediaDevices {
    getDisplayMedia(constraints?: MediaStreamConstraints): Promise<MediaStream>;
  }
}

export {};