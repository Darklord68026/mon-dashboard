const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// GET /api/user/me
router.get('/me', authMiddleware, async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
});

// GET /api/user/all (NOUVEAU : Pour la liste des contacts)
router.get('/all', authMiddleware, async (req, res) => {
    // On récupère ID et Username de tout le monde
    const users = await User.find({}, 'username _id');
    res.json(users);
});

// PUT /api/user/tags
router.put('/tags', authMiddleware, async (req, res) => {
    const { tags } = req.body; 
    const user = await User.findById(req.user._id);
    user.tags = tags;
    await user.save();
    res.json(user.tags);
});

module.exports = router;