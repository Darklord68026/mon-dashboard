import { apiCall } from './api.js';
import { showToast } from './ui.js';

let currentUserId = null;
let currentContactId = 'general';
let unreadCount = 0;

export async function initChat(userId) {
    currentUserId = userId;

    // 1. Charger la liste des utilisateurs pour le select
    await loadUsersList();

    // 2. Gestion Ouverture via Sidebar
    const openBtn = document.getElementById('open-chat-sidebar-btn');
    const modal = document.getElementById('chat-modal');
    const closeBtn = document.getElementById('close-chat-btn');
    const badge = document.getElementById('chat-notification-badge');   
    const overlay = modal; // Le modal lui-même sert d'overlay

    if (openBtn) {
        openBtn.onclick = () => {
            modal.classList.remove('hidden');
            loadMessages(); // Charger les messages à l'ouverture
            scrollToBottom();

            // 🔥 REMISE À ZÉRO DU BADGE
            unreadCount = 0;
            if (badge) {
                badge.textContent = '0';
                badge.classList.add('hidden');
            }
        };
    }

    // Fermeture (Bouton Croix)
    if (closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');

    // Fermeture (Clic dehors)
    window.onclick = (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    };

    // 3. Changement de contact (Général <-> Privé)
    const select = document.getElementById('chat-contact-select');
    if (select) {
        select.onchange = (e) => {
            currentContactId = e.target.value;
            loadMessages(); // Recharger la bonne conversation
        };
    }

    // 4. Envoi de message
    const sendBtn = document.getElementById('send-chat-btn');
    const input = document.getElementById('chat-input');

    if (sendBtn) sendBtn.onclick = sendMessage;
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
}

export function handleIncomingMessage(msg) {
    console.log("📨 Message reçu dans le gestionnaire !", msg); // Debug 1

    const modal = document.getElementById('chat-modal');
    const badge = document.getElementById('chat-notification-badge');
    if (!badge) console.error("❌ ERREUR : Impossible de trouver le badge HTML (ID 'chat-notification-badge')"); // debug 2

    // 1. Est-ce que le message vient de MOI ? Si oui, on ignore les notifs
    // (Gère le cas où msg.sender est peuplé ou juste un ID)
    const senderId = msg.sender._id || msg.sender;
    if (senderId === currentUserId) {
        // On l'ajoute juste à l'UI si on est sur la bonne conv
        addMessageToUI(msg);
        return;
    }

    // 2. Est-ce que le chat est FERMÉ ?
    const isChatClosed = modal.classList.contains('hidden');
    console.log("🔒 Chat fermé ?", isChatClosed); // Debug 4
    // 3. Est-ce que je regarde une AUTRE conversation ?
    // (Ex: Je suis sur Général, et Paul m'écrit en privé)
    let isOtherConv = false;
    if (currentContactId === 'general' && msg.receiver !== null) isOtherConv = true;
    if (currentContactId !== 'general') {
        // Si le message ne concerne pas ma conv active
        const isRelated = (msg.sender === currentContactId || msg.sender._id === currentContactId);
        if (!isRelated) isOtherConv = true;
    }

    // --- DÉCISION : NOTIFICATION OU PAS ? ---
    if (isChatClosed || isOtherConv) {
        console.log("🔔 DÉCISION : ON SONNE !"); // Debug 5
        // A. ON NOTIFIE
        
        // 1. Toast
        showToast(`💬 Nouveau message de ${msg.senderName}`, "info");
        
        // 2. Son (Optionnel, petit "pop")
        // const audio = new Audio('notification.mp3'); audio.play();

        // 3. Badge +1
        unreadCount++;
        if (badge) {
            badge.textContent = unreadCount;
            badge.classList.remove('hidden');
        }
    } else {
        // B. ON AFFICHE DIRECTEMENT (Car on est sur la bonne conv)
        addMessageToUI(msg);
    }
}

async function loadUsersList() {
    const select = document.getElementById('chat-contact-select');
    if (!select) return;

    // Sauvegarde la sélection actuelle
    const savedValue = select.value;

    // Reset avec l'option Général
    select.innerHTML = '<option value="general">🌍 Général</option>';

    // Appel API pour avoir tous les utilisateurs
    const users = await apiCall('/user/all'); 
    
    if (users) {
        users.forEach(u => {
            // On ne s'affiche pas soi-même dans la liste
            if (u._id !== currentUserId) {
                const option = document.createElement('option');
                option.value = u._id;
                option.textContent = `👤 ${u.username}`;
                select.appendChild(option);
            }
        });
    }

    // Restaure la sélection (si elle existe encore)
    select.value = savedValue;
}

async function loadMessages() {
    const list = document.getElementById('chat-messages-list');
    list.innerHTML = '<li style="text-align:center; color:#666;">Chargement...</li>';

    const messages = await apiCall(`/chat?contactId=${currentContactId}`);
    
    list.innerHTML = ""; // Vider

    if (messages && messages.length > 0) {
        messages.forEach(msg => addMessageToUI(msg));
        scrollToBottom();
    } else {
        list.innerHTML = '<li style="text-align:center; color:#666; margin-top:20px;">Aucun message ici 🦗</li>';
    }
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    // On envoie
    const res = await apiCall('/chat', 'POST', { 
        text, 
        receiverId: currentContactId 
    });
    
    if (res) {
        input.value = "";
        input.focus();
    }
}

export function addMessageToUI(msg) {
    // --- FILTRE DE SÉCURITÉ VISUELLE ---
    // Si le message reçu par le socket ne concerne pas la conversation active, on l'ignore.
    
    // Cas 1 : Je suis sur "Général"
    if (currentContactId === 'general') {
        if (msg.receiver !== null) return; // Ignore les messages privés
    }
    // Cas 2 : Je suis en Privé
    else {
        if (msg.receiver === null) return; // Ignore les messages généraux
        
        // Le message doit être (Moi -> Lui) ou (Lui -> Moi)
        const isRelated = (msg.sender === currentContactId || msg.receiver === currentContactId) 
                          || (msg.sender === currentUserId && msg.receiver === currentContactId);
        
        if (!isRelated) return;
    }

    // Nettoyage du message "Aucun message" si c'est le premier
    const list = document.getElementById('chat-messages-list');
    if (list.children.length > 0 && list.children[0].innerText.includes('Aucun message')) {
        list.innerHTML = "";
    }

    const li = document.createElement('li');
    // Est-ce moi qui ai envoyé ?
    // msg.sender peut être un objet (peuplé) ou un ID (string), on gère les deux cas
    const senderId = msg.sender._id || msg.sender;
    const isMe = (senderId === currentUserId);
    
    li.className = `chat-msg ${isMe ? 'sent' : 'received'}`;
    
    li.innerHTML = `
        <span class="chat-sender-name">${msg.senderName || 'Anonyme'}</span>
        <span>${msg.text}</span>
    `;

    list.appendChild(li);
    scrollToBottom();
}

function scrollToBottom() {
    const list = document.getElementById('chat-messages-list');
    // Petit délai pour laisser le temps au DOM de s'afficher
    setTimeout(() => {
        list.scrollTop = list.scrollHeight;
    }, 50);
}