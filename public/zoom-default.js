/* حجم الخطوط الافتراضي 95% (زر الخطوط في إعدادات المستخدم).
   - لو العضو اختار قيمة قبل كده بتتطبق هي، وإلا الافتراضي 0.95. */
(function () {
  "use strict";
  var OK = { "1": 1, "1.20": 1, "1.2": 1, "1.10": 1, "1.1": 1, "1.05": 1, "0.95": 1, "0.9": 1 };
  function run() {
    var z = "";
    try { z = localStorage.getItem("zoom") || ""; } catch (e) {}
    if (!OK[z]) z = "0.95";
    document.body.style.zoom = z;
    var sel = document.getElementById("zoom");
    if (sel) {
      for (var i = 0; i < sel.options.length; i++) {
        if (parseFloat(sel.options[i].value) === parseFloat(z)) { sel.selectedIndex = i; break; }
      }
    }
    try { if (typeof window.fixSize === "function") window.fixSize(); } catch (e) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
