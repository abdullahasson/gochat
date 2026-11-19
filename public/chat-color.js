/* ==========================================================
   [ADDED] زر "لون الموقع" تحت زر "حالتي الآن" في الإعدادات (التصميم الافتراضي بس)
   بيفتح نافذة استوديو الألوان (ألوان جاهزة + تدرج خاص + قوة اللون + لمعان) ويغيّر لون الموقع (القوالب والأزرار) عند العضو نفسه، ومحتوى الشات والروم بيفضل افتراضي.
   الحفظ: في المتصفح (localStorage "chatColor") وبيتطبّق تلقائي عند كل دخول. للعضو نفسه بس.
   ملف إضافة مستقل: بيتحمّل بسطر واحد في index.ejs. للإلغاء احذف سطره.
   ========================================================== */
(function () {
  "use strict";
  if (window.__chatColorLoaded) return;
  window.__chatColorLoaded = true;

  var KEY = "chatColor";
  var PRESETS = [
    ["ذهبي ملكي", "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)"],
    ["زمردي داكن", "linear-gradient(135deg, #093028, #237A57)"],
    ["زمردي بحري", "linear-gradient(135deg, #134e5e, #71b280)"],
    ["بني شوكولاتة", "linear-gradient(135deg, #3E2723, #5D4037)"],
    ["بني نحاسي", "linear-gradient(135deg, #4A3000, #B8860B)"],
    ["بيجي ملكي", "linear-gradient(135deg, #D4B996, #EFE3D0)"],
    ["بيجي لاتيه", "linear-gradient(135deg, #C5A880, #F3E5AB)"],
    ["أسود ليلي", "linear-gradient(135deg, #0f0c29, #302b63, #24243e)"],
    ["أرجواني مخملي", "linear-gradient(135deg, #4b134f, #c57b57)"],
    ["ياقوتي أحمر", "linear-gradient(135deg, #610404, #C0392B)"],
    ["فضي معدني", "linear-gradient(135deg, #bdc3c7, #2c3e50)"],
    ["رخامي رمادي", "linear-gradient(135deg, #E0E0E0, #9E9E9E, #616161)"]
  ];
  var DEF = "linear-gradient(135deg, #C5A880, #3E2723)";

  /* ----- الحالة المحفوظة ----- */
  function load() {
    try {
      var o = JSON.parse(localStorage.getItem(KEY) || "null");
      if (o && typeof o.bg === "string" && o.bg.indexOf("linear-gradient(") === 0 && !/[;{}<>]/.test(o.bg)) return { bg: o.bg, shine: !!o.shine };
    } catch (e) {}
    return null;
  }
  function save(o) { try { if (o) localStorage.setItem(KEY, JSON.stringify(o)); else localStorage.removeItem(KEY); } catch (e) {} }

  var cur = load() || { bg: DEF, shine: false };   /* اللي في النافذة حالياً */

  /* ----- تطبيق اللون على لون الموقع: القوالب + الأزرار + الشريط العلوي والسفلي (التصميم الافتراضي) ----- */
  /* 1) نفس عناصر "لون الموقع" بتاعة لوحة التحكم / لوني الشخصي: الأزرار (.label-primary/.btn-primary/.bg-primary + المايكات) والقوالب (.bg + هيدر النوافذ) */
  var SEL_SITE = [
    "body .label-primary", "body .btn-primary", "body .bg-primary", "body .label-primary:hover", "body .btn-primary:hover", "body .btn-primary:focus",
    "body #mic .mic", "body #muteall", "body .bg", "body .fl.nosel.label.pnhead"
  ];
  /* 2) العناصر اللي لونها ثابت في room-style.css وبيتغيّر من bars-site-color.js (الشريط العلوي/السفلي، شارات الانضمام، هيدر وأزرار الإعدادات، أزرار العودة) */
  var BTNF = '>.tablebox.footer>.btn:not([style*="display: none"])';
  var SEL_BARS = [
    "body:not(.nb) .broadcasters", "body:not(.nb) #d0", "body:not(.nb) #d0 .ae",
    "body:not(.nb) .hmsg .roomh", "body:not(.nb) #d2 .roomh",
    "#rs-wrap .rs-lb", "#rs-wrap select.rs-sel", "#dpnl:has(#settings.active)>.pnhead",
    "#othpage .og-back", "body.ul #othpage .og-back", "#top10 .wt-back", "#wtrend .wr-back", ".xs-back",
    "body:not(.nb) #room" + BTNF, "body:not(.nb) .cont" + BTNF
  ].map(function (x) { return "html:root " + x; });
  var SHINE_G = "linear-gradient(60deg, transparent 30%, rgba(255,255,255,.35) 50%, transparent 70%)";

  function firstColor(bg) {
    var m = String(bg).match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)/);
    return m ? m[0] : "#0b462c";
  }

  function applyChat(o) {
    /* كل مرة نمسح الـ style القديم وننشئ واحد جديد: ده اللي بينبّه bars-site-color.js يعيد قراءة لون الموقع */
    var old = document.getElementById("cc-apply");
    if (old) old.parentNode.removeChild(old);
    if (!o) return;
    var st = document.createElement("style");
    st.id = "cc-apply";
    var img = o.shine ? SHINE_G + ", " + o.bg : o.bg;
    /* background-color = أول لون في التدرج (عشان أي كود بيقرا لون الموقع يتبعه) */
    var rule = "{background-color:" + firstColor(o.bg) + "!important;background-image:" + img + "!important;" +
      (o.shine ? "background-size:300% 100%,100% 100%!important;background-repeat:no-repeat!important;background-position:100% 0,0 0;animation:ccShine 3s linear infinite;" : "") + "}";
    st.textContent = SEL_SITE.join(",") + rule + SEL_BARS.join(",") + rule +
      "@keyframes ccShine{from{background-position:100% 0,0 0}to{background-position:0% 0,0 0}}";
    document.head.appendChild(st);
  }

  function hexToRgba(hex, a) {
    return "rgba(" + parseInt(hex.slice(1, 3), 16) + ", " + parseInt(hex.slice(3, 5), 16) + ", " + parseInt(hex.slice(5, 7), 16) + ", " + a + ")";
  }

  /* ----- الستايل ----- */
  function addCss() {
    if (document.getElementById("cc-css")) return;
    var F = "font-family:Cairo,Tajawal,Tahoma,sans-serif!important;";
    var css = [
      /* الزر (نفس شكل زر الحالة) */
      "#cc-wrap{display:flex!important;flex-direction:row-reverse;direction:rtl;float:none!important;clear:both;width:calc(100% - 8px)!important;max-width:380px;height:38px;margin:6px auto 0!important;padding:0!important;border:1px solid #333;background:#fff;border-radius:2px;overflow:hidden;box-shadow:0 2px 5px rgba(0,0,0,.1);box-sizing:border-box;cursor:pointer;" + F + "}",
      "#cc-wrap *{box-sizing:border-box;" + F + "}",
      "#cc-wrap .cc-title{background:#0b462c;color:#fff;padding:8px 16px;font-size:14px!important;font-weight:800!important;display:flex;align-items:center;justify-content:center;border-right:1px solid #333;white-space:nowrap;min-width:110px}",
      "#cc-wrap .cc-select{flex:1;min-width:0;background:#fff;color:#000;padding:8px 14px;font-size:14px!important;font-weight:700!important;display:flex;align-items:center;justify-content:space-between;user-select:none;-webkit-user-select:none}",
      "#cc-wrap .cc-select:hover{background:#f9f9f9}",
      "#cc-wrap .cc-sw{display:inline-block;width:46px;height:18px;border:1px solid #888;border-radius:4px;background:" + DEF + "}",
      "#cc-wrap .cc-ar{width:13px;height:13px;color:#555}",

      /* النافذة (نفس مقاسات وألوان الكود المرجعي) */
      "#cc-modal{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.6);display:none;justify-content:center;align-items:center;padding:20px;z-index:2147483000;direction:rtl;overflow-y:auto;font-family:Cairo,Tajawal,Tahoma,sans-serif!important}",
      "#cc-modal *{box-sizing:border-box;font-family:Cairo,Tajawal,Tahoma,sans-serif!important}",
      "#cc-modal .cc-box{background:#1e293b;color:#f8fafc;width:100%;max-width:520px;max-height:100%;overflow-y:auto;padding:28px;border-radius:16px;border:1px solid #334155;box-shadow:0 10px 25px rgba(0,0,0,.4);margin:auto}",
      "#cc-modal .cc-title2{text-align:center;color:#38bdf8;font-size:22px!important;font-weight:700!important;margin:0 0 24px!important;padding:0!important;background:none!important;border:0!important}",
      "#cc-modal .cc-sec{margin-bottom:20px}",
      "#cc-modal .cc-lb{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:14px!important;font-weight:600!important;color:#cbd5e1}",
      "#cc-modal .cc-hint{color:#38bdf8;font-size:12px!important}",
      "#cc-modal .cc-presets{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;max-height:180px;overflow-y:auto;padding:8px;background:#0f172a;border:1px solid #334155;border-radius:10px}",
      "#cc-modal .cc-presets::-webkit-scrollbar{width:6px}",
      "#cc-modal .cc-presets::-webkit-scrollbar-thumb{background:#475569;border-radius:4px}",
      "#cc-modal .cc-pb{height:42px!important;width:100%!important;min-width:0;border:2px solid #475569!important;border-radius:8px!important;cursor:pointer;padding:0!important;margin:0!important;transition:transform .2s ease,border-color .2s ease}",
      "#cc-modal .cc-pb:hover{transform:scale(1.05);border-color:#38bdf8!important}",
      "#cc-modal .cc-row{display:flex;gap:10px;align-items:center}",
      "#cc-modal input[type=color]{-webkit-appearance:none;appearance:none;width:48px!important;height:40px!important;border:none!important;background:none!important;cursor:pointer;padding:0!important;margin:0!important}",
      "#cc-modal input[type=color]::-webkit-color-swatch-wrapper{padding:0}",
      "#cc-modal input[type=color]::-webkit-color-swatch{border:2px solid #475569;border-radius:8px}",
      "#cc-modal select{flex:1;height:40px!important;padding:0 12px!important;margin:0!important;background:#0f172a!important;color:#fff!important;border:1px solid #475569!important;border-radius:8px!important;font-size:14px!important;cursor:pointer;outline:none;width:auto!important}",
      "#cc-modal input[type=range]{width:100%!important;height:6px!important;background:#0f172a!important;border-radius:3px;outline:none;-webkit-appearance:none;appearance:none;border:1px solid #475569!important;cursor:pointer;padding:0!important;margin:0!important}",
      "#cc-modal input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;background:#38bdf8;border-radius:50%;cursor:pointer}",
      "#cc-modal .cc-shine{display:flex;align-items:center;justify-content:space-between;background:#0f172a;padding:10px 14px;border-radius:8px;border:1px solid #475569;margin-top:10px;cursor:pointer;font-size:14px!important}",
      "#cc-modal .cc-shine input{width:18px!important;height:18px!important;accent-color:#38bdf8;cursor:pointer;margin:0!important}",
      "#cc-modal .cc-prev{position:relative;height:110px;display:flex;align-items:center;justify-content:center;font-size:17px!important;font-weight:700!important;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,.6);border:2px dashed #475569;border-radius:12px;overflow:hidden;transition:background .3s ease}",
      "#cc-modal .cc-prev.cc-has-shine::after{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:linear-gradient(60deg,transparent 30%,rgba(255,255,255,.35) 50%,transparent 70%);animation:ccPrev 2.5s infinite}",
      "@keyframes ccPrev{0%{transform:translateX(-100%) translateY(-100%)}100%{transform:translateX(100%) translateY(100%)}}",
      "#cc-modal .cc-ok{display:block;width:100%!important;height:44px!important;margin:8px 0 0!important;padding:0!important;background:#0284c7!important;color:#fff!important;border:none!important;border-radius:8px!important;font-size:15px!important;font-weight:700!important;cursor:pointer;transition:background-color .2s ease}",
      "#cc-modal .cc-ok:hover{background:#0369a1!important}",
      "#cc-modal .cc-rs{display:block;margin:10px auto 0;background:none!important;border:none!important;color:#94a3b8!important;font-size:12px!important;cursor:pointer;text-decoration:underline;padding:0!important}"
    ].join("\n");
    var st = document.createElement("style");
    st.id = "cc-css";
    st.textContent = css;
    document.head.appendChild(st);
  }

  /* ----- النافذة ----- */
  function buildModal() {
    var $ = window.jQuery;
    if ($("#cc-modal").length) return;
    var pre = PRESETS.map(function (p, i) {
      return '<button type="button" class="cc-pb" data-i="' + i + '" title="' + p[0] + '" style="background:' + p[1] + '"></button>';
    }).join("");
    var $m = $(
      '<div id="cc-modal"><div class="cc-box">' +
        '<h2 class="cc-title2">استوديو الألوان الفاخرة</h2>' +
        '<div class="cc-sec"><div class="cc-lb">اختر من الألوان الفاخرة الجاهزة:</div><div class="cc-presets">' + pre + '</div></div>' +
        '<div class="cc-sec"><div class="cc-lb">تصميم تدرج خاص:</div>' +
          '<div class="cc-row"><input type="color" id="cc-c1" value="#C5A880"><input type="color" id="cc-c2" value="#3E2723">' +
          '<select id="cc-dir"><option value="135deg">زاوية مائلة (135°)</option><option value="to right">من اليسار إلى اليمين</option><option value="to bottom">من الأعلى إلى الأسفل</option></select></div>' +
          '<div class="cc-lb" style="margin-top:22px;margin-bottom:4px"><span>قوة / شفافية اللون:</span><span id="cc-opv" class="cc-hint">100%</span></div>' +
          '<input type="range" id="cc-op" min="0.1" max="1" step="0.05" value="1">' +
          '<label class="cc-shine"><span>تفعيل تأثير اللمعان الفاخر ✨</span><input type="checkbox" id="cc-sh"></label>' +
        '</div>' +
        '<div class="cc-sec"><div class="cc-lb">معاينة اللون:</div><div id="cc-pv" class="cc-prev">معاينة اللون الخاص</div></div>' +
        '<button type="button" class="cc-ok">اعتماد وتطبيق اللون</button><button type="button" class="cc-rs">رجوع للون الافتراضي</button>' +
      '</div></div>'
    );
    $("body").append($m);

    function preview() {
      var pv = document.getElementById("cc-pv");
      pv.style.background = cur.bg;
      pv.classList.toggle("cc-has-shine", !!cur.shine);
    }
    function custom() {
      var op = $("#cc-op").val();
      $("#cc-opv").text(Math.round(op * 100) + "%");
      cur.bg = "linear-gradient(" + $("#cc-dir").val() + ", " + hexToRgba($("#cc-c1").val(), op) + ", " + hexToRgba($("#cc-c2").val(), op) + ")";
      preview();
    }
    $m.on("click", ".cc-pb", function () { cur.bg = PRESETS[+$(this).attr("data-i")][1]; preview(); });
    $m.on("input change", "#cc-c1,#cc-c2,#cc-dir,#cc-op", custom);
    $m.on("change", "#cc-sh", function () { cur.shine = this.checked; preview(); });
    $m.on("click", function (e) { if (e.target === this) toggle(false); });
    $m.on("click", ".cc-ok", function () {
      var o = { bg: cur.bg, shine: !!cur.shine };
      save(o); applyChat(o); refreshSwatch(); toggle(false);
    });
    $m.on("click", ".cc-rs", function () {
      save(null); applyChat(null);
      cur = { bg: DEF, shine: false };
      $("#cc-sh").prop("checked", false);
      preview(); refreshSwatch();
    });
    m_preview = preview;
  }
  var m_preview = function () {};

  function toggle(show) {
    var $ = window.jQuery;
    if (show) {
      cur = load() || { bg: DEF, shine: false };
      $("#cc-sh").prop("checked", !!cur.shine);
      m_preview();
    }
    $("#cc-modal").css("display", show ? "flex" : "none");
  }

  function refreshSwatch() {
    var s = load();
    var el = document.querySelector("#cc-wrap .cc-sw");
    if (el) el.style.background = s ? s.bg : DEF;
  }

  /* ----- الزر ----- */
  function buildButton($after) {
    var $ = window.jQuery;
    var $w = $(
      '<div id="cc-wrap" role="button" aria-label="لون الموقع">' +
        '<div class="cc-title">لون الموقع</div>' +
        '<div class="cc-select"><span class="cc-sw"></span>' +
        '<svg class="cc-ar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9l7 7 7-7"/></svg></div>' +
      '</div>'
    );
    $w.on("click", function (e) { e.stopPropagation(); toggle(true); });
    $after.after($w);
    refreshSwatch();
  }

  /* ----- التركيب: التصميم الافتراضي بس (#rs-wrap) وبعد زر الحالة ----- */
  var tries = 0;
  function build() {
    var $ = window.jQuery;
    if (!$) return setTimeout(build, 200);
    var $s = $("#settings");
    var isDefault = $s.find("#rs-wrap").length > 0 && !$s.find("#st-wrap").length;
    var $us = $("#us-wrap");
    if (!isDefault || !$us.length) { if (tries++ < 60) return setTimeout(build, 300); return watch(); }
    if ($("#cc-wrap").length) return watch();
    addCss(); buildModal(); buildButton($us);
    watch();
  }

  /* لو الإعدادات اتبنت من جديد أو زر الحالة اتحرّك نرجّع الزر تحت زر الحالة */
  var watching = false;
  function watch() {
    if (watching) return;
    watching = true;
    setInterval(function () {
      var $ = window.jQuery;
      var $s = $("#settings");
      var isDefault = $s.find("#rs-wrap").length > 0 && !$s.find("#st-wrap").length;
      var $us = $("#us-wrap");
      if (!isDefault || !$us.length) return;
      if (!$("#cc-wrap").length) { addCss(); buildModal(); buildButton($us); }
      else if ($us.next().attr("id") !== "cc-wrap") $us.after($("#cc-wrap"));
    }, 2000);
  }

  /* تطبيق اللون المحفوظ فوراً عند التحميل */
  var saved = load();
  if (saved) applyChat(saved);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
