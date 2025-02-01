const jwt = require("jsonwebtoken");
const config = require("./config.js");

module.exports = {

    sendError: function (res, message, detail) {
        res.json({
            error: {
                message: message,
                detail: detail
            }
        });
    },

    sendResult: function (res, object) {
        res.json(object);
    },

    createToken: function (userId, email, admin) {
        let payload = { userId, email, admin };
        return jwt.sign(payload, config.jwtSecret, {
            expiresIn: config.jwtTokenDuration
        });
    }
};