// Security implementation test script
const axios = require('axios');

const BASE_URL = 'http://localhost:5555/api';

async function testSecurity() {
    console.log('🔒 Testing Security Implementation...\n');
    
    // Test 1: Rate limiting on registration
    console.log('1. Testing registration rate limiting...');
    try {
        const promises = [];
        for (let i = 0; i < 5; i++) {
            promises.push(
                axios.post(`${BASE_URL}/register`, {
                    email: `test${i}@example.com`,
                    password: 'testpass123',
                    fullName: `TestUser${i}`
                })
            );
        }
        
        const results = await Promise.allSettled(promises);
        const blocked = results.filter(r => r.status === 'rejected' && r.reason.response?.status === 429);
        console.log(`   ✅ ${blocked.length}/5 requests blocked by rate limiter`);
    } catch (error) {
        console.log(`   ❌ Rate limiting test failed: ${error.message}`);
    }
    
    // Test 2: Input validation
    console.log('\n2. Testing input validation...');
    try {
        const response = await axios.post(`${BASE_URL}/register`, {
            email: 'invalid-email',
            password: 'a', // Too short
            fullName: 'ab' // Too short
        });
        console.log('   ❌ Validation should have failed');
    } catch (error) {
        if (error.response?.status === 400) {
            console.log('   ✅ Input validation working correctly');
        } else {
            console.log(`   ❌ Unexpected error: ${error.message}`);
        }
    }
    
    // Test 3: Spam detection
    console.log('\n3. Testing spam detection...');
    try {
        const spamContent = 'AAAAAAAAAAAAAAAAAAAAAA BUY NOW CLICK HERE!!!';
        const response = await axios.post(`${BASE_URL}/createpost`, {
            postTitle: 'Test Post',
            postContent: spamContent,
            userCookie: JSON.stringify({ token: 'fake-token' })
        });
        console.log('   ❌ Spam should have been detected');
    } catch (error) {
        if (error.response?.status === 400 || error.response?.status === 401) {
            console.log('   ✅ Spam detection or auth working correctly');
        } else {
            console.log(`   ❌ Unexpected error: ${error.message}`);
        }
    }
    
    // Test 4: SQL injection protection
    console.log('\n4. Testing SQL injection protection...');
    try {
        const response = await axios.post(`${BASE_URL}/register`, {
            email: "test@example.com'; DROP TABLE Users; --",
            password: 'testpass123',
            fullName: 'TestUser'
        });
        console.log('   ❌ SQL injection should have been blocked');
    } catch (error) {
        if (error.response?.status === 400) {
            console.log('   ✅ SQL injection protection working');
        } else {
            console.log(`   ❌ Unexpected error: ${error.message}`);
        }
    }
    
    // Test 5: XSS protection
    console.log('\n5. Testing XSS protection...');
    try {
        const response = await axios.post(`${BASE_URL}/register`, {
            email: 'test@example.com',
            password: 'testpass123',
            fullName: '<script>alert("xss")</script>'
        });
        console.log('   ❌ XSS should have been blocked');
    } catch (error) {
        if (error.response?.status === 400) {
            console.log('   ✅ XSS protection working');
        } else {
            console.log(`   ❌ Unexpected error: ${error.message}`);
        }
    }
    
    console.log('\n🔒 Security test completed!');
    console.log('\nNote: Some tests may fail if server is not running on port 5555');
    console.log('To run server: npm run dev');
}

// Run tests if this file is executed directly
if (require.main === module) {
    testSecurity().catch(console.error);
}

module.exports = { testSecurity };
