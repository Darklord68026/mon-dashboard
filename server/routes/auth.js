const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 
const Task = require('../models/Task'); // Nécessaire pour deleteAccount
const authMiddleware = require('../middleware/auth.js');
const asyncHandler = require('../utils/asyncHandler.js');
const AppError = require('../utils/AppError.js');

// Route: /api/register
router.post('/register', asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    
    // Vérif basique (optionnel si géré par mongoose, mais mieux ici)
    if (!username || !password) {
        throw new AppError("Username et mot de passe requis", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    
    res.status(201).json({ message: "Utilisateur créé !" });
}));

// Route: /api/login
router.post('/login', asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) throw new AppError("Utilisateur inconnu", 400);

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) throw new AppError("Mot de passe inconnu", 400);

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token: token });
}));

// Route: /api/updatePassword
router.put('/updatePassword', authMiddleware, asyncHandler(async (req, res) => {
    const { newPassword } = req.body;
        
    if (!newPassword || newPassword.length < 4) {
        throw new AppError("Le mot de passe doit faire au moins 4 caractères", 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await User.findById(req.user._id);
    if (!user) throw new AppError("Utilisateur introuvable", 404);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Mot de passe modifié avec succès !" });
}));

// Route: /api/deleteAccount
router.delete('/deleteAccount', authMiddleware, asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Suppression des tâches associées
    await Task.deleteMany({ owner: userId });

    // Suppression de l'utilisateur
    const deletedUser = await User.findOneAndDelete({ _id: userId });

    if (!deletedUser) {
        throw new AppError("Utilisateur introuvable", 404);
    }

    res.json({ message: "Compte supprimé avec succès. Adieu ! 👋" });
}));

module.exports = router;