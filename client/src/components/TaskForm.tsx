import { useState, KeyboardEvent, ChangeEvent, ChangeEventHandler } from 'react';
import { apiCall } from '../utils/api';
import { Tag, Task } from '../types';

interface TaskFromProps {
    userTags: Tag[];
}

export default function TaskForm({ userTags }: TaskFromProps) {
    const [text, setText] = useState('');
    const [category, setCategory] = useState('Général');
    const [dueDate, setDueDate] = useState('');

    const handleSubmit = async () => {
        if (!text.trim()) return;

        // Appel API (comme dans app.js original)
        const payload = {
            text,
            category,
            dueDate: dueDate || undefined
        };

        const res = await apiCall<Task>('/tasks', 'POST', payload);
        
        if (res) {
            // Reset du form
            setText('');
        }
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    return (
        <div className="input-group">
            <input 
                type="text" 
                placeholder="Nouvelle tâche..." 
                value={text}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
                onKeyPress={handleKeyPress}
            />
            
            <select 
                value={category} 
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)}
            >
                {userTags.map(tag => (
                    <option key={tag.name} value={tag.name}>{tag.name}</option>
                ))}
            </select>
            
            <input 
                type="date" 
                value={dueDate}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setDueDate(e.target.value)}
            />
            
            <button id="add-task-btn" onClick={() => handleSubmit()}>Ajouter</button>
        </div>
    );
}