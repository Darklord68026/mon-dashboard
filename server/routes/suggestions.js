const express = require('express');
const router = express.Router();
const Suggestion = require('../models/Suggestion');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// POST /api/suggestions
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
    const { text } = req.body;

    if (!text || text.length > 250 ) {
        throw new AppError("Texte invalide ou trop long (max 250 caractères)", 400);
    }
        
    const userId = req.user._id || req.user.userId;
    const user = await User.findById(userId);
    const authorName = user ? user.username : "Anonyme";

    const newSuggestion = new Suggestion({
        text: text,
        author: authorName
    });

    await newSuggestion.save();

    // Socket
    req.io.emit('newSuggestion', { 
        author: authorName, 
        text: text 
    });

    res.json(newSuggestion);
}));

// GET /api/suggestions (ADMIN)
router.get('/', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
    const suggestions = await Suggestion.find().sort({ createdAt: -1 });
    res.json(suggestions);
}));

// DELETE /api/suggestions/:id (ADMIN)
router.delete('/:id', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
    const result = await Suggestion.findByIdAndDelete(req.params.id);
    
    if (!result) throw new AppError("Suggestion introuvable", 404);

    res.json({ message: "Suggestion supprimée" });
}));

module.exports = router;