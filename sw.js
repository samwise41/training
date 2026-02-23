const CACHE_NAME = 'training-pwa-v2'; // <-- Just change the number
const STATIC_ASSETS = [
    './',
    './index.html',
    './css/styles.css',
    './js/app.js'
    // The service worker will dynamically cache other JS/CSS as you browse
];

// Install Event: Cache static shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => name !== CACHE_NAME)
                          .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch Event: Network-First for JSON, Cache-First for others
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    const requestUrl = new URL(event.request.url);

    // 1. Network-First Strategy for JSON Data (Always try to get fresh data)
    if (requestUrl.pathname.endsWith('.json')) {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                })
                .catch(() => {
                    // Offline? Return the cached JSON
                    return caches.match(event.request);
                })
        );
        return;
    }

    // 2. Stale-While-Revalidate Strategy for everything else (HTML, JS, CSS, Images)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            });
            // Return cached response immediately if available, while network fetches in background
            return cachedResponse || fetchPromise;
        })
    );
});
