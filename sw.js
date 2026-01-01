const CACHE_NAME = "rubiks-cube-v3";
const ASSETS = [
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
  "./data/tutorial.json",
  "./src/css/main.css",
  "./src/css/variables.css",
  "./src/css/components/parts.css",
  "./src/css/components/cube-3d.css",
  "./src/css/components/cube-2d.css",
  "./src/css/components/animations.css",
  "./src/js/main.js",
  "./src/js/state.js",
  "./src/js/cube.js",
  "./src/js/scramble.js",
  "./src/js/input.js",
  "./src/js/storage.js",
  "./src/js/utils.js",
  "./src/js/history.js",
  "./src/js/timer.js",
  "./src/js/settings.js",
  "./src/js/cubes.js",
  "./src/js/charts.js",
  "./src/js/stats.js",
  "./src/js/sessions.js",
  "./src/js/io.js",
  "./src/js/pwa.js",
  "./src/js/preview.js",
  "./src/js/leaderboard.js",
  "./src/js/tutorial.js",
  "./src/js/onboarding.js",
  "./src/js/sound.js",
  "./src/js/solver.js",
  "./src/wasm/solver-loader.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
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

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
