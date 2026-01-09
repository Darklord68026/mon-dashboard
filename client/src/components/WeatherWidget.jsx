import { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { getWeatherDescription, convertWindDirection } from '../utils/weatherUtils';

export default function WeatherWidget() {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWeather = async (lat, lon) => {
            try {
                // Appel API Open-Meteo
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&models=meteofrance_seamless&current=wind_speed_10m,temperature_2m,wind_direction_10m,weather_code`;
                const res = await fetch(url);
                const data = await res.json();
                
                const current = data.current;
                
                setWeather({
                    temp: current.temperature_2m,
                    windSpeed: current.wind_speed_10m,
                    windDir: convertWindDirection(current.wind_direction_10m), // <-- Ajout de la direction
                    code: current.weather_code,
                    desc: getWeatherDescription(current.weather_code), // <-- Description textuelle
                    lat: lat.toFixed(2),
                    lon: lon.toFixed(2)
                });

                // Appel Backend pour l'image de fond
                const bgData = await apiCall(`/background?code=${current.weather_code}`);
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
                (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
                (err) => {
                    setError("Loc. refusée");
                    setLoading(false);
                    fetchWeather(48.85, 2.35); // Paris par défaut
                }
            );
        } else {
            setError("Pas de GPS");
            setLoading(false);
        }

        return () => { document.body.style.backgroundImage = ''; };
    }, []);

    if (loading) return <div id="weather-display">Chargement... 🌍</div>;
    if (error) return <div id="weather-display">{error}</div>;

    return (
        <div id="weather-display">
            <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '5px' }}>
                Position : {weather.lat}, {weather.lon}
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                {weather.temp}°C
            </div>
            <div style={{ fontSize: '1rem', color: '#aaa' }}>
                {/* On remet le format exact de ton ancien code */}
                Vent: {weather.windSpeed} km/h ({weather.windDir})
            </div>
            <div style={{ color: '#aaa' }}>
                Temps : {weather.desc}
            </div>
        </div>
    );
}