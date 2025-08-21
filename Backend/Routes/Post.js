



const express = require('express');
const router = express.Router();
const db = require('../db');
const { ObjectId } = require('mongodb');

// PATCH /api/post/:id/pause
router.patch('/:id/pause', async (req, res) => {
    const { adminId, pause } = req.body;
    if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }
    if (!adminId || typeof pause !== 'boolean') {
        return res.status(400).json({ success: false, message: 'adminId and pause(boolean) required' });
    }
    try {
        const result = await db.setPostCommentsDisabled(req.params.id, adminId, pause);
        if (result.success) {
            res.status(200).json({ success: true });
        } else {
            res.status(403).json({ success: false, message: result.message });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

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
    const { reason, adminId, hide } = req.body;
    if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }
    if (!reason || !adminId) {
        return res.status(400).json({ success: false, message: 'Reason and adminId required' });
    }
    try {
    // Optionally, check admin privileges here
    const result = await db.markPostAsDeleted(req.params.id, reason, adminId, !!hide);
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
