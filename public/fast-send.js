/*
 * [PERF-FIX] fast-send.js — إرسال لحظي للعام والخاص (Optimistic UI)
 * اللي بيحصل: أول ما العضو يضغط إرسال، الرسالة بتظهر عنده في نفس اللحظة (من غير انتظار السيرفر)،
 * والرسالة بتتبعت للسيرفر برقم تعريف (cid). لما رد السيرفر يوصل بنفس الـ cid بنستبدل النسخة المحلية بالنسخة الرسمية
 * (فيها رقم الرسالة للحذف/الرد، وبعد فلترة الاختصارات)، وبنفس الشكل بالظبط فمفيش رعشة.
 * لو السيرفر رفض الرسالة (إسكات / فلتر / عضو أوفلاين) بتتعلّم "لم تُرسل" وبتتشال لوحدها.
 *
 * بيتحمّل بعد x2.js و silent-reconnect.js، ومبيعدّلش x2.js:
 *   - بيلفّ SEND_EVENT_EMIT (لرسايل النص بس؛ الصور/الملفات/الروابط شغالة زي ما هي)
 *   - بيلفّ AddMsg (لاستبدال الرسالة المحلية)
 *   - بيلفّ ON_DATE_SEND (لاستقبال رفض السيرفر msgfail)
 */
(function () {
  "use strict";
  if (window.__fastSend) return;
  window.__fastSend = true;

  var PENDING = {}; /* cid => { node, wid, timer } */
  var FAIL_AFTER = 9000; /* مفيش رد من السيرفر => نعلّم إنها لم تُرسل */
  var REMOVE_AFTER = 8000; /* بعد العلامة بنشيلها */

  function newCid() {
    return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
  function esc(t) {
    return String(t).split("<").join("&#x3C;"); /* نفس تعقيم السيرفر */
  }
  function connected() {
    return !!(window.socket && window.socket.connected);
  }
  function bottom(wid) {
    var w = $(wid);
    if (w.length) w.scrollTop(w[0].scrollHeight);
  }

  /* ===== الرسالة المحلية ===== */
  function echo(wid, data, cid) {
    var me = window.U_CASH && window.U_CASH[window.M_ID];
    if (!me || !$(wid).length) return;
    var d = {
      uid: window.M_ID,
      pic: me.pic,
      copic: me.copic || "none",
      topic: me.topic,
      ucol: me.ucol,
      mcol: me.mcol,
      bg: me.bg,
      msg: esc(data.msg),
      reply: data.reply || null,
      class: "fs-pending fs-p" + cid
    };
    var node = window.AddMsg(wid, d);
    if (!node) return;
    var p = (PENDING[cid] = { node: node, wid: wid, timer: null });
    p.timer = setTimeout(function () {
      fail(cid);
    }, FAIL_AFTER);
  }

  /* ===== فشل الإرسال ===== */
  function fail(cid) {
    var p = PENDING[cid];
    if (!p) return;
    clearTimeout(p.timer);
    p.node.css("opacity", ".55").find(".u-msg").first().append(' <span style="color:#d00;font-size:11px">⚠ لم تُرسل</span>');
    p.timer = setTimeout(function () {
      p.node.remove();
      delete PENDING[cid];
    }, REMOVE_AFTER);
  }

  /* ===== 1) لفّ SEND_EVENT_EMIT ===== */
  var _emit = window.SEND_EVENT_EMIT;
  window.SEND_EVENT_EMIT = function (cmd, data) {
    var cid = null, kind = null;
    try {
      if (
        data && typeof data === "object" && !data.cid && !data.link &&
        typeof data.msg === "string" && data.msg.replace(/\s/g, "") !== "" &&
        window.M_ID && connected()
      ) {
        if (cmd === "SEND_EVENT_EMIT_MSG") kind = "msg";
        else if (cmd === "SEND_EVENT_EMIT_PM" && typeof data.id === "string") kind = "pm";
        if (kind) {
          cid = newCid();
          data.cid = cid;
        }
      }
    } catch (e) { cid = null; }
    var res = _emit.apply(this, arguments); /* الإرسال للسيرفر الأول */
    if (cid) {
      try {
        echo(kind === "msg" ? "#d2" : "#d2" + data.id, data, cid);
      } catch (e) {}
    }
    return res;
  };

  /* ===== 2) لفّ AddMsg: لما الرد الرسمي يوصل نستبدل المحلي ===== */
  var _add = window.AddMsg;
  window.AddMsg = function (wid, data) {
    var node = _add.apply(this, arguments);
    try {
      var cid = data && data.cid;
      var p = cid && PENDING[cid];
      if (p) {
        clearTimeout(p.timer);
        delete PENDING[cid];
        p.node.remove();
        bottom(wid);
      }
    } catch (e) {}
    return node;
  };

  /* ===== 3) رفض السيرفر ===== */
  var _on = window.ON_DATE_SEND;
  window.ON_DATE_SEND = function (cmd, data) {
    if (cmd === "msgfail") {
      if (data && data.cid) fail(data.cid);
      return;
    }
    return _on.apply(this, arguments);
  };
})();
