/* تسجيل الطالب باسمه + متابعة الاستخدام لصاحب الكتاب (أركان). لا يغيّر سلوك الكتاب. */
(function () {
  'use strict';
  if (window.__arkanTrack) return; window.__arkanTrack = true;
  var UK = 'arkan_user_v2', QK = 'arkan-trackq-v2', DK = 'arkan-did-v2', CK = 'arkan-unlock-v2';
  function g(k) { try { return localStorage.getItem(k); } catch (x) { return null; } }
  function s(k, v) { try { localStorage.setItem(k, v); } catch (x) {} }
  function user() { try { return JSON.parse(g(UK) || '{}') || {}; } catch (x) { return {}; } }
  var did = g(DK); if (!did) { did = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); s(DK, did); }
  var Q; try { Q = JSON.parse(g(QK) || '[]'); } catch (x) { Q = []; } if (!Array.isArray(Q)) Q = [];
  var nudged = false;
  function nudge() {
    if (nudged) return; nudged = true;
    var b = document.createElement('div'); b.setAttribute('role', 'status');
    b.textContent = '💬 ناقش أغلاطك مع المعلم الذكي من الزر 🎓';
    b.style.cssText = 'position:fixed;bottom:84px;left:50%;transform:translateX(-50%);z-index:2147483640;background:#0B7C82;color:#fff;padding:10px 14px;border-radius:12px;font-size:14px;direction:rtl;box-shadow:0 4px 16px rgba(0,0,0,.25);max-width:92%;cursor:pointer';
    function openT() { var t = document.getElementById('arkanTutor'), k = document.getElementById('arkanTutorBtn'); if (t && t.hidden && k) k.click(); else if (t) t.hidden = false; b.remove(); }
    b.onclick = openT;
    document.body.appendChild(b); setTimeout(function () { b.remove(); }, 10000);
  }
  function ev(t, o) { var e = o || {}; if (e.ok === false || (t === 'test_done' && e.pc < 70)) setTimeout(nudge, 1500); e.t = t; e.ts = Date.now(); Q.push(e); if (Q.length > 400) Q.splice(0, Q.length - 400); s(QK, JSON.stringify(Q)); }
  var busy = false;
  function flush(beacon) {
    var u = user(), code = g(CK);
    if (!Q.length || !u.name || !u.email || !code || busy) return;
    var batch = Q.slice(0, 80);
    var body = JSON.stringify({ gen: 2, did: did, name: u.name, email: u.email || '', phone: u.phone || '', code: code, ev: batch });
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
      ev('register'); flush(false); ensureVerified();
      try { window.dispatchEvent(new StorageEvent('storage', { key: UK })); } catch (x) {}
    });
    if (cu.name) document.getElementById('arkRN').value = cu.name;
    if (cu.phone) document.getElementById('arkRP').value = cu.phone;
    setTimeout(function () { var i = document.getElementById(cu.name ? 'arkRM' : 'arkRN'); if (i) i.focus(); }, 50);
  }


  // ===== تفعيل الإيميل بكود (إلزامي لما يكون مزوّد الإيميل مفعّل على السيرفر) =====
  var vBusy = false;
  function ensureVerified() {
    var u = user(); if (!u.email || u.vf === u.email || vBusy || document.getElementById('arkOtp')) return;
    vBusy = true;
    (function wait() { if (g(CK)) { vBusy = false; showOtp(); } else setTimeout(wait, 1500); })();
  }
  function post(o) {
    var u = user(); o.email = u.email; o.did = did; o.code = g(CK); o.name = u.name;
    return fetch('/api/verify', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: JSON.stringify(o) }).then(function (r) { return r.json().catch(function () { return {}; }); });
  }
  function showOtp() {
    var u = user(); if (!u.email || u.vf === u.email || document.getElementById('arkOtp')) return;
    if (!document.getElementById('arkOtpSt')) { var st = document.createElement('style'); st.id = 'arkOtpSt';
      st.textContent = '#arkOtp{position:fixed;inset:0;z-index:2147483646;background:rgba(10,40,42,.92);display:flex;align-items:center;justify-content:center;padding:18px}#arkOtp form{background:#fff;border-radius:18px;max-width:380px;width:100%;padding:22px;direction:rtl;text-align:right}#arkOtp h3{margin:0 0 6px;color:#0B7C82}#arkOtp p{margin:0 0 12px;color:#4B6A6D;font-size:14px}#arkOtp input{width:100%;box-sizing:border-box;padding:12px;margin:0 0 10px;border:1.5px solid #cfe0e0;border-radius:10px;font-size:24px;letter-spacing:8px;text-align:center;user-select:text;-webkit-user-select:text}#arkOtp button{width:100%;padding:12px;border:0;border-radius:10px;background:#0B7C82;color:#fff;font-size:17px;font-weight:700;margin-bottom:8px}#arkOtp .l{display:flex;justify-content:space-between;font-size:13px}#arkOtp .l a{color:#0B7C82;cursor:pointer}#arkOtp .e{color:#b3261e;font-size:13px;min-height:18px}';
      document.head.appendChild(st); }
    var d = document.createElement('div'); d.id = 'arkOtp';
    d.innerHTML = '<form><h3>كود التفعيل</h3><p>بعتنالك كود التفعيل على إيميلك <b dir="ltr" id="arkOM"></b>. اكتبه هنا عشان يفتح الكتاب.</p>' +
      '<input id="arkOI" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="20" placeholder="XXXX-XXXX-XXXX" dir="ltr" style="font-size:20px;letter-spacing:3px">' +
      '<div class="e" id="arkOE"></div><button type="submit">تفعيل</button><div class="l"><a id="arkOR">أعد الإرسال</a><a id="arkOC">تغيير الإيميل</a></div></form>';
    document.body.appendChild(d);
    var E = document.getElementById('arkOE');
    var em = String(u.email), at = em.indexOf('@'); document.getElementById('arkOM').textContent = at > 1 ? em[0] + '***' + em.slice(at - 1) : em;
    var rBusy = false;
    function resend(auto) {
      if (rBusy) return; rBusy = true; if (!auto) { E.style.color = '#4B6A6D'; E.textContent = 'جاري الإرسال…'; }
      post({ action: 'request' }).then(function (j) {
        rBusy = false; if (auto && j.ok) return; E.style.color = j.ok ? '#0B7C82' : '';
        E.textContent = j.ok ? 'اتبعت الكود على إيميلك ✅ (لو مش لاقيه شوف الـ Spam)' : j.error === 'cooldown' ? (auto ? '' : 'انتظر دقيقة' + (j.wait ? ' (' + j.wait + ' ثانية)' : '') + ' وجرّب تاني') : j.error === 'too_many' || j.error === 'rate_limited' ? 'محاولات كتير — جرّب بعد ساعة' : 'حصل خطأ في الإرسال، جرّب تاني';
      }).catch(function () { rBusy = false; if (!auto) { E.style.color = ''; E.textContent = 'مفيش اتصال بالإنترنت'; } });
    }
    document.getElementById('arkOR').onclick = function () { resend(false); };
    resend(true);
    document.getElementById('arkOC').onclick = function () { var x = user(); delete x.email; delete x.vf; s(UK, JSON.stringify(x)); d.remove(); askName(); };
    d.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault(); var c = document.getElementById('arkOI').value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (c.length < 10) { E.textContent = 'اكتب الكود كامل زي ما وصلك على الإيميل'; return; }
      E.style.color = '#4B6A6D'; E.textContent = 'جاري التحقق…';
      post({ action: 'activate', act: c }).then(function (j) {
        E.style.color = '';
        if (j.ok) { var x = user(); x.vf = x.email; s(UK, JSON.stringify(x)); d.remove(); ev('activated'); flush(false); return; }
        E.textContent = j.error === 'wrong' ? 'الكود غلط — راجع الميل أو اضغط أعد الإرسال' : j.error === 'locked' || j.error === 'rate_limited' ? 'محاولات كتير — جرّب بعد ربع ساعة' : 'حصل خطأ، جرّب تاني';
      }).catch(function () { E.textContent = 'مفيش اتصال بالإنترنت'; });
    });
    setTimeout(function () { var i = document.getElementById('arkOI'); if (i) i.focus(); }, 50);
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
    askName(); ensureVerified();
    if (g('arkan-idle-locked')) { ev('idle_lock'); try { localStorage.removeItem('arkan-idle-locked'); } catch (x) {} }
    ev('session');
    var lk = document.getElementById('lk');
    var watch = function () { if (!document.getElementById('lk')) { ev('unlock'); onRoute(); flush(false); return true; } };
    if (!lk) watch(); else { var mo = new MutationObserver(function () { if (watch()) mo.disconnect(); }); mo.observe(document.body, { childList: true }); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
