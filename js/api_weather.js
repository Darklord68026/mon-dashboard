// Fonction pricipale qui gère la logique de localisation
function initWeather() {
    const weatherDisplay = document.getElementById('weather-display');

    // 1. Vérifier si le navigateur supporte la géolocalisation
    if (!navigator.geolocation) {
        weatherDisplay.textContent = "Géolocalisation non supportée par ce navigateur";
        return;
    }

    weatherDisplay.textContent = "Localisation en cours...";

    // 2. Demander la position
    navigator.geolocation.getCurrentPosition(
        // Cas de succès : le navigateur nous donne la position
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            // On appelle notre fonction météo avec ces coordonnées précises
            fetchWeather(lat, lon);

            // On update toute les 10min (600 000ms)
            setInterval(() => {console.log("Mise à jour automatique de la météo..."); fetchWeather(lat, lon);}, 600000);
        },
        // Cas d'erreur : l'utilisateur refuse ou ça ne marche pas
        () => {
            weatherDisplay.textContent = "Impossible de vous localiser. Vérifiez les permissions";
        }
    );
}

function convertWindDirection(degrees) {
    // Liste des 16 directions (Sens horaire)
    // N = Nord, E = Est, S = Sud, O = Ouest
    const directions = [
        'N', 'NNE', 'NE', 'ENE',
        'E', 'ESE', 'SE', 'SSE',
        'S', 'SSO', 'SO', 'OSO',
        'O', 'ONO', 'NO', 'NNO'
    ];

    // 1. On divise par 22.5 car il y a 16 secteurs (360 / 16 = 22.5)
    // 2. Le modulo de 16 (% 16) permet de boucler (l'index 16 redevient 0)
    const index = Math.round(degrees / 22.5) % 16
    return directions[index];
}

function getWeather(code) {
    // Switch est ue alternative propre aux multiple "if / else if"
    switch (true) {
        case code === 0:
            return "Ciel dégagé";
        case code >= 1 && code <= 3:
            return "Ciel nuageux";
        case code >= 45 && code <= 48:
            return "Brouillard";
        case code >= 51 && code <= 67:
            return "Pluie";
        case code >= 71 && code <= 77:
            return "Neige";
        case code >= 95 && code <= 99:
            return "Orage";
        default:
            return "landscape,nature";
    }
}

async function updateBackground(weatherCode) {
    const url = `/api/background?code=${weatherCode}`;

    try {
        const response = await fetch(url);

        // --- AJOUT DE CETTE VÉRIFICATION ---
        if (!response.ok) {
            // Si le serveur a renvoyé 404, 500, 401... on arrête tout
            throw new Error(`Erreur HTTP serveur : ${response.status}`);
        }
        // -----------------------------------

        const data = await response.json();
        
        console.log("📦 Données reçues :", data);

        if (data.urls && data.urls.regular) {
            document.body.style.backgroundImage = `url('${data.urls.regular}')`;
        } else {
            console.warn("Pas d'URL d'image trouvée dans la réponse");
        }
        
    } catch (error) {
        // C'est ici que tu verras la vraie erreur s'afficher
        console.error("Problème final :", error.message);
        document.body.style.backgroundColor = "#121212";
    }
}

// Fonction qui va chercher la météo (maintenant elle prend lat/lon en paramètres)
async function fetchWeather(lat, lon) {
    const weatherDisplay = document.getElementById('weather-display');

    // On insère les variables dans lat et lon dans l'URL
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&models=meteofrance_seamless&current=wind_speed_10m,temperature_2m,wind_direction_10m,weather_code`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        const temperature = data.current.temperature_2m;
        const windSpeed = data.current.wind_speed_10m;
        const windDegrees = data.current.wind_direction_10m;
        const windDirection = convertWindDirection(windDegrees);
        const weatherCode = data.current.weather_code;

        updateBackground(weatherCode)

        // Affichage propre
        weatherDisplay.innerHTML = `
        <div style="font-size: 0.9rem; color: #888; margin-bottom: 5px;">
        Position : ${lat.toFixed(2)}, ${lon.toFixed(2)}
        </div>
        <div style="font-size: 2.5rem; font-weight: bold;">
        ${temperature}°C
        </div>
        <div style="font-size: 1rem; color: #aaa;">
        Vent: ${windSpeed} km/h ${windDirection}
        </div>
        <div style="color: #aaa;">
        Temps : ${getWeather(weatherCode)}
        </div>
        `;
    } catch (error) {
        console.error("Erreur API Météo :", error);
        weatherDisplay.textContent = "Erreur chargement météo";
    }
}

// On lance le processus au chargment
initWeather();