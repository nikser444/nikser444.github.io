const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mymessenger';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  online: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  socketId: String
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

// Chat Schema
const ChatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isGroup: { type: Boolean, default: false },
  name: String,
  lastMessage: {
    text: String,
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
  }
}, { timestamps: true });

const Chat = mongoose.model('Chat', ChatSchema);

// Message Schema
const MessageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  messageType: { type: String, default: 'text', enum: ['text', 'call', 'system'] },
  status: { type: String, default: 'sent', enum: ['sent', 'delivered', 'read'] },
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const Message = mongoose.model('Message', MessageSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.userId = user.userId;
    next();
  });
};

// Socket middleware for auth
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(new Error('User not found'));
    }
    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
};

// Routes

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      avatar: username.charAt(0).toUpperCase()
    });

    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Update online status
    user.online = true;
    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search users
app.get('/api/users/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const users = await User.find({
      _id: { $ne: req.userId },
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    }).select('username email avatar online').limit(10);

    res.json(users);

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user chats
app.get('/api/chats', authenticateToken, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.userId
    })
    .populate('participants', 'username email avatar online')
    .populate('lastMessage.sender', 'username')
    .sort({ 'lastMessage.timestamp': -1 });

    // Format chats for frontend
    const formattedChats = await Promise.all(chats.map(async (chat) => {
      const unreadCount = await Message.countDocuments({
        chatId: chat._id,
        sender: { $ne: req.userId },
        'readBy.user': { $ne: req.userId }
      });

      const otherParticipant = chat.participants.find(p => p._id.toString() !== req.userId);
      
      return {
        id: chat._id,
        name: chat.isGroup ? chat.name : otherParticipant?.username || 'Unknown',
        isGroup: chat.isGroup,
        participants: chat.participants,
        lastMessage: chat.lastMessage?.text || '',
        time: chat.lastMessage?.timestamp ? 
          new Date(chat.lastMessage.timestamp).toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }) : '',
        unreadCount,
        online: chat.isGroup ? true : (otherParticipant?.online || false),
        avatar: chat.isGroup ? 
          'linear-gradient(45deg, #667eea, #764ba2)' : 
          `linear-gradient(45deg, #${Math.floor(Math.random()*16777215).toString(16)}, #${Math.floor(Math.random()*16777215).toString(16)})`
      };
    }));

    res.json(formattedChats);

  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create or get chat
app.post('/api/chats', authenticateToken, async (req, res) => {
  try {
    const { participantId, isGroup, name } = req.body;

    let chat;

    if (isGroup) {
      // Create group chat
      chat = new Chat({
        participants: [req.userId, ...participantId],
        isGroup: true,
        name: name
      });
      await chat.save();
    } else {
      // Check if chat already exists
      chat = await Chat.findOne({
        participants: { $all: [req.userId, participantId], $size: 2 },
        isGroup: false
      });

      if (!chat) {
        // Create new chat
        chat = new Chat({
          participants: [req.userId, participantId],
          isGroup: false
        });
        await chat.save();
      }
    }

    await chat.populate('participants', 'username email avatar online');

    const otherParticipant = chat.participants.find(p => p._id.toString() !== req.userId);
    
    const formattedChat = {
      id: chat._id,
      name: chat.isGroup ? chat.name : otherParticipant?.username || 'Unknown',
      isGroup: chat.isGroup,
      participants: chat.participants,
      lastMessage: chat.lastMessage?.text || '',
      time: chat.lastMessage?.timestamp ? 
        new Date(chat.lastMessage.timestamp).toLocaleTimeString('ru-RU', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : 'Сейчас',
      unreadCount: 0,
      online: chat.isGroup ? true : (otherParticipant?.online || false),
      avatar: chat.isGroup ? 
        'linear-gradient(45deg, #667eea, #764ba2)' : 
        `linear-gradient(45deg, #${Math.floor(Math.random()*16777215).toString(16)}, #${Math.floor(Math.random()*16777215).toString(16)})`,
      messages: []
    };

    res.json(formattedChat);

  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get chat messages
app.get('/api/chats/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if user is participant
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(req.userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await Message.find({ chatId })
      .populate('sender', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Format messages
    const formattedMessages = messages.reverse().map(msg => ({
      id: msg._id,
      text: msg.text,
      sent: msg.sender._id.toString() === req.userId,
      time: new Date(msg.createdAt).toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      status: msg.status,
      messageType: msg.messageType,
      sender: msg.sender.username
    }));

    res.json(formattedMessages);

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Socket.io events
io.use(socketAuth);

io.on('connection', async (socket) => {
  console.log(`User ${socket.user.username} connected`);

  // Update user online status and socket ID
  await User.findByIdAndUpdate(socket.userId, {
    online: true,
    socketId: socket.id
  });

  // Join user to their chat rooms
  const userChats = await Chat.find({ participants: socket.userId });
  userChats.forEach(chat => {
    socket.join(chat._id.toString());
  });

  // Handle sending messages
  socket.on('send_message', async (data) => {
    try {
      const { chatId, text, messageType = 'text' } = data;

      // Verify user is participant
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.participants.includes(socket.userId)) {
        return socket.emit('error', { message: 'Access denied' });
      }

      // Create message
      const message = new Message({
        chatId,
        sender: socket.userId,
        text,
        messageType
      });

      await message.save();
      await message.populate('sender', 'username');

      // Update chat last message
      chat.lastMessage = {
        text,
        sender: socket.userId,
        timestamp: new Date()
      };
      await chat.save();

      // Format message
      const formattedMessage = {
        id: message._id,
        text: message.text,
        sent: false, // Will be true for sender on client
        time: new Date(message.createdAt).toLocaleTimeString('ru-RU', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        status: 'delivered',
        messageType: message.messageType,
        sender: message.sender.username,
        senderId: socket.userId
      };

      // Send to all participants
      socket.to(chatId).emit('new_message', formattedMessage);
      socket.emit('message_sent', formattedMessage);

      // Update message status to delivered for other participants
      setTimeout(async () => {
        await Message.findByIdAndUpdate(message._id, { status: 'delivered' });
        socket.to(chatId).emit('message_status_updated', {
          messageId: message._id,
          status: 'delivered'
        });
      }, 1000);

    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    socket.to(data.chatId).emit('user_typing', {
      userId: socket.userId,
      username: socket.user.username
    });
  });

  socket.on('typing_stop', (data) => {
    socket.to(data.chatId).emit('user_stop_typing', {
      userId: socket.userId
    });
  });

  // Handle video/voice calls
  socket.on('start_call', async (data) => {
    const { chatId, callType } = data;
    
    socket.to(chatId).emit('incoming_call', {
      callerId: socket.userId,
      callerName: socket.user.username,
      chatId,
      callType
    });
  });

  socket.on('accept_call', (data) => {
    socket.to(data.chatId).emit('call_accepted', {
      acceptedBy: socket.userId
    });
  });

  socket.on('decline_call', (data) => {
    socket.to(data.chatId).emit('call_declined', {
      declinedBy: socket.userId
    });
  });

  socket.on('end_call', (data) => {
    socket.to(data.chatId).emit('call_ended', {
      endedBy: socket.userId
    });
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    console.log(`User ${socket.user.username} disconnected`);
    
    // Update user offline status
    await User.findByIdAndUpdate(socket.userId, {
      online: false,
      lastSeen: new Date(),
      socketId: null
    });

    // Notify other users
    socket.broadcast.emit('user_offline', {
      userId: socket.userId
    });
  });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to view the messenger`);
});