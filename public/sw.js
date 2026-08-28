// LocketWeb Progressive Service Worker for Ultra-Fast Media Caching & Offline Support

const CACHE_NAME = 'locket-media-v1';
const MEDIA_URL_PATTERN = /\/storage\/v1\/object\/public\/|api\.dicebear\.com|images\.unsplash\.com/;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Intercept media assets (Supabase Storage, Avatars, etc.)
  if (event.request.method === 'GET' && MEDIA_URL_PATTERN.test(url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            // Serve cached media instantly, update cache in background
            fetch(event.request).then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
              }
            }).catch(() => {});
            return cachedResponse;
          }

          // Fetch from network and cache for offline usage
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Return fallback if completely offline
            return new Response('', { status: 504, statusText: 'Offline Media Unavailable' });
          });
        });
      })
    );
  }
});
