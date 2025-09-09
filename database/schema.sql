-- Полная схема базы данных мессенджера
-- Расположение: database/schema.sql
-- Описание: Полная схема БД для быстрого разворачивания

-- Создание базы данных (выполнять отдельно от основного скрипта)
-- CREATE DATABASE messenger_db WITH 
--   ENCODING 'UTF8' 
--   LC_COLLATE = 'en_US.UTF-8' 
--   LC_CTYPE = 'en_US.UTF-8'
--   TEMPLATE template0;
-- \c messenger_db;

-- Включение необходимых расширений PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext"; -- Для нечувствительных к регистру сравнений

-- ==============================================
-- СОЗДАНИЕ ENUM ТИПОВ
-- ==============================================

-- Статус пользователя
CREATE TYPE user_status AS ENUM ('online', 'offline', 'away', 'busy');

-- Роль пользователя в системе
CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');

-- Тип чата
CREATE TYPE chat_type AS ENUM ('private', 'group', 'channel');

-- Тип сообщения
CREATE TYPE message_type AS ENUM ('text', 'image', 'file', 'audio', 'video', 'system');

-- Статус доставки/прочтения сообщения
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');

-- Статус заявки в друзья
CREATE TYPE friend_request_status AS ENUM ('pending', 'accepted', 'declined', 'blocked');

-- Тип звонка
CREATE TYPE call_type AS ENUM ('audio', 'video', 'screen_share', 'conference');

-- Статус звонка
CREATE TYPE call_status AS ENUM ('initiating', 'ringing', 'active', 'ended', 'missed', 'declined', 'failed');

-- Причина завершения звонка
CREATE TYPE call_end_reason AS ENUM ('normal', 'declined', 'missed', 'network_error', 'busy', 'cancelled');

-- Роль участника в чате
CREATE TYPE chat_member_role AS ENUM ('owner', 'admin', 'moderator', 'member');

-- Статус участника чата
CREATE TYPE chat_member_status AS ENUM ('active', 'kicked', 'left', 'banned');

-- ==============================================
-- ОСНОВНЫЕ ТАБЛИЦЫ
-- ==============================================

-- Таблица пользователей
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email CITEXT NOT NULL UNIQUE,
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ограничения
    CONSTRAINT check_email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT check_username_length CHECK (LENGTH(username) >= 3),
    CONSTRAINT check_names_not_empty CHECK (LENGTH(TRIM(first_name)) > 0 AND LENGTH(TRIM(last_name)) > 0)
);

-- Таблица чатов
CREATE TABLE chats (
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
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ограничения
    CONSTRAINT check_private_chat_name CHECK (type != 'private' OR name IS NULL),
    CONSTRAINT check_group_chat_name CHECK (type = 'private' OR name IS NOT NULL),
    CONSTRAINT check_max_members_positive CHECK (max_members > 0 AND max_members <= 1000)
);

-- Таблица участников чатов
CREATE TABLE chat_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role chat_member_role NOT NULL DEFAULT 'member',
    status chat_member_status NOT NULL DEFAULT 'active',
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP WITH TIME ZONE,
    last_read_message_id UUID, -- Будет связан после создания таблицы messages
    last_read_at TIMESTAMP WITH TIME ZONE,
    is_notifications_enabled BOOLEAN DEFAULT TRUE,
    is_pinned BOOLEAN DEFAULT FALSE,
    custom_nickname VARCHAR(100),
    permissions JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ограничения
    CONSTRAINT unique_chat_member UNIQUE (chat_id, user_id),
    CONSTRAINT check_left_after_joined CHECK (left_at IS NULL OR left_at >= joined_at),
    CONSTRAINT check_last_read_after_joined CHECK (last_read_at IS NULL OR last_read_at >= joined_at)
);

-- Таблица сообщений
CREATE TABLE messages (
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ограничения
    CONSTRAINT check_content_not_empty CHECK (
        (type = 'text' AND content IS NOT NULL AND LENGTH(TRIM(content)) > 0) OR
        (type != 'text' AND (content IS NULL OR LENGTH(TRIM(content)) >= 0))
    ),
    CONSTRAINT check_file_data CHECK (
        (type IN ('image', 'file', 'audio', 'video') AND file_url IS NOT NULL) OR
        (type NOT IN ('image', 'file', 'audio', 'video'))
    ),
    CONSTRAINT check_file_size_positive CHECK (file_size IS NULL OR file_size >= 0),
    CONSTRAINT check_edited_after_created CHECK (edited_at IS NULL OR edited_at >= created_at),
    CONSTRAINT check_deleted_after_created CHECK (deleted_at IS NULL OR deleted_at >= created_at)
);

-- Добавление внешнего ключа для last_read_message_id после создания таблицы messages
ALTER TABLE chat_members 
ADD CONSTRAINT fk_chat_members_last_read_message 
FOREIGN KEY (last_read_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- Таблица статусов прочтения сообщений
CREATE TABLE message_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status message_status NOT NULL DEFAULT 'sent',
    status_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_message_user_status UNIQUE(message_id, user_id)
);

-- Таблица реакций на сообщения
CREATE TABLE message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_message_user_emoji UNIQUE(message_id, user_id, emoji),
    CONSTRAINT check_emoji_not_empty CHECK (LENGTH(TRIM(emoji)) > 0)
);

-- Таблица заявок в друзья
CREATE TABLE friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status friend_request_status NOT NULL DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Ограничения
    CONSTRAINT check_not_self_request CHECK (sender_id != receiver_id),
    CONSTRAINT unique_friend_request UNIQUE (sender_id, receiver_id),
    CONSTRAINT check_responded_after_created CHECK (responded_at IS NULL OR responded_at >= created_at)
);

-- Таблица установленных дружеских связей
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ограничения
    CONSTRAINT check_not_self_friendship CHECK (user1_id != user2_id),
    CONSTRAINT check_user_order CHECK (user1_id < user2_id), -- Для избежания дублирования
    CONSTRAINT unique_friendship UNIQUE (user1_id, user2_id)
);

-- Таблица заблокированных пользователей
CREATE TABLE user_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ограничения
    CONSTRAINT check_not_self_block CHECK (blocker_id != blocked_id),
    CONSTRAINT unique_user_block UNIQUE (blocker_id, blocked_id)
);

-- Таблица звонков
CREATE TABLE calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type call_type NOT NULL DEFAULT 'audio',
    status call_status NOT NULL DEFAULT 'initiating',
    chat_id UUID REFERENCES chats(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    answered_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER DEFAULT 0,
    end_reason call_end_reason,
    quality_rating INTEGER,
    network_info JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    is_recorded BOOLEAN DEFAULT FALSE,
    recording_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ограничения
    CONSTRAINT check_duration_positive CHECK (duration_seconds >= 0),
    CONSTRAINT check_quality_rating CHECK (quality_rating IS NULL OR (quality_rating >= 1 AND quality_rating <= 5)),
    CONSTRAINT check_answered_after_started CHECK (answered_at IS NULL OR answered_at >= started_at),
    CONSTRAINT check_ended_after_started CHECK (ended_at IS NULL OR ended_at >= started_at)
);

-- Таблица участников звонков
CREATE TABLE call_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER DEFAULT 0,
    is_muted BOOLEAN DEFAULT FALSE,
    is_video_enabled BOOLEAN DEFAULT TRUE,
    is_screen_sharing BOOLEAN DEFAULT FALSE,
    connection_quality INTEGER,
    status VARCHAR(20) DEFAULT 'invited',
    
    -- Ограничения
    CONSTRAINT unique_call_participant UNIQUE (call_id, user_id),
    CONSTRAINT check_participant_duration_positive CHECK (duration_seconds >= 0),
    CONSTRAINT check_connection_quality CHECK (connection_quality IS NULL OR (connection_quality >= 1 AND connection_quality <= 5)),
    CONSTRAINT check_left_after_joined CHECK (left_at IS NULL OR left_at >= joined_at)
);

-- Таблица событий звонков
CREATE TABLE call_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_event_type_not_empty CHECK (LENGTH(TRIM(event_type)) > 0)
);

-- Таблица WebRTC сессий
CREATE TABLE webrtc_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    peer_connection_id VARCHAR(255) NOT NULL,
    ice_connection_state VARCHAR(50),
    connection_state VARCHAR(50),
    signaling_state VARCHAR(50),
    local_description JSONB,
    remote_description JSONB,
    ice_candidates JSONB DEFAULT '[]',
    stats JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_webrtc_session UNIQUE (call_id, user_id)
);

-- Таблица истории изменений участников чатов
CREATE TABLE chat_member_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    old_role chat_member_role,
    new_role chat_member_role,
    old_status chat_member_status,
    new_status chat_member_status,
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_action_not_empty CHECK (LENGTH(TRIM(action)) > 0)
);

-- Таблица приглашений в чаты
CREATE TABLE chat_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    invitee_email CITEXT,
    invitation_code VARCHAR(100) UNIQUE,
    message TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    used_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ограничения
    CONSTRAINT check_invitee_specified CHECK (
        (invitee_id IS NOT NULL AND invitee_email IS NULL) OR
        (invitee_id IS NULL AND invitee_email IS NOT NULL)
    ),
    CONSTRAINT check_expires_in_future CHECK (expires_at IS NULL OR expires_at > created_at),
    CONSTRAINT check_used_date CHECK (used_at IS NULL OR used_at >= created_at)
);

-- ==============================================
-- СОЗДАНИЕ ИНДЕКСОВ ДЛЯ ОПТИМИЗАЦИИ ПРОИЗВОДИТЕЛЬНОСТИ
-- ==============================================

-- Индексы для таблицы users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_seen_at ON users(last_seen_at);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- Индексы для таблицы chats
CREATE INDEX idx_chats_type ON chats(type);
CREATE INDEX idx_chats_owner_id ON chats(owner_id);
CREATE INDEX idx_chats_created_at ON chats(created_at);
CREATE INDEX idx_chats_last_message_at ON chats(last_message_at DESC);
CREATE INDEX idx_chats_active ON chats(is_active) WHERE is_active = true;

-- Индексы для таблицы chat_members
CREATE INDEX idx_chat_members_chat_id ON chat_members(chat_id);
CREATE INDEX idx_chat_members_user_id ON chat_members(user_id);
CREATE INDEX idx_chat_members_role ON chat_members(role);
CREATE INDEX idx_chat_members_status ON chat_members(status);
CREATE INDEX idx_chat_members_joined_at ON chat_members(joined_at);
CREATE INDEX idx_chat_members_last_read ON chat_members(last_read_at);
CREATE INDEX idx_chat_members_active ON chat_members(chat_id, status) WHERE status = 'active';
CREATE INDEX idx_chat_members_pinned ON chat_members(user_id, is_pinned) WHERE is_pinned = true;

-- Индексы для таблицы messages
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_type ON messages(type);
CREATE INDEX idx_messages_reply_to_id ON messages(reply_to_id);
CREATE INDEX idx_messages_not_deleted ON messages(is_deleted) WHERE is_deleted = false;
CREATE INDEX idx_messages_chat_created ON messages(chat_id, created_at DESC);

-- Композитные индексы для частых запросов
CREATE INDEX idx_messages_chat_unread ON messages(chat_id, created_at DESC) WHERE is_deleted = false;

-- Индексы для таблицы message_status
CREATE INDEX idx_message_status_message_id ON message_status(message_id);
CREATE INDEX idx_message_status_user_id ON message_status(user_id);
CREATE INDEX idx_message_status_status ON message_status(status);

-- Индексы для таблицы message_reactions
CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user_id ON message_reactions(user_id);
CREATE INDEX idx_message_reactions_emoji ON message_reactions(emoji);

-- Индексы для системы друзей
CREATE INDEX idx_friend_requests_sender_id ON friend_requests(sender_id);
CREATE INDEX idx_friend_requests_receiver_id ON friend_requests(receiver_id);
CREATE INDEX idx_friend_requests_status ON friend_requests(status);
CREATE INDEX idx_friend_requests_created_at ON friend_requests(created_at);
CREATE INDEX idx_friend_requests_pending ON friend_requests(receiver_id, status) WHERE status = 'pending';

CREATE INDEX idx_friendships_user1_id ON friendships(user1_id);
CREATE INDEX idx_friendships_user2_id ON friendships(user2_id);
CREATE INDEX idx_friendships_created_at ON friendships(created_at);

CREATE INDEX idx_user_blocks_blocker_id ON user_blocks(blocker_id);
CREATE INDEX idx_user_blocks_blocked_id ON user_blocks(blocked_id);

-- Индексы для системы звонков
CREATE INDEX idx_calls_caller_id ON calls(caller_id);
CREATE INDEX idx_calls_type ON calls(type);
CREATE INDEX idx_calls_status ON calls(status);
CREATE INDEX idx_calls_started_at ON calls(started_at DESC);
CREATE INDEX idx_calls_chat_id ON calls(chat_id);
CREATE INDEX idx_calls_active ON calls(status) WHERE status IN ('initiating', 'ringing', 'active');

CREATE INDEX idx_call_participants_call_id ON call_participants(call_id);
CREATE INDEX idx_call_participants_user_id ON call_participants(user_id);
CREATE INDEX idx_call_participants_status ON call_participants(status);

CREATE INDEX idx_call_events_call_id ON call_events(call_id);
CREATE INDEX idx_call_events_user_id ON call_events(user_id);
CREATE INDEX idx_call_events_type ON call_events(event_type);
CREATE INDEX idx_call_events_created_at ON call_events(created_at DESC);

CREATE INDEX idx_webrtc_sessions_call_id ON webrtc_sessions(call_id);
CREATE INDEX idx_webrtc_sessions_user_id ON webrtc_sessions(user_id);
CREATE INDEX idx_webrtc_sessions_peer_id ON webrtc_sessions(peer_connection_id);

-- Индексы для истории и приглашений
CREATE INDEX idx_chat_member_history_chat_id ON chat_member_history(chat_id);
CREATE INDEX idx_chat_member_history_user_id ON chat_member_history(user_id);
CREATE INDEX idx_chat_member_history_action ON chat_member_history(action);
CREATE INDEX idx_chat_member_history_created_at ON chat_member_history(created_at DESC);

CREATE INDEX idx_chat_invitations_chat_id ON chat_invitations(chat_id);
CREATE INDEX idx_chat_invitations_inviter_id ON chat_invitations(inviter_id);
CREATE INDEX idx_chat_invitations_invitee_id ON chat_invitations(invitee_id);
CREATE INDEX idx_chat_invitations_code ON chat_invitations(invitation_code);
CREATE INDEX idx_chat_invitations_expires_at ON chat_invitations(expires_at);
CREATE INDEX idx_chat_invitations_active ON chat_invitations(chat_id, is_used, expires_at) 
    WHERE is_used = false AND expires_at > CURRENT_TIMESTAMP;

-- ==============================================
-- СОЗДАНИЕ ФУНКЦИЙ И ТРИГГЕРОВ
-- ==============================================

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at 
    BEFORE UPDATE ON chats 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_members_updated_at 
    BEFORE UPDATE ON chat_members 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friend_requests_updated_at 
    BEFORE UPDATE ON friend_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calls_updated_at 
    BEFORE UPDATE ON calls 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webrtc_sessions_updated_at 
    BEFORE UPDATE ON webrtc_sessions 
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

-- Функция для создания дружбы при принятии заявки
CREATE OR REPLACE FUNCTION create_friendship_on_accept()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        INSERT INTO friendships (user1_id, user2_id)
        VALUES (
            LEAST(NEW.sender_id, NEW.receiver_id),
            GREATEST(NEW.sender_id, NEW.receiver_id)
        )
        ON CONFLICT (user1_id, user2_id) DO NOTHING;
        
        NEW.responded_at = CURRENT_TIMESTAMP;
    END IF;
    
    IF NEW.status IN ('declined', 'blocked') AND OLD.status = 'pending' THEN
        NEW.responded_at = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для создания дружбы
CREATE TRIGGER create_friendship_on_accept_trigger
    BEFORE UPDATE ON friend_requests
    FOR EACH ROW
    EXECUTE FUNCTION create_friendship_on_accept();

-- Функция для автоматического создания участников чата
CREATE OR REPLACE FUNCTION create_chat_members_on_chat_creation()
RETURNS TRIGGER AS $$
BEGIN
    -- Для приватных чатов добавляем создателя как участника
    IF NEW.type = 'private' AND NEW.owner_id IS NOT NULL THEN
        INSERT INTO chat_members (chat_id, user_id, role, added_by)
        VALUES (NEW.id, NEW.owner_id, 'member', NEW.owner_id)
        ON CONFLICT (chat_id, user_id) DO NOTHING;
    END IF;
    
    -- Для групповых чатов и каналов добавляем создателя как владельца
    IF NEW.type IN ('group', 'channel') AND NEW.owner_id IS NOT NULL THEN
        INSERT INTO chat_members (chat_id, user_id, role, added_by)
        VALUES (NEW.id, NEW.owner_id, 'owner', NEW.owner_id)
        ON CONFLICT (chat_id, user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для создания участников чата
CREATE TRIGGER create_chat_members_on_chat_creation_trigger
    AFTER INSERT ON chats
    FOR EACH ROW
    EXECUTE FUNCTION create_chat_members_on_chat_creation();

-- ==============================================
-- ПОЛЕЗНЫЕ ФУНКЦИИ ДЛЯ РАБОТЫ С ДАННЫМИ
-- ==============================================

-- Функция для получения друзей пользователя
CREATE OR REPLACE FUNCTION get_user_friends(p_user_id UUID)
RETURNS TABLE (
    friend_id UUID,
    friend_username VARCHAR,
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
    WHERE (f.user1_id = p_user_id OR f.user2_id = p_user_id)
    AND u.is_active = true
    ORDER BY u.first_name, u.last_name;
END;
$$ language 'plpgsql';

-- Функция для получения чатов пользователя
CREATE OR REPLACE FUNCTION get_user_chats(p_user_id UUID)
RETURNS TABLE (
    chat_id UUID,
    chat_name VARCHAR,
    chat_type chat_type,
    chat_avatar_url VARCHAR,
    member_role chat_member_role,
    last_message_at TIMESTAMP WITH TIME ZONE,
    unread_count BIGINT,
    is_pinned BOOLEAN,
    is_notifications_enabled BOOLEAN
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        CASE 
            WHEN c.type = 'private' THEN 
                (SELECT u.first_name || ' ' || u.last_name 
                 FROM chat_members cm2 
                 JOIN users u ON cm2.user_id = u.id 
                 WHERE cm2.chat_id = c.id AND cm2.user_id != p_user_id AND cm2.status = 'active'
                 LIMIT 1)
            ELSE c.name
        END as chat_name,
        c.type,
        CASE 
            WHEN c.type = 'private' THEN 
                (SELECT u.avatar_url 
                 FROM chat_members cm2 
                 JOIN users u ON cm2.user_id = u.id 
                 WHERE cm2.chat_id = c.id AND cm2.user_id != p_user_id AND cm2.status = 'active'
                 LIMIT 1)
            ELSE c.avatar_url
        END as chat_avatar_url,
        cm.role,
        c.last_message_at,
        COALESCE((
            SELECT COUNT(*) 
            FROM messages m 
            WHERE m.chat_id = c.id 
            AND m.created_at > COALESCE(cm.last_read_at, cm.joined_at)
            AND m.sender_id != p_user_id
            AND m.is_deleted = false
        ), 0) as unread_count,
        cm.is_pinned,
        cm.is_notifications_enabled
    FROM chats c
    JOIN chat_members cm ON c.id = cm.chat_id
    WHERE cm.user_id = p_user_id 
    AND cm.status = 'active' 
    AND c.is_active = true
    ORDER BY 
        cm.is_pinned DESC,
        c.last_message_at DESC;
END;
$ language 'plpgsql';

-- Функция для проверки прав участника чата
CREATE OR REPLACE FUNCTION check_chat_permission(
    p_user_id UUID, 
    p_chat_id UUID, 
    p_permission VARCHAR
) RETURNS BOOLEAN AS $
DECLARE
    user_role chat_member_role;
    chat_type_val chat_type;
BEGIN
    -- Получаем роль пользователя и тип чата
    SELECT cm.role, c.type 
    INTO user_role, chat_type_val
    FROM chat_members cm
    JOIN chats c ON cm.chat_id = c.id
    WHERE cm.user_id = p_user_id 
    AND cm.chat_id = p_chat_id 
    AND cm.status = 'active';
    
    -- Если пользователь не найден в чате
    IF user_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Проверяем разрешения в зависимости от роли
    CASE p_permission
        WHEN 'send_message' THEN
            RETURN user_role IN ('owner', 'admin', 'moderator', 'member');
        WHEN 'delete_message' THEN
            RETURN user_role IN ('owner', 'admin', 'moderator');
        WHEN 'add_member' THEN
            RETURN user_role IN ('owner', 'admin');
        WHEN 'remove_member' THEN
            RETURN user_role IN ('owner', 'admin');
        WHEN 'change_settings' THEN
            RETURN user_role IN ('owner', 'admin');
        WHEN 'manage_admins' THEN
            RETURN user_role = 'owner';
        WHEN 'initiate_call' THEN
            RETURN user_role IN ('owner', 'admin', 'moderator', 'member');
        ELSE
            RETURN FALSE;
    END CASE;
END;
$ language 'plpgsql';

-- Функция для получения активных звонков пользователя
CREATE OR REPLACE FUNCTION get_user_active_calls(p_user_id UUID)
RETURNS TABLE (
    call_id UUID,
    call_type call_type,
    call_status call_status,
    caller_id UUID,
    caller_username VARCHAR,
    started_at TIMESTAMP WITH TIME ZONE,
    participant_count BIGINT,
    is_caller BOOLEAN
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.type,
        c.status,
        c.caller_id,
        u.username,
        c.started_at,
        (SELECT COUNT(*) FROM call_participants cp WHERE cp.call_id = c.id AND cp.status = 'joined'),
        (c.caller_id = p_user_id) as is_caller
    FROM calls c
    JOIN users u ON c.caller_id = u.id
    WHERE c.status IN ('initiating', 'ringing', 'active')
    AND (
        c.caller_id = p_user_id 
        OR EXISTS (
            SELECT 1 FROM call_participants cp 
            WHERE cp.call_id = c.id AND cp.user_id = p_user_id
        )
    )
    ORDER BY c.started_at DESC;
END;
$ language 'plpgsql';

-- Функция для получения истории звонков пользователя
CREATE OR REPLACE FUNCTION get_user_call_history(p_user_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
    call_id UUID,
    call_type call_type,
    call_status call_status,
    caller_id UUID,
    caller_username VARCHAR,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    participant_count BIGINT,
    was_caller BOOLEAN
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.type,
        c.status,
        c.caller_id,
        u.username,
        c.started_at,
        c.ended_at,
        c.duration_seconds,
        (SELECT COUNT(*) FROM call_participants cp WHERE cp.call_id = c.id),
        (c.caller_id = p_user_id) as was_caller
    FROM calls c
    JOIN users u ON c.caller_id = u.id
    WHERE c.caller_id = p_user_id 
       OR EXISTS (
           SELECT 1 FROM call_participants cp 
           WHERE cp.call_id = c.id AND cp.user_id = p_user_id
       )
    ORDER BY c.started_at DESC
    LIMIT p_limit;
END;
$ language 'plpgsql';

-- Функция для получения участников чата
CREATE OR REPLACE FUNCTION get_chat_members(p_chat_id UUID)
RETURNS TABLE (
    member_id UUID,
    user_id UUID,
    username VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    avatar_url VARCHAR,
    role chat_member_role,
    status chat_member_status,
    joined_at TIMESTAMP WITH TIME ZONE,
    last_read_at TIMESTAMP WITH TIME ZONE,
    is_online BOOLEAN
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        cm.id,
        cm.user_id,
        u.username,
        u.first_name,
        u.last_name,
        u.avatar_url,
        cm.role,
        cm.status,
        cm.joined_at,
        cm.last_read_at,
        (u.status = 'online') as is_online
    FROM chat_members cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.chat_id = p_chat_id AND cm.status = 'active'
    ORDER BY 
        CASE cm.role 
            WHEN 'owner' THEN 1
            WHEN 'admin' THEN 2
            WHEN 'moderator' THEN 3
            ELSE 4
        END,
        cm.joined_at ASC;
END;
$ language 'plpgsql';

-- Функция для поиска пользователей
CREATE OR REPLACE FUNCTION search_users(
    p_search_term VARCHAR,
    p_current_user_id UUID,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    user_id UUID,
    username VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    avatar_url VARCHAR,
    is_friend BOOLEAN,
    is_blocked BOOLEAN
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.avatar_url,
        EXISTS(
            SELECT 1 FROM friendships f 
            WHERE (f.user1_id = p_current_user_id AND f.user2_id = u.id)
               OR (f.user2_id = p_current_user_id AND f.user1_id = u.id)
        ) as is_friend,
        EXISTS(
            SELECT 1 FROM user_blocks ub 
            WHERE ub.blocker_id = p_current_user_id AND ub.blocked_id = u.id
        ) as is_blocked
    FROM users u
    WHERE u.id != p_current_user_id
    AND u.is_active = true
    AND (
        u.username ILIKE '%' || p_search_term || '%'
        OR u.first_name ILIKE '%' || p_search_term || '%'
        OR u.last_name ILIKE '%' || p_search_term || '%'
        OR u.email ILIKE '%' || p_search_term || '%'
    )
    -- Исключаем заблокированных пользователей
    AND NOT EXISTS(
        SELECT 1 FROM user_blocks ub2 
        WHERE ub2.blocked_id = p_current_user_id AND ub2.blocker_id = u.id
    )
    ORDER BY 
        -- Сначала друзья
        EXISTS(
            SELECT 1 FROM friendships f 
            WHERE (f.user1_id = p_current_user_id AND f.user2_id = u.id)
               OR (f.user2_id = p_current_user_id AND f.user1_id = u.id)
        ) DESC,
        -- Потом по релевантности поиска
        CASE 
            WHEN u.username ILIKE p_search_term || '%' THEN 1
            WHEN u.first_name ILIKE p_search_term || '%' THEN 2
            WHEN u.last_name ILIKE p_search_term || '%' THEN 3
            ELSE 4
        END,
        u.first_name, u.last_name
    LIMIT p_limit;
END;
$ language 'plpgsql';

-- ==============================================
-- ПРЕДСТАВЛЕНИЯ ДЛЯ УПРОЩЕНИЯ ЗАПРОСОВ
-- ==============================================

-- Представление для сообщений с информацией об отправителе
CREATE VIEW message_details AS
SELECT 
    m.*,
    u.username as sender_username,
    u.first_name as sender_first_name,
    u.last_name as sender_last_name,
    u.avatar_url as sender_avatar_url,
    rm.content as reply_content,
    ru.username as reply_sender_username
FROM messages m
LEFT JOIN users u ON m.sender_id = u.id
LEFT JOIN messages rm ON m.reply_to_id = rm.id
LEFT JOIN users ru ON rm.sender_id = ru.id
WHERE m.is_deleted = false;

-- Представление для статистики чатов
CREATE VIEW chat_statistics AS
SELECT 
    c.id as chat_id,
    c.name as chat_name,
    c.type as chat_type,
    COUNT(DISTINCT cm.user_id) FILTER (WHERE cm.status = 'active') as active_members_count,
    COUNT(DISTINCT m.id) FILTER (WHERE m.created_at > CURRENT_DATE - INTERVAL '30 days') as messages_last_30_days,
    MAX(m.created_at) as last_message_date
FROM chats c
LEFT JOIN chat_members cm ON c.id = cm.chat_id
LEFT JOIN messages m ON c.id = m.chat_id AND m.is_deleted = false
WHERE c.is_active = true
GROUP BY c.id, c.name, c.type;

-- Представление для активности пользователей
CREATE VIEW user_activity AS
SELECT 
    u.id as user_id,
    u.username,
    u.status,
    u.last_seen_at,
    COUNT(DISTINCT m.id) FILTER (WHERE m.created_at > CURRENT_DATE - INTERVAL '7 days') as messages_last_week,
    COUNT(DISTINCT c.id) FILTER (WHERE c.started_at > CURRENT_DATE - INTERVAL '7 days') as calls_last_week,
    COUNT(DISTINCT cm.chat_id) FILTER (WHERE cm.status = 'active') as active_chats_count
FROM users u
LEFT JOIN messages m ON u.id = m.sender_id AND m.is_deleted = false
LEFT JOIN calls c ON u.id = c.caller_id
LEFT JOIN chat_members cm ON u.id = cm.user_id
WHERE u.is_active = true
GROUP BY u.id, u.username, u.status, u.last_seen_at;

-- ==============================================
-- НАСТРОЙКА ПРОИЗВОДИТЕЛЬНОСТИ
-- ==============================================

-- Настройка автовакуума для таблиц с высокой нагрузкой
ALTER TABLE messages SET (
    autovacuum_vacuum_scale_factor = 0.05,
    autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE message_status SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE call_events SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);

-- ==============================================
-- НАЧАЛЬНЫЕ ДАННЫЕ
-- ==============================================

-- Создание системного пользователя
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    first_name, 
    last_name, 
    role, 
    is_verified, 
    is_active,
    status
) VALUES (
    'system',
    'system@messenger.local',
    '$2b$10$system_placeholder_hash_replace_in_production',
    'System',
    'Bot',
    'admin',
    true,
    true,
    'online'
) ON CONFLICT (email) DO NOTHING;

-- ==============================================
-- ПОЛИТИКИ БЕЗОПАСНОСТИ (RLS)
-- ==============================================

-- Включение Row Level Security для sensitive таблиц
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Примеры политик (раскомментировать при необходимости)
-- CREATE POLICY users_own_data ON users FOR ALL TO authenticated USING (id = current_user_id());
-- CREATE POLICY messages_chat_members ON messages FOR SELECT TO authenticated 
--   USING (EXISTS(SELECT 1 FROM chat_members WHERE chat_id = messages.chat_id AND user_id = current_user_id() AND status = 'active'));

-- ==============================================
-- КОММЕНТАРИИ К СХЕМЕ
-- ==============================================

COMMENT ON SCHEMA public IS 'Схема базы данных мессенджера с поддержкой чатов, звонков, видеоконференций и системы друзей';

-- Комментарии к основным таблицам
COMMENT ON TABLE users IS 'Пользователи системы с профилями и статусами';
COMMENT ON TABLE chats IS 'Чаты: приватные, групповые и каналы';
COMMENT ON TABLE chat_members IS 'Участники чатов с ролями и правами';
COMMENT ON TABLE messages IS 'Сообщения всех типов с поддержкой файлов';
COMMENT ON TABLE message_status IS 'Статусы доставки и прочтения сообщений';
COMMENT ON TABLE message_reactions IS 'Реакции пользователей на сообщения';
COMMENT ON TABLE friend_requests IS 'Заявки в друзья с различными статусами';
COMMENT ON TABLE friendships IS 'Установленные дружеские связи';
COMMENT ON TABLE user_blocks IS 'Список заблокированных пользователей';
COMMENT ON TABLE calls IS 'Аудио/видео звонки и конференции';
COMMENT ON TABLE call_participants IS 'Участники звонков с детальной информацией';
COMMENT ON TABLE call_events IS 'История событий во время звонков';
COMMENT ON TABLE webrtc_sessions IS 'Технические данные WebRTC соединений';
COMMENT ON TABLE chat_member_history IS 'История изменений участников чатов';
COMMENT ON TABLE chat_invitations IS 'Приглашения в чаты с кодами доступа';

-- Комментарии к представлениям
COMMENT ON VIEW message_details IS 'Сообщения с информацией об отправителях';
COMMENT ON VIEW chat_statistics IS 'Статистика активности чатов';
COMMENT ON VIEW user_activity IS 'Активность пользователей в системе';

-- Финализация
COMMIT;

-- ==============================================
-- ИНСТРУКЦИИ ПО РАЗВЕРТЫВАНИЮ
-- ==============================================

/*
ИНСТРУКЦИЯ ПО РАЗВЕРТЫВАНИЮ:

1. Создание базы данных:
   createdb messenger_db -E UTF8 -l en_US.UTF-8

2. Подключение к базе:
   psql -d messenger_db

3. Выполнение схемы:
   \i database/schema.sql

4. Проверка создания таблиц:
   \dt

5. Проверка функций:
   \df

ПРИМЕЧАНИЯ:
- Замените placeholder хеши паролей на реальные в production
- Настройте подключения и пулы соединений
- Рассмотрите партиционирование для больших таблиц
- Настройте мониторинг производительности
- Создайте регулярные бэкапы

РЕКОМЕНДУЕМЫЕ НАСТРОЙКИ POSTGRESQL:
- shared_buffers = 256MB (или 25% от RAM)
- work_mem = 4MB
- maintenance_work_mem = 64MB
- effective_cache_size = 1GB (или 75% от RAM)
- random_page_cost = 1.1 (для SSD)
*/