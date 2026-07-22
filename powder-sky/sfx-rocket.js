'use strict';
/* ── SFX: the ROCKET LIFT — a shell climbing, trailing a rising whistle ────────
   A thin airy hiss with a slowly RISING pitch (the mortar's whistle receding
   upward), fading as the shell nears apogee. No hard onset — it swells from the
   deck. Bandpassed noise for the air + a faint sine that glides up an octave.
   Deterministic (seeded), dual-use (live OR OfflineAudioContext).
   Contract: Powder.sfx.rocket({ ctx, dest, dur, when=0, seed=1, size=4 }) -> {stop}
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
  function noise(ctx, seed, sec) {
    var n = Math.max(1, Math.round(ctx.sampleRate * sec));
    var buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    var rnd = mulberry32(seed >>> 0), last = 0;
    for (var i = 0; i < n; i++) { var w = rnd() * 2 - 1; last = last * 0.3 + w * 0.7; d[i] = last; }
    return buf;
  }

  Powder.sfx.rocket = function (o) {
    o = o || {};
    var ctx = o.ctx, dest = o.dest;
    var dur = (o.dur > 0 ? o.dur : 1.1);
    var when = o.when != null ? o.when : 0;
    var seed = (o.seed | 0) || 1;
    var size = o.size != null ? o.size : 4;
    var t0 = ctx.currentTime + when, tEnd = t0 + dur;

    var master = ctx.createGain();
    master.gain.setValueAtTime(1, t0);
    master.connect(dest);

    // AIR: bandpassed noise, rising centre → the whistle climbing
    var src = ctx.createBufferSource();
    src.buffer = noise(ctx, (seed * 2654435761) >>> 0, dur + 0.1);
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.Q.setValueAtTime(2.6, t0);
    bp.frequency.setValueAtTime(520, t0);
    bp.frequency.exponentialRampToValueAtTime(1500 + size * 60, tEnd);   // climb
    var ag = ctx.createGain();
    ag.gain.setValueAtTime(0.0001, t0);
    ag.gain.linearRampToValueAtTime(0.10, t0 + 0.12);                    // swell from the deck
    ag.gain.setValueAtTime(0.10, tEnd - 0.35);
    ag.gain.exponentialRampToValueAtTime(0.0006, tEnd);                  // fade near apogee
    src.connect(bp).connect(ag).connect(master);
    src.start(t0); src.stop(tEnd + 0.02);

    // a faint sine gliding up an octave — the pitched core of the whistle
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(360, t0);
    osc.frequency.exponentialRampToValueAtTime(760, tEnd);
    var og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, t0);
    og.gain.linearRampToValueAtTime(0.028, t0 + 0.16);
    og.gain.exponentialRampToValueAtTime(0.0005, tEnd);
    osc.connect(og).connect(master);
    osc.start(t0); osc.stop(tEnd + 0.02);

    return { stop: function (at) {
      var w = at != null ? at : ctx.currentTime;
      try { src.stop(w); } catch (e) {}
      try { osc.stop(w); } catch (e) {}
      try { master.gain.cancelScheduledValues(w); master.gain.setTargetAtTime(0, w, 0.02); } catch (e) {}
    } };
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
