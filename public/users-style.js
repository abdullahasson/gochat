/* قايمة المتواجدين بالشكل الجديد (زي الصورة): هيدر أسود + شريط القصص + شريط "المتواجدون في الغرفة" + كروت الأعضاء
   بيتحمّل بس لما الأدمن يفعّل زر "تغيير الشريط العلوي والسفلي" (لوحة التحكم > الإضافات).
   لو اتلغى الزر الملف ده مش بيتحمّل والقايمة ترجع زي ما كانت بالظبط.
   الملف بيعدّل الشكل بس (CSS) وبيزوّد زر أرشيفي، فكل الدوال القديمة (القصص / الخاص / البحث / الترتيب) شغّالة زي ما هي. */
(function () {
  "use strict";
  if (window.__usersStyleLoaded) return;
  window.__usersStyleLoaded = true;

  /* خلفية تبويب العنوان (الشكل المنحني الغامق في الهيدر) */
  var tabSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 38" preserveAspectRatio="none">' +
    '<defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3d52"/><stop offset="1" stop-color="#16212d"/></linearGradient></defs>' +
    '<path d="M1 38 C16 38 14 3 34 2 L156 2 C176 3 174 38 189 38 Z" fill="url(#t)" stroke="#3b4e63" stroke-width="1.5"/>' +
    "</svg>";
  var tabUrl = 'url("data:image/svg+xml;utf8,' + encodeURIComponent(tabSvg) + '")';

  var P = "body.ul #users ";

  /* هيدر اللوحة (شريط أسود + تبويب العنوان + زر إغلاق أحمر) */
  var hdrRules = [
    "@S@{border:3px solid #000!important;border-radius:0!important;background:#fff!important}",
    "@S@>.pnhead{display:block!important;float:none!important;width:100%!important;height:32px;margin:0!important;padding:0 40px!important;border:0!important;border-radius:0!important;" +
      "background:" + tabUrl + " center bottom/128px 26px no-repeat,#000!important;color:#fff!important;text-align:center;font-size:14px!important;font-weight:700!important;line-height:36px!important;text-shadow:none!important;white-space:nowrap;overflow:hidden}",
    "@S@>.fa-close{position:absolute!important;top:3px;right:4px;z-index:5;width:26px!important;height:26px;margin:0!important;padding:0!important;border:0!important;border-radius:6px!important;background:#e8334a!important;color:#fff!important;font-size:14px!important;line-height:26px!important;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.45)}",
    "@S@>.fa-close:before{font-size:14px!important}"
  ];

  var statNames = { s0: "نشط", s1: "بعيد", s2: "مشغول", s3: "غير متاح", s4: "متصل" };
  var statColors = { s0: "#1b8f1b", s1: "#b8860b", s2: "#d12b2b", s3: "#777", s4: "#1a73c8" };

  var css = [
    /* ===== صندوق القايمة ===== */
    P + "{background:#fff!important}",

    /* ===== شريط البحث ===== */
    P + "#usearch{display:block!important;box-sizing:border-box;width:100%!important;height:28px!important;min-height:28px!important;max-height:28px!important;margin:0!important;padding:5px 8px!important;border:0!important;border-bottom:1px solid #d9d9d9!important;border-radius:0!important;background:#fff!important;color:#222;font-size:12px!important;line-height:18px!important;text-align:right!important;direction:rtl;resize:none!important;overflow:hidden!important;box-shadow:none!important}",
    P + "#usearch::placeholder{color:#8a8a8a}",
    /* نص البحث "البحث..." من الشمال زي الصورة */
    P + "#usearch{direction:ltr!important;text-align:left!important}",

    /* ===== شريط القصص ===== */
    P + ".itemstory{display:flex!important;align-items:center;direction:ltr;gap:8px;margin:0!important;padding:6px 8px 4px!important;border:0!important;border-bottom:1px solid #e3e3e3!important;background:#f7f7f7!important;overflow-x:auto;overflow-y:hidden;min-height:84px}",
    P + ".itemstory::-webkit-scrollbar{height:4px}",
    P + ".itemstory::-webkit-scrollbar-thumb{background:#b9b2a0;border-radius:2px}",
    P + ".itemstory::-webkit-scrollbar-track{background:transparent;box-shadow:none}",

    /* زر إضافة قصتي */
    P + ".itemstory>.addstory{flex:0 0 auto;display:block!important;width:54px!important;height:54px;margin:0!important;text-align:center}",
    P + ".itemstory>.addstory .img_str{display:block;box-sizing:border-box;width:54px!important;height:54px!important;padding:2px!important;border:2px solid #d6c68c!important;border-radius:50%!important;background:#f7efd9;object-fit:cover}",
    P + ".itemstory>.addstory>a{position:absolute!important;left:20px;bottom:-3px;top:auto!important;width:18px!important;height:18px!important;margin:0!important;border-radius:50%!important;background:#b8962e!important;box-shadow:0 0 0 2px #f7f7f7}",
    P + ".itemstory>.addstory>a>i{display:block;width:18px;height:18px;color:#fff!important;font-size:0!important;line-height:18px!important;text-align:center}",
    P + ".itemstory>.addstory>a>i::before{content:\"+\";font-family:Arial,sans-serif;font-size:16px;font-weight:700;line-height:18px}",

    /* زر أرشيفي */
    P + ".itemstory>.ul-arch{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;box-sizing:border-box;width:34px;height:34px;border:1px solid #e0d3a0;border-radius:50%;background:#f6efd9;color:#8a6f1f;cursor:pointer;line-height:1.1}",
    P + ".itemstory>.ul-arch:active{transform:scale(.95)}",
    P + ".itemstory>.ul-arch .fa{font-size:14px;color:#8a6f1f}",
    P + ".itemstory>.ul-arch b{font-size:8.5px!important;font-weight:700!important;line-height:1!important;color:#8a6f1f}",

    /* دايرة القصة */
    P + ".itemstory>.str{flex:0 0 auto;position:relative;width:62px!important;margin:0!important;text-align:center;cursor:pointer}",
    P + ".itemstory>.str>img{display:none!important}",
    P + ".itemstory>.str .ul-ring{box-sizing:border-box;width:62px;height:62px;padding:2px;border-radius:50%;background:linear-gradient(45deg,#f9a825 0%,#e1306c 55%,#833ab4 100%)}",
    P + ".itemstory>.str:has(>img[style*=\"gray\"]) .ul-ring{background:#bdbdbd}",
    P + ".itemstory>.str .ul-ring>.ul-img{width:100%;height:100%;border:2px solid #fff;border-radius:50%;background:#ddd center/cover no-repeat;box-sizing:border-box}",
    P + ".itemstory>.str .ul-badge{position:absolute;left:-2px;bottom:10px;width:22px;height:22px;border:1px solid #fff;border-radius:50%;background:#ddd center/cover no-repeat;box-shadow:0 0 0 1px #c9a84c}",
    P + ".itemstory>.str .ul-name{display:block;width:62px!important;margin-top:1px;font:italic 700 10px/1.2 Georgia,'Times New Roman',serif!important;color:#3a3a3a!important;text-overflow:ellipsis;white-space:nowrap;overflow:hidden;direction:ltr}",
    P + ".itemstory>.str .ul-name *{font-size:10px!important}",

    /* ===== الشريط الأسود: المتواجدون في الغرفة ===== */
    P + ".usr::before{content:attr(data-room);display:block;box-sizing:border-box;width:100%;height:30px;padding:6px 8px;background:#000;color:#fff;font-size:13px;font-weight:700;text-align:center;line-height:18px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}",
    /* [FIX-VLIST] القايمة بقت virtual (vlist.js): الصفوف والشريط الفاصل absolute + translateY من أعلى .usr،
       فكانوا بيتحطّوا فوق شريط "المتواجدون في الغرفة" ويغطّوه. بنزيحهم 30px (ارتفاع الشريط) عشان يبدأوا تحته. */
    P + ".usr.vlz>.vlzrow,body.ul #users .usr.vlz>#ninrbar{top:30px!important}",
    /* وكارت العضو كان position:relative (من القاعدة اللي تحت) فبيطلع من الـ absolute وبتتراكم إزاحة translateY مع مكانه
       في الـ flow فالكروت بتتبعثر لتحت. لازم تفضل absolute زي ما vlist.js متوقع. */
    P + ".usr.vlz>.uhtml.vlzrow{position:absolute!important;left:0!important;right:0!important;width:auto!important}",
    P + ".usr>#ninrbar{display:block;box-sizing:border-box;width:100%!important;margin:0!important;padding:6px 8px!important;border:0!important;border-radius:0!important;background:#000!important;color:#fff!important;font-size:13px!important;font-weight:700!important;text-align:center;line-height:1.3!important}",

    /* ===== كارت العضو (زي الصورة المرجعية): صورة ثابتة 46×44 + علامة حالة صغيرة + اسم الحالة تحتها + اسم بشكل "حبة" + رسالة + علم صغير =====
       [FIX-CARDS] القاعدة القديمة كانت بتمط الصورة بطول الكارت (الرسايل الطويلة بتطلّع صورة طويلة جداً) وبتعرض شريط حالة بطول الكارت
       فالكروت مفيهاش تناسق. دلوقتي كل كارت بنفس تصميم الصورة مهما كان طول الرسالة. */
    P + ".uhtml{position:relative;display:block!important;box-sizing:border-box;direction:ltr;width:100%!important;min-height:76px;margin:0!important;padding:3px 6px 4px!important;border:0!important;border-bottom:1px solid #ececf4!important;border-radius:0!important;background-color:#fff;text-align:right!important;overflow:hidden}",
    P + ".uhtml>.di1{position:static;display:flex!important;flex-direction:row;align-items:flex-start;float:none!important;box-sizing:border-box;width:100%!important;min-height:0;margin:0!important;padding:0!important}",

    /* علامة الحالة: مستطيل صغير 5×9 فوق ركن الصورة السفلي-الأيسر */
    P + ".uhtml>.di1>.ustat{position:absolute!important;left:8px;top:38px;z-index:3;width:5px!important;min-width:5px!important;height:9px!important;min-height:0!important;max-height:none!important;margin:0!important;padding:0!important;border:0!important;object-fit:fill}",

    /* الصورة: ثابتة 46×44 */
    P + ".uhtml>.di1>.u-pic{flex:0 0 46px;align-self:flex-start;box-sizing:border-box;width:46px!important;min-width:46px!important;max-width:46px!important;height:44px!important;min-height:44px!important;max-height:44px!important;margin:0!important;padding:0!important;border:0!important;border-radius:2px!important;background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important}",

    /* الإطار (atar): طبقة فوق الصورة بنفس مقاسها بالظبط */
    P + ".uhtml>.di1>.imgbaqer{position:absolute!important;left:6px!important;top:3px!important;box-sizing:border-box;width:46px!important;min-width:46px!important;max-width:46px!important;height:44px!important;min-height:44px!important;max-height:44px!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background-size:100% 100%!important;background-position:center!important;background-repeat:no-repeat!important;pointer-events:none;z-index:2}",

    /* .imgbaqer هو <img> من غير src والإطار بيتحط كـ background — كروم بيرسم له مربع رمادي (placeholder) حوالين الإطار؛ بنستبدل محتواه بصورة شفافة */
    P + ".uhtml>.di1>.imgbaqer{content:url(data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==)}",
    /* [FIX-ROUNDFR] لما العضو عنده إطار متحرك: الصورة دايرة جوه الإطار (الإطار حلقة)، ولو مفيش إطار تفضل مربعة.
       الصورة 34px والإطار 48px ومركزهم واحد (نفس نسبة الإطارات: الفتحة حوالي 70%). */
    P + ".uhtml:has(>.di1>.imgbaqer[style*=\"url(\"])>.di1>.u-pic{flex:0 0 34px!important;width:34px!important;min-width:34px!important;max-width:34px!important;height:34px!important;min-height:34px!important;max-height:34px!important;margin:5px 6px 0 6px!important;border-radius:50%!important}",
    P + ".uhtml:has(>.di1>.imgbaqer[style*=\"url(\"])>.di1>.imgbaqer{left:5px!important;top:1px!important;width:48px!important;min-width:48px!important;max-width:48px!important;height:48px!important;min-height:48px!important;max-height:48px!important;padding:0!important}",
    P + ".uhtml:has(>.di1>.imgbaqer[style*=\"url(\"])>.di1>.ustat{left:11px!important;top:36px!important}",

    /* اسم الحالة (نشط / مشغول ...) تحت الصورة — بيتحط من JS (stampStatus) */
    P + ".uhtml>.ul-stt{position:absolute;left:6px;top:49px;z-index:2;width:46px;text-align:right;direction:rtl;font-size:13px!important;font-weight:700;line-height:18px;white-space:nowrap;pointer-events:none}",

    /* العلم أعلى اليمين (من غير رقم) */
    P + ".uhtml>.di3{position:absolute!important;top:5px;right:6px;z-index:3;display:block!important;float:none!important;width:auto!important;margin:0!important;padding:0!important;text-align:center}",
    P + ".uhtml>.di3 .co{display:block;width:16px!important;height:11px!important;margin:0!important;object-fit:cover}",
    P + ".uhtml>.di3 .uhash{display:none!important}",

    /* الاسم + الأيقونة (يسار) والرسالة (يمين) */
    P + ".uhtml .di2{display:block!important;flex:1 1 0;box-sizing:border-box;width:auto!important;min-width:0;direction:rtl;margin:0!important;padding:0 26px 0 8px!important;overflow:hidden!important}",
    P + ".uhtml .di2>.d-flex{display:flex!important;align-items:center;justify-content:flex-start;direction:ltr;width:100%!important;min-height:24px;height:auto!important;margin:0!important;padding:0!important}",
    P + ".uhtml .di2>.d-flex>.flex-grow-1{flex:0 1 auto;min-width:0;max-width:100%;text-align:left}",
    P + ".uhtml .di2 .u-ico{flex:0 0 auto;display:block;width:auto!important;max-width:60px;height:auto;max-height:24px;min-height:0!important;margin:0 4px 0 0!important}",
    P + ".uhtml .di2 .u-ico:not([src]){display:none}",
    P + ".uhtml .di2 .muted{display:none!important}",
    P + ".uhtml .di2 .u-topic{display:inline-block!important;box-sizing:border-box;max-width:100%;padding:2px 12px!important;border-radius:12px!important;font-size:16px!important;font-weight:700;line-height:1.4;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:middle}",
    P + ".uhtml .di2 .u-msg{display:block;max-height:none!important;margin:3px 0 0!important;padding:0!important;font-size:14px!important;line-height:1.6!important;color:#555;text-align:right!important;direction:rtl;word-break:break-word;overflow:visible}",
    P + ".uhtml .di2 .u-msg img{max-width:100%}",

    /* كارت الغلاف (العضو عنده خلفية/غلاف بصورة): مستدير بإطار رفيع زي الصورة */
    P + ".usr.vlz>.uhtml.vlzrow[style*=\"url(\"]{left:3px!important;right:3px!important;min-height:62px;border:1px solid rgba(0,0,0,.6)!important;border-radius:9px!important}",

    /* الصف المحدد / المنقول فوق */
    P + ".uhtml.ul-me{background-color:#ecebfb}"
  ];


  /* ===== تبويب الخاص (#chats): نفس كارت العضو + زر حذف ===== */
  css.push(
    "body.ul #chats{background:#fff!important;border:0!important}",
    "body.ul #chats>.cc{position:relative;box-sizing:border-box;width:100%!important;margin:0!important;padding:0!important;border:0!important}",
    "body.ul #chats>.cc>.label-danger{position:absolute;right:6px;bottom:5px;z-index:3;margin:0!important;padding:2px 8px!important;border:0!important;border-radius:9px!important;background:#e8334a!important;color:#fff!important;font-size:10px!important;line-height:1.4}",
    "body.ul #chats>.cc>.label-danger::before{margin-left:3px}",
    "body.ul #chats .uhtml{padding-bottom:20px!important}",
    "body.ul #chats .unread .uhtml,body.ul #chats .unread.uhtml{background-color:#fff6df}"
  );

  /* ===== لوحة الإشعارات ===== */
  css.push(
    "body.ul #wetchprofilenotifi{background:#fff!important}",
    "body.ul #wetchprofilenotifi .nt-head{padding:6px!important;gap:6px;border-bottom:1px solid #d9cfae!important;background:linear-gradient(180deg,#f7efd9 0%,#f0e5c6 100%)!important}",
    "body.ul #wetchprofilenotifi .nt-head button{height:28px!important;border:1px solid #3b4856!important;border-radius:7px!important;background:linear-gradient(180deg,#27323f 0%,#141c25 100%)!important;color:#d9c25a!important;font-size:12px!important;box-shadow:0 2px 4px rgba(0,0,0,.35)!important}",
    "body.ul #wetchprofilenotifi .nt-clear{color:#f06a6a!important}",
    "body.ul #wetchprofilenotifi .nt-list{padding:0 0 8px!important;background:#fff}",
    "body.ul #wetchprofilenotifi .nt-list .notification{margin:0!important;padding:14px 10px 8px!important;border:0!important;border-bottom:1px solid #ececec!important;border-radius:0!important;background:#fff!important;box-shadow:none!important}",
    "body.ul #wetchprofilenotifi .nt-list .notification__title{margin:-18px auto 4px!important;padding:0 14px!important;border:0!important;border-radius:11px!important;background:#000!important;color:#fff!important;font-size:11px!important;line-height:20px!important}",
    "body.ul #wetchprofilenotifi .nt-list .notification__sender{display:flex;align-items:center;gap:6px;direction:rtl}",
    "body.ul #wetchprofilenotifi .nt-list .notification__sender__avatar{width:30px!important;height:30px!important;margin:0!important;border-radius:3px!important;object-fit:cover}",
    "body.ul #wetchprofilenotifi .nt-list .notification__sender__name .u-topic{display:inline-block;padding:1px 12px;border-radius:11px;font-size:12px!important;font-weight:700}",
    "body.ul #wetchprofilenotifi .nt-list .notification__message{margin-top:4px;font-size:12px!important;text-align:right}",
    "body.ul #wetchprofilenotifi .nt-list .notification__time{font-size:10px!important;color:#777}",
    "body.ul #wetchprofilenotifi .nt-list:empty::before{padding:24px 10px;font-size:13px}"
  );

  /* ===== نافذة الخاص (المحادثة): هيدر أسود + إطار أسود ===== */
  css.push(
    "body.ul .c-flex:has(>.head.d-flex.nosel){border:2px solid #000!important;border-radius:0!important;background:#fff!important}",
    "body.ul .head.d-flex.nosel{background:#000!important;border-bottom:0!important;height:38px!important}",
    "body.ul .head.d-flex.nosel .u-topic{border-radius:11px!important;font-size:12px!important;font-weight:700}",
    "body.ul .head.d-flex.nosel>.fa-minus,body.ul .head.d-flex.nosel>.phide{background:#e8334a!important;border-color:#e8334a!important;color:#fff!important}"
  );


  /* ===== نافذة الغرف (#rooms) ===== */
  css.push(
    "body.ul #rooms{background:#fff!important;border:0!important}",
    "body.ul #rooms>div.label-primary{display:flex!important;align-items:center;gap:6px;box-sizing:border-box;padding:6px!important;border:0!important;border-bottom:1px solid #d9cfae!important;background:linear-gradient(180deg,#f7efd9 0%,#f0e5c6 100%)!important}",
    "body.ul #rooms #roomSearchInput{height:28px!important;min-height:28px!important;max-height:28px!important;padding:5px 8px!important;border:1px solid #d6c690!important;border-radius:7px!important;background:#fff!important;color:#222;font-size:12px!important;line-height:18px!important;text-align:right!important;direction:rtl;resize:none!important;overflow:hidden!important;box-shadow:none!important}",
    "body.ul #rooms>div.label-primary>.btn{flex:0 0 auto;height:28px;margin:0!important;padding:0 10px!important;border:1px solid #3b4856!important;border-radius:7px!important;background:linear-gradient(180deg,#27323f 0%,#141c25 100%)!important;color:#d9c25a!important;font-size:12px!important;line-height:26px!important;box-shadow:0 2px 4px rgba(0,0,0,.35)!important}",
    "body.ul #rooms .room{position:relative;box-sizing:border-box;padding:4px 6px!important;border-bottom:1px solid #ececec!important;background-color:#fff}",
    "body.ul #rooms .room>div:first-child.u-pic,body.ul #rooms .room .u-pic{flex:0 0 56px;width:56px!important;min-width:56px!important;height:56px;min-height:56px!important;max-height:56px!important;border-radius:3px!important;background-size:cover!important}",
    "body.ul #rooms .room .u-pic .st{height:14px!important;font-size:9px!important;line-height:14px}",
    "body.ul #rooms .room .u-pic .roomhas{height:14px!important;font-size:9px!important;line-height:14px;padding:0 3px!important}",
    "body.ul #rooms .room>.c-flex{flex:1 1 0;min-width:0;padding:0 6px}",
    "body.ul #rooms .room .u-topic{display:block;padding:1px 4px!important;font-size:13px!important;font-weight:700;text-align:center;direction:rtl;background:transparent!important}",
    "body.ul #rooms .room .uc{position:absolute;top:4px;right:6px;width:auto!important;height:auto!important;min-width:0;margin:0!important;padding:1px 8px!important;border-radius:9px!important;font-size:10px!important;line-height:1.5}",
    "body.ul #rooms .room .u-msg{margin-top:1px;font-size:12px!important;line-height:1.5;text-align:right!important;word-break:break-word}"
  );

  /* ===== صفحة الاستكشاف / الاضافات والميزات (#othpage) ===== */
  var O = "body.ul #othpage ";
  css.push(
    O + "{background:#fff!important}",
    O + ".og{padding:0 0 10px!important}",
    O + ".og-head{margin:0!important;padding:6px 8px!important;background:linear-gradient(180deg,#f7efd9 0%,#f0e5c6 100%)!important;border-bottom:1px solid #d9cfae}",
    O + ".og-head b{color:#3a3a3a!important;font-size:14px!important}",
    O + ".og-back{height:28px!important;padding:0 10px!important;border:1px solid #3b4856!important;border-radius:7px!important;background:linear-gradient(180deg,#27323f 0%,#141c25 100%)!important;color:#d9c25a!important;font-size:12px!important;box-shadow:0 2px 4px rgba(0,0,0,.35)!important}",
    O + ".og-back .fa{color:#d9c25a!important;font-size:12px!important}",
    O + ".og-it{height:54px!important;margin:0!important;padding:0 10px!important;gap:8px!important;border:0!important;border-bottom:1px solid #ececec!important;border-radius:0!important;background:#fff!important;color:#222!important;box-shadow:none!important}",
    O + ".og-no{flex:0 0 24px!important;width:24px!important;height:24px!important;border:0!important;border-radius:50%!important;background:#000!important;color:#fff!important;font-size:12px!important}",
    O + ".og-ic{flex:0 0 36px!important;width:36px!important;height:36px!important;border-radius:9px!important;font-size:18px!important}",
    O + ".og-it.m1 .og-ic{width:36px!important;height:36px!important;flex-basis:36px!important}",
    O + ".og-tt{font-size:14px!important;color:#222}",
    O + ".og-sb{margin-top:1px!important;font-size:10px!important;opacity:1!important;color:#666}",
    O + ".og-bg{padding:1px 7px!important;font-size:10px!important}",
    O + ".og-ch{color:#999;font-size:18px!important}",
    O + ".og-dots{display:none!important}",
    O + ".og-sec{margin:0!important;padding:6px 10px;background:#000;color:#fff!important;font-size:13px!important;font-weight:700}",
    O + ".og-sec .og-no{background:#fff!important;color:#000!important;font-size:12px!important;flex:0 0 24px!important;width:24px!important;height:24px!important}",
    O + ".og-sw{width:46px!important;height:24px!important;border-radius:12px!important}",
    O + ".og-sw:after{top:3px!important;left:3px!important;width:18px!important;height:18px!important}",
    O + ".og-sw.on:after{transform:translateX(22px)!important}"
  );


  /* ===== نافذة البروفايل (#upro) ===== */
  var U = "body.ul #upro ";
  css.push(
    U + ".modal-content{border:3px solid #000!important;border-radius:0!important;background:#fff!important;box-shadow:0 4px 18px rgba(0,0,0,.45)!important}",
    U + ".pc-head{min-height:34px!important;padding:4px 8px!important;border:0!important;border-radius:0!important;background:#000!important}",
    U + ".pc-head .pc-feather{width:18px!important;height:18px!important}",
    U + ".pc-head .pc-mini{width:22px!important;height:22px!important;border-radius:3px!important}",
    U + ".pc-head .pc-title{font-size:14px!important}",
    U + ".pc-head .pc-x{width:26px!important;height:26px!important;border-radius:6px!important;background:#e8334a!important;font-size:14px!important;box-shadow:0 1px 4px rgba(0,0,0,.45)}",
    U + ".pro{border:0!important}",
    U + ".pro .u-msg{font-size:13px!important}",
    /* الأزرار: نفس شكل أزرار الشريط (غامق + ذهبي) */
    U + ".pro .btn.borderg{box-sizing:border-box;display:inline-flex!important;align-items:center;justify-content:center;gap:4px;width:calc(33.33% - 6px)!important;height:30px;margin:3px!important;padding:0 4px!important;border:1px solid #3b4856!important;border-radius:7px!important;background:linear-gradient(180deg,#27323f 0%,#141c25 100%)!important;font-size:12px!important;line-height:1!important;box-shadow:0 2px 4px rgba(0,0,0,.35)!important;white-space:nowrap}",
    U + ".pro .btn.borderg:active{transform:scale(.96)}",
    U + ".pro a.btn.borderg{width:calc(25% - 6px)!important}",
    U + ".pro .btn.uxo .xo-pi{width:20px;height:20px}",
    U + ".pro .btn.uxo .xo-pt{font-size:12px}",
    /* صناديق الأدمن (الزخرفة / الايكات / النقاط / المجموعة / الغرفة) */
    U + ".pro .border.fl{box-sizing:border-box;border:1px solid #e1e1e1!important;border-radius:8px!important;margin:4px 3px!important;width:calc(100% - 6px)!important}",
    U + ".pro .label-primary,body.ul #upro .pro .btn-primary{border:1px solid #3b4856!important;border-radius:7px!important;background:linear-gradient(180deg,#27323f 0%,#141c25 100%)!important;color:#d9c25a!important}",
    U + ".pro .btn.fr.border{height:28px;padding:0 10px!important;border-radius:7px!important;background:linear-gradient(180deg,#27323f 0%,#141c25 100%)!important;color:#d9c25a!important;font-size:12px!important}"
  );

  /* نفس قواعد كارت العضو لتبويب الخاص */
  css = css.concat(css.filter(function (l) { return l.indexOf("body.ul #users .uhtml") === 0; })
    .map(function (l) { return l.split("body.ul #users ").join("body.ul #chats "); }));

  var tabs = ["#users", "#chats", "#wetchprofilenotifi", "#rooms", "#othpage", "#wtrend"];
  function expand(rule, mk) {
    var i = rule.indexOf("{");
    var sfx = rule.slice(0, i).split("@S@").join("");
    return tabs.map(function (t) { return mk(t) + sfx; }).join(",") + rule.slice(i);
  }
  var hdrClass = hdrRules.map(function (l) { return l.split("@S@").join("#dpnl.ul-on"); }).join("\n");
  var hdrHas = hdrRules.map(function (l) { return expand(l, function (t) { return "body.ul #dpnl:has(" + t + ".active)"; }); }).join("\n");
  var cssText = hdrClass + "\n" + hdrHas + "\n" + css.join("\n");

  /* ===== تجهيز دوائر القصص: صورة القصة + صورة صاحبها + الاسم ===== */
  function decorateStory(el, $) {
    if (el.__ulDone) return;
    var m = /stid(\d+)/.exec(el.className);
    var id = m ? m[1] : null;
    var data = null;
    try {
      (window.storys || []).forEach(function (s) { if (String(s.id) === id) data = s; });
    } catch (e) {}
    var $el = $(el);
    var userPic = $el.find("img").attr("src") || (data && data.pic) || "";
    var main = userPic;
    if (data && data.type !== "video" && data.url) main = data.url;
    var name = (data && data.topic) || $el.children("div").first().html() || "";
    el.__ulDone = 1;
    var ring = $('<div class="ul-ring"><div class="ul-img"></div></div>');
    ring.find(".ul-img").css("background-image", main ? 'url("' + main + '")' : "none");
    var badge = $('<span class="ul-badge"></span>').css("background-image", userPic ? 'url("' + userPic + '")' : "none");
    var nm = $('<span class="ul-name"></span>').html(name);
    $el.children("div").remove();
    $el.append(ring, badge, nm);
  }

  function toast(msg) {
    var t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:100000;padding:9px 16px;border-radius:18px;background:rgba(0,0,0,.82);color:#fff;font-size:14px;direction:rtl";
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2200);
  }

  /* زر أرشيفي: بيفتح قصصي (القصص الحالية) من نفس عارض القصص الأصلي */
  function openMyStories() {
    try {
      var me = window.getuser && window.getuser(window.M_ID);
      var list = window.storys || [];
      for (var i = 0; i < list.length; i++) {
        if (me && list[i].owner == me.lid) return window.ShowStory(list[i], i);
      }
    } catch (e) {}
    toast("مفيش قصص في أرشيفك حالياً");
  }

  function ensureArchive($, $box) {
    if ($box.children(".ul-arch").length) return;
    var $a = $('<div class="ul-arch" title="أرشيفي"><span class="fa fa-history"></span><b>أرشيفي</b></div>');
    $a.on("click", openMyStories);
    var $add = $box.children(".addstory").first();
    if ($add.length) $a.insertAfter($add);
    else $box.prepend($a);
  }

  /* اسم الغرفة في الشريط الأسود */
  function roomTitle() {
    var t = "";
    try {
      var r = window.R_CASH && window.R_CASH[window.M_ROOM];
      if (r && r.topic) t = window.jQuery("<div>").html(r.topic).text();
    } catch (e) {}
    return t ? "المتواجدون في " + t : "المتواجدون في الغرفة";
  }
  function setRoomTitle() {
    var u = document.querySelector("#users .usr");
    if (u) u.setAttribute("data-room", roomTitle());
  }

  /* الكود الأصلي (الغلاف/الإطار) بيكتب مقاسات inline بـ !important على الصورة والإطار وشريط الحالة؛
     بنشيلها بعد كل updateu عشان الكارت يفضل بنفس الشكل مع أو من غير غلاف/إطار */
  var STRIP = ["width", "height", "min-width", "min-height", "max-width", "max-height", "margin", "margin-top", "margin-left", "margin-right", "margin-bottom", "padding", "border", "border-radius", "background-size", "background-repeat"];
  /* اسم الحالة تحت الصورة (نشط / بعيد / مشغول ...) من رقم الحالة اللي في صورة .ustat */
  function stampStatus(row) {
    var img = row.querySelector(".ustat");
    var m = img && /imgs\/s(\d)/.exec(img.getAttribute("src") || "");
    if (!m) return;
    var k = "s" + m[1];
    var el = null;
    for (var c = row.firstElementChild; c; c = c.nextElementSibling) if (c.className === "ul-stt") { el = c; break; }
    if (!el) { el = document.createElement("span"); el.className = "ul-stt"; row.appendChild(el); }
    if (el.__k !== k) { el.__k = k; el.textContent = statNames[k] || ""; el.style.color = statColors[k] || "#777"; }
  }
  function cleanRow(row) {
    if (!row) return;
    try { stampStatus(row); } catch (e) {}
    var els = row.querySelectorAll(".u-pic,.imgbaqer,.ustat,.u-msg");
    for (var i = 0; i < els.length; i++) {
      var st = els[i].style;
      if (!st || !st.length) continue;
      for (var k = 0; k < STRIP.length; k++) st.removeProperty(STRIP[k]);
    }
  }
  function wrapUpdateu() {
    var orig = window.updateu;
    if (typeof orig !== "function" || orig.__ulWrapped) return;
    var w = function (id) {
      var r = orig.apply(this, arguments);
      try {
        var j = window.VLIST && window.VLIST.rowOf && window.VLIST.rowOf(id);
        cleanRow(j && j[0]);
      } catch (e) {}
      return r;
    };
    w.__ulWrapped = true;
    window.updateu = w;
  }

  function start() {
    var $ = window.jQuery;
    if (!$ || !$("#users .usr").length || !$("#dpnl").length || typeof window.roomChanged !== "function") return setTimeout(start, 150);

    var st = document.createElement("style");
    st.id = "usersStyleCss";
    st.textContent = cssText;
    document.head.appendChild(st);
    document.body.classList.add("ul");
    /* مربع البحث فوق شريط القصص (زي الصورة) */
    try {
      var us = document.getElementById("usearch"), is0 = document.querySelector("#users .itemstory");
      if (us) us.setAttribute("placeholder", "البحث...");
      if (us && is0 && is0.parentNode === us.parentNode && (us.compareDocumentPosition(is0) & 2)) is0.parentNode.insertBefore(us, is0);
    } catch (e) {}
    wrapUpdateu();

    /* اسم الغرفة: wrap على roomChanged (من غير تعديل الكود الأصلي) */
    var orig = window.roomChanged;
    window.roomChanged = function () {
      var r = orig.apply(this, arguments);
      setRoomTitle();
      return r;
    };
    setRoomTitle();
    /* [FIX-PERF] كانت setInterval كل 3 ثوانٍ تعيد قراءة DOM للأبد.
       الآن: نحدّث العنوان عند تحديث بيانات الغرفة (r^) أو دخول/خروج مستخدم فقط */
    var origUpd = window.updater;
    if (typeof origUpd === "function") {
      window.updater = function () {
        var r = origUpd.apply(this, arguments);
        setRoomTitle();
        return r;
      };
    }
    var origAddUser = window.AddUser;
    if (typeof origAddUser === "function") {
      window.AddUser = function () {
        var r = origAddUser.apply(this, arguments);
        setRoomTitle();
        return r;
      };
    }

    /* القصص: كل ما الكود الأصلي يعيد بناء الشريط نجهّز الدوائر ونرجّع زر أرشيفي */
    var box = $(".itemstory")[0];
    if (box) {
      var run = function () {
        ensureArchive($, $(box));
        $(box).children(".str").each(function () { decorateStory(this, $); });
      };
      run();
      if (window.MutationObserver) new MutationObserver(run).observe(box, { childList: true });
    }

    /* نسخة احتياطية للهيدر (لو المتصفح مش بيدعم :has) */
    var $d = $("#dpnl");
    function sync() {
      $d.toggleClass("ul-on", $("#users,#chats,#wetchprofilenotifi,#rooms,#othpage,#wtrend").filter(".active").length > 0 && $d.is(":visible"));
    }
    var supportsHas = false;
    try { supportsHas = CSS.supports("selector(:has(*))"); } catch (e) {}
    if (!supportsHas && window.MutationObserver) {
      var mo = new MutationObserver(sync);
      $("#users,#chats,#wetchprofilenotifi,#rooms,#othpage,#wtrend").each(function () { mo.observe(this, { attributes: true, attributeFilter: ["class"] }); });
      mo.observe($d[0], { attributes: true, attributeFilter: ["style", "class"] });
      sync();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
