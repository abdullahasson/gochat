/* =====================================================================================
   [ADDED - FEATURE STORE] public/store/store-lite.js — الجزء الصغير من المتجر اللي بيتحمّل مع الشات (بدون أي واجهة).
   - بيسأل السيرفر عن حالة المتجر مرة بعد الدخول (SEND_EVENT_EMIT_STORE / op:get) ويسمع ردود cmd:"store".
   - بيعرّف window.mdStoreLite: state() / active(feat) / forSale(feat) / anySale() / visible() / remaining(feat) / get(force, cb) / buy(feat, days) / on(fn) / off(fn)
   - بيربط الاشتراكات الشغالة بـ window.featAccess (ok / any / sync) فالميزة المشتراة بتظهر كارتها في إعدادات > المميزات وبتفتح في الاستوديو.
     السيرفر هو اللي بيفرض الصلاحية فعليًا (رفع الملفات / حفظ البروفايل / الإطار والكارت واللمعة) — ده بس للواجهة.
   - واجهة المتجر نفسها (store/store.js + store.css) موديول كسول 'store' بيتحمّل أول فتح لتبويب "المتجر" في الإعدادات.
   لازم يتحمّل بعد feature-access.js و md-grant.js وقبل settings-v2.js.
   ===================================================================================== */
(function () {
  'use strict';
  if (window.mdStoreLite) return;

  var TTL = 20000;
  var st = null;          /* آخر حالة من السيرفر: { reg, points, days, feats, prices, mine, now } */
  var skew = 0;           /* فرق ساعة السيرفر عن ساعة الجهاز (ms) */
  var stamp = 0;
  var waiters = [];
  var subs = [];
  var bound = null;       /* آخر سوكت ركّبنا عليه المستمع (x2.js بيعيد إنشاء السوكت) */
  var asked = null;       /* آخر سوكت سألنا عليه */
  var pending = '';       /* ميزة المفروض يتفتح لها شاشة الشراء أول ما التبويب يتحمّل */
  var askTimer = 0;

  function now() { return Date.now() + skew; }
  function pts(v) { v = parseInt(v, 10); return isFinite(v) ? v : 0; }
  function row(k) { return st && st.prices && st.prices[k] ? st.prices[k] : null; }
  function active(k) { return !!(st && st.mine && st.mine[k] > now()); }
  function anyActive() {
    var m = st && st.mine, k, t = now();
    if (!m) return false;
    for (k in m) { if (Object.prototype.hasOwnProperty.call(m, k) && m[k] > t) return true; }
    return false;
  }
  function forSale(k) { var r = row(k); return !!(r && (r[0] > 0 || r[1] > 0 || r[2] > 0)); }
  function anySale() {
    var p = st && st.prices, k;
    if (!p) return false;
    for (k in p) { if (Object.prototype.hasOwnProperty.call(p, k) && forSale(k)) return true; }
    return false;
  }
  /* تبويب "المتجر" يظهر للأعضاء المسجلين بس، ولما يكون فيه ميزة للبيع أو اشتراك شغال */
  function visible() { return !!(st && st.reg && (anySale() || anyActive())); }
  function remaining(k) { return active(k) ? st.mine[k] - now() : 0; }

  /* ------------------------------------------------------------ ربط featAccess */
  function showStick() {
    try { if (window.jQuery) window.jQuery('#openMemberDesignStudio').show(); } catch (e) {}
  }
  function patchFA() {
    var fa = window.featAccess;
    if (!fa || fa.__store) return !!fa;
    var ok0 = fa.ok, any0 = fa.any, sync0 = fa.sync;
    fa.ok = function (k) { return active(k) || ok0.apply(this, arguments); };
    fa.any = function () { return anyActive() || any0.apply(this, arguments); };
    /* sync الأصلي بيستخدم any الداخلية (رتب بس)، فبعده نرجّع العصاية لو عند العضو اشتراك شغال */
    fa.sync = function () {
      var r = sync0 ? sync0.apply(this, arguments) : undefined;
      if (anyActive()) showStick();
      return r;
    };
    fa.__store = true;
    return true;
  }

  /* ------------------------------------------------------------ السيرفر */
  function flush(v) {
    var w = waiters; waiters = [];
    for (var i = 0; i < w.length; i++) { try { w[i](v); } catch (e) { if (window.console) console.error('[mdStoreLite]', e); } }
  }
  function ask() {
    try {
      if (typeof SEND_EVENT_EMIT === 'function' && typeof socket !== 'undefined' && socket) {
        SEND_EVENT_EMIT('SEND_EVENT_EMIT_STORE', { op: 'get' });
        return true;
      }
    } catch (e) {}
    return false;
  }
  function paintPoints(p) {
    try { if (window.jQuery && typeof abbreviateNumber === 'function') window.jQuery('.ispoint').text(' ' + abbreviateNumber(p || 0)); } catch (e) {}
  }
  function onReply(d) {
    if (!d || typeof d !== 'object') return;
    if (typeof d.now === 'number') skew = d.now - Date.now();
    if (d.op === 'get') {
      st = d;
    } else {                                   /* buy: نحدّث النقاط والاشتراكات بس ونفضل على أسعار آخر get */
      if (!st) st = { reg: 1, prices: {}, feats: [], days: [7, 15, 30], mine: {}, points: 0 };
      if (typeof d.points === 'number') st.points = d.points;
      if (d.mine && typeof d.mine === 'object') st.mine = d.mine;
    }
    stamp = Date.now();
    if (typeof d.points === 'number') paintPoints(d.points);
    patchFA();
    try { if (window.featAccess && window.featAccess.sync) window.featAccess.sync(); } catch (e) {}
    flush(st);
    var s = subs.slice();
    for (var i = 0; i < s.length; i++) { try { s[i](d, st); } catch (e) { if (window.console) console.error('[mdStoreLite]', e); } }
  }

  function get(force, cb) {
    if (typeof cb === 'function') waiters.push(cb);
    if (!force && st && (Date.now() - stamp) < TTL) { flush(st); return; }
    if (!ask()) { flush(st); return; }
    clearTimeout(askTimer);
    askTimer = setTimeout(function () { if (waiters.length) flush(st); }, 8000);   /* ما رجعش رد: ما نعلّقش الواجهة */
  }
  function buy(feat, days) {
    try {
      if (typeof SEND_EVENT_EMIT === 'function' && typeof socket !== 'undefined' && socket) {
        SEND_EVENT_EMIT('SEND_EVENT_EMIT_STORE', { op: 'buy', feat: String(feat), days: parseInt(days, 10) });
        return true;
      }
    } catch (e) {}
    return false;
  }
  function on(fn) { if (typeof fn === 'function' && subs.indexOf(fn) === -1) subs.push(fn); }
  function off(fn) { var i = subs.indexOf(fn); if (i !== -1) subs.splice(i, 1); }

  /* فتح الإعدادات على تبويب المتجر (وشاشة الشراء لميزة معيّنة لو اتحددت) — بيستخدمها زرار "شراء" في معاينة الاستوديو */
  function toast(msg) {
    try { if (typeof SendNotification === 'function') SendNotification({ state: 'me', topic: '', force: 1, msg: msg, user: '' }); } catch (e) {}
  }
  function openStore(feat) {
    pending = typeof feat === 'string' ? feat : '';
    get(false, function (s) {
      /* قبل ما نفتح: المتجر للأعضاء المسجلين وفيه ميزة للبيع (أو اشتراك شغال) — وإلا نقول للعضو السبب بدل ما التبويب يختفي */
      if (!s) { pending = ''; toast('تعذّر تحميل المتجر، حاول مرة أخرى'); return; }
      if (!s.reg) { pending = ''; toast('المتجر متاح للأعضاء المسجلين فقط'); return; }
      if (!visible()) { pending = ''; toast('لا توجد ميزات معروضة في المتجر حاليًا'); return; }
      try {
        if (typeof window.openSettingsPopup !== 'function') return;
        Promise.resolve(window.openSettingsPopup()).then(function () {
          if (typeof window.stpSwitchTab === 'function') window.stpSwitchTab('store');
        });
      } catch (e) { if (window.console) console.error('[mdStoreLite] openStore', e); }
    });
  }
  function takePending() { var p = pending; pending = ''; return p; }

  /* ------------------------------------------------------------ ربط السوكت (يتجدد مع كل سوكت جديد) */
  function tick() {
    patchFA();
    var s = (typeof socket !== 'undefined') ? socket : null;
    if (s && s !== bound && typeof s.on === 'function') {
      bound = s;
      s.on('SEND_EVENT_EMIT_SERVER', function (d) { if (d && d.cmd === 'store') onReply(d.data); });
    }
    var logged = false;
    try { logged = !!(typeof M_ID !== 'undefined' && M_ID); } catch (e) {}
    if (s && logged && s !== asked) { asked = s; ask(); }
  }
  setInterval(tick, 1500);
  tick();

  window.mdStoreLite = {
    state: function () { return st; },
    active: active, forSale: forSale, anySale: anySale, anyActive: anyActive, visible: visible, remaining: remaining,
    now: now, get: get, buy: buy, on: on, off: off, open: openStore, takePending: takePending,
  };
  window.mdStoreOpen = openStore;
})();
