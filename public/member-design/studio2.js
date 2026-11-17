/* =====================================================================================
   [ADDED - STUDIO V2] public/member-design/studio2.js — استوديو تصميم العضوية (النسخة الجديدة)
   موديول كسول (LazyModules 'studio'): مبيتحمّلش مع دخول الشات، وبيتحمّل أول ضغطة على أي كارت ميزة في إعدادات > المميزات.

   [CHANGED - FEATURE CARDS] مبقاش فيه شريط تبويبات: كل تبويب القديم بقى كارت/زر في إعدادات > المميزات، والضغط عليه بيفتح
   openMemberDesignStudio('<مفتاح الميزة>') = نافذة منبثقة للميزة دي لوحدها (معاينة + التحكم + حفظ). المفاتيح:
   pbg (صورة + لون خلفية البروفايل) / welcome / music / visit / yt / social / frames / cards / namebg / nameshine / glitter.
   لو اتنادت من غير مفتاح (زي العصاية في الشريط السفلي) بتفتح الإعدادات على تبويب المميزات.

   الفكرة:
   1) الاستوديو مبقاش جوه index.ejs: عنصر فاضي (#memberDesignStudio) والواجهة كلها بتتبني هنا أول ما يتفتح.
   2) كل تبويب بيتبني عند أول طلب له بس (ملفي / الإطارات / الكارت / لون الاسم / اللمعات / التواصل).
   3) شبكات الصور (إطارات / خلفيات / لمعات): بتتحمّل على دفعات (40 صورة) + native lazy، وأول ما تغيّر التبويب بتتفضّى
      من الـ DOM (الصور المتحركة مبتفضلش شغالة في الخلفية).
   4) معاينة حية واحدة بس في الهيدر (بروفايل مصغّر، أو كارت المتصلين حسب التبويب) وبتتحدّث بـ rAF مجمّع.
   5) أول ما الاستوديو يتقفل (إغلاق / إلغاء / حفظ): الـ DOM يتشال بالكامل، الـ listeners تتفصل، الرفع الجاري يتلغي،
      الصوت يتفضّى، المراقبات تتفصل، والحالة (S) ترجع null — فمفيش أي أثر باقي على الشات.

   متوافق مع الباقي بدون تعديل: addback() (الإطار/الخلفية/اللمعة بتتطبق فورًا زي الأول)، SEND_EVENT_EMIT_PROFILE (نفس الـ payload بالظبط)،
   /member-design/upload، الحقول الثابتة في الإعدادات (.stopic .smsg .scolor .mcolor .mscolor .scopic input.sbg .urluto)، و #mdFramesField (صلاحية ifedit).
   ===================================================================================== */
(function () {
  'use strict';
  var $ = window.jQuery;
  if (!$ || window.__mdStudio2) return;
  window.__mdStudio2 = true;

  var HOST_ID = 'memberDesignStudio';
  var LIMITS = { cover: 5 * 1048576, music: 10 * 1048576 };
  var KIND_NUM = { atar: 2, back: 1, lmaa: 3 };      /* نفس أرقام addback() / السيرفر */
  var CHUNK = 40, WHITE = '#ffffff';
  /* [CHANGED - FEATURE CARDS] m = نوع المعاينة الحية ('profile' بروفايل مصغّر / 'card' كارت المتصلين / '' من غير معاينة)
     instant = الميزة بتتطبق فورًا من الضغط على الصورة (addback) فمفيش زر حفظ، بس "تم" */
  var TABS = [
    { k: 'pbg',       t: 'خلفية البروفايل',       i: 'fa-picture-o',    m: 'profile' },
    { k: 'welcome',   t: 'شعار الترحيب',          i: 'fa-hand-paper-o', m: '' },
    { k: 'music',     t: 'أغنية البروفايل',       i: 'fa-music',        m: 'profile' },
    { k: 'visit',     t: 'تنبيه زوار البروفايل',  i: 'fa-eye',          m: '' },
    { k: 'yt',        t: 'رابط اليوتيوب',         i: 'fa-youtube-play', m: 'profile' },
    { k: 'social',    t: 'حسابات التواصل',        i: 'fa-link',         m: 'profile' },
    { k: 'frames',    t: 'الإطارات',              i: 'fa-dot-circle-o', m: 'card', kinds: ['atar'], assets: 1, instant: 1 },
    { k: 'cards',     t: 'كارت العضو',            i: 'fa-id-card-o',    m: 'card', kinds: ['back'] },
    { k: 'namebg',    t: 'خلفية لون الاسم',       i: 'fa-tint',         m: 'card' },
    { k: 'nameshine', t: 'لون اسم لامع',          i: 'fa-star',         m: 'card', ns: 1 },
    { k: 'glitter',   t: 'اللمعات',               i: 'fa-magic',        m: 'card', kinds: ['lmaa'], assets: 1, instant: 1 },
    { k: 'nameglow',  t: 'توهج خلفية لون الاسم',   i: 'fa-lightbulb-o',  m: 'card' },     /* [ADDED - GLOW] */
    { k: 'edgeglow',  t: 'توهج حواف البروفايل',    i: 'fa-sun-o',        m: 'profile' }   /* [ADDED - GLOW] */
  ];
  var GLOW_SW = ['#ffd24a', '#ff9f43', '#ff5d73', '#c56cf0', '#4da3ff', '#2ed8a7', '#ffffff'];
  var MODES = [
    { k: '',  t: 'سادة',  i: 'fa-square' },
    { k: 'h', t: 'أفقي',  i: 'fa-arrows-h' },
    { k: 'v', t: 'عمودي', i: 'fa-arrows-v' },
    { k: 'm', t: 'مختلط', i: 'fa-arrows-alt' }
  ];
  var SOCIAL = [
    { ic: 'tg', key: 'social_telegram' },
    { ic: 'fb', key: 'social_facebook' },
    { ic: 'wa', key: 'social_whatsapp' }
  ];
  var S = null; /* جلسة الاستوديو المفتوحة. null = مقفول ومفيش أي حاجة في الذاكرة */

  /* ============================== أدوات ============================== */
  function el(id) { return document.getElementById(id); }
  function qa(sel, root) { return (root || (S && S.host) || document).querySelectorAll(sel); }
  function norm(v) { return String(v == null ? '' : v).trim(); }
  function setText(id, t) { var e = el(id); if (e && e.textContent !== t) e.textContent = t; }
  function me() { return (window.U_CASH && window.M_ID && window.U_CASH[window.M_ID]) || {}; }
  function safeUrl(v) { v = String(v || ''); return (v && !/["'()\\<>\s]/.test(v)) ? v : ''; }
  function safePath(v) { v = norm(v); return (v && !/["'()\\<>]/.test(v)) ? v : ''; }
  function hexColor(v, fb) { return /^#[0-9a-f]{6}$/i.test(v || '') ? v : fb; }
  function gcolor(v, fb) { var G = window.mdGrad; return (G ? G.valid(v) : /^#[0-9a-f]{6}$/i.test(v || '')) ? v : fb; }
  function isCustomCover(v) { v = safeUrl(v); return !!v && !/(^|\/)site\/cover\.png$/.test(v); }
  function allowed() { return !!(window.jstp && (jstp.memberdesign || jstp.owner || (window.featAccess && featAccess.any()))); }   /* [CHANGED - FEATURE ACCESS] + الرتب المختارة في لوحة التحكم > المميزات */
  function decodeText(v) { var t = document.createElement('textarea'); t.innerHTML = String(v == null ? '' : v); return t.value; }
  function onFlag(v) { return !(v === 0 || v === false || v === '0'); }
  function cssUrl(s) { return 'url("' + String(s).replace(/["\\\n\r]/g, '\\$&') + '")'; }
  function coverOpt(url) { url = String(url || ''); return /^\/mdesign\/(?:profile_)?cover_[A-Za-z0-9_\-]+\.gif$/i.test(url) ? url.replace(/\.gif$/i, '_t.webp') : url; }
  function optUrl(v) { v = norm(v); return /^\/?(atar|lmaa)\/[^\/?#]+\.(png|jpe?g|gif|webp)$/i.test(v) ? v.replace(/\.[A-Za-z0-9]+$/, '_l.webp') : v; }
  function liveColor(sel, fb) {
    var v = norm($(sel).first().val());
    if (v && v.charAt(0) !== '#') v = '#' + v;
    return /^#[0-9a-f]{3,6}$/i.test(v) ? v : fb;
  }
  function list(kind) {
    try { var a = kind === 'atar' ? atar : kind === 'back' ? back : lmaa; return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  function featDef(k) { for (var i = 0; i < TABS.length; i++) if (TABS[i].k === k) return TABS[i]; return null; }
  function tabDef(k) { return featDef(k) || TABS[0]; }
  function notify(msg) { if (typeof SendNotification === 'function') SendNotification({ state: 'me', topic: '', force: 1, msg: msg, user: '' }); }

  /* ============================== قوالب الكروت ============================== */
  function ci(id, icon, title, desc, ctrl, body, descId) {
    return '<div class="md2-ci" data-ci="' + id + '"><div class="md2-row"><div class="md2-txt"><b>' + title + '</b><span' +
      (descId ? ' id="' + descId + '"' : '') + '>' + (desc || '') + '</span></div>' + (ctrl || '') +
      '<span class="md2-ico"><i class="fa ' + icon + '"></i></span></div>' + (body || '') + '</div>';
  }
  function delBtn(k) { return '<button type="button" class="md2-btn red ic" data-del="' + k + '" title="حذف" aria-label="حذف"><i class="fa fa-trash"></i></button>'; }
  function sw(id, title) { return '<label class="md-switch"' + (title ? ' title="' + title + '"' : '') + '><input type="checkbox" id="' + id + '"><span class="md-slider"></span></label>'; }
  function upbox(id) { return '<div class="md2-upbox" id="' + id + '"><div class="bar"><i></i></div><div class="msg"></div></div>'; }
  function socRow(ic, id, ph) {
    return '<div class="md2-soc-row"><span class="md2-chip ' + ic + '" data-ic="' + ic + '"></span><input id="' + id +
      '" class="md2-in" type="text" dir="ltr" maxlength="200" autocomplete="off" placeholder="' + ph + '"></div>';
  }
  function gradHTML(id, cnt) {
    cnt = cnt || 3; /* [CHANGED - 5 COLORS] خلفية الاسم 5 ألوان، الكارت 3 */
    var h = '<div class="md2-modes">';
    MODES.forEach(function (m) { h += '<button type="button" class="md2-mode" data-g="' + id + '" data-mode="' + m.k + '"><i class="fa ' + m.i + '"></i> ' + m.t + '</button>'; });
    h += '</div><div class="md2-gcols" data-g="' + id + '">';
    for (var n = 0; n < cnt; n++) h += '<input type="color" data-g="' + id + '" data-n="' + n + '" value="#ffffff" aria-label="اللون ' + (n + 1) + '">';
    return h + '</div><div class="md2-gbar" data-g="' + id + '"></div>';
  }
  /* [ADDED - GLOW] منتقي لون التوهج + ألوان جاهزة. g = اسم الحقل في S.cur (name_glow / edge_glow) */
  function glowHTML(g) {
    var sw = GLOW_SW.map(function (c) { return '<button type="button" class="md2-gsw" data-gl="' + g + '" data-c="' + c + '" style="background:' + c + '" aria-label="' + c + '"></button>'; }).join('');
    return '<div class="md2-acts md2-glow"><input type="color" class="md2-col" data-gl="' + g + '" value="#ffd24a" aria-label="لون التوهج"><div class="md2-gsws">' + sw + '</div></div>';
  }
  function grid(kind) { return '<div class="md2-grid" id="md2Grid-' + kind + '" data-kind="' + kind + '"></div>'; }

  var BUILD = {
    /* [CHANGED - FEATURE CARDS] تبويب "ملفي" القديم اتقسم: خلفية البروفايل (صورة + لون) / الأغنية / اليوتيوب / الترحيب / زوار البروفايل */
    pbg: function () {
      return ci('cover', 'fa-picture-o', 'صورة خلفية البروفايل', 'صورة تظهر خلف البروفايل كله. غلاف الأعلى والصورة الدائرية بيتغيروا من الإعدادات.', '',
          '<div class="md2-acts"><label class="md2-btn" for="md2Cover"><i class="fa fa-upload"></i> اختيار صورة</label><span class="md2-fn" id="md2CoverName"></span>' + delBtn('cover') + '</div>' +
          '<input id="md2Cover" class="md2-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif">' + upbox('md2CoverBox') +
          '<div class="md2-row md2-sub" id="md2CoverFullRow" style="display:none"><div class="md2-txt"><b>وضع الصورة على كامل الغلاف</b><span>البروفايل كله يبقى نفس الصورة (كارت واحد).</span></div>' + sw('md2CoverFull') + '</div>') +
        ci('bg', 'fa-tint', 'لون خلفية البروفايل<em class="md2-def" id="md2BgDef">افتراضي</em>', 'لون سادة خلف البروفايل.',
          '<input type="color" class="md2-col" id="md2Bg" value="#ffffff">' + delBtn('bg'));
    },
    music: function () {
      return ci('music', 'fa-music', 'أغنية البروفايل', 'بتتشغل لما حد يفتح بروفايلك (ملف صوتي لحد 10 ميجا).', '',
          '<div class="md2-acts"><label class="md2-btn" for="md2Music"><i class="fa fa-upload"></i> اختيار ملف</label><span class="md2-fn" id="md2MusicName"></span>' +
          '<button type="button" class="md2-play" id="md2Play" data-act="play" style="display:none" aria-label="تشغيل"><i class="fa fa-play"></i></button>' + delBtn('music') + '</div>' +
          '<input id="md2Music" class="md2-file" type="file" accept="audio/mpeg,audio/mp3,audio/ogg,audio/wav,audio/mp4,audio/x-m4a,audio/aac,audio/webm">' + upbox('md2MusicBox'));
    },
    yt: function () {
      return ci('yt', 'fa-youtube-play', 'رابط اليوتيوب', '', sw('md2YtOn', 'إظهار / إخفاء الأيقونة لزوار البروفايل'),
          '<input id="md2Yt" class="md2-in" type="text" dir="ltr" maxlength="200" autocomplete="off" placeholder="https://www.youtube.com/watch?v=...">', 'md2YtHint');
    },
    welcome: function () {
      return ci('welcome', 'fa-hand-paper-o', 'شعار ترحيب', 'رسالة تنزل لأي حد يفتح بروفايلك (وتبان لك كمان).', delBtn('welcome'),
          '<textarea id="md2Welcome" class="md2-in" rows="3" maxlength="240" dir="rtl" placeholder="اكتب رسالة الترحيب..."></textarea><div class="md2-hint"><span id="md2WelcomeN">0</span>/240</div>');
    },
    visit: function () {
      return ci('visit', 'fa-eye', 'تنبيه زوار البروفايل', '', sw('md2Visit', 'تشغيل / إيقاف تنبيه من دخل بروفايلك'), '', 'md2VisitHint');
    },
    frames: function () {
      return ci('atar', 'fa-picture-o', 'الإطارات المتحركة<span class="md2-live">فوري</span>', 'إطار متحرك حوالين صورتك في المتصلين والرسايل. بيتطبق أول ما تضغط عليه.', '', grid('atar'));
    },
    cards: function () {
      return ''+
        (S.hasAssets ? ci('back', 'fa-image', 'خلفية الكارت<span class="md2-live">فوري</span>', 'صورة جاهزة بتظهر خلف كارتك في المتصلين. بتتطبق أول ما تضغط عليها.', '', grid('back')) : '');
    },
    namebg: function () {
      return ci('name', 'fa-tint', 'خلفية لون الاسم<em class="md2-def" id="md2NameDef">افتراضي</em>', 'لون سادة أو تدرج لحد 5 ألوان: بيظهر خلفية لكارتك في قايمة المتصلين وخلف اسمك في رسائل الغرفة. اضغط "حفظ التصميم" بعد ما تخلّص.', delBtn('namebg'), gradHTML('name', 5));
    },
    nameshine: function () {
      var modes = ['h:أفقي:fa-arrows-h', 'v:عمودي:fa-arrows-v', 'm:مختلط:fa-arrows-alt'].map(function (x) { x = x.split(':'); return '<button type="button" class="md2-mode" data-ns-mode="' + x[0] + '"><i class="fa ' + x[2] + '"></i> ' + x[1] + '</button>'; }).join('');
      var cols = ''; for (var n = 0; n < 3; n++) cols += '<input type="color" data-ns-n="' + n + '" value="#000000" aria-label="اللون ' + (n + 1) + '">';
      return ci('ns', 'fa-star', 'لون اسم لامع<em class="md2-def" id="md2NsDef">افتراضي</em>', 'تدرج 3 ألوان مع لمعة بتتحسب من الألوان نفسها. اضغط "حفظ التصميم" بعد ما تخلّص.', delBtn('nameshine'),
        '<div class="md2-modes">' + modes + '</div><div class="md2-gcols">' + cols + '</div>' +
        '<div class="md2-shine"><button type="button" class="md2-mode md2-shine-btn" data-ns-shine="1"><i class="fa fa-star"></i> وضع لمعة</button>' +
        '<label class="md2-size"><span>حجم اللمعة <b id="md2NsSizeV">50</b></span><input type="range" id="md2NsSize" min="0" max="100" step="1" value="50" aria-label="حجم اللمعة"></label></div>' +
        '<div class="md2-gbar" id="md2NsBar"></div>');
    },
    nameglow: function () {
      return ci('nglow', 'fa-lightbulb-o', 'توهج خلفية لون الاسم<em class="md2-def" id="md2NgDef">بدون توهج</em>', 'توهج ناعم وثابت حوالين خلفية اسمك بنفس اللون المختار (المعاينة فوق). اضغط "حفظ" بعد ما تخلّص.', delBtn('nameglow'), glowHTML('name_glow'));
    },
    edgeglow: function () {
      return ci('eglow', 'fa-sun-o', 'توهج حواف البروفايل<em class="md2-def" id="md2EgDef">بدون توهج</em>', 'ضوء ناعم بيتدرّج خارج حدود كارت البروفايل بنفس اللون المختار (المعاينة فوق). اضغط "حفظ" بعد ما تخلّص.', delBtn('edgeglow'), glowHTML('edge_glow'));
    },
    glitter: function () {
      return ci('lmaa', 'fa-magic', 'اللمعات<span class="md2-live">فوري</span>', 'صورة متحركة بتظهر جوه حروف اسمك. بتتطبق أول ما تضغط عليها.', '', grid('lmaa'));
    },
    social: function () {
      return ci('social', 'fa-link', 'حسابات التواصل', 'بتظهر كأيقونات في بروفايلك. سيب الخانة فاضية لإخفاء الأيقونة.', '',
        socRow('tg', 'md2Tg', 'رابط تيليجرام أو @username') + socRow('fb', 'md2Fb', 'رابط فيس بوك') + socRow('wa', 'md2Wa', 'رقم دولي أو رابط واتساب'));
    }
  };

  /* ============================== المعاينة الحية (واحدة بس) ============================== */
  function buildStage(mode) {
    S.stageMode = mode; S.pv = null; S.card = null; S.cardHost = null;
    if (mode === 'profile') {
      S.stage.innerHTML = '<div class="md2-pvwrap" id="md2PvWrap"><div class="md2-pv" id="md2Pv"><div class="md2-pv-cover" id="md2PvCover"></div>' +
        '<div class="md2-pv-av"><span class="md2-pv-img" id="md2PvImg"></span><span class="md2-pv-frame" id="md2PvFrame"></span></div>' +
        '<div class="md2-pv-txt"><span class="md2-pv-name" id="md2PvName"></span><div class="md2-pv-msg" id="md2PvMsg"></div></div>' +
        '<div class="md2-pv-meta" id="md2PvMeta"></div></div></div>';
      S.pv = { wrap: el('md2PvWrap'), box: el('md2Pv'), cover: el('md2PvCover'), img: el('md2PvImg'), frame: el('md2PvFrame'), name: el('md2PvName'), msg: el('md2PvMsg'), meta: el('md2PvMeta'), sig: null };
    } else {
      S.stage.innerHTML = '<div class="md2-cardbox"><div class="md2-cardhost" id="md2CardHost"></div></div>';
      S.cardHost = el('md2CardHost');
    }
  }

  function schedule(kind) {
    if (!S) return;
    if (kind === 'colors') { if (!S.dirty.all) S.dirty.colors = 1; } else { S.dirty.all = 1; }
    if (S.raf) return;
    var s = S;
    s.raf = requestAnimationFrame(function () { if (S !== s) return; s.raf = 0; paintStage(); });
  }

  function paintStage() {
    var mode = tabDef(S.tab).m;
    if (!mode || !S.stage) { S.dirty = {}; return; }       /* ميزة من غير معاينة (الترحيب / تنبيه الزوار) */
    if (S.stageMode !== mode) { buildStage(mode); S.dirty.all = 1; }
    if (mode === 'profile') paintProfile();
    else if (S.dirty.all || !S.card) paintCard();
    else paintCardColors();
    S.dirty = {};
  }

  function nameBgValue() {
    var G = window.mdGrad, nb = norm($('input.sbg').first().val());
    if (!(G ? G.valid(nb) : /^#[0-9a-f]{6}$/i.test(nb))) nb = norm(me().bg);
    return nb;
  }
  function paintNameBg(node, noBg, noGlow) {
    var nb = noBg ? '' : nameBgValue();
    if (window.mdGlow) window.mdGlow.applyMsgName(node, noGlow ? '' : S.cur.name_glow); /* [ADDED - GLOW] معاينة شكل رسالة الغرفة */
    if (window.mdGrad) window.mdGrad.applyBg(node, nb); /* [FIX - NO DEFAULT BG] applyBg بيتجاهل الأبيض الافتراضي */ else node.style.backgroundColor = nb;
  }
  function applyGlitter(jq) {
    if (window.memberDesignApplyNameGlitter) { try { window.memberDesignApplyNameGlitter(jq, { ifedit: 1, lmaa: S.sel.lmaa }); } catch (e) {} }
  }

  function paintProfile() {
    var p = S.pv, c = S.cur, u = me();
    if (!p || !p.box) return;
    var pcv = safeUrl(u.profile_cover), av = safeUrl(u.pic);
    if (av && typeof removegifpic === 'function') { try { av = safeUrl(removegifpic(av)) || av; } catch (e) {} }
    var full = !!(c.cover && c.cover_full);
    p.box.classList.toggle('full', full);
    if (window.mdGlow) window.mdGlow.applyEdge(p.wrap, c.edge_glow); /* [ADDED - GLOW] */
    if (S.stage) S.stage.classList.toggle('glowpad', S.tab === 'edgeglow');
    p.box.style.backgroundColor = c.profile_bg || '#fff';
    p.box.style.backgroundImage = c.cover ? cssUrl(coverOpt(c.cover)) : 'none';
    p.cover.classList.toggle('blur', !pcv);
    var cv = pcv || av;
    p.cover.style.backgroundImage = cv ? cssUrl(cv) : 'none';
    p.img.style.backgroundImage = av ? cssUrl(av) : 'none';
    var fr = safeUrl(optUrl(S.sel.atar));
    p.frame.style.backgroundImage = fr ? cssUrl(fr) : 'none';

    var nm = norm($('.stopic').first().val()) || decodeText(u.topic) || u.username || 'اسم العضو';
    if (p.name.textContent !== nm) p.name.textContent = nm;
    $(p.name).css('color', nsCur() || liveColor('.scolor', /^#[0-9a-f]{3,6}$/i.test((window.mdNameFont ? window.mdNameFont.base(u.ucol) : u.ucol) || '') ? (window.mdNameFont ? window.mdNameFont.base(u.ucol) : u.ucol) : '#000000'));
    paintNameBg(p.name, false, true);
    applyGlitter($(p.name));
    var msg = norm($('.smsg').first().val()) || decodeText(u.msg) || 'الحالة تظهر هنا';
    if (p.msg.textContent !== msg) p.msg.textContent = msg;
    p.msg.style.color = liveColor('.mscolor', u.mscol || '');

    var yt = !!(c.youtube_on && norm($('.urluto').first().val()));
    var sig = [c.social_telegram ? 1 : 0, c.social_facebook ? 1 : 0, c.social_whatsapp ? 1 : 0, yt ? 1 : 0, c.profile_music ? (c.profile_music_name || '♪') : ''].join('|');
    if (p.sig === sig) return;
    p.sig = sig;
    var icons = window.mdSocialIcons || {}, m = p.meta;
    m.textContent = '';
    function chip(cls, html) { var s = document.createElement('span'); s.className = 'md2-chip ' + cls; s.innerHTML = html; m.appendChild(s); return s; }
    SOCIAL.forEach(function (sc) { if (c[sc.key]) chip(sc.ic, icons[sc.ic] || '<i class="fa fa-link"></i>'); });
    if (yt) chip('yt', '<i class="fa fa-youtube-play"></i>');
    if (c.profile_music) { var mu = chip('mu', '<i class="fa fa-music"></i>'); if (c.profile_music_name) { var t = document.createElement('span'); t.textContent = c.profile_music_name; t.style.cssText = 'max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap'; mu.appendChild(t); } }
  }

  /* كارت المتصلين من قالب #uhtml — نفس ربط user-list.js (bindDesign / bindIdentity / bindMessage / bindAvatar) */
  function buildCard() {
    var tpl = $('#uhtml').html();
    if (!tpl) return null;
    var u = me();
    var e = $.extend({}, u, { ifedit: 1, atar: S.sel.atar, back: S.sel.back, lmaa: S.sel.lmaa });
    var uh = $(tpl).first(), card = uh[0];
    var ucol = nsCur() || liveColor('.scolor', /^#[0-9a-f]{3,6}$/i.test((window.mdNameFont ? window.mdNameFont.base(e.ucol) : e.ucol) || '') ? (window.mdNameFont ? window.mdNameFont.base(e.ucol) : e.ucol) : '#000000');
    var fr = safePath(S.sel.atar);

    var topic = uh.find('.u-topic');
    topic.text(norm($('.stopic').first().val()) || decodeText(e.topic) || 'اسم العضو').css('color', ucol);
    paintNameBg(topic[0], true); /* كارت المتصلين: الخلفية للكارت مش للاسم */
    applyGlitter(topic);
    var msg = norm($('.smsg').first().val()) || decodeText(e.msg) || 'الحالة تظهر هنا';
    try { uh.find('.u-msg').html(typeof emo === 'function' ? emo(msg) : $('<i>').text(msg).html()).css('color', liveColor('.mscolor', e.mscol || '')); }
    catch (x) { uh.find('.u-msg').text(msg); }
    var st = parseInt(e.stat, 10); if (isNaN(st) || st < 0 || st > 3) st = 0;
    uh.find('.ustat').attr('src', 'imgs/s' + st + '.png?2').removeAttr('style');
    card.classList.add('stat-' + st);
    uh.find('.co').hide();
    uh.find('.uhash').text('');
    try { var ico = typeof getico === 'function' ? getico(e) : ''; if (ico) uh.find('.u-ico').attr('src', ico); else uh.find('.u-ico').removeAttr('src'); } catch (x) {}

    uh.find('.imgbaqer').attr('style', 'display: none;');
    var pic = uh.find('.u-pic');
    pic.attr('style', 'min-width: 52px; width: 52px; min-height: 48px; max-height: 62px; background-repeat: inherit !important; background-color: #f3f3f3; margin-top: 1px;');
    var pu = (typeof removegifpic === 'function' ? removegifpic(e.pic) : e.pic) || '';
    pic.css('background-image', cssUrl(pu));
    var copic = liveColor('.scopic', e.copic || '');
    if (copic) pic.css('border', '2px solid ' + copic);
    if (fr) {
      card.classList.add('has-frame');
      var f = document.createElement('span');
      f.className = 'u-frame-ov';
      f.style.cssText = 'display:block;position:absolute;top:50%;left:50%;width:48px;height:48px;transform:translate(-50%,-50%);background:center / 100% 100% no-repeat;pointer-events:none;';
      f.style.backgroundImage = cssUrl(fr);
      pic[0].style.position = 'relative';
      pic[0].appendChild(f);
    }
    applyCardBg(card);
    return uh;
  }
  function applyCardBg(card) {
    var G = window.mdGrad, bg = safePath(S.sel.back), cc = G ? G.nameBg(nameBgValue()) : nameBgValue(); /* [CHANGED - NAME BG → CARD] الأبيض الافتراضي = من غير خلفية */
    card.style.background = bg ? cssUrl(bg) + ' 0% 0% / 100% 100% rgba(255, 255, 255, 0.05)' : '';
    var gr = G ? G.css(cc) : '';
    if (gr) card.style.background = (bg ? cssUrl(bg) + ' 0% 0% / 100% 100% no-repeat, ' : '') + gr;
    else if (cc) card.style.backgroundColor = cc;
  }
  function paintCard() {
    var host = S.cardHost;
    if (!host) return;
    var card = null;
    try { card = buildCard(); } catch (e) { if (window.console) console.error('[studio2] card', e); }
    host.textContent = '';
    if (card) host.appendChild(card[0]);
    S.card = card;
  }
  function paintCardColors() {
    if (!S.card) return;
    applyCardBg(S.card[0]);
    var t = S.card[0].querySelector('.u-topic');
    if (t) {
      paintNameBg(t, true);
      var u = me();
      $(t).css('color', nsCur() || liveColor('.scolor', /^#[0-9a-f]{3,6}$/i.test((window.mdNameFont ? window.mdNameFont.base(u.ucol) : u.ucol) || '') ? (window.mdNameFont ? window.mdNameFont.base(u.ucol) : u.ucol) : '#000000'));
    }
  }

  /* ============================== التدرج اللوني (كارت العضو / خلفية الاسم) ============================== */
  function nameHas() {
    var v = norm($('input.sbg').first().val()).toLowerCase();
    return !!v && v !== WHITE && (window.mdGrad ? window.mdGrad.valid(v) : true);
  }
  function gradLoad(id) {
    var G = window.mdGrad, v = id === 'card' ? S.cur.member_card_color : $('input.sbg').first().val();
    var p = G && G.parse(v);
    var cn = id === 'name' ? 5 : 3, cc = p ? p.c.slice() : [WHITE, WHITE, WHITE];
    while (cc.length < cn) cc.push(cc[cc.length - 1]); /* [CHANGED - 5 COLORS] القديم (3 ألوان) بيتمدّ بتكرار آخر لون */
    S.g[id] = { mode: p ? p.mode : '', c: cc };
  }
  function gradEnc(st) {
    var G = window.mdGrad;
    return G ? G.encode(st.mode, st.mode ? st.c : [st.c[0], st.c[0], st.c[0]]) : st.c[0]; /* 5 ألوان بتتحوّل لـ3 تلقائي لو آخر 3 متطابقين */
  }
  function gradPaint(id) {
    var st = S.g[id], G = window.mdGrad;
    if (!st) return;
    var cols = qa('.md2-gcols[data-g="' + id + '"]')[0];
    if (!cols) return;
    var ins = cols.getElementsByTagName('input'), i;
    for (i = 0; i < ins.length; i++) if (ins[i].value !== st.c[i]) ins[i].value = st.c[i];
    cols.classList.toggle('solid', !st.mode);
    var has = id === 'card' ? !!S.cur.member_card_color : nameHas();
    var btns = qa('.md2-mode[data-g="' + id + '"]');
    for (i = 0; i < btns.length; i++) btns[i].classList.toggle('on', has && btns[i].getAttribute('data-mode') === st.mode);
    var bar = qa('.md2-gbar[data-g="' + id + '"]')[0], enc = gradEnc(st);
    if (bar) bar.style.background = (G && (G.css(enc) || G.solid(enc))) || WHITE;
  }
  function gradWrite(id) {
    var enc = gradEnc(S.g[id]);
    if (id === 'card') S.cur.member_card_color = enc || '';
    else $('input.sbg').first().val(enc || WHITE).trigger('input');
    syncUi();
    schedule('colors');
  }

  /* ============================== لون اسم لامع (النواة: window.mdNameShine — القيمة بتتخزن في ucol بصيغة n:...) ============================== */
  var DEF_SIZE = 50;
  function plainHex() {
    var c = norm((window.mdNameFont ? window.mdNameFont.base(me().ucol) : me().ucol) || $('.scolor').first().val());
    if (c && c.charAt(0) !== '#') c = '#' + c;
    return /^#[0-9a-f]{6}$/i.test(c) ? c.toLowerCase() : '#000000';
  }
  function nsCur() { return window.mdNameShine ? window.mdNameShine.cur() : ''; }
  function nsLoad() {
    var N = window.mdNameShine, p = N && N.parse(nsCur());
    if (p) S.ns = { on: true, mode: p.mode, c: p.c.slice(), shine: p.shine, size: p.size };
    else { var h = plainHex(); S.ns = { on: false, mode: 'h', c: [h, h, h], shine: 1, size: DEF_SIZE }; }
  }
  function nsEnc() { var st = S.ns; return window.mdNameShine.encode(st.mode, st.c, st.shine, st.size); }
  function nsPaint() {
    var st = S.ns, N = window.mdNameShine;
    if (!st || !N) return;
    var pane = S.pane.nameshine; if (!pane) return;
    var i, ins = pane.querySelectorAll('.md2-gcols input'), btns = pane.querySelectorAll('[data-ns-mode]');
    for (i = 0; i < ins.length; i++) if (ins[i].value !== st.c[i]) ins[i].value = st.c[i];
    for (i = 0; i < btns.length; i++) btns[i].classList.toggle('on', st.on && btns[i].getAttribute('data-ns-mode') === st.mode);
    var sb = pane.querySelector('[data-ns-shine]'); sb.classList.toggle('on', !!st.shine);
    var sz = el('md2NsSize'); sz.disabled = !st.shine; sz.value = st.size; sz.parentNode.classList.toggle('off', !st.shine);
    setText('md2NsSizeV', String(st.size));
    var p = N.parse(nsEnc()), bar = el('md2NsBar'); if (bar) bar.style.background = p ? N.gradCss(p) : st.c[0];
  }
  function nsWrite() {
    S.ns.on = true;
    window.mdNameShine.setCur(nsEnc());
    syncUi();
    schedule('colors');
  }

  /* ============================== مزامنة عناصر الواجهة مع الحالة ============================== */
  function syncUi() {
    var c = S.cur, i;
    setText('md2CoverName', c.cover ? 'تم اختيار صورة' : 'لم يتم اختيار ملف');
    setText('md2MusicName', c.profile_music ? (c.profile_music_name || 'تم اختيار أغنية') : 'لم يتم اختيار ملف');
    var has = { cover: !!c.cover, bg: !!c.profile_bg, card: !!c.member_card_color, music: !!c.profile_music, welcome: !!c.welcome_msg, namebg: nameHas(), nameshine: !!nsCur(), nameglow: !!c.name_glow, edgeglow: !!c.edge_glow };
    var dels = qa('[data-del]');
    for (i = 0; i < dels.length; i++) dels[i].disabled = !has[dels[i].getAttribute('data-del')];
    var row = el('md2CoverFullRow');
    if (row) { row.style.display = c.cover ? '' : 'none'; var cf = el('md2CoverFull'); if (cf) cf.checked = !!(c.cover && c.cover_full); }
    var bg = el('md2Bg'); if (bg && bg.value !== (c.profile_bg || WHITE)) bg.value = c.profile_bg || WHITE;
    var d = el('md2BgDef'); if (d) d.style.display = c.profile_bg ? 'none' : 'inline-block';
    d = el('md2CardDef'); if (d) d.style.display = c.member_card_color ? 'none' : 'inline-block';
    d = el('md2NameDef'); if (d) d.style.display = has.namebg ? 'none' : 'inline-block';
    d = el('md2NsDef'); if (d) d.style.display = has.nameshine ? 'none' : 'inline-block';
    var pl = el('md2Play'); if (pl) pl.style.display = c.profile_music ? '' : 'none';
    setText('md2YtHint', c.youtube_on ? 'مفعّل: تظهر أيقونة اليوتيوب لمن يفتح بروفايلك.' : 'متوقف: لن تظهر الأيقونة لأحد (الرابط محفوظ).');
    setText('md2VisitHint', c.visitor_notify_on ? 'مفعّل: يصلك تنبيه عند دخول أي شخص لبروفايلك.' : 'متوقف: لن يصلك أي تنبيه بمن دخل بروفايلك.');
    setText('md2WelcomeN', String((c.welcome_msg || '').length));
    d = el('md2NgDef'); if (d) d.style.display = c.name_glow ? 'none' : 'inline-block';
    d = el('md2EgDef'); if (d) d.style.display = c.edge_glow ? 'none' : 'inline-block';
    var gi = qa('input[data-gl]');
    for (i = 0; i < gi.length; i++) { var gv = c[gi[i].getAttribute('data-gl')] || '#ffd24a'; if (gi[i].value !== gv) gi[i].value = gv; }
    var gs = qa('.md2-gsw');
    for (i = 0; i < gs.length; i++) gs[i].classList.toggle('on', (c[gs[i].getAttribute('data-gl')] || '').toLowerCase() === gs[i].getAttribute('data-c'));
    gradPaint('card'); gradPaint('name'); nsPaint();
  }
  function refreshSave() { var b = S && S.host.querySelector('.md2-save'); if (b) b.disabled = !!S.busy; }

  /* ============================== شبكات الصور (على دفعات + تفريغ عند مغادرة التبويب) ============================== */
  function thumb(kind, p) { return (kind === 'atar' || kind === 'lmaa') ? p.replace(/\.[A-Za-z0-9]+$/, '_l.webp') : p; }
  function gridError(e) {
    var im = e.target;
    if (!im || im.tagName !== 'IMG' || im.getAttribute('data-none')) return;
    var orig = im.getAttribute('data-p');
    if (orig && im.getAttribute('src') !== orig && !im._fb) { im._fb = 1; im.setAttribute('src', orig); return; }
    im.classList.add('bad');
  }
  function mark(kind) {
    var gr = S.grids[kind]; if (!gr) return;
    var cur = S.sel[kind], kids = gr.host.children;
    for (var i = 0; i < kids.length; i++) {
      var k = kids[i];
      if (k.getAttribute('data-none')) k.classList.toggle('on', !cur);
      else if (k.getAttribute('data-p')) k.classList.toggle('on', !!cur && k.getAttribute('data-p') === cur);
    }
  }
  function appendChunk(kind) {
    var gr = S.grids[kind]; if (!gr) return;
    var frag = document.createDocumentFragment(), end = Math.min(gr.items.length, gr.pos + CHUNK);
    for (; gr.pos < end; gr.pos++) {
      var p = gr.items[gr.pos], im = document.createElement('img');
      im.className = 'md2-tile it';
      im.alt = ''; im.decoding = 'async'; im.loading = 'lazy';
      im.setAttribute('data-p', p);
      im.setAttribute('src', thumb(kind, p));
      if (p === S.sel[kind]) im.classList.add('on');
      frag.appendChild(im);
    }
    gr.host.insertBefore(frag, gr.more);
  }
  function mountGrid(kind) {
    var host = el('md2Grid-' + kind);
    if (!host || S.grids[kind]) return;
    var arr = list(kind), items = [];
    for (var i = 0; i < arr.length; i++) {
      var e = arr[i];
      if (!e || !e.path || !/\.(gif|png|jpe?g|webp|apng|svg)$/i.test(String(e.path))) continue; /* تجاهل أي ملف مش صورة (زي Thumbs.db) */
      var p = safePath(kind + '/' + e.path);
      if (p) items.push(p);
    }
    host.innerHTML = '<img class="md2-tile none" data-none="1" src="no.png" alt="بدون" title="بدون">' +
      (items.length ? '' : '<div class="md2-empty">لا يوجد عناصر متاحة حاليًا</div>') + '<div class="md2-more"></div>';
    var gr = S.grids[kind] = { host: host, items: items, pos: 0, io: null, more: host.lastChild };
    host.addEventListener('error', gridError, true);
    appendChunk(kind);
    if (items.length > gr.pos && 'IntersectionObserver' in window) {
      gr.io = new IntersectionObserver(function (es) {
        if (S && S.grids[kind] === gr && es[0] && es[0].isIntersecting) {
          appendChunk(kind);
          if (gr.pos >= gr.items.length) { gr.io.disconnect(); gr.io = null; }
          else { gr.io.unobserve(gr.more); gr.io.observe(gr.more); }   /* يعيد الفحص لو الدفعة ما دفعتش المؤشر بره المجال */
        }
      }, { root: S.body, rootMargin: '240px' });
      gr.io.observe(gr.more);
    } else { while (gr.pos < items.length) appendChunk(kind); }
    mark(kind);
  }
  function unmountGrid(kind) {
    var gr = S.grids[kind]; if (!gr) return;
    if (gr.io) { try { gr.io.disconnect(); } catch (e) {} }
    gr.host.removeEventListener('error', gridError, true);
    gr.host.textContent = '';
    delete S.grids[kind];
  }
  function gridKinds(k) { return S.hasAssets ? (tabDef(k).kinds || []) : []; }

  /* ============================== التبويبات ============================== */
  function fillIcons(root) {
    var icons = window.mdSocialIcons || {}, n = qa('[data-ic]', root);
    for (var i = 0; i < n.length; i++) { var ic = n[i].getAttribute('data-ic'); n[i].innerHTML = icons[ic] || '<i class="fa fa-link"></i>'; }
  }
  function initPane(k) {
    var c = S.cur, v;
    if (k === 'pbg') {
      v = el('md2CoverFull'); if (v) v.checked = !!c.cover_full;
    } else if (k === 'yt') {
      v = el('md2YtOn'); if (v) v.checked = !!c.youtube_on;
      v = el('md2Yt'); if (v) v.value = norm($('.urluto').first().val());
    } else if (k === 'welcome') {
      v = el('md2Welcome'); if (v) v.value = c.welcome_msg || '';
    } else if (k === 'visit') {
      v = el('md2Visit'); if (v) v.checked = !!c.visitor_notify_on;
    } else if (k === 'social') {
      el('md2Tg').value = c.social_telegram; el('md2Fb').value = c.social_facebook; el('md2Wa').value = c.social_whatsapp;
      fillIcons(S.pane[k]);
    } else if (k === 'cards') gradLoad('card');
    else if (k === 'namebg') gradLoad('name');
    else if (k === 'nameshine') nsLoad();
  }
  function ensurePane(k) {
    if (S.pane[k]) return S.pane[k];
    var p = document.createElement('div');
    p.className = 'md2-pane';
    p.setAttribute('data-pane', k);
    p.innerHTML = BUILD[k]();
    S.body.appendChild(p);
    S.pane[k] = p;
    initPane(k);
    return p;
  }
  function activate(k) {
    if (!S || S.tab === k) return;
    S.tab = k;
    ensurePane(k).classList.add('on');
    gridKinds(k).forEach(mountGrid);
    syncUi();
    S.body.scrollTop = 0;
    schedule();
  }

  /* ============================== الرفع ============================== */
  function setStatus(boxId, kind, text, pct) {
    var box = el(boxId); if (!box) return;
    box.style.display = 'block'; box.setAttribute('data-kind', kind || '');
    box.querySelector('.msg').textContent = text || '';
    var bar = box.querySelector('.bar');
    if (typeof pct === 'number') { bar.style.display = ''; bar.firstChild.style.width = pct + '%'; } else bar.style.display = 'none';
  }
  function hideBox(id) { var b = el(id); if (b) b.style.display = 'none'; }
  function upload(s, boxId, type, file) {
    return new Promise(function (resolve, reject) {
      if (!window.MY_T) return reject(new Error('الجلسة غير جاهزة، أعد تسجيل الدخول'));
      if (file.size > LIMITS[type]) return reject(new Error('حجم الملف كبير (الحد الأقصى ' + Math.round(LIMITS[type] / 1048576) + ' ميجا)'));
      var fd = new FormData(); fd.append('file', file);
      var xhr = new XMLHttpRequest();
      s.xhrs.push(xhr);
      xhr.open('POST', '/member-design/upload?type=' + encodeURIComponent(type) + '&token=' + encodeURIComponent(window.MY_T));
      xhr.upload.onprogress = function (e) { if (S === s && e.lengthComputable) { var p = Math.round(e.loaded * 100 / e.total); setStatus(boxId, 'load', 'جاري الرفع... ' + p + '%', p); } };
      xhr.onload = function () {
        var j = null; try { j = JSON.parse(xhr.responseText); } catch (e) {}
        if (xhr.status >= 200 && xhr.status < 300 && j && j.url) resolve(j); else reject(new Error((j && j.msg) || ('فشل الرفع (' + xhr.status + ')')));
      };
      xhr.onerror = function () { reject(new Error('تعذر الاتصال بالسيرفر')); };
      xhr.ontimeout = function () { reject(new Error('انتهت مهلة الرفع')); };
      xhr.timeout = 120000;
      setStatus(boxId, 'load', 'جاري الرفع... 0%', 0);
      xhr.send(fd);
    });
  }
  function handleFile(input, boxId, type, onDone) {
    var file = input.files && input.files[0]; if (!file) return;
    var s = S;
    if (s.preview) {                                        /* [ADDED - FEATURE STORE] معاينة: الملف بيتعرض محليًا بس ومبيتبعتش للسيرفر */
      var okType = type === 'music' ? /^audio\//.test(file.type) : /^image\//.test(file.type);
      if (!okType) { setStatus(boxId, 'err', 'نوع الملف غير مناسب'); input.value = ''; return; }
      var lu = URL.createObjectURL(file); (s.urls = s.urls || []).push(lu);
      onDone({ url: lu }, file); setStatus(boxId, 'ok', 'معاينة محلية فقط — لن يُرفع الملف');
      return;
    }
    s.busy++; refreshSave();
    upload(s, boxId, type, file).then(function (j) { if (S !== s) return; onDone(j, file); setStatus(boxId, 'ok', 'تم الرفع بنجاح ✔'); },
      function (e) { if (S !== s) return; setStatus(boxId, 'err', (e && e.message) || 'فشل رفع الملف'); input.value = ''; })
      .then(function () { if (S !== s) return; s.busy--; refreshSave(); });
  }

  /* ============================== مشغّل المعاينة الصوتية ============================== */
  function paintPlay() {
    var i = document.querySelector('#md2Play i'); if (!i || !S) return;
    var playing = !!(S.audio && !S.audio.paused && !S.audio.ended);
    i.className = 'fa ' + (playing ? 'fa-pause' : 'fa-play');
  }
  function stopAudio() {
    var a = S && S.audio; if (!a) return;
    try { a.pause(); } catch (e) {}
    a.removeAttribute('src'); try { a.load(); } catch (e) {}
    paintPlay();
  }
  function togglePlay() {
    var c = S.cur; if (!c.profile_music) return;
    if (!S.audio) {
      S.audio = new Audio(); S.audio.preload = 'none';
      S.audio.addEventListener('play', paintPlay); S.audio.addEventListener('pause', paintPlay); S.audio.addEventListener('ended', paintPlay);
    }
    var a = S.audio;
    if (a.getAttribute('src') !== c.profile_music) { try { a.pause(); } catch (e) {} a.setAttribute('src', c.profile_music); }
    if (a.paused) { var pr = a.play(); if (pr && pr.catch) pr.catch(function () { notify('تعذر تشغيل الملف'); }); } else a.pause();
  }

  /* ============================== الأحداث (delegation على العنصر المضيف، بتتفصل كلها في destroy) ============================== */
  function onTile() {
    var t = this, kind = t.parentNode && t.parentNode.getAttribute('data-kind');
    if (!kind || !KIND_NUM[kind] || t.classList.contains('bad')) return;
    var none = t.getAttribute('data-none') === '1', path = none ? '' : safePath(t.getAttribute('data-p'));
    if (!none && !path) return;
    if (S.sel[kind] === path) return;                       /* نفس الاختيار → مفيش داعي نبعت تاني */
    S.sel[kind] = path;
    mark(kind);
    schedule();
    if (!S.preview && typeof window.addback === 'function') window.addback(none ? ' ' : path, KIND_NUM[kind]);   /* [CHANGED - FEATURE STORE] المعاينة محلية بس */
  }
  function onDel() {
    var k = this.getAttribute('data-del'), c = S.cur, v;
    if (k === 'cover') { c.cover = ''; c.cover_full = 0; v = el('md2Cover'); if (v) v.value = ''; hideBox('md2CoverBox'); }
    else if (k === 'bg') c.profile_bg = '';
    else if (k === 'card') { c.member_card_color = ''; gradLoad('card'); }
    else if (k === 'music') { c.profile_music = ''; c.profile_music_name = ''; stopAudio(); v = el('md2Music'); if (v) v.value = ''; hideBox('md2MusicBox'); }
    else if (k === 'welcome') { c.welcome_msg = ''; v = el('md2Welcome'); if (v) v.value = ''; }
    else if (k === 'namebg') { $('input.sbg').first().val(WHITE).trigger('input'); gradLoad('name'); }
    else if (k === 'nameshine') { if (window.mdNameShine) window.mdNameShine.setCur(''); nsLoad(); }
    else if (k === 'nameglow') c.name_glow = '';
    else if (k === 'edgeglow') c.edge_glow = '';
    syncUi();
    schedule((k === 'card' || k === 'namebg' || k === 'nameshine' || k === 'nameglow') ? 'colors' : 'all');
  }
  function bind(host) {
    var $h = $(host);
    $h.on('click.md2', function (e) { if (e.target === host) close(); });
    $h.on('click.md2', '[data-act="close"]', function () { close(); });
    $h.on('click.md2', '[data-act="save"]', function () { save(); });
    $h.on('click.md2', '[data-act="buy"]', function () { var f = S && S.feat; close(); if (f && typeof window.mdStoreOpen === 'function') window.mdStoreOpen(f); });   /* [ADDED - FEATURE STORE] */
    $h.on('click.md2', '[data-act="play"]', togglePlay);
    $h.on('click.md2', '[data-del]', onDel);
    $h.on('click.md2', '.md2-tile', onTile);
    $h.on('click.md2', '.md2-mode[data-g]', function () { var id = this.getAttribute('data-g'); S.g[id].mode = this.getAttribute('data-mode'); gradWrite(id); });
    $h.on('input.md2 change.md2', '.md2-gcols[data-g] input', function () { var id = this.getAttribute('data-g'); S.g[id].c[+this.getAttribute('data-n')] = this.value; gradWrite(id); });
    $h.on('input.md2 change.md2', '[data-ns-n]', function () { S.ns.c[+this.getAttribute('data-ns-n')] = this.value; nsWrite(); });
    $h.on('click.md2', '[data-ns-mode]', function () { S.ns.mode = this.getAttribute('data-ns-mode'); nsWrite(); });
    $h.on('click.md2', '[data-ns-shine]', function () { S.ns.shine = S.ns.shine ? 0 : 1; nsWrite(); });
    $h.on('input.md2 change.md2', '#md2NsSize', function () { S.ns.size = Math.max(0, Math.min(100, parseInt(this.value, 10) || 0)); nsWrite(); });
    $h.on('input.md2 change.md2', 'input[data-gl]', function () { var g = this.getAttribute('data-gl'); S.cur[g] = hexColor(this.value, '').toLowerCase(); syncUi(); schedule(g === 'name_glow' ? 'colors' : ''); });
    $h.on('click.md2', '.md2-gsw', function () { var g = this.getAttribute('data-gl'); S.cur[g] = this.getAttribute('data-c'); syncUi(); schedule(g === 'name_glow' ? 'colors' : ''); });
    $h.on('input.md2 change.md2', '#md2Bg', function () { S.cur.profile_bg = hexColor(this.value, ''); syncUi(); schedule(); });
    $h.on('change.md2', '#md2CoverFull', function () { S.cur.cover_full = this.checked ? 1 : 0; schedule(); });
    $h.on('change.md2', '#md2YtOn', function () { S.cur.youtube_on = this.checked; syncUi(); schedule(); });
    $h.on('input.md2', '#md2Yt', function () { $('.urluto').val(this.value); schedule(); });
    $h.on('change.md2', '#md2Visit', function () { S.cur.visitor_notify_on = this.checked; syncUi(); });
    $h.on('input.md2', '#md2Welcome', function () { S.cur.welcome_msg = String(this.value || '').slice(0, 240); syncUi(); });
    SOCIAL.forEach(function (sc, i) {
      $h.on('input.md2 change.md2', '#' + ['md2Tg', 'md2Fb', 'md2Wa'][i], function () { S.cur[sc.key] = norm(this.value); schedule(); });
    });
    $h.on('change.md2', '#md2Cover', function () { handleFile(this, 'md2CoverBox', 'cover', function (j) { S.cur.cover = j.url; syncUi(); schedule(); }); });
    $h.on('change.md2', '#md2Music', function () {
      handleFile(this, 'md2MusicBox', 'music', function (j, file) { stopAudio(); S.cur.profile_music = j.url; S.cur.profile_music_name = file.name.replace(/\.[^.]+$/, ''); syncUi(); schedule(); });
    });
  }

  /* ============================== فتح / حفظ / إغلاق ============================== */
  /* بدون مفتاح ميزة (زي زرار العصاية القديم): نفتح الإعدادات على تبويب المميزات */
  function openFeatures() {
    try {
      if (typeof window.openSettingsPopup !== 'function') return;
      Promise.resolve(window.openSettingsPopup()).then(function () {
        if (typeof window.stpSwitchTab === 'function') window.stpSwitchTab('features');
      });
    } catch (e) { if (window.console) console.error('[studio2] openFeatures', e); }
  }

  function open(k, opts) {
    var preview = !!(opts && opts.preview);                /* [ADDED - FEATURE STORE] معاينة ميزة من المتجر: من غير صلاحية، ومن غير حفظ أو رفع */
    if (!preview && !allowed()) { notify('ليس لديك صلاحية استوديو تصميم العضوية'); return; }
    if (S) return;
    var def = (typeof k === 'string') ? featDef(k) : null;
    if (!def) { if (!preview) openFeatures(); return; }
    if (!preview && window.featAccess && !featAccess.ok(def.k)) { notify('هذه الميزة غير متاحة لرتبتك'); return; }   /* [ADDED - FEATURE ACCESS] */
    var hasAssets = !!el('mdFramesField') || preview || !!(window.mdStoreLite && window.mdStoreLite.active(def.k));   /* x2.js بيشيل العلامة لو العضو ملوش ifedit؛ المشتري/المعاين مستثنى */
    if ((def.assets && !hasAssets) || (def.ns && !window.mdNameShine)) { notify('هذه الميزة غير متاحة لحسابك'); return; }
    var host = el(HOST_ID);
    if (!host) { host = document.createElement('div'); host.id = HOST_ID; document.body.appendChild(host); }
    var u = me();
    var cur = {
      cover: isCustomCover(u.cover) ? safeUrl(u.cover) : '', cover_full: 0,
      profile_bg: hexColor(u.profile_bg, ''), member_card_color: gcolor(u.member_card_color, ''),
      name_glow: hexColor(u.name_glow, ''), edge_glow: hexColor(u.edge_glow, ''),
      profile_music: safeUrl(u.profile_music), profile_music_name: '',
      social_telegram: String(u.social_telegram || ''), social_facebook: String(u.social_facebook || ''), social_whatsapp: String(u.social_whatsapp || ''),
      welcome_msg: String(u.welcome_msg || '').slice(0, 240),
      youtube_on: onFlag(u.youtube_on), visitor_notify_on: onFlag(u.visitor_notify_on)
    };
    cur.cover_full = cur.cover ? (u.cover_full ? 1 : 0) : 0;
    cur.profile_music_name = cur.profile_music ? (u.profile_music_name || '') : '';

    S = {
      host: host, hasAssets: hasAssets, cur: cur, feat: def.k, preview: preview, urls: null,
      sel: { atar: safePath(u.atar), back: safePath(u.back), lmaa: safePath(u.lmaa) },
      keep: { urluto: $('.urluto').first().val(), sbg: $('input.sbg').first().val(), ns: nsCur() },  /* للتراجع لو اتقفل من غير حفظ */
      tab: '', pane: {}, grids: {}, g: {}, dirty: {}, raf: 0, busy: 0, xhrs: [], audio: null, saved: false,
      stage: null, stageMode: '', pv: null, card: null, cardHost: null, body: null
    };
    var foot = preview
      ? '<div class="md2-foot"><button type="button" class="md2-save" data-act="buy"><i class="fa fa-shopping-bag"></i> شراء الميزة</button>' +
        '<button type="button" class="md2-cancel" data-act="close">إغلاق</button></div>'
      : def.instant
      ? '<div class="md2-foot"><button type="button" class="md2-save" data-act="close"><i class="fa fa-check"></i> تم</button></div>'
      : '<div class="md2-foot"><button type="button" class="md2-save" data-act="save"><i class="fa fa-save"></i> حفظ</button>' +
        '<button type="button" class="md2-cancel" data-act="close">إلغاء</button></div>';
    host.className = 'md2-ov md2-single';
    host.innerHTML = '<div class="md2-card" role="dialog" aria-modal="true" aria-label="' + def.t + '">' +
      '<div class="md2-head"><div class="md2-top"><div class="md2-title"><i class="fa ' + def.i + '"></i><span>' + def.t + (preview ? ' · معاينة' : '') + '</span></div>' +
      '<button type="button" class="md2-x" data-act="close" aria-label="إغلاق"><i class="fa fa-times"></i></button></div>' +
      (def.m ? '<div class="md2-stage" id="md2Stage"></div>' : '') + '</div>' +
      (preview ? '<div class="md2-pvnote"><i class="fa fa-eye"></i> معاينة فقط — اشترِ الميزة لتطبيقها على حسابك</div>' : '') +
      '<div class="md2-body" id="md2Body"></div>' + foot + '</div>';
    S.stage = el('md2Stage'); S.body = el('md2Body');
    bind(host);
    S.onKey = function (e) { if (e.keyCode === 27 && S) { e.stopImmediatePropagation(); e.preventDefault(); close(); } };
    document.addEventListener('keydown', S.onKey, true);   /* Esc يقفل نافذة الميزة الأول (مش نافذة الإعدادات اللي تحتها) */
    host.style.display = 'block';
    activate(def.k);
  }

  function save() {
    if (!S || S.preview) return;
    if (S.busy) { alert('انتظر حتى ينتهي رفع الملف'); return; }
    var c = S.cur, G = window.mdGrad;
    var d = {
      topic: ($('.stopic').val() || ''), msg: ($('.smsg').val() || ''), youtube: ($('.urluto').val() || ''),
      ucol: (function (plain) { return window.mdNameShine ? window.mdNameShine.pick(plain) : plain; })('#' + ($('.scolor').val() || '000000').replace('#', '')), mcol: '#' + ($('.mcolor').val() || '000000').replace('#', ''), mscol: '#' + ($('.mscolor').val() || '000000').replace('#', ''),
      bg: (G ? G.bgValue($('.sbg').val()) : '#' + ($('.sbg').val() || 'ffffff').replace('#', '')), copic: '#' + ($('.scopic').val() || 'ffffff').replace('#', ''),
      cover: c.cover || '', cover_full: (c.cover && c.cover_full) ? 1 : 0, profile_music: c.profile_music || '', profile_music_name: c.profile_music ? (c.profile_music_name || '') : '',
      member_card_color: c.member_card_color || '', profile_bg: c.profile_bg || '',
      name_glow: c.name_glow || '', edge_glow: c.edge_glow || '',
      social_telegram: c.social_telegram || '', social_facebook: c.social_facebook || '', social_whatsapp: c.social_whatsapp || '',
      welcome_msg: c.welcome_msg || '',
      youtube_on: c.youtube_on ? 1 : 0, visitor_notify_on: c.visitor_notify_on ? 1 : 0
    };
    var u = me(); d.pic = u.pic; d.username = u.username;
    S.saved = true;
    if (typeof setv === 'function') setv('uprofile', JSON.stringify(d));
    if (typeof SEND_EVENT_EMIT === 'function') SEND_EVENT_EMIT('SEND_EVENT_EMIT_PROFILE', d);
    close();
  }

  /* إغلاق = تفكيك كامل: مفيش حاجة من الاستوديو بتفضل في الـ DOM أو الذاكرة */
  function close() {
    if (!S) return;
    var s = S; S = null;
    if (s.raf) cancelAnimationFrame(s.raf);
    s.xhrs.forEach(function (x) { try { x.abort(); } catch (e) {} });
    Object.keys(s.grids).forEach(function (k) { var g = s.grids[k]; if (g.io) { try { g.io.disconnect(); } catch (e) {} } });
    if (s.audio) { try { s.audio.pause(); } catch (e) {} s.audio.removeAttribute('src'); try { s.audio.load(); } catch (e) {} }
    document.removeEventListener('keydown', s.onKey, true);
    if (s.urls) s.urls.forEach(function (u) { try { URL.revokeObjectURL(u); } catch (e) {} });   /* [ADDED - FEATURE STORE] */
    if (!s.saved) {                                         /* إلغاء: نرجّع الحقلين اللي الاستوديو بيكتب فيهم لقيمتهم قبل الفتح */
      $('.urluto').val(s.keep.urluto);
      $('input.sbg').first().val(s.keep.sbg);
      if (window.mdNameShine) window.mdNameShine.setCur(s.keep.ns);
    }
    var host = s.host;
    $(host).off('.md2');
    host.textContent = '';
    host.className = '';
    host.style.display = 'none';
  }

  window.openMemberDesignStudio = open;
  window.closeMemberDesignStudio = close;
  window.saveMemberDesign = save;
  /* للفحص الحي من الكونسول: __mdStudio2State() → null لو مقفول */
  window.__mdStudio2State = function () { return S ? { tab: S.tab, panes: Object.keys(S.pane), grids: Object.keys(S.grids), nodes: S.host.getElementsByTagName('*').length } : null; };
})();
