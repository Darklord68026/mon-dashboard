const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const webpush = require('web-push');

// Config WebPush
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:admin@mondashboard.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

// 1. GET /api/chat/unread (Compter les messages non lus)
router.get('/unread', authMiddleware, asyncHandler(async (req, res) => {
    const myId = req.user.userId || req.user._id;
    const count = await Message.countDocuments({ receiver: myId, isRead: false });
    res.json({ count });
}));

// 2. PUT /api/chat/read (Marquer comme lu)
router.put('/read', authMiddleware, asyncHandler(async (req, res) => {
    const myId = req.user.userId || req.user._id;
    const { contactId } = req.body;

    if (!contactId || contactId === 'general') return res.json({ success: true });

    await Message.updateMany(
        { sender: contactId, receiver: myId, isRead: false },
        { $set: { isRead: true } }
    );
    res.json({ success: true });
}));

// 3. GET /api/chat (Historique)
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
    const myId = req.user.userId || req.user._id;
    const contactId = req.query.contactId;

    let filter = {};
    if (!contactId || contactId === 'general') {
        filter = { receiver: null };
    } else {
        filter = {
            $or: [
                { sender: myId, receiver: contactId },
                { sender: contactId, receiver: myId }
            ]
        };
    }

    const messages = await Message.find(filter).sort({ createdAt: 1 }).limit(50);
    res.json(messages);
}));

// 4. POST /api/chat (ENVOI + NOTIFS SÉCURISÉES)
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
    const { text, receiverId } = req.body;
    // On récupère l'expéditeur complet
    const sender = await User.findById(req.user.userId || req.user._id);
    
    // Si receiverId est vide ou 'general', c'est un message public
    const finalReceiver = (receiverId === 'general' || !receiverId) ? null : receiverId;

    const newMsg = new Message({
        text,
        sender: sender._id,
        senderName: sender.username,
        receiver: finalReceiver,
        isRead: false 
    });

    await newMsg.save();

    // --- PARTIE 1 : SOCKET (Temps réel) ---
    if (!finalReceiver) {
        // Chat Général : On envoie à tout le monde
        req.io.emit('chatMessage', newMsg);
    } else {
        // Chat Privé : On envoie uniquement aux deux personnes (via les Rooms)
        req.io.to(finalReceiver).emit('chatMessage', newMsg); // Au destinataire
        req.io.to(sender._id.toString()).emit('chatMessage', newMsg); // À moi-même (pour l'affichage immédiat)
    }

    // --- PARTIE 2 : PUSH NOTIFICATION (Quand socket fermé) ---
    // On n'envoie de Push QUE si c'est un message privé (pour éviter le spam du Général)
    if (finalReceiver) {
        const receiverUser = await User.findById(finalReceiver);
        
        // On vérifie s'il a activé les notifs
        if (receiverUser && receiverUser.subscription) {
            const payload = JSON.stringify({
                title: `💬 ${sender.username}`,
                body: text,
                icon: '../../client/public/vite.svg'
            });

            webpush.sendNotification(receiverUser.subscription, payload)
                .catch(err => {
                    console.error("Erreur Push:", err);
                });
        }
    }

    res.json(newMsg);
}));

module.exports = router;