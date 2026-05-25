const CACHE_NAME = "nutriai-cache-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/src/main.tsx",
  "/src/App.tsx",
  "/src/index.css",
  "/src/types.ts"
];

// Install Event
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Strategy
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // For API endpoints, use Network-First
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          // Cache successful responses
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, resClone);
          });
          return res;
        })
        .catch(() => {
          // If network fails, serve from cache
          return caches.match(e.request).then((cachedRes) => {
            if (cachedRes) return cachedRes;
            // Fallback JSON
            return new Response(
              JSON.stringify({ error: "Indisponível no momento. Você está offline." }),
              { headers: { "Content-Type": "application/json" } }
            );
          });
        })
    );
  } else {
    // For general static layout files, default to Cache-First with Network feedback
    e.respondWith(
      caches.match(e.request).then((cachedRes) => {
        if (cachedRes) {
          // Fetch background update
          fetch(e.request).then((networkRes) => {
            if (networkRes.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkRes));
            }
          });
          return cachedRes;
        }
        return fetch(e.request);
      })
    );
  }
});
