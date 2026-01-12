// src/types.ts

// La définition des Tags
export interface Tag {
    name: string;
    color: string;
}

// La définition OFFICIELLE d'une Tâche
export interface Task {
    _id: string;        // L'ID de MongoDB
    id: string;         // L'ID pour ReactSortable (obligatoire !)
    text: string;       // Le contenu
    category: string;
    dueDate?: string;
    isDone: boolean;
    owner: string;
    createdAt?: string;
}

export interface User {
    _id: string;
    username: string;
    role: string;
    tags?: Tag[]; 
}