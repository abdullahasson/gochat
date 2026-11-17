/* ==========================================================
   نافذة "إضافة رابط وسائط" (يوتيوب / انستجرام / تيك توك)
   - بتفتح لما المستخدم يضغط زر الرابط في الإعدادات
   - بتقرأ وتكتب في الحقل المخفي .urluto عشان باقي الكود (setprofile / updateu) يفضل شغال زي ما هو
   الاستخدام: openMediaLink()  /  closeMediaLink()  /  refreshMediaBtn()
   ========================================================== */
(function () {
  "use strict";

  var CSS = [
    "#mlk{position:fixed;inset:0;z-index:99995;display:none;direction:rtl;align-items:center;justify-content:center;padding:44px 34px;background:rgba(0,0,0,.55);font-family:'Noto Naskh Arabic','Droid Arabic Naskh','Amiri',serif}",
    "#mlk.on{display:flex}",
    "#mlk *{box-sizing:border-box;font-family:inherit!important;text-shadow:none!important;margin:0}",
    "#mlk .bx{width:100%;max-width:310px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 12px 50px rgba(0,0,0,.45)}",
    "#mlk .hd{display:flex;align-items:center;gap:10px;padding:10px 14px;background:#6e4a4a;color:#fff}",
    "#mlk .hd b{flex:1;font-size:15px!important;font-weight:700!important}",
    "#mlk .x{width:32px;height:32px;border:0;border-radius:10px;background:#c80000;color:#fff;cursor:pointer;font-size:20px!important;line-height:32px!important;padding:0;text-align:center}",
    "#mlk .bd{padding:12px 14px 14px;color:#1f3a6e}",
    "#mlk .ds{font-size:14px!important;font-weight:700!important;line-height:1.7!important;margin-bottom:8px}",
    "#mlk .lb{display:block;font-size:14px!important;font-weight:700!important;margin-bottom:6px}",
    "#mlk .in{display:block;width:100%;height:40px;padding:0 10px;border:1.5px solid #1f3a6e;border-radius:10px;background:#fff;color:#111;font-size:14px!important;direction:ltr;text-align:left;outline:0}",
    "#mlk .in::placeholder{color:#777;direction:rtl}",
    "#mlk .in:focus{box-shadow:0 0 0 3px rgba(110,74,74,.25)}",
    "#mlk .er{min-height:22px;margin-top:6px;color:#c80000;font-size:15px!important;font-weight:700!important}",
    "#mlk .ft{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}",
    "#mlk .bt{flex:1 1 auto;height:38px;padding:0 12px;border:1.5px solid transparent;border-radius:10px;cursor:pointer;font-size:14px!important;font-weight:700!important;white-space:nowrap}",
    "#mlk .bt:active{opacity:.85}",
    "#mlk .bt.sv{background:#6e4a4a;color:#fff}",
    "#mlk .bt.dl{background:#c80000;color:#fff}",
    "#mlk .bt.cn{background:#fff;color:#b00000;border-color:#b00000}",
    /* زر الإعدادات: خلفية سودا وأيقونات منورة على الجانبين */
    ".mlk-open{display:flex;direction:ltr;align-items:center;justify-content:space-between;gap:6px;width:100%;height:52px;margin:2px 0;padding:0 10px;background:#000;border:1px solid #444;border-radius:6px;color:#fff;cursor:pointer;overflow:hidden;-webkit-tap-highlight-color:transparent;transition:transform .1s,box-shadow .2s}",
    ".mlk-open:active{transform:scale(.98)}",
    ".mlk-open.has{box-shadow:inset 0 0 0 1px #2ecc71,0 0 8px rgba(46,204,113,.45)}",
    ".mlk-open .mlk-t{flex:1;text-align:center;font-size:19px!important;font-weight:700!important;color:#fff;white-space:nowrap}",
    ".mlk-open .mlk-ic{flex:0 0 auto;display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:10px}",
    ".mlk-open .yt{background:linear-gradient(145deg,#8a0000,#3a0000);border:1.5px solid #ff2d2d;box-shadow:0 0 7px #e00000,inset 0 0 6px rgba(255,0,0,.6)}",
    ".mlk-open .sc{background:linear-gradient(145deg,#6b6500,#2e2b00);border:1.5px solid #f2e600;box-shadow:0 0 7px #d8cc00,inset 0 0 6px rgba(255,240,0,.5)}",
    ".mlk-open .ig{background:linear-gradient(45deg,#f9a825,#e1306c 50%,#833ab4);border:1.5px solid #ff4fa0;box-shadow:0 0 8px #d6249f}",
    ".mlk-open .tt{border-radius:50%;background:#0d0d0d;border:2px solid #25f4ee;box-shadow:0 0 8px #25f4ee,0 0 4px #fe2c55}"
  ].join("");

  var built = false, box, inp, err;

  // الستايل بيتضاف أول ما الملف يتحمل (عشان زر الإعدادات يظهر منسق من البداية)
  (function injectCss() {
    var st = document.createElement("style");
    st.id = "mlk-css";
    st.textContent = CSS;
    document.head.appendChild(st);
  })();

  function build() {
    if (built) return;
    built = true;

    box = document.createElement("div");
    box.id = "mlk";
    box.innerHTML =
      '<div class="bx" role="dialog" aria-modal="true">' +
        '<div class="hd"><b>إضافة رابط وسائط</b><button type="button" class="x" aria-label="إغلاق">&times;</button></div>' +
        '<div class="bd">' +
          '<div class="ds">يمكنك إضافة روابط <span style="direction:ltr;unicode-bidi:embed">YouTube</span> أو <span style="direction:ltr;unicode-bidi:embed">Instagram</span> أو <span style="direction:ltr;unicode-bidi:embed">TikTok</span>. الحقل الفارغ .. يحذف الرابط.</div>' +
          '<label class="lb" for="mlk-in">الرابط</label>' +
          '<input id="mlk-in" class="in" type="text" maxlength="255" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="الصق الرابط هنا..." enterkeyhint="done">' +
          '<div class="er"></div>' +
          '<div class="ft">' +
            '<button type="button" class="bt sv">حفظ</button>' +
            '<button type="button" class="bt dl">حذف رابط الوسائط</button>' +
            '<button type="button" class="bt cn">إلغاء</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(box);

    inp = box.querySelector(".in");
    err = box.querySelector(".er");

    // الإغلاق: زر X / إلغاء / الضغط على الخلفية / زر Esc
    box.querySelector(".x").onclick = closeMediaLink;
    box.querySelector(".cn").onclick = closeMediaLink;
    box.addEventListener("mousedown", function (e) { if (e.target === box) closeMediaLink(); });
    box.querySelector(".sv").onclick = save;
    box.querySelector(".dl").onclick = function () { inp.value = ""; save(); };
    inp.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); save(); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && box.classList.contains("on")) closeMediaLink();
    });
  }

  // فحص بسيط للرابط: لازم يبدأ بـ http/https ويكون فيه دومين
  function validUrl(v) {
    return /^https?:\/\/[^\s\/$.?#][^\s]*\.[^\s]{2,}$/i.test(v);
  }

  function save() {
    var v = (inp.value || "").replace(/[<>"']/g, "").trim();
    if (v && !/^https?:\/\//i.test(v)) v = "https://" + v;
    if (v && !validUrl(v)) {
      err.textContent = "الرابط غير صحيح، تأكد منه وحاول تاني";
      inp.focus();
      return;
    }
    // نكتب في الحقل المخفي ونحفظ البروفايل زي زر "حفظ التغيرات"
    $(".urluto").val(v);
    refreshMediaBtn();
    closeMediaLink();
    if (typeof setprofile === "function") setprofile();
  }

  function openMediaLink() {
    build();
    err.textContent = "";
    inp.value = ($(".urluto").val() || "").trim();
    box.classList.add("on");
    setTimeout(function () { inp.focus(); }, 60);
  }

  function closeMediaLink() {
    if (box) box.classList.remove("on");
  }

  // تحديث شكل زر الإعدادات (فيه رابط ولا لأ)
  function refreshMediaBtn() {
    var has = ($(".urluto").val() || "").trim().length > 0;
    $(".mlk-open .mlk-t").text(has ? "تعديل الرابط" : "اضافة رابط");
    $(".mlk-open").toggleClass("has", has);
  }

  window.openMediaLink = openMediaLink;
  window.closeMediaLink = closeMediaLink;
  window.refreshMediaBtn = refreshMediaBtn;

  $(function () { refreshMediaBtn(); });
})();
