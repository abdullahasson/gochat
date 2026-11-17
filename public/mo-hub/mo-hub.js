/* [PERF - MO HUB] دمج مراقبات الـDOM المتطابقة. لازم يتحمّل أول سكريبت في الصفحة (قبل أي new MutationObserver).
   المشكلة: كذا ملف (pm-ref / room-msg-ref / room-media / pm-msg-actions / perf-pause ...) كل واحد بيعمل MutationObserver لنفس العنصر
   (#d2 وغيره) بنفس الخيارات، فكل رسالة جديدة بتتسجّل وتتوزّع مرات كتير (سجلات + استدعاءات بعدد المراقبين).
   الحل: مراقب أصلي واحد لكل (عنصر + خيارات childList / childList+subtree) وبيوزّع السجلات على كل المشتركين.
   - بس للخيارات { childList } أو { childList, subtree }. أي خيارات تانية (attributes / characterData ...) بتروح لمراقب أصلي عادي زي ما هي
     (فـ takeRecords بتاع name-glitter وغيره شغال زي ما كان).
   - نفس الواجهة: observe / disconnect / takeRecords. الـcallback بيتنادى بـ (records, observer) وفي try/catch لكل مشترك.
   - الفرق الوحيد: مراقب واحد بيراقب كذا عنصر بيستلم دفعة لكل عنصر بدل دفعة مجمّعة (مفيش كود عندنا بيعتمد على التجميع).
   - أي خطأ في تركيب الدمج بيرجّع للمراقب الأصلي. window.__MO_HUB_STATS للفحص من الكونسول. */
(function () {
  'use strict';
  var Native = window.MutationObserver;
  if (!Native || Native.__hub) return;

  var hubs = new WeakMap();      /* target -> { childList: entry, subtree: entry } */
  var stats = { shared: 0, native: 0, fanout: 0 };

  function mergeKey(o) {
    if (!o || typeof o !== 'object' || !o.childList) return '';
    if (o.attributes || o.characterData || o.attributeFilter || o.attributeOldValue || o.characterDataOldValue) return '';
    return o.subtree ? 'subtree' : 'childList';
  }

  function entryFor(target, key) {
    var m = hubs.get(target);
    if (!m) { m = {}; hubs.set(target, m); }
    var e = m[key];
    if (e) return e;
    e = m[key] = { subs: [], mo: null, target: target, key: key };
    e.mo = new Native(function (records) {
      var subs = e.subs.slice();
      for (var i = 0; i < subs.length; i++) {
        var s = subs[i];
        stats.fanout++;
        try { s.cb.call(s.owner, records, s.owner); } catch (err) { try { setTimeout(function () { throw err; }); } catch (x) {} }
      }
    });
    e.mo.observe(target, key === 'subtree' ? { childList: true, subtree: true } : { childList: true });
    stats.shared++;
    return e;
  }
  function drop(sub) {
    var e = sub.entry, i = e.subs.indexOf(sub);
    if (i !== -1) e.subs.splice(i, 1);
    if (!e.subs.length) {
      try { e.mo.disconnect(); } catch (x) {}
      var m = hubs.get(e.target);
      if (m) { delete m[e.key]; }
    }
  }

  function HubObserver(cb) {
    if (typeof cb !== 'function') return new Native(cb);   /* خطأ أصلي من المتصفح */
    this._cb = cb;
    this._subs = [];
    this._nat = null;
  }
  HubObserver.prototype.observe = function (target, opts) {
    var key = '';
    try { key = target && target.nodeType ? mergeKey(opts) : ''; } catch (e) { key = ''; }
    if (!key) {                                           /* مراقب أصلي لخيارات مش بتتدمج */
      if (!this._nat) { var self = this; this._nat = new Native(function (r) { return self._cb.call(self, r, self); }); }
      stats.native++;
      return this._nat.observe(target, opts);
    }
    for (var i = 0; i < this._subs.length; i++) {         /* observe تاني لنفس العنصر = استبدال الخيارات (زي الأصلي) */
      if (this._subs[i].entry.target === target) { drop(this._subs[i]); this._subs.splice(i, 1); break; }
    }
    var entry = entryFor(target, key), sub = { cb: this._cb, owner: this, entry: entry };
    entry.subs.push(sub);
    this._subs.push(sub);
  };
  HubObserver.prototype.disconnect = function () {
    for (var i = 0; i < this._subs.length; i++) drop(this._subs[i]);
    this._subs = [];
    if (this._nat) this._nat.disconnect();
  };
  HubObserver.prototype.takeRecords = function () {
    return this._nat ? this._nat.takeRecords() : [];
  };

  HubObserver.__hub = true;
  window.MutationObserver = HubObserver;
  window.__MO_HUB_STATS = function () { return { sharedObservers: stats.shared, nativeObservers: stats.native, callbacksFanned: stats.fanout }; };
})();
