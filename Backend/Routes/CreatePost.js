const express = require('express');
const router = express.Router();
const db = require('../db.js');
const jwt = require('jsonwebtoken');
const config = require('../config.js');
const Utils = require('../Utils.js');


router.post('/', async (req, res) => {
    try {
        const cookieData = req.body.userCookie;
        const userName = req.body.userCookie.fullName;
        const userId = req.body.userCookie.userId;
        const email = req.body.userCookie.email;
        const postTitle = req.body.postTitle;
        const postContent = req.body.postContent;
        const result = await db.checkCookie(cookieData);
        if (!result.valid) {
            Utils.sendError(res, 'Invalid cookie, please log in again.', result.message);
            return;
        } else if (result.valid) {
            const newPost = await db.createPost(email, userId, userName, postTitle, postContent);
            if (newPost.fullName == "" || newPost.postTitle == "" || newPost.postContent == "" || newPost.userId == "" || newPost.email == "") {
                Utils.sendError(res, 'Please fill out all the fields');
                db.deletePost(newPost._id);
                return;
            } else if (String(newPost.email) == String(email) && String(newPost.userID) == String(userId) && String(newPost.fullName) == String(userName) && String(newPost.postTitle) == String(postTitle) && String(newPost.postContent) == String(postContent)) {
                db.getUserById(newPost.userID);

                Utils.sendResult(res, { success: true, message: 'Post created successfully', newPost });
                return;
            } else {
                Utils.sendError(res, 'Error creating post. Please try again.');
                db.deletePost(newPost._id);
                return;
            }
            
        }
    } catch (error) {
        Utils.sendError(res, 'Error somewhere. Please contanct support, give them : ', error.message);
    }
});

module.exports = router;
