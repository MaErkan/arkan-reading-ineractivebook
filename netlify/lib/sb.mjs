// عميل Supabase خفيف (بدون مكتبات) — يعمل فقط حين يُضبط SUPABASE_SERVICE_ROLE_KEY في Netlify
// المتغيرات: SUPABASE_URL (اختياري، الافتراضي مشروع arkan-reading-book) + SUPABASE_SERVICE_ROLE_KEY
const URL_ = () => String(process.env.SUPABASE_URL || 'https://rcdmznjhyireduqfqxse.supabase.co').replace(/\/+$/, '');
const KEY = () => String(process.env.SUPABASE_SERVICE_ROLE_KEY || '');
export const sbEnabled = () => !!KEY();

export async function rpc(name, args = {}, timeoutMs = 8000) {
  const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(`${URL_()}/rest/v1/rpc/${name}`, {
      method: 'POST', signal: ctl.signal,
      // المفاتيح الجديدة (sb_secret_...) تُرسل في apikey فقط؛ المفاتيح القديمة (JWT) تُرسل في الهيدرين
      headers: KEY().startsWith('sb_') ? { 'content-type': 'application/json', apikey: KEY() } : { 'content-type': 'application/json', apikey: KEY(), authorization: 'Bearer ' + KEY() },
      body: JSON.stringify(args),
    });
    const txt = await r.text();
    if (!r.ok) throw new Error(`rpc ${name} ${r.status}: ${txt.slice(0, 200)}`);
    return txt ? JSON.parse(txt) : null;
  } finally { clearTimeout(tm); }
}

// تسجيل أحداث الطالب (نسخة ثانية بجانب Blobs). لا يرمي أخطاء حتى لا يتعطل الكتاب.
export async function sbTrack(rec) {
  if (!sbEnabled()) return false;
  try { await rpc('ingest_track', rec); return true; } catch (e) { console.error('sbTrack', e.message); return false; }
}
export async function sbVerified({ did, name, email, phone }) {
  if (!sbEnabled()) return false;
  try { await rpc('ingest_track', { did, name, email, phone, ev: [] }); await rpc('mark_verified', { p_did: did, p_email: email }); return true; }
  catch (e) { console.error('sbVerified', e.message); return false; }
}
