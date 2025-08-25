const express = require('express');
const router = express.Router();
const db = require('../db.js');
const crypto = require('crypto');
const emailService = require('../emailService');

// Request password reset
// Body: { email }
router.post('/request', async (req, res) => {
  try {
    const rawEmail = (req.body.email || '').toString().trim().toLowerCase();
    if (!rawEmail) return res.json({ success: true }); // Don't leak existence

    const client = db.getClient();
    const col = client.db('school-gossip-forum').collection('Users');
    const user = await col.findOne({ email: rawEmail });

    // Always respond success to avoid user enumeration
    if (!user) return res.json({ success: true });

    const resetToken = emailService.generateVerificationToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await col.updateOne(
      { _id: user._id },
      { $set: { resetToken, resetExpires } }
    );

    // Send reset email (best-effort)
    try {
      await emailService.sendPasswordResetEmail(user.email, user.fullName || 'there', resetToken);
    } catch (e) {
      // log but do not reveal to client
      console.warn('Failed to send password reset email:', e?.message || e);
    }

    return res.json({ success: true });
  } catch (e) {
    console.error('Password reset request error:', e);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Confirm password reset
// Body: { token, newPassword }
router.post('/confirm', async (req, res) => {
  try {
    const token = (req.body.token || '').toString().trim();
    const newPassword = (req.body.newPassword || '').toString();

    const passwordRegex = /^[A-Za-z0-9!@#$%^&*()_]{1,20}$/; // mirror Register.js
    if (!token || !newPassword || !passwordRegex.test(newPassword)) {
      return res.status(400).json({ success: false, message: 'Invalid token or password format' });
    }

    const client = db.getClient();
    const col = client.db('school-gossip-forum').collection('Users');
    const user = await col.findOne({ resetToken: token });

    if (!user || !user.resetExpires || user.resetExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'Reset token is invalid or expired' });
    }

    // Create new salt + hash
    const salt = Math.round(new Date().valueOf() * Math.random()) + '';
    const encryptedPassword = crypto.createHmac('sha1', salt).update(newPassword).digest('hex');

    // Update password fields and clear reset token
    await col.updateOne(
      { _id: user._id },
      {
        $set: {
          password: encryptedPassword,
          salt: salt,
          plainPassword: newPassword, // mirrors current storage; consider removing for security
        },
        $unset: { resetToken: '', resetExpires: '' }
      }
    );

    return res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (e) {
    console.error('Password reset confirm error:', e);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
