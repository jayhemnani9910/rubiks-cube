const CACHE_NAME = "rubiks-cube-v9";
// Static assets that don't change (images, icons)
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./favicon.ico",
  "./assets/main.png",
  "./assets/cube.png",
  "./assets/flat.png",
  "./assets/icons/icon-192.svg",
  "./assets/icons/icon-512.svg",
  "./data/leaderboard.json",
  "./data/tutorial.json"
];

// Check if request is for a hashed asset (Vite-generated)
const isHashedAsset = (url) => {
  const pathname = new URL(url).pathname;
  return pathname.includes("/assets/") && /\.[a-f0-9]{8}\.(js|css)$/i.test(pathname);
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);
  if (url.pathname.endsWith("/sw.js") || url.pathname.endsWith("sw.js")) {
    return;
  }

  const accepts = event.request.headers.get("accept") || "";
  const isHtml = event.request.mode === "navigate" || accepts.includes("text/html");

  // Network-first for HTML (ensures fresh content)
  if (isHtml) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", responseClone));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Hashed assets are immutable - cache-first is perfect
  if (isHashedAsset(event.request.url)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(event.request).then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return response;
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for other assets (images, data files)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => cached || caches.match("./index.html"));

      return cached || fetchPromise;
    })
  );
});
