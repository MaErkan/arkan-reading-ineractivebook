// تسجيل الطالب ودخوله برقم سري شخصي من 6 أرقام. لا يُقبل أي كود فتح مشترك.
import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { json, clip, limited, safeEq } from '../lib/store.mjs';
import { anStore } from '../lib/analytics.mjs';
import { GRADE, normAr, pinDigits, cleanName, cleanSchool, schoolOk, nameOk } from '../lib/identity.mjs';

export const config = { path: '/api/auth' };
const scryptAsync = promisify(scrypt);
const KEY = (id) => 'acct/' + createHash('sha256').update(normAr(id.name) + '|' + normAr(id.school) + '|' + id.grade).digest('hex').slice(0, 40);

async function hashPin(pin, salt) {
  const buf = await scryptAsync(pin, salt, 32, { N: 16384, r: 8, p: 1 });
  return buf.toString('base64');
}
function sameHash(a, b) {
  const x = Buffer.from(String(a || ''), 'base64');
  const y = Buffer.from(String(b || ''), 'base64');
  if (x.length !== y.length || !x.length) return false;
  return timingSafeEqual(x, y);
}
function session() { return randomBytes(24).toString('hex'); }

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const ip = (req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
  if (limited(ip, 30)) return json({ error: 'rate_limited', wait: 60 }, 429);
  let p; try { p = await req.json(); } catch { return json({ error: 'bad_request' }, 400); }
  const id = { name: cleanName(p.name), school: cleanSchool(p.school), grade: clip(p.grade, 40).trim() };
  if (!nameOk(id.name) || !schoolOk(id.school) || id.grade !== GRADE) return json({ error: 'identity' }, 400);
  const pin = pinDigits(p.pin);
  const st = await anStore();
  const key = KEY(id);
  const now = Date.now();
  const rec = (await st.get(key)) || null;

  if (p.action === 'status') {
    return json({ ok: true, exists: !!rec, pinSet: !!(rec && rec.pinSet && rec.pinHash) });
  }

  if (rec && rec.lockUntil && now < rec.lockUntil && (p.action === 'login' || p.action === 'register' || p.action === 'set-pin')) {
    return json({ error: 'locked', wait: Math.ceil((rec.lockUntil - now) / 1000) }, 429);
  }

  async function fail(record) {
    const n = (record.fails || 0) + 1;
    record.fails = n;
    if (n >= 8) { record.lockUntil = now + 15 * 60_000; record.fails = 0; }
    await st.set(key, record);
  }

  if (p.action === 'register') {
    if (!p.consent) return json({ error: 'consent' }, 400);
    if (rec && rec.pinSet) return json({ error: 'exists' }, 409);
    if (pin.length !== 6) return json({ error: 'bad_pin' }, 400);
    const salt = randomBytes(16).toString('base64');
    const pinHash = await hashPin(pin, salt);
    const row = {
      name: id.name, school: id.school, grade: id.grade,
      pinHash, salt, pinSet: true, consent: true, consentAt: now,
      acct: key.slice(5, 15), did: clip(p.did, 40), created: rec && rec.created || now, at: now, fails: 0,
    };
    const tok = session();
    row.session = tok;
    await st.set(key, row);
    return json({ ok: true, acct: row.acct, session: tok });
  }

  if (p.action === 'login') {
    if (!rec) return json({ error: 'bad_credentials' }, 400);
    if (!rec.pinSet || !rec.pinHash) return json({ error: 'needs_pin' }, 409);
    if (pin.length !== 6 || !(await samePin(pin, rec))) { await fail(rec); return json({ error: 'bad_pin' }, 400); }
    rec.fails = 0; rec.lockUntil = 0; rec.at = now; rec.did = clip(p.did, 40) || rec.did;
    const tok = session(); rec.session = tok;
    await st.set(key, rec);
    return json({ ok: true, acct: rec.acct || '', session: tok });
  }

  if (p.action === 'set-pin') {
    if (!rec) return json({ error: 'bad_credentials' }, 400);
    if (rec.pinSet && rec.pinHash) return json({ error: 'exists' }, 409);
    if (!p.consent && !rec.consent) return json({ error: 'consent' }, 400);
    if (pin.length !== 6) return json({ error: 'bad_pin' }, 400);
    rec.salt = randomBytes(16).toString('base64');
    rec.pinHash = await hashPin(pin, rec.salt);
    rec.pinSet = true; rec.consent = true; rec.consentAt = rec.consentAt || now;
    rec.fails = 0; rec.lockUntil = 0; rec.at = now;
    const tok = session(); rec.session = tok;
    await st.set(key, rec);
    return json({ ok: true, acct: rec.acct || '', session: tok });
  }

  if (p.action === 'reset') {
    const want = String(process.env.TEACHER_CODE || '');
    if (!want) return json({ error: 'not_configured' }, 503);
    const got = String(p.teacherCode || '');
    if (!safeEq(want, got)) return json({ error: 'forbidden' }, 403);
    if (!rec) return json({ error: 'bad_credentials' }, 400);
    rec.pinSet = false; rec.pinHash = ''; rec.salt = ''; rec.session = ''; rec.fails = 0; rec.lockUntil = 0; rec.at = now;
    await st.set(key, rec);
    return json({ ok: true });
  }

  return json({ error: 'action' }, 400);
};

async function samePin(pin, rec) {
  if (!rec || !rec.salt || !rec.pinHash) return false;
  const got = await hashPin(pin, rec.salt);
  return sameHash(got, rec.pinHash);
}
