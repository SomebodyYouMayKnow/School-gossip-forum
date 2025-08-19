const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/recent-posts?limit=10
// GET /api/recent-posts?limit=10&skip=0&sortBy=recent|old|upvotes|downvotes|comments&order=desc|asc&dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD
router.get('/', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const skip = parseInt(req.query.skip) || 0;
        const sortBy = req.query.sortBy || 'recent';
        const order = req.query.order === 'asc' ? 1 : -1;
        const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : null;
        const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : null;

        const filter = {};
        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom) filter.createdAt.$gte = dateFrom;
            if (dateTo) filter.createdAt.$lte = dateTo;
        }

        const posts = await db.getRecentPosts({
            limit,
            skip,
            sortBy,
            order,
            filter
        });
        const dbInstance = db.getClient().db('school-gossip-forum');
        const total = await dbInstance.collection('Posts').countDocuments(filter);
        res.status(200).json({ success: true, posts, total });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
