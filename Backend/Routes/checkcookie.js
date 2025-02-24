const express = require("express");
const router = express.Router();
const db = require("../db.js");

router.get('/test', (req, res) => {
    res.json({ message: 'Checkcookie route working' });
});

router.post("/", async (req, res) => {
    try {
        const cookieData = req.body;
        const result = await db.checkCookie(cookieData);
        
        if (result.valid) {
            res.json({ success: true, userData: result.userData });
        } else {
            res.json({ success: false, message: result.message });
        }
    } catch (error) {
        console.error('Cookie check error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
