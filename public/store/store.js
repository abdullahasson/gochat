/* =====================================================================================
   [ADDED - FEATURE STORE] public/store/store.js — واجهة تبويب "المتجر" في إعدادات المستخدم (موديول كسول 'store').
   بيتحمّل أول فتح لتبويب المتجر بس (settings-v2.js → LazyModules.load('store')) ومبيتحمّلش مع دخول الشات.
   - window.mdStore.mount(host) بيبني الواجهة جوه #stpStoreHost: بطاقة الرصيد + كروت المنتجات (معاينة / شراء / تجديد / استخدام).
   - نافذة الشراء (#stSheet) فيها ٣ اختيارات مدة (٧ / ١٥ / ٣٠ يوم) بأسعار الأدمن، وملخص الرصيد، وتأكيد.
   - window.mdStore.unmount() بيفكّك كل حاجة (DOM + listeners + مؤقتات + اشتراك الأحداث) أول ما العضو يسيب التبويب أو يقفل الإعدادات.
   - المعاينة = openMemberDesignStudio(feat, { preview: true }) (الاستوديو بيفتح من غير رفع ولا حفظ).
   الحالة والاشتراكات من mdStoreLite (store/store-lite.js). السيرفر هو اللي بيفرض الأسعار والخصم والصلاحية.
   ===================================================================================== */
(function () {
  'use strict';
  var $ = window.jQuery;
  if (!$ || window.mdStore) return;

  /* نفس أيقونات ووصف كروت إعدادات > المميزات */
  var UI = {
    pbg: { i: 'fa-picture-o', d: 'صورة ولون خلف البروفايل' },
    welcome: { i: 'fa-hand-paper-o', d: 'رسالة تنزل لأي حد يفتح بروفايلك' },
    music: { i: 'fa-music', d: 'أغنية تتشغل لزوار بروفايلك' },
    visit: { i: 'fa-eye', d: 'تفعيل / إيقاف تنبيه الزوار' },
    yt: { i: 'fa-youtube-play', d: 'أيقونة يوتيوب في بروفايلك' },
    social: { i: 'fa-link', d: 'تيليجرام وفيس بوك وواتساب' },
    frames: { i: 'fa-dot-circle-o', d: 'إطار متحرك حوالين صورتك' },
    cards: { i: 'fa-id-card-o', d: 'لون وخلفية كارتك في المتصلين' },
    namebg: { i: 'fa-tint', d: 'لون أو تدرج خلف اسمك' },
    nameshine: { i: 'fa-star', d: 'تدرج ألوان مع لمعة' },
    glitter: { i: 'fa-magic', d: 'لمعات متحركة جوه حروف اسمك' }
  };
  var DAY_MS = 86400000, HOUR_MS = 3600000;
  var M = null;   /* جلسة التبويب المفتوح؛ null = مقفول ومفيش أي حاجة في الذاكرة */

  function L() { return window.mdStoreLite; }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(n) { n = Math.round(Number(n) || 0); try { return n.toLocaleString('en-US'); } catch (e) { return String(n); } }
  function ui(k) { return UI[k] || { i: 'fa-star', d: '' }; }
  function dayLbl(d) { return d === 7 ? '7 أيام' : d + ' يوم'; }
  function notify(msg) { if (typeof SendNotification === 'function') SendNotification({ state: 'me', topic: '', force: 1, msg: msg, user: '' }); }
  function leftTxt(ms) {
    var d = Math.floor(ms / DAY_MS), h = Math.floor((ms % DAY_MS) / HOUR_MS);
    if (d >= 1) return 'باقي ' + d + ' يوم' + (d < 3 && h ? ' و' + h + ' ساعة' : '');
    if (h >= 1) return 'باقي ' + h + ' ساعة';
    return 'باقي أقل من ساعة';
  }
  function days() { var s = L() && L().state(); return (s && s.days) || [7, 15, 30]; }
  function rowOf(k) { var s = L().state(); return (s && s.prices && s.prices[k]) || [0, 0, 0]; }
  function titleOf(k) {
    var s = L().state(), f = (s && s.feats) || [];
    for (var i = 0; i < f.length; i++) if (f[i].k === k) return f[i].t;
    return k;
  }
  function minPrice(k) {
    var r = rowOf(k), m = 0;
    for (var i = 0; i < r.length; i++) if (r[i] > 0 && (!m || r[i] < m)) m = r[i];
    return m;
  }
  /* مفتوحة بالرتبة (أو التفعيل من الإدارة) وليست بالشراء */
  function included(k) { var fa = window.featAccess; return !L().active(k) && !!(fa && fa.ok(k)); }

  /* ============================== الرسم ============================== */
  function skeleton() {
    return '<div class="st2-sk t"></div><div class="st2-grid"><div class="st2-sk"></div><div class="st2-sk"></div><div class="st2-sk"></div><div class="st2-sk"></div></div>';
  }
  function balHtml(pts) {
    return '<div class="st2-bal"><div class="st2-bal-t"><span>رصيدك الحالي</span><b id="st2Pts">' + fmt(pts) + '</b><small>نقطة</small></div><span class="st2-coin">🪙</span></div>';
  }
  function cardHtml(f) {
    var k = f.k, u = ui(k), lite = L(), act = lite.active(k), inc = !act && included(k), mp = minPrice(k);
    var chip = act ? '<span class="st2-chip on" data-chip="' + esc(k) + '">' + esc(leftTxt(lite.remaining(k))) + '</span>'
      : inc ? '<span class="st2-chip rk">متاحة لرتبتك</span>'
      : '<span class="st2-chip"><i class="fa fa-lock"></i></span>';
    var from = (act || inc) ? '' : '<div class="st2-from">ابتداءً من <em>' + fmt(mp) + '</em> نقطة</div>';
    var btns = inc ? '<button type="button" class="st2-btn" data-act="use" data-k="' + esc(k) + '">استخدام</button>'
      : act ? '<button type="button" class="st2-btn ghost" data-act="use" data-k="' + esc(k) + '">استخدام</button><button type="button" class="st2-btn" data-act="buy" data-k="' + esc(k) + '">تجديد</button>'
      : '<button type="button" class="st2-btn ghost" data-act="pv" data-k="' + esc(k) + '">معاينة</button><button type="button" class="st2-btn" data-act="buy" data-k="' + esc(k) + '">شراء</button>';
    return '<div class="st2-pc' + (act ? ' on' : '') + '" data-k="' + esc(k) + '"><div class="st2-pc-top"><span class="sp2-ico"><i class="fa ' + u.i + '"></i></span>' + chip + '</div>' +
      '<b>' + esc(f.t) + '</b><small>' + esc(u.d) + '</small>' + from + '<div class="st2-btns">' + btns + '</div></div>';
  }
  function render() {
    if (!M) return;
    var lite = L(), s = lite.state();
    if (!s) {
      M.host.innerHTML = '<div class="st2-note">تعذّر تحميل المتجر.<br><button type="button" class="st2-btn" data-act="retry">إعادة المحاولة</button></div>';
      return;
    }
    if (!s.reg) { M.host.innerHTML = '<div class="st2-note">المتجر متاح للأعضاء المسجلين فقط.</div>'; return; }
    var list = (s.feats || []).filter(function (f) { return lite.forSale(f.k) || lite.active(f.k); });
    if (!list.length) { M.host.innerHTML = balHtml(s.points) + '<div class="st2-note">لا توجد ميزات معروضة للبيع حاليًا.</div>'; return; }
    M.host.innerHTML = balHtml(s.points) + '<div class="st2-sec">مميزات الاستوديو</div><div class="st2-grid">' + list.map(cardHtml).join('') + '</div>';
  }
  function paintChips() {
    if (!M || !M.host.offsetParent) return;                  /* الإعدادات مقفولة: مفيش داعي نرسم */
    var lite = L(), chips = M.host.querySelectorAll('[data-chip]');
    for (var i = 0; i < chips.length; i++) {
      var k = chips[i].getAttribute('data-chip');
      if (!lite.active(k)) { render(); return; }            /* اشتراك خلص وإحنا فاتحين التبويب: نعيد الرسم */
      chips[i].textContent = leftTxt(lite.remaining(k));
    }
  }

  /* ============================== نافذة الشراء ============================== */
  function sheetEl() { return document.getElementById('stSheet'); }
  function closeSheet() {
    var e = sheetEl(); if (e && e.parentNode) e.parentNode.removeChild(e);
    if (M) { M.sel = null; M.busy = 0; clearTimeout(M.busyT); }
  }
  function optsHtml(k) {
    var r = rowOf(k), ds = days(), sel = M.sel, pts = L().state().points, h = '';
    ds.forEach(function (d, i) {
      var p = r[i] || 0;
      if (!(p > 0)) return;
      var per = p / d, perTxt = per >= 10 ? Math.round(per) : (Math.round(per * 10) / 10);
      h += '<button type="button" class="st2-opt' + (sel.i === i ? ' sel' : '') + '" data-i="' + i + '"><span class="st2-radio"></span>' +
        '<span class="st2-opt-t"><b>' + dayLbl(d) + '</b><small>≈ ' + perTxt + ' نقطة / يوم</small></span><span class="st2-opt-p">' + fmt(p) + ' 🪙</span></button>';
    });
    return h;
  }
  function sumHtml(k) {
    var p = rowOf(k)[M.sel.i] || 0, pts = L().state().points, left = pts - p;
    return '<div><span>رصيدك الآن</span><b>' + fmt(pts) + '</b></div><div><span>سعر المدة</span><b>' + fmt(p) + '</b></div>' +
      (left >= 0 ? '<div><span>رصيدك بعد الشراء</span><b>' + fmt(left) + '</b></div>' : '<div><span class="bad">ينقصك</span><b class="bad">' + fmt(-left) + ' نقطة</b></div>');
  }
  function sheetBody(k) {
    var u = ui(k), act = L().active(k);
    return '<div class="st2-sh" role="dialog" aria-modal="true"><div class="st2-sh-h"><span class="sp2-ico"><i class="fa ' + u.i + '"></i></span>' +
      '<div class="st2-sh-t"><b>' + esc(titleOf(k)) + '</b><span>' + (act ? 'التجديد بيضيف المدة على اشتراكك الحالي' : esc(u.d)) + '</span></div>' +
      '<button type="button" class="st2-x" data-sh="close" aria-label="إغلاق"><i class="fa fa-times"></i></button></div>' +
      '<div class="st2-hint"><i class="fa fa-info-circle"></i> عند انتهاء المدة يُحذف تصميم الميزة من حسابك تلقائيًا.</div>' +
      '<div class="st2-opts" id="st2Opts">' + optsHtml(k) + '</div><div class="st2-sum" id="st2Sum">' + sumHtml(k) + '</div><div id="st2Err"></div>' +
      '<div class="st2-row"><button type="button" class="st2-btn" id="st2Go" data-sh="go"><i class="fa fa-shopping-bag"></i>' + (act ? 'تأكيد التجديد' : 'تأكيد الشراء') + '</button>' +
      '<button type="button" class="st2-btn ghost" data-sh="close">إلغاء</button></div></div>';
  }
  function paintSheet() {
    if (!M || !M.sel || !sheetEl()) return;
    var k = M.sel.k, o = document.getElementById('st2Opts'), s = document.getElementById('st2Sum'), go = document.getElementById('st2Go');
    if (o) o.innerHTML = optsHtml(k);
    if (s) s.innerHTML = sumHtml(k);
    if (go) go.disabled = !!M.busy || (L().state().points < (rowOf(k)[M.sel.i] || 0));
  }
  function openSheet(k) {
    if (!M) return;
    var lite = L(), s = lite.state();
    if (!s || !s.reg) return;
    if (included(k)) { notify('هذه الميزة متاحة لرتبتك بالفعل'); return; }
    var r = rowOf(k), first = -1;
    for (var i = 0; i < r.length; i++) if (r[i] > 0) { first = i; break; }
    if (first < 0) { notify('هذه الميزة غير معروضة للبيع حاليًا'); return; }
    closeSheet();
    M.sel = { k: k, i: first }; M.busy = 0;
    var d = document.createElement('div');
    d.id = 'stSheet'; d.innerHTML = sheetBody(k);
    document.body.appendChild(d);
    paintSheet();
  }
  function goBuy() {
    if (!M || !M.sel || M.busy) return;
    var k = M.sel.k, d = days()[M.sel.i], p = rowOf(k)[M.sel.i] || 0;
    if (L().state().points < p) { paintSheet(); return; }
    M.busy = 1; paintSheet();
    var go = document.getElementById('st2Go'); if (go) go.textContent = 'جاري الشراء...';
    var err = document.getElementById('st2Err'); if (err) err.innerHTML = '';
    if (!L().buy(k, d)) { M.busy = 0; showErr('تعذّر الاتصال بالسيرفر، حاول مرة أخرى'); return; }
    var mine = M;
    clearTimeout(M.busyT);
    M.busyT = setTimeout(function () { if (M === mine && M.busy) { M.busy = 0; showErr('لم يصل رد من السيرفر، تأكد من الاتصال ثم حاول مرة أخرى'); } }, 12000);
  }
  function showErr(msg) {
    var err = document.getElementById('st2Err'), go = document.getElementById('st2Go');
    if (err) err.innerHTML = '<div class="st2-err">' + esc(msg) + '</div>';
    if (go) go.innerHTML = '<i class="fa fa-shopping-bag"></i>' + (M && M.sel && L().active(M.sel.k) ? 'تأكيد التجديد' : 'تأكيد الشراء');
    paintSheet();
  }
  function showDone(d) {
    var el = sheetEl(); if (!el) return;
    var k = d.feat, left = d.expires - L().now();
    el.innerHTML = '<div class="st2-sh" role="dialog" aria-modal="true"><div class="st2-ok"><i class="fa fa-check"></i><b>تم تفعيل «' + esc(titleOf(k)) + '»</b>' +
      '<span>' + esc(leftTxt(left)) + ' · رصيدك الآن ' + fmt(d.points) + ' نقطة</span></div>' +
      '<div class="st2-row"><button type="button" class="st2-btn" data-sh="use" data-k="' + esc(k) + '">فتح الميزة</button><button type="button" class="st2-btn ghost" data-sh="close">تم</button></div></div>';
  }

  /* ============================== الأحداث ============================== */
  function onUpdate(d) {
    if (!M) return;
    if (d && d.op === 'buy' && M.sel && M.busy) {
      M.busy = 0; clearTimeout(M.busyT);
      if (d.ok) { render(); showDone(d); return; }
      render(); showErr(d.msg || 'تعذّر إتمام الشراء'); return;
    }
    if (d && d.op === 'buy' && d.ok) notify(d.msg || 'تم الشراء');
    render();
    if (M.sel) paintSheet();
  }
  function useFeature(k) {
    closeSheet();
    if (typeof window.openMemberDesignStudio === 'function') window.openMemberDesignStudio(k);
  }
  function bind() {
    var $h = $(M.host);
    $h.on('click.st2', '[data-act]', function () {
      var a = this.getAttribute('data-act'), k = this.getAttribute('data-k');
      if (a === 'retry') { M.host.innerHTML = skeleton(); L().get(true, function () { render(); }); return; }
      if (!k) return;
      if (a === 'pv') { if (typeof window.openMemberDesignStudio === 'function') window.openMemberDesignStudio(k, { preview: true }); }
      else if (a === 'buy') openSheet(k);
      else if (a === 'use') useFeature(k);
    });
    $(document).on('click.st2', '#stSheet', function (e) {
      var t = e.target;
      if (t.id === 'stSheet') { closeSheet(); return; }
      var b = t.closest ? t.closest('[data-sh],.st2-opt') : null;
      if (!b || !M) return;
      if (b.classList.contains('st2-opt')) { M.sel.i = parseInt(b.getAttribute('data-i'), 10) || 0; paintSheet(); return; }
      var a = b.getAttribute('data-sh');
      if (a === 'close') closeSheet();
      else if (a === 'go') goBuy();
      else if (a === 'use') useFeature(b.getAttribute('data-k'));
    });
    M.onKey = function (e) { if (e.keyCode === 27 && M && sheetEl()) { e.stopImmediatePropagation(); e.preventDefault(); closeSheet(); } };
    document.addEventListener('keydown', M.onKey, true);
  }

  /* ============================== تركيب / تفكيك ============================== */
  function mount(host) {
    if (!host || !L()) return;
    if (M) unmount();
    M = { host: host, sel: null, busy: 0, busyT: 0, timer: 0, onKey: null, onUpd: null };
    host.innerHTML = skeleton();
    bind();
    /* قفل نافذة الإعدادات (زرار / ESC / ضغطة برا) بيفكّك المتجر من الـDOM بالكامل */
    var oc = window.closeSettingsPopup;
    if (typeof oc === 'function' && !oc.__st) {
      var wrap = function () { try { unmount(); } catch (e) {} return oc.apply(this, arguments); };
      wrap.__st = oc;
      M.wrapClose = wrap;
      window.closeSettingsPopup = wrap;
    }
    M.onUpd = onUpdate;
    L().on(M.onUpd);
    M.timer = setInterval(paintChips, 60000);
    var mine = M;
    L().get(true, function () {
      if (M !== mine) return;
      render();
      var p = L().takePending();
      if (p && L().state() && L().state().reg) openSheet(p);
    });
  }
  function unmount() {
    if (!M) return;
    var m = M; M = null;
    clearInterval(m.timer); clearTimeout(m.busyT);
    if (m.onUpd && L()) L().off(m.onUpd);
    document.removeEventListener('keydown', m.onKey, true);
    $(document).off('click.st2');
    $(m.host).off('.st2');
    var e = sheetEl(); if (e && e.parentNode) e.parentNode.removeChild(e);
    m.host.textContent = '';
    if (m.wrapClose && window.closeSettingsPopup === m.wrapClose) window.closeSettingsPopup = m.wrapClose.__st;
  }

  window.mdStore = { mount: mount, unmount: unmount };
  /* للفحص الحي من الكونسول: __mdStoreState() → null لو مقفول */
  window.__mdStoreState = function () { return M ? { sheet: !!sheetEl(), busy: M.busy, nodes: M.host.getElementsByTagName('*').length } : null; };
})();
