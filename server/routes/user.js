const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// GET /api/user/me
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// PUT /api/user/tags
router.put('/tags', authMiddleware, async (req, res) => {
    try {
        const { tags } = req.body; 
        const user = await User.findById(req.user._id);
        user.tags = tags;
        await user.save();
        res.json(user.tags);
    } catch (error) {
        res.status(500).json({ error: "Impossible de mettre à jour les tags" });
    }
});

module.exports = router;