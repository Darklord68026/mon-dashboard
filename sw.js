const CACHE_NAME = 'dashboard-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/api.js',
    './js/auth.js',
    './js/ui.js',
    './js/config.js',
    './js/socket.js',
    './js/chat.js',
    './js/weather.js',
    './js/game.js',
    'https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.0/Sortable.min.js',
    'https://cdn.socket.io/4.7.4/socket.io.min.js'
];

// INSTALLATION : On met en cache
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Installation...');
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Mise en cache des fichiers');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// ACTIVATION : On nettoie les vieux caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
});

// FETCH : On sert le cache si possible (Mode Offline)
self.addEventListener('fetch', (e) => {
    // On ne cache pas les appels API (ceux qui commencent par http://.../api)
    if (e.request.url.includes('/api/')) {
        return; // On laisse passer vers le réseau direct
    }

    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});