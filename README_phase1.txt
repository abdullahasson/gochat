المرحلة 1: سيرفر + داتابيز غلاف البروفايل

الملفات (مساراتها نسبة لمجلد chat):
server.js                 - رفع الغلاف (nf=cover) + حدث SEND_EVENT_EMIT_COVER + cover في بيانات العضو
router/users_list.js      - ensureCover(): بيضيف عمود cover تلقائي لو مش موجود
router/profile_cover.js   - ملف جديد: قص الصورة 900x300 + حفظ الغلاف + التحقق

بعد النسخ: pm2 restart server
