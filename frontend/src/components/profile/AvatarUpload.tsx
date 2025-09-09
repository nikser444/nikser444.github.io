import React, { useState, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Camera, X, Upload, User, Trash2 } from 'lucide-react';
import { RootState } from '../../store';
import { updateUser } from '../../store/userSlice';
import { userService } from '../../services/userService';
import { Button, LoadingSpinner, Avatar } from '../common';

interface AvatarUploadProps {
  size?: 'sm' | 'md' | 'lg';
  showControls?: boolean;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({ 
  size = 'lg', 
  showControls = true 
}) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.user);
  
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24', 
    lg: 'w-32 h-32'
  };

  const validateFile = (file: File): string | null => {
    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return 'Разрешены только файлы форматов: JPEG, PNG, WebP, GIF';
    }

    // Проверка размера файла (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'Размер файла не должен превышать 5MB';
    }

    return null;
  };

  const handleFileSelect = useCallback(async (file: File) => {
    const error = validateFile(file);
    if (error) {
      alert(error); // В реальном приложении лучше использовать toast
      return;
    }

    // Создаем превью
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
      setIsModalOpen(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const uploadAvatar = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const updatedUser = await userService.updateAvatar(formData);
      dispatch(updateUser(updatedUser));
      
      setPreviewUrl(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Ошибка загрузки аватара. Попробуйте снова.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeAvatar = async () => {
    setIsUploading(true);
    try {
      const updatedUser = await userService.removeAvatar();
      dispatch(updateUser(updatedUser));
    } catch (error) {
      console.error('Error removing avatar:', error);
      alert('Ошибка удаления аватара. Попробуйте снова.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Очищаем input для возможности повторной загрузки того же файла
    e.target.value = '';
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const confirmUpload = () => {
    if (previewUrl) {
      // Конвертируем data URL обратно в File
      fetch(previewUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
          uploadAvatar(file);
        });
    }
  };

  return (
    <>
      <div className="flex flex-col items-center space-y-4">
        {/* Основной аватар */}
        <div 
          ref={dropZoneRef}
          className={`
            relative ${sizeClasses[size]} rounded-full overflow-hidden
            ${dragActive ? 'ring-4 ring-blue-500 ring-opacity-50' : ''}
            ${showControls ? 'cursor-pointer group' : ''}
            transition-all duration-200
          `}
          onDragEnter={showControls ? handleDrag : undefined}
          onDragLeave={showControls ? handleDrag : undefined}
          onDragOver={showControls ? handleDrag : undefined}
          onDrop={showControls ? handleDrop : undefined}
          onClick={showControls ? openFileDialog : undefined}
        >
          <Avatar 
            src={user?.avatar} 
            alt={`${user?.firstName} ${user?.lastName}`}
            size={size}
            className="w-full h-full"
          />
          
          {/* Оверлей при наведении */}
          {showControls && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Camera className="w-6 h-6 text-white" />
            </div>
          )}
          
          {/* Индикатор загрузки */}
          {isUploading && (
            <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center">
              <LoadingSpinner size="sm" />
            </div>
          )}
        </div>

        {/* Кнопки управления */}
        {showControls && (
          <div className="flex space-x-2">
            <Button
              onClick={openFileDialog}
              variant="outline"
              size="sm"
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Загрузить
            </Button>
            
            {user?.avatar && (
              <Button
                onClick={removeAvatar}
                variant="outline"
                size="sm"
                disabled={isUploading}
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Удалить
              </Button>
            )}
          </div>
        )}

        {/* Скрытый input для файлов */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Подсказка для drag & drop */}
        {showControls && dragActive && (
          <div className="text-sm text-blue-600 dark:text-blue-400">
            Отпустите файл для загрузки
          </div>
        )}
      </div>

      {/* Модальное окно предварительного просмотра */}
      {isModalOpen && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Предварительный просмотр
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setPreviewUrl(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                disabled={isUploading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Превью изображения */}
            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 rounded-full overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Предварительный просмотр аватара"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => {
                  setIsModalOpen(false);
                  setPreviewUrl(null);
                }}
                variant="outline"
                disabled={isUploading}
              >
                Отменить
              </Button>
              <Button
                onClick={confirmUpload}
                disabled={isUploading}
                className="min-w-24"
              >
                {isUploading ? <LoadingSpinner size="sm" /> : 'Загрузить'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};