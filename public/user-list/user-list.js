/* ============================================================================
   [PERF] قائمة المتصلين الافتراضية (Virtualized) — user-list/user-list.js
   يُحمَّل بعد x2.js مباشرة. بيستبدل (بنفس الأسماء العامة للتوافق) الدوال:
   AddUser / renderUserListBatched / updateu / updateusers / stealthit / rusers /
   updateUsersCount / usearch / getpower (مع cache)

   المعمارية:
     DATA      C_L_U (المصدر) + U_CASH + meta[id] (مفاتيح الفرز/البحث المحسوبة) + byRoom (فهرس الغرف)
       ↓
     VIEW      order[] (كل الأعضاء المرتبين) → list[] (بعد البحث + الفاصل) → نطاق الظهور
       ↓
     DOM POOL  عدد محدود من الكروت (~ ارتفاع الشاشة/ارتفاع الكارت + overscan) بيُعاد استخدامها
       ↓
     PATCH     bindRow بيكتب بس الحقول اللي اتغيرت (cache للقيم السابقة على الصف)
   لا sort على DOM، لا polling، scroll listener واحد passive بيحجز rAF واحد.
   ========================================================================== */
(function () {
  'use strict';
  /* [PERF-FIX #8] عدادات تشخيصية (تعمل فقط مع localStorage perfDebug=1) — قراءة: PD_STATS() */
  var PDBG = false; try { PDBG = localStorage.getItem('perfDebug') === '1'; } catch (e) {}
  function pd(k) { if (PDBG) { var P = window.__PD = window.__PD || {}; P[k] = (P[k] || 0) + 1; } }

  var DIV = '\u0001ninr';           /* id وهمي لفاصل "المتواجدين في الدردشه" */
  var ROW_EST = 70;                 /* ارتفاع تقديري للكارت قبل القياس الفعلي */
  var OVERSCAN = 220;               /* px فوق وتحت الـ viewport  [PERF-Z] كان 360: كروت أقل مربوطة وقت السكرول */
  var MAX_POOL_KEEP = 80;
  /* [PERF-FIX - USERS ROOM ONLY] وانت جوه غرفة: القايمة بتعرض أعضاء الغرفة دي بس (من غير فاصل "المتواجدين في الدردشه" ولا أعضاء الغرف التانية)
     عشان الأداء وحجم الـDOM. لو بتكتب في مربع البحث بيتبحث في كل المتصلين (تقدر تدوّر على عضو في غرفة تانية وتفتحله خاص).
     لو عايز البحث يبقى جوه الغرفة بس: خلّي SEARCH_ALL = false. لو عايز ترجّع القايمة القديمة: خلّي ROOM_ONLY = false. */
  var ROOM_ONLY = true;
  var SEARCH_ALL = true;

  var scroller = null, host = null, divTpl = '';
  var meta = {};                    /* id -> {u,key,tk,tn,tsrc,vis,rid,ns} */
  var all = [];                     /* كل الـ ids بترتيب الدخول (أساس ثابت للفرز) */
  var byRoom = {};                  /* rid -> Set(ids) */
  var nsCount = 0;                  /* عدد الأعضاء غير المتخفين (s == null) */
  var order = [], list = [], pos = {}, offs = [0], heights = {};
  var query = '', qNorm = '';
  var wasInRoom = false;
  var dirtyOrder = false, dirtyList = false, offsDirty = false, dirtyIds = {};
  var raf = 0, countRaf = 0, searchTimer = 0, inited = false, lastW = 0;
  var pool = [], freeRows = [], rowById = new Map(), divRow = null;

  /* ---------- [PERF-FIX - FRAME PRELOAD DEFER] ----------
     التحميل المسبق لإطارات الأعضاء كان بيبدأ فور وصول بيانات كل عضو (ensureMeta) حتى لو قايمة
     المتصلين ما اتفتحتش أبدًا في الجلسة — ففي الدخول/إعادة الاتصال بيحصل انفجار تحميل صور + canvas
     + toBlob لكل الأعضاء المُطارَين مرة واحدة، بيزاحم الشات نفسه على الشبكة والمعالج.
     دلوقتي: الإطار بيتسجل في طابور بيتصفّى في وقت الخمول (requestIdleCallback) على دفعات
     صغيرة (4 لكل فترة خمول)، وأول ما القايمة تتفتح (render يشوف ارتفاع فعلًا) بنبدأ فورًا.
     الرسم الفعلي للصف الظاهر (bindDesign → GCFrameStatic.attach) بيحمّل فورًا زي ما هو —
     فمفيش تأخير مرئي: الصف اللي بيظهر إطاره بيتجهز في نفس اللحظة. */
  var frameQ = {}, frameQn = 0, frameIdle = 0;
  function queueFrame(id) { if (!frameQ[id]) { frameQ[id] = 1; frameQn++; } scheduleFrames(); }
  function framesBatch() {
    frameIdle = 0;
    if (!window.GCFrameStatic) return;
    var n = 0;
    for (var k in frameQ) {
      var m = meta[k];
      delete frameQ[k]; frameQn--;
      if (m && m.u && m.u.ifedit && m.u.atar) window.GCFrameStatic.preload(_optUrl(m.u.atar));
      if (++n >= 4) break;                     /* دفعة صغيرة لكل فترة خمول — مش موجة كاملة */
    }
    scheduleFrames();
  }
  function scheduleFrames() {
    if (frameQn <= 0 || frameIdle) return;
    if (window.requestIdleCallback) frameIdle = window.requestIdleCallback(framesBatch, { timeout: 2000 });
    else frameIdle = setTimeout(framesBatch, 400);
  }

  var collator = (window.Intl && Intl.Collator) ? new Intl.Collator() : null;
  function cmpStr(a, b) { return collator ? collator.compare(a, b) : a.localeCompare(b); }

  /* ---------- getpower cache (نفس النتيجة، بدون بحث متكرر في pws) ---------- */
  var _gp = window.getpower, gpc = {}, gpRef = null;
  window.getpower = function (n) {
    if (gpRef !== window.pws) { gpc = {}; gpRef = window.pws; }
    var k = String(n), c = gpc[k];
    if (c) return c;
    c = _gp(n);
    gpc[k] = c;
    return c;
  };

  /* ---------- helpers ---------- */
  function plainTopic(t) {
    t = t == null ? '' : String(t);
    if (t.indexOf('&') < 0 && t.indexOf('<') < 0) return t;
    try { return new DOMParser().parseFromString(t, 'text/html').body.textContent || ''; }
    catch (e) { return t; }
  }
  function normTopic(t) { return String(t == null ? '' : t).split('ـ').join('').toLowerCase(); }
  function cssUrl(s) { return 'url("' + String(s).replace(/["\\\n\r]/g, '\\$&') + '")'; }
  /* [PERF - ATAR/LMAA OPT] مسارات مكتبة atar/lmaa → النسخة المصغّرة _t.webp (أي رابط تاني بيفضل زي ما هو). */
  function _optUrl(v){
    v = String(v||'').trim();
    return /^\/?(atar|lmaa)\/[^\/?#]+\.(png|jpe?g|gif|webp)$/i.test(v) ? v.replace(/\.[A-Za-z0-9]+$/, '_l.webp') : v;
  }
  function inRoomNow(u) {
    return typeof M_ROOM !== 'undefined' && M_ROOM != null && typeof R_CASH !== 'undefined' &&
      R_CASH[M_ROOM] != null && u.roomid == M_ROOM;
  }
  function roomActive() {
    return typeof M_ROOM !== 'undefined' && M_ROOM != null && typeof R_CASH !== 'undefined' && R_CASH[M_ROOM] != null;
  }
  function computeKey(u) {
    var p = getpower(u.power), rk = p.rank, v = parseInt(rk, 10);
    if (isNaN(v)) v = 0;
    if (getico(u) && !rk) v = 10;
    return v + (inRoomNow(u) ? 1e5 : 0);
  }
  function isHidden(u) {
    return !!(u.s && typeof jstp !== 'undefined' && jstp && getpower(u.power).rank > jstp.rank);
  }
  function matches(m, u) {
    if (qNorm === '' && query === '') return true;
    var id = String(u.idreg == null ? '' : u.idreg);
    return !(m.tn.indexOf(qNorm) === -1 && id.indexOf(query) !== 0 && id.indexOf(query) !== 1);
  }

  /* ---------- room index ---------- */
  function ridOf(u) { return u.roomid == null ? '' : String(u.roomid); }
  function indexRoom(m, rid) {
    if (m.rid !== undefined && byRoom[m.rid]) { byRoom[m.rid].delete(m.u.id); if (!byRoom[m.rid].size) delete byRoom[m.rid]; }
    m.rid = rid;
    (byRoom[rid] || (byRoom[rid] = new Set())).add(m.u.id);
  }
  window.rusers = function (rid) {
    if (typeof R_CASH === 'undefined' || R_CASH[rid] == null) return [];
    var s = byRoom[String(rid)], out = [];
    if (!s) return out;
    s.forEach(function (id) { var m = meta[id]; if (m) out.push(m.u); });
    return out;
  };

  /* ---------- data layer ---------- */
  function ensureMeta(u) {
    var m = meta[u.id];
    if (!m) {
      m = meta[u.id] = { u: u, key: 0, tk: '', tn: '', tsrc: undefined, vis: true, rid: undefined, ns: false };
      all.push(u.id);
      dirtyOrder = true;
    }
    m.u = u;
    /* [PERF-FIX - FRAME PRELOAD DEFER] تسجيل الإطار في طابور وقت الخمول بدل التحميل الفوري
       (الشرح الكامل فوق عند تعريف frameQ). attach للصف الظاهر بيفضل فوري زي ما هو. */
    if (u.ifedit && u.atar && window.GCFrameStatic) queueFrame(u.id);
    return m;
  }
  function touch(u) {
    var m = meta[u.id];
    if (!m) return;
    m.u = u;
    var rid = ridOf(u);
    if (m.rid !== rid) { indexRoom(m, rid); scheduleCount(); }
    if (m.tsrc !== u.topic) {
      m.tsrc = u.topic; m.tk = plainTopic(u.topic); m.tn = normTopic(u.topic);
      dirtyOrder = true;
    }
    var key = computeKey(u);
    if (m.key !== key) { m.key = key; dirtyOrder = true; }
    var vis = !isHidden(u);
    if (m.vis !== vis) { m.vis = vis; dirtyOrder = true; }
    var ns = (u.s == null);
    if (m.ns !== ns) { nsCount += ns ? 1 : -1; m.ns = ns; setBusers(); }
    if (rowById.has(u.id)) dirtyIds[u.id] = 1;
    schedule();
  }
  function add(u) {
    if (!u || u.id == null) return;
    var isNew = !meta[u.id];
    var m = ensureMeta(u);
    if (isNew) { m.ns = false; m.rid = undefined; m.tsrc = undefined; }
    touch(u);
    scheduleCount();
  }
  function remove(id) {
    var m = meta[id];
    if (!m) return;
    if (m.rid !== undefined && byRoom[m.rid]) { byRoom[m.rid].delete(id); if (!byRoom[m.rid].size) delete byRoom[m.rid]; }
    if (m.ns) { nsCount--; }
    delete meta[id]; delete heights[id]; delete dirtyIds[id];
    var i = all.indexOf(id);
    if (i > -1) all.splice(i, 1);
    dirtyOrder = true;
    setBusers();
    scheduleCount();
    schedule();
  }
  function setBusers() {
    var el = document.getElementById('busers');
    if (el && el.textContent !== String(nsCount)) el.textContent = nsCount;
  }
  function reset(newList) {
    /* [RECONNECT] تنظيف كامل: صفوف الـ DOM + الفهارس + الـ cache، وبعدين إعادة بناء. */
    releaseAll(true);
    var prev = Object.keys(meta);
    meta = {}; all = []; byRoom = {}; nsCount = 0; order = []; list = []; pos = {};
    offs = [0]; dirtyIds = {};
    var keep = {};
    for (var i = 0; i < newList.length; i++) {
      var e = newList[i];
      U_CASH[e.id] = e;
      keep[e.id] = 1;
    }
    for (var p = 0; p < prev.length; p++) if (!keep[prev[p]]) { delete heights[prev[p]]; if (typeof U_CASH !== 'undefined') delete U_CASH[prev[p]]; }
    for (var j = 0; j < newList.length; j++) { ensureMeta(newList[j]); }
    for (var k = 0; k < newList.length; k++) touch(newList[k]);
    dirtyOrder = true; dirtyList = true;
    scheduleCount(); setBusers(); schedule();
    if (window.memberDesignRefreshFramesBatch) window.memberDesignRefreshFramesBatch(newList);
  }
  function touchAll() {
    for (var i = 0; i < all.length; i++) { var m = meta[all[i]]; if (m) touch(m.u); }
    dirtyList = true; schedule();
  }

  /* ---------- sort / filter ---------- */
  function resort() {
    pd('ul_resort');
    var ids = [];
    for (var i = 0; i < all.length; i++) { var m = meta[all[i]]; if (m && m.vis) ids.push(all[i]); }
    ids.sort(function (a, b) {
      var ma = meta[a], mb = meta[b];
      if (ma.key !== mb.key) return mb.key - ma.key;
      return cmpStr(ma.tk, mb.tk);
    });
    order = ids;
  }
  function rebuildList() {
    var out = [], inRoom = roomActive();
    var searching = (qNorm !== '' || query !== '');
    /* [PERF-FIX - USERS ROOM ONLY] جوه غرفة ومفيش بحث → أعضاء الغرفة بس */
    var roomOnly = ROOM_ONLY && inRoom && !(SEARCH_ALL && searching);
    var divPlaced = !inRoom;
    for (var i = 0; i < order.length; i++) {
      var id = order[i], m = meta[id];
      /* order مرتب بالـkey تنازليًا (أعضاء الغرفة أولًا) فأول عضو برا الغرفة = نهاية القايمة */
      if (roomOnly && m.key <= 9999) break;
      if (!divPlaced && m.key <= 9999) { out.push(DIV); divPlaced = true; }
      if (matches(m, m.u)) out.push(id);
    }
    if (!divPlaced && !roomOnly) out.push(DIV);
    list = out;
    pos = {};
    for (var k = 0; k < list.length; k++) pos[list[k]] = k;
    wasInRoom = inRoom;
  }
  function rebuildOffsets() {
    var n = list.length, y = 0;
    offs = new Array(n + 1);
    for (var i = 0; i < n; i++) { offs[i] = y; y += heights[list[i]] || ROW_EST; }
    offs[n] = y;
    if (host) host.style.height = y + 'px';
  }
  function lowerBound(y) { /* أول index offs[i+1] > y */
    var lo = 0, hi = list.length;
    while (lo < hi) { var mid = (lo + hi) >> 1; if (offs[mid + 1] > y) hi = mid; else lo = mid + 1; }
    return lo;
  }
  function hostTop() {
    return host.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
  }
  function captureAnchor() {
    if (!list.length) return null;
    var vy = scroller.scrollTop - hostTop();
    if (vy <= 0) return null;
    var i = lowerBound(vy);
    if (i >= list.length) return null;
    return { id: list[i], d: vy - offs[i] };
  }
  function restoreAnchor(a) {
    if (!a || pos[a.id] === undefined) return;
    var want = hostTop() + offs[pos[a.id]] + a.d;
    if (Math.abs(scroller.scrollTop - want) > 1) scroller.scrollTop = want;
  }

  /* ---------- DOM pool ---------- */
  function init() {
    if (inited) return true;
    scroller = document.getElementById('users');
    if (!scroller) return false;
    host = scroller.querySelector('.usr');
    if (!host) return false;
    inited = true;
    var lab = scroller.querySelector('label.ninr');
    if (lab) { divTpl = lab.outerHTML; lab.parentNode.removeChild(lab); }
    scroller.addEventListener('scroll', schedule, { passive: true });
    host.addEventListener('click', function (e) {
      var card = e.target.closest ? e.target.closest('.uzr.uhtml') : null;
      if (!card || !host.contains(card)) return;
      var uid = card.getAttribute('data-uid');
      if (uid && typeof window.upro === 'function') window.upro(uid);
    });
    if (window.ResizeObserver) {
      new ResizeObserver(function () {
        var w = scroller.clientWidth;
        if (w !== lastW) { lastW = w; lastS = -1; }   /* [PERF-Z] العرض اتغيّر: ارتفاعات الكروت ممكن تتغيّر فنعيد القياس */
        schedule();
      }).observe(scroller);
    }
    return true;
  }
  function tplHtml() {
    var t = (typeof uhtml === 'string' && uhtml !== '*') ? uhtml : (document.getElementById('uhtml') || {}).innerHTML;
    return t || '';
  }
  function createRow() {
    var wrap = document.createElement('div');
    wrap.className = 'uvrow';
    var t = document.createElement('div');
    t.innerHTML = tplHtml();
    var card = t.firstElementChild || t.querySelector('.uzr');
    /* لو الـ template فيه whitespace قبل الكارت */
    if (!card || !card.classList.contains('uzr')) card = t.querySelector('.uzr');
    wrap.appendChild(card);
    wrap._card = card;
    wrap._els = {
      ustat: card.querySelector('.ustat'), baq: card.querySelector('.imgbaqer'), pic: card.querySelector('.u-pic'),
      muted: card.querySelector('.muted'), ico: card.querySelector('.u-ico'), topic: card.querySelector('.u-topic'),
      msg: card.querySelector('.u-msg'), hash: card.querySelector('.uhash'), co: card.querySelector('.co')
    };
    wrap._p = {};
    wrap._bid = null;
    host.appendChild(wrap);
    pool.push(wrap);
    return wrap;
  }
  function ensureDivRow() {
    if (divRow) return divRow;
    var wrap = document.createElement('div');
    wrap.className = 'uvrow';
    var t = document.createElement('div');
    t.innerHTML = divTpl || '<label class="nosel ninr uzr label label-primary">المتواجدين في الدردشه</label>';
    var lab = t.firstElementChild;
    lab.style.display = 'block';
    wrap.appendChild(lab);
    wrap._bid = DIV;
    host.appendChild(wrap);
    divRow = wrap;
    return wrap;
  }
  function release(row) {
    row.style.display = 'none';
    row._bid = null;
    freeRows.push(row);
  }
  function releaseAll(dispose) {
    rowById.forEach(function (row, id) { if (id !== DIV) release(row); });
    rowById.clear();
    if (divRow) { divRow.style.display = 'none'; }
    if (dispose) {
      while (pool.length > MAX_POOL_KEEP) {
        var r = pool.pop();
        var fi = freeRows.indexOf(r); if (fi > -1) freeRows.splice(fi, 1);
        if (r.parentNode) r.parentNode.removeChild(r);
      }
    }
  }

  /* ---------- patch renderer (كل دالة بتكتب بس لو القيمة اتغيرت) ---------- */
  var ST_NORM = 'width:4px;min-height:100%;max-height:62px;';
  var ST_M2 = 'width:4px;min-height:100%;max-height:80px;height:80px;';
  var PIC_M1 = 'min-width: 52px; width: 52px; min-height: 48px; max-height: 62px; background-repeat: inherit !important; background-color: #f3f3f3; margin-top: 1px;';
  var PIC_M2 = 'margin-bottom: 10px; min-width: 60px; min-height: 60px; max-height: 60px; background-size: 100% 100%; margin-inline-start: 7px; margin-inline-end: 0px !important; border-radius: 122px !important; margin-top: 6px !important; height: 62px !important; width: 62px !important;';
  var BAQ_M2 = 'width: 80px; margin-block-start: -4px; margin-inline-end: -77px; margin-block-end: 0px; margin-inline-start: -3px; padding: 40px; height: 80px !important; border: 0px solid #f4f4f4 !important;';

  function bindStatus(row, u) {                       /* updateUserStatusCard */
    var p = row._p, E = row._els;
    var stat = 'imgs/s' + (u.s ? 4 : u.stat) + '.png?2';
    if (p.stat !== stat) { p.stat = stat; E.ustat.setAttribute('src', stat); }
    var s = parseInt(u.stat, 10);
    if (isNaN(s) || s < 0 || s > 3) s = 0;
    if (p.sc !== s) {
      row._card.classList.remove('u-on', 'u-off', 'stat-0', 'stat-1', 'stat-2', 'stat-3');
      row._card.classList.add('stat-' + s);
      p.sc = s;
    }
    var ir = inRoomNow(u);
    if (p.ir !== ir) { p.ir = ir; row._card.classList.toggle('inroom', ir); }
  }
  function bindCountry(row, u) {                      /* updateUserCountry */
    var p = row._p, co = row._els.co;
    if (!co) return;
    var none = (u.co == '--' || u.co == null || u.co == 'A1' || u.co == 'A2' || u.co == 'EU');
    var v = none ? '' : 'flag/' + (u.co.toLowerCase().replace('il', 'ps') || 'tn') + '.png';
    if (p.co !== v) {
      p.co = v;
      if (none) { co.style.display = 'none'; }
      else { co.style.display = ''; co.setAttribute('src', v); }
    }
  }
  function bindDesign(row, u) {                       /* updateUserDesign: ifedit / atar / back / member_card_color */
    var p = row._p, E = row._els, card = row._card;
    var mode = 0;
    if (u.ifedit) mode = (u.atar == null || String(u.atar).trim() === '') ? 1 : 2;
    if (p.mode !== mode) {
      p.mode = mode;
      /* [FIX] الإطار (mode 2) بقى طبقة ::after فوق الصورة (user-list-card.css) بدل ما يكبّر الصورة والكارت:
         نفس ستايل mode 1 بالظبط (حجم الكارت والصورة ثابت)، و.imgbaqer فضل مخفي. ST_M2 / PIC_M2 / BAQ_M2 فوق مبقوش مستخدمين */
      E.ustat.style.cssText = ST_NORM;
      E.baq.style.cssText = 'display: none;';
      E.pic.style.cssText = mode === 0 ? '' : PIC_M1;
      E.msg.style.marginLeft = '';
      card.classList.toggle('has-frame', mode === 2);
      if (E.frame) { E.frame.style.display = mode === 2 ? 'block' : 'none'; if (mode !== 2) { E.frame.style.backgroundImage = ''; if (window.GCFrameStatic) window.GCFrameStatic.detach(E.frame); } }
      p.pic = undefined; p.picb = undefined; p.atar = undefined;
    }
    /* [FIX] الإطار عنصر فعلي جوه الصورة (.u-frame-ov) مش متغير CSS: الـ url النسبي جوه متغير CSS كان بيتحل بالنسبة لمجلد ملف الـ CSS
       (user-list/atar/..) فالإطار مكانش بيظهر. الـ backgroundImage inline بيتحل بالنسبة للصفحة زي باقي الصور */
    if (mode === 2 && p.atar !== u.atar) {
      p.atar = u.atar;
      /* [FIX] الستايل الأساسي للإطار inline كمان (مش بس في user-list-card.css) عشان يشتغل حتى لو ملف الـ CSS ما اتحمّلش أو لسه متكاشّى */
      if (!E.frame) {
        E.frame = document.createElement('span'); E.frame.className = 'u-frame-ov';
        E.frame.style.cssText = 'display:block;position:absolute;top:50%;left:50%;width:48px;height:48px;transform:translate(-50%,-50%);background:center / 100% 100% no-repeat;pointer-events:none;';
        E.pic.appendChild(E.frame);
      }
      E.frame.style.display = 'block';
      E.pic.style.position = 'relative';
      E.frame.style.backgroundImage = cssUrl(_optUrl(u.atar)); /* [PERF - ATAR/LMAA OPT] _t.webp */
      if (window.GCFrameStatic) window.GCFrameStatic.attach(E.frame, _optUrl(u.atar)); /* [FRAME STATIC] نسخة ثابتة جاهزة للسكرول/فتح التاب */
    }
    var rbg = u.ifedit ? cssUrl(u.back) + ' 0% 0% / 100% 100% rgba(255, 255, 255, 0.05)' : '';
    var mcc = window.mdGrad ? window.mdGrad.nameBg(u.bg) : (u.bg || ''); /* [CHANGED - NAME BG → CARD] خلفية لون الاسم بقت خلفية الكارت (لون الكارت القديم اتلغى) */
    if (p.rbg !== rbg || p.mcc !== mcc) {
      p.rbg = rbg; p.mcc = mcc;
      /* [CHANGED - GRADIENT] لون الكارت تدرج؟ (الصورة لو فيه فوقه زي ترتيب اللون السادة) وإلا زي الأول */
      var gr = window.mdGrad ? window.mdGrad.css(mcc) : '';
      if (gr) card.style.background = (u.ifedit ? cssUrl(u.back) + ' 0% 0% / 100% 100% no-repeat, ' : '') + gr;
      else { card.style.background = rbg; if (mcc) card.style.backgroundColor = mcc; }
    }
  }
  function bindRank(row, u) {                         /* updateUserRank */
    var p = row._p, E = row._els, ico = getico(u);
    if (p.ico !== ico) {
      p.ico = ico;
      if (ico !== '') E.ico.setAttribute('src', ico); else E.ico.removeAttribute('src');
    }
  }
  function bindMute(row, u) {                         /* updateUserMuteState */
    var m = !!(u.meiut) || ismuted(u);
    if (row._p.mu !== m) { row._p.mu = m; row._els.muted.classList.toggle('fa-ban', m); }
  }
  function bindIdentity(row, u) {                     /* updateUserIdentity */
    var p = row._p, E = row._els;
    if (p.hash !== u.idreg) { p.hash = u.idreg; E.hash.textContent = u.idreg == null ? '' : u.idreg; }
    if (p.topic !== u.topic) { p.topic = u.topic; E.topic.innerHTML = u.topic == null ? '' : u.topic; }
    var bg = '', col = u.ucol || ''; /* [CHANGED - NAME BG → CARD] الاسم نفسه من غير خلفية في قايمة المتصلين */
    if (p.tbg !== bg) { p.tbg = bg; if (window.mdGrad) window.mdGrad.applyBg(E.topic, bg); else E.topic.style.backgroundColor = bg; } /* [CHANGED - GRADIENT] */
    /* [REMOVED - GLOW] توهج الاسم اتشال من قايمة المتصلين نهائيًا (بيظهر في رسائل الغرفة بس) */
    if (p.tcol !== col) { p.tcol = col; if (window.jQuery && (col.indexOf('~') > 0 || col.charCodeAt(0) === 110)) window.jQuery(E.topic).css('color', col); else E.topic.style.color = col; } /* [CHANGED - NAME FONT] ألوان لامعة/فيها خط لازم تعدّي على jQuery hook */
    /* [PERF] اللمعة: change-detection على lmaa/ifedit — مفيش إعادة تطبيق لو ما اتغيرتش */
    var gk = u.ifedit ? String(u.lmaa || '') : '';
    if (p.glit !== gk) {
      p.glit = gk;
      if (window.memberDesignApplyNameGlitter) window.memberDesignApplyNameGlitter(window.jQuery(E.topic), u);
    }
  }
  function bindMessage(row, u) {                      /* updateUserMessage */
    var p = row._p, E = row._els;
    if (p.msg !== u.msg) { p.msg = u.msg; E.msg.innerHTML = emo(u.msg); }
    var c = u.mscol || '';
    if (p.mscol !== c) { p.mscol = c; E.msg.style.color = c; }
  }
  function bindAvatar(row, u) {                       /* updateUserAvatar */
    var p = row._p, E = row._els;
    var pic = u.pic == null ? '' : removegifpic(String(u.pic));
    if (p.pic !== pic) { p.pic = pic; E.pic.style.backgroundImage = cssUrl(pic); }
    var b = '2px solid ' + u.copic;
    if (p.picb !== b) { p.picb = b; E.pic.style.border = b; }
  }
  function bindRow(row, id) {
    pd('ul_bindRow');
    var m = meta[id];
    if (!m) return;
    var u = m.u, card = row._card;
    if (row._bid !== id) {
      if (row._bid != null) { try { card.classList.remove('uid' + row._bid); } catch (e) {} }
      if (!/\s/.test(id)) card.classList.add('uid' + id);
      card.setAttribute('data-uid', id);
      row._bid = id;
    }
    bindStatus(row, u); bindCountry(row, u); bindDesign(row, u); bindRank(row, u);
    bindMute(row, u); bindIdentity(row, u); bindMessage(row, u); bindAvatar(row, u);
  }

  /* ---------- render ---------- */
  function schedule() { if (!raf) raf = requestAnimationFrame(render); }
  function render() {
    raf = 0;
    pd('ul_render');
    if (!init()) return;
    if (scroller.clientHeight === 0) return;          /* التاب مقفول: ResizeObserver هيرجّعنا لما يظهر */
    if (frameQn > 0) scheduleFrames();                /* [PERF-FIX - FRAME PRELOAD DEFER] القايمة ظاهرة: ابدأ تجهيز الإطارات فورًا */
    var anchor = null;
    if (dirtyOrder || dirtyList || wasInRoom !== roomActive()) {
      anchor = captureAnchor();
      if (dirtyOrder) { resort(); dirtyOrder = false; }
      rebuildList(); dirtyList = false; offsDirty = true;
    }
    var force = false;
    if (anchor) force = true;
    if (offsDirty) { rebuildOffsets(); offsDirty = false; restoreAnchor(anchor); force = true; }
    layoutRows(0, force);
  }
  var lastS = -1, lastE = -1;
  function layoutRows(depth, force) {
    pd('ul_layoutRows');
    var top = hostTop(), st = scroller.scrollTop, ch = scroller.clientHeight;
    var vTop = st - top - OVERSCAN, vBot = st - top + ch + OVERSCAN;
    var s = lowerBound(vTop < 0 ? 0 : vTop), e = s;
    while (e < list.length && offs[e] < vBot) e++;
    /* [PERF-Z] سكرول بيفضل جوه نفس المدى (نفس الكروت) ومفيش تغيير بيانات: مفيش حاجة نعملها (بلاش قراءة layout ولا لفّة على الصفوف) */
    if (!force && s === lastS && e === lastE) { var dirty = false; for (var dk in dirtyIds) { dirty = true; break; } if (!dirty) return; }
    var rangeChanged = (s !== lastS || e !== lastE);
    lastS = s; lastE = e;
    var want = {};
    for (var i = s; i < e; i++) want[list[i]] = 1;
    rowById.forEach(function (row, id) {
      if (!want[id]) { rowById.delete(id); if (id === DIV) row.style.display = 'none'; else release(row); }
    });
    for (var j = s; j < e; j++) {
      var id = list[j], row = rowById.get(id), fresh = false;
      if (!row) {
        if (id === DIV) row = ensureDivRow(); else row = freeRows.pop() || createRow();
        rowById.set(id, row); fresh = true;
        row.style.display = '';
      }
      var y = offs[j];
      if (row._y !== y) { row._y = y; row.style.transform = 'translateY(' + y + 'px)'; }
      if (id !== DIV && (fresh || row._bid !== id || dirtyIds[id])) { bindRow(row, id); row._meas = true; }
      else if (id === DIV && fresh) row._meas = true;
    }
    dirtyIds = {};
    /* قياس الارتفاعات الفعلية (قراءة واحدة بعد كل الكتابات) — [PERF-Z] للصفوف اللي اتربطت/اتغيّرت بس */
    var changed = false;
    for (var k = s; k < e; k++) {
      var rid = list[k], r = rowById.get(rid);
      if (!r || !(r._meas || rangeChanged || force)) continue;   /* [PERF-Z] */
      r._meas = false;
      var h = r.offsetHeight;
      if (h > 0 && Math.abs(h - (heights[rid] || 0)) > 0.5) { heights[rid] = h; changed = true; }
    }
    if (changed && depth < 2) {
      var a = captureAnchor();
      rebuildOffsets();
      restoreAnchor(a);
      layoutRows(depth + 1, true);
    }
  }

  /* ---------- search (event-driven) ---------- */
  function applySearch() {
    var el = document.getElementById('usearch');
    var v = el ? el.value : '';
    if (v === query) return;
    query = v;
    qNorm = v.split('ـ').join('').toLowerCase();
    if (el) { if (v !== '') el.classList.remove('bg'); else el.classList.add('bg'); }
    dirtyList = true;
    schedule();
  }
  function onSearchInput(e) {
    if (searchTimer) clearTimeout(searchTimer);
    if (e && e.isTrigger) { applySearch(); return; }
    searchTimer = setTimeout(function () { searchTimer = 0; applySearch(); }, 120);
  }

  /* ---------- count (event-driven) ---------- */
  function countNow() {
    var r = document.getElementById('usRoomCount'), a = document.getElementById('usAllCount');
    try {
      var rc = (typeof M_ROOM !== 'undefined' && M_ROOM) ? rusers(M_ROOM).length : 0;
      var ac = all.length;
      if (r && r.textContent !== String(rc)) r.textContent = rc;
      if (a && a.textContent !== String(ac)) a.textContent = ac;
    } catch (e) {}
  }
  function scheduleCount() { if (!countRaf) countRaf = requestAnimationFrame(function () { countRaf = 0; countNow(); }); }

  /* ---------- window header (نافذة الخاص المفتوحة) — بدون أي مرور على قائمة المتصلين ---------- */
  function updateChatWindow(u) {
    var c = document.getElementById('c' + u.id);
    var ws = document.getElementsByClassName('w' + u.id);
    if (!c && !ws.length) return;                     /* مفيش صندوق/نافذة خاص للعضو ده */
    var $ = window.jQuery, ico = getico(u);
    var stat = 'imgs/s' + (u.s ? 4 : u.stat) + '.png?2';
    var pic = 'url("' + removegifpic(u.pic) + '")';
    var gk = u.ifedit ? String(u.lmaa || '') : '';
    /* [PERF] change-detection: هيدر الخاص (صورة/اسم/حالة/أيقونة/لمعة) بيتلمس بس لو قيمته فعلًا اتغيرت */
    var p = (c && c._pm) || (ws[0] && ws[0]._pm) || {};
    var ch = { ico: p.ico !== ico, stat: p.stat !== stat, topic: p.topic !== u.topic || p.bg !== u.bg || p.ucol !== u.ucol,
      pic: p.pic !== pic, glit: p.glit !== gk };
    if (!(ch.ico || ch.stat || ch.topic || ch.pic || ch.glit)) return;
    if (c) {
      var uh = $(c);
      if (ch.ico && ico != '') uh.find('.u-ico').attr('src', ico);
      if (ch.stat) uh.find('.ustat').attr('src', stat);
      if (ch.topic || ch.glit) {
        var tp = uh.find('.u-topic');
        if (ch.topic) tp.html(u.topic).css({ 'background-color': (window.mdGrad ? window.mdGrad.nameBg(u.bg) : u.bg), color: u.ucol });
        if (window.memberDesignApplyNameGlitter) window.memberDesignApplyNameGlitter(tp, u);
      }
      if (ch.pic) uh.find('.u-pic').css('background-image', pic);
    }
    if (ws.length && (ch.ico || ch.stat)) {
      var hd = $('.w' + u.id).find('.head .uzr');
      if (ch.stat) hd.find('.ustat').attr('src', stat);
      if (ch.ico && ico != '') hd.find('.u-ico').attr('src', ico);
    }
    var np = { ico: ico, stat: stat, topic: u.topic, bg: u.bg, ucol: u.ucol, pic: pic, glit: gk };
    if (c) c._pm = np;
    if (ws[0]) ws[0]._pm = np;
  }
  function updateSelfSettings(u) {
    var $ = window.jQuery;
    $('.spic').css('background-image', 'url("' + u.pic + '")');
    $('.stopic').val(gettext($('<div>' + u.topic + '</div>')));
    $('.urluto').val(gettext($('<div>' + u.youtube + '</div>')));
    $('.smsg').val(gettext($('<div>' + u.msg + '</div>')));
    /* [ADDED - NAME SHINE] لو لون الاسم لامع (n:...) خانة اللون العادي تاخد أول لون، والحالة اللامعة تتسجّل للحفظ */
    var _nsv = (window.mdNameShine && window.mdNameShine.first(u.ucol)) || '';
    if (window.mdNameShine) window.mdNameShine.setCur(_nsv ? u.ucol : '');
    if (window.mdNameFont) window.mdNameFont.setCur(window.mdNameFont.slug(u.ucol)); /* [ADDED - NAME FONT] */
    var _uc = _nsv || (window.mdNameFont ? window.mdNameFont.base(u.ucol) : u.ucol);
    $('.scolor').val(_uc).css('background-color', _uc).attr('v', _uc || '#000').trigger('change');
    $('.mcolor').val(u.mcol || '#000').css('background-color', u.mcol || '#000').attr('v', u.mcol || '#000');
    $('.scopic').val(u.copic || '#000').css('background-color', u.copic || '#000').attr('v', u.copic || '#000');
    $('.mscolor').val(u.mscol || '#000').css('background-color', u.mscol || '#000').attr('v', u.mscol || '#000');
    $('.sbg').val(u.bg).css('background-color', u.bg).attr('v', u.bg || '#000');
  }

  /* ---------- global API (نفس الأسماء القديمة للتوافق) ---------- */
  window.AddUser = function (id, user) { add(user || U_CASH[id]); };
  window.renderUserListBatched = function (l) { reset(l); };
  window.updateu = function (id, uuu) {
    var u = uuu || U_CASH[id];
    if (u == null) return;
    if (u.msg == '') u.msg = '..';
    if (u.id == M_ID) updateSelfSettings(u);
    touch(u);
    updateChatWindow(u);
  };
  window.updateusers = function () { /* الفرز بقى على الداتا داخل touch/render — مفيش DOM sort */ };
  window.stealthit = function (u) { if (u && meta[u.id]) touch(u); };
  window.updateUsersCount = countNow;
  window.usearch = function () { applySearch(); };

  window.UL = {
    add: add, remove: remove, touch: touch, reset: reset, has: function (id) { return !!meta[id]; },
    roomChanged: function () { touchAll(); scheduleCount(); },
    applySearch: function () { if (searchTimer) { clearTimeout(searchTimer); searchTimer = 0; } applySearch(); },
    countNow: countNow, scheduleCount: scheduleCount, renderNow: function () { if (raf) { cancelAnimationFrame(raf); } render(); },
    /* للاختبار والتشخيص */
    stats: function () {
      return { users: all.length, listed: list.length, rows: rowById.size, poolSize: pool.length,
        order: order.slice(), list: list.slice(), busers: nsCount };
    }
  };

  document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'usearch') onSearchInput(e);
  });
  if (window.jQuery) window.jQuery(document).on('input', '#usearch', function (e) { if (e.isTrigger) onSearchInput(e); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
