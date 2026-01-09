const express = require('express');
const router = express.Router();
const Suggestion = require('../models/Suggestion');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// POST /api/suggestions (Envoyer une idée)
router.post('/', authMiddleware, async (req, res) => {
    const { text } = req.body;

    if (!text || text.length > 250 ) {
        return res.status(400).json({ error: "Texte invalide ou trop long"});
    }
        
    // On récupère le pseudo de celui qui écrit
    const userId = req.user._id || req.user.userId;
    const user = await User.findById(userId);
    const authorName = user ? user.username : "Anonyme";

    const newSuggestion = new Suggestion({
        text: text,
        author: authorName
    });

    await newSuggestion.save();

    // 📢 NOTIFICATION SOCKET
    req.io.emit('newSuggestion', { 
        author: authorName, 
        text: text 
    });

    res.json(newSuggestion);
});

// GET : SEULEMENT L'ADMIN (auth + admin)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    const suggestions = await Suggestion.find().sort({ createdAt: -1 });
    res.json(suggestions);
});

// DELETE /api/suggestions/:id (Supprimer une idée lue)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    await Suggestion.findByIdAndDelete(req.params.id);
    res.json({ message: "Suggestion supprimée" });
});

module.exports = router;