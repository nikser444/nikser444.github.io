import React, { useRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Video, VideoOff, Maximize2, Minimize2 } from 'lucide-react';
import { RootState } from '../../store';
import Avatar from '../common/Avatar';

interface VideoCallProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
}

const VideoCall: React.FC<VideoCallProps> = ({ 
  localStream, 
  remoteStream, 
  isConnected 
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isLocalVideoFullscreen, setIsLocalVideoFullscreen] = useState(false);
  const [isRemoteVideoReady, setIsRemoteVideoReady] = useState(false);
  const [localVideoSize, setLocalVideoSize] = useState<'small' | 'large'>('small');
  
  const { currentCall } = useSelector((state: RootState) => state.call);
  const { user } = useSelector((state: RootState) => state.auth);

  // Инициализация локального видео
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(console.error);
    }
  }, [localStream]);

  // Инициализация удаленного видео
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(console.error);
    }
  }, [remoteStream]);

  // Обработка события загрузки удаленного видео
  const handleRemoteVideoLoad = () => {
    setIsRemoteVideoReady(true);
  };

  // Переключение размера локального видео
  const toggleLocalVideoSize = () => {
    setLocalVideoSize(prev => prev === 'small' ? 'large' : 'small');
  };

  // Получение информации о собеседнике
  const remoteParticipant = currentCall?.participants.find(p => p.id !== user?.id);

  return (
    <div className="relative w-full h-full bg-gray-900">
      {/* Основное (удаленное) видео */}
      <div className="w-full h-full relative">
        {remoteStream && isConnected ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted={false}
            className="w-full h-full object-cover"
            onLoadedData={handleRemoteVideoLoad}
          />
        ) : (
          // Аватар собеседника, если видео недоступно
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="text-center text-white">
              <Avatar
                src={remoteParticipant?.avatar}
                alt={remoteParticipant?.name || 'Собеседник'}
                size="xl"
                className="mx-auto mb-4"
              />
              <h3 className="text-xl font-medium mb-2">
                {remoteParticipant?.name || 'Собеседник'}
              </h3>
              <p className="text-gray-300 flex items-center justify-center">
                {!isConnected ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Подключение...
                  </>
                ) : (
                  <>
                    <VideoOff className="w-4 h-4 mr-2" />
                    Камера выключена
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Индикатор статуса удаленного видео */}
        {!isRemoteVideoReady && remoteStream && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm flex items-center">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
            Загрузка видео...
          </div>
        )}
      </div>

      {/* Локальное видео */}
      <div className={`
        absolute transition-all duration-300 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600
        ${localVideoSize === 'small' 
          ? 'bottom-4 right-4 w-48 h-36' 
          : 'top-4 left-4 w-80 h-60'
        }
      `}>
        {localStream ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-700">
            <div className="text-center text-white">
              <Avatar
                src={user?.avatar}
                alt={user?.name || 'Вы'}
                size="md"
                className="mx-auto mb-2"
              />
              <VideoOff className="w-6 h-6 mx-auto" />
            </div>
          </div>
        )}

        {/* Кнопка переключения размера локального видео */}
        <button
          onClick={toggleLocalVideoSize}
          className="absolute top-2 right-2 p-1.5 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
          title={localVideoSize === 'small' ? 'Увеличить' : 'Уменьшить'}
        >
          {localVideoSize === 'small' ? (
            <Maximize2 className="w-4 h-4" />
          ) : (
            <Minimize2 className="w-4 h-4" />
          )}
        </button>

        {/* Индикатор "Вы" */}
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          Вы
        </div>
      </div>

      {/* Индикаторы качества соединения */}
      {isConnected && (
        <div className="absolute top-4 left-4 flex flex-col space-y-2">
          <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            HD качество
          </div>
        </div>
      )}

      {/* Overlay для неактивного состояния */}
      {!isConnected && (
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm">Установка видеосвязи...</p>
          </div>
        </div>
      )}

      {/* Информация о собеседнике в углу */}
      {remoteParticipant && isConnected && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded flex items-center">
          <Video className="w-4 h-4 mr-2" />
          <span className="text-sm">{remoteParticipant.name}</span>
        </div>
      )}
    </div>
  );
};

export default VideoCall;