// ✅ أفضل حل لمشروع HR System
const CACHE_NAME = 'hr-system-v1';
const urlsToCache = [
  '.',
  'index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // هذه الجملة فقط مفيدة
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => new Response('⚠️ لا يوجد اتصال بالإنترنت', { status: 503 }))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
