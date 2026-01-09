import { apiCall } from './api.js';
import { checkAuth } from './app.js'; // Pour rafraîchir après login
import { hide, showToast } from './ui.js';

export async function login(username, password) {
    const data = await apiCall('/login', 'POST', ({ username, password }));
    if (data) {
        localStorage.setItem('token', data.token);
        checkAuth(); // On recharge l'état
    }
}

export async function register(username, password) {
    const res = await apiCall('/register', 'POST', ({ username, password }));
    if (res) {
        showToast("Compte créé ! Connectez-vous.", "success");
    }
}

export function logout() {
    hide();
    localStorage.removeItem('token');
    checkAuth();
}

export async function updatePassword(newPassword) {
    const res = await apiCall('/updatePassword', 'PUT', { newPassword });
    if (res) {
        showToast("Mot de passe modifié !", "success");
    }
}