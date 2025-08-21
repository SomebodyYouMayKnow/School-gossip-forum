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

// GET /api/search-posts
router.get('/search', async (req, res) => {
    const { q, limit, skip, sortBy, order, category } = req.query;
    
    console.log('Search request:', { q, limit, skip, sortBy, order, category });
    
    if (!q || q.trim() === '') {
        return res.status(400).json({ error: 'Search query is required' });
    }
    
    // Convert order string to number
    let orderNum = -1; // default to descending
    if (order === 'asc') orderNum = 1;
    else if (order === 'desc') orderNum = -1;
    
    try {
        const result = await db.searchPosts(q.trim(), {
            limit: parseInt(limit) || 20,
            skip: parseInt(skip) || 0,
            sortBy: sortBy || 'recent',
            order: orderNum,
            category: category || null
        });
        console.log('Search results:', result.posts.length, 'Total:', result.total);
        res.json(result);
    } catch (error) {
        console.error('Error in search:', error);
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

// GET /api/debug-posts (for debugging)
router.get('/debug-posts', async (req, res) => {
    try {
        const posts = await db.debugPosts();
        res.json({ posts });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/ensure-categories (to fix posts without categories)
router.post('/ensure-categories', async (req, res) => {
    try {
        const updatedCount = await db.ensureCategories();
        res.json({ success: true, updatedCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/ensure-sorting-fields (to fix posts without upvotes/downvotes)
router.post('/ensure-sorting-fields', async (req, res) => {
    try {
        const result = await db.ensureSortingFields();
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
