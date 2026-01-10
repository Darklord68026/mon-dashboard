import { useEffect, useState, useMemo, useRef } from 'react';
import { apiCall } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { ReactSortable } from "react-sortablejs";
import io from 'socket.io-client';
import { useToast } from '../context/ToastContext';

// Composants
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import WeatherWidget from '../components/WeatherWidget';
import SnakeGame from '../components/SnakeGame';
import TaskItem from '../components/TaskItem';
import TaskForm from '../components/TaskForm';
import SettingsModal from '../components/SettingsModal';
import SuggestionBox from '../components/SuggestionBox';
import AdminInbox from '../components/AdminInbox';
import ChangelogModal from '../components/ChangelogModal';

const SOCKET_URL = import.meta.env.PROD ? '/' : 'http://localhost:3000';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [socket, setSocket] = useState(null);
    
    // Horloge
    const [time, setTime] = useState({ hm: "00:00", s: "00" });
    
    // Mode Zen (Cacher l'interface)
    const [isZenMode, setIsZenMode] = useState(false);

    // Filtres
    const [filterTag, setFilterTag] = useState('all');
    const [sortOrder, setSortOrder] = useState('date-asc');

    // Notification
    const [unreadCount, setUnreadCount] = useState(0);

    // Modals
    const [modals, setModals] = useState({
        sidebar: false, chat: false, settings: false, suggestion: false, inbox: false, changelog: false
    });

    const isChatOpenRef = useRef(modals.chat);

    useEffect(() => {
        isChatOpenRef.current = modals.chat;
    }, [modals.chat]);

    const navigate = useNavigate();
    const { showToast } = useToast();
    const toggleModal = (name, value) => setModals(prev => ({ ...prev, [name]: value }));

    // 1. Initialisation Données
    useEffect(() => {
        async function initData() {
            const userData = await apiCall('/user/me');
            if (!userData) return navigate('/');
            setUser(userData);
            const tasksData = await apiCall('/tasks');
            if (tasksData) setTasks(tasksData);
            const unreadData = await apiCall('/chat/unread');
            if (unreadData && unreadData.count) {
                setUnreadCount(unreadData.count);
            }
        }
        initData();
    }, [navigate]);

    // 2. Horloge (Heures + Minutes + Secondes)
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            setTime({ hm: `${hours}:${minutes}`, s: seconds });
        };
        const interval = setInterval(updateClock, 1000);
        updateClock();
        return () => clearInterval(interval);
    }, []);

    // 3. Mode Zen (Double Clic)
    useEffect(() => {
        const handleDoubleClick = (e) => {
            // SÉCURITÉ : On ne déclenche pas si on clique sur un input/bouton
            if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(e.target.tagName)) return;
            // On bascule le mode Zen
            setIsZenMode(prev => !prev);
        };
        document.addEventListener('dblclick', handleDoubleClick);
        return () => document.removeEventListener('dblclick', handleDoubleClick);
    }, []);

    // 4. Sockets
    useEffect(() => {
        if (!user) return;
        const newSocket = io(SOCKET_URL, { transports: ['websocket'] });
        setSocket(newSocket);
        newSocket.on('taskAdded', (t) => setTasks(prev => [t, ...prev]));
        newSocket.on('taskDeleted', (id) => setTasks(prev => prev.filter(t => t._id !== id)));
        newSocket.on('taskUpdated', (t) => setTasks(prev => prev.map(old => old._id === t._id ? t : old)));
        newSocket.on('newSuggestion', (data) => {
            if (user?.role === 'admin') showToast(`💡 Nouvelle idée de ${data.author}`, "info");
        });
        newSocket.on('chatMessage', (msg) => {
            // Est-ce que le message vient de moi ?
            const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
            if (senderId === user?.id) return; // Pas de notif pour soi-même

            // Si le chat est fermé, on incrémente le compteur
            if (!isChatOpenRef.current) {
                setUnreadCount(prev => prev + 1);
                showToast(`💬 Nouveau message de ${msg.sender.name}`, "info");
            }
        });
        return () => newSocket.disconnect();
    }, [user, showToast]);

    // 5. RESET DU COMPTEUR QUAND ON OUVRE LE CHAT
    const openChat = () => {
        setUnreadCount(0); // On remet à zéro
        toggleModal('sidebar', false);
        toggleModal('chat', true);
    };

    // 6. Logique de Tri/Filtre (identique à ui.js)
    const processedTasks = useMemo(() => {
        let filtered = [...tasks];
        if (filterTag !== 'all') filtered = filtered.filter(t => t.category === filterTag);
        
        filtered.sort((a, b) => {
            if (sortOrder === 'recent') {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            }
            const timeA = a.dueDate ? new Date(a.dueDate).getTime() : null;
            const timeB = b.dueDate ? new Date(b.dueDate).getTime() : null;
            if (!timeA && !timeB) return 0;
            if (!timeA) return 1; 
            if (!timeB) return -1;
            return sortOrder === 'date-asc' ? timeA - timeB : timeB - timeA;
        });
        return filtered;
    }, [tasks, filterTag, sortOrder]);

    if (!user) return <div className="login-container"><div className="login-box">Chargement...</div></div>;
    const tags = user.tags || [{name: 'Général', color: '#888'}];

    return (
        // Si Mode Zen activé, on cache tout le contenu sauf le fond d'écran
        <div id="dashboard-screen" style={{ opacity: isZenMode ? 0 : 1, transition: 'opacity 0.5s ease' }}>
            
            <header>
                <button className="burger-icon" onClick={() => toggleModal('sidebar', true)}>
                    ☰
                    {unreadCount > 0 && <span className="burger-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </button>
                {/* Structure exacte de ton ancienne horloge */}
                <div id="clock-container" className="clock-floating">
                    <div id="clock">{time.hm}</div>
                    <div id="clock-seconds" style={{fontSize: '1.25rem'}}>{time.s}</div>
                </div>
            </header>

            <Sidebar 
                user={user} 
                isOpen={modals.sidebar}
                unreadCount={unreadCount}
                onClose={() => toggleModal('sidebar', false)}
                onOpenChat={() => { toggleModal('sidebar', false); openChat(); }}
                onOpenSettings={() => { toggleModal('sidebar', false); toggleModal('settings', true); }}
                onOpenSuggestion={() => { toggleModal('sidebar', false); toggleModal('suggestion', true); }}
                onOpenInbox={() => { toggleModal('sidebar', false); toggleModal('inbox', true); }}
                onOpenChangelog={() => { toggleModal('sidebar', false); toggleModal('changelog', true); }}
                onLogout={() => { localStorage.removeItem('token'); navigate('/'); }}
            />

            <ChatWindow 
                isOpen={modals.chat} 
                onClose={() => toggleModal('chat', false)}
                user={user}
                socket={socket}
                onReadMessages={async () => {
                    const unreadData = await apiCall('/chat/unread');
                    if (unreadData) setUnreadCount(unreadData.count);
                }}
            />

            <SettingsModal 
                isOpen={modals.settings}
                onClose={() => toggleModal('settings', false)}
                user={user}
                onTagsUpdated={(newTags) => setUser({...user, tags: newTags})}
            />

            <SuggestionBox 
                isOpen={modals.suggestion}
                onClose={() => toggleModal('suggestion', false)}
            />

            <AdminInbox 
                isOpen={modals.inbox}
                onClose={() => toggleModal('inbox', false)}
            />

            <ChangelogModal
                isOpen={modals.changelog}
                onClose={() => toggleModal('changelog', false)}
            />

            <main className="dashboard-container">
                <section className="widget weather-widget">
                    <h2>Météo</h2>
                    <WeatherWidget />
                </section>

                <section className="widget todo-widget">
                    <h2>À faire</h2>
                    <div className="input-group flex-between" style={{marginBottom: '15px', background: 'transparent', border: 'none', padding: 0}}>
                        <select 
                            value={filterTag} 
                            onChange={(e) => setFilterTag(e.target.value)}
                            style={{width: '48%', cursor: 'pointer'}}
                        >
                            <option value="all">Tout voir</option>
                            {tags.map(tag => (
                                <option key={tag.name} value={tag.name}>{tag.name}</option>
                            ))}
                        </select>

                        <select 
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            style={{width: '48%', cursor: 'pointer'}}
                        >
                            <option value="date-asc">📅 Urgent</option>
                            <option value="date-desc">📅 Moins urgent</option>
                            <option value="recent">✨ Récents</option>
                        </select>
                    </div>

                    <ul id="task-list" style={{listStyle:'none', padding:0}}>
                        <ReactSortable list={processedTasks} setList={setTasks} ghostClass="sortable-ghost" animation={150}>
                            {processedTasks.map(task => (
                                <TaskItem key={task._id} task={task} userTags={tags} />
                            ))}
                        </ReactSortable>
                        {processedTasks.length === 0 && <li style={{textAlign:'center', padding:'20px', color:'#666'}}>Aucune tâche 🧐</li>}
                    </ul>
                    <TaskForm userTags={tags} />
                </section>
            </main>

            <SnakeGame />
        </div>
    );
}