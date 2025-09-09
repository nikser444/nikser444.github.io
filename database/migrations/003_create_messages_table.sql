-- Миграция: Создание таблицы сообщений
-- Файл: 003_create_messages_table.sql

-- Создание enum для типа сообщения
CREATE TYPE message_type AS ENUM ('text', 'image', 'file', 'audio', 'video', 'system');

-- Создание enum для статуса сообщения
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');

-- Создание таблицы сообщений
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    type message_type NOT NULL DEFAULT 'text',
    content TEXT,
    file_url VARCHAR(255),
    file_name VARCHAR(255),
    file_size BIGINT,
    file_type VARCHAR(100),
    thumbnail_url VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы для отслеживания статуса прочтения сообщений
CREATE TABLE IF NOT EXISTS message_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status message_status NOT NULL DEFAULT 'sent',
    status_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id)
);

-- Создание таблицы для реакций на сообщения
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id, emoji)
);

-- Создание индексов для таблицы messages
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_type ON messages(type);
CREATE INDEX idx_messages_reply_to_id ON messages(reply_to_id);
CREATE INDEX idx_messages_is_deleted ON messages(is_deleted);
CREATE INDEX idx_messages_chat_created ON messages(chat_id, created_at DESC);

-- Создание индексов для таблицы message_status
CREATE INDEX idx_message_status_message_id ON message_status(message_id);
CREATE INDEX idx_message_status_user_id ON message_status(user_id);
CREATE INDEX idx_message_status_status ON message_status(status);

-- Создание индексов для таблицы message_reactions
CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user_id ON message_reactions(user_id);

-- Создание триггеров для автоматического обновления updated_at
CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Функция для обновления времени последнего сообщения в чате
CREATE OR REPLACE FUNCTION update_chat_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chats 
    SET last_message_at = NEW.created_at 
    WHERE id = NEW.chat_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для обновления времени последнего сообщения в чате
CREATE TRIGGER update_chat_last_message_at_trigger
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_last_message_at();

-- Добавление ограничений
ALTER TABLE messages ADD CONSTRAINT check_content_not_empty 
    CHECK (
        (type = 'text' AND content IS NOT NULL AND LENGTH(TRIM(content)) > 0) OR
        (type != 'text' AND (content IS NULL OR LENGTH(TRIM(content)) >= 0))
    );

ALTER TABLE messages ADD CONSTRAINT check_file_data 
    CHECK (
        (type IN ('image', 'file', 'audio', 'video') AND file_url IS NOT NULL) OR
        (type NOT IN ('image', 'file', 'audio', 'video'))
    );

ALTER TABLE messages ADD CONSTRAINT check_file_size_positive 
    CHECK (file_size IS NULL OR file_size >= 0);

-- Добавление комментариев
COMMENT ON TABLE messages IS 'Таблица сообщений';
COMMENT ON COLUMN messages.id IS 'Уникальный идентификатор сообщения';
COMMENT ON COLUMN messages.chat_id IS 'ID чата, к которому относится сообщение';
COMMENT ON COLUMN messages.sender_id IS 'ID отправителя сообщения';
COMMENT ON COLUMN messages.reply_to_id IS 'ID сообщения, на которое отвечает данное сообщение';
COMMENT ON COLUMN messages.type IS 'Тип сообщения';
COMMENT ON COLUMN messages.content IS 'Текст сообщения';
COMMENT ON COLUMN messages.file_url IS 'URL файла (для файловых сообщений)';
COMMENT ON COLUMN messages.metadata IS 'Дополнительные данные сообщения в формате JSON';
COMMENT ON COLUMN messages.is_edited IS 'Было ли сообщение отредактировано';
COMMENT ON COLUMN messages.is_deleted IS 'Было ли сообщение удалено';

COMMENT ON TABLE message_status IS 'Таблица статусов прочтения сообщений';
COMMENT ON TABLE message_reactions IS 'Таблица реакций на сообщения';