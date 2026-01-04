// sw.js - Service Worker Minimaliste
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Installé');
});

self.addEventListener('fetch', (e) => {
    // On ne fait rien de spécial, on laisse passer les requêtes
    // (C'est ici qu'on gèrerait le mode hors-ligne plus tard)
});