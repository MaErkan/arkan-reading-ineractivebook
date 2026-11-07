// نقل بيانات الطلاب القديمة من Netlify Blobs إلى Supabase | POST /api/migrate (بمفتاح المالك)
// آمن للتكرار: الطالب الموجود في Supabase لا يُستورد مرة ثانية.
import { json, safeEq, limited } from '../lib/store.mjs';
import { anStore } from '../lib/analytics.mjs';
import { sbEnabled, rpc } from '../lib/sb.mjs';
export const config = { path: '/api/migrate' };
export default async (req, context) => {
  const ip = (context && context.ip) || req.headers.get('x-nf-client-connection-ip') || 'x';
  if (limited(ip, 10)) return json({ error: 'rate_limited' }, 429);
  const want = String(process.env.OWNER_KEY || process.env.ARKAN_ANALYTICS_KEY || '');
  if (!want) return json({ error: 'not_configured' }, 503);
  let got = ''; try { got = decodeURIComponent(req.headers.get('x-owner-key') || ''); } catch {}
  if (!safeEq(want, got)) return json({ error: 'forbidden' }, 403);
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  if (!sbEnabled()) return json({ error: 'supabase_not_configured' }, 503);
  const st = await anStore();
  const keys = (await st.keys()).filter((k) => k.startsWith('u2/'));
  let imported = 0, skipped = 0, failed = 0; const errors = [];
  for (const k of keys) {
    try {
      const u = await st.get(k); if (!u) continue;
      const rec = { ...u, verified: !!(u.email && u.verifiedEmail === u.email) };
      const n = await rpc('import_legacy', rec, 15000);
      if (n > 0) imported++; else skipped++;
    } catch (e) { failed++; if (errors.length < 5) errors.push(String(e.message).slice(0, 160)); }
  }
  return json({ total: keys.length, imported, skipped, failed, errors });
};
