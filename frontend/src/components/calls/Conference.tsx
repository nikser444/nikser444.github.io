import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  Users, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  MoreHorizontal,
  Pin,
  Maximize2
} from 'lucide-react';
import { RootState } from '../../store';
import Avatar from '../common/Avatar';

interface ConferenceProps {
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
    isMuted?: boolean;
    isVideoEnabled?: boolean;
    isScreenSharing?: boolean;
    stream?: MediaStream;
    isSpeaking?: boolean;
    isPinned?: boolean;
  }>;
}

const Conference: React.FC<ConferenceProps> = ({ participants }) => {
  const [layout, setLayout] = useState<'grid' | 'speaker' | 'presentation'>('grid');
  const [pinnedParticipant, setPinnedParticipant] = useState<string | null>(null);
  const [showParticipantsList, setShowParticipantsList] = useState(false);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { isScreenSharing } = useSelector((state: RootState) => state.call);

  // Автоматическое переключение на режим презентации при демонстрации экрана
  useEffect(() => {
    const hasScreenShare = participants.some(p => p.isScreenSharing);
    if (hasScreenShare && layout !== 'presentation') {
      setLayout('presentation');
    }
  }, [participants, layout]);

  // Инициализация видеопотоков
  useEffect(() => {
    participants.forEach(participant => {
      if (participant.stream && videoRefs.current[participant.id]) {
        videoRefs.current[participant.id].srcObject = participant.stream;
      }
    });
  }, [participants]);

  // Получение основного спикера
  const mainSpeaker = pinnedParticipant 
    ? participants.find(p => p.id === pinnedParticipant)
    : participants.find(p => p.isSpeaking) || participants[0];

  // Получение участника, демонстрирующего экран
  const screenShareParticipant = participants.find(p => p.isScreenSharing);

  // Функция для получения размеров сетки
  const getGridDimensions = (count: number) => {
    if (count <= 1) return { cols: 1, rows: 1 };
    if (count <= 4) return { cols: 2, rows: 2 };
    if (count <= 6) return { cols: 3, rows: 2 };
    if (count <= 9) return { cols: 3, rows: 3 };
    return { cols: 4, rows: Math.ceil(count / 4) };
  };

  // Компонент участника
  const ParticipantVideo: React.FC<{
    participant: typeof participants[0];
    size?: 'small' | 'medium' | 'large';
    showControls?: boolean;
  }> = ({ participant, size = 'medium', showControls = true }) => {
    const isMe = participant.id === user?.id;
    
    const sizeClasses = {
      small: 'w-32 h-24',
      medium: 'w-full h-full',
      large: 'w-full h-full'
    };

    return (
      <div className={`
        relative bg-gray-800 rounded-lg overflow-hidden
        ${participant.isSpeaking ? 'ring-2 ring-green-400' : ''}
        ${participant.isPinned ? 'ring-2 ring-blue-400' : ''}
        ${sizeClasses[size]}
      `}>
        {/* Видео или аватар */}
        {participant.isVideoEnabled && participant.stream ? (
          <video
            ref={el => { if (el) videoRefs.current[participant.id] = el; }}
            autoPlay
            playsInline
            muted={isMe}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
            <Avatar
              src={participant.avatar}
              alt={participant.name}
              size={size === 'large' ? 'xl' : size === 'medium' ? 'lg' : 'md'}
            />
          </div>
        )}

        {/* Оверлей с информацией */}
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 hover:opacity-100 transition-opacity">
          {showControls && (
            <div className="absolute top-2 right-2 flex space-x-1">
              <button
                onClick={() => setPinnedParticipant(participant.isPinned ? null : participant.id)}
                className="p-1 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70"
                title={participant.isPinned ? 'Открепить' : 'Закрепить'}
              >
                <Pin className={`w-4 h-4 text-white ${participant.isPinned ? 'fill-current' : ''}`} />
              </button>
              <button className="p-1 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70">
                <MoreHorizontal className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Информация о участнике */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-medium truncate">
              {isMe ? 'Вы' : participant.name}
            </span>
            <div className="flex items-center space-x-1">
              {participant.isScreenSharing && (
                <Monitor className="w-4 h-4 text-blue-400" />
              )}
              {participant.isMuted ? (
                <MicOff className="w-4 h-4 text-red-400" />
              ) : (
                <Mic className={`w-4 h-4 ${participant.isSpeaking ? 'text-green-400' : 'text-gray-400'}`} />
              )}
              {!participant.isVideoEnabled && (
                <VideoOff className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>
        </div>

        {/* Индикатор говорящего */}
        {participant.isSpeaking && (
          <div className="absolute top-2 left-2">
            <div className="flex items-center space-x-1 bg-green-500 bg-opacity-80 text-white px-2 py-1 rounded-full text-xs">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span>Говорит</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Рендер сеточного режима
  const renderGridLayout = () => {
    const { cols, rows } = getGridDimensions(participants.length);
    
    return (
      <div 
        className="grid gap-2 h-full p-4"
        style={{ 
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`
        }}
      >
        {participants.map(participant => (
          <ParticipantVideo
            key={participant.id}
            participant={participant}
            size="medium"
          />
        ))}
      </div>
    );
  };

  // Рендер режима основного спикера
  const renderSpeakerLayout = () => {
    const otherParticipants = participants.filter(p => p.id !== mainSpeaker?.id);
    
    return (
      <div className="flex h-full">
        {/* Основной спикер */}
        <div className="flex-1 p-4">
          {mainSpeaker && (
            <ParticipantVideo
              participant={mainSpeaker}
              size="large"
            />
          )}
        </div>
        
        {/* Боковая панель с остальными участниками */}
        {otherParticipants.length > 0 && (
          <div className="w-64 bg-gray-800 p-2 space-y-2 overflow-y-auto">
            {otherParticipants.map(participant => (
              <ParticipantVideo
                key={participant.id}
                participant={participant}
                size="small"
                showControls={false}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Рендер режима презентации
  const renderPresentationLayout = () => {
    const otherParticipants = participants.filter(p => !p.isScreenSharing);
    
    return (
      <div className="flex h-full">
        {/* Демонстрация экрана */}
        <div className="flex-1 bg-black flex items-center justify-center">
          {screenShareParticipant?.stream ? (
            <video
              autoPlay
              playsInline
              className="max-w-full max-h-full object-contain"
              style={{ aspectRatio: '16/9' }}
            />
          ) : (
            <div className="text-center text-white">
              <Monitor className="mx-auto mb-4 h-16 w-16" />
              <p>Демонстрация экрана загружается...</p>
            </div>
          )}
        </div>
        
        {/* Участники в боковой панели */}
        <div className="w-80 bg-gray-900 p-2">
          <div className="mb-2 text-white text-sm font-medium flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Участники ({participants.length})
          </div>
          <div className="space-y-2 overflow-y-auto">
            {participants.map(participant => (
              <div key={participant.id} className="h-20">
                <ParticipantVideo
                  participant={participant}
                  size="small"
                  showControls={false}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full bg-gray-900">
      {/* Переключатель режимов */}
      <div className="absolute top-4 left-4 z-10 flex space-x-2">
        {['grid', 'speaker', 'presentation'].map((layoutType) => (
          <button
            key={layoutType}
            onClick={() => setLayout(layoutType as typeof layout)}
            className={`
              px-3 py-1 rounded text-sm font-medium transition-colors
              ${layout === layoutType 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }
            `}
          >
            {layoutType === 'grid' && 'Сетка'}
            {layoutType === 'speaker' && 'Спикер'}
            {layoutType === 'presentation' && 'Презентация'}
          </button>
        ))}
      </div>

      {/* Счетчик участников */}
      <div className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white px-3 py-1 rounded flex items-center space-x-2">
        <Users className="w-4 h-4" />
        <span className="text-sm">{participants.length} участников</span>
      </div>

      {/* Основной контент */}
      <div className="w-full h-full">
        {layout === 'grid' && renderGridLayout()}
        {layout === 'speaker' && renderSpeakerLayout()}
        {layout === 'presentation' && renderPresentationLayout()}
      </div>

      {/* Индикаторы активности */}
      <div className="absolute bottom-4 left-4 z-10">
        {participants.filter(p => p.isSpeaking).length > 0 && (
          <div className="bg-green-500 bg-opacity-80 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span>
              {participants.filter(p => p.isSpeaking).length} говорит
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Conference;