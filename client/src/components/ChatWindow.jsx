import { useEffect, useState, useRef } from 'react';
import { apiCall } from '../utils/api';

export default function ChatWindow({ isOpen, onClose, user, socket, onReadMessages }) {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [contacts, setContacts] = useState([]);
    const [currentContactId, setCurrentContactId] = useState('general');
    const messagesEndRef = useRef(null); // Pour le scroll automatique

    // 1. Charger les contacts au montage
    useEffect(() => {
        async function loadContacts() {
            const users = await apiCall('/user/all');
            if (users) {
                // On s'enlève soi-même de la liste
                setContacts(users.filter(u => u._id !== user._id));
            }
        }
        if (isOpen) loadContacts();
    }, [isOpen, user._id]);

    // 2. Charger les messages quand on change de contact ou qu'on ouvre
    useEffect(() => {
        if (!isOpen) return;

        async function loadMessages() {
            const msgs = await apiCall(`/chat?contactId=${currentContactId}`);
            if (msgs) setMessages(msgs);
            scrollToBottom();
            if (currentContactId !== 'general') {
                await apiCall('/chat/read', 'PUT', { contactId: currentContactId });
                // On dit au parent (Dashboard) de décrémenter le badge rouge si besoin
                // (Mais pour faire simple, on peut juste le remettre à 0 ou recharger le count)
                if (onReadMessages) onReadMessages(); 
            }
        }
        loadMessages();
    }, [isOpen, currentContactId]);

    // 3. Écouter les nouveaux messages via Socket
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (msg) => {
            // Logique de filtrage (Similaire à ton ancien chat.js)
            // Est-ce que ce message concerne la conversation actuelle ?
            
            const isGeneral = currentContactId === 'general' && !msg.receiver;
            const isPrivateRelated = 
                (msg.sender === currentContactId || msg.receiver === currentContactId) || 
                (msg.sender === user._id && msg.receiver === currentContactId);

            if (isGeneral || isPrivateRelated) {
                // Si l'auteur est un objet peuplé ou un ID, on normalise pour éviter les bugs
                const normalizedMsg = {
                    ...msg,
                    sender: typeof msg.sender === 'object' ? msg.sender._id : msg.sender
                };
                setMessages(prev => [...prev, normalizedMsg]);
                scrollToBottom();
            }
        };

        socket.on('chatMessage', handleNewMessage);

        return () => socket.off('chatMessage', handleNewMessage);
    }, [socket, currentContactId, user._id]);

    // Scroll automatique en bas
    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        const payload = {
            text,
            receiverId: currentContactId
        };

        // On envoie à l'API (qui va diffuser via Socket)
        await apiCall('/chat', 'POST', payload);
        setText('');
    };

    if (!isOpen) return null;

    return (
        <div id="chat-modal">
            <div className="chat-container">
                <div className="chat-header">
                    <select 
                        className="chat-select" 
                        value={currentContactId}
                        onChange={(e) => setCurrentContactId(e.target.value)}
                    >
                        <option value="general">🌍 Général</option>
                        {contacts.map(c => (
                            <option key={c._id} value={c._id}>👤 {c.username}</option>
                        ))}
                    </select>
                    <button onClick={onClose} className="close-btn btn-icon">&times;</button>
                </div>
                
                <ul id="chat-messages-list">
                    {messages.length === 0 && <li style={{textAlign:'center', color:'#666', marginTop: 20}}>Aucun message 🦗</li>}
                    
                    {messages.map((msg, index) => {
                        const isMe = msg.sender === user._id;
                        return (
                            <li key={index} className={`chat-msg ${isMe ? 'sent' : 'received'}`}>
                                {!isMe && <span className="chat-sender-name">{msg.senderName}</span>}
                                <span>{msg.text}</span>
                            </li>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </ul>

                <form className="chat-input-area" onSubmit={handleSend}>
                    <input 
                        type="text" 
                        id="chat-input" 
                        placeholder="Écrivez un message..." 
                        autoComplete="off"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                    <button type="submit" id="send-chat-btn">➤</button>
                </form>
            </div>
            {/* Overlay click to close */}
            <div className="modal-overlay-bg" onClick={onClose} 
                style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', zIndex:-1}}>
            </div>
        </div>
    );
}