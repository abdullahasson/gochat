/* =====================================================================================
   [ADDED - MD FX GUARD] public/md-fx-guard/md-fx-guard.js — حارس مؤثرات تصميم العضوية
   =====================================================================================
   "الشات كله بيهنج ورسايل الغرفة بتتقل لما أحط مؤثر" — السبب مش المميزات نفسها،
   إنما إنها بتشتغل بلا حاكم: اللمعة (GIF جوه background-clip:text) + الإطار المتحرك
   + لمعة الاسم المتحركة بترسم كل فريم على كل عنصر ظاهر، طول ما الشات فاتح.
   لو 10 أعضاء لابسين مؤثرات = عاصفة رسم مستمرة → المعالج بيتخم → تهنيج.

   الحارس ده بيطبّق نفس مبدأ التطبيقات الكبيرة (ديسكورد/تيليجرام مع الأفتارات المتحركة):
   "ميزانية رسم" + "جودة تكيفية":
     1) قياس FPS لحظي (rAF — تكلفته صفر تقريبًا): أول ما الأداء يقع → تنزل الجودة فورًا
        للوضع الثابت (كلاس pf-fx-off على <html> — القواعد في md-fx-guard.css):
        نفس شكل المؤثرات بالظبط (أول فريم من اللمعة/الإطار + التدرج) من غير حركة.
     2) سقف عاصفة: لو المؤثرات المتحركة الظاهرة عدّت 16 → وضع ثابت (بيحصل قبل ما
        الجهاز يتهنيج أصلًا). الرجوع للحركة محتاج العدد ينزل تحت 7.
     3) نزول سريع / رجوع بطيء (hysteresis): 4 ثواني واطية في آخر 10 = نزول.
        رجوع = 45 ثانية كويسة متواصلة + عدد قليل + 90 ثانية على الأقل في الوضع الثابت
        (عشان الشكل ما يرفرفش قدام العضو).
     4) إيقاف خارج الشاشة في #d2 (IntersectionObserver): آخر 14 رسالة بتفضل تتحرك
        حتى لو العضو سكرل لفوق بيقرا — دلوقتي اللي بعيد عن الشاشة (350px) يتجمّد
        على نسخته الثابتة (data-fx-pause). perf-pause ما بيغطيش #d2 عمدًا (وميض
        أيقونات الرتب) — هنا بنغطي اللمعة/الإطار بس (عناصر مخصوصة للمؤثر).
   التفعيل الثابت من الأول (من غير انتظار تهنيج):
     • جهاز ضعيف (html.pf-weak من سكربت الكشف المبكر في index.ejs).
     • prefers-reduced-motion (احترام إعداد نظام المستخدم).
   البروفايل والاستوديو مش داخلين في أي قاعدة → الحركة هناك سليمة دايمًا.

   تحكم يدوي (للتجربة): localStorage.mdFxGuard = 'static' | 'anim' | 'auto' (الافتراضي).
   من الكونسول: MdFxGuard.force('static'|'anim'|'auto') + MdFxGuard.stats()
   + MdFxGuard.tune({...}) للضبط الحي (القسم [v2] تحت — بدون تعديل الملف):
     MdFxGuard.tune({ cap: 12, recoverCap: 4, downBads: 3, upRun: 30, upDwell: 60 })
   ملاحظة بصرية موثّقة (ملاذ أخير): إطار GIF من دومين خارجي بدون نسخة ثابتة جاهزة
   بيتخبى مؤقتًا تحت pf-fx-off فقط (وقت التهنيج الفعلي) — تحت pf-weak/الرؤية سليم.
   ملف مستقل إضافي بالكامل: مفيش أي تعديل في x2.js / member-design.js / name-glitter.js ...
   (بيغلّف window.nameGlitterEnqueue و GCFrameStatic.attach بغلاف شفاف عشان يرصد
   المؤثرات اللي بتتطبّق على رسايل موجودة فعلًا — نفس أسلوب glow-core-v8.js مع
   memberDesignApplyUser).
   ===================================================================================== */
(function () {
  'use strict';
  if (window.MdFxGuard) return;

  var root = document.documentElement;
  var CLS = 'pf-fx-off';

  /* ---------- الإعدادات ---------- */
  var CAP = 16;            /* سقف المؤثرات المتحركة الظاهرة قبل التنزيل للوضع الثابت */
  var RECOVER_CAP = 6;     /* الرجوع للحركة محتاج عدد أقل من كده */
  var BAD = 0.55;          /* فريم/ثانية أقل من 55% من سقف الجهاز = ثانية واطية */
  var GOOD = 0.85;         /* 85%+ = ثانية كويسة */
  var DOWN_BADS = 4;       /* نزول بعد 4 ثواني واطية */
  var DOWN_WINDOW = 10;    /* ...ضمن آخر 10 ثواني */
  var CRASH = 12;          /* أقل من كده مع وجود مؤثرات = نزول فوري (العضو حاسس بتجميد) */
  var UP_RUN = 45;         /* رجوع بعد 45 ثانية كويسة متواصلة */
  var UP_DWELL = 90;       /* ...و90 ثانية على الأقل وهي في الوضع الثابت */
  var COUNT_MS = 5000;     /* عدّ المؤثرات كل 5 ثواني */
  var VIEW_MARGIN = '350px 0px'; /* هامش إيقاف خارج الشاشة في #d2 */

  /* ---------- الحالة ---------- */
  var level = 'anim';      /* 'anim' | 'static' */
  var reason = 'boot';
  var forced = false;
  var weak = false, prm = false;
  try { weak = root.classList.contains('pf-weak'); } catch (e) {}
  try { prm = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) {}

  var st = { samples: [], ceiling: 60, goodRun: 0, downAt: 0, switches: 0 };
  var liveT = 0, liveN = 0;

  function apply() { root.classList.toggle(CLS, level === 'static'); }
  function down(why) {
    if (level === 'static') return;
    level = 'static'; reason = why;
    st.downAt = Date.now(); st.goodRun = 0; st.switches++;
    apply();
  }
  function up(why) {
    if (level === 'anim') return;
    level = 'anim'; reason = why; st.switches++;
    apply();
  }

  /* ---------- قرار البداية ---------- */
  var ov = '';
  try { ov = (localStorage.getItem('mdFxGuard') || '').trim().toLowerCase(); } catch (e) {}
  if (ov === 'static' || ov === 'anim') { forced = true; level = ov; reason = 'manual'; }
  else if (prm) { level = 'static'; reason = 'reduced-motion'; }
  else if (weak) { level = 'static'; reason = 'weak-device'; }
  apply();

  /* ---------- عدّ المؤثرات المتحركة الظاهرة ----------
     اللمعة (data-mdg="ok") + الإطار (.md-avframe/.u-frame-ov) بالفحص البصري
     (getBoundingClientRect — قراءات متتالية بلا كتابة = flush واحد)،
     والسويب ([data-nsh-v="1"]) مرئيته محسومة أصلاً من IntersectionObserver بتاع name-shine. */
  function visible(els) {
    var c = 0, h = window.innerHeight || 0, i, el, r;
    for (i = 0; i < els.length; i++) {
      el = els[i];
      if (el.getAttribute && el.getAttribute('data-fx-pause') === '1') continue; /* مجمد خارج الشاشة */
      r = el.getBoundingClientRect();
      if (r.width > 0 && r.bottom > 0 && r.top < h) c++;
    }
    return c;
  }
  function liveCount(force) {
    var now = Date.now();
    if (!force && now - liveT < 2000) return liveN;
    liveT = now; liveN = 0;
    try {
      liveN = visible(document.querySelectorAll('[id^="d2"] .md-name-glitter[data-mdg="ok"], #users .md-name-glitter[data-mdg="ok"], .d2bc .md-name-glitter[data-mdg="ok"]'))
             + visible(document.querySelectorAll('[id^="d2"] .md-avframe, #users .md-avframe, #users .u-frame-ov, .d2bc .md-avframe'))
             + document.querySelectorAll('[id^="d2"] [data-nsh="s"][data-nsh-v="1"], #users [data-nsh="s"][data-nsh-v="1"], .d2bc [data-nsh="s"][data-nsh-v="1"]').length;
    } catch (e) {}
    if (level === 'anim' && !forced && liveN > CAP) down('cap:' + liveN);
    return liveN;
  }
  setInterval(function () { if (!document.hidden) liveCount(false); }, COUNT_MS);

  /* ---------- قياس FPS (rAF) ----------
     سقف الجهاز (ceiling): بيبدأ 60 وبيترفع لو شفنا أسرع، وبينزل ببطء (بحد أدنى 40)
     لو الأداء فاضل موضوصًا تحته — كده:
     • جهاز تقيل شغال على 20fps من لحظة الفتح (حالة المستخدم): السقف مايهبطش تحت 40
       فـ 20fps بتفضل "واطية" → النزول للوضع الثابت بيحصل فورًا ✓
     • توفير البطارية المقفول على 30fps: السقف بينزل تدريجيًا لـ 40 → 30 مش واطية
       (30 > 40×0.55=22) ومش كويسة (30 < 40×0.85=34) = حالة محايدة ✓
     • الجهاز القوي 60/120Hz: بيتقاس على سقفه الحقيقي ✓ */
  function sample(fps) {
    var i;
    if (fps <= 0 || fps > 250) return;
    if (fps > st.ceiling) st.ceiling = Math.min(125, fps);
    else if (fps < st.ceiling * 0.6 && st.ceiling > 40) st.ceiling -= 1;
    st.samples.push(fps);
    if (st.samples.length > 30) st.samples.shift();
    if (forced) return;

    if (level === 'anim') {
      var bads = 0, win = st.samples.slice(-DOWN_WINDOW);
      for (i = 0; i < win.length; i++) if (win[i] < st.ceiling * BAD) bads++;
      if (bads >= DOWN_BADS && liveCount(true) > 0) down('fps');
      else if (fps < CRASH && liveCount(true) > 0) down('crash');
    } else if (!prm && !weak) {
      st.goodRun = (fps >= st.ceiling * GOOD) ? st.goodRun + 1 : 0;
      if (st.goodRun >= UP_RUN && liveCount(true) <= RECOVER_CAP && (Date.now() - st.downAt) >= UP_DWELL * 1000) up('recovered');
    }
  }

  var frames = 0, mark = 0, rafOn = false;
  function loop(ts) {
    if (!rafOn) return;
    if (document.hidden) { rafOn = false; frames = 0; mark = 0; return; }
    if (!mark) mark = ts;
    frames++;
    if (ts - mark >= 1000) {
      sample(Math.round(frames * 1000 / (ts - mark)));
      frames = 0; mark = ts;
    }
    requestAnimationFrame(loop);
  }
  function startRaf() {
    if (rafOn || !window.requestAnimationFrame) return;
    rafOn = true; frames = 0; mark = 0;
    requestAnimationFrame(loop);
  }
  startRaf();
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { rafOn = false; }
    else { st.samples.length = 0; st.goodRun = 0; startRaf(); }
  });

  /* ---------- إيقاف المؤثرات خارج الشاشة في غرفة #d2 ----------
     بيرصد .md-name-glitter و .md-avframe جوه #d2 بس (رسايل الغرفة — أكتر حاجة
     بتتقل). قايمة المتصلين مفرّغة (virtual) فمفيش حاجة بعيدة عن الشاشة أصلًا،
     ونوافذ الخاص والحائط ليهم perf-pause. */
  (function () {
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      for (var i = 0; i < es.length; i++) {
        var el = es[i].target;
        if (!el.isConnected) { io.unobserve(el); continue; }
        if (el.closest && el.closest('.rmr-old')) {   /* الرسايل القديمة ليها تجميدها الأصلي (بخصوصية أعلى) */
          if (el.getAttribute('data-fx-pause')) el.removeAttribute('data-fx-pause');
          io.unobserve(el);
          continue;
        }
        if (es[i].isIntersecting) {
          if (el.getAttribute('data-fx-pause')) el.removeAttribute('data-fx-pause');
        } else {
          el.setAttribute('data-fx-pause', '1');
        }
      }
    }, { rootMargin: VIEW_MARGIN, threshold: 0 });

    function scan(n) {
      if (!n || !n.querySelectorAll) return;
      if (n.classList && (n.classList.contains('md-name-glitter') || n.classList.contains('md-avframe'))) io.observe(n);
      var l = n.querySelectorAll('.md-name-glitter, .md-avframe');
      for (var i = 0; i < l.length; i++) io.observe(l[i]);
    }
    function bindD2() {
      var d2 = document.getElementById('d2');
      if (!d2) return false;
      scan(d2);
      /* الرسايل الجديدة: العناصر بتتبني جاهزة قبل الإضافة → childList كفاية
         (mo-hub بيدمج المراقب ده مع باقي مراقبي #d2 — مش مراقب جديد فعلي) */
      new MutationObserver(function (recs) {
        for (var i = 0; i < recs.length; i++) {
          var a = recs[i].addedNodes;
          for (var j = 0; j < a.length; j++) if (a[j].nodeType === 1) scan(a[j]);
        }
      }).observe(d2, { childList: true, subtree: true });
      return true;
    }
    if (!bindD2() && document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindD2);

    /* المؤثرات اللي بتتطبّق على رسايل موجودة (تحديث u^ / memberDesignRefreshFrames):
       member-design.js بينده window.nameGlitterEnqueue و GCFrameStatic.attach صراحة
       عند كل تطبيق → بنغلّفهم بغلاف شفاف يرصد العنصر (نفس أسلوب glow-core-v8). */
    function hookEnqueue() {
      var f = window.nameGlitterEnqueue;
      if (typeof f !== 'function' || f.__fxg) return;
      var w = function (el) { try { if (el && el.nodeType === 1 && io) io.observe(el); } catch (e) {} return f.apply(this, arguments); };
      w.__fxg = true;
      window.nameGlitterEnqueue = w;
    }
    function hookFrameStatic() {
      var G = window.GCFrameStatic;
      if (!G || typeof G.attach !== 'function' || G.attach.__fxg) return;
      var orig = G.attach;
      var w = function (el, url) { try { if (el && el.nodeType === 1 && io) io.observe(el); } catch (e) {} return orig.apply(this, arguments); };
      w.__fxg = true;
      G.attach = w;
    }
    hookEnqueue(); hookFrameStatic();
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { hookEnqueue(); hookFrameStatic(); });
  })();

  /* ---------- API (فحص وتحكم من الكونسول) ---------- */
  window.MdFxGuard = {
    level: function () { return level; },
    reason: function () { return reason; },
    force: function (v) {
      v = String(v == null ? '' : v).trim().toLowerCase();
      if (v === 'static' || v === 'anim') { forced = true; level = v; reason = 'manual'; }
      else if (v === 'auto') { forced = false; level = (prm || weak) ? 'static' : 'anim'; reason = 'auto'; }
      else return;
      st.samples.length = 0; st.goodRun = 0;
      apply();
    },
    stats: function () {
      return {
        level: level, forced: forced, reason: reason,
        live: liveCount(false), ceiling: st.ceiling,
        cap: CAP, recoverCap: RECOVER_CAP,
        samples: st.samples.slice(), goodRun: st.goodRun, switches: st.switches,
        weak: weak, reducedMotion: prm,
        upInSec: (level === 'static' && !forced && !prm && !weak) ? Math.max(0, UP_DWELL - Math.round((Date.now() - st.downAt) / 1000)) : 0
      };
    },
    /* ---------- [v2] tune(): ضبط حي من الكونسول بدون تعديل الملف ----------
       أمثلة: MdFxGuard.tune({cap: 12}) أو MdFxGuard.tune({upDwell: 60, downBads: 3})
       أو MdFxGuard.tune() لعرض القيم الحالية فقط.
       حدود الأمان: cap 4-64 · recoverCap 0-63 · downBads 2-30 (مفيش نزول بعينة
       واطية واحدة) · upRun 5-600 ثانية · upDwell 0-1800 ثانية.
       الثابت المحفوظ دايمًا: recoverCap < cap (بيعمل clamp تلقائي).
       بنهاية الضبط: مسح العينات + إعادة تقييم فوري — لو السقف الجديد أقل من
       عدد المؤثرات الحية النهارده بينزل الوضع الثابت في نفس اللحظة. */
    tune: function (o) {
      var n, changed = [];
      if (o && typeof o === 'object') {
        if (o.cap != null) { n = Math.round(Number(o.cap)); if (isFinite(n) && n >= 4 && n <= 64) { CAP = n; changed.push('cap'); } }
        if (o.recoverCap != null) { n = Math.round(Number(o.recoverCap)); if (isFinite(n) && n >= 0 && n <= 63) { RECOVER_CAP = n; changed.push('recoverCap'); } }
        if (RECOVER_CAP >= CAP) RECOVER_CAP = CAP - 1;
        if (o.downBads != null) { n = Math.round(Number(o.downBads)); if (isFinite(n) && n >= 2 && n <= 30) { DOWN_BADS = n; changed.push('downBads'); } }
        if (o.upRun != null) { n = Math.round(Number(o.upRun)); if (isFinite(n) && n >= 5 && n <= 600) { UP_RUN = n; changed.push('upRun'); } }
        if (o.upDwell != null) { n = Math.round(Number(o.upDwell)); if (isFinite(n) && n >= 0 && n <= 1800) { UP_DWELL = n; changed.push('upDwell'); } }
        st.samples.length = 0; st.goodRun = 0;
        liveCount(true);
      }
      return { changed: changed, cap: CAP, recoverCap: RECOVER_CAP, downBads: DOWN_BADS, upRun: UP_RUN, upDwell: UP_DWELL };
    }
  };
})();
