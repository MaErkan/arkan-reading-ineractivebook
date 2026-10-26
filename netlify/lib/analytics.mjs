// مخزن تحليلات الطلاب (Netlify Blobs)
const mem = globalThis.__arkanAn || (globalThis.__arkanAn = new Map());
export async function anStore() {
  if (process.env.ARKAN_MEM === '1') return {
    async get(k) { return mem.has(k) ? JSON.parse(mem.get(k)) : null; },
    async set(k, v) { mem.set(k, JSON.stringify(v)); },
    async keys() { return [...mem.keys()]; } };
  const { getStore } = await import('@netlify/blobs');
  const s = getStore('analytics');
  return {
    async get(k) { return (await s.get(k, { type: 'json' })) || null; },
    async set(k, v) { await s.setJSON(k, v); },
    async keys() { const out = []; let cursor; do { const r = await s.list({ cursor }); out.push(...r.blobs.map((b) => b.key)); cursor = r.cursor; } while (cursor && out.length < 5000); return out; },
  };
}
