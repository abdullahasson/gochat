/* [ADDED - GLOW] نواة التوهج: توهج خلفية لون الاسم + توهج حواف البروفايل.
   box-shadow ثابت فقط (من غير animation/transition/filter) — أخف تكلفة ممكنة على الأداء.
   القيم: لون #rrggbb أو فاضي (فاضي = من غير توهج). */
(function () {
  'use strict';
  if (window.mdGlow) return;
  var HEX = /^#[0-9a-f]{6}$/i;
  function valid(v) { return HEX.test(v || ''); }
  function rgba(h, a) { return 'rgba(' + parseInt(h.substr(1, 2), 16) + ',' + parseInt(h.substr(3, 2), 16) + ',' + parseInt(h.substr(5, 2), 16) + ',' + a + ')'; }
  /* طبقتين ناعمتين: قريبة خفيفة + بعيدة أنعم، من غير أي حافة حادة */
  function nameCss(h) { return valid(h) ? '0 0 4px 1px ' + rgba(h, 0.5) + ', 0 0 12px 3px ' + rgba(h, 0.28) : ''; }
  function edgeCss(h) { return valid(h) ? '0 0 6px 2px ' + rgba(h, 0.9) + ', 0 0 16px 5px ' + rgba(h, 0.6) + ', 0 0 30px 8px ' + rgba(h, 0.3) : ''; }
  function put(el, css) {
    if (!el) return;
    if (css) el.style.setProperty('box-shadow', css, 'important'); else el.style.removeProperty('box-shadow');
  }
  function applyName(el, h) { put(el, nameCss(h)); }
  function applyEdge(el, h) { put(el, edgeCss(h)); } /* حجم البروفايل ما بيتغيّرش */
  /* اسم رسالة الغرفة: توهج بنفس شكل خلفية الاسم (الحواف المدوّرة من name-bg-round.css) — box-shadow بيتبع border-radius تلقائي */
  function applyMsgName(el, h) {
    if (!el) return;
    /* [شكل الصورة المرجعية] توهج داخلي على الحواف (بيتدرّج لجوه الخلفية) + خط رفيع على الحافة + ظل خفيف بره — بيتبع الحواف المدوّرة */
    if (valid(h)) el.style.setProperty('box-shadow', 'inset 0 0 9px 1px ' + rgba(h, 0.85) + ', inset 0 0 0 1px ' + rgba(h, 0.6) + ', 0 0 5px 1px ' + rgba(h, 0.45), 'important');
    else el.style.removeProperty('box-shadow');
    el.style.removeProperty('border-radius');
  }
  window.mdGlow = { applyMsgName: applyMsgName, valid: valid, nameCss: nameCss, edgeCss: edgeCss, applyName: applyName, applyEdge: applyEdge };

  /* البروفايل: نلفّ memberDesignApplyUser مرة واحدة بعد ما كل السكريبتات (defer) تتحمّل — من غير تعديل member-design.js.
     الحافة على .modal-content (كارت البروفايل) والاسم على .modal-title. */
  function install() {
    var f = window.memberDesignApplyUser;
    if (typeof f !== 'function' || f.__glow) return;
    var w = function (u) {
      var r = f.apply(this, arguments);
      try {
        var $ = window.jQuery;
        if ($) {
          applyEdge($('#upro .modal-content')[0], u && u.edge_glow);
          applyName($('#upro .modal-title')[0], ''); cleanProfile(); /* توهج الاسم مش بيظهر في البروفايل */
        }
      } catch (e) {}
      return r;
    };
    w.__glow = true;
    window.memberDesignApplyUser = w;
  }
  /* تنضيف: توهج الاسم مش بيظهر في البروفايل + شيل أي أثر لتوسيع النافذة من نسخ قديمة */
  function cleanProfile() {
    try {
      var m = document.getElementById('upro'); if (!m) return;
      m.classList.remove('md-eglow');
      var t = m.querySelector('.modal-title'); if (t) t.style.removeProperty('box-shadow');
      var ss = document.getElementsByTagName('style');
      for (var i = ss.length - 1; i >= 0; i--) if (ss[i].textContent.indexOf('md-eglow') > -1) ss[i].parentNode.removeChild(ss[i]);
    } catch (e) {}
  }
  cleanProfile();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();
