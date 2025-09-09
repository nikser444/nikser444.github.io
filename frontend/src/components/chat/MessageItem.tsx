import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Message } from '../../types/message';
import { User } from '../../types/user';
import Avatar from '../common/Avatar';
import { format, isToday, isYesterday } from 'date-fns';
import { ru } from 'date-fns/locale';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  isFirstFromUser?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isOwn,
  showAvatar = false,
  showTimestamp = true,
  isFirstFromUser = false
}) => {
  const { activeChat } = useSelector((state: RootState) => state.chat);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getSender = (): User | null => {
    if (!activeChat) return null;
    return activeChat.participants.find(p => p.id === message.senderId) || null;
  };

  const formatMessageTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `вчера в ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'dd.MM.yyyy HH:mm', { locale: ru });
    }
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <div className="break-words whitespace-pre-wrap">
            {message.content}
          </div>
        );
      
      case 'image':
        return (
          <div className="relative max-w-sm">
            {!imageLoaded && !imageError && (
              <div className="w-64 h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            {!imageError ? (
              <img
                src={message.fileUrl}
                alt="Изображение"
                className={`max-w-sm max-h-64 rounded-lg cursor-pointer transition-opacity ${
                  imageLoaded ? 'opacity-100' : 'opacity-0 absolute'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                onClick={() => {
                  // Открыть изображение в полном размере
                  window.open(message.fileUrl, '_blank');
                }}
              />
            ) : (
              <div className="w-64 h-48 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-sm">Ошибка загрузки</p>
                </div>
              </div>
            )}
            {message.content && (
              <div className="mt-2 text-sm">{message.content}</div>
            )}
          </div>
        );

      case 'file':
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg max-w-sm">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {message.fileName || 'Файл'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Нажмите для скачивания
              </p>
            </div>
            <button
              onClick={() => {
                if (message.fileUrl) {
                  const link = document.createElement('a');
                  link.href = message.fileUrl;
                  link.download = message.fileName || 'file';
                  link.click();
                }
              }}
              className="flex-shrink-0 text-blue-500 hover:text-blue-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          </div>
        );

      default:
        return (
          <div className="text-gray-500 dark:text-gray-400 italic">
            Неподдерживаемый тип сообщения
          </div>
        );
    }
  };

  const sender = getSender();

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div className={`flex max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
        {/* Аватар */}
        <div className={`flex-shrink-0 ${isOwn ? 'ml-2' : 'mr-2'}`}>
          {showAvatar && sender ? (
            <Avatar
              src={sender.avatar}
              alt={`${sender.firstName} ${sender.lastName}`}
              size="sm"
              fallback={sender.firstName.charAt(0).toUpperCase()}
            />
          ) : (
            <div className="w-8 h-8" />
          )}
        </div>

        {/* Содержимое сообщения */}
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Имя отправителя (для групповых чатов) */}
          {!isOwn && activeChat?.type === 'group' && isFirstFromUser && sender && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-3">
              {sender.firstName} {sender.lastName}
            </div>
          )}

          {/* Тело сообщения */}
          <div
            className={`px-4 py-2 rounded-lg relative ${
              isOwn
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
            } ${
              isFirstFromUser
                ? isOwn
                  ? 'rounded-br-sm'
                  : 'rounded-bl-sm'
                : ''
            }`}
          >
            {renderMessageContent()}
          </div>

          {/* Время и статус сообщения */}
          {showTimestamp && (
            <div className={`flex items-center mt-1 space-x-1 ${isOwn ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatMessageTime(message.createdAt)}
              </span>
              
              {/* Статус прочтения для своих сообщений */}
              {isOwn && (
                <div className="flex items-center">
                  {message.status === 'sent' && (
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {message.status === 'delivered' && (
                    <div className="flex">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <svg className="w-3 h-3 text-gray-400 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {message.status === 'read' && (
                    <div className="flex">
                      <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <svg className="w-3 h-3 text-blue-500 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Контекстное меню (появляется при наведении) */}
        <div className={`opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'mr-2' : 'ml-2'}`}>
          <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;