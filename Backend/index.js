const express = require("express");
const logger = require("morgan");
const config = require("./config.js");
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const http = require('http');
const mongo = require('./db.js');
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

    io.on('connection', async (socket) => {
        console.log('[socket.io] client connected', socket.id);
        // Load last 50 messages from MongoDB and send to the newly connected client
        try {
            const client = mongo.getClient();
            const db = client.db('school-gossip-forum');
            const rows = await db.collection('ChatMessages')
                .find({})
                .sort({ ts: -1 })
                .limit(50)
                .toArray();
            const history = rows.reverse().map(r => ({ id: r._id?.toString?.() || r.id, user: r.user, text: r.text, ts: r.ts }));
            socket.emit('chat:init', history);
        } catch (e) {
            console.warn('Failed to load chat history:', e?.message || e);
            socket.emit('chat:init', []);
        }
        socket.emit('chat:message', { id: 'server-ping', user: 'System', text: 'Welcome! Socket connected.', ts: new Date().toISOString() });

        socket.on('chat:message', async (msg) => {
            const safe = {
                text: typeof msg?.text === 'string' ? msg.text.slice(0, 1000) : '',
                user: typeof msg?.user === 'string' ? msg.user.slice(0, 64) : 'Anonymous',
                ts: new Date().toISOString(),
            };
            if (!safe.text) return;
            console.log('[socket.io] message from', socket.id, safe.user + ':', safe.text);
            try {
                const client = mongo.getClient();
                const db = client.db('school-gossip-forum');
                const { insertedId } = await db.collection('ChatMessages').insertOne(safe);
                io.emit('chat:message', { id: insertedId.toString(), ...safe });
            } catch (e) {
                console.warn('Failed to persist chat message:', e?.message || e);
                // Fall back to emitting without persistence
                io.emit('chat:message', { id: Date.now().toString(36), ...safe });
            }
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