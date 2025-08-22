# Backend Address Centralization Implementation

## Overview
Successfully centralized all hardcoded backend addresses in both frontend applications to use a configurable variable instead of hardcoded `http://localhost:5555` URLs.

## Changes Made

### Configuration Files Created
- `frontendreal/src/config/api.js` - Main frontend API configuration
- `frontendAdmin/src/config/api.js` - Admin frontend API configuration
- `frontendreal/.env.example` - Environment variable example
- `frontendAdmin/.env.example` - Environment variable example

### Files Updated

#### Main Frontend (frontendreal/src/Pages/)
- `Login.jsx` - Login API endpoint
- `Register.jsx` - Registration API endpoint
- `CreatePost.jsx` - Post creation and category fetching endpoints
- `EmailVerification.jsx` - Email verification endpoints
- `test.jsx` - Cookie validation and server test endpoints
- `viewposts.jsx` - Post fetching, voting, deletion, and image URLs
- `PostDetail.jsx` - Post details, comments, voting, and image URLs

#### Admin Frontend (frontendAdmin/src/Pages/)
- `Login.jsx` - Login API endpoint
- `Register.jsx` - Registration API endpoint
- `CreatePost.jsx` - Post creation and category fetching endpoints
- `EmailVerification.jsx` - Email verification endpoints
- `test.jsx` - Cookie validation and server test endpoints
- `viewposts.jsx` - Post fetching, voting, deletion, and image URLs
- `PostDetail.jsx` - Post details, comments, voting, and image URLs

## Configuration

### Default Configuration
```javascript
const BACKEND_ADDRESS = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5555';
```

### Environment Variable Override
Create `.env` file in frontend root:
```
REACT_APP_BACKEND_URL=https://your-backend-domain.com
```

## Benefits

1. **Easy Deployment**: Change backend URL in one place
2. **Environment Flexibility**: Different URLs for dev/staging/production
3. **Maintainability**: No scattered hardcoded addresses
4. **Configuration Management**: Centralized API endpoint management

## Usage Examples

### Development (Default)
- Uses `http://localhost:5555`
- No additional configuration needed

### Production Deployment
1. Set environment variable: `REACT_APP_BACKEND_URL=https://api.yourdomain.com`
2. Build and deploy frontend
3. All API calls automatically use production URL

### Testing Different Backends
1. Create `.env.local` file
2. Set `REACT_APP_BACKEND_URL=http://localhost:3000` (or any other URL)
3. Restart development server

## Implementation Details

- All `axios` calls now use `${BACKEND_ADDRESS}` template literals
- Image URLs for uploads also use the centralized address
- Both main and admin frontends use identical configuration structure
- Fallback to localhost:5555 ensures backward compatibility

## Testing
- Updated `Backend/test-security.js` to use correct port (5555)
- All existing functionality preserved
- No breaking changes to API contracts
