import { useEffect, useState, useMemo, useRef, ChangeEvent } from 'react';
import { apiCall } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { ReactSortable } from "react-sortablejs";
import io, { Socket } from 'socket.io-client'; // <--- Import du type Socket
import { useToast } from '../context/ToastContext';

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
import { Tag, Task, User } from '../types';

// Pour le compteur de messages non lus
interface UnreadResponse {
    count: number;
}

// Pour les messages reçus par socket
interface ChatMessage {
    sender: User | string; // Parfois c'est l'objet complet, parfois juste l'ID
    content: string;
}

const SOCKET_URL = (import.meta as any).env.PROD ? '/' : 'http://localhost:3000';

export default function Dashboard() {
    // --- 2. LES BOÎTES TYPÉES (STATE) ---
    
    // "Cette boîte contient soit un User, soit rien (null)"
    const [user, setUser] = useState<User | null>(null);
    
    // "Cette boîte contient une liste de Tâches (tableau)"
    const [tasks, setTasks] = useState<Task[]>([]);
    
    // "Cette boîte contient la connexion Socket"
    const [socket, setSocket] = useState<Socket | null>(null);
    
    const [time, setTime] = useState({ hm: "00:00", s: "00" });
    const [isZenMode, setIsZenMode] = useState(false);

    const [filterTag, setFilterTag] = useState('all');
    const [sortOrder, setSortOrder] = useState('date-asc');

    const [unreadCount, setUnreadCount] = useState(0);

    const [modals, setModals] = useState({
        sidebar: false, chat: false, settings: false, suggestion: false, inbox: false, changelog: false
    });

    const isChatOpenRef = useRef(modals.chat);

    useEffect(() => {
        isChatOpenRef.current = modals.chat;
    }, [modals.chat]);

    const navigate = useNavigate();
    const { showToast } = useToast();
    
    // Typage simple pour name (clé de l'objet modals) et value (boolean)
    const toggleModal = (name: keyof typeof modals, value: boolean) => 
        setModals(prev => ({ ...prev, [name]: value }));

    // 3. Initialisation Données avec API CALL TYPÉ
    useEffect(() => {
        async function initData() {
            // Regarde la magie : <User>
            const userData = await apiCall<User>('/user/me');
            if (!userData) return navigate('/');
            setUser(userData);

            // Regarde la magie : <Task[]> (Tableau de Task)
            const tasksData = await apiCall<any[]>('/tasks');
            if (tasksData) {
                const formattedTasks: Task[] = tasksData.map(t => ({ ...t, id: t._id }));
                setTasks(formattedTasks);
            }

            const unreadData = await apiCall<UnreadResponse>('/chat/unread');
            if (unreadData && typeof unreadData.count === 'number') {
                setUnreadCount(unreadData.count);
            }
        }
        initData();
    }, [navigate]);

    // 4. Horloge
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

    // 5. Mode Zen
    useEffect(() => {
        // e est un MouseEvent
        const handleDoubleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement; // On affirme que c'est un élément HTML
            if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName)) return;
            setIsZenMode(prev => !prev);
        };
        document.addEventListener('dblclick', handleDoubleClick);
        return () => document.removeEventListener('dblclick', handleDoubleClick);
    }, []);

    // 6. Sockets
    useEffect(() => {
        if (!user) return;
        const newSocket = io(SOCKET_URL, { transports: ['websocket'] });
        setSocket(newSocket);

        // Ici on type les données reçues par le socket
        newSocket.on('taskAdded', (t: any) => {
            const newTask: Task = { ...t, id: t._id};
            setTasks(prev => [newTask, ...prev]);
        });
        newSocket.on('taskDeleted', (id: string) => setTasks(prev => prev.filter(t => t._id !== id)));
        newSocket.on('taskUpdated', (t: Task) => setTasks(prev => prev.map(old => old._id === t._id ? { ...t, id: t._id} : old)));
        
        newSocket.on('newSuggestion', (data: { author: string }) => {
            if (user?.role === 'admin') showToast(`💡 Nouvelle idée de ${data.author}`, "info");
        });

        newSocket.on('chatMessage', (msg: ChatMessage) => {
            // On gère le cas où sender est un objet ou juste un ID
            const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;

            if (senderId === user?._id) return; 

            if (!isChatOpenRef.current) {
                setUnreadCount(prev => prev + 1);
                const senderName = typeof msg.sender === 'object' ? msg.sender.username : 'Quelqu\'un';
                showToast(`💬 Nouveau message de ${senderName}`, "info");
            }
        });
        return () => { newSocket.disconnect(); };
    }, [user, showToast]);

    const handleDeleteTask = async (id: string) => {
        await apiCall(`tasks/${id}`, 'DELETE');
    };

    const handleUpdateTask = async (updatedTask: Task) => {
        await apiCall(`/tasks/${updatedTask._id}`, 'PUT', updatedTask);
    };

    const openChat = () => {
        setUnreadCount(0);
        toggleModal('sidebar', false);
        toggleModal('chat', true);
    };

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
        <div id="dashboard-screen" style={{ opacity: isZenMode ? 0 : 1, transition: 'opacity 0.5s ease' }}>
            
            <header>
                <button className="burger-icon" onClick={() => toggleModal('sidebar', true)}>
                    ☰
                    {unreadCount > 0 && <span className="burger-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </button>
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
                    const unreadData = await apiCall<UnreadResponse>('/chat/unread');
                    if (unreadData) setUnreadCount(unreadData.count);
                }}
            />

            <SettingsModal 
                isOpen={modals.settings}
                onClose={() => toggleModal('settings', false)}
                user={user}
                onTagsUpdated={(newTags: Tag[]) => setUser({...user, tags: newTags})}
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
                            // Ici on dit à TS : "C'est un événement de changement sur un élément SELECT"
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilterTag(e.target.value)}
                            style={{width: '48%', cursor: 'pointer'}}
                        >
                            <option value="all">Tout voir</option>
                            {tags.map(tag => (
                                <option key={tag.name} value={tag.name}>{tag.name}</option>
                            ))}
                        </select>

                        <select 
                            value={sortOrder}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSortOrder(e.target.value)}
                            style={{width: '48%', cursor: 'pointer'}}
                        >
                            <option value="date-asc">📅 Urgent</option>
                            <option value="date-desc">📅 Moins urgent</option>
                            <option value="recent">✨ Récents</option>
                        </select>
                    </div>

                    <ul id="task-list" style={{listStyle:'none', padding:0}}>
                        <ReactSortable<Task> list={tasks} setList={setTasks} ghostClass="sortable-ghost" animation={150}>
                            {processedTasks.map(task => (
                                <TaskItem key={task._id} task={task} userTags={tags} onDelete={handleDeleteTask} onUpdate={handleUpdateTask} />
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