import { SOCKET_URL, getToken } from './config.js';
import { appendTaskToUI, removeTaskFromUI, updateTaskInUI, showToast } from './ui.js';

let socket;

export function initSocket() {
    // On initialise la connexion
    socket = io(SOCKET_URL, { transports: ['websocket'] });

    socket.on('connect', () => console.log("Socket Connecté"));

    // ÉCOUTE AJOUT
    socket.on('taskAdded', (newTask) => {
        const token = getToken();
        if (!token) return;
        
        // On décode le token pour savoir si c'est NOTRE tâche
        // (C'est un peu brut, mais ça marche pour l'instant)
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        if (newTask.owner === payload._id) {
            appendTaskToUI(newTask);
        }
    });

    // ÉCOUTE SUPPRESSION
    socket.on('taskDeleted', (taskId) => {
        removeTaskFromUI(taskId);
    });

    // --- NOUVEAU : ECOUTE MODIFICATION ---
    socket.on('taskUpdated', (updatedTask) => {
        // Pas besoin de vérifier le token : si la tâche est dans ton HTML (getElementById),
        // c'est qu'elle t'appartient, donc on la met à jour.
        updateTaskInUI(updatedTask);
    });

    socket.on('newSuggestion', (data) => {
        // Affiche un toast spécial
        // Tu peux importer showToast de ui.js
        showToast(`💡 Nouvelle idée de ${data.author} : "${data.text}"`, "info");
    });
}