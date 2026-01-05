import { deleteTask } from './app.js';

let userTags = [];

export function updateTagsState(tags) {
    userTags = tags;
    renderTagSelect();
    renderSettingsList();
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
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';
    tasks.forEach(task => appendTaskToUI(task));
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