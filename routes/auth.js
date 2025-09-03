const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User');
const router = express.Router();

// Схемы валидации
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  displayName: Joi.string().min(1).max(50).required()
});

const loginSchema = Joi.object({
  login: Joi.string().required(), // username или email
  password: Joi.string().required()
});

// Функция создания JWT токена
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Регистрация
router.post('/register', async (req, res) => {
  try {
    // Валидация входных данных
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Неверные данные', 
        details: error.details[0].message 
      });
    }

    const { username, email, password, displayName } = value;

    // Проверка существования пользователя
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(409).json({ 
        error: 'Пользователь с таким email или username уже существует' 
      });
    }

    // Создание нового пользователя
    const user = new User({
      username,
      email,
      password,
      displayName
    });

    await user.save();

    // Создание токена
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Вход в систему
router.post('/login', async (req, res) => {
  try {
    // Валидация входных данных
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Неверные данные', 
        details: error.details[0].message 
      });
    }

    const { login, password } = value;

    // Поиск пользователя по username или email
    const user = await User.findOne({
      $or: [
        { email: login },
        { username: login }
      ]
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'Неверный логин или пароль' 
      });
    }

    // Проверка пароля
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Неверный логин или пароль' 
      });
    }

    // Обновление статуса онлайн
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    // Создание токена
    const token = generateToken(user._id);

    res.json({
      message: 'Успешный вход в систему',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Ошибка входа в систему:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;