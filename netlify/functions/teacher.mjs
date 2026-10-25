// لوحة المعلم: عرض طلبات الاعتماد واعتمادها/رفضها | Netlify Function (v2)
// المتغيرات: TEACHER_CODE (رمز سري للمعلم)
import { reviewStore, json, clip, limited, safeEq } from '../lib/store.mjs';
export const config = { path: '/api/teacher' };

export default async (req, context) => {
  const ip = (context && context.ip) || req.headers.get('x-nf-client-connection-ip') || 'x';
  if (limited(ip, 60)) return json({ error: 'rate_limited' }, 429);
  const want = String(process.env.TEACHER_CODE || '');
  if (!want) return json({ error: 'not_configured' }, 503);
  let got = ''; try { got = decodeURIComponent(req.headers.get('x-teacher-code') || ''); } catch {}
  if (!safeEq(want, got)) return json({ error: 'forbidden' }, 403);
  const store = await reviewStore();

  if (req.method === 'GET') {
    const status = new URL(req.url).searchParams.get('status') === 'all' ? 'all' : 'pending';
    const keys = await store.keys();
    const out = [];
    for (const k of keys) { const r = await store.get(k); if (r && (status === 'all' || r.status === 'pending')) out.push(r); }
    out.sort((a, b) => b.ts - a.ts);
    return json({ items: out.slice(0, 300) });
  }
  if (req.method === 'POST') {
    let b; try { b = await req.json(); } catch { return json({ error: 'bad_request' }, 400); }
    if (!['approved', 'rejected', 'pending'].includes(b.decision) || typeof b.key !== 'string') return json({ error: 'bad_request' }, 400);
    const r = await store.get(b.key);
    if (!r) return json({ error: 'not_found' }, 404);
    r.status = b.decision; r.note = clip(b.note, 400); r.decidedAt = Date.now();
    await store.set(b.key, r);
    return json({ ok: true });
  }
  return json({ error: 'method' }, 405);
};
