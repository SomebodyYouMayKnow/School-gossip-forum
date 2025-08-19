// (removed misplaced upvotePost function)
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

    // Add a comment to a post
    addComment: async function (postId, userId, fullName, commentText, parentCommentId = null) {
        const db = mongoClient.db('school-gossip-forum');
        const postsCollection = db.collection('Posts');
        // Always fetch the user's fullName from the Users collection
        let userFullName = fullName;
        try {
            const user = await db.collection('Users').findOne({ _id: new ObjectId(userId) });
            if (user && user.fullName) userFullName = user.fullName;
        } catch {}
        const comment = {
            _id: new ObjectId(),
            userId,
            fullName: userFullName,
            text: commentText,
            createdAt: new Date(),
            likes: [],
            replies: [],
            parent: parentCommentId || null
        };
        if (!parentCommentId) {
            await postsCollection.updateOne(
                { _id: new ObjectId(postId) },
                { $push: { comments: comment } }
            );
        } else {
            // Add as a reply to a comment
            const updateResult = await postsCollection.updateOne(
                { _id: new ObjectId(postId), "comments._id": new ObjectId(parentCommentId) },
                { $push: { "comments.$.replies": comment } }
            );
            if (updateResult.modifiedCount === 0) {
                console.error('Failed to add reply: parent comment not found', { postId, parentCommentId });
                throw new Error('Parent comment not found');
            }
        }
        return comment;
    },

    // Get comments for a post
    getComments: async function (postId) {
        const db = mongoClient.db('school-gossip-forum');
        const postsCollection = db.collection('Posts');
        const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
        return post && post.comments ? post.comments : [];
    },

    // Like or unlike a comment
    likeComment: async function (postId, commentId, userId, action) {
        const db = mongoClient.db('school-gossip-forum');
        const postsCollection = db.collection('Posts');
        let update;
        if (action === 'like') {
            update = { $addToSet: { "comments.$.likes": userId } };
        } else if (action === 'unlike') {
            update = { $pull: { "comments.$.likes": userId } };
        } else {
            throw new Error('Invalid like action');
        }
        const result = await postsCollection.updateOne(
            { _id: new ObjectId(postId), "comments._id": new ObjectId(commentId) },
            update
        );
        return result.modifiedCount > 0;
    },

    // Reply to a comment (threaded, only 1 level deep)
    replyToComment: async function (postId, parentCommentId, userId, fullName, replyText) {
        // Reuse addComment with parentCommentId
        return await this.addComment(postId, userId, fullName, replyText, parentCommentId);
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
            console.log('getPostById called with id:', id);
            const result = await usersCollection.findOne({ _id: new ObjectId(id) });
            console.log('getPostById result:', result);
            return result;
        } catch (error) {
            console.error('getPostById error:', error);
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
    /**
     * Get posts with sorting and filtering
     * @param {Object} options
     *   - limit: number
     *   - skip: number
     *   - sortBy: 'recent'|'old'|'upvotes'|'downvotes'|'comments'
     *   - order: 1|-1
     *   - filter: MongoDB filter object
     */
    getRecentPosts: async function (options = {}) {
        const db = mongoClient.db('school-gossip-forum');
        const postsCollection = db.collection('Posts');
        const {
            limit = 10,
            skip = 0,
            sortBy = 'recent',
            order = -1,
            filter = {}
        } = options;

        let sort = {};
        if (sortBy === 'recent') sort = { createdAt: -1 };
        else if (sortBy === 'old') sort = { createdAt: 1 };
        else if (sortBy === 'upvotes') sort = { upvotesCount: order };
        else if (sortBy === 'downvotes') sort = { downvotesCount: order };
        else if (sortBy === 'comments') sort = { commentsCount: order };
        else sort = { createdAt: -1 };

        // Use aggregation to compute counts for upvotes, downvotes, comments
        const pipeline = [
            { $match: filter },
            {
                $addFields: {
                    upvotesCount: { $size: { $ifNull: ["$upvotes", []] } },
                    downvotesCount: { $size: { $ifNull: ["$downvotes", []] } },
                    commentsCount: { $size: { $ifNull: ["$comments", []] } }
                }
            },
            { $sort: sort },
            { $skip: skip },
            { $limit: limit }
        ];
        const posts = await postsCollection.aggregate(pipeline).toArray();
        return posts;
    },

    // Upvote, downvote, or remove vote for a post
    votePost: async function (postId, userId, action) {
        const db = mongoClient.db('school-gossip-forum');
        const postsCollection = db.collection('Posts');
        let update = {};
        if (action === 'upvote') {
            update = {
                $addToSet: { upvotes: userId },
                $pull: { downvotes: userId }
            };
        } else if (action === 'downvote') {
            update = {
                $addToSet: { downvotes: userId },
                $pull: { upvotes: userId }
            };
        } else if (action === 'remove') {
            update = {
                $pull: { upvotes: userId, downvotes: userId }
            };
        } else {
            throw new Error('Invalid vote action');
        }
        await postsCollection.updateOne(
            { _id: new ObjectId(postId) },
            update
        );
        const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
        return {
            upvotes: post.upvotes ? post.upvotes.length : 0,
            downvotes: post.downvotes ? post.downvotes.length : 0,
            userVote: post.upvotes && post.upvotes.includes(userId)
                ? 'upvote'
                : post.downvotes && post.downvotes.includes(userId)
                ? 'downvote'
                : null
        };
    },
};