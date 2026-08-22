// LGM Mentoring Portal — Service Worker v2
// Network-first strategy: always tries to get fresh content

const CACHE = 'lgm-cache-v2';

self.addEventListener('install', function(e) {
  self.skipWaiting(); // activate immediately
});

self.addEventListener('activate', function(e) {
  // Delete ALL old caches on activate
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) {
        console.log('Deleting old cache:', k);
        return caches.delete(k);
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  // ALWAYS go to network first — never serve stale HTML
  e.respondWith(
    fetch(e.request)
      .then(function(response) {
        // Only cache successful responses
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      })
      .catch(function() {
        // Only fall back to cache when truly offline
        return caches.match(e.request);
      })
  );
});
