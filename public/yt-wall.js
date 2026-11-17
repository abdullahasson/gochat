/* ==========================================================
   بحث يوتيوب في الحائط — واجهة خفيفة (6 نتائج + زر إرسال للحائط)
   يعتمد على: SEND_EVENT_EMIT  +  حدث السيرفر "youtube_results"
   ========================================================== */
(function () {
  "use strict";

  var CSS = [
    ".ytw{position:relative;float:right;width:100%;z-index:30;direction:rtl}",
    ".ytw *{box-sizing:border-box;font-size:13px!important;line-height:1.35!important;font-weight:600!important;text-shadow:none!important}",
    ".ytw-bar{display:flex;align-items:center;gap:6px;padding:6px 8px;background:#fff;border-bottom:1px solid #e3e6ee}",
    ".ytw-ic{color:#f00;font-size:24px!important;line-height:1!important}",
    ".ytw .ytw-in{flex:1;min-width:0;height:34px;padding:0 12px;border:1px solid #d9dce6;border-radius:17px;background:#f4f5f9;color:#222;outline:0;text-align:right;box-shadow:none}",
    ".ytw .ytw-in:focus{border-color:var(--yt,#4caf50);background:#fff}",
    ".ytw .ytw-go{flex:0 0 34px;width:34px;height:34px;border:0;border-radius:50%;background:var(--yt,#4caf50);color:#fff;cursor:pointer;padding:0;font-size:14px!important}",
    ".ytw .ytw-go:active{opacity:.8}",
    ".ytw-pn{position:absolute;top:100%;right:0;left:0;max-height:62vh;overflow-y:auto;overscroll-behavior:contain;background:#fff;border-bottom:3px solid var(--yt,#4caf50);box-shadow:0 10px 24px rgba(0,0,0,.22)}",
    ".ytw-hd{display:flex;align-items:center;justify-content:space-between;padding:6px 10px;background:#f4f5f9;color:#666;position:sticky;top:0;z-index:1}",
    ".ytw .ytw-cl{border:0;background:none;color:#666;cursor:pointer;font-size:18px!important;padding:0 4px;line-height:1!important}",
    ".ytw-r{display:flex;align-items:center;gap:8px;padding:7px 10px;border-bottom:1px solid #f0f1f6}",
    ".ytw-r:last-child{border-bottom:0}",
    ".ytw-th{position:relative;flex:0 0 108px;width:108px;height:61px;border-radius:7px;overflow:hidden;background:#222 center/cover no-repeat}",
    ".ytw-th img{display:block;width:100%;height:100%;object-fit:cover}",
    ".ytw-tm{position:absolute;left:3px;bottom:3px;padding:0 5px;border-radius:4px;background:rgba(0,0,0,.8);color:#fff;font-size:11px!important}",
    ".ytw-tx{flex:1;min-width:0}",
    ".ytw-tt{color:#1b1f2a;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word}",
    ".ytw-mt{margin-top:2px;color:#8a90a5;font-size:11px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".ytw .ytw-sd{flex:0 0 auto;display:flex;align-items:center;gap:5px;height:32px;padding:0 11px;border:0;border-radius:16px;background:var(--yt,#4caf50);color:#fff;cursor:pointer}",
    ".ytw .ytw-sd:active{opacity:.8}",
    ".ytw .ytw-sd[disabled]{background:#9aa0b3;cursor:default}",
    ".ytw-sk .ytw-th,.ytw-sk .ytw-l1,.ytw-sk .ytw-l2{background:linear-gradient(90deg,#eceef4 25%,#f7f8fb 50%,#eceef4 75%);background-size:200% 100%;animation:ytws 1.1s linear infinite}",
    ".ytw-sk .ytw-l1{height:12px;border-radius:6px;width:90%;margin-bottom:7px}",
    ".ytw-sk .ytw-l2{height:10px;border-radius:5px;width:55%}",
    "@keyframes ytws{to{background-position:-200% 0}}",
    ".ytw-ms{padding:20px 12px;text-align:center;color:#8a90a5}",

    /* البحث بقى نافذة مستقلة بتتفتح من أيقونة يوتيوب جنب الإيموشن */
    "#wall .ytw{display:none!important}",
    "#ytw-bd{position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483000;display:none;align-items:center;justify-content:center;padding:12px;background:rgba(0,0,0,.45)}",
    "#ytw-bd.on{display:flex}",
    "#ytw-bd .ytw-win{position:relative;float:none;width:100%;max-width:430px;max-height:82vh;display:flex;flex-direction:column;margin:0;z-index:auto;",
    "background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 10px 36px rgba(0,0,0,.4);direction:rtl}",
    "#ytw-bd .ytw-top{display:flex;align-items:center;gap:8px;padding:10px 14px;background:#fff;border-bottom:1px solid #e3e6ee;color:#222}",
    "#ytw-bd .ytw-top b{flex:1;font-size:16px!important}",
    "#ytw-bd .ytw-x{flex:0 0 32px;width:32px;height:32px;border:0;border-radius:50%;background:#f1f2f6;color:#444;font-size:22px!important;line-height:1!important;cursor:pointer;padding:0}",
    "#ytw-bd .ytw-bar{border-bottom:1px solid #e3e6ee}",
    "#ytw-bd .ytw-pn{position:static;display:none;flex:1 1 auto;min-height:0;max-height:none;overflow-y:auto;border:0;box-shadow:none;border-radius:0}",
    "#ytw-bd .ytw-hint{padding:26px 14px;text-align:center;color:#8a90a5}",
    "#wall .tablebox .ytw-open{flex:0 0 auto;width:34px;height:34px;margin:2px 1px 0;padding:0;border:0!important;background:none!important;box-shadow:none!important;",
    "color:#f00!important;font-size:27px!important;line-height:34px!important;cursor:pointer;outline:0}"
  ].join("\n");

  var busy = false, timer = null, styled = false;

  function css() {
    if (styled) return;
    styled = true;
    var s = document.createElement("style");
    s.textContent = CSS;
    document.head.appendChild(s);
  }
  function box() { return document.querySelector("#ytw-bd .ytw-win"); }
  function srcBox() { return document.querySelector("#wall .ytw"); } /* المربع الأصلي: بيفضل مخفي ومتحكم فيه x2.js بإعداد showyot */
  function pn() { var b = box(); return b && b.querySelector(".ytw-pn"); }
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  function open(nodes) {
    var p = pn();
    if (!p) return;
    p.textContent = "";
    nodes.forEach(function (n) { p.appendChild(n); });
    p.style.display = "block";
    p.scrollTop = 0;
    var h = p.parentNode.querySelector(".ytw-hint");
    if (h) h.style.display = "none";
  }

  function header(title) {
    var h = el("div", "ytw-hd");
    h.appendChild(el("span", "", title));
    var c = el("button", "ytw-cl", "×");
    c.type = "button";
    c.setAttribute("aria-label", "إغلاق");
    c.onclick = ytwClose;
    h.appendChild(c);
    return h;
  }

  function message(txt) {
    var m = el("div", "ytw-ms", txt);
    open([header("يوتيوب"), m]);
  }

  function skeleton() {
    var nodes = [header("جاري البحث...")];
    for (var i = 0; i < 3; i++) {
      var r = el("div", "ytw-r ytw-sk");
      r.appendChild(el("div", "ytw-th"));
      var t = el("div", "ytw-tx");
      t.appendChild(el("div", "ytw-l1"));
      t.appendChild(el("div", "ytw-l2"));
      r.appendChild(t);
      nodes.push(r);
    }
    open(nodes);
  }

  function sendLink(link, btn) {
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = "✓ تم";
    try {
      SEND_EVENT_EMIT("SEND_EVENT_EMIT_BC", { msg: link, link: "" });
      try { onlines(); clearTimeout(isbust); puys(); } catch (e) {}
    } catch (e) {}
    setTimeout(function () { window.ytwHide(); }, 600);
  }

  function row(v) {
    var r = el("div", "ytw-r");
    var th = el("div", "ytw-th");
    var im = document.createElement("img");
    im.loading = "lazy";
    im.decoding = "async";
    im.alt = "";
    im.src = v.thumbnail;
    im.onerror = function () { im.style.display = "none"; };
    th.appendChild(im);
    if (v.time) th.appendChild(el("span", "ytw-tm", v.time));
    r.appendChild(th);

    var tx = el("div", "ytw-tx");
    tx.appendChild(el("div", "ytw-tt", v.title));
    var meta = [v.channel, v.views].filter(Boolean).join(" • ");
    if (meta) tx.appendChild(el("div", "ytw-mt", meta));
    r.appendChild(tx);

    var sd = el("button", "ytw-sd fa fa-send", " إرسال");
    sd.type = "button";
    sd.onclick = function () { sendLink(v.link, sd); };
    r.appendChild(sd);
    return r;
  }

  window.ytwClose = function () {
    var p = pn();
    if (p) {
      p.style.display = "none"; p.textContent = "";
      var h = p.parentNode.querySelector(".ytw-hint");
      if (h) h.style.display = "";
    }
    busy = false;
    clearTimeout(timer);
  };

  var bd = null, openBtn = null;

  window.ytwHide = function () {
    if (bd) bd.classList.remove("on");
    window.ytwClose();
  };

  window.ytwToggle = function () {
    css();
    hook();
    if (!bd && !build()) return;
    if (bd.classList.contains("on")) return window.ytwHide();
    bd.classList.add("on");
    var inp = bd.querySelector(".ytw-in");
    if (inp) setTimeout(function () { inp.focus(); }, 80);
  };

  // بيبني النافذة المستقلة (عنوان + بحث + نتائج) على مستوى الصفحة كلها
  function build() {
    if (bd) return true;
    bd = document.createElement("div");
    bd.id = "ytw-bd";
    bd.innerHTML =
      '<div class="ytw ytw-win">' +
        '<div class="ytw-top"><i class="fa fa-youtube-play ytw-ic"></i><b>بحث يوتيوب</b>' +
          '<button type="button" class="ytw-x" aria-label="إغلاق">&times;</button></div>' +
        '<div class="ytw-bar">' +
          '<input type="text" class="ytw-in" maxlength="100" autocomplete="off" placeholder="ابحث في يوتيوب..." enterkeyhint="search">' +
          '<button type="button" class="ytw-go fa fa-search" aria-label="بحث"></button>' +
        '</div>' +
        '<div class="ytw-pn"></div>' +
        '<div class="ytw-hint">اكتب اسم الفيديو ثم اضغط بحث</div>' +
      '</div>';
    document.body.appendChild(bd);
    var win = bd.querySelector(".ytw-win");
    var src = srcBox();
    var col = src && src.style.getPropertyValue("--yt");
    if (col) win.style.setProperty("--yt", col);
    bd.querySelector(".ytw-x").onclick = function () { window.ytwHide(); };
    bd.querySelector(".ytw-go").onclick = function () { window.ytwSearch(); };
    bd.addEventListener("click", function (e) { if (e.target === bd) window.ytwHide(); });
    return true;
  }

  // بيركّب أيقونة يوتيوب بجانب أيقونة الإيموشن في مربع كتابة الحائط
  function setup() {
    var src = srcBox();
    var tb = document.querySelector("#wall .tablebox");
    if (!src || !tb) return false;
    openBtn = tb.querySelector(".ytw-open");
    if (!openBtn) {
      openBtn = el("button", "ytw-open fa fa-youtube-play");
      openBtn.type = "button";
      openBtn.title = "بحث يوتيوب";
      openBtn.onclick = function (e) { e.stopPropagation(); window.ytwToggle(); };
      var emo = tb.querySelector(".emobc");
      if (emo && emo.parentNode) emo.parentNode.insertBefore(openBtn, emo.nextSibling);
      else tb.insertBefore(openBtn, tb.firstChild);
    }
    // لو الإعدادات قافلة بحث يوتيوب (x2.js بيعمل hide للمربع الأصلي) نخفي الأيقونة كمان
    var sync = function () { openBtn.style.display = src.style.display === "none" ? "none" : ""; };
    sync();
    if (window.MutationObserver && !src.__ytwObs) {
      src.__ytwObs = new MutationObserver(sync);
      src.__ytwObs.observe(src, { attributes: true, attributeFilter: ["style"] });
    }
    return true;
  }
  function trySetup() {
    var n = 0;
    (function again() {
      if (setup() || ++n > 40) return;
      setTimeout(again, 250);
    })();
  }

  /* استقبال الرد مباشرة من السوكت (مستقل عن x2.js وكاش المتصفح) */
  var hooked = false;
  function hook() {
    if (hooked || typeof socket === "undefined" || !socket || !socket.on) return;
    hooked = true;
    socket.on("SEND_EVENT_EMIT_SERVER", function (e) {
      if (e && e.cmd === "youtube_results") window.ytwResults(e.data);
    });
  }

  window.ytwSearch = function () {
    css();
    hook();
    var b = box();
    if (!b || busy) return;
    var inp = b.querySelector(".ytw-in");
    var q = (inp.value || "").trim();
    if (!q) { inp.focus(); return; }
    busy = true;
    skeleton();
    try { SEND_EVENT_EMIT("SEND_EVENT_EMIT_YOUTUBE", { search: q }); }
    catch (e) { busy = false; return message("تعذّر الاتصال بالسيرفر"); }
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (busy) { busy = false; message("انتهت المهلة، حاول مرة أخرى"); }
    }, 12000);
  };

  window.ytwResults = function (d) {
    css();
    clearTimeout(timer);
    busy = false;
    if (!d) return message("لا توجد نتائج");
    if (d.err === "wait") return message("انتظر ثانية ثم أعد البحث");
    if (d.err) return message("تعذّر جلب النتائج الآن، حاول لاحقاً");
    if (!d.list || !d.list.length) return message("لا توجد نتائج لـ \"" + d.q + "\"");
    var nodes = [header("نتائج: " + d.q)];
    for (var i = 0; i < d.list.length && i < 6; i++) nodes.push(row(d.list[i]));
    open(nodes);
    var inp = box() && box().querySelector(".ytw-in");
    if (inp) inp.blur();
  };

  document.addEventListener("keydown", function (e) {
    var t = e.target;
    if (t && t.classList && t.classList.contains("ytw-in") && e.key === "Enter") {
      e.preventDefault();
      window.ytwSearch();
    } else if (e.key === "Escape") {
      if (bd && bd.classList.contains("on")) window.ytwHide();
    }
  });

  if (document.readyState !== "loading") { css(); trySetup(); }
  else document.addEventListener("DOMContentLoaded", function () { css(); trySetup(); });
})();
