/* =====================================================================================
   [ADDED - NAME GLITTER] اللمعات: تشغيل اللمعة جوه حروف الاسم بشكل آمن (ملف مستقل + name-glitter.css).
   ما بيلمسش member-design.js ولا x2.js ولا user-list.js: بيراقب (MutationObserver) أي عنصر
   عليه الكلاس .md-name-glitter اللي member-design.js بيحطه، وبيعمل الآتي:
     1) يقرا رابط اللمعة من الـ inline style اللي الأصل حطه (background-image).
     2) يحمّل الصورة الأول (preload). لو نجحت → data-mdg="ok" + --mdg-img (اللمعة تظهر جوه الحروف).
        لو فشلت → data-mdg="bad" (الاسم يفضل ظاهر بلونه العادي بدل ما يختفي).
     3) يحتفظ بلون الاسم الأصلي في --mdg-col للحالات اللي اللمعة فيها مش جاهزة.
     4) لو اللمعة اتشالت (الكلاس اتشال) ينضّف كل اللي حطه.
   ===================================================================================== */
(function(){
  'use strict';
  if(window.__mdgNameGlitter) return;
  window.__mdgNameGlitter = true;

  var CLS = 'md-name-glitter';
  /* [FIX] لو المتصفح مش بيدعم background-clip:text نسيب الاسم بلونه العادي ومانفعّلش اللمعة أبدًا */
  var CLIP = false;
  try{
    CLIP = !!(window.CSS && CSS.supports && (CSS.supports('background-clip', 'text') || CSS.supports('-webkit-background-clip', 'text')));
  }catch(e){ CLIP = false; }

  var imgs = Object.create(null); /* رابط مطلق → {st:'load'|'ok'|'bad', w:[callbacks]} */

  function parseUrl(v){ var m = /url\(\s*(['"]?)(.*?)\1\s*\)/.exec(v || ''); return m ? m[2] : ''; }
  function absUrl(u){ try{ return new URL(u, document.baseURI).href; }catch(e){ return ''; } }

  /* تحميل الصورة مرة واحدة لكل رابط (كاش) — كل الأسماء اللي بنفس اللمعة بتستنى نفس النتيجة */
  function loadImg(a, cb){
    var s = imgs[a];
    if(s){
      if(s.st === 'ok') return cb(true);
      if(s.st === 'bad') return cb(false);
      s.w.push(cb); return;
    }
    s = imgs[a] = {st: 'load', w: [cb]};
    var im = new Image();
    function done(ok){
      s.st = ok ? 'ok' : 'bad';
      var w = s.w; s.w = [];
      for(var i = 0; i < w.length; i++){ try{ w[i](ok); }catch(e){} }
      /* [FIX - GLITTER RETRY] الفشل مايتخزّنش: بنمسحه فورًا (بعد ما المستنيين خدوا النتيجة) عشان إعادة المحاولة تحمّل الصورة فعلًا */
      if(!ok && imgs[a] === s) delete imgs[a];
    }
    s.im = im;
    im.onload = function(){ done(true); };
    im.onerror = function(){ done(false); };
    im.src = a;
  }

  /* [PERF - STATIC FRAME] نسخة ثابتة (أول إطار) من اللمعة: بتتعمل مرة واحدة لكل رابط على canvas صغير وتتحوّل لـ blob.
     CSS بيستخدمها بدل الـ GIF المتحرك في الرسايل القديمة وأثناء السكرول/النوافذ — اللمعة تفضل ظاهرة جوه الحروف
     من غير ما المتصفح يعيد رسمها كل فريم. لو الصورة من دومين تاني (canvas متلوّث) أو حصل أي خطأ → مفيش نسخة ثابتة والسلوك القديم زي ما هو. */
  function getStatic(a, cb){
    var s = imgs[a];
    if(!s || s.st !== 'ok' || !s.im) return;
    if(s.sst === 'ok') return cb(s.surl);
    if(s.sst === 'bad') return;
    if(s.sst === 'load'){ s.sw.push(cb); return; }
    s.sst = 'load'; s.sw = [cb];
    function fin(u){
      s.sst = u ? 'ok' : 'bad'; s.surl = u || '';
      var w = s.sw; s.sw = [];
      if(u) for(var i = 0; i < w.length; i++){ try{ w[i](u); }catch(e){} }
    }
    try{
      var im = s.im, nw = im.naturalWidth || 0, nh = im.naturalHeight || 0;
      if(!nw || !nh || !window.URL || !URL.createObjectURL){ return fin(''); }
      var k = Math.min(1, 256 / Math.max(nw, nh));
      var c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(nw * k)); c.height = Math.max(1, Math.round(nh * k));
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      if(!c.toBlob) return fin('');
      c.toBlob(function(b){ try{ fin(b ? URL.createObjectURL(b) : ''); }catch(e){ fin(''); } }, 'image/png');
    }catch(e){ fin(''); }
  }

  /* لون الاسم الأصلي (اللي الأصل حطه inline) — بنحتفظ بيه عشان نرجّعه لو اللمعة مش جاهزة */
  function nameColor(el){
    var c = el.style && el.style.color;
    if(c) return c;
    var p = el.parentElement;
    if(p){ try{ c = getComputedStyle(p).color; }catch(e){} }
    return c || '#333';
  }
  /* [FIX - GLITTER INNER SPAN] اللمعة بتتطبق على <span class="mdg-txt"> جوه عنصر الاسم (مش على العنصر نفسه):
     العنصر الخارجي بيحتفظ بلون خلفية الاسم العادي، والـ span الداخلي بس هو اللي عليه صورة اللمعة بـ background-clip:text
     (طبقة واحدة) — من غير الاعتماد على قص الطبقات المتعددة (text, border-box) اللي بيختلف من متصفح لمتصفح. */
  function wrapped(el){
    var f = el.firstChild;
    return !!(f && f.nodeType === 1 && f.classList.contains('mdg-txt') && f === el.lastChild);
  }
  function wrap(el){
    if(wrapped(el)) return;
    /* لو فيه span قديم متكرر أو محتوى اتبدّل (innerHTML من الأصل): نلمّ كل الأبناء جوه span واحد */
    var sp = document.createElement('span'); sp.className = 'mdg-txt';
    while(el.firstChild) sp.appendChild(el.firstChild);
    el.appendChild(sp);
  }
  function unwrap(el){
    var f = el.firstChild;
    if(f && f.nodeType === 1 && f.classList.contains('mdg-txt') && f === el.lastChild){
      while(f.firstChild) el.insertBefore(f.firstChild, f);
      el.removeChild(f);
    }
  }
  function setState(el, st){ if(el.getAttribute('data-mdg') !== st) el.setAttribute('data-mdg', st); }
  function syncColor(el){
    var c = nameColor(el);
    if(el._mdgCol !== c){ el._mdgCol = c; el.style.setProperty('--mdg-col', c); }
  }
  function clear(el){
    el._mdgAbs = undefined; el._mdgCol = undefined;
    unwrap(el);
    if(el.hasAttribute('data-mdg')) el.removeAttribute('data-mdg');
    if(el.hasAttribute('data-mdg-s')){ el.removeAttribute('data-mdg-s'); if(el.style) el.style.removeProperty('--mdg-simg'); }
    if(el.style){
      if(el.style.getPropertyValue('--mdg-img')) el.style.removeProperty('--mdg-img');
      if(el.style.getPropertyValue('--mdg-col')) el.style.removeProperty('--mdg-col');
    }
  }

  function sync(el){
    if(!el.classList.contains(CLS)){
      if(el._mdgAbs !== undefined || el.hasAttribute('data-mdg')) clear(el);
      return;
    }
    wrap(el);
    var raw = parseUrl(el.style.backgroundImage), a = raw ? absUrl(raw) : '';
    if(!a){
      /* الأصل ممكن يكون لسه ماحطّش الرابط أو اتمسح: لو عندنا رابط قديم نسيبه، غير كده الاسم عادي */
      if(!el._mdgAbs){ syncColor(el); setState(el, 'bad'); }
      return;
    }
    if(a === el._mdgAbs){ syncColor(el); return; } /* [PERF] نفس اللمعة — مفيش شغل تاني */
    el._mdgAbs = a;
    if(el.hasAttribute('data-mdg-s')){ el.removeAttribute('data-mdg-s'); el.style.removeProperty('--mdg-simg'); }
    syncColor(el);
    if(!CLIP){ setState(el, 'bad'); return; }
    setState(el, 'load'); /* أثناء التحميل الاسم ظاهر بلونه العادي */
    loadImg(a, function(ok){
      if(el._mdgAbs !== a) return; /* اللمعة اتغيّرت/اتشالت وإحنا بنحمّل */
      if(ok){
        el.style.setProperty('--mdg-img', 'url("' + a.replace(/"/g, '%22') + '")');
        el._mdgTry = 0;
        setState(el, 'ok');
        getStatic(a, function(u){
          if(el._mdgAbs !== a) return;
          el.style.setProperty('--mdg-simg', 'url("' + u + '")');
          if(el.getAttribute('data-mdg-s') !== '1') el.setAttribute('data-mdg-s', '1');
        });
      }else{
        setState(el, 'bad');
        /* [FIX - GLITTER RETRY] فشل التحميل (نت قطع / الجهاز نام / الغياب) كان بيسيب الاسم من غير لمعة لحد التحديث،
           لأن _mdgAbs كانت بتمنع أي إعادة محاولة. دلوقتي: محاولة تانية بتأخير متزايد (حد أقصى 5) */
        var tries = (el._mdgTry || 0) + 1; el._mdgTry = tries;
        if(tries <= 5){
          setTimeout(function(){
            if(el._mdgAbs === a && el.getAttribute('data-mdg') === 'bad'){ el._mdgAbs = undefined; enqueue(el); }
          }, 2000 * tries);
        }
      }
    });
  }

  /* ---- تجميع التغييرات (batching) عشان مانشتغلش على كل mutation لوحدها ---- */
  var queue = [], scheduled = false;
  var obs = null, selfTouched = null;
  function flush(){
    scheduled = false;
    var q = queue; queue = [];
    selfTouched = new Set();
    for(var i = 0; i < q.length; i++){ q[i]._mdgQ = false; selfTouched.add(q[i]); try{ sync(q[i]); }catch(e){ if(window.console) console.error('[name-glitter]', e); } }
    /* [PERF-FIX #3] منع حلقة التغذية الراجعة: التغييرات (class/style) اللي sync() كتبها بنفسها بتتشال من طابور المراقب
       بدل ما ترجع تتحط في الطابور وتتزامن تاني. أي تغيير خارجي بيتعالج عادي. */
    if(obs){
      var rest = obs.takeRecords();
      if(rest.length){
        var keep = [];
        for(var r = 0; r < rest.length; r++){
          if(rest[r].type === 'attributes' && selfTouched.has(rest[r].target)) continue;
          keep.push(rest[r]);
        }
        if(keep.length) handleRecs(keep);
      }
    }
    selfTouched = null;
  }
  function enqueue(el){
    if(!el || el.nodeType !== 1 || el._mdgQ) return;
    el._mdgQ = true; queue.push(el);
    if(!scheduled){ scheduled = true; setTimeout(flush, 30); }
  }
  function scan(root){
    if(root.classList && root.classList.contains(CLS)) enqueue(root);
    if(root.querySelectorAll){
      var l = root.querySelectorAll('.' + CLS);
      for(var i = 0; i < l.length; i++) enqueue(l[i]);
    }
  }

  function handleRecs(recs){
    for(var i = 0; i < recs.length; i++){
      var m = recs[i];
      if(m.type === 'attributes'){
        var t = m.target;
        if(t.classList.contains(CLS) || t._mdgAbs !== undefined || t.hasAttribute('data-mdg')) enqueue(t);
      }else{
        if(m.target.nodeType === 1 && m.target.classList && m.target.classList.contains(CLS) && !wrapped(m.target)) enqueue(m.target);
        var n = m.addedNodes;
        for(var j = 0; j < n.length; j++) if(n[j].nodeType === 1) scan(n[j]);
      }
    }
  }
  function start(){
    scan(document.documentElement);
    obs = new MutationObserver(handleRecs);
    obs.observe(document.documentElement, {childList: true, subtree: true}); /* [PERF-Y] 'class' اتشال كمان: المراقبة على تغيير class في الصفحة كلها (هوفر / كتابة / سكرول / حالات) كانت بتصحّي المراقب طول الوقت. الكلاس md-name-glitter بيتحط/يتشال من مكان واحد (member-design.js) وبينده nameGlitterEnqueue بنفسه، والعناصر الجديدة بتتلقط بـchildList */
  }
  /* للاستدعاء اليدوي لو احتجته: window.nameGlitterSync(rootElement) */
  window.nameGlitterSync = function(root){ scan(root || document.documentElement); };
  window.nameGlitterEnqueue = function(el){ enqueue(el); }; /* [PERF-X] member-design.js بينده عليها لما رابط اللمعة يتغير على عنصر عليه الكلاس أصلًا */

  /* [FIX - GLITTER RETRY] الرجوع للصفحة/رجوع النت: أي اسم لمعته 'bad' نعيد تحميلها */
  function retryBad(){
    var l = document.querySelectorAll('.' + CLS + '[data-mdg="bad"]');
    for(var i = 0; i < l.length; i++){ l[i]._mdgAbs = undefined; l[i]._mdgTry = 0; enqueue(l[i]); }
  }
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) retryBad(); });
  window.addEventListener('online', retryBad);
  window.addEventListener('pageshow', retryBad);

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
