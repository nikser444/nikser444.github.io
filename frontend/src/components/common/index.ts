// Экспорт всех общих компонентов
export { default as Header } from './Header';
export { default as Sidebar } from './Sidebar';
export { default as Modal, ConfirmModal } from './Modal';
export { default as Button, ButtonGroup, IconButton } from './Button';
export { default as Input, Textarea } from './Input';
export { default as Avatar, AvatarGroup, AvatarWithName } from './Avatar';
export { default as Tooltip } from './Tooltip';
export { default as LoadingSpinner, Skeleton, DotsLoader } from './LoadingSpinner';

// Экспорт типов для компонентов (если нужно)
export type { ButtonProps } from './Button';
export type { InputProps, TextareaProps } from './Input';
export type { AvatarProps, AvatarGroupProps, AvatarWithNameProps } from './Avatar';
export type { TooltipProps } from './Tooltip';
export type { LoadingSpinnerProps, SkeletonProps, DotsLoaderProps } from './LoadingSpinner';