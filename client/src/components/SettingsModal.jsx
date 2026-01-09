import { useState } from 'react';
import { apiCall } from '../utils/api';
import { useToast } from '../context/ToastContext';

export default function SettingsModal({ isOpen, onClose, user, onTagsUpdated }) {
    const [activeTab, setActiveTab] = useState('menu'); // 'menu', 'tags', 'security'
    const [newPassword, setNewPassword] = useState('');
    const [newTag, setNewTag] = useState({ name: '', color: '#ff0000' });
    const { showToast } = useToast();

    if (!isOpen) return null;

    // --- GESTION DES TAGS ---
    const handleAddTag = async () => {
        if (!newTag.name.trim()) return showToast("Nom du tag vide", "error");
        
        const currentTags = user.tags || [];
        const updatedTags = [...currentTags, newTag];

        const res = await apiCall('/user/tags', 'PUT', { tags: updatedTags });
        if (res) {
            onTagsUpdated(res); // Met à jour le Dashboard
            setNewTag({ name: '', color: '#ff0000' });
            showToast("Tag ajouté !", "success");
        }
    };

    // --- GESTION MOT DE PASSE ---
    const handleUpdatePassword = async () => {
        if (!newPassword || newPassword.length < 4) return showToast("Mot de passe trop court", "error");
        
        const res = await apiCall('/updatePassword', 'PUT', { newPassword });
        if (res) {
            showToast("Mot de passe modifié", "success");
            setNewPassword('');
        }
    };

    // Rendu du contenu selon l'onglet actif
    const renderContent = () => {
        if (activeTab === 'menu') return (
            <div id="select-params">
                <div className="flex-between" style={{marginBottom: '20px'}}>
                    <h2>Paramètres</h2>
                    <button onClick={onClose} className="btn-icon">&times;</button>
                </div>
                <button onClick={() => setActiveTab('tags')} className="menu-item">🏷️ Gérer les Tags</button>
                <button onClick={() => setActiveTab('security')} className="menu-item">🔒 Sécurité</button>
            </div>
        );

        if (activeTab === 'tags') return (
            <div id="tags">
                <div className="flex-between" style={{marginBottom:'20px'}}>
                    <h3 style={{margin:0}}>⚙️ Tags</h3>
                    <button onClick={() => setActiveTab('menu')} className="btn-icon">⬅️</button>
                </div>
                
                <div id="settings-tags-list" style={{marginBottom: '20px', maxHeight: '200px', overflowY: 'auto'}}>
                    {user.tags && user.tags.map((tag, idx) => (
                        <div key={idx} className="tag-item">
                            <div className="userTags">
                                <span className="color-dot" style={{backgroundColor: tag.color}}></span>
                                <span>{tag.name}</span>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="add-tag-form">
                    <input 
                        type="text" 
                        placeholder="Nom (ex: Sport)"
                        value={newTag.name}
                        onChange={(e) => setNewTag({...newTag, name: e.target.value})}
                    />
                    <input 
                        type="color" 
                        value={newTag.color}
                        onChange={(e) => setNewTag({...newTag, color: e.target.value})}
                    />
                    <button onClick={handleAddTag}>+</button>
                </div>
            </div>
        );

        if (activeTab === 'security') return (
            <div id="security">
                <div className="flex-between" style={{marginBottom: '20px'}}>
                    <h3 style={{margin:0}}>⚙️ Sécurité</h3>
                    <button onClick={() => setActiveTab('menu')} className="btn-icon">⬅️</button>
                </div>
                <input 
                    type="text" 
                    id="input-newPassword" 
                    placeholder="Nouveau mot de passe"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />
                <button id="btn-updatePassword" onClick={handleUpdatePassword}>Mettre à jour</button>
            </div>
        );
    };

    return (
        <div className="modal-overlay">
            <div className="modal-box">
                {renderContent()}
            </div>
        </div>
    );
}