// Service worker – أركان التفاعلي (نسخة خفيفة)
const VERSION = 'arkan-v185-ui-fixes';
const CORE = ['./arkan-news.js', './arkan-ticker.js', './arkan-ticker.css', './', './index.html', './branches.html', './manifest.webmanifest', './install.js', './arkan-protect.js', './arkan-track.js', './arkan-auth.js?v=1', './arkan-pin.js', './qa-schools.js', './arkan-score.js?v=2', './portal-nav.js', './arkan-ai-notice.js?v=140', './arkan-theme.js', './arkan-resume.js?v=1', './arkan-theme.css', './arkan-portal-theme.css?v=4', './arkan-mihrab-landing.css?v=3', './experience.css?v=20261028', './icons/favicon-v5.ico', './icons/favicon-v5-32.png', './icons/icon-v5-192.png', './icons/maskable-v5-192.png', './icons/apple-touch-icon-v5.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (/\.(mp4|m3u8|ts|mp3)$/i.test(url.pathname) || req.headers.has('range')) return; // الفيديو والصوت مباشرة
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)).catch(() => {}); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
    return;
  }
  // لا نخزّن الصور/الفيديو في كاش SW — يعتمد على CDN وكاش المتصفح لتتحمل الضغط
  if (/\.(png|jpe?g|webp|gif|svg|mp4|webm|ico)$/i.test(url.pathname) || url.pathname.startsWith('/img/')) {
    e.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }
  // network-first js so widgets pick up name/badge fixes
  if (/\.js$/i.test(url.pathname)) {
    e.respondWith(fetch(req).then(res => {
      if (res && res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)).catch(() => {}); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true })));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(res => {
      if (res && res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)).catch(() => {}); }
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
