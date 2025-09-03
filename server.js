const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware для обработки JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Store users and messages
const users = new Map();
const messages = new Map();

// Добавим несколько тестовых пользователей
users.set('test@example.com', {
    id: 'user1',
    username: 'TestUser',
    email: 'test@example.com',
    password: 'password',
    online: false
});

users.set('alice@example.com', {
    id: 'user2',
    username: 'Alice',
    email: 'alice@example.com',
    password: '123456',
    online: false
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle user registration
    socket.on('register', (userData) => {
        if (users.has(userData.email)) {
            socket.emit('registerError', 'User already exists');
            return;
        }

        const newUser = {
            ...userData,
            id: 'user' + (users.size + 1),
            online: true,
            socketId: socket.id
        };
        
        users.set(userData.email, newUser);
        socket.emit('registered', newUser);
        console.log('User registered:', userData.email);
    });

    // Handle user login
    socket.on('login', (credentials) => {
        const user = users.get(credentials.email);
        
        if (user && user.password === credentials.password) {
            user.online = true;
            user.socketId = socket.id;
            socket.emit('loggedIn', user);
            console.log('User logged in:', user.email);
        } else {
            socket.emit('loginError', 'Invalid credentials');
        }
    });

    // Handle contact search
    socket.on('searchContacts', (query) => {
        const results = Array.from(users.values()).filter(user => 
            user.email.includes(query) || user.username.includes(query)
        );
        socket.emit('contactResults', results);
    });

    // Handle sending messages
    socket.on('sendMessage', (messageData) => {
        const message = {
            ...messageData,
            timestamp: new Date(),
            id: Date.now().toString()
        };
        
        // Store message
        if (!messages.has(messageData.chatId)) {
            messages.set(messageData.chatId, []);
        }
        messages.get(messageData.chatId).push(message);
        
        // Send to recipient if online
        const recipient = Array.from(users.values()).find(u => u.id === messageData.recipientId);
        if (recipient && recipient.online) {
            io.to(recipient.socketId).emit('newMessage', message);
        }
        
        socket.emit('messageSent', message);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const user = Array.from(users.values()).find(u => u.socketId === socket.id);
        if (user) {
            user.online = false;
            console.log('User disconnected:', user.email);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});