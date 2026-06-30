// SF2e Character Sheet — Service Worker
// Network-first strategy: always tries to fetch the latest version when
// online, and only serves the cached copy when offline. This means you
// never need to manually bump a cache-version string — pushing new HTML
// to GitHub is enough; the next time the app is opened with internet
// access, it will fetch and cache the new version automatically.

const CACHE_NAME = 'sf2e-cache';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Allow the page to tell a waiting service worker to activate immediately
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Got a fresh copy — cache it for offline use and return it
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return networkResponse;
      })
      .catch(() => {
        // Offline — fall back to whatever we have cached
        return caches.match(event.request);
      })
  );
});
