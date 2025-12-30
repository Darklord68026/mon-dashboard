import { API_URL, getToken } from './config.js';
import { showLoginScreen, showDashboardScreen, startClock, renderTasks, updateTagsState } from './ui.js';
import { login, register, logout } from './auth.js';
import { initSocket } from './socket.js';
import { initWeather } from './weather.js';

// --- CHARGEMENT DONNÉES ---

export function checkAuth() {
    const token = getToken();
    if (token) {
        showDashboardScreen();
        startClock();
        
        // On lance tout en parallèle
        loadUserData(); // Charge les tags
        loadTasks();    // Charge les tâches
        
        initSocket();
        initWeather();
    } else {
        showLoginScreen();
    }
}

async function loadUserData() {
    const token = getToken();
    try {
        const res = await fetch(`${API_URL}/user/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const user = await res.json();
        // On envoie les tags à l'UI
        updateTagsState(user.tags);
    } catch (err) {
        console.error("Erreur chargement user:", err);
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

// --- ACTIONS ---

export async function addTask() {
    const input = document.getElementById('task-input');
    const categorySelect = document.getElementById('task-category-select'); // Nouveau
    const dateInput = document.getElementById('task-date-input');         // Nouveau
    
    const text = input.value;
    if (!text) return;

    const token = getToken();
    
    const payload = {
        text: text,
        category: categorySelect ? categorySelect.value : "Général",
        dueDate: dateInput ? dateInput.value : null
    };

    await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });
    
    input.value = "";
    // On ne vide pas forcément la date pour enchainer les devoirs ;)
}

export async function deleteTask(id) {
    const token = getToken();
    await fetch(`${API_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

// Nouvelle fonction : Ajouter un Tag via le modal
export async function addNewTag() {
    const nameInput = document.getElementById('new-tag-name');
    const colorInput = document.getElementById('new-tag-color');
    const name = nameInput.value;
    const color = colorInput.value;

    if (!name) return;

    const token = getToken();
    try {
        // 1. Récupérer tags actuels
        const resGet = await fetch(`${API_URL}/user/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const user = await resGet.json();
        const currentTags = user.tags;

        // 2. Ajouter le nouveau
        currentTags.push({ name, color });

        // 3. Sauvegarder
        const resPut = await fetch(`${API_URL}/user/tags`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ tags: currentTags })
        });
        const newTags = await resPut.json();
        
        // 4. Mettre à jour l'UI
        updateTagsState(newTags);
        nameInput.value = "";
    } catch (err) {
        alert("Erreur ajout tag");
    }
}

// --- ÉVÉNEMENTS ---

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // --- GESTION DE LA NOUVELLE SIDEBAR ---
    const sidebar = document.getElementById('sidebar');
    const burgerBtn = document.getElementById('burger-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');

    // Ouvrir le menu
    if (burgerBtn) {
        burgerBtn.onclick = () => sidebar.classList.add('active');
    }

    // Fermer le menu
    if (closeSidebarBtn) {
        closeSidebarBtn.onclick = () => sidebar.classList.remove('active');
    }

    // Fermer en cliquant en dehors du menu
    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('active') && 
            !sidebar.contains(e.target) && 
            !burgerBtn.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });
    // --------------------------------------


    // Auth Listeners
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

    // Dashboard Listeners
    const btnAdd = document.getElementById('add-task-btn');
    if (btnAdd) btnAdd.onclick = addTask;
    
    document.getElementById('task-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    // --- GESTION DES PARAMÈTRES & LOGOUT (DANS LA SIDEBAR) ---
    
    // Bouton Logout
    const btnLogout = document.getElementById('logout-btn');
    if (btnLogout) btnLogout.onclick = logout;

    // Modal Paramètres
    const settingsModal = document.getElementById('settings-modal');
    
    // Ouvrir les paramètres (depuis la sidebar)
    const btnOpenSettings = document.getElementById('open-settings-btn');
    if (btnOpenSettings) {
        btnOpenSettings.onclick = () => {
            settingsModal.style.display = 'flex';
            sidebar.classList.remove('active'); // On ferme le menu pour y voir clair
        };
    }

    // Fermer le modal
    const btnCloseSettings = document.getElementById('close-settings-btn');
    if (btnCloseSettings) {
        btnCloseSettings.onclick = () => settingsModal.style.display = 'none';
    }

    // Ajouter un tag (dans le modal)
    const btnAddTag = document.getElementById('add-tag-btn');
    if (btnAddTag) btnAddTag.onclick = addNewTag;
});