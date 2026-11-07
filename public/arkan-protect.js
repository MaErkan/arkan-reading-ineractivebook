/* حماية كتاب أركان التفاعلي — © محمد أركان. جميع الحقوق محفوظة.
   ملاحظة: هذه الحماية رادعة وليست مطلقة؛ العلامة المائية هي الأقوى لتتبع التسريب. */
(function () {
  'use strict';
  if (window.__arkanProtect) return;
  window.__arkanProtect = true;
  var OWNER = '© أركان التفاعلي في القراءة — محمد أركان';
  var IDLE_LOCK_MS = 5 * 60 * 1000; // قفل تلقائي بعد 5 دقائق بلا نشاط
  var UNLOCK_KEY = 'arkan-unlock-v2', ACT_KEY = 'arkan-last-active';

  // أنماط المنع: التحديد، السحب، الطباعة
  var css = document.createElement('style');
  css.textContent =
    'body{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}' +
    'input,textarea,[contenteditable]{-webkit-user-select:text;user-select:text}' +
    'img{-webkit-user-drag:none}' +
    '@media print{body{display:none!important}}' +
    '#wm{position:fixed;inset:0;z-index:2147483647;pointer-events:none;overflow:hidden;opacity:.04;' +
    'font:700 16px sans-serif;color:#000;display:flex;flex-wrap:wrap;align-content:flex-start}' +
    '#wm span{width:260px;padding:38px 0;transform:rotate(-24deg);white-space:nowrap;text-align:center}' +
    '#cover{position:fixed;inset:0;background:#000;z-index:2147483646;display:none}' +
    'html.arkan-hide body>*:not(#cover):not(#arkReg){visibility:hidden!important}' +
    'img,video,canvas{-webkit-touch-callout:none;pointer-events:auto}' +
    '#lkC{margin-top:12px;font-size:14.5px;font-weight:700;color:#4B6A6D}#lkC a{color:#0B7C82;text-decoration:underline}';
  (document.head || document.documentElement).appendChild(css);

  // اسم/بريد الطالب من localStorage — يُعامل كنص فقط (لا innerHTML) لمنع XSS
  function who() {
    try {
      var u = JSON.parse(localStorage.getItem('arkan_user_v3') || '{}') || {};
      var n = typeof u.name === 'string' ? u.name : '';
      var e = typeof u.school === 'string' ? u.school : '';
      return (n + ' ' + e).replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 120).trim();
    } catch (x) { return ''; }
  }
  function watermark() {
    var old = document.getElementById('wm'); if (old) old.remove();
    var d = document.createElement('div'); d.id = 'wm';
    d.setAttribute('aria-hidden', 'true');
    d.setAttribute('role', 'presentation');
    try { d.inert = true; } catch (e) {}
    var t = (who() + ' ' + OWNER).trim();
    for (var i = 0; i < 100; i++) {
      var s = document.createElement('span');
      s.setAttribute('aria-hidden', 'true');
      s.setAttribute('role', 'presentation');
      s.textContent = t;
      d.appendChild(s);
    }
    document.body.appendChild(d);
  }
  var offT = null;
  function cover(on) {
    var c = document.getElementById('cover');
    clearTimeout(offT);
    if (on) {
      if (c) c.style.display = 'block';
      document.documentElement.classList.add('arkan-hide');
      // أمان: لا تبقى الشاشة سوداء أبداً والصفحة ظاهرة
      offT = setTimeout(function () { if (!document.hidden) cover(false); }, 1200);
    } else {
      // تأخير بسيط قبل الإظهار حتى لا تلتقط لقطة الشاشة المحتوى لحظة الرجوع
      offT = setTimeout(function () {
        if (document.hidden) return;
        if (c) c.style.display = 'none';
        document.documentElement.classList.remove('arkan-hide');
      }, 350);
    }
  }

  // ===== القفل التلقائي بعد الخمول =====
  function unlocked() { return document.documentElement.dataset.arkanOpen === '1'; }
  function stamp() { try { localStorage.setItem(ACT_KEY, String(Date.now())); } catch (x) {} }
  function lastActive() { try { return +localStorage.getItem(ACT_KEY) || 0; } catch (x) { return 0; } }
  function lockNow() {
    try {
      localStorage.removeItem(UNLOCK_KEY);
      localStorage.removeItem('arkan_session_v1');
      localStorage.removeItem(ACT_KEY);
      localStorage.setItem('arkan-idle-locked', '1');
      localStorage.setItem('arkan-force-pin', String(Date.now()));
    } catch (x) {}
    cover(true);
    location.reload();
  }
  var lastStamp = 0;
  function activity() {
    if (!unlocked()) return;
    var n = Date.now();
    if (lastActive() && n - lastActive() > IDLE_LOCK_MS) { lockNow(); return; }
    if (n - lastStamp > 5000) { lastStamp = n; stamp(); }
  }
  function checkIdle() {
    if (!unlocked()) return;
    var la = lastActive();
    if (!la) { stamp(); return; }
    if (Date.now() - la > IDLE_LOCK_MS) lockNow();
  }
  ['pointerdown', 'touchstart', 'keydown', 'scroll', 'wheel', 'mousemove'].forEach(function (ev) {
    window.addEventListener(ev, activity, { capture: true, passive: true });
  });
  setInterval(checkIdle, 15000);
  // تبويب آخر قفل الكتاب
  window.addEventListener('storage', function (e) {
    if ((e.key === 'arkan_session_v1' || e.key === 'arkan-force-pin') && unlocked()) location.reload();
  });

  function init() {
    if (!document.getElementById('cover')) {
      var c = document.createElement('div'); c.id = 'cover'; c.setAttribute('aria-hidden', 'true');
      document.body.appendChild(c);
    }
    watermark();
    checkIdle();
    // إعادة بناء العلامة لو حذفها أحد من أدوات المتصفح
    new MutationObserver(function () {
      if (!document.getElementById('wm')) watermark();
      if (!document.getElementById('cover')) { var c = document.createElement('div'); c.id = 'cover'; document.body.appendChild(c); }
    }).observe(document.body, { childList: true });
    // تحديث العلامة عند تسجيل الدخول في تبويب آخر
    window.addEventListener('storage', function (e) { if (e.key === 'arkan_user_v3') watermark(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  function editable(t) {
    if (!t || t.nodeType !== 1) return false;
    var tag = (t.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || t.isContentEditable;
  }
  // منع القائمة اليمنى والنسخ والقص والسحب (عدا حقول الإدخال)
  ['contextmenu', 'copy', 'cut', 'dragstart', 'selectstart'].forEach(function (ev) {
    document.addEventListener(ev, function (e) {
      if (ev !== 'dragstart' && editable(e.target)) return;
      e.preventDefault();
    }, true);
  });

  // اختصارات: F12 / عرض المصدر / حفظ / طباعة / أدوات المطور / PrintScreen
  function keys(e) {
    var k = (e.key || '').toLowerCase(), m = e.ctrlKey || e.metaKey;
    if (e.key === 'F12' || e.key === 'PrintScreen' ||
        (m && ['u', 's', 'p'].indexOf(k) > -1) ||
        (m && (e.shiftKey || e.altKey) && ['i', 'j', 'c', 's', 'k', '3', '4', '5'].indexOf(k) > -1)) {
      e.preventDefault(); e.stopPropagation();
      if (e.key === 'PrintScreen') {
        try { navigator.clipboard && navigator.clipboard.writeText(OWNER).catch(function () {}); } catch (x) {}
      }
      return false;
    }
  }
  document.addEventListener('keydown', keys, true);
  document.addEventListener('keyup', function (e) { if (e.key === 'PrintScreen') keys(e); }, true);

  // إخفاء المحتوى عند فقدان التركيز (يحدّ من تسجيل الشاشة ولقطات التبديل)
  document.addEventListener('visibilitychange', function () { cover(document.hidden); });
  window.addEventListener('blur', function () { cover(true); });
  window.addEventListener('pagehide', function () { cover(true); });
  window.addEventListener('pageshow', function () { checkIdle(); cover(false); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) checkIdle(); });
  // لمس بثلاثة أصابع (لقطة شاشة بالإيماءة على كثير من أجهزة أندرويد) أو ضغطة طويلة: تغطية فورية
  document.addEventListener('touchstart', function (e) {
    if (e.touches && e.touches.length >= 3) cover(true);
  }, { capture: true, passive: true });
  document.addEventListener('touchend', function (e) {
    if (!e.touches || e.touches.length === 0) cover(false);
  }, { capture: true, passive: true });
  // حالة احتياطية: لو فقدت الصفحة التركيز دون حدث blur
  setInterval(function () { if (document.hidden) cover(true); }, 1000);
  ['pointerdown', 'touchend', 'keydown', 'scroll'].forEach(function (ev) {
    window.addEventListener(ev, function (e) { if (!document.hidden && !(e.touches && e.touches.length >= 3)) cover(false); }, { capture: true, passive: true });
  });
  window.addEventListener('focus', function () { cover(false); });
  window.addEventListener('beforeprint', function () { cover(true); });
  window.addEventListener('afterprint', function () { cover(false); });

  // ===== رصد محاولات لقطة الشاشة وإبلاغ صاحب الكتاب (أفضل جهد) =====
  var SHOT_GAP = 45000, lastShot = 0, hidAt = 0;
  function shot(kind) {
    if (!unlocked()) return;
    var n = Date.now(); if (n - lastShot < SHOT_GAP) return; lastShot = n;
    try { window.dispatchEvent(new CustomEvent('arkan-shot', { detail: { kind: kind } })); } catch (x) {}
  }
  window.__arkanShot = shot;
  document.addEventListener('keydown', function (e) {
    var k = (e.key || '').toLowerCase();
    if (e.key === 'PrintScreen' || (e.metaKey && e.shiftKey && ['3', '4', '5', 's'].indexOf(k) > -1)) shot('keyboard');
  }, true);
  document.addEventListener('keyup', function (e) { if (e.key === 'PrintScreen') shot('keyboard'); }, true);
  document.addEventListener('touchstart', function (e) { if (e.touches && e.touches.length >= 3) shot('three_finger'); }, { capture: true, passive: true });
  // اختفاء قصير ثم رجوع خلال ثوانٍ (مسار شائع للقطات الموبايل/أدوات القص)
  function gone() { if (!hidAt) hidAt = Date.now(); }
  function back() { if (hidAt) { var d = Date.now() - hidAt; hidAt = 0; if (d > 80 && d < 3500) shot('focus_flash'); } }
  document.addEventListener('visibilitychange', function () { if (document.hidden) gone(); else back(); });
  window.addEventListener('blur', gone);
  window.addEventListener('focus', back);
})();
