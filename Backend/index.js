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

    // Lightweight per-socket rate limiter (3 seconds)
    const RATE_LIMIT_MS = 3000;
    const lastChatAt = new Map(); // socket.id -> timestamp(ms)
    const allowedRooms = new Set(['general', 'sports', 'news', 'teachers', 'school-bullshit']);
    const socketRoom = new Map(); // socket.id -> room

    // Ensure index to speed up history and pruning
    (async () => {
        try {
            const client = mongo.getClient();
            const db = client.db('school-gossip-forum');
            await db.collection('ChatMessages').createIndex({ room: 1, ts: -1 });
        } catch (e) {
            console.warn('Failed to create ChatMessages index:', e?.message || e);
        }
    })();

    // Scheduled pruning: keep only the latest 500 messages per room
    async function pruneRoom(room) {
        try {
            const client = mongo.getClient();
            const db = client.db('school-gossip-forum');
            const col = db.collection('ChatMessages');
            const cutoffDoc = await col
                .find({ room }, { projection: { ts: 1 } })
                .sort({ ts: -1 })
                .skip(500)
                .limit(1)
                .toArray();
            if (cutoffDoc.length) {
                const cutoffTs = cutoffDoc[0].ts;
                await col.deleteMany({ room, ts: { $lt: cutoffTs } });
            }
        } catch (e) {
            console.warn('Prune room failed for', room, e?.message || e);
        }
    }

    setInterval(() => {
        for (const r of allowedRooms) pruneRoom(r);
    }, 60_000);

    io.on('connection', async (socket) => {
        console.log('[socket.io] client connected', socket.id);
        // Room join handler
        socket.on('chat:join', async (roomRaw) => {
            try {
                const room = (String(roomRaw || '') || '').toLowerCase();
                const finalRoom = allowedRooms.has(room) ? room : 'general';
                const prev = socketRoom.get(socket.id);
                if (prev && prev !== finalRoom) {
                    try { socket.leave(prev); } catch {}
                }
                socketRoom.set(socket.id, finalRoom);
                try { socket.join(finalRoom); } catch {}

                // Load last 50 messages for this room
                const client = mongo.getClient();
                const db = client.db('school-gossip-forum');
                const rows = await db.collection('ChatMessages')
                    .find({ room: finalRoom })
                    .sort({ ts: -1 })
                    .limit(50)
                    .toArray();
                const history = rows.reverse().map(r => ({ id: r._id?.toString?.() || r.id, user: r.user, text: r.text, ts: r.ts, admin: !!r.admin, room: r.room }));
                socket.emit('chat:init', history);
                socket.emit('chat:message', { id: 'server-ping', user: 'System', text: `Joined room: ${finalRoom}`, ts: new Date(), room: finalRoom });
            } catch (e) {
                console.warn('Failed to join room or load history:', e?.message || e);
                socket.emit('chat:init', []);
            }
        });

        socket.on('chat:message', async (msg) => {
            // Rate limit check per socket
            const now = Date.now();
            const last = lastChatAt.get(socket.id) || 0;
            if (now - last < RATE_LIMIT_MS) {
                const waitMs = RATE_LIMIT_MS - (now - last);
                try { socket.emit('chat:rate_limit', { waitMs }); } catch {}
                return; // Drop message
            }
            lastChatAt.set(socket.id, now);
            const currentRoom = socketRoom.get(socket.id) || (allowedRooms.has(msg?.room) ? msg.room : 'general');
            socketRoom.set(socket.id, currentRoom);
            const safe = {
                text: typeof msg?.text === 'string' ? msg.text.slice(0, 1000) : '',
                user: typeof msg?.user === 'string' ? msg.user.slice(0, 64) : 'Anonymous',
                ts: new Date(),
                admin: msg && msg.admin === true,
                room: currentRoom
            };
            if (!safe.text) return;
            console.log('[socket.io] message from', socket.id, safe.user + ':', safe.text);
            try {
                const client = mongo.getClient();
                const db = client.db('school-gossip-forum');
                const col = db.collection('ChatMessages');
                const { insertedId } = await col.insertOne(safe);
                io.to(currentRoom).emit('chat:message', { id: insertedId.toString(), ...safe });
            } catch (e) {
                console.warn('Failed to persist chat message:', e?.message || e);
                // Fall back to emitting without persistence
                io.to(currentRoom).emit('chat:message', { id: Date.now().toString(36), ...safe });
            }
        });

        socket.on('disconnect', (reason) => {
            console.log('[socket.io] client disconnected', socket.id, reason);
            // Cleanup
            lastChatAt.delete(socket.id);
            socketRoom.delete(socket.id);
        });
    });
} catch (e) {
    console.warn('Socket.IO not installed. Live chat disabled. Run `npm i socket.io` in backend.');
}

// Start server
server.listen(config.port, () => {
    console.log("App is listening on " + config.port);
});