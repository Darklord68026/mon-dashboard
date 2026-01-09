const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// 1. GET /api/chat/unread (NOUVEAU : Compter les messages non lus pour MOI)
router.get('/unread', authMiddleware, asyncHandler(async (req, res) => {
    const myId = req.user.userId || req.user._id;
    
    // On compte les messages où JE suis le destinataire ET qui ne sont pas lus
    const count = await Message.countDocuments({ 
        receiver: myId, 
        isRead: false 
    });
    
    res.json({ count });
}));

// 2. PUT /api/chat/read (NOUVEAU : Marquer comme lu quand j'ouvre le chat)
router.put('/read', authMiddleware, asyncHandler(async (req, res) => {
    const myId = req.user.userId || req.user._id;
    const { contactId } = req.body; // L'ID de la personne avec qui je parle

    // Si on est sur le général (pas de contactId), on ne fait rien car pas de statut "lu" global
    if (!contactId || contactId === 'general') return res.json({ success: true });

    // Je mets à jour tous les messages que CE contact m'a envoyés et que je n'ai pas lus
    await Message.updateMany(
        { sender: contactId, receiver: myId, isRead: false },
        { $set: { isRead: true } }
    );

    res.json({ success: true });
}));

// GET /api/chat?contactId=... (Récupérer l'historique)
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
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
}));

// POST /api/chat (Envoyer un message)
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
    const { text, receiverId } = req.body;
    const user = await User.findById(req.user.userId || req.user._id);
        
    // Si receiverId est 'general' ou vide, on met null
    const finalReceiver = (receiverId === 'general' || !receiverId) ? null : receiverId;

    const newMsg = new Message({
        text,
        sender: user._id,
        senderName: user.username,
        receiver: finalReceiver,
        isRead: false // Explicite : par défaut c'est non lu
    });

    await newMsg.save();

    // On envoie à tout le monde (le tri se fera côté client pour l'affichage temps réel)
    req.io.emit('chatMessage', newMsg);

    res.json(newMsg);
}));

module.exports = router;