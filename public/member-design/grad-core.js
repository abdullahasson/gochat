/* =====================================================================================
   [ADDED - GRAD CORE] نواة التدرج اللوني (ملف مستقل صغير، بيتحمّل مع الصفحة).
   الصيغة المخزّنة (نص واحد، متوافقة مع القديم):
     "#rrggbb"                      → لون سادة (زي ما كان)
     "h:#aaaaaa:#bbbbbb:#cccccc"    → تدرج أفقي   (الأول على اليمين)
     "v:#aaaaaa:#bbbbbb:#cccccc"    → تدرج عمودي  (الأول فوق)
     "m:#aaaaaa:#bbbbbb:#cccccc"    → تدرج مختلط  (قطري من أعلى اليمين)
   الدوال: valid / parse / encode / css / solid — بتتستخدم في الاستوديو وفي أماكن العرض.
   ===================================================================================== */
(function () {
  'use strict';
  if (window.mdGrad) return;
  var HEX = /^#[0-9a-f]{6}$/i;
  var ENC = /^([hvm]):(#[0-9a-f]{6}(?::#[0-9a-f]{6}){2,4})$/i; /* [CHANGED - 5 COLORS] 3 ألوان (القديم) أو 5 ألوان */
  var DIR = { h: 'to left', v: 'to bottom', m: 'to bottom left' };

  /* [ADDED] تحليل القيمة → {mode, c:[3 ألوان]} أو null لو مش صالحة (mode فاضي = لون سادة) */
  function parse(v) {
    v = String(v == null ? '' : v).trim();
    if (HEX.test(v)) return { mode: '', c: [v.toLowerCase(), v.toLowerCase(), v.toLowerCase()] };
    var m = ENC.exec(v);
    if (!m) return null;
    var cs = m[2].toLowerCase().split(':');
    if (cs.length !== 3 && cs.length !== 5) return null;
    return { mode: m[1].toLowerCase(), c: cs };
  }
  function valid(v) { return !!parse(v); }
  /* [ADDED] ترميز: لو التلات ألوان متطابقين يرجع لون سادة عشان يفضل متوافق مع أي مكان لسه بيفهم #hex بس */
  function encode(mode, c) {
    if (!c || (c.length !== 3 && c.length !== 5)) return '';
    c = c.map(function (x) { return String(x).toLowerCase(); });
    for (var i = 0; i < c.length; i++) if (!HEX.test(c[i])) return '';
    /* [CHANGED - 5 COLORS] لو اللونين الأخيرين = اللون التالت يرجع للصيغة القديمة (3 ألوان) */
    if (c.length === 5 && c[3] === c[2] && c[4] === c[2]) c = c.slice(0, 3);
    if (c.every(function (x) { return x === c[0]; })) return c[0];
    if (!DIR[mode]) mode = 'h';
    return mode + ':' + c.join(':');
  }
  /* [ADDED] CSS للتدرج (فاضي لو لون سادة أو قيمة غير صالحة) */
  function css(v) {
    var p = parse(v);
    if (!p || !p.mode) return '';
    return 'linear-gradient(' + DIR[p.mode] + ',' + p.c.join(',') + ')';
  }
  /* [ADDED] اللون السادة (فاضي لو تدرج) */
  function solid(v) { var p = parse(v); return (p && !p.mode) ? p.c[0] : ''; }

  /* [ADDED - PHASE 3/4] تطبيق خلفية على عنصر (اسم/أي عنصر): لون سادة عادي، أو تدرج.
     التدرج مش بيتحط في background-image inline (لأن اللمعات name-glitter بتقرا/بتكتب background-image على نفس عنصر الاسم)،
     بل في متغير CSS --mdg-grad + background-color احتياطي (أول لون) — grad-core.css بيرسم التدرج منه.
     وجود background-color inline كمان بيخلي name-bg-round.css (الحواف المدوّرة) يفضل شغال على الأسماء. */
  /* [FIX - NO DEFAULT BG] الأبيض الافتراضي (#fff / #ffffff) أو none = من غير خلفية خالص. أي لون تاني أو تدرج بيمشي زي ما هو. */
  function nameBg(v) {
    v = String(v == null ? '' : v).trim().toLowerCase();
    if (!v || v === 'none' || v === '#fff' || v === '#ffffff' || v === '#ffffffff' || v === 'fff' || v === 'ffffff') return '';
    return v;
  }
  function applyBg(el, v) {
    if (!el || !el.style) return;
    v = nameBg(v);
    var p = parse(v);
    if (p && p.mode) {
      el.style.backgroundColor = p.c[0];
      el.style.setProperty('--mdg-grad', css(v));
    } else {
      if (el.style.getPropertyValue('--mdg-grad')) el.style.removeProperty('--mdg-grad');
      el.style.backgroundColor = v || '';
    }
  }
  /* [ADDED] قيمة bg اللي بتتبعت للسيرفر من حقل .sbg: تدرج مرمّز يتبعت زي ما هو، وغير كده نفس الصيغة القديمة (#hex) */
  function bgValue(v) {
    v = String(v == null ? '' : v).trim();
    var p = parse(v);
    if (p && p.mode) return v.toLowerCase();
    return '#' + (v || 'ffffff').split('#').join('');
  }

  window.mdGrad = { nameBg: nameBg, valid: valid, parse: parse, encode: encode, css: css, solid: solid, applyBg: applyBg, bgValue: bgValue };

  /* [ADDED - JQUERY HOOK] كل .css('background-color', تدرج مرمّز) في x2.js / الخاص / الشريط العلوي / قايمة المتصلين
     بتتحول لتدرج تلقائيًا من غير ما نعدّل كل مكان. أي قيمة تانية بتمشي زي ما هي (وبنمسح التدرج القديم لو كان متحط). */
  function hook() {
    var jq = window.jQuery;
    if (!jq || !jq.cssHooks || jq.cssHooks.backgroundColor) return !!(jq && jq.cssHooks);
    jq.cssHooks.backgroundColor = {
      set: function (elem, value) {
        if (typeof value === 'string' && value.charAt(1) === ':' && ENC.test(value)) { applyBg(elem, value); return; } /* undefined = jQuery ما يكتبش بنفسه */
        if (elem.style && elem.style.getPropertyValue('--mdg-grad')) elem.style.removeProperty('--mdg-grad');
        return value;
      }
    };
    return true;
  }
  if (!hook()) document.addEventListener('DOMContentLoaded', hook);
})();
