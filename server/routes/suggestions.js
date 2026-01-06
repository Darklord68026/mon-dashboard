const express = require('express');
const router = express.Router();
const Suggestion = require('../models/Suggestion');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const User = require('../models/User');

// POST /api/suggestions (Envoyer une idée)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || text.length > 500 ) {
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
    } catch (error) {
        res.status(500).json({ error: "Erreur envoi suggestion" });
    }
});

// GET : SEULEMENT L'ADMIN (auth + admin)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const suggestions = await Suggestion.find().sort({ createdAt: -1 });
        res.json(suggestions);
    } catch (error) {
        res.status(500).json({ error: "Erreur lecture" });
    }
});

// DELETE /api/suggestions/:id (Supprimer une idée lue)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await Suggestion.findByIdAndDelete(req.params.id);
        res.json({ message: "Suggestion supprimée" });
    } catch (error) {
        res.status(500).json({ error: "Erreur suppression" });
    }
});

module.exports = router;