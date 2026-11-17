var socket = null;
var clickop = null;
var limitpage = 0x32;
var atar = [];
var sico = [];
var dro3 = [];
var back = [];
var pws = [];
var C_L_R = [];
var MY_T = null;
var jstp = [];
function allload() {
  var trans = "WebSocket" in window || "MozWebSocket" in window ? ["websocket"] : ["polling", "websocket"];
  socket = io('', {
	reconnection: true,
    transports: trans,
    closeOnBeforeunload: false,
  });
  MY_T = location.href.replace("https://" + location.host, '').replace("/cp?", '');
  socket.on("connect", function () {
	  setTimeout(()=>{
		  socket.emit("token", MY_T);
	  },1000);
  });
  socket.on("seoo", function (data) {
    if (data.cmd == "dro3") {
      dro3 = data.data;
    } else {
      if (data.cmd == "atar") {
        atar = data.data;
      } else {
        if (data.cmd == "room") {
          C_L_R = data.data;
        } else {
          if (data.cmd == "power") {
            jstp = data.data;
            PowerRef(data.data);
          } else {
            if (data.cmd == "not") {
              seotnbeh = "<div onclick=\"$(this).remove();\" style=\"min-width: 180px; max-width: 260px; border: 1px solid black; z-index: 2110; background-color: #efefef; position: absolute; top: 30%; margin-left: 30px; padding: 5px;z-index: 5001\" class=\"hand \">\n  <center>\n  <div id=\"isfil\" class=\" border label label-primary\" style=\"margin-top: -10px; padding-top: 10px; padding-left: 15px; width: 50%; padding-right: 15px;\">تنبيه</div>\n  </center>\n  <div style=\"width:100%;display:block;padding:0px 5px;\" class=\"break fl\">" + data.data.msg + "</div></div>";
              $("body").append(seotnbeh);
            } else {
              if (data.cmd == "sico") {
                sico = data.data;
              } else {
                if (data.cmd == "back") {
                  back = data.data;
                } else {}
              }
            }
          }
        }
      }
    }
  });
  socket.on("disconnect", function (_0x29e1c5) {
    window.close();
  });
  socket.on("SHWO_PANEL_ADMIN", function (_0x5afbe5) {
    switch (_0x5afbe5.cmd) {
      case "SEND_ADMIN_HOSTCHAT":
        $(".usernmb").text(_0x5afbe5.data + " : الاعضاء");
        $(".OtherLogs").show();
        socket.emit("SHWO_PANEL_ADMIN", { "cmd": "SEND_ADMIN_NOPTA", "url": location.hostname, "limit": 1 }); /* [ADDED] Nopta */
        socket.emit("SHWO_PANEL_ADMIN", { "cmd": "SEND_ADMIN_UIRETA", "url": location.hostname, "limit": 1 }); /* [ADDED] Uireta */
        socket.emit("SHWO_PANEL_ADMIN", { "cmd": "SEND_ADMIN_UIRETA_BDG", "limit": 1, "op": "list" }); /* [UIRETA-BADGES] */
        socket.emit("SHWO_PANEL_ADMIN", { "cmd": "SEND_ADMIN_UIRETA_TICKER", "limit": 1, "op": "get", "host": location.hostname }); /* [UIRETA-BADGES] */
        break;
      case "SEND_ADMIN_NOPTA": /* [ADDED] حالة إصدار Nopta.1.0 */
        clearTimeout((window._dsgTimer || {}).nopta); (window._dsgBusy = window._dsgBusy || {}).nopta = false; /* [FIX] السيرفر رد */
        setNoptaUI(!!(_0x5afbe5.data && _0x5afbe5.data.on), _0x5afbe5.data && _0x5afbe5.data.domains);
        if (_0x5afbe5.data && _0x5afbe5.data.all) renderDesignDomains("nopta", _0x5afbe5.data.all, _0x5afbe5.data.domains);
        if (_0x5afbe5.data && _0x5afbe5.data.error) {
          $("#noptaState").text(_0x5afbe5.data.denied ? "⚠️ ليس لديك صلاحية تغيير الإصدار" : "⚠️ السيرفر ما قدرش يكتب/يمسح ملف الحالة في مجلد uploads — راجع صلاحيات المجلد");
          break;
        }
        var _qn = (window._dsgQuiet = window._dsgQuiet || {}).nopta; window._dsgQuiet.nopta = false;
        if (_0x5afbe5.data && _0x5afbe5.data.changed && !_qn) alert(window._noptaOn ? "تم التشغيل على الدومينات المختارة — حدّث صفحة الشات (Ctrl+Shift+R) لتشوف الشكل الجديد" : "تم الإيقاف والرجوع للشكل الافتراضي — حدّث صفحة الشات (Ctrl+Shift+R)")
        break;
      case "SEND_ADMIN_UIRETA": /* [ADDED] حالة إصدار Uireta.1.0 */
        clearTimeout((window._dsgTimer || {}).uireta); (window._dsgBusy = window._dsgBusy || {}).uireta = false;
        setUiretaUI(!!(_0x5afbe5.data && _0x5afbe5.data.on), _0x5afbe5.data && _0x5afbe5.data.domains);
        if (_0x5afbe5.data && _0x5afbe5.data.all) renderDesignDomains("uireta", _0x5afbe5.data.all, _0x5afbe5.data.domains);
        if (_0x5afbe5.data && _0x5afbe5.data.error) {
          $("#uiretaState").text(_0x5afbe5.data.denied ? "⚠️ ليس لديك صلاحية تغيير الإصدار" : "⚠️ السيرفر ما قدرش يكتب/يمسح ملف الحالة في مجلد uploads — راجع صلاحيات المجلد");
          break;
        }
        var _qu = (window._dsgQuiet = window._dsgQuiet || {}).uireta; window._dsgQuiet.uireta = false;
        if (_0x5afbe5.data && _0x5afbe5.data.changed && !_qu) alert(window._uiretaOn ? "تم تشغيل Uireta.1.0 على الدومينات المختارة — حدّث صفحة الدخول (Ctrl+Shift+R) لتشوف الواجهة الجديدة" : "تم الإيقاف والرجوع لواجهة اللوجين السابقة — حدّث صفحة الدخول (Ctrl+Shift+R)")
        break;
      case "SEND_ADMIN_UIRETA_BDG": { /* [UIRETA-BADGES] قايمة الشارات + نتيجة الإضافة/التمديد/الإلغاء */
        var _bd = _0x5afbe5.data || {};
        renderUqBadges(_bd.list || []);
        if (_bd.found) { renderUqSug(_bd.found); break; }
        if (_bd.msg) uqSay($("#uqPaneVip").is(":visible") ? "#uqVipState" : "#uqBdgState", _bd.msg, !_bd.error);
        if (window._uqLast === "add" && !_bd.error) { $("#uqBdgQ").val(""); }
        window._uqLast = "";
        break;
      }
      case "SEND_ADMIN_UIRETA_TICKER": { /* [UIRETA-BADGES] نص الشريط المتحرك لكل دومين */
        var _tk = _0x5afbe5.data || {};
        var _sel = $("#uqTkHost");
        if (_tk.hosts && _tk.hosts.length) {
          var _h = "";
          $.each(_tk.hosts, function (_i, d) { _h += '<option value="' + _escDomain(d) + '">' + _escDomain(d) + '</option>'; });
          _sel.html(_h);
        }
        if (_tk.host) _sel.val(_tk.host);
        if (!_tk.denied) $("#uqTkText").val(_tk.text || "");
        if (_tk.msg) uqSay("#uqTkState", _tk.msg, !_tk.error);
        break;
      }
      case "SEND_ADMIN_LOGINSTYLE": /* [ADDED] حالة صفحة اللوجين الجديدة */
        window._loginStyleOn = !!(_0x5afbe5.data && _0x5afbe5.data.on);
        $("#loginStyleState").text(window._loginStyleOn ? "الحالة: الشكل الجديد مُفعّل ✅ (اضغط للإلغاء والرجوع للافتراضي)" : "الحالة: الشكل الافتراضي (اضغط لتفعيل الشكل الجديد)")
          .removeClass("label-default label-success").addClass(window._loginStyleOn ? "label-success" : "label-default");
        if (_0x5afbe5.data && _0x5afbe5.data.changed) alert(window._loginStyleOn ? "تم تفعيل صفحة اللوجين الجديدة — حدّث الصفحة لتشوفها" : "تم الرجوع لصفحة اللوجين الافتراضية — حدّث الصفحة لتشوفها");
        break;
      case "SEND_ADMIN_BARSTYLE": /* [ADDED] حالة الشريط العلوي والسفلي الجديد */
        window._barsStyleOn = !!(_0x5afbe5.data && _0x5afbe5.data.on);
        $("#barsStyleState").text(window._barsStyleOn ? "الحالة: الشريط + الإعدادات + الحائط + قايمة المتواجدين الجديدة مُفعّلة ✅ (اضغط للرجوع للافتراضي)" : "الحالة: الشكل الافتراضي (اضغط لتفعيل الشريط والإعدادات والحائط وقايمة المتواجدين الجديدة)")
          .removeClass("label-default label-success").addClass(window._barsStyleOn ? "label-success" : "label-default");
        if (_0x5afbe5.data && _0x5afbe5.data.changed) alert(window._barsStyleOn ? "تم تفعيل الشريط العلوي والسفلي ولوحة الإعدادات الجديدة — حدّث الصفحة لتشوفها" : "تم الرجوع للشكل الافتراضي (الشريط والإعدادات) — حدّث الصفحة");
        break;
      case "SEND_ADMIN_SITE":
        /* [DOMAINS] عرض الدومينات كشرائح + الدومين المختار */
        renderDomains(_0x5afbe5.data.test, _0x5afbe5.data.urls, _0x5afbe5.data.base || []);
        $(".SiteLogs").show();
        $("#sett_name").val(_0x5afbe5.data.istite);
        $("#sett_title").val(_0x5afbe5.data.title);
        $("#sett_description").val(_0x5afbe5.data.description);
        $("#sett_keywords").val(_0x5afbe5.data.keywords);
        $("#sett_scr").val(_0x5afbe5.data.script);
        var _0x436438 = new jscolor.color($(".sbgt")[0x0], {});
        _0x436438.fromString(_0x5afbe5.data.colors.bgcolor);
        var _0x2f55a3 = new jscolor.color($(".sbackground")[0x0], {});
        _0x2f55a3.fromString(_0x5afbe5.data.colors.hicolor);
        var _0x13dbe7 = new jscolor.color($(".sbuttons")[0x0], {});
        _0x13dbe7.fromString(_0x5afbe5.data.colors.btcolor);
        break;
      case "SEND_ADMIN_SITE_REFRESH":
        /* [DOMAINS] بعد إضافة/حذف دومين: نعيد تحميل بيانات الدومين المطلوب */
        socket.emit("SHWO_PANEL_ADMIN", {
          "cmd": "SEND_ADMIN_SITE",
          "limit": limitpage,
          "url": _0x5afbe5.data.url
        });
        break;
      case "SEND_ADMIN_EMOJI":
        $(".EmojiLogs").show();
        $(".p-emo").children().remove();
        $.each(_0x5afbe5.data, function (_0x32173d, _0x301a5b) {
          var _0x428e89 = $("<div style=\"display:inline-block;padding:2px;margin:2px;margin-top:2px;\" class=\"border\"><img style=\"max-width:24px;max-height:24px;\"><input type=\"number\" name=" + _0x301a5b.path + " onchange=\"emoChange(this)\" style=\"width:50px;margin:2px\" value=" + _0x301a5b.type + ">ف" + "<a style=\"margin-left: 4px;padding:4px;\" onclick=\"del_ico(this);\" class=\"btn btn-danger fa fa-times\">.</a>" + "</div>");
          _0x428e89.find("img").attr("src", "/emo/" + _0x301a5b.path);
          _0x428e89.find("a").attr("pid", "/emo/" + _0x301a5b.path);
          $(".p-emo").append(_0x428e89);
        });
        break;
      case "SEND_ADMIN_REMOVE_ICO":
        $(btncl).parent().remove();
        btncl = '';
        break;
      case "SEND_ADMIN_POWER_EDIT":
        socket.emit("SHWO_PANEL_ADMIN", {
          "cmd": "SEND_ADMIN_POWERS",
          "limit": 0x1
        });
        setTimeout(() => {
          $(".powerbox").val(_0x5afbe5.data);
          powerchange();
        }, 0x1f4);
        break;
      case "SEND_ADMIN_SETTINGS":
        $(".p-sico").children().remove();
        $(".p-dro3").children().remove();
        $(".p-atar").children().remove();
        $(".p-back").children().remove();
        $.each(sico, function (_0x3f4a5b, _0x3a47bd) {
          var _0x55d710 = $("<div style=\"display:inline-block;padding:2px;margin:2px;margin-top:2px;\" class=\"border\"><img style=\"max-width:24px;max-height:24px;\"><a style=\"margin-left: 4px;padding:4px;\" onclick=\"del_ico(this);\" class=\"btn btn-danger fa fa-times\">.</a></div>");
          _0x55d710.find("img").attr("src", "/sico/" + _0x3a47bd.path);
          _0x55d710.find("a").attr("pid", "/sico/" + _0x3a47bd.path);
          $(".p-sico").append(_0x55d710);
        });
        $.each(atar, function (_0xd0a1b5, _0x2d49d7) {
          var _0x42ca5c = $("<div style=\"display:inline-block;padding:2px;margin:2px;margin-top:2px;\" class=\"border\"><img style=\"max-width:24px;max-height:24px;\"><a style=\"margin-left: 4px;padding:4px;\" onclick=\"del_ico(this);\" class=\"btn btn-danger fa fa-times\">.</a></div>");
          _0x42ca5c.find("img").attr("src", "/atar/" + _0x2d49d7.path);
          _0x42ca5c.find("a").attr("pid", "/atar/" + _0x2d49d7.path);
          $(".p-atar").append(_0x42ca5c);
        });
        $.each(back, function (_0x5081e3, _0x380818) {
          var _0x3a1f1e = $("<div style=\"display:inline-block;padding:2px;margin:2px;margin-top:2px;\" class=\"border\"><img style=\"max-width:24px;max-height:24px;\"><a style=\"margin-left: 4px;padding:4px;\" onclick=\"del_ico(this);\" class=\"btn btn-danger fa fa-times\">.</a></div>");
          _0x3a1f1e.find("img").attr("src", "/back/" + _0x380818.path);
          _0x3a1f1e.find("a").attr("pid", "/back/" + _0x380818.path);
          $(".p-back").append(_0x3a1f1e);
        });
        $.each(dro3, function (_0x480680, _0x4393d7) {
          var _0x1eb9c4 = $("<div style=\"display:inline-block;padding:2px;margin:2px;margin-top:2px;\" class=\"border\"><img style=\"max-width:24px;max-height:24px;\"><a style=\"margin-left: 4px;padding:4px;\" onclick=\"del_ico(this);\" class=\"btn btn-danger fa fa-times\">.</a></div>");
          _0x1eb9c4.find("img").attr("src", "/dro3/" + _0x4393d7.path);
          _0x1eb9c4.find("a").attr("pid", "/dro3/" + _0x4393d7.path);
          $(".p-dro3").append(_0x1eb9c4);
        });
        $(".SettingsLogs").show();
        window.__settingsLoaded = _0x5afbe5.data;
        $(".bars").prop("checked", !!_0x5afbe5.data.bars);
        $(".gust").prop("checked", !!_0x5afbe5.data.gust);
        $(".isbanner").prop("checked", !!_0x5afbe5.data.isbanner);
        $(".reconnect").prop("checked", !!_0x5afbe5.data.reconnect);
        $(".offline").prop("checked", !!_0x5afbe5.data.offline);
        $(".register").prop("checked", !!_0x5afbe5.data.register);
        $(".replay").prop("checked", !!_0x5afbe5.data.replay);
        $(".replaybc").prop("checked", !!_0x5afbe5.data.replaybc);
        $(".likebc").prop("checked", !!_0x5afbe5.data.likebc);
        $(".vpn").prop("checked", !!_0x5afbe5.data.vpn);
        $(".callmic").prop("checked", !!_0x5afbe5.data.callmic);
        $(".callsot").prop("checked", !!_0x5afbe5.data.callsot);
        $(".showtop").prop("checked", !!_0x5afbe5.data.showtop);
        $(".showsto").prop("checked", !!_0x5afbe5.data.showsto);
        $(".showyot").prop("checked", !!_0x5afbe5.data.showyot);
        $(".lengthbc").val(_0x5afbe5.data.lengthbc);
        $(".lengthpm").val(_0x5afbe5.data.lengthpm);
        $(".lengthroom").val(_0x5afbe5.data.lengthroom);
        $(".maxdaymsg").val(_0x5afbe5.data.maxdaymsg);
        $(".oflineuser").val(_0x5afbe5.data.oflineuser);
        $(".maxlikealert").val(_0x5afbe5.data.maxlikealert);
        $(".maxlikebc").val(_0x5afbe5.data.maxlikebc);
        $(".maxlikecam").val(_0x5afbe5.data.maxlikecam);
        $(".maxlikemic").val(_0x5afbe5.data.maxlikemic);
        $(".maxlikestory").val(_0x5afbe5.data.maxlikestory);
        $(".maxlikename").val(_0x5afbe5.data.maxlikename);
        $(".maxlikepic").val(_0x5afbe5.data.maxlikepic);
        $(".maxlikeyot").val(_0x5afbe5.data.maxlikeyot);
        $(".maxlikecover").val(_0x5afbe5.data.maxlikecover);
        $(".maxlikepm").val(_0x5afbe5.data.maxlikepm);
        $(".maxlikeroom").val(_0x5afbe5.data.maxlikeroom);
        $(".maxlikeroommedia").val(_0x5afbe5.data.maxlikeroommedia || 0);
        $(".maxlikesendpicpm").val(_0x5afbe5.data.maxlikesendpicpm);
        $(".maxlogin").val(_0x5afbe5.data.maxlogin);
        $(".maxuploadfile").val(_0x5afbe5.data.maxuploadfile);
        $(".maxrep").val(_0x5afbe5.data.maxrep);
        $(".gustmin").val(_0x5afbe5.data.gustmin);
        $(".registermin").val(_0x5afbe5.data.registermin);
        $(".bctime").val(_0x5afbe5.data.bctime);
        $(".chatfinish").text(new Date(_0x5afbe5.data.datafinish).toDateString().replaceAll("/", "-"));
        $(".p-banner").attr("src", "/site/" + _0x5afbe5.data.banner);
        break;
      case "SEND_ADMIN_REMOVE_BOTS":
        $("#gustsPage").DataTable().rows().nodes().each(function (_0x58addc, _0x51b4da) {
          if ($(_0x58addc).children().eq(0x9).text() == _0x5afbe5.data) {
            $("#gustsPage").DataTable().rows(_0x58addc).remove();
          }
        });
        $("#gustsPage").DataTable().rows().invalidate();
        $("#gustsPage").DataTable().draw();
        break;
      case "SEND_ADMIN_ADD_BOTS":
        $("#gustsPage").DataTable().row.add(_0x5afbe5.data);
        $("#gustsPage").DataTable().rows().invalidate();
        $("#gustsPage").DataTable().draw();
        $("#nameb,#msgbot").val('');
        break;
      case "SEND_ADMIN_EDIT_BOTS":
        (function () {
          var _dt = $("#gustsPage").DataTable();
          var _nd = _0x5afbe5.data;
          _dt.rows().every(function () {
            if (this.data().id == _nd.id) {
              this.data(_nd);
            }
          });
          _dt.rows().invalidate();
          _dt.draw(false);
          cancelEditBot();
        })();
        break;
      case "SEND_ADMIN_POWER_ADD":
        $(".powerbox").each(function (_0x3a4dd4, _0x56f1d1) {
          var _0x417ff3 = $("<option></option>");
          _0x417ff3.attr("value", _0x5afbe5.data.name);
          _0x417ff3.attr("class", _0x5afbe5.data.name.replace(/\s/g, ''));
          _0x417ff3.text("[" + (JSON.parse(_0x5afbe5.data.powers).rank || 0x0) + "] " + _0x5afbe5.data.name);
          $(_0x56f1d1).append(_0x417ff3);
        });
        powersarr.push(_0x5afbe5.data);
        $(".powerbox").val(_0x5afbe5.data.name);
        powerchange();
        break;
      case "SEND_ADMIN_POWER_DEL":
        $(".powerbox option:selected").remove();
        const _0x4102fa = powersarr.findIndex(_0x4967d5 => _0x4967d5.name == _0x5afbe5.data);
        if (_0x4102fa != -0x1) {
          powersarr.splice(_0x4102fa, 0x1);
        }
        break;
      case "SEND_ADMIN_POWERS":
        $(".PowersLogs").show();
        $(".sico").children().remove();
        $.each(sico, function (_0x2ac671, _0x5664db) {
          var _0x2e1e03 = $("<div style=\"display:inline-block;margin:8px\" onclick=\"GetPowerSico(this,'" + _0x5664db.path + "')\"></div>");
          _0x2e1e03.prepend($("<img style=\"padding:4px;width:auto;height:30px\" src=\"/sico/" + _0x5664db.path + "\">"));
          $(".sico").append(_0x2e1e03).append();
        });
        $(".powerbox").children().remove();
        powersarr = _0x5afbe5.data;
        powersarr.sort(function (_0x51f912, _0x54362e) {
          return (JSON.parse(_0x54362e.powers).rank || 0x0) - (JSON.parse(_0x51f912.powers).rank || 0x0);
        });
        for (var _0x555aa0 = 0x0; _0x555aa0 < powersarr.length; _0x555aa0++) {
          defr = JSON.parse(powersarr[_0x555aa0].powers);
          $(".powerbox").each(function (_0x27cb12, _0x134fd8) {
            if (defr.name != "Hide" && defr.name != "chatmaster") {
              var _0x2683fc = $("<option></option>");
              _0x2683fc.attr("value", defr.name);
              _0x2683fc.attr("class", defr.name.replace(/\s/g, ''));
              _0x2683fc.text("[" + (defr.rank || 0x0) + "] " + defr.name);
              $(_0x134fd8).append(_0x2683fc);
            }
          });
        }
        powerchange();
        break;
      case "SEND_ADMIN_ROOM_CHECK":
        $(".chekcromt").each(function () {
          $(this).removeAttr("disabled");
          $(this).removeClass("btn-primary");
          $(this).addClass("btn-info");
        });
        $(".chekcrom" + _0x5afbe5.data).attr("disabled", "disabled");
        $(".chekcrom" + _0x5afbe5.data).removeClass("btn-info");
        $(".chekcrom" + _0x5afbe5.data).addClass("btn-primary");
        break;
      case "SEND_ADMIN_ROOM_DEL":
        $("#roomsPage").DataTable().rows().nodes().each(function (_0x58e8e2, _0x3fdfd9) {
          if ($(_0x58e8e2).children().eq(0x5).text() == _0x5afbe5.data) {
            $("#roomsPage").DataTable().rows(_0x58e8e2).remove();
          }
        });
        $("#roomsPage").DataTable().rows().invalidate();
        $("#roomsPage").DataTable().draw();
        break;
      case "SEND_ADMIN_ROOM_PASS":
        $(".passDelete" + _0x5afbe5.data).attr("disabled", "disabled");
        break;
      case "SEND_ADMIN_ROOMS":
        $(".RoomsLogs").show();
        var _0x5ce66b = new Date().getTime();
        _0x13f261 = $("#roomsPage").DataTable({
          "data": _0x5afbe5.data,
          "columns": [{
            "data": "pic",
            "render": function (_0x4497d3, _0x59d77c, _0x45dada) {
              return "<img style='width: 50px;height: 50px;border-radius: 30px;border: 1px solid darkgray' src=" + _0x4497d3 + ">";
            }
          }, {
            "data": "topic"
          }, {
            "data": "user"
          }, {
            "data": {
              "needpass": "needpass",
              "id": "id"
            },
            "render": function (_0x5db4e1, _0x99d2e6, _0x174caf) {
              return "<a " + (_0x5db4e1.needpass ? '' : "disabled") + " class=\"passDelete" + _0x5db4e1.id + " fr btn btn-danger fa fa-times\" onclick=\"roomdelpass('" + _0x5db4e1.id + "')\">حذف</a>";
            }
          }, {
            "data": "id",
            "render": function (_0x380a66, _0x573396, _0xaa0b72) {
              return "<a " + (_0x5afbe5.room != _0x380a66 ? '' : "disabled") + " class=\"fr btn btn-" + (_0x5afbe5.room != _0x380a66 ? "info" : "primary") + " chekcromt chekcrom" + _0x380a66 + " fa fa-check\" onclick=\"roomsver('" + _0x380a66 + "')\"><span style=\"display:none\">" + _0x380a66 + "</span></a>";
            }
          }, {
            "data": "id",
            "render": function (_0x1a83ac, _0x447c20, _0x43056a) {
              return "<a class=\"fr btn btn-danger fa fa-times\" onclick=\"delRoom('" + _0x1a83ac + "')\"><span style=\"display:none\">" + _0x1a83ac + "</span></a>";
            }
          }],
          "paging": false,
          "order": [[0x5, "desc"]],
          "info": false,
          "colReorder": true
        });
        break;
      case "SEND_ADMIN_ADD_FILTER":
        $("#filterPage").DataTable().row.add(_0x5afbe5.data);
        $("#filterPage").DataTable().rows().invalidate();
        $("#filterPage").DataTable().draw();
        $(".fltrit").val('');
        break;
      case "SEND_ADMIN_DELETE_FILTER":
        $("#filterPage").DataTable().rows().nodes().each(function (_0x2724f2, _0x2fc167) {
          if ($(_0x2724f2).children().eq(0x2).text() == _0x5afbe5.data) {
            $("#filterPage").DataTable().rows(_0x2724f2).remove();
          }
        });
        $("#filterPage").DataTable().rows().invalidate();
        $("#filterPage").DataTable().draw();
        break;
      case "SEND_ADMIN_FILTER":
        $(".FilterLogs").show();
        if (_0x5afbe5.type.length > 0x0) {
          $("#fltred").html('');
          for (var _0x555aa0 = _0x5afbe5.type.length - 0x1; _0x555aa0 != -0x1; _0x555aa0--) {
            $("#fltred").append("<label class=\"fl label label-primary\">الكلمه</label>" + _0x5afbe5.type[_0x555aa0].v + "<br><div class=\"fl border\" style=\"width:100%;\">" + _0x5afbe5.type[_0x555aa0].msg + "<br>user: " + _0x5afbe5.type[_0x555aa0].topic.split("&").join("&amp;") + "<br>IP: " + _0x5afbe5.type[_0x555aa0].ip + "</div><br>");
          }
        }
        _0x13f261 = $("#filterPage").DataTable({
          "data": _0x5afbe5.data,
          "columns": [{
            "data": "type"
          }, {
            "data": "v"
          }, {
            "data": {
              "id": "id",
              "v": "v"
            },
            "render": function (_0x104ad9, _0x4dec51, _0x191b07) {
              return deleteFilter({
                "id": _0x104ad9.id,
                "v": _0x104ad9.v
              });
            }
          }],
          "paging": false,
          "order": [[0x2, "desc"]],
          "info": false,
          "colReorder": true
        });
        break;
      case "SEND_ADMIN_DELETE_SUB":
        $("#subsPage").DataTable().rows().nodes().each(function (_0x50f2b, _0x1624b1) {
          if ($(_0x50f2b).children().eq(0x6).text() == _0x5afbe5.data) {
            $("#subsPage").DataTable().rows(_0x50f2b).remove();
          }
        });
        $("#subsPage").DataTable().rows().invalidate();
        $("#subsPage").DataTable().draw();
        break;
      case "SEND_ADMIN_SUBS":
        $(".SubsLogs").show();
        var _0x5ce66b = new Date().getTime().toFixed();
        _0x13f261 = $("#subsPage").DataTable({
          "data": _0x5afbe5.data,
          "columns": [{
            "data": "sub"
          }, {
            "data": "username"
          }, {
            "data": "topic"
          }, {
            "data": "timeis",
            "render": function (_0x16134d, _0x35c123, _0x5cbe55) {
              return _0x16134d != 0x0 ? _0x16134d : "مؤبد";
            }
          }, {
            "data": "id",
            "render": function (_0x15c4f6, _0x5509e5, _0x4602d6) {
              return deleteSub(_0x15c4f6);
            }
          }],
          "paging": false,
          "order": [[0x0, "desc"]],
          "info": false,
          "colReorder": true
        });
        break;
      case "SEND_ADMIN_ADD_SHORT":
        $("#shortPage").DataTable().row.add(_0x5afbe5.data);
        $("#shortPage").DataTable().rows().invalidate();
        $("#shortPage").DataTable().draw();
        $(".shrtname").val('');
        $(".shrtvalue").val('');
        break;
      case "SEND_ADMIN_DELETE_SHORT":
        $("#shortPage").DataTable().rows().nodes().each(function (_0xb9973f, _0x535ae4) {
          if ($(_0xb9973f).children().eq(0x2).text() == _0x5afbe5.data) {
            $("#shortPage").DataTable().rows(_0xb9973f).remove();
          }
        });
        $("#shortPage").DataTable().rows().invalidate();
        $("#shortPage").DataTable().draw();
        break;
      case "SEND_ADMIN_SHORT":
        $(".ShortLogs").show();
        _0x13f261 = $("#shortPage").DataTable({
          "data": _0x5afbe5.data,
          "columns": [{
            "data": "msg"
          }, {
            "data": "reponse"
          }, {
            "data": "id",
            "render": function (_0x5b4d81, _0x5127a5, _0x229eee) {
              return delShort(_0x5b4d81);
            }
          }],
          "paging": false,
          "order": [[0x2, "desc"]],
          "info": false,
          "colReorder": true
        });
        break;
      case "SEND_ADMIN_DELETE_MESSAGE":
        $("#messagePage").DataTable().rows().nodes().each(function (_0x380f59, _0x3d3dd1) {
          if ($(_0x380f59).children().eq(0x3).text() == _0x5afbe5.data) {
            $("#messagePage").DataTable().rows(_0x380f59).remove();
          }
        });
        $("#messagePage").DataTable().rows().invalidate();
        $("#messagePage").DataTable().draw();
        break;
      case "SEND_ADMIN_ADD_MESSAGE":
        $("#messagePage").DataTable().row.add(_0x5afbe5.data);
        $("#messagePage").DataTable().rows().invalidate();
        $("#messagePage").DataTable().draw();
        break;
      case "SEND_ADMIN_MESSAGES":
        $(".MessageLogs").show();
        _0x13f261 = $("#messagePage").DataTable({
          "data": _0x5afbe5.data,
          "columns": [{
            "data": "category",
            "render": function (_0x383ad9, _0x5908d5, _0x47a9a0) {
              return _0x383ad9 == "w" ? "ترحيب" : "يومية";
            }
          }, {
            "data": "adresse"
          }, {
            "data": "msg"
          }, {
            "data": "id",
            "render": function (_0x41306a, _0x46ff43, _0x16332b) {
              return delMessage(_0x41306a);
            }
          }],
          "paging": false,
          "order": [[0x3, "desc"]],
          "info": false,
          "colReorder": true
        });
        break;
      case "SEND_ADMIN_BANS":
        $(".BansLogs").show();
        var _0x5ce66b = new Date().getTime();
        _0x13f261 = $("#bansPage").DataTable({
          "data": _0x5afbe5.data,
          "columns": [{
            "data": "name_band"
          }, {
            "data": "type"
          }, {
            "data": "reponse"
          }, {
            "data": "device"
          }, {
            "data": "ip"
          }, {
            "data": "username"
          }, {
            "data": "country",
            "render": function (_0x503a5b, _0x193731, _0x5e8ea2) {
              return isflag(_0x503a5b);
            }
          }, {
            "data": "date",
            "render": function (_0x55c2bb, _0x5b4046, _0x335e52) {
              return _0x55c2bb ? new Date(_0x5ce66b - new Date(_0x55c2bb).getTime()).getTime().time() : "مؤبد";
            }
          }, {
            "data": "created",
            "render": function (_0xc27c37, _0x5a1648, _0x50680d) {
              return new Date(_0x5ce66b - new Date(_0xc27c37).getTime()).getTime().time();
            }
          }, {
            "data": "id",
            "render": function (_0x48a1ad, _0x8c8854, _0x73cd96) {
              return removeBand(_0x48a1ad);
            }
          }],
          "paging": false,
          "order": [[0x8, "desc"]],
          "info": false,
          "colReorder": true
        });
        break;
      case "SEND_ADMIN_BANS_SYSTEM":
        var _0x40640a = {};
        var _0x3a151d = {};
        $("#system7").click(function () {
          if ($(this).is(":checked")) {
            $("#system input.fa").prop("checked", false);
          }
        });
        $("#system input.fa").click(function () {
          var _0xccc2af = false;
          $("#system input.fa").each(function (_0x1364fc, _0x19f382) {
            if ($(_0x19f382).is(":checked")) {
              _0xccc2af = true;
            }
          });
          $("#system7").prop("checked", !_0xccc2af);
        });
        function _0x14b08e() {
          $("#system input").each(function (_0x23c213, _0x270e62) {
            var _0x542fa8 = $(this).attr("id");
            _0x3a151d[_0x542fa8] = $(this).is(":checked");
          });
          return _0x3a151d;
        }
        $("#btnSystem").click(function () {
          socket.emit("SHWO_PANEL_ADMIN", {
            "cmd": "SEND_ADMIN_SYSTEM_BAND",
            "system": _0x14b08e(),
            "limit": 0x1
          });
        });
        const _0x28cff6 = JSON.parse(_0x5afbe5.data[0x0].browsers);
        const _0x1c293d = JSON.parse(_0x5afbe5.data[0x0].systems);
        for (_0x555aa0 in _0x28cff6) $("#" + _0x555aa0).prop("checked", !!_0x28cff6[_0x555aa0]);
        for (_0x555aa0 in _0x1c293d) $("#" + _0x555aa0).prop("checked", !!_0x1c293d[_0x555aa0]);
        $("#browser9").click(function () {
          if ($(this).is(":checked")) {
            $("#browser input.fa").prop("checked", false);
          }
        });
        $("#browser input.fa").click(function () {
          var _0xf93e12 = false;
          $("#browser input.fa").each(function (_0x5b030b, _0x5ad88c) {
            if ($(_0x5ad88c).is(":checked")) {
              _0xf93e12 = true;
            }
          });
          $("#browser9").prop("checked", !_0xf93e12);
        });
        function _0x369ccd() {
          $("#browser input").each(function (_0x1f1a57, _0x476329) {
            var _0x4dc2f8 = $(this).attr("id");
            _0x40640a[_0x4dc2f8] = $(this).is(":checked");
          });
          return _0x40640a;
        }
        $("#btnbrowser").click(function () {
          socket.emit("SHWO_PANEL_ADMIN", {
            "cmd": "SEND_ADMIN_BROWSER_BAND",
            "browser": _0x369ccd(),
            "limit": 0x1
          });
        });
        break;
      case "SEND_ADMIN_INFO_ACCOUNT":
        edituser = _0x5afbe5.data;
        $("#edituser").modal("show");
        $(".tltp").text(_0x5afbe5.data.user);
        var _0x4afb21 = $("#edituser");
        pws = pws.sort(function (_0x288970, _0x3e0787) {
          return _0x3e0787.rank - _0x288970.rank;
        });
        var _0x3b400a = _0x4afb21.find(".userpowera");
        _0x3b400a.empty();
        _0x3b400a.append("<option></option>");
        for (var _0x555aa0 = 0x0; _0x555aa0 < pws.length; _0x555aa0++) {
          var _0x57764c = $("<option></option>");
          if (pws[_0x555aa0].rank > jstp.rank && pws[_0x555aa0] != "Hide" && pws[_0x555aa0] != "chatmaster") {
            _0x57764c = $("<option style='display:none'></option>");
          }
          _0x57764c.attr("value", pws[_0x555aa0].name);
          if (pws[_0x555aa0].name == _0x5afbe5.data.power) {
            _0x57764c.css("color", "blue");
            _0x57764c.attr("selected", "true");
          }
          _0x57764c.text("[" + pws[_0x555aa0].rank + "] " + pws[_0x555aa0].name);
          _0x3b400a.append(_0x57764c);
        }
        _0x4afb21.find(".userdaysa").val(0x0);
        _0x4afb21.find(".upowera").off().click(function () {
          var _0x3e77ed = parseInt(_0x4afb21.find(".userdays").val()) || 0x0;
          socket.emit("SHWO_PANEL_ADMIN", {
            "cmd": "SEND_ADMIN_ADD_POWER",
            "id": _0x5afbe5.data.idreg,
            "power": _0x3b400a.val(),
            "days": _0x3e77ed,
            "limit": 0x1
          });
        });
        if (_0x5afbe5.data.verification) {
          $(".verification").prop("checked", true);
          $("div.s01").css("color", "green");
        } else {
          $(".verification").prop("checked", false);
        }
        if (_0x5afbe5.data.ifedit) {
          $(".ifedit").prop("checked", true);
          $("div.s03").css("color", "green");
        } else {
          $(".ifedit").prop("checked", false);
        }
        if (_0x5afbe5.data.loginG) {
          $(".loginG").prop("checked", true);
          $("div.s02").css("color", "green");
        } else {
          $(".loginG").prop("checked", false);
        }
        break;
      case "SEND_ADMIN_BANS_ADD":
        $("#bansPage").DataTable().row.add(_0x5afbe5.data);
        $("#bansPage").DataTable().rows().invalidate();
        $("#bansPage").DataTable().draw();
        $(".baninput").val('');
        break;
      case "SEND_ADMIN_DELETE_BAND":
        $("#bansPage").DataTable().rows().nodes().each(function (_0x6784a5, _0xca1c6a) {
          if ($(_0x6784a5).children().eq(0x9).text() == _0x5afbe5.data) {
            $("#bansPage").DataTable().rows(_0x6784a5).remove();
          }
        });
        $("#bansPage").DataTable().rows().invalidate();
        $("#bansPage").DataTable().draw();
        break;
      case "SEND_ADMIN_DELETE_ACCOUNT":
        $("#usersPage").DataTable().rows().nodes().each(function (_0x47247c, _0x336da6) {
          if ($(_0x47247c).children().eq(0x0).text() == _0x5afbe5.data) {
            $("#usersPage").DataTable().rows(_0x47247c).remove();
          }
        });
        $("#usersPage").DataTable().rows().invalidate();
        $("#usersPage").DataTable().draw();
        $("#edituser").modal("hide");
        break;
      case "SEND_ADMIN_GUST_length":
        $("#maxbots").text("  غير متاح الرصيد");
        break;
      case "SEND_ADMIN_GUST":
        $("#countrybot").empty();
        $("#rankbot").empty();
        $("#rommbot").empty();
        $.each(uf, function (_0x59f63b, _0x513a46) {
          $("#countrybot").append($("<option></option>").attr("value", _0x59f63b).text(_0x513a46));
        });
        $("#rankbot").append($("<option></option>").attr("value", '').text(''));
        $.each(pws, function (_0x169ffe, _0x304f0d) {
          $("#rankbot").append($("<option></option>").attr("value", _0x304f0d.name).text(_0x304f0d.name));
        });
        $("#rommbot").append($("<option></option>").attr("value", '').text(''));
        $.each(C_L_R, function (_0x54e255, _0x16b721) {
          $("#rommbot").append($("<option></option>").attr("value", _0x16b721.id).text(_0x16b721.topic));
        });
        $(".GustsLogs").show();
        _0x13f261 = $("#gustsPage").DataTable({
          "data": _0x5afbe5.data,
          "columns": [{
            "data": "pic",
            "render": function (_0x23c920, _0x2ea8ff, _0x52f4a4) {
              return "<img style='width:50px' src=" + _0x23c920 + ">";
            }
          }, {
            "data": "topic"
          }, {
            "data": "power"
          }, {
            "data": "country"
          }, {
            "data": "room",
            "render": function (_0x53546d, _0x39eea7, _0x33b5d2) {
              return getroomuse(_0x53546d);
            }
          }, {
            "data": "ip"
          }, {
            "data": "msg"
          }, {
            "data": {
              "id": "id",
              "room": "room"
            },
            "render": function (_0x954ce5, _0x355481, _0x22ea85) {
              return _0x954ce5.room ? "<a class='btn btn-primary fa fa-comments' onclick='msgbots(\"" + _0x954ce5.id + "," + getroomuse(_0x954ce5.room) + "\");'></a>" : '';
            }
          }, {
            "data": "id",
            "render": function (_0x3957f0, _0x138f6f, _0x49bce1) {
              return "<a class='btn btn-info' style='margin-right:10px;font-size:11px !important' onclick='enterbot(\"" + _0x3957f0 + "\");'>دخول/خروج</a>";
            }
          }, {
            "data": "id",
            "render": function (_0x2ebae4, _0x5a7076, _0x395a58) {
              return "<a class='btn btn-danger fa fa-trash' onclick='kickbot(\"" + _0x2ebae4 + "\");'><span style='display:none'>" + _0x2ebae4 + "</span></a>";
            }
          }, {
            "data": "id",
            "orderable": false,
            "render": function (_0xbid) {
              return "<a class='btn btn-warning fa fa-edit' title='تعديل ملف البوت' onclick='editbot(\"" + _0xbid + "\");'></a>";
            }
          }],
          "paging": false,
          "info": false,
          "colReorder": true
        });
        break;
      case "SEND_ADMIN_STATS":
        $(".Panelstate").show();
        var _0x5ce66b = new Date().getTime();
        _0x13f261 = $("#statePage").DataTable({
          "data": _0x5afbe5.data,
          "columns": [{
            "data": "state"
          }, {
            "data": "topic"
          }, {
            "data": "username"
          }, {
            "data": "room"
          }, {
            "data": "ip"
          }, {
            "data": "time",
            "render": function (_0x15d029, _0x4e31b2, _0x39604b) {
              return new Date(_0x5ce66b - _0x15d029).getTime().time();
            }
          }],
          "paging": false,
          "order": [[0x5, "asc"]],
          "info": false,
          "colReorder": true
        });
        break;
      case "SEND_ADMIN_report":
        $(".reportstate").show();
        var _0x13f261 = $("#reportpage").DataTable({
          "data": _0x5afbe5.data,
          "columns": [{
            "data": "v"
          }, {
            "data": "topic"
          }, {
            "data": "topic2"
          }, {
            "data": "msg"
          }],
          "paging": false,
          "info": false,
          "order": [[0x2, "asc"]],
          "colReorder": true
        });
        break;
      case "SEND_ADMIN_USERS":
        $("#usersPage").DataTable().destroy();
        $(".UsersLogs").show();
        var _0x5ce66b = new Date().getTime();
        _0x13f261 = $("#usersPage").DataTable({
          "data": _0x5afbe5.data,
          "columns": [{
            "data": "username"
          }, {
            "data": "topic"
          }, {
            "data": "ip"
          }, {
            "data": "device"
          }, {
            "data": "power"
          }, {
            "data": "lastssen",
            "render": function (_0x341957, _0x13e6f5, _0x14922c) {
              return _0x341957 ? new Date(_0x5ce66b - _0x341957).getTime().time() : "متصل الأن";
            }
          }, {
            "data": "joinuser",
            "render": function (_0x5d62f8, _0x15d823, _0x2d8ec3) {
              return new Date(_0x5ce66b - new Date(_0x5d62f8).getTime()).getTime().time();
            }
          }, {
            "data": "idreg",
            "render": function (_0x4d12eb, _0x3eaf7f, _0x522ca3) {
              return getUserInfo(_0x4d12eb);
            }
          }],
          "paging": false,
          "info": false,
          "colReorder": true,
          "searching": false,
          "order": [[0x6, "asc"]]
        });
        break;
      case "SEND_ADMIN_LOGS":
        $(".Panellogs").show();
        var _0x5ce66b = new Date().getTime();
        var _0x13f261 = $("#logsPage").DataTable({
          "data": _0x5afbe5.data,
          "columns": [{
            "data": "state"
          }, {
            "data": "username"
          }, {
            "data": "topic"
          }, {
            "data": "ip"
          }, {
            "data": "country",
            "render": function (_0x4c5233, _0x2ce04d, _0x3ca5cc) {
              return isflag(_0x4c5233);
            }
          }, {
            "data": "device"
          }, {
            "data": "date",
            "render": function (_0x14d8b8, _0x381b61, _0x11f3b4) {
              return new Date(new Date().getTime() - _0x14d8b8).getTime().time();
            }
          }, {
            "data": "isin"
          }, {
            "data": {
              "isin": "isin",
              "username": "username",
              "ip": "ip"
            },
            "render": function (_0x4677f0, _0x330215, _0x2af28f) {
              return _0x4677f0.isin == "band" ? btncheck({
                "username": _0x4677f0.username,
                "ip": _0x4677f0.ip
              }) : '';
            }
          }],
          "paging": false,
          "info": false,
          "order": [[0x6, "asc"]],
          "colReorder": true
        });
        break;
    }
  });
  $(".side-menu > li > a").on("click", function () {
    CloseAllFun();
    if ($(this).text() == "السجل") {
      socket.emit("SHWO_PANEL_ADMIN", {
        "cmd": "SEND_ADMIN_LOGS",
        "limit": limitpage
      });
    } else {
      if ($(this).text() == "الصلاحيات") {
        socket.emit("SHWO_PANEL_ADMIN", {
          "cmd": "SEND_ADMIN_POWERS",
          "limit": 0x1
        });
      } else {
        if ($(this).text() == "الحالات") {
          socket.emit("SHWO_PANEL_ADMIN", {
            "cmd": "SEND_ADMIN_STATS",
            "limit": limitpage
          });
        } else {
          if ($(this).text() == "الوهمي") {
            socket.emit("SHWO_PANEL_ADMIN", {
              "cmd": "SEND_ADMIN_GUST",
              "limit": limitpage
            });
          } else {
            if ($(this).text() == "الأعضاء") {
              socket.emit("SHWO_PANEL_ADMIN", {
                "cmd": "SEND_ADMIN_USERS",
                "value": null,
                "limit": limitpage
              });
            } else {
              if ($(this).text() == "الإشتراكات") {
                socket.emit("SHWO_PANEL_ADMIN", {
                  "cmd": "SEND_ADMIN_SUBS",
                  "limit": limitpage
                });
              } else {
                if ($(this).text() == "الإضافات") {
                  socket.emit("SHWO_PANEL_ADMIN", {
                    "cmd": "SEND_ADMIN_HOSTCHAT",
                    "limit": limitpage
                  });
                } else {
                  if ($(this).text() == "التبليغات") {
                    socket.emit("SHWO_PANEL_ADMIN", {
                      "cmd": "SEND_ADMIN_report",
                      "limit": limitpage
                    });
                  } else {
                    if ($(this).text() == "الموقع") {
                      socket.emit("SHWO_PANEL_ADMIN", {
                        "cmd": "SEND_ADMIN_SITE",
                        "limit": limitpage,
                        "url": location.hostname
                      });
                    } else {
                      if ($(this).text() == "الإعدادات") {
                        socket.emit("SHWO_PANEL_ADMIN", {
                          "cmd": "SEND_ADMIN_SETTINGS",
                          "limit": limitpage
                        });
                      } else {
                        if ($(this).text() == "الغرف") {
                          socket.emit("SHWO_PANEL_ADMIN", {
                            "cmd": "SEND_ADMIN_ROOMS",
                            "limit": limitpage
                          });
                        } else {
                          if ($(this).text() == "فلتر") {
                            socket.emit("SHWO_PANEL_ADMIN", {
                              "cmd": "SEND_ADMIN_FILTER",
                              "limit": limitpage
                            });
                          } else {
                            if ($(this).text() == "الإختصارات") {
                              socket.emit("SHWO_PANEL_ADMIN", {
                                "cmd": "SEND_ADMIN_SHORT",
                                "limit": limitpage
                              });
                            } else {
                              if ($(this).text() == "الرسائل") {
                                socket.emit("SHWO_PANEL_ADMIN", {
                                  "cmd": "SEND_ADMIN_MESSAGES",
                                  "limit": limitpage
                                });
                              } else {
                                if ($(this).text() == "الرموز") {
                                  socket.emit("SHWO_PANEL_ADMIN", {
                                    "cmd": "SEND_ADMIN_EMOJI",
                                    "limit": limitpage
                                  });
                                } else if ($(this).text() == "الحظر") {
                                  socket.emit("SHWO_PANEL_ADMIN", {
                                    "cmd": "SEND_ADMIN_BANS",
                                    "limit": limitpage
                                  });
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    $(clickop).removeClass("active");
    $(this).addClass("active");
    clickop = this;
  });
  $(".bandnow").click(() => {
    const _0x2ba730 = $(".baninput").val();
    if (_0x2ba730.trim()) {
      socket.emit("SHWO_PANEL_ADMIN", {
        "cmd": "SEND_ADMIN_BANS_ADD",
        "band": _0x2ba730,
        "limit": limitpage
      });
    }
  });
  $(".verlog").click(function () {
    socket.emit("SHWO_PANEL_ADMIN", {
      "cmd": "SEND_ADMIN_EDIT_ACCOUNT",
      "user": Number(edituser.idreg),
      "limit": 0x1,
      "loginG": $(".loginG").is(":checked"),
      "verification": $(".verification").is(":checked"),
      "ifedit": $(".ifedit").is(":checked")
    });
    $("#edituser").modal("hide");
  });
  $(".delus").click(function () {
    socket.emit("SHWO_PANEL_ADMIN", {
      "cmd": "SEND_ADMIN_DELETE_ACCOUNT",
      "user": Number(edituser.idreg),
      "limit": 0x1
    });
  });
  $(".usersetpwd").click(function () {
    const _0x7c0e5e = $(".userpwd").val();
    if (_0x7c0e5e.trim()) {
      socket.emit("SHWO_PANEL_ADMIN", {
        "cmd": "SEND_ADMIN_PASS",
        "user": Number(edituser.idreg),
        "limit": 0x1,
        "pass": _0x7c0e5e
      });
      $(".userpwd").val('');
      $("#edituser").modal("hide");
    }
  });
  $("#searchusers").on("change", function () {
    socket.emit("SHWO_PANEL_ADMIN", {
      "cmd": "SEND_ADMIN_USERS",
      "value": this.value,
      "limit": 0x5
    });
  });
}
function CloseAllFun() {
  $("#fltred").html('');
  $(".Panelstate,.Panellogs,.UsersLogs,.BotsLogs,.BansLogs,.MessageLogs,.ShortLogs,.OtherLogs,.SiteLogs,.SubsLogs,.FilterLogs,.RoomsLogs,.PowersLogs,.GustsLogs,.SettingsLogs,.reportstate,.EmojiLogs,.WaitLogs").hide();
  $("#logsPage").dataTable().fnDestroy();
  $("#statePage").dataTable().fnDestroy();
  $("#reportpage").dataTable().fnDestroy();
  $("#usersPage").dataTable().fnDestroy();
  $("#gustsPage").dataTable().fnDestroy();
  $("#botsPage").dataTable().fnDestroy();
  $("#bansPage").dataTable().fnDestroy();
  $("#messagePage").dataTable().fnDestroy();
  $("#shortPage").dataTable().fnDestroy();
  $("#subsPage").dataTable().fnDestroy();
  $("#filterPage").dataTable().fnDestroy();
  $("#roomsPage").dataTable().fnDestroy();
  limitpage = 0x32;
}
function SEND_EVENT_EMIT(_0x49f842, _0x3a643a) {
  socket.emit("SEND_EVENT_EMIT_SERVER", {
    "cmd": _0x49f842,
    "data": _0x3a643a
  });
}
function nextPage(_0x41de03) {
  if (_0x41de03) {
    if (_0x41de03 == "log") {
      $("#logsPage").DataTable().destroy();
      socket.emit("SHWO_PANEL_ADMIN", {
        "cmd": "SEND_ADMIN_LOGS",
        "limit": limitpage += 0x32
      });
    } else {
      if (_0x41de03 == "state") {
        $("#statePage").DataTable().destroy();
        socket.emit("SHWO_PANEL_ADMIN", {
          "cmd": "SEND_ADMIN_STATS",
          "limit": limitpage += 0x32
        });
      } else {
        if (_0x41de03 == "report") {
          $("#reportpage").DataTable().destroy();
          socket.emit("SHWO_PANEL_ADMIN", {
            "cmd": "SEND_ADMIN_report",
            "limit": limitpage += 0x32
          });
        } else {
          if (_0x41de03 == "short") {
            $("#shortPage").DataTable().destroy();
            socket.emit("SHWO_PANEL_ADMIN", {
              "cmd": "SEND_ADMIN_SHORT",
              "limit": limitpage += 0x32
            });
          } else {
            if (_0x41de03 == "subs") {
              $("#subsPage").DataTable().destroy();
              socket.emit("SHWO_PANEL_ADMIN", {
                "cmd": "SEND_ADMIN_SUBS",
                "limit": limitpage += 0x32
              });
            } else {
              if (_0x41de03 == "rooms") {
                $("#roomsPage").DataTable().destroy();
                socket.emit("SHWO_PANEL_ADMIN", {
                  "cmd": "SEND_ADMIN_ROOMS",
                  "limit": limitpage += 0x32
                });
              } else {
                if (_0x41de03 == "filter") {
                  $("#filterPage").DataTable().destroy();
                  socket.emit("SHWO_PANEL_ADMIN", {
                    "cmd": "SEND_ADMIN_FILTER",
                    "limit": limitpage += 0x32
                  });
                } else {
                  if (_0x41de03 == "message") {
                    $("#messagePage").DataTable().destroy();
                    socket.emit("SHWO_PANEL_ADMIN", {
                      "cmd": "SEND_ADMIN_MESSAGES",
                      "limit": limitpage += 0x32
                    });
                  } else {
                    if (_0x41de03 == "users") {
                      $("#usersPage").DataTable().destroy();
                      socket.emit("SHWO_PANEL_ADMIN", {
                        "cmd": "SEND_ADMIN_USERS",
                        "value": null,
                        "limit": limitpage += 0x32
                      });
                    } else {
                      if (_0x41de03 == "gusts") {
                        $("#gustsPage").DataTable().destroy();
                        socket.emit("SHWO_PANEL_ADMIN", {
                          "cmd": "SEND_ADMIN_GUST",
                          "limit": limitpage += 0x32
                        });
                      } else if (_0x41de03 == "bands") {
                        $("#bansPage").DataTable().destroy();
                        socket.emit("SHWO_PANEL_ADMIN", {
                          "cmd": "SEND_ADMIN_BANS",
                          "limit": limitpage += 0x32
                        });
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
function msgsit(_0x83453b, _0x22a8cb, _0x5c879f) {
  socket.emit("SHWO_PANEL_ADMIN", {
    "cmd": "SEND_ADMIN_ADD_MESSAGE",
    "type": _0x83453b,
    "msg": _0x5c879f,
    "t": _0x22a8cb,
    "limit": 0x1
  });
  $("#msgs>input,#msgs>textarea").val('');
}
function checkuser(_0x3eb953) {
  socket.emit("SHWO_PANEL_ADMIN", {
    "cmd": "SEND_ADMIN_CHECK",
    "user": _0x3eb953.split(",")[0x0],
    "ip": _0x3eb953.split(",")[0x1],
    "limit": 0x1
  });
}
function delfltr(_0x4a711c) {
  socket.emit("SHWO_PANEL_ADMIN", {
    "cmd": "SEND_ADMIN_DELETE_FILTER",
    "id": Number(_0x4a711c.split(",")[0x0]),
    "v": _0x4a711c.split(",")[0x1],
    "limit": 0x1
  });
}
function delband(_0x2fee78) {
  socket.emit("SHWO_PANEL_ADMIN", {
    "cmd": "SEND_ADMIN_DELETE_BAND",
    "id": Number(_0x2fee78),
    "limit": 0x1
  });
}
function delsub(_0x31f80c) {
  socket.emit("SHWO_PANEL_ADMIN", {
    "cmd": "SEND_ADMIN_DELETE_SUB",
    "id": Number(_0x31f80c),
    "limit": 0x1
  });
}
function delshot(_0x1ad8ad) {
  socket.emit("SHWO_PANEL_ADMIN", {
    "cmd": "SEND_ADMIN_DELETE_SHORT",
    "id": Number(_0x1ad8ad),
    "limit": 0x1
  });
}
function delmsgm(_0x3e0e83) {
  socket.emit("SHWO_PANEL_ADMIN", {
    "cmd": "SEND_ADMIN_DELETE_MESSAGE",
    "id": Number(_0x3e0e83),
    "limit": 0x1
  });
}
function useredit(_0x5403b9) {
  $(".userpwd").val('');
  socket.emit("SHWO_PANEL_ADMIN", {
    "cmd": "SEND_ADMIN_INFO_ACCOUNT",
    "user": Number(_0x5403b9),
    "limit": 0x1
  });
}
function fltrit(_0x558f23, _0x11a541) {
  if (_0x558f23.trim() && _0x11a541.trim()) {
    socket.emit("SHWO_PANEL_ADMIN", {
      "cmd": "SEND_ADMIN_ADD_FILTER",
      "path": _0x558f23.trim(),
      "v": _0x11a541.trim(),
      "limit": 0x1
    });
  }
}
function shrtadd() {
  const _0x1f91a7 = $(".shrtname").val();
  const _0x3e3772 = $(".shrtvalue").val();
  if (_0x3e3772.trim() && _0x1f91a7.trim()) {
    socket.emit("SHWO_PANEL_ADMIN", {
      "cmd": "SEND_ADMIN_ADD_SHORT",
      "msg": _0x1f91a7,
      "reponse": _0x3e3772,
      "limit": 0x1
    });
  }
}
function roomdelpass(_0xd5be97) {
  var _0x18f2f4 = $(".passDelete" + _0xd5be97);
  if (_0x18f2f4.attr("disabled")) {
    return alert("الغرفة لا تحتوي على كلمة مرور");
  }
  socket.emit("SHWO_PANEL_ADMIN", {
    "cmd": "SEND_ADMIN_ROOM_PASS",
    "id": _0xd5be97,
    "limit": 0x1
  });
}
function roomsver(_0x4841f5) {
  var _0x26dd1b = $(".chekcrom" + _0x4841f5);
  if (_0x26dd1b.attr("disabled")) {
    return alert("الغرفة تم تحديدها بالفعل");
  }
  socket.emit("SHWO_PANEL_ADMIN", {
    "cmd": "SEND_ADMIN_ROOM_CHECK",
    "id": _0x4841f5,
    "limit": 0x1
  });
}
function delRoom(_0x2d3780) {
  socket.emit("SHWO_PANEL_ADMIN", {
    "cmd": "SEND_ADMIN_ROOM_DEL",
    "id": _0x2d3780,
    "limit": 0x1
  });
}

function powers_save(_0x88cf71) {
  socket.emit("SHWO_PANEL_ADMIN", {
    "cmd": "SEND_ADMIN_POWER_ADD",
    "power": JSON.stringify(_0x88cf71),
    "limit": 0x1
  });
}
function powers_delete(_0x5a3c0) {
  socket.emit("SHWO_PANEL_ADMIN", {
    "cmd": "SEND_ADMIN_POWER_DEL",
    "power": _0x5a3c0.name,
    "limit": 0x1
  });
}
var powersarr = [];
function powerchange(_0x3d2aa8) {
  var _0x8ea596 = $(".powerbox option:selected").val();
  var _0x47cbf0 = null;
  for (var _0x45e80f = 0x0; _0x45e80f < powersarr.length; _0x45e80f++) {
    pws = JSON.parse(powersarr[_0x45e80f].powers);
    if (pws.name == _0x8ea596) {
      _0x47cbf0 = pws;
      break;
    }
  }
  if (_0x47cbf0 != null) {
    var _0xe1ca49 = [["rank", "الترتيب"], ["name", "إسم المجموعه"], ["ico", "الإيقونه"], ["kick", "الطرد"], ["delbc", "حذف الحائط"], ["alert", "التنبيهات"], ["mynick", "تغير النك"], ["unick", "تغير النكات"], ["ban", "الباند"], ["publicmsg", "الإعلانات"], ["forcepm", "فتح الخاص"], ["loveu", "نقل من الغرفة"], ["roomowner", "إداره الغرف"], ["createroom", "انشاء الغرف"], ["rooms", "اقصى حد للغرف الثابته"], ["edituser", "إداره العضويات"], ["meiut", "إسكات العضو"], ["ulike", "تعديل لايكات العضو"], ["flter", "الفلتر"], ["subs", "الاشتراكات"], ["shrt", "الاختصارات"], ["msgs", "رسائل الدردشة"], ["bootedit", "فلتر المراقبة"], ["setpower", "تعديل الصلاحيات"], ["upgrades", "الهدايا"], ["history", "كشف النكات"], ["cp", "لوحه التحكم"], ["grupes", "الغرف الممتلئة و المغلقة"], ["delpic", "حذف صورة العضو"], ["delmsg", "حذف الرسائل العامة"], ["stealth", "مخفي"], ["ureport", "إعطاء بنر"], ["report", "التبليغات "], ["waitroom", "غرفة الانتظار"], ["owner", "إداره الموقع"]];
    var _0x5e9a04 = $("<div class='json' style='width:260px;'></div>");
    _0x5e9a04.append(jsonhtml(_0x47cbf0, _0xe1ca49, powers_save));
    $("#powers .json").remove();
    $("#powers").append(_0x5e9a04);
    $("#powers .delp").off().click(function () {
      powers_delete(_0x47cbf0);
    });
  }
}
function SaveSettings() {
  const _0x589fb2 = {
    "lengthbc": Number($(".lengthbc").val()),
    "lengthpm": Number($(".lengthpm").val()),
    "lengthroom": Number($(".lengthroom").val()),
    "maxdaymsg": Number($(".maxdaymsg").val()),
    "oflineuser": Number($(".oflineuser").val()),
    "maxlikealert": Number($(".maxlikealert").val()),
    "maxlikebc": Number($(".maxlikebc").val()),
    "maxlikecam": Number($(".maxlikecam").val()),
    "maxlikemic": Number($(".maxlikemic").val()),
    "maxlikestory": Number($(".maxlikestory").val()),
    "maxlikename": Number($(".maxlikename").val()),
    "maxlikepic": Number($(".maxlikepic").val()),
    "maxlikeyot": Number($(".maxlikeyot").val()),
    "maxlikecover": $(".maxlikecover").length ? Number($(".maxlikecover").val()) : Number((window.__settingsLoaded || {}).maxlikecover),
    "maxek": Number($(".maxek").val()) || Number((window.__settingsLoaded || {}).maxek) || 0x3,
    "maxlikepm": Number($(".maxlikepm").val()),
    "maxlikeroom": Number($(".maxlikeroom").val()),
    "maxlikeroommedia": Number($(".maxlikeroommedia").val()) || 0,
    "maxlikesendpicpm": Number($(".maxlikesendpicpm").val()),
    "maxlogin": Number($(".maxlogin").val()),
    "maxuploadfile": Number($(".maxuploadfile").val()),
    "maxrep": Number($(".maxrep").val()),
    "gustmin": Number($(".gustmin").val()),
    "registermin": Number($(".registermin").val()),
    "bctime": Number($(".bctime").val()),
    "callmic": $(".callmic").is(":checked"),
    "callsot": $(".callsot").is(":checked"),
    "showtop": $(".showtop").is(":checked"),
    "showsto": $(".showsto").is(":checked"),
    "showyot": $(".showyot").is(":checked"),
    "bars": $(".bars").is(":checked"),
    "gust": $(".gust").is(":checked"),
    "isbanner": $(".isbanner").length ? $(".isbanner").is(":checked") : !!(window.__settingsLoaded || {}).isbanner,
    "reconnect": $(".reconnect").length ? $(".reconnect").is(":checked") : !!(window.__settingsLoaded || {}).reconnect,
    "register": $(".register").is(":checked"),
    "offline": $(".offline").is(":checked"),
    "replay": $(".replay").is(":checked"),
    "replaybc": $(".replaybc").is(":checked"),
    "likebc": $(".likebc").is(":checked"),
    "vpn": $(".vpn").is(":checked")
  };
  socket.emit("SHWO_PANEL_ADMIN", {
    "cmd": "SEND_ADMIN_EDIT_SETTINGS",
    "data": _0x589fb2,
    "limit": 0x1
  });
}
function jsonhtml(_0xfbbc44, _0x124530, _0x348407) {
  _0xfbbc44 = {
    "rank": Number(_0xfbbc44.rank),
    "name": String(_0xfbbc44.name),
    "ico": String(_0xfbbc44.ico),
    "kick": Boolean(_0xfbbc44.kick),
    "publicmsg": Boolean(_0xfbbc44.publicmsg),
    "rooms": Boolean(_0xfbbc44.rooms),
    "upgrades": Boolean(_0xfbbc44.upgrades),
    "delbc": Boolean(_0xfbbc44.delbc),
    "alert": Boolean(_0xfbbc44.alert),
    "mynick": Boolean(_0xfbbc44.mynick),
    "unick": Boolean(_0xfbbc44.unick),
    "ban": Boolean(_0xfbbc44.ban),
    "forcepm": Boolean(_0xfbbc44.forcepm),
    "roomowner": Boolean(_0xfbbc44.roomowner),
    "createroom": Boolean(_0xfbbc44.createroom),
    "edituser": Boolean(_0xfbbc44.edituser),
    "setpower": Boolean(_0xfbbc44.setpower),
    "history": Boolean(_0xfbbc44.history),
    "cp": Boolean(_0xfbbc44.cp),
    "stealth": Boolean(_0xfbbc44.stealth),
    "groups": Boolean(_0xfbbc44.groups),
    "ureport": Boolean(_0xfbbc44.ureport),
    "report": Boolean(_0xfbbc44.report),
    "waitroom": Boolean(_0xfbbc44.waitroom),
    "owner": Boolean(_0xfbbc44.owner),
    "msgs": Boolean(_0xfbbc44.msgs),
    "bootedit": Boolean(_0xfbbc44.bootedit),
    "shrt": Boolean(_0xfbbc44.shrt),
    "subs": Boolean(_0xfbbc44.subs),
    "flter": Boolean(_0xfbbc44.flter),
    "ulike": Boolean(_0xfbbc44.ulike),
    "grupes": Boolean(_0xfbbc44.grupes),
    "delmsg": Boolean(_0xfbbc44.delmsg),
    "delpic": Boolean(_0xfbbc44.delpic),
    "meiut": Boolean(_0xfbbc44.meiut),
    "loveu": Boolean(_0xfbbc44.loveu)
  };
  var _0x227a72 = $("<div style=\"width:100%;height:100%;padding:5px;\" class=\"break\"></div>");
  var _0x1d7583 = Object.keys(_0xfbbc44);
  $.each(_0x1d7583, function (_0x1b99a5, _0x465b76) {
    var _0x25f456 = null;
    if (_0x124530 != null) {
      $.each(_0x124530, function (_0x13040d, _0x2e565b) {
        if (_0x2e565b[0x0] == _0x465b76) {
          _0x25f456 = _0x2e565b[0x1];
        } else {
          _0x1d7583.splice(_0x1d7583.indexOf(_0x2e565b[0x0]), 0x1);
        }
        _0x1d7583.splice(_0x13040d, 0x0, _0x2e565b[0x0]);
      });
    }
    if (_0x25f456 == null) {
      return;
    }
    switch (typeof _0xfbbc44[_0x465b76]) {
      case "string":
        _0x227a72.append("<label class=\"label label-primary\">" + _0x25f456 + "</label>");
        _0x227a72.append("<input type=\"text\" name=\"" + _0x465b76 + "\" class=\"corner\" value=\"" + _0xfbbc44[_0x465b76] + "\"></br>");
        break;
      case "boolean":
        _0x227a72.append("<label class=\"label label-primary\">" + _0x25f456 + "</label>");
        var _0x1fa5af = '';
        if (_0xfbbc44[_0x465b76]) {
          _0x1fa5af = "checked";
        }
        _0x227a72.append("<label>تفعيل<input name=\"" + _0x465b76 + "\" type=\"checkbox\" class=\"corner\" " + _0x1fa5af + "></label></br>");
        break;
      case "number":
        _0x227a72.append("<label class=\"label label-primary\">" + _0x25f456 + "</label>");
        _0x227a72.append("<input name=\"" + _0x465b76 + "\" type=\"number\" style=\"width:60px;\" class=\"corner\" value=\"" + _0xfbbc44[_0x465b76] + "\"></br>");
        break;
    }
  });
  _0x227a72.append("<button class=\"btn btn-primary fr fa fa-edit\">حفظ</button>");
  _0x227a72.find("button").click(function () {
    _0x348407(htmljson(_0x227a72));
  });
  return _0x227a72;
}
function enterbot(_0x3a8fa1) {
  if (_0x3a8fa1) {
    socket.emit("SHWO_PANEL_ADMIN", {
      "cmd": "SEND_ADMIN_ENTER_BOTS",
      "id": _0x3a8fa1,
      "limit": 0x1
    });
  }
}
function kickbot(_0x1c5fb6) {
  if (_0x1c5fb6) {
    socket.emit("SHWO_PANEL_ADMIN", {
      "cmd": "SEND_ADMIN_REMOVE_BOTS",
      "id": _0x1c5fb6,
      "limit": 0x1
    });
  }
}
function msgbots(_0x5a4389) {
  if (_0x5a4389) {
    const _0x15ab8c = prompt("الرجاء كتابة رسالتك للغرفة (" + _0x5a4389.split(",")[0x1] + ")");
    if (_0x15ab8c != null) {
      socket.emit("SHWO_PANEL_ADMIN", {
        "cmd": "SEND_ADMIN_MSG_BOTS",
        "id": _0x5a4389.split(",")[0x0],
        "msg": _0x15ab8c,
        "limit": 0x1
      });
    }
  }
}
function emoChange(_0x254db3) {
  var _0x1d26ac = $(_0x254db3).attr("name");
  var _0x57f5c0 = $(_0x254db3).val();
  socket.emit("SHWO_PANEL_ADMIN", {
    "cmd": "SEND_ADMIN_EMO_UP",
    "path": _0x1d26ac,
    "type": Number(_0x57f5c0),
    "limit": 0x1
  });
}
var btncl = '';
/* [ADDED] أزرار تبويب الإضافات: تأكيد قبل العمليات اللي مفيهاش تراجع (حذف / استعادة / إعادة تشغيل) */
function oxAct(key, msg) {
  if (msg && !confirm(msg)) return;
  StatsChat(key);
}

/* ===== [UIRETA-BADGES] إعدادات Uireta: شارات الأعضاء + مشتركين VIP + الشريط المتحرك في اللوجين ===== */
function uqTab(w) {
  $("#uqPaneSet").toggle(w === "set");
  $("#uqPaneVip").toggle(w === "vip");
  $("#uqTabSet").toggleClass("on", w === "set");
  $("#uqTabVip").toggleClass("on", w === "vip");
}
function uqTitleChange() {
  $("#uqBdgCustom").toggle($("#uqBdgTitle").val() === "__custom");
}
function uqSay(sel, txt, ok) {
  $(sel).removeClass("label-success label-danger label-default").addClass(ok === true ? "label-success" : ok === false ? "label-danger" : "label-default").text(txt || "");
}
function uqBdgAdd() {
  var q = $.trim($("#uqBdgQ").val());
  var t = $("#uqBdgTitle").val();
  if (t === "__custom") t = $.trim($("#uqBdgCustom").val());
  var days = parseInt($("#uqBdgDays").val(), 10);
  if (!q) return uqSay("#uqBdgState", "اكتب اسم المستخدم أو الاسم أو رقم العضوية", false);
  if (!t) return uqSay("#uqBdgState", "اكتب أو اختار المسمى", false);
  if (!(days >= 1 && days <= 3650)) return uqSay("#uqBdgState", "عدد الأيام لازم يكون من 1 لـ 3650", false);
  if (!socket || !socket.connected) return uqSay("#uqBdgState", "مفيش اتصال بالسيرفر — اعمل Ctrl+Shift+R", false);
  uqSay("#uqBdgState", "جاري الإعطاء...", null);
  window._uqLast = "add";
  socket.emit("SHWO_PANEL_ADMIN", { "cmd": "SEND_ADMIN_UIRETA_BDG", "limit": 1, "op": "add", "q": q, "title": t, "days": days });
}
/* بحث حي عن العضو (اقتراحات) */
var _uqFindT = null;
function uqFind() {
  clearTimeout(_uqFindT);
  var q = $.trim($("#uqBdgQ").val());
  if (!q) { $("#uqBdgSug").hide().empty(); return; }
  _uqFindT = setTimeout(function () {
    if (!socket || !socket.connected) return;
    socket.emit("SHWO_PANEL_ADMIN", { "cmd": "SEND_ADMIN_UIRETA_BDG", "limit": 1, "op": "find", "q": q });
  }, 250);
}
function renderUqSug(found) {
  var box = $("#uqBdgSug");
  if (!found.length) { box.html('<div class="uq-nores">مفيش عضو بالاسم ده</div>').show(); return; }
  var h = "";
  $.each(found, function (_i, m) {
    var pic = String(m.pic || "");
    pic = /^[\w\/\.\-\?=&%:]+$/.test(pic) && pic ? pic : "imgs/ajax-loader.gif";
    h += '<div class="uq-sg" data-u="' + _escDomain(m.username || ("#" + m.idreg)) + '" data-n="' + _escDomain(m.topic || m.username || "") + '" data-k="#' + parseInt(m.idreg, 10) + '">' +
      '<img src="' + _escDomain(pic) + '" alt=""><div class="uq-sgm"><b>' + _escDomain(m.topic || m.username || "—") + '</b><small>@' + _escDomain(m.username || "—") + ' · #' + parseInt(m.idreg, 10) + '</small></div></div>';
  });
  box.html(h).show();
}
$(document).on("input", "#uqBdgQ", uqFind);
$(document).on("keydown", "#uqBdgQ,#uqBdgCustom,#uqBdgDays", function (e) { if (e.which === 13) { e.preventDefault(); $("#uqBdgSug").hide(); uqBdgAdd(); } });
$(document).on("click", "#uqBdgSug .uq-sg", function () {
  $("#uqBdgQ").val($(this).attr("data-u"));
  $("#uqBdgSug").hide().empty();
  uqSay("#uqBdgState", "تم اختيار: " + $(this).attr("data-n") + " (" + $(this).attr("data-k") + ")", true);
});
$(document).on("click", function (e) { if (!$(e.target).closest(".uq-find").length) $("#uqBdgSug").hide(); });

function uqBdgDel(key) {
  if (!confirm("إلغاء الشارة؟ المسمى هيختفي من قايمة المتصلين فورًا.")) return;
  socket.emit("SHWO_PANEL_ADMIN", { "cmd": "SEND_ADMIN_UIRETA_BDG", "limit": 1, "op": "del", "key": key });
}
function uqBdgExt(key) {
  var d = parseInt(prompt("تمدد كام يوم؟", "30"), 10);
  if (!(d >= 1 && d <= 3650)) return;
  socket.emit("SHWO_PANEL_ADMIN", { "cmd": "SEND_ADMIN_UIRETA_BDG", "limit": 1, "op": "ext", "key": key, "days": d });
}
function renderUqBadges(list) {
  $("#uqVipCount").text(list.length);
  if (!list.length) { $("#uqVipList").html('<div class="uq-empty">لسه محدش اتدّاله شارة</div>'); return; }
  var h = "";
  $.each(list, function (_i, b) {
    var key = String(b.key || "").replace(/[^#0-9]/g, "");
    var until = new Date(b.until).toISOString().slice(0, 10);
    h += '<div class="uq-row">' +
      '<div class="uq-meta"><b>' + _escDomain(b.topic || b.username || key) + '</b><small>@' + _escDomain(b.username || "—") + ' · ' + _escDomain(key) + '</small></div>' +
      '<span class="uq-chip k-' + _escDomain(b.kind || "custom") + '">' + _escDomain(b.title) + '</span>' +
      '<div class="uq-days' + (b.daysLeft <= 3 ? ' low' : '') + '">باقي ' + b.daysLeft + ' يوم<small>ينتهي ' + until + '</small></div>' +
      '<div class="uq-act"><button type="button" onclick="uqBdgExt(\'' + key + '\')"><i class="fa fa-plus"></i> تمديد</button>' +
      '<button type="button" class="d" onclick="uqBdgDel(\'' + key + '\')"><i class="fa fa-times"></i> إلغاء</button></div></div>';
  });
  $("#uqVipList").html(h);
}
function uqTkLoad() {
  socket.emit("SHWO_PANEL_ADMIN", { "cmd": "SEND_ADMIN_UIRETA_TICKER", "limit": 1, "op": "get", "host": $("#uqTkHost").val() || location.hostname });
}
function uqTkSave() {
  uqSay("#uqTkState", "جاري الحفظ...", null);
  socket.emit("SHWO_PANEL_ADMIN", { "cmd": "SEND_ADMIN_UIRETA_TICKER", "limit": 1, "op": "set", "host": $("#uqTkHost").val() || location.hostname, "text": $("#uqTkText").val() });
}
function uqTkReset() {
  socket.emit("SHWO_PANEL_ADMIN", { "cmd": "SEND_ADMIN_UIRETA_TICKER", "limit": 1, "op": "reset", "host": $("#uqTkHost").val() || location.hostname });
}
function StatsChat(_0x18cc3c) {
  socket.emit("SHWO_PANEL_ADMIN", {
    "cmd": "SEND_ADMIN_HOST_EDIT",
    "data": _0x18cc3c,
    "limit": 0x1
  });
}
function del_ico(_0x739d04) {
  btncl = _0x739d04;
  socket.emit("SHWO_PANEL_ADMIN", {
    "cmd": "SEND_ADMIN_REMOVE_ICO",
    "data": $(_0x739d04).attr("pid"),
    "limit": 0x1
  });
}
$(".target").change(function () {
  alert("Handler for .change() called.");
});
/* ===== [DOMAINS] إدارة الدومينات من تبويب الموقع ===== */
var _domainBase = [];
function _escDomain(v) {
  return String(v).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function renderDomains(list, current, base) {
  list = list || [];
  _domainBase = base || [];
  $("#hostname").empty();
  var chips = "";
  $.each(list, function (_i, d) {
    $("#hostname").append($("<option>").val(d).text(d));
    var isBase = _domainBase.indexOf(d) != -1;
    var e = _escDomain(d);
    chips += '<div class="sx-chip' + (d == current ? ' on' : '') + '" data-domain="' + e + '">' +
      '<button type="button" class="sx-chip-name" dir="ltr" onclick="SelectDomain(this)" title="تعديل إعدادات هذا الدومين">' +
      '<i class="fa ' + (d == current ? 'fa-check-circle' : 'fa-circle-o') + '"></i> ' + e + '</button>' +
      (isBase
        ? '<span class="sx-chip-lock" title="دومين أساسي من الإعدادات — لا يمكن حذفه"><i class="fa fa-lock"></i></span>'
        : '<button type="button" class="sx-chip-del" onclick="DelDomain(this)" title="حذف الدومين"><i class="fa fa-times"></i></button>') +
      '</div>';
  });
  $("#hostname").val(current);
  $("#domainList").html(chips || '<span class="sx-empty">لا توجد دومينات</span>');
  $("#domainCount").text(list.length);
  $("#editingDomain").text(current || "—");
  try { renderDomainBanners(list); } catch (e) {}
  try { refreshSiteImages(); } catch (e) {}
  try {
    socket.emit("SHWO_PANEL_ADMIN", { "cmd": "SEND_ADMIN_NOPTA", "url": location.hostname, "limit": 1 });
    socket.emit("SHWO_PANEL_ADMIN", { "cmd": "SEND_ADMIN_UIRETA", "url": location.hostname, "limit": 1 });
  } catch (e) {}
}
/* [ADDED] بنر خاص بكل دومين (تبويب الموقع) */
function renderDomainBanners(list) {
  var h = "";
  $.each(list || [], function (_i, d) {
    var e = _escDomain(d);
    var u = "/site/" + encodeURIComponent(d) + "banner.png?z=" + Date.now();
    h += '<div class="sx-bn" data-domain="' + e + '">' +
      '<div class="sx-bn-name" dir="ltr">' + e + '</div>' +
      '<img class="sx-bn-img" src="' + u + '" alt="" onerror="this.onerror=null;this.src=\'/site/banner.png\'" onclick="changeDomainBanner(this)">' +
      '<div class="sx-bn-act">' +
      '<button type="button" class="btn btn-primary sx-btn" onclick="changeDomainBanner(this)"><i class="fa fa-picture-o"></i> تغيير البنر</button>' +
      '<button type="button" class="btn btn-default sx-btn" onclick="resetDomainBanner(this)"><i class="fa fa-undo"></i> الافتراضي</button>' +
      '</div><small class="sx-bn-state"></small></div>';
  });
  $("#domainBanners").html(h || '<span class="sx-empty">لا توجد دومينات</span>');
}
function _bnState(box, txt, ok) {
  box.find(".sx-bn-state").text(txt).css("color", ok === true ? "#16a34a" : ok === false ? "#dc2626" : "");
}
function changeDomainBanner(el) {
  var box = $(el).closest(".sx-bn");
  var host = box.attr("data-domain");
  if (!host) return;
  var inp = $("<input type='file' accept='image/*' style='display:none;'/>");
  inp.on("change", function () {
    var f = inp.prop("files")[0];
    if (!f) return;
    var fd = new FormData();
    fd.append("photo", f);
    _bnState(box, "جاري الرفع...", null);
    $.ajax({
      url: "/uploadDomainBanner?token=" + MY_T + "&host=" + encodeURIComponent(host),
      type: "POST", data: fd, cache: false, processData: false, contentType: false, timeout: 0,
      success: function (r) {
        var j = {};
        try { j = typeof r === "string" ? JSON.parse(r) : (r || {}); } catch (e) {}
        if (j.err || j.error || !j.msg) { _bnState(box, j.error && j.msg ? j.msg : "فشل رفع الصورة", false); return; }
        box.find(".sx-bn-img").attr("src", j.msg);
        _bnState(box, "تم تغيير البنر ✅", true);
      },
      error: function () { _bnState(box, "فشل رفع الصورة", false); }
    });
  });
  inp.trigger("click");
}
function resetDomainBanner(el) {
  var box = $(el).closest(".sx-bn");
  var host = box.attr("data-domain");
  if (!host) return;
  if (!confirm("الرجوع للبنر الافتراضي للدومين " + host + " ؟")) return;
  $.ajax({
    url: "/resetDomainBanner?token=" + MY_T + "&host=" + encodeURIComponent(host),
    type: "POST",
    success: function (r) {
      var j = {};
      try { j = typeof r === "string" ? JSON.parse(r) : (r || {}); } catch (e) {}
      if (j.error || j.err) { _bnState(box, "فشلت العملية" + (j.msg ? " — " + j.msg : ""), false); return; }
      box.find(".sx-bn-img").attr("src", (j.msg || ("/site/" + host + "banner.png")) + (j.msg && j.msg.indexOf("?") > -1 ? "&" : "?") + "z=" + Date.now());
      _bnState(box, "تم الرجوع للبنر الافتراضي ✅", true);
    },
    error: function () { _bnState(box, "فشلت العملية", false); }
  });
}
function SelectDomain(el) {
  var d = $(el).closest(".sx-chip").attr("data-domain");
  if (!d || d == $("#hostname").val()) return;
  socket.emit("SHWO_PANEL_ADMIN", {
    "cmd": "SEND_ADMIN_SITE",
    "limit": limitpage,
    "url": d
  });
}
function AddDomain() {
  var v = $.trim($("#newDomain").val());
  if (!v) {
    $("#newDomain").focus();
    return;
  }
  socket.emit("SHWO_PANEL_ADMIN", {
    "cmd": "SEND_ADMIN_ADD_DOMAIN",
    "domain": v,
    "limit": 0x1
  });
  $("#newDomain").val('');
}
function DelDomain(el) {
  var d = $(el).closest(".sx-chip").attr("data-domain");
  if (!d) return;
  if (!confirm("حذف الدومين " + d + " ؟\nملفات إعداداته وسجله في قاعدة البيانات لن تُمسح.")) return;
  socket.emit("SHWO_PANEL_ADMIN", {
    "cmd": "SEND_ADMIN_DEL_DOMAIN",
    "domain": d,
    "limit": 0x1
  });
}
$(document).on("keydown", "#newDomain", function (e) {
  if (e.key === "Enter" || e.keyCode === 13) {
    e.preventDefault();
    AddDomain();
  }
});
function SaveTNae() {
  var _0x45add3 = $("#sett_description").val();
  var _0x555c6f = $("#sett_scr").val();
  var _0x43f093 = $("#sett_keywords").val();
  var _0x1bd857 = $("#sett_name").val();
  var _0x29110d = $("#sett_title").val();
  var _0x590e71 = $(".sbgt").val().replace("#", '');
  var _0x417ac0 = $("#hostname").val();
  var _0x158c1c = $(".sbuttons").val().replace("#", '');
  var _0x44ab43 = $(".sbackground").val().replace("#", '');
  var _0x3c06c7 = {
    "url": _0x417ac0,
    "bg": _0x590e71,
    "buttons": _0x158c1c,
    "background": _0x44ab43,
    "name": _0x1bd857,
    "title": _0x29110d,
    "settdescription": _0x45add3,
    "settscr": _0x555c6f,
    "settkeywords": _0x43f093
  };
  socket.emit("SHWO_PANEL_ADMIN", {
    "cmd": "SEND_ADMIN_SAVE_SITE",
    "data": _0x3c06c7,
    "limit": 0x1
  });
}
function addbot() {
  const _0x21241e = $("#nameb").val() || '';
  const _0x2af0d9 = $("#rankbot").val() || '';
  const _0x49c1dd = $("#countrybot").val() || '';
  const _0x12d9df = $("#statsbots").val() || 0x0;
  const _0x571f35 = $("#likebot").val() || 0x0;
  const _0x28c17a = $(".spicbot").attr("src") || "/site/" + location.hostname + "pic.png";
  const _0x22e67c = $("#rommbot").val() || '';
  const _0x3a569b = $(".botmsgc").val() || '';
  const _0x3c0d38 = $(".botnamec").val() || '';
  const _0x479456 = $(".botnamebc").val() || '';
  const _0x5364fa = $("#timestart").val() || 0x2;
  const _0x157cd8 = $("#timestop").val() || 0x2;
  const _0xcc967a = $("#rdel").is(":checked");
  const _0x5b1057 = $("#msgbot").val() || '';
  const __stay = Math.max(0, Math.min(1440, parseInt($("#staybot").val()) || 0));
  if (_0x21241e.trim() && _0x49c1dd) {
    const _0xc24f1a = {
      "nameb": _0x21241e,
      "rankbot": _0x2af0d9,
      "statsbots": Number(_0x12d9df),
      "likebot": Number(_0x571f35),
      "countrybot": _0x49c1dd,
      "urlpic": _0x28c17a,
      "rommbot": _0x22e67c,
      "botmsgc": _0x3a569b,
      "botnamec": _0x3c0d38,
      "timestop": _0x157cd8,
      "timestart": _0x5364fa,
      "autostart": _0xcc967a,
      "botnamebc": _0x479456,
      "msgbot": _0x5b1057,
      "stay": __stay
    };
    if (window.__editingBotId) {
      _0xc24f1a.id = window.__editingBotId;
      socket.emit("SHWO_PANEL_ADMIN", {
        "cmd": "SEND_ADMIN_EDIT_BOTS",
        "data": _0xc24f1a,
        "limit": 0x1
      });
      return;
    }
    socket.emit("SHWO_PANEL_ADMIN", {
      "cmd": "SEND_ADMIN_ADD_BOTS",
      "data": _0xc24f1a,
      "limit": 0x1
    });
  }
}
/* ===== إدخال كل البوتات + تعديل ملف بوت ===== */
function exitAllBots() {
  if (confirm("إخراج كل البوتات من الدردشة؟")) {
    socket.emit("SHWO_PANEL_ADMIN", {
      "cmd": "SEND_ADMIN_EXIT_ALL_BOTS",
      "limit": 0x1
    });
  }
}
function enterAllBots() {
  if (confirm("إدخال كل البوتات للدردشة مرة واحدة؟")) {
    socket.emit("SHWO_PANEL_ADMIN", {
      "cmd": "SEND_ADMIN_ENTER_ALL_BOTS",
      "limit": 0x1
    });
  }
}
function __botSetColor(sel, v) {
  var el = $(sel)[0];
  if (!el) return;
  v = String(v || "000000").replace("#", "");
  if (el.color && el.color.fromString) {
    el.color.fromString(v);
  } else {
    el.value = v;
    el.style.backgroundColor = "#" + v;
  }
}
function editbot(id) {
  var d = null;
  $("#gustsPage").DataTable().rows().every(function () {
    if (this.data().id == id) d = this.data();
  });
  if (!d) return;
  window.__editingBotId = id;
  var nm = String(d.topic || "").replace(/&#x3C;/g, "<");
  $("#nameb").val(nm);
  $("#msgbot").val(d.msg || "");
  $(".spicbot").attr("src", d.pic || "");
  $("#rommbot").val(d.room || "");
  $("#statsbots").val(String(d.stat || 0));
  $("#likebot").val(d.likebot || 0);
  $("#staybot").val(d.stay || 0);
  $("#countrybot").val(d.country || "");
  $("#rankbot").val(d.power || "");
  __botSetColor(".botnamec", d.bg);
  __botSetColor(".botnamebc", d.ucol);
  __botSetColor(".botmsgc", d.mcol);
  $("#botEditName").text(nm);
  $("#botEditBar").show();
  $("#botSaveBtn").text("حفظ التعديل");
  var f = $("#nameb")[0];
  if (f && f.scrollIntoView) f.scrollIntoView({ block: "center" });
}
function cancelEditBot() {
  window.__editingBotId = null;
  $("#nameb,#msgbot,#likebot,#staybot").val("");
  $("#botEditBar").hide();
  $("#botSaveBtn").text("حفظ");
}
function btncheck(_0xb0daa0) {
  if (_0xb0daa0) {
    return "<a onclick=\"checkuser('" + _0xb0daa0.username + "," + _0xb0daa0.ip + "')\"\" class=\"btn btn-success fa fa-check\"></a>";
  }
}
function getUserInfo(_0x31edb9) {
  if (_0x31edb9) {
    return "<a onclick=\"useredit('" + _0x31edb9 + "')\" class=\"btn btn-primary fa fa-gear\"></a>";
  }
}
function removeBand(_0x8d306) {
  if (_0x8d306) {
    return "<a onclick=\"delband('" + _0x8d306 + "')\" class=\"btn btn-danger fa fa-close\"><span style=\"display:none\">" + _0x8d306 + "</span></a>";
  }
}
function delMessage(_0x3e77fc) {
  if (_0x3e77fc) {
    return "<a onclick=\"delmsgm('" + _0x3e77fc + "')\" class=\"btn btn-danger fa fa-close\"><span style=\"display:none\">" + _0x3e77fc + "</span></a>";
  }
}
function deleteFilter(_0x399ff6) {
  if (_0x399ff6) {
    return "<a onclick=\"delfltr('" + _0x399ff6.id + "," + _0x399ff6.v + "')\" class=\"btn btn-danger fa fa-close\"><span style=\"display:none\">" + _0x399ff6.id + "</span></a>";
  }
}
function delShort(_0x2c200e) {
  if (_0x2c200e) {
    return "<a onclick=\"delshot('" + _0x2c200e + "')\" class=\"btn btn-danger fa fa-close\"><span style=\"display:none\">" + _0x2c200e + "</span></a>";
  }
}
function deleteSub(_0x1c968b) {
  if (_0x1c968b) {
    return "<a onclick=\"delsub('" + _0x1c968b + "')\" class=\"btn btn-danger fa fa-close\"><span style=\"display:none\">" + _0x1c968b + "</span></a>";
  }
}
var limitpage = 0x32;
var tbl;
function isflag(_0xce0c8f) {
  if (_0xce0c8f) {
    return "<img src='/flag/" + _0xce0c8f.toLowerCase().replace("il", "ps") + ".png' style='width: 25px;margin: 5px;border: 1px solid darkgray;'> " + _0xce0c8f + " ";
  }
}
function htmljson(_0x553993) {
  _0x553993 = $(_0x553993);
  var _0x1cd5bf = {};
  $.each(_0x553993.find("input"), function (_0xd654e1, _0x12d347) {
    switch ($(_0x12d347).attr("type")) {
      case "text":
        _0x1cd5bf[$(_0x12d347).attr("name")] = $(_0x12d347).val();
        break;
      case "checkbox":
        _0x1cd5bf[$(_0x12d347).attr("name")] = $(_0x12d347).prop("checked");
        break;
      case "number":
        _0x1cd5bf[$(_0x12d347).attr("name")] = parseInt($(_0x12d347).val(), 0xa);
        break;
    }
  });
  return _0x1cd5bf;
}
var evi;
function GetPowerSico(_0x152df4, _0x1f0c2d) {
  if (evi) {
    $(evi).removeClass("activepower");
  }
  evi = _0x152df4;
  $(_0x152df4).addClass("activepower");
  $("input[name='ico']").val(_0x1f0c2d);
}
/* [FIX-SITE-IMG] الدومين المختار في تبويب الموقع (الصور والأيقونات بتتحفظ له، مش لدومين فتح اللوحة) */
function siteHost() {
  return $("#hostname").val() || location.hostname;
}
function refreshSiteImages() {
  var h = encodeURIComponent(siteHost()), z = "?z=" + Date.now();
  $(".p-logo").attr("src", "/site/" + h + "logo.png" + z);
  $(".p-room").attr("src", "/site/" + h + "room.png" + z);
  $(".p-user").attr("src", "/site/" + h + "pic.png" + z);
  $(".p-mic").attr("src", "/site/" + h + "mic.png" + z).off("error").on("error", function () { if (this.src.indexOf("imgs/mic.png") < 0) this.src = "imgs/mic.png"; });
}
function sendfilea(_0x109479, _0x1fd09c) {
  pickedfile = null;
  var _0x205725 = $("<div></div>").first();
  _0x205725.append("<input type='file'  accept='image/*' style='display:none;'/>");
  _0x205725.children("input").trigger("click");
  var _0x1ebcf8;
  $(_0x205725).children("input").on("change", function () {
    var _0x36e342 = $("<div class='mm msg ' style='width:200px;'><a class='fn '></a><button style='color:red;border:1px solid red;min-width:40px;' class=' cancl'>X</button></div>");
    _0x36e342.insertAfter($(_0x109479));
    $(_0x36e342).find(".cancl").click(function () {
      $(_0x36e342).remove();
      _0x1ebcf8.abort();
    });
    var _0x47439d = new FormData();
    _0x47439d.append("photo", $(_0x205725).children("input").prop("files")[0x0]);
    _0x1ebcf8 = $.ajax({
      "xhr": function () {
        var _0x8ddce0 = new window.XMLHttpRequest();
        _0x8ddce0.upload.addEventListener("progress", function (_0x339179) {
          if (_0x339179.lengthComputable) {
            var _0x3614b0 = _0x339179.loaded / _0x339179.total;
            $(_0x36e342.find(".fn")).text("%" + parseInt(_0x3614b0 * 0x64) + " | " + $(_0x205725).children("input").val().split("\\").pop());
          }
        }, false);
        return _0x8ddce0;
      },
      "timeout": 0x0,
      "url": "/uploadURM?token=" + MY_T + "&state=" + _0x1fd09c + (["logo", "room", "user", "mic", "bacmic", "banner"].indexOf(_0x1fd09c) != -1 ? "&host=" + encodeURIComponent(siteHost()) : ""),
      "type": "POST",
      "data": _0x47439d,
      "cache": false,
      "processData": false,
      "contentType": false,
      "success": function (_0x241449) {
        const _0x114c78 = JSON.parse(_0x241449);
        if (_0x114c78.msg.includes("room")) {
          $(".p-room").attr("src", "/site/" + siteHost() + _0x114c78.msg.replace("room/", ''));
        } else {
          if (_0x114c78.msg.includes("pic") && !_0x114c78.msg.includes("msgpic")) {
            $(".p-user").attr("src", "/site/" + siteHost() + _0x114c78.msg.replace("pic/", ''));
          } else {
            if (_0x114c78.msg.includes("cover")) {
              $(".p-cover").attr("src", "/site/" + siteHost() + _0x114c78.msg.replace("cover/", ''));
            } else {
              if (_0x114c78.msg.includes("banner")) {
                $(".p-banner").attr("src", "/site/" + siteHost() + _0x114c78.msg.replace("banner/", ''));
              } else {
                if (_0x114c78.msg.includes("bacmic")) {
                  $(".p-bacmic").attr("src", "/site/" + siteHost() + _0x114c78.msg.replace("bacmic/", ''));
                } else {
                  if (_0x114c78.msg.includes("msgpic")) {
                    $(".p-msgpic").attr("src", "/site/" + _0x114c78.msg.replace("msgpic/", ''));
                  } else {
                    if (_0x114c78.msg.includes("mic")) {
                      $(".p-mic").attr("src", "/site/" + siteHost() + _0x114c78.msg.replace("mic/", '') + "?z=" + Date.now());
                    } else {
                      if (_0x114c78.msg.includes("logo")) {
                        $(".p-logo").attr("src", "/site/" + siteHost() + _0x114c78.msg.replace("logo/", ''));
                      } else {
                        if (_0x114c78.msg.includes("emo")) {
                          var _0x59c397 = $("<div style=\"display:inline-block;padding:2px;margin:2px;margin-top:2px;\" class=\"border\"><img style=\"max-width:24px;max-height:24px;\"><input type=\"number\" name=" + _0x114c78.msg.split("@")[0x0] + " onchange=\"emoChange(this)\" style=\"width:50px;margin:2px\" value=" + _0x114c78.msg.split("@")[0x1] + ">ف" + "<a style=\"margin-left: 4px;padding:4px;\" onclick=\"del_ico(this);\" class=\"btn btn-danger fa fa-times\">.</a>" + "</div>");
                          _0x59c397.find("img").attr("src", "/" + _0x114c78.msg.split("@")[0x0]);
                          _0x59c397.find("a").attr("pid", "/" + _0x114c78.msg.split("@")[0x0]);
                          $(".p-emo").append(_0x59c397);
                        } else {
                          if (_0x114c78.msg.includes("dro3")) {
                            var _0x59c397 = $("<div style=\"display:inline-block;padding:2px;margin:2px;margin-top:2px;\" class=\"border\"><img style=\"max-width:24px;max-height:24px;\"><a style=\"margin-left: 4px;padding:4px;\" onclick=\"del_ico(this);\" class=\"btn btn-danger fa fa-times\">.</a></div>");
                            _0x59c397.find("img").attr("src", "/" + _0x114c78.msg);
                            _0x59c397.find("a").attr("pid", _0x114c78.msg);
                            $(".p-dro3").append(_0x59c397);
                          } else {
                            if (_0x114c78.msg.includes("sico")) {
                              var _0x59c397 = $("<div style=\"display:inline-block;padding:2px;margin:2px;margin-top:2px;\" class=\"border\"><img style=\"max-width:24px;max-height:24px;\"><a style=\"margin-left: 4px;padding:4px;\" onclick=\"del_ico(this);\" class=\"btn btn-danger fa fa-times\">.</a></div>");
                              _0x59c397.find("img").attr("src", "/" + _0x114c78.msg);
                              _0x59c397.find("a").attr("pid", _0x114c78.msg);
                              $(".p-sico").append(_0x59c397);
                            } else {
                              if (_0x114c78.msg.includes("atar")) {
                                var _0x59c397 = $("<div style=\"display:inline-block;padding:2px;margin:2px;margin-top:2px;\" class=\"border\"><img style=\"max-width:24px;max-height:24px;\"><a style=\"margin-left: 4px;padding:4px;\" onclick=\"del_ico(this);\" class=\"btn btn-danger fa fa-times\">.</a></div>");
                                _0x59c397.find("img").attr("src", "/" + _0x114c78.msg);
                                _0x59c397.find("a").attr("pid", _0x114c78.msg);
                                $(".p-atar").append(_0x59c397);
                              } else {
                                if (_0x114c78.msg.includes("back")) {
                                  var _0x59c397 = $("<div style=\"display:inline-block;padding:2px;margin:2px;margin-top:2px;\" class=\"border\"><img style=\"max-width:24px;max-height:24px;\"><a style=\"margin-left: 4px;padding:4px;\" onclick=\"del_ico(this);\" class=\"btn btn-danger fa fa-times\">.</a></div>");
                                  _0x59c397.find("img").attr("src", "/" + _0x114c78.msg);
                                  _0x59c397.find("a").attr("pid", _0x114c78.msg);
                                  $(".p-back").append(_0x59c397);
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        $(_0x36e342).remove();
        $(_0x205725).remove();
      },
      "error": function () {
        $(_0x36e342).remove();
      }
    });
  });
}
function S_PIC(_0x44cb14) {
  var _0x491a5c = $("<input  accept='image/*' type='file' style='display:none;'/>").first();
  _0x491a5c.trigger("click");
  var _0x39fd28;
  $(_0x491a5c).on("change", function () {
    if (_0x44cb14 == "user") {
      $(".spic").attr("src", "imgs/ajax-loader.gif");
    }
    var _0x40c1f3 = new FormData();
    _0x40c1f3.append("photo", $(_0x491a5c).prop("files")[0x0]);
    _0x39fd28 = $.ajax({
      "xhr": function () {
        var _0x21baff = new window.XMLHttpRequest();
        _0x21baff.upload.addEventListener("progress", function (_0x379a41) {
          if (_0x379a41.lengthComputable) {}
        }, false);
        return _0x21baff;
      },
      "timeout": 0x0,
      "url": "uppic?nf=" + _0x44cb14,
      "type": "POST",
      "data": _0x40c1f3,
      "datatype": "json",
      "cache": false,
      "processData": false,
      "contentType": false,
      "success": function (_0x4d2dd0) {
        setTimeout(() => {
          if (_0x4d2dd0.split("@")[0x1] == "user") {
            $(".spic").attr("src", _0x4d2dd0.split("@")[0x0]);
            $(".spic").css("background-image", "url(" + _0x4d2dd0.split("@")[0x0] + ")");
            SEND_EVENT_EMIT("SEND_EVENT_EMIT_PIC", {
              "pic": _0x4d2dd0.split("@")[0x0]
            });
          } else if (_0x4d2dd0.split("@")[0x1] == "bot") {
            $(".spicbot").attr("src", _0x4d2dd0.split("@")[0x0]);
          } else {
            $(".picroom").attr("src", _0x4d2dd0.split("@")[0x0]);
          }
        }, 0x3e8);
      },
      "error": function (_0xdcbeba) {
        $(".spic").attr("src", '');
        alert(_0xdcbeba.responseJSON.message);
      }
    });
  });
}
function getroomuse(_0x443a13) {
  if (_0x443a13) {
    const _0x1fdea2 = C_L_R.findIndex(_0x2a0bbd => _0x2a0bbd.id == _0x443a13);
    if (_0x1fdea2 != -0x1) {
      return C_L_R[_0x1fdea2].topic;
    } else {
      return C_L_R[0x0].topic;
    }
  } else {
    C_L_R[0x0].topic;
  }
}
Number.prototype.time = function () {
  var _0x41436d = this;
  var _0x48950a = 0x0;
  var _0x2f7b = 0x0;
  var _0x388789 = 0x0;
  var _0x12b550 = 0x0;
  var _0x34331f = '';
  _0x48950a = parseInt(_0x41436d / 0x5265c00);
  _0x41436d = _0x41436d - parseInt(0x5265c00 * _0x48950a);
  _0x2f7b = parseInt(_0x41436d / 0x36ee80);
  _0x41436d = _0x41436d - parseInt(0x36ee80 * _0x2f7b);
  _0x388789 = parseInt(_0x41436d / 0xea60);
  _0x41436d = _0x41436d - parseInt(0xea60 * _0x388789);
  _0x12b550 = parseInt(_0x41436d / 0x3e8);
  if (_0x2f7b > 0x9) {
    _0x34331f += _0x2f7b + ":";
  } else {
    _0x34331f += "0" + _0x2f7b + ":";
  }
  if (_0x388789 > 0x9) {
    _0x34331f += _0x388789 + ":";
  } else {
    _0x34331f += "0" + _0x388789 + ":";
  }
  if (_0x12b550 > 0x9) {
    _0x34331f += _0x12b550;
  } else {
    _0x34331f += "0" + _0x12b550;
  }
  return _0x34331f;
};
function RefreshPWS() {
  $.get("GET_ALL_USER_ONLINE?token=" + encodeURIComponent(MY_T || ""), function (_0x6324fe) { /* [FIX-S] token */
    if (typeof _0x6324fe == "string") {
      _0x6324fe = JSON.parse(_0x6324fe);
    }
    var _0x598030 = _0x6324fe;
    pws = _0x598030.powers;
  });
}
function PowerRef(_0x35618a) {
  if (_0x35618a.cp) {
    $(".cp").show();
    $(".logsad").show();
    $(".statead").show();
  } else {
    $(".cp").hide();
    $(".logsad").hide();
    $(".statead").hide();
  }
  if (_0x35618a.groups) {
    $(".addGruMsg").show();
  } else {
    $(".addGruMsg").hide();
  }
  if (_0x35618a.edituser) {
    $(".userad").show();
  } else {
    $(".userad").hide();
  }
  if (_0x35618a.ban) {
    $(".bandad").show();
  } else {
    $(".bandad").hide();
  }
  if (_0x35618a.setpower) {
    $(".powerad").show();
  } else {
    $(".powerad").hide();
  }
  if (_0x35618a.flter) {
    $(".filterad,.report").show();
  } else {
    $(".filterad,.report").hide();
  }
  if (_0x35618a.rooms) {
    $(".roomsad").show();
  } else {
    $(".roomsad").hide();
  }
  if (_0x35618a.msgs) {
    $(".msgsad").show();
  } else {
    $(".msgsad").hide();
  }
  if (_0x35618a.shrt) {
    $(".shrtad").show();
  } else {
    $(".shrtad").hide();
  }
  if (_0x35618a.subs) {
    $(".subsad").show();
  } else {
    $(".subsad").hide();
  }
  if (_0x35618a.owner) {
    $(".ownad").show();
  } else {
    $(".ownad").hide();
  }
  if (_0x35618a.name == "gochat" || _0x35618a.name == "Hide" || _0x35618a.name == "chatmaster") {
    $(".owneredit").show();
    $(".emo").show();
    $(".otherad").show();
    $(".ownad1").show();
  } else {
    $(".owneredit").hide();
    $(".emo").hide();
    $(".otherad").hide();
    $(".ownad1").hide();
  }
  if (_0x35618a.owner || _0x35618a.waitroom) {
    $(".waitad").show();
  } else {
    $(".waitad").hide();
  }
  if (_0x35618a.report) {
    $(".report").show();
  } else {
    $(".report").hide();
  }
  if (_0x35618a.publicmsg) {
    $(".pmsg").show();
  } else {
    $(".pmsg").hide();
  }
}
uf = {
  "kw": "الكويت",
  "et": "إثيوبيا",
  "az": "أذربيجان",
  "am": "أرمينيا",
  "aw": "أروبا",
  "er": "إريتريا",
  "es": "أسبانيا",
  "au": "أستراليا",
  "ee": "إستونيا",
  "il": "فلسطين",
  "af": "أفغانستان",
  "ec": "إكوادور",
  "ar": "الأرجنتين",
  "jo": "الأردن",
  "ae": "الإمارات العربية المتحدة",
  "al": "ألبانيا",
  "bh": "مملكة البحرين",
  "br": "البرازيل",
  "pt": "البرتغال",
  "ba": "البوسنة والهرسك",
  "ga": "الجابون",
  "dz": "الجزائر",
  "dk": "الدانمارك",
  "cv": "الرأس الأخضر",
  "ps": "فلسطين",
  "sv": "السلفادور",
  "sn": "السنغال",
  "sd": "السودان",
  "se": "السويد",
  "so": "الصومال",
  "cn": "الصين",
  "iq": "العراق",
  "ph": "الفلبين",
  "cm": "الكاميرون",
  "cg": "الكونغو",
  "cd": "جمهورية الكونغو الديمقراطية",
  "de": "ألمانيا",
  "hu": "المجر",
  "ma": "المغرب",
  "mx": "المكسيك",
  "sa": "المملكة العربية السعودية",
  "uk": "المملكة المتحدة",
  "gb": "المملكة المتحدة",
  "no": "النرويج",
  "at": "النمسا",
  "ne": "النيجر",
  "in": "الهند",
  "us": "الولايات المتحدة",
  "jp": "اليابان",
  "ye": "اليمن",
  "gr": "اليونان",
  "ag": "أنتيغوا وبربودا",
  "id": "إندونيسيا",
  "ao": "أنغولا",
  "ai": "أنغويلا",
  "uy": "أوروجواي",
  "uz": "أوزبكستان",
  "ug": "أوغندا",
  "ua": "أوكرانيا",
  "ir": "إيران",
  "ie": "أيرلندا",
  "is": "أيسلندا",
  "it": "إيطاليا",
  "pg": "بابوا-غينيا الجديدة",
  "py": "باراجواي",
  "bb": "باربادوس",
  "pk": "باكستان",
  "pw": "بالاو",
  "bm": "برمودا",
  "bn": "بروناي",
  "be": "بلجيكا",
  "bg": "بلغاريا",
  "bd": "بنجلاديش",
  "pa": "بنما",
  "bj": "بنين",
  "bt": "بوتان",
  "bw": "بوتسوانا",
  "pr": "بورتو ريكو",
  "bf": "بوركينا فاسو",
  "bi": "بوروندي",
  "pl": "بولندا",
  "bo": "بوليفيا",
  "pf": "بولينزيا الفرنسية",
  "pe": "بيرو",
  "by": "بيلاروس",
  "bz": "بيليز",
  "th": "تايلاند",
  "tw": "تايوان",
  "tm": "تركمانستان",
  "tr": "تركيا",
  "tt": "ترينيداد وتوباجو",
  "td": "تشاد",
  "cl": "تشيلي",
  "tz": "تنزانيا",
  "tg": "توجو",
  "tv": "توفالو",
  "tk": "توكيلاو",
  "to": "تونجا",
  "tn": "تونس",
  "tp": "تيمور الشرقية",
  "jm": "جامايكا",
  "gm": "جامبيا",
  "gl": "جرينلاند",
  "pn": "جزر البتكارين",
  "bs": "جزر البهاما",
  "km": "جزر القمر",
  "cf": "أفريقيا الوسطى",
  "cz": "جمهورية التشيك",
  "do": "جمهورية الدومينيكان",
  "za": "جنوب أفريقيا",
  "gt": "جواتيمالا",
  "gp": "جواديلوب",
  "gu": "جوام",
  "ge": "جورجيا",
  "gs": "جورجيا الجنوبية",
  "gy": "جيانا",
  "gf": "جيانا الفرنسية",
  "dj": "جيبوتي",
  "je": "جيرسي",
  "gg": "جيرنزي",
  "va": "دولة الفاتيكان",
  "dm": "دومينيكا",
  "rw": "رواندا",
  "ru": "روسيا",
  "ro": "رومانيا",
  "re": "ريونيون",
  "zm": "زامبيا",
  "zw": "زيمبابوي",
  "ws": "ساموا",
  "sm": "سان مارينو",
  "sk": "سلوفاكيا",
  "si": "سلوفينيا",
  "sg": "سنغافورة",
  "sz": "سوازيلاند",
  "sy": "سوريا",
  "sr": "سورينام",
  "ch": "سويسرا",
  "sl": "سيراليون",
  "lk": "سيريلانكا",
  "sc": "سيشل",
  "rs": "صربيا",
  "tj": "طاجيكستان",
  "om": "عمان",
  "gh": "غانا",
  "gd": "غرينادا",
  "gn": "غينيا",
  "gq": "غينيا الاستوائية",
  "gw": "غينيا بيساو",
  "vu": "فانواتو",
  "fr": "فرنسا",
  "ve": "فنزويلا",
  "fi": "فنلندا",
  "vn": "فيتنام",
  "cy": "قبرص",
  "qa": "قطر",
  "kg": "قيرقيزستان",
  "kz": "كازاخستان",
  "nc": "كاليدونيا الجديدة",
  "kh": "كامبوديا",
  "hr": "كرواتيا",
  "ca": "كندا",
  "cu": "كوبا",
  "ci": "ساحل العاج",
  "kr": "كوريا",
  "kp": "كوريا الشمالية",
  "cr": "كوستاريكا",
  "co": "كولومبيا",
  "ki": "كيريباتي",
  "ke": "كينيا",
  "lv": "لاتفيا",
  "la": "لاوس",
  "lb": "لبنان",
  "li": "لشتنشتاين",
  "lu": "لوكسمبورج",
  "ly": "ليبيا",
  "lr": "ليبيريا",
  "lt": "ليتوانيا",
  "ls": "ليسوتو",
  "mq": "مارتينيك",
  "mo": "ماكاو",
  "fm": "ماكرونيزيا",
  "mw": "مالاوي",
  "mt": "مالطا",
  "ml": "مالي",
  "my": "ماليزيا",
  "yt": "مايوت",
  "mg": "مدغشقر",
  "eg": "مصر",
  "mk": "مقدونيا، يوغوسلافيا",
  "mn": "منغوليا",
  "mr": "موريتانيا",
  "mu": "موريشيوس",
  "mz": "موزمبيق",
  "md": "مولدوفا",
  "mc": "موناكو",
  "ms": "مونتسيرات",
  "me": "مونتينيغرو",
  "mm": "ميانمار",
  "na": "ناميبيا",
  "nr": "ناورو",
  "np": "نيبال",
  "ng": "نيجيريا",
  "ni": "نيكاراجوا",
  "nu": "نيوا",
  "nz": "نيوزيلندا",
  "ht": "هايتي",
  "hn": "هندوراس",
  "nl": "هولندا",
  "hk": "هونغ كونغ",
  "wf": "واليس وفوتونا"
};
	
window.addEventListener('load', function () {
	allload();
    RefreshPWS();
	
})

/* [DESIGN-DOMAINS] زرّا Nopta.1.0 و Uireta.1.0 (تبويب الإضافات): كل تصميم ليه قايمة دومينات تختار منها قبل التشغيل.
   التشغيل = على الدومينات المعلّمة بس، والإيقاف = يطفّي الكل. تغيير العلامات والتصميم شغّال يتحدّث فورًا. */
window._dsgBusy = window._dsgBusy || {};
window._dsgTimer = window._dsgTimer || {};
window._dsgQuiet = window._dsgQuiet || {};
var _dsg = {
  nopta: { sw: "#noptaSw", txt: "#noptaSwTxt", state: "#noptaState", box: "#noptaDomains", cmd: "SEND_ADMIN_NOPTA",
    on: "صفحة اللوجين + الشريط العلوي والسفلي بالشكل الجديد", off: "الموقع شغال بالشكل الافتراضي" },
  uireta: { sw: "#uiretaSw", txt: "#uiretaSwTxt", state: "#uiretaState", box: "#uiretaDomains", cmd: "SEND_ADMIN_UIRETA",
    on: "واجهة اللوجين بشكل Uireta الجديد", off: "واجهة اللوجين على الوضع السابق (الافتراضي أو Nopta)" }
};
function dsgSelected(key) {
  return $(_dsg[key].box + " input:checked").map(function () { return this.value; }).get();
}
function renderDesignDomains(key, all, onList) {
  var c = _dsg[key];
  all = all || [];
  var prev = dsgSelected(key).filter(function (d) { return all.indexOf(d) != -1; });
  var sel = (onList && onList.length) ? onList : (prev.length ? prev : (all.indexOf(location.hostname) != -1 ? [location.hostname] : []));
  var h = "";
  $.each(all, function (_i, d) {
    var e = _escDomain(d);
    h += '<label class="dsg-chip"><input type="checkbox" value="' + e + '"' + (sel.indexOf(d) != -1 ? " checked" : "") +
      ' onchange="onDesignDomainChange(\'' + key + '\')"><span dir="ltr">' + e + '</span></label>';
  });
  if (all.length > 1) h += '<a class="dsg-all" onclick="dsgSelectAll(\'' + key + '\')">تحديد الكل</a>';
  $(c.box).html(h);
}
function dsgSelectAll(key) {
  $(_dsg[key].box + " input").prop("checked", true);
  onDesignDomainChange(key);
}
function setDesignUI(key, on, list) {
  var c = _dsg[key];
  $(c.sw).toggleClass("on", !!on).attr("aria-checked", on ? "true" : "false");
  $(c.txt).text(on ? "تشغيل" : "إيقاف");
  $(c.state).text(on ? c.on + (list && list.length ? " — مفعّل على: " + list.join("، ") : "") : c.off);
}
function dsgEmit(key, wantOn, doms, quiet) {
  var c = _dsg[key];
  setDesignUI(key, wantOn, doms);
  /* [FIX] لو السيرفر ما ردّش خلال 4 ثواني نرجّع المفتاح ونقول السبب بدل ما يبان إنه اشتغل */
  window._dsgBusy[key] = true;
  window._dsgQuiet[key] = !!quiet;
  clearTimeout(window._dsgTimer[key]);
  window._dsgTimer[key] = setTimeout(function () {
    window._dsgBusy[key] = false;
    setDesignUI(key, !wantOn);
    $(c.state).text("⚠️ السيرفر ما ردّش على الأمر — لازم pm2 restart server (server.js القديم مفيهوش الأمر)، وبعدها Ctrl+Shift+R للوحة التحكم");
  }, 4000);
  socket.emit("SHWO_PANEL_ADMIN", { "cmd": c.cmd, "url": location.hostname, "limit": 1, "set": wantOn, "domains": doms });
}
function dsgToggle(key) {
  if (window._dsgBusy[key]) return; /* تجاهل الضغط المتكرر لحد ما السيرفر يرد */
  var c = _dsg[key];
  var wantOn = !$(c.sw).hasClass("on");
  if (!socket || !socket.connected) {
    $(c.state).text("⚠️ مفيش اتصال بالسيرفر — اعمل Ctrl+Shift+R للوحة التحكم");
    return;
  }
  var doms = dsgSelected(key);
  if (wantOn && !doms.length) {
    $(c.state).text("⚠️ اختار دومين واحد على الأقل قبل التشغيل");
    return;
  }
  dsgEmit(key, wantOn, wantOn ? doms : []);
}
function onDesignDomainChange(key) {
  var c = _dsg[key];
  if (!$(c.sw).hasClass("on") || window._dsgBusy[key]) return; /* لو التصميم مقفول: الاختيار بيتحفظ لحد التشغيل */
  var doms = dsgSelected(key);
  dsgEmit(key, doms.length > 0, doms, true);
}
function toggleNopta() { dsgToggle("nopta"); }
function toggleUireta() { dsgToggle("uireta"); }
function setNoptaUI(on, list) { window._noptaOn = !!on; setDesignUI("nopta", on, list); }
function setUiretaUI(on, list) { window._uiretaOn = !!on; setDesignUI("uireta", on, list); }

/* [ADDED] زر تغيير صفحة اللوجين (قديم) */
function toggleLoginStyle() {
  socket.emit("SHWO_PANEL_ADMIN", {
    "cmd": "SEND_ADMIN_LOGINSTYLE",
    "url": location.hostname,
    "limit": 1,
    "set": !window._loginStyleOn
  });
}

/* [ADDED] زر تغيير صورة بنر صفحة اللوجين (تبويب الإضافات) */
function changeLoginBanner() {
  var inp = $("<input type='file' accept='image/*' style='display:none;'/>");
  inp.on("change", function () {
    var f = inp.prop("files")[0];
    if (!f) return;
    var fd = new FormData();
    fd.append("photo", f);
    $("#loginBannerState").text("جاري الرفع...").removeClass("label-success label-danger").addClass("label-default");
    $.ajax({
      url: "/uploadLoginBanner?token=" + MY_T,
      type: "POST",
      data: fd,
      cache: false,
      processData: false,
      contentType: false,
      timeout: 0,
      success: function (r) {
        var j = {};
        try { j = JSON.parse(r); } catch (e) {}
        if (j.err || j.error || !j.msg) {
          $("#loginBannerState").text(j.msg && j.error ? j.msg : "فشل رفع الصورة").removeClass("label-default label-success").addClass("label-danger");
        } else {
          $("#loginBannerState").text("تم تغيير بنر اللوجين ✅ (حدّث صفحة اللوجين)").removeClass("label-default label-danger").addClass("label-success");
        }
      },
      error: function () {
        $("#loginBannerState").text("فشل رفع الصورة").removeClass("label-default label-success").addClass("label-danger");
      }
    });
  });
  inp.trigger("click");
}
function resetLoginBanner() {
  $.ajax({
    url: "/resetLoginBanner?token=" + MY_T,
    type: "POST",
    success: function (r) {
      /* [FIX] السيرفر بيرد 200 حتى لو رفض (ليس لديك الصلاحية) — لازم نقرا الرد */
      var j = {};
      try { j = typeof r === "string" ? JSON.parse(r) : (r || {}); } catch (e) {}
      if (j.error || j.err) {
        $("#loginBannerState").text("فشلت العملية" + (j.msg ? " — " + j.msg : "")).removeClass("label-default label-success").addClass("label-danger");
        return;
      }
      $("#loginBannerState").text("تم الرجوع للبنر الافتراضي ✅ (حدّث صفحة اللوجين)").removeClass("label-default label-danger").addClass("label-success");
    },
    error: function () {
      $("#loginBannerState").text("فشلت العملية").removeClass("label-default label-success").addClass("label-danger");
    }
  });
}

/* [ADDED] غلاف خارجي للوضع الافتراضي (تبويب الإضافات) */
function changeDefaultCover() {
  var inp = $("<input type='file' accept='image/*' style='display:none;'/>");
  inp.on("change", function () {
    var f = inp.prop("files")[0];
    if (!f) return;
    var fd = new FormData();
    fd.append("photo", f);
    $("#defaultCoverState").text("جاري الرفع...").removeClass("label-success label-danger").addClass("label-default");
    $.ajax({
      url: "/uploadDefaultCover?token=" + MY_T,
      type: "POST",
      data: fd,
      cache: false,
      processData: false,
      contentType: false,
      timeout: 0,
      success: function (r) {
        var j = {};
        try { j = typeof r === "string" ? JSON.parse(r) : (r || {}); } catch (e) {}
        if (j.err || j.error || !j.msg) {
          $("#defaultCoverState").text(j.msg && j.error ? j.msg : "فشل رفع الصورة").removeClass("label-default label-success").addClass("label-danger");
        } else {
          $("#defaultCoverState").text("تم تغيير الغلاف ✅ (حدّث صفحة اللوجين)").removeClass("label-default label-danger").addClass("label-success");
        }
      },
      error: function () {
        $("#defaultCoverState").text("فشل رفع الصورة").removeClass("label-default label-success").addClass("label-danger");
      }
    });
  });
  inp.trigger("click");
}
function resetDefaultCover() {
  $.ajax({
    url: "/resetDefaultCover?token=" + MY_T,
    type: "POST",
    success: function (r) {
      var j = {};
      try { j = typeof r === "string" ? JSON.parse(r) : (r || {}); } catch (e) {}
      if (j.error || j.err) {
        $("#defaultCoverState").text("فشلت العملية" + (j.msg ? " — " + j.msg : "")).removeClass("label-default label-success").addClass("label-danger");
        return;
      }
      $("#defaultCoverState").text("تم الرجوع للغلاف الافتراضي ✅ (حدّث صفحة اللوجين)").removeClass("label-default label-danger").addClass("label-success");
    },
    error: function () {
      $("#defaultCoverState").text("فشلت العملية").removeClass("label-default label-success").addClass("label-danger");
    }
  });
}

/* [ADDED] زر تغيير الشريط العلوي والسفلي (تبويب الإضافات) */
function toggleBarsStyle() {
  socket.emit("SHWO_PANEL_ADMIN", {
    "cmd": "SEND_ADMIN_BARSTYLE",
    "url": location.hostname,
    "limit": 1,
    "set": !window._barsStyleOn
  });
}
