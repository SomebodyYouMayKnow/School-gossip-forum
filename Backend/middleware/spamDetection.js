// Spam detection and content validation middleware
const { getClientIP } = require('./rateLimiter');

// In-memory stores (use Redis in production)
const contentHistory = new Map(); // Track similar content
const userActivity = new Map(); // Track user posting patterns
const suspiciousIPs = new Set();

// Common spam patterns
const spamPatterns = [
    /(.)\1{10,}/gi, // Repeated characters (10+ times)
    /[A-Z]{20,}/g, // Excessive caps
    /(https?:\/\/[^\s]+){3,}/gi, // Multiple URLs
    /\b(buy|sell|cheap|free|click|visit|website|link|promo|deal|offer|discount)\b.*\b(now|today|here|link)\b/gi,
    /(\b\w+\b.*?){1,3}\1{3,}/gi, // Repeated phrases
];

// Suspicious email domains for registration
const suspiciousEmailDomains = [
    'tempmail.org', '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
    'throwaway.email', 'temp-mail.org', 'getnada.com', 'maildrop.cc'
];

// Calculate content similarity using simple string comparison
function calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

// Check if content appears to be spam
function detectSpam(content, userID, ip) {
    const spamScore = {
        score: 0,
        reasons: [],
        isSpam: false
    };
    
    if (!content || typeof content !== 'string') {
        return spamScore;
    }
    
    const contentLower = content.toLowerCase();
    
    // Check for spam patterns
    spamPatterns.forEach((pattern, index) => {
        if (pattern.test(content)) {
            spamScore.score += 25;
            spamScore.reasons.push(`Matches spam pattern ${index + 1}`);
        }
    });
    
    // Check content length and quality
    if (content.length < 3) {
        spamScore.score += 15;
        spamScore.reasons.push('Content too short');
    }
    
    if (content.length > 5000) {
        spamScore.score += 10;
        spamScore.reasons.push('Content unusually long');
    }
    
    // Check for excessive punctuation
    const punctuationCount = (content.match(/[!?]{3,}/g) || []).length;
    if (punctuationCount > 0) {
        spamScore.score += punctuationCount * 10;
        spamScore.reasons.push('Excessive punctuation');
    }
    
    // Check for similar content from same user
    const userKey = `user:${userID}`;
    const userHistory = contentHistory.get(userKey) || [];
    
    for (const prevContent of userHistory) {
        const similarity = calculateSimilarity(content, prevContent.text);
        if (similarity > 0.8) {
            spamScore.score += 30;
            spamScore.reasons.push('Similar to previous content');
            break;
        }
    }
    
    // Check posting frequency
    const activity = userActivity.get(userID) || { posts: [], lastPost: 0 };
    const now = Date.now();
    const recentPosts = activity.posts.filter(time => now - time < 60000); // Last minute
    
    if (recentPosts.length > 3) {
        spamScore.score += 20;
        spamScore.reasons.push('Posting too frequently');
    }
    
    // Update activity tracking
    activity.posts.push(now);
    activity.posts = activity.posts.filter(time => now - time < 300000); // Keep last 5 minutes
    activity.lastPost = now;
    userActivity.set(userID, activity);
    
    // Update content history
    userHistory.push({ text: content, timestamp: now });
    if (userHistory.length > 10) userHistory.shift(); // Keep last 10
    contentHistory.set(userKey, userHistory);
    
    // Determine if spam
    spamScore.isSpam = spamScore.score >= 50;
    
    return spamScore;
}

// Check if email domain is suspicious
function checkSuspiciousEmail(email) {
    if (!email || typeof email !== 'string') return false;
    
    const domain = email.split('@')[1]?.toLowerCase();
    return suspiciousEmailDomains.includes(domain);
}

// Middleware for post/comment spam detection
function spamDetectionMiddleware(req, res, next) {
    const ip = getClientIP(req);
    const userID = req.body.userID || req.userData?.userId;
    
    // Check for content fields
    const content = req.body.postContent || req.body.commentText || req.body.text || '';
    
    if (content) {
        const spamResult = detectSpam(content, userID, ip);
        
        if (spamResult.isSpam) {
            console.log(`Spam detected from IP ${ip}, User ${userID}:`, spamResult.reasons);
            
            // Track suspicious IP
            suspiciousIPs.add(ip);
            
            return res.status(400).json({
                success: false,
                message: 'Content appears to be spam and has been blocked.',
                spamScore: spamResult.score,
                reasons: spamResult.reasons
            });
        }
        
        // Add spam score to request for logging
        req.spamScore = spamResult.score;
    }
    
    next();
}

// Middleware for registration spam detection
function registrationSpamDetection(req, res, next) {
    const ip = getClientIP(req);
    const email = req.body.email;
    
    // Check suspicious email domain
    if (checkSuspiciousEmail(email)) {
        console.log(`Suspicious email domain detected: ${email} from IP ${ip}`);
        return res.status(400).json({
            success: false,
            message: 'Please use a valid email address from a recognized email provider.'
        });
    }
    
    // Check if IP is flagged as suspicious
    if (suspiciousIPs.has(ip)) {
        console.log(`Registration attempt from suspicious IP: ${ip}`);
        return res.status(429).json({
            success: false,
            message: 'Registration temporarily unavailable. Please try again later.'
        });
    }
    
    next();
}

// Clean up old data periodically
setInterval(() => {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    // Clean content history
    for (const [key, history] of contentHistory.entries()) {
        const filtered = history.filter(item => now - item.timestamp < maxAge);
        if (filtered.length === 0) {
            contentHistory.delete(key);
        } else {
            contentHistory.set(key, filtered);
        }
    }
    
    // Clean user activity
    for (const [userID, activity] of userActivity.entries()) {
        activity.posts = activity.posts.filter(time => now - time < maxAge);
        if (activity.posts.length === 0 && now - activity.lastPost > maxAge) {
            userActivity.delete(userID);
        }
    }
}, 60 * 60 * 1000); // Run every hour

module.exports = {
    spamDetectionMiddleware,
    registrationSpamDetection,
    detectSpam,
    checkSuspiciousEmail,
    calculateSimilarity
};
