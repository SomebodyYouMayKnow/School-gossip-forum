const MongoClient = require("mongodb").MongoClient;
const crypto = require("crypto");
const config = require("./config.js");
const jwt = require("jsonwebtoken");

let mongoClient;

async function connectToCluster() {
    try {
        mongoClient = new MongoClient(config.CONNECTION_STRING);
        console.log('Connecting to MongoDB Atlas cluster...');
        await mongoClient.connect();
        console.log('Successfully connected to MongoDB Atlas!');
    } catch (error) {
        console.error('Connection to MongoDB Atlas failed!', error);
        process.exit();
    }
}
connectToCluster();

module.exports = {
    getClient: function () {
        return mongoClient;
    },

    listUsers: async function (query) {
        const db = mongoClient.db('school-gossip-forum');
        const usersCollection = db.collection('Users');
        let array = await usersCollection.find(query);
        return await array.toArray();
    },

    getUserByEmail: async function (email) {
        let users = await this.listUsers();
        email = email.toLowerCase().split('.').join("");
        for (let i = 0; i < users.length; i++) {
            if (users[i].email.toLowerCase().split(".").join("") == email) {
                return users[i];
            }
        }
        return null;
    },

    getUserById: async function (id) {
        const db = mongoClient.db('school-gossip-forum');
        const usersCollection = db.collection('Users');
        let user = await usersCollection.findOne({
            _id: id
        });
        return user;
    },

    createUser: async function (email, password, fullName) {
        let salt = Math.round((new Date().valueOf() * Math.random())) + "";
        let encryptedPassword = crypto.createHmac("sha1", salt).update(password).digest("hex");

        const db = mongoClient.db('school-gossip-forum');
        const usersCollection = db.collection('Users');
        let result = await usersCollection.insertOne({
            email: email,
            password: encryptedPassword,
            salt: salt,
            fullName: fullName,
            admin: false,
            creationDate: new Date()
        });

        return await this.getUserById(result.insertedId);
    },
    // Add this inside module.exports
    checkCookie: async function(cookieData) {
        try {
            if (!cookieData || !cookieData.token) {
                return { valid: false, message: 'No cookie data found' };
            }

            // Verify the JWT token
            try {
                const decoded = jwt.verify(cookieData.token, config.jwtSecret);
                console.log('Decoded token:', decoded); // Debug log
                // Additional checks...
                return { valid: true, userData: decoded };
            } catch (error) {
                console.log('JWT verification error:', error); // Debug log
                return { valid: false, message: 'Invalid token: ' + error.message };
            }
        } catch (error) {
            console.log('General error:', error); // Debug log
            return { valid: false, message: error.message };
        }
    }


}