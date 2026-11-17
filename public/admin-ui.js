/* admin-ui.js  v1
   Loaded AFTER admin.js. Adds UI behaviour only; admin.js logic and socket events are untouched
   except CloseAllFun, which is replaced by an equivalent that skips tables that were never initialised. */
(function () {
  'use strict';

  var P = document.querySelector('.paneladmin');
  if (!P) return;

  var KEY = 'cpSidebarCollapsed';
  var MOBILE = window.matchMedia('(max-width: 768px)');
  var busyTimer = null;

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var burger  = P.querySelector('.cp-burger');
  var overlay = P.querySelector('.cp-overlay');
  var title   = P.querySelector('#cpTitle');
  var welcome = P.querySelector('.cp-welcome');
  var menu    = P.querySelector('ul.side-menu');
  var host    = P.querySelector('.cp-brand small');

  if (host) host.textContent = location.hostname;

  /* ---- sidebar: collapse (desktop) / drawer (mobile) ---- */
  function setCollapsed(on) {
    P.classList.toggle('cp-collapsed', !!on);
    lsSet(KEY, on ? '1' : '0');
    if (burger) burger.setAttribute('aria-expanded', on ? 'false' : 'true');
  }
  function setDrawer(on) {
    P.classList.toggle('cp-drawer-open', !!on);
    if (burger) burger.setAttribute('aria-expanded', on ? 'true' : 'false');
  }

  if (lsGet(KEY) === '1' && !MOBILE.matches) P.classList.add('cp-collapsed');

  if (burger) burger.addEventListener('click', function () {
    if (MOBILE.matches) setDrawer(!P.classList.contains('cp-drawer-open'));
    else setCollapsed(!P.classList.contains('cp-collapsed'));
  });
  if (overlay) overlay.addEventListener('click', function () { setDrawer(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setDrawer(false); });
  var onMq = function () { setDrawer(false); };
  if (MOBILE.addEventListener) MOBILE.addEventListener('change', onMq); else if (MOBILE.addListener) MOBILE.addListener(onMq);

  /* tooltips for the icon-only (collapsed) state */
  if (menu) {
    var items = menu.querySelectorAll('li');
    for (var i = 0; i < items.length; i++) {
      var a = items[i].querySelector('a');
      if (a) items[i].title = a.textContent.trim();
    }
  }

  /* ---- loading bar ---- */
  function busy(on) {
    clearTimeout(busyTimer);
    P.classList.toggle('cp-busy', !!on);
    if (on) busyTimer = setTimeout(function () { P.classList.remove('cp-busy'); }, 7000); /* safety net */
  }

  /* ---- tab click (runs after admin.js's own handler on the <a>) ---- */
  if (menu) menu.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a') : null;
    if (!a || !menu.contains(a)) return;
    var all = menu.querySelectorAll('li.cp-active');
    for (var j = 0; j < all.length; j++) all[j].classList.remove('cp-active');
    if (a.parentNode) a.parentNode.classList.add('cp-active');
    if (title) title.textContent = a.textContent.trim();
    if (welcome) welcome.style.display = 'none';
    busy(true);
    if (MOBILE.matches) setDrawer(false);
  });

  /* hide the bar once any panel data has been rendered (admin.js renders first, then this runs) */
  var tries = 0;
  var poll = setInterval(function () {
    if (window.socket && typeof window.socket.on === 'function') {
      clearInterval(poll);
      window.socket.on('SHWO_PANEL_ADMIN', function () { busy(false); });
    } else if (++tries > 150) {
      clearInterval(poll);
    }
  }, 200);

  /* ---- back to chat ---- */
  window.cpBackToChat = function () {
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.focus();
        window.close();
        setTimeout(function () { location.href = '/'; }, 250); /* only runs if close() was refused */
        return;
      }
    } catch (e) {}
    location.href = '/';
  };

  /* ---- lighter tab switch ----
     Original CloseAllFun ran `$(table).dataTable().fnDestroy()` on 12 tables every click. On a table that
     was never initialised, `.dataTable()` first BUILDS a full DataTable and then destroys it.
     Same behaviour here, but only tables that really are DataTables get destroyed. */
  var TABLES = ['logsPage', 'statePage', 'reportpage', 'usersPage', 'gustsPage', 'botsPage',
                'bansPage', 'messagePage', 'shortPage', 'subsPage', 'filterPage', 'roomsPage'];
  var PANELS = '.Panelstate,.Panellogs,.UsersLogs,.BotsLogs,.BansLogs,.MessageLogs,.ShortLogs,.OtherLogs,' +
               '.SiteLogs,.SubsLogs,.FilterLogs,.RoomsLogs,.PowersLogs,.GustsLogs,.SettingsLogs,.reportstate,.EmojiLogs,.WaitLogs';

  window.CloseAllFun = function () {
    var $ = window.jQuery || window.$;
    $('#fltred').html('');
    $(PANELS).hide();
    for (var k = 0; k < TABLES.length; k++) {
      var el = document.getElementById(TABLES[k]);
      if (el && $.fn.DataTable.isDataTable(el)) $(el).dataTable().fnDestroy();
    }
    window.limitpage = 0x32;
  };
})();
