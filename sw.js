// Service Worker for AR Model Caching
const CACHE_NAME = 'ar-models-v1';

// Install event - set up the cache
self.addEventListener('install', event => {
    console.log('Service Worker installed');
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker activated');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event - intercept requests for model files
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Check if this is a model file request
    if (url.pathname.endsWith('.glb') || url.pathname.endsWith('.usdz')) {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                return cache.match(event.request).then(response => {
                    if (response) {
                        console.log('Serving from cache:', event.request.url);
                        return response;
                    }
                    
                    // Not in cache, fetch and cache
                    console.log('Fetching and caching:', event.request.url);
                    return fetch(event.request).then(response => {
                        // Cache the response for next time
                        cache.put(event.request, response.clone());
                        return response;
                    });
                });
            })
        );
    }
});

// Message handler for manual cache operations
self.addEventListener('message', event => {
    if (event.data.action === 'CACHE_URLS') {
        const { urls } = event.data;
        event.waitUntil(
            caches.open(CACHE_NAME).then(cache => {
                return Promise.all(
                    urls.map(url => {
                        return cache.add(url).catch(err => {
                            console.error('Failed to cache:', url, err);
                        });
                    })
                );
            })
        );
    }
}); 