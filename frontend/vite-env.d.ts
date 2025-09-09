/// <reference types="vite/client" />

interface ImportMetaEnv {
  // API Configuration
  readonly VITE_API_URL: string;
  readonly VITE_API_VERSION: string;
  
  // WebSocket Configuration
  readonly VITE_SOCKET_URL: string;
  readonly VITE_SOCKET_PATH: string;
  
  // WebRTC Configuration
  readonly VITE_STUN_SERVER: string;
  readonly VITE_TURN_SERVER: string;
  readonly VITE_TURN_USERNAME: string;
  readonly VITE_TURN_PASSWORD: string;
  
  // App Configuration
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_APP_DESCRIPTION: string;
  
  // Environment
  readonly VITE_NODE_ENV: string;
  readonly VITE_DEBUG_MODE: string;
  
  // Upload Configuration
  readonly VITE_MAX_FILE_SIZE: string;
  readonly VITE_ALLOWED_FILE_TYPES: string;
  
  // Chat Configuration
  readonly VITE_MAX_MESSAGE_LENGTH: string;
  readonly VITE_TYPING_TIMEOUT: string;
  readonly VITE_MESSAGE_PAGINATION_LIMIT: string;
  
  // Call Configuration
  readonly VITE_MAX_CALL_DURATION: string;
  readonly VITE_CALL_TIMEOUT: string;
  readonly VITE_RECONNECTION_ATTEMPTS: string;
  
  // Notification Configuration
  readonly VITE_NOTIFICATION_TIMEOUT: string;
  readonly VITE_ENABLE_BROWSER_NOTIFICATIONS: string;
  readonly VITE_ENABLE_SOUND_NOTIFICATIONS: string;
  
  // Theme Configuration
  readonly VITE_DEFAULT_THEME: string;
  readonly VITE_ENABLE_DARK_MODE: string;
  readonly VITE_ENABLE_SYSTEM_THEME: string;
  
  // Security Configuration
  readonly VITE_ENABLE_CSRF_PROTECTION: string;
  readonly VITE_SESSION_TIMEOUT: string;
  
  // Analytics (Optional)
  readonly VITE_ANALYTICS_ID: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  
  // Error Tracking (Optional)
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_ENABLE_ERROR_TRACKING: string;
  
  // Performance Monitoring
  readonly VITE_ENABLE_PERFORMANCE_MONITORING: string;
  readonly VITE_PERFORMANCE_SAMPLE_RATE: string;
  
  // Feature Flags
  readonly VITE_ENABLE_SCREEN_SHARING: string;
  readonly VITE_ENABLE_GROUP_CALLS: string;
  readonly VITE_ENABLE_FILE_SHARING: string;
  readonly VITE_ENABLE_EMOJI_REACTIONS: string;
  readonly VITE_ENABLE_MESSAGE_THREADING: string;
  readonly VITE_ENABLE_MESSAGE_EDITING: string;
  readonly VITE_ENABLE_MESSAGE_DELETION: string;
  readonly VITE_ENABLE_READ_RECEIPTS: string;
  readonly VITE_ENABLE_TYPING_INDICATORS: string;
  
  // Development Configuration
  readonly VITE_DEV_TOOLS: string;
  readonly VITE_HOT_RELOAD: string;
  readonly VITE_SOURCE_MAPS: string;
  
  // PWA Configuration (Optional)
  readonly VITE_ENABLE_PWA: string;
  readonly VITE_PWA_NAME: string;
  readonly VITE_PWA_SHORT_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Global type declarations for messenger app
declare global {
  interface Window {
    // WebRTC globals
    RTCPeerConnection: typeof RTCPeerConnection;
    webkitRTCPeerConnection: typeof RTCPeerConnection;
    mozRTCPeerConnection: typeof RTCPeerConnection;
    
    // Media APIs
    navigator: Navigator & {
      mediaDevices: MediaDevices;
      getUserMedia: (
        constraints: MediaStreamConstraints,
        successCallback: (stream: MediaStream) => void,
        errorCallback: (error: any) => void
      ) => void;
      webkitGetUserMedia: typeof navigator.getUserMedia;
      mozGetUserMedia: typeof navigator.getUserMedia;
    };
    
    // Audio context
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
    
    // Screen capture
    screen: Screen & {
      orientation?: ScreenOrientation;
    };
    
    // Push notifications
    Notification: typeof Notification;
    PushManager: typeof PushManager;
    ServiceWorkerRegistration: typeof ServiceWorkerRegistration;
    
    // Environment flags
    __DEV__: boolean;
    __PROD__: boolean;
  }
  
  // Module declarations
  declare module '*.svg' {
    import type React from 'react';
    export const ReactComponent: React.FunctionComponent<
      React.SVGProps<SVGSVGElement> & { title?: string }
    >;
    const src: string;
    export default src;
  }
  
  declare module '*.png' {
    const src: string;
    export default src;
  }
  
  declare module '*.jpg' {
    const src: string;
    export default src;
  }
  
  declare module '*.jpeg' {
    const src: string;
    export default src;
  }
  
  declare module '*.gif' {
    const src: string;
    export default src;
  }
  
  declare module '*.webp' {
    const src: string;
    export default src;
  }
  
  declare module '*.ico' {
    const src: string;
    export default src;
  }
  
  declare module '*.css' {
    const classes: { [key: string]: string };
    export default classes;
  }
  
  declare module '*.scss' {
    const classes: { [key: string]: string };
    export default classes;
  }
  
  declare module '*.sass' {
    const classes: { [key: string]: string };
    export default classes;
  }
  
  declare module '*.module.css' {
    const classes: { [key: string]: string };
    export default classes;
  }
  
  declare module '*.module.scss' {
    const classes: { [key: string]: string };
    export default classes;
  }
  
  declare module '*.wav' {
    const src: string;
    export default src;
  }
  
  declare module '*.mp3' {
    const src: string;
    export default src;
  }
  
  declare module '*.ogg' {
    const src: string;
    export default src;
  }
}

// WebRTC type extensions
interface RTCPeerConnection {
  createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit>;
  createAnswer(options?: RTCAnswerOptions): Promise<RTCSessionDescriptionInit>;
  setLocalDescription(description?: RTCSessionDescriptionInit): Promise<void>;
  setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void>;
  addIceCandidate(candidate?: RTCIceCandidateInit): Promise<void>;
  close(): void;
}

// Media Stream API extensions
interface MediaDevices {
  getDisplayMedia(constraints?: DisplayMediaStreamConstraints): Promise<MediaStream>;
}

export {};