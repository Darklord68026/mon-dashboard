import { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { getWeatherDescription, convertWindDirection } from '../utils/weatherUtils';

// 1. LA VALISE MÉTÉO (Ce qu'on garde dans notre State)
interface WeatherData {
    temp: number;
    windSpeed: number;
    windDir: string; // "N", "S", "NO"...
    code: number;
    desc: string;    // "Ciel dégagé", etc.
    lat: string;     // String car on utilise .toFixed(2)
    lon: string;
}

// 2. LE REÇU DE L'IMAGE (Ce que le backend renvoie pour le fond d'écran)
interface BackgroundResponse {
    urls: {
        regular: string;
    }
}

export default function WeatherWidget() {
    // On dit que la boîte contient soit notre valise météo, soit rien (null)
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // On précise que lat et lon sont des nombres
        const fetchWeather = async (lat: number, lon: number) => {
            try {
                // Appel API Open-Meteo
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&models=meteofrance_seamless&current=wind_speed_10m,temperature_2m,wind_direction_10m,weather_code`;
                const res = await fetch(url);
                const data = await res.json();
                
                // Ici, data est énorme ("any"), mais on extrait ce qu'on veut
                const current = data.current;
                
                // On remplit notre valise (l'objet doit respecter l'interface WeatherData)
                setWeather({
                    temp: current.temperature_2m,
                    windSpeed: current.wind_speed_10m,
                    windDir: convertWindDirection(current.wind_direction_10m),
                    code: current.weather_code,
                    desc: getWeatherDescription(current.weather_code),
                    lat: lat.toFixed(2), // toFixed renvoie une string
                    lon: lon.toFixed(2)
                });

                // Appel Backend pour l'image de fond
                // Regarde la Boîte Magique <BackgroundResponse> !
                const bgData = await apiCall<BackgroundResponse>(`/background?code=${current.weather_code}`);
                
                // Maintenant TS sait que bgData a une propriété .urls.regular
                if (bgData && bgData.urls) {
                    document.body.style.backgroundImage = `url('${bgData.urls.regular}')`;
                }

            } catch (err) {
                console.error(err);
                setError("Météo indisponible");
            } finally {
                setLoading(false);
            }
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                // TS connaît déjà "GeolocationPosition", pas besoin de typer "pos"
                (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
                (err) => {
                    console.error(err); // Bon de loguer l'erreur GPS
                    setError("Loc. refusée");
                    setLoading(false);
                    fetchWeather(48.85, 2.35); // Paris par défaut
                }
            );
        } else {
            setError("Pas de GPS");
            setLoading(false);
        }

        // Nettoyage du fond d'écran quand on quitte le widget
        return () => { document.body.style.backgroundImage = ''; };
    }, []);

    if (loading) return <div id="weather-display">Chargement... 🌍</div>;
    // Si error est null, on n'affiche pas cette div
    if (error) return <div id="weather-display">{error}</div>;

    // Petite sécurité : si loading est fini mais que weather est null (cas rare), on ne plante pas
    if (!weather) return null;

    return (
        <div id="weather-display">
            <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '5px' }}>
                Position : {weather.lat}, {weather.lon}
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                {weather.temp}°C
            </div>
            <div style={{ fontSize: '1rem', color: '#aaa' }}>
                Vent: {weather.windSpeed} km/h ({weather.windDir})
            </div>
            <div style={{ color: '#aaa' }}>
                Temps : {weather.desc}
            </div>
        </div>
    );
}