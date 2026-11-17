/* تشغيل مرة واحدة لتجهيز النسخ المخففة للملفات القديمة: node scripts/make-thumbs.js
   (آمن تشغيله أكتر من مرة — بيتخطى اللي جاهز) */
const fs = require("fs");
const path = require("path");
const T = require("../router/thumbs");

(async () => {
  let done = 0, saved = 0, total = 0;
  for (const kind of Object.keys(T.KINDS)) {
    const dir = path.join(T.SRC_DIR, kind);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      const src = path.join(dir, name);
      if (!fs.statSync(src).isFile()) continue;
      const t = await T.ensure(kind, name);
      total += fs.statSync(src).size;
      if (t) {
        saved += fs.statSync(src).size - fs.statSync(t).size;
        done++;
      }
    }
  }
  console.log("تم تجهيز " + done + " ملف، التوفير: " + (saved / 1048576).toFixed(2) + " ميجا من " + (total / 1048576).toFixed(2));
})();
