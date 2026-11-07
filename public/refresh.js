/* تحسينات واجهة الطالب: فهرس مختصر وقابل للطي + صفحة «تقدّمي». لا تغيّر محتوى الكتاب ولا بياناته. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (t) => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const CK = 'arkan-rf-col';
  const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  const A = () => window.__ark;
  const toc = () => $('#toc');

  /* ---------- 1) الفهرس: عناوين قصيرة + طيّ الأقسام ---------- */
  const shorten = (t) => {
    const s = String(t || '').trim();
    const cut = s.split(/\s[–—-]\s|\s[(（]/)[0].trim();
    return cut.length >= 6 ? cut : s;
  };
  const collapsed = () => { try { return new Set(JSON.parse(read(CK) || '[]')); } catch { return new Set(); } };
  function tidyToc() {
    const t = toc(); if (!t) return;
    const nav = $('.toc', t); if (!nav) return;
    nav.querySelectorAll('a .t').forEach((el) => {
      if (el.dataset.rf) return;
      const full = el.textContent; el.dataset.rf = '1'; el.title = full; el.textContent = shorten(full);
    });
    const col = collapsed(); let pi = -1, active = null;
    nav.querySelectorAll('.toc-part, a[data-i]').forEach((el) => {
      if (el.classList.contains('toc-part')) { pi++; el.dataset.p = pi; el.setAttribute('role', 'button'); el.tabIndex = 0; el.classList.toggle('rf-closed', col.has(pi)); return; }
      el.dataset.p = pi; if (el.classList.contains('on')) active = pi;
    });
    if (active != null && col.has(active)) { col.delete(active); write(CK, JSON.stringify([...col])); tidyToc(); return; }
    nav.querySelectorAll('a[data-i]').forEach((a) => a.classList.toggle('rf-col', col.has(+a.dataset.p)));
  }
  function togglePart(h) {
    const p = +h.dataset.p, col = collapsed();
    col.has(p) ? col.delete(p) : col.add(p);
    write(CK, JSON.stringify([...col])); tidyToc();
  }
  document.addEventListener('click', (e) => { const h = e.target.closest('.toc-part'); if (h && toc() && toc().contains(h)) togglePart(h); });
  document.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('toc-part')) { e.preventDefault(); togglePart(e.target); } });

  /* ---------- 2) صفحة «تقدّمي» ---------- */
  function model() {
    // نقرأ التقدم من الفهرس نفسه (يعرض لكل درس: رقمه وعنوانه وعدد المنجز والدرجة)، فلا نحتاج دوال داخلية
    const t = toc(), nav = t && $('.toc', t); if (!nav) return null;
    const k = A(), S = (k && k.S) || {};
    const parts = []; let cur = null, N = 0, D = 0, tn = 0, tsum = 0;
    nav.querySelectorAll('.toc-part, a[data-i]').forEach((el) => {
      if (el.classList.contains('toc-part')) { cur = { title: el.textContent.trim(), rows: [] }; parts.push(cur); return; }
      if (!cur) return;
      const idx = el.dataset.i, tEl = $('.t', el), label = ($('.n', el) || {}).textContent || '';
      const full = (tEl && (tEl.title || tEl.textContent)) || '';
      const row = { idx, label: label.trim(), title: shorten(full) };
      const st = $('.st', el), sc = $('.sc', el);
      if (el.classList.contains('tst') || sc) {
        row.test = true; row.best = sc ? parseInt(sc.textContent, 10) : null;
        if (row.best != null && !isNaN(row.best)) { tn++; tsum += row.best; } else row.best = null;
        cur.rows.push(row);
      } else if (st) {
        const m = st.textContent.match(/(\d+)\s*\/\s*(\d+)/);
        if (!m) return; row.d = +m[1]; row.n = +m[2]; if (!row.n) return;
        N += row.n; D += row.d; cur.rows.push(row);
      } else if (el.classList.contains('tst')) { row.test = true; row.best = null; cur.rows.push(row); }
    });
    const rows = parts.filter((p) => p.rows.length);
    const next = (() => { for (const p of rows) for (const r of p.rows) if (!r.test && r.d < r.n) return r; return null; })();
    const weak = rows.flatMap((p) => p.rows.filter((r) => r.test && r.best != null && r.best < 60));
    const lvName = k && k.LV && S.lv ? (k.LV[S.lv - 1] || {}).name || '' : '';
    return { parts: rows, N, D, pct: N ? Math.round((D * 100) / N) : 0, tn, tavg: tn ? Math.round(tsum / tn) : null, next, weak, lv: lvName };
  }
  function ring(p) {
    const r = 46, c = 2 * Math.PI * r;
    return `<svg viewBox="0 0 110 110" width="112" height="112" aria-hidden="true"><circle cx="55" cy="55" r="${r}" fill="none" stroke="var(--line)" stroke-width="10"/><circle cx="55" cy="55" r="${r}" fill="none" stroke="var(--teal)" stroke-width="10" stroke-linecap="round" stroke-dasharray="${(c * p) / 100} ${c}" transform="rotate(-90 55 55)"/><text x="55" y="62" text-anchor="middle" font-size="24" font-weight="800" fill="currentColor">${p}%</text></svg>`;
  }
  function render() {
    const m = model(), box = $('#rfProgBody'); if (!m || !box) return;
    const rowHtml = (r) => r.test
      ? `<a class="rf-row" href="#s${esc(r.idx)}" data-close><span class="rf-n">${esc(r.label)}</span><span class="rf-t">${esc(r.title)}</span><span class="rf-sc ${r.best == null ? '' : r.best < 60 ? 'low' : r.best >= 85 ? 'hi' : ''}">${r.best == null ? 'لم تختبر' : r.best + '%'}</span></a>`
      : `<a class="rf-row" href="#s${esc(r.idx)}" data-close><span class="rf-n">${esc(r.label)}</span><span class="rf-t">${esc(r.title)}</span><span class="rf-bar"><i style="width:${Math.round((r.d * 100) / r.n)}%"></i></span><span class="rf-c ${r.d === r.n ? 'full' : ''}">${r.d}/${r.n}</span></a>`;
    box.innerHTML = `
      <div class="rf-hero"><div class="rf-ring">${ring(m.pct)}</div><div class="rf-kpis">
        <div><b>${m.D}</b><span>سؤال منجز من ${m.N}</span></div>
        <div><b>${m.tn}</b><span>اختبار مُنجز</span></div>
        <div><b>${m.tavg == null ? '—' : m.tavg + '%'}</b><span>متوسط الاختبارات</span></div>
        <div><b>${esc(m.lv)}</b><span>مستواك الحالي</span></div></div></div>
      ${m.next ? `<a class="rf-next" href="#s${esc(m.next.idx)}" data-close>▶ تابع من حيث وقفت: <b>${esc(m.next.label)} ${esc(m.next.title)}</b></a>` : '<p class="rf-done">🎉 أنجزت كل الأسئلة. راجع اختباراتك لرفع درجاتك.</p>'}
      ${m.weak.length ? `<div class="rf-weak"><b>تحتاج مراجعة (أقل من 60%):</b> ${m.weak.map((r) => `<a href="#s${esc(r.idx)}" data-close>${esc(r.title)} (${r.best}%)</a>`).join('، ')}</div>` : ''}
      ${m.parts.map((p) => `<h3 class="rf-ph">${esc(p.title)}</h3><div class="rf-list">${p.rows.map(rowHtml).join('')}</div>`).join('')}`;
  }
  function build() {
    if ($('#rfProg')) return;
    const d = document.createElement('div'); d.id = 'rfProg'; d.className = 'rf-modal'; d.hidden = true; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'rfProgT');
    d.innerHTML = '<div class="rf-card"><div class="rf-head"><h2 id="rfProgT">📈 تقدّمي</h2><button type="button" id="rfProgX" aria-label="إغلاق">✕</button></div><div id="rfProgBody"></div></div>';
    document.body.appendChild(d);
    d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('#rfProgX') || e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !d.hidden) close(); });
  }
  const close = () => { const d = $('#rfProg'); if (d) { d.hidden = true; document.body.style.overflow = ''; } };
  function open() { build(); render(); const d = $('#rfProg'); d.hidden = false; document.body.style.overflow = 'hidden'; $('#rfProgX').focus(); }
  function addButton() {
    if ($('#rfProgBtn')) return;
    const nb = $('#notesBtn'); if (!nb) return;
    const b = document.createElement('button'); b.type = 'button'; b.id = 'rfProgBtn'; b.className = 'tbtn'; b.setAttribute('aria-label', 'تقدّمي');
    b.innerHTML = '<span aria-hidden="true">📈</span><span class="lbl">تقدّمي</span>';
    b.onclick = open; nb.parentNode.insertBefore(b, nb);
  }


  /* ---------- 3) تنسيق الأبيات: ضبط الخط ليكفي كل شطر في سطر واحد ---------- */
  let fitting = false;
  function fitPoems() {
    if (fitting) return; fitting = true;
    try {
      const narrow = window.matchMedia('(max-width:620px)').matches;
      document.querySelectorAll('.poem').forEach((p) => {
        if (!p.offsetParent) return;
        const hs = [...p.querySelectorAll(':scope > .h')]; if (!hs.length) return;
        const cs = getComputedStyle(p);
        const avail = p.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0);
        if (avail <= 0) return;
        for (let pass = 0; pass < 3; pass++) {
          const cur = parseFloat(p.style.getPropertyValue('--pf')) || 1;
          const w = hs.map((h) => h.getBoundingClientRect().width);
          let need;
          if (narrow) need = Math.max(...w);
          else need = Math.max(0, ...w.filter((_, i) => i % 2 === 0)) + Math.max(0, ...w.filter((_, i) => i % 2 === 1)) + (parseFloat(getComputedStyle(p).columnGap) || 24);
          if (!need) break;
          const ratio = avail / need;
          if (ratio >= 0.985 && ratio <= 1.04) break;           // مناسب
          let next = Math.min(1, Math.max(0.5, cur * ratio * 0.985));
          if (Math.abs(next - cur) < 0.005) break;
          p.style.setProperty('--pf', String(Math.round(next * 1000) / 1000));
        }
      });
    } finally { fitting = false; }
  }
  let fitT = 0; const scheduleFit = () => { cancelAnimationFrame(fitT); fitT = requestAnimationFrame(fitPoems); };
  window.addEventListener('resize', scheduleFit);
  window.addEventListener('orientationchange', scheduleFit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleFit);

  /* ---------- تشغيل ---------- */
  let sched = false;
  const tick = () => { sched = false; tidyToc(); addButton(); scheduleFit(); };
  const kick = () => { if (!sched) { sched = true; requestAnimationFrame(tick); } };
  const mo = new MutationObserver(kick);
  const attach = () => {
    const t = toc(); if (!t) return setTimeout(attach, 400);
    mo.observe(t, { childList: true }); mo.observe(document.body, { childList: true });
    const mn = $('#main'); if (mn) new MutationObserver(scheduleFit).observe(mn, { childList: true, subtree: true });
    kick();
  };
  attach(); window.addEventListener('hashchange', kick);
})();
