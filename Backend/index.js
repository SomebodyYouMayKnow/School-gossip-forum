const express = require("express");
const logger = require("morgan");
const config = require("./config.js");
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();

// Middleware
app.use(logger("dev"));
app.use(cors({
    origin: 'http://localhost:3000', // Replace with your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Test route to verify server is working
app.get('/test', (req, res) => {
    res.json({ message: 'Test route working' });
});

// Routes
app.use("/api/login", require("./Routes/Login.js"));
app.use("/api/register", require("./Routes/Register.js"));
app.use("/api/checkcookie", require("./Routes/checkcookie.js"));
app.use("/api/createpost", require("./Routes/CreatePost.js"));

// Start server
app.listen(config.port, () => {
    console.log("App is listening on " + config.port);
});