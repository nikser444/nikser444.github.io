import React, { forwardRef, useState } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  inputSize?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'outlined',
  inputSize = 'md',
  fullWidth = false,
  isLoading = false,
  className = '',
  id,
  type = 'text',
  disabled,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  // Базовые стили
  const baseStyles = 'block transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Стили размеров
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-3 text-base'
  };

  // Стили вариантов
  const variantStyles = {
    default: 'border-0 border-b-2 border-gray-300 bg-transparent focus:border-blue-500 dark:border-gray-600 dark:focus:border-blue-400',
    filled: 'border border-transparent bg-gray-100 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-700 dark:focus:bg-gray-800 dark:focus:border-blue-400 dark:focus:ring-blue-800',
    outlined: 'border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:focus:border-blue-400 dark:focus:ring-blue-800'
  };

  // Стили при ошибке
  const errorStyles = error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-800'
    : '';

  // Обработка отступов для иконок
  const getInputPadding = () => {
    const basePadding = sizeStyles[inputSize];
    let leftPadding = '';
    let rightPadding = '';

    if (leftIcon) {
      leftPadding = inputSize === 'sm' ? 'pl-8' : inputSize === 'lg' ? 'pl-12' : 'pl-10';
    }

    if (rightIcon || type === 'password') {
      rightPadding = inputSize === 'sm' ? 'pr-8' : inputSize === 'lg' ? 'pr-12' : 'pr-10';
    }

    return `${basePadding} ${leftPadding} ${rightPadding}`.trim();
  };

  const combinedClassName = `
    ${baseStyles}
    ${getInputPadding()}
    ${variantStyles[variant]}
    ${errorStyles}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // Иконка показа/скрытия пароля
  const PasswordToggleIcon = () => (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      disabled={disabled}
    >
      {showPassword ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );

  // Спиннер загрузки
  const LoadingSpinner = () => (
    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
      <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  );

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <span className="text-gray-400 dark:text-gray-500">
              {leftIcon}
            </span>
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          id={inputId}
          type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
          className={combinedClassName}
          disabled={disabled || isLoading}
          {...props}
        />

        {/* Right Icons */}
        {isLoading && <LoadingSpinner />}
        {!isLoading && type === 'password' && <PasswordToggleIcon />}
        {!isLoading && type !== 'password' && rightIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-gray-400 dark:text-gray-500">
              {rightIcon}
            </span>
          </div>
        )}
      </div>

      {/* Helper Text or Error */}
      {(error || helperText) && (
        <p className={`mt-1 text-xs ${
          error 
            ? 'text-red-600 dark:text-red-400' 
            : 'text-gray-500 dark:text-gray-400'
        }`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Компонент текстовой области
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'outlined';
  textareaSize?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  helperText,
  variant = 'outlined',
  textareaSize = 'md',
  fullWidth = false,
  resize = 'vertical',
  className = '',
  id,
  rows = 3,
  ...props
}, ref) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  const baseStyles = 'block transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-3 text-base'
  };

  const variantStyles = {
    default: 'border-0 border-b-2 border-gray-300 bg-transparent focus:border-blue-500 dark:border-gray-600 dark:focus:border-blue-400',
    filled: 'border border-transparent bg-gray-100 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-700 dark:focus:bg-gray-800 dark:focus:border-blue-400 dark:focus:ring-blue-800',
    outlined: 'border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:focus:border-blue-400 dark:focus:ring-blue-800'
  };

  const errorStyles = error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-800'
    : '';

  const resizeStyles = {
    none: 'resize-none',
    both: 'resize',
    horizontal: 'resize-x',
    vertical: 'resize-y'
  };

  const combinedClassName = `
    ${baseStyles}
    ${sizeStyles[textareaSize]}
    ${variantStyles[variant]}
    ${errorStyles}
    ${resizeStyles[resize]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={combinedClassName}
        {...props}
      />

      {(error || helperText) && (
        <p className={`mt-1 text-xs ${
          error 
            ? 'text-red-600 dark:text-red-400' 
            : 'text-gray-500 dark:text-gray-400'
        }`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Input;