const CACHE_NAME = 'hr-system-v2';
const urlsToCache = [
  '.',
  'index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/webfonts/fa-solid-900.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/webfonts/fa-regular-400.woff2'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  self.skipWaiting(); // تفعيل الـ SW فوراً
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
});

// استراتيجية متقدمة: Cache First ثم Network مع تحديث الخلفية
self.addEventListener('fetch', event => {
  // نستثني طلبات API لأنها ديناميكية
  if (event.request.url.includes('/api/') || event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          // تحديث الكاش في الخلفية (stale-while-revalidate)
          fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, networkResponse.clone());
              });
            }
          }).catch(() => {});
          return response;
        }
        
        // إذا لم يكن في الكاش، نحاول من الشبكة
        return fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        });
      })
      .catch(() => {
        // إذا فشل كل شيء، نقدم صفحة خطأ مخصصة
        return caches.match('offline.html');
      })
  );
});

// تنظيف الكاش القديم عند تفعيل SW جديد
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated, claiming clients...');
      return self.clients.claim(); // يسيطر على الصفحات المفتوحة فوراً
    })
  );
});
