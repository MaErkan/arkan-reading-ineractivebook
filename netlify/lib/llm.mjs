// اختيار مزوّد الذكاء: نفضّل OpenRouter إذا كان OPENROUTER_API_KEY موجودًا
// (حتى لو OPENAI_API_KEY موجود أيضًا، لأن مفاتيح OpenAI ترجع 401 لهذا الحساب حاليًا).
// وإلا نرجع إلى OpenAI المباشر. OPENROUTER_MODEL / OPENAI_MODEL لتغيير النموذج.
export function llm() {
  const or = process.env.OPENROUTER_API_KEY;
  if (or) return {
    name: 'openrouter', key: or, url: 'https://openrouter.ai/api/v1/chat/completions',
    model: (() => { const m = process.env.OPENROUTER_MODEL || process.env.OPENAI_MODEL || 'openai/gpt-4o-mini'; return m.includes('/') ? m : 'openai/' + m; })(),
    extra: { 'HTTP-Referer': 'https://arkan-interactive-intelligent-book.netlify.app', 'X-Title': 'Arkan Interactive Book' },
  };
  const k = process.env.OPENAI_API_KEY;
  if (k) return { name: 'openai', key: k, url: 'https://api.openai.com/v1/chat/completions', model: process.env.OPENAI_MODEL || 'gpt-4.1-mini', extra: {} };
  return null;
}
