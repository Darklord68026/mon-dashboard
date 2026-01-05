const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 
const authMiddleware = require('../middleware/auth.js');

// Route: /api/register (définie dans server.js comme /api)
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "Utilisateur créé !" });
    } catch (error) {
        res.status(500).json({ error: "Erreur (L'utilisateur existe déjà ?)" });
    }
});

// Route: /api/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: "Utilisateur inconnu" });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: "Mot de passe inconnu" });

        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token: token });
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

router.put('/updatePassword', authMiddleware, async (req, res) => {
    try {
        const { newPassword } = req.body;
        
        // 1. Validation basique
        if (!newPassword || newPassword.length < 4) {
            return res.status(400).json({ error: "Le mot de passe doit faire au moins 4 caractères" });
        }

        // 2. Hachage du mot de passe (Sécurité)
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 3. Mise à jour
        // ⚠️ SECURITÉ : On utilise req.user._id (qui vient du Token) et non req.body.userId
        const user = await User.findById(req.user._id);
        
        if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

        user.password = hashedPassword;
        await user.save();

        res.json({ message: "Mot de passe modifié avec succès !" });

    } catch (error) {
        console.error("Erreur updatePassword:", error);
        res.status(500).json({ error: "Erreur serveur lors de la modification" });
    }
});

module.exports = router;