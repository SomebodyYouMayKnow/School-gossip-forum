// Authentication middleware to verify JWT tokens
const jwt = require('jsonwebtoken');
const config = require('../config.js');
const db = require('../db.js');

// Middleware to verify JWT token and add user data to request
async function verifyToken(req, res, next) {
    try {
        // Check for token in various places
        let token = null;
        
        // 1. Check Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
        
        // 2. Check cookies
        if (!token && req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        
        // 3. Check request body (for compatibility with existing frontend)
        if (!token && req.body && req.body.userCookie) {
            try {
                const cookieData = typeof req.body.userCookie === 'string' 
                    ? JSON.parse(req.body.userCookie) 
                    : req.body.userCookie;
                token = cookieData.token;
            } catch (e) {
                // Invalid JSON in userCookie
            }
        }
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }
        
        // Verify token
        const decoded = jwt.verify(token, config.jwtSecret);
        
        // Get fresh user data from database
        const user = await db.getUserById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Check if user is banned
        if (user.banned) {
            return res.status(403).json({
                success: false,
                message: 'Account is banned'
            });
        }
        
        // Check email verification
        if (!user.emailVerified) {
            return res.status(403).json({
                success: false,
                message: 'Email verification required',
                emailVerified: false
            });
        }
        
        // Add user data to request
        req.userData = {
            userId: user._id.toString(),
            email: user.email,
            fullName: user.fullName,
            admin: user.admin || false,
            premium: user.premium || false,
            banned: user.banned || false,
            emailVerified: user.emailVerified || false
        };
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        } else {
            console.error('Auth middleware error:', error);
            return res.status(500).json({
                success: false,
                message: 'Authentication failed'
            });
        }
    }
}

// Optional authentication - doesn't fail if no token provided
async function optionalAuth(req, res, next) {
    try {
        // Try to get token but don't fail if not present
        let token = null;
        
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
        
        if (!token && req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        
        if (!token && req.body && req.body.userCookie) {
            try {
                const cookieData = typeof req.body.userCookie === 'string' 
                    ? JSON.parse(req.body.userCookie) 
                    : req.body.userCookie;
                token = cookieData.token;
            } catch (e) {
                // Invalid JSON, continue without auth
            }
        }
        
        if (token) {
            try {
                const decoded = jwt.verify(token, config.jwtSecret);
                const user = await db.getUserById(decoded.userId);
                
                if (user && !user.banned && user.emailVerified) {
                    req.userData = {
                        userId: user._id.toString(),
                        email: user.email,
                        fullName: user.fullName,
                        admin: user.admin || false,
                        premium: user.premium || false,
                        banned: user.banned || false,
                        emailVerified: user.emailVerified || false
                    };
                }
            } catch (authError) {
                // Token invalid, continue without auth
                console.log('Optional auth failed:', authError.message);
            }
        }
        
        next();
    } catch (error) {
        // Don't fail on optional auth errors
        console.error('Optional auth error:', error);
        next();
    }
}

// Admin-only middleware
function requireAdmin(req, res, next) {
    if (!req.userData) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    
    if (!req.userData.admin) {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    
    next();
}

module.exports = {
    verifyToken,
    optionalAuth,
    requireAdmin
};
