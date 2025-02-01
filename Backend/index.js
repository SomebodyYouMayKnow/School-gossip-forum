const express = require("express");
const logger = require("morgan");
const config = require("./config.js");
const app = express();
const router = express.Router();
const cors = require('cors');
app.use(logger("dev"));

//router.get("/ViewNotes", cors(), require('./Routes/ViewNotes.js'));
//router.get("/CreateNote", cors(), require('./Routes/CreateNote.js'));
//router.get("/Login", require("./Routes/Login.js"))
router.get("/Login", cors(), require("./Routes/Login.js"))
router.get("/Register", cors(), require("./Routes/Register.js"))


app.use("/", router);

app.listen(config.port, () => {
    console.log("App is listening on " + config.port);
});
