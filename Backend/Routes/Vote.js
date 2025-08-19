const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/vote
router.post('/', async (req, res) => {
    const { postId, userId, action } = req.body;
    if (!postId || !userId || !['upvote','downvote','remove'].includes(action)) {
        return res.status(400).json({ success: false, message: 'Missing or invalid postId, userId, or action' });
    }
    try {
        const result = await db.votePost(postId, userId, action);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
