import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Phone, PhoneIncoming, PhoneOutgoing, Mic, MicOff, Volume2 } from 'lucide-react';
import { RootState } from '../../store';
import Avatar from '../common/Avatar';

interface AudioCallProps {
  participant: {
    id: string;
    name: string;
    avatar?: string;
    status?: string;
  };
  isConnected: boolean;
  duration: number;
}

const AudioCall: React.FC<AudioCallProps> = ({ 
  participant, 
  isConnected, 
  duration 
}) => {
  const { currentCall, isMuted, callStatus } = useSelector((state: RootState) => state.call);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showWaveform, setShowWaveform] = useState(false);

  // Анимация аудио-волн
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected && !isMuted) {
      interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
        setShowWaveform(true);
      }, 150);
    } else {
      setShowWaveform(false);
      setAudioLevel(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected, isMuted]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallStatusText = () => {
    switch (callStatus) {
      case 'connecting':
        return 'Подключение...';
      case 'ringing':
        return currentCall?.initiatorId === participant.id ? 'Входящий звонок...' : 'Звонок...';
      case 'connected':
        return formatDuration(duration);
      case 'ended':
        return 'Звонок завершен';
      default:
        return 'Ожидание...';
    }
  };

  const getCallStatusIcon = () => {
    switch (callStatus) {
      case 'ringing':
        return currentCall?.initiatorId === participant.id ? PhoneIncoming : PhoneOutgoing;
      case 'connected':
        return Phone;
      default:
        return Phone;
    }
  };

  // Компонент визуализации аудио-волн
  const AudioWaveform = () => (
    <div className="flex items-center justify-center space-x-1 h-8">
      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          className={`
            w-1 bg-white rounded-full transition-all duration-150
            ${showWaveform ? 'opacity-70' : 'opacity-30'}
          `}
          style={{
            height: showWaveform 
              ? `${Math.max(8, (audioLevel + index * 10) % 32)}px` 
              : '8px'
          }}
        />
      ))}
    </div>
  );

  const StatusIcon = getCallStatusIcon();

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white relative overflow-hidden">
      {/* Фоновый паттерн */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
      </div>

      {/* Основное содержимое */}
      <div className="relative z-10 text-center max-w-md mx-auto px-6">
        {/* Аватар с анимацией */}
        <div className="relative mb-8">
          <div className={`
            absolute inset-0 rounded-full transition-all duration-1000
            ${isConnected && !isMuted 
              ? 'bg-white bg-opacity-20 animate-ping' 
              : 'bg-white bg-opacity-10'
            }
          `} />
          <div className={`
            absolute inset-2 rounded-full transition-all duration-500
            ${isConnected && !isMuted 
              ? 'bg-white bg-opacity-10 animate-pulse' 
              : 'bg-transparent'
            }
          `} />
          <Avatar
            src={participant.avatar}
            alt={participant.name}
            size="2xl"
            className="relative z-10 border-4 border-white border-opacity-20"
          />
          
          {/* Индикатор статуса */}
          <div className={`
            absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center
            ${isConnected ? 'bg-green-500' : 'bg-gray-500'}
          `}>
            <StatusIcon className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Информация о собеседнике */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">{participant.name}</h2>
          <div className="flex items-center justify-center space-x-2 text-lg text-gray-200">
            <span>{getCallStatusText()}</span>
          </div>
        </div>

        {/* Визуализация аудио */}
        {isConnected && (
          <div className="mb-8">
            <AudioWaveform />
            <p className="text-sm text-gray-300 mt-2">
              {isMuted ? 'Микрофон выключен' : 'Голосовое соединение'}
            </p>
          </div>
        )}

        {/* Индикаторы качества и статуса */}
        {isConnected && (
          <div className="flex justify-center space-x-6 text-sm text-gray-300">
            <div className="flex items-center space-x-1">
              <Volume2 className="w-4 h-4" />
              <span>HD аудио</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>Стабильное соединение</span>
            </div>
          </div>
        )}
      </div>

      {/* Статус микрофона */}
      {isMuted && isConnected && (
        <div className="absolute top-6 left-6 bg-red-500 bg-opacity-20 border border-red-500 border-opacity-50 text-red-200 px-3 py-1 rounded-full flex items-center space-x-2">
          <MicOff className="w-4 h-4" />
          <span className="text-sm">Микрофон выключен</span>
        </div>
      )}

      {/* Анимированные круги для входящего звонка */}
      {callStatus === 'ringing' && currentCall?.initiatorId === participant.id && (
        <>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-96 h-96 border border-white border-opacity-20 rounded-full animate-ping" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-80 h-80 border border-white border-opacity-30 rounded-full animate-ping animation-delay-500" />
          </div>
        </>
      )}

      {/* Индикатор подключения */}
      {callStatus === 'connecting' && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-2 bg-black bg-opacity-30 px-4 py-2 rounded-full">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            <span className="text-sm">Устанавливается соединение...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioCall;