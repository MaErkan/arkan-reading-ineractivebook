// يرفق هوية الطالب المسجّل (الاسم والمدرسة والصف) بطلبات /api. لا يُرسل الرقم السري ولا أي كود فتح.
(function () {
  if (window.__arkanAuth) return; window.__arkanAuth = 1;
  function g(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function did() {
    var d = g('arkan-did-v2');
    if (!d) { d = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); try { localStorage.setItem('arkan-did-v2', d); } catch (e) {} }
    return d;
  }
  function headers() {
    var u = {}; try { u = JSON.parse(g('arkan_user_v3') || '{}'); } catch (e) {}
    var h = {};
    if (u && u.name && u.school && u.grade) {
      h['x-arkan-did'] = did();
      h['x-arkan-reg'] = encodeURIComponent(JSON.stringify({ name: u.name, school: u.school, grade: u.grade }));
    }
    return h;
  }
  window.arkanAuth = { headers: headers, did: did };
  var of = window.fetch;
  if (!of) return;
  window.fetch = function (input, init) {
    try {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      if (/^\/api\/|\/api\//.test(url) || (typeof location !== 'undefined' && url.indexOf(location.origin + '/api/') === 0)) {
        var extra = headers();
        if (extra['x-arkan-reg']) {
          init = init || {};
          var h = new Headers(init.headers || (typeof input !== 'string' && input.headers) || {});
          Object.keys(extra).forEach(function (k) { h.set(k, extra[k]); });
          init.headers = h;
        }
      }
    } catch (e) {}
    return of.call(this, input, init);
  };
})();
