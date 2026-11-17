/*
 * ريشة المبدعين — نسخة ثانية من الحائط بجانب الحائط الأساسي
 *  - تبويبين فوق الحائط: [الحائط] [ريشة المبدعين]
 *  - منشورات + إعجاب / عدم إعجاب (imgs/like.png , imgs/dislike.png) + تعليقات + حذف
 *  - الرد من السيرفر بيوصل عن طريق x2.js (case "feather") -> FEATHER_RECV
 * الملف لوحده بيبني الواجهة (مفيش تعديل في HTML غير سطر تحميل السكريبت).
 */
(function () {
  var TAB_WALL = "الحائط";
  var TAB_FEATHER = "ريشة المبدعين";
  var LIKE_IMG = "imgs/like.png";
  var DISLIKE_IMG = "imgs/dislike.png";

  var posts = {};        // bid -> بيانات المنشور
  var $pane, $list, $ta, $tabW, $tabF, $badge, $main;
  var active = false;    // تاب الريشة مفتوح؟
  var unread = 0;
  var built = false;
  var listAsked = false;
  var loaded = false;    // اتحملت القائمة من السيرفر؟
  var lastId = null;     // آخر جلسة طلبنا لها القائمة

  function brand() {
    var c = "";
    try {
      var el = document.querySelector("#wall .ytw") || document.getElementById("wall");
      c = (getComputedStyle(el).getPropertyValue("--yt") || "").trim();
    } catch (e) {}
    return c || "#4f6592";
  }

  function css() {
    var b = brand();
    var s = [
      "#wall .fth-tabs{display:flex;direction:rtl;gap:6px;padding:4px 6px;height:34px;box-sizing:border-box;background:#fff;border-bottom:1px solid #e3e3ee}",
      "#wall .fth-tab{flex:1;height:26px;line-height:24px;border-radius:14px!important;border:1px solid " + b + "!important;background:#fff!important;color:" + b + "!important;",
      "font-size:14px!important;cursor:pointer;padding:0 8px!important;position:relative;outline:0;white-space:nowrap}",
      "#wall .fth-tab.on{background:" + b + "!important;color:#fff!important}",
      "#wall .fth-badge{display:none;background:#e53935;color:#fff;border-radius:9px;font-size:11px;line-height:16px;min-width:16px;padding:0 4px;margin-right:5px;vertical-align:middle}",
      "#d2feather{position:relative;display:none;width:100%;height:calc(100% - 34px);background:#fff}",
      "#wall-main{position:relative;width:100%;height:calc(100% - 34px)}",
      "#d2feather .fth-list{direction:rtl;width:100%;height:calc(100% - 44px);overflow-y:auto;overflow-x:hidden}",
      "#d2feather .fth-empty{padding:30px 10px;text-align:center;color:#999;font-size:14px}",
      ".fth-post{display:flex;direction:rtl;gap:6px;padding:6px 6px 4px;border-bottom:1px solid lavender;background:#fafafa}",
      ".fth-pic{flex:0 0 52px;width:52px;height:46px;border-radius:4px;background-size:cover;background-position:center;background-color:#f3f3f3}",
      ".fth-body{flex:1;min-width:0}",
      ".fth-head{display:flex;align-items:center;height:21px}",
      ".fth-topic{padding:1px 6px;border-radius:2px;max-width:70%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}",
      ".fth-ago{margin-right:auto;color:grey;font-size:11px}",
      ".fth-msg{padding:2px 3px;word-break:break-word;overflow-wrap:anywhere;font-size:14px}",
      ".fth-msg img.stkmsg{max-width:120px}",
      ".fth-acts{display:flex;align-items:center;gap:4px;margin-top:3px}",
      ".fth-act{display:inline-flex;align-items:center;gap:4px;height:26px;padding:0 7px!important;border:1px solid #dcdcec!important;border-radius:13px!important;background:#fff!important;color:#555!important;cursor:pointer;font-size:12px!important;outline:0}",
      ".fth-act img{width:19px;height:21px;object-fit:contain;opacity:.45;transition:opacity .15s,transform .15s}",
      ".fth-act.on img{opacity:1;transform:scale(1.08)}",
      ".fth-act.on{border-color:" + b + "!important;color:" + b + "!important}",
      ".fth-act .fa{font-size:14px}",
      ".fth-act.fth-del{margin-right:auto;color:#c62828!important;border-color:#f0c4c4!important}",
      ".fth-cms{margin-top:4px;border-top:1px dashed #dcdcec;padding-top:4px}",
      ".fth-cm{display:flex;gap:5px;padding:3px 0;border-bottom:1px solid #f0f0f6}",
      ".fth-cm-pic{flex:0 0 26px;width:26px;height:26px;border-radius:50%;background-size:cover;background-position:center;background-color:#eee}",
      ".fth-cm-t{font-size:12px;color:#444}",
      ".fth-cm-m{font-size:13px;word-break:break-word;overflow-wrap:anywhere}",
      ".fth-cm-in{display:flex;gap:4px;margin-top:4px}",
      ".fth-cm-in input{flex:1;min-width:0;height:28px;border:1px solid #cfd3e6;border-radius:14px;padding:0 10px;font-size:13px;direction:rtl}",
      ".fth-cm-in button{height:28px;border-radius:14px!important;padding:0 10px!important}",
      "#d2feather .fth-box{position:absolute;bottom:0;left:0;right:0;height:44px;display:flex;align-items:center;gap:3px;padding:4px;box-sizing:border-box;background:#f4f4fa;border-top:1px solid #e3e3ee}",
      "#d2feather .fth-box textarea{flex:1;min-width:0;height:34px!important;resize:none;text-align:right}",
      "#d2feather .fth-box .btn{height:34px;margin:0!important}",
      ".fth-new{position:absolute;top:8px;left:50%;transform:translateX(-50%);z-index:3;display:none;border-radius:14px!important;padding:3px 14px!important}"
    ].join("\n");
    $("<style id='fth-css'></style>").text(s).appendTo("head");
  }

  function build() {
    if (built) return;
    var $wall = $("#wall");
    if (!$wall.length) return;
    built = true;
    css();

    // لف محتوى الحائط الأصلي في حاوية (الأحداث والعناصر بتفضل زي ما هي)
    $main = $("<div id='wall-main'></div>");
    $wall.children().appendTo($main);

    var $tabs = $("<div class='fth-tabs'></div>");
    /* [ADDED] الاسم بيتبدّل بالـ CSS حسب الوضع: الافتراضي = المنشورات / الدردشة السريعة (wall-default.css) */
    $tabW = $("<button type='button' class='fth-tab on'></button>").append($("<span class='ft-n'></span>").text(TAB_WALL), $("<span class='ft-d'></span>").text("المنشورات"));
    $tabF = $("<button type='button' class='fth-tab'></button>").append($("<span class='ft-n'></span>").text(TAB_FEATHER), $("<span class='ft-d'></span>").text("الدردشة السريعة"));
    $badge = $("<span class='fth-badge'></span>").appendTo($tabF);
    $tabs.append($tabF).append($tabW); // ريشة المبدعين الأول (يمين) ثم الحائط

    $pane = $(
      "<div id='d2feather'>" + /* الـ id ده مطلوب لشريط رفع الملفات (SEND_UP_FILE بيحط التقدم في #d2 + الاسم) */
        "<div class='fth-list break'></div>" +
        "<button type='button' class='fth-new btn btn-info'>منشورات جديدة</button>" +
        "<div class='fth-box'>" +
          "<button type='button' class='fth-plus fa fa-plus btn btn-primary' title='إرسال صورة أو ملصق'>&nbsp;&nbsp;</button>" +
          "<img tabindex='0' role='button' data-toggle='popover' data-trigger='focus' class='emofth' style='padding:5px;width:34px;' src='imgs/emoii.gif'>" +
          "<textarea class='tbox fth-ta' placeholder='اكتب رسالتك هنا'></textarea>" +
          "<button type='button' class='fth-send fa fa-send btn btn-primary'> إرسال </button>" +
        "</div>" +
      "</div>"
    );

    $wall.append($tabs).append($main).append($pane);

    $list = $pane.find(".fth-list");
    $ta = $pane.find(".fth-ta");

    $tabW.on("click", function () { showTab(false); });
    $tabF.on("click", function () { showTab(true); });
    $pane.find(".fth-send").on("click", function () { doPost(); });
    $pane.find(".fth-plus").on("click", function (e) {
      e.stopPropagation();
      if (window.PLUSMENU_OPEN) PLUSMENU_OPEN(this, submit);
    });
    $ta.on("keyup", function (e) {
      if (e.keyCode == 13 && !e.shiftKey) { e.preventDefault(); doPost(); }
    });
    $pane.find(".fth-new").on("click", function () { $list.scrollTop(0); $(this).hide(); });
    $list.on("scroll", function () { if ($list.scrollTop() < 30) $pane.find(".fth-new").hide(); });
    try { if (typeof emopop === "function") emopop(".emofth"); } catch (e) {}

    setInterval(updateAgo, 30000);
    // تحميل مسبق في الخلفية أول ما العضو يدخل (وبعد أي إعادة اتصال) علشان التاب يفتح والمنشورات جاهزة
    /* [FIX-PERF] كانت كل 800ms تعمل للأبد — الآن كل 3 ثوانٍ وتتوقف نهائياً بعد أول تحميل ناجح
       (الغرض الوحيد: التقاط لحظة دخول المستخدم بعد إعادة الاتصال) */
    var fthWatch = setInterval(function () {
      if (typeof M_ID !== "undefined" && M_ID && M_ID !== lastId) {
        lastId = M_ID;
        askList();
        clearInterval(fthWatch);
      }
    }, 3000);
  }

  function showTab(toFeather) {
    active = !!toFeather;
    $tabF.toggleClass("on", active);
    $tabW.toggleClass("on", !active);
    $main.css("display", active ? "none" : "block");
    $pane.css("display", active ? "block" : "none");
    var __dm = !document.body.classList.contains("nb") && !document.body.classList.contains("wl") && !document.body.classList.contains("uireta-on");
    $(".pnhead").text(active ? (__dm ? "الدردشة السريعة" : TAB_FEATHER) : TAB_WALL);
    if (active) {
      unread = 0;
      $badge.hide().text("");
      if (!loaded) askList();
      setTimeout(function () { $list.scrollTop(0); }, 0);
    } else {
      setTimeout(function () { $("#d2bc").scrollTop(0); }, 0);
    }
  }

  function askList() {
    if (typeof M_ID === "undefined" || !M_ID) return;
    listAsked = true;
    SEND_EVENT_EMIT("SEND_EVENT_EMIT_FEATHER_LIST", {});
  }

  // إرسال منشور: النص اللي في الخانة + (اختياري) رابط صورة / فيديو / ملصق
  function submit(link) {
    if (typeof M_ID === "undefined" || !M_ID) return;
    link = typeof link === "string" ? link : "";
    var msg = $ta.val();
    $ta.val("");
    if ((msg == "" || msg == "\n" || msg == "%0A" || msg == "%0a") && !link) return;
    SEND_EVENT_EMIT("SEND_EVENT_EMIT_FEATHER_POST", { msg: toEnglishDigits(msg), link: link });
    try { if (typeof onlines === "function") onlines(); } catch (e) {}
  }
  function doPost() { submit(""); }

  function parse(x) {
    try { var a = x ? JSON.parse(x) : []; return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }

  function ago(t) {
    var v = Math.abs(new Date().getTime() - parseInt(t, 10)) / 1000;
    if (isNaN(v) || v < 60) return "الآن";
    v /= 60; if (v < 60) return parseInt(v) + "د";
    v /= 60; if (v < 24) return parseInt(v) + "س";
    v /= 24; if (v < 30) return parseInt(v) + "ي";
    return parseInt(v / 30) + "ش";
  }
  function updateAgo() {
    $(".fth-ago").each(function () { $(this).text(ago($(this).attr("ago"))); });
  }

  function myIdreg() {
    try { return getuser(M_ID).idreg; } catch (e) { return null; }
  }

  function renderEmpty() {
    if (loaded && !$list.children(".fth-post").length) {
      if (!$list.children(".fth-empty").length) $list.append("<div class='fth-empty'>لا توجد منشورات بعد — كن أول من ينشر</div>");
    }
  }

  // تحويل الروابط (صور / فيديو / صوت / ملصقات) زي الحائط الأصلي
  function enhanceLinks($msg) {
    $msg.find("a.uplink").each(function () {
      var e = this, lnk = $(e).attr("href") || "";
      if (/^\/stickers\/s\/\d+\.webp$/i.test(lnk)) {
        $("<img class='stkmsg'>").attr("src", lnk).insertAfter(e);
        $(e).remove();
        return;
      }
      var mm = (typeof mime !== "undefined" && mime[lnk.split(".").pop().toLowerCase()]) || "";
      var $btn;
      if (/image/i.test(mm)) {
        $btn = $("<button type='button' class='btn fl fa fa-image'>عرض الصوره</button>").insertAfter(e);
        $(e).remove();
        $btn.on("click", function () {
          var $a = $("<a target='_blank'></a>").attr("href", lnk);
          $("<img class='hand fitimg' style='max-width:240px;max-height:200px;'>").attr("src", lnk).appendTo($a);
          $a.insertAfter($btn); $btn.remove();
        });
      } else if (/video/i.test(mm)) {
        $btn = $("<button type='button' class='btn fl fa fa-youtube-play'>عرض الفيديو</button>").insertAfter(e);
        $(e).remove();
        $btn.on("click", function () {
          var $v = $("<video controls style='width:95%;max-height:200px;'></video>");
          $("<source>").attr("src", lnk).appendTo($v);
          $v.insertAfter($btn); $btn.remove();
        });
      } else if (/audio/i.test(mm)) {
        $btn = $("<button type='button' class='btn fl fa fa-youtube-play'>مقطع صوت</button>").insertAfter(e);
        $(e).remove();
        $btn.on("click", function () {
          var $au = $("<audio controls style='width:100%;'></audio>");
          $("<source type='audio/mpeg'>").attr("src", lnk).appendTo($au);
          $au.insertAfter($btn); $btn.remove();
        });
      }
    });
  }

  // فتح بروفايل صاحب المنشور (زي الحائط): بندور عليه بين المتواجدين بالـ lid
  function openProfile(owner) {
    var id = null;
    try {
      $.each(U_CASH, function (k, u) {
        if (u && u.lid == owner) { id = k; return false; }
      });
    } catch (e) {}
    if (id && typeof upro === "function") upro(id);
  }

  function canDel(p) {
    try { return !!(jstp && jstp.delbc) || p.owner == U_CASH[M_ID].lid; } catch (e) { return false; }
  }

  function fillActions($post, p) {
    var likes = parse(p.likes), dis = parse(p.dislikes), cms = parse(p.bcc);
    var me = myIdreg();
    var tl = (typeof T_LIST !== "undefined" && T_LIST) || {};
    var $l = $post.find(".fth-like"), $d = $post.find(".fth-dis"), $c = $post.find(".fth-cm-btn");
    $l.find("span").text(likes.length || "");
    $d.find("span").text(dis.length || "");
    $c.find("span").text(cms.length || "");
    $l.toggleClass("on", me != null && likes.indexOf(me) != -1);
    $d.toggleClass("on", me != null && dis.indexOf(me) != -1);
    $l.add($d).toggle(!!tl.likebc);
    $c.toggle(!!tl.replaybc);
    $post.find(".fth-del").toggle(canDel(p));
  }

  function fillComments($post, p) {
    var $box = $post.find(".fth-cm-list").empty();
    $.each(parse(p.bcc), function (i, c) {
      var $row = $("<div class='fth-cm'></div>");
      if (window.uhideTag) { uhideTag($row, c.lid, true); } /* [ADDED] */
      $("<div class='fth-cm-pic'></div>").css("background-image", 'url("' + removegifpic(c.pic || "") + '")').appendTo($row);
      var $b = $("<div></div>");
      $("<div class='fth-cm-t'></div>").text(c.topic || "").css("color", c.ucol || "#444").appendTo($b);
      var $m = $("<div class='fth-cm-m'></div>").html(typeof emo === "function" ? emo(c.msg || "") : (c.msg || ""));
      $b.append($m).appendTo($row);
      $box.append($row);
    });
  }

  function buildPost(p) {
    var $post = $("<div class='fth-post'></div>").attr("data-bid", p.bid);
    if (window.uhideTag) { uhideTag($post, p.uid || p.owner, true); } /* [ADDED] */
    $("<div class='fth-pic hand'></div>")
      .css({ "background-image": 'url("' + removegifpic(p.pic || "") + '")', border: "2px solid " + (p.copic || "transparent"), cursor: "pointer" })
      .on("click", function () { openProfile(p.owner); })
      .appendTo($post);
    var $b = $("<div class='fth-body'></div>").appendTo($post);
    var $h = $("<div class='fth-head'></div>").appendTo($b);
    $("<span class='fth-topic'></span>").text(p.topic || "").css({ color: p.ucol || "#000", "background-color": p.bg || "" }).appendTo($h);
    $("<span class='fth-ago'></span>").attr("ago", p.data).text(ago(p.data)).appendTo($h);
    var $m = $("<div class='fth-msg'></div>").css("color", p.mcol || "").html(typeof emo === "function" ? emo(p.msg || "") : (p.msg || "")).appendTo($b);
    enhanceLinks($m);

    var $a = $("<div class='fth-acts'></div>").appendTo($b);
    $("<button type='button' class='fth-act fth-like' title='إعجاب'><img alt=''><span></span></button>").appendTo($a).find("img").attr("src", LIKE_IMG);
    $("<button type='button' class='fth-act fth-dis' title='عدم إعجاب'><img alt=''><span></span></button>").appendTo($a).find("img").attr("src", DISLIKE_IMG);
    $("<button type='button' class='fth-act fth-cm-btn' title='تعليقات'><i class='fa fa-comment-o'></i><span></span></button>").appendTo($a);
    $("<button type='button' class='fth-act fth-del fa fa-times' title='حذف'></button>").appendTo($a);

    var $cms = $("<div class='fth-cms' style='display:none'><div class='fth-cm-list'></div>" +
      "<div class='fth-cm-in'><input type='text' maxlength='200' placeholder='اكتب تعليق..'><button type='button' class='btn btn-primary fa fa-send'></button></div></div>").appendTo($b);

    var bid = p.bid;
    $post.find(".fth-like").on("click", function () { SEND_EVENT_EMIT("SEND_EVENT_EMIT_FEATHER_REACT", { bid: bid, t: "like" }); });
    $post.find(".fth-dis").on("click", function () { SEND_EVENT_EMIT("SEND_EVENT_EMIT_FEATHER_REACT", { bid: bid, t: "dislike" }); });
    $post.find(".fth-del").on("click", function () { SEND_EVENT_EMIT("SEND_EVENT_EMIT_FEATHER_DEL", { bid: bid }); });
    $post.find(".fth-cm-btn").on("click", function () { $cms.toggle(); });
    var sendCm = function () {
      var $i = $cms.find("input"), v = $i.val();
      if (!v || !v.trim()) return;
      SEND_EVENT_EMIT("SEND_EVENT_EMIT_FEATHER_COMMENT", { bid: bid, msg: v });
      $i.val("");
    };
    $cms.find("button").on("click", sendCm);
    $cms.find("input").on("keyup", function (e) { if (e.keyCode == 13) sendCm(); });

    fillActions($post, p);
    fillComments($post, p);
    return $post;
  }

  function addPost(p, isNew) {
    if (!p || !p.bid) return;
    if (posts[p.bid]) { posts[p.bid] = p; refreshPost(p.bid); return; }
    posts[p.bid] = p;
    $list.children(".fth-empty").remove();
    var $post = buildPost(p);
    $list.prepend($post);
    var all = $list.children(".fth-post");
    if (all.length > 100) { var last = all.last(); delete posts[last.attr("data-bid")]; last.remove(); }
    if (isNew) {
      var mine = false;
      try { mine = p.owner == U_CASH[M_ID].lid; } catch (e) {}
      if (!active) {
        if (!mine) { unread++; $badge.text(unread).show(); }
      } else if ($list.scrollTop() > 40 && !mine) {
        $pane.find(".fth-new").show();
      } else {
        $list.scrollTop(0);
      }
    }
  }

  function refreshPost(bid) {
    var p = posts[bid];
    var $post = $list.children(".fth-post[data-bid='" + bid + "']");
    if (!p || !$post.length) return;
    fillActions($post, p);
    fillComments($post, p);
  }

  // نقطة الدخول من x2.js
  window.FEATHER_RECV = function (d) {
    if (!d || typeof M_ID === "undefined" || !M_ID) return;
    if (!built) build();
    if (!built) return;
    switch (d.act) {
      case "list":
        // نبني القائمة كلها بعيد عن الشاشة وبعدين نبدلها مرة واحدة (من غير وميض)
        var np = {}, $tmp = $("<div></div>");
        $.each(d.list || [], function (i, p) {
          np[p.bid] = p;
          try { (new Image()).src = removegifpic(p.pic || ""); } catch (e) {} // تسخين صور البروفايل
          $tmp.prepend(buildPost(p));
        });
        posts = np;
        $list.empty().append($tmp.children());
        loaded = true;
        renderEmpty();
        break;
      case "new":
        addPost(d.post, true);
        break;
      case "react":
        if (posts[d.bid]) { posts[d.bid].likes = d.likes; posts[d.bid].dislikes = d.dislikes; refreshPost(d.bid); }
        break;
      case "comment":
        if (posts[d.bid]) { posts[d.bid].bcc = d.bcc; refreshPost(d.bid); }
        break;
      case "del":
        delete posts[d.bid];
        $list.children(".fth-post[data-bid='" + d.bid + "']").remove();
        renderEmpty();
        break;
    }
  };

  $(function () { build(); });
})();
