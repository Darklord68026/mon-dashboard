const API_URL = (import.meta as any).env.PROD ? '/api' : 'http://localhost:3000/api';

// Petite fonction helper pour envoyer le signal au ToastContext
const triggerToast = (message: string, type: 'info' | 'success' | 'error' = 'error') => {
    const event = new CustomEvent('SHOW_TOAST', { detail: { message, type } });
    window.dispatchEvent(event);
};

export async function apiCall<T>(endpoint: string, method: string = 'GET', body?: any): Promise<T | null> {
    const token = localStorage.getItem('token');
    
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    };

    try {
        const res = await fetch(`${API_URL}${endpoint}`, config);
        
        // Cas spécial : si le token est expiré (401), on déconnecte
        if (res.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/'; // Redirection brutale vers login
            triggerToast("Session expirée", "error");
            return null;
        }

        const data = await res.json();

        // 👇 C'EST ICI QUE TU VOULAIS TON CODE 👇
        if (!res.ok) {
            console.error("API Error:", data.error);
            // On déclenche le signal de fumée ! 💨
            triggerToast(data.error || "Une erreur est survenue", "error");
            return null;
        }

        return data as T;

    } catch (err) {
        console.error("Network Error:", err);
        triggerToast("Erreur de connexion serveur", "error");
        return null;
    }
}