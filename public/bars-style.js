/* الشريط العلوي (المايكات) والسفلي (الأيقونات) بالشكل الجديد
   بيتحمّل بس لما الأدمن يفعّل زر "تغيير الشريط العلوي والسفلي" (لوحة التحكم > الإضافات).
   لو اتلغى الزر الملف ده مش بيتحمّل والصفحة ترجع زي ما كانت (أيقونة الإشعارات في الضبط). */
(function () {
  "use strict";
  if (window.__barsStyleLoaded) return;
  window.__barsStyleLoaded = true;

  /* أيقونة المايك: مايك بنفسجي + قوس تركواز */
  var micSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">' +
    '<defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#14b8c4"/><stop offset="1" stop-color="#7ae8ee"/></linearGradient></defs>' +
    '<path d="M6 25 A18 18 0 0 1 24 5" fill="none" stroke="url(#g)" stroke-width="3.2" stroke-linecap="round"/>' +
    '<rect x="19" y="13" width="12" height="20" rx="6" fill="#c040b4"/>' +
    '<path d="M14.5 27 a10.5 10.5 0 0 0 21 0" fill="none" stroke="#c040b4" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M25 38 v5 M18.5 43.5 h13" fill="none" stroke="#c040b4" stroke-width="3" stroke-linecap="round"/>' +
    "</svg>";
  var micUrl = 'url("data:image/svg+xml;utf8,' + encodeURIComponent(micSvg) + '")';

  var cssArr = [
    /* ===== الشريط العلوي (المايكات) ===== */
    "body.nb .broadcasters{background:linear-gradient(180deg,#2a3542 0%,#1a232d 100%)!important;height:auto!important;min-height:60px;padding:5px 6px!important;border:0!important;border-bottom:1px solid #0d141b!important;box-shadow:0 2px 8px rgba(0,0,0,.4);flex:0 0 auto}",
    "body.nb .broadcasters>div{max-width:none!important;width:100%;margin:0!important;display:flex;align-items:center;justify-content:space-between;direction:ltr;position:relative}",
    /* السماعة (كتم الكل) على الشمال */
    "body.nb #muteall{order:-1;position:static!important;margin:0 4px 0 0!important;width:46px!important;height:46px!important;border-radius:50%!important;border:3px solid #131b24!important;background:radial-gradient(circle at 35% 30%,#2b3846,#18212b)!important;color:#4a5a69!important;display:flex;align-items:center;justify-content:center;flex:0 0 auto;box-shadow:inset 0 0 0 2px #0f161d}",
    "body.nb #muteall .fa{margin:0!important;font-size:24px!important;color:#566879;line-height:1!important}",
    'body.nb #muteall:not([style*="mediumseagreen"]) .fa{color:#d9534f}',
    /* المقعد */
    "body.nb .broadcasters>div>.prod{float:none!important;position:relative;left:0!important;flex:0 0 auto;width:46px!important;height:46px!important;margin:0!important;border:0!important;border-radius:50%!important;background-color:transparent!important;background-size:cover!important;background-position:center!important;box-shadow:none}",
    /* مقعد فاضي = أيقونة المايك */
    'body.nb .broadcasters>div>.prod:not([style*="background-image"]):not(.vseat){background-image:none!important}',
    'body.nb .broadcasters>div>.prod:not([style*="background-image"]):not(.vseat)::before{content:"";position:absolute;left:50%;top:50%;width:34px;height:34px;transform:translate(-50%,-50%);background:' + micUrl + ' center/contain no-repeat;filter:drop-shadow(0 1px 2px rgba(0,0,0,.45))}',
    /* مقعد بث مباشر (فيديو): دايرة حمرا بأيقونة كاميرا + شارة البث، ويفضل واضح إنه مش مايك */
    "body.nb .broadcasters>div>.prod.vseat{border:2px solid #e11d48!important;box-shadow:0 0 8px rgba(225,29,72,.6)!important}",
    'body.nb .broadcasters>div>.prod.vseat:not([id^="prod"]){background-color:#2a0b13!important;background-size:62%!important}',
    'body.nb .broadcasters>div>.prod.vseat:not([id^="prod"])::after{content:"بث";position:absolute;left:50%;bottom:-7px;transform:translateX(-50%);padding:0 6px;border-radius:6px;background:#e11d48;color:#fff;font:700 9px/13px Arial,sans-serif!important;pointer-events:none;z-index:3}',
    /* مقعد فيه عضو = صورته دايرة بإطار تركواز */
    'body.nb .broadcasters>div>.prod[style*="background-image"]{border:2px solid #19c3c9!important;box-shadow:0 0 6px rgba(25,195,201,.55)}',
    "body.nb .broadcasters>div>.prod>.evant>i{top:auto!important}",
    "body.nb .broadcasters>div>.prod #name{margin-top:28px!important;border-radius:8px!important;font-size:10px!important;background:rgba(0,0,0,.55)!important;color:#fff}",

    /* ===== الشريط السفلي (الأيقونات) ===== */
    "body.nb #d0{display:flex!important;align-items:stretch;justify-content:space-between;direction:ltr;float:none!important;flex:0 0 auto;width:100%;height:38px;margin:0!important;padding:3px 4px!important;background:linear-gradient(180deg,#26313d 0%,#18212b 100%)!important;border-top:1px solid #0d141b;box-shadow:0 -2px 8px rgba(0,0,0,.3)}",
    "body.nb #d0 .ae{position:relative;display:flex!important;align-items:center;justify-content:center;flex:1 1 0;float:none!important;width:auto!important;max-width:none!important;height:auto;margin:0 2px!important;padding:0!important;border:0!important;border-radius:9px!important;background:transparent!important;background-image:none!important;box-shadow:none!important;font-size:20px!important;line-height:1!important;text-shadow:none!important;overflow:visible}",
    "body.nb #d0 .ae::before{font-size:20px;line-height:1}",
    "body.nb #d0 .ae:active{transform:scale(.93)}",
    /* ألوان الأيقونات زي الصورة */
    "body.nb #d0 .ae.fa-user{color:#3da5f4!important}",
    "body.nb #d0 .ae.fa-comments{color:#a45cf2!important}",
    "body.nb #d0 .ae.fa-users{color:#2fd6b4!important}",
    "body.nb #d0 .ae.fa-newspaper-o{color:#c79a23!important}",
    "body.nb #d0 .ae.fa-sliders{color:#e4e8ee!important}",
    "body.nb #d0 .ae.nb-bell{color:#e3b53a!important}",
    /* التبويب المفتوح */
    "body.nb #d0 .ae.nb-on{background:linear-gradient(180deg,#7b3a4c 0%,#4a2231 100%)!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)!important}",
    /* العدّادات */
    "body.nb #d0 .ae>span{font-size:12px!important;font-weight:700;line-height:1!important}",
    "body.nb #d0 .ae.fa-user #busers{position:absolute;top:1px;left:50%;margin-left:-22px;padding:0!important;color:#fff;font-size:13px!important;text-shadow:0 1px 2px #000!important}",
    "body.nb #d0 .ae.fa-newspaper-o #bwall{position:absolute;top:-1px;left:50%;margin-left:6px;min-width:18px;height:18px;padding:0 4px!important;border-radius:9px;background:#2a3542;color:#e9c46a;border:1px solid #c79a23;line-height:16px!important;text-align:center}",
    "body.nb #d0 .ae.fa-newspaper-o #bwall:empty{display:none}",
    "body.nb #d0 .ae.chats>span:empty,body.nb #d0 .ae.fa-users>span:empty{display:none}",
    "body.nb #d0 .ae .nt-badge{top:1px!important;left:50%!important;margin-left:4px;min-width:18px;height:18px;line-height:18px;padding:0 4px;font-size:11px!important;border-radius:9px;box-shadow:0 0 0 2px #18212b}",
    "body.nb #d0 .ae.nb-bell.has-new::before{animation:ntring 1.6s ease-in-out infinite;display:inline-block}",
    /* أيقونة الإشعارات اتنقلت من الضبط للشريط السفلي */
    "body.nb .nt-open{display:none!important}",

    /* ===== رسائل الانضمام والانتقال: زر اسم الغرفة أسود زي الشريط ===== */
    "body.nb .hmsg .roomh,body.nb #d2 .roomh{background:linear-gradient(180deg,#27323f 0%,#0f161d 100%)!important;background-image:linear-gradient(180deg,#27323f 0%,#0f161d 100%)!important;color:#fff!important;border:1px solid #3b4856!important;border-radius:8px!important;padding:3px 8px!important;box-shadow:0 2px 4px rgba(0,0,0,.35)}",
    "body.nb .hmsg .roomh::before{color:#d9c25a;margin-left:4px}",
    /* ===== شريط الكتابة ===== */
    "body.nb #room>.tablebox.footer{display:flex!important;align-items:center;direction:ltr;height:42px!important;padding:4px 5px!important;gap:4px;flex:0 0 auto}",
    "body.nb #room>.tablebox.footer>*{float:none!important;margin:0!important;flex:0 0 auto}",
    /* الأزرار الغامقة: خروج / + / إرسال */
    'body.nb #room>.tablebox.footer>.btn:not([style*="display: none"]){display:flex!important;align-items:center;justify-content:center;gap:5px;height:34px;min-width:34px;padding:0 10px!important;border:1px solid #3b4856!important;border-radius:7px!important;background:linear-gradient(180deg,#27323f 0%,#141c25 100%)!important;background-image:linear-gradient(180deg,#27323f 0%,#141c25 100%)!important;color:#d9c25a!important;box-shadow:0 2px 4px rgba(0,0,0,.35)!important;line-height:1!important}',
    "body.nb #room>.tablebox.footer>.btn::before{font-size:16px;line-height:1}",
    "body.nb #room>.tablebox.footer>.btn:active{transform:scale(.95)}",
    "body.nb #room>.tablebox.footer>.fa-send{font-size:13px!important;padding:0 10px!important}",
    "body.nb #room>.tablebox.footer>.fa-sign-out{padding:0!important;width:34px}",
    "body.nb #room>.tablebox.footer>.fa-plus{padding:0!important;width:34px}",
    /* الإيموجي */
    "body.nb #room>.tablebox.footer>.emobox{width:34px!important;height:34px;padding:2px!important;object-fit:contain}",
    /* مربع الكتابة */
    "body.nb #room>.tablebox.footer>#tbox{flex:1 1 auto!important;min-width:0;height:34px!important;max-height:34px!important;min-height:34px!important;padding:5px 10px!important;border:2px solid #cdbfd8!important;border-radius:8px!important;background:#fff!important;color:#222;box-shadow:inset 0 1px 3px rgba(0,0,0,.08);text-align:right!important;direction:rtl;resize:none!important;overflow:hidden!important;line-height:18px!important;white-space:nowrap}",
    "body.nb #room>.tablebox.footer>#tbox::placeholder{color:#8a8a95}",
    "body.nb #room>.tablebox.footer>.emob{width:34px!important;height:34px;padding:2px!important;object-fit:contain}",
    "body.nb #room>.tablebox.footer>.tbox{flex:1 1 auto!important;min-width:0;height:34px!important;max-height:34px!important;min-height:34px!important;padding:5px 10px!important;border:2px solid #cdbfd8!important;border-radius:8px!important;background:#fff!important;color:#222;text-align:right!important;direction:rtl;resize:none!important;overflow:hidden!important;line-height:18px!important}",
    "body.nb #room>.tablebox.footer>.btn.callx{color:#4cd964!important}",
    "body.nb #room>.tablebox.footer>.btn.callx,body.nb #room>.tablebox.footer>.btn.sndfile,body.nb #room>.tablebox.footer>.btn.sot,body.nb #room>.tablebox.footer>.btn.stopmico,body.nb #room>.tablebox.footer>.btn.sndpm{box-sizing:border-box;width:34px;max-width:34px;flex:0 0 34px!important;padding:0!important;overflow:hidden}",
    "body.nb #room>.tablebox.footer>.btn.sot,body.nb #room>.tablebox.footer>.btn.stopmico{color:#c040b4!important}",
    "body.nb #room>.tablebox.footer>.btn.sndfile{color:#3da5f4!important}",

    /* ===== أزرار الرسالة (رد / حذف / قلب) ===== */
    "body.nb .blike,body.nb .breply,body.nb .bdel{display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:24px;padding:0 6px!important;margin:0 2px!important;border:1px solid #3b4856!important;border-radius:7px!important;background:linear-gradient(180deg,#27323f 0%,#141c25 100%)!important;background-image:linear-gradient(180deg,#27323f 0%,#141c25 100%)!important;box-shadow:0 1px 3px rgba(0,0,0,.35)!important;line-height:1!important}",
    "body.nb .breply{color:#3da5f4!important}",
    "body.nb .bdel{color:#f06a6a!important}",
    "body.nb .blike{color:#ee5d7c!important}",
    "body.nb .blike::before,body.nb .breply::before,body.nb .bdel::before{font-size:13px}",

    /* [Nopta] رسايل الغرفة: شيل القلب نهائي + صغّر أزرار الرد والحذف */
    "body.nb #d2 .blike{display:none!important}",
    "body.nb .hid.breply,body.nb .hid.bdel,body.nb .hid.blike{display:none}",
    "body.nb #d2 .breply,body.nb #d2 .bdel{min-width:20px!important;height:18px!important;padding:0 4px!important;margin:0 1px!important;border-radius:6px!important}",
    "body.nb #d2 .breply::before,body.nb #d2 .bdel::before{font-size:10px!important}",

    /* ===== نافذة الخاص: الشريط العلوي ===== */
    "body.nb .head.d-flex.nosel{display:flex!important;align-items:center;direction:ltr;height:42px!important;padding:0 5px!important;gap:4px;background:linear-gradient(180deg,#2a3542 0%,#1a232d 100%)!important;border-bottom:1px solid #0d141b}",
    "body.nb .head.d-flex.nosel>*{float:none!important;margin:0!important}",
    "body.nb .head.d-flex.nosel>.btn{display:flex!important;align-items:center;justify-content:center;width:34px;height:32px;padding:0!important;border:1px solid #3b4856!important;border-radius:7px!important;background:linear-gradient(180deg,#27323f 0%,#141c25 100%)!important;box-shadow:0 1px 3px rgba(0,0,0,.35)!important;font-size:0!important}",
    "body.nb .head.d-flex.nosel>.btn::before{font-size:16px;line-height:1}",
    "body.nb .head.d-flex.nosel>.fa-minus{color:#e3b53a!important}",
    "body.nb .head.d-flex.nosel>.fa-expand,body.nb .head.d-flex.nosel>.fa-compress{color:#3da5f4!important}",
    "body.nb .head.d-flex.nosel>.fa-user{color:#3da5f4!important;background:transparent!important;border:0!important;width:24px}",
    "body.nb .head.d-flex.nosel .u-topic{background:rgba(255,255,255,.93)!important;border-radius:9px;padding:0 9px!important}"
  ];
  /* نفس شكل شريط الكتابة لشريط الخاص وشريط التعليقات */
  var css = cssArr.concat(
    cssArr.filter(function (l) { return l.indexOf("#room>.tablebox.footer") > -1; })
      .map(function (l) { return l.split("#room>.tablebox.footer").join(".cont>.tablebox.footer"); })
  ).join("\n");

  function start() {
    var $ = window.jQuery;
    if (!$ || !$("#d0").length) return setTimeout(start, 150);

    var st = document.createElement("style");
    st.id = "barsStyleCss";
    st.textContent = css;
    document.head.appendChild(st);
    document.body.classList.add("nb");

    var $d0 = $("#d0");

    /* شيل النصوص من الأزرار (الأيقونات بس) وغيّر شكل الأيقونات */
    $d0.find(".ae").each(function () {
      var n = this.firstChild, next;
      while (n) {
        next = n.nextSibling;
        if (n.nodeType === 3) this.removeChild(n);
        n = next;
      }
    });
    $d0.find(".fa-comment").removeClass("fa-comment").addClass("fa-comments");
    $d0.find(".fa-commenting").removeClass("fa-commenting").addClass("fa-newspaper-o");
    $d0.find(".fa-gear").removeClass("fa-gear").addClass("fa-sliders");

    /* زر الإشعارات (الجرس) في آخر الشريط السفلي */
    if (!$d0.find(".nb-bell").length) {
      var $bell = $(
        '<button type="button" title="الإشعارات" data-toggle="tab" data-target="#wetchprofilenotifi" ' +
          'class="ae nb-bell fa fa-bell label label-primary"><span class="nt-badge"></span></button>'
      );
      $bell.on("click", function () {
        try { $(".phide").click(); } catch (e) {}
        if (window.ntOpen) window.ntOpen();
        else { $(".pnhead").text("الإشعارات"); $(".dpnl").show(); }
      });
      $d0.append($bell);
    }

    /* مزامنة حالة الجرس (إشعار جديد) مع اللوحة */
    function syncBell() {
      var c = 0;
      try { c = window.ntCount ? window.ntCount() : 0; } catch (e) {}
      $(".nb-bell").toggleClass("has-new", c > 0);
    }
    ["ntBump", "ntOpen", "ntClear"].forEach(function (fn) {
      var orig = window[fn];
      if (typeof orig !== "function" || orig.__nb) return;
      var w = function () {
        var r = orig.apply(this, arguments);
        syncBell();
        return r;
      };
      w.__nb = true;
      window[fn] = w;
    });

    /* تمييز التبويب المفتوح حالياً */
    function markActive() {
      var on = null;
      if ($("#dpnl").is(":visible")) {
        var id = $("#dpnl").children(".tab-pane.active").attr("id");
        if (id) on = "#" + id;
      }
      $d0.find(".ae").each(function () {
        var t = $(this).attr("data-target");
        $(this).toggleClass("nb-on", !!on && t === on);
      });
    }
    /* [FIX-PERF] كانت setInterval كل 300ms تفحص DOM (3.3 مرة/ثانية للأبد).
       الآن: تحديث عند النقر + عند إظهار/إخفاء اللوحة فقط — نفس النتيجة بلا استهلاك دائم */
    $d0.on("click", ".ae", function () { setTimeout(markActive, 60); });
    $("#dpnl").on("shown.bs.tab hidden.bs.tab show.bs.tab hide.bs.tab", function () { setTimeout(markActive, 30); });
    markActive();

    /* ارتفاع الشريط اتغيّر: أعد حساب أحجام اللوحات */
    try { if (typeof window.fixSize === "function") { window.fixSize(); setTimeout(window.fixSize, 400); } } catch (e) {}
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
