/* زر (+) بجانب زر الإرسال في الغرفة العامة — يفتح قائمة فيها أيقونة إرسال صورة/فيديو وأيقونة الملصقات */
(function () {
  if (window.__plusMenuLoaded) return;
  window.__plusMenuLoaded = true;

  /* قائمة الملصقات (الملفات الموجودة في public/stickers) — النافذة بتعرض نسخ مصغرة متحركة وخفيفة من public/stickers/thumbs عشان تفتح بسرعة */
  var STICKERS = [
    '01.webp','02.webp','03.webp','04.webp','05.webp','06.webp','07.webp','08.gif','09.webp','10.webp',
    '11.webp','12.webp','13.gif','14.webp','15.webp','16.webp','17.gif','18.gif','19.gif','20.gif',
    '24.webp','25.webp','26.gif','27.webp','28.gif','29.webp','30.webp','31.webp'
  ];

  var css =
    '#plusmenu{position:fixed;z-index:99999;display:none;gap:6px;padding:6px 8px;border-radius:12px;' +
    'background:#fff;border:1px solid #d3d3d3;box-shadow:0 2px 12px rgba(0,0,0,.3);}' +
    '#plusmenu button{margin:0;padding:2px;display:block;background:none!important;border:0!important;box-shadow:none!important;cursor:pointer;line-height:0;}' +
    '#plusmenu button svg{width:34px;height:34px;display:block;}' +
    '#tbox{flex:1 1 auto!important;min-width:0!important;}' +
    /* نافذة الملصقات */
    '#stkov{position:fixed;inset:0;z-index:100000;display:none;background:transparent;direction:rtl}' +
    '#stkov.on{display:flex}' +
    '#stkov *{box-sizing:border-box}' +
    '#stkov .sb{position:fixed;width:310px;max-width:calc(100% - 16px);max-height:44vh;min-height:220px;display:flex;flex-direction:column;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 4px 22px rgba(0,0,0,.4);border:1px solid #d3d3d3}' +
    '#stkov .sh{display:flex;align-items:center;justify-content:space-between;padding:8px 14px;border-bottom:1px solid #e6e6e6;color:#333}' +
    '#stkov .sh b{font-size:15px;font-weight:700}' +
    '#stkov .sx{width:28px;height:28px;border:0;background:none;color:#333;font-size:26px;line-height:26px;cursor:pointer;padding:0}' +
    '#stkov .sg{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:8px;flex:1 1 auto;min-height:0;align-content:start;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}' +
    '#stkov .si{position:relative;display:block;width:100%;height:0;padding:0 0 100% 0;border:1px solid #e3e3e3;border-radius:10px;background:#fafafa;cursor:pointer;overflow:hidden;-webkit-tap-highlight-color:transparent}' +
    '#stkov .si:active{transform:scale(.94)}' +
    '#stkov .si img{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:contain;padding:3px}' +
    /* الملصق داخل الرسالة */
    '.stkmsg{display:block;max-width:120px;max-height:120px;margin-top:2px}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  /* وجهة الإرسال: null = الغرفة العامة، أو دالة (link) من أي واجهة تانية زي ريشة المبدعين */
  var target = null;
  function deliver(link) { if (target) target(link); else emitRoomLink(link); }

  var menu = document.createElement('div');
  menu.id = 'plusmenu';
  menu.innerHTML =
    /* أيقونة الصور والفيديو */
    '<button type="button" id="plusimg" title="إرسال صورة أو فيديو">' +
    '<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">' +
    '<rect x="2.5" y="5.5" width="27" height="21" rx="4" fill="none" stroke="#3b82f6" stroke-width="2.4"/>' +
    '<circle cx="22" cy="12" r="3" fill="#fbbf24"/>' +
    '<path d="M4.5 24l7.5-9 5.5 6.5 3.5-4 6.5 6.5z" fill="#22c55e"/>' +
    '<path d="M12 15l5.5 6.5H6.5z" fill="#16a34a"/>' +
    '</svg></button>' +
    /* أيقونة الملصقات (وجه مبتسم) */
    '<button type="button" id="plusstk" title="إرسال ملصق">' +
    '<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">' +
    '<circle cx="16" cy="16" r="12.5" fill="none" stroke="#12b8d4" stroke-width="2.6"/>' +
    '<circle cx="11.5" cy="13" r="1.9" fill="#12b8d4"/><circle cx="20.5" cy="13" r="1.9" fill="#12b8d4"/>' +
    '<path d="M9.5 18.5c1.4 3.2 4 4.6 6.5 4.6s5.1-1.4 6.5-4.6" fill="none" stroke="#12b8d4" stroke-width="2.6" stroke-linecap="round"/>' +
    '</svg></button>';
  document.body.appendChild(menu);

  /* نافذة الملصقات (بتتبني أول مرة تتفتح بس) */
  var ov = null;
  function buildSheet() {
    if (ov) return;
    ov = document.createElement('div');
    ov.id = 'stkov';
    var h = '<div class="sb"><div class="sh"><b>الملصقات</b><button type="button" class="sx" aria-label="إغلاق">&times;</button></div><div class="sg">';
    for (var i = 0; i < STICKERS.length; i++) {
      h += '<button type="button" class="si" data-f="' + STICKERS[i] + '"><img decoding="async" alt="" data-t="0" data-s="stickers/thumbs/' + STICKERS[i].split('.')[0] + '.webp?v=2"></button>';
    }
    h += '</div></div>';
    ov.innerHTML = h;
    document.body.appendChild(ov);
    // لو صورة مصغرة فشلت في التحميل نعيد المحاولة بعد لحظة (حد أقصى 3 مرات)
    ov.addEventListener('error', function (e) {
      var im = e.target;
      if (!im || im.tagName !== 'IMG') return;
      var n = +im.getAttribute('data-t') || 0;
      if (n >= 3) return;
      im.setAttribute('data-t', n + 1);
      var u = im.getAttribute('src').split('?')[0];
      setTimeout(function () { im.src = u + '?v=2&r=' + (n + 1); }, 600 * (n + 1));
    }, true);
    ov.addEventListener('click', function (e) {
      if (e.target === ov || $(e.target).closest('.sx').length) { closeSheet(); return; }
      var b = $(e.target).closest('.si');
      if (b.length) {
        closeSheet();
        deliver('/stickers/s/' + b.attr('data-f').split('.')[0] + '.webp');
      }
    });
  }
  /* تحميل كسول: الصورة بتتحمل لما تقرب تظهر في الشاشة وقت الاسكرول */
  var lazyDone = false;
  function setupLazy() {
    if (lazyDone) return;
    lazyDone = true;
    var imgs = ov.querySelectorAll('img[data-s]');
    function load(im) {
      var u = im.getAttribute('data-s');
      if (u) { im.removeAttribute('data-s'); im.src = u; }
    }
    if (!('IntersectionObserver' in window)) {
      for (var i = 0; i < imgs.length; i++) load(imgs[i]);
      return;
    }
    var io = new IntersectionObserver(function (ents) {
      for (var k = 0; k < ents.length; k++) {
        if (ents[k].isIntersecting) {
          load(ents[k].target);
          io.unobserve(ents[k].target);
        }
      }
    }, { root: ov.querySelector('.sg'), rootMargin: '80px 0px' });
    for (var j = 0; j < imgs.length; j++) io.observe(imgs[j]);
  }
  /* بتفتح النافذة فوق أيقونة الملصقات مباشرة (r = مكان الأيقونة) */
  function openSheet(r) {
    buildSheet();
    var sb = ov.querySelector('.sb');
    var w = Math.min(310, window.innerWidth - 16);
    var left = r ? r.left + r.width / 2 - w / 2 : (window.innerWidth - w) / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    sb.style.width = w + 'px';
    sb.style.left = left + 'px';
    sb.style.bottom = (r ? Math.max(8, window.innerHeight - r.top + 8) : 60) + 'px';
    ov.classList.add('on');
    setupLazy();
  }
  function closeSheet() { if (ov) ov.classList.remove('on'); }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeSheet();
  });

  function closeMenu() {
    menu.style.display = 'none';
  }

  function openMenu(btn) {
    menu.style.display = 'flex';
    var r = btn.getBoundingClientRect();
    var left = Math.min(r.left, window.innerWidth - menu.offsetWidth - 4);
    menu.style.left = Math.max(4, left) + 'px';
    menu.style.top = Math.max(4, r.top - menu.offsetHeight - 6) + 'px';
  }

  /* إرسال رابط (صورة / ملصق) للغرفة */
  function emitRoomLink(link) {
    if (!link) return;
    SEND_EVENT_EMIT('SEND_EVENT_EMIT_MSG', {
      msg: '',
      link: link,
      reply: typeof R_P_C_M !== 'undefined' ? R_P_C_M : null,
    });
    try {
      if (typeof onlines === 'function') onlines();
      if (typeof isbust !== 'undefined') clearTimeout(isbust);
      if (typeof puys === 'function') puys();
      if (typeof norpl === 'function') norpl();
    } catch (e) {}
  }

  function sendRoomMedia() {
    if (typeof SEND_UP_FILE !== 'function') return;
    SEND_UP_FILE('', deliver, 'image/*, video/*');
  }

  /* فتح القائمة من زر خارجي: PLUSMENU_OPEN(زر, دالة_الاستلام) */
  window.PLUSMENU_OPEN = function (btn, cb) {
    if (menu.style.display === 'flex' && target === cb) { closeMenu(); return; }
    target = cb || null;
    openMenu(btn);
  };

  $(document).on('click', '#plusbtn', function (e) {
    e.stopPropagation();
    target = null;
    if (menu.style.display === 'flex') closeMenu();
    else openMenu(this);
  });

  $(document).on('click', '#plusimg', function (e) {
    e.stopPropagation();
    closeMenu();
    sendRoomMedia();
  });

  $(document).on('click', '#plusstk', function (e) {
    e.stopPropagation();
    // لازم ناخد مكان الأيقونة قبل ما القائمة تتقفل
    var r = this.getBoundingClientRect();
    if (!r.width) r = null;
    closeMenu();
    openSheet(r);
  });

  $(document).on('click touchstart', function (e) {
    if (menu.style.display !== 'flex') return;
    if ($(e.target).closest('#plusmenu, #plusbtn, .fth-plus').length) return;
    closeMenu();
  });

  $(window).on('resize orientationchange', closeMenu);
})();
