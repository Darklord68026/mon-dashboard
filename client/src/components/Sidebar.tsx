import { User } from '../types';

interface SidebarProps {
    user: User | null;
    isOpen: boolean;
    unreadCount: number;
    onClose: () => void;
    onOpenChat: () => void;
    onOpenSettings: () => void;
    onOpenSuggestion: () => void;
    onOpenInbox: () => void;
    onOpenChangelog: () => void;
    onLogout: () => void;
}

export default function Sidebar({ 
    user, 
    isOpen, 
    onClose, 
    onOpenChat, 
    onOpenSettings, 
    onOpenSuggestion, 
    onOpenInbox, 
    onOpenChangelog, 
    onLogout, 
    unreadCount 
}: SidebarProps) {

    // CORRECTION : On utilise bien 'username' ici
    const pseudo = user?.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : 'Toi';
    
    const isProd = (import.meta as any).env.PROD; 
    const displayBadge = unreadCount > 9 ? '9+' : unreadCount;

    return (
        <nav className={`sidebar ${isOpen ? 'active' : ''}`}>
            <div className="sidebar-header flex-between">
                <h3>Menu</h3>
                <button onClick={onClose} className="btn-icon">&times;</button>
            </div>
            
            <div className="sidebar-content">
                <button className="menu-item" onClick={onOpenSuggestion}>👑 Boîte à Idées</button>
                
                {user?.role === 'admin' && (
                    <button className="menu-item" onClick={onOpenInbox}>📂 Lire les idées</button>
                )}
                
                <button className="menu-item" onClick={onOpenChat}>
                    💬 Discussions
                    {unreadCount > 0 && (
                        <span className="notification-badge">{displayBadge}</span>
                    )}
                </button>
                
                <button className="menu-item" onClick={onOpenSettings}>⚙️ Paramètres</button>
                
                {isProd && (
                    <button className="menu-item" onClick={onOpenChangelog} style={{ color: '#4dabf7' }}>
                        🚀 Nouveautés
                    </button>
                )}
                
                <button onClick={onLogout} className="menu-item danger">Déconnexion</button>
            </div>

            <footer id="sidebar-display">
                <h3>Bonjour, {pseudo} 👋</h3>
            </footer>
        </nav>
    );
}