/* لوحة الإشعارات: كل التنبيهات الواصلة للمستخدم (زيارة بروفايل / إعجاب / مراقبة / تنبيه) + زر مسح + عدّاد الجديد */
(function () {
  var css = [
    /* زر الإشعارات في الإعدادات */
    ".nt-open{position:relative;display:none!important;align-items:center;gap:10px;direction:rtl;width:98%;margin:6px 6px 6px 4px;padding:9px 14px;border:0;border-radius:14px;clear:both;cursor:pointer;color:#fff;font-family:inherit;text-shadow:0 1px 2px rgba(0,0,0,.3);background:linear-gradient(135deg,#ff9f43 0%,#ee5a24 100%);box-shadow:0 4px 12px rgba(238,90,36,.4),inset 0 1px 0 rgba(255,255,255,.3);transition:transform .15s,box-shadow .15s;-webkit-tap-highlight-color:transparent}",
    ".nt-open:active{transform:scale(.97)}",
    ".nt-open .nt-ic{flex:0 0 auto;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:17px;background:rgba(255,255,255,.22);box-shadow:0 0 0 2px rgba(255,255,255,.35)}",
    ".nt-open .nt-t{flex:1;text-align:center;font-size:16px;font-weight:700;letter-spacing:.3px}",
    ".nt-open .nt-a{flex:0 0 auto;font-size:22px;line-height:1;opacity:.85}",
    ".nt-badge{display:none;position:absolute;top:-6px;left:-4px;min-width:22px;height:22px;padding:0 6px;border-radius:11px;background:#e74c3c;color:#fff;font-size:12px;font-weight:700;line-height:22px;text-align:center;box-shadow:0 0 0 2px #fff,0 2px 6px rgba(0,0,0,.35)}",
    ".nt-open.has-new .nt-ic{animation:ntring 1.6s ease-in-out infinite}",
    ".oth-open .nt-badge{top:50%;left:50px;margin-top:-11px;box-shadow:0 0 0 2px #22345c,0 2px 6px rgba(0,0,0,.35)}",
    ".oth-open.has-new .oth-ic{animation:ntring 1.6s ease-in-out infinite}",
    "@keyframes ntring{0%,100%{transform:rotate(0)}10%{transform:rotate(14deg)}20%{transform:rotate(-12deg)}30%{transform:rotate(8deg)}40%{transform:rotate(-6deg)}50%{transform:rotate(0)}}",
    /* اللوحة */
    "#wetchprofilenotifi{padding:0!important}",
    "#wetchprofilenotifi .nt-head{position:sticky;top:0;z-index:5;display:flex;gap:6px;padding:6px;background:inherit;border-bottom:1px solid rgba(0,0,0,.12)}",
    "#wetchprofilenotifi .nt-head button{flex:1;height:34px;border:0;border-radius:10px;color:#fff;font-weight:700;font-family:inherit;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.25);transition:transform .12s}",
    "#wetchprofilenotifi .nt-head button:active{transform:scale(.96)}",
    "#wetchprofilenotifi .nt-back{background:linear-gradient(135deg,#4caf50,#2e9e4f)}",
    "#wetchprofilenotifi .nt-clear{background:linear-gradient(135deg,#ef5350,#c62828)}",
    "#wetchprofilenotifi .nt-list{padding:6px 8px 12px}",
    "#wetchprofilenotifi .nt-list:empty::before{content:'\\1F514  لا توجد إشعارات';display:block;text-align:center;color:#888;font-weight:700;padding:40px 10px}",
    "#wetchprofilenotifi .nt-list .notification{min-width:0;max-width:none;width:100%;margin:12px 0 0;padding:10px 8px 8px;border:0;border-radius:12px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.15);animation:ntin .25s ease-out}",
    "#wetchprofilenotifi .nt-list .notification__title{width:auto;min-width:64px;padding:0 10px;border:0;border-radius:9px;margin:-20px auto 4px;box-shadow:0 1px 4px rgba(0,0,0,.3)}",
    "#wetchprofilenotifi .nt-list .notification__message{font-size:.75rem}",
    "#wetchprofilenotifi .nt-list .notification__time{font-size:.6rem;color:#777}",
    "@keyframes ntin{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}"
  ].join("\n");
  var st = document.createElement("style");
  st.id = "nt-css";
  st.textContent = css;
  document.head.appendChild(st);

  /* ===== صوت الإشعار (نغمة تنبيه شبه نغمات الموبايل، متولدة بالمتصفح من غير ملف صوت) ===== */
  var actx = null,
    lastSnd = 0;
  function ctx() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!actx) actx = new AC();
      return actx;
    } catch (e) {
      return null;
    }
  }
  /* المتصفحات بتمنع الصوت قبل أول تفاعل: نفعّل الصوت عند أول لمسة/ضغطة */
  function unlock() {
    var c = ctx();
    if (c && c.state === "suspended") c.resume().catch(function () {});
  }
  ["click", "touchstart", "keydown"].forEach(function (ev) {
    document.addEventListener(ev, unlock, { passive: true });
  });
  function tone(c, freq, start, dur, vol) {
    var o = c.createOscillator(),
      o2 = c.createOscillator(),
      g = c.createGain();
    o.type = "sine";
    o2.type = "triangle";
    o.frequency.value = freq;
    o2.frequency.value = freq * 2;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    var g2 = c.createGain();
    g2.gain.value = 0.25;
    o.connect(g);
    o2.connect(g2);
    g2.connect(g);
    g.connect(c.destination);
    o.start(start);
    o2.start(start);
    o.stop(start + dur + 0.05);
    o2.stop(start + dur + 0.05);
  }
  function muted() {
    try {
      return window.getv && getv("ntmute") === "1";
    } catch (e) {
      return false;
    }
  }
  window.ntPlaySound = function () {
    if (muted()) return;
    var now = Date.now();
    if (now - lastSnd < 700) return; /* مفيش تكرار لو وصلوا كذا إشعار مع بعض */
    lastSnd = now;
    var c = ctx();
    if (!c) return;
    try {
      if (c.state === "suspended") c.resume().catch(function () {});
      var t = c.currentTime + 0.02;
      tone(c, 1046.5, t, 0.28, 0.22); /* دو */
      tone(c, 1568, t + 0.14, 0.55, 0.2); /* صول */
    } catch (e) {}
  };
  window.ntToggleSound = function () {
    try {
      setv("ntmute", muted() ? "0" : "1");
    } catch (e) {}
    if (!muted()) {
      lastSnd = 0;
      window.ntPlaySound(); /* نسمّعه النغمة عند التشغيل */
    }
  };

  var count = 0;
  function paint() {
    var b = $(".nt-badge");
    if (count > 0) b.text(count > 99 ? "99+" : count).show();
    else b.hide();
    $(".nt-open,.oth-open").toggleClass("has-new", count > 0);
  }
  /* فتح اللوحة: تصفير العدّاد */
  window.ntCount = function () {
    return count;
  };
  window.ntOpen = function () {
    $(".pnhead").text("الإشعارات");
    $(".dpnl").show();
    count = 0;
    paint();
  };
  /* إشعار جديد وصل: لو اللوحة مش مفتوحة زوّد العدّاد */
  window.ntBump = function () {
    window.ntPlaySound();
    var open = $("#dpnl").is(":visible") && $("#wetchprofilenotifi").hasClass("active");
    if (open) return;
    count++;
    paint();
  };
  window.ntClear = function () {
    $("#wetchprofilenotifi .nt-list").empty();
    count = 0;
    paint();
  };
})();
