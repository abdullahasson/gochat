/* =============================================================================
   [ADDED] silent-reconnect.js
   إعادة اتصال صامتة داخل الشات:
     1) بدون أي رسالة ("يتم الإتصال بالسيرفر" / "تم الإتصال" / "فشل الإتصال" / "يتم إعاده الاتصال")
     2) بدون تحديث للصفحة (لا location.href ولا refresh) حتى بعد غياب طويل عن المتصفح
   [ADDED v2] إشعار أنيق أعلى الشاشة: أيقونة واي فاي «جاري إعادة الاتصال» ثم «تم الاتصال بنجاح».
   [ADDED v5] نبضة تطبيق (SR_HB) كل 15 ثانية تعمل حتى والتبويب في الخلفية (Web Worker) + فحص ذكي بنبضة
   قبل أي إعادة اتصال (بدل القفل الأعمى بعد دقيقة غياب) + منع أمر redirect أثناء الدخول الصامت
   + دخول صامت مع 5 محاولات + استجابة لطلب السيرفر SR_RELOGIN.
   الملف إضافة مستقلة: لا يعدّل x2.js. يُحمَّل بعد x2.js مباشرة.
   ============================================================================= */
(function () {
  if (window.__SR_LOADED) return;
  window.__SR_LOADED = true;

  var HIDDEN_LIMIT = 60 * 1000; // [ADDED] غياب أطول من دقيقة => نعيد فتح قناة الاتصال عند الرجوع
  var TICK = 2000; // [ADDED] مؤقّت كشف تجمّد الصفحة (نوم الجهاز)
  var RELOGIN_WAIT = 12000; // [ADDED] مهلة انتظار رد الدخول الصامت
  var RELOGIN_MAX = 5; // [ADDED] أقصى عدد محاولات دخول صامت قبل الرجوع للسلوك القديم

  var creds = null; // [ADDED] آخر حمولة دخول ناجحة (عضو/زائر) — في الذاكرة فقط
  var lastJoin = null; // [ADDED] آخر طلب دخول غرفة (لاسترجاع كلمة مرور الغرفة)
  var leaving = false; // [ADDED] خروج متعمّد (زر الخروج) => نترك السلوك الأصلي
  var kicked = false; // [ADDED] السيرفر قطع الاتصال عمدًا (طرد/حظر) => لا نعيد الاتصال
  var relogging = false; // [ADDED] جاري دخول صامت
  var postLogin = false; // [ADDED] بعد نجاح الدخول الصامت وقبل وصول قائمة الغرف
  var tries = 0;
  var wd = null;
  var prevRoom = null; // [ADDED] الغرفة التي كان فيها العضو قبل الانقطاع
  var hiddenAt = 0;
  var lastTick = Date.now();
  var lastForce = 0;
  var hooked = null; // [ADDED] آخر socket تم ربطه
  var redirectQuietUntil = 0; // [ADDED v5] لا نسمح لأمر redirect بتحديث الصفحة أثناء/بعد الدخول الصامت مباشرة
  var HB_EVERY = 15000; // [ADDED v5] نبضة كل 15 ثانية
  var HB_WAIT = 7000; // [ADDED v5] مهلة رد السيرفر على النبضة
  var PROBE_AWAY = 20000; // [ADDED v5] غياب أطول من 20 ثانية => نتأكد بنبضة عند الرجوع
  var hbBusy = false;
  var hbOk = false; // [ADDED v5] السيرفر رد على نبضة مرة على الأقل في هذا الاتصال (يحمينا لو السيرفر قديم)
  var hbMiss = 0;
  var hbWorker = null;
  var hbFallback = null;

  // ---------------------------------------------------------------------------
  // 1) إخفاء كل رسائل الاتصال (إخفاء فقط — العناصر نفسها تبقى كما هي)
  // ---------------------------------------------------------------------------
  var css = document.createElement("style");
  css.textContent =
    "#message-box,#message-box1,#message-box2,.ovr{display:none!important}";
  (document.head || document.documentElement).appendChild(css);

  // ---------------------------------------------------------------------------
  // 1b) [ADDED v2] إشعار حالة الاتصال (أيقونة واي فاي + نص) — واجهة فقط، لا يلمس منطق الاتصال
  // ---------------------------------------------------------------------------
  var TOAST_DELAY = 350; // [ADDED] لا نُظهر الإشعار لو رجع الاتصال خلال أقل من هذه المدة (تفادي الوميض)
  var OK_SHOW = 2400; // [ADDED] مدة بقاء "تم الاتصال بنجاح"
  var tEl = null;
  var tTx = null;
  var tTitle = null;
  var tSub = null;
  var tState = "";
  var tDelayT = null;
  var tHideT = null;
  var lost = false; // [ADDED] هل نحن في حالة انقطاع الآن
  var offlineNow = false;
  var attempts = 0;

  var tcss = document.createElement("style");
  tcss.textContent = [
    "#srToast{position:fixed;top:calc(env(safe-area-inset-top,0px) + 10px);left:50%;z-index:2147483000;",
    "display:flex;align-items:center;gap:11px;direction:rtl;min-width:230px;max-width:calc(100vw - 24px);",
    "padding:9px 16px 9px 14px;border-radius:18px;overflow:hidden;pointer-events:none;box-sizing:border-box;",
    "font-family:system-ui,-apple-system,'Segoe UI',Tahoma,Arial,sans-serif;color:#fff;",
    "background:rgba(22,26,36,.88);-webkit-backdrop-filter:blur(14px) saturate(160%);backdrop-filter:blur(14px) saturate(160%);",
    "border:1px solid rgba(255,255,255,.09);box-shadow:0 10px 30px rgba(0,0,0,.35),0 2px 6px rgba(0,0,0,.25);",
    "opacity:0;visibility:hidden;transform:translate(-50%,-160%) scale(.96);",
    "transition:transform .5s cubic-bezier(.2,.9,.25,1.12),opacity .3s ease,visibility 0s linear .5s,border-color .35s ease,box-shadow .35s ease}",
    "#srToast.sr-show{opacity:1;visibility:visible;transform:translate(-50%,0) scale(1);",
    "transition:transform .5s cubic-bezier(.2,.9,.25,1.12),opacity .3s ease,visibility 0s linear 0s,border-color .35s ease,box-shadow .35s ease}",
    "#srToast .sr-ic{position:relative;flex:0 0 auto;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;",
    "transition:background .4s ease,color .4s ease}",
    "#srToast .sr-ic svg{width:21px;height:21px;display:block;overflow:visible}",
    "#srToast .sr-ic path,#srToast .sr-ic circle{transition:opacity .3s ease}",
    "#srToast .sr-ring{position:absolute;inset:0;border-radius:50%;border:2px solid currentColor;opacity:0;pointer-events:none}",
    "#srToast .sr-tx{flex:1 1 auto;min-width:0;text-align:right}",
    "#srToast .sr-t{font-size:14.5px;font-weight:700;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    "#srToast .sr-s{font-size:11.5px;line-height:1.3;margin-top:1px;color:rgba(255,255,255,.62);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    "#srToast .sr-tx.sr-in{animation:srTxIn .35s ease both}",
    "#srToast .sr-bar{position:absolute;left:0;right:0;bottom:0;height:2px;overflow:hidden;opacity:0;transition:opacity .3s ease}",
    "#srToast .sr-bar:after{content:'';position:absolute;top:0;bottom:0;width:38%;background:linear-gradient(90deg,transparent,currentColor,transparent);",
    "animation:srBar 1.3s ease-in-out infinite}",
    /* حالة: جاري إعادة الاتصال */
    "#srToast.sr-wait{color:#ffb020}",
    "#srToast.sr-wait .sr-ic{background:rgba(255,176,32,.15);color:#ffb020}",
    "#srToast.sr-wait .sr-t,#srToast.sr-ok .sr-t{color:#fff}",
    "#srToast.sr-wait .sr-bar{opacity:.9}",
    "#srToast.sr-wait .sr-a1,#srToast.sr-wait .sr-a2,#srToast.sr-wait .sr-a3,#srToast.sr-wait .sr-dot{animation:srWave 1.35s ease-in-out infinite}",
    "#srToast.sr-wait .sr-a1{animation-delay:.18s}",
    "#srToast.sr-wait .sr-a2{animation-delay:.36s}",
    "#srToast.sr-wait .sr-a3{animation-delay:.54s}",
    /* حالة: تم الاتصال */
    "#srToast.sr-ok{color:#2ee27a;border-color:rgba(46,226,122,.35);box-shadow:0 10px 30px rgba(0,0,0,.35),0 0 0 1px rgba(46,226,122,.12),0 0 22px rgba(46,226,122,.18)}",
    "#srToast.sr-ok .sr-ic{background:rgba(46,226,122,.16);color:#2ee27a;animation:srPop .55s cubic-bezier(.2,.9,.25,1.4)}",
    "#srToast.sr-ok .sr-ring{animation:srRing .9s ease-out .05s 1 both}",
    "#srToast.sr-ok .sr-a1,#srToast.sr-ok .sr-a2,#srToast.sr-ok .sr-a3,#srToast.sr-ok .sr-dot{opacity:1;animation:none}",
    "@keyframes srWave{0%,100%{opacity:.18}40%,60%{opacity:1}}",
    "@keyframes srBar{0%{left:-40%}100%{left:102%}}",
    "@keyframes srTxIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}",
    "@keyframes srPop{0%{transform:scale(.7)}60%{transform:scale(1.12)}100%{transform:scale(1)}}",
    "@keyframes srRing{0%{opacity:.7;transform:scale(1)}100%{opacity:0;transform:scale(1.9)}}",
    "@media (prefers-reduced-motion:reduce){#srToast,#srToast *{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}"
  ].join("");
  (document.head || document.documentElement).appendChild(tcss);

  function tBuild() {
    if (tEl) return tEl;
    tEl = document.createElement("div");
    tEl.id = "srToast";
    tEl.setAttribute("role", "status");
    tEl.setAttribute("aria-live", "polite");
    tEl.innerHTML =
      '<div class="sr-ic">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path class="sr-a3" d="M2.4 8.9a14.6 14.6 0 0 1 19.2 0"/>' +
      '<path class="sr-a2" d="M5.6 12.4a10 10 0 0 1 12.8 0"/>' +
      '<path class="sr-a1" d="M8.9 15.9a5.3 5.3 0 0 1 6.2 0"/>' +
      '<circle class="sr-dot" cx="12" cy="19.4" r="1.25" fill="currentColor" stroke="none"/>' +
      "</svg>" +
      '<span class="sr-ring"></span></div>' +
      '<div class="sr-tx"><div class="sr-t"></div><div class="sr-s"></div></div>' +
      '<div class="sr-bar"></div>';
    (document.body || document.documentElement).appendChild(tEl);
    tTx = tEl.querySelector(".sr-tx");
    tTitle = tEl.querySelector(".sr-t");
    tSub = tEl.querySelector(".sr-s");
    return tEl;
  }

  function waitSub() {
    if (offlineNow) return "تحقق من اتصال الإنترنت";
    if (relogging || postLogin) return "جاري استعادة جلستك…";
    if (attempts > 1) return "المحاولة رقم " + attempts;
    return "برجاء الانتظار لحظات…";
  }

  function tPaint(state) {
    tBuild();
    var title = state === "ok" ? "تم الاتصال بنجاح" : "جاري إعادة الاتصال…";
    var sub = state === "ok" ? "أنت متصل الآن" : waitSub();
    if (tState !== state) {
      tEl.classList.remove("sr-wait", "sr-ok");
      void tEl.offsetWidth; // [ADDED] إعادة تشغيل حركة الأيقونة عند تغيّر الحالة
      tEl.classList.add(state === "ok" ? "sr-ok" : "sr-wait");
      tTitle.textContent = title;
      tSub.textContent = sub;
      tTx.classList.remove("sr-in");
      void tTx.offsetWidth;
      tTx.classList.add("sr-in");
      tState = state;
    } else if (tSub.textContent !== sub) {
      tSub.textContent = sub; // [ADDED] تحديث السطر الصغير فقط (رقم المحاولة...)
    }
  }

  function tShow(state) {
    clearTimeout(tHideT);
    tPaint(state);
    // [ADDED] إطار واحد حتى تعمل حركة الدخول
    (window.requestAnimationFrame || setTimeout)(function () {
      if (tEl) tEl.classList.add("sr-show");
    });
  }

  function tHide() {
    clearTimeout(tDelayT);
    clearTimeout(tHideT);
    tDelayT = null;
    if (tEl) tEl.classList.remove("sr-show");
    tState = "";
  }

  function netLost() {
    if (!window.M_ID || leaving || kicked) return;
    lost = true;
    clearTimeout(tHideT);
    if (tEl && tEl.classList.contains("sr-show")) {
      tPaint("wait"); // ظاهر بالفعل (ربما كان «تم الاتصال») => نرجع لحالة الانتظار بسلاسة
      return;
    }
    if (!tDelayT) {
      tDelayT = setTimeout(function () {
        tDelayT = null;
        if (lost) tShow("wait");
      }, TOAST_DELAY);
    }
  }

  function netBack() {
    lost = false;
    attempts = 0;
    clearTimeout(tDelayT);
    tDelayT = null;
    if (tEl && tEl.classList.contains("sr-show") && tState === "wait") {
      tPaint("ok");
      clearTimeout(tHideT);
      tHideT = setTimeout(tHide, OK_SHOW);
    }
  }

  window.addEventListener("offline", function () {
    offlineNow = true;
    netLost();
  });
  window.addEventListener("online", function () {
    offlineNow = false;
    if (lost && tEl && tEl.classList.contains("sr-show")) tPaint("wait");
    // [ADDED] لو الاتصال لم ينقطع فعليًا أثناء انقطاع النت القصير => نُنهي الإشعار
    setTimeout(function () {
      var s = window.socket;
      if (lost && s && s.connected && !relogging && !postLogin) netBack();
    }, 1500);
  });

  // ---------------------------------------------------------------------------
  // 2) التقاط بيانات الدخول (في الذاكرة فقط) وآخر غرفة — بدون تغيير سلوك الدالة
  // ---------------------------------------------------------------------------
  var _emit = window.SEND_EVENT_EMIT;
  window.SEND_EVENT_EMIT = function (e, t) {
    try {
      if (
        !relogging &&
        (e === "SEND_EVENT_EMIT_LOGIN" || e === "SEND_EVENT_EMIT_GUST")
      ) {
        creds = { cmd: e, data: JSON.parse(JSON.stringify(t || {})) };
      } else if (e === "SEND_EVENT_EMIT_RJOIN_ROOM") {
        lastJoin = JSON.parse(JSON.stringify(t || {}));
      }
    } catch (er) {}
    return _emit.apply(this, arguments);
  };

  // خروج متعمّد: نسمح بإعادة تحميل الصفحة كما هو الحال دائمًا
  var _logout = window.logout;
  if (typeof _logout === "function") {
    window.logout = function () {
      leaving = true;
      creds = null;
      return _logout.apply(this, arguments);
    };
  }

  // ---------------------------------------------------------------------------
  // 3) منع إعادة تحميل الصفحة بسبب الاتصال طالما العضو داخل الشات
  // ---------------------------------------------------------------------------
  var _clsbrow = window.clsbrow;
  window.clsbrow = function (i) {
    if (window.M_ID && creds && !leaving) {
      return; // [ADDED] لا refresh أثناء وجود العضو في الشات
    }
    return _clsbrow.apply(this, arguments);
  };

  // ---------------------------------------------------------------------------
  // 4) الدخول الصامت عند فشل الاسترجاع التلقائي (غياب أطول من نافذة الاسترجاع / ريستارت)
  // ---------------------------------------------------------------------------
  function curRoom() {
    try {
      if (window.M_ROOM) return window.M_ROOM;
      var me = window.U_CASH && window.U_CASH[window.M_ID];
      return (me && me.roomid) || null;
    } catch (e) {
      return null;
    }
  }

  function giveUp() {
    // [ADDED] آخر حل: نرجع للسلوك الأصلي (الرجوع للصفحة الرئيسية) بعد فشل كل المحاولات
    relogging = false;
    postLogin = false;
    clearTimeout(wd);
    leaving = true;
    tHide(); // [ADDED v2]
    _clsbrow(1);
  }

  function attempt() {
    if (!relogging || !creds) return;
    tries++;
    clearTimeout(wd);
    try {
      var d = JSON.parse(JSON.stringify(creds.data));
      d.silent = true; // [ADDED] السيرفر يتجاهل بانر الدخول ورسالة الانضمام لو الجلسة القديمة موجودة فعلًا
      window.__SR_QUIET_UNTIL = Date.now() + 15000; // [ADDED] لا فتح تلقائي لتبويب المتصلين/الغرفة
      _emit(creds.cmd, d); // نفس حمولة الدخول الأصلية + علامة الصمت
    } catch (e) {}
    wd = setTimeout(function () {
      if (!relogging) return;
      if (tries < RELOGIN_MAX) attempt();
      else giveUp();
    }, RELOGIN_WAIT);
  }

  function startRelogin() {
    relogging = true;
    postLogin = false;
    tries = 0;
    attempt();
  }

  // ---------------------------------------------------------------------------
  // 5) اعتراض رسائل السيرفر أثناء الدخول الصامت فقط (غير ذلك: السلوك الأصلي كما هو)
  // ---------------------------------------------------------------------------
  var _on = window.ON_DATE_SEND;
  window.ON_DATE_SEND = function (cmd, data) {
    if (cmd === "redirect" && (relogging || postLogin || Date.now() < redirectQuietUntil)) {
      return; // [ADDED v5] redirect وقت إعادة الدخول الصامت = تحديث صفحة بدون داعي
    }
    if (relogging && cmd === "login") {
      if (data && data.msg === "ok") {
        clearTimeout(wd);
        postLogin = true;
        // [ADDED] صمام أمان: لو لم تصل قائمة الغرف نُنهي الحالة بعد 6 ثوانٍ
        wd = setTimeout(function () {
          if (postLogin) finishRelogin();
        }, 6000);
        return _on.apply(this, arguments); // يحدّث M_ID و MY_T كالمعتاد
      }
      giveUp(); // خطأ (كلمة مرور/حظر...) => السلوك القديم
      return;
    }
    if (postLogin && cmd === "ulist" && Array.isArray(data)) {
      // [ADDED] إزالة من غادر أثناء الغياب عبر نفس معالج "u-" الأصلي
      try {
        var keep = {};
        for (var i = 0; i < data.length; i++) keep[data[i].id] = 1;
        var stale = Object.keys(window.U_CASH || {});
        for (var j = 0; j < stale.length; j++) {
          if (!keep[stale[j]]) _on("u-", stale[j]);
        }
      } catch (e) {}
      return _on.apply(this, arguments);
    }
    if (postLogin && cmd === "rlist" && Array.isArray(data)) {
      try {
        var rk = {};
        for (var a = 0; a < data.length; a++) rk[data[a].id] = 1;
        var old = Object.keys(window.R_CASH || {});
        for (var b = 0; b < old.length; b++) {
          if (!rk[old[b]]) _on("r-", old[b]);
          else $(".r" + old[b]).remove(); // لتفادي تكرار بطاقة الغرفة
        }
      } catch (e) {}
      var res = _on.apply(this, arguments);
      finishRelogin();
      return res;
    }
    return _on.apply(this, arguments);
  };

  // [ADDED] ترتيب قائمة المتصلين والغرف في الخلفية (حتى لو مخفية) فتظهر مرتبة لحظة الفتح
  function presort() {
    try {
      if (typeof window.updateusers !== "function") return;
      window.needUpdate = true;
      window.updateusers();
      if (typeof window.updaterooms === "function") window.updaterooms();
      window.needUpdate = false;
      var els = $("#rooms").find(".room");
      if (els.length) {
        els = els.sort(function (a, b) {
          var av = parseInt($(a).attr("v")) || 0;
          var bv = parseInt($(b).attr("v")) || 0;
          if (av == bv)
            return ($(a).find(".u-topic").text() + "").localeCompare($(b).find(".u-topic").text() + "");
          return av < bv ? 1 : -1;
        });
        $(".rmr").html(els);
      }
    } catch (e) {}
  }
  /* [FIX-C22/P2] كان مستمع نقر دائم يُطلق presort (إعادة ترتيب كاملة +
     إعادة إدخال كل الغرف) مع كل ضغطة على تبويب المتصلين/الغرف خلال 60
     ثانية من إعادة الاتصال — الترتيب مضمون أصلًا بالمؤقتين في
     finishRelogin (400ms + 1500ms) — حُذف المستمع وبقيت المؤقتات. */

  function finishRelogin() {
    // [ADDED] الرجوع لنفس الغرفة التي كان فيها العضو
    var target = prevRoom;
    relogging = false;
    postLogin = false;
    tries = 0;
    prevRoom = null;
    netBack(); // [ADDED v2] تم الاتصال بنجاح
    redirectQuietUntil = Date.now() + 5000; // [ADDED v5]
    window.__SR_QUIET_UNTIL = Date.now() + 4000; // [ADDED] يغطي حدث "ur" بعد إعادة دخول الغرفة
    setTimeout(presort, 400);
    setTimeout(presort, 1500); // [ADDED] ترتيب القوائم في الخلفية قبل ما يفتحها العضو
    try {
      if (!target || !window.R_CASH || !window.R_CASH[target]) return;
      var me = window.U_CASH && window.U_CASH[window.M_ID];
      if (me && me.roomid === target) return;
      var pwd = lastJoin && lastJoin.id === target ? lastJoin.pwd || "" : "";
      window.isroom = target;
      _emit("SEND_EVENT_EMIT_RJOIN_ROOM", { id: target, pwd: pwd });
    } catch (e) {}
  }

  // ---------------------------------------------------------------------------
  // 6) ربط أحداث الـ socket (مرة واحدة لكل socket)
  // ---------------------------------------------------------------------------
  function hook(s) {
    hooked = s;
    s.on("disconnect", function (reason) {
      if (reason === "io server disconnect") {
        kicked = true; // قطع متعمّد من السيرفر
        lost = false;
        tHide(); // [ADDED v2] لا إشعار عند الطرد/الحظر
        return;
      }
      if (window.M_ID && !relogging) prevRoom = curRoom() || prevRoom;
      netLost(); // [ADDED v2] جاري إعادة الاتصال
    });
    s.on("connect_error", function () {
      attempts++;
      netLost(); // [ADDED v2]
      if (tEl && tEl.classList.contains("sr-show") && tState === "wait") tPaint("wait");
    });
    s.on("SR_RELOGIN", function () {
      // [ADDED v5] السيرفر بيقول: الاتصال رجع بس جلستك ضاعت (زائر / ريستارت) => دخول صامت
      if (!window.M_ID || !creds || leaving || kicked || relogging) return;
      if (!prevRoom) prevRoom = curRoom();
      startRelogin();
      netLost();
    });
    s.on("connect", function () {
      kicked = false;
      hbOk = false; // [ADDED v5] اتصال جديد: نتعلم من جديد إن السيرفر بيرد على النبضة
      hbMiss = 0;
      hbBusy = false;
      if (s.recovered) {
        // استرجاع كامل للجلسة من السيرفر: لا شيء مطلوب
        relogging = false;
        postLogin = false;
        netBack(); // [ADDED v2] تم الاتصال بنجاح
        return;
      }
      if (!window.M_ID || !creds || leaving) {
        // أول اتصال أو لم يدخل بعد
        lost = false;
        tHide(); // [ADDED v2]
        return;
      }
      if (!prevRoom) prevRoom = curRoom();
      redirectQuietUntil = Date.now() + 20000; // [ADDED v5]
      startRelogin();
      netLost(); // [ADDED v2] الاتصال عاد لكن الجلسة ما زالت تُستعاد
    });
  }

  function ensureHooked() {
    var s = window.socket;
    if (s && s !== hooked) hook(s);
  }

  // [ADDED] ربط فوري لحظة إنشاء الـ socket (بدون انتظار المؤقّت) + استطلاع سريع احتياطي
  var _newConnect = window.NEW_CONNECT;
  if (typeof _newConnect === "function") {
    window.NEW_CONNECT = function () {
      var r = _newConnect.apply(this, arguments);
      ensureHooked();
      return r;
    };
  }
  /* [FIX-PERF] كانت setInterval كل 250ms تعمل للأبد حتى بعد الربط (4 مرات/ثانية طوال الجلسة
     = استهلاك معالج وبطارية بلا فائدة). الآن: فحص فوري + محاولات احتياطية كل 500ms
     لمدة 20 ثانية كحد أقصى حتى يظهر السوكت، وأي سوكت جديد بعدها يُلتقط عبر غلاف NEW_CONNECT أعلاه */
  ensureHooked();
  var hookRetry = 0;
  var hookTimer = setInterval(function () {
    ensureHooked();
    var hookedNow = window.socket && window.socket === hooked;
    if (hookedNow || ++hookRetry > 40) {
      clearInterval(hookTimer);
    }
  }, 500);

  // ---------------------------------------------------------------------------
  // 7) الرجوع للمتصفح: إعادة اتصال فورية بدون انتظار مؤقتات المحاولة
  // ---------------------------------------------------------------------------
  /* [ADDED v5] نبضة: بنبعت SR_HB والسيرفر يرد فورًا. cb(true)=حي، cb(false)=مفيش رد، cb(null)=مش وقته */
  function probe(wait, cb) {
    var s = window.socket;
    if (!s || !s.connected || !window.M_ID || !creds || leaving || kicked || relogging || postLogin) {
      if (cb) cb(null);
      return;
    }
    if (hbBusy) {
      if (cb) cb(null);
      return;
    }
    hbBusy = true;
    var done = false;
    var t = setTimeout(function () {
      if (done) return;
      done = true;
      hbBusy = false;
      if (cb) cb(false);
    }, wait || HB_WAIT);
    try {
      s.emit("SR_HB", Date.now(), function () {
        if (done) return;
        done = true;
        clearTimeout(t);
        hbBusy = false;
        hbOk = true;
        hbMiss = 0;
        if (cb) cb(true);
      });
    } catch (e) {
      done = true;
      clearTimeout(t);
      hbBusy = false;
      if (cb) cb(false);
    }
  }

  // [ADDED v5] القناة شكلها متصلة لكنها ميتة => نقفلها فتبدأ إعادة اتصال طبيعية (والاسترجاع/الدخول الصامت يكملوا)
  function revive() {
    var s = window.socket;
    if (!s || leaving || kicked) return;
    lastForce = Date.now();
    try {
      var eng = s.io && s.io.engine;
      if (eng) {
        eng.close();
        setTimeout(function () {
          if (!s.connected) {
            try {
              s.disconnect();
              s.connect();
            } catch (e) {}
          }
        }, 150);
      }
    } catch (e) {}
  }

  // [ADDED v5] حُكم على نتيجة النبضة: مرتان متتاليتان بدون رد (والسيرفر سبق ورد في هذا الاتصال) => القناة ميتة
  function verdict(ok) {
    if (ok !== false || !hbOk) return;
    hbMiss++;
    if (hbMiss < 2) {
      setTimeout(function () {
        probe(4000, verdict);
      }, 800);
    } else {
      hbMiss = 0;
      revive();
    }
  }

  function force(reason) {
    var s = window.socket;
    if (!s || !window.M_ID || !creds || leaving || kicked) return;
    var now = Date.now();
    if (now - lastForce < 3000) return;
    if (!s.connected) {
      lastForce = now;
      try {
        s.disconnect(); // يلغي مؤقّت الانتظار (قد يكون متجمدًا أو بطيئًا)
        s.connect();
      } catch (e) {}
      return;
    }
    var away = hiddenAt ? now - hiddenAt : 0;
    var froze = now - lastTick > HIDDEN_LIMIT;
    if (away >= PROBE_AWAY || froze) {
      // [ADDED v5] كان بيقفل القناة بشكل أعمى بعد دقيقة غياب (يعمل فصل/دخول مش لازم)؛ الآن نتأكد بنبضة الأول
      lastForce = now;
      probe(4000, function (ok) {
        if (ok === false) {
          if (hbOk || froze || away >= HIDDEN_LIMIT) revive();
        }
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 7b) [ADDED v5] نبضة دورية — شغالة حتى والتبويب في الخلفية (Web Worker مش بيتخنق زي مؤقتات الصفحة)
  // ---------------------------------------------------------------------------
  function onBeat() {
    var s = window.socket;
    if (!s || !s.connected || !window.M_ID || !creds || leaving || kicked || relogging || postLogin) return;
    var wasVisible = !document.hidden;
    probe(HB_WAIT, function (ok) {
      // لو الصفحة مخفية مؤقتاتها ممكن تكون متأخرة فمنحكمش بالموت؛ نحكم بس والصفحة ظاهرة
      if (ok === false && wasVisible && !document.hidden) verdict(ok);
    });
  }

  function startFallbackBeat() {
    if (!hbFallback) hbFallback = setInterval(onBeat, HB_EVERY);
  }

  (function startBeat() {
    try {
      var src = "setInterval(function(){postMessage(1)}," + HB_EVERY + ");";
      var blob = new Blob([src], { type: "text/javascript" });
      var url = (window.URL || window.webkitURL).createObjectURL(blob);
      hbWorker = new Worker(url);
      hbWorker.onmessage = onBeat;
      hbWorker.onerror = function () {
        try {
          hbWorker.terminate();
        } catch (e) {}
        hbWorker = null;
        startFallbackBeat();
      };
    } catch (e) {
      hbWorker = null;
      startFallbackBeat();
    }
  })();

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      hiddenAt = Date.now();
    } else {
      force("visible");
      hiddenAt = 0;
    }
  });
  window.addEventListener("pageshow", function () {
    force("pageshow");
  });
  window.addEventListener("online", function () {
    force("online");
  });
  window.addEventListener("focus", function () {
    force("focus");
  });

  /* [FIX-C10/P1] المراقب صار تكيفيًا: كان setInterval ثابتًا كل 2 ثانية للأبد
     (استهلاك معالج وبطارية مستمر في الحالة المستقرة). الآن: 2 ثانية أثناء
     المشاكل/الانقطاع، و5 ثوانٍ عند الاستقرار (متصل + لا إشعار + لا دخول صامت) —
     نفس منطق الكشف نفسه بلا أي تغيير في القرارات. */
  var wdT = 0;
  (function watchdog() {
    var now = Date.now();
    ensureHooked();
    // شبكة أمان: لو انقطع الاتصال ولم تنجح المحاولات التلقائية نعيد المحاولة بهدوء
    var s = window.socket;
    if (
      s &&
      !s.connected &&
      window.M_ID &&
      creds &&
      !leaving &&
      !kicked &&
      !document.hidden &&
      now - lastForce > 10000
    ) {
      force("watch");
    } else if (now - lastTick > TICK * 5 && !document.hidden) {
      force("timer-gap"); // الصفحة كانت متجمدة (نوم الجهاز) ثم عادت
    }
    lastTick = now;
    var slow = !!(s && s.connected && !lost && !relogging && !postLogin);
    wdT = setTimeout(watchdog, slow ? 5000 : TICK);
  })();

  ensureHooked();
})();
