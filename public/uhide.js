/* ==========================================================
   إظهار / إخفاء بيانات العضو (من تصميم العضوية)
   bitmask:  1 علم | 2 حالة النشاط | 4 الاسم | 8 الوصف | 16 الهاشتاق
   - الإخفاء بيتطبق بس لو العضو معاه ifedit (صلاحية تصميم العضوية)
   - بيتطبق على: قايمة المتصلين + المحادثات الخاصة (الصف) + نافذة البروفايل
   ========================================================== */
(function () {
  "use strict";
  var F = { flag: 1, stat: 2, name: 4, msg: 8, hash: 16 };
  var CLS = ["uh-flag", "uh-stat", "uh-name", "uh-msg", "uh-hash"];
  window.UHIDE_BITS = F;

  var st = document.createElement("style");
  st.textContent = [
    ".uzr.uh-flag .co{display:none!important}",
    ".uzr.uh-stat .ustat{visibility:hidden!important}",
    ".uzr.uh-name .u-topic{display:none!important}",
    ".uzr.uh-msg .u-msg{display:none!important}",
    ".uzr.uh-hash .uhash{display:none!important}",
    "#upro.uh-flag .u-co{display:none!important}",
    "#upro.uh-name .pc-name,#upro.uh-name .pc-title{visibility:hidden!important}",
    "#upro.uh-msg .u-msg{display:none!important}",
    ".mm.uh-name .u-topic,.notification.uh-name .u-topic{display:none!important}",
    ".fth-post.uh-name .fth-topic,.fth-cm.uh-name .fth-cm-t{display:none!important}",
    ".u-rply.uh-name .item3,.isreply.uh-name .item3{display:none!important}"
  ].join("\n");
  document.head.appendChild(st);

  function maskOf(u) {
    if (!u || !u.ifedit) return 0;
    return ((u.uhide | 0) & 31);
  }

  function apply($el, mask) {
    if (!$el || !$el.length) return;
    $el.toggleClass("uh-flag", !!(mask & F.flag))
       .toggleClass("uh-stat", !!(mask & F.stat))
       .toggleClass("uh-name", !!(mask & F.name))
       .toggleClass("uh-msg", !!(mask & F.msg))
       .toggleClass("uh-hash", !!(mask & F.hash));
  }

  function findUser(key) {
    try {
      if (key == null || key === "") return null;
      if (U_CASH[key]) return U_CASH[key];
      if (typeof getuserbylid === "function") return getuserbylid(key) || null;
    } catch (e) {}
    return null;
  }

  /* وسم عنصر (رسالة/منشور/تنبيه) بصاحبه عشان الإخفاء يتطبق عليه ويتحدّث لحظياً */
  window.uhideTag = function ($el, key, nameOnly) {
    try {
      if (!$el || !$el.length || key == null || key === "") return;
      $el.attr("data-uh", key);
      if (nameOnly) $el.attr("data-uhn", "1");
      applyTagged($el, findUser(key));
    } catch (e) {}
  };

  function applyTagged($el, u) {
    var m = maskOf(u);
    $el.each(function () {
      var $x = $(this);
      if ($x.attr("data-uhn")) $x.toggleClass("uh-name", !!(m & F.name));
      else apply($x, m);
    });
  }

  /* اسم للعرض في القوائم اللي جاية من الداتابيز (الأوائل ...) */
  window.uhideName = function (u) {
    return maskOf(u) & F.name ? "—" : (u && u.topic) || "";
  };

  function applyUser(id) {
    try {
      var u = U_CASH[id];
      if (!u) return;
      var m = maskOf(u);
      /* [FIX-F07] مع القائمة الافتراضية: الصف الظاهر يُجاب من VLIST (ويعاد تطبيق
         الإخفاء تلقائياً عند إعادة رسم الصف لأن wrapper updateu يستدعي applyUser) */
      var __r = (window.VLIST ? VLIST.rowOf(id) : null) || (U_X && U_X[id] && U_X[id].jquery ? U_X[id] : null);
      if (__r) apply(__r, m);
      /* [FIX-S24] نفس فكرة توقيع nfont [FIX-S23]: المسح الشامل لعناصر
         [data-uh] على مستوى الصفحة كلها صار فقط عند تغيّر قناع الإخفاء
         فعلياً — قبل كده كل تحديث لأي مستخدم (حالة/صورة/لايك/نقاط) كان
         بيعمل 2 مسح عالمي إضافيين لكل مستخدم في كل دفعة uB = سخونة
         واضحة في الغرف النشطة. الصف الظاهر (عنصر واحد) بيتطبق دايماً. */
      if (u.__uhs !== undefined) {
        if (u.__uhs === m) return;
        u.__uhs = m;
      } else {
        u.__uhs = m;
        if (!m) return;   /* أول مرة بلا إخفاء: مافيش كلاسات قديمة تتنضف */
      }
      var $c = $("#c" + id);
      if ($c.length) apply($c.find(".uzr"), m);
      apply($(".w" + id + " .head .uzr"), m);
      applyTagged($('[data-uh="' + id + '"]'), u);
      if (u.lid != null) applyTagged($('[data-uh="' + u.lid + '"]'), u);
    } catch (e) {}
  }
  window.uhideApplyUser = applyUser;

  function applyProfile(id) {
    try {
      var u = U_CASH[id];
      var $p = $("#upro");
      var m = maskOf(u);
      $p.toggleClass("uh-flag", !!(m & F.flag))
        .toggleClass("uh-name", !!(m & F.name))
        .toggleClass("uh-msg", !!(m & F.msg));
    } catch (e) {}
  }

  var currentProfile = null;

  /* ربط updateu: كل تحديث للصف يعيد تطبيق الإخفاء */
  (function hookUpdate() {
    if (typeof window.updateu !== "function") return setTimeout(hookUpdate, 300);
    if (window.updateu.__uh) return;
    var orig = window.updateu;
    var wrapped = function (id) {
      var r = orig.apply(this, arguments);
      applyUser(id);
      try { if (currentProfile != null && id == currentProfile && $("#upro").is(":visible")) applyProfile(id); } catch (e) {}
      return r;
    };
    wrapped.__uh = true;
    window.updateu = wrapped;
  })();

  /* ربط فتح البروفايل (PC_ONPROFILE بيتنادى من upro) */
  (function hookProfile() {
    if (typeof window.PC_ONPROFILE !== "function") return setTimeout(hookProfile, 300);
    if (window.PC_ONPROFILE.__uh) return;
    var orig = window.PC_ONPROFILE;
    var wrapped = function (id) {
      var r = orig.apply(this, arguments);
      currentProfile = id;
      applyProfile(id);
      return r;
    };
    wrapped.__uh = true;
    window.PC_ONPROFILE = wrapped;
  })();

  /* أول تحميل للقايمة: طبّق على كل الصفوف الموجودة */
  window.uhideApplyAll = function () {
    try { for (var id in U_CASH) applyUser(id); } catch (e) {}
  };
  setTimeout(function again() {
    if (typeof U_CASH === "undefined") return setTimeout(again, 500);
    window.uhideApplyAll();
  }, 1500);
})();
