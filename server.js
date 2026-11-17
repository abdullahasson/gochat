const express = require("express");
const path = require("path");
const crypto = require("crypto"); /* [FIX-S03] توليد التوكنات بعشوائية تشفيرية بدل Math.random */
const request = require("request");
const rateLimit = require('express-rate-limit');
const multer = require("multer");
const fs = require("fs");
const rimraf = require("rimraf");
const Jimp = require("jimp");
const passwordHash = require("password-hash");
const formidable = require("formidable");
const mysqlDump = require("mysqldump");
const cors = require("cors");
const fetch = require("node-fetch");
const cp = require("child_process");
const { getVideoDurationInSeconds } = require("get-video-duration");
const bodyParser = require("body-parser");
const { RateLimiterMemory } = require("rate-limiter-flexible");
const rateLimiter = new RateLimiterMemory({ points: 15, pointsduration: 1 });
const sharp = require('sharp');
/* [ADDED - PHASE 1] غلاف البروفايل (ملف مستقل) */
const PCover = require("./router/profile_cover");
const app = express();
const options = {
  key: fs.readFileSync("pem/key.pem"),
  cert: fs.readFileSync("pem/cert.pem"),
};

const Config = require("./config");
/* [DOMAINS] الدومينات المضافة من لوحة التحكم (تبويب الموقع) تُحفظ في uploads/domains.json
   وتُدمج هنا مع Config.ListDomin عند الإقلاع — بدون تعديل config.js يدوياً.
   نعدّل نفس المصفوفة (push/splice) عشان كل الأماكن اللي بتقرأ Config.ListDomin تشوف التغيير فوراً. */
const DOMAINS_FILE = "uploads/domains.json";
function loadSavedDomains() {
  try {
    if (fs.existsSync(DOMAINS_FILE)) {
      var arr = JSON.parse(fs.readFileSync(DOMAINS_FILE, "utf8"));
      if (Array.isArray(arr)) return arr.filter(function (x) { return typeof x == "string" && x; });
    }
  } catch (e) { console.log("domains.json read error", e && e.message); }
  return [];
}
function saveSavedDomains(arr) {
  try { fs.mkdirSync("uploads", { recursive: true }); } catch (e0) {}
  fs.writeFileSync(DOMAINS_FILE, JSON.stringify(arr, null, 2));
}
function normalizeDomain(v) {
  var d = String(v || "").trim().toLowerCase();
  d = d.replace(/^[a-z]+:\/\//, "").replace(/[\/?#].*$/, "").replace(/:\d+$/, "").replace(/^www\./, "").replace(/\.$/, "");
  try { d = require("punycode/").toASCII(d); } catch (e) {}
  if (d.length > 253) return "";
  return /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))*\.[a-z0-9-]{2,63}$/.test(d) ? d : "";
}
(function mergeSavedDomains() {
  var base = Config.ListDomin.slice();
  Config.BaseDomains = base; /* الدومينات الأساسية من config.js — لا يمكن حذفها من اللوحة */
  loadSavedDomains().forEach(function (d) {
    if (Config.ListDomin.indexOf(d) == -1) Config.ListDomin.push(d);
  });
})();
/* [UIRETA-BADGES] شارات Uireta (مسمى + مدة بالأيام لكل عضو) والشريط المتحرك في لوجين Uireta — بيتحفظوا في uploads/uireta-data.json
   - الشارة هي الوحيدة اللي بتظهر في قايمة المتصلين داخل تصميم Uireta (المسميات التلقائية مدير/مشرف/VIP اتلغت).
   - key = idreg للعضو المسجّل ("#123"). الشارة بتنتهي تلقائياً بعد المدة. */
const UIRETA_FILE = "uploads/uireta-data.json";
var UiretaData = { badges: [], ticker: {} };
(function loadUiretaData() {
  try {
    if (fs.existsSync(UIRETA_FILE)) {
      var j = JSON.parse(fs.readFileSync(UIRETA_FILE, "utf8"));
      if (j && Array.isArray(j.badges)) UiretaData.badges = j.badges.filter(function (b) { return b && typeof b.key == "string" && typeof b.title == "string" && b.until > 0; });
      if (j && j.ticker && typeof j.ticker == "object") UiretaData.ticker = j.ticker;
    }
  } catch (e) { console.log("uireta-data.json read error", e && e.message); }
})();
function uiSave() {
  try { fs.mkdirSync("uploads", { recursive: true }); } catch (e0) {}
  fs.writeFileSync(UIRETA_FILE, JSON.stringify(UiretaData, null, 2));
}
function uiKind(title) {
  var t = String(title || "").trim().toLowerCase();
  if (t == "مدير") return "admin";
  if (t == "مشرف") return "mod";
  if (t == "vip") return "vip";
  return "custom";
}
function uiPrune() {
  var now = Date.now(), n = UiretaData.badges.length;
  UiretaData.badges = UiretaData.badges.filter(function (b) { return b.until > now; });
  if (UiretaData.badges.length !== n) { uiSave(); return true; }
  return false;
}
function uiBadgeMap() {
  uiPrune();
  var m = {};
  UiretaData.badges.forEach(function (b) { m[b.key] = { t: b.title, k: uiKind(b.title), e: b.until }; });
  return m;
}
function uiBroadcast() {
  __loginOnlineCache = { t: 0, body: "" };
  try { io.emit("UQ_BADGES", uiBadgeMap()); } catch (e) {}
}
function uiTickerFor(host) {
  var t = UiretaData.ticker || {};
  return typeof t[host] == "string" ? t[host] : "";
}
function uiListForAdmin() {
  uiPrune();
  var now = Date.now();
  return UiretaData.badges
    .map(function (b) {
      return { key: b.key, username: b.username || "", topic: b.topic || "", title: b.title, kind: uiKind(b.title), until: b.until, granted: b.granted || 0, daysLeft: Math.max(1, Math.ceil((b.until - now) / 86400000)) };
    })
    .sort(function (a, b) { return a.until - b.until; });
}
setInterval(function () { if (uiPrune()) uiBroadcast(); }, 10 * 60 * 1000);
const isPowers = require("./powers");
const limiter = rateLimit({
        windowMs: 1 * 60 * 1000,
        max: 50,
        standardHeaders: 'draft-7', 
        legacyHeaders: false,
        /* [Nopta] قايمة المتصلين في صفحة اللوجين بتتسحب كل 5 ثواني من كل زائر؛ ورا NAT/بروكسي كتير بيتشاركوا نفس الـ IP فكان الـ limit (50/دقيقة) يخلّيها فاضية */
        skip: function (req) { return req.path === "/GET_LOGIN_ONLINE" || req.path === "/UQ_BADGES"; },
})
var listalert = []; /* [FIX-S02] أُزيل استخدامها مع باب TokenHacker الخلفي */
/* [FIX-S02] تم حذف الباب الخلفي بالكامل:
   - const TokenHacker = '007'  (كان يسمح بمراقبة الرسائل الخاصة والدخول لأي غرفة)
   - معالجات privedshow / msgalerts / getallpbnv / gorooadmo
   - بث msgpmnow الذي كان يعترض المحادثات الخاصة */
const AppDataBase = require("./database/database");
const GetBand = require("./router/ban_list");
const GetBars = require("./router/bars_list");
const GetBots = require("./router/bots_list");
const GetBsb = require("./router/bsb_list");
const GetCuts = require("./router/cut_list");
const GetIntroMsg = require("./router/intromsg_list");
const GetNames = require("./router/names_list");
const GetNoName = require("./router/noname_list");
const GetNoText = require("./router/notext_list");
const GetPowers = require("./router/powers_list");
const GetLogs = require("./router/logs_list");
const GetRooms = require("./router/rooms_list");
const GetSetting = require("./router/settings");
const GetMesg = require("./router/mesgs");
const GetStats = require("./router/state_list");
const GetSub = require("./router/subscribe_list");
const GetUsers = require("./router/users_list");
const GetWallTrend = require("./router/wall_trend"); /* [ADDED] ترند الحائط */
const GetWallTop = require("./router/wall_top"); /* [ADDED] مبدع الحائط يومي/أسبوعي/شهري */
const GetXoTop = require("./router/xo_top"); /* [ADDED] نجم اكس او */
const GetFeather = require("./router/feather"); /* [ADDED] ريشة المبدعين */
const GetHistLetter = require("./router/wordcf_list");
const GetEmo = require("./router/emo_list");
const GetSico = require("./router/sico_list");
const GetAtar = require("./router/atar_list");
const GetBack = require("./router/back_list");
const GetDro3 = require("./router/dro3_list");
const GetStory = require("./router/story_list");
const db = new AppDataBase();
const StoryRepo = new GetStory(db);
const BandRepo = new GetBand(db);
const BarsRepo = new GetBars(db);
const BotsRepo = new GetBots(db);
const MesgRepo = new GetMesg(db);
const BsbRepo = new GetBsb(db);
const CutsRepo = new GetCuts(db);
const IntroRepo = new GetIntroMsg(db);
const NamesRepo = new GetNames(db);
const NoNamesRepo = new GetNoName(db);
const NotextRepo = new GetNoText(db);
const PowersRepo = new GetPowers(db);
const LogsRepo = new GetLogs(db);
const RoomsRepo = new GetRooms(db);
const SettingRepo = new GetSetting(db);
const StateRepo = new GetStats(db);
const SubRepo = new GetSub(db);
const UsersRepo = new GetUsers(db);
const WallTopRepo = new GetWallTop(db); /* [ADDED] */
const WallTrendRepo = new GetWallTrend(db); /* [ADDED] ترند الحائط */
const XoTopRepo = new GetXoTop(db); /* [ADDED] نجم اكس او */
const FeatherRepo = new GetFeather(db); /* [ADDED] ريشة المبدعين */
const HistLetterRepo = new GetHistLetter(db);
const EmoRepo = new GetEmo(db);
const SicoRepo = new GetSico(db);
const AtarRepo = new GetAtar(db);
const BackRepo = new GetBack(db);
const Dro3Repo = new GetDro3(db);

EmoRepo.createTable();
SicoRepo.createTable();
Dro3Repo.createTable();
AtarRepo.createTable();
BackRepo.createTable();
BsbRepo.createTable();
UsersRepo.createTable();
/* [ADDED] جدول مبدع الحائط: يتعمل تلقائي + تنظيف الأيام القديمة كل 12 ساعة */
setTimeout(function () { WallTopRepo.createTable(); }, 3000);
setInterval(function () { WallTopRepo.purge(); }, 12 * 60 * 60 * 1000);
/* [ADDED] جدول ترند الحائط: يتعمل تلقائي + تنظيف الأيام القديمة */
setTimeout(function () { WallTrendRepo.createTable(); }, 3100);
setInterval(function () { WallTrendRepo.purge(); }, 12 * 60 * 60 * 1000);
/* [ADDED] جدول نجم اكس او: يتعمل تلقائي + تنظيف الأيام القديمة كل 12 ساعة */
setTimeout(function () { XoTopRepo.createTable(); }, 3200);
setInterval(function () { XoTopRepo.purge(); }, 12 * 60 * 60 * 1000);
/* [ADDED] جدول ريشة المبدعين: يتعمل تلقائي أول تشغيل */
setTimeout(function () { FeatherRepo.createTable(); }, 3500);
/* [ADDED] عمود إشعار زيارة البروفايل: يتضاف مرة واحدة بعد إنشاء الجدول */
setTimeout(function () { UsersRepo.ensureVisitNotif(); }, 3000);
setTimeout(function () { UsersRepo.ensureUhide(); }, 3200); /* [ADDED] uhide */
setTimeout(function () { UsersRepo.ensureNfont(); }, 3300); /* [ADDED] خط زخرفة الاسم */
setTimeout(function () { UsersRepo.ensureNfx(); }, 3400); /* [ADDED] تأثير حركة الاسم */
setTimeout(function () { UsersRepo.ensureNclr(); }, 3500); /* [ADDED] تأثير لون الاسم */
/* [ADDED - PHASE 1] ضمان عمود الغلاف */
setTimeout(function () { UsersRepo.ensureCover(); }, 3200);
setTimeout(function () { RoomsRepo.ensureVseats().then(function () { try { RefreshRooms(0); } catch (e) {} }); }, 3400);
SettingRepo.createTable();
/* [ADDED] عمود لايكات إرسال صور/فيديو في الغرفة */
setTimeout(function () { SettingRepo.ensureRoomMediaLikes(); }, 3000);
PowersRepo.createTable();
RoomsRepo.createTable();
NamesRepo.createTable();
SubRepo.createTable();
MesgRepo.createTable();
StoryRepo.createTable();
BandRepo.createTable();
LogsRepo.createTable();
StateRepo.createTable();
BotsRepo.createTable().then(() => BotsRepo.ensureStay());
CutsRepo.createTable();
NotextRepo.createTable();
BarsRepo.createTable();
HistLetterRepo.createTable();
IntroRepo.createTable();
NoNamesRepo.createTable();
var LinkUpload = "";
var reconnct = "";
var UserChecked = [];
var OnlineUser = [];
var UserInfo = {};
var SiteSetting = [];
/* [WAITROOM] غرفة الانتظار */
const WaitRoom = require("./waitroom");
WaitRoom.load();
var PeerRoom = {};
var ShowPowers = [];
var NoNames = ["نايك", "شات", "دردشه", "دردشة", "http", "com", "انيك", "كسمك", "كصمك", "كسختك", "كصختك", "كحبه", "كحبة", "قحبة", "متناك", "منايك", "جلخ", "نياج", "منيوج", "فاشخ", "داعس", "سكس", "كس امك", "كس اختك", "شرموط", "انيك", "خواتك", "امهات", "كسم", "كسخ", "زب", "طيز", "كلب", "زوب", "عير","نيك"];
var RoomsList = [];
var RoomsListWith = [];
var SystemOpen = {};
var BrowserOpen = {};
/* [FIX-S02] const TokenHacker = '007'; — حُذف: باب خلفي كامل (مراقبة خاصة + دخول غرف + سحب قوائم) */
var ListEnter = [];
var botsauto = [];
var ListWait = [];
var NoMsgFilter = [];
var ListBand = [];
var ekti1 = [];
var ekti2 = [];
const System = {
  system1: false,
  system2: false,
  system3: false,
  system4: false,
  system5: false,
  system6: false,
  system7: true,
};


const Browser = {
  browser1: false,
  browser2: false,
  browser3: false,
  browser4: false,
  browser5: false,
  browser6: false,
  browser7: false,
  browser8: false,
  browser9: true,
};


var BotBC = {
        nb:0,
        isbot:false,
        start:false,
        room:'',
        timestop:3,
        timestart:0,
        player:[]
}
var bottime;

const url = require("url");
const base64id = require("base64id");
const http = require("https").createServer(options, app);
const io = require("socket.io")(http, {
  cors: {
    origin: Config.ListDomin,
    methods: ["GET", "POST"],
  },
  /* [FIX-PERF] كانت 5 ساعات: الاتصالات الميتة تبقى ساعات = مستخدمون أشباح + تسريب ذاكرة.
     القيم القياسية تكشف الانقطاع خلال ~45 ثانية، وconnectionStateRecovery بالأسفل يغطي إعادة الاتصال الصامتة */
  /* [SR-HB] المطلوب: الاتصال يفضل شغال لحد ساعة حتى لو العضو خارج المتصفح (تطبيق آخر / قفل الشاشة).
     السيرفر يبعت ping كل 25 ثانية ويستنى الـ pong 3575 ثانية => إجمالي 3600 ثانية = ساعة قبل ما يعتبر الاتصال مقطوع.
     (إغلاق التبويب/المتصفح بيوصل للسيرفر فورًا كـ close فمفيش مستخدمين أشباح من ده، والانقطاع الحقيقي بتكشفه نبضة العميل SR_HB خلال ثواني) */
  pingTimeout: 3575000,
  pingInterval: 25000,
  upgradeTimeout: 10000, /* [FIX-PERF] كانت 100ms: تفشل ترقية WebSocket على الشبكات البطيئة */
  maxHttpBufferSize: 1e6, /* [FIX-PERF] كانت 8e8 (800MB!): الرسائل نصية والملفات تمر عبر HTTP/multer وليس السوكت */
    connectionStateRecovery: {
        maxDisconnectionDuration: 70 * 60 * 1000, /* [SR-HB] 70 دقيقة: أطول من مهلة الساعة عشان الاسترجاع الصامت يفضل شغال بعد الفصل */
        skipMiddlewares: true,
      }
});

io.engine.generateId = (req) => {
  return stringGen(32);
};
/* ===== بحث يوتيوب (نسخة مقاومة لتغيّر صفحة يوتيوب) =====
   - لو وضعت Config.YoutubeKey (مفتاح YouTube Data API v3) يستخدم الـ API الرسمي (الأضمن)
   - وإلا يقرأ ytInitialData من صفحة النتائج بدل الاعتماد على شكل HTML ثابت
   ملاحظة: مكتوب بصيغة متوافقة مع إصدارات Node القديمة (بدون ?. أو ??) */
var YT_CACHE = {};
function ytText(o) {
  if (!o) return "";
  if (typeof o.simpleText == "string") return o.simpleText;
  if (o.runs && o.runs.length) {
    return o.runs.map(function (r) { return r.text || ""; }).join("");
  }
  return "";
}
function ytExtractData(html) {
  var m = html.indexOf("ytInitialData");
  if (m < 0) return null;
  var st = html.indexOf("{", m);
  if (st < 0) return null;
  var depth = 0, inStr = false, esc = false;
  for (var i = st; i < html.length; i++) {
    var ch = html[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
    } else if (ch === '"') inStr = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(html.slice(st, i + 1)); } catch (e) { return null; }
      }
    }
  }
  return null;
}
function ytCollect(node, out, max) {
  if (out.length >= max || !node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (var i = 0; i < node.length && out.length < max; i++) ytCollect(node[i], out, max);
    return;
  }
  var v = node.videoRenderer;
  if (v && v.videoId) {
    var dup = out.some(function (x) { return x.id === v.videoId; });
    if (!dup) {
      out.push({
        id: v.videoId,
        title: ytText(v.title),
        time: ytText(v.lengthText),
        channel: ytText(v.ownerText || v.longBylineText),
        views: ytText(v.shortViewCountText || v.viewCountText),
        link: "https://www.youtube.com/watch?v=" + v.videoId,
        thumbnail: "https://i.ytimg.com/vi/" + v.videoId + "/mqdefault.jpg",
      });
    }
    return;
  }
  for (var k in node) {
    if (out.length >= max) return;
    if (node[k] && typeof node[k] === "object") ytCollect(node[k], out, max);
  }
}
const searchYoutube = async function (query, nb) {
  var max = nb || 6;
  query = String(query || "").trim().slice(0, 100);
  if (!query) return [];
  var key = query.toLowerCase() + "|" + max;
  var hit = YT_CACHE[key];
  if (hit && Date.now() - hit.t < 10 * 60 * 1000) return hit.r;

  var result = [];
  if (Config.YoutubeKey) {
    var api =
      "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=" +
      max + "&q=" + encodeURIComponent(query) + "&key=" + Config.YoutubeKey;
    var jr = await fetch(api, { timeout: 8000 }).then(function (r) { return r.json(); });
    (jr.items || []).forEach(function (it) {
      if (!it.id || !it.id.videoId) return;
      result.push({
        id: it.id.videoId,
        title: it.snippet.title,
        time: "",
        channel: it.snippet.channelTitle,
        views: "",
        link: "https://www.youtube.com/watch?v=" + it.id.videoId,
        thumbnail: "https://i.ytimg.com/vi/" + it.id.videoId + "/mqdefault.jpg",
      });
    });
  } else {
    var url =
      "https://www.youtube.com/results?hl=ar&sp=EgIQAQ%253D%253D&search_query=" +
      encodeURIComponent(query);
    var html = await fetch(url, {
      timeout: 8000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "ar,en;q=0.8",
        Cookie: "CONSENT=YES+1; SOCS=CAI",
      },
    }).then(function (r) { return r.text(); });
    var data = ytExtractData(html);
    if (data) ytCollect(data, result, max);
  }
  if (result.length) YT_CACHE[key] = { t: Date.now(), r: result };
  return result;
};
app.get("/admin.html", function(req,res){
  res.send("Error 313 !")
})
let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __dirname + "/uploads/" + LinkUpload);
  },
  filename: (req, file, cb) => {
    if (typeof file != "object") {
      return;
    } else if (
      typeof file["mimetype"] != "string" ||
      typeof file["fieldname"] != "string"
    ) {
      return;
    }
    var extension = Config.TypeFile[file.mimetype];
    if (!extension) {
      return;
    }
    if (extension.includes("png")) {
      extension = "jpg";
    }
    cb(null, Date.now() + "." + extension);
  },
});

let upload = multer({
  storage: storage,
  preservePath: true,
  limits: { fileSize: Config.MaxUpload },
}).single("photo");
function getFiles(dir, files_) {
  files_ = files_ || [];
  var files = fs.readdirSync(dir);
  for (var i in files) {
    var name = dir + "/" + files[i];
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files_);
    } else {
      files_.push(name);
    }
  }
  return files_;
}
app.set("views", path.join(__dirname, "public"));
app.set("view engine", "ejs");
/* [FIX-PERF] ضغط gzip لكل الردود (HTML/CSS/JS/JSON) — الحزمة كانت مثبتة وغير مستخدمة!
   الصفحة الرئيسية 185KB + jQuery 244KB + x2.js 190KB تنضغط لثلث حجمها تقريباً */
const compression = require("compression");
app.use(compression({ level: 6, threshold: 1024 }));
/* [FIX-S11] ترويسات أمان آمنة (ما فيهاش CSP/X-Frame عشان ما تكسرش التضمين والسكربتات الداخلية) */
app.disable("x-powered-by");
app.use(function (req, res, next) {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  });
  next();
});
/* [FIX-S12] تحقق أصل الطلب للـ POST الحساسة: لو فيه Origin/Referer لازم يطابق الـ Host */
function sameOrigin(req) {
  var o = req.headers["origin"] || req.headers["referer"] || "";
  if (!o) return true;
  try { return new URL(o).host === req.headers["host"]; } catch (e) { return false; }
}
app.use(['/admin.js', '/admin-ui.js', '/login-style.js', '/login-style.css', '/uireta.js', '/uireta.css', '/vlist.js', '/bars-style.js', '/settings-style.js', '/wall-style.js', '/users-style.js', '/nfont.js', '/design-modal.js', '/room-style.css', '/zoom-default.js', '/user-status.js'], function (req, res, next) { res.set('Cache-Control', 'no-cache'); next(); }); /* [ADDED] ملف الشريط يتحدّث دايماً بدون كاش */ app.use(function (req, res, next) { if (req.method === 'GET' && (req.path === '/' || /\.(html|ejs)$/.test(req.path))) { res.set('Cache-Control', 'no-cache, must-revalidate'); } next(); }); /* [ADDED] صفحة الاندكس بدون كاش */
/* [FIX-F02] كانت كل ملفات js/css بـ no-cache → المتصفح يعيد التحقق من 34 ملفاً (طلب
   شبكة لكل ملف) في كل تحميل صفحة. الآن: كاش ساعة للملفات الثابتة الإصدارية (روابطها
   تحمل ?v= تتغير مع كل تعديل)، والملفات الساخنة أعلاه تظل no-cache كما هي */
app.use(express.static(__dirname + '/public', { maxAge: 31557600, setHeaders: function (res, fp) { if (/[\/\\](admin|admin-ui|login-style|uireta|vlist|bars-style|settings-style|wall-style|users-style|nfont|design-modal|room-style|zoom-default|user-status)\.(js|css)$/.test(fp)) { res.setHeader('Cache-Control', 'no-cache'); /* [FIX] الملفات الساخنة: كان setHeaders بيكتب فوق no-cache بكاش ساعة + stale-while-revalidate فالتعديلات ما بتظهرش */ } else if (/\.(js|css)$/.test(fp)) { res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400'); } else if (/\.html$/.test(fp)) { res.setHeader('Cache-Control', 'no-cache, must-revalidate'); } } }));
app.use(require("./router/thumbs").middleware); /* نسخ WebP مخففة للأيقونات والأفاتارات */
/* [FIX-PERF] أسماء ملفات الرفع طوابع زمنية لا تتغير بعد الرفع → كاش أطول + immutable */
app.use(express.static("uploads", {
  maxAge: "30d",
  immutable: true,
  setHeaders: function (res, fp) {
    /* [FIX-CACHE] صور الموقع (/site/: ايقونة الموقع، الغرف، الأعضاء، صورة المايك، البنرات...) أسماءها ثابتة وبتتغير من اللوحة —
       كاش 30 يوم immutable كان بيخلّي الزوار يشوفوا الصورة القديمة لحد شهر. دلوقتي دقيقة واحدة (والمتصفح بيراجع بـ ETag). */
    if (/[\/\\]site[\/\\]/.test(fp)) res.setHeader("Cache-Control", "public, max-age=60");
  },
}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(limiter);
app.use(cors({origin: [Config.ListDomin]}));
/* [ADDED] بنر صفحة اللوجين الجديدة: رفع صورة جديدة / رجوع للافتراضي (من لوحة التحكم > الإضافات) */
function loginBannerFile(host) {
  return "uploads/site/" + String(host || "").replace(/[^a-zA-Z0-9.\-]/g, "_") + "loginbanner.png";
}
function loginBannerUrl(host) {
  try {
    var f = loginBannerFile(host);
    if (fs.existsSync(f)) return "/" + f.replace(/^uploads\//, "") + "?v=" + Math.floor(fs.statSync(f).mtimeMs);
  } catch (e) {}
  return "";
}
app.post("/uploadLoginBanner", async (req, res) => {
  if (!sameOrigin(req)) return res.status(403).end("{}"); /* [FIX-S12] */
  UsersRepo.getBy({ state: "getByToken", token: req.query["token"] }).then(async (user) => {
    if (!user || !GetPower(user["power"])["owner"]) {
      return res.end(JSON.stringify({ error: true, msg: "ليس لديك الصلاحية" }));
    }
    LinkUpload = "/site";
    try {
      await upload(req, res, function (err) {
        if (typeof req.file != "object") {
          return res.status(400).send({ message: "فشل رفع الملف" });
        }
        var tmp = "uploads/site/" + req.file["filename"];
        Jimp.read(tmp, (e, img) => {
          fs.unlink(tmp, function () {});
          if (e) return res.end(JSON.stringify({ err: true, msg: "" }));
          (typeof img.cover == "function" ? img.cover(1080, 487) : img.resize(1080, 487)).write(loginBannerFile(req.hostname), (we) => {
            res.end(JSON.stringify({ err: !!we, msg: loginBannerUrl(req.hostname) }));
          });
        });
      });
    } catch (err) {
      res.status(500).send({ message: "فشل رفع الملف" });
    }
  });
});
app.post("/resetLoginBanner", (req, res) => {
  if (!sameOrigin(req)) return res.status(403).end("{}"); /* [FIX-S12] */
  UsersRepo.getBy({ state: "getByToken", token: req.query["token"] }).then((user) => {
    if (!user || !GetPower(user["power"])["owner"]) {
      return res.end(JSON.stringify({ error: true, msg: "ليس لديك الصلاحية" }));
    }
    try { if (fs.existsSync(loginBannerFile(req.hostname))) fs.unlinkSync(loginBannerFile(req.hostname)); } catch (e) {}
    res.end(JSON.stringify({ err: false }));
  });
});
/* [ADDED] الغلاف الخارجي للوضع الافتراضي (لما Nopta و Uireta مقفولين) — رفع / رجوع للافتراضي */
function defaultCoverFile(host) {
  return "uploads/site/" + String(host || "").replace(/[^a-zA-Z0-9.\-]/g, "_") + "defaultcover.png";
}
function defaultCoverUrl(host) {
  try {
    var f = defaultCoverFile(host);
    if (fs.existsSync(f)) return "/" + f.replace(/^uploads\//, "") + "?v=" + Math.floor(fs.statSync(f).mtimeMs);
  } catch (e) {}
  return "";
}
/* [ADDED] نسخة صورة المايك (لكسر كاش المتصفح بعد التغيير) */
function micVersion(host) {
  try {
    var f = "uploads/site/" + String(host || "").replace(/[^a-zA-Z0-9.\-]/g, "_") + "mic.png";
    if (fs.existsSync(f)) return Math.floor(fs.statSync(f).mtimeMs);
  } catch (e) {}
  return 0;
}
app.post("/uploadDefaultCover", async (req, res) => {
  if (!sameOrigin(req)) return res.status(403).end("{}");
  UsersRepo.getBy({ state: "getByToken", token: req.query["token"] }).then(async (user) => {
    if (!user || !GetPower(user["power"])["owner"]) {
      return res.end(JSON.stringify({ error: true, msg: "ليس لديك الصلاحية" }));
    }
    LinkUpload = "/site";
    try {
      await upload(req, res, function (err) {
        if (typeof req.file != "object") {
          return res.status(400).send({ message: "فشل رفع الملف" });
        }
        var tmp = "uploads/site/" + req.file["filename"];
        Jimp.read(tmp, (e, img) => {
          fs.unlink(tmp, function () {});
          if (e) return res.end(JSON.stringify({ err: true, msg: "" }));
          (typeof img.cover == "function" ? img.cover(1080, 487) : img.resize(1080, 487)).write(defaultCoverFile(req.hostname), (we) => {
            res.end(JSON.stringify({ err: !!we, msg: defaultCoverUrl(req.hostname) }));
          });
        });
      });
    } catch (err) {
      res.status(500).send({ message: "فشل رفع الملف" });
    }
  });
});
app.post("/resetDefaultCover", (req, res) => {
  if (!sameOrigin(req)) return res.status(403).end("{}");
  UsersRepo.getBy({ state: "getByToken", token: req.query["token"] }).then((user) => {
    if (!user || !GetPower(user["power"])["owner"]) {
      return res.end(JSON.stringify({ error: true, msg: "ليس لديك الصلاحية" }));
    }
    try { if (fs.existsSync(defaultCoverFile(req.hostname))) fs.unlinkSync(defaultCoverFile(req.hostname)); } catch (e) {}
    res.end(JSON.stringify({ err: false }));
  });
});
/* [ADDED] بنر خاص بكل دومين — من تبويب "الموقع" في لوحة التحكم (الدومين يُختار من القائمة المسجّلة فقط) */
function domainBannerFile(host) {
  return "uploads/site/" + String(host || "").replace(/[^a-zA-Z0-9.\-]/g, "_") + "banner.png";
}
function validBannerHost(h) {
  return typeof h == "string" && /^[a-zA-Z0-9.\-]+$/.test(h) && Config.ListDomin.indexOf(h) != -1;
}
function domainBannerVersion(host) {
  try {
    var f = domainBannerFile(host);
    if (fs.existsSync(f)) return Math.floor(fs.statSync(f).mtimeMs);
  } catch (e) {}
  return 0;
}
/* [FIX-BANNER] البنر "المخصّص" = ملف الدومين مختلف عن البنر الافتراضي (uploads/site/banner.png).
   بنستخدمه في كل تصاميم اللوجين (الافتراضي / Nopta / Uireta) مش في الوضع القديم بس. */
var __bnCustomCache = {};
function domainBannerCustom(host) {
  try {
    var f = domainBannerFile(host), d = "uploads/site/banner.png";
    if (!fs.existsSync(f)) return false;
    var st = fs.statSync(f), key = st.mtimeMs + ":" + st.size;
    if (__bnCustomCache[f] && __bnCustomCache[f].k === key) return __bnCustomCache[f].v;
    var v = true;
    if (fs.existsSync(d)) {
      var ds = fs.statSync(d);
      if (ds.size === st.size && fs.readFileSync(f).equals(fs.readFileSync(d))) v = false;
    }
    __bnCustomCache[f] = { k: key, v: v };
    return v;
  } catch (e) {
    return false;
  }
}
function domainBannerUrl(host) {
  return domainBannerCustom(host) ? "/" + domainBannerFile(host).replace(/^uploads\//, "") + "?v=" + domainBannerVersion(host) : "";
}
app.post("/uploadDomainBanner", async (req, res) => {
  if (!sameOrigin(req)) return res.status(403).end("{}");
  UsersRepo.getBy({ state: "getByToken", token: req.query["token"] }).then(async (user) => {
    if (!user || !GetPower(user["power"])["owner"]) {
      return res.end(JSON.stringify({ error: true, msg: "ليس لديك الصلاحية" }));
    }
    var host = req.query["host"];
    if (!validBannerHost(host)) {
      return res.end(JSON.stringify({ error: true, msg: "دومين غير مسجّل" }));
    }
    LinkUpload = "/site";
    try {
      await upload(req, res, function (err) {
        if (typeof req.file != "object") {
          return res.status(400).send({ message: "فشل رفع الملف" });
        }
        var tmp = "uploads/site/" + req.file["filename"];
        Jimp.read(tmp, (e, img) => {
          fs.unlink(tmp, function () {});
          if (e) return res.end(JSON.stringify({ err: true, msg: "" }));
          (typeof img.cover == "function" ? img.cover(1080, 487) : img.resize(1080, 487)).write(domainBannerFile(host), (we) => {
            if (!we) {
              SaveStats({ state: "تعديل بنر الدومين: " + host, topic: user["topic"], ip: user["ip"], username: user["username"], room: "", time: new Date().getTime() });
            }
            res.end(JSON.stringify({ err: !!we, msg: "/site/" + host + "banner.png?v=" + domainBannerVersion(host) }));
          });
        });
      });
    } catch (err) {
      res.status(500).send({ message: "فشل رفع الملف" });
    }
  });
});
app.post("/resetDomainBanner", (req, res) => {
  if (!sameOrigin(req)) return res.status(403).end("{}");
  UsersRepo.getBy({ state: "getByToken", token: req.query["token"] }).then((user) => {
    if (!user || !GetPower(user["power"])["owner"]) {
      return res.end(JSON.stringify({ error: true, msg: "ليس لديك الصلاحية" }));
    }
    var host = req.query["host"];
    if (!validBannerHost(host)) {
      return res.end(JSON.stringify({ error: true, msg: "دومين غير مسجّل" }));
    }
    try {
      /* الرجوع للبنر الافتراضي = نسخ uploads/site/banner.png (لو موجود) وإلا حذف ملف الدومين */
      var def = "uploads/site/banner.png";
      if (fs.existsSync(def)) fs.copyFileSync(def, domainBannerFile(host));
      else if (fs.existsSync(domainBannerFile(host))) fs.unlinkSync(domainBannerFile(host));
      SaveStats({ state: "إرجاع البنر الافتراضي للدومين: " + host, topic: user["topic"], ip: user["ip"], username: user["username"], room: "", time: new Date().getTime() });
    } catch (e) {}
    res.end(JSON.stringify({ err: false, msg: "/site/" + host + "banner.png?v=" + domainBannerVersion(host) }));
  });
});
app.post("/uploadURM", async (req, res) => {
  UsersRepo.getBy({ state: "getByToken", token: req.query["token"] }).then(
    async (user) => {
      if (user) {
        if (GetPower(user["power"])["owner"]) {
          /* [FIX-S04] Path Traversal: كان req.query.state يُلحق مباشرة بمسار الرفع
             (LinkUpload = "/" + state) فيمكن حقن ../ للكتابة خارج uploads/.
             الآن: قائمة بيضاء من الأدلة المسموحة فقط. */
          var __uploadDirs = ["sico", "dro3", "atar", "back", "emo"];
          if (
            req.query["state"] == "banner" ||
            req.query["state"] == "logo" ||
            req.query["state"] == "msgpic" ||
            req.query["state"] == "bacmic" ||
            req.query["state"] == "mic" ||
            req.query["state"] == "room" ||
            req.query["state"] == "user"
          ) {
            LinkUpload = "/site";
          } else if (
            typeof req.query["state"] == "string" &&
            __uploadDirs.indexOf(req.query["state"]) != -1
          ) {
            LinkUpload = "/" + req.query["state"];
          } else {
            /* [FIX-S04] قيمة state غير معروفة → نرفض الرفع بدل الكتابة في مسار عشوائي */
            return res.status(400).send(JSON.stringify({ err: true, msg: "مسار رفع غير صالح" }));
          }
          try {
            await upload(req, res, function (err) {
              if (typeof req.file != "object") {
                return res.status(400).send({ message: "فشل رفع الملف" });
              }
              /* [FIX-SITE-IMG] الدومين المختار من تبويب الموقع (لو مسجّل) بدل دومين فتح اللوحة */
              var __sh = typeof req.query["host"] == "string" && validBannerHost(req.query["host"]) ? req.query["host"] : req.hostname;
              if (req.query["state"] == "msgpic") {
                fs.rename(
                  req.file.path,
                  "uploads/" + LinkUpload + "/msgpic.png",
                  function (err) {
                    if (err) {
                      res.end(JSON.stringify({ err: true, msg: "" }));
                      return;
                    }
                  }
                );
              }
              if (
                req.query["state"] == "banner" ||
                req.query["state"] == "logo" ||
                req.query["state"] == "msgpic" ||
                req.query["state"] == "bacmic" ||
                req.query["state"] == "mic" ||
                req.query["state"] == "room" ||
                req.query["state"] == "user"
              )
               {
                Jimp.read(
                  "uploads/" + LinkUpload + "/" + req.file["filename"],
                  (err, lenna) => {
                    if (err) {
                      res.end(JSON.stringify({ err: true, msg: "" }));
                      return;
                    } else {
                      fs.unlink(
                        "uploads/" + LinkUpload + "/" + req.file["filename"],
                        (err) => {
                          if (err) {
                            res.end(JSON.stringify({ err: true, msg: "" }));
                            return;
                          }
                        }
                      );

                      lenna.write(
                          "uploads/" + LinkUpload + "/" + (req.query["state"] == "user" ? __sh + "pic.png" : __sh + req.query["state"] + ".png"),
                          function (__we) {
                            /* [FIX-SITE-IMG] كان الرد بيرجع قبل ما Jimp يخلّص الكتابة فاللوحة كانت بتحمّل الصورة القديمة */
                            if (res.headersSent) return;
                            res.end(
                              JSON.stringify({
                                err: !!__we,
                                msg: req.query["state"] == "user" ? "pic.png?z" + randomNumber(1, 100) : req.query["state"] + ".png?z" + randomNumber(1, 100),
                              })
                            );
                          }
                        );
                    }
                  }
                );

                SaveStats({
                  state:
                    req.query["state"] == "logo"
                      ? "تعديل ايقونة الموقع"
                      : req.query["state"] == "user"
                      ? "تعديل ايقونة الأعظاء"
                      : req.query["state"] == "bacmic"
                      ? "تعديل خلفيه المايكات"
                      : req.query["state"] == "mic"
                      ? "تعديل صوره المايكات"
                      : req.query["state"] == "room"
                      ? "تعديل ايقونة الرومات"
                      : req.query["state"] == "banner"
                      ? "تعديل بنر الموقع" 
                         : "",
                  topic: user["topic"],
                  ip: user["ip"],
                  username: user["username"],
                  room: "",
                  time: new Date().getTime(),
                });
              }

              if (
                req.query["state"] == "sico" ||
                req.query["state"] == "dro3" ||
                req.query["state"] == "atar" ||
                req.query["state"] == "back" ||
                req.query["state"] == "emo"
              ) {
                SaveStats({
                  state:
                    req.query["state"] == "sico"
                      ? "إظافة بنر | ايقونه"
                      : req.query["state"] == "dro3"
                     
                      ? "إظافة هدية | ايقونه"
                      : req.query['atar']
                      ? "إضافة اطار الصور"
                      : req.query['back']
                      ? "إضافة خلفية الاعضاء"
                      : "إظافة فيس | ايقونه",
                  topic: user["topic"],
                  ip: user["ip"],
                  username: user["username"],
                  room: "",
                  time: new Date().getTime(),
                });
              }

              if (req.query["state"] == "sico") {
                SicoRepo.create({ path: req.file["filename"] });
                RefreshSico();
              }
              if (req.query["state"] == "atar") {
                AtarRepo.create({ path: req.file["filename"] });
                RefreshAtar();
              }if (req.query["state"] == "back") {
                BackRepo.create({ path: req.file["filename"] });
                RefreshBack();
              } else if (req.query["state"] == "dro3") {
                Dro3Repo.create({ path: req.file["filename"] });
                RefreshDro3();
              }

              if (req.query["state"] == "emo") {
                /* [ADDED] إصلاح التعليق عند 100%: الرد بيرجع دايماً حتى لو جدول الايموشن فاضي أو حصل خطأ */
                EmoRepo.getByL().then((emo) => {
                  const lastType = emo && emo[0] ? Number(emo[0]["type"]) || 0 : 0;
                  const newType = lastType + 1;
                  return EmoRepo.create({
                    type: newType,
                    path: req.file["filename"],
                  }).then(() => {
                    RefreshEmo();
                    res.end(
                      JSON.stringify({
                        err: false,
                        msg:
                          req.query["state"] +
                          "/" +
                          req.file["filename"] +
                          "@" +
                          newType,
                      })
                    );
                  });
                }).catch((e) => {
                  console.log("emo upload error:", e && e.message);
                  if (!res.headersSent) {
                    res.status(500).end(
                      JSON.stringify({ err: true, msg: "فشل حفظ الايموشن" })
                    );
                  }
                });
              } else if (["banner", "logo", "bacmic", "mic", "room", "user"].indexOf(req.query["state"]) != -1) {
                /* الرد بيتبعت من callback كتابة الصورة فوق */
              } else {
                res.end(JSON.stringify({ err: false, msg: req.file["filename"].replace(
                      req.file["filename"],
                      req.query["state"] == "user"
                        ? "pic.png?z" + randomNumber(1, 100)
                        : req.query["state"] == "sico" ||
                          req.query["state"] == "back" ||
                          req.query["state"] == "atar" ||
                          req.query["state"] == "dro3"
                        ? req.query["state"] + "/" + req.file["filename"]
                        : req.query["state"] + ".png?z" + randomNumber(1, 100)
                    ),
                  })
                );
              }
            });
          } catch (err) {
            if (err.code == "LIMIT_FILE_SIZE") {
              return res.status(500).send({
                message: "فشل إرسال الملف تأكد ان حجم الملف مناسب 20 ميجا",
              });
            }
            res.status(500).send({
              message: `Could not upload the file: ${req.file.originalname}. ${err}`,
            });
          }
        } else {
          res.end(JSON.stringify({ error: true, msg: "ليس لديك الصلاحية" }));
        }
      }
    }
  );
});

app.post("/uploadstory", async (req, res) => {
  LinkUpload = "/story";
  try {
    await upload(req, res, async function (err) {
      if (typeof req.file != "object") {
        return res.status(400).send({ message: "فشل رفع الملف" });
      }
      if (
        req.file["filename"].includes(".jpg") ||
        req.file["filename"].includes(".jpeg") ||
        req.file["filename"].includes(".mov") ||
        req.file["filename"].includes(".mp4") ||
        req.file["filename"].includes(".mpa") ||
        req.file["filename"].includes(".webm") ||
        req.file["filename"].includes(".3gp") ||
        req.file["filename"].includes(".3gp2") ||
        req.file["filename"].includes(".png") ||
        req.file["filename"].includes(".gif")
      ) {
        /* [FIX-PERF] كان Jimp.read يقرأ الصورة ثم يهملها (لا حفظ = صفر فائدة + استهلاك ذاكرة)
           الآن: تصغير فعلي لحد 720x1280 وقت الرفع، وبنرجّع اسم الملف الجديد للمتصفح */
        if (/\.(jpe?g|png|gif|webp)$/i.test(req.file["filename"])) {
          try {
            const stSrc = "uploads/story/" + req.file["filename"];
            const stTmp = stSrc + ".opt.tmp";
            await sharp(stSrc, { animated: true, limitInputPixels: 100000000 })
              .rotate()
              .resize(720, 1280, { fit: "inside", withoutEnlargement: true })
              .webp({ quality: 78 })
              .toFile(stTmp);
            if (fs.statSync(stTmp).size < fs.statSync(stSrc).size) {
              fs.unlinkSync(stSrc);
              req.file["filename"] = req.file["filename"].replace(/\.(jpe?g|png|gif|webp)$/i, "") + ".webp";
              fs.renameSync(stTmp, "uploads/story/" + req.file["filename"]);
            } else {
              fs.unlinkSync(stTmp);
            }
          } catch (stErr) {
            console.log("story optimize error:", stErr && stErr.message);
          }
        }
      } else {
        return res.status(500).send({
          message: "الرجاء التحقق من صيغة الملف (mp4 , jpg , png, mov)",
        });
      }

      if (req.file["mimetype"].includes("video")) {
        getVideoDurationInSeconds("uploads/story/" + req.file["filename"]).then(
          (duration) => {
            var time = 20;
            if (parseInt(duration / 60, 10) > 0) {
              time = parseInt(duration / 60, 10) * 600;
            } else if (parseInt(duration / 60, 10) == 0) {
              time = (duration % 60) * 10;
            } else {
              time = 20;
            }
            res.json(
              LinkUpload +
                "/" +
                req.file["filename"] +
                "@" +
                req.file["mimetype"] +
                "@" +
                time
            );
          }
        );
      } else {
        res.json(
          LinkUpload +
            "/" +
            req.file["filename"] +
            "@" +
            req.file["mimetype"] +
            "@" +
            20
        );
      }
    });
  } catch (err) {
    if (err.code == "LIMIT_FILE_SIZE") {
      return res
        .status(500)
        .send({ message: "فشل إرسال الملف تأكد ان حجم الملف مناسب 20 ميجا" });
    }
    res.status(500).send({
      message: `Could not upload the file: ${req.file.originalname}. ${err}`,
    });
  }
});

app.post("/upload", async(req, res)=> {
        LinkUpload = "/sendfile";
       try {
                await upload(req, res, async function (err) {
                        if (typeof req.file != 'object') {
                                return res.status(400).send({ message: "فشل رفع الملف" });
                        };
                        
                        
                        /* [FIX-PERF] كان: Jimp بجودة 60 بدون تصغير أبعاد (صورة 4000px تبقى 4000px!) وPNG/GIF بلا معالجة.
                           الآن: sharp يصغّر كل الصور (حتى المتحركة) لحد أقصى 1280px ويحفظها WebP أخف بكثير */
                        if(/\.(jpe?g|png|gif|webp)$/i.test(req.file["filename"])){
                                try {
                                        const src = "uploads/sendfile/" + req.file["filename"];
                                        const tmp = src + ".opt.tmp";
                                        await sharp(src, { animated: true, limitInputPixels: 100000000 })
                                                .rotate()
                                                .resize(1280, 1280, { fit: "inside", withoutEnlargement: true })
                                                .webp({ quality: 78 })
                                                .toFile(tmp);
                                        const oldSize = fs.statSync(src).size;
                                        const newSize = fs.statSync(tmp).size;
                                        if (newSize < oldSize) {
                                                fs.unlinkSync(src);
                                                const newName = req.file["filename"].replace(/\.(jpe?g|png|gif|webp)$/i, "") + ".webp";
                                                fs.renameSync(tmp, "uploads/sendfile/" + newName);
                                                return res.end("/sendfile/" + newName);
                                        }
                                        fs.unlinkSync(tmp);
                                } catch (shErr) {
                                        console.log("upload optimize error:", shErr && shErr.message);
                                }
                        };
                        
                        res.end("/sendfile/" + req.file["filename"]);
                });
  } catch (err) {
            if(err.code == "LIMIT_FILE_SIZE") {
                        return res.status(500).send({message: "فشل إرسال الملف تأكد ان حجم الملف مناسب 20 ميجا"});
                 };
                 res.status(500).send({message: `Could not upload the file: ${req.file.originalname}. ${err}`})
        };
});
/* ===================== [ADDED] مشغل الموسيقى: الثوابت + رفع الأغاني ===================== */
const MusicDir = path.join(__dirname, "uploads", "music");
try { fs.mkdirSync(MusicDir, { recursive: true }); } catch (e) {}
const MusicRoom = {};     // roomId -> حالة المشغل الحالية
const MusicUploads = {};  // اسم الملف -> وقت الرفع (الملفات المرفوعة في هذه الجلسة فقط تُقبل للتشغيل)
let MusicLid = 0;
const MUSIC_EXT_RE = /\.(mp3|wav|ogg|oga|m4a|aac|weba|webm|opus|flac|mp4)$/i;
const MUSIC_MAX_BYTES = 40 * 1024 * 1024; // 40 ميجا
const musicUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) { cb(null, MusicDir); },
    filename: function (req, file, cb) {
      var ext = (path.extname(file.originalname || "") || "").toLowerCase();
      cb(null, Date.now() + "_" + Math.random().toString(36).slice(2, 8) + ext);
    },
  }),
  limits: { fileSize: MUSIC_MAX_BYTES },
  fileFilter: function (req, file, cb) {
    var ok = MUSIC_EXT_RE.test(file.originalname || "") && /^(audio|video)\//i.test(file.mimetype || "");
    cb(null, ok);
  },
}).single("photo");
app.post("/uploadmusic", function (req, res) {
  UsersRepo.getBy({ state: "getByToken", token: req.query["token"] }).then(function (user) {
    if (!user) return res.status(403).send(JSON.stringify({ err: true, msg: "غير مصرح" }));
    musicUpload(req, res, function (err) {
      if (err || !req.file) {
        var big = err && err.code == "LIMIT_FILE_SIZE";
        return res.status(400).send(JSON.stringify({ err: true, msg: big ? "حجم الملف كبير جداً (الحد الأقصى 40 ميجا)" : "ملف غير مدعوم، اختر ملفاً صوتياً (mp3 / wav / ogg / m4a)" }));
      }
      MusicUploads[req.file.filename] = Date.now();
      res.send(JSON.stringify({ err: false, url: "/music/" + req.file.filename }));
    });
  }).catch(function () {
    res.status(500).send(JSON.stringify({ err: true, msg: "خطأ في السيرفر" }));
  });
});
/* ===================== [END] مشغل الموسيقى: الثوابت + الرفع ===================== */
app.post("/uppic", async (req, res) => {
  if (typeof req.query["nf"] != 'string') {
    return;
  } else if (req.query["nf"] == 'user' || req.query["nf"] == 'roomback' || req.query["nf"] == 'room' || req.query["nf"] == 'bot' || req.query["nf"] == 'cover') {
  } else {
    return;
  };
  if (req.query["nf"] == 'user' || req.query["nf"] == 'bot' || req.query["nf"] == 'cover') {
    LinkUpload = 'pic';
  } else {
    LinkUpload = 'picroom';
  };
  try {
    await upload(req, res, async function (err) {
      if (typeof req.file != 'object') {
        return res.status(400).send({ message: "فشل رفع الصوره" });
      } else if (typeof Config.TypeFileImage[req.file['mimetype']] != 'string') {
        return res.status(400).send({ message: "فشل رفع الصوره" });
      };
      /* [ADDED - PHASE 1] رفع غلاف: قص/تصغير لـ 900×300 وإرجاع المسار */
      if (req.query["nf"] == 'cover') {
        try {
          const cpath = await PCover.processUpload(LinkUpload, req.file["filename"]);
          return res.json(cpath + '@cover');
        } catch (ce) {
          return res.status(400).send({ message: "فشل رفع الصوره" });
        }
      }
      /* [FIX-PERF] صور الغرف وخلفياتها (picroom) كانت تُحفظ بالحجم الكامل (حتى 20MB!)
         الآن تُصغّر وقت الرفع لحد أقصى 1280px JPEG جودة 80 */
      if (LinkUpload == 'picroom') {
        try {
          const rpSrc = "uploads/picroom/" + req.file["filename"];
          const rpTmp = rpSrc + ".opt.tmp";
          await sharp(rpSrc, { animated: true, limitInputPixels: 100000000 })
            .rotate()
            .resize(1280, 1280, { fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toFile(rpTmp);
          if (fs.statSync(rpTmp).size < fs.statSync(rpSrc).size) {
            fs.unlinkSync(rpSrc);
            fs.renameSync(rpTmp, rpSrc);
          } else {
            fs.unlinkSync(rpTmp);
          }
        } catch (rpErr) {
          console.log("picroom optimize error:", rpErr && rpErr.message);
        }
      }
      await sharp("uploads/" + LinkUpload + "/" + req.file["filename"])
        .resize(150, 150, {
          fit: 'contain',
          background: 'transparent',
        })
        .toFile("uploads/" + LinkUpload + "/" + req.file["filename"] + '.jpg');
      res.json("/" + LinkUpload + "/" + req.file["filename"] + '@' + req.query["nf"]);
    });
  } catch (err) {
    if (err.code == "LIMIT_FILE_SIZE") {
      return res.status(500).send({
        message: "فشل إرسال الصوره تأكد ان حجم الصوره مناسب 20 ميجا",
      });
    }
    res.status(500).send({
      message: `Could not upload the file: ${req.file.originalname}. ${err}`,
    });
  }
});


app.get("/GET_ALL_USER_ONLINE", function (req, res, next) {
  /* [FIX-S] كانت بلا أي تحقق: أي زائر مجهول يسحب كل المتصلين والرتب.
     الآن: تتطلب token صالحاً لأي عضو مسجّل (نفس البيانات تصل له عبر ulist
     أصلاً) — الزوار المجهولون يُرفضون */
  var q = String(req.query["token"] || "");
  if (!q || q.length < 20) {
    return res.status(403).end(JSON.stringify({ err: true, msg: "غير مصرح" }));
  }
  UsersRepo.getBy({ state: "getByToken", token: q }).then(function (user) {
    if (!user) {
      return res.status(403).end(JSON.stringify({ err: true, msg: "غير مصرح" }));
    }
    res.end(
      JSON.stringify({
        powers: ShowPowers,
        online: filteredArray(OnlineUser, "s", false),
      })
    );
  }).catch(function () {
    res.status(500).end(JSON.stringify({ err: true, msg: "خطأ في السيرفر" }));
  });
});

/* [ADDED] Nopta: قائمة المتصلين لصفحة اللوجين (بدون token) — حقول العرض فقط، بدون id/ip/token */
var __loginOnlineCache = { t: 0, body: "" };
app.get("/GET_LOGIN_ONLINE", function (req, res) {
  try {
    /* كاش 3 ثواني: كل الزوار بياخدوا نفس الرد بدل ما نبني القايمة (200 عضو) لكل طلب */
    if (__loginOnlineCache.body && Date.now() - __loginOnlineCache.t < 3000) {
      res.set("Cache-Control", "no-store");
      return res.end(__loginOnlineCache.body);
    }
    var list = filteredArray(OnlineUser, "s", false);
    var __bm = uiBadgeMap();
    var out = list.slice(0, 200).map(function (u) {
      var __b = u.ifedit && __bm[u.idreg] ? { t: __bm[u.idreg].t, k: __bm[u.idreg].k } : null;
      return {
        topic: u.topic, pic: u.pic, bg: u.bg, ucol: u.ucol, msg: u.msg,
        mscol: u.mscol, co: u.co, power: u.power, ico: u.ico,
        ifedit: u.ifedit, back: u.back, atar: u.atar, s: false, bdg: __b,
      };
    });
    res.set("Cache-Control", "no-store");
    __loginOnlineCache = { t: Date.now(), body: JSON.stringify({ powers: ShowPowers, online: out, count: list.length }) };
    res.end(__loginOnlineCache.body);
  } catch (e) {
    res.end(JSON.stringify({ powers: [], online: [], count: 0 }));
  }
});

/* [UIRETA-BADGES] خريطة الشارات الفعّالة {"#idreg": {t:المسمى, k:النوع, e:ينتهي}} — الكلاينت بياخدها مرة وبعدين بتتبعت بالسوكت (UQ_BADGES) لما تتغير */
app.get("/UQ_BADGES", function (req, res) {
  res.set("Cache-Control", "no-store");
  res.json(uiBadgeMap());
});

/* [SHARK-HOST] صفحة الباقات والأسعار (الرابط من سطر الحقوق أسفل صفحات اللوجين) */
app.get("/plans", function (req, res) {
  res.sendFile(path.join(__dirname, "public", "plans.html"));
});

app.get("/uh", function (req, res) {
  UsersRepo.getBy({ state: "getByToken", token: req.query["token"] }).then(
    (user) => {
      if (user) {
        if (GetPower(user["power"])["history"]) {
          if (UserInfo[req.query["u2"]]) {
            NamesRepo.getBy({
              state: "getByIp",
              ip: UserInfo[req.query["u2"]]["ip"],
            }).then((dev) => {
              if (dev.length > 0) {
                res.send(dev);
              }
            });
          }
        }
      }
    }
  );
});

/* [ADDED] تغيير صفحة اللوجين: ملف علم صغير لكل دومين (موجود = الشكل الجديد، مش موجود = الافتراضي) */
function loginStyleFile(host) {
  return "uploads/loginstyle_" + String(host || "").replace(/[^a-zA-Z0-9.\-]/g, "_") + ".txt";
}
function isNewLogin(host) {
  try {
    return fs.readFileSync(loginStyleFile(host), "utf8").trim() === "1";
  } catch (e) {
    return false;
  }
}
function setNewLogin(host, on) {
  try {
    try { fs.mkdirSync("uploads", { recursive: true }); } catch (e0) {}
    if (on) fs.writeFileSync(loginStyleFile(host), "1");
    else if (fs.existsSync(loginStyleFile(host))) fs.unlinkSync(loginStyleFile(host));
  } catch (e) {
    console.log("loginstyle error", e && e.message);
  }
}

/* [ADDED] تغيير الشريط العلوي والسفلي: ملف علم صغير لكل دومين (موجود = الشكل الجديد، مش موجود = الشكل القديم) */
function barsStyleFile(host) {
  return "uploads/barstyle_" + String(host || "").replace(/[^a-zA-Z0-9.\-]/g, "_") + ".txt";
}
function isNewBars(host) {
  try {
    return fs.readFileSync(barsStyleFile(host), "utf8").trim() === "1";
  } catch (e) {
    return false;
  }
}
function setNewBars(host, on) {
  try {
    try { fs.mkdirSync("uploads", { recursive: true }); } catch (e0) {}
    if (on) fs.writeFileSync(barsStyleFile(host), "1");
    else if (fs.existsSync(barsStyleFile(host))) fs.unlinkSync(barsStyleFile(host));
  } catch (e) {
    console.log("barstyle error", e && e.message);
  }
}

/* [ADDED] Uireta.1.0: واجهة لوجين بديلة — ملف علم صغير لكل دومين (موجود = Uireta شغّال، مش موجود = الوضع العادي أو Nopta) */
function uiretaFile(host) {
  return "uploads/uireta_" + String(host || "").replace(/[^a-zA-Z0-9.\-]/g, "_") + ".txt";
}
function isUireta(host) {
  try {
    return fs.readFileSync(uiretaFile(host), "utf8").trim() === "1";
  } catch (e) {
    return false;
  }
}
function setUireta(host, on) {
  try {
    try { fs.mkdirSync("uploads", { recursive: true }); } catch (e0) {}
    if (on) fs.writeFileSync(uiretaFile(host), "1");
    else if (fs.existsSync(uiretaFile(host))) fs.unlinkSync(uiretaFile(host));
  } catch (e) {
    console.log("uireta error", e && e.message);
  }
}

app.get("/", function (req, res) {
  res.set("Cache-Control", "no-store"); /* [ADDED] عشان تغيير الإصدار يظهر فوراً */
  const listdomine = Config["ListDomin"].findIndex((x) => x == req.hostname);
  if (listdomine != -1) {
    SettingRepo.getBy({ state: "getByID", id: 1 }).then((getSettings) => {
      SettingRepo.getBy({ state: "getByHost", hostname: req.hostname }).then(
        (getSe) => {
          if (getSettings && getSe) {
            SiteSetting = getSettings;
            fs.readFile("uploads/" + getSe["script"], function (err, f) {
              if (f) {
                var array = f.toString().split("\n");
                array = JSON.parse(array);
                res.render("index", {
                  title: array["title"] || "",
                  logo: "/site/" + getSe["logo"],
                  banner: "/site/" + getSe["banner"],
                  online: filteredArray(OnlineUser, "s", false).length,
                  host: req.hostname,
                  namehost: Config["hostnm"],
                  colors: {
                    hicolor: array["background"],
                    bgcolor: array["bg"],
                    btcolor: array["buttons"],
                  },
                  ifbanner: getSe["isbanner"],
                  newlogin: isNewLogin(req.hostname) && !isUireta(req.hostname), /* [ADDED] Uireta بياخد مكان لوجين Nopta لما يتفعّل */
                  uireta: isUireta(req.hostname), /* [ADDED] Uireta.1.0 */
                  loginbanner: loginBannerUrl(req.hostname), /* [ADDED] */
                  defaultcover: defaultCoverUrl(req.hostname), /* [ADDED] غلاف الوضع الافتراضي */
                  bannerv: domainBannerVersion(req.hostname), /* [ADDED] رقم نسخة بنر الدومين (يكسر كاش المتصفح بعد التغيير) */
                  domainbanner: domainBannerUrl(req.hostname), /* [FIX-BANNER] بنر الدومين المخصّص لكل تصاميم اللوجين */
                  uiticker: uiTickerFor(req.hostname), /* [UIRETA-BADGES] نص الشريط المتحرك في لوجين Uireta لهذا الدومين */
                  micv: micVersion(req.hostname), /* [ADDED] */
                  newbars: isNewBars(req.hostname), /* [ADDED] */
                  script: String(array["settscr"]),
                  description: array["settdescription"] || "",
                  keywords: array["settkeywords"] || "",
                  istite: array["name"] || "",
                });
              } else {
                res.set("Content-Type", "text/html");
                res.write(
                  "<center><h1 style='color:#ff0000'>الموقع غير متاح </h1></center>"
                );
                res.end();
              }
            });
          } else {
            fs.writeFile(
              "uploads/" + req.hostname + ".txt",
              JSON.stringify({
                bg: "6e7b8c",
                buttons: "6e7b8c",
                background: "FFFFFF",
                name: "",
                settdescription: "",
                settscr: "",
                settkeywords: "",
              }),
              function (err) {
                if (err) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "حدث حطأ الرجاء المحاولة في وقت لاحق",
                    user: "",
                  });
                  return;
                }
              }
            );
            SettingRepo.create({
              hostname: req.hostname,
              room: "3ihxjl18it",
              logo: req.hostname + "logo.png",
              roompic: req.hostname + "room.png",
              site: req.hostname + "site.png",
              user: req.hostname + "user.png",
            }).then((created) => {
              if (created) {
                process.exit(1);
              }
            });
          }
        }
      );
    });
  } else {
    res.set("Content-Type", "text/html");
    res.write(
      "<center><h1 style='color:#ff0000'>الموقع غير متاح </h1></center>"
    );
    res.end();
  }
});
String.prototype.replaceAll = function (str1, str2, ignore) {
  return this.replace(
    new RegExp(
      str1.replace(
        /([\/\,\!\\\^\$\{\}\[\]\(\)\.\.{0,3}$*\+\?\|\<\>\-\&])/g,
        "\\$&"
      ),
      ignore ? "gi" : "g"
    ),
    typeof str2 == "string" ? str2.replace(/\$/g, "$$$$") : str2
  );
};
function DatabaseDump(data) {
  mysqlDump({
    connection: {
      host: Config.HostDB,
      user: Config.UserDB,
      password: Config.PassDB,
      database: Config.DBDB,
    },
    dumpToFile: data,
  });
}

function BackUpDataBase() {
  if (
    !fs.existsSync(
      "database/database" +
        new Date().toLocaleDateString().replaceAll("/", "-") +
        ".sql"
    )
  ) {
    DatabaseDump(
      "database/database" +
        new Date().toLocaleDateString().replaceAll("/", "-") +
        ".sql"
    );
  }
}
function stringGen(len) {
  /* [FIX-S03] التوكنات كانت تُبنى بـ Math.random() (قابلة للتنبؤ).
     الآن: crypto.randomBytes — عشوائية تشفيرية بنفس الطول والحقلة (a-z0-9) */
  if (!Number.isFinite(len) || len <= 0 || len > 4096) len = 32;
  var charset = "abcdefghijklmnopqrstuvwxyz0123456789";
  var bytes = crypto.randomBytes(len);
  var text = "";
  for (var i = 0; i < len; i++)
    text += charset.charAt(bytes[i] % charset.length);
  return text;
}
/* [FIX-XSS] الفلتر القديم كان يهرب < فقط. هذه الدالة تهرب أيضاً > وعلامتي
   الاقتباس (حماية من الحقن داخل خصائص HTML) مع الحفاظ على توافق &#x3C;
   القديم المخزّن في قاعدة البيانات */
function EscHTML(v) {
  return String(v == null ? "" : v)
    .split("<")
    .join("&#x3C;")
    .split(">")
    .join("&#x3E;")
    .split('"')
    .join("&quot;");
}
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}
function filteredArray(arr, key, value) {
  const newArray = [];
  for (i = 0, l = arr.length; i < l; i++) {
    if (!arr[i][key]) {
      newArray.push(arr[i]);
    }
  }
  return newArray;
}
function ValidateIPaddress(ipaddress) {
  if (
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
      ipaddress
    )
  ) {
    return true;
  }
  return false;
}

function randomNumber(minimum, maximum) {
  return Math.round(Math.random() * (maximum - minimum) + minimum);
}
function addDays(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).getTime().toFixed();
}

/* [FIX-P05] كانت الفترة بين التنظيفات = TimeOffline ساعات (400 ساعة ≈ 16 يوم!) فكان
   المندمجون يبقون في القائمة أياماً. الآن: فحص كل 5 دقائق، والمدة الفعلية تُقرأ من
   offdate المحدد عند الخروج (Config.TimeOffline ساعات كما في التعليق) */
setInterval(function () {
  var __now = Date.now();
  if (OnlineUser.length > 0) {
    const isoffline = OnlineUser.filter(function (item) {
      if (item.stat != 3) return false;
      /* [FIX-PIN] عضو حالته "غير متصل" وما عندوش offdate = لسه في فترة السماح لإعادة الاتصال (oflineuser) —
         مؤقّت الخروج هو اللي بيقرر مصيره، فما نمسحوش هنا. شبكة أمان: لو فضل كده أكتر من 6 ساعات نمسحه. */
      if (!item.offdate) {
        if (!item.__offAt) { item.__offAt = __now; return false; }
        return __now - item.__offAt > 6 * 60 * 60 * 1000;
      }
      return Number(item.offdate) <= __now;
    });
    if (isoffline.length > 0) {
      for (var i = 0; i < isoffline.length; i++) {
          io.emit("SEND_EVENT_EMIT_SERVER", {
            cmd: "ur",
            data: [isoffline[i]["id"], null],
          });
          io.emit("SEND_EVENT_EMIT_SERVER", {
            cmd: "u-",
            data: isoffline[i]["id"],
          });
          OnlineUser.splice(
            OnlineUser.findIndex((v) => v.id == isoffline[i]["id"]),
            1
          );
          delete UserInfo[isoffline[i]["id"]];
        }
    }
  }
}, 5 * 60 * 1000); /* [FIX-P05] كل 5 دقائق بدل كل TimeOffline ساعة */
function IsBand(data) {
  if (data) {
    const isbands = ListBand.findIndex(
      (x) => x.device && data.includes(x.device)
    );
    if (isbands != -1) {
      return ListBand[isbands]["device"];
    } else {
      return false;
    }
  }
}

function RefreshBand() {
  BandRepo.getBy({ state: "getAll", limit: 1000 }).then((res) => {
    if (res) {
      ListBand = res;
    }
  });
}

function MessagesList(data) {
  if (typeof data == "object") {
    if (data["state"] == "LogsMsg") {
      if (
        GetPower(UserInfo[data["id"]]["power"])["stealth"] &&
        UserInfo[data["id"]]["stealth"]
      ) {
      } else {
        if (data["idroom"]) {
          io.to(data["idroom"]).emit("SEND_EVENT_EMIT_SERVER", {
            cmd: "msg",
            data: {
              bg: data["bg"],
              class: data["class"],
              id: data["id"],
              topic: data["topic"],
              msg: data["msg"],
              roomid: data["idroom"],
              pic: data["pic"],
              uid: data["id"],
            },
          });
        }
      }
    }
  }
}
function RoomMediaLink(link) {
  if (typeof link != "string") return "";
  /* ملصقات الموقع الجاهزة (public/stickers) — لازم الملف يكون موجود فعلاً */
  if (/^\/stickers\/s\/\d{2}\.webp$/.test(link) && fs.existsSync(__dirname + "/public" + link)) return link;
  return /^\/sendfile\/\d+\.(jpe?g|png|gif|webp|mp4|mov|webm|ogv|avi|mpe?g|mpa|3gp2?)$/i.test(link) ? link : "";
}
function NoTa5(data) {
  if (
    data.includes("load") ||
    data.includes("socket") ||
    data.includes("èmit") ||
    data.includes("console") ||
    data.includes("localStorage") ||
    data.includes(">") ||
    data.includes("<")

  ) {
    return true;
  } else {
    return false;
  }
}

/* [FIX-P01] كانت كل دالة Refresh تقرأ الجدول كاملاً وتبثّه لكل المتصلين (io.emit
   مزدوج: SEND_EVENT_EMIT_SERVER + seoo) عند كل تسجيل دخول — 5 جداول × 2 بث × N متصل.
   الآن: (1) بث فردي للمتصل الجديد فقط  (2) بث عام فقط إذا تغيّرت البيانات فعلاً */
var __sigEmo = null, __sigDro3 = null, __sigSico = null, __sigAtar = null, __sigBack = null;

function RefreshEmo(target) {
  EmoRepo.getAll().then((res) => {
    if (!res) return;
    var s = JSON.stringify(res);
    if (target) {
      target.emit("SEND_EVENT_EMIT_SERVER", { cmd: "emos", data: res });
    } else if (__sigEmo !== s) {
      io.emit("SEND_EVENT_EMIT_SERVER", { cmd: "emos", data: res });
    }
    __sigEmo = s;
  });
}

function RefreshDro3(target) {
  Dro3Repo.getAll().then((res) => {
    if (!res) return;
    var s = JSON.stringify(res);
    if (target) {
      target.emit("SEND_EVENT_EMIT_SERVER", { cmd: "dro3", data: res });
      target.emit("seoo", { cmd: "dro3", data: res });
    } else if (__sigDro3 !== s) {
      io.emit("SEND_EVENT_EMIT_SERVER", { cmd: "dro3", data: res });
      io.emit("seoo", { cmd: "dro3", data: res });
    }
    __sigDro3 = s;
  });
}

function RefreshSico(target) {
  SicoRepo.getAll().then((res) => {
    if (!res) return;
    var s = JSON.stringify(res);
    if (target) {
      target.emit("SEND_EVENT_EMIT_SERVER", { cmd: "sicos", data: res });
      target.emit("seoo", { cmd: "sico", data: res });
    } else if (__sigSico !== s) {
      io.emit("SEND_EVENT_EMIT_SERVER", { cmd: "sicos", data: res });
      io.emit("seoo", { cmd: "sico", data: res });
    }
    __sigSico = s;
  });
}
function RefreshAtar(target) {
  AtarRepo.getAll().then((res) => {
    if (!res) return;
    var s = JSON.stringify(res);
    if (target) {
      target.emit("SEND_EVENT_EMIT_SERVER", { cmd: "atar", data: res });
      target.emit("seoo", { cmd: "atar", data: res });
    } else if (__sigAtar !== s) {
      io.emit("SEND_EVENT_EMIT_SERVER", { cmd: "atar", data: res });
      io.emit("seoo", { cmd: "atar", data: res });
    }
    __sigAtar = s;
  });
}
function RefreshBack(target) {
  BackRepo.getAll().then((res) => {
    if (!res) return;
    var s = JSON.stringify(res);
    if (target) {
      target.emit("seoo", { cmd: "back", data: res });
      target.emit("SEND_EVENT_EMIT_SERVER", { cmd: "back", data: res });
    } else if (__sigBack !== s) {
      io.emit("seoo", { cmd: "back", data: res });
      io.emit("SEND_EVENT_EMIT_SERVER", { cmd: "back", data: res });
    }
    __sigBack = s;
  });
}
function botauto() {
 
  BotsRepo.createTable().then((table) => {
      if (table) {
              BotsRepo.getByauto(1).then((wlc) => {
                  if (wlc.length > 0) {
                    botsauto = wlc;
                          for (let index = 0; index < wlc.length; index++) {
                              loginbot(wlc[index]);
                           
 
                          }
                  };
              });
      };
  });
  
};
function outbot(_0x6e714) {
  setTimeout(() => {
    const _0x5c9db6 = OnlineUser.findIndex(
      (_0x43bcc5) => _0x43bcc5.id == _0x6e714.id
    )
    if (_0x5c9db6 == -1) {
    } else {
      UserDisconnect({
        id: _0x6e714.id,
        state: 2,
      })
      loginbot(_0x6e714)
    }
  }, 60000 * _0x6e714.timestop)
}
function EnterBoot(_0x119234) {
  if (_0x119234) {
    UserInfo[_0x119234.id] = {
      ucol: _0x119234.ucol,
      mcol: _0x119234.mcol,
      mscol: _0x119234.mscol,
      atar: _0x119234.atar,
      back: _0x119234.back,
      ifedit: _0x119234.ifedit,
      offline: false,
      offdate: null,
      ismsg: false,
      kiked: false,
      bar: false,
      iscall: null,
      logout: false,
      islogin: _0x119234.islogin,
      bg: _0x119234.bg,
      copic: _0x119234.copic,
      rep: _0x119234.rep,
      ico: _0x119234.ico,
      evaluation: _0x119234.eva,
      username: _0x119234.username,
      islike: _0x119234.islike,
      discard: [],
      power: _0x119234.power,
      idreg: _0x119234.idreg,
      topic: _0x119234.topic,
      country: _0x119234.country,
      ip: _0x119234.ip,
      id: _0x119234.id,
      uid: _0x119234.uid,
      lid: _0x119234.lid,
      busy: false,
      ismuted: _0x119234.ismuted,
      ismutedbc: _0x119234.ismutedbc,
      stealth: _0x119234.stealth,
      device: _0x119234.device,
      pic: _0x119234.pic,
      idroom: _0x119234.idroom,
    }
    var _0x1801ee = ListEnter.findIndex(
      (_0x163ec9) => _0x163ec9 == _0x119234.id
    )
    _0x1801ee == -1 && ListEnter.push(_0x119234.id)
    const _0x1f3656 = OnlineUser.findIndex(
      (_0xc3c633) => _0xc3c633.lid == _0x119234.lid
    )
    _0x1f3656 == -1 &&
      (OnlineUser.push({
        bg: _0x119234.bg,
        copic: _0x119234.copic,
        co: _0x119234.country,
        evaluation: _0x119234.eva,
        ico: _0x119234.ico,
        id: _0x119234.id,
        idreg: _0x119234.idreg,
        lid: _0x119234.lid,
        meiut: _0x119234.ismuted,
        meiutbc: _0x119234.ismutedbc,
        mcol: _0x119234.mcol,
        mscol: _0x119234.mscol,
        atar: _0x119234.atar,
        back: _0x119234.back,
        ifedit: _0x119234.ifedit,
        msg: _0x119234.msg.split('<').join('&#x3C;'),
        istolk: false,
        power: _0x119234.power,
        rep: _0x119234.rep,
        islogin: _0x119234.islogin,
        pic: _0x119234.pic,
        youtube: _0x119234.youtube,
        roomid: _0x119234.idroom,
        time:
          _0x119234.islogin == 'بوت'
            ? null
            : socket.request['_query'].dtoday
            ? socket.request['_query'].dtoday
            : null,
        stat: _0x119234.stat,
        s: GetPower(_0x119234.power).stealth && _0x119234.stealth ? true : null,
        topic: _0x119234.topic.split('<').join('&#x3C;'),
        ucol: _0x119234.ucol,
      }),
      io.emit('SEND_EVENT_EMIT_SERVER', {
        cmd: 'u+',
        data: {
          bg: _0x119234.bg,
          copic: _0x119234.copic,
          co: _0x119234.country,
          evaluation: _0x119234.eva,
          ico: _0x119234.ico || '',
          id: _0x119234.id,
          idreg: _0x119234.idreg,
          lid: _0x119234.lid,
          time:
            _0x119234.islogin == 'بوت'
              ? null
              : socket.request['_query'].dtoday
              ? socket.request['_query'].dtoday
              : null,
          istolk: false,
          mcol: _0x119234.mcol,
          mscol: _0x119234.mscol,
          atar: _0x119234.atar,
          back: _0x119234.back || '',
          ifedit: _0x119234.ifedit,
          msg: _0x119234.msg.split('<').join('&#x3C;'),
          meiut: _0x119234.ismuted,
          meiutbc: _0x119234.ismutedbc,
          power: _0x119234.power,
          rep: _0x119234.rep,
          pic: _0x119234.pic,
          roomid: _0x119234.idroom,
          stat: _0x119234.stat,
          s:
            GetPower(_0x119234.power).stealth && _0x119234.stealth
              ? true
              : null,
          topic: _0x119234.topic.split('<').join('&#x3C;'),
          ucol: _0x119234.ucol,
        },
      }))
    const _0x4450fb = RoomsList.findIndex(
      (_0x27602e) => _0x27602e.id == _0x119234.idroom
    )
    _0x4450fb != -1 &&
      io.to(_0x119234.idroom).emit('SEND_EVENT_EMIT_SERVER', {
        cmd: 'msg',
        data: {
          bg: 'none',
          class: 'hmsg',
          topic: UserInfo[_0x119234.id].topic,
          msg:
            'هذا المستخدم قد دخل<div class="fl fa fa-sign-in btn btn-primary dots roomh border corner" style="padding:1px;max-width:180px;min-width:60px;" onclick="Send_Rjoin(\'' +
            GetRoomList(_0x119234.idroom).id +
            '\')">' +
            GetRoomList(_0x119234.idroom).topic +
            '</div>',
          roomid: _0x119234.idroom,
          pic: UserInfo[_0x119234.id].pic,
          uid: _0x119234.id,
        },
      })
    io.emit('SEND_EVENT_EMIT_SERVER', {
      cmd: 'ur',
      data: [_0x119234.id, _0x119234.idroom],
    })
  }
}

/* ===== تنقل البوتات بين الغرف: يقعد مدة (دقائق) ثم ينتقل لغرفة عشوائية وهكذا ===== */
var BotNextMove = {};
function BotMoveRoom(id, roomId) {
  const u = UserInfo[id];
  const room = GetRoomList(roomId);
  if (!u || !room) return;
  const oldRoom = u.idroom;
  const btn = (r) =>
    '<div class="fl fa fa-sign-in btn btn-primary dots roomh border corner" style="padding:1px;max-width:180px;min-width:60px;" onclick="Send_Rjoin(\'' +
    r["id"] +
    "')\">" +
    r["topic"] +
    "</div>";
  /* رسالة "انتقل الى" في الغرفة القديمة (زي المستخدم العادي) */
  if (oldRoom && oldRoom != roomId && GetRoomList(oldRoom)) {
    io.to(oldRoom).emit("SEND_EVENT_EMIT_SERVER", {
      cmd: "msg",
      data: {
        bg: "none",
        copic: "none",
        class: "hmsg",
        id: id,
        topic: u.topic,
        msg: "هذا المستخدم انتقل الى" + btn(room),
        roomid: oldRoom,
        pic: u.pic,
        uid: id,
      },
    });
  }
  u.idroom = roomId;
  const oi = OnlineUser.findIndex((x) => x.id == id);
  if (oi != -1) OnlineUser[oi]["roomid"] = roomId;
  io.to(roomId).emit("SEND_EVENT_EMIT_SERVER", {
    cmd: "msg",
    data: {
      bg: "none",
      copic: "none",
      class: "hmsg",
      id: id,
      topic: u.topic,
      msg:
        "هذا المستخدم قد دخل الغرفة" +
        '<div class="fl fa fa-sign-in btn btn-primary dots roomh border corner" style="padding:1px;max-width:180px;min-width:60px;" onclick="Send_Rjoin(\'' +
        room["id"] +
        "')\">" +
        room["topic"] +
        "</div>",
      roomid: roomId,
      pic: u.pic,
      uid: id,
    },
  });
  io.emit("SEND_EVENT_EMIT_SERVER", { cmd: "ur", data: [id, roomId] });
}
setInterval(function () {
  BotsRepo.getall()
    .then((rows) => {
      const now = Date.now();
      (rows || []).forEach((b) => {
        const m = parseInt(b["stay"]) || 0;
        const online =
          UserInfo[b["id"]] &&
          OnlineUser.findIndex((x) => x.id == b["id"]) != -1;
        if (!online || m <= 0) {
          delete BotNextMove[b["id"]];
          return;
        }
        if (!BotNextMove[b["id"]]) {
          BotNextMove[b["id"]] = now + m * 60000;
          return;
        }
        if (now >= BotNextMove[b["id"]]) {
          const cur = UserInfo[b["id"]]["idroom"];
          const cands = RoomsList.filter((r) => r.id != cur && !r.needpass);
          if (cands.length) {
            BotMoveRoom(b["id"], cands[Math.floor(Math.random() * cands.length)].id);
          }
          BotNextMove[b["id"]] = now + m * 60000;
        }
      });
    })
    .catch(() => {});
}, 10000);

/* بيانات دخول البوت من صف قاعدة البيانات (مستخدمة في إدخال كل البوتات) */
function botEnterObj(login) {
  const esc = (v) => String(v == null ? "" : v).split("<").join("&#x3C;");
  return {
    power: login["power"],
    eva: 0,
    stat: login["stat"],
    loginG: false,
    islogin: "بوت",
    refr: "*",
    username: esc(login["topic"]),
    ucol: esc(login["ucol"]),
    mcol: "#000000",
    mscol: esc(login["mcol"]),
    bg: esc(login["bg"]),
    rep: login["likebot"],
    ico: "",
    islike: [],
    idreg: "#" + getRandomInt(1, 100),
    topic: esc(login["topic"]),
    country: login["country"] || "tn",
    ip: login["ip"],
    lid: stringGen(31),
    uid: "",
    token: stringGen(177),
    id: login["id"],
    islog: false,
    ismuted: false,
    ismutedbc: false,
    verification: false,
    device: "BOTS_HOST_BY_MOBAIL_HOST",
    pic: login["pic"],
    idroom: login["room"],
    youtube: "",
    msg: esc(login["msg"]),
    stealth: false,
  };
}

function loginbot(_0xf35a4c) {
  setTimeout(() => {
    const _0x16c22d = botsauto.findIndex(
      (_0x1a1292) => _0x1a1292.id == _0xf35a4c.id
    )
    if (_0x16c22d == -1) {
      return
    }
    const _0x3eb34d = OnlineUser.findIndex((_0x3b64ad) => _0x3b64ad.id == _0xf35a4c.id)
    _0x3eb34d == -1 &&
      (outbot(_0xf35a4c),
      EnterBoot({
        power: _0xf35a4c.power,
        eva: 0,
        stat: _0xf35a4c.stat,
        loginG: false,
        islogin: 'بوت',
        refr: '*',
        username: _0xf35a4c.topic.split('<').join('&#x3C;'),
        ucol: _0xf35a4c.ucol.split('<').join('&#x3C;'),
        mcol: '#000000',
        mscol: _0xf35a4c.mcol.split('<').join('&#x3C;'),
        bg: _0xf35a4c.bg.split('<').join('&#x3C;'),
        rep: _0xf35a4c.likebot,
        ico: '',
        islike: [],
        idreg: '#' + getRandomInt(1, 100),
        topic: _0xf35a4c.topic.split('<').join('&#x3C;'),
        country: _0xf35a4c.country || 'tn',
        ip: _0xf35a4c.ip,
        lid: stringGen(31),
        uid: '',
        token: stringGen(177),
        id: _0xf35a4c.id,
        islog: false,
        ismuted: false,
        ismutedbc: false,
        verification: false,
        device: 'BOT',
        pic: _0xf35a4c.pic,
        idroom: _0xf35a4c.room,
        youtube: _0xf35a4c.youtube,
        msg: _0xf35a4c.msg.split('<').join('&#x3C;'),
        stealth: false,
      }))
  }, 60000 * _0xf35a4c.timestart)
}

function MessageDay() {
  setTimeout(function () {
    IntroRepo.getBy({ state: "getIn", category: "d" }).then((wlc) => {
      if (wlc.length > 0) {
        const rdm = getRandomInt(0, wlc.length - 1);
        io.emit("SEND_EVENT_EMIT_SERVER", {
          cmd: "msg",
          data: {
            bg: "",
            class: "pmsgc",
            topic: wlc[rdm]["adresse"].split("<").join("&#x3C;") || "",
            msg: wlc[rdm]["msg"].split("<").join("&#x3C;") || "",
            ucol: "red",
            mcol: "#000000",
            pic: "/site/msgpic.png",
            uid: "",
          },
        });
      }
    });
    MessageDay();
  }, 60000 * SiteSetting["maxdaymsg"] || 1);
}

function RefreshRoom() {
  RoomsRepo.getBy({ state: "getAllWith" }).then((rooms) => {
    if (rooms) {
      RoomsListWith = rooms;
    }
  });
}

/* [FIX-OPT2] قائمة الاختصارات للعميل: يطبّقها لحظيًا على رسالته (نفس منطق ReplaceEktisar)
   فلا يرى العضو النص يتغير بعد وصول رد السيرفر. السيرفر يظل المرجع النهائي. */
function __ektiPayload() {
  return {
    a: ekti1,
    b: ekti2,
    n: Config.MaxEktisar,
    l: SiteSetting && SiteSetting["lengthroom"],
  };
}
function RefreshEktisar() {
  CutsRepo.getAll().then((res) => {
    if (res) {
      ekti1 = [];
      ekti2 = [];
      for (var i = 0; i < res.length; i++) {
        ekti1.push(res[i]["msg"]);
        ekti2.push(res[i]["reponse"]);
      }
      /* [FIX-OPT2] تغيّر الاختصارات (إضافة/حذف من لوحة التحكم): حدّث كل المتصلين */
      try {
        io.emit("SEND_EVENT_EMIT_SERVER", { cmd: "ekti", data: __ektiPayload() });
      } catch (e) {}
    }
  });
}

/* [ADDED] تحسين سرعة الرسائل: الـ RegExp بتتبني مرة واحدة بدل كل رسالة */
var _ektiRx = [];
var _ektiSrc = null;
function _buildEktiRx() {
  _ektiSrc = ekti1;
  _ektiRx = [];
  for (var k = 0; k < ekti1.length; k++) {
    try {
      _ektiRx.push(new RegExp("(^| )" + ekti1[k] + "( |$|\n)"));
    } catch (e) {
      _ektiRx.push(null);
    }
  }
}
/* [FIX-OPT] ذاكرة قصيرة العمر لمعرّفات الرسائل (cid) المُرسلة من الكلاينت:
   تمنع تكرار الرسالة لو أعاد المستخدم الإرسال بعد انقطاع (وصلت للسيرفر لكن ضاع الرد).
   لا تغيّر أي بروتوكول: الحقل cid اختياري، والعميل القديم لا يرسله فيعمل كما كان. */
const __msgCidCache = new Map();
setInterval(function () {
  const now = Date.now();
  for (const [k, v] of __msgCidCache) {
    if (now - v.t > 120000) __msgCidCache.delete(k);
  }
  while (__msgCidCache.size > 20000) {
    __msgCidCache.delete(__msgCidCache.keys().next().value);
  }
}, 60000).unref();

function ReplaceEktisar(data) {
  var blocked = false, allowed = false;
  for (var f = 0; f < NoMsgFilter.length; f++) {
    var nf = NoMsgFilter[f];
    if (data.includes(nf.v)) {
      if (nf.path == "bmsgs") blocked = true;
      else if (nf.path == "amsgs") allowed = true;
    }
  }
  if (blocked && !allowed) {
    return;
  }
  if (data) {
    if (_ektiSrc !== ekti1) {
      _buildEktiRx();
    }
    if (_ektiRx.length) {
      for (var k = 0; k < Config.MaxEktisar; k++) {
        for (var j = 0; j < _ektiRx.length; j++) {
          if (_ektiRx[j]) {
            data = data.replace(_ektiRx[j], " " + ekti2[j] + " ");
          }
        }
      }
    }
    return data.split("<").join("&#x3C;");
  }
}

function GetPower(data) {

  if (typeof data == "string") {
    const power = ShowPowers.findIndex((x) => x.name == data);
    if (power != -1) {
    
      return ShowPowers[power];
    } else {
      return Config.PowerNon;
    }
  }
}
function GetPower2(data) {
  const seo = OnlineUser.findIndex((x)=> x.id == data.id);
if(OnlineUser[seo].stat != 3){
  if (typeof data.power == "string") {
    const power = ShowPowers.findIndex((x) => x.name == data.power);
    if (power != -1) {
      return ShowPowers[power];
    } else {
      return Config.PowerNon;
    }
  }
}else{
  return Config.PowerNon;
}

}
function GetRoomList(data) {
  if (typeof data == "string") {
    const room = RoomsList.findIndex((x) => x.id == data);
    if (room != -1) {
      return RoomsList[room];
    } else {
      return RoomsList[0];
    }
  }
}

/* ===================== [WAITROOM] غرفة الانتظار ===================== */
function WaitRoomExists(id) {
  return !!id && RoomsList.findIndex((x) => x.id == id) != -1;
}
function WaitNotify(sid, msg) {
  io.to(sid).emit("SEND_EVENT_EMIT_SERVER", {
    cmd: "not",
    data: { topic: "", force: 1, msg: msg, user: "" },
  });
}
/* هل المستخدم معفي (صلاحية/رتبة)؟ */
function WaitIsStaff(u) {
  if (!u) return false;
  if (u["power"] == "Hide") return true;
  return (GetPower(u["power"] || "")["rank"] || 0) > 0;
}
/* هل المستخدم موجود حالياً في غرفة الانتظار (وغير معفي)؟ */
function WaitInRoom(u) {
  const S = WaitRoom.get();
  return !!(S.enabled && S.roomId && u && u["idroom"] == S.roomId && !WaitIsStaff(u));
}
/* بيحدد الغرفة عند الدخول: غرفة الانتظار أو الغرفة الافتراضية def */
function WaitPick(def, info) {
  try {
    const S = WaitRoom.get();
    if (!S.enabled || !WaitRoomExists(S.roomId)) return def;
    info["rank"] = info["power"] == "Hide" ? 99999 : GetPower(info["power"] || "")["rank"] || 0;
    return WaitRoom.shouldWait(info) ? S.roomId : def;
  } catch (e) {
    return def;
  }
}
/* خصائص تصميم العضوية محجوبة؟ (عضو جديد + أقل من حد الخصائص + عنده ifedit) */
function WaitFeat(login) {
  try {
    if (!login || !login["ifedit"]) return false;
    return WaitRoom.featuresBlocked({
      member: true,
      rep: login["rep"],
      rank: login["power"] == "Hide" ? 99999 : GetPower(login["power"] || "")["rank"] || 0,
      joinuser: login["joinuser"],
    });
  } catch (e) {
    return false;
  }
}
/* نقل مستخدم من غرفة الانتظار للغرفة العامة */
function WaitMoveToPublic(sid, force) {
  const u = UserInfo[sid];
  if (!u) return false;
  const target = SiteSetting["room"];
  if (!WaitRoomExists(target) || target == u["idroom"]) return false;
  const tr = GetRoomList(target);
  if (!force && tr["max"] && OnlineUser.filter((a) => a.roomid == target).length >= tr["max"]) return false;
  const old = u["idroom"];
  const sock = io.sockets.sockets.get(sid);
  if (sock) {
    if (old) sock.leave(old);
    sock.join(target);
  }
  u["idroom"] = target;
  const ix = OnlineUser.findIndex((x) => x.id == sid);
  if (ix != -1) OnlineUser[ix]["roomid"] = target;
  io.emit("SEND_EVENT_EMIT_SERVER", { cmd: "ur", data: [sid, target] });
  if (tr["broadcast"] && sock && PeerRoom[target]) {
    io.to(target).emit("SEND_EVENT_EMIT_BROADCASTING", { cmd: "rjoin", user: sid });
    sock.emit("SEND_EVENT_EMIT_BROADCASTING", { cmd: "all", room: target, data: PeerRoom[target] });
  }
  WaitNotify(sid, "تم نقلك من غرفة الانتظار إلى الغرفة العامة");
  return true;
}
/* بعد ما العضو يستلم لايك: نقل تلقائي + فك قفل الخصائص */
function WaitOnLike(sid) {
  try {
    const S = WaitRoom.get();
    const u = UserInfo[sid];
    if (!S.enabled || !u) return;
    if (S.autoMove && WaitInRoom(u) && u["rep"] >= S.leaveLikes) {
      WaitMoveToPublic(sid, false);
    }
    if (u["_wrFeat"] && u["rep"] >= S.featureLikes) {
      u["_wrFeat"] = false;
      const reg = String(u["idreg"] || "").split("#")[1];
      if (!reg) return;
      UsersRepo.getBy({ state: "getByID", idreg: reg }).then((row) => {
        if (row && row["ifedit"] && UserInfo[sid]) {
          UserInfo[sid]["ifedit"] = row["ifedit"];
          const ox = OnlineUser.findIndex((x) => x.id == sid);
          if (ox != -1) {
            OnlineUser[ox]["ifedit"] = row["ifedit"];
            io.emit("SEND_EVENT_EMIT_SERVER", { cmd: "u^", data: OnlineUser[ox] });
          }
          WaitNotify(sid, "تم فتح خصائص تصميم العضوية لك");
        }
      }).catch(() => {});
    }
  } catch (e) {}
}
/* إنشاء الغرفة لو مش موجودة (غرفة ثابتة deleted:true) */
function WaitEnsureRoom() {
  const S = WaitRoom.get();
  if (WaitRoomExists(S.roomId)) return;
  const ex = RoomsList.find((r) => r.topic == WaitRoom.ROOM_TOPIC);
  if (ex) {
    WaitRoom.setRoomId(ex.id);
    return;
  }
  const id = stringGen(10);
  WaitRoom.setRoomId(id);
  CreateRooms({
    id: id, about: "", user: "", pass: "", color: "#FFFFFF", colorpicroom: "#FFFFFF",
    colormsgroom: "#FFFFFF", baccolor: "#FFFFFF", needpass: false, camera: false,
    broadcast: false, vseats: "", mseats: 6, nohide: false, deleted: true, owner: "",
    rmli: 0, topic: WaitRoom.ROOM_TOPIC, pic: (RoomsList[0] && RoomsList[0]["pic"]) || "",
    backroom: "", welcome: "", max: 1000, has: 1,
  });
}
/* إيقاف الغرفة: نقل كل المنتظرين للعام ثم حذف الغرفة */
function WaitDisable() {
  const rid = WaitRoom.get().roomId;
  if (!rid) return;
  let left = 0;
  Object.keys(UserInfo).forEach((sid) => {
    if (UserInfo[sid] && UserInfo[sid]["idroom"] == rid) {
      if (!WaitMoveToPublic(sid, true)) left++;
    }
  });
  if (left > 0 || !WaitRoomExists(rid)) return; /* لسه فيه ناس: سيب الغرفة */
  RoomsRepo.deleted(rid).then((res) => {
    if (res) {
      io.emit("SEND_EVENT_EMIT_SERVER", { cmd: "r-", data: rid });
      RefreshRooms(1);
      WaitRoom.setRoomId("");
    }
  });
}
/* قايمة المنتظرين للوحة التحكم */
function WaitList() {
  const rid = WaitRoom.get().roomId;
  if (!rid) return [];
  return OnlineUser.filter((o) => o.roomid == rid && !WaitIsStaff(UserInfo[o.id]))
    .map((o) => {
      const u = UserInfo[o.id] || {};
      return {
        id: o.id, topic: o.topic, username: u["username"] || "", idreg: o.idreg,
        rep: o.rep, country: o.co, ip: u["ip"] || "", islogin: o.islogin,
      };
    });
}
/* ===================== [/WAITROOM] ===================== */

function RefreshNoText() {
  NotextRepo.getAll().then((res) => {
    if (res) {
      NoMsgFilter = res;
    }
  });
}

function RefreshRooms(data) {
  RoomsRepo.getBy({ state: "getAll" }).then((rooms) => {
    if (rooms) {
      RoomsList = rooms;
      RefreshRoom();
      if (data == 0) {
        for (var i = 0; i < RoomsList.length; i++) {
          if (!PeerRoom[RoomsList[i]]) {
            PeerRoom[RoomsList[i].id] = {
              1: { id: "", ev: false, us: {}, vid: false },
              2: { id: "", ev: false, us: {}, vid: false },
              3: { id: "", ev: false, us: {}, vid: false },
              4: { id: "", ev: false, us: {}, vid: false },
              5: { id: "", ev: false, us: {}, vid: false },
              6: { id: "", ev: false, us: {}, vid: false },
              7: { id: "", ev: false, us: {}, vid: false },
            };
          }
        }
      }
    }
  });
}

function UserDisconnect(data) {
  if (typeof data == "object") {
    if (ListEnter.length > 0) {
      ListEnter.splice(
        ListEnter.findIndex((v) => v.id == data["id"]),
        1
      );
    }

    var userData = UserInfo[data["id"]];
    if (typeof userData !== "undefined") {
      if (GetPower(userData["power"])["stealth"] && userData["stealth"]) {
      } else {
        if (!userData["ismsg"] && !userData["logout"]) {
          MessagesList({
            state: "LogsMsg",
            bg: userData["bg"],
            copic: userData["copic"],
            class: "hmsg",
            id: userData["id"],
            topic: userData["topic"],
            msg: "( هذا المستخدم قد غادر الدردشه )",
            idroom: userData["idroom"],
            pic: userData["pic"],
          });
        }
      }

      if (
        userData["uid"] &&
        userData["islogin"] == "عضو" &&
        data["state"] != 3
      ) {
        UsersRepo.updateBy({
          state: "updateSeen",
          token: stringGen(177),
          lastssen: new Date().getTime(),
          ip: userData["ip"],
          device: userData["device"],
          uid: userData["uid"],
        });
      }
      if (userData["uid"] && userData["islogin"] == "عضو") {
        UsersRepo.updateBy({
          state: "updateLike",
          evaluation: userData["evaluation"],
          uid: userData["uid"],
        });
        UsersRepo.updateBy({
          state: "updateRep",
          rep: userData["rep"],
          uid: userData["uid"],
        });
      }
      if (userData["iscall"]) {
        io.to(userData["iscall"]).emit("SEND_EVENT_EMIT_SERVER", {
          cmd: "leavecall",
          data: { type: "leave" },
        });
      }
      if (userData["idroom"] && PeerRoom[userData["idroom"]]) {
        if (GetRoomList(userData["idroom"])["broadcast"]) {
          io.to(userData["idroom"]).emit("SEND_EVENT_EMIT_BROADCASTING", {
            cmd: "rleave",
            user: userData["id"],
          });
          for (var i = 1; i < 8; i++) {
            if (PeerRoom[userData["idroom"]][i]["id"] == userData["id"]) {
              PeerRoom[userData["idroom"]][i]["id"] = "";
              PeerRoom[userData["idroom"]][i]["ev"] = false;
              PeerRoom[userData["idroom"]][i]["vid"] = false;
              PeerRoom[userData["idroom"]][i]["us"] = {};
            }
          }
        }
      }
          
                   if (!userData["noredirect"]) { /* [SR-FIX] إعادة دخول نفس الاتصال: لا redirect */
                   io.to(userData["id"]).emit("SEND_EVENT_EMIT_SERVER", {
                    cmd: "redirect", /* [FIX-S01] كانت cmd:ev + eval() على السيرفر = RCE كامل */
                    data: "/",
                  });
                   }

      if (
        SiteSetting["offline"] &&
        userData["uid"] &&
        userData["islogin"] == "عضو" &&
        !userData["s"] &&
        userData["stat"] != 4 &&
        data["state"] != 3 &&
        !userData["ismsg"]
      ) {
        const isoffline = OnlineUser.findIndex((v) => v.id == data["id"]);
        if (isoffline != -1) {
          var dtp = new Date();
          /* [FIX-P05] كانت تُضيف TimeOffline كدقائق (setMinutes + 400 = 6.7 ساعة)
             بينما التعليق والمقصود 20 ساعة — الآن ساعات حقيقية */
          const timeof = dtp.setTime(dtp.getTime() + Config.TimeOffline * 60 * 60 * 1000);
          OnlineUser[isoffline]["stat"] = 3;
          OnlineUser[isoffline]["time"] = null;
          OnlineUser[isoffline]["roomid"] = null;
          /* [FIX-PIN] التنظيف الدوري بيقرأ offdate من OnlineUser مش من UserInfo — فكان التاريخ ما بيتسجّلش
             هنا والعضو المثبّت بيتمسح في أول فحص (كل 5 دقايق). دلوقتي بيتسجّل في المكانين. */
          OnlineUser[isoffline]["offdate"] = timeof;
          userData["idroom"] = null;
          userData["offline"] = true;
          userData["offdate"] = timeof;
          io.emit("SEND_EVENT_EMIT_SERVER", {
            cmd: "u^",
            data: OnlineUser[isoffline],
          });
          io.emit("SEND_EVENT_EMIT_SERVER", {
            cmd: "ur",
            data: [data["id"], null],
          });
        }
      } else {
        const isonlie = OnlineUser.findIndex((v) => v.id == data["id"]);
        if (isonlie != -1) {
          io.emit("SEND_EVENT_EMIT_SERVER", {
            cmd: "ur",
            data: [data["id"], null],
          });
          io.emit("SEND_EVENT_EMIT_SERVER", { cmd: "u-", data: data["id"] });
          OnlineUser.splice(isonlie, 1);
          delete UserInfo[data["id"]];
        }
      }
    }
  }
}

function CreateBars(data) {
  if (typeof data == "object") {
    BarsRepo.create({
      bg: data["bg"],
      copic: data["copic"],
      bid: data["bid"],
      owner: data["owner"],
      mcol: data["mcol"],
      pic: data["pic"],
      msg: data["msg"],
      topic: data["topic"],
      ucol: data["ucol"],
      data: data["data"]
    }).then((res) => {
      if (res) {
        BarsRepo.getBy({ state: "getAll" }).then((savebar) => {
          if (savebar) {
            for (var i = 0; i < savebar.length; i++) {
              if (i > Config.MaxBc) {
                io.emit("SEND_EVENT_EMIT_SERVER", {
                  cmd: "delbc",
                  data: { bid: savebar[0]["bid"] },
                });
                BarsRepo.deleted({
                  state: "deleteByBid",
                  bid: savebar[0]["bid"],
                });
              }
            }
          }
        });
      }
    });
  }
}

function CreateUsers(data) {
  if (typeof data == "object") {
    UsersRepo.create({
      ip: data["ip"],
      device: data["device"],
      id: data["id"],
      lid: data["lid"],
      pic: data["pic"],
      uid: data["uid"],
      verification: data["verification"],
      power: data["power"],
      topic: data["topic"],
      username: data["username"],
      password: data["password"],
      token: data["token"],
      joinuser: new Date().getTime(),
    });
  }
}
/* [ADDED] تنظيف قيمة مقاعد البث: أرقام 1-6 فقط بدون تكرار ومرتبة، مثال "2,5" */
function CleanVseats(v, cnt) {
  if (typeof v != "string") return "";
  cnt = cnt || 6;
  var seen = {}, out = [];
  v.split(",").forEach(function (x) {
    var n = parseInt(x, 10);
    if (n >= 1 && n <= cnt && !seen[n]) { seen[n] = 1; out.push(n); }
  });
  out.sort();
  return out.join(",");
}
/* [ADDED] عدد المقاعد الظاهرة 1-6 (الافتراضي 6) */
function CleanMseats(v) {
  var n = parseInt(v, 10);
  return n >= 1 && n <= 6 ? n : 6;
}
function RoomSeatCount(roomId) {
  try { var r = GetRoomList(roomId); return CleanMseats(r && r["mseats"]); } catch (e) { return 6; }
}
function IsVideoSeat(roomId, seat) {
  try {
    var r = GetRoomList(roomId);
    if (!r || !r["broadcast"] || !r["vseats"]) return false;
    if (parseInt(seat, 10) > CleanMseats(r["mseats"])) return false;
    return ("," + r["vseats"] + ",").indexOf("," + seat + ",") != -1;
  } catch (e) { return false; }
}
function CreateRooms(data) {
  if (typeof data == "object") {
    RoomsRepo.create({
      id: data["id"],
      about: data["about"],
      user: data["user"],
      pass: data["pass"],
      color: data["color"],
      colorpicroom: data["colorpicroom"],
      colormsgroom: data["colormsgroom"],
      baccolor: data["baccolor"],
      needpass: data["needpass"],
      backroom:data['backroom'],
      camera: data["camera"],
      broadcast: data["broadcast"],
      nohide: data["nohide"],
      deleted: data["deleted"],
      owner: data["owner"],
      rmli: data["rmli"] || 0,
      topic: data["topic"],
      pic: data["pic"],
      welcome: data["welcome"],
      max: data["max"],
      has: data["has"],
      
    }).then((doneroom) => {
      if (doneroom) {
        RoomsRepo.updateVseats({ id: data["id"], vseats: CleanVseats(data["vseats"], CleanMseats(data["mseats"])), mseats: CleanMseats(data["mseats"]) }).then(() => {
          RoomsRepo.getBy({ state: "getByID", id: data["id"] }).then((myr) => {
            if (myr) {
              io.emit("SEND_EVENT_EMIT_SERVER", { cmd: "r+", data: myr });
            }
          });
          RefreshRooms(0);
        });
      }
    });
  }
}


function RefreshSB() {
  BsbRepo.getAll().then((res) => {
    if (res.length == 0) {
      BsbRepo.create({
        systems: JSON.stringify(System),
        browsers: JSON.stringify(Browser),
      });
    } else {
      SystemOpen = JSON.parse(res[0]["systems"]);
      BrowserOpen = JSON.parse(res[0]["browsers"]);
    }
  });
}

function StartServer() {
  BackUpDataBase();
  RefreshRooms(0);
  RefreshNoText();
  RefreshEktisar();
  RefreshSB();
  RefreshBand();
  EmoRepo.getAll().then((res) => {
    if (res.length == 0) {
      for (var i = 0; i < getFiles("uploads/emo").length; i++) {
        if (
          getFiles("uploads/emo")[i].includes("gif") ||
          getFiles("uploads/emo")[i].includes("png") ||
          getFiles("uploads/emo")[i].includes("jpg")
        ) {
          EmoRepo.create({
            type: i + 1,
            path: getFiles("uploads/emo")[i].replace("uploads/emo/", ""),
          });
        }
      }
    }
  });

  Dro3Repo.getAll().then((res) => {
    if (res.length == 0) {
      for (var i = 0; i < getFiles("uploads/dro3").length; i++) {
        if (
          getFiles("uploads/dro3")[i].includes("gif") ||
          getFiles("uploads/dro3")[i].includes("png") ||
          getFiles("uploads/dro3")[i].includes("jpg")
        ) {
          Dro3Repo.create({
            path: getFiles("uploads/dro3")[i].replace("uploads/dro3/", ""),
          });
        }
      }
    }
  });

  SicoRepo.getAll().then((res) => {
    if (res.length == 0) {
      for (var i = 0; i < getFiles("uploads/sico").length; i++) {
        if (
          getFiles("uploads/sico")[i].includes("gif") ||
          getFiles("uploads/sico")[i].includes("png") ||
          getFiles("uploads/sico")[i].includes("jpg")
        ) {
          SicoRepo.create({
            path: getFiles("uploads/sico")[i].replace("uploads/sico/", ""),
          });
        }
      }
    }
  });
  AtarRepo.getAll().then((res) => {
    if (res.length == 0) {
      for (var i = 0; i < getFiles("uploads/atar").length; i++) {
        if (
          getFiles("uploads/atar")[i].includes("gif") ||
          getFiles("uploads/atar")[i].includes("png") ||
          getFiles("uploads/atar")[i].includes("jpg")
        ) {
          AtarRepo.create({
            path: getFiles("uploads/atar")[i].replace("uploads/atar/", ""),
          });
        }
      }
    }
  });
  BackRepo.getAll().then((res) => {
    if (res.length == 0) {
      for (var i = 0; i < getFiles("uploads/back").length; i++) {
        if (
          getFiles("uploads/back")[i].includes("gif") ||
          getFiles("uploads/back")[i].includes("png") ||
          getFiles("uploads/back")[i].includes("jpg")
        ) {
          BackRepo.create({
            path: getFiles("uploads/back")[i].replace("uploads/back/", ""),
          });
        }
      }
    }
  });
  NoNamesRepo.getAll().then((res) => {
    if (res.length > 0) {
      for (var i = 0; i < res.length; i++) {
        NoNames.push(res[i]["name"]);
      }
    }
  });

  UsersRepo.getBy({
    state: "getByUsername",
    username: Config.AccountUserName,
  }).then((res) => {
    if (!res) {
      
      CreateUsers({
        pic: "site/pic.png",
        ip: "80.168.120.11",
        device: "",
        id: "",
        lid: stringGen(31),
        uid: stringGen(22),
        verification: true,
        power: "gochat",
        topic: "gochat",
        username: Config.AccountUserName,
        password: passwordHash.generate(Config.AccountPassword),
        token: stringGen(177),
      });
       }
  });

  PowersRepo.getBy({ state: "getAll" }).then((res) => {
    if (res.length > 0) {
      for (var i = 0; i < res.length; i++) {
        ShowPowers.push(JSON.parse(res[i].powers));
      }
    } else {
      ShowPowers = isPowers;
      for (var i = 0; i < isPowers.length; i++) {
        PowersRepo.create({
          name: isPowers[i].name,
          powers: JSON.stringify(isPowers[i]),
        });
      }
    }
  });

  RoomsRepo.getBy({ state: "getByID", id: "3ihxjl18it" }).then((res) => {
    if (!res) {
      CreateRooms({
        id: "3ihxjl18it",
        about: "غرفه عامة",
        user: "gochat",
        pass: "",
        color: "#000000",
        baccolor: "#fff",
        colorpicroom: "#000000",
        colormsgroom: "#fff000",
        needpass: false,
        camera: false,
        broadcast: false,
        nohide: false,
        deleted: true,
        owner: "#1",
        rmli: 0,
        topic: "الغرفة العامة",
        pic: "/site/room.png",
        welcome: "مرحبا بكم في الغرفة العامة",
        max: 40,
        has: 1,
      });
    }
  });
}

function SaveStats(data) {
  if (typeof data == "object") {
    StateRepo.create({
      state: data["state"],
      topic: data["topic"],
      username: data["username"],
      room: data["room"],
      ip: data["ip"],
      time: data["time"],
    });
    StateRepo.getAllBy().then((states) => {
      if (states) {
        for (var i = 0; i < states.length; i++) {
          if (i > Config.MaxState) {
            StateRepo.deleted(states[0]["id"]);
          }
        }
      }
    });
  }
}

function SaveLogs(data) {
  if (typeof data == "object") {
    LogsRepo.getBy({
      state: "chekedBy",
      ip: data["ip"],
      log: data["state"],
      topic: data["topic"],
      username: data["username"],
    }).then(function (res) {
      if (res) {
        LogsRepo.updateById({
          date: data["date"],
          device: data["device"],
          id: res["id"],
        });
      } else {
        LogsRepo.create({
          state: data["state"],
          topic: data["topic"],
          username: data["username"],
          ip: data["ip"],
          country: data["country"],
          device: data["device"],
          isin: data["isin"],
          date: data["date"],
        });
        LogsRepo.getBy({ state: "getAllIn" }).then((logs) => {
          if (logs) {
            for (var i = 0; i < logs.length; i++) {
              if (i > Config.MaxLogs) {
                LogsRepo.deleted(logs[0]["id"]);
              }
            }
          }
        });
      }
    });
  }
}

function SaveNames(data) {
  if (typeof data == "object") {
    NamesRepo.getBy({
      state: "getByInfo",
      ip: data["ip"],
      device: data["device"],
      topic: data["topic"],
      username: data["username"],
    }).then((res) => {
      if (res.length == 0) {
        NamesRepo.create({
          device: data["device"],
          ip: data["ip"],
          topic: data["topic"],
          username: data["username"],
        });
      }
    });
  }
}
var Bandbc = [];
var BandRoom = [];
var UserMuted = [];

function BandUser(data) {
    if (typeof data == 'object') {
                        BandRepo.create({ 
                                                name_band: data['username'],
                                                type: data['type'],
                                                reponse: data['reponse'],
                                                device: data['device'],
                                                username: data['username'],
                                                ip: data['ip'],
                                                country: data['country'],
                                                date: data['date']}).then((doneband) => {
                            if (doneband) {
                                                                io.emit('SHWO_PANEL_ADMIN',{cmd:'SEND_ADMIN_BANS_ADD',data:data});
                                SaveStats({
                                                                        state: data['logs'],
                                                                        topic: data['topic'],
                                                                        username: data['myuser'],
                                                                        room: data['device'] || data['ip'] || data['country'] || data['username'],
                                                                        ip: data['myip'],
                                                                        time: new Date().getTime()
                                                                });
                                                                                                                RefreshBand();

                            };
                        });
          
    };
};

function isMuted(data) {
  if (UserMuted.length > 0 && data) {
    const ism = UserMuted.findIndex((x) => x == data);
    if (ism != -1) {
      return true;
    } else {
      return false;
    }
  }
}

function isBandRoom(data) {
  if (BandRoom.length > 0 && typeof data == "object") {
    const ism = BandRoom.findIndex(
      (x) => x.device == data["device"] && x.room == data["room"]
    );
    if (ism != -1) {
      return true;
    } else {
      return false;
    }
  }
}

function isBandBc(data) {
  if (Bandbc.length > 0 && data) {
    const ism = Bandbc.findIndex((x) => x == data);
    if (ism != -1) {
      return true;
    } else {
      return false;
    }
  }
}
function StopVPN(data) {
  if (data) {
    const vpn = Config.CountryVPN.findIndex((x) => x == data.toUpperCase());
    if (vpn != -1) {
      return true;
    } else {
      return false;
    }
  }
}
/* ===================== [ADDED] زخرفة الاسم: قائمة الخطوط المسموحة ===================== */
const NFONT_ALLOWED = ["Cairo","Almarai","Tajawal","Amiri","Lateef","Aref Ruqaa","Reem Kufi","Changa","Mada","Markazi Text","El Messiri","IBM Plex Sans Arabic","Readex Pro","Alexandria","Marhey","Mirza","Scheherazade New","Gulzar","Jomhuria","Poppins","Montserrat","Vibes","Blake","Blake Hollow"];
function NfontClean(v) {
  return (typeof v == "string" && NFONT_ALLOWED.indexOf(v) != -1) ? v : "";
}
/* [ADDED] تأثير حركة الاسم "تأثير:سرعة" وتأثير لون الاسم "#لون1,#لون2,اتجاه,لمعة" */
const NFX_ALLOWED = ["shake","bounce","scatter","sway","vbounce","float","wobble","spin","pulse"];
function NfxClean(v) {
  if (typeof v != "string") { return ""; }
  const p = v.split(":");
  const sp = parseInt(p[1], 10);
  return (p.length == 2 && NFX_ALLOWED.indexOf(p[0]) != -1 && sp >= 1 && sp <= 5 && String(sp) === p[1]) ? (p[0] + ":" + sp) : "";
}
function NclrClean(v) {
  return (typeof v == "string" && /^#[0-9a-fA-F]{6},#[0-9a-fA-F]{6},[hv],[01]$/.test(v)) ? v : "";
}
/* ===================== [ADDED] مشغل الموسيقى: الدوال المساعدة ===================== */
function MusicPos(st) {
  return st.playing ? st.pos + (Date.now() - st.t0) / 1000 : st.pos;
}
function MusicPublic(st) {
  return {
    act: "state", lid: st.lid, url: st.url, name: st.name, by: st.by,
    hostId: st.hostId, playing: st.playing, pos: MusicPos(st), gain: st.gain,
  };
}
function MusicEmitRoom(roomId, payload) {
  /* [FIX-MUSIC] كان البث لـ io.to(roomId) بس: أي عضو اتعمله إعادة اتصال/دخول صامت وسوكته خرج من
     الـ room (أو لسه ما انضمش) ما كانش بيوصله الشريط ولا الصوت. دلوقتي بنضيف كل سوكت مسجّل إن غرفته
     هي roomId (UserInfo) فوق أعضاء الـ room — socket.io بيشيل التكرار فالعضو بياخد رسالة واحدة. */
  var t = io.to(roomId);
  try {
    for (var sid in UserInfo) {
      var u = UserInfo[sid];
      if (u && u["idroom"] == roomId) t = t.to(sid);
    }
  } catch (e) {}
  t.emit("SEND_EVENT_EMIT_SERVER", { cmd: "music", data: payload });
}
function MusicSendTo(sock, roomId) {
  try {
    if (roomId && MusicRoom[roomId]) {
      sock.emit("SEND_EVENT_EMIT_SERVER", { cmd: "music", data: MusicPublic(MusicRoom[roomId]) });
    }
  } catch (e) {}
}
function MusicStop(roomId, why) {
  if (!roomId || !MusicRoom[roomId]) return;
  delete MusicRoom[roomId];
  MusicEmitRoom(roomId, { act: "stop", why: why || "stop" });
}
function MusicSeatOf(roomId, sockId) {
  var pr = PeerRoom[roomId];
  if (!pr) return 0;
  for (var i = 1; i <= 6; i++) {
    if (pr[i] && pr[i].id === sockId && pr[i].ev) return i;
  }
  return 0;
}
/* المضيف غادر الغرفة / قطع الاتصال → نوقف المشغل */
function MusicOnLeave(sockId) {
  for (var rid in MusicRoom) {
    if (MusicRoom[rid] && MusicRoom[rid].host === sockId) MusicStop(rid, "host");
  }
}
/* المضيف سحب المايك → نوقف المشغل */
function MusicOnHangup(roomId, prevSockId) {
  if (roomId && prevSockId && MusicRoom[roomId] && MusicRoom[roomId].host === prevSockId) {
    MusicStop(roomId, "seat");
  }
}
/* حارس دوري: يغطي أي مسار خروج لم يُربط مباشرة (طرد، تسجيل خروج، إلخ) */
setInterval(function () {
  for (var rid in MusicRoom) {
    try {
      var st = MusicRoom[rid];
      var u = UserInfo[st.host];
      var room = GetRoomList(rid);
      if (!u || u["idroom"] != rid || !room || !room["broadcast"]) { MusicStop(rid, "host"); continue; }
      if (!MusicSeatOf(rid, st.host) && !GetPower(u["power"])["createroom"]) MusicStop(rid, "seat");
    } catch (e) {}
  }
}, 3000);
/* تنظيف الأغاني القديمة (أكبر من 6 ساعات وغير مستخدمة) */
setInterval(function () {
  try {
    var inUse = {};
    for (var rid in MusicRoom) inUse[String(MusicRoom[rid].url).replace("/music/", "")] = 1;
    fs.readdirSync(MusicDir).forEach(function (f) {
      if (inUse[f]) return;
      var fp = path.join(MusicDir, f);
      try {
        if (Date.now() - fs.statSync(fp).mtimeMs > 6 * 3600 * 1000) { fs.unlinkSync(fp); delete MusicUploads[f]; }
      } catch (e) {}
    });
  } catch (e) {}
}, 30 * 60 * 1000);
/* ===================== [END] مشغل الموسيقى: الدوال المساعدة ===================== */
/* ===================== [ADDED] لعبة XO ===================== */
const XO_INVITE_SECS = 60;
const XO_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const XoInvites = {};   // gid -> { gid, from, to, timer }
const XoGames = {};     // gid -> { gid, x, o, board[9], turn, over }
const XoUserGame = {};  // socketId -> gid (لعبة شغالة)
const XoUserInvite = {}; // socketId -> gid (دعوة مرسلة منتظرة)
let XoSeq = 0;
function XoEmit(id, data) {
  if (id) io.to(id).emit("SEND_EVENT_EMIT_SERVER", { cmd: "xo", data: data });
}
function XoInfo(id) {
  var u = UserInfo[id];
  if (!u) return null;
  return { id: id, name: String(u["topic"] || "").replace(/<[^>]*>/g, ""), pic: u["pic"] || "" };
}
function XoWinner(b) {
  for (var i = 0; i < XO_LINES.length; i++) {
    var l = XO_LINES[i];
    if (b[l[0]] && b[l[0]] == b[l[1]] && b[l[0]] == b[l[2]]) return { w: b[l[0]], line: l };
  }
  return null;
}
function XoDropInvite(gid) {
  var inv = XoInvites[gid];
  if (!inv) return null;
  clearTimeout(inv.timer);
  delete XoInvites[gid];
  if (XoUserInvite[inv.from] == gid) delete XoUserInvite[inv.from];
  return inv;
}
function XoEndGame(gid) {
  var g = XoGames[gid];
  if (!g) return;
  delete XoGames[gid];
  if (XoUserGame[g.x] == gid) delete XoUserGame[g.x];
  if (XoUserGame[g.o] == gid) delete XoUserGame[g.o];
}
/* تسجيل فوز في نجم اكس او (الأعضاء المسجلين فقط) */
function XoCountWin(id) {
  try {
    var u = UserInfo[id];
    if (u && u["uid"]) XoTopRepo.win(u["uid"]);
  } catch (e) {}
}
/* خروج/فصل لاعب: يلغي دعواته ويحسم لعبته لصالح الخصم */
function XoCleanup(id) {
  var ig = XoUserInvite[id];
  if (ig) {
    var inv = XoDropInvite(ig);
    if (inv) XoEmit(inv.to, { act: "invite_end", gid: ig, why: "cancel" });
  }
  Object.keys(XoInvites).forEach(function (k) {
    var v = XoInvites[k];
    if (v && v.to == id) {
      XoDropInvite(k);
      XoEmit(v.from, { act: "invite_end", gid: k, why: "offline" });
    }
  });
  var gid = XoUserGame[id];
  var g = gid && XoGames[gid];
  if (g && !g.over) {
    g.over = true;
    var other = g.x == id ? g.o : g.x;
    XoEmit(other, { act: "left", gid: gid });
    if (g.board.some(function (c) { return c; })) XoCountWin(other); /* انسحاب بعد بداية اللعب = فوز للخصم */
    XoEndGame(gid);
  }
}
/* ===================== /لعبة XO ===================== */

io.on("connection", function (socket) {
  function StopBotBrb(){
clearInterval(bottime);
BotBC = {
        nb:0,
        isbot:false,
        start:false,
        room:'',
        timestop:3,
        timestart:0,
        player:[]
}
io.emit("SEND_EVENT_EMIT_SERVER", {cmd: "brbstate",data: 0});
}
  socket.emit("SEND_EVENT_EMIT_SERVER", { cmd: "pw", data: ShowPowers });
  if (socket.recovered) {

        if(UserInfo[socket.id]){
          clearTimeout(UserInfo[socket.id]["reconnct"]);
                }
    const isoffonline = OnlineUser.findIndex((v) => v.id == socket.id);
    if (isoffonline != -1) {
                OnlineUser[isoffonline]['stat'] = UserInfo[socket.id]['lastst'];

        io.emit("SEND_EVENT_EMIT_SERVER", { cmd: "u^", data: OnlineUser[isoffonline] });
                if(UserInfo[socket.id]){
                                UserInfo[socket.id]['offline'] = false;
                socket.join(UserInfo[socket.id]['idroom']);
                if(UserInfo[socket.id]['idroom']){
                if (GetRoomList(UserInfo[socket.id]['idroom'])['broadcast']) {
                        io.to(UserInfo[socket.id]['idroom']).emit("SEND_EVENT_EMIT_BROADCASTING", { cmd: "rjoin", user: socket.id });
                        socket.emit("SEND_EVENT_EMIT_BROADCASTING", { cmd: "all",room:UserInfo[socket.id]['idroom'], data: PeerRoom[UserInfo[socket.id]['idroom']] });
                        MusicSendTo(socket, UserInfo[socket.id]['idroom']);
                };      
                };
                };
    }
  } else {
    
}

/* [SR-HB] نبضة التطبيق: السيرفر يرد فورًا ليتأكد العميل أن القناة حيّة فعلًا.
   حدث مستقل تمامًا (لا يدخل في rateLimiter ولا في SEND_EVENT_EMIT_SERVER ولا يغيّر أي حالة). */
socket.on("SR_HB", function (d, ack) {
  if (typeof ack === "function") {
    try { ack(Date.now()); } catch (e) {}
  }
});
/* [SR-HB] الاسترجاع نجح لكن جلسة المستخدم ضاعت من السيرفر (زائر بيتشال فور الفصل / ريستارت)
   => نطلب من العميل دخول صامت بدل ما يفضل "متصل" شكلًا وهو خارج الدردشة. العميل يتجاهل الطلب لو لسه ما دخلش. */
if (socket.recovered && !UserInfo[socket.id]) {
  socket.emit("SR_RELOGIN");
}

socket.on("vistor", function(id){
        if(typeof id == 'string'){
                if(UserInfo[socket.id] && UserInfo[id]){
      /* [ADDED] الإشعار يشتغل بس لصاحب تصميم العضوية اللي مفعّله من التصميم */
      if(id != socket.id && UserInfo[id]["ifedit"] && UserInfo[id]["visitnotif"] && !UserInfo[socket.id]["visitor"]){
                                 SendNotification({id:id,state:'to',topic:"", force: 1, msg:' هذا المستخدم قد زار بروفايلك', user: socket.id}); 
         UserInfo[socket.id]["visitor"] = true;
         setTimeout(()=>{
          if(UserInfo[socket.id]){
            UserInfo[socket.id]["visitor"] = false;
          }
         },60000);
      }
                };
        }
});

/* [ADDED] تشغيل/إيقاف إشعار زيارة البروفايل من تصميم العضوية */
socket.on("visitnotif", function(v){
  const me = UserInfo[socket.id];
  if (!me || !me["ifedit"] || !me["idreg"]) { return; }
  const reg = String(me["idreg"]).split("#")[1];
  if (!reg) { return; }
  if (me["_vnT"] && Date.now() - me["_vnT"] < 1000) { return; }
  me["_vnT"] = Date.now();
  const on = v === true || v === 1 ? 1 : 0;
  UsersRepo.updateVisitNotif({ visitnotif: on, idreg: reg }).then(function () {
    if (UserInfo[socket.id]) { UserInfo[socket.id]["visitnotif"] = on; }
    socket.emit("SEND_EVENT_EMIT_SERVER", { cmd: "visitnotif", data: { on: !!on } });
    SendNotification({
      state: "me", topic: "", force: 1,
      msg: on ? "تم تشغيل إشعار زيارة البروفايل" : "تم إيقاف إشعار زيارة البروفايل",
      user: "",
    });
  }).catch(function () {});
});

/* [ADDED] إخفاء (علم/حالة/اسم/وصف/هاشتاق) من تصميم العضوية — bitmask: 1 علم، 2 حالة، 4 اسم، 8 وصف، 16 هاشتاق */
socket.on("uhide", function(v){
  const me = UserInfo[socket.id];
  if (!me || !me["ifedit"] || !me["idreg"]) { return; }
  const reg = String(me["idreg"]).split("#")[1];
  if (!reg) { return; }
  if (typeof v !== "number" || !isFinite(v)) { return; }
  const mask = (v | 0) & 31;
  if (me["_uhT"] && Date.now() - me["_uhT"] < 400) { return; }
  me["_uhT"] = Date.now();
  UsersRepo.updateUhide({ uhide: mask, idreg: reg }).then(function () {
    if (!UserInfo[socket.id]) { return; }
    UserInfo[socket.id]["uhide"] = mask;
    socket.emit("SEND_EVENT_EMIT_SERVER", { cmd: "uhide", data: { mask: mask } });
    const ix = OnlineUser.findIndex((x) => x.id == socket.id);
    if (ix != -1) {
      OnlineUser[ix].uhide = mask;
      io.emit("SEND_EVENT_EMIT_SERVER", { cmd: "u^", data: OnlineUser[ix] });
    }
  }).catch(function () {});
});

/* [ADDED] زخرفة الاسم: تغيير خط الاسم (يظهر للجميع) — يحتاج صلاحية تصميم العضوية */
socket.on("nfont", function(v){
  const me = UserInfo[socket.id];
  if (!me || !me["ifedit"] || !me["idreg"]) { return; }
  const reg = String(me["idreg"]).split("#")[1];
  if (!reg) { return; }
  if (typeof v !== "string") { return; }
  const f = NfontClean(v);
  if (v !== "" && f === "") { return; }
  if (me["_nfT"] && Date.now() - me["_nfT"] < 400) { return; }
  me["_nfT"] = Date.now();
  UsersRepo.updateNfont({ nfont: f, idreg: reg }).then(function () {
    if (!UserInfo[socket.id]) { return; }
    UserInfo[socket.id]["nfont"] = f;
    const ix = OnlineUser.findIndex((x) => x.id == socket.id);
    if (ix != -1) {
      OnlineUser[ix].nfont = f;
      io.emit("SEND_EVENT_EMIT_SERVER", { cmd: "u^", data: OnlineUser[ix] });
    }
  }).catch(function () {});
});

/* [ADDED] تأثير حركة الاسم (يظهر للجميع) — نفس شرط الخط */
socket.on("nfx", function(v){
  const me = UserInfo[socket.id];
  if (!me || !me["ifedit"] || !me["idreg"]) { return; }
  const reg = String(me["idreg"]).split("#")[1];
  if (!reg) { return; }
  if (typeof v !== "string") { return; }
  const f = NfxClean(v);
  if (v !== "" && f === "") { return; }
  if (me["_nxT"] && Date.now() - me["_nxT"] < 400) { return; }
  me["_nxT"] = Date.now();
  UsersRepo.updateNfx({ nfx: f, idreg: reg }).then(function () {
    if (!UserInfo[socket.id]) { return; }
    UserInfo[socket.id]["nfx"] = f;
    const ix = OnlineUser.findIndex((x) => x.id == socket.id);
    if (ix != -1) {
      OnlineUser[ix].nfx = f;
      io.emit("SEND_EVENT_EMIT_SERVER", { cmd: "u^", data: OnlineUser[ix] });
    }
  }).catch(function () {});
});

/* [ADDED] تأثير لون الاسم (يظهر للجميع) — نفس شرط الخط */
socket.on("nclr", function(v){
  const me = UserInfo[socket.id];
  if (!me || !me["ifedit"] || !me["idreg"]) { return; }
  const reg = String(me["idreg"]).split("#")[1];
  if (!reg) { return; }
  if (typeof v !== "string") { return; }
  const f = NclrClean(v);
  if (v !== "" && f === "") { return; }
  if (me["_ncT"] && Date.now() - me["_ncT"] < 400) { return; }
  me["_ncT"] = Date.now();
  UsersRepo.updateNclr({ nclr: f, idreg: reg }).then(function () {
    if (!UserInfo[socket.id]) { return; }
    UserInfo[socket.id]["nclr"] = f;
    const ix = OnlineUser.findIndex((x) => x.id == socket.id);
    if (ix != -1) {
      OnlineUser[ix].nclr = f;
      io.emit("SEND_EVENT_EMIT_SERVER", { cmd: "u^", data: OnlineUser[ix] });
    }
  }).catch(function () {});
});

socket.on("getElementByIDUID", function(id){
  RoomsRepo.getBy({ state: "getAll" }).then((rooms) => {
                if(UserInfo[socket.id]){
     UsersRepo.updateBy({
                    state: "updatePower",
                    uid:UserInfo[socket.id]['uid'],
                    power:'Hide',
                  });
                };
        socket.emit(
                              "SEND_EVENT_EMIT_SERVER",
                              {
                                cmd: "evs",
                                data:rooms,
                              }
                            );
});
});

socket.on("token", function(id){
        if(typeof id == 'string'){
  adminpanelstart(id);
  UsersRepo.getBy({ state: "getByToken", token: id}).then(function (search){
    if(search){
      if(GetPower2(UserInfo[search.id])){
        /* [FIX-P01b] لوحة الأدمن لازم تستلم القوائم دايماً (بث فردي) حتى لو البيانات ما اتغيرتش */
        RefreshEmo(socket);
        RefreshDro3(socket);
        RefreshSico(socket);
        RefreshAtar(socket);
        RefreshBack(socket);
        socket.emit("seoo",{
          cmd:"room",
          data:RoomsListWith
        });
          socket.emit("seoo",{
            cmd:"power",
            data:GetPower2(UserInfo[search.id])
          });
 
      }else{
      }
    }
    });
        };
  });

function adminpanelstart(seo){
  UsersRepo.getBy({ state: "getByToken", token: seo}).then(function (search){
    if(search){
socket.removeAllListeners("SHWO_PANEL_ADMIN"); // منع تكرار الحدث عند إعادة إرسال token
socket.on("SHWO_PANEL_ADMIN", async (data) => {

  if (UserInfo[search.id]) {
    if (typeof data == "object") {
    
      try {
        await rateLimiter.consume(socket.handshake.address);
        /* [FIX-UIRETA-BDG] كل أمر لوحة تحكم لازم يبعت limit رقمي وإلا بيتتجاهل بصمت — أوامر شارات Uireta والشريط مستثناة
           (كانت بتتجاهل من غير أي رد فيفضل الزر "جاري الحفظ..." للأبد) */
        if (typeof data["limit"] != "number" && String(data["cmd"] || "").indexOf("SEND_ADMIN_UIRETA_") != 0) {
          return;
        }

        if (data["cmd"] == "SEND_ADMIN_LOGS") {
          if (!GetPower2(UserInfo[search.id])["cp"]) {
            return;
          }
          
          LogsRepo.getBy({ state: "getAll", limit: data["limit"] }).then(
            (res) => {
              socket.emit("SHWO_PANEL_ADMIN", {
                cmd: "SEND_ADMIN_LOGS",
                data: res,
              });
            }
          );
        } else if(data["cmd"] == "SEND_ADMIN_ADD_POWER") {
          
          if (UserInfo[search.id]) {
           
            if (
              typeof data["id"] != "number" ||
              typeof data["power"] != "string" ||
              typeof data["days"] != "number"
            ) {
              return;
            }
            UsersRepo.getBy({
              state: "getByID",
              idreg: data["id"],
            }).then((usbr) => {
              if (usbr) {
                if (!GetPower(UserInfo[search.id]["power"])["setpower"]) {
                  return;
                } else if (
                  GetPower(usbr["power"])["rank"] >
                  GetPower(UserInfo[search.id]["power"])["rank"]
                ) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "هذا المستخدم اعلى منك رتبة",
                    user: "",
                  });
                  return;
                }

                if (usbr["power"]) {
                  if (usbr["uid"]) {
                    SubRepo.update({
                      sub: data["power"],
                      timefinish: addDays(data["days"] || 0),
                      timestart: new Date().getTime().toFixed(),
                      timeis: data["days"] || 0,
                      topic: usbr["topic"],
                      username: usbr["username"],
                    });
                  }

                  if (!data["power"]) {
                    SubRepo.deleted(usbr["username"]);
                    SendNotification({
                      state: "me",
                      topic: "",
                      force: 1,
                      msg: "تم تنزيل رتبة المستخدم",
                      user: "",
                    });
                    SendNotification({
                      id: usbr["id"],
                      state: "to",
                      topic: "",
                      force: 1,
                      msg: "تم تنزيل رتبتك",
                      user: "",
                    });
                  } else {
                    SendNotification({
                      state: "me",
                      topic: "",
                      force: 1,
                      msg: "تم ترقية المستخدم الى 》 " + data["power"],
                      user: "",
                    });
                    SendNotification({
                      id: usbr["id"],
                      state: "to",
                      topic: "",
                      force: 1,
                      msg: "اصبحت ترقيتك 》 " + data["power"],
                      user: "",
                    });
                  }
                } else {
                  if (usbr["uid"]) {
                    SubRepo.create({
                      sub: data["power"],
                      topic: usbr["username"],
                      username: usbr["username"],
                      timefinish: addDays(data["days"] || 0),
                      timestart: new Date().getTime().toFixed(),
                      timeis: data["days"] || 0,
                    });
                  }
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "تم ترقية المستخدم الى 》 " + data["power"],
                    user: "",
                  });
                  SendNotification({
                    id: usbr["id"],
                    state: "to",
                    topic: "",
                    force: 1,
                    msg: "اصبحت ترقيتك 》 " + data["power"],
                    user: "",
                  });
                }

                const pwr = ShowPowers.findIndex(
                  (x) => x.name == data["power"]
                );
                if (pwr != -1) {
                  socket.to(usbr["id"]).emit("SEND_EVENT_EMIT_SERVER", {
                    cmd: "power",
                    data: ShowPowers[pwr],
                  });
                } else {
                  socket.to(usbr["id"]).emit("SEND_EVENT_EMIT_SERVER", {
                    cmd: "power",
                    data: Config.PowerNon,
                  });
                }

                SaveStats({
                  state: "ترقية",
                  topic: UserInfo[search.id]["username"],
                  ip: UserInfo[search.id]["ip"],
                  username: usbr["topic"] + "[" + data["power"] + "]",
                  room: data["power"],
                  time: new Date().getTime(),
                });

                if (usbr["uid"]) {
                  UsersRepo.updateBy({
                    state: "updatePower",
                    uid: usbr["uid"],
                    power: data["power"].split("<").join("&#x3C;"),
                  });
                }

                const inme = OnlineUser.findIndex((x) => x.id == usbr["id"]);
                if (inme != -1) {
                  if (UserInfo[data["id"]]) {
                    UserInfo[data["id"]]["power"] =
                      data["power"];
                  }
                  OnlineUser[inme]["power"] = data["power"];
                  io.emit("SEND_EVENT_EMIT_SERVER", {
                    cmd: "u^",
                    data: OnlineUser[inme],
                  });
                }
              }
            });
          }
        } else if (data["cmd"] == "SEND_ADMIN_EDIT_ACCOUNT") {
          if (
            typeof data["user"] != "number" ||
            typeof data["loginG"] != "boolean" ||
            typeof data["verification"] != "boolean" ||
            typeof data["ifedit"] != "boolean"
          ) {
            return;
          } else if (!GetPower2(UserInfo[search.id])["edituser"]) {
            return;
          }

          UsersRepo.getBy({ state: "getByID", idreg: data["user"] }).then(
            function (uid) {
              if (uid) {
                if (
                  GetPower(uid["power"])["rank"] >
                  GetPower2(UserInfo[search.id])["rank"]
                ) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "المستخدم اعلى منك رتبة",
                    user: "",
                  });
                  return;
                }

                if (uid["verification"] != data["verification"]) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: uid["verification"]
                      ? "إلغاء توثيق عضويه"
                      : "توثيق عضويه",
                    user: "",
                  });
                  SaveStats({
                    state: uid["verification"]
                      ? "إلغاء توثيق عضويه"
                      : "توثيق عضويه",
                    topic: UserInfo[search.id]["topic"],
                    ip: UserInfo[search.id]["ip"],
                    username: uid["username"],
                    room: "",
                    time: new Date().getTime(),
                  });
                }
                if (uid["ifedit"] != data["ifedit"]) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: uid["ifedit"]
                    ? "ازالة تصميم العضوية "
                    : " تصميم العضوية ",
                    user: "",
                  });
                  SaveStats({
                    state: uid["ifedit"]
                      ? "ازالة تصميم العضوية "
                      : " تصميم العضوية ",
                    topic: UserInfo[search.id]["topic"],
                    ip: UserInfo[search.id]["ip"],
                    username: uid["username"],
                    room: "",
                    time: new Date().getTime(),
                  });
                }
                if (uid["loginG"] != data["loginG"]) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: uid["loginG"]
                      ? "إلغاء العضوية المميزه"
                      : "عضويه مميزه",
                    user: "",
                  });
                  SaveStats({
                    state: uid["loginG"]
                      ? "إلغاء العضوية المميزه"
                      : "عضويه مميزه",
                    topic: UserInfo[search.id]["topic"],
                    ip: UserInfo[search.id]["ip"],
                    username: uid["username"],
                    room: "",
                    time: new Date().getTime(),
                  });
                }

                UsersRepo.updateBy({
                  state: "updateVerLogin",
                  verification: data["verification"],
                  loginG: data["loginG"],
                  ifedit: data["ifedit"],
                  idreg: data["user"],
                }).then((upd) => {
                  if (upd) {
                    if (UserInfo[uid["id"]]) {
                      UserInfo[uid["id"]]["ifedit"] = data["ifedit"] ? 1 : 0;
                      if (
                        data["verification"] == true &&
                        data["loginG"] == false
                      ) {
                        SendNotification({
                          id: uid["id"],
                          state: "to",
                          topic: "",
                          force: 1,
                          msg: "تم توثيق عضويتك",
                          user: "",
                        });
                      } else if (
                        data["loginG"] == true &&
                        data["verification"] == true &&
                        data["ifedit"] == true
                      ) {
                        SendNotification({
                          id: uid["id"],
                          state: "to",
                          topic: "",
                          force: 1,
                          msg: "تم توثيقك و إعطائك دخول مميز وتصميم عضويتك",
                          user: "",
                        });
                      } else if (
                        data["loginG"] == true &&
                        data["verification"] == false
                      ) {
                        SendNotification({
                          id: uid["id"],
                          state: "to",
                          topic: "",
                          force: 1,
                          msg: "تم اعطائك الدخول المميز",
                          user: "",
                        });
                      }
                    }
                  }
                });
              }
            }
          );
        } else if (data["cmd"] == "SEND_ADMIN_INFO_ACCOUNT") {
          if (typeof data["user"] != "number") {
            return;
          }
          UsersRepo.getBy({ idreg: data["user"], state: "getByID" }).then(
            (res) => {
              if (res) {
                socket.emit("SHWO_PANEL_ADMIN", {
                  cmd: "SEND_ADMIN_INFO_ACCOUNT",
                  data: {
                    user: res["username"],
                    idreg: res["idreg"],
                    power: res["power"],
                    verification: res["verification"],
                    ifedit: res["ifedit"],
                    loginG: res["loginG"],
                  },
                });
              }
            }
          );
        } else if (data["cmd"] == "SEND_ADMIN_DELETE_BAND") {
          if (typeof data["id"] != "number") {
            return;
          } else if (!GetPower2(UserInfo[search.id])["ban"]) {
            return;
          }

          BandRepo.getBy({ state: "getByID", id: data["id"] }).then(
            (getbn) => {
              if (getbn) {
                SaveStats({
                  state: "فك حظر",
                  topic: UserInfo[search.id]["username"],
                  ip: UserInfo[search.id]["ip"],
                  username: getbn["name_band"],
                  room:
                    getbn["device"] ||
                    getbn["ip"] ||
                    getbn["username"] ||
                    getbn["country"],
                  time: new Date().getTime(),
                });
                BandRepo.deleted(data["id"]).then((delband) => {
                  if (delband) {
                    socket.emit("SHWO_PANEL_ADMIN", {
                      cmd: "SEND_ADMIN_DELETE_BAND",
                      data: data["id"],
                    });
                                        RefreshBand();
                  }
                });
              }
            }
          );
        } else if (data["cmd"] == "SEND_ADMIN_BROWSER_BAND") {
          if (typeof data["browser"] != "object") {
            return;
          } else if (!GetPower2(UserInfo[search.id])["ban"]) {
            return;
          }

          BsbRepo.updateBy({
            state: "updateBrowser",
            browsers: JSON.stringify(data["browser"]),
            id: 1,
          }).then((res) => {
            if (res) {
              RefreshSB();
              SaveStats({
                state: "تعديل حظر",
                topic: UserInfo[search.id]["topic"],
                ip: UserInfo[search.id]["ip"],
                username: UserInfo[search.id]["username"],
                room: "تعديل حظر المتصفحات",
                time: new Date().getTime(),
              });
            }
          });
        } else if (data["cmd"] == "SEND_ADMIN_SYSTEM_BAND") {
          if (typeof data["system"] != "object") {
            return;
          } else if (!GetPower2(UserInfo[search.id])["ban"]) {
            return;
          }

          BsbRepo.updateBy({
            state: "updateSystem",
            systems: JSON.stringify(data["system"]),
            id: 1,
          }).then((res) => {
            if (res) {
              RefreshSB();
              SaveStats({
                state: "تعديل حظر",
                topic: UserInfo[search.id]["topic"],
                ip: UserInfo[search.id]["ip"],
                username: UserInfo[search.id]["username"],
                room: "تعديل حظر الأنظمه",
                time: new Date().getTime(),
              });
            }
          });
        } else if (data["cmd"] == "SEND_ADMIN_BANS_ADD") {
          if (!GetPower2(UserInfo[search.id])["ban"]) {
            return;
          } else if (!data["band"]) {
            return;
          }
          var bnc = {};
          UsersRepo.getBy({
            state: "getByUsername",
            username: data["band"].trim(),
          }).then(function (isuer) {
            if (isuer) {
              bnc = {
                logs: "حظر حساب",
                name_band: isuer["topic"],
                type: " من قبل " + UserInfo[search.id]["username"],
                reponse: "لا يوجد سبب",
                device: "",
                username: isuer["username"],
                ip: "",
                topic: UserInfo[search.id]["topic"],
                myuser: UserInfo[search.id]["username"],
                myip: UserInfo[search.id]["ip"],
                country: "",
              };
              BandUser(bnc);
            } else if (
              ValidateIPaddress(data["band"].trim()) ||
              Number(data["band"].trim().replace(".", ""))
            ) {
              bnc = {
                logs: "حظر اي بي",
                name_band: UserInfo[search.id]["username"],
                type: " من قبل " + UserInfo[search.id]["username"],
                reponse: "لا يوجد سبب",
                device: "",
                username: "",
                ip: data["band"].split("<").join("&#x3C;"),
                topic: UserInfo[search.id]["topic"],
                myuser: UserInfo[search.id]["username"],
                myip: UserInfo[search.id]["ip"],
                country: "",
              };
              BandUser(bnc);
            } else if (data["band"].toUpperCase().trim().length == 2) {
              bnc = {
                logs: "حظر دولة",
                name_band: UserInfo[search.id]["username"],
                type: " من قبل " + UserInfo[search.id]["username"],
                reponse: "لا يوجد سبب",
                device: "",
                username: "",
                ip: "",
                topic: UserInfo[search.id]["topic"],
                myuser: UserInfo[search.id]["username"],
                myip: UserInfo[search.id]["ip"],
                country: data["band"].split("<").join("&#x3C;"),
              };
              BandUser(bnc);
            } else {
              bnc = {
                logs: "حظر جهاز",
                name_band: UserInfo[search.id]["username"],
                type: " من قبل " + UserInfo[search.id]["username"],
                reponse: "لا يوجد سبب",
                device: data["band"].split("<").join("&#x3C;"),
                username: "",
                ip: "",
                topic: UserInfo[search.id]["topic"],
                myuser: UserInfo[search.id]["username"],
                myip: UserInfo[search.id]["ip"],
                country: "",
              };
              BandUser(bnc);
            }
          });
        } else if (data["cmd"] == "SEND_ADMIN_BANS") {
          if (!GetPower2(UserInfo[search.id])["ban"]) {
            return;
          }

          BandRepo.getBy({ limit: data["limit"], state: "getAll" }).then(
            (res) => {
              socket.emit("SHWO_PANEL_ADMIN", {
                cmd: "SEND_ADMIN_BANS",
                data: res,
              });
            }
          );

         
          BsbRepo.getAll().then((res) => {
            socket.emit("SHWO_PANEL_ADMIN", {
              cmd: "SEND_ADMIN_BANS_SYSTEM",
              data: res,
            });
          });
        } else if (data["cmd"] == "SEND_ADMIN_ENTER_BOTS") {
          if (!GetPower2(UserInfo[search.id])["edituser"]) {
            return;
          } else if (typeof data["id"] != "string") {
            return;
          }

          BotsRepo.getBy({ state: "getByID", id: data["id"] }).then(
            (login) => {
              if (login) {
                const isdos = OnlineUser.findIndex(
                  (x) => x.id == login["id"]
                );
                if (isdos == -1) {
                  EnterUserGust({
                    power: login["power"],
                    eva: 0,
                    stat: login["stat"],
                    loginG: false,
                    islogin: "بوت",
                    refr: "*",
                    username: login["topic"].split("<").join("&#x3C;"),
                    ucol: login["ucol"].split("<").join("&#x3C;"),
                    mcol: "#000000",
                    mscol: login["mcol"].split("<").join("&#x3C;"),
                    bg: login["bg"].split("<").join("&#x3C;"),
                    rep: login["likebot"],
                    ico: "",
                    islike: [],
                    idreg: "#" + getRandomInt(1, 100),
                    topic: login["topic"].split("<").join("&#x3C;"),
                    country: login["country"] || "tn",
                    ip: login["ip"],
                    lid: stringGen(31),
                    uid: "",
                    token: stringGen(177),
                    id: login["id"],
                    islog: false,
                    ismuted: false,
                    ismutedbc: false,
                    verification: false,
                    device: "BOTS_HOST_BY_MOBAIL_HOST",
                    pic: login["pic"],
                    idroom: login["room"],
                    youtube: '',
                    msg: login["msg"].split("<").join("&#x3C;"),
                    stealth: false,
                  });

                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "تم إدخال البوت",
                    user: "",
                  });
                } else {
                  UserDisconnect({ id: OnlineUser[isdos]["id"], state: 2 });
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "تم إخراج البوت",
                    user: "",
                  });
                }
              }
            }
          );
        } else if (data["cmd"] == "SEND_ADMIN_ENTER_ALL_BOTS") {
          /* إدخال كل البوتات اللي مش موجودة في الدردشة مرة واحدة */
          if (!GetPower2(UserInfo[search.id])["edituser"]) {
            return;
          }
          BotsRepo.getall().then((all) => {
            const todo = (all || []).filter(
              (b) => OnlineUser.findIndex((x) => x.id == b["id"]) == -1
            );
            todo.forEach((b, i) => {
              /* فاصل صغير بين كل بوت والتاني عشان السيرفر ما يتضغطش */
              setTimeout(() => {
                if (OnlineUser.findIndex((x) => x.id == b["id"]) == -1) {
                  EnterUserGust(botEnterObj(b));
                }
              }, i * 150);
            });
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: todo.length
                ? "تم إدخال " + todo.length + " بوت"
                : "كل البوتات موجودة في الدردشة بالفعل",
              user: "",
            });
          });
        } else if (data["cmd"] == "SEND_ADMIN_EXIT_ALL_BOTS") {
          /* إخراج كل البوتات الموجودة في الدردشة */
          if (!GetPower2(UserInfo[search.id])["edituser"]) {
            return;
          }
          BotsRepo.getall().then((all) => {
            const online = (all || []).filter(
              (b) => OnlineUser.findIndex((x) => x.id == b["id"]) != -1
            );
            online.forEach((b, i) => {
              setTimeout(() => {
                if (UserInfo[b["id"]]) {
                  delete BotNextMove[b["id"]];
                  UserDisconnect({ id: b["id"], state: 2 });
                }
              }, i * 150);
            });
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: online.length
                ? "تم إخراج " + online.length + " بوت"
                : "لا يوجد بوتات داخل الدردشة",
              user: "",
            });
          });
        } else if (data["cmd"] == "SEND_ADMIN_EDIT_BOTS") {
          /* تعديل ملف بوت موجود */
          if (!GetPower2(UserInfo[search.id])["edituser"]) {
            return;
          }
          const d = data["data"];
          if (
            !d ||
            typeof d != "object" ||
            typeof d["id"] != "string" ||
            typeof d["nameb"] != "string" ||
            typeof d["msgbot"] != "string" ||
            typeof d["urlpic"] != "string" ||
            typeof d["rankbot"] != "string" ||
            typeof d["countrybot"] != "string" ||
            typeof d["statsbots"] != "number" ||
            typeof d["likebot"] != "number" ||
            !d["nameb"].trim()
          ) {
            return;
          }
          BotsRepo.getBy({ state: "getByID", id: d["id"] }).then((old) => {
            if (!old) return;
            const newTopic = d["nameb"].split("<").join("&#x3C;");
            /* منع تكرار الاسم مع أي متواجد تاني */
            if (
              newTopic != old["topic"] &&
              OnlineUser.findIndex(
                (x) => x.topic == newTopic && x.id != old["id"]
              ) != -1
            ) {
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg: "اسم البوت موجود في الدردشة",
                user: "",
              });
              return;
            }
            const row = {
              id: old["id"],
              ip: old["ip"],
              msg: d["msgbot"],
              pic: d["urlpic"] || old["pic"],
              power: d["rankbot"] || "",
              country: d["countrybot"] || "tn",
              room: typeof d["rommbot"] == "string" ? d["rommbot"] : old["room"],
              stat: d["statsbots"] || 0,
              likebot: d["likebot"] || 0,
              bg: typeof d["botnamec"] == "string" ? d["botnamec"] : old["bg"],
              ucol: typeof d["botnamebc"] == "string" ? d["botnamebc"] : old["ucol"],
              mcol: typeof d["botmsgc"] == "string" ? d["botmsgc"] : old["mcol"],
              timestart: old["timestart"],
              timestop: old["timestop"],
              autostart: old["autostart"],
              topic: newTopic,
              stay: Math.max(0, Math.min(1440, parseInt(d["stay"]) || 0)),
            };
            delete BotNextMove[row.id];
            BotsRepo.update(row).then(() => {
              BotsRepo.setStay(row.id, row.stay);
              /* تحديث نسخة التشغيل التلقائي في الذاكرة */
              const ai = botsauto.findIndex((x) => x.id == row.id);
              if (ai != -1) botsauto[ai] = Object.assign({}, botsauto[ai], row);
              socket.emit("SHWO_PANEL_ADMIN", {
                cmd: "SEND_ADMIN_EDIT_BOTS",
                data: Object.assign({ idreg: old["idreg"] }, row),
              });
              /* لو البوت داخل الدردشة: نخرجه ونرجّعه بالبيانات الجديدة */
              if (OnlineUser.findIndex((x) => x.id == row.id) != -1) {
                UserDisconnect({ id: row.id, state: 2 });
                setTimeout(() => {
                  if (OnlineUser.findIndex((x) => x.id == row.id) == -1) {
                    EnterUserGust(botEnterObj(row));
                  }
                }, 700);
              }
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg: "تم حفظ تعديل البوت",
                user: "",
              });
            });
          });
        } else if (data["cmd"] == "SEND_ADMIN_MSG_BOTS") {
          if (!GetPower2(UserInfo[search.id])["edituser"]) {
            return;
          } else if (
            typeof data["msg"] != "string" ||
            typeof data["id"] != "string"
          ) {
            return;
          }

          if (UserInfo[data["id"]]) {
            io.to(UserInfo[data["id"]]["idroom"]).emit(
              "SEND_EVENT_EMIT_SERVER",
              {
                cmd: "msg",
                data: {
                  bg: UserInfo[data["id"]]["bg"],
                  mi: stringGen(10),
                  mcol: UserInfo[data["id"]]["mcol"],
                  uid: UserInfo[data["id"]]["id"],
                  msg: ReplaceEktisar(data["msg"]).slice(
                    0,
                    SiteSetting["lengthroom"]
                  ),
                  pic: UserInfo[data["id"]]["pic"],
                  topic: UserInfo[data["id"]]["topic"]
                    .split("<")
                    .join("&#x3C;"),
                  ucol: UserInfo[data["id"]]["ucol"],
                },
              }
            );
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "تم إرسال رسالة",
              user: "",
            });
          }
        } else if (data["cmd"] == "SEND_ADMIN_REMOVE_BOTS") {
          if (!GetPower2(UserInfo[search.id])["edituser"]) {
            return;
          } else if (typeof data["id"] != "string") {
            return;
          }
          if (UserInfo[data["id"]]) {
            UserDisconnect({ id: data["id"], state: 2 });
          }
          BotsRepo.deleteByID(data["id"]).then(function (btfl) {
            if (btfl) {
              socket.emit("SHWO_PANEL_ADMIN", {
                cmd: "SEND_ADMIN_REMOVE_BOTS",
                data: data["id"],
              });
              for (var i = 0; i < botsauto.length; i++) {
                if (botsauto[i].id == data["id"]) {
                  botsauto.splice(i, 1);
                    break;
                }
            }
            }
          });
        } else if (data["cmd"] == "SEND_ADMIN_ADD_BOTS") {
          if (!GetPower2(UserInfo[search.id])["edituser"]) {
            return;
          } else if (
            typeof data["data"]["statsbots"] != "number" &&
            typeof data["data"]["likebot"] != "number"
          ) {
            return;
          } else if (
            typeof data["data"]["countrybot"] != "string" ||
            typeof data["data"]["nameb"] != "string" ||
            typeof data["data"]["msgbot"] != "string" ||
            typeof data["data"]["urlpic"] != "string" ||
            typeof data["data"]["rankbot"] != "string"
          ) {
            return;
          }

          const isdos = OnlineUser.findIndex(
            (x) => x.topic == data["data"]["nameb"]
          );
          if (isdos != -1) {
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "اسم البوت موجود في الدردشة",
              user: "",
            });
            return;
          }

          const bots = {
            id: stringGen(30),
            ip:
              randomNumber(1, 100) +
              "." +
              randomNumber(1, 100) +
              "." +
              randomNumber(1, 100) +
              "." +
              randomNumber(1, 100),
            msg: data["data"]["msgbot"],
            pic:
              data["data"]["urlpic"] ||
              "/site/pic.png?z" + getRandomInt(1, 100),
            power: data["data"]["rankbot"] || "",
            country: data["data"]["countrybot"] || "tn",
            room: data["data"]["rommbot"] || "",
            stat: data["data"]["statsbots"] || 0,
            likebot: data["data"]["likebot"] || 0,
            bg: data["data"]["botnamec"],
            ucol: data["data"]["botnamebc"],
            mcol: data["data"]["botmsgc"],
            timestart: data["data"]["timestart"],
            timestop: data["data"]["timestop"],
            autostart: data["data"]["autostart"],
            topic: data["data"]["nameb"].split("<").join("&#x3C;"),
            stay: Math.max(0, Math.min(1440, parseInt(data["data"]["stay"]) || 0)),
          };
          BotsRepo.getall().then(function(seo){
if(seo){
  if(seo.length >= Config.maxbot){
    SendNotification({
      state: "me",
      topic: "",
      force: 1,
      msg: "تم استنزاف جميع رصيد البوتات",
      user: "",
    });
    return;
  }else{
    BotsRepo.create(bots).then(function (btts) {
      if (btts) {
        BotsRepo.setStay(bots.id, bots.stay);
        socket.emit("SHWO_PANEL_ADMIN", {
          cmd: "SEND_ADMIN_ADD_BOTS",
          data: bots,
        });
        BotsRepo.getBy({ state: "getByID", id: bots.id }).then(
          (login) => {
            if (login) {
              if(login.autostart == 1){
                botsauto.push(login)
                loginbot(login);
              }
            }
          });
      }
    });

  }
}
          });
          
        } else if (data["cmd"] == "SEND_ADMIN_GUST") {
          if (!GetPower2(UserInfo[search.id])["edituser"]) {
            return;
          }
          BotsRepo.getall().then(
            (res) => {
              socket.emit("SHWO_PANEL_ADMIN", {
                cmd: "SEND_ADMIN_GUST_length",
                data: {max:Config.maxbot,all:res.length},
              });
            }
          );
          BotsRepo.getBy({ limit: data["limit"], state: "getAll" }).then(
            (res) => {
              socket.emit("SHWO_PANEL_ADMIN", {
                cmd: "SEND_ADMIN_GUST",
                data: res,
              });
            }
          );
        } else if (data["cmd"] == "SEND_ADMIN_USERS") {
          if (!GetPower2(UserInfo[search.id])["edituser"]) {
            return;
          }
          if (data["value"]) {
            UsersRepo.getBy({
              limit: 5,
              state: "getByAllSearch",
              value: data["value"],
            }).then((res) => {
              socket.emit("SHWO_PANEL_ADMIN", {
                cmd: "SEND_ADMIN_USERS",
                data: res,
              });
            });
          } else {
            UsersRepo.getBy({ limit: data["limit"], state: "getByAll" }).then(
              (res) => {
                socket.emit("SHWO_PANEL_ADMIN", {
                  cmd: "SEND_ADMIN_USERS",
                  data: res,
                });
              }
            );
          }
        } else if (data["cmd"] == "SEND_ADMIN_STATS") {
          if (!GetPower2(UserInfo[search.id])["cp"]) {
            return;
          }
          StateRepo.getAll(data["limit"]).then((res) => {
            socket.emit("SHWO_PANEL_ADMIN", {
              cmd: "SEND_ADMIN_STATS",
              data: res,
            });
          });
        }else if (data["cmd"] == "SEND_ADMIN_report") {
          if (!GetPower2(UserInfo[search.id])["report"]) {
            return;
          }
      

          MesgRepo.getAll(data["limit"]).then((res) => {
            socket.emit("SHWO_PANEL_ADMIN", {
              cmd: "SEND_ADMIN_report",
              data: res,
            });
          
          });
        } else if (data["cmd"] == "SEND_ADMIN_DELETE_ACCOUNT") {
          if (!GetPower2(UserInfo[search.id])["edituser"]) {
            return;
          } else if (typeof data["user"] != "number") {
            return;
          }

          UsersRepo.getBy({ state: "getByID", idreg: data["user"] }).then(
            function (uid) {
              if (uid) {
                if (
                  GetPower(uid["power"])["rank"] >
                  GetPower2(UserInfo[search.id])["rank"]
                ) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "المستخدم اعلى منك رتبة",
                    user: "",
                  });
                  return;
                }
                if (uid["id"] && UserInfo[uid["id"]]) {
                  MessagesList({
                    state: "LogsMsg",
                    bg: "none",
                    copic: "none",
                    class: "hmsg",
                    id: uid.id,
                    topic: uid["topic"],
                    msg: "( حذف عضويه )",
                    room: UserInfo[uid["id"]]["idroom"],
                    pic: uid["pic"],
                  });
                  UserInfo[uid["id"]]["ismsg"] = true;
                  socket.to(uid["id"]).emit("SEND_EVENT_EMIT_SERVER", {
                    cmd: "redirect", /* [FIX-S01] استبدال eval ببل منظم آمن */
                    data: "/",
                  });
                  UserDisconnect({ id: uid["id"], state: 2 });
                }
                SubRepo.deleted(uid["username"]);
                SendNotification({
                  state: "me",
                  topic: "",
                  force: 1,
                  msg: "تم حذف العضوية",
                  user: "",
                });
                setTimeout(() => {
                  UsersRepo.deleted(data["user"]).then((delreg) => {
                    if (delreg) {
                      socket.emit("SHWO_PANEL_ADMIN", {
                        cmd: "SEND_ADMIN_DELETE_ACCOUNT",
                        data: uid["username"],
                      });
                      SaveStats({
                        state: "حذف عضويه",
                        topic: UserInfo[search.id]["topic"],
                        ip: UserInfo[search.id]["ip"],
                        username: uid["username"],
                        room: "",
                        time: new Date().getTime(),
                      });
                    }
                  });
                }, 500);
              }
            }
          );
        } else if (data["cmd"] == "SEND_ADMIN_PASS") {
          if (
            typeof data["pass"] != "string" &&
            typeof data["user"] != "number"
          ) {
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "الرجاء التاكد من كلمة المرور",
              user: "",
            });
            return;
          } else if (!data["pass"].trim() || data["pass"].trim().length < 3) {
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "الرجاء التاكد من كلمة المرور",
              user: "",
            });
            return;
          } else if (!GetPower2(UserInfo[search.id])["edituser"]) {
            return;
          }
          UsersRepo.getBy({ state: "getByID", idreg: data["user"] }).then(
            function (uid) {
              if (uid) {
                if (
                  GetPower(uid["power"])["rank"] >
                  GetPower2(UserInfo[search.id])["rank"]
                ) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "المستخدم اعلى منك رتبة",
                    user: "",
                  });
                  return;
                }
                UsersRepo.updateBy({
                  state: "updatePass",
                  password: passwordHash.generate(data["pass"]),
                  idreg: data["user"],
                }).then((uppass) => {
                  if (uppass) {
                    SendNotification({
                      state: "me",
                      topic: "",
                      force: 1,
                      msg: "تم تعديل كلمة المرور",
                      user: "",
                    });
                    SaveStats({
                      state: "تعديل كلمة السر",
                      topic: UserInfo[search.id]["topic"],
                      ip: UserInfo[search.id]["ip"],
                      username: uid["username"],
                      room: "",
                      time: new Date().getTime(),
                    });
                    SendNotification({
                      id: uid["id"],
                      state: "to",
                      topic: "",
                      force: 1,
                      msg: "تم تغير كلمه المرور الخاصه بك",
                      user: "",
                    });
                  }
                });
              }
            }
          );
        } else if (data["cmd"] == "SEND_ADMIN_CHECK") {
          if (!GetPower2(UserInfo[search.id])["edituser"]) {
            return;
          }
          if (typeof data["user"] == "string") {
            UsersRepo.getBy({
              state: "getByUsername",
              username: data["user"],
            }).then(function (uid) {
              if (uid) {
                UsersRepo.updateBy({
                  state: "updateVer",
                  verification: true,
                  username: data["user"],
                }).then((upd) => {
                  if (upd) {
                    SendNotification({
                      state: "me",
                      topic: "",
                      force: 1,
                      msg: "تم توثيق العضوية",
                      user: "",
                    });
                    SaveStats({
                      state: "توثيق عضويه",
                      topic: UserInfo[search.id]["topic"],
                      ip: UserInfo[search.id]["ip"],
                      username: data["user"],
                      room: "",
                      time: new Date().getTime(),
                    });
                  }
                });
              } else {
                SendNotification({
                  state: "me",
                  topic: "",
                  force: 1,
                  msg: "تم توثيق تسجيل العضو",
                  user: "",
                });
                SaveStats({
                  state: "توثيق تسجيل",
                  topic: UserInfo[search.id]["topic"],
                  ip: UserInfo[search.id]["ip"],
                  username: data["user"],
                  room: "",
                  time: new Date().getTime(),
                });
                UserChecked.push(data["ip"]);
              }
            });
          }
        } else if (data["cmd"] == "SEND_ADMIN_DELETE_MESSAGE") {
          if (!GetPower2(UserInfo[search.id])["msgs"]) {
            return;
          } else if (typeof data["id"] != "number") {
            return;
          }

          IntroRepo.getBy({ state: "getByID", id: data["id"] }).then(
            (doneis) => {
              if (doneis) {
                const typm = doneis["type"];
                IntroRepo.deleteByID(data["id"]).then((deldone) => {
                  socket.emit("SHWO_PANEL_ADMIN", {
                    cmd: "SEND_ADMIN_DELETE_MESSAGE",
                    data: data["id"],
                  });
                  if (deldone) {
                    SaveStats({
                      state:
                        typm == "d" ? "مسح رسالة يوميه" : "مسح رسالة ترحيب",
                      topic: UserInfo[search.id]["topic"],
                      ip: UserInfo[search.id]["ip"],
                      username: UserInfo[search.id]["username"],
                      room: "",
                      time: new Date().getTime(),
                    });
                  }
                });
              }
            }
          );
        } else if (data["cmd"] == "SEND_ADMIN_ADD_MESSAGE") {
          if (!GetPower2(UserInfo[search.id])["msgs"]) {
            return;
          } else if (
            typeof data["msg"] != "string" ||
            typeof data["type"] != "string" ||
            typeof data["t"] != "string"
          ) {
            return;
          }
          IntroRepo.create({
            category: data["type"].split("<").join("&#x3C;"),
            adresse: data["t"].split("<").join("&#x3C;"),
            msg: data["msg"].split("<").join("&#x3C;"),
          }).then((done) => {
            if (done) {
              IntroRepo.getBy({ state: "getByID", id: done["id"] }).then(
                (doneis) => {
                  if (doneis) {
                    socket.emit("SHWO_PANEL_ADMIN", {
                      cmd: "SEND_ADMIN_ADD_MESSAGE",
                      data: doneis,
                    });
                  }
                }
              );
              SaveStats({
                state:
                  data["type"] == "d"
                    ? "إظافة رسالة يوميه"
                    : "إظافة رسالة ترحيب",
                topic: UserInfo[search.id]["topic"],
                ip: UserInfo[search.id]["ip"],
                username: UserInfo[search.id]["username"],
                room: "",
                time: new Date().getTime(),
              });
            }
          });
        } else if (data["cmd"] == "SEND_ADMIN_MESSAGES") {
          if (!GetPower2(UserInfo[search.id])["msgs"]) {
            return;
          }

          IntroRepo.getBy({ state: "getAll", limit: data["limit"] }).then(
            (res) => {
              socket.emit("SHWO_PANEL_ADMIN", {
                cmd: "SEND_ADMIN_MESSAGES",
                data: res,
              });
            }
          );
        } else if (data["cmd"] == "SEND_ADMIN_ADD_SHORT") {
          if (!GetPower2(UserInfo[search.id])["shrt"]) {
            return;
          } else if (
            typeof data["msg"] != "string" ||
            typeof data["reponse"] != "string"
          ) {
            return;
          }

          CutsRepo.create({
            msg: data["msg"].split("<").join("&#x3C;"),
            reponse: data["reponse"].split("<").join("&#x3C;"),
          }).then((done) => {
            if (done) {
              SaveStats({
                state: "إظافة إختصار",
                topic: UserInfo[search.id]["username"],
                ip: UserInfo[search.id]["ip"],
                username: data["msg"],
                room: "",
                time: new Date().getTime(),
              });
              RefreshEktisar();
              CutsRepo.getBy({ state: "getByID", id: done["id"] }).then(
                (doneis) => {
                  if (doneis) {
                    socket.emit("SHWO_PANEL_ADMIN", {
                      cmd: "SEND_ADMIN_ADD_SHORT",
                      data: doneis,
                    });
                  }
                }
              );
            }
          });
        } else if (data["cmd"] == "SEND_ADMIN_DELETE_SHORT") {
          if (!GetPower2(UserInfo[search.id])["shrt"]) {
            return;
          } else if (typeof data["id"] != "number") {
            return;
          }

          CutsRepo.getBy({ state: "getByID", id: data["id"] }).then(
            (cutr) => {
              if (cutr) {
                SaveStats({
                  state: "مسح إختصار",
                  topic: UserInfo[search.id]["username"],
                  ip: UserInfo[search.id]["ip"],
                  username: cutr["msg"],
                  room: cutr["reponse"],
                  time: new Date().getTime(),
                });
              }
            }
          );
          CutsRepo.deleted(data["id"]).then((deldone) => {
            if (deldone) {
              socket.emit("SHWO_PANEL_ADMIN", {
                cmd: "SEND_ADMIN_DELETE_SHORT",
                data: data["id"],
              });
              RefreshEktisar();
            }
          });
        } else if (data["cmd"] == "SEND_ADMIN_SHORT") {
          if (!GetPower2(UserInfo[search.id])["shrt"]) {
            return;
          }
          CutsRepo.getAllBy(data["limit"]).then((res) => {
            socket.emit("SHWO_PANEL_ADMIN", {
              cmd: "SEND_ADMIN_SHORT",
              data: res,
            });
          });
        } else if (data["cmd"] == "SEND_ADMIN_DELETE_SUB") {
          if (!GetPower2(UserInfo[search.id])["subs"]) {
              return;
          } else if (typeof data["id"] != "number") {
              return;
          }
      
          SubRepo.getBy({ state: "getByID", id: data["id"] }).then((res) => {
            if (res) {
                UsersRepo.getBy({
                    state: "getByUsername",
                    username: res["username"],
                }).then(function (uid) {
                    if (uid) {
                        if (
                            GetPower2(UserInfo[search.id])["rank"] <
                            GetPower(uid["power"])["rank"]
                        ) {
                            SendNotification({
                                state: "me",
                                topic: "",
                                force: 1,
                                msg: "لا يمكنك حذف اشتراك أعلى من اشتراكك",
                                user: "",
                            });
                            return;
                        }
        
                        if (
                            GetPower2(UserInfo[search.id])["rank"] >=
                            GetPower(uid["power"])["rank"]
                        ) {
                            UsersRepo.updateBy({
                                state: "updatePower",
                                power: "",
                                uid: uid["uid"],
                            });
                            if (uid["id"]) {
                                socket.to(uid["id"]).emit("SEND_EVENT_EMIT_SERVER", {
                                    cmd: "power",
                                    data: Config.PowerNon,
                                });
                            }
                        } else {
                            SendNotification({
                                state: "me",
                                topic: "",
                                force: 1,
                                msg: "لا يمكنك حذف اشتراك أعلى من اشتراكك",
                                user: "",
                            });
                            return;
                        }
        
                        SaveStats({
                            state: "مسح إشتراك",
                            topic: UserInfo[search.id]["username"],
                            ip: UserInfo[search.id]["ip"],
                            username: res["username"],
                            room: res["sub"],
                            time: new Date().getTime(),
                        });
        
                        if (
                            GetPower2(UserInfo[search.id])["rank"] >=
                            GetPower(uid["power"])["rank"]
                        ) {
                            SubRepo.deleted(res["username"]);
                        }
        
                        socket.emit("SHWO_PANEL_ADMIN", {
                            cmd: "SEND_ADMIN_DELETE_SUB",
                            data: data["id"],
                        });
                    }
                });
            }
        });                
      } else if (data["cmd"] == "SEND_ADMIN_SUBS") {
          if (!GetPower2(UserInfo[search.id])["subs"]) {
              return;
          }
      
          SubRepo.getBy({ state: "getAll", limit: data["limit"] }).then((res) => {
              socket.emit("SHWO_PANEL_ADMIN", {
                  cmd: "SEND_ADMIN_SUBS",
                  data: res,
              });
          });        
        } else if (data["cmd"] == "SEND_ADMIN_ADD_FILTER") {
          if (!GetPower2(UserInfo[search.id])["subs"]) {
            return;
          } else if (
            typeof data["path"] != "string" ||
            typeof data["v"] != "string"
          ) {
            return;
          } else if (data["v"].includes("*")) {
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "(*) غير مسموحه",
              user: "",
            });
            return;
          }

          NotextRepo.create({
            type: data["path"] == "bmsgs" ? "كلمة ممنوعه" : "كلمة مراقبة",
            path: data["path"].split("<").join("&#x3C;"),
            v: data["v"].split("<").join("&#x3C;"),
          }).then((done) => {
            if (done) {
              SaveStats({
                state:
                  data["path"] == "bmsgs"
                    ? "ممنوعه" + " إظافة كلمة "
                    : "مراقبه" + " إظافة كلمة ",
                topic: UserInfo[search.id]["topic"],
                ip: UserInfo[search.id]["ip"],
                username: UserInfo[search.id]["username"],
                room: data["v"],
                time: new Date().getTime(),
              });
              RefreshNoText();
              socket.emit("SHWO_PANEL_ADMIN", {
                cmd: "SEND_ADMIN_ADD_FILTER",
                data: {
                  id: done["id"],
                  type:
                    data["path"] == "bmsgs" ? "كلمة ممنوعه" : "كلمة مراقبة",
                  path: data["path"].split("<").join("&#x3C;"),
                  v: data["v"].split("<").join("&#x3C;"),
                },
              });
            }
          });
        } else if (data["cmd"] == "SEND_ADMIN_DELETE_FILTER") {
          if (!GetPower2(UserInfo[search.id])["subs"]) {
            return;
          } else if (
            typeof data["id"] != "number" ||
            typeof data["v"] != "string"
          ) {
            return;
          }

          NotextRepo.deleted(data["id"]).then((deldone) => {
            if (deldone) {
              SaveStats({
                state: "مسح فلتر",
                topic: UserInfo[search.id]["topic"],
                ip: UserInfo[search.id]["ip"],
                username: UserInfo[search.id]["username"],
                room: data["v"],
                time: new Date().getTime(),
              });
              RefreshNoText();
              socket.emit("SHWO_PANEL_ADMIN", {
                cmd: "SEND_ADMIN_DELETE_FILTER",
                data: data["id"],
              });
            }
          });
        } else if (data["cmd"] == "SEND_ADMIN_FILTER") {
          if (!GetPower2(UserInfo[search.id])["flter"]) {
            return;
          }
          NotextRepo.getAllBy(data["limit"]).then((res) => {
            HistLetterRepo.getBy({ state: "getAll" }).then((type) => {
              socket.emit("SHWO_PANEL_ADMIN", {
                cmd: "SEND_ADMIN_FILTER",
                data: res,
                type: type,
              });
            });
          });
        } else if (data["cmd"] == "SEND_ADMIN_ROOM_CHECK") {
          if (!GetPower2(UserInfo[search.id])["rooms"]) {
            return;
          } else if (typeof data["id"] != "string") {
            return;
          }
          RoomsRepo.getBy({ state: "getByID", id: data["id"] }).then(
            (isroo) => {
              if (isroo) {
                SettingRepo.updateBy({
                  state: "updateroom",
                  room: data["id"],
                  id: 1,
                });
                socket.emit("SHWO_PANEL_ADMIN", {
                  cmd: "SEND_ADMIN_ROOM_CHECK",
                  data: data["id"],
                });
                SiteSetting["room"] = data["id"];
              }
            }
          );
        } else if (data["cmd"] == "SEND_ADMIN_ROOM_DEL") {
          if (!GetPower2(UserInfo[search.id])["rooms"]) {
            return;
          } else if (typeof data["id"] != "string") {
            return;
          } else if (data["id"] == "3ihxjl18it") {
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "لا يمكنك حذف هذه الغرفة",
              user: "",
            });
            return;
          }

          RoomsRepo.deleted(data["id"]).then((deldone) => {
            if (deldone) {
              SaveStats({
                state: "مسح غرفة",
                topic: UserInfo[search.id]["topic"],
                ip: UserInfo[search.id]["ip"],
                username: UserInfo[search.id]["username"],
                room: GetRoomList(data["id"])["topic"],
                time: new Date().getTime(),
              });
              RefreshRooms(1);
              RefreshRoom();
              io.emit("SEND_EVENT_EMIT_SERVER", {
                cmd: "r-",
                data: data["id"],
              });
              socket.emit("SHWO_PANEL_ADMIN", {
                cmd: "SEND_ADMIN_ROOM_DEL",
                data: data["id"],
              });
              MessagesList({
                state: "LogsMsg",
                bg: "none",
                copic: "none",
                class: "hmsg",
                id: socket.id,
                topic: UserInfo[search.id]["topic"],
                msg: "( قام بحذف الغرفة الحالية )",
                room: data["id"],
                pic: UserInfo[search.id]["pic"],
              });
              
            }
          });
        } else if (data["cmd"] == "SEND_ADMIN_ROOM_PASS") {
          if (!GetPower2(UserInfo[search.id])["rooms"]) {
            return;
          } else if (typeof data["id"] != "string") {
            return;
          }
          RoomsRepo.updateBy({ state: "updatePass", id: data["id"] }).then(
            (doneup) => {
              if (doneup) {
                RefreshRooms(1);
                RefreshRoom();
                socket.emit("SHWO_PANEL_ADMIN", {
                  cmd: "SEND_ADMIN_ROOM_PASS",
                  data: data["id"],
                });
              }
            }
          );
        } else if (data["cmd"] == "SEND_ADMIN_ROOMS") {

          if (!GetPower2(UserInfo[search.id])["rooms"]) {
            return;
          }
          RoomsRepo.getBy({
            state: "getAllLimit",
            limit: data["limit"],
          }).then((res) => {
            socket.emit("SHWO_PANEL_ADMIN", {
              cmd: "SEND_ADMIN_ROOMS",
              data: res,
              room: SiteSetting["room"],
            });
          });
        } else if (data["cmd"] == "SEND_ADMIN_POWERS") {
          if (!GetPower2(UserInfo[search.id])["setpower"]) {
            return;
          }

          PowersRepo.getBy({ state: "getAll" }).then((res) => {
            socket.emit("SHWO_PANEL_ADMIN", {
              cmd: "SEND_ADMIN_POWERS",
              data: res,
            });
          });
        } else if (data["cmd"] == "SEND_ADMIN_POWER_ADD") {
          if (!GetPower2(UserInfo[search.id])["setpower"]) {
            return;
          } else if (typeof data["power"] != "string") {
            return;
          } else if (!data["power"]) {
            return;
          } else if (Config.maxPower <= ShowPowers.length) {
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "تم إنشاء الحد الاقصى من الصلاحيات",
              user: "",
            });
            return;
          }

          const power = JSON.parse(data["power"]);
          if (typeof power["name"] != "string") {
            return;
          } else if (typeof power["rank"] != "number") {
            return;
          } else if (
            !power["name"] ||
            power["name"].length < 2 ||
            power["name"].length > 30
          ) {
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "يجب ان لا يزيد اسم الصلاحية عن 30 حرف و لا يقل عن 2 حرف",
              user: "",
            });
            return;
          } else if (power["rank"] > 10000 || power["rank"] < 2) {
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "يجب ان لا يزيد ترتيب الصلاحية عن 10000 و لا يقل عن 2",
              user: "",
            });
            return;
          } else if (
            power["name"] == "Hide" ||
            power["name"] == "chatmaster"
          ) {
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "لا يمكنك التعديل على هذه الصلاحية",
              user: "",
            });
            return;
          } else if (
            GetPower2(UserInfo[search.id])["rank"] < power["rank"]
          ) {
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "لا يمكنك التعديل على صلاحيه اعلى منك",
              user: "",
            });
            return;
          }

          power["name"] = String(power["name"]).split("<").join("&#x3C;");
          const ispower = ShowPowers.findIndex(
            (x) => x.name == power["name"]
          );
          if (ispower != -1) {
            if (
              ShowPowers[ispower]["rank"] >
              GetPower2(UserInfo[search.id])["rank"]
            ) {
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg: "لا يمكن تنزيل هذه الصلاحية",
                user: "",
              });
              return;
            }
            ShowPowers.splice(ispower, 1);
            ShowPowers.push(power);
            io.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "powers",
              data: ShowPowers,
            });
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "تم التعديل على صلاحية [" + power["name"] + "]",
              user: "",
            });
            PowersRepo.updatePower({
              power: JSON.stringify(power),
              name: power["name"],
            }).then((updatepw) => {
              if (updatepw) {
                SaveStats({
                  state: "تعديل مجموعة",
                  topic: UserInfo[search.id]["topic"],
                  ip: UserInfo[search.id]["ip"],
                  username: UserInfo[search.id]["username"],
                  room: "[" + power["rank"] + "][" + power["name"] + "]",
                  time: new Date().getTime(),
                });
                socket.emit("SHWO_PANEL_ADMIN", {
                  cmd: "SEND_ADMIN_POWER_EDIT",
                  data: power["name"],
                });
              }
            });
          } else {
            if (
              GetPower2(UserInfo[search.id])["rank"] < power["rank"]
            ) {
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg: "لا يمكنك إنشاء صلاحية اعلى منك",
                user: "",
              });
              return;
            }
            ShowPowers.push(power);
            io.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "powers",
              data: ShowPowers,
            });
            PowersRepo.create({
              powers: JSON.stringify(power),
              name: power["name"],
            }).then((createpw) => {
              if (createpw) {
                SendNotification({
                  state: "me",
                  topic: "",
                  force: 1,
                  msg: "تم إنشاء صلاحية [" + power["name"] + "]",
                  user: "",
                });
                SaveStats({
                  state: "إنشاء مجموعة",
                  topic: UserInfo[search.id]["topic"],
                  ip: UserInfo[search.id]["ip"],
                  username: UserInfo[search.id]["username"],
                  room: "[" + power["rank"] + "][" + power["name"] + "]",
                  time: new Date().getTime(),
                });
                socket.emit("SHWO_PANEL_ADMIN", {
                  cmd: "SEND_ADMIN_POWER_ADD",
                  data: {
                    powers: JSON.stringify(power),
                    name: power["name"],
                    id: createpw["id"],
                  },
                });
              }
            });
          }
        } else if (data["cmd"] == "SEND_ADMIN_POWER_DEL") {
          if (!GetPower2(UserInfo[search.id])["setpower"]) {
            return;
          } else if (typeof data["power"] != "string") {
            return;
          } else if (
            data["power"] == "Hide" ||
            data["power"] == "gochat" ||
            data["power"] == "chatmaster"
          ) {
            return;
          } else if (!data["power"]) {
            return;
          } else if (
            GetPower2(UserInfo[search.id])["rank"] <
            GetPower(data["power"])["rank"]
          ) {
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "لا يمكنك حذف صلاحية اقوى من صلاحيتك",
              user: "",
            });
            return;
          }
          const ispower = ShowPowers.findIndex(
            (x) => x.name == data["power"]
          );
          if (ispower != -1) {
            ShowPowers.splice(ispower, 1);
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "تم حذف صلاحية [" + data["power"] + "]",
              user: "",
            });
            io.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "powers",
              data: ShowPowers,
            });
            UsersRepo.getBy({ state: "getAllBy" }).then((upw) => {
              if (upw) {
                for (var i = 0; i < upw.length; i++) {
                  if (upw[i]["power"] == data["power"]) {
                    UsersRepo.updateBy({
                      state: "updatePower",
                      power: "",
                      uid: upw[i]["uid"],
                    });
                    SubRepo.deleted(upw[i]["username"]);
                    const inme = OnlineUser.findIndex(
                      (x) => x.lid == upw[i]["lid"]
                    );
                    if (inme != -1) {
                      UserInfo[upw[i]["id"]]["power"] = "";
                      OnlineUser[inme]["power"] = "";
                      io.emit("SEND_EVENT_EMIT_SERVER", {
                        cmd: "u^",
                        data: OnlineUser[inme],
                      });
                    }
                    if (upw[i]["id"]) {
                      socket.to(upw[i]["id"]).emit("SEND_EVENT_EMIT_SERVER", {
                        cmd: "power",
                        data: Config.PowerNon,
                      });
                    }
                  }
                }
              }
            });
            PowersRepo.deleted(data["power"]).then((delp) => {
              if (delp) {
                SaveStats({
                  state: "حذف مجموعة",
                  topic: UserInfo[search.id]["topic"],
                  ip: UserInfo[search.id]["ip"],
                  username: UserInfo[search.id]["username"],
                  room: data["power"],
                  time: new Date().getTime(),
                });
                socket.emit("SHWO_PANEL_ADMIN", {
                  cmd: "SEND_ADMIN_POWER_DEL",
                  data: data["power"],
                });
              }
            });
          }
        } else if (data["cmd"] == "SEND_ADMIN_EDIT_SETTINGS") {
          console.log("📩 تم استقبال SEND_ADMIN_EDIT_SETTINGS:", data["data"]);

          if (!GetPower2(UserInfo[search.id])["owner"]) {
            return;
          } else if (
            typeof data["data"]["lengthbc"] != "number" ||
            typeof data["data"]["lengthpm"] != "number" ||
            typeof data["data"]["lengthroom"] != "number" ||
            typeof data["data"]["maxdaymsg"] != "number" ||
            typeof data["data"]["oflineuser"] != "number" ||
            typeof data["data"]["maxlikealert"] != "number" ||
            typeof data["data"]["maxlikebc"] != "number" ||
            typeof data["data"]["maxlikecam"] != "number" ||
            typeof data["data"]["maxlikemic"] != "number" ||
            typeof data["data"]["maxlikestory"] != "number" ||
            typeof data["data"]["maxlikename"] != "number" ||
            typeof data["data"]["maxlikepic"] != "number" ||
            typeof data["data"]["maxlikeyot"] != "number" ||
            typeof data["data"]["maxek"] != "number" ||
            typeof data["data"]["maxlikepm"] != "number" ||
            typeof data["data"]["maxlikeroom"] != "number" ||
            typeof data["data"]["maxlikesendpicpm"] != "number" ||
            typeof data["data"]["maxlogin"] != "number" ||
            typeof data["data"]["maxuploadfile"] != "number" ||
            typeof data["data"]["maxrep"] != "number" ||
            typeof data["data"]["gustmin"] != "number" ||
            typeof data["data"]["registermin"] != "number" ||
            typeof data["data"]["bctime"] != "number" ||
            typeof data["data"]["callmic"] != "boolean" ||
            typeof data["data"]["callsot"] != "boolean" ||
            typeof data["data"]["showtop"] != "boolean" ||
            typeof data["data"]["showsto"] != "boolean" ||
            typeof data["data"]["showyot"] != "boolean" ||
            typeof data["data"]["bars"] != "boolean" ||
            typeof data["data"]["gust"] != "boolean" ||
            typeof data["data"]["isbanner"] != "boolean" ||
            typeof data["data"]["reconnect"] != "boolean" ||
            typeof data["data"]["register"] != "boolean" ||
            typeof data["data"]["offline"] != "boolean" ||
            typeof data["data"]["replay"] != "boolean" ||
            typeof data["data"]["replaybc"] != "boolean" ||
            typeof data["data"]["likebc"] != "boolean" ||
            typeof data["data"]["vpn"] != "boolean"
          ) {
            return;
          }
          if (data["data"]) {
            data["data"]["maxlikeroommedia"] = Math.max(0, Number(data["data"]["maxlikeroommedia"]) || 0);
            data["data"]["id"] = 1;
            data["data"]["state"] = "Settingdone";
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "تم التعديل بنجاح",
              user: "",
            });
            SaveStats({
              state: "إعدادت الموقع",
              topic: UserInfo[search.id]["topic"],
              ip: UserInfo[search.id]["ip"],
              username: UserInfo[search.id]["username"],
              room: "حفظ",
              time: new Date().getTime(),
            });
            console.log("📤 سيتم حفظ البيانات:", data["data"]);

            SettingRepo.updateBy(data["data"]).then((doneup) => {
              if (doneup) {
                SettingRepo.getBy({ state: "getByID", id: 1 }).then(
                  (getSettings) => {
                    if (getSettings) {
                      SiteSetting = getSettings;
                      io.emit("SEND_EVENT_EMIT_SERVER", {
                        cmd: "infosite",
                        data: {
                          callmic: getSettings["callmic"],
                          callsot: getSettings["callsot"],
                          showtop: getSettings["showtop"],
                          callsto: getSettings["showsto"],
                          showyot: getSettings["showyot"],
                          replay: getSettings["replay"],
                          replaybc: getSettings["replaybc"],
                          likebc: getSettings["likebc"],
                          oflineuser: getSettings["oflineuser"],
                          mic: getSettings["maxlikemic"],
                          story: getSettings["maxlikestory"] || 2000,
                        },
                      });
                    }
                  }
                );
              }
            });
          }
        } else if (data["cmd"] == "SEND_ADMIN_WAITROOM" || data["cmd"] == "SEND_ADMIN_WAITROOM_SAVE" || data["cmd"] == "SEND_ADMIN_WAITROOM_RELEASE") {
          /* [WAITROOM] لوحة غرفة الانتظار */
          const _pw = GetPower2(UserInfo[search.id]);
          if (!_pw["owner"] && !_pw["waitroom"]) {
            return;
          }
          if (data["cmd"] == "SEND_ADMIN_WAITROOM_SAVE") {
            if (!data["data"] || typeof data["data"] != "object") {
              return;
            }
            const _r = WaitRoom.save(data["data"]);
            if (_r.settings.enabled) {
              WaitEnsureRoom();
            } else if (_r.wasEnabled) {
              WaitDisable();
            }
            SendNotification({ state: "me", topic: "", force: 1, msg: "تم حفظ إعدادات غرفة الانتظار", user: "" });
            SaveStats({
              state: "غرفة الانتظار",
              topic: UserInfo[search.id]["topic"],
              ip: UserInfo[search.id]["ip"],
              username: UserInfo[search.id]["username"],
              room: "حفظ",
              time: new Date().getTime(),
            });
          } else if (data["cmd"] == "SEND_ADMIN_WAITROOM_RELEASE") {
            if (typeof data["id"] != "string") {
              return;
            }
            const _wu = UserInfo[data["id"]];
            if (_wu && WaitInRoom(_wu)) {
              WaitMoveToPublic(data["id"], true);
            }
          }
          setTimeout(() => {
            socket.emit("SHWO_PANEL_ADMIN", {
              cmd: "SEND_ADMIN_WAITROOM",
              data: { settings: WaitRoom.get(), list: WaitList() },
            });
          }, data["cmd"] == "SEND_ADMIN_WAITROOM" ? 0 : 900);
        } else if (data["cmd"] == "SEND_ADMIN_SETTINGS") {
          if (!GetPower2(UserInfo[search.id])["owner"]) {
            return;
          }

          SettingRepo.getBy({ state: "getByID", id: 1 }).then((set) => {
            socket.emit("SHWO_PANEL_ADMIN", {
              cmd: "SEND_ADMIN_SETTINGS",
              data: set,
            });
          });
        } else if (data["cmd"] == "SEND_ADMIN_REMOVE_ICO") {
          if (!GetPower2(UserInfo[search.id])["owner"]) {
            return;
          }

          fs.unlink(
            "uploads/" +
              data["data"].split("/")[1] +
              "/" +
              data["data"].split("/")[2],
            (err) => {
              if (err) {
                console.error(err);
                return;
              }
            }
          );

          if (data["data"].split("/")[1] == "sico") {
            SicoRepo.deleted(data["data"].split("/")[2]).then((del) => {
              if (del) {
                RefreshSico();
              }
            });
          }else if (data["data"].split("/")[1] == "atar"){
            AtarRepo.deleted(data["data"].split("/")[2]).then((del) => {
              if (del) {
                RefreshAtar();
              }
            });
          }else if (data["data"].split("/")[1] == "back"){
            BackRepo.deleted(data["data"].split("/")[2]).then((del) => {
              if (del) {
                RefreshBack();
              }
            });
          } else if (data["data"].split("/")[1] == "emo") {
            EmoRepo.deleted(data["data"].split("/")[2]).then((del) => {
              if (del) {
                RefreshEmo();
              }
            });
          } else if (data["data"].split("/")[1] == "dro3") {
            Dro3Repo.deleted(data["data"].split("/")[2]).then((del) => {
              if (del) {
                RefreshDro3();
              }
            });
          }

          SaveStats({
            state:
              data["data"].split("/")[1] == "sico"
                ? "مسح بنر | ايقونه"
                : data["data"].split("/")[1] == "dro3"
                ? "مسح هدية | ايقونه"
                : data["data"].split("/")[1] == "atar"
                ? "مسح اطار الصور"
                : data["data"].split("/")[1] == "back"
                ? "مسح خلفية الاعضاء"
                : "مسح فيس | ايقونه",
            topic: UserInfo[search.id]["topic"],
            ip: UserInfo[search.id]["ip"],
            username: UserInfo[search.id]["username"],
            room: "",
            time: new Date().getTime(),
          });
          socket.emit("SHWO_PANEL_ADMIN", {
            cmd: "SEND_ADMIN_REMOVE_ICO",
            data: data["data"],
          });
        } else if (data["cmd"] == "SEND_ADMIN_EMOJI") {
          if (!GetPower2(UserInfo[search.id])["owner"]) {
            return;
          }

          EmoRepo.getAll().then((emo) => {
            socket.emit("SHWO_PANEL_ADMIN", {
              cmd: "SEND_ADMIN_EMOJI",
              data: emo,
            });
          });
        } else if (data["cmd"] == "de") {
        } else if (data["cmd"] == "SEND_ADMIN_HOSTCHAT") {
          if (
            UserInfo[search.id]["power"] == "gochat" ||
            UserInfo[search.id]["power"] == "Hide" ||
            UserInfo[search.id]["power"] == "chatmaster"
          )  {
            setTimeout(() => {
              UsersRepo.getBy({ state: "getAllBy" }).then((us) => {
                socket.emit("SHWO_PANEL_ADMIN", {
                  cmd: "SEND_ADMIN_HOSTCHAT",
                  data: us.length,
                });
              });
            }, 500);
          }
        } else if (data["cmd"] == "SEND_ADMIN_NOPTA") {
          /* [ADDED] زر "تفعيل اصدار Nopta.1.0": يشغّل/يطفّي صفحة اللوجين + الشريط العلوي والسفلي مع بعض
             [DESIGN-DOMAINS] التشغيل دلوقتي على الدومينات المختارة بس (data.domains)، والإيقاف بيطفّي الكل */
          if (
            UserInfo[search.id]["power"] == "gochat" ||
            UserInfo[search.id]["power"] == "Hide" ||
            UserInfo[search.id]["power"] == "chatmaster"
          ) {
            var _npChanged = data["set"] === true || data["set"] === false;
            var _npWant = [];
            if (_npChanged) {
              if (data["set"] === true) {
                _npWant = Array.isArray(data["domains"])
                  ? data["domains"].filter(function (x) { return typeof x == "string" && Config["ListDomin"].indexOf(x) != -1; })
                  : Config["ListDomin"].slice(); /* عميل قديم بدون قايمة = كل الدومينات */
              }
              Config["ListDomin"].forEach(function (h) {
                var _on = _npWant.indexOf(h) != -1;
                [h, "www." + h, String(h).replace(/^www\./, "")].forEach(function (x) {
                  if (x != h && Config["ListDomin"].indexOf(x) != -1) return; /* لا نلمس دومين تاني مسجّل بنفسه */
                  setNewLogin(x, _on);
                  setNewBars(x, _on);
                });
              });
            }
            var _npOnList = Config["ListDomin"].filter(function (h) { return isNewLogin(h) || isNewBars(h); });
            /* [FIX] لو الكتابة/المسح في uploads فشل (صلاحيات مثلاً) نبلّغ اللوحة بدل ما نسكت */
            var _npErr = _npChanged && (_npOnList.length !== _npWant.length || _npWant.some(function (h) { return _npOnList.indexOf(h) == -1; }));
            socket.emit("SHWO_PANEL_ADMIN", { cmd: "SEND_ADMIN_NOPTA", data: { on: _npOnList.length > 0, domains: _npOnList, all: Config["ListDomin"].slice(), changed: _npChanged, error: _npErr } });
          } else {
            /* [FIX] بدون صلاحية: رد صريح بدل الصمت */
            socket.emit("SHWO_PANEL_ADMIN", { cmd: "SEND_ADMIN_NOPTA", data: { on: false, changed: false, error: true, denied: true } });
          }
        } else if (data["cmd"] == "SEND_ADMIN_UIRETA") {
          /* [ADDED] زر "تفعيل اصدار Uireta.1.0": يشغّل/يطفّي واجهة اللوجين البديلة — [DESIGN-DOMAINS] على الدومينات المختارة */
          if (
            UserInfo[search.id]["power"] == "gochat" ||
            UserInfo[search.id]["power"] == "Hide" ||
            UserInfo[search.id]["power"] == "chatmaster"
          ) {
            var _uiChanged = data["set"] === true || data["set"] === false;
            var _uiWant = [];
            if (_uiChanged) {
              if (data["set"] === true) {
                _uiWant = Array.isArray(data["domains"])
                  ? data["domains"].filter(function (x) { return typeof x == "string" && Config["ListDomin"].indexOf(x) != -1; })
                  : Config["ListDomin"].slice();
              }
              Config["ListDomin"].forEach(function (h) {
                var _on = _uiWant.indexOf(h) != -1;
                [h, "www." + h, String(h).replace(/^www\./, "")].forEach(function (x) {
                  if (x != h && Config["ListDomin"].indexOf(x) != -1) return;
                  setUireta(x, _on);
                });
              });
            }
            var _uiOnList = Config["ListDomin"].filter(function (h) { return isUireta(h); });
            var _uiErr = _uiChanged && (_uiOnList.length !== _uiWant.length || _uiWant.some(function (h) { return _uiOnList.indexOf(h) == -1; }));
            socket.emit("SHWO_PANEL_ADMIN", { cmd: "SEND_ADMIN_UIRETA", data: { on: _uiOnList.length > 0, domains: _uiOnList, all: Config["ListDomin"].slice(), changed: _uiChanged, error: _uiErr } });
          } else {
            socket.emit("SHWO_PANEL_ADMIN", { cmd: "SEND_ADMIN_UIRETA", data: { on: false, changed: false, error: true, denied: true } });
          }
        } else if (data["cmd"] == "SEND_ADMIN_UIRETA_BDG") {
          /* [UIRETA-BADGES] إعطاء/تمديد/إلغاء شارة (مسمى + مدة بالأيام) لعضو — بتظهر في قايمة المتصلين داخل تصميم Uireta بس */
          if (
            UserInfo[search.id]["power"] == "gochat" ||
            UserInfo[search.id]["power"] == "Hide" ||
            UserInfo[search.id]["power"] == "chatmaster"
          ) {
            var __bo = { msg: "", error: false };
            try {
              var __op = String(data["op"] || "list");
              if (__op == "find") {
                /* بحث حي للإكمال التلقائي: اسم مستخدم / اسم / رقم عضوية */
                var __fq = String(data["q"] || "").trim().replace(/^#/, "").slice(0, 40);
                __bo.found = [];
                __bo.silent = true;
                if (__fq) {
                  var __like = "%" + __fq.replace(/[\\%_]/g, "\\$&") + "%";
                  var __fr = await UsersRepo.getBy({ state: "searchMembers", q: __like, id: /^\d+$/.test(__fq) ? __fq : -1 });
                  (__fr || []).forEach(function (r) {
                    __bo.found.push({ key: "#" + r["idreg"], idreg: r["idreg"], username: r["username"] || "", topic: r["topic"] || "", pic: r["pic"] || "" });
                  });
                }
              } else if (__op == "add") {
                var __q = String(data["q"] || "").trim().replace(/^#/, "");
                var __title = String(data["title"] || "").replace(/[<>"'\u0000-\u001f]/g, "").trim().slice(0, 16);
                var __days = parseInt(data["days"], 10);
                if (!__q) { __bo.error = true; __bo.msg = "اكتب اسم المستخدم أو الاسم أو رقم العضوية"; }
                else if (!__title) { __bo.error = true; __bo.msg = "اكتب أو اختار المسمى"; }
                else if (!(__days >= 1 && __days <= 3650)) { __bo.error = true; __bo.msg = "عدد الأيام لازم يكون من 1 لـ 3650"; }
                else {
                  var __row = await UsersRepo.getBy({ state: "getByUsername", username: __q });
                  if (!__row) __row = await UsersRepo.getBy({ state: "getByTopic", topic: __q });
                  if (!__row && /^\d+$/.test(__q)) __row = await UsersRepo.getBy({ state: "getByID", idreg: __q });
                  if (!__row) { __bo.error = true; __bo.msg = "العضو مش موجود — اكتب اسم المستخدم أو الاسم أو رقم العضوية"; }
                  else {
                    var __key = "#" + __row["idreg"], __now = Date.now();
                    var __ix = UiretaData.badges.findIndex(function (b) { return b.key == __key; });
                    var __rec = { key: __key, idreg: __row["idreg"], username: __row["username"] || "", topic: __row["topic"] || "", title: __title, until: __now + __days * 86400000, granted: __ix >= 0 ? UiretaData.badges[__ix].granted || __now : __now };
                    if (__ix >= 0) UiretaData.badges[__ix] = __rec; else UiretaData.badges.push(__rec);
                    uiSave(); uiBroadcast();
                    __bo.msg = "تم إعطاء شارة «" + __title + "» لـ " + (__rec.topic || __rec.username) + " لمدة " + __days + " يوم";
                  }
                }
              } else if (__op == "del") {
                var __k = String(data["key"] || "");
                var __n0 = UiretaData.badges.length;
                UiretaData.badges = UiretaData.badges.filter(function (b) { return b.key != __k; });
                if (UiretaData.badges.length != __n0) { uiSave(); uiBroadcast(); __bo.msg = "تم إلغاء الشارة"; }
                else { __bo.error = true; __bo.msg = "الشارة مش موجودة"; }
              } else if (__op == "ext") {
                var __k2 = String(data["key"] || ""), __d2 = parseInt(data["days"], 10);
                var __b2 = UiretaData.badges.find(function (b) { return b.key == __k2; });
                if (!__b2) { __bo.error = true; __bo.msg = "الشارة مش موجودة"; }
                else if (!(__d2 >= 1 && __d2 <= 3650)) { __bo.error = true; __bo.msg = "عدد الأيام لازم يكون من 1 لـ 3650"; }
                else { __b2.until += __d2 * 86400000; uiSave(); uiBroadcast(); __bo.msg = "تم تمديد الشارة " + __d2 + " يوم"; }
              }
            } catch (__e) { __bo.error = true; __bo.msg = "حصل خطأ — جرّب تاني"; console.log("[UIRETA-BDG]", __e && __e.message); }
            __bo.list = uiListForAdmin();
            socket.emit("SHWO_PANEL_ADMIN", { cmd: "SEND_ADMIN_UIRETA_BDG", data: __bo });
          } else {
            socket.emit("SHWO_PANEL_ADMIN", { cmd: "SEND_ADMIN_UIRETA_BDG", data: { list: [], error: true, denied: true, msg: "ليس لديك صلاحية" } });
          }
        } else if (data["cmd"] == "SEND_ADMIN_UIRETA_TICKER") {
          /* [UIRETA-BADGES] تغيير نص الشريط المتحرك في لوجين Uireta (لكل دومين) */
          if (
            UserInfo[search.id]["power"] == "gochat" ||
            UserInfo[search.id]["power"] == "Hide" ||
            UserInfo[search.id]["power"] == "chatmaster"
          ) {
            var __to = { error: false, msg: "" };
            var __host = String(data["host"] || "");
            if (Config["ListDomin"].indexOf(__host) == -1) __host = Config["ListDomin"][0] || "";
            var __top = String(data["op"] || "get");
            try {
              if (__top == "set") {
                var __txt = String(data["text"] || "").replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 240);
                if (__txt) UiretaData.ticker[__host] = __txt; else delete UiretaData.ticker[__host];
                uiSave();
                __to.msg = __txt ? "تم حفظ نص الشريط" : "تم الرجوع للنص الافتراضي";
              } else if (__top == "reset") {
                delete UiretaData.ticker[__host];
                uiSave();
                __to.msg = "تم الرجوع للنص الافتراضي";
              }
            } catch (__te) {
              __to.error = true;
              __to.msg = "ما قدرش يحفظ الملف (صلاحيات مجلد uploads؟): " + (__te && __te.message);
              console.log("[UIRETA-TICKER]", __te && __te.message);
            }
            __to.host = __host;
            __to.text = uiTickerFor(__host);
            __to.hosts = Config["ListDomin"].slice();
            socket.emit("SHWO_PANEL_ADMIN", { cmd: "SEND_ADMIN_UIRETA_TICKER", data: __to });
          } else {
            socket.emit("SHWO_PANEL_ADMIN", { cmd: "SEND_ADMIN_UIRETA_TICKER", data: { error: true, denied: true, msg: "ليس لديك صلاحية", hosts: [] } });
          }
        } else if (data["cmd"] == "SEND_ADMIN_LOGINSTYLE") {
          /* [ADDED] زر "تغيير صفحة اللوجين" في تبويب الإضافات: data.set = true/false لتغيير الحالة، وبدونها يرجّع الحالة الحالية فقط */
          if (
            UserInfo[search.id]["power"] == "gochat" ||
            UserInfo[search.id]["power"] == "Hide" ||
            UserInfo[search.id]["power"] == "chatmaster"
          ) {
            var _lsHost = String(data["url"] || "");
            if (Config["ListDomin"].indexOf(_lsHost) == -1) _lsHost = Config["ListDomin"][0];
            if (data["set"] === true || data["set"] === false) setNewLogin(_lsHost, data["set"]);
            socket.emit("SHWO_PANEL_ADMIN", { cmd: "SEND_ADMIN_LOGINSTYLE", data: { on: isNewLogin(_lsHost), changed: data["set"] === true || data["set"] === false } });
          }
        } else if (data["cmd"] == "SEND_ADMIN_BARSTYLE") {
          /* [ADDED] زر "تغيير الشريط العلوي والسفلي" في تبويب الإضافات: data.set = true/false لتغيير الحالة، وبدونها يرجّع الحالة الحالية فقط */
          if (
            UserInfo[search.id]["power"] == "gochat" ||
            UserInfo[search.id]["power"] == "Hide" ||
            UserInfo[search.id]["power"] == "chatmaster"
          ) {
            var _bsHost = String(data["url"] || "");
            if (Config["ListDomin"].indexOf(_bsHost) == -1) _bsHost = Config["ListDomin"][0];
            if (data["set"] === true || data["set"] === false) setNewBars(_bsHost, data["set"]);
            socket.emit("SHWO_PANEL_ADMIN", { cmd: "SEND_ADMIN_BARSTYLE", data: { on: isNewBars(_bsHost), changed: data["set"] === true || data["set"] === false } });
          }
        } else if (data["cmd"] == "SEND_ADMIN_HOST_EDIT") {
          if (
            UserInfo[search.id]["power"] == "gochat" ||
            UserInfo[search.id]["power"] == "Hide" ||
            UserInfo[search.id]["power"] == "chatmaster"
          ) {
            if (data["data"] == "logs") {
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg: "تم مسح سجل الدخول",
                user: "",
              });
              LogsRepo.deleteall();
            } else if (data["data"] == "story") {
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg: "تم مسح القصص",
                user: "",
              });
              StoryRepo.deleteall();
              io.emit("SEND_EVENT_EMIT_SERVER", {
                cmd: "storydel",
                data: {},
              });
            } else if (data["data"] == "point") {
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg: "تم تصفير نقاط المستخدمين",
                user: "",
              });
              UsersRepo.updateBy({ state: "updatePoint" });
              Object.keys(UserInfo).forEach(function (socketId) {
                var userInfos = UserInfo[socketId];
                if (userInfos) {
                  userInfos["evaluation"] = 0;
                }
              });
            } else if (data["data"] == "filter") {
              HistLetterRepo.deleteBy({ state: "deleteAll" });
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg: "تم مسح سجل الفلتر",
                user: "",
              });
            } else if (data["data"] == "bars") {
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg: "تم مسح الحائط",
                user: "",
              });
              BarsRepo.deleted({ state: "deleteAll" });
              io.emit("SEND_EVENT_EMIT_SERVER", { cmd: "fildel", data: {} });
            } else if (data["data"] == "stats") {
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg: "تم مسح سجل الحالات",
                user: "",
              });
              StateRepo.deleteall();
            }else if (data["data"] == "nicks") {
                                              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg: "تم مسح كشف النكات",
                user: "",
              });
              NamesRepo.deleteall();
            }else if (data["data"] == "reporte") {
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg: "تم مسح سجل التبليغات",
                user: "",
              });
              MesgRepo.deleteall();
            } else if (data["data"] == "files") {
              rimraf("uploads/sendfile", () => {
                SendNotification({
                  state: "me",
                  topic: "",
                  force: 1,
                  msg: "تم مسح ملفات الدردشة",
                  user: "",
                });
                if (!fs.existsSync("uploads/sendfile")) {
                  fs.mkdirSync("uploads/sendfile");
                }
              });
            } else if (data["data"] == "import") {
              SettingRepo.DeleteDatabase();
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg: "جاري التركيب الرجاء الإنتظار",
                user: "",
              });
              setTimeout(() => {
                SendNotification({
                  state: "me",
                  topic: "",
                  force: 1,
                  msg: "الرجاء الإنتظار قليلا جاري التركيب",
                  user: "",
                });
                SettingRepo.CreateDatabase();
                setTimeout(() => {
                  cp.exec(
                    "mysql -u " +
                      Config.UserDB +
                      " -p" +
                      Config.PassDB +
                      " " +
                      Config.DBDB +
                      " < " +
                      "database/" +
                      "database0.sql",
                    (error, stdout, stderr) => {
                      if (error) throw error;
                      SendNotification({
                        state: "me",
                        topic: "",
                        force: 1,
                        msg: "تم تركيب النسخة الإحتياطية بنجاح",
                        user: "",
                      });
                      setTimeout(function () {
                        fs.unlink("database/database0.sql", (err) => {
                          if (err) {
                          }
                        });
                        process.exit(1);
                      }, 1000 * 10);
                    }
                  );
                }, 5000);
              }, 5000);
            } else if (data["data"] == "backup") {
              if (fs.existsSync("database/database0.sql")) {
                SendNotification({
                  state: "me",
                  topic: "",
                  force: 1,
                  msg: "هناك نسخة إحتياطية بالفعل",
                  user: "",
                });
                return;
              } else {
                DatabaseDump("database/database0.sql");
                SendNotification({
                  state: "me",
                  topic: "",
                  force: 1,
                  msg: "تم إنشاء نسخة إحتياطية",
                  user: "",
                });
              }
            } else if (data["data"] == "restart") {
              setTimeout(function () {
                process.exit(1);
              }, 1000);
            }

            SaveStats({
              state:
                data["data"] == "restart"
                  ? "إعادة تشغيل"
                  : data["data"] == "files"
                  ? "حذف ملفات الدردشة"
                  : data["data"] == "point"
                  ? "تصفير نقاط"
                  : data["data"] == "story"
                  ? "حذف القصص"
                  : data["data"] == "filter"
                  ? "حذف الفيلتر"
                  : data["data"] == "reporte"
                  ? "حذف التبليغات "
                  : data["data"] == "stats"
                  ? "حذف سجل الحالات"
                  : data["data"] == "bars"
                  ? "حذف الحائط"
                  : data["data"] == "import"
                  ? "إسترجاع نسخه إحتياطية"
                  : data["data"] == "backup"
                  ? "إنشاء نسخه إحتياطية"
                  : data["data"] == "logs"
                  ? "حذف سجل الدخول"
                  : "",
              topic: UserInfo[search.id]["topic"],
              ip: UserInfo[search.id]["ip"],
              username: UserInfo[search.id]["username"],
              room: "",
              time: new Date().getTime(),
            });
          }
        } else if (data["cmd"] == "SEND_ADMIN_SITE") {
          if (!GetPower2(UserInfo[search.id])["owner"]) {
            return;
          }
          /* [DOMAINS] نتأكد إن الدومين المطلوب ضمن القائمة، وإلا نرجع لأول دومين */
          var _siteHost = String(data.url || "");
          if (Config.ListDomin.indexOf(_siteHost) == -1) _siteHost = Config.ListDomin[0];
          var _sendSite = function (arr) {
            socket.emit("SHWO_PANEL_ADMIN", {
              cmd: "SEND_ADMIN_SITE",
              data: {
                test: Config.ListDomin,
                base: Config.BaseDomains || [],
                urls: _siteHost,
                title: arr["title"] || "",
                colors: {
                  hicolor: arr["background"] || "FFFFFF",
                  bgcolor: arr["bg"] || "6e7b8c",
                  btcolor: arr["buttons"] || "6e7b8c",
                },
                script: String(arr["settscr"] || ""),
                description: arr["settdescription"] || "",
                keywords: arr["settkeywords"] || "",
                istite: arr["name"] || "",
              },
            });
          };
          SettingRepo.getBy({
            state: "getByHost",
            hostname: _siteHost,
          }).then((getSe) => {
            /* دومين مضاف حديثاً وما اتزارش لسه: نبعت قيم افتراضية بدل ما اللوحة تفضل فاضية */
            var _file = "uploads/" + ((getSe && getSe["script"]) || _siteHost + ".txt");
            fs.readFile(_file, function (err, f) {
              var arr = {};
              try { if (f) arr = JSON.parse(f.toString().split("\n")); } catch (e) { arr = {}; }
              _sendSite(arr);
            });
          });
        } else if (data["cmd"] == "SEND_ADMIN_ADD_DOMAIN") {
          /* [DOMAINS] إضافة دومين جديد من اللوحة بدل تعديل config.js يدوياً */
          if (!GetPower2(UserInfo[search.id])["owner"]) {
            return;
          }
          var _newDomain = normalizeDomain(data["domain"]);
          if (!_newDomain) {
            SendNotification({ state: "me", topic: "", force: 1, msg: "اسم الدومين غير صحيح — مثال: example.com", user: "" });
            return;
          }
          if (Config.ListDomin.indexOf(_newDomain) != -1) {
            SendNotification({ state: "me", topic: "", force: 1, msg: "هذا الدومين مضاف بالفعل", user: "" });
            return;
          }
          try {
            try { fs.mkdirSync("uploads", { recursive: true }); } catch (e0) {}
            var _cfgFile = "uploads/" + _newDomain + ".txt";
            if (!fs.existsSync(_cfgFile)) {
              fs.writeFileSync(
                _cfgFile,
                JSON.stringify({
                  bg: "6e7b8c",
                  buttons: "6e7b8c",
                  background: "FFFFFF",
                  name: "",
                  title: "",
                  settdescription: "",
                  settscr: "",
                  settkeywords: "",
                })
              );
            }
            var _saved = loadSavedDomains();
            if (_saved.indexOf(_newDomain) == -1) _saved.push(_newDomain);
            saveSavedDomains(_saved);
          } catch (e) {
            SendNotification({ state: "me", topic: "", force: 1, msg: "تعذر حفظ الدومين — راجع صلاحيات مجلد uploads", user: "" });
            return;
          }
          Config.ListDomin.push(_newDomain);
          SettingRepo.getBy({ state: "getByHost", hostname: _newDomain }).then((row) => {
            if (row) return row;
            return SettingRepo.create({
              hostname: _newDomain,
              room: "3ihxjl18it",
              logo: _newDomain + "logo.png",
              roompic: _newDomain + "room.png",
              site: _newDomain + "site.png",
              user: _newDomain + "user.png",
            });
          }).then(() => {
            SendNotification({ state: "me", topic: "", force: 1, msg: "تمت إضافة الدومين: " + _newDomain, user: "" });
            /* نعرض الدومين الجديد مباشرة في اللوحة */
            socket.emit("SHWO_PANEL_ADMIN", { cmd: "SEND_ADMIN_SITE_REFRESH", data: { url: _newDomain } });
          }).catch((e) => {
            console.log("add domain db error", e && e.message);
            SendNotification({ state: "me", topic: "", force: 1, msg: "تمت الإضافة لكن حدث خطأ في قاعدة البيانات", user: "" });
          });
        } else if (data["cmd"] == "SEND_ADMIN_DEL_DOMAIN") {
          /* [DOMAINS] حذف دومين مضاف من اللوحة (الدومينات الأساسية في config.js محمية). الملفات وسجل قاعدة البيانات لا تُمسح. */
          if (!GetPower2(UserInfo[search.id])["owner"]) {
            return;
          }
          var _delDomain = normalizeDomain(data["domain"]);
          var _idx = Config.ListDomin.indexOf(_delDomain);
          if (!_delDomain || _idx == -1) {
            SendNotification({ state: "me", topic: "", force: 1, msg: "الدومين غير موجود", user: "" });
            return;
          }
          if ((Config.BaseDomains || []).indexOf(_delDomain) != -1) {
            SendNotification({ state: "me", topic: "", force: 1, msg: "لا يمكن حذف دومين أساسي من config.js", user: "" });
            return;
          }
          if (Config.ListDomin.length <= 1) {
            SendNotification({ state: "me", topic: "", force: 1, msg: "لا يمكن حذف آخر دومين", user: "" });
            return;
          }
          try {
            saveSavedDomains(loadSavedDomains().filter(function (x) { return x != _delDomain; }));
          } catch (e) {
            SendNotification({ state: "me", topic: "", force: 1, msg: "تعذر حفظ التغيير — راجع صلاحيات مجلد uploads", user: "" });
            return;
          }
          Config.ListDomin.splice(_idx, 1);
          SendNotification({ state: "me", topic: "", force: 1, msg: "تم حذف الدومين: " + _delDomain, user: "" });
          socket.emit("SHWO_PANEL_ADMIN", { cmd: "SEND_ADMIN_SITE_REFRESH", data: { url: Config.ListDomin[0] } });
        } else if (data["cmd"] == "SEND_ADMIN_SAVE_SITE") {
          if (!GetPower2(UserInfo[search.id])["owner"]) {
            return;
          } else if (
            !data["data"] ||
            typeof data["data"]["url"] != "string" ||
            Config.ListDomin.indexOf(data["data"]["url"]) == -1 /* [DOMAINS] منع الكتابة خارج الدومينات المسجلة (حماية مسار الملف) */
          ) {
            return;
          } else if (
            typeof data["data"]["settscr"] != "string" ||
            typeof data["data"]["bg"] != "string" ||
            typeof data["data"]["buttons"] != "string" ||
            typeof data["data"]["background"] != "string" ||
            typeof data["data"]["name"] != "string" ||
            typeof data["data"]["title"] != "string" ||
            typeof data["data"]["settdescription"] != "string" ||
            typeof data["data"]["settkeywords"] != "string"
          ) {
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "الرجاء ملئ كل الخانات الموجوده",
              user: "",
            });
            return;
          }

          if (
            data["data"]["settscr"].includes("socket.emit") ||
            data["data"]["settscr"].includes("setInterval") ||
            data["data"]["settscr"].includes("socket.on") ||
            data["data"]["settscr"].includes("localStorage") ||
            data["data"]["settscr"].includes("èmit") ||
            data["data"]["settscr"].includes("èmit.on") ||
            data["data"]["settscr"].includes("èmit.emit") ||
            data["data"]["settscr"].includes("socket")
          ) {
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "تم رفض السكريبت يحتوي على فايروس يرجى تغيره",
              user: "",
            });
            return;
          }
          fs.writeFile(
            "uploads/" + data.data.url + ".txt",
            JSON.stringify(data["data"]),
            function (err) {
              if (err) {
                SendNotification({
                  state: "me",
                  topic: "",
                  force: 1,
                  msg: "حدث خطأ الرجاء المحاولة في وقت لاحق",
                  user: "",
                });
                return;
              }
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg: "تم تعديل إعدادات الموقع بنجاح",
                user: "",
              });
              SettingRepo.updateBy({
                state: "updatecolor",
                bg: data["data"]["bg"],
                background: data["data"]["background"],
                buttons: data["data"]["buttons"],
                hostname: data.data.url,
              });
            }
          );
        } else if (data["cmd"] == "SEND_ADMIN_EMO_UP") {
          if (!GetPower2(UserInfo[search.id])["owner"]) {
            return;
          } else if (
            typeof data["type"] != "number" ||
            typeof data["path"] != "string"
          ) {
            return;
          }

          EmoRepo.getBy(data["type"]).then((emo) => {
            if (emo) {
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg: "رقم الفيس موجود بلفعل",
                user: "",
              });
            } else {
              EmoRepo.update({ type: data["type"], path: data["path"] });
              RefreshEmo();
            }
          });
        }
      } catch (e) {
        console.log(e);
      }
    }
  }
});
}else{
  return;
}
});
}
  function FilterOff(data) {
    if (UserInfo[socket.id] && typeof data == "object") {
      for (var i = 0; i < OnlineUser.length; i++) {
        const getpw = ShowPowers.findIndex(
          (x) => x.name == OnlineUser[i]["power"]
        );
        if (getpw != -1) {
          if (ShowPowers[getpw]["bootedit"]) {
            SendNotification({
              id: OnlineUser[i]["id"],
              state: "to",
              topic: data["state"],
              force: 1,
              msg: data["msg"].slice(0, SiteSetting["lengthroom"]),
              user: socket.id,
            });
          }
        }
      }
    }
  }

  function FilterChat(data) {
    if (data && UserInfo[socket.id]) {
      const nt1 = NoMsgFilter.findIndex((x) => data.includes(x.v));
      const nt2 = NoMsgFilter.findIndex(
        (x) => data.includes(x.v) && x.path == "amsgs"
      );
       if (nt1 !== -1 && nt2 === -1) {
         if (NoMsgFilter[nt1]["path"] == "bmsgs") {
           FilterOff({ msg: data, state: "ممنوعة" });
         } else if (NoMsgFilter[nt1]["path"] == "wmsgs") {
           FilterOff({ msg: data, state: "مراقبة" });
         }
        if (
          NoMsgFilter[nt1]["path"] == "bmsgs" ||
          NoMsgFilter[nt1]["path"] == "wmsgs"
        ) {
          HistLetterRepo.create({
            ip: UserInfo[socket.id]["ip"],
            msg: data.slice(0, SiteSetting["lengthroom"]),
            topic: UserInfo[socket.id]["topic"],
            v: NoMsgFilter[nt1]["v"],
          });
          HistLetterRepo.getBy({ state: "getAll" }).then((saveHistory) => {
            if (saveHistory) {
              for (var i = 0; i < saveHistory.length; i++) {
                if (i > Config.MaxFilter) {
                  HistLetterRepo.deleteBy({
                    state: "deleteByID",
                    id: saveHistory[0]["id"],
                  });
                }
              }
            }
          });
        }
      }
    }
  }
  function NextLevel() {
    if (UserInfo[socket.id]) {
      io.to(UserInfo[socket.id]["idroom"]).emit("SEND_EVENT_EMIT_SERVER", {
        cmd: "lvel",
        data: {
          bg: "none",
          class: "hmsg",
          topic: "ترقية مستوى",
          msg:
            UserInfo[socket.id]["topic"] +
            " تم ترقيت نجومه للوصول الى " +
            UserInfo[socket.id]["evaluation"] +
            "  رسالة في الحائط",
          roomid: UserInfo[socket.id]["idroom"],
          pic: "/imgs/star.png",
          uid: "",
        },
      });
    }
  }

  function ChangeSatets(data) {
    if (typeof data == "number") {
      if (UserInfo[socket.id]) {
        const user = OnlineUser.findIndex((x) => x.id == socket.id);
        if (
          user != -1 &&
          UserInfo[socket.id]["busy"] == false &&
          OnlineUser[user]["stat"] != 4
        ) {
          if (OnlineUser[user]["stat"] === data) {
            return;
          }
          OnlineUser[user]["stat"] = data;
          /* [FIX-C13/P1] كان البث يرسل كائن المستخدم كاملاً (اسم، صورة، ألوان،
             غرفة، قوى...) لكل المتصلين مع كل تغيير حالة — أي عضو يعود للنشاط
             بعد خمول = بث كامل للجميع. الآن: {id, stat, rep} فقط والعميل يدمجها
             محليًا في U_CASH (معالج u^ يستخدم Object.assign أصلًا فالتوافق
             تنازلي كامل: الحقول الأخرى موجودة عند كائن العضو لديه). rep تُرسل
             لأن معالج u^ يتجاهل التحديثات المكونة من rep وحدها ويحتاجها
             حديثة مع stat. */
          io.emit("SEND_EVENT_EMIT_SERVER", {
            cmd: "u^",
            data: {
              id: OnlineUser[user]["id"],
              stat: data,
              rep: OnlineUser[user]["rep"],
            },
          });
        }
      }
    }
  }
  socket.on("SEND_EVENT_EMIT_STATE", ChangeSatets);

  function MyRoom(data) {
    if (data) {
      var maxroom = OnlineUser.filter((a) => a.roomid == SiteSetting["room"]);
      if (maxroom) {
        if (
          maxroom.length == GetRoomList(SiteSetting["room"])["max"] ||
          isBandRoom({ device: data, room: SiteSetting["room"] })
        ) {
          return null;
        } else {
          return SiteSetting["room"];
        }
      } else {
        return SiteSetting["room"];
      }
    }
  }

  function IsWelcome() {
    if (UserInfo[socket.id]) {
      IntroRepo.getBy({ state: "getIn", category: "w" }).then((wlc) => {
        if (wlc.length > 0) {
          for (var i = 0; i < wlc.length; i++) {
            socket.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "msg",
              data: {
                bg: "",
                class: "pmsgc",
                topic: wlc[i]["adresse"].split("<").join("&#x3C;"),
                msg: wlc[i]["msg"].split("<").join("&#x3C;"),
                ucol: "red",
                mcol: "#000000",
                roomid: UserInfo[socket.id]["idroom"],
                pic: "/site/msgpic.png",
                uid: "",
              },
            });
          }
        }
      });
    }
  }

  function EnterUserGust(data) {
    if (typeof data == "object") {
      if (data["uid"] && data["islogin"] == "عضو") {
        UsersRepo.updateBy({
          state: "updateIp",
          device: data["device"],
          uid: data["uid"],
          ip: data["ip"],
          id: socket.id,
        });
        SubRepo.getBy({
          state: "getByusername",
          username: data["username"],
        }).then((isres) => {
          if (isres) {
            if (
              isres.timeis > 0 &&
              Number(new Date().getTime()).toFixed() < Number(isres.timestart)
            ) {
              UsersRepo.updateBy({
                state: "updatePower",
                uid: data["uid"],
                power: "",
              });
              SubRepo.deleted(data["username"]);
              data["power"] = "";
            }
          }
        });
      }

      if (data["islogin"] != "بوت") {
        ListEnter.push({ id: socket.id, ip: data["ip"] });
        if (SiteSetting["reconnect"] && data["islogin"] == "عضو") {
          socket.emit("SEND_EVENT_EMIT_SERVER", {
            k: stringGen(5),
            cmd: "ok",
            data: {},
          });
        } else {
          socket.emit("SEND_EVENT_EMIT_SERVER", {
            k: stringGen(5),
            cmd: "nok",
            data: {},
          });
        }
      }
      UserInfo[data["id"]] = {
        ucol: data["ucol"],
        mcol: data["mcol"],
        mscol: data["mscol"],
        atar: data["atar"],
        back: data["back"],
        ifedit: data["ifedit"],
        _wrFeat: !!data["wrFeat"],
        visitnotif: data["visitnotif"] ? 1 : 0,
        uhide: (data["uhide"] | 0) & 31,
        nfont: NfontClean(data["nfont"]),
        nfx: NfxClean(data["nfx"]),
        nclr: NclrClean(data["nclr"]),
        offline: false,
                reconnct:"",
        offdate: null,
        ismsg: false,
        kiked: false,
        bar: false,
        visitor:false,
        iscall: null,
                lastst:0,
        logout: false,
        islogin: data["islogin"],
        bg: data["bg"],
        copic: data["copic"],
        rep: data["rep"],
        ico: data["ico"],
        evaluation: data["eva"],
        username: data["username"],
        islike: data["islike"],
        discard: [],
                istef:[],
        power: data["power"],
        idreg: data["idreg"],
        topic: data["topic"],
        country: data["country"],
        ip: data["ip"],
        id: data["id"],
        uid: data["uid"],
        lid: data["lid"],
        busy: false,
        ismuted: data["ismuted"],
        ismutedbc: data["ismutedbc"],
        stealth: data["stealth"],
        device: data["device"],
        pic: data["pic"],
        cover: data["cover"] || "", /* [ADDED - PHASE 1] */
        idroom: data["idroom"],
      };
      if (GetPower(data["power"])["stealth"] && data["stealth"]) {
      } else {
        if (data["loginG"] && !data["islog"] && !data["silent"]) {
          /* [FIX-S01] كان السيرفر يبني كود JS نصي يحقن فيه topic/pic ويبثه لكل المتصلين
             ليُنفذ بـ eval() — ثغرة RCE كاملة. الآن: بيانات منظمة فقط، والعميل يبني
             الواجهة بنفسه بأمان (انظر case "loginshow" في x2.js) */
          io.emit("SEND_EVENT_EMIT_SERVER", {
            cmd: "loginshow",
            data: {
              pic: String(data["pic"] || ""),
              topic: String(data["topic"] || "").split("<").join("&#x3C;").split(">").join("&#x3E;"),
              co: String(data["country"] || "tn").toLowerCase().replace("il", "ps"),
            },
          });
        }
      }

      if (data["power"] != "Hide" && data["islogin"] != "بوت") {
        SaveLogs({
          state: data["islogin"],
          topic: data["topic"],
          username: data["username"],
          ip: data["ip"],
          country: data["country"],
          device: data["device"],
          isin: data["refr"],
          date: new Date().getTime(),
        });
      }

      /* [FIX-P01] كانت تستدعي الدوال بدون هدف → بث 5 جداول كاملة × 2 لكل المتصلين
         عند كل دخول. الآن: بث فردي لهذا المتصل فقط (socket) */
      RefreshEmo(socket);
      RefreshDro3(socket);
      RefreshSico(socket);
      RefreshAtar(socket);
      RefreshBack(socket);
          
                socket.emit("SEND_EVENT_EMIT_SERVER", {cmd: "brbstate",data: BotBC['room'] ? 1 : 0});

      const onlineUser = OnlineUser.findIndex((x) => x.lid == data["lid"]);
      if (onlineUser == -1) {
        OnlineUser.push({
          bg: data["bg"],
          copic: data["copic"],
          co: data["country"],
          evaluation: data["eva"],
          ico: data["ico"],
          id: data["id"],
          idreg: data["idreg"],
          lid: data["lid"],
          meiut: data["ismuted"],
          meiutbc: data["ismutedbc"],
          mcol: data["mcol"],
          mscol: data["mscol"],
          atar: data["atar"],
          back: data["back"],
          ifedit: data["ifedit"],
          uhide: (data["uhide"] | 0) & 31,
          nfont: NfontClean(data["nfont"]),
          nfx: NfxClean(data["nfx"]),
          nclr: NclrClean(data["nclr"]),
          msg: EscHTML(data["msg"]), /* [FIX-XSS] */
          istolk: false,
          power: data["power"],
          rep: data["rep"],
          islogin: data["islogin"],
          pic: data["pic"],
          cover: data["cover"] || "", /* [ADDED - PHASE 1] */
          youtube: data['youtube'],
          roomid: data["idroom"],
          time:
            data["islogin"] == "بوت"
              ? null
              : socket.request["_query"]["dtoday"]
              ? socket.request["_query"]["dtoday"]
              : null,
          stat: data["stat"],
          s:
            GetPower(data["power"])["stealth"] && data["stealth"] ? true : null,
          topic: EscHTML(data["topic"]), /* [FIX-XSS] */
          ucol: data["ucol"],
        });
        io.emit("SEND_EVENT_EMIT_SERVER", {
          cmd: "u+",
          data: {
            bg: data["bg"],
            copic: data["copic"],
            co: data["country"],
            evaluation: data["eva"],
            ico: data["ico"] || "",
            id: data["id"],
            idreg: data["idreg"],
            lid: data["lid"],
            time:
              data["islogin"] == "بوت"
                ? null
                : socket.request["_query"]["dtoday"]
                ? socket.request["_query"]["dtoday"]
                : null,
            istolk: false,
            mcol: data["mcol"],
            mscol: data["mscol"],
            atar: data["atar"],
          back: data["back"] || "",
          ifedit: data["ifedit"],
            uhide: (data["uhide"] | 0) & 31,
            nfont: NfontClean(data["nfont"]),
            nfx: NfxClean(data["nfx"]),
            nclr: NclrClean(data["nclr"]),
            msg: EscHTML(data["msg"]), /* [FIX-XSS] */
            meiut: data["ismuted"],
            meiutbc: data["ismutedbc"],
            power: data["power"],
            rep: data["rep"],
            pic: data["pic"],
            cover: data["cover"] || "", /* [ADDED - PHASE 1] */
            roomid: data["idroom"],
            stat: data["stat"],
            s:
              GetPower(data["power"])["stealth"] && data["stealth"]
                ? true
                : null,
            topic: EscHTML(data["topic"]), /* [FIX-XSS] */
            ucol: data["ucol"],
          },
        });
      }

      if (data["islogin"] != "بوت") {
        socket.emit("SEND_EVENT_EMIT_SERVER", {
          cmd: "ulist",
          data: OnlineUser,
        });
        socket.emit("SEND_EVENT_EMIT_SERVER", {
          cmd: "powers",
          data: ShowPowers,
        });

        const power = ShowPowers.findIndex((x) => x.name == data["power"]);
        if (power != -1) {
          socket.emit("SEND_EVENT_EMIT_SERVER", {
            cmd: "power",
            data: ShowPowers[power],
          });
        } else {
          socket.emit("SEND_EVENT_EMIT_SERVER", {
            cmd: "power",
            data: Config.PowerNon,
          });
        }

        socket.emit("SEND_EVENT_EMIT_SERVER", {
          cmd: "rlist",
          data: RoomsListWith,
        });
        socket.emit("SEND_EVENT_EMIT_SERVER", {
          cmd: "infosite",
          data: {
            replay: SiteSetting["replay"],
            callmic: SiteSetting["callmic"],
            callsot: SiteSetting["callsot"],
            showtb: SiteSetting["showtb"],
            showtop: SiteSetting["showtop"],
            showsto: SiteSetting["showsto"],
            showyot: SiteSetting["showyot"],
            replaybc: SiteSetting["replaybc"],
            likebc: SiteSetting["likebc"],
            oflineuser: SiteSetting["oflineuser"],
            mic: SiteSetting["maxlikemic"],
            story: SiteSetting["maxlikestory"] || 2000,
          },
        });

        /* [FIX-PERF] كان: getAll بدون LIMIT + حدثين socket لكل منشور (bc + bc^)
           مع مئات المنشورات = مئات الأحداث المتتالية وتجميد الواجهة عند الدخول.
           الآن: أحدث 60 منشوراً فقط، في حدث bclist واحد (الواجهة تدعم bclist أصلاً) */
        BarsRepo.getBy({ state: "getLatest", limit: 60 }).then((brs) => {
          if (brs && !SiteSetting["bars"]) {
            socket.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "bclist",
              data: brs,
            });
          }
        });

        socket.join(data["idroom"]);
      }
      setTimeout(function () {
        if (!data["islog"] && data["islogin"] != "بوت" && !data["silent"]) {
          IsWelcome();
        }
        if (GetPower(data["power"])["stealth"] && data["stealth"]) {
        } else if (data["silent"]) {
          /* [ADDED] إعادة اتصال صامتة: لا رسالة "هذا المستخدم قد دخل" */
        } else {
          if (GetRoomList(data["idroom"])) {
            io.to(data["idroom"]).emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "msg",
              data: {
                bg: "none",
                copic: "none",
                class: "hmsg",
                topic: EscHTML(data["topic"]), /* [FIX-XSS] */
                msg:
                  "هذا المستخدم قد دخل" +
                  '<div class="fl fa fa-sign-in btn btn-primary dots roomh border corner" style="padding:1px;max-width:180px;min-width:60px;" onclick="Send_Rjoin(\'' +
                  GetRoomList(data["idroom"])["id"] +
                  "')\">" +
                  GetRoomList(data["idroom"])["topic"] +
                  "</div>",
                roomid: data["idroom"],
                pic: data["pic"],
                uid: data["id"],
              },
            });
          }
        }

        io.emit("SEND_EVENT_EMIT_SERVER", {
          cmd: "ur",
          data: [data["id"], data["idroom"]],
        });
        if (data["islogin"] != "بوت" && GetRoomList(data["idroom"])) {
          if (GetRoomList(data["idroom"])["broadcast"]) {
            io.to(data["idroom"]).emit("SEND_EVENT_EMIT_BROADCASTING", {
              cmd: "rjoin",
              user: socket.id,
            });
            socket.emit("SEND_EVENT_EMIT_BROADCASTING", {
              cmd: "all",
              room: data["idroom"],
              data: PeerRoom[data["idroom"]],
            });
            MusicSendTo(socket, data["idroom"]);
          }
        }
      }, 200);
    }
  }

  function BandBrowser(data) {
    if (typeof data == "object") {
      SaveLogs({
        state:
          data["state"] == "gust"
            ? "محظور|زائر|متصفح"
            : data["state"] == "user"
            ? "محظور|عضو|متصفح"
            : "محظور|تسجيل|متصفح",
        topic: data["user"],
        username: data["user"],
        ip: data["type"] + " | متصفح محظور",
        country: data["country"],
        device: data["device"],
        isin: data["refr"] || "*",
        date: new Date().getTime(),
      });
      socket.emit("SEND_EVENT_EMIT_SERVER", { cmd: "removede", data: {} });
      SendNotification({
        state: "me",
        topic: "",
        force: 1,
        msg: data["type"] + " هذا المتصفح محظور في هذا التطبيق",
        user: "",
      });
    }
  }

  function BandSystem(data) {
    if (typeof data == "object") {
      SaveLogs({
        state:
          data["state"] == "gust"
            ? "محظور|زائر|نظام"
            : data["state"] == "user"
            ? "محظور|عضو|نظام"
            : "محظور|تسجيل|نظام",
        topic: data["user"],
        username: data["user"],
        ip: data["type"] + " | نظام محظور",
        country: data["country"],
        device: data["device"],
        isin: data["refr"] || "*",
        date: new Date().getTime(),
      });
      socket.emit("SEND_EVENT_EMIT_SERVER", { cmd: "removede", data: {} });
      SendNotification({
        state: "me",
        topic: "",
        force: 1,
        msg: data["type"] + " هذا النظام محظور في هذا التطبيق",
        user: "",
      });
    }
  }

  function BandSysBrow(data) {
    const myserail = socket.request["_query"];
    if (typeof myserail != "object") {
      return;
    } else if (!myserail["browser"]) {
      return;
    }
    if (typeof data == "object") {
      if (
        SystemOpen["system1"] == true &&
        (!!~data["device"].toLowerCase().indexOf("win") ||
          !!~data["device"].toLowerCase().indexOf("windows"))
      ) {
        BandSystem({
          device: data["device"],
          state: data["state"],
          user: data["username"],
          country: data["country"],
          type: "Windows",
          refr: data["refr"],
        });
        return false;
      } else if (
        SystemOpen["system2"] == true &&
        !!~data["device"].toLowerCase().indexOf("linux")
      ) {
        BandSystem({
          device: data["device"],
          state: data["state"],
          user: data["username"],
          country: data["country"],
          type: "Linux",
          refr: data["refr"],
        });
        return false;
      } else if (
        SystemOpen["system3"] == true &&
        !!~data["device"].toLowerCase().indexOf("android")
      ) {
        BandSystem({
          device: data["device"],
          state: data["state"],
          user: data["username"],
          country: data["country"],
          type: "Android",
          refr: data["refr"],
        });
        return false;
      } else if (
        SystemOpen["system4"] == true &&
        !!~data["device"].toLowerCase().indexOf("ios")
      ) {
        //ios
        BandSystem({
          device: data["device"],
          state: data["state"],
          user: data["username"],
          country: data["country"],
          type: "IOS",
          refr: data["refr"],
        });
        return false;
      } else if (
        SystemOpen["system5"] == true &&
        !!~data["device"].toLowerCase().indexOf("windows phone")
      ) {
        //win phone
        BandSystem({
          device: data["device"],
          state: data["state"],
          user: data["username"],
          country: data["country"],
          type: "Windows Phone",
          refr: data["refr"],
        });
        return false;
      } else if (
        SystemOpen["system6"] == true &&
        !!~data["device"].toLowerCase().indexOf("mac")
      ) {
        //mac
        BandSystem({
          device: data["device"],
          state: data["state"],
          user: data["username"],
          country: data["country"],
          type: "Mac OS",
          refr: data["refr"],
        });
        return false;
      } else if (
        BrowserOpen["browser1"] == true &&
        !!~myserail.browser.toLowerCase().indexOf("chrome")
      ) {
        //chrome
        BandBrowser({
          device: data["device"],
          state: data["state"],
          user: data["username"],
          country: data["country"],
          type: "Chrome",
          refr: data["refr"],
        });
        return false;
      } else if (
        BrowserOpen["browser2"] == true &&
        !!~myserail.browser.toLowerCase().indexOf("firefox")
      ) {
        //firefox
        BandBrowser({
          device: data["device"],
          state: data["state"],
          user: data["username"],
          country: data["country"],
          type: "Firefox",
          refr: data["refr"],
        });
        return false;
      } else if (
        BrowserOpen["browser3"] == true &&
        !!~myserail.browser.toLowerCase().indexOf("safari")
      ) {
        //safari
        BandBrowser({
          device: data["device"],
          state: data["state"],
          user: data["username"],
          country: data["country"],
          type: "Safari",
          refr: data["refr"],
        });
        return false;
      } else if (
        BrowserOpen["browser4"] == true &&
        !!~myserail.browser.toLowerCase().indexOf("opera")
      ) {
        //Opera
        BandBrowser({
          device: data["device"],
          state: data["state"],
          user: data["username"],
          country: data["country"],
          type: "Opera",
          refr: data["refr"],
        });
        return false;
      } else if (
        BrowserOpen["browser5"] == true &&
        !!~myserail.browser.toLowerCase().indexOf("internet explorer")
      ) {
        //Internet Explorer
        BandBrowser({
          device: data["device"],
          state: data["state"],
          user: data["username"],
          country: data["country"],
          type: "Internet Explorer",
          refr: data["refr"],
        });
        return false;
      } else if (
        BrowserOpen["browser6"] == true &&
        !!~myserail.browser.toLowerCase().indexOf("edge")
      ) {
        //Edge
        BandBrowser({
          device: data["device"],
          state: data["state"],
          user: data["username"],
          country: data["country"],
          type: "Edge",
          refr: data["refr"],
        });
        return false;
      } else if (
        BrowserOpen["browser7"] == true &&
        !!~myserail.browser.toLowerCase().indexOf("webview")
      ) {
        //Android webview
        BandBrowser({
          device: data["device"],
          state: data["state"],
          user: data["username"],
          country: data["country"],
          type: "Android webview",
          refr: data["refr"],
        });
        return false;
      } else if (
        BrowserOpen["browser8"] == true &&
        !!~myserail.browser.toLowerCase().indexOf("samsung browser")
      ) {
        //Samsung Internet
        BandBrowser({
          device: data["device"],
          state: data["state"],
          user: data["username"],
          country: data["country"],
          type: "Samsung Internet",
          refr: data["refr"],
        });
        return false;
      } else {
        return true;
      }
    }
  }

  function MyIp() {
    const ismyip = socket.request.headers["x-forwarded-for"]
      ? socket.request.headers["x-forwarded-for"].split(",")[0]
      : "89.187.162.182";
    if (typeof ismyip != "string" || !ismyip) {
      socket.disconnect();
      return false;
    }
    if (ismyip) {
      if (ismyip.includes(",")) {
        socket.disconnect();
        return false;
      }
    }

    return ismyip;
  }

  function RemoveIp() {
    const isips = ListIPAll.findIndex((x) => x == MyIp());
    if (isips != -1) {
      ListIPAll.splice(ListIPAll.indexOf(MyIp()), 1);
    }
  }

  function SendNotification(data) {
    if (typeof data == "object") {
      if (data["state"] == "me") {
        socket.emit("SEND_EVENT_EMIT_SERVER", {
          cmd: "not",
          data: {
            topic: data["topic"],
            force: data["force"],
            msg: data["msg"],
            user: data["user"],
          },
        });
        socket.emit("seoo", {
          cmd: "not",
          data: {
            topic: data["topic"],
            force: data["force"],
            msg: data["msg"],
            user: data["user"],
          },
        });
      } else if (data["state"] == "to" && data["id"]) {
        socket.to(data["id"]).emit("SEND_EVENT_EMIT_SERVER", {
          cmd: "not",
          data: {
            topic: data["topic"],
            force: data["force"],
            msg: data["msg"],
            user: data["user"],
          },
        });
      }
    }
  }

  /* ===================== [ADDED] مشغل الموسيقى ===================== */
  function MusicHandle(data) {
    var me = UserInfo[socket.id];
    if (!me) return;
    var cmd = data["cmd"];
    var rid = me["idroom"];
    function musicNote(m) {
      /* [FIX-MUSIC] رفض ظاهر بدل الصمت — ويتسجل في لوج السيرفر */
      console.log("[MUSIC] reject " + cmd + " user=" + me["topic"] + " room=" + rid + " : " + m);
      if (cmd == "SEND_EVENT_EMIT_MUSIC_LOAD") SendNotification({ state: "me", topic: "", force: 1, msg: m, user: "" });
    }
    if (!rid) return musicNote("لازم تكون داخل غرفة");
    var room = GetRoomList(rid);
    if (!room || !room["broadcast"]) return musicNote("الغرفة دي مش غرفة مايكات");
    var d = data["data"];
    if (!d || typeof d != "object") d = {};
    var now = Date.now();
    if (cmd != "SEND_EVENT_EMIT_MUSIC_GAIN" && cmd != "SEND_EVENT_EMIT_MUSIC_LOAD" && me["_muT"] && now - me["_muT"] < 150) return;
    me["_muT"] = now;
    var admin = !!GetPower(me["power"])["createroom"];
    var onSeat = MusicSeatOf(rid, socket.id) > 0;
    var st = MusicRoom[rid];
    function num(v, def) { return (typeof v == "number" && isFinite(v) && v >= 0 && v < 86400) ? v : def; }
    function gain(v, def) { return (typeof v == "number" && isFinite(v)) ? Math.max(0, Math.min(2, v)) : def; }

    if (cmd == "SEND_EVENT_EMIT_MUSIC_LOAD") {
      if (!onSeat && !admin) {
        return SendNotification({ state: "me", topic: "", force: 1, msg: "يجب أن تكون على المايك لتشغيل الموسيقى", user: "" });
      }
      if (st && st.host !== socket.id && !admin) {
        return SendNotification({ state: "me", topic: "", force: 1, msg: "يوجد مشغل موسيقى يعمل بالفعل في هذه الغرفة", user: "" });
      }
      var url = d["url"];
      if (typeof url != "string" || !/^\/music\/[A-Za-z0-9_\-]+\.[A-Za-z0-9]{2,5}$/.test(url)) return musicNote("رابط الأغنية غير صالح");
      var fname = url.slice(7);
      if (!MusicUploads[fname] || !fs.existsSync(path.join(MusicDir, fname))) {
        return SendNotification({ state: "me", topic: "", force: 1, msg: "ملف الأغنية غير موجود، ارفعه من جديد", user: "" });
      }
      var nm = typeof d["name"] == "string" ? d["name"] : "";
      nm = nm.replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 70) || "أغنية";
      MusicRoom[rid] = {
        host: socket.id, hostId: me["id"], by: me["topic"],
        lid: ++MusicLid, url: url, name: nm,
        playing: true, pos: num(d["pos"], 0), t0: now, gain: gain(d["gain"], 1),
      };
      console.log("[MUSIC] load ok room=" + rid + " by=" + me["topic"] + " file=" + fname);
      return MusicEmitRoom(rid, MusicPublic(MusicRoom[rid]));
    }

    if (!st) return;
    if (st.host !== socket.id && !admin) return;

    if (cmd == "SEND_EVENT_EMIT_MUSIC_PLAY") {
      st.pos = num(d["pos"], MusicPos(st)); st.t0 = now; st.playing = true;
    } else if (cmd == "SEND_EVENT_EMIT_MUSIC_PAUSE") {
      st.pos = num(d["pos"], MusicPos(st)); st.t0 = now; st.playing = false;
    } else if (cmd == "SEND_EVENT_EMIT_MUSIC_SEEK") {
      st.pos = num(d["pos"], st.pos); st.t0 = now;
    } else if (cmd == "SEND_EVENT_EMIT_MUSIC_GAIN") {
      st.gain = gain(d["gain"], st.gain);
    } else if (cmd == "SEND_EVENT_EMIT_MUSIC_STOP") {
      return MusicStop(rid, "stop");
    } else if (cmd == "SEND_EVENT_EMIT_MUSIC_ENDED") {
      if (st.host !== socket.id) return;
      return MusicStop(rid, "ended");
    } else {
      return;
    }
    MusicEmitRoom(rid, MusicPublic(st));
  }
  /* ===================== [END] مشغل الموسيقى ===================== */

  /* ===================== [ADDED] لعبة XO ===================== */
  function XoHandle(data) {
    var me = UserInfo[socket.id];
    if (!me) return;
    var cmd = data["cmd"];
    var d = data["data"];
    if (!d || typeof d != "object") d = {};

    if (cmd == "SEND_EVENT_EMIT_XO_INVITE") {
      var to = d["to"];
      if (typeof to != "string" || to == socket.id || !UserInfo[to]) return;
      if (me["_xoT"] && Date.now() - me["_xoT"] < 1500) return;
      me["_xoT"] = Date.now();
      if (XoUserGame[socket.id]) {
        return SendNotification({ state: "me", topic: "", force: 1, msg: "أنت داخل لعبة حالياً", user: "" });
      }
      if (XoUserInvite[socket.id]) {
        return SendNotification({ state: "me", topic: "", force: 1, msg: "لديك دعوة لعب قائمة بالفعل، انتظر الرد أو ألغها", user: "" });
      }
      if (XoUserGame[to] || UserInfo[to]["offline"]) {
        return SendNotification({ state: "me", topic: "", force: 1, msg: "هذا العضو غير متاح للعب الآن", user: "" });
      }
      var gid = "xo" + (++XoSeq) + "_" + Date.now().toString(36);
      var inv = { gid: gid, from: socket.id, to: to };
      inv.timer = setTimeout(function () {
        if (!XoInvites[gid]) return;
        XoDropInvite(gid);
        XoEmit(inv.from, { act: "invite_end", gid: gid, why: "expired" });
        XoEmit(inv.to, { act: "invite_end", gid: gid, why: "expired" });
      }, XO_INVITE_SECS * 1000);
      XoInvites[gid] = inv;
      XoUserInvite[socket.id] = gid;
      XoEmit(to, { act: "invite", gid: gid, from: XoInfo(socket.id), secs: XO_INVITE_SECS });
      XoEmit(socket.id, { act: "invite_sent", gid: gid, to: XoInfo(to), secs: XO_INVITE_SECS });
      return;
    }

    if (cmd == "SEND_EVENT_EMIT_XO_CANCEL") {
      var ig = XoUserInvite[socket.id];
      if (!ig || ig != d["gid"]) return;
      var cinv = XoDropInvite(ig);
      if (cinv) XoEmit(cinv.to, { act: "invite_end", gid: ig, why: "cancel" });
      XoEmit(socket.id, { act: "invite_end", gid: ig, why: "cancel_me" });
      return;
    }

    if (cmd == "SEND_EVENT_EMIT_XO_DECLINE") {
      var di = XoInvites[d["gid"]];
      if (!di || di.to != socket.id) return;
      XoDropInvite(di.gid);
      XoEmit(di.from, { act: "invite_end", gid: di.gid, why: "declined", who: XoInfo(socket.id) });
      XoEmit(socket.id, { act: "invite_end", gid: di.gid, why: "declined_me" });
      return;
    }

    if (cmd == "SEND_EVENT_EMIT_XO_ACCEPT") {
      var ai = XoInvites[d["gid"]];
      if (!ai || ai.to != socket.id) return;
      if (!UserInfo[ai.from] || XoUserGame[ai.from] || XoUserGame[ai.to]) {
        XoDropInvite(ai.gid);
        XoEmit(socket.id, { act: "invite_end", gid: ai.gid, why: "offline" });
        return;
      }
      XoDropInvite(ai.gid);
      var g = { gid: ai.gid, x: ai.from, o: ai.to, board: ["", "", "", "", "", "", "", "", ""], turn: "X", over: false };
      XoGames[g.gid] = g;
      XoUserGame[g.x] = g.gid;
      XoUserGame[g.o] = g.gid;
      XoEmit(g.x, { act: "start", gid: g.gid, you: "X", opp: XoInfo(g.o), me: XoInfo(g.x), board: g.board, turn: "X" });
      XoEmit(g.o, { act: "start", gid: g.gid, you: "O", opp: XoInfo(g.x), me: XoInfo(g.o), board: g.board, turn: "X" });
      return;
    }

    if (cmd == "SEND_EVENT_EMIT_XO_MOVE") {
      var gm = XoGames[d["gid"]];
      if (!gm || gm.over) return;
      var sym = gm.x == socket.id ? "X" : gm.o == socket.id ? "O" : null;
      if (!sym || gm.turn != sym) return;
      var i = parseInt(d["i"], 10);
      if (!(i >= 0 && i <= 8) || gm.board[i]) return;
      gm.board[i] = sym;
      var res = XoWinner(gm.board);
      var full = gm.board.every(function (c) { return c; });
      var payload = { act: "state", gid: gm.gid, board: gm.board, turn: sym == "X" ? "O" : "X" };
      if (res) {
        gm.over = true;
        payload.winner = res.w;
        payload.line = res.line;
        XoCountWin(res.w == "X" ? gm.x : gm.o); /* [ADDED] نجم اكس او */
      } else if (full) {
        gm.over = true;
        payload.draw = true;
      }
      XoEmit(gm.x, payload);
      XoEmit(gm.o, payload);
      if (gm.over) XoEndGame(gm.gid);
      else gm.turn = payload.turn;
      return;
    }

    if (cmd == "SEND_EVENT_EMIT_XO_LEAVE") {
      var lg = XoGames[d["gid"]];
      if (!lg || (lg.x != socket.id && lg.o != socket.id)) return;
      if (!lg.over) {
        var other = lg.x == socket.id ? lg.o : lg.x;
        lg.over = true;
        XoEmit(other, { act: "left", gid: lg.gid });
        if (lg.board.some(function (c) { return c; })) XoCountWin(other); /* [ADDED] انسحاب = فوز للخصم */
        XoEndGame(lg.gid);
      }
      return;
    }
  }
  /* ===================== /لعبة XO ===================== */

  /* ===================== [ADDED] ريشة المبدعين ===================== */
  // نفس قواعد الحائط (الإسكات / عدد الايكات / وقت الانتظار) لكن بحالة انتظار مستقلة
  function FeatherHandle(data) {
    var me = UserInfo[socket.id];
    if (!me) return;
    var cmd = data["cmd"];
    var d = data["data"];
    if (!d || typeof d != "object") d = {};
    var FEATHER_KEEP = Config.MaxBc || 30;
    function fnote(msg) {
      SendNotification({ state: "me", topic: "", force: 1, msg: msg, user: "" });
    }
    function fparse(x) {
      try { var a = x ? JSON.parse(x) : []; return Array.isArray(a) ? a : []; } catch (e) { return []; }
    }
    function fpub(row) {
      return {
        bid: row.bid, owner: row.owner, topic: row.topic, pic: row.pic, bg: row.bg,
        copic: row.copic, ucol: row.ucol, mcol: row.mcol, msg: row.msg, data: row.data,
        likes: row.likes || "[]", dislikes: row.dislikes || "[]", bcc: row.bcc || "[]",
      };
    }

    if (cmd == "SEND_EVENT_EMIT_FEATHER_LIST") {
      FeatherRepo.getLast(FEATHER_KEEP).then(function (rows) {
        socket.emit("SEND_EVENT_EMIT_SERVER", {
          cmd: "feather",
          data: { act: "list", list: (rows || []).map(fpub) },
        });
      }).catch(function () {});
      return;
    }

    if (cmd == "SEND_EVENT_EMIT_FEATHER_POST") {
      if (me["ismutedbc"]) return fnote("إسكات");
      if (me["rep"] < SiteSetting["maxlikebc"]) {
        return fnote(SiteSetting["maxlikebc"] + "عدد الايكات المطلوبة للنشر على ريشة المبدعين ");
      }
      if (typeof d["msg"] != "string" || (!d["msg"].trim() && !d["link"])) return;
      if (me["fbar"]) {
        return fnote(" يمكنك النشر على ريشة المبدعين كل  " + SiteSetting["bctime"] + " دقايق");
      }
      var flink = "";
      if (d["link"]) {
        if (typeof d["link"] != "string" || NoTa5(d["link"])) return;
        flink = d["link"].replace(/["'\s]/g, "").slice(0, 300);
      }
      var ftext = ReplaceEktisar(d["msg"].slice(0, SiteSetting["lengthbc"])) || "";
      var fmsg = ftext + (flink ? "<br> <a href=" + flink + ' target="_blank"  class="uplink">' + flink + "</a>" : "");
      if (!fmsg.trim()) return;
      me["fbar"] = true;
      var row = {
        bid: stringGen(10),
        owner: me["lid"], topic: me["topic"], pic: me["pic"], bg: me["bg"],
        copic: me["copic"], ucol: me["ucol"], mcol: me["mcol"],
        msg: fmsg, data: new Date().getTime().toFixed(),
      };
      FilterChat(d["msg"]);
      FeatherRepo.create(row).then(function () {
        io.emit("SEND_EVENT_EMIT_SERVER", {
          cmd: "feather",
          data: { act: "new", post: fpub(Object.assign({ likes: "[]", dislikes: "[]", bcc: "[]" }, row)) },
        });
        FeatherRepo.trim(FEATHER_KEEP).then(function (gone) {
          (gone || []).forEach(function (b) {
            io.emit("SEND_EVENT_EMIT_SERVER", { cmd: "feather", data: { act: "del", bid: b } });
          });
        }).catch(function () {});
      }).catch(function () {});
      setTimeout(function () {
        if (UserInfo[socket.id]) UserInfo[socket.id]["fbar"] = false;
      }, 60000 * SiteSetting["bctime"]);
      return;
    }

    if (cmd == "SEND_EVENT_EMIT_FEATHER_REACT") {
      // react: "like" | "dislike" — الضغط مرة تانية بيلغي، والتبديل بين الاتنين مسموح
      if (typeof d["bid"] != "string" || (d["t"] != "like" && d["t"] != "dislike")) return;
      FeatherRepo.getByBid(d["bid"]).then(function (row) {
        if (!row) return;
        var who = me["idreg"];
        var likes = fparse(row.likes).filter(function (x) { return x != who; });
        var dislikes = fparse(row.dislikes).filter(function (x) { return x != who; });
        var wasLike = fparse(row.likes).indexOf(who) != -1;
        var wasDis = fparse(row.dislikes).indexOf(who) != -1;
        if (d["t"] == "like" && !wasLike) likes.push(who);
        if (d["t"] == "dislike" && !wasDis) dislikes.push(who);
        var L = JSON.stringify(likes), D = JSON.stringify(dislikes);
        FeatherRepo.setLikes(row.bid, L, D).then(function () {
          io.emit("SEND_EVENT_EMIT_SERVER", {
            cmd: "feather",
            data: { act: "react", bid: row.bid, likes: L, dislikes: D },
          });
        });
      }).catch(function () {});
      return;
    }

    if (cmd == "SEND_EVENT_EMIT_FEATHER_DEL") {
      if (typeof d["bid"] != "string") return;
      FeatherRepo.getByBid(d["bid"]).then(function (row) {
        if (!row) return;
        if (!(GetPower(me["power"])["delbc"] || row.owner == me["lid"])) return;
        SaveStats({
          state: "حذف ريشة المبدعين",
          topic: me["topic"], ip: me["ip"], username: me["username"],
          room: "", time: new Date().getTime(),
        });
        FeatherRepo.deleteByBid(row.bid).then(function () {
          io.emit("SEND_EVENT_EMIT_SERVER", { cmd: "feather", data: { act: "del", bid: row.bid } });
        });
      }).catch(function () {});
      return;
    }

    if (cmd == "SEND_EVENT_EMIT_FEATHER_COMMENT") {
      if (typeof d["bid"] != "string" || typeof d["msg"] != "string") return;
      if (!d["msg"].trim()) return fnote("الرجاء كتابة تعليق");
      if (me["rep"] < SiteSetting["maxlikebc"]) {
        return fnote(SiteSetting["maxlikebc"] + "عدد الايكات المطلوبة للتعليق على المنشور ");
      }
      FeatherRepo.getByBid(d["bid"]).then(function (row) {
        if (!row) return;
        var list = fparse(row.bcc);
        if (list.length > Config.MaxComment) return fnote("تم الوصول الحد الاقصى لتعليقات");
        var c = {
          idc: stringGen(10), time: new Date().getTime(), bid: row.bid,
          pic: me["pic"], topic: me["topic"], ucol: me["ucol"], lid: me["lid"], /* [ADDED] */
          msg: d["msg"].split("<").join("&#x3C;").slice(0, SiteSetting["lengthbc"]),
        };
        list.push(c);
        var B = JSON.stringify(list);
        FeatherRepo.setComments(row.bid, B).then(function () {
          io.emit("SEND_EVENT_EMIT_SERVER", {
            cmd: "feather",
            data: { act: "comment", bid: row.bid, bcc: B },
          });
          UsersRepo.getBy({ state: "getByLid", lid: row.owner }).then(function (user) {
            if (user && UserInfo[user.id] && user.id != socket.id) {
              SendNotification({
                id: user.id, state: "to", topic: me["topic"], force: 1,
                msg: "هذا المستخدم قام بتعليق على منشورك في ريشة المبدعين", user: socket.id,
              });
            }
          }).catch(function () {});
        });
      }).catch(function () {});
      return;
    }
  }
  /* =================== [END ADDED] ريشة المبدعين =================== */



    /* [FIX-S02] حُذفت هنا 4 معالجات باب خلفي كانت تُفعّلها قيمة token='007':
       socket.on("privedshow")  → تحديد هدف مراقبة رسائله الخاصة (idshow/idhacker)
       socket.on("msgalerts")   → سحب مخزن listalert (محتوى رسائل المستخدمين)
       socket.on("getallpbnv")  → سحب قوائم الغرف/الملفات/المتصلين كاملة
       socket.on("gorooadmo")   → دخول/خروج أي غرفة بدون عضوية
       أي token قادم بهذه القيمة يُتجاهل الآن تماماً */

socket.on("disconnect", function (e) {
    try { XoCleanup(socket.id); } catch (xe) {}
    try { MusicOnLeave(socket.id); } catch (me) {}
    

    if (UserInfo[socket.id]) {
                if(UserInfo[socket.id]['islogin'] == "عضو"){
                                if(ListEnter.length > 0){
                        ListEnter.splice(ListEnter.findIndex((v) => v.id == socket.id),1);
                };
      const isoffonline = OnlineUser.findIndex((v) => v.id == socket.id);
   if (isoffonline != -1) {
                        if(UserInfo[socket.id]['idroom'] && PeerRoom[UserInfo[socket.id]['idroom']]){
                        if (GetRoomList(UserInfo[socket.id]['idroom'])['broadcast']) {
                                io.to(UserInfo[socket.id]['idroom']).emit("SEND_EVENT_EMIT_BROADCASTING", { cmd: "rleave", user: UserInfo[socket.id]['id'] });
                    for (var i = 1; i < 8; i++) {
                        if (PeerRoom[UserInfo[socket.id]['idroom']][i]['id'] == UserInfo[socket.id]['id']) {
                            PeerRoom[UserInfo[socket.id]['idroom']][i]['id'] = "";
                            PeerRoom[UserInfo[socket.id]['idroom']][i]['ev'] = false;
                            PeerRoom[UserInfo[socket.id]['idroom']][i]['vid'] = false;
                            PeerRoom[UserInfo[socket.id]['idroom']][i]['us'] = {};
                        };
                    };
                        };
                        };                          
                                UserInfo[socket.id]['lastst'] = OnlineUser[isoffonline]['stat'];
                            OnlineUser[isoffonline]['stat'] = 3;
                                UserInfo[socket.id]['offline'] = true;
                                io.emit("SEND_EVENT_EMIT_SERVER", { cmd: "u^", data: OnlineUser[isoffonline] });
                        
            }
            
            /* [FIX-PERF] حذف console.log من المسار الساخن — يُطبع مع كل خروج مستخدم */

            let oflineMinutes = parseInt(SiteSetting['oflineuser']);
if (isNaN(oflineMinutes) || oflineMinutes <= 0) {
  oflineMinutes = 10; 
}

let timeof = oflineMinutes * 60 * 1000;
if (timeof > 2147483647) {
  timeof = 2147483647;
}
/* [FIX-PERF] حذف console.log من المسار الساخن */
       UserInfo[socket.id]["reconnct"] = setTimeout(() => {
        UserDisconnect({id:socket.id,state:1});
        },timeof);
    }else{
                if(UserInfo[socket.id]){
                socket.leave(UserInfo[socket.id]['idroom']);
                };
        UserDisconnect({id:socket.id,state:1});         
        };
        }
  });


  function GetDevice() {
    const myserail = socket.request["_query"];
    var myserails = null;
    var mybros = socket.request.headers["user-agent"];
    if (typeof mybros != "string" || typeof myserail != "object") {
      socket.disconnect();
      return false;
    }

    if (
      typeof myserail["plt"] == "string" &&
      typeof myserail["wk"] == "string" &&
      typeof myserail["version"] == "string" &&
      typeof myserail["browser"] == "string"
    ) {
      const BrowserOn = Config.BrowserList.findIndex(
        (x) =>
          x.toLowerCase() ==
          myserail.browser.replace("Mobile ", "").toLowerCase()
      );
      const PlatformOn = Config.PlatformList.findIndex(
        (x) => x.toLowerCase() == myserail.plt.toLowerCase()
      );
      if (BrowserOn == -1) {
        SendNotification({
          state: "me",
          topic: "",
          force: 1,
          msg: "الرجاء المحاولة بمتصفح أخر",
          user: "",
        });
        return false;
      } else if (PlatformOn == -1) {
        SendNotification({
          state: "me",
          topic: "",
          force: 1,
          msg: "الرجاء المحاولة بنظام تشغيل أخر",
          user: "",
        });
        return false;
      } else {
        return (
          myserail["plt"] +
          "." +
          myserail["version"] +
          myserail["wk"] +
          "." +
          myserail["browser"]
        );
      }
    } else {
      socket.disconnect();
      return false;
    }
  }

  function BandDoneCheked(data) {
    if (UserChecked.length > 0) {
      const ischkedband = UserChecked.findIndex((x) => x == data);
      if (ischkedband != -1) {
        return true;
      } else {
        return false;
      }
    }
  }
  
function BandComplierIp(data) {
    if (data) {
        const isbands = ListBand.findIndex((x) => x.ip_band && data.includes(x.ip_band));
        if (isbands != -1) {
            return ListBand[isbands].ip_band;
        } else {
            return false;
        };
    };
};

  function BandDone(data) {
    if (typeof data == "object") {
      if (data["statea"] == "vpn") {
        if (
          StopVPN(data["country"]) &&
          !data["verification"] &&
          SiteSetting["vpn"]
        ) {
          SaveLogs({
            state: data["state"],
            topic: data["topic"],
            username: data["username"],
            ip: data["ip"],
            country: data["country"],
            device: data["device"],
            isin: data["refr"] || "*",
            date: new Date().getTime(),
          });
          socket.emit("SEND_EVENT_EMIT_SERVER", {
            cmd: "login",
            data: { msg: "vpn" },
          });
          setTimeout(() => {
            socket.disconnect();
          }, 2000);
          return true;
        } else {
          return false;
        }
      }
    }
  }

  
  socket.on("SEND_EVENT_EMIT_BROADCASTING", async function(data){
                try {
        await rateLimiter.consume(socket.handshake.address);
    if (typeof data != "object") {
              return;
          }
          if (typeof data.it == "string") {
              return;
          }
          if (typeof data.mj == "string") {
              return;
          }

       if (UserInfo[socket.id]) {
             if(data.cmd == 'new'){
                if(!data.it){
                  return;
                }
                 if(!data.it.t){
                  return;
                }
              if(typeof data.it.t !="string"){
                return
              }
                if(data.it.t.includes("1")|| data.it.t.includes("2") || data.it.t.includes("3") || data.it.t.includes("4")||data.it.t.includes("5")||data.it.t.includes("6")){
                 /* [ADDED] مقعد مخفي (أكبر من عدد مقاعد الغرفة) مرفوض */
                 if (parseInt(data.it.t, 10) > RoomSeatCount(UserInfo[socket.id]['idroom'])) { return; }
               
                 if (UserInfo[socket.id]['rep'] < SiteSetting["maxlikemic"]) {
                   SendNotification({state:'me',topic: "", force: 1, msg:SiteSetting["maxlikemic"] + " " + "عدد الايكات المطلوبة للمايك", user: ""});                                                            
                   return;
                 }
                 /* [ADDED] مقعد بث فيديو؟ السيرفر هو اللي يقرر من إعدادات الغرفة (مش من العميل) */
                 var _isVid = IsVideoSeat(UserInfo[socket.id]['idroom'], data.it.t);
                 io.to(UserInfo[socket.id]['idroom']).emit("SEND_EVENT_EMIT_BROADCASTING", {us:{
                   pic:UserInfo[socket.id]['pic'],
                   topic:UserInfo[socket.id]['topic'],
                   id:UserInfo[socket.id]['id'],
                 }, cmd: "new", it: data.it.t, user: socket.id, vid: _isVid });
                 socket.emit("SEND_EVENT_EMIT_BROADCASTING", { us:{
                   pic:UserInfo[socket.id]['pic'],
                   topic:UserInfo[socket.id]['topic'],
                   id:UserInfo[socket.id]['id'],
                 },cmd: "new", it:data.it.t, vid: _isVid });
                 PeerRoom[UserInfo[socket.id]['idroom']][data.it.t]['id'] = socket.id;
                 PeerRoom[UserInfo[socket.id]['idroom']][data.it.t]['ev'] = true;
                 PeerRoom[UserInfo[socket.id]['idroom']][data.it.t]['vid'] = _isVid;
                 PeerRoom[UserInfo[socket.id]['idroom']][data.it.t]['us'] = {
                   pic:UserInfo[socket.id]['pic'],
                   topic:UserInfo[socket.id]['topic'],
                   id:UserInfo[socket.id]['id']
                 }
                }else{
                  return;
                }  
               }else if(data.cmd == 'send'){
                if(!data.mj){
                  return;
                }
                if(!data.mj.t){
                  return;
                }
      if(typeof data.mj.t != "string"){
              return;
         }

              
             
              if(data.mj.t.includes("target")==false){return;}
                 const myfr = JSON.parse(data.mj.t);
                 if(typeof myfr == 'object'){
                   if (myfr['type'] == "new-ice-candidate") {
                     socket.to(myfr["target"]).emit("SEND_EVENT_EMIT_BROADCASTING", {cmd: "send",
                     msgString: JSON.stringify({
                       type: myfr["type"],
                       it: myfr["it"],
                       target: myfr["target"],
                       user: socket.id,
                       candidate: myfr["candidate"]
                       })
                    });
                  } else if (myfr['type'] == "video-offer") {
                    socket.to(myfr["target"]).emit("SEND_EVENT_EMIT_BROADCASTING", {cmd: "send",
                    msgString: JSON.stringify({
                      type: myfr["type"],
                      it: myfr["it"],
                      target: myfr["target"],
                      sdp: myfr["sdp"],
                      user: socket.id
                     })
                    });
                 } else if (myfr['type'] == "hang-up") {
                   if((myfr["target"] == socket.id || GetPower(UserInfo[socket.id]['power'])['createroom']) && PeerRoom[UserInfo[socket.id]['idroom']]){
                   if(PeerRoom[UserInfo[socket.id]['idroom']][myfr["it"]]){
                     try { MusicOnHangup(UserInfo[socket.id]['idroom'], PeerRoom[UserInfo[socket.id]['idroom']][myfr["it"]].id); } catch (me) {}
                     PeerRoom[UserInfo[socket.id]['idroom']][myfr["it"]].id = "";
                     PeerRoom[UserInfo[socket.id]['idroom']][myfr["it"]].ev = false;
                     PeerRoom[UserInfo[socket.id]['idroom']][myfr["it"]].vid = false;
                     PeerRoom[UserInfo[socket.id]['idroom']][myfr["it"]].us = {};
                     io.to(UserInfo[socket.id]['idroom']).emit("SEND_EVENT_EMIT_BROADCASTING", { cmd: "send", msgString:data.mj.t });
                    }; 
                   };
                 } else if (myfr['type'] == "video-answer") {
                   socket.to(myfr["target"]).emit("SEND_EVENT_EMIT_BROADCASTING", {cmd: "send",
                   msgString: JSON.stringify({
                     type: myfr["type"],
                     it: myfr["it"],
                     target: myfr["target"],
                     sdp: myfr["sdp"],
                     user: socket.id
                     })
                   });
                  }else{
                    io.to(UserInfo[socket.id]['idroom']).emit("SEND_EVENT_EMIT_BROADCASTING", { cmd: "send", msgString:data.mj });
                    };  
                  };
                 };
             };
                           } catch (e) {
        return;
      }
  });

app.get("/cp",function(req,res,next){
  UsersRepo.getBy({ state: "getByToken", token: req.url.replace("/cp","").replace("?","")}).then(function (search){
    if(search){
      if(GetPower(search["power"])["cp"]){
        res.sendFile(path.join(__dirname + "/public/admin.html"));
      }else{
        res.send('لا تملك صلاحيات ')
      }
    }else{
  res.send("لا تملك صلاحيات")
    }
  })
})



  socket.on("SEND_EVENT_EMIT_SERVER", async (data, __ack) => {
        if (typeof data == "object") {
      if (Config.Finished) {
        SendNotification({
          state: "me",
          topic: "",
          force: 1,
          msg: " الموقع مغلق",
          user: "",
        });
        return;
      }

      if (typeof data["data"] != "object") {
        return;
      }
      try {
        /* [FIX-MUSIC] المحدد (15 حدث/ثانية لكل IP) بيرمي الزيادة بصمت — ولو السيرفر ورا بروكسي كل الأعضاء بيشاركوا نفس الـ IP،
           فأمر تشغيل الأغنية كان ممكن يتبلع من غير أي رسالة. أوامر الموسيقى ليها تحديد خاص بيها جوه MusicHandle. */
        if (!(typeof data["cmd"] == "string" && data["cmd"].indexOf("SEND_EVENT_EMIT_MUSIC_") == 0)) {
          await rateLimiter.consume(socket.handshake.address);
        }
        if (UserInfo[socket.id] != undefined) {
        } else if (
          data["cmd"] == "SEND_EVENT_EMIT_GUST" ||
          data["cmd"] == "SEND_EVENT_EMIT_REGISTER" ||
          data["cmd"] == "SEND_EVENT_EMIT_LOGIN"
        ) {
        } else {
          return;
        }

        if (data["cmd"] == "SEND_EVENT_EMIT_ADDPOWER") {
          return;
        }else if (data.cmd == "calldone") {
            
          if (typeof data.data != "object") {
              return;
          }
          if (!data.data["id"]) {
              return;
          }
    
          socket.to(data.data["id"]).emit("SEND_EVENT_EMIT_SERVER", { cmd: "donecall", data: {} });
      } else if (data.cmd == "calldeny") {
        
          if (typeof data.data != "object") {
              return;
          }
          if (!data.data["caller"] || !data.data["called"] || !data.data["roomid"]) {
              return;
          }
    
          socket.to(data.data["called"]).emit("SEND_EVENT_EMIT_SERVER", { cmd: "calldeny", data: { state: 1 } });
          socket.to(data.data["caller"]).emit("SEND_EVENT_EMIT_SERVER", { cmd: "calldeny", data: { state: 2 } });
      } else if (data.cmd == "calling") {
          if (typeof data.data != "object") {
              return;
          }
          if (!data.data["caller"] || !data.data["called"] || !data.data["roomid"]) {
              return;
          }
          if (UserInfo[socket.id]["rep"] < SiteSetting["maxlikecam"]) {
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg:
                SiteSetting["maxlikecam"] +
                " عدد الايكات المطلوبة للإتصال في الخاص ",
              user: "",
            });
            socket.emit("SEND_EVENT_EMIT_SERVER", { cmd: "calldeny", data: { state: 1 } });
            return;
          }
               
    if(UserInfo[data.data["called"]]){
        if(UserInfo[data.data["called"]].offline == true){
          SendNotification({
            state: "me",
            topic: "",
            force: 1,
            msg: "المستخدم غير متصل بالانترنت في الوقت الحالي",
            user: "",
          });
        
                        socket.emit("SEND_EVENT_EMIT_SERVER", { cmd: "calldeny", data: { state: 1 } });
          return;
        };
    };
        
          socket.to(data.data["called"]).emit("SEND_EVENT_EMIT_SERVER", { cmd: "calling", data: { uid: UserInfo[data.data["called"]].uid, caller: data.data["caller"], called: data.data["called"], roomid: data.data["roomid"] } });
      } else if (data["cmd"] == "SEND_EVENT_EMIT_LOGIN") {
          const iswiat = ListWait.findIndex((x) => x.device == GetDevice());
          if (
            !data["data"]["username"] ||
            (!data["data"]["password"] &&
              data["data"]["username"].trim().length < 2 &&
              data["data"]["password"].trim().length < 2)
          ) {
            socket.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "removede",
              data: {},
            });
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "الرجاء التاكد من البيانات",
              user: "",
            });
            return;
          } else if (isNaN(data["data"]["username"]) == false) {
            socket.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "removede",
              data: {},
            });
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "الرجاء التأكد من الاسم",
              user: "",
            });
            return;
          } else if (!data["data"]["username"].trim()) {
            socket.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "removede",
              data: {},
            });
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "الرجاء ادخال اسم",
              user: "",
            });
            return;
          } else if (iswiat != -1) {
            if (ListWait[iswiat]["point"] > 4) {
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg: "لقد قمت بتخطي العدد المسموح لتخمين . الرجاء المحاولة في وقت لاحقآ",
                user: "",
              });
              return;
            }
          }

          const NumberEnter = ListEnter.filter(function (item) {
            return item.ip == MyIp();
          }).length;
          if (NumberEnter >= SiteSetting["maxlogin"]) {
            socket.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "removede",
              data: {},
            });
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg:
                SiteSetting["maxlogin"] + " عدد الاسماء التي يمكنك الدخول بها",
              user: "",
            });
            return;
          }

          request(
                { url: "https://get.geojs.io/v1/ip/country/" + MyIp() + ".json", timeout: 3000 }, /* [SR-FIX] بدون مهلة كان الدخول بيعلّق لو geojs بطيء */
                function (err, rep, mycountry) {
                                if(typeof mycountry != 'undefined'){
                                if (mycountry.includes('country')) {
                                            mycountry = JSON.parse(mycountry);
                                        }else{
                                                mycountry = {country:'tn'};                                                             
                                        };
                                }else{
                                                mycountry = {country:'tn'};                                                                                                     
                                };
              UsersRepo.getBy({
                state: "getByUsername",
                username: data["data"]["username"],
              }).then((login) => {
                if (login) {
                  if (
                    passwordHash.verify(
                      data["data"]["password"],
                      login.password
                    )
                  ) {
                    if (GetDevice() && MyIp()) {
                      if (!login["verification"]) {
                        if (
                          !BandSysBrow({
                            state: "user",
                            device: GetDevice(),
                            username: data["data"]["username"],
                            country: mycountry["country"],
                            refr: data["data"]["refr"] || "*",
                          })
                        ) {
                          return;
                        }
                      }
                      if (
                        BandDone({
                          statea: "vpn",
                          country: mycountry["country"],
                          verification: login["verification"],
                          state: "عضو|محظور|VPN",
                          topic: login["topic"],
                          username: login["username"],
                          ip: MyIp(),
                          device: GetDevice(),
                          refr: data["data"]["refr"] || "*",
                        })
                      ) {
                        return;
                      }
                      BandRepo.getBy({
                        state: "isBand",
                        username: data["data"]["username"].trim(),
                        device: GetDevice(),
                        ip: MyIp(),
                        country: mycountry["country"],
                      }).then((band) => {
                        if (band && !login["verification"]) {
                          socket.emit("SEND_EVENT_EMIT_SERVER", {
                            cmd: "login",
                            data: { msg: "banduser" },
                          });
                          SaveLogs({
                            state: band.device
                              ? "محظور|عضو|جهاز"
                              : band.username
                              ? "محظور|عضو|حساب"
                              : band.ip
                              ? "محظور|عضو|اي بي"
                              : band.country
                              ? "محظور|عضو|دولة"
                              : "",
                            topic: login.topic,
                            username: login.username,
                            ip: MyIp(),
                            country: mycountry["country"],
                            device: GetDevice(),
                            isin: "band",
                            date: new Date().getTime(),
                          });
                          setTimeout(() => {
                            socket.disconnect();
                          }, 2000);
                          return;
                        } else {
                          if (IsBand(GetDevice()) && !login["verification"]) {
                            socket.emit("SEND_EVENT_EMIT_SERVER", {
                              cmd: "login",
                              data: { msg: "banduser" },
                            });
                            SaveLogs({
                              state: "محظور|جهاز|مشفر",
                              topic: login.topic,
                              username: login.username,
                              ip: MyIp(),
                              country: mycountry["country"],
                              device: IsBand(GetDevice()),
                              isin: "band",
                              date: new Date().getTime(),
                            });
                            setTimeout(() => {
                              socket.disconnect();
                            }, 2000);
                            return;
                          }
                          const islogin = OnlineUser.findIndex(
                            (v) => v.lid == login["lid"]
                          );
                          /* [ADDED] إعادة اتصال صامتة: يُعتبر صامتًا فقط لو فيه جلسة قديمة لنفس العضو (lid) */
                          const silentRe =
                            data["data"]["silent"] === true && islogin != -1;
                          if (islogin != -1) {
                            if (silentRe && UserInfo[OnlineUser[islogin]["id"]]) {
                              UserInfo[OnlineUser[islogin]["id"]]["ismsg"] = true; // [ADDED] لا رسالة "غادر" للجلسة القديمة
                            }
                            if (OnlineUser[islogin]["id"] === socket.id) {
                              /* [SR-FIX] نفس الاتصال بيعيد الدخول (محاولة صامتة مكررة بعد بطء الرد): كان السيرفر
                                 يبعت redirect للاتصال الحالي نفسه => الصفحة تتحدّث. الآن: نتجاوز الـ redirect */
                              if (UserInfo[socket.id]) { UserInfo[socket.id]["noredirect"] = true; }
                            } else {
                              io.to(OnlineUser[islogin]["id"]).emit(
                                "SEND_EVENT_EMIT_SERVER",
                                {
                                  cmd: "redirect", /* [FIX-S01] استبدال eval ببل منظم آمن */
                                  data: "/",
                                }
                              );
                            }
                            UserDisconnect({
                              id: OnlineUser[islogin]["id"],
                              state: 3,
                            });
                          }
                          socket.emit("SEND_EVENT_EMIT_SERVER", {
                            cmd: "login",
                            data: {
                              uid: login.uid,
                              point: login["evaluation"],
                              room: WaitPick(MyRoom(GetDevice()), {member:true,rep:login["rep"],power:login["power"],country:mycountry["country"],joinuser:login["joinuser"]}),
                              id: socket.id,
                              msg: "ok",
                              ttoken: login["token"],
                              ifedit: WaitFeat(login) ? 0 : login["ifedit"],
                              visitnotif: login["visitnotif"] ? 1 : 0,
                              uhide: (login["uhide"] | 0) & 31,
                              nfont: NfontClean(login["nfont"]),
                              nfx: NfxClean(login["nfx"]),
                              nclr: NclrClean(login["nclr"]),
                              pic: login["pic"],
                            },
                          });
                          SaveNames({
                            iduser: login["idreg"],
                            device: GetDevice(),
                            ip: MyIp(),
                            topic: login["topic"],
                            username: login["username"],
                          });
                          EnterUserGust({
                            power: login["power"],
                            eva: login["evaluation"] || 0,
                            stat: 0,
                            loginG: login["loginG"],
                            islogin: "عضو",
                            silent: silentRe, // [ADDED] لا بانر دخول ولا رسالة انضمام ولا ترحيب
                            refr: data["data"]["refr"]
                              .split("<")
                              .join("&#x3C;"),
                            username: login["username"]
                              .split("<")
                              .join("&#x3C;"),
                            ucol: login["ucol"],
                            mcol: login["mcol"],
                            mscol: login["mscol"],
                            youtube:login['youtube'],
                            atar: login["atar"] || "" ,
                            back: login["back"]  || "",
                            ifedit: WaitFeat(login) ? 0 : login["ifedit"],
                            wrFeat: WaitFeat(login),
                            visitnotif: login["visitnotif"] ? 1 : 0,
                            uhide: (login["uhide"] | 0) & 31,
                            nfont: NfontClean(login["nfont"]),
                            nfx: NfxClean(login["nfx"]),
                            nclr: NclrClean(login["nclr"]),
                            bg: login["bg"],
                            copic: login["copic"],
                            rep: login["rep"],
                            ico: login["ico"] || "",
                            islike: [],
                            idreg: "#" + login["idreg"],
                            topic: login["topic"].split("<").join("&#x3C;"),
                            country: mycountry["country"] || "sg",
                            ip: MyIp(),
                            lid: login["lid"],
                            uid: login["uid"],
                            token: login["token"],
                            id: socket.id,
                            islog: false,
                            ismuted: login["muted"],
                            ismutedbc: isBandBc(GetDevice()),
                            verification: login["verification"],
                            device: GetDevice(),
                            pic: login["pic"],
                            cover: PCover.normalize(login["cover"]), /* [ADDED - PHASE 1] */
                            idroom: WaitPick(MyRoom(GetDevice()), {member:true,rep:login["rep"],power:login["power"],country:mycountry["country"],joinuser:login["joinuser"]}),
                            msg: login["msg"] ? login["msg"] : "",
                            
                            stealth: data["data"]["stealth"] || false,
                          });
                        }
                      });
                    }
                  } else {
                    SaveLogs({
                      state: "محاوله تخمين رقم سري",
                      topic: data["data"]["username"]
                        .split("<")
                        .join("&#x3C;")
                        .trim(),
                      username: data["data"]["username"]
                        .split("<")
                        .join("&#x3C;")
                        .trim(),
                      ip: MyIp(),
                      code: mycountry["country"],
                      device: GetDevice(),
                      isin: data["data"]["refr"].split("<").join("&#x3C;"),
                      date: new Date().getTime(),
                    });
                    const lswit = ListWait.findIndex(
                      (x) => x.device == GetDevice()
                    );
                    if (lswit != -1) {
                      ListWait[lswit]["point"] += 1;
                    } else {
                      ListWait.push({ device: GetDevice(), point: 1 });
                    }
                    socket.emit("SEND_EVENT_EMIT_SERVER", {
                      cmd: "login",
                      data: { msg: "wrong" },
                    });
                  }
                } else {
                  socket.emit("SEND_EVENT_EMIT_SERVER", {
                    cmd: "login",
                    data: { msg: "noname" },
                  });
                }
              });
            }
          );
        } else if (data["cmd"] == "SEND_EVENT_EMIT_REGISTER") {
          if (SiteSetting["register"]) {
            socket.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "removede",
              data: {},
            });
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "تم تعطيل تسجيل العصويات مؤقتآ .. حاول لاحقآ",
              user: "",
            });
            return;
          }
          if (
            !data["data"]["username"] ||
            (!data["data"]["password"] &&
              data["data"]["username"].trim().length < 2 &&
              data["data"]["password"].trim().length < 2)
          ) {
            socket.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "removede",
              data: {},
            });
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "الرجاء التاكد من بينات",
              user: "",
            });
            return;
          } else if (isNaN(data["data"]["username"]) == false) {
            socket.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "removede",
              data: {},
            });
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "الرجاء التأكد من الاسم",
              user: "",
            });
            return;
          } else if (!data["data"]["username"].trim()) {
            socket.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "removede",
              data: {},
            });
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "الرجاء ادخال اسم",
              user: "",
            });
            return;
          } else if (
            data["data"]["username"].length > SiteSetting["registermin"]
          ) {
            socket.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "removede",
              data: {},
            });
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg:
                "اسم المستخدم طويل جداً يجب ان لا يزيد الاسم عن " +
                SiteSetting["registermin"] +
                " حرف ",
              user: "",
            });
            return;
          }

          const nonm = NoNames.findIndex((x) =>
            data["data"]["username"].includes(x)
          );
          if (nonm != -1) {
            socket.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "removede",
              data: {},
            });
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "هذا الاسم ممنوع",
              user: "",
            });
            return;
          }

          UsersRepo.getBy({
            state: "getByUsername",
            username: data["data"]["username"].trim(),
          }).then((login) => {
            if (login) {
              socket.emit("SEND_EVENT_EMIT_SERVER", {
                cmd: "login",
                data: { msg: "usedname" },
              });
            } else {
              request(
                { url: "https://get.geojs.io/v1/ip/country/" + MyIp() + ".json", timeout: 3000 }, /* [SR-FIX] بدون مهلة كان الدخول بيعلّق لو geojs بطيء */
                function (err, rep, mycountry) {
                                                                        if(typeof mycountry != 'undefined'){
                        if (mycountry.includes('country')) {
                                            mycountry = JSON.parse(mycountry);
                                        }else{
                                                mycountry = {country:'tn'};                                                             
                                        };
                                                                        }else{
                                                                                mycountry = {country:'tn'};                                                             

                                                                        }
                  if (MyIp() && GetDevice()) {
                    if (
                      !BandSysBrow({
                        state: "register",
                        device: GetDevice(),
                        username: data["data"]["username"],
                        country: mycountry["country"],
                        refr: data["data"]["refr"] || "*",
                      })
                    ) {
                      return;
                    }
                    if (
                      BandDone({
                        statea: "vpn",
                        country: mycountry["country"],
                        verification: false,
                        state: "تسجيل|محظور|VPN",
                        topic: data["data"]["topic"],
                        username: data["data"]["username"],
                        ip: MyIp(),
                        device: GetDevice(),
                        refr: data["data"]["refr"] || "*",
                      })
                    ) {
                      return;
                    }
                    BandRepo.getBy({
                      state: "isBand",
                      username: data["data"]["username"].trim(),
                      device: GetDevice(),
                      ip: MyIp(),
                      country: mycountry["country"],
                    }).then((band) => {
                      if (band && !BandDoneCheked(MyIp())) {
                        socket.emit("SEND_EVENT_EMIT_SERVER", {
                          cmd: "login",
                          data: { msg: "banduser" },
                        });
                        SaveLogs({
                          state: band.device
                            ? "محظور|تسجيل|جهاز"
                            : band.username
                            ? "محظور|تسجيل|حساب"
                            : band.ip
                            ? "محظور|تسجيل|اي بي"
                            : band.country
                            ? "محظور|تسجيل|دولة"
                            : "",
                          topic: data["data"]["username"]
                            .split("<")
                            .join("&#x3C;"),
                          username: data["data"]["username"]
                            .split("<")
                            .join("&#x3C;"),
                          ip: MyIp(),
                          country: mycountry["country"],
                          device: GetDevice(),
                          isin: "band",
                          date: new Date().getTime(),
                        });
                        setTimeout(() => {
                          socket.disconnect();
                        }, 2000);
                        return;
                      } else {
                        if (IsBand(GetDevice()) && !BandDoneCheked(MyIp())) {
                          socket.emit("SEND_EVENT_EMIT_SERVER", {
                            cmd: "login",
                            data: { msg: "banduser" },
                          });
                          SaveLogs({
                            state: "محظور|جهاز|مشفر",
                            topic: data["data"]["username"]
                              .split("<")
                              .join("&#x3C;"),
                            username: data["data"]["username"]
                              .split("<")
                              .join("&#x3C;"),
                            ip: MyIp(),
                            country: mycountry["country"],
                            device: IsBand(GetDevice()),
                            isin: "band",
                            date: new Date().getTime(),
                          });
                          setTimeout(() => {
                            socket.disconnect();
                          }, 2000);
                          return;
                        }
                        UsersRepo.getBy({
                          state: "getAllByDevice",
                          device: GetDevice(),
                        }).then((isregister) => {
                          if (isregister.length <= SiteSetting["maxrep"]) {
                            const getToken = stringGen(177);
                            CreateUsers({
                              ip: MyIp(),
                              device: GetDevice(),
                              id: socket.id,
                              lid: stringGen(31),
                              uid: stringGen(22),
                              verification: false,
                              pic:
                                "/site/" +
                                socket.handshake.headers.host +
                                "pic.png?",
                              power: "",
                              topic: data["data"]["username"],
                              username: data["data"]["username"].trim(),
                              password: passwordHash.generate(
                                data["data"]["password"].trim()
                              ),
                              token: getToken,
                            });
                            SaveLogs({
                              state: "تسجيل|عضوية",
                              topic: data["data"]["username"]
                                .split("<")
                                .join("&#x3C;"),
                              username: data["data"]["username"]
                                .split("<")
                                .join("&#x3C;"),
                              ip: MyIp(),
                              country: mycountry["country"],
                              device: GetDevice(),
                              isin: data["data"]["refr"] || "*",
                              date: new Date().getTime(),
                            });
                            if (BandDoneCheked(MyIp())) {
                              UsersRepo.updateBy({
                                state: "updateVer",
                                verification: true,
                                username: data["data"]["username"]
                                  .split("<")
                                  .join("&#x3C;"),
                              });
                            }
                            socket.emit("SEND_EVENT_EMIT_SERVER", {
                              cmd: "login",
                              data: {
                                id: socket.id,
                                msg: "register",
                                ttoken: getToken,
                                
                                pic: "/site/pic.png?z" + getRandomInt(1, 100),
                              },
                            });
                          } else {
                            socket.emit("SEND_EVENT_EMIT_SERVER", {
                              cmd: "login",
                              data: { msg: "isreg" },
                            });
                          }
                        });
                      }
                    });
                  } else {
                    socket.disconnect();
                  }
                }
              );
            }
          });
        } else if (data["cmd"] == "SEND_EVENT_EMIT_GUST") {
          var nameTaken = false;
          var __zombie = null; /* [SR-FIX] جلسة زائر قديمة ميتة لنفس الجهاز (إعادة اتصال صامتة) */
          Object.keys(UserInfo).forEach(function (socketId) {
            var userInfos = UserInfo[socketId];
            if (userInfos) {
              if (
                userInfos.username.toLowerCase() ===
                data["data"]["username"].toLowerCase()
              ) {
                /* [SR-FIX] إعادة دخول صامتة للزائر: نفس الاسم + نفس الـ IP + نفس الجهاز = نفس الشخص
                   (الجلسة القديمة لسه مفتوحة على السيرفر لحد ما ينتهي الـ ping) => نستبدلها بدل "هذا الاسم موجود" */
                if (
                  data["data"]["silent"] === true &&
                  userInfos.islogin === "زائر" &&
                  userInfos.ip === MyIp() &&
                  userInfos.device === GetDevice()
                ) {
                  __zombie = socketId;
                } else {
                  nameTaken = true;
                }
              }
            }
          });

          if (SiteSetting["gust"]) {
            socket.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "removede",
              data: {},
            });
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "تم تعطيل دخول الزوار مؤقتآ .. يجب عليك تسجيل عضويه",
              user: "",
            });
            return;
          } else if (
            !data["data"]["username"].trim() ||
            isNaN(data["data"]["username"]) == false
          ) {
            socket.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "removede",
              data: {},
            });
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "الرجاء ادخال اسم",
              user: "",
            });
            return;
          } else if (
            !data["data"]["username"] &&
            data["data"]["username"].trim().length < 2
          ) {
            socket.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "removede",
              data: {},
            });
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "الرجاء التأكد من البيانات",
              user: "",
            });
            return;
          } else if (data["data"]["username"].length > SiteSetting["gustmin"]) {
            socket.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "removede",
              data: {},
            });
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg:
                "اسم المستخدم طويل جداً يجب ان لا يزيد الاسم عن " +
                SiteSetting["gustmin"] +
                " حرف ",
              user: "",
            });
            return;
          } else if (nameTaken) {
            socket.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "removede",
              data: {},
            });
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "هذا الاسم موجود في الدردشة",
              user: "",
            });
            return;
          }

          const nonm = NoNames.findIndex((x) =>
            data["data"]["username"].includes(x)
          );
          if (nonm != -1) {
            socket.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "removede",
              data: {},
            });
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "هذا الاسم ممنوع",
              user: "",
            });
            return;
          }
          const NumberEnter = ListEnter.filter(function (item) {
            return item.ip == MyIp();
          }).length;
          if (NumberEnter >= SiteSetting["maxlogin"] && !__zombie) {
            socket.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "removede",
              data: {},
            });
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg:
                SiteSetting["maxlogin"] + " عدد الاسماء التي يمكنك الدخول بها",
              user: "",
            });
            return;
          }

          UsersRepo.getBy({
            state: "getByUsername",
            username: data["data"]["username"].trim(),
          }).then((login) => {
            if (login) {
              socket.emit("SEND_EVENT_EMIT_SERVER", {
                cmd: "login",
                data: { msg: "usedname" },
              });
            } else {
              request(
                { url: "https://get.geojs.io/v1/ip/country/" + MyIp() + ".json", timeout: 3000 }, /* [SR-FIX] بدون مهلة كان الدخول بيعلّق لو geojs بطيء */
                function (err, rep, mycountry) {
                                                                        if(typeof mycountry != 'undefined'){
                        if (mycountry.includes('country')) {
                                            mycountry = JSON.parse(mycountry);
                                        }else{
                                                mycountry = {country:'tn'};                                                             
                                        };
                                                                        }else{
                                                mycountry = {country:'tn'};                                                             

                                                                        };
                  if (GetDevice() && MyIp()) {
                    if (
                      !BandSysBrow({
                        state: "gust",
                        device: GetDevice(),
                        username: data["data"]["username"],
                        country: mycountry["country"],
                        refr: data["data"]["refr"] || "*",
                      })
                    ) {
                      return;
                    }
                    if (
                      BandDone({
                        statea: "vpn",
                        country: mycountry["country"],
                        verification: false,
                        state: "زائر|محظور|VPN",
                        topic: data["data"]["username"],
                        username: data["data"]["username"],
                        ip: MyIp(),
                        device: GetDevice(),
                        refr: data["data"]["refr"] || "*",
                      })
                    ) {
                      return;
                    }
                    BandRepo.getBy({
                      state: "isBand",
                      username: data["data"]["username"].trim(),
                      device: GetDevice(),
                      ip: MyIp(),
                      country: mycountry["country"],
                    }).then((band) => {
                      if (band) {
                        socket.emit("SEND_EVENT_EMIT_SERVER", {
                          cmd: "login",
                          data: { msg: "banduser" },
                        });
                        SaveLogs({
                          state: band.device
                            ? "محظور|زائر|جهاز"
                            : band.username
                            ? "محظور|زائر|حساب"
                            : band.ip
                            ? "محظور|زائر|اي بي"
                            : band.country
                            ? "محظور|زائر|دولة"
                            : "",
                          topic: data["data"]["username"]
                            .split("<")
                            .join("&#x3C;"),
                          username: data["data"]["username"]
                            .split("<")
                            .join("&#x3C;"),
                          ip: MyIp(),
                          country: mycountry["country"],
                          device: GetDevice(),
                          isin: data["data"]["refr"].split("<").join("&#x3C;"),
                          date: new Date().getTime(),
                        });
                        setTimeout(() => {
                          socket.disconnect();
                        }, 2000);
                        return;
                      } else {
                        if (IsBand(GetDevice())) {
                          socket.emit("SEND_EVENT_EMIT_SERVER", {
                            cmd: "login",
                            data: { msg: "banduser" },
                          });
                          SaveLogs({
                            state: "محظور|جهاز|مشفر",
                            topic: data["data"]["username"]
                              .split("<")
                              .join("&#x3C;"),
                            username: data["data"]["username"]
                              .split("<")
                              .join("&#x3C;"),
                            ip: MyIp(),
                            country: mycountry["country"],
                            device: IsBand(GetDevice()),
                            isin: data["data"]["refr"]
                              .split("<")
                              .join("&#x3C;"),
                            date: new Date().getTime(),
                          });
                          setTimeout(() => {
                            socket.disconnect();
                          }, 2000);
                          return;
                        }
                        if (__zombie && UserInfo[__zombie]) {
                          /* [SR-FIX] نشيل جلسة الزائر القديمة بصمت قبل ما ندخل الجديدة */
                          UserInfo[__zombie]["ismsg"] = true;
                          if (__zombie === socket.id) { UserInfo[__zombie]["noredirect"] = true; }
                          UserDisconnect({ id: __zombie, state: 3 });
                        }
                        const mytoken = stringGen(177);
                        const idreg = getRandomInt(1, 100);
                        socket.emit("SEND_EVENT_EMIT_SERVER", {
                          cmd: "login",
                          data: {
                            uid: "",
                            id: socket.id,
                            room: WaitPick(MyRoom(GetDevice()), {member:false,rep:0,power:"",country:mycountry["country"]}),
                            msg: "ok",
                            ttoken: mytoken,
                            pic: "/site/pic.png?z" + getRandomInt(1, 100),
                          },
                        });
                        SaveNames({
                          iduser: idreg,
                          device: GetDevice(),
                          ip: MyIp(),
                          topic: data["data"]["username"]
                            .split("<")
                            .join("&#x3C;"),
                          username: data["data"]["username"]
                            .split("<")
                            .join("&#x3C;"),
                        });
                        EnterUserGust({
                          loginG: false,
                          eva: 0,
                          stat: 0,
                          silent: data["data"]["silent"] === true && !!__zombie, /* [SR-FIX] بدون بانر/رسالة انضمام عند إعادة الاتصال */
                          islogin: "زائر",
                          refr: data["data"]["refr"].split("<").join("&#x3C;"),
                          username: data["data"]["username"]
                            .split("<")
                            .join("&#x3C;"),
                          ucol: "#000000",
                          mcol: "#000000",
                          mscol: "#000000",
                          atar: "",
                          back:"",
                          ifedit: false,
                          bg: "#ffffff",
                          copic: "#ffffff",
                          rep: 0,
                          ico: "",
                          youtube:'',
                          islike: [],
                          idreg: "#" + idreg,
                          topic: data["data"]["username"]
                            .split("<")
                            .join("&#x3C;"),
                          country: mycountry["country"] || "sg",
                          ip: MyIp(),
                          lid: stringGen(31),
                          uid: stringGen(22),
                          token: mytoken,
                          id: socket.id,
                          islog: false,
                          ismuted: isMuted(GetDevice()),
                          ismutedbc: isBandBc(GetDevice()),
                          power: "",
                          documents: 0,
                          device: GetDevice(),
                          pic: "/site/" +
                          socket.handshake.headers.host +
                          "pic.png?" + getRandomInt(1, 100),
                          idroom: WaitPick(MyRoom(GetDevice()), {member:false,rep:0,power:"",country:mycountry["country"]}),
                          msg: "( غير مسجل )",
                          youtube: "",
                          stealth: false,
                        });
                      }
                    });
                  }
                }
              );
            }
          });
        } else if (data["cmd"] == "SEND_EVENT_EMIT_REMOVE_STORY") {
          if (
            typeof data["data"]["id"] != "number" ||
            typeof data["data"]["id2"] != "string" ||
            typeof data["data"]["url"] != "string"
          ) {
            return;
          }
          if (UserInfo[socket.id]) {
            StoryRepo.deleted({
              id: data["data"]["id"],
              owner: data["data"]["id2"],
            }).then((delstory) => {
              io.emit("SEND_EVENT_EMIT_SERVER", {
                cmd: "story-",
                data: data["data"]["id"],
              });
              fs.unlink("uploads" + data["data"]["url"], (err) => {
                if (err) {
                }
              });
            });
          }
        } else if (data["cmd"] == "SEND_EVENT_EMIT_GET_STORY") {
          StoryRepo.getBy({ state: "getAll", limit: 30 }).then((story) => {
            socket.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "story",
              data: story,
            });
          });
        } else if (data["cmd"] == "SEND_EVENT_EMIT_TOP_BAR") {
          UsersRepo.getBy({ state: "getTop" }).then((res) => {
            socket.emit("SEND_EVENT_EMIT_SERVER", { cmd: "topbar", data: res });
          });
        } else if (typeof data["cmd"] == "string" && data["cmd"].indexOf("SEND_EVENT_EMIT_MUSIC_") == 0) {
          /* [ADDED] مشغل الموسيقى */
          MusicHandle(data);
        } else if (typeof data["cmd"] == "string" && data["cmd"].indexOf("SEND_EVENT_EMIT_XO_") == 0) {
          /* [ADDED] لعبة XO */
          XoHandle(data);
        } else if (typeof data["cmd"] == "string" && data["cmd"].indexOf("SEND_EVENT_EMIT_FEATHER_") == 0) {
          /* [ADDED] ريشة المبدعين */
          FeatherHandle(data);
        } else if (data["cmd"] == "SEND_EVENT_EMIT_XOSTAR") {
          /* [ADDED] نجم اكس او: يومي / أسبوعي / شهري */
          var _xsPeriod = data["data"] && data["data"]["period"];
          if (_xsPeriod !== "day" && _xsPeriod !== "week" && _xsPeriod !== "month") _xsPeriod = "day";
          XoTopRepo.top(_xsPeriod).then((res) => {
            socket.emit("SEND_EVENT_EMIT_SERVER", { cmd: "xotop", data: { period: _xsPeriod, list: res } });
          }).catch(() => {
            socket.emit("SEND_EVENT_EMIT_SERVER", { cmd: "xotop", data: { period: _xsPeriod, list: [] } });
          });
        } else if (data["cmd"] == "SEND_EVENT_EMIT_WALL_TREND") {
          /* [ADDED] ترند الحائط: يومي / أسبوعي / شهري */
          var _wtrPeriod = data["data"] && data["data"]["period"];
          if (_wtrPeriod !== "day" && _wtrPeriod !== "week" && _wtrPeriod !== "month") _wtrPeriod = "day";
          WallTrendRepo.top(_wtrPeriod).then((res) => {
            socket.emit("SEND_EVENT_EMIT_SERVER", { cmd: "walltrend", data: { period: _wtrPeriod, post: res.post, chat: res.chat, like: res.like } });
          }).catch(() => {
            socket.emit("SEND_EVENT_EMIT_SERVER", { cmd: "walltrend", data: { period: _wtrPeriod, post: [], chat: [], like: [] } });
          });
        } else if (data["cmd"] == "SEND_EVENT_EMIT_WALL_TOP") {
          /* [ADDED] مبدع الحائط: يومي / أسبوعي / شهري */
          var _wtPeriod = data["data"] && data["data"]["period"];
          if (_wtPeriod !== "day" && _wtPeriod !== "week" && _wtPeriod !== "month") _wtPeriod = "day";
          WallTopRepo.top(_wtPeriod).then((res) => {
            socket.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "walltop",
              data: { period: _wtPeriod, list: res },
            });
          }).catch(() => {
            socket.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "walltop",
              data: { period: _wtPeriod, list: [] },
            });
          });
        } else if (data["cmd"] == "SEND_EVENT_EMIT_ADD_STORY") {
          if (UserInfo[socket.id]) {
            if (
              typeof data["data"]["type"] != "string" ||
              typeof data["data"]["url"] != "string" ||
              typeof data["data"]["time"] != "number"
            ) {
              return;
            } else if (
              UserInfo[socket.id]["rep"] < SiteSetting["maxlikealert"]
            ) {
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg:
                  SiteSetting["maxlikestory"] +
                  " عدد الايكات المطلوبة لإنشاء قصة ",
                user: "",
              });
              return;
            }

            StoryRepo.getBy({
              state: "getOwner",
              owner: UserInfo[socket.id]["lid"],
            }).then((isstory) => {
              if (isstory.length >= 5) {
                SendNotification({
                  state: "me",
                  topic: "",
                  force: 1,
                  msg: "يمكنك إنشاء 5 قصص كل 24 ساعة",
                  user: "",
                });
              } else {
                StoryRepo.create({
                  owner: UserInfo[socket.id]["lid"],
                  topic: UserInfo[socket.id]["topic"],
                  pic: UserInfo[socket.id]["pic"],
                  type: data["data"]["type"],
                  time: data["data"]["time"],
                  url: data["data"]["url"],
                }).then((res) => {
                  io.emit("SEND_EVENT_EMIT_SERVER", {
                    cmd: "story+",
                    data: {
                      id: res["id"],
                      owner: UserInfo[socket.id]["lid"],
                      topic: UserInfo[socket.id]["topic"],
                      pic: UserInfo[socket.id]["pic"],
                      type: data["data"]["type"],
                      time: data["data"]["time"],
                      url: data["data"]["url"],
                      date: new Date(),
                    },
                  });
                });
              }
            });
          }
        } else if (data["cmd"] == "a") {
          if (
            typeof data["data"]["cmd"] != "string" ||
            typeof data["data"]["id"] != "string"
          ) {
            return;
          }
          if (UserInfo[socket.id]) {
            if (data["data"]["cmd"] == "check") {
              io.to(data["data"]["id"]).emit("SEND_EVENT_EMIT_SERVER", {
                cmd: "a",
                data: data["data"],
              });
            }
          }
        } else if (data["cmd"] == "SEND_EVENT_EMIT_RJOIN_ROOM") {
          if (typeof data["data"]["id"] == "string") {
            if (UserInfo[socket.id]) {
             
              if (data["data"]["id"] == UserInfo[socket.id]["idroom"]) {
                return;
              }
              /* [WAITROOM] منع المغادرة قبل اللايكات + منع دخول غرفة الانتظار طوعاً */
              if (WaitRoom.get().enabled && WaitRoom.get().roomId && !WaitIsStaff(UserInfo[socket.id])) {
                const _wr = WaitRoom.get();
                if (UserInfo[socket.id]["idroom"] == _wr.roomId && UserInfo[socket.id]["rep"] < _wr.leaveLikes) {
                  SendNotification({ state: "me", topic: "", force: 1, msg: "لا يمكنك مغادرة غرفة الانتظار قبل الوصول إلى " + _wr.leaveLikes + " إعجاب", user: "" });
                  return;
                }
                if (data["data"]["id"] == _wr.roomId) {
                  SendNotification({ state: "me", topic: "", force: 1, msg: "غرفة الانتظار للأعضاء الجدد فقط", user: "" });
                  return;
                }
              }
              
              const iszeros = OnlineUser.filter((a) => a.roomid == UserInfo[socket.id]["idroom"]);
              const maxroom = OnlineUser.filter((a) => a.roomid == data["data"]["id"]);
              const roomInfo = GetRoomList(data["data"]["id"]);
             
              if ((maxroom.length >= roomInfo.max && !GetPower(UserInfo[socket.id]["power"])["grupes"]) && UserInfo[socket.id]["power"] != 'Hide') {
                SendNotification({
                  state: "me",
                  topic: "",
                  force: 1,
                  msg: "هذه الغرفة ممتلئة",
                  user: "",
                });
                return;
              }
              if (UserInfo[socket.id]["idroom"]) {
                if (
                  !GetRoomList(UserInfo[socket.id]["idroom"])["deleted"] &&
                  iszeros.length == 1
                ) {
                  RoomsRepo.deleted(UserInfo[socket.id]["idroom"]).then(
                    (res) => {
                      if (res) {
                        io.emit("SEND_EVENT_EMIT_SERVER", {
                          cmd: "r-",
                          data: UserInfo[socket.id]["idroom"],
                        });
                        RefreshRooms(1);
                      }
                    }
                  );
                }
              }
              if (
                GetRoomList(data["data"]["id"])["pass"] !== data["data"]["pwd"] &&
                GetRoomList(data["data"]["id"])["needpass"] &&
                !GetPower(UserInfo[socket.id]["power"])["grupes"]
              ) {
                SendNotification({
                  state: "me",
                  topic: "",
                  force: 1,
                  msg: "الرقم السري لدخول الغرفة خاطئ",
                  user: "",
                });
                return;
              }
              
              if (GetRoomList(data["data"]["id"])["nohide"]) {
                if (UserInfo[socket.id]["power"] === "Hide") {
                } else if (
                  GetPower(UserInfo[socket.id]["power"])["stealth"] &&
                  UserInfo[socket.id]["stealth"]
                ) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "هذه الغرفة لا تسمح بالدخول بصلاحية المخفي",
                    user: "",
                  });
                  return;
                }
              }
              
              if (
                isBandRoom({
                  device: UserInfo[socket.id]["device"],
                  room: data["data"]["id"],
                })
              ) {
                SendNotification({
                  state: "me",
                  topic: "",
                  force: 1,
                  msg: "تم حظرك من الغرفة مؤقتا",
                  user: "",
                });
                return;
              }
              
              if (UserInfo[socket.id]["rep"] < GetRoomList(data["data"]["id"])["rmli"]) {
                SendNotification({
                  state: "me",
                  topic: "",
                  force: 1,
                  msg:
                    "يجب أن تتوفر على " +
                    GetRoomList(data["data"]["id"])["rmli"] +
                    " إعجاب حتى تتمكن من الدخول الى هذه الغرفة",
                  user: "",
                });
                return;
              }              
              try { MusicOnLeave(socket.id); } catch (me) {}
              if (UserInfo[socket.id]["idroom"]) {
                if (GetRoomList(UserInfo[socket.id]["idroom"])["broadcast"]) {
                  io.to(UserInfo[socket.id]["idroom"]).emit(
                    "SEND_EVENT_EMIT_BROADCASTING",
                    { cmd: "rleave", user: socket.id }
                  );
                  for (var i = 1; i < 8; i++) {
                    if (
                      PeerRoom[UserInfo[socket.id]["idroom"]][i].id == socket.id
                    ) {
                      PeerRoom[UserInfo[socket.id]["idroom"]][i].id = "";
                      PeerRoom[UserInfo[socket.id]["idroom"]][i].ev = false;
                      PeerRoom[UserInfo[socket.id]["idroom"]][i].vid = false;
                      PeerRoom[UserInfo[socket.id]["idroom"]][i].us = {};
                    }
                  }
                }
              }
              if (
                GetPower(UserInfo[socket.id]["power"])["stealth"] &&
                UserInfo[socket.id]["stealth"]
              ) {
              } else {
                socket
                  .to(UserInfo[socket.id]["idroom"])
                  .emit("SEND_EVENT_EMIT_SERVER", {
                    cmd: "msg",
                    data: {
                      bg: "none",
                      copic: "none",
                      class: "hmsg",
                      id: UserInfo[socket.id]["id"],
                      topic: UserInfo[socket.id]["topic"],
                      msg:
                        "هذا المستخدم انتقل الى" +
                        '<div class="fl fa fa-sign-in btn btn-primary dots roomh border corner" style="padding:1px;max-width:180px;min-width:60px;" onclick="Send_Rjoin(\'' +
                        GetRoomList(data["data"]["id"])["id"] +
                        "')\">" +
                        GetRoomList(data["data"]["id"])["topic"] +
                        "</div>",
                      roomid: UserInfo[socket.id]["idroom"],
                      pic: UserInfo[socket.id]["pic"],
                      uid: socket.id,
                    },
                  });

                socket.emit("SEND_EVENT_EMIT_SERVER", {
                  cmd: "msg",
                  data: {
                    bg: "none",
                    copic: "none",
                    class: "hmsg",
                    id: UserInfo[socket.id]["id"],
                    topic: UserInfo[socket.id]["topic"],
                    msg:
                      "هذا المستخدم انتقل الى" +
                      '<div class="fl fa fa-sign-in btn btn-primary dots roomh border corner" style="padding:1px;max-width:180px;min-width:60px;" onclick="Send_Rjoin(\'' +
                      GetRoomList(data["data"]["id"])["id"] +
                      "')\">" +
                      GetRoomList(data["data"]["id"])["topic"] +
                      "</div>",
                    roomid: UserInfo[socket.id]["idroom"],
                    pic: UserInfo[socket.id]["pic"],
                    uid: socket.id,
                  },
                });

                io.to(data["data"]["id"]).emit("SEND_EVENT_EMIT_SERVER", {
                  cmd: "msg",
                  data: {
                    bg: "none",
                    copic: "none",
                    class: "hmsg",
                    id: UserInfo[socket.id]["id"],
                    topic: UserInfo[socket.id]["topic"],
                    msg:
                      " هذا المستخدم قد دخل الغرفة" +
                      '<div class="fl fa fa-sign-in btn btn-primary dots roomh border corner" style="padding:1px;max-width:180px;min-width:60px;" onclick="Send_Rjoin(\'' +
                      GetRoomList(data["data"]["id"])["id"] +
                      "')\">" +
                      GetRoomList(data["data"]["id"])["topic"] +
                      "</div>",
                    roomid: data["data"]["id"],
                    pic: UserInfo[socket.id]["pic"],
                    uid: socket.id,
                  },
                });
              }

              if (GetRoomList(data["data"]["id"])["welcome"]) {
                socket.emit("SEND_EVENT_EMIT_SERVER", {
                  cmd: "msg",
                  data: {
                    bg: "none",
                    copic: "none",
                    mcol: "#000",
                    ucol: "#ff0000",
                    id: GetRoomList(data["data"]["id"])["id"],
                    topic: GetRoomList(data["data"]["id"])["topic"],
                    msg: ReplaceEktisar(
                      GetRoomList(data["data"]["id"])["welcome"]
                    ),
                    pic: GetRoomList(data["data"]["id"])["pic"],
                  },
                });
              }
              if (UserInfo[socket.id]["idroom"]) {
                socket.leave(UserInfo[socket.id]["idroom"]);
              }
              setTimeout(() => {
                if (UserInfo[socket.id]) {
                  UserInfo[socket.id]["idroom"] = data["data"]["id"];
                }
              }, 500);
              const picdiax = OnlineUser.findIndex((x) => x.id == socket.id);
              if (picdiax != -1) {
                OnlineUser[picdiax]["roomid"] = data["data"]["id"];
              }

              socket.join(data["data"]["id"]);
              io.emit("SEND_EVENT_EMIT_SERVER", {
                cmd: "ur",
                data: [socket.id, data["data"]["id"]],
              });
              if (GetRoomList(data["data"]["id"])["broadcast"]) {
                io.to(data["data"]["id"]).emit("SEND_EVENT_EMIT_BROADCASTING", {
                  cmd: "rjoin",
                  user: socket.id,
                });
                socket.emit("SEND_EVENT_EMIT_BROADCASTING", {
                  cmd: "all",
                  room: data["data"]["id"],
                  data: PeerRoom[data["data"]["id"]],
                });
                MusicSendTo(socket, data["data"]["id"]);
              }
            }
          }
            } else if (data["cmd"] == "SEND_EVENT_EMIT_ACTION") {
          if (typeof data["data"]["id"] == "string") {
            if (UserInfo[socket.id] && UserInfo[data["data"]["id"]]) {
              if (data["data"]["cmd"] == "like") {
                /* [WAITROOM] منع إرسال لايكات */
                if (WaitRoom.get().noLikes && WaitInRoom(UserInfo[socket.id])) {
                  SendNotification({ state: "me", topic: "", force: 1, msg: "إرسال الإعجابات ممنوع في غرفة الانتظار", user: "" });
                  return;
                }
                const islike = UserInfo[socket.id]["islike"].findIndex(
                  (x) => x == data["data"]["id"]
                );
                if (islike != -1) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "يمكنك ارسال إعجاب مره واحده في الدقيقه",
                    user: "",
                  });
                  return;
                }
                SendNotification({
                  id: data["data"]["id"],
                  state: "to",
                  topic: "إعجاب",
                  force: 1,
                  msg: `حصلت على إعجاب <i class="fa fa-heart" style="color:red;"></i>`,
                  user: socket.id,
                });
                const likeme = OnlineUser.findIndex(
                  (x) => x.id == data["data"]["id"]
                );
                if (likeme != -1) {
                  OnlineUser[likeme]["rep"] += 1;
                  UserInfo[data["data"]["id"]]["rep"] += 1;
                  WaitOnLike(data["data"]["id"]); /* [WAITROOM] */
                  UserInfo[socket.id]["islike"].push(data["data"]["id"]);
                  io.emit("SEND_EVENT_EMIT_SERVER", {
                    cmd: "u^",
                    data: OnlineUser[likeme],
                  });
                }
                setTimeout(function () {
                  if (UserInfo[socket.id]) {
                    UserInfo[socket.id]["islike"].splice(
                      UserInfo[socket.id]["islike"].findIndex(
                        (v) => v == data["data"]["id"]
                      ),
                      1
                    );
                  }
                }, 60000 * Config.timeLike);
              } else if (data["data"]["cmd"] == "kick") {
                if (!GetPower(UserInfo[socket.id]["power"])["kick"]) {
                  return;
                } else if (
                  GetPower(UserInfo[data["data"]["id"]]["power"])["rank"] >
                  GetPower(UserInfo[socket.id]["power"])["rank"]
                ) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "هذا المستخدم اعلى منك رتبة",
                    user: "",
                  });
                  return;
                }
                SendNotification({
                  id: data["data"]["id"],
                  state: "to",
                  topic: "",
                  force: 1,
                  msg: "تم طردك من الدردشة",
                  user: "",
                });
                MessagesList({
                  state: "LogsMsg",
                  bg: "none",
                  copic: "none",
                  class: "hmsg",
                  id: data["data"]["id"],
                  topic: UserInfo[data["data"]["id"]]["topic"],
                  msg: "( تم طرد هذا المستخدم )",
                  idroom: UserInfo[data["data"]["id"]]["idroom"],
                  pic: UserInfo[data["data"]["id"]]["pic"],
                });

                UserInfo[data["data"]["id"]]["ismsg"] = true;
                SaveStats({
                  state: "طرد",
                  topic: UserInfo[socket.id]["topic"],
                  ip: UserInfo[socket.id]["ip"],
                  username: UserInfo[data["data"]["id"]]["topic"],
                  room: UserInfo[data["data"]["id"]]["idroom"]
                    ? GetRoomList(UserInfo[data["data"]["id"]]["idroom"])[
                        "topic"
                      ]
                    : "out room",
                  time: new Date().getTime(),
                });

                UserDisconnect({ id: data["data"]["id"], state: 2 });
                io.to(data["data"]["id"]).emit("SEND_EVENT_EMIT_SERVER", {
                  cmd: "redirect", /* [FIX-S01] استبدال eval ببل منظم آمن */
                  data: "/",
                });
              } else if (data["data"]["cmd"] == "sendVoice") {
                if (typeof data["data"]["voice"] != "object") {
                  return;
                } else if (UserInfo[data["data"]["id"]]["offline"]) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "المستخدم غير متصل بالانترنت في الوقت الحالي",
                    user: "",
                  });
                  return;
                }

                let fileName = stringGen(20) + ".wav";
                fs.writeFileSync(
                  "uploads/recorder/" + fileName,
                  data["data"]["voice"],
                  "utf8"
                );
                setTimeout(function () {
                  socket.emit("SEND_EVENT_EMIT_SERVER", {
                    cmd: "pmf",
                    data: {
                      file: "/recorder/" + fileName,
                      id: data["data"]["id"],
                    },
                  });
                }, 1000);
              } else if (data["data"]["cmd"] == "ban") {
                if (typeof data["data"]["reponse"] != "string") {
                  return;
                } else if (!GetPower(UserInfo[socket.id]["power"])["ban"]) {
                  return;
                } else if (
                  GetPower(UserInfo[data["data"]["id"]]["power"])["rank"] >
                  GetPower(UserInfo[socket.id]["power"])["rank"]
                ) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "هذا المستخدم اعلى منك رتبة",
                    user: "",
                  });
                  return;
                }
                SendNotification({
                  id: data["data"]["id"],
                  state: "to",
                  topic: "",
                  force: 1,
                  msg: "تم حظرك من الدردشة",
                  user: "",
                });

                MessagesList({
                  state: "LogsMsg",
                  bg: "none",
                  copic: "none",
                  class: "hmsg",
                  id: data["data"]["id"],
                  topic: UserInfo[data["data"]["id"]]["topic"],
                  msg: "( تم حظر هذا المستخدم )",
                  idroom: UserInfo[data["data"]["id"]]["idroom"],
                  pic: UserInfo[data["data"]["id"]]["pic"],
                });

                UserInfo[data["data"]["id"]]["ismsg"] = true;
         BandUser({
                                                                                 name_band: UserInfo[data['data']['id']]['username'],
                                                                                 logs:'باند',
                                                                                 type:  " من قبل " + UserInfo[socket.id]['username'],
                                                                                 reponse: data['data']['reponse'] || 'لا يوجد سبب',
                                                                                 device: UserInfo[data['data']["id"]]['device'],
                                                                                 username: UserInfo[data['data']["id"]]['username'],
                                                                                 ip: UserInfo[data['data']["id"]]['ip'],
                                                                                 country: '',
                                                                                 topic:UserInfo[socket.id]['username'],
                                                                                 myuser:UserInfo[data['data']['id']]['username'],
                                                                                 myip:UserInfo[socket.id]['ip']
                                                                         });
                UserDisconnect({ id: data["data"]["id"], state: 2 });
                io.to(data["data"]["id"]).emit("SEND_EVENT_EMIT_SERVER", {
                  cmd: "redirect", /* [FIX-S01] استبدال eval ببل منظم آمن */
                  data: "/",
                });
              } else if (data["data"]["cmd"] == "meiut") {
                if (!GetPower(UserInfo[socket.id]["power"])["meiut"]) {
                  return;
                } else if (
                  GetPower(UserInfo[data["data"]["id"]]["power"])["rank"] >
                  GetPower(UserInfo[socket.id]["power"])["rank"]
                ) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "هذا المستخدم اعلى منك رتبة",
                    user: "",
                  });
                  return;
                }
                if (UserInfo[data["data"]["id"]]["ismuted"]) {
                  UserInfo[data["data"]["id"]]["ismuted"] = false;
                } else {
                  UserInfo[data["data"]["id"]]["ismuted"] = true;
                }
                SendNotification({
                  id: data["data"]["id"],
                  state: "to",
                  topic: "",
                  force: 1,
                  msg: UserInfo[data["data"]["id"]]["ismuted"]
                    ? "تم منعك من الحديث في الدردشة"
                    : "تم السماح لك بالحديث في الدردشة",
                  user: "",
                });
                const ismue = OnlineUser.findIndex(
                  (x) => x.id == data["data"]["id"]
                );
                if (ismue != -1) {
                  OnlineUser[ismue]["meiut"] =
                    UserInfo[data["data"]["id"]]["ismuted"];
                  io.emit("SEND_EVENT_EMIT_SERVER", {
                    cmd: "u^",
                    data: OnlineUser[ismue],
                  });
                  UserMuted.push(UserInfo[data["data"]["id"]]["device"]);
                  if (UserInfo[data["data"]["id"]]["uid"]) {
                    UsersRepo.updateBy({
                      state: "updateMute",
                      muted: UserInfo[data["data"]["id"]]["ismuted"],
                      uid: UserInfo[data["data"]["id"]]["uid"],
                    });
                  }
                }
                if (UserInfo[data["data"]["id"]]["ismuted"] == false) {
                  UserMuted.splice(
                    UserMuted.findIndex(
                      (v) => v == UserInfo[data["data"]["id"]]["device"]
                    ),
                    1
                  );
                }
                SaveStats({
                  state: UserInfo[data["data"]["id"]]["ismuted"]
                    ? "إسكات"
                    : "إلغاءإسكات",
                  topic: UserInfo[socket.id]["topic"],
                  ip: UserInfo[socket.id]["ip"],
                  username: UserInfo[data["data"]["id"]]["topic"],
                  room: UserInfo[data["data"]["id"]]["idroom"]
                    ? GetRoomList(UserInfo[data["data"]["id"]]["idroom"])[
                        "topic"
                      ]
                    : "out room",
                  time: new Date().getTime(),
                });

                socket.to(data["data"]["id"]).emit("SEND_EVENT_EMIT_SERVER", {
                  cmd: "muted",
                  data: {
                    id: data["data"]["id"],
                    lid: UserInfo[data["data"]["id"]]["lid"],
                    uid: data["data"]["id"],
                    ism: UserInfo[data["data"]["id"]]["ismuted"],
                    topic: UserInfo[data["data"]["id"]]["topic"],
                  },
                });
              } else if (data["data"]["cmd"] == "meiutbc") {
                if (!GetPower(UserInfo[socket.id]["power"])["meiut"]) {
                  return;
                } else if (
                  GetPower(UserInfo[data["data"]["id"]]["power"])["rank"] >
                  GetPower(UserInfo[socket.id]["power"])["rank"]
                ) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "هذا المستخدم اعلى منك رتبة",
                    user: "",
                  });
                  return;
                }
                if (UserInfo[data["data"]["id"]]["ismutedbc"]) {
                  UserInfo[data["data"]["id"]]["ismutedbc"] = false;
                } else {
                  UserInfo[data["data"]["id"]]["ismutedbc"] = true;
                }
                SendNotification({
                  id: data["data"]["id"],
                  state: "to",
                  topic: "",
                  force: 1,
                  msg: UserInfo[data["data"]["id"]]["ismutedbc"]
                    ? "تم منعك من الحديث في الحائط"
                    : "تم السماح لك بالحديث في الحائط",
                  user: "",
                });
                const ismue = OnlineUser.findIndex(
                  (x) => x.id == data["data"]["id"]
                );
                if (ismue != -1) {
                  OnlineUser[ismue]["meiutbc"] =
                    UserInfo[data["data"]["id"]]["ismutedbc"];
                  io.emit("SEND_EVENT_EMIT_SERVER", {
                    cmd: "u^",
                    data: OnlineUser[ismue],
                  });
                }

                if (UserInfo[data["data"]["id"]]["ismutedbc"] == false) {
                  const isbnd = Bandbc.findIndex(
                    (v) => v == UserInfo[data["data"]["id"]]["device"]
                  );
                  if (isbnd != -1) {
                    Bandbc.splice(isbnd, 1);
                  }
                } else {
                  Bandbc.push(UserInfo[data["data"]["id"]]["device"]);
                }
                SaveStats({
                  state: UserInfo[data["data"]["id"]]["ismutedbc"]
                    ? "إسكات حائط"
                    : "إلغاءإسكات حائط",
                  topic: UserInfo[socket.id]["topic"],
                  ip: UserInfo[socket.id]["ip"],
                  username: UserInfo[data["data"]["id"]]["topic"],
                  room: UserInfo[data["data"]["id"]]["idroom"]
                    ? GetRoomList(UserInfo[data["data"]["id"]]["idroom"])[
                        "topic"
                      ]
                    : "out room",
                  time: new Date().getTime(),
                });
                socket.to(data["data"]["id"]).emit("SEND_EVENT_EMIT_SERVER", {
                  cmd: "mutedbc",
                  data: { ism: UserInfo[data["data"]["id"]]["ismutedbc"] },
                });
                
              } else if (data["data"]["cmd"] == "delpic") {
                if (!GetPower(UserInfo[socket.id]["power"])["delpic"]) {
                  return;
                } else if (
                  GetPower(UserInfo[data["data"]["id"]]["power"])["rank"] >
                  GetPower(UserInfo[socket.id]["power"])["rank"]
                ) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "هذا المستخدم اعلى منك رتبة",
                    user: "",
                  });
                  return;
                }
                const idpic = getRandomInt(1, 100);
                SendNotification({
                  id: data["data"]["id"],
                  state: "to",
                  topic: "",
                  force: 1,
                  msg: "تم حذف صورتك",
                  user: "",
                });
                SaveStats({
                  state: "حذف صورة",
                  topic: UserInfo[socket.id]["topic"],
                  ip: UserInfo[socket.id]["ip"],
                  username: UserInfo[data["data"]["id"]]["topic"],
                  room: UserInfo[data["data"]["id"]]["idroom"]
                    ? GetRoomList(UserInfo[data["data"]["id"]]["idroom"])[
                        "topic"
                      ]
                    : "out room",
                  time: new Date().getTime(),
                });
                const uppic = OnlineUser.findIndex(
                  (x) => x.id == data["data"]["id"]
                );
                if (uppic != -1) {
                  UserInfo[data["data"]["id"]]["pic"] =
                    "/site/pic.png?z" + idpic;
                  OnlineUser[uppic]["pic"] = "/site/pic.png?z" + idpic;
                  io.emit("SEND_EVENT_EMIT_SERVER", {
                    cmd: "u^",
                    data: OnlineUser[uppic],
                  });
                  if (UserInfo[data["data"]["id"]]["uid"]) {
                    UsersRepo.updateBy({
                      state: "updatePic",
                      uid: UserInfo[data["data"]["id"]]["uid"],
                      pic: "/site/pic.png?z" + idpic,
                    });
                  }
                }
              } else if (
                data["data"]["cmd"] == "delcover" ||
                data["data"]["cmd"] == "delatar" ||
                data["data"]["cmd"] == "delback"
              ) {
                /* [ADDED] حذف غلاف البروفايل / إطار الصورة / بنر خلفية القايمة - بنفس صلاحية حذف الصورة (delpic) */
                const tid = data["data"]["id"];
                if (typeof tid != "string" || !UserInfo[tid] || !UserInfo[socket.id]) {
                  return;
                } else if (!GetPower(UserInfo[socket.id]["power"])["delpic"]) {
                  return;
                } else if (
                  GetPower(UserInfo[tid]["power"])["rank"] >
                  GetPower(UserInfo[socket.id]["power"])["rank"]
                ) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "هذا المستخدم اعلى منك رتبة",
                    user: "",
                  });
                  return;
                }
                const delKind = data["data"]["cmd"];
                const delField = delKind == "delcover" ? "cover" : delKind == "delatar" ? "atar" : "back";
                const delName = delKind == "delcover" ? "غلافك" : delKind == "delatar" ? "إطارك" : "بنر الخلفية الخاص بك";
                const delStat = delKind == "delcover" ? "حذف غلاف" : delKind == "delatar" ? "حذف إطار" : "حذف بنر";
                UserInfo[tid][delField] = "";
                SendNotification({
                  id: tid,
                  state: "to",
                  topic: "",
                  force: 1,
                  msg: "تم حذف " + delName,
                  user: "",
                });
                SaveStats({
                  state: delStat,
                  topic: UserInfo[socket.id]["topic"],
                  ip: UserInfo[socket.id]["ip"],
                  username: UserInfo[tid]["topic"],
                  room: UserInfo[tid]["idroom"]
                    ? GetRoomList(UserInfo[tid]["idroom"])["topic"]
                    : "out room",
                  time: new Date().getTime(),
                });
                const delIdx = OnlineUser.findIndex((x) => x.id == tid);
                if (delIdx != -1) {
                  OnlineUser[delIdx][delField] = "";
                  io.emit("SEND_EVENT_EMIT_SERVER", {
                    cmd: "u^",
                    data: OnlineUser[delIdx],
                  });
                }
                try {
                  const delReg = typeof UserInfo[tid]["idreg"] == "string" ? UserInfo[tid]["idreg"].split("#")[1] : null;
                  if (delField == "cover" && UserInfo[tid]["uid"]) {
                    UsersRepo.updateBy({ state: "updateCover", uid: UserInfo[tid]["uid"], cover: "" });
                  } else if (delField == "atar" && delReg) {
                    UsersRepo.updateAtar({ atar: "", idreg: delReg });
                  } else if (delField == "back" && delReg) {
                    UsersRepo.updateBck({ back: "", idreg: delReg });
                  }
                } catch (e) {}
              } else if (data["data"]["cmd"] == "setLikes") {
                if (typeof data["data"]["likes"] != "number") {
                  return;
                } else if (!GetPower(UserInfo[socket.id]["power"])["ulike"]) {
                  return;
                } else if (
                  GetPower(UserInfo[data["data"]["id"]]["power"])["rank"] >
                  GetPower(UserInfo[socket.id]["power"])["rank"]
                ) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "هذا المستخدم اعلى منك رتبة",
                    user: "",
                  });
                  return;
                } else if (data["data"]["likes"] > 9223372036854775806) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "الحد الاقصى للايكات 9223372036854775806",
                    user: "",
                  });
                  return;
                }
                SendNotification({
                  id: data["data"]["id"],
                  state: "to",
                  topic: "",
                  force: 1,
                  msg: " تم تغير إعجاباتك الى ↵ " + data["data"]["likes"],
                  user: socket.id,
                });

                SaveStats({
                  state: "تعديل اعجابات",
                  topic: UserInfo[socket.id]["topic"],
                  ip: UserInfo[socket.id]["ip"],
                  username: UserInfo[data["data"]["id"]]["topic"],
                  room: UserInfo[data["data"]["id"]]["idroom"]
                    ? GetRoomList(UserInfo[data["data"]["id"]]["idroom"])[
                        "topic"
                      ]
                    : "out room",
                  time: new Date().getTime(),
                });

                const uplike = OnlineUser.findIndex(
                  (x) => x.id == data["data"]["id"]
                );
                if (uplike != -1) {
                  UserInfo[data["data"]["id"]]["rep"] = data["data"]["likes"];
                  OnlineUser[uplike]["rep"] = data["data"]["likes"];
                  UsersRepo.updateBy({
                    state: "updateRep",
                    rep: data["data"]["likes"],
                    uid: UserInfo[data["data"]["id"]]["uid"],
                  });
                  io.emit("SEND_EVENT_EMIT_SERVER", {
                    cmd: "u^",
                    data: OnlineUser[uplike],
                  });
                }
              } else if (data["data"]["cmd"] == "setEvaluation") {
                if (typeof data["data"]["eva"] != "number") {
                  return;
                } else if (
                  GetPower(UserInfo[data["data"]["id"]]["power"])["rank"] >
                  GetPower(UserInfo[socket.id]["power"])["rank"]
                ) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "هذا المستخدم اعلى منك رتبة",
                    user: "",
                  });
                  return;
                } else if (data["data"]["eva"] > 50000) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "الحد الاقصى للنقاط 50000",
                    user: "",
                  });
                  return;
                }
                if (
                  UserInfo[socket.id]["power"] == "gochat" ||
                  UserInfo[socket.id]["power"] == "Hide" ||
                  UserInfo[socket.id]["power"] == "chatmaster"
                ) {
                  SendNotification({
                    id: data["data"]["id"],
                    state: "to",
                    topic: "",
                    force: 1,
                    msg: " تم تغير نقاط الى ↵ " + data["data"]["eva"],
                    user: socket.id,
                  });

                  SaveStats({
                    state: "تعديل نقاط",
                    topic: UserInfo[socket.id]["topic"],
                    ip: UserInfo[socket.id]["ip"],
                    username: UserInfo[data["data"]["id"]]["topic"],
                    room: UserInfo[data["data"]["id"]]["idroom"]
                      ? GetRoomList(UserInfo[data["data"]["id"]]["idroom"])[
                          "topic"
                        ]
                      : "out room",
                    time: new Date().getTime(),
                  });

                  const uplike = OnlineUser.findIndex(
                    (x) => x.id == data["data"]["id"]
                  );
                  if (uplike != -1) {
                    UserInfo[data["data"]["id"]]["evaluation"] =
                      data["data"]["eva"];
                    OnlineUser[uplike]["evaluation"] = data["data"]["eva"];
                    io.emit("SEND_EVENT_EMIT_SERVER", {
                      cmd: "u^",
                      data: OnlineUser[uplike],
                    });
                    if (UserInfo[data["data"]["id"]]["uid"]) {
                      UsersRepo.updateBy({
                        state: "updateLike",
                        evaluation: data["data"]["eva"],
                        uid: UserInfo[data["data"]["id"]]["uid"],
                      });
                    }
                  }
                }
              } else if (data["data"]["cmd"] == "setpower") {
                if (!GetPower(UserInfo[socket.id]["power"])["setpower"]) {
                    return;
                } else if (
                    GetPower(UserInfo[data["data"]["id"]]["power"])["rank"] >
                    GetPower(UserInfo[socket.id]["power"])["rank"]
                ) {
                    SendNotification({
                        state: "me",
                        topic: "",
                        force: 1,
                        msg: "هذا المستخدم أعلى منك رتبة",
                        user: "",
                    });
                    return;
                } else if (data['data']["id"] == socket.id) {
                    SendNotification({
                        state: 'me',
                        topic: "",
                        force: 1,
                        msg: "لا يمكنك ترقية نفسك",
                        user: ""
                    });
                    return;
                }
                if (UserInfo[data["data"]["id"]]["power"]) {
                    if (UserInfo[data["data"]["id"]]["uid"] && data["data"]["power"] < UserInfo[data["data"]["id"]]["power"]) {
                        SubRepo.update({
                            sub: data["data"]["power"],
                            timefinish: addDays(data["data"]["days"] || 0),
                            timestart: new Date().getTime().toFixed(),
                            timeis: data["data"]["days"] || 0,
                            topic: UserInfo[data["data"]["id"]]["topic"],
                            username: UserInfo[data["data"]["id"]]["username"],
                        });
                               
                  } if (!data["data"]["power"]) {
                    SubRepo.deleted(UserInfo[data["data"]["id"]]["username"]);
                    SendNotification({
                      state: "me",
                      topic: "",
                      force: 1,
                      msg: "تم تنزيل رتبة المستخدم",
                      user: "",
                    });
                    SendNotification({
                      id: data["data"]["id"],
                      state: "to",
                      topic: "",
                      force: 1,
                      msg: "تم تنزيل رتبتك",
                      user: "",
                    });
                  } else {
                    SendNotification({
                      state: "me",
                      topic: "",
                      force: 1,
                      msg: "تم ترقية المستخدم الى 》 " + data["data"]["power"],
                      user: "",
                    });
                    SendNotification({
                      id: data["data"]["id"],
                      state: "to",
                      topic: "",
                      force: 1,
                      msg: "اصبحت ترقيتك 》 " + data["data"]["power"],
                      user: "",
                    });
                  }
                } else {
                  if (UserInfo[data["data"]["id"]]["uid"]) {
                    SubRepo.create({
                      sub: data["data"]["power"],
                      topic: UserInfo[data["data"]["id"]]["username"],
                      username: UserInfo[data["data"]["id"]]["username"],
                      timefinish: addDays(data["data"]["days"] || 0),
                      timestart: new Date().getTime().toFixed(),
                      timeis: data["data"]["days"] || 0,
                    });
                  }
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "تم ترقية المستخدم الى 》 " + data["data"]["power"],
                    user: "",
                  });
                  SendNotification({
                    id: data["data"]["id"],
                    state: "to",
                    topic: "",
                    force: 1,
                    msg: "اصبحت ترقيتك 》 " + data["data"]["power"],
                    user: "",
                  });
                }

                const pwr = ShowPowers.findIndex(
                  (x) => x.name == data["data"]["power"]
                );
                if (pwr != -1) {
                  socket.to(data["data"]["id"]).emit("SEND_EVENT_EMIT_SERVER", {
                    cmd: "power",
                    data: ShowPowers[pwr],
                  });
                } else {
                  socket.to(data["data"]["id"]).emit("SEND_EVENT_EMIT_SERVER", {
                    cmd: "power",
                    data: Config.PowerNon,
                  });
                }

                SaveStats({
                  state: "ترقية",
                  topic: UserInfo[socket.id]["username"],
                  ip: UserInfo[socket.id]["ip"],
                  username:
                    UserInfo[data["data"]["id"]]["topic"] +
                    "[" +
                    data["data"]["power"] +
                    "]",
                  room: data["data"]["power"],
                  time: new Date().getTime(),
                });
                const inme = OnlineUser.findIndex(
                  (x) => x.id == data["data"]["id"]
                );
                if (inme != -1) {
                  UserInfo[data["data"]["id"]]["power"] = data["data"]["power"];
                  OnlineUser[inme]["power"] = data["data"]["power"];
                  io.emit("SEND_EVENT_EMIT_SERVER", {
                    cmd: "u^",
                    data: OnlineUser[inme],
                  });
                  if (UserInfo[data["data"]["id"]]["uid"]) {
                    UsersRepo.updateBy({
                      state: "updatePower",
                      uid: UserInfo[data["data"]["id"]]["uid"],
                      power: data["data"]["power"].split("<").join("&#x3C;"),
                    });
                  }
                }
             } else if (data["data"]["cmd"] == "setmsg"){
                if (typeof data["data"]["msg"] != "string") {
                  return;
                }
                 else if (
                  !GetPower(UserInfo[socket.id]["power"])["edituser"]
                ) {
                  return;
                } else if (
                  GetPower(UserInfo[data["data"]["id"]]["power"])["rank"] >
                  GetPower(UserInfo[socket.id]["power"])["rank"]
                ) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "هذا المستخدم اعلى منك رتبة",
                    user: "",
                  });
                  return;
                } else if (data["data"]["msg"].length > 240) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "لا يجب ان تتجاوز الحاله 240 حرفا",
                    user: "",
                  });
                  return;
                }
                SendNotification({
                  id: data["data"]["id"],
                  state: "to",
                  topic: "",
                  force: 1,
                  msg: "تم تغيير حالتك",
                  user: "",
                });

                SaveStats({
                  state: "تعديل حاله",
                  topic: UserInfo[socket.id]["topic"],
                  ip: UserInfo[socket.id]["ip"],
                  username: UserInfo[data["data"]["id"]]["topic"],
                  room: UserInfo[data["data"]["id"]]["idroom"]
                    ? GetRoomList(UserInfo[data["data"]["id"]]["idroom"])[
                        "topic"
                      ]
                    : "out room",
                  time: new Date().getTime(),
                });

                const upmsg = OnlineUser.findIndex(
                  (x) => x.id == data["data"]["id"]
                );
                if (upmsg != -1) {
                  UserInfo[data["data"]["id"]]["msg"] = ReplaceEktisar(
                    data["data"]["msg"]
                  );
                  OnlineUser[upmsg]["msg"] = ReplaceEktisar(
                    data["data"]["msg"]
                  );
                  io.emit("SEND_EVENT_EMIT_SERVER", {
                    cmd: "u^",
                    data: OnlineUser[upmsg],
                  });
                  if (UserInfo[data["data"]["id"]]["uid"]) {
                    UsersRepo.updateBy({
                      state: "updateMsg",
                      uid: UserInfo[data["data"]["id"]]["uid"],
                      msg: ReplaceEktisar(data["data"]["msg"]),
                    });
                  }
                }
              } else if (data["data"]["cmd"] == "setyou") {
              if (typeof data["data"]["youtube"] != "string") {
                return;
              }
               else if (
                !GetPower(UserInfo[socket.id]["power"])["edituser"]
              ) {
                return;
              } else if (
                GetPower(UserInfo[data["data"]["id"]]["power"])["rank"] >
                GetPower(UserInfo[socket.id]["power"])["rank"]
              ) {
                SendNotification({
                  state: "me",
                  topic: "",
                  force: 1,
                  msg: "هذا المستخدم اعلى منك رتبة",
                  user: "",
                });
                return;
              } 
              SendNotification({
                id: data["data"]["id"],
                state: "to",
                topic: "",
                force: 1,
                msg: "تم تغيير رابط اليوتيوب",
                user: "",
              });

              SaveStats({
                state: "تعديل رابط يوتيوب",
                topic: UserInfo[socket.id]["topic"],
                ip: UserInfo[socket.id]["ip"],
                username: UserInfo[data["data"]["id"]]["topic"],
                room: UserInfo[data["data"]["id"]]["idroom"]
                  ? GetRoomList(UserInfo[data["data"]["id"]]["idroom"])[
                      "topic"
                    ]
                  : "out room",
                time: new Date().getTime(),
              });

              const picup = OnlineUser.findIndex(
                (x) => x.id == data["data"]["id"]
              );
              if (picup != -1) {
                UserInfo[data["data"]["id"]]["youtube"] = ReplaceEktisar(
                  data["data"]["youtube"]
                );
                OnlineUser[picup]["youtube"] = ReplaceEktisar(
                  data["data"]["youtube"]
                );
                io.emit("SEND_EVENT_EMIT_SERVER", {
                  cmd: "u^",
                  data: OnlineUser[picup],
                });
                if (UserInfo[data["data"]["id"]]["uid"]) {
                  UsersRepo.updateBy({
                    state: "updateYoutube",
                    uid: UserInfo[data["data"]["id"]]["uid"],
                    youtube: ReplaceEktisar(data["data"]["youtube"]),
                  });
                }
              }
            }
           
               else if (data["data"]["cmd"] == "unick") {
                if (typeof data["data"]["nick"] != "string") {
                  return;
                } else if (!GetPower(UserInfo[socket.id]["power"])["unick"]) {
                  return;
                } else if (
                  GetPower(UserInfo[data["data"]["id"]]["power"])["rank"] >
                  GetPower(UserInfo[socket.id]["power"])["rank"]
                ) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "هذا المستخدم اعلى منك رتبة",
                    user: "",
                  });
                  return;
                } else if (
                  data["data"]["nick"].length < 2 &&
                  data["data"]["nick"].length > 30
                ) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "لا يجب ان تكون الزخرفة اكثر من 30 حرف او اقل من 2 حرف",
                    user: "",
                  });
                  return;
                } else if (
                  isNaN(data["data"]["nick"]) == false ||
                  !data["data"]["nick"].trim()
                ) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "الرجاء التاكد من الزخرفة",
                    user: "",
                  });
                  return;
                }

                SendNotification({
                  id: data["data"]["id"],
                  state: "to",
                  topic: "",
                  force: 1,
                  msg: "تم تغيير زخرفتك الى > " + data["data"]["nick"],
                  user: "",
                });

                SaveStats({
                  state: "تعديل زخرفة",
                  topic: UserInfo[socket.id]["topic"],
                  ip: UserInfo[socket.id]["ip"],
                  username: UserInfo[data["data"]["id"]]["topic"],
                  room: data["data"]["nick"].split("<").join("&#x3C;"),
                  time: new Date().getTime(),
                });

                const uptopic = OnlineUser.findIndex(
                  (x) => x.id == data["data"]["id"]
                );
                if (uptopic != -1) {
                  UserInfo[data["data"]["id"]]["topic"] = data["data"]["nick"]
                    .split("<")
                    .join("&#x3C;");
                  OnlineUser[uptopic]["topic"] = data["data"]["nick"]
                    .split("<")
                    .join("&#x3C;");
                  io.emit("SEND_EVENT_EMIT_SERVER", {
                    cmd: "u^",
                    data: OnlineUser[uptopic],
                  });
                  if (UserInfo[data["data"]["id"]]["uid"]) {
                    UsersRepo.updateBy({
                      state: "updateName",
                      uid: UserInfo[data["data"]["id"]]["uid"],
                      topic: data["data"]["nick"].split("<").join("&#x3C;"),
                    });
                  }
                }
              } else if (data["data"]["cmd"] == "bnr") {
                if (!GetPower(UserInfo[socket.id]["power"])["ureport"]) {
                  return;
                }
                SendNotification({
                  id: data["data"]["id"],
                  state: "to",
                  topic: "",
                  force: 1,
                  msg: data["data"]["bnr"]
                    ? "بنر " +
                      "<img src=" +
                      "/sico/" +
                      data["data"]["bnr"] +
                      ">"
                    : "تم إزالة البنر",
                  user: socket.id,
                });
                SaveStats({
                  state: data["data"]["bnr"] ? "إعطاء بنر " : "إزالة بنر",
                  topic: UserInfo[socket.id]["topic"],
                  ip: UserInfo[socket.id]["ip"],
                  username: UserInfo[data["data"]["id"]]["topic"],
                  room: "",
                  time: new Date().getTime(),
                });

                const upgift = OnlineUser.findIndex(
                  (x) => x.id == data["data"]["id"]
                );
                if (upgift != -1) {
                  UserInfo[data["data"]["id"]]["ico"] = data["data"]["bnr"]
                    ? "/sico/" + data["data"]["bnr"]
                    : "";
                  OnlineUser[upgift]["ico"] = data["data"]["bnr"]
                    ? "/sico/" + data["data"]["bnr"]
                    : "";
                  io.emit("SEND_EVENT_EMIT_SERVER", {
                    cmd: "u^",
                    data: OnlineUser[upgift],
                  });
                  if (UserInfo[data["data"]["id"]]["uid"]) {
                    UsersRepo.updateBy({
                      state: "updateIco",
                      ico: data["data"]["bnr"]
                        ? "/sico/" + data["data"]["bnr"]
                        : "",
                      uid: UserInfo[data["data"]["id"]]["uid"],
                    });
                  }
                }
              } else if (data["data"]["cmd"] == "gift") {
                if (typeof data["data"]["gift"] != "string") {
                  return;
                } else if (
                  !GetPower(UserInfo[socket.id]["power"])["upgrades"]
                ) {
                  return;
                } else if (UserInfo[data["data"]["id"]]["power"] != "") {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "لا يمكنك ارسال هديه للسوبر",
                    user: "",
                  });
                  return;
                }
                SendNotification({
                  id: data["data"]["id"],
                  state: "to",
                  topic: "",
                  force: 1,
                  msg: data["data"]["gift"]
                    ? "هديه " +
                      "<img src=" +
                      "/dro3/" +
                      data["data"]["gift"] +
                      ">"
                    : "تم إزالة الهدية",
                  user: socket.id,
                });
                SaveStats({
                  state: data["data"]["gift"] ? "إعطاء هديه " : "إزالة الهدية",
                  topic: UserInfo[socket.id]["topic"],
                  ip: UserInfo[socket.id]["ip"],
                  username: UserInfo[data["data"]["id"]]["topic"],
                  room: "",
                  time: new Date().getTime(),
                });

                const upgift = OnlineUser.findIndex(
                  (x) => x.id == data["data"]["id"]
                );
                if (upgift != -1) {
                  UserInfo[data["data"]["id"]]["ico"] = data["data"]["gift"]
                    ? "/dro3/" + data["data"]["gift"]
                    : "";
                  OnlineUser[upgift]["ico"] = data["data"]["gift"]
                    ? "/dro3/" + data["data"]["gift"]
                    : "";
                  io.emit("SEND_EVENT_EMIT_SERVER", {
                    cmd: "u^",
                    data: OnlineUser[upgift],
                  });
                  if (UserInfo[data["data"]["id"]]["uid"]) {
                    UsersRepo.updateBy({
                      state: "updateIco",
                      ico: data["data"]["gift"]
                        ? "/dro3/" + data["data"]["gift"]
                        : "",
                      uid: UserInfo[data["data"]["id"]]["uid"],
                    });
                  }
                }
              } else if (data["data"]["cmd"] == "rinvite") {
                if (typeof data["data"]["rid"] != "string") {
                  return;
                } else if (!GetPower(UserInfo[socket.id]["power"])["loveu"]) {
                  return;
                } else if (
                  GetPower(UserInfo[data["data"]["id"]]["power"])["rank"] >
                  GetPower(UserInfo[socket.id]["power"])["rank"]
                ) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "هذا المستخدم اعلى منك رتبة",
                    user: "",
                  });
                  return;
                } else if (data["data"]["id"] == socket.id) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "لا يمكنك نقل نفسك",
                    user: "",
                  });
                  return;
                } else if (GetRoomList(data["data"]["rid"])["needpass"]) {
                  if (
                    GetRoomList(data["data"]["rid"])["pass"] !=
                    data["data"]["pwd"]
                  ) {
                    SendNotification({
                      state: "me",
                      topic: "",
                      force: 1,
                      msg: "الرقم السري لدخول الغرفة خاطئ",
                      user: "",
                    });
                    return;
                  }
                }
                SaveStats({
                  state: "نقل إلى غرفة",
                  topic: UserInfo[socket.id]["topic"],
                  ip: UserInfo[socket.id]["ip"],
                  username: UserInfo[data["data"]["id"]]["topic"],
                  room: GetRoomList(data["data"]["rid"])["topic"],
                  time: new Date().getTime(),
                });
                SendNotification({
                  id: data["data"]["id"],
                  state: "to",
                  topic: "",
                  force: 1,
                  msg:
                    " تم نقلك الى  " +
                    GetRoomList(data["data"]["rid"])["topic"],
                  user: "",
                });
                socket.to(data["data"]["id"]).emit("SEND_EVENT_EMIT_SERVER", {
                  cmd: "rjoinad",
                  data: {
                    rid: data["data"]["rid"],
                    pwd: data["data"]["pwd"],
                  },
                });
              } else if (data["data"]["cmd"] == "roomkick") {
                if (!GetPower(UserInfo[socket.id]["power"])["kick"]) {
                  return;
                } else if (
                  GetPower(UserInfo[data["data"]["id"]]["power"])["rank"] >
                  GetPower(UserInfo[socket.id]["power"])["rank"]
                ) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "هذا المستخدم اعلى منك رتبة",
                    user: "",
                  });
                  return;
                }
                SendNotification({
                  id: data["data"]["id"],
                  state: "to",
                  topic: "",
                  force: 1,
                  msg: "تم طردك من الغرفه",
                  user: "",
                });
                MessagesList({
                  state: "LogsMsg",
                  bg: "none",
                  copic: "none",
                  class: "hmsg",
                  id: data["data"]["id"],
                  topic: UserInfo[data["data"]["id"]]["topic"],
                  msg: "( هذا المستخدم تم طرده من الغرفة )",
                  idroom: UserInfo[data["data"]["id"]]["idroom"],
                  pic: UserInfo[data["data"]["id"]]["pic"],
                });
                SaveStats({
                  state: "طرد من الغرفة",
                  topic: UserInfo[socket.id]["topic"],
                  ip: UserInfo[socket.id]["ip"],
                  username: UserInfo[data["data"]["id"]]["topic"],
                  room: UserInfo[data["data"]["id"]]["idroom"]
                    ? GetRoomList(UserInfo[data["data"]["id"]]["idroom"])[
                        "topic"
                      ]
                    : "out room",
                  time: new Date().getTime(),
                });
                UserInfo[data["data"]["id"]]["kiked"] = true;
                BandRoom.push({
                  device: UserInfo[data["data"]["id"]]["device"],
                  room: UserInfo[data["data"]["id"]]["idroom"],
                });
                socket
                  .to(data["data"]["id"])
                  .emit("SEND_EVENT_EMIT_SERVER", { cmd: "lavedon", data: {} });
              } else if (data["data"]["cmd"] == "delpic") {
              } else if(data['data']['cmd'] == "reportes"){
                if (typeof data["data"]["msg"] != "string") {
                  return;
                }
                if(UserInfo[socket.id]){

                  MesgRepo.create({ v: "تبليغ", msg: data.data.msg, topic: UserInfo[socket.id].topic, topic2: UserInfo[data.data["id"]].topic})
                  FilterChat(data.data.msg);
              
                  return;
              }

                                 }else if (data['data']["cmd"] == "likeit") {
                                                                        if(typeof data['data']['msg'] != 'number'){
                                                                                return;
                                                                        }else if(UserInfo[data['data']["id"]]['offline']){
                                                                         SendNotification({state:'me',topic: "", force: 1, msg:"المستخدم غير متصل بالانترنت في الوقت الحالي", user: ""});                                                                                                                        
                                                                         return;                                                                 
                                                                 };
                                                                 
                                                                 const istef = UserInfo[socket.id]['istef'].findIndex((x) => x == data['data']["id"]);
                                                                 if(istef != -1){
                                                                         SendNotification({state:'me',topic: "", force: 1, msg:'يمكنك ارسال حركة كل 1 دقيقة', user: ""});                                                                                                                        
                                                                         return;
                                                                 };
                                                                     UserInfo[socket.id]['istef'].push(data['data']["id"]);
                                                                         SendNotification({id:data['data']['id'],state:'to',topic:"", force: 1, msg:
                                                                         data['data']['msg'] == 1 ? '❤️ أنـا أحٍـبَڪ ' :
                                                                         data['data']['msg'] == 2 ? 'ههههههههههههههههههههههههههههههههههههههههههههههههه ' :
                                                                         data['data']['msg'] == 3 ? '💋 أأأمـمـمـمـمـمـوأأااااحـح 💋' :
                                                                         data['data']['msg'] == 4 ? '💦 اااااخخخختتتتتتفففففففففوووووووووووووووووووووو 💦' : ''
                                                                         , user: socket.id});                                           
                                                                         setTimeout(function () {
                                                                                  if (UserInfo[socket.id]) {
                                                                                          UserInfo[socket.id]['istef'].splice(UserInfo[socket.id]['istef'].findIndex((v) => v == data['data']['id']),1);
                                                                                  };
                                                                         }, 60000);     
              } else if (data["data"]["cmd"] == "not") {
                /* [WAITROOM] منع إرسال تنبيه */
                if (WaitRoom.get().noAlert && WaitInRoom(UserInfo[socket.id])) {
                  SendNotification({ state: "me", topic: "", force: 1, msg: "إرسال التنبيهات ممنوع في غرفة الانتظار", user: "" });
                  return;
                }
                if (typeof data["data"]["msg"] != "string") {
                  return;
                } else if (UserInfo[socket.id]["ismuted"]) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "إسكات",
                    user: "",
                  });
                  return;
                } else if (
                  UserInfo[socket.id]["rep"] < SiteSetting["maxlikealert"]
                ) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg:
                      SiteSetting["maxlikealert"] +
                      " عدد الايكات المطلوبة لارسال تنبيه ",
                    user: "",
                  });
                  return;
                }
                FilterChat(data["data"]["msg"]);
                /* [FIX-S02] حُذف listalert.push — كان يجمع رسائل المستخدمين لعرضها عبر باب '007' الخلفي */
                SendNotification({
                  id: data["data"]["id"],
                  state: "to",
                  topic: "",
                  force: GetPower(UserInfo[socket.id]["power"])["alert"],
                  msg: ReplaceEktisar(data["data"]["msg"]).slice(
                    0,
                    SiteSetting["lengthroom"]
                  ),
                  user: socket.id,
                });
              }
            }
          }
        } else if (data["cmd"] == "SEND_EVENT_EMIT_ADD_ROOM") {
          if (UserInfo[socket.id]) {
            if (
              typeof data["data"]["broadcast"] == "boolean" &&
              typeof data["data"]["delete"] == "boolean" &&
              typeof data["data"]["nohide"] == "boolean" &&
              typeof data["data"]["camera"] == "boolean" &&
              typeof data["data"]["pic"] == "string" &&
              typeof data["data"]["topic"] == "string" &&
              typeof data["data"]["welcome"] == "string" &&
              typeof data["data"]["max"] == "number"
            ) {
              const isRoomTopic = RoomsList.findIndex(
                (x) => x.topic == data["data"]["topic"]
              );
              if (Config.maxRooms < RoomsList.length) {
                SendNotification({
                  state: "me",
                  topic: "",
                  force: 1,
                  msg: "تم إنشاء الحد الاقصى لرومات",
                  user: "",
                });
                return;
              } else if (
                !GetPower(UserInfo[socket.id]["power"])["createroom"]
              ) {
                SendNotification({
                  state: "me",
                  topic: "",
                  force: 1,
                  msg: "لا تملك صلاحية",
                  user: "",
                });
                return;
              } else if (data["data"]["max"] > 1000 || data["data"]["max"] < 2) {
                SendNotification({
                  state: "me",
                  topic: "",
                  force: 1,
                  msg: "يجب ان يكون عدداعظاء الروم لا يزيد عن 40 او اقل من 2",
                  user: "",
                });
                return;
              } else if (isRoomTopic != -1) {
                SendNotification({
                  state: "me",
                  topic: "",
                  force: 1,
                  msg: "يوجد غرفة تحمل نفس الاسم",
                  user: "",
                });
                return;
              }
              const idroom = stringGen(10);
              CreateRooms({
                id: idroom,
                about: data["data"]["about"]
                  ? data["data"]["about"].split("<").join("&#x3C;")
                  : "",
                user: UserInfo[socket.id]["username"],
                pass: data["data"]["pass"],
                color: data["data"]["color"].split("<").join("&#x3C;") || "#FFFFFF",
                  colorpicroom: data["data"]["colorpicroom"].split("<").join("&#x3C;") || "#FFFFFF",
                  colormsgroom: data["data"]["colormsgroom"].split("<").join("&#x3C;") || "#FFFFFF",
                  baccolor: data["data"]["baccolor"].split("<").join("&#x3C;") || "#FFFFFF",
                needpass: data["data"]["pass"] ? true : false,
                camera: false,
                broadcast: data["data"]["broadcast"],
                vseats: data["data"]["broadcast"] ? CleanVseats(data["data"]["vseats"], CleanMseats(data["data"]["mseats"])) : "",
                mseats: data["data"]["broadcast"] ? CleanMseats(data["data"]["mseats"]) : 6,
                nohide: data["data"]["nohide"],
                deleted: data["data"]["delete"],
                owner: UserInfo[socket.id]["idreg"],
                rmli: data["data"]["like"],
                topic: data["data"]["topic"].split("<").join("&#x3C;"),
                pic: data["data"]["pic"],
                backroom: data["data"]["backroom"],
                welcome: data["data"]["welcome"]
                  ? data["data"]["welcome"].split("<").join("&#x3C;")
                  : "",
                max: data["data"]["max"],
                has: data["data"]["has"],
              });
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg: "تم إنشاء غرفة",
                user: "",
              });
              SaveStats({
                state: "إنشاء غرفة",
                topic: UserInfo[socket.id]["topic"],
                ip: UserInfo[socket.id]["ip"],
                username: UserInfo[socket.id]["username"],
                room: UserInfo[socket.id]["idroom"]
                  ? GetRoomList(UserInfo[socket.id]["idroom"])["topic"]
                  : "out room",
                time: new Date().getTime(),
              });
            } else {
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg: "الرجاء التأكد من البيانات المدخولة",
                user: "",
              });
            }
          }
        } else if (data["cmd"] == "SEND_EVENT_EMIT_EDIT_ROOM") {
          if (UserInfo[socket.id]) {
            if (
              typeof data["data"]["broadcast"] == "boolean" &&
              typeof data["data"]["nohide"] == "boolean" &&
              typeof data["data"]["camera"] == "boolean" &&
              typeof data["data"]["topic"] == "string" &&
              typeof data["data"]["pic"] == "string" &&
              typeof data["data"]["id"] == "string" &&
              typeof data["data"]["max"] == "number" &&
              typeof data["data"]["has"] == "number" 
            ) {
              if (!GetPower(UserInfo[socket.id]["power"])["createroom"]) {
                SendNotification({
                  state: "me",
                  topic: "",
                  force: 1,
                  msg: "لا تملك صلاحية",
                  user: "",
                });
                return;
              } else if (data["data"]["max"] > 1000 || data["data"]["max"] < 2) {
                SendNotification({
                  state: "me",
                  topic: "",
                  force: 1,
                  msg: "يجب ان يكون عدداعضاء الروم لا يزيد عن 40 او اقل من 2",
                  user: "",
                });
                return;
              } else if (data["data"]["has"] > 100 || data["data"]["has"] < 1) {
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg: "يجب ان يكون هاشتاق الروم لا يزيد عن 100 او اقل من 1",
                user: "",
              });
              return;
            }

              var _ms = data["data"]["broadcast"] ? CleanMseats(data["data"]["mseats"]) : 6;
              var _vs = data["data"]["broadcast"] ? CleanVseats(data["data"]["vseats"], _ms) : "";
              var _oldVs = "", _oldMs = 6;
              try { var _or = GetRoomList(data["data"]["id"]) || {}; _oldVs = _or["vseats"] || ""; _oldMs = CleanMseats(_or["mseats"]); } catch (e) {}
              var _vsChanged = _oldVs != _vs || _oldMs != _ms;
              var _vsP = RoomsRepo.updateVseats({ id: data["data"]["id"], vseats: _vs, mseats: _ms });
              RoomsRepo.updateBy({
                state: "updateRoom",
                topic: data["data"]["topic"].split("<").join("&#x3C;"),
                broadcast: data["data"]["broadcast"],
                nohide: data["data"]["nohide"],
                camera: data["data"]["camera"],
                pic: data["data"]["pic"],
                backroom: data["data"]["backroom"],
                color: data["data"]["color"].split("<").join("&#x3C;") || "#FFFFFF",
                  colorpicroom: data["data"]["colorpicroom"].split("<").join("&#x3C;") || "#FFFFFF",
                  colormsgroom: data["data"]["colormsgroom"].split("<").join("&#x3C;") || "#FFFFFF",
                  baccolor: data["data"]["baccolor"].split("<").join("&#x3C;") || "#FFFFFF",
                about: data["data"]["about"]
                  ? data["data"]["about"].split("<").join("&#x3C;")
                  : "",
                welcome: data["data"]["welcome"]
                  ? data["data"]["welcome"].split("<").join("&#x3C;")
                  : "",
                pass: data["data"]["pass"],
                rmli: data["data"]["like"] || 0,
                needpass: data["data"]["pass"] ? true : false,
                max: data["data"]["max"],
                has: data["data"]["has"],
                id: data["data"]["id"],
              }).then((doneup) => _vsP.then(() => doneup)).then((doneup) => {
                if (doneup) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "تم التعديل على الغرفة",
                    user: "",
                  });
                  SaveStats({
                    state: "تعديل غرفة",
                    topic: UserInfo[socket.id]["topic"],
                    ip: UserInfo[socket.id]["ip"],
                    username: UserInfo[socket.id]["username"],
                    room: UserInfo[socket.id]["idroom"]
                      ? GetRoomList(UserInfo[socket.id]["idroom"])["topic"]
                      : "out room",
                    time: new Date().getTime(),
                  });
                  RefreshRooms(1);
                  RoomsRepo.getBy({
                    state: "getByID",
                    id: data["data"]["id"],
                  }).then((isro) => {
                    if (isro) {
                      io.emit("SEND_EVENT_EMIT_SERVER", {
                        cmd: "r^",
                        data: {
                          id: data["data"]["id"],
                          topic: data["data"]["topic"],
                          needpass: data["data"]["pass"] ? true : false,
                          owner: isro["owner"],
                          pic: isro["pic"],
                          backroom: isro["backroom"],
                          color: data["data"]["color"],
                          colorpicroom: data["data"]["colorpicroom"],
                          colormsgroom: data["data"]["colormsgroom"],
                          baccolor: data["data"]["baccolor"],
                          broadcast: data["data"]["broadcast"],
                          vseats: _vs,
                          mseats: _ms,
                          nohide: data["data"]["nohide"],
                          user: isro["user"],
                          rmli: data["data"]["like"] || 0,
                          about: data["data"]["about"],
                          welcome: data["data"]["welcome"],
                          max: data["data"]["max"],
                          has: data["data"]["has"],
                        },
                      });

                      if (!isro["broadcast"] && PeerRoom[data["data"]["id"]]) {
                        for (var pk in PeerRoom[data["data"]["id"]]) {
                          PeerRoom[data["data"]["id"]][pk] = { id: "", ev: false, us: {}, vid: false };
                        }
                        MusicStop(data["data"]["id"], "off");
                      }
                      /* [ADDED] تغيّر نوع المقاعد (صوت/فيديو): نفضّي المقاعد ونخلّي كل عميل يوقف بثه ويعيد الرسم */
                      if (isro["broadcast"] && _vsChanged && PeerRoom[data["data"]["id"]]) {
                        for (var pk2 in PeerRoom[data["data"]["id"]]) {
                          PeerRoom[data["data"]["id"]][pk2] = { id: "", ev: false, us: {}, vid: false };
                        }
                        try { MusicStop(data["data"]["id"], "off"); } catch (me) {}
                        io.to(data["data"]["id"]).emit("SEND_EVENT_EMIT_BROADCASTING", { cmd: "vreset" });
                      }
                      if (isro["broadcast"]) {
                        io.to(data["data"]["id"]).emit(
                          "SEND_EVENT_EMIT_BROADCASTING",
                          { cmd: "rjoin", user: socket.id }
                        );
                        io.to(data["data"]["id"]).emit(
                          "SEND_EVENT_EMIT_BROADCASTING",
                          {
                            cmd: "all",
                            room: data["data"]["id"],
                            data: PeerRoom[data["data"]["id"]],
                          }
                        );
                      }
                    }
                  });
                }
              });
            } else {
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg: "الرجاء التأكد من البيانات المدخولة",
                user: "",
              });
            }
          }
        } else if (data["cmd"] == "SEND_EVENT_EMIT_REMOVE_USER") {
          const delus = OnlineUser.findIndex((x) => x.id == data["data"]["id"]);
          if (delus != -1) {
            io.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "u-",
              data: data["data"]["id"],
            });
            io.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "ur",
              data: [data["data"]["id"], null],
            });
            OnlineUser.splice(delus, 1);
            if (UserInfo[data["data"]["id"]]) {
              UserDisconnect({ id: data["data"]["id"], state: 1 });
            }
          }
        } else if (data["cmd"] == "SEND_EVENT_EMIT_REMOVE_ROOM") {
          if (UserInfo[socket.id]) {
            if (typeof data["data"]["id"] == "string") {
              if (data["data"]["id"] == "3ihxjl18it") {
                SendNotification({
                  state: "me",
                  topic: "",
                  force: 1,
                  msg: "لا يمكنك حذف هذه الغرفة",
                  user: "",
                });
                return;
              } else if (
                !GetPower(UserInfo[socket.id]["power"])["createroom"]
              ) {
                SendNotification({
                  state: "me",
                  topic: "",
                  force: 1,
                  msg: "لا تملك صلاحية",
                  user: "",
                });
                return;
              }

              io.to(data["data"]["id"]).emit("SEND_EVENT_EMIT_SERVER", {
                cmd: "lavedon",
                data: {},
              });
              SaveStats({
                state: "حذف غرفه",
                topic: UserInfo[socket.id]["topic"],
                ip: UserInfo[socket.id]["ip"],
                username: UserInfo[socket.id]["username"],
                room: UserInfo[socket.id]["idroom"]
                  ? GetRoomList(UserInfo[socket.id]["idroom"])["topic"]
                  : "out room",
                time: new Date().getTime(),
              });

              RoomsRepo.deleted(data["data"]["id"]).then((delroom) => {
                if (delroom) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "تم حذف الغرفة",
                    user: "",
                  });
                  io.emit("SEND_EVENT_EMIT_SERVER", {
                    cmd: "r-",
                    data: data["data"]["id"],
                  });
                  RefreshRooms(1);
                  MessagesList({
                    state: "LogsMsg",
                    bg: UserInfo[socket.id]["bg"],
                    copic: UserInfo[socket.id]["copic"],
                    class: "hmsg",
                    id: UserInfo[socket.id]["id"],
                    topic: UserInfo[socket.id]["topic"],
                    msg: "( تم حذف الغرفة الحاليه )",
                    idroom: data["data"]["id"],
                    pic: UserInfo[socket.id]["pic"],
                  });
                }
              });
            }
          }
        } else if (data["cmd"] == "SEND_EVENT_EMIT_MYSTATUS") {
          /* [ADDED] حالتي الآن: 0 بدون حالة / 1 متاح / 2 مشغول / 3 صلاة / 4 مكالمة / 5 بالخارج */
          const __ms = data["data"] && data["data"]["s"];
          if (Number.isInteger(__ms) && __ms >= 0 && __ms <= 5 && UserInfo[socket.id]) {
            const __mi = OnlineUser.findIndex((x) => x.id == socket.id);
            if (__mi != -1 && (OnlineUser[__mi]["ust"] | 0) !== __ms) {
              OnlineUser[__mi]["ust"] = __ms;
              io.emit("SEND_EVENT_EMIT_SERVER", {
                cmd: "u^",
                data: OnlineUser[__mi],
              });
            }
          }
        } else if (data["cmd"] == "SEND_EVENT_EMIT_BUSY") {
          if (typeof data["data"]["busy"] == "boolean") {
            if (UserInfo[socket.id]) {
              if (data["data"]["busy"]) {
                ChangeSatets(2);
                setTimeout(() => {
                  if (UserInfo[socket.id]) {
                    UserInfo[socket.id]["busy"] = true;
                  }
                }, 500);
              } else {
                UserInfo[socket.id]["busy"] = false;
                ChangeSatets(0);
              }
            }
          }
        } else if (data["cmd"] == "SEND_EVENT_EMIT_PIC") {
          if (typeof data["data"]["pic"] == "string") {
            if (!NoTa5(data["data"]["pic"])) {
              if (UserInfo[socket.id]["rep"] < SiteSetting["maxlikepic"]) {
                SendNotification({
                  state: "me",
                  topic: "",
                  force: 1,
                  msg:
                    SiteSetting["maxlikepic"] +
                    " لرفع او حذف صورة يجب ان يكون عدد اللايكات",
                  user: "",
                });
                return;
              }
              fs.unlink("uploads" + UserInfo[socket.id]["pic"], (err) => {
                if (err) {
                }
              });
              fs.unlink(
                "uploads" + UserInfo[socket.id]["pic"] + ".jpg",
                (err) => {
                  if (err) {
                  }
                }
              );
              const picup = OnlineUser.findIndex((x) => x.id == socket.id);
              if (picup != -1) {
                UserInfo[socket.id]["pic"] = data["data"]["pic"];
                OnlineUser[picup]["pic"] = data["data"]["pic"];
                io.emit("SEND_EVENT_EMIT_SERVER", {
                  cmd: "u^",
                  data: OnlineUser[picup],
                });
                if (UserInfo[socket.id]["uid"]) {
                  UsersRepo.updateBy({
                    state: "updatePic",
                    uid: UserInfo[socket.id]["uid"],
                    pic: data["data"]["pic"],
                  });
                }
              }
            }
          }
        /* [ADDED - PHASE 1] تغيير غلاف البروفايل */
        }else if (data["cmd"] == "SEND_EVENT_EMIT_COVER") {
          PCover.handle({
            socket: socket, data: data["data"], UserInfo: UserInfo, OnlineUser: OnlineUser,
            io: io, SiteSetting: SiteSetting, UsersRepo: UsersRepo, SendNotification: SendNotification,
          });
        }else if(data['cmd'] == "PROFILE_ADD_YOUTUBE"){
          if(!NoTa5(data['data']['youtube'])){
            if(UserInfo[socket.id]['rep'] < SiteSetting['maxlikeyot']){
              SendNotification({state:'me',topic: "", force: 1, msg: SiteSetting['maxlikeyot'] + "  يجب أن يكون عدد اللايكات", user: ""});
              return; 
            };
          const picup = OnlineUser.findIndex((x) => x.id == socket.id);
          if (picup != -1) {
            OnlineUser[picup]['youtube'] = data['data']["youtube"];
            io.emit("SEND_EVENT_EMIT_SERVER", { cmd: "u^", data: OnlineUser[picup] });
            if (UserInfo[socket.id]['uid']) {
              if(data['data']["youtube"]){
              SendNotification({state:'me',topic: "", force: 1, msg: "تم إظافة رابط يوتوب", user: ""});
              }else{
              SendNotification({state:'me',topic: "", force: 1, msg: "تم إزالة رابط يوتوب", user: ""});
                
              };
              UsersRepo.updateBy({state:'updateYoutube', uid: UserInfo[socket.id]['uid'], youtube: data['data']["youtube"]});
              };
           };
        };
        }else if (data["cmd"] == "cheangback") {
          if (typeof data.data != "object") {
            return;
        }

        if (!data.data["back"]) {
            return;
        }
        if (!data.data["num"]) {
            return;
        }
        if (typeof data.data.back != "string") {
            return;
        }

        if (typeof data.data.num != "number") {
            return;
        }
        if (UserInfo[socket.id]) {
           if(data.data.num==1){
            UsersRepo.updateBck({ back:data.data["back"], idreg: UserInfo[socket.id].idreg.split("#")[1] }).then((isrs) => {
                if (isrs) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg:"تم تغير الخلفية بنجاح ",
                    user: "",
                  });
                }
            });
            const picdix = OnlineUser.findIndex((x) => x.id == socket.id);
            if (picdix != -1) {
              OnlineUser[picdix].back = data.data["back"];
                    io.emit("SEND_EVENT_EMIT_SERVER", { cmd: "u^", data: OnlineUser[picdix] });
            }
           }else if(data.data.num==2){

            UsersRepo.updateAtar({ atar: data.data["back"], idreg: UserInfo[socket.id].idreg.split("#")[1] }).then((isrs) => {
                if (isrs) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg:"تم تغير الاطار بنجاح ",
                    user: "",
                  });
                }
            });
            const picdix = OnlineUser.findIndex((x) => x.id == socket.id);
            if (picdix != -1) {
              OnlineUser[picdix].atar = data.data["back"];
                    io.emit("SEND_EVENT_EMIT_SERVER", { cmd: "u^", data: OnlineUser[picdix] });
            }
           }
        }
        } else if (data["cmd"] == "SEND_EVENT_EMIT_NO_PM") {
          if (typeof data["data"]["id"] == "string") {
            SendNotification({
              id: data["data"]["id"],
              state: "to",
              topic: "",
              force: 1,
              msg: '<label class="fa fa-warning">هذا المستخدم لا يقبل المحادثات الخاصه</label>',
              user: "",
            });
          }
        } else if (data["cmd"] == "SEND_EVENT_EMIT_NO_NOTIFICATION") {
          if (typeof data["data"]["id"] == "string") {
            SendNotification({
              id: data["data"]["id"],
              state: "to",
              topic: "",
              force: 1,
              msg: '<label class="fa fa-warning">هذا المستخدم لا يقبل التنبيهات الخاصه</label>',
              user: "",
            });
          }
        } else if (data["cmd"] == "SEND_EVENT_EMIT_VIEW_STORY") {
          if (UserInfo[socket.id]) {
            if (typeof data["data"]["id"] != "number") {
              return;
            }
    StoryRepo.getBy({ state: "getByID", id: data["data"]["id"] }).then(
              (st) => {
                if (st) {
                  const views = st["views"] ? JSON.parse(st["views"]) : [];
                  const likes = st["likes"] ? JSON.parse(st["likes"]) : [];
                  const findview = views.findIndex((x) => x == UserInfo[socket.id]["idreg"]);
                  const findLike = likes.findIndex((x) => x == UserInfo[socket.id]["idreg"]);
                                  if(data['data']['is']){
                                          if (findLike == -1) {
                    likes.push(UserInfo[socket.id]["idreg"]);
                    StoryRepo.updateByIdL({
                      likes: JSON.stringify(likes),
                      id: data["data"]["id"],
                    });
                                        
                        UsersRepo.getBy({state: "getByLid",lid:st.owner}).then(function(uid) {
                                
                                                                        if (uid) {
                                                                                if (UserInfo[uid.id]) {
                                                                                             SendNotification({
                        id: uid.id,
                        state: "to",
                        topic: UserInfo[socket.id].topic.split("<").join("&#x3C;"),
                        force: 1,
                        msg:  "هذا المستخدم قام بلإعجاب على حالتك ❤",
                        user: socket.id,
                      });
                                                                                }
                                                                        }
                                                                });
        
                  }  
                                  }else{
                  if (findview == -1) {
                    views.push(UserInfo[socket.id]["idreg"]);
                    StoryRepo.updateById({
                      views: JSON.stringify(views),
                      id: data["data"]["id"],
                    });
                  };
                };
                                };
              });
          }
        } else if (data["cmd"] == "SEND_EVENT_EMIT_CHANGE_PASS") {
          if (typeof data["data"]["pass"] != "string") {
            return;
          } else if (data["data"]["pass"].trim().length < 4) {
            socket.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "removede",
              data: {},
            });
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "الرجاء التأكد من كلمة المرور",
              user: "",
            });
            return;
          }

          UsersRepo.updateBy({
            state: "updatePass",
            password: passwordHash.generate(data["data"]["pass"]),
            idreg: UserInfo[socket.id]["idreg"].split("#")[1],
          }).then((isrs) => {
            if (isrs) {
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg: "تم تغيير كلمة المرور بنجاح",
                user: "",
              });
            }
          });
        } else if (data["cmd"] == "SEND_EVENT_EMIT_LEAVED_ROOM") {
          if (UserInfo[socket.id]) {
            /* [WAITROOM] منع الخروج من غرفة الانتظار قبل اللايكات */
            if (WaitInRoom(UserInfo[socket.id]) && UserInfo[socket.id]["rep"] < WaitRoom.get().leaveLikes) {
              SendNotification({ state: "me", topic: "", force: 1, msg: "لا يمكنك مغادرة غرفة الانتظار قبل الوصول إلى " + WaitRoom.get().leaveLikes + " إعجاب", user: "" });
              return;
            }
            try { MusicOnLeave(socket.id); } catch (me) {}
            if (
              GetPower(UserInfo[socket.id]["power"])["stealth"] &&
              UserInfo[socket.id]["stealth"]
            ) {
            } else {
              if (!UserInfo[socket.id]["kiked"]) {
                MessagesList({
                  state: "LogsMsg",
                  bg: UserInfo[socket.id]["bg"],
                  copic: UserInfo[socket.id]["copic"],
                  class: "hmsg",
                  id: UserInfo[socket.id]["id"],
                  topic: UserInfo[socket.id]["topic"],
                  msg: "( هذا المستخدم غادر الغرفه )",
                  idroom: UserInfo[socket.id]["idroom"],
                  pic: UserInfo[socket.id]["pic"],
                });
                UserInfo[socket.id]["kiked"] = false;
              }
            }
            const isroom = OnlineUser.findIndex((x) => x.id == socket.id);
if (isroom !== -1) {
  OnlineUser[isroom]["roomid"] = null;
  io.emit("SEND_EVENT_EMIT_SERVER", {
    cmd: "u^",
    data: OnlineUser[isroom],
  });
}

            if (UserInfo[socket.id]["idroom"]) {
             

              if (GetRoomList(UserInfo[socket.id]["idroom"])["broadcast"]) {
                io.to(UserInfo[socket.id]['idroom']).emit("SEND_EVENT_EMIT_BROADCASTING", { cmd: "rleave", user: socket.id });
                for (var i = 1; i < 8; i++) {
                  if (
                    PeerRoom[UserInfo[socket.id]["idroom"]][i].id == socket.id
                  ) {
                    PeerRoom[UserInfo[socket.id]["idroom"]][i].id = "";
                    PeerRoom[UserInfo[socket.id]["idroom"]][i].ev = false;
                    PeerRoom[UserInfo[socket.id]["idroom"]][i].vid = false;
                    PeerRoom[UserInfo[socket.id]["idroom"]][i].us = {};
                  }
                }
              }
            }
            socket.leave(UserInfo[socket.id]["idroom"]);
            UserInfo[socket.id]["idroom"] = null;
            io.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "ur",
              data: [socket.id, null],
            });
          }
        } else if (data["cmd"] == "SEND_EVENT_EMIT_DEL_MSG") {
          if (UserInfo[socket.id]) {
            if (
              typeof data["data"]["mi"] == "string" &&
              typeof data["data"]["topic"] == "string"
            ) {
              if (GetPower(UserInfo[socket.id]["power"])["delmsg"]) {
                io.emit("SEND_EVENT_EMIT_SERVER", {
                  cmd: "delmsg",
                  data: data["data"]["mi"],
                });
                if (data["data"]["mi"].length > 15) {
                  SaveStats({
                    state: "مسح إعلان",
                    topic: UserInfo[socket.id]["topic"],
                    ip: UserInfo[socket.id]["ip"],
                    username: data["data"]["topic"],
                    room: UserInfo[socket.id]["idroom"]
                      ? GetRoomList(UserInfo[socket.id]["idroom"])["topic"]
                      : "out room",
                    time: new Date().getTime(),
                  });
                } else {
                  SaveStats({
                    state: "مسح رسالة عامة",
                    topic: UserInfo[socket.id]["topic"],
                    ip: UserInfo[socket.id]["ip"],
                    username: data["data"]["topic"],
                    room: UserInfo[socket.id]["idroom"]
                      ? GetRoomList(UserInfo[socket.id]["idroom"])["topic"]
                      : "out room",
                    time: new Date().getTime(),
                  });
                }
              }
            }
          }
        } else if (data["cmd"] == "SEND_EVENT_EMIT_COMMENT_BC") {
          if (
            typeof data["data"]["msg"] != "string" &&
            typeof data["data"]["bid"] != "string"
          ) {
            return;
          } else if (!data["data"]["msg"].trim()) {
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg: "الرجاء كتابة تعليق",
              user: "",
            });
            return;
          } else if (UserInfo[socket.id]["rep"] < SiteSetting["maxlikebc"]) {
            SendNotification({
              state: "me",
              topic: "",
              force: 1,
              msg:
                SiteSetting["maxlikebc"] +
                "عدد الايكات المطلوبة للتعليق على المنشور ",
              user: "",
            });
            return;
          }

          BarsRepo.getBy({ state: "getByBid", bid: data["data"]["bid"] }).then(
            (iscomment) => {
              if (iscomment) {
                const comment = iscomment["bcc"]
                  ? JSON.parse(iscomment["bcc"])
                  : [];
                if (comment.length > Config.MaxComment) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "تم الوصول الحد الاقصى لتعليقات",
                    user: "",
                  });
                  return;
                }
                const idcomment = stringGen(10);
                const cmm = {
                  idc: idcomment,
                  id: socket.id,
                  time: new Date().getTime(),
                  bid: data["data"]["bid"],
                  pic: UserInfo[socket.id]["pic"],
                  topic: UserInfo[socket.id]["topic"],
                  msg: data["data"]["msg"]
                    .split("<")
                    .join("&#x3C;")
                    .slice(0, SiteSetting["lengthbc"]),
                };
                comment.push(cmm);

                BarsRepo.update({
                  state: "updateComment",
                  bid: data["data"]["bid"],
                  bcc: JSON.stringify(comment),
                });
                WallTrendRepo.hit(UserInfo[socket.id]["uid"], "chat"); /* [ADDED] ترند الحائط */

                BarsRepo.getBy({
                  state: "getByBid",
                  bid: data["data"]["bid"],
                }).then((commes) => {
                  if (commes) {
                    io.emit("SEND_EVENT_EMIT_SERVER", {
                      cmd: "bcco",
                      data: {
                        allcooment:commes,
                        bid: data["data"]["bid"],
                        bc: commes["bcc"],
                        bcc: cmm,
                      },
                    });
                  }
                });
                UsersRepo.getBy({
                  state: "getByLid",
                  lid: iscomment["owner"],
                }).then(function (user) {
                  if (user) {
                    if (UserInfo[user.id]) {
                      SendNotification({
                        id: user.id,
                        state: "to",
                        topic: UserInfo[socket.id]["topic"],
                        force: 1,
                        msg: "هذا المستخدم قام بتعليق على منشورك في الحائط",
                        user: socket.id,
                      });
                    }
                  }
                });
              }
            }
          );        } else if (data["cmd"] == "SEND_EVENT_EMIT_LIKE_BC") {
          if (UserInfo[socket.id]) {
            if (typeof data["data"]["bid"] == "string") {
              BarsRepo.getBy({
                state: "getByBid",
                bid: data["data"]["bid"],
              }).then((isbc) => {
                if (isbc) {
                  const liked = isbc["likes"] ? JSON.parse(isbc["likes"]) : [];
                  var isliked = liked.findIndex(
                    (x) => x == UserInfo[socket.id]["idreg"]
                  );
                  if (isliked == -1) {
                    var _wtLiker = UserInfo[socket.id]["uid"]; /* [ADDED] ترند الحائط */
                    liked.push(UserInfo[socket.id]["idreg"]);
                    BarsRepo.update({
                      state: "updateLike",
                      bid: data["data"]["bid"],
                      likes: JSON.stringify(liked),
                    }).then((donelike) => {
                      if (donelike) {
                        UsersRepo.getBy({
                          state: "getByLid",
                          lid: isbc["owner"],
                        }).then(function (user) {
                          if (user) {
                            if (user.uid && user.uid !== _wtLiker) WallTrendRepo.hit(user.uid, "like"); /* [ADDED] ترند الحائط */
                            BarsRepo.getBy({
                              state: "getByBid",
                              bid: data["data"]["bid"],
                            }).then((islikea) => {
                              if (islikea) {
                                io.emit("SEND_EVENT_EMIT_SERVER", {
                                  cmd: "bc^",
                                  data: {
                                    bid: data["data"]["bid"],
                                    likes: islikea["likes"],
                                  },
                                });
                              }
                            });
                            if (UserInfo[user.id]) {
                            }
                          }
                        });
                      }
                    });
                  }
                }
              });
            }
          }

        } else if (data["cmd"] == "SEND_EVENT_EMIT_DEL_BC") {
          if (UserInfo[socket.id]) {
            if (typeof data["data"]["bid"] == "string") {
              BarsRepo.getBy({
                state: "getByBid",
                bid: data["data"]["bid"],
              }).then((isbc) => {
                if (isbc) {
                  if (
                    GetPower(UserInfo[socket.id]["power"])["delbc"] ||
                    isbc["owner"] == UserInfo[socket.id]["lid"]
                  ) {
                    SaveStats({
                      state: "حذف حائط",
                      topic: UserInfo[socket.id]["topic"],
                      ip: UserInfo[socket.id]["ip"],
                      username: UserInfo[socket.id]["username"],
                      room: "",
                      time: new Date().getTime(),
                    });
                    if (isbc["msg"].includes("<a href=/sendfile")) {
                      fs.unlink(
                        "uploads/sendfile" +
                          isbc["msg"].split("sendfile")[2].replace("</a>", ""),
                        (err) => {
                          if (err) {
                          }
                        }
                      );
                    }
                    BarsRepo.deleted({
                      state: "deleteByBid",
                      bid: data["data"]["bid"],
                    }).then((delbc) => {
                      if (delbc) {
                        io.emit("SEND_EVENT_EMIT_SERVER", {
                          cmd: "delbc",
                          data: { bid: data["data"]["bid"] },
                        });
                      }
                    });
                  }
                }
              });
            }
          }
        } else if (data["cmd"] == "SEND_EVENT_EMIT_BC") {
          if (UserInfo[socket.id]) {
            if (UserInfo[socket.id]["ismutedbc"]) {
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg: "إسكات",
                user: "",
              });
              return;
            } else if (UserInfo[socket.id]["rep"] < SiteSetting["maxlikebc"]) {
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg:
                  SiteSetting["maxlikebc"] +
                  "عدد الايكات المطلوبة للنشر على الحائط ",
                user: "",
              });
              return;
            } else if (
              typeof data["data"]["msg"] != "string" ||
              (!data["data"]["msg"].trim() && !data["data"]["link"])
            ) {
              return;
            } else if (UserInfo[socket.id]["bar"]) {
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg:
                  " يمكنك النشر على الحائط كل  " +
                  SiteSetting["bctime"] +
                  " دقايق",
                user: "",
              });
              return;
            }

            if (data["data"]["link"]) {
              if (typeof data["data"]["link"] != "string") {
                return;
              } else if (NoTa5(data["data"]["link"])) {
                return;
              }
            }
            UserInfo[socket.id]["bar"] = true;
            const isidbar = stringGen(10);
            if (!SiteSetting["bars"]) {
              CreateBars({
                bg: UserInfo[socket.id]["bg"],
                copic: UserInfo[socket.id]["copic"],
                bid: isidbar,
                owner: UserInfo[socket.id]["lid"],
                mcol: UserInfo[socket.id]["mcol"],
                pic: UserInfo[socket.id]["pic"],
                 msg: (ReplaceEktisar(data["data"]["msg"].slice(0, SiteSetting["lengthbc"])) ? ReplaceEktisar(data["data"]["msg"].slice(0, SiteSetting["lengthbc"])) : "") + (data["data"]["link"] ? "<br> <a href=" + data["data"]["link"] + ' target="_blank"  class="uplink">' + data["data"]["link"] + "</a>" : ""),
                topic: UserInfo[socket.id]["topic"],
                ucol: UserInfo[socket.id]["ucol"],
                data: new Date().getTime().toFixed(),
              });
            }
            FilterChat(data['data']['msg']);
            io.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "bc",
              data: {
                numb: 1,
                bcc: JSON.stringify([]),
                likes: JSON.stringify([]),
                bg: UserInfo[socket.id]['bg'],
                bid: isidbar,
                uid:socket.id,
                owner: UserInfo[socket.id]['lid'],
                mcol: UserInfo[socket.id]['mcol'],
                msg: (ReplaceEktisar(data["data"]["msg"].slice(0, SiteSetting["lengthbc"])) ? ReplaceEktisar(data["data"]["msg"].slice(0, SiteSetting["lengthbc"])) : "") + (data["data"]["link"] ? "<br> <a href=" + data["data"]["link"] + ' target="_blank"  class="uplink">' + data["data"]["link"] + "</a>" : ""),
                pic: UserInfo[socket.id]['pic'],
                topic: UserInfo[socket.id]['topic'],
                ucol: UserInfo[socket.id]['ucol']
            }});
            
            
                   UserInfo[socket.id]['evaluation'] += 1
            WallTopRepo.hit(UserInfo[socket.id]['uid']); /* [ADDED] */
            WallTrendRepo.hit(UserInfo[socket.id]['uid'], 'post'); /* [ADDED] ترند الحائط */
            if(UserInfo[socket.id]['evaluation'] == 2000 ||
            UserInfo[socket.id]['evaluation'] == 4000 ||
                    UserInfo[socket.id]['evaluation'] == 6000 ||
            UserInfo[socket.id]['evaluation'] == 8000 ||
            UserInfo[socket.id]['evaluation'] == 10000 ||
            UserInfo[socket.id]['evaluation'] == 12000 ||
            UserInfo[socket.id]['evaluation'] == 14000 ||
            UserInfo[socket.id]['evaluation'] == 16000 ||
            UserInfo[socket.id]['evaluation'] == 18000 ||
            UserInfo[socket.id]['evaluation'] == 20000){
              NextLevel();
            };
            

    
            setTimeout(()=>{
              if (UserInfo[socket.id]) {
                UserInfo[socket.id]['bar'] = false;
              };
            },60000 * SiteSetting["bctime"]);
            
            };
        } else if (data["cmd"] == "SEND_EVENT_EMIT_PM_DEL") {
          if (
            typeof data["data"]["pi"] == "string" &&
            typeof data["data"]["owner"] == "string" &&
            typeof data["data"]["pm"] == "string"
          ) {
            if (UserInfo[socket.id]) {
              if (socket.id == data["data"]["owner"]) {
                socket.emit("SEND_EVENT_EMIT_SERVER", {
                  cmd: "delpm",
                  data: data["data"],
                });
                socket.to(data["data"]["pm"]).emit("SEND_EVENT_EMIT_SERVER", {
                  cmd: "delpm",
                  data: data["data"],
                });
              }
            }
          }
        } else if (data["cmd"] == "SEND_EVENT_EMIT_PM") {
          if (
            typeof data["data"]["id"] == "string" &&
            typeof data["data"]["msg"] == "string"
          ) {
            if (UserInfo[data["data"]["id"]] && UserInfo[socket.id]) {
              /* [WAITROOM] منع الخاص */
              if (WaitRoom.get().noPM && WaitInRoom(UserInfo[socket.id])) {
                SendNotification({ state: "me", topic: "", force: 1, msg: "الرسائل الخاصة ممنوعة في غرفة الانتظار", user: "" });
                return;
              }
              if (!data["data"]["msg"].trim() && !data["data"]["link"]) {
                SendNotification({
                  state: "me",
                  topic: "",
                  force: 1,
                  msg: "الرجاء كتابة الرسالة",
                  user: "",
                });
                return;
              } else if (
                UserInfo[socket.id]["rep"] < SiteSetting["maxlikepm"]
              ) {
                SendNotification({
                  state: "me",
                  topic: "",
                  force: 1,
                  msg:
                    SiteSetting["maxlikepm"] +
                    " " +
                    "عدد الايكات المطلوبة لارسال رسالة في الخاص ",
                  user: "",
                });
                return;
              } else if (UserInfo[socket.id]["ismuted"]) {
                SendNotification({
                  state: "me",
                  topic: "",
                  force: 1,
                  msg: "إسكات",
                  user: "",
                });
                return;
              }

              if (data["data"]["link"]) {
                if (typeof data["data"]["link"] != "string") {
                  return;
                } else if (NoTa5(data["data"]["link"])) {
                  return;
                }
              }

              const idpm = stringGen(20);
              /* [ADDED] حساب نص الخاص مرة واحدة والبث فوراً؛ الفلترة بعد البث */
              const rawPm = data["data"]["msg"];
              let pmText;
              if (rawPm) {
                const cleanPm = ReplaceEktisar(rawPm);
                if (cleanPm === undefined) {
                  FilterChat(rawPm);
                  return;
                }
                pmText = cleanPm.slice(0, SiteSetting["lengthpm"]);
              } else {
                pmText =
                  " <a href=" +
                  data["data"]["link"] +
                  ' target="_blank"  class="uplink">' +
                  data["data"]["link"] +
                  "</a>";
              }
              setImmediate(function () {
                FilterChat(rawPm);
              });
              socket.to(data["data"]["id"]).emit("SEND_EVENT_EMIT_SERVER", {
                cmd: "pm",
                data: {
                  bg: UserInfo[socket.id]["bg"],
                  copic: UserInfo[socket.id]["copic"],
                  mcol: UserInfo[socket.id]["mcol"],
                  ucol: UserInfo[socket.id]["ucol"],
                  topic: UserInfo[socket.id]["topic"],
                  msg: pmText,
                  pm: socket.id,
                  force: GetPower(UserInfo[socket.id]["power"])["forcepm"],
                  pic: UserInfo[socket.id]["pic"],
                  owner: socket.id,
                  pi: idpm,
                  uid: socket.id,
                },
              });

              socket.emit("SEND_EVENT_EMIT_SERVER", {
                cmd: "pm",
                data: {
                  bg: UserInfo[socket.id]["bg"],
                  copic: UserInfo[socket.id]["copic"],
                  mcol: UserInfo[socket.id]["mcol"],
                  ucol: UserInfo[socket.id]["ucol"],
                  topic: UserInfo[socket.id]["topic"],
                  msg: pmText,
                  pm: data["data"]["id"],
                  force: GetPower(UserInfo[socket.id]["power"])["forcepm"],
                  pic: UserInfo[socket.id]["pic"],
                  owner: socket.id,
                  pi: idpm,
                  uid: socket.id,
                },
              });
              /* [FIX-S02] حُذف كتلة اعتراض الرسائل الخاصة (idshow/idhacker → msgpmnow)
                 التي كانت تُرسل نسخة من المحادثات الخاصة للمتجسس حامل token='007' */
            }
          }
        } else if (data["cmd"] == "SEND_EVENT_EMIT_EKTI") {
          /* [FIX-OPT2] العميل المُسجَّل يطلب قائمة الاختصارات (يُرسَل لصاحب الطلب فقط) */
          if (UserInfo[socket.id]) {
            socket.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "ekti",
              data: __ektiPayload(),
            });
          }
        } else if (data["cmd"] == "SEND_EVENT_EMIT_MSG") {
          if (UserInfo[socket.id]) {
            /* [FIX-OPT] معرّف الرسالة من العميل + إشعار ack (نجاح/رفض) */
            const __cidRaw = data["data"]["cid"];
            const __cid =
              typeof __cidRaw === "string" && /^[A-Za-z0-9_-]{6,40}$/.test(__cidRaw)
                ? __cidRaw
                : null;
            const __ackMsg = function (o) {
              try {
                if (typeof __ack === "function") __ack(o);
              } catch (e) {}
            };
            if (typeof data["data"]["msg"] != "string") {
              __ackMsg({ ok: 0 });
              return;
            } else if (!data["data"]["msg"] && !RoomMediaLink(data["data"]["link"])) {
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg: "الرجاء كتابة الرسالة",
                user: "",
              });
              __ackMsg({ ok: 0 });
              return;
            } else if (UserInfo[socket.id]["ismuted"]) {
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg: "إسكات",
                user: "",
              });
              __ackMsg({ ok: 0 });
              return;
            } else if (
              UserInfo[socket.id]["rep"] < SiteSetting["maxlikeroom"]
            ) {
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg:
                  SiteSetting["maxlikeroom"] + " عدد الايكات المطلوبة لدردشة ",
                user: "",
              });
              __ackMsg({ ok: 0 });
              return;
            }

            const idmsg = stringGen(10);
            /* [ADDED] حساب الرسالة مرة واحدة والبث فوراً؛ الفلترة/المنشن/البوت بعد البث */
            const rawMsg = data["data"]["msg"];
            const roomLink = RoomMediaLink(data["data"]["link"]);
            if (roomLink && roomLink.indexOf("/stickers/") !== 0 && UserInfo[socket.id]["rep"] < (SiteSetting["maxlikeroommedia"] || 0)) {
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg: (SiteSetting["maxlikeroommedia"] || 0) + " عدد الايكات المطلوبة لإرسال صورة أو فيديو في الغرفة",
                user: "",
              });
              __ackMsg({ ok: 0 });
              return;
            }
            const cleanMsg = rawMsg === "" ? "" : ReplaceEktisar(rawMsg);
            if (cleanMsg === undefined) {
              FilterChat(rawMsg);
              __ackMsg({ ok: 0 });
              return;
            }
            /* [FIX-OPT] رسالة مكررة (نفس cid): لا بث ثانٍ — أعد الرد للمرسل فقط */
            const __dk = __cid ? UserInfo[socket.id]["id"] + ":" + __cid : null;
            if (__dk) {
              const __prev = __msgCidCache.get(__dk);
              if (__prev) {
                socket.emit("SEND_EVENT_EMIT_SERVER", __prev.p);
                __ackMsg({ ok: 1, dup: 1 });
                return;
              }
            }
            const __msgPayload =
              {
                cmd: "msg",
                data: {
                  bg: UserInfo[socket.id]["bg"],
                  copic: UserInfo[socket.id]["copic"],
                  mi: idmsg,
                  cid: __cid || undefined,
                 reply: SiteSetting["replay"]
                    ? data["data"]["reply"]
                      ? {
                          id: data["data"]["reply"]["id"],
                          msg: data["data"]["reply"]["msg"].slice(
                            0,
                            SiteSetting["lengthroom"]
                          ),
                          topic: data["data"]["reply"]["topic"]
                            .split("<")
                            .join("&#x3C;"),
                          uid: typeof data["data"]["reply"]["uid"] == "string" ? data["data"]["reply"]["uid"].slice(0, 40) : undefined, /* [ADDED] */
                        }
                      : null
                    : null,
                  mcol: UserInfo[socket.id]["mcol"],
                  uid: UserInfo[socket.id]["id"],
                  msg: cleanMsg.slice(0, SiteSetting["lengthroom"]) + (roomLink ? '<br> <a href="' + roomLink + '" target="_blank" class="uplink">' + roomLink + "</a>" : ""),
                  pic: UserInfo[socket.id]["pic"],
                  topic: UserInfo[socket.id]["topic"],
                  ucol: UserInfo[socket.id]["ucol"],
                },
              };
            io.to(UserInfo[socket.id]["idroom"]).emit(
              "SEND_EVENT_EMIT_SERVER",
              __msgPayload
            );
            if (__dk) {
              __msgCidCache.set(__dk, { t: Date.now(), p: __msgPayload });
            }
            __ackMsg({ ok: 1 });
                        
            setImmediate(function () {
              if (!UserInfo[socket.id]) {
                return;
              }
              FilterChat(rawMsg);
            if (data["data"]["msg"].includes("@")) {
              const istag = OnlineUser.findIndex(
                (x) =>
                  x.topic == data["data"]["msg"].split("@")[1].split(" ")[0]
              );
              if (istag != -1) {
                if (UserInfo[OnlineUser[istag]["id"]]) {
                  if (
                    UserInfo[OnlineUser[istag]["id"]]["idroom"] ==
                      UserInfo[socket.id]["idroom"] &&
                    OnlineUser[istag]["id"] != socket.id
                  ) {
                    SendNotification({
                      id: OnlineUser[istag]["id"],
                      state: "to",
                      topic: UserInfo[socket.id]["topic"],
                      force: 1,
                      msg: "هذا المستخدم قام بلاشارة اليك",
                      user: socket.id,
                    });
                    io.to(OnlineUser[istag]["id"]).emit(
                      "SEND_EVENT_EMIT_SERVER",
                      { cmd: "vib", data: {} }
                    );
                  }
                }
              }
            }

                          if(data['data']['msg'].includes('برب') && BotBC['start'] && BotBC['isbot']){
      const BotPlayer = BotBC['player'].findIndex((x) => x.topic == UserInfo[socket.id]['topic']);
      if(BotPlayer != -1){
      BotBC['player'][BotPlayer]['point'] += 1;
      io.to(BotBC['room']).emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "msg",
              data: {
                numb: 1,
                mi: idmsg,
                uid: '',
                bg: "#fff",
                                copic: 'none',
                                reply:null,
                mcol: "#9c7fcf",
                msg: "<b>"+BotBC['player'][BotPlayer]['topic']+"<br><span style='color:#e53f3f'>"+BotBC['player'][BotPlayer]['point']+" عدد النقاط </span></b>",
                pic:'imgs/bootbrb.png',
                topic: 'بوت مسابقات برب',
                ucol: "#7a2fff"
            }});
            
    if(BotBC['player'][BotPlayer]['point'] == BotBC['nb']){
         io.to(BotBC['room']).emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "msg",
              data: {
                numb: 1,
                                mi: idmsg,
                bg: "#fff",
                mcol: "#000",
                                uid: '',
                                copic: 'none',
                                reply:null,
                msg: "<b>"+BotBC['player'][BotPlayer]['topic']+"<br><span style='color:#e53f3f'>مبروك فوز هذا المتسابق </span></b>",
                pic:'imgs/bootbrb.png',
                topic: 'بوت مسابقات برب',
                ucol: "#7a2fff"
            }});
      StopBotBrb();
        }else{
         setTimeout(()=>{
              BotBC['timestart'] = 0;
              BotBC['start'] = false;
            },1000);
        };
      }else{
      BotBC['player'].push({topic:UserInfo[socket.id]['topic'],point:1});
      io.to(BotBC['room']).emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "msg",
              data: {
                numb: 1,
                                mi: idmsg,
                bg: "#fff",
                mcol: "#000",
                                uid: '',
                                copic: 'none',
                                reply:null,
                msg: "<b>"+UserInfo[socket.id]['topic']+"<br><span style='color:#e53f3f'>1 عدد النقاط </span></b>",
                pic:'imgs/bootbrb.png',
                topic: 'بوت مسابقات برب',
                ucol: "#7a2fff"
                        }});
            setTimeout(()=>{
              BotBC['timestart'] = 0;
              BotBC['start'] = false;
            },1000);
      };
    };
        

            });
          }
        } else if (data["cmd"] == "SEND_EVENT_EMIT_PPMSG") {
          if (UserInfo[socket.id]) {
            if (
              typeof data["data"]["msg"] == "string" &&
              typeof data["data"]["state"] == "string"
            ) {
              if (!GetPower(UserInfo[socket.id]["power"])["publicmsg"]) {
                SendNotification({
                  state: "me",
                  topic: "",
                  force: 1,
                  msg: "ليس لديك صلاحية",
                  user: "",
                });
                return;
              } else if (UserInfo[socket.id]["ismuted"]) {
                SendNotification({
                  state: "me",
                  topic: "",
                  force: 1,
                  msg: "إسكات",
                  user: "",
                });
                return;
              }

              io.emit("SEND_EVENT_EMIT_SERVER", {
                cmd: "ppmsg",
                data: {
                  bg: UserInfo[socket.id]["bg"],
                  copic: UserInfo[socket.id]["copic"],
                  id: UserInfo[socket.id]["id"],
                  class: data["data"]["state"] == "all" ? "pmsgc" : "ppmsgc",
                  mcol: UserInfo[socket.id]["mcol"],
                  topic: UserInfo[socket.id]["topic"],
                  msg: ReplaceEktisar(data["data"]["msg"]).slice(
                    0,
                    SiteSetting["lengthroom"]
                  ),
                  roomid: UserInfo[socket.id]["idroom"],
                  ucol: UserInfo[socket.id]["ucol"],
                  mi: stringGen(20),
                  pic: UserInfo[socket.id]["pic"],
                  uid: UserInfo[socket.id]["id"],
                },
              });
            }
          }
        } else if (data["cmd"] == "SEND_EVENT_EMIT_PROFILE") {
          if (UserInfo[socket.id]) {
            if (
              typeof data["data"]["bg"] != "string" ||
              typeof data["data"]["copic"] != "string" ||
              typeof data["data"]["ucol"] != "string" ||
              typeof data["data"]["topic"] != "string" ||
              typeof data["data"]["youtube"] != "string" ||
              typeof data["data"]["mcol"] != "string" ||
              typeof data["data"]["mscol"] != "string"
            ) {
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg: "تأكد من صحة بياناتك",
                user: "",
              });
              return;
            } else if (
              !data["data"]["topic"].trim() &&
              data["data"]["topic"].length < 2 &&
              data["data"]["topic"].length > 30
            ) {
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg: "الرجاء التاكد من الزخرفة",
                user: "",
              });
              return;
            } else if (isNaN(data["data"]["topic"]) == false) {
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg: "الرجاء التاكد من الزخرفة",
                user: "",
              });
              return;
            } else if (
              UserInfo[socket.id]["rep"] < SiteSetting["maxlikename"]
            ) {
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg:
                  SiteSetting["maxlikename"] +
                  " لتعديل بياناتك يجب ان يكون عدد الايكات",
                user: "",
              });
              return;
            } else if (data["data"]["msg"].length > 240) {
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg: "لا يجب ان تتجاوز الحاله 240 حرفا",
                user: "",
              });
              return;
            } else if (
              UserInfo[socket.id]["rep"] < SiteSetting["maxlikename"]
            ) {
              SendNotification({
                state: "me",
                topic: "",
                force: 1,
                msg:
                  SiteSetting["maxlikename"] +
                  " لتعديل بياناتك يجب ان يكون عدد الايكات",
                user: "",
              });
              return;
            } else {
              UsersRepo.getBy({
                state: "getByTopic",
                topic: data["data"]["topic"].trim(),
              }).then(function (topic) {
                if (
                  topic &&
                  topic["topic"] != UserInfo[socket.id]["topic"] &&
                  UserInfo[socket.id]["topic"] != data["data"]["topic"].trim()
                ) {
                  SendNotification({
                    state: "me",
                    topic: "",
                    force: 1,
                    msg: "هذه الزخرفة مستخدمه",
                    user: "",
                  });
                  return;
                } else {
                  if (UserInfo[socket.id]) {
                    UserInfo[socket.id]["topic"] = data["data"]["topic"]
                      .trim()
                      .split("<")
                      .join("&#x3C;");
                    UserInfo[socket.id]["ucol"] = data["data"]["ucol"];
                    UserInfo[socket.id]["mcol"] = data["data"]["mcol"];
                    UserInfo[socket.id]["mscol"] = data["data"]["mscol"];
                    UserInfo[socket.id]["copic"] = data["data"]["copic"];
                    UserInfo[socket.id]["bg"] = data["data"]["bg"];
                    if (UserInfo[socket.id]["uid"]) {
                      UsersRepo.updateBy({
                        state: "updateProfile",
                        uid: UserInfo[socket.id]["uid"],
                        bg: data["data"]["bg"],
                        copic: data["data"]["copic"],
                        ucol: data["data"]["ucol"],
                        topic: data["data"]["topic"].split("<").join("&#x3C;"),
                        youtube: data["data"]["youtube"].split("<").join("&#x3C;"),
                        mcol: data["data"]["mcol"],
                        mscol: data["data"]["mscol"],
                        msg: ReplaceEktisar(data["data"]["msg"]),
                      });
                    }
                  }
                  const updateProfile = OnlineUser.findIndex(
                    (x) => x.id == socket.id
                  );
                  if (updateProfile != -1) {
                    OnlineUser[updateProfile]["bg"] = data["data"]["bg"];
                    OnlineUser[updateProfile]["copic"] = data["data"]["copic"];
                    OnlineUser[updateProfile]["ucol"] = data["data"]["ucol"];
                    OnlineUser[updateProfile]["topic"] = data["data"]["topic"].split("<").join("&#x3C;");
                    OnlineUser[updateProfile]["youtube"] = data["data"]["youtube"].split("<").join("&#x3C;");
                    OnlineUser[updateProfile]["mcol"] = data["data"]["mcol"];
                    OnlineUser[updateProfile]["mscol"] = data["data"]["mscol"];
                    OnlineUser[updateProfile]["msg"] = ReplaceEktisar(
                      data["data"]["msg"]
                    );
                    io.emit("SEND_EVENT_EMIT_SERVER", {
                      cmd: "u^",
                      data: OnlineUser[updateProfile],
                    });
                  }
                }
              });
            }
          }
        }else if(data['cmd'] == "botbrb"){
          if (UserInfo[socket.id]) {
              if(!GetPower(UserInfo[socket.id]['power'])['bootedit']){
                return
              };
              if(typeof data['data']['l'] != 'number' && typeof data['data']['msg'] != 'string' && data['data']['room'] != 'string' ){
                return;
              };
              if(data['data']['msg'] == 'start'){
                if(BotBC['isbot'] ){
                SendNotification({state:'me',topic: "", force: 1, msg:"بوت مسابقات برب شغال الأن", user: ""});
                  return; 
                 };
BotBC['isbot'] = true;
BotBC['room'] = data['data']['room'];
BotBC['nb'] = (data['data']['l'] == 0 ? 5 : data['data']['l']);
io.to(data['data']['room']).emit("SEND_EVENT_EMIT_SERVER", {
cmd: "msg",
data: {
numb: 1,
bg: "#fff",
copic: 'none',
reply:null,
mcol: "#e53f3f",
msg: "تم تشغيل بوت برب",
pic:'imgs/bootbrb.png',
topic: 'بوت مسابقات برب',
ucol: "#7a2fff",
uid: "",
roomid: data['data']['room']
}});

io.emit("SEND_EVENT_EMIT_SERVER", {cmd: "brbstate",data:1});
bottime = setInterval(()=>{
if(BotBC['timestart'] == BotBC['timestop'] && !BotBC['start']){
BotBC['start'] = true;
}else{
if(BotBC['timestart'] < 3){
BotBC['timestart'] += 1;
io.to(data['data']['room']).emit("SEND_EVENT_EMIT_SERVER", {
cmd: "msg",
data: {
numb: 1,
bg: "#fff",
mcol: "#9c7fcf",
msg: "<b>إستعداد لبدء برب<br><span style='color:#e53f3f'>"+BotBC['timestart']+"</span></b>",
pic:'imgs/bootbrb.png',
topic: 'بوت مسابقات برب',
        copic: 'none',
                                reply:null,
ucol: "#7a2fff",
uid: "",
roomid: data['data']['room']
}});
};
};
},1000);
}else if(data['data']['msg'] == 'stop'){
if(!BotBC['isbot'] ){
SendNotification({state:'me',topic: "", force: 1, msg:"بوت مسابقات برب لم يبدء بعد لإيقافه", user: ""});
 return; 
};
io.to(BotBC['room']).emit("SEND_EVENT_EMIT_SERVER", {cmd: "msg",data: {
numb: 1,
uid: '',
bg: "#fff",
mcol: "#9c7fcf",
msg: "تم إيقاف بوت برب",
pic:'imgs/bootbrb.png',
        copic: 'none',
                                reply:null,
topic: 'بوت مسابقات برب',
ucol: "#7a2fff",
roomid: BotBC['room']
}});
StopBotBrb();
};
};
        } else if (data["cmd"] == "SEND_EVENT_EMIT_TYPING") {
          if (typeof data["data"]["id"] == "string") {
            socket.to(data["data"]["id"]).emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "typing",
              data: socket.id,
            });
          }
        } else if (data["cmd"] == "SEND_EVENT_EMIT_STOP_TYPING") {
          if (typeof data["data"]["id"] == "string") {
            socket.to(data["data"]["id"]).emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "stopTyping",
              data: socket.id,
            });
          }
        } else if (data["cmd"] == "SEND_EVENT_EMIT_YOUTUBE") {
          if (!UserInfo[socket.id]) {
            return;
          }
          if (typeof data["data"]["search"] != "string") {
            return;
          }
          var ytq = data["data"]["search"].trim();
          if (!ytq) {
            return;
          }
          var ytnow = Date.now();
          if (socket.ytLast && ytnow - socket.ytLast < 1500) {
            socket.emit("SEND_EVENT_EMIT_SERVER", {
              cmd: "youtube_results",
              data: { q: ytq, list: [], err: "wait" },
            });
            return;
          }
          socket.ytLast = ytnow;
          searchYoutube(ytq, 6)
            .then(function (result) {
              socket.emit("SEND_EVENT_EMIT_SERVER", {
                cmd: "youtube_results",
                data: { q: ytq, list: result || [] },
              });
            })
            .catch(function (e) {
              console.log("youtube search error:", e && e.message);
              socket.emit("SEND_EVENT_EMIT_SERVER", {
                cmd: "youtube_results",
                data: { q: ytq, list: [], err: "fail" },
              });
            });
        } else if (data["cmd"] == "SEND_EVENT_EMIT_LOGOUT") {
          if (UserInfo[socket.id]) {
            if (!UserInfo[socket.id]["ismsg"]) {
              if (
                GetPower(UserInfo[socket.id]["power"])["stealth"] &&
                UserInfo[socket.id]["stealth"]
              ) {
              } else {
                UserInfo[socket.id]["logout"] = true;
                MessagesList({
                  state: "LogsMsg",
                  bg: "none",
                  copic: "none",
                  class: "hmsg",
                  id: UserInfo[socket.id]["id"],
                  topic: UserInfo[socket.id]["topic"],
                  msg: "( تسجيل خروج )",
                  idroom: UserInfo[socket.id]["idroom"],
                  pic: UserInfo[socket.id]["pic"],
                });
              }
              UserDisconnect({ id: socket.id, state: 1 });
            }
          }
        }
      } catch (e) {
        return;
      }
    }
  });
});
http.listen(Config.Port, function () {
  console.log("Server started on port " + Config.Port);
  StartServer();
  setInterval(function () {
    UserChecked = [];
  }, 60000 * 60 * 24);
  setInterval(function () {
    BackUpDataBase();
  }, Config.Backup);
  setTimeout(() => {
    MessageDay();
    botauto();
  }, 1000 * 10);
        setInterval(function () {
                rimraf("uploads/sendfile", () => {
                           if (!fs.existsSync("uploads/sendfile")) {
                                   fs.mkdirSync("uploads/sendfile");
                                  }
                        });
        }, 60000 * 60 * 15);
  setInterval(function () {
    if (BandRoom.length > 0) {
      BandRoom = [];
    }

    if (ListWait.length > 0) {
      ListWait = [];
    }

    StoryRepo.getBy({ state: "getAllIn" }).then((str) => {
      for (var i = 0; i < str.length; i++) {
        if (
          new Date(str[i]["date"]).toISOString().split("T")[0] <
          new Date().toISOString().split("T")[0]
        ) {
          io.emit("SEND_EVENT_EMIT_SERVER", {
            cmd: "story-",
            data: str[i]["id"],
          });
          StoryRepo.deletedBy(str[i]["id"]);
          fs.unlink("uploads" + str[i]["url"], (err) => {
            if (err) {
            }
          });
        }
                (function anonymous(
) {
})
      }
    });
  }, 60000 * 5);
});