const MongoClient = require("mongodb").MongoClient;
const crypto = require("crypto");
const config = require("./config.js");
const jwt = require("jsonwebtoken");
const { ObjectId } = require('mongodb');

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
        try {
            return await usersCollection.findOne({ _id: new ObjectId(id) });
        } catch (error) {
            console.error('Error getting user by ID:', error);
            return null;
        }
    },
    
    getPostById: async function (id) {
        const db = mongoClient.db('school-gossip-forum');
        const usersCollection = db.collection('Posts');
        try {
            return await usersCollection.findOne({ _id: new ObjectId(id) });
        } catch (error) {
            console.error('Error getting user by ID:', error);
            return null;
        }
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
            creationDate: new Date(),
            lastPost: new Date(),
            lastComment: new Date(),
            lastChat: new Date()
        });

        return await this.getUserById(result.insertedId);
    },

    checkCookie: async function(cookieData) {
        try {
            console.log('Starting cookie check with data:', cookieData);
    
            if (!cookieData || !cookieData.token) {
                console.log('No token provided');
                return { valid: false, message: 'No token provided' };
            }
    
            let decoded;
            try {
                decoded = jwt.verify(cookieData.token, config.jwtSecret);
                console.log('Decoded token:', decoded);
            } catch (jwtError) {
                console.error('JWT verification failed:', jwtError);
                return { valid: false, message: 'Invalid or expired token' };
            }
    
            const db = mongoClient.db('school-gossip-forum');
            const usersCollection = db.collection('Users');
            let user;
            try {
                user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) });
                console.log('Found user:', user);
            } catch (dbError) {
                console.error('Database query failed:', dbError);
                return { valid: false, message: 'Database query failed' };
            }
    
            if (!user) {
                console.log('User not found in database');
                return { valid: false, message: 'User not found in database' };
            }
    
            // Verify the essential data matches
            if (decoded.email !== user.email) {
                console.log('Token email mismatch');
                return { valid: false, message: 'Token email mismatch' };
            }
    
            return {
                valid: true,
                userData: {
                    userId: user._id.toString(),
                    email: user.email,
                    fullName: user.fullName,
                    admin: user.admin || false
                }
            };
    
        } catch (error) {
            console.error('Cookie check error:', error);
            throw error;
        }
    }, 
    createPost: async function (fullName, userId, postContent) {
        try {
            const db = mongoClient.db('school-gossip-forum');
            const postsCollection = db.collection('Posts');
            console.log('Creating post with data:', { fullName, userId, postContent });

            const result = await postsCollection.insertOne({
                fullName: fullName,
                userId: new ObjectId(userId),
                postContent: postContent,
                createdAt: new Date()
            });
            console.log('Post created with ID:', result.insertedId);

            return await postsCollection.findOne({ _id: result.insertedId });
        } catch (error) {
            console.error('Error creating post:', error);
            throw error;
        }
    }
    
};
