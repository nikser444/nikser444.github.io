import { Pool } from 'pg';
import { createClient } from 'redis';

// Настройки PostgreSQL
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'messenger_db',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // максимальное количество подключений в пуле
  idleTimeoutMillis: 30000, // время до закрытия неактивного соединения
  connectionTimeoutMillis: 2000, // таймаут подключения
};

// Пул подключений к PostgreSQL
export const db = new Pool(dbConfig);

// Настройки Redis
const redisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
};

// Клиент Redis для кеширования и сессий
export const redis = createClient(redisConfig);

// Обработчики событий для подключений
db.on('connect', () => {
  console.log('✅ PostgreSQL подключен');
});

db.on('error', (err) => {
  console.error('❌ Ошибка PostgreSQL:', err);
});

redis.on('connect', () => {
  console.log('✅ Redis подключен');
});

redis.on('error', (err) => {
  console.error('❌ Ошибка Redis:', err);
});

// Инициализация подключения к Redis
(async () => {
  try {
    await redis.connect();
  } catch (error) {
    console.error('❌ Ошибка подключения к Redis:', error);
  }
})();

// Функция для проверки подключения к БД
export const testConnection = async (): Promise<boolean> => {
  try {
    await db.query('SELECT 1');
    await redis.ping();
    return true;
  } catch (error) {
    console.error('Ошибка подключения к БД:', error);
    return false;
  }
};

// Функция для закрытия соединений
export const closeConnections = async (): Promise<void> => {
  await db.end();
  await redis.quit();
  console.log('🔌 Соединения с БД закрыты');
};