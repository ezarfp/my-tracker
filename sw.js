const CACHE_NAME = 'ezar-tracker-v7.3';
const ASSETS = ['./', './index.html', './css/style.css', './js/config.js', './js/storage.js', './js/finance.js', './js/academic.js', './js/routine.js', './js/pdf.js', './js/app.js', './manifest.json', './icon.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});