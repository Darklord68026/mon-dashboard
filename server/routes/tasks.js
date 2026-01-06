const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const authMiddleware = require('../middleware/auth');

// On applique le middleware de sécurité à TOUTES les routes de ce fichier
router.use(authMiddleware);

// GET /api/tasks/
router.get('/', async (req, res) => {
    try {
        const tasks = await Task.find({ owner: req.user._id }).sort({ createdAt: -1 });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: "Erreur lecture tâches" });
    }
});

// POST /api/tasks/
router.post('/', async (req, res) => {
    try {
        const newTask = new Task({
            text: req.body.text,
            isDone: false,
            owner: req.user._id,
            category: req.body.category || "Général",
            dueDate: req.body.dueDate || null
        });
        const savedTask = await newTask.save();

        // 📢 L'ASTUCE : on utilise req.io récupéré depuis server.js
        req.io.emit('taskAdded', savedTask);

        res.json(savedTask);
    } catch (error) {
        res.status(500).json({ error: "Erreur création tâche" });
    }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
    try {
        const result = await Task.deleteOne({ _id: req.params.id, owner: req.user._id });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Introuvable ou non autorisé" });
        }

        // 📢 SIGNAL SOCKET
        req.io.emit('taskDeleted', req.params.id);

        res.json({ message: "Supprimé" });
    } catch (error) {
        res.status(500).json({ error: "Erreur suppression" });
    }
});

// PUT /api/tasks/:id (Pour modifier le texte)
router.put('/:id', async (req, res) => {
    try {
        const { text } = req.body;
        
        // 1. On cherche la tâche et on vérifie qu'elle appartient bien au user
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
        
        if (!task) return res.status(404).json({ error: "Tâche introuvable" });

        // 2. On modifie et on sauvegarde
        task.text = text;
        const updatedTask = await task.save();

        // 3. 📢 SIGNAL SOCKET (Pour que ton pote voit la correction en direct)
        // Note: Il faudra écouter cet événement côté client plus tard si tu veux le temps réel
        req.io.emit('taskUpdated', updatedTask);

        res.json(updatedTask);
    } catch (error) {
        res.status(500).json({ error: "Erreur modification" });
    }
});

module.exports = router;