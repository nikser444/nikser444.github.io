// backend/src/services/index.ts

export { AuthService } from './AuthService';
export type { RegisterData, LoginData, AuthResponse } from './AuthService';

export { EmailService } from './EmailService';
export type { EmailConfig, EmailOptions } from './EmailService';

export { ChatService } from './ChatService';
export type { 
  CreateChatData, 
  UpdateChatData, 
  ChatWithMembers 
} from './ChatService';

export { CallService } from './CallService';
export type { 
  CreateCallData, 
  CallParticipant, 
  CallWithParticipants, 
  CallStats 
} from './CallService';

export { NotificationService } from './NotificationService';
export type { 
  Notification, 
  NotificationData, 
  NotificationSettings 
} from './NotificationService';

// Инициализация сервисов
export class ServiceManager {
  static async initializeServices(): Promise<void> {
    console.log('🚀 Инициализация сервисов...');

    try {
      // Инициализация Email сервиса
      await EmailService.init();
      console.log('✅ EmailService инициализирован');

      // Можно добавить инициализацию других сервисов
      console.log('✅ Все сервисы успешно инициализированы');
    } catch (error) {
      console.error('❌ Ошибка инициализации сервисов:', error);
      throw error;
    }
  }

  static async shutdownServices(): Promise<void> {
    console.log('🛑 Завершение работы сервисов...');
    
    try {
      // Здесь можно добавить корректное завершение работы сервисов
      // Например, закрытие соединений, очистка ресурсов и т.д.
      
      console.log('✅ Все сервисы корректно завершены');
    } catch (error) {
      console.error('❌ Ошибка при завершении сервисов:', error);
      throw error;
    }
  }
}