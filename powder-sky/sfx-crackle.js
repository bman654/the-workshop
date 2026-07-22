'use strict';
/* ── SFX: CRACKLE + PATTER — the fine grains that follow a break ───────────────
   Powder.sfx.crackle — the strobe/crackle shell's sizzle: a shower of tiny sharp
     high-passed pops, stochastically scattered over ~1s (the winking stars heard).
   Powder.sfx.patter — the gold willow's ember patter: softer, lower, sparser
     "tk … tk" crackles that thin out as the fronds burn down.
   Deterministic (seeded), dual-use (live OR OfflineAudioContext).
   Contract: Powder.sfx.crackle({ ctx, dest, dur, when=0, seed=1 }) -> {stop}
             Powder.sfx.patter ({ ctx, dest, dur, when=0, seed=1 }) -> {stop}
   ─────────────────────────────────────────────────────────────────────────── */
(function (root) {
  'use strict';
  var Powder = root.Powder = root.Powder || {};
  Powder.sfx = Powder.sfx || {};

  function mulberry32(a) {
    a = a >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pop(ctx, master, t, freq, amp, len) {
    // one tiny grain: a single-cycle-ish sharp click, band-shaped
    var n = Math.max(2, Math.round(ctx.sampleRate * len));
    var buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) { var e = 1 - i / n; d[i] = (Math.random ? 0 : 0) + (i % 3 ? 1 : -1) * e * e; }
    var src = ctx.createBufferSource(); src.buffer = buf;
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = 3;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(amp, t + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0004, t + len);
    src.connect(bp).connect(g).connect(master);
    src.start(t); src.stop(t + len + 0.005);
  }

  function shower(o, cfg) {
    o = o || {};
    var ctx = o.ctx, dest = o.dest, when = o.when != null ? o.when : 0;
    var seed = (o.seed | 0) || 1, rnd = mulberry32(seed >>> 0);
    var t0 = ctx.currentTime + when, dur = o.dur > 0 ? o.dur : cfg.dur;
    var master = ctx.createGain(); master.gain.setValueAtTime(1, t0); master.connect(dest);
    var t = t0 + 0.01;
    while (t < t0 + dur) {
      var frac = (t - t0) / dur;
      var amp = cfg.amp * (1 - frac * cfg.thin) * (0.6 + rnd() * 0.4);
      var f = cfg.f0 + rnd() * cfg.fSpread;
      pop(ctx, master, t, f, amp, cfg.len * (0.7 + rnd() * 0.6));
      t += cfg.gap * (0.4 + rnd() * 1.2);
    }
    return { stop: function (at) {
      var w = at != null ? at : ctx.currentTime;
      try { master.gain.cancelScheduledValues(w); master.gain.setTargetAtTime(0, w, 0.02); } catch (e) {}
    } };
  }

  Powder.sfx.crackle = function (o) {
    return shower(o, { dur: 1.1, amp: 0.11, thin: 0.7, f0: 2600, fSpread: 3200, len: 0.02, gap: 0.028 });
  };
  Powder.sfx.patter = function (o) {
    return shower(o, { dur: 1.9, amp: 0.07, thin: 0.85, f0: 1200, fSpread: 1400, len: 0.03, gap: 0.075 });
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
