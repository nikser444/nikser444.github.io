import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Monitor, Users } from 'lucide-react';
import { RootState } from '../../store';
import { endCall, toggleMute, toggleVideo } from '../../store/callSlice';
import { useWebRTC } from '../../hooks/useWebRTC';
import { useSocket } from '../../hooks/useSocket';
import VideoCall from './VideoCall';
import AudioCall from './AudioCall';
import ScreenShare from './ScreenShare';
import Conference from './Conference';
import CallControls from './CallControls';

interface CallWindowProps {
  callId: string;
  onClose?: () => void;
}

const CallWindow: React.FC<CallWindowProps> = ({ callId, onClose }) => {
  const dispatch = useDispatch();
  const { socket } = useSocket();
  const { 
    currentCall, 
    isConnected, 
    isMuted, 
    isVideoEnabled, 
    isScreenSharing,
    participants 
  } = useSelector((state: RootState) => state.call);
  
  const [callDuration, setCallDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  
  const {
    localStream,
    remoteStream,
    peerConnection,
    startCall,
    endCall: endWebRTCCall,
    toggleAudio,
    toggleVideoStream,
    startScreenShare,
    stopScreenShare
  } = useWebRTC();

  // Таймер продолжительности звонка
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected && currentCall) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected, currentCall]);

  // Автоскрытие элементов управления
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (showControls) {
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 5000);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [showControls]);

  // Обработчики
  const handleEndCall = () => {
    if (socket && currentCall) {
      socket.emit('call:end', { callId: currentCall.id });
    }
    endWebRTCCall();
    dispatch(endCall());
    onClose?.();
  };

  const handleToggleMute = () => {
    toggleAudio();
    dispatch(toggleMute());
  };

  const handleToggleVideo = () => {
    toggleVideoStream();
    dispatch(toggleVideo());
  };

  const handleToggleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
  };

  if (!currentCall) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white">
        <div className="text-center">
          <Phone className="mx-auto mb-4 h-12 w-12" />
          <p>Нет активного звонка</p>
        </div>
      </div>
    );
  }

  const renderCallInterface = () => {
    if (participants && participants.length > 2) {
      return <Conference participants={participants} />;
    }
    
    if (isScreenSharing) {
      return <ScreenShare stream={remoteStream} />;
    }
    
    if (currentCall.type === 'video' && isVideoEnabled) {
      return (
        <VideoCall 
          localStream={localStream}
          remoteStream={remoteStream}
          isConnected={isConnected}
        />
      );
    }
    
    return (
      <AudioCall 
        participant={currentCall.participants[0]}
        isConnected={isConnected}
        duration={callDuration}
      />
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-900 z-50 flex flex-col"
      onMouseMove={handleMouseMove}
    >
      {/* Заголовок с информацией о звонке */}
      <div className={`
        absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-50 p-4 transition-opacity duration-300
        ${showControls ? 'opacity-100' : 'opacity-0'}
      `}>
        <div className="flex items-center justify-between text-white">
          <div>
            <h3 className="text-lg font-medium">
              {currentCall.type === 'video' ? 'Видеозвонок' : 'Голосовой звонок'}
            </h3>
            <p className="text-sm text-gray-300">
              {isConnected ? formatDuration(callDuration) : 'Подключение...'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {participants && participants.length > 2 && (
              <span className="flex items-center text-sm bg-gray-700 px-2 py-1 rounded">
                <Users className="w-4 h-4 mr-1" />
                {participants.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Основное содержимое звонка */}
      <div className="flex-1 relative">
        {renderCallInterface()}
      </div>

      {/* Элементы управления */}
      <div className={`
        absolute bottom-0 left-0 right-0 z-10 transition-opacity duration-300
        ${showControls ? 'opacity-100' : 'opacity-0'}
      `}>
        <CallControls
          onEndCall={handleEndCall}
          onToggleMute={handleToggleMute}
          onToggleVideo={handleToggleVideo}
          onToggleScreenShare={handleToggleScreenShare}
          isMuted={isMuted}
          isVideoEnabled={isVideoEnabled}
          isScreenSharing={isScreenSharing}
          callType={currentCall.type}
          isConnected={isConnected}
        />
      </div>

      {/* Статус подключения */}
      {!isConnected && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Подключение к звонку...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallWindow;