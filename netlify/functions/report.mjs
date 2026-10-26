// تقرير صاحب الكتاب — GET بمفتاح سرّي (ARKAN_ANALYTICS_KEY)
import { json, safeEq } from '../lib/store.mjs';
import { anStore } from '../lib/analytics.mjs';
import { createHash } from 'node:crypto';
// بصمة SHA-256 لمفتاح بوت صاحب الكتاب (المفتاح نفسه ليس في المستودع)؛ أو ARKAN_ANALYTICS_KEY من بيئة Netlify
const KEY_SHA256 = '9299192fa8f1ff38c7448132575ca5d8b5ae1509518cfa3ed6ddb6a538adf385';
export const config = { path: '/api/report' };
export default async (req) => {
  const secret = process.env.ARKAN_ANALYTICS_KEY || '';
  const k = req.headers.get('x-arkan-key') || '';
  const okEnv = secret && safeEq(k, secret);
  const okHash = k.length >= 20 && safeEq(createHash('sha256').update(k).digest('hex'), KEY_SHA256);
  if (!okEnv && !okHash) return json({ error: 'forbidden' }, 403);
  const st = await anStore();
  if (req.method === 'DELETE') {
    const q = new URL(req.url).searchParams.get('mailq');
    if (q != null) { const id = q.replace(/^mailq\//, ''); if (!/^[a-f0-9]{8,64}$/.test(id)) return json({ error: 'bad' }, 400); await st.del('mailq/' + id); return json({ ok: true }); }
    const d = new URL(req.url).searchParams.get('did') || ''; if (!/^[\w-]{3,40}$/.test(d)) return json({ error: 'bad' }, 400); await st.del('u2/' + d); return json({ ok: true }); }
  const all = await st.keys(); const keys = all.filter((x) => x.startsWith('u2/'));
  const users = [];
  for (let i = 0; i < keys.length; i += 20) users.push(...(await Promise.all(keys.slice(i, i + 20).map((x) => st.get(x)))).filter(Boolean));
  const mk = all.filter((x) => x.startsWith('mailq/')); const mailq = [];
  for (const x of mk) { const v = await st.get(x); if (v) mailq.push({ id: x.slice(6), email: v.email, ...(v.phone ? { phone: v.phone } : {}), name: v.name, did: v.did, ts: v.ts, tries: v.tries || 0 }); }
  return json({ users, mailq, at: Date.now() });
};
