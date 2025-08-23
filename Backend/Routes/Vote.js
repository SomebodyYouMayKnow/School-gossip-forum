const express = require('express');
const router = express.Router();
const db = require('../db');
const { ObjectId } = require('mongodb');

// POST /api/vote
router.post('/', async (req, res) => {
    const { postId, userId, action } = req.body;
    if (!postId || !userId || !['upvote','downvote','remove'].includes(action)) {
        return res.status(400).json({ success: false, message: 'Missing or invalid postId, userId, or action' });
    }
    try {
        // Check if post is deleted or paused
        const dbClient = db.getClient();
        const postsCollection = dbClient.db('school-gossip-forum').collection('Posts');
        const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        // Allow voting even if comments are disabled; only block deleted posts
        if (post.deleted) {
            return res.status(403).json({ success: false, message: 'Voting is disabled for this post.' });
        }
        const result = await db.votePost(postId, userId, action);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
