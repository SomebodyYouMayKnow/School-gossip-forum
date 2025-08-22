const express = require('express');
const router = express.Router();
const db = require('../db.js');
const emailService = require('../emailService.js');
const Utils = require('../Utils.js');

// Verify email with token
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;
        
        if (!token) {
            return Utils.sendError(res, 'Verification token is required');
        }

        const result = await db.verifyUserEmail(token);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Email verified successfully! You can now log in and start posting.',
                user: {
                    email: result.user.email,
                    fullName: result.user.fullName,
                    emailVerified: true
                }
            });
        } else {
            Utils.sendError(res, result.message);
        }
    } catch (error) {
        console.error('Email verification error:', error);
        Utils.sendError(res, 'Verification failed', error.message);
    }
});

// Resend verification email
router.post('/resend', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return Utils.sendError(res, 'Email is required');
        }

        // Check if user exists and is not verified
        const user = await db.getUserByEmail(email);
        if (!user) {
            return Utils.sendError(res, 'User not found');
        }

        if (user.emailVerified) {
            return Utils.sendError(res, 'Email is already verified');
        }

        // Generate new verification token
        const newToken = emailService.generateVerificationToken();
        
        // Update user with new token
        const updated = await db.updateVerificationToken(email, newToken);
        if (!updated) {
            return Utils.sendError(res, 'Failed to update verification token');
        }

        // Send verification email
        const emailResult = await emailService.sendVerificationEmail(
            user.email, 
            user.fullName, 
            newToken
        );

        if (emailResult.success) {
            res.json({
                success: true,
                message: 'Verification email sent successfully! Please check your inbox.'
            });
        } else {
            Utils.sendError(res, 'Failed to send verification email', emailResult.message);
        }
    } catch (error) {
        console.error('Resend verification error:', error);
        Utils.sendError(res, 'Failed to resend verification email', error.message);
    }
});

// Check verification status
router.get('/status/:email', async (req, res) => {
    try {
        const { email } = req.params;
        
        const user = await db.getUserByEmail(email);
        if (!user) {
            return Utils.sendError(res, 'User not found');
        }

        res.json({
            success: true,
            emailVerified: user.emailVerified || false,
            email: user.email
        });
    } catch (error) {
        console.error('Verification status check error:', error);
        Utils.sendError(res, 'Failed to check verification status', error.message);
    }
});

module.exports = router;
