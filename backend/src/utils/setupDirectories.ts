// backend/src/utils/setupDirectories.ts
import fs from 'fs/promises';
import path from 'path';

/**
 * Настройка директорий для загрузки файлов
 */
export class DirectorySetup {
  private static readonly UPLOAD_DIRS = [
    'uploads',
    'uploads/avatars',
    'uploads/files', 
    'uploads/temp'
  ];

  /**
   * Создает все необходимые директории для загрузки файлов
   */
  static async createUploadDirectories(): Promise<void> {
    console.log('📁 Setting up upload directories...');
    
    for (const dir of this.UPLOAD_DIRS) {
      const dirPath = path.join(process.cwd(), dir);
      
      try {
        await fs.access(dirPath);
        console.log(`✅ Directory exists: ${dir}`);
      } catch {
        try {
          await fs.mkdir(dirPath, { recursive: true });
          console.log(`✨ Created directory: ${dir}`);
        } catch (error) {
          console.error(`❌ Failed to create directory ${dir}:`, error);
          throw error;
        }
      }
    }
    
    // Создаем .gitkeep файлы для пустых директорий
    await this.createGitKeepFiles();
    
    console.log('✅ Upload directories setup completed');
  }

  /**
   * Создает .gitkeep файлы в директориях загрузки
   */
  private static async createGitKeepFiles(): Promise<void> {
    const gitKeepContent = '# This file ensures the directory is tracked by Git\n';
    
    for (const dir of this.UPLOAD_DIRS.slice(1)) { // Пропускаем корневую папку uploads
      const gitKeepPath = path.join(process.cwd(), dir, '.gitkeep');
      
      try {
        await fs.access(gitKeepPath);
      } catch {
        try {
          await fs.writeFile(gitKeepPath, gitKeepContent);
          console.log(`📝 Created .gitkeep in ${dir}`);
        } catch (error) {
          console.warn(`⚠️  Failed to create .gitkeep in ${dir}:`, error);
        }
      }
    }
  }

  /**
   * Проверяет права доступа к директориям
   */
  static async checkDirectoryPermissions(): Promise<boolean> {
    console.log('🔍 Checking directory permissions...');
    
    for (const dir of this.UPLOAD_DIRS) {
      const dirPath = path.join(process.cwd(), dir);
      
      try {
        // Проверяем возможность чтения
        await fs.access(dirPath, fs.constants.R_OK);
        
        // Проверяем возможность записи
        await fs.access(dirPath, fs.constants.W_OK);
        
        console.log(`✅ Directory permissions OK: ${dir}`);
      } catch (error) {
        console.error(`❌ Directory permission error in ${dir}:`, error);
        return false;
      }
    }
    
    console.log('✅ All directory permissions are correct');
    return true;
  }

  /**
   * Получает информацию о размере директорий
   */
  static async getDirectorySizes(): Promise<Record<string, number>> {
    const sizes: Record<string, number> = {};
    
    for (const dir of this.UPLOAD_DIRS) {
      const dirPath = path.join(process.cwd(), dir);
      sizes[dir] = await this.calculateDirectorySize(dirPath);
    }
    
    return sizes;
  }

  /**
   * Вычисляет размер директории в байтах
   */
  private static async calculateDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;
    
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
          totalSize += await this.calculateDirectorySize(itemPath);
        } else {
          const stats = await fs.stat(itemPath);
          totalSize += stats.size;
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not calculate size for ${dirPath}:`, error);
    }
    
    return totalSize;
  }

  /**
   * Очистка временных файлов
   */
  static async cleanupTempFiles(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    console.log('🧹 Cleaning up temporary files...');
    
    const tempDir = path.join(process.cwd(), 'uploads', 'temp');
    const now = Date.now();
    let deletedCount = 0;
    
    try {
      const files = await fs.readdir(tempDir);
      
      for (const file of files) {
        if (file === '.gitkeep') continue;
        
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
          console.log(`🗑️  Deleted old temp file: ${file}`);
        }
      }
      
      console.log(`✅ Cleanup completed. Deleted ${deletedCount} files`);
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }

  /**
   * Форматирует размер в байтах в человекочитаемый формат
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Проверка доступного места на диске
   */
  static async checkDiskSpace(): Promise<{ free: number; total: number; used: number }> {
    try {
      const stats = await fs.statfs(process.cwd());
      
      return {
        free: stats.bavail * stats.bsize,
        total: stats.blocks * stats.bsize,
        used: (stats.blocks - stats.bavail) * stats.bsize
      };
    } catch (error) {
      console.warn('Could not get disk space info:', error);
      return { free: 0, total: 0, used: 0 };
    }
  }
}

// backend/server.ts (обновленная версия с инициализацией директорий)
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

import { testConnection } from './src/config/database';
import { DirectorySetup } from './src/utils/setupDirectories';
import authRoutes from './src/routes/auth';
import userRoutes from './src/routes/users';
import chatRoutes from './src/routes/chats';
import messageRoutes from './src/routes/messages';
import friendRoutes from './src/routes/friends';
import callRoutes from './src/routes/calls';

// Загружаем переменные окружения
dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Статические файлы для загрузок
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API роуты
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/calls', callRoutes);

// Базовый роут
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Обработка 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Глобальная обработка ошибок
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Инициализация сервера
async function startServer() {
  try {
    console.log('🚀 Starting messenger server...');
    
    // Проверяем подключение к БД
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }
    
    // Настраиваем директории для загрузки файлов
    await DirectorySetup.createUploadDirectories();
    
    // Проверяем права доступа
    const permissionsOK = await DirectorySetup.checkDirectoryPermissions();
    if (!permissionsOK) {
      throw new Error('Directory permissions check failed');
    }
    
    // Запускаем очистку временных файлов каждый час
    setInterval(async () => {
      await DirectorySetup.cleanupTempFiles();
    }, 60 * 60 * 1000);
    
    // Запуск сервера
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 API available at http://localhost:${PORT}/api`);
      console.log(`📁 Uploads available at http://localhost:${PORT}/uploads`);
    });
    
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Запускаем сервер
startServer();