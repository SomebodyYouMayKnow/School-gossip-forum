const express = require("express");
const logger = require("morgan");
const config = require("./config.js");
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const http = require('http');
const app = express();

// Middleware
app.use(logger("dev"));
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'];
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            return callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test route to verify server is working
app.get('/test', (req, res) => {
    res.json({ message: 'Test route working' });
});

// Routes
app.use("/api/login", require("./Routes/Login.js"));
app.use("/api/register", require("./Routes/Register.js"));
app.use("/api/checkcookie", require("./Routes/checkcookie.js"));
app.use("/api/createpost", require("./Routes/CreatePost.js"));
app.use("/api/recent-posts", require("./Routes/recentPosts.js"));
app.use("/api/post", require("./Routes/Post.js"));
app.use("/api/upvote", require("./Routes/Upvote.js"));
app.use("/api/vote", require("./Routes/Vote.js"));
app.use("/api/comment", require("./Routes/Comment.js"));
app.use("/api/email-verification", require("./Routes/EmailVerification.js"));
app.use("/api/migrate", require("./Routes/migrate.js"));
app.use("/api/polls", require("./Routes/Polls.js"));

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);

// Socket.IO setup
let io;
try {
    const { Server } = require('socket.io');
    io = new Server(server, {
        cors: {
            origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    const recentMessages = [];
    const MAX_BUFFER = 50;

    io.on('connection', (socket) => {
        console.log('[socket.io] client connected', socket.id);
        // Send recent buffer to the newly connected client
        socket.emit('chat:init', recentMessages);
        socket.emit('chat:message', { id: 'server-ping', user: 'System', text: 'Welcome! Socket connected.', ts: new Date().toISOString() });

        socket.on('chat:message', (msg) => {
            const safe = {
                id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
                text: typeof msg?.text === 'string' ? msg.text.slice(0, 1000) : '',
                user: typeof msg?.user === 'string' ? msg.user.slice(0, 64) : 'Anonymous',
                ts: new Date().toISOString(),
            };
            if (!safe.text) return;
            console.log('[socket.io] message from', socket.id, safe.user + ':', safe.text);
            recentMessages.push(safe);
            if (recentMessages.length > MAX_BUFFER) recentMessages.shift();
            io.emit('chat:message', safe);
        });

        socket.on('disconnect', (reason) => {
            console.log('[socket.io] client disconnected', socket.id, reason);
        });
    });
} catch (e) {
    console.warn('Socket.IO not installed. Live chat disabled. Run `npm i socket.io` in backend.');
}

// Start server
server.listen(config.port, () => {
    console.log("App is listening on " + config.port);
});