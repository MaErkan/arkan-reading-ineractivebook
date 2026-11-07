// عدد المشاركين الحقيقي: الحسابات التي أنشأت رقمًا سريًا فعلًا | GET /api/stats
import { getStore } from '@netlify/blobs';

export const config = { path: '/api/stats', method: 'GET' };

const reply = (body, cache) => new Response(JSON.stringify(body), {
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache },
});

export default async () => {
  try {
    const store = getStore('accounts');
    const keys = [];
    for await (const page of store.list({ prefix: 'account/', paginate: true })) {
      for (const b of page.blobs) keys.push(b.key);
    }
    let n = 0;
    for (let i = 0; i < keys.length; i += 20) {
      const rows = await Promise.all(keys.slice(i, i + 20).map((k) => store.get(k, { type: 'json' }).catch(() => null)));
      n += rows.filter((a) => a && a.pinHash).length;
    }
    return reply({ participants: n }, 'public, max-age=300');
  } catch {
    return reply({ participants: null }, 'no-store');
  }
};
