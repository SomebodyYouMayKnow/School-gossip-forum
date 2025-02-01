const MongoClient = require("mongodb").MongoClient;
const crypto = require("crypto");
const config = require("./config.js");

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

    listNotes: async function (query) {
        const db = mongoClient.db('Notes');
        const notesCollection = db.collection('Notes');
        let array = await notesCollection.find(query);
        return await array.toArray()
    },
    getNoteByUserId: async function (userId) {
        const db = mongoClient.db('Notes');
        const usersCollection = db.collection('Notes');
        let user = await usersCollection.findOne({
            userId: userId
        });
        return user;
    },

    listUsers: async function (query) {
        const db = mongoClient.db('Notes');
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
        const db = mongoClient.db('Notes');
        const usersCollection = db.collection('Users');
        let user = await usersCollection.findOne({
            _id: id
        });
        return user;
    },

    createUser: async function (email, password, fullName) {
        let salt = Math.round((new Date().valueOf() * Math.random())) + "";
        let encryptedPassword = crypto.createHmac("sha1", salt).update(password).digest("hex");

        const db = mongoClient.db('Notes');
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

    createNote: async function (title, text) {
        const db = mongoClient.db('Notes');
        const notesCollection = db.collection('Notes');
        await notesCollection.insertOne({
            title: title,
            text: text,
            date: new Date()
        });
        return "Inserted";
    }
}