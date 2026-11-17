/* [ADDED - AVATAR MENU] قايمة صورة البروفايل بشكل صورة المرجع — ملف إضافة مستقل (مفيش تعديل على room-topbar.js).
   بيعمل:
   1) هيدر: صورة + اسم الرتبة (لو فيه) + الاسم + "تحرير الملف الشخصي" + دايرة إغلاق — بيتحدّث كل مرة القايمة تتفتح.
   2) نفس أزرار القايمة الأصلية بتتنقل/تتغير شكلها بس (نفس الـ classes والـ ids والـ handlers):
      .pmsg / .cp / .redit / .adact-btn / #rtbLeaveRoomBtn — فصلاحيات الإظهار (show/hide من x2.js و admin-actions.js) شغالة زي ما هي.
   3) زرار "خروج" جديد (بينادي logout() الأصلية).
   4) الخطوط الفاصلة بين المجموعات بتظهر بس لو المجموعة اللي بعدها فيها عنصر ظاهر.
   لازم بعد room-topbar.js. */
(function(){
  'use strict';
  var BUILT = false;

  /* أيقونات SVG مضمّنة (نفس ألوان الصورة) */
  var ICO = {
    wallet: '<svg class="tav-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h12.5a2 2 0 0 1 2 2v.3H6.2A2.2 2.2 0 0 0 4 9.5V7a2 2 0 0 1 1-2z"/><path d="M3 9.5A2.5 2.5 0 0 1 5.5 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 17.5z"/><circle class="tav-cut" cx="16.4" cy="13.5" r="1.4"/></svg>',
    mega:   '<svg class="tav-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9.5v5h3.2l7.3 4.2V5.3L6.2 9.5z"/><path d="M15.8 9a3.2 3.2 0 0 1 0 6z"/><path d="M6.4 15.2l1.2 4.6h2.6l-1-4.2z"/></svg>',
    cp:     '<svg class="tav-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><rect class="tav-cut" x="11" y="5.6" width="2" height="6.2" rx="1"/><circle class="tav-cut" cx="12" cy="14.6" r="1.8"/><circle class="tav-cut" cx="7.4" cy="12.2" r="1"/><circle class="tav-cut" cx="16.6" cy="12.2" r="1"/></svg>',
    gear:   '<svg class="tav-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M13.6 2.5h-3.2l-.5 2.6-1.7.7-2.2-1.5-2.3 2.3 1.5 2.2-.7 1.7-2.6.5v3.2l2.6.5.7 1.7-1.5 2.2 2.3 2.3 2.2-1.5 1.7.7.5 2.6h3.2l.5-2.6 1.7-.7 2.2 1.5 2.3-2.3-1.5-2.2.7-1.7 2.6-.5v-3.2l-2.6-.5-.7-1.7 1.5-2.2-2.3-2.3-2.2 1.5-1.7-.7z"/><circle class="tav-cut" cx="12" cy="12" r="3.2"/></svg>',
    shield: '<svg class="tav-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 5.2v6c0 5 3.4 9.1 8 10.8 4.6-1.7 8-5.8 8-10.8v-6z"/><path class="tav-cut" d="M12 4.6v14.7c-3.2-1.5-5.6-4.5-5.6-8.1V6.9z"/></svg>',
    back:   '<svg class="tav-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path class="tav-cut" d="M12.6 6.4 7 12l5.6 5.6 1.5-1.5-3-3H18v-2.2h-6.9l3-3z"/></svg>',
    out:    '<svg class="tav-ico" viewBox="0 0 24 24" aria-hidden="true"><path class="tav-line" d="M10 3.5H5.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2H10"/><path class="tav-line" d="M9 12h12M17 7.5l4.5 4.5-4.5 4.5"/></svg>',
    store:  '<svg class="tav-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5.2 7h13.6l1.2 13a1.5 1.5 0 0 1-1.5 1.6H5.5A1.5 1.5 0 0 1 4 20z"/><path class="tav-line" d="M8.5 9.5V7a3.5 3.5 0 0 1 7 0v2.5"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v2.5h3V9a4 4 0 0 1-3.6 4 5.5 5.5 0 0 1-3.4 2.9V18h3v3H7v-3h3v-2.1A5.5 5.5 0 0 1 6.6 13 4 4 0 0 1 3 9V5.5h3zM5 7.5V9a2 2 0 0 0 1.1 1.8A12 12 0 0 1 6 8.5V7.5zM19 7.5h-1v1a12 12 0 0 1-.1 2.3A2 2 0 0 0 19 9z"/></svg>',
    x:      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>'
  };

  function closeMenu(){ $('#rtbAvatarMenu').removeClass('open'); }

  /* بيغيّر شكل زرار موجود (من غير ما يمس الـ class/الـ id/الـ handlers) */
  function skin($b, ico, text){
    $b.addClass('tav-item').html(ico + '<span class="tav-lbl">' + text + '</span>');
  }

  /* اسم/صورة/رتبة العضو الحالي → الهيدر (بيتنادى قبل ما القايمة تتفتح عشان الارتفاع يتحسب صح) */
  function paintHead(){
    var u = null, pw = null;
    try{ if(typeof U_CASH !== 'undefined' && typeof M_ID !== 'undefined'){ u = U_CASH[M_ID]; } }catch(e){}
    var name = (u && u.topic != null) ? $('<div>').html(String(u.topic)).text() : '';
    $('#tavName').text(name);
    /* الصورة: نفس مصدر أيقونة الصورة في الشريط (بتتحدث من x2.js) */
    var src = $('#rtbAvatarBtn .rtb-avatar').attr('src') || (u && u.pic) || '';
    if(src){ $('#tavPic').attr('src', src); }
    /* الرتبة: اسم القوة (power) بتاع العضو لو فيه */
    var rank = '';
    try{
      if(u && u.power && typeof getpower === 'function'){ pw = getpower(u.power); rank = (pw && pw.name) ? String(pw.name) : ''; }
    }catch(e){}
    if(rank === '_' || rank === 'Hide'){ rank = ''; }
    $('#tavRankTxt').text(rank);
    $('#tavRank').css('display', rank ? 'flex' : 'none');
  }

  /* الخط الفاصل قبل أي مجموعة بيظهر بس لو فيها عنصر ظاهر وفيه مجموعة قبلها فيها عنصر ظاهر */
  function syncSeps(){
    var anyBefore = false;
    $('#rtbAvatarMenu .tav-group').each(function(){
      var g = $(this);
      var vis = g.children('.tav-item').filter(function(){ return $(this).css('display') !== 'none'; }).length > 0;
      g.prev('.tav-sep').css('display', (vis && anyBefore) ? 'block' : 'none');
      if(vis){ anyBefore = true; }
    });
  }

  function build(){
    var $m = $('#rtbAvatarMenu');
    if(BUILT || !$m.length) return;
    BUILT = true;

    /* الهيدر */
    var head = $(
      '<div class="tav-head">' +
        '<img id="tavPic" class="tav-pic" alt="">' +
        '<div class="tav-txt">' +
          '<span id="tavRank" class="tav-rank" style="display:none"><span id="tavRankTxt"></span>' + ICO.trophy + '</span>' +
          '<span id="tavName" class="tav-name"></span>' +
          '<button type="button" id="tavEdit" class="tav-edit">تحرير الملف الشخصي</button>' +
        '</div>' +
        '<button type="button" id="tavClose" class="tav-close" aria-label="إغلاق">' + ICO.x + '</button>' +
      '</div>'
    );
    head.find('#tavEdit').on('click', function(e){
      e.stopPropagation(); closeMenu();
      if(typeof openSettingsPopup === 'function'){ openSettingsPopup(); }
    });
    head.find('#tavClose').on('click', function(e){ e.stopPropagation(); closeMenu(); });

    /* الأزرار الأصلية (نفس العناصر بالظبط) */
    var $items = $m.children('.rtb-menu-item');
    var $edit   = $items.filter(function(){ return String($(this).attr('onclick') || '').indexOf('openSettingsPopup') > -1; }).first();
    var $wallet = $items.filter(function(){ return String($(this).attr('onclick') || '').indexOf('showRtbWallet') > -1; }).first();
    var $pmsg = $m.children('.pmsg').first();
    var $cp = $m.children('.cp').first();
    var $redit = $m.children('.redit').first();
    var $adact = $m.children('.adact-btn').first();
    var $leave = $m.children('#rtbLeaveRoomBtn').first();

    /* "تعديل ملفي الشخصي" الأصلي: بقى رابط في الهيدر، فبنخفيه (من غير حذف) */
    $edit.addClass('tav-dup');

    skin($wallet, ICO.wallet, 'محفظة');
    var $store = $m.children('#rtbStoreBtn').first();
    skin($store, ICO.store, 'المتجر');
    skin($pmsg, ICO.mega, 'إرسال إعلان');
    skin($cp, ICO.cp, 'لوحة التحكم');
    skin($redit, ICO.gear, 'إدارة الغرفة');
    skin($adact, ICO.shield, 'إدارة الإجراءات');
    skin($leave, ICO.back, 'الخروج من الغرفة');

    /* زرار خروج (تسجيل الخروج) — نفس دالة logout() الأصلية */
    var $logout = $('<button type="button" id="tavLogoutBtn" class="rtb-menu-item"></button>');
    skin($logout, ICO.out, 'خروج');
    $logout.on('click', function(e){
      e.stopPropagation(); closeMenu();
      if(typeof logout === 'function'){ logout(); }
    });

    /* التجميع: (محفظة + إعلان) | (لوحة التحكم + إدارة الغرفة + إدارة الإجراءات) | (الخروج من الغرفة + خروج) */
    var g1 = $('<div class="tav-group"></div>').append($wallet, $store, $pmsg);
    var g2 = $('<div class="tav-group"></div>').append($cp, $redit, $adact);
    var g3 = $('<div class="tav-group"></div>').append($leave, $logout);
    $m.addClass('tav').prepend(head);
    head.after(g1);
    g1.after('<div class="tav-sep"></div>');
    g1.next().after(g2);
    g2.after('<div class="tav-sep"></div>');
    g2.next().after(g3);
  }

  $(function(){
    build();
    /* capture على زرار الصورة: بيتنفّذ قبل handler فتح القايمة في room-topbar.js فالهيدر والفواصل يتحدّثوا قبل placeNear */
    var btn = document.getElementById('rtbAvatarBtn');
    if(btn){
      btn.addEventListener('click', function(){ paintHead(); syncSeps(); }, true);
    }
    paintHead(); syncSeps();
  });
})();
