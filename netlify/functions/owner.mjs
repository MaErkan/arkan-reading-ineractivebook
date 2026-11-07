// لوحة المالك: إحصاءات وتحليل تطور كل طالب | GET /api/owner
// الدخول: هيدر x-owner-key يساوي OWNER_KEY (أو ARKAN_ANALYTICS_KEY كبديل)
import { json, safeEq, limited } from '../lib/store.mjs';
import { anStore } from '../lib/analytics.mjs';
export const config = { path: '/api/owner' };

const DAY = 86_400_000;
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const r1 = (n) => (n == null ? null : Math.round(n * 10) / 10);
// تنظيف عنوان القسم (إزالة التشكيل) وتصنيفه في مجموعة، دون تخزين أي محتوى من الكتاب
export const strip = (t) => String(t || '').replace(/[\u064B-\u0652\u0670\u0640]/g, '').replace(/\s+/g, ' ').trim();
export function groupOf(label) {
  if (/^المعيار/.test(label)) return 'معايير القراءة';
  if (/^السرد/.test(label)) return 'معايير السرد';
  if (/^(القصة|قصة)/.test(label)) return 'القصص';
  if (/^(النص|نص|نموذج)/.test(label)) return 'النصوص والمحاكاة';
  if (/^الاختبار/.test(label)) return 'الاختبارات التدريبية';
  return 'أخرى';
}

export function levelOf(score) {
  if (score == null) return 'unrated';
  if (score >= 85) return 'advanced';
  if (score >= 60) return 'mid';
  return 'support';
}

// تحليل قسم واحد (معيار/درس) لطالب واحد
export function analyzeSection(sec, tests, errCount, opens, rw) {
  const pcs = tests.map((t) => t.pc);
  const first = pcs.length ? pcs[0] : null;
  const last = pcs.length ? pcs[pcs.length - 1] : null;
  const delta = pcs.length >= 2 ? last - first : null;
  let status = 'none';
  if (pcs.length >= 2) status = delta >= 10 ? 'improving' : delta <= -10 ? 'declining' : last < 60 ? 'stuck' : 'stable';
  else if (pcs.length === 1) status = last < 60 ? 'weak' : 'ok';
  else if (errCount >= 3) status = 'weak';
  else if (opens) status = 'reading';
  const answered = rw ? rw.r + rw.w : 0;
  const label = strip(sec).slice(0, 80);
  return {
    sec, label, group: groupOf(label), opens: opens || 0, attempts: pcs.length, first, last, delta, errs: errCount, status,
    accuracy: answered ? Math.round((rw.r / answered) * 100) : null,
    series: tests.slice(-8).map((t) => ({ pc: t.pc, ts: t.ts })),
  };
}

const STATUS_AR = { improving: 'تحسّن', declining: 'تراجع', stuck: 'لم يتحرك وما زال ضعيفًا', stable: 'مستقر', weak: 'ضعيف', ok: 'جيد', reading: 'قرأه دون اختبار', none: '—' };

export function analyzeUser(u, now = Date.now()) {
  const tests = (u.tests || []).slice().sort((a, b) => a.ts - b.ts);
  const bySec = new Map();
  for (const t of tests) { if (!bySec.has(t.sec)) bySec.set(t.sec, []); bySec.get(t.sec).push(t); }
  const errBy = {}; for (const e of u.errs || []) errBy[e.sec] = (errBy[e.sec] || 0) + 1;
  const names = new Set([...bySec.keys(), ...Object.keys(u.opens || {}), ...Object.keys(errBy), ...Object.keys(u.secs || {})]);
  names.delete(''); names.delete('undefined');
  const sections = [...names].map((s) => analyzeSection(s, bySec.get(s) || [], errBy[s] || 0, (u.opens && u.opens[s] && u.opens[s].n) || 0, u.secs && u.secs[s]));
  sections.sort((a, b) => (a.last == null) - (b.last == null) || (a.last ?? 0) - (b.last ?? 0));

  const lastScores = sections.filter((s) => s.last != null).map((s) => s.last);
  const score = r1(avg(lastScores));
  let trend = null, trendDelta = null;
  if (tests.length >= 4) {
    const h = Math.floor(tests.length / 2);
    trendDelta = r1(avg(tests.slice(h).map((t) => t.pc)) - avg(tests.slice(0, h).map((t) => t.pc)));
    trend = trendDelta >= 8 ? 'up' : trendDelta <= -8 ? 'down' : 'flat';
  } else if (tests.length >= 2) {
    trendDelta = tests[tests.length - 1].pc - tests[0].pc;
    trend = trendDelta >= 8 ? 'up' : trendDelta <= -8 ? 'down' : 'flat';
  }
  const total = (u.right || 0) + (u.wrong || 0);
  const lastSeenDays = u.last ? Math.floor((now - u.last) / DAY) : null;

  // نص التحليل الشامل
  const parts = [];
  const nm = (u.name || 'الطالب').split(' ')[0];
  if (!tests.length) parts.push(`${nm} لم يؤدِّ أي اختبار بعد${total ? `، لكنه أجاب عن ${total} سؤالًا بدقة ${Math.round(((u.right || 0) / total) * 100)}%` : ''}.`);
  else {
    parts.push(`مستوى ${nm} الحالي ${{ advanced: 'متقدم', mid: 'متوسط', support: 'يحتاج دعمًا', unrated: 'غير مقيَّم' }[levelOf(score)]} (متوسط آخر النتائج ${score}%).`);
    if (trend === 'up') parts.push(`في صعود واضح: ارتفعت نتائجه ${Math.abs(trendDelta)} نقطة بين أوائل محاولاته وأحدثها.`);
    else if (trend === 'down') parts.push(`في تراجع: انخفضت نتائجه ${Math.abs(trendDelta)} نقطة، ويستحق تواصلًا مبكرًا.`);
    else if (trend === 'flat') parts.push('مستواه ثابت تقريبًا ولم يتغير بين المحاولات.');
  }
  const imp = sections.filter((s) => s.status === 'improving'), dec = sections.filter((s) => s.status === 'declining'), stk = sections.filter((s) => s.status === 'stuck' || s.status === 'weak');
  if (imp.length) parts.push('تحسّن في: ' + imp.slice(0, 3).map((s) => `${s.label} (من ${s.first}% إلى ${s.last}%)`).join('، ') + '.');
  if (dec.length) parts.push('تراجع في: ' + dec.slice(0, 3).map((s) => `${s.label} (من ${s.first}% إلى ${s.last}%)`).join('، ') + '.');
  if (stk.length) parts.push('ما زال ضعيفًا في: ' + stk.slice(0, 3).map((s) => s.label).join('، ') + '.');
  if (lastSeenDays != null && lastSeenDays >= 7) parts.push(`لم يدخل منذ ${lastSeenDays} يومًا.`);

  return {
    did: u.did, name: u.name || '—', email: u.email || '', phone: u.phone || '', verified: !!u.verified,
    first: u.first || null, last: u.last || null, lastSeenDays, sessions: u.sessions || 0, unlocks: u.unlocks || 0,
    fails: u.fails || 0, right: u.right || 0, wrong: u.wrong || 0, accuracy: total ? Math.round(((u.right || 0) / total) * 100) : null,
    testsCount: tests.length, score, level: levelOf(score), trend, trendDelta, screenshots: (u.shots || []).length,
    sections, summary: parts.join(' '), topErrors: (u.errs || []).slice(-8).reverse().map((e) => ({ sec: e.sec, item: e.item, q: e.q, ts: e.ts })),
    days: u.days || {},
  };
}

export function analyzeAll(users, now = Date.now()) {
  const students = users.map((u) => analyzeUser(u, now)).sort((a, b) => (b.last || 0) - (a.last || 0));
  const lv = { advanced: 0, mid: 0, support: 0, unrated: 0 };
  students.forEach((s) => lv[s.level]++);
  const secMap = new Map();
  for (const s of students) for (const x of s.sections) {
    const m = secMap.get(x.label) || { sec: x.label, group: x.group, students: 0, tested: 0, scores: [], errs: 0, weak: 0 };
    m.students++; m.errs += x.errs; if (x.last != null) { m.tested++; m.scores.push(x.last); }
    if (x.status === 'weak' || x.status === 'stuck' || x.status === 'declining') m.weak++;
    secMap.set(x.label, m);
  }
  const sections = [...secMap.values()].map((m) => ({ sec: m.sec, group: m.group, students: m.students, tested: m.tested, avg: r1(avg(m.scores)), errs: m.errs, weak: m.weak }))
    .sort((a, b) => (a.avg ?? 101) - (b.avg ?? 101));
  const gMap = new Map();
  for (const x of sections) { const g = gMap.get(x.group) || { group: x.group, scores: [], tested: 0, weak: 0 }; if (x.avg != null) g.scores.push(x.avg); g.tested += x.tested; g.weak += x.weak; gMap.set(x.group, g); }
  const groups = [...gMap.values()].map((g) => ({ group: g.group, avg: r1(avg(g.scores)), tested: g.tested, weak: g.weak }));
  const active7 = students.filter((s) => s.last && now - s.last < 7 * DAY).length;
  const active1 = students.filter((s) => s.last && now - s.last < DAY).length;
  const rated = students.filter((s) => s.score != null);
  return {
    at: now,
    totals: {
      registered: students.length, verified: students.filter((s) => s.verified).length, active1, active7,
      dormant: students.filter((s) => !s.last || now - s.last >= 14 * DAY).length,
      neverTested: students.filter((s) => !s.testsCount).length, avgScore: r1(avg(rated.map((s) => s.score))),
      sessions: students.reduce((a, s) => a + s.sessions, 0), unlockFails: students.reduce((a, s) => a + s.fails, 0),
      improving: students.filter((s) => s.trend === 'up').length, declining: students.filter((s) => s.trend === 'down').length,
    },
    levels: lv, groups, sections, students,
  };
}

export default async (req, context) => {
  const ip = (context && context.ip) || req.headers.get('x-nf-client-connection-ip') || 'x';
  if (limited(ip, 30)) return json({ error: 'rate_limited' }, 429);
  const want = String(process.env.OWNER_KEY || process.env.ARKAN_ANALYTICS_KEY || '');
  if (!want) return json({ error: 'not_configured' }, 503);
  let got = ''; try { got = decodeURIComponent(req.headers.get('x-owner-key') || ''); } catch {}
  if (!safeEq(want, got)) return json({ error: 'forbidden' }, 403);
  if (req.method !== 'GET') return json({ error: 'method' }, 405);
  const st = await anStore();
  const keys = (await st.keys()).filter((k) => k.startsWith('u2/'));
  const users = [];
  for (let i = 0; i < keys.length; i += 20) users.push(...(await Promise.all(keys.slice(i, i + 20).map((k) => st.get(k)))).filter(Boolean));
  return json(analyzeAll(users));
};
