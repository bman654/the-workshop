/* ═══════════════════════════════════════════════════════════════════════════
   flame.js — the living candle. DOM-free, dual-use.

   A flame that only changes opacity reads as a lamp. This one breathes, and
   the way it breathes is the difference between a room and a diagram.

   ── WHY THIS IS NOISE AND NOT A CHORD OF SINES ─────────────────────────────

   The obvious build is five incommensurable sine waves: no common period, so
   it "never repeats". That was the first build here, and it is wrong — and
   the twin caught it. A finite sum of sines is ALMOST PERIODIC: there is
   always some lag at which every term nearly realigns, and at that lag the
   waveform recurs with autocorrelation ~0.99. Measured on the first stack,
   the candle repeated itself at 21.9 seconds, hard. Adding more sines only
   pushes the recurrence out; it never removes it.

   So the flicker is built from smooth VALUE NOISE instead — a deterministic
   integer hash, smootherstep-interpolated, summed over four octaves. Its
   autocorrelation DECAYS and never revives, which is what "no visible loop"
   actually means. It is also simply truer: a real flame flickers as
   broadband noise around a few hertz, not as a chord.

   THE HARD CONTRACT OF THIS ROOM: nothing in the frame is painted with baked-
   in brightness. Every pixel is flicker(t) x albedo x tint(k). Turn the flame
   off and the frame goes black.

   Vanilla, ES5-ish, zero-dependency. Attaches a `Flame` global in the
   browser; exports the same object under Node for the twin.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Flame = {};

  /* A deterministic integer hash — the same everywhere, every session, with
     no RNG state to get out of step between the page and the twin. */
  function hash(i) {
    var x = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b);
    x ^= x >>> 13;
    x = Math.imul(x, 0xc2b2ae35);
    x ^= x >>> 16;
    return (x >>> 0) / 4294967296;
  }

  function smoother(t) { return t * t * t * (t * (6 * t - 15) + 10); }

  /* smooth 1-D value noise: C^1 by construction, so nothing in the flame
     ever moves in a straight line and then corners */
  function vnoise(x) {
    var i = Math.floor(x), f = x - i;
    var a = hash(i), b = hash(i + 1);
    return a + (b - a) * smoother(f);
  }
  Flame.vnoise = vnoise;

  /* four octaves of it, centred on 0 and normalised to [-1, 1] */
  function fbm(t, base, off) {
    var s = 0, amp = 1, tot = 0, fq = base;
    for (var j = 0; j < 4; j++) {
      s += amp * (vnoise(t * fq + off + j * 137.13) - 0.5);
      tot += amp;
      amp *= 0.5;
      fq *= 2;
    }
    return s / (tot * 0.5);
  }
  Flame.fbm = fbm;

  Flame.AMP = 0.15;          /* flicker lives in [0.85, 1.15] */
  var BASE = 0.95;           /* the candle's slowest breath, in Hz */
  var GAIN = 1.5;            /* pushes the noise out to use its range */

  function clamp1(v) { return v < -1 ? -1 : (v > 1 ? 1 : v); }

  /* THE BREATH. One number, sampled ONCE per frame and passed down: if the
     wax and the pool disagreed about how bright the candle is, the room
     would come apart. */
  Flame.flicker = function (t) {
    return 1 + Flame.AMP * clamp1(GAIN * fbm(t, BASE, 3.7));
  };

  /* THE LEAN, in radians — its own noise field, seeded elsewhere and running
     slower. Deliberately NOT in lockstep with the brightness: in a real room
     the draught that pushes a flame over and the draught that feeds it are
     the same air, arriving a moment apart. */
  Flame.LEAN_MAX = 0.20;
  Flame.lean = function (t) {
    return Flame.LEAN_MAX * clamp1(1.35 * fbm(t, 0.41, 811.29));
  };

  /* Height and width from one brightness sample, ANTI-correlated: a surge
     goes tall and narrow, it does not simply inflate. Both are pure
     functions of f, so they can never drift out of step with the light. */
  Flame.heightOf = function (f) { return 1 + 0.34 * (f - 1) / Flame.AMP; };
  Flame.widthOf = function (f) { return 1 - 0.22 * (f - 1) / Flame.AMP; };

  /* The gutter: how far toward orange the pool goes when the flame is low.
     0 at a surge, 1 at the bottom of a dip. */
  Flame.gutter = function (f) {
    var u = (1 + Flame.AMP - f) / (2 * Flame.AMP);
    return u < 0 ? 0 : (u > 1 ? 1 : u);
  };

  /* The pool falloff, 1/(1+r^2): a hot core with a long tail, which is what
     a point source on a floor actually does and what a linear ramp never
     looks like. r is in pool radii. */
  Flame.pool = function (r) { return 1 / (1 + r * r); };

  /* THE HOLD. Once the ring closes, each flame's breath is phase-lagged
     around the ring, so the light visibly CIRCULATES. An open chain cannot
     do this — closure buys a second, temporal channel for the count, and it
     is the reason the hold is worth a whole second. */
  Flame.ringPhase = function (t, index, N) {
    if (!isFinite(N) || N <= 0) return t;
    /* normalise first: the two chains run in opposite directions, so half the
       ring arrives here with a negative index */
    var i = ((index % N) + N) % N;
    return t - (i / N) / BASE;
  };

  /* browser global */
  if (root && root.document) root.Flame = Flame;
  root.Flame = Flame;

  /* dual-use module guard (forge strips exactly this braced single line) */
  if (typeof module !== 'undefined' && module.exports) { module.exports = Flame; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
