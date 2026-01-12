import { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { useToast } from '../context/ToastContext';

// 1. LA FORME D'UNE SUGGESTION (La Carte Postale)
// Je le définis ici car c'est utilisé uniquement dans cette page pour l'instant.
// Si tu l'utilises ailleurs, tu pourras le bouger dans 'types.ts'.
interface Suggestion {
    _id: string;
    text: string;
    author: string; // Le nom de la personne
}

// 2. LE CONTRAT (Props)
interface AdminInboxProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AdminInbox({ isOpen, onClose }: AdminInboxProps) {
    // On précise que c'est une liste de Suggestion (tableau)
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    
    const { showToast } = useToast();

    useEffect(() => {
        if (isOpen) {
            // 3. LA BOÎTE MAGIQUE
            // On dit à l'API : "Ramène-moi une liste de Suggestion s'il te plaît"
            apiCall<Suggestion[]>('/suggestions').then(data => {
                if (data) setSuggestions(data);
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // On précise que l'ID est une chaîne de caractères (string)
    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer ?")) return;
        
        // On supprime via l'API
        const res = await apiCall(`/suggestions/${id}`, 'DELETE');
        
        if (res) {
            // On met à jour la liste locale en enlevant celui qu'on vient de supprimer
            setSuggestions(prev => prev.filter(s => s._id !== id));
            showToast("Supprimé", "success");
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <div className="modal-header">
                    <h2>📬 Inbox Admin</h2>
                    <button onClick={onClose} className="close-inbox-btn btn-icon">&times;</button>
                </div>
                
                <ul id="suggestions-list">
                    {suggestions.length === 0 && (
                        <div style={{textAlign:'center', color:'#666'}}>Aucune suggestion 🦗</div>
                    )}
                    {suggestions.map(s => (
                        <li key={s._id} className="suggestion-item">
                            <div className="suggestion-content">
                                <span className="suggestion-author">{s.author}</span>
                                <span className="suggestion-text">{s.text}</span>
                            </div>
                            <button className="delete-suggestion-btn" onClick={() => handleDelete(s._id)}>✕</button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}