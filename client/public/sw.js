const CACHE_NAME = "say-it-english-v2-" + new Date().getTime(); // Dynamic version to force update
const STATIC_ASSETS = ["/", "/index.html", "/offline.html"];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting(); // Force activation
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
            )
        )
    );
    self.clients.claim(); // Take control immediately
});

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // 1. Navigation (HTML): Network First, fall back to Cache
    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request)
                .then((res) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, res.clone());
                        return res;
                    });
                })
                .catch(() => caches.match(event.request) || caches.match("/offline.html"))
        );
        return;
    }

    // 2. API: Network First, fall back to Cache (if applicable)
    if (url.pathname.startsWith("/api/")) {
        event.respondWith(
            fetch(event.request)
                .then((res) => res) // Don't cache API by default unless you want stale data
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // 3. Static Assets (JS, CSS, Images): Cache First, fall back to Network
    event.respondWith(
        caches.match(event.request).then((cached) => {
            return cached || fetch(event.request).then((res) => {
                // Optionally cache new assets
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, res.clone());
                    return res;
                });
            });
        })
    );
});
