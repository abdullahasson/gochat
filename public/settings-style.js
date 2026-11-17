/* شكل لوحة الإعدادات الجديد (نفس صورة المرجع)
   بيتحمّل مع زر "تغيير الشريط العلوي والسفلي" في لوحة التحكم > الإضافات (نفس الزر بالظبط).
   لو الزر اتلغى الملف ده مش بيتحمّل والإعدادات ترجع للشكل الافتراضي.
   ملاحظة: الملف بيعيد ترتيب العناصر الأصلية (بيحرّكها مش بينسخها) فكل الدوال والأحداث القديمة شغّالة زي ما هي. */
(function () {
  "use strict";
  if (window.__settingsStyleLoaded) return;
  window.__settingsStyleLoaded = true;

  var NIGHT_KEY = "st_night";

  /* ===== الوضع الليلي: يتطبق بدري قبل ما الصفحة تتبني ===== */
  function nightSaved() {
    try { return localStorage.getItem(NIGHT_KEY) === "1"; } catch (e) { return false; }
  }
  function setNight(on) {
    document.documentElement.classList.toggle("st-night", !!on);
    try { localStorage.setItem(NIGHT_KEY, on ? "1" : "0"); } catch (e) {}
    syncNight();
  }
  function syncNight() {
    var on = document.documentElement.classList.contains("st-night");
    var b = document.querySelector("#settings .st-night-btn span");
    if (b) b.textContent = on ? "الوضع الليلي يعمل" : "الوضع الليلي متوقف";
  }
  if (nightSaved()) document.documentElement.classList.add("st-night");

  /* خط الصورة (Cairo) لو مش محمّل */
  try {
    if (!document.querySelector('link[href*="family=Cairo"]')) {
      var fl = document.createElement("link");
      fl.rel = "stylesheet";
      fl.href = "https://fonts.googleapis.com/css2?family=Cairo:wght@600;700&display=swap";
      document.head.appendChild(fl);
    }
  } catch (e) {}

  var P = "body.st-new #settings ";
  var F = "font-family:Cairo,Tajawal,Tahoma,sans-serif!important;";
  var css = [
    /* ===== لوحة الإعدادات ===== */
    P + "{background:#fff!important;padding:0!important;color:#333}",
    P + ".st-old,#settings>br{display:none!important}",
    P + "#st-wrap{direction:ltr;padding:3px 6px 10px;box-sizing:border-box;width:100%;" + F + "}",
    P + "#st-wrap *{box-sizing:border-box}",
    P + "#st-wrap *:not(.fa){" + F + "}",
    P + "#st-wrap .fa{font-family:FontAwesome!important}",

    /* الملصقات السودا */
    P + ".st-lb{display:inline-flex;align-items:center;justify-content:center;height:23px;padding:0 8px;margin:0;background:#000;color:#fff;font-size:14px!important;font-weight:700!important;line-height:1!important;white-space:nowrap;border-radius:0;text-shadow:none!important;float:none!important}",
    P + ".st-between{display:flex;align-items:center;justify-content:space-between;margin-top:3px}",
    P + ".st-row{display:flex;align-items:center;flex-wrap:nowrap;gap:5px;margin-top:2px;min-height:28px;min-width:0}",
    P + ".st-row .st-lb{flex:0 0 auto}",

    /* مربعات الكتابة */
    P + "textarea.st-in{display:block;width:100%!important;height:32px!important;min-height:32px!important;max-height:32px!important;margin:2px 0 0!important;padding:4px 10px!important;border:1px solid #dcdcdc!important;border-radius:12px!important;background:#fff!important;color:#555!important;font-size:14px!important;line-height:22px!important;resize:none!important;overflow:hidden!important;white-space:nowrap;box-shadow:inset 0 1px 2px rgba(0,0,0,.05)!important;text-align:start;outline:none}",
    P + "textarea.st-in:focus{border-color:#7aa7d9!important}",

    /* مربعات الألوان */
    P + ".st-sw{position:relative;flex:0 1 74px;width:74px;min-width:50px;height:28px;display:block!important}",
    P + ".st-sw input{display:none!important}",
    P + ".st-sw .cpick{position:static!important;display:block!important;width:100%!important;height:100%!important;margin:0!important;padding:0!important;border:1px solid rgba(0,0,0,.35)!important;border-radius:6px!important;outline:none;font-size:12px!important;font-weight:700!important;line-height:26px!important;text-align:center;float:none!important}",
    P + ".st-sw .cpick.sbg{border-color:#ddd!important}",
    P + ".st-grow{flex:1 1 auto}",
    P + ".st-xbtn,#st-wrap .st-save{display:inline-flex;align-items:center;justify-content:center;height:30px;border:0!important;border-radius:7px!important;color:#fff!important;cursor:pointer;line-height:1!important;box-shadow:0 1px 3px rgba(0,0,0,.25);-webkit-tap-highlight-color:transparent}",
    P + ".st-xbtn{width:26px;background:#e0404e!important;font-size:14px!important}",
    P + ".st-save{flex:0 0 auto;min-width:58px;padding:0 8px!important;gap:4px;background:#2fb344!important;font-size:14px!important;font-weight:700!important}",
    P + ".st-save .fa,.st-xbtn .fa{font-family:FontAwesome!important;font-size:14px!important;float:none!important;margin:0!important}",
    P + ".st-xbtn:active,.st-save:active,.st-pill:active{transform:scale(.97)}",

    /* القوائم المنسدلة */
    P + "select.st-sel{display:block;width:100%!important;height:32px!important;margin:4px 0 0!important;padding:0 10px!important;float:none!important;border:1.5px solid #6aa0d8!important;border-radius:7px!important;background:#fff url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='9' viewBox='0 0 14 9'%3E%3Cpath d='M1 1l6 6 6-6' fill='none' stroke='%23666' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\") no-repeat right 12px center!important;color:#555!important;font-size:14px!important;font-weight:400!important;text-align:left;direction:ltr;-webkit-appearance:none;appearance:none;outline:none}",

    /* ===== الأزرار الطويلة (pills) ===== */
    P + ".st-pill{position:relative;display:flex;align-items:center;justify-content:center;direction:rtl;width:100%!important;height:36px;margin:4px 0 0!important;padding:0 40px!important;float:none!important;clear:both;border:1px solid #f0dcf3!important;border-radius:24px!important;background:#fff!important;background-image:none!important;color:#333!important;font-size:14px!important;font-weight:700!important;line-height:1!important;text-align:center;text-shadow:none!important;box-shadow:0 1px 4px rgba(0,0,0,.09)!important;cursor:pointer;overflow:hidden;-webkit-tap-highlight-color:transparent;animation:none!important}",
    P + ".st-pill:before,.st-pill:after{display:none!important}",
    P + ".st-pill>span:not(.fa):not(.st-av):not(.nt-badge){font-size:14px!important;font-weight:700!important;color:inherit!important}",
    P + ".st-pill .fa,.st-pill>i{position:absolute;left:14px;top:50%;transform:translateY(-50%);width:auto!important;height:auto!important;margin:0!important;padding:0!important;background:none!important;box-shadow:none!important;border-radius:0!important;float:none!important;font-family:FontAwesome!important;font-size:16px!important;color:inherit!important;line-height:1!important;opacity:1;animation:none}",
    P + ".st-orange{background:#ffa500!important;border-color:#ffa500!important;color:#fff!important}",
    P + ".st-purple{background:#d97bff!important;border-color:#d97bff!important;color:#fff!important}",
    P + ".st-red{background:#dc5650!important;border-color:#dc5650!important;color:#fff!important}",
    P + ".st-mint{background:#dff1ec!important;border-color:#cfe6df!important;color:#17715b!important}",
    P + ".st-av{position:absolute;left:10px;top:50%;margin-top:-14px;width:28px;height:28px;border-radius:4px;background-color:#ddd;background-size:cover;background-position:center;background-repeat:no-repeat;border:1px solid #cfcfcf}",

    /* أزرار الاختيار (تعطيل المحادثات / التنبيهات) */
    P + ".st-chk{padding:0 50px!important}",
    P + ".st-chk .fa,#settings .st-chk>span.fa{position:absolute;left:6px;top:50%;transform:translateY(-50%);display:flex!important;align-items:center;justify-content:center;width:38px!important;height:28px!important;margin:0!important;padding:0!important;border:1px solid #6e6a30;border-radius:9px!important;background:linear-gradient(180deg,#a49f58 0%,#85803c 100%)!important;color:#fff!important;font-family:FontAwesome!important;font-size:17px!important;box-shadow:0 2px 4px rgba(0,0,0,.28)!important}",
    P + ".st-chk>span.fa:not(.fa-check){background:#fff!important;color:transparent!important}",

    /* الإشعارات والاستكشاف والألعاب (عناصر أصلية بتتحرّك) */
    P + ".nt-open{display:flex!important}",
    P + ".nt-open .nt-a,.oth-open .oth-a,.gm-open .gm-cup{display:none!important}",
    P + ".nt-open .nt-ic,.oth-open .oth-ic,.gm-open .gm-ic{position:absolute!important;left:14px;top:50%;transform:translateY(-50%);width:auto!important;height:auto!important;background:none!important;box-shadow:none!important;border-radius:0!important;font-size:16px!important;color:inherit!important;animation:none}",
    P + ".nt-open .nt-t,.oth-open .oth-t,.gm-open .gm-t{flex:0 1 auto!important;font-size:14px!important;font-weight:700!important;letter-spacing:0!important;color:inherit!important;text-shadow:none!important}",
    P + ".nt-open .nt-badge{position:absolute;right:14px;top:50%;transform:translateY(-50%)}",
    P + ".nt-open.has-new .nt-ic{animation:ntring 1.6s ease-in-out infinite}",
    P + ".gm-open .gm-ic .fa,.oth-open .oth-ic .fa{position:static!important;transform:none!important;color:inherit!important;font-size:16px!important}",

    /* ===== هيدر اللوحة (أسود + زر إغلاق أحمر) ===== */
    "#dpnl.st-on{border:3px solid #000!important;border-radius:0!important;background:#fff!important}",
    "#dpnl.st-on>.pnhead{display:block!important;float:none!important;width:100%!important;height:38px;margin:0!important;padding:0 46px!important;border:0!important;border-radius:0!important;background:#000!important;color:#fff!important;text-align:center;font-size:16px!important;font-weight:700!important;line-height:38px!important;" + F + "}",
    "#dpnl.st-on>.fa-close{position:absolute!important;top:4px;right:5px;z-index:5;width:30px!important;height:30px;margin:0!important;padding:0!important;border:0!important;border-radius:7px!important;background:#e63946!important;color:#fff!important;font-size:16px!important;line-height:30px!important;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.4)}",
    "#dpnl.st-on>.fa-close:before{font-size:16px!important}",

    /* ===== نافذة المتجاهلين ===== */
    "#st-ign{position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.55);direction:rtl;" + F + "}",
    "#st-ign .st-card{width:92%;max-width:340px;max-height:72vh;display:flex;flex-direction:column;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.45)}",
    "#st-ign .st-card-h{display:flex;align-items:center;justify-content:space-between;padding:0 12px;height:46px;background:#000;color:#fff;font-size:18px!important;font-weight:700!important}",
    "#st-ign .st-card-h b{font-size:18px!important;color:#fff;" + F + "}",
    "#st-ign .st-x{width:34px;height:32px;border:0;border-radius:8px;background:#e63946;color:#fff;font-size:20px!important;line-height:1;cursor:pointer}",
    "#st-ign .st-list{overflow-y:auto;padding:8px}",
    "#st-ign .st-empty{padding:22px 8px;text-align:center;color:#777;font-size:17px!important}",
    "#st-ign .st-it{display:flex;align-items:center;gap:8px;padding:6px;margin-bottom:6px;border:1px solid #eee;border-radius:12px}",
    "#st-ign .st-it i{flex:0 0 38px;width:38px;height:38px;border-radius:8px;background:#ddd center/cover no-repeat}",
    "#st-ign .st-it b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:16px!important;color:#333;" + F + "}",
    "#st-ign .st-un{flex:0 0 auto;height:34px;padding:0 12px;border:0;border-radius:17px;background:#ffa500;color:#fff;font-size:15px!important;font-weight:700!important;cursor:pointer;" + F + "}",

    /* ===== الوضع الليلي ===== */
    "html.st-night{filter:invert(1) hue-rotate(180deg);background:#fff}",
    "html.st-night img,html.st-night video,html.st-night canvas,html.st-night iframe,html.st-night .u-pic,html.st-night .spic,html.st-night .st-av,html.st-night .prod[style*=\"background-image\"],html.st-night #st-ign .st-it i{filter:invert(1) hue-rotate(180deg)}"
  ].join("\n");

  /* هيدر اللوحة بـ :has = بيتطبّق فوراً مع فتح التبويب (من غير رعشة)، وكلاس st-on نسخة احتياطية */
  css += "\n" + css.split("\n").filter(function (l) { return l.indexOf("#dpnl.st-on") === 0; })
    .map(function (l) { return l.split("#dpnl.st-on").join("body.st-new #dpnl:has(#settings.active)"); }).join("\n");

  /* تصغير كل قيم px (الأكبر من 3) عشان الإعدادات تبان بعيدة ومتناسقة. غيّر K لو عايزها أصغر/أكبر */
  var K = 0.82;
  css = css.replace(/(\d*\.?\d+)px/g, function (m, n) {
    n = parseFloat(n);
    return (n <= 3 ? n : Math.round(n * K)) + "px";
  });

  function lum(hex) {
    var h = String(hex || "").replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (h.length !== 6) return 255;
    var r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }

  function start() {
    var $ = window.jQuery;
    if (!$ || !$("#settings .stopic").length || !$("#settings .smsg").length || typeof window.setprofile !== "function") {
      return setTimeout(start, 150);
    }
    var $s = $("#settings");
    if ($s.find("#st-wrap").length) return;

    var st = document.createElement("style");
    st.id = "settingsStyleCss";
    st.textContent = css;
    document.head.appendChild(st);
    document.body.classList.add("st-new");

    var $w = $('<div id="st-wrap"></div>');
    function lb(t) { return $('<div class="st-lb"></div>').text(t); }

    /* الزخرفة */
    $w.append($('<div class="st-between"></div>').append(lb("الزخرفة"), lb("الملف الشخصي")));
    $w.append($s.find("textarea.stopic").first().addClass("st-in").attr({ rows: 1, dir: "auto" }));

    /* الحالة */
    $w.append($('<div class="st-row"></div>').append(lb("الحالة")));
    $w.append($s.find("textarea.smsg").first().addClass("st-in").attr({ rows: 1, dir: "auto" }));

    /* الألوان (نفس العناصر الأصلية: الحقل المخفي + زر الاختيار) */
    function colorRow(cls, label, extra) {
      var $c = $s.find("." + cls + "-container").first();
      if (!$c.length) return;
      var $r = $('<div class="st-row"></div>').append(lb(label), $c.addClass("st-sw"));
      if (extra) extra($r);
      $w.append($r);
    }
    colorRow("mscolor", "لون الحالة");
    colorRow("mcolor", "لون الخط");
    colorRow("scolor", "لون الإسم");
    colorRow("scopic", "حدود الصورة");
    colorRow("sbg", "لون الخلفية", function ($r) {
      var $x = $('<button type="button" class="st-xbtn" title="الأبيض"><i class="fa fa-times"></i></button>');
      $x.on("click", function () {
        var v = "#FFFFFF";
        $(".sbg").each(function () {
          if (this.tagName === "INPUT") { this.value = v; $(this).attr("v", v); }
          $(this).css("background-color", v);
          if (this.tagName !== "INPUT") $(this).attr({ v: v, value: v });
        });
        syncHex();
      });
      var $sv = $('<button type="button" class="st-save"><i class="fa fa-pencil-square-o"></i><span>حفظ</span></button>');
      $sv.on("click", function () {
        try { window.setprofile(); } catch (e) {}
        var $t = $sv.find("span"), old = "حفظ";
        $t.text("تم ✓");
        setTimeout(function () { $t.text(old); }, 1200);
      });
      $r.append($x, $('<div class="st-grow"></div>'), $sv);
    });

    /* حجم الخط + السيرفر الصوتي (العناصر الأصلية) */
    var $zoom = $s.find("#zoom").first();
    if ($zoom.length) $w.append($zoom.removeClass("fl btn btn-primary").addClass("st-sel"));
    var $turn = $s.find("#turn_server").first();
    if ($turn.length) $w.append($turn.removeClass("fl btn btn-primary").addClass("st-sel"));

    function pill(cls, icon, text, fn) {
      var $b = $('<button type="button" class="st-pill ' + cls + '"><i class="fa ' + icon + '"></i><span></span></button>');
      $b.find("span").text(text);
      $b.on("click", fn);
      return $b;
    }
    function fixText($el, from, to) {
      $el.contents().each(function () {
        if (this.nodeType === 3 && this.nodeValue.indexOf(from) > -1) this.nodeValue = this.nodeValue.split(from).join(to);
      });
    }

    /* المستخدمون المتجاهلين */
    $w.append(pill("st-orange", "fa-ban", "المستخدمون المتجاهلين", showIgnored));

    /* الإشعارات (الزر الأصلي) */
    var $nt = $s.find(".nt-open").first();
    if ($nt.length) $w.append($nt.addClass("st-pill st-purple"));

    /* تغيير الصورة / حذف الصورة */
    var $chg = pill("", "", "تغيير الصورة", function () {
      try { if (typeof window.S_PIC === "function") window.S_PIC("user"); } catch (e) {}
    });
    $chg.find("i").replaceWith('<span class="st-av spic fitimg"></span>');
    $w.append($chg);
    $w.append(pill("st-red", "fa-times", "حذف الصورة", function () {
      var b = $s.find(".ppop .btn-danger")[0];
      if (b) b.click();
    }));

    /* تعطيل المحادثات الخاصة / التنبيهات (العناصر الأصلية) */
    var $pm = $s.find('label[onclick*="nopm"]').first();
    var $nn = $s.find('label[onclick*="nonot"]').first();
    [$pm, $nn].forEach(function ($e) {
      if (!$e.length) return;
      $e.removeClass("fl btn tc border label bb4").addClass("st-pill st-chk").removeAttr("style");
      $w.append($e);
    });
    fixText($pm, "الخاصه", "الخاصة");

    /* عناصر أصلية إضافية (الألعاب / إعلان / إدارة الغرفة / لوحة التحكم) — بنفس الشكل */
    var $gm = $s.find(".gm-open").first();
    if ($gm.length) $w.append($gm.removeClass("label tc border btn fl").addClass("st-pill").removeAttr("style"));
    [".pmsg", ".redit", ".cp"].forEach(function (sel) {
      var $e = $s.find("label" + sel).first();
      if (!$e.length) return;
      $e.removeClass("label tc border btn fl label-info label-danger").addClass("st-pill").removeAttr("style");
      $e.find(".fa").removeClass("fl");
      $w.append($e);
    });

    /* تفريغ بيانات الموقع / لون التصميم الأصلي / الوضع الليلي */
    $w.append(pill("", "fa-trash-o", "تفريغ بيانات الموقع", clearSite));
    $w.append(pill("", "fa-paint-brush", "لون التصميم الأصلي", resetLook));
    $w.append(pill("st-night-btn", "fa-moon-o", "الوضع الليلي متوقف", function () {
      setNight(!document.documentElement.classList.contains("st-night"));
    }));

    /* استكشف (زر الاضافات والميزات الأصلي) */
    var $ex = $s.find(".oth-open").first();
    if ($ex.length) {
      $ex.find(".oth-ic").html('<i class="fa fa-compass"></i>');
      $ex.find(".oth-t").text("استكشف");
      $w.append($ex.addClass("st-pill st-mint"));
    }

    /* تغيير كلمة المرور */
    $w.append(pill("", "fa-key", "تغيير كلمة المرور", function () {
      try { if (typeof window.ChangePassword === "function") window.ChangePassword(); } catch (e) {}
    }));

    /* تسجيل الخروج (الزر الأصلي) */
    var $lo = $s.find('label[onclick*="logout"]').first();
    if ($lo.length) {
      $lo.removeClass("label border btn label-danger tc fl").addClass("st-pill st-red").removeAttr("style");
      $lo.find(".fa").removeClass("fl");
      fixText($lo, "تسجيل خروج", "تسجيل الخروج");
      $lo.contents().filter(function () { return this.nodeType === 3 && $.trim(this.nodeValue) !== ""; })
        .wrap("<span></span>");
      $w.append($lo);
    }

    /* إخفاء الباقي من القديم وإضافة الجديد */
    $s.children().addClass("st-old");
    $s.append($w);

    syncNight();
    syncHex();

    /* [FIX-C10/P1] كانت حلقة setInterval(300ms) تفحص $("#dpnl").is(":visible")
       للأبد (فحص :visible يجبر تخطيطًا متزامنًا — مرتين في الثانية طوال الجلسة
       حتى واللوحة مغلقة). الآن: المزامنة تعمل فقط أثناء كون اللوحة مفتوحة،
       وتُطلق عبر: حدث تبديل التبويبات + مراقب سمات #dpnl (يلتقط .show()/.hide()
       من كل مواضع الكود) — وبمجرد انتهاء الحالة المفتوحة يوقف المؤقت نفسه.
       نفس سلوك التزامن السابق تمامًا أثناء الفتح، وصفر عمل واللوحة مغلقة. */
    var lastBg = "";
    var syncT = null;
    function syncOpenTick() {
      var open = $s.hasClass("active") && $("#dpnl").is(":visible");
      $("#dpnl").toggleClass("st-on", open);
      if (!open) {
        if (syncT) { clearInterval(syncT); syncT = null; }
        return;
      }
      var bg = $(".spic").first().css("background-image");
      if (bg && bg !== lastBg) { lastBg = bg; $(".st-av").css("background-image", bg); }
      syncHex();
    }
    function startSync() {
      if (!syncT) {
        syncT = setInterval(syncOpenTick, 300);
        syncOpenTick();
      }
    }
    $(document).on("shown.bs.tab hidden.bs.tab", 'a[data-toggle="tab"]', startSync);
    try {
      var __dpnlHost = document.getElementById("dpnl");
      if (__dpnlHost && typeof MutationObserver !== "undefined") {
        new MutationObserver(startSync).observe(__dpnlHost, { attributes: true, attributeFilter: ["style", "class"] });
      }
    } catch (e) {}
    startSync();
  }

  function syncHex() {
    var $ = window.jQuery;
    if (!$) return;
    var $i = $("#settings input.sbg").first();
    var v = String($i.val() || "#FFFFFF").toUpperCase();
    if (v.charAt(0) !== "#") v = "#" + v;
    $("#settings button.sbg").text(v).css("color", lum(v) > 150 ? "#222" : "#fff");
  }

  /* ===== المستخدمون المتجاهلين ===== */
  function showIgnored() {
    var $ = window.jQuery;
    $("#st-ign").remove();
    var $o = $(
      '<div id="st-ign"><div class="st-card"><div class="st-card-h"><b>المستخدمون المتجاهلين</b>' +
        '<button type="button" class="st-x">×</button></div><div class="st-list"></div></div></div>'
    );
    function render() {
      var $l = $o.find(".st-list").empty();
      var list = typeof BLOCK_USER !== "undefined" && BLOCK_USER ? BLOCK_USER : [];
      if (!list.length) { $l.append('<div class="st-empty">لا يوجد مستخدمين متجاهلين</div>'); return; }
      list.slice().forEach(function (bl) {
        var u = null;
        try {
          for (var k in U_CASH) { if (U_CASH[k] && U_CASH[k].lid == bl.lid) { u = U_CASH[k]; break; } }
        } catch (e) {}
        var name = "عضو غير متصل";
        if (u) name = $.trim($("<div>").html(u.topic || "").text()) || u.username || name;
        var $it = $('<div class="st-it"><i></i><b></b><button type="button" class="st-un">إلغاء التجاهل</button></div>');
        $it.find("b").text(name);
        if (u && u.pic) $it.find("i").css("background-image", 'url("' + u.pic + '")');
        $it.find(".st-un").on("click", function () {
          try {
            if (u && typeof window.unmute === "function") window.unmute(u);
            else {
              for (var i = BLOCK_USER.length - 1; i >= 0; i--) if (BLOCK_USER[i].lid == bl.lid) BLOCK_USER.splice(i, 1);
              if (typeof window.saveblocked === "function") window.saveblocked();
            }
          } catch (e) {}
          render();
        });
        $l.append($it);
      });
    }
    $o.on("click", function (e) { if (e.target === this) $o.remove(); });
    $o.find(".st-x").on("click", function () { $o.remove(); });
    render();
    $("body").append($o);
  }

  /* ===== تفريغ بيانات الموقع ===== */
  function clearSite() {
    if (!confirm("هيتم مسح كل بيانات الموقع المحفوظة في المتصفح (الدخول المحفوظ وقائمة التجاهل والإعدادات المحلية) وإعادة تحميل الصفحة. تكمل؟")) return;
    try { window.onbeforeunload = null; } catch (e) {}
    try { localStorage.clear(); sessionStorage.clear(); } catch (e) {}
    try {
      if (window.caches && caches.keys) caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); }).catch(function () {});
    } catch (e) {}
    try {
      document.cookie.split(";").forEach(function (c) {
        var n = c.split("=")[0].replace(/^\s+|\s+$/g, "");
        if (n) document.cookie = n + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      });
    } catch (e) {}
    setTimeout(function () { location.href = "/"; }, 300);
  }

  /* ===== لون التصميم الأصلي: يرجّع مظهر المتصفح المحلي (الليلي + حجم الخط) ===== */
  function resetLook() {
    var $ = window.jQuery;
    if (!confirm("الرجوع للمظهر الأصلي (إيقاف الوضع الليلي وحجم الخط 95%)؟")) return;
    setNight(false);
    try {
      document.body.style.zoom = "0.95";
      $("#zoom").val("0.95");
      if (typeof window.setv === "function") window.setv("zoom", "0.95");
      if (typeof window.fixSize === "function") window.fixSize();
    } catch (e) {}
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
