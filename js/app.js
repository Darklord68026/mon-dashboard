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

// Fonction pour ajouter une tâche
function addTask() {
    // 1. Récupérer la valeur écrite par l'utilisateur
    const taskText = taskInput.value;

    // 2. Validation : On ne fait rien si le champ est vide
    if (taskText === "") {
        alert("Attention : La tâche ne peut pas être vide !");
        return; // On arrête la fonction ici
    }

    // 3. Création des éléments HTML (li + bouton supprimer)
    const li = document.createElement('li');
    li.style.display = "flex"; // Un peu de CSS via JS (juste pour l'alignement)
    li.style.justifyContent = "space-between";
    li.style.marginBottom = "10px";

    const span = document.createElement('span');
    span.textContent = taskText;

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = "X";
    deleteBtn.style.backgroundColor = "#ff6b6b"; // Rouge pour supprimer
    deleteBtn.style.marginLeft = "10px";

    // 4. Ajouter l'événement "Supprimer" sur ce boutton spécifique
    deleteBtn.addEventListener('click', function() {
        taskList.removeChild(li);
    });

    // 5. Assemblage : on met le texte et le bouton dans le <li>
    li.appendChild(span);
    li.appendChild(deleteBtn);

    // 6. On ajoute le tout à la liste principale (<ul>)
    taskList.appendChild(li);

    // 7. On vide le champ de texte pour la prochaine tâche
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