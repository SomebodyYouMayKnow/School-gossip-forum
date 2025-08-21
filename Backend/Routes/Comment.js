const express = require('express');
const router = express.Router();


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
const db = require('../db');
const { ObjectId } = require('mongodb');

const userSettings = require('../userSettings.js');
// POST /api/comment (add comment or reply)
router.post('/', async (req, res) => {
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
        // Add comment
        const comment = await db.addComment(postId, userId, fullName, text, parentCommentId);
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
router.post('/reply', async (req, res) => {
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
        // Add reply
        const reply = await db.replyToComment(postId, parentCommentId, userId, fullName, text);
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
