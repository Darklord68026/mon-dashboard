import { useEffect, useState, useRef, FormEvent, ChangeEvent } from 'react';
import { apiCall } from '../utils/api';
import { Socket } from 'socket.io-client'; // On importe le type du Facteur
import { User } from '../types'; // Notre dictionnaire officiel

// 1. LA FORME D'UN MESSAGE
// C'est à ça que ressemblent les données dans ta base (et dans le state)
interface ChatMessage {
    _id?: string;
    text: string;
    sender: string; // On stocke l'ID ici pour faciliter les comparaisons
    senderName?: string; // Le nom affiché
    receiver?: string;
    createdAt?: string;
}

// 2. LES OUTILS REÇUS DU PARENT
interface ChatWindowProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    socket: Socket | null; // Le socket peut être null au début
    onReadMessages?: () => void; // Optionnel (?)
}

export default function ChatWindow({ isOpen, onClose, user, socket, onReadMessages }: ChatWindowProps) {
    
    // State typé avec notre Interface Message
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [text, setText] = useState('');
    
    // State typé avec notre Interface User
    const [contacts, setContacts] = useState<User[]>([]);
    
    const [currentContactId, setCurrentContactId] = useState('general');
    
    // 3. L'ASCENSEUR (Ref)
    // On précise que c'est un élément HTML DIV. Initiale à null.
    const messagesEndRef = useRef<HTMLDivElement>(null); 

    // 1. Charger les contacts au montage
    useEffect(() => {
        if (!isOpen || !user) return; // Sécurité

        async function loadContacts() {
            if (!user) return;
            const users = await apiCall<User[]>('/user/all');
            if (users) {
                // On s'enlève soi-même de la liste
                setContacts(users.filter(u => u._id !== user._id));
            }
        }
        loadContacts();
    }, [isOpen, user]); // J'ai simplifié les dépendances

    // 2. Charger les messages
    useEffect(() => {
        if (!isOpen) return;

        async function loadMessages() {
            // On demande un tableau de ChatMessage
            const msgs = await apiCall<ChatMessage[]>(`/chat?contactId=${currentContactId}`);
            if (msgs) setMessages(msgs);
            scrollToBottom();
            
            if (currentContactId !== 'general') {
                await apiCall('/chat/read', 'PUT', { contactId: currentContactId });
                if (onReadMessages) onReadMessages(); 
            }
        }
        loadMessages();
    }, [isOpen, currentContactId, onReadMessages]); // Ajout de onReadMessages aux dépendances

    // 3. Écouter les nouveaux messages via Socket
    useEffect(() => {
        if (!socket || !user) return;

        // Ici, 'msg' arrive du serveur, on ne sait pas trop s'il est "propre" (any)
        const handleNewMessage = (msg: any) => {
            
            const isGeneral = currentContactId === 'general' && !msg.receiver;
            // Attention ici : msg.sender peut être un objet ou un ID selon ton backend
            const msgSenderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
            const msgReceiverId = typeof msg.receiver === 'object' ? msg.receiver._id : msg.receiver;

            const isPrivateRelated = 
                (msgSenderId === currentContactId || msgReceiverId === currentContactId) || 
                (msgSenderId === user._id && msgReceiverId === currentContactId);

            if (isGeneral || isPrivateRelated) {
                // Normalisation : On s'assure que sender est bien un string (ID) dans notre state
                const normalizedMsg: ChatMessage = {
                    ...msg,
                    sender: msgSenderId, // On force l'ID
                    // Si le backend n'envoie pas senderName, on essaie de le trouver (optionnel)
                    senderName: msg.senderName || (typeof msg.sender === 'object' ? msg.sender.username : 'Inconnu')
                };
                
                setMessages(prev => [...prev, normalizedMsg]);
                scrollToBottom();
            }
        };

        socket.on('chatMessage', handleNewMessage);

        return () => { socket.off('chatMessage', handleNewMessage); };
    }, [socket, currentContactId, user]);

    // Scroll automatique
    const scrollToBottom = () => {
        setTimeout(() => {
            // Le point d'interrogation est important : si la ref n'est pas attachée, on ne plante pas
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    // Gestion de l'envoi (FormEvent)
    const handleSend = async (e: FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;

        const payload = {
            text,
            receiverId: currentContactId
        };

        await apiCall('/chat', 'POST', payload);
        setText('');
    };

    if (!isOpen) return null;
    // Sécurité : si user est null (ex: déconnexion brutale), on n'affiche rien pour éviter les bugs
    if (!user) return null;

    return (
        <div id="chat-modal">
            <div className="chat-container">
                <div className="chat-header">
                    <select 
                        className="chat-select" 
                        value={currentContactId}
                        // Changement sur un Select -> ChangeEvent<HTMLSelectElement>
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => setCurrentContactId(e.target.value)}
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
                        // Ici msg.sender est bien un string (l'ID) grâce à notre typage
                        const isMe = msg.sender === user._id;
                        return (
                            <li key={index} className={`chat-msg ${isMe ? 'sent' : 'received'}`}>
                                {!isMe && <span className="chat-sender-name">{msg.senderName}</span>}
                                <span>{msg.text}</span>
                            </li>
                        );
                    })}
                    {/* On attache la référence ici */}
                    <div ref={messagesEndRef} />
                </ul>

                <form className="chat-input-area" onSubmit={handleSend}>
                    <input 
                        type="text" 
                        id="chat-input" 
                        placeholder="Écrivez un message..." 
                        autoComplete="off"
                        value={text}
                        // Changement sur un Input -> ChangeEvent<HTMLInputElement>
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
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