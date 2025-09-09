-- Запуск всех тестовых данных
-- Файл: database/seeds/run_all_seeds.sql
-- Этот файл запускает все seed файлы в правильном порядке

-- Отключаем проверки внешних ключей для корректной очистки
SET session_replication_role = replica;

-- Включаем логирование времени выполнения
\timing on

-- Выводим информацию о начале процесса
SELECT 'Starting database seeding process...' as status, NOW() as timestamp;

-- 1. Запускаем создание тестовых пользователей
\echo ''
\echo '========================================='
\echo 'Step 1: Creating test users...'
\echo '========================================='

\i users.sql

-- 2. Запускаем создание тестовых чатов и сообщений
\echo ''
\echo '========================================='  
\echo 'Step 2: Creating test chats and messages...'
\echo '========================================='

\i chats.sql

-- 3. Запускаем создание дополнительных данных (заявки в друзья, звонки)
\echo ''
\echo '========================================='
\echo 'Step 3: Creating friend requests and calls...'
\echo '========================================='

\i additional_seeds.sql

-- Включаем обратно проверки внешних ключей
SET session_replication_role = DEFAULT;

-- Обновляем статистику таблиц для оптимизации запросов
ANALYZE users;
ANALYZE chats;
ANALYZE chat_members;
ANALYZE messages;
ANALYZE friend_requests;
ANALYZE calls;

-- Выводим финальную статистику
\echo ''
\echo '========================================='
\echo 'Final Statistics'
\echo '========================================='

SELECT 
    'Database Seeding Completed!' as status,
    NOW() as completed_at;

-- Статистика по всем таблицам
SELECT 
    'users' as table_name,
    COUNT(*) as records_count,
    COUNT(*) FILTER (WHERE is_online = true) as online_users
FROM users
UNION ALL
SELECT 
    'chats' as table_name,
    COUNT(*) as records_count,
    COUNT(*) FILTER (WHERE type = 'group') as group_chats
FROM chats  
UNION ALL
SELECT 
    'chat_members' as table_name,
    COUNT(*) as records_count,
    COUNT(*) FILTER (WHERE role = 'admin') as chat_admins
FROM chat_members
UNION ALL
SELECT 
    'messages' as table_name,
    COUNT(*) as records_count,
    COUNT(*) FILTER (WHERE type = 'file') as file_messages
FROM messages
UNION ALL
SELECT 
    'friend_requests' as table_name,
    COUNT(*) as records_count,
    COUNT(*) FILTER (WHERE status = 'accepted') as accepted_requests
FROM friend_requests
UNION ALL
SELECT 
    'calls' as table_name,
    COUNT(*) as records_count,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_calls
FROM calls
ORDER BY table_name;

-- Проверяем связность данных
\echo ''
\echo 'Data Integrity Checks:'

-- Проверка пользователей без чатов
SELECT 
    COUNT(*) as users_without_chats
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM chat_members cm WHERE cm.user_id = u.id
);

-- Проверка чатов без участников  
SELECT 
    COUNT(*) as chats_without_members
FROM chats c
WHERE NOT EXISTS (
    SELECT 1 FROM chat_members cm WHERE cm.chat_id = c.id
);

-- Проверка сообщений от несуществующих пользователей
SELECT 
    COUNT(*) as orphaned_messages
FROM messages m
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = m.sender_id
);

-- Проверка заявок с некорректными пользователями
SELECT 
    COUNT(*) as invalid_friend_requests
FROM friend_requests fr
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = fr.sender_id)
   OR NOT EXISTS (SELECT 1 FROM users u WHERE u.id = fr.receiver_id);

-- Проверка звонков с некорректными пользователями
SELECT 
    COUNT(*) as invalid_calls
FROM calls c
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = c.caller_id)
   OR (c.receiver_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = c.receiver_id));

-- Информация о активности
\echo ''
\echo 'Activity Summary:'

-- Самые активные пользователи
SELECT 
    CONCAT(u.first_name, ' ', u.last_name) as user_name,
    u.username,
    COUNT(m.id) as messages_sent,
    COUNT(DISTINCT c.id) as chats_participated
FROM users u
LEFT JOIN messages m ON u.id = m.sender_id
LEFT JOIN chat_members cm ON u.id = cm.user_id  
LEFT JOIN chats c ON cm.chat_id = c.id
GROUP BY u.id, u.first_name, u.last_name, u.username
ORDER BY messages_sent DESC
LIMIT 5;

-- Самые активные чаты
SELECT 
    COALESCE(c.name, CONCAT('Private chat (', 
        (SELECT username FROM users WHERE id = (
            SELECT user_id FROM chat_members WHERE chat_id = c.id LIMIT 1
        )), 
        ' - ', 
        (SELECT username FROM users WHERE id = (
            SELECT user_id FROM chat_members WHERE chat_id = c.id OFFSET 1 LIMIT 1
        )),
        ')'
    )) as chat_name,
    c.type,
    COUNT(m.id) as messages_count,
    COUNT(cm.user_id) as members_count
FROM chats c
LEFT JOIN messages m ON c.id = m.chat_id
LEFT JOIN chat_members cm ON c.id = cm.chat_id
GROUP BY c.id, c.name, c.type
ORDER BY messages_count DESC
LIMIT 5;

-- Информация о звонках
SELECT 
    type as call_type,
    COUNT(*) as total_calls,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_calls,
    COUNT(*) FILTER (WHERE status = 'missed') as missed_calls,
    COUNT(*) FILTER (WHERE status = 'declined') as declined_calls,
    ROUND(AVG(duration) FILTER (WHERE duration IS NOT NULL), 2) as avg_duration_seconds
FROM calls
GROUP BY type
ORDER BY total_calls DESC;

\echo ''
\echo '========================================='
\echo 'Seeding process completed successfully!'
\echo 'You can now start your application.'
\echo '========================================='