/* نسخ مخففة (WebP) للأيقونات والأفاتارات والإيموشنات
   - نفس الرابط القديم (/sico/xxx.gif) بيرجّع نسخة WebP أخف، من غير ما نغيّر قاعدة البيانات ولا الكود في المتصفح
   - النسخة بتتعمل أول مرة الملف يتطلب وتتخزن في فولدر thumbs-cache (الأصل مبيتلمسش)
   - لو النسخة الخفيفة مش أصغر من الأصل أو حصل خطأ: بيتقدم الأصل زي ما هو */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const SRC_DIR = path.join(ROOT, "uploads");
const CACHE_DIR = path.join(ROOT, "thumbs-cache");

/* أقصى مقاس (بكسل) + جودة لكل نوع — بحجم ~ضعف المعروض للشاشات عالية الدقة
   [FIX-S26/الجلسة5] تخفيف حقيقي: الإطارات المتحركة كانت 400px جودة 75 (عرضها الفعلي
   80px!) — نزّلناها 220px جودة 58؛ الأفاتارات 900→640 جودة 68؛ صور الشات/الغرف
   1280→1080 جودة 62-70. النتيجة: بايتات أقل بكثير وفك تشفير أخف = سخونة أقل */
const KINDS = {
  sico: { w: 320, h: 80, q: 75 },
  dro3: { w: 320, h: 80, q: 75 },
  atar: { w: 220, h: 220, q: 58 },
  emo: { w: 96, h: 96, q: 75 },
  /* [FIX-PERF] نسخ خفيفة لصور المستخدمين — كانت تُخدم بالحجم الأصلي (حتى 20MB):
     pic: الأفاتارات (تُعرض بـ62px) + الأغلفة (900×300)
     picroom: خلفيات وصور الغرف — لم تكن تُصغّر إطلاقاً عند الرفع
     back: خلفيات صفحة المستخدم
     sendfile: صور الشات القديمة (الجديدة تُصغّر وقت الرفع) */
  pic: { w: 640, h: 640, q: 68 },
  picroom: { w: 1080, h: 1080, q: 70 },
  back: { w: 1080, h: 1080, q: 70 },
  sendfile: { w: 1080, h: 1080, q: 62 },
  /* [FIX-PERF] صور القصص: كانت تُقرأ بـ Jimp ثم تُهمل بدون أي معالجة! */
  story: { w: 720, h: 1080, q: 70 },
};
const THUMB_W = 150, THUMB_H = 150, THUMB_Q = 68; /* [FIX-S28] مصغرة ثابتة 150px للصفوف والنوافذ */
const NAME_RE = /^[A-Za-z0-9_.-]+\.(gif|jpe?g|png|webp)$/i;
const MAX_CONCURRENT = 4; /* [FIX-PERF] كانت 2 — رفعناها لتسريع بناء الكاش مع أنواع الصور الجديدة (أفاتارات/غرف/شات) */

const inflight = new Map();
let running = 0;
const waiting = [];

function limit(fn) {
  return new Promise((resolve, reject) => {
    const run = () => {
      running++;
      fn().then(resolve, reject).finally(() => {
        running--;
        if (waiting.length) waiting.shift()();
      });
    };
    running < MAX_CONCURRENT ? run() : waiting.push(run);
  });
}

function paths(kind, name) {
  const cfg = KINDS[kind];
  /* [FIX-S26/الجلسة5] الإصدار داخل اسم الكاش نفسه: أي تغيير في المقاس/الجودة
     يولّد نسخة جديدة تلقائيًا — الكاش القديم (400px/75 مثلاً) ما كانش
     بيتجدد أبدًا لأن mtime الأصل أقدم دايمًا، فالمستخدم كان هيفضل عالنسخة
     الثقيلة للأبد حتى بعد رفع الكود الجديد */
  const vs = cfg ? ".v" + cfg.w + "x" + cfg.h + "q" + cfg.q : "";
  const src = path.join(SRC_DIR, kind, name);
  const base = path.join(CACHE_DIR, kind, name);
  return { src, thumb: base + vs + ".webp", marker: base + vs + ".orig", stalePrefix: base + ".", staleKeep: base + vs };
}

/* [FIX-S26/الجلسة5] إزالة نسخ الكاش المولّدة بإعدادات قديمة (أحادية الاستخدام آمنة: مجلداتنا فقط) */
async function clearStale(kind, name) {
  try {
    const p = paths(kind, name);
    const dir = path.dirname(p.thumb);
    const files = await fs.promises.readdir(dir);
    for (const f of files) {
      if (f.startsWith(path.basename(name) + ".") && !f.startsWith(path.basename(p.staleKeep) + ".webp") && !f.startsWith(path.basename(p.staleKeep) + ".orig")) {
        await fs.promises.unlink(path.join(dir, f)).catch(() => {});
      }
    }
  } catch (e) {}
}

/* بترجّع مسار النسخة الخفيفة، أو null لو لازم نستخدم الأصل */
async function ensure(kind, name) {
  const cfg = KINDS[kind];
  if (!cfg || !NAME_RE.test(name)) return null;
  const p = paths(kind, name);
  let st;
  try {
    st = await fs.promises.stat(p.src);
  } catch (e) {
    return null;
  }
  if (!st.isFile()) return null;
  /* جاهزة؟ (ونسخة الأصل مش أحدث منها) */
  for (const f of [p.thumb, p.marker]) {
    try {
      const t = await fs.promises.stat(f);
      if (t.mtimeMs >= st.mtimeMs) return f === p.thumb ? p.thumb : null;
    } catch (e) {}
  }
  const key = kind + "/" + name;
  if (!inflight.has(key)) {
    const job = limit(async () => {
      await fs.promises.mkdir(path.dirname(p.thumb), { recursive: true });
      const tmp = p.thumb + "." + process.pid + ".tmp";
      try {
        await sharp(p.src, { animated: true, limitInputPixels: 100000000 })
          .rotate()
          .resize(cfg.w, cfg.h, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: cfg.q, effort: 4 })
          .toFile(tmp);
        const out = await fs.promises.stat(tmp);
        if (out.size >= st.size) {
          await fs.promises.unlink(tmp).catch(() => {});
          await fs.promises.writeFile(p.marker, "");
          return null;
        }
        await fs.promises.rename(tmp, p.thumb);
        return p.thumb;
      } catch (e) {
        await fs.promises.unlink(tmp).catch(() => {});
        console.log("thumb error:", key, e && e.message);
        return null;
      }
    }).finally(() => inflight.delete(key));
    inflight.set(key, job);
  }
  return inflight.get(key);
}

/* [FIX-S26] المتصفحات الحديثة كلها تقبل WebP — لكن القديمة (Safari<14 / IE) لا:
   لا نقدملها WebP بايتات باسم ملف .gif وإلا تنكسر الصور. بدون Accept WebP
   بنتقدم الأصل زي ما هو */
function acceptsWebp(req) {
  if (req.headers["accept"] === undefined) return true; /* عملاء غير متصفحين */
  return String(req.headers["accept"]).indexOf("image/webp") !== -1;
}

/* Express middleware: لازم يتحت قبل express.static("uploads") */
function middleware(req, res, next) {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  const m = /^\/(sico|dro3|atar|emo|pic|picroom|back|sendfile|story)\/([^\/]+)$/.exec(req.path);
  if (!m) return next();
  if (!acceptsWebp(req)) return next();
  if (/\.(?:gif|jpe?g|png|webp)\.jpg$/i.test(m[2])) return next(); /* [FIX-S29] المصغرة الثابتة تُخدم كما هي */
  let name;
  try {
    name = decodeURIComponent(m[2]);
  } catch (e) {
    return next();
  }
  ensure(m[1], name)
    .then((file) => {
      if (!file) return next();
      res.set("Content-Type", "image/webp");
      res.set("Cache-Control", "public, max-age=2592000");
      res.sendFile(file, (err) => {
        if (err && !res.headersSent) next();
      });
    })
    .catch(() => next());
}

/* [FIX-S28] المصغّرة الثابتة 150px للصفوف/النوافذ/الحائط (x.webp.jpg / x.gif.jpg …)
   — القائمة بتطلبها من removegifpic. لو الأصل موجود والمصغرة ناقصة (ملفات
   قديمة رُفعت قبل توليد المصغرات): تتولد لحظياً مرة واحدة ثم تُخدم للأبد.
   لازم قبل express.static("uploads") */
const THUMB_REQ_RE = /^\/pic\/([A-Za-z0-9_.-]+\.(?:gif|jpe?g|png|webp))\.jpg$/i;
const thumbInflight = new Map();
function ensureThumbJpg(name) {
  if (thumbInflight.has(name)) return thumbInflight.get(name);
  const job = (async () => {
    const orig = path.join(SRC_DIR, "pic", name);
    const thumb = orig + ".jpg";
    let st;
    try { st = await fs.promises.stat(orig); } catch (e) { return null; }
    if (!st.isFile()) return null;
    try { await fs.promises.access(thumb); return thumb; } catch (e) {}
    const tmp = thumb + "." + process.pid + ".tmp";
    try {
      /* بلا animated — أول فريم فقط: المصغرة لازم تكون صورة ثابتة خفيفة */
      await sharp(orig, { limitInputPixels: 100000000 })
        .rotate()
        .resize(THUMB_W, THUMB_H, { fit: "contain", background: "transparent" })
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: THUMB_Q })
        .toFile(tmp);
      await fs.promises.rename(tmp, thumb);
      return thumb;
    } catch (e) {
      await fs.promises.unlink(tmp).catch(() => {});
      console.log("thumb-jpg error:", name, e && e.message);
      return null;
    }
  })().finally(() => thumbInflight.delete(name));
  thumbInflight.set(name, job);
  return job;
}
function thumbJpg(req, res, next) {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  const m = THUMB_REQ_RE.exec(req.path);
  if (!m) return next();
  let name;
  try { name = decodeURIComponent(m[1]); } catch (e) { return next(); }
  ensureThumbJpg(name)
    .then((file) => {
      if (!file) return next();
      res.set("Content-Type", "image/jpeg");
      res.set("Cache-Control", "public, max-age=2592000");
      res.sendFile(file, (err) => {
        if (err && !res.headersSent) next();
      });
    })
    .catch(() => next());
}

/* [FIX-S26] تسخين مسبق عند الإقلاع: يولّد النسخ المخففة للإطارات/الخلفيات
   المتحركة + المصغرات الناقصة للأفاتارات القديمة — بالنار والنسيان حتى
   أول زائر مايدفعش تكلفة التوليد */
async function prewarm() {
  try {
    for (const kind of ["atar", "back"]) {
      const dir = path.join(SRC_DIR, kind);
      let files = [];
      try { files = await fs.promises.readdir(dir); } catch (e) { continue; }
      for (const f of files) {
        if (!NAME_RE.test(f)) continue;
        clearStale(kind, f).catch(() => {}); /* [FIX-S26] تنظيف كاش الإعدادات القديمة */
        ensure(kind, f).catch(() => {});
        await new Promise((r) => setTimeout(r, 30)); /* تنفيل لطيف للـ I/O */
      }
    }
    try {
      const files = await fs.promises.readdir(path.join(SRC_DIR, "pic"));
      for (const f of files) {
        const m = /^([A-Za-z0-9_.-]+\.(?:gif|jpe?g|png|webp))\.jpg$/i.exec(f);
        if (m) continue;
        if (!NAME_RE.test(f)) continue;
        let has = false;
        try { await fs.promises.access(path.join(SRC_DIR, "pic", f) + ".jpg"); has = true; } catch (e) {}
        if (!has) { await ensureThumbJpg(f).catch(() => {}); await new Promise((r) => setTimeout(r, 30)); } /* [FIX-S29] تسلسلي بدل إطلاق الكل معاً */
      }
    } catch (e) {}
  } catch (e) {
    console.log("prewarm error:", e && e.message);
  }
}

module.exports = { middleware, thumbJpg, ensure, ensureThumbJpg, prewarm, KINDS, SRC_DIR, acceptsWebp };
