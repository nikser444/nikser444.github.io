import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../../store';
import { removeFriend, blockUser } from '../../../store/friendSlice';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { 
  MessageCircle, 
  Phone, 
  Video, 
  MoreHorizontal, 
  UserMinus, 
  UserX,
  Calendar
} from 'lucide-react';
import { Friend } from '../../../types/user';

interface FriendItemProps {
  friend: Friend;
  isSelected: boolean;
  isOnline: boolean;
  onClick: () => void;
  onStartChat: () => void;
}

export const FriendItem: React.FC<FriendItemProps> = ({
  friend,
  isSelected,
  isOnline,
  onClick,
  onStartChat,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [showActions, setShowActions] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const handleRemoveFriend = async () => {
    try {
      await dispatch(removeFriend(friend.id)).unwrap();
      setShowRemoveModal(false);
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  const handleBlockUser = async () => {
    try {
      await dispatch(blockUser(friend.id)).unwrap();
      setShowActions(false);
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  const handleStartCall = (isVideo: boolean = false) => {
    // Логика для начала звонка
    console.log(`Starting ${isVideo ? 'video' : 'audio'} call with:`, friend.id);
  };

  const formatLastSeen = (lastSeen: Date) => {
    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'недавно';
    if (hours < 24) return `${hours}ч назад`;
    if (days < 7) return `${days}д назад`;
    return lastSeen.toLocaleDateString();
  };

  return (
    <>
      <div
        className={`
          flex items-center p-4 cursor-pointer transition-colors relative
          ${isSelected 
            ? 'bg-blue-50 dark:bg-blue-900/20' 
            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
          }
        `}
        onClick={onClick}
      >
        {/* Аватар с индикатором онлайн */}
        <div className="relative mr-3">
          <Avatar
            src={friend.avatar}
            alt={friend.username}
            size="md"
            fallback={friend.username.charAt(0).toUpperCase()}
          />
          <div
            className={`
              absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900
              ${isOnline ? 'bg-green-500' : 'bg-gray-400'}
            `}
          />
        </div>

        {/* Информация о друге */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 dark:text-white truncate">
              {friend.username}
            </h3>
            {friend.lastMessage && (
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                {formatLastSeen(new Date(friend.lastMessage.createdAt))}
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-1">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {isOnline ? (
                <span className="text-green-600 dark:text-green-400">в сети</span>
              ) : (
                <span>был(а) {formatLastSeen(friend.lastSeen)}</span>
              )}
            </p>
            
            {friend.lastMessage && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {friend.lastMessage.content.length > 30
                  ? `${friend.lastMessage.content.substring(0, 30)}...`
                  : friend.lastMessage.content
                }
              </span>
            )}
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex items-center space-x-1 ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onStartChat();
            }}
            className="p-2"
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleStartCall(false);
            }}
            className="p-2"
          >
            <Phone className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleStartCall(true);
            }}
            className="p-2"
          >
            <Video className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className="p-2"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* Выпадающее меню действий */}
        {showActions && (
          <div className="absolute right-4 top-16 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 min-w-48">
            <div className="py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Открыть профиль друга
                  setShowActions(false);
                }}
                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Посмотреть профиль
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRemoveModal(true);
                  setShowActions(false);
                }}
                className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
              >
                <UserMinus className="w-4 h-4 mr-2" />
                Удалить из друзей
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleBlockUser();
                }}
                className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
              >
                <UserX className="w-4 h-4 mr-2" />
                Заблокировать
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно подтверждения удаления */}
      <Modal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        title="Удалить из друзей"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Вы уверены, что хотите удалить <strong>{friend.username}</strong> из друзей?
            Вы больше не сможете видеть их статус и получать уведомления.
          </p>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowRemoveModal(false)}
            >
              Отмена
            </Button>
            <Button
              variant="danger"
              onClick={handleRemoveFriend}
            >
              Удалить
            </Button>
          </div>
        </div>
      </Modal>

      {/* Закрытие меню при клике вне его */}
      {showActions && (
        <div
          className="fixed inset-0 z-5"
          onClick={(e) => {
            e.stopPropagation();
            setShowActions(false);
          }}
        />
      )}
    </>
  );
};