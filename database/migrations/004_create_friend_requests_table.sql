-- Миграция: Создание таблиц для системы друзей
-- Файл: 004_create_friend_requests_table.sql

-- Создание enum для статуса заявки в друзья
CREATE TYPE friend_request_status AS ENUM ('pending', 'accepted', 'declined', 'blocked');

-- Создание таблицы заявок в друзья
CREATE TABLE IF NOT EXISTS friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status friend_request_status NOT NULL DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Ограничение: нельзя отправить заявку самому себе
    CONSTRAINT check_not_self_request CHECK (sender_id != receiver_id),
    
    -- Уникальность: одна заявка между двумя пользователями
    CONSTRAINT unique_friend_request UNIQUE (sender_id, receiver_id)
);

-- Создание таблицы друзей (принятые заявки)
CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ограничение: пользователь не может быть другом самому себе
    CONSTRAINT check_not_self_friendship CHECK (user1_id != user2_id),
    
    -- Ограничение: user1_id всегда меньше user2_id для избежания дублирования
    CONSTRAINT check_user_order CHECK (user1_id < user2_id),
    
    -- Уникальность дружбы
    CONSTRAINT unique_friendship UNIQUE (user1_id, user2_id)
);

-- Создание таблицы блокировок
CREATE TABLE IF NOT EXISTS user_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ограничение: нельзя заблокировать самого себя
    CONSTRAINT check_not_self_block CHECK (blocker_id != blocked_id),
    
    -- Уникальность блокировки
    CONSTRAINT unique_user_block UNIQUE (blocker_id, blocked_id)
);

-- Создание индексов для таблицы friend_requests
CREATE INDEX idx_friend_requests_sender_id ON friend_requests(sender_id);
CREATE INDEX idx_friend_requests_receiver_id ON friend_requests(receiver_id);
CREATE INDEX idx_friend_requests_status ON friend_requests(status);
CREATE INDEX idx_friend_requests_created_at ON friend_requests(created_at);
CREATE INDEX idx_friend_requests_pending ON friend_requests(receiver_id, status) WHERE status = 'pending';

-- Создание индексов для таблицы friendships
CREATE INDEX idx_friendships_user1_id ON friendships(user1_id);
CREATE INDEX idx_friendships_user2_id ON friendships(user2_id);
CREATE INDEX idx_friendships_created_at ON friendships(created_at);

-- Создание индексов для таблицы user_blocks
CREATE INDEX idx_user_blocks_blocker_id ON user_blocks(blocker_id);
CREATE INDEX idx_user_blocks_blocked_id ON user_blocks(blocked_id);
CREATE INDEX idx_user_blocks_created_at ON user_blocks(created_at);

-- Создание триггеров для автоматического обновления updated_at
CREATE TRIGGER update_friend_requests_updated_at 
    BEFORE UPDATE ON friend_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Функция для создания дружбы при принятии заявки
CREATE OR REPLACE FUNCTION create_friendship_on_accept()
RETURNS TRIGGER AS $$
BEGIN
    -- Если заявка принята
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        -- Создаем запись в таблице friendships
        INSERT INTO friendships (user1_id, user2_id)
        VALUES (
            LEAST(NEW.sender_id, NEW.receiver_id),
            GREATEST(NEW.sender_id, NEW.receiver_id)
        )
        ON CONFLICT (user1_id, user2_id) DO NOTHING;
        
        -- Обновляем время ответа
        NEW.responded_at = CURRENT_TIMESTAMP;
    END IF;
    
    -- Если заявка отклонена или заблокирована
    IF NEW.status IN ('declined', 'blocked') AND OLD.status = 'pending' THEN
        NEW.responded_at = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создание триггера для автоматического создания дружбы
CREATE TRIGGER create_friendship_on_accept_trigger
    BEFORE UPDATE ON friend_requests
    FOR EACH ROW
    EXECUTE FUNCTION create_friendship_on_accept();

-- Функция для удаления дружбы
CREATE OR REPLACE FUNCTION remove_friendship()
RETURNS TRIGGER AS $$
BEGIN
    -- Удаляем запись из таблицы friendships
    DELETE FROM friendships 
    WHERE (user1_id = LEAST(OLD.blocker_id, OLD.blocked_id) 
           AND user2_id = GREATEST(OLD.blocker_id, OLD.blocked_id))
       OR (user1_id = LEAST(OLD.user1_id, OLD.user2_id) 
           AND user2_id = GREATEST(OLD.user1_id, OLD.user2_id));
    
    RETURN OLD;
END;
$$ language 'plpgsql';

-- Триггер для удаления дружбы при блокировке
CREATE TRIGGER remove_friendship_on_block
    AFTER INSERT ON user_blocks
    FOR EACH ROW
    EXECUTE FUNCTION remove_friendship();

-- Триггер для удаления дружбы при удалении записи из friendships
CREATE TRIGGER remove_friendship_trigger
    AFTER DELETE ON friendships
    FOR EACH ROW
    EXECUTE FUNCTION remove_friendship();

-- Функция для поиска друзей пользователя
CREATE OR REPLACE FUNCTION get_user_friends(p_user_id UUID)
RETURNS TABLE (
    friend_id UUID,
    friend_username VARCHAR,
    friend_email VARCHAR,
    friend_first_name VARCHAR,
    friend_last_name VARCHAR,
    friend_avatar_url VARCHAR,
    friend_status user_status,
    friendship_created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN f.user1_id = p_user_id THEN f.user2_id
            ELSE f.user1_id
        END as friend_id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.avatar_url,
        u.status,
        f.created_at
    FROM friendships f
    JOIN users u ON (
        CASE 
            WHEN f.user1_id = p_user_id THEN f.user2_id
            ELSE f.user1_id
        END = u.id
    )
    WHERE f.user1_id = p_user_id OR f.user2_id = p_user_id;
END;
$$ language 'plpgsql';

-- Добавление комментариев
COMMENT ON TABLE friend_requests IS 'Таблица заявок в друзья';
COMMENT ON COLUMN friend_requests.sender_id IS 'ID пользователя, отправившего заявку';
COMMENT ON COLUMN friend_requests.receiver_id IS 'ID пользователя, получившего заявку';
COMMENT ON COLUMN friend_requests.status IS 'Статус заявки';
COMMENT ON COLUMN friend_requests.message IS 'Сообщение при отправке заявки';
COMMENT ON COLUMN friend_requests.responded_at IS 'Время ответа на заявку';

COMMENT ON TABLE friendships IS 'Таблица установленных дружеских связей';
COMMENT ON COLUMN friendships.user1_id IS 'ID первого друга (всегда меньше user2_id)';
COMMENT ON COLUMN friendships.user2_id IS 'ID второго друга (всегда больше user1_id)';

COMMENT ON TABLE user_blocks IS 'Таблица заблокированных пользователей';
COMMENT ON COLUMN user_blocks.blocker_id IS 'ID пользователя, который блокирует';
COMMENT ON COLUMN user_blocks.blocked_id IS 'ID заблокированного пользователя';
COMMENT ON COLUMN user_blocks.reason IS 'Причина блокировки';