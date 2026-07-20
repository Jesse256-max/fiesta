const CACHE_NAME = "technotrons-campus-cache-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/src/main.tsx",
  "/src/index.css",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
];

// Install event - cache shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Pre-caching core portal shell assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Purging legacy cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event handler with hybrid caching policy
self.addEventListener("fetch", (event) => {
  // Only intercept GET requests
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  // Network-First policy for critical API routes (faculty, clubs, events)
  if (requestUrl.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If response is valid, clone and save to cache
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          console.warn("[Service Worker] Offline detected. Retrieving cached dynamic endpoint:", requestUrl.pathname);
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return custom JSON error so client knows we are offline
            return new Response(
              JSON.stringify({
                error: "You are currently offline, and this resource has not been cached yet.",
                offline: true,
                cached: false
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" }
              }
            );
          });
        })
    );
  } else {
    // Cache-First policy for core web resources to load instantly
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          // Cache valid responses
          if (response && response.status === 200 && response.type === "basic") {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
    );
  }
});
