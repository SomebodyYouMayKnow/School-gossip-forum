const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db.js');
const jwt = require('jsonwebtoken');
const config = require('../config.js');
const Utils = require('../Utils.js');
const userSettings = require('../userSettings.js'); // Import user settings

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Get category from request body, default to 'general'
        const category = req.body.category || 'General';
        // Sanitize category name for folder structure
        const sanitizedCategory = category.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const categoryPath = path.join(__dirname, '../uploads', sanitizedCategory);
        
        // Create category directory if it doesn't exist
        if (!fs.existsSync(categoryPath)) {
            fs.mkdirSync(categoryPath, { recursive: true });
        }
        cb(null, categoryPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp and random string
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, 'image-' + uniqueSuffix + extension);
    }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 5 // Maximum 5 files
    }
});

router.post('/', upload.array('images', 5), async (req, res) => {
    try {
        const cookieData = JSON.parse(req.body.userCookie);
        const userName = cookieData.fullName;
        const userId = cookieData.userId;
        const email = cookieData.email;
        const postTitle = req.body.postTitle;
        const postContent = req.body.postContent;
        const category = req.body.category || 'General'; // Add category support
        
        // Process uploaded images
        const imagePaths = [];
        if (req.files && req.files.length > 0) {
            const sanitizedCategory = category.toLowerCase().replace(/[^a-z0-9]/g, '-');
            req.files.forEach(file => {
                // Store relative path with category subdirectory
                imagePaths.push(`${sanitizedCategory}/${file.filename}`);
            });
        }
        
        const result = await db.checkCookie(cookieData);
        if (!result.valid) {
            Utils.sendError(res, 'Invalid cookie, please log in again.', result.message);
            return;
        } else if (result.valid) {
            const newPost = await db.createPost(email, userId, userName, postTitle, postContent, category, imagePaths);
            if (newPost.fullName == "" || newPost.postTitle == "" || newPost.postContent == "" || newPost.userId == "" || newPost.email == "") {
                Utils.sendError(res, 'Please fill out all the fields');
                db.deletePost(newPost._id);
                return;
            } else if (String(newPost.email) == String(email) && String(newPost.userID) == String(userId) && String(newPost.fullName) == String(userName) && String(newPost.postTitle) == String(postTitle) && String(newPost.postContent) == String(postContent)) {
                let user = await db.getUserById(newPost.userID);
                // Debug log: print user object and admin/premium status
                console.log('DEBUG: user fetched for cooldown check:', user);
                console.log('DEBUG: user.premium:', user && user.premium, 'user.admin:', user && user.admin);
                // If user is premium or admin, skip cooldown
                // Accept boolean true or string 'true' for premium/admin
                const isPremium = user && (user.premium === true || user.premium === 'true');
                const isAdmin = user && (user.admin === true || user.admin === 'true');
                if (isPremium || isAdmin) {
                    console.log('DEBUG: User is premium or admin, skipping cooldown.');
                    Utils.sendResult(res, { success: true, message: 'Post created successfully', postId: newPost._id, newPost });
                    db.updateUserLastPost(userId, new Date());
                    return;
                }
                const downtime = new Date(Date.now() - userSettings.timeBetweenPosts); 
                if (user.lastPost && new Date(user.lastPost) > downtime) {
                    Utils.sendError(res, 'You cannot create a new post within 5 hours of your last post.');
                    db.deletePost(newPost._id);
                    return;
                } else {
                    Utils.sendResult(res, { success: true, message: 'Post created successfully', postId: newPost._id, newPost });
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