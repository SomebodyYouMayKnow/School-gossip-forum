const db = require('../db.js');
const Utils = require("../Utils");

module.exports = async function (req, res, next) {
    try {
        // Extract the cookie from the request
        const cookieData = req.cookies.user;

        // Check the cookie
        const cookieCheckResult = await db.checkCookie(cookieData);

        if (!cookieCheckResult.valid) {
            // If the cookie is invalid, send an unauthorized response
            return res.status(401).json({ message: cookieCheckResult.message });
        }

        // Proceed with creating the post
        const { fullName, userId, postContent } = req.body;
        const response = await db.createPost(fullName, userId, postContent);

        // Send the result
        Utils.sendResult(res, response);
    } catch (error) {
        console.error('Error in CreatePost route:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};