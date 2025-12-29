import { deleteTask } from './app.js'; // On aura besoin de rappeler le chef pour supprimer

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

    tasks.forEach(task => {
        appendTaskToUI(task);
    });
}

export function appendTaskToUI(task) {
    const taskList = document.getElementById('task-list');
    
    // Évite les doublons si Socket envoie une info qu'on a déjà
    if (document.getElementById(`task-${task._id}`)) return;

    const li = document.createElement('li');
    li.id = `task-${task._id}`;
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignContent = "center";
    li.style.background = "#2c2c2c";
    li.style.padding = "10px";
    li.style.marginBottom = "5px";

    const span = document.createElement('span');
    span.textContent = task.text;

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = "X";
    deleteBtn.style.marginLeft = "10px";
    deleteBtn.style.backgroundColor = "red";
    deleteBtn.style.color = "#ffffff";
    
    // Quand on clique, on appelle la fonction globale de suppression
    deleteBtn.onclick = () => deleteTask(task._id);

    li.appendChild(span);
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
    document.body.style.backgroundColor = "#121212"; // Fond de secours
}

export function updateBackgroundUI(imageUrl) {
    if (imageUrl) {
        document.body.style.backgroundImage = `url('${imageUrl}')`;
        // Petite transition douce si tu as mis le CSS que je t'ai donné avant
    }
}

export function updateWeatherUI(data) {
    const weatherDisplay = document.getElementById('weather-display');
    if (!weatherDisplay) return;

    // On injecte le HTML proprement
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