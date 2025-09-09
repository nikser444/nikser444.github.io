-- Миграция: Создание таблиц для системы звонков
-- Файл: 005_create_calls_table.sql

-- Создание enum для типа звонка
CREATE TYPE call_type AS ENUM ('audio', 'video', 'screen_share', 'conference');

-- Создание enum для статуса звонка
CREATE TYPE call_status AS ENUM ('initiating', 'ringing', 'active', 'ended', 'missed', 'declined', 'failed');

-- Создание enum для причины завершения звонка
CREATE TYPE call_end_reason AS ENUM ('normal', 'declined', 'missed', 'network_error', 'busy', 'cancelled');

-- Создание основной таблицы звонков
CREATE TABLE IF NOT EXISTS calls (
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
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    network_info JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    is_recorded BOOLEAN DEFAULT FALSE,
    recording_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы участников звонка
CREATE TABLE IF NOT EXISTS call_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER DEFAULT 0,
    is_muted BOOLEAN DEFAULT FALSE,
    is_video_enabled BOOLEAN DEFAULT TRUE,
    is_screen_sharing BOOLEAN DEFAULT FALSE,
    connection_quality INTEGER CHECK (connection_quality >= 1 AND connection_quality <= 5),
    status VARCHAR(20) DEFAULT 'invited', -- invited, joined, left, kicked
    
    CONSTRAINT unique_call_participant UNIQUE (call_id, user_id)
);

-- Создание таблицы для истории событий звонка
CREATE TABLE IF NOT EXISTS call_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL, -- join, leave, mute, unmute, enable_video, disable_video, etc.
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы для WebRTC сессий
CREATE TABLE IF NOT EXISTS webrtc_sessions (
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

-- Создание индексов для таблицы calls
CREATE INDEX idx_calls_caller_id ON calls(caller_id);
CREATE INDEX idx_calls_type ON calls(type);
CREATE INDEX idx_calls_status ON calls(status);
CREATE INDEX idx_calls_started_at ON calls(started_at);
CREATE INDEX idx_calls_chat_id ON calls(chat_id);
CREATE INDEX idx_calls_ended_at ON calls(ended_at);

-- Создание индексов для таблицы call_participants
CREATE INDEX idx_call_participants_call_id ON call_participants(call_id);
CREATE INDEX idx_call_participants_user_id ON call_participants(user_id);
CREATE INDEX idx_call_participants_joined_at ON call_participants(joined_at);
CREATE INDEX idx_call_participants_status ON call_participants(status);

-- Создание индексов для таблицы call_events
CREATE INDEX idx_call_events_call_id ON call_events(call_id);
CREATE INDEX idx_call_events_user_id ON call_events(user_id);
CREATE INDEX idx_call_events_type ON call_events(event_type);
CREATE INDEX idx_call_events_created_at ON call_events(created_at);

-- Создание индексов для таблицы webrtc_sessions
CREATE INDEX idx_webrtc_sessions_call_id ON webrtc_sessions(call_id);
CREATE INDEX idx_webrtc_sessions_user_id ON webrtc_sessions(user_id);
CREATE INDEX idx_webrtc_sessions_peer_connection ON webrtc_sessions(peer_connection_id);

-- Создание триггеров для автоматического обновления updated_at
CREATE TRIGGER update_calls_updated_at 
    BEFORE UPDATE ON calls 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webrtc_sessions_updated_at 
    BEFORE UPDATE ON webrtc_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Функция для автоматического расчета длительности звонка
CREATE OR REPLACE FUNCTION calculate_call_duration()
RETURNS TRIGGER AS $
BEGIN
    -- Обновляем общую длительность звонка
    IF NEW.ended_at IS NOT NULL AND NEW.answered_at IS NOT NULL THEN
        NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.ended_at - NEW.answered_at))::INTEGER;
    END IF;
    
    RETURN NEW;
END;
$ language 'plpgsql'; для расчета длительности звонка
CREATE TRIGGER calculate_call_duration_trigger
    BEFORE UPDATE ON calls
    FOR EACH ROW
    EXECUTE FUNCTION calculate_call_duration();

-- Функция для автоматического расчета длительности участия в звонке
CREATE OR REPLACE FUNCTION calculate_participant_duration()
RETURNS TRIGGER AS $
BEGIN
    -- Обновляем длительность участия в звонке
    IF NEW.left_at IS NOT NULL AND NEW.joined_at IS NOT NULL THEN
        NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.left_at - NEW.joined_at))::INTEGER;
    END IF;
    
    RETURN NEW;
END;
$ language 'plpgsql';

-- Создание триггера для расчета длительности участия
CREATE TRIGGER calculate_participant_duration_trigger
    BEFORE UPDATE ON call_participants
    FOR EACH ROW
    EXECUTE FUNCTION calculate_participant_duration();

-- Функция для автоматического создания события звонка
CREATE OR REPLACE FUNCTION log_call_event()
RETURNS TRIGGER AS $
BEGIN
    -- Логируем изменение статуса звонка
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO call_events (call_id, event_type, event_data)
        VALUES (
            NEW.id,
            'status_changed',
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'timestamp', CURRENT_TIMESTAMP
            )
        );
    END IF;
    
    -- Логируем создание звонка
    IF TG_OP = 'INSERT' THEN
        INSERT INTO call_events (call_id, user_id, event_type, event_data)
        VALUES (
            NEW.id,
            NEW.caller_id,
            'call_initiated',
            jsonb_build_object(
                'call_type', NEW.type,
                'timestamp', NEW.started_at
            )
        );
    END IF;
    
    RETURN NEW;
END;
$ language 'plpgsql';

-- Создание триггера для логирования событий звонка
CREATE TRIGGER log_call_event_trigger
    AFTER INSERT OR UPDATE ON calls
    FOR EACH ROW
    EXECUTE FUNCTION log_call_event();

-- Функция для логирования событий участников
CREATE OR REPLACE FUNCTION log_participant_event()
RETURNS TRIGGER AS $
BEGIN
    -- Логируем присоединение к звонку
    IF TG_OP = 'INSERT' THEN
        INSERT INTO call_events (call_id, user_id, event_type, event_data)
        VALUES (
            NEW.call_id,
            NEW.user_id,
            'participant_joined',
            jsonb_build_object(
                'joined_at', NEW.joined_at,
                'is_video_enabled', NEW.is_video_enabled
            )
        );
    END IF;
    
    -- Логируем покидание звонка
    IF TG_OP = 'UPDATE' AND OLD.left_at IS NULL AND NEW.left_at IS NOT NULL THEN
        INSERT INTO call_events (call_id, user_id, event_type, event_data)
        VALUES (
            NEW.call_id,
            NEW.user_id,
            'participant_left',
            jsonb_build_object(
                'left_at', NEW.left_at,
                'duration_seconds', NEW.duration_seconds
            )
        );
    END IF;
    
    -- Логируем изменения статуса (мут, видео, демонстрация экрана)
    IF TG_OP = 'UPDATE' THEN
        IF OLD.is_muted != NEW.is_muted THEN
            INSERT INTO call_events (call_id, user_id, event_type, event_data)
            VALUES (
                NEW.call_id,
                NEW.user_id,
                CASE WHEN NEW.is_muted THEN 'participant_muted' ELSE 'participant_unmuted' END,
                jsonb_build_object('timestamp', CURRENT_TIMESTAMP)
            );
        END IF;
        
        IF OLD.is_video_enabled != NEW.is_video_enabled THEN
            INSERT INTO call_events (call_id, user_id, event_type, event_data)
            VALUES (
                NEW.call_id,
                NEW.user_id,
                CASE WHEN NEW.is_video_enabled THEN 'video_enabled' ELSE 'video_disabled' END,
                jsonb_build_object('timestamp', CURRENT_TIMESTAMP)
            );
        END IF;
        
        IF OLD.is_screen_sharing != NEW.is_screen_sharing THEN
            INSERT INTO call_events (call_id, user_id, event_type, event_data)
            VALUES (
                NEW.call_id,
                NEW.user_id,
                CASE WHEN NEW.is_screen_sharing THEN 'screen_share_started' ELSE 'screen_share_stopped' END,
                jsonb_build_object('timestamp', CURRENT_TIMESTAMP)
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$ language 'plpgsql';

-- Создание триггера для логирования событий участников
CREATE TRIGGER log_participant_event_trigger
    AFTER INSERT OR UPDATE ON call_participants
    FOR EACH ROW
    EXECUTE FUNCTION log_participant_event();

-- Функция для получения активных звонков пользователя
CREATE OR REPLACE FUNCTION get_user_active_calls(p_user_id UUID)
RETURNS TABLE (
    call_id UUID,
    call_type call_type,
    call_status call_status,
    caller_username VARCHAR,
    started_at TIMESTAMP WITH TIME ZONE,
    participant_count BIGINT
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.type,
        c.status,
        u.username,
        c.started_at,
        (SELECT COUNT(*) FROM call_participants cp WHERE cp.call_id = c.id AND cp.status = 'joined')
    FROM calls c
    JOIN users u ON c.caller_id = u.id
    WHERE c.status IN ('initiating', 'ringing', 'active')
    AND (
        c.caller_id = p_user_id 
        OR EXISTS (
            SELECT 1 FROM call_participants cp 
            WHERE cp.call_id = c.id AND cp.user_id = p_user_id
        )
    );
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

-- Добавление ограничений
ALTER TABLE calls ADD CONSTRAINT check_duration_positive 
    CHECK (duration_seconds >= 0);

ALTER TABLE calls ADD CONSTRAINT check_answered_after_started 
    CHECK (answered_at IS NULL OR answered_at >= started_at);

ALTER TABLE calls ADD CONSTRAINT check_ended_after_started 
    CHECK (ended_at IS NULL OR ended_at >= started_at);

ALTER TABLE call_participants ADD CONSTRAINT check_participant_duration_positive 
    CHECK (duration_seconds >= 0);

ALTER TABLE call_participants ADD CONSTRAINT check_left_after_joined 
    CHECK (left_at IS NULL OR left_at >= joined_at);

-- Добавление комментариев
COMMENT ON TABLE calls IS 'Таблица звонков';
COMMENT ON COLUMN calls.id IS 'Уникальный идентификатор звонка';
COMMENT ON COLUMN calls.caller_id IS 'ID пользователя, инициировавшего звонок';
COMMENT ON COLUMN calls.type IS 'Тип звонка (аудио, видео, демонстрация экрана, конференция)';
COMMENT ON COLUMN calls.status IS 'Текущий статус звонка';
COMMENT ON COLUMN calls.chat_id IS 'ID чата, в рамках которого происходит звонок';
COMMENT ON COLUMN calls.duration_seconds IS 'Длительность звонка в секундах';
COMMENT ON COLUMN calls.quality_rating IS 'Оценка качества звонка от 1 до 5';
COMMENT ON COLUMN calls.network_info IS 'Информация о сети в формате JSON';
COMMENT ON COLUMN calls.is_recorded IS 'Записывался ли звонок';

COMMENT ON TABLE call_participants IS 'Таблица участников звонка';
COMMENT ON COLUMN call_participants.call_id IS 'ID звонка';
COMMENT ON COLUMN call_participants.user_id IS 'ID участника звонка';
COMMENT ON COLUMN call_participants.duration_seconds IS 'Длительность участия в звонке в секундах';
COMMENT ON COLUMN call_participants.connection_quality IS 'Качество соединения участника от 1 до 5';

COMMENT ON TABLE call_events IS 'Таблица событий звонка';
COMMENT ON COLUMN call_events.event_type IS 'Тип события (join, leave, mute, etc.)';
COMMENT ON COLUMN call_events.event_data IS 'Дополнительные данные события в JSON';

COMMENT ON TABLE webrtc_sessions IS 'Таблица WebRTC сессий';
COMMENT ON COLUMN webrtc_sessions.peer_connection_id IS 'ID peer connection';
COMMENT ON COLUMN webrtc_sessions.ice_connection_state IS 'Состояние ICE соединения';
COMMENT ON COLUMN webrtc_sessions.stats IS 'Статистика WebRTC соединения';