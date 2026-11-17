/* ==========================================================
   [ADDED] نقل الاستوريهات من قايمة المتصلين إلى الحائط (فوق تابات المنشورات / الدردشة السريعة)
   - بننقل نفس عنصر .itemstory (مش نسخة) فكل كود الاستوري الأصلي (x2.js / users-style.js) بيفضل شغال
     لأنه بيدوّر عليه بـ $(".itemstory") من أي مكان.
   - بنستنى لحد ما feather.js يبني التابات (.fth-tabs) وبعدين نحط الشريط فوقها.
   - الستايل بيدعم الشكل الأصلي (.str > img) والشكل المزخرف بتاع users-style (.ul-ring ...).
   ملف إضافة مستقل: لو اتشال السطر من index.ejs الاستوريهات ترجع مكانها القديم بعد ريفريش.
   ========================================================== */
(function () {
  "use strict";
  if (window.__wallStoriesLoaded) return;
  window.__wallStoriesLoaded = true;
  /* [FIX-NOPTA] في تصميم Nopta شريط الاستوري مكانه قايمة المتواجدين (users-style.js بيظبطه تحت البحث) — ما ننقلوش للحائط */
  if (window.__usersStyleLoaded) return;

  var S = "#wall>.itemstory";

  var css = [
    /* عمود: الاستوريهات / التابات / المحتوى — عشان إضافة الشريط ما تزودش ارتفاع الحائط */
    "#wall.active{display:flex!important;flex-direction:column;overflow:hidden}",
    "#wall>.fth-tabs{flex:0 0 auto}",
    "#wall>#wall-main,#wall>#d2feather{flex:1 1 0;min-height:0;height:auto}",

    /* الشريط نفسه (لو الأدمن قفل الاستوري x2.js بيعمله display:none inline وده بيغلب) */
    S + "{display:flex;align-items:center;direction:ltr;gap:8px;flex:0 0 auto;box-sizing:border-box;margin:0;padding:8px 8px;border:0;border-bottom:2px solid var(--ws-b,#4f6592);background:#f7f9fa;overflow-x:auto;overflow-y:hidden;white-space:nowrap}",
    S + "::-webkit-scrollbar{height:3px}",
    S + "::-webkit-scrollbar-thumb{background:#b9c2c8;border-radius:2px;box-shadow:none}",
    S + "::-webkit-scrollbar-track{background:transparent;box-shadow:none}",
    "#wall>.progressstory{flex:0 0 auto}",

    /* زر إضافة استوري (صورتي + علامة + حمرا) */
    S + ">.addstory{position:relative;flex:0 0 auto;display:block;width:68px!important;height:68px;margin:0!important;text-align:center}",
    S + ">.addstory .img_str{display:block;box-sizing:border-box;width:68px!important;height:68px!important;padding:2px!important;border:2px solid #d5dbe0!important;border-radius:50%!important;background:#fff;object-fit:cover}",
    S + ">.addstory>a{position:absolute!important;left:auto!important;right:-2px;top:auto!important;bottom:-2px;width:24px!important;height:24px!important;margin:0!important;border:2px solid #fff;border-radius:50%!important;background:#e53935!important;display:flex;align-items:center;justify-content:center}",
    S + ">.addstory>a>i{display:block;width:20px;height:20px;color:#fff!important;font-size:0!important;line-height:20px!important;text-align:center}",
    S + ">.addstory>a>i::before{content:\"+\";font-family:Arial,sans-serif;font-size:18px;font-weight:700;line-height:20px}",

    /* كل استوري: دايرة بحلقة متدرجة والاسم جوّاها */
    S + ">.str{position:relative;flex:0 0 auto;width:68px!important;height:68px;margin:0!important;cursor:pointer;text-align:center}",
    /* الشكل الأصلي */
    S + ">.str>img{display:block;box-sizing:border-box;width:68px!important;min-width:68px!important;height:68px!important;padding:3px!important;border:3px solid transparent!important;border-radius:50%!important;object-fit:cover;background-image:linear-gradient(#fff,#fff),linear-gradient(45deg,#f9a825 0%,#e1306c 55%,#833ab4 100%)!important;background-origin:border-box;background-clip:padding-box,border-box}",
    S + ">.str>img[style*=\"gray\"]{background-image:linear-gradient(#fff,#fff),linear-gradient(#bdbdbd,#bdbdbd)!important}",
    S + ">.str>div{position:absolute;left:4px;right:4px;bottom:10px;width:auto!important;margin:0;text-align:center;color:#fff!important;font-weight:700;line-height:1.1;text-shadow:0 1px 3px rgba(0,0,0,.95);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none}",
    /* الشكل المزخرف (users-style.js) */
    S + ">.str:has(.ul-ring)>img{display:none!important}",
    S + ">.str .ul-ring{box-sizing:border-box;width:68px;height:68px;padding:3px;border-radius:50%;background:linear-gradient(45deg,#f9a825 0%,#e1306c 55%,#833ab4 100%)}",
    S + ">.str:has(>img[style*=\"gray\"]) .ul-ring{background:#bdbdbd}",
    S + ">.str .ul-ring>.ul-img{box-sizing:border-box;width:100%;height:100%;border:2px solid #fff;border-radius:50%;background:#ddd center/cover no-repeat}",
    S + ">.str .ul-badge{display:none}",
    S + ">.str .ul-name{position:absolute;left:4px;right:4px;bottom:10px;display:block;width:auto!important;margin:0;text-align:center;color:#fff!important;font:700 10px/1.1 sans-serif!important;text-shadow:0 1px 3px rgba(0,0,0,.95);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none}",
    S + ">.str .ul-name *{font-size:10px!important;color:#fff!important}",

    /* زر أرشيفي (لو users-style مفعّل): في آخر الشريط */
    S + ">.ul-arch{order:99;flex:0 0 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;box-sizing:border-box;width:44px;height:44px;border:1px solid #cfd8dc;border-radius:50%;background:#fff;cursor:pointer}",
    S + ">.ul-arch .fa{font-size:15px;color:var(--ws-b,#4f6592)}",
    S + ">.ul-arch b{font-size:8px;font-weight:700;color:var(--ws-b,#4f6592)}"
  ].join("\n");

  function brand() {
    var c = "";
    try {
      var el = document.querySelector("#wall .ytw") || document.getElementById("wall");
      c = (getComputedStyle(el).getPropertyValue("--yt") || "").trim();
    } catch (e) {}
    return c || "#4f6592";
  }

  function addCss() {
    if (document.getElementById("wallStoriesCss")) return;
    var st = document.createElement("style");
    st.id = "wallStoriesCss";
    st.textContent = css;
    document.head.appendChild(st);
  }

  function place() {
    var wall = document.getElementById("wall");
    if (!wall) return false;
    var tabs = null, kids = wall.children, i;
    for (i = 0; i < kids.length; i++) {
      if (kids[i].classList && kids[i].classList.contains("fth-tabs")) { tabs = kids[i]; break; }
    }
    var story = document.querySelector(".itemstory");
    if (!tabs || !story) return false;
    addCss();
    if (story.parentNode !== wall) wall.insertBefore(story, tabs);
    var prog = document.querySelector(".progressstory");
    if (prog && prog.parentNode !== wall) wall.insertBefore(prog, tabs);
    wall.style.setProperty("--ws-b", brand());
    return true;
  }

  var tries = 0;
  function start() {
    if (place()) return;
    if (++tries < 200) setTimeout(start, 300);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
