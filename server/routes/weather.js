const express = require('express');
const router = express.Router();
const axios = require('axios');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// GET /api/background
router.get('/background', async (req, res) => {
    if (process.env.USE_MOCK_DATA === 'true') {
        console.log("MOCK TEST MODE ACTIF");

        return res.json({
            id: "test-image",
            urls: {
                regular: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1920&auto=format&fit=crop",
                small: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=400&auto=format&fit=crop"
            },
            user: {
                name: "Mode Test",
                username: "test_user"
            },
            alt_description: "Image de test (Pas d'appel API)"
        });
    } else {
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

        const response = await axios.get(unsplashUrl);
        res.json(response.data);
    };
});

module.exports = router;