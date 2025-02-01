const crypto = require("crypto");
const db = require("../db");
const Utils = require("../Utils");

module.exports = async function (req, res, next) {
    let email = req.query.email;
    let password = req.query.password;

    if (!email || !password) {
        Utils.sendError(res, "Authentication failed. Email or password is missing.");
        return;
    }

    let user = await db.getUserByEmail(email);
    // Check user exists
    if (!user) {
        Utils.sendError(res, "Authentication failed. Invalid email or password");
        return;
    }

    if (user.salt) {
        // Encrypt password before comparing
        password = crypto.createHmac("sha1", user.salt).update(password).digest("hex");
    }

    if (password != user.password) {
        Utils.sendError(res, "Authentication failed. Invalid password");
        return;
    }

    let token = Utils.createToken(user._id, user.email, user.admin);

    Utils.sendResult(res, {
        token: token,
        userId: user._id,
        fullName: user.fullName,
        email: user.email,
        admin: user.admin,
    });
};