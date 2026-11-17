/* شكل الحائط الجديد (زي الصورة): هيدر أسود + زر "مبدعين الجدار" ذهبي + كروت المنشورات + شريط الكتابة
   بيتحمّل بس لما الأدمن يفعّل زر "تغيير الشريط العلوي والسفلي" (لوحة التحكم > الإضافات).
   لو اتلغى الزر الملف ده مش بيتحمّل والحائط يرجع افتراضي بالكامل (النص "مبدع الحائط" والأزرار والألوان القديمة).
   الملف بيعدّل الشكل بس (CSS) وبيحرّك زر مبدع الحائط الأصلي، فكل الدوال القديمة (إعجاب/حذف/تعليقات/إرسال/يوتيوب) شغّالة زي ما هي. */
(function () {
  "use strict";
  if (window.__wallStyleLoaded) return;
  window.__wallStyleLoaded = true;

  var WALL_TITLE = "الحائط للإبداع فقط";
  var CREATORS_TITLE = "مبدعين الجدار";

  /* خلفية تبويب العنوان (الشكل المنحني الغامق في الهيدر) */
  var tabSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 38" preserveAspectRatio="none">' +
    '<defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3d52"/><stop offset="1" stop-color="#16212d"/></linearGradient></defs>' +
    '<path d="M1 38 C16 38 14 3 34 2 L156 2 C176 3 174 38 189 38 Z" fill="url(#t)" stroke="#3b4e63" stroke-width="1.5"/>' +
    "</svg>";
  var tabUrl = 'url("data:image/svg+xml;utf8,' + encodeURIComponent(tabSvg) + '")';

  /* شعار يوتيوب (You / Tube) للمقاطع اللي بتتنشر في الحائط */
  var ytSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 110">' +
    '<text x="70" y="44" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="52" fill="#161616" textLength="112" lengthAdjust="spacingAndGlyphs">You</text>' +
    '<rect x="14" y="52" width="112" height="54" rx="14" fill="#e0261b"/>' +
    '<text x="70" y="93" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="46" fill="#fff" textLength="96" lengthAdjust="spacingAndGlyphs">Tube</text>' +
    "</svg>";
  var ytUrl = 'url("data:image/svg+xml;utf8,' + encodeURIComponent(ytSvg) + '")';

  var DARK = "linear-gradient(180deg,#2b2b2d 0%,#0c0c0d 100%)";
  var P = "body.wl ";

  /* هيدر اللوحة: بيتطبّق فوراً بـ :has (من غير تأخير = من غير رعشة) + نسخة احتياطية بكلاس wl-on للمتصفحات القديمة */
  var hdrRules = [
    "@S@{border:3px solid #000!important;border-radius:0!important;background:#fff!important}",
    "@S@>.pnhead{display:block!important;float:none!important;width:100%!important;height:46px;margin:0!important;padding:0 50px!important;border:0!important;border-radius:0!important;" +
      "background:" + tabUrl + " center bottom/190px 38px no-repeat,#000!important;color:#fff!important;text-align:center;font-size:18px!important;font-weight:700!important;line-height:52px!important;text-shadow:none!important;white-space:nowrap;overflow:hidden}",
    "@S@>.fa-close{position:absolute!important;top:5px;right:6px;z-index:5;width:34px!important;height:34px;margin:0!important;padding:0!important;border:0!important;border-radius:8px!important;background:#e8334a!important;color:#fff!important;font-size:18px!important;line-height:34px!important;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.45)}",
    "@S@>.fa-close:before{font-size:18px!important}",
    "@S@>.pnhead{font-size:0!important}",
    "@S@>.pnhead::after{content:\""+WALL_TITLE+"\";font-size:18px;font-weight:700;color:#fff;line-height:inherit}"
  ];
  var K = 0.82; /* تصغير كل الأحجام عشان الحائط يبان بعيد ومتناسق */
  function build(list) {
    return list.join("\n");
  }

  var css = [
    /* ===== هيدر اللوحة: شريط أسود + تبويب العنوان + زر إغلاق أحمر ===== */

    /* ===== هيكل صفحة الحائط: عمود (زر المبدعين / المنشورات / الكتابة) ===== */
    P + "#wall{background:#fff!important}",
    P + "#wall.active{display:flex!important;flex-direction:column;overflow:hidden}",

    /* ===== زر مبدعين الجدار (زر مبدع الحائط القديم بعد نقله) ===== */
    P + '#wall label.top.wall:not([style*="display: none"]){display:flex!important;align-items:center;justify-content:center;gap:9px;flex:0 0 auto;float:none!important;box-sizing:border-box;' +
      "width:auto!important;min-width:0!important;height:40px!important;min-height:40px!important;margin:4px 18px 10px!important;padding:0 14px!important;" +
      "border:1px solid #d6a621!important;border-radius:14px!important;background:linear-gradient(180deg,#f7d04f 0%,#eab92c 100%)!important;color:#2e2200!important;" +
      "font-size:17px!important;font-weight:700!important;line-height:1!important;cursor:pointer;text-shadow:0 1px 0 rgba(255,255,255,.35);box-shadow:0 2px 5px rgba(120,90,0,.3),inset 0 1px 0 rgba(255,255,255,.45)}",
    P + "#wall label.top.wall:active{transform:scale(.98)}",
    P + "#wall label.top.wall .fa{float:none!important;margin:0!important;font-size:19px!important;color:#2e2200!important;line-height:1!important}",
    P + "#wall label.top.wall span{font-size:17px!important}",

    /* ===== قائمة المنشورات ===== */
    P + "#wall #d2bc{flex:1 1 auto;min-height:0;height:auto!important;border-top:1px solid #111;padding:0 0 8px!important;background:#fff!important;overflow-y:auto!important;overflow-x:hidden}",
    P + "#wall #d2bc::-webkit-scrollbar{width:6px}",
    P + "#wall #d2bc::-webkit-scrollbar-thumb{background:#2b2b2b;border-radius:3px}",
    P + "#wall #d2bc::-webkit-scrollbar-track{background:transparent}",

    /* ===== كارت المنشور ===== */
    P + "#d2bc>.uzr.mm{position:relative;display:grid!important;grid-template-columns:50px minmax(0,1fr);column-gap:10px;row-gap:2px;align-items:start;direction:ltr;box-sizing:border-box;" +
      "width:auto!important;height:auto;margin:14px 14px 0!important;padding:10px 12px 12px!important;border:1px solid #e6e9ef!important;border-radius:16px!important;" +
      "background:linear-gradient(90deg,rgba(216,196,128,0) 0%,#d8c480 22%,#d8c480 78%,rgba(216,196,128,0) 100%) top/100% 3px no-repeat,linear-gradient(135deg,#ffffff 0%,#f9fafc 45%,#edf1f7 100%)!important;" +
      "box-shadow:0 2px 8px rgba(30,40,70,.09)}",
    /* الصورة */
    P + "#d2bc>.uzr.mm>.u-pic{grid-column:1;grid-row:1;width:50px!important;min-width:50px!important;height:50px!important;margin:0!important;border:0!important;border-radius:6px!important;background-color:#ddd;background-size:cover!important;background-position:center!important}",
    /* عمود المحتوى القديم: عناصره تدخل في شبكة الكارت مباشرة */
    P + "#d2bc>.uzr.mm>.uzr.flex-fill{display:contents!important}",
    /* سطر الاسم */
    P + "#d2bc>.uzr.mm .uzr.flex-fill>.d-flex{grid-column:2;grid-row:1;align-self:center;width:100%!important;height:auto!important;min-width:0;padding-right:44px;box-sizing:border-box}",
    P + "#d2bc>.uzr.mm .uzr.flex-fill>.d-flex>.d-flex.flex-grow-1:first-child{flex:1 1 auto;min-width:0;justify-content:center;align-items:center;gap:6px;height:auto!important;overflow:hidden}",
    P + "#d2bc>.uzr.mm .u-ico{flex:0 0 auto;max-height:22px;width:auto}",
    P + "#d2bc>.uzr.mm .u-topic{display:block;flex:1 1 auto;min-width:0;margin:0!important;padding:4px 12px!important;border-radius:11px!important;background-color:#f3f1ee;text-align:center;font-size:15px!important;line-height:1.35!important}",
    /* الوقت (فوق على اليمين) */
    P + "#d2bc>.uzr.mm .uzr.flex-fill>.d-flex>.flex-grow-1.d-flex:last-child{position:static;flex:0 0 0!important;width:0!important;height:0!important;overflow:visible!important}",
    P + "#d2bc>.uzr.mm .tago{position:absolute;top:5px;right:13px;margin:0!important;padding:0!important;color:#8b9099!important;font-size:13px!important;line-height:1.2!important;text-align:right}",
    /* نص المنشور */
    P + "#d2bc>.uzr.mm .u-msg{grid-column:1/-1;grid-row:2;display:block;padding:10px 4px 0!important;text-align:center!important;direction:rtl;font-size:16px!important;line-height:1.7!important;word-break:break-word;overflow-wrap:anywhere}",
    P + "#d2bc>.uzr.mm .u-rply{grid-column:1/-1;grid-row:3}",

    /* ===== مقطع يوتيوب داخل المنشور ===== */
    P + "#d2bc .u-msg>.btn.fa-youtube{display:block;box-sizing:border-box;width:100%;max-width:200px;margin:10px auto 0!important;padding:10px 10px 8px!important;font-size:0!important;line-height:1!important;" +
      "background:#d9d9d9!important;border:2px solid #1d1d1d!important;border-radius:14px!important;box-shadow:none!important;color:transparent!important;cursor:pointer}",
    P + "#d2bc .u-msg>.btn.fa-youtube::before{content:'';display:block;width:118px;height:92px;margin:0 auto 8px;background:" + ytUrl + " center/contain no-repeat}",
    P + "#d2bc .u-msg>.btn.fa-youtube>img{display:block;width:110px!important;max-width:100%;margin:0 auto;border-radius:0;background:#000}",

    /* ===== أزرار المنشور: تعليقات (شمال) / حذف + قلب (يمين) ===== */
    P + "#d2bc>.uzr.mm .u-msg>.d-flex.fr{display:flex!important;flex-direction:row;align-items:center;justify-content:flex-end;gap:10px;float:none!important;width:100%!important;max-width:none!important;height:auto!important;margin:12px 0 0!important;padding:0!important;direction:ltr}",
    P + "#d2bc>.uzr.mm .u-msg>.d-flex.fr>button{display:none!important;margin:0!important}",
    P + '#d2bc>.uzr.mm .u-msg>.d-flex.fr>button:not(.hid):not([style*="display: none"]),' +
      P + '#d2bc>.uzr.mm .u-msg>.d-flex.fr>button[style*="display: inline"],' +
      P + '#d2bc>.uzr.mm .u-msg>.d-flex.fr>button[style*="display: block"]{display:inline-flex!important;align-items:center;justify-content:center;gap:5px;box-sizing:border-box;' +
      "min-width:40px!important;height:38px!important;padding:0 10px!important;border:1px solid rgba(255,255,255,.5)!important;border-radius:11px!important;color:#fff!important;" +
      "font-size:19px!important;font-weight:700!important;line-height:1!important;box-shadow:0 2px 5px rgba(0,0,0,.22)!important;text-shadow:0 1px 1px rgba(0,0,0,.25)}",
    P + "#d2bc>.uzr.mm .u-msg>.d-flex.fr>button::before{font-size:22px!important;line-height:1!important}",
    P + "#d2bc>.uzr.mm .u-msg>.d-flex.fr>button:active{transform:scale(.94)}",
    P + "#d2bc>.uzr.mm .u-msg>.d-flex.fr>.breply{order:1;margin-right:auto!important;background:linear-gradient(180deg,#4a9bf8 0%,#2b78e4 100%)!important}",
    P + "#d2bc>.uzr.mm .u-msg>.d-flex.fr>.bdel{order:2;background:linear-gradient(180deg,#f25555 0%,#dc2f31 100%)!important}",
    P + "#d2bc>.uzr.mm .u-msg>.d-flex.fr>.blike{order:3;background:linear-gradient(180deg,#f46c88 0%,#e84b6b 100%)!important}",
    /* أيقونة التعليقات بدل السهم + العدّاد 0 لو فاضي */
    P + "#d2bc>.uzr.mm .u-msg>.d-flex.fr>.breply::before{content:'\\f086'}",
    P + "#d2bc>.uzr.mm .u-msg>.d-flex.fr>.breply:empty::after,#d2bc>.uzr.mm .u-msg>.d-flex.fr>.blike:empty::after{content:'0'}",

    /* ===== شريط الكتابة ===== */
    P + "#wall .tablebox{position:static!important;bottom:auto!important;flex:0 0 auto;display:flex!important;align-items:center;direction:ltr;gap:6px;box-sizing:border-box;width:100%!important;height:50px;padding:7px 8px!important;border-top:2px solid #111;background:#fff!important}",
    P + "#wall .tablebox>*{float:none!important;margin:0!important;flex:0 0 auto}",
    /* الترتيب من الشمال: يوتيوب / مشاركة / إيموجي / مربع الكتابة / إرسال */
    P + "#wall .tablebox>.ytw-open{order:1}",
    P + "#wall .tablebox>.sndfilebc{order:2}",
    P + "#wall .tablebox>.emobc{order:3}",
    P + "#wall .tablebox>.tboxbc{order:4}",
    P + "#wall .tablebox>.sndbc{order:5}",
    /* الأزرار الغامقة */
    P + "#wall .tablebox>.ytw-open,#wall .tablebox>.sndfilebc,#wall .tablebox>.sndbc{display:flex!important;align-items:center;justify-content:center;gap:6px;height:36px!important;min-width:34px;padding:0 9px!important;" +
      "border:1px solid #3a3a3d!important;border-radius:9px!important;background:" + DARK + "!important;background-image:" + DARK + "!important;color:#d9c25a!important;box-shadow:0 2px 4px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.12)!important;line-height:1!important;cursor:pointer}",
    P + "#wall .tablebox>.ytw-open{width:36px!important;font-size:21px!important;line-height:1!important}",
    P + "#wall .tablebox>.sndfilebc{width:36px;font-size:17px!important}",
    P + "#wall .tablebox>.sndfilebc::before,#wall .tablebox>.sndbc::before{font-size:17px;line-height:1}",
    P + "#wall .tablebox>.sndbc{font-size:15px!important;font-weight:700;color:#f1f1f1!important;white-space:nowrap}",
    P + "#wall .tablebox>.sndbc::before{color:#d9c25a}",
    P + "#wall .tablebox>.ytw-open:active,#wall .tablebox>.sndfilebc:active,#wall .tablebox>.sndbc:active{transform:scale(.95)}",
    /* الإيموجي */
    P + "#wall .tablebox>.emobc{width:34px!important;height:34px;padding:2px!important;object-fit:contain}",
    /* مربع الكتابة */
    P + "#wall .tablebox>.tboxbc{flex:1 1 auto!important;min-width:0;width:auto!important;height:36px!important;min-height:36px!important;max-height:36px!important;padding:7px 8px!important;border:1px solid #111!important;border-radius:7px!important;" +
      "background:#fff!important;color:#222;box-shadow:none;text-align:right!important;direction:rtl;resize:none!important;overflow:hidden!important;line-height:20px!important;font-size:14px!important;white-space:nowrap}",
    P + "#wall .tablebox>.tboxbc::placeholder{color:#555}",

    /* ===== تبويبات [ريشة المبدعين] [الحائط] فوق الحائط ===== */
    P + "#wall .fth-tabs{flex:0 0 auto;display:flex;direction:rtl;gap:10px;height:auto!important;padding:10px 18px 4px!important;border:0!important;background:#fff!important}",
    P + "#wall .fth-tab{flex:1;height:36px!important;line-height:1!important;border-radius:12px!important;border:1px solid #d3d7df!important;background:linear-gradient(180deg,#fff 0%,#eef0f4 100%)!important;color:#3a3f4a!important;font-size:16px!important;font-weight:700!important;box-shadow:0 1px 3px rgba(0,0,0,.12)!important;text-shadow:none!important}",
    P + "#wall .fth-tab.on{border-color:#d6a621!important;background:linear-gradient(180deg,#f7d04f 0%,#eab92c 100%)!important;color:#2e2200!important;box-shadow:0 2px 5px rgba(120,90,0,.3),inset 0 1px 0 rgba(255,255,255,.45)!important}",
    P + "#wall .fth-badge{background:#e8334a;color:#fff}",

    /* هيكل الصفحتين داخل التبويبات */
    P + '#wall-main:not([style*="display: none"]){display:flex!important;flex-direction:column;flex:1 1 auto;min-height:0;height:auto!important}',
    P + '#d2feather[style*="display: block"]{display:flex!important;flex-direction:column;flex:1 1 auto;min-height:0;height:auto!important;background:#fff!important}',

    /* ===== ريشة المبدعين: قائمة المنشورات ===== */
    P + "#d2feather .fth-list{flex:1 1 auto;min-height:0;height:auto!important;border-top:1px solid #111;padding:0 0 8px;background:#fff;overflow-y:auto!important;overflow-x:hidden}",
    P + "#d2feather .fth-list::-webkit-scrollbar{width:6px}",
    P + "#d2feather .fth-list::-webkit-scrollbar-thumb{background:#2b2b2b;border-radius:3px}",
    P + "#d2feather .fth-empty{color:#777}",
    /* الكارت */
    P + "#d2feather .fth-post{position:relative;display:grid!important;grid-template-columns:50px minmax(0,1fr);column-gap:10px;row-gap:2px;align-items:start;direction:ltr;box-sizing:border-box;" +
      "margin:14px 14px 0!important;padding:10px 12px 12px!important;border:1px solid #e6e9ef!important;border-radius:16px!important;" +
      "background:linear-gradient(90deg,rgba(216,196,128,0) 0%,#d8c480 22%,#d8c480 78%,rgba(216,196,128,0) 100%) top/100% 3px no-repeat,linear-gradient(135deg,#ffffff 0%,#f9fafc 45%,#edf1f7 100%)!important;box-shadow:0 2px 8px rgba(30,40,70,.09)}",
    P + "#d2feather .fth-pic{grid-column:1;grid-row:1;width:50px!important;height:50px!important;border:0!important;border-radius:6px!important;background-color:#ddd}",
    P + "#d2feather .fth-body{display:contents!important}",
    P + "#d2feather .fth-head{grid-column:2;grid-row:1;align-self:center;height:auto!important;min-width:0;padding-right:44px;justify-content:center}",
    P + "#d2feather .fth-topic{display:block;flex:1 1 auto;max-width:100%!important;padding:4px 12px!important;border-radius:11px!important;background-color:#f3f1ee;text-align:center;font-size:15px!important}",
    P + "#d2feather .fth-ago{position:absolute;top:5px;right:13px;margin:0!important;color:#8b9099!important;font-size:13px!important}",
    P + "#d2feather .fth-msg{grid-column:1/-1;grid-row:2;padding:10px 4px 0!important;text-align:center;direction:rtl;font-size:16px!important;line-height:1.7!important}",
    P + "#d2feather .fth-acts{grid-column:1/-1;grid-row:3;display:flex;flex-direction:row;align-items:center;justify-content:flex-end;gap:10px;direction:ltr;margin:12px 0 0!important}",
    P + "#d2feather .fth-cms{grid-column:1/-1;grid-row:4;direction:rtl;text-align:right}",
    /* الأزرار: تعليقات (شمال) / حذف / عدم إعجاب / إعجاب (يمين) */
    P + "#d2feather .fth-act{box-sizing:border-box;min-width:40px;height:38px!important;margin:0!important;padding:0 10px!important;gap:5px;justify-content:center;border-radius:11px!important;font-size:19px!important;font-weight:700!important;line-height:1!important;box-shadow:0 2px 5px rgba(0,0,0,.2)!important}",
    P + "#d2feather .fth-cm-btn{order:1;margin-right:auto!important;border:1px solid rgba(255,255,255,.5)!important;background:linear-gradient(180deg,#4a9bf8 0%,#2b78e4 100%)!important;color:#fff!important}",
    P + "#d2feather .fth-cm-btn .fa{font-size:22px!important}",
    P + "#d2feather .fth-cm-btn .fa:before{content:'\\f086'}",
    P + "#d2feather .fth-del{order:2;border:1px solid rgba(255,255,255,.5)!important;background:linear-gradient(180deg,#f25555 0%,#dc2f31 100%)!important;color:#fff!important}",
    P + "#d2feather .fth-del:before{font-size:22px}",
    P + "#d2feather .fth-dis{order:3;border:1px solid #cfd4de!important;background:linear-gradient(180deg,#fff 0%,#eef0f4 100%)!important;color:#444!important}",
    P + "#d2feather .fth-like{order:4;border:1px solid #f0b8c4!important;background:linear-gradient(180deg,#fff 0%,#fdeef1 100%)!important;color:#d6385a!important}",
    P + "#d2feather .fth-act.on.fth-like{background:linear-gradient(180deg,#f46c88 0%,#e84b6b 100%)!important;color:#fff!important;border-color:rgba(255,255,255,.5)!important}",
    P + "#d2feather .fth-act.on.fth-dis{background:linear-gradient(180deg,#8a93a6 0%,#626b7d 100%)!important;color:#fff!important}",
    P + "#d2feather .fth-act img{width:22px;height:24px}",
    P + "#d2feather .fth-act span:empty:after{content:'0'}",

    /* ===== ريشة المبدعين: شريط الكتابة ===== */
    P + "#d2feather .fth-box{position:static!important;flex:0 0 auto;display:flex!important;align-items:center;direction:ltr;gap:6px;box-sizing:border-box;width:100%;height:50px!important;padding:7px 8px!important;border-top:2px solid #111!important;background:#fff!important}",
    P + "#d2feather .fth-box>*{float:none!important;margin:0!important;flex:0 0 auto}",
    P + "#d2feather .fth-box>.fth-plus{order:1}",
    P + "#d2feather .fth-box>.emofth{order:2;width:34px!important;height:34px;padding:2px!important;object-fit:contain}",
    P + "#d2feather .fth-box>.fth-ta{order:3}",
    P + "#d2feather .fth-box>.fth-send{order:4}",
    P + "#d2feather .fth-box>.fth-plus,#d2feather .fth-box>.fth-send{display:flex!important;align-items:center;justify-content:center;gap:6px;height:36px!important;min-width:36px;padding:0 9px!important;" +
      "border:1px solid #3a3a3d!important;border-radius:9px!important;background:" + DARK + "!important;color:#d9c25a!important;box-shadow:0 2px 4px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.12)!important;line-height:1!important}",
    P + "#d2feather .fth-box>.fth-plus{width:36px;font-size:17px!important}",
    P + "#d2feather .fth-box>.fth-send{font-size:15px!important;font-weight:700;color:#f1f1f1!important;white-space:nowrap}",
    P + "#d2feather .fth-box>.fth-send::before{color:#d9c25a;font-size:17px;line-height:1}",
    P + "#d2feather .fth-box>.fth-ta{flex:1 1 auto!important;min-width:0;width:auto!important;height:36px!important;min-height:36px!important;max-height:36px!important;padding:7px 8px!important;border:1px solid #111!important;border-radius:7px!important;background:#fff!important;color:#222;box-shadow:none;text-align:right!important;direction:rtl;resize:none!important;overflow:hidden!important;line-height:20px!important;font-size:14px!important;white-space:nowrap}",
    P + "#d2feather .fth-box>.fth-ta::placeholder{color:#555}"
  ].join("\n");

  var fthSel = '#d2feather[style*="display: block"]';
  var hdrClass = hdrRules.filter(function (l) { return l.indexOf("::after") < 0 && l.indexOf("font-size:0") < 0; })
    .map(function (l) { return l.split("@S@").join("#dpnl.wl-on"); }).join("\n");
  var hdrHas = hdrRules.map(function (l) {
    var sel = "body.wl #dpnl:has(#wall.active)";
    if (l.indexOf("::after") > -1 || l.indexOf("font-size:0") > -1) sel += ":not(:has(" + fthSel + "))";
    return l.split("@S@").join(sel);
  }).join("\n");

  /* تصغير كل قيم px (الأكبر من 3) بنسبة K */
  css = (hdrClass + "\n" + hdrHas + "\n" + css).replace(/(\d*\.?\d+)px/g, function (m, n) {
    n = parseFloat(n);
    return (n <= 3 ? n : Math.round(n * K)) + "px";
  });

  function start() {
    var $ = window.jQuery;
    if (!$ || !$("#wall").length || !$("#dpnl").length) return setTimeout(start, 150);

    var st = document.createElement("style");
    st.id = "wallStyleCss";
    st.textContent = css;
    document.head.appendChild(st);
    document.body.classList.add("wl");

    /* زر مبدع الحائط الأصلي -> مبدعين الجدار (نفس الزر ونفس onclick بس بشكل ونص جديد) */
    var $lb = $("#wall label.top.wall");
    if ($lb.length) {
      $lb.attr("title", CREATORS_TITLE);
      $lb.html('<span class="fa fa-trophy"></span><span>' + CREATORS_TITLE + "</span>");
    }

    /* نسخة احتياطية للهيدر (لو المتصفح مش بيدعم :has): بتتحدّث فوراً مع فتح التبويب */
    var $d = $("#dpnl");
    function sync() {
      $d.toggleClass("wl-on", $("#wall").hasClass("active") && $d.is(":visible"));
    }
    var supportsHas = false;
    try { supportsHas = CSS.supports("selector(:has(*))"); } catch (e) {}
    if (!supportsHas && window.MutationObserver) {
      var mo = new MutationObserver(sync);
      mo.observe(document.getElementById("wall"), { attributes: true, attributeFilter: ["class"] });
      mo.observe($d[0], { attributes: true, attributeFilter: ["style", "class"] });
      sync();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
