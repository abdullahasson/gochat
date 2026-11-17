/* [ADDED - PHASE 1] غلاف البروفايل: معالجة رفع الصورة + حدث تغيير الغلاف
   ملف مستقل عشان ما نحشرش الكود جوه server.js */
const fs = require("fs");
const sharp = require("sharp");

/* [ADDED - PHASE 1] أبعاد الغلاف المحفوظ (عرض × ارتفاع) */
const COVER_W = 900;
const COVER_H = 300;

/* [ADDED - PHASE 1] المسار المسموح بيه للغلاف فقط: /pic/<رقم>.<امتداد>.jpg
   أي قيمة تانية (مثل القيمة القديمة site/cover.png) بتتحول لفاضي = الغلاف الافتراضي */
const COVER_RE = /^\/pic\/\d+\.[a-z0-9]+\.jpg$/i;

function normalize(c) {
  return typeof c === "string" && COVER_RE.test(c) ? c : "";
}

/* [ADDED - PHASE 1] تصغير/قص الصورة المرفوعة لحجم الغلاف وإرجاع المسار الجديد */
async function processUpload(folder, filename) {
  const src = "uploads/" + folder + "/" + filename;
  const outName = filename + ".jpg";
  await sharp(src)
    .rotate()
    .resize(COVER_W, COVER_H, { fit: "cover", position: "centre" })
    .jpeg({ quality: 82 })
    .toFile("uploads/" + folder + "/" + outName);
  /* حذف الأصل كبير الحجم */
  fs.unlink(src, function () {});
  return "/" + folder + "/" + outName;
}

/* [ADDED - PHASE 1] حدث SEND_EVENT_EMIT_COVER
   ctx: { socket, data, UserInfo, OnlineUser, io, SiteSetting, UsersRepo, SendNotification } */
function handle(ctx) {
  const d = ctx.data;
  if (!d || typeof d !== "object" || typeof d.cover !== "string") return;
  const me = ctx.UserInfo[ctx.socket.id];
  if (!me) return;
  /* فاضي = رجوع للغلاف الافتراضي */
  const cover = d.cover === "" ? "" : d.cover;
  if (cover !== "" && !COVER_RE.test(cover)) return;
  if (me["rep"] < ctx.SiteSetting["maxlikecover"]) {
    ctx.SendNotification({
      state: "me",
      topic: "",
      force: 1,
      msg: ctx.SiteSetting["maxlikecover"] + " لتغيير الغلاف يجب ان يكون عدد اللايكات",
      user: "",
    });
    return;
  }
  const idx = ctx.OnlineUser.findIndex(function (x) {
    return x.id == ctx.socket.id;
  });
  if (idx == -1) return;
  me["cover"] = cover;
  ctx.OnlineUser[idx]["cover"] = cover;
  ctx.io.emit("SEND_EVENT_EMIT_SERVER", {
    cmd: "u^",
    data: ctx.OnlineUser[idx],
  });
  if (me["uid"]) {
    ctx.UsersRepo.updateBy({
      state: "updateCover",
      uid: me["uid"],
      cover: cover,
    });
  }
}

module.exports = { normalize, processUpload, handle, COVER_RE };
