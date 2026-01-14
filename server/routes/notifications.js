const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const authMiddleware = require('../middleware/auth');

// Configuration unique au démarrage
webpush.setVapidDetails(
    process.env.MAILTO,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// Stockage temporaire (À remplacer par MongoDB plus tard)
let subscriptions = [];

// POST /api/notifications/subscribe
// Le frontend nous envoie son "adresse"
router.post('/subscribe', authMiddleware, (req, res) => {
    const subscription = req.body;
    subscriptions.push(subscription);
    res.status(201).json({ message: "Abonné aux notifs !" });
});

// POST /api/notifications/send (Pour tester)
// Envoie une notif à tout le monde
router.post('/send', authMiddleware, (req, res) => {
    const notificationPayload = JSON.stringify({
        title: 'Mon Dashboard',
        body: req.body.message || 'Ceci est une notification test ! 🚀',
        icon: '/icon.png' // Assure-toi d'avoir une icône dans client/public
    });

    const promises = subscriptions.map(sub => 
        webpush.sendNotification(sub, notificationPayload)
            .catch(err => console.error("Erreur envoi notif", err))
    );

    Promise.all(promises).then(() => res.json({ message: "Envoyé !" }));
});

module.exports = router;