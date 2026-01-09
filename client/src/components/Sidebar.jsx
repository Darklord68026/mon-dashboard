import React from 'react';

export default function Sidebar({ user, isOpen, onClose, onOpenChat, onOpenSettings, onOpenSuggestion, onOpenInbox, onOpenChangelog, onLogout, unreadCount }) {
    const pseudo = user?.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : 'Toi';
    
    // Détection de la PROD (Vite feature)
    const isProd = import.meta.env.PROD; 

    // Gestion de l'affichage du badge (Max 9+)
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
                    {/* LE BADGE ROUGE EST ICI 👇 */}
                    {unreadCount > 0 && (
                        <span className="notification-badge">{displayBadge}</span>
                    )}
                </button>
                
                <button className="menu-item" onClick={onOpenSettings}>⚙️ Paramètres</button>
                
                {/* BOUTON SPECIAL PROD 👇 */}
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