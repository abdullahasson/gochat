/*
 * [ADDED - PHASE 2] غلاف البروفايل + أفاتار دائري + أيقونتين كاميرا (لصاحب البروفايل بس)
 *  - x2.js بينادي PC_ONPROFILE(id) داخل upro()
 *  - تغيير الأفاتار: نفس الدالة الأصلية S_PIC("user")
 *  - تغيير الغلاف: رفع على uppic?nf=cover ثم SEND_EVENT_EMIT_COVER
 *  - أي تحديث للعضو (u^) والبروفايل مفتوح بيحدّث الشكل لحظياً
 */
(function () {
  var DEFAULT_COVER = "imgs/cover-default.svg";
  var COVER_RE = /^\/pic\/\d+\.[a-z0-9]+\.jpg$/i;
  var current = null;
  var busy = false;

  function $m() { return $("#upro"); }

  function coverOf(u) {
    return u && typeof u.cover === "string" && COVER_RE.test(u.cover) ? u.cover : "";
  }

  function css(url) { return 'url("' + String(url).replace(/"/g, "%22") + '")'; }

  function render(id) {
    var u = typeof U_CASH !== "undefined" ? U_CASH[id] : null;
    if (!u) return;
    var $p = $m();
    var c = coverOf(u);
    var own = typeof M_ID !== "undefined" && id == M_ID;
    $p.find(".pc-cover").css("background-image", css(c || DEFAULT_COVER)).toggleClass("pc-has", !!c);
    $p.find(".pc-wrap").toggleClass("pc-own", !!own);
    var name = u.topic || "";
    $p.find(".pc-title").text(name);
    $p.find(".pc-name").text(name);
    $p.find(".pc-mini").css("background-image", u.pic ? css(u.pic) : "none");
    $p.find(".u-pic2").css("background-image", u.pic ? css(u.pic) : "none");
    $p.find(".u-pic").css("background-image", u.pic ? css(u.pic) : "none");
  }

  window.PC_ONPROFILE = function (id) {
    current = id;
    render(id);
  };

  /* تحديث لحظي لو العضو غيّر صورته/غلافه والبروفايل مفتوح */
  (function hook() {
    if (typeof window.updateu !== "function") return setTimeout(hook, 300);
    if (window.updateu.__pc) return;
    var orig = window.updateu;
    var wrapped = function (id) {
      var r = orig.apply(this, arguments);
      try {
        if (current != null && id == current && $m().is(":visible")) render(id);
      } catch (e) {}
      return r;
    };
    wrapped.__pc = true;
    window.updateu = wrapped;
  })();

  /* تغيير صورة البروفايل (دايرة) — بنستخدم الدالة الأصلية */
  $(document).on("click", "#upro .pc-cam-av", function (e) {
    e.stopPropagation();
    if (typeof M_ID === "undefined" || current != M_ID) return;
    if (typeof S_PIC === "function") S_PIC("user");
  });

  /* تغيير الغلاف */
  $(document).on("click", "#upro .pc-cam-cover", function (e) {
    e.stopPropagation();
    if (typeof M_ID === "undefined" || current != M_ID || busy) return;
    var $in = $("<input accept='image/*' type='file' style='display:none;'/>");
    $in.on("change", function () {
      var f = $in.prop("files")[0];
      if (!f) return;
      var fd = new FormData();
      fd.append("photo", f);
      var $cv = $m().find(".pc-cover").addClass("pc-loading");
      busy = true;
      $.ajax({
        url: "uppic?nf=cover",
        type: "POST",
        data: fd,
        cache: false,
        processData: false,
        contentType: false,
        timeout: 0,
        success: function (data) {
          busy = false;
          $cv.removeClass("pc-loading");
          var parts = String(data).split("@");
          if (parts[1] !== "cover" || !COVER_RE.test(parts[0])) return;
          SEND_EVENT_EMIT("SEND_EVENT_EMIT_COVER", { cover: parts[0] });
        },
        error: function (x) {
          busy = false;
          $cv.removeClass("pc-loading");
          alert((x.responseJSON && x.responseJSON.message) || "فشل رفع الصوره");
        }
      });
    });
    $in.trigger("click");
  });

  /* رجوع للغلاف الافتراضي */
  $(document).on("click", "#upro .pc-del-cover", function (e) {
    e.stopPropagation();
    if (typeof M_ID === "undefined" || current != M_ID) return;
    if (!confirm("رجوع للغلاف الافتراضي؟")) return;
    SEND_EVENT_EMIT("SEND_EVENT_EMIT_COVER", { cover: "" });
  });
})();
