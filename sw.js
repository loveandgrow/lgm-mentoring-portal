// LGM Mentoring Portal — Service Worker
// Caches the app for offline use and ensures fresh updates are picked up

const CACHE = 'lgm-v1';
const ASSETS = ['/'];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c) { return c.addAll(ASSETS); })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // For the main HTML page — always try network first, fall back to cache
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(function(res) {
          // Update cache with fresh version
          var clone = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
          return res;
        })
        .catch(function() {
          return caches.match(e.request);
        })
    );
    return;
  }
  // For other requests — network first, cache fallback
  e.respondWith(
    fetch(e.request).catch(function() { return caches.match(e.request); })
  );
});
