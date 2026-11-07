# قاعدة بيانات أركان (Supabase)
- المشروع: `arkan-reading-book` (المنطقة eu-central-1، المعرّف rcdmznjhyireduqfqxse).
- الجداول: `students` (الطلاب) و`events` (أحداث الاستخدام: فتح، إجابة، اختبار...). RLS مفعّل بدون سياسات، فلا وصول مباشر من المتصفح.
- الدوال (للخادم فقط، تُستدعى بمفتاح service_role): `ingest_track` و`mark_verified` و`import_legacy` و`owner_users`.
- الإعداد في Netlify: `SUPABASE_SERVICE_ROLE_KEY` (من Supabase: Project Settings → API → service_role). `SUPABASE_URL` اختياري.
- `OWNER_SOURCE=blobs` يعيد لوحة المالك للقراءة من Netlify Blobs مؤقتًا (للطوارئ).
- الجداول والدوال مُطبّقة بالفعل على المشروع (migrations: arkan_schema_v1 و arkan_functions_v1) ويمكن عرضها من Supabase → Database → Migrations.
