-- Дополнительные тестовые данные
-- Файл: database/seeds/additional_seeds.sql

-- Очистка таблиц перед добавлением тестовых данных
TRUNCATE TABLE calls RESTART IDENTITY CASCADE;
TRUNCATE TABLE friend_requests RESTART IDENTITY CASCADE;

-- Вставка тестовых заявок в друзья
INSERT INTO friend_requests (
    id,
    sender_id,
    receiver_id,
    status,
    message,
    created_at,
    updated_at,
    responded_at
) VALUES 
-- Принятые заявки (стали друзьями)
(
    '880e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001', -- admin
    '550e8400-e29b-41d4-a716-446655440002', -- john
    'accepted',
    'Привет! Давай дружить и работать вместе!',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '6 days 23 hours',
    NOW() - INTERVAL '6 days 23 hours'
),
(
    '880e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002', -- john
    '550e8400-e29b-41d4-a716-446655440003', -- jane
    'accepted',
    'Хочу обсудить с тобой вопросы по фронтенду',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '4 days 22 hours',
    NOW() - INTERVAL '4 days 22 hours'
),
(
    '880e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440003', -- jane
    '550e8400-e29b-41d4-a716-446655440004', -- mike
    'accepted',
    'Привет! Было бы здорово поработать над дизайном вместе',
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '7 days 20 hours',
    NOW() - INTERVAL '7 days 20 hours'
),
(
    '880e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440005', -- sarah
    '550e8400-e29b-41d4-a716-446655440006', -- alex
    'accepted',
    'Нужно обсудить процессы тестирования',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '2 days 18 hours',
    NOW() - INTERVAL '2 days 18 hours'
),
(
    '880e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440007', -- david
    '550e8400-e29b-41d4-a716-446655440008', -- emma
    'accepted',
    'Привет! Помогу с DevOps вопросами',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day 20 hours',
    NOW() - INTERVAL '1 day 20 hours'
),

-- Ожидающие заявки
(
    '880e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440008', -- emma
    '550e8400-e29b-41d4-a716-446655440009', -- freelancer
    'pending',
    'Привет! Хочу познакомиться с опытным фрилансером',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    NULL
),
(
    '880e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440010', -- student
    '550e8400-e29b-41d4-a716-446655440003', -- jane
    'pending',
    'Здравствуйте! Я студент, хочу учиться у вас',
    NOW() - INTERVAL '12 hours',
    NOW() - INTERVAL '12 hours',
    NULL
),
(
    '880e8400-e29b-41d4-a716-446655440008',
    '550e8400-e29b-41d4-a716-446655440009', -- freelancer
    '550e8400-e29b-41d4-a716-446655440001', -- admin
    'pending',
    'Привет! Интересует возможность сотрудничества',
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '6 hours',
    NULL
),

-- Отклоненные заявки
(
    '880e8400-e29b-41d4-a716-446655440009',
    '550e8400-e29b-41d4-a716-446655440004', -- mike
    '550e8400-e29b-41d4-a716-446655440005', -- sarah
    'rejected',
    'Хочу обсудить дизайн системы тестирования',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '3 days 12 hours',
    NOW() - INTERVAL '3 days 12 hours'
),
(
    '880e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440006', -- alex
    '550e8400-e29b-41d4-a716-446655440007', -- david
    'rejected',
    'Нужна помощь с настройкой CI/CD',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '4 days 8 hours',
    NOW() - INTERVAL '4 days 8 hours'
);

-- Вставка тестовых звонков
INSERT INTO calls (
    id,
    caller_id,
    receiver_id,
    chat_id,
    type,
    status,
    duration,
    started_at,
    ended_at,
    created_at,
    updated_at,
    quality_rating,
    is_recorded,
    recording_url
) VALUES 
-- Завершенные звонки
(
    '990e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001', -- admin звонит
    '550e8400-e29b-41d4-a716-446655440002', -- john отвечает
    '660e8400-e29b-41d4-a716-446655440001', -- их личный чат
    'audio',
    'completed',
    450, -- 7 минут 30 секунд
    NOW() - INTERVAL '2 hours 30 minutes',
    NOW() - INTERVAL '2 hours 23 minutes',
    NOW() - INTERVAL '2 hours 30 minutes',
    NOW() - INTERVAL '2 hours 23 minutes',
    5, -- отличное качество
    false,
    NULL
),
(
    '990e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003', -- jane звонит
    '550e8400-e29b-41d4-a716-446655440002', -- john отвечает
    '660e8400-e29b-41d4-a716-446655440002', -- их личный чат
    'video',
    'completed',
    1200, -- 20 минут
    NOW() - INTERVAL '1 day 2 hours',
    NOW() - INTERVAL '1 day 1 hour 40 minutes',
    NOW() - INTERVAL '1 day 2 hours',
    NOW() - INTERVAL '1 day 1 hour 40 minutes',
    4, -- хорошее качество
    false,
    NULL
),
(
    '990e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440005', -- sarah звонит
    '550e8400-e29b-41d4-a716-446655440006', -- alex отвечает
    '660e8400-e29b-41d4-a716-446655440005', -- их личный чат
    'audio',
    'completed',
    900, -- 15 минут
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '5 hours 45 minutes',
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '5 hours 45 minutes',
    4,
    false,
    NULL
),

-- Пропущенные звонки
(
    '990e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440004', -- mike звонит
    '550e8400-e29b-41d4-a716-446655440003', -- jane не отвечает
    NULL, -- попытка прямого звонка
    'video',
    'missed',
    0,
    NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '4 hours',
    NULL,
    false,
    NULL
),
(
    '990e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440007', -- david звонит
    '550e8400-e29b-41d4-a716-446655440008', -- emma не отвечает
    '660e8400-e29b-41d4-a716-446655440007', -- их личный чат
    'audio',
    'missed',
    0,
    NOW() - INTERVAL '1 day 6 hours',
    NOW() - INTERVAL '1 day 6 hours',
    NOW() - INTERVAL '1 day 6 hours',
    NOW() - INTERVAL '1 day 6 hours',
    NULL,
    false,
    NULL
),

-- Отклоненные звонки
(
    '990e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440009', -- freelancer звонит
    '550e8400-e29b-41d4-a716-446655440001', -- admin отклоняет
    NULL, -- попытка прямого звонка
    'video',
    'declined',
    0,
    NOW() - INTERVAL '8 hours',
    NOW() - INTERVAL '8 hours',
    NOW() - INTERVAL '8 hours',
    NOW() - INTERVAL '8 hours',
    NULL,
    false,
    NULL
),

-- Групповые звонки (конференции)
(
    '990e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440001', -- admin создает конференцию
    NULL, -- групповой звонок
    '660e8400-e29b-41d4-a716-446655440003', -- чат команды разработки
    'conference',
    'completed',
    2700, -- 45 минут
    NOW() - INTERVAL '1 day 10 hours',
    NOW() - INTERVAL '1 day 9 hours 15 minutes',
    NOW() - INTERVAL '1 day 10 hours',
    NOW() - INTERVAL '1 day 9 hours 15 minutes',
    4,
    true, -- записан
    '/uploads/recordings/team-meeting-2024.mp4'
),
(
    '990e8400-e29b-41d4-a716-446655440008',
    '550e8400-e29b-41d4-a716-446655440004', -- mike создает конференцию дизайнеров
    NULL,
    '660e8400-e29b-41d4-a716-446655440004', -- чат дизайна
    'conference',
    'completed',
    1800, -- 30 минут
    NOW() - INTERVAL '3 days 14 hours',
    NOW() - INTERVAL '3 days 13 hours 30 minutes',
    NOW() - INTERVAL '3 days 14 hours',
    NOW() - INTERVAL '3 days 13 hours 30 minutes',
    5,
    true,
    '/uploads/recordings/design-review.mp4'
),

-- Активный звонок
(
    '990e8400-e29b-41d4-a716-446655440009',
    '550e8400-e29b-41d4-a716-446655440010', -- student звонит
    '550e8400-e29b-41d4-a716-446655440002', -- john отвечает
    NULL, -- прямой звонок
    'audio',
    'active',
    NULL, -- еще идет
    NOW() - INTERVAL '5 minutes',
    NULL,
    NOW() - INTERVAL '5 minutes',
    NOW() - INTERVAL '5 minutes',
    NULL,
    false,
    NULL
),

-- Входящий звонок (звонит сейчас)
(
    '990e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440006', -- alex звонит
    '550e8400-e29b-41d4-a716-446655440001', -- admin еще не ответил
    NULL,
    'video',
    'ringing',
    NULL,
    NOW() - INTERVAL '30 seconds',
    NULL,
    NOW() - INTERVAL '30 seconds',
    NOW() - INTERVAL '30 seconds',
    NULL,
    false,
    NULL
);

-- Создание связей друзей (отдельная таблица если есть)
-- Предполагается что дружба создается автоматически при принятии заявки

-- Проверка вставленных данных
SELECT 
    'Friend Requests' as data_type,
    status,
    COUNT(*) as count
FROM friend_requests 
GROUP BY status
UNION ALL
SELECT 
    'Calls' as data_type,
    status,
    COUNT(*) as count
FROM calls 
GROUP BY status
ORDER BY data_type, status;

-- Статистика по звонкам
SELECT 
    type as call_type,
    status,
    COUNT(*) as count,
    AVG(duration) FILTER (WHERE duration IS NOT NULL) as avg_duration_seconds,
    AVG(quality_rating) FILTER (WHERE quality_rating IS NOT NULL) as avg_quality
FROM calls 
GROUP BY type, status
ORDER BY type, status;

-- Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_id ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_id ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_created_at ON friend_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_calls_caller_id ON calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_calls_receiver_id ON calls(receiver_id);
CREATE INDEX IF NOT EXISTS idx_calls_chat_id ON calls(chat_id);
CREATE INDEX IF NOT EXISTS idx_calls_type ON calls(type);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_started_at ON calls(started_at);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at);

-- Обновление счетчиков последовательностей (если используется SERIAL)
SELECT setval(pg_get_serial_sequence('friend_requests', 'id'), COALESCE(MAX(id::integer), 1), false) FROM friend_requests WHERE id ~ '^\d+;
SELECT setval(pg_get_serial_sequence('calls', 'id'), COALESCE(MAX(id::integer), 1), false) FROM calls WHERE id ~ '^\d+;