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
  if (req.method === 'DELETE') { const d = new URL(req.url).searchParams.get('did') || ''; if (!/^[\w-]{3,40}$/.test(d)) return json({ error: 'bad' }, 400); await st.del('u/' + d); return json({ ok: true }); }
  const keys = (await st.keys()).filter((x) => x.startsWith('u/'));
  const users = [];
  for (let i = 0; i < keys.length; i += 20) users.push(...(await Promise.all(keys.slice(i, i + 20).map((x) => st.get(x)))).filter(Boolean));
  return json({ users, at: Date.now() });
};
