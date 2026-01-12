type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export const API_URL = (import.meta as any).env?.PROD
    ? '/api'
    : 'http://localhost:3000/api';

export function getToken(): string | null {
    return localStorage.getItem('token');
}

export async function apiCall<T>(endpoint: string, method: HttpMethod = 'GET', body: any = null): Promise<T | null> {
    const token = getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config: RequestInit = { method, headers };
    if (body) config.body = JSON.stringify(body);

    try {
        const res = await fetch(`${API_URL}${endpoint}`, config);

        if (res.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/';
            return null;
        }

        let data;
        try { data = await res.json(); } catch { data = {};}

        if (!res.ok) {
            console.error("API Error:", data.error);
            //TODO: implent showToast function
            return null;
        }

        return data as T;
    } catch (error) {
        console.error("Network Error:", error);
        return null;
    }
}