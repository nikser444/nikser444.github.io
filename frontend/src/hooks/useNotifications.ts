import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import {
  addNotification,
  removeNotification,
  markAsRead,
  markAllAsRead,
  clearNotifications,
  setNotificationSettings
} from '../store/notificationSlice';
import { notificationService } from '../services/notificationService';
import { useSocket } from './useSocket';
import type { Notification, NotificationSettings, NotificationType } from '../types/notification';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  settings: NotificationSettings;
  isPermissionGranted: boolean;
  requestPermission: () => Promise<boolean>;
  showNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  dismissNotification: (notificationId: string) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<boolean>;
  playNotificationSound: (type: NotificationType) => void;
}

// Звуки уведомлений
const NOTIFICATION_SOUNDS = {
  message: '/sounds/message.mp3',
  call: '/sounds/call.mp3',
  friend_request: '/sounds/notification.mp3',
  system: '/sounds/system.mp3'
};

export const useNotifications = (): UseNotificationsReturn => {
  const dispatch = useDispatch();
  const { socket } = useSocket();
  const { notifications, settings } = useSelector((state: RootState) => state.notification);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Проверка разрешения на уведомления
  const checkPermission = useCallback(() => {
    if ('Notification' in window) {
      setIsPermissionGranted(Notification.permission === 'granted');
    }
  }, []);

  // Запрос разрешения на уведомления
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('Этот браузер не поддерживает уведомления');
      return false;
    }

    if (Notification.permission === 'granted') {
      setIsPermissionGranted(true);
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setIsPermissionGranted(granted);
      return granted;
    } catch (error) {
      console.error('Ошибка запроса разрешения на уведомления:', error);
      return false;
    }
  }, []);

  // Воспроизведение звука уведомления
  const playNotificationSound = useCallback((type: NotificationType) => {
    if (!settings.soundEnabled) return;

    const soundUrl = NOTIFICATION_SOUNDS[type] || NOTIFICATION_SOUNDS.system;
    
    if (audioRef.current) {
      audioRef.current.src = soundUrl;
      audioRef.current.volume = settings.volume;
      audioRef.current.play().catch(console.error);
    }
  }, [settings.soundEnabled, settings.volume]);

  // Показ системного уведомления
  const showSystemNotification = useCallback((notification: Notification) => {
    if (!isPermissionGranted || !settings.enabled) return;

    // Проверяем настройки для конкретного типа уведомлений
    const typeSettings = settings.types[notification.type];
    if (!typeSettings?.enabled) return;

    // Проверяем DND режим
    if (settings.doNotDisturb) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const startTime = settings.doNotDisturbStart;
      const endTime = settings.doNotDisturbEnd;
      
      if (startTime < endTime) {
        // Обычный случай: например, с 22:00 до 08:00
        if (currentTime >= startTime && currentTime <= endTime) return;
      } else {
        // Случай через полночь: например, с 22:00 до 08:00
        if (currentTime >= startTime || currentTime <= endTime) return;
      }
    }

    try {
      const systemNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/icons/logo.png',
        badge: '/icons/badge.png',
        tag: notification.id,
        requireInteraction: typeSettings.priority === 'high',
        silent: !settings.soundEnabled
      });

      // Автоматическое закрытие через установленное время
      if (typeSettings.autoClose && typeSettings.duration > 0) {
        setTimeout(() => {
          systemNotification.close();
        }, typeSettings.duration * 1000);
      }

      // Обработка клика по уведомлению
      systemNotification.onclick = () => {
        window.focus();
        
        // Дополнительная логика в зависимости от типа уведомления
        if (notification.chatId) {
          // Переход к чату
          window.location.hash = `/chat/${notification.chatId}`;
        } else if (notification.callId) {
          // Переход к звонку
          window.location.hash = `/call/${notification.callId}`;
        }
        
        systemNotification.close();
      };

    } catch (error) {
      console.error('Ошибка показа системного уведомления:', error);
    }
  }, [isPermissionGranted, settings]);

  // Добавление уведомления
  const showNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const notification: Notification = {
      ...notificationData,
      id: Date.now().toString() + Math.random().toString(36),
      timestamp: new Date().toISOString(),
      read: false
    };

    // Добавляем в store
    dispatch(addNotification(notification));

    // Показываем системное уведомление
    showSystemNotification(notification);

    // Воспроизводим звук
    playNotificationSound(notification.type);

    // Отправляем на сервер для синхронизации
    if (socket) {
      socket.emit('notification:add', notification);
    }
  }, [dispatch, showSystemNotification, playNotificationSound, socket]);

  // Удаление уведомления
  const dismissNotification = useCallback((notificationId: string) => {
    dispatch(removeNotification(notificationId));
    
    // Уведомляем сервер
    if (socket) {
      socket.emit('notification:dismiss', { notificationId });
    }
  }, [dispatch, socket]);

  // Отметка уведомления как прочитанного
  const markNotificationAsRead = useCallback((notificationId: string) => {
    dispatch(markAsRead(notificationId));
    
    // Уведомляем сервер
    if (socket) {
      socket.emit('notification:read', { notificationId });
    }
  }, [dispatch, socket]);

  // Отметка всех уведомлений как прочитанных
  const markAllNotificationsAsRead = useCallback(() => {
    dispatch(markAllAsRead());
    
    // Уведомляем сервер
    if (socket) {
      socket.emit('notification:read_all');
    }
  }, [dispatch, socket]);

  // Очистка всех уведомлений
  const clearAllNotifications = useCallback(() => {
    dispatch(clearNotifications());
    
    // Уведомляем сервер
    if (socket) {
      socket.emit('notification:clear_all');
    }
  }, [dispatch, socket]);

  // Обновление настроек уведомлений
  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>): Promise<boolean> => {
    try {
      const response = await notificationService.updateSettings(newSettings);
      
      if (response.success) {
        dispatch(setNotificationSettings({
          ...settings,
          ...newSettings
        }));
        return true;
      } else {
        console.error('Ошибка обновления настроек уведомлений:', response.message);
        return false;
      }
    } catch (error: any) {
      console.error('Произошла ошибка при обновлении настроек уведомлений:', error);
      return false;
    }
  }, [dispatch, settings]);

  // Загрузка настроек при инициализации
  const loadSettings = useCallback(async () => {
    try {
      const response = await notificationService.getSettings();
      
      if (response.success) {
        dispatch(setNotificationSettings(response.settings));
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек уведомлений:', error);
    }
  }, [dispatch]);

  // WebSocket обработчики
  useEffect(() => {
    if (!socket) return;

    // Получение нового уведомления
    socket.on('notification:new', (notification: Notification) => {
      dispatch(addNotification(notification));
      showSystemNotification(notification);
      playNotificationSound(notification.type);
    });

    // Уведомление прочитано на другом устройстве
    socket.on('notification:read', (data: { notificationId: string }) => {
      dispatch(markAsRead(data.notificationId));
    });

    // Все уведомления прочитаны на другом устройстве
    socket.on('notification:read_all', () => {
      dispatch(markAllAsRead());
    });

    // Уведомление удалено на другом устройстве
    socket.on('notification:dismissed', (data: { notificationId: string }) => {
      dispatch(removeNotification(data.notificationId));
    });

    // Все уведомления очищены на другом устройстве
    socket.on('notification:cleared_all', () => {
      dispatch(clearNotifications());
    });

    return () => {
      socket.off('notification:new');
      socket.off('notification:read');
      socket.off('notification:read_all');
      socket.off('notification:dismissed');
      socket.off('notification:cleared_all');
    };
  }, [socket, dispatch, showSystemNotification, playNotificationSound]);

  // Инициализация при монтировании
  useEffect(() => {
    checkPermission();
    
    if (user) {
      loadSettings();
    }

    // Создаем audio элемент для звуков
    audioRef.current = new Audio();
    audioRef.current.preload = 'auto';

    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, [user, checkPermission, loadSettings]);

  // Обновление разрешений при изменении состояния
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkPermission();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkPermission]);

  // Автоматическое удаление старых уведомлений
  useEffect(() => {
    if (!settings.autoCleanup) return;

    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const maxAge = settings.maxAge * 24 * 60 * 60 * 1000; // дни в миллисекунды

      notifications.forEach(notification => {
        const notificationAge = now - new Date(notification.timestamp).getTime();
        if (notificationAge > maxAge) {
          dispatch(removeNotification(notification.id));
        }
      });
    }, 60 * 60 * 1000); // проверяем каждый час

    return () => clearInterval(cleanupInterval);
  }, [settings.autoCleanup, settings.maxAge, notifications, dispatch]);

  // Подсчет непрочитанных уведомлений
  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    settings,
    isPermissionGranted,
    requestPermission,
    showNotification,
    dismissNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    updateSettings,
    playNotificationSound
  };
};