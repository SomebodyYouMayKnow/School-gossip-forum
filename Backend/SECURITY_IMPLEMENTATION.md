# Security Implementation Guide

## Overview
This document outlines the comprehensive security measures implemented to prevent spam, abuse, and unauthorized access to the School Gossip Forum.

## Security Features Implemented

### 1. Rate Limiting (`middleware/rateLimiter.js`)

**Purpose**: Prevent spam requests and brute force attacks

**Features**:
- **IP-based tracking**: Monitors requests per IP address
- **Progressive penalties**: Escalating restrictions for repeat offenders
- **Endpoint-specific limits**: Different limits for different types of requests
- **Automatic IP blocking**: Temporary blocks for suspicious IPs

**Rate Limits**:
- **Authentication**: 5 attempts per 15 minutes
- **Registration**: 3 registrations per hour per IP
- **Email verification**: 3 emails per 5 minutes
- **Post creation**: 5 posts per 10 minutes
- **Comments**: 10 comments per 5 minutes
- **Voting**: 30 votes per minute
- **General API**: 100 requests per 15 minutes

**Violation Tracking**:
- After 10 violations: IP blocked for 1 hour
- Violations tracked per endpoint
- Automatic cleanup of old violation data

### 2. Spam Detection (`middleware/spamDetection.js`)

**Purpose**: Detect and block spam content in posts and comments

**Detection Methods**:
- **Pattern matching**: Detects common spam patterns
- **Content similarity**: Prevents duplicate content from same user
- **Posting frequency**: Monitors rapid posting behavior
- **Suspicious email domains**: Blocks temporary email services
- **Content quality checks**: Validates content length and structure

**Spam Patterns Detected**:
- Repeated characters (10+ times)
- Excessive caps (20+ characters)
- Multiple URLs (3+ links)
- Common spam keywords
- Repeated phrases

**Actions**:
- Content blocked if spam score ≥ 50
- IP flagged as suspicious
- User activity tracked for patterns

### 3. Input Validation (`middleware/validation.js`)

**Purpose**: Sanitize and validate all user inputs

**Validation Rules**:
- **Email**: Valid format, max 254 characters
- **Password**: 6-128 characters, allowed special characters
- **Full Name**: 2-50 characters, alphanumeric and spaces only
- **Post Title**: 3-200 characters
- **Post Content**: 10-10,000 characters
- **Comments**: 1-2,000 characters

**Security Checks**:
- SQL injection pattern detection
- XSS prevention through HTML escaping
- Directory traversal prevention
- Template injection detection
- Malicious file name detection

**File Upload Security**:
- Only image files allowed (JPEG, PNG, GIF, WebP)
- 5MB file size limit
- Maximum 5 files per upload
- Malicious filename detection

### 4. Authentication (`middleware/authMiddleware.js`)

**Purpose**: Secure user authentication and authorization

**Features**:
- JWT token verification
- Fresh user data validation
- Email verification enforcement
- Ban status checking
- Admin role verification

**Token Sources**:
- Authorization header (Bearer token)
- HTTP cookies
- Request body (legacy compatibility)

### 5. IP Blocking and Monitoring

**Automatic IP Blocking**:
- Triggered after 10 rate limit violations
- 1-hour block duration
- Suspicious activity flagging
- Registration blocking for flagged IPs

**Monitoring**:
- Real-time violation tracking
- Suspicious pattern detection
- Activity logging for security analysis

## Implementation Details

### Middleware Application Order

1. **Trust Proxy**: Enable accurate IP detection
2. **Blocked IP Check**: Block known bad IPs
3. **Speed Limiter**: Add delays for rapid requests
4. **General Rate Limiter**: Overall request limiting
5. **Endpoint-specific limiters**: Applied per route
6. **Validation**: Input sanitization and validation
7. **Spam Detection**: Content analysis
8. **Authentication**: User verification (where required)

### Route Protection

**Registration Route** (`/api/register`):
- `registerLimiter`: 3 attempts per hour
- `validateRegistration`: Email, password, fullName validation
- `registrationSpamDetection`: Suspicious email domain blocking

**Login Route** (`/api/login`):
- `authLimiter`: 5 attempts per 15 minutes
- `validateLogin`: Email and password validation

**Post Creation** (`/api/createpost`):
- `postLimiter`: 5 posts per 10 minutes
- `validatePost`: Title, content, category validation
- `validateFileUpload`: Image upload security
- `spamDetectionMiddleware`: Content spam analysis

**Comments** (`/api/comment`):
- `commentLimiter`: 10 comments per 5 minutes
- `validateComment`: Text validation
- `spamDetectionMiddleware`: Content spam analysis

**Voting** (`/api/vote`):
- `voteLimiter`: 30 votes per minute
- `validateUserAction`: Authentication check

**Email Verification** (`/api/email-verification`):
- `emailLimiter`: 3 emails per 5 minutes
- `validateRequest`: Email validation

## Configuration

### Environment Variables Required

```env
JWT_SECRET=your_jwt_secret_here
JWT_TOKEN_DURATION=24h
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=http://localhost:3000
```

### Dependencies Added

```json
{
  "express-rate-limit": "^6.x.x",
  "express-slow-down": "^1.x.x",
  "validator": "^13.x.x"
}
```

## Security Best Practices

### For Administrators

1. **Monitor Logs**: Regularly check for suspicious activity patterns
2. **Review Blocked IPs**: Investigate frequently blocked IP addresses
3. **Update Spam Patterns**: Add new spam patterns as they emerge
4. **Adjust Rate Limits**: Modify limits based on legitimate usage patterns

### For Developers

1. **Input Validation**: Always validate and sanitize user inputs
2. **Error Handling**: Don't expose sensitive information in error messages
3. **Logging**: Log security events for analysis
4. **Updates**: Keep security middleware updated

## Monitoring and Alerting

### Key Metrics to Monitor

- Rate limit violations per hour
- Blocked IP addresses
- Spam detection triggers
- Failed authentication attempts
- Suspicious registration patterns

### Log Analysis

Security events are logged with:
- Timestamp
- IP address
- Endpoint accessed
- Violation type
- User ID (if authenticated)

## Troubleshooting

### Common Issues

**Legitimate Users Blocked**:
- Check rate limit settings
- Review IP blocking criteria
- Adjust spam detection thresholds

**High False Positives in Spam Detection**:
- Review spam patterns
- Adjust similarity thresholds
- Update content quality checks

**Performance Issues**:
- Optimize in-memory stores
- Consider Redis for production
- Review cleanup intervals

## Production Recommendations

1. **Use Redis**: Replace in-memory stores with Redis for scalability
2. **Database Logging**: Store security events in database
3. **Real-time Alerts**: Set up alerts for security violations
4. **Regular Backups**: Backup security configurations
5. **Penetration Testing**: Regular security assessments

## Emergency Procedures

### If Under Attack

1. **Immediate Actions**:
   - Lower rate limits temporarily
   - Enable stricter spam detection
   - Monitor server resources

2. **Investigation**:
   - Analyze attack patterns
   - Identify attack sources
   - Document attack methods

3. **Response**:
   - Block malicious IP ranges
   - Update security rules
   - Notify users if necessary

### Recovery

1. **Assess Damage**: Check for compromised accounts or data
2. **Update Security**: Implement additional protections
3. **Monitor**: Increased monitoring for 24-48 hours
4. **Document**: Record lessons learned and improvements made

## Contact Information

For security issues or questions:
- Check logs in `/Backend/logs/` (if implemented)
- Review middleware configurations
- Test with controlled requests
- Monitor server performance metrics
