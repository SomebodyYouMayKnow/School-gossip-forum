const db = require("../db");
const Utils = require("../Utils");

module.exports = async function (req, res, next) {
    const fullNameRegex = /^[a-zA-Z0-9_]+$/;
    const emailRegex = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    const passwordRegex = /^[A-Za-z0-9!@#$%^&*()_]{1,20}$/;

    console.log('Request Body:', req.body); // Log the entire request body

    let email = req.body.email;
    let fullName = req.body.fullName;
    let password = req.body.password;

    console.log('Email:', email);
    console.log('Full Name:', fullName);
    console.log('Password:', password);

    if (!fullName) {
        Utils.sendError(res, "fullName cannot be empty.");
        return;
    }

    if (fullName.length < 3 || fullName.length > 20) {
        Utils.sendError(res, "fullName length must be between 3 and 20 characters.");
        return;
    }

    if (!fullNameRegex.test(fullName)) {
        Utils.sendError(res, "fullName can only contain letters, digits and underscores.");
        return;
    }

    if (!email) {
        Utils.sendError(res, "email cannot be empty.");
        return;
    }

    if (!emailRegex.test(email)) {
        Utils.sendError(res, "email is invalid.");
        return;
    }

    if (!password) {
        Utils.sendError(res, "password cannot be empty.");
        return;
    }

    if (!passwordRegex.test(password)) {
        Utils.sendError(res, "password contains invalid characters.");
        return;
    }

    let existingUser = await db.getUserByEmail(email);
    if (existingUser) {
        Utils.sendError(res, "User email is already registered");
        return;
    }

    let user = await db.createUser(email, password, fullName);
    console.log(user);
    let token = Utils.createToken(user._id, user.email, false);
    const response = {
        token: token,
        userId: user._id,
        fullName: user.fullName,
        email: user.email,
        admin: user.admin
    };
    console.log('Response:', response); // Log the response
    Utils.sendResult(res, response);
};