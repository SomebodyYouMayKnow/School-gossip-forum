const express = require("express");
const logger = require("morgan");
const config = require("./config.js");
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

// Middleware
app.use(logger("dev"));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Test route to verify server is working
app.get('/test', (req, res) => {
    res.json({ message: 'Test route working' });
});

// Routes
app.use("/api/login", require("./Routes/Login.js"));
app.use("/api/register", require("./Routes/Register.js"));
app.use("/api/checkcookie", require("./Routes/checkcookie.js"));

// Start server
app.listen(config.port, () => {
    console.log("App is listening on " + config.port);
});
