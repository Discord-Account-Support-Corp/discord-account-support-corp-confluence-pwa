const CACHE_NAME = 'pwa-cache-v1';
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install event - cache app shell files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keyList =>
        Promise.all(
          keyList.map(key => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch event - respond with cached resources or fetch from network
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request)
          .then(networkResponse => {
            // Cache the new resource for future use
            return caches.open(CACHE_NAME).then(cache => {
              // Avoid caching opaque responses (e.g. cross-origin without CORS)
              if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            });
          });
      }).catch(() => {
        // Optionally return fallback offline page or image here
        if (event.request.destination === 'document') {
          return caches.match('/offline.html');
        }
      })
  );
});
