/*
 * مقاعد البث المباشر (فيديو)
 *  - إعدادات الغرفة: تحت "تشغيل المايك" أيقونات مايك بعدد المقاعد (6). ضغطة = مقعد بث فيديو، ضغطة تانية = يرجع صوتي.
 *  - المقعد المحوّل يظهر بشكل مميز (إطار أحمر + شارة كاميرا)، ولما حد يبث تظهر عليه شارة LIVE.
 *  - ضغط مقعد بث فاضي -> نافذة "فتح بث" تختار منها الكاميرا (أمامية / خلفية).
 *  - البث يظهر للكل في نافذة عائمة فوق الشات (تتحرك بالسحب، تصغير، ملء الشاشة، إغلاق).
 *  - النقل نفسه عبر نظام WebRTC الحالي للمايكات (x2.js) — بنضيف فقط مسار الفيديو.
 *  - الاستدعاءات من x2.js: VS_isVideoSeat / VS_ask / VS_onStream / VS_onRemote / VS_off / VS_mark / VS_get / VS_set
 */
(function () {
  "use strict";

  var SEATS = 6;
  var WINS = {};            // seat -> { $el, video, stream, mine, hidden }
  var zTop = 99990;

  /* ---------------- أدوات ---------------- */
  function roomVs() {
    try {
      var r = R_CASH[M_ROOM];
      return r && r.broadcast && r.vseats ? String(r.vseats) : "";
    } catch (e) { return ""; }
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  var ICO_MIC = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v4"/></svg>';
  var ICO_CAM = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="13" height="12" rx="2.5"/><path d="M15 10.5l6-3.5v10l-6-3.5"/></svg>';

  window.VS_isVideoSeat = function (seat) {
    return ("," + roomVs() + ",").indexOf("," + Number(seat) + ",") != -1;
  };

  /* ---------------- CSS ---------------- */
  var css = [
    /* إعدادات الغرفة */
    "#mkr .rm-vseats{margin:4px 0 8px;padding:8px;background:#fff;border:1px solid #d5d5d5;border-radius:4px}",
    "#mkr .rm-vs-t{font-size:12px !important;font-weight:700;margin-bottom:6px;color:#333}",
    "#mkr .rm-vs-t small{font-weight:400;color:#777;font-size:11px !important;margin-right:4px}",
    "#mkr .rm-vs-row{display:flex;gap:5px;direction:ltr}",
    "#mkr .vsb{flex:1 1 0;position:relative;height:46px;padding:0;margin:0;border:1px solid #cfcfcf;border-radius:8px;background:#f4f4f4;color:#555;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}",
    "#mkr .vsb b{position:absolute;top:1px;right:4px;font-size:9px;color:#888}",
    "#mkr .vsb.on{background:#e11d48;border-color:#be123c;color:#fff;box-shadow:0 2px 8px rgba(225,29,72,.35)}",
    "#mkr .vsb.on b{color:#ffe4ea}",
    "#mkr .vsb:active{transform:scale(.94)}",
    /* شكل المقعد */
    ".broadcasters>div>.prod.vseat:not(.is_speaking){border-color:#e11d48 !important}",
    ".broadcasters>div>.prod.vseat{box-shadow:0 0 0 1px rgba(225,29,72,.35);isolation:isolate}",
    ".broadcasters>div>.prod.vs-hid{display:none !important}",
    "#mkr .rm-vs-c{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:12px !important;font-weight:700;color:#333}",
    "#mkr .rm-vs-c button{width:30px;height:30px;padding:0;border:1px solid #cfcfcf;border-radius:8px;background:#f4f4f4;font-size:18px !important;line-height:28px;cursor:pointer;margin:0}",
    "#mkr .rm-vs-c button:active{background:#e11d48;color:#fff}",
    "#mkr .rm-vs-c .vsc-n{min-width:22px;text-align:center;font-size:15px !important}",
    '.broadcasters>div>.prod.vseat:not([id^="prod"]){background-color:#2a0b13 !important;background-image:url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23fb7185\' stroke-width=\'1.8\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><rect x=\'2\' y=\'6\' width=\'13\' height=\'12\' rx=\'2.5\'/><path d=\'M15 10.5l6-3.5v10l-6-3.5\'/></svg>") !important;background-size:58% !important;background-position:center !important;background-repeat:no-repeat !important}',
    '.broadcasters>div>.prod.vseat::before{content:"";position:absolute;z-index:2;top:-5px;right:-5px;width:15px;height:15px;border-radius:50%;background:#e11d48 url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%23fff\'><rect x=\'2\' y=\'6\' width=\'13\' height=\'12\' rx=\'2.5\'/><path d=\'M15 10.5l6-3.5v10l-6-3.5z\'/></svg>") center/9px no-repeat;border:1.5px solid #fff;pointer-events:none}',
    '.broadcasters>div>.prod.vseat.vlive::before{content:"LIVE";width:auto;height:auto;top:auto;right:auto;bottom:-6px;left:50%;transform:translateX(-50%);padding:0 5px;border-radius:4px;background:#e11d48;color:#fff;font:700 8px/12px Arial,sans-serif;letter-spacing:.5px;animation:vsPulse 1.2s ease-in-out infinite}',
    "@keyframes vsPulse{0%,100%{opacity:1}50%{opacity:.45}}",
    ".vswatch{display:block;width:80px;font-size:9px !important;margin-top:2px;background:#e11d48;color:#fff;border-color:#be123c}",
    /* نافذة "فتح بث" */
    "#vsAsk{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;direction:rtl;font-family:inherit}",
    "#vsAsk .vsa-card{width:min(86vw,320px);background:#fff;border-radius:16px;padding:16px;box-shadow:0 12px 40px rgba(0,0,0,.4);text-align:center}",
    "#vsAsk .vsa-t{font-size:17px !important;font-weight:700;color:#111;margin-bottom:2px}",
    "#vsAsk .vsa-s{font-size:12px !important;color:#777;margin-bottom:14px}",
    "#vsAsk .vsa-b{display:flex;align-items:center;gap:10px;width:100%;padding:12px 14px;margin-bottom:8px;border:1px solid #e5e5e5;border-radius:12px;background:#fafafa;color:#222;font-size:14px !important;font-weight:700;cursor:pointer;transition:all .12s}",
    "#vsAsk .vsa-b:hover,#vsAsk .vsa-b:active{background:#e11d48;border-color:#e11d48;color:#fff}",
    "#vsAsk .vsa-b svg{flex:0 0 auto}",
    "#vsAsk .vsa-c{width:100%;padding:9px;border:0;background:none;color:#888;font-size:13px !important;cursor:pointer}",
    /* نافذة البث العائمة */
    ".vsw{position:fixed;z-index:99990;width:min(72vw,264px);background:#0b0b0d;border:1px solid #e11d48;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.5);direction:rtl;touch-action:none;font-family:inherit}",
    ".vsw.big{width:min(94vw,520px)}",
    ".vsw-h{display:flex;align-items:center;gap:6px;padding:5px 8px;background:#18181b;color:#fff;cursor:move;user-select:none;-webkit-user-select:none}",
    ".vsw-live{flex:0 0 auto;background:#e11d48;color:#fff;font:700 9px/14px Arial,sans-serif;padding:0 6px;border-radius:4px;animation:vsPulse 1.2s ease-in-out infinite}",
    ".vsw-n{flex:1 1 auto;min-width:0;font-size:12px !important;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".vsw-btns{flex:0 0 auto;display:flex;gap:3px}",
    ".vsw-btns button{width:24px;height:24px;padding:0;border:0;border-radius:6px;background:#2a2a30;color:#fff;font-size:14px !important;line-height:24px;cursor:pointer}",
    ".vsw-btns button:active{background:#e11d48}",
    ".vsw-v{position:relative;background:#000;aspect-ratio:4/3}",
    ".vsw-v video{width:100%;height:100%;object-fit:contain;display:block;background:#000}",
    ".vsw-v video.mirror{transform:scaleX(-1)}",
    ".vsw-load{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:12px !important;background:#000}",
    ".vsw-f{padding:6px;background:#18181b;display:none}",
    ".vsw.mine .vsw-f{display:block}",
    ".vsw-stop{width:100%;padding:6px;border:0;border-radius:8px;background:#e11d48;color:#fff;font-size:13px !important;font-weight:700;cursor:pointer}",
    ".vsw.min .vsw-v,.vsw.min .vsw-f{display:none}",
    ".vsw.min{width:min(60vw,200px)}"
  ].join("\n");
  var st = document.createElement("style");
  st.id = "vs-style";
  st.appendChild(document.createTextNode(css));
  document.head.appendChild(st);

  /* ---------------- إعدادات الغرفة (أيقونات المقاعد) ---------------- */
  function paintBtn($b, on) {
    var n = $b.attr("data-s");
    $b.toggleClass("on", !!on);
    $b.html(on ? ICO_CAM : ICO_MIC).append("<b>" + n + "</b>");
    $b.attr("title", on ? "مقعد " + n + ": بث فيديو (اضغط ليرجع مقعد صوتي)" : "مقعد " + n + ": صوتي (اضغط ليتحول لبث فيديو)");
  }
  function ensureUi($ht) {
    var $box = $ht.find(".rm-vseats");
    if (!$box.length) return $box;
    if (!$box.find(".rm-vs-c").length) {
      $box.find(".rm-vs-t").after(
        '<div class="rm-vs-c"><span>عدد المقاعد</span>' +
        '<button type="button" class="vsc-m" title="إنقاص">−</button>' +
        '<span class="vsc-n">' + SEATS + '</span>' +
        '<button type="button" class="vsc-p" title="زيادة">+</button></div>'
      );
    }
    var $row = $box.find(".rm-vs-row");
    if ($row.children().length != SEATS) {
      $row.empty();
      for (var i = 1; i <= SEATS; i++) {
        var $b = $('<button type="button" class="vsb" data-s="' + i + '"></button>');
        paintBtn($b, false);
        $row.append($b);
      }
    }
    return $box;
  }
  function getCount($ht) {
    var n = parseInt($ht.find(".rm-vseats .vsc-n").text(), 10);
    return n >= 1 && n <= SEATS ? n : SEATS;
  }
  function applyCount($ht, n) {
    n = parseInt(n, 10);
    if (isNaN(n)) n = SEATS;
    n = Math.max(1, Math.min(SEATS, n));
    var $box = $ht.find(".rm-vseats");
    $box.find(".vsc-n").text(n);
    $box.find(".vsb").each(function () {
      var $b = $(this), k = Number($b.attr("data-s"));
      if (k > n) { paintBtn($b, false); $b.hide(); } else { $b.show(); }
    });
  }
  function syncVisible($ht) {
    var $box = ensureUi($ht);
    $box.toggle(!!$ht.find(".broadcast").prop("checked"));
  }
  /* قراءة الاختيار -> "2,5" */
  window.VS_get = function ($ht) {
    try {
      if (!$ht.find(".broadcast").prop("checked")) return "";
      var out = [];
      var cnt = getCount($ht);
      $ht.find(".vsb.on").each(function () { var k = Number($(this).attr("data-s")); if (k <= cnt) out.push(k); });
      return out.sort().join(",");
    } catch (e) { return ""; }
  };
  /* ملء الاختيار من قيمة محفوظة (أو تفريغه لو فاضية) */
  window.VS_count = function ($ht) {
    try { return $ht.find(".broadcast").prop("checked") ? getCount($ht) : SEATS; } catch (e) { return SEATS; }
  };
  window.VS_set = function ($ht, str, count) {
    try {
      var $box = ensureUi($ht);
      var set = {};
      String(str || "").split(",").forEach(function (x) { var n = parseInt(x, 10); if (n >= 1 && n <= SEATS) set[n] = 1; });
      $box.find(".vsb").each(function () { var $b = $(this); paintBtn($b, !!set[$b.attr("data-s")]); });
      applyCount($ht, count || SEATS);
      syncVisible($ht);
    } catch (e) {}
  };
  $(document).on("click", "#mkr .vsb", function (ev) {
    ev.preventDefault();
    var $b = $(this);
    paintBtn($b, !$b.hasClass("on"));
  });
  $(document).on("click", "#mkr .vsc-m, #mkr .vsc-p", function (ev) {
    ev.preventDefault();
    var $ht = $("#mkr");
    applyCount($ht, getCount($ht) + ($(this).hasClass("vsc-p") ? 1 : -1));
  });
  $(document).on("change", "#mkr .broadcast", function () { syncVisible($("#mkr")); });

  /* ---------------- تمييز المقاعد ---------------- */
  function roomCount() {
    try {
      var r = R_CASH[M_ROOM];
      var n = parseInt(r && r.mseats, 10);
      return r && r.broadcast && n >= 1 && n <= SEATS ? n : SEATS;
    } catch (e) { return SEATS; }
  }
  window.VS_mark = function () {
    try {
      var cnt = roomCount();
      $(".broadcasters .prod").each(function () {
        var $p = $(this), n = Number($p.attr("data"));
        $p.toggleClass("vs-hid", n > cnt);
        var v = window.VS_isVideoSeat(n);
        var s = (typeof ia != "undefined" && ia) ? ia[n] : null;
        var live = !!(v && s && s.ev && s.vid);
        $p.toggleClass("vseat", v).toggleClass("vlive", live);
        var $m = $p.find("#showpf");
        if ($m.length) {
          var $w = $m.find(".vswatch");
          if (v && !$w.length) {
            $w = $('<i class="vswatch btn">مشاهدة البث</i>');
            $w.on("click", function (e) {
              e.preventDefault(); e.stopPropagation();
              window.VS_show(n);
              $m.hide();
            });
            $m.append($w);
          }
          $w.css("display", live ? "block" : "none");
        }
      });
    } catch (e) {}
  };

  /* ---------------- نافذة اختيار الكاميرا ---------------- */
  function closeAsk() { $("#vsAsk").remove(); }
  window.VS_ask = function (seat, cb) {
    closeAsk();
    var $o = $(
      '<div id="vsAsk">' +
        '<div class="vsa-card">' +
          '<div class="vsa-t">فتح بث</div>' +
          '<div class="vsa-s">مقعد بث مباشر رقم ' + Number(seat) + " — اختر الكاميرا</div>" +
          '<button type="button" class="vsa-b" data-f="user">' + ICO_CAM + "<span>الكاميرا الأمامية</span></button>" +
          '<button type="button" class="vsa-b" data-f="environment">' + ICO_CAM + "<span>الكاميرا الخلفية</span></button>" +
          '<button type="button" class="vsa-c">إلغاء</button>' +
        "</div>" +
      "</div>"
    ).appendTo("body");
    $o.on("click", function (e) { if (e.target === this) closeAsk(); });
    $o.find(".vsa-c").on("click", closeAsk);
    $o.find(".vsa-b").on("click", function () {
      var f = $(this).attr("data-f");
      closeAsk();
      try { cb(f); } catch (e) {}
    });
  };

  /* ---------------- النافذة العائمة ---------------- */
  function clampPos($w) {
    var el = $w[0], vw = window.innerWidth, vh = window.innerHeight;
    var r = el.getBoundingClientRect();
    var l = Math.min(Math.max(0, r.left), Math.max(0, vw - 80));
    var t = Math.min(Math.max(0, r.top), Math.max(0, vh - 40));
    el.style.left = l + "px";
    el.style.top = t + "px";
  }
  function makeDraggable($w) {
    var $h = $w.find(".vsw-h");
    var sx = 0, sy = 0, ol = 0, ot = 0, drag = false, pid = null;
    $h.on("pointerdown", function (e) {
      if ($(e.target).closest("button").length) return;
      drag = true; pid = e.pointerId;
      var r = $w[0].getBoundingClientRect();
      sx = e.clientX; sy = e.clientY; ol = r.left; ot = r.top;
      $w.css("z-index", ++zTop);
      try { $h[0].setPointerCapture(pid); } catch (x) {}
      e.preventDefault();
    });
    $h.on("pointermove", function (e) {
      if (!drag || e.pointerId !== pid) return;
      $w[0].style.left = (ol + e.clientX - sx) + "px";
      $w[0].style.top = (ot + e.clientY - sy) + "px";
    });
    function end(e) {
      if (!drag) return;
      drag = false;
      try { $h[0].releasePointerCapture(pid); } catch (x) {}
      clampPos($w);
    }
    $h.on("pointerup pointercancel", end);
  }
  function seatName(seat, who) {
    if (who && who.name) return who.name;
    try {
      var s = ia[seat];
      if (s && s.id && U_CASH[s.id]) return U_CASH[s.id].topic;
    } catch (e) {}
    return "بث مباشر";
  }
  function build(seat, stream, who) {
    var mine = !!(who && who.mine);
    var $w = $(
      '<div class="vsw' + (mine ? " mine" : "") + '" data-seat="' + Number(seat) + '">' +
        '<div class="vsw-h">' +
          '<span class="vsw-live">● مباشر</span>' +
          '<span class="vsw-n"></span>' +
          '<span class="vsw-btns">' +
            '<button type="button" class="vsw-min" title="تصغير">–</button>' +
            '<button type="button" class="vsw-sz" title="تكبير / تصغير الحجم">⤢</button>' +
            '<button type="button" class="vsw-fs" title="ملء الشاشة">⛶</button>' +
            (mine ? "" : '<button type="button" class="vsw-x" title="إغلاق (البث مستمر)">×</button>') +
          "</span>" +
        "</div>" +
        '<div class="vsw-v"><video autoplay playsinline muted></video><div class="vsw-load">جاري تحميل البث…</div></div>' +
        '<div class="vsw-f"><button type="button" class="vsw-stop">إيقاف البث</button></div>' +
      "</div>"
    );
    $w.find(".vsw-n").text(seatName(seat, who));
    var v = $w.find("video")[0];
    v.muted = true;                       // الصوت بيطلع من عنصر المقعد (x2.js) عشان أزرار الكتم تفضل شغالة
    v.setAttribute("playsinline", "");
    if (mine && who.facing === "user") $(v).addClass("mirror");
    v.srcObject = stream;
    v.addEventListener("playing", function () { $w.find(".vsw-load").hide(); });
    v.addEventListener("loadeddata", function () { $w.find(".vsw-load").hide(); });
    var tryPlay = function () { var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    tryPlay();
    $(v).on("click", tryPlay);

    $w.find(".vsw-min").on("click", function () { $w.toggleClass("min"); clampPos($w); });
    $w.find(".vsw-sz").on("click", function () { $w.toggleClass("big"); clampPos($w); });
    $w.find(".vsw-fs").on("click", function () {
      var el = $w.find(".vsw-v")[0];
      var rq = el.requestFullscreen || el.webkitRequestFullscreen;
      if (rq) { try { rq.call(el); } catch (e) {} }
      else if (v.webkitEnterFullscreen) { try { v.webkitEnterFullscreen(); } catch (e) {} }
    });
    $w.find(".vsw-x").on("click", function () {
      $w.hide();
      if (WINS[seat]) WINS[seat].hidden = true;
    });
    $w.find(".vsw-stop").on("click", function () {
      try { fm({ it: Number(seat), target: M_ID, type: "hang-up" }); } catch (e) {}
    });

    /* مكان البداية: أعلى الشات، وكل نافذة جديدة تنزل شوية */
    var idx = Object.keys(WINS).length;
    $w.css({ top: (58 + idx * 34) + "px", left: Math.max(6, (window.innerWidth - 264) / 2 + idx * 14) + "px", "z-index": ++zTop });
    $("body").append($w);
    makeDraggable($w);
    clampPos($w);
    return { $el: $w, video: v, stream: stream, mine: mine, hidden: false };
  }

  /* بث جديد (أنا أو غيري) */
  window.VS_onStream = function (stream, seat, who) {
    try {
      seat = Number(seat);
      var cur = WINS[seat];
      if (cur && cur.stream === stream) {
        if (cur.hidden) { cur.hidden = false; cur.$el.show(); }
        return;
      }
      if (cur) window.VS_off(seat);
      WINS[seat] = build(seat, stream, who || {});
      window.VS_mark();
    } catch (e) { console.log("VS_onStream", e); }
  };
  /* بث وصلني من عضو تاني (من ontrack في x2.js) */
  window.VS_onRemote = function (stream, seat, sid) {
    var name = "";
    try { if (U_CASH[sid]) name = U_CASH[sid].topic; } catch (e) {}
    window.VS_onStream(stream, seat, { name: name, mine: false });
  };
  /* إعادة فتح نافذة بث اتقفلت (من قائمة المقعد) */
  window.VS_show = function (seat) {
    var w = WINS[Number(seat)];
    if (w) { w.hidden = false; w.$el.show().removeClass("min").css("z-index", ++zTop); clampPos(w.$el); }
  };
  /* إغلاق نافذة بث مقعد (أو كل النوافذ لو ما اتحددش) */
  window.VS_off = function (seat) {
    try {
      var list = seat == null ? Object.keys(WINS) : [String(Number(seat))];
      list.forEach(function (k) {
        var w = WINS[k];
        if (!w) return;
        try { w.video.pause(); } catch (e) {}
        try { w.video.srcObject = null; } catch (e) {}
        w.$el.remove();
        delete WINS[k];
      });
      setTimeout(function () { try { window.VS_mark(); } catch (e) {} }, 0);
    } catch (e) {}
  };
  /* نفس VS_off لكن بيسيب نافذة بثي أنا (لما أنا اللي بابث ومستمع بيخرج مثلاً) */
  window.VS_offRemote = function (seat) {
    var list = seat == null ? Object.keys(WINS) : [String(Number(seat))];
    list.forEach(function (k) {
      if (WINS[k] && !WINS[k].mine) window.VS_off(k);
    });
  };
  /* حالة: هل في بث شغال على المقعد ده عندي؟ */
  window.VS_has = function (seat) { return !!WINS[Number(seat)]; };

  $(window).on("resize orientationchange", function () {
    Object.keys(WINS).forEach(function (k) { clampPos(WINS[k].$el); });
  });
})();
