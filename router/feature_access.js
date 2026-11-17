/* [ADDED - FEATURE ACCESS] تبويب "المميزات" في لوحة التحكم: لكل ميزة من مزايا استوديو تصميم العضوية (إعدادات > المميزات)
   جدول بالصلاحيات (الرتب) المنشأة، والأدمن بيحدد أنهي رتب تظهر لها الميزة.
   - التخزين: جدول feature_access (feat / powers = JSON array بأسماء الرتب) فيفضل بعد إعادة التشغيل.
   - ميزة مالهاش صف = "افتراضي" = نفس السلوك القديم بالظبط (صلاحية memberdesign أو owner). مفيش أي تغيير لحد ما الأدمن يخصّص ميزة.
   - ميزة مخصّصة = بتظهر فقط للرتب المختارة (+ أي رتبة owner دايمًا).
   - الأدمن: حدث SHWO_PANEL_ADMIN بـ cmd = SEND_ADMIN_FEATURES و op = get | set (الصلاحية: setpower أو owner، بيتحقق منها server.js).
   - الأعضاء: GET /feature-access (JSON: feats = { <مفتاح>: [أسماء الرتب] } للميزات المخصّصة بس) — بيقراه public/feature-access/feature-access.js.
   - السيرفر بيطبّق نفس القاعدة: رفع الملفات / حفظ البروفايل / تغيير الإطار والكارت واللمعة (guardProfile / denied).
   - [ADDED - FEATURE STORE] pw.bought = { feat: expires } (بيحطها FeatureStore.pw) = ميزة مشتراة بالنقاط: allowed بترجّع true طول ما الاشتراك شغال. */
"use strict";

var FEATS = [
  { k: "pbg", t: "خلفية البروفايل" },
  { k: "welcome", t: "شعار الترحيب" },
  { k: "music", t: "أغنية البروفايل" },
  { k: "visit", t: "من زار بروفايلك" },
  { k: "yt", t: "رابط اليوتيوب" },
  { k: "social", t: "حسابات التواصل" },
  { k: "frames", t: "الإطارات" },
  { k: "cards", t: "كارت العضو" },
  { k: "namebg", t: "خلفية الاسم" },
  { k: "nameshine", t: "اسم لامع" },
  { k: "glitter", t: "اللمعات" },
];
var KEYS = FEATS.map(function (f) { return f.k; });

/* الحقول اللي بتتبعت في SEND_EVENT_EMIT_PROFILE لكل ميزة (namebg / nameshine ليهم معاملة خاصة تحت لأن bg و ucol بيستخدمهم الحساب العادي كمان) */
var FIELDS = {
  pbg: ["cover", "cover_full", "profile_bg"],
  welcome: ["welcome_msg"],
  music: ["profile_music", "profile_music_name"],
  visit: ["visitor_notify_on"],
  yt: ["youtube", "youtube_on"],
  social: ["social_telegram", "social_facebook", "social_whatsapp"],
  cards: ["member_card_color"],
};
var FLAG_DEFAULT = { cover_full: 0, youtube_on: 1, visitor_notify_on: 1 };
var BACK_NUM = { 1: "cards", 2: "frames", 3: "glitter" }; /* cheangback: 1 = خلفية الكارت / 2 = إطار / 3 = لمعة */
var UPLOAD_KIND = { cover: "pbg", music: "music" };
var GRAD = /^[hvm](:#[0-9a-fA-F]{6}){3}$|^[hvm](:#[0-9a-fA-F]{6}){5}$/; /* [CHANGED - 5 COLORS] */

var dao = null;
var state = {}; /* { feat: [powerName, ...] } للميزات المخصّصة بس */
var version = 1;

function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
function isFeat(k) { return typeof k === "string" && KEYS.indexOf(k) !== -1; }
function pname(pw) { return pw && typeof pw.name === "string" ? pw.name : ""; }

function configured(k) { return has(state, k); }

/* هل رتبة العضو (pw = كائن الرتبة من GetPower) تشوف الميزة؟ */
function allowed(pw, k) {
  pw = pw || {};
  if (pw.owner) return true;
  if (pw.mdgrant) return true; /* [ADDED - MD GRANT] عضو مفعّل له التصميم من أدوات الإدارة: كل الميزات */
  if (pw.bought && pw.bought[k] > Date.now()) return true; /* [ADDED - FEATURE STORE] ميزة مشتراة من المتجر واشتراكها لسه شغال */
  if (configured(k)) return state[k].indexOf(pname(pw)) !== -1;
  return !!pw.memberdesign; /* افتراضي = السلوك القديم */
}
/* ممنوعة صراحةً: ميزة مخصّصة والرتبة مش فيها (الميزات الافتراضية بتفضل زي ما هي) */
function denied(pw, k) { return configured(k) && !allowed(pw, k); }
function any(pw) {
  for (var i = 0; i < KEYS.length; i++) if (allowed(pw, KEYS[i])) return true;
  return false;
}
function backFeat(num) { return has(BACK_NUM, num) ? BACK_NUM[num] : null; }
function kindFeat(kind) { return has(UPLOAD_KIND, kind) ? UPLOAD_KIND[kind] : null; }

/* بيرجّع قيم الميزات الممنوعة لقيمتها المخزّنة (من غير ما يرفض الحفظ كله — نفس أسلوب باقي التحقق في الحفظ). بيرجع مصفوفة بمفاتيح اللي اتصلّحت */
function guardProfile(pw, d, st, strict) {
  var hit = [];
  if (!d || typeof d !== "object") return hit;
  st = st || {};
  function mark(k) { if (hit.indexOf(k) === -1) hit.push(k); }
  KEYS.forEach(function (k) {
    /* [ADDED - FEATURE STORE] strict = عضو مالوش صلاحية الاستوديو برتبته وبيستخدم بس اللي اشتراه: أي ميزة مش معاه بتتردّ لقيمتها (حتى الافتراضية) */
    if (strict ? allowed(pw, k) : !denied(pw, k)) return;
    if (k === "namebg") {
      /* bg العادي (لون بسيط) بيفضل متاح من الحساب؛ بنمنع بس التدرج */
      if (GRAD.test(String(d.bg || "")) && d.bg !== st.bg) { d.bg = typeof st.bg === "string" ? st.bg : "#ffffff"; mark(k); }
      return;
    }
    if (k === "nameshine") {
      if (String(d.ucol || "").slice(0, 2) === "n:" && d.ucol !== st.ucol) { d.ucol = typeof st.ucol === "string" ? st.ucol : "#000000"; mark(k); }
      return;
    }
    (FIELDS[k] || []).forEach(function (f) {
      if (d[f] == null) return;
      if (f === "youtube") {
        if (typeof st.youtube !== "string") return; /* مش عارفين القيمة القديمة: منلمسش */
        if (d.youtube !== st.youtube) { d.youtube = st.youtube; mark(k); }
        return;
      }
      var old = st[f];
      if (old == null) old = has(FLAG_DEFAULT, f) ? FLAG_DEFAULT[f] : "";
      if (String(d[f]) !== String(old)) { d[f] = old; mark(k); }
    });
  });
  return hit;
}

function pub() {
  var feats = {};
  KEYS.forEach(function (k) { if (configured(k)) feats[k] = state[k].slice(); });
  return { v: version, feats: feats };
}

function init(d) {
  dao = d;
  return d.run("CREATE TABLE IF NOT EXISTS feature_access (feat VARCHAR(32) PRIMARY KEY, powers TEXT NOT NULL) DEFAULT CHARSET=utf8mb4")
    .then(function () { return d.all("SELECT feat, powers FROM feature_access"); })
    .then(function (rows) {
      state = {};
      (rows || []).forEach(function (r) {
        if (!r || !isFeat(r.feat)) return;
        try {
          var arr = JSON.parse(r.powers);
          if (Array.isArray(arr)) state[r.feat] = arr.filter(function (x) { return typeof x === "string"; });
        } catch (e) { /* صف بايظ = يتعامل كأنه افتراضي */ }
      });
    })
    .catch(function (err) {
      console.error("feature_access init failed:", err && err.message ? err.message : err);
    });
}

function ownerPower(p) { return !!(p && p.owner); }

function status(socket, powers) {
  var list = [];
  (powers || []).forEach(function (p) {
    if (p && typeof p.name === "string" && p.name !== "") list.push({ name: p.name, rank: Number(p.rank) || 0, owner: ownerPower(p) ? 1 : 0, md: p.memberdesign ? 1 : 0 });
  });
  list.sort(function (a, b) { return b.rank - a.rank; });
  socket.emit("SHWO_PANEL_ADMIN", {
    cmd: "SEND_ADMIN_FEATURES",
    data: { feats: FEATS, powers: list, access: pub().feats },
  });
}

/* [بيتنادى من فرع SEND_ADMIN_FEATURES في server.js] allowed = setpower أو owner، powers = ShowPowers */
function handleAdmin(socket, data, isAllowed, powers) {
  if (!isAllowed || !dao || !data || typeof data !== "object") return Promise.resolve();
  if (data.op !== "set") { status(socket, powers); return Promise.resolve(); }

  var items = data.items;
  if (!items || typeof items !== "object") { status(socket, powers); return Promise.resolve(); }
  var valid = {};
  (powers || []).forEach(function (p) { if (p && typeof p.name === "string") valid[p.name] = 1; });

  var jobs = [];
  KEYS.forEach(function (k) {
    if (!has(items, k)) return;
    var it = items[k];
    if (!it || typeof it !== "object") return;
    if (it.custom) {
      var list = [];
      (Array.isArray(it.powers) ? it.powers : []).forEach(function (n) {
        if (typeof n === "string" && n.length <= 100 && valid[n] && list.indexOf(n) === -1) list.push(n);
      });
      state[k] = list;
      jobs.push(dao.run("INSERT INTO feature_access (feat, powers) VALUES (?, ?) ON DUPLICATE KEY UPDATE powers = VALUES(powers)", [k, JSON.stringify(list)]));
    } else {
      delete state[k];
      jobs.push(dao.run("DELETE FROM feature_access WHERE feat = ?", [k]));
    }
  });
  version++;
  return Promise.all(jobs)
    .then(function () { status(socket, powers); })
    .catch(function (err) {
      console.error("feature_access set failed:", err && err.message ? err.message : err);
      status(socket, powers);
    });
}

function routes(app) {
  app.get("/feature-access", function (req, res) {
    res.set("Cache-Control", "no-store");
    res.json(pub());
  });
}

module.exports = {
  FEATS: FEATS,
  init: init,
  handleAdmin: handleAdmin,
  routes: routes,
  configured: configured,
  allowed: allowed,
  denied: denied,
  any: any,
  backFeat: backFeat,
  kindFeat: kindFeat,
  guardProfile: guardProfile,
};
