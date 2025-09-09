import React from 'react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'text-blue-600',
  className = '',
  text,
  fullScreen = false
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const spinner = (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center space-y-2">
        <svg
          className={`animate-spin ${sizeClasses[size]} ${color}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        
        {text && (
          <p className={`${textSizeClasses[size]} text-gray-600 dark:text-gray-400`}>
            {text}
          </p>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75">
        {spinner}
      </div>
    );
  }

  return spinner;
};

// Компонент скелетона для загрузки контента
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  animation?: 'pulse' | 'wave' | 'none';
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  className = '',
  variant = 'rectangular',
  animation = 'pulse',
  lines = 1
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  
  const variantClasses = {
    rectangular: 'rounded-md',
    circular: 'rounded-full',
    text: 'rounded-sm'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse', // Можно добавить кастомную анимацию волны
    none: ''
  };

  const getStyle = () => {
    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;
    return style;
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`
              ${baseClasses}
              ${variantClasses[variant]}
              ${animationClasses[animation]}
              ${index === lines - 1 ? 'w-3/4' : 'w-full'}
              h-4
            `}
            style={index === 0 ? getStyle() : undefined}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${animationClasses[animation]}
        ${variant === 'text' ? 'h-4' : ''}
        ${className}
      `}
      style={getStyle()}
    />
  );
};

// Компонент точек загрузки
interface DotsLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export const DotsLoader: React.FC<DotsLoaderProps> = ({
  size = 'md',
  color = 'bg-blue-600',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  const spacingClasses = {
    sm: 'space-x-1',
    md: 'space-x-1.5',
    lg: 'space-x-2'
  };

  return (
    <div className={`flex items-center ${spacingClasses[size]} ${className}`}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`
            ${sizeClasses[size]}
            ${color}
            rounded-full
            animate-pulse
          `}
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: '0.8s'
          }}
        />
      ))}
    </div>
  );
};

export default LoadingSpinner;