/* حماية كتاب أركان التفاعلي — © محمد أركان. جميع الحقوق محفوظة.
   ملاحظة: هذه الحماية رادعة وليست مطلقة؛ العلامة المائية هي الأقوى لتتبع التسريب. */
(function () {
  'use strict';
  if (window.__arkanProtect) return;
  window.__arkanProtect = true;
  var OWNER = '© أركان التفاعلي في القراءة — محمد أركان';

  // أنماط المنع: التحديد، السحب، الطباعة
  var css = document.createElement('style');
  css.textContent =
    'body{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}' +
    'input,textarea,[contenteditable]{-webkit-user-select:text;user-select:text}' +
    'img{-webkit-user-drag:none}' +
    '@media print{body{display:none!important}}' +
    '#wm{position:fixed;inset:0;z-index:2147483647;pointer-events:none;overflow:hidden;opacity:.09;' +
    'font:700 16px sans-serif;color:#000;display:flex;flex-wrap:wrap;align-content:flex-start}' +
    '#wm span{width:260px;padding:38px 0;transform:rotate(-24deg);white-space:nowrap;text-align:center}' +
    '#cover{position:fixed;inset:0;background:#0b1f2a;z-index:2147483646;display:none}';
  (document.head || document.documentElement).appendChild(css);

  // اسم/بريد الطالب من localStorage — يُعامل كنص فقط (لا innerHTML) لمنع XSS
  function who() {
    try {
      var u = JSON.parse(localStorage.getItem('arkan_user') || '{}') || {};
      var n = typeof u.name === 'string' ? u.name : '';
      var e = typeof u.email === 'string' ? u.email : '';
      return (n + ' ' + e).replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 120).trim();
    } catch (x) { return ''; }
  }
  function watermark() {
    var old = document.getElementById('wm'); if (old) old.remove();
    var d = document.createElement('div'); d.id = 'wm';
    d.setAttribute('aria-hidden', 'true');
    var t = (who() + ' ' + OWNER).trim();
    for (var i = 0; i < 120; i++) {
      var s = document.createElement('span');
      s.textContent = t;
      d.appendChild(s);
    }
    document.body.appendChild(d);
  }
  function cover(on) { var c = document.getElementById('cover'); if (c) c.style.display = on ? 'block' : 'none'; }

  function init() {
    if (!document.getElementById('cover')) {
      var c = document.createElement('div'); c.id = 'cover'; c.setAttribute('aria-hidden', 'true');
      document.body.appendChild(c);
    }
    watermark();
    // إعادة بناء العلامة لو حذفها أحد من أدوات المتصفح
    new MutationObserver(function () {
      if (!document.getElementById('wm')) watermark();
      if (!document.getElementById('cover')) { var c = document.createElement('div'); c.id = 'cover'; document.body.appendChild(c); }
    }).observe(document.body, { childList: true });
    // تحديث العلامة عند تسجيل الدخول في تبويب آخر
    window.addEventListener('storage', function (e) { if (e.key === 'arkan_user') watermark(); });
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
  window.addEventListener('focus', function () { cover(false); });
  window.addEventListener('beforeprint', function () { cover(true); });
  window.addEventListener('afterprint', function () { cover(false); });
})();
