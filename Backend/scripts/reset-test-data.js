// Simple script to remove test users - run with: node reset-test-data.js
const db = require('../db.js');

setTimeout(async () => {
    try {
        const { MongoClient } = require("mongodb");
        const config = require("../config.js");
        const client = new MongoClient(config.CONNECTION_STRING);
        
        await client.connect();
        const database = client.db('school-gossip-forum');
        const users = database.collection('Users');
        
        // Remove users with test email patterns
        const result = await users.deleteMany({
            email: { 
                $regex: /(test|abc|sdfa|le\.loup|gmail\.co[md]|example|temp)/i 
            }
        });
        
        console.log(`Removed ${result.deletedCount} test users`);
        await client.close();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}, 2000);
