const CACHE_NAME = "nutriai-cache-v3";
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

// Skip Waiting via postMessage
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Fetch Strategy
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // 1. COMPLETELY BYPASS all API calls to avoid body stream locks/corruption in Safari
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // 2. Cache storage ONLY supports GET and HEAD requests. Non-GET requests (like POST)
  // are NOT handled by the Service Worker. Let the browser handle them naturally.
  if (e.request.method !== "GET" && e.request.method !== "HEAD") {
    return;
  }

  // For general static layout assets, use a robust Cache-First with Network feedback in the background
  e.respondWith(
    caches.match(e.request).then((cachedRes) => {
      if (cachedRes) {
        // Fetch background update to ensure fresh layout code on next visit
        fetch(e.request)
          .then((networkRes) => {
            if (networkRes.status === 200) {
              const resClone = networkRes.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
            }
          })
          .catch((err) => console.log("Background fetch update failed:", err));
        return cachedRes;
      }
      return fetch(e.request);
    })
  );
});
