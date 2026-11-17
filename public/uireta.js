/*
 * Uireta.1.0 — واجهة اللوجين البديلة
 * بتتحمّل بس لو "تفعيل اصدار Uireta.1.0" شغّال من لوحة التحكم > الإضافات.
 * بتشتغل فوق نفس دوال الشات (Login_ / lstat / GET_LOGIN_ONLINE) من غير ما نغيّر x2.js.
 *
 * رابط زر "اشتراك VIP": حط الرابط بين الـ ' ' وهيتفتح في تبويب جديد
 * (ممكن "https://..." أو "tel:+20..." أو "mailto:...") — لو سيبته فاضي بتظهر رسالة للزائر.
 */
window.UIRETA_LINKS = window.UIRETA_LINKS || {
  vip: ''
};

(function () {
  'use strict';

  var TAB = 'visitor';
  var POLL_MS = 5000;
  var DEFAULT_GUEST = 'عابر_سبيل';
  var NAMES = ['عابر', 'صقر', 'نجم', 'فارس', 'أمير', 'غريب', 'حالم', 'قمر', 'سلطان', 'ملاك', 'وردة', 'ريم', 'ليث', 'نسمة', 'شهم', 'سراب'];
  var lastFp = '';
  var timer = 0;

  function $el(id) { return document.getElementById(id); }
  function hasUI() { return !!$el('uiMembers') && !!$el('tlogins'); }

  /* ---------- التابات ---------- */
  var CFG = {
    visitor:  { groups: ['uiGroupVisitor'],                            txt: 'دخول سريع',      ico: 'arrow-right-to-bracket', vip: false },
    member:   { groups: ['uiGroupUser', 'uiGroupPass'],                txt: 'تسجيل الدخول',  ico: 'arrow-right-to-bracket', vip: false },
    register: { groups: ['uiGroupUser', 'uiGroupPass', 'uiGroupConfirm'], txt: 'إنشاء حساب', ico: 'user-plus',             vip: false },
    vip:      { groups: [],                                            txt: 'اشتراك VIP',     ico: 'crown',                  vip: true  }
  };
  var ALL_GROUPS = ['uiGroupVisitor', 'uiGroupUser', 'uiGroupPass', 'uiGroupConfirm'];
  var TAB_IDS = { visitor: 'uiTabVisitor', member: 'uiTabMember', register: 'uiTabRegister', vip: 'uiTabVip' };
  var ICON_W = { 'arrow-right-to-bracket': 1, 'user-plus': 1.25, 'crown': 1.25 };

  window.uiretaTab = function (t) {
    if (!CFG[t]) t = 'visitor';
    TAB = t;
    var c = CFG[t];
    Object.keys(TAB_IDS).forEach(function (k) {
      var e = $el(TAB_IDS[k]);
      if (e) e.classList.toggle('active', k === t);
    });
    ALL_GROUPS.forEach(function (g) {
      var e = $el(g);
      if (e) e.classList.toggle('hidden', c.groups.indexOf(g) === -1);
    });
    var vf = $el('uiVipFeatures');
    if (vf) vf.classList.toggle('hidden', !c.vip);
    var b = $el('uiSubmitBtn');
    if (b) b.classList.toggle('vip-btn', c.vip);
    var tx = $el('uiSubmitTxt');
    if (tx) tx.textContent = c.txt;
    var ic = $el('uiSubmitIco');
    if (ic) ic.innerHTML = '<svg class="ui-i" style="width:' + (ICON_W[c.ico] || 1) + 'em" aria-hidden="true"><use href="#ui-i-' + c.ico + '"/></svg>';
    setStat('', '');
  };

  window.uiretaScrollToAuth = function () {
    var e = $el('uiAuthSection');
    if (e && e.scrollIntoView) e.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  window.uiretaTogglePass = function (id, btn) {
    var inp = $el(id);
    if (!inp) return;
    var show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    if (btn) btn.innerHTML = '<svg class="ui-i" style="width:' + (show ? 1.25 : 1.125) + 'em" aria-hidden="true"><use href="#ui-i-' + (show ? 'eye-slash' : 'eye') + '"/></svg>';
  };

  window.uiretaRandomName = function () {
    var n = NAMES[Math.floor(Math.random() * NAMES.length)] + '_' + (100 + Math.floor(Math.random() * 900));
    var i = $el('u1');
    if (i) i.value = n;
  };

  /* ---------- رسائل الحالة ---------- */
  function setStat(kind, msg) {
    var e = document.querySelector('#tlogins .ui-stat');
    if (!e) return;
    if (typeof window.lstat === 'function' && kind) { window.lstat(kind, msg); return; }
    e.textContent = msg || '';
    e.classList.toggle('ui-stat-blank', !(msg || '').trim());
  }

  /* lstat بتكتب في .loginstat — نخفي السطر لو النص فاضي */
  function wrapLstat() {
    if (typeof window.lstat !== 'function' || window.lstat.__ui) return;
    var orig = window.lstat;
    var w = function () {
      var r = orig.apply(this, arguments);
      try {
        var e = document.querySelector('#tlogins .ui-stat');
        if (e) e.classList.toggle('ui-stat-blank', !(e.textContent || '').trim());
      } catch (x) { }
      return r;
    };
    w.__ui = true;
    window.lstat = w;
  }

  /* ---------- الدخول ---------- */
  function val(id) { var e = $el(id); return e ? e.value : ''; }
  function setVal(id, v) { var e = $el(id); if (e) e.value = v; }

  window.uiretaSubmit = function (ev) {
    if (ev && ev.preventDefault) ev.preventDefault();
    if (typeof window.Login_ !== 'function') { setStat('danger', 'الشات لسه بيتحمّل .. جرّب تاني'); return false; }

    if (TAB === 'visitor') {
      if (!val('u1').trim()) { setStat('warning', 'اكتب الاسم المستعار'); return false; }
      window.Login_(1);
    } else if (TAB === 'member') {
      if (!val('uiUser').trim() || !val('uiPass')) { setStat('warning', 'اكتب اسم المستخدم وكلمة المرور'); return false; }
      setVal('u2', val('uiUser'));
      setVal('pass1', val('uiPass'));
      window.Login_(2);
    } else if (TAB === 'register') {
      if (!val('uiUser').trim() || !val('uiPass')) { setStat('warning', 'اكتب اسم المستخدم وكلمة المرور'); return false; }
      if (val('uiPass') !== val('uiConfirm')) { setStat('warning', 'كلمتا المرور غير متطابقتين'); return false; }
      setVal('u3', val('uiUser'));
      setVal('pass2', val('uiPass'));
      window.Login_(3);
    } else if (TAB === 'vip') {
      var u = (window.UIRETA_LINKS || {}).vip;
      if (!u) { setStat('info', 'للاشتراك VIP تواصل مع إدارة الشات'); return false; }
      if (/^(tel:|mailto:|sms:)/i.test(u)) { location.href = u; return false; }
      window.open(u, '_blank', 'noopener');
    }
    return false;
  };

  /* ---------- قايمة المتصلين ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function rankOf(powers, name) {
    if (!powers || !name) return 0;
    for (var i = 0; i < powers.length; i++) {
      if (powers[i] && powers[i].name == name) return powers[i].rank | 0;
    }
    return 0;
  }

  function picUrl(p) {
    p = p || '';
    try { if (typeof window.removegifpic === 'function' && p) return window.removegifpic(p); } catch (e) { }
    return p;
  }

  function cardHtml(u, powers) {
    /* [UIRETA-BADGES] مفيش مسميات تلقائية بالرتبة — الشارة بتيجي من السيرفر (u.bdg) لو اتدّت للعضو من لوحة التحكم */
    var cls = 'member-card', frame = 'member-avatar-wrapper', badge = '';
    var b = u.bdg;
    if (b && b.t) {
      var bt = esc(b.t);
      if (b.k === 'admin') {
        frame += ' admin-frame';
        badge = '<span class="badge-tag badge-admin">' + bt + '</span>';
      } else if (b.k === 'mod') {
        badge = '<span class="badge-tag badge-mod">' + bt + '</span>';
      } else {
        cls += ' vip-card';
        badge = '<span class="badge-tag badge-vip">' + bt + '</span>';
      }
    }
    var msg = String(u.msg || '').replace(/<[^>]*>/g, '').trim();
    var atar = u.ifedit ? String(u.atar || '').replace(/[\"'\\()\r\n]/g, '').trim() : '';
    var fr = '';
    if (atar) {
      frame += ' has-atar';
      fr = '<span class="ui-atar" style="background-image:url(&quot;' + esc(atar) + '&quot;)"></span>';
    }
    return '<div class="' + cls + '"><div class="member-info">' +
      '<div class="' + frame + '"><img class="member-avatar" loading="lazy" alt="" src="' + esc(picUrl(u.pic)) + '" onerror="this.style.visibility=\'hidden\'">' + fr +
      '<span class="status-dot-green"></span></div>' +
      '<div class="member-details"><h4><span class="ui-nm">' + esc(u.topic) + '</span></h4>' +
      '<p><span class="status-text-online">متصل الآن</span>' + (msg ? '<span class="ui-mg">• ' + esc(msg) + '</span>' : '') + '</p></div>' +
      '</div>' + badge + '</div>';
  }

  function render(d) {
    var box = $el('uiMembers');
    if (!box || !d) return;
    var on = d.online || [];
    var cnt = d.count != null ? d.count : on.length;
    var c = $el('uiOnlineCount');
    if (c) c.textContent = cnt;

    var parts = new Array(on.length);
    for (var k = 0; k < on.length; k++) parts[k] = (on[k].topic || '') + '~' + (on[k].pic || '') + '~' + (on[k].power || '') + '~' + (on[k].msg || '') + '~' + (on[k].ifedit ? on[k].atar || '' : '') + '~' + (on[k].bdg ? on[k].bdg.t : '');
    var fp = cnt + '|' + parts.join(';');
    if (fp === lastFp) return;          /* مفيش تغيير — ما نلمسش الـ DOM */
    lastFp = fp;

    if (!on.length) { box.innerHTML = '<div class="ui-empty">لا يوجد متصلين حالياً</div>'; return; }
    var html = [];
    for (var i = 0; i < on.length; i++) {
      if (on[i].s == true) continue;
      try { html.push(cardHtml(on[i], d.powers)); } catch (e) { }
    }
    box.innerHTML = html.join('');
  }

  function poll() {
    if (!hasUI()) { clearInterval(timer); return; }   /* بعد الدخول #tlogins بيتشال */
    if (document.hidden) return;
    var x = new XMLHttpRequest();
    x.open('GET', 'GET_LOGIN_ONLINE', true);
    x.onload = function () {
      if (x.status !== 200) return;
      try { render(JSON.parse(x.responseText)); } catch (e) { }
    };
    x.send();
  }


  /* ---------- قايمة المتصلين جوه الشات (نفس شكل اللوجين) ----------
     الشكل نفسه في uireta.css تحت body.uireta-on. هنا بس:
       1) الكود الأصلي (الغلاف/الإطار) بيكتب مقاسات inline بـ !important على الصورة والإطار والنقطة — بنشيلها بعد كل updateu
       2) كلاس الرتبة (مدير/مشرف/VIP) على الكارت عشان البادج والإطار
       3) غلاف العضو بيتنقل لمتغيّر --uc (الخلفية بتتعمل على ::before عشان المسافة بين الكروت) */
  var UQ_STRIP = ['width', 'height', 'min-width', 'min-height', 'max-width', 'max-height', 'margin', 'margin-top', 'margin-left', 'margin-right', 'margin-bottom', 'padding', 'border', 'border-radius', 'background-size', 'background-repeat', 'transform', 'position', 'right', 'left', 'top', 'bottom'];

  function skinRow(row, u) {
    if (!row || !row.querySelectorAll) return;
    var els = row.querySelectorAll('.u-pic,.imgbaqer,.ustat,.u-msg');
    for (var i = 0; i < els.length; i++) {
      var st = els[i].style;
      if (!st || !st.length) continue;
      for (var k = 0; k < UQ_STRIP.length; k++) st.removeProperty(UQ_STRIP[k]);
    }
    var back = u && u.ifedit && u.back ? String(u.back).replace(/[\u0022\u005c\r\n]/g, '') : '';
    if (back.replace(/\s/g, '')) row.style.setProperty('--uc', 'url("' + back + '")');
    else row.style.removeProperty('--uc');

    var rk = 0;
    try { rk = u && typeof window.getpower === 'function' ? (window.getpower(u.power).rank | 0) : 0; } catch (e) { }
    var hasFr = !!(u && u.ifedit && String(u.atar == null ? '' : u.atar).trim());
    row.classList.toggle('uq-fr', hasFr);
    var fe = row.querySelector('.imgbaqer');
    if (fe && hasFr) {
      fe.style.removeProperty('display');
      fe.style.setProperty('background-image', 'url("' + String(u.atar).replace(/[\u0022\u005c\r\n]/g, '') + '")');
    }
    /* [UIRETA-BADGES] الكلاسات والبادج بقت بتتحدد من الشارة الممنوحة (مش من الرتبة) */
    var bd = bdgFor(u);
    row.classList.toggle('uq-admin', !!bd && bd.k === 'admin');
    row.classList.toggle('uq-mod', !!bd && bd.k === 'mod');
    row.classList.toggle('uq-vip', !!bd && (bd.k === 'vip' || bd.k === 'custom'));
    stampBadge(row, bd);
  }

  /* ---------- شارات Uireta (من لوحة التحكم: مسمى + مدة بالأيام) ---------- */
  var BDG = {};
  function bdgFor(u) {
    if (!u || !u.ifedit || !u.idreg) return null;
    var b = BDG[u.idreg];
    return b && b.e > Date.now() ? b : null;
  }
  function stampBadge(row, b) {
    var d3 = row.querySelector('.di3');
    if (!d3) return;
    var el = d3.querySelector('.uq-bt');
    if (!b) { if (el) el.parentNode.removeChild(el); return; }
    if (!el) { el = document.createElement('span'); d3.appendChild(el); }
    var cls = 'uq-bt uq-bt-' + b.k;
    if (el.className !== cls) el.className = cls;
    if (el.textContent !== b.t) el.textContent = b.t;
  }
  function reskinAll() {
    var rows = document.querySelectorAll('#users .uhtml');
    for (var i = 0; i < rows.length; i++) {
      var u = window.U_CASH && window.U_CASH[rows[i].__uid];
      if (u) { try { skinRow(rows[i], u); } catch (e) { } }
    }
  }
  function setBadges(m) {
    BDG = m && typeof m === 'object' ? m : {};
    reskinAll();
  }
  function fetchBadges() {
    try {
      var x = new XMLHttpRequest();
      x.open('GET', '/UQ_BADGES', true);
      x.onload = function () { if (x.status === 200) { try { setBadges(JSON.parse(x.responseText)); } catch (e) { } } };
      x.send();
    } catch (e) { }
  }
  (function hookBadges() {
    var tries = 0;
    fetchBadges();
    setInterval(fetchBadges, 300000);          /* احتياطي: كل 5 دقايق */
    (function wait() {
      if (window.socket && typeof window.socket.on === 'function') { window.socket.on('UQ_BADGES', setBadges); return; }
      if (tries++ < 150) setTimeout(wait, 200);
    })();
  })();
  window.uiretaSkinRow = skinRow;

  function wrapUpdateu() {
    var tries = 0;
    (function wait() {
      var orig = window.updateu;
      if (typeof orig === 'function' && !orig.__uq) {
        var w = function (id, uu) {
          var r = orig.apply(this, arguments);
          try {
            var j = window.VLIST && window.VLIST.rowOf && window.VLIST.rowOf(id);
            skinRow(j && j[0], uu || (window.U_CASH && window.U_CASH[id]));
          } catch (e) { }
          return r;
        };
        w.__uq = true;
        window.updateu = w;
      } else if (!orig && tries++ < 200) {
        setTimeout(wait, 100);
      }
    })();
  }

  /* الكلاس ده هو اللي بيفعّل شكل Uireta في قايمة المتصلين (جوه الشات) — بيتحط بس لما Uireta شغّال */
  function markOn() {
    if (document.body) document.body.classList.add('uireta-on');
    else document.addEventListener('DOMContentLoaded', markOn);
  }
  markOn();
  wrapUpdateu();

  /* ---------- تشغيل ---------- */
  function init() {
    if (!hasUI()) return;
    wrapLstat();

    /* x2.js بيرجّع القيم المحفوظة للحقول الأصلية — نظبطها على الحقول الظاهرة */
    var g = val('u1');
    if (!g || g === 'null' || g === 'undefined') setVal('u1', DEFAULT_GUEST);
    var su = val('u2'), sp = val('pass1');
    if (su && su !== 'null' && su !== 'undefined') setVal('uiUser', su);
    if (sp && sp !== 'null' && sp !== 'undefined') setVal('uiPass', sp);
    var savedMember = false;
    try { savedMember = (window.getv && window.getv('isl') === 'yes'); } catch (e) { }
    window.uiretaTab(savedMember ? 'member' : 'visitor');

    poll();
    timer = setInterval(poll, POLL_MS);
  }

  function boot() {
    /* نستنى x2.js يخلّص تجهيزه (هو اللي بيعرّف Login_ و lstat) */
    var tries = 0;
    (function wait() {
      if (typeof window.Login_ === 'function' && window.jQuery) {
        window.jQuery(function () { setTimeout(init, 0); });
      } else if (tries++ < 100) {
        setTimeout(wait, 50);
      } else {
        init();
      }
    })();
  }

  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
