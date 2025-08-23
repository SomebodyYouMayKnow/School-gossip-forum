const express = require('express');
const router = express.Router();
const db = require('../db');
const config = require('../config');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

function getMongo() {
  return db.getClient().db('school-gossip-forum');
}

async function authFromToken(req) {
  // Expect token in Authorization: Bearer <token> OR in body.token
  let token = null;
  const auth = req.headers['authorization'] || '';
  if (auth.startsWith('Bearer ')) token = auth.substring('Bearer '.length);
  if (!token && req.body && req.body.token) token = req.body.token;
  if (!token && req.query && req.query.token) token = req.query.token;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    return {
      userId: decoded.userId,
      email: decoded.email,
      fullName: decoded.fullName,
      admin: !!decoded.admin,
      token,
    };
  } catch (e) {
    return null;
  }
}

function shapePoll(poll) {
  const counts = new Array(poll.options.length).fill(0);
  const votes = poll.votes || [];
  for (const v of votes) {
    if (typeof v.option === 'number' && v.option >= 0 && v.option < counts.length) {
      counts[v.option]++;
    }
  }
  return {
    _id: poll._id,
    question: poll.question,
    options: poll.options,
    active: !!poll.active,
    createdAt: poll.createdAt,
    createdBy: poll.createdBy || null,
    counts,
    totalVotes: votes.length,
  };
}

// GET /api/polls - public list (active by default). Admin can request all=1 to list all
router.get('/', async (req, res) => {
  try {
    const user = await authFromToken(req);
    const wantAll = req.query.all === '1' || req.query.all === 'true';
    const col = getMongo().collection('Polls');
    const filter = user && user.admin && wantAll ? {} : { active: true };
    const polls = await col.find(filter).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, polls: polls.map(shapePoll) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/polls - create (admin)
router.post('/', async (req, res) => {
  try {
    const user = await authFromToken(req);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    // Verify admin from DB to be safe
    const usersCol = getMongo().collection('Users');
    const userDoc = await usersCol.findOne({ _id: new ObjectId(user.userId) });
    if (!userDoc || !(userDoc.admin === true || userDoc.admin === 'true')) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { question, options, active = true } = req.body || {};
    if (!question || !Array.isArray(options) || options.filter(o => (o||'').trim()).length < 2) {
      return res.status(400).json({ success: false, message: 'Question and at least 2 options are required' });
    }
    const trimmed = options.map(o => (o||'').trim()).filter(Boolean);
    const col = getMongo().collection('Polls');
    const doc = {
      question: question.trim(),
      options: trimmed,
      active: !!active,
      createdAt: new Date(),
      createdBy: user.userId,
      votes: [],
    };
    const result = await col.insertOne(doc);
    const saved = await col.findOne({ _id: result.insertedId });
    res.json({ success: true, poll: shapePoll(saved) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// PATCH /api/polls/:id/toggle - activate/deactivate (admin)
router.patch('/:id/toggle', async (req, res) => {
  try {
    const user = await authFromToken(req);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const usersCol = getMongo().collection('Users');
    const userDoc = await usersCol.findOne({ _id: new ObjectId(user.userId) });
    if (!userDoc || !(userDoc.admin === true || userDoc.admin === 'true')) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const id = req.params.id;
    const col = getMongo().collection('Polls');
    const poll = await col.findOne({ _id: new ObjectId(id) });
    if (!poll) return res.status(404).json({ success: false, message: 'Not found' });
    const newVal = !(poll.active === true);
    await col.updateOne({ _id: poll._id }, { $set: { active: newVal } });
    const updated = await col.findOne({ _id: poll._id });
    res.json({ success: true, poll: shapePoll(updated) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE /api/polls/:id - delete (admin)
router.delete('/:id', async (req, res) => {
  try {
    const user = await authFromToken(req);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const usersCol = getMongo().collection('Users');
    const userDoc = await usersCol.findOne({ _id: new ObjectId(user.userId) });
    if (!userDoc || !(userDoc.admin === true || userDoc.admin === 'true')) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const id = req.params.id;
    const col = getMongo().collection('Polls');
    const result = await col.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/polls/:id/reset - reset votes (admin)
router.post('/:id/reset', async (req, res) => {
  try {
    const user = await authFromToken(req);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const usersCol = getMongo().collection('Users');
    const userDoc = await usersCol.findOne({ _id: new ObjectId(user.userId) });
    if (!userDoc || !(userDoc.admin === true || userDoc.admin === 'true')) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const id = req.params.id;
    const col = getMongo().collection('Polls');
    const poll = await col.findOne({ _id: new ObjectId(id) });
    if (!poll) return res.status(404).json({ success: false, message: 'Not found' });
    await col.updateOne({ _id: poll._id }, { $set: { votes: [] } });
    const updated = await col.findOne({ _id: poll._id });
    res.json({ success: true, poll: shapePoll(updated) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/polls/:id/vote - cast a vote (login required).
// Non-admin: may vote once but can change their choice later (updates existing vote).
// Admin: may add any number of votes with { count }, and may also change their own prior vote when count=1.
router.post('/:id/vote', async (req, res) => {
  try {
    const user = await authFromToken(req);
    if (!user) return res.status(401).json({ success: false, message: 'Login required' });

    const id = req.params.id;
    const { option } = req.body || {};
    const col = getMongo().collection('Polls');
    const poll = await col.findOne({ _id: new ObjectId(id) });
    if (!poll) return res.status(404).json({ success: false, message: 'Not found' });
    if (!poll.active) return res.status(403).json({ success: false, message: 'Poll is inactive' });

    const optIdx = typeof option === 'number' ? option : parseInt(option, 10);
    if (isNaN(optIdx) || optIdx < 0 || optIdx >= poll.options.length) {
      return res.status(400).json({ success: false, message: 'Invalid option' });
    }

    const hasVoted = (poll.votes || []).some(v => v.userId === user.userId);

    // Parse count for admin bulk voting
    let count = 1;
    if (user.admin) {
      const raw = req.body && (req.body.count ?? 1);
      const n = parseInt(raw, 10);
      if (!isNaN(n) && n > 0) count = Math.min(n, 1000); // safety cap
    }

    if (!user.admin) {
      // Non-admin: insert once or update existing vote (change vote)
      if (hasVoted) {
        await col.updateOne(
          { _id: poll._id, 'votes.userId': user.userId },
          { $set: { 'votes.$.option': optIdx, 'votes.$.at': new Date() } }
        );
      } else {
        await col.updateOne(
          { _id: poll._id },
          { $push: { votes: { userId: user.userId, option: optIdx, at: new Date() } } }
        );
      }
    } else {
      // Admin: when count > 1, push multiple votes; when count == 1 and admin hasVoted, update their existing one
      if (count === 1 && hasVoted) {
        await col.updateOne(
          { _id: poll._id, 'votes.userId': user.userId },
          { $set: { 'votes.$.option': optIdx, 'votes.$.at': new Date() } }
        );
      } else {
        const now = new Date();
        const votesArray = Array.from({ length: count }, () => ({ userId: user.userId, option: optIdx, at: now }));
        await col.updateOne(
          { _id: poll._id },
          { $push: { votes: { $each: votesArray } } }
        );
      }
    }

    const updated = await col.findOne({ _id: poll._id });
    res.json({ success: true, poll: shapePoll(updated) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
