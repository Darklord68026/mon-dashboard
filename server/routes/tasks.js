const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const authMiddleware = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// Middleware de sécurité global pour ce fichier
router.use(authMiddleware);

// GET /api/tasks/
router.get('/', asyncHandler(async (req, res) => {
    const tasks = await Task.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json(tasks);
}));

// POST /api/tasks/
router.post('/', asyncHandler(async (req, res) => {
    if (!req.body.text) throw new AppError("Le texte de la tâche est requis", 400);

    const newTask = new Task({
        text: req.body.text,
        isDone: false,
        owner: req.user._id,
        category: req.body.category || "Général",
        dueDate: req.body.dueDate || null
    });
    const savedTask = await newTask.save();

    // Socket
    req.io.emit('taskAdded', savedTask);

    res.json(savedTask);
}));

// DELETE /api/tasks/:id
router.delete('/:id', asyncHandler(async (req, res) => {
    const result = await Task.deleteOne({ _id: req.params.id, owner: req.user._id });
        
    if (result.deletedCount === 0) {
        throw new AppError("Tâche introuvable ou non autorisée", 404);
    }

    // Socket
    req.io.emit('taskDeleted', req.params.id);

    res.json({ message: "Supprimé" });
}));

// PUT /api/tasks/:id
router.put('/:id', asyncHandler(async (req, res) => {
    const { text } = req.body;
        
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
        
    if (!task) throw new AppError("Tâche introuvable", 404);

    if (text !== undefined) task.text = text;
    // Tu peux ajouter d'autres champs ici (isDone, etc.) si tu étends l'app
    
    const updatedTask = await task.save();

    // Socket
    req.io.emit('taskUpdated', updatedTask);

    res.json(updatedTask);
}));

module.exports = router;