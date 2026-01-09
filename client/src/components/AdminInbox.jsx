import { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { useToast } from '../context/ToastContext';

export default function AdminInbox({ isOpen, onClose }) {
    const [suggestions, setSuggestions] = useState([]);
    const { showToast } = useToast();

    useEffect(() => {
        if (isOpen) {
            apiCall('/suggestions').then(data => {
                if (data) setSuggestions(data);
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleDelete = async (id) => {
        if (!confirm("Supprimer ?")) return;
        const res = await apiCall(`/suggestions/${id}`, 'DELETE');
        if (res) {
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