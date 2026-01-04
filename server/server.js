require('dotenv').config();
const path = require('path'); // Utile pour le chargement .env blindé
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

// --- IMPORTS DES ROUTES ---
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/user');
const weatherRoutes = require('./routes/weather');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// --- CONFIG SOCKET.IO ---
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST", "DELETE"] }
});

io.on('connection', (socket) => {
    console.log("⚡ Utilisateur connecté WebSocket :", socket.id);
});

// --- MIDDLEWARE MAGIQUE POUR SOCKET.IO ---
// C'est ça qui permet d'utiliser req.io dans les autres fichiers !
app.use((req, res, next) => {
    req.io = io;
    next();
});

// --- MONGODB ---
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("✅ Connecté à MongoDB Atlas"))
    .catch(err => console.error("❌ Erreur MongoDB: ", err));

// --- BRANCHEMENT DES ROUTES ---
// On définit les préfixes ici :
app.use('/api', authRoutes);       // Gère /api/login et /api/register
app.use('/api/tasks', taskRoutes); // Gère /api/tasks/...
app.use('/api/user', userRoutes);  // Gère /api/user/...
app.use('/api', weatherRoutes);    // Gère /api/background

// --- DÉMARRAGE ---
server.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});