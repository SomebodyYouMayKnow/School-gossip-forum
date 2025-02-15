const db = require('../db.js');
const Utils = require("../Utils");

module.exports = async function (req, res, next) {
    try {
        // Extract the cookie from the request
        const cookieData = req.cookies.user;
        console.log('Cookie data:', cookieData);

        // Check the cookie
        const cookieCheckResult = await db.checkCookie(cookieData);
        console.log('Cookie check result:', cookieCheckResult);

        if (!cookieCheckResult.valid) {
            // If the cookie is invalid, send an unauthorized response
            return res.status(401).json({ message: cookieCheckResult.message });
        }

        // Proceed with creating the post
        const { fullName, userId, postContent } = req.body;
        console.log('Request body:', req.body);

        const response = await db.createPost(fullName, userId, postContent);
        console.log('Create post response:', response);

        // Send the result
        Utils.sendResult(res, response);
    } catch (error) {
        console.error('Error in CreatePost route:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};