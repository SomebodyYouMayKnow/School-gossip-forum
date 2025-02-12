const express = require("express");
const logger = require("morgan");
const config = require("./config.js");
const cors = require('cors');
const bodyParser = require('body-parser'); // Import body-parser
const app = express();
const router = express.Router();

app.use(logger("dev"));
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json()); // Parse JSON request bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded request bodies

//router.post("/ViewNotes", cors(), require('./Routes/ViewNotes.js'));
//router.post("/CreateNote", cors(), require('./Routes/CreateNote.js'));
//router.post("/Login", require("./Routes/Login.js"))
router.post("/Login", require("./Routes/Login.js"));
router.post("/Register", require("./Routes/Register.js"));
router.post("/verifyuser", require("./Routes/verifyuser.js"));

app.use("/", router);

app.listen(config.port, () => {
    console.log("App is listening on " + config.port);
});