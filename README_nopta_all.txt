Nopta.1.0 - كل الملفات المعدّلة (انسخهم فوق نفس المسارات)

1) كروت قايمة المتصلين (الغلاف): public/users-style.js + public/vlist.js
2) قايمة المتصلين في صفحة اللوجين: server.js + public/x2.js
3) public/index.ejs : أرقام النسخ (vlist.js?7 / users-style.js?13 / x2.js?83)

بعد النسخ:
 pm2 restart server     (لازم - server.js اتعدّل)
 Ctrl+Shift+R في الشات وفي صفحة اللوجين

لو index.ejs عندك متعدّل: sed -i 's/vlist.js?3/vlist.js?7/; s/users-style.js?12/users-style.js?13/; s/x2.js?82/x2.js?83/' /root/public/index.ejs

[تحديث] كلمة الحالة (نشط/بعيد/مشغول/غير متاح/متصل) بقت تظهر في التصميم الافتراضي كمان (تحت يمين الكارت):
 public/vlist.js + public/index.ejs (vlist.js?7)

[تحديث] التصميم الافتراضي (مش Nopta): الكارت 76px بحواف مدوّرة وبينه وبين اللي بعده مسافة، الإطار 72 والصورة دايرة 56 في نصه،
 والغلاف cover بدل ما يتمط. (تصميم Nopta زي ما هو). الملفات: public/vlist.js + public/index.ejs (vlist.js?7)
[تحديث] التصميم الافتراضي: اتلغت الحواف المدوّرة والحدّ (كارت مربع)، المسافات والإطار زي ما هم. vlist.js?7
