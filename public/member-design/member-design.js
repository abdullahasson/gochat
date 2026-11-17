(function(){
  'use strict';
  var LIMITS = { cover: 5 * 1024 * 1024, music: 10 * 1024 * 1024 };
  var current = {cover:'', cover_full:0, profile_bg:'', member_card_color:'', profile_music:'', profile_music_name:'', social_telegram:'', social_facebook:'', social_whatsapp:'', welcome_msg:''};
  /* ================= profile visitors notification on/off ================= */
  function visitNotifyOn(v){ return !(v === 0 || v === false || v === '0'); }
  function updateVisitNotifyUi(){
    var on = $('#mdVisitNotifyOn').prop('checked');
    $('#mdVisitNotifyHint').text(on ? 'مفعّل: يصلك تنبيه عند دخول أي شخص لبروفايلك.' : 'متوقف: لن يصلك أي تنبيه بمن دخل بروفايلك.');
  }
  /* ================= welcome banner: char counter ================= */
  function updateWelcomeCount(){ $('#mdWelcomeCount').text(String($('#mdWelcomeMsg').val() || '').length); }
  var busy = 0;
  var audios = [];

  function esc(v){return String(v||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function color(v, fallback){ return /^#[0-9a-f]{6}$/i.test(v||'') ? v : fallback; }
  /* [ADDED - GRADIENT] لون الكارت: لون سادة أو تدرج مرمّز (h|v|m:#aaa:#bbb:#ccc) — الباقي لسه بيستخدم color() */
  function gcolor(v, fallback){ return (window.mdGrad ? window.mdGrad.valid(v) : /^#[0-9a-f]{6}$/i.test(v||'')) ? v : fallback; }
  function safeUrl(v){ v = String(v||''); return (v && !/["'()\\<>\s]/.test(v)) ? v : ''; }
  function isCustomCover(v){ v = safeUrl(v); return !!v && !/(^|\/)site\/cover\.png$/.test(v); }
  function allowed(){ return !!(window.jstp && (jstp.memberdesign || jstp.owner || (window.featAccess && featAccess.any()))); }   /* [CHANGED - FEATURE ACCESS] */



  /* ================= cover: عرض الصورة على كامل الغلاف (كارت واحد) ================= */
  function updateCoverFullUi(){
    var has = !!current.cover;
    $('#mdCoverFullRow').toggle(has);
    if(!has){ $('#mdCoverFull').prop('checked', false); current.cover_full = 0; }
  }

  /* ================= youtube link on/off ================= */
  function decodeText(v){ var t = document.createElement('textarea'); t.innerHTML = String(v == null ? '' : v); return t.value; }
  function ytOn(v){ return !(v === 0 || v === false || v === '0'); }
  function updateYoutubeUi(){
    var on = $('#mdYoutubeOn').prop('checked'), has = !!$.trim($('.urluto').val() || '');
    $('#mdYoutubeField').toggleClass('yt-off', !on);
    $('#mdYoutubeHint').text(on ? 'مفعّل: تظهر أيقونة اليوتيوب لمن يفتح بروفايلك.' : 'متوقف: لن تظهر الأيقونة لأحد (الرابط محفوظ).');
    $('#mdYtPreview').toggle(on && has);
  }

  /* ================= social links ================= */
  var ICONS = {
    tg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>',
    fb: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z"/></svg>',
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>'
  };
  window.mdSocialIcons = ICONS; /* [STUDIO V2] الاستوديو الجديد بيعرض نفس الأيقونات في المعاينة */
  var SOCIAL = [
    {key:'social_telegram', ic:'tg', input:'mdTelegram', title:'تيليجرام', hosts:['t.me']},
    {key:'social_facebook', ic:'fb', input:'mdFacebook', title:'فيس بوك', hosts:['www.facebook.com','facebook.com','fb.me','fb.com']},
    {key:'social_whatsapp', ic:'wa', input:'mdWhatsapp', title:'واتساب', hosts:['wa.me','chat.whatsapp.com']}
  ];
  /* only https links to the expected hosts are ever rendered as <a href> */
  function socialUrl(v, hosts){
    v = String(v || '').trim();
    if(!v || /["'<>\\\s]/.test(v)) return '';
    try{ var u = new URL(v); if(u.protocol !== 'https:' || hosts.indexOf(u.hostname.toLowerCase()) === -1) return ''; return u.href; }catch(e){ return ''; }
  }
  function socialRow(getVal, asLink){
    var row = $('<div class="md-social-row"></div>');
    SOCIAL.forEach(function(sc){
      var raw = getVal(sc.key); if(!raw) return;
      var el;
      if(asLink){
        var url = socialUrl(raw, sc.hosts); if(!url) return;
        el = $('<a class="md-soc" target="_blank" rel="noopener noreferrer nofollow"></a>').attr('href', url);
      } else el = $('<span class="md-soc"></span>');
      el.addClass('md-soc-' + sc.ic).attr('title', sc.title).html(ICONS[sc.ic]);
      row.append(el);
    });
    return row;
  }
  function renderSocialPreview(){
    $('#mdSocialPreview').empty().append(socialRow(function(k){ return current[k]; }, false).children());
  }

  /* ================= compact music player ================= */
  function pauseAll(except){ for(var i = 0; i < audios.length; i++){ if(audios[i] !== except){ try{ audios[i].pause(); }catch(e){} } } }
  /* [PERF] Audio element واحد دايم لكل مكان (بروفايل / معاينة الأستوديو) بيتعاد استخدامه: مفيش new Audio() في كل فتح،
     ومفيش listeners بتتراكم (بنشيلها في unmount)، والـ src ما بيتغيّرش لو نفس الأغنية. */
  var slots = {};
  function slotAudio(host){
    var k = host.attr('id') || 'x';
    if(!slots[k]){ var a = new Audio(); a.preload = 'none'; slots[k] = a; audios.push(a); }
    return slots[k];
  }
  function unmountPlayer(host){
    var off = host.data('mdpOff'); if(off){ try{ off(); }catch(e){} host.removeData('mdpOff'); }
    var old = host.data('mdpAudio');
    if(old){ try{ old.pause(); }catch(e){} }
    host.removeData('mdpAudio').empty();
  }
  /* [ADDED - MUSIC PLAYER MOVE] أعمدة المشغل تتحرك مع الأغنية نفسها (AnalyserNode). بنوصّل الـ analyser بس لو الملف من نفس الدومين
     والـ AudioContext شغّال فعلاً — غير كده الصوت ممكن يتكتم، فبنسيب أنيميشن الـ CSS كبديل. */
  var vizAC = window.AudioContext || window.webkitAudioContext, vizCtx = null;
  function vizSameOrigin(u){ try{ return new URL(u, location.href).origin === location.origin; }catch(e){ return false; } }
  function vizAnalyser(audio, cb){
    if(audio.__mdpAn) return cb(audio.__mdpAn);
    if(!vizAC || !vizSameOrigin(audio.src)) return;
    try{
      if(!vizCtx) vizCtx = new vizAC();
      var go = function(){
        if(vizCtx.state !== 'running') return;
        if(audio.__mdpAn) return cb(audio.__mdpAn);
        try{
          var node = vizCtx.createMediaElementSource(audio), an = vizCtx.createAnalyser();
          an.fftSize = 64; an.smoothingTimeConstant = .72;
          node.connect(an); an.connect(vizCtx.destination);
          audio.__mdpAn = an; cb(an);
        }catch(e){}
      };
      if(vizCtx.state === 'running') go(); else if(vizCtx.resume) vizCtx.resume().then(go, function(){});
    }catch(e){}
  }
  function mountPlayer(host, src){
    if(!host || !host.length) return;
    unmountPlayer(host);
    src = safeUrl(src); if(!src) return;
    var el = $('<div class="mdp"><button type="button" class="mdp-btn" aria-label="تشغيل"><i class="fa fa-play"></i></button>' +
      '<div class="mdp-eq"><b></b><b></b><b></b><b></b><b></b></div></div>');
    /* [FIX - UPRO TABS] حجم صغير زي شارة الايك/النقط بالظبط، متفروض inline+important عشان يشتغل
       حتى لو نسخة قديمة من member-design.css متكاشيه عند حد */
    el[0].style.setProperty('gap', '8px', 'important');
    el[0].style.setProperty('margin', '6px auto', 'important');
    el[0].style.setProperty('padding', '3px 10px 3px 3px', 'important');
    el.find('.mdp-btn')[0].style.setProperty('width', '20px', 'important');
    el.find('.mdp-btn')[0].style.setProperty('height', '20px', 'important');
    el.find('.mdp-btn')[0].style.setProperty('font-size', '9px', 'important');
    el.find('.mdp-btn i')[0].style.setProperty('font-size', '9px', 'important');
    el.find('.mdp-eq')[0].style.setProperty('height', '14px', 'important');
    el.find('.mdp-eq')[0].style.setProperty('gap', '2px', 'important');
    el.find('.mdp-eq b').each(function(){ this.style.setProperty('width', '2px', 'important'); }); /* [FIX - MUSIC PLAYER MOVE] شيلنا height inline !important — كان بيغلب أنيميشن mdpEq فالمشغل يفضل ثابت */
    var audio = slotAudio(host);
    if(audio.getAttribute('src') !== src){ try{ audio.pause(); }catch(e){} audio.src = src; }
    host.data('mdpAudio', audio);
    var btn = el.find('.mdp-btn'), icon = btn.find('i');
    var viz = {raf: 0, live: false, an: null, data: null};
    var BIN = [2, 4, 7, 11, 15];
    function vizStop(){
      viz.live = false; if(viz.raf){ cancelAnimationFrame(viz.raf); viz.raf = 0; }
      el.removeClass('mdp-live'); el.find('.mdp-eq b').each(function(){ this.style.removeProperty('height'); });
    }
    function vizLoop(){
      if(!viz.live || audio.paused || audio.ended){ viz.raf = 0; return; }
      viz.an.getByteFrequencyData(viz.data);
      var bs = el.find('.mdp-eq b');
      for(var i = 0; i < bs.length; i++){ var v = viz.data[BIN[i]] || 0; bs[i].style.setProperty('height', (3 + Math.round(v / 255 * 11)) + 'px', 'important'); }
      viz.raf = requestAnimationFrame(vizLoop);
    }
    function paint(){ var playing = !audio.paused && !audio.ended; el.toggleClass('playing', playing); icon.attr('class', 'fa ' + (playing ? 'fa-pause' : 'fa-play')); btn.attr('aria-label', playing ? 'إيقاف مؤقت' : 'تشغيل'); 
      if(playing){
        vizAnalyser(audio, function(an){
          if(audio.paused || audio.ended) return;
          viz.an = an; viz.data = new Uint8Array(an.frequencyBinCount); viz.live = true; el.addClass('mdp-live');
          if(!viz.raf) viz.raf = requestAnimationFrame(vizLoop);
        });
      } else vizStop();
    }
    btn.on('click', function(e){
      e.stopPropagation();
      if(audio.paused){ pauseAll(audio); var p = audio.play(); if(p && p.catch) p.catch(function(){ el.addClass('err').attr('title', 'تعذر تشغيل الملف'); }); }
      else audio.pause();
    });
    function onEnded(){ audio.currentTime = 0; paint(); }
    function onErr(){ el.addClass('err').attr('title', 'تعذر تشغيل الملف'); paint(); }
    audio.addEventListener('play', paint); audio.addEventListener('pause', paint);
    audio.addEventListener('ended', onEnded); audio.addEventListener('error', onErr);
    host.data('mdpOff', function(){
      audio.removeEventListener('play', paint); audio.removeEventListener('pause', paint);
      audio.removeEventListener('ended', onEnded); audio.removeEventListener('error', onErr);
      vizStop();
    });
    host.append(el);
  }

  /* ================= studio: status / progress ================= */
  function ensureBox(inputId){
    var inp = $('#' + inputId); if(!inp.length) return $();
    var id = inputId + 'Box', box = $('#' + id);
    if(!box.length){ box = $('<div id="' + id + '" class="md-upbox" style="display:none"><div class="md-bar"><i></i></div><div class="md-msg"></div></div>'); inp.after(box); }
    return box;
  }
  function setStatus(inputId, kind, text, pct){
    var box = ensureBox(inputId); if(!box.length) return;
    box.show().attr('data-kind', kind || '');
    box.find('.md-msg').text(text || '');
    var bar = box.find('.md-bar');
    if(typeof pct === 'number') bar.show().find('i').css('width', pct + '%'); else bar.hide();
  }

  /* ================= studio: open / close / preview ================= */
  window.openMemberDesignStudio = function(){
    if(!allowed()){ if(typeof SendNotification === 'function') SendNotification({state:'me',topic:'',force:1,msg:'ليس لديك صلاحية استوديو تصميم العضوية',user:''}); return; }
    /* [FIX] أي خطأ وإحنا بنجهّز الحقول (أو في atars()) كان بيوقف الدالة قبل ما النافذة تظهر أصلًا، فالزر "مايفتحش".
       دلوقتي كل خطوة في try/catch مستقلة والنافذة بتظهر دايمًا (والخطأ بيتسجل في الكونسول بعلامة [member-design]).
       وبنعمل stop(true,true) قبل fadeIn عشان أي أنيميشن fadeOut عالق ما يمنعش الظهور. */
    function safe(label, fn){ try{ fn(); }catch(err){ if(window.console) console.error('[member-design] ' + label, err); } }
    safe('reset save buttons', function(){ if(!busy) $('.member-design-save').prop('disabled', false); });
    safe('fill fields', function(){
      var u = (window.U_CASH && U_CASH[window.M_ID]) || {};
      current.cover = isCustomCover(u.cover) ? safeUrl(u.cover) : '';
      current.cover_full = current.cover ? (u.cover_full ? 1 : 0) : 0;
      $('#mdCoverFull').prop('checked', !!current.cover_full);
      updateCoverFullUi();
      current.profile_bg = color(u.profile_bg, '');
      current.member_card_color = gcolor(u.member_card_color, '');
      current.profile_music = safeUrl(u.profile_music);
      current.profile_music_name = current.profile_music ? (u.profile_music_name || '') : '';
      $('#mdProfileBg').val(current.profile_bg || '#ffffff');
      $('#mdCardColor').val(current.member_card_color || '#ffffff');
      SOCIAL.forEach(function(sc){ current[sc.key] = String(u[sc.key] || ''); $('#' + sc.input).val(current[sc.key]); });
      current.welcome_msg = String(u.welcome_msg || '').slice(0, 240);
      $('#mdWelcomeMsg').val(current.welcome_msg); updateWelcomeCount();
      $('.urluto').val(decodeText(u.youtube)); $('#mdYoutubeOn').prop('checked', ytOn(u.youtube_on)); updateYoutubeUi();
      $('#mdVisitNotifyOn').prop('checked', visitNotifyOn(u.visitor_notify_on)); updateVisitNotifyUi();
      $('#mdCover').val(''); $('#mdMusic').val('');
      $('#mdCoverBox, #mdMusicBox').hide();
    });
    /* [MOVED - FRAMES/BG] قايمة الأطر والخلفيات جوه الاستوديو نفسه، فبنحمّلها أول ما الاستوديو يفتح */
    safe('atars', function(){ if(typeof atars === 'function'){ atars(); } });
    safe('updatePreview', updatePreview);
    $('#memberDesignStudio').stop(true, true).fadeIn(120);
  };
  window.closeMemberDesignStudio = function(){ $('#memberDesignStudio').fadeOut(100); unmountPlayer($('#mdPreviewPlayer')); };

  function updatePreview(){
    /* [CHANGED - PROFILE COVER] المعاينة بقت زي البروفايل الحقيقي: "خلفية البروفايل (صورة)" خلف الكل،
       وغلاف الأعلى (profile_cover من الإعدادات، أو صورة العضو مغبّشة لو مفيش) والصورة الشخصية دايرة على اليسار */
    var meU = (window.U_CASH && U_CASH[window.M_ID]) || {}, pcv = safeUrl(meU.profile_cover), av = safeUrl(meU.pic);
    updateCoverFullUi();
    var full = !!(current.cover && current.cover_full);
    $('#mdProfilePreview').toggleClass('md-cover-full', full)
      .css({'background-color': current.profile_bg || '#fff', 'background-image': current.cover ? 'url("' + current.cover + '")' : 'none', 'background-size': 'cover', 'background-position': 'center'});
    $('#mdProfilePreview .md-avatar').css('background-image', (av && !full) ? 'url("' + av + '")' : 'none');
    /* [CHANGED - GRADIENT] معاينة الكارت الجانبية: تدرج لو القيمة مرمّزة، وإلا لون سادة زي الأول */
    (function(v){ var g = window.mdGrad ? window.mdGrad.css(v) : ''; $('#mdCardPreview').css(g ? {'background-image': g, 'background-color': ''} : {'background-image': 'none', 'background-color': v || '#fff'}); })(current.member_card_color);
    $('#mdProfilePreview .md-cover').toggleClass('md-blur', !pcv).css('background-image', (pcv || av) ? 'url("' + (pcv || av) + '")' : 'none');
    $('#mdBgDef').toggle(!current.profile_bg); $('#mdCardDef').toggle(!current.member_card_color);
    $('#mdCoverName').text(current.cover ? 'تم اختيار صورة' : 'لم يتم اختيار ملف');
    $('#mdMusicName').text(current.profile_music ? (current.profile_music_name || 'تم اختيار أغنية') : 'لم يتم اختيار ملف');
    $('.md-del[data-del=cover]').prop('disabled', !current.cover);
    $('.md-del[data-del=bg]').prop('disabled', !current.profile_bg);
    $('.md-del[data-del=card]').prop('disabled', !current.member_card_color);
    $('.md-del[data-del=music]').prop('disabled', !current.profile_music);
    $('.md-del[data-del=welcome]').prop('disabled', !current.welcome_msg);
    renderSocialPreview();
    var host = $('#mdPreviewPlayer'), audio = host.data('mdpAudio');
    if(!current.profile_music) unmountPlayer(host);
    else if(!audio || audio.getAttribute('src') !== current.profile_music) mountPlayer(host, current.profile_music);
  }

  /* ================= قائمة "..." لأزرار الرد/الاقتباس/الحذف تحت الرسالة =================
     ما بنلمسش أزرار blike/breply/bdel نفسها ولا مكانها في الشجرة، بس بنتحكم في إظهار
     الصندوق (.msg-actions) اللي بيتحركوا جواه، عشان ربط زر الرد بالحائط يفضل شغال زي ما هو */
  /* بنحط القايمة بـ position:fixed وبنحسب مكانها بالنسبة لزرار "..." نفسه (getBoundingClientRect)،
     عشان تفلت من overflow:auto بتاعة حاوية الرسايل (#d2 / #wall) وتبان فعلاً بدل التوهج الأسود بس */
  function placeMsgActions(btn, box){
    box.css({top: '-9999px', left: '-9999px'}).addClass('msg-actions-open');
    var r = btn.getBoundingClientRect();
    var bw = box.outerWidth() || 92, bh = box.outerHeight() || 21;
    var vw = window.innerWidth, vh = window.innerHeight;
    var top = r.top - bh - 3;
    if(top < 4){ top = Math.min(vh - bh - 4, r.bottom + 3); }
    var left = r.left;
    if(left + bw > vw - 4){ left = vw - 4 - bw; }
    if(left < 4){ left = 4; }
    box.css({top: top + 'px', left: left + 'px'});
  }
  $(document).on('click', '.msg-menu-btn', function(e){
    e.stopPropagation();
    e.stopImmediatePropagation();
    var btn = this;
    var box = $(this).closest('.uzr.flex-fill.break').find('.msg-actions');
    var wasOpen = box.hasClass('msg-actions-open');
    $('.msg-actions').removeClass('msg-actions-open');
    if(!wasOpen) placeMsgActions(btn, box);
  });
  $(document).on('click', function(){ $('.msg-actions').removeClass('msg-actions-open'); });
  $(document).on('click', '.msg-actions', function(e){ e.stopPropagation(); e.stopImmediatePropagation(); });
  /* لو اتعمل سكرول في حاوية الرسايل والقايمة فاتحة، لازم نقفلها - مكانها محسوب لحظة الفتح بس ومش هيتحرك مع السكرول */
  /* [PERF-FIX - SCROLL] بدل ما نجمّع كل .msg-actions ونعمل removeClass على كل حدث سكرول: نتأكد الأول إن فيه قايمة مفتوحة فعلًا (getElementsByClassName حية ومتكاشّية → O(1)) */
  $('#d2, #wall').on('scroll', function(){ if(document.getElementsByClassName('msg-actions-open').length){ $('.msg-actions').removeClass('msg-actions-open'); } });
  $(window).on('resize', function(){ $('.msg-actions').removeClass('msg-actions-open'); });

  /* ================= studio: delete buttons ================= */
  $(document).on('click', '.md-del', function(){
    var what = $(this).attr('data-del');
    if(what === 'cover'){ current.cover = ''; current.cover_full = 0; $('#mdCover').val(''); $('#mdCoverBox').hide(); $('#mdCoverFull').prop('checked', false); }
    else if(what === 'bg'){ current.profile_bg = ''; $('#mdProfileBg').val('#ffffff'); }
    else if(what === 'card'){ current.member_card_color = ''; $('#mdCardColor').val('#ffffff'); }
    else if(what === 'music'){ current.profile_music = ''; current.profile_music_name = ''; $('#mdMusic').val(''); $('#mdMusicBox').hide(); }
    else if(what === 'welcome'){ current.welcome_msg = ''; $('#mdWelcomeMsg').val(''); updateWelcomeCount(); }
    updatePreview();
  });
  $('#mdProfileBg').on('input change', function(){ current.profile_bg = color($(this).val(), ''); updatePreview(); });
  $(document).on('change', '#mdCoverFull', function(){ current.cover_full = $(this).prop('checked') ? 1 : 0; updatePreview(); });
  $(document).on('input change', '.urluto, #mdYoutubeOn', updateYoutubeUi);
  $(document).on('input change', '#mdVisitNotifyOn', updateVisitNotifyUi);
  $(document).on('input', '#mdWelcomeMsg', function(){ current.welcome_msg = String($(this).val() || '').slice(0, 240); updateWelcomeCount(); });
  SOCIAL.forEach(function(sc){ $('#' + sc.input).on('input change', function(){ current[sc.key] = $(this).val().trim(); renderSocialPreview(); }); });
  $('#mdCardColor').on('input change', function(){ current.member_card_color = gcolor($(this).val(), ''); updatePreview(); });

  /* ================= studio: upload with progress ================= */
  function upload(inputId, type, file){
    return new Promise(function(resolve, reject){
      if(!file) return resolve(null);
      if(!window.MY_T) return reject(new Error('الجلسة غير جاهزة، أعد تسجيل الدخول'));
      if(file.size > LIMITS[type]) return reject(new Error('حجم الملف كبير (الحد الأقصى ' + Math.round(LIMITS[type] / 1048576) + ' ميجا)'));
      var fd = new FormData(); fd.append('file', file);
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/member-design/upload?type=' + encodeURIComponent(type) + '&token=' + encodeURIComponent(window.MY_T));
      xhr.upload.onprogress = function(e){ if(e.lengthComputable){ var p = Math.round(e.loaded * 100 / e.total); setStatus(inputId, 'load', 'جاري الرفع... ' + p + '%', p); } };
      xhr.onload = function(){
        var j = null; try{ j = JSON.parse(xhr.responseText); }catch(e){}
        if(xhr.status >= 200 && xhr.status < 300 && j && j.url) resolve(j); else reject(new Error((j && j.msg) || ('فشل الرفع (' + xhr.status + ')')));
      };
      xhr.onerror = function(){ reject(new Error('تعذر الاتصال بالسيرفر')); };
      xhr.ontimeout = function(){ reject(new Error('انتهت مهلة الرفع')); };
      xhr.timeout = 120000;
      setStatus(inputId, 'load', 'جاري الرفع... 0%', 0);
      xhr.send(fd);
    });
  }
  function handleUpload(inputId, type, onDone){
    $('#' + inputId).on('change', function(){
      var input = this, file = input.files && input.files[0]; if(!file) return;
      busy++; $('.member-design-save').prop('disabled', true);
      upload(inputId, type, file).then(function(j){ onDone(j, file); setStatus(inputId, 'ok', 'تم الرفع بنجاح ✔'); })
        .catch(function(e){ setStatus(inputId, 'err', (e && e.message) || 'فشل رفع الملف'); input.value = ''; })
        .then(function(){ busy--; if(!busy) $('.member-design-save').prop('disabled', false); });
    });
  }
  handleUpload('mdCover', 'cover', function(j){ current.cover = j.url; updatePreview(); });
  handleUpload('mdMusic', 'music', function(j, file){ current.profile_music = j.url; current.profile_music_name = file.name.replace(/\.[^.]+$/, ''); updatePreview(); });

  /* ================= studio: save ================= */
  window.saveMemberDesign = function(){
    if(busy){ alert('انتظر حتى ينتهي رفع الملف'); return; }
    var d = {topic:($('.stopic').val()||''),msg:($('.smsg').val()||''),youtube:($('.urluto').val()||''),ucol:(window.mdNameShine ? window.mdNameShine.pick('#'+($('.scolor').val()||'000000').replace('#','')) : '#'+($('.scolor').val()||'000000').replace('#','')),mcol:'#'+($('.mcolor').val()||'000000').replace('#',''),mscol:'#'+($('.mscolor').val()||'000000').replace('#',''),bg:(window.mdGrad ? window.mdGrad.bgValue($('.sbg').val()) : '#'+($('.sbg').val()||'ffffff').replace('#','')),copic:'#'+($('.scopic').val()||'ffffff').replace('#',''),
      cover: current.cover || '', cover_full: (current.cover && current.cover_full) ? 1 : 0, profile_music: current.profile_music || '', profile_music_name: current.profile_music ? (current.profile_music_name || '') : '',
      member_card_color: current.member_card_color || '', profile_bg: current.profile_bg || '',
      social_telegram: current.social_telegram || '', social_facebook: current.social_facebook || '', social_whatsapp: current.social_whatsapp || '',
      welcome_msg: current.welcome_msg || '',
      youtube_on: $('#mdYoutubeOn').prop('checked') ? 1 : 0,
      visitor_notify_on: $('#mdVisitNotifyOn').prop('checked') ? 1 : 0};
    var u = (window.U_CASH && U_CASH[M_ID]) || {}; d.pic = u.pic; d.username = u.username;
    if(typeof setv === 'function') setv('uprofile', JSON.stringify(d));
    if(typeof SEND_EVENT_EMIT === 'function') SEND_EVENT_EMIT('SEND_EVENT_EMIT_PROFILE', d);
    window.closeMemberDesignStudio();
  };


  /* social icons in the profile, right under report / ignore buttons */
  function applyProfileSocial(u){
    var host = $('#memberProfileSocial');
    var row = socialRow(function(k){ return u[k]; }, true);
    if(!row.children().length){ host.remove(); return; }
    if(!host.length) host = $('<div id="memberProfileSocial"></div>');
    /* [FIX - UPRO QUICK ACTIONS] كان بيتحط بعد زرار uunmute (آخر عنصر في شبكة الأوامر)؛ الزرار اتنقل للغلاف فبنحطه آخر عنصر في نفس الشبكة بنفس النتيجة */
    var anchor = $('#upro .us-info').first(); /* [UPRO V2] السوشيال بقى ظاهر تحت الأزرار السريعة في الهيدر بدل لوحة الأوامر المخفية */
    if(!anchor.length) anchor = $('#upro .upro-actions').first();
    if(anchor.length) host.appendTo(anchor); else host.appendTo('#upro .pro');
    host.empty().append(row);
  }

  /* [ADDED - PROFILE FRAME] الإطار المتحرك على صورة البروفايل (#upro .us-pic) — نفس الإطار ونفس النسبة (إطار 44 على صورة 34)
     زي رسايل الغرفة والمتصلين. الإطار طبقة فوق الصورة (pointer-events:none) فما يأثرش على الضغط على الصورة. */
  function applyProfileFrame(url){
    var host = $('#upro .us-pic').first(); if(!host.length) return;
    var fr = host.children('.md-upro-frame');
    if(!url){ fr.remove(); return; }
    if(!fr.length) fr = $('<div class="md-upro-frame"></div>').appendTo(host);
    fr.css('background-image', 'url("' + url + '")');
  }
  /* ================= animated frame on room messages =================
     [PERF - ATAR/LMAA OPT] مسارات مكتبة atar/lmaa بتتحوّل للنسخة المصغّرة _t.webp اللي بيولّدها السيرفر
     (والسيرفر بيقدّم الأصل مباشرة لو النسخة المصغّرة مش أحسن). أي رابط تاني (خارجي/غريب) بيفضل زي ما هو. */
  /* [PERF-COVER-ANIM] غلاف البروفايل GIF (بيوصل MBs) → نسخة animated WebP ≤720px بيولّدها السيرفر (/mdesign/<name>_t.webp)؛
     لو مش أحسن السيرفر بيقدّم الأصل مباشرة. للعرض بس (مش بنحفظ الرابط ده في الإعدادات). أي رابط تاني بيفضل زي ما هو. */
  function coverOpt(url){
    url = String(url||'');
    return /^\/mdesign\/(?:profile_)?cover_[A-Za-z0-9_\-]+\.gif$/i.test(url) ? url.replace(/\.gif$/i, '_t.webp') : url;
  }
  function _optUrl(v){
    v = String(v||'').trim();
    return /^\/?(atar|lmaa)\/[^\/?#]+\.(png|jpe?g|gif|webp)$/i.test(v) ? v.replace(/\.[A-Za-z0-9]+$/, '_l.webp') : v;
  }
  function frameUrl(u){ return (u && u.ifedit) ? safeUrl(_optUrl(String(u.atar || ''))) : ''; }
  function applyMsgFrame(msg, url){
    var pic = msg.find('.u-pic').first(); if(!pic.length) return;
    var pk = url || '';
    if(pic[0]._mdf === pk && (!url || pic.parent('.md-avwrap').length)) return; /* [PERF] نفس الإطار متطبق */
    pic[0]._mdf = pk;
    var wrap = pic.parent('.md-avwrap');
    if(!url){ if(wrap.length){ wrap.children('.md-avframe').remove(); pic.unwrap(); } return; }
    if(!wrap.length){ pic.wrap('<div class="md-avwrap"></div>'); wrap = pic.parent(); }
    var fr = wrap.children('.md-avframe'); if(!fr.length) fr = $('<div class="md-avframe"></div>').appendTo(wrap);
    fr.css('background-image', 'url("' + url + '")');
    if(window.GCFrameStatic) window.GCFrameStatic.attach(fr[0], url); /* [FRAME STATIC] */
    /* الإطار المتحرك له الأولوية: نشيل الإطار الملون العادي عشان الإطار المتحرك يبان مظبوط على الصورة */
    pic.css('border', 'none');
  }
  /* ================= اللمعات: gif متحرك جوه حروف اسم العضو =================
     نفس فكرة الإطار (atar) بالظبط بس بيتطبق على نص الاسم بـ background-clip:text بدل الصورة.
     window.memberDesignApplyNameGlitter(el, u) بيتنده من x2.js (قايمة المتصلين + كارت التحديث)
     ومن هنا تحت (رسايل الغرفة + عنوان البروفايل)، عشان يبقى مكان واحد للمنطق ده. */
  function glitterUrl(u){ return (u && u.ifedit) ? safeUrl(_optUrl(String(u.lmaa || ''))) : ''; }
  /* [FIX - GLITTER VS NAME BG] المحاولة الأولى كانت بتحوّل لون الخلفية لـ box-shadow، لكن اتضح إن
     الـ box-shadow (inset) بيترسم فوق طبقة الخلفية (فوق صورة اللمعة) مش تحتها، فكان بيغطي اللمعة
     كليًا ومايفضلش ظاهر غير لون الخلفية بس. الحل الصح: نضيف طبقة خلفية تانية وهمية "none" جنب صورة
     اللمعة، عشان بالـ CSS (.md-name-glitter بقى فيها background-clip:text,border-box) لون الخلفية
     ياخد الكليب بتاع آخر طبقة (border-box = صندوق كامل) بينما صورة اللمعة (أول طبقة) تاخد كليب النص. */
  function applyNameGlitter(el, url){
    if(!el || !el.length) return;
    /* [PERF] change-detection: لو نفس اللمعة متطبقة بالفعل مانعيدش لمس الـ DOM/CSS */
    var g0 = el[0], key = url || '';
    if(g0._mdg === key && (!url || g0.classList.contains('md-name-glitter'))) return;
    g0._mdg = key;
    if(!url){ el.removeClass('md-name-glitter').css('background-image', ''); if(window.nameGlitterEnqueue) window.nameGlitterEnqueue(g0); /* [PERF-Y] التنضيف بعد إزالة الكلاس (المراقب مبقاش بيشوف class) */ return; }
    el.addClass('md-name-glitter').css('background-image', 'url("' + url + '"), none');
    if(window.nameGlitterEnqueue) window.nameGlitterEnqueue(g0); /* [PERF-X] المراقب مبقاش بيشوف تغييرات style */
  }
  window.memberDesignApplyNameGlitter = function(el, u){ applyNameGlitter(el, glitterUrl(u)); };
  /* ================= system messages (join / move / leave / logout) =================
     1) بنحدد نوع الرسالة من نصها ونحط عليها كلاس md-sys-* (الـ CSS بيلوّنها ويحط الأيقونة).
     2) بنشيل الأقواس "( )" وكلمة "هذا المستخدم" (الاسم ظاهر جنبها أصلًا) وبنلف كل نص في span عشان الصف يفضل سطر واحد
        وأسماء الغرف ما تتقصش أبدًا (النص هو اللي بيتقلّص بنقط مش الكبسولة).
     (اسم الغرفة اللي بيظهر في رسايل الدخول والتنقل هو الغرفة الجديدة بس، زي ما السيرفر بيبعتها.) */
  function styleSystemMsg(msg, u){
    var box = msg.find('.u-msg').first(); if(!box.length) return;
    var t = '';
    box.contents().filter(function(){ return this.nodeType === 3; }).each(function(){
      var v = this.nodeValue.replace(/^\s*\(\s*/, '').replace(/\s*\)\s*$/, '');
      t += ' ' + v;
      v = v.replace(/^\s*هذا المستخدم\s+/, '').trim();
      if(v) $(this).replaceWith($('<span class="md-sys-t"></span>').text(v)); else $(this).remove();
    });
    var type = '';
    if(/طرد|حظر|حذف/.test(t)) type = 'bad';
    else if(/غادر\s*الدردش|تسجيل\s*خروج/.test(t)) type = 'out';
    else if(/غادر\s*الغرف/.test(t)) type = 'leave';
    else if(/انتقل/.test(t)) type = 'move';
    else if(/دخل/.test(t)) type = 'join';
    if(type) msg.addClass('md-sys-' + type);
    /* [RESTYLED - SYS MSG = شكل الرسالة العادية] "<الاسم> : إنضم للغرفة (# أيقونة الرتبة اسم الرتبة #)".
       الاسم/الأيقونة/الإطار/اللمعة بتتطبق من AddMsg + memberDesignApplyMsg بنفس مسار الرسايل العادية (من U_CASH أو نسخة الخروج). */
    var verb = {join:'إنضم للغرفة', leave:'غادر الغرفة', out:'غادر الغرفة'}[type];
    if(verb){
      var ts = box.find('.md-sys-t');
      if(ts.length){ ts.first().text(verb); ts.slice(1).remove(); }
      else box.prepend($('<span class="md-sys-t"></span>').text(verb));
      if(type === 'join') box.find('.roomh').remove(); /* الغرفة هي الغرفة الحالية: مفيش داعي للزر */
    } else if(type === 'move'){
      /* التنقل بين الغرف: "غادر الغرفة" من غير اسم الغرفة الجديدة */
      var tm = box.find('.md-sys-t');
      if(tm.length){ tm.first().text('غادر الغرفة'); tm.slice(1).remove(); }
      else box.prepend($('<span class="md-sys-t"></span>').text('غادر الغرفة'));
      box.find('.roomh').remove();
    }
    if(u && type && type !== 'bad' && !box.find('.md-sys-rank').length){
      var pw = {}; try{ pw = (window.getpower && getpower(u.power)) || {}; }catch(e){}
      var nm = (pw.name && pw.name !== '_') ? String(pw.name) : (u.islogin && u.islogin !== 'عضو' ? String(u.islogin) : 'زائر');
      /* [CHANGED - SYS RANK NAME ONLY] اسم الرتبة فقط من غير رقمها؛ ولو الاسم نفسه فيه "رتبة 22" بنشيلها (طالما فاضل اسم) */
      var _nm2 = nm.replace(/\s*رتبة\s*\d+\s*$/, '').trim();
      if(_nm2) nm = _nm2;
      var ico = ''; try{ ico = window.getico ? getico(u) : ''; }catch(e){}
      var rk = $('<span class="md-sys-rank"></span>').append(document.createTextNode('(# '));
      if(ico) rk.append($('<img class="md-sys-ico" alt="">').attr('src', ico));
      rk.append(document.createTextNode(nm + ' #)'));
      var anchor = box.find('.md-sys-t').first();
      if(anchor.length) anchor.after(rk); else box.append(rk);
    }
  }
  /* ================= wall: reactions + comments bar under each post =================
     بدل الثلاث نقط في منشورات الحائط بس (.d2bc): تفاعلات (إعجاب / حب / ضحك) جنب بعض + أيقونة التعليقات (+ حذف لو العضو مسموح له).
     التعليقات بتفتح قايمة منسدلة تحت المنشور (مش نافذة منبثقة). الثلاث نقط في رسايل الغرفة (#d2) ما اتلمستش. السيرفر بيخزّن التفاعل في likes: "id" = إعجاب، "id:love"، "id:haha". */
  var WALL_REACTIONS = [
    {k:'like', label:'إعجاب',  src:'imgs/reactions/like.svg'},
    {k:'love', label:'أحببته', src:'imgs/reactions/love.svg'},
    {k:'haha', label:'أضحكني', src:'imgs/reactions/haha.svg'}
  ];
  function jsonList(raw){
    var a = raw; if(typeof a === 'string'){ try{ a = JSON.parse(a); }catch(e){ a = []; } }
    return Array.isArray(a) ? a : [];
  }
  function parseReactions(raw){
    var me = (window.U_CASH && window.M_ID && U_CASH[M_ID]) ? U_CASH[M_ID].idreg : '';
    me = (me === undefined || me === null) ? '' : String(me);
    var counts = {like:0, love:0, haha:0}, mine = '';
    jsonList(raw).forEach(function(x){
      var p = String(x).split(':'), t = (p[1] && counts.hasOwnProperty(p[1])) ? p[1] : 'like';
      counts[t]++; if(me && p[0] === me) mine = t;
    });
    return {counts: counts, mine: mine};
  }
  function paintReactions(bar, raw){
    var st = parseReactions(raw);
    bar.find('.wb-r').each(function(){
      var b = $(this), t = b.attr('data-type'), n = st.counts[t] || 0;
      b.toggleClass('on', st.mine === t).find('.wb-n').text(n > 0 ? String(n) : '');
    });
  }
  /* ---- التعليقات: قايمة منسدلة تحت المنشور بدل النافذة المنبثقة. أول ما تتفتح بتعرض آخر 3 تعليقات، و"عرض المزيد" بيزوّد 3 كل مرة ---- */
  var CM_STEP = 3;
  function cmRow(e){
    e = e || {};
    var head = $('<div class="wcm-h"></div>').append(
      $('<span class="wcm-n"></span>').html(e.topic || ''),
      $('<span class="wcm-t tago minix"></span>').attr('ago', String(e.time || new Date().getTime())));
    var txt = $('<div class="wcm-m break"></div>').html(window.emo ? emo(String(e.msg || '')) : String(e.msg || ''));
    return $('<div class="wcm-c"></div>').append(
      $('<img class="wcm-pic" alt="" draggable="false">').attr('src', String(e.pic || '')),
      $('<div class="wcm-b"></div>').append(head, txt));
  }
  function renderCm(bar, panel){
    var list = bar.data('cm') || [], n = list.length;
    var want = panel.data('shown') || CM_STEP, shown = Math.min(want, n), start = n - shown;
    var box = panel.find('.wcm-list').empty();
    if(!n) box.append('<div class="wcm-empty">لا توجد تعليقات بعد</div>');
    list.slice(start).forEach(function(e){ box.append(cmRow(e)); });
    var more = panel.find('.wcm-more');
    if(start > 0){ more.show().find('.wcm-left').text('(' + start + ')'); } else { more.hide(); }
    if(window.updateTimes) updateTimes();
  }
  function buildCm(bar, bid){
    var panel = $('<div class="wall-cm" style="display:none"></div>');
    var more = $('<button type="button" class="wcm-more">عرض المزيد <span class="wcm-left"></span></button>')
      .on('click', function(e){ e.stopPropagation(); panel.data('shown', (panel.data('shown') || CM_STEP) + CM_STEP); renderCm(bar, panel); });
    var ta = $('<textarea rows="1" placeholder="اكتب تعليقًا..."></textarea>');
    function send(){
      var v = String(ta.val() || '');
      if(!v.trim()) return;
      if(window.SEND_EVENT_EMIT) SEND_EVENT_EMIT('SEND_EVENT_EMIT_COMMENT_BC', {bid: bid, msg: v});
      ta.val('');
    }
    ta.on('keydown', function(e){ if(e.which === 13 && !e.shiftKey){ e.preventDefault(); send(); } });
    var btn = $('<button type="button" class="wcm-send fa fa-send" title="إرسال" aria-label="إرسال"></button>')
      .on('click', function(e){ e.stopPropagation(); send(); });
    panel.append(more, $('<div class="wcm-list"></div>'), $('<div class="wcm-form"></div>').append(ta, btn));
    return panel;
  }
  function toggleCm(bar, bid, btn){
    var panel = bar.next('.wall-cm');
    if(!panel.length){ panel = buildCm(bar, bid); bar.after(panel); }
    if(panel.data('open')){
      panel.data('open', false).stop(true, true).slideUp(150); btn.removeClass('open').attr('aria-expanded', 'false');
    } else {
      panel.data('open', true).data('shown', CM_STEP); renderCm(bar, panel);
      panel.stop(true, true).slideDown(150); btn.addClass('open').attr('aria-expanded', 'true');
    }
  }
  function paintComments(bar, raw){
    var list = jsonList(raw), prev = (bar.data('cm') || []).length;
    bar.data('cm', list);
    bar.find('.wb-c .wb-n').text(list.length > 0 ? String(list.length) : '');
    var panel = bar.next('.wall-cm');
    if(panel.length){
      if(list.length > prev) panel.data('shown', (panel.data('shown') || CM_STEP) + (list.length - prev));
      renderCm(bar, panel);
    }
  }
  function buildWallBar(msg, data){
    var body = msg.find('.uzr.flex-fill.break').first(); if(!body.length) return;
    var tl = window.T_LIST || {}, bid = String(data.bid);
    var bar = $('<div class="wall-bar"></div>').attr('data-bid', bid), any = false;
    if(tl.likebc){
      var grp = $('<div class="wb-react"></div>');
      WALL_REACTIONS.forEach(function(r){
        $('<button type="button" class="wb-r nosel"></button>').attr({'data-type': r.k, title: r.label, 'aria-label': r.label})
          .append($('<img alt="" draggable="false">').attr('src', r.src)).append('<span class="wb-n"></span>')
          .on('click', function(e){ e.stopPropagation(); if(window.SEND_EVENT_EMIT) SEND_EVENT_EMIT('SEND_EVENT_EMIT_LIKE_BC', {bid: bid, type: r.k}); })
          .appendTo(grp);
      });
      bar.append(grp); any = true;
    }
    if(tl.replaybc){
      $('<button type="button" class="wb-c nosel" title="التعليقات" aria-label="التعليقات" aria-expanded="false"><i class="fa fa-comment-o"></i><span class="wb-n"></span></button>')
        .on('click', function(e){ e.stopPropagation(); toggleCm(bar, bid, $(this)); })
        .appendTo(bar); any = true;
    }
    var me = (window.U_CASH && window.M_ID && U_CASH[M_ID]) || {};
    if((window.jstp && jstp.delbc) || (data.owner && data.owner == me.lid)){
      $('<button type="button" class="wb-d nosel" title="حذف المنشور" aria-label="حذف المنشور"><i class="fa fa-trash-o"></i></button>')
        .on('click', function(e){ e.stopPropagation(); if(window.confirm('حذف هذا المنشور؟') && window.SEND_EVENT_EMIT) SEND_EVENT_EMIT('SEND_EVENT_EMIT_DEL_BC', {bid: bid}); })
        .appendTo(bar); any = true;
    }
    if(!any) return;
    paintReactions(bar, data.likes); paintComments(bar, data.bcc);
    body.append(bar);
  }
  window.memberDesignWallUpdate = function(d){
    if(!d || d.bid === undefined || d.bid === null) return;
    var id = String(d.bid);
    $('.wall-bar').filter(function(){ return $(this).attr('data-bid') === id; }).each(function(){
      if(d.likes !== undefined) paintReactions($(this), d.likes);
      if(d.bcc !== undefined) paintComments($(this), d.bcc);
    });
  };
  window.memberDesignApplyMsg = function(msg, data, u, wid){
    if(msg && msg.hasClass && msg.hasClass('hmsg')) styleSystemMsg(msg, u);
    if(wid === '.d2bc' && msg && data && data.bid !== undefined && data.bid !== null){
      msg.addClass('wall-post'); /* تخطيط الحائط + إخفاء الثلاث نقط (اللي فيها نفس أزرار الشريط: إعجاب/تعليق/حذف) */
      try{ buildWallBar(msg, data); }catch(e){ if(window.console) console.error('[member-design] wall bar', e); }
    }
    if(wid !== '#d2' || !msg || !data) return;
    msg.attr('data-mduid', data.uid);
    indexMsg(msg[0], data.uid);
    applyMsgFrame(msg, frameUrl(u));
    applyNameGlitter(msg.find('.u-topic'), glitterUrl(u));
    if(window.mdGlow && u){ var tg = msg.find('.u-topic')[0]; if(tg) window.mdGlow.applyMsgName(tg, u.name_glow); } /* [ADDED - GLOW] توهج خلفية الاسم في رسائل الغرفة */
  };
  /* [PERF] فهرس رسائل #d2 حسب uid: msgIdx[uid] = [عناصر الرسائل]. بدل ما كل تحديث عضو يمسح كل رسائل الشات
     ($('#d2 .mm').filter)، بنروح مباشرة لرسائل العضو ده. العناصر اللي اتشالت من الـ DOM (DOM capping / مسح الشات)
     بتتنضّف بشكل lazy (isConnected) عند الاستعلام أو لما الفهرس يكبر، فمفيش حاجة لازم تتسجل وقت الحذف. */
  var msgIdx = {}, idxOps = 0;
  function pruneList(arr){ var live = []; for(var i = 0; i < arr.length; i++){ if(arr[i].isConnected) live.push(arr[i]); } return live; }
  function pruneAll(){ for(var k in msgIdx){ var l = pruneList(msgIdx[k]); if(l.length) msgIdx[k] = l; else delete msgIdx[k]; } }
  function indexMsg(el, uid){
    if(!el || uid === undefined || uid === null) return;
    var k = String(uid), arr = msgIdx[k] || (msgIdx[k] = []);
    if(arr.indexOf(el) === -1) arr.push(el);
    if(arr.length > 60) msgIdx[k] = pruneList(arr);
    if(++idxOps % 500 === 0) pruneAll();
  }
  window.memberDesignRefreshFrames = function(uid, u){
    var key = String(uid), arr = msgIdx[key];
    if(!arr) return;
    var url = frameUrl(u), gurl = glitterUrl(u), live = [];
    for(var i = 0; i < arr.length; i++){
      var el = arr[i];
      if(!el.isConnected) continue;
      live.push(el);
      var $el = $(el);
      applyMsgFrame($el, url);
      applyNameGlitter($el.find('.u-topic'), gurl);
      if(window.mdGlow && u){ var tg2 = $el.find('.u-topic')[0]; if(tg2) window.mdGlow.applyMsgName(tg2, u.name_glow); } /* [ADDED - GLOW] */
    }
    if(live.length) msgIdx[key] = live; else delete msgIdx[key];
  };
  /* نسخة مجمّعة (بعد ulist): بتنضّف الفهرس مرة وبتطبّق لكل عضو من الفهرس مباشرة — مفيش مسح لـ #d2 */
  window.memberDesignRefreshFramesBatch = function(list){
    if (!list || !list.length) return;
    pruneAll();
    for (var i = 0; i < list.length; i++){ if(msgIdx[String(list[i].id)]) window.memberDesignRefreshFrames(list[i].id, list[i]); }
  };
  window.memberDesignMsgIndexSize = function(){ var n = 0; for(var k in msgIdx) n += msgIdx[k].length; return n; };

  /* ================= member profile ================= */
  /* ------- welcome banner: ينزل من أعلى البروفايل لمنتصفه، يقف 4-5 ثواني، وبعدين يرجع لفوق -------
     بتظهر لأي حد يفتح البروفايل (upro() في x2.js بينده memberDesignApplyUser لنفس الحالتين: زائر أو صاحب البروفايل)
     [REVIEWED - PERF] خليت الحركة animate({top}) زي ما هي عن قصد: welcome-banner.js بيغلّف $.fn.animate
     لهذا العنصر بالذات (تصميم مقصود: نزول بطيء 2.6s + fade)، والتحويل لـ transform هيكسر السلوك ده.
     التكلفة ضئيلة (عنصر واحد position:absolute، حدث نادر). */
  var wbTimer = null, wbSeq = 0, wbEl = null;
  /* [PERF] عنصر البانر بيتعمل مرة واحدة ويتعاد استخدامه (hide/show) بدل remove/create في كل فتح.
     wbSeq = token: أي أنيميشن/تايمر قديم بيتجاهل نفسه لو اتفتح بروفايل تاني (كان stop(true,true) بيستدعي
     callback الأنيميشن القديم فيسيب تايمر يتقفل بعد التنظيف). */
  function killBanner(){
    clearTimeout(wbTimer); wbTimer = null; wbSeq++;
    if(wbEl){ wbEl.stop(true, false).hide(); }
  }
  window.memberDesignKillWelcome = killBanner;
  function hideWelcomeBanner(el, seq){
    if(!el || !el.length || seq !== wbSeq) return;
    var h = el.outerHeight() || 0;
    el.stop(true, false).animate({top: -(h + 12)}, 350, function(){ if(seq === wbSeq) $(this).hide(); });
  }
  function showWelcomeBanner(raw){
    killBanner();
    var host = $('#upro .modal-content').first();
    var msg = String(raw || '').slice(0, 240).trim();
    if(!msg || !host.length) return;
    if(!wbEl || !wbEl.length){ wbEl = $('<div id="uproWelcomeBanner" class="uwb"></div>'); }
    if(wbEl.parent()[0] !== host[0]) host.prepend(wbEl);
    var seq = wbSeq;
    var safeTxt = esc(msg), html = window.emo ? emo(safeTxt) : safeTxt;
    wbEl.html(html).css({top: -2000}).show();
    var h = wbEl.outerHeight() || 40;
    wbEl.css('top', -(h + 12));
    var mid = Math.max(0, Math.round(((host.innerHeight() || host.height() || 300) - h) / 2));
    wbEl.animate({top: mid}, 450, function(){
      if(seq !== wbSeq) return;
      wbTimer = setTimeout(function(){ hideWelcomeBanner(wbEl, seq); }, 4500);
    });
  }
  window.memberDesignApplyUser = function(u){
    if(!u) return;
    /* [ADDED - GLOW] توهج حواف البروفايل + خلفية الاسم مباشرة (من غير الاعتماد على لفّ glow-core) */
    if(window.mdGlow){ try{ window.mdGlow.applyEdge($('#upro .modal-content')[0], u.edge_glow); window.mdGlow.applyName($('#upro .modal-title')[0], ''); }catch(e){} }
    var pro = $('#upro .pro'), head = $('#upro .u-pic2');
    if(pro.length){
      var el = pro[0], bg = color(u.profile_bg, ''), hasCover = isCustomCover(u.cover);
      if(bg) el.style.setProperty('background-color', bg, 'important'); else el.style.removeProperty('background-color');
      if(hasCover){
        el.style.setProperty('background-image', 'url("' + coverOpt(safeUrl(u.cover)) + '")');
        el.style.setProperty('background-size', 'cover'); el.style.setProperty('background-position', 'center'); el.style.setProperty('background-repeat', 'no-repeat');
        head.css('background-image', 'none');
      } else {
        ['background-image','background-size','background-position','background-repeat'].forEach(function(k){ el.style.removeProperty(k); });
      }
      /* [CHANGED - COVER TEXT COLOR] الخط رصاصي زي الافتراضي دايمًا، وبيبقى أبيض بس لما يبقى فيه صورة خلفية
         مرفوعة فعلًا (مش مجرد لون خلفية) عشان يفضل واضح فوق الصورة */
      $('#upro').toggleClass('md-bg-active', hasCover);
      /* [ADDED - COVER FULL] لو مفعّل زرار "وضع الصورة على كامل الغلاف": البروفايل كله يبقى نفس الصورة
         دي بس (كارت واحد)، فبنشيل صورة الأفتار المنفصلة (u-pic2) اللي كانت هتغطي جزء من الصورة الواحدة */
      $('#upro').toggleClass('md-cover-full', hasCover && !!u.cover_full);
    }
    $('#upro .u-msg').css('color', u.mscol || ''); $('#upro .modal-title').css('color', u.ucol || '');
    applyNameGlitter($('#upro .modal-title'), glitterUrl(u));
    applyProfileSocial(u);
    applyProfileFrame(frameUrl(u)); /* [ADDED - PROFILE FRAME] */
    /* [ADDED - WELCOME BANNER] لازم قبل أي return مبكر (زي الخاص بالموسيقى تحت) عشان تظهر برضه لو مفيش أغنية */
    showWelcomeBanner(u.welcome_msg);
    var wrap = $('#memberProfileMusic'), music = safeUrl(u.profile_music);
    if(!music){ if(wrap.length){ unmountPlayer(wrap); wrap.remove(); } return; }
    if(!wrap.length) wrap = $('<div id="memberProfileMusic"></div>');
    var anchor = $('#upro .upro-player-anchor').first(); if(!anchor.length) anchor = $('#upro .u-msg').first(); /* [UPRO V2] المشغل بقى جوه الهيدر الداكن */
    /* [FIX - UPRO TABS] كان بيتحط بعد الحالة الكتابية (تحتها)، والمطلوب يبقى فوقها */
    if(anchor.length) wrap.insertBefore(anchor); else wrap.prependTo('#upro .modal-body');
    var audio = wrap.data('mdpAudio'), fresh = false;
    if(!audio || audio.getAttribute('src') !== music){ mountPlayer(wrap, music); fresh = true; }
    /* autoplay as soon as the profile opens (called from the user's click, so browsers allow it; if blocked it just stays paused) */
    audio = wrap.data('mdpAudio');
    if(audio){
      pauseAll(audio);
      if(!fresh){ try{ audio.currentTime = 0; }catch(e){} }
      var pr = audio.play(); if(pr && pr.catch) pr.catch(function(){});
    }
  };

  /* ================= [ADDED - DELETE MEMBER DESIGN] حذف مميزات تصميم العضوية (للسوبر / صلاحية deldesign) =================
     window.memberDesignDeleteDialog(id, u) بيتنده من زرار .udeldesign في بروفايل العضو (x2.js). بيفتح نافذة فيها
     الميزات اللي العضو مركّبها فعلًا (اللي مش معروفة زي إطار/لمعة/غلاف الكارت لعضو غايب بتظهر كلها)،
     وبعد التأكيد بيبعت SEND_EVENT_EMIT_ACTION { cmd:'deldesign', id, items:[...] } — ونفس الحدث بيتحوّل لعضو غايب تلقائيًا
     (member-actions.js). التحقق الفعلي من الصلاحية والرتبة على السيرفر، وهنا بس إخفاء/إظهار. */
  function canDeleteDesign(){ return !!(window.jstp && (jstp.deldesign || jstp.owner)); }
  window.memberDesignCanDelete = canDeleteDesign;
  function filled(v){ return !!String(v == null ? '' : v).trim(); }
  var DEL_ITEMS = [
    {key:'cover',   label:'خلفية البروفايل (صورة)',      has:function(u){ return isCustomCover(u.cover); }},
    {key:'bg',      label:'لون خلفية البروفايل',         has:function(u){ return !!color(u.profile_bg, ''); }},
    {key:'card',    label:'لون كارت العضو',              has:function(u){ return !!gcolor(u.member_card_color, ''); }},
    {key:'music',   label:'أغنية البروفايل',             has:function(u){ return !!safeUrl(u.profile_music); }},
    {key:'welcome', label:'رسالة الترحيب',               has:function(u){ return filled(u.welcome_msg); }},
    {key:'social',  label:'السوشيال ميديا',              has:function(u){ return filled(u.social_telegram) || filled(u.social_facebook) || filled(u.social_whatsapp); }},
    {key:'back',    label:'غلاف كارت العضو في المتصلين', has:function(u){ return u.back === undefined || filled(u.back); }},
    {key:'atar',    label:'الإطار المتحرك',              has:function(u){ return u.atar === undefined || filled(u.atar); }},
    {key:'lmaa',    label:'اللمعة (الاسم المتحرك)',      has:function(u){ return u.lmaa === undefined || filled(u.lmaa); }}
  ];
  window.memberDesignDeleteDialog = function(id, u){
    if(!canDeleteDesign()) return;
    u = u || {};
    var list = DEL_ITEMS.filter(function(it){ try{ return it.has(u); }catch(e){ return true; } });
    if(!list.length){ if(typeof SendNotification === 'function') SendNotification({state:'me',topic:'',force:1,msg:'العضو ماعندوش مميزات تصميم متركّبة',user:''}); return; }
    $('#mdDelDesignModal').remove();
    var rows = list.map(function(it){
      return '<label class="md-deldesign-row" style="display:flex;align-items:center;gap:8px;padding:6px 4px;margin:0;cursor:pointer;font-weight:normal;">' +
        '<input type="checkbox" class="md-deldesign-chk" value="' + it.key + '"> <span>' + it.label + '</span></label>';
    }).join('');
    var m = $(
      '<div class="modal" id="mdDelDesignModal" role="dialog" style="z-index: 5001 !important">' +
        '<div class="modal-dialog"><div class="modal-content" style="width: 310px;">' +
          '<div style="color: white;" class="modal-header label-primary md-deldesign-close">' +
            '<span class="pull-right clickable badge"><i class="fa fa-times"></i></span>' +
            '<label style="margin: 1px;" class="mini fa fa-paint-brush modal-title"> حذف مميزات التصميم</label>' +
          '</div>' +
          '<div class="modal-body" style="padding: 1px;"><div class="break" style="background-color:#efefef;padding:8px;">' +
            '<label class="md-deldesign-row" style="display:flex;align-items:center;gap:8px;padding:4px;margin:0 0 4px;cursor:pointer;font-weight:bold;border-bottom:1px solid #ddd;">' +
              '<input type="checkbox" class="md-deldesign-all"> <span>تحديد الكل</span></label>' +
            rows +
            '<button type="button" class="md-deldesign-go btn btn-danger fr" style="margin-top:8px;" disabled><span class="fa fa-trash"> حذف المحدد</span></button>' +
            '<div style="clear:both"></div>' +
          '</div></div>' +
        '</div></div>' +
      '</div>');
    function selected(){ return m.find('.md-deldesign-chk:checked').map(function(){ return this.value; }).get(); }
    function refresh(){
      var n = selected().length;
      m.find('.md-deldesign-go').prop('disabled', !n);
      m.find('.md-deldesign-all').prop('checked', n === m.find('.md-deldesign-chk').length);
    }
    m.on('change.mdDelDesign', '.md-deldesign-chk', refresh);
    m.on('change.mdDelDesign', '.md-deldesign-all', function(){ m.find('.md-deldesign-chk').prop('checked', this.checked); refresh(); });
    m.on('click.mdDelDesign', '.md-deldesign-close', function(){ m.modal('hide'); });
    m.on('click.mdDelDesign', '.md-deldesign-go', function(){
      var items = selected(); if(!items.length) return;
      var names = list.filter(function(it){ return items.indexOf(it.key) !== -1; }).map(function(it){ return it.label; }).join('، ');
      if(!window.confirm('حذف: ' + names + ' ؟\nالعملية لا يمكن التراجع عنها.')) return;
      if(typeof SEND_EVENT_EMIT === 'function') SEND_EVENT_EMIT('SEND_EVENT_EMIT_ACTION', {cmd:'deldesign', id:id, items:items});
      m.modal('hide');
    });
    m.on('hidden.bs.modal', function(){ m.remove(); });
    m.modal();
  };

  $(function(){
    $('#upro').on('hidden.bs.modal', function(){
      pauseAll(null);
      killBanner();
    });
    $('.md-si').each(function(){ $(this).html(ICONS[$(this).attr('data-ic')] || ''); });
    var b = $('#memberDesignStudio'); if(!b.length) return;
    b.on('click', function(e){ if(e.target === this) window.closeMemberDesignStudio(); });
    if(!allowed()) $('#openMemberDesignStudio').hide();
  });
})();
