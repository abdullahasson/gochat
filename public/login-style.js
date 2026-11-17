/*
 * صفحة اللوجين الجديدة (DAHAB CHAT)
 * بتتحمّل بس لو "تغيير صفحة اللوجين" مفعّل من لوحة التحكم > الإضافات.
 *
 * روابط الأزرار اللي فوق (جوائز، مسابقات، فيسبوك ...) — حط الرابط بين الـ ' ' والزر هيفتحه في تبويب جديد.
 * زر من غير رابط بيفضل شكل بس. ممكن تكتب "tel:+20123..." للاتصال أو "mailto:..." للبريد.
 */
window.LOGIN_LINKS = window.LOGIN_LINKS || {
  prizes: '',     // جوائز
  contests: '',   // مسابقات
  events: '',     // فعاليات
  guide: '',      // دليل الاستخدام
  subs: '',       // الإشتراكات
  rules: '',      // القوانين
  facebook: '',   // فيسبوك
  world: '',      // العالم
  location: '',   // الموقع
  mail: '',       // البريد
  friends: '',    // الأصدقاء
  mobile: '',     // موبايل
  account: '',    // حسابي
  sms: '',        // SMS
  messages: '',   // رسائل
  call: ''        // اتصال
};

(function () {
  function init() {
    var $ = window.jQuery;
    if (!$) return;
    var box = $('#tlogins');
    if (!box.length || !box.hasClass('nl')) return;

    // نصوص زي الصورة
    $('#u1').attr('placeholder', 'أكتب الاسم المستعار');
    $('#u2,#u3').attr('placeholder', 'أكتب إسم العضو');
    $('#pass1,#pass2').attr('placeholder', 'أكتب كلمة المرور');
    $('#tlogins .nav-tabs a[href="#l3"]').text('تسجيل عضوية');
    $('#tlogins .nav-tabs a[href="#l1"]').text('دخول الزوار');
    $('#tlogins .nav-tabs a[href="#l2"]').text('دخول الأعضاء');

    // الافتراضي زي الصورة: تبويب "دخول الأعضاء"
    try { $('#tlogins .nav-tabs a[href="#l2"]').tab('show'); } catch (e) { }

    // أزرار الشريط العلوي
    $('#tlogins .nl-it').on('click', function () {
      var k = $(this).attr('data-k');
      var u = (window.LOGIN_LINKS || {})[k];
      if (!u) return;
      if (/^(tel:|mailto:|sms:)/i.test(u)) { location.href = u; return; }
      window.open(u, '_blank', 'noopener');
    });
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
