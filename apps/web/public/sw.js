const CACHE_NAME = 'sultan-kebab-pos-v2';
const STATIC_ASSETS = [
  '/',
  '/login',
];

// Install — cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — hapus cache lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fallback cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // Only cache http(s) requests, not chrome-extension or other schemes
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;
  if (url.pathname.includes('manifest')) return;
  
  event.respondWith(
    fetch(event.request)
      .then(res => {
        const clone = res.clone();
        if (res && res.status === 200 && res.type !== 'error') {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone).catch(err => {
              // Silently ignore caching errors for edge cases
            });
          });
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
