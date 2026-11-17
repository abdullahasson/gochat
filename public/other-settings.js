/* ==========================================================
   "الإعدادات الأخرى" — قايمة موحّدة في إعدادات المستخدم
   جواها: تصميم العضوية + وضع الرابط (يوتيوب/ساوند/انستا/تيك توك)
   الاستخدام: openOtherSettings() / closeOtherSettings()
   ========================================================== */
(function () {
  "use strict";

  var CSS = [
    /* الزر في الإعدادات */
    ".oth-open{position:relative;display:flex;align-items:center;justify-content:space-between;gap:10px;direction:rtl;width:98%;margin:3px 6px 3px 4px;padding:9px 14px;border:0;border-radius:14px;clear:both;background:linear-gradient(135deg,#16213a 0%,#22345c 100%);color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.35);box-shadow:0 4px 12px rgba(22,33,58,.45),inset 0 1px 0 rgba(255,255,255,.18),inset 0 0 0 1px rgba(120,150,220,.25);overflow:hidden;cursor:pointer;transition:transform .15s,box-shadow .15s;-webkit-tap-highlight-color:transparent;font-family:inherit}",
    ".oth-open .oth-t{flex:1;text-align:center;font-size:16px;font-weight:700;letter-spacing:.3px}",
    ".oth-open .oth-ic{flex:0 0 auto;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1;background:rgba(255,255,255,.16);box-shadow:0 0 0 2px rgba(255,255,255,.28)}",
    ".oth-open .oth-a{flex:0 0 auto;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.16);box-shadow:0 0 0 2px rgba(255,255,255,.28);font-size:22px;line-height:1}",
    ".oth-open:after{content:'';position:absolute;top:0;left:0;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.28),transparent);transform:skewX(-20deg) translateX(-150%);animation:othShine 4.2s ease-in-out infinite;pointer-events:none;will-change:transform}",
    ".oth-open:active{transform:scale(.97)}",
    /* [FIX-S22] كانت الحركة على left (خاصية Layout) = إعادة حساب تخطيط ورسوم
       للمين ثريد كل فريم بشكل لانهائي وانت بتكلم في الشات — نفس الشكل بالضبط
       لكن على transform: تتحرك على الكومبوزيتور (GPU) بصفر تكلفة على المين ثريد */
    "@keyframes othShine{0%,55%{transform:skewX(-20deg) translateX(-150%)}100%{transform:skewX(-20deg) translateX(325%)}}",
    ".oth-open+.gm-open,.oth-open+label.gm-open{margin:3px 6px 3px 4px!important}",
    /* الصفحة (بدل النافذة المنبثقة) */
    "#othpage{height:100%;width:100%;background:linear-gradient(180deg,#5a3fa0 0%,#3d1f78 14%,#34176b 55%,#3a3590 100%)!important;overflow-y:auto!important;overflow-x:hidden!important;padding:0!important}",
    "#othpage .og{direction:rtl;min-height:100%;padding:0 12px 24px;box-sizing:border-box;font-family:inherit}",
    "#othpage .og *{box-sizing:border-box}",
    "#othpage .og-head{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 -12px 12px;padding:10px 12px;background:#6b4750}",
    "#othpage .og-head b{flex:1;color:#fff;font-size:17px!important;font-weight:700}",
    "#othpage .og-back{flex:0 0 auto;height:34px;padding:0 14px;border:0!important;border-radius:17px!important;background:#f9f4fa!important;color:#1e7bea!important;display:flex;align-items:center;gap:6px;cursor:pointer;font-size:15px!important;box-shadow:0 1px 3px rgba(0,0,0,.2)}",
    "#othpage .og-back .fa{font-family:FontAwesome!important;color:#1e7bea!important;font-size:15px!important}",
    "#othpage .og-it{position:relative;display:flex;align-items:center;gap:12px;width:100%;height:74px;margin:0 0 12px;padding:0 14px;border:1px solid rgba(255,255,255,.14);border-radius:24px;color:#fff;cursor:pointer;text-align:right;-webkit-tap-highlight-color:transparent;transition:transform .12s;font-family:inherit;box-shadow:0 4px 14px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.18)}",
    "#othpage .og-it:active{transform:scale(.97)}",
    "#othpage .og-it.c1{background:linear-gradient(100deg,#e86ac3 0%,#b845e8 55%,#8a3fe0 100%)}",
    "#othpage .og-it.c2{background:linear-gradient(100deg,#ee3a7d 0%,#c243c9 100%)}",
    "#othpage .og-it.c3{background:linear-gradient(100deg,#2a9ac9 0%,#4a58b8 100%)}",
    "#othpage .og-it.c4{background:linear-gradient(100deg,rgba(150,95,180,.75),rgba(110,60,150,.75))}",
    "#othpage .og-no{order:4;flex:0 0 38px;width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px!important;font-weight:700;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.3)}",
    "#othpage .og-ic{order:3;flex:0 0 52px;width:52px;height:52px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 3px 8px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.4)}",
    "#othpage .og-ic.a{background:linear-gradient(135deg,#e46af0,#9b3fe8)}",
    "#othpage .og-ic.b{background:linear-gradient(135deg,#ffb347,#f08a1b)}",
    "#othpage .og-ic.c{background:linear-gradient(135deg,#b49bff,#8a63f0)}",
    "#othpage .og-ic.d{background:linear-gradient(135deg,#43e0c0,#1fa89a)}",
    "#othpage .og-tx{flex:1;min-width:0;order:1;text-align:right}",
    "#othpage .og-tt{display:block;font-size:19px!important;font-weight:700!important;line-height:1.3}",
    "#othpage .og-sb{display:block;margin-top:2px;font-size:12px!important;opacity:.8;font-weight:400}",
    "#othpage .og-bg{flex:0 0 auto;order:2;min-width:24px;padding:2px 8px;border-radius:12px;background:#ffd23f;color:#5a2d00;font-size:12px!important;font-weight:800;text-align:center}",
    "#othpage .og-ch{flex:0 0 auto;order:0;font-size:22px;opacity:.5;line-height:1}",
    "#othpage .og-dots{display:flex;align-items:center;justify-content:center;gap:10px;height:14px;margin:-2px 0 12px;position:relative}",
    "#othpage .og-dots:before{content:'';position:absolute;left:4%;right:4%;top:50%;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.28),transparent)}",
    "#othpage .og-dots i{position:relative;width:11px;height:11px;border-radius:50%;background:#fff;opacity:.92}",
    "#othpage .og-sec{display:flex;align-items:center;gap:10px;margin:4px 6px 12px;color:rgba(255,255,255,.55);font-size:20px!important}",
    "#othpage .og-sec .og-no{flex:0 0 34px;width:34px;height:34px;border-radius:50%;background:#fff;color:#4b2a86;border:0;font-size:19px!important}",
    "#othpage .og-sw{flex:0 0 auto;order:0;position:relative;width:76px;height:38px;border-radius:19px;background:#e4e7ef;box-shadow:inset 0 1px 3px rgba(0,0,0,.25);transition:background .18s}",
    "#othpage .og-sw:after{content:'';position:absolute;top:3px;left:3px;width:32px;height:32px;border-radius:50%;background:#fff;box-shadow:0 2px 5px rgba(0,0,0,.3);transition:transform .18s}",
    "#othpage .og-sw.on{background:#2fd16f!important}",
    "#othpage .og-sw.on:after{transform:translateX(38px)!important}",
    "#othpage .og-it.m1{background:linear-gradient(100deg,#05d8f5 0%,#1a6ee6 100%)}",
    "#othpage .og-it.m1 .og-ic{order:4;width:46px;height:46px;flex-basis:46px;background:linear-gradient(135deg,#c58cf5,#8a52e6)}"
  ].join("\n");

  var st = document.createElement("style");
  st.textContent = CSS;
  document.head.appendChild(st);

  var root, built = false;

  function $id(i) { return document.getElementById(i); }

  function canDesign() {
    try {
      var u = (typeof U_CASH !== "undefined" && typeof M_ID !== "undefined" && U_CASH[M_ID]) || {};
      return !!u.ifedit;
    } catch (e) { return false; }
  }

  function hasLink() {
    try { return ($(".urluto").val() || "").trim().length > 0; } catch (e) { return false; }
  }

  function build() {
    if (built) return;
    root = $id("othpage");
    if (!root) return;
    root.innerHTML =
      '<div class="og">' +
        '<div class="og-head">' +
          '<button type="button" class="og-back" title="الإعدادات" data-toggle="tab" data-target="#settings" ' +
            'onclick="$(\'.pnhead\').text($(this).attr(\'title\'));$(\'.dpnl\').show();">' +
            '<i class="fa fa-arrow-left"></i><span>عودة</span></button>' +
          '<b>الاضافات والميزات</b>' +
        '</div>' +
        '<div id="othLs"></div>' +
      '</div>';
    root.addEventListener("click", onClick);
    built = true;
  }

  function dots() { return '<div class="og-dots"><i></i><i></i><i></i></div>'; }

  function row(act, n, color, iconCls, icon, title, sub, badge, tabTarget) {
    return '<div class="og-it ' + color + '" data-a="' + act + '"' +
      (tabTarget ? ' title="' + title + '" data-toggle="tab" data-target="' + tabTarget + '"' : '') + '>' +
      '<span class="og-no">' + n + '</span>' +
      '<span class="og-ic ' + iconCls + '">' + icon + '</span>' +
      '<span class="og-tx"><span class="og-tt">' + title + '</span>' + (sub ? '<span class="og-sb">' + sub + '</span>' : '') + '</span>' +
      (badge ? '<span class="og-bg">' + badge + '</span>' : '') +
      '<span class="og-ch">‹</span></div>';
  }

  function sndOn() {
    try { return localStorage.getItem("ntmute") !== "1"; } catch (e) {}
    try { return !(window.getv && getv("ntmute") === "1"); } catch (e) { return true; }
  }

  function fill() {
    var h = "", n = 1;
    var nc = (window.ntCount ? ntCount() : 0);
    if (canDesign()) {
      h += row("design", n++, "c1", "a", "🎨", "تصميم العضوية", "خلفيات وإطارات وإظهار / إخفاء", "");
      h += dots();
    }
    h += row("notif", n++, "c2", "b", "🔔", "الإشعارات", "زيارات البروفايل · الإعجابات · التنبيهات", nc > 0 ? String(nc > 99 ? "99+" : nc) : "");
    h += row("link", n++, "c3", "c", "🔗", hasLink() ? "تعديل الرابط" : "وضع الرابط",
      "يوتيوب · ساوند كلاود · انستجرام · تيك توك", hasLink() ? "مفعّل" : "");
    h += dots();
    h += row("trend", n++, "c4", "d", "📈", "ترند الحائط", "الأكثر نشراً · دردشة · إعجابات", "", "#wtrend");
    h += dots();
    h += '<div class="og-sec"><span class="og-no">' + (n++) + '</span><span>خيارات الكتم</span></div>';
    h += '<div class="og-it m1" data-a="ntsnd"><span class="og-ic">🔕</span>' +
      '<span class="og-tx"><span class="og-tt" style="font-size:17px!important">كتم صوت الإشعارات</span></span>' +
      '<span class="og-sw' + (sndOn() ? '' : ' on') + '" role="switch" aria-checked="' + (sndOn() ? 'false' : 'true') + '"></span></div>';
    $id("othLs").innerHTML = h;
  }

  function onClick(e) {
    var t = e.target.closest ? e.target.closest("[data-a]") : null;
    if (!t) return;
    var a = t.getAttribute("data-a");
    if (a === "notif") {
      var b = document.querySelector(".nt-open");
      if (b) b.click();
      return;
    }
    if (a === "ntsnd") {
      var was = sndOn();           /* true = الصوت شغال حالياً */
      if (window.ntToggleSound) { try { ntToggleSound(); } catch (x) {} }
      if (sndOn() === was) {       /* لو الدالة ما غيّرتش الحالة نغيّرها بنفسنا */
        try { localStorage.setItem("ntmute", was ? "1" : "0"); } catch (x) {}
      }
      var sw = t.querySelector(".og-sw");
      if (sw) {
        var muted = !sndOn();
        sw.classList.toggle("on", muted);
        sw.style.background = muted ? "#2fd16f" : "";
        sw.setAttribute("aria-checked", muted ? "true" : "false");
      }
      return;
    }
    if (a === "trend") {
      $(".pnhead").text("ترند الحائط");
      $(".dpnl").show();
      if (typeof WALLTREND_LOAD === "function") WALLTREND_LOAD();
      return;
    }
    if (a === "design") {
      if (typeof openDesign === "function") openDesign();
      return;
    }
    if (a === "link") {
      if (typeof openMediaLink === "function") openMediaLink();
    }
  }

  /* بتتنده من الزر (onclick) — الانتقال للصفحة بيتم بـ data-toggle="tab" */
  window.openOtherSettings = function () {
    build();
    fill();
  };

  window.closeOtherSettings = function () {
    var b = document.querySelector("#othpage .og-back");
    if (b) b.click();
  };
})();
