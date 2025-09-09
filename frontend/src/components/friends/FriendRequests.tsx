import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { 
  fetchFriendRequests, 
  acceptFriendRequest, 
  declineFriendRequest 
} from '../../../store/friendSlice';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Modal } from '../common/Modal';
import { 
  UserPlus, 
  UserMinus, 
  Clock, 
  Users, 
  Check, 
  X 
} from 'lucide-react';
import { FriendRequest, FriendRequestStatus } from '../../../types/user';

interface FriendRequestsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FriendRequests: React.FC<FriendRequestsProps> = ({
  isOpen,
  onClose,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    incomingRequests, 
    outgoingRequests, 
    isLoading 
  } = useSelector((state: RootState) => state.friends);
  
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchFriendRequests());
    }
  }, [dispatch, isOpen]);

  const handleAcceptRequest = async (requestId: string) => {
    setProcessingRequests(prev => new Set(prev).add(requestId));
    try {
      await dispatch(acceptFriendRequest(requestId)).unwrap();
    } catch (error) {
      console.error('Error declining friend request:', error);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const formatRequestDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'только что';
    if (hours < 24) return `${hours}ч назад`;
    if (days < 7) return `${days}д назад`;
    return date.toLocaleDateString();
  };

  const renderRequestItem = (request: FriendRequest, isIncoming: boolean) => {
    const isProcessing = processingRequests.has(request.id);
    const user = isIncoming ? request.sender : request.receiver;

    return (
      <div
        key={request.id}
        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
      >
        <div className="flex items-center space-x-3">
          <Avatar
            src={user.avatar}
            alt={user.username}
            size="md"
            fallback={user.username.charAt(0).toUpperCase()}
          />
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              {user.username}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user.email}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatRequestDate(request.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isIncoming ? (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAcceptRequest(request.id)}
                disabled={isProcessing}
                className="flex items-center space-x-1"
              >
                {isProcessing ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Принять</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDeclineRequest(request.id)}
                disabled={isProcessing}
                className="flex items-center space-x-1"
              >
                <X className="w-4 h-4" />
                <span>Отклонить</span>
              </Button>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-orange-600 dark:text-orange-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Ожидание</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeclineRequest(request.id)}
                disabled={isProcessing}
                className="text-red-600 hover:text-red-700 p-1"
                title="Отменить заявку"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Заявки в друзья"
      size="lg"
    >
      <div className="space-y-6">
        {/* Вкладки */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`
              flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors
              ${activeTab === 'incoming'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }
            `}
          >
            <UserPlus className="w-4 h-4" />
            <span>Входящие ({incomingRequests.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('outgoing')}
            className={`
              flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors
              ${activeTab === 'outgoing'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }
            `}
          >
            <Clock className="w-4 h-4" />
            <span>Исходящие ({outgoingRequests.length})</span>
          </button>
        </div>

        {/* Содержимое */}
        <div className="min-h-64 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">
                Загрузка заявок...
              </span>
            </div>
          ) : (
            <>
              {activeTab === 'incoming' && (
                <div className="space-y-3">
                  {incomingRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Нет входящих заявок
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Когда кто-то отправит вам заявку в друзья, она появится здесь
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          📬 У вас {incomingRequests.length} новых заявок в друзья
                        </p>
                      </div>
                      {incomingRequests.map((request) => 
                        renderRequestItem(request, true)
                      )}
                    </>
                  )}
                </div>
              )}

              {activeTab === 'outgoing' && (
                <div className="space-y-3">
                  {outgoingRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Нет исходящих заявок
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Отправленные вами заявки в друзья будут отображаться здесь
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mb-4">
                        <p className="text-sm text-orange-700 dark:text-orange-300">
                          ⏳ Вы отправили {outgoingRequests.length} заявок, ожидающих ответа
                        </p>
                      </div>
                      {outgoingRequests.map((request) => 
                        renderRequestItem(request, false)
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Статистика */}
        {!isLoading && (incomingRequests.length > 0 || outgoingRequests.length > 0) && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  Всего заявок: {incomingRequests.length + outgoingRequests.length}
                </span>
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                Входящие: {incomingRequests.length} • Исходящие: {outgoingRequests.length}
              </div>
            </div>
          </div>
        )}

        {/* Кнопки управления */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </div>
    </Modal>
  );
};.error('Error accepting friend request:', error);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    setProcessingRequests(prev => new Set(prev).add(requestId));
    try {
      await dispatch(declineFriendRequest(requestId)).unwrap();
    } catch (error) {
      console