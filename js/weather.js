import { API_URL } from './config.js';
import { updateWeatherUI, updateBackgroundUI, setWeatherLoading, setWeatherError } from './ui.js';

// --- FONCTIONS UTILITAIRES (Privées) ---

function convertWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

function getWeatherDescription(code) {
    if (code === 0) return "Ciel dégagé";
    if (code >= 1 && code <= 3) return "Ciel nuageux";
    if (code >= 45 && code <= 48) return "Brouillard";
    if (code >= 51 && code <= 67) return "Pluie";
    if (code >= 71 && code <= 77) return "Neige";
    if (code >= 95 && code <= 99) return "Orage";
    return "Variable";
}

// --- LOGIQUE PRINCIPALE ---

export function initWeather() {
    setWeatherLoading();

    if (!navigator.geolocation) {
        setWeatherError("Géolocalisation non supportée");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            // 1. Premier appel immédiat
            fetchWeatherData(lat, lon);

            // 2. Mise à jour auto toutes les 10 min
            setInterval(() => fetchWeatherData(lat, lon), 600000);
        },
        () => {
            setWeatherError("Impossible de vous localiser.");
        }
    );
}

async function fetchWeatherData(lat, lon) {
    // Appel OpenMeteo (API Externe)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&models=meteofrance_seamless&current=wind_speed_10m,temperature_2m,wind_direction_10m,weather_code`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        // On prépare les données proprement pour l'UI
        const cleanData = {
            lat: lat.toFixed(2),
            lon: lon.toFixed(2),
            temp: data.current.temperature_2m,
            windSpeed: data.current.wind_speed_10m,
            windDirection: convertWindDirection(data.current.wind_direction_10m),
            description: getWeatherDescription(data.current.weather_code)
        };

        // Mise à jour de l'affichage météo
        updateWeatherUI(cleanData);

        // Appel pour l'image de fond (Ton Backend)
        fetchBackground(data.current.weather_code);

    } catch (error) {
        console.error("Erreur Météo:", error);
        setWeatherError("Erreur chargement météo");
    }
}

async function fetchBackground(weatherCode) {
    // On utilise API_URL qui vient de config.js (gère localhost vs prod tout seul)
    try {
        const response = await fetch(`${API_URL}/background?code=${weatherCode}`);
        if (!response.ok) throw new Error("Erreur image fond");
        
        const data = await response.json();
        if (data.urls && data.urls.regular) {
            updateBackgroundUI(data.urls.regular);
        }
    } catch (error) {
        console.warn("Pas d'image de fond:", error.message);
    }
}