/*
 * ترند الحائط — يومي / أسبوعي / شهري
 * 3 أقسام: الأكثر نشراً · الأكثر دردشة في الحائط · الأكثر حصولاً على إعجابات (أول 3 في كل قسم)
 * الصفحة #wtrend بتتفتح من "الاضافات والميزات". رد السيرفر بيوصل عن طريق x2.js (case "walltrend") -> WALLTREND_RENDER
 */
(function () {
  var PERIODS = [
    { key: "day", label: "يومي", when: "اليوم" },
    { key: "week", label: "أسبوعي", when: "هذا الأسبوع" },
    { key: "month", label: "شهري", when: "هذا الشهر" }
  ];
  var SECTIONS = [
    { key: "post", cls: "y", ico: "📌", title: function (w) { return "الأكثر نشرًا " + w; }, unit: "منشور" },
    { key: "chat", cls: "c", ico: "💬", title: function (w) { return "الأكثر دردشة في الحائط " + w; }, unit: "دردشة" },
    { key: "like", cls: "p", ico: "❤️", title: function (w) { return "الأكثر حصولاً على إعجابات " + w; }, unit: "إعجاب" }
  ];
  var MEDALS = ["🥇", "🥈", "🥉"];
  var cache = {};
  var current = "day";
  var root = null;

  var css = [
    "#wtrend{background:linear-gradient(180deg,#fdf6e0 0%,#f2f6fc 22%,#f6f8fc 100%)!important;overflow-y:auto!important;overflow-x:hidden!important;padding:0!important}",
    "#wtrend .wr{direction:rtl;min-height:100%;padding:6px 3px 18px;box-sizing:border-box;font-family:inherit}",
    "#wtrend .wr *{box-sizing:border-box}",
    "#wtrend .wr-back{display:inline-flex;align-items:center;gap:6px;height:34px;margin-right:3px;padding:0 12px;border:1px solid #e3e8f2!important;border-radius:20px!important;background:#fff!important;color:#1e7bea!important;cursor:pointer;font-size:16px!important;box-shadow:0 1px 4px rgba(0,0,0,.08)}",
    "#wtrend .wr-back .fa{font-family:FontAwesome!important;color:#1e7bea!important;font-size:17px!important}",
    "#wtrend .wr-title{margin:6px 0 6px;text-align:center;color:#2a3350;font-size:17px!important}",
    "#wtrend .wr-tabs{display:flex;gap:6px;margin:0 3px 8px}",
    "#wtrend .wr-tab{flex:1;height:36px;border-radius:18px!important;border:1px solid #dfe5f0!important;background:#f1f4fa!important;color:#4a556f!important;font-size:16px!important;cursor:pointer;padding:0!important;outline:0}",
    "#wtrend .wr-tab.on{background:linear-gradient(180deg,#ffe9a0,#fbd96a)!important;border-color:#f2c94c!important;color:#5a3a00!important;box-shadow:0 2px 8px rgba(242,201,76,.45)}",
    "#wtrend .wr-sec{margin-bottom:8px;padding:8px 5px 4px;border-radius:18px;border:1px solid #eee;border-top-width:4px;background:#fff;box-shadow:0 2px 10px rgba(30,40,80,.06)}",
    "#wtrend .wr-sec.y{border-top-color:#f6d365;background:linear-gradient(180deg,#fffaf0,#fff)}",
    "#wtrend .wr-sec.c{border-top-color:#8fe3f2;background:linear-gradient(180deg,#f0fbfe,#fff)}",
    "#wtrend .wr-sec.p{border-top-color:#f7b7c4;background:linear-gradient(180deg,#fff2f5,#fff)}",
    "#wtrend .wr-sh{display:flex;align-items:center;gap:8px;padding:0 4px 6px;margin-bottom:6px;border-bottom:1px solid rgba(0,0,0,.07)}",
    "#wtrend .wr-si{flex:0 0 38px;width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px}",
    "#wtrend .wr-sec.y .wr-si{background:linear-gradient(135deg,#ffd76a,#f6b93b)}",
    "#wtrend .wr-sec.c .wr-si{background:linear-gradient(135deg,#a6ecf7,#5cd0ea)}",
    "#wtrend .wr-sec.p .wr-si{background:linear-gradient(135deg,#ffc2cd,#f98aa0)}",
    "#wtrend .wr-st{flex:1;font-size:15px!important;font-weight:700!important}",
    "#wtrend .wr-sec.y .wr-st{color:#a2670a}",
    "#wtrend .wr-sec.c .wr-st{color:#0e6f86}",
    "#wtrend .wr-sec.p .wr-st{color:#c2284a}",
    "#wtrend .wr-row{display:flex;align-items:center;gap:6px;min-height:54px;margin-bottom:5px;padding:4px 6px;border-radius:15px;border:1px solid #ececf2;background:#fff}",
    "#wtrend .wr-sec.y .wr-row.r1{background:linear-gradient(90deg,#fff3c4,#fff9e3);border-color:#f7e3a1}",
    "#wtrend .wr-sec.c .wr-row.r1{background:linear-gradient(90deg,#d5f5fb,#ebfafd);border-color:#bfeaf3}",
    "#wtrend .wr-sec.p .wr-row.r1{background:linear-gradient(90deg,#ffdfe5,#fff0f3);border-color:#f9cdd6}",
    "#wtrend .wr-m{flex:0 0 26px;text-align:center;font-size:21px!important;line-height:1!important}",
    "#wtrend .wr-av{flex:0 0 42px;width:42px;height:42px;border-radius:50%!important;object-fit:cover;background:#ddd;border:2.5px solid #f6d365}",
    "#wtrend .wr-sec.c .wr-av{border-color:#8fe3f2}",
    "#wtrend .wr-sec.p .wr-av{border-color:#f7a8b8}",
    "#wtrend .wr-nm{flex:1;min-width:0;text-align:right;color:#39425c;font-size:14px!important;line-height:1.3!important;white-space:normal;word-break:break-word;overflow-wrap:anywhere;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}",
    "#wtrend .wr-ct{flex:0 0 auto;padding:3px 8px;border-radius:999px;font-size:12.5px!important;font-weight:700;white-space:nowrap}",
    "#wtrend .wr-sec.y .wr-ct{background:#fdeeb8;color:#a2670a;border:1px solid #f5dc8a}",
    "#wtrend .wr-sec.c .wr-ct{background:#d3f2f9;color:#0e6f86;border:1px solid #b2e5f0}",
    "#wtrend .wr-sec.p .wr-ct{background:#ffe0e6;color:#c2284a;border:1px solid #f8c4cf}",
    "#wtrend .wr-empty{padding:14px 6px 18px;text-align:center;color:#8a93a8;font-size:14px!important}",
    "#wtrend .wr.ld .wr-body{opacity:.55;transition:opacity .15s}"
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
  function P(key) {
    for (var i = 0; i < PERIODS.length; i++) if (PERIODS[i].key === key) return PERIODS[i];
    return PERIODS[0];
  }

  function build() {
    var $p = $("#wtrend");
    if (!$p.length) return false;
    var tabs = PERIODS.map(function (x) {
      return '<button type="button" class="wr-tab" data-p="' + x.key + '">' + x.label + "</button>";
    }).join("");
    $p.html(
      '<div class="wr" id="wr-root">' +
        '<button type="button" class="wr-back" title="الاضافات والميزات" data-toggle="tab" data-target="#othpage" ' +
          "onclick=\"$('.pnhead').text($(this).attr('title'));$('.dpnl').show();\">" +
          '<i class="fa fa-arrow-right"></i><span>عودة</span></button>' +
        '<div class="wr-title" id="wr-title"></div>' +
        '<div class="wr-tabs">' + tabs + "</div>" +
        '<div class="wr-body" id="wr-body"></div>' +
      "</div>"
    );
    root = $("#wr-root");
    root.find(".wr-tab").on("click", function () { load($(this).attr("data-p")); });
    return true;
  }

  function rowHtml(u, i, sec) {
    return '<div class="wr-row r' + (i + 1) + '">' +
      '<span class="wr-m">' + MEDALS[i] + "</span>" +
      '<img class="wr-av" src="' + esc(pic(u.pic)) + '" onerror="this.onerror=null;this.src=\'site/pic.png\'">' +
      '<div class="wr-nm">' + esc(window.uhideName ? uhideName(u) : u.topic) + "</div>" +
      '<div class="wr-ct">' + esc(u.cnt) + " " + sec.unit + "</div></div>";
  }

  function paint(period, d) {
    if (!root) return;
    root.removeClass("ld");
    var pr = P(period);
    root.find(".wr-tab").removeClass("on").filter("[data-p='" + period + "']").addClass("on");
    $("#wr-title").text("ترند الحائط — " + pr.label);
    var h = "";
    SECTIONS.forEach(function (sec) {
      var list = (d && d[sec.key]) || [];
      h += '<div class="wr-sec ' + sec.cls + '"><div class="wr-sh"><div class="wr-si">' + sec.ico + '</div><div class="wr-st">' + sec.title(pr.when) + "</div></div>";
      if (!list.length) h += '<div class="wr-empty">لا يوجد نشاط في هذه الفترة بعد</div>';
      else for (var i = 0; i < list.length && i < 3; i++) h += rowHtml(list[i], i, sec);
      h += "</div>";
    });
    $("#wr-body").html(h);
  }

  function load(period) {
    if (!root && !build()) return;
    current = period || current || "day";
    if (cache[current]) paint(current, cache[current]);
    else {
      root.addClass("ld");
      root.find(".wr-tab").removeClass("on").filter("[data-p='" + current + "']").addClass("on");
      $("#wr-title").text("ترند الحائط — " + P(current).label);
    }
    try { SEND_EVENT_EMIT("SEND_EVENT_EMIT_WALL_TREND", { period: current }); } catch (e) { }
  }

  window.WALLTREND_LOAD = function () { load(current); };
  window.WALLTREND_RENDER = function (d) {
    if (!d) return;
    cache[d.period] = d;
    if (d.period === current) paint(current, d);
  };

  $(function () {
    var st = document.createElement("style");
    st.id = "wr-css";
    st.appendChild(document.createTextNode(css));
    document.head.appendChild(st);
    build();
  });
})();
