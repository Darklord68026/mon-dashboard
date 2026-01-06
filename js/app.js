import { API_URL, getToken } from './config.js';
import { showLoginScreen, showDashboardScreen, startClock, renderTasks, updateTagsState, showToast, setTaskFilters } from './ui.js';
import { login, register, logout, updatePassword } from './auth.js';
import { initSocket } from './socket.js';
import { initWeather } from './weather.js';

let currentUserId = null;
let currentUserUsername = null;

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
        if (res.status === 401) { logout(); return; }
        const user = await res.json();
        updateTagsState(user.tags);
        const footerText = document.querySelector('#sidebar-display h3');
        if (footerText && user.username) {
            const pseudo = user.username.charAt(0).toUpperCase() + user.username.slice(1);
            footerText.textContent = `Bonjour, ${pseudo} 👋`;
        }
        const inboxBtn = document.getElementById('open-inbox-btn');
        
        if (inboxBtn) {
            if (user.role === 'admin') {
                inboxBtn.style.display = 'block';
            } else {
                inboxBtn.style.display = 'none';
            }
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
        if (res.status === 401) { logout(); return; }
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

export async function editTask(id, currentText) {
    // 1. On demande le nouveau texte à l'utilisateur
    const newText = prompt("Modifier la tâche :", currentText);

    // Si l'utilisateur annule ou laisse vide, on arrête tout
    if (newText === null || newText.trim() === "") return;

    const token = getToken();

    try {
        const res = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'PUT', // <--- Verbe PUT pour modifier
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ text: newText })
        });

        if (!res.ok) throw new Error("Erreur modif");

    } catch (err) {
        alert("Impossible de modifier la tâche");
    }
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

async function sendSuggestion() {
    const input = document.getElementById('suggestion-text');
    const text = input.value;
    
    if (!text.trim()) return; // On n'envoie pas de vide

    const token = getToken(); // Ta fonction importée de config.js

    try {
        const res = await fetch(`${API_URL}/suggestions`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ text })
        });

        if (res.ok) {
            input.value = ""; // On vide le champ
            showToast("Suggestion envoyée !", "success");
        } else {
            showToast("Erreur lors de l'envoi...", "error");
        }
    } catch (err) {
        console.error(err);
    }
}

async function loadSuggestions() {
    const list = document.getElementById('suggestions-list');
    const emptyMsg = document.getElementById('empty-inbox-msg');
    const token = getToken();

    list.innerHTML = ""; // On vide avant de remplir

    try {
        const res = await fetch(`${API_URL}/suggestions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const suggestions = await res.json();

        if (suggestions.length === 0) {
            emptyMsg.style.display = 'block';
            return;
        }
        emptyMsg.style.display = 'none';

        suggestions.forEach(sugg => {
            const li = document.createElement('li');
            li.className = 'suggestion-item';
            
            li.innerHTML = `
                <div class="suggestion-content">
                    <span class="suggestion-author">${sugg.author || 'Anonyme'}</span>
                    <span class="suggestion-text">${sugg.text}</span>
                </div>
                <button class="delete-suggestion-btn" onclick="deleteSuggestion('${sugg._id}')">✕</button>
            `;
            list.appendChild(li);
        });

    } catch (err) {
        console.error(err);
        showToast("Impossible de lire les idées", "error");
    }
}

// Fonction globale pour le onclick
window.deleteSuggestion = async (id) => {
    if (!confirm("Supprimer cette idée ?")) return;
    
    const token = getToken();
    try {
        await fetch(`${API_URL}/suggestions/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        loadSuggestions(); // On recharge la liste
        showToast("Idée supprimée", "success");
    } catch (err) {
        showToast("Erreur suppression", "error");
    }
};

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

    // Logout
    const btnlogout = document.getElementById('logout-btn');
    if (btnlogout) {
        btnlogout.onclick = () => {
            logout();
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

    // --- MODE ZEN (Double Clic pour tout cacher) ---
    document.addEventListener('dblclick', (e) => {
        const dashboard = document.getElementById('dashboard-screen');
        const login = document.getElementById('login-screen');

        // SÉCURITÉ 1 : On ne fait rien si on est encore sur l'écran de connexion
        // (Si le login n'a pas la classe hidden, c'est qu'on est pas connecté)
        if (!login.classList.contains('hidden')) return;

        // SÉCURITÉ 2 : On ne fait rien si on clique sur un Input, Bouton ou Select
        // (Sinon impossible de sélectionner du texte sans tout faire disparaître)
        if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(e.target.tagName)) return;

        // ACTION : On bascule la classe .hidden
        dashboard.classList.toggle('hidden');
    });

    // --- MODAL SUGGESTION ---
    const suggestionModal = document.getElementById('suggestion-modal');
    const openBtn = document.getElementById('open-suggestion-modal-btn');
    const closeBtn = document.querySelector('.close-suggestion-btn');
    const sendBtn = document.getElementById('send-suggestion-btn');

    // OUVRIR
    if (openBtn) {
        openBtn.onclick = () => {
            suggestionModal.classList.remove('hidden');
            document.getElementById('suggestion-text').focus();
        };
    }

    // FERMER (Croix)
    if (closeBtn) {
        closeBtn.onclick = () => {
            suggestionModal.classList.add('hidden');
        };
    }

    // FERMER (Clic en dehors)
    window.onclick = (e) => {
        // Si on clique sur le fond gris (overlay), on ferme
        if (e.target === suggestionModal) {
            suggestionModal.classList.add('hidden');
        }
        // (Garde tes autres logiques de fermeture ici si tu en as)
    };

    // ENVOYER
    if (sendBtn) {
        sendBtn.onclick = async () => {
            const textarea = document.getElementById('suggestion-text');
            const text = textarea.value.trim();

            if (!text) return showToast("La suggestion est vide !", "error");

            // Fonction définie plus bas ou importée
            await sendSuggestion(text); 
            
            textarea.value = ""; // Vider
            suggestionModal.classList.add('hidden'); // Fermer
        };
    }

    // --- GESTION INBOX (LECTURE) ---
    const inboxModal = document.getElementById('inbox-modal');
    const openInboxBtn = document.getElementById('open-inbox-btn');
    const closeInboxBtn = document.querySelector('.close-inbox-btn');
    
    // Ouvrir et charger les données
    if (openInboxBtn) {
        openInboxBtn.onclick = () => {
            inboxModal.classList.remove('hidden');
            loadSuggestions(); // <--- On charge la liste
        };
    }

    // Fermer
    if (closeInboxBtn) {
        closeInboxBtn.onclick = () => inboxModal.classList.add('hidden');
    }

    // (Ajoute aussi la fermeture au clic extérieur si tu veux)
});