const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// In-memory store for tracking violations (in production, use Redis)
const violationStore = new Map();
const ipBlockList = new Set();

// Helper function to get client IP with IPv6 support
function getClientIP(req) {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           '127.0.0.1';
}

// Track violations and implement progressive penalties
function trackViolation(ip, endpoint) {
    const key = `${ip}:${endpoint}`;
    const violations = violationStore.get(key) || { count: 0, firstViolation: Date.now() };
    
    violations.count++;
    violations.lastViolation = Date.now();
    
    violationStore.set(key, violations);
    
    // Progressive penalties
    if (violations.count >= 10) {
        // Block IP for 1 hour after 10 violations
        ipBlockList.add(ip);
        setTimeout(() => ipBlockList.delete(ip), 60 * 60 * 1000);
        console.log(`IP ${ip} blocked for 1 hour due to repeated violations`);
    }
    
    return violations;
}

// Middleware to check if IP is blocked
function checkBlocked(req, res, next) {
    const ip = getClientIP(req);
    
    if (ipBlockList.has(ip)) {
        return res.status(429).json({
            success: false,
            message: 'Your IP has been temporarily blocked due to suspicious activity. Please try again later.',
            blockedUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        });
    }
    
    next();
}

// Custom rate limit handler
function createRateLimitHandler(endpoint) {
    return (req, res) => {
        const ip = getClientIP(req);
        trackViolation(ip, endpoint);
        
        res.status(429).json({
            success: false,
            message: 'Too many requests. Please slow down.',
            retryAfter: res.get('Retry-After') || '60'
        });
    };
}

// Authentication endpoints (login, register) - strict limits
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again in 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler('auth'),
    keyGenerator: (req) => req.ip
});

// Registration - even stricter
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registrations per hour per IP
    message: {
        success: false,
        message: 'Too many registration attempts. Please try again in 1 hour.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler('register'),
    keyGenerator: (req) => req.ip
});

// Email verification resend
const emailLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3, // 3 emails per 5 minutes
    message: {
        success: false,
        message: 'Too many email requests. Please wait 5 minutes before requesting another verification email.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler('email'),
    keyGenerator: (req) => req.ip
});

// Post creation limits
const postLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // 5 posts per 10 minutes
    message: {
        success: false,
        message: 'Too many posts created. Please wait before creating another post.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler('post'),
    keyGenerator: (req) => req.ip
});

// Comment limits
const commentLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 comments per 5 minutes
    message: {
        success: false,
        message: 'Too many comments. Please slow down.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler('comment'),
    keyGenerator: (req) => req.ip
});

// Vote limits (upvote/downvote)
const voteLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 votes per minute
    message: {
        success: false,
        message: 'Too many votes. Please slow down.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler('vote'),
    keyGenerator: (req) => req.ip
});

// General API limiter
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: {
        success: false,
        message: 'Too many requests. Please slow down.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler('general'),
    keyGenerator: (req) => req.ip
});

// Speed limiter for suspicious rapid requests
const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // Allow 50 requests per 15 minutes at full speed
    delayMs: () => 500, // Add 500ms delay per request after delayAfter
    maxDelayMs: 20000, // Maximum delay of 20 seconds
    keyGenerator: (req) => req.ip,
    validate: { delayMs: false } // Disable delayMs warning
});

module.exports = {
    checkBlocked,
    authLimiter,
    registerLimiter,
    emailLimiter,
    postLimiter,
    commentLimiter,
    voteLimiter,
    generalLimiter,
    speedLimiter,
    getClientIP,
    trackViolation
};
