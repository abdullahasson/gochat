/*
 * الألعاب + نجم اكس او (عدد مرات الفوز: يومي / أسبوعي / شهري)
 *  - زر "الألعاب" في الإعدادات يفتح صفحة #games
 *  - جواها زر "نجم اكس او" يفتح #xotop (نفس شكل مبدع الحائط)
 *  - رد السيرفر بيوصل عن طريق x2.js (case "xotop") -> XOTOP_RENDER
 */
(function () {
  var PERIODS = [
    { key: "day", label: "يومي" },
    { key: "week", label: "أسبوعي" },
    { key: "month", label: "شهري" }
  ];
  var RANK_CLASS = ["xs-y", "xs-c", "xs-p"];
  var cache = {};
  var current = "day";
  var root = null;

  var BG = "background:" +
    "radial-gradient(120% 34% at 100% 0%,rgba(78,82,172,.45),rgba(78,82,172,0) 62%)," +
    "radial-gradient(90% 26% at 0% 42%,rgba(190,20,84,.38),rgba(190,20,84,0) 70%)," +
    "radial-gradient(90% 22% at 100% 100%,rgba(24,140,130,.55),rgba(24,140,130,0) 70%)," +
    "linear-gradient(180deg,#9038b4 0%,#8a2a96 18%,#7d1f70 42%,#66317c 60%,#4c4c86 76%,#2f6a8c 100%)!important;" +
    "overflow-y:auto!important;overflow-x:hidden!important;padding:0!important}";

  var css = [
    /* ===== زر الألعاب في الإعدادات ===== */
    ".gm-open{display:flex!important;align-items:center;justify-content:space-between;gap:10px;direction:rtl;cursor:pointer;color:#fff!important;",
    "margin:6px 6px 6px 4px!important;padding:9px 14px!important;width:98%;border:0!important;border-radius:14px!important;",
    "background:linear-gradient(135deg,#8e2de2 0%,#c2358f 55%,#f59e0b 120%)!important;",
    "box-shadow:0 4px 12px rgba(142,45,226,.38),inset 0 1px 0 rgba(255,255,255,.35);transition:transform .15s,box-shadow .15s;position:relative;overflow:hidden}",
    ".gm-open:active{transform:scale(.97)}",
    ".gm-open:before{content:'';position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.35),transparent);transform:skewX(-20deg);animation:gmShine 3.2s ease-in-out infinite}",
    "@keyframes gmShine{0%,55%{left:-60%}100%{left:130%}}",
    ".gm-open .gm-t{flex:1;text-align:center;font-size:16px!important;font-weight:700!important;letter-spacing:.3px;text-shadow:0 1px 2px rgba(0,0,0,.25)}",
    ".gm-open .gm-ic{flex:0 0 auto;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;",
    "background:rgba(255,255,255,.2);box-shadow:0 0 0 2px rgba(255,255,255,.25)}",
    ".gm-open .gm-ic .fa{font-family:FontAwesome!important;font-size:16px!important;color:#fff;float:none!important;margin:0!important}",
    ".gm-open .gm-cup{background:linear-gradient(180deg,#ffe27a,#f5a623);box-shadow:0 0 0 2px rgba(255,255,255,.5),0 2px 6px rgba(0,0,0,.25)}",
    ".gm-open .gm-cup .fa{color:#7a3d00;font-size:18px!important}",

    /* ===== صفحة الألعاب + صفحة نجم اكس او (خلفية مشتركة) ===== */
    "#games,#xotop{" + BG,
    "#games .xs,#xotop .xs{direction:ltr;position:relative;min-height:100%;padding:4px 5px 22px;box-sizing:border-box}",
    "#games .xs *,#xotop .xs *{box-sizing:border-box}",
    ".xs-head{position:relative;height:49px;margin:0 7px}",
    ".xs-back{position:absolute;left:0;top:0;height:38px;width:66px;padding:0 6px;border:0!important;border-radius:18px!important;",
    "background:#f9f4fa!important;color:#1e7bea!important;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;",
    "font-size:15.2px!important;box-shadow:0 1px 3px rgba(0,0,0,.12)}",
    ".xs-back .fa{font-family:FontAwesome!important;font-size:17px!important;color:#1e7bea!important;line-height:1!important}",
    ".xs-title{position:absolute;left:0;right:0;top:20px;text-align:center;color:#fff;font-size:17px!important;pointer-events:none}",

    /* قائمة الألعاب */
    ".xs-games{display:flex;flex-direction:column;gap:12px;padding:14px 10px;direction:rtl}",
    ".xs-game{display:flex;align-items:center;gap:12px;height:78px;padding:0 14px;border-radius:26px;cursor:pointer;color:#fff!important;",
    "border:1px solid rgba(255,255,255,.32);background:linear-gradient(135deg,rgba(255,255,255,.22),rgba(255,255,255,.1));",
    "box-shadow:0 4px 14px rgba(0,0,0,.15);transition:transform .15s}",
    ".xs-game:active{transform:scale(.97)}",
    ".xs-game .xs-gi{flex:0 0 52px;width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;",
    "background:linear-gradient(180deg,#ffe27a,#f5a623);box-shadow:0 0 0 3px rgba(255,255,255,.3)}",
    ".xs-game .xs-gt{flex:1;font-size:18px!important;font-weight:700;text-align:right;text-shadow:0 1px 2px rgba(0,0,0,.2)}",
    ".xs-game .xs-gs{display:block;font-size:12.5px!important;font-weight:400;opacity:.85;margin-top:2px}",
    ".xs-game .xs-ga{flex:0 0 auto;font-size:20px;opacity:.9}",

    /* التابات */
    ".xs-tabs{display:flex;direction:rtl;gap:10px;padding:0 10px;margin-top:2px}",
    ".xs-tab{flex:1;height:41px;border-radius:21px!important;border:1px solid rgba(255,255,255,.3)!important;",
    "background:rgba(255,255,255,.2)!important;color:rgba(255,255,255,.95)!important;font-size:16px!important;cursor:pointer;padding:0!important;",
    "display:flex;align-items:center;justify-content:center;outline:0}",
    ".xs-tab.on{background:linear-gradient(180deg,#edb738,#e5ab2c)!important;border-color:#f0c350!important;color:#6b3400!important;box-shadow:0 1px 4px rgba(0,0,0,.15)}",

    /* البوديوم */
    ".xs-pod{display:flex;direction:ltr;align-items:flex-end;justify-content:center;gap:6px;margin:10px 0 0;padding:0}",
    ".xs-card{width:110px;flex:0 0 110px;border-radius:24px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.14);",
    "display:flex;flex-direction:column;align-items:center;padding:0 5px 5px;text-align:center;box-shadow:0 4px 14px rgba(0,0,0,.1)}",
    ".xs-card.c1{width:118px;flex:0 0 118px;margin-bottom:6px;padding-bottom:8px;background:linear-gradient(180deg,rgba(255,200,120,.3),rgba(255,130,45,.38))}",
    ".xs-lbl{height:32px;display:flex;align-items:center;justify-content:center;gap:5px;font-size:16px!important;color:#f6e9ff}",
    ".xs-card.c1 .xs-lbl{height:34px;color:#fbe7a8;font-size:17px!important}",
    ".xs-card.c3 .xs-lbl{color:#fbe3f0}",
    ".xs-lbl .xs-m{font-size:17px!important;line-height:1!important}",
    ".xs-pav{width:55px;height:55px;border-radius:50%!important;border:3px solid #d3e3fa;object-fit:cover;background:#5a3a78;display:block}",
    ".xs-card.c1 .xs-pav{width:68px;height:68px;border-color:#f7e787}",
    ".xs-card.c3 .xs-pav{border-color:#f7dcef}",
    ".xs-pn{margin-top:6px;width:100%;font-size:17px!important;line-height:1.4!important;color:#f3e8fb;word-break:break-word;overflow-wrap:anywhere;",
    "display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden}",
    ".xs-card.c1 .xs-pn{margin-top:8px;color:#fbe2a6}",
    ".xs-card.c3 .xs-pn{color:#fde4f1}",
    ".xs-pc{margin-top:3px;min-width:34px;height:34px;padding:0 11px;border-radius:999px;display:flex;align-items:center;justify-content:center;gap:5px;",
    "background:rgba(150,100,170,.55);border:1px solid rgba(255,255,255,.3);color:#fff;font-size:17px!important}",
    ".xs-card.c1 .xs-pc{margin-top:4px;min-width:51px;height:32px;padding:0 12px;font-size:18px!important;color:#fde9b8;background:linear-gradient(180deg,#d98445,#bf6232);border-color:rgba(255,214,140,.7)}",
    ".xs-card.c3 .xs-pc{background:#b04688;border-color:rgba(255,200,230,.7);color:#fff0f8}",

    /* الصفوف */
    ".xs-list{margin:9px -5px 0;padding:6px 5px 0;border-top:1px solid rgba(255,255,255,.12);display:flex;flex-direction:column;gap:8px}",
    ".xs-row{height:73px;border-radius:37px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.12);display:flex;align-items:center;padding:0 15px;direction:ltr}",
    ".xs-rk{flex:0 0 38px;width:38px;height:38px;border-radius:50%!important;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px!important;box-shadow:0 1px 3px rgba(0,0,0,.18)}",
    ".xs-rk.xs-y{background:linear-gradient(180deg,#fbe04a,#eab81b)}",
    ".xs-rk.xs-c{background:linear-gradient(180deg,#5fdaee,#2bb6d2)}",
    ".xs-rk.xs-p{background:linear-gradient(180deg,#f46fb4,#e0407f)}",
    ".xs-av{flex:0 0 48px;width:48px;height:48px;margin-left:16px;border-radius:50%!important;border:2.5px solid #fff;object-fit:cover;background:#5a3a78;box-shadow:0 0 0 3px rgba(255,255,255,.28)}",
    ".xs-nm{flex:1;min-width:0;margin-left:13px;margin-right:8px;text-align:left;color:#fff;font-size:15px!important;font-weight:400!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".xs-ct{flex:0 0 auto;min-width:35px;height:34px;padding:0 10px;border-radius:999px;display:flex;align-items:center;justify-content:center;gap:5px;",
    "background:rgba(255,255,255,.22);border:1px solid rgba(255,255,255,.28);color:#fff;font-size:16px!important}",
    ".xs-empty{margin:60px 20px 0;text-align:center;color:rgba(255,255,255,.9);font-size:16px!important;direction:rtl}",
    "#xotop .xs.xs-ld .xs-pod,#xotop .xs.xs-ld .xs-list{opacity:.55;transition:opacity .15s}"
  ].join("");

  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pic(p) {
    p = p || "site/pic.png";
    try { if (typeof removegifpic === "function") return removegifpic(p); } catch (e) { }
    return p;
  }
  function label(key) {
    for (var i = 0; i < PERIODS.length; i++) if (PERIODS[i].key === key) return PERIODS[i].label;
    return "";
  }
  function cnt(n) { return '<span>🏆</span><span>' + esc(n) + '</span>'; }

  /* ---------- صفحة الألعاب ---------- */
  function buildGames() {
    var $p = $("#games");
    if (!$p.length) return;
    $p.html(
      '<div class="xs">' +
        '<div class="xs-head">' +
          '<button type="button" class="xs-back" title="الإعدادات" data-toggle="tab" data-target="#settings" ' +
            "onclick=\"$('.pnhead').text($(this).attr('title'));$('.dpnl').show();\">" +
            '<i class="fa fa-arrow-left"></i><span>عودة</span></button>' +
          '<div class="xs-title">الألعاب 🏆</div>' +
        '</div>' +
        '<div class="xs-games">' +
          '<div class="xs-game" title="نجم اكس او" data-toggle="tab" data-target="#xotop" ' +
            "onclick=\"$('.pnhead').text($(this).attr('title'));$('.dpnl').show();XOTOP_LOAD();\">" +
            '<div class="xs-gi">🏆</div>' +
            '<div class="xs-gt">نجم اكس او<span class="xs-gs">أكثر الأعضاء فوزاً في ❌⭕</span></div>' +
            '<div class="xs-ga">❮</div>' +
          '</div>' +
          /* [ADDED] بوت مسابقات برب — اتنقل من إعدادات المستخدم (نفس صلاحية bootedit عن طريق كلاس brbbot) */
          '<div class="xs-game xs-bot brbbot" title="بوت مسابقات برب" onclick="BOTM_OPEN()">' +
            '<div class="xs-gi">🤖</div>' +
            '<div class="xs-gt">بوت برب<span class="xs-gs">شغّل أو أوقف مسابقة الأرقام في الغرف</span></div>' +
            '<div class="xs-live" title="البوت شغال">LIVE</div>' +
            '<div class="xs-ga">❮</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  /* ---------- صفحة نجم اكس او ---------- */
  function buildTop() {
    var $p = $("#xotop");
    if (!$p.length) return false;
    var tabs = PERIODS.map(function (x) {
      return '<button type="button" class="xs-tab" data-p="' + x.key + '">' + x.label + "</button>";
    }).join("");
    $p.html(
      '<div class="xs" id="xs-root">' +
        '<div class="xs-head">' +
          '<button type="button" class="xs-back" title="الألعاب" data-toggle="tab" data-target="#games" ' +
            "onclick=\"$('.pnhead').text($(this).attr('title'));$('.dpnl').show();\">" +
            '<i class="fa fa-arrow-left"></i><span>عودة</span></button>' +
          '<div class="xs-title" id="xs-title"></div>' +
        '</div>' +
        '<div class="xs-tabs">' + tabs + "</div>" +
        '<div class="xs-pod" id="xs-pod"></div>' +
        '<div class="xs-list" id="xs-list"></div>' +
      "</div>"
    );
    root = $("#xs-root");
    root.find(".xs-tab").on("click", function () { load($(this).attr("data-p")); });
    return true;
  }

  function podium(u, cls, name, medal) {
    if (!u) return "";
    return '<div class="xs-card ' + cls + '">' +
      '<div class="xs-lbl"><span class="xs-m">' + medal + "</span> " + name + "</div>" +
      '<img class="xs-pav" src="' + esc(pic(u.pic)) + '" onerror="this.onerror=null;this.src=\'site/pic.png\'">' +
      '<div class="xs-pn">' + esc(u.topic) + "</div>" +
      '<div class="xs-pc">' + cnt(u.cnt) + "</div></div>";
  }

  function paint(period, list) {
    if (!root) return;
    root.removeClass("xs-ld");
    root.find(".xs-tab").removeClass("on").filter("[data-p='" + period + "']").addClass("on");
    $("#xs-title").text("نجم اكس او — " + label(period));
    list = list || [];
    if (!list.length) {
      $("#xs-pod").html('<div class="xs-empty" style="width:100%">لا يوجد فائزين في هذه الفترة بعد 🎮</div>');
      $("#xs-list").empty();
      return;
    }
    $("#xs-pod").html(
      podium(list[1], "c2", "الثاني", "🥈") +
      podium(list[0], "c1", "الأول", "🥇") +
      podium(list[2], "c3", "الثالث", "🥉")
    );
    var h = "";
    for (var i = 3; i < list.length; i++) {
      var u = list[i];
      h += '<div class="xs-row">' +
        '<div class="xs-rk ' + RANK_CLASS[(i - 3) % 3] + '">' + (i + 1) + "</div>" +
        '<img class="xs-av" src="' + esc(pic(u.pic)) + '" onerror="this.onerror=null;this.src=\'site/pic.png\'">' +
        '<div class="xs-nm">' + esc(u.topic) + "</div>" +
        '<div class="xs-ct">' + cnt(u.cnt) + "</div></div>";
    }
    $("#xs-list").html(h);
  }

  function load(period) {
    if (!root && !buildTop()) return;
    current = period || current || "day";
    if (cache[current]) paint(current, cache[current]);
    else {
      root.addClass("xs-ld");
      root.find(".xs-tab").removeClass("on").filter("[data-p='" + current + "']").addClass("on");
      $("#xs-title").text("نجم اكس او — " + label(current));
    }
    try { SEND_EVENT_EMIT("SEND_EVENT_EMIT_XOSTAR", { period: current }); } catch (e) { }
  }


  /* ===================== [ADDED] نافذة بوت برب ===================== */
  var cssBot = [
    /* كارت اللعبة في صفحة الألعاب */
    ".xs-game.brbbot{display:none}",
    ".xs-game.xs-bot .xs-gi{background:linear-gradient(180deg,#8ff5cb,#1fb98a);font-size:26px}",
    ".xs-game.xs-bot{background:linear-gradient(135deg,rgba(60,220,170,.26),rgba(255,255,255,.1))}",
    ".xs-game .xs-live{display:none;flex:0 0 auto;padding:3px 9px;border-radius:999px;font-size:11px!important;font-weight:700;letter-spacing:.6px;",
    "background:#22c55e;color:#fff;box-shadow:0 0 0 0 rgba(34,197,94,.7);animation:bmPulse 1.6s infinite}",
    ".xs-game.xs-bot.on .xs-live{display:block}",
    "@keyframes bmPulse{0%{box-shadow:0 0 0 0 rgba(34,197,94,.65)}70%{box-shadow:0 0 0 9px rgba(34,197,94,0)}100%{box-shadow:0 0 0 0 rgba(34,197,94,0)}}",

    /* الخلفية */
    ".bm-ov{position:fixed;inset:0;z-index:2000000;display:none;align-items:center;justify-content:center;padding:14px;direction:rtl;",
    "background:rgba(14,6,32,.66);-webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px);opacity:0;transition:opacity .22s ease}",
    ".bm-ov.bm-show{opacity:1}",
    /* الصندوق */
    ".bm-box{position:relative;width:100%;max-width:370px;max-height:94vh;overflow-y:auto;overflow-x:hidden;border-radius:28px;padding:0 0 18px;color:#fff;",
    "background:radial-gradient(120% 60% at 100% 0%,rgba(120,90,255,.5),rgba(120,90,255,0) 60%),radial-gradient(90% 50% at 0% 100%,rgba(30,200,160,.35),rgba(30,200,160,0) 65%),",
    "linear-gradient(165deg,#43206f 0%,#5a2a86 45%,#2f3f86 100%);",
    "border:1px solid rgba(255,255,255,.28);box-shadow:0 24px 60px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.3);",
    "transform:translateY(26px) scale(.92);opacity:0;transition:transform .32s cubic-bezier(.2,1.2,.3,1),opacity .22s ease}",
    ".bm-ov.bm-show .bm-box{transform:none;opacity:1}",
    ".bm-box *{box-sizing:border-box}",
    ".bm-box .fa{font-family:FontAwesome!important;float:none!important;margin:0!important}",
    ".bm-x{position:absolute;top:12px;left:12px;z-index:3;width:34px;height:34px;border-radius:50%!important;border:0!important;cursor:pointer;padding:0!important;",
    "display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.18)!important;color:#fff!important;font-size:16px!important;transition:background .15s,transform .15s}",
    ".bm-x:hover{background:rgba(255,255,255,.3)!important}.bm-x:active{transform:scale(.9)}",

    /* الهيدر */
    ".bm-hero{display:flex;flex-direction:column;align-items:center;padding:26px 18px 14px;text-align:center}",
    ".bm-av{position:relative;width:92px;height:92px;border-radius:50%;padding:4px;background:linear-gradient(135deg,#8ff5cb,#7c5cff 60%,#f59e0b);box-shadow:0 8px 22px rgba(0,0,0,.35)}",
    ".bm-av img{width:100%;height:100%;border-radius:50%!important;object-fit:cover;background:#2b1850;display:block;border:3px solid #2b1850}",
    ".bm-box.run .bm-av:after{content:'';position:absolute;inset:-6px;border-radius:50%;border:2px solid rgba(34,197,94,.8);animation:bmRing 1.8s ease-out infinite}",
    "@keyframes bmRing{0%{transform:scale(.92);opacity:.9}100%{transform:scale(1.22);opacity:0}}",
    ".bm-ti{margin-top:12px;font-size:20px!important;font-weight:700;text-shadow:0 2px 6px rgba(0,0,0,.3)}",
    ".bm-pill{margin-top:8px;display:inline-flex;align-items:center;gap:7px;padding:4px 13px;border-radius:999px;font-size:13px!important;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.25)}",
    ".bm-pill i{width:8px;height:8px;border-radius:50%;background:#f87171;display:block}",
    ".bm-box.run .bm-pill{background:rgba(34,197,94,.22);border-color:rgba(74,222,128,.6)}",
    ".bm-box.run .bm-pill i{background:#4ade80;box-shadow:0 0 8px #4ade80}",

    /* شرح اللعبة */
    ".bm-how{display:flex;gap:10px;align-items:flex-start;margin:4px 16px 14px;padding:11px 13px;border-radius:16px;font-size:13.5px!important;line-height:1.7;",
    "background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);color:#efe6ff}",
    ".bm-how .fa{flex:0 0 auto;margin-top:4px!important;color:#fcd34d;font-size:16px!important}",
    ".bm-how b{color:#fcd34d}",

    /* الحقول */
    ".bm-f{margin:0 16px 13px}",
    ".bm-lb{display:flex;align-items:center;gap:7px;margin-bottom:7px;font-size:14px!important;font-weight:600;color:#f3e8ff}",
    ".bm-lb .fa{color:#c4b5fd;font-size:15px!important}",
    ".bm-sel{position:relative}",
    ".bm-sel select{width:100%;height:46px;padding:0 16px 0 40px;border-radius:15px!important;border:1px solid rgba(255,255,255,.3)!important;outline:0;cursor:pointer;",
    "-webkit-appearance:none;appearance:none;background:rgba(255,255,255,.14)!important;color:#fff!important;font-size:15px!important;text-align:right;text-align-last:right;box-shadow:none!important}",
    ".bm-sel select option{color:#222;background:#fff}",
    ".bm-sel select:focus{border-color:#a78bfa!important;box-shadow:0 0 0 3px rgba(167,139,250,.28)!important}",
    ".bm-sel:after{content:'\\f107';font-family:FontAwesome;position:absolute;left:15px;top:50%;transform:translateY(-50%);font-size:20px;color:#ddd0ff;pointer-events:none}",
    ".bm-step{display:flex;align-items:center;gap:8px;direction:ltr}",
    ".bm-sb{flex:0 0 46px;height:46px;border-radius:15px!important;border:1px solid rgba(255,255,255,.3)!important;cursor:pointer;padding:0!important;font-size:17px!important;",
    "display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.18)!important;color:#fff!important;transition:transform .12s,background .15s}",
    ".bm-sb:active{transform:scale(.9);background:rgba(255,255,255,.3)!important}",
    ".bm-step input{flex:1;min-width:0;height:46px;text-align:center;border-radius:15px!important;border:1px solid rgba(255,255,255,.3)!important;outline:0;",
    "background:rgba(0,0,0,.22)!important;color:#fff!important;font-size:22px!important;font-weight:700;box-shadow:none!important;-moz-appearance:textfield}",
    ".bm-step input::-webkit-outer-spin-button,.bm-step input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}",
    ".bm-step input:focus{border-color:#a78bfa!important;box-shadow:0 0 0 3px rgba(167,139,250,.28)!important}",
    ".bm-chips{display:flex;gap:8px;margin-top:9px;direction:rtl}",
    ".bm-chip{flex:1;height:34px;border-radius:999px!important;border:1px solid rgba(255,255,255,.28)!important;cursor:pointer;padding:0!important;font-size:14px!important;",
    "background:rgba(255,255,255,.12)!important;color:#fff!important;transition:all .15s}",
    ".bm-chip.on{background:linear-gradient(180deg,#fcd34d,#f59e0b)!important;color:#5b2d00!important;border-color:#fde68a!important;font-weight:700}",
    ".bm-err{display:none;margin:0 16px 10px;padding:8px 12px;border-radius:12px;font-size:13px!important;background:rgba(239,68,68,.25);border:1px solid rgba(248,113,113,.6);color:#ffe4e6}",
    ".bm-err.show{display:block;animation:bmShake .35s}",
    "@keyframes bmShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}",
    ".bm-box.run .bm-f{opacity:.5;pointer-events:none}",

    /* الأزرار */
    ".bm-act{margin:6px 16px 0}",
    ".bm-go,.bm-stop{width:100%;height:52px;border-radius:18px!important;border:0!important;cursor:pointer;padding:0!important;color:#fff!important;font-size:17px!important;font-weight:700;",
    "display:flex;align-items:center;justify-content:center;gap:10px;transition:transform .14s,filter .15s;text-shadow:0 1px 2px rgba(0,0,0,.25)}",
    ".bm-go{background:linear-gradient(135deg,#22c55e,#10b981 60%,#0ea5a4)!important;box-shadow:0 8px 20px rgba(16,185,129,.45),inset 0 1px 0 rgba(255,255,255,.4)}",
    ".bm-stop{background:linear-gradient(135deg,#f43f5e,#e11d48 60%,#be123c)!important;box-shadow:0 8px 20px rgba(225,29,72,.45),inset 0 1px 0 rgba(255,255,255,.35)}",
    ".bm-go:hover,.bm-stop:hover{filter:brightness(1.08)}.bm-go:active,.bm-stop:active{transform:scale(.97)}",
    ".bm-go .fa,.bm-stop .fa{font-size:17px!important}"
  ].join("");

  var botRun = 0;

  function botApply() {
    var on = !!botRun;
    $("#botm .bm-box").toggleClass("run", on);
    $("#bm-pill span").text(on ? "يعمل الآن" : "متوقف");
    $(".xs-game.xs-bot").toggleClass("on", on);
    $("#botm .bot_1").css("display", on ? "none" : "flex");
    $("#botm .bot_2").css("display", on ? "flex" : "none");
  }

  function botBuild() {
    if ($("#botm").length) return;
    var chips = [5, 10, 15, 20].map(function (n) {
      return '<button type="button" class="bm-chip" data-n="' + n + '">' + n + "</button>";
    }).join("");
    $("body").append(
      '<div id="botm" class="bm-ov" dir="rtl">' +
        '<div class="bm-box" role="dialog" aria-modal="true" aria-label="بوت مسابقات برب">' +
          '<button type="button" class="bm-x" aria-label="إغلاق"><i class="fa fa-times"></i></button>' +
          '<div class="bm-hero">' +
            '<div class="bm-av"><img src="imgs/bootbrb.png" alt="" onerror="this.onerror=null;this.src=\'site/pic.png\'"></div>' +
            '<div class="bm-ti">بوت مسابقات برب</div>' +
            '<div class="bm-pill" id="bm-pill"><i></i><span>متوقف</span></div>' +
          "</div>" +
          '<div class="bm-how"><i class="fa fa-lightbulb-o"></i>' +
            "<span>هو عبارة عن بوت آلي يقوم بإرسال الأرقام في الغرف.<br>طريقة اللعب: اكتب كلمة <b>برب</b> بعد الرقم <b>3</b></span></div>" +
          '<div class="bm-f"><div class="bm-lb"><i class="fa fa-home"></i>الغرفة</div>' +
            '<div class="bm-sel"><select class="roombrb"></select></div></div>' +
          '<div class="bm-f"><div class="bm-lb"><i class="fa fa-trophy"></i>نقاط الجولة للفوز</div>' +
            '<div class="bm-step">' +
              '<button type="button" class="bm-sb" data-d="1" aria-label="زيادة"><i class="fa fa-plus"></i></button>' +
              '<input id="bm-pts" type="number" inputmode="numeric" min="1" max="999" value="5">' +
              '<button type="button" class="bm-sb" data-d="-1" aria-label="نقصان"><i class="fa fa-minus"></i></button>' +
            "</div>" +
            '<div class="bm-chips">' + chips + "</div></div>" +
          '<div class="bm-err" id="bm-err"></div>' +
          '<div class="bm-act">' +
            '<button type="button" class="bm-go bot_1" onclick="StartBoot()"><i class="fa fa-play"></i><span>تشغيل البوت</span></button>' +
            '<button type="button" class="bm-stop bot_2" style="display:none" onclick="StopBoot()"><i class="fa fa-stop"></i><span>إيقاف البوت</span></button>' +
          "</div>" +
        "</div>" +
      "</div>"
    );
    var $ov = $("#botm");
    $ov.on("click", function (e) { if (e.target === this) BOTM_CLOSE(); });
    $ov.find(".bm-x").on("click", function () { BOTM_CLOSE(); });
    function sync() {
      var v = parseInt($("#bm-pts").val(), 10);
      $ov.find(".bm-chip").each(function () { $(this).toggleClass("on", Number($(this).attr("data-n")) === v); });
    }
    $ov.find(".bm-sb").on("click", function () {
      var v = parseInt($("#bm-pts").val(), 10) || 0;
      v = Math.min(999, Math.max(1, v + Number($(this).attr("data-d"))));
      $("#bm-pts").val(v); sync();
    });
    $ov.find(".bm-chip").on("click", function () { $("#bm-pts").val($(this).attr("data-n")); sync(); });
    $("#bm-pts").on("input", function () { $("#bm-err").removeClass("show"); sync(); });
    $(document).on("keydown.botm", function (e) { if (e.which === 27 && $ov.hasClass("bm-show")) BOTM_CLOSE(); });
    sync();
    botApply();
  }

  window.BOTM_OPEN = function () {
    botBuild();
    try { ShowRooms(); } catch (e) { }
    $("#bm-err").removeClass("show");
    var $ov = $("#botm");
    $ov.css("display", "flex");
    void $ov[0].offsetWidth; // reflow عشان الأنيميشن
    $ov.addClass("bm-show");
    botApply();
  };
  window.BOTM_CLOSE = function () {
    var $ov = $("#botm");
    $ov.removeClass("bm-show");
    setTimeout(function () { if (!$ov.hasClass("bm-show")) $ov.css("display", "none"); }, 240);
  };
  window.BOTM_ERR = function (m) {
    $("#bm-err").text(m).removeClass("show");
    void $("#bm-err")[0].offsetWidth;
    $("#bm-err").addClass("show");
  };
  // بيستدعيها x2.js لما يوصل brbstate من السيرفر (0 = متوقف / 1 = شغال)
  window.BOTM_STATE = function (v) { botRun = v ? 1 : 0; botApply(); };

  // بيستدعيها x2.js لما يوصل رد السيرفر
  window.XOTOP_RENDER = function (d) {
    if (!d) return;
    cache[d.period] = d.list || [];
    if (d.period === current) paint(current, cache[current]);
  };
  // بيتنادى لما تفتح الصفحة (بيجيب أحدث نتيجة كل مرة)
  window.XOTOP_LOAD = function () { load(current); };

  $(function () {
    var st = document.createElement("style");
    st.id = "xs-css";
    st.appendChild(document.createTextNode(css + cssBot));
    document.head.appendChild(st);
    buildGames();
    buildTop();
    botBuild();
  });
})();
