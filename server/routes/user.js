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

// GET /api/user/all (NOUVEAU : Pour la liste des contacts)
router.get('/all', authMiddleware, async (req, res) => {
    try {
        // On récupère ID et Username de tout le monde
        const users = await User.find({}, 'username _id');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Erreur liste utilisateurs" });
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