/* ==========================================================
   [ADDED] نقل زر "مبدع الحائط" إلى نافذة "الاضافات والميزات"
   + شكل الصفوف زي الصورة (أيقونات مسطّحة، من غير نصوص فرعية، أرقام متسلسلة)
   ملف إضافة مستقل: بيلفّ openOtherSettings من other-settings.js بدون تعديله.
   لو الملف ده مش بيتحمّل، كل حاجة بترجع زي ما كانت (الزر جوه الحائط).
   ========================================================== */
(function () {
  "use strict";
  if (window.__wcrLoaded) return;
  window.__wcrLoaded = true;

  var TITLE = "مبدع الحائط";
  var BACK_TITLE = "الاضافات والميزات";

  /* [ADDED] أيقونات مسطّحة بدل الإيموجي (currentColor = لون الأيقونة من الـ CSS تحت) */
  function svg(inner) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + inner + "</svg>";
  }
  var ICONS = {
    design: svg('<circle cx="12" cy="8" r="3.2" fill="currentColor"/><circle cx="5.5" cy="9.5" r="2.4" fill="currentColor"/><circle cx="18.5" cy="9.5" r="2.4" fill="currentColor"/><path fill="currentColor" d="M12 12.5c-3.3 0-6 1.8-6 4.3V19h12v-2.2c0-2.5-2.7-4.3-6-4.3z"/><path fill="currentColor" d="M5.5 12.5C3.5 12.5 2 13.8 2 15.5V17h3.2v-.5c0-1.4.6-2.6 1.6-3.5-.4-.3-.8-.5-1.3-.5zM18.5 12.5c2 0 3.5 1.3 3.5 3V17h-3.2v-.5c0-1.4-.6-2.6-1.6-3.5.4-.3.8-.5 1.3-.5z"/>'),
    notif: svg('<path fill="currentColor" d="M12 22a2.4 2.4 0 0 0 2.4-2.4H9.6A2.4 2.4 0 0 0 12 22zm7-6.5V11a7 7 0 0 0-5.5-6.8V3.5a1.5 1.5 0 0 0-3 0v.7A7 7 0 0 0 5 11v4.5l-2 2V19h18v-1.5l-2-2z"/>'),
    link: svg('<path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1"/>'),
    trend: svg('<path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M3 4v16h18M6.5 15l4-4 3 3 6-6M15.5 8H20v4.5"/>'),
    wallcreator: svg('<path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M3 4v16h18"/><path fill="currentColor" d="M5.5 18l4.5-6 3.5 3.5L20 7.5V18z"/>'),
    ntsnd: svg('<path fill="currentColor" d="M12 22a2.4 2.4 0 0 0 2.4-2.4H9.6A2.4 2.4 0 0 0 12 22zm7-6.5V11a7 7 0 0 0-5.5-6.8V3.5a1.5 1.5 0 0 0-3 0v.7A7 7 0 0 0 5 11v4.5l-2 2V19h18v-1.5l-2-2z"/><path fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" d="M3.5 3.5l17 17"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M3.5 3.5l17 17"/>')
  };

  /* [ADDED] CSS: أبعاد الصفوف زي الصورة بالظبط (مقاسة من الصورة على عرض نافذة 340px) + لون الأيقونات + إخفاء النصوص الفرعية */
  var CSS = [
    /* الحاوية والهيدر */
    "#othpage .og{padding:0 13px 20px!important}",
    "#othpage .og-head{margin:0 -13px 11px!important;padding:3px 12px!important}",
    /* الصف: ارتفاع ~62px بدل 74 */
    "#othpage .og-it{height:62px!important;margin:0 0 9px!important;padding:0 12px!important;gap:9px!important;border-radius:20px!important}",
    "#othpage .og-no{flex:0 0 24px!important;width:24px!important;height:24px!important;border-radius:8px!important;font-size:17px!important}",
    "#othpage .og-ic{flex:0 0 38px!important;width:38px!important;height:38px!important;border-radius:12px!important}",
    "#othpage .og-tt{font-size:16.5px!important}",
    "#othpage .og-ch{font-size:18px!important}",
    "#othpage .og-bg{font-size:11px!important;padding:1px 7px!important}",
    "#othpage .og-ic svg{width:19px;height:19px;display:block}",
    /* النقط الفاصلة */
    "#othpage .og-dots{height:6px!important;margin:-1px 0 8px!important;gap:10px!important}",
    "#othpage .og-dots i{width:6px!important;height:6px!important}",
    /* عنوان القسم */
    "#othpage .og-sec{margin:2px 6px 10px!important;gap:8px!important;font-size:15.5px!important}",
    "#othpage .og-sec .og-no{flex:0 0 22px!important;width:22px!important;height:22px!important;border-radius:50%!important;font-size:15px!important}",
    /* صف الكتم + المفتاح */
    "#othpage .og-it.m1 .og-ic{width:37px!important;height:37px!important;flex-basis:37px!important}",
    "#othpage .og-sw{width:52px!important;height:31px!important;border-radius:16px!important}",
    "#othpage .og-sw:after{top:3px!important;left:3px!important;width:25px!important;height:25px!important}",
    "#othpage .og-sw.on:after{transform:translateX(21px)!important}",
    /* الألوان */
    "#othpage .og-ic.a{color:#4a1a82}",
    "#othpage .og-ic.b{color:#5b3300}",
    "#othpage .og-ic.c{color:#3b1c8a}",
    "#othpage .og-ic.d{color:#0b5f58}",
    "#othpage .og-ic.e{background:linear-gradient(135deg,#7fd8ff,#2ea8f2);color:#0b3560}",
    "#othpage .og-it.m1 .og-ic{color:#4a1a82}",
    "#othpage .og-it .og-sb{display:none!important}"
  ].join("\n");
  var st = document.createElement("style");
  st.id = "wcrCss";
  st.textContent = CSS;
  document.head.appendChild(st);

  /* [ADDED] إخفاء الزر القديم من نافذة الحائط (الكلاس display:none inline هو اللي wall-style.js بيحترمه) */
  function hideOldBtn() {
    var l = document.querySelector("#wall label.top.wall");
    if (l) l.style.setProperty("display", "none", "important");
  }

  /* [ADDED] صف مبدع الحائط — نفس هيكل صف "ترند الحائط" بالظبط وبنفس تبويب #top10 */
  function makeRow() {
    var d = document.createElement("div");
    d.className = "og-it c4";
    d.setAttribute("data-a", "wallcreator");
    d.setAttribute("title", TITLE);
    d.setAttribute("data-toggle", "tab");
    d.setAttribute("data-target", "#top10");
    d.innerHTML =
      '<span class="og-no"></span>' +
      '<span class="og-ic e"></span>' +
      '<span class="og-tx"><span class="og-tt">' + TITLE + "</span></span>" +
      '<span class="og-ch">‹</span>';
    return d;
  }

  function decorate() {
    var ls = document.getElementById("othLs");
    if (!ls) return;

    /* 1) إدراج الصف بعد ترند الحائط (قبل النقط اللي بعده) */
    if (!ls.querySelector('[data-a="wallcreator"]')) {
      var tr = ls.querySelector('[data-a="trend"]');
      if (tr) tr.parentNode.insertBefore(makeRow(), tr.nextSibling);
    }

    /* 2) الأيقونات المسطّحة */
    var rows = ls.querySelectorAll("[data-a]");
    for (var i = 0; i < rows.length; i++) {
      var a = rows[i].getAttribute("data-a");
      var ic = rows[i].querySelector(".og-ic");
      if (ic && ICONS[a]) ic.innerHTML = ICONS[a];
    }

    /* 3) ترقيم متسلسل بترتيب الظهور (الأرقام الثابتة في الأصل مش بتعرف الصف الجديد) */
    var nos = ls.querySelectorAll(".og-no");
    for (var k = 0; k < nos.length; k++) nos[k].textContent = String(k + 1);

    /* عنوان صف الكتم عليه font-size inline بـ !important فمينفعش يتغيّر بالـ CSS */
    var mt = ls.querySelector('[data-a="ntsnd"] .og-tt');
    if (mt) mt.style.setProperty("font-size", "15px", "important");

    hideOldBtn();
  }

  /* [ADDED] لفّ openOtherSettings: الأصلية الأول بعدين نزوّد الصف */
  function wrap() {
    var orig = window.openOtherSettings;
    if (typeof orig !== "function") return false;
    if (orig.__wcr) return true;
    var w = function () {
      var r = orig.apply(this, arguments);
      try { decorate(); } catch (e) {}
      return r;
    };
    w.__wcr = true;
    window.openOtherSettings = w;
    return true;
  }
  if (!wrap()) {
    var tries = 0;
    var iv = setInterval(function () {
      if (wrap() || ++tries > 50) clearInterval(iv);
    }, 100);
  }

  /* [ADDED] ضغطة الصف: نفس اللي كان بيعمله الزر القديم (عنوان + إظهار النافذة + تحميل القائمة) — التبويب بيفتحه bootstrap من data-target */
  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target.closest('#othpage [data-a="wallcreator"]') : null;
    if (!t) return;
    try {
      $(".pnhead").text(TITLE);
      $(".dpnl").show();
      if (typeof GET_TOP_BAR === "function") GET_TOP_BAR();
    } catch (x) {}
  });

  /* [ADDED] زر "عودة" في مبدع الحائط كان بيرجع للحائط؛ دلوقتي بيرجع لنافذة الاضافات والميزات
     (capture: بنغيّر الهدف قبل ما bootstrap يقرأه وقبل ما onclick يقرأ العنوان) */
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest ? e.target.closest("#top10 .wt-back") : null;
    if (!b) return;
    b.setAttribute("data-target", "#othpage");
    b.setAttribute("title", BACK_TITLE);
    try { if (typeof openOtherSettings === "function") openOtherSettings(); } catch (x) {}
  }, true);

  /* لو الحائط اتفتح قبل ما نافذة الاضافات تتفتح (مثلاً بعد ريفرش) نخفي الزر القديم برضه */
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hideOldBtn);
  else hideOldBtn();
  setTimeout(hideOldBtn, 600);
})();
