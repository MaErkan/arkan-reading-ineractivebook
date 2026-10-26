/* تسجيل الطالب باسمه + متابعة الاستخدام لصاحب الكتاب (أركان). لا يغيّر سلوك الكتاب. */
(function () {
  'use strict';
  if (window.__arkanTrack) return; window.__arkanTrack = true;
  var UK = 'arkan_user', QK = 'arkan-trackq', DK = 'arkan-did', CK = 'arkan-unlock-v1';
  function g(k) { try { return localStorage.getItem(k); } catch (x) { return null; } }
  function s(k, v) { try { localStorage.setItem(k, v); } catch (x) {} }
  function user() { try { return JSON.parse(g(UK) || '{}') || {}; } catch (x) { return {}; } }
  var did = g(DK); if (!did) { did = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); s(DK, did); }
  var Q; try { Q = JSON.parse(g(QK) || '[]'); } catch (x) { Q = []; } if (!Array.isArray(Q)) Q = [];
  var nudged = false;
  function nudge() {
    if (nudged) return; nudged = true;
    var b = document.createElement('a'); b.href = 'https://t.me/smart_arkanBot'; b.target = '_blank'; b.rel = 'noopener';
    b.textContent = '💬 ناقش أغلاطك مع البوت: ابعت إيميلك لـ @smart_arkanBot ثم اكتب «أغلاطي»';
    b.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:2147483640;background:#0B7C82;color:#fff;padding:10px 14px;border-radius:12px;font-size:14px;direction:rtl;text-decoration:none;box-shadow:0 4px 16px rgba(0,0,0,.25);max-width:92%';
    document.body.appendChild(b); setTimeout(function () { b.remove(); }, 12000);
  }
  function ev(t, o) { var e = o || {}; if (e.ok === false || (t === 'test_done' && e.pc < 70)) setTimeout(nudge, 1500); e.t = t; e.ts = Date.now(); Q.push(e); if (Q.length > 400) Q.splice(0, Q.length - 400); s(QK, JSON.stringify(Q)); }
  var busy = false;
  function flush(beacon) {
    var u = user(), code = g(CK);
    if (!Q.length || !u.name || !u.email || !code || busy) return;
    var batch = Q.slice(0, 80);
    var body = JSON.stringify({ did: did, name: u.name, email: u.email || '', phone: u.phone || '', code: code, ev: batch });
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

  window.addEventListener('arkan-shot', function (e) { ev('screenshot', { sec: secTitle(), kind: (e.detail && e.detail.kind) || '' }); setTimeout(function () { flush(false); }, 600); });

  // ===== التسجيل بالاسم (إلزامي) =====
  function askName() {
    var cu = user(); if ((cu.name && cu.email) || document.getElementById('arkReg')) return;
    var st = document.createElement('style');
    st.textContent = '#arkReg{position:fixed;inset:0;z-index:2147483645;background:rgba(10,40,42,.86);display:flex;align-items:center;justify-content:center;padding:18px;font-family:inherit}' +
      '#arkReg form{background:#fff;border-radius:18px;max-width:380px;width:100%;padding:22px;direction:rtl;text-align:right;box-shadow:0 10px 40px rgba(0,0,0,.3)}' +
      '#arkReg h3{margin:0 0 6px;color:#0B7C82;font-size:20px}#arkReg p{margin:0 0 14px;color:#4B6A6D;font-size:14px}' +
      '#arkReg input{width:100%;box-sizing:border-box;padding:12px;margin:0 0 10px;border:1.5px solid #cfe0e0;border-radius:10px;font-size:16px;user-select:text;-webkit-user-select:text}' +
      '#arkReg button{width:100%;padding:12px;border:0;border-radius:10px;background:#0B7C82;color:#fff;font-size:17px;font-weight:700}#arkReg .e{color:#b3261e;font-size:13px;min-height:18px}';
    document.head.appendChild(st);
    var d = document.createElement('div'); d.id = 'arkReg';
    d.innerHTML = '<form><h3>سجّل بياناتك</h3><p>اكتب اسمك الحقيقي الكامل وإيميلك ليتابع معلمك مستواك في الكتاب.</p>' +
      '<input id="arkRN" autocomplete="name" placeholder="الاسم الحقيقي الكامل" maxlength="60" required>' +
      '<input id="arkRM" type="email" inputmode="email" autocomplete="email" dir="ltr" placeholder="البريد الإلكتروني (إلزامي)" maxlength="80" required>' +
      '<input id="arkRP" type="tel" inputmode="tel" placeholder="رقم الجوال (اختياري)" maxlength="20">' +
      '<div class="e" id="arkRE"></div><button type="submit">متابعة</button></form>';
    document.body.appendChild(d);
    d.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var n = document.getElementById('arkRN').value.replace(/\s+/g, ' ').trim();
      if (n.split(' ').length < 2 || n.length < 5) { document.getElementById('arkRE').textContent = 'اكتب اسمك الكامل (الاسم واسم الأب على الأقل)'; return; }
      var m = document.getElementById('arkRM').value.trim().toLowerCase();
      if (!/^[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}$/i.test(m)) { document.getElementById('arkRE').textContent = 'اكتب إيميلك الصحيح (مثال: name@gmail.com)'; return; }
      var p = document.getElementById('arkRP').value.replace(/[^\d+]/g, '');
      s(UK, JSON.stringify({ name: n, email: m, phone: p })); d.remove();
      ev('register'); flush(false);
      try { window.dispatchEvent(new StorageEvent('storage', { key: UK })); } catch (x) {}
    });
    if (cu.name) document.getElementById('arkRN').value = cu.name;
    if (cu.phone) document.getElementById('arkRP').value = cu.phone;
    setTimeout(function () { var i = document.getElementById(cu.name ? 'arkRM' : 'arkRN'); if (i) i.focus(); }, 50);
  }

  // ===== أحداث الاستخدام =====
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
  document.addEventListener('submit', function (e) {
    if (!e.target || e.target.id !== 'lkF') return;
    setTimeout(function () { if (document.getElementById('lk')) ev('unlock_fail'); }, 4000);
  }, true);

  function init() {
    askName();
    if (g('arkan-idle-locked')) { ev('idle_lock'); try { localStorage.removeItem('arkan-idle-locked'); } catch (x) {} }
    ev('session');
    var lk = document.getElementById('lk');
    var watch = function () { if (!document.getElementById('lk')) { ev('unlock'); onRoute(); flush(false); return true; } };
    if (!lk) watch(); else { var mo = new MutationObserver(function () { if (watch()) mo.disconnect(); }); mo.observe(document.body, { childList: true }); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
