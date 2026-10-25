// مخزن طلبات الاعتماد: Netlify Blobs في الإنتاج، وذاكرة مؤقتة عند ARKAN_MEM=1 (للاختبار المحلي فقط)
const mem = globalThis.__arkanMem || (globalThis.__arkanMem = new Map());
export async function reviewStore() {
  if (process.env.ARKAN_MEM === '1') {
    return {
      async get(k) { return mem.has(k) ? JSON.parse(mem.get(k)) : null; },
      async set(k, v) { mem.set(k, JSON.stringify(v)); },
      async keys() { return [...mem.keys()]; },
    };
  }
  const { getStore } = await import('@netlify/blobs');
  const s = getStore('reviews');
  return {
    async get(k) { return (await s.get(k, { type: 'json' })) || null; },
    async set(k, v) { await s.setJSON(k, v); },
    async keys() {
      const out = []; let cursor;
      do {
        const r = await s.list({ cursor });
        out.push(...r.blobs.map((b) => b.key)); cursor = r.cursor;
      } while (cursor && out.length < 1000);
      return out;
    },
  };
}
export const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
export const norm = (s) =>
  String(s || '').replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).trim().toUpperCase();
export const clip = (v, n) => String(v == null ? '' : v).slice(0, n);
const hits = new Map();
export function limited(ip, max = 20) {
  const now = Date.now(), win = 60_000;
  const arr = (hits.get(ip) || []).filter((t) => now - t < win); arr.push(now); hits.set(ip, arr);
  return arr.length > max;
}
export function safeEq(a, b) {
  a = String(a); b = String(b); if (a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0;
}
