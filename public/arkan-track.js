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
    ev('register', { sec: sc, item: gr }); flush(false);
    try { window.dispatchEvent(new StorageEvent('storage', { key: UK })); } catch (x) {}
  };
  window.arkanUser = user;

  function digits(v) { return window.arkanPin ? window.arkanPin.digits(v) : String(v || '').replace(/\D/g, ''); }

  function askName() {
    try { if (window.arkanPin && window.arkanPin.restoreBridge) window.arkanPin.restoreBridge(); } catch (e) {}
    var cu = user();
    var logged = window.arkanPin && window.arkanPin.logged();
    if (logged || document.getElementById('arkReg')) return;
    var returning = !!(cu.name && cu.school && cu.grade);
    var mode = returning ? 'login' : 'register';
    var st = document.createElement('style');
    st.textContent = '#arkReg{position:fixed;inset:0;z-index:2147483647;background:rgba(10,40,42,.9);display:flex;align-items:center;justify-content:center;padding:18px;font-family:Tajawal,var(--ui),sans-serif}' +
      '#arkReg form{background:var(--card,#fff);color:var(--ink,#12343A);border-radius:22px;max-width:440px;width:100%;padding:22px 22px 16px;direction:rtl;text-align:right;box-shadow:0 24px 60px rgba(0,0,0,.35);max-height:calc(100vh - 28px);overflow:auto}' +
      '#arkReg h3{margin:8px 0 4px;color:var(--teal,#0B7C82);font-size:22px}#arkReg .sub{margin:0 0 12px;color:var(--muted,#4B6A6D);font-size:14px;line-height:1.7}' +
      '#arkReg label{display:block;font-size:13px;font-weight:800;margin:8px 0 4px}' +
      '#arkReg input{width:100%;box-sizing:border-box;padding:12px;border:1.5px solid var(--line,#cfe0e0);border-radius:12px;font-size:16px;background:var(--card,#fff);color:var(--ink,#12343A);font-family:inherit}' +
      '#arkReg .tabs{display:flex;gap:8px;margin:8px 0 4px}#arkReg .tabs button{flex:1;background:transparent;color:var(--teal,#0B7C82);border:1.5px solid var(--line,#cfe0e0);border-radius:12px;padding:8px;font-weight:800}' +
      '#arkReg .tabs button[aria-selected="true"]{background:var(--teal,#0B7C82);color:#fff;border-color:var(--teal,#0B7C82)}' +
      '#arkReg .pinrow{display:flex;gap:8px;align-items:center}#arkReg .pinrow input{letter-spacing:.45em;text-align:center;font-weight:800}' +
      '#arkReg .peek{width:auto;flex:none;padding:10px 12px;border-radius:12px;border:1.5px solid var(--line,#cfe0e0);background:var(--paper,#f4f7f6);color:inherit;font-weight:800}' +
      '#arkReg .go{width:100%;margin-top:8px;padding:12px;border:0;border-radius:12px;background:#0B7C82;color:#fff;font-size:17px;font-weight:800}' +
      '#arkReg .e{color:#b3261e;font-size:13px;min-height:18px;margin-top:6px}#arkReg .hint{font-size:12px;color:var(--muted,#4B6A6D);margin:4px 0 0}' +
      '#arkReg .ark-grade{margin:10px 0;font:800 16px Tajawal,var(--ui),sans-serif;color:var(--ink,#12343A)}#arkReg .forgot{display:block;text-align:center;margin-top:10px;color:#0B7C82;font-weight:800;font-size:14px}' +
      '#arkReg .consent{display:flex;gap:8px;align-items:flex-start;font-size:13px;line-height:1.7;margin:8px 0}#arkReg .consent input{width:auto;margin-top:4px}' +
      '#arkReg .rk{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:12px;padding-top:10px;border-top:1px solid var(--line,#eef3f3);font-size:11px;color:#8aa3a5}#arkReg .rk img{height:22px;width:auto}';
    document.head.appendChild(st);
    var d = document.createElement('div');
    d.id = 'arkReg'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'arkAuthT');
    d.innerHTML = '<form autocomplete="off">' +
      '<img src="/img/logo-scene.jpg" alt="" width="72" height="72" style="display:block;margin:0 auto;border-radius:18px;object-fit:cover">' +
      '<div class="tabs" role="tablist" aria-label="الدخول أو التسجيل"><button type="button" id="arkTabIn" role="tab">دخول</button><button type="button" id="arkTabUp" role="tab">تسجيل جديد</button></div>' +
      '<h3 id="arkAuthT"></h3><p class="sub" id="arkAuthSub"></p>' +
      '<label for="arkRN">الاسم</label><input id="arkRN" autocomplete="name" maxlength="60" required>' +
      '<label for="arkRS">المدرسة الثانوية في قطر</label><input id="arkRS" list="arkRSL" maxlength="90" placeholder="اختر من الاقتراحات أو اكتب اسم المدرسة" required><datalist id="arkRSL"></datalist>' +
      '<p class="hint">إن لم تظهر مدرستك في الاقتراحات فاكتب اسمها كما هو.</p>' +
      '<p class="ark-grade">الصف: الصف الثاني عشر</p>' +
      '<label for="arkRP">الرقم السري</label><div class="pinrow"><input id="arkRP" type="password" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="6 أرقام"><button type="button" class="peek" id="arkPeek" aria-pressed="false">إظهار</button></div>' +
      '<div id="arkRegExtra"><label for="arkRP2">تأكيد الرقم السري</label><input id="arkRP2" type="password" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="أعد كتابة الرقم">' +
      '<label class="consent"><input type="checkbox" id="arkConsent"><span>أوافق على <a href="/privacy.html" target="_blank">سياسة الخصوصية</a> و<a href="/terms.html" target="_blank">شروط الاستخدام</a>، وأقرّ بموافقة ولي أمري إن كنت دون 18 سنة</span></label></div>' +
      '<p class="hint">الرقم السري شخصي من 6 أرقام، وهو السر الوحيد للدخول.</p>' +
      '<div class="e" id="arkRE" role="alert"></div><button class="go" id="arkGo" type="submit"></button>' +
      '<a class="forgot" id="arkForgot" href="/account.html">نسيت الرقم السري؟ أعد تعيينه من حسابي بمعاونة المعلّم</a>' +
      '<div class="rk"><span>تصميم وإنتاج</span><img src="/img/rankan-lockup-sm.png" alt="Rankan"></div></form>';
    document.body.appendChild(d);
    var dl = document.getElementById('arkRSL');
    (window.ARKAN_QA_SECONDARY || window.ARKAN_QA_SCHOOLS || []).forEach(function (n) { var o = document.createElement('option'); o.value = n; dl.appendChild(o); });
    var form = d.querySelector('form'), E = document.getElementById('arkRE'), extra = document.getElementById('arkRegExtra');
    var pin = document.getElementById('arkRP'), pin2 = document.getElementById('arkRP2'), forgot = document.getElementById('arkForgot');
    var submitting = false;
    function paint() {
      var login = mode === 'login' || mode === 'setpin';
      document.getElementById('arkTabIn').setAttribute('aria-selected', mode === 'login' ? 'true' : 'false');
      document.getElementById('arkTabUp').setAttribute('aria-selected', mode === 'register' || mode === 'setpin' ? 'true' : 'false');
      document.getElementById('arkAuthT').textContent = mode === 'login' ? 'دخول الطلاب' : (mode === 'setpin' ? 'عيّن رقمك السري' : 'تسجيل طالب جديد');
      document.getElementById('arkAuthSub').textContent = mode === 'login'
        ? 'اسمك ومدرستك وصفّك محفوظة على هذا الجهاز. أدخل رقمك السري فقط.'
        : (mode === 'setpin' ? 'حسابك موجود دون رقم سري. عيّن 6 أرقام وتابع.' : 'اكتب اسمك الحقيقي ومدرستك الثانوية، ثم عيّن رقمًا سريًا من 6 أرقام.');
      extra.hidden = mode === 'login';
      forgot.hidden = mode !== 'login';
      document.getElementById('arkGo').textContent = mode === 'login' ? 'متابعة' : 'ادخل إلى الكتاب';
      E.textContent = '';
    }
    function fieldName() { return document.getElementById('arkRN').value.replace(/\s+/g, ' ').trim(); }
    function fieldSchool() { return acceptSchool(document.getElementById('arkRS').value); }
    document.getElementById('arkTabIn').onclick = function () { mode = 'login'; paint(); pin.focus(); };
    document.getElementById('arkTabUp').onclick = function () { mode = 'register'; paint(); };
    document.getElementById('arkPeek').onclick = function () {
      var show = pin.type === 'password';
      pin.type = pin2.type = show ? 'text' : 'password';
      this.textContent = show ? 'إخفاء' : 'إظهار';
      this.setAttribute('aria-pressed', show ? 'true' : 'false');
    };
    function onPinInput(el) {
      var v = digits(el.value).slice(0, 6);
      if (el.value !== v) el.value = v;
      if (mode === 'login' && v.length === 6 && !submitting) { submitting = true; form.requestSubmit(); }
    }
    pin.addEventListener('input', function () { onPinInput(pin); });
    pin2.addEventListener('input', function () { onPinInput(pin2); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!window.arkanPin) { E.textContent = 'تعذّر تحميل الدخول. حدّث الصفحة.'; submitting = false; return; }
      var n = fieldName(); var er = nameErr(n); if (er) { E.textContent = er; submitting = false; return; }
      var sc = fieldSchool();
      if (!sc) { E.textContent = 'اكتب اسم مدرستك الثانوية، أو اخترها من الاقتراحات'; submitting = false; return; }
      var p1 = digits(pin.value);
      if (p1.length !== 6) { E.textContent = 'الرقم السري 6 أرقام'; submitting = false; return; }
      var btn = document.getElementById('arkGo'); btn.disabled = true;
      var finish = function () {
        try { localStorage.removeItem('arkan-force-pin'); } catch (x) {}
        window.arkanSaveUser(n, sc, GRADE, { consent: true, pinSet: true });
        location.reload();
      };
      var fail = function (r) { btn.disabled = false; submitting = false; E.textContent = window.arkanPin.errMsg(r); };
      if (mode === 'login') {
        E.textContent = 'جارٍ الدخول…';
        window.arkanPin.login(n, sc, GRADE, p1).then(finish, function (r) {
          if (r && r.error === 'needs_pin') { mode = 'setpin'; paint(); btn.disabled = false; submitting = false; E.textContent = 'عيّن رقمًا سريًا جديدًا من 6 أرقام ثم أكّده.'; return; }
          fail(r);
        });
        return;
      }
      var p2 = digits(pin2.value);
      if (p1 !== p2) { E.textContent = 'تأكيد الرقم السري غير مطابق'; btn.disabled = false; submitting = false; return; }
      if (mode === 'register' && !document.getElementById('arkConsent').checked) { E.textContent = 'يجب الموافقة على سياسة الخصوصية وشروط الاستخدام'; btn.disabled = false; submitting = false; return; }
      E.textContent = 'جارٍ الحفظ…';
      var call = mode === 'setpin' ? window.arkanPin.setPin(n, sc, GRADE, p1, true) : window.arkanPin.register(n, sc, GRADE, p1, true);
      call.then(finish, function (r) {
        if (r && r.error === 'exists') { mode = 'login'; paint(); btn.disabled = false; submitting = false; E.textContent = 'الحساب موجود. أدخل رقمك السري في تبويب الدخول.'; return; }
        fail(r);
      });
    });
    if (cu.name) document.getElementById('arkRN').value = cu.name;
    if (cu.school) document.getElementById('arkRS').value = cu.school;
    paint();
    setTimeout(function () { (mode === 'login' ? pin : document.getElementById('arkRN')).focus(); }, 40);
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
    var legacy = document.getElementById('lk'); if (legacy) legacy.remove();
    askName();
    if (g('arkan-idle-locked')) { ev('idle_lock'); try { localStorage.removeItem('arkan-idle-locked'); } catch (x) {} }
    if (window.arkanPin && window.arkanPin.logged()) { ev('session'); onRoute(); flush(false); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
