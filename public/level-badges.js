/*
 * [LEVEL-BADGES] أيقونات الليفل + شريحة النقاط في نافذة البروفايل (#upro)
 *  - كل 1000 نقطة = ليفل جديد (ليفل 1 من أول نقطة، ليفل 2 عند 1000، ... ليفل 5 عند 4000)
 *  - الأيقونات المفتوحة بألوانها، والمقفلة بغلاف أبيض باهت (CSS في level-badges.css)
 *  - x2.js بينادي LV_ONPROFILE(id) داخل upro() (سطر واحد جنب PC_ONPROFILE)
 *  - لتغيير الإعدادات: عرّف window.LV_CONFIG قبل تحميل الملف:
 *      { step: 1000, levels: 5, onlyCurrent: false }
 *    onlyCurrent:true => يظهر الليفل الحالي فقط ملوّن، وباقي الأيقونات مقفلة
 */
(function () {
  var cfg = window.LV_CONFIG || {};
  var STEP = +cfg.step > 0 ? +cfg.step : 1000;
  var COUNT = +cfg.levels > 0 ? Math.min(+cfg.levels, 5) : 5;
  var ONLY_CURRENT = !!cfg.onlyCurrent;
  var IMG = "imgs/levels/lv";
  var IMG_V = "?2"; /* كاش الصور: غيّر الرقم لو استبدلت الأيقونات */
  var current = null;

  function $m() { return $("#upro"); }

  function pointsOf(u) {
    var p = u ? parseInt(u.evaluation, 10) : 0;
    return isFinite(p) && p > 0 ? p : 0;
  }

  /* الليفل الحالي: 1 من الصفر، +1 لكل STEP نقطة، حد أقصى COUNT */
  function levelOf(pts) {
    return Math.min(COUNT, Math.floor(pts / STEP) + 1);
  }

  function fmt(n) {
    try { return Number(n).toLocaleString("en-US"); } catch (e) { return String(n); }
  }

  function ensure() {
    var $p = $m();
    if (!$p.find(".lv-row").length) {
      var row = $('<div class="lv-row"></div>');
      for (var i = 1; i <= COUNT; i++) {
        row.append(
          $('<div class="lv-b off" data-lv="' + i + '"></div>').append(
            $('<img alt="Level ' + i + '" draggable="false">').attr("src", IMG + i + ".webp" + IMG_V)
          )
        );
      }
      var chip = $('<div class="lv-pts"><i class="fa fa-star"></i><span class="lv-n">0</span></div>');
      var $wrap = $p.find(".pc-wrap").first();
      if ($wrap.length) { $wrap.after(row); row.after(chip); }
      else { $p.find(".pro center").first().prepend(chip).prepend(row); }
    }
  }

  function render(id) {
    var u = typeof U_CASH !== "undefined" ? U_CASH[id] : null;
    if (!u) return;
    ensure();
    var $p = $m();
    var pts = pointsOf(u);
    var lvl = levelOf(pts);
    $p.find(".lv-b").each(function () {
      var n = +$(this).attr("data-lv");
      var on = ONLY_CURRENT ? n === lvl : n <= lvl;
      $(this).toggleClass("on", on).toggleClass("off", !on)
        .attr("title", "Level " + n + (n > 1 ? " — من " + fmt((n - 1) * STEP) + " نقطة" : ""));
    });
    $p.find(".lv-pts .lv-n").text(fmt(pts));

    /* أزرار التحدي: مخفية على بروفايلك أنت */
    var own = typeof M_ID !== "undefined" && id == M_ID;
    $p.find(".uxo,.uludo").toggleClass("lv-hide", !!own);

    /* لون زر الغرفة = لون الهيدر الحالي (أي ثيم) */
    try {
      var hc = window.getComputedStyle($p.find(".pc-head")[0]).backgroundColor;
      if (hc && hc !== "rgba(0, 0, 0, 0)") $p[0].style.setProperty("--lv-theme", hc);
    } catch (e) {}
  }

  /* زر تحدي Ludo: لو عرّفت window.LUDO_CHALLENGE(targetId) لما تجهز اللعبة هيتنادى،
     وإلا يظهر تنبيه "قريباً" بدون إرسال أي شيء للسيرفر */
  function toast(msg) {
    var t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:100000;padding:9px 16px;border-radius:18px;background:rgba(0,0,0,.82);color:#fff;font-size:14px;direction:rtl";
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2200);
  }
  $(document).on("click", "#upro .uludo", function () {
    if (current == null) return;
    if (typeof window.LUDO_CHALLENGE === "function") {
      try { window.LUDO_CHALLENGE(current); } catch (e) {}
    } else {
      toast("لعبة Ludo قريباً");
    }
  });

  window.LV_ONPROFILE = function (id) {
    current = id;
    try { render(id); } catch (e) {}
  };

  /* تحديث لحظي لو النقاط اتغيرت والبروفايل مفتوح */
  (function hook() {
    if (typeof window.updateu !== "function") return setTimeout(hook, 300);
    if (window.updateu.__lv) return;
    var orig = window.updateu;
    var wrapped = function (id) {
      var r = orig.apply(this, arguments);
      try { if (current != null && id == current && $m().is(":visible")) render(id); } catch (e) {}
      return r;
    };
    wrapped.__lv = true;
    /* نحافظ على علامة profile-cover لو كانت موجودة */
    if (orig.__pc) wrapped.__pc = true;
    window.updateu = wrapped;
  })();
})();

/* [PT-LOOK] لون الموقع للجزء السفلي من أدوات الأدمن: بيتقرأ من .label-primary الأصلي (يتغير مع أي لون للموقع) */
(function () {
  window.__ptSite = 1;
  var probe = null;
  function siteColor() {
    try {
      if (!probe) {
        probe = document.createElement("span");
        probe.className = "label label-primary";
        probe.style.cssText = "display:none!important";
        document.body.appendChild(probe);
      }
      var c = window.getComputedStyle(probe).backgroundColor;
      return c && c !== "rgba(0, 0, 0, 0)" ? c : "";
    } catch (e) { return ""; }
  }
  function sync() {
    var el = document.getElementById("upro");
    var c = siteColor();
    if (el && c) el.style.setProperty("--pt-site", c);
  }
  function hook() {
    if (!window.jQuery) return setTimeout(hook, 200);
    window.jQuery(document).on("show.bs.modal shown.bs.modal", "#upro", sync);
    sync();
  }
  hook();
})();
