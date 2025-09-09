import { logger } from './logger';

export interface AudioConfig {
  volume: number; // 0.0 - 1.0
  enableNotifications: boolean;
  enableCallSounds: boolean;
  enableMessageSounds: boolean;
  notificationSound?: string;
  callIncomingSound?: string;
  callOutgoingSound?: string;
  messageSound?: string;
}

export interface NotificationSoundOptions {
  volume?: number;
  loop?: boolean;
  fade?: boolean;
  duration?: number;
}

class AudioManager {
  private config: AudioConfig;
  private audioContext: AudioContext | null = null;
  private audioBuffers = new Map<string, AudioBuffer>();
  private activeAudio = new Map<string, HTMLAudioElement>();
  private isInitialized = false;

  constructor(config: Partial<AudioConfig> = {}) {
    this.config = {
      volume: 0.7,
      enableNotifications: true,
      enableCallSounds: true,
      enableMessageSounds: true,
      notificationSound: '/sounds/notification.mp3',
      callIncomingSound: '/sounds/call-incoming.mp3',
      callOutgoingSound: '/sounds/call-outgoing.mp3',
      messageSound: '/sounds/message.mp3',
      ...config
    };
  }

  // Инициализация аудио системы
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Создаем AudioContext только после пользовательского взаимодействия
      if (typeof window !== 'undefined' && window.AudioContext) {
        this.audioContext = new AudioContext();
        
        // Если контекст заблокирован, ждем пользовательского взаимодействия
        if (this.audioContext.state === 'suspended') {
          document.addEventListener('click', this.resumeAudioContext.bind(this), { once: true });
          document.addEventListener('keydown', this.resumeAudioContext.bind(this), { once: true });
        }
      }

      // Предзагружаем звуки
      await this.preloadSounds();
      
      this.isInitialized = true;
      logger.info('Audio manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize audio manager:', error);
    }
  }

  private async resumeAudioContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        logger.info('Audio context resumed');
      } catch (error) {
        logger.error('Failed to resume audio context:', error);
      }
    }
  }

  // Предзагрузка звуков
  private async preloadSounds(): Promise<void> {
    const soundsToLoad = [
      { key: 'notification', url: this.config.notificationSound },
      { key: 'call-incoming', url: this.config.callIncomingSound },
      { key: 'call-outgoing', url: this.config.callOutgoingSound },
      { key: 'message', url: this.config.messageSound }
    ];

    const loadPromises = soundsToLoad
      .filter(sound => sound.url)
      .map(sound => this.loadAudioBuffer(sound.key, sound.url!));

    try {
      await Promise.allSettled(loadPromises);
      logger.info('Audio preloading completed');
    } catch (error) {
      logger.warn('Some audio files failed to preload:', error);
    }
  }

  // Загрузка аудио буфера
  private async loadAudioBuffer(key: string, url: string): Promise<void> {
    if (!this.audioContext) return;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      this.audioBuffers.set(key, audioBuffer);
      logger.debug(`Audio buffer loaded: ${key}`);
    } catch (error) {
      logger.warn(`Failed to load audio buffer: ${key}`, error);
    }
  }

  // Воспроизведение звука через Web Audio API
  private playAudioBuffer(
    key: string,
    options: NotificationSoundOptions = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.audioContext) {
        reject(new Error('Audio context not available'));
        return;
      }

      const buffer = this.audioBuffers.get(key);
      if (!buffer) {
        reject(new Error(`Audio buffer not found: ${key}`));
        return;
      }

      try {
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Настройка громкости
        const volume = (options.volume ?? this.config.volume) * this.config.volume;
        gainNode.gain.value = volume;

        // Настройка зацикливания
        source.loop = options.loop ?? false;

        // Обработка завершения
        source.onended = () => {
          resolve();
        };

        // Запуск воспроизведения
        source.start(0);

        // Остановка через заданное время
        if (options.duration) {
          setTimeout(() => {
            try {
              source.stop();
            } catch (e) {
              // Источник уже остановлен
            }
          }, options.duration);
        }

      } catch (error) {
        reject(error);
      }
    });
  }

  // Воспроизведение через HTML Audio (fallback)
  private playHTMLAudio(
    url: string,
    options: NotificationSoundOptions = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audio.volume = (options.volume ?? this.config.volume) * this.config.volume;
      audio.loop = options.loop ?? false;

      audio.addEventListener('ended', () => {
        resolve();
      });

      audio.addEventListener('error', (e) => {
        reject(new Error(`Audio playback failed: ${e.type}`));
      });

      audio.play().catch(reject);

      // Остановка через заданное время
      if (options.duration) {
        setTimeout(() => {
          audio.pause();
          audio.currentTime = 0;
        }, options.duration);
      }
    });
  }

  // Основной метод воспроизведения
  async playSound(
    soundKey: string,
    options: NotificationSoundOptions = {}
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Пробуем воспроизвести через Web Audio API
      if (this.audioBuffers.has(soundKey)) {
        await this.playAudioBuffer(soundKey, options);
      } else {
        // Fallback к HTML Audio
        const soundUrl = this.getSoundUrl(soundKey);
        if (soundUrl) {
          await this.playHTMLAudio(soundUrl, options);
        }
      }
    } catch (error) {
      logger.error(`Failed to play sound: ${soundKey}`, error);
    }
  }

  private getSoundUrl(soundKey: string): string | undefined {
    const soundMap: Record<string, string | undefined> = {
      'notification': this.config.notificationSound,
      'call-incoming': this.config.callIncomingSound,
      'call-outgoing': this.config.callOutgoingSound,
      'message': this.config.messageSound
    };

    return soundMap[soundKey];
  }

  // Специфические методы для разных типов звуков
  async playNotificationSound(options?: NotificationSoundOptions): Promise<void> {
    if (!this.config.enableNotifications) return;
    await this.playSound('notification', options);
  }

  async playMessageSound(options?: NotificationSoundOptions): Promise<void> {
    if (!this.config.enableMessageSounds) return;
    await this.playSound('message', options);
  }

  async playIncomingCallSound(options?: NotificationSoundOptions): Promise<void> {
    if (!this.config.enableCallSounds) return;
    
    // Входящий звонок обычно зациклен
    const callOptions = {
      loop: true,
      ...options
    };
    
    await this.playSound('call-incoming', callOptions);
  }

  async playOutgoingCallSound(options?: NotificationSoundOptions): Promise<void> {
    if (!this.config.enableCallSounds) return;
    
    // Исходящий звонок обычно зациклен
    const callOptions = {
      loop: true,
      ...options
    };
    
    await this.playSound('call-outgoing', callOptions);
  }

  // Остановка всех активных звуков
  stopAllSounds(): void {
    // Останавливаем HTML Audio элементы
    this.activeAudio.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    this.activeAudio.clear();

    // Останавливаем Web Audio источники (они останавливаются автоматически)
    logger.debug('All sounds stopped');
  }

  // Остановка конкретного звука
  stopSound(soundKey: string): void {
    const audio = this.activeAudio.get(soundKey);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      this.activeAudio.delete(soundKey);
    }
  }

  // Управление настройками
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
    logger.debug(`Volume set to: ${this.config.volume}`);
  }

  getVolume(): number {
    return this.config.volume;
  }

  enableNotifications(): void {
    this.config.enableNotifications = true;
  }

  disableNotifications(): void {
    this.config.enableNotifications = false;
  }

  enableCallSounds(): void {
    this.config.enableCallSounds = true;
  }

  disableCallSounds(): void {
    this.config.enableCallSounds = false;
  }

  enableMessageSounds(): void {
    this.config.enableMessageSounds = true;
  }

  disableMessageSounds(): void {
    this.config.enableMessageSounds = false;
  }

  // Получение конфигурации
  getConfig(): AudioConfig {
    return { ...this.config };
  }

  // Обновление конфигурации
  updateConfig(newConfig: Partial<AudioConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Audio config updated', newConfig);
  }

  // Проверка поддержки аудио
  static isAudioSupported(): boolean {
    return typeof Audio !== 'undefined' || typeof AudioContext !== 'undefined';
  }

  // Проверка поддержки Web Audio API
  static isWebAudioSupported(): boolean {
    return typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined';
  }

  // Получение доступных аудио форматов
  static getSupportedFormats(): string[] {
    const audio = new Audio();
    const formats = ['mp3', 'wav', 'ogg', 'webm', 'm4a'];
    
    return formats.filter(format => {
      const canPlay = audio.canPlayType(`audio/${format}`);
      return canPlay === 'probably' || canPlay === 'maybe';
    });
  }

  // Тест воспроизведения
  async testPlayback(): Promise<boolean> {
    try {
      await this.playNotificationSound({ volume: 0.1, duration: 100 });
      return true;
    } catch (error) {
      logger.error('Audio test failed:', error);
      return false;
    }
  }

  // Очистка ресурсов
  dispose(): void {
    this.stopAllSounds();
    
    if (this.audioContext) {
      this.audioContext.close().catch(error => {
        logger.error('Failed to close audio context:', error);
      });
      this.audioContext = null;
    }

    this.audioBuffers.clear();
    this.activeAudio.clear();
    this.isInitialized = false;
    
    logger.info('Audio manager disposed');
  }
}

// Глобальный экземпляр аудио менеджера
export const audioManager = new AudioManager();

// Вспомогательные функции для быстрого доступа
export const playNotification = (options?: NotificationSoundOptions) => 
  audioManager.playNotificationSound(options);

export const playMessage = (options?: NotificationSoundOptions) => 
  audioManager.playMessageSound(options);

export const playIncomingCall = (options?: NotificationSoundOptions) => 
  audioManager.playIncomingCallSound(options);

export const playOutgoingCall = (options?: NotificationSoundOptions) => 
  audioManager.playOutgoingCallSound(options);

export const stopAllSounds = () => audioManager.stopAllSounds();

export const setVolume = (volume: number) => audioManager.setVolume(volume);

export const getVolume = () => audioManager.getVolume();

// Инициализация при первом импорте
if (typeof window !== 'undefined') {
  // Инициализируем после первого пользовательского взаимодействия
  const initializeOnInteraction = () => {
    audioManager.initialize().then(() => {
      document.removeEventListener('click', initializeOnInteraction);
      document.removeEventListener('keydown', initializeOnInteraction);
    });
  };

  document.addEventListener('click', initializeOnInteraction, { once: true });
  document.addEventListener('keydown', initializeOnInteraction, { once: true });
}

export default audioManager;