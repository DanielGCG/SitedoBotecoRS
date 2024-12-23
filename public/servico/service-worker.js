const CACHE_NAME = 'v2';
const CACHE_ASSETS = [
    '/',
    '/index.html',
    '/404.html',
    '/css/index.css',
    '/css/style.css',
    '/js/script.js',
    '/img/gabi404.png',
    '/img/icon-192x192.png',
    '/img/papeldeparede.jpg',
    '/img/plaquinha.png',
    '/img/imagemdodia.jpg',
    '/service-worker.js'
];

self.addEventListener('install', (event) => {
    console.log('Service Worker instalado!');
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker ativado!');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Removendo cache antigo:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then(cacheResponse => {
            return cacheResponse || fetch(event.request).catch(() => {
                if (event.request.destination === 'document') {
                    return caches.match('/404.html'); // Fallback seguro
                }
            });
        })
    );
});
