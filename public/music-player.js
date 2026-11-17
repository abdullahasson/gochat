/*
 * مشغل الموسيقى لمقاعد الصوت
 *  - زر "تشغيل موسيقى" في خيارات المقعد (index.ejs, الكلاس .musicplay) -> MUSIC_OPEN()
 *  - لوحة التحكم (لصاحب المايك / مشرف الغرفة): رفع أغنية، تشغيل/إيقاف مؤقت، تقديم/تأخير 10 ثواني،
 *    إيقاف، شريط التقدم، التحكم في مستوى الصوت
 *  - الشريط الذي يراه كل أعضاء الغرفة تحت المايكات: اسم الأغنية + مؤثر صوتي (Visualizer) + كتم محلي
 *  - السيرفر هو مصدر الحالة (play/pause/seek/gain) وكل عميل يزامن صوته معها
 *  - الرد من السيرفر يوصل عن طريق x2.js (case "music") -> MUSIC_RECV
 *  - تغيير الغرفة يوصل عن طريق x2.js (حدث "ur") -> MUSIC_ROOM
 */
(function () {
  "use strict";

  var S = null;                      // آخر حالة من السيرفر { lid,url,name,by,hostId,playing,pos,gain }
  var base = { pos: 0, at: 0 };      // الموضع الذي وصلنا به الحالة + وقت وصولها محلياً
  var audio = null, actx = null, srcNode = null, gainNode = null, analyser = null;
  var localMute = false;
  var needTap = false;               // المتصفح منع التشغيل التلقائي -> ننتظر ضغطة
  var lastTrack = null;              // آخر أغنية رفعتها أنا { url, name }
  var myGain = 1;                    // مستوى الصوت الذي أبثه للأعضاء
  var uploading = false;
  var seeking = false;
  var rafId = 0;
  var $bar = null, $panel = null, $mini = null;
  var ended5 = 0;
  var gainT = 0;

  /* ---------------- أدوات ---------------- */
  function emit(cmd, data) {
    try { SEND_EVENT_EMIT("SEND_EVENT_EMIT_MUSIC_" + cmd, data || {}); } catch (e) {}
  }
  function myId() { return typeof M_ID != "undefined" ? M_ID : null; }
  function isHost() { return !!(S && myId() && S.hostId === myId()); }
  function canControl() {
    return isHost() || (typeof jstp != "undefined" && jstp && jstp.createroom);
  }
  function fmt(t) {
    if (!isFinite(t) || t < 0) t = 0;
    t = Math.floor(t);
    var m = Math.floor(t / 60), s = t % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }
  function cleanName(n) {
    return String(n || "").replace(/\.[^.]+$/, "").replace(/[_]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 70) || "أغنية";
  }
  function expectedPos() {
    if (!S) return 0;
    return S.playing ? base.pos + (Date.now() - base.at) / 1000 : base.pos;
  }

  /* ---------------- CSS ---------------- */
  function css() {
    if (document.getElementById("musicCss")) return;
    var c = [
      /* الشريط تحت المايكات */
      "#musicBar{display:none;align-items:center;gap:9px;margin:3px 4px 2px;padding:5px 10px;border-radius:14px;flex:0 0 auto;position:relative;overflow:hidden;direction:rtl;color:#fff;",
      "background:linear-gradient(135deg,#111827 0%,#312e81 55%,#4c1d95 100%);box-shadow:0 4px 14px rgba(76,29,149,.35),inset 0 0 0 1px rgba(255,255,255,.08)}",
      "#musicBar .mb-disc{flex:none;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;",
      "background:radial-gradient(circle at 50% 50%,#111827 0 18%,#7c3aed 19% 40%,#1f2937 41% 100%);box-shadow:0 0 0 2px rgba(255,255,255,.18)}",
      "#musicBar .mb-disc i{font-size:11px!important;color:#fff}",
      "#musicBar .mb-disc.spin{animation:mbSpin 3s linear infinite}",
      "@keyframes mbSpin{to{transform:rotate(360deg)}}",
      "#musicBar .mb-info{flex:1;min-width:0;line-height:1.25}",
      "#musicBar .mb-title{overflow:hidden;white-space:nowrap;font-weight:bold;font-size:13px!important}",
      "#musicBar .mb-title-in{display:inline-block;white-space:nowrap}",
      "#musicBar .mb-title-in.mb-scroll{animation:mbScroll var(--mbt,8s) linear infinite alternate}",
      "@keyframes mbScroll{0%,12%{transform:translateX(0)}88%,100%{transform:translateX(var(--mbd,0px))}}",
      "#musicBar .mb-sub{font-size:10.5px!important;opacity:.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      "#musicBar canvas.mb-fx{flex:none;width:92px;height:28px;direction:ltr}",
      "#musicBar .mb-btn{flex:none;width:28px;height:28px;border:0;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center}",
      "#musicBar .mb-btn:hover{background:rgba(255,255,255,.26)}",
      "#musicBar .mb-btn i{font-size:13px!important;color:#fff}",
      "#musicBar .mb-tap{position:absolute;inset:0;display:none;align-items:center;justify-content:center;gap:8px;background:rgba(17,24,39,.88);font-weight:bold;font-size:13px!important;cursor:pointer;backdrop-filter:blur(2px)}",
      "#musicBar.need-tap .mb-tap{display:flex}",

      /* لوحة التحكم */
      "#musicMini{position:fixed;left:12px;bottom:96px;width:50px;height:50px;border-radius:50%;z-index:9300;display:none;align-items:center;justify-content:center;cursor:pointer;color:#fff;background:linear-gradient(135deg,#7c3aed,#4f46e5);box-shadow:0 6px 18px rgba(76,29,149,.55),0 0 0 3px rgba(255,255,255,.85)}",
      "#musicMini i{font-size:20px!important;color:#fff}",
      "#musicMini.spin i{animation:mbSpin 3s linear infinite}",

      /* لوحة مكتبة الصوتيات */
      "#musicPanel{position:fixed;inset:0;z-index:9300;background:rgba(0,0,0,.45);display:none;align-items:center;justify-content:center;direction:rtl}",
      "#musicPanel .mp-box{width:min(94vw,400px);max-height:96vh;overflow:auto;background:#f1f5f9;border-radius:14px;box-shadow:0 14px 40px rgba(0,0,0,.45);animation:mpIn .2s ease-out;color:#1e3a5f;border:1px solid #8b95a1}",
      "@keyframes mpIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}",
      "#musicPanel .mp-head{background:#843a52;color:#fff;display:flex;align-items:stretch;font-weight:bold;font-size:17px;min-height:50px}",
      "#musicPanel .mp-x{flex:none;width:50px;display:flex;align-items:center;justify-content:center;background:#d9534f;cursor:pointer;border:1px solid rgba(0,0,0,.25);font-size:18px}",
      "#musicPanel .mp-x i{color:#fff;font-size:16px!important}",
      "#musicPanel .mp-ttl{flex:1;display:flex;align-items:center;gap:10px;padding:0 14px}",
      "#musicPanel .mp-ttl i{font-size:15px!important;color:#fff}",
      "#musicPanel .mp-body{padding:12px}",
      "#musicPanel .mp-card{background:#fff;border:1px solid #dde4ec;border-radius:12px;padding:12px 14px;margin-bottom:10px}",
      "#musicPanel .mp-src{line-height:1.55;position:relative;overflow:hidden}",
      "#musicPanel .mp-l1{font-weight:bold;font-size:16px;color:#1f2937;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      "#musicPanel .mp-l2{font-weight:bold;font-size:16px;color:#4b5f78}",
      "#musicPanel .mp-l3{font-size:14px;color:#8793a3}",
      "#musicPanel .mp-upbar{display:none;position:absolute;left:0;right:0;bottom:0;height:3px;background:#e5e9ef}",
      "#musicPanel .mp-upbar i{display:block;height:100%;width:0;margin-right:0;margin-left:auto;background:#843a52;transition:width .12s}",
      "#musicPanel .mp-msg{display:none;margin-bottom:10px;padding:7px 10px;border-radius:10px;background:#fee2e2;color:#b91c1c;font-size:13px;text-align:center}",
      "#musicPanel .mp-btns{display:flex;gap:10px;margin-bottom:10px}",
      "#musicPanel .mp-btns button{border:1px solid rgba(30,58,95,.35);border-radius:9px;padding:11px 4px;font-size:16px;font-weight:bold;color:#fff;cursor:pointer;font-family:inherit}",
      "#musicPanel .mp-bu{flex:1.5;background:#843a52;border-color:#4f6b8f!important}",
      "#musicPanel .mp-pp{flex:1.2;background:#ad7788;border-color:#7d9bc0!important}",
      "#musicPanel .mp-clr{flex:.7;background:#e48c87;border-color:#d97f7a!important}",
      "#musicPanel .mp-btns button.dis{opacity:.55}",
      "#musicPanel .mp-row{display:flex;align-items:center;justify-content:space-between}",
      "#musicPanel .mp-lab{font-weight:bold;font-size:17px;color:#1f2f46}",
      "#musicPanel .mp-badge{background:#e6eef7;color:#1e3a5f;font-weight:bold;font-size:17px;border-radius:14px;padding:3px 14px;min-width:70px;text-align:center}",
      "#musicPanel input[type=range].mp-r{-webkit-appearance:none;appearance:none;display:block;width:100%;height:16px;border-radius:10px;outline:none;direction:rtl;margin:14px 0 6px;cursor:pointer;border:1px solid #cdd5de;background:linear-gradient(to left,#2c5a82 var(--p,50%),#ececec var(--p,50%))}",
      "#musicPanel input[type=range].mp-r::-webkit-slider-thumb{-webkit-appearance:none;width:30px;height:30px;border-radius:50%;background:#2c5a82;border:3px solid #4a77a1;box-shadow:0 1px 4px rgba(0,0,0,.3)}",
      "#musicPanel input[type=range].mp-r::-moz-range-thumb{width:24px;height:24px;border-radius:50%;background:#2c5a82;border:3px solid #4a77a1}",
      "#musicPanel input[type=range].mp-r::-moz-range-track{background:transparent}",
      "#musicPanel .mp-foot{text-align:center;color:#5d7088;font-size:15px;line-height:1.7;padding:4px 6px 2px}"
    ].join("");
    var st = document.createElement("style");
    st.id = "musicCss";
    st.textContent = c;
    (document.head || document.documentElement).appendChild(st);
  }

  /* ---------------- الصوت ---------------- */
  function ensureAudio() {
    if (audio) return;
    audio = new Audio();
    audio.preload = "auto";
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      actx = new AC();
      srcNode = actx.createMediaElementSource(audio);
      gainNode = actx.createGain();
      analyser = actx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      srcNode.connect(gainNode);
      gainNode.connect(analyser);
      analyser.connect(actx.destination);
    } catch (e) {
      actx = null; gainNode = null; analyser = null;
    }
    audio.addEventListener("loadedmetadata", function () { syncNow(true); updatePanel(); });
    audio.addEventListener("canplay", function () { if (S && S.playing && audio.paused) tryPlay(); });
    audio.addEventListener("play", function () { updateBar(); });
    audio.addEventListener("pause", function () { updateBar(); });
    audio.addEventListener("ended", function () {
      updateBar();
      if (!S) return;
      if (isHost()) { emit("ENDED", {}); return; }
      var lid = S.lid;
      clearTimeout(ended5);
      ended5 = setTimeout(function () { if (S && S.lid === lid && audio.ended) stopLocal(); }, 5000);
    });
  }
  function applyVolume() {
    if (!audio) return;
    var v = localMute ? 0 : (S ? S.gain : myGain);
    if (typeof v != "number" || !isFinite(v)) v = 0.8;
    if (gainNode) { gainNode.gain.value = v; audio.volume = 1; }
    else { try { audio.volume = v; } catch (e) {} }
  }
  function tryPlay() {
    ensureAudio();
    /* لا ننتظر resume(): في كروم يظل معلّقاً حتى أول ضغطة من المستخدم */
    try { if (actx && actx.state === "suspended") actx.resume().catch(function () {}); } catch (e) {}
    var p;
    try { p = audio.play(); } catch (e) { needTap = true; updateBar(); return; }
    var chk = function () {
      setTimeout(function () { needTap = !!(actx && actx.state !== "running"); updateBar(); }, 350);
    };
    if (p && p.then) p.then(chk, function () { needTap = true; updateBar(); });
    else chk();
  }
  function syncNow(hard) {
    if (!S || !audio) return;
    var exp = expectedPos();
    if (audio.readyState >= 1) {
      var dur = audio.duration;
      if (isFinite(dur) && exp > dur) exp = dur;
      if (Math.abs(audio.currentTime - exp) > (hard ? 0.25 : 1.5)) {
        try { audio.currentTime = exp; } catch (e) {}
      }
    }
    if (S.playing) { if (audio.paused && (hard || !needTap)) tryPlay(); }
    else if (!audio.paused) { try { audio.pause(); } catch (e) {} }
  }

  /* ---------------- استقبال الحالة ---------------- */
  /* [ADDED] فحص من الكونسول: MUSIC_STATUS() — بيوضح هل وصلت حالة الأغنية وهل الصوت شغّال */
  window.MUSIC_STATUS = function () {
    return {
      gotState: !!S, state: S ? { name: S.name, playing: S.playing, host: S.hostId } : null,
      barExists: !!$bar, barVisible: $bar ? $bar.css("display") : null,
      audioPaused: audio ? audio.paused : null, src: audio ? audio.src : null,
      ctx: actx ? actx.state : null, needTap: needTap, localMute: localMute, me: myId()
    };
  };
  window.MUSIC_RECV = function (d) {
    if (!d || typeof d != "object") return;
    css();
    if (d.act === "stop") { stopLocal(d.why); return; }
    if (d.act !== "state" || typeof d.url != "string") return;
    ensureAudio();
    var newTrack = !S || S.lid !== d.lid;
    S = d;
    base = { pos: typeof d.pos == "number" ? d.pos : 0, at: Date.now() };
    clearTimeout(ended5);
    if (newTrack) {
      /* صاحب الأغنية: الملف المحلي شغال بالفعل، نكمل عليه بدون إعادة تحميل أو قطع */
      var adopt = localTrack && localTrack.serverUrl === d.url && d.hostId === myId() && audio.src === localTrack.blob;
      if (!adopt) {
        audio.src = d.url;
        try { audio.load(); } catch (e) {}
      }
    }
    applyVolume();
    showBar();
    syncNow(true);
    updatePanel();
  };
  /* غيّرت الغرفة أو خرجت منها */
  window.MUSIC_ROOM = function () {
    if (curXhr) { try { curXhr.abort(); } catch (e) {} curXhr = null; }
    if (localTrack) localTrack.aborted = true;
    stopLocal();
    dropLocal();
    closePanel();
  };
  function stopLocal() {
    /* لو أنا لسه برفع أغنية جديدة (والقديمة اتوقفت) نسيب الصوت المحلي شغال */
    var keep = !!(localTrack && !localTrack.done && !localTrack.aborted);
    S = null;
    clearTimeout(ended5);
    if (audio && !keep) {
      try { audio.pause(); } catch (e) {}
      try { audio.removeAttribute("src"); audio.load(); } catch (e) {}
    }
    if (!keep) dropLocal();
    needTap = false;
    hideBar();
    if ($mini) $mini.css("display", "none");
    updatePanel();
  }

  /* ---------------- الشريط تحت المايكات ---------------- */
  function buildBar() {
    if ($bar) return;
    css();
    $bar = $(
      '<div id="musicBar" dir="rtl">' +
        '<div class="mb-disc"><i class="fa fa-music"></i></div>' +
        '<div class="mb-info"><div class="mb-title"><span class="mb-title-in"></span></div><div class="mb-sub"></div></div>' +
        '<canvas class="mb-fx" width="184" height="56"></canvas>' +
        '<button class="mb-btn mb-mute" title="كتم / تشغيل الصوت عندي"><i class="fa fa-volume-up"></i></button>' +
        '<button class="mb-btn mb-set" title="مشغل الموسيقى" style="display:none"><i class="fa fa-sliders"></i></button>' +
        '<div class="mb-tap"><i class="fa fa-volume-up"></i> اضغط لتشغيل الموسيقى</div>' +
      "</div>"
    );
    $(".broadcasters").first().after($bar);
    $bar.find(".mb-mute").on("click", function (e) {
      e.stopPropagation();
      localMute = !localMute;
      applyVolume();
      updateBar();
    });
    $bar.find(".mb-set").on("click", function (e) {
      e.stopPropagation();
      MUSIC_OPEN();
    });
    $bar.find(".mb-tap").on("click", function (e) {
      e.stopPropagation();
      tryPlay();
    });
  }
  function showBar() {
    buildBar();
    $bar.css("display", "flex");
    updateBar(true);
    if (!rafId) rafId = requestAnimationFrame(draw);
  }
  function hideBar() {
    if ($bar) $bar.css("display", "none");
  }
  var lastTitleKey = "";
  function updateBar(force) {
    if (!$bar || !S) return;
    var key = S.lid + "|" + S.name;
    var $in = $bar.find(".mb-title-in");
    if (force || key !== lastTitleKey) {
      lastTitleKey = key;
      $in.removeClass("mb-scroll").text(S.name || "");
      $bar.find(".mb-sub").text(S.by ? "بواسطة: " + S.by : "");
      setTimeout(function () {
        var box = $bar.find(".mb-title")[0], el = $in[0];
        if (!box || !el) return;
        var over = el.scrollWidth - box.clientWidth;
        if (over > 4) {
          el.style.setProperty("--mbd", over + "px");
          el.style.setProperty("--mbt", Math.max(5, Math.round(over / 18) + 4) + "s");
          $in.addClass("mb-scroll");
        }
      }, 60);
    }
    var playing = !!(S.playing && audio && !audio.paused);
    $bar.find(".mb-disc").toggleClass("spin", playing);
    $bar.toggleClass("need-tap", !!(needTap && S.playing));
    $bar.find(".mb-mute i").attr("class", "fa " + (localMute ? "fa-volume-off" : "fa-volume-up"));
    $bar.find(".mb-set").css("display", canControl() ? "flex" : "none");
  }

  /* ---------------- المؤثر الصوتي (Visualizer) ---------------- */
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }
  function draw() {
    rafId = 0;
    if (!$bar || !S || $bar.css("display") === "none") return;
    var cv = $bar.find("canvas.mb-fx")[0];
    if (cv) {
      var c = cv.getContext("2d"), W = cv.width, H = cv.height;
      c.clearRect(0, 0, W, H);
      var N = 16, gap = 5, bw = (W - gap * (N - 1)) / N;
      var playing = !!(S.playing && audio && !audio.paused);
      var arr = null;
      if (playing && analyser && actx && actx.state === "running") {
        arr = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(arr);
      }
      var t = Date.now() / 1000;
      var g = c.createLinearGradient(0, H, 0, 0);
      g.addColorStop(0, "#7c3aed");
      g.addColorStop(1, "#22d3ee");
      c.fillStyle = g;
      for (var i = 0; i < N; i++) {
        var v;
        if (arr) {
          var idx = Math.min(arr.length - 1, Math.floor(Math.pow(i / (N - 1), 1.5) * arr.length * 0.55));
          v = Math.min(1, arr[idx] / 255 * 1.15);
        } else if (playing) {
          v = 0.22 + 0.4 * Math.abs(Math.sin(t * 2.4 + i * 0.75)) * (0.6 + 0.4 * Math.sin(t * 1.1 + i));
        } else {
          v = 0.07;
        }
        var bh = Math.max(5, v * H);
        rr(c, i * (bw + gap), H - bh, bw, bh, bw / 2);
        c.fill();
      }
    }
    rafId = requestAnimationFrame(draw);
  }

  /* ---------------- لوحة مكتبة الصوتيات ---------------- */
  var micGain = 1;                   // مستوى صوت المايك (0 - 2)
  var localTrack = null;             // الأغنية المحلية التي تعمل فوراً أثناء الرفع { name, blob, serverUrl, done, aborted }
  var curXhr = null;
  var upPct = 0;
  var micCtx = null, micNode = null, micDest = null, micRaw = null, micProc = null;

  function fill($r) {
    var el = $r[0];
    el.style.setProperty("--p", ((el.value - el.min) / (el.max - el.min) * 100) + "%");
  }
  function buildPanel() {
    if ($panel) return;
    css();
    $panel = $(
      '<div id="musicPanel" dir="rtl"><div class="mp-box">' +
        '<div class="mp-head"><span class="mp-x" title="إغلاق"><i class="fa fa-times"></i></span><span class="mp-ttl">مكتبة الصوتيات<i class="fa fa-info"></i></span></div>' +
        '<div class="mp-body">' +
          '<div class="mp-card mp-src">' +
            '<div class="mp-l1">لا يوجد مصدر صوتى</div>' +
            '<div class="mp-l2">اختر ملف MP3</div>' +
            '<div class="mp-l3">المصدر: بدون مصدر</div>' +
            '<div class="mp-upbar"><i></i></div>' +
          "</div>" +
          '<div class="mp-msg"></div>' +
          '<div class="mp-btns">' +
            '<button class="mp-bu">رفع MP3</button>' +
            '<button class="mp-pp dis">تشغيل الصوت</button>' +
            '<button class="mp-clr dis">مسح</button>' +
          "</div>" +
          '<div class="mp-card"><div class="mp-row"><span class="mp-lab">صوت المايك</span><span class="mp-badge mp-mvt">100%</span></div>' +
            '<input type="range" class="mp-r mp-mv" min="0" max="200" value="100"></div>' +
          '<div class="mp-card"><div class="mp-row"><span class="mp-lab">صوت الأغنية</span><span class="mp-badge mp-svt">100%</span></div>' +
            '<input type="range" class="mp-r mp-sv" min="0" max="200" value="100"></div>' +
          '<div class="mp-foot">يمكنك خلط صوت الملف وصوت المايك بنسب مختلفة.</div>' +
        "</div>" +
      "</div></div>"
    );
    $("body").append($panel);
    $panel.on("click", function (e) { if (e.target === this) minimizePanel(); });
    $panel.find(".mp-x").on("click", minimizePanel);
    $panel.find(".mp-bu").on("click", pickFile);
    $panel.find(".mp-clr").on("click", clearAll);
    $panel.find(".mp-pp").on("click", togglePlay);

    $panel.find(".mp-mv").on("input", function () {
      micGain = this.value / 100;
      $panel.find(".mp-mvt").text(this.value + "%");
      fill($(this));
      micApply();
    });
    $panel.find(".mp-sv").on("input", function () {
      myGain = this.value / 100;
      $panel.find(".mp-svt").text(this.value + "%");
      fill($(this));
      applyVolume();
      clearTimeout(gainT);
      gainT = setTimeout(function () { if (S && canControl()) emit("GAIN", { gain: myGain }); }, 80);
    });
  }
  /* تشغيل / إيقاف مؤقت */
  function togglePlay() {
    if (S) {
      if (!canControl()) return;
      emit(S.playing ? "PAUSE" : "PLAY", { pos: audio ? audio.currentTime : 0 });
    } else if (localTrack && !localTrack.done && audio) {
      if (audio.paused) tryPlay(); else { try { audio.pause(); } catch (e) {} }
      setTimeout(updatePanel, 50);
    } else if (lastTrack) {
      emit("LOAD", { url: lastTrack.url, name: lastTrack.name, gain: myGain });
    } else {
      pickFile();
    }
  }
  /* مسح: إيقاف الأغنية عند الجميع وتفريغ المصدر */
  function clearAll() {
    if (curXhr) { try { curXhr.abort(); } catch (e) {} curXhr = null; }
    if (localTrack) localTrack.aborted = true;
    if (S && canControl()) emit("STOP", {});
    dropLocal();
    lastTrack = null;
    if (!S && audio) {
      try { audio.pause(); } catch (e) {}
      try { audio.removeAttribute("src"); audio.load(); } catch (e) {}
    }
    upPct = 0;
    updatePanel();
  }
  function dropLocal() {
    if (localTrack && localTrack.blob) { try { URL.revokeObjectURL(localTrack.blob); } catch (e) {} }
    localTrack = null;
  }
  function panelMsg(t) {
    if (!$panel) return;
    var $m = $panel.find(".mp-msg");
    $m.text(t).show();
    clearTimeout($m.data("t"));
    $m.data("t", setTimeout(function () { $m.hide(); }, 5000));
  }
  function curInfo() {
    if (S) return { name: S.name, src: isHost() ? "ملف من جهازك" : (S.by || "غير معروف"), playing: !!S.playing };
    if (localTrack && !localTrack.done) return { name: localTrack.name, src: "ملف من جهازك", playing: !!(audio && !audio.paused) };
    if (lastTrack) return { name: lastTrack.name, src: "ملف من جهازك", playing: false };
    return null;
  }
  function updatePanel() {
    if (!$panel || $panel.css("display") === "none") return;
    var inf = curInfo();
    $panel.find(".mp-l1").text(inf ? inf.name : "لا يوجد مصدر صوتى");
    $panel.find(".mp-l2").text(inf ? (inf.playing ? "يعمل الآن" : "متوقف مؤقتاً") : "اختر ملف MP3");
    $panel.find(".mp-l3").text("المصدر: " + (inf ? inf.src : "بدون مصدر"));
    $panel.find(".mp-pp").text(inf && inf.playing ? "إيقاف مؤقت" : "تشغيل الصوت").toggleClass("dis", !inf);
    $panel.find(".mp-clr").toggleClass("dis", !inf);
    var up = !!curXhr;
    /* [CHANGED] شريط ونسبة الرفع مخفيين — الأغنية بتشتغل فوراً أثناء الرفع */
    $panel.find(".mp-upbar").css("display", "none");
    if (S && typeof S.gain == "number") {
      var gv = Math.round(S.gain * 100);
      var $sv = $panel.find(".mp-sv");
      if (gv !== Math.round(myGain * 100) && !$sv.is(":active")) {
        myGain = S.gain;
        $sv.val(gv); fill($sv);
        $panel.find(".mp-svt").text(gv + "%");
      }
    }
  }
  setInterval(function () {
    /* [FIX-PERF] لا عمل إطلاقاً والصفحة مخفية ولا شيء يعمل — يوفر المعالج والبطارية */
    if (document.hidden && !(audio && !audio.paused)) return;
    /* تصحيح الانحراف + تحديث الشريط */
    if (S && S.playing) syncNow(false);
    if ($bar && S) updateBar();
    if ($mini && (S || localTrack)) $mini.toggleClass("spin", !!(audio && !audio.paused));
    if ($panel && $panel.css("display") !== "none") updatePanel();
  }, 500);
  /* [FIX-PERF] micApply كانت تعمل كل 1200ms للأبد — الآن: خروج فوري بلا أي عمل
     لو ما فيه ميكروفون غرفة فعّال ولا معالج صوت قائم، والمعالجة تحصل فقط أثناء التفعيل */
  setInterval(function () {
    if (typeof ie === "undefined" || !ie) {
      if (micCtx) { try { micApply(); } catch (e) {} }
      return;
    }
    try { micApply(); } catch (e) {}
  }, 1200);

  window.MUSIC_OPEN = function () {
    buildPanel();
    $panel.css("display", "flex");
    if ($mini) $mini.css("display", "none");
    var $sv = $panel.find(".mp-sv"), $mv = $panel.find(".mp-mv");
    $sv.val(Math.round(myGain * 100)); fill($sv);
    $mv.val(Math.round(micGain * 100)); fill($mv);
    $panel.find(".mp-svt").text(Math.round(myGain * 100) + "%");
    $panel.find(".mp-mvt").text(Math.round(micGain * 100) + "%");
    updatePanel();
  };
  function closePanel() {
    if ($panel) $panel.css("display", "none");
    if ($mini) $mini.css("display", "none");
  }
  /* تصغير النافذة على شكل دائرة */
  function minimizePanel() {
    if ($panel) $panel.css("display", "none");
    if (!$mini) {
      $mini = $('<div id="musicMini" title="مكتبة الصوتيات"><i class="fa fa-music"></i></div>');
      $mini.on("click", function () { MUSIC_OPEN(); });
      $("body").append($mini);
    }
    $mini.toggleClass("spin", !!(audio && !audio.paused));
    $mini.css("display", (S || lastTrack || localTrack) ? "flex" : "none");
  }

  /* ---------------- صوت المايك (تضخيم حتى 200%) ---------------- */
  function micReset() {
    if (micCtx) { try { micCtx.close(); } catch (e) {} }
    micCtx = micNode = micDest = micRaw = micProc = null;
  }
  function micPush() {
    if (!micProc || typeof ic === "undefined" || !ic || !ic.peeres) return;
    for (var a in ic.peeres) {
      var m = ic.peeres[a];
      for (var b in m) {
        var pc = m[b];
        if (!pc || !pc.getSenders) continue;
        pc.getSenders().forEach(function (sn) {
          if (sn.track && sn.track === micRaw) { try { sn.replaceTrack(micProc).catch(function () {}); } catch (e) {} }
        });
      }
    }
  }
  function micApply() {
    try {
      if (typeof ie === "undefined" || !ie) { if (micCtx) micReset(); return; }
      var raw = ie.getAudioTracks && ie.getAudioTracks()[0];
      if (!raw) return;
      if (!micCtx && Math.abs(micGain - 1) < 0.001) return;
      if (!micCtx || micRaw !== raw) {
        micReset();
        var AC = window.AudioContext || window.webkitAudioContext;
        micCtx = new AC();
        micNode = micCtx.createGain();
        var src = micCtx.createMediaStreamSource(new MediaStream([raw]));
        micDest = micCtx.createMediaStreamDestination();
        src.connect(micNode);
        micNode.connect(micDest);
        micRaw = raw;
        micProc = micDest.stream.getAudioTracks()[0];
      }
      if (micCtx.state === "suspended") micCtx.resume().catch(function () {});
      micNode.gain.value = micGain;
      micPush();
    } catch (e) {}
  }

  /* ---------------- رفع الأغنية: تشغيل فوري عند صاحب الأغنية أثناء الرفع ---------------- */
  function pickFile() {
    if (curXhr) return;
    var inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "audio/*,.mp3,.wav,.ogg,.m4a,.aac,.opus,.flac";
    inp.style.display = "none";
    inp.onchange = function () {
      var f = inp.files && inp.files[0];
      if (f) upload(f);
    };
    inp.click();
  }
  function upload(f) {
    if (curXhr) return;
    if (f.size > 40 * 1024 * 1024) return panelMsg("حجم الملف كبير جداً (الحد الأقصى 40 ميجا)");
    if (!/\.(mp3|wav|ogg|oga|m4a|aac|weba|webm|opus|flac|mp4)$/i.test(f.name)) return panelMsg("اختر ملفاً صوتياً (mp3 / wav / ogg / m4a)");
    if (S && !isHost() && !canControl()) return panelMsg("يوجد مشغل موسيقى يعمل بالفعل في هذه الغرفة");

    /* لو في أغنية شغالة نوقفها ونبدأ الجديدة فوراً */
    if (S && canControl()) emit("STOP", {});
    dropLocal();
    localTrack = { name: cleanName(f.name), blob: URL.createObjectURL(f), serverUrl: null, done: false, aborted: false };
    var mine = localTrack;
    ensureAudio();
    clearTimeout(ended5);
    audio.src = mine.blob;
    applyVolume();
    tryPlay();                         /* تشغيل مباشر بدون انتظار انتهاء الرفع */

    var fd = new FormData();
    fd.append("photo", f);
    upPct = 0;
    $.ajax({
      url: "/uploadmusic?token=" + encodeURIComponent(typeof MY_T != "undefined" ? MY_T : ""),
      type: "POST",
      data: fd,
      processData: false,
      contentType: false,
      cache: false,
      timeout: 0,
      xhr: function () {
        var xhr = $.ajaxSettings.xhr();
        curXhr = xhr;
        if (xhr.upload) {
          xhr.upload.addEventListener("progress", function (ev) {
            if (!ev.lengthComputable) return;
            upPct = Math.round(ev.loaded / ev.total * 100);
          }, false);
        }
        return xhr;
      },
      success: function (r) {
        if (mine.aborted || localTrack !== mine) return;
        var j = null;
        try { j = typeof r === "string" ? JSON.parse(r) : r; } catch (e) {}
        if (j && !j.err && j.url) {
          mine.serverUrl = j.url;
          lastTrack = { url: j.url, name: mine.name };
          mine.done = true;
          if (audio && !audio.ended && audio.src === mine.blob) {
            /* نبلّغ السيرفر بمكان الأغنية الحالي ليدخل باقي الأعضاء معنا في نفس النقطة */
            var pos = audio.currentTime, paused = audio.paused;
            emit("LOAD", { url: j.url, name: mine.name, gain: myGain, pos: pos });
            if (paused) setTimeout(function () { emit("PAUSE", { pos: pos }); }, 260);
            /* لو السيرفر رفض التشغيل (مثلاً مشغل آخر في الغرفة) نوقف الصوت المحلي */
            /* [FIX-MUSIC] لو السيرفر ما ردش بالحالة نعيد الأمر مرة، ولو لسه ما ردش نوضّح للمستخدم ليه وقفت */
            setTimeout(function () {
              if (localTrack === mine && (!S || S.url !== j.url) && audio && audio.src === mine.blob) {
                emit("LOAD", { url: j.url, name: mine.name, gain: myGain, pos: audio.currentTime });
              }
            }, 1800);
            setTimeout(function () {
              if (localTrack === mine && (!S || S.url !== j.url)) {
                try { audio.pause(); } catch (e) {}
                dropLocal();
                panelMsg("السيرفر ما أكدش تشغيل الأغنية — تأكد إنك على المايك وجرّب تاني");
                updatePanel();
              }
            }, 4500);
          }
        } else {
          panelMsg((j && j.msg) || "فشل رفع الأغنية");
          failLocal(mine);
        }
      },
      error: function (x, st) {
        if (mine.aborted || st === "abort") return;
        var m = "فشل رفع الأغنية";
        try { var j = JSON.parse(x.responseText); if (j && j.msg) m = j.msg; } catch (e) {}
        panelMsg(m);
        failLocal(mine);
      },
      complete: function () {
        curXhr = null;
        upPct = 0;
        updatePanel();
      }
    });
    updatePanel();
  }
  function failLocal(mine) {
    if (localTrack !== mine) return;
    try { audio.pause(); audio.removeAttribute("src"); audio.load(); } catch (e) {}
    dropLocal();
    updatePanel();
  }


  /* زر المقعد: يشتغل حتى لو x2.js القديم محفوظ في الكاش.
     أي شخص طلع على المقعد يظهر له الزر في مقعده (ومشرف الغرفة في أي مقعد) */
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var mp = t.closest(".musicplay");
    if (mp) {
      e.preventDefault(); e.stopPropagation();
      var sp = $(mp).closest("#showpf");
      if (sp.length) sp.hide();
      MUSIC_OPEN();
      return;
    }
    var ev = t.closest(".broadcasters .evant");
    if (ev) {
      var prod = $(ev).closest(".prod");
      var mine = prod.attr("id") === "prod" + myId();
      var admin = typeof jstp != "undefined" && jstp && jstp.createroom;
      $(".musicplay").css("display", (mine || admin) ? "block" : "none");
    }
  }, true);

  /* أول ضغطة في الصفحة: لو المتصفح منع التشغيل التلقائي نشغّل الأغنية */
  document.addEventListener("pointerdown", function () {
    if (S && S.playing && needTap) tryPlay();
  }, true);
})();
