const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// GET /api/chat?contactId=... (Récupérer les messages)
router.get('/', authMiddleware, async (req, res) => {
    const myId = req.user.userId || req.user._id;
    const contactId = req.query.contactId;

    let filter = {};

    if (!contactId || contactId === 'general') {
        // Chat Général (Messages sans destinataire)
        filter = { receiver: null };
    } else {
        // Chat Privé : (Moi -> Lui) OU (Lui -> Moi)
        filter = {
            $or: [
                { sender: myId, receiver: contactId },
                { sender: contactId, receiver: myId }
            ]
        };
    }

    const messages = await Message.find(filter)
        .sort({ createdAt: 1 }) // Chronologique
        .limit(50); // Les 50 derniers
            
    res.json(messages);
});

// POST /api/chat (Envoyer)
router.post('/', authMiddleware, async (req, res) => {
    const { text, receiverId } = req.body;
    const user = await User.findById(req.user.userId || req.user._id);
        
    // Si receiverId est 'general' ou vide, on met null
    const finalReceiver = (receiverId === 'general' || !receiverId) ? null : receiverId;

    const newMsg = new Message({
        text,
        sender: user._id,
        senderName: user.username,
        receiver: finalReceiver
    });

    await newMsg.save();

    // On envoie à tout le monde (le tri se fera côté client pour l'affichage temps réel)
    req.io.emit('chatMessage', newMsg);

    res.json(newMsg);
});

module.exports = router;