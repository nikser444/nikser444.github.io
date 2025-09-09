import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { updateUser } from '../../store/userSlice';
import { userService } from '../../services/userService';
import { Button, Input, LoadingSpinner } from '../common';
import { AvatarUpload } from './AvatarUpload';
import { StatusSettings } from './StatusSettings';
import { User } from '../../types/user';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bio?: string;
}

export const ProfileSettings: React.FC = () => {
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector((state: RootState) => state.user);
  
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<ProfileFormData>>({});

  // Заполняем форму данными пользователя при загрузке
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: Partial<ProfileFormData> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Имя обязательно';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Фамилия обязательна';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Некорректный email';
    }

    if (formData.phone && !/^[\+]?[0-9\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Некорректный номер телефона';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Очищаем ошибку при изменении поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const updatedUser = await userService.updateProfile(formData);
      dispatch(updateUser(updatedUser));
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      // Здесь можно добавить toast уведомление об ошибке
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
      });
    }
    setIsEditing(false);
    setErrors({});
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Настройки профиля
        </h2>
        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            variant="outline"
            className="px-4 py-2"
          >
            Редактировать
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Аватар и статус */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            <AvatarUpload />
            <StatusSettings />
          </div>
        </div>

        {/* Основная информация */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Имя *
                </label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  disabled={!isEditing}
                  error={errors.firstName}
                  placeholder="Введите имя"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Фамилия *
                </label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  disabled={!isEditing}
                  error={errors.lastName}
                  placeholder="Введите фамилию"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={!isEditing}
                error={errors.email}
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Телефон
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!isEditing}
                error={errors.phone}
                placeholder="+7 (xxx) xxx-xx-xx"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                О себе
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                disabled={!isEditing}
                rows={4}
                className={`
                  w-full px-3 py-2 border rounded-lg resize-none
                  ${!isEditing 
                    ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' 
                    : 'bg-white dark:bg-gray-800'
                  }
                  border-gray-300 dark:border-gray-600
                  text-gray-900 dark:text-white
                  placeholder-gray-500 dark:placeholder-gray-400
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  transition-colors duration-200
                `}
                placeholder="Расскажите о себе..."
                maxLength={500}
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.bio?.length || 0}/500 символов
              </div>
            </div>

            {/* Кнопки управления */}
            {isEditing && (
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  disabled={isSaving}
                >
                  Отменить
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="min-w-24"
                >
                  {isSaving ? <LoadingSpinner size="sm" /> : 'Сохранить'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Дополнительные настройки */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Приватность и безопасность
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <div className="font-medium text-gray-800 dark:text-white">
                Видимость онлайн статуса
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Показывать другим пользователям когда вы онлайн
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                defaultChecked
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <div className="font-medium text-gray-800 dark:text-white">
                Уведомления о прочтении
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Отправлять уведомления о прочтении сообщений
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                defaultChecked
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};