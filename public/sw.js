// Service Worker for Funknime PWA
// IMPORTANT: bump CACHE_VERSION on every release. Both the precache and the
// runtime cache key derive from it, so old caches are wiped on activation.
const CACHE_VERSION = 'v3';
const CACHE_NAME = `funknime-${CACHE_VERSION}`;
const RUNTIME_CACHE = `funknime-runtime-${CACHE_VERSION}`;

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
];

// Install — cache shell, then take over immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate — purge any cache that doesn't match the current version
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Helpers
const isHashedAsset = (url) => /\/assets\/.+\.[a-f0-9]{8,}\.\w+$/i.test(url.pathname);
const isStaticExt = (pathname) =>
  /\.(js|mjs|css|png|jpg|jpeg|svg|gif|webp|woff2?)$/i.test(pathname);

// Fetch — strategy depends on request type:
// - navigation HTML → network-first (so users see new releases ASAP)
// - hashed assets   → cache-first (immutable URLs are safe to cache forever)
// - other GET       → cache-first with background revalidate
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) return;

  // NEVER cache API endpoints or sitemap/robots — they must hit network fresh
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname === '/sitemap.xml' ||
    url.pathname === '/robots.txt'
  ) {
    return;
  }

  // Navigation requests — network-first, fall back to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // Update cached shell so offline users get latest snapshot
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          }
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets — cache-first with background update
  if (isStaticExt(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchAndUpdate = fetch(request)
          .then((res) => {
            if (res && res.ok && res.status === 200) {
              const copy = res.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                // Hashed assets are safe to keep; non-hashed also fine because
                // we drop the whole runtime cache on every version bump.
                cache.put(request, copy);
              });
            }
            return res;
          })
          .catch(() => cached);

        return cached || fetchAndUpdate;
      })
    );
  }
});
