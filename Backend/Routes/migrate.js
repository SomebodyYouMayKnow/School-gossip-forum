const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/migrate/posts-voting - Migrate existing posts to have upvotes/downvotes arrays
router.post('/posts-voting', async (req, res) => {
    try {
        const result = await db.migratePostsForVoting();
        res.json(result);
    } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
