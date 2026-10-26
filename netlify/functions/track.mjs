// تتبّع استخدام كتاب أركان — يستقبل أحداث الطالب ويحدّث ملخّصه في Netlify Blobs
import { json, norm, clip, limited } from '../lib/store.mjs';
import { anStore } from '../lib/analytics.mjs';
export const config = { path: '/api/track' };
const TYPES = new Set(['register', 'session', 'unlock', 'unlock_fail', 'open', 'mcq', 'test_q', 'test_done', 'self_grade', 'reveal', 'idle_lock']);
export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const ip = (req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
  if (limited(ip, 40)) return json({ error: 'rate_limited' }, 429);
  let p; try { p = JSON.parse(await req.text()); } catch { return json({ error: 'bad_request' }, 400); }
  const codes = String(process.env.BOOK_CODES || process.env.BOOK_CODE || '').split(',').map(norm).filter(Boolean);
  const code = norm(p && p.code);
  if (!code || (codes.length && !codes.includes(code))) return json({ error: 'forbidden' }, 403);
  const did = clip(p.did, 40).replace(/[^\w-]/g, '');
  const name = clip(p.name, 60).replace(/[\u0000-\u001f<>]/g, '').trim();
  if (!did || !name) return json({ error: 'no_identity' }, 400);
  const evs = (Array.isArray(p.ev) ? p.ev : []).slice(0, 80).filter((e) => e && TYPES.has(e.t));
  const st = await anStore(); const key = 'u/' + did;
  const now = Date.now();
  const u = (await st.get(key)) || { did, first: now, sessions: 0, unlocks: 0, fails: 0, opens: {}, right: 0, wrong: 0, errs: [], tests: [], recent: [], idle: 0 };
  u.name = name; if (p.phone) u.phone = clip(p.phone, 25).replace(/[^\d+ ]/g, ''); u.ua = clip(req.headers.get('user-agent'), 120); u.code = code;
  for (const e of evs) {
    const ts = Math.min(+e.ts || now, now); const sec = clip(e.sec, 90), item = clip(e.item, 10), q = clip(e.q, 140);
    u.last = Math.max(u.last || 0, ts);
    switch (e.t) {
      case 'session': u.sessions++; break;
      case 'unlock': u.unlocks++; break;
      case 'unlock_fail': u.fails++; break;
      case 'idle_lock': u.idle++; break;
      case 'open': if (sec) { const o = u.opens[sec] || (u.opens[sec] = { n: 0 }); o.n++; o.ts = ts; if (Object.keys(u.opens).length > 120) delete u.opens[sec]; } break;
      case 'mcq': case 'test_q': case 'self_grade':
        if (e.ok) u.right++; else { u.wrong++; u.errs.push({ sec, item, q, t: e.t, ts }); if (u.errs.length > 300) u.errs.splice(0, u.errs.length - 300); }
        break;
      case 'test_done': u.tests.push({ sec, pc: Math.max(0, Math.min(100, +e.pc || 0)), ts }); if (u.tests.length > 100) u.tests.shift(); break;
    }
    if (e.t !== 'open') { u.recent.push({ t: e.t, sec, ok: e.ok, ts }); if (u.recent.length > 30) u.recent.shift(); }
  }
  u.last = u.last || now;
  await st.set(key, u);
  return json({ ok: true, n: evs.length });
};
