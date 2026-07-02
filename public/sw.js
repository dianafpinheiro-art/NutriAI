const CACHE_NAME = "nutriai-cache-v6";
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
  // are NOT handled by the Service Worker. Let the browser handle them naturally on the network.
  if (e.request.method !== "GET" && e.request.method !== "HEAD") {
    return;
  }

  // Determine if the asset is structural/dynamic (HTML, JS, TS, TSX, CSS, JSON config)
  // or purely static media/design files (Images, Fonts, SVG)
  const isDocOrScript = 
    url.pathname === "/" ||
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".tsx") ||
    url.pathname.endsWith(".ts") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".json");

  if (isDocOrScript) {
    // 3. Network-First with Cache fallback strategy
    e.respondWith(
      fetch(e.request)
        .then((networkRes) => {
          if (networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
          }
          return networkRes;
        })
        .catch(() => {
          return caches.match(e.request).then((cachedRes) => {
            if (cachedRes) {
              return cachedRes;
            }
            // Dynamic SPA Routing fallback
            if (url.pathname !== "/" && !url.pathname.includes(".")) {
              return caches.match("/");
            }
          });
        })
    );
  } else {
    // 4. Cache-First with Network background sync for media, images, and fonts
    e.respondWith(
      caches.match(e.request).then((cachedRes) => {
        if (cachedRes) {
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
  }
});
