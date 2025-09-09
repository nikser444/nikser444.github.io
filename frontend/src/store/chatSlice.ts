// frontend/src/store/chatSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { chatService } from '../services';
import type { Chat, Message } from '../types';

// Типы для состояния чатов
export interface ChatState {
  chats: Chat[];
  messages: Record<string, Message[]>;
  activeChat: Chat | null;
  isLoading: boolean;
  isLoadingMessages: boolean;
  error: string | null;
  typingUsers: Record<string, string[]>;
  unreadCounts: Record<string, number>;
  searchResults: Message[];
  isSearching: boolean;
}

// Начальное состояние
const initialState: ChatState = {
  chats: [],
  messages: {},
  activeChat: null,
  isLoading: false,
  isLoadingMessages: false,
  error: null,
  typingUsers: {},
  unreadCounts: {},
  searchResults: [],
  isSearching: false,
};

// Асинхронные thunks
export const fetchChats = createAsyncThunk(
  'chat/fetchChats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await chatService.getChats();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка загрузки чатов'
      );
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (
    { chatId, page = 1, limit = 50 }: { chatId: string; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await chatService.getMessages(chatId, page, limit);
      return { chatId, messages: response.data, page };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка загрузки сообщений'
      );
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (
    { chatId, content, type = 'text', attachments }: {
      chatId: string;
      content: string;
      type?: 'text' | 'image' | 'file' | 'audio' | 'video';
      attachments?: File[];
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await chatService.sendMessage(chatId, content, type, attachments);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка отправки сообщения'
      );
    }
  }
);

export const createChat = createAsyncThunk(
  'chat/createChat',
  async (
    { participants, name, type = 'private' }: {
      participants: string[];
      name?: string;
      type?: 'private' | 'group';
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await chatService.createChat({ participants, name, type });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка создания чата'
      );
    }
  }
);

export const searchMessages = createAsyncThunk(
  'chat/searchMessages',
  async (
    { query, chatId }: { query: string; chatId?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await chatService.searchMessages(query, chatId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка поиска сообщений'
      );
    }
  }
);

export const editMessage = createAsyncThunk(
  'chat/editMessage',
  async (
    { messageId, content }: { messageId: string; content: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await chatService.editMessage(messageId, content);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка редактирования сообщения'
      );
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'chat/deleteMessage',
  async (messageId: string, { rejectWithValue }) => {
    try {
      await chatService.deleteMessage(messageId);
      return messageId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка удаления сообщения'
      );
    }
  }
);

// Создаем slice
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveChat: (state, action: PayloadAction<Chat | null>) => {
      state.activeChat = action.payload;
      if (action.payload) {
        // Сбрасываем счетчик непрочитанных сообщений
        state.unreadCounts[action.payload.id] = 0;
      }
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      const chatId = message.chatId;
      
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }
      
      // Проверяем, что сообщение еще не существует
      const existingMessage = state.messages[chatId].find(m => m.id === message.id);
      if (!existingMessage) {
        state.messages[chatId].push(message);
        
        // Увеличиваем счетчик непрочитанных, если чат не активен
        if (state.activeChat?.id !== chatId) {
          state.unreadCounts[chatId] = (state.unreadCounts[chatId] || 0) + 1;
        }
        
        // Обновляем последнее сообщение в чате
        const chat = state.chats.find(c => c.id === chatId);
        if (chat) {
          chat.lastMessage = message;
          chat.updatedAt = message.createdAt;
        }
      }
    },
    updateMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      const chatId = message.chatId;
      
      if (state.messages[chatId]) {
        const index = state.messages[chatId].findIndex(m => m.id === message.id);
        if (index !== -1) {
          state.messages[chatId][index] = message;
        }
      }
    },
    removeMessage: (state, action: PayloadAction<{ messageId: string; chatId: string }>) => {
      const { messageId, chatId } = action.payload;
      
      if (state.messages[chatId]) {
        state.messages[chatId] = state.messages[chatId].filter(m => m.id !== messageId);
      }
    },
    setTypingUsers: (state, action: PayloadAction<{ chatId: string; users: string[] }>) => {
      const { chatId, users } = action.payload;
      state.typingUsers[chatId] = users;
    },
    markMessagesAsRead: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      state.unreadCounts[chatId] = 0;
      
      // Отмечаем сообщения как прочитанные
      if (state.messages[chatId]) {
        state.messages[chatId] = state.messages[chatId].map(message => ({
          ...message,
          read: true
        }));
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.isSearching = false;
    },
    updateChatInfo: (state, action: PayloadAction<Partial<Chat> & { id: string }>) => {
      const { id, ...updates } = action.payload;
      const chatIndex = state.chats.findIndex(chat => chat.id === id);
      
      if (chatIndex !== -1) {
        state.chats[chatIndex] = { ...state.chats[chatIndex], ...updates };
        
        // Обновляем активный чат, если это он
        if (state.activeChat?.id === id) {
          state.activeChat = { ...state.activeChat, ...updates };
        }
      }
    },
    addUserToChat: (state, action: PayloadAction<{ chatId: string; userId: string }>) => {
      const { chatId, userId } = action.payload;
      const chat = state.chats.find(c => c.id === chatId);
      
      if (chat && !chat.participants.includes(userId)) {
        chat.participants.push(userId);
        
        if (state.activeChat?.id === chatId) {
          state.activeChat.participants.push(userId);
        }
      }
    },
    removeUserFromChat: (state, action: PayloadAction<{ chatId: string; userId: string }>) => {
      const { chatId, userId } = action.payload;
      const chat = state.chats.find(c => c.id === chatId);
      
      if (chat) {
        chat.participants = chat.participants.filter(id => id !== userId);
        
        if (state.activeChat?.id === chatId) {
          state.activeChat.participants = state.activeChat.participants.filter(id => id !== userId);
        }
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch chats
    builder
      .addCase(fetchChats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.chats = action.payload;
        
        // Инициализируем счетчики непрочитанных сообщений
        action.payload.forEach((chat: Chat) => {
          if (state.unreadCounts[chat.id] === undefined) {
            state.unreadCounts[chat.id] = chat.unreadCount || 0;
          }
        });
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch messages
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.isLoadingMessages = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoadingMessages = false;
        const { chatId, messages, page } = action.payload;
        
        if (page === 1) {
          state.messages[chatId] = messages;
        } else {
          // Добавляем сообщения в начало для пагинации
          state.messages[chatId] = [...messages, ...(state.messages[chatId] || [])];
        }
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoadingMessages = false;
        state.error = action.payload as string;
      });

    // Send message
    builder
      .addCase(sendMessage.fulfilled, (state, action) => {
        const message = action.payload;
        const chatId = message.chatId;
        
        if (!state.messages[chatId]) {
          state.messages[chatId] = [];
        }
        
        state.messages[chatId].push(message);
        
        // Обновляем информацию о чате
        const chat = state.chats.find(c => c.id === chatId);
        if (chat) {
          chat.lastMessage = message;
          chat.updatedAt = message.createdAt;
        }
      });

    // Create chat
    builder
      .addCase(createChat.fulfilled, (state, action) => {
        const newChat = action.payload;
        state.chats.unshift(newChat);
        state.messages[newChat.id] = [];
        state.unreadCounts[newChat.id] = 0;
      });

    // Search messages
    builder
      .addCase(searchMessages.pending, (state) => {
        state.isSearching = true;
      })
      .addCase(searchMessages.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchResults = action.payload;
      })
      .addCase(searchMessages.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.payload as string;
      });

    // Edit message
    builder
      .addCase(editMessage.fulfilled, (state, action) => {
        const updatedMessage = action.payload;
        const chatId = updatedMessage.chatId;
        
        if (state.messages[chatId]) {
          const index = state.messages[chatId].findIndex(m => m.id === updatedMessage.id);
          if (index !== -1) {
            state.messages[chatId][index] = updatedMessage;
          }
        }
      });

    // Delete message
    builder
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const messageId = action.payload;
        
        // Находим и удаляем сообщение из всех чатов
        Object.keys(state.messages).forEach(chatId => {
          state.messages[chatId] = state.messages[chatId].filter(m => m.id !== messageId);
        });
      });
  },
});

// Экспортируем действия
export const {
  setActiveChat,
  addMessage,
  updateMessage,
  removeMessage,
  setTypingUsers,
  markMessagesAsRead,
  clearError,
  clearSearchResults,
  updateChatInfo,
  addUserToChat,
  removeUserFromChat,
} = chatSlice.actions;

// Селекторы
export const selectChats = (state: { chat: ChatState }) => state.chat.chats;
export const selectActiveChat = (state: { chat: ChatState }) => state.chat.activeChat;
export const selectMessages = (state: { chat: ChatState }, chatId: string) =>
  state.chat.messages[chatId] || [];
export const selectChatLoading = (state: { chat: ChatState }) => state.chat.isLoading;
export const selectMessagesLoading = (state: { chat: ChatState }) => state.chat.isLoadingMessages;
export const selectChatError = (state: { chat: ChatState }) => state.chat.error;
export const selectTypingUsers = (state: { chat: ChatState }, chatId: string) =>
  state.chat.typingUsers[chatId] || [];
export const selectUnreadCount = (state: { chat: ChatState }, chatId: string) =>
  state.chat.unreadCounts[chatId] || 0;
export const selectSearchResults = (state: { chat: ChatState }) => state.chat.searchResults;
export const selectIsSearching = (state: { chat: ChatState }) => state.chat.isSearching;

// Экспортируем reducer
export default chatSlice.reducer;