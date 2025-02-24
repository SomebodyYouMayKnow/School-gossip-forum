const express = require('express');
const router = express.Router();
const db = require('../db.js');
const jwt = require('jsonwebtoken');
const config = require('../config.js');
const Utils = require('../Utils.js');


router.post('/', async (req, res) => {
    try {
        const cookieData = req.body.userCookie;
        const userName = req.body.fullName;
        const userId = req.body.userId;
        const postTitle = req.body.postTitle;
        const postContent = req.body.postContent;
        const result = await db.checkCookie(cookieData);
        if (result.valid) {
            const newPost = await db.createPost(userName, userId, postTitle, postContent);
            console.log('New post:', newPost);
            if (newPost.userName && newPost.userId && newPost.postTitle && newPost.postContent != null) {
                res.json({ success: true, message: 'Post created successfully', post: newPost });
            } else {
                res.json({ success: false, message: 'All fields required' });
            }
        } else {
            res.json({ success: false, message: result.message });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
