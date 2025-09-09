// frontend/src/store/index.ts
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './authSlice';
import chatReducer from './chatSlice';
import userReducer from './userSlice';
import friendReducer from './friendSlice';
import callReducer from './callSlice';
import notificationReducer from './notificationSlice';

// Конфигурация для redux-persist
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'user'], // Сохраняем только auth и user
  blacklist: ['chat', 'call', 'notification'] // Не сохраняем эти состояния
};

// Объединяем все reducers
const rootReducer = combineReducers({
  auth: authReducer,
  chat: chatReducer,
  user: userReducer,
  friend: friendReducer,
  call: callReducer,
  notification: notificationReducer,
});

// Создаем persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Конфигурируем store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['_persist'],
      },
    }).concat(customMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Создаем persistor
export const persistor = persistStore(store);

// Типы для TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Селекторы для удобного доступа к состоянию
export const selectAuth = (state: RootState) => state.auth;
export const selectChat = (state: RootState) => state.chat;
export const selectUser = (state: RootState) => state.user;
export const selectFriend = (state: RootState) => state.friend;
export const selectCall = (state: RootState) => state.call;
export const selectNotification = (state: RootState) => state.notification;

// Типизированные хуки для компонентов
export { useAppDispatch, useAppSelector } from './hooks';