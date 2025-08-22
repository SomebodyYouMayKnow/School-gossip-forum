# Backend Scripts

This folder contains utility and testing scripts for the backend application.

## Scripts Overview

### Database Management
- **`check-users.js`** - Lists all users in the database with verification status
- **`cleanup-test-users.js`** - Removes test users from the database
- **`reset-test-data.js`** - Cleans up test data and users with specific email patterns

### Testing & Validation
- **`test-security.js`** - Comprehensive security testing including rate limiting, spam detection, and input validation
- **`test-image-upload.js`** - Verifies image upload directory structure and permissions

## Usage

Run scripts from the Backend directory:

```bash
# Check users in database
node scripts/check-users.js

# Clean up test users
node scripts/cleanup-test-users.js

# Reset test data
node scripts/reset-test-data.js

# Test security implementation
node scripts/test-security.js

# Test image upload setup
node scripts/test-image-upload.js
```

## Requirements

- Backend server should be running on port 5555 for test-security.js
- MongoDB connection must be configured in config.js
- All scripts require the backend dependencies to be installed (`npm install`)

## Notes

- These scripts are for development and testing purposes
- Always backup your database before running cleanup scripts
- Security tests will attempt to trigger rate limiting and spam detection
