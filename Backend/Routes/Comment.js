const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/comment (add comment or reply)
router.post('/', async (req, res) => {
    const { postId, userId, fullName, text, parentCommentId } = req.body;
    if (!postId || !userId || !text) {
        return res.status(400).json({ success: false, message: 'Missing postId, userId, or text' });
    }
    try {
        const comment = await db.addComment(postId, userId, fullName, text, parentCommentId);
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
        const reply = await db.replyToComment(postId, parentCommentId, userId, fullName, text);
        res.status(200).json({ success: true, reply });
    } catch (error) {
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
