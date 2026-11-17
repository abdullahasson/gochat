/* ==========================================================
   [ADDED] زر "حالتي الآن" في الإعدادات (تحت زر الألعاب) + ظهور الحالة في قايمة المتصلين
   شغّال في التصميمين: الافتراضي (البني) و Nopta.1.0 (الكحلي)
   الحالات: بدون حالة / متاح / مشغول / صلاة / مكالمة / بالخارج — لكل حالة أيقونة ولون.
   الزر: مربع أخضر "حالتي الآن" + مربع أبيض فيه الحالة الحالية وسهم، والضغط يفتح نافذة اختيار (راديو) + "حفظ التغيير".
   الحفظ: رقم الحالة (0..5) بيتخزّن في المتصفح (localStorage "myStatus") وبيتبعت للسيرفر
          بالأمر SEND_EVENT_EMIT_MYSTATUS، والسيرفر بيبثّه للكل في الحقل ust (u^).
   العرض: شارة صغيرة (أيقونة + اسم الحالة) جنب اسم العضو في صفه بقايمة المتصلين وتبويب الخاص.
   ملف إضافة مستقل: بيغلّف updateu بس من غير ما يغيّر فيها. للإلغاء احذف سطره من index.ejs.
   ========================================================== */
(function () {
  "use strict";
  if (window.__userStatusLoaded) return;
  window.__userStatusLoaded = true;

  var KEY = "myStatus";

  /* ----- أيقونات SVG للحالات اللي مالهاش أيقونة في FontAwesome 4.5 ----- */
  var SVG_NONE = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="9.5" r="3"/><path d="M6.5 18.5c1.2-2.6 3.1-3.8 5.5-3.8s4.3 1.2 5.5 3.8"/></svg>';
  var SVG_MOSQUE = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><circle cx="12" cy="2.2" r="1"/><path d="M12 3.6c-3 1.9-5 4-5 6.7V12h10v-1.7c0-2.7-2-4.8-5-6.7z"/><rect x="5" y="12" width="14" height="8"/><rect x="2" y="7" width="2.4" height="13"/><rect x="19.6" y="7" width="2.4" height="13"/><rect x="1" y="20" width="22" height="2"/></svg>';

  /* ----- الحالات (k = الرقم اللي بيتخزّن ويتبعت للسيرفر) ----- */
  var ST = [
    { k: 0, n: "بدون حالة", c: "#888888", ic: "svg:none" },
    { k: 1, n: "متاح",      c: "#2ecc71", ic: "fa-check-circle" },
    { k: 2, n: "مشغول",     c: "#e74c3c", ic: "fa-minus-circle" },
    { k: 3, n: "صلاة",      c: "#d4af37", ic: "svg:mosque" },
    { k: 4, n: "مكالمة",    c: "#3498db", ic: "fa-phone" },
    { k: 5, n: "بالخارج",   c: "#95a5a6", ic: "fa-sign-out" }
  ];

  function iconHtml(s) {
    if (s.ic === "svg:none") return '<span class="us-ic" style="color:' + s.c + '">' + SVG_NONE + "</span>";
    if (s.ic === "svg:mosque") return '<span class="us-ic" style="color:' + s.c + '">' + SVG_MOSQUE + "</span>";
    return '<span class="us-ic" style="color:' + s.c + '"><i class="fa ' + s.ic + '"></i></span>';
  }

  /* ----- ألوان مساعدة للشارة ----- */
  function rgb(h) { h = h.replace("#", ""); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function rgba(h, a) { var c = rgb(h); return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }
  function dark(h, p) { var c = rgb(h); return "rgb(" + Math.round(c[0] * (1 - p)) + "," + Math.round(c[1] * (1 - p)) + "," + Math.round(c[2] * (1 - p)) + ")"; }

  /* ----- الحالة المحفوظة ----- */
  function saved() {
    try {
      var v = parseInt(localStorage.getItem(KEY), 10);
      return v >= 0 && v <= 5 ? v : 0;
    } catch (e) { return 0; }
  }
  function store(n) { try { localStorage.setItem(KEY, String(n)); } catch (e) {} }

  var picked = 0;
  var lastSend = 0;
  var tries = 0;

  /* ----- إرسال الحالة للسيرفر ----- */
  function send(n) {
    try {
      if (typeof window.SEND_EVENT_EMIT === "function") window.SEND_EVENT_EMIT("SEND_EVENT_EMIT_MYSTATUS", { s: n });
    } catch (e) {}
  }

  /* ----- الستايل (نفس ألوان وشكل زر الحالة المرجعي) ----- */
  function addCss() {
    if (document.getElementById("us-css")) return;
    try {
      if (!document.querySelector('link[href*="family=Tajawal"]')) {
        var fl = document.createElement("link");
        fl.rel = "stylesheet";
        fl.href = "https://fonts.googleapis.com/css2?family=Tajawal:wght@500;700;800&display=swap";
        document.head.appendChild(fl);
      }
    } catch (e) {}

    var F = "font-family:Tajawal,Cairo,Tahoma,sans-serif!important;";
    var css = [
      /* الزر (اتجاه معكوس زي الكود المرجعي) */
      "#us-wrap{display:flex!important;flex-direction:row-reverse;direction:rtl;float:none!important;clear:both;width:calc(100% - 8px)!important;max-width:380px;height:38px;margin:6px auto 0!important;padding:0!important;border:1px solid #333;background:#fff;border-radius:2px;overflow:hidden;box-shadow:0 2px 5px rgba(0,0,0,.1);box-sizing:border-box;" + F + "}",
      "#us-wrap *{box-sizing:border-box;" + F + "}",
      "#us-wrap .us-title{background:#0b462c;color:#fff;padding:8px 16px;font-size:14px!important;font-weight:800!important;display:flex;align-items:center;justify-content:center;border-right:1px solid #333;white-space:nowrap;min-width:110px}",
      "#us-wrap .us-select{flex:1;min-width:0;background:#fff;color:#000;padding:8px 14px;font-size:14px!important;font-weight:700!important;display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none;-webkit-user-select:none;transition:background .2s}",
      "#us-wrap .us-select:hover{background:#f9f9f9}",
      "#us-wrap .us-select>.fa{font-size:13px!important;color:#555;font-family:FontAwesome!important}",
      "#us-wrap .us-cur{display:flex;align-items:center;gap:8px;overflow:hidden;white-space:nowrap}",

      /* الأيقونات */
      ".us-ic{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;font-size:16px;line-height:1}",
      ".us-ic svg{display:block;width:1em;height:1em}",
      ".us-ic .fa{font-size:inherit!important;font-family:FontAwesome!important;color:inherit}",

      /* النافذة المنبثقة */
      "#us-modal{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.55);display:none;justify-content:center;align-items:center;z-index:2147483000;direction:rtl;-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);" + F + "}",
      "#us-modal *{box-sizing:border-box;" + F + "}",
      "#us-modal .us-box{background:#fff;width:92%;max-width:300px;max-height:86vh;display:flex;flex-direction:column;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,.3);overflow:hidden;animation:usPop .2s ease-out}",
      "@keyframes usPop{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}",
      "#us-modal .us-hd{background:#0b462c;color:#ffdf73;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;font-size:13.5px!important;font-weight:800!important;border-bottom:2px solid #d4af37}",
      "#us-modal .us-hd span{font-size:13.5px!important;font-weight:800!important;color:#ffdf73}",
      "#us-modal .us-x{background:none!important;border:none!important;color:#fff!important;font-size:15px!important;cursor:pointer;padding:0 2px!important;margin:0!important;width:auto!important;height:auto!important;box-shadow:none!important}",
      "#us-modal .us-x .fa{font-size:15px!important;color:#fff;font-family:FontAwesome!important}",
      "#us-modal .us-list{list-style:none;margin:0;padding:4px 0;overflow-y:auto;flex:1 1 auto}",
      "#us-modal .us-item{display:flex;align-items:center;justify-content:space-between;padding:11px 16px;border-bottom:1px solid #f0f0f0;cursor:pointer;transition:background .2s;margin:0;background:#fff}",
      "#us-modal .us-item:last-child{border-bottom:none}",
      "#us-modal .us-item:hover{background:#f8fbf9}",
      "#us-modal .us-lb{display:flex;align-items:center;gap:10px;font-size:13px!important;font-weight:700!important;color:#333}",
      "#us-modal .us-lb span.us-nm{font-size:13px!important;font-weight:700!important;color:#333}",
      "#us-modal .us-radio{width:17px;height:17px;flex:0 0 17px;border:2px solid #ccc;border-radius:50%;display:flex;align-items:center;justify-content:center}",
      "#us-modal .us-item.selected .us-radio{border-color:#0b462c}",
      "#us-modal .us-item.selected .us-radio::after{content:'';width:9px;height:9px;background:#0b462c;border-radius:50%}",
      "#us-modal .us-ft{padding:8px 14px;background:#fafafa;border-top:1px solid #eee}",
      "#us-modal .us-save{width:100%!important;height:auto!important;background:#0b462c!important;color:#fff!important;border:none!important;padding:8px!important;margin:0!important;border-radius:6px!important;font-size:12.5px!important;font-weight:700!important;cursor:pointer;float:none!important}",

      /* شارة الحالة جنب اسم العضو في قايمة المتصلين */
      ".uhtml .di2>.d-flex>.flex-grow-1{min-width:0}",
      ".us-bd{display:inline-flex!important;align-items:center;gap:3px;flex:0 0 auto;height:18px;margin:0 4px;padding:0 6px 0 7px;border-radius:9px;border:1px solid transparent;white-space:nowrap;line-height:1!important;" + F + "}",
      ".us-bd .us-ic{font-size:11px}",
      ".us-bd b{font-size:11px!important;font-weight:700!important;line-height:1!important;color:inherit;" + F + "}"
    ].join("\n");

    var st = document.createElement("style");
    st.id = "us-css";
    st.textContent = css;
    document.head.appendChild(st);
  }

  /* ----- النافذة ----- */
  function buildModal() {
    var $ = window.jQuery;
    if ($("#us-modal").length) return;
    var items = ST.map(function (s) {
      return '<li class="us-item" data-k="' + s.k + '"><div class="us-lb">' + iconHtml(s) + '<span class="us-nm">' + s.n + '</span></div><div class="us-radio"></div></li>';
    }).join("");
    var $m = $(
      '<div id="us-modal"><div class="us-box">' +
        '<div class="us-hd"><span>تحديد الحالة</span><button type="button" class="us-x" aria-label="إغلاق"><i class="fa fa-times"></i></button></div>' +
        '<ul class="us-list">' + items + '</ul>' +
        '<div class="us-ft"><button type="button" class="us-save">حفظ التغيير</button></div>' +
      '</div></div>'
    );
    $("body").append($m);

    $m.on("click", ".us-item", function () {
      picked = parseInt($(this).attr("data-k"), 10) || 0;
      $m.find(".us-item").removeClass("selected");
      $(this).addClass("selected");
    });
    $m.on("click", ".us-x", function () { toggle(false); });
    $m.on("click", function (e) { if (e.target === this) toggle(false); });
    $m.on("click", ".us-save", function () {
      store(picked);
      lastSend = Date.now();
      send(picked);
      refreshText();
      /* تحديث فوري محلي لصفّي لحد ما يرجع بث السيرفر */
      try { if (typeof M_ID !== "undefined" && typeof U_CASH !== "undefined" && U_CASH[M_ID]) { U_CASH[M_ID].ust = picked; decorate(M_ID, U_CASH[M_ID]); } } catch (e) {}
      toggle(false);
    });
  }

  function toggle(show) {
    var $ = window.jQuery;
    var $m = $("#us-modal");
    if (show) {
      picked = saved();
      $m.find(".us-item").removeClass("selected");
      $m.find('.us-item[data-k="' + picked + '"]').addClass("selected");
    }
    $m.css("display", show ? "flex" : "none");
  }

  function refreshText() {
    var $ = window.jQuery;
    var s = ST[saved()];
    $("#us-cur").html(iconHtml(s) + "<span>" + s.n + "</span>");
  }

  /* ----- الزر نفسه ----- */
  function buildButton($gm) {
    var $ = window.jQuery;
    var $w = $(
      '<div id="us-wrap" role="button" aria-label="حالتي الآن">' +
        '<div class="us-title">حالتي الآن</div>' +
        '<div class="us-select">' +
          '<span id="us-cur" class="us-cur"></span>' +
          '<i class="fa fa-chevron-down"></i>' +
        '</div>' +
      '</div>'
    );
    $w.on("click", ".us-select", function (e) { e.stopPropagation(); toggle(true); });
    $gm.after($w);
    refreshText();
  }

  /* ----- شارة الحالة في صف العضو ----- */
  var cache = {};   /* آخر حالة معروفة لكل عضو (لو اتبدّل كائن العضو بنسخة من غير الحقل ust) */

  function ustOf(id, u) {
    try {
      /* حالتي أنا: المصدر الأساسي هو المتصفح بتاعي، فمفيش حاجة تخفّيها */
      if (typeof M_ID !== "undefined" && id == M_ID) return saved();
    } catch (e) {}
    if (u && u.ust !== undefined && u.ust !== null) { cache[id] = u.ust | 0; return cache[id]; }
    return cache[id] | 0;
  }

  function decorateRow(row, id, u) {
    try {
      var line = row.querySelector(".di2>.d-flex");
      if (!line) return;
      var s = ST[ustOf(id, u)];
      var bd = line.querySelector(".us-bd");
      /* من غير حالة أو عضو متخفّي = من غير شارة */
      if (!s || !s.k || (u && u.s)) { if (bd) bd.parentNode.removeChild(bd); return; }
      if (!bd) {
        bd = document.createElement("span");
        bd.className = "us-bd";
        line.appendChild(bd);
      }
      if (bd.__k !== s.k) {
        bd.__k = s.k;
        bd.title = s.n;
        bd.style.color = dark(s.c, 0.3);
        bd.style.background = rgba(s.c, 0.16);
        bd.style.borderColor = rgba(s.c, 0.55);
        bd.innerHTML = iconHtml(s).replace(/style="color:[^"]*"/, "") + "<b>" + s.n + "</b>";
      }
    } catch (e) {}
  }

  function decorate(id, u) {
    try {
      var uu = u || (typeof U_CASH !== "undefined" ? U_CASH[id] : null);
      if (!uu) return;
      var uh = window.VLIST ? window.VLIST.rowOf(id) : (typeof U_X !== "undefined" ? U_X[id] : null);
      if (!uh || !uh[0]) return;
      decorateRow(uh[0], id, uu);
    } catch (e) {}
  }

  /* صيانة خفيفة: أي صف ظاهر اتعاد بناؤه أو اتمسحت منه الشارة بأي كود تاني نرجّعها (حوالي 40 صف بس)
     [FIX-C20/P2] كانت تعمل كل ثانية للأبد حتى ولوحة المتصلين مغلقة والصفحة
     خلفية — الآن: تنفّذ فقط عندما يكون تبويب المتصلين ظاهرًا فعليًا والصفحة
     نشطة، بالإضافة إلى مرور فوري واحد لحظة فتح التبويب (وهو اللحظة الوحيدة
     التي يراها المستخدم أصلًا). التغليف حول updateu (أعلاه) يزين كل صف لحظة
     تعبئته فعلًا — الدورية مجرد صمام أمان. */
  function healOnce() {
    try {
      if (typeof U_CASH === "undefined") return;
      var rows = document.querySelectorAll(".vlzrow");
      for (var i = 0; i < rows.length; i++) {
        var id = rows[i].__uid;
        if (id == null || !U_CASH[id]) continue;
        decorateRow(rows[i], id, U_CASH[id]);
      }
    } catch (e) {}
  }
  function heal() {
    setInterval(function () {
      if (document.hidden) return;
      var usr = document.getElementById("users");
      var pnl = document.getElementById("dpnl");
      if (!usr || !pnl || pnl.style.display === "none" || !usr.classList.contains("active")) return;
      healOnce();
    }, 1000);
    /* مرة واحدة عند فتح تبويب المتصلين — استعادة فورية بدل انتظار الدورة */
    jQuery(document).on("shown.bs.tab", 'a[data-target="#users"]', function () {
      setTimeout(healOnce, 60);
    });
  }

  /* نغلّف updateu (بتتنادى من vlist.js وx2.js) من غير ما نغيّر فيها */
  function hook() {
    if (typeof window.updateu !== "function") return setTimeout(hook, 300);
    if (window.updateu.__us) return;
    var orig = window.updateu;
    var wrapped = function (id, u) {
      var r = orig.apply(this, arguments);
      decorate(id, u);
      return r;
    };
    /* نحافظ على علامات الأغلفة التانية (uhide / nfont / profile-cover بتعتمد عليها) */
    try { Object.keys(orig).forEach(function (k) { if (k.indexOf("__") === 0) wrapped[k] = orig[k]; }); } catch (e) {}
    wrapped.__us = 1;
    window.updateu = wrapped;
  }

  /* لو السيرفر مش عارف حالتي (دخول جديد / إعادة اتصال) نبعتها تاني */
  function syncMine() {
    setInterval(function () {
      try {
        if (typeof M_ID === "undefined" || !M_ID || typeof U_CASH === "undefined" || !U_CASH[M_ID]) return;
        var want = saved();
        if ((U_CASH[M_ID].ust | 0) !== want && Date.now() - lastSend > 2500) {
          lastSend = Date.now();
          send(want);
        }
      } catch (e) {}
    }, 2000);
  }

  /* ----- التركيب: ننتظر لحد ما التصميم (الافتراضي أو Nopta) يخلّص ترتيب الإعدادات ----- */
  function build() {
    var $ = window.jQuery;
    if (!$) return setTimeout(build, 200);
    var $s = $("#settings");
    var $gm = $s.find(".gm-open").first();
    var designReady = $s.find("#rs-wrap, #st-wrap").length > 0;
    if (!$gm.length || (!designReady && tries++ < 50)) return setTimeout(build, 200);
    if ($("#us-wrap").length) return;
    addCss();
    buildModal();
    buildButton($gm);
    watch();
  }

  /* لو الإعدادات اتبنت من جديد نرجّع الزر تحت الألعاب */
  var watching = false;
  function watch() {
    if (watching) return;
    watching = true;
    setInterval(function () {
      var $ = window.jQuery;
      var $gm = $("#settings .gm-open").first();
      if ($gm.length && !$("#us-wrap").length) buildButton($gm);
      else if ($gm.length && $gm.next().attr("id") !== "us-wrap") $gm.after($("#us-wrap"));
    }, 3000);
  }

  hook();
  syncMine();
  heal();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { addCss(); build(); });
  else { addCss(); build(); }
})();
