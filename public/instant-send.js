/* ==========================================================
   إرسال لحظي لرسائل الغرفة (Optimistic send)
   - أول ما العضو يضغط إرسال، الرسالة تظهر عنده فوراً من غير ما تستنى السيرفر
   - بتتبعت للسيرفر ومعاها معرّف cid، والسيرفر يرجّعه مع البث
   - لما نسخة السيرفر توصل (نفس cid) بتحل مكان النسخة المحلية في نفس اللحظة
   - لو السيرفر رفض الرسالة (إسكات / فلتر / لايكات...) بيبعت msgrej فتتشال النسخة المحلية
   - لو مفيش رد خلال 6 ثواني (قطع اتصال / ريت لميت) النسخة بتتعلّم "لم تُرسل" وتتشال بعد شوية
   - الرسائل اللي فيها رابط (صور/ملصقات) والإسكات المعروف عند العميل بتفضل زي ما هي
   - مفيش أي تعديل على x2.js: الربط بالدوال العامة (SEND_EVENT_EMIT / AddMsg / ON_DATE_SEND)
   ========================================================== */
(function () {
  "use strict";
  var FAIL_MS = 6000;     /* بعدها الرسالة تتعلّم إنها ما وصلتش */
  var CLEAN_MS = 8000;    /* بعد التعليم بكام ثانية تتشال */
  var MAX_LEN = 2000;     /* حماية للـ DOM فقط؛ السيرفر هو اللي بيقص بالطول الحقيقي */
  var pend = {};          /* cid -> { el, t } */

  function rid() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }
  function esc(s) { return String(s == null ? "" : s).split("<").join("&#x3C;"); }

  function drop(cid) {
    var p = pend[cid];
    if (!p) return;
    delete pend[cid];
    clearTimeout(p.t);
    clearTimeout(p.t2);
    try { if (p.el && p.el.parentNode) p.el.parentNode.removeChild(p.el); } catch (e) {}
  }

  function fail(cid) {
    var p = pend[cid];
    if (!p || !p.el) return;
    try {
      p.el.style.opacity = ".45";
      var m = p.el.querySelector(".u-msg");
      if (m) {
        var w = document.createElement("div");
        w.style.cssText = "color:#d33;font-size:11px;margin-top:2px";
        w.textContent = "⚠ لم تُرسل";
        m.appendChild(w);
      }
    } catch (e) {}
    p.t2 = setTimeout(function () { drop(cid); }, CLEAN_MS);
  }

  /* عرض الرسالة محلياً بنفس قالب الرسائل، وترجع cid (أو null لو مش هنعرضها) */
  function optimistic(t) {
    try {
      if (typeof M_ID === "undefined" || !M_ID || typeof U_CASH === "undefined") return null;
      var u = U_CASH[M_ID];
      if (!u || typeof window.AddMsg !== "function") return null;
      /* مسكّت: خلفية خانة الكتابة رمادية (نفس الإشارة اللي x2.js بيستخدمها) */
      if (window.jQuery && jQuery("#tbox").css("background-color") === "rgb(170, 170, 175)") return null;
      var cid = rid();
      var rp = t.reply;
      var data = {
        bg: u.bg,
        copic: u.copic,
        cid: cid,
        reply: rp ? { id: rp.id, uid: rp.uid, topic: esc(rp.topic), msg: esc(rp.msg) } : null,
        mcol: u.mcol,
        uid: M_ID,
        msg: esc(t.msg).slice(0, MAX_LEN),
        pic: u.pic,
        topic: u.topic,
        ucol: u.ucol
      };
      var $m = window.AddMsg("#d2", data);   /* بترجع عنصر الرسالة */
      var el = $m && $m[0];
      if (!el) return null;
      pend[cid] = { el: el, t: setTimeout(function () { fail(cid); }, FAIL_MS) };
      return cid;
    } catch (e) { return null; }
  }

  /* 1) اعتراض الإرسال: أي رسالة نص للغرفة */
  (function hookEmit() {
    if (typeof window.SEND_EVENT_EMIT !== "function") return setTimeout(hookEmit, 300);
    if (window.SEND_EVENT_EMIT.__is) return;
    var orig = window.SEND_EVENT_EMIT;
    var w = function (e, t) {
      if (e === "SEND_EVENT_EMIT_MSG" && t && typeof t.msg === "string" && t.msg && !t.link && !t.cid) {
        var cid = optimistic(t);
        if (cid) t.cid = cid;
      }
      return orig.apply(this, arguments);
    };
    w.__is = true;
    window.SEND_EVENT_EMIT = w;
  })();

  /* 2) وصول نسخة السيرفر: تحل مكان المحلية في نفس اللحظة (من غير وميض) */
  (function hookAdd() {
    if (typeof window.AddMsg !== "function") return setTimeout(hookAdd, 300);
    if (window.AddMsg.__is) return;
    var orig = window.AddMsg;
    var w = function (wid, data) {
      try { if (data && data.cid && pend[data.cid]) drop(data.cid); } catch (e) {}
      return orig.apply(this, arguments);
    };
    w.__is = true;
    window.AddMsg = w;
  })();

  /* 3) رفض السيرفر للرسالة */
  (function hookServer() {
    if (typeof window.ON_DATE_SEND !== "function") return setTimeout(hookServer, 300);
    if (window.ON_DATE_SEND.__is) return;
    var orig = window.ON_DATE_SEND;
    var w = function (cmd, data) {
      if (cmd === "msgrej") {
        try { if (data && data.cid) drop(data.cid); } catch (e) {}
        return;
      }
      return orig.apply(this, arguments);
    };
    w.__is = true;
    window.ON_DATE_SEND = w;
  })();
})();
