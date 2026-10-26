// Service worker – أركان التفاعلي
const VERSION = 'arkan-v33-reauth';
const CORE = ['./install.js', './arkan-protect.js', './arkan-track.js', './icons/favicon-v5.ico', './icons/maskable-v5-192.png', './experience.css?v=20261023', './experience.js?v=20261023', './', './index.html', './tutor-ui.js', './teacher-review.js?v=1', './manifest.webmanifest',
  './icons/icon-v5-192.png', './icons/icon-v5-512.png', './icons/maskable-v5-512.png', './icons/apple-touch-icon-v5.png', './icons/favicon-v5-32.png', './img/logo-scene.jpg', './img/arch-light.jpg', './img/mosque-blue.jpg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // الصفحة: الشبكة أولاً (لتصلك التحديثات) ثم النسخة المخزنة عند انقطاع الإنترنت
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put('./index.html', copy));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // ملفات الحماية والتثبيت: من المخزن دائماً حتى بدون إنترنت (مع تجاهل أي query)
  if (url.origin === location.origin && (url.pathname === '/arkan-protect.js' || url.pathname === '/install.js' || url.pathname === '/arkan-track.js')) {
    e.respondWith(
      caches.match(req, { ignoreSearch: true }).then(hit => {
        const net = fetch(req).then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then(c => c.put(url.pathname, copy));
          }
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    );
    return;
  }

  // الخطوط والملفات الثابتة: من المخزن أولاً مع تحديث في الخلفية
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (isFont || url.origin === location.origin) {
    e.respondWith(
      caches.match(req).then(hit => {
        const net = fetch(req).then(res => {
          if (res && (res.ok || res.type === 'opaque')) {
            const copy = res.clone();
            caches.open(VERSION).then(c => c.put(req, copy));
          }
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    );
  }
});
