// ========================================
// Service Worker لتطبيق HR System
// مع آلية التحديث التلقائي الكاملة
// ========================================

const CACHE_NAME = 'hr-system-v4';

const urlsToCache = [
  '.',
  'index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/webfonts/fa-solid-900.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/webfonts/fa-regular-400.woff2'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
  console.log('[SW] جاري تثبيت Service Worker...');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] تم تخزين الملفات في الكاش');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('[SW] خطأ في تخزين الملفات:', err);
      })
  );
});

// استراتيجية متقدمة: Cache First ثم Network مع تحديث الخلفية
self.addEventListener('fetch', event => {
  // نستثني طلبات API لأنها ديناميكية
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('localhost') ||
      event.request.method !== 'GET') {
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
        return caches.match('offline.html').then(response => {
          return response || new Response('⚠️ لا يوجد اتصال بالإنترنت', { 
            status: 503,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        });
      })
  );
});

// تنظيف الكاش القديم وإرسال إشعار التحديث
self.addEventListener('activate', event => {
  console.log('[SW] جاري تفعيل Service Worker...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] جاري حذف الكاش القديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] تم تفعيل Service Worker بنجاح');
      
      // إرسال رسالة لجميع الصفحات المفتوحة لتحديث نفسها
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'UPDATE_AVAILABLE',
            version: CACHE_NAME,
            timestamp: new Date().getTime()
          });
        });
      });
    }).then(() => {
      // السيطرة على الصفحات المفتوحة فوراً
      return self.clients.claim();
    })
  );
});

// استماع لرسائل من الصفحة الرئيسية
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] جاري تخطي انتظار الـ Service Worker');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[SW] جاري مسح الكاش بالكامل');
    caches.delete(CACHE_NAME).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});
