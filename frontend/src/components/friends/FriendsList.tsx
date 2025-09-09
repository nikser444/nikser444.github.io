import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { fetchFriends, setSelectedFriend } from '../../../store/friendSlice';
import { FriendItem } from './FriendItem';
import { AddFriendModal } from './AddFriendModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { UserPlus, Search, Users } from 'lucide-react';
import { Friend, FriendStatus } from '../../../types/user';

export const FriendsList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    friends, 
    isLoading, 
    error, 
    selectedFriend,
    onlineFriends 
  } = useSelector((state: RootState) => state.friends);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline'>('all');

  useEffect(() => {
    dispatch(fetchFriends());
  }, [dispatch]);

  const filteredFriends = friends.filter((friend: Friend) => {
    const matchesSearch = friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         friend.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === 'online') {
      return matchesSearch && onlineFriends.includes(friend.id);
    }
    if (filterStatus === 'offline') {
      return matchesSearch && !onlineFriends.includes(friend.id);
    }
    
    return matchesSearch;
  });

  const handleFriendSelect = (friend: Friend) => {
    dispatch(setSelectedFriend(friend));
  };

  const handleStartChat = (friendId: string) => {
    // Логика для начала чата с другом
    // Должна интегрироваться с chatService
    console.log('Starting chat with friend:', friendId);
  };

  if (isLoading && friends.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Заголовок */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Друзья ({friends.length})
          </h2>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-1"
        >
          <UserPlus className="w-4 h-4" />
          <span>Добавить</span>
        </Button>
      </div>

      {/* Поиск и фильтры */}
      <div className="p-4 space-y-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Поиск друзей..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant={filterStatus === 'all' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterStatus('all')}
          >
            Все
          </Button>
          <Button
            variant={filterStatus === 'online' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterStatus('online')}
          >
            Онлайн ({onlineFriends.length})
          </Button>
          <Button
            variant={filterStatus === 'offline' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterStatus('offline')}
          >
            Оффлайн
          </Button>
        </div>
      </div>

      {/* Список друзей */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-4 text-center text-red-600 dark:text-red-400">
            Ошибка загрузки друзей: {error}
          </div>
        )}
        
        {filteredFriends.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Users className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'Друзья не найдены' : 'Список друзей пуст'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery 
                ? 'Попробуйте изменить запрос поиска' 
                : 'Добавьте первого друга, чтобы начать общение'
              }
            </p>
            {!searchQuery && (
              <Button
                variant="primary"
                onClick={() => setIsAddModalOpen(true)}
              >
                Добавить друга
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredFriends.map((friend) => (
              <FriendItem
                key={friend.id}
                friend={friend}
                isSelected={selectedFriend?.id === friend.id}
                isOnline={onlineFriends.includes(friend.id)}
                onClick={() => handleFriendSelect(friend)}
                onStartChat={() => handleStartChat(friend.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно добавления друга */}
      <AddFriendModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};