/*
 * حماية الموقع (بتتحمّل بس لو زر الحماية مفعّل من لوحة التحكم > الإضافات)
 *   window.__PROTECT = { copy: true/false, dev: true/false }  (بتتحط من index.ejs)
 *
 * copy : منع نسخ الكلام / القص / السحب / كليك يمين / تحميل الصور / الطباعة / حفظ الصفحة
 * dev  : منع فتح الكونسول (F12 وكل اختصاراتها) + كشف فتحها وقفل الصفحة
 *
 * ملاحظة: أي حماية من ناحية المتصفح بتمنع الاستخدام العادي بس، مش حماية مطلقة.
 */
(function () {
  var P = window.__PROTECT || {};

  /* هل العنصر خانة كتابة؟ (لازم الكتابة واللصق والتحديد جواها يفضلوا شغّالين) */
  function isEditable(el) {
    if (!el || !el.tagName) return false;
    var t = el.tagName.toLowerCase();
    return t === 'input' || t === 'textarea' || t === 'select' || el.isContentEditable === true;
  }

  /* ================= منع النسخ وتحميل الصور ================= */
  if (P.copy) {
    // ستايل: منع تحديد النص ومنع سحب الصور وقائمة الضغط المطوّل في الموبايل
    var st = document.createElement('style');
    st.textContent =
      'html,body,body *{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;-webkit-touch-callout:none}' +
      'input,textarea,[contenteditable="true"],[contenteditable=""]{-webkit-user-select:text!important;-moz-user-select:text!important;user-select:text!important;-webkit-touch-callout:default!important}' +
      'img,video,canvas{-webkit-user-drag:none;user-drag:none}' +
      '@media print{html,body{display:none!important}}';
    (document.head || document.documentElement).appendChild(st);

    // كليك يمين / الضغط المطوّل
    document.addEventListener('contextmenu', function (e) {
      if (isEditable(e.target)) return;
      e.preventDefault();
    }, true);

    // نسخ / قص (مسموح جوا خانات الكتابة بس)
    ['copy', 'cut'].forEach(function (ev) {
      document.addEventListener(ev, function (e) {
        if (isEditable(e.target)) return;
        e.preventDefault();
        try { e.clipboardData && e.clipboardData.setData('text/plain', ''); } catch (x) { }
      }, true);
    });

    // سحب الصور والنصوص + بداية التحديد
    ['dragstart', 'selectstart'].forEach(function (ev) {
      document.addEventListener(ev, function (e) {
        if (isEditable(e.target)) return;
        e.preventDefault();
      }, true);
    });

    // اختصارات: Ctrl+C / X / S / P / U / A (برّه خانات الكتابة)
    document.addEventListener('keydown', function (e) {
      var k = (e.key || '').toLowerCase();
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        if (k === 's' || k === 'p' || k === 'u') { e.preventDefault(); return; }
        if ((k === 'c' || k === 'x' || k === 'a') && !isEditable(e.target)) { e.preventDefault(); return; }
      }
      if (k === 'printscreen') {
        try { navigator.clipboard && navigator.clipboard.writeText(''); } catch (x) { }
      }
    }, true);

    // لو حد حدّد نص بأي طريقة نلغي التحديد فوراً (برّه خانات الكتابة)
    document.addEventListener('selectionchange', function () {
      var a = document.activeElement;
      if (isEditable(a)) return;
      var s = window.getSelection && window.getSelection();
      if (s && s.rangeCount && String(s).length) { try { s.removeAllRanges(); } catch (x) { } }
    });
  }

  /* ================= منع الكونسول F12 ================= */
  if (P.dev) {
    // اختصارات فتح أدوات المطوّر
    document.addEventListener('keydown', function (e) {
      var k = (e.key || '').toLowerCase();
      var c = e.keyCode || e.which;
      var ctrl = e.ctrlKey || e.metaKey;
      if (
        c === 123 || k === 'f12' ||                                  // F12
        (ctrl && e.shiftKey && (k === 'i' || k === 'j' || k === 'c' || k === 'k')) || // Ctrl+Shift+I/J/C/K
        (e.metaKey && e.altKey && (k === 'i' || k === 'j' || k === 'c' || k === 'u')) || // ماك: Cmd+Opt+I/J/C/U
        (ctrl && k === 'u')                                          // عرض المصدر
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);

    // كليك يمين (علشان "Inspect") — برّه خانات الكتابة
    document.addEventListener('contextmenu', function (e) {
      if (isEditable(e.target)) return;
      e.preventDefault();
    }, true);

    var locked = false;
    function lockPage() {
      if (locked) return;
      locked = true;
      try { window.stop && window.stop(); } catch (x) { }
      try { window.socket && window.socket.disconnect && window.socket.disconnect(); } catch (x) { }
      document.documentElement.innerHTML =
        '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
        '<body style="margin:0;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;font-family:sans-serif">' +
        '<div style="padding:20px"><div style="font-size:22px;font-weight:700;margin-bottom:10px">⛔ غير مسموح بفتح أدوات المطوّر</div>' +
        '<div style="font-size:15px;opacity:.8">أغلق أدوات المطوّر ثم أعد تحميل الصفحة</div></div></body>';
    }

    // كشف 1: فرق حجم النافذة (أدوات المطوّر مثبّتة جنب/تحت الصفحة) — للكمبيوتر بس
    var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    function sizeCheck() {
      if (isTouch) return false;
      var dw = window.outerWidth - window.innerWidth;
      var dh = window.outerHeight - window.innerHeight;
      return dw > 200 || dh > 260;
    }

    // كشف 2: توقيت debugger (لو الكونسول مفتوحة الـ debugger بيوقف الكود)
    function debuggerCheck() {
      var t = performance.now();
      (function () { debugger; })();
      return performance.now() - t > 120;
    }

    // كشف 3: قراءة خاصية بتتنفّذ بس لما الكونسول تتفتح
    var probe = new Image();
    var probed = false;
    Object.defineProperty(probe, 'id', { get: function () { probed = true; return ''; } });

    setInterval(function () {
      probed = false;
      try { console.log(probe); console.clear && console.clear(); } catch (x) { }
      if (probed || sizeCheck() || debuggerCheck()) lockPage();
    }, 1000);
  }
})();
