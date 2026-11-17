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

function CHECK_UP() {
  if (
    needUpdate &&
    $("#dpnl:visible").find("#users.active,#rooms.active").length > 0
  ) {
    updateusers();
    updaterooms();
    needUpdate = false;
    N_SORT = true;
  }
  if (N_SORT && $("#dpnl:visible").find("#rooms.active").length) {
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
  setTimeout(function () {
    searchForRooms();
  }, 600);
}
searchForRooms();


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
  $('*[data-toggle="tab"]').on("shown.bs.tab", function (e) {
    fixSize();
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
 seostop = setInterval(function () {
    REFRESH_ONLINE_USERS();
  }, 5e3);
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
    Storage.prototype.getItem = function () {
      return null;
    };
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
  if (data.includes("png")) {
    return data;
  } else if (data.includes("picroom")) {
    return data;
  } else {
    return data.replace(".jpg", ".jpg.jpg");
  }
}
function imageExists(image_url) {
  var http = new XMLHttpRequest();
  http.open("HEAD", image_url, false);
  http.send();
  return http.status != 404;
}
function removegifs(data) {
  if (imageExists(data.replace("gif", "jpg") + ".jpg")) {
    return data.replace("gif", "jpg") + ".jpg";
  } else {
    return data;
  }
}
function REFRESH_ONLINE_USERS() {
  $.get("GET_ALL_USER_ONLINE", function (d) {
    if (typeof d == "string") {
      d = JSON.parse(d);
    }
    var data = d;
    pws = data.powers;
    var lonline = $(".lonline");
    lonline.children().remove();
    var uhtml = $("#uhtml").html();
    $(".s1").text(data.online.length);
    $.each(data.online, function (i, e) {
      if (e.s == true) {
        return;
      }
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
        );
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
        uh.find(".u-ico").attr("src", ico);
      }
      lonline.append(uh);
    });
  });
}
function fixSize(again) {
  
   var w = $(document.body).innerWidth();
    $(document.documentElement).css('height', $(window).height() - 2 + 'px');
    docss()
    startcss()
    var lonline = $(".lonline");
    if (lonline.length > 0) {
        lonline.css('height', $(window).height() - lonline.position().top - 5 + 'px');
    }
    $("#dpnl").css("left", $('.dad').width() - ($('#dpnl').width() + 2) + 'px').css('height', $('#room').height() - ($("#d0").height() + 2) + 'px').css('top', '0px')
    if (again != 1) { setTimeout(function () { fixSize(1); }, 10) } else { $('#d2').scrollTop($("#d2")[0].scrollHeight); }
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
    $(e).css("width", par.width() - wd - 12 + "px");
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
    $(e).css("height", par.height() - wd - 1 + "px");
  });
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
      $("#users")
        .find(".uid" + this.id)
        .addClass("inroom");
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
  }
}
function fmutes(e) {
  e.preventDefault(), e.stopPropagation();
  var t = $(this);
  var o = t.parent(),
    n = o.attr("id").replace("prod", "");
  name = t.find("#name").attr("class");
  if (n === M_ID || jstp.createroom) {
    $(".stopmic").css("display", "block");
  } else {
    $(".stopmic").css("display", "none");
  }
  if (t.find("#showpf").css("display") == "block") {
    t.find("#showpf").hide();
  } else {
    if (spsh) {
      spsh.hide();
    }
    t.find("#showpf").show();
    spsh = t.find("#showpf");
  }
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
      isstopmic = setInterval(() => {
		    $(".prod").find("audio").each(function() {
        this.pause();
			});
      }, 2e3);
    }

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
          return U_CASH[M_ID].rep >= T_LIST.mic
            ? void (
                !ie &&
                navigator.mediaDevices
                  .getUserMedia({ audio: { noiseSuppression: false } })
                  .then(function (n) {
                    (ie = n),
                      fq(e, true, n),
                      socket.emit("SEND_EVENT_EMIT_BROADCASTING", {cmd: "new", it: {t}}),
                      (o.ev = true),
                      (o.id = M_ID);
                  })
                  .catch(function (e) {
                    fk(e, t, M_ID);
                  })
              )
            : void alert("عدد الايكات المطلوبة للمايك " + T_LIST.mic);
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
      e.addClass("is_speaking");
    }),
    n.addEventListener("ended", () => {
      e.removeClass("is_speaking");
    });
  n.addEventListener("canplay", () => {
    e.addClass("is_speaking");
  });
  n.addEventListener("canplaythrough", () => {
    n.play();
  }),
    n.play(),
    $(n).appendTo(e);
}
var ib = null;
function fx(e) {
  switch (e.cmd) {
    case "new":
      if (e.user) {
        (ia[e.it].ev = true), (ia[e.it].id = e.user);
        var t = U_CASH[e.user],
          o = $(".broadcasters .prod[data='" + e.it + "']");
        o.attr("id", "prod" + t.id),
          o.find("#showpf > .sounds").attr("id", t.id),
          o.find("#showpf > .profiles").attr("id", t.id),
          o.children().hide(),
          o.find("#name").text(t.topic.slice(0, 8)),
          o.css("background-image", "url(" + removegifpic(t.pic) + ")"),
          o.find(".evant").show();
      } else {
        ib = e.it;
        for (var t, n = 0; n < C_L_U.length; n++)
          (t = C_L_U[n]), t.id !== M_ID && t.roomid === M_ROOM && fn(t.id, ib);
      }
      break;
    case "err":
      fs(e.msg);
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
    case "all":
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
    case "hang-up":
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
  fq($("#prod" + t.currentTarget.socketId), false, t.streams[0]);
}
function fm(e) {
  var t = JSON.stringify(e);
  socket.emit("SEND_EVENT_EMIT_BROADCASTING", {cmd: "send", mj: {t}});
}
function fj(t, o) {
  var n = ic.get(t, o),
    s = $("#prod" + t + " audio");
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
function ON_DATE_SEND(cmd, data) {
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
      case "feather":
        if (window.FEATHER_RECV) FEATHER_RECV(data);
        break;
      case "xo":
        if (window.XO_RECV) XO_RECV(data);
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
              $(".u-topic1").text(e.topic);
              $(".rankt1").text(e.evaluation);
              $(".u-topic1").css("color", "rgb(252 186 41)");
            } else if (i == 1) {
              $(".u-top2").attr("src", removegifpic(e.pic));
              $(".u-top2").css("border", "3px solid hsl(216deg 25% 80%)");
              $(".rankt2").text(e.evaluation);
              $(".u-topic2").text(e.topic);
              $(".u-topic2").css("color", "hsl(216deg 25% 80%)");
            } else if (i == 2) {
              $(".u-top3").attr("src", removegifpic(e.pic));
              $(".u-top3").css("border", "3px solid hsl(23deg 84% 70%)");
              $(".u-topic3").css("color", "hsl(23deg 84% 70%)");
              $(".rankt3").text(e.evaluation);
              $(".u-topic3").text(e.topic);
            } else {
              var uh = $(utop);
              uh.find(".ntop").text(i + 1);
              uh.find(".u-topic").text(e.topic);
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
          hr.attr("onclick", "ShowStory(" + JSON.stringify(e) + ","+i+");");
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
            clearInterval(seostop);
            socket.emit("autocoo",1);
            M_ID = data.id;
            MY_T = data.ttoken;
            if(!data.ifedit){
              $("button.border.label.mini.label-success.hand.fa.fa-edit.fr.prof,.listHome").remove();
          }
            window.VISIT_NOTIF = !!data.visitnotif;
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
            $(".d2bc").on("scroll", () => {
              if ($(".d2bc").scrollTop() == 0) {
                msgload = false;
                $("#bcmore").hide();
              } else {
                msgload = true;
              }
            });
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
          updateu(e.id, e);
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
              updateu(e.id, e);
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
          if ($("#notification").find(".notification").length > 30) {
            $(".notification").first().remove();
          }
         if ($("#wetchprofilenotifi").find(".notification").length > 30) {
  $("#wetchprofilenotifi .notification").first().remove();
}
          uhn
            .find(".u-topic")
            .css({ "background-color": user.bg, color: user.ucol });
          var ico = getico(user);
          if (ico != "") {
            uh.find(".u-ico").attr("src", ico);
            uhn.find(".u-ico").attr("src", ico);
          }
          not.append(uh);
           if(data.msg.includes('هذا المستخدم قد زار بروفايلك')){
          $("#wetchprofilenotifi").append(uhn);
		  }else{
          $("#notification").append(uhn);
      }
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
        $(".dad").append(not);
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
          $.each(data, function (i, e) {
            AddMsg(".d2bc", e);
          });
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
		  updateTimes()

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
            $("#c" + data.pm)
              .find(".u-msg")
              .html($("<div><i class='fa fa-picture-o'></i> صورة</div>"));
          } else if (data.msg.includes("wav")) {
            $("#c" + data.pm)
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
            $("#c" + data.pm)
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
            $("#c" + data.pm)
              .find(".u-msg")
              .html(
                $("<div><i class='fa fa-file-video-o'></i> مقطع صوت</div>")
              );
          } else {
            $("#c" + data.pm)
              .find(".u-msg")
              .text(gettext($("<div>" + data.msg + "</div>")));
          }
          $("#c" + data.pm).insertAfter("#chats .chatsh");
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
          AddMsg("#d2", data);
          break;
        }
      case "visitnotif":
        window.VISIT_NOTIF = !!(data && data.on);
        if (window.visitNotifPaint) { window.visitNotifPaint(); }
        break;
      case "delmsg":
        if (M_ID) {
          $(".mi" + data).remove();
        }
        break;
      case "evs":
	  console.log(data);
	  break;
      case "ev":
        /* [FIX-S01] eval(data) حُذف — نسخة قديمة غير مستخدمة من x2.js لكن تبقى مؤمّنة */
        break;
      case "ulist":
        if (M_ID) {
          C_L_U = data;
          $("#busers").text(
            $.grep(C_L_U, function (e) {
              return e.s == null;
            }).length
          );
          $.each(C_L_U, function (i, e) {
            U_CASH[e.id] = e;
            AddUser(e.id, e);
          });
        }
        break;
      case "u-":
        if (M_ID) {
          if (U_X[data]) {
            U_X[data].remove();
          }
          delete U_CASH[data];
          delete U_X[data];
          for (var i = 0; i < C_L_U.length; i++) {
            if (C_L_U[i].id == data) {
              C_L_U.splice(i, 1);
              break;
            }
          }
          wclose(data);
          $("#busers").text(
            $.grep(C_L_U, function (e) {
              return e.s == null;
            }).length
          );
        }
        break;
      case "u+":
        if (M_ID) {
          var ou = getuserbylid(data.lid);
          if (ou != null) {
            console.error(data);
            ON_DATE_SEND("u-",ou.id)
            return;
          }
          U_CASH[data.id] = data;
          C_L_U.push(data);
          AddUser(data.id, data);
          updateu(data.id, data);
          needUpdate = true;
          $("#busers").text(
            $.grep(C_L_U, function (e) {
              return e.s == null;
            }).length
          );
        }
        break;
      case "ur":
        if (M_ID) {
        
          var e = data[0],
            w = data[1],
            a = R_CASH[w],
            s = U_CASH[e];
          e == M_ID &&
            ((M_ROOM = w),
            (!a || !a.broadcast) && $(".broadcasters").html(""),
            $(".broadcasters").css("display", "none")),
            null != s &&
              ((s.roomid = w), (needUpdate = true), roomChanged(e == M_ID));
          if (e == M_ID && !(Date.now() < (window.__SR_QUIET_UNTIL || 0))) { // [ADDED] لا نفتح قائمة المتصلين أثناء/بعد إعادة الاتصال الصامتة
            setTimeout(function () {
              $('button[data-target="#users"]').click();
            }, 600);
          }
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
          if (C_L_U == null) {
            return;
          }
          if (U_X[data.id] == null) {
            return;
          }
          Object.assign(U_CASH[data.id], data);
          if (Object.keys(data).length == 1 && data.rep != null) {
            return;
          }
          var ou = U_CASH[data.id];
          updateu(data.id, ou);
          if (
            ou.topic != data.topic ||
            ou.power != data.power ||
            ou.roomid != data.roomid
          ) {
            needUpdate = true;
          }
          break;
        }
      case "r^":
        if (M_ID) {
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
          $("#brooms").prop("title", "غرف الدردشه : " + C_L_R.length);
        }
        break;
        case "proplame":
console.log(data);
break;
      case "rlist":
        if (M_ID) {
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
          R_CASH[data.id] = data;
          C_L_R.push(data);
          addroom(data);
          $("#brooms").prop("title", "غرف الدردشه : " + C_L_R.length);
        }
        break;
      case "r-":
        if (M_ID) {
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
function AddUser(id, user) {
  var u = $(uhtml);
  if ($(".uid" + id).length) {
    return;
  }
  var ico = getico(user);
  if (ico != "") {
    u.find(".u-ico").attr("src", ico);
  }
  u.addClass("uid" + id);
  u.addClass("hid");
  u.attr("onclick", `upro('${user.id}');`);
  $("#users").append(u);
  U_X[id] = $(".uid" + id);
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
  var uh = U_X[id];
  uh.find(".ustat").attr("src", stat);
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
  if (u.meiut) {
    uh.find(".muted").toggleClass("fa-ban", true);
  } else {
    uh.find(".muted").toggleClass("fa-ban", false);
  }
  if (ismuted(u)) {
    uh.find(".muted").toggleClass("fa-ban", true);
  } else {
    uh.find(".muted").toggleClass("fa-ban", false);
  }
 uh.attr("v", getpower(u.power).rank);
if (ico && !getpower(u.power).rank) {
  uh.attr("v", 10);
}
  if (ico != "") {
    uh.find(".u-ico").attr("src", ico);
  } else {
    uh.find(".u-ico").removeAttr("src");
  }
  
  uh.find(".uhash").text(u.idreg);
  uh.find(".u-topic")
    .html(u.topic)
    .css({ "background-color": u.bg, color: u.ucol });
  uh.find(".u-msg").html(emo(u.msg)).css("color", u.mscol);
  uh.find(".u-pic").css(
    "background-image",
    'url("' + removegifpic(u.pic) + '")'
  );
  uh.find(".u-pic")
  .css("border", "2px solid " + u.copic);
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
    uh = $(".w" + id).find(".head .uzr");
    uh.find(".ustat").attr("src", stat);
    if (ico != "") {
      uh.find(".u-ico").attr("src", ico);
    }
  }
  stealthit(u);
  return;
}
var needUpdate = false;
var lastus = "";
function usearch() {
  if ($("#usearch").val() != lastus) {
    lastus = $("#usearch").val();
    if (lastus != "") {
      $("#usearch").removeClass("bg");
    } else {
      $("#usearch").addClass("bg");
    }
    $("#users .uzr").css("display", "");
    $.each(
      $.grep(C_L_U, function (value) {
        return (
          value.topic
            .split("ـ")
            .join("")
            .toLowerCase()
            .indexOf(lastus.split("ـ").join("").toLowerCase()) == -1 &&
          value.idreg.indexOf(lastus) != 0 &&
          value.idreg.indexOf(lastus) != 1
        );
      }),
      function (i, e) {
        U_X[e.id].css("display", "none");
      }
    );
  }
  setTimeout(function () {
    usearch();
  }, 600);
}
usearch();
function updateusers() {
  if (needUpdate == false) {
    return;
  }
  var elems = $("#users")
    .find(".uzr")
    .sort(function (a, b) {
      var av = parseInt($(a).attr("v") || 0);
      var bv = parseInt($(b).attr("v") || 0);
      if ($(a).hasClass("inroom")) {
        av += 1e5;
      }
      if ($(b).hasClass("inroom")) {
        bv += 1e5;
      }
      if ($(a).hasClass("ninr")) {
        av += 9999;
      }
      if ($(b).hasClass("ninr")) {
        bv += 9999;
      }
      if (av == bv) {
        return ($(a).find(".u-topic").text() + "").localeCompare(
          $(b).find(".u-topic").text() + ""
        );
      }
      return av < bv ? 1 : -1;
    });
  $(".usr").html(elems);
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
function Tsend() {
  var m = $("#tbox").val().split("\n").join("");
  $("#tbox").val("");
  $("#tbox").focus();
  if (m == "%0A" || m == "%0a" || m == "" || m == "\n") {
    return;
  }
  SEND_EVENT_EMIT("SEND_EVENT_EMIT_MSG", {
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
function emo(data) {
  for (i = 0; i < MAX_EMO; i++) {
    var emov = "ف";
    var rg = new RegExp(
      "(^| )" + emov + "([0-9][0-9][0-9]|[0-9][0-9]|[0-9])( |$|\n)"
    );
    var match = rg.exec(data);
    if (match != null) {
      const index = emos.findIndex((x) => x.type == match[2]);
      if (index != -1) {
        data = data.replace(
          rg,
          '$1<img src="emo/' +
            emos[index].path +
            '" alt="ف$2" title="ف$2" class="emoi">$3'
        );
      }
    }
  }
  return data;
}
setInterval(function () { updateTimes(); }, 30000);
function updateTimes() {
  $.each($(".tago"), function (i, e) {
    if ($(e).attr("ago") == null) {
      $(e).attr("ago", new Date().getTime());
    } else {
      $(e).html(agoo(parseInt($(e).attr("ago"))));
    }
  });
}
function agoo(d) {
  var dd = new Date().getTime() - d;
  var v = Math.abs(dd) / 1e3;
  if (v < 59) {
    ("الآن");
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
    const reply = $(".isreply");
    reply.html("");
    reply.css("display", "none");
    fixSize();
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
	$('.isreply').show();
    fixSize();
}
var msglist = [];

function AddMsg(wid, data) {
  var msg = $(umsg);
  var u = U_CASH[data.uid];
  msg.find(".u-pic")
  .css("background-image", 'url("' + removegifpic(data.pic) + '")')
 .css("border", "2px solid " + data.copic)
  .attr("onclick", `upro('${data.uid}');`);
  msg.find(".borderg.fl.fitimg.hand.u-pic")
  .css("border", "2px solid " + data.copic);
   msg.find(".tago").text(agoo((new Date).getTime())).attr("ago", (new Date).getTime());
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
    }
  var yt = ytVidId(data.msg.replace(/\n/g, ""));
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
        msg.find(".breply").attr("onclick", "replaymsg({id:'" + data.mi + "',msg:$(this).parent().find('.u-msg').text(),topic:$(this).parent().find('.u-topic').text()});").show();
        msg.find(".breply").click(function() {
          replaymsg({topic:data.topic,id:data.mi,msg:data.msg}); 
        });
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
  if (isbc == true) {
    msg.prependTo(w);
  } else {
    msg.appendTo(w);
  }
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
    if (isbc == true) {
		if( !msgload){
        if (w.find(".mm").length >= 100) {
            $(wid + " .mm")
                .last()
                .remove();
        }
        if (w[0].scrollTop == 0) {
            w.scrollTop(msg.innerHeight());
        }
		w.scrollTop(0);
		};
    } else {
        if (w.find(".mm").length >= 36) {
            $(wid + " .mm")
                .first()
                .remove();
        }
		w.scrollTop(w[0].scrollHeight)
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
function upro(id) {
  socket.emit('vistor',id);
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
  ht.find(".star").html("");
  ht.find(".timetoday").text("");
  ht.find(".pointtop").text("");
  if(u.youtube){
		$('.isyoutube').show();
	}else{
		$('.isyoutube').hide();		
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
    pba.empty();
    for (var i = 0; i < C_L_R.length; i++) {
      var hh = $("<option></option>");
      hh.attr("value", C_L_R[i].id);
      if (C_L_R[i].id == M_ROOM) {
        hh.css("color", "blue");
        hh.attr("selected", "true");
      }
      hh.text(
        "[" +
          $("#rooms .r" + C_L_R[i].id)
            .attr("v")
            .padStart(2, "0") +
          "]" +
          C_L_R[i].topic
      );
      pba.append(hh);
    }
    var options = $("#rooms .roomz option");
    var arr = options
      .map(function (_, o) {
        return { t: $(o).text(), v: o.value };
      })
      .get();
    arr.sort(function (o1, o2) {
      var t1 = o1.t.toLowerCase(),
        t2 = o2.t.toLowerCase();
      return t1 > t2 ? -1 : t1 < t2 ? 1 : 0;
    });
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
upsearchInput.on("input", function () {
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
    pws = pws.sort(function (a, b) {
      return b.rank - a.rank;
    });
    ht.find(".userpower").show();
    var pb = ht.find(".userpower");
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
        pb.append(hh);
      }
    }
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
  } else {
    ht.find(".ukick").show();
    ht.find(".udelpic").show();
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
    $(".phide").trigger("click");
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
