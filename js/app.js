// --- 1. Gestion de l'horloge ---
function updateClock() {
    // On crée un nouvel objet Date (qui contient la date/heure actuelle)
    const now = new Date();

    // On extrait les heures et les minutes
    // String(number).padStart(2, '0') permet d'avoir "09" au lieu de "9"
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    // On sélectionne l'élément HTML et on change son texte
    const clockElement = document.getElementById('clock');
    clockElement.textContent = `${hours}:${minutes}`;
}

// On lance la fonction une première fois tout de suite
updateClock();

// On demande au navigateur de relancer cette fonction toutes les 1000ms (1s)
setInterval(updateClock(), 1000);

// --- 2. Gestion des Tâches ---

// On sélectionne nos éléments HTML une seule fois au début (pour la perofrmance)
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-button');
const taskList = document.getElementById('task-list');

// Notre "État" : On essaie de récupérer les taĉhes sauvegardées, sinon on part d'une liste cide
let tasks = JSON.parse(localStorage.getItem('myTasks')) || [];

// Fonction pour sauvegarder dans le navigateur
function saveToLocalStorage() {
    localStorage.setItem('myTasks', JSON.stringify(tasks));
}

// Fonction pour afficher (Rendre) la liste à l'écran
function renderTasks() {
    // On vide la liste actuelle pour éviter des doublons
    taskList.innerHTML = '';

    // Pour chaque taĉhe dans notre tableau...
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.style.display = "flex";
        li.style.justifyContent = "sapce-between";
        li.style.marginBottom = "10px";

        const span = document.createElement('span');
        span.style.alignContent = "center";
        span.style.padding = "5px";
        span.textContent = task;

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = "X";
        deleteBtn.style.backgroundColor = "#ff6b6b";
        deleteBtn.style.marginLeft = "10px";
        deleteBtn.style.borderRadius = "5px";
        deleteBtn.style.padding = "10px 15px";

        // Quand on clique sur supprimer
        deleteBtn.addEventListener('click', () => {
            // 1. On enlève la tâche du tableau (de l'État)
            tasks.splice(index, 1);

            // 2. On sauvegarde le nouvel état
            saveToLocalStorage();

            // 3. On réaffiche la liste à jour
            renderTasks();
        });

        li.appendChild(span);
        li.appendChild(deleteBtn);
        taskList.appendChild(li);
    });
}

// Fonction pour ajouter une tâche
function addTask() {
    const taskText = taskInput.value;
    if (taskText === "") return;

    // 1. On ajoute au tableau (l'État)
    tasks.push(taskText);

    // 2. On sauvegarde
    saveToLocalStorage();

    // 3. On affiche
    renderTasks();

    taskInput.value = "";
}

// --- Écouteurs d'événements ---

// Quand on clique sur le bouton "Ajouter"
addTaskBtn.addEventListener('click', addTask);

// Bonus : Quand on appuie sur "Entrée" dans le champ de texte
taskInput.addEventListener('keypress', function(event)
{
    if (event.key === 'Enter') {
        addTask();
    }
});

// Au lancemen de la page, on affiche les taĉhes sauvegardées
renderTasks();