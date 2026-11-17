/* ==========================================================
   [ADDED] أيقونة الرسالة بدل السهم في أزرار منشورات الحائط
   - بتغيّر أيقونة زر .breply (الموجود جنب الإعجاب) جوه #d2bc بس (منشورات الحائط).
   - رسائل الغرفة (#d2) والخاص (#d2<id>) وأي مكان تاني ما بيتأثروش: زر الرد/التوجيه فيهم بيفضل سهم زي ما هو.
   - CSS فقط: مفيش أي تغيير في الأزرار نفسها أو الدوال (cooments / replaymsg) أو العدّاد.
   لو الملف ده مش بيتحمّل، السهم يرجع زي ما كان.
   ========================================================== */
(function () {
  "use strict";
  if (document.getElementById("wallMsgIconCss")) return;
  var st = document.createElement("style");
  st.id = "wallMsgIconCss";
  /* f075 = أيقونة رسالة (fa-comment) — !important عشان تغلب أيقونة السهم الأصلية وأي ستايل حائط تاني */
  st.textContent = "#d2bc .breply::before{content:'\\f075'!important}";
  document.head.appendChild(st);
})();
