import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import Avatar from './Avatar';
import Button from './Button';

interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
  isActive?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  className = '', 
  isCollapsed = false, 
  onToggleCollapse 
}) => {
  const { user } = useAuth();
  const { isConnected, onlineUsers } = useSocket();
  const [activeItem, setActiveItem] = useState('chats');

  const menuItems: MenuItem[] = [
    {
      id: 'chats',
      label: 'Чаты',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      path: '/chats',
      badge: 3,
      isActive: activeItem === 'chats'
    },
    {
      id: 'friends',
      label: 'Друзья',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      path: '/friends',
      badge: 1,
      isActive: activeItem === 'friends'
    },
    {
      id: 'calls',
      label: 'Звонки',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      path: '/calls',
      isActive: activeItem === 'calls'
    },
    {
      id: 'settings',
      label: 'Настройки',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      path: '/settings',
      isActive: activeItem === 'settings'
    }
  ];

  const handleItemClick = (itemId: string, path: string) => {
    setActiveItem(itemId);
    // Здесь будет навигация с помощью React Router
    window.history.pushState({}, '', path);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } ${className}`}>
      {/* Заголовок сайдбара */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <Avatar
              src={user?.avatar}
              alt={user?.username || 'User'}
              size="sm"
              status={user?.status}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <span className={`w-2 h-2 rounded-full mr-1 ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}></span>
                {isConnected ? 'Онлайн' : 'Оффлайн'}
              </p>
            </div>
          </div>
        )}
        
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="p-1.5"
          >
            <svg 
              className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </Button>
        )}
      </div>

      {/* Навигационное меню */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleItemClick(item.id, item.path)}
                className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  item.isActive
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="flex-shrink-0">
                  {item.icon}
                </span>
                
                {!isCollapsed && (
                  <>
                    <span className="ml-3 flex-1 text-left">
                      {item.label}
                    </span>
                    {item.badge && item.badge > 0 && (
                      <span className="ml-3 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </>
                )}
                
                {isCollapsed && item.badge && item.badge > 0 && (
                  <span className="absolute left-8 top-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 text-center min-w-[18px] text-[10px]">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Статистика онлайн пользователей */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Онлайн пользователей</span>
            <span className="font-medium">{onlineUsers.length}</span>
          </div>
          
          {onlineUsers.length > 0 && (
            <div className="mt-2 flex -space-x-1">
              {onlineUsers.slice(0, 5).map((userId) => (
                <div
                  key={userId}
                  className="relative"
                >
                  <Avatar
                    src={`/api/users/${userId}/avatar`}
                    alt="Online user"
                    size="xs"
                    status="online"
                    className="ring-2 ring-white dark:ring-gray-800"
                  />
                </div>
              ))}
              {onlineUsers.length > 5 && (
                <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                  <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                    +{onlineUsers.length - 5}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Статус подключения */}
      <div className={`p-2 border-t border-gray-200 dark:border-gray-700 ${isCollapsed ? 'px-1' : ''}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-2'} py-1`}>
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          } ${isCollapsed ? '' : 'mr-2'}`}></div>
          {!isCollapsed && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {isConnected ? 'Подключено' : 'Подключение...'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;