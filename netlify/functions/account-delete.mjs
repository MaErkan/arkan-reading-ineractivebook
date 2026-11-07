// حذف سجل الطالب من الخادم عند طلبه من صفحة حسابي.
import { createHash } from 'node:crypto';
import { json, clip, limited } from '../lib/store.mjs';
import { anStore } from '../lib/analytics.mjs';
import { normAr, cleanName, cleanSchool, GRADE } from '../lib/identity.mjs';

export const config = { path: '/api/account-delete' };

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const ip = (req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
  if (limited(ip, 10)) return json({ error: 'rate_limited' }, 429);
  let p; try { p = await req.json(); } catch { return json({ error: 'bad_request' }, 400); }
  const name = cleanName(p.name), school = cleanSchool(p.school), grade = clip(p.grade, 40).trim() || GRADE;
  if (!name || !school) return json({ error: 'no_identity' }, 400);
  const st = await anStore();
  const key = 'acct/' + createHash('sha256').update(normAr(name) + '|' + normAr(school) + '|' + grade).digest('hex').slice(0, 40);
  try { await st.del(key); } catch { /* السجل قد يكون غير موجود */ }
  const did = clip(p.did, 40).replace(/[^\w-]/g, '');
  if (did) { try { await st.del('u2/' + did); } catch { /* لا سجل تتبّع */ } }
  return json({ ok: true });
};
