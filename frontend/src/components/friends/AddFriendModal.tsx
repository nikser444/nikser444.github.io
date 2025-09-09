import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { sendFriendRequest, searchUsers } from '../../../store/friendSlice';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Avatar } from '../common/Avatar';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Search, UserPlus, Check, Clock } from 'lucide-react';
import { User } from '../../../types/user';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddFriendModal: React.FC<AddFriendModalProps> = ({
  isOpen,
  onClose,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { searchResults, isLoading, sentRequests } = useSelector(
    (state: RootState) => state.friends
  );
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBy, setSearchBy] = useState<'email' | 'username'>('email');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      await dispatch(searchUsers({ 
        query: searchQuery.trim(), 
        type: searchBy 
      })).unwrap();
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (userId: string) => {
    try {
      await dispatch(sendFriendRequest(userId)).unwrap();
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchBy('email');
    onClose();
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const canSearch = searchQuery.trim().length > 0 && 
    (searchBy === 'username' || isValidEmail(searchQuery));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Добавить друга"
      size="md"
    >
      <div className="space-y-6">
        {/* Переключатель типа поиска */}
        <div className="flex space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setSearchBy('email')}
            className={`
              flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors
              ${searchBy === 'email'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }
            `}
          >
            По email
          </button>
          <button
            onClick={() => setSearchBy('username')}
            className={`
              flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors
              ${searchBy === 'username'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }
            `}
          >
            По имени
          </button>
        </div>

        {/* Поле поиска */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {searchBy === 'email' ? 'Email адрес' : 'Имя пользователя'}
          </label>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                type={searchBy === 'email' ? 'email' : 'text'}
                placeholder={
                  searchBy === 'email' 
                    ? 'example@email.com' 
                    : 'Имя пользователя'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && canSearch) {
                    handleSearch();
                  }
                }}
                error={searchBy === 'email' && searchQuery && !isValidEmail(searchQuery)}
              />
              {searchBy === 'email' && searchQuery && !isValidEmail(searchQuery) && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  Введите корректный email адрес
                </p>
              )}
            </div>
            <Button
              variant="primary"
              onClick={handleSearch}
              disabled={!canSearch || isSearching}
              className="flex items-center space-x-2 px-4"
            >
              {isSearching ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Найти</span>
            </Button>
          </div>
        </div>

        {/* Подсказка */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            💡 {searchBy === 'email' 
              ? 'Введите точный email адрес пользователя, которого хотите добавить в друзья'
              : 'Введите имя пользователя для поиска (минимум 3 символа)'
            }
          </p>
        </div>

        {/* Результаты поиска */}
        {searchResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Результаты поиска ({searchResults.length})
            </h3>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {searchResults.map((user: User) => {
                const requestSent = sentRequests.includes(user.id);
                
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar
                        src={user.avatar}
                        alt={user.username}
                        size="sm"
                        fallback={user.username.charAt(0).toUpperCase()}
                      />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {user.username}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    
                    {requestSent ? (
                      <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                        <Check className="w-4 h-4" />
                        <span className="text-sm">Заявка отправлена</span>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSendRequest(user.id)}
                        className="flex items-center space-x-1"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Добавить</span>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Состояние загрузки */}
        {isLoading && searchQuery && (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Поиск пользователей...
            </span>
          </div>
        )}

        {/* Пустой результат */}
        {!isLoading && searchQuery && searchResults.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-500 mb-2">
              <Search className="w-12 h-12 mx-auto mb-4" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Пользователи не найдены
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Попробуйте изменить запрос поиска или проверьте правильность данных
            </p>
          </div>
        )}

        {/* Кнопки управления */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={handleClose}>
            Закрыть
          </Button>
        </div>
      </div>
    </Modal>
  );
};