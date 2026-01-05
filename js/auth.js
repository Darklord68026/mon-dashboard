import { API_URL } from './config.js';
import { checkAuth } from './app.js'; // Pour rafraîchir après login
import { getToken } from './config.js';

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
        alert("Erreur Login: " + err.message);
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
        alert("Compte créé ! Connectez-vous.");
    } catch (err) {
        alert(err.message);
    }
}

export function logout() {
    localStorage.removeItem('token');
    checkAuth();
}

export async function updatePassword(newPassword) {
    const token = getToken(); // On récupère le jeton JWT

    if (!token) {
        alert("Vous devez être connecté !");
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

        alert("Mot de passe modifié !");
        
        // Optionnel : Tu peux déconnecter l'user pour qu'il se reconnecte avec le nouveau MDP
        // logout(); 

    } catch (err) {
        alert("Erreur : " + err.message);
    }
}