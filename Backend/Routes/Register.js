const db = require("../db");
const Utils = require("../Utils");
const emailService = require("../emailService");
const { registerLimiter } = require('../middleware/rateLimiter');
const { validateRegistration } = require('../middleware/validation');
const { registrationSpamDetection } = require('../middleware/spamDetection');

// Apply middleware
const express = require('express');
const router = express.Router();

router.post('/', registerLimiter, validateRegistration, registrationSpamDetection, async function (req, res, next) {
    const fullNameRegex = /^[a-zA-Z0-9_]+$/;
    const emailRegex = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    const passwordRegex = /^[A-Za-z0-9!@#$%^&*()_]{1,20}$/;

    console.log('Request Body:', req.body); // Log the entire request body

    let email = req.body.email;
    let fullName = req.body.fullName;
    let password = req.body.password;

    console.log('Email:', email);
    console.log('Full Name:', fullName);
    console.log('Password:', password);

    if (!fullName) {
        Utils.sendError(res, "fullName cannot be empty.");
        return;
    }

    if (fullName.length < 3 || fullName.length > 20) {
        Utils.sendError(res, "fullName length must be between 3 and 20 characters.");
        return;
    }

    if (!fullNameRegex.test(fullName)) {
        Utils.sendError(res, "fullName can only contain letters, digits and underscores.");
        return;
    }

    if (!email) {
        Utils.sendError(res, "email cannot be empty.");
        return;
    }

    if (!emailRegex.test(email)) {
        Utils.sendError(res, "email is invalid.");
        return;
    }

    if (!password) {
        Utils.sendError(res, "password cannot be empty.");
        return;
    }

    if (!passwordRegex.test(password)) {
        Utils.sendError(res, "password contains invalid characters.");
        return;
    }

    let existingUser = await db.getUserByEmail(email);
    if (existingUser) {
        // Check if user is unverified - allow resending verification
        if (!existingUser.emailVerified) {
            const newToken = emailService.generateVerificationToken();
            const updated = await db.updateVerificationToken(email, newToken);
            
            if (updated) {
                const emailResult = await emailService.sendVerificationEmail(email, existingUser.fullName, newToken);
                const response = {
                    success: true,
                    message: 'Account exists but not verified. New verification email sent! Please check your inbox.',
                    userId: existingUser._id,
                    fullName: existingUser.fullName,
                    email: existingUser.email,
                    emailVerified: false,
                    verificationEmailSent: emailResult.success,
                    isResend: true
                };
                return Utils.sendResult(res, response);
            }
        }
        
        return Utils.sendError(res, "User email is already registered and verified");
    }

    try {
        // Generate verification token
        const verificationToken = emailService.generateVerificationToken();
        
        // Create user with verification token
        let user = await db.createUser(email, password, fullName, verificationToken);
        
        // Send verification email
        const emailResult = await emailService.sendVerificationEmail(email, fullName, verificationToken);
        
        if (!emailResult.success) {
            console.error('Failed to send verification email:', emailResult.message);
            // Delete the user if email failed to send
            await db.deleteUser(user._id);
            return Utils.sendError(res, "Failed to send verification email. Please try again.");
        }
        
        // Return response indicating email verification is required
        const response = {
            success: true,
            message: 'Registration successful! Please check your email to verify your account before logging in.',
            userId: user._id,
            fullName: user.fullName,
            email: user.email,
            emailVerified: false,
            verificationEmailSent: true
        };
        Utils.sendResult(res, response);
    } catch (error) {
        console.error('Registration error:', error);
        Utils.sendError(res, "Registration failed. Please try again.");
    }
});

module.exports = router;