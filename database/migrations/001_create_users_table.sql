-- Миграция: Создание таблицы пользователей
-- Файл: 001_create_users_table.sql

-- Создание enum для статуса пользователя
CREATE TYPE user_status AS ENUM ('online', 'offline', 'away', 'busy');

-- Создание enum для роли пользователя
CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');

-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    avatar_url VARCHAR(255),
    status user_status DEFAULT 'offline',
    role user_role DEFAULT 'user',
    bio TEXT,
    phone VARCHAR(20),
    date_of_birth DATE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для оптимизации запросов
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_seen_at ON users(last_seen_at);

-- Создание функции для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создание триггера для автоматического обновления updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Добавление комментариев к таблице и колонкам
COMMENT ON TABLE users IS 'Таблица пользователей системы';
COMMENT ON COLUMN users.id IS 'Уникальный идентификатор пользователя';
COMMENT ON COLUMN users.username IS 'Уникальное имя пользователя';
COMMENT ON COLUMN users.email IS 'Электронная почта пользователя';
COMMENT ON COLUMN users.password_hash IS 'Хеш пароля пользователя';
COMMENT ON COLUMN users.avatar_url IS 'URL аватара пользователя';
COMMENT ON COLUMN users.status IS 'Текущий статус пользователя';
COMMENT ON COLUMN users.role IS 'Роль пользователя в системе';
COMMENT ON COLUMN users.is_verified IS 'Подтвержден ли email пользователя';
COMMENT ON COLUMN users.is_active IS 'Активен ли аккаунт пользователя';
COMMENT ON COLUMN users.last_seen_at IS 'Время последнего посещения';
COMMENT ON COLUMN users.created_at IS 'Дата создания аккаунта';
COMMENT ON COLUMN users.updated_at IS 'Дата последнего обновления';