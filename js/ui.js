import { deleteTask } from './app.js';

let userTags = [];
let allTasksCache = []; // On garde une copie de toutes les tâches
let currentFilter = 'all';
let currentSort = 'date-asc'; // Par défaut : le plus urgent en haut

export function updateTagsState(tags) {
    userTags = tags;
    renderTagSelect();
    renderFilterSelect();
    renderSettingsList();
}

function renderFilterSelect() {
    const select = document.getElementById('filter-tag');
    if (!select) return;
    
    // On garde la valeur actuelle si on rafraîchit
    const currentVal = select.value;
    
    select.innerHTML = '<option value="all">Tout voir</option>';

    userTags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag.name;
        option.textContent = tag.name;
        select.appendChild(option);
    });
    
    if (currentVal) select.value = currentVal;
}

function renderTagSelect() {
    const select = document.getElementById('task-category-select');
    if (!select) return;
    const currentValue = select.value; 
    select.innerHTML = '';
    userTags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag.name;
        option.textContent = tag.name;
        select.appendChild(option);
    });
    if (currentValue) select.value = currentValue;
}

function renderSettingsList() {
    const list = document.getElementById('settings-tags-list');
    if (!list) return;
    list.innerHTML = '';
    userTags.forEach(tag => {
        const div = document.createElement('div');
        div.className = 'tag-item'; 
        div.innerHTML = `
            <div class="userTags">
                <span class="color-dot" style="background-color:${tag.color};"></span>
                <span>${tag.name}</span>
            </div>
        `;
        list.appendChild(div);
    });
}

// --- GESTION DES ECRANS VIA CLASS .HIDDEN ---
export function showLoginScreen() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('dashboard-screen').classList.add('hidden');
}

export function showDashboardScreen() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('dashboard-screen').classList.remove('hidden');
}

export function startClock() {
    if (window.clockInterval) return;
    window.clockInterval = setInterval(() => {
        const now = new Date();
        const el = document.getElementById('clock');
        if(el) el.textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    }, 1000);
}

export function renderTasks(tasks) {
    // 1. Mise à jour du cache seulement si on reçoit de nouvelles données
    if (tasks && Array.isArray(tasks)) {
        allTasksCache = tasks;
    }

    // 2. On travaille sur une copie
    let filteredTasks = [...allTasksCache];

    // 3. A. FILTRAGE
    if (currentFilter !== 'all') {
        filteredTasks = filteredTasks.filter(t => t.category === currentFilter);
    }

    // 3. B. TRI (La partie critique)
    filteredTasks.sort((a, b) => {
        // --- CAS 1 : Tri par "Récents" (basé sur l'ID ou createdAt) ---
        if (currentSort === 'recent') {
            // Sécurité : si pas de date de création, on prend l'ID
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA; // Plus grand (récent) en premier
        } 
        
        // --- CAS 2 : Tri par Date Limite (Urgent / Pas Urgent) ---
        else if (currentSort === 'date-asc' || currentSort === 'date-desc') {
            // A. Gestion des sans-dates : On les met TOUJOURS à la fin
            // Si A n'a pas de date, il part au fond (return 1)
            if (!a.dueDate) return 1;
            // Si B n'a pas de date, il part au fond (return -1) -> A passe devant
            if (!b.dueDate) return -1;

            // B. Conversion en nombres (Timestamp) pour éviter les bugs
            const timeA = new Date(a.dueDate).getTime();
            const timeB = new Date(b.dueDate).getTime();

            // C. Sécurité ultime : Si la date est invalide (NaN), on la traite comme null
            if (isNaN(timeA)) return 1;
            if (isNaN(timeB)) return -1;

            // D. Le calcul final
            if (currentSort === 'date-asc') {
                return timeA - timeB; // Urgent (petit chiffre) en premier
            } else {
                return timeB - timeA; // Loin (grand chiffre) en premier
            }
        }
        return 0;
    });

    // 4. Affichage
    const taskList = document.getElementById('task-list');
    if (!taskList) return; // Sécurité si le HTML n'est pas chargé
    
    taskList.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        // Petit message sympa si rien ne matche
        taskList.innerHTML = '<li style="text-align:center; padding:20px; color:#666;">Aucune tâche trouvée 🧐</li>';
    } else {
        filteredTasks.forEach(task => appendTaskToUI(task));
    }
}

export function setTaskFilters(filter, sort) {
    if (filter !== null) currentFilter = filter;
    if (sort !== null) currentSort = sort;
    renderTasks(); // On relance le rendu avec les données en cache
}

export function appendTaskToUI(task) {
    const taskList = document.getElementById('task-list');
    if (document.getElementById(`task-${task._id}`)) return;

    const li = document.createElement('li');
    li.id = `task-${task._id}`;
    
    // Couleur dynamique (seule chose qui reste en JS car variable)
    const tagConfig = userTags.find(t => t.name === task.category);
    const color = tagConfig ? tagConfig.color : '#888'; 
    li.style.borderLeftColor = color; // On change juste la couleur de bordure

    // Gestion date
    let dateHtml = '';
    if (task.dueDate) {
        const d = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0,0,0,0);
        const isLate = d < today;
        
        // On utilise les classes CSS .date-late
        const badgeClass = isLate ? 'date-late' : '';
        const icon = isLate ? '⚠️' : '📅';
        const dateStyle = isLate ? '' : 'color: #aaaaaa;';
        
        dateHtml = `<small class="${badgeClass}" style="${dateStyle} font-size:0.75rem;">
            ${icon} ${d.toLocaleDateString()}
        </small>`;
    }

    // Structure HTML propre avec classes
    li.innerHTML = `
        <div class="task-content">
            <span class="task-text">${task.text}</span>
            <div class="task-meta">
                <span class="task-tag" style="background:${color}33; color:${color};">
                    ${task.category || 'Général'}
                </span>
                ${dateHtml}
            </div>
        </div>
    `;

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = "✕";
    deleteBtn.className = "delete-btn"; // Le style est dans le CSS
    deleteBtn.onclick = () => deleteTask(task._id);

    li.appendChild(deleteBtn);
    taskList.appendChild(li);
}

export function removeTaskFromUI(taskId) {
    const el = document.getElementById(`task-${taskId}`);
    if (el) el.remove();
}

export function setWeatherLoading() {
    const el = document.getElementById('weather-display');
    if (el) el.textContent = "Localisation en cours...";
}

export function setWeatherError(message) {
    const el = document.getElementById('weather-display');
    if (el) el.textContent = message;
    document.body.style.backgroundColor = "#121212";
}

export function updateBackgroundUI(imageUrl) {
    if (imageUrl) document.body.style.backgroundImage = `url('${imageUrl}')`;
}

export function updateWeatherUI(data) {
    const weatherDisplay = document.getElementById('weather-display');
    if (!weatherDisplay) return;

    weatherDisplay.innerHTML = `
        <div style="font-size: 0.9rem; color: #888; margin-bottom: 5px;">
            Position : ${data.lat}, ${data.lon}
        </div>
        <div style="font-size: 2.5rem; font-weight: bold;">
            ${data.temp}°C
        </div>
        <div style="font-size: 1rem; color: #aaa;">
            Vent: ${data.windSpeed} km/h (${data.windDirection})
        </div>
        <div style="color: #aaa;">
            Temps : ${data.description}
        </div>
    `;
}

// --- SYSTÈME DE NOTIFICATIONS (TOASTS) ---

export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // 1. Création de l'élément
    const toast = document.createElement('div');
    toast.className = `toast ${type}`; // ex: "toast success"
    
    // 2. Choix de l'icône
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';

    // 3. Contenu HTML
    toast.innerHTML = `
        <span style="font-size: 1.2rem;">${icon}</span>
        <span>${message}</span>
    `;

    // 4. Ajout au DOM
    container.appendChild(toast);

    // 5. Suppression Automatique (Timer)
    setTimeout(() => {
        // Animation de sortie avant de supprimer
        toast.style.animation = "fadeOutToast 0.5s forwards";
        
        // On attend la fin de l'animation pour le retirer du HTML
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3000); // Disparaît après 3 secondes
}