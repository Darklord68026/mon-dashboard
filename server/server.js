// server/server.js
require('dotenv').config(); // Charge les variables secrètes
const express = require('express');
const cors = require('cors'); // Import dynamique pour node-fetch (version récente)
const axios = require('axios');

const app = express();
const PORT = 3000;

// Autorise le frontend à parler au backend
app.use(cors());

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

app.listen(PORT, () => {
    console.log(`Serveur Backend démarré sur http://localhost:${PORT}`);
});