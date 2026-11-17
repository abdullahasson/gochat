قايمة المتصلين + مشكلة الكاش - 4 ملفات (انسخهم فوق نفس المسارات)

server.js            : الملفات الساخنة (vlist / users-style / admin / bars-style ...) بقت no-cache فعلًا.
                       قبل كده express.static كان بيكتب فوق no-cache بكاش ساعة + stale-while-revalidate فالتعديلات ما بتظهرش.
public/vlist.js      : ترتيب الغرفة (أعضاء الغرفة -> شريط المتواجدين في الدردشة -> اللي برا الغرفة)
public/users-style.js: الصفوف absolute (إصلاح الفراغ تحت الهيدر)
public/index.ejs     : رقم نسخة vlist.js?3 و users-style.js?12 (عشان المتصفح يحمّل الجديد فورًا)

لو index.ejs عندك متعدّل ومش عايز تستبدله، غيّر الرقمين بس:
  sed -i 's/vlist.js?2/vlist.js?3/; s/users-style.js?11/users-style.js?12/' /root/public/index.ejs

بعد النسخ:
1) pm2 restart server   (لازم - server.js اتعدّل)
2) Ctrl+Shift+R في الشات
