/*
 * مبدع الحائط — يومي / أسبوعي / شهري
 * بيبني الواجهة جوه #top10 ويستبدل GET_TOP_BAR القديمة.
 * الرد من السيرفر بيوصل عن طريق x2.js (case "walltop") -> WALLTOP_RENDER
 */
(function () {
  var PERIODS = [
    { key: "day", label: "يومي" },
    { key: "week", label: "أسبوعي" },
    { key: "month", label: "شهري" }
  ];
  var RANK_CLASS = ["wt-y", "wt-c", "wt-p"]; // أصفر / سماوي / وردي بالتبادل من المركز 4
  var cache = {};
  var current = "day";
  var root = null;

  var css = [
    "#top10{background:",
    "radial-gradient(120% 34% at 100% 0%,rgba(78,82,172,.45),rgba(78,82,172,0) 62%),",
    "radial-gradient(90% 26% at 0% 42%,rgba(190,20,84,.38),rgba(190,20,84,0) 70%),",
    "radial-gradient(90% 22% at 100% 100%,rgba(24,140,130,.55),rgba(24,140,130,0) 70%),",
    "linear-gradient(180deg,#9038b4 0%,#8a2a96 18%,#7d1f70 42%,#66317c 60%,#4c4c86 76%,#2f6a8c 100%)!important;",
    "overflow-y:auto!important;overflow-x:hidden!important;padding:0!important}",
    "#top10 .wt{direction:ltr;position:relative;min-height:100%;padding:4px 5px 22px;box-sizing:border-box}",
    "#top10 .wt *{box-sizing:border-box}",

    /* الهيدر: زر عودة + العنوان */
    "#top10 .wt-head{position:relative;height:49px;margin:0 7px}",
    "#top10 .wt-back{position:absolute;left:0;top:0;height:38px;width:66px;padding:0 6px;border:0!important;border-radius:18px!important;",
    "background:#f9f4fa!important;color:#1e7bea!important;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;",
    "font-size:15.2px!important;box-shadow:0 1px 3px rgba(0,0,0,.12)}",
    "#top10 .wt-back .fa{font-family:FontAwesome!important;font-size:17px!important;color:#1e7bea!important;line-height:1!important}",
    "#top10 .wt-title{position:absolute;left:0;right:0;top:20px;text-align:center;color:#fff;font-size:17px!important;pointer-events:none}",

    /* التابات */
    "#top10 .wt-tabs{display:flex;direction:rtl;gap:10px;padding:0 10px;margin-top:2px}",
    "#top10 .wt-tab{flex:1;height:41px;border-radius:21px!important;border:1px solid rgba(255,255,255,.3)!important;",
    "background:rgba(255,255,255,.2)!important;color:rgba(255,255,255,.95)!important;font-size:16px!important;cursor:pointer;padding:0!important;",
    "display:flex;align-items:center;justify-content:center;outline:0}",
    "#top10 .wt-tab.on{background:linear-gradient(180deg,#edb738,#e5ab2c)!important;border-color:#f0c350!important;color:#6b3400!important;",
    "box-shadow:0 1px 4px rgba(0,0,0,.15)}",

    /* البوديوم */
    "#top10 .wt-pod{display:flex;direction:ltr;align-items:flex-end;justify-content:center;gap:6px;margin:10px 0 0;padding:0}",
    "#top10 .wt-card{width:110px;flex:0 0 110px;border-radius:24px;border:1px solid rgba(255,255,255,.3);",
    "background:rgba(255,255,255,.14);display:flex;flex-direction:column;align-items:center;padding:0 5px 5px;text-align:center;",
    "box-shadow:0 4px 14px rgba(0,0,0,.1)}",
    "#top10 .wt-card.c1{width:118px;flex:0 0 118px;margin-bottom:6px;padding-bottom:8px;",
    "background:linear-gradient(180deg,rgba(255,200,120,.3),rgba(255,130,45,.38))}",
    "#top10 .wt-lbl{height:32px;display:flex;align-items:center;justify-content:center;gap:5px;font-size:16px!important;color:#f6e9ff}",
    "#top10 .wt-card.c1 .wt-lbl{height:34px;color:#fbe7a8;font-size:17px!important}",
    "#top10 .wt-card.c3 .wt-lbl{color:#fbe3f0}",
    "#top10 .wt-lbl .wt-m{font-size:17px!important;line-height:1!important}",
    "#top10 .wt-pav{width:55px;height:55px;border-radius:50%!important;border:3px solid #d3e3fa;object-fit:cover;background:#5a3a78;display:block}",
    "#top10 .wt-card.c1 .wt-pav{width:68px;height:68px;border-color:#f7e787}",
    "#top10 .wt-card.c3 .wt-pav{border-color:#f7dcef}",
    "#top10 .wt-pn{margin-top:6px;width:100%;font-size:17px!important;line-height:1.4!important;color:#f3e8fb;word-break:break-word;overflow-wrap:anywhere;",
    "display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden}",
    "#top10 .wt-card.c1 .wt-pn{margin-top:8px;color:#fbe2a6}",
    "#top10 .wt-card.c3 .wt-pn{color:#fde4f1}",
    "#top10 .wt-pc{margin-top:3px;min-width:34px;height:34px;padding:0 11px;border-radius:999px;display:flex;align-items:center;justify-content:center;",
    "background:rgba(150,100,170,.55);border:1px solid rgba(255,255,255,.3);color:#fff;font-size:17px!important}",
    "#top10 .wt-card.c1 .wt-pc{margin-top:4px;min-width:51px;height:32px;padding:0 12px;font-size:18px!important;color:#fde9b8;",
    "background:linear-gradient(180deg,#d98445,#bf6232);border-color:rgba(255,214,140,.7)}",
    "#top10 .wt-card.c3 .wt-pc{min-width:34px;background:#b04688;border-color:rgba(255,200,230,.7);color:#fff0f8}",

    /* الصفوف */
    "#top10 .wt-list{margin:9px -5px 0;padding:6px 5px 0;border-top:1px solid rgba(255,255,255,.12);display:flex;flex-direction:column;gap:8px}",
    "#top10 .wt-row{height:73px;border-radius:37px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.12);",
    "display:flex;align-items:center;padding:0 15px;direction:ltr}",
    "#top10 .wt-rk{flex:0 0 38px;width:38px;height:38px;border-radius:50%!important;display:flex;align-items:center;justify-content:center;color:#fff;",
    "font-size:16px!important;box-shadow:0 1px 3px rgba(0,0,0,.18)}",
    "#top10 .wt-rk.wt-y{background:linear-gradient(180deg,#fbe04a,#eab81b)}",
    "#top10 .wt-rk.wt-c{background:linear-gradient(180deg,#5fdaee,#2bb6d2)}",
    "#top10 .wt-rk.wt-p{background:linear-gradient(180deg,#f46fb4,#e0407f)}",
    "#top10 .wt-av{flex:0 0 48px;width:48px;height:48px;margin-left:16px;border-radius:50%!important;border:2.5px solid #fff;object-fit:cover;background:#5a3a78;",
    "box-shadow:0 0 0 3px rgba(255,255,255,.28)}",
    "#top10 .wt-nm{flex:1;min-width:0;margin-left:13px;margin-right:8px;text-align:left;color:#fff;font-size:15px!important;font-weight:400!important;",
    "white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    "#top10 .wt-ct{flex:0 0 auto;min-width:35px;height:34px;padding:0 9px;border-radius:999px;display:flex;align-items:center;justify-content:center;",
    "background:rgba(255,255,255,.22);border:1px solid rgba(255,255,255,.28);color:#fff;font-size:16px!important}",

    "#top10 .wt-empty{margin:60px 20px 0;text-align:center;color:rgba(255,255,255,.9);font-size:16px!important;direction:rtl}",
    "#top10 .wt.wt-ld .wt-pod,#top10 .wt.wt-ld .wt-list{opacity:.55;transition:opacity .15s}"
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

  function podium(u, cls, name, medal) {
    if (!u) return "";
    return '<div class="wt-card ' + cls + '">' +
      '<div class="wt-lbl"><span class="wt-m">' + medal + "</span> " + name + "</div>" +
      '<img class="wt-pav" src="' + esc(pic(u.pic)) + '" onerror="this.onerror=null;this.src=\'site/pic.png\'">' +
      '<div class="wt-pn">' + esc(window.uhideName ? uhideName(u) : u.topic) + "</div>" +
      '<div class="wt-pc">' + esc(u.cnt) + "</div></div>";
  }

  function build() {
    var $p = $("#top10");
    if (!$p.length) return false;
    var tabs = PERIODS.map(function (x) {
      return '<button type="button" class="wt-tab" data-p="' + x.key + '">' + x.label + "</button>";
    }).join("");
    $p.html(
      '<div class="wt" id="wt-root">' +
      '<div class="wt-head">' +
      '<button type="button" class="wt-back" title="الحائط" data-toggle="tab" data-target="#wall" ' +
      "onclick=\"$('.pnhead').text($(this).attr('title'));$('.dpnl').show();\">" +
      '<i class="fa fa-arrow-left"></i><span>عودة</span></button>' +
      '<div class="wt-title" id="wt-title"></div></div>' +
      '<div class="wt-tabs">' + tabs + "</div>" +
      '<div class="wt-pod" id="wt-pod"></div>' +
      '<div class="wt-list" id="wt-list"></div>' +
      "</div>"
    );
    root = $("#wt-root");
    root.find(".wt-tab").on("click", function () { load($(this).attr("data-p")); });
    return true;
  }

  function paint(period, list) {
    if (!root) return;
    root.removeClass("wt-ld");
    root.find(".wt-tab").removeClass("on").filter("[data-p='" + period + "']").addClass("on");
    $("#wt-title").text("مبدع الحائط — " + label(period));
    list = list || [];
    if (!list.length) {
      $("#wt-pod").html('<div class="wt-empty" style="width:100%">لا يوجد نشاط على الحائط في هذه الفترة</div>');
      $("#wt-list").empty();
      return;
    }
    $("#wt-pod").html(
      podium(list[1], "c2", "الثاني", "🥈") +
      podium(list[0], "c1", "الأول", "🥇") +
      podium(list[2], "c3", "الثالث", "🥉")
    );
    var h = "";
    for (var i = 3; i < list.length; i++) {
      var u = list[i];
      h += '<div class="wt-row">' +
        '<div class="wt-rk ' + RANK_CLASS[(i - 3) % 3] + '">' + (i + 1) + "</div>" +
        '<img class="wt-av" src="' + esc(pic(u.pic)) + '" onerror="this.onerror=null;this.src=\'site/pic.png\'">' +
        '<div class="wt-nm">' + esc(window.uhideName ? uhideName(u) : u.topic) + "</div>" +
        '<div class="wt-ct">' + esc(u.cnt) + "</div></div>";
    }
    $("#wt-list").html(h);
  }

  function load(period) {
    if (!root && !build()) return;
    current = period || current || "day";
    if (cache[current]) paint(current, cache[current]); // عرض فوري من آخر نتيجة
    else {
      root.addClass("wt-ld");
      root.find(".wt-tab").removeClass("on").filter("[data-p='" + current + "']").addClass("on");
      $("#wt-title").text("مبدع الحائط — " + label(current));
    }
    try { SEND_EVENT_EMIT("SEND_EVENT_EMIT_WALL_TOP", { period: current }); } catch (e) { }
  }

  // بيستدعيها x2.js لما يوصل رد السيرفر
  window.WALLTOP_RENDER = function (d) {
    if (!d) return;
    cache[d.period] = d.list || [];
    if (d.period === current) paint(current, cache[current]);
  };

  // استبدال الدالة القديمة (اللي كانت بتطلب الـ top القديم)
  window.GET_TOP_BAR = function () { load(current); };

  $(function () {
    var st = document.createElement("style");
    st.id = "wt-css";
    st.appendChild(document.createTextNode(css));
    document.head.appendChild(st);
    build();
  });
})();
