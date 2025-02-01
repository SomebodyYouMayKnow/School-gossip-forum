const db = require('../db.js');
// const Utils = require('../Utils.js');

// module.exports = async function (req, res, next) {
//     const email = req.query.email;
//     // const password = req.query.password;
//     const userId = req.query.userId;
//     let userByEmail = await db.getUserByEmail(email);
//     let userById = await db.getUserById(userId);
//     if (!email ||!userId) {
//         Utils.sendError(res, "Authentication failed. Email or password is missing.");
//         return;
//     }
//     // if (password!= userByEmail.password || password!= userById.password) {
//     //     Utils.sendError(res, "Invalid username or password");
//     //     return;
//     //} 
//     else if (/**password == userByEmail.password && password == userById.password &&**/ userByEmail == userById){
//         Utils.sendResult(res, "Authentication")
//         return;
//     }
// }