// طلبات اعتماد المعلم للأسئلة المقالية | Netlify Function (v2)
// المتغيرات: BOOK_CODES (أكواد فتح الكتاب)
import { reviewStore, json, norm, clip, limited, safeEq } from '../lib/store.mjs';
export const config = { path: '/api/review' };

const okDev = (s) => /^[A-Za-z0-9]{8,40}$/.test(s || '');
const okId = (s) => /^\d{1,3}-\d{1,3}$/.test(s || '');

function codeOk(req) {
  const codes = String(process.env.BOOK_CODES || '').split(',').map(norm).filter(Boolean);
  if (!codes.length) return 'not_configured';
  let c = ''; try { c = decodeURIComponent(req.headers.get('x-book-code') || ''); } catch { c = ''; }
  c = norm(c);
  return codes.some((x) => safeEq(x, c)) ? 'ok' : 'forbidden';
}

export default async (req, context) => {
  const ip = (context && context.ip) || req.headers.get('x-nf-client-connection-ip') || 'x';
  if (limited(ip)) return json({ error: 'rate_limited' }, 429);
  const c = codeOk(req);
  if (c === 'not_configured') return json({ error: 'not_configured' }, 503);
  if (c !== 'ok') return json({ error: 'forbidden' }, 403);
  const store = await reviewStore();

  if (req.method === 'GET') {
    const u = new URL(req.url);
    const dev = u.searchParams.get('dev') || '';
    const ids = (u.searchParams.get('ids') || '').split(',').filter(okId).slice(0, 40);
    if (!okDev(dev)) return json({ error: 'bad_request' }, 400);
    const decisions = {};
    for (const id of ids) {
      const r = await store.get(`${dev}__${id}`);
      if (r && r.status !== 'pending') decisions[id] = { st: r.status, note: r.note || '' };
    }
    return json({ decisions });
  }

  if (req.method === 'POST') {
    let b; try { b = await req.json(); } catch { return json({ error: 'bad_request' }, 400); }
    if (!okDev(b.dev) || !okId(b.id)) return json({ error: 'bad_request' }, 400);
    const qs = Array.isArray(b.qs) ? b.qs.slice(0, 6).map((q) => ({
      q: clip(q && q.q, 600),
      answers: Array.isArray(q && q.answers) ? q.answers.slice(0, 6).map((a) => clip(a, 1500)) : [],
    })) : [];
    if (!qs.some((q) => q.answers.some((a) => a.trim().length >= 2))) return json({ error: 'empty_answer' }, 400);
    const prev = await store.get(`${b.dev}__${b.id}`);
    if (prev && prev.status === 'approved') return json({ ok: true, status: 'approved' });
    const rec = {
      key: `${b.dev}__${b.id}`, dev: b.dev, id: b.id, ts: Date.now(), status: 'pending', note: '',
      name: clip(b.name, 60), std: clip(b.std, 160), level: clip(b.level, 20), quote: clip(b.quote, 1500),
      model: clip(b.model, 1500), qs,
      ai: { verdict: clip(b.ai && b.ai.verdict, 20), score: Number(b.ai && b.ai.score) || 0, why: clip(b.ai && b.ai.why, 700), missing: clip(b.ai && b.ai.missing, 500) },
    };
    await store.set(rec.key, rec);
    return json({ ok: true, status: 'pending' });
  }
  return json({ error: 'method' }, 405);
};
