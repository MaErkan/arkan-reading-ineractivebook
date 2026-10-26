# أركان التفاعلي في القراءة

تم تطبيق التحديث المرفق v22.4 مع الإبقاء على الأقسام الثلاثة الأولى وحذف القسم الرابع الخاص بالمسار العلمي. استُخدمت الصورة المرفقة لأيقونة المتصفح والتطبيق وشاشة الدخول.

ملفات الموقع في `public`، ودوال الخادم في `netlify/functions`. يحدد `netlify.toml` إعدادات النشر. يستمر فتح المحتوى باستخدام كود الكتاب الحالي، وتبقى إجابات الطالب وملاحظاته محفوظة على جهازه.

## تفعيل الإيميل بكود (OTP)
`/api/verify` يبعت كود 6 أرقام (صالح 10 دقائق، إعادة إرسال بعد 60 ث، 5 إرسالات/ساعة، 5 محاولات).
يتفعّل تلقائياً أول ما تضيف في Netlify → Environment variables واحد من:
- `RESEND_API_KEY` + `EMAIL_FROM` (مثال `Arkan <no-reply@yourdomain.com>` بدومين متحقق في Resend)
- أو `BREVO_API_KEY` + `EMAIL_FROM` (إيميل مرسل متحقق في Brevo)
- أو `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` (مثلاً Gmail مع App Password)
بدون أي منها، الكتاب يشتغل زي الأول من غير كود.

## SMS activation (Twilio)
The activation code is sent by email (mail queue) and, when configured, instantly by SMS.
Set these in Netlify → Site settings → Environment variables (never commit them):
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` (Twilio number or alphanumeric sender, e.g. `Arkan`)
- `ACTIVATION_CODE` (plain activation code used in the SMS body)
If any are missing, SMS is skipped and email still goes out.
