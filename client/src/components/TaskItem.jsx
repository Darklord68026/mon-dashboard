import { apiCall } from '../utils/api';

export default function TaskItem({ task, userTags, onDelete, onUpdate }) {
    // 1. Gestion de la Couleur (basé sur ui.js)
    const tagConfig = userTags.find(t => t.name === task.category);
    const color = tagConfig ? tagConfig.color : '#888';

    // 2. Gestion de la Date (basé sur ui.js)
    const formatDate = (dateString) => {
        if (!dateString) return null;
        const d = new Date(dateString);
        const today = new Date();
        today.setHours(0,0,0,0);
        const isLate = d < today;
        
        return (
            <small className={isLate ? 'date-late' : ''} style={{ color: isLate ? '' : '#aaaaaa', fontSize: '0.75rem' }}>
                {isLate ? '⚠️' : '📅'} {d.toLocaleDateString()}
            </small>
        );
    };

    // 3. Gestion de l'Édition (Prompt simple pour l'instant)
    const handleEdit = async () => {
        const newText = prompt("Modifier la tâche :", task.text);
        if (newText && newText.trim() !== "") {
            // Optimistic Update (Optionnel) ou attente serveur
            // Ici on appelle l'API, le Socket mettra à jour l'interface
            await apiCall(`/tasks/${task._id}`, 'PUT', { text: newText });
        }
    };

    // 4. Gestion de la Suppression
    const handleDelete = async () => {
        if(confirm("Supprimer ?")) {
            await apiCall(`/tasks/${task._id}`, 'DELETE');
            // Pas besoin d'appeler onDelete() ici, le Socket le fera
        }
    };

    return (
        <div 
            className="task-item-container" 
            style={{ 
                borderLeft: `6px solid ${color}`,
                background: '#2c2c2c',
                padding: '12px',
                marginBottom: '8px',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px rgba(0,0,0,0.3)'
            }}
        >
            <div className="task-content">
                <span className="task-text" style={{ fontWeight: 500, fontSize: '1rem', display: 'block', color: 'white' }}>
                    {task.text}
                </span>
                <div className="task-meta" style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '5px' }}>
                    <span className="task-tag" style={{ 
                        background: `${color}33`, 
                        color: color, 
                        padding: '2px 8px', 
                        borderRadius: '10px', 
                        fontSize: '0.7rem', 
                        fontWeight: 'bold' 
                    }}>
                        {task.category || 'Général'}
                    </span>
                    {formatDate(task.dueDate)}
                </div>
            </div>

            <div className="task-actions" style={{ display: 'flex', gap: '5px' }}>
                <button onClick={handleEdit} className="edit-btn">✏️</button>
                <button onClick={handleDelete} className="delete-btn">✕</button>
            </div>
        </div>
    );
}