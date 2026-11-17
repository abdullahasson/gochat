/* waitroom-admin.js — تبويب "غرفة الانتظار" في لوحة التحكم (يتحمل بعد admin.js و admin-ui.js) */
(function () {
  'use strict';
  var $ = window.jQuery || window.$;
  if (!$) return;
  var P = '.WaitLogs';

  function esc(v) { return $('<div>').text(v == null ? '' : String(v)).html(); }
  function emit(cmd, extra) {
    var o = { cmd: cmd, limit: 1 };
    for (var k in (extra || {})) o[k] = extra[k];
    window.socket.emit('SHWO_PANEL_ADMIN', o);
  }

  function render(d) {
    var s = d.settings || {};
    $(P + ' .wr-enabled').prop('checked', !!s.enabled);
    $(P + ' .wr-leave').val(s.leaveLikes);
    $(P + ' .wr-nolikes').prop('checked', !!s.noLikes);
    $(P + ' .wr-noalert').prop('checked', !!s.noAlert);
    $(P + ' .wr-nopm').prop('checked', !!s.noPM);
    $(P + ' .wr-foreign').prop('checked', !!s.foreign);
    $(P + ' .wr-feat').val(s.featureLikes);
    $(P + ' .wr-auto').prop('checked', !!s.autoMove);
    var list = d.list || [];
    $(P + ' .wr-count').text(list.length);
    var rows = '';
    for (var i = 0; i < list.length; i++) {
      var u = list[i];
      rows += '<tr><td>' + esc(u.topic) + '</td><td>' + esc(u.username) + '</td><td>' + esc(u.rep) +
        '</td><td>' + esc(u.country) + '</td><td>' + esc(u.ip) + '</td><td>' + esc(u.islogin) +
        '</td><td><button type="button" class="btn btn-success btn-xs wr-rel" data-id="' + esc(u.id) + '">نقل</button></td></tr>';
    }
    $(P + ' .wr-table tbody').html(rows || '<tr><td colspan="7">لا يوجد منتظرون</td></tr>');
    $(P).show();
  }

  /* admin.js بينشئ socket جديد أكتر من مرة (allload بيتنادى من عدة أماكن)،
     فالمستمع لازم يتربط بكل socket جديد مش بأول واحد بس */
  var boundSock = null;
  function hookSocket() {
    var sk = window.socket;
    if (!sk || typeof sk.on !== 'function' || sk === boundSock) return;
    boundSock = sk;
    sk.on('SHWO_PANEL_ADMIN', function (r) {
      if (r && r.cmd === 'SEND_ADMIN_WAITROOM' && r.data) render(r.data);
    });
  }

  function bind() {
    hookSocket();
    setInterval(hookSocket, 300);
    $(document).on('click', '.side-menu > li > a', function () {
      if ($(this).text().trim() === 'غرفة الانتظار') emit('SEND_ADMIN_WAITROOM');
    });
    $(document).on('click', P + ' .wr-save', function () {
      emit('SEND_ADMIN_WAITROOM_SAVE', {
        data: {
          enabled: $(P + ' .wr-enabled').is(':checked'),
          leaveLikes: Number($(P + ' .wr-leave').val()) || 0,
          noLikes: $(P + ' .wr-nolikes').is(':checked'),
          noAlert: $(P + ' .wr-noalert').is(':checked'),
          noPM: $(P + ' .wr-nopm').is(':checked'),
          foreign: $(P + ' .wr-foreign').is(':checked'),
          featureLikes: Number($(P + ' .wr-feat').val()) || 0,
          autoMove: $(P + ' .wr-auto').is(':checked')
        }
      });
    });
    $(document).on('click', P + ' .wr-rel', function () {
      emit('SEND_ADMIN_WAITROOM_RELEASE', { id: String($(this).attr('data-id')) });
    });
  }
  bind();
})();
