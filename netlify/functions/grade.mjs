// التصحيح الذكي — أركان | Netlify Function (v2) | OpenAI
// المتغيرات: OPENAI_API_KEY + BOOK_CODES ، و OPENAI_MODEL (اختياري)
import * as AIL from '../lib/ail.mjs';
export const config = { path: '/api/grade' };
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const norm = (s) => String(s || '').replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).trim().toUpperCase();
const hits = new Map();
function limited(ip) { const now = Date.now(); const a = (hits.get(ip) || []).filter((t) => now - t < 60000); a.push(now); hits.set(ip, a); return a.length > 15; }
export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const key = process.env.OPENAI_API_KEY;
  const codes = String(process.env.BOOK_CODES || process.env.BOOK_CODE || '').split(',').map(norm).filter(Boolean);
  if (!codes.length || !key) return json({ error: 'not_configured' }, 503);
  let code = ''; try { code = norm(decodeURIComponent(req.headers.get('x-book-code') || '')); } catch {}
  if (!code || !codes.includes(code)) return json({ error: 'forbidden' }, 403);
  const ip = (req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
  if (limited(ip)) return json({ error: 'rate_limited' }, 429);
  let p; try { p = await req.json(); } catch { return json({ error: 'bad_request' }, 400); }
  const qs = Array.isArray(p && p.qs) ? p.qs : [];
  if (!qs.some((q) => (q.answers || []).some((a) => String(a || '').trim().length >= 2))) return json({ error: 'empty_answer' }, 400);
  const ctrl = new AbortController(), tm = setTimeout(() => ctrl.abort(), 25000);
  try {
    const send = (wf) => fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', signal: ctrl.signal,
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
      body: JSON.stringify(Object.assign({ model: process.env.OPENAI_MODEL || 'gpt-4.1-mini', temperature: 0.1, max_tokens: 700,
        messages: [{ role: 'system', content: AIL.RUBRIC + AIL.JSON_RULES }, { role: 'user', content: AIL.buildUserPrompt(p) }] }, wf ? { response_format: { type: 'json_object' } } : {})) });
    let r = await send(true); if (r.status === 400 || r.status === 422) r = await send(false);
    if (!r.ok) { console.error('OpenAI', r.status, (await r.text().catch(() => '')).slice(0, 300));
      return json({ error: r.status === 401 || r.status === 403 ? 'bad_key' : r.status === 429 ? 'rate_limited' : r.status === 404 ? 'bad_model' : 'upstream' }, 502); }
    const d = await r.json(); const raw = AIL.extractJson(d?.choices?.[0]?.message?.content);
    if (!raw) return json({ error: 'no_grade' }, 502);
    return json({ grade: AIL.termGuard(p, AIL.normalizeGrade(raw)) });
  } catch (e) { return json({ error: e && e.name === 'AbortError' ? 'timeout' : 'upstream' }, 504); }
  finally { clearTimeout(tm); }
};
