const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/recent-posts
router.get('/', async (req, res) => {
    const { limit, skip, sortBy, order, dateFrom, dateTo, category } = req.query;
    
    console.log('Recent posts request:', { limit, skip, sortBy, order, dateFrom, dateTo, category });
    
    let filter = {};
    if (dateFrom || dateTo) {
        // Check what date field exists in the database first
        try {
            const db = require('../db');
            const postsCollection = db.getClient().db('school-gossip-forum').collection('Posts');
            const samplePost = await postsCollection.findOne({});
            
            if (samplePost) {
                const dateField = samplePost.creationDate ? 'creationDate' : 'createdAt';
                filter[dateField] = {};
                if (dateFrom) filter[dateField].$gte = new Date(dateFrom);
                if (dateTo) filter[dateField].$lte = new Date(dateTo);
                console.log(`Using date field: ${dateField}`, filter[dateField]);
            }
        } catch (error) {
            console.error('Error checking date fields:', error);
        }
    }
    
    // Add category filter if specified
    if (category && category !== 'All') {
        filter.category = category;
    }
    
    // Convert order string to number
    let orderNum = -1; // default to descending
    if (order === 'asc') orderNum = 1;
    else if (order === 'desc') orderNum = -1;
    
    console.log('Applied filter:', filter);
    console.log('Sort options:', { sortBy, order: orderNum });
    
    try {
        const result = await db.getRecentPosts({
            limit: parseInt(limit) || 10,
            skip: parseInt(skip) || 0,
            sortBy: sortBy || 'recent',
            order: orderNum,
            filter
        });
        console.log('Found posts:', result.posts.length, 'Total:', result.total);
        res.json(result);
    } catch (error) {
        console.error('Error in recent posts:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await db.getCategories();
        res.json({ categories });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
