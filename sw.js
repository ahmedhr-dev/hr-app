const CACHE_NAME = 'hr-system-v1';
const urlsToCache = [
  '.',
  'index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// تثبيت Service Worker وتخزين الملفات في الكاش
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// استرجاع الملفات من الكاش عند الطلب
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // إذا وجد الملف في الكاش، قم بإرجاعه
        if (response) {
          return response;
        }
        // وإلا، قم بتحميله من الشبكة
        return fetch(event.request);
      })
  );
});

// تحديث الـ Service Worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
