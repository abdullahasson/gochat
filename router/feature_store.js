/* [ADDED - FEATURE STORE] متجر مميزات استوديو تصميم العضوية: العضو يشتري ميزة بالنقاط لمدة ٧ / ١٥ / ٣٠ يوم ويقدر يستخدمها.
   - التخزين (بيتعملوا لوحدهم أول تشغيل):
       feature_store_prices (feat / p7 / p15 / p30)   سعر كل ميزة لكل مدة بالنقاط. صفر = المدة دي مش للبيع. ميزة كل أسعارها صفر = مش معروضة في المتجر.
       feature_store_buys   (uid / feat / expires)    اشتراك العضو في الميزة وتاريخ انتهائه (ms). شراء نفس الميزة وهي شغالة = تمديد من تاريخ الانتهاء.
   - الهوية: عمود users.uid (نفس القيمة في السوكت UserInfo[..].uid وفي صف قاعدة البيانات) — الشراء للأعضاء المسجلين فقط.
   - النقاط: الحقل POINTS_FIELD (افتراضيًا "evaluation" = عدّاد "النقاط" في البروفايل وأمر "تعديل نقاط" في الإدارة). لو عايز الخصم من الإعجابات غيّره لـ "rep".
   - الصلاحية: FeatureStore.pw(pw, uid) بيرجّع نسخة من كائن الرتبة عليها bought = { feat: expires } للاشتراكات الشغالة بس، و FeatureAccess.allowed
     بيقرأها — فنفس أماكن الفحص الموجودة (رفع الملفات / حفظ البروفايل / تغيير الإطار والكارت واللمعة) بتحترم الشراء من غير فحوصات جديدة.
   - انتهاء الاشتراك: كشّاف دوري (startSweeper) بيلاقي الاشتراكات المنتهية ويمسح تصميم الميزة من حساب العضو (متصل أو غايب) —
     نفس أعمدة users ونفس قيم الحذف اللي بيستخدمها الاستوديو و router/design_clear.js — إلا لو رتبته لسه بتفتح له الميزة. (done=1 بعد التنفيذ)
   - الأدمن: SHWO_PANEL_ADMIN بـ cmd = SEND_ADMIN_STORE و op = get | set (الصلاحية: setpower أو owner، بيتحقق منها server.js).
   - العضو: SEND_EVENT_EMIT_SERVER بـ cmd = SEND_EVENT_EMIT_STORE و data.op = get | buy، والرد بـ cmd = "store" على نفس الحدث. */
"use strict";

var FeatureAccess = require("./feature_access");

var DAYS = [7, 15, 30];
var DAY_MS = 86400000;
var POINTS_FIELD = "evaluation";
var MAX_PRICE = 1000000;
var UID_MAX = 100;
var KEEP_EXPIRED_MS = 14 * DAY_MS; /* صفوف المنتهية بتتمسح بعد ١٤ يوم من انتهائها */

var dao = null;
var prices = {}; /* { feat: [p7, p15, p30] } للميزات اللي ليها سعر واحد على الأقل */
var buys = new Map(); /* uid -> { feat: expires } */
var busy = new Set(); /* uid بتنفّذ شراء دلوقتي (قفل ضد الضغط المزدوج) */
var sweeping = false;
var sweepTimer = null;
var SWEEP_EVERY_MS = 60000;
var SWEEP_BATCH = 200;

/* ما بيتصفّر لما اشتراك ميزة ينتهي (قيم "الحذف" الافتراضية). namebg / nameshine ليهم معاملة خاصة تحت: بنمسح التدرج / اللمعة بس ونسيب اللون العادي. */
var REVOKE = {
  pbg: { cover: "", cover_full: 0, profile_bg: "" },
  welcome: { welcome_msg: "" },
  music: { profile_music: "", profile_music_name: "" },
  visit: { visitor_notify_on: 1 },
  yt: { youtube: "", youtube_on: 1 },
  social: { social_telegram: "", social_facebook: "", social_whatsapp: "" },
  cards: { member_card_color: "", back: "" },
  frames: { atar: "" },
  glitter: { lmaa: "" },
};
var GRAD_DB = "^[hvm]:#";                 /* bg بتدرج */
var SHINE_PLAIN = "#000000";              /* اللون العادي اللي بنرجع له لما اللمعة تتشال */

function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
function feats() { return FeatureAccess.FEATS; }
function isFeat(k) {
  if (typeof k !== "string") return false;
  var f = feats();
  for (var i = 0; i < f.length; i++) if (f[i].k === k) return true;
  return false;
}
function titleOf(k) {
  var f = feats();
  for (var i = 0; i < f.length; i++) if (f[i].k === k) return f[i].t;
  return k;
}
function toPrice(v) {
  v = parseInt(v, 10);
  if (!isFinite(v) || v < 0) return 0;
  return v > MAX_PRICE ? MAX_PRICE : v;
}
function pointsOf(me) { var n = parseInt(me && me[POINTS_FIELD], 10); return isFinite(n) ? n : 0; }
function priceOf(feat, days) {
  var p = has(prices, feat) ? prices[feat] : null;
  var i = DAYS.indexOf(days);
  return p && i !== -1 ? p[i] : 0;
}
function uidOf(me) {
  var u = me && me.uid ? String(me.uid) : "";
  return u && u.length <= UID_MAX ? u : "";
}

/* اشتراكات العضو الشغالة دلوقتي بس: { feat: expires } */
function mine(uid) {
  var out = {}, m = uid ? buys.get(uid) : null, now = Date.now(), any = false;
  if (!m) return out;
  Object.keys(m).forEach(function (k) {
    if (m[k] > now) { out[k] = m[k]; any = true; } else { delete m[k]; }
  });
  if (!any) buys.delete(uid);
  return out;
}

/* نسخة من كائن الرتبة عليها bought لو العضو عنده اشتراك شغال؛ وإلا نفس الكائن بالظبط (نفس أسلوب MdGrant.pw) */
function pw(power, uid) {
  var b = mine(uid && String(uid));
  var ks = Object.keys(b);
  if (!ks.length) return power;
  var o = {}, k;
  power = power || {};
  for (k in power) { if (Object.prototype.hasOwnProperty.call(power, k)) o[k] = power[k]; }
  o.bought = b;
  return o;
}
/* هل الميزة دي مشتراة وشغالة في كائن الرتبة ده؟ */
function owns(p, feat) { return !!(p && p.bought && feat && p.bought[feat] > Date.now()); }

function publicPrices() {
  var out = {};
  Object.keys(prices).forEach(function (k) { out[k] = prices[k].slice(); });
  return out;
}

function reply(socket, data) {
  try { socket.emit("SEND_EVENT_EMIT_SERVER", { cmd: "store", data: data }); } catch (e) { /* السوكت اتقفل */ }
}
function state(me) {
  var uid = uidOf(me);
  var list = [];
  var m = mine(uid);
  Object.keys(prices).forEach(function (k) { if (isFeat(k)) list.push({ k: k, t: titleOf(k) }); });
  /* اشتراك شغال لميزة الأدمن شال سعرها بعدين: يفضل ظاهر للعضو لحد ما ينتهي */
  Object.keys(m).forEach(function (k) { if (isFeat(k) && !has(prices, k)) list.push({ k: k, t: titleOf(k) }); });
  return {
    ok: 1, op: "get", reg: uid ? 1 : 0, now: Date.now(), days: DAYS,
    points: pointsOf(me), feats: list, prices: publicPrices(), mine: m,
  };
}

function loadAll() {
  return dao.all("SELECT feat, p7, p15, p30 FROM feature_store_prices")
    .then(function (rows) {
      prices = {};
      (rows || []).forEach(function (r) {
        if (!r || !isFeat(r.feat)) return;
        var a = [toPrice(r.p7), toPrice(r.p15), toPrice(r.p30)];
        if (a[0] || a[1] || a[2]) prices[r.feat] = a;
      });
      return dao.all("SELECT uid, feat, expires FROM feature_store_buys WHERE expires > ?", [Date.now()]);
    })
    .then(function (rows) {
      buys = new Map();
      (rows || []).forEach(function (r) {
        if (!r || !r.uid || !isFeat(r.feat)) return;
        var e = Number(r.expires) || 0;
        if (!e) return;
        var m = buys.get(String(r.uid));
        if (!m) { m = {}; buys.set(String(r.uid), m); }
        m[r.feat] = e;
      });
    });
}

function init(d) {
  dao = d;
  return d.run("CREATE TABLE IF NOT EXISTS feature_store_prices (feat VARCHAR(32) PRIMARY KEY, p7 INT NOT NULL DEFAULT 0, p15 INT NOT NULL DEFAULT 0, p30 INT NOT NULL DEFAULT 0) DEFAULT CHARSET=utf8mb4")
    .then(function () { return d.run("CREATE TABLE IF NOT EXISTS feature_store_buys (uid VARCHAR(" + UID_MAX + ") NOT NULL, feat VARCHAR(32) NOT NULL, expires BIGINT NOT NULL, PRIMARY KEY (uid, feat), INDEX idx_fsb_expires (expires)) DEFAULT CHARSET=utf8mb4"); })
    .then(function () { return d.run("ALTER TABLE feature_store_buys ADD COLUMN done TINYINT NOT NULL DEFAULT 0").catch(function () { /* العمود موجود من قبل */ }); })
    .then(function () { return d.run("DELETE FROM feature_store_buys WHERE expires < ? AND done = 1", [Date.now() - KEEP_EXPIRED_MS]); })
    .then(loadAll)
    .catch(function (err) {
      console.error("feature_store init failed:", err && err.message ? err.message : err);
    });
}

/* ------------------------------------------------------------------ الأدمن */
function adminStatus(socket) {
  var active = {}, now = Date.now();
  buys.forEach(function (m) {
    Object.keys(m).forEach(function (k) { if (m[k] > now) active[k] = (active[k] || 0) + 1; });
  });
  var rows = {};
  Object.keys(prices).forEach(function (k) { rows[k] = prices[k].slice(); });
  socket.emit("SHWO_PANEL_ADMIN", {
    cmd: "SEND_ADMIN_STORE",
    data: { feats: feats(), days: DAYS, prices: rows, active: active, max: MAX_PRICE, field: POINTS_FIELD },
  });
}

/* [بيتنادى من فرع SEND_ADMIN_STORE في server.js] isAllowed = setpower أو owner */
function handleAdmin(socket, data, isAllowed) {
  if (!isAllowed || !dao || !data || typeof data !== "object") return Promise.resolve();
  if (data.op !== "set") { adminStatus(socket); return Promise.resolve(); }
  var items = data.items;
  if (!items || typeof items !== "object") { adminStatus(socket); return Promise.resolve(); }

  var jobs = [];
  feats().forEach(function (f) {
    var k = f.k;
    if (!has(items, k)) return;
    var it = items[k];
    if (!it || typeof it !== "object") return;
    var a = [toPrice(it.p7), toPrice(it.p15), toPrice(it.p30)];
    if (a[0] || a[1] || a[2]) {
      prices[k] = a;
      jobs.push(dao.run("INSERT INTO feature_store_prices (feat, p7, p15, p30) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE p7 = VALUES(p7), p15 = VALUES(p15), p30 = VALUES(p30)", [k, a[0], a[1], a[2]]));
    } else {
      delete prices[k];
      jobs.push(dao.run("DELETE FROM feature_store_prices WHERE feat = ?", [k]));
    }
  });
  return Promise.all(jobs)
    .then(function () { adminStatus(socket); })
    .catch(function (err) {
      console.error("feature_store set failed:", err && err.message ? err.message : err);
      adminStatus(socket);
    });
}

/* ------------------------------------------------------------------ العضو */
/* ctx = { me: UserInfo[socket.id], pw: كائن الرتبة الأساسي (من غير الاشتراكات), setPoints(newValue) }
   بيرجّع Promise بـ { feat, days, price, expires } لو تم شراء، وإلا null */
function buy(socket, d, ctx) {
  var me = ctx && ctx.me, uid = uidOf(me);
  function fail(msg) { reply(socket, { op: "buy", ok: 0, msg: msg, points: pointsOf(me), mine: mine(uid) }); return Promise.resolve(null); }

  if (!uid) return fail("الشراء متاح للأعضاء المسجلين فقط");
  var feat = d.feat, days = parseInt(d.days, 10);
  if (!isFeat(feat) || DAYS.indexOf(days) === -1) return fail("طلب غير صالح");
  var price = priceOf(feat, days);
  if (!(price > 0)) return fail("هذه المدة غير متاحة للشراء");
  if (FeatureAccess.allowed(ctx.pw, feat)) return fail("هذه الميزة متاحة لرتبتك بالفعل");
  if (busy.has(uid)) return fail("جاري تنفيذ عملية سابقة، انتظر لحظة");
  if (pointsOf(me) < price) return fail("نقاطك غير كافية لشراء هذه المدة");

  busy.add(uid);
  var now = Date.now();
  var m = buys.get(uid), old = m && m[feat] > now ? m[feat] : 0;
  var exp = (old || now) + days * DAY_MS;

  function restore() {
    return (old
      ? dao.run("UPDATE feature_store_buys SET expires = ? WHERE uid = ? AND feat = ?", [old, uid, feat])
      : dao.run("DELETE FROM feature_store_buys WHERE uid = ? AND feat = ?", [uid, feat])
    ).catch(function () {});
  }

  return dao.run("INSERT INTO feature_store_buys (uid, feat, expires, done) VALUES (?, ?, ?, 0) ON DUPLICATE KEY UPDATE expires = VALUES(expires), done = 0", [uid, feat, exp])
    .then(function () {
      /* النقاط ممكن تكون اتغيّرت أثناء الكتابة (إدارة / مسابقة): نعيد الفحص قبل الخصم مباشرة */
      if (pointsOf(me) < price) { return restore().then(function () { busy.delete(uid); return fail("نقاطك غير كافية لشراء هذه المدة"); }); }
      var left = pointsOf(me) - price;
      var cur = buys.get(uid);
      if (!cur) { cur = {}; buys.set(uid, cur); }
      cur[feat] = exp;
      try { ctx.setPoints(left); } catch (e) { console.error("feature_store setPoints failed:", e && e.message ? e.message : e); }
      busy.delete(uid);
      reply(socket, {
        op: "buy", ok: 1, feat: feat, days: days, price: price, expires: exp, now: Date.now(),
        points: left, mine: mine(uid),
        msg: "تم شراء «" + titleOf(feat) + "» لمدة " + days + " يوم",
      });
      return { feat: feat, days: days, price: price, expires: exp };
    })
    .catch(function (err) {
      busy.delete(uid);
      console.error("feature_store buy failed:", err && err.message ? err.message : err);
      return restore().then(function () { return fail("تعذّر إتمام الشراء، حاول مرة أخرى"); });
    });
}

function handleUser(socket, data, ctx) {
  if (!dao || !data || typeof data !== "object" || !ctx || !ctx.me) return Promise.resolve(null);
  if (data.op === "buy") return buy(socket, data, ctx);
  reply(socket, state(ctx.me));
  return Promise.resolve(null);
}


/* ------------------------------------------------------------------ حذف التصميم عند انتهاء الاشتراك */
/* بيصفّر حقول الميزة على كائن (UserInfo مثلًا) ويرجّع { عمود: قيمة جديدة } للي اتغيّر بس */
function resetObject(feat, o) {
  var ch = {};
  if (!o || typeof o !== "object") return ch;
  if (feat === "namebg") {
    if (new RegExp(GRAD_DB).test(String(o.bg || ""))) ch.bg = "#ffffff";
  } else if (feat === "nameshine") {
    var u = String(o.ucol || "");
    if (u.slice(0, 2) === "n:") { var i = u.lastIndexOf("~"); ch.ucol = SHINE_PLAIN + (i > 0 ? u.slice(i) : ""); }
  } else if (has(REVOKE, feat)) {
    Object.keys(REVOKE[feat]).forEach(function (k) { if (String(o[k]) !== String(REVOKE[feat][k])) ch[k] = REVOKE[feat][k]; });
  }
  Object.keys(ch).forEach(function (k) { o[k] = ch[k]; });
  return ch;
}
/* نفس التصفير في قاعدة البيانات (أسماء الأعمدة ثابتة من REVOKE فمفيش حقن) */
function revokeSql(feat, uid) {
  if (feat === "namebg") return { sql: "UPDATE users SET bg = ? WHERE uid = ? AND bg REGEXP ?", params: ["#ffffff", uid, GRAD_DB] };
  if (feat === "nameshine") return { sql: "UPDATE users SET ucol = CONCAT(?, IF(LOCATE('~', ucol) > 0, SUBSTRING(ucol, LOCATE('~', ucol)), '')) WHERE uid = ? AND ucol LIKE 'n:%'", params: [SHINE_PLAIN, uid] };
  if (!has(REVOKE, feat)) return null;
  var cols = Object.keys(REVOKE[feat]);
  return { sql: "UPDATE users SET " + cols.map(function (c) { return c + " = ?"; }).join(", ") + " WHERE uid = ?", params: cols.map(function (c) { return REVOKE[feat][c]; }).concat([uid]) };
}

/* hooks (من server.js): basePw(power, idreg) → كائن الرتبة الأساسي (من غير اشتراكات) | online(uid) → [{ id, info }] | sync(id, changed, msg) */
function expireOne(row, hooks) {
  var uid = String(row.uid), feat = row.feat, exp = Number(row.expires);
  var m = buys.get(uid);
  if (m && m[feat] > Date.now()) return Promise.resolve();          /* اتجدّد وإحنا بنعالج */
  function finish() { return dao.run("UPDATE feature_store_buys SET done = 1 WHERE uid = ? AND feat = ? AND expires = ?", [uid, feat, exp]); }
  if (!isFeat(feat)) return finish();
  return dao.all("SELECT power, idreg FROM users WHERE uid = ? LIMIT 1", [uid]).then(function (rows) {
    var u = rows && rows[0];
    if (!u) return finish();                                         /* الحساب اتحذف */
    var base = hooks.basePw(u.power, u.idreg);                      /* لو رمت استثناء: done يفضل 0 ونعيد المحاولة (مش بنمسح وإحنا مش متأكدين من الرتبة) */
    if (base && FeatureAccess.allowed(base, feat)) return finish();  /* رتبته (أو تفعيل الإدارة) لسه بتفتح له الميزة: منمسحش */
    var q = revokeSql(feat, uid);
    var run = q ? dao.run(q.sql, q.params) : Promise.resolve();
    return run.then(function () {
      var ons = [];
      try { ons = hooks.online(uid) || []; } catch (e) { ons = []; }
      ons.forEach(function (o) {
        var ch = resetObject(feat, o.info);
        try { hooks.sync(o.id, ch, "انتهى اشتراك «" + titleOf(feat) + "»" + (Object.keys(ch).length ? " وتمت إزالة تصميمها من حسابك" : "")); } catch (e) { console.error("feature_store sync failed:", e && e.message ? e.message : e); }
      });
      return finish();
    });
  });
}

/* بيعالج الاشتراكات المنتهية اللي لسه ما اتحذفش تصميمها. بيرجّع عدد اللي اتعالج. */
function sweep(hooks) {
  if (!dao || sweeping || !hooks) return Promise.resolve(0);
  sweeping = true;
  var n = 0;
  return dao.all("SELECT uid, feat, expires FROM feature_store_buys WHERE expires <= ? AND done = 0 ORDER BY expires LIMIT " + SWEEP_BATCH, [Date.now()])
    .then(function (rows) {
      return (rows || []).reduce(function (p, r) {
        return p.then(function () {
          return expireOne(r, hooks).then(function () { n++; }, function (err) {
            console.error("feature_store expire failed:", err && err.message ? err.message : err);   /* done فاضل 0 فنحاول تاني في الدورة الجاية */
          });
        });
      }, Promise.resolve()).then(function () { return (rows || []).length; });
    })
    .catch(function (err) { console.error("feature_store sweep failed:", err && err.message ? err.message : err); return 0; })
    .then(function (len) {
      sweeping = false;
      if (len >= SWEEP_BATCH) setImmediate(function () { sweep(hooks); });
      return n;
    });
}
function startSweeper(hooks) {
  if (sweepTimer) clearInterval(sweepTimer);
  sweep(hooks);
  sweepTimer = setInterval(function () { sweep(hooks); }, SWEEP_EVERY_MS);
  if (sweepTimer.unref) sweepTimer.unref();
}

/* GET /store-me?token=.. → { on: 1 } لو العضو عنده اشتراك شغال (الجزء الكسول من المتجر بيتحمّل تلقائيًا ليهم بس).
   deps: { UsersRepo } — لازم قبل app.get("/:slug") */
function routes(app, deps) {
  app.get("/store-me", function (req, res) {
    res.set("Cache-Control", "no-store");
    var token = req.query["token"];
    if (typeof token !== "string" || token === "") return res.json({ on: 0 });
    deps.UsersRepo.getBy({ state: "getByToken", token: token }).then(function (u) {
      var uid = uidOf(u);
      res.json({ on: uid && Object.keys(mine(uid)).length ? 1 : 0 });
    }).catch(function () { res.json({ on: 0 }); });
  });
}

module.exports = {
  DAYS: DAYS,
  init: init,
  routes: routes,
  pw: pw,
  owns: owns,
  mine: mine,
  handleAdmin: handleAdmin,
  handleUser: handleUser,
  sweep: sweep,
  startSweeper: startSweeper,
  resetObject: resetObject,
};
