// DraftAnnotator Service Worker — caches CDN libs for offline use
const CACHE_NAME = 'draftannotator-v2';
const APP_SHELL = [
    './',
    './pdf-annotator.html'
];
const CDN_ASSETS = [
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js',
    'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js'
];

// Install: pre-cache the app shell and all CDN dependencies
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache =>
            Promise.all([
                cache.addAll(APP_SHELL),
                // CDN resources: fetch with cors, cache even if opaque
                ...CDN_ASSETS.map(url =>
                    fetch(url, {mode: 'cors'})
                        .then(resp => {
                            if (resp.ok || resp.type === 'opaque') cache.put(url, resp);
                        })
                        .catch(() => {
                            // If cors fails, try no-cors (opaque but still cacheable)
                            return fetch(url, {mode: 'no-cors'})
                                .then(resp => cache.put(url, resp))
                                .catch(() => console.warn('SW: could not cache', url));
                        })
                )
            ])
        ).then(() => self.skipWaiting())
    );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

// Fetch: cache-first for known assets, network-first for everything else
self.addEventListener('fetch', event => {
    const url = event.request.url;

    // For CDN assets and app shell: serve from cache, fall back to network
    const isCached = CDN_ASSETS.includes(url) ||
        event.request.destination === 'document' ||
        url.endsWith('pd.html');

    if (isCached) {
        event.respondWith(
            caches.match(event.request).then(cached => {
                // Return cached version immediately
                if (cached) {
                    // Update cache in background (stale-while-revalidate)
                    event.waitUntil(
                        fetch(event.request.clone()).then(resp => {
                            if (resp.ok || resp.type === 'opaque') {
                                return caches.open(CACHE_NAME).then(c => c.put(event.request, resp));
                            }
                        }).catch(() => {})
                    );
                    return cached;
                }
                // Not cached yet — fetch and cache
                return fetch(event.request).then(resp => {
                    const clone = resp.clone();
                    event.waitUntil(
                        caches.open(CACHE_NAME).then(c => c.put(event.request, clone))
                    );
                    return resp;
                });
            }).catch(() => {
                // Total offline fallback for navigation
                if (event.request.destination === 'document') {
                    return caches.match('./pd.html');
                }
            })
        );
        return;
    }

    // All other requests (user PDFs, etc): network only, no caching
});
