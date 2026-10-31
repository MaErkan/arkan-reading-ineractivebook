(function () {
  'use strict';
  /* القراءة / الكتاب: الشريط يبقى في الرئيسية وبقية الصفحات المسموحة فقط */
  function isReadingPage() {
    var path = (location.pathname || '/').toLowerCase();
    return /\/kitab(?:\.html)?(?:\/|$)/.test(path);
  }

  if (isReadingPage()) {
    document.documentElement.classList.add('arkan-reading');
    var old = document.getElementById('arkanTicker');
    if (old) old.remove();
    if (document.body) document.body.classList.remove('arkan-has-ticker');
    return;
  }
  if (document.getElementById('arkanTicker')) return;

  function speed() {
    var mobile = window.matchMedia && matchMedia('(max-width: 800px)').matches;
    return mobile ? 32 : 70; /* px/s — أهدأ على الجوال */
  }

  function items() {
    var list = Array.isArray(window.ARKAN_NEWS) ? window.ARKAN_NEWS : [];
    return list.map(function (x) {
      if (typeof x === 'string') return { text: x };
      return { text: (x && x.text) || '', href: x && x.href };
    }).filter(function (x) { return x.text; });
  }

  function appendCycle(track, news) {
    news.forEach(function (n) {
      var el = document.createElement('span');
      el.className = 'arkan-ticker__item';
      if (n.href) {
        var a = document.createElement('a');
        a.href = n.href;
        a.textContent = n.text;
        a.rel = 'noopener';
        el.appendChild(a);
      } else {
        el.appendChild(document.createTextNode(n.text));
      }
      track.appendChild(el);
      var sep = document.createElement('span');
      sep.className = 'arkan-ticker__sep';
      sep.setAttribute('aria-hidden', 'true');
      sep.textContent = '◆';
      track.appendChild(sep);
    });
  }

  function build() {
    if (isReadingPage()) return;
    var news = items();
    if (!news.length) return;

    var root = document.createElement('aside');
    root.id = 'arkanTicker';
    root.className = 'arkan-ticker';
    root.setAttribute('role', 'region');
    root.setAttribute('aria-label', 'أخبار أركان');

    var stack = document.createElement('div');
    stack.className = 'arkan-ticker__stack';

    var inner = document.createElement('div');
    inner.className = 'arkan-ticker__inner';

    var label = document.createElement('div');
    label.className = 'arkan-ticker__label';
    label.innerHTML = '<span>أخبار أركان</span>';

    var viewport = document.createElement('div');
    viewport.className = 'arkan-ticker__viewport';

    var track = document.createElement('div');
    track.className = 'arkan-ticker__track';

    var end = document.createElement('div');
    end.className = 'arkan-ticker__end';
    end.setAttribute('aria-hidden', 'true');

    var sub = document.createElement('div');
    sub.className = 'arkan-ticker__sub';
    sub.textContent = 'أركان التفاعلي — نصائح تربوية وأخبار المنصّة · القراءة متاحة الآن';

    appendCycle(track, news);
    appendCycle(track, news);

    viewport.appendChild(track);
    inner.appendChild(label);
    inner.appendChild(viewport);
    inner.appendChild(end);
    stack.appendChild(inner);
    stack.appendChild(sub);
    root.appendChild(stack);

    document.body.insertBefore(root, document.body.firstChild);
    document.body.classList.add('arkan-has-ticker');

    var tries = 0;
    function startCrawl() {
      var total = track.scrollWidth;
      if (total < 8) {
        if (tries++ < 40) setTimeout(startCrawl, 50);
        return;
      }
      tries = 0;
      var half = Math.round(total / 2);
      var mobile = window.matchMedia && matchMedia('(max-width: 800px)').matches;
      var seconds = Math.max(mobile ? 24 : 12, half / speed());
      /* بكسل لا نسبة: نسبة translate3d تتجمّد على بعض جوالات WebKit */
      track.style.setProperty('--arkan-crawl-dist', half + 'px');
      track.style.setProperty('--arkan-crawl-dur', seconds + 's');
      track.classList.add('is-crawling');
    }

    setTimeout(startCrawl, 0);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(startCrawl);
    window.addEventListener('load', startCrawl);
    window.addEventListener('resize', function () {
      track.classList.remove('is-crawling');
      tries = 0;
      setTimeout(startCrawl, 0);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
