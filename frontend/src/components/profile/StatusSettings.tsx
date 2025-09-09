import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ChevronDown, Check, Circle } from 'lucide-react';
import { RootState } from '../../store';
import { updateUser } from '../../store/userSlice';
import { userService } from '../../services/userService';
import { UserStatus } from '../../types/user';
import { Button, LoadingSpinner } from '../common';

interface StatusOption {
  value: UserStatus;
  label: string;
  color: string;
  icon: React.ReactNode;
  description: string;
}

const statusOptions: StatusOption[] = [
  {
    value: 'online',
    label: 'В сети',
    color: 'text-green-500',
    icon: <Circle className="w-3 h-3 fill-current" />,
    description: 'Вы активны и доступны для общения'
  },
  {
    value: 'away',
    label: 'Отошёл',
    color: 'text-yellow-500',
    icon: <Circle className="w-3 h-3 fill-current" />,
    description: 'Вы временно недоступны'
  },
  {
    value: 'busy',
    label: 'Занят',
    color: 'text-red-500',
    icon: <Circle className="w-3 h-3 fill-current" />,
    description: 'Не беспокоить, занят важными делами'
  },
  {
    value: 'invisible',
    label: 'Невидимый',
    color: 'text-gray-500',
    icon: <Circle className="w-3 h-3 fill-current" />,
    description: 'Вы онлайн, но другие видят вас оффлайн'
  }
];

export const StatusSettings: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.user);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user?.statusMessage) {
      setCustomMessage(user.statusMessage);
    }
  }, [user?.statusMessage]);

  const currentStatus = statusOptions.find(option => option.value === user?.status) || statusOptions[0];

  const handleStatusChange = async (newStatus: UserStatus) => {
    setIsUpdating(true);
    try {
      const updatedUser = await userService.updateStatus({ status: newStatus });
      dispatch(updateUser(updatedUser));
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMessageUpdate = async () => {
    setIsUpdating(true);
    try {
      const updatedUser = await userService.updateStatus({ 
        statusMessage: customMessage.trim() || null 
      });
      dispatch(updateUser(updatedUser));
      setIsEditingMessage(false);
    } catch (error) {
      console.error('Error updating status message:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMessageCancel = () => {
    setCustomMessage(user?.statusMessage || '');
    setIsEditingMessage(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        Статус
      </h3>

      {/* Текущий статус */}
      <div className="space-y-4">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={isUpdating}
            className={`
              w-full flex items-center justify-between p-3 rounded-lg border
              ${isDropdownOpen 
                ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20' 
                : 'border-gray-300 dark:border-gray-600'
              }
              bg-white dark:bg-gray-700
              hover:border-blue-400 dark:hover:border-blue-500
              transition-all duration-200
              ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <div className="flex items-center space-x-3">
              <span className={currentStatus.color}>
                {currentStatus.icon}
              </span>
              <div className="text-left">
                <div className="font-medium text-gray-800 dark:text-white">
                  {currentStatus.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {currentStatus.description}
                </div>
              </div>
            </div>
            <ChevronDown 
              className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                isDropdownOpen ? 'transform rotate-180' : ''
              }`} 
            />
          </button>

          {/* Выпадающий список статусов */}
          {isDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  disabled={isUpdating}
                  className={`
                    w-full flex items-center justify-between p-3 text-left
                    hover:bg-gray-50 dark:hover:bg-gray-600
                    ${option.value === user?.status ? 'bg-blue-50 dark:bg-blue-900' : ''}
                    first:rounded-t-lg last:rounded-b-lg
                    transition-colors duration-200
                    ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <span className={option.color}>
                      {option.icon}
                    </span>
                    <div>
                      <div className="font-medium text-gray-800 dark:text-white">
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {option.description}
                      </div>
                    </div>
                  </div>
                  {option.value === user?.status && (
                    <Check className="w-4 h-4 text-blue-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Кастомное сообщение статуса */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Сообщение статуса
          </label>
          
          {!isEditingMessage ? (
            <div
              onClick={() => setIsEditingMessage(true)}
              className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors duration-200"
            >
              {user?.statusMessage ? (
                <span className="text-gray-800 dark:text-white">
                  {user.statusMessage}
                </span>
              ) : (
                <span className="text-gray-500 dark:text-gray-400 italic">
                  Нажмите, чтобы добавить сообщение статуса...
                </span>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Введите сообщение статуса..."
                maxLength={100}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors duration-200"
                autoFocus
              />
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {customMessage.length}/100 символов
                </span>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={handleMessageCancel}
                    variant="outline"
                    size="sm"
                    disabled={isUpdating}
                  >
                    Отменить
                  </Button>
                  <Button
                    onClick={handleMessageUpdate}
                    size="sm"
                    disabled={isUpdating}
                    className="min-w-20"
                  >
                    {isUpdating ? <LoadingSpinner size="sm" /> : 'Сохранить'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Дополнительные настройки статуса */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800 dark:text-white text-sm">
                Автоматический статус "Отошёл"
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Установить статус "Отошёл" через 10 минут бездействия
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                defaultChecked
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800 dark:text-white text-sm">
                Показывать время последней активности
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Друзья смогут видеть когда вы были в сети последний раз
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                defaultChecked
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};