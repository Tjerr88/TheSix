const CACHE_NAME = "the-six-pwa-v36";
const APP_SHELL = [
  "./",
  "./index.html",
  "./skill-practice.js", "./sfg2-ui.js", "./badge-sfg2.png", "./milestones-engine.js", "./milestones-ui.js", "./milestones.css",
  "./badge-timed-sinister.png",
  "./badge-timed-solid.png",
  "./badge-timed-simple.png",
  "./badge-timeless-sinister.png",
  "./badge-timeless-solid.png",
  "./badge-timeless-simple.png",
  "./badge-half-bw-press.png",
  "./badge-super-sinister.png",
  "./badge-super-sfg.png",
  "./badge-sfg-plus.png",
  "./badge-sfg.png",
  "./standard-ui.js", "./escape-ui.js",
  "./standard-engine.js",
  "./tp-engine.js",
  "./compact-ui.js",
  "./day7.js",
  "./manifest.webmanifest",
  "./logo.png",
  "./background.png",
  "./background-mobile.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
