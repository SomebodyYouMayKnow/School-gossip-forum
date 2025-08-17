const express = require("express");
const router = express.Router();
const db = require("../db.js");
const crypto = require("crypto");
const jwt = require('jsonwebtoken');
const config = require('../config.js');

router.post("/", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await db.getUserByEmail(email);

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        const encryptedPassword = crypto
            .createHmac("sha1", user.salt)
            .update(password)
            .digest("hex");
        if (!user.banned) {
            if (encryptedPassword === user.password) {
                // Create token with all necessary user data
                const tokenPayload = {
                    userId: user._id.toString(),
                    email: user.email,
                    fullName: user.fullName,
                    admin: user.admin || false
                };

                const token = jwt.sign(
                    tokenPayload,
                    config.jwtSecret,
                    { expiresIn: config.jwtTokenDuration }
                );

                res.json({
                    success: true,
                    token: token,
                    userId: user._id.toString(),
                    email: user.email,
                    fullName: user.fullName,
                    admin: user.admin || false
                });
            } else {
                res.json({ success: false, message: "Invalid password" });
            }
        } else {
            res.json({success: false, message: "You are banned. To contact a moderator. You can do this by emailing ..."})
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
