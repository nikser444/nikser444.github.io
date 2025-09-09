-- Тестовые данные для таблицы chats
-- Файл: database/seeds/chats.sql

-- Очистка таблиц перед добавлением тестовых данных
TRUNCATE TABLE messages RESTART IDENTITY CASCADE;
TRUNCATE TABLE chat_members RESTART IDENTITY CASCADE;
TRUNCATE TABLE chats RESTART IDENTITY CASCADE;

-- Вставка тестовых чатов
INSERT INTO chats (
    id,
    name,
    type,
    description,
    avatar_url,
    created_by,
    created_at,
    updated_at,
    last_message_at,
    is_archived
) VALUES 
-- Личный чат 1: Admin и John
(
    '660e8400-e29b-41d4-a716-446655440001',
    NULL, -- личные чаты не имеют названия
    'private',
    NULL,
    NULL,
    '550e8400-e29b-41d4-a716-446655440001', -- admin создал
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '30 minutes',
    NOW() - INTERVAL '30 minutes',
    false
),

-- Личный чат 2: John и Jane
(
    '660e8400-e29b-41d4-a716-446655440002',
    NULL,
    'private',
    NULL,
    NULL,
    '550e8400-e29b-41d4-a716-446655440002', -- john создал
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '15 minutes',
    NOW() - INTERVAL '15 minutes',
    false
),

-- Групповой чат 1: Команда разработки
(
    '660e8400-e29b-41d4-a716-446655440003',
    'Команда разработки 👨‍💻',
    'group',
    'Основной чат команды разработки для обсуждения проектов и задач',
    '/uploads/chats/dev-team-avatar.png',
    '550e8400-e29b-41d4-a716-446655440001', -- admin создал
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '5 minutes',
    NOW() - INTERVAL '5 minutes',
    false
),

-- Групповой чат 2: Дизайн и UI/UX
(
    '660e8400-e29b-41d4-a716-446655440004',
    'Дизайн и UI/UX 🎨',
    'group',
    'Обсуждение дизайна интерфейсов и пользовательского опыта',
    '/uploads/chats/design-team-avatar.png',
    '550e8400-e29b-41d4-a716-446655440004', -- mike создал
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours',
    false
),

-- Личный чат 3: Sarah и Alex
(
    '660e8400-e29b-41d4-a716-446655440005',
    NULL,
    'private',
    NULL,
    NULL,
    '550e8400-e29b-41d4-a716-446655440005', -- sarah создал
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '4 hours',
    false
),

-- Групповой чат 3: QA и тестирование
(
    '660e8400-e29b-41d4-a716-446655440006',
    'QA и тестирование 🔍',
    'group',
    'Обсуждение процессов тестирования, найденных багов и улучшений качества',
    '/uploads/chats/qa-team-avatar.png',
    '550e8400-e29b-41d4-a716-446655440005', -- sarah создал
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '1 hour',
    false
),

-- Личный чат 4: David и Emma
(
    '660e8400-e29b-41d4-a716-446655440007',
    NULL,
    'private',
    NULL,
    NULL,
    '550e8400-e29b-41d4-a716-446655440007', -- david создал
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    false
),

-- Групповой чат 4: Общий чат
(
    '660e8400-e29b-41d4-a716-446655440008',
    'Общий чат 💬',
    'group',
    'Неформальное общение, обмен новостями и интересными находками',
    '/uploads/chats/general-chat-avatar.png',
    '550e8400-e29b-41d4-a716-446655440001', -- admin создал
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '10 minutes',
    NOW() - INTERVAL '10 minutes',
    false
),

-- Личный чат 5: Mike и Alex (архивированный)
(
    '660e8400-e29b-41d4-a716-446655440009',
    NULL,
    'private',
    NULL,
    NULL,
    '550e8400-e29b-41d4-a716-446655440004', -- mike создал
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days',
    true -- архивированный чат
),

-- Групповой чат 5: Менеджмент
(
    '660e8400-e29b-41d4-a716-446655440010',
    'Менеджмент 📊',
    'group',
    'Планирование, координация проектов и стратегические решения',
    '/uploads/chats/management-avatar.png',
    '550e8400-e29b-41d4-a716-446655440006', -- alex создал
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours',
    false
);

-- Вставка участников чатов
INSERT INTO chat_members (
    chat_id,
    user_id,
    role,
    joined_at,
    is_muted,
    last_read_at
) VALUES 
-- Участники личного чата 1 (Admin и John)
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'member', NOW() - INTERVAL '7 days', false, NOW() - INTERVAL '30 minutes'),
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'member', NOW() - INTERVAL '7 days', false, NOW() - INTERVAL '30 minutes'),

-- Участники личного чата 2 (John и Jane)
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'member', NOW() - INTERVAL '5 days', false, NOW() - INTERVAL '15 minutes'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'member', NOW() - INTERVAL '5 days', false, NOW() - INTERVAL '15 minutes'),

-- Участники группового чата "Команда разработки"
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'admin', NOW() - INTERVAL '10 days', false, NOW() - INTERVAL '5 minutes'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'member', NOW() - INTERVAL '10 days', false, NOW() - INTERVAL '5 minutes'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'member', NOW() - INTERVAL '9 days', false, NOW() - INTERVAL '5 minutes'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440007', 'member', NOW() - INTERVAL '8 days', false, NOW() - INTERVAL '1 hour'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440008', 'member', NOW() - INTERVAL '7 days', false, NOW() - INTERVAL '5 minutes'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440010', 'member', NOW() - INTERVAL '6 days', false, NOW() - INTERVAL '5 minutes'),

-- Участники группового чата "Дизайн и UI/UX"
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'admin', NOW() - INTERVAL '8 days', false, NOW() - INTERVAL '2 hours'),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'member', NOW() - INTERVAL '7 days', false, NOW() - INTERVAL '2 hours'),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440006', 'member', NOW() - INTERVAL '6 days', false, NOW() - INTERVAL '3 hours'),

-- Участники личного чата 3 (Sarah и Alex)
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'member', NOW() - INTERVAL '3 days', false, NOW() - INTERVAL '4 hours'),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440006', 'member', NOW() - INTERVAL '3 days', false, NOW() - INTERVAL '4 hours'),

-- Участники группового чата "QA и тестирование"
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440005', 'admin', NOW() - INTERVAL '6 days', false, NOW() - INTERVAL '1 hour'),
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440008', 'member', NOW() - INTERVAL '5 days', false, NOW() - INTERVAL '1 hour'),
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440010', 'member', NOW() - INTERVAL '4 days', false, NOW() - INTERVAL '2 hours'),

-- Участники личного чата 4 (David и Emma)
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440007', 'member', NOW() - INTERVAL '2 days', false, NOW() - INTERVAL '1 day'),
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440008', 'member', NOW() - INTERVAL '2 days', false, NOW() - INTERVAL '1 day'),

-- Участники группового чата "Общий чат"
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440001', 'admin', NOW() - INTERVAL '12 days', false, NOW() - INTERVAL '10 minutes'),
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440002', 'member', NOW() - INTERVAL '11 days', false, NOW() - INTERVAL '10 minutes'),
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'member', NOW() - INTERVAL '10 days', false, NOW() - INTERVAL '10 minutes'),
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440004', 'member', NOW() - INTERVAL '9 days', false, NOW() - INTERVAL '1 day'),
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440005', 'member', NOW() - INTERVAL '8 days', false, NOW() - INTERVAL '4 hours'),
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440006', 'member', NOW() - INTERVAL '7 days', false, NOW() - INTERVAL '3 hours'),
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440007', 'member', NOW() - INTERVAL '6 days', false, NOW() - INTERVAL '1 day'),
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440008', 'member', NOW() - INTERVAL '5 days', false, NOW() - INTERVAL '10 minutes'),
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440009', 'member', NOW() - INTERVAL '4 days', false, NOW() - INTERVAL '6 hours'),
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440010', 'member', NOW() - INTERVAL '3 days', false, NOW() - INTERVAL '10 minutes'),

-- Участники архивированного личного чата (Mike и Alex)
('660e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440004', 'member', NOW() - INTERVAL '15 days', false, NOW() - INTERVAL '10 days'),
('660e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440006', 'member', NOW() - INTERVAL '15 days', false, NOW() - INTERVAL '10 days'),

-- Участники группового чата "Менеджмент"
('660e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440006', 'admin', NOW() - INTERVAL '4 days', false, NOW() - INTERVAL '3 hours'),
('660e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', 'member', NOW() - INTERVAL '4 days', false, NOW() - INTERVAL '3 hours'),
('660e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440004', 'member', NOW() - INTERVAL '3 days', true, NOW() - INTERVAL '1 day'); -- mike заглушил уведомления

-- Вставка тестовых сообщений
INSERT INTO messages (
    id,
    chat_id,
    sender_id,
    content,
    type,
    reply_to_id,
    created_at,
    updated_at,
    is_edited,
    is_deleted,
    file_url,
    file_name,
    file_size
) VALUES 
-- Сообщения в чате "Команда разработки"
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 
 'Добро пожаловать в чат команды разработки! 👋', 'text', NULL, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', false, false, NULL, NULL, NULL),

('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 
 'Привет всем! Рад быть в команде 😊', 'text', NULL, NOW() - INTERVAL '9 days 23 hours', NOW() - INTERVAL '9 days 23 hours', false, false, NULL, NULL, NULL),

('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 
 'Привет! Готова к новым проектам 💪', 'text', NULL, NOW() - INTERVAL '9 days 22 hours', NOW() - INTERVAL '9 days 22 hours', false, false, NULL, NULL, NULL),

-- Последние сообщения в команде разработки
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440008', 
 'Есть вопрос по новой функциональности...', 'text', NULL, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour', false, false, NULL, NULL, NULL),

('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 
 'Какой именно вопрос?', 'text', '770e8400-e29b-41d4-a716-446655440004', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes', false, false, NULL, NULL, NULL),

('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 
 'Посмотрю код и отвечу через полчаса', 'text', NULL, NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '5 minutes', false, false, NULL, NULL, NULL),

-- Сообщения в личном чате Admin и John
('770e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 
 'Привет! Как дела с новым проектом?', 'text', NULL, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', false, false, NULL, NULL, NULL),

('770e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 
 'Все идет по плану! Завтра покажу демо', 'text', NULL, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour', false, false, NULL, NULL, NULL),

('770e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 
 'Отлично! Жду с нетерпением 👍', 'text', NULL, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes', false, false, NULL, NULL, NULL),

-- Сообщения в личном чате John и Jane
('770e8400-e29b-41d4-a716-446655440010', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 
 'Jane, можешь помочь с CSS?', 'text', NULL, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour', false, false, NULL, NULL, NULL),

('770e8400-e29b-41d4-a716-446655440011', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 
 'Конечно! Какая проблема?', 'text', NULL, NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '45 minutes', false, false, NULL, NULL, NULL),

('770e8400-e29b-41d4-a716-446655440012', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 
 'Не могу понять почему флексбокс не работает', 'text', NULL, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes', false, false, NULL, NULL, NULL),

('770e8400-e29b-41d4-a716-446655440013', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 
 'Скинь код, посмотрю', 'text', NULL, NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '15 minutes', false, false, NULL, NULL, NULL),

-- Сообщения в группе "Дизайн и UI/UX"
('770e8400-e29b-41d4-a716-446655440014', '660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 
 'Новые макеты готовы! 🎨', 'text', NULL, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours', false, false, NULL, NULL, NULL),

('770e8400-e29b-41d4-a716-446655440015', '660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 
 'Вот файл с макетами', 'file', NULL, NOW() - INTERVAL '3 hours 50 minutes', NOW() - INTERVAL '3 hours 50 minutes', false, false, 
 '/uploads/files/design-mockups.fig', 'design-mockups.fig', 2048576),

('770e8400-e29b-41d4-a716-446655440016', '660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 
 'Отлично выглядит! Особенно нравится новая цветовая схема', 'text', NULL, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', false, false, NULL, NULL, NULL),

-- Сообщения в "Общем чате"
('770e8400-e29b-41d4-a716-446655440017', '660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440010', 
 'Привет всем! 👋 Я новенький в команде', 'text', NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', false, false, NULL, NULL, NULL),

('770e8400-e29b-41d4-a716-446655440018', '660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440001', 
 'Добро пожаловать в команду! 🎉', 'text', NULL, NOW() - INTERVAL '1 day 23 hours', NOW() - INTERVAL '1 day 23 hours', false, false, NULL, NULL, NULL),

('770e8400-e29b-41d4-a716-446655440019', '660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440002', 
 'Привет! Если есть вопросы - обращайся', 'text', NULL, NOW() - INTERVAL '1 day 22 hours', NOW() - INTERVAL '1 day 22 hours', false, false, NULL, NULL, NULL),

('770e8400-e29b-41d4-a716-446655440020', '660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440008', 
 'Кто-нибудь знает хорошие ресурсы для изучения React?', 'text', NULL, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours', false, false, NULL, NULL, NULL),

('770e8400-e29b-41d4-a716-446655440021', '660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 
 'Рекомендую официальную документацию и курс от Kent Dodds', 'text', NULL, NOW() - INTERVAL '2 hours 30 minutes', NOW() - INTERVAL '2 hours 30 minutes', false, false, NULL, NULL, NULL),

('770e8400-e29b-41d4-a716-446655440022', '660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440002', 
 'Еще могу скинуть полезные ссылки в личку', 'text', NULL, NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '10 minutes', false, false, NULL, NULL, NULL),

-- Сообщения в QA чате
('770e8400-e29b-41d4-a716-446655440023', '660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440005', 
 'Нашла критический баг в новой функции! 🐛', 'text', NULL, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', false, false, NULL, NULL, NULL),

('770e8400-e29b-41d4-a716-446655440024', '660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440008', 
 'Где именно? Я проверю', 'text', NULL, NOW() - INTERVAL '1 hour 30 minutes', NOW() - INTERVAL '1 hour 30 minutes', false, false, NULL, NULL, NULL),

('770e8400-e29b-41d4-a716-446655440025', '660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440005', 
 'Скриншот с описанием бага', 'image', NULL, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour', false, false, 
 '/uploads/files/bug-screenshot.png', 'bug-screenshot.png', 512000),

-- Сообщения в чате менеджмента
('770e8400-e29b-41d4-a716-446655440026', '660e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440006', 
 'Планерка завтра в 10:00, не забудьте!', 'text', NULL, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours', false, false, NULL, NULL, NULL),

('770e8400-e29b-41d4-a716-446655440027', '660e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', 
 'Буду! Подготовлю отчет по спринту', 'text', NULL, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours', false, false, NULL, NULL, NULL);

-- Проверка вставленных данных
SELECT 
    c.name as chat_name,
    c.type,
    COUNT(cm.user_id) as members_count,
    COUNT(m.id) as messages_count,
    c.created_at
FROM chats c
LEFT JOIN chat_members cm ON c.id = cm.chat_id
LEFT JOIN messages m ON c.id = m.chat_id
GROUP BY c.id, c.name, c.type, c.created_at
ORDER BY c.created_at;

-- Создание индексов для оптимизации (если не созданы в миграциях)
CREATE INDEX IF NOT EXISTS idx_chats_type ON chats(type);
CREATE INDEX IF NOT EXISTS idx_chats_created_by ON chats(created_by);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats(created_at);
CREATE INDEX IF NOT EXISTS idx_chats_last_message_at ON chats(last_message_at);

CREATE INDEX IF NOT EXISTS idx_chat_members_chat_id ON chat_members(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id ON chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_role ON chat_members(role);

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);

-- Обновление счетчиков последовательностей (если используется SERIAL)
SELECT setval(pg_get_serial_sequence('chats', 'id'), COALESCE(MAX(id::integer), 1), false) FROM chats WHERE id ~ '^\d+;
SELECT setval(pg_get_serial_sequence('chat_members', 'id'), COALESCE(MAX(id::integer), 1), false) FROM chat_members WHERE id ~ '^\d+;
SELECT setval(pg_get_serial_sequence('messages', 'id'), COALESCE(MAX(id::integer), 1), false) FROM messages WHERE id ~ '^\d+;