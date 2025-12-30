import { deleteTask } from './app.js';

// --- MÉMOIRE LOCALE DES TAGS ---
let userTags = []; // On stocke les tags ici pour connaitre les couleurs

export function updateTagsState(tags) {
    userTags = tags;
    renderTagSelect();      // Met à jour le menu déroulant "Nouvelle tâche"
    renderSettingsList();   // Met à jour la liste dans les Paramètres
}

// --- GESTION DES MENUS ---

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
        div.className = 'tag-item'; // Assure-toi d'avoir le CSS
        div.innerHTML = `
            <div style="display:flex; align-items:center;">
                <span class="color-dot" style="background-color:${tag.color}; width:15px; height:15px; border-radius:50%; margin-right:10px;"></span>
                <span>${tag.name}</span>
            </div>
        `;
        list.appendChild(div);
    });
}

// --- FONCTIONS EXISTANTES ---

export function showLoginScreen() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('dashboard-screen').style.display = 'none';
}

export function showDashboardScreen() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('dashboard-screen').style.display = 'block';
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
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';
    tasks.forEach(task => appendTaskToUI(task));
}

// --- LA GROSSE MISE À JOUR VISUELLE ---
export function appendTaskToUI(task) {
    const taskList = document.getElementById('task-list');
    if (document.getElementById(`task-${task._id}`)) return;

    const li = document.createElement('li');
    li.id = `task-${task._id}`;
    
    // 1. On cherche la couleur du tag
    const tagConfig = userTags.find(t => t.name === task.category);
    const color = tagConfig ? tagConfig.color : '#888'; // Gris par défaut

// 2. Gestion de la Date (Modifié pour clignoter)
    let dateHtml = '';
    if (task.dueDate) {
        const d = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0,0,0,0); // On remet les heures à zéro pour comparer juste les jours
        
        const isLate = d < today; // Est-ce que c'est passé ?
        
        // Si c'est en retard, on ajoute la classe CSS 'date-late'
        // Sinon, on met juste une couleur grise standard
        const cssClass = isLate ? 'date-late' : '';
        const colorStyle = isLate ? '' : 'color: #aaaaaa;'; // Le rouge est géré par la classe CSS
        
        // On insère la variable cssClass dans le HTML
        dateHtml = `<small class="${cssClass}" style="${colorStyle} display:block; font-size:0.75rem; margin-top:4px;">
            ${isLate ? '⚠️' : '📅'} ${d.toLocaleDateString()}
        </small>`;
    }

    // 3. Style CSS dynamique
    li.style.cssText = `
        display: flex; 
        justify-content: space-between; 
        align-items: center;
        background: #2c2c2c; 
        padding: 12px; 
        margin-bottom: 8px; 
        border-radius: 8px;
        box-shadow: 0 4px rgba(0,0,0,0.3);
        border-left: 6px solid ${color}; /* La barre de couleur ! */
    `;

    // 4. Contenu HTML
    li.innerHTML = `
        <div style="flex-grow:1;">
            <span style="font-weight:500; font-size:1rem;">${task.text}</span>
            <div style="display:flex; gap:10px; align-items:center; margin-top:5px;">
                <span style="background:${color}33; color:${color}; padding:2px 8px; border-radius:10px; font-size:0.7rem; font-weight:bold;">
                    ${task.category || 'Général'}
                </span>
                ${dateHtml}
            </div>
        </div>
    `;

    // 5. Bouton Supprimer
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = "✕";
    deleteBtn.style.cssText = "background:transparent; border:none; color:#666; font-size:1.2rem; cursor:pointer; padding:5px;";
    
    // Effet hover simple en JS
    deleteBtn.onmouseover = () => deleteBtn.style.color = "red";
    deleteBtn.onmouseout = () => deleteBtn.style.color = "#666";
    
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