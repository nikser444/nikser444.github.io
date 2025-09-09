import React, { forwardRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}, ref) => {
  // Базовые стили
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg';
  
  // Стили размеров
  const sizeStyles = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };

  // Стили вариантов
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 active:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 dark:active:bg-gray-800',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500 active:bg-yellow-800',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 active:bg-green-800',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 active:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-800',
    outline: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500 active:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:active:bg-gray-700'
  };

  // Компонент загрузки
  const LoadingSpinner = () => (
    <svg 
      className="animate-spin -ml-1 mr-2 h-4 w-4" 
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
  );

  const combinedClassName = `
    ${baseStyles}
    ${sizeStyles[size]}
    ${variantStyles[variant]}
    ${fullWidth ? 'w-full' : ''}
    ${isLoading ? 'cursor-wait' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      ref={ref}
      className={combinedClassName}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <LoadingSpinner />}
      
      {!isLoading && leftIcon && (
        <span className="mr-2 flex-shrink-0">
          {leftIcon}
        </span>
      )}
      
      <span className={isLoading ? 'opacity-70' : ''}>
        {isLoading && loadingText ? loadingText : children}
      </span>
      
      {!isLoading && rightIcon && (
        <span className="ml-2 flex-shrink-0">
          {rightIcon}
        </span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

// Компонент группы кнопок
interface ButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
  className?: string;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  orientation = 'horizontal',
  size,
  variant,
  className = ''
}) => {
  const orientationStyles = {
    horizontal: 'inline-flex',
    vertical: 'inline-flex flex-col'
  };

  const clonedChildren = React.Children.map(children, (child, index) => {
    if (React.isValidElement(child) && child.type === Button) {
      const isFirst = index === 0;
      const isLast = index === React.Children.count(children) - 1;
      
      let additionalClassName = '';
      
      if (orientation === 'horizontal') {
        if (!isFirst && !isLast) {
          additionalClassName = 'rounded-none border-l-0';
        } else if (isFirst) {
          additionalClassName = 'rounded-r-none';
        } else if (isLast) {
          additionalClassName = 'rounded-l-none border-l-0';
        }
      } else {
        if (!isFirst && !isLast) {
          additionalClassName = 'rounded-none border-t-0';
        } else if (isFirst) {
          additionalClassName = 'rounded-b-none';
        } else if (isLast) {
          additionalClassName = 'rounded-t-none border-t-0';
        }
      }

      return React.cloneElement(child, {
        size: child.props.size || size,
        variant: child.props.variant || variant,
        className: `${child.props.className || ''} ${additionalClassName}`.trim()
      });
    }
    
    return child;
  });

  return (
    <div className={`${orientationStyles[orientation]} ${className}`}>
      {clonedChildren}
    </div>
  );
};

// Компонент иконки кнопки
interface IconButtonProps extends Omit<ButtonProps, 'children' | 'leftIcon' | 'rightIcon'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({
  icon,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7'
  };

  const paddingStyles = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
    xl: 'p-4'
  };

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={`${paddingStyles[size]} ${className}`}
      {...props}
    >
      <span className={iconSizes[size]}>
        {icon}
      </span>
    </Button>
  );
});

IconButton.displayName = 'IconButton';

export default Button;