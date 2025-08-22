const db = require('../db.js');

async function checkUsers() {
    try {
        // Wait a moment for DB connection
        setTimeout(async () => {
            const users = await db.listUsers({});
            console.log(`Found ${users.length} users in database:`);
            users.forEach((user, i) => {
                console.log(`${i+1}. ${user.email} - Verified: ${user.emailVerified || false}`);
            });
            process.exit(0);
        }, 2000);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUsers();
