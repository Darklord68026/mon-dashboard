// server/server.js
require('dotenv').config(); // Charge les variables secrètes
const express = require('express');
const cors = require('cors'); // Import dynamique pour node-fetch (version récente)
const axios = require('axios');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = 3000;

// Autorise le frontend à parler au backend
app.use(cors());
app.use(express.json());

// Création du serveur Socket
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "DELETE"]
    }
});

// Quand qqn se connecte au socket
io.on('connection', (socket) => {
    console.log("Un utilisateur s'est connecté au socket :", socket.id);

    socket.on('disconnect', () => {
        console.log('Utilisateur déconnecté');
    });
});

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("Connecté à MongoDB Atlas"))
    .catch(err => console.error("Erruer MongoDB: ", err));

// Définition du "Schéma" (a quoi ressemble la tache)
const taskSchema = new mongoose.Schema({
    text: String,
    isDone: Boolean,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});
// Création du Modèle
const Task = mongoose.model('Task', taskSchema);

// Schéma Utilisateur
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true},
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// 1. Inscription
app.post('/api/register', async(req, res) => {
    try {
        const { username, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            password: hashedPassword
        });

        await newUser.save();
        res.status(201).json({ message: "Utilisateur créé !" });
    } catch (error) {
        res.status(500).json({ error: "Erreur (L'utilisateur existe déjà ?)" });
        console.error("Erreur resgister :", error);
    }
});

// 2. Connexion
app.post('/api/login', async(req, res) => {
    try {
        const { username, password } = req.body;

        // On cherche l'utilisateur
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: "Utilisateur inconnu "});

        // On compare le mot de passe envoyé avec le hash en base de données
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) returnres.status(400).json({ error: "Mot de passe inconnu" });

        // On crée le TOKEN
        // Il contient l'ID de l'utilisateur et expire dans 24h
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

        // On renvoie le token au frontend
        res.json({ token: token });
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
        console.error("Erreur connexion :", error);
    }
});

function authMiddleware(req, res, next) {
    // Le token est envoyé dans le header : "Authorization: Bearer <TOKEN>"
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1]; // On enlève le mot Bearer

    if (!token) return res.status(401).json({ error: "Accès refusé" });

    try {
        // On vérifie la signature du badge
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; // on attache les infos du user à la requête
        next(); // On laisse passer
    } catch (error) {
        res.status(400).json({ error: "Token invalide" });
    }
}

// Récupérer SES tâches uniquement
// Note l'ajout de 'authMiddleware' au milieu
app.get('/api/tasks', authMiddleware, async (req, res) => {
    try {
        // On cherche les tâches où owner == l'ID du token
        const tasks = await Task.find({ owner: req.user._id }).sort({ createdAt: -1 });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: "Erreur" });
    }
});

// Ajouter une tâche A SOI
app.post('/api/tasks', authMiddleware, async (req, res) => {
    try {
        const newTask = new Task({
            text: req.body.text,
            isDone: false,
            owner: req.user._id // <--- Important : on l'assigne à celui qui est connecté
        });
        const savedTask = await newTask.save();

        io.emit('taskAdded', savedTask);

        res.json(savedTask);
    } catch (error) {
        res.status(500).json({ error: "Erreur" });
    }
});

// Supprimer UNE DE SES tâches
app.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
    try {
        // On vérifie que la tâche existe ET qu'elle appartient bien au user
        const result = await Task.deleteOne({ _id: req.params.id, owner: req.user._id });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Tâche introuvable ou non autorisée" });
        }

        io.emit('taskDeleted', req.params.id);

        res.json({ message: "Supprimé" });
    } catch (error) {
        res.status(500).json({ error: "Erreur" });
    }
});

// Route: /api/background
// Le frontend appellera : http://localhost:3000/api/background?code=61
app.get('/api/background', async(req, res) => {
    const weatherCode = req.query.code; // On récupère le code météo envoyé par le frontend
    console.log(`weatherCode = ${weatherCode}`);

    if (!process.env.UNSPLASH_KEY) {
        return res.status(500).json({ error: "Clé API manquante" });
    }

    //? Logique de traduction (Météo -> mots clés) déplacée ici
    let query = "landscape,nature";
    const code = parseInt(weatherCode);

    switch (true) {
        case code === 0:
            query = "nature,sunny,clear sky";
            break;
        case code >= 1 && code <= 3:
            query = "nature,cloudy";
            break;
        case code >= 45 && code <= 48:
            query = "fog,forest";
            break;
        case code >= 51 && code <= 67:
            query = "rain,moody";
            break;
        case code >= 71 && code <= 77:
            query = "snow,winter";
            break;
        case code >= 95 && code <= 99:
            query ="storm, thunder";
            break;
    }

    console.log("--- DIAGNOSTIC AVANT ENVOI ---");
    console.log("1. Query choisie :", query);
    console.log("2. Ma Clé est-elle lue ? :", process.env.UNSPLASH_KEY ? "OUI (Présente)" : "NON (Manquante)");
    
    const unsplashUrl = `https://api.unsplash.com/photos/random?query=${query}&orientation=landscape&client_id=${process.env.UNSPLASH_KEY}`;
    
    console.log("3. URL générée :", unsplashUrl); // Vérifie s'il y a "undefined" dedans !
    console.log("------------------------------");

    try {
        console.log("Tentative de contact Unsplash...");
        // Axios gère tout (JSON, erreurs) automatiquement
        const response = await axios.get(unsplashUrl);
        console.log("Réponse reçue !");
        // Avec axios les données sont directement dans .data
        res.json(response.data); // On renvoie la réponse d'Unsplash au frontend
    } catch (error) {
        // Gestion d'erreur détaillée
        if (error.response) {
            // Le serveur d'Unsplash a répondu avec une erreur (ex: 401, 403, 404)
            console.error("Erreur API Unsplash :", error.response.status, error.response.data);
            res.status(error.response.status).json(error.response.data);
        } else if (error.request) {
            // La requête est partie mais pas de réponse (problème réseau)
            console.error("Pas de réponse (problème réseau) :", error.message);
            res.status(503).json({ error: "Service injoignable"});
        } else {
            // Erreur de config
            console.error("Erreur :", error.message);
            res.status(500).json({ error: error.message });
        }
    }
});

server.listen(PORT, () => {
    console.log(`Serveur Backend démarré sur http://localhost:${PORT}`);
});