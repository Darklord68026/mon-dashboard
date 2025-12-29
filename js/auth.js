import { API_URL } from './config.js';
import { checkAuth } from './app.js'; // Pour rafraîchir après login

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