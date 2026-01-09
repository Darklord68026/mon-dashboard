export const API_URL = import.meta.env.PROD
    ? '/api'
    : 'http://localhost:3000/api';

export function getToken() {
    return localStorage.getItem('token');
}

export async function apiCall(endpoint, method = 'GET', body = null) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
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

        return data;
    } catch (error) {
        console.error("Network Error:", error);
        return null;
    }
}