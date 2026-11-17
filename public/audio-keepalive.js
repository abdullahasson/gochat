/* =============================================================================
   [ADDED] audio-keepalive.js — النبضة الصوتية الصامتة
   الفكرة: المتصفحات (كروم/سامسونج/سفاري) بتجمّد أو بتخنق أي صفحة في الخلفية، إلا الصفحة اللي
   شغّالة صوت. فالملف ده بيشغّل صوت داخلي غير مسموع (موجة 40Hz بقوة -58dBFS) بشكل متواصل طول ما أنت
   داخل الشات، فالمتصفح يعتبر الصفحة "بتشغّل ميديا" ويسيبها شغّالة زي ما لو فاتحها قدامك.
   الطبقات (كلها مع بعض عشان لو واحدة اتعطلت التانية تكمّل):
     1) عنصر <audio> بيلفّ ملف WAV صامت مولّد في الذاكرة (مفيش ملف خارجي ولا طلب شبكة)
     2) Media Session: إشعار "الشات متصل" + حالة playing => أندرويد/iOS يرفعوا أولوية الصفحة
     3) Web Locks: قفل مفتوح طول الجلسة => كروم ما يعملش freeze للصفحة
     4) AudioContext احتياطي لو عنصر الصوت فشل
     5) حارس (Web Worker كل 10 ثواني — شغّال في الخلفية) يعيد التشغيل لو الصوت اتقطع (مكالمة/نظام)
   ملاحظة: المتصفح بيمنع الصوت قبل أول لمسة، فالتشغيل بيبدأ تلقائيًا مع أول ضغطة/لمسة في الصفحة
   (زر الدخول نفسه كافي). الملف إضافة مستقلة: لا يعدّل x2.js ولا silent-reconnect.js.
   للإيقاف يدويًا: window.AK_STOP() — للتشغيل: window.AK_START()
   ============================================================================= */
(function () {
  if (window.__AK_LOADED) return;
  window.__AK_LOADED = true;

  var GUARD_EVERY = 10000; // [ADDED] حارس إعادة التشغيل كل 10 ثواني
  var LS_KEY = "ak_off"; // [ADDED] لو القيمة "1" => المستخدم أوقف النبضة الصوتية

  var audio = null; // [ADDED] عنصر الصوت الصامت
  var wavUrl = null;
  var actx = null; // [ADDED] AudioContext احتياطي
  var osc = null;
  var running = false; // [ADDED] هل المفروض إنها شغّالة (مسجّل دخول + لم يوقفها المستخدم)
  var unlocked = false; // [ADDED] حصلت لمسة من المستخدم (شرط المتصفح للصوت)
  var lockHeld = false;
  var guardWorker = null;
  var guardFallback = null;

  function disabled() {
    try {
      return localStorage.getItem(LS_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // 1) توليد WAV: 8kHz مونو 16bit — 10 ثواني — موجة 40Hz سعتها ±40 من 32768 (حوالي -58dBFS)
  //    كروم بيعتبر أي صوت أضعف من -72dBFS "صمت" ولا يحسبه تشغيل ميديا (ولا يعرض إشعار الوسائط)،
  //    فالسعة لازم تكون فوق الحد ده. 40Hz فوق الحد ده بس السماعات/الموبايل ما بيطلعوش ترددًا بالانخفاض ده
  //    فالنتيجة عمليًا غير مسموعة. والمدة 10 ثواني لأن كروم بيعامل الميديا الأقصر من ~5 ثواني كمؤثر صوتي
  // ---------------------------------------------------------------------------
  function makeWav() {
    var rate = 8000;
    var n = rate * 10;
    var buf = new ArrayBuffer(44 + n * 2);
    var v = new DataView(buf);
    function str(o, s) {
      for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
    }
    str(0, "RIFF");
    v.setUint32(4, 36 + n * 2, true);
    str(8, "WAVE");
    str(12, "fmt ");
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);
    v.setUint16(22, 1, true);
    v.setUint32(24, rate, true);
    v.setUint32(28, rate * 2, true);
    v.setUint16(32, 2, true);
    v.setUint16(34, 16, true);
    str(36, "data");
    v.setUint32(40, n * 2, true);
    for (var i = 0; i < n; i++) {
      // 40Hz يكمل دورات صحيحة خلال الـ 10 ثواني => لا فرقعة عند إعادة اللف
      v.setInt16(44 + i * 2, Math.round(40 * Math.sin((2 * Math.PI * 40 * i) / rate)), true);
    }
    return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
  }

  function ensureAudio() {
    if (audio) return audio;
    try {
      wavUrl = makeWav();
      audio = new Audio();
      audio.src = wavUrl;
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = 1; // [ADDED] مش muted ومش volume=0: ده شرط إن المتصفح يحسبه تشغيل فعلي
      audio.setAttribute("playsinline", "");
      audio.setAttribute("webkit-playsinline", "");
      audio.setAttribute("aria-hidden", "true");
      audio.style.display = "none";
      // لو اتوقف من برّه (مكالمة/نظام/زر الإشعار) والمفروض شغّال => نعيد التشغيل
      audio.addEventListener("pause", function () {
        if (running && !document.hidden) setTimeout(play, 300);
      });
      audio.addEventListener("ended", function () {
        if (running) play();
      });
      audio.addEventListener("error", function () {
        // [ADDED] لو فشل تحميل الـ blob نعيد توليده مرة
        try {
          if (wavUrl) URL.revokeObjectURL(wavUrl);
        } catch (e) {}
        audio = null;
        wavUrl = null;
      });
    } catch (e) {
      audio = null;
    }
    return audio;
  }

  function play() {
    if (!running) return;
    var a = ensureAudio();
    if (!a) {
      startCtx();
      return;
    }
    try {
      var p = a.play();
      if (p && p.then) {
        p.then(
          function () {
            setSession("playing");
          },
          function () {
            // NotAllowedError = لسه مفيش لمسة؛ نستنى أول لمسة. غير كده نجرب الاحتياطي
            if (unlocked) startCtx();
          }
        );
      }
    } catch (e) {
      startCtx();
    }
  }

  // ---------------------------------------------------------------------------
  // 2) Media Session: إشعار الوسائط يخلّي أندرويد/iOS يتعاملوا مع الصفحة كمشغّل صوت نشط
  // ---------------------------------------------------------------------------
  function setSession(state) {
    try {
      if (!("mediaSession" in navigator)) return;
      if (state === "playing" && !navigator.mediaSession.metadata && window.MediaMetadata) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: "الشات متصل",
          artist: document.title || "الدردشة"
        });
      }
      navigator.mediaSession.playbackState = state;
    } catch (e) {}
  }

  function hookSessionActions() {
    try {
      if (!("mediaSession" in navigator)) return;
      // زر التشغيل/الإيقاف في الإشعار: الإيقاف بيوقف النبضة بإرادة المستخدم، التشغيل بيرجعها
      navigator.mediaSession.setActionHandler("play", function () {
        try {
          localStorage.removeItem(LS_KEY);
        } catch (e) {}
        start();
      });
      navigator.mediaSession.setActionHandler("pause", function () {
        stop(true);
      });
    } catch (e) {}
  }

  // ---------------------------------------------------------------------------
  // 3) Web Locks: قفل مفتوح لحد ما الصفحة تتقفل => كروم ما يجمّد الصفحة في الخلفية
  // ---------------------------------------------------------------------------
  function holdLock() {
    if (lockHeld) return;
    try {
      if (navigator.locks && navigator.locks.request) {
        lockHeld = true;
        navigator.locks.request("chat-keepalive-" + Math.random().toString(36).slice(2), function () {
          return new Promise(function () {}); // لا يُحل أبدًا
        });
      }
    } catch (e) {
      lockHeld = false;
    }
  }

  // ---------------------------------------------------------------------------
  // 4) AudioContext احتياطي (أوسيلاتور بسعة شبه صفرية) لو عنصر الصوت ما اشتغلش
  // ---------------------------------------------------------------------------
  function startCtx() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!actx) {
        actx = new AC();
        var g = actx.createGain();
        g.gain.value = 0.004; // [ADDED] حوالي -48dB عند 40Hz: فوق حد الصمت وغير مسموع
        osc = actx.createOscillator();
        osc.frequency.value = 40;
        osc.connect(g);
        g.connect(actx.destination);
        osc.start();
      }
      if (actx.state === "suspended") actx.resume().catch(function () {});
    } catch (e) {}
  }

  function stopCtx() {
    try {
      if (osc) osc.stop();
    } catch (e) {}
    try {
      if (actx) actx.close();
    } catch (e) {}
    osc = null;
    actx = null;
  }

  // ---------------------------------------------------------------------------
  // 5) الحارس: Web Worker (مش بيتخنق في الخلفية) يتأكد إن الصوت لسه شغّال
  // ---------------------------------------------------------------------------
  function guard() {
    if (!running) return;
    if (!window.M_ID) return; // [ADDED] لسه مش داخل الشات (أو خرج)
    if (audio && !audio.paused && !audio.ended) {
      if (actx && actx.state === "suspended") {
        try {
          actx.resume();
        } catch (e) {}
      }
      return;
    }
    play();
    if (actx && actx.state === "suspended") {
      try {
        actx.resume();
      } catch (e) {}
    }
  }

  function startGuard() {
    if (guardWorker || guardFallback) return;
    try {
      var src = "setInterval(function(){postMessage(1)}," + GUARD_EVERY + ");";
      var url = (window.URL || window.webkitURL).createObjectURL(new Blob([src], { type: "text/javascript" }));
      guardWorker = new Worker(url);
      guardWorker.onmessage = guard;
      guardWorker.onerror = function () {
        try {
          guardWorker.terminate();
        } catch (e) {}
        guardWorker = null;
        guardFallback = setInterval(guard, GUARD_EVERY);
      };
    } catch (e) {
      guardWorker = null;
      guardFallback = setInterval(guard, GUARD_EVERY);
    }
  }

  function stopGuard() {
    try {
      if (guardWorker) guardWorker.terminate();
    } catch (e) {}
    guardWorker = null;
    if (guardFallback) clearInterval(guardFallback);
    guardFallback = null;
  }

  // ---------------------------------------------------------------------------
  // تشغيل / إيقاف
  // ---------------------------------------------------------------------------
  function start() {
    if (disabled()) return;
    running = true;
    hookSessionActions();
    holdLock();
    startGuard();
    if (unlocked) play();
  }

  function stop(byUser) {
    running = false;
    if (byUser) {
      try {
        localStorage.setItem(LS_KEY, "1");
      } catch (e) {}
    }
    try {
      if (audio) audio.pause();
    } catch (e) {}
    stopCtx();
    stopGuard();
    setSession("paused");
  }

  // [ADDED] فحص الحالة من الكونسول: AK_STATUS() — بيوضح هل الصوت شغّال فعلًا
  window.AK_STATUS = function () {
    return {
      running: running,
      unlocked: unlocked,
      inChat: !!window.M_ID,
      audioExists: !!audio,
      paused: audio ? audio.paused : null,
      currentTime: audio ? Math.round(audio.currentTime * 10) / 10 : null,
      ctxState: actx ? actx.state : null,
      lock: lockHeld,
      sessionState: "mediaSession" in navigator ? navigator.mediaSession.playbackState : "n/a",
      disabledByUser: disabled()
    };
  };

  window.AK_START = function () {
    try {
      localStorage.removeItem(LS_KEY);
    } catch (e) {}
    start();
  };
  window.AK_STOP = function () {
    stop(true);
  };

  // ---------------------------------------------------------------------------
  // أول لمسة من المستخدم = فتح الصوت (سياسة المتصفحات)، وبعدها نشتغل تلقائيًا
  // ---------------------------------------------------------------------------
  function onGesture() {
    if (unlocked) return;
    unlocked = true;
    ["pointerdown", "touchend", "click", "keydown"].forEach(function (ev) {
      document.removeEventListener(ev, onGesture, true);
    });
    if (running) play();
  }
  ["pointerdown", "touchend", "click", "keydown"].forEach(function (ev) {
    document.addEventListener(ev, onGesture, true);
  });

  // رجوع للصفحة أو استئنافها: نتأكد إن الصوت لسه شغّال
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) guard();
  });
  window.addEventListener("pageshow", guard);
  window.addEventListener("focus", guard);

  // نبدأ فور ما المستخدم يدخل الشات (M_ID بيتحدد بعد تسجيل الدخول) وبنوقف لو اتحذف
  var wasIn = false;
  setInterval(function () {
    var inChat = !!window.M_ID;
    if (inChat && !wasIn) {
      wasIn = true;
      start();
    } else if (!inChat && wasIn) {
      wasIn = false;
      running = false;
      try {
        if (audio) audio.pause();
      } catch (e) {}
      stopCtx();
      stopGuard();
      setSession("none");
    }
  }, 1500);
})();
