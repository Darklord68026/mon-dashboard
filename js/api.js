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
        },
        // Cas d'erreur : l'utilisateur refuse ou ça ne marche pas
        () => {
            weatherDisplay.textContent = "Impossible de vous localiser. Vérifiez les permissions";
        }
    );
}

// Fonction qui va chercher la météo (maintenant elle prend lat/lon en paramètres)
async function fetchWeather(lat, lon) {
    const weatherDisplay = document.getElementById('weather-display');

    // On insère les variables dans lat et lon dans l'URL
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&models=meteofrance_seamless&current=wind_speed_10m,temperature_2m`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        const temperature = data.current.temperature_2m;
        const windSpeed = data.current.wind_speed_10m;

        // Affichage propre
        weatherDisplay.innerHTML = `
        <div style="font-size: 0.9rem; color: #888; margin-bottom: 5px;">
        Position : ${lat.toFixed(2)}, ${lon.toFixed(2)}
        </div>
        <div style="font-size: 2.5rem; font-weight: bold;">
        ${temperature}°C
        </div>
        <div style="font-size: 1rem; color: #aaa;">
        Vent: ${windSpeed} km/h
        </div>
        `;
    } catch (error) {
        console.error("Erreur API Météo :", error);
        weatherDisplay.textContent = "Erreur chargement météo";
    }
}

// On lance le processus au chargment
initWeather();

// On update toute les 10min (600 000ms)
setInterval(fetchWeather(lat, lon), 600000)