/* ==========================================================
   [ADDED] ألوان الشريط العلوي (المايكات) والسفلي (الأيقونات) بتتبع لون الموقع
   المشكلة: room-style.css (الشكل البني) و bars-style.js (الشكل الكحلي) كاتبين ألوان ثابتة
   (#6c4548 / #2a3542 ...) بـ !important فلون الموقع من لوحة التحكم ما كانش بيأثّر.
   الحل: بنقرأ لون الموقع الحالي من .label-primary (= "لون الأزرار" في لوحة التحكم،
   وبيتغيّر كمان لو العضو غيّر لونه الشخصي) ونطبّقه على الشريطين في الوضعين.
   ملف إضافة مستقل: لو مش بيتحمّل الألوان ترجع زي ما كانت. مفيش تعديل في أي ملف قديم.
   ========================================================== */
(function () {
  "use strict";
  if (window.__barsSiteColorLoaded) return;
  window.__barsSiteColorLoaded = true;

  /* مصدر اللون: "buttons" = لون الأزرار (.label-primary) — أو "template" = لون القوالب (.bg) */
  var SOURCE = "buttons";

  var probe = null, style = null, last = "";

  function siteColor() {
    try {
      if (!probe) {
        probe = document.createElement("span");
        probe.className = SOURCE === "template" ? "bg" : "label label-primary";
        probe.style.cssText = "display:none!important";
        document.body.appendChild(probe);
      }
      var c = window.getComputedStyle(probe).backgroundColor;
      var m = c && c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?/);
      if (!m) return null;
      if (m[4] !== undefined && parseFloat(m[4]) === 0) return null;
      return [+m[1], +m[2], +m[3]];
    } catch (e) { return null; }
  }

  function hex(c) {
    return "#" + c.map(function (v) {
      v = Math.max(0, Math.min(255, Math.round(v)));
      return (v < 16 ? "0" : "") + v.toString(16);
    }).join("");
  }
  /* مزج مع الأبيض (p>0) أو الأسود (p<0) */
  function mix(c, p) {
    var t = p >= 0 ? 255 : 0, a = Math.abs(p);
    return [c[0] + (t - c[0]) * a, c[1] + (t - c[1]) * a, c[2] + (t - c[2]) * a];
  }
  function lum(c) {
    return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
  }

  function build(c) {
    var C = hex(c);
    var Cl = hex(mix(c, 0.14));      /* حد علوي فاتح (الوضع البني) */
    var Cd = hex(mix(c, -0.6));      /* حد غامق للأزرار (الوضع البني) */
    var L = hex(mix(c, 0.06));       /* بداية التدرج (الوضع الكحلي) */
    var D = hex(mix(c, -0.35));      /* نهاية التدرج */
    var DD = hex(mix(c, -0.7));      /* حدود الشريط */
    var A1 = hex(mix(c, 0.22));      /* التبويب المفتوح */
    var A2 = hex(mix(c, -0.1));
    var light = lum(c) > 0.62;       /* لو اللون فاتح جداً نغمّق الكتابة عشان تتقري */
    var H = "html ";

    var css = [
      /* ===== الوضع الافتراضي (البني): room-style.css ===== */
      H + "body:not(.nb) .broadcasters{background:" + C + "!important;border-top-color:" + Cl + "!important}",
      H + "body:not(.nb) #d0{background:" + C + "!important}",
      H + "body:not(.nb) #d0 .ae{background:" + C + "!important;border-color:" + Cd + "!important}",
      /* ===== وضع الشريط الجديد (الكحلي): bars-style.js ===== */
      H + "body.nb .broadcasters{background:linear-gradient(180deg," + L + " 0%," + D + " 100%)!important;border-bottom-color:" + DD + "!important}",
      H + "body.nb #muteall{border-color:" + DD + "!important;background:radial-gradient(circle at 35% 30%," + L + "," + D + ")!important}",
      H + "body.nb #d0{background:linear-gradient(180deg," + L + " 0%," + D + " 100%)!important;border-top-color:" + DD + "!important}",
      H + "body.nb #d0 .ae.nb-on{background:linear-gradient(180deg," + A1 + " 0%," + A2 + " 100%)!important}",
      H + "body.nb #d0 .ae .nt-badge{box-shadow:0 0 0 2px " + D + "!important}"
    ];

    /* ===== [ADDED v2] باقي العناصر اللي كانت ثابتة اللون ===== */
    var T = light ? "#1a1a1a" : "#fff";   /* لون الكتابة فوق لون الموقع */
    var GR = "linear-gradient(180deg," + L + " 0%," + D + " 100%)";
    var BTN = '>.tablebox.footer>.btn:not([style*="display: none"])';

    /* 1) رسائل الانضمام والتنقلات (شارة اسم الغرفة .roomh) */
    css.push(
      H + "body:not(.nb) .hmsg .roomh," + H + "body:not(.nb) #d2 .roomh{background:" + C + "!important;background-image:none!important;border-color:" + Cd + "!important;color:" + T + "!important}",
      H + "body:not(.nb) .hmsg .roomh::before," + H + "body:not(.nb) #d2 .roomh::before{color:" + T + "!important}",
      H + "body.nb .hmsg .roomh," + H + "body.nb #d2 .roomh{background:" + GR + "!important;background-image:" + GR + "!important;border-color:" + DD + "!important;color:" + T + "!important}"
    );

    /* 2) نافذة الإعدادات الافتراضية (الهيدر + أزرار الاسم + القوائم) */
    css.push(
      H + "#rs-wrap .rs-lb{background:" + C + "!important;border-color:" + Cd + "!important;color:" + T + "!important}",
      H + "#rs-wrap select.rs-sel{background-color:" + C + "!important;border-color:" + Cd + "!important;color:" + T + "!important}",
      H + "#dpnl:has(#settings.active)>.pnhead{background:" + C + "!important;color:" + T + "!important}"
    );

    /* 3) زر العودة داخل المميزات والإضافات (og / wt / wr / xs) */
    [
      "#othpage .og-back", "body.ul #othpage .og-back",
      "#top10 .wt-back", "#wtrend .wr-back", ".xs-back"
    ].forEach(function (sel) {
      css.push(
        H + sel + "{background:" + C + "!important;background-image:none!important;border-color:" + Cd + "!important;color:" + T + "!important}",
        H + sel + " .fa{color:" + T + "!important}",
        H + sel + " span{color:" + T + "!important}"
      );
    });

    /* 4) شريط الكتابة في الغرفة (الأزرار) — الوضع البني: لون الموقع، الوضع الكحلي: تدرّج لون الموقع (ألوان الأيقونات بتفضل زي ما هي) */
    ["#room", ".cont"].forEach(function (P) {
      css.push(
        H + "body:not(.nb) " + P + BTN + "{background:" + C + "!important;background-image:none!important;border-color:" + Cd + "!important;color:" + T + "!important}",
        H + "body:not(.nb) " + P + ">.tablebox.footer>.btn::before{color:" + T + "!important}"
      );
    });
    css.push(
      H + "body.nb #room" + BTN + "{background:" + GR + "!important;background-image:" + GR + "!important;border-color:" + DD + "!important}"
    );
    if (light) {
      ["body:not(.nb)", "body.nb"].forEach(function (b) {
        css.push(H + b + " #d0 .ae," + H + b + " #d0 .ae>span," + H + b + " #d0 .ae::before{color:#1a1a1a!important}");
      });
    }
    return css.join("\n");
  }

  function apply() {
    var c = siteColor();
    if (!c) return;
    var key = c.join(",");
    if (key === last) return;
    last = key;
    if (!style) {
      style = document.createElement("style");
      style.id = "barsSiteColorCss";
      document.head.appendChild(style);
    }
    style.textContent = build(c);
  }

  var tmr = null;
  function later() {
    clearTimeout(tmr);
    tmr = setTimeout(apply, 30);
  }

  function start() {
    apply();
    /* لون العضو الشخصي (saveColor) بيضيف <style> للـ head بعد التحميل، فنعيد القراءة فوراً لما يتضاف */
    if (window.MutationObserver) {
      new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var n = muts[i].addedNodes;
          for (var k = 0; k < n.length; k++) {
            if (n[k].nodeType === 1 && n[k].tagName === "STYLE" && n[k].id !== "barsSiteColorCss") { later(); return; }
          }
          if (muts[i].removedNodes && muts[i].removedNodes.length) { later(); return; }
        }
      }).observe(document.head, { childList: true });
    }
    /* احتياط: إعادة قراءة بعد ما باقي السكريبتات تخلّص */
    setTimeout(apply, 500);
    setTimeout(apply, 2000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
