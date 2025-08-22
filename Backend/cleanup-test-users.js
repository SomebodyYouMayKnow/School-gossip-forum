// Script to check and clean up test users
const { MongoClient } = require("mongodb");
const config = require("./config.js");

async function cleanupTestUsers() {
    const client = new MongoClient(config.CONNECTION_STRING);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db('school-gossip-forum');
        const usersCollection = db.collection('Users');
        
        // Find all users
        const allUsers = await usersCollection.find({}).toArray();
        console.log(`\nFound ${allUsers.length} total users:`);
        
        allUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email} (ID: ${user._id}) - Verified: ${user.emailVerified || false}`);
        });
        
        // Find potential test users (common test email patterns)
        const testEmailPatterns = [
            /test/i,
            /abc/i,
            /sdfa/i,
            /le\.loup/i,
            /gmail\.co[md]/i,
            /example/i,
            /temp/i
        ];
        
        const testUsers = allUsers.filter(user => 
            testEmailPatterns.some(pattern => pattern.test(user.email))
        );
        
        if (testUsers.length > 0) {
            console.log(`\nFound ${testUsers.length} potential test users:`);
            testUsers.forEach((user, index) => {
                console.log(`${index + 1}. ${user.email} (ID: ${user._id})`);
            });
            
            console.log('\nTo remove these test users, uncomment the delete section below and run again.');
            
            // Uncomment the lines below to actually delete test users
            // const result = await usersCollection.deleteMany({
            //     _id: { $in: testUsers.map(u => u._id) }
            // });
            // console.log(`Deleted ${result.deletedCount} test users`);
        } else {
            console.log('\nNo obvious test users found.');
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

cleanupTestUsers();
