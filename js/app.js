import { API_URL, getToken } from './config.js';
import { showLoginScreen, showDashboardScreen, startClock, renderTasks } from './ui.js';
import { login, register, logout } from './auth.js';
import { initSocket } from './socket.js';
import { initWeather } from './weather.js';

// --- FONCTIONS GLOBALES (Accessibles par UI.js) ---

export function checkAuth() {
    const token = getToken();
    if (token) {
        showDashboardScreen();
        startClock();
        loadTasks();
        initSocket(); // On lance le temps réel
    } else {
        showLoginScreen();
    }
}

async function loadTasks() {
    const token = getToken();
    try {
        const res = await fetch(`${API_URL}/tasks`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) { logout(); return; }
        const tasks = await res.json();
        renderTasks(tasks);
    } catch (err) {
        console.error(err);
    }
}

export async function addTask() {
    const input = document.getElementById('task-input');
    const text = input.value;
    if (!text) return;

    const token = getToken();
    await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
    });
    input.value = "";
    // Pas besoin de recharger loadTasks(), le Socket va le faire pour nous !
}

export async function deleteTask(id) {
    const token = getToken();
    await fetch(`${API_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    // Pas besoin de supprimer du DOM, le Socket va nous le dire !
}

// --- ÉVÉNEMENTS (Les clics) ---
// Comme on est en "Module", les fonctions ne sont plus globales dans le HTML (onclick="...")
// Il faut attacher les événements ici en JS.

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // Boutons Auth
    document.querySelector('#login-screen button:first-of-type').onclick = () => {
        const u = document.getElementById('username').value;
        const p = document.getElementById('password').value;
        login(u, p);
    };
    document.querySelector('#login-screen .secondary-btn').onclick = () => {
        const u = document.getElementById('username').value;
        const p = document.getElementById('password').value;
        register(u, p);
    };

    initWeather();

    // Boutons Dashboard
    document.getElementById('add-task-btn').onclick = addTask;
    document.querySelector('header button').onclick = logout;
    
    // Entrée clavier
    document.getElementById('task-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
});