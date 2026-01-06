import { API_URL, getToken } from './config.js';
import { logout } from './auth.js';
import { showToast } from './ui.js';

/**
 * Fonction universelle pour les appels API
 * Gère le token, le JSON, et les erreurs (401, 400, 500) automatiquement.
 */
export async function apiCall(endpoint, method = 'GET', body = null) {
    const token = getToken();
    
    // Configuration de base (Headers + Token)
    const headers = { 
        'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    try {
        const res = await fetch(`${API_URL}${endpoint}`, config);

        // 1. Gestion de la déconnexion forcée (Token expiré ou invalide)
        if (res.status === 401) {
            logout(); // Ça redirige vers le login et nettoie le storage
            return null;
        }

        // 2. On tente de lire la réponse JSON
        let data;
        try {
            data = await res.json();
        } catch (e) {
            // Si le serveur ne renvoie pas de JSON (rare mais possible)
            data = {}; 
        }

        // 3. Si le serveur a renvoyé une erreur (400, 403, 500...)
        if (!res.ok) {
            const errorMessage = data.error || "Une erreur est survenue";
            showToast(errorMessage, "error");
            return null; // On renvoie null pour dire "ça a raté"
        }

        // 4. Tout est bon !
        return data;

    } catch (err) {
        console.error("Erreur réseau ou code :", err);
        showToast("Impossible de contacter le serveur 📡", "error");
        return null;
    }
}