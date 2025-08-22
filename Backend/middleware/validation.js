// Input validation and sanitization middleware
const validator = require('validator');
const { getClientIP } = require('./rateLimiter');

// Validation rules for different input types
const validationRules = {
    email: {
        required: true,
        type: 'email',
        maxLength: 254,
        sanitize: true
    },
    password: {
        required: true,
        minLength: 6,
        maxLength: 128,
        pattern: /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/
    },
    fullName: {
        required: true,
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-Z0-9_\s]+$/,
        sanitize: true
    },
    postTitle: {
        required: true,
        minLength: 3,
        maxLength: 200,
        sanitize: true
    },
    postContent: {
        required: true,
        minLength: 10,
        maxLength: 10000,
        sanitize: true
    },
    commentText: {
        required: true,
        minLength: 1,
        maxLength: 2000,
        sanitize: true
    },
    category: {
        required: false,
        maxLength: 50,
        pattern: /^[a-zA-Z0-9\s]+$/,
        sanitize: true
    }
};

// Sanitize HTML and dangerous characters
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return validator.escape(input)
        .replace(/javascript:/gi, '')
        .replace(/vbscript:/gi, '')
        .replace(/onload/gi, '')
        .replace(/onerror/gi, '')
        .replace(/onclick/gi, '')
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
        .trim();
}

// Validate individual field
function validateField(value, fieldName, rules) {
    const errors = [];
    
    // Check if required
    if (rules.required && (!value || value.toString().trim() === '')) {
        errors.push(`${fieldName} is required`);
        return errors;
    }
    
    // Skip other validations if not required and empty
    if (!rules.required && (!value || value.toString().trim() === '')) {
        return errors;
    }
    
    const stringValue = value.toString().trim();
    
    // Check type-specific validation
    if (rules.type === 'email' && !validator.isEmail(stringValue)) {
        errors.push(`${fieldName} must be a valid email address`);
    }
    
    // Check length constraints
    if (rules.minLength && stringValue.length < rules.minLength) {
        errors.push(`${fieldName} must be at least ${rules.minLength} characters long`);
    }
    
    if (rules.maxLength && stringValue.length > rules.maxLength) {
        errors.push(`${fieldName} must be no more than ${rules.maxLength} characters long`);
    }
    
    // Check pattern
    if (rules.pattern && !rules.pattern.test(stringValue)) {
        errors.push(`${fieldName} contains invalid characters`);
    }
    
    // Check for SQL injection patterns
    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
        /(;|\-\-|\*|\/\*|\*\/)/g,
        /(\b(OR|AND)\b.*?=.*?=)/gi
    ];
    
    for (const pattern of sqlPatterns) {
        if (pattern.test(stringValue)) {
            errors.push(`${fieldName} contains potentially dangerous content`);
            break;
        }
    }
    
    return errors;
}

// Main validation middleware
function validateRequest(fieldsToValidate) {
    return (req, res, next) => {
        const errors = [];
        const ip = getClientIP(req);
        
        // Validate each specified field
        for (const fieldName of fieldsToValidate) {
            const rules = validationRules[fieldName];
            if (!rules) continue;
            
            const value = req.body[fieldName];
            const fieldErrors = validateField(value, fieldName, rules);
            errors.push(...fieldErrors);
            
            // Sanitize if specified
            if (rules.sanitize && value) {
                req.body[fieldName] = sanitizeInput(value.toString());
            }
        }
        
        // Check for suspicious request patterns
        const suspiciousPatterns = [
            /\.\.\//g, // Directory traversal
            /\/etc\/passwd/gi,
            /\/proc\/self\/environ/gi,
            /<\?php/gi,
            /<%/g,
            /\${/g // Template injection
        ];
        
        const requestString = JSON.stringify(req.body);
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(requestString)) {
                console.log(`Suspicious request pattern detected from IP ${ip}:`, pattern);
                return res.status(400).json({
                    success: false,
                    message: 'Request contains invalid content'
                });
            }
        }
        
        // Return errors if any
        if (errors.length > 0) {
            console.log(`Validation errors from IP ${ip}:`, errors);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }
        
        next();
    };
}

// Specific validation middleware for common endpoints
const validateRegistration = validateRequest(['email', 'password', 'fullName']);
const validateLogin = validateRequest(['email', 'password']);
const validatePost = validateRequest(['postTitle', 'postContent', 'category']);
const validateComment = validateRequest(['commentText']);

// File upload validation
function validateFileUpload(req, res, next) {
    if (!req.files || Object.keys(req.files).length === 0) {
        return next();
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const maxFiles = 5;
    
    const files = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
    
    if (files.length > maxFiles) {
        return res.status(400).json({
            success: false,
            message: `Maximum ${maxFiles} files allowed`
        });
    }
    
    for (const file of files) {
        if (!file) continue;
        
        if (!allowedTypes.includes(file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: 'Only image files (JPEG, PNG, GIF, WebP) are allowed'
            });
        }
        
        if (file.size > maxSize) {
            return res.status(400).json({
                success: false,
                message: 'File size must be less than 5MB'
            });
        }
        
        // Check for malicious file names
        if (/[<>:"/\\|?*]/.test(file.name) || file.name.includes('..')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file name'
            });
        }
    }
    
    next();
}

// Rate limit validation for user actions
function validateUserAction(req, res, next) {
    // Ensure user is authenticated
    if (!req.userData || !req.userData.userId) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    
    // Check if user is banned
    if (req.userData.banned) {
        return res.status(403).json({
            success: false,
            message: 'Account is banned'
        });
    }
    
    next();
}

module.exports = {
    validateRequest,
    validateRegistration,
    validateLogin,
    validatePost,
    validateComment,
    validateFileUpload,
    validateUserAction,
    sanitizeInput,
    validateField
};
