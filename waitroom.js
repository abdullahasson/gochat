/* [WAITROOM] غرفة الانتظار — إعدادات + منطق القرار (بدون اعتماد على متغيرات server.js)
   الإعدادات بتتخزن في uploads/waitroom.json (من غير ما نلمس جدول settings في MySQL). */
const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "uploads", "waitroom.json");
const ROOM_TOPIC = "غرفة الانتظار";

const DEFAULTS = {
  enabled: false,      // تفعيل غرفة الانتظار
  leaveLikes: 200,     // عدد اللايكات لمغادرة الغرفة
  noLikes: false,      // منع إرسال لايكات
  noAlert: false,      // منع إرسال تنبيه
  noPM: false,         // منع إرسال خاص
  foreign: false,      // تفعيل الغرفة على الدول الأجنبية
  featureLikes: 20000, // عدد اللايكات للسماح بالخصائص (تصميم العضوية)
  autoMove: false,     // النقل التلقائي الى العام بعد اكتمال اللايكات
  roomId: "",          // id الغرفة اللي اتنشأت
  since: 0,            // وقت آخر تفعيل (الأعضاء المسجلين بعده = جداد)
};

/* الدول العربية (غير كده = أجنبي). IL موجودة لأن السيرفر بيعرض علمها كـ ps */
const ARAB = new Set([
  "DZ", "BH", "KM", "DJ", "EG", "IQ", "JO", "KW", "LB", "LY", "MR", "MA", "OM",
  "PS", "IL", "QA", "SA", "SO", "SD", "SY", "TN", "AE", "YE",
]);

let S = Object.assign({}, DEFAULTS);

function toInt(v, def, min, max) {
  const n = Math.floor(Number(v));
  if (!isFinite(n)) return def;
  return Math.min(max, Math.max(min, n));
}

function sanitize(inp, base) {
  const o = Object.assign({}, base || S);
  if (!inp || typeof inp !== "object") return o;
  ["enabled", "noLikes", "noAlert", "noPM", "foreign", "autoMove"].forEach(function (k) {
    if (typeof inp[k] === "boolean") o[k] = inp[k];
  });
  if (inp.leaveLikes !== undefined) o.leaveLikes = toInt(inp.leaveLikes, o.leaveLikes, 0, 100000000);
  if (inp.featureLikes !== undefined) o.featureLikes = toInt(inp.featureLikes, o.featureLikes, 0, 100000000);
  return o;
}

function load() {
  try {
    const raw = JSON.parse(fs.readFileSync(FILE, "utf8"));
    S = sanitize(raw, DEFAULTS);
    if (typeof raw.roomId === "string") S.roomId = raw.roomId;
    S.since = Number(raw.since) || 0;
  } catch (e) {
    S = Object.assign({}, DEFAULTS);
  }
  return S;
}

function persist() {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(S));
  } catch (e) {
    console.log("waitroom save error:", e && e.message);
  }
}

function get() { return S; }

/* بيحفظ الإعدادات الجاية من اللوحة. بيرجّع { settings, wasEnabled } */
function save(inp) {
  const wasEnabled = S.enabled;
  const next = sanitize(inp, S);
  next.roomId = S.roomId;
  next.since = S.since;
  if (next.enabled && !wasEnabled) next.since = Date.now();
  S = next;
  persist();
  return { settings: S, wasEnabled: wasEnabled };
}

function setRoomId(id) { S.roomId = id || ""; persist(); }

function isForeign(code) {
  if (!code || typeof code !== "string") return false; // دولة مجهولة = تتعامل زي العربي (تنطبق عليها الغرفة)
  return !ARAB.has(code.toUpperCase());
}

/* هل المستخدم ده "جديد" (اتسجل بعد تفعيل الغرفة)؟ الزائر دايماً جديد. */
function isNewUser(u) {
  if (!u.member) return true;
  const t = u.joinuser ? new Date(u.joinuser).getTime() : NaN;
  return isFinite(t) && t >= S.since;
}

/* هل المستخدم يتحول لغرفة الانتظار عند الدخول؟
   u = { member:boolean, rep:number, rank:number, country:string, joinuser:any } */
function shouldWait(u) {
  if (!S.enabled || !S.roomId) return false;
  if (!u || (Number(u.rank) || 0) > 0) return false;            // أي صلاحية/رتبة = معفي
  if ((Number(u.rep) || 0) >= S.leaveLikes) return false;       // وصل للايكات المطلوبة
  if (!isNewUser(u)) return false;
  if (isForeign(u.country) && !S.foreign) return false;         // الأجانب بس لو الخيار متفعل
  return true;
}

/* هل خصائص تصميم العضوية محجوبة عن المستخدم؟ (جداد + أقل من حد الخصائص) */
function featuresBlocked(u) {
  if (!S.enabled || !u || !u.member) return false;
  if ((Number(u.rank) || 0) > 0) return false;
  if (!isNewUser(u)) return false;
  return (Number(u.rep) || 0) < S.featureLikes;
}

module.exports = {
  ROOM_TOPIC, DEFAULTS, load, get, save, setRoomId,
  shouldWait, featuresBlocked, isForeign, isNewUser,
};
