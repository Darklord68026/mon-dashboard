// --- CONFIGURATION ---
// On regarde si on est sur le PC en local (dev) ou sur le serveur (prod)
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:3000/api'  // Cas LOCAL : On vise le port 3000
    : '/api';                      // Cas PROD (DuckDNS) : On utilise le chemin relatif

console.log("🔗 URL de l'API :", API_URL); // Regarde ta console pour vérifier !

let token = localStorage.getItem('token');

// --- 1. GESTION DE L'AFFICHAGE (Login vs Dashboard) ---

function checkAuth() {
    if (token) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard-screen').style.display = 'block';
        loadTasks(); // On charge les tâches depuis le serveur
        // On lance l'horloge (si elle n'est pas déjà lancée)
        if (!window.clockInterval) startClock();
    } else {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('dashboard-screen').style.display = 'none';
    }
}

function logout() {
    localStorage.removeItem('token');
    token = null;
    checkAuth();
}

// --- 2. AUTHENTIFICATION (Login / Register) ---

async function login() {
    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;
    const errorMsg = document.getElementById('auth-error');

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: usernameInput, password: passwordInput })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        // SUCCÈS : On sauvegarde le token
        token = data.token;
        localStorage.setItem('token', token);
        errorMsg.textContent = "";
        checkAuth();

    } catch (err) {
        errorMsg.textContent = err.message;
    }
}

async function register() {
    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;
    const errorMsg = document.getElementById('auth-error');

    try {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: usernameInput, password: passwordInput })
        });
        
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error);
        }

        alert("Compte créé ! Connectez-vous maintenant.");
        // Optionnel : on pourrait connecteur l'user directement
    } catch (err) {
        errorMsg.textContent = err.message;
    }
}

// --- 3. GESTION DES TÂCHES (CRUD via API) ---

async function loadTasks() {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '<li style="text-align:center">Chargement...</li>';

    try {
        // L'APPEL GET AVEC LE TOKEN
        const res = await fetch(`${API_URL}/tasks`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.status === 401) { logout(); return; } // Token expiré

        const tasks = await res.json();
        renderTasks(tasks);

    } catch (err) {
        console.error("Erreur chargement tâches", err);
        taskList.innerHTML = '<li>Erreur de connexion</li>';
    }
}

function renderTasks(tasks) {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.marginBottom = "10px";
        li.style.padding = "10px";
        li.style.background = "#2c2c2c";
        li.style.borderRadius = "5px";

        const span = document.createElement('span');
        span.textContent = task.text;

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = "X";
        deleteBtn.style.backgroundColor = "#ff6b6b";
        deleteBtn.style.marginLeft = "10px";
        deleteBtn.style.padding = "5px 10px";
        deleteBtn.style.fontSize = "0.8rem";

        deleteBtn.onclick = () => deleteTask(task._id); // On utilise l'ID MongoDB (_id)

        li.appendChild(span);
        li.appendChild(deleteBtn);
        taskList.appendChild(li);
    });
}

async function addTask() {
    const taskInput = document.getElementById('task-input');
    const text = taskInput.value;
    if (!text) return;

    try {
        const res = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ text: text })
        });

        if (res.ok) {
            taskInput.value = "";
            loadTasks(); // On recharge la liste pour voir la nouvelle tâche
        }
    } catch (err) {
        console.error(err);
    }
}

async function deleteTask(id) {
    if(!confirm("Supprimer cette tâche ?")) return;
    
    try {
        await fetch(`${API_URL}/tasks/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        loadTasks();
    } catch (err) {
        console.error(err);
    }
}

// --- 4. HORLOGE (Copié de ton ancien code) ---
function startClock() {
    window.clockInterval = setInterval(() => {
        const now = new Date();
        const el = document.getElementById('clock');
        if(el) el.textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    }, 1000);
}

// --- INITIALISATION ---
document.getElementById('add-task-btn').addEventListener('click', addTask);
document.getElementById('task-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

// Au lancement, on vérifie si on est déjà connecté
checkAuth();