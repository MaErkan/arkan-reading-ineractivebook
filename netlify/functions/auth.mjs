import { getStore } from '@netlify/blobs';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export const config = {
  path: '/api/auth',
  method: ['GET', 'POST'],
  rateLimit: { action: 'rate_limit', aggregateBy: 'ip', windowSize: 60, windowLimit: 40 },
};

const memory = globalThis.__arkanAccounts || (globalThis.__arkanAccounts = new Map());
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});
const clean = (value, max = 80) => String(value || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
const digits = (value) => String(value || '')
  .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
  .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
  .replace(/\D/g, '');
const normalized = (value) => clean(value).toLowerCase()
  .normalize('NFKD').replace(/[\u064b-\u065f\u0670\u0640]/g, '')
  .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
  .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const sha = (value) => createHash('sha256').update(value).digest('hex');
const accountKey = (name, school, grade) => `account/${sha(`${normalized(name)}|${normalized(school)}|${normalized(grade)}`)}`;
const pinHash = (pin, salt) => scryptSync(pin, salt, 32).toString('hex');
const same = (a, b) => {
  const left = Buffer.from(String(a), 'hex');
  const right = Buffer.from(String(b), 'hex');
  return left.length === right.length && timingSafeEqual(left, right);
};

async function store() {
  if (Netlify.env.get('ARKAN_MEM') === '1') {
    return {
      async get(key) { return memory.has(key) ? structuredClone(memory.get(key)) : null; },
      async set(key, value) { memory.set(key, structuredClone(value)); },
    };
  }
  const blobStore = getStore('accounts');
  return {
    async get(key) { return (await blobStore.get(key, { type: 'json' })) || null; },
    async set(key, value) { await blobStore.setJSON(key, value); },
  };
}

function validIdentity(name, school, grade) {
  return name.length >= 5 && name.split(' ').length >= 2 && school.length >= 3 && grade.length >= 3;
}

async function sessionFor(db, account) {
  const session = randomBytes(32).toString('base64url');
  await db.set(`session/${sha(session)}`, { acct: account.id, createdAt: Date.now(), expiresAt: Date.now() + 30 * 86400_000 });
  return session;
}

export default async (req) => {
  if (req.method === 'GET') return json({ ok: true, service: 'arkan-accounts' });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  let input;
  try { input = await req.json(); } catch { return json({ error: 'bad_request' }, 400); }
  const action = clean(input.action, 20);
  const name = clean(input.name, 60);
  const school = clean(input.school, 90);
  const grade = clean(input.grade, 40) || 'الصف الثاني عشر';
  const pin = digits(input.pin);
  const did = clean(input.did, 60).replace(/[^\w-]/g, '');

  if (!['register', 'login', 'set-pin', 'status', 'reset'].includes(action)) return json({ error: 'action' }, 400);
  if (!validIdentity(name, school, grade)) return json({ error: 'bad_credentials' }, 400);
  const db = await store();
  const key = accountKey(name, school, grade);
  let account = await db.get(key);

  if (action === 'status') return json({ ok: true, exists: !!account, needs_pin: !!account && !account.pinHash });

  if (action === 'register') {
    if (!input.consent) return json({ error: 'consent' }, 400);
    if (!/^\d{6}$/.test(pin)) return json({ error: 'bad_pin' }, 400);
    if (account) return json({ error: 'exists' }, 409);
    const salt = randomBytes(16).toString('hex');
    account = {
      id: sha(key).slice(0, 24), name, school, grade, salt, pinHash: pinHash(pin, salt),
      createdAt: Date.now(), updatedAt: Date.now(), devices: did ? [did] : [], failed: 0,
    };
    await db.set(key, account);
    return json({ ok: true, acct: account.id, session: await sessionFor(db, account) }, 201);
  }

  if (action === 'set-pin') {
    if (!input.consent) return json({ error: 'consent' }, 400);
    if (!/^\d{6}$/.test(pin)) return json({ error: 'bad_pin' }, 400);
    if (account && account.pinHash) return json({ error: 'exists' }, 409);
    const salt = randomBytes(16).toString('hex');
    account = account || { id: sha(key).slice(0, 24), name, school, grade, createdAt: Date.now(), devices: [] };
    account.salt = salt; account.pinHash = pinHash(pin, salt); account.updatedAt = Date.now();
    if (did && !account.devices.includes(did)) account.devices.push(did);
    await db.set(key, account);
    return json({ ok: true, acct: account.id, session: await sessionFor(db, account) });
  }

  if (action === 'reset') {
    const resetCode = Netlify.env.get('TEACHER_RESET_CODE');
    if (!resetCode) return json({ error: 'not_configured' }, 503);
    const supplied = clean(input.teacherCode, 120);
    const expected = Buffer.from(sha(resetCode));
    const actual = Buffer.from(sha(supplied));
    if (!timingSafeEqual(expected, actual)) return json({ error: 'forbidden' }, 403);
    if (!account) return json({ error: 'bad_credentials' }, 404);
    account.pinHash = ''; account.salt = ''; account.failed = 0; account.lockUntil = 0; account.updatedAt = Date.now();
    await db.set(key, account);
    return json({ ok: true });
  }

  if (!account || !account.pinHash || !account.salt) return json({ error: account ? 'needs_pin' : 'bad_credentials' }, 401);
  const now = Date.now();
  if (account.lockUntil && now < account.lockUntil) return json({ error: 'locked', wait: Math.ceil((account.lockUntil - now) / 1000) }, 429);
  if (!/^\d{6}$/.test(pin) || !same(pinHash(pin, account.salt), account.pinHash)) {
    account.failed = (account.failed || 0) + 1;
    if (account.failed >= 5) { account.lockUntil = now + 5 * 60_000; account.failed = 0; }
    await db.set(key, account);
    return json({ error: 'bad_credentials' }, 401);
  }
  account.failed = 0; account.lockUntil = 0; account.lastLoginAt = now; account.updatedAt = now;
  account.devices = Array.isArray(account.devices) ? account.devices : [];
  if (did && !account.devices.includes(did)) account.devices.push(did);
  account.devices = account.devices.slice(-10);
  await db.set(key, account);
  return json({ ok: true, acct: account.id, session: await sessionFor(db, account) });
};
