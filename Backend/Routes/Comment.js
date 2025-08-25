const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');


// ...existing code...

// DELETE /api/comment (admin only)
router.delete('/', async (req, res) => {
    // Accept postId, commentId, adminId in body (or query for DELETE)
    const { postId, commentId, adminId } = req.body;
    if (!postId || !commentId || !adminId) {
        return res.status(400).json({ success: false, message: 'Missing postId, commentId, or adminId' });
    }
    try {
        const result = await db.deleteComment(postId, commentId, adminId);
        if (result.success) {
            return res.status(200).json({ success: true, type: result.type });
        } else {
            return res.status(403).json({ success: false, message: result.message });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/comment/user (user can delete their own comment)
router.delete('/user', async (req, res) => {
    const { postId, commentId, userId } = req.body;
    if (!postId || !commentId || !userId) {
        return res.status(400).json({ success: false, message: 'Missing postId, commentId, or userId' });
    }
    try {
        const result = await db.deleteUserComment(postId, commentId, userId);
        if (result.success) {
            return res.status(200).json({ success: true, type: result.type });
        } else {
            return res.status(403).json({ success: false, message: result.message });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
const db = require('../db');
const { ObjectId } = require('mongodb');

const userSettings = require('../userSettings.js');
// Multer config for comment image uploads
const commentStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const postId = req.body.postId || 'unassigned';
        const safePost = String(postId).replace(/[^a-zA-Z0-9_-]/g, '');
        const dest = path.join(__dirname, '..', 'uploads', 'comments', safePost);
        try {
            fs.mkdirSync(dest, { recursive: true });
        } catch {}
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, 'comment-' + uniqueSuffix + ext);
    }
});
const imageFileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
};
const upload = multer({
    storage: commentStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024, files: 3 }
});

// POST /api/comment (add comment or reply) with optional images
router.post('/', upload.array('images', 3), async (req, res) => {
    // Support both JSON and multipart
    const { postId, userId, fullName, text, parentCommentId } = req.body;
    if (!postId || !userId || !text) {
        return res.status(400).json({ success: false, message: 'Missing postId, userId, or text' });
    }
    try {
        // Check if post is deleted or paused
        const dbClient = db.getClient();
        const postsCollection = dbClient.db('school-gossip-forum').collection('Posts');
        const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        if (post.deleted || post.commentsDisabled) {
            return res.status(403).json({ success: false, message: 'Comments are disabled for this post.' });
        }
        // Enforce timeBetweenComments
        const usersCollection = dbClient.db('school-gossip-forum').collection('Users');
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
        if (user && user.lastComment && !(user.premium || user.admin)) {
            const now = Date.now();
            const last = new Date(user.lastComment).getTime();
            if (now - last < userSettings.timeBetweenComments) {
                const waitSec = Math.ceil((userSettings.timeBetweenComments - (now - last)) / 1000);
                return res.status(429).json({ success: false, message: `Please wait ${waitSec} seconds before commenting again.` });
            }
        }
        // Process uploaded images if any
        let images = [];
        if (req.files && req.files.length) {
            const safePost = String(postId).replace(/[^a-zA-Z0-9_-]/g, '');
            images = req.files.map(f => `comments/${safePost}/${f.filename}`);
        }
        // Add comment
        const comment = await db.addComment(postId, userId, fullName, text, parentCommentId, images);
        // Update lastComment
        await usersCollection.updateOne({ _id: new ObjectId(userId) }, { $set: { lastComment: new Date() } });
        res.status(200).json({ success: true, comment });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/comment/like (like/unlike a comment)
router.post('/like', async (req, res) => {
    const { postId, commentId, userId, action } = req.body;
    if (!postId || !commentId || !userId || !action) {
        return res.status(400).json({ success: false, message: 'Missing postId, commentId, userId, or action' });
    }
    try {
        const result = await db.likeComment(postId, commentId, userId, action);
        res.status(200).json({ success: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/comment/reply (reply to a comment)
router.post('/reply', upload.array('images', 3), async (req, res) => {
    const { postId, parentCommentId, userId, fullName, text } = req.body;
    if (!postId || !parentCommentId || !userId || !text) {
        return res.status(400).json({ success: false, message: 'Missing postId, parentCommentId, userId, or text' });
    }
    try {
        // Enforce timeBetweenComments for replies too
        const dbClient = db.getClient();
        const usersCollection = dbClient.db('school-gossip-forum').collection('Users');
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
        if (user && user.lastComment && !(user.premium || user.admin)) {
            const now = Date.now();
            const last = new Date(user.lastComment).getTime();
            if (now - last < userSettings.timeBetweenComments) {
                const waitSec = Math.ceil((userSettings.timeBetweenComments - (now - last)) / 1000);
                return res.status(429).json({ success: false, message: `Please wait ${waitSec} seconds before commenting again.` });
            }
        }
        // Process uploaded images if any
        let images = [];
        if (req.files && req.files.length) {
            const safePost = String(postId).replace(/[^a-zA-Z0-9_-]/g, '');
            images = req.files.map(f => `comments/${safePost}/${f.filename}`);
        }
        // Add reply
        const reply = await db.replyToComment(postId, parentCommentId, userId, fullName, text, images);
        // Update lastComment
        await usersCollection.updateOne({ _id: new ObjectId(userId) }, { $set: { lastComment: new Date() } });
        res.status(200).json({ success: true, reply });
    } catch (error) {
        console.error('Error in /api/comment/reply:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/comment/:postId
router.get('/:postId', async (req, res) => {
    try {
        const comments = await db.getComments(req.params.postId);
        res.status(200).json({ success: true, comments });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
