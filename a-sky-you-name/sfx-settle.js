'use strict';
/* ── SFX: "settle" — the warm settle-swell + brass ting on catasterize ───────
   The "it is WRITTEN" beat. A low, wide, warm chord blooms up as the ink lays
   down — a gentle attack through a lowpass that opens as the swell rises, giving
   a soft "bloom" rather than a sudden onset — then a single clean warm brass TING
   sets the name a touch after the swell begins, decaying into the swell's tail.
   Dignified, unhurried, ~1.4s; warm not glassy, no fanfare.

   FOUNDRY FINAL — base is take-1 ("WEIGHT + BLOOM"): a LOW warm C-major triad
   (C3 root + a C2 sub-octave for real low body) bloomed under a lowpass that
   sweeps open, capped by a warm brass TING on G5 with a SOFT 6ms attack (no
   click) and a gentle body lowpass so it reads brass, not glass, decaying into
   the swell's tail. In tune (G5+0c ting over the C-major swell), warm centroid
   that mellows on the ring, honest decay to silence.

   GRAFT (from the judges' notes — take-2's arrival window, made dignified): a
   GENTLE swell duck (~30%, softer than take-2's ~58%) right before the ting so
   the "it is written" arrival steps forward and is unmistakable, then a smooth
   return that carries the ting's decay to rest. This keeps take-1's soft 6ms
   attack, warmth, tuning, and smooth monotonic decay — no sharp strike, no
   mid-tail wobble — and only opens a small acoustic window so the ting no longer
   fuses into the swell crest. Dignified, not triumphant.

   Deterministic (seeded mulberry32, never Math.random) — the tiny detune/shimmer
   the analysis reads is exactly what ships. Mono-safe, peaks well under 0 dBFS.
   Contract: Gate.sfx.settle({ ctx, dest, dur, when=0, seed=1, param=0.9 }) -> {stop(at)}
   ─────────────────────────────────────────────────────────────────────────── */
window.Gate = window.Gate || {}; window.Gate.sfx = window.Gate.sfx || {};
window.Gate.sfx.settle = function ({ ctx, dest, dur, when = 0, seed = 1, param = 0.9 }) {
  var t0 = ctx.currentTime + when;
  var D = (dur && dur > 0) ? dur : 1.4;

  // ── seeded PRNG (mulberry32) — deterministic, never Math.random ──
  var s = (seed >>> 0) || 1;
  function rnd() {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    var t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function detune(cents) { return Math.pow(2, ((rnd() - 0.5) * 2 * cents) / 1200); }

  // param (0..1) scales overall presence a touch (default 0.9); clamp.
  var pres = Math.max(0.4, Math.min(1.2, (param == null ? 0.9 : param)));

  var master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(dest);

  // Ting onset — a touch after the swell begins (~0.22*D), the "…and it is set".
  var tt = t0 + Math.min(0.30, D * 0.22);

  // ══ 1) THE SWELL — a low, warm chord that blooms up under a lowpass ═════════
  var swellDur = D;                    // fills the whole life
  var swellPk  = 0.30 * pres;          // comfortable headroom (chord sums below)

  // Bloom filter: opens 300 -> ~900 Hz as the chord swells, then eases back a
  // hair as it settles — a soft "opening" rather than a bright attack.
  var lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 0.7;
  lp.frequency.setValueAtTime(300, t0);
  lp.frequency.linearRampToValueAtTime(900, t0 + swellDur * 0.45);
  lp.frequency.linearRampToValueAtTime(560, t0 + swellDur);

  var swellEnv = ctx.createGain();
  // Gentle attack (bloom in ~0.36s), a brief hold, then a GENTLE duck (~30%)
  // right before the ting to open a small acoustic window so the arrival steps
  // forward — softer than a theatrical duck, so it stays a settle, not an
  // announcement — then a smooth return and a long soft exponential settle.
  var duckLo = swellPk * 0.70;         // gentle ~30% dip — dignified window, no wobble
  swellEnv.gain.setValueAtTime(0.0001, t0);
  swellEnv.gain.exponentialRampToValueAtTime(swellPk, t0 + 0.36);
  swellEnv.gain.setValueAtTime(swellPk, tt - 0.04);                 // hold to just before ting
  swellEnv.gain.linearRampToValueAtTime(duckLo, tt + 0.05);         // gentle duck — clears the arrival
  swellEnv.gain.linearRampToValueAtTime(swellPk * 0.88, tt + 0.42); // soft return under the ring
  swellEnv.gain.exponentialRampToValueAtTime(0.0004, t0 + swellDur);
  swellEnv.connect(lp); lp.connect(master);

  // Low warm triad on C3 (C-major, open + steady = "arrival at rest"), plus a
  // sub-octave C2 body sine for weight. Slightly detuned per-voice for warmth.
  var C2 = 65.41, C3 = 130.81, E3 = 164.81, G3 = 196.00;
  var voices = [
    { f: C2, g: 0.55, type: 'sine',     cents: 3 },  // sub body — the weight
    { f: C3, g: 1.00, type: 'triangle', cents: 1 },  // root — a little edge for the LP to shape
    { f: E3, g: 0.62, type: 'sine',     cents: 4 },  // major 3rd — warmth
    { f: G3, g: 0.70, type: 'sine',     cents: 4 }   // 5th — openness
  ];
  var oscs = [];
  for (var i = 0; i < voices.length; i++) {
    var v = voices[i];
    var o = ctx.createOscillator(); o.type = v.type;
    o.frequency.value = v.f * detune(v.cents); // root kept tight so pitch reads true
    var g = ctx.createGain(); g.gain.value = v.g * 0.34;
    o.connect(g); g.connect(swellEnv);
    o.start(t0); o.stop(t0 + swellDur + 0.08);
    oscs.push(o);
  }

  // ══ 2) THE BRASS TING — a warm struck chord that SETS the name ══════════════
  // Enters a touch after the swell begins (~0.22*D). Fundamental G5 sits a 5th
  // above the swell's root world (consonant, "resolves"). A soft attack (6ms
  // ramp, no click), a gentle lowpass to keep it brass not glass, decaying into
  // the swell's tail so the two fuse.
  var G5 = 783.99;                      // the struck note
  var tingDur = Math.max(0.7, D * 0.72);

  var tingBus = ctx.createGain();
  tingBus.gain.value = 0.72 * pres;   // a touch prouder than the swell — it SETS the name
  var tlp = ctx.createBiquadFilter();
  tlp.type = 'lowpass';
  tlp.Q.value = 0.6;
  // opens quickly on the strike, then rolls the top off as it rings -> mellows
  tlp.frequency.setValueAtTime(3600, tt);
  tlp.frequency.exponentialRampToValueAtTime(1400, tt + tingDur * 0.85);
  tingBus.connect(tlp); tlp.connect(master);

  // Brass-warm partial stack: fundamental + octave body + a few mostly-integer
  // upper partials that decay FASTER than the fundamental (bright-then-mellow =
  // struck brass). Upper partials modest so it never turns glassy.
  var partials = [
    { mult: 0.5,  g: 0.35, decK: 1.00 },  // sub-octave body — brass "chest"
    { mult: 1.0,  g: 1.00, decK: 1.00 },  // fundamental — the pitch anchor
    { mult: 2.0,  g: 0.42, decK: 0.70 },  // octave — warm body
    { mult: 3.0,  g: 0.20, decK: 0.48 },  // 12th — brass reed edge
    { mult: 4.02, g: 0.11, decK: 0.34 }   // faint upper shimmer (slightly stretched)
  ];
  for (var k = 0; k < partials.length; k++) {
    var p = partials[k];
    var oo = ctx.createOscillator(); oo.type = 'sine';
    oo.frequency.value = G5 * p.mult * detune(2);   // <=2 cents shimmer
    var gn = ctx.createGain();
    var dec = tingDur * p.decK;
    gn.gain.setValueAtTime(0.0001, tt);
    gn.gain.linearRampToValueAtTime(p.g * 0.5, tt + 0.006);  // soft 6ms attack, no click
    gn.gain.exponentialRampToValueAtTime(0.0004, tt + dec);
    oo.connect(gn); gn.connect(tingBus);
    oo.start(tt); oo.stop(tt + dec + 0.05);
    oscs.push(oo);
  }

  return {
    stop: function (at) {
      var a = (at != null) ? at : ctx.currentTime;
      try {
        swellEnv.gain.cancelScheduledValues(a);
        swellEnv.gain.setTargetAtTime(0, a, 0.05);
        tingBus.gain.setTargetAtTime(0, a, 0.05);
        master.gain.setTargetAtTime(0, a, 0.05);
      } catch (e) {}
    }
  };
};
