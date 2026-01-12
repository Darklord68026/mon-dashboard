import { useState } from 'react';
import { apiCall } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { User, Tag } from '../types'; // <--- On utilise nos types officiels

// 1. LES TYPES LOCAUX (Juste pour ce fichier)
// On définit les onglets autorisés pour éviter les fautes de frappe
type Tab = 'menu' | 'tags' | 'security';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null; // L'utilisateur peut être null au chargement
    // La fonction de mise à jour prend la nouvelle liste de tags
    onTagsUpdated: (newTags: Tag[]) => void;
}

export default function SettingsModal({ isOpen, onClose, user, onTagsUpdated }: SettingsModalProps) {
    // On dit que activeTab ne peut être que 'menu', 'tags' ou 'security'
    const [activeTab, setActiveTab] = useState<Tab>('menu'); 
    
    const [newPassword, setNewPassword] = useState('');
    
    // On initialise le nouveau tag. C'est un objet qui respecte l'interface Tag
    const [newTag, setNewTag] = useState<Tag>({ name: '', color: '#ff0000' });
    
    const { showToast } = useToast();

    if (!isOpen) return null;
    if (!user) return null; // Sécurité supplémentaire si user est null

    // --- GESTION DES TAGS ---
    const handleAddTag = async () => {
        if (!newTag.name.trim()) return showToast("Nom du tag vide", "error");
        
        // On récupère les tags actuels ou une liste vide
        const currentTags = user.tags || [];
        // On ajoute le nouveau tag
        const updatedTags = [...currentTags, newTag];

        // On envoie la nouvelle liste au serveur
        // On s'attend à recevoir la liste des tags mise à jour en réponse
        const res = await apiCall<Tag[]>('/user/tags', 'PUT', { tags: updatedTags });
        
        if (res) {
            onTagsUpdated(res); // Met à jour le Dashboard avec la réponse du serveur
            setNewTag({ name: '', color: '#ff0000' }); // Reset du formulaire
            showToast("Tag ajouté !", "success");
        }
    };

    // --- GESTION MOT DE PASSE ---
    const handleUpdatePassword = async () => {
        if (!newPassword || newPassword.length < 4) return showToast("Mot de passe trop court", "error");
        
        // Ici, on se fiche un peu du retour tant que c'est pas une erreur, donc <any>
        const res = await apiCall<any>('/updatePassword', 'PUT', { newPassword });
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
                    {/* On vérifie que user.tags existe avant de mapper */}
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
                        // TypeScript sait que c'est un input texte
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