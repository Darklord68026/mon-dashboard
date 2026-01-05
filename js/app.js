import { API_URL, getToken } from './config.js';
import { showLoginScreen, showDashboardScreen, startClock, renderTasks, updateTagsState, showToast, setTaskFilters } from './ui.js';
import { login, register, logout, updatePassword } from './auth.js';
import { initSocket } from './socket.js';
import { initWeather } from './weather.js';

let currentUserId = null;

export function checkAuth() {
    const token = getToken();
    if (token) {
        showDashboardScreen();
        startClock();
        loadUserData();
        loadTasks();
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
        updateTagsState(user.tags);
        const footerText = document.querySelector('#sidebar-display h3');
        if (footerText && user.username) {
            const pseudo = user.username.charAt(0).toUpperCase() + user.username.slice(1);
            footerText.textContent = `Bonjour, ${pseudo} 👋`;
        }
        currentUserId = user._id;
    } catch (err) {
        console.error("Erreur user:", err);
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
    const categorySelect = document.getElementById('task-category-select');
    const dateInput = document.getElementById('task-date-input');
    
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
}

export async function deleteTask(id) {
    const token = getToken();
    await fetch(`${API_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

export async function addNewTag() {
    const nameInput = document.getElementById('new-tag-name');
    const colorInput = document.getElementById('new-tag-color');
    const name = nameInput.value;
    const color = colorInput.value;
    if (!name) return;
    const token = getToken();
    try {
        const resGet = await fetch(`${API_URL}/user/me`, { headers: { 'Authorization': `Bearer ${token}` } });
        const user = await resGet.json();
        const currentTags = user.tags;
        currentTags.push({ name, color });
        const resPut = await fetch(`${API_URL}/user/tags`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ tags: currentTags })
        });
        const newTags = await resPut.json();
        updateTagsState(newTags);
        nameInput.value = "";
        showToast("Tag ajouté avec succès !", "success");
    } catch (err) { showToast("Erreur lors de l'ajout du tag", "error"); }
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // SIDEBAR
    const sidebar = document.getElementById('sidebar');
    const burgerBtn = document.getElementById('burger-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');

    if (burgerBtn) burgerBtn.onclick = () => sidebar.classList.add('active');
    if (closeSidebarBtn) closeSidebarBtn.onclick = () => sidebar.classList.remove('active');
    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('active') && !sidebar.contains(e.target) && !burgerBtn.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });

    // AUTH
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

    // DASHBOARD
    const btnAdd = document.getElementById('add-task-btn');
    if (btnAdd) btnAdd.onclick = addTask;
    
    document.getElementById('task-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    // --- MODAL PARAMETRES (Gestion via classes CSS) ---
    const settingsModal = document.getElementById('settings-modal');
    const selectParams = document.getElementById('select-params');
    const tagsModal = document.getElementById('tags');
    const securityModal = document.getElementById('security');
    
    // Ouvrir
    const btnOpenSettings = document.getElementById('open-settings-btn');
    if (btnOpenSettings) {
        btnOpenSettings.onclick = () => {
            settingsModal.classList.remove('hidden');
            selectParams.classList.remove('hidden');
            tagsModal.classList.add('hidden');
            securityModal.classList.add('hidden');
            sidebar.classList.remove('active');
        };
    }

    // Navigation sous-menus
    const btnTags = document.getElementById('open-settings-tags-btn');
    if (btnTags) {
        btnTags.onclick = () => {
            selectParams.classList.add('hidden');
            tagsModal.classList.remove('hidden');
        };
    }
    const btnSecurity = document.getElementById('open-settings-security-btn');
    if (btnSecurity) {
        btnSecurity.onclick = () => {
            selectParams.classList.add('hidden');
            securityModal.classList.remove('hidden');
        };
    }

    // Boutons fermeture (croix)
    const closeButtons = document.querySelectorAll('.close-settings-btn');
    closeButtons.forEach(btn => {
        btn.onclick = () => {
            settingsModal.classList.add('hidden');
        };
    });

    // Update Password
    const btnupdatePassword = document.getElementById('btn-updatePassword');
    if (btnupdatePassword) {
        btnupdatePassword.onclick = () => {
            const p = document.getElementById('input-newPassword').value;
            updatePassword(p, currentUserId);
        };
    }

    // Add Tag
    const btnAddTag = document.getElementById('add-tag-btn');
    if (btnAddTag) btnAddTag.onclick = addNewTag;

    // --- GESTION DES FILTRES DE TÂCHES ---
    const filterSelect = document.getElementById('filter-tag');
    const sortSelect = document.getElementById('sort-order');

    if (filterSelect) {
        filterSelect.onchange = (e) => {
            setTaskFilters(e.target.value, null);
        };
    }

    if (sortSelect) {
        sortSelect.onchange = (e) => {
            setTaskFilters(null, e.target.value);
        };
    }
});