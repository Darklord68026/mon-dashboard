// js/app.js

// --- CONFIGURATION ---
// On regarde si on est sur le PC en local (dev) ou sur le serveur (prod)
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:3000/api'
    : '/api';

// --- CONFIG SOCKET.IO ---
const SOCKET_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:3000'
    : window.location.origin; // Plus fiable pour la prod

const socket = io(SOCKET_URL);

let token = localStorage.getItem('token');

socket.on('connect', () => {
    console.log("🟢 Connecté au serveur Temps Réel !");
});

// --- ÉCOUTE DES ÉVÉNEMENTS SOCKET ---

// 1. Quand une tâche est ajoutée
socket.on('taskAdded', (newTask) => {
    if (!token) return;
    
    // On vérifie si la tâche nous appartient
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (newTask.owner === payload._id) {
            console.log("⚡ Nouvelle tâche reçue !");
            appendTaskToUI(newTask); // On l'ajoute sans recharger
        }
    } catch (e) {
        console.error("Erreur lecture token socket", e);
    }
});

// 2. Quand une tâche est supprimée
socket.on('taskDeleted', (idRecu) => {
    console.log("⚡ Suppression reçue pour l'ID :", idRecu);
    const element = document.getElementById(`task-${idRecu}`);
    if (element) {
        element.remove();
    } else {
        // Sécurité : si on ne trouve pas l'élément, on recharge tout
        loadTasks();
    }
});


// --- GESTION DE L'INTERFACE ---

function checkAuth() {
    if (token) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard-screen').style.display = 'block';
        loadTasks();
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

// --- AUTHENTIFICATION ---

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
    } catch (err) {
        errorMsg.textContent = err.message;
    }
}

// --- TÂCHES (CRUD) ---

async function loadTasks() {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '<li style="text-align:center">Chargement...</li>';

    try {
        const res = await fetch(`${API_URL}/tasks`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.status === 401) { logout(); return; }

        const tasks = await res.json();
        taskList.innerHTML = ''; // On vide "Chargement..."
        
        // On affiche chaque tâche
        tasks.forEach(task => appendTaskToUI(task));

    } catch (err) {
        console.error("Erreur chargement", err);
        taskList.innerHTML = '<li>Erreur de connexion</li>';
    }
}

// Nouvelle fonction pour ajouter UNE SEULE tâche au HTML
// (Utilisée par loadTasks ET par le Socket)
function appendTaskToUI(task) {
    const taskList = document.getElementById('task-list');

    // Vérifie si la tâche est déjà affichée pour éviter les doublons
    if (document.getElementById(`task-${task._id}`)) return;

    const li = document.createElement('li');
    // C'EST ICI QUE TU AVAIS L'ERREUR : on utilise task._id
    li.id = `task-${task._id}`;
    
    // Style CSS direct (tu pourrais le mettre dans style.css)
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
    deleteBtn.style.cursor = "pointer";
    deleteBtn.style.border = "none";
    deleteBtn.style.borderRadius = "3px";
    deleteBtn.style.color = "white";

    deleteBtn.onclick = () => deleteTask(task._id);

    li.appendChild(span);
    li.appendChild(deleteBtn);
    
    // On ajoute la tâche tout en haut de la liste
    taskList.prepend(li);
}

// Anciennement renderTasks (maintenant remplacé par appendTaskToUI utilisé dans la boucle)
function renderTasks(tasks) {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';
    tasks.forEach(task => appendTaskToUI(task));
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
            // On ne recharge PAS loadTasks() ici, car le Socket va le faire !
            // Cela évite d'avoir la tâche en double (une fois par fetch, une fois par socket)
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
        // On ne recharge PAS loadTasks() ici, le Socket s'occupe de supprimer la ligne
    } catch (err) {
        console.error(err);
    }
}

// --- HORLOGE ---
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

checkAuth();