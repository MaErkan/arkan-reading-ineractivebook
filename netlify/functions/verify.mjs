// تفعيل إيميل الطالب بكود (OTP) — يُرسل الكود عبر Resend أو Brevo أو SMTP حسب المتغيرات في Netlify
import { json, norm, clip, limited, safeEq } from '../lib/store.mjs';
import { anStore } from '../lib/analytics.mjs';
import { createHash, randomInt } from 'node:crypto';
export const config = { path: '/api/verify' };
const RX = /^[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}$/i;
const TTL = 10 * 60_000, COOL = 60_000, MAX_SEND_H = 5, MAX_TRIES = 5;
const sha = (s) => createHash('sha256').update(s).digest('hex');
const salt = () => process.env.OTP_SECRET || process.env.BOOK_CODES || process.env.BOOK_CODE || 'arkan';
export function mailMode() {
  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.BREVO_API_KEY) return 'brevo';
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return 'smtp';
  return '';
}
async function send(to, code) {
  const from = process.env.EMAIL_FROM || 'Arkan <onboarding@resend.dev>';
  const subject = 'كود تفعيل كتاب أركان: ' + code;
  const text = `كود التفعيل الخاص بك هو: ${code}\nصالح لمدة 10 دقائق. لو ما طلبتش الكود تجاهل الرسالة.`;
  const html = `<div dir="rtl" style="font-family:Tahoma,Arial;font-size:16px">كود تفعيل كتاب أركان:<h1 style="letter-spacing:6px;color:#0B7C82">${code}</h1>صالح لمدة 10 دقائق.</div>`;
  const m = mailMode();
  if (m === 'resend') {
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'content-type': 'application/json' }, body: JSON.stringify({ from, to: [to], subject, text, html }) });
    if (!r.ok) throw new Error('resend ' + r.status + ' ' + (await r.text()).slice(0, 200));
  } else if (m === 'brevo') {
    const mm = /^(.*?)\s*<([^>]+)>$/.exec(from); const sender = mm ? { name: mm[1] || 'Arkan', email: mm[2] } : { name: 'Arkan', email: from };
    const r = await fetch('https://api.brevo.com/v3/smtp/email', { method: 'POST', headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ sender, to: [{ email: to }], subject, textContent: text, htmlContent: html }) });
    if (!r.ok) throw new Error('brevo ' + r.status + ' ' + (await r.text()).slice(0, 200));
  } else if (m === 'smtp') {
    const nm = await import('nodemailer');
    const t = nm.default.createTransport({ host: process.env.SMTP_HOST, port: +(process.env.SMTP_PORT || 465), secure: (process.env.SMTP_PORT || '465') === '465', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
    await t.sendMail({ from: process.env.EMAIL_FROM || process.env.SMTP_USER, to, subject, text, html });
  } else throw new Error('no_provider');
}
export default async (req) => {
  if (req.method === 'GET') return json({ enabled: !!mailMode() });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const ip = (req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
  if (limited(ip, 15)) return json({ error: 'rate_limited' }, 429);
  let p; try { p = JSON.parse(await req.text()); } catch { return json({ error: 'bad_request' }, 400); }
  const codes = String(process.env.BOOK_CODES || process.env.BOOK_CODE || '').split(',').map(norm).filter(Boolean);
  const bc = norm(p && p.code);
  if (!bc || (codes.length && !codes.includes(bc))) return json({ error: 'forbidden' }, 403);
  const email = clip(p.email, 80).trim().toLowerCase();
  const did = clip(p.did, 40).replace(/[^\w-]/g, '');
  if (!RX.test(email) || !did) return json({ error: 'bad_email' }, 400);
  if (!mailMode()) return json({ enabled: false });
  const st = await anStore(); const key = 'otp/' + sha(email).slice(0, 32); const now = Date.now();
  const o = (await st.get(key)) || { sends: [] };
  if (p.action === 'request') {
    o.sends = (o.sends || []).filter((t) => now - t < 3600_000);
    if (o.last && now - o.last < COOL) return json({ error: 'cooldown', wait: Math.ceil((COOL - (now - o.last)) / 1000) }, 429);
    if (o.sends.length >= MAX_SEND_H) return json({ error: 'too_many' }, 429);
    const otp = String(randomInt(0, 1e6)).padStart(6, '0');
    try { await send(email, otp); } catch (e) { console.error('otp send', e.message); return json({ error: 'send_failed' }, 502); }
    Object.assign(o, { h: sha(otp + '|' + email + '|' + salt()), exp: now + TTL, tries: 0, last: now, did }); o.sends.push(now);
    await st.set(key, o); return json({ ok: true, enabled: true });
  }
  if (p.action === 'confirm') {
    const c = String(p.otp || '').replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/\D/g, '');
    if (!o.h || now > o.exp) return json({ error: 'expired' }, 400);
    if ((o.tries || 0) >= MAX_TRIES) return json({ error: 'locked' }, 429);
    if (!safeEq(sha(c + '|' + email + '|' + salt()), o.h)) { o.tries = (o.tries || 0) + 1; await st.set(key, o); return json({ error: 'wrong', left: MAX_TRIES - o.tries }, 400); }
    o.h = ''; o.ok = now; await st.set(key, o);
    const uk = 'u/' + did; const u = (await st.get(uk)) || { did, first: now, sessions: 0, unlocks: 0, fails: 0, opens: {}, right: 0, wrong: 0, errs: [], tests: [], recent: [], idle: 0 };
    u.email = email; u.verifiedEmail = email; u.verifiedAt = now; if (p.name) u.name = clip(p.name, 60).replace(/[\u0000-\u001f<>]/g, '').trim();
    await st.set(uk, u);
    return json({ ok: true, tok: sha('v|' + did + '|' + email + '|' + salt()).slice(0, 32) });
  }
  return json({ error: 'action' }, 400);
};
