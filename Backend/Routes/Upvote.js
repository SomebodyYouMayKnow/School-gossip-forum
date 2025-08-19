const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/upvote
router.post('/', async (req, res) => {
    const { postId, userId } = req.body;
    if (!postId || !userId) {
        return res.status(400).json({ success: false, message: 'Missing postId or userId' });
    }
    try {
        const result = await db.upvotePost(postId, userId);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
