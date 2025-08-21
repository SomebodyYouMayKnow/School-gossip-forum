
const express = require('express');
const router = express.Router();
const db = require('../db');
const { ObjectId } = require('mongodb');

// GET /api/post/:id
router.get('/:id', async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }
    try {
        const post = await db.getPostById(req.params.id);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        res.status(200).json({ success: true, post });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PATCH /api/post/:id/delete
router.patch('/:id/delete', async (req, res) => {
    const { reason, adminId } = req.body;
    if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }
    if (!reason || !adminId) {
        return res.status(400).json({ success: false, message: 'Reason and adminId required' });
    }
    try {
        // Optionally, check admin privileges here
        const result = await db.markPostAsDeleted(req.params.id, reason, adminId);
        if (result.success) {
            res.status(200).json({ success: true });
        } else {
            res.status(404).json({ success: false, message: result.message });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
