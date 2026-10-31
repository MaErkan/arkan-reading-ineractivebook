(function () {
  var K = 'arkan_theme', d = document.documentElement, t;
  try { t = localStorage.getItem(K); } catch (e) {}
  if (t !== 'dark' && t !== 'light') {
    t = (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }
  d.setAttribute('data-theme', t);

  function lbl(b) {
    var k = d.getAttribute('data-theme') === 'dark';
    b.textContent = k ? '☀️ الوضع الفاتح' : '🌙 الوضع الداكن';
    b.setAttribute('aria-label', b.textContent);
  }

  function dock() {
    var el = document.getElementById('arkanFabDock');
    if (!el) {
      el = document.createElement('div');
      el.id = 'arkanFabDock';
      document.body.appendChild(el);
      document.body.classList.add('arkan-has-fabs');
    }
    return el;
  }

  /* Keep home / tutor / theme / branches pills in one wrapping dock so they cannot share a corner. */
  function collect() {
    var box = dock();
    var nodes = [
      document.getElementById('arkanThemeBtn'),
      document.querySelector('a.arkan-back'),
      document.querySelector('a.arkan-back-branches'),
      document.getElementById('arkanTutorBtn')
    ];
    var moved = false;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (!n || n.parentElement === box) continue;
      box.appendChild(n);
      moved = true;
    }
    if (!moved) return;
    for (var j = 0; j < nodes.length; j++) {
      if (nodes[j] && nodes[j].parentElement === box) box.appendChild(nodes[j]);
    }
  }

  function add() {
    if (!document.getElementById('arkanThemeBtn')) {
      var b = document.createElement('button');
      b.id = 'arkanThemeBtn';
      b.type = 'button';
      lbl(b);
      b.onclick = function () {
        var n = d.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        d.setAttribute('data-theme', n);
        try { localStorage.setItem(K, n); } catch (e) {}
        lbl(b);
      };
      dock().appendChild(b);
    }
    collect();
    if (!window.__arkanFabObs && window.MutationObserver) {
      window.__arkanFabObs = true;
      var obs = new MutationObserver(function () { collect(); });
      obs.observe(document.body, { childList: true });
    }
  }

  if (document.body) add();
  else document.addEventListener('DOMContentLoaded', add);

  window.addEventListener('storage', function (e) {
    if (e.key === K && e.newValue) {
      d.setAttribute('data-theme', e.newValue);
      var b = document.getElementById('arkanThemeBtn');
      if (b) lbl(b);
    }
  });
})();
