const CACHE = 'hzauto-jobcards-v2-noserver';
const CORE = [
  './',
  './index.html',
  './assets/css/app.css?v=2',
  './assets/js/app.js?v=2',
  './assets/img/hz-auto-logo.png',
  './assets/img/icon-192.png',
  './assets/img/icon-512.png',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => cached))
  );
});
