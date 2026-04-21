// Dart Website Service Worker — caches app shell for offline use
const CACHE_NAME = 'dart-website-v1';
const APP_SHELL = [
    './',
    './main.html',
    './pd.html',
    './css/style1.css',
    './main.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    // Network-first for HTML (always get latest), cache-first for assets
    if (event.request.destination === 'document') {
        event.respondWith(
            fetch(event.request)
                .then(resp => {
                    const clone = resp.clone();
                    event.waitUntil(
                        caches.open(CACHE_NAME).then(c => c.put(event.request, clone))
                    );
                    return resp;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cached => cached || fetch(event.request))
    );
});
