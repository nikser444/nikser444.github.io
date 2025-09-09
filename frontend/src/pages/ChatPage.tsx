import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Header, Sidebar } from '../components/common';
import { ChatList, ChatWindow } from '../components/chat';
import { useAuth, useSocket, useChat } from '../hooks';
import { Chat } from '../types/chat';

const ChatPage: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const { socket, isConnected } = useSocket();
  const { chats, activeChat, loading: chatsLoading } = useChat();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (isAuthenticated && socket) {
      // Подключаемся к сокет комнате пользователя
      socket.emit('user:join', { userId: user?.id });
      
      // Отмечаем пользователя как онлайн
      socket.emit('user:online', { userId: user?.id });
    }

    return () => {
      if (socket) {
        socket.emit('user:offline', { userId: user?.id });
      }
    };
  }, [isAuthenticated, socket, user]);

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

  const handleChatSelect = (chat: Chat) => {
    // Логика выбора чата будет обрабатываться в useChat хуке
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

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
              <h2 className="text-lg font-semibold text-gray-900">Чаты</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {chatsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <ChatList 
                  chats={chats}
                  activeChat={activeChat}
                  onChatSelect={handleChatSelect}
                />
              )}
            </div>
          </div>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          {activeChat ? (
            <ChatWindow 
              chat={activeChat}
              currentUser={user}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Выберите чат</h3>
                <p className="text-gray-500">Выберите существующий чат или создайте новый для начала общения</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ChatPage;