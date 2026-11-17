/*
 * [PERF-FIX] rooms-perf.js — تسريع قائمة الغرف (الـ scroll تقيل)
 * بيتحمّل بعد x2.js و silent-reconnect.js، وبيستبدل 3 دوال عامة: addroom / updater / updaterooms
 * من غير ما يلمس x2.js. خلفية الغرفة (صورة) بتفضل زي ما هي بس بتتحمّل لما الغرفة تقرب من الشاشة.
 *
 * الأسباب اللي كانت بتبطّأ:
 *  1) كل الغرف بتحمّل صور الخلفية (100% 100%) مرة واحدة وتفك تشفيرها في الـ main thread
 *  2) updaterooms بتتنفّذ مع كل دخول/خروج عضو: لكل غرفة بتدوّر في كل الأعضاء + بتدوّر في الـ DOM كله بـ $(".rID")
 *     وبتكتب في الـ DOM حتى لو الرقم ما اتغيّرش => إعادة حساب Layout أثناء الـ scroll
 *  3) addroom بتعمل append لكل غرفة لوحدها (reflow لكل غرفة)
 */
(function () {
  "use strict";
  if (window.__roomsPerf) return;
  window.__roomsPerf = true;

  /* ===== ستايل: الغرف اللي برّه الشاشة المتصفح مبيرسمهاش أصلاً ===== */
  var css = document.createElement("style");
  css.textContent =
    "#rooms .room{content-visibility:auto;contain-intrinsic-size:auto 64px}" +
    "#rooms .room.rp-back{contain-intrinsic-size:auto 150px;background-color:#26262a}";
  (document.head || document.documentElement).appendChild(css);

  var RP_EL = {}; /* id الغرفة => عنصر jQuery */
  var lastScroll = 0;
  var deferTimer = null;

  /* ===== نعرف إن المستخدم بيعمل scroll (علشان نأجّل أي كتابة في الـ DOM) ===== */
  document.addEventListener(
    "scroll",
    function (e) {
      var t = e.target, box = document.getElementById("rooms");
      if (!box) return;
      if (t === document || t === box || (t.contains && (t.contains(box) || box.contains(t)))) {
        lastScroll = Date.now();
      }
    },
    { capture: true, passive: true }
  );
  function scrolling() {
    return Date.now() - lastScroll < 160;
  }

  /* ===== عدد الأعضاء في كل غرفة: مرور واحد على الأعضاء بدل مرور لكل غرفة ===== */
  function countMap() {
    var m = {}, L = window.C_L_U || [];
    for (var i = 0; i < L.length; i++) {
      var x = L[i];
      if (x && x.s == null && x.roomid != null) m[x.roomid] = (m[x.roomid] || 0) + 1;
    }
    return m;
  }
  var _cm = null;
  function cachedCount() {
    if (_cm) return _cm;
    _cm = countMap();
    Promise.resolve().then(function () { _cm = null; });
    return _cm;
  }

  /* ===== تحميل خلفية الغرفة بس لما تقرب من الشاشة (decode في الخلفية) ===== */
  var io = null;
  function getIO() {
    if (io || !("IntersectionObserver" in window)) return io;
    io = new IntersectionObserver(
      function (es) {
        es.forEach(function (en) {
          if (en.isIntersecting) {
            io.unobserve(en.target);
            loadBack(en.target);
          }
        });
      },
      { rootMargin: "500px 0px" }
    );
    return io;
  }
  function loadBack(el) {
    var url = el.__rpBack;
    if (!url || el.__rpBackDone) return;
    el.__rpBackDone = true;
    var im = new Image();
    im.decoding = "async";
    im.onload = function () {
      var go = function () {
        requestAnimationFrame(function () {
          if (el.__rpBack !== url) return;
          el.style.background = 'url("' + url + '") 0% 0% / 100% 100%';
          el.style.backgroundColor = "";
        });
      };
      if (im.decode) im.decode().then(go, go);
      else go();
    };
    im.onerror = function () { el.__rpBackDone = false; };
    im.src = url;
  }

  /* ===== نفس منطق updater الأصلي لكن على عنصر جاهز + خلفية كسولة ===== */
  function applyRoom(ht, r) {
    var el = ht[0];
    var pic = ht.find(".u-pic");
    pic.css("background-image", "url('" + r.pic + "?1')");
    ht.find(".u-topic").html(r.topic).css("color", "#" + r.color);
    if (r.backroom) {
      if (el.__rpBack !== r.backroom) {
        el.__rpBack = r.backroom;
        el.__rpBackDone = false;
        el.style.background = "";
      }
      ht.addClass("rp-back");
      el.style.height = "150px";
      pic.hide();
      var o = getIO();
      if (!el.__rpBackDone) {
        if (o) o.observe(el);
        else loadBack(el);
      }
    } else {
      if (el.__rpBack) {
        el.__rpBack = null;
        el.__rpBackDone = false;
        el.style.background = "";
        el.style.height = "";
        ht.removeClass("rp-back");
      }
      pic.show();
    }
    pic.css("border", "2px solid " + r.colorpicroom);
    ht.find(".roomhas").html("#" + r.has);
    ht.find(".u-msg").html(r.about).css("color", "#" + r.colormsgroom);
    var uc = ht.find(".uc");
    if (r.broadcast) {
      if (ht.find(".istoa").length == 0) {
        uc.removeClass("fa fa-user label-primary").addClass("fa fa-microphone label-danger");
      }
    } else {
      /* إيقاف المايك: أخفِ شريط المايكات فوراً لمن هو داخل هذه الغرفة */
      if (r.id == window.M_ROOM) {
        $(".broadcasters").html("").css({ display: "none", padding: "" });
        $("#d2").css("padding-top", "0px");
      }
      ht.children("span.istoa").remove();
      uc.addClass("fa fa-user label-primary").removeClass("fa-microphone label-danger");
    }
    if (r.needpass) {
      ht.find(".u-topic").prepend('<img src="imgs/lock.png" style="margin:2px;margin-top:4px;" class="fl">');
    }
  }

  function rowOf(id) {
    var el = RP_EL[id];
    if (el && el[0] && el[0].isConnected) return el;
    el = $("#rooms .room.r" + id).first();
    if (el.length) { RP_EL[id] = el; return el; }
    return null;
  }

  /* ===== إضافة الغرف دفعة واحدة (fragment) بدل append لكل غرفة ===== */
  var frag = null;
  function queue(node) {
    if (!frag) {
      frag = document.createDocumentFragment();
      Promise.resolve().then(function () {
        var f = frag; frag = null;
        var box = document.getElementById("rooms");
        if (f && box) box.appendChild(f);
      });
    }
    frag.appendChild(node);
  }

  var _addroom = window.addroom;
  window.addroom = function (r) {
    try {
      if (typeof rhtml !== "string" || rhtml === "*") return _addroom.apply(this, arguments);
      var old = RP_EL[r.id];
      if (old && old[0]) old.remove(); /* منع تكرار نفس الغرفة */
      var ht = $(rhtml);
      ht.addClass("r" + r.id);
      ht.find(".u-msg").css("color", r.colormsgroom);
      ht.find(".roomhas").text("#" + r.has);
      ht.attr("onclick", "Send_Rjoin('" + r.id + "');");
      var n = cachedCount()[r.id] || 0;
      ht.find(".uc").text(n + "/" + r.max).attr("v", n);
      ht.attr("v", n);
      applyRoom(ht, r);
      RP_EL[r.id] = ht;
      queue(ht[0]);
    } catch (e) {
      return _addroom.apply(this, arguments);
    }
  };

  var _updater = window.updater;
  window.updater = function (r) {
    var ht = rowOf(r.id);
    if (!ht) return _updater.apply(this, arguments);
    applyRoom(ht, r);
  };

  /* ===== تحديث العدادات: مرور واحد + كتابة في الـ DOM بس لو الرقم اتغيّر + تأجيل أثناء الـ scroll ===== */
  function doUpdate() {
    var u = window.U_CASH && window.U_CASH[window.M_ID];
    if (!u) return;
    var cm = countMap(), L = window.C_L_R || [];
    $("#brooms").prop("title", "غرف الدردشه : " + L.length);
    for (var i = 0; i < L.length; i++) {
      var e = L[i], ht = rowOf(e.id);
      if (!ht) continue;
      if (e.owner == (u.lid || "") && ht[0].__rpOwn !== true) {
        ht[0].__rpOwn = true;
        ht.css("background-color", "snow");
      }
      var n = cm[e.id] || 0, txt = n + "/" + e.max;
      if (ht[0].__rpTxt !== txt) {
        ht[0].__rpTxt = txt;
        ht.find(".uc").text(txt).attr("v", n);
        ht.attr("v", n);
      }
    }
  }
  window.updaterooms = function () {
    if (window.needUpdate == false) return;
    if (scrolling()) {
      if (!deferTimer) {
        deferTimer = setTimeout(function () {
          deferTimer = null;
          doUpdate();
        }, 200);
      }
      return;
    }
    doUpdate();
  };
})();
