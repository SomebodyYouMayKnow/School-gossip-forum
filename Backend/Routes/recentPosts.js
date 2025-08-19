const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/recent-posts?limit=10
router.get('/', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const posts = await db.getRecentPosts(limit);
        console.log("Recent posts fetched:", posts); // Debugging log
        res.status(200).json({ success: true, posts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }   
});

module.exports = router;
