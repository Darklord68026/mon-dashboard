let userTags = [];
let allTasksCache = []; // On garde une copie de toutes les tâches
let currentFilter = 'all';
let currentSort = 'date-asc'; // Par défaut : le plus urgent en haut

export function updateTagsState(tags) {
    userTags = tags || [];
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
        const els = document.getElementById('clock-seconds')
        if(el) el.textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        if (els) els.textContent = `${String(now.getSeconds()).padStart(2,'0')}`;
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

    // 3. B. TRI ROBUSTE
    filteredTasks.sort((a, b) => {
        // --- CAS 1 : Tri par "Récents" (Date de création) ---
        if (currentSort === 'recent') {
            // On utilise createdAt. Si pas dispo, on fallback sur 0
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            // Le plus grand (le plus récent) en premier
            return dateB - dateA;
        } 
        
        // --- CAS 2 : Tri par Date Limite (Urgent) ---
        if (currentSort === 'date-asc' || currentSort === 'date-desc') {
            // On convertit en Timestamp (nombre) ou en null
            const timeA = a.dueDate ? new Date(a.dueDate).getTime() : null;
            const timeB = b.dueDate ? new Date(b.dueDate).getTime() : null;

            // GESTION DES TÂCHES SANS DATE (Elles vont toujours à la fin)
            if (!timeA && !timeB) return 0; // Les deux n'ont pas de date -> on touche pas
            if (!timeA) return 1;  // A n'a pas de date -> A va à la fin
            if (!timeB) return -1; // B n'a pas de date -> B va à la fin

            // Comparaison classique des nombres
            if (currentSort === 'date-asc') {
                return timeA - timeB; // Petit chiffre (vieux/urgent) en premier
            } else {
                return timeB - timeA; // Grand chiffre (loin) en premier
            }
        }
        return 0; // Par défaut
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
        initDragAndDrop();
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

    // --- CONTENEUR BOUTONS (Pour les aligner à droite) ---
    const actionsDiv = document.createElement('div');
    actionsDiv.className = "task-actions"; // On crée une classe pour le CSS
    
    // 1. Bouton EDITER
    const editBtn = document.createElement('button');
    editBtn.textContent = "✏️"; // Emoji crayon
    editBtn.className = "edit-btn"; // Classe CSS
    // On passe l'ID ET le texte actuel pour le pré-remplir dans le prompt
    editBtn.onclick = () => window.editTask(task._id, task.text);

    // 2. Bouton SUPPRIMER (Ton code existant)
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = "✕";
    deleteBtn.className = "delete-btn";
    deleteBtn.onclick = () => window.deleteTask(task._id);

    // On met les deux boutons dans la boite
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    // On ajoute la boite au LI
    li.appendChild(actionsDiv);
    taskList.appendChild(li);
}

export function removeTaskFromUI(taskId) {
    const el = document.getElementById(`task-${taskId}`);
    if (el) el.remove();
    allTasksCache = allTasksCache.filter(t => t._id !== taskId);
    if (allTasksCache.length === 0) {
        const list = document.getElementById('task-list');
        if (list) list.innerHTML = '<li style="text-align:center; padding:20px; color:#666;">Aucune tâche trouvée 🧐</li>';
    }
}

export function updateTaskInUI(updatedTask) {
    // 1. On cherche l'élément HTML de la tâche par son ID
    const li = document.getElementById(`task-${updatedTask._id}`);
    
    // Si elle n'est pas affichée (ex: on est sur un autre filtre), on ne fait rien
    if (!li) return;

    // 2. On met à jour le texte
    const textSpan = li.querySelector('.task-text');
    if (textSpan) {
        textSpan.textContent = updatedTask.text;
    }

    // 3. Petit effet visuel "Flash" pour montrer que ça a changé ✨
    // On change la couleur de fond brièvement
    const originalTransition = li.style.transition;
    li.style.transition = "background-color 0.5s ease";
    li.style.backgroundColor = "#334e68"; // Un bleu gris léger
    
    setTimeout(() => {
        li.style.backgroundColor = ""; // On revient à la couleur normale
        setTimeout(() => {
            li.style.transition = originalTransition; // On remet la transition d'origine
        }, 500);
    }, 500);
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

export function hide() {
    document.getElementById('sidebar')?.classList.add('hidden');
    document.getElementById('chat-modal')?.classList.add('hidden');
    document.getElementById('settings-modal')?.classList.add('hidden');
    document.getElementById('suggestion-modal')?.classList.add('hidden');
    document.getElementById('inbox-modal')?.classList.add('hidden');
    document.getElementById('game-overlay')?.classList.add('hidden');
}

// Ajoute ça tout à la fin de ui.js
function initDragAndDrop() {
    const el = document.getElementById('task-list');
    if (!el) return;

    // Si on a déjà activé Sortable, on ne le refait pas
    if (el.classList.contains('sortable-active')) return;

    new Sortable(el, {
        animation: 150, // Animation fluide (ms)
        ghostClass: 'sortable-ghost', // Classe de l'élément en cours de déplacement
        onEnd: function (evt) {
            // C'est ici qu'on enverrait le nouvel ordre au serveur
            // Pour l'instant, c'est juste visuel
            console.log("Nouvel ordre !", evt.oldIndex, "->", evt.newIndex);
        },
    });
    
    el.classList.add('sortable-active');
}