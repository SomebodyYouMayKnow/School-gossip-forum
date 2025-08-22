const express = require("express");
const logger = require("morgan");
const config = require("./config.js");
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const app = express();

// Middleware
app.use(logger("dev"));
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
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

// Start server
app.listen(config.port, () => {
    console.log("App is listening on " + config.port);
});