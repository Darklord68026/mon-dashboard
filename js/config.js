// On exporte la constante pour pouvoir l'utiliser ailleurs
export const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:3000/api'
    : '/api';

export const SOCKET_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:3000'
    : window.location.origin;

export function getToken() {
    return localStorage.getItem('token');
}