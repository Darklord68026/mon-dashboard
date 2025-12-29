require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');

// --- IMPORTS DES FICHIERS SÉPARÉS ---
const User = require('./models/User');
const Task = require('./models/Task');
const authMiddleware = require('./middleware/auth');
// ------------------------------------

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// --- SOCKET.IO CONFIG ---
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST", "DELETE"] }
});

io.on('connection', (socket) => {
    console.log("⚡ Utilisateur connecté WebSocket :", socket.id);
});

// --- MONGODB ---
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("✅ Connecté à MongoDB Atlas"))
    .catch(err => console.error("❌ Erreur MongoDB: ", err));


// ================= ROUTES AUTH =================

// 1. Inscription
app.post('/api/register', async(req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        
        res.status(201).json({ message: "Utilisateur créé !" });
    } catch (error) {
        console.error("Erreur register :", error);
        res.status(500).json({ error: "Erreur (L'utilisateur existe déjà ?)" });
    }
});

// 2. Connexion
app.post('/api/login', async(req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: "Utilisateur inconnu" });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: "Mot de passe inconnu" });

        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token: token });
    } catch (error) {
        console.error("Erreur login :", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});


// ================= ROUTES TÂCHES =================

// Récupérer les tâches
app.get('/api/tasks', authMiddleware, async (req, res) => {
    try {
        const tasks = await Task.find({ owner: req.user._id }).sort({ createdAt: -1 });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: "Erreur lecture tâches" });
    }
});

// Ajouter une tâche
app.post('/api/tasks', authMiddleware, async (req, res) => {
    try {
        const newTask = new Task({
            text: req.body.text,
            isDone: false,
            owner: req.user._id
        });
        const savedTask = await newTask.save();

        // 📢 SIGNAL SOCKET.IO
        io.emit('taskAdded', savedTask);

        res.json(savedTask);
    } catch (error) {
        res.status(500).json({ error: "Erreur création tâche" });
    }
});

// Supprimer une tâche
app.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
    try {
        const result = await Task.deleteOne({ _id: req.params.id, owner: req.user._id });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Introuvable ou non autorisé" });
        }

        // 📢 SIGNAL SOCKET.IO
        io.emit('taskDeleted', req.params.id);

        res.json({ message: "Supprimé" });
    } catch (error) {
        res.status(500).json({ error: "Erreur suppression" });
    }
});


// ================= ROUTE BACKGROUND =================

app.get('/api/background', async(req, res) => {
    const weatherCode = parseInt(req.query.code);
    if (!process.env.UNSPLASH_KEY) return res.status(500).json({ error: "Clé API manquante" });

    let query = "landscape,nature";
    if (weatherCode === 0) query = "nature,sunny,clear sky";
    else if (weatherCode >= 1 && weatherCode <= 3) query = "nature,cloudy";
    else if (weatherCode >= 45 && weatherCode <= 48) query = "fog,forest";
    else if (weatherCode >= 51 && weatherCode <= 67) query = "rain,moody";
    else if (weatherCode >= 71 && weatherCode <= 77) query = "snow,winter";
    else if (weatherCode >= 95 && weatherCode <= 99) query = "storm,thunder";

    const unsplashUrl = `https://api.unsplash.com/photos/random?query=${query}&orientation=landscape&w=1920&q=80&client_id=${process.env.UNSPLASH_KEY}`;

    try {
        const response = await axios.get(unsplashUrl);
        res.json(response.data);
    } catch (error) {
        console.error("Erreur Unsplash :", error.message);
        // Gestion simplifiée de l'erreur
        res.status(500).json({ error: "Erreur récupération image" });
    }
});

// --- DÉMARRAGE ---
server.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});