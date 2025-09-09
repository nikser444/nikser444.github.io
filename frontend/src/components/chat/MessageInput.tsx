import React, { useState, useRef, useCallback, useEffect } from 'react';
import EmojiPicker from './EmojiPicker';
import { debounce } from '../../utils/debounce';

interface MessageInputProps {
  onSendMessage: (content: string, type?: 'text' | 'image' | 'file', fileUrl?: string, fileName?: string) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  disabled = false,
  placeholder = "Введите сообщение..."
}) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isTypingRef = useRef(false);

  // Debounced функция для отправки статуса печатания
  const debouncedStopTyping = useCallback(
    debounce(() => {
      if (isTypingRef.current) {
        onTyping(false);
        isTypingRef.current = false;
      }
    }, 2000),
    [onTyping]
  );

  // Автоматическое изменение высоты textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 120; // максимальная высота
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Отправляем статус печатания
    if (value.trim() && !disabled) {
      if (!isTypingRef.current) {
        onTyping(true);
        isTypingRef.current = true;
      }
      debouncedStopTyping();
    } else if (isTypingRef.current) {
      onTyping(false);
      isTypingRef.current = false;
      debouncedStopTyping.cancel();
    }
  };

  const handleSendMessage = () => {
    if (!message.trim() || disabled) return;

    onSendMessage(message.trim());
    setMessage('');
    
    // Останавливаем индикатор печатания
    if (isTypingRef.current) {
      onTyping(false);
      isTypingRef.current = false;
      debouncedStopTyping.cancel();
    }

    // Сбрасываем высоту textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    if (disabled || isUploading) return;

    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      if (file.size > 10 * 1024 * 1024) { // 10MB ограничение
        alert(`Файл ${file.name} слишком большой. Максимальный размер: 10MB`);
        continue;
      }

      setIsUploading(true);
      try {
        // Создаем FormData для загрузки файла
        const formData = new FormData();
        formData.append('file', file);

        // Загружаем файл на сервер
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error('Ошибка загрузки файла');
        }

        const data = await response.json();
        
        // Определяем тип сообщения по типу файла
        const messageType = file.type.startsWith('image/') ? 'image' : 'file';
        
        // Отправляем сообщение с файлом
        onSendMessage('', messageType, data.fileUrl, file.name);
        
      } catch (error) {
        console.error('Ошибка загрузки файла:', error);
        alert('Произошла ошибка при загрузке файла');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
    // Очищаем input для возможности повторного выбора того же файла
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
      {/* Область для drag & drop */}
      {dragOver && (
        <div className="absolute inset-0 bg-blue-500/20 border-2 border-dashed border-blue-500 flex items-center justify-center z-10">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-blue-500 font-medium">Отпустите для загрузки файлов</p>
          </div>
        </div>
      )}

      <div
        className="flex items-end space-x-3"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Кнопка прикрепления файла */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Прикрепить файл"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        {/* Поле ввода */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={disabled ? "Подключение..." : placeholder}
            disabled={disabled}
            rows={1}
            className="w-full resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-12 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ maxHeight: '120px' }}
          />
          
          {/* Кнопка эмодзи */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled}
            className="absolute right-2 bottom-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded"
            title="Добавить эмодзи"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Эмодзи пикер */}
          {showEmojiPicker && (
            <div className="absolute bottom-full right-0 mb-2">
              <EmojiPicker
                onEmojiSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
              />
            </div>
          )}
        </div>

        {/* Кнопка отправки */}
        <button
          onClick={handleSendMessage}
          disabled={!message.trim() || disabled || isUploading}
          className="flex-shrink-0 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Отправить сообщение"
        >
          {isUploading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>

        {/* Скрытый input для файлов */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="*/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* Индикатор загрузки */}
      {isUploading && (
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Загрузка файла...
        </div>
      )}
    </div>
  );
};

export default MessageInput;