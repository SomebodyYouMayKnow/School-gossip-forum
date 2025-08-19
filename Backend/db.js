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
            return null;
        }
    },
    
    getPostById: async function (id) {
        const db = mongoClient.db('school-gossip-forum');
        const usersCollection = db.collection('Posts');
        try {
            return await usersCollection.findOne({ _id: new ObjectId(id) });
        } catch (error) {
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
            timeOutLeft: 0,
            banned: false,
            creationDate: new Date(),
            premium: false,
            lastPost: new Date(),
            lastComment: new Date(),
            lastChat: new Date(),
            savedPosts: [],
        });

        return await this.getUserById(result.insertedId);
    },
    updateUserLastPost: async function (userId, newLastPostDate) {
        const db = mongoClient.db('school-gossip-forum');
        const usersCollection = db.collection('Users');
        try {
            const result = await usersCollection.updateOne(
                { _id: new ObjectId(userId) }, // Filter by user ID
                { $set: { lastPost: newLastPostDate } } // Update the lastPost field
            );
            if (result.modifiedCount === 1) {
                return { success: true, message: 'User lastPost updated successfully' };
            } else {
                return { success: false, message: 'No user found to update' };
            }
        } catch (error) {
            return { success: false, message: 'Error updating user lastPost' };
        }
    },
    createPost: async function (email, userID, fullName, postTitle, postContent) {
        const db = mongoClient.db('school-gossip-forum');
        const usersCollection = db.collection('Posts');
        let result = await usersCollection.insertOne({
            fullName: fullName,
            creationDate: new Date(),
            comments: [],
            email: email,
            postTitle: postTitle,
            postContent: postContent,
            userID: userID,
            createdAt: new Date()
        });

        return await this.getPostById(result.insertedId);
    },
    deletePost: async function (postId) {
        const db = mongoClient.db('school-gossip-forum');
        const postsCollection = db.collection('Posts');
        try {
            const result = await postsCollection.deleteOne({ _id: new ObjectId(postId) });
            if (result.deletedCount === 1) {
                return { success: true, message: 'Post deleted successfully' };
            } else {
                return { success: false, message: 'Post not found' };
            }
        } catch (error) {
            return { success: false, message: 'Error deleting post' };
        }
    },
    checkCookie: async function(cookieData) {
        try {
    
            if (!cookieData || !cookieData.token) {
                return { valid: false, message: 'No token provided' };
            }
    
            let decoded;
            try {
                decoded = jwt.verify(cookieData.token, config.jwtSecret);
            } catch (jwtError) {
                return { valid: false, message: 'Invalid or expired token' };
            }
    
            const db = mongoClient.db('school-gossip-forum');
            const usersCollection = db.collection('Users');
            let user;
            try {
                user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) });
            } catch (dbError) {
                return { valid: false, message: 'Database query failed' };
            }
    
            if (!user) {
                return { valid: false, message: 'User not found in database' };
            }
    
            // Verify the essential data matches
            if (decoded.email !== user.email) {
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
            throw error;
        }
    },
    getRecentPosts: async function (limit = 10) {
        const db = mongoClient.db('school-gossip-forum');
        const postsCollection = db.collection('Posts');
        const posts = await postsCollection
        .find({})
        .sort({ createdAt: -1 }) // or use creationDate if that's your field
        .limit(limit)
        .toArray();
    return posts;
    },
};