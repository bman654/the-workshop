'use strict';
/* ── SFX: HARBOUR AMBIENCE — the bed under the whole night ─────────────────────
   A quiet, seamless harbour: the soft LAP of water against the wall (slow-
   breathing filtered noise) and, now and then, a far BELL-BUOY tolling one dim
   note out on the water. A gentle bed that loops for as long as it plays.
   Deterministic where it matters; started/stopped by the page (unlocks on the
   first user gesture, honours the shared mute). Dual-use (live OR Offline).
   Contract: Powder.sfx.ambience({ ctx, dest, when=0, seed=1 }) -> {stop}
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
  function noiseLoop(ctx, seed, sec) {
    var n = Math.max(1, Math.round(ctx.sampleRate * sec));
    var buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    var rnd = mulberry32(seed >>> 0), last = 0;
    for (var i = 0; i < n; i++) { var w = rnd() * 2 - 1; last = last * 0.86 + w * 0.14; d[i] = last * 3.2; }
    // taper the seam so the loop is clickless
    var fade = Math.min(n / 2 | 0, Math.round(ctx.sampleRate * 0.25));
    for (var j = 0; j < fade; j++) { var g = j / fade; d[j] *= g; d[n - 1 - j] *= g; }
    return buf;
  }

  Powder.sfx.ambience = function (o) {
    o = o || {};
    var ctx = o.ctx, dest = o.dest, when = o.when != null ? o.when : 0;
    var seed = (o.seed | 0) || 1;
    var t0 = ctx.currentTime + when;

    var master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, t0);
    master.gain.linearRampToValueAtTime(0.5, t0 + 2.0);   // fade in
    master.connect(dest);

    // the LAP: looping low noise through a slowly-breathing lowpass
    var src = ctx.createBufferSource();
    src.buffer = noiseLoop(ctx, (seed * 2654435761) >>> 0, 6.0);
    src.loop = true;
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(320, t0); lp.Q.value = 0.4;
    // an LFO on the cutoff → the water breathes
    var lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.11;
    var lfoG = ctx.createGain(); lfoG.gain.value = 140;
    lfo.connect(lfoG).connect(lp.frequency);
    var lapG = ctx.createGain(); lapG.gain.value = 0.5;
    src.connect(lp).connect(lapG).connect(master);
    src.start(t0); lfo.start(t0);

    // the BELL-BUOY: a dim struck note every ~9–15s, out on the water.
    var rnd = mulberry32((seed * 40503 + 99) >>> 0);
    var bells = [];
    var scheduledUntil = t0 + 1.0;
    function scheduleBells(now) {
      // schedule any tolls in the next 30s window (called live from the page tick)
      var horizon = now + 30;
      while (scheduledUntil < horizon) {
        scheduledUntil += 9 + rnd() * 6;
        toll(scheduledUntil);
      }
    }
    function toll(t) {
      var f = 236;                       // a low, dim bell
      var carrier = ctx.createOscillator(); carrier.type = 'sine'; carrier.frequency.value = f;
      var partial = ctx.createOscillator(); partial.type = 'sine'; partial.frequency.value = f * 2.76; // inharmonic → bell
      var bg = ctx.createGain();
      bg.gain.setValueAtTime(0.0001, t);
      bg.gain.linearRampToValueAtTime(0.14, t + 0.008);
      bg.gain.exponentialRampToValueAtTime(0.0004, t + 3.0);
      var pg = ctx.createGain(); pg.gain.value = 0.35;
      partial.connect(pg).connect(bg);
      carrier.connect(bg).connect(master);
      carrier.start(t); carrier.stop(t + 3.1);
      partial.start(t); partial.stop(t + 1.6);
      bells.push(carrier, partial);
    }
    scheduleBells(ctx.currentTime);       // prime the first window

    return {
      tick: function () { try { scheduleBells(ctx.currentTime); } catch (e) {} },
      stop: function (at) {
        var w = at != null ? at : ctx.currentTime;
        try { master.gain.cancelScheduledValues(w); master.gain.setTargetAtTime(0, w, 0.4); } catch (e) {}
        try { src.stop(w + 1); } catch (e) {}
        try { lfo.stop(w + 1); } catch (e) {}
        for (var i = 0; i < bells.length; i++) { try { bells[i].stop(w + 1); } catch (e) {} }
      },
    };
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
