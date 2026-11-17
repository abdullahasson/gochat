/* ============================================================================
   [PHASE 4 - LAZY LOADER] public/lazy/loader.js — اللودر المركزي للموديولات الاختيارية
   ============================================================================
   الفكرة: موديولات "عند الطلب فقط" (بروفايل الأعضاء، الخاص، الميديا، سجل إجراءات الإدارة)
   مبتتتحملش عند دخول الشات خالص — بتتحمّل أول ما المستخدم يلمس الميزة فعلًا، مرة واحدة فقط:

     - أول فتح  → تحميل CSS ثم JS بالترتيب → تهيئة → الميزة شغالة
     - تانية   → NO تحميل تاني / NO تهيئة تانية / NO listeners مكررة (Promise cache)

   اللي بيفضل يتحمّل مع الدخول (Chat Core) متغيرش — راجع تقرير PHASE 4 للتصنيف بالأدلة:
   member-design/name-glitter (CSS بتاعهم re-skin عام للشات + render hooks)، room-history
   (حدث room_history_push مالوش معالج غيره)، xo/quiz (أحداث ألعاب push من السيرفر)،
   notif-toast/notif-profile (أحداث بتوصل بدون تفاعل).

   ── SHIMS (بتتسجل هنا بعد x2.js و room-topbar.js — نفس نقطة الحقن في index.ejs) ──
   1) window.openMemberProfile  = stub → يحمل 'profile' ثم يفوّض للنسخة الحقيقية
      (notif-profile.js و admin-actions.js بينادوه بـ typeof guard — الـstub بيخلي أول ضغطة شغالة)
   2) window.upro = shim → يحمل 'profile' ثم يستدعي الأصل — فتح البروفايل دايمًا محسّن
      (الأعضاء "الغايبين" من رسايل قديمة onclick="upro('off..')" بيروحوا لمسار openMemberProfile)
      عند تحميل member-profile.js هو بيلف الـshim نفسه (نفس سلسلة اللفوف بتاعة التحميل العادي).
   3) window.openw = shim متزامن (بدون أي تأخير أبدًا) → يبدأ تحميل 'pm' + ينادي الأصل فورًا؛
      أول ما الموديول يوصل بيلف الـshim والنوافذ اللي فتحت قبله بيتعالجها "adopt" جوه الموديول نفسه.
   4) window.openSettingsPopup = shim → يحمل 'profile' (لكارت غلاف البروفايل #pcField) ثم يفتح.

   ── TRIGGERS (capture listeners — preload قبل الضغطة نفسها بدون اعتراضها) ──
   profile: كارت مستخدم في القائمة/صورة رسالة/هيدر خاص/زر بروفايل المايك/اسم إشعار/سجل الإدارة
   pm:      أيقونة الرسائل بالتوب-بار (+ الـshim بتاع openw بيغطي أي مسار تاني بما فيه رسالة جات)
   media:   أول لمسة/تركيز على مربع الكتابة أو منطقة الرسائل (الزر بتاع المشاركة بيتبنى مع الموديول)
   admin:   أول فتح لقائمة الأفاتار (#rtbAvatarBtn) — زر "إدارة الإجراءات" مخفي افتراضيًا على أي حال

   ملاحظة بروتوكول: مفيش أي socket connection جديد ولا حدث جديد — الموديولات بتستخدم سوكت
   الشات الموجود (socket بتاع x2.js) بنفس الأحداث حرفيًا. */
window.LazyModules = (function () {
  'use strict';

  var V = '20261015a'; /* [ترقيم تاريخي + لاحقة إعادة تطبيق] — نفس اليوم فيه تغييران: 'b' يكسر أي كاش محمّل
                          نسخة v=20261003 من حقبة اللودر الأولى أو حقبة التراجع (eager pm بنفس الرقم).
                          أي تعديل هنا = نفس القيمة الجديدة في وسم اللودر داخل index.ejs. */

  /* ── المانيفست: ملفات كل موديول (CSS الأول عشان الستايل يبقى جاهز قبل أي تنفيذ JS) ── */
  var SPECS = {
    profile: {
      v: '20261012d', /* [ADMIN TOOLS - LAZY] لوحة الأوامر + نوافذ الإدارة اتنقلت لموديول admintools */ /* [ENCRYPT BAN] */ /* [UPRO SHEET] */ /* [WIDER PROFILE] /* [UPRO CMD ONLY] كسر كاش موديول البروفايل فقط */
      label: 'بروفايل الأعضاء + شارة القيود',
      css: [
        'member-profile/member-profile.css',
        'member-profile/upro-redesign.css',
        'member-profile/upro-tabs.css',
        'member-profile/upro-quick-fix.css',
        'member-profile/unot-dialog.css',
        'profile-cover/profile-cover.css',
        'restriction-badge/restriction-badge.css',
        'member-profile/upro-perf.css', /* [ADDED - PROFILE PERF - PHASE 3] شيل backdrop-filter من البروفايل */
        'member-profile/upro-sample.css', /* [ADDED - UPRO V2] آخر ملف CSS (يكسب بالترتيب): شكل البروفايل المرجعي (هيدر داكن + مشغل صغير + تبويبات) */
      ],
      js: [
        'member-profile/upro-base.js', /* [LAZY - UPRO BASE] الأصل الحرفي لـ upro() + handlers (كانت في x2.js) — لازم الأول قبل اللفوف */
        'member-profile/member-profile.js',
        'member-profile/member-actions.js',
        'member-profile/upro-tabs.js',
        'member-profile/upro-quick-fix.js',
        'member-profile/upro-sample.js', /* [ADDED - UPRO V2] كتابة اللقب (.upro-role) */
        'profile-cover/profile-cover.js',
        'restriction-badge/restriction-badge.js',
      ],
    },
    pm: {
      v: '20261014a', /* [SPLIT-V1] openw اتفصلت لـ lazy/pmwin.js — لازم أول ملف في السلسلة
                          قبل private-messages.js و pm-dom-trim.js عشان اللفوف يركبوا فوق النسخة الحقيقية
                          مش فوق الـ stub (كان 20261013a) */
      label: 'الرسائل الخاصة',
      css: ['private-messages/private-messages.css'],
      js: ['lazy/pmwin.js', 'private-messages/private-messages.js', 'pm-dom-trim/pm-dom-trim.js'], /* [SPLIT-V1] pmwin أولًا — ترتيب حرج (كان private-messages.js + pm-dom-trim.js) */
    },
    /* [SPLIT-V1] الملفات الثلاثة اللي اتفصلت من x2.js — بتتحمّل عند الطلب عن طريق
       stubs __lazyCall بنفس الأسماء العامة (openw/call/hangupu/emopop/...) جوه x2.js. */
    pmwin: {
      v: '20261014a',
      label: 'نوافذ الخاص (openw + القوالب)',
      css: [],
      js: ['lazy/pmwin.js'],
    },
    calls: {
      v: '20261014a',
      label: 'المكالمات الصوتية الخاصة (call/CallUser/Callanswer/hangupu)',
      css: [],
      js: ['lazy/calls.js'],
    },
    emopop: {
      v: '20261014a',
      label: 'نافذة الإيموشنات (emopop/emoChangePage)',
      css: [],
      js: ['lazy/emopop.js'],
    },
    media: {
      v: '20261013a', /* [DICE GAME] أيقونة النرد في قايمة (+) (كان 20261012b) */ /* [MERGED COMPOSER TOOLS + EMOJI COPY] (كان 20261012a) */ /* [MEDIA LITE] room-media.js بيستخدم MediaLite */ /* [COMPOSER-COMPACT] أيقونات قايمة + صغيرة بدون مسميات (كان 20261009a) */
      label: 'ميديا الغرفة',
      css: ['room-media/room-media.css'],
      js: ['room-media/room-media.js'],
    },
    /* [ADDED - DICE GAME - LAZY] لعبة النرد: الـ CSS+JS بيتحملوا مرة واحدة بس لما (1) حد يدوس على أيقونة النرد في قايمة (+)
       أو (2) أول كارت نرد يظهر في رسايل الغرفة (من رمية حد تاني أو من السجل) — راجع الـ trigger في install(). */
    dice: {
      v: '20261013a',
      label: 'لعبة النرد',
      css: ['dice-game/dice-game.css'],
      js: ['dice-game/dice-game.js'],
    },
    admin: {
      label: 'سجل إجراءات الإدارة',
      css: ['admin-actions/admin-actions.css'],
      js: ['admin-actions/admin-actions.js'],
    },
    /* [ADMIN TOOLS - LAZY] نافذة "أدوات الإدارة" (أزرار + حقول الإدارة) ونوافذ كشف النكات/الهدايا/البنر/التبليغ.
       كانت جوه البروفايل (HTML في index.ejs + منطق في upro-base.js + CSS في 3 ملفات). دلوقتي بتتحمّل بس لما حد يضغط ☰ في البروفايل
       أو "أوامر" في قايمة صورة العضو — ومسخّنة وقت الخمول لمستخدمي الإدارة بعد فتح البروفايل (مش بتعطّل فتحه). */
    admintools: {
      v: '20261012c', /* [MD GRANT] زر تفعيل تصميم العضوية — صلاحية mdgrant */
      label: 'أدوات الإدارة',
      css: ['admin-tools/admin-sheets.css', 'admin-tools/admin-tools.css'],
      js: ['admin-tools/admin-sheets.js', 'admin-tools/admin-tools.js'],
    },
    /* [LAZY - VOICE/UPLOADS] اتفصلوا حرفيًا من x2.js. الـstubs (بنفس الأسماء) جوه x2.js بتنادي load() هنا؛
       مفيش CSS. v خاص بيهم عشان تعديلهم ما يكسرش كاش باقي الموديولات. */
    voice: {
      v: '20261011a',
      label: 'التسجيل الصوتي (الخاص)',
      css: [],
      js: ['lazy/voice-rec.js'],
    },
    uploads: {
      v: '20261011a',
      label: 'رفع الملفات (مرفقات الخاص/البث، صور البروفايل، ستوري)',
      css: [],
      js: ['lazy/uploads.js'],
    },
    roomedit: {
      v: '20261011a',
      label: 'محرر الغرف (إنشاء/إدارة) — أدمن',
      css: [],
      js: ['lazy/room-editor.js'],
    },
    peer: {
      v: '20261011a',
      label: 'PeerJS (المكالمات الصوتية الخاصة)',
      css: [],
      js: ['lazy/peerjs.js'],
    },
    /* [REDESIGNED - STUDIO V2] استوديو تصميم العضوية (واجهة جديدة بشكل الإعدادات، كل تبويب بيتبني عند الطلب، وبيتفكك بالكامل عند الإغلاق).
       فيه تبويب "لون اسم لامع" (النواة name-shine/name-shine.js بتتحمّل مع الصفحة). بيتحمّل أول ضغطة على زرار الاستوديو بس (مفيش preload في الخلفية). */
    studio: {
      label: 'استوديو تصميم العضوية',
      v: '15',
      css: ['member-design/studio2.css'],
      js: ['member-design/studio2.js'],
    },
    /* [LAZY - STORE] الجزء الصغير من المتجر (حالة الاشتراكات + ربط featAccess + مستمع السوكت): بيتحمّل عند الطلب بس
       (ضغط أيقونة المتجر / فتح الإعدادات / فتح الاستوديو) بدل ما يتحمّل ويشتغل مع كل دخول. */
    storelite: {
      label: 'حالة المتجر',
      v: '4',
      css: [],
      js: ['store/store-lite.js'],
    },
    /* [ADDED - FEATURE STORE] واجهة تبويب "المتجر" في إعدادات المستخدم: بتتحمّل أول فتح للتبويب بس (الجزء الصغير store-lite.js بيتحمّل مع الصفحة). */
    store: {
      label: 'متجر المميزات',
      v: '3',
      css: ['store/store.css'],
      js: ['store/store.js'],
    },
  };

  /* ── Promise Cache: موديول واحد = وعد واحد مهما كان عدد الطلبات ── */
  var state = {};      /* name -> { promise: Promise, ready: bool } */
  var stylesDone = {}; /* href -> true */
  var stats = { loads: {}, readyAt: {} }; /* للتحقق الحي: window.__LAZY_STATS */

  function loadStyle(href) {
    return new Promise(function (resolve, reject) {
      if (stylesDone[href]) return resolve();
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = function () { stylesDone[href] = true; resolve(); };
      link.onerror = function () { reject(new Error('CSS failed: ' + href)); };
      document.head.appendChild(link);
    });
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = false; /* الحفاظ على ترتيب التنفيذ */
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('JS failed: ' + src)); };
      document.head.appendChild(s);
    });
  }

  function load(name) {
    if (!SPECS[name]) return Promise.reject(new Error('[LAZY] موديول غير معروف: ' + name));
    if (state[name]) return state[name].promise; /* جاري أو جاهز → نفس الوعد (منع التكرار) */
    stats.loads[name] = (stats.loads[name] || 0) + 1;

    var spec = SPECS[name];
    /* [FIX - CSS VERSION] ملفات الـCSS كانت بتتحمّل من غير ?v= (عكس الـJS) فكانت بتتخزن في المتصفح (maxAge السيرفر ~8.7 ساعة)
       ومابتتحدّثش بتغيير V. دلوقتي بنفس رقم V بتاع الـJS. */
    var sv = spec.v || V; /* [ADDED] إصدار خاص بالموديول لو متحدد */
    var p = Promise.all(spec.css.map(function (h) { return loadStyle(h + '?v=' + sv); }))
      .then(function () {
        /* JS بالترتيب نفسه اللي كان في index.ejs (سلاسل اللفوف بين الملفات معتمدة عليه) */
        var chain = Promise.resolve();
        spec.js.forEach(function (f) {
          chain = chain.then(function () { return loadScript(f + '?v=' + sv); });
        });
        return chain;
      })
      .then(function () {
        state[name].ready = true;
        stats.readyAt[name] = Date.now();
        try { document.dispatchEvent(new CustomEvent('lazymodule:ready', { detail: { name: name } })); } catch (e) {}
        return true;
      }, function (err) {
        delete state[name]; /* فشل → يسمح بمحاولة تانية عند الاستخدام الجاي */
        throw err;
      });

    state[name] = { promise: p, ready: false };
    return p;
  }

  function isLoaded(name) { return !!(state[name] && state[name].ready); }

  /* ===== تسجيل الشيمز والتريجرز — بيتنفذ مرة واحدة عند تحميل اللودر نفسه ===== */
  function install() {
    var d = document;

    /* ---------- 1) بروفايل الأعضاء ---------- */
    if (typeof window.openMemberProfile === 'undefined') {
      window.openMemberProfile = function (target, onOpen) {
        var args = arguments, stub = window.openMemberProfile;
        return load('profile').then(function () {
          /* member-profile.js بيستبدل الـstub بنسخته الحقيقية عند التحميل */
          if (typeof window.openMemberProfile === 'function' && window.openMemberProfile !== stub) {
            return window.openMemberProfile.apply(null, args);
          }
        });
      };
    }
    var __upro = window.upro;
    if (typeof __upro === 'function' && !__upro.__lzy) {
      var uproShim = function (id) {
        var args = arguments, self = this;
        /* [رسايل قديمة] صورة عضو غايب فيها onclick="upro('off..')" من غير بيانات في U_CASH —
           x2 upro بترجع فاضي؛ بنوجّهها لمسار openMemberProfile المحسّن بعد التحميل */
        if (typeof id === 'string' && /^off\d+$/.test(id) &&
            typeof U_CASH !== 'undefined' && U_CASH && !U_CASH[id]) {
          var rid = parseInt(id.slice(3), 10) || 0;
          if (rid > 0) return load('profile').then(function () { window.openMemberProfile(rid); });
        }
        return load('profile').then(function () { return __upro.apply(self, args); });
      };
      uproShim.__lzy = true;
      window.upro = uproShim;
    }
    /* [LAZY - STORE] أيقونة المتجر (وزرار "شراء" في معاينة الاستوديو): بتحمّل store-lite عند أول ضغطة ثم بتفتح المتجر.
       store-lite.js نفسه بيستبدل window.mdStoreOpen بالنسخة الحقيقية عند التحميل. */
    if (typeof window.mdStoreOpen !== 'function') {
      var storeStub = function (feat) {
        return load('storelite').then(function () {
          if (window.mdStoreLite && typeof window.mdStoreLite.open === 'function') window.mdStoreLite.open(feat);
        }, function () {
          if (typeof window.SendNotification === 'function') window.SendNotification({ state: 'me', topic: '', force: 1, msg: 'تعذر تحميل المتجر، جرّب مرة تانية', user: '' });
        });
      };
      window.mdStoreOpen = storeStub;
    }
    /* [LAZY - STORE] العضو اللي عنده اشتراك شغال بس: بنحمّل store-lite تلقائيًا بعد الدخول (عشان عصاية الاستوديو تظهر).
       باقي الأعضاء مفيش تحميل ولا polling: فحص واحد بالتوكن (/store-me) وبعدين الـtimer بيتشال. */
    var __stTries = 0, __stTimer = setInterval(function () {
      var t = ''; try { t = (typeof MY_T === 'string') ? MY_T : ''; } catch (e) {}
      if (!t) { if (++__stTries > 40) clearInterval(__stTimer); return; }
      clearInterval(__stTimer);
      try {
        fetch('/store-me?token=' + encodeURIComponent(t), { cache: 'no-store', credentials: 'same-origin' })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (j) { if (j && j.on) load('storelite').catch(function () {}); })
          .catch(function () {});
      } catch (e) {}
    }, 1500);
    var __osp = window.openSettingsPopup;
    if (typeof __osp === 'function' && !__osp.__lzy) {
      var ospShim = function () {
        var args = arguments, self = this;
        return Promise.all([load('profile'), load('storelite').catch(function () {})]).then(function () { return __osp.apply(self, args); });
      };
      ospShim.__lzy = true;
      window.openSettingsPopup = ospShim;
    }
    /* [REDESIGNED - STUDIO V2] أول ضغطة: نحمّل موديول الاستوديو، وهو بيستبدل window.openMemberDesignStudio بالنسخة الحقيقية،
       فنناديها بعد التحميل. لو التحميل فشل منفتحش حاجة قديمة (الـ HTML القديم اتشال) — بس إشعار ويقدر يحاول تاني. */
    var __omds = window.openMemberDesignStudio;
    if (typeof __omds === 'function' && !__omds.__lzy) {
      var omdsShim = function () {
        var args = arguments, self = this;
        return Promise.all([load('studio'), load('storelite').catch(function () {})]).then(
          function () {
            var real = window.openMemberDesignStudio;
            if (typeof real === 'function' && real !== omdsShim) return real.apply(self, args);
          },
          function () {
            if (typeof window.SendNotification === 'function') {
              window.SendNotification({ state: 'me', topic: '', force: 1, msg: 'تعذر تحميل استوديو التصميم، جرّب مرة تانية', user: '' });
            }
          }
        );
      };
      omdsShim.__lzy = true;
      window.openMemberDesignStudio = omdsShim;
    }
    d.addEventListener('pointerdown', function (e) {
      if (!e.target || !e.target.closest) return;
      if (e.target.closest('#openMemberDesignStudio')) { load('studio').catch(function () {}); }
    }, true);
    /* تريجرز: نية فتح بروفايل (preload فوري بدون اعتراض الضغطة) */
    d.addEventListener('pointerdown', function (e) {
      if (!e.target || !e.target.closest) return;
      if (e.target.closest('#users, #d2 .u-pic, #wall .u-pic, [data-pmid] .fa-user, [data-pmid] .head, .profiles, .rtb-item[data-from], .adact-open')) {
        load('profile').catch(function () {});
      }
    }, true);

    /* ---------- 2) الرسائل الخاصة ---------- */
    var __openw = window.openw;
    if (typeof __openw === 'function' && !__openw.__lzy) {
      var openwShim = function () {
        /* shim متزامن بالكامل: يبدأ التحميل وينادي الأصل فورًا — أي تأخير = صفر أبدًا.
           [SPLIT-V1] "الأصل" هنا بقى الـ stub بتاع x2.js — بينادي lazy/pmwin.js (بيعرّف
           النسخة الحقيقية وبيعوّض بريلود pm/uploads/voice جواه) وبيعيد النداء فور وصوله.
           أول ما private-messages.js يوصل بيلف الـshim (نفس ترتيب اللفوف الأصلي) والنوافذ
           اللي فتحت قبله بيتعالجها "adopt" جوه الموديول نفسه. */
        if (!isLoaded('pm')) { load('pm').catch(function () {}); }
        /* [LAZY - VOICE/UPLOADS] نافذة خاص اتفتحت → زر المايك/المرفقات جايين: حمّلهم قبل الضغطة (input.click محتاج لمسة مستخدم فعلية) */
        if (!isLoaded('uploads')) { load('uploads').catch(function () {}); }
        if (!isLoaded('voice')) { load('voice').catch(function () {}); }
        return __openw.apply(this, arguments);
      };
      openwShim.__lzy = true;
      window.openw = openwShim;
    }
    d.addEventListener('pointerdown', function (e) {
      if (!e.target || !e.target.closest) return;
      if (e.target.closest('#rtbPmBtn, #chats')) { load('pm').catch(function () {}); }
    }, true);


    /* ---------- [FIXED - PM BOXES ON LOGIN] تحميل مسبق لموديول الخاص بعد الدخول ----------
       الموديول كان بيتحمّل بس أول ما المستخدم يلمس أيقونة الخاص أو يفتح محادثة، واسترجاع الصناديق (pm_open_tabs) جواه
       → أول ما تدخل مفيش صناديق في أيقونة الخاص لحد ما تبعت من القايمة/البروفايل. دلوقتي بنحمّله وقت الخمول بعد ما الدخول يخلص. */
    (function () {
      var n = 0;
      var t = setInterval(function () {
        n++;
        if (state.pm) { clearInterval(t); return; }
        if (typeof M_ID !== 'undefined' && M_ID && typeof C_L_U !== 'undefined' && C_L_U && C_L_U.length > 0) {
          clearInterval(t);
          var go = function () {
            load('pm').catch(function () {});   /* سلسلة pm فيها lazy/pmwin.js أولًا → openw الحقيقية جاهزة قبل اللفوف */
            load('emopop').catch(function () {}); /* [SPLIT-V1] نافذة الإيموشنات صغيرة (1.8KB gz) — مسخّنة وقت الخمول */
          };
          if (window.requestIdleCallback) window.requestIdleCallback(go, { timeout: 3000 }); else setTimeout(go, 1500);
        } else if (n > 400) { clearInterval(t); }
      }, 300);
    })();

    /* ---------- 3) ميديا الغرفة (الزر بيتبنى مع الموديول؛ الرسايل القديمة بتفضل تعمل upgrade ريترواكتيف) ---------- */
    d.addEventListener('pointerdown', function (e) {
      if (!e.target || !e.target.closest) return;
      if (e.target.closest('.tablebox, #tbox, .tboxbc, #d2, #wall, #rmmShare')) { load('media').catch(function () {}); }
    }, true);
    d.addEventListener('focusin', function (e) {
      if (!e.target || !e.target.closest) return;
      if (e.target.closest('#tbox, .tboxbc')) { load('media').catch(function () {}); }
    }, true);

    /* ---------- 3b) التسجيل الصوتي + رفع الملفات (preload قبل الضغطة نفسها، بدون اعتراضها) ---------- */
    var UP_SEL = '[data-pmid] .fa-share-alt, [data-pmid] .sndfile, .tboxbc, [onclick*="SEND_BC_UP(true"], [onclick*="S_PIC("], [onclick*="SEND_Story"], .spic, .stp-cam, #f1e';
    var VOICE_SEL = '[data-pmid] .microphone, [data-pmid] .tbox, [data-pmid] .head';
    function preloadUp(e) {
      var t = e.target;
      if (!t || !t.closest) return;
      if (t.closest(UP_SEL)) { load('uploads').catch(function () {}); }
      if (t.closest(VOICE_SEL)) { load('voice').catch(function () {}); }
    }
    ['pointerdown', 'touchstart', 'mouseover', 'focusin'].forEach(function (ev) {
      d.addEventListener(ev, preloadUp, { capture: true, passive: true });
    });

    /* ---------- 3c) محرر الغرف (أدمن فقط: preload عند لمس زر غرفة جديدة أو قايمة الأفاتار) ---------- */
    d.addEventListener('pointerdown', function (e) {
      if (!e.target || !e.target.closest) return;
      if (e.target.closest('.rmk-rooms-new, .redit, #rtbAvatarBtn, #rtbAvatarMenu')) { load('roomedit').catch(function () {}); }
    }, true);

    /* ---------- 3d) أدوات الإدارة (admintools) ----------
       shim: openAdminTools(id) → يحمّل الموديول ثم يفوّض للنسخة الحقيقية (admin-tools.js بيستبدل window.openAdminTools).
       preload قبل الضغطة: لمسة على ☰ البروفايل أو "أوامر" في قايمة صورة العضو.
       تسخين: بعد ما البروفايل يتفتح فعلًا (shown) ولمستخدم عنده صلاحية إدارة بس، وقت الخمول — فمبيأخرش فتح البروفايل. */
    if (typeof window.openAdminTools === 'undefined') {
      window.openAdminTools = function () {
        var args = arguments, stub = window.openAdminTools;
        return load('admintools').then(
          function () {
            if (typeof window.openAdminTools === 'function' && window.openAdminTools !== stub) {
              return window.openAdminTools.apply(null, args);
            }
          },
          function () {
            if (typeof window.SendNotification === 'function') {
              window.SendNotification({ state: 'me', topic: '', force: 1, msg: 'تعذر تحميل أدوات الإدارة، جرّب مرة تانية', user: '' });
            }
          }
        );
      };
    }
    var ADM_SEL = '.upro-open-commands, .rpm-row[data-act="cmds"]';
    function admPre(e) {
      var t = e.target;
      if (t && t.closest && t.closest(ADM_SEL)) { load('admintools').catch(function () {}); }
    }
    ['pointerdown', 'touchstart', 'mouseover'].forEach(function (ev) {
      d.addEventListener(ev, admPre, { capture: true, passive: true });
    });
    function hasAdminPerm() {
      try {
        var p = window.jstp;
        return !!(p && (p.kick > 0 || p.ban || p.meiut || p.upgrades > 0 || p.unick || p.loveu || p.ulike ||
                        p.setpower || p.ureport || p.history || p.deldesign || p.owner));
      } catch (e) { return false; }
    }
    if (window.jQuery) {
      window.jQuery(d).on('shown.bs.modal', '#upro', function () {
        if (state.admintools || !hasAdminPerm()) return;
        var go = function () { load('admintools').catch(function () {}); };
        if (window.requestIdleCallback) window.requestIdleCallback(go, { timeout: 3000 }); else setTimeout(go, 1500);
      });
    }

    /* ---------- 4) سجل إجراءات الإدارة (زر مخفي افتراضيًا — admins فقط) ---------- */
    d.addEventListener('pointerdown', function (e) {
      if (!e.target || !e.target.closest) return;
      if (e.target.closest('#rtbAvatarBtn, #rtbAvatarMenu')) { load('admin').catch(function () {}); }
    }, true);

    /* ---------- [ADDED - DICE GAME - LAZY] لعبة النرد ---------- */
    /* (أ) preload قبل الضغطة نفسها: أول ما العضو يلمس أيقونة النرد في قايمة (+) */
    d.addEventListener('pointerdown', function (e) {
      if (e.target && e.target.closest && e.target.closest('.rmm-item[data-act="dice"]')) { load('dice').catch(function () {}); }
    }, true);
    /* (ب) كارت نرد ظهر في الغرفة (رمية حد تاني / سجل الغرفة): نحمّل الـ CSS+JS مرة واحدة ونفصل المراقب.
       المراقب على #d2 (عنصر ثابت في index.ejs) بـ childList بس، وبيتفصل بعد أول كارت. */
    (function () {
      if (!window.MutationObserver) { return; }
      var tries = 0;
      function hook() {
        var box = d.getElementById('d2');
        if (!box) { if (++tries < 40) { setTimeout(hook, 500); } return; }
        var mo = new MutationObserver(function (muts) {
          for (var i = 0; i < muts.length; i++) {
            var add = muts[i].addedNodes;
            for (var j = 0; j < add.length; j++) {
              var n = add[j];
              if (n.nodeType === 1 && (n.classList.contains('dd-card') || n.querySelector('.dd-card'))) {
                mo.disconnect();
                load('dice').catch(function () {});
                return;
              }
            }
          }
        });
        mo.observe(box, { childList: true, subtree: true });
      }
      hook();
    })();
  }

  try { install(); } catch (e) { if (window.console) console.error('[LAZY] install failed', e); }

  return {
    load: load,
    isLoaded: isLoaded,
    specs: SPECS,
    version: V,
    stats: stats,
  };
})();
