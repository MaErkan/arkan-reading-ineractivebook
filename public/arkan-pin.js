/* أركان — الرقم السري الشخصي (تسجيل / دخول / تعيين). ليس كودًا مشتركًا للكتاب. */
(function () {
  if (window.arkanPin) return;
  var UK = 'arkan_user_v3', DK = 'arkan-did-v2', SK = 'arkan_session_v1';
  var CK = 'arkan_bridge', FORCE = 'arkan-force-pin';
  function b64e(o) {
    try { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))); } catch (e) { return ''; }
  }
  function b64d(s) {
    try { return JSON.parse(decodeURIComponent(escape(atob(s)))); } catch (e) { return null; }
  }
  function g(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function s(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function forced() { return (+g(FORCE) || 0) > 0; }
  function setBridge(u, session) {
    if (forced() || !u || !u.name || !session) return;
    var v = b64e({ name: u.name, school: u.school, grade: u.grade, session: session, acct: u.acct || '', pinSet: true, t: Date.now() });
    if (!v) return;
    try { document.cookie = CK + '=' + v + '; path=/; max-age=31536000; SameSite=Lax'; } catch (e) {}
  }
  function readBridge() {
    try {
      var m = document.cookie.match(/(?:^|; )arkan_bridge=([^;]*)/);
      if (!m) return null;
      return b64d(m[1]);
    } catch (e) { return null; }
  }
  function user() { try { return JSON.parse(g(UK) || '{}') || {}; } catch (e) { return {}; } }
  function saveLocal(u) { s(UK, JSON.stringify(u)); try { window.dispatchEvent(new StorageEvent('storage', { key: UK })); } catch (e) {} }
  function restoreBridge() {
    if (forced()) { try { localStorage.removeItem(SK); } catch (e) {} return false; }
    if (g(SK) && user().name) return false;
    var c = readBridge();
    if (!c || !c.name || !c.school || !c.grade || !c.session) return false;
    saveLocal({ name: c.name, school: c.school, grade: c.grade, vf: true, pinSet: true, acct: c.acct || '', at: Date.now() });
    s(SK, c.session);
    return true;
  }
  restoreBridge();
  function did() {
    var d = g(DK);
    if (!d) { d = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); s(DK, d); }
    return d;
  }
  function digits(v) {
    return String(v || '').replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); }).replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); }).replace(/\D/g, '');
  }
  function api(body) {
    return fetch('/api/auth', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (d) { d._status = r.status; return d; }, function () { return { error: 'bad', _status: r.status }; }); });
  }
  function applyOk(d, base) {
    var u = Object.assign({}, base || user(), { vf: true, pinSet: true, acct: d.acct || '', at: Date.now() });
    saveLocal(u);
    if (d.session) { s(SK, d.session); try { localStorage.removeItem(FORCE); } catch (e) {} setBridge(u, d.session); }
    return u;
  }
  window.arkanPin = {
    did: did,
    user: user,
    digits: digits,
    restoreBridge: restoreBridge,
    logged: function () {
      if (forced()) return false;
      if (!(g(SK) && user().name)) restoreBridge();
      if (forced()) return false;
      var u = user();
      return !!(u.name && u.school && u.grade && u.vf && u.pinSet && g(SK));
    },
    register: function (n, sc, gr, pin, consent) {
      return api({ action: 'register', name: n, school: sc, grade: gr, pin: digits(pin), did: did(), consent: !!consent })
        .then(function (d) { if (!d.ok) throw d; return applyOk(d, { name: n, school: sc, grade: gr, consent: !!consent, consentAt: Date.now() }); });
    },
    login: function (n, sc, gr, pin) {
      return api({ action: 'login', name: n, school: sc, grade: gr, pin: digits(pin), did: did() })
        .then(function (d) { if (d.error === 'needs_pin') throw d; if (!d.ok) throw d; return applyOk(d, { name: n, school: sc, grade: gr }); });
    },
    setPin: function (n, sc, gr, pin, consent) {
      return api({ action: 'set-pin', name: n, school: sc, grade: gr, pin: digits(pin), did: did(), consent: !!consent })
        .then(function (d) { if (!d.ok) throw d; return applyOk(d, { name: n, school: sc, grade: gr, consent: !!consent || !!user().consent, consentAt: user().consentAt || Date.now() }); });
    },
    reset: function (n, sc, gr, teacherCode) {
      return api({ action: 'reset', name: n, school: sc, grade: gr, teacherCode: teacherCode, did: did() });
    },
    status: function (n, sc, gr) {
      return api({ action: 'status', name: n, school: sc, grade: gr, did: did() });
    },
    errMsg: function (d) {
      if (!d) return 'تعذّر الاتصال';
      if (d.error === 'rate_limited' || d.error === 'locked') return 'محاولات كثيرة — انتظر ' + (d.wait || 60) + ' ثانية ثم أعد المحاولة';
      if (d.error === 'bad_credentials' || d.error === 'bad_pin') return 'الرقم السري غير صحيح، أو أن الاسم والمدرسة لا يطابقان التسجيل';
      if (d.error === 'exists') return 'هذا الحساب مسجّل بالفعل — افتح تبويب الدخول واكتب رقمك السري';
      if (d.error === 'needs_pin') return 'عيّن رقمًا سريًا من 6 أرقام لهذا الحساب';
      if (d.error === 'consent') return 'الموافقة على الخصوصية مطلوبة';
      if (d.error === 'forbidden') return 'رمز المعلّم غير صحيح';
      if (d.error === 'not_configured') return 'إعادة التعيين غير مفعّلة بعد عند المعلّم';
      if (d.error === 'identity') return 'تحقق من الاسم والمدرسة والصف';
      return 'تعذّر إتمام الطلب، حاول مرة أخرى';
    }
  };
})();
