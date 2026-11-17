/*
  router/login_king.js
  =====================================================================
  [ADDED - LOGIN KING SAFE - PHASE 1]
  إعلان دخول العضو المميّز (loginG). كان السيرفر بيبني كود JavaScript كنص فيه اسم العضو وصورته وبيبعته لكل المتصلين،
  والعميل بينفّذه بـ eval (x2.js حالة "ev") = أي اسم فيه علامة ' كان بينفّذ كود عند كل المتصلين.
  دلوقتي السيرفر بيبعت بيانات بس (cmd: "loginking") بعد تعقيمها، والعميل (public/login-king/login-king.js) بيبني العنصر بأمان.
*/
"use strict";

/* مسار صورة آمن للاستخدام داخل CSS url("..."): مسار نسبي أو http(s) بحروف URL عادية فقط (مفيش ' " ( ) \ < > مسافات) */
var DEFAULT_PIC = "site/pic.png";
var PIC_RE = /^[A-Za-z0-9_\-.\/:%~@+,=&?#]{1,300}$/;
function safePic(p) {
  if (typeof p !== "string") return DEFAULT_PIC;
  var v = p.trim();
  if (!PIC_RE.test(v)) return DEFAULT_PIC;
  if (/^[a-z][a-z0-9+.\-]*:/i.test(v) && !/^https?:\/\//i.test(v)) return DEFAULT_PIC; /* javascript: / data: ... مرفوضة */
  return v;
}

/* كود الدولة لاسم ملف العلم: حروف/أرقام بس (2-3) */
function safeFlag(c) {
  var v = String(c == null ? "" : c).toLowerCase().replace("il", "ps").replace(/[^a-z0-9]/g, "");
  if (v.length < 2 || v.length > 3) return "tn";
  return v;
}

/* نفس تعقيم الاسم المستخدم في قايمة المتصلين: < بتتحوّل لكيان نصي فمفيش وسوم بتتكوّن */
function safeTopic(t) {
  return String(t == null ? "" : t).slice(0, 120).split("<").join("&#x3C;");
}

function payload(data) {
  data = data || {};
  return { pic: safePic(data["pic"]), topic: safeTopic(data["topic"]), co: safeFlag(data["country"]) };
}

module.exports = { payload: payload, safePic: safePic, safeFlag: safeFlag, safeTopic: safeTopic };
