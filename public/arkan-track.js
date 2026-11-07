/* تسجيل الطالب بالاسم والمدرسة والصف والرقم السري، ثم متابعة الاستخدام. */
(function () {
  'use strict';
  if (window.__arkanTrack) return; window.__arkanTrack = true;
  var UK = 'arkan_user_v3', QK = 'arkan-trackq-v2', DK = 'arkan-did-v2';
  var GRADE = 'الصف الثاني عشر';
  function g(k) { try { return localStorage.getItem(k); } catch (x) { return null; } }
  function s(k, v) { try { localStorage.setItem(k, v); } catch (x) {} }
  function user() { try { return JSON.parse(g(UK) || '{}') || {}; } catch (x) { return {}; } }
  var did = g(DK); if (!did) { did = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); s(DK, did); }
  var Q; try { Q = JSON.parse(g(QK) || '[]'); } catch (x) { Q = []; } if (!Array.isArray(Q)) Q = [];
  var nudged = false;
  function nudge() {
    if (nudged) return; nudged = true;
    var b = document.createElement('div'); b.setAttribute('role', 'status');
    b.textContent = '💬 ناقش أخطاءك مع المعلم الذكي عبر الزر 🎓';
    b.style.cssText = 'position:fixed;bottom:84px;left:50%;transform:translateX(-50%);z-index:40;background:#0B7C82;color:#fff;padding:10px 14px;border-radius:12px;font-size:14px;direction:rtl;box-shadow:0 4px 16px rgba(0,0,0,.25);max-width:92%;cursor:pointer';
    b.onclick = function () { var t = document.getElementById('arkanTutor'), k = document.getElementById('arkanTutorBtn'); if (t && t.hidden && k) k.click(); else if (t) t.hidden = false; b.remove(); };
    document.body.appendChild(b); setTimeout(function () { b.remove(); }, 10000);
  }
  function ev(t, o) { var e = o || {}; if (e.ok === false || (t === 'test_done' && e.pc < 70)) setTimeout(nudge, 1500); e.t = t; e.ts = Date.now(); Q.push(e); if (Q.length > 400) Q.splice(0, Q.length - 400); s(QK, JSON.stringify(Q)); }
  var busy = false;
  function flush(beacon) {
    var u = user();
    if (!Q.length || !u.name || !u.school || !u.grade || !u.vf || busy) return;
    var batch = Q.slice(0, 80);
    var body = JSON.stringify({ gen: 3, did: did, name: u.name, school: u.school, grade: u.grade, ev: batch });
    var done = function () { Q.splice(0, batch.length); s(QK, JSON.stringify(Q)); };
    if (beacon && navigator.sendBeacon) { if (navigator.sendBeacon('/api/track', new Blob([body], { type: 'text/plain' }))) done(); return; }
    busy = true;
    fetch('/api/track', { method: 'POST', body: body, keepalive: true, headers: { 'content-type': 'text/plain' } })
      .then(function (r) { if (r.ok || r.status === 400 || r.status === 403) done(); })
      .catch(function () {}).then(function () { busy = false; });
  }
  setInterval(function () { flush(false); }, 15000);
  document.addEventListener('visibilitychange', function () { if (document.hidden) flush(true); });
  window.addEventListener('pagehide', function () { flush(true); });
  window.addEventListener('arkan-level', function (e) { var r = e.detail || {}; ev('level_done', { sec: r.sec || secTitle(), lv: r.lv, pc: r.pc }); setTimeout(function () { flush(false); }, 900); });
  window.addEventListener('arkan-shot', function (e) { ev('screenshot', { sec: secTitle(), kind: (e.detail && e.detail.kind) || '' }); setTimeout(function () { flush(false); }, 600); });

  function nz(x) {
    return String(x || '').toLowerCase().replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
      .replace(/[^\u0621-\u064Aa-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
      .split(' ').filter(function (w) { return w !== 'مدرسه' && w !== 'school'; }).map(function (w) { return w.length > 3 && w.indexOf('ال') === 0 ? w.slice(2) : w; }).join(' ');
  }
  var SCH = {}; (window.ARKAN_QA_SCHOOLS || []).forEach(function (n) { SCH[nz(n)] = n; });
  var BAD = ['test', 'tester', 'testing', 'asdf', 'qwerty', 'xxx', 'admin', 'user', 'fake', 'name', 'student', 'none', 'null', 'abc', 'طالب', 'طالبه', 'اسم', 'الاسم', 'وهمي', 'تجريبي', 'تجربه', 'تست', 'مستخدم', 'لا يوجد', 'بدون', 'فلان', 'علان', 'مجهول', 'اختبار'];
  function nameErr(n) {
    if (n.length < 5 || n.split(' ').length < 2) return 'اكتب اسمك الحقيقي الكامل (اسمك واسم أبيك على الأقل)';
    var letters = n.replace(/[\s\-']/g, ''), ar = (letters.match(/[\u0621-\u064A]/g) || []).length;
    if (/[0-9٠-٩@#$%^&*_=+<>\/\\|!?.,;:()\[\]{}~`"]/.test(n)) return 'يجب أن يتكوّن الاسم من حروف فقط، دون أرقام أو رموز';
    if (ar < letters.length * 0.8) return 'اكتب اسمك الحقيقي بالعربي (كما هو في البطاقة الشخصية)';
    if (/(.)\1\1/.test(letters)) return 'يبدو أن هذا الاسم غير حقيقي؛ يُرجى كتابة اسمك الصحيح';
    var w = nz(n).split(' '), parts = w.filter(function (x) { return ['بن', 'بنت', 'ابن', 'ال', 'ابو', 'ام'].indexOf(x) < 0; });
    for (var i = 0; i < BAD.length; i++) { var b = nz(BAD[i]); if (w.indexOf(b) >= 0 || nz(n) === b) return 'هذا الاسم وهمي أو تجريبي؛ يُرجى كتابة اسمك الحقيقي الكامل'; }
    if (parts.length < 2 || parts.some(function (x) { return x.length < 2; })) return 'اكتب اسمك الحقيقي الكامل (اسمك واسم أبيك على الأقل)';
    return '';
  }
  function schoolLooksReal(raw) {
    if (raw.length < 4 || raw.length > 90) return false;
    if (!/[A-Za-z\u0621-\u064A]/.test(raw)) return false;
    if (/(.)\1{4,}/.test(raw.replace(/\s/g, ''))) return false;
    var n = nz(raw);
    if (!n || n.length < 3) return false;
    if (BAD.indexOf(n) >= 0 || n === 'مدرسه' || n === 'school') return false;
    return true;
  }
  function acceptSchool(v) {
    var raw = String(v || '').replace(/\s+/g, ' ').trim();
    if (!raw) return '';
    if (SCH[nz(raw)]) return SCH[nz(raw)];
    if (!schoolLooksReal(raw)) return '';
    return raw;
  }
  window.arkanNameErr = nameErr;
  window.arkanSchoolOk = acceptSchool;
  window.arkanSaveUser = function (n, sc, gr, opt) {
    opt = opt || {};
    var prev = user(), o = Object.assign({}, prev, { name: n, school: sc, grade: gr, vf: true, at: Date.now() });
    o.pinSet = !!opt.pinSet || (!!prev.pinSet && prev.name === n && prev.school === sc && prev.grade === gr);
    if (opt.consent) { o.consent = true; o.consentAt = prev.consentAt || Date.now(); }
    s(UK, JSON.stringify(o));
    ev(opt.evt || 'register', { sec: sc, item: gr });
    // Never block login/register UI on analytics — caller may pass skipFlush:true and beacon later.
    if (!opt.skipFlush) flush(!!opt.beacon);
    try { window.dispatchEvent(new StorageEvent('storage', { key: UK })); } catch (x) {}
  };
  window.arkanUser = user;

  function digits(v) { return window.arkanPin ? window.arkanPin.digits(v) : String(v || '').replace(/\D/g, ''); }

  function askName() {
    if(window.arkanPin && window.arkanPin.logged())return;
    if(/\/(branches|home|account)\.html$/.test(location.pathname))return;
    location.replace('/branches.html?next='+encodeURIComponent(location.pathname+location.search+location.hash));
  }
  function secTitle() { var h = document.querySelector('#main .stitle'); return h ? h.textContent.trim() : ''; }
  function itemInfo(el) {
    var c = el && el.closest('.item, .tq'); if (!c) return { item: '', q: '' };
    var n = c.querySelector('.inum'), q = c.querySelector('.qt');
    return { item: n ? n.textContent.trim() : '', q: q ? q.textContent.trim().slice(0, 140) : '' };
  }
  var lastSec = '';
  function onRoute() { setTimeout(function () { var t = secTitle(); if (t && t !== lastSec) { lastSec = t; ev('open', { sec: t }); } }, 120); }
  window.addEventListener('hashchange', onRoute);
  document.addEventListener('click', function (e) {
    var t = e.target;
    var cf = t.closest && t.closest('[data-confirm]');
    if (cf) {
      var p = cf.dataset.confirm.split(':'), w = document.querySelector('.opts[data-id="' + p[0] + '"][data-qi="' + p[1] + '"]');
      if (w && !w.classList.contains('locked') && w.dataset.sel !== '' && w.dataset.sel != null) {
        var i = itemInfo(w); ev('mcq', { sec: secTitle(), item: i.item, q: i.q, ok: +w.dataset.sel === +w.dataset.key });
      }
      return;
    }
    var tc = t.closest && t.closest('[data-tconfirm]');
    if (tc) {
      var w2 = document.querySelector('.tq .opts');
      if (w2 && !w2.classList.contains('locked') && w2.dataset.sel) { var i2 = itemInfo(w2); ev('test_q', { sec: secTitle(), item: i2.item, q: i2.q, ok: +w2.dataset.sel === +w2.dataset.key }); }
      return;
    }
    var sg = t.closest && t.closest('[data-sg]');
    if (sg) { var i3 = itemInfo(sg); ev('self_grade', { sec: secTitle(), item: i3.item, q: i3.q, ok: +sg.dataset.sg > 0 }); return; }
    var nx = t.closest && t.closest('[data-tnext]');
    if (nx && /النتيجة/.test(nx.textContent)) {
      var sec = secTitle();
      setTimeout(function () { var b = document.querySelector('.tres .ring b'); if (b) ev('test_done', { sec: sec, pc: parseInt(b.textContent, 10) || 0 }); flush(false); }, 250);
    }
  }, true);

  function init() {
    var legacy = document.getElementById('lk');
    if (legacy && !document.body.hasAttribute('data-arkan-v2')) legacy.remove();
    askName();
    if (g('arkan-idle-locked')) { ev('idle_lock'); try { localStorage.removeItem('arkan-idle-locked'); } catch (x) {} }
    if (window.arkanPin && window.arkanPin.logged()) { ev('session'); onRoute(); flush(false); }
  }
  function start() {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  }
  if (!window.arkanPin) {
    var ps = document.createElement('script');
    ps.src = '/arkan-pin.js?v=194';
    ps.onload = start;
    (document.head || document.documentElement).appendChild(ps);
  } else start();
})();
