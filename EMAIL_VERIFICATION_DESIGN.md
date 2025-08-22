# Email Verification System Design

## Architecture Overview

### 1. **Registration Flow**
- User registers with email/password
- Account created but marked as `emailVerified: false`
- Verification email sent with unique token
- User cannot post/comment until verified

### 2. **Verification Process**
- Generate secure token (JWT or UUID)
- Store token with expiration (24 hours)
- Send email with verification link
- User clicks link → token validated → account activated

### 3. **Database Schema Updates**
```javascript
User: {
  email: String,
  password: String,
  emailVerified: Boolean (default: false),
  verificationToken: String,
  verificationExpires: Date,
  // ... existing fields
}
```

### 4. **Email Service**
- Use Nodemailer with SMTP (Gmail, SendGrid, etc.)
- HTML email templates
- Secure token-based verification links

### 5. **Security Features**
- Token expiration (24 hours)
- One-time use tokens
- Rate limiting for resend requests
- Secure token generation

### 6. **User Experience**
- Clear verification status messages
- Resend verification option
- Email change re-verification
- Graceful error handling

## Implementation Components

1. **Email Service Module** (`emailService.js`)
2. **Verification Route** (`/api/verify-email`)
3. **Resend Route** (`/api/resend-verification`)
4. **Database Updates** (User schema)
5. **Frontend Updates** (verification status UI)
6. **Login Protection** (check verification status)

## Configuration Required

- SMTP credentials (Gmail App Password recommended)
- Email templates
- Frontend verification pages
- Environment variables for email config
