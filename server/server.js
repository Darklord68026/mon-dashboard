require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const errorHandler = require('./middleware/error');
const rateLimit = require('express-rate-limit');

// --- IMPORTS DES ROUTES ---
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/user');
const chatRoutes = require('./routes/chat');
const suggestionRoutes = require('./routes/suggestions');
const weatherRoutes = require('./routes/weather');

const app = express();
const PORT = 3000;

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Trop de requêtes réessayez dans 15min"
});

app.use(cors({
    origin: '*', // En prod, tu mettras ton domaine (ex: https://mon-dashboard.com)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
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
app.use('/api', authRoutes, limiter);       // Gère /api/login et /api/register
app.use('/api/tasks', taskRoutes, limiter); // Gère /api/tasks/...
app.use('/api/user', userRoutes, limiter);  // Gère /api/user/...
app.use('/api/chat', chatRoutes, limiter);  // Gère /api/chat/
app.use('/api/suggestions', suggestionRoutes, limiter); // Gère /api/suggestions...
app.use('/api', weatherRoutes, limiter);    // Gère /api/background

app.use((req, res, next) => {
    // On crée une erreur manuellement pour la passer au ErrorHandler
    const error = new Error(`La route ${req.originalUrl} n'existe pas.`);
    error.statusCode = 404;
    next(error);
});

app.use(errorHandler);

// --- DÉMARRAGE ---
server.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});