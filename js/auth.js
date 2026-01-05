import { API_URL } from './config.js';
import { checkAuth } from './app.js'; // Pour rafraîchir après login
import { getToken } from './config.js';
import { showToast } from './ui.js';

export async function login(username, password) {
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        localStorage.setItem('token', data.token);
        checkAuth(); // On recharge l'état
    } catch (err) {
        showToast("Erreur Login: " + err.message, "error");
    }
}

export async function register(username, password) {
    try {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!res.ok) throw new Error("Erreur inscription");
        showToast("Compte créé ! Connectez-vous.", "success");
    } catch (err) {
        showToast(err.message, "error");
    }
}

export function logout() {
    localStorage.removeItem('token');
    checkAuth();
}

export async function updatePassword(newPassword) {
    const token = getToken(); // On récupère le jeton JWT

    if (!token) {
        showToast("Vous devez être connecté !", "error");
        return;
    }

    try {
        // Note: J'ai changé POST en PUT pour correspondre au serveur
        const res = await fetch(`${API_URL}/updatePassword`, {
            method: 'PUT', 
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // <--- INDISPENSABLE
            },
            // On envoie juste le mot de passe, l'ID est dans le token
            body: JSON.stringify({ newPassword }) 
        });

        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Erreur inconnue");

        showToast("Mot de passe modifié !", "success");
        
        // Optionnel : Tu peux déconnecter l'user pour qu'il se reconnecte avec le nouveau MDP
        // logout(); 

    } catch (err) {
        showToast("Erreur : " + err.message, "error");
    }
}