/* =====================================================================
   vlist.js — Virtual Scrolling لقائمة المتصلين (تنفيذ توصية التقرير F-07)
   ---------------------------------------------------------------------
   المشكلة: القائمة كانت تبني صف DOM لكل مستخدم متصل (1000 متصل = 1000 صف
   × ~15 عنصر = 15000 عقدة DOM)، ونظام __ULZ القديم كان "يعبّئ" الصف عند
   ظهوره لكنه لا يعيد تدويره أبداً — بعد تصفّح القائمة كلها تبقى كل الصفوف
   مليئة في الذاكرة ويبطّئ المتصفح.

   الحل: تجسيد افتراضي (Virtual Scrolling):
   - بيانات كل المتصلين في الذاكرة فقط (U_CASH / C_L_U)
   - عدد ثابت من صفوف DOM حقيقية (pool ~ 40 صف) يُعاد استخدامها
   - كل صف يوضع بمكانه عبر transform: translateY — لا إعادة ترتيب DOM
   - التحديثات (u^ / u+ / u-) تعدّل البيانات وتعيد رسم النطاق المرئي فقط
   1000 متصل → ~30-40 عنصر DOM بدل 15000، وتمرير سلس بدون jank.

   التكامل: x2.js يستدعي VLIST.* من نفس النقاط التي كانت تلمس DOM مباشرة.
   ===================================================================== */
(function (global) {
  "use strict";

  var ROW_H = 66;        /* ارتفاع تقديري للصف (الارتفاع الحقيقي بيتقاس ويتخزّن لكل عضو - كروت بارتفاعات مختلفة) */
  var H = {};            /* id → الارتفاع المقاس للكارت */
  var remeasure = 0;     /* حارس ضد حلقة إعادة الرسم */
  var OVERSCAN = 6;      /* صفوف إضافية فوق/تحت الشاشة لتمرير سلس */
  var POOL_MAX = 48;     /* أقصى صفوف DOM حقيقية موجودة */

  var scroller = null,   /* #users — عنصر التمرير */
    box = null,          /* .usr — حاوية الصفوف */
    bar = null,          /* #ninrbar — شريط "المتواجدين في الدردشة" */
    spacer = null,       /* عنصر يرفع الارتفاع الكلي للمسطرة الجانبية */
    pool = [],           /* صفوف DOM المعاد استخدامها */
    order = [],          /* كل ids مرتبة */
    view = [],           /* ids بعد الفلترة وإخفاء المخفيين */
    st = {},             /* id → { v:rank, inroom:0/1, hid:0/1 } */
    rowByUser = {},      /* id → صف الـ DOM الظاهر حالياً (إن وُجد) */
    raf = 0,
    filterQ = "",
    boxOffset = 0,
    inited = false;

  /* ---------- CSS: تفعيل الوضع الافتراضي ---------- */
  function css() {
    try {
      var s = document.createElement("style");
      s.textContent =
        ".usr.vlz{position:relative}" +
        ".usr.vlz>.vlzrow{position:absolute;top:0;right:0;left:0;height:auto;overflow:visible;will-change:transform}" +
        ".usr.vlz>.vlzspacer{width:100%;pointer-events:none}" +
        ".usr.vlz>#ninrbar{position:absolute;top:0;right:0;left:0;z-index:2}";
      (document.head || document.documentElement).appendChild(s);
    } catch (e) {}
  }

  /* ---------- القالب (نفس #uhtml) ---------- */
  var TPL = null, TPL_SRC = null;
  function tpl() {
    var src = global.uhtml;
    if (typeof src != "string" || src == "*") return null;
    if (!TPL || TPL_SRC !== src) {
      var t = document.createElement("div");
      t.innerHTML = src;
      TPL = t.firstElementChild;
      TPL_SRC = src;
    }
    return TPL;
  }

  /* نص السطح من topic HTML — بدون تنفيذ أو تحميل صور */
  var __dp = null, __tc = {}, __tn = 0;
  function ttext(h) {
    h = h == null ? "" : "" + h;
    if (h.indexOf("<") == -1 && h.indexOf("&") == -1) return h;
    var c = __tc[h];
    if (c !== undefined) return c;
    if (!__dp) __dp = new DOMParser();
    c = __dp.parseFromString(h, "text/html").body.textContent || "";
    if (++__tn > 5000) { __tc = {}; __tn = 0; }
    __tc[h] = c;
    return c;
  }

  var collator = null;
  function cmpFactory() {
    if (!collator) collator = new Intl.Collator();
    return collator;
  }

  /* ---------- مفاتيح الترتيب (نفس منطق updateusers القديم) ---------- */
  function keyOf(id, u) {
    var s = st[id] || (st[id] = {});
    var rank = 0;
    try { var r = global.getpower ? global.getpower(u.power).rank : 0; if (r !== undefined) rank = r; } catch (e) {}
    if (!rank && global.getico && global.getico(u)) rank = 10;
    s.v = rank;
    return (s.v || 0) + (s.inroom ? 1e5 : 0);
  }

  /* ---------- تجهيز الحاوية ---------- */
  function init() {
    if (inited) return true;
    scroller = document.getElementById("users");
    if (!scroller) return false;
    box = document.querySelector("#users .usr") || document.getElementById("users");
    if (!box) return false;
    inited = true;
    css();
    box.classList.add("vlz");

    /* الشريط الفاصل يُدار الآن افتراضياً */
    bar = document.getElementById("ninrbar");
    if (bar && bar.parentNode !== box) box.appendChild(bar);

    /* spacer يحمل الارتفاع الكلي حتى تعمل المسطرة الجانبية */
    spacer = document.createElement("div");
    spacer.className = "vlzspacer";
    box.appendChild(spacer);

    /* صفوف الـ pool */
    for (var i = 0; i < POOL_MAX; i++) {
      var row = document.createElement("div");
      row.className = "uzr vlzrow";
      row.style.transform = "translateY(-9999px)";
      box.appendChild(row);
      pool.push(row);
    }

    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () { measureBox(); schedule(); }, { passive: true });

    measureBox();
    return true;
  }

  function measureBox() {
    try {
      var sr = scroller.getBoundingClientRect();
      var br = box.getBoundingClientRect();
      boxOffset = br.top - sr.top + scroller.scrollTop;
      if (boxOffset < 0) boxOffset = 0;
    } catch (e) { boxOffset = 0; }
  }

  function onScroll() { schedule(); }

  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = 0; render(); });
  }

  function renderNow() {
    /* رسم متزامن فوري (للاختبارات وللتفعيل اليدوي للتبويب) */
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    render();
  }

  /* ---------- ملء صف بالبيانات (يستخدم updateu الموجود في x2.js) ---------- */
  function fillRow(row, id) {
    var u = global.U_CASH ? global.U_CASH[id] : null;
    if (u == null) return;
    var t = tpl();
    if (!t) return;
    /* عند إعادة استخدام الصف لمستخدم آخر: إعادة بناء الأبناء من القالب —
       بعض التحديثات في updateu تحذف عناصر (مثل .co) ولا تعيدها */
    if (!row.__built || row.__lastBuiltFor !== id) {
      while (row.firstChild) row.removeChild(row.firstChild);
      var kids = t.childNodes;
      for (var k = 0; k < kids.length; k++) row.appendChild(kids[k].cloneNode(true));
      row.__built = 1;
      row.__lastBuiltFor = id;
      try { row.className = t.className + " vlzrow uid" + id; } catch (e) {}
      var imgs = row.getElementsByTagName("img");
      for (var i = 0; i < imgs.length; i++) imgs[i].decoding = "async";
      row.__rc = {}; /* تصفير كاش الفروقات ليُعاد الرسم كاملاً */
    }
    row.setAttribute("onclick", "upro('" + id + "');");
    row.__hy = 1;
    rowByUser[id] = row;
    if (global.updateu) {
      try { global.updateu(id, u); } catch (e) {}
    }
  }

  /* ---------- الرسم: حساب النطاق المرئي وإسناد الصفوف ---------- */
  function render() {
    raf = 0;
    if (!inited && !init()) return;
    var top = scroller.scrollTop - boxOffset;
    if (top < 0) top = 0;
    var vh = scroller.clientHeight || 400;

    /* موضع شريط "المتواجدين في الدردشة": بعد آخر عضو من غرفتي مباشرة.
       عند ظهوره يحجز مساحته بفتحة (barGap) كما كان في التخطيط القديم */
    var barIdx = 0;
    if (bar) {
      for (var q = 0; q < view.length; q++) {
        var sq = st[view[q]];
        if (!sq || !sq.inroom) break;
        barIdx++;
      }
    }
    var barOn = !!(bar && bar.style.display !== "none");
    var barGap = 0;
    if (barOn) {
      try { barGap = bar.offsetHeight || 30; } catch (e) { barGap = 30; }
    }

    /* ارتفاعات متغيّرة: مجاميع تراكمية من الارتفاع المقاس (أو التقديري لو لسه ما اتقاسش) */
    var n = view.length;
    var cum = new Array(n + 1);
    cum[0] = 0;
    for (var c = 0; c < n; c++) cum[c + 1] = cum[c] + (H[view[c]] || ROW_H);
    function yOf(i) { return cum[i] + (barOn && i >= barIdx ? barGap : 0); }

    /* أول صف ظاهر: بحث ثنائي */
    var lo = 0, hi = n;
    while (lo < hi) {
      var mid = (lo + hi) >> 1;
      if (yOf(mid + 1) <= top) lo = mid + 1; else hi = mid;
    }
    var start = lo - OVERSCAN;
    if (start < 0) start = 0;
    var end = lo;
    while (end < n && yOf(end) < top + vh) end++;
    end += OVERSCAN;
    if (end > n) end = n;

    spacer.style.height = (cum[n] + barGap) + "px";

    var used = 0;
    var idx = start;
    var changed = false;
    for (var i = 0; i < pool.length && idx < end; i++, idx++, used++) {
      var row = pool[i];
      var id = view[idx];
      if (row.__uid !== id) {
        if (row.__uid != null && rowByUser[row.__uid] === row) delete rowByUser[row.__uid];
        row.__uid = id;
        fillRow(row, id);
      }
      var ty = "translateY(" + yOf(idx) + "px)";
      if (row.style.transform !== ty) row.style.transform = ty;
      var s = st[id] || {};
      row.classList.toggle("inroom", !!s.inroom);
      /* قياس الارتفاع الحقيقي للكارت */
      var hh = row.offsetHeight;
      if (hh > 0 && Math.abs((H[id] || 0) - hh) > 1) { H[id] = hh; changed = true; }
    }
    /* لو في ارتفاع اتغيّر نعيد التوزيع (بحد أقصى مرات متتالية عشان ما يحصلش لوب) */
    if (changed && remeasure < 4) { remeasure++; schedule(); } else if (!changed) { remeasure = 0; }
    /* الصفوف الفائضة تُخفى (تبقى في الـ pool لإعادة الاستخدام) */
    for (; used < pool.length; used++) {
      var r2 = pool[used];
      if (r2.__uid != null && rowByUser[r2.__uid] === r2) delete rowByUser[r2.__uid];
      r2.__uid = null;
      r2.__lastBuiltFor = null;
      r2.style.transform = "translateY(-9999px)";
    }

    /* الشريط نفسه يوضع في فتحته (الإظهار/الإخفاء يبقى بيد roomChanged كما كان) */
    if (bar) {
      if (barIdx > view.length) barIdx = view.length;
      bar.style.transform = "translateY(" + cum[barIdx] + "px)";
    }
  }

  /* ---------- الترتيب + الفلترة ---------- */
  function hidOf(u) {
    /* نفس منطق stealthit: المخفيون عن رتبتي لا يظهرون في القائمة */
    try {
      if (u && u.s && global.getpower && global.jstp) {
        var p = global.getpower(u.power);
        return !!(p && p.rank > global.jstp.rank);
      }
    } catch (e) {}
    return false;
  }

  function rebuild() {
    if (!inited && !init()) return;
    var list = global.C_L_U || [];
    var seen = {};
    var items = [];
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (!e || seen[e.id]) continue;
      seen[e.id] = 1;
      var s = st[e.id] || (st[e.id] = {});
      var u = global.U_CASH ? global.U_CASH[e.id] : e;
      u = u || e;
      items.push([keyOf(e.id, u), ttext(u.topic), e.id]);
      s.hid = hidOf(u) ? 1 : 0;
    }
    var cl = cmpFactory();
    items.sort(function (a, b) {
      if (a[0] == b[0]) return cl.compare(a[1], b[1]);
      return a[0] < b[0] ? 1 : -1;
    });
    order = items.map(function (x) { return x[2]; });

    /* الفلترة + إخفاء المخفيين */
    var q = filterQ;
    var out = [];
    for (var j = 0; j < order.length; j++) {
      var id = order[j];
      var s2 = st[id] || {};
      if (s2.hid) continue;
      if (q) {
        var u2 = global.U_CASH ? global.U_CASH[id] : null;
        if (!u2) continue;
        var topic = ("" + (u2.topic == null ? "" : u2.topic)).split("ـ").join("").toLowerCase();
        var idreg = "" + (u2.idreg == null ? "" : u2.idreg);
        if (
          topic.indexOf(q) == -1 &&
          idreg.indexOf(q) != 0 &&
          idreg.indexOf(q) != 1
        ) continue;
      }
      out.push(id);
    }
    view = out;
    schedule();
  }

  /* ---------- الواجهة العامة (تُستدعى من x2.js) ---------- */
  var VLIST = {
    /* ulist: قائمة كاملة وصلت — يبني كل شيء من جديد */
    ingest: function () {
      st = {};
      rowByUser = {};
      rebuild();
      render();
    },

    /* u+ / AddUser: مستخدم دخل */
    add: function (id) {
      if (global.U_CASH && global.U_CASH[id]) keyOf(id, global.U_CASH[id]);
      rebuild();
    },

    /* u-: مستخدم خرج */
    remove: function (id) {
      delete st[id];
      var row = rowByUser[id];
      if (row) {
        if (row.__uid === id) row.__uid = null;
        row.style.transform = "translateY(-9999px)";
        delete rowByUser[id];
      }
      rebuild();
    },

    has: function (id) {
      return !!(global.U_CASH && global.U_CASH[id]);
    },

    /* u^: تغيّرت بيانات مستخدم — تحديث الصف إن كان ظاهراً + إعادة ترتيب عند اللزوم */
    touch: function (id, u, resort) {
      var s = st[id] || (st[id] = {});
      var oldKey = s.v || 0;
      keyOf(id, u);
      var row = rowByUser[id];
      if (row && global.updateu) {
        try { global.updateu(id, u); } catch (e) {}
      }
      if (resort || (s.v || 0) != oldKey) rebuild();
      else schedule();
    },

    /* updateusers(): إعادة ترتيب ورسم */
    resort: function () {
      rebuild();
    },

    /* usearch: فلترة البحث */
    filter: function (q) {
      filterQ = (q || "").split("ـ").join("").toLowerCase();
      rebuild();
    },

    /* roomChanged: علامة "معي في الغرفة" */
    markRoom: function (id, on) {
      var s = st[id] || (st[id] = {});
      var was = s.inroom ? 1 : 0;
      s.inroom = on ? 1 : 0;
      if (was != (on ? 1 : 0)) schedule();
    },

    /* stealthit: إخفاء المتخفي عن غير أعلى رتبة */
    setHidden: function (id, on) {
      var s = st[id] || (st[id] = {});
      var was = s.hid ? 1 : 0;
      s.hid = on ? 1 : 0;
      if (was != (on ? 1 : 0)) rebuild();
    },

    /* __ulzLight: تحديث مفتاح الترتيب + حالة التخفي فقط */
    light: function (id, u) {
      var s = st[id] || (st[id] = {});
      var oldKey = s.v || 0;
      keyOf(id, u);
      /* نفس منطق stealthit */
      var hide = false;
      try {
        var p = global.getpower ? global.getpower(u.power) : null;
        hide = !!(u.s && p && p.rank > global.jstp.rank);
      } catch (e) {}
      s.hid = hide ? 1 : 0;
      if ((s.v || 0) != oldKey) rebuild();
      else schedule();
    },

    /* صف DOM لهذا المستخدم إن كان مرسوماً حالياً (لتوافق updateu) */
    rowOf: function (id) {
      var row = rowByUser[id];
      return row ? global.jQuery(row) : null;
    },

    /* هل المستخدم ضمن النطاق المرئي؟ */
    isVisible: function (id) {
      return !!rowByUser[id];
    },

    scrolling: function () { return false; },

    /* عدد المرئي بعد الفلترة (للعداد) */
    count: function () { return view.length; },

    /* إعادة قياس + رسم (تُستدعى عند تفعيل تبويب المتصلين — لا يوجد حدث scroll حينها) */
    refresh: function () {
      if (!inited && !init()) return;
      measureBox();
      renderNow();
    },

    /* رسم متزامن فوري */
    renderNow: function () {
      if (!inited && !init()) return;
      renderNow();
    },

    ROW_H: ROW_H,
  };

  global.VLIST = VLIST;
})(window);
