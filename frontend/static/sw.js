// Service Worker for vec2art Gallery Caching
const CACHE_VERSION = 'v1';
const CACHE_NAME = `vec2art-gallery-${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `vec2art-images-${CACHE_VERSION}`;

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/gallery/manifest.json'
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('vec2art-') && name !== CACHE_NAME && name !== IMAGE_CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Gallery images - Cache First strategy (1 year cache)
  if (url.pathname.includes('/gallery/before/') || 
      url.pathname.includes('/gallery/after-webp/') ||
      url.pathname.includes('/gallery/before-avif/') ||
      url.pathname.includes('/gallery/after-avif/')) {
    
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            // Return cached image
            return cachedResponse;
          }
          
          // Fetch and cache new image
          return fetch(event.request).then((response) => {
            // Only cache successful responses
            if (response.status === 200) {
              const responseClone = response.clone();
              cache.put(event.request, responseClone);
            }
            return response;
          });
        });
      })
    );
    return;
  }
  
  // API SVG endpoint - Network First with cache fallback
  if (url.pathname.startsWith('/api/svg/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful SVG responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Manifest.json - Network First with 24-hour cache
  if (url.pathname === '/gallery/manifest.json') {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return fetch(event.request)
          .then((response) => {
            // Update cache with fresh manifest
            if (response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Fallback to cached manifest if offline
            return cache.match(event.request);
          });
      })
    );
    return;
  }
  
  // Default - Network only for other requests
  event.respondWith(fetch(event.request));
});

// Message handler for cache management
self.addEventListener('message', (event) => {
  if (event.data.action === 'clearCache') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('vec2art-'))
            .map((name) => caches.delete(name))
        );
      }).then(() => {
        event.ports[0].postMessage({ status: 'Cache cleared' });
      })
    );
  }
  
  if (event.data.action === 'getCacheSize') {
    event.waitUntil(
      Promise.all([
        caches.open(CACHE_NAME),
        caches.open(IMAGE_CACHE_NAME)
      ]).then(([cache, imageCache]) => {
        return Promise.all([
          cache.keys(),
          imageCache.keys()
        ]);
      }).then(([cacheKeys, imageCacheKeys]) => {
        event.ports[0].postMessage({
          cacheSize: cacheKeys.length,
          imageCacheSize: imageCacheKeys.length,
          totalSize: cacheKeys.length + imageCacheKeys.length
        });
      })
    );
  }
});