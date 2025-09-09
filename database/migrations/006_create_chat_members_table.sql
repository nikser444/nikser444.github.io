-- Миграция: Создание таблицы участников чатов
-- Файл: 006_create_chat_members_table.sql

-- Создание enum для роли участника в чате
CREATE TYPE chat_member_role AS ENUM ('owner', 'admin', 'moderator', 'member');

-- Создание enum для статуса участника
CREATE TYPE chat_member_status AS ENUM ('active', 'kicked', 'left', 'banned');

-- Создание основной таблицы участников чатов
CREATE TABLE IF NOT EXISTS chat_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role chat_member_role NOT NULL DEFAULT 'member',
    status chat_member_status NOT NULL DEFAULT 'active',
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP WITH TIME ZONE,
    last_read_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    last_read_at TIMESTAMP WITH TIME ZONE,
    is_notifications_enabled BOOLEAN DEFAULT TRUE,
    is_pinned BOOLEAN DEFAULT FALSE,
    custom_nickname VARCHAR(100),
    permissions JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Уникальность: один пользователь может быть участником чата только один раз
    CONSTRAINT unique_chat_member UNIQUE (chat_id, user_id)
);

-- Создание таблицы для истории изменений участников
CREATE TABLE IF NOT EXISTS chat_member_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- added, removed, role_changed, etc.
    old_role chat_member_role,
    new_role chat_member_role,
    old_status chat_member_status,
    new_status chat_member_status,
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы для приглашений в чат
CREATE TABLE IF NOT EXISTS chat_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    invitee_email VARCHAR(100),
    invitation_code VARCHAR(100) UNIQUE,
    message TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    used_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ограничение: должен быть указан либо invitee_id, либо invitee_email
    CONSTRAINT check_invitee_specified CHECK (
        (invitee_id IS NOT NULL AND invitee_email IS NULL) OR
        (invitee_id IS NULL AND invitee_email IS NOT NULL)
    )
);

-- Создание индексов для таблицы chat_members
CREATE INDEX idx_chat_members_chat_id ON chat_members(chat_id);
CREATE INDEX idx_chat_members_user_id ON chat_members(user_id);
CREATE INDEX idx_chat_members_role ON chat_members(role);
CREATE INDEX idx_chat_members_status ON chat_members(status);
CREATE INDEX idx_chat_members_joined_at ON chat_members(joined_at);
CREATE INDEX idx_chat_members_last_read ON chat_members(last_read_at);
CREATE INDEX idx_chat_members_active ON chat_members(chat_id, status) WHERE status = 'active';
CREATE INDEX idx_chat_members_pinned ON chat_members(user_id, is_pinned) WHERE is_pinned = true;

-- Создание индексов для таблицы chat_member_history
CREATE INDEX idx_chat_member_history_chat_id ON chat_member_history(chat_id);
CREATE INDEX idx_chat_member_history_user_id ON chat_member_history(user_id);
CREATE INDEX idx_chat_member_history_action ON chat_member_history(action);
CREATE INDEX idx_chat_member_history_created_at ON chat_member_history(created_at);
CREATE INDEX idx_chat_member_history_performed_by ON chat_member_history(performed_by);

-- Создание индексов для таблицы chat_invitations
CREATE INDEX idx_chat_invitations_chat_id ON chat_invitations(chat_id);
CREATE INDEX idx_chat_invitations_inviter_id ON chat_invitations(inviter_id);
CREATE INDEX idx_chat_invitations_invitee_id ON chat_invitations(invitee_id);
CREATE INDEX idx_chat_invitations_code ON chat_invitations(invitation_code);
CREATE INDEX idx_chat_invitations_expires_at ON chat_invitations(expires_at);
CREATE INDEX idx_chat_invitations_active ON chat_invitations(chat_id, is_used, expires_at) 
    WHERE is_used = false AND expires_at > CURRENT_TIMESTAMP;

-- Создание триггеров для автоматического обновления updated_at
CREATE TRIGGER update_chat_members_updated_at 
    BEFORE UPDATE ON chat_members 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Функция для автоматического логирования изменений участников
CREATE OR REPLACE FUNCTION log_chat_member_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Логируем добавление участника
    IF TG_OP = 'INSERT' THEN
        INSERT INTO chat_member_history (chat_id, user_id, action, new_role, new_status, performed_by)
        VALUES (NEW.chat_id, NEW.user_id, 'added', NEW.role, NEW.status, NEW.added_by);
        RETURN NEW;
    END IF;
    
    -- Логируем изменения
    IF TG_OP = 'UPDATE' THEN
        -- Изменение роли
        IF OLD.role != NEW.role THEN
            INSERT INTO chat_member_history (chat_id, user_id, action, old_role, new_role, performed_by)
            VALUES (NEW.chat_id, NEW.user_id, 'role_changed', OLD.role, NEW.role, NEW.added_by);
        END IF;
        
        -- Изменение статуса
        IF OLD.status != NEW.status THEN
            INSERT INTO chat_member_history (chat_id, user_id, action, old_status, new_status, performed_by)
            VALUES (NEW.chat_id, NEW.user_id, 'status_changed', OLD.status, NEW.status, NEW.added_by);
            
            -- Обновляем время выхода, если участник покинул чат
            IF NEW.status IN ('left', 'kicked', 'banned') AND OLD.status = 'active' THEN
                NEW.left_at = CURRENT_TIMESTAMP;
            END IF;
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Логируем удаление участника
    IF TG_OP = 'DELETE' THEN
        INSERT INTO chat_member_history (chat_id, user_id, action, old_role, old_status)
        VALUES (OLD.chat_id, OLD.user_id, 'removed', OLD.role, OLD.status);
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Создание триггера для логирования изменений участников
CREATE TRIGGER log_chat_member_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON chat_members
    FOR EACH ROW
    EXECUTE FUNCTION log_chat_member_changes();

-- Функция для обновления счетчика участников в чате
CREATE OR REPLACE FUNCTION update_chat_member_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Обновляем настройки чата с информацией о количестве участников
    IF TG_OP = 'INSERT' THEN
        UPDATE chats 
        SET settings = jsonb_set(
            COALESCE(settings, '{}'),
            '{member_count}',
            (SELECT COUNT(*)::text::jsonb FROM chat_members WHERE chat_id = NEW.chat_id AND status = 'active')
        )
        WHERE id = NEW.chat_id;
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        -- Если изменился статус участника
        IF OLD.status != NEW.status THEN
            UPDATE chats 
            SET settings = jsonb_set(
                COALESCE(settings, '{}'),
                '{member_count}',
                (SELECT COUNT(*)::text::jsonb FROM chat_members WHERE chat_id = NEW.chat_id AND status = 'active')
            )
            WHERE id = NEW.chat_id;
        END IF;
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        UPDATE chats 
        SET settings = jsonb_set(
            COALESCE(settings, '{}'),
            '{member_count}',
            (SELECT COUNT(*)::text::jsonb FROM chat_members WHERE chat_id = OLD.chat_id AND status = 'active')
        )
        WHERE id = OLD.chat_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Создание триггера для обновления счетчика участников
CREATE TRIGGER update_chat_member_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON chat_members
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_member_count();

-- Функция для автоматического создания участников для приватных чатов
CREATE OR REPLACE FUNCTION create_private_chat_members()
RETURNS TRIGGER AS $$
BEGIN
    -- Для приватных чатов автоматически добавляем создателя как участника
    IF NEW.type = 'private' AND NEW.owner_id IS NOT NULL THEN
        INSERT INTO chat_members (chat_id, user_id, role, added_by)
        VALUES (NEW.id, NEW.owner_id, 'member', NEW.owner_id)
        ON CONFLICT (chat_id, user_id) DO NOTHING;
    END IF;
    
    -- Для групповых чатов добавляем создателя как владельца
    IF NEW.type IN ('group', 'channel') AND NEW.owner_id IS NOT NULL THEN
        INSERT INTO chat_members (chat_id, user_id, role, added_by)
        VALUES (NEW.id, NEW.owner_id, 'owner', NEW.owner_id)
        ON CONFLICT (chat_id, user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создание триггера для автоматического создания участников
CREATE TRIGGER create_private_chat_members_trigger
    AFTER INSERT ON chats
    FOR EACH ROW
    EXECUTE FUNCTION create_private_chat_members();

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
) AS $$
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
) AS $$
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
    WHERE cm.user_id = p_user_id AND cm.status = 'active' AND c.is_active = true
    ORDER BY 
        cm.is_pinned DESC,
        c.last_message_at DESC;
END;
$$ language 'plpgsql';

-- Функция для проверки прав участника чата
CREATE OR REPLACE FUNCTION check_chat_permission(
    p_user_id UUID, 
    p_chat_id UUID, 
    p_permission VARCHAR
) RETURNS BOOLEAN AS $$
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
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ language 'plpgsql';

-- Добавление ограничений
ALTER TABLE chat_members ADD CONSTRAINT check_left_after_joined 
    CHECK (left_at IS NULL OR left_at >= joined_at);

ALTER TABLE chat_members ADD CONSTRAINT check_last_read_after_joined 
    CHECK (last_read_at IS NULL OR last_read_at >= joined_at);

ALTER TABLE chat_invitations ADD CONSTRAINT check_expires_in_future 
    CHECK (expires_at IS NULL OR expires_at > created_at);

-- Добавление комментариев
COMMENT ON TABLE chat_members IS 'Таблица участников чатов';
COMMENT ON COLUMN chat_members.role IS 'Роль участника в чате';
COMMENT ON COLUMN chat_members.status IS 'Статус участника (активен, исключен, покинул, заблокирован)';
COMMENT ON COLUMN chat_members.last_read_message_id IS 'ID последнего прочитанного сообщения';
COMMENT ON COLUMN chat_members.custom_nickname IS 'Пользовательское имя участника в чате';
COMMENT ON COLUMN chat_members.permissions IS 'Индивидуальные разрешения участника в JSON';

COMMENT ON TABLE chat_member_history IS 'История изменений участников чатов';
COMMENT ON COLUMN chat_member_history.action IS 'Действие (added, removed, role_changed, etc.)';

COMMENT ON TABLE chat_invitations IS 'Таблица приглашений в чаты';
COMMENT ON COLUMN chat_invitations.invitation_code IS 'Уникальный код приглашения';
COMMENT ON COLUMN chat_invitations.invitee_email IS 'Email приглашенного пользователя (если не зарегистрирован)';