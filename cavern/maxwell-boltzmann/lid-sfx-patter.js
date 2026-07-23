/* ═══════════════════════════════════════════════════════════════════════════
   lid-sfx-patter.js  —  window.LidSfx.patter  +  Gate.sfx.patter  (KEY="patter")

   The disc-on-lid PATTER: one felt-tipped disc kissing the steel lid. This is
   the atom of "pressure you HEAR getting harder" — hundreds land per second and
   the TEXTURE OF THE DENSITY is the instrument, so a grain must sum politely,
   soft-edged, tiny; never a click-track tick. Think fine gravel on a steel
   drum, not a snare.

   ── PROVENANCE ──────────────────────────────────────────────────────────────
   Foundry synthesis. BASE = take #2 (a felt CONTACT + a damped metal RING baked
   into ONE precomputed buffer, then peak-NORMALISED to an exact quiet target so
   the crowd is clip-proof by construction — the property the brief's "peak
   ≲ 0.05, dozens land per second" most needs, and the only take that proved a
   real multi-grain field sums to pitch=none/tempo=—). Grafts (judges' notes):
     • FROM take #3 — a LOW-WARMTH body layer (a quiet ~215→280 Hz thud that is
       STRONGEST when soft and RECEDES as hardness rises). It warms take #2's
       slightly glassy narrow-metal band and restores a wide felt-on-metal
       tonal range: dark-bodied-soft → bright-hard. Jittered per grain + gone by
       high density, so it does NOT reintroduce a detectable pitch in the sum.
     • Bright end pulled ~10 % down (bandpass top 4200→3800 Hz, ring base
       3500→3200 Hz) to cut the glassiness at hardness 0.8.
   Take #2's exact peak-normalisation + quiet ship target are KEPT verbatim; the
   louder single-grain of take #3 is NOT adopted.

   ── THE MODEL ────────────────────────────────────────────────────────────────
     • body  — one seeded white-noise burst through a hand-rolled RBJ bandpass
               (the muffled "tk" of felt meeting steel), raised-cosine attack so
               the edge is soft (never a sample-instant click), exponential
               decay so it's short.
     • ring  — three INHARMONIC (bar-like) sine partials, quiet + fast-damped:
               the faint colour of the lid's metal, felt-muted so it never pings.
     • warmth— a quiet low body sine, strongest SOFT, receding as pressure rises:
               the "warm, granular" a slack gas wants; keeps soft taps bodied,
               not all-treble.
   The whole grain is synthesised into ONE AudioBuffer and NORMALISED to an exact
   target peak — so every grain, at every hardness/seed, is guaranteed quiet
   (peak = gain·jitter ≲ the small live per-grain gain) and the crowd cannot clip.

   `hardness` (0..1, from the live hit-rate / compression) maps to ATTACK +
   BRIGHTNESS, never loudness (peak is pinned): slack gas → soft, dark, rounded
   tap; crushed gas → tight attack, higher bandpass centre + brighter/sharper
   ring, warmth receded. Deterministic: a seeded mulberry32 PRNG (never
   Math.random) drives micro-variation so a run of grains is gravel-on-steel,
   not a machine-gun of identical clicks. No samples, no reverb tail. Dual-use:
   renders on any BaseAudioContext (offline bench + live page).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  root.LidSfx = root.LidSfx || {};
  var Gate = root.Gate = root.Gate || {};
  Gate.sfx = Gate.sfx || {};

  // ── Seeded PRNG: mulberry32. Deterministic, fast, good for audio noise. ────
  function makeRng(seed) {
    var a = (seed >>> 0) || 1;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ── THE SHIP API — the exact contract from art-specs/patter.md ─────────────
  // o = { ctx, dest, when, dur, gain, hardness, seed }. Schedule ONE grain.
  root.LidSfx.patter = function (o) {
    o = o || {};
    var ctx  = o.ctx, dest = o.dest;
    var when = o.when || 0;
    var dur  = (o.dur != null) ? o.dur : 0.02;
    var gain = (o.gain != null) ? o.gain : 0.045;        // per-grain peak (small)
    var h    = Math.max(0, Math.min(1, o.hardness != null ? o.hardness : 0.5));
    var seed = (o.seed != null) ? o.seed : 1;
    var sr   = ctx.sampleRate;
    var t0   = ctx.currentTime + when;

    var rng = makeRng(seed);
    function lerp(a, b, x) { return a + (b - a) * x; }

    // seeded micro-variation — no two grains identical
    var jFc   = lerp(0.92, 1.08, rng());
    var jRing = lerp(0.96, 1.04, rng());
    var jLvl  = lerp(0.90, 1.10, rng());
    var jAtk  = lerp(0.85, 1.15, rng());
    var jWarm = lerp(0.96, 1.04, rng());   // low-warmth pitch jitter (de-pitches the sum)

    // hardness → attack sharpness + brightness (NOT loudness)
    var atkSec  = lerp(0.0018, 0.0005, h) * jAtk;   // soft edge; sharper when hard
    var bodyTau = lerp(0.0040, 0.0026, h);          // exp decay time-constant (s)
    var fc      = lerp(1500, 3800, h) * jFc;        // bandpass centre — brighter w/ h (darkened top)
    var Q       = lerp(0.9, 1.4, h);                // a touch narrower when hard
    var ringF0  = lerp(2600, 3200, h) * jRing;      // lid-ring base pitch (darkened top)
    var ringTau = lerp(0.0055, 0.0038, h);          // ring damps fast (felt-muted)
    var ringLvl = lerp(0.16, 0.26, h);              // metal a little sharper when hard

    // GRAFT (take #3): low warmth — a quiet body thud, strongest SOFT, receding
    // as pressure rises; jittered so a stream never fuses into a pitched tone.
    var warmLvl = lerp(0.34, 0.05, h);              // recedes with hardness
    var warmF   = lerp(215, 280, h) * jWarm;        // low body pitch
    var warmTau = lerp(0.0110, 0.0075, h);          // tightens a touch when hard
    var warmW   = 2 * Math.PI * warmF / sr;

    var N   = Math.max(1, Math.round(dur * sr));
    var buf = ctx.createBuffer(1, N, sr);
    var d   = buf.getChannelData(0);

    // RBJ bandpass (constant 0 dB peak) coefficients
    var w0 = 2 * Math.PI * fc / sr;
    var cw = Math.cos(w0), sw = Math.sin(w0);
    var alpha = sw / (2 * Q);
    var b0 = alpha, b1 = 0, b2 = -alpha;
    var a0 = 1 + alpha, a1 = -2 * cw, a2 = 1 - alpha;
    b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0;
    var x1 = 0, x2 = 0, y1 = 0, y2 = 0;

    // inharmonic ring partials (bar-like ratios), higher partials quieter
    var ratios = [1, 1.48, 2.11];
    var rw = [], rlv = [];
    for (var p = 0; p < ratios.length; p++) {
      rw.push(2 * Math.PI * ringF0 * ratios[p] / sr);
      rlv.push(ringLvl * Math.pow(0.55, p));
    }

    for (var i = 0; i < N; i++) {
      var t = i / sr;

      // amplitude envelope: raised-cosine attack, exponential decay
      var env = (t < atkSec)
        ? 0.5 - 0.5 * Math.cos(Math.PI * t / atkSec)
        : Math.exp(-(t - atkSec) / bodyTau);

      // body: seeded noise through the bandpass
      var xn = rng() * 2 - 1;
      var yn = b0 * xn + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1; x1 = xn; y2 = y1; y1 = yn;
      var body = yn * env;

      // ring: inharmonic sines under their own exp decay
      var renv = Math.exp(-t / ringTau);
      var ring = 0;
      for (var q = 0; q < rw.length; q++) ring += rlv[q] * Math.sin(rw[q] * i);
      ring *= renv;

      // warmth: one low body sine under its own exp decay (strongest soft)
      var warm = warmLvl * Math.sin(warmW * i) * Math.exp(-t / warmTau);

      d[i] = body + ring + warm;
    }

    // normalise to an EXACT quiet peak — guarantees peak ≲ gain across h/seed
    var peak = 0;
    for (var k = 0; k < N; k++) { var av = Math.abs(d[k]); if (av > peak) peak = av; }
    if (peak > 1e-9) {
      var s = (gain * jLvl) / peak;
      for (var m = 0; m < N; m++) d[m] *= s;
    }

    var node = ctx.createBufferSource();
    node.buffer = buf;
    node.connect(dest);
    node.start(t0);
    node.stop(t0 + dur + 0.005);
    return {
      stop: function (at) { try { node.stop(at != null ? at : ctx.currentTime); } catch (e) {} }
    };
  };

  // ── BENCH ADAPTER — the SFX render bench renders Gate.sfx.patter (real key)
  //    with { ctx, dest, dur, when, seed } (no hardness/gain). Render ONE
  //    representative grain at hardness≈0.8 (per the spec's bench note) at a
  //    clean analysis level; the live room passes its own small per-grain gain.
  Gate.sfx.patter = function (arg) {
    return root.LidSfx.patter({
      ctx: arg.ctx, dest: arg.dest, dur: arg.dur,
      when: arg.when || 0, seed: (arg.seed != null ? arg.seed : 1),
      hardness: 0.8, gain: 0.5
    });
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
