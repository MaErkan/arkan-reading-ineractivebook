// هوية الطالب المسجّل: الاسم + المدرسة + الصف. لا يوجد كود فتح مشترك.
import { clip } from './store.mjs';

export const GRADE = 'الصف الثاني عشر';

export function normAr(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}

export function pinDigits(s) {
  return String(s || '')
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/\D/g, '');
}

export function cleanName(v) {
  return clip(v, 80).replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim();
}

export function cleanSchool(v) {
  return clip(v, 90).replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim();
}

const BAD_SCHOOL = new Set(['test', 'asdf', 'qwerty', 'xxx', 'admin', 'fake', 'school', 'none', 'null', 'مدرسه', 'اختبار', 'تجربه', 'تجريبي', 'لا يوجد', 'بدون', 'وهمي']);

export function schoolOk(v) {
  const raw = cleanSchool(v);
  if (raw.length < 4 || raw.length > 90) return false;
  if (!/[A-Za-z\u0600-\u06FF]/.test(raw)) return false;
  if (/(.)\1{5,}/.test(raw.replace(/\s/g, ''))) return false;
  const n = normAr(raw).replace(/^(مدرسه|school)\s+/, '').trim();
  if (!n || n.length < 3 || BAD_SCHOOL.has(n) || BAD_SCHOOL.has(normAr(raw))) return false;
  return true;
}

export function nameOk(v) {
  const name = cleanName(v);
  if (name.length < 5 || name.split(' ').length < 2) return false;
  if (/[0-9٠-٩۰-۹@#$%^&*_=+<>]/.test(name)) return false;
  return true;
}

export function readIdentity(req, body) {
  let fromHeader = {};
  try { fromHeader = JSON.parse(decodeURIComponent(req.headers.get('x-arkan-reg') || '')) || {}; } catch { fromHeader = {}; }
  const src = body && (body.name || body.school || body.grade) ? body : fromHeader;
  return {
    name: cleanName(src.name),
    school: cleanSchool(src.school),
    grade: clip(src.grade, 40).replace(/[\u0000-\u001f<>]/g, '').trim(),
  };
}

export function identityOk(id) {
  return !!(id && nameOk(id.name) && schoolOk(id.school) && id.grade === GRADE);
}
