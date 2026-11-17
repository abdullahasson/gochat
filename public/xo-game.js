/*
 * لعبة XO — دعوة من البروفايل + إشعار بعدّاد 60 ثانية + نافذة اللعب + تأثير الفوز
 *  - زر "لعبة XO" موجود في بروفايل العضو (index.ejs, الكلاس .uxo)
 *  - رد السيرفر بيوصل عن طريق x2.js (case "xo") -> XO_RECV
 *  - زر البروفايل بيتظبط من x2.js عن طريق XO_ONPROFILE(id) داخل upro()
 * الملف لوحده بيبني الواجهة والـ CSS.
 */
(function () {
  /* شكل زر "تحدي X-O" في البروفايل (بيتحقن فوراً مع تحميل الملف) */
  (function () {
    if (document.getElementById("xoBtnCss")) return;
    var c = [
      "#upro .uxo{display:flex;align-items:center;direction:ltr;float:left;width:calc(100% - 4px);height:56px;margin:4px 2px 2px!important;padding:0 14px 0 12px!important;",
      "background:#fff!important;color:#222!important;border:1px solid #dcdcdc!important;border-radius:28px!important;",
      "box-shadow:0 1px 3px rgba(0,0,0,.08);cursor:pointer;box-sizing:border-box;transition:background .15s,transform .12s}",
      "#upro .uxo:hover{background:#f7f7f7!important}",
      "#upro .uxo:active{transform:scale(.97)}",
      "#upro .uxo .xo-pi{flex:0 0 auto;width:42px;height:42px}",
      "#upro .uxo .xo-pt{flex:1;text-align:center;direction:rtl;font-size:20px;font-weight:bold;color:#222;line-height:1;white-space:nowrap}",
      "#upro .uxo .xo-ps{flex:0 0 42px;width:42px;height:42px}"
    ].join("");
    var st = document.createElement("style");
    st.id = "xoBtnCss";
    st.textContent = c;
    (document.head || document.documentElement).appendChild(st);
  })();

  var target = null;      // آيدي صاحب البروفايل المفتوح
  var toasts = {};        // gid -> { $el, timer, kind }
  var game = null;        // اللعبة الحالية
  var $win = null;

  function emit(cmd, data) {
    try { SEND_EVENT_EMIT(cmd, data || {}); } catch (e) {}
  }

  /* ---------------- CSS ---------------- */
  function css() {
    if (document.getElementById("xoCss")) return;
    var s = [
      "#xoToasts{position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:9000;display:flex;flex-direction:column;gap:8px;width:min(94vw,360px);pointer-events:none;direction:rtl}",
      ".xo-toast{pointer-events:auto;background:#1f2937;color:#fff;border-radius:14px;padding:10px 12px;box-shadow:0 8px 24px rgba(0,0,0,.35);overflow:hidden;position:relative;animation:xoIn .25s ease-out}",
      ".xo-toast .xo-row{display:flex;align-items:center;gap:10px}",
      ".xo-toast img.xo-av{width:46px;height:46px;border-radius:50%;object-fit:cover;border:2px solid #7c3aed;background:#374151;flex:none}",
      ".xo-toast .xo-txt{flex:1;min-width:0}",
      ".xo-toast .xo-name{font-weight:bold;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".xo-toast .xo-sub{font-size:12.5px;opacity:.85;margin-top:2px}",
      ".xo-toast .xo-cd{flex:none;width:40px;height:40px;border-radius:50%;background:#7c3aed;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:16px}",
      ".xo-toast .xo-btns{display:flex;gap:8px;margin-top:9px}",
      ".xo-toast .xo-btn{flex:1;border:0;border-radius:10px;padding:7px 0;font-size:14px;font-weight:bold;cursor:pointer;color:#fff}",
      ".xo-toast .xo-ok{background:#16a34a}.xo-toast .xo-no{background:#dc2626}.xo-toast .xo-cn{background:#4b5563}",
      ".xo-toast .xo-bar{position:absolute;bottom:0;right:0;height:3px;background:#a78bfa;width:100%;transition:width 1s linear}",
      ".xo-toast.xo-info{padding:9px 14px;font-size:14px;text-align:center}",
      "@keyframes xoIn{from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:none}}",

      "#xoWin{position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;direction:rtl}",
      "#xoWin .xo-box{position:relative;width:min(92vw,340px);background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 14px 40px rgba(0,0,0,.45);animation:xoIn .25s ease-out}",
      "#xoWin .xo-head{background:#1f2937;color:#fff;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;font-weight:bold}",
      "#xoWin .xo-x{cursor:pointer;width:26px;height:26px;line-height:26px;text-align:center;border-radius:50%;background:rgba(255,255,255,.15)}",
      "#xoWin .xo-pl{display:flex;gap:8px;padding:10px;background:#f3f4f6}",
      "#xoWin .xo-p{flex:1;display:flex;align-items:center;gap:8px;background:#fff;border:2px solid transparent;border-radius:12px;padding:6px;min-width:0;transition:.2s}",
      "#xoWin .xo-p.on{border-color:#7c3aed;box-shadow:0 0 0 3px rgba(124,58,237,.18)}",
      "#xoWin .xo-p img{width:38px;height:38px;border-radius:50%;object-fit:cover;background:#ddd;flex:none}",
      "#xoWin .xo-p .nm{font-size:13px;font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#111}",
      "#xoWin .xo-p .sy{font-size:12px;font-weight:bold}",
      "#xoWin .sx{color:#ef4444}#xoWin .so{color:#3b82f6}",
      "#xoWin .xo-st{text-align:center;padding:8px 0 2px;font-size:14px;font-weight:bold;color:#374151;min-height:28px}",
      "#xoWin .xo-grid{direction:ltr;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:10px 16px 18px}",
      "#xoWin .xo-c{aspect-ratio:1/1;background:#f3f4f6;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:44px;font-weight:bold;cursor:pointer;user-select:none;transition:background .15s,transform .15s}",
      "#xoWin .xo-c.can:hover{background:#e5e7eb;transform:scale(.97)}",
      "#xoWin .xo-c.filled{cursor:default}",
      "#xoWin .xo-c.pop{animation:xoPop .22s ease-out}",
      "#xoWin .xo-c.win{background:#dcfce7;animation:xoWin .7s ease-in-out infinite alternate}",
      "@keyframes xoPop{from{transform:scale(.3);opacity:0}to{transform:scale(1);opacity:1}}",
      "@keyframes xoWin{from{transform:scale(1)}to{transform:scale(1.1);box-shadow:0 0 14px rgba(34,197,94,.7)}}",
      "#xoWin .xo-res{position:absolute;left:0;right:0;bottom:0;padding:14px 10px 16px;text-align:center;background:linear-gradient(transparent,rgba(255,255,255,.96) 35%);display:none}",
      "#xoWin .xo-res .big{font-size:26px;font-weight:bold;margin-bottom:8px}",
      "#xoWin .xo-res .big.w{color:#16a34a;animation:xoPop .4s ease-out}",
      "#xoWin .xo-res .big.l{color:#6b7280}#xoWin .xo-res .big.d{color:#7c3aed}",
      "#xoWin .xo-res button{border:0;background:#7c3aed;color:#fff;border-radius:10px;padding:7px 28px;font-size:14px;font-weight:bold;cursor:pointer}",
      "#xoWin .xo-cf{position:absolute;top:-14px;font-size:20px;pointer-events:none;animation:xoFall linear forwards;z-index:3}",
      "@keyframes xoFall{to{transform:translateY(480px) rotate(360deg);opacity:0}}"
    ].join("\n");
    var st = document.createElement("style");
    st.id = "xoCss";
    st.textContent = s;
    document.head.appendChild(st);
  }

  function ensureToasts() {
    css();
    var $t = $("#xoToasts");
    if (!$t.length) $t = $('<div id="xoToasts"></div>').appendTo("body");
    return $t;
  }

  function person($row, info) {
    $row.find(".xo-av").attr("src", info && info.pic ? info.pic : "");
    $row.find(".xo-name").text(info && info.name ? info.name : "");
  }

  /* ---------------- التوستات (دعوة / انتظار / معلومة) ---------------- */
  function dropToast(gid) {
    var t = toasts[gid];
    if (!t) return;
    clearInterval(t.timer);
    t.$el.remove();
    delete toasts[gid];
  }

  function info(msg) {
    var $el = $('<div class="xo-toast xo-info"></div>').text(msg).appendTo(ensureToasts());
    setTimeout(function () { $el.fadeOut(250, function () { $el.remove(); }); }, 3500);
  }

  function countdown(t, secs) {
    var end = Date.now() + secs * 1000;
    var $cd = t.$el.find(".xo-cd"), $bar = t.$el.find(".xo-bar");
    function tick() {
      var left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      $cd.text(left);
      $bar.css("width", (left / secs * 100) + "%");
      if (left <= 0) clearInterval(t.timer);
    }
    tick();
    t.timer = setInterval(tick, 250);
  }

  function showInvite(d) {
    dropToast(d.gid);
    var $el = $(
      '<div class="xo-toast">' +
        '<div class="xo-row"><img class="xo-av" alt="">' +
        '<div class="xo-txt"><div class="xo-name"></div><div class="xo-sub">يدعوك للعب ❌⭕ XO</div></div>' +
        '<div class="xo-cd">60</div></div>' +
        '<div class="xo-btns"><button class="xo-btn xo-ok">قبول</button><button class="xo-btn xo-no">رفض</button></div>' +
        '<div class="xo-bar"></div></div>'
    );
    person($el, d.from);
    $el.appendTo(ensureToasts());
    var t = { $el: $el, kind: "in" };
    toasts[d.gid] = t;
    $el.find(".xo-ok").on("click", function () { emit("SEND_EVENT_EMIT_XO_ACCEPT", { gid: d.gid }); dropToast(d.gid); });
    $el.find(".xo-no").on("click", function () { emit("SEND_EVENT_EMIT_XO_DECLINE", { gid: d.gid }); dropToast(d.gid); });
    countdown(t, d.secs || 60);
  }

  function showSent(d) {
    dropToast(d.gid);
    var $el = $(
      '<div class="xo-toast">' +
        '<div class="xo-row"><img class="xo-av" alt="">' +
        '<div class="xo-txt"><div class="xo-name"></div><div class="xo-sub">تم إرسال دعوة XO.. بانتظار الرد</div></div>' +
        '<div class="xo-cd">60</div></div>' +
        '<div class="xo-btns"><button class="xo-btn xo-cn">إلغاء الدعوة</button></div>' +
        '<div class="xo-bar"></div></div>'
    );
    person($el, d.to);
    $el.appendTo(ensureToasts());
    var t = { $el: $el, kind: "out" };
    toasts[d.gid] = t;
    $el.find(".xo-cn").on("click", function () { emit("SEND_EVENT_EMIT_XO_CANCEL", { gid: d.gid }); });
    countdown(t, d.secs || 60);
  }

  /* ---------------- نافذة اللعبة ---------------- */
  function buildWin() {
    css();
    closeWin(true);
    $win = $(
      '<div id="xoWin"><div class="xo-box">' +
        '<div class="xo-head"><span>❌⭕ لعبة XO</span><span class="xo-x">✕</span></div>' +
        '<div class="xo-pl">' +
          '<div class="xo-p" data-s="me"><img class="xo-av" alt=""><div style="min-width:0"><div class="nm"></div><div class="sy"></div></div></div>' +
          '<div class="xo-p" data-s="op"><img class="xo-av" alt=""><div style="min-width:0"><div class="nm"></div><div class="sy"></div></div></div>' +
        '</div>' +
        '<div class="xo-st"></div>' +
        '<div class="xo-grid"></div>' +
        '<div class="xo-res"><div class="big"></div><button>إغلاق</button></div>' +
      '</div></div>'
    ).appendTo("body");
    var $g = $win.find(".xo-grid");
    for (var i = 0; i < 9; i++) $g.append('<div class="xo-c" data-i="' + i + '"></div>');
    $g.on("click", ".xo-c", function () {
      if (!game || game.over) return;
      var i = +$(this).data("i");
      if (game.turn != game.you || game.board[i]) return;
      emit("SEND_EVENT_EMIT_XO_MOVE", { gid: game.gid, i: i });
    });
    $win.find(".xo-x").on("click", function () {
      if (game && !game.over) {
        if (!confirm("الخروج من اللعبة يعني الخسارة، هل تريد الخروج؟")) return;
        emit("SEND_EVENT_EMIT_XO_LEAVE", { gid: game.gid });
      }
      closeWin();
    });
    $win.find(".xo-res button").on("click", function () { closeWin(); });
  }

  function closeWin(silent) {
    if ($win) { $win.remove(); $win = null; }
    if (!silent) game = null;
  }

  function sym(s) { return s == "X" ? '<span class="sx">X</span>' : '<span class="so">O</span>'; }

  function render() {
    if (!$win || !game) return;
    var mine = game.you, opp = game.you == "X" ? "O" : "X";
    var $me = $win.find('[data-s="me"]'), $op = $win.find('[data-s="op"]');
    $me.find("img").attr("src", game.me.pic || "");
    $me.find(".nm").text(game.me.name + " (أنت)");
    $me.find(".sy").html("يلعب بـ " + sym(mine));
    $op.find("img").attr("src", game.opp.pic || "");
    $op.find(".nm").text(game.opp.name);
    $op.find(".sy").html("يلعب بـ " + sym(opp));
    $me.toggleClass("on", !game.over && game.turn == mine);
    $op.toggleClass("on", !game.over && game.turn == opp);
    var $st = $win.find(".xo-st");
    if (game.over) $st.text("");
    else if (game.turn == mine) $st.text("دورك — اضغط على أي مربع");
    else $st.text("بانتظار " + game.opp.name + "...");
    $win.find(".xo-c").each(function () {
      var i = +$(this).data("i"), v = game.board[i] || "";
      var $c = $(this);
      if (v && !$c.hasClass("filled")) $c.addClass("pop");
      $c.toggleClass("filled", !!v)
        .toggleClass("can", !v && !game.over && game.turn == mine)
        .html(v ? sym(v) : "");
    });
  }

  function confetti() {
    if (!$win) return;
    var $box = $win.find(".xo-box");
    var cols = ["🎉", "✨", "🎊", "⭐", "💜", "🟢"];
    for (var i = 0; i < 28; i++) {
      (function (i) {
        setTimeout(function () {
          if (!$win) return;
          var $p = $('<span class="xo-cf"></span>').text(cols[i % cols.length]).css({
            left: Math.random() * 94 + "%",
            animationDuration: (1.4 + Math.random() * 1.4) + "s"
          }).appendTo($box);
          setTimeout(function () { $p.remove(); }, 3200);
        }, i * 60);
      })(i);
    }
  }

  function finish(kind, text, line) {
    if (!game) return;
    game.over = true;
    render();
    if (line) {
      $win.find(".xo-c").each(function () {
        if (line.indexOf(+$(this).data("i")) != -1) $(this).addClass("win");
      });
    }
    var $r = $win.find(".xo-res");
    $r.find(".big").attr("class", "big " + kind).text(text);
    $r.show();
    if (kind == "w") confetti();
  }

  /* ---------------- استقبال السيرفر ---------------- */
  window.XO_RECV = function (d) {
    if (!d || typeof d != "object") return;
    switch (d.act) {
      case "invite":
        showInvite(d);
        break;
      case "invite_sent":
        showSent(d);
        break;
      case "invite_end":
        var t = toasts[d.gid];
        var kind = t && t.kind;
        dropToast(d.gid);
        if (kind == "out") {
          if (d.why == "declined") info((d.who && d.who.name ? d.who.name : "العضو") + " رفض دعوة اللعب");
          else if (d.why == "expired") info("انتهت مدة الدعوة بدون رد");
          else if (d.why == "offline") info("العضو لم يعد متاحاً للعب");
        } else if (kind == "in") {
          if (d.why == "cancel") info("تم إلغاء دعوة اللعب");
        }
        break;
      case "start":
        // أي دعوات تانية واصلة ليا تتقفل ويتبعت رفض لها
        Object.keys(toasts).forEach(function (gid) {
          if (toasts[gid].kind == "in") emit("SEND_EVENT_EMIT_XO_DECLINE", { gid: gid });
          dropToast(gid);
        });
        game = { gid: d.gid, you: d.you, me: d.me, opp: d.opp, board: d.board, turn: d.turn, over: false };
        buildWin();
        render();
        break;
      case "state":
        if (!game || game.gid != d.gid) return;
        game.board = d.board;
        game.turn = d.turn;
        render();
        if (d.winner) {
          var won = d.winner == game.you;
          finish(won ? "w" : "l", won ? "🎉 تم الفوز" : "فاز " + game.opp.name, d.line);
        } else if (d.draw) {
          finish("d", "تعادل 🤝");
        }
        break;
      case "left":
        if (!game || game.gid != d.gid || game.over) return;
        finish("w", "🎉 تم الفوز — انسحب " + game.opp.name);
        break;
    }
  };

  /* ---------------- زر البروفايل ---------------- */
  window.XO_ONPROFILE = function (id) {
    target = id;
    var $b = $("#upro .uxo");
    if (typeof M_ID != "undefined" && id == M_ID) $b.hide();
    else $b.show();
  };

  $(document).on("click", "#upro .uxo", function () {
    if (!target) return;
    if (game && !game.over) { info("أنت داخل لعبة حالياً"); return; }
    emit("SEND_EVENT_EMIT_XO_INVITE", { to: target });
    $("#upro").modal("hide");
  });
})();
