import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Header, Sidebar, Button, Modal } from '../components/common';
import { ProfileSettings, AvatarUpload, StatusSettings } from '../components/profile';
import { useAuth, useNotifications } from '../hooks';

type SettingsTab = 'profile' | 'notifications' | 'privacy' | 'appearance' | 'audio';

interface NotificationSettings {
  soundEnabled: boolean;
  desktopNotifications: boolean;
  messagePreview: boolean;
  friendRequests: boolean;
  callNotifications: boolean;
}

interface PrivacySettings {
  showOnlineStatus: boolean;
  allowFriendRequests: boolean;
  showReadReceipts: boolean;
  allowCalls: boolean;
}

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
}

interface AudioSettings {
  inputDevice: string;
  outputDevice: string;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  micVolume: number;
  speakerVolume: number;
}

const SettingsPage: React.FC = () => {
  const { isAuthenticated, user, loading, updateProfile } = useAuth();
  const { requestPermission } = useNotifications();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(false);
  
  // Настройки
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    soundEnabled: true,
    desktopNotifications: false,
    messagePreview: true,
    friendRequests: true,
    callNotifications: true,
  });

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    showOnlineStatus: true,
    allowFriendRequests: true,
    showReadReceipts: true,
    allowCalls: true,
  });

  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    theme: 'light',
    fontSize: 'medium',
    compactMode: false,
  });

  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    inputDevice: 'default',
    outputDevice: 'default',
    echoCancellation: true,
    noiseSuppression: true,
    micVolume: 80,
    speakerVolume: 80,
  });

  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    loadSettings();
    loadAudioDevices();
  }, []);

  const loadSettings = async () => {
    try {
      // Загрузка настроек из localStorage или API
      const savedNotifications = localStorage.getItem('notificationSettings');
      if (savedNotifications) {
        setNotificationSettings(JSON.parse(savedNotifications));
      }

      const savedPrivacy = localStorage.getItem('privacySettings');
      if (savedPrivacy) {
        setPrivacySettings(JSON.parse(savedPrivacy));
      }

      const savedAppearance = localStorage.getItem('appearanceSettings');
      if (savedAppearance) {
        setAppearanceSettings(JSON.parse(savedAppearance));
      }

      const savedAudio = localStorage.getItem('audioSettings');
      if (savedAudio) {
        setAudioSettings(JSON.parse(savedAudio));
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
    }
  };

  const loadAudioDevices = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAvailableDevices(devices.filter(device => device.kind === 'audioinput' || device.kind === 'audiooutput'));
    } catch (error) {
      console.error('Ошибка получения аудиоустройств:', error);
    }
  };

  const saveSettings = async () => {
    try {
      // Сохранение в localStorage
      localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
      localStorage.setItem('privacySettings', JSON.stringify(privacySettings));
      localStorage.setItem('appearanceSettings', JSON.stringify(appearanceSettings));
      localStorage.setItem('audioSettings', JSON.stringify(audioSettings));

      // Здесь можно добавить сохранение в API
      // await userService.updateSettings({...});

      setPendingChanges(false);
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
    }
  };

  const handleNotificationSettingsChange = async (key: keyof NotificationSettings, value: boolean) => {
    if (key === 'desktopNotifications' && value) {
      const permission = await requestPermission();
      if (permission !== 'granted') {
        return;
      }
    }

    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setPendingChanges(true);
  };

  const handlePrivacySettingsChange = (key: keyof PrivacySettings, value: boolean) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: value
    }));
    setPendingChanges(true);
  };

  const handleAppearanceSettingsChange = (key: keyof AppearanceSettings, value: any) => {
    setAppearanceSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setPendingChanges(true);

    // Применяем изменения темы сразу
    if (key === 'theme') {
      applyTheme(value);
    }
  };

  const applyTheme = (theme: string) => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // auto - следуем системной теме
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const handleAudioSettingsChange = (key: keyof AudioSettings, value: any) => {
    setAudioSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setPendingChanges(true);
  };

  const handleLogout = () => {
    setIsConfirmModalOpen(true);
  };

  const confirmLogout = () => {
    // Здесь будет логика выхода
    // authService.logout();
    setIsConfirmModalOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const settingsTabs = [
    { id: 'profile', label: 'Профиль', icon: '👤' },
    { id: 'notifications', label: 'Уведомления', icon: '🔔' },
    { id: 'privacy', label: 'Приватность', icon: '🔒' },
    { id: 'appearance', label: 'Оформление', icon: '🎨' },
    { id: 'audio', label: 'Аудио', icon: '🎵' },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header 
        user={user}
        onToggleSidebar={toggleSidebar}
        isConnected={true}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpen={isSidebarOpen}>
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Настройки</h2>
            </div>
            
            <nav className="flex-1 overflow-y-auto p-2">
              {settingsTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-colors mb-1 ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg mr-3">{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full text-red-600 border-red-300 hover:bg-red-50"
              >
                Выйти из аккаунта
              </Button>
            </div>
          </div>
        </Sidebar>

        <main className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-4xl mx-auto p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Профиль</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AvatarUpload user={user} onAvatarUpdated={updateProfile} />
                    <ProfileSettings user={user} onProfileUpdated={updateProfile} />
                  </div>
                </div>
                <StatusSettings user={user} onStatusUpdated={updateProfile} />
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Уведомления</h3>
                
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Звуковые уведомления</h4>
                      <p className="text-sm text-gray-500">Воспроизводить звук при получении сообщений</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.soundEnabled}
                        onChange={(e) => handleNotificationSettingsChange('soundEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Уведомления на рабочем столе</h4>
                      <p className="text-sm text-gray-500">Показывать уведомления даже когда приложение свернуто</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.desktopNotifications}
                        onChange={(e) => handleNotificationSettingsChange('desktopNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Предварительный просмотр сообщений</h4>
                      <p className="text-sm text-gray-500">Показывать содержимое сообщений в уведомлениях</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.messagePreview}
                        onChange={(e) => handleNotificationSettingsChange('messagePreview', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Заявки в друзья</h4>
                      <p className="text-sm text-gray-500">Уведомлять о новых заявках в друзья</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.friendRequests}
                        onChange={(e) => handleNotificationSettingsChange('friendRequests', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Уведомления о звонках</h4>
                      <p className="text-sm text-gray-500">Показывать уведомления о входящих звонках</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.callNotifications}
                        onChange={(e) => handleNotificationSettingsChange('callNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Приватность</h3>
                
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Показывать статус "В сети"</h4>
                      <p className="text-sm text-gray-500">Другие пользователи смогут видеть когда вы онлайн</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacySettings.showOnlineStatus}
                        onChange={(e) => handlePrivacySettingsChange('showOnlineStatus', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Принимать заявки в друзья</h4>
                      <p className="text-sm text-gray-500">Разрешить другим пользователям отправлять заявки в друзья</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacySettings.allowFriendRequests}
                        onChange={(e) => handlePrivacySettingsChange('allowFriendRequests', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Отметки о прочтении</h4>
                      <p className="text-sm text-gray-500">Показывать другим когда вы прочитали их сообщения</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacySettings.showReadReceipts}
                        onChange={(e) => handlePrivacySettingsChange('showReadReceipts', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Принимать звонки</h4>
                      <p className="text-sm text-gray-500">Разрешить другим пользователям звонить вам</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacySettings.allowCalls}
                        onChange={(e) => handlePrivacySettingsChange('allowCalls', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Оформление</h3>
                
                <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Тема</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'light', label: 'Светлая', icon: '☀️' },
                        { value: 'dark', label: 'Тёмная', icon: '🌙' },
                        { value: 'auto', label: 'Авто', icon: '🔄' }
                      ].map(theme => (
                        <button
                          key={theme.value}
                          onClick={() => handleAppearanceSettingsChange('theme', theme.value)}
                          className={`p-4 rounded-lg border-2 transition-colors ${
                            appearanceSettings.theme === theme.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-2xl mb-2">{theme.icon}</div>
                          <div className="text-sm font-medium">{theme.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Размер шрифта</h4>
                    <div className="space-y-2">
                      {[
                        { value: 'small', label: 'Маленький' },
                        { value: 'medium', label: 'Средний' },
                        { value: 'large', label: 'Большой' }
                      ].map(size => (
                        <label key={size.value} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="fontSize"
                            value={size.value}
                            checked={appearanceSettings.fontSize === size.value}
                            onChange={(e) => handleAppearanceSettingsChange('fontSize', e.target.value)}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="ml-3 text-gray-900">{size.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Компактный режим</h4>
                      <p className="text-sm text-gray-500">Уменьшить отступы между элементами интерфейса</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={appearanceSettings.compactMode}
                        onChange={(e) => handleAppearanceSettingsChange('compactMode', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'audio' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Настройки аудио</h3>
                
                <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Устройства</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Микрофон
                        </label>
                        <select
                          value={audioSettings.inputDevice}
                          onChange={(e) => handleAudioSettingsChange('inputDevice', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="default">По умолчанию</option>
                          {availableDevices
                            .filter(device => device.kind === 'audioinput')
                            .map(device => (
                              <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Микрофон ${device.deviceId.slice(0, 8)}...`}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Динамики
                        </label>
                        <select
                          value={audioSettings.outputDevice}
                          onChange={(e) => handleAudioSettingsChange('outputDevice', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="default">По умолчанию</option>
                          {availableDevices
                            .filter(device => device.kind === 'audiooutput')
                            .map(device => (
                              <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Динамики ${device.deviceId.slice(0, 8)}...`}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Громкость</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-medium text-gray-700">Микрофон</label>
                          <span className="text-sm text-gray-500">{audioSettings.micVolume}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={audioSettings.micVolume}
                          onChange={(e) => handleAudioSettingsChange('micVolume', parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-medium text-gray-700">Динамики</label>
                          <span className="text-sm text-gray-500">{audioSettings.speakerVolume}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={audioSettings.speakerVolume}
                          onChange={(e) => handleAudioSettingsChange('speakerVolume', parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Обработка звука</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-gray-900">Подавление эха</h5>
                          <p className="text-sm text-gray-500">Автоматически убирать эхо во время звонков</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={audioSettings.echoCancellation}
                            onChange={(e) => handleAudioSettingsChange('echoCancellation', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-gray-900">Подавление шума</h5>
                          <p className="text-sm text-gray-500">Автоматически убирать фоновые шумы</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={audioSettings.noiseSuppression}
                            onChange={(e) => handleAudioSettingsChange('noiseSuppression', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {pendingChanges && (
              <div className="fixed bottom-6 right-6">
                <div className="bg-white rounded-lg shadow-lg border p-4 flex items-center space-x-3">
                  <div className="text-sm text-gray-600">У вас есть несохранённые изменения</div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={saveSettings}
                  >
                    Сохранить
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {isConfirmModalOpen && (
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title="Выйти из аккаунта"
        >
          <div className="p-6">
            <p className="text-gray-600 mb-6">
              Вы уверены, что хотите выйти из аккаунта? Все несохранённые изменения будут потеряны.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsConfirmModalOpen(false)}
              >
                Отмена
              </Button>
              <Button
                variant="primary"
                onClick={confirmLogout}
                className="bg-red-600 hover:bg-red-700"
              >
                Выйти
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SettingsPage;