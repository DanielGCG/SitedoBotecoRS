importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging.js');
require('dotenv').config();

// Configuração do Firebase
const firebaseConfig = {
    apiKey: process.env.apiKey.apiKey,
    authDomain: process.env.authDomain,
    projectId: process.env.projectId,
    storageBucket: process.env.storageBucket,
    messagingSenderId: process.env.messagingSenderId,
    appId: process.env.appId
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Inicializa o Firebase Messaging
const messaging = firebase.messaging();

// Cache e assets
const CACHE_NAME = 'v1';
const CACHE_ASSETS = [
    '/',
    '/index.ejs',               // Página principal (renderizada via EJS)
    '/404.ejs',                 // Página 404
    '/css/index.css',           // Estilos principais
    '/css/style.css',           // Estilos adicionais
    '/js/script.js',            // Scripts JS principais
    '/img/gabi404.png',         // Imagem de erro 404
    '/img/icon-192x192.png',    // Ícone de 192x192
    '/img/papeldeparede.jpg',   // Imagem de fundo
    '/img/plaquinha.png',       // Imagem da plaquinha
    '/img/imagemdodia.jpg',     // Imagem do dia
    '/service-worker.js'
];

// Evento de instalação do service worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Cache assets');
            return cache.addAll(CACHE_ASSETS);
        })
    );
});

// Evento de fetch para fornecer resposta do cache ou da rede
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then(cacheResponse => {
            return cacheResponse || fetch(event.request)
                .catch(() => {
                    return caches.match('/404.ejs');
                });
        })
    );
});

// Evento de push para exibir notificações
self.addEventListener('push', (event) => {
    const notificationOptions = {
        body: event.data ? event.data.text() : 'Você tem uma nova notificação!',
        icon: '/img/icon-192x192.png',
        badge: '/img/icon-192x192.png',
    };

    event.waitUntil(
        self.registration.showNotification('Nova Notificação!', notificationOptions)
    );
});

// Evento de clique na notificação
self.addEventListener('notificationclick', (event) => {
    event.notification.close(); // Fecha a notificação ao clicar

    // Pode-se adicionar ações, como redirecionar o usuário ao clicar na notificação
    event.waitUntil(
        clients.openWindow('/') // Abre a página principal
    );
});
