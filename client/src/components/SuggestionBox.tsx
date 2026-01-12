import { useState, ChangeEvent } from 'react';
import { apiCall } from '../utils/api';
import { useToast } from '../context/ToastContext';

interface SuggestionBoxProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SuggestionBox({ isOpen, onClose }: SuggestionBoxProps) {
    const [text, setText] = useState('');
    const { showToast } = useToast();

    if (!isOpen) return null;

    const handleSend = async () => {
        if (!text.trim()) return showToast("Vide !", "error");
        
        const res = await apiCall<any>('/suggestions', 'POST', { text });
        if (res) {
            showToast("Suggestion envoyée !", "success");
            setText('');
            onClose();
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <div className="modal-header">
                    <h2>👑 Suggestion</h2>
                    <button onClick={onClose} className="close-suggestion-btn">&times;</button>
                </div>
                <p className="modal-desc">Une idée ? Dis-le moi !</p>
                <textarea 
                    id="suggestion-text" 
                    placeholder="Ex: Ajoute un mode sombre..."
                    value={text}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
                ></textarea>
                <button id="send-suggestion-btn" onClick={handleSend}>Envoyer 📩</button>
            </div>
        </div>
    );
}