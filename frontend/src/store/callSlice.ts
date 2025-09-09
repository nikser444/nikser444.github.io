// frontend/src/store/callSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { callService } from '../services';
import type { User } from '../types/user';

// Типы для звонков
export type CallType = 'audio' | 'video' | 'screen';
export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'declined' | 'missed';

// Интерфейс звонка
export interface Call {
  id: string;
  type: CallType;
  status: CallStatus;
  caller: User;
  receiver: User;
  startTime?: number;
  endTime?: number;
  duration?: number;
  isGroup?: boolean;
  participants?: User[];
  roomId?: string;
}

// Настройки мультимедиа
export interface MediaSettings {
  video: {
    enabled: boolean;
    deviceId?: string;
    resolution: 'low' | 'medium' | 'high';
  };
  audio: {
    enabled: boolean;
    deviceId?: string;
    noiseReduction: boolean;
    echoCancellation: boolean;
  };
  screen: {
    enabled: boolean;
    includeAudio: boolean;
  };
}

// Статистика звонка
export interface CallStats {
  bitrate: number;
  packetsLost: number;
  latency: number;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
}

// Состояние звонков
export interface CallState {
  currentCall: Call | null;
  incomingCall: Call | null;
  callHistory: Call[];
  isConnecting: boolean;
  isInCall: boolean;
  mediaSettings: MediaSettings;
  availableDevices: {
    cameras: MediaDeviceInfo[];
    microphones: MediaDeviceInfo[];
    speakers: MediaDeviceInfo[];
  };
  callStats: CallStats | null;
  error: string | null;
  isScreenSharing: boolean;
  participants: User[];
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
}

// Начальные настройки медиа
const defaultMediaSettings: MediaSettings = {
  video: {
    enabled: true,
    resolution: 'medium',
  },
  audio: {
    enabled: true,
    noiseReduction: true,
    echoCancellation: true,
  },
  screen: {
    enabled: false,
    includeAudio: false,
  },
};

// Начальное состояние
const initialState: CallState = {
  currentCall: null,
  incomingCall: null,
  callHistory: [],
  isConnecting: false,
  isInCall: false,
  mediaSettings: defaultMediaSettings,
  availableDevices: {
    cameras: [],
    microphones: [],
    speakers: [],
  },
  callStats: null,
  error: null,
  isScreenSharing: false,
  participants: [],
  localStream: null,
  remoteStreams: {},
};

// Асинхронные thunks
export const initiateCall = createAsyncThunk(
  'call/initiate',
  async (
    { userId, type }: { userId: string; type: CallType },
    { rejectWithValue }
  ) => {
    try {
      const response = await callService.initiateCall(userId, type);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка инициации звонка'
      );
    }
  }
);

export const acceptCall = createAsyncThunk(
  'call/accept',
  async (callId: string, { rejectWithValue }) => {
    try {
      const response = await callService.acceptCall(callId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка принятия звонка'
      );
    }
  }
);

export const declineCall = createAsyncThunk(
  'call/decline',
  async (callId: string, { rejectWithValue }) => {
    try {
      const response = await callService.declineCall(callId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка отклонения звонка'
      );
    }
  }
);

export const endCall = createAsyncThunk(
  'call/end',
  async (callId: string, { rejectWithValue }) => {
    try {
      const response = await callService.endCall(callId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка завершения звонка'
      );
    }
  }
);

export const fetchCallHistory = createAsyncThunk(
  'call/fetchHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await callService.getCallHistory();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка загрузки истории звонков'
      );
    }
  }
);

export const createConference = createAsyncThunk(
  'call/createConference',
  async (
    { participants, name }: { participants: string[]; name?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await callService.createConference(participants, name);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка создания конференции'
      );
    }
  }
);

// Создаем slice
const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {
    setIncomingCall: (state, action: PayloadAction<Call | null>) => {
      state.incomingCall = action.payload;
    },
    setCurrentCall: (state, action: PayloadAction<Call | null>) => {
      state.currentCall = action.payload;
      state.isInCall = !!action.payload && action.payload.status === 'connected';
    },
    updateCallStatus: (state, action: PayloadAction<{ callId: string; status: CallStatus }>) => {
      const { callId, status } = action.payload;
      
      if (state.currentCall?.id === callId) {
        state.currentCall.status = status;
        state.isInCall = status === 'connected';
        
        if (status === 'connected' && !state.currentCall.startTime) {
          state.currentCall.startTime = Date.now();
        }
        
        if (status === 'ended' || status === 'declined') {
          state.currentCall.endTime = Date.now();
          if (state.currentCall.startTime) {
            state.currentCall.duration = state.currentCall.endTime - state.currentCall.startTime;
          }
        }
      }
      
      if (state.incomingCall?.id === callId) {
        state.incomingCall.status = status;
        
        if (status === 'accepted') {
          state.currentCall = state.incomingCall;
          state.incomingCall = null;
          state.isInCall = true;
        } else if (status === 'declined' || status === 'ended') {
          state.incomingCall = null;
        }
      }
    },
    toggleVideo: (state) => {
      state.mediaSettings.video.enabled = !state.mediaSettings.video.enabled;
    },
    toggleAudio: (state) => {
      state.mediaSettings.audio.enabled = !state.mediaSettings.audio.enabled;
    },
    toggleScreenShare: (state) => {
      state.isScreenSharing = !state.isScreenSharing;
      state.mediaSettings.screen.enabled = state.isScreenSharing;
    },
    updateMediaSettings: (state, action: PayloadAction<Partial<MediaSettings>>) => {
      state.mediaSettings = { ...state.mediaSettings, ...action.payload };
    },
    setAvailableDevices: (state, action: PayloadAction<{
      cameras: MediaDeviceInfo[];
      microphones: MediaDeviceInfo[];
      speakers: MediaDeviceInfo[];
    }>) => {
      state.availableDevices = action.payload;
    },
    setVideoDevice: (state, action: PayloadAction<string>) => {
      state.mediaSettings.video.deviceId = action.payload;
    },
    setAudioDevice: (state, action: PayloadAction<string>) => {
      state.mediaSettings.audio.deviceId = action.payload;
    },
    setVideoQuality: (state, action: PayloadAction<'low' | 'medium' | 'high'>) => {
      state.mediaSettings.video.resolution = action.payload;
    },
    setCallStats: (state, action: PayloadAction<CallStats>) => {
      state.callStats = action.payload;
    },
    addParticipant: (state, action: PayloadAction<User>) => {
      const participant = action.payload;
      if (!state.participants.find(p => p.id === participant.id)) {
        state.participants.push(participant);
      }
    },
    removeParticipant: (state, action: PayloadAction<string>) => {
      const userId = action.payload;
      state.participants = state.participants.filter(p => p.id !== userId);
      
      // Удаляем поток пользователя
      if (state.remoteStreams[userId]) {
        delete state.remoteStreams[userId];
      }
    },
    setLocalStream: (state, action: PayloadAction<MediaStream | null>) => {
      state.localStream = action.payload;
    },
    setRemoteStream: (state, action: PayloadAction<{ userId: string; stream: MediaStream }>) => {
      const { userId, stream } = action.payload;
      state.remoteStreams[userId] = stream;
    },
    removeRemoteStream: (state, action: PayloadAction<string>) => {
      const userId = action.payload;
      if (state.remoteStreams[userId]) {
        delete state.remoteStreams[userId];
      }
    },
    clearCall: (state) => {
      state.currentCall = null;
      state.incomingCall = null;
      state.isInCall = false;
      state.isConnecting = false;
      state.isScreenSharing = false;
      state.participants = [];
      state.localStream = null;
      state.remoteStreams = {};
      state.callStats = null;
      state.error = null;
    },
    setConnecting: (state, action: PayloadAction<boolean>) => {
      state.isConnecting = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    addToCallHistory: (state, action: PayloadAction<Call>) => {
      const call = action.payload;
      const existingIndex = state.callHistory.findIndex(c => c.id === call.id);
      
      if (existingIndex !== -1) {
        state.callHistory[existingIndex] = call;
      } else {
        state.callHistory.unshift(call);
      }
      
      // Ограничиваем историю звонков (например, последние 100)
      if (state.callHistory.length > 100) {
        state.callHistory = state.callHistory.slice(0, 100);
      }
    },
  },
  extraReducers: (builder) => {
    // Initiate call
    builder
      .addCase(initiateCall.pending, (state) => {
        state.isConnecting = true;
        state.error = null;
      })
      .addCase(initiateCall.fulfilled, (state, action) => {
        state.isConnecting = false;
        state.currentCall = action.payload;
      })
      .addCase(initiateCall.rejected, (state, action) => {
        state.isConnecting = false;
        state.error = action.payload as string;
      });

    // Accept call
    builder
      .addCase(acceptCall.pending, (state) => {
        state.isConnecting = true;
        state.error = null;
      })
      .addCase(acceptCall.fulfilled, (state, action) => {
        state.isConnecting = false;
        state.currentCall = action.payload;
        state.incomingCall = null;
        state.isInCall = true;
      })
      .addCase(acceptCall.rejected, (state, action) => {
        state.isConnecting = false;
        state.error = action.payload as string;
      });

    // Decline call
    builder
      .addCase(declineCall.fulfilled, (state, action) => {
        const declinedCall = action.payload;
        
        if (state.incomingCall?.id === declinedCall.id) {
          state.incomingCall = null;
        }
        
        // Добавляем в историю как пропущенный звонок
        state.callHistory.unshift({
          ...declinedCall,
          status: 'declined'
        });
      });

    // End call
    builder
      .addCase(endCall.fulfilled, (state, action) => {
        const endedCall = action.payload;
        
        // Добавляем в историю звонков
        if (state.currentCall) {
          state.callHistory.unshift({
            ...state.currentCall,
            ...endedCall,
            status: 'ended'
          });
        }
        
        // Очищаем текущий звонок
        state.currentCall = null;
        state.isInCall = false;
        state.isScreenSharing = false;
        state.participants = [];
        state.localStream = null;
        state.remoteStreams = {};
        state.callStats = null;
      });

    // Fetch call history
    builder
      .addCase(fetchCallHistory.fulfilled, (state, action) => {
        state.callHistory = action.payload;
      });

    // Create conference
    builder
      .addCase(createConference.pending, (state) => {
        state.isConnecting = true;
        state.error = null;
      })
      .addCase(createConference.fulfilled, (state, action) => {
        state.isConnecting = false;
        state.currentCall = action.payload;
        state.isInCall = true;
        state.participants = action.payload.participants || [];
      })
      .addCase(createConference.rejected, (state, action) => {
        state.isConnecting = false;
        state.error = action.payload as string;
      });
  },
});

// Экспортируем действия
export const {
  setIncomingCall,
  setCurrentCall,
  updateCallStatus,
  toggleVideo,
  toggleAudio,
  toggleScreenShare,
  updateMediaSettings,
  setAvailableDevices,
  setVideoDevice,
  setAudioDevice,
  setVideoQuality,
  setCallStats,
  addParticipant,
  removeParticipant,
  setLocalStream,
  setRemoteStream,
  removeRemoteStream,
  clearCall,
  setConnecting,
  clearError,
  addToCallHistory,
} = callSlice.actions;

// Селекторы
export const selectCurrentCall = (state: { call: CallState }) => state.call.currentCall;
export const selectIncomingCall = (state: { call: CallState }) => state.call.incomingCall;
export const selectIsInCall = (state: { call: CallState }) => state.call.isInCall;
export const selectIsConnecting = (state: { call: CallState }) => state.call.isConnecting;
export const selectCallHistory = (state: { call: CallState }) => state.call.callHistory;
export const selectMediaSettings = (state: { call: CallState }) => state.call.mediaSettings;
export const selectAvailableDevices = (state: { call: CallState }) => state.call.availableDevices;
export const selectCallStats = (state: { call: CallState }) => state.call.callStats;
export const selectCallError = (state: { call: CallState }) => state.call.error;
export const selectIsScreenSharing = (state: { call: CallState }) => state.call.isScreenSharing;
export const selectCallParticipants = (state: { call: CallState }) => state.call.participants;
export const selectLocalStream = (state: { call: CallState }) => state.call.localStream;
export const selectRemoteStreams = (state: { call: CallState }) => state.call.remoteStreams;
export const selectIsVideoEnabled = (state: { call: CallState }) => state.call.mediaSettings.video.enabled;
export const selectIsAudioEnabled = (state: { call: CallState }) => state.call.mediaSettings.audio.enabled;

// Экспортируем reducer
export default callSlice.reducer;