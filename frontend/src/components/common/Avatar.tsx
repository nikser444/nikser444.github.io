import React, { useState, useMemo } from 'react';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  status?: 'online' | 'offline' | 'away' | 'busy' | null;
  showStatus?: boolean;
  className?: string;
  onClick?: () => void;
  fallbackColor?: string;
  isClickable?: boolean;
  shape?: 'circle' | 'square';
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  status,
  showStatus = true,
  className = '',
  onClick,
  fallbackColor,
  isClickable = false,
  shape = 'circle'
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Размеры аватара
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20'
  };

  // Размеры текста для инициалов
  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl'
  };

  // Размеры статуса
  const statusSizeClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5'
  };

  // Позиция статуса
  const statusPositionClasses = {
    xs: '-bottom-0.5 -right-0.5',
    sm: '-bottom-0.5 -right-0.5',
    md: '-bottom-1 -right-1',
    lg: '-bottom-1 -right-1',
    xl: '-bottom-1.5 -right-1.5',
    '2xl': '-bottom-2 -right-2'
  };

  // Цвета статуса
  const statusColors = {
    online: 'bg-green-500 border-green-500',
    offline: 'bg-gray-400 border-gray-400',
    away: 'bg-yellow-500 border-yellow-500',
    busy: 'bg-red-500 border-red-500'
  };

  // Форма аватара
  const shapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-lg'
  };

  // Генерация инициалов
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Генерация цвета фона на основе имени
  const generateBackgroundColor = useMemo(() => {
    if (fallbackColor) return fallbackColor;
    
    const colors = [
      'bg-red-500',
      'bg-yellow-500',
      'bg-green-500',
      'bg-blue-500',
      'bg-indigo-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-gray-500'
    ];
    
    let hash = 0;
    for (let i = 0; i < alt.length; i++) {
      hash = alt.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }, [alt, fallbackColor]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  const baseClasses = `
    relative inline-flex items-center justify-center overflow-hidden
    ${sizeClasses[size]}
    ${shapeClasses[shape]}
    ${isClickable || onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const initials = getInitials(alt);

  return (
    <div 
      className={baseClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyPress={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {/* Изображение */}
      {src && !imageError && (
        <>
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover ${shapeClasses[shape]} ${
              isLoading ? 'opacity-0' : 'opacity-100'
            } transition-opacity duration-200`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          
          {/* Скелетон загрузки */}
          {isLoading && (
            <div className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse ${shapeClasses[shape]}`} />
          )}
        </>
      )}

      {/* Fallback с инициалами */}
      {(!src || imageError) && (
        <div className={`
          w-full h-full flex items-center justify-center text-white font-medium
          ${generateBackgroundColor}
          ${textSizeClasses[size]}
        `}>
          {initials}
        </div>
      )}

      {/* Индикатор статуса */}
      {showStatus && status && (
        <span
          className={`
            absolute border-2 border-white dark:border-gray-800 rounded-full
            ${statusSizeClasses[size]}
            ${statusPositionClasses[size]}
            ${statusColors[status]}
          `}
          title={`Статус: ${status}`}
        />
      )}
    </div>
  );
};

// Компонент группы аватаров
interface AvatarGroupProps {
  avatars: Array<{
    src?: string | null;
    alt: string;
    status?: AvatarProps['status'];
  }>;
  size?: AvatarProps['size'];
  max?: number;
  spacing?: 'tight' | 'normal' | 'loose';
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  size = 'md',
  max = 5,
  spacing = 'normal',
  className = ''
}) => {
  const spacingClasses = {
    tight: '-space-x-1',
    normal: '-space-x-2',
    loose: '-space-x-1'
  };

  const visibleAvatars = avatars.slice(0, max);
  const hiddenCount = Math.max(0, avatars.length - max);

  return (
    <div className={`flex items-center ${spacingClasses[spacing]} ${className}`}>
      {visibleAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          alt={avatar.alt}
          size={size}
          status={avatar.status}
          className="ring-2 ring-white dark:ring-gray-800"
        />
      ))}
      
      {hiddenCount > 0 && (
        <div
          className={`
            relative inline-flex items-center justify-center overflow-hidden
            bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400
            font-medium rounded-full ring-2 ring-white dark:ring-gray-800
            ${sizeClasses[size]}
            ${textSizeClasses[size]}
          `}
          title={`Еще ${hiddenCount} пользователей`}
        >
          +{hiddenCount}
        </div>
      )}
    </div>
  );
};

// Компонент аватара с именем
interface AvatarWithNameProps extends AvatarProps {
  name: string;
  subtitle?: string;
  nameClassName?: string;
  subtitleClassName?: string;
  layout?: 'horizontal' | 'vertical';
}

export const AvatarWithName: React.FC<AvatarWithNameProps> = ({
  name,
  subtitle,
  nameClassName = '',
  subtitleClassName = '',
  layout = 'horizontal',
  ...avatarProps
}) => {
  const layoutClasses = {
    horizontal: 'flex items-center space-x-3',
    vertical: 'flex flex-col items-center space-y-2'
  };

  const textAlignClasses = {
    horizontal: 'text-left',
    vertical: 'text-center'
  };

  return (
    <div className={layoutClasses[layout]}>
      <Avatar {...avatarProps} alt={name} />
      
      <div className={`min-w-0 flex-1 ${textAlignClasses[layout]}`}>
        <p className={`text-sm font-medium text-gray-900 dark:text-white truncate ${nameClassName}`}>
          {name}
        </p>
        {subtitle && (
          <p className={`text-xs text-gray-500 dark:text-gray-400 truncate ${subtitleClassName}`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default Avatar;