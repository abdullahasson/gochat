/* ==========================================================
   نافذة "صمم عضويتك" — خفيفة وسريعة مع معاينة مباشرة
   - لا تعتمد على jQuery slideToggle ولا أي مكتبة إضافية
   - المعاينة محلية (فورية) ولا يتم الإرسال للسيرفر إلا عند "تطبيق"
   - [FIX-S25] تحميل كسول كامل لكل تبويب على حدة:
       * النافذة نفسها لا تُبنى إلا عند أول فتح
       * كل تبويب (خلفيات/إطارات/زخرفة/زيارة/إظهار) يبني محتواه عند فتحه فقط
       * الخطوط لا تُحمَّل كلها عند فتح تبويب الخطوط — كل خط يُحمَّل عند
         ظهور بطاقته في الرؤية فقط (IntersectionObserver) + الخط المختار فوراً
       * شبكات الخطوط والتأثيرات تُبنى مرة واحدة وتُعاد استخدامها
       * paint() بيمس DOM الظاهر بس (شبكة التبويب النشط) بدل مسح كل الشبكات
         — ده كان بيحصل مع كل حركة سحب في منتقي الألوان (عشرات المرات/ثانية)
       * كل عمليات الرسم بتتجمع في إطار واحد (requestAnimationFrame)
       * والنافذة مقفولة = صفر عمل تماماً (الرسم المجدول يتوقف)
   الاستخدام: openDesign()  /  closeDesign()
   ========================================================== */
  /* زر "صمّم عضويتك بنفسك" في إعدادات المستخدم */
  (function () {
    var b = document.createElement("style");
    b.textContent = [
      ".dsg-open{position:relative;display:flex!important;align-items:center;justify-content:center;gap:10px;float:none!important;width:98%!important;height:46px!important;margin:6px 4px!important;padding:0 16px!important;border:0!important;border-radius:14px!important;background:linear-gradient(135deg,#6a5cff 0%,#9a4cff 55%,#d14cff 100%)!important;color:#fff!important;font-size:15px!important;font-weight:800!important;letter-spacing:.2px;text-shadow:0 1px 2px rgba(0,0,0,.25);box-shadow:0 6px 16px rgba(106,92,255,.38),inset 0 1px 0 rgba(255,255,255,.35)!important;overflow:hidden;cursor:pointer;transition:transform .12s,box-shadow .15s;-webkit-tap-highlight-color:transparent}",
      ".dsg-open:before{content:'🎨'!important;font-family:inherit!important;font-size:20px!important;margin:0!important;line-height:1}",
      ".dsg-open:after{content:'';position:absolute;top:0;left:0;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.38),transparent);transform:skewX(-20deg) translateX(-150%);animation:dsgShine 3.8s ease-in-out infinite;pointer-events:none;will-change:transform}",
      ".dsg-open:hover{box-shadow:0 8px 20px rgba(106,92,255,.5),inset 0 1px 0 rgba(255,255,255,.4)!important}",
      ".dsg-open:active{transform:scale(.97)}",
      ".dsg-open .dsg-open-t{flex:0 1 auto}",
      ".dsg-open .dsg-open-a{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,.22);font-size:18px;line-height:1}",
      /* [FIX-S22] كانت الحركة على left (Layout) = تكلفة مين-ثريد كل فريم —
         نفس اللمعة بالحرف على transform (كومبوزيتور GPU) */
      "@keyframes dsgShine{0%,55%{transform:skewX(-20deg) translateX(-150%)}100%{transform:skewX(-20deg) translateX(325%)}}"
    ].join("\n");
    document.head.appendChild(b);
  })();

(function () {
  "use strict";

  var CSS = [
    "#dsg{position:fixed;inset:0;z-index:99990;display:none;direction:rtl;font-family:system-ui,'Segoe UI',Tahoma,Arial,sans-serif!important}",
    "#dsg.on{display:block}",
    "#dsg *{box-sizing:border-box;font-family:inherit!important;font-size:13px!important;line-height:1.4!important;font-weight:600!important;text-shadow:none!important;margin:0;padding:0}",
    "#dsg .ov{position:absolute;inset:0;background:rgba(15,18,28,.55);opacity:0;transition:opacity .18s}",
    "#dsg.on .ov{opacity:1}",
    "#dsg .box{position:absolute;left:50%;bottom:0;width:100%;max-width:440px;max-height:92%;display:flex;flex-direction:column;background:#fff;color:#1c2333;border-radius:18px 18px 0 0;box-shadow:0 -8px 40px rgba(0,0,0,.28);transform:translate(-50%,24px);opacity:0;transition:transform .2s cubic-bezier(.2,.8,.2,1),opacity .18s;overflow:hidden}",
    "#dsg.on .box{transform:translate(-50%,0);opacity:1}",
    "@media(min-width:520px){#dsg .box{bottom:auto;top:50%;border-radius:18px;transform:translate(-50%,-46%)}#dsg.on .box{transform:translate(-50%,-50%)}}",
    "#dsg .hd{display:flex;align-items:center;gap:8px;padding:12px 14px;background:linear-gradient(135deg,#6a5cff,#b04cff);color:#fff}",
    "#dsg .hd b{flex:1;font-size:15px!important;font-weight:800!important}",
    "#dsg .x{width:30px;height:30px;border:0;border-radius:50%;background:rgba(255,255,255,.2);color:#fff;cursor:pointer;font-size:18px!important;line-height:30px!important;text-align:center}",
    "#dsg .x:active{background:rgba(255,255,255,.35)}",
    /* المعاينة */
    "#dsg .pvw{padding:12px 14px 10px;background:#f3f4f9;border-bottom:1px solid #e6e8f0}",
    "#dsg .pvl{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;color:#7a8094;font-size:12px!important}",
    "#dsg .pvl i{font-style:normal;color:#6a5cff;display:none}",
    "#dsg.dirty .pvl i{display:inline}",
    "#dsg .row{position:relative;display:flex;align-items:center;gap:10px;height:84px;padding:0 12px;border-radius:12px;background:#fff 0 0/100% 100%;border:1px solid #e1e4ee;overflow:hidden;transition:background-image .15s}",
    "#dsg .av{position:relative;flex:0 0 62px;width:62px;height:62px}",
    "#dsg .pic{position:absolute;inset:0;border-radius:50%;background:#ccd 50% 50%/cover;border:2px solid #fff}",
    "#dsg .fr{position:absolute;left:50%;top:50%;width:84px;height:84px;margin:-42px 0 0 -42px;background:50% 50%/100% 100% no-repeat;pointer-events:none}",
    "#dsg .tx{flex:1;min-width:0}",
    "#dsg .nm{display:inline-block;max-width:100%;padding:1px 8px;border-radius:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:800!important}",
    "#dsg .ms{margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.85}",
    /* التبويبات */
    "#dsg .tabs{display:flex;flex:0 0 auto;gap:6px;padding:10px 14px 6px;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:none}",
    "#dsg .tabs::-webkit-scrollbar{display:none}",
    "#dsg .tab{flex:1 0 auto;white-space:nowrap;padding:8px 10px;border:0;border-radius:10px;background:#eef0f7;color:#4a5068;cursor:pointer;text-align:center}",
    "#dsg .tab.on{background:#6a5cff;color:#fff}",
    "#dsg .tab small{opacity:.75;font-size:11px!important}",
    /* الشبكة */
    "#dsg .bd{flex:1;min-height:150px;overflow-y:auto;overscroll-behavior:contain;padding:8px 14px 12px;-webkit-overflow-scrolling:touch}",
    "#dsg .grid{display:none;grid-gap:8px}",
    "#dsg .grid.on{display:grid}",
    "#dsg .grid.b{grid-template-columns:repeat(3,1fr)}",
    "#dsg .grid.a{grid-template-columns:repeat(4,1fr)}",
    "#dsg .it{position:relative;border:2px solid transparent;border-radius:10px;background:#f3f4f9;cursor:pointer;overflow:hidden;padding:0;outline:0;-webkit-tap-highlight-color:transparent;transition:transform .1s,border-color .12s}",
    "#dsg .it:active{transform:scale(.95)}",
    "#dsg .grid.b .it{height:54px}",
    "#dsg .grid.a .it{height:68px}",
    "#dsg .it img{display:block;width:100%;height:100%;object-fit:cover;background:#e9ebf3}",
    "#dsg .grid.a .it img{object-fit:contain;padding:3px}",
    "#dsg .it.on{border-color:#6a5cff;box-shadow:0 0 0 2px rgba(106,92,255,.25)}",
    "#dsg .it.on:after{content:'\\2713';position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#6a5cff;color:#fff;text-align:center;line-height:18px!important;font-size:12px!important}",
    "#dsg .it.no{display:flex;align-items:center;justify-content:center;color:#8a90a5;background:repeating-linear-gradient(45deg,#f3f4f9,#f3f4f9 6px,#e9ebf3 6px,#e9ebf3 12px)}",
    "#dsg .empty{grid-column:1/-1;text-align:center;color:#8a90a5;padding:26px 0}",
    /* الأزرار */
    "#dsg .ft{display:flex;gap:8px;padding:10px 14px 14px;border-top:1px solid #e6e8f0;background:#fff}",
    "#dsg .bt{flex:1;height:42px;border:0;border-radius:12px;cursor:pointer;font-weight:800!important}",
    "#dsg .bt.p{flex:2;background:linear-gradient(135deg,#6a5cff,#b04cff);color:#fff}",
    "#dsg .bt.p[disabled]{opacity:.45;cursor:default}",
    "#dsg .bt.s{background:#eef0f7;color:#4a5068}",
    "#dsg .bt:active:not([disabled]){transform:scale(.97)}",
    /* تبويب زخرفة الاسم */
    "#dsg .fnt{display:none}",
    "#dsg .fnt.on{display:block}",
    "#dsg .fchips{display:flex;gap:6px;margin-bottom:8px}",
    "#dsg .fchip{flex:1;padding:7px 4px;border:0;border-radius:18px;background:#eef0f7;color:#4a5068;cursor:pointer;text-align:center}",
    "#dsg .fchip.on{background:#1c2333;color:#fff}",
    "#dsg .fgrid{display:grid;grid-template-columns:repeat(2,1fr);grid-gap:8px}",
    "#dsg .fi{position:relative;border:2px solid transparent;border-radius:10px;background:#f3f4f9;cursor:pointer;padding:6px 8px 8px;text-align:center;min-height:62px;overflow:hidden;outline:0;-webkit-tap-highlight-color:transparent}",
    "#dsg .fi:active{transform:scale(.96)}",
    "#dsg .fi.on{border-color:#6a5cff;box-shadow:0 0 0 2px rgba(106,92,255,.25)}",
    "#dsg .fi .fl{display:block;color:#8a90a5;font-size:10.5px!important;direction:ltr;font-family:system-ui,Arial,sans-serif!important}",
    "#dsg .fi .fs{display:block;margin-top:2px;color:#1c2333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:19px!important;line-height:1.5!important;font-weight:400!important}",
    /* التبويب الداخلي (الخطوط / التأثير) داخل زخرفة الاسم */
    "#dsg .stabs{display:flex;gap:6px;margin-bottom:10px;padding:4px;border-radius:12px;background:#eef0f7}",
    "#dsg .stab{flex:1;padding:8px 4px;border:0;border-radius:9px;background:transparent;color:#4a5068;cursor:pointer;text-align:center}",
    "#dsg .stab.on{background:#fff;color:#6a5cff;box-shadow:0 1px 4px rgba(0,0,0,.12)}",
    "#dsg .sp{display:none}",
    "#dsg .sp.on{display:block}",
    "#dsg .spd{display:flex;align-items:center;gap:10px;padding:10px 12px;margin-bottom:10px;border-radius:12px;background:#f3f4f9}",
    "#dsg .spd .sl{flex:1;min-width:0}",
    "#dsg .spd .st{display:flex;justify-content:space-between;margin-bottom:4px;color:#6b7186}",
    "#dsg .spd input[type=range]{display:block;width:100%;height:28px;margin:0;accent-color:#6a5cff;direction:ltr;cursor:pointer}",
    "#dsg .spd.off{opacity:.45}",
    "#dsg .spd.off input{pointer-events:none}",
    "#dsg .sv{flex:0 0 auto;height:38px;padding:0 14px;border:0;border-radius:11px;background:linear-gradient(135deg,#6a5cff,#b04cff);color:#fff;cursor:pointer;font-weight:800!important;white-space:nowrap}",
    "#dsg .sv:active{transform:scale(.96)}",
    "#dsg .sv.ok{background:#2fb761}",
    /* تبويب تأثير لون */
    "#dsg .cbox{display:flex;align-items:center;gap:14px;padding:12px;margin-bottom:10px;border-radius:12px;background:#f3f4f9}",
    "#dsg .cpick{display:flex;flex-direction:column;align-items:center;gap:4px;color:#6b7186}",
    "#dsg .cp{position:relative;display:block;width:54px;height:54px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25);overflow:hidden;cursor:pointer}",
    "#dsg .cp input{position:absolute;top:-10px;left:-10px;width:80px;height:80px;opacity:0;cursor:pointer;border:0;padding:0}",
    "#dsg .cp span{position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;font-size:22px!important;pointer-events:none}",
    "#dsg .cdir{flex:1;display:flex;flex-direction:column;gap:6px}",
    "#dsg .cd{padding:8px 4px;border:0;border-radius:10px;background:#fff;color:#4a5068;cursor:pointer;text-align:center}",
    "#dsg .cd.on{background:#6a5cff;color:#fff}",
    "#dsg .csample{padding:14px 8px;margin-bottom:10px;text-align:center;border-radius:12px;background:#fff;border:1px solid #e1e4ee;overflow:hidden}",
    "#dsg .csample span{display:inline-block;max-width:100%;padding:2px 10px;font-size:24px!important;font-weight:800!important;line-height:1.6!important}",
    "#dsg .cs{display:block;width:100%;height:42px;margin-bottom:10px;border:0;border-radius:12px;background:#eef0f7;color:#4a5068;cursor:pointer;font-weight:800!important}",
    "#dsg .cs.on{background:#1c2333;color:#fff}",
    "#dsg .cact{display:flex;gap:8px}",
    "#dsg .cact .sv{flex:2;height:42px}",
    "#dsg .cact .bt{flex:1}",
    "#dsg .fi .xt{display:block;color:#4a5068;font-size:12px!important}",
    "#dsg .fi .xs{display:block;margin:6px 0 2px;color:#1c2333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:16px!important;line-height:1.6!important;font-weight:800!important}",
    /* باب إشعار زيارة البروفايل */
    "#dsg .vis{display:none;padding:14px 4px}",
    "#dsg .vis.on{display:block}",
    "#dsg.vtab .ft{display:none}",
    "#dsg .vis h4{margin-bottom:6px;font-size:14px!important;font-weight:800!important;color:#1c2333}",
    "#dsg .vis p{margin-bottom:14px;color:#6b7186}",
    "#dsg .vrow{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px;border-radius:12px;background:#f3f4f9}",
    "#dsg .sw{position:relative;flex:0 0 52px;width:52px;height:30px;border:0;border-radius:15px;background:#c3c7d6;cursor:pointer;transition:background .15s}",
    "#dsg .sw:after{content:'';position:absolute;top:3px;right:3px;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.3);transition:right .15s}",
    "#dsg .sw.on{background:#2fb761}",
    "#dsg .sw.on:after{right:25px}",
    /* تبويب إظهار / إخفاء */
    "#dsg .hid{display:none;padding:14px 4px}",
    "#dsg .hid.on{display:block}",
    "#dsg.htab .ft{display:none}",
    "#dsg .hid h4{margin-bottom:6px;font-size:14px!important;font-weight:800!important;color:#1c2333}",
    "#dsg .hid p{margin-bottom:12px;color:#6b7186}",
    "#dsg .hrow{display:flex;align-items:center;gap:10px;padding:10px 12px;margin-bottom:8px;border-radius:12px;background:#f3f4f9}",
    "#dsg .hrow .hl{flex:1;min-width:0}",
    "#dsg .hrow .hs{display:block;margin-top:2px;color:#8a90a5;font-size:11px!important;font-weight:600!important}",
    "#dsg .hrow .ht{flex:0 0 auto;min-width:44px;text-align:center;color:#8a90a5}",
    "#dsg .hrow.on .ht{color:#2fb761}",
    "#dsg.uh-name #dsgNm{display:none}",
    "#dsg.uh-msg #dsgMs{display:none}"
  ].join("\n");

  var HTML =
    '<div class="ov" data-a="close"></div>' +
    '<div class="box" role="dialog" aria-modal="true" aria-label="تصميم العضوية">' +
      '<div class="hd"><b>🎨 تصميم العضوية</b><button class="x" data-a="close" aria-label="إغلاق">×</button></div>' +
      '<div class="pvw">' +
        '<div class="pvl"><span>معاينة مباشرة</span><i>● تغييرات غير محفوظة</i></div>' +
        '<div class="row" id="dsgRow"><div class="av"><div class="pic" id="dsgPic"></div><div class="fr" id="dsgFr"></div></div>' +
        '<div class="tx"><span class="nm nx-self" id="dsgNm"></span><div class="ms" id="dsgMs"></div></div></div>' +
      '</div>' +
      '<div class="tabs">' +
        '<button class="tab on" data-a="tab" data-t="b">الخلفيات <small id="dsgCb"></small></button>' +
        '<button class="tab" data-a="tab" data-t="a">الإطارات <small id="dsgCa"></small></button>' +
        '<button class="tab" data-a="tab" data-t="f">زخرفة الاسم</button>' +
        '<button class="tab" data-a="tab" data-t="v">إشعار الزيارة</button>' +
        '<button class="tab" data-a="tab" data-t="h">إظهار / إخفاء</button>' +
      '</div>' +
      '<div class="bd"><div class="grid b on" id="dsgB"></div><div class="grid a" id="dsgA"></div>' +
        '<div class="fnt" id="dsgF">' +
          '<div class="stabs">' +
            '<button class="stab on" data-a="stab" data-s="f">🔤 الخطوط</button>' +
            '<button class="stab" data-a="stab" data-s="x">✨ التأثير</button>' +
            '<button class="stab" data-a="stab" data-s="c">🎨 تأثير لون</button>' +
          '</div>' +
          '<div class="sp on" id="dsgSf"><div class="fchips">' +
          '<button class="fchip on" data-a="fchip" data-c="all">الكل</button>' +
          '<button class="fchip" data-a="fchip" data-c="ar">عربي</button>' +
          '<button class="fchip" data-a="fchip" data-c="en">English</button></div>' +
          '<div class="fgrid" id="dsgFG"></div></div>' +
          '<div class="sp" id="dsgSx">' +
            '<div class="spd off" id="dsgSpd"><div class="sl">' +
              '<div class="st"><span>⏱️ سرعة الحركة</span><span id="dsgSpv">3</span></div>' +
              '<input type="range" id="dsgSpr" min="1" max="5" step="1" value="3" data-a="speed" aria-label="سرعة الحركة">' +
              '<div class="st"><span>بطيء</span><span>سريع</span></div></div>' +
              '<button class="sv" id="dsgSv" data-a="savefx">💾 حفظ</button></div>' +
            '<div class="fgrid" id="dsgXG"></div>' +
          '</div>' +
          '<div class="sp" id="dsgSc">' +
            '<div class="cbox">' +
              '<div class="cpick"><label class="cp" id="dsgL1"><input type="color" id="dsgC1" value="#ff3d71" aria-label="اللون الأول"><span>🎨</span></label><small>اللون 1</small></div>' +
              '<div class="cpick"><label class="cp" id="dsgL2"><input type="color" id="dsgC2" value="#3d7bff" aria-label="اللون الثاني"><span>🖌️</span></label><small>اللون 2</small></div>' +
              '<div class="cdir">' +
                '<button class="cd on" data-a="cdir" data-d="h">↔️ مزج أفقي</button>' +
                '<button class="cd" data-a="cdir" data-d="v">↕️ مزج عمودي</button>' +
              '</div>' +
            '</div>' +
            '<div class="csample"><span class="nx-self" id="dsgCs"></span></div>' +
            '<button class="cs" id="dsgCsh" data-a="cshine">✨ إضافة لمعة</button>' +
            '<div class="cact"><button class="sv" id="dsgCsv" data-a="saveclr">💾 حفظ</button>' +
            '<button class="bt s" data-a="clrclear">إزالة اللون</button></div>' +
          '</div></div>' +
        '<div class="vis" id="dsgV"><h4>إيقاف / تشغيل إشعار زيارة البروفايل</h4>' +
        '<p>عند التشغيل يصلك إشعار كلما فتح أحد بروفايلك. الإشعار متوقف افتراضياً.</p>' +
        '<div class="vrow"><span id="dsgVt">متوقف</span><button class="sw" id="dsgVs" data-a="vtoggle" aria-label="تشغيل أو إيقاف إشعار زيارة البروفايل"></button></div>' +
        '</div>' +
        '<div class="hid" id="dsgH"><h4>إظهار / إخفاء</h4>' +
        '<p>شغّل الزر لإخفاء العنصر. التغيير بيتحفظ فوراً.</p>' +
        '<div id="dsgHL"></div>' +
        '</div></div>' +
      '<div class="ft">' +
        '<button class="bt s" data-a="reset">إعادة</button>' +
        '<button class="bt p" data-a="apply" id="dsgOk" disabled>تطبيق</button>' +
      '</div>' +
    '</div>';

  var root, built = false, isOpen = false, sizes = { b: -1, a: -1 };
  var tab = "b", sub = "f";   /* [FIX-S25] التبويب النشط + التبويب الداخلي لزخرفة الاسم */
  var cur = { b: "", a: "", f: "", x: "", c: "" };   // القيم المحفوظة حالياً (x = التأثير "اسم:سرعة")
  var sel = { b: "", a: "", f: "", x: "", sp: 3, c: { on: false, c1: "#ff3d71", c2: "#3d7bff", d: "h", s: 0 } };   // القيم المختارة (معاينة) — x اسم التأثير و sp السرعة 1-5

  /* التأثير المختار كنص مخزن: "shake:3" أو "" */
  function fxStr() { return sel.x ? sel.x + ":" + sel.sp : ""; }
  /* تأثير اللون كنص مخزن: "#لون1,#لون2,اتجاه,لمعة" أو "" */
  function cStr() {
    var c = sel.c;
    return c.on ? [c.c1, c.c2, c.d, c.s ? 1 : 0].join(",") : "";
  }
  function cLoad(v) {
    var p = norm(v).split(",");
    sel.c = (window.nclParse && nclParse(norm(v)))
      ? { on: true, c1: p[0].toLowerCase(), c2: p[1].toLowerCase(), d: p[2], s: p[3] === "1" ? 1 : 0 }
      : { on: false, c1: "#ff3d71", c2: "#3d7bff", d: "h", s: 0 };
  }
  function fxSplit(v) {
    var p = norm(v).split(":"), n = parseInt(p[1], 10);
    return { x: p[0] || "", sp: (n >= 1 && n <= 5) ? n : 3 };
  }

  function norm(v) { return (v || "").toString().trim(); }
  function $id(i) { return document.getElementById(i); }

  function init() {
    if (built) return;
    var st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);
    root = document.createElement("div");
    root.id = "dsg";
    root.innerHTML = HTML;
    document.body.appendChild(root);
    root.addEventListener("click", onClick);
    root.addEventListener("input", function (e) {
      var r = e.target;
      if (!r) return;
      if (r.id === "dsgC1" || r.id === "dsgC2") {
        /* [FIX-S25] منتقي الألوان بيرمي عشرات أحداث input في الثانية أثناء
           السحب — الرسم كله بيتجمع في إطار rAF واحد بدل رسم لكل حدث */
        sel.c[r.id === "dsgC1" ? "c1" : "c2"] = (r.value || "").toLowerCase();
        sel.c.on = true;
        return paintSchedule();
      }
      if (r.id !== "dsgSpr") return;
      sel.sp = parseInt(r.value, 10) || 3;
      paintSchedule();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && root.classList.contains("on")) closeDesign();
    });
    built = true;
  }

  function me() {
    try { return (typeof U_CASH !== "undefined" && typeof M_ID !== "undefined" && U_CASH[M_ID]) || {}; }
    catch (e) { return {}; }
  }

  function plain(html) {
    var t = document.createElement("div");
    t.innerHTML = html || "";
    return t.textContent || "";
  }

  /* [FIX-S25] شارة العدد فقط (بدون بناء الشبكة) — البادجات بتتحدث للتبويبين
     دايماً، والشبكات نفسها بتبني عند فتح تبويبها بس */
  function counts(kind, list) {
    var n = (list && list.length) || 0;
    $id(kind === "b" ? "dsgCb" : "dsgCa").textContent = n ? "(" + n + ")" : "";
  }

  /* تعبئة الشبكات (مرة واحدة، أو عند تغيّر عدد العناصر) — بتنادى عند الطلب فقط */
  function fill(kind, list, folder) {
    var g = $id(kind === "b" ? "dsgB" : "dsgA");
    var n = (list && list.length) || 0;
    counts(kind, list);
    if (sizes[kind] === n) return;
    sizes[kind] = n;
    var f = document.createDocumentFragment();
    var none = document.createElement("button");
    none.className = "it no";
    none.setAttribute("data-a", "pick");
    none.setAttribute("data-k", kind);
    none.setAttribute("data-v", "");
    none.textContent = "بدون";
    f.appendChild(none);
    if (!n) {
      var em = document.createElement("div");
      em.className = "empty";
      em.textContent = "لا توجد عناصر متاحة";
      f.appendChild(em);
    }
    for (var i = 0; i < n; i++) {
      var p = folder + "/" + list[i].path;
      var b = document.createElement("button");
      b.className = "it";
      b.setAttribute("data-a", "pick");
      b.setAttribute("data-k", kind);
      b.setAttribute("data-v", p);
      var im = document.createElement("img");
      im.loading = "lazy";
      im.decoding = "async";
      im.alt = "";
      im.src = p;
      b.appendChild(im);
      f.appendChild(b);
    }
    g.textContent = "";
    g.appendChild(f);
  }

  /* [FIX-S25] تحميل الخطوط كسول: بدل تحميل 24 ملف خطوط من جوجل مرة واحدة
     عند فتح تبويب الخطوط (سخونة وتهنيج ملحوظ) — كل خط بيتحمّل لما بطاقته
     تظهر في الرؤية فقط، والخط المختار حالياً بيتحمّل فوراً */
  var fontIO = null;
  function lazyFonts(g) {
    if (sel.f && window.nfontLoad) nfontLoad(sel.f);
    if (typeof IntersectionObserver === "undefined") {
      /* متصفحات قديمة بدون مراقب رؤية: نرجع للسلوك القديم (تحميل الكل) */
      var all = g.querySelectorAll('.fi[data-v]:not([data-v=""])');
      for (var o = 0; o < all.length; o++) nfontLoad(all[o].getAttribute("data-v"));
      return;
    }
    if (!fontIO) {
      fontIO = new IntersectionObserver(function (es) {
        for (var i = 0; i < es.length; i++) {
          if (!es[i].isIntersecting) continue;
          var el = es[i].target;
          fontIO.unobserve(el);
          var k = el.getAttribute("data-v");
          if (k && window.nfontLoad) nfontLoad(k);
        }
      }, { root: root ? root.querySelector(".bd") : null, rootMargin: "140px" });
    } else {
      fontIO.disconnect();
    }
    var cards = g.querySelectorAll('.fi[data-v]:not([data-v=""])');
    for (var j = 0; j < cards.length; j++) fontIO.observe(cards[j]);
  }

  /* شبكة الخطوط: كل خانة تعرض اسم العضو بالخط نفسه — [FIX-S25] تُبنى مرة
     واحدة لكل تصنيف/اسم وتُعاد استخدامها بعد كده (كانت بتعيد البناء مع
     كل ضغطة تبويب أو فئة) */
  var fontCat = "all";
  var fontCache = { cat: null, sample: null };
  function fillFonts(cat) {
    if (cat) fontCat = cat;
    var list = window.NFONT_LIST || [];
    var g = $id("dsgFG");
    var sample = plain(me().topic) || me().username || "اسمك هنا";
    if (fontCache.cat === fontCat && fontCache.sample === sample) return paintSchedule();
    fontCache.cat = fontCat;
    fontCache.sample = sample;
    var f = document.createDocumentFragment();
    var none = document.createElement("button");
    none.className = "fi";
    none.setAttribute("data-a", "pickf");
    none.setAttribute("data-v", "");
    var nl = document.createElement("span"); nl.className = "fl"; nl.textContent = "Default";
    var ns = document.createElement("span"); ns.className = "fs"; ns.textContent = "بدون زخرفة";
    none.appendChild(nl); none.appendChild(ns);
    f.appendChild(none);
    for (var i = 0; i < list.length; i++) {
      var it = list[i];
      if (fontCat === "ar" && !it.a) continue;
      if (fontCat === "en" && !it.l) continue;
      var b = document.createElement("button");
      b.className = "fi";
      b.setAttribute("data-a", "pickf");
      b.setAttribute("data-v", it.k);
      var l = document.createElement("span"); l.className = "fl"; l.textContent = it.k;
      var sp = document.createElement("span"); sp.className = "fs"; sp.textContent = sample;
      sp.style.setProperty("font-family", "'" + it.g + "',sans-serif", "important");
      b.appendChild(l); b.appendChild(sp);
      f.appendChild(b);
    }
    g.textContent = "";
    g.appendChild(f);
    lazyFonts(g);   /* [FIX-S25] بديل nfontLoad لكل الخطوط فورًا */
    paintSchedule();
  }

  /* شبكة التأثيرات: كل خانة تعرض اسم العضو بالتأثير نفسه — [FIX-S25] تُبنى
     مرة واحدة (القائمة ثابتة) وتُعاد فقط لو اتغير اسم المعاينة */
  var fxCache = { sample: null };
  function fillFx() {
    var list = window.NFX_LIST || [];
    var g = $id("dsgXG");
    var sample = plain(me().topic) || me().username || "اسمك هنا";
    if (fxCache.sample === sample) return paintSchedule();
    fxCache.sample = sample;
    var f = document.createDocumentFragment();
    var none = document.createElement("button");
    none.className = "fi";
    none.setAttribute("data-a", "pickx");
    none.setAttribute("data-v", "");
    var nt = document.createElement("span"); nt.className = "xt"; nt.textContent = "🚫 بدون تأثير";
    var ns = document.createElement("span"); ns.className = "fs"; ns.textContent = sample;
    none.appendChild(nt); none.appendChild(ns);
    f.appendChild(none);
    for (var i = 0; i < list.length; i++) {
      var it = list[i];
      var b = document.createElement("button");
      b.className = "fi";
      b.setAttribute("data-a", "pickx");
      b.setAttribute("data-v", it.k);
      var t = document.createElement("span"); t.className = "xt"; t.textContent = it.e + " " + it.t;
      var sp = document.createElement("span"); sp.className = "xs nx-self"; sp.textContent = sample;
      sp.setAttribute("data-fx", it.k);
      var l = document.createElement("span"); l.className = "fl"; l.textContent = it.n;
      b.appendChild(t); b.appendChild(sp); b.appendChild(l);
      f.appendChild(b);
    }
    g.textContent = "";
    g.appendChild(f);
    paintSchedule();
  }

  function fillClr() {
    $id("dsgCs").textContent = plain(me().topic) || me().username || "اسمك هنا";
    paintSchedule();
  }

  /* [FIX-S25] بناء محتوى التبويب الظاهر فقط — ده قلب التحميل الكسول */
  function ensureActive() {
    if (tab === "b") fill("b", typeof back !== "undefined" ? back : [], "back");
    else if (tab === "a") fill("a", typeof atar !== "undefined" ? atar : [], "atar");
    else if (tab === "f") {
      if (sub === "x") fillFx();
      else if (sub === "c") fillClr();
      else fillFonts();
    }
    /* v و h ما بيحتاجوش بناء (بيتموا في paintVis/paintHide) */
  }

  /* [FIX-S25] تجميع الرسم في إطار واحد + وقف كامل لما النافذة مقفولة */
  var paintQueued = false;
  function paintSchedule() {
    if (paintQueued || !built || !isOpen) return;
    paintQueued = true;
    (window.requestAnimationFrame || setTimeout)(function () {
      paintQueued = false;
      if (isOpen) paint();
    });
  }

  /* تحديث المعاينة + حالة العناصر المحددة
     [FIX-S25] كان بيعمل querySelectorAll على كل الشبكات (خلفيات + إطارات +
     خطوط + تأثيرات) مع كل حركة سحب لون أو ضغطة — الآن بيلمس شبكة التبويب
     الظاهر فقط، والمعاينة الرئيسية دايماً */
  function paint() {
    var row = $id("dsgRow"), fr = $id("dsgFr");
    row.style.backgroundImage = sel.b ? 'url("' + sel.b + '")' : "none";
    row.style.backgroundColor = sel.b ? "rgba(255,255,255,.05)" : "#fff";
    fr.style.backgroundImage = sel.a ? 'url("' + sel.a + '")' : "none";

    if (tab === "b" || tab === "a") {
      var g = $id(tab === "b" ? "dsgB" : "dsgA");
      var items = g.querySelectorAll(".it");
      for (var i = 0; i < items.length; i++) {
        items[i].classList.toggle("on", items[i].getAttribute("data-v") === sel[tab]);
      }
    }

    var nme = $id("dsgNm");
    if (sel.f && window.nfontFamily) nme.style.setProperty("font-family", nfontFamily(sel.f), "important");
    else nme.style.removeProperty("font-family");
    if (sel.f && window.nfontLoad) nfontLoad(sel.f);

    if (window.nfxSet) nfxSet(nme, fxStr());
    if (window.nclSet) nclSet(nme, cStr());

    if (tab === "f") {
      if (sub === "f") {
        var fis = $id("dsgFG").querySelectorAll(".fi");
        for (var j = 0; j < fis.length; j++) fis[j].classList.toggle("on", fis[j].getAttribute("data-v") === sel.f);
      } else if (sub === "x") {
        if (window.nfxSet) {
          var xs = $id("dsgXG").querySelectorAll(".xs");
          for (var q = 0; q < xs.length; q++) nfxSet(xs[q], xs[q].getAttribute("data-fx") + ":" + sel.sp);
        }
        var xis = $id("dsgXG").querySelectorAll(".fi");
        for (var w = 0; w < xis.length; w++) xis[w].classList.toggle("on", xis[w].getAttribute("data-v") === sel.x);
        $id("dsgSpd").classList.toggle("off", !sel.x);
        $id("dsgSpr").value = sel.sp;
        $id("dsgSpv").textContent = sel.sp;
        var svb = $id("dsgSv");
        svb.disabled = fxStr() === cur.x;
        svb.style.opacity = svb.disabled ? ".5" : "1";
      } else if (sub === "c") {
        if (window.nclSet) nclSet($id("dsgCs"), cStr());
        $id("dsgC1").value = sel.c.c1; $id("dsgC2").value = sel.c.c2;
        $id("dsgL1").style.background = sel.c.c1; $id("dsgL2").style.background = sel.c.c2;
        var cds = root.querySelectorAll(".cd");
        for (var u2 = 0; u2 < cds.length; u2++) cds[u2].classList.toggle("on", cds[u2].getAttribute("data-d") === sel.c.d);
        var csh = $id("dsgCsh");
        csh.classList.toggle("on", !!sel.c.s);
        csh.textContent = sel.c.s ? "✨ اللمعة مفعّلة (اضغط للإلغاء)" : "✨ إضافة لمعة";
        var csv = $id("dsgCsv");
        csv.disabled = cStr() === cur.c;
        csv.style.opacity = csv.disabled ? ".5" : "1";
      }
    }

    var dirty = sel.b !== cur.b || sel.a !== cur.a || sel.f !== cur.f || fxStr() !== cur.x || cStr() !== cur.c;
    root.classList.toggle("dirty", dirty);
    $id("dsgOk").disabled = !dirty;
  }

  function paintUser(u) {
    var pic = u.pic || "";
    try { if (typeof removegifpic === "function") pic = removegifpic(pic); } catch (e) {}
    var pe = $id("dsgPic");
    pe.style.backgroundImage = pic ? 'url("' + pic + '")' : "none";
    pe.style.borderColor = u.copic || "#fff";
    var nm = $id("dsgNm");
    nm.textContent = plain(u.topic) || u.username || "اسمك هنا";
    nm.style.backgroundColor = u.bg || "#f3f3f3";
    nm.style.color = u.ucol || "#000";
    var ms = $id("dsgMs");
    ms.textContent = plain(u.msg);
    ms.style.color = u.mscol || "#555";
  }

  function onClick(e) {
    var t = e.target.closest ? e.target.closest("[data-a]") : null;
    if (!t) return;
    var a = t.getAttribute("data-a");
    if (a === "close") return closeDesign();
    if (a === "stab") {
      var sk = t.getAttribute("data-s");
      sub = sk;
      var sts = root.querySelectorAll(".stab");
      for (var si = 0; si < sts.length; si++) sts[si].classList.toggle("on", sts[si] === t);
      $id("dsgSf").classList.toggle("on", sk === "f");
      $id("dsgSx").classList.toggle("on", sk === "x");
      $id("dsgSc").classList.toggle("on", sk === "c");
      ensureActive();   /* [FIX-S25] بناء محتوى التبويب الداخلي عند الطلب فقط */
      root.querySelector(".bd").scrollTop = 0;
      return;
    }
    if (a === "cdir") {
      sel.c.d = t.getAttribute("data-d") === "v" ? "v" : "h";
      sel.c.on = true;
      return paintSchedule();
    }
    if (a === "cshine") {
      sel.c.s = sel.c.s ? 0 : 1;
      sel.c.on = true;
      return paintSchedule();
    }
    if (a === "clrclear") {
      sel.c.on = false;
      return paintSchedule();
    }
    if (a === "saveclr") {
      var cv = cStr();
      if (cv === cur.c) return;
      try { socket.emit("nclr", cv); } catch (er) {}
      cur.c = cv;
      t.classList.add("ok");
      t.textContent = "✓ تم الحفظ";
      setTimeout(function () { t.classList.remove("ok"); t.textContent = "💾 حفظ"; }, 1400);
      return paintSchedule();
    }
    if (a === "pickx") {
      sel.x = t.getAttribute("data-v") || "";
      return paintSchedule();
    }
    if (a === "savefx") {
      var xv = fxStr();
      if (xv === cur.x) return;
      try { socket.emit("nfx", xv); } catch (er) {}
      cur.x = xv;
      t.classList.add("ok");
      t.textContent = "✓ تم الحفظ";
      setTimeout(function () { t.classList.remove("ok"); t.textContent = "💾 حفظ"; }, 1400);
      return paintSchedule();
    }
    if (a === "pickf") {
      sel.f = t.getAttribute("data-v") || "";
      if (sel.f && window.nfontLoad) nfontLoad(sel.f);   /* [FIX-S25] تحميل الخط المختار فوراً */
      return paintSchedule();
    }
    if (a === "pick") {
      sel[t.getAttribute("data-k")] = t.getAttribute("data-v");
      return paintSchedule();
    }
    if (a === "fchip") {
      var chips = root.querySelectorAll(".fchip");
      for (var c = 0; c < chips.length; c++) chips[c].classList.toggle("on", chips[c] === t);
      return fillFonts(t.getAttribute("data-c"));
    }
    if (a === "tab") {
      var k = t.getAttribute("data-t");
      tab = k;
      var tabs = root.querySelectorAll(".tab");
      for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle("on", tabs[i] === t);
      $id("dsgB").classList.toggle("on", k === "b");
      $id("dsgA").classList.toggle("on", k === "a");
      $id("dsgF").classList.toggle("on", k === "f");
      $id("dsgV").classList.toggle("on", k === "v");
      $id("dsgH").classList.toggle("on", k === "h");
      root.classList.toggle("vtab", k === "v");
      root.classList.toggle("htab", k === "h");
      ensureActive();   /* [FIX-S25] الشبكة بتتعمل أول ما التبويب يفتح — مش كلها مع بعض */
      root.querySelector(".bd").scrollTop = 0;
      return;
    }
    if (a === "vtoggle") {
      var nv = !window.VISIT_NOTIF;
      try { socket.emit("visitnotif", nv); } catch (er) {}
      return;
    }
    if (a === "htoggle") {
      var bit = parseInt(t.getAttribute("data-b"), 10) || 0;
      var nm = ((window.UHIDE | 0) ^ bit) & 31;
      window.UHIDE = nm;            // تحديث فوري، السيرفر هيأكد
      paintHide();
      try { socket.emit("uhide", nm); } catch (er) {}
      return;
    }
    if (a === "reset") {
      sel.b = cur.b; sel.a = cur.a; sel.f = cur.f;
      var rx = fxSplit(cur.x); sel.x = rx.x; sel.sp = rx.sp;
      cLoad(cur.c);
      return paintSchedule();
    }
    if (a === "apply") {
      if (sel.b !== cur.b) addback(sel.b || " ", 1);
      if (sel.a !== cur.a) addback(sel.a || " ", 2);
      if (sel.f !== cur.f) { try { socket.emit("nfont", sel.f); } catch (er) {} }
      if (fxStr() !== cur.x) { try { socket.emit("nfx", fxStr()); } catch (er) {} }
      if (cStr() !== cur.c) { try { socket.emit("nclr", cStr()); } catch (er) {} }
      cur.b = sel.b; cur.a = sel.a; cur.f = sel.f; cur.x = fxStr(); cur.c = cStr();
      return closeDesign();
    }
  }

  function paintVis() {
    if (!built) return;
    var on = !!window.VISIT_NOTIF;
    $id("dsgVs").classList.toggle("on", on);
    $id("dsgVt").textContent = on ? "مُشغَّل" : "متوقف";
  }
  window.visitNotifPaint = paintVis;

  /* إظهار / إخفاء: صفوف الميزات (بتتبني مرة واحدة) */
  var HIDE_ITEMS = [
    { b: 1,  i: "🏳️", t: "إخفاء العلم", s: "من قايمة المتصلين والبروفايل" },
    { b: 2,  i: "🟢", t: "إخفاء حالة النشاط", s: "من قايمة المتصلين" },
    { b: 4,  i: "🔤", t: "إخفاء الاسم", s: "من قايمة المتصلين والبروفايل" },
    { b: 8,  i: "💬", t: "إخفاء الوصف", s: "من قايمة المتصلين والبروفايل" },
    { b: 16, i: "#️⃣", t: "إخفاء الهاشتاق (الرقم)", s: "الرقم اللي جنب العضوية في المتصلين" }
  ];
  var hideBuilt = false;
  function buildHide() {
    if (hideBuilt) return;
    var box = $id("dsgHL"), f = document.createDocumentFragment();
    HIDE_ITEMS.forEach(function (it) {
      var r = document.createElement("div");
      r.className = "hrow";
      r.setAttribute("data-b", it.b);
      var l = document.createElement("div");
      l.className = "hl";
      var n = document.createElement("span");
      n.textContent = it.i + " " + it.t;
      var sub = document.createElement("span");
      sub.className = "hs";
      sub.textContent = it.s;
      l.appendChild(n); l.appendChild(sub);
      var tx = document.createElement("span");
      tx.className = "ht";
      tx.textContent = "مقفول";
      var sw = document.createElement("button");
      sw.className = "sw";
      sw.setAttribute("data-a", "htoggle");
      sw.setAttribute("data-b", it.b);
      sw.setAttribute("aria-label", it.t);
      r.appendChild(l); r.appendChild(tx); r.appendChild(sw);
      f.appendChild(r);
    });
    box.appendChild(f);
    hideBuilt = true;
  }
  function paintHide() {
    if (!built) return;
    buildHide();
    var m = (window.UHIDE | 0) & 31;
    var rows = $id("dsgHL").querySelectorAll(".hrow");
    for (var i = 0; i < rows.length; i++) {
      var on = !!(m & parseInt(rows[i].getAttribute("data-b"), 10));
      rows[i].classList.toggle("on", on);
      rows[i].querySelector(".sw").classList.toggle("on", on);
      rows[i].querySelector(".ht").textContent = on ? "مفعّل" : "مقفول";
    }
    root.classList.toggle("uh-name", !!(m & 4));
    root.classList.toggle("uh-msg", !!(m & 8));
  }
  window.uhidePaint = paintHide;

  window.openDesign = function () {
    init();
    isOpen = true;   /* [FIX-S25] قبل أي رسم — النافذة صارت مفتوحة */
    paintVis();
    paintHide();
    var u = me();
    cur.b = norm(u.back);
    cur.a = norm(u.atar);
    cur.f = norm(u.nfont);
    cur.x = (window.nfxParse && nfxParse(norm(u.nfx))) ? norm(u.nfx) : "";
    sel.b = cur.b; sel.a = cur.a; sel.f = cur.f;
    var ox = fxSplit(cur.x); sel.x = ox.x; sel.sp = ox.sp;
    cur.c = (window.nclParse && nclParse(norm(u.nclr))) ? norm(u.nclr).toLowerCase() : "";
    cLoad(cur.c);
    /* [FIX-S25] البادجات دايماً (نص واحد) + بناء محتوى التبويب الظاهر فقط
       (كان بيبني الخلفيات والإطارات والخطوط كلها مع أول فتح) */
    counts("b", typeof back !== "undefined" ? back : []);
    counts("a", typeof atar !== "undefined" ? atar : []);
    ensureActive();
    paintUser(u);
    paint();
    root.style.display = "block";
    void root.offsetWidth;            // إعادة حساب لتشغيل الحركة
    root.classList.add("on");
  };

  window.closeDesign = function () {
    if (!root) return;
    isOpen = false;   /* [FIX-S25] أي رسم مجدول بيتلغي — صفر عمل وهي مقفولة */
    root.classList.remove("on");
    setTimeout(function () { if (!root.classList.contains("on")) root.style.display = ""; }, 200);
  };
})();
