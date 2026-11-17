/* ترتيب لوحة الإعدادات بالشكل الافتراضي (بني) زي الصورة المرجعية.
   بيحرّك العناصر الأصلية (مش بينسخها) فكل الدوال والأحداث القديمة شغّالة زي ما هي.
   لو زر "تغيير الشريط العلوي والسفلي" مفعّل بيسيب الشكل الخاص بالزر. */
(function () {
  "use strict";
  if (window.__settingsDefaultLoaded) return;
  window.__settingsDefaultLoaded = true;

  function build() {
    var $ = window.jQuery;
    if (!$ || !$("#settings .stopic").length || !$("#settings .spic").length) return setTimeout(build, 200);
    if (window.__settingsStyleLoaded || window.__barsStyleLoaded) return; /* الزر مفعّل */
    var $s = $("#settings");
    if ($s.find("#rs-wrap").length) return;

    var $w = $('<div id="rs-wrap"></div>');
    var $old = $s.children();

    /* ----- الزخرفة والحالة: ملصق فوق + مربع تحته ----- */
    function field(sel) {
      var $ta = $s.find(sel).first();
      var $lb = $ta.siblings(".label").first();
      var $f = $('<div class="rs-field"></div>');
      $f.append($lb.addClass("rs-lb")).append($ta);
      return $f;
    }
    $w.append(field(".stopic")).append(field(".smsg"));

    /* ----- صفوف الألوان (من غير "حدود الصورة" زي الصورة المرجعية) ----- */
    ["scolor", "mcolor", "sbg", "mscolor"].forEach(function (c) {
      var $row = $s.find("." + c + "-container").first().closest(".d-flex");
      if (!$row.length) return;
      var $lb = $row.children(".label").first().addClass("rs-lb");
      var $sw = $row.children("[class$='-container']").first().addClass("rs-sw");
      var $r = $('<div class="rs-crow"></div>').append($lb).append($sw);
      $w.append($r);
    });
    var $cop = $s.find(".scopic-container").first().closest(".d-flex");
    if ($cop.length) $cop.addClass("rs-hide");

    /* ----- زر الحفظ ----- */
    var $save = $s.find('button[onclick^="setprofile"]').first();
    $save.contents().filter(function () { return this.nodeType === 3; }).remove();
    $save.append(document.createTextNode("حفظ")).addClass("rs-save");
    $w.append($save);

    /* ----- القوايم ----- */
    $w.append($s.find("#zoom").addClass("rs-sel")).append($s.find("#turn_server").addClass("rs-sel"));

    /* ----- تغيير / حذف الصورة ----- */
    var $pic = $s.find(".spic").first();
    $pic.removeAttr("onclick");
    $s.find(".ppop").hide();
    var $chg = $('<button type="button" class="rs-btn rs-pic"><span>تغير الصوره</span></button>')
      .on("click", function () { try { S_PIC("user"); } catch (e) {} })
      .prepend($pic);
    var $del = $('<button type="button" class="rs-btn rs-del"><i class="fa fa-user-times"></i><span>حذف الصوره</span></button>')
      .on("click", function () { var b = $s.find(".ppop .fa-ban")[0]; if (b) b.click(); });
    $w.append($chg).append($del);

    /* ----- الأزرار الباقية بالترتيب ----- */
    function mv($e, extra) { if ($e && $e.length) { $e.addClass("rs-btn " + (extra || "")); $w.append($e); } }
    mv($s.find('label[onclick*="nopm"]').first());
    mv($s.find('label[onclick*="nonot"]').first());
    mv($s.find("label.pmsg").first());
    mv($s.find("label.redit").first());
    mv($s.find("label.cp").first());
    mv($s.find(".gm-open").first(), "rs-gm");

    /* وضع الرابط → "اضافة رابط" برا */
    var $mlk = $s.find(".mlk-open").first();
    if ($mlk.length) { $mlk.find(".mlk-t").text("اضافة رابط"); $mlk.addClass("rs-mlk"); $w.append($mlk); }

    var $oth = $s.find(".oth-open").first();
    $oth.find(".oth-ic").html('<i class="fa fa-comments"></i>');
    mv($oth, "rs-oth");
    var $nt = $s.find(".nt-open").first();
    mv($nt, "rs-nt");

    var $pw = $('<button type="button" class="rs-btn rs-pass"><i class="fa fa-key"></i><span>تغيير كلمة المرور</span></button>')
      .on("click", function () { try { ChangePassword(); } catch (e) {} });
    $w.append($pw);

    var $out = $s.find('label[onclick^="logout"]').first();
    mv($out, "rs-out");

    /* باقي العناصر القديمة تتخبّى، والجديد يتحط في الأول */
    $old.each(function () { if (!$.contains($w[0], this)) $(this).addClass("rs-old"); });
    $s.prepend($w);
    $s.addClass("rs-on");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
