// Traduction des codes WMO
export function getWeatherDescription(code: number): string {
    if (code === 0) return "Ciel dégagé ☀️";
    if (code >= 1 && code <= 3) return "Ciel nuageux ☁️";
    if (code >= 45 && code <= 48) return "Brouillard 🌫️";
    if (code >= 51 && code <= 67) return "Pluie 🌧️";
    if (code >= 71 && code <= 77) return "Neige ❄️";
    if (code >= 95 && code <= 99) return "Orage ⚡";
    return "Variable";
}

// Conversion degrés -> Rose des vents
export function convertWindDirection(degrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[(index + 16) % 16];
}