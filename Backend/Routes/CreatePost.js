const express = require('express');
const router = express.Router();
const db = require('../db.js');
const jwt = require('jsonwebtoken');
const config = require('../config.js');
const Utils = require('../Utils.js');
const userSettings = require('../userSettings.js'); // Import user settings

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
                let user = await db.getUserById(newPost.userID);
                // If user is premium, skip cooldown
                if (user.premium || user.admin) {
                    Utils.sendResult(res, { success: true, message: 'Post created successfully', newPost });
                    db.updateUserLastPost(userId, new Date());
                    return;
                }
                const downtime = new Date(Date.now() - userSettings.timeBetweenPosts); 
                if (user.lastPost && new Date(user.lastPost) > downtime) {
                    Utils.sendError(res, 'You cannot create a new post within 5 hours of your last post.');
                    db.deletePost(newPost._id);
                    return;
                } else {
                    Utils.sendResult(res, { success: true, message: 'Post created successfully', newPost });
                    db.updateUserLastPost(userId, new Date());
                    return;
                }
                
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