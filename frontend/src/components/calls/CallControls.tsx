import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Volume2,
  VolumeX,
  Settings,
  Users,
  MessageCircle,
  MoreVertical,
  Camera,
  Speaker,
  Headphones
} from 'lucide-react';
import { RootState } from '../../store';

interface CallControlsProps {
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  callType: 'audio' | 'video';
  isConnected: boolean;
}

const CallControls: React.FC<CallControlsProps> = ({
  onEndCall,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  isMuted,
  isVideoEnabled,
  isScreenSharing,
  callType,
  isConnected
}) => {
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [audioOutput, setAudioOutput] = useState<'speaker' | 'headphones'>('speaker');
  const [showSettings, setShowSettings] = useState(false);

  const { participants, currentCall } = useSelector((state: RootState) => state.call);

  // Основные элементы управления
  const mainControls = [
    {
      icon: isMuted ? MicOff : Mic,
      onClick: onToggleMute,
      active: !isMuted,
      disabled: !isConnected,
      className: isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600',
      tooltip: isMuted ? 'Включить микрофон' : 'Выключить микрофон',
      key: 'mic'
    },
    ...(callType === 'video' ? [{
      icon: isVideoEnabled ? Video : VideoOff,
      onClick: onToggleVideo,
      active: isVideoEnabled,
      disabled: !isConnected,
      className: !isVideoEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600',
      tooltip: isVideoEnabled ? 'Выключить камеру' : 'Включить камеру',
      key: 'video'
    }] : []),
    {
      icon: isScreenSharing ? MonitorOff : Monitor,
      onClick: onToggleScreenShare,
      active: isScreenSharing,
      disabled: !isConnected,
      className: isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600',
      tooltip: isScreenSharing ? 'Остановить демонстрацию' : 'Демонстрация экрана',
      key: 'screen'
    },
    {
      icon: PhoneOff,
      onClick: onEndCall,
      active: false,
      disabled: false,
      className: 'bg-red-600 hover:bg-red-700',
      tooltip: 'Завершить звонок',
      key: 'end'
    }
  ];

  // Дополнительные элементы управления
  const additionalControls = [
    {
      icon: audioOutput === 'speaker' ? Speaker : Headphones,
      onClick: () => setAudioOutput(audioOutput === 'speaker' ? 'headphones' : 'speaker'),
      tooltip: audioOutput === 'speaker' ? 'Переключить на наушники' : 'Переключить на динамики',
      key: 'audio-output'
    },
    {
      icon: Users,
      onClick: () => setShowParticipants(!showParticipants),
      tooltip: 'Участники',
      badge: participants?.length || 0,
      key: 'participants'
    },
    {
      icon: MessageCircle,
      onClick: () => setShowChat(!showChat),
      tooltip: 'Чат',
      key: 'chat'
    },
    {
      icon: Settings,
      onClick: () => setShowSettings(!showSettings),
      tooltip: 'Настройки',
      key: 'settings'
    }
  ];

  return (
    <div className="bg-gray-900 bg-opacity-95 backdrop-blur-sm border-t border-gray-700">
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Основная панель управления */}
        <div className="flex items-center justify-center space-x-4">
          {/* Основные кнопки управления */}
          <div className="flex items-center space-x-3">
            {mainControls.map(control => {
              const IconComponent = control.icon;
              return (
                <button
                  key={control.key}
                  onClick={control.onClick}
                  disabled={control.disabled}
                  className={`
                    relative p-4 rounded-full transition-all duration-200 transform hover:scale-105
                    ${control.className}
                    ${control.disabled ? 'opacity-50 cursor-not-allowed' : 'shadow-lg'}
                    ${control.key === 'end' ? 'p-5' : ''}
                  `}
                  title={control.tooltip}
                >
                  <IconComponent className={`w-6 h-6 text-white ${control.key === 'end' ? 'w-7 h-7' : ''}`} />
                  
                  {/* Индикатор активности для микрофона */}
                  {control.key === 'mic' && !isMuted && isConnected && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  )}
                  
                  {/* Индикатор записи для демонстрации экрана */}
                  {control.key === 'screen' && isScreenSharing && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Разделитель */}
          <div className="w-px h-12 bg-gray-600" />

          {/* Дополнительные элементы управления */}
          <div className="flex items-center space-x-3">
            {additionalControls.map(control => {
              const IconComponent = control.icon;
              return (
                <button
                  key={control.key}
                  onClick={control.onClick}
                  className="relative p-3 bg-gray-700 hover:bg-gray-600 rounded-full transition-all duration-200 transform hover:scale-105"
                  title={control.tooltip}
                >
                  <IconComponent className="w-5 h-5 text-white" />
                  
                  {/* Значок для участников */}
                  {control.badge && control.badge > 0 && (
                    <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1">
                      {control.badge}
                    </div>
                  )}
                </button>
              );
            })}

            {/* Кнопка дополнительных опций */}
            <button
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              className="p-3 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
              title="Дополнительно"
            >
              <MoreVertical className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Статус соединения */}
        <div className="flex items-center justify-center mt-3 text-sm text-gray-400">
          {isConnected ? (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>Соединение установлено</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
              <span>Подключение...</span>
            </div>
          )}
        </div>

        {/* Дополнительная информация */}
        {currentCall && (
          <div className="flex items-center justify-center mt-2 text-xs text-gray-500">
            <span>ID звонка: {currentCall.id.slice(-8)}</span>
            {participants && participants.length > 2 && (
              <span className="ml-4">Групповой звонок</span>
            )}
          </div>
        )}
      </div>

      {/* Выпадающие панели */}
      {showMoreOptions && (
        <div className="absolute bottom-full right-4 mb-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-2 min-w-48">
          <div className="space-y-1">
            <button className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 rounded flex items-center space-x-2">
              <Camera className="w-4 h-4" />
              <span>Сменить камеру</span>
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 rounded flex items-center space-x-2">
              <Volume2 className="w-4 h-4" />
              <span>Настройки звука</span>
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 rounded flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Настройки видео</span>
            </button>
            <hr className="border-gray-700" />
            <button className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700 rounded flex items-center space-x-2">
              <PhoneOff className="w-4 h-4" />
              <span>Покинуть звонок</span>
            </button>
          </div>
        </div>
      )}

      {/* Панель участников */}
      {showParticipants && (
        <div className="absolute bottom-full left-4 mb-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 min-w-64 max-h-80 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-medium">Участники ({participants?.length || 0})</h3>
            <button
              onClick={() => setShowParticipants(false)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
          <div className="space-y-2">
            {participants?.map(participant => (
              <div key={participant.id} className="flex items-center justify-between p-2 hover:bg-gray-700 rounded">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-sm text-white">
                      {participant.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-white text-sm">{participant.name}</p>
                    <div className="flex items-center space-x-1">
                      {participant.isMuted ? (
                        <MicOff className="w-3 h-3 text-red-400" />
                      ) : (
                        <Mic className="w-3 h-3 text-green-400" />
                      )}
                      {!participant.isVideoEnabled && (
                        <VideoOff className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {participant.isSpeaking && (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Панель чата */}
      {showChat && (
        <div className="absolute bottom-full right-20 mb-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-80 h-96">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-white font-medium">Чат звонка</h3>
            <button
              onClick={() => setShowChat(false)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="text-center text-gray-400 text-sm">
              Сообщений пока нет
            </div>
          </div>
          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Введите сообщение..."
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border-none outline-none text-sm"
              />
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Панель настроек */}
      {showSettings && (
        <div className="absolute bottom-full left-20 mb-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 min-w-72">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium">Настройки звонка</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
          <div className="space-y-4">
            {/* Настройки аудио */}
            <div>
              <h4 className="text-gray-300 text-sm font-medium mb-2">Аудио</h4>
              <div className="space-y-2">
                <label className="flex items-center justify-between">
                  <span className="text-white text-sm">Шумоподавление</span>
                  <input type="checkbox" className="rounded" defaultChecked />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-white text-sm">Эхоподавление</span>
                  <input type="checkbox" className="rounded" defaultChecked />
                </label>
              </div>
            </div>

            {/* Настройки видео */}
            {callType === 'video' && (
              <div>
                <h4 className="text-gray-300 text-sm font-medium mb-2">Видео</h4>
                <div className="space-y-2">
                  <label className="flex items-center justify-between">
                    <span className="text-white text-sm">HD качество</span>
                    <input type="checkbox" className="rounded" defaultChecked />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-white text-sm">Размытие фона</span>
                    <input type="checkbox" className="rounded" />
                  </label>
                </div>
              </div>
            )}

            {/* Горячие клавиши */}
            <div>
              <h4 className="text-gray-300 text-sm font-medium mb-2">Горячие клавиши</h4>
              <div className="space-y-1 text-xs text-gray-400">
                <div className="flex justify-between">
                  <span>Выкл/вкл микрофон</span>
                  <kbd className="bg-gray-700 px-1 rounded">Space</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Выкл/вкл камеру</span>
                  <kbd className="bg-gray-700 px-1 rounded">Ctrl+E</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Завершить звонок</span>
                  <kbd className="bg-gray-700 px-1 rounded">Ctrl+D</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallControls;