const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/recent-posts?limit=10
router.get('/', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const skip = parseInt(req.query.skip) || 0;
        const posts = await db.getRecentPosts(limit, skip);
        const dbInstance = db.getClient().db('school-gossip-forum');
        const total = await dbInstance.collection('Posts').countDocuments();
        res.status(200).json({ success: true, posts, total });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
