console.log("Service Worker Loaded...");

self.addEventListener('push', e => {
    const data = e.data.json();
    console.log("Push Recu...");
    
    self.registration.showNotification(data.title, {
        body: data.body,
        icon: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' // Une icône par défaut
    });
});