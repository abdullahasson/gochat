/* ==========================================================
   زخرفة الاسم: خط + تأثير حركة اسم العضو يظهر للجميع
   - الخط محفوظ في user.nfont (اسم الخط من القائمة المسموحة في السيرفر)
   - بيتطبق بنفس مواضع الإخفاء (uhide): قايمة المتصلين + الرسائل + الردود + البروفايل
   - خطوط جوجل بتتحمّل بشكل كسول (فقط الخط المستخدم فعلاً)
   - الخط شغّال فقط لو العضو معاه ifedit (صلاحية تصميم العضوية)
   - تأثير اللون (مزج لونين + لمعة) محفوظ في user.nclr بصيغة "#لون1,#لون2,اتجاه(h|v),لمعة(0|1)"
   - التأثير محفوظ في user.nfx بصيغة "تأثير:سرعة" (السرعة 1-5) ويتطبق بنفس المواضع والشرط
   ========================================================== */
(function () {
  "use strict";
  /* key = القيمة المخزنة | g = اسم العائلة في جوجل | l = يدعم الحروف اللاتينية | a = يدعم العربي */
  var FONTS = [
    { k: "Cairo", a: 1, l: 1 }, { k: "Almarai", a: 1, l: 1 }, { k: "Tajawal", a: 1, l: 1 },
    { k: "Amiri", a: 1, l: 1 }, { k: "Lateef", a: 1 }, { k: "Aref Ruqaa", a: 1 },
    { k: "Reem Kufi", a: 1, l: 1 }, { k: "Changa", a: 1, l: 1 }, { k: "Mada", a: 1, l: 1 },
    { k: "Markazi Text", a: 1, l: 1 }, { k: "El Messiri", a: 1, l: 1 },
    { k: "IBM Plex Sans Arabic", a: 1, l: 1 }, { k: "Readex Pro", a: 1, l: 1 },
    { k: "Alexandria", a: 1, l: 1 }, { k: "Marhey", a: 1, l: 1 }, { k: "Mirza", a: 1 },
    { k: "Scheherazade New", a: 1 }, { k: "Gulzar", a: 1 }, { k: "Jomhuria", a: 1 },
    { k: "Poppins", l: 1 }, { k: "Montserrat", l: 1 }, { k: "Vibes", a: 1 },
    { k: "Blake", g: "Blaka", a: 1, l: 1 }, { k: "Blake Hollow", g: "Blaka Hollow", a: 1, l: 1 }
  ];
  var IDX = {};
  FONTS.forEach(function (f, i) { f.i = i; f.g = f.g || f.k; IDX[f.k] = f; });
  window.NFONT_LIST = FONTS;

  /* مواضع ظهور الاسم (نفس المواضع للخط والتأثير) */
  function NAMES(a) {
    return a + " .u-topic," + a + " .fth-topic," + a + " .fth-cm-t," +
      a + ".u-rply .item3," + a + ".isreply .item3," +
      "#upro" + a + " .pc-name,#upro" + a + " .pc-title";
  }

  /* CSS: كل خط له سمة data-nf = رقمه */
  var css = [];
  FONTS.forEach(function (f) {
    var ff = "'" + f.g + "',sans-serif!important";
    var a = '[data-nf="' + f.i + '"]';
    css.push(NAMES(a) + "{font-family:" + ff + "}");
  });

  /* ---------- تأثيرات الحركة ----------
     k = المفتاح المخزن | e = الأيقونة | t = الاسم العربي | n = الاسم الإنجليزي
     d = المدة الأساسية بالثواني (بتتضرب في معامل السرعة) | z = دالة التوقيت */
  var FX = [
    { k: "shake",   e: "📳", t: "اهتزاز",       n: "Shake",           d: 0.7, z: "linear" },
    { k: "bounce",  e: "🏀", t: "قفز",          n: "Bounce",          d: 1.0, z: "ease-out" },
    { k: "scatter", e: "🍂", t: "تطاير",        n: "Scatter",         d: 2.6, z: "ease-in-out" },
    { k: "sway",    e: "↔️", t: "يمين وشمال",   n: "Side to Side",    d: 1.3, z: "ease-in-out" },
    { k: "vbounce", e: "↕️", t: "فوق وتحت",     n: "Up and Down",     d: 1.2, z: "ease-in-out" },
    { k: "float",   e: "🪁", t: "طفو",          n: "Floating",        d: 2.8, z: "ease-in-out" },
    { k: "wobble",  e: "🔄", t: "تمايل",        n: "Wobble",          d: 1.6, z: "ease-in-out" },
    { k: "spin",    e: "🌀", t: "دوران",        n: "Spin",            d: 2.6, z: "ease-in-out" },
    { k: "pulse",   e: "⚡", t: "نبض",          n: "Pulse",           d: 1.2, z: "ease-in-out" }
  ];
  var FXI = {};
  FX.forEach(function (f) { FXI[f.k] = f; });
  var SPEED_MUL = [2, 1.4, 1, 0.65, 0.4];   /* السرعة 1 (بطيء) .. 5 (سريع) */
  window.NFX_LIST = FX;

  /* "shake:3" -> { k, s, dur } أو null لو غير صالح */
  function fxParse(v) {
    if (typeof v !== "string") return null;
    var p = v.split(":");
    var f = FXI[p[0]];
    var s = parseInt(p[1], 10);
    if (!f || !(s >= 1 && s <= 5)) return null;
    return { k: f.k, s: s, dur: (f.d * SPEED_MUL[s - 1]).toFixed(2) + "s" };
  }
  window.nfxParse = fxParse;

  /* تطبيق/إزالة التأثير على عنصر DOM واحد (بيستخدمه التطبيق العام والمعاينة) */
  window.nfxSet = function (el, v) {
    if (!el) return;
    var o = fxParse(v);
    if (o) { el.setAttribute("data-nx", o.k); el.style.setProperty("--nxd", o.dur); }
    else { el.removeAttribute("data-nx"); el.style.removeProperty("--nxd"); }
  };

  var KF = {
    shake: "0%,60%,100%{transform:translateX(0)}6%,18%,30%,42%,54%{transform:translateX(-2px)}12%,24%,36%,48%{transform:translateX(2px)}",
    bounce: "0%,100%{transform:translateY(0)}25%{transform:translateY(-5px)}45%{transform:translateY(0)}60%{transform:translateY(-2px)}75%{transform:translateY(0)}",
    scatter: "0%,55%,100%{transform:none;opacity:1;filter:none}22%{transform:translate(9px,-7px) rotate(9deg) scale(1.18);opacity:.15;filter:blur(2px)}23%{transform:translate(-9px,6px) rotate(-9deg) scale(.85);opacity:0;filter:blur(2px)}",
    sway: "0%,100%{transform:translateX(0)}25%{transform:translateX(4px)}75%{transform:translateX(-4px)}",
    vbounce: "0%,100%{transform:translateY(0)}25%{transform:translateY(-3px)}75%{transform:translateY(3px)}",
    float: "0%,100%{transform:translateY(2px) rotate(-.6deg)}50%{transform:translateY(-3px) rotate(.6deg)}",
    wobble: "0%,100%{transform:rotate(0)}15%{transform:rotate(-5deg)}30%{transform:rotate(4deg)}45%{transform:rotate(-3deg)}60%{transform:rotate(2deg)}75%{transform:rotate(-1deg)}",
    spin: "0%{transform:perspective(300px) rotateY(0)}70%,100%{transform:perspective(300px) rotateY(360deg)}",
    pulse: "0%,100%{transform:scale(1)}50%{transform:scale(1.12)}"
  };
  /* الدوران: لفّة كاملة حول المحور الرأسي (عشان اسم عريض ما يلفّش فوق اللي جنبه) */

  FX.forEach(function (f) {
    css.push("@keyframes nfx-" + f.k + "{" + KF[f.k] + "}");
    var a = '[data-nx="' + f.k + '"]';
    css.push(
      NAMES(a) + ",.nx-self" + a +
      "{--nxa:nfx-" + f.k + " var(--nxd,1s) " + f.z + " infinite;transform-origin:center center}"
    );
  });

  /* ---------- تأثير اللون: مزج لونين (أفقي h / عمودي v) + لمعة اختيارية بنفس الاتجاه ----------
     الاسم بيتحوّل لنص متدرج (background-clip:text)، وخلفية العضو (bg) تفضل ظاهرة كطبقة أخيرة */
  var NCL_RE = /^#[0-9a-fA-F]{6},#[0-9a-fA-F]{6},[hv],[01]$/;
  function nclParse(v) {
    if (typeof v !== "string" || !NCL_RE.test(v)) return null;
    var p = v.split(",");
    return { c1: p[0], c2: p[1], d: p[2], s: p[3] === "1" };
  }
  window.nclParse = nclParse;
  window.nclSet = function (el, v) {
    if (!el) return;
    var o = nclParse(v);
    if (o) {
      el.setAttribute("data-nc", o.d + (o.s ? "s" : ""));
      el.style.setProperty("--nc1", o.c1);
      el.style.setProperty("--nc2", o.c2);
    } else {
      el.removeAttribute("data-nc");
      el.style.removeProperty("--nc1");
      el.style.removeProperty("--nc2");
    }
  };
  var SHINE = "rgba(255,255,255,.6)";
  var NC = {
    h:  { img: "linear-gradient(to right,var(--nc1),var(--nc2)),none", size: "100% 100%,auto", clip: "text,border-box", rep: "no-repeat,repeat" },
    v:  { img: "linear-gradient(to bottom,var(--nc1),var(--nc2)),none", size: "100% 100%,auto", clip: "text,border-box", rep: "no-repeat,repeat" },
    hs: { img: "linear-gradient(100deg,transparent 38%," + SHINE + " 50%,transparent 62%),linear-gradient(to right,var(--nc1),var(--nc2)),none",
          size: "300% 100%,100% 100%,auto", clip: "text,text,border-box", rep: "no-repeat,no-repeat,repeat", anim: "ncs-h" },
    vs: { img: "linear-gradient(180deg,transparent 38%," + SHINE + " 50%,transparent 62%),linear-gradient(to bottom,var(--nc1),var(--nc2)),none",
          size: "100% 300%,100% 100%,auto", clip: "text,text,border-box", rep: "no-repeat,no-repeat,repeat", anim: "ncs-v" }
  };
  css.push(
    "@keyframes ncs-h{0%{background-position:0% 0,0 0,0 0}60%,100%{background-position:100% 0,0 0,0 0}}",
    "@keyframes ncs-v{0%{background-position:0 0%,0 0,0 0}60%,100%{background-position:0 100%,0 0,0 0}}"
  );
  Object.keys(NC).forEach(function (k) {
    var c = NC[k], a = '[data-nc="' + k + '"]';
    css.push(
      NAMES(a) + ",.nx-self" + a + "{" +
      "background-image:" + c.img + ";background-size:" + c.size + ";background-repeat:" + c.rep + ";" +
      "-webkit-background-clip:" + c.clip + ";background-clip:" + c.clip + ";" +
      "-webkit-text-fill-color:transparent;width:fit-content;flex-grow:0" +
      (c.anim ? ";--nca:" + c.anim + " 2.8s linear infinite" : "") + "}"
    );
  });
  /* التأثيرين (حركة + لمعة) يشتغلوا مع بعض عبر قايمة animation واحدة */
  css.push(
    NAMES("[data-nx]") + "," + NAMES("[data-nc]") + ",.nx-self[data-nx],.nx-self[data-nc]" +
    "{animation:var(--nxa,none),var(--nca,none)}"
  );
  /* الأسماء اللي سبانات inline لازم تبقى inline-block عشان transform يشتغل */
  css.push(
    ".mm[data-nx] .u-topic,.notification[data-nx] .u-topic,[data-nx] .fth-cm-t,.mm[data-nc] .u-topic,.notification[data-nc] .u-topic,[data-nc] .fth-cm-t{display:inline-block}",
    "@media (prefers-reduced-motion:reduce){" +
      "[data-nx] .u-topic,[data-nx] .fth-topic,[data-nx] .fth-cm-t,[data-nx] .item3,[data-nx] .pc-name,[data-nx] .pc-title,.nx-self[data-nx]," +
      "[data-nc] .u-topic,[data-nc] .fth-topic,[data-nc] .fth-cm-t,[data-nc] .item3,[data-nc] .pc-name,[data-nc] .pc-title,.nx-self[data-nc]{animation:none!important}}"
  );

  var st = document.createElement("style");
  st.textContent = css.join("\n");
  document.head.appendChild(st);

  /* تحميل خط جوجل مرة واحدة عند الحاجة */
  var loaded = {};
  window.nfontLoad = function (key) {
    var f = IDX[key];
    if (!f || loaded[key]) return;
    loaded[key] = 1;
    var l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=" + encodeURIComponent(f.g).replace(/%20/g, "+") + "&display=swap";
    document.head.appendChild(l);
  };
  window.nfontFamily = function (key) { return IDX[key] ? "'" + IDX[key].g + "',sans-serif" : ""; };

  function keyOf(u) {
    if (!u || !u.ifedit || !u.nfont || !IDX[u.nfont]) return null;
    return u.nfont;
  }
  /* التأثير شغّال بنفس شرط الخط (ifedit) */
  function fxOf(u) {
    if (!u || !u.ifedit || !u.nfx || !fxParse(u.nfx)) return null;
    return u.nfx;
  }
  function clOf(u) {
    if (!u || !u.ifedit || !u.nclr || !nclParse(u.nclr)) return null;
    return u.nclr;
  }
  function set($el, key, fx, cl) {
    if (!$el || !$el.length) return;
    if (key) { nfontLoad(key); $el.attr("data-nf", IDX[key].i); }
    else $el.removeAttr("data-nf");
    $el.each(function () { window.nfxSet(this, fx || ""); window.nclSet(this, cl || ""); });
  }
  function findUser(k) {
    try {
      if (k == null || k === "") return null;
      if (U_CASH[k]) return U_CASH[k];
      if (typeof getuserbylid === "function") return getuserbylid(k) || null;
    } catch (e) {}
    return null;
  }

  function applyUser(id) {
    try {
      var u = U_CASH[id];
      if (!u) return;
      var key = keyOf(u), fx = fxOf(u), cl = clOf(u);
      /* [FIX-F07] مع القائمة الافتراضية: الصف الظاهر يُجاب من VLIST (ويعاد تطبيق
         الزخرفة تلقائياً عند إعادة رسم الصف لأن wrapper updateu يستدعي applyUser) */
      var __r = (window.VLIST ? VLIST.rowOf(id) : null) || (U_X && U_X[id] && U_X[id].jquery ? U_X[id] : null);
      if (__r) set(__r, key, fx, cl);
      /* [FIX-S23] المسح الشامل (عناصر [data-uh] على مستوى الصفحة كلها) صار
         يتنفذ فقط عند تغيّر زخرفة المستخدم فعلياً. قبل كده كل تحديث لأي
         مستخدم — حالة/صورة/لايك/نقاط/جملة — كان بيعمل 2 مسح DOM عالمي
         (document كله) لكل مستخدم في كل دفعة uB: في غرفة نشطة يعني مئات
         المسوح في الثانية = سخونة واضحة. التوقيع بيتخزن على كائن المستخدم
         نفسه وبيفضل معه لأن دفعات uB بتدمج بالـ Object.assign في نفس الكائن.
         الصف الظاهر (فيصل واحد فوق) بتطبق دايماً لأن VLIST بيعيد استخدام
         صف واحد لعدة مستخدمين. أول مرة من غير أي زخرفة: مافيش عناصر
         قديمة محتاجة تنضيف → صفر مسح. */
      var sig = key + "\u0001" + fx + "\u0001" + cl;
      if (u.__nfs !== undefined) {
        if (u.__nfs === sig) return;
        u.__nfs = sig;
      } else {
        u.__nfs = sig;
        if (!key && !fx && !cl) return;
      }
      var $c = $("#c" + id);
      if ($c.length) set($c.find(".uzr"), key, fx, cl);
      set($(".w" + id + " .head .uzr"), key, fx, cl);
      set($('[data-uh="' + id + '"]'), key, fx, cl);
      if (u.lid != null) set($('[data-uh="' + u.lid + '"]'), key, fx, cl);
    } catch (e) {}
  }
  window.nfontApplyUser = applyUser;

  /* وسم رسالة / رد جديد بصاحبها (uhideTag بيتنادى عند كل رسالة) */
  (function hookTag() {
    if (typeof window.uhideTag !== "function") return setTimeout(hookTag, 300);
    if (window.uhideTag.__nf) return;
    var orig = window.uhideTag;
    var w = function ($el, key) {
      var r = orig.apply(this, arguments);
      try { var uu = findUser(key); set($el, keyOf(uu), fxOf(uu), clOf(uu)); } catch (e) {}
      return r;
    };
    w.__nf = true;
    window.uhideTag = w;
  })();

  /* أي تحديث لصف عضو يعيد تطبيق الخط */
  (function hookUpdate() {
    if (typeof window.updateu !== "function" || !window.updateu.__uh) return setTimeout(hookUpdate, 300);
    if (window.updateu.__nf) return;
    var orig = window.updateu;
    var w = function (id) {
      var r = orig.apply(this, arguments);
      applyUser(id);
      try { if (cp != null && id == cp && $("#upro").is(":visible")) prof(id); } catch (e) {}
      return r;
    };
    w.__nf = true;
    window.updateu = w;
  })();

  /* البروفايل */
  var cp = null;
  function prof(id) {
    try { set($("#upro"), keyOf(U_CASH[id]), fxOf(U_CASH[id]), clOf(U_CASH[id])); } catch (e) {}
  }
  (function hookProfile() {
    if (typeof window.PC_ONPROFILE !== "function" || !window.PC_ONPROFILE.__uh) return setTimeout(hookProfile, 300);
    if (window.PC_ONPROFILE.__nf) return;
    var orig = window.PC_ONPROFILE;
    var w = function (id) {
      var r = orig.apply(this, arguments);
      cp = id; prof(id);
      return r;
    };
    w.__nf = true;
    window.PC_ONPROFILE = w;
  })();

  /* شبكة أمان: أي عنصر (رسالة/رد/تنبيه) بيتضاف وعليه data-uh ومتطبقش عليه التأثير يتطبق عليه فوراً
     [FIX-C08/P1] كان المراقب على document.body كاملاً بـ subtree — أي إدخال DOM
     في التطبيق كله (رسائل، صفوف القائمة الافتراضية، نوافذ، شارات...) كان يدفع
     عناصره إلى الطابور ويُمسح بـ jQuery بحثًا عن data-uh. الآن المراقبة على
     حاويات إنتاج المحتوى الموسوم فعليًا فقط (نفس أسلوب yt-wall.js:223 الذي
     يراقب #d2bc فقط وusers-style.js:359 الذي يراقب صندوق القائمة):
       - #room          → رسائل الغرفة #d2 + شريط الرد .isreply
       - .dad           → نوافذ الخاص ورسائلها (تُنشأ ديناميكيًا داخله)
       - #wall          → منشورات الحائط + ريشة المبدعين (#d2feather)
       - #wetchprofilenotifi → إشعارات لوحة التنبيهات (.nt-list)
       - #cooment       → نافذة تعليقات الحائط (#rmsg)
       - #upro          → نافذة الملف الشخصي
     (المسارات الأساسية أصلًا مغطاة مباشرة عبر أغلفة uhideTag/updateu/PC_ONPROFILE
     أعلاه — هذا مجرد صمام أمان، فتغطية الحاويات هذه كافية وسليمة) */
  (function watchTagged() {
    if (typeof MutationObserver === "undefined" || !document.body) return setTimeout(watchTagged, 500);
    var q = [], t = null;
    function flush() {
      t = null;
      var list = q; q = [];
      for (var i = 0; i < list.length; i++) {
        try {
          var $n = $(list[i]);
          $n.find("[data-uh]").addBack("[data-uh]").each(function () {
            var $e = $(this);
            if ($e.attr("data-nfs")) return;
            var uu = findUser($e.attr("data-uh"));
            if (!uu) return;
            $e.attr("data-nfs", "1");
            set($e, keyOf(uu), fxOf(uu), clOf(uu));
          });
        } catch (e) {}
      }
    }
    function observe() {
      var obs = new MutationObserver(function (ms) {
        for (var i = 0; i < ms.length; i++) {
          var a = ms[i].addedNodes;
          for (var j = 0; j < a.length; j++) if (a[j].nodeType === 1) q.push(a[j]);
        }
        if (q.length && !t) t = setTimeout(flush, 30);
      });
      var opts = { childList: true, subtree: true };
      var hosts = [
        document.getElementById("room"),
        document.querySelector(".dad"),
        document.getElementById("wall"),
        document.getElementById("wetchprofilenotifi"),
        document.getElementById("cooment"),
        document.getElementById("upro")
      ];
      var n = 0;
      for (var h = 0; h < hosts.length; h++) {
        if (hosts[h]) { obs.observe(hosts[h], opts); n++; }
      }
      /* إن لم تكن الحاويات جاهزة بعد (سكربتات مؤجلة) نعيد المحاولة مرة أخرى */
      if (!n) return setTimeout(observe, 800);
    }
    observe();
  })();

  setTimeout(function again() {
    if (typeof U_CASH === "undefined") return setTimeout(again, 500);
    for (var id in U_CASH) applyUser(id);
  }, 1800);
})();
