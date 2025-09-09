import React, { useEffect, useState, useRef } from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { CallWindow, VideoCall, AudioCall, ScreenShare, Conference, CallControls } from '../components/calls';
import { useAuth, useSocket, useWebRTC } from '../hooks';
import { CallType, CallStatus } from '../types/call';
import { User } from '../types/user';

const CallPage: React.FC = () => {
  const { callId } = useParams<{ callId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user, loading } = useAuth();
  const { socket } = useSocket();
  const { 
    localStream, 
    remoteStreams, 
    screenStream,
    isConnected, 
    isMuted, 
    isVideoEnabled,
    isScreenSharing,
    connectToPeer,
    disconnectFromPeer,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare
  } = useWebRTC();

  const [callType, setCallType] = useState<CallType>('audio');
  const [callStatus, setCallStatus] = useState<CallStatus>('connecting');
  const [participants, setParticipants] = useState<User[]>([]);
  const [isIncoming, setIsIncoming] = useState(false);
  const [caller, setCaller] = useState<User | null>(null);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const callStartTimeRef = useRef<Date | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!callId || !socket || !user) return;

    // Подключение к звонку
    socket.emit('call:join', { callId, userId: user.id });

    // Обработчики событий звонка
    socket.on('call:joined', handleCallJoined);
    socket.on('call:user:joined', handleUserJoined);
    socket.on('call:user:left', handleUserLeft);
    socket.on('call:ended', handleCallEnded);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('call:declined', handleCallDeclined);
    socket.on('call:type:changed', handleCallTypeChanged);
    socket.on('call:screen:share:started', handleScreenShareStarted);
    socket.on('call:screen:share:stopped', handleScreenShareStopped);

    return () => {
      socket.off('call:joined');
      socket.off('call:user:joined');
      socket.off('call:user:left');
      socket.off('call:ended');
      socket.off('call:accepted');
      socket.off('call:declined');
      socket.off('call:type:changed');
      socket.off('call:screen:share:started');
      socket.off('call:screen:share:stopped');
    };
  }, [callId, socket, user]);

  useEffect(() => {
    // Установка локального видеопотока
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    // Запуск счетчика времени при начале звонка
    if (callStatus === 'connected' && !callStartTimeRef.current) {
      callStartTimeRef.current = new Date();
      durationIntervalRef.current = setInterval(() => {
        if (callStartTimeRef.current) {
          const diff = Date.now() - callStartTimeRef.current.getTime();
          setDuration(Math.floor(diff / 1000));
        }
      }, 1000);
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [callStatus]);

  const handleCallJoined = (data: any) => {
    setCallType(data.callType);
    setCallStatus(data.status);
    setParticipants(data.participants);
    setIsIncoming(data.isIncoming);
    setCaller(data.caller);
  };

  const handleUserJoined = (data: any) => {
    setParticipants(prev => [...prev, data.user]);
    connectToPeer(data.user.id, data.signalData);
  };

  const handleUserLeft = (data: any) => {
    setParticipants(prev => prev.filter(p => p.id !== data.userId));
    disconnectFromPeer(data.userId);
  };

  const handleCallEnded = () => {
    setCallStatus('ended');
    setTimeout(() => {
      navigate('/chat');
    }, 2000);
  };

  const handleCallAccepted = () => {
    setCallStatus('connected');
    setIsIncoming(false);
  };

  const handleCallDeclined = () => {
    setCallStatus('declined');
    setTimeout(() => {
      navigate('/chat');
    }, 2000);
  };

  const handleCallTypeChanged = (data: any) => {
    setCallType(data.callType);
  };

  const handleScreenShareStarted = (data: any) => {
    // Обработка начала демонстрации экрана другим участником
  };

  const handleScreenShareStopped = (data: any) => {
    // Обработка остановки демонстрации экрана другим участником
  };

  const handleAcceptCall = () => {
    if (socket && callId) {
      socket.emit('call:accept', { callId });
      setCallStatus('connected');
    }
  };

  const handleDeclineCall = () => {
    if (socket && callId) {
      socket.emit('call:decline', { callId });
      navigate('/chat');
    }
  };

  const handleEndCall = () => {
    if (socket && callId) {
      socket.emit('call:end', { callId });
      setCallStatus('ended');
      setTimeout(() => {
        navigate('/chat');
      }, 1000);
    }
  };

  const handleToggleVideo = () => {
    toggleVideo();
    if (socket && callId) {
      socket.emit('call:video:toggle', { 
        callId, 
        isVideoEnabled: !isVideoEnabled 
      });
    }
  };

  const handleToggleMute = () => {
    toggleMute();
    if (socket && callId) {
      socket.emit('call:audio:toggle', { 
        callId, 
        isMuted: !isMuted 
      });
    }
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
      if (socket && callId) {
        socket.emit('call:screen:share:stop', { callId });
      }
    } else {
      try {
        await startScreenShare();
        if (socket && callId) {
          socket.emit('call:screen:share:start', { callId });
        }
      } catch (error) {
        console.error('Ошибка начала демонстрации экрана:', error);
      }
    }
  };

  const handleToggleCallType = () => {
    const newCallType = callType === 'audio' ? 'video' : 'audio';
    setCallType(newCallType);
    
    if (socket && callId) {
      socket.emit('call:type:change', { callId, callType: newCallType });
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'connecting':
        return isIncoming ? 'Входящий звонок...' : 'Подключение...';
      case 'ringing':
        return 'Звонок...';
      case 'connected':
        return `Звонок • ${formatDuration(duration)}`;
      case 'ended':
        return 'Звонок завершён';
      case 'declined':
        return 'Звонок отклонён';
      default:
        return 'Звонок';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!callId) {
    return <Navigate to="/chat" replace />;
  }

  const isConference = participants.length > 1;

  return (
    <div className={`min-h-screen bg-gray-900 text-white flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/chat')}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            disabled={callStatus === 'connected'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div>
            <h1 className="text-lg font-semibold">
              {isConference ? 'Конференция' : caller?.name || 'Звонок'}
            </h1>
            <p className="text-sm text-gray-400">{getStatusText()}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleFullscreen}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
          
          <div className="flex items-center space-x-1 text-sm">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-400">{isConnected ? 'Подключено' : 'Отключено'}</span>
          </div>
        </div>
      </div>

      {/* Main Call Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Incoming Call Screen */}
        {callStatus === 'connecting' && isIncoming && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900">
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                {caller?.avatar ? (
                  <img
                    src={caller.avatar}
                    alt={caller.name}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {caller?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              <h2 className="text-2xl font-bold mb-2">{caller?.name}</h2>
              <p className="text-gray-400 mb-8">
                {callType === 'video' ? 'Видеозвонок' : 'Голосовой звонок'}
              </p>
              
              <div className="flex justify-center space-x-8">
                <button
                  onClick={handleDeclineCall}
                  className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 3l1.5 1.5M3 3l1.5 1.5M3 3v4.5m0-4.5h4.5" />
                  </svg>
                </button>
                
                <button
                  onClick={handleAcceptCall}
                  className="w-16 h-16 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center transition-colors"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Video Call Interface */}
        {callStatus === 'connected' && callType === 'video' && (
          <div className="absolute inset-0">
            {isConference ? (
              <Conference
                participants={participants}
                remoteStreams={remoteStreams}
                localStream={localStream}
                currentUser={user}
                isScreenSharing={isScreenSharing}
                screenStream={screenStream}
              />
            ) : (
              <VideoCall
                remoteStream={remoteStreams[0]}
                localStream={localStream}
                participant={participants[0]}
                isScreenSharing={isScreenSharing}
                screenStream={screenStream}
              />
            )}
            
            {/* Local Video Preview */}
            <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Audio Call Interface */}
        {callStatus === 'connected' && callType === 'audio' && (
          <div className="absolute inset-0">
            <AudioCall
              participants={participants}
              currentUser={user}
              duration={duration}
            />
          </div>
        )}

        {/* Screen Share Interface */}
        {isScreenSharing && screenStream && (
          <ScreenShare
            screenStream={screenStream}
            participants={participants}
            isPresenter={true}
          />
        )}

        {/* Call Status Messages */}
        {(callStatus === 'ended' || callStatus === 'declined') && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 3l1.5 1.5M3 3l1.5 1.5M3 3v4.5m0-4.5h4.5" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">{getStatusText()}</h2>
              <p className="text-gray-400">Возврат к чатам...</p>
            </div>
          </div>
        )}
      </div>

      {/* Call Controls */}
      {callStatus === 'connected' && (
        <div className="p-6">
          <CallControls
            isMuted={isMuted}
            isVideoEnabled={isVideoEnabled}
            isScreenSharing={isScreenSharing}
            callType={callType}
            onToggleMute={handleToggleMute}
            onToggleVideo={handleToggleVideo}
            onToggleScreenShare={handleToggleScreenShare}
            onToggleCallType={handleToggleCallType}
            onEndCall={handleEndCall}
            participants={participants}
          />
        </div>
      )}
    </div>
  );
};

export default CallPage;