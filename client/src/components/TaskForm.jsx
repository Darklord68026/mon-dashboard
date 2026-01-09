import { useState } from 'react';
import { apiCall } from '../utils/api';

export default function TaskForm({ userTags }) {
    const [text, setText] = useState('');
    const [category, setCategory] = useState('Général');
    const [dueDate, setDueDate] = useState('');

    const handleSubmit = async () => {
        if (!text.trim()) return;

        // Appel API (comme dans app.js original)
        const payload = {
            text,
            category,
            dueDate: dueDate || null
        };

        const res = await apiCall('/tasks', 'POST', payload);
        
        if (res) {
            // Reset du form
            setText('');
            // On ne force pas le reload, le Socket s'en charge !
        }
    };

    return (
        <div className="input-group">
            <input 
                type="text" 
                placeholder="Nouvelle tâche..." 
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
            
            <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
            >
                {userTags.map(tag => (
                    <option key={tag.name} value={tag.name}>{tag.name}</option>
                ))}
            </select>
            
            <input 
                type="date" 
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
            />
            
            <button id="add-task-btn" onClick={handleSubmit}>Ajouter</button>
        </div>
    );
}