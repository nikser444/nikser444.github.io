-- Миграция: Создание таблицы чатов
-- Файл: 002_create_chats_table.sql

-- Создание enum для типа чата
CREATE TYPE chat_type AS ENUM ('private', 'group', 'channel');

-- Создание таблицы чатов
CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),
    description TEXT,
    type chat_type NOT NULL DEFAULT 'private',
    avatar_url VARCHAR(255),
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    max_members INTEGER DEFAULT 100,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для оптимизации запросов
CREATE INDEX idx_chats_type ON chats(type);
CREATE INDEX idx_chats_owner_id ON chats(owner_id);
CREATE INDEX idx_chats_created_at ON chats(created_at);
CREATE INDEX idx_chats_last_message_at ON chats(last_message_at);
CREATE INDEX idx_chats_is_active ON chats(is_active);

-- Создание триггера для автоматического обновления updated_at
CREATE TRIGGER update_chats_updated_at 
    BEFORE UPDATE ON chats 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Добавление ограничений
ALTER TABLE chats ADD CONSTRAINT check_private_chat_name 
    CHECK (type != 'private' OR name IS NULL);

ALTER TABLE chats ADD CONSTRAINT check_group_chat_name 
    CHECK (type = 'private' OR name IS NOT NULL);

ALTER TABLE chats ADD CONSTRAINT check_max_members_positive 
    CHECK (max_members > 0);

-- Добавление комментариев к таблице и колонкам
COMMENT ON TABLE chats IS 'Таблица чатов и групп';
COMMENT ON COLUMN chats.id IS 'Уникальный идентификатор чата';
COMMENT ON COLUMN chats.name IS 'Название чата (NULL для приватных чатов)';
COMMENT ON COLUMN chats.description IS 'Описание чата';
COMMENT ON COLUMN chats.type IS 'Тип чата: приватный, групповой или канал';
COMMENT ON COLUMN chats.avatar_url IS 'URL аватара чата';
COMMENT ON COLUMN chats.owner_id IS 'ID создателя чата';
COMMENT ON COLUMN chats.is_active IS 'Активен ли чат';
COMMENT ON COLUMN chats.max_members IS 'Максимальное количество участников';
COMMENT ON COLUMN chats.settings IS 'Настройки чата в формате JSON';
COMMENT ON COLUMN chats.last_message_at IS 'Время последнего сообщения в чате';