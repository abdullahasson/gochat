/* ==========================================================
   [ADDED] زر "ألوان الشات" في إعدادات المستخدم (فوق زر الألعاب)
   - نافذة "استوديو الألوان الفاخرة": ألوان جاهزة + تدرج خاص + قوة اللون
   - بيتطبق على نفس أماكن لون القوالب ولون الأزرار في لوحة التحكم (تبويب الموقع)، مش على محتوى الشات — ومتخزن على جهاز العضو (localStorage)
   - بيخفي زر "اضافة رابط" من الإعدادات
   ملف مستقل: openChatColors() / closeChatColors()
   ========================================================== */
(function () {
  "use strict";
  if (window.__chatColorsLoaded) return;
  window.__chatColorsLoaded = true;
  var KEY = "chatColorsBg";
  var PRESETS = [{"g": "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)", "t": "ذهبي ملكي"}, {"g": "linear-gradient(135deg, #093028, #237A57)", "t": "زمردي داكن"}, {"g": "linear-gradient(135deg, #134e5e, #71b280)", "t": "زمردي بحري"}, {"g": "linear-gradient(135deg, #3E2723, #5D4037)", "t": "بني شوكولاتة"}, {"g": "linear-gradient(135deg, #4A3000, #B8860B)", "t": "بني نحاسي"}, {"g": "linear-gradient(135deg, #D4B996, #EFE3D0)", "t": "بيجي ملكي"}, {"g": "linear-gradient(135deg, #C5A880, #F3E5AB)", "t": "بيجي لاتيه"}, {"g": "linear-gradient(135deg, #0f0c29, #302b63, #24243e)", "t": "أسود ليلي"}, {"g": "linear-gradient(135deg, #4b134f, #c57b57)", "t": "أرجواني مخملي"}, {"g": "linear-gradient(135deg, #610404, #C0392B)", "t": "ياقوتي أحمر"}, {"g": "linear-gradient(135deg, #bdc3c7, #2c3e50)", "t": "فضي معدني"}, {"g": "linear-gradient(135deg, #E0E0E0, #9E9E9E, #616161)", "t": "رخامي رمادي"}];
  var cur = "";            /* التدرج المختار (معاينة) */
  var built = false, root, prev;

  function safeGet() { try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } }
  function safeSet(v) { try { if (v) localStorage.setItem(KEY, v); else localStorage.removeItem(KEY); } catch (e) {} }
  /* نقبل بس linear-gradient بألوان hex / rgba (حماية من أي نص غريب) */
  function valid(v) { return /^linear-gradient\((135deg|to right|to bottom)(,\s*(#[0-9a-fA-F]{3,8}|rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*[0-9.]+\s*\)))+\)$/.test(v) || /^linear-gradient\(135deg(,\s*#[0-9a-fA-F]{6}){2,3}\)$/.test(v); }

  /* متوسط إضاءة ألوان التدرج (0 = غامق، 1 = فاتح) */
  function lumOf(v) {
    var sum = 0, n = 0, m, r, g, b, re = /#([0-9a-fA-F]{6})|rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g;
    while ((m = re.exec(v))) {
      if (m[1]) { r = parseInt(m[1].slice(0, 2), 16); g = parseInt(m[1].slice(2, 4), 16); b = parseInt(m[1].slice(4, 6), 16); }
      else { r = +m[2]; g = +m[3]; b = +m[4]; }
      sum += (0.299 * r + 0.587 * g + 0.114 * b) / 255; n++;
    }
    return n ? sum / n : 0;
  }

  function applyChat(v) {
    var st = document.getElementById("ccApplied");
    if (!v || !valid(v)) { if (st) st.remove(); return; }
    if (!st) { st = document.createElement("style"); st.id = "ccApplied"; document.head.appendChild(st); }
    /* نفس الأماكن اللي بتغيّرها لوحة التحكم (تبويب الموقع):
       لون القوالب  -> .bg (+ body) و .pnhead
       لون الأزرار  -> .label-primary/.btn-primary/.bg-primary + زر المايك والكتم + زر التعليقات + شريط المايكات */
    var T = ".bg,.fl.nosel.label.pnhead";
    var B = ".label-primary,.btn-primary,.bg-primary,#mic .mic,#muteall,a.comm.btn.minix.btn-danger.fa.fa-comments.fr";
    var host = String(location.hostname || "").replace(/[^a-zA-Z0-9.\-]/g, "_");
    /* [FIX-NOBTN] أزرار البروفايل وأزرار الأدوات الإدارية (جوه نافذة البروفايل #upro .pro) ما ياخدوش خلفية لون الشات */
    var Bx = B.split(",").map(function (x) { return x + ":not(#upro .pro *)"; }).join(",");
    var main = T + "," + Bx + "{background-image:" + v + "!important}";

    /* ===== [FIX] الشريط السفلي + شريط المايكات + أزرار شريط الكتابة =====
       السبب: قواعد bars-site-color.js / bars-style.js / room-style.css كاتبة ألوان ثابتة بـ !important
       وبأولوية (specificity) أعلى من القواعد اللي فوق، فالتدرج ما كانش بيظهر عليهم.
       الحل: نفس التدرج بس بأولوية أعلى (html:root:root) وفي الوضعين: الافتراضي (البني) والجديد (nb). */
    /* [FIX 4] uireta.css (body.uireta-on:not(#uq)) بيحسب :not(#uq) كـ ID فكان بيكسب علينا — نضيف 4 IDs وهمية عشان الأولوية تفوق أي قاعدة فيه */
    var BOOST = ":not(#z):not(#z):not(#z):not(#z)";
    var Pn = "html:root:root" + BOOST + " body.nb ", Pb = "html:root:root" + BOOST + " body:not(.nb) ";
    var G = "background-image:" + v + "!important";
    var FR = '#room>.tablebox.footer>.btn:not([style*="display: none"])';
    var FC = '.cont>.tablebox.footer>.btn:not([style*="display: none"])';
    var o = [];
    /* بيحط الـ prefix على كل selector في القائمة (مفيش فواصل جوه الـ selectors دي) */
    function pre(P, sel) { return sel.split(",").map(function (x) { return P + x; }).join(","); }
    function both(sel, decl) { o.push(pre(Pn, sel) + "{" + decl + "}", pre(Pb, sel) + "{" + decl + "}"); }

    /* شريط المايكات: الافتراضي صورة الخلفية فوق التدرج، والجديد تدرج بس */
    o.push(pre(Pb, ".broadcasters") + "{background-image:url(/site/" + host + "bacmic.png?z)," + v + "!important}");
    o.push(pre(Pn, ".broadcasters") + "{" + G + "}");
    both("#muteall", G);
    /* الشريط السفلي */
    both("#d0", G);
    both("#d0 .ae", G);
    both("#d0 .ae.nb-on", "background-image:none!important;background-color:rgba(0,0,0,.28)!important");
    /* أزرار شريط الكتابة (الغرفة + الخاص + التعليقات) */
    both(FR + "," + FC, G);

    /* لون الكتابة/الأيقونات في الوضع الافتراضي حسب فتحة/غمقان التدرج */
    var tc = lumOf(v) > 0.62 ? "#1a1a1a" : "#fff";
    o.push(pre(Pb, "#d0 .ae,#d0 .ae>span,#d0 .ae::before," + FR + "," + FC + ",#room>.tablebox.footer>.btn::before,.cont>.tablebox.footer>.btn::before") + "{color:" + tc + "!important}");


    /* ===== [FIX 2] باقي العناصر اللي bars-site-color.js كان بيلوّنها بـ !important (نفس لون الموقع) ===== */
    var PA = "html:root:root" + BOOST + " ";
    var light = lumOf(v) > 0.62, tt = light ? "#1a1a1a" : "#fff";
    /* 1) شارة اسم الغرفة في رسايل الانضمام والتنقل (الوضعين) */
    both(".hmsg .roomh,#d2 .roomh", G + ";background-color:transparent!important;color:" + tt + "!important");
    both(".hmsg .roomh::before,#d2 .roomh::before", "color:" + tt + "!important");
    /* 2) نافذة الإعدادات الافتراضية: الهيدر + أزرار الاسم + القوائم */
    o.push(pre(PA, "#rs-wrap .rs-lb,#rs-wrap select.rs-sel,#dpnl:has(#settings.active)>.pnhead") + "{" + G + ";color:" + tt + "!important}");
    /* 3) أزرار الرجوع داخل المميزات والإضافات */
    var BK = "#othpage .og-back,body.ul #othpage .og-back,#top10 .wt-back,#wtrend .wr-back,.xs-back";
    o.push(pre(PA, BK) + "{" + G + ";color:" + tt + "!important}");
    o.push(pre(PA, BK.split(",").map(function (x) { return x + " .fa," + x + " span"; }).join(",")) + "{color:" + tt + "!important}");
    /* 4) الشريط السفلي في الشكل الجديد: لو التدرج فاتح نغمّق الأيقونات والعدّادات */
    if (light) o.push(pre(Pn, "#d0 .ae,#d0 .ae>span,#d0 .ae::before") + "{color:#1a1a1a!important}");


    /* ===== [FIX 3] أزرار الرد/الحذف + شريط المتواجدين + البروفايل ===== */
    var PU = "html:root:root" + BOOST + " body ";
    /* أزرار الرد والحذف (والقلب) جنب رسايل الغرفة */
    both(".blike,.breply,.bdel,#d2 .breply,#d2 .bdel", G);
    /* قايمة المتصلين: شريط "المتواجدين في الدردشة" */
    o.push(pre(PU, "#users .usr>#ninrbar") + "{" + G + ";color:" + tt + "!important}");
    /* نافذة البروفايل: الهيدر + الأزرار */
    /* الهيدر بس بياخد اللون — أزرار البروفايل والأدوات الإدارية بتفضل بشكلها الأصلي */
    o.push(pre(PU, "#upro .pc-head") + "{" + G + "}");
    o.push(pre(PU, "#upro .pc-head .pc-title") + "{color:" + tt + "!important}");


    /* ===== [FIX 5] الحائط + نافذة الإشعارات + أزرار الدخول في اللوجين ===== */
    var WL = [
      "#dpnl:has(#wall.active)>.pnhead",                                              /* هيدر الحائط */
      "#wall label.top.wall",                                                          /* زر مبدعين الحائط */
      "#wall .fth-tab.on",                                                             /* التبويب المفتوح */
      "#wall .ytw-go",                                                                 /* زر يوتيوب */
      "#wall .tablebox>.ytw-open,#wall .tablebox>.sndfilebc,#wall .tablebox>.sndbc",   /* أزرار شريط الكتابة */
      "#d2feather .fth-box>.fth-plus,#d2feather .fth-box>.fth-send",
      "#d2feather .fth-cm-btn,#d2feather .fth-del,#d2feather .fth-act.on"              /* أزرار البوست */
    ].join(",");
    var NT = [
      "#dpnl:has(#wetchprofilenotifi.active)>.pnhead",                                 /* هيدر نافذة الإشعارات */
      "#wetchprofilenotifi .nt-head button",                                           /* أزرار (مسح / قراءة الكل) */
      "#wetchprofilenotifi .notification__title"                                       /* شارة عنوان الإشعار */
    ].join(",");
    var LG = "#tlogins .btn.btn-primary,#tlogins .tab-content .btn-primary,#tlogins .submit-btn,#tlogins .join-btn"; /* زر الدخول (كل أنماط اللوجين) */
    o.push(pre(PA, WL + "," + NT + "," + LG) + "{" + G + ";color:" + tt + "!important}");


    /* ===== [FIX 6] نافذة إعدادات الغرفة (#mkr) + نافذة إرسال إعلان (#mnot) + باقي هيدرات النوافذ ===== */
    var MD = [
      ".modal .modal-header.label-primary",                       /* هيدر أي نافذة (إعلان / إعدادات الغرفة / تعليقات ...) */
      "#mkr .rm-lb",                                             /* عناوين الحقول في إعدادات الغرفة */
      "#mkr .rm-btns .btn-primary",                              /* إنشاء الغرفة / حفظ التعديلات */
      "#mnot .btn-primary"                                       /* زر إرسال الإعلان */
    ].join(",");
    o.push(pre(PA, MD) + "{" + G + ";color:" + tt + "!important}");
    o.push(pre(PA, ".modal .modal-header.label-primary .modal-title,.modal .modal-header.label-primary .fa,#mkr .rm-btns .btn-primary span,#mnot .btn-primary span") + "{color:" + tt + "!important}");

    st.textContent = main + o.join("");
  }

  function css() {
    if (document.getElementById("ccCss")) return;
    var s = document.createElement("style");
    s.id = "ccCss";
    s.textContent = [
      ".mlk-open,.rs-mlk{display:none!important}",
      /* القياسات (الطول/العرض/الهوامش/الخط/الحواف) بتيجي من تصميم الإعدادات نفسه (rs-btn / st-pill) — هنا اللون والشكل بس */
      ".cc-open{display:flex;align-items:center;justify-content:center;position:relative;width:98%;height:40px;margin:6px auto 0;padding:0 40px;border-radius:12px;cursor:pointer;direction:rtl;font-size:15px;font-weight:700;float:none}",
      "html body #settings #cc-btn.cc-open{position:relative!important;overflow:hidden!important;color:#3b2600!important;border:1px solid rgba(255,236,170,.7)!important;",
      "background:linear-gradient(135deg,#d9ad4b 0%,#fbeaa0 45%,#c9972c 100%)!important;background-image:linear-gradient(135deg,#d9ad4b 0%,#fbeaa0 45%,#c9972c 100%)!important;box-shadow:0 4px 12px rgba(179,135,40,.45),inset 0 1px 0 rgba(255,255,255,.7)!important;text-shadow:0 1px 0 rgba(255,255,255,.55)!important;-webkit-tap-highlight-color:transparent;user-select:none}",
      "html body #settings #cc-btn.cc-open:active{transform:scale(.97)}",
      "html body #settings #cc-btn.cc-open>span{color:#3b2600!important;font-weight:800!important}",
      "html body #settings #cc-btn.cc-open>.fa{color:#3b2600!important}",
      "html body #settings #cc-btn.cc-open:before{content:''!important;display:block!important;position:absolute!important;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.65),transparent)!important;transform:skewX(-20deg);animation:ccShine 3.4s ease-in-out infinite!important;pointer-events:none}",
      "@keyframes ccShine{0%,55%{left:-60%}100%{left:130%}}",
      "#ccRoot{display:none;position:fixed;inset:0;z-index:2147483000;background:rgba(2,6,23,.72);align-items:center;justify-content:center;padding:14px;direction:rtl;font-family:Cairo,Tajawal,Tahoma,sans-serif}",
      "#ccRoot.on{display:flex}",
      "#ccRoot *{box-sizing:border-box;font-family:Cairo,Tajawal,Tahoma,sans-serif!important}",
      "#ccRoot .cc-box{background:#1e293b;width:100%;max-width:520px;max-height:94vh;overflow-y:auto;padding:22px;border-radius:16px;border:1px solid #334155;box-shadow:0 10px 25px rgba(0,0,0,.4);color:#f8fafc;position:relative}",
      "#ccRoot .cc-x{position:absolute;top:10px;left:12px;width:30px;height:30px;border-radius:50%;background:#0f172a;color:#cbd5e1;border:1px solid #475569;cursor:pointer;font-size:16px!important;line-height:1}",
      "#ccRoot .cc-title{text-align:center;color:#38bdf8;font-size:21px!important;margin:0 0 18px}",
      "#ccRoot .cc-sec{margin-bottom:16px}",
      "#ccRoot .cc-lab{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:14px!important;font-weight:600;color:#cbd5e1}",
      "#ccRoot .cc-hint{color:#38bdf8;font-size:12px!important}",
      "#ccRoot .cc-pre{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;max-height:180px;overflow-y:auto;padding:8px;background:#0f172a;border:1px solid #334155;border-radius:10px}",
      "#ccRoot .cc-p{height:42px;border:2px solid #475569;border-radius:8px;cursor:pointer;transition:transform .2s,border-color .2s;padding:0}",
      "#ccRoot .cc-p:hover{transform:scale(1.05);border-color:#38bdf8}",
      "#ccRoot .cc-ctl{display:flex;gap:10px;align-items:center}",
      "#ccRoot input[type=color]{-webkit-appearance:none;appearance:none;width:48px;height:40px;border:none;background:none;cursor:pointer;padding:0}",
      "#ccRoot input[type=color]::-webkit-color-swatch-wrapper{padding:0}",
      "#ccRoot input[type=color]::-webkit-color-swatch{border:2px solid #475569;border-radius:8px}",
      "#ccRoot select{flex:1;height:40px;padding:0 12px;background:#0f172a;color:#fff;border:1px solid #475569;border-radius:8px;font-size:14px!important;outline:none}",
      "#ccRoot input[type=range]{width:100%;height:6px;background:#0f172a;border-radius:3px;outline:none;-webkit-appearance:none;appearance:none;border:1px solid #475569;cursor:pointer;margin-top:4px}",
      "#ccRoot input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;background:#38bdf8;border-radius:50%;cursor:pointer}",
      "#ccRoot .cc-prev{height:110px;display:flex;align-items:center;justify-content:center;font-size:17px!important;font-weight:700;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,.6);border:2px dashed #475569;border-radius:12px;overflow:hidden}",
      "#ccRoot .cc-btns{display:flex;gap:8px;margin-top:6px}",
      "#ccRoot .cc-ok{flex:2;height:44px;background:#0284c7;color:#fff;border:none;border-radius:8px;font-size:15px!important;font-weight:700;cursor:pointer}",
      "#ccRoot .cc-ok:hover{background:#0369a1}",
      "#ccRoot .cc-rs{flex:1;height:44px;background:#0f172a;color:#cbd5e1;border:1px solid #475569;border-radius:8px;font-size:14px!important;font-weight:700;cursor:pointer}"
    ].join("");
    document.head.appendChild(s);
  }

  function hexToRgba(hex, a) {
    return "rgba(" + parseInt(hex.slice(1, 3), 16) + ", " + parseInt(hex.slice(3, 5), 16) + ", " + parseInt(hex.slice(5, 7), 16) + ", " + a + ")";
  }
  function setPrev(v) { cur = v; if (prev) prev.style.background = v; }

  function custom() {
    var c1 = root.querySelector("#ccC1").value, c2 = root.querySelector("#ccC2").value;
    var d = root.querySelector("#ccDir").value, o = root.querySelector("#ccOp").value;
    root.querySelector("#ccOpV").textContent = Math.round(o * 100) + "%";
    setPrev("linear-gradient(" + d + ", " + hexToRgba(c1, o) + ", " + hexToRgba(c2, o) + ")");
  }

  function build() {
    if (built) return;
    built = true;
    css();
    root = document.createElement("div");
    root.id = "ccRoot";
    var pre = PRESETS.map(function (p, i) {
      return '<button type="button" class="cc-p" data-i="' + i + '" style="background:' + p.g + '" title="' + p.t + '"></button>';
    }).join("");
    root.innerHTML =
      '<div class="cc-box">' +
        '<button type="button" class="cc-x" title="إغلاق">&times;</button>' +
        '<h2 class="cc-title">استوديو الألوان الفاخرة</h2>' +
        '<div class="cc-sec"><div class="cc-lab">اختر من الألوان الفاخرة الجاهزة:</div><div class="cc-pre">' + pre + '</div></div>' +
        '<div class="cc-sec"><div class="cc-lab">تصميم تدرج خاص:</div>' +
          '<div class="cc-ctl"><input type="color" id="ccC1" value="#C5A880"><input type="color" id="ccC2" value="#3E2723">' +
          '<select id="ccDir"><option value="135deg">زاوية مائلة (135°)</option><option value="to right">من اليسار إلى اليمين</option><option value="to bottom">من الأعلى إلى الأسفل</option></select></div>' +
          '<div class="cc-lab" style="margin-top:10px;margin-bottom:4px"><span>قوة / شفافية اللون:</span><span id="ccOpV" class="cc-hint">100%</span></div>' +
          '<input type="range" id="ccOp" min="0.1" max="1" step="0.05" value="1">' +
        '</div>' +
        '<div class="cc-sec"><div class="cc-lab"><span>معاينة اللون:</span></div><div class="cc-prev" id="ccPrev">معاينة اللون الخاص</div></div>' +
        '<div class="cc-btns"><button type="button" class="cc-ok">اعتماد وتطبيق اللون</button><button type="button" class="cc-rs">الافتراضي</button></div>' +
      '</div>';
    document.body.appendChild(root);
    prev = root.querySelector("#ccPrev");

    root.addEventListener("click", function (e) {
      var t = e.target;
      if (t === root || (t.classList && t.classList.contains("cc-x"))) return closeChatColors();
      if (t.classList && t.classList.contains("cc-p")) return setPrev(PRESETS[+t.getAttribute("data-i")].g);
      if (t.classList && t.classList.contains("cc-ok")) {
        if (!valid(cur)) return;
        safeSet(cur); applyChat(cur); return closeChatColors();
      }
      if (t.classList && t.classList.contains("cc-rs")) { safeSet(""); applyChat(""); setPrev("linear-gradient(135deg, #C5A880, #3E2723)"); return closeChatColors(); }
    });
    root.addEventListener("input", function (e) {
      var id = e.target && e.target.id;
      if (id === "ccC1" || id === "ccC2" || id === "ccOp") custom();
    });
    root.querySelector("#ccDir").addEventListener("change", custom);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && root.classList.contains("on")) closeChatColors(); });
  }

  window.openChatColors = function () {
    build();
    var saved = safeGet();
    setPrev(valid(saved) ? saved : "linear-gradient(135deg, #C5A880, #3E2723)");
    root.classList.add("on");
  };
  window.closeChatColors = function () { if (root) root.classList.remove("on"); };

  /* ----- الزر: فوق زر الألعاب ----- */
  /* مهم: settings-default / settings-style بيعلّموا أي عنصر موجود قبل ما يخلصوا بناء بـ rs-old / st-old
     (display:none) — فلازم نستنى لحد ما #rs-wrap أو #st-wrap يتبني، ونشيل العلامات دي لو اتحطت */
  var tries = 0;
  function place() {
    var $ = window.jQuery;
    if (!$) return;
    var $s = $("#settings");
    var $gm = $s.find(".gm-open").first();
    if (!$gm.length) return;
    var designReady = $s.find("#rs-wrap, #st-wrap").length > 0;
    if (!designReady && tries++ < 40) return;      /* ~80 ثانية حد أقصى، وبعدها نحطه حتى لو التصميم ما اتبناش */
    var $b = $("#cc-btn");
    if (!$b.length) {
      css();
      $b = $('<button type="button" id="cc-btn" class="cc-open"><i class="fa fa-paint-brush"></i><span>ألوان الشات</span></button>')
        .on("click", function () { window.openChatColors(); });
    }
    /* نفس كلاس الأزرار المجاورة عشان ياخد نفس القياسات */
    $b.toggleClass("rs-btn", $s.find("#rs-wrap").length > 0 && $s.find("#st-wrap").length === 0)
      .toggleClass("st-pill", $s.find("#st-wrap").length > 0);
    $b.removeClass("rs-old st-old");
    var p = $gm.prev();
    if (!p.length || p.attr("id") !== "cc-btn") $gm.before($b);
  }
  function boot() {
    css();
    applyChat(safeGet());
    place();
    setInterval(function () { if (!document.hidden) place(); }, 1500);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
