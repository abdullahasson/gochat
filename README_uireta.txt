Uireta.1.0 - واجهة لوجين بديلة (انسخ الملفات فوق نفس المسارات)

ملفات جديدة:
 public/uireta.css
 public/uireta.js
 public/partials/uireta-login.ejs
ملفات معدّلة:
 server.js         (أمر SEND_ADMIN_UIRETA + ملف الحالة uploads/uireta_<host>.txt)
 public/index.ejs  (بيرسم واجهة Uireta لما تكون شغّالة)
 public/admin.html (كارت Uireta.1.0 تحت Nopta)
 public/admin.js   (مفتاح التفعيل/الإيقاف)

بعد النسخ:
 1) pm2 restart server
 2) افتح لوحة التحكم > الإضافات و Ctrl+Shift+R
 3) فعّل Uireta.1.0 ثم افتح صفحة الدخول و Ctrl+Shift+R

ملاحظات:
 - لو Nopta وUireta شغّالين: صفحة الدخول بتاخد شكل Uireta، والإيقاف بيرجّع الشكل السابق.
 - رابط زر اشتراك VIP: UIRETA_LINKS.vip في أول public/uireta.js
 - نصوص الهيدر والبانر: في public/partials/uireta-login.ejs
