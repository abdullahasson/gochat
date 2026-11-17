/* [ADDED - PHASE 1B] بيانات بروفايل عضو غايب — حدث socket عام "member_profile"
   بيتنادى من أي مكان في الشات محتاج يفتح بروفايل عضو مش متصل (الإشعارات، الخاص، ... إلخ).
   بيرجّع نفس الحقول العامة اللي بيقراها upro() و memberDesignApplyUser() للمتصل،
   من غير IP / جهاز / اسم دخول / uid / توكن. كل النصوص بتتعمل لها escape والروابط والألوان بتتفحص. */
"use strict";

var MemberActions = require("./member_actions"); /* [ADDED - RESTRICTION BADGE] hasPendingKick() */

var SAFE_URL = /^[^\s"'()<>\\]{1,300}$/;
var SAFE_COLOR = /^#[0-9a-fA-F]{3,8}$/;
/* [ADDED - NAME SHINE] لون الاسم اللامع المرمّز n:<h|v|m>:<3 ألوان>:<0|1>:<0-100> */
var SAFE_NAME_COLOR = /^(#[0-9a-fA-F]{3,8}|n:[hvm](:#[0-9a-fA-F]{6}){3}:[01]:(100|[0-9]{1,2}))(~[A-Za-z]{3,24})?$/; /* [CHANGED - NAME FONT] لاحقة الخط اختيارية */
var SAFE_LID = /^[A-Za-z0-9_\-]{1,64}$/;
var THROTTLE_MS = 150; /* [PERF - PROFILE OPEN] كان 400: أي طلب تاني خلال 400ms كان بيترفض busy والعميل يعيد بعد 450ms. الاستعلام على PRIMARY KEY (رخيص) فـ150ms (≈6.6 طلب/ث للاتصال) لسه anti-flood كفاية */
var HITCACHE_TTL = 3000; /* [P5.5] ردّ جاهز لنفس العضوية خلال 3 ثواني يترجّع فورًا (بدون DB وبدون throttle) */

/* منع أي وسم HTML: العميل بيعرض النص عن طريق .html() زي باقي الشات */
function esc(v) {
  return String(v == null ? "" : v).split("<").join("&#x3C;").split(">").join("&#x3E;");
}
function safeUrl(v, fallback) {
  return typeof v === "string" && SAFE_URL.test(v) ? v : fallback;
}
function safeColor(v, fallback) {
  return typeof v === "string" && SAFE_COLOR.test(v) ? v : fallback;
}
function toInt(v) {
  var n = parseInt(v, 10);
  return isFinite(n) ? n : 0;
}
/* joinuser بيرجع تاريخ ISO، و lastssen ممكن يكون رقم أو نص فاضي */
function toTime(v) {
  if (v == null || v === "") return 0;
  if (typeof v === "number") return isFinite(v) ? v : 0;
  var s = String(v);
  var t = /^\d{10,}$/.test(s) ? Number(s) : Date.parse(s);
  return isFinite(t) ? t : 0;
}
/* youtube_on: 0 / "0" / false = مقفول، أي حاجة تانية = مفتوح (الافتراضي 1) */
function toOn(v) {
  return v === 0 || v === "0" || v === false ? 0 : 1;
}

/* نفس أسماء الحقول اللي في كائن المتصل (U_CASH) عشان العميل يستخدمها زي ما هي */
function shapeProfile(row, bandbc, banned, kickPending) {
  return {
    idreg: toInt(row.idreg),
    lid: typeof row.lid === "string" && SAFE_LID.test(row.lid) ? row.lid : "",
    topic: esc(row.topic),
    msg: esc(row.msg),
    pic: safeUrl(row.pic, "site/pic.png"),
    cover: safeUrl(row.cover, "site/cover.png"),
    ico: safeUrl(row.ico, ""),
    ucol: typeof row.ucol === "string" && SAFE_NAME_COLOR.test(row.ucol) ? row.ucol : "#000000",
    bg: safeColor(row.bg, ""),
    mcol: safeColor(row.mcol, "#000000"),
    mscol: safeColor(row.mscol, "#000000"),
    copic: safeColor(row.copic, "#FFFFFF"),
    power: typeof row.power === "string" ? row.power : "",
    co: esc(row.country), /* [ADDED - UPRO TABS] الدوله، عشان تبويب "المعلومات" يعرضها للعضو الغايب زي المتصل بالظبط */
    rep: toInt(row.rep),
    evaluation: toInt(row.evaluation),
    youtube: safeUrl(row.youtube, ""),
    youtube_on: toOn(row.youtube_on),
    profile_music: safeUrl(row.profile_music, ""),
    profile_music_name: esc(row.profile_music_name),
    member_card_color: safeColor(row.member_card_color, ""),
    profile_bg: safeColor(row.profile_bg, ""),
    name_glow: /^#[0-9a-fA-F]{6}$/.test(row.name_glow || "") ? row.name_glow.toLowerCase() : "", /* [ADDED - GLOW] */
    edge_glow: /^#[0-9a-fA-F]{6}$/.test(row.edge_glow || "") ? row.edge_glow.toLowerCase() : "",
    /* [ADDED - COVER FULL] العضو الغايب لازم ياخد نفس وضع "الصورة على كامل الغلاف" بتاع المتصل بالظبط */
    cover_full: row.cover_full ? 1 : 0,
    profile_cover: safeUrl(row.profile_cover, ""),
    social_telegram: safeUrl(row.social_telegram, ""),
    social_facebook: safeUrl(row.social_facebook, ""),
    social_whatsapp: safeUrl(row.social_whatsapp, ""),
    /* [ADDED - WELCOME BANNER] بيتعرض عن طريق .html() في العميل زي msg، فلازم يتعمله escape هنا */
    welcome_msg: esc(row.welcome_msg).slice(0, 240),
    joined: toTime(row.joinuser),
    seen: toTime(row.lastssen),
    /* [ADDED - PHASE 1C] حالة الإسكات الحالية عشان زراري الإسكات يظهروا صح (الجهاز نفسه مابيتبعتش) */
    meiut: !!row.muted,
    meiutbc: !!(bandbc && row.device && bandbc.indexOf(row.device) != -1),
    /* [ADDED - RESTRICTION BADGE] عشان شريط الحالة (محظور / مطرود) يظهر صح على صورة العضو الغايب */
    banned: !!banned,
    kickPending: !!kickPending,
  };
}

/* التخفي الفعلي = العضو متصل حاليًا + مفعّل التخفي + صلاحيته تسمح بيه.
   العضو الغايب مالوش جلسة → مش متخفي (نفس المنطق اللي اتصلّح في المرحلة 1) */
/* [PERF-FIX #10] بدل مسح كل الجلسات مع كل فتح بروفايل: فهرس صغير بالأعضاء المتخفّين بس (idreg) بيتبني مرة كل 300ms
   على الأكتر. لو الـidreg في الفهرس بنتحقق منه فعليًا من UserInfo (نتيجة دقيقة). */
var _hid = { t: 0, set: null };
function _hiddenSet(ctx) {
  var now = Date.now();
  if (_hid.set && now - _hid.t < 300) return _hid.set;
  var set = new Set(), ids = Object.keys(ctx.UserInfo), i, u, p;
  for (i = 0; i < ids.length; i++) {
    u = ctx.UserInfo[ids[i]];
    if (u && u.stealth && u.idreg) {
      p = typeof u.power === "string" ? ctx.GetPower(u.power) : null;
      if (p && p["stealth"]) set.add(u.idreg);
    }
  }
  _hid = { t: now, set: set };
  return set;
}
function isHiddenNow(ctx, rid) {
  return _hiddenSet(ctx).has("#" + rid);
}

var COLUMNS =
  "idreg, lid, topic, msg, pic, cover, ico, ucol, bg, mcol, mscol, copic, power, country, rep, evaluation, youtube, youtube_on, " +
  "profile_music, profile_music_name, member_card_color, profile_bg, name_glow, edge_glow, cover_full, profile_cover, social_telegram, social_facebook, social_whatsapp, welcome_msg, " +
  "joinuser, lastssen, muted, device";

/* بيتنادى مرة لكل اتصال socket: ctx = { dao, UserInfo, GetPower, getBandbc? } */
function attach(socket, ctx) {
  var last = 0;
  var hit = null; /* [P5.5] { rid, res, ts } — آخر إجابة ناجحة على نفس الاتصال */
  socket.on("member_profile", function (d, cb) {
    if (typeof cb !== "function") return;
    var me = ctx.UserInfo[socket.id];
    if (!me || !d || typeof d !== "object") return cb({ ok: false });
    var now = Date.now();
    var rid = toInt(d.idreg);
    if (!(rid > 0)) return cb({ ok: false });
    /* [P5.5] نفس العضوية خلال HITCACHE_TTL → رد فوري من الكاش. ده بيقتل عقوبة الـthrottle+retry
       (كانت 450ms كاملة) على إعادة فتح نفس البروفايل أو الطلب المكرر من uproLoadFull بعد openMemberProfile،
       والـthrottle نفسه فاضل شغال زي ما هو لأي عضوية مختلفة (anti-flood محفوظ). */
    if (hit && hit.rid === rid && now - hit.ts < HITCACHE_TTL) {
      return cb(hit.res);
    }
    if (now - last < THROTTLE_MS) return cb({ ok: false, reason: "busy" });
    last = now;
    /* [PERF - PROFILE OPEN] استعلام الطرد المؤجل بيشتغل بالتوازي مع استعلام العضو (كانوا ورا بعض = round trip زيادة للداتابيز).
       hasPendingKick بتعمل catch جواها وبترجّع false عند الخطأ فمفيش unhandled rejection حتى لو العضو مش موجود */
    var kickP = MemberActions.hasPendingKick(ctx.dao, rid);
    ctx.dao
      .get("SELECT " + COLUMNS + " FROM users WHERE idreg = ?", [rid])
      .then(function (row) {
        if (!row) return cb({ ok: false, reason: "none" });
        /* بنرفض بس لو العضو متخفي فعلًا دلوقتي ومعاك مش نفس الصلاحية */
        if (isHiddenNow(ctx, rid)) {
          var mp = typeof me.power === "string" ? ctx.GetPower(me.power) : null;
          if (!(mp && mp["stealth"])) return cb({ ok: false, reason: "hidden" });
        }
        /* [ADDED - RESTRICTION BADGE] */
        var banned = typeof ctx.IsBand === "function" ? !!ctx.IsBand(row.device) : false;
        return kickP.then(function (kickPending) {
          var res = {
            ok: true,
            user: shapeProfile(row, typeof ctx.getBandbc === "function" ? ctx.getBandbc() : null, banned, kickPending),
          };
          hit = { rid: rid, res: res, ts: Date.now() }; /* [P5.5] يترجّع فورًا لو اتعاد خلال 3 ثواني */
          cb(res);
        });
      })
      .catch(function (err) {
        console.error("member_profile failed:", err && err.message ? err.message : err);
        cb({ ok: false, reason: "error" });
      });
  });
}

module.exports = { attach: attach, _shapeProfile: shapeProfile };
