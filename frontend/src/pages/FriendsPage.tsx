import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Header, Sidebar, Button, Modal } from '../components/common';
import { FriendsList, AddFriendModal, FriendRequests } from '../components/friends';
import { useAuth, useSocket } from '../hooks';
import { Friend } from '../types/user';

type TabType = 'friends' | 'requests' | 'blocked';

const FriendsPage: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const { socket, isConnected } = useSocket();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [friendsLoading, setFriendsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && socket) {
      // Загрузка списка друзей
      loadFriends();
      loadFriendRequests();

      // Подписка на события друзей
      socket.on('friend:request:received', handleFriendRequestReceived);
      socket.on('friend:request:accepted', handleFriendRequestAccepted);
      socket.on('friend:added', handleFriendAdded);
      socket.on('friend:removed', handleFriendRemoved);
      socket.on('friend:status:changed', handleFriendStatusChanged);

      return () => {
        socket.off('friend:request:received');
        socket.off('friend:request:accepted');
        socket.off('friend:added');
        socket.off('friend:removed');
        socket.off('friend:status:changed');
      };
    }
  }, [isAuthenticated, socket]);

  const loadFriends = async () => {
    try {
      setFriendsLoading(true);
      // Здесь будет вызов API для загрузки друзей
      // const response = await friendService.getFriends();
      // setFriends(response.data);
      setFriends([]); // Пока заглушка
    } catch (error) {
      console.error('Ошибка загрузки друзей:', error);
    } finally {
      setFriendsLoading(false);
    }
  };

  const loadFriendRequests = async () => {
    try {
      // Здесь будет вызов API для загрузки заявок в друзья
      // const response = await friendService.getFriendRequests();
      // setFriendRequests(response.data);
      setFriendRequests([]); // Пока заглушка
    } catch (error) {
      console.error('Ошибка загрузки заявок в друзья:', error);
    }
  };

  const handleFriendRequestReceived = (data: any) => {
    setFriendRequests(prev => [...prev, data.request]);
  };

  const handleFriendRequestAccepted = (data: any) => {
    setFriends(prev => [...prev, data.friend]);
    setFriendRequests(prev => prev.filter(req => req.id !== data.requestId));
  };

  const handleFriendAdded = (data: any) => {
    setFriends(prev => [...prev, data.friend]);
  };

  const handleFriendRemoved = (data: any) => {
    setFriends(prev => prev.filter(friend => friend.id !== data.friendId));
  };

  const handleFriendStatusChanged = (data: any) => {
    setFriends(prev => 
      prev.map(friend => 
        friend.id === data.friendId 
          ? { ...friend, status: data.status }
          : friend
      )
    );
  };

  const handleAddFriend = () => {
    setIsAddFriendModalOpen(true);
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      // Здесь будет вызов API для удаления друга
      // await friendService.removeFriend(friendId);
      socket?.emit('friend:remove', { friendId });
    } catch (error) {
      console.error('Ошибка удаления друга:', error);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      // Здесь будет вызов API для принятия заявки
      // await friendService.acceptFriendRequest(requestId);
      socket?.emit('friend:request:accept', { requestId });
    } catch (error) {
      console.error('Ошибка принятия заявки:', error);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      // Здесь будет вызов API для отклонения заявки
      // await friendService.declineFriendRequest(requestId);
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Ошибка отклонения заявки:', error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const tabs = [
    { id: 'friends', label: 'Друзья', count: friends.length },
    { id: 'requests', label: 'Заявки', count: friendRequests.length },
    { id: 'blocked', label: 'Заблокированные', count: 0 }
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header 
        user={user}
        onToggleSidebar={toggleSidebar}
        isConnected={isConnected}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpen={isSidebarOpen}>
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Друзья</h2>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddFriend}
                >
                  Добавить
                </Button>
              </div>
              
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'friends' && (
                <FriendsList
                  friends={friends}
                  loading={friendsLoading}
                  onRemoveFriend={handleRemoveFriend}
                />
              )}
              
              {activeTab === 'requests' && (
                <FriendRequests
                  requests={friendRequests}
                  onAccept={handleAcceptRequest}
                  onDecline={handleDeclineRequest}
                />
              )}
              
              {activeTab === 'blocked' && (
                <div className="p-4 text-center text-gray-500">
                  Заблокированных пользователей нет
                </div>
              )}
            </div>
          </div>
        </Sidebar>

        <main className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Управление друзьями</h3>
            <p className="text-gray-500">Добавляйте друзей, принимайте заявки и управляйте своими контактами</p>
          </div>
        </main>
      </div>

      {isAddFriendModalOpen && (
        <AddFriendModal
          isOpen={isAddFriendModalOpen}
          onClose={() => setIsAddFriendModalOpen(false)}
          onFriendAdded={() => {
            setIsAddFriendModalOpen(false);
            loadFriends();
          }}
        />
      )}
    </div>
  );
};

export default FriendsPage;