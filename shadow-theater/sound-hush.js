/* ============================================================================
   sound-hush.js — the LANTERN HUSH BED for The Shadow Theater.  [in-house]

   DIRECTION — the room-tone of a warm, quiet room lit by one lamp: a low lowpassed
   brown room-tone under a dark warm-lamp hiss, and the whole thing BREATHES — a
   slow (~0.15–0.4 Hz) amplitude random-walk, as if the lamp's flame wavers. It is a
   HUSH, not a drone: barely there, felt more than heard. The piece sings its own
   air, so the page wears NO estate air chip. Muted by default; it never machine-guns.

   Forged in-house per art-specs/hush-bed.md: a real WebAudio bed (lowpassed brown
   room-tone + a faint bandpassed lamp-hiss + a slow amplitude random-walk so the
   lamp "breathes"). Mirrors the Split-Flap dual-use idiom EXACTLY:

     window.HushBed.start(ctx, dest, opts) -> { stop() }     // the LIVE ambient bed
     Gate.sfx['hush-bed'] = function ({ctx,dest,dur,when,seed}) {…}   // OFFLINE bench

   HOUSE RULES: pure WebAudio, no samples/files; creates nothing at module load; the
   page's Sound orchestrator owns gesture-unlock + the shared mute. Deterministic
   from seed on the offline bench.
   ============================================================================ */
"use strict";
(function (root) {

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* a looping brown-noise buffer (integrated white → 1/f² spectrum: dark, warm). */
  function brownBuffer(ctx, secs, seed) {
    var len = Math.floor(ctx.sampleRate * secs);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    var rnd = mulberry32(seed >>> 0);
    var last = 0;
    for (var i = 0; i < len; i++) {
      var white = rnd() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;         // leaky integrator → brown
      d[i] = last * 3.2;
    }
    // taper the seam so the loop point does not click
    var f = Math.min(2000, (len / 2) | 0);
    for (var j = 0; j < f; j++) { var g = j / f; d[j] *= g; d[len - 1 - j] *= g; }
    return buf;
  }

  /* build the graph; returns the nodes so both the live bed + offline bench share it. */
  function build(ctx, dest, opts) {
    opts = opts || {};
    var seed = (opts.seed != null) ? (opts.seed >>> 0) : 0x5eed;
    var gain = (opts.gain != null) ? opts.gain : 0.5;

    var src = ctx.createBufferSource();
    src.buffer = brownBuffer(ctx, 4.0, seed);
    src.loop = true;

    // lowpass the brown room-tone dark
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380; lp.Q.value = 0.5;

    // a faint warm hiss: separate brown source, gently bandpassed higher, very quiet
    var hissSrc = ctx.createBufferSource();
    hissSrc.buffer = brownBuffer(ctx, 3.3, seed ^ 0x9e37);
    hissSrc.loop = true;
    var hp = ctx.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = 1400; hp.Q.value = 0.4;
    var hissG = ctx.createGain(); hissG.gain.value = 0.05;

    // the breathing gain — slow LFO + a random-walk offset
    var master = ctx.createGain(); master.gain.value = 0.0001;

    src.connect(lp); lp.connect(master);
    hissSrc.connect(hp); hp.connect(hissG); hissG.connect(master);
    master.connect(dest);

    var now = (opts.when != null) ? opts.when : ctx.currentTime;
    // fade in from silence
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(gain, now + 1.4);

    src.start(now); hissSrc.start(now);
    return { src: src, hissSrc: hissSrc, master: master, base: gain };
  }

  /* THE LIVE BED — a gentle breathing hush that runs until stop(). The random-walk
     is scheduled ahead in ~0.6 s segments via a rAF-free setInterval-lite: we lean on
     WebAudio ramps so it keeps breathing even if the tab is busy. */
  function start(ctx, dest, opts) {
    var g = build(ctx, dest, opts || {});
    var stopped = false;
    var rnd = mulberry32(0x1a11 ^ ((opts && opts.seed) || 0));
    var walk = g.base;
    var seg = 0;
    function schedule() {
      if (stopped) return;
      var t = ctx.currentTime;
      // random-walk the breath amplitude within a warm band (~0.15–0.4 Hz period)
      var period = 2.5 + rnd() * 4.0;               // 2.5–6.5 s  ≈ 0.15–0.4 Hz
      walk = Math.max(g.base * 0.55, Math.min(g.base * 1.25, walk + (rnd() - 0.5) * g.base * 0.5));
      try { g.master.gain.linearRampToValueAtTime(walk, t + period); } catch (e) { }
      seg = period;
      timer = setTimeout(schedule, seg * 1000 * 0.9);
    }
    var timer = setTimeout(schedule, 200);
    return {
      stop: function () {
        stopped = true;
        try { clearTimeout(timer); } catch (e) { }
        var t = ctx.currentTime;
        try {
          g.master.gain.cancelScheduledValues(t);
          g.master.gain.setValueAtTime(g.master.gain.value, t);
          g.master.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
        } catch (e) { }
        try { g.src.stop(t + 0.6); g.hissSrc.stop(t + 0.6); } catch (e) { }
      }
    };
  }

  root.HushBed = { start: start, __forged: true };

  /* ── OFFLINE BENCH — Gate.sfx['hush-bed'] : render a fixed slice with a visible
     slow amplitude wobble so the audio-lens can confirm RMS present / no clip /
     dark centroid / breathing. */
  var Gate = root.Gate = root.Gate || {};
  Gate.sfx = Gate.sfx || {};
  Gate.sfx['hush-bed'] = function (opts) {
    var octx = opts.ctx, dest = opts.dest;
    var when = (opts.when == null) ? 0 : opts.when;
    var seed = (opts.seed == null) ? 0x5eed : (opts.seed >>> 0);
    var dur = (opts.dur == null) ? 4.0 : opts.dur;
    var t0 = octx.currentTime + when;
    var g = build(octx, dest, { seed: seed, gain: 0.5, when: t0 });
    // schedule a couple of visible breaths across the render window
    var rnd = mulberry32(seed);
    var t = t0 + 1.4, remain = dur - 1.4, walk = 0.5;
    while (remain > 0.3) {
      var period = 2.5 + rnd() * 2.0;
      walk = Math.max(0.28, Math.min(0.62, walk + (rnd() - 0.5) * 0.28));
      try { g.master.gain.linearRampToValueAtTime(walk, t + period); } catch (e) { }
      t += period; remain -= period;
    }
    try { g.src.stop(t0 + dur + 0.1); g.hissSrc.stop(t0 + dur + 0.1); } catch (e) { }
    return { stop: function () { try { g.src.stop(); g.hissSrc.stop(); } catch (e) { } } };
  };

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
