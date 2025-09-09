// frontend/src/services/callService.ts
import { api } from './api';
import { ApiResponse } from '../types/api';
import { Call } from '../types/call';

export interface InitiateCallData {
  participantId: string;
  type: 'audio' | 'video';
  chatId?: string;
}

export interface CreateConferenceData {
  name: string;
  participants: string[];
  type: 'audio' | 'video';
  maxParticipants?: number;
  isRecordingEnabled?: boolean;
  scheduledAt?: Date;
}

export interface JoinCallData {
  callId: string;
  withVideo?: boolean;
  withAudio?: boolean;
}

export interface CallSettings {
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenShareEnabled: boolean;
  microphoneDeviceId?: string;
  cameraDeviceId?: string;
  speakerDeviceId?: string;
  quality: 'low' | 'medium' | 'high';
  noiseReduction: boolean;
  echoCancellation: boolean;
}

export interface CallStats {
  duration: number;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  bitrate: number;
  packetLoss: number;
  latency: number;
}

class CallService {
  private readonly ENDPOINTS = {
    CALLS: '/calls',
    INITIATE: '/calls/initiate',
    ACCEPT: '/calls/accept',
    DECLINE: '/calls/decline',
    END: '/calls/end',
    JOIN: '/calls/join',
    LEAVE: '/calls/leave',
    CONFERENCE: '/calls/conference',
    RECORDING: '/calls/recording',
    SETTINGS: '/calls/settings',
    HISTORY: '/calls/history',
    STATS: '/calls/stats',
    DEVICES: '/calls/devices',
  };

  // === Управление звонками ===

  // Инициация звонка
  async initiateCall(data: InitiateCallData): Promise<Call> {
    try {
      const response = await api.post<Call>(this.ENDPOINTS.INITIATE, data);
      
      if (response.success && response.data) {
        return {
          ...response.data,
          startedAt: response.data.startedAt ? new Date(response.data.startedAt) : undefined,
          endedAt: response.data.endedAt ? new Date(response.data.endedAt) : undefined,
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
        };
      }
      
      throw new Error(response.message || 'Ошибка инициации звонка');
    } catch (error) {
      console.error('Initiate call error:', error);
      throw error;
    }
  }

  // Принятие звонка
  async acceptCall(callId: string, settings?: Partial<CallSettings>): Promise<Call> {
    try {
      const response = await api.post<Call>(`${this.ENDPOINTS.ACCEPT}/${callId}`, settings);
      
      if (response.success && response.data) {
        return {
          ...response.data,
          startedAt: response.data.startedAt ? new Date(response.data.startedAt) : undefined,
          endedAt: response.data.endedAt ? new Date(response.data.endedAt) : undefined,
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
        };
      }
      
      throw new Error(response.message || 'Ошибка принятия звонка');
    } catch (error) {
      console.error('Accept call error:', error);
      throw error;
    }
  }

  // Отклонение звонка
  async declineCall(callId: string, reason?: string): Promise<void> {
    try {
      const response = await api.post(`${this.ENDPOINTS.DECLINE}/${callId}`, { reason });
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка отклонения звонка');
      }
    } catch (error) {
      console.error('Decline call error:', error);
      throw error;
    }
  }

  // Завершение звонка
  async endCall(callId: string): Promise<void> {
    try {
      const response = await api.post(`${this.ENDPOINTS.END}/${callId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка завершения звонка');
      }
    } catch (error) {
      console.error('End call error:', error);
      throw error;
    }
  }

  // Получение информации о звонке
  async getCall(callId: string): Promise<Call> {
    try {
      const response = await api.get<Call>(`${this.ENDPOINTS.CALLS}/${callId}`);
      
      if (response.success && response.data) {
        return {
          ...response.data,
          startedAt: response.data.startedAt ? new Date(response.data.startedAt) : undefined,
          endedAt: response.data.endedAt ? new Date(response.data.endedAt) : undefined,
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
        };
      }
      
      throw new Error(response.message || 'Ошибка получения информации о звонке');
    } catch (error) {
      console.error('Get call error:', error);
      throw error;
    }
  }

  // === Конференции ===

  // Создание конференции
  async createConference(data: CreateConferenceData): Promise<Call> {
    try {
      const response = await api.post<Call>(this.ENDPOINTS.CONFERENCE, {
        ...data,
        scheduledAt: data.scheduledAt?.toISOString(),
      });
      
      if (response.success && response.data) {
        return {
          ...response.data,
          startedAt: response.data.startedAt ? new Date(response.data.startedAt) : undefined,
          endedAt: response.data.endedAt ? new Date(response.data.endedAt) : undefined,
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
        };
      }
      
      throw new Error(response.message || 'Ошибка создания конференции');
    } catch (error) {
      console.error('Create conference error:', error);
      throw error;
    }
  }

  // Присоединение к звонку/конференции
  async joinCall(data: JoinCallData): Promise<Call> {
    try {
      const response = await api.post<Call>(`${this.ENDPOINTS.JOIN}/${data.callId}`, {
        withVideo: data.withVideo,
        withAudio: data.withAudio,
      });
      
      if (response.success && response.data) {
        return {
          ...response.data,
          startedAt: response.data.startedAt ? new Date(response.data.startedAt) : undefined,
          endedAt: response.data.endedAt ? new Date(response.data.endedAt) : undefined,
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
        };
      }
      
      throw new Error(response.message || 'Ошибка присоединения к звонку');
    } catch (error) {
      console.error('Join call error:', error);
      throw error;
    }
  }

  // Покидание звонка/конференции
  async leaveCall(callId: string): Promise<void> {
    try {
      const response = await api.post(`${this.ENDPOINTS.LEAVE}/${callId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка выхода из звонка');
      }
    } catch (error) {
      console.error('Leave call error:', error);
      throw error;
    }
  }

  // === Запись звонков ===

  // Начало записи
  async startRecording(callId: string): Promise<void> {
    try {
      const response = await api.post(`${this.ENDPOINTS.RECORDING}/${callId}/start`);
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка начала записи');
      }
    } catch (error) {
      console.error('Start recording error:', error);
      throw error;
    }
  }

  // Остановка записи
  async stopRecording(callId: string): Promise<{ recordingUrl: string }> {
    try {
      const response = await api.post<{ recordingUrl: string }>(
        `${this.ENDPOINTS.RECORDING}/${callId}/stop`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка остановки записи');
    } catch (error) {
      console.error('Stop recording error:', error);
      throw error;
    }
  }

  // Получение записей звонков
  async getRecordings(callId?: string): Promise<Array<{
    id: string;
    callId: string;
    url: string;
    duration: number;
    size: number;
    createdAt: Date;
  }>> {
    try {
      const url = callId ? `${this.ENDPOINTS.RECORDING}/${callId}` : this.ENDPOINTS.RECORDING;
      const response = await api.get<Array<{
        id: string;
        callId: string;
        url: string;
        duration: number;
        size: number;
        createdAt: string;
      }>>(url);
      
      if (response.success && response.data) {
        return response.data.map(recording => ({
          ...recording,
          createdAt: new Date(recording.createdAt),
        }));
      }
      
      throw new Error(response.message || 'Ошибка получения записей');
    } catch (error) {
      console.error('Get recordings error:', error);
      throw error;
    }
  }

  // === Настройки звонков ===

  // Получение настроек звонков
  async getCallSettings(): Promise<CallSettings> {
    try {
      const response = await api.get<CallSettings>(this.ENDPOINTS.SETTINGS);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка получения настроек звонков');
    } catch (error) {
      console.error('Get call settings error:', error);
      throw error;
    }
  }

  // Обновление настроек звонков
  async updateCallSettings(settings: Partial<CallSettings>): Promise<CallSettings> {
    try {
      const response = await api.put<CallSettings>(this.ENDPOINTS.SETTINGS, settings);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка обновления настроек звонков');
    } catch (error) {
      console.error('Update call settings error:', error);
      throw error;
    }
  }

  // === Устройства ===

  // Получение доступных устройств
  async getAvailableDevices(): Promise<{
    microphones: MediaDeviceInfo[];
    cameras: MediaDeviceInfo[];
    speakers: MediaDeviceInfo[];
  }> {
    try {
      const response = await api.get<{
        microphones: MediaDeviceInfo[];
        cameras: MediaDeviceInfo[];
        speakers: MediaDeviceInfo[];
      }>(this.ENDPOINTS.DEVICES);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка получения устройств');
    } catch (error) {
      console.error('Get available devices error:', error);
      throw error;
    }
  }

  // Тест устройств
  async testDevice(deviceId: string, type: 'microphone' | 'camera' | 'speaker'): Promise<{
    success: boolean;
    quality: 'poor' | 'fair' | 'good' | 'excellent';
  }> {
    try {
      const response = await api.post<{
        success: boolean;
        quality: 'poor' | 'fair' | 'good' | 'excellent';
      }>(`${this.ENDPOINTS.DEVICES}/test`, { deviceId, type });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка тестирования устройства');
    } catch (error) {
      console.error('Test device error:', error);
      throw error;
    }
  }

  // === История звонков ===

  // Получение истории звонков
  async getCallHistory(params: {
    page?: number;
    limit?: number;
    type?: 'audio' | 'video' | 'conference';
    status?: 'completed' | 'missed' | 'declined';
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<Call[]> {
    try {
      const url = api.createUrlWithParams(this.ENDPOINTS.HISTORY, {
        page: params.page,
        limit: params.limit,
        type: params.type,
        status: params.status,
        startDate: params.startDate?.toISOString(),
        endDate: params.endDate?.toISOString(),
      });

      const response = await api.get<Call[]>(url);
      
      if (response.success && response.data) {
        return response.data.map(call => ({
          ...call,
          startedAt: call.startedAt ? new Date(call.startedAt) : undefined,
          endedAt: call.endedAt ? new Date(call.endedAt) : undefined,
          createdAt: new Date(call.createdAt),
          updatedAt: new Date(call.updatedAt),
        }));
      }
      
      throw new Error(response.message || 'Ошибка получения истории звонков');
    } catch (error) {
      console.error('Get call history error:', error);
      throw error;
    }
  }

  // Удаление записи из истории звонков
  async deleteCallFromHistory(callId: string): Promise<void> {
    try {
      const response = await api.delete(`${this.ENDPOINTS.HISTORY}/${callId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка удаления звонка из истории');
      }
    } catch (error) {
      console.error('Delete call from history error:', error);
      throw error;
    }
  }

  // Очистка истории звонков
  async clearCallHistory(): Promise<void> {
    try {
      const response = await api.delete(`${this.ENDPOINTS.HISTORY}/clear`);
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка очистки истории звонков');
      }
    } catch (error) {
      console.error('Clear call history error:', error);
      throw error;
    }
  }

  // === Статистика звонков ===

  // Получение статистики звонка
  async getCallStats(callId: string): Promise<CallStats> {
    try {
      const response = await api.get<CallStats>(`${this.ENDPOINTS.STATS}/${callId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка получения статистики звонка');
    } catch (error) {
      console.error('Get call stats error:', error);
      throw error;
    }
  }

  // Получение общей статистики звонков пользователя
  async getUserCallStats(): Promise<{
    totalCalls: number;
    totalDuration: number;
    completedCalls: number;
    missedCalls: number;
    declinedCalls: number;
    averageDuration: number;
    averageQuality: 'poor' | 'fair' | 'good' | 'excellent';
    monthlyStats: Array<{
      month: string;
      calls: number;
      duration: number;
    }>;
  }> {
    try {
      const response = await api.get<{
        totalCalls: number;
        totalDuration: number;
        completedCalls: number;
        missedCalls: number;
        declinedCalls: number;
        averageDuration: number;
        averageQuality: 'poor' | 'fair' | 'good' | 'excellent';
        monthlyStats: Array<{
          month: string;
          calls: number;
          duration: number;
        }>;
      }>(`${this.ENDPOINTS.STATS}/user`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка получения статистики пользователя');
    } catch (error) {
      console.error('Get user call stats error:', error);
      throw error;
    }
  }

  // === Утилитарные методы ===

  // Проверка поддержки WebRTC
  isWebRTCSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.RTCPeerConnection
    );
  }

  // Получение доступа к медиа устройствам
  async requestMediaAccess(constraints: MediaStreamConstraints): Promise<MediaStream> {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('getUserMedia не поддерживается в этом браузере');
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch (error) {
      console.error('Request media access error:', error);
      throw error;
    }
  }

  // Получение доступа к экрану для демонстрации
  async requestScreenShare(): Promise<MediaStream> {
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error('getDisplayMedia не поддерживается в этом браузере');
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      
      return stream;
    } catch (error) {
      console.error('Request screen share error:', error);
      throw error;
    }
  }

  // Проверка качества соединения
  async checkConnectionQuality(): Promise<{
    quality: 'poor' | 'fair' | 'good' | 'excellent';
    latency: number;
    bandwidth: number;
  }> {
    try {
      const response = await api.get<{
        quality: 'poor' | 'fair' | 'good' | 'excellent';
        latency: number;
        bandwidth: number;
      }>(`${this.ENDPOINTS.CALLS}/connection-test`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Ошибка проверки качества соединения');
    } catch (error) {
      console.error('Check connection quality error:', error);
      throw error;
    }
  }

  // Получение активных звонков пользователя
  async getActiveCalls(): Promise<Call[]> {
    try {
      const response = await api.get<Call[]>(`${this.ENDPOINTS.CALLS}/active`);
      
      if (response.success && response.data) {
        return response.data.map(call => ({
          ...call,
          startedAt: call.startedAt ? new Date(call.startedAt) : undefined,
          endedAt: call.endedAt ? new Date(call.endedAt) : undefined,
          createdAt: new Date(call.createdAt),
          updatedAt: new Date(call.updatedAt),
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Get active calls error:', error);
      return [];
    }
  }

  // Отправка отчета о проблеме со звонком
  async reportCallIssue(callId: string, issue: {
    type: 'audio' | 'video' | 'connection' | 'other';
    description: string;
    severity: 'low' | 'medium' | 'high';
  }): Promise<void> {
    try {
      const response = await api.post(`${this.ENDPOINTS.CALLS}/${callId}/report`, issue);
      
      if (!response.success) {
        throw new Error(response.message || 'Ошибка отправки отчета о проблеме');
      }
    } catch (error) {
      console.error('Report call issue error:', error);
      throw error;
    }
  }

  // Отключение всех медиа треков
  stopMediaStream(stream: MediaStream): void {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
    }
  }

  // Форматирование длительности звонка
  formatCallDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  // Получение иконки для типа звонка
  getCallTypeIcon(call: Call): string {
    switch (call.type) {
      case 'video':
        return '📹';
      case 'audio':
        return '📞';
      case 'conference':
        return '👥';
      default:
        return '📞';
    }
  }

  // Получение описания статуса звонка
  getCallStatusDescription(status: string): string {
    switch (status) {
      case 'pending':
        return 'Ожидание ответа';
      case 'ringing':
        return 'Звонит';
      case 'connected':
        return 'Соединен';
      case 'ended':
        return 'Завершен';
      case 'missed':
        return 'Пропущен';
      case 'declined':
        return 'Отклонен';
      case 'failed':
        return 'Ошибка соединения';
      default:
        return 'Неизвестно';
    }
  }

  // Проверка, можно ли присоединиться к звонку
  canJoinCall(call: Call): boolean {
    return call.status === 'connected' && call.type === 'conference';
  }

  // Проверка, является ли звонок активным
  isCallActive(call: Call): boolean {
    return ['pending', 'ringing', 'connected'].includes(call.status);
  }
}

export const callService = new CallService();
export default callService;