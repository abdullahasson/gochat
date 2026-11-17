var 
  C_L_U = [],
  C_L_R = [],
  randomRoomNumber = null,
  M_ID = null,
  M_ROOM = null,
  nopm = false,
  uptyping = true,
  vchat = true,
  Ge_Dev_N,
  socket = null,
  istalkromm = false,
  R_P_C_M = null,
  msgload = false,
  MAX_EMO = 5,
  sizewidth = 5,
  localVideo,
  localStream,
  youtubel,
  remoteVideo,
  connectedUser,
  yourConn,
  nonot = false,
  clickop = null,
  timest,
  widthst = 1,
  storys = [],
  T_LIST = {},
  STORY_DEFALUT = {},
  stealthv = false,
  isstopmic,
  isrecorder = false,
  callstat = 0,
  bcc = 0,
  stcc = 0,
  isrepl = false,
  PIC_FILE = null,
  jstp = {},
  dbcb = false,
  pws = [],
  spsh,
  emos = [],
  sico = [],
  atar = [],
  back = [],
  dro3 = [],
  MY_T = "",
  isIphone = false,
  isbust,
  Mystram,
  mediaRecorder,
  BLOCK_USER = [],
  U_X = {},
  allcooment = {},
  U_CASH = {},
  R_CASH = {},
  lk = null,
  typing = false,
  L_T_T,
  N_SORT = true;
  var isprofile = false;
function stringGen(len) {
  var text = "";
  var charset = "abcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < len; i++)
    text += charset.charAt(Math.floor(Math.random() * charset.length));
  return text;
}
const updateTyping = function (id) {
  if (!typing) {
    typing = true;
    SEND_EVENT_EMIT("SEND_EVENT_EMIT_TYPING", { id: id });
  }
  L_T_T = new Date().getTime();
  setTimeout(function () {
    var typingTimer = new Date().getTime();
    var timeDiff = typingTimer - L_T_T;
    if (timeDiff >= 1e3 && typing) {
      SEND_EVENT_EMIT("SEND_EVENT_EMIT_STOP_TYPING", { id: id });
      typing = false;
    }
  }, 1e3);
};

function logout() {
  SEND_EVENT_EMIT("SEND_EVENT_EMIT_LOGOUT", {});
  $("#dpnl").hide();
  clsbrow(1);
}
function getIdYoutube(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);

  return (match && match[2].length === 11)
    ? match[2]
    : null;
}
function ClearRoom(e,a){
  $(e).remove();
  if(a == 1){
  $('.backroom').attr('src','');
  }else{
  $('.bordroom').attr('src','');                
  }
}
function toEnglishDigits(str) {
  var e = "۰".charCodeAt(0);
  str = str.replace(/[۰-۹]/g, function (t) {
    return t.charCodeAt(0) - e;
  });
  e = "٠".charCodeAt(0);
  str = str.replace(/[٠-٩]/g, function (t) {
    return t.charCodeAt(0) - e;
  });
  return str;
}
function rdlike(id) {
  SEND_EVENT_EMIT("SEND_EVENT_EMIT_ACTION", { cmd: "like", id: id });
}

function SEND_BC_UP(wfile) {
  if (wfile) {
    PIC_FILE = null;
    SEND_UP_FILE("bc", function () {
      var msg = $(".tboxbc").val();
      $(".tboxbc").val("");
      var link = PIC_FILE;
      PIC_FILE = "";
      if (
        (msg == "%0A" || msg == "%0a" || msg == "" || msg == "\n") &&
        (link == "" || link == null)
      ) {
        return;
      }
      SEND_EVENT_EMIT("SEND_EVENT_EMIT_BC", {
        msg: toEnglishDigits(msg),
        link: link,
      });
          onlines();
clearTimeout(isbust);
puys();
      return;
    });
    return;
  } else {
    PIC_FILE = null;
  }
  var msg = $(".tboxbc").val();
  $(".tboxbc").val("");
  var link = PIC_FILE;
  PIC_FILE = "";
  if (
    (msg == "%0A" || msg == "%0a" || msg == "" || msg == "\n") &&
    (link == "" || link == null)
  ) {
    return;
  }
  SEND_EVENT_EMIT("SEND_EVENT_EMIT_BC", {
    msg: toEnglishDigits(msg),
    link: link,
  });
  onlines();
clearTimeout(isbust);
puys();
}
function onlines() {
  socket.emit("SEND_EVENT_EMIT_STATE", 0);
}
function puys() {
  isbust = setTimeout(function () {
    socket.emit("SEND_EVENT_EMIT_STATE", 1);
    puys();
  }, 18e4);
}
function refr() {
  var r = document.referrer || "";
  if (r.indexOf("http://" + location.hostname) == 0) {
    return "";
  }
  if (r.indexOf("://") != -1) {
    r = r.replace(/(.*?)\:\/\//g, "").split("/")[0];
  }
  return r;
}

function __dpnlOn() {
  /* [FIX-C10/P1] فحص رخيص لظهور اللوحة: قراءة inline display مباشرة بلا
     jQuery :visible (الذي يقرأ offsetWidth/offsetHeight ويجبر تخطيطًا
     متزامنًا) — #dpnl لا يُخفى إلا عبر .hide()/.show() من الكود نفسه */
  var __p = document.getElementById("dpnl");
  return !!(__p && __p.style.display !== "none");
}
function CHECK_UP() {
  /* [FIX-F07] عند تفعيل تبويب المتصلين لا يوجد حدث scroll — نعيد القياس والرسم
     حتى يكتمل النطاق المرئي (كانت الرسمة بحجم صفر والصفوف السفلية تختفي) */
  /* [FIX-C10/P1] كانت الفحوصات $("#dpnl:visible").find(...) تجبر تخطيطًا
     متزامنًا كل ثانيتين للأبد — الآن بوابات رخيصة قبل أي عمل jQuery */
  var __usersTab = document.getElementById("users");
  var __roomsTab = document.getElementById("rooms");
  var __usersOn = __usersTab && __usersTab.classList.contains("active");
  var __roomsOn = __roomsTab && __roomsTab.classList.contains("active");
  if (window.VLIST && __dpnlOn() && __usersOn) {
    VLIST.refresh();
  }
  if (
    needUpdate &&
    __dpnlOn() &&
    (__usersOn || __roomsOn)
  ) {
    updateusers();
    updaterooms();
    needUpdate = false;
    N_SORT = true;
  }
  if (N_SORT && __dpnlOn() && __roomsOn) {
    N_SORT = false;
    var elems = $("#rooms")
      .find(".room")
      .sort(function (a, b) {
        var av = parseInt($(a).attr("v"));
        var bv = parseInt($(b).attr("v"));
        if (av == bv) {
          return ($(a).find(".u-topic").text() + "").localeCompare(
            $(b).find(".u-topic").text() + ""
          );
        }
        return av < bv ? 1 : -1;
      });
    $(".rmr").html(elems);
  }
  setTimeout(CHECK_UP, 2e3);
}
function D98_47DA_YIN() {
  try {
    if (
      "string" == typeof window.name &&
      0 == window.name.indexOf("{") &&
      window.name.lastIndexOf("}") == window.name.length - 1
    ) {
      var e = JSON.parse(window.name);
      setv("fp1", e.fp1 || ""), setv("cc", e.cc || "");
    }
    for (
      var t,
        o = new ClientJS(),
        n = [],
        d = [
          "getBrowserMajorVersion,isIE,isChrome,isFirefox,isSafari,isOpera,getOSVersion,isWindows,isMac,isLinux,isUbuntu,isSolaris,isMobile,isMobileMajor,isMobileAndroid,isMobileOpera,isMobileWindows,isMobileBlackBerry,isMobileIOS,isIphone,isIpad,isIpod,getColorDepth,getCurrentResolution,getDeviceXDPI,getDeviceYDPI",
          "isCanvas,getCanvasPrint",
          "getPlugins,getMimeTypes,isMimeTypes,isFont,getFonts,isLocalStorage,isSessionStorage,isCookie",
          "getTimeZone,getLanguage,getSystemLanguage",
        ],
        s = "",
        a = 0;
      a < d.length;
      a++
    ) {
      t = d[a].split(",");
      for (var r, l = 0; l < t.length; l++) {
        r = "";
        try {
          r = (o[t[l]]() || "") + "";
        } catch (e) {}
        n.push(r);
      }
      (s += "." + hash(n, 256)), (n = []);
    }
    var c = getv("cc") || "",
      p = getv("fp1") || "",
      g = getv("refr") || "";
    return (
      "" == p && ((p = s), setv("fp1", p)),
      "" == c && ((c = ccode()), setv("cc", c)),
      (window.name = JSON.stringify({ fp1: p, cc: c })),
      p + "." + hash([g], 256) + "." + c
    );
  } catch (e) {
    console.log(e);
    var c = getv("cc");
    return ("" == c || null == c) && ((c = ccode()), setv("cc", c)), "ERR." + c;
  }
}
var lastRoomSearch = "";
var __rsT = 0;
function searchForRooms() {
  var currentRoomSearch = $("#roomSearchInput").val();
  if (currentRoomSearch != lastRoomSearch) {
    lastRoomSearch = currentRoomSearch;
    if (lastRoomSearch != "") {
      $("#roomSearchInput").removeClass("sm");
    } else {
      $("#roomSearchInput").addClass("sm");
    }
    $("#rooms .room").css("display", "");
    $.each($("#rooms .room"), function (i, e) {
      if ($(e).text().toLowerCase().indexOf(lastRoomSearch.toLowerCase()) == -1) {
        $(e).css("display", "none");
      }
    });
  }
}
/* [FIX-F05] كانت حلقة 600ms تعمل jQuery each على كل الغرف حتى بدون كتابة —
   الآن: حدث input مع debounce 200ms */
$(document).on("input", "#roomSearchInput", function () {
  if (__rsT) clearTimeout(__rsT);
  __rsT = setTimeout(function () {
    __rsT = 0;
    searchForRooms();
  }, 200);
});


var edituser;
function load() {
  isIphone = /ipad|iphone|ipod/i.test(navigator.userAgent.toLowerCase());
  if (typeof $ == "undefined" || typeof io == "undefined") {
    clsbrow(1000);
    return;
  }
  if ($("").tab == null) {
    clsbrow(1000);
    return;
  }
  if (isIphone) {
    $('img[data-toggle="popover"]').removeClass("nosel");
    fxi();
  }
  CHECK_UP();
  puys();
  $("#rhtml .utopic").css("margin-left", "6px");
  umsg = $("#umsg").html();
  loadblocked();
  if ($(window).width() <= 400) {
    sizewidth = 400;
    $("meta[name='viewport']").attr("content", " user-scalable=0, width=400 , interactive-widget=resizes-content");
  }
  if ($(window).width() >= 600) {
    sizewidth = 600;
    $("meta[name='viewport']").attr("content", " user-scalable=0, width=600 , interactive-widget=resizes-content");
  }
  $("#d2").click(function () {
    if (spsh) {
      if (spsh.css("display") == "block") {
        spsh.hide();
      }
    }
    /* [FIX-C25/P2] كانت كل لمسة في منطقة الرسائل تنفّذ $(".dpnl").hide()
       (بحث jQuery + كتابة style) حتى واللوحة مغلقة أصلًا — الحالة الغالبة.
       الآن: فحص inline display رخيص بلا jQuery ولا تخطيط، والعمل فقط عند
       اللزوم. نفس سلوك الإغلاق تمامًا. */
    var __dpnlEl = document.getElementById("dpnl");
    if (__dpnlEl && __dpnlEl.style.display !== "none") {
      $(".dpnl").hide();
    }
  });
  $('.isyoutube').click(function(){
    // روابط انستجرام / تيك توك بتتفتح في تبويب جديد (المشغل بيدعم يوتيوب بس)
    if(!getIdYoutube(youtubel || '')){ window.open(youtubel,'_blank','noopener'); return; }
    $('.pstorycdesclass').remove();
    $("#upro").before('<div class="pstorycdesclass">'+
    '<div class="pstorycdesclass" style="display:block" onclick="$(this).parent().remove()"></div>'+
    '<div class="pstycdesclass">'+
    '<button class="btn btn-info" onclick="$(this).parent().parent().hide()" style="width: 28px;margin: 5px;float: right;">-</button>'+
    '<div class="islinkcdesclass"></div>'+
    '</div></div>'); 
    $('.islinkcdesclass').append('<iframe src="https://www.youtube.com/embed/'+getIdYoutube(youtubel)+'?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen="" style="width:330px;height:490px" frameborder="0"></iframe>');
    });
  $(".vloumemic").click(function () {
    if (remoteVideo.muted) {
      remoteVideo.muted = false;
      $(this).removeClass("fa-volume-off");
      $(this).addClass("fa-volume-up");
    } else {
      $(this).removeClass("fa-volume-up");
      $(this).addClass("fa-volume-off");
      remoteVideo.muted = true;
    }
  });
  $(".mutemic").click(function () {
    if (localStream.getAudioTracks()[0].enabled) {
      $(this).removeClass("fa-microphone-slash");
      $(this).addClass("fa-microphone");
      localStream.getAudioTracks()[0].enabled = false;
    } else {
      $(this).removeClass("fa-microphone");
      $(this).addClass("fa-microphone-slash");
      localStream.getAudioTracks()[0].enabled = true;
    }
  });
 
  $("#tbox").css("background-color", "#AAAAAF");
  $(".rout").hide();
  $(".redit").hide();
  $("#u1").val(decodeURIComponent(getv("u1")));
  $("#u2").val(decodeURIComponent(getv("u2")));
  $("#pass1").val(decodeURIComponent(getv("p1")));
  if (getv("isl") == "yes") {
    $('.nav-tabs a[href="#l2"]').tab("show");
  }
  uhtml = $("#uhtml").html();
  rhtml = $("#rhtml").html();
  phtml = $("#broadcasters").html();
  $(".ae").click(function (params) {
    $(".phide").click();
  });
  var dbg = getUrlParameter("debug") == "1";
  if (dbg) {
    window.onerror = function (errorMsg, url, lineNumber) {
      alert("Error: " + errorMsg + " Script: " + url + " Line: " + lineNumber);
    };
  }
  lstat("success", " ");
  function oidbg(ev, data) {
    if (dbg == false) {
      return;
    }
    if (typeof data == "object") {
      data = JSON.stringify(data);
    }
    alert(ev + "\n" + data);
  }
  if (getv("refr") == "") {
    setv("refr", refr() || "*");
  }
  if (getv("r") == "") {
    setv("r", getUrlParameter("r") || "*");
  }
  $(window).on("resize pushclose pushopen", fixSize);
  /* [FIX-C02/P0] iOS: فتح/غلق الكيبورد لا يطلق window.resize دائمًا —
     visualViewport هو الحدث الصحيح هناك. نفس معالج fixSize بلا تغيير سلوك،
     مع debounce خفيف أثناء حركة الكيبورد حتى لا تعمل أثناء الأنيميشن. */
  if (window.visualViewport) {
    var __vvT = 0;
    window.visualViewport.addEventListener("resize", function () {
      clearTimeout(__vvT);
      __vvT = setTimeout(fixSize, 120);
    });
  }
  $('*[data-toggle="tab"]').on("shown.bs.tab", function (e) {
    fixSize();
  });
  /* [FIX-C04/P0] الالتقاط على keydown قبل إدراج السطر الجديد (كان keyup بعد
     إدراجه) مع تجاهل حالة isComposing حفاظًا على الكتابة العربية بالتصحيح
     التلقائي. keyup القديم يبقى كشبكة أمان للمحارف الافتراضية وهو غير ضار:
     Tsend يتجاهل النص الفارغ فلن يُرسل مرتين أبدًا. */
  $("#tbox").keydown(function (e) {
    if (e.keyCode == 13 && !e.isComposing) {
      e.preventDefault();
      Tsend();
    }
  });
  $("#tbox").keyup(function (e) {
    if (e.keyCode == 13) {
      e.preventDefault();
      Tsend();
    }
  });
  $(".tboxbc").keyup(function (e) {
    if (e.keyCode == 13) {
      e.preventDefault();
      SEND_BC_UP();
    }
  });
  
  setTimeout(function () {
    NEW_CONNECT();
    $.ajaxSetup({ cache: false });
    REFRESH_ONLINE_USERS();
  }, 200);
  fixSize();
  /* [FIX-C16/P1] استطلاع تدريجي لشاشة الدخول: 5 ثوانٍ ثم 10 ثوانٍ بعد دقيقة
     انتظار (كان 5 ثوانٍ ثابتة للأبد لكل زائر). يُلغى كالمعتاد عند الدخول. */
  var __seoStart = Date.now(), __seoDelay = 5000;
  (function __seoLoop() {
    seostop = setTimeout(function () {
      REFRESH_ONLINE_USERS();
      if (Date.now() - __seoStart > 60000) __seoDelay = 10000;
      __seoLoop();
    }, __seoDelay);
  })();
}
$(function () {
  var istogladmin = true;
  $("#myadmin").click(function () {
    if (istogladmin) {
      istogladmin = false;
      $(".notadmin").hide();
      $(".isadmin").show();
      $("#myadmin").text("أدوات اخرى");
    } else {
      istogladmin = true;
      $(".isadmin").hide();
      $(".notadmin").show();
      $("#myadmin").text("أدوات إداريه");
    } 
  });
});
function StartRecorder(id) {
  if (isrecorder == false && !ie && !localStream) {
    if (id) {
      $(".microphone").css("display", "none");
      $(".stopmico").css("display", "block");
      navigator.mediaDevices
        .getUserMedia({ audio: { noiseSuppression: false } })
        .then(function (mediaStream) {
          Mystram = mediaStream;
          mediaRecorder = new MediaRecorder(mediaStream);
          mediaRecorder.onstart = function (e) {
            this.chunks = [];
          };
          mediaRecorder.ondataavailable = function (e) {
            this.chunks.push(e.data);
          };
          mediaRecorder.onstop = function (e) {
            var blob = new Blob(this.chunks, { type: "audio/m4a" });
            SEND_EVENT_EMIT("SEND_EVENT_EMIT_ACTION", {
              cmd: "sendVoice",
              id: id,
              voice: blob,
            });
            isrecorder = false;
          };
          isrecorder = true;
          mediaRecorder.start();
        });
    }
  } else {
    alert("الرجاء المحاولة في وقت لاحق");
  }
}
function StopRecorder(state) {
  $(".microphone").css("display", "block");
  $(".stopmico").css("display", "none");
  if (state) {
    mediaRecorder.stop();
    isrecorder = false;
  }
  if (Mystram != null) {
    Mystram.getTracks().forEach(function (track) {
      track.stop();
      Mystram = null;
    });
  }
}
function hexToRgb(hex) {
  var bigint = parseInt(hex, 16);
  var r = (bigint >> 16) & 255;
  var g = (bigint >> 8) & 255;
  var b = bigint & 255;
  return r + "," + g + "," + b;
}
function escapeHtml(str) {
  var map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return str.replace(/[&<>"']/g, function (m) {
    return map[m];
  });
}
function SEND_EVENT_EMIT(e, t) {
  socket.emit("SEND_EVENT_EMIT_SERVER", { cmd: e, data: t });
}


function sendfilea(id, folder) {
  pickedfile = null;
  var e = $("<div></div>").first();
  e.append("<input type='file'  accept='image/*' style='display:none;'/>");
  e.children("input").trigger("click");
  var xx;
  $(e)
    .children("input")
    .on("change", function () {
      var sp = $(
        "<div class='mm msg ' style='width:200px;'><a class='fn '></a><button style='color:red;border:1px solid red;min-width:40px;' class=' cancl'>X</button></div>"
      );
      sp.insertAfter($(id));
      $(sp)
        .find(".cancl")
        .click(function () {
          $(sp).remove();
          xx.abort();
        });
      var formData = new FormData();
      formData.append("photo", $(e).children("input").prop("files")[0]);
      xx = $.ajax({
        xhr: function () {
          var xhr = new window.XMLHttpRequest();
          xhr.upload.addEventListener(
            "progress",
            function (evt) {
              if (evt.lengthComputable) {
                var percentComplete = evt.loaded / evt.total;
                $(sp.find(".fn")).text(
                  "%" +
                    parseInt(percentComplete * 100) +
                    " | " +
                    $(e).children("input").val().split("\\").pop()
                );
              }
            },
            false
          );
          return xhr;
        },
        timeout: 0,
        url: "/uploadURM?token=" + MY_T + "&state=" + folder,
        type: "POST",
        data: formData,
        cache: false,
        processData: false,
        contentType: false,
        success: function (data) {
          const d = JSON.parse(data);
          if (d.msg.includes("room")) {
            $(".p-room").attr(
              "src",
              "/site/" + location.host + d.msg.replace("room/", "")
            );
          } else if (d.msg.includes("pic")) {
            $(".p-user").attr(
              "src",
              "/site/" + location.host + d.msg.replace("pic/", "")
            );
          } else if (d.msg.includes("banner")) {
            $(".p-banner").attr(
              "src",
              "/site/" + location.host + d.msg.replace("banner/", "")
            );
          } else if (d.msg.includes("bacmic")) {
            $(".p-bacmic").attr(
              "src",
              "/site/" + location.host + d.msg.replace("bacmic/", "")
            );
          } else if (d.msg.includes("msgpic")) {
            $(".p-msgpic").attr(
              "src",
              "/site/" + d.msg.replace("msgpic/", "")
            );
          } else if (d.msg.includes("mic")) {
          $(".p-mic").attr(
            "src",
            "/site/" + location.host + d.msg.replace("mic/", "")
          );
        } else if (d.msg.includes("logo")) {
            $(".p-logo").attr(
              "src",
              "/site/" + location.host + d.msg.replace("logo/", "")
            );
          } else if (d.msg.includes("emo")) {
            var ht = $(
              '<div style="display:inline-block;padding:2px;margin:2px;margin-top:2px;" class="border"><img style="max-width:24px;max-height:24px;"><input type="number" name=' +
                d.msg.split("@")[0] +
                ' onchange="emoChange(this)" style="width:50px;margin:2px" value=' +
                d.msg.split("@")[1] +
                ">ف" +
                '<a style="margin-left: 4px;padding:4px;" onclick="del_ico(this);" class="btn btn-danger fa fa-times">.</a>' +
                "</div>"
            );
            ht.find("img").attr("src", "/" + d.msg.split("@")[0]);
            ht.find("a").attr("pid", "/" + d.msg.split("@")[0]);
            $(".p-emo").append(ht);
          } else if (d.msg.includes("dro3")) {
            var ht = $(
              '<div style="display:inline-block;padding:2px;margin:2px;margin-top:2px;" class="border"><img style="max-width:24px;max-height:24px;"><a style="margin-left: 4px;padding:4px;" onclick="del_ico(this);" class="btn btn-danger fa fa-times">.</a></div>'
            );
            ht.find("img").attr("src", "/" + d.msg);
            ht.find("a").attr("pid", d.msg);
            $(".p-dro3").append(ht);
          } else if (d.msg.includes("sico")) {
            var ht = $(
              '<div style="display:inline-block;padding:2px;margin:2px;margin-top:2px;" class="border"><img style="max-width:24px;max-height:24px;"><a style="margin-left: 4px;padding:4px;" onclick="del_ico(this);" class="btn btn-danger fa fa-times">.</a></div>'
            );
            ht.find("img").attr("src", "/" + d.msg);
            ht.find("a").attr("pid", d.msg);
            $(".p-sico").append(ht);
          }else if (d.msg.includes("atar")) {
            var ht = $(
              '<div style="display:inline-block;padding:2px;margin:2px;margin-top:2px;" class="border"><img style="max-width:24px;max-height:24px;"><a style="margin-left: 4px;padding:4px;" onclick="del_ico(this);" class="btn btn-danger fa fa-times">.</a></div>'
            );
            ht.find("img").attr("src", "/" + d.msg);
            ht.find("a").attr("pid", d.msg);
            $(".p-atar").append(ht);
          }else if (d.msg.includes("back")) {
            var ht = $(
              '<div style="display:inline-block;padding:2px;margin:2px;margin-top:2px;" class="border"><img style="max-width:24px;max-height:24px;"><a style="margin-left: 4px;padding:4px;" onclick="del_ico(this);" class="btn btn-danger fa fa-times">.</a></div>'
            );
            ht.find("img").attr("src", "/" + d.msg);
            ht.find("a").attr("pid", d.msg);
            $(".p-back").append(ht);
          }
          $(sp).remove();
          $(e).remove();
        },
        error: function () {
          $(sp).remove();
        },
      });
    });
}
function GET_TOP_BAR() {
  SEND_EVENT_EMIT("SEND_EVENT_EMIT_TOP_BAR", {});
}
var tried = 0;
function Recontect() {
  fixSize(1);
  tried++;
  if (M_ID != null && lk != null && tried <= 6) {
    $(".ovr").remove();
    if ($(".ovr").length == 0) {
      $(document.body)
        .append(`<div class="ovr" style="width:100%;height:100%;z-index:999999;position: fixed;left: 0px;top: 0px;background-color: rgba(0, 0, 0, 0.6);"><div style="margin: 25%;margin-top:5%;border-radius: 4px;padding: 8px;width: 220px;" class=" label-warning"><button class="btn btn-danger fr" style="
            margin-top: -6px;
            margin-right: -6px;
        " onclick="$(this).hide();window.clsbrow(100);">[ x ]</button><div>.. يتم إعاده الاتصال</div></div></div>`);
    }
    setTimeout(function () {
      NEW_CONNECT();
    }, 3e3);
    return;
  }
  clsbrow();
}
function NEW_CONNECT() {
  var trans =
    "WebSocket" in window || "MozWebSocket" in window
      ? ["websocket"]
      : ["polling", "websocket"];

  var clientb = new ClientJS();
  socket = io("", {
    reconnection: true,
    /* [FIX-S21] إعادة اتصال صاروخية: الإعدادات الافتراضية (1000ms ×5 مع
       عشوائية 50%) كانت تسيب متوسط انتظار المحاولات الأولى ~3 ثوانٍ —
       الآن أول محاولة بعد 400ms فقط وسقف 3 ثوانٍ وعشوائية 20%، وكشف فشل
       محاولة الاتصال في 9 ثوانٍ بدل 20 (يعمل مع فحص الحياة S20 و force()
       في silent-reconnect: لو حقيقياً انفصلت بترجع خلال أجزاء من الثانية). */
    reconnectionDelay: 400,
    reconnectionDelayMax: 3000,
    randomizationFactor: 0.2,
    timeout: 9000,
    transports: trans,
    closeOnBeforeunload: false,
    query: {
      wk: D98_47DA_YIN(),
      browser: clientb.getBrowser(),
      dtoday: new Date().getTime(),
      plt: clientb.getOS(),
      version: clientb.getOSVersion(),
    },
  });
  socket.on("connect", function () {

if (socket.recovered) {
            if (M_ID) {
                $("div#message-box").removeClass("hide");
                $("div#message-box1").addClass("hiden");
                setTimeout(() => {
                    $("div#message-box1").removeClass("hiden");
                    $("div#message-box1").addClass("hide");
                }, 1000);
                setTimeout(() => {
                    $("div#message-box").addClass("hiden");
                    setTimeout(() => {
                        $("div#message-box").removeClass("hiden");

                        $("div#message-box").addClass("hide");
                    }, 500);
                }, 2500);
            }
        } else {
            if (M_ID) {
                $("div#message-box2").removeClass("hide");
                $("div#message-box1").addClass("hiden");
                setTimeout(() => {
                  clsbrow(1);
                }, 1000);
            }
        }
    fixSize();
    var e = new ClientJS(),
      t = {};
    for (var o in navigator) t[o] = navigator[o];
    var n = {
      OS: e.getOS(),
      OSV: e.getOSVersion(),
      Browser: e.getBrowser(),
      Height: screen.height,
      Width: screen.width,
      Depth: screen.pixelDepth,
      Lang: e.getLanguage(),
      Agent: e.getUserAgent(),
      BrowserV: e.getBrowserVersion(),
      vH: t,
    };
    socket.emit("userdata", n, "no"),
      $("#tlogins button").removeAttr("disabled"),
      lstat("success", "متصل");
    if (M_ID != null && lk != null) {
      socket.emit("RECONTECD_USERS", { token: MY_T, n: M_ID });
    }
    if (getUrlParameter("enter") != null) {
      $("#u1").val(hash([new Date().getTime()], 256) + "_زائر");
      login(1);
    }
    /* [FIX-C05/P0] كانت الرقعة تعطّل قراءة كل localStorage بعد الاتصال
       (Storage.prototype.getItem => null دائمًا) فتُكسر ميزات تعتمد على getv():
       حفظ الاسم/كلمة المرور/الإحالة/قائمة التجاهل، و«حالتي الآن» (user-status.js
       يقرأ myStatus مباشرة من localStorage بعد الاتصال). الآن: تعطيل قراءة بصمة
       الجهاز فقط (fp1/cc) — نفس غرض الحماية من العبث بالبصمة دون كسر أي ميزة.
       والرقعة idempotent فلا تتراكب مع كل إعادة اتصال صامتة. */
    if (!Storage.prototype.__codyOrigGetItem) {
      Storage.prototype.__codyOrigGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = function (k) {
        if (k === "fp1" || k === "cc") return null;
        return Storage.prototype.__codyOrigGetItem.call(this, k);
      };
    }
  });
  socket.on("SEND_EVENT_EMIT_BROADCASTING", function (e) {
    fx(e);
  });

  socket.on("SEND_EVENT_EMIT_SERVER", function (e) {
    if (e.cmd == "ok") {
      lk = e.k;
    }
    if (e.cmd == "nok") {
      lk = null;
    }
    ON_DATE_SEND(e.cmd, e.data);
  });
  socket.on("disconnect", function () {
    if(M_ID){
      $("div#message-box1").removeClass("hide");
    }else{
      setTimeout(() => {
        clsbrow(200)
      }, 500);
     
      lstat("danger", "غير متصل");
    }
  });
  socket.on("connect_error", function () {
    $(".ovr div")
      .attr("class", "label-danger")
      .find("div")
      .text("فشل الاتصال ..");
    lstat("danger", "غير متصل");
        clsbrow(200)
  });
  socket.on("connect_timeout", function () {
    $(".ovr div")
      .attr("class", "label-danger")
      .find("div")
      .text("فشل الاتصال ..");
    lstat("danger", "غير متصل");
        clsbrow(200)    
  });
  socket.on("error", function () {
    $(".ovr div")
      .attr("class", "label-danger")
      .find("div")
      .text("فشل الاتصال ..");
    lstat("danger", "غير متصل");
                clsbrow(200)
    
  });
}
function fxi() {
  if (isIphone) {
    $("textarea").on("focus", function () {
      fixI(this);
    });
    $("textarea").on("blur", function () {
      blurI(this);
    });
    document.addEventListener("focusout", function (e) {
      window.scrollTo(0, 0);
    });
  }
}
function fixI(el) {
  if (isIphone == false) {
    return;
  }
  var sv =
    $(el).position().top -
    (document.body.scrollHeight - window.innerHeight) -
    10;
  if (sv < document.body.scrollHeight + window.innerHeight) {
  }
  $(document.body).scrollTop(sv);
}
function blurI() {
  if (isIphone == false) {
    return;
  }
  $(document.body).scrollTop(0);
}
function removegifpic(data) {
  /* [FIX-C38/الجلسة5] القوائم/النوافذ/الحائط كانت تعرض الأفاتار المتحرك الكامل (ويب
     متحرك أو GIF) في كل صف بحجم 52px — فك تشفير متحرك مستمر لكل عضو = سخونة
     ورام واضحة مع الأعضاء الكثيرين. الآن: gif/webp يعرضوا المصغّرة الثابتة 150px
     (x.gif.jpg / x.webp.jpg — تتولد في السيرفر ذاتياً لو ناقصة [FIX-S28])،
     والبروفايل الكامل المضغوط يظهر في نافذة العضو كما هو */
  if (data.includes("png")) {
    return data;
  } else if (data.includes("picroom")) {
    return data;
  } else if (data.includes(".gif") || data.includes(".webp")) {
    return data + ".jpg";
  } else {
    return data.replace(".jpg", ".jpg.jpg");
  }
}
/* [FIX-PERF] حذف imageExists/removegifs: كانت تستخدم XMLHttpRequest متزامن (sync)
   يجمّد المتصفح بالكامل حتى ينتهي الطلب — وكود ميت لا يُستدعى من أي مكان */
function REFRESH_ONLINE_USERS() {
  /* [FIX-S] تمرير token (نقطة النهاية أصبحت محمية) */
  var _onUrl = MY_T ? "GET_ALL_USER_ONLINE?token=" + encodeURIComponent(MY_T) : "GET_LOGIN_ONLINE"; /* [ADDED] Nopta: قبل الدخول بنستخدم نقطة عامة */
  $.get(_onUrl, function (d) {
    if (typeof d == "string") {
      d = JSON.parse(d);
    }
    var data = d;
    pws = data.powers;
    var lonline = $(".lonline");
    if (!lonline.length) return;
    /* [FIX-C16/P1] كان يفرّغ القائمة ويعيد بناء كل الصفوف من جديد كل 5 ثوانٍ
       لكل زائر حتى لو لم تتغير البيانات قيد أنملة (مسّ DOM كامل + صور
       تعاد). الآن: بصمة سريعة (معرفات+أسماء+صور+عدد) — لو لم تتغير تخطّي
       إعادة البناء بالكامل، ولو تغيّرت نبني في DocumentFragment واحد
       ونلحق مرة واحدة، مع loading=lazy لصور الأيقونات/الأعلام. */
    var __fp = "";
    try {
      var __on = data.online || [];
      var __parts = new Array(__on.length);
      for (var __k = 0; __k < __on.length; __k++) {
        __parts[__k] = __on[__k].id + "~" + (__on[__k].topic || "") + "~" + (__on[__k].pic || "");
      }
      __fp = data.count + "|" + __parts.join(";") + "|" + (data.powers ? data.powers.length : 0);
    } catch (_fpErr) {}
    if (__fp && __fp === window.__lonFp) return;
    window.__lonFp = __fp;
    lonline.children().remove();
    var uhtml = $("#uhtml").html();
    var __frag = document.createDocumentFragment();
    $(".s1").text(data.count != null ? data.count : data.online.length);
    $.each(data.online, function (i, e) {
      if (e.s == true) {
        return;
      }
      try { /* [Nopta] عضو واحد بياناته ناقصة ما يوقّفش باقي القايمة */
      var uh = $(uhtml);
      uh.find(".u-topic")
        .text(e.topic)
        .css({ "background-color": e.bg, color: e.ucol });
      uh.css(
        "background",
        "rgba(" + hexToRgb(e.ucol.replace("#", "")) + ",0.03" + ")"
      );
      uh.find(".u-msg").html(emo(e.msg)).css("color", e.mscol);
  
      uh.find(".ustat").remove();
      if (
        e.co == "--" ||
        e.co == null ||
        e.co == "A1" ||
        e.co == "A2" ||
        e.co == "EU"
      ) {
        uh.find(".co").remove();
      } else {
        uh.find(".co").attr(
          "src",
          "flag/" + (e.co.toLowerCase().replace("il", "ps") || "tn") + ".png"
        ).attr("loading", "lazy"); /* [FIX-C16/P1] تحميل كسول لأعلام القائمة */
      }
          
            if(e.ifedit){
    uh.css("background","url("+e.back+") 0% 0% / 100% 100% rgba(255, 255, 255, 0.05)")
    if(e.atar == " " || e.atar == ""){
      uh.find(".imgbaqer").attr("style","display: none;")
      uh.find(".u-pic").attr("style","background-image:url('" + removegifpic(e.pic) + "');min-width: 52px; width: 52px; min-height: 48px; max-height: 62px; background-repeat: inherit !important; background-color: #f3f3f3; margin-top: 1px;")
      uh.find(".ustat").attr("style","width:4px;min-height:100%;max-height:62px;")
        }else{
      uh.find(".imgbaqer").attr("style","width: 80px; margin: -4px -77px 0px -3px; padding: 40px; height: 80px !important; border: 0px solid #f4f4f4 !important;")
       uh.find(".imgbaqer").css("background-image","url("+e.atar+")");
       uh.find(".u-pic").attr("style","background-image:url('" + removegifpic(e.pic) + "');margin-bottom: 10px; min-width: 60px; min-height: 60px; max-height: 60px; background-size: 100% 100%; margin-left: 7px; margin-right: 0px !important; border-radius: 122px !important; margin-top: 6px !important; height: 62px !important; width: 62px !important;")
       uh.find(".ustat").css("height","80px")
       uh.find(".ustat").css("max-height","80px")
       uh.find(".u-msg").css("margin-left","8px")
    }
  
}

    uh.find(".u-pic").css("background-image",'url("' + removegifpic(e.pic) + '")');
      var ico = getico(e);
      if (ico != "") {
        uh.find(".u-ico").attr("src", ico).attr("loading", "lazy"); /* [FIX-C16/P1] */
      }
      __frag.appendChild(uh[0]); /* [FIX-C16/P1] إلحاق واحد في Fragment بدل append لكل صف */
      } catch (_e) {}
    });
    lonline[0].appendChild(__frag);
  });
}
/* [FIX-C02/P0] كان fixSize ينفّذ مرتين مباشرة عند كل resize (ومنها فتح/غلق
   الكيبورد على الموبايل): مرة فورية + setTimeout(10ms)، وبين كتاباته CSS
   وقراءات متداخلة (Layout Thrashing)، وينتهي بسحب سكرول #d2 للأسفل قسرًا.
   الآن: كل الاستدعاءات في نفس الإطار تُدمج في تمريرة واحدة داخل rAF،
   والتمريرة الثانية (مقابل setTimeout 10ms القديم) صارت إطارًا تاليًا
   لإعادة قراءة المقاسات بعد أول كتابة، وسحب السكرول صار مشروطًا بقرب
   المستخدم من آخر الرسائل (نفس شرط C-03) بدل القفز القسري الدائم. */
var __fixRaf = 0;
function fixSize(again) {
  if (!__fixRaf) {
    __fixRaf = requestAnimationFrame(function () {
      __fixRaf = 0;
      __fixSizeRun();
      /* التمريرة الثانية: إطار تالٍ — يعاد قراءة المقاسات بعد استقرار أول كتابة */
      requestAnimationFrame(function () { __fixSizeRun(1); });
    });
  }
}
function __fixSizeRun(final) {
  var wh = $(window).height();
  $(document.documentElement).css('height', wh - 2 + 'px');
  docss();
  startcss();
  var lonline = $(".lonline");
  if (lonline.length > 0) {
    var lt = lonline.position().top;
    lonline.css('height', wh - lt - 5 + 'px');
  }
  /* كل القراءات مرة واحدة ثم كل الكتابات معًا */
  var dadW = $('.dad').width(),
    dpnlW = $('#dpnl').width(),
    roomH = $('#room').height(),
    d0H = $('#d0').height();
  $("#dpnl")
    .css("left", dadW - (dpnlW + 2) + 'px')
    .css("height", roomH - (d0H + 2) + 'px')
    .css('top', '0px');
  if (final) {
    var d2el = document.getElementById("d2");
    if (d2el && d2el.scrollHeight - d2el.scrollTop - d2el.clientHeight < 120) {
      d2el.scrollTop = d2el.scrollHeight;
    }
  }
}
fixSize();
function startcss() {
  $.each($(".tab-pane"), function (i, e) {
    if ($(e).hasClass("active")) {
      $(e).removeClass("hid");
    } else {
      $(e).addClass("hid");
    }
  });
  $('a[data-toggle="tab"]').on("shown.bs.tab", function (e) {
    $($(e.relatedTarget).attr("href")).addClass("hid");
    $($(e.target).attr("href")).removeClass("hid");
  });
}
function docss() {
  /* [FIX-C02/P0] كل القراءات أولًا ثم كل الكتابات معًا — كانت متداخلة:
   قراءة عرض الأخ ثم كتابة عرض العنصر الحالي ثم قراءة التالي... = Layout
   Thrashing (إجبار تخطيط متزامن مع كل عنصر). نفس النتائج النهائية. */
  var jobs = [];
  $.each($(".filw"), function (i, e) {
    var par = $(e).parent();
    var wd = 0;
    $.each(par.children(), function (ii, child) {
      if (
        $(child).hasClass("filw") ||
        $(child).hasClass("popover") ||
        $(child).css("position") == "absolute"
      ) {
        return;
      }
      wd += $(child).outerWidth(true);
    });
    jobs.push([e, par.width() - wd - 12, 0]);
  });
  $.each($(".filh"), function (i, e) {
    var par = $(e).parent();
    var wd = 0;
    $.each(par.children(), function (ii, child) {
      if ($(child).hasClass("filh") || $(child).css("position") == "absolute") {
        return;
      }
      wd += $(child).outerHeight(true);
    });
    jobs.push([e, par.height() - wd - 1, 1]);
  });
  for (var j = 0; j < jobs.length; j++) {
    if (jobs[j][2]) $(jobs[j][0]).css("height", jobs[j][1] + "px");
    else $(jobs[j][0]).css("width", jobs[j][1] + "px");
  }
}
function pickedemo(e) {
  e = $(e);
  var ei = e.attr("title");
  var par = $(e.attr("eid"));
  par
    .parent()
    .find(".tbox")
    .val($(par).parent().find(".tbox").val() + " ف" + ei);
  par.popover("hide").blur();
}
function roomChanged(isme) {
  $("#users").find(".inroom").removeClass("inroom");
  $("#rooms").find(".inroom").removeClass("inroom");
  if (window.VLIST) { /* [FIX-F07] تصفير علامات الغرفة في القائمة الافتراضية قبل إعادة تعيينها */
    for (var __ri = 0; __ri < C_L_U.length; __ri++) VLIST.markRoom(C_L_U[__ri].id, false);
  }
  var r = R_CASH[M_ROOM];
  $(".bord").removeClass("bord");
  if (r != null) {
    $(".ninr,.rout").show();
    if ($("#room.active").length == 0 && isme == true && !(Date.now() < (window.__SR_QUIET_UNTIL || 0))) { // [ADDED] نفس الشرط: لا تبديل تبويبات عند إعادة الاتصال

      $("[data-target='#room']").trigger("click");
    }
    if (isme == true) {
      $("[data-target='#room']").show();
    }
    $.each(rusers(r.id), function () {
      var __x = U_X[this.id];
      if (__x && __x.addClass) __x.addClass("inroom");
      if (window.VLIST) VLIST.markRoom(this.id, true); /* [FIX-F07] علامة "معي في الغرفة" للقائمة الافتراضية */
    });
    $("#rooms")
      .find(".r" + r.id)
      .addClass("inroom bord");
    $("#rooms")
      .find(".r" + r.id + " .u-topic")
      .css("color", r.color);
      $("#rooms")
      .find(".r" + r.id )
      .css("background-color", r.baccolor);
      $("#rooms")
      .find(".r" + r.id + " .u-msg")
      .css("color", r.colormsgroom);
      $("#rooms")
      .find(".r" + r.id + " .u-pic")
      .css("border", "2px solid " + r.colorpicroom);
    $("#tbox").css("background-color", "");
    var u = U_CASH[M_ID];
    if (u && (r.owner == u.lid || jstp.roomowner == true)) {
      $(".redit").show();
    }
  } else {
    $(".roomtgl").hide();
    if (isme) {
      $("[data-target='#room']").hide();
    }
    if ($("#room.active").length != 0 && isme == true) {
      $("[data-target='#rooms']").trigger("click");
    }
    $(".ninr").hide();
    $(".rout").hide();
    $(".redit").hide();
    $("#tbox").css("background-color", "#AAAAAF");
  }
}
function emopop(eid) {
  var emo = $(eid);
  /* نافذة إيموشن الحائط وريشة المبدعين: بتتفتح على مستوى الصفحة كلها (container:body)
     علشان ما تتقصش بحدود لوحة الحائط، وبحجم متناسق يظهر كامل جوه الشاشة */
  var wallEmo = eid === ".emobc" || eid === ".emofth";
  if (wallEmo && !document.getElementById("emo-pop-css")) {
    $("<style id='emo-pop-css'></style>").text(
      /* نفس مقاس ونمط نافذة إيموشن الغرفة (الافتراضي بتاع .popover)، بس فوق كل الطبقات */
      ".popover.emo-pop{z-index:2147482000;max-width:min(276px,calc(100vw - 16px))}"
    ).appendTo("head");
  }
  emo.popover({
    placement: "top",
    container: wallEmo ? "body" : false,
    viewport: wallEmo ? { selector: "body", padding: 8 } : { selector: "body", padding: 0 },
    template: wallEmo
      ? '<div class="popover emo-pop" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
      : '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>',
    html: true,
    content: function () {
      var emosh = $(
        "<div style='max-width:340px;'    class='break corner'></div>"
      );
      $.each(emos, function (i, e) {
        emosh.append(
          '<img style="margin:2px;" class="emoi hand corner" src="emo/' +
            e.path +
            '" title="' +
            Number(e.type) +
            '" eid="' +
            eid +
            '" onmousedown="pickedemo(this );return false;">'
        );
      });
      return emosh[0].outerHTML;
    },
    title: "",
  });
}
var confirmOnPageExit = function (e) {
  e = e || window.event;
  var message = "هل تريد مغادره الدردشه؟";
  if (e) {
    e.returnValue = message;
  }
  return message;
};
var ia = {};
function ft(e) {
  try { if (e === M_ID) VS_off(); } catch (x) {}
  e === M_ID
    ? ($.each(ic.peeres, function (e, t) {
        for (var o in t) o && fj(o, t[o].it);
      }),
      (ia = {}),
      ie && (ie.getTracks().forEach((e) => e.stop()), (ie = null)))
    : $.each(ic.peeres, function (t, n) {
        for (var o in n) e == o && fj(e, n[o].it);
      });
}

function fmute(e) {
  e.preventDefault(), e.stopPropagation();
  var t = $(this);
  if (t.hasClass("stopmic")) {
    var o = t.parent().parent().parent(),
      n = o.attr("id").replace("prod", "");
    if (n === M_ID || jstp.createroom) {
      fm({ it: Number(o.attr("data")), target: n, type: "hang-up" });
    }
    t.parent().parent().parent().find("#showpf").hide();
  } else if (t.hasClass("sounds")) {
    var name = t.attr("id"),
      namebut = t.text();
    var o = t.parent().parent().parent().find("audio")[0];
    if (namebut == "إيقاف الصوت") {
      t.text("تشغيل الصوت");
      t.parent().parent().parent().find(".ismute").show();
      o.paused || o.pause();
    } else {
      t.text("إيقاف الصوت");
      o.paused && o.play();
      t.parent().parent().parent().find(".ismute").hide();
    }
    t.parent().parent().parent().find("#showpf").hide();
  } else if (t.hasClass("profiles")) {
    var name = t.attr("id"),
      namebut = t.text();
    upro(name);
    t.parent().parent().parent().find("#showpf").hide();
  } else if (t.hasClass("musicplay")) {
    /* [ADDED] مشغل الموسيقى */
    try { if (window.MUSIC_OPEN) MUSIC_OPEN(); } catch (me) {}
    t.parent().parent().parent().find("#showpf").hide();
  }
}
function fmutes(e) {
  e.preventDefault(), e.stopPropagation();
  var t = $(this);
  var o = t.parent(),
    n = o.attr("id").replace("prod", "");
  name = t.find("#name").attr("class");
  var pf = t.find("#showpf");
  if (pf.css("display") == "block") {
    /* [FIX-C40/الجلسة5] القفل = إخفاء فقط. الكود القديم كان يعيد كتابة ستايل
       كل أزرار السحب/الموسيقى في كل المايكات (selectors عامة) مع كل قفل
       وفتح — مع 30 مايك وضغطات سريعة = مسّ DOM و style recalc متكرر */
    pf.hide();
    return;
  }
  if (spsh) {
    spsh.hide();
  }
  /* [FIX-C40/الجلسة5] الكتابة داخل بطاقة المايك المفتوحة نفسها (عنصر واحد
     بدل مسح كل المايكات) — نفس السلوك لأن البطاقة الواحدة هي الظاهرة */
  if (n === M_ID || jstp.createroom) {
    pf.find(".stopmic").css("display", "block");
  } else {
    pf.find(".stopmic").css("display", "none");
  }
  /* [ADDED] زر تشغيل الموسيقى: لصاحب المقعد أو مشرف الغرفة فقط */
  pf.find(".musicplay").css("display", (n === M_ID || jstp.createroom) ? "block" : "none");
  pf.show();
  spsh = pf;
}
var ispasued = false;
function mutedall() {
    if (ispasued) {
  $(".prod").find("audio").each(function() {
      this.play();
  });
          ispasued = false;
      clearInterval(isstopmic);
      $(".ismute").hide();
      $("#muteall").attr("style", "width: 50px; height: 50px; color: black; background-color: mediumseagreen; margin: -30px; position: absolute; left: 31px; top: 32px; border-radius: 0;");
    } else {
      $(".ismute").show();
      $("#muteall").attr("style", "width: 50px; height: 50px; color: #000000; margin: -30px; position: absolute; left: 31px; top: 32px; border-radius: 10%;");
          ispasued = true;
                            $(".prod").find("audio").each(function() {
        this.pause();
                        });
      isstopmic = null;
      /* [FIX-C34/P2] بدل استطلاع كل 2ث يجبر تخطيطاً ويوقف كل الصوت للأبد:
         اعتراض حدثي مرة واحدة — أي audio داخل .prod يحاول التشغيل وهو مكتوم
         يُوقف فورًا. صفر استطلاع، صفر عمل والقائمة مكتومة، نفس السلوك. */
      if (!window.__muteAllHook) {
        window.__muteAllHook = true;
        document.addEventListener(
          "play",
          function (ev) {
            try {
              if (
                ispasued &&
                ev.target &&
                ev.target.tagName == "AUDIO" &&
                ev.target.parentNode &&
                $(ev.target).closest(".prod").length
              ) {
                ev.target.pause();
              }
            } catch (e) {}
          },
          true
        );
      }
    }

}

/* [ADDED] أخذ مقعد: صوت فقط، أو صوت + فيديو لو في facing ("user" أمامية / "environment" خلفية) */
var __seatBusy = false;
function fpTake(e, t, o, facing) {
  if (ie || __seatBusy) return; /* [FIX-S31] ضغطتين على مقعدين أثناء طلب إذن المايك كانت تاخد مقعدين */
  __seatBusy = true;
  var __busyT = setTimeout(function () { __seatBusy = false; }, 60000);
  var cons = { audio: { noiseSuppression: false } };
  if (facing) {
    cons.video = {
      facingMode: { ideal: facing },
      width: { ideal: 640 },
      height: { ideal: 480 },
      frameRate: { ideal: 24, max: 30 },
    };
  }
  navigator.mediaDevices
    .getUserMedia(cons)
    .then(function (n) {
      clearTimeout(__busyT); __seatBusy = false;
      if (ie) { n.getTracks().forEach(function (tr) { tr.stop(); }); return; }
      (ie = n),
        fq(e, true, n),
        socket.emit("SEND_EVENT_EMIT_BROADCASTING", { cmd: "new", it: { t } }),
        (o.ev = true),
        (o.id = M_ID);
      if (facing) {
        o.vid = true;
        try { VS_onStream(n, t, { mine: true, facing: facing, name: (U_CASH[M_ID] && U_CASH[M_ID].topic) || "" }); } catch (x) {}
        /* لو الكاميرا اتفصلت/اتقفلت من الجهاز نوقف البث */
        try {
          var vt = n.getVideoTracks()[0];
          if (vt) vt.addEventListener("ended", function () {
            if (ie === n) fm({ it: Number(t), target: M_ID, type: "hang-up" });
          });
        } catch (x) {}
      }
    })
    .catch(function (err) {
      clearTimeout(__busyT); __seatBusy = false;
      if (facing && err && (err.name == "NotFoundError" || err.name == "OverconstrainedError" || err.name == "NotReadableError")) {
        fs("تعذر فتح الكاميرا — تأكد إن الجهاز فيه كاميرا وإنها مش مستخدمة في تطبيق تاني");
      } else if (facing && err && (err.name == "NotAllowedError" || err.name == "PermissionDeniedError" || err.name == "SecurityError")) {
        fs("لازم تسمح للمتصفح باستخدام الكاميرا والمايك عشان تفتح بث");
      } else {
        fk(err, t, M_ID);
      }
    });
}
function fp() {
  if (isrecorder == false && !ie && !localStream) {
    var e = $(phtml);
    e.find(".evant").off().click(fmutes),
      e.find(".evant i").off().click(fmute),
      e
        .find(".prod")
        .off()
        .click(function () {
          var e = $(this),
            t = e.attr("data"),
            o = ia[t];
          if (o && o.ev) {
            var n = e.find("audio")[0];
            return void n.play();
          }
          if (U_CASH[M_ID].rep < T_LIST.mic) return void alert("عدد الايكات المطلوبة للمايك " + T_LIST.mic);
          if (ie) return;
          /* [ADDED] مقعد بث فيديو: نسأل عن الكاميرا الأول (أمامية/خلفية) */
          if (window.VS_isVideoSeat && VS_isVideoSeat(t)) {
            return void VS_ask(t, function (facing) { fpTake(e, t, o, facing); });
          }
          return void fpTake(e, t, o);
        }),
      $(".broadcasters").html(e);
    $(".broadcasters").css("padding", "2px");
    $(".broadcasters").css("display", "");
        ispasued = false;
  } else {
    alert("الرجاء المحاولة في وقت لاحق");
  }
}
function fq(e, t, o) {
  var n = document.createElement("audio");
  (n.srcObject = o),
    (n.muted = t),
    (n.autoplay = true),
    (n.onpause = function () {
      var t = $(n).parent().find(".evant>#showpf i.sounds")[0];
      $(t).text("إيقاف الصوت"), $(t).text("تشغيل الصوت");
      e.removeClass("is_speaking");
    }),
    (n.onplay = function () {
      var t = $(n).parent().find(".evant>#showpf i.sounds")[0];
      $(t).text("تشغيل الصوت"), $(t).text("إيقاف الصوت");
    }),
    n.addEventListener("ended", () => {
      e.removeClass("is_speaking");
    });
  n.addEventListener("canplaythrough", () => {
    n.play();
  }),
    n.play(),
    $(n).appendTo(e),
    fqVad(e, o, n);
}
/* كشف الكلام: الإضاءة تظهر فقط أثناء الكلام وتتفاعل مع شدة الصوت */
function fqVad(e, stream, n) {
  try {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC || !stream || !stream.getAudioTracks || !stream.getAudioTracks().length) return;
    var ctx = window.__vadCtx || (window.__vadCtx = new AC());
    var src = ctx.createMediaStreamSource(stream);
    var an = ctx.createAnalyser();
    an.fftSize = 512;
    an.smoothingTimeConstant = 0.5;
    src.connect(an);
    var buf = new Uint8Array(an.fftSize), el = e[0], lvl = 0, last = 0, on = false;
    var tm = setInterval(function () {
      if (!n.parentNode || !document.body.contains(n)) {
        clearInterval(tm);
        try { src.disconnect(); } catch (x) {}
        e.removeClass("is_speaking");
        if (el) el.style.removeProperty("--lvl");
        return;
      }
      if (ctx.state === "suspended") ctx.resume().catch(function () {});
      an.getByteTimeDomainData(buf);
      var sum = 0;
      for (var i = 0; i < buf.length; i++) { var d = (buf[i] - 128) / 128; sum += d * d; }
      var rms = Math.sqrt(sum / buf.length);
      var v = Math.min(1, Math.max(0, (rms - 0.015) / 0.16));
      var now = Date.now();
      if (rms > 0.015) last = now;
      lvl = lvl * 0.5 + v * 0.5;
      var speak = now - last < 280;
      if (speak) {
        if (!on) { on = true; e.addClass("is_speaking"); }
        /* [FIX-C33/P1] كتابة --lvl فقط عند تغيّر معنوي (≥0.05) بدل كل 70ms —
           يمنع إعادة حساب تخطيط مستمرة أثناء كلام كل متحدث على كل مقعد */
        if (el && Math.abs(lvl - (el.__lvl == null ? -1 : el.__lvl)) >= 0.05) {
          el.__lvl = lvl;
          el.style.setProperty("--lvl", lvl.toFixed(2));
        }
      } else if (on) {
        on = false; lvl = 0;
        e.removeClass("is_speaking");
        if (el) { el.__lvl = 0; el.style.setProperty("--lvl", "0"); }
      }
    }, 90);
  } catch (x) {}
}
var ib = null;
/* [FIX-S31] تنظيف واجهة مقعد واحد (بدون الاعتماد على وجود peer) */
function __seatClearUI(k) {
  try {
    var d = $(".broadcasters .prod[data='" + k + "']");
    d.children().show(), d.removeClass("is_speaking"), d.find(".ismute").hide(), d.find(".evant").hide(),
      d.find("audio").remove(), d.css("background-image", ""), d.attr("id", "");
    if (ia && ia[k]) { ia[k].id = ""; ia[k].ev = false; ia[k].vid = false; }
    try { VS_offRemote(k); } catch (x) {}
  } catch (x) {}
}
function fx(e) {
  switch (e.cmd) {
    case "new":
      if (e.user) {
        /* [FIX-S31] نفس العضو ما يظهرش على مقعدين: أنظّف أي مقعد تاني عليه نفس العضو */
        try { for (var __k in ia) { if (String(__k) !== String(e.it) && ia[__k] && ia[__k].id === e.user) __seatClearUI(__k); } } catch (x) {}
        (ia[e.it].ev = true), (ia[e.it].id = e.user), (ia[e.it].vid = !!e.vid);
        var t = U_CASH[e.user],
          o = $(".broadcasters .prod[data='" + e.it + "']");
        o.attr("id", "prod" + t.id),
          o.find("#showpf > .sounds").attr("id", t.id),
          o.find("#showpf > .profiles").attr("id", t.id),
          o.children().hide(),
          o.find("#name").text(t.topic.slice(0, 8)),
          o.css("background-image", "url(" + removegifpic(t.pic) + ")"),
          o.find(".evant").show();
        try { VS_mark(); } catch (x) {}
      } else {
        ib = e.it;
        for (var t, n = 0; n < C_L_U.length; n++)
          (t = C_L_U[n]), t.id !== M_ID && t.roomid === M_ROOM && fn(t.id, ib);
      }
      break;
    case "err":
      fs(e.msg);
      break;
    case "seatclear":
      __seatClearUI(e.it);
      break;
    case "seatdeny":
      /* [FIX-S31] السيرفر رفض المقعد (مشغول/مش مسموح): أوقف مايكي المحلي وارجع المقعد لحالته */
      try {
        var __mineS = ie;
        if (__mineS) {
          $(".broadcasters audio").each(function () { if (this.srcObject === __mineS) $(this).remove(); });
          __mineS.getTracks().forEach(function (tr) { tr.stop(); });
          ie = null; istalkromm = false;
          try { VS_off(); } catch (x) {}
        }
        if (ia && ia[e.it]) { ia[e.it].id = e.holder || ""; ia[e.it].ev = !!e.holder; }
        if (e.msg) fs(e.msg);
      } catch (x) {}
      break;
    case "send":
      fo(e.msgString);
      break;
    case "rleave":
      ft(e.user);
      break;
    case "rjoin":
      ie && fn(e.user, ib);
      break;
    case "vreset":
      /* [ADDED] الأدمن غيّر نوع المقاعد: نوقف بثي ونقفل النوافذ، وبعدها "all" بيعيد رسم المقاعد */
      try { VS_off(); } catch (x) {}
      if (ie) {
        ie.getTracks().forEach((tr) => tr.stop());
        ie = null;
        istalkromm = false;
      }
      $.each(ic.peeres, function (a, b) {
        for (var k in b) k && fj(k, b[k].it);
      });
      break;
    case "all":
      /* [FIX-S30] إعادة اتصال وأنا على المايك: لو مقعدي لسه عندي في رد السيرفر لا أمسح الواجهة ولا أستدعي fp()
         (كانت ترفض لأن ie موجود وتطلع "الرجاء المحاولة" وتخفي المايكات). أزامن بس تغييرات المقاعد الأخرى. */
      if (ie && e.data) {
        var __mine = false;
        $.each(e.data, function (k, v) { if (v && v.ev && v.id === M_ID) __mine = true; });
        if (__mine) {
          var __prev = ia || {};
          ia = e.data;
          $.each(e.data, function (k, v) {
            var p = __prev[k] || {};
            if (!v || v.id === M_ID) return;
            try {
              if (v.ev && v.id && p.id !== v.id) fx({ cmd: "new", it: k, user: v.id, vid: v.vid });
              else if (!v.ev && p.ev && p.id) ft(p.id);
            } catch (x) {}
          });
          break;
        }
        ft(M_ID); /* المقعد اتفضّى فعلاً من السيرفر: ننضّف المحلي ثم نرسم عادي */
      }
      try { VS_offRemote(); } catch (x) {}
      $(".broadcasters").html(""),
        fp(),
        (ia = e.data),
        e.data &&
          $.each(e.data, function (o, e) {
            if (e.ev) {
              var t = U_CASH[e.id],
                n = $(".broadcasters .prod[data='" + o + "']");
              n.attr("id", "prod" + t.id),
                n.find("#showpf > .sounds").attr("id", t.id),
                n.find("#showpf > .profiles").attr("id", t.id),
                n.children().hide(),
                n.find("#name").text(t.topic.slice(0, 8)),
                n.css("background-image", "url(" + removegifpic(t.pic) + ")"),
                n.find(".evant").show();
            }
          });
      try { VS_mark(); } catch (x) {}
  }
}
function fo(t) {
  var o = JSON.parse(t);
  switch (o.type) {
    case "video-offer":
      fg(o);
      break;
    case "video-answer":
      fh(o);
      istalkromm = true;
      break;
    case "new-ice-candidate":
      fi(o);
      break;
    case "new-ice-candidates":
      /* [FIX-C35/P2] دفعة مرشحات ICE مجمّعة من السيرفر (25ms) — نفس كفاءة
         التوصيل بجزء من رسائل السوكيت، يسرّع فتح قناة المايك */
      if (o.cands && o.cands.length) {
        for (var icb = 0; icb < o.cands.length; icb++) {
          fi({ type: "new-ice-candidate", it: o.it, target: o.target, candidate: o.cands[icb] });
        }
      }
      break;
    case "hang-up":
      try { VS_off(o.it); } catch (x) {}
      var n = $("#prod" + o.target);
      if (ie && M_ID === o.target) {
        ia[o.it].id === M_ID && ((ia[o.it].id = ""), (ia[o.it].ev = false)),
          ie.getTracks().forEach((e) => e.stop()),
          (istalkromm = false),
          (ie = null);
        n.children().show(),
          n.find(".ismute").hide(),
          n.removeClass("is_speaking"),
          n.find(".evant").hide(),
          n.find("audio").remove(),
          n.css("background-image", ""),
          n.attr("id", "");
      }
      $.each(ic.peeres[o.it], function (e, t) {
        fj(t.socketId, t.it);
      });
  }
}
var ic = {
  peeres: { 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {} },
  get: function (e, t) {
    if (!t || !e) return false;
    var o = this.peeres[t];
    return o[e];
  },
  set: function (e, t) {
    if (!t.it) return false;
    var o = this.peeres[t.it];
    o[e] = t;
  },
  delete: function (e, t) {
    if (!t) return false;
    var o = this.peeres[t];
    delete o[e];
  },
};
async function vb(e, t) {
  var o = new RTCPeerConnection({
     
iceServers: [{
   urls: [ "stun:fr-turn3.xirsys.com" ]
}, {
   username: "tXzcEcDOut6ZNSuKQqTRWklYZwYrMJN0JQK2kly4cJmPews5xLNVT1b3WTleKKByAAAAAGV0k3NtYWhkb3VzaA==",
   credential: "a90a77d6-96ae-11ee-94a6-0242ac120004",
   urls: [
       "turn:fr-turn3.xirsys.com:80?transport=udp",
       "turn:fr-turn3.xirsys.com:3478?transport=udp",
       "turn:fr-turn3.xirsys.com:80?transport=tcp",
       "turn:fr-turn3.xirsys.com:3478?transport=tcp",
       "turns:fr-turn3.xirsys.com:443?transport=tcp",
       "turns:fr-turn3.xirsys.com:5349?transport=tcp"
   ]
},{
        urls: "stun:stun.relay.metered.ca:80",
      },
      {
        urls: "turn:a.relay.metered.ca:80",
        username: "5f025bd8d5e77a4b4de579ef",
        credential: "G2tiPbvwxPK9UliE",
      },
      {
        urls: "turn:a.relay.metered.ca:80?transport=tcp",
        username: "5f025bd8d5e77a4b4de579ef",
        credential: "G2tiPbvwxPK9UliE",
      },
      {
        urls: "turn:a.relay.metered.ca:443",
        username: "5f025bd8d5e77a4b4de579ef",
        credential: "G2tiPbvwxPK9UliE",
      },
      {
        urls: "turn:a.relay.metered.ca:443?transport=tcp",
        username: "5f025bd8d5e77a4b4de579ef",
        credential: "G2tiPbvwxPK9UliE",
      }]
});  
  return (
    (o.socketId = e),
    (o.it = t),
    (o.onicecandidate = fa),
    (o.oniceconnectionstatechange = fb),
    (o.onicegatheringstatechange = fc),
    (o.onsignalingstatechange = fd),
    (o.onnegotiationneeded = fe),
    (o.ontrack = ff),
    ic.set(e, o),
    o
  );
}
function fa(e) {
  e.candidate &&
    fm({
      type: "new-ice-candidate",
      it: Number(e.currentTarget.it),
      target: e.currentTarget.socketId,
      candidate: e.candidate,
    });
}
function fb(e) {
  var t = ic.get(e.currentTarget.socketId, e.currentTarget.it);
  switch (t.iceConnectionState) {
    case "failed":
      t.restartIce();
      break;
    case "closed":
    case "disconnected":
  }
}
function fc(e) {
  ic.get(e.currentTarget.socketId, e.currentTarget.it);
}
function fd(e) {
  var t = ic.get(e.currentTarget.socketId, e.currentTarget.it);
  switch (t.signalingState) {
    case "closed":
      fj(e.currentTarget.socketId, t.it);
  }
}
async function fe(e) {
  try {
    var t = ic.get(e.currentTarget.socketId, e.currentTarget.it);
    const o = await t.createOffer();
    if ("stable" != t.signalingState) return;
    await t.setLocalDescription(o),
      fm({
        it: t.it,
        target: t.socketId,
        type: "video-offer",
        sdp: t.localDescription,
      });
  } catch (e) {
    fl(e);
  }
}
function ff(t) {
  var sid = t.currentTarget.socketId,
    el = $("#prod" + sid),
    stm = t.streams[0],
    ex = el.find("audio")[0];
  /* [ADDED] مسار الفيديو بيجي كـ track تاني على نفس الـ stream: ما نكررش عنصر الصوت */
  if (!ex || ex.srcObject !== stm) fq(el, false, stm);
  if (t.track && t.track.kind == "video") {
    try { VS_onRemote(stm, t.currentTarget.it || el.attr("data"), sid); } catch (x) {}
  }
}
function fm(e) {
  var t = JSON.stringify(e);
  socket.emit("SEND_EVENT_EMIT_BROADCASTING", {cmd: "send", mj: {t}});
}
function fj(t, o) {
  var n = ic.get(t, o),
    s = $("#prod" + t + " audio");
  try { if (o != null) VS_offRemote(o); } catch (x) {}
  if (n) {
    if (
      (ia[o].id == t && ((ia[o].id = ""), (ia[o].ev = false)),
      (n.ontrack = null),
      (n.onnicecandidate = null),
      (n.oniceconnectionstatechange = null),
      (n.onsignalingstatechange = null),
      (n.onicegatheringstatechange = null),
      (n.onnotificationneeded = null),
      n.getTransceivers().forEach((e) => e.stop()),
      s.length && s.parent().attr("data") == o)
    ) {
      s.paused = true;
      var d = $("#prod" + t);
      d.children().show(),
        d.removeClass("is_speaking"),
        d.find(".ismute").hide(),
        d.find(".evant").hide(),
        d.find("audio").remove(),
        d.css("background-image", ""),
        d.attr("id", "");
    }
    n.close(), ic.delete(t, o);
  }
}
var id = {},
  ie = null;
function hangUpCall(e) {
  fj(), fm({ target: e, type: "hang-up" });
}
async function fn(e, t) {
  if (e === M_ID) return void fs("لايمكنك طلب الاتصال مع نفسك");
  var o = ic.get(e, t);
  o || (o = await vb(e, t));
  try {
    ie.getTracks().forEach(
      (id[e] = (e) => o.addTransceiver(e, { streams: [ie] }))
    );
  } catch (o) {
    fk(o, t, e);
  }
}
var timest;
var widthst = 1;
function MOVE_PROGRASE(data) {
  $(".loadstory").show();
  if (data.type.includes("video")) {
    $("#st_v_p").one("loadeddata", function () {
      $(".loadstory").hide();
      $(".st_v")[0].play();
      timest = setInterval(function () {
        framest();
      }, data.time);
    });
  } else {
    $("#st_p_t").one("load", function (e) {
      $(".loadstory").hide();
      timest = setInterval(function () {
        framest();
      }, data.time);
    });
  }
}
function framest() {
  if (widthst >= 100) {
    clearInterval(timest);
        if((storynext+1) == storys.length || storys.length == 1){
    HideStory(true);
        }else{
                NextStory();
        };
  } else {
    widthst++;
    $(".brsy").css("width", widthst + "%");
  }
}
function HideStory(i) {
        if(i){ 
  $("#StoryPanel").fadeOut();
        };
  $('.hearta').removeClass("is-active");
  $(".st_v")[0].pause();
  clearInterval(timest);
  widthst = 1;
  $(".brsy").css("width", "0%");
}
function ShowStoryAt(i) {
  /* [FIX-C29/P3] تُنادى من سمة onclick بفهرس البند — تقرأ الكائن من مصفوفة
     storys الموجودة أصلًا بدل تمرير JSON.stringify كامل داخل السمة */
  if (storys && storys[i] != null) ShowStory(storys[i], i);
}
function ShowStory(data,i) {
        if(typeof i == 'number'){
                storynext = i;
        };
  STORY_DEFALUT = { id: data.id, url: data.url, owner: data.owner };  
  $('.stid'+data.id+' img').css('border-color','gray');
  SEND_EVENT_EMIT("SEND_EVENT_EMIT_VIEW_STORY", { id: Number(data.id) });
  const likes = data["likes"] ? JSON.parse(data["likes"]) : [];
  const findlike = likes.findIndex((x) => x == getuser(M_ID).idreg);
  if(findlike != -1){
          $('.hearta').addClass("is-active");     
  }else{
          $('.hearta').removeClass("is-active");
  };
  if (data.type == "video") {
    $(".st_p").hide();
    $(".st_v").show();
    $(".storyplay,.storymuted").show();
    $(".st_v").attr("src", data.url);
  } else {
    $(".storyplay,.storymuted").hide();
    $(".st_v").hide();
    $(".st_p").show();
    $(".st_p").css("background-image", "url(" + data.url + ")");
    $("#st_p_t").attr("src", data.url);
  }
  $(".st_time").text("منذ " + agoo(new Date(data.date).getTime()));
  $(".st_topic").text(data.topic);
  $(".st_pic").attr("src", removegifpic(data.pic));
  $(".st_pic").css("border-color",( getuser(M_ID).lid == data.owner ? '#6b9cff' :  'gray'));
  
  $("#StoryPanel").fadeIn();
  MOVE_PROGRASE({ type: data.type, time: data.time });
  var u = getuser(M_ID);
  var pw = getpower(u.power);
  if (data.owner == u.lid || pw.delmsg) {
    $(".supstory").show();
    const views = data.views ? JSON.parse(data.views) : [];
    const likes = data.likes ? JSON.parse(data.likes) : [];
    $(".st_view").text(views.length + ": مشاهدة");
    $(".st_likes").text(likes.length + ": إعجاب");
  } else {
    $(".supstory").hide();
    $(".st_view").text("");
    $(".st_likes").text("");
  }
}

function NextStory(){
                 if(storynext < storys.length -1 && storys.length > 1){
                         storynext++;
                         $("#StoryPanel").find(".heart").remove();
                         HideStory(false);
                         ShowStory(storys[storynext],'f')
                 };
}
var storynext = 0;
var roombrb = '3ihxjl18it';

function ShowRooms(){
        var pba = $(".roombrb");
        pba.empty();
        for (var i = 0; i < C_L_R.length; i++) {
                var hh = $("<option></option>");
                hh.attr("value", C_L_R[i].id);
                hh.text(C_L_R[i].topic);
                pba.append(hh);
        }
        /* [ADDED] الاختيار الظاهر هو اللي يتبعت: نختار الغرفة الحالية لو موجودة */
        var want = roombrb;
        if (!pba.find('option[value="' + want + '"]').length && typeof M_ROOM !== 'undefined' && M_ROOM) want = M_ROOM;
        if (pba.find('option[value="' + want + '"]').length) pba.val(want);
        if (pba.val()) roombrb = pba.val();
}
function StartBoot(){
        /* [ADDED] عدد النقاط من خانة النافذة الجديدة بدل prompt */
        var ii = $('#bm-pts').length ? $('#bm-pts').val() : prompt('اكتب عدد نقاط الجولة للفيوز');
        var sel = $('.roombrb').val();
        if (sel) roombrb = sel;
        if(roombrb && Number(ii) > 0){
                SEND_EVENT_EMIT('botbrb', { msg: 'start', l: Math.floor(Number(ii)), room: roombrb });
                if (window.BOTM_CLOSE) BOTM_CLOSE();
        }else if (window.BOTM_ERR){
                BOTM_ERR('تأكد من إدخال عدد نقاط الجولة بشكل صحيح');
        }else{
                alert('تاكد من ادخال عدد نقاط الجولة بشكل صحيح');
        }
}

function StopBoot(){
        $('.bot_1').show();
        $('.bot_2').hide();
        SEND_EVENT_EMIT('botbrb', { msg: 'stop', l: 0,room:roombrb });
        roombrb = '3ihxjl18it';
        if (window.BOTM_STATE) BOTM_STATE(0);
        if (window.BOTM_CLOSE) BOTM_CLOSE();
}

        $(()=>{

$('.roombrb').on('change',function(){
        roombrb = $(this).val();
        console.log($(this).val())
});
         $(".st_privce").click(function () {
                 if(storynext > 0){
                         storynext--;
                         HideStory(false);
                         $("#StoryPanel").find(".heart").remove();
                         ShowStory(storys[storynext],'f')
                 };
         });    
         $(".st_next").click(function () {
                 NextStory();
         });
         $(".storyplay").click(function () {
    if ($(this).hasClass("fa-play")) {
      $(".st_v")[0].pause();
      $(this).removeClass("fa-play");
      $(this).addClass("fa-pause");
    } else {
      $(this).addClass("fa-play");
      $(this).removeClass("fa-pause");
      $(".st_v")[0].play();
    }
  });
  $(".supstory").click(function () {
    SEND_EVENT_EMIT("SEND_EVENT_EMIT_REMOVE_STORY", {
      id: STORY_DEFALUT.id,
      url: STORY_DEFALUT.url,
      id2: STORY_DEFALUT.owner,
    });
  });
  $(".storymuted").click(function () {
    if ($(this).hasClass("fa-volume-up")) {
      $(".st_v").prop("muted", true);
      $(this).removeClass("fa-volume-up");
      $(this).addClass("fa-volume-off");
    } else {
      $(this).addClass("fa-volume-up");
      $(this).removeClass("fa-volume-off");
      $(".st_v").prop("muted", false);
    }
  });
    $(".hearta").on("click", function() {
                if(!$(this).hasClass('is-active')){
    $(this).toggleClass("is-active");
  SEND_EVENT_EMIT("SEND_EVENT_EMIT_VIEW_STORY", { id: Number(STORY_DEFALUT.id),is:true });
                };
  });
        });
function ChangePassword() {
  var ChangePass = prompt("الرجاء إدخال كلمة المرور الجديدة");
  if (ChangePass != null) {
    SEND_EVENT_EMIT("SEND_EVENT_EMIT_CHANGE_PASS", { pass: ChangePass });
  }
}


function addElements(a) {
  var b = document.createElement("div");
  b.classList.add("vieYoutube"),
    (b.style.cssText =
      "z-index: 5;float: left;position: absolute;background-color: white;border: 1px solid black;");
  var c = document.createElement("img");
  (c.style.width = "100%"),
    (c.src = "https://img.youtube.com/vi/" + a + "/0.jpg");
  var d = document.createElement("button");
  (d.innerText = "ارسال الى الحائط"),
    (d.style.width = "50%"),
    (d.style.margin = "2px 0"),
    (d.onclick = function () {
      var c = "https://www.youtube.com/watch?v=" + a;
      $(".tboxbc").val(c), SEND_BC_UP(), b.remove();
    });
  var e = document.createElement("button");
  (e.style.width = "50%"),
    (e.style.margin = "2px 0"),
    (e.innerText = "الغاء"),
    (e.onclick = function () {
      b.remove();
    }),
    b.appendChild(c),
    b.appendChild(e),
    b.appendChild(d);
  var f = document.getElementsByClassName("youtubeSearch")[0];
  f.appendChild(b), $(".youtubeVal").val(""), $(".youtubeLoad").hide();
}
/* ============ [FIX-C31/C32/P0] العزل الثنائي لقايمة المتصلين + معالج دفعات UBUS ============
   الاتجاه 1 (متصلين ← لا يؤثروا على الشات): أي حدث حضور (u+/u^/u-/ur/uB)
   يدخل طابور وقت الخمول (requestIdleCallback) ولا يُعالج تزامنياً — رسائل
   الغرفة/الخاص/المايك/الأغاني تُرسم فوراً مهما وصل من دفعات متصلين.
   الاتجاه 2 (الشات ← لا يؤثر على المتصلين): المعالجة المؤجلة تمريرة واحدة
   على الدفعة + VLIST يجدول رسمة rAF واحدة — لا يلمس DOM الشات إطلاقاً.
   استثناء وحيد: ur الخاص بي (تغيير غرفتي) فوري — يبدّل الموسيقى ويفتح اللوحة. */
var __PQ = [];
var __PQ_T = 0;
function __PQ_push(cmd, data) {
  if (__PQ.length < 600) __PQ.push({ c: cmd, d: data }); /* سقف حماية الطابور */
  if (!__PQ_T) __PQ_Sched();
}
function __PQ_Sched() {
  return window.requestIdleCallback
    ? window.requestIdleCallback(__PQ_run, { timeout: 300 })
    : setTimeout(__PQ_run, 100);
}
function __PQ_run() {
  __PQ_T = 0;
  var q = __PQ;
  __PQ = [];
  /* سقف 120 عنصراً في الدورة: يفسح المجال للرسم والتفاعل حتى مع دفعات ضخمة */
  if (q.length > 120) {
    __PQ = q.slice(120);
    q = q.slice(0, 120);
  }
  for (var i = 0; i < q.length; i++) {
    try { __ON_CORE(q[i].c, q[i].d); } catch (e) {}
  }
  if (__PQ.length && !__PQ_T) __PQ_T = __PQ_Sched();
}
/* ---- معالجات الحضور المستخرجة (تستخدمها الأحداث الفردية ودفعات uB معاً) ---- */
function __UB_del(id) {
  delete U_CASH[id];
  delete U_X[id];
  for (var i = 0; i < C_L_U.length; i++) {
    /* [FIX-C37] إزالة كل الإدخالات المتطابقة لا الأولى فقط — يحصّن من تكرار
       تاريخي (خروج+دخول داخل نافذة دمج واحدة) يراكم نسخاً بنفس المعرف */
    if (C_L_U[i].id == id) {
      C_L_U.splice(i, 1);
      i--;
    }
  }
  if (window.VLIST) VLIST.remove(id); /* [FIX-F07] إزالة من القائمة الافتراضية */
  wclose(id);
  __ubcount();
}
function __UB_add(data) {
  /* [FIX-C37] خروج+دخول خلال نفس نافذة الدمج (400ms) على السيرفر = يصلنا
     «add» بلا «rm» (اندماج UBUS_rm→UBUS_add في الخريطة). العميل عنده النسخة
     القديمة بنفس المعرف لكن بلِlid قديم، فتنظيف lid وحده لا يكفي — بدون هذا
     تتراكم نسخة شبح في C_L_U ويتضخم العدّاد ويتكرر المستخدم في نتائج البحث.
     التنظيف بالمعرف قبل الإضافة يطابق سلوك البث الفوري القديم (u- ثم u+) */
  if (U_CASH[data.id] != null) __UB_del(data.id);
  var ou = getuserbylid(data.lid);
  if (ou != null) {
    __UB_del(ou.id); /* [FIX-C32] بديل آخر مستخدم بنفس الـ lid — تنظيف مباشر بلا طابور */
  }
  U_CASH[data.id] = data;
  C_L_U.push(data);
  /* [FIX-C06/P1] إضافة واحدة تُعلّم orderDirty وتُجدول رسمًا واحدًا */
  if (window.VLIST) {
    VLIST.add(data.id, data);
    /* [FIX-C32] علامة «معي في الغرفة» تُشتق من roomid داخل حمولة الدخول نفسها —
       بدل بث ur عالمي ثانٍ بعد كل دخول (حُذف من السيرفر في FIX-S17) */
    if (data.roomid != null) VLIST.markRoom(data.id, data.roomid == M_ROOM);
  }
  needUpdate = true;
  __ubcount();
}
function __UB_move(e, w) {
  var a = R_CASH[w],
    s = U_CASH[e];
  var __oldRoom = s ? s.roomid : null;
  e == M_ID &&
    ((M_ROOM = w),
    (window.MUSIC_ROOM && MUSIC_ROOM(w)),
    (!a || !a.broadcast) && $(".broadcasters").html(""),
    $(".broadcasters").css("display", "none")),
    null != s &&
      ((s.roomid = w), (needUpdate = true),
      /* [FIX-C21/P2] حركة عضو آخر تمسّ غرفتي فقط: تبديل علامته مباشرة.
         حركتي أنا تبقى بإعادة التعليم الكاملة (تغيّرت مجموعة غرفتي). */
      (window.VLIST && e != M_ID
        ? (__oldRoom == M_ROOM || w == M_ROOM ? VLIST.markRoom(e, w == M_ROOM) : 0)
        : roomChanged(e == M_ID)));
  if (e == M_ID && !(Date.now() < (window.__SR_QUIET_UNTIL || 0))) {
    setTimeout(function () {
      $('button[data-target="#users"]').click();
    }, 600);
  }
}
function __UB_up(data) {
  if (C_L_U == null) {
    return;
  }
  var ou = U_CASH[data.id];
  if (ou == null) {
    /* دلتا لمستخدم غير معروف (فاتنا دخوله أو غادر): نتجاهل بأمان */
    if (window.VLIST ? !VLIST.has(data.id) : U_X[data.id] == null) return;
    ou = U_CASH[data.id];
  }
  var __ot = ou.topic, __op = ou.power, __or = ou.roomid;
  Object.assign(ou, data);
  /* [FIX-C32] انتقال غرفة يصل كدلتا {id, roomid} داخل up (دمج UBUS) —
     نحدّث علامة «معي في الغرفة» مباشرة كما كان يفعل ur */
  if (data.roomid !== undefined && window.VLIST) {
    VLIST.markRoom(data.id, ou.roomid == M_ROOM);
  }
  if (Object.keys(data).length == 1 && data.rep != null) {
    return;
  }
  if (window.VLIST) VLIST.touch(data.id, ou, false); /* [FIX-F07] البيانات + الصف الظاهر فقط */
  else updateu(data.id, ou);
  if (
    __ot != ou.topic ||
    __op != ou.power ||
    __or != ou.roomid
  ) {
    needUpdate = true;
  }
}
/* [FIX-C32/P0] دفعة UBUS من السيرفر: بث واحد كل 400ms بكل أحداث المتصلين
   {add:[], up:[دلتا], rm:[ids], mv:[[id,room],…]} — تمريرة واحدة بالترتيب
   المنطقي (إضافة ← تحديث ← حذف ← انتقال) بدل رسالة معالجة لكل حدث */
function __UB_batch(b) {
  if (!b) return;
  var a = b.add || [], u = b.up || [], r = b.rm || [], m = b.mv || [];
  for (var i = 0; i < a.length; i++) __UB_add(a[i]);
  for (var i2 = 0; i2 < u.length; i2++) __UB_up(u[i2]);
  for (var i3 = 0; i3 < r.length; i3++) __UB_del(r[i3]);
  for (var i4 = 0; i4 < m.length; i4++) __UB_move(m[i4][0], m[i4][1]);
}
function ON_DATE_SEND(cmd, data) {
  /* [FIX-C31/P0] مفكك الأولويات: مسار الشات الساخن فوري دائماً */
  if (
    cmd == "u+" ||
    cmd == "u^" ||
    cmd == "u-" ||
    cmd == "uB" ||
    (cmd == "ur" && (!data || !data.length || data[0] != M_ID))
  ) {
    __PQ_push(cmd, data);
    return;
  }
  __ON_CORE(cmd, data);
}
function __ON_CORE(cmd, data) {
  try {
    switch (cmd) {
      case "youtube":
        addElements(data);
        break;
      case "typing":
        if (M_ID) {
          $(".c-flex.w"+data+" .typ").show();
        }
        break;
                case "brbstate":
                if(data == 0){
                        roombrb = '3ihxjl18it';
                        $('.bot_1').show();
                        $('.bot_2').hide();
                        }else{
                                $('.bot_1').hide();
                                $('.bot_2').show();
                        };
                        if (window.BOTM_STATE) BOTM_STATE(data);
                        break;
      case "showcall":
        handleLogin(data.success, data.id);
        break;
      case "offercall":
        handleOffer(data.offer, data.name);
        break;
      case "answercall":
        handleAnswer(data.answer);
        break;
      case "candidatecall":
        handleCandidate(data.candidate);
        break;
      case "leavecall":
        handleLeave();
        break;
      case "pw":
        pws = data;
        break;
      case "vib":
        window.navigator.vibrate(500, 0, 500);
        break;
      case "stopTyping":
        if (M_ID) {
          $(".c-flex.w"+data+" .typ").hide();
         
        }
        break;
      case "walltop":
        if (window.WALLTOP_RENDER) WALLTOP_RENDER(data);
        break;
      case "walltrend":
        if (window.WALLTREND_RENDER) WALLTREND_RENDER(data);
        break;
      case "feather":
        if (window.FEATHER_RECV) FEATHER_RECV(data);
        break;
      case "xo":
        if (window.XO_RECV) XO_RECV(data);
        break;
      case "music":
        if (window.MUSIC_RECV) MUSIC_RECV(data);
        break;
      case "xotop":
        if (window.XOTOP_RENDER) XOTOP_RENDER(data);
        break;
      case "topbar":
        var ltop = $(".ltop");
        ltop.children().remove();
        var utop = $("#utop").html();
        ltop.children().remove();
        $.each(data, function (i, e) {
          if (e.evaluation > 0) {
            if (i == 0) {
              $(".u-top1").attr("src", removegifpic(e.pic));
              $(".u-top1").css("border", "3px solid rgb(252 186 41)");
              $(".u-topic1").text(window.uhideName ? uhideName(e) : e.topic);
              $(".rankt1").text(e.evaluation);
              $(".u-topic1").css("color", "rgb(252 186 41)");
            } else if (i == 1) {
              $(".u-top2").attr("src", removegifpic(e.pic));
              $(".u-top2").css("border", "3px solid hsl(216deg 25% 80%)");
              $(".rankt2").text(e.evaluation);
              $(".u-topic2").text(window.uhideName ? uhideName(e) : e.topic);
              $(".u-topic2").css("color", "hsl(216deg 25% 80%)");
            } else if (i == 2) {
              $(".u-top3").attr("src", removegifpic(e.pic));
              $(".u-top3").css("border", "3px solid hsl(23deg 84% 70%)");
              $(".u-topic3").css("color", "hsl(23deg 84% 70%)");
              $(".rankt3").text(e.evaluation);
              $(".u-topic3").text(window.uhideName ? uhideName(e) : e.topic);
            } else {
              var uh = $(utop);
              uh.find(".ntop").text(i + 1);
              uh.find(".u-topic").text(window.uhideName ? uhideName(e) : e.topic);
              uh.find(".u-pic").attr("src", removegifpic(e.pic));
              uh.find(".co").text(e.evaluation);
            }
            ltop.append(uh);
          }
        });
        break;
      case "fildel":
        if (M_ID) {
          $("#d2bc").empty();
        }
        break;
      case "dro3":
        dro3 = data;
        break;
      case "sicos":
        sico = data;
        break;
        case "atar":
        atar = data;
        break;
        case "back":
        back = data;
        break;
      case "emos":
        emos = data;
        emopop(".emobox");
        emopop(".emobc");
        emopop(".emox");
        emopop(".emo");
        break;
      case "removede":
        $("#tlogins button").removeAttr("disabled");
        break;
      case "alert":
        alert(data);
        break;
      case "lavedon":
        SEND_EVENT_EMIT("SEND_EVENT_EMIT_LEAVED_ROOM", {});
                isroom = '';
        break;
      case "rjoinad":
        if (M_ID) {
          rjoinAdmin(data.rid, data.pwd);
        }
        break;
     case "storydel":
        if (M_ID) {
          $(".itemstory").find(".str").remove();
        }
        break;
                      case "story-":
        if (M_ID) {
          $(".itemstory")
            .find(".stid" + data)
            .remove();
                        SEND_EVENT_EMIT('SEND_EVENT_EMIT_GET_STORY', {});
          HideStory(true);
        }
        break;
      case "story+":
                SEND_EVENT_EMIT('SEND_EVENT_EMIT_GET_STORY', {});
        break;
      case "story":
          storys = data;
          if($('.itemstory').find('.circle').length > 1){
          $('.itemstory').find('div').slice(1).remove();
          };
        $(".img_str").attr("src", removegifpic(getuser(M_ID).pic));
        $.each(data, function (i, e) {
                              const views = e["views"] ? JSON.parse(e["views"]) : [];
                  const findview = views.findIndex((x) => x == getuser(M_ID).idreg);
          var hr = $(
            '<div class="str circle stid' +
              e.id +
              '">' +
              '<img style="cursor:pointer;min-width: 60px; width: 60px; height: 60px; background-color: rgb(243, 243, 243); background-position-y: 0%;border-radius:50%;border: 2px solid '+(findview != -1 ? 'gray' : '#6b9cff')+';"  class="fitimg u-pic borderg" />' +
              '<div style="font-family: sans-serif;font-size: 10px !important;color: dimgray;">' +
              e.topic +
              "</div>" +
              "</div>"
          );
          hr.attr("onclick", "ShowStoryAt(" + i + ");"); /* [FIX-C29/P3] الفهرس فقط — كان JSON.stringify كامل لكائن الستوري داخل السمة مع كل بند */
          hr.find(".u-pic").attr("src",removegifpic(e.pic));
          $(".itemstory").append(hr);
        });
        break;
      case "ok":
        $(".ovr div")
          .attr("class", "label-success")
          .find("div")
          .text("متصل ..");
        tried = 0;
        setTimeout(function () {
          $(".ovr").remove();
        }, 1500);
        break;
      case "login":
        $("#tlogins button").removeAttr("disabled");
        switch (data.msg) {
          case "ok":
            clearTimeout(seostop); /* [FIX-C16/P1] صار setTimeout متجدّدًا بدل setInterval */
            socket.emit("autocoo",1);
            M_ID = data.id;
            SEND_EVENT_EMIT("SEND_EVENT_EMIT_EKTI", {}); /* [FIX-OPT2] قائمة الاختصارات للتطبيق اللحظي */
            MY_T = data.ttoken;
            if(!data.ifedit){
              $("button.border.label.mini.label-success.hand.fa.fa-edit.fr.prof,.listHome").remove();
          }
            window.VISIT_NOTIF = !!data.visitnotif;
            window.UHIDE = (data.uhide | 0) & 31; /* [ADDED] */
            $(".ispoint").text(" " + abbreviateNumber(data.point || 0));
            $(".spic").attr("src", data.pic);
                        $(".img_str").attr("src", data.pic);
            $(".urluto").val(data.youtube); window.refreshMediaBtn && refreshMediaBtn();
            window.onbeforeunload = confirmOnPageExit;
            $(".dad").css("max-width", "100%");
            $("#tlogins,.lonline").remove();
            $("#d2,.footer,#d0,#room").show();
            fixSize(1);
            updateTimes();
            /* [FIX-C12/P1] كان مستمع سكرول الحائط يُربط من جديد مع كل دخول ناجح
               (وتراكم مع كل إعادة اتصال صامتة — مستمعات متعددة تنفّذ مع كل تمريرة).
               العلم يضمن الربط مرة واحدة فقط؛ العنصر ثابت في الصفحة أصلًا. */
            if (!window.__bcScrollBound) {
              window.__bcScrollBound = true;
              $(".d2bc").on("scroll", () => {
                if ($(".d2bc").scrollTop() == 0) {
                  msgload = false;
                  $("#bcmore").hide();
                } else {
                  msgload = true;
                }
              });
            }
            SEND_EVENT_EMIT("SEND_EVENT_EMIT_GET_STORY", {});
            if (data.uid) {
              $("#chngpass").css("display", "block");
              $(".addstory").show();
            } else {
              $(".addstory").hide();
            }
            break;
          case "noname":
            lstat("warning", "هذا الإسم غير مسجل !");
            break;
          case "badname":
            lstat("warning", "يرجى إختيار أسم آخر");
            break;
          case "usedname":
            lstat("danger", "هذا الإسم مسجل من قبل");
            break;
           case "banduser":
            var banmessage = document.createElement("div");
            banmessage.classList.add("ban-message");
            banmessage.innerHTML = "تم حظرك";
            banmessage.style.minWidth = "130px";
            banmessage.style.maxWidth = "130px";
            banmessage.style.border = "1px solid black";
            banmessage.style.zIndex = "2110";
            banmessage.style.backgroundColor = "#efefef";
            banmessage.style.position = "absolute";
            banmessage.style.top = "30%";
            banmessage.style.marginLeft = "30px";
            banmessage.style.padding = "5px";
            banmessage.style.zIndex = "5001";
            document.body.appendChild(banmessage);
            break;

          case "badpass":
            lstat("warning", "كلمه المرور غير مناسبه");
            break; /* [FIX-C26/P2] كان بلا break فيسقط إلى wrong ويعرض رسالتي خطأ معًا */
          case "wrong":
            lstat("danger", "كلمه المرور غير صحيحه");
            break;
          case "isreg":
            lstat("danger", "تم الوصول الى اقصى حد تسجيل");
            return;
case "vpn":
            var banmessage = document.createElement("div");
            banmessage.classList.add("ban-message");
            banmessage.innerHTML = "تم حظرك";
            banmessage.style.minWidth = "130px";
            banmessage.style.maxWidth = "130px";
            banmessage.style.border = "1px solid black";
            banmessage.style.zIndex = "2110";
            banmessage.style.backgroundColor = "#efefef";
            banmessage.style.position = "absolute";
            banmessage.style.top = "30%";
            banmessage.style.marginLeft = "30px";
            banmessage.style.padding = "5px";
            banmessage.style.zIndex = "5001";
            document.body.appendChild(banmessage);
            break;

          case "register":
            lstat("success", "تم تسجيل العضويه بنجاح !");
            $("#u2").val($("#u3").val());
            $("#pass1").val($("#pass2").val());
            Login_(2);
            break;
        }
        break;
      case "powers":
        if (M_ID) {
          pws = data;
          for (var i = 0; i < pws.length; i++) {
            var pname = pws[i].name;
            if (pname == "") {
              pname = "_";
            }
            pws["'" + pname + "'"] = pws[i];
          }
        }
        var u = U_CASH[M_ID];
        if (u != null) {
          jstp = getpower(u.power || "");
          if (jstp.cp) {
            $(".cp").show();
          } else {
            $(".cp").hide();
          }
                        if (jstp.bootedit) {
            $(".brbbot").css("display", "flex");
          } else {
            $(".brbbot").css("display", "none");
          }
          if (jstp.publicmsg > 0) {
            $(".pmsg").show();
          } else {
            $(".pmsg").hide();
          }
        }
        for (var i = 0; i < C_L_U.length; i++) {
          var e = C_L_U[i];
          __ulzTouch(e.id, e);
        }
        needUpdate = true;
        break;
      case "rops":
        var r = R_CASH[U_CASH[M_ID].roomid];
        r.ops = [];
        $.each(data, function (i, e) {
          r.ops.push(e.lid);
        });
        break;
      case "power":
        if (M_ID) {
          jstp = data;
          
          $.each(C_L_U, function (i, e) {
            if (e.power == jstp.name || e.s != null) {
              __ulzTouch(e.id, e);
            }
          });
        }
        break;
      case "not":
        if (data.user != null && data.force != 1 && nonot == true) {
          SEND_EVENT_EMIT("SEND_EVENT_EMIT_NO_NOTIFICATION", { id: data.user });
          return;
        }
        var not = $($("#not").html()).first();
        var user = U_CASH[data.user];
        if (data.topic == "مراقبة") {
          not.find(".corner.border.label.label-primary").text("مراقبة");
        } else if (data.topic == "ممنوعة") {
          not.find(".corner.border.label.label-primary").text("ممنوعة");
        } else if (data.topic == "إعجاب") {
            not.find(".corner.border.label.label-primary").remove();                          
        } else {
          not.find(".corner.border.label.label-primary").text("تنبيه");
        }
        if (user != null) {
          if (ismuted(user)) {
            return;
          }
          var uh = $(
            '<div class="fl borderg corner uzr d-flex" style="width:100%;padding:2px;"></div>'
          );
          var uhn = $(
            '<div class="notification"><p class="notification__title label-primary" style="color:#fff"></p></div>'
          );
          uhn.append(
            '<div class="notification__sender"><img src="' +
              user.pic +
              '" width="24" height="24" class="notification__sender__avatar">' +
              '<p class="notification__sender__name"><span class="username">' +
              '<img class="username__icon fl u-ico" alt="" style="max-height: 16px">' +
              '<span class="u-topic">' +
              user.topic +
              "</span></span></p></div>" +
              '<div class="notification__message"><span>' +
              emo(data.msg) +
              "</span></div>" +
              '<span class="notification__time fr tago"></span></div>'
          );
          uh.append(
            "<img src='" +
              user.pic +
              "' style='width: 36px;height:36px;background-size:cover;background-position:center;' class='fl'>"
          );
          uh.append(
            "<img class='u-ico fl ' style='max-height:18px;margin:auto auto;' > <div   style='max-width: 80%;height: 21px;margin: auto;' class='dots nosel u-topic fl flex-grow-1'>" +
              user.topic +
              '<span class="fr" style="color:grey;font-size:80%!important;margin:auto auto;">' +
              user.idreg +
              "</span>" +
              "</div>"
          );
          uhn.find(".notification__title").text(not.find(".corner.border.label.label-primary").text());
          uhn.find(".tago").text(agoo(new Date().getTime()));
          if ($("#wetchprofilenotifi .nt-list .notification").length > 50) {
            $("#wetchprofilenotifi .nt-list .notification").last().remove();
          }
          uhn
            .find(".u-topic")
            .css({ "background-color": user.bg, color: user.ucol });
          if (window.uhideTag) { uhideTag(uhn, user.id, true); } /* [ADDED] */
          var ico = getico(user);
          if (ico != "") {
            uh.find(".u-ico").attr("src", ico);
            uhn.find(".u-ico").attr("src", ico);
          }
          not.append(uh);
          /* كل الإشعارات الواصلة للمستخدم بتتجمع في لوحة الإشعارات (الأحدث فوق) */
          if (data.msg.includes('هذا المستخدم قد زار بروفايلك')) {
            uhn.find(".notification__title").text("زيارة بروفايل");
          }
          $("#wetchprofilenotifi .nt-list").prepend(uhn);
          if (window.ntBump) ntBump();
        }
        not.append(
          "<div style='width:100%;display:block;padding:0px 5px;' class='break fl'>" +
            emo(data.msg) +
            "</div>"
        );
        not.css("margin-left", "+=" + notpos);
        notpos += 2;
        if (notpos >= 6) {
          notpos = 0;
        }
        if(isprofile && data['msg'].includes('هذا المستخدم قد زار بروفايلك')){
                  return
          };
        /* [FIX-PERF] الإشعارات العائمة كانت تبقى في DOM للأبد (تُحذف فقط بالنقر عليها)
           → كانت أحد أسباب تراكم DOM والتهنيج. الآن: تختفي تلقائياً بعد 8 ثوانٍ + حد أقصى 4 إشعارات */
        not.addClass("flnot");
        var oldNots = $(".dad > .flnot");
        if (oldNots.length >= 4) {
          oldNots.slice(0, oldNots.length - 3).remove();
        }
        $(".dad").append(not);
        setTimeout(function () {
          not.fadeOut(400, function () { $(this).remove(); });
        }, 8000);
        break;
      case "delbc":
        if (M_ID) {
          $(".bid" + data.bid).remove();
        }
        break;
      case "delpm":
        if (M_ID) {
          $(".pmid" + data.pi).remove();
          $("#c" + data.pm)
            .find(".u-msg")
            .text("");
          $("#c" + data.owner)
            .find(".u-msg")
            .text("");
        }
        break;
      case "bclist":
        if (M_ID) {
          /* [FIX-C18/P1] كان كل منشور من الستين يُبنى ويُدرج prepend منفردًا
             عبر AddMsg (60 إدخالًا متتاليًا = 60 إبطال تخطيط + 60 جولة jQuery
             تُحظر الخيط الرئيسي لحظة الدخول، وتحويل روابط كل منشور تزامنيًا).
             الآن — كما أوصى التقرير تمامًا:
             1) بناء كل منشور كاملًا بلا إدراج (AddMsg بوضع الدفعة)
             2) تجميعها في DocumentFragment بترتيب معكوس = نفس نتيجة الـprepend
                المتتابعة حرفيًا (الأحدث في الأعلى)، سواء الحائط فاضيًا أو فيه
                منشورات سابقة (سباق bc نادر)
             3) إدراج واحد فقط في DOM
             4) القصّ عند 100 ورجوع أعلى الحائط مرة واحدة (rAF)
             5) تأجيل تحويل الروابط إلى أوقات الخمول (requestIdleCallback)
             — نفس DOM النهائي ونفس الترتيب، بلا أي تغيير في السلوك */
          if (data && data.length) {
            var __bcNodes = [];
            var __bcFrag = document.createDocumentFragment();
            $.each(data, function (i, e) {
              var __m = AddMsg(".d2bc", e, true);
              /* [FIX-PERF] حفظ بيانات المنشور + تطبيق عدد اللايكات/التعليقات مباشرة
                 (يغني عن حدثي bc و bc^ المنفصلين لكل منشور عند الدخول) —
                 والآن على العنصر المُبنى نفسه (استعلام محصور) بدل مسح المستند
                 كله مرتين لكل منشور (كان ×60) */
              allcooment[e.bid] = e;
              try {
                var bl_islike = e.likes ? JSON.parse(e.likes) : [];
                var bl_isbcc = e.bcc ? JSON.parse(e.bcc) : [];
                var bl_ee = e.bid != null ? __m.find(".blike") : $();
                var bl_dd = e.bid != null ? __m.find(".breply") : $();
                if (bl_ee.length > 0) {
                  if (bl_islike.length > 0) {
                    bl_ee.text(bl_islike.length);
                  }
                  if (bl_dd.length > 0 && bl_isbcc.length > 0) {
                    bl_dd.text(bl_isbcc.length);
                  }
                }
              } catch (bl_ex) {}
              if (__m && __m[0]) {
                __bcNodes.push(__m[0]);
              }
            });
            /* ترتيب معكوس داخل الـFragment = نتيجة الـprepend المتتابعة بالضبط */
            for (var __bi = __bcNodes.length - 1; __bi >= 0; __bi--) {
              __bcFrag.appendChild(__bcNodes[__bi]);
            }
            var __bcWall = $(".d2bc");
            var __bcEl = __bcWall[0];
            if (__bcEl) {
              if (__bcEl.firstChild) {
                __bcEl.insertBefore(__bcFrag, __bcEl.firstChild);
              } else {
                __bcEl.appendChild(__bcFrag);
              }
              if (!msgload) {
                var __bcKids = __bcWall.children(".mm");
                while (__bcKids.length > 100) { /* سقف 100 مطابق للأصل (كان >= يقصّ إلى 99) */
                  __bcKids.last().remove();
                  __bcKids = __bcWall.children(".mm");
                }
                /* [FIX-C15/P1] رجوع أعلى الحائط مرة واحدة للدفعة كلها (rAF) */
                if (!__bcEl.__bcTopPend) {
                  __bcEl.__bcTopPend = 1;
                  (window.requestAnimationFrame || setTimeout)(function () {
                    __bcEl.__bcTopPend = 0;
                    __bcWall.scrollTop(0);
                  });
                }
              }
              /* [FIX-C18/P1] تحويل روابط المنشورات مؤجلًا إلى أوقات الخمول —
                 بعد القصّ، فلا يُنفق وقت على منشورات حُذفت من DOM */
              __bcQueueLinks(__bcNodes);
            }
          }
        }
        break;
      case "bc^":
        if (M_ID) {
          var islike = data.likes ? JSON.parse(data.likes) : [];
          var isbcc = data.bcc ? JSON.parse(data.bcc) : [];
          var ee = $(".bid" + data.bid + " .blike");
          var dd = $(".bid" + data.bid + " .breply");
          if (ee.length > 0) {
            if (islike.length > 0) {
              ee.text(islike.length);
            }
            if (dd.length > 0) {
              if (isbcc.length > 0) {
                dd.text(isbcc.length);
              }
            }
          }
        }
        break;
        case "roms^":
          if (M_ID) {
            var islike = data.likes ? JSON.parse(data.likes) : [];
            var ee = $(".bid" + data.bid + " .blike");
            if (ee.length > 0) {
              if (islike.length > 0) {
                ee.text(islike.length);
              }
            }
          }
          break;
      case "bcco":
        if (M_ID) {
          allcooment[data.bid] = data.allcooment;
          var b = $(".bid" + data.bcc.bid + "  .bccos");
          var isbcc = data.bc ? JSON.parse(data.bc) : [];
          var islike = data.bc ? JSON.parse(data.bc) : [];
          var dd = $(".bid" + data.bcc.bid + " .breply");
          var ee = $(".bid" + data.bcc.bid + " .blike");
       
          var exe = $("."+data.bid);
                    $('<div class="comentmsg fl" style="background: white ; box-shadow: 1px 2px 4px;border: 1px solid;width: 100%;padding: 2px;margin-bottom: -1px;"><span style="margin-top:2px;padding:0px 2px;margin-left:-20px;margin-right:4px;color:grey" class="fr minix tago" ago="'+data.bcc.time+'">الان</span><div class="fr" style="width: 87%;" ><span class="fr" style="width: 100%;">' + data.bcc.topic + '</span><span class="fr" style="color: #7e7c7c;width: 100%">' + emo(data.bcc.msg) + '</span></div><img  src="' + data.bcc.pic + '" style="width: 30px;"></div>').appendTo(exe);
              
          if (dd.length > 0) {
            if (isbcc.length > 0) {
              dd.text(isbcc.length);
            }
          }
          if (ee.length > 0) {
            if (islike.length > 0) {
              dd.text(islike.length);
            }
          }
        }
        break;
      case "bc":
        if (M_ID) {
          allcooment[data.bid] = data;
          AddMsg(".d2bc", data);
          /* [FIX-C19/P2] كانت تستدعي updateTimes() كاملة تزامنيًا مع كل منشور
             (تفحص كل .tago في الصفحة) — نص «الآن» للمنشور الجديد يأتي من AddMsg
             نفسه، فالتحديث المجدول عبر rAF يكفي ويُدمج مع منشورات متتالية */
          if (!window.__bcTimesT) {
            window.__bcTimesT = (window.requestAnimationFrame || setTimeout)(function () {
              window.__bcTimesT = 0;
              updateTimes();
            });
          }

          if (msgload) {
            $("#bcmore").show();
          }
          if (data.numb == 1) {
            if (
              $(".dpnl").is(":visible") == false ||
              !$("#wall").hasClass("active")
            ) {
              bcc++;
              $("#bwall").text(bcc).parent().css("color", "orange");
            }
          }
        }
        break;
      case "ops":
        var ops = $("#ops");
        ops.children().remove();
        $.each(data, function (i, e) {
          var uh = $($("#uhead").html()).css("background-color", "white");
          uh.find(".u-pic")
            .css("width", "24px")
            .css("height", "24px")
            .css("background-image", 'url("' + removegifpic(e.pic) + '")');
          uh.find(".u-topic").html(e.topic);
          uh.find(".filw").removeClass("filw").css("width", "80%");
          uh.append(
            "<a onclick=\"SEND_EVENT_EMIT('op-',{lid: '" +
              e.lid +
              '\'});" class="fa fa-times">إزاله</a>'
          );
          ops.append(uh);
        });
        break;
      case "pmf":
        if (M_ID) {
          SEND_EVENT_EMIT("SEND_EVENT_EMIT_PM", {
            msg: "",
            link: data.file,
            id: data.id,
          });
        }
        break;
      case "pm":
        if (M_ID) {
          if (ismuted(U_CASH[data.uid])) {
            return;
          }
          if (
            data.force != 1 &&
            nopm == true &&
            $("#c" + data.pm).length == 0
          ) {
            SEND_EVENT_EMIT("SEND_EVENT_EMIT_NO_PM", { id: data.uid });
            return;
          }
          openw(data.pm, false);
          AddMsg("#d2" + data.pm, data);

          /* [FIX-C11/P1] كانت تبحث $("#c"+pm) خمس مرات متتالية وتنقل الصف
             لأعلى القائمة في كل رسالة حتى لو كان في موضعه أصلًا — الآن: مرجع
             واحد يُعاد استخدامه، والنقل يحدث فقط لو لم يكن الصف على القمة */
          var __cw = $("#c" + data.pm);
          if (__cw.length) {
            if (
              (data.msg.includes("gif") ||
                data.msg.includes("jpg") ||
                data.msg.includes("jpeg") ||
                data.msg.includes("tiff") ||
                data.msg.includes("tif") ||
                data.msg.includes("png") ||
                data.msg.includes("webp") ||
                data.msg.includes("bmp") ||
                data.msg.includes("svg")) &&
              data.msg.includes("emo/") == false
            ) {
              __cw
                .find(".u-msg")
                .html($("<div><i class='fa fa-picture-o'></i> صورة</div>"));
            } else if (data.msg.includes("wav")) {
              __cw
                .find(".u-msg")
                .html(
                  $("<div><i class='fa fa-microphone  '></i> تسجيل صوتي</div>")
                );
            } else if (
              data.msg.includes("mov") ||
              data.msg.includes("mp4") ||
              data.msg.includes("webm") ||
              data.msg.includes("3gpp")
            ) {
              __cw
                .find(".u-msg")
                .html(
                  $("<div><i class='fa fa-file-audio-o'></i> مقطع فيديو</div>")
                );
            } else if (
              data.msg.includes("x-wav") ||
              data.msg.includes("acc") ||
              data.msg.includes("m4a") ||
              data.msg.includes("mpeg") ||
              data.msg.includes("mp3") ||
              data.msg.includes("midi")
            ) {
              __cw
                .find(".u-msg")
                .html(
                  $("<div><i class='fa fa-file-video-o'></i> مقطع صوت</div>")
                );
            } else {
              __cw
                .find(".u-msg")
                .text(gettext($("<div>" + data.msg + "</div>")));
            }
            var __chatsh = $("#chats .chatsh");
            if (__chatsh.length) {
              var __top = __chatsh.next();
              if (!__top.length || __top[0] !== __cw[0]) {
                __cw.insertAfter(__chatsh);
              }
            } else {
              __cw.insertAfter("#chats .chatsh");
            }
          }
        }
        break;
      case "ppmsg":
        if (M_ID) {
          if (jstp.publicmsg == 0 && data.class == "ppmsgc") {
            return;
          }
          var e = AddMsg("#d2", data);
          e.find(".u-msg").append(
            '<label style="margin-top:2px;color:blue" class="fl nosel fa fa-bullhorn">' +
              (data.class != "ppmsgc" ? "إعلان" : "إعلان سوبر") +
              "</label>"
          );
        }
        break;
      case "lvel":
        if (M_ID) {
          data.class = "pmsgc";
          var e = AddMsg("#d2", data);
          e.find(".u-msg").append(
            '<label style="margin-top:2px;color:blue" class="fl nosel fa fa-star">ترقة</label>'
          );
        }
        new Audio("/imgs/win.mp3").play();
        break;
      case "infosite":
        if (M_ID) {
          T_LIST = data;
        }
        break;
      case "mutedbc":
        if (data.ism == true) {
          $(".tboxbc").css("background-color", "#AAAAAF");
        } else {
          $(".tboxbc").css("background-color", "#FFFFFF");
        }
        break;
      case "muted":
        if (M_ID) {
          muteit(U_CASH[data.uid]);
          if (data.ism == true) {
            $("#tbox").css("background-color", "#AAAAAF");
          } else {
            $("#tbox").css("background-color", "#FFFFFF");
          }
        }
        break;
      case "msg":
        if (M_ID) {
          var u = U_CASH[data.uid || ""];
          if (u != null && ismuted(u)) {
            return;
          }
          if (__optConfirm(data)) {
            AddMsg("#d2", data);
          }
        }
        break; /* [FIX-C26/P2] كان يسقط إلى visitnotif قبل الدخول — رسالة msg تُعالج كإعداد إشعار زيارة */
      case "ekti":
        /* [FIX-OPT2] قائمة الاختصارات (تُستبدل كاملة عند كل تحديث) */
        window.__EKTI = data && data.a && data.b ? { a: data.a, b: data.b, n: Number(data.n), l: Number(data.l) } : null;
        break;
      case "visitnotif":
        window.VISIT_NOTIF = !!(data && data.on);
        if (window.visitNotifPaint) { window.visitNotifPaint(); }
        break;
      case "uhide":
        window.UHIDE = ((data && data.mask) | 0) & 31;
        if (window.uhidePaint) { window.uhidePaint(); }
        break;
      case "delmsg":
        if (M_ID) {
          $(".mi" + data).remove();
        }
        break;
      case "evs":
          console.log(data);
          break;
      /* [FIX-S01] حُذف eval(data) — كان يسمح للسيرفر المخترق (أو أي حقن في البث)
         بتنفيذ كود JavaScript عشوائي عند كل المستخدمين (RCE كامل).
         كل استخدامات السيرفر القديمة استُبدلت بأوامر منظمة آمنة: */
      case "redirect":
        if (M_ID) {
          window.onbeforeunload = null;
          var __href = String(data || "/");
          if (__href.charAt(0) != "/" || /[^\w\-./~]/.test(__href)) __href = "/";
          location.href = __href;
        }
        break;
      case "loginshow":
        /* بيانات منظمة بدل نص JS — الواجهة تُبنى هنا بأمان (.text لا يفسّر HTML) */
        if (M_ID) {
          try {
            var ls = (typeof data == "object" && data) || {};
            var __pic = String(ls.pic || "");
            if (!/^\/[a-zA-Z0-9_\-./?=&]+$/.test(__pic)) __pic = "imgs/2.png";
            var el = $("<div/>", { "class": "loginItms" });
            $("<div/>", { "class": "loginImg" }).css("background-image", 'url("' + __pic + '")').appendTo(el);
            $("<img/>", { "class": "loginLogo", src: "imgs/2.png" }).appendTo(el);
            $("<div/>", { "class": "loginUserName" }).text(String(ls.topic || "")).appendTo(el);
            $("<img/>", { "class": "loginFlog", src: "/flag/" + String(ls.co || "tn") + ".png" }).appendTo(el);
            el.appendTo("body").fadeIn(1000);
            setTimeout(function () {
              el.fadeOut(500, function () { el.remove(); });
            }, 5000);
          } catch (e) {}
        }
        break;
      case "ev":
        /* [FIX-S01] أي بث "ev" متبقٍ يُتجاهل — لا تنفيذ نصي إطلاقاً */
        break;
      case "ulist":
        if (M_ID) {
          C_L_U = data;
          __ubcount();
          $.each(C_L_U, function (i, e) {
            U_CASH[e.id] = e;
          });
          /* [FIX-F07] كان يُنشئ صف DOM لكل متصل فوراً — الآن Virtual Scrolling
             (vlist.js): البيانات في الذاكرة و~40 صف مرئي فقط */
          if (window.VLIST) VLIST.ingest();
        }
        break;
      case "u-":
        if (M_ID) {
          __UB_del(data);
        }
        break;
      case "u+":
        if (M_ID) {
          __UB_add(data);
        }
        break;
      case "uB":
        /* [FIX-C32/P0] دفعة أحداث المتصلين المجمّعة من السيرفر (UBUS) */
        if (M_ID) {
          __UB_batch(data);
        }
        break;
      case "ur":
        if (M_ID) {
          __UB_move(data[0], data[1]);
        }
        break;
        case "seobaqer":
          socket.emit("autocoo",1);
          break;
          case "testseo":
          console.log(data)
          break;
      case "u^":
        if (M_ID) {
          __UB_up(data);
        }
        break; /* [FIX-C32] كان break داخل if فيسقط الحدث إلى r^ قبل الدخول */
      case "r^":
        if (M_ID) {
          if (typeof __roomOptsInvalidate == "function") __roomOptsInvalidate(); /* [FIX-C14/P1] */
          if (data.id == M_ROOM) {
            data.ops = R_CASH[M_ROOM].ops;
          }
          var or = R_CASH[data.id];
          R_CASH[data.id] = data;
          C_L_R = $.grep(C_L_R, function (value) {
            return value.id != data.id;
          });
          if (or.topic != data.topic) {
            needUpdate = true;
          }
          C_L_R.push(data);
          updater(data);
          try { if (data.id == M_ROOM) VS_mark(); } catch (x) {}
          $("#brooms").prop("title", "غرف الدردشه : " + C_L_R.length);
        }
        break;
        case "proplame":
console.log(data);
break;
      case "rlist":
        if (M_ID) {
          if (typeof __roomOptsInvalidate == "function") __roomOptsInvalidate(); /* [FIX-C14/P1] */
          C_L_R = data;
          $.each(C_L_R, function (i, e) {
            R_CASH[e.id] = e;
            addroom(e);
            $("#brooms").prop("title", "غرف الدردشه : " + C_L_R.length);
          });
        }
        break;
      case "r+":
        if (M_ID) {
          if (typeof __roomOptsInvalidate == "function") __roomOptsInvalidate(); /* [FIX-C14/P1] */
          R_CASH[data.id] = data;
          C_L_R.push(data);
          addroom(data);
          $("#brooms").prop("title", "غرف الدردشه : " + C_L_R.length);
        }
        break;
      case "r-":
        if (M_ID) {
          if (typeof __roomOptsInvalidate == "function") __roomOptsInvalidate(); /* [FIX-C14/P1] */
          console.log("d")
          delete R_CASH[data];
          $(".r" + data).remove();
          C_L_R = $.grep(C_L_R, function (value) {
            return value.id != data;
          });
          $("#brooms").prop("title", "غرف الدردشه : " + C_L_R.length);
        }
        break;
        case "donecall":
          hl($('.callstat').text('متصل .!'), 'success');
          break;
      case "calling":
          var u2 = U_CASH[data.caller];
          if (ismuted(U_CASH[data.uid])) {
              return;
          }
          if (nopm == true && $('#c' + data.caller).length == 0) {
              SEND_EVENT_EMIT('nopm', {
                  id: data.caller
              });
              SEND_EVENT_EMIT('calldeny', data);
              hangupu();
          }
          if (local_stream == null && $(".callnot").length == 0 && u2 != null && $('#d2' + data.caller).length > 0) {
              var h = $($('#callnot').html());
              var uh = $($("#uhtml").html());
              uh.find('.u-msg').remove();
              uh.find('.u-topic').html(u2.topic).css({
                  color: u2.ucol,
                  "background-color": u2.bg
              });
              uh.find(".ustat").remove();
              uh.find(".co").remove();
              uh.find('.u-pic').css('background-image', 'url("' + u2.pic + '")').css({
                  width: '24px',
                  height: '24px'
              });
              h.find('.uzer').append(uh);
              h.addClass(u2.id);
              h.addClass('callnot');
              callid = data.caller;
              h.attr('callid', data.roomid);
              h.find('.calldeny').click(function(params) {
                  h.remove();
                  SEND_EVENT_EMIT('calldeny', data);
                  hangupu();
              });
              h.find('.callaccept').click(function(params) {
                  callstat = 1;
                  $(document.body).append(h);
                  Callanswer(data.roomid, data.caller);
                  $(this).hide();
              });
              $('#d2' + data.caller).append(h);
              hl($('.callstat').text(''), 'warning');
              updateu(u2.id);
              openw(data.pm, false);
          } else {
              SEND_EVENT_EMIT('calldeny', data);
          }
          break;
      case "callaccept":
          var h = $('.callnot');
          var u2 = U_CASH[data.caller];
          if (h.attr('callid') == data.roomid && u2 != null & local_stream == null) {} else {
              SEND_EVENT_EMIT('calldeny', data);
          }
          break;
      case "calldeny":
          hangupu();
          if (data.state == 2) {
              hl($('.callstat').text('تم إالغاء المكالمة'), 'danger');
          };
          setTimeout(function() {
              $('.callnot').remove();
              hl($('.callstat').text('..'), 'warning');
          }, 1000);
          break;
      case "callend":
          $('.callnot').remove();
          break;
      
    }
  } catch (ero) {
    console.error(ero.stack);
    if (getUrlParameter("debug") == "1") {
      alert(cmd + "\n" + ero.stack);
    }
  }
}
var notpos = 0;
function gettext(d) {
  $.each(d.find("img"), function (i, e) {
    var alt = $(e).attr("alt");
    if (alt != null) {
      $("<x>" + alt + "</x>").insertAfter($(e));
    }
    $(e).remove();
  });
  return $(d).text();
}
$(function () {
  $('#l1,#l2,#l3').on('click', () => {
      var sotchat = document.createElement("AUDIO");
      sotchat.setAttribute("autoplay", "autoplay");
      sotchat.onended = function () {
          this.play();
      };
      sotchat.onplay = function () {};
      sotchat.src = "m1.mp3";
      sotchat.loop = true; 
      document.body.appendChild(sotchat);
  });
});

function Login_(i) {
  $("#tlogins button").attr("disabled", "true");
  switch (i) {
    case 1:
      SEND_EVENT_EMIT("SEND_EVENT_EMIT_GUST", {
        username: $("#u1").val(),
        refr: getv("refr"),
      });
      setv("u1", encodeURIComponent($("#u1").val()).split("'").join("%27"));
      setv("isl", "no");
      break;
    case 2:
      stealthv = $("#stealth").is(":checked");
      SEND_EVENT_EMIT("SEND_EVENT_EMIT_LOGIN", {
        username: $("#u2").val(),
        stealth: $("#stealth").is(":checked"),
        password: $("#pass1").val(),
        refr: getv("refr"),
      });
      setv("u2", encodeURIComponent($("#u2").val()).split("'").join("%27"));
      setv("p1", encodeURIComponent($("#pass1").val()).split("'").join("%27"));
      setv("isl", "yes");
      break;
    case 3:
      SEND_EVENT_EMIT("SEND_EVENT_EMIT_REGISTER", {
        username: $("#u3").val(),
        password: $("#pass2").val(),
        refr: getv("refr"),
      });
      break;
  }
}
function hl(e, stat) {
  e = $(e);
  var type = "";
  if (e.hasClass("label")) {
    type = "label";
  }
  if (e.hasClass("btn")) {
    type = "btn";
  }
  if (e.hasClass("panel")) {
    type = "panel";
  }
  $(e).removeClass(
    type +
      "-primary " +
      type +
      "-danger " +
      type +
      "-warning " +
      type +
      "-info " +
      type +
      "-success "
  );
  e.addClass(type + "-" + stat);
  return e;
}

function lstat(stat, msg) {
  if (stat == "danger") {
    $(".onl").css("background-color", "#d9534f");
  } else if (stat == "info") {
    $(".onl").css("background-color", "#5bc0de");
  } else if (stat == "warning") {
    $(".onl").css("background-color", "#f0ad4e");
  } else if (stat == "primary") {
    $(".onl").css("background-color", "#5cb85c");
  } else if (stat == "success") {
    $(".onl").css("background-color", "#5cb85c");
  }
  ;
  hl(".loginstat", stat).text(msg);
}
;
function setprofile() {
  var d = {};
  d.topic = $(".stopic").val();
  d.msg = $(".smsg").val();
  d.youtube = $(".urluto").val();
  d.ucol = "#" + $(".scolor").val().split("#").join("");
  d.mcol = "#" + $(".mcolor").val().split("#").join("");
  d.mscol = "#" + $(".mscolor").val().split("#").join("");
  d.bg = "#" + $(".sbg").val().split("#").join("");
  d.copic = "#" + $(".scopic").val().split("#").join("");
  var u = U_CASH[M_ID];
  d.pic = u.pic;
  d.username = u.username;
  setv("uprofile", JSON.stringify(d));
  SEND_EVENT_EMIT("SEND_EVENT_EMIT_PROFILE", d); 
}
function showphoto(src) {
  $("body").append(`
      <div style="width:100%;height:100%;z-index:999999;position: fixed;left: 0px;top: 0px;background-color: rgba(0, 0, 0, 0.6);background-size:contain;background-image:url(` +
          src +
          `);background-repeat: no-repeat;background-position: center;" onclick="$(this).remove();"></div>
  `);
}
/* =====================================================================
   [PERF] قايمة المتصلين: تحميل كسول للأعضاء والصور + تحديث تدريجي
   - الصف بيتعمل كهيكل فاضي، ويتملي (hydrate) لما يقرب من الشاشة بس
   - updateu بيحدّث الجزء اللي اتغيّر بس (cache لكل صف)
   - الترتيب بيتم من البيانات (مش من الـ DOM) وبنحرّك الصفوف اللي اتغيّر مكانها بس
   ===================================================================== */
var __ULZ = (function () {
  var TPL = null,
    TPL_SRC = null,
    obs = null,
    scroller = null,
    box = null,
    scrollTs = 0,
    deferT = 0,
    fbQueue = [],
    fbT = 0;

  (function css() {
    try {
      var s = document.createElement("style");
      s.textContent = ".uzr.lzs{min-height:62px}.usr>.ninr{display:block;float:none;clear:both}";
      (document.head || document.documentElement).appendChild(s);
    } catch (e) {}
  })();

  function tpl() {
    if (!TPL || TPL_SRC !== uhtml) {
      var t = document.createElement("div");
      t.innerHTML = uhtml;
      TPL = t.firstElementChild;
      TPL_SRC = uhtml;
    }
    return TPL;
  }
  function getBox() {
    if (!box || !box.isConnected) {
      box = document.querySelector("#users .usr") || document.getElementById("users");
    }
    return box;
  }
  function hydrate(row) {
    if (row.__hy) return;
    var id = row.__uid;
    var u = U_CASH[id];
    if (u == null || U_X[id] == null) return;
    row.__hy = 1;
    row.__rc = {};
    var kids = tpl().childNodes;
    for (var k = 0; k < kids.length; k++) row.appendChild(kids[k].cloneNode(true));
    row.classList.remove("lzs");
    var imgs = row.getElementsByTagName("img");
    for (var i = 0; i < imgs.length; i++) imgs[i].decoding = "async";
    window.updateu(id, u); /* عن طريق window عشان الـ wrappers (uhide/nfont/cover) تتطبق */
  }
  /* الملء بيتم على دفعات بميزانية زمنية لكل فريم عشان الـ scroll السريع ما يهنجش */
  var pending = new Set(),
    pumpRaf = 0;
  /* أثناء الـ scroll بنملي صف واحد في الفريم (الأقرب لمنتصف الشاشة الأول) عشان الـ fling السريع
     ما يهنجش، ولما الـ scroll يقف بنملي بميزانية 12ms في الفريم */
  var SCROLL_CAP = 1;
  function pump() {
    pumpRaf = 0;
    var scrolling = Date.now() - scrollTs < 200;
    /* قراءة كل المواضع الأول (layout واحد) وبعدين الكتابة: الأقرب لمنتصف الشاشة الأول */
    var vr = scroller.getBoundingClientRect();
    var mid = (vr.top + vr.bottom) / 2;
    var arr = [];
    pending.forEach(function (row) {
      var r = row.getBoundingClientRect();
      arr.push([Math.abs((r.top + r.bottom) / 2 - mid), row]);
    });
    arr.sort(function (a, b) {
      return a[0] - b[0];
    });
    var t0 = performance.now();
    var n = 0;
    for (var i = 0; i < arr.length; i++) {
      if (scrolling ? n >= SCROLL_CAP : performance.now() - t0 > 12) break;
      var row = arr[i][1];
      pending.delete(row);
      if (obs) obs.unobserve(row);
      hydrate(row);
      n++;
    }
    if (pending.size) pumpRaf = requestAnimationFrame(pump);
  }
  function onIntersect(entries) {
    for (var i = 0; i < entries.length; i++) {
      var t = entries[i].target;
      if (entries[i].isIntersecting) pending.add(t);
      else pending.delete(t); /* خرج من النطاق قبل ما يتملي: نرجّعه لحد ما يقرب تاني */
    }
    if (pending.size && !pumpRaf) pumpRaf = requestAnimationFrame(pump);
  }
  function fbRun() {
    fbT = 0;
    var n = 0;
    while (fbQueue.length && n++ < 15) hydrate(fbQueue.shift());
    if (fbQueue.length) fbT = setTimeout(fbRun, 30);
  }
  function init() {
    if (scroller) return;
    scroller = document.getElementById("users");
    if (scroller) {
      scroller.addEventListener(
        "scroll",
        function () {
          scrollTs = Date.now();
        },
        { passive: true }
      );
    }
    if (window.IntersectionObserver && scroller) {
      obs = new IntersectionObserver(onIntersect, {
        root: scroller,
        rootMargin: "600px 0px 600px 0px",
      });
    }
  }
  function observe(row) {
    init();
    if (obs) obs.observe(row);
    else {
      fbQueue.push(row);
      if (!fbT) fbT = setTimeout(fbRun, 30);
    }
  }
  function drop(row) {
    try {
      pending.delete(row);
      if (obs && row) obs.unobserve(row);
    } catch (e) {}
  }
  return {
    tpl: tpl,
    box: getBox,
    observe: observe,
    drop: drop,
    hydrate: hydrate,
    scrolling: function () {
      return Date.now() - scrollTs < 200;
    },
    defer: function (fn) {
      if (deferT) return;
      deferT = setTimeout(function () {
        deferT = 0;
        fn();
      }, 250);
    },
  };
})();

/* عدّاد المتصلين: مرة واحدة كل 150ms بدل ما كل join/leave يعمل grep كامل */
var __ubT = 0;
function __ubcount() {
  if (__ubT) return;
  __ubT = setTimeout(function () {
    __ubT = 0;
    var n = 0;
    for (var i = 0; i < C_L_U.length; i++) if (C_L_U[i].s == null) n++;
    $("#busers").text(n);
  }, 150);
}

function AddUser(id, user, frag) {
  /* [FIX-F07] كان ينشئ صف DOM لكل مستخدم — الآن التسجيل في القائمة الافتراضية
     فقط (vlist.js يرسم ~40 صف مرئي بدل مئات/آلاف) */
  if (U_X[id] || (window.VLIST && VLIST.has(id))) {
    return;
  }
  U_X[id] = { __vl: 1 }; /* علامة وجود المستخدم (توافق الفحوصات القديمة) */
  if (window.VLIST) VLIST.add(id);
}

/* تحديث خفيف (من غير ملء الـ DOM): مفتاح الترتيب + إظهار/إخفاء */
function __ulzLight(id, u) {
  if (window.VLIST) { VLIST.light(id, u); return; }
  var uh = U_X[id];
  if (uh == null) return;
  var row = uh[0];
  var rank = getpower(u.power).rank;
  if (rank !== undefined && row.__v !== rank) {
    row.setAttribute("v", rank);
    row.__v = rank;
  }
  if (getico(u) && !rank && row.__v !== 10) {
    row.setAttribute("v", 10);
    row.__v = 10;
  }
  stealthit(u);
}
/* للحلقات الجماعية: الصف المرئي يتحدّث كامل، والباقي تحديث بيانات */
function __ulzTouch(id, u) {
  if (window.VLIST) { VLIST.touch(id, u, false); return; }
  var uh = U_X[id];
  if (uh == null) return;
  if (uh[0] && uh[0].__hy) updateu(id, u);
  else __ulzLight(id, u);
}

function updateu(id, uuu) {
  var u = uuu || U_CASH[id];
  if (u == null) {
    return;
  }
  var ico = getico(u);
  var stat = "imgs/s" + u.stat + ".png?2";
  if (u.s) {
    stat = "imgs/s4.png?2";
  }
  if (u.id == M_ID) {
    $(".spic").css("background-image", 'url("' + u.pic + '")');
    $(".stopic").val(gettext($("<div>" + u.topic + "</div>")));
    $(".urluto").val(gettext($("<div>" + u.youtube + "</div>"))); window.refreshMediaBtn && refreshMediaBtn();
    $(".smsg").val(gettext($("<div>" + u.msg + "</div>")));
    $(".scolor")
      .val(u.ucol)
      .css("background-color", u.ucol)
      .attr("v", u.ucol || "#000")
      .trigger("change");     
    $(".mcolor")
      .val(u.mcol || "#000")
      .css("background-color", u.mcol || "#000")
      .attr("v", u.mcol || "#000");
      $(".scopic")
      .val(u.copic || "#000")
      .css("background-color", u.copic || "#000")
      .attr("v", u.copic || "#000");
    $(".mscolor")
      .val(u.mscol || "#000")
      .css("background-color", u.mscol || "#000")
      .attr("v", u.mscol || "#000");
    $(".sbg")
      .val(u.bg)
      .css("background-color", u.bg)
      .attr("v", u.bg || "#000");
  }
  if (u.msg == "") {
    u.msg = "..";
  }
  /* [FIX-F07] الصف الآن صف افتراضي مُعاد استخدامه من vlist.js — إن لم يكن مرئياً
     حالياً فلا DOM يُلمس أصلاً (بقية التحديثات بالبيانات فقط عند الحاجة) */
  var uh = window.VLIST ? VLIST.rowOf(id) : U_X[id];
  if (uh != null && uh[0]) {
    var row = uh[0];

  /* مفتاح الترتيب (v) بيتحدّث دايماً حتى لو الصف لسه فاضي */
  var rank = getpower(u.power).rank;
  if (rank !== undefined && row.__v !== rank) {
    row.setAttribute("v", rank);
    row.__v = rank;
  }
  if (ico && !rank && row.__v !== 10) {
    row.setAttribute("v", 10);
    row.__v = 10;
  }

  if (row.__hy) {
    var rc = row.__rc;
    var k;

    k = "" + stat;
    if (rc.stat !== k) {
      rc.stat = k;
      uh.find(".ustat").attr("src", stat);
    }

    k = "" + u.co;
    if (rc.co !== k) {
      rc.co = k;
      if (
        u.co == "--" ||
        u.co == null ||
        u.co == "A1" ||
        u.co == "A2" ||
        u.co == "EU"
      ) {
        uh.find(".co").remove();
      } else {
        uh.find(".co").attr(
          "src",
          "flag/" + (u.co.toLowerCase().replace("il", "ps") || "tn") + ".png"
        );
      }
    }

    k = (u.ifedit ? 1 : 0) + "\u0001" + u.back + "\u0001" + u.atar;
    if (rc.sk !== k) {
      rc.sk = k;
      if(u.ifedit){
        uh.css("background","url("+u.back+") 0% 0% / 100% 100% rgba(255, 255, 255, 0.05)")
        if(u.atar == " " || u.atar == ""){
          uh.find(".imgbaqer").attr("style","display: none;")
          uh.find(".u-pic").attr("style","min-width: 52px; width: 52px; min-height: 48px; max-height: 62px; background-repeat: inherit !important; background-color: #f3f3f3; margin-top: 1px;")
          uh.find(".ustat").attr("style","width:4px;min-height:100%;max-height:62px;")
        }else{
          uh.find(".imgbaqer").attr("style","width: 80px; margin: -4px -77px 0px -3px; padding: 40px; height: 80px !important; border: 0px solid #f4f4f4 !important;")
          uh.find(".imgbaqer").css("background-image","url("+u.atar+")");
          uh.find(".u-pic").attr("style","margin-bottom: 10px; min-width: 60px; min-height: 60px; max-height: 60px; background-size: 100% 100%; margin-left: 7px; margin-right: 0px !important; border-radius: 122px !important; margin-top: 6px !important; height: 62px !important; width: 62px !important;")
          uh.find(".ustat").css("height","80px")
          uh.find(".ustat").css("max-height","80px")
          uh.find(".u-msg").css("margin-left","8px")
        }
      }else{
        uh.find(".ustat").attr("style","width:4px;min-height:100%;max-height:62px;")
      }
      /* الـ style attr اتكتب فوق الـ pic/border — نعيد تطبيقهم */
      delete rc.pic;
      delete rc.copic;
    }

    var mu = ismuted(u) ? 1 : 0;
    if (rc.mu !== mu) {
      rc.mu = mu;
      uh.find(".muted").toggleClass("fa-ban", !!mu);
    }

    k = "" + ico;
    if (rc.ico !== k) {
      rc.ico = k;
      if (ico != "") {
        uh.find(".u-ico").attr("src", ico);
      } else {
        uh.find(".u-ico").removeAttr("src");
      }
    }

    k = "" + u.idreg;
    if (rc.hash !== k) {
      rc.hash = k;
      uh.find(".uhash").text(u.idreg);
    }

    k = u.topic + "\u0001" + u.bg + "\u0001" + u.ucol;
    if (rc.topic !== k) {
      rc.topic = k;
      uh.find(".u-topic")
        .html(u.topic)
        .css({ "background-color": u.bg, color: u.ucol });
    }

    k = u.msg + "\u0001" + u.mscol;
    if (rc.msg !== k) {
      rc.msg = k;
      uh.find(".u-msg").html(emo(u.msg)).css("color", u.mscol);
    }

    k = "" + u.pic;
    if (rc.pic !== k) {
      rc.pic = k;
      uh.find(".u-pic").css(
        "background-image",
        'url("' + removegifpic(u.pic) + '")'
      );
    }

    k = "" + u.copic;
    if (rc.copic !== k) {
      rc.copic = k;
      uh.find(".u-pic").css("border", "2px solid " + u.copic);
    }
  }
  } /* نهاية if (uh != null && uh[0]) — [FIX-F07] نواصل لتحديث نوافذ المحادثة دائماً */

  uh = $("#c" + id);
  if (uh.length) {
    if (ico != "") {
      uh.find(".u-ico").attr("src", ico);
    }
    uh.find(".ustat").attr("src", stat);
    uh.find(".u-topic")
      .html(u.topic)
      .css({ "background-color": u.bg, color: u.ucol });
    uh.find(".u-pic").css(
      "background-image",
      'url("' + removegifpic(u.pic) + '")'
    );
    /* [FIX-C27/P3] رأس نافذة المحادثة نفسها: كان يُحدّث مع كل استدعاء
       updateu لأي عضو حتى والنافذة مخفية — الآن فقط عند كونها ظاهرة
       (openw يحدّثه عند الفتح فلا يتغيّر شيء قابل للملاحظة) */
    var __win = document.querySelector(".w" + id);
    if (__win && __win.style.display !== "none") {
      var uh2 = $(".w" + id).find(".head .uzr");
      uh2.find(".ustat").attr("src", stat);
      if (ico != "") {
        uh2.find(".u-ico").attr("src", ico);
      }
    }
  }
  stealthit(u);
  return;
}
var needUpdate = false;
var lastus = "";
var __usT = 0;
function __usearchRun() {
  /* [FIX-F05] كانت حلقة 600ms تفحص كل المتصلين وتبحث DOM حتى لو ما كتبت شيء.
     الآن: مدخَل حدثي (input) + debounce 200ms + تنفيذ مرة واحدة فقط */
  var sv = $("#usearch").val();
  if (sv != lastus) {
    lastus = sv;
    if (lastus != "") {
      $("#usearch").removeClass("bg");
    } else {
      $("#usearch").addClass("bg");
    }
    var q = lastus.split("ـ").join("").toLowerCase();
    if (window.VLIST) {
      VLIST.filter(q); /* [FIX-F07] فلترة القائمة الافتراضية — بدون لمس DOM لكل مستخدم */
    } else {
      for (var i = 0; i < C_L_U.length; i++) {
        var value = C_L_U[i];
        var x = U_X[value.id];
        if (x == null || !x[0]) continue;
        var hide =
          value.topic.split("ـ").join("").toLowerCase().indexOf(q) == -1 &&
          value.idreg.indexOf(lastus) != 0 &&
          value.idreg.indexOf(lastus) != 1;
        var want = hide ? "none" : "";
        if (x[0].style.display !== want) x[0].style.display = want;
      }
    }
  }
}
function usearch() {
  if (__usT) clearTimeout(__usT);
  __usT = setTimeout(function () {
    __usT = 0;
    __usearchRun();
  }, 200);
}
/* [FIX-F05] ربط حدثي بدل الاستطلاع المستمر */
$(document).on("input", "#usearch", function () {
  usearch();
});

var __ucol = new Intl.Collator();
var __ttc = {},
  __ttn = 0,
  __ttp = null;
/* النص العادي من topic (HTML) — بـ DOMParser عشان مفيش تنفيذ/تحميل صور */
function __ttext(h) {
  h = h == null ? "" : "" + h;
  if (h.indexOf("<") == -1 && h.indexOf("&") == -1) return h;
  var c = __ttc[h];
  if (c !== undefined) return c;
  if (!__ttp) __ttp = new DOMParser();
  c = __ttp.parseFromString(h, "text/html").body.textContent || "";
  if (++__ttn > 5000) {
    __ttc = {};
    __ttn = 0;
  }
  __ttc[h] = c;
  return c;
}
function updateusers() {
  if (needUpdate == false) {
    return;
  }
  if (window.VLIST) {
    /* [FIX-F07] إعادة الترتيب والرسم عبر القائمة الافتراضية:
       ترتيب البيانات في المصفوفة + رسم النطاق المرئي فقط (~40 صف)
       بدل تحريك مئات عقد DOM في الحاوية كل دورة */
    VLIST.resort();
    $.each(
      $.grep(C_L_U, function (e) {
        return e.s != null;
      }),
      function (i, e) {
        stealthit(e);
      }
    );
    return;
  }
  var box = __ULZ.box();
  if (!box) {
    return;
  }
  /* مفيش إعادة ترتيب وقت ما المستخدم بيعمل scroll */
  if (__ULZ.scrolling()) {
    __ULZ.defer(function () {
      needUpdate = true;
      updateusers();
      needUpdate = false;
    });
    return;
  }
  var rows = [];
  /* شريط "المتواجدين في الدردشه" بيتشال مؤقتاً وبيترجّع في المنتصف بعد الترتيب */
  var __bar = document.getElementById("ninrbar");
  if (__bar && __bar.parentNode === box) box.removeChild(__bar);
  var ch = box.children;
  for (var i = 0; i < ch.length; i++) {
    var el = ch[i];
    if (el.__uid === undefined) continue;
    var av = parseInt(el.getAttribute("v") || 0);
    if (el.classList.contains("inroom")) av += 1e5;
    if (el.classList.contains("ninr")) av += 9999;
    var u = U_CASH[el.__uid];
    el.__k = av;
    el.__t = __ttext(u ? u.topic : "");
    rows.push(el);
  }
  rows.sort(function (a, b) {
    if (a.__k == b.__k) {
      return __ucol.compare(a.__t, b.__t);
    }
    return a.__k < b.__k ? 1 : -1;
  });
  /* نحرّك بس الصفوف اللي مكانها اتغيّر (من غير empty/html اللي بتمسح كل حاجة) */
  var cur = box.firstElementChild;
  for (var j = 0; j < rows.length; j++) {
    var r = rows[j];
    if (r === cur) {
      cur = cur.nextElementSibling;
    } else {
      box.insertBefore(r, cur);
    }
  }
  /* الشريط: فوقه اللي معايا في نفس الغرفة، وتحته اللي برا الغرفة */
  if (__bar) {
    var __first = null;
    for (var q = 0; q < rows.length; q++) {
      if (!rows[q].classList.contains("inroom")) {
        __first = rows[q];
        break;
      }
    }
    box.insertBefore(__bar, __first);
  }
  $.each(
    $.grep(C_L_U, function (e) {
      return e.s != null;
    }),
    function (i, e) {
      stealthit(e);
    }
  );
}

function sendpm(d) {
  if (ismuted(U_CASH[d.data.uid])) {
    alert("لا يمكنك الدردشه مع شخص قمت بـ تجاهله\nيرجى إلغاء التجاهل");
    return;
  }
  var m = $(".tbox" + d.data.uid).val();
  $(".tbox" + d.data.uid).val("");
  $(".tbox" + d.data.uid).focus();
  if (m == "%0A" || m == "%0a" || m == "" || m == "\n") {
    return;
  }
  SEND_EVENT_EMIT("SEND_EVENT_EMIT_PM", {
    msg: toEnglishDigits(m),
    id: d.data.uid,
  });
    onlines();
clearTimeout(isbust);
puys();
}
function pmsg() {
  var ht = $("#mnot");
  ht.find(".rsave")
    .show()
    .off()
    .click(function () {
      ht.modal("hide");
      var m = ht.find("textarea").val();
      if (m == "" || m == null) {
        return;
      }
      m = m.split("\n").join(" ");
      if (m == "%0A" || m == "%0a" || m == "" || m == "\n") {
        return;
      }
      if (ht.find(".ispp").is(":checked")) {
        SEND_EVENT_EMIT("SEND_EVENT_EMIT_PPMSG", { msg: m, state: "in" });
      } else {
        SEND_EVENT_EMIT("SEND_EVENT_EMIT_PPMSG", { msg: m, state: "all" });
      }
    });
  ht.modal({ backdrop: "modal", title: "ffff" });
  if (jstp.publicmsg == 0) {
    ht.find(".ispp").attr("disabled", true).prop("checked", false);
  } else {
    ht.find(".ispp").attr("disabled", false).prop("checked", false);
  }
  ht.find("textarea").val("");
}
function clearmscol() {
  $(".mscolor").val("#FFFFFF").css("background-color", "#FFFFFF");
}
/* [FIX-OPT] الإرسال اللحظي (Optimistic UI) لرسائل الغرفة:
   - الرسالة تظهر عند المرسل في نفس اللحظة (بشكلها العادي بلا أي تغميق) ثم تُستبدل بنسخة السيرفر
     عند وصول البث (يُطابَق بمعرّف cid) — بنفس الشكل/الترتيب النهائي.
   - لو السيرفر رفض (إسكات/عدد لايكات/فلتر) → تُحذف الفقاعة (إشعار السيرفر يظهر كالعادة).
   - لو النت مقطوع أو لم يصل رد خلال 8 ثوانٍ → تظهر الفقاعة بحالة «لم تُرسل» مع زر
     «إعادة إرسال» (وحذف). إعادة الإرسال تستخدم نفس cid فالسيرفر يمنع التكرار.
   - لا تغيير في أسماء الأحداث: SEND_EVENT_EMIT_MSG نفسه + حقل اختياري cid + ack. */
var __optPend = {};
var __optDone = [];
var __optCssOn = 0;
function __optCss() {
  if (__optCssOn) return;
  __optCssOn = 1;
  var st = document.createElement("style");
  st.textContent =
    ".mm.opt-failed{background:#fff1f0!important}" +
    ".opt-fail{clear:both;display:block;padding:3px 8px;font-size:12px;color:#c62828;direction:rtl}" +
    ".opt-fail span.opt-act{cursor:pointer;font-weight:bold;text-decoration:underline;margin:0 6px}";
  document.head.appendChild(st);
}
/* [FIX-OPT2] نفس منطق ReplaceEktisar في السيرفر حرفيًا (نفس الـRegExp ونفس الاستبدال
   ونفس عدد التمريرات) — لتظهر الرسالة عند المرسل بصيغتها النهائية من أول لحظة.
   لو القائمة غير متوفرة أو قديمة يظهر النص كما هو ثم يصحّحه بث السيرفر (كما كان). */
function __optEkti(t) {
  var E = window.__EKTI;
  if (!E || !E.a || !E.a.length || !t) return t;
  if (!E.rx) {
    E.rx = [];
    for (var k = 0; k < E.a.length; k++) {
      try {
        E.rx.push(new RegExp("(^| )" + E.a[k] + "( |$|\n)"));
      } catch (e) {
        E.rx.push(null);
      }
    }
  }
  for (var pass = 0; pass < E.n; pass++) {
    var before = t;
    for (var j = 0; j < E.rx.length; j++) {
      if (E.rx[j]) {
        t = t.replace(E.rx[j], " " + E.b[j] + " ");
      }
    }
    if (t === before) break; /* لا تغيّر = التمريرات التالية لن تغيّر شيئًا */
  }
  return t;
}
function __optNewCid() {
  return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
function __optClearBar(p) {
  try { p.el.find(".opt-fail").remove(); } catch (e) {}
}
function __optFail(cid) {
  var p = __optPend[cid];
  if (!p) return;
  clearTimeout(p.t);
  p.failed = true;
  if (!p.el) return;
  p.el.removeClass("opt-pending").addClass("opt-failed");
  __optClearBar(p);
  var bar = $('<div class="opt-fail"></div>');
  bar.append("<i class='fa fa-exclamation-circle'></i> لم تُرسل");
  $('<span class="opt-act">إعادة إرسال</span>').on("click", function () {
    __optRetry(cid);
  }).appendTo(bar);
  $('<span class="opt-act">حذف</span>').on("click", function () {
    __optDrop(cid);
  }).appendTo(bar);
  p.el.append(bar);
}
function __optDrop(cid) {
  var p = __optPend[cid];
  if (!p) return;
  clearTimeout(p.t);
  try { p.el.remove(); } catch (e) {}
  delete __optPend[cid];
}
function __optSettle(cid) {
  /* وصل ack بالنجاح لكن البث لم يصل لنا: أوقف شكل «قيد الإرسال» وانتهِ */
  var p = __optPend[cid];
  if (!p) return;
  clearTimeout(p.t);
  try { p.el.removeClass("opt-pending opt-failed"); __optClearBar(p); } catch (e) {}
  delete __optPend[cid];
}
function __optRetry(cid) {
  var p = __optPend[cid];
  if (!p) return;
  p.failed = false;
  __optClearBar(p);
  p.el.removeClass("opt-failed").addClass("opt-pending");
  __optEmit(cid);
}
function __optEmit(cid) {
  var p = __optPend[cid];
  if (!p) return;
  clearTimeout(p.t);
  /* لا نُرسل أبدًا والاتصال مقطوع: socket.io كان سيخزّنها ويُطلقها لاحقًا فتتكرر */
  if (!socket || !socket.connected) {
    __optFail(cid);
    return;
  }
  p.t = setTimeout(function () { __optFail(cid); }, 8000);
  try {
    socket.emit(
      "SEND_EVENT_EMIT_SERVER",
      { cmd: "SEND_EVENT_EMIT_MSG", data: { msg: p.msg, reply: p.reply, cid: cid } },
      function (res) {
        var q = __optPend[cid];
        if (!q) return;
        if (res && res.ok === 0) {
          __optDrop(cid); /* رفضها السيرفر — إشعاره يظهر للمستخدم */
          return;
        }
        clearTimeout(q.t);
        q.t = setTimeout(function () { __optSettle(cid); }, 3000);
      }
    );
  } catch (e) {
    __optFail(cid);
  }
}
function __optSend(payload) {
  var cid = __optNewCid();
  var el = null;
  try {
    __optCss();
    var me = U_CASH[M_ID];
    if (me) {
      var rp = payload.reply
        ? {
            id: payload.reply.id,
            msg: String(payload.reply.msg || ""),
            topic: String(payload.reply.topic || "").split("<").join("&#x3C;"),
            uid: payload.reply.uid,
          }
        : null;
      el = AddMsg("#d2", {
        uid: M_ID,
        pic: me.pic || "",
        copic: me.copic,
        topic: me.topic,
        ucol: me.ucol,
        bg: me.bg,
        mcol: me.mcol,
        msg: (function () {
          var tx = __optEkti(String(payload.msg));
          if (window.__EKTI && window.__EKTI.l > 0) tx = tx.slice(0, window.__EKTI.l);
          return tx.split("<").join("&#x3C;");
        })(),
        reply: rp,
      });
      if (el) el.addClass("opt-pending").attr("data-cid", cid);
    }
  } catch (e) {
    el = null; /* فشل الرسم اللحظي: نرسل بالطريقة العادية دون فقدان الرسالة */
  }
  if (!el) {
    SEND_EVENT_EMIT("SEND_EVENT_EMIT_MSG", payload);
    return;
  }
  __optPend[cid] = { el: el, msg: payload.msg, reply: payload.reply, t: 0, failed: false };
  __optEmit(cid);
}
/* مطابقة بث السيرفر لرسالتي: تستبدل الفقاعة المؤقتة وتتجاهل أي بث مكرر */
function __optConfirm(data) {
  if (!data || !data.cid) return true;
  if (__optDone.indexOf(data.cid) !== -1) return false;
  var p = __optPend[data.cid];
  if (p) {
    clearTimeout(p.t);
    try { p.el.remove(); } catch (e) {}
    delete __optPend[data.cid];
  }
  __optDone.push(data.cid);
  if (__optDone.length > 60) __optDone.shift();
  return true;
}

function Tsend() {
  var m = $("#tbox").val().split("\n").join("");
  $("#tbox").val("");
  $("#tbox").focus();
  if (m == "%0A" || m == "%0a" || m == "" || m == "\n") {
    return;
  }
  __optSend({
    msg: toEnglishDigits(m),
    reply: R_P_C_M,
  });
  onlines();
clearTimeout(isbust);
puys();
  norpl();
}
function getpower(n) {
  var pname = n;
  if (pname == "") {
    pname = "_";
  }
  if (pws[pname] != null) {
    return pws[pname];
  }
  for (var i = 0; i < pws.length; i++) {
    if (pws[i].name == n) {
      return pws[i];
    }
  }
  var p = JSON.parse(JSON.stringify(pws[0]));
  var pkeys = Object.keys(p);
  for (var i = 0; i < pkeys.length; i++) {
    switch (true) {
      case typeof p[pkeys[i]] == "number":
        p[pkeys[i]] = 0;
        break;
      case typeof p[pkeys[i]] == "string":
        p[pkeys[i]] = "";
        break;
      case typeof p[pkeys[i]] == "boolean":
        p[pkeys[i]] = false;
        break;
    }
  }
  return p;
}
function getico(u) {
  if (u.ico != null && u.ico != "" && u.ico.includes("sico")) {
    return u.ico;
  }
  var ico = "";
  ico = (getpower(u.power) || { ico: "" }).ico;
  if (ico != "") {
    ico = "sico/" + ico;
  }
  if (ico == "" && (u.ico || "") != "" && u.ico.includes("dro3")) {
    ico = u.ico;
  }
  return ico;
}
function stealthit(u) {
  /* [FIX-F07] مع القائمة الافتراضية: تحديث علامة الإخفاء في البيانات — أي صف
     ظاهر للمستخدم المخفي يُستبعد من النطاق المرئي في الرسمة القادمة */
  if (window.VLIST) {
    var power2 = getpower(u.power);
    VLIST.setHidden(u.id, !!(u.s && power2.rank > jstp.rank));
    return;
  }
  if (U_X[u.id] == null) {
    return;
  }
  var power2 = getpower(u.power);
  if (u.s && power2.rank > jstp.rank) {
    U_X[u.id].addClass("hid");
  } else {
    U_X[u.id].removeClass("hid");
  }
}
var uhtml = "*";
var rhtml = "*";
var isroom = "";
function Send_Rjoin(rid) {
  var pwd = "";
  if (R_CASH[rid].needpass) {
    pwd = prompt("كلمه المرور؟", "");
    if (pwd == "") {
      return;
    }
  }
  if(isroom != rid){
  SEND_EVENT_EMIT("SEND_EVENT_EMIT_RJOIN_ROOM", { id: rid, pwd: pwd });
  isroom = rid;
  }
}
function rjoinAdmin(rid, pass) {
  if (R_CASH[rid].needpass) {
    SEND_EVENT_EMIT("SEND_EVENT_EMIT_RJOIN_ROOM", { id: rid, pwd: pass });
  } else {
    Send_Rjoin(rid);
  }
}
var umsg = "*";
/* [FIX-C17+C30/P2] كانت: حلقة MAX_EMO (5) دورات، في كل دورة تُنشئ RegExp
   جديدة وتنفّذ exec ثم replace (واحدة لكل إيموشن فقط!)، والمتغير i عمومي
   بلا var يلوث أي حلقة خارجية متزامنة. الآن: تعبير واحد مُجمّع مسبقًا +
   خريطة أسماء→مسارات مبنية مرة واحدة، مع استبدال جميع الإيموشنات في تمريرة
   واحدة. تحسين سلوكي وحيد: الإيموشن الصحيح بعد رقم غير معرّف كان يُحجب
   سابقًا (الحلقة تعلق على الرقم غير المعروف) — الآن يُعرض كما يجب. */
var __emoRe = null, __emoMap = null, __emoMapN = 0;
function emo(data) {
  if (data == null) return data;
  if (data.indexOf("ف") == -1) return data;
  if (!__emoRe) __emoRe = new RegExp("(^| )ف([0-9]{1,3})( |$|\n)", "g");
  if (!__emoMap || __emoMapN !== emos.length) {
    __emoMap = {};
    for (var q = 0; q < emos.length; q++) __emoMap[emos[q].type] = emos[q].path;
    __emoMapN = emos.length;
  }
  return data.replace(__emoRe, function (m0, sp1, num, sp2) {
    var path = __emoMap[num];
    if (!path) return m0;
    return sp1 + '<img src="emo/' + path + '" alt="ف' + num + '" title="ف' + num + '" class="emoi">' + sp2;
  });
}
setInterval(function () { updateTimes(); }, 30000);
function updateTimes() {
  /* [FIX-PERF] كانت تفحص كل عناصر .tago في الصفحة كاملة (رسائل + إشعارات + نوافذ مخفية متراكمة).
     الآن تقتصر على حاويات المحادثة والحائط المرئية فقط — أسرع بكثير مع DOM كبير */
  var $scope = $("#d2, .d2bc, #dpnl .nt-list").find(".tago");
  if ($scope.length === 0) { return; }
  var now = new Date().getTime();
  $scope.each(function (i, e) {
    var agoAttr = e.getAttribute("ago");
    if (agoAttr == null) {
      e.setAttribute("ago", now);
    } else {
      e.textContent = agoo(parseInt(agoAttr)); /* [FIX-C30/P3] textContent بدل innerHTML — النص لا يحتاج تحليل HTML */
    }
  });
}
function agoo(d) {
  var dd = new Date().getTime() - d;
  var v = Math.abs(dd) / 1e3;
  if (v < 59) {
    /* [FIX-C26/P2] كان تعبيرًا بلا return — الرسائل الأحدث من دقيقة كانت
       تعرض «0د» بدل «الآن» */
    return "الآن";
  }
  v = v / 60;
  if (v < 59) {
    return parseInt(v) + "د";
  }
  v = v / 60;
  if (v < 24) {
    return parseInt(v) + "س";
  }
  v = v / 24;
  if (v < 30) {
    return parseInt(v) + "ي";
  }
  v = v / 30;
  return parseInt(v) + "ش";
}
function ytVidId(url) {
    var p = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/
    return url.match(p) ? [RegExp.$1.split("<").join("&#x3C;").split("'").join("").split('"').join("").split("&").join(""), RegExp.lastMatch] : [];
}

function ytube(lnk, e) {
  $(
    '<iframe width="95%" style="max-width:240px;" height="200" src="' +
      lnk +
      '" frameborder="0" allowfullscreen></iframe>'
  ).insertAfter($(e));
  $(e).remove();
}
function filteredArray(arr, key, value) {
  const newArray = [];
  for (i = 0, l = arr.length; i < l; i++) {
    if (arr[i][key] == value) {
      newArray.push(arr[i]);
    }
  }
  return newArray;
}

function norpl() {
  /* [FIX-C04/P0] كانت تنفّذ fixSize() (تمريرة تخطيط كاملة: docss على كل .filw
     + قراءات) مع كل رسالة مرسلة حتى بدون رد معروض — هذا كان «ثقل زر الإرسال».
   الآن: تنظيف + إعادة الحجم فقط عند وجود رد فعلي (replaymsg يعيد الحجم عند
   فتحه فيظل التناظر محفوظًا). */
  if (R_P_C_M != null) {
    const reply = $(".isreply");
    reply.html("");
    reply.css("display", "none");
    fixSize();
  }
  R_P_C_M = null;
}


function replaymsg(data) {
    R_P_C_M = data;
   const reply = $(".isreply");
    reply.css("display", "block");
    reply.html(
        '<div onclick="norpl()" class="item2 fa fa-close" style="color:#fff;position: absolute;padding: 16px;font-size: 20px !important;background:rgba(220,0,0,0.8)"></div>' +
            '<div class="grid-container">' +
            '<div class="item3">' +
            data.topic +
            "</div>" +
            '<div class="item5" style="text-align:right">' +
            data.msg +
            "</div>" +
            "</div>"
    );
    if (window.uhideTag) { uhideTag(reply, data.uid, true); } /* [ADDED] */
        $('.isreply').show();
    fixSize();
}
var msglist = [];

/* [FIX-C17/P2] تحليل قالب الرسالة مرة واحدة ثم cloneNode — كان $(umsg)
   يُحلّل نص HTML كاملاً مع كل رسالة واردة (في غرف نشطة = عشرات المرات/دقيقة) */
var __umsgTpl = null, __umsgSrc = null;
function __umsgClone() {
  if (__umsgTpl && __umsgSrc === umsg) return $(__umsgTpl.cloneNode(true));
  var d = document.createElement("div");
  d.innerHTML = umsg;
  __umsgTpl = d.firstElementChild;
  __umsgSrc = umsg;
  return $(d.firstElementChild.cloneNode(true));
}

/* [FIX-C18/P1] تحويل روابط المنشور/الرسالة (a.uplink ← أزرار صورة/فيديو/صوت
   أو ملصق مباشر) — مستخرج حرفيًا من داخل AddMsg كي يُستدعى تزامنيًا في
   المسار العادي (نفس سلوك الماضي بلا تغيير) ومؤجلًا على أوقات الخمول في
   مسار دفعة الحائط الأولية (bclist) — نفس الكود ونفس النتيجة النهائية */
function __uplinkify(msg) {
  $.each(msg.find("a.uplink"), function (i, e) {
    var lnk = $(e).attr("href") || "";
    // الملصقات بتظهر كصورة مباشرة من غير زر "عرض الصوره"
    if (/^\/stickers\/s\/\d+\.webp$/i.test(lnk)) {
      $("<img class='stkmsg' src='" + lnk + "'>").insertAfter(e);
      $(e).remove();
      return;
    }
    var mim = mime[lnk.split(".").pop().toLowerCase()] || "";
    if (mim.match(/image/i)) {
      var ob = $("<button class='btn fl fa fa-image'>عرض الصوره</button>");
      ob.insertAfter(e);
      $(e).remove();
      ob.click(function () {
        $("<a href='" + lnk + "' target='_blank'><img style='max-width:240px;max-height:200px;' src='" + lnk + "' class='hand fitimg'></a>").insertAfter(ob);
        ob.remove();
      });
    }
    if (mim.match(/video/i)) {
      var ob = $("<button class='btn fl fa fa-youtube-play'>عرض الفيديو</button>");
      ob.insertAfter(e);
      $(e).remove();
      ob.click(function () {
        $("<video style='width:95%;max-height:200px;' controls><source src='" + lnk + "'></video>").insertAfter(ob);
        ob.remove();
      });
    }
    if (mim.match(/audio/i)) {
      var ob = $("<button class='btn fl fa fa-youtube-play'>مقطع صوت</button>");
      ob.insertAfter(e);
      $(e).remove();
      ob.click(function () {
        $("<audio style='width:100%;' controls><source src='" + lnk + "' type='audio/mpeg'></audio>").insertAfter(ob);
        ob.remove();
      });
    }
  });
}

/* [FIX-C18/P1] طابور مؤجّل لتحويل روابط منشورات تحميل الحائط الأولي عبر
   requestIdleCallback (مع بديل setTimeout للمتصفحات التي لا تدعمه —
   Safari/iOS القديمة وAndroid القديمة)، على شرائح قصيرة محدودة المدة
   حتى لا يُحظر الخيط الرئيسي، ومع سقف timeout يضمن اكتمال التحويل
   حتى لو ظل المتصفح مشغولًا — أزرار الروابط تظهر لحظة اكتمال الشريحة */
var __bcLinkQ = [];
var __bcLinkPend = 0;
function __bcRIC(cb) {
  if (window.requestIdleCallback) {
    return window.requestIdleCallback(cb, { timeout: 1500 });
  }
  return setTimeout(function () {
    cb({ timeRemaining: function () { return 10; }, didTimeout: false });
  }, 60);
}
function __bcQueueLinks(nodes) {
  for (var __qi = 0; __qi < nodes.length; __qi++) {
    __bcLinkQ.push(nodes[__qi]);
  }
  if (!__bcLinkPend) {
    __bcLinkPend = 1;
    __bcRIC(__bcDrainLinks);
  }
}
function __bcDrainLinks(dl) {
  __bcLinkPend = 0;
  var __t0 = (new Date).getTime();
  var __budget = dl && dl.timeRemaining ? Math.max(4, Math.min(dl.timeRemaining(), 12)) : 8;
  while (__bcLinkQ.length) {
    __uplinkify($(__bcLinkQ.shift()));
    if ((new Date).getTime() - __t0 > __budget) {
      __bcLinkPend = 1;
      __bcRIC(__bcDrainLinks); /* أكمل الباقي في دورة خمول تالية */
      return;
    }
  }
}

function AddMsg(wid, data, __bcBatch) {
  var msg = __umsgClone();
  var u = U_CASH[data.uid];
  if (window.uhideTag) { uhideTag(msg, data.uid || data.owner, true); } /* [ADDED] */
  msg.find(".u-pic")
  .css("background-image", 'url("' + removegifpic(data.pic) + '")')
 .css("border", "2px solid " + data.copic)
  .attr("onclick", `upro('${data.uid}');`);
  msg.find(".borderg.fl.fitimg.hand.u-pic")
  .css("border", "2px solid " + data.copic);
   var __now = (new Date).getTime();
   msg.find(".tago").text(agoo(__now)).attr("ago", __now);
  msg.find(".u-topic").html(data.topic).css("color", data.ucol);
  if (data.ucol != "#000000" && data.ucol) {
    msg.css(
      "background",
      "rgba(" + hexToRgb(data.ucol.replace("#", "")) + ",0.03" + ")"
    );
  }
  data.msg = emo(data.msg);
  if (data.reply) {
        msg.css("background", "aliceblue");
        msg.find(".u-rply").css("display", "block");
        msg.find(".u-rply").html(
            '<div class="grid-container" style="margin-left:0px;border-radius:0px;border-left:4px solid cornflowerblue">' +
                '<div class="item3" style="text-align:left">' +
                data.reply.topic +
                "</div>" +
                '<div class="item5" style="text-align:left">' +
                emo(data.reply.msg) +
                "</div>" +
                '<hr style="margin:0;"></div>'
        );
        if (window.uhideTag) { uhideTag(msg.find(".u-rply"), data.reply.uid, true); } /* [ADDED] */
    }
  /* [FIX-C17/P2] تخطي فحص يوتيوب (تحليل نمطي + قراءة RegExp) عندما لا يحتوي
     النص كلمة يوتيوب أصلًا — نفس النتيجة تمامًا */
  var yt = (data.msg.indexOf("youtu") != -1) ? ytVidId(data.msg.replace(/\n/g, "")) : [];
  if (yt.length > 1 && wid != "#d2") {
    data.msg = data.msg.replace(
      yt[1],
      "<button onclick='ytube(\"https://www.youtube.com/embed/" +
        yt[0] +
        "\",this);' style='font-size:40px!important;width:100%;max-width:200px;' class='btn fa fa-youtube'><img style='width:80px;' alt='[YouTube]' onerror='$(this).parent().remove();' src='https://img.youtube.com/vi/" +
        yt[0] +
        "/0.jpg' ></button>"
    );
  }
  if (data.owner == M_ID) {
    const ovj = { pi: data.pi, owner: data.owner, pm: data.pm };
    msg.find(".bdel").attr("onclick", "SEND_EVENT_EMIT('SEND_EVENT_EMIT_PM_DEL',{pi:'" +
    data.pi + "',owner:'" + data.owner + "',pm:'" + data.pm + "'});").show();
}
  if (data.pi != null) {
    msg.addClass("pmid" + data.pi);
  }
  msg.find(".u-msg").html(data.msg).css("color", data.mcol).append(msg.find(".d-flex.fr"));
  if (data.class != null) {
    msg.addClass(data.class);
  }
  msg.addClass("mm");
  if (u != null) {
    var ico = getico(u);
    if (ico != "") {
      msg.find(".u-ico").attr("src", ico);
    }
    msg.find(".u-topic").css({ color: u.ucol, "background-color": u.bg });
  } else {
    msg.find(".u-ico").remove();
    msg
      .find(".u-topic")
      .css({ color: data.ucol || "#000", "background-color": data.bg || "" });
    if (data.ucol != "#000000" && data.ucol) {
      msg.css(
        "background",
        "rgba(" + hexToRgb(data.ucol.replace("#", "")) + ",0.03" + ")"
      );
      msg.find(".u-pic").css({ copic: data.copic });
    }
  }
  var isbc = wid == ".d2bc";
  /* [FIX-C18/P1] وضع الدفعة لتحميل الحائط الأولي (bclist): بناء المنشور كاملًا
     دون إدراج فردي ودون تحويل روابط ودون قصّ/سكرول — كل ذلك يتم مرة واحدة
     بعد إدراج الدفعة في معالج bclist (DocumentFragment + prepend واحدة).
     باقي المسارات (bc المباشر / الرسائل / الخاص) لا تمرر المعامل الثالث
     فتسلك المسار التزامني نفسه كما هي تمامًا */
  var __inBatch = isbc && __bcBatch === true;
  if (data.bid != null) {
    msg.find(".bdel").hide();
    msg.addClass("bid" + data.bid);
    if (jstp.delbc || data.owner == U_CASH[M_ID].lid) {
      msg.find(".bdel").attr("onclick", "SEND_EVENT_EMIT('SEND_EVENT_EMIT_DEL_BC', {bid:'" + data.bid + "'});").show();
    }
    if (T_LIST.likebc) {
    msg.find(".blike").attr("onclick", "SEND_EVENT_EMIT('SEND_EVENT_EMIT_LIKE_BC', {bid:'" + data.bid + "'});").show();
  }
    msg.find(".tago").text("الان");
    msg.find(".tago").attr("ago",data.data);
    if (T_LIST.replaybc) {
      msg.find(".breply").attr("onclick", "cooments('" + data.bid + "')").show();
    }
  }
    if (data.mi != null) {
      msg.addClass("mi" + data.mi);
      if (jstp.delmsg) {
        msg.find(".bdel").attr("onclick", "SEND_EVENT_EMIT('SEND_EVENT_EMIT_DEL_MSG', {mi:'" + data.mi + "',topic:$(this).parent().parent().parent().find('.u-topic').text()});").show();
      }
      if (!data.reply && T_LIST.replay) {
        /* [FIX-C09/P1] ربط واحد فقط — كان onclick مضمّن + jQuery معًا فيُنفّذ
           replaymsg مرتين لكل ضغطة (يفتح الرد مرتين ويهدر عملاً مزدوجًا).
           بيانات الإغلاق أدق من onclick لأنها من الكائن مباشرة. */
        msg.find(".breply")
          .off("click.breply")
          .on("click.breply", function () {
            replaymsg({ topic: data.topic, id: data.mi, msg: data.msg, uid: data.uid || "" });
          })
          .show();
      }
    }        
  if (window._tlApplied !== T_LIST) {
    window._tlApplied = T_LIST;
    if (T_LIST.showyot) {
      $("#wall .youtubeSearch").show();
    } else {
      $("#wall .youtubeSearch").hide();
    }
    if (T_LIST.showtop) {
      $("#wall .top.wall").show();
    } else {
      $("#wall .top.wall").hide();
    }
    if (T_LIST.showsto) {
      $(".itemstory").show();
      $(".progressstory").show();
    } else {
      $(".itemstory").hide();
      $(".progressstory").hide();
    }
  }
  var w = $(wid);
  /* [FIX-C03/P0] قراءة موقع المستخدم قبل تعديل DOM: النزول للأسفل فقط إذا
     كان قريبًا من آخر الرسائل أصلًا أو كانت الرسالة منه — بدل القفز القسري
     الذي كان يقذف قارئ الرسائل القديمة للأسفل مع كل رسالة جديدة */
  var __d2el = w[0];
  var __isMine = (data.uid != null && data.uid == M_ID) || data.owner == M_ID;
  var __nearBottom = true;
  if (__d2el && !__isMine && !isbc) {
    __nearBottom = (__d2el.scrollHeight - __d2el.scrollTop - __d2el.clientHeight) < 80;
  }
  if (__inBatch) {
    /* [FIX-C18/P1] لا إدراج فرديًا: الدفعة كاملة تُدرج prepend واحدة
       عبر DocumentFragment في معالج bclist — نفس الترتيب النهائي */
  } else if (isbc == true) {
    msg.prependTo(w);
  } else {
    msg.appendTo(w);
  }
  /* [FIX-C18/P1] تحويل الروابط: تزامني في المسار العادي (كما كان)،
     ومؤجل عبر طابور أوقات الخمول في مسار الدفعة (انظر __bcQueueLinks) */
  if (!__inBatch) {
    __uplinkify(msg);
  }
    if (__inBatch) {
        /* [FIX-C18/P1] القصّ/رجوع أعلى الحائط مرة واحدة بعد إدراج الدفعة —
           انظر نهاية معالج bclist */
        return msg;
    }
    if (isbc == true) {
                if( !msgload){
        /* [FIX-PERF] children بدل find: فحص الأبناء المباشرين فقط (الرسائل أبناء مباشرون)
           بدل البحث في كل ذرية الحاوية مع كل رسالة جديدة — مع رسائل كثيرة كان يسبب Lag واضح */
        if (w.children(".mm").length >= 100) {
            w.children(".mm")
                .last()
                .remove();
        }
        /* [FIX-C15/P1] كانت هنا قراءة scrollTop إجبارية + كتابة تمرير تُلغى فورًا
           بالسطر التالي + قراءة innerHeight إجبارية — لكل منشور (مع تحميل 60
           منشورًا = ~120 إجبار تخطيط متزامن). الآن: كتابة واحدة مؤجّلة عبر rAF
           (تُدمج إن وردت منشورات متتالية) ونفس السلوك: البقاء في أعلى الحائط. */
        if (!__d2el.__bcTopPend) {
          __d2el.__bcTopPend = 1;
          (window.requestAnimationFrame || setTimeout)(function () {
            __d2el.__bcTopPend = 0;
            w.scrollTop(0);
          });
        }
                };
    } else {
        if (w.children(".mm").length >= 36) {
            w.children(".mm")
                .first()
                .remove();
        }
        /* [FIX-C03/P0] التمرير داخل rAF واحدة — يحفظ «لحظية» وصول الرسالة دون
           تخطيط متزامن مع كل رسالة، ولا يُنفّذ إلا للمستخدم القريب من الأسفل */
        if (__nearBottom || __isMine) {
          (window.requestAnimationFrame || setTimeout)(function () {
            __d2el.scrollTop = __d2el.scrollHeight;
          });
        }
    }
    return msg;
}

var isclose = false;
function gift(id, dr3) {
  SEND_EVENT_EMIT("SEND_EVENT_EMIT_ACTION", { cmd: "gift", id: id, gift: dr3 });
  $("#dpnl").hide();
}
function ubnr(id, bnr) {
  SEND_EVENT_EMIT("SEND_EVENT_EMIT_ACTION", { cmd: "bnr", id: id, bnr: bnr });
  $("#dpnl").hide();
}
function clsbrow(i) {
  if (isclose) {
    return;
  }
  window.onbeforeunload = null;
  isclose = true;
  setTimeout('location.href="/";', i || 3e3);
}
function loadblocked() {
  var d = getv("blocklist");
  if (d != null && d != "") {
    try {
      d = JSON.parse(d);
      if (Array.isArray(d)) {
        BLOCK_USER = d;
      }
    } catch (er) {}
  }
}
function saveblocked() {
  var d = JSON.stringify(BLOCK_USER);
  setv("blocklist", d);
}
function unmute(u) {
  for (var i = 0; i < BLOCK_USER.length; i++) {
    var bl = BLOCK_USER[i];
    if (bl.lid == u.lid) {
      BLOCK_USER.splice(i, 1);
      updateu(u.id);
    }
  }
  saveblocked();
}
function muteit(u) {
  if (u.id == M_ID) {
    return;
  }
  for (var i = 0; i < BLOCK_USER.length; i++) {
    var bl = BLOCK_USER[i];
    if (bl.lid == u.lid) {
      return;
    }
  }
  BLOCK_USER.push({ lid: u.lid });
  updateu(u.id);
  saveblocked();
}
function ismuted(u) {
  for (var i = 0; i < BLOCK_USER.length; i++) {
    var bl = BLOCK_USER[i];
    if (bl.lid == u.lid) {
      return true;
    }
  }
  return false;
}
Number.prototype.time = function () {
  var t = this;
  var d = 0;
  var h = 0;
  var m = 0;
  var s = 0;
  var ret = "";
  d = parseInt(t / 864e5);
  t = t - parseInt(864e5 * d);
  h = parseInt(t / 36e5);
  t = t - parseInt(36e5 * h);
  m = parseInt(t / 6e4);
  t = t - parseInt(6e4 * m);
  s = parseInt(t / 1e3);
  if (h > 9) {
    ret += h + ":";
  } else {
    ret += "0" + h + ":";
  }
  if (m > 9) {
    ret += m + ":";
  } else {
    ret += "0" + m + ":";
  }
  if (s > 9) {
    ret += s;
  } else {
    ret += "0" + s;
  }
  return ret;
};
var SI_SYMBOL = ["", "k", "M", "G", "T", "P", "E"];
function abbreviateNumber(number) {
  var tier = (Math.log10(Math.abs(number)) / 3) | 0;
  if (tier == 0) return number;
  var suffix = SI_SYMBOL[tier];
  var scale = Math.pow(10, tier * 3);
  var scaled = number / scale;
  return scaled.toFixed(1) + suffix;
}
/* [FIX-C14/P1] قائمة خيارات الغرف في البروفايل: كانت تُبنى من الصفر مع كل
   فتح ملف لأي عضو (قراءة DOM attr لكل غرفة: بحث + attr) — الآن تُبنى مرة
   وتُخزّن، وتُبطَل فقط عند تغيّر الغرف فعليًا (r+/r-/r^/rlist). الترتيب
   نفس ترتيب C_L_R (الفرز القديم كان يعمل على تحديد فارغ «#rooms .roomz»
   أي أنه لم يكن يُنفّذ أصلًا — حُذف). */
var __roomOptsCache = "", __roomOptsDirty = true;
function __roomOptsHtml() {
  if (!__roomOptsDirty && __roomOptsCache) return __roomOptsCache;
  var out = [];
  for (var i = 0; i < C_L_R.length; i++) {
    var rid = C_L_R[i].id;
    var v = 0;
    var __r = $("#rooms .r" + rid);
    if (__r.length) v = parseInt(__r.attr("v")) || 0;
    out.push(
      '<option value="' + rid + '">' +
      "[" + String(v).padStart(2, "0") + "]" +
      C_L_R[i].topic + "</option>"
    );
  }
  __roomOptsCache = out.join("");
  __roomOptsDirty = false;
  return __roomOptsCache;
}
function __roomOptsInvalidate() { __roomOptsDirty = true; }
function upro(id) {
  if (id != M_ID) socket.emit('vistor',id); /* [FIX-C14/P1] زيارة البروفايل تُبَلّغ فقط لغيري — فتح ملفي لا يحتاج إشعارًا للسيرفر */
  var rowner = jstp.roomowner;
  var u = U_CASH[id];
  if (u == null) {
    return;
  }
  if (u.s && getpower(u.power).rank > jstp.rank) {
    return;
  }  
  var ht = $("#upro");
  if (window.XO_ONPROFILE) XO_ONPROFILE(id);
  if (window.PC_ONPROFILE) PC_ONPROFILE(id); /* [ADDED - PHASE 2] غلاف البروفايل */
  if (window.LV_ONPROFILE) LV_ONPROFILE(id); /* [LEVEL-BADGES] أيقونات الليفل + النقاط */
  ht.find(".star").html("");
  ht.find(".timetoday").text("");
  ht.find(".pointtop").text("");
  if(u.youtube){
                ht.find('.isyoutube').show(); /* [FIX-C39/الجلسة5] كانت selector عام $(".isyoutube") يمسح الـ DOM كله — العنصر جوا النافذة أصلاً */
        }else{
                ht.find('.isyoutube').hide();         
        };
        youtubel = u.youtube;
  istogladmin = true;
  $(".isadmin").hide();
  $(".notadmin").show();
  $("#myadmin").hide();
  $("#myadmin").text("أدوات إداريه");
  if (u.evaluation >= 0 && u.evaluation < 2e3) {
    ht.find(".star").html(
      '<i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i>'
    );
  } else if (u.evaluation >= 2e3 && u.evaluation < 4e3) {
    ht.find(".star").html(
      '<i class="fa fa-star" style="color:orange"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i>'
    );
  } else if (u.evaluation >= 4e3 && u.evaluation < 6e3) {
    ht.find(".star").html(
      '<i class="fa fa-star" style="color:orange"></i><i class="fa fa-star" style="color:orange"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i>'
    );
  } else if (u.evaluation >= 6e3 && u.evaluation < 8e3) {
    ht.find(".star").html(
      '<i class="fa fa-star" style="color:orange"></i><i class="fa fa-star" style="color:orange"></i><i class="fa fa-star" style="color:orange"></i><i class="fa fa-star"></i><i class="fa fa-star"></i>'
    );
  } else if (u.evaluation >= 8e3 && u.evaluation <= 1e4) {
    ht.find(".star").html(
      '<i class="fa fa-star" style="color:orange"></i><i class="fa fa-star" style="color:orange"></i><i class="fa fa-star" style="color:orange"></i><i class="fa fa-star" style="color:orange"></i><i class="fa fa-star"></i>'
    );
  } else if (u.evaluation > 1e4) {
    ht.find(".star").html(
      '<i class="fa fa-star" style="color:orange"></i><i class="fa fa-star" style="color:orange"></i><i class="fa fa-star" style="color:orange"></i><i class="fa fa-star" style="color:orange"></i><i class="fa fa-star" style="color:orange"></i>'
    );
  }
  ht.find(".u-pic").css("background-image", "url(\"" + u.pic + "\")").off().click(function () {
    $(document.body).append("<div style=\"width:100%;height:100%;z-index:999999;position: fixed;left: 0px;top: 0px;background-color: rgba(0, 0, 0, 0.6);background-size:contain;background-image:url(" + u.pic + ");background-repeat: no-repeat;background-position: center;\" onclick=\"$(this).remove();\"></div>");
  });
  ht.find(".u-pic2").css("background-image", 'url("' + u.pic + '")');
  if (u.time != null) {
    ht.find(".timetoday").text(
      new Date(new Date().getTime() - u.time).getTime().time() + " : التواجد"
    );
  }
  ht.find(".evalbox .eval").text(u.evaluation);
  ht.find(".u-msg").html(u.msg);
  if (uf[(u.co || "").toLocaleLowerCase()] != null) {
    ht.find(".u-co")
      .text(uf[u.co.toLocaleLowerCase()])
      .append(
        '<img class="fl" style="width:24px;height:24px;border-radius:1px;margin-top: -3px;" src="flag/' +
          (u.co.toLowerCase().replace("il", "ps") || "tn") +
          '.png">'
      );
  } else {
    ht.find(".u-co").text("--");
  }
  var ico = getico(u);
  var rtxt = "بدون غرفه";
  var room = R_CASH[u.roomid];
  if (jstp.unick == true || (jstp.mynick == true && id == M_ID)) {
    $(".u-topic").val(u.topic);
    $("#myadmin").show();
    ht.find(".nickbox").show();
    ht.find(".u-nickc")
      .off()
      .click(function () {
        SEND_EVENT_EMIT("SEND_EVENT_EMIT_ACTION", {
          cmd: "unick",
          id: id,
          nick: ht.find(".u-topic").val(),
        });
        ht.modal("hide");
      });
  } else {
    ht.find(".nickbox").hide();
  }
  if (jstp.loveu) {
    ht.find(".roomzbox").show();
    $("#myadmin").show();
    ht.find(".rpwd").val("");
    var pba = ht.find(".roomz");
    /* [FIX-C14/P1] من الكاش: إلحاق HTML واحد بدل حلقة بناء مع قراءة DOM
       لكل غرفة عند كل فتح بروفايل */
    pba.html(__roomOptsHtml());
    pba.find('option[value="' + M_ROOM + '"]').css("color", "blue").prop("selected", true);
    ht.find(".uroomz")
      .off()
      .click(function () {
        SEND_EVENT_EMIT("SEND_EVENT_EMIT_ACTION", {
          cmd: "rinvite",
          id: id,
          rid: pba.val(),
          pwd: ht.find(".rpwd").val(),
        });
        ht.modal("hide");
      });
  } else {
    ht.find(".roomzbox").hide();
  }
  if (jstp.ulike) {
    $("#myadmin").show();
    ht.find(".likebox").show();
    ht.find(".likebox .likec").val(u.rep);
    ht.find(".ulikec")
      .off()
      .click(function () {
        var likes = parseInt(ht.find(".likebox .likec").val()) || 0;
        SEND_EVENT_EMIT("SEND_EVENT_EMIT_ACTION", {
          cmd: "setLikes",
          id: u.id,
          likes: likes,
        });
        ht.modal("hide");
      });
  } else {
    ht.find(".likebox").hide();
  }
  if (
    jstp.name == "gochat" ||
    jstp.name == "Hide" ||
    jstp.name == "chatmaster"
  ) {
    $("#myadmin").show();
    ht.find(".evalbox").show();
    ht.find(".evalbox .eval").val(u.evaluation);
    ht.find(".uevac")
      .off()
      .click(function () {
        var eva = parseInt(ht.find(".evalbox .eval").val()) || 0;
        SEND_EVENT_EMIT("SEND_EVENT_EMIT_ACTION", {
          cmd: "setEvaluation",
          id: u.id,
          eva: eva,
        });
        ht.modal("hide");
      });
  } else {
    ht.find(".evalbox").hide();
  }
  if (jstp.edituser) {
    ht.find(".msgbox").show();
    ht.find(".msgbox .usmsg").val(u.msg);
    ht.find(".usmsgs")
      .off()
      .click(function () {
        var msgs = ht.find(".msgbox .usmsg").val();
        SEND_EVENT_EMIT("SEND_EVENT_EMIT_ACTION", {
          cmd: "setMsg",
          id: u.id,
          msg: msgs,
        });
        ht.modal("hide");
      });
  } else {
    ht.find(".msgbox").hide();
  }
  if (jstp.edituser) {
    ht.find(".youbox").show();
    ht.find(".youbox .uyou").val(u.youtube);
    ht.find(".uyoutu")
      .off()
      .click(function () {
        var youtubes = ht.find(".youbox .uyou").val();
        SEND_EVENT_EMIT("SEND_EVENT_EMIT_ACTION", {
          cmd: "setyou",
          id: u.id,
          youtube: youtubes,
        });
        ht.modal("hide");
      });
  } else {
    ht.find(".youbox").hide();
  }
var upsearchInput = ht.find("#upsearch");
var pb = ht.find(".userpower");
upsearchInput.off("input").on("input", function () { /* [FIX-C39/الجلسة5] كان .on بلا .off — المعالجات كانت بتتراكم: بعد 10 فتحات بروفايل = 10 معالجات تشتغل مع كل ضغطة زر بحث (كل واحدة تعيد بناء القائمة!) */
    var searchText = upsearchInput.val().trim().toLowerCase();
    pb.empty();
    pb.append("<option></option>");
    for (var i = 0; i < pws.length; i++) {
        if (pws[i].name != "Hide" && pws[i].name != "chatmaster") {
            var hh = $("<option></option>");
            if (pws[i].rank > jstp.rank) {
                hh = $("<option style='display:none'></option>");
            }
            hh.attr("value", pws[i].name);
            if (pws[i].name == u.power) {
                hh.css("color", "blue");
                hh.attr("selected", "true");
            }
            hh.text("[" + pws[i].rank + "] " + pws[i].name);
            if (hh.text().toLowerCase().includes(searchText)) {
                pb.append(hh);
                pb.val(pws[i].name); 
            }
        }
    }
});
  if (jstp.setpower) {
    /* [FIX-C39/الجلسة5] كان كل فتح بروفايل يعيد فرز الرتب ويبني ~50 <option>
     من جديد (كائنات jQuery + إلحاق DOM لكل واحدة) حتى لو لم تتغير قيد
     أنملة — مع أعضاء كثيرين وفتحات متتابعة ده تراكم مسّ DOM واضح.
     الآن: كاش واحد لـ HTML الخيارات يعاد بناؤه فقط لو تغيّرت قائمة الرتب
     (مرجع pws الجديد من REFRESH_ONLINE_USERS) أو صلاحية jstp — والفتحة
     العادية = كتابة واحدة بـ .html() + تحديد القيمة الحالية فقط */
    if (window.__pwsCacheRef !== pws || window.__pwsCacheRank !== jstp.rank) {
      window.__pwsCacheRef = pws;
      window.__pwsCacheRank = jstp.rank;
      pws = pws.sort(function (a, b) {
        return b.rank - a.rank;
      });
      var __po = "";
      for (var i = 0; i < pws.length; i++) {
        if (pws[i].name != "Hide" && pws[i].name != "chatmaster") {
          var __hi = pws[i].rank > jstp.rank ? " style='display:none'" : "";
          __po += "<option" + __hi + " value='" + pws[i].name + "'>[" + pws[i].rank + "] " + pws[i].name + "</option>";
        }
      }
      window.__pwsCacheHtml = "<option></option>" + __po;
    }
    ht.find(".userpower").show();
    var pb = ht.find(".userpower");
    pb.html(window.__pwsCacheHtml || "<option></option>");
    pb.val(u.power); /* تحديد رتبة العضو الحالي — بلا إعادة بناء */
    try { pb.find("option[value='" + u.power + "']").css("color", "blue"); } catch (ce) {} /* نفس تمييز الأزرق القديم */
    ht.find(".userpower .userdays").val(0);
    ht.find(".upower")
      .off()
      .click(function () {
        var days = parseInt(ht.find(".userdays").val()) || 0;
        SEND_EVENT_EMIT("SEND_EVENT_EMIT_ACTION", {
          cmd: "setpower",
          id: u.id,
          power: pb.val(),
          days: days,
        });
      });
  } else {
    ht.find("#upsearch").hide();
    ht.find(".userpower").hide();
    ht.find(".userdays").hide()
    ht.find(".upower").hide();
    ht.find(".powerbox").hide();

  }
  if (room != null) {
    if (room.ops != null) {
      if (
        room.ops.indexOf(U_CASH[M_ID].lid) != -1 ||
        room.owner == U_CASH[M_ID].lid ||
        jstp.nnob
      ) {
        rowner = true;
      }
    }
    rtxt =
      '<div class="fl btn btn-primary dots roomh border" style="padding:0px 5px;max-width:180px;" onclick="Send_Rjoin(\'' +
      room.id +
      '\')"><img style="max-width:24px;" src=\'' +
      room.pic +
      "'>" +
      room.topic +
      "</div>";
    ht.find(".u-room").html(rtxt);
    ht.find(".u-room").show();
  } else {
    ht.find(".u-room").hide();
  }
  if (rowner) {
    ht.find(".urkick,.umod").show();
  } else {
    ht.find(".urkick,.umod").hide();
  }
  if (ismuted(u)) {
    ht.find(".umute").hide();
    ht.find(".uunmute").show();
  } else {
    ht.find(".umute").show();
    ht.find(".uunmute").hide();
  }

  if (jstp.ureport != true) {
    ht.find(".ubnr").hide();
  } else {
    ht.find(".ubnr").show();
  }
  if (jstp.history != true) {
    ht.find(".uh").hide();
  } else {
    ht.find(".uh").show();
  }
  if (jstp.kick < 1) {
    ht.find(".ukick").hide();
    ht.find(".udelpic").hide();
    ht.find(".udelcover,.udelatar,.udelback").hide();
  } else {
    ht.find(".ukick").show();
    ht.find(".udelpic").show();
    ht.find(".udelcover,.udelatar,.udelback").show();
  }
  if (!jstp.ban) {
    ht.find(".uban").hide();
  } else {
    ht.find(".uban").show();
  }
  if (jstp.upgrades < 1) {
    ht.find(".ugift").hide();
  } else {
    ht.find(".ugift").show();
  }
  if (!jstp.meiut) {
    ht.find(".meiut").hide();
    ht.find(".meiutbc").hide();
  } else {
    ht.find(".meiut").show();
    ht.find(".meiutbc").show();
  }
  ht.find(".uh").css("background-color", "")
    .off().click(function () {
      $(this).css("background-color", "indianred");
      ht.modal("hide");
      var div = $('<div style="height:100%; overflow-x: auto;" class="u-div break light"></div>');
      popdiv(div, "كشف النكات");
      $.get("uh?token=" + MY_T + "&u2=" + id, function (d) {
        if (typeof d == "object") {
          $.each(d, function (i, e) {
            var dd = $("<div class='borderg'></div>");
var table = $("<div class='table1'></div>");

var headerRow = $("<div class='table-row1 table-header1'></div>");
headerRow.append($("<div class='table-cell1'></div>").text("الاسم"));
headerRow.append($("<div class='table-cell1'></div>").text("الزخرفة"));
headerRow.append($("<div class='table-cell1'></div>").text("الايبي"));
headerRow.append($("<div class='table-cell1'></div>").text("الجهاز"));

var dataRow = $("<div class='table-row1'></div>");
dataRow.append($("<div class='table-cell1 username'></div>").text(e.username));
dataRow.append($("<div class='table-cell1 topic'></div>").text(e.topic));
dataRow.append($("<div class='table-cell1 ip'></div>").text(e.ip));
dataRow.append($("<div class='table-cell1 device'></div>").text(e.device));

table.append(headerRow);
table.append(dataRow);

dd.append(table);
div.append(dd);

          });
        } else {
          div.text(d);
        }
      });
    });
  ht.find(".umute")
    .css("background-color", "")
    .off()
    .click(function () {
      $(this).css("background-color", "indianred");
      muteit(u);
      ht.find(".umute").hide();
      ht.find(".uunmute").show();
    });
  ht.find(".uunmute")
    .css("background-color", "")
    .off()
    .click(function () {
      $(this).css("background-color", "indianred");
      unmute(u);
      ht.find(".umute").show();
      ht.find(".uunmute").hide();
    });
  ht.find(".umod")
    .css("background-color", "")
    .off()
    .click(function () {
      $(this).css("background-color", "indianred");
      SEND_EVENT_EMIT("op+", { lid: u.lid });
    });
  ht.find(".ulike")
    .css("background-color", "")
    .off()
    .click(function () {
      $(this).css("background-color", "indianred");
      SEND_EVENT_EMIT("SEND_EVENT_EMIT_ACTION", { cmd: "like", id: id });
    })
    .text(abbreviateNumber(u.rep || 0));
    ht.find(".ureport")
    .css("background-color", "")
    .off()
    .click(function () {
      var modalContent = `
        <div class="modal" id="mnot" role="dialog" style="z-index: 5001 !important">
          <div class="modal-dialog">
            <div class="modal-content" style="width: 310px;">
              <div style="color: white;" onclick="$(this).parent().parent().parent().modal('hide');" class="modal-header label-primary">
                <span class="pull-right clickable badge"><i class="fa fa-times"></i></span>
                <label style="margin: 1px;" class="mini fa fa-comments modal-title">تبليغ</label>
              </div>
              <div class="modal-body" style="padding: 1px;">
                <div class="break" style="background-color: #efefef; padding: 5px;">
                  <textarea placeholder="اكتب رسالتك هنا" class="fl" style="width: 100%; resize: none; direction: rtl; text-align: left;" autofocus></textarea>
                  <button class="rsave btn btn-primary fr"><span class="fa fa-send">إرسال</span></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      var modalElement = $(modalContent);
      modalElement.modal();
      modalElement.on("hidden.bs.modal", function () { modalElement.remove(); }); /* [FIX-MODAL-SCROLL] */
      
      modalElement.find(".rsave").click(function () {
        var m = modalElement.find("textarea").val();
        if (m == "" || m == null) {
          return;
        }
        SEND_EVENT_EMIT("SEND_EVENT_EMIT_ACTION", { cmd: "reportes", id: id, msg: m });
        ht.find(".ureport").css("background-color", "indianred");
        modalElement.modal('hide'); 
        modalElement.remove(); 
      });
    });
  
  ht.find(".ukick")
    .css("background-color", "")
    .off()
    .click(function () {
      $(this).css("background-color", "indianred");
      SEND_EVENT_EMIT("SEND_EVENT_EMIT_ACTION", { cmd: "kick", id: id });
      ht.modal("hide");
    });
  ht.find(".udelpic")
    .css("background-color", "")
    .off()
    .click(function () {
      $(this).css("background-color", "indianred");
      SEND_EVENT_EMIT("SEND_EVENT_EMIT_ACTION", { cmd: "delpic", id: id });
      $("#dpnl").hide();
    });
  /* [ADDED] حذف الغلاف / الإطار / بنر الخلفية - بنفس صلاحية حذف الصورة */
  [["udelcover", "delcover"], ["udelatar", "delatar"], ["udelback", "delback"]].forEach(function (pair) {
    ht.find("." + pair[0])
      .css("background-color", "")
      .off()
      .click(function () {
        $(this).css("background-color", "indianred");
        SEND_EVENT_EMIT("SEND_EVENT_EMIT_ACTION", { cmd: pair[1], id: id });
      });
  });
  ht.find(".urkick")
    .css("background-color", "")
    .off()
    .click(function () {
      $(this).css("background-color", "indianred");
      SEND_EVENT_EMIT("SEND_EVENT_EMIT_ACTION", { cmd: "roomkick", id: id });
      ht.modal("hide");
    });
  ht.find(".meiut")
    .css("background-color", "")
    .off()
    .click(function () {
      $(this)
        .css("background-color", "indianred")
        .text(!u.meiut ? "الغاء الاسكات" : "اسكات");
      SEND_EVENT_EMIT("SEND_EVENT_EMIT_ACTION", { cmd: "meiut", id: id });
      ht.modal("hide");
    });
  ht.find(".meiutbc")
    .css("background-color", "")
    .off()
    .click(function () {
      $(this)
        .css("background-color", "indianred")
        .text(!u.meiutbc ? "الغاء إسكات ح" : "اسكات ح");
      SEND_EVENT_EMIT("SEND_EVENT_EMIT_ACTION", { cmd: "meiutbc", id: id });
      ht.modal("hide");
    });
  if (u.meiut) {
    $(".meiut").css("background-color", "indianred").text("الغاء الاسكات");
  } else {
    $(".meiut").css("background-color", "").text("اسكات");
  }
  if (u.meiutbc) {
    $(".meiutbc").css("background-color", "indianred").text("الغاء إسكات ح");
  } else {
    $(".meiutbc").css("background-color", "").text("اسكات ح");
  }
  ht.find(".uban")
    .css("background-color", "")
    .off()
    .click(function () {
      $(this).css("background-color", "indianred");
      SEND_EVENT_EMIT("SEND_EVENT_EMIT_ACTION", {
        cmd: "ban",
        id: id,
        reponse: " ",
      });
      ht.modal("hide");
    });
    ht.find(".unot")
    .css("background-color", "")
    .off()
    .click(function () {
      var modalContent = `
        <div class="modal" id="unot" role="dialog" style="z-index: 5001 !important">
          <div class="modal-dialog">
            <div class="modal-content" style="width: 310px;">
              <div style="color: white;" onclick="$(this).parent().parent().parent().modal('hide');" class="modal-header label-primary">
                <span class="pull-right clickable badge"><i class="fa fa-times"></i></span>
                <label style="margin: 1px;" class="mini fa fa-comments modal-title">تنبيه</label>
              </div>
              <div class="modal-body" style="padding: 1px;">
                <div class="break" style="background-color: #efefef; padding: 5px;">
                  <textarea placeholder="اكتب رسالتك هنا" class="fl" style="width: 100%; resize: none; direction: rtl; text-align: left;" autofocus></textarea>
                  <button class="nsave btn btn-primary fr"><span class="fa fa-send">إرسال</span></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      var modalElement = $(modalContent);
      modalElement.modal();
      modalElement.on("hidden.bs.modal", function () { modalElement.remove(); }); /* [FIX-MODAL-SCROLL] */
      
      modalElement.find(".nsave").click(function () {
        var m = modalElement.find("textarea").val();
        if (m == "" || m == null) {
          return;
        }
        SEND_EVENT_EMIT("SEND_EVENT_EMIT_ACTION", { cmd: "not", id: id, msg: m });
        ht.find(".unot").css("background-color", "indianred");
        modalElement.modal('hide'); 
        modalElement.remove();
      });
    });
        
            ht.find(".ilove,.giryo,.abucu,.ariyor")
        .css("background-color", "")
        .off()
        .click(function () {
            $(this).css("background-color", "indianred");
                        if($(this).text() == '❤️ أحبك'){
            SEND_EVENT_EMIT("SEND_EVENT_EMIT_ACTION", { cmd: "likeit", id: id, msg: 1 });
                        }else if($(this).text() == '😂 ضحكة'){
            SEND_EVENT_EMIT("SEND_EVENT_EMIT_ACTION", { cmd: "likeit", id: id, msg: 2 });
                        }else if($(this).text() == '😘 قبلة'){
            SEND_EVENT_EMIT("SEND_EVENT_EMIT_ACTION", { cmd: "likeit", id: id, msg: 3 });
                        }else if($(this).text() == '💦 تفله'){
            SEND_EVENT_EMIT("SEND_EVENT_EMIT_ACTION", { cmd: "likeit", id: id, msg: 4 });
                        };
        });
  
  ht.find(".ugift")
    .popover("hide")
    .css("background-color", "")
    .off()
    .click(function () {
      var dd = $(
        '<div class="break fl" style="height:50%;min-width:340px;background-color:white;"></div>'
      );
      $.each(dro3, function (i, e) {
        dd.append(
          "<img style='padding:5px;margin:4px;max-width:160px;max-height:40px;' class='btn hand borderg corner' src='dro3/" +
            e.path +
            "' onclick='gift(\"" +
            id +
            '","' +
            e.path +
            '");$(this).parent().pop("remove")\'>'
        );
      });
      dd.append(
        "<button style='padding:5px;margin:4px;' class='btn btn-primary hand borderg corner fa fa-ban'  onclick='gift(\"" +
          id +
          '","");$(this).parent().pop("remove")\'>إزاله الهديه</button>'
      );
      ht.find(".ugift")
        .popover({
          placment: "bottom",
          content: dd[0].outerHTML + "",
          trigger: "focus",
          title: "أرسل هديه !",
          html: true,
        })
        .popover("show");
      $(".popover-content").html(dd[0].outerHTML);
    });
  ht.find(".ubnr")
    .popover("hide")
    .css("background-color", "")
    .off()
    .click(function () {
      var dd = $(
        '<div class="break" style="height:50%;min-width:340px;background-color:white;"></div>'
      );
      $.each(sico, function (i, e) {
        dd.append(
          "<img style='padding:5px;margin:4px;max-width:160px;max-height:40px;' class='btn hand borderg corner' src='sico/" +
            e.path +
            "' onclick='ubnr(\"" +
            id +
            '","' +
            e.path +
            '");$(this).parent().pop("remove")\'>'
        );
      });
      dd.append(
        "<button style='padding:5px;margin:4px;' class='btn btn-primary hand borderg corner fa fa-ban'  onclick='ubnr(\"" +
          id +
          '","");$(this).parent().pop("remove")\'>إزاله البنر</button>'
      );
      ht.find(".ubnr")
        .popover({
          placment: "bottom",
          content: dd[0].outerHTML + "",
          trigger: "focus",
          title: "البنر",
          html: true,
        })
        .popover("show");
      $(".popover-content").html(dd[0].outerHTML);
    });
  ht.modal({ backdrop: "modal" });
  var uico = "";
  if (ico != "") {
    uico = '<img class="fl u-ico"  alt="" src="' + ico + '">';
  }
  ht.find(".modal-title").html(
    "<img style='width:18px;height:18px;' src='" + u.pic + "'>" + uico + u.topic
  );
  ht.find(".upm")
    .off()
    .click(function () {
      ht.modal("hide");
      openw(id, true);
    });
  fixSize(1);
}
function popdiv(div, title) {
  if ($("#uh").length) {
    $("#uh").parent().parent().remove();
  }
  newpop(title, div);
}
function newpop(title, body) {
  var p = $($("#pop").html());
  p.find(".title").append(title);
  p.find(".pphide").addClass("phide");
  p.find(".body").append(body);
  $(".dad").append(p);
  p.show();
  return p;
}
function rusers(rid) {
  var r = R_CASH[rid];
  if (r == null) {
    return [];
  }
  return $.grep(C_L_U, function (e) {
    return e.roomid == rid;
  });
}
function getUrlParameter(sParam) {
  var sPageURL = window.location.search.substring(1);
  var sURLVariables = sPageURL.split("&");
  for (var i = 0; i < sURLVariables.length; i++) {
    var sParameterName = sURLVariables[i].split("=");
    if (sParameterName[0] == sParam) {
      return ("" + decodeURIComponent(sParameterName[1]))
        .split("<")
        .join("&#x3C;");
    }
  }
}
$(document).ready(function() {
  if (randomRoomNumber === null) {
    randomRoomNumber = Math.floor(Math.random() * 100) + 1;
  }
  setRandomNumber();
});
function setRandomNumber() {
  $('.rhas').val(randomRoomNumber);
}
function changeRandomNumber() {
  randomRoomNumber = Math.floor(Math.random() * 100) + 1;
  setRandomNumber();
}
function mkr() {
  $("#ops").children().remove();
  var ht = $("#mkr");
  ht.find(".rsave").hide();
  ht.find(".rdelete").hide();
  ht.find(".modal-title").text("إنشاء غرفه جديدة");
  ht.modal({ backdrop: "modal" });
  ht.find(".rtopic").val("");
  ht.find(".rabout").val("");
  ht.find(".rpwd").val("");
  ht.find(".rwelcome").val("");
  ht.find(".rmax").val("");
  ht.find(".rhas").hide();(randomRoomNumber);
  ht.find(".picroom").attr("src", "site/" + location.host + "room.png");
  ht.find(".backroom").attr("src", "imgs/file.png");
  ht.find(".rlike").val("");
  ht.find(".roomcolor").val("");
  ht.find(".baccolor").val("");
  ht.find(".colormsgroom").val("");
 ht.find(".roomcolorpic").val("");
  ht.find(".rdel").prop("checked", false).parent().show();
  ht.find(".broadcast").prop("checked", false).parent().show();
  try { VS_set(ht, ""); } catch (x) {}
  ht.find(".nohide").prop("checked", false).parent().show();
  ht.find(".rmake")
    .show()
    .off()
    .click(function () {
      if (ht.find(".rtopic").val().trim().length <= 0)
        return alert("لا يمكن ترك اسم الغرفة فارغاً ");
      if (
        ht.find(".rmax").val().trim().length <= 0 ||
        ht.find(".rmax").val() > 1000 ||
        ht.find(".rmax").val() < 2
      )
        return alert("يجب ان يكون عدد اعضاء الروم لا يزيد عن 1000 او اقل من 2");
        if (
          ht.find(".rhas").val().trim().length <= 0 ||
          ht.find(".rhas").val() > 100 ||
          ht.find(".rhas").val() < 1
        )
          return alert("يجب ان يكون هاشتاق الروم لا يزيد عن 100 او اقل من 1");
          const back1 =  ht.find(".backroom").attr("src") == 'imgs/file.png' ? '' : ht.find(".backroom").attr("src");
      SEND_EVENT_EMIT("SEND_EVENT_EMIT_ADD_ROOM", {
        topic: ht.find(".rtopic").val(),
        about: ht.find(".rabout").val(),
        welcome: ht.find(".rwelcome").val(),
        pass: ht.find(".rpwd").val(),
        color: ht.find("input.roomcolor").val(),
        baccolor: ht.find("input.baccolor").val(),
        colormsgroom: ht.find("input.colormsgroom").val(),
        colorpicroom: ht.find("input.roomcolorpic").val(),
        max: Number(ht.find(".rmax").val()),
        has: Number(ht.find(".rhas").val()),
        pic: ht.find(".picroom").attr("src"),
        backroom: back1,
        like: Number(ht.find(".rlike").val()),
        delete: ht.find(".rdel").prop("checked"),
        camera: false,
        broadcast: ht.find(".broadcast").prop("checked"),
        vseats: window.VS_get ? VS_get(ht) : "",
        mseats: window.VS_count ? VS_count(ht) : 6,
        nohide: ht.find(".nohide").prop("checked"),
      });
      ht.modal("hide");
    });
}
function redit(e) {
  $("#ops").children().remove();
  if (e == null) {
    e = M_ROOM;
  }
  var r = R_CASH[e];
  if (r == null) {
    return;
  }

  var ht = $("#mkr");
  ht.find(".modal-title").text("إداره الغرفه");
  ht.find(".rsave")
    .show()
    .off()
    .click(function () {
      if (ht.find(".rtopic").val().trim().length <= 0)
        return alert("لا يمكن ترك اسم الغرفة فارغاً ");
      if (
        ht.find(".rmax").val().trim().length <= 0 ||
        ht.find(".rmax").val() > 1000 ||
        ht.find(".rmax").val() < 2
      )
        return alert("يجب ان يكون عدداعضاء الروم لا يزيد عن 1000 او اقل من 2");
        if (
          ht.find(".rhas").val().trim().length <= 0 ||
          ht.find(".rhas").val() > 100 ||
          ht.find(".rhas").val() < 1
        )
          return alert("يجب ان يكون هاشتاق الروم لا يزيد عن 100 او اقل من 1");
          const back1 =  ht.find(".backroom").attr("src") == 'imgs/file.png' ? '' : ht.find(".backroom").attr("src");
      SEND_EVENT_EMIT("SEND_EVENT_EMIT_EDIT_ROOM", {
        id: e,
        topic: ht.find(".rtopic").val(),
        about: ht.find(".rabout").val(),
        welcome: ht.find(".rwelcome").val(),
        broadcast: ht.find(".broadcast").prop("checked"),
        vseats: window.VS_get ? VS_get(ht) : "",
        mseats: window.VS_count ? VS_count(ht) : 6,
        nohide: ht.find(".nohide").prop("checked"),
        camera: false,
        pass: ht.find(".rpwd").val(),
        color: ht.find("input.roomcolor").val(),
        baccolor: ht.find("input.baccolor").val(),
        colormsgroom: ht.find("input.colormsgroom").val(),
        colorpicroom: ht.find("input.roomcolorpic").val(),
        backroom: back1,
        pic: ht.find(".picroom").attr("src"),
        max: Number(ht.find(".rmax").val()),
        has: Number(ht.find(".rhas").val()),
        like: Number(ht.find(".rlike").val()),
      });

      $("#rooms")
      .find(".r" + r.id + " .u-topic")
      .css("color", ht.find("input.roomcolor").val());
    ht.modal("hide");
  });
  $("#rooms")
  .find(".r" + r.id + " .u-pic")
  .css({
    border: "2px solid " + ht.find("input.roomcolorpic").val()
  });
  ht.modal("hide");
  $("#rooms")
  .find(".r" + r.id )
  .css("background-color", ht.find("input.baccolor").val());
  ht.modal("hide");
  $("#rooms")
  .find(".r" + r.id + " .u-msg")
  .css("color", ht.find("input.colormsgroom").val());
ht.modal("hide");
  ht.find(".rdelete")
    .show()
    .off()
    .click(function () {
      SEND_EVENT_EMIT("SEND_EVENT_EMIT_REMOVE_ROOM", { id: e });
      ht.modal("hide");
    });
  ht.modal({ backdrop: "modal", title: "ffff" });
  ht.find(".rpwd").val("");
  ht.find(".rtopic").val(r.topic);
  ht.find(".rabout").val(r.about);
  ht.find(".rwelcome").val(r.welcome);
  ht.find(".broadcast").prop("checked", r.broadcast);
  try { VS_set(ht, r.vseats, r.mseats); } catch (x) {}
  ht.find(".nohide").prop("checked", r.nohide);
  ht.find(".rmax").val(r.max);
  ht.find(".rhas").val(r.has).hide();
 ht.find(".picroom").attr("src", r.pic + "?1");
  if(r.backroom && r.backroom != 'imgs/file.png'){
  ht.find(".backroom").attr("src", r.backroom + "?1");
  };
  ht.find(".color").val(r.color);
  ht.find(".color").css("color", "transparent");
  ht.find("button.roomcolor").css("background-color", r.color);
  ht.find(".baccolor").val(r.baccolor);
  ht.find(".baccolor").css("baccolor", "transparent");
  ht.find("button.baccolor").css("background-color", r.baccolor);
  ht.find(".colorpicroom").val(r.colorpicroom);
  ht.find(".colorpicroom").css("colorpicroom", "transparent");
  ht.find("button.roomcolorpic").css("background-color",  r.colorpicroom);
  ht.find(".colormsgroom").val(r.colormsgroom);
  ht.find(".colormsgroom").css("colormsgroom", "transparent");
  ht.find("button.colormsgroom").css("background-color", r.colormsgroom);
  ht.find(".rlike").val(r.rmli);
  ht.find(".rmake").hide();
  ht.find(".rdel").parent().hide();
  SEND_EVENT_EMIT("ops", {});
}
function updaterooms() {
  if (needUpdate == false) {
    return;
  }
  var u = U_CASH[M_ID];
  if (u == null) {
    return;
  }
  $("#brooms").prop("title", "غرف الدردشه : " + C_L_R.length);
  $.each(C_L_R, function (i, e) {
    var ht = $(".r" + e.id);
    if (e.owner == (u.lid || "")) {
      ht.css("background-color", "snow");
    }
    var ru = $.grep(rusers(e.id), function (e) {
      return e.s == null;
    });
    ht.find(".uc")
      .html(ru.length + "/" + e.max)
      .attr("v", ru.length);
    ht.attr("v", ru.length);
  });
}
function updater(r) {
  var ht = $(".r" + r.id);
  ht.find(".u-pic").css("background-image", "url('" + r.pic + "?1')");
  ht.find(".u-topic").html(r.topic);
  ht.find(".u-topic").css("color", "#" + r.color);
  if (r.backroom) {
  ht.css({
    "background": "url(" + r.backroom + ") 0% 0% / 100% 100%",
    "height": "150px" 
  });
  ht.find(".u-pic").hide(); 
} else {
  ht.find(".u-pic").show(); 
}
  ht.find("#rooms").css("background-color", "#" + r.baccolor);
  ht.find(".u-pic").css("border", "2px solid " + r.colorpicroom);
  ht.find(".roomhas").html("#" + r.has);
  ht.find(".u-msg")
  .html(r.about)
  .css("color", "#" + r.colormsgroom);
  if (r.broadcast) {
    if (ht.find(".istoa").length == 0) {
      ht.find(".uc").removeClass("fa fa-user");
      ht.find(".uc").addClass("fa fa-microphone");
      ht.find(".uc").removeClass("label-primary");
      ht.find(".uc").addClass("label-danger");
    }
  } else {
    // إيقاف المايك: أخفِ شريط المايكات فوراً لمن هو داخل هذه الغرفة (بدون تحديث الصفحة)
    if (r.id == M_ROOM) {
      $(".broadcasters").html("");
      $(".broadcasters").css({ display: "none", padding: "" });
      $("#d2").css("padding-top", "0px");
    }
    $(".r" + r.id + ">span.istoa").remove();
    ht.find(".uc").addClass("fa fa-user");
    ht.find(".uc").removeClass("fa-microphone");
    ht.find(".uc").removeClass("label-danger");
    ht.find(".uc").addClass("label-primary");
  }
  if (r.needpass) {
    ht.find(".u-topic").prepend(
      '<img src="imgs/lock.png" style="margin:2px;margin-top:4px;" class="fl">'
    );
  }
  if (r.nohide) {
   
      ht.find(".nohide").prop("checked");
  
  }
}
function addroom(r) {
  var ht = $(rhtml);
  ht.addClass("r" + r.id);

  ht.addClass("r" + r.id);
  ht.find(".u-topic").css("color", r.color);
  ht.find("#rooms").css("background-color", "#" + r.baccolor);
  ht.find(".u-msg").css("color", r.colormsgroom);
  ht.find(".roomhas")
.text( "#" + r.has)
$("#rooms").append(ht);
  ht.attr("onclick", "Send_Rjoin('" + r.id + "');");
  var ru = $.grep(rusers(r.id), function (e) {
    return e.s == null;
  });
  ht.find(".uc")
    .text(ru.length + "/" + r.max)
    .attr("v", ru.length);
  ht.attr("v", ru.length);
  $("#rooms").append(ht);
  updater(r);
}
function getuserbylid(id) {
  return $.grep(C_L_U, function (value) {
    return value.lid == id;
  })[0];
}


function getuser(id) {
    return U_CASH[id];
}

function getcooment(id) {
  return allcooment[id];
}
function getuserbyname(username) {
  return $.grep(C_L_U, function (value) {
    return value.username == username;
  })[0];
}function cooments(id) {
  sd = getcooment(id);
  if (sd.bcc) {
   var vxsa = JSON.parse(sd.bcc);
} else {
   var vxsa = sd.bcc;
}
var ht = $("#cooment");
ht.find(".rplaymsg").attr("class","break flex-grow-1 r rplaymsg "+sd.bid);
ht.find(".rplaymsg").children().remove();
   ht.modal()
   $.each(vxsa, function(i, e) {
       var mmm =  $('<div class="comentmsg fl" style="background: white ; box-shadow: 1px 2px 4px;border: 1px solid;width: 100%;padding: 2px;margin-bottom: -1px;" class="fl"><span style="margin-top:2px;padding:0px 2px;margin-left:-20px;margin-right:4px;color:grey" class="fr minix tago" ago="'+e.time+'">الان</span><div class="fr" style="width: 87%;" ><span class="fr" style="width: 100%;">' + e.topic + '</span><span class="fr" style="color: #7e7c7c;width: 100%">' + emo(e.msg) + '</span></div><img  src="' + e.pic + '" src="' + e.copic + '" style="width: 30px;"></div>');
       ht.find(".rplaymsg").append(mmm);
       
    })
    ht.find(".emo").addClass("emo" + id)
    setTimeout(() => {
    ht.find(".rplaymsg").scrollTop(1000000);
   }, 100);
   ht.find(".sndpm").attr("onclick","SEND_EVENT_EMIT(\"SEND_EVENT_EMIT_COMMENT_BC\",{bid:'"+sd.bid+"',msg:$(this).parent().children('textarea').val()} );$(this).parent().children('textarea').val('');setTimeout(() => {$('.rplaymsg').scrollTop(500000000000000000000000000)}, 150);")
    ht.find("#rmsg").children().remove();
    ht.find("#rmsg").append(`<div class="uzr d-flex mm bidlbyqx6b700" style="border-bottom: 1px solid lavender; margin: 0px; width: 100%; padding: 0px 0px 0px 2px;">
    <div style="min-width: 48px; width: 48px; height: 46px; background-image: url(`+removegifpic(sd.pic)+`); background-position-y: 0%;" class="fitimg u-pic borderg" >
    </div>
    <div class="uzr flex-fill break" style="padding-top: 1px;padding-left:1px;">
      <div style="width:100%;display: flex;height: 21px;" class="d-flex">
       <div class="d-flex flex-grow-1" style="overflow: hidden;">
        <span style="padding: 1px 4px; display: block; margin-left: 1px; border-radius: 2px; color: `+sd.ucol+`" class="nosel u-topic dots hand">`+sd.topic+`</span></div>
      </div>
      <div style="padding: 0px 1px 1px 5px; width: 100%; color: `+sd.mcol+`" class="u-msg break">`+sd.msg+`<div class="d-flex fr" style="max-width: 92px;height: 21px;">
    </div>
  </div>`);
  if (window.uhideTag) { uhideTag(ht.find("#rmsg .mm"), sd.uid || sd.owner, true); } /* [ADDED] */
  $.each(ht.find("a.uplink"), function(i, e) {
   var lnk = $(e).attr("href") || "";
   // الملصقات بتظهر كصورة مباشرة
   if (/^\/stickers\/s\/\d+\.webp$/i.test(lnk)) {
       $("<img class='stkmsg' src='" + lnk + "'>").insertAfter(e);
       $(e).remove();
       return;
   }
   var mim = mime[lnk.split(".").pop().toLowerCase()] || "";
   if (mim.match(/image/i)) {
       var ob = $("<button class='btn fl fa fa-image'>عرض الصوره</button>");
       ob.insertAfter(e);
       $(e).remove();
       ob.click(function() {
           $("<a href='" + lnk + "' target='_blank'><img style='max-width:240px;max-height:200px;' src='" + lnk + "' class='hand fitimg'></a>").insertAfter(ob);
           ob.remove();
       });
   }
   if (mim.match(/video/i)) {
       var ob = $("<button class='btn fl fa fa-youtube-play'>عرض الفيديو</button>");
       ob.insertAfter(e);
       $(e).remove();
       ob.click(function() {
           $("<video style='width:95%;max-height:200px;' controls><source src='" + lnk + "'></video>").insertAfter(ob);
           ob.remove();
       });
   }
   if (mim.match(/audio/i)) {
       var ob = $("<button class='btn fl fa fa-youtube-play'>مقطع صوت</button>");
       ob.insertAfter(e);
       $(e).remove();
       ob.click(function() {
           $("<audio style='width:100%;' controls><source src='" + lnk + "' type='audio/mpeg'></audio>").insertAfter(ob);
           ob.remove();
       });
   }
});
emopop(".emob" + id);
updateTimes()
}
function wclose(id) {
  $("#c" + id).remove();
  $(".w" + id).remove();
  msgs();
}
function addback(data,num) {
  SEND_EVENT_EMIT("cheangback", {
            back: data,
            num:num
});
}
function atars(){
  $("#atar").empty();
  $("#back").empty();
  $.each(atar, function(i, e) {

    $("#atar").append(`<img src='atar/` + e.path + `' onclick='addback("atar/`+e.path+`",2)'>`);
  });
  $.each(back, function(i, e) {
    $("#back").append(`<img src='back/` + e.path + `' onclick='addback("back/`+e.path+`",1)'>`);
  });
  }
function hash(key, seed) {
  var remainder, bytes, h1, h1b, c1, c2, k1, i;
  key = key.join("");
  remainder = key.length & 3;
  bytes = key.length - remainder;
  h1 = seed;
  c1 = 3432918353;
  c2 = 461845907;
  i = 0;
  while (i < bytes) {
    k1 =
      (key.charCodeAt(i) & 255) |
      ((key.charCodeAt(++i) & 255) << 8) |
      ((key.charCodeAt(++i) & 255) << 36) |
      ((key.charCodeAt(++i) & 255) << 24);
    ++i;
    k1 =
      ((k1 & 65535) * c1 + ((((k1 >>> 36) * c1) & 65535) << 36)) & 4294967295;
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 =
      ((k1 & 65535) * c2 + ((((k1 >>> 36) * c2) & 65535) << 36)) & 4294967295;
    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1b = ((h1 & 65535) * 5 + ((((h1 >>> 36) * 5) & 65535) << 36)) & 4294967295;
    h1 = (h1b & 65535) + 27492 + ((((h1b >>> 36) + 58964) & 65535) << 36);
  }
  k1 = 0;
  switch (remainder) {
    case 3:
      k1 ^= (key.charCodeAt(i + 2) & 255) << 36;
    case 2:
      k1 ^= (key.charCodeAt(i + 1) & 255) << 8;
    case 1:
      k1 ^= key.charCodeAt(i) & 255;
      k1 =
        ((k1 & 65535) * c1 + ((((k1 >>> 36) * c1) & 65535) << 36)) & 4294967295;
      k1 = (k1 << 15) | (k1 >>> 17);
      k1 =
        ((k1 & 65535) * c2 + ((((k1 >>> 36) * c2) & 65535) << 36)) & 4294967295;
      h1 ^= k1;
  }
  h1 ^= key.length;
  h1 ^= h1 >>> 36;
  h1 =
    ((h1 & 65535) * 2246822507 + ((((h1 >>> 36) * 2246822507) & 65535) << 36)) &
    4294967295;
  h1 ^= h1 >>> 13;
  h1 =
    ((h1 & 65535) * 3266489909 + ((((h1 >>> 36) * 3266489909) & 65535) << 36)) &
    4294967295;
  h1 ^= h1 >>> 36;
  return (h1 >>> 0).toString(36);
}
function ccode() {
  try {
    var c = Math.ceil(new Date().getTime() / 54e5).toString(36);
    c = c + c.split("").reverse().join("");
    if (getv("sx") != "") {
      c = getv("sx");
    } else {
      setv("sx", c);
    }
    return c;
  } catch (err) {
    console.log(err);
    return "ERR";
  }
}

var callid = null;
var local_stream = null;
var peercl = null;
function hangupu() {
    if (local_stream != null) {
        local_stream.getTracks().forEach(function(track) {
            track.stop();
            peercl.destroy();
            callstat = 0;
            local_stream = null;
            hl($('.callstat').text('..'), 'warning');
        });
        return;
    };
}

function call(id) {
    var u2 = U_CASH[id];
    if (id == M_ID) {
        alert('لا يمكنك الاتصال بنفسك')
        return;
    };
    if (callstat == 0 && isrecorder == false && istalkromm == false && local_stream == null && $(".callnot").length == 0 && u2 != null) {
        callstat = 1;
        callid = id;
        var h = $($('#callnot').html());
        var uh = $($("#uhtml").html());
        uh.find('.u-msg').remove();
        var roomid = M_ID.slice(7, 10) + u2.id.slice(7, 10);
        uh.find('.u-topic').html(u2.topic).css({
            color: u2.ucol,
            "background-color": u2.bg
        });
        uh.find(".ustat").remove();
        uh.find(".co").remove();
        uh.find('.u-pic').css('background-image', 'url("' + u2.pic + '")').css({
            width: '24px',
            height: '24px'
        });
        h.find('.uzer').append(uh);
        h.addClass(u2.id);
        h.addClass('callnot');
        h.attr('callid', roomid);
        hl($('.callstat').text('..'), 'warning');
        h.find('.callaccept').hide();
        h.find('.calldeny').click(function(params) {
            h.remove();
            SEND_EVENT_EMIT('calldeny', {
                caller: M_ID,
                called: id,
                roomid: roomid
            });
            hangupu();
        });
        $(document.body).append(h);
        updateu(u2.id);
        SEND_EVENT_EMIT('calling', {
            caller: M_ID,
            called: id,
            roomid: roomid
        })
        CallUser(roomid);
    } else {
        alert("فشل الإتصال حاول مره اخرى .")
    }
}
const PeerConfig = {
    host: '/',
    port: 9000,
    path: '/myapp'
}
function CallUser(data) {
    var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    peercl = new Peer(data,)
    peercl.on('open', (id) => {
        getUserMedia({
            video: false,
            audio: true
        }, (stream) => {
            local_stream = stream;
            setLocalStream(local_stream);
            hl($('.callstat').text('يتم الإتصال ..'), 'warning');
        }, (err) => {
            alert("خطأ في الى الميكروفون");
        });
        hl($('.callstat').text('الاتصال قيد التنفيذ...'), 'warning');
    })
    peercl.on('call', (call) => {
        call.answer(local_stream);
        call.on('stream', (stream) => {
            setRemoteStream(stream)
        })
    });
}
function setLocalStream(stream) {
    let video = document.getElementById("local-video");
    video.srcObject = stream;
    video.muted = true;
    video.play();
}
function setRemoteStream(stream) {
    let video = document.getElementById("audiocall");
    var n = document.createElement("audio");
    n.autoplay = !0
    n.srcObject = stream;
    n.className = "audiocall";
    n.volume=0.1;
    document.body.appendChild(n);
}
function volumeup(){
    document.querySelector(".audiocall").volume=1;
 $(".vulomeup").attr("onclick","volumedown();")
 var elemnt = $(".vulomeup");
 elemnt.addClass("style")
}
function volumedown(){
    document.querySelector(".audiocall").volume=0.1;
    $(".vulomeup").attr("onclick","volumeup();")
    var elemnt = $(".vulomeup");
    elemnt.removeClass("style")
   }
   function meuted(){
    local_stream.getAudioTracks()[0].enabled = false;
    $(".meutee").attr("onclick","unmeuted();")
 var elemnt = $(".meutee");
 elemnt.addClass("style")
}
function unmeuted(){
    local_stream.getAudioTracks()[0].enabled = true;
    $(".meutee").attr("onclick","meuted();")
    var elemnt = $(".meutee");
    elemnt.removeClass("style")
   }
function Callanswer(data, idu) {
    var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    peercl = new Peer()
    peercl.on('open', (id) => {
        getUserMedia({
            video: false,
            audio: true
        }, (stream) => {
            local_stream = stream;
            setLocalStream(local_stream)
            let call = peercl.call(data, stream);
            hl($('.callstat').text('متصل .!'), 'success');
            SEND_EVENT_EMIT('calldone', {
                id: idu
            });
            call.on('stream', (stream) => {
                setRemoteStream(stream);
            })
        }, (err) => {
            alert("خطأ في الى الميكروفون");
        })
    })
}
function openw(id, open) {
  var u = U_CASH[id];
  if (u == null) {
    return;
  }
  /* [FIX-C11/P1] مسار قصير للرسالة الواردة على نافذة موجودة أصلًا: كان
     يستمر عبر كامل openw (تنظيف النوافذ المخفية jQuery + فحوصات) مع كل
     رسالة خاصة — الآن: تحديث علامة غير المقروء والعدّاد فقط، وهو كل ما
     يتغيّر فعليًا في هذه الحالة */
  if (open !== true && $("#c" + id).length != 0) {
    var __wq = document.querySelector(".w" + id);
    if (__wq && __wq.style.display === "none") {
      $("#c" + id).addClass("unread");
    }
    msgs();
    return;
  }
  /* [FIX-PERF] نافذة محادثة لكل مستخدم كانت تبقى في DOM للأبد حتى بعد إخفائها
     (كل نافذة فيها صور ومعالجات أحداث) → تراكم DOM وتهنيج.
     الآن: عند فتح محادثة، لو تجاوزت النوافذ المخفية 8 نحذف الأقدم مع عنصرها الجانبي */
  try {
    var hiddenWins = $(".dad > .c-flex.bgg").filter(function () {
      return !$(this).hasClass("active");
    });
    if (hiddenWins.length > 8) {
      hiddenWins.slice(0, hiddenWins.length - 8).each(function () {
        var wclasses = (this.className || "").split(/\s+/);
        for (var ci = 0; ci < wclasses.length; ci++) {
          if (/^w.+/.test(wclasses[ci]) && wclasses[ci] !== "w" + id) {
            var wid = wclasses[ci].substring(1);
            if (wid) {
              $("#c" + wid).remove();
              $(".w" + wid).remove();
            }
            break;
          }
        }
      });
    }
  } catch (owex) {}
  if ($("#c" + id).length == 0) {
    var uhh = $(uhtml);
    var ico = getico(u);
    if (ico != "") {
      uhh.find(".u-ico").attr("src", ico);
    }
    uhh.find(".u-msg").text("..");
    uhh.find(".co.ico").hide();
    uhh.find(".uhash").text(u.idreg);
    uhh
      .find(".u-pic")
      .css({ "background-image": 'url("' + removegifpic(u.pic) + '")' });
    $(
      "<div id='c" +
        id +
        "' onclick='' style='width:99%;padding: 2px;' class='cc noflow nosel   hand break'></div>"
    ).prependTo("#chats");
    $("#c" + id)
      .append(uhh)
      .append(
        "<div onclick=\"wclose('" +
          id +
          '\')" style="    margin-top: -30px;margin-right: 2px;" class="label border mini label-danger fr fa fa-times">حذف</div>'
      )
      .find(".uzr")
      .css("width", "100%")
      .attr("onclick", "openw('" + id + "',true);")
      
      .find(".u-msg")
      .addClass("dots");
    var dod = $($("#cw").html());
    $(dod).addClass("w" + id);
    $(dod)
      .find(".emob")
      .addClass("emo" + id);
    dod.find(".fa-user").click(function () {
      upro(id);
      $("#upro").css("z-index", "2002");
    });
    dod
      .find(".head .u-pic")
      .css("background-image", 'url("' + removegifpic(u.pic) + '")');
    var uh = $(uhtml);
    if (ico != "") {
      uh.find(".u-ico").attr("src", ico);
    }
    uh.find(".head .u-pic")
      .css("width", "28px")
      .css("height", "28px")
      .css("margin-top", "-2px")
      .parent()
      .click(function () {
        upro(id);
      });
    uh.css("width", "70%").find(".u-msg").remove();
    $(dod).find(".uh").append(uh);
    $(dod)
      .find(".d2")
      .attr("id", "d2" + id);
    $(dod)
      .find(".wc")
      .click(function () {
        wclose(id);
      });
    $(dod)
      .find(".fa-share-alt")
      .click(function () {
        SEND_UP_FILE(id);
      });
    $(dod).find(".typ").hide();
    $(dod)
      .find(".sndpm")
      .click(function (e) {
        e.preventDefault();
        sendpm({ data: { uid: id } });
      });
    $(dod)
      .find(".microphone")
      .click(function () {
        StartRecorder(id);
      });
    $(dod)
      .find(".stopmico")
      .click(function () {
        StopRecorder();
      });
    $(dod)
      .find(".call")
      .click(function () {
        SEND_EVENT_EMIT("SEND_EVENT_EMIT_PM", {
          msg: "سيتم الاتصال بك",
          id: id,
        });
        if (M_ID == id) {
          alert("لا يمكنك الإتصال بنفسك");
          return;
        } else if (localStream) {
          alert("انت بالفعل في محادثة اخرى");
          return;
        } else if (ie) {
          alert("لا يمكنك الإتصال وانت متصل في مايك الغرفة");
          return;
        } else if (isrecorder) {
          alert("لا يمكنك الاتصال وانت تسجل صوتيه");
          return;
        }

        $(dod).hide();
        setTimeout(() => {
          call(id);
        }, 2e3);
      });
    if (T_LIST.callmic) {
      $(dod).find(".call").show();
    } else {
      $(dod).find(".call").hide();
    }
    if (T_LIST.callsot) {
      $(dod).find(".sot").show();
    } else {
      $(dod).find(".sot").hide();
    }
    $(dod)
      .find(".tbox")
      .addClass("tbox" + id)
      .keyup(function (e) {
        if (e.keyCode == 13) {
          e.preventDefault();
          sendpm({ data: { uid: id } });
        }
        if (uptyping) updateTyping(id);
      })
      .on("blur", function () {});
    var ubg = u.bg;
    if (ubg == "") {
      ubg = "#FAFAFA";
    }
    $(dod).find(".head").append(uhead());
    dod.find(".u-ico").attr("src", ico);
    $(".dad").append(dod);
    emopop(".emo" + id);
    $(dod)
      .find(".head .u-pic")
      .css("background-image", "url('" + removegifpic(u.pic) + "')")
      .css("width", "20px")
      .css("height", "20px")
      .parent()
      .click(function () {
        upro(id);
        $("#upro").css("z-index", "2002");
      });
    $(dod)
      .find(".head .u-topic")
      .css("color", u.ucol)
      .css("background-color", ubg)
      .html(u.topic);
    $(dod)
      .find(".head .phide")
      .click(function () {
        $(dod).removeClass("active").hide();
      });
      $(dod)
  .find(".uhash")
  .text(u.idreg);
    $("#c" + id)
      .find(".uzr")
      .click(function () {
        $("#c" + id).removeClass("unread");
        msgs();
      });
    updateu(id);
  }
  if (open) {
    /* [FIX-C11/P1] إخفاء النوافذ النشطة مباشرة بدل النقر الاصطناعي على كل
       .phide (كان يمر بأحداث jQuery كاملة على كل النوافذ + ينفّذ onclick
       المضمّن لنوافذ البوب فيزيلها). نفس الأثر بالضبط بمرحلة واحدة. */
    $(".dad > .c-flex.bgg").removeClass("active").each(function () {
      this.style.display = "none";
    });
    $(".dad > .bgg").not(".c-flex").remove();
    $(".w" + id)
      .css("display", "")
      .addClass("active")
      .show();
    $(".pn2").hide();
    setTimeout(function () {
      fixSize(1);
      $(".w" + id)
        .find(".d2")
        .scrollTop($(".w" + id).find(".d2")[0].scrollHeight);
    }, 50);
    $("#dpnl").hide();
  } else {
    if ($(".w" + id).css("display") == "none") {
      $("#c" + id).addClass("unread");
    }
  }
  msgs();
}
function popover(el, data, pos) {
  var e = $(el);
  e.popover({
    placement: pos || "top",
    html: true,
    content: function () {
      return $(data)[0].outerHTML;
    },
    title: "",
  });
}
function msgs() {
  var co = $("#chats").find(".unread").length;
  if (co != 0) {
    $(".chats").css("color", "orange").find("span").text(co);
  } else {
    $(".chats").css("color", "").find("span").text("");
  }
  }
var uhd = "*";
function uhead() {
  if (uhd == "*") {
    uhd = $("#uhead").html();
  }
  return uhd;
}
(function ($) {
  $.fn.popTitle = function (html) {
    var popclose = this.parent().parent().find(".phide").detach();
    this.parent().parent().find(".pophead").html(html).prepend(popclose);
    return this;
  };
  $.fn.pop = function (options) {
    if (this.hasClass("pop")) {
      return this.find(".popbody").children(0).pop(options);
    }
    switch (options) {
      case "show":
        if (this.parent().hasClass("popbody") == false) {
          this.pop();
        }
        $(".pop").css("z-index", 2e3);
        this.parent().parent().css("z-index", 2001);
        this.parent().parent().css("display", "");
        fixSize();
        return this;
        break;
      case "hide":
        this.parent().parent().css("display", "none");
        return this;
        break;
      case "remove":
        this.parent().parent().remove();
        return this;
        break;
    }
    var settings = $.extend(
      {
        width: "50%",
        height: "50%",
        top: "5px",
        left: "5px",
        title: "",
        close: "hide",
        bg: $(document.body).css("background-color"),
      },
      options
    );
    var popup = $(
      '<div class="pop corner" style="border:1px solid lightgrey;display:none;max-width:95%;position:absolute;z-index:2000;top:' +
        settings.top +
        ";left:" +
        settings.left +
        '"></div>'
    ).css({
      "background-color": settings.bg,
      width: settings.width,
      height: settings.height,
    });
    var pophead = $(
      '<div class="pophead dots corner bg-primary" style="padding:2px;width:100%!important;"></div>'
    ).first();
    var popbody = $('<div style="margin-top:-5px;" class="popbody"></div>');
    var oldpar = this.parent();
    popbody.append(this);
    pophead.html(settings.title);
    pophead.prepend(
      "<span onclick=\"$(this).pop('" +
        settings.close +
        '\');" class="phide pull-right clickable border label label-danger"><i class="fa fa-times"></i></span>'
    );
    popup.on("resize", function () {
      popbody.css("height", popup.height() - pophead.outerHeight(true) + "px");
    });
    popup.append(pophead);
    popup.append(popbody);
    if (oldpar.length == 0) {
      $("#content").append(popup);
    } else {
      oldpar.append(popup);
    }
    return this;
  };
})(jQuery);
function getCSSRule(ruleName, deleteFlag) {
  ruleName = ruleName.toLowerCase();
  if (document.styleSheets) {
    for (var i = 0; i < document.styleSheets.length; i++) {
      var styleSheet = document.styleSheets[i];
      var ii = 0;
      var cssRule = false;
      do {
        if (styleSheet.cssRules) {
          cssRule = styleSheet.cssRules[ii];
        } else {
          cssRule = styleSheet.rules[ii];
        }
        if (cssRule) {
          if (cssRule.selectorText == ruleName) {
            if (deleteFlag == "delete") {
              if (styleSheet.cssRules) {
                styleSheet.deleteRule(ii);
              } else {
                styleSheet.removeRule(ii);
              }
              return true;
            } else {
              return cssRule;
            }
          }
        }
        ii++;
      } while (cssRule);
    }
  }
  return false;
}
function S_PIC(nb) {
  var e = $(
    "<input  accept='image/*' type='file' style='display:none;'/>"
  ).first();
  e.trigger("click");
  var xx;
  $(e).on("change", function () {
    if (nb == "user") {
      $(".spic").attr("src", "imgs/ajax-loader.gif");
    }
    var formData = new FormData();
    formData.append("photo", $(e).prop("files")[0]);
    xx = $.ajax({
      xhr: function () {
        var xhr = new window.XMLHttpRequest();
        xhr.upload.addEventListener(
          "progress",
          function (evt) {
            if (evt.lengthComputable) {
              var percentComplete = evt.loaded / evt.total;
            }
          },
          false
        );
        return xhr;
      },
      timeout: 0,
      url: "uppic?nf=" + nb,
      type: "POST",
      data: formData,
      datatype: "json",
      cache: false,
      processData: false,
      contentType: false,
      success: function (data) {
        setTimeout(() => {
          if (data.split("@")[1] == "user") {
            $(".spic").attr("src", data.split("@")[0]);
            $(".spic").css(
              "background-image",
              "url(" + data.split("@")[0] + ")"
            );
            SEND_EVENT_EMIT("SEND_EVENT_EMIT_PIC", { pic: data.split("@")[0] });
          } else if (data.split("@")[1] == "bot") {
            $(".spicbot").attr("src", data.split("@")[0]);
          }else  if (data.split("@")[1] == "roomback") {
            $(".backroom").attr("src", data.split("@")[0]);
          } else  if (data.split("@")[1] == "room") {
            $(".picroom").attr("src", data.split("@")[0]);
          }
        }, 1e3);
      },
      error: function (e) {
        $(".spic").attr("src", "");
        alert(e.responseJSON.message);
      },
    });
  });
}
function SEND_UP_FILE(id, onsend, accept) {
  PIC_FILE = null;
  if (!onsend) {
    var ispm = true;
  } else {
    var ispm = false;
  }
  if (U_CASH[M_ID]) {
    var nm = U_CASH[M_ID].topic;
  } else {
    var nm = "";
  }
  var e = $("<div></div>").first();
  if (onsend == "startrecorder") {
    e.append(
      "<input type='file' accept='audio/*' capture style='display:none;'/>"
    );
  } else {
    e.append(
      $("<input type='file' style='display:none;'/>").attr(
        "accept",
        accept || "image/*, video/*, audio/*"
      )
    );
  }
  e.children("input").trigger("click");
  var xx;
  $(e)
    .children("input")
    .on("change", function () {
      var sp = $(
        "<div class='mm msg fl' style='position: absolute;bottom: 36px;'><a class='fn fl'></a><button class='btn btn-danger fa fa-times cancl' style='width:64px;padding:2px;'>إلغاء</button></div>"
      );
      $("#d2" + id).append(sp);
      var formData = new FormData();
      formData.append("photo", $(e).children("input").prop("files")[0]);
      $(sp)
        .find(".cancl")
        .click(function () {
          $(sp).remove();
          xx.abort();
        });
      xx = $.ajax({
        xhr: function () {
          var xhr = new window.XMLHttpRequest();
          xhr.upload.addEventListener(
            "progress",
            function (evt) {
              if (evt.lengthComputable) {
                var percentComplete = evt.loaded / evt.total;
                const hr = $(
                  '<div style="width:270px" class="c-flex"><progress class="flex-grow-1 pgr" style="width:100%;" value="' +
                    parseInt(percentComplete * 100) +
                    '" max="100"></progress>' +
                    '<div class="light border d-flex" style="width:100%;">' +
                    '<span class="label label-primary dots nosel fl flex-grow-1" style="padding:2px;">' +
                    "%" +
                    parseInt(percentComplete * 100) +
                    " | " +
                    $(e).children("input").val().split("\\").pop() +
                    "</span></div></div>"
                );
                $(sp.find(".fn")).html(hr);
              }
            },
            false
          );
          return xhr;
        },
        timeout: 0,
        url:
          "upload?secid=u&nm=" +
          nm +
          "&pm=" +
          ispm +
          "&token=" +
          MY_T +
          "&fn=" +
          $(e).children("input").val().split(".").pop(),
        type: "POST",
        data: formData,
        cache: false,
        processData: false,
        contentType: false,
        success: function (data) {
          PIC_FILE = data;
          if (onsend != null) {
            onsend(data);
          } else {
            SEND_EVENT_EMIT("SEND_EVENT_EMIT_PM", {
              msg: "",
              link: data,
              id: id,
            });
          }
          $(e).remove();
          $(sp).remove();
        },
        error: function (e) {
          $(sp).remove();
          alert(e.responseJSON.message);
        },
      });
    });
}function SEND_Story() {
  if (getuser(M_ID).rep < T_LIST.story) {
    alert("عدد الايكات المطلوبة لإنشاء قصة " + T_LIST.story);
    return;
  }
  var e = $("<div></div>").first();
  e.append(
    "<input type='file'  accept='image/*, video/*' style='display:none;'/>"
  );
  e.children("input").trigger("click");
  var xx;
  $(e)
    .children("input")
    .on("change", function () {
      var sp = $(
        "<div class='fl'><button style='color: #fff;border: none;background: red;border-radius: 50%;margin-left: -5px;' class=' cancl'>X</button></div>"
      );
      $("#f1e").append(sp);
      var formData = new FormData();
      formData.append("photo", $(e).children("input").prop("files")[0]);
      $(sp)
        .find(".cancl")
        .click(function () {
          $(sp).remove();
          xx.abort();
        });
      xx = $.ajax({
        xhr: function () {
          var xhr = new window.XMLHttpRequest();
          xhr.upload.addEventListener(
            "progress",
            function (evt) {
              if (evt.lengthComputable) {
                var percentComplete = evt.loaded / evt.total;
                                          $('#filestory').show();
                                $('#filestory').val(parseInt(percentComplete * 100));
              }
            },
            false
          );
          return xhr;
        },
        timeout: 0,
        url: "uploadstory",
        type: "POST",
        data: formData,
        cache: false,
        processData: false,
        contentType: false,
        success: function (data) {
          SEND_EVENT_EMIT("SEND_EVENT_EMIT_ADD_STORY", {
            type: data.split("@")[1].split("/")[0],
            url: data.split("@")[0],
            time: Number(data.split("@")[2]),
          });
          $(e).remove();
          $('#filestory').hide();
          $(sp).remove();
        },
        error: function (e) {
          $(sp).remove();
          $('#filestory').hide();
          alert(e.responseJSON.message);
        },
      });
    });
}
function Tclear() {
  $("#room > .d2").html("");
}
function setv(e, t) {
  "undefined" != typeof Storage ? localStorage.setItem(e, t) : setCookie(e, t);
}
function getv(e) {
  if ("undefined" != typeof Storage) {
    var t = localStorage.getItem(e);
    return ("null" == t || null == t) && (t = ""), t;
  }
  return getCookie(e);
}
function setCookie(e, t) {
  var o = new Date();
  o.setTime(o.getTime() + 287712e5);
  var n = "expires=" + o.toUTCString();
  document.cookie =
    e + "=" + encodeURIComponent(t).split("'").join("%27") + "; " + n;
}
function getCookie(e) {
  for (
    var t, o = e + "=", n = document.cookie.split(";"), d = 0;
    d < n.length;
    d++
  ) {
    for (t = n[d]; " " == t.charAt(0); ) t = t.substring(1);
    if (-1 != t.indexOf(o))
      return decodeURIComponent(t.substring(o.length, t.length));
  }
  return "";
}
async function fg(e) {
  try {
    var t = ic.get(e.user, e.it);
    t || (t = await vb(e.user, e.it));
    var o = new RTCSessionDescription(e.sdp);
    await t.setRemoteDescription(o),
      await t.setLocalDescription(await t.createAnswer()),
      fm({
        it: Number(e.it),
        target: e.user,
        type: "video-answer",
        sdp: t.localDescription,
      });
  } catch (e) {
    fl(e);
  }
}
async function fh(e) {
  var t = ic.get(e.user, e.it);
  await t.setRemoteDescription(e.sdp).catch(fl);
}
async function fi(e) {
  var t = ic.get(e.user, e.it),
    o = new RTCIceCandidate(e.candidate);
  try {
    await t.addIceCandidate(o);
  } catch (e) {
    fl(e);
  }
}
function fk(e, t, o) {
  switch (e.name) {
    case "NotFoundError":
      fs(
        "غير قادر على الانظام الى البث الصوتي بسبب ان هناك مشكله بالوصل الى الميكروفون الخاص بك"
      );
      break;
    case "SecurityError":
    case "PermissionDeniedError":
      break;
    default:
      fs("خطأ في الى الميكروفون");
  }
  fj(o, t);
}
function fl(e) {
  console.log(`Error ${e.name}: ${e.message}`);
}
function fs(e) {
  ON_DATE_SEND("not", { force: true, msg: e, user: "" });
}
uf = {
  kw: "الكويت",
  et: "إثيوبيا",
  az: "أذربيجان",
  am: "أرمينيا",
  aw: "أروبا",
  er: "إريتريا",
  es: "أسبانيا",
  au: "أستراليا",
  ee: "إستونيا",
  il: "فلسطين",
  af: "أفغانستان",
  ec: "إكوادور",
  ar: "الأرجنتين",
  jo: "الأردن",
  ae: "الإمارات العربية المتحدة",
  al: "ألبانيا",
  bh: "مملكة البحرين",
  br: "البرازيل",
  pt: "البرتغال",
  ba: "البوسنة والهرسك",
  ga: "الجابون",
  dz: "الجزائر",
  dk: "الدانمارك",
  cv: "الرأس الأخضر",
  ps: "فلسطين",
  sv: "السلفادور",
  sn: "السنغال",
  sd: "السودان",
  se: "السويد",
  so: "الصومال",
  cn: "الصين",
  iq: "العراق",
  ph: "الفلبين",
  cm: "الكاميرون",
  cg: "الكونغو",
  cd: "جمهورية الكونغو الديمقراطية",
  de: "ألمانيا",
  hu: "المجر",
  ma: "المغرب",
  mx: "المكسيك",
  sa: "المملكة العربية السعودية",
  uk: "المملكة المتحدة",
  gb: "المملكة المتحدة",
  no: "النرويج",
  at: "النمسا",
  ne: "النيجر",
  in: "الهند",
  us: "الولايات المتحدة",
  jp: "اليابان",
  ye: "اليمن",
  gr: "اليونان",
  ag: "أنتيغوا وبربودا",
  id: "إندونيسيا",
  ao: "أنغولا",
  ai: "أنغويلا",
  uy: "أوروجواي",
  uz: "أوزبكستان",
  ug: "أوغندا",
  ua: "أوكرانيا",
  ir: "إيران",
  ie: "أيرلندا",
  is: "أيسلندا",
  it: "إيطاليا",
  pg: "بابوا-غينيا الجديدة",
  py: "باراجواي",
  bb: "باربادوس",
  pk: "باكستان",
  pw: "بالاو",
  bm: "برمودا",
  bn: "بروناي",
  be: "بلجيكا",
  bg: "بلغاريا",
  bd: "بنجلاديش",
  pa: "بنما",
  bj: "بنين",
  bt: "بوتان",
  bw: "بوتسوانا",
  pr: "بورتو ريكو",
  bf: "بوركينا فاسو",
  bi: "بوروندي",
  pl: "بولندا",
  bo: "بوليفيا",
  pf: "بولينزيا الفرنسية",
  pe: "بيرو",
  by: "بيلاروس",
  bz: "بيليز",
  th: "تايلاند",
  tw: "تايوان",
  tm: "تركمانستان",
  tr: "تركيا",
  tt: "ترينيداد وتوباجو",
  td: "تشاد",
  cl: "تشيلي",
  tz: "تنزانيا",
  tg: "توجو",
  tv: "توفالو",
  tk: "توكيلاو",
  to: "تونجا",
  tn: "تونس",
  tp: "تيمور الشرقية",
  jm: "جامايكا",
  gm: "جامبيا",
  gl: "جرينلاند",
  pn: "جزر البتكارين",
  bs: "جزر البهاما",
  km: "جزر القمر",
  cf: "أفريقيا الوسطى",
  cz: "جمهورية التشيك",
  do: "جمهورية الدومينيكان",
  za: "جنوب أفريقيا",
  gt: "جواتيمالا",
  gp: "جواديلوب",
  gu: "جوام",
  ge: "جورجيا",
  gs: "جورجيا الجنوبية",
  gy: "جيانا",
  gf: "جيانا الفرنسية",
  dj: "جيبوتي",
  je: "جيرسي",
  gg: "جيرنزي",
  va: "دولة الفاتيكان",
  dm: "دومينيكا",
  rw: "رواندا",
  ru: "روسيا",
  ro: "رومانيا",
  re: "ريونيون",
  zm: "زامبيا",
  zw: "زيمبابوي",
  ws: "ساموا",
  sm: "سان مارينو",
  sk: "سلوفاكيا",
  si: "سلوفينيا",
  sg: "سنغافورة",
  sz: "سوازيلاند",
  sy: "سوريا",
  sr: "سورينام",
  ch: "سويسرا",
  sl: "سيراليون",
  lk: "سيريلانكا",
  sc: "سيشل",
  rs: "صربيا",
  tj: "طاجيكستان",
  om: "عمان",
  gh: "غانا",
  gd: "غرينادا",
  gn: "غينيا",
  gq: "غينيا الاستوائية",
  gw: "غينيا بيساو",
  vu: "فانواتو",
  fr: "فرنسا",
  ve: "فنزويلا",
  fi: "فنلندا",
  vn: "فيتنام",
  cy: "قبرص",
  qa: "قطر",
  kg: "قيرقيزستان",
  kz: "كازاخستان",
  nc: "كاليدونيا الجديدة",
  kh: "كامبوديا",
  hr: "كرواتيا",
  ca: "كندا",
  cu: "كوبا",
  ci: "ساحل العاج",
  kr: "كوريا",
  kp: "كوريا الشمالية",
  cr: "كوستاريكا",
  co: "كولومبيا",
  ki: "كيريباتي",
  ke: "كينيا",
  lv: "لاتفيا",
  la: "لاوس",
  lb: "لبنان",
  li: "لشتنشتاين",
  lu: "لوكسمبورج",
  ly: "ليبيا",
  lr: "ليبيريا",
  lt: "ليتوانيا",
  ls: "ليسوتو",
  mq: "مارتينيك",
  mo: "ماكاو",
  fm: "ماكرونيزيا",
  mw: "مالاوي",
  mt: "مالطا",
  ml: "مالي",
  my: "ماليزيا",
  yt: "مايوت",
  mg: "مدغشقر",
  eg: "مصر",
  mk: "مقدونيا، يوغوسلافيا",
  mn: "منغوليا",
  mr: "موريتانيا",
  mu: "موريشيوس",
  mz: "موزمبيق",
  md: "مولدوفا",
  mc: "موناكو",
  ms: "مونتسيرات",
  me: "مونتينيغرو",
  mm: "ميانمار",
  na: "ناميبيا",
  nr: "ناورو",
  np: "نيبال",
  ng: "نيجيريا",
  ni: "نيكاراجوا",
  nu: "نيوا",
  nz: "نيوزيلندا",
  ht: "هايتي",
  hn: "هندوراس",
  nl: "هولندا",
  hk: "هونغ كونغ",
  wf: "واليس وفوتونا",
};
mime = {
  mov: "video/mov",
  aac: "audio/aac",
  m4a: "audio/m4a",
  avi: "video/x-msvideo",
  gif: "image/gif",
  ico: "image/x-icon",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  mid: "audio/midi",
  midi: "audio/midi",
  mp2: "audio/mpeg",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  mpa: "video/mpeg",
  mpe: "video/mpeg",
  mpeg: "video/mpeg",
  oga: "audio/ogg",
  ogv: "video/ogg",
  png: "image/png",
  svg: "image/svg+xml",
  tif: "image/tiff",
  tiff: "image/tiff",
  wav: "audio/x-wav",
  weba: "audio/webm",
  webm: "video/webm",
  webp: "image/webp",
  "3gp": "video/3gpp",
  "3gp2": "video/3gpp2",
};

/* [FIX-MODAL-SCROLL] لما نافذة صغيرة (تنبيه / تبليغ / أي مودال) تتقفل فوق نافذة البروفايل،
   bootstrap كان بيشيل class "modal-open" من الـ body فنافذة البروفايل المفتوحة تفقد السكرول.
   هنا: لو لسه فيه مودال مفتوح بعد القفل نرجّع الكلاس. */
(function () {
  if (window.__nestedModalFix) return;
  window.__nestedModalFix = 1;
  function hook() {
    var $ = window.jQuery;
    if (!$) return setTimeout(hook, 200);
    $(document).on("hidden.bs.modal", ".modal", function () {
      if ($(".modal.in").length) $(document.body).addClass("modal-open");
    });
  }
  hook();
})();
