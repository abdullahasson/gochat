إصلاح الفراغ الأبيض تحت شريط "المتواجدون في الغرفة" - ملف واحد:

public/users-style.js : الصفوف كانت بتتحسب position:relative بدل absolute (قاعدة .uhtml أقوى من قاعدة vlist)
                        فكانت بتنزل بعد الـ spacer. دلوقتي position:absolute!important فالأسماء بتبدأ تحت الهيدر مباشرة.

بعد النسخ: Ctrl+Shift+R في صفحة الشات (مفيش حاجة تتعمل في السيرفر).
