-- Тестовые данные для таблицы users
-- Файл: database/seeds/users.sql

-- Очистка таблицы перед добавлением тестовых данных
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- Вставка тестовых пользователей
INSERT INTO users (
    id,
    username,
    email,
    password_hash,
    first_name,
    last_name,
    avatar_url,
    status,
    is_online,
    last_seen,
    created_at,
    updated_at,
    phone,
    bio,
    theme_preference
) VALUES 
-- Пользователь 1 - Администратор
(
    '550e8400-e29b-41d4-a716-446655440001',
    'admin',
    'admin@messenger.local',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hJ4.K67im', -- password: admin123
    'Админ',
    'Администратор',
    '/uploads/avatars/admin-avatar.png',
    'Я администратор системы 👑',
    true,
    NOW(),
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '1 hour',
    '+1234567890',
    'Системный администратор мессенджера. Обращайтесь по любым вопросам!',
    'dark'
),

-- Пользователь 2 - Активный пользователь
(
    '550e8400-e29b-41d4-a716-446655440002',
    'john_doe',
    'john.doe@example.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hJ4.K67im', -- password: password123
    'Джон',
    'Доу',
    '/uploads/avatars/john-avatar.png',
    'В сети и готов к общению! 💪',
    true,
    NOW(),
    NOW() - INTERVAL '30 minutes',
    NOW() - INTERVAL '30 minutes',
    '+1987654321',
    'Люблю программирование и хорошие разговоры',
    'light'
),

-- Пользователь 3 - Разработчик
(
    '550e8400-e29b-41d4-a716-446655440003',
    'jane_smith',
    'jane.smith@example.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hJ4.K67im', -- password: password123
    'Джейн',
    'Смит',
    '/uploads/avatars/jane-avatar.png',
    'Кодинг в процессе... 👩‍💻',
    true,
    NOW(),
    NOW() - INTERVAL '15 minutes',
    NOW() - INTERVAL '15 minutes',
    '+1122334455',
    'Frontend разработчик. React, TypeScript, CSS магия ✨',
    'dark'
),

-- Пользователь 4 - Дизайнер
(
    '550e8400-e29b-41d4-a716-446655440004',
    'mike_wilson',
    'mike.wilson@example.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hJ4.K67im', -- password: password123
    'Майк',
    'Уилсон',
    '/uploads/avatars/mike-avatar.png',
    'Создаю красивые интерфейсы 🎨',
    false,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days',
    '+1555666777',
    'UI/UX дизайнер с страстью к минимализму',
    'light'
),

-- Пользователь 5 - Тестировщик
(
    '550e8400-e29b-41d4-a716-446655440005',
    'sarah_connor',
    'sarah.connor@example.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hJ4.K67im', -- password: password123
    'Сара',
    'Коннор',
    '/uploads/avatars/sarah-avatar.png',
    'Ищу баги, а не терминаторов 🤖',
    false,
    NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    '+1333444555',
    'QA инженер. Если есть баг - я его найду!',
    'dark'
),

-- Пользователь 6 - Менеджер проекта
(
    '550e8400-e29b-41d4-a716-446655440006',
    'alex_morgan',
    'alex.morgan@example.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hJ4.K67im', -- password: password123
    'Алекс',
    'Морган',
    '/uploads/avatars/alex-avatar.png',
    'Координирую процессы 📊',
    true,
    NOW(),
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '1 hour',
    '+1777888999',
    'Project Manager. Люблю когда все идет по плану!',
    'light'
),

-- Пользователь 7 - DevOps инженер
(
    '550e8400-e29b-41d4-a716-446655440007',
    'david_tech',
    'david.tech@example.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hJ4.K67im', -- password: password123
    'Дэвид',
    'Тех',
    '/uploads/avatars/david-avatar.png',
    'Автоматизирую все что можно 🚀',
    false,
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days',
    '+1999000111',
    'DevOps инженер. Docker, Kubernetes, CI/CD это мое!',
    'dark'
),

-- Пользователь 8 - Новичок
(
    '550e8400-e29b-41d4-a716-446655440008',
    'emma_newbie',
    'emma.newbie@example.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hJ4.K67im', -- password: password123
    'Эмма',
    'Новенькая',
    NULL, -- нет аватара
    'Только начинаю изучать программирование 📚',
    true,
    NOW(),
    NOW() - INTERVAL '10 minutes',
    NOW() - INTERVAL '10 minutes',
    '+1222333444',
    'Junior разработчик. Учусь каждый день!',
    'light'
),

-- Пользователь 9 - Фрилансер
(
    '550e8400-e29b-41d4-a716-446655440009',
    'freelance_pro',
    'freelancer@example.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hJ4.K67im', -- password: password123
    'Фрэнк',
    'Фрилансер',
    '/uploads/avatars/frank-avatar.png',
    'Работаю удаленно из разных уголков мира 🌍',
    false,
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days',
    '+1666777888',
    'Fullstack разработчик-фрилансер. Всегда открыт для новых проектов!',
    'dark'
),

-- Пользователь 10 - Студент
(
    '550e8400-e29b-41d4-a716-446655440010',
    'student_dev',
    'student@university.edu',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hJ4.K67im', -- password: password123
    'Том',
    'Студент',
    '/uploads/avatars/tom-avatar.png',
    'Изучаю Computer Science 🎓',
    true,
    NOW(),
    NOW() - INTERVAL '5 minutes',
    NOW() - INTERVAL '5 minutes',
    '+1444555666',
    'Студент 3 курса. Специализируюсь на веб-разработке',
    'light'
);

-- Проверка вставленных данных
SELECT 
    username,
    email,
    CONCAT(first_name, ' ', last_name) as full_name,
    status,
    is_online,
    theme_preference
FROM users 
ORDER BY created_at;

-- Создание индексов для оптимизации поиска (если не созданы в миграциях)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_online_status ON users(is_online);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Обновление последовательности ID (если используется SERIAL)
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id::integer), 1), false) FROM users WHERE id ~ '^\d+$';