const CACHE_NAME = 'v1';
const CACHE_ASSETS = [
    '/',
    '/index.ejs',               // Página principal (renderizada via EJS)
    '/404.ejs',                  // Página 404
    '/css/index.css',           // Estilos principais
    '/css/style.css',           // Estilos adicionais
    '/js/script.js',            // Scripts JS principais
    '/img/gabi404.png',         // Imagem de erro 404
    '/img/icon-192x192.png',    // Ícone de 192x192
    '/img/papeldeparede.jpg',   // Imagem de fundo
    '/img/plaquinha.png',       // Imagem da plaquinha
    '/img/imagemdodia.jpg'      // Imagem do dia
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Cache assets');
            return cache.addAll(CACHE_ASSETS);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then(cacheResponse => {
            // Retorna do cache se disponível ou tenta buscar na rede
            return cacheResponse || fetch(event.request)
                .catch(() => {
                    // Caso a rede falhe, podemos fornecer uma resposta de fallback
                    return caches.match('/404.ejs');
                });
        })
    );
});

