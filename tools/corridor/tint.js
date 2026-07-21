/* ═══════════════════════════════════════════════════════════════════════════
   tint.js — The Green Corridor's colour ladder. DOM-free, dual-use.

   Two mirrors facing each other make a corridor of images: image k is a
   reflection of image k-1, so the light that reaches your eye from the k-th
   flame has crossed the silvering k times. Each crossing keeps only MOST of
   the light — and it keeps the RED least. Multiply that k times and the
   corridor walks gold → sage → bottle-green → nothing.

   NOTHING HERE IS MEASURED. RHO is a feeling, honestly chosen: a little less
   light at every bounce, and the warm end of it going first. The gold→sage→
   green walk is then FORCED by multiplication — it is not authored, not a
   gradient someone picked. That is the whole trick, and it is the only claim
   this file makes.

   Two rules that are load-bearing and easy to get wrong:

   1. POWERS IN LINEAR LIGHT, encode ONCE at draw. Compounding in sRGB turns
      the middle distance muddy grey instead of sage and quietly destroys the
      entire payoff.
   2. DITHER ON ENCODE. The far throat is all sub-8-bit values; without a
      half-LSB ordered dither it bands into visible rings.

   Vanilla, ES5-ish, zero-dependency. Attaches a `Tint` global in the browser;
   exports the same object under Node for the twin.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Tint = {};

  /* Per-bounce survival of the silvering, R G B. Red goes first — that is the
     green. Chosen because the corridor looks right, not because it was read
     off an instrument. */
  var RHO   = [0.72, 0.90, 0.82];
  /* The candle itself, in linear light. */
  var FLAME = [1.00, 0.62, 0.26];

  Tint.RHO = RHO;
  Tint.FLAME = FLAME;

  /* Rec.709 luminance — used only to decide when a flame has become too faint
     to be a flame. */
  function luma(c) { return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  Tint.luma = luma;
  Tint.FLAME_LUMA = luma(FLAME);

  function clamp01(x) { return x < 0 ? 0 : (x > 1 ? 1 : x); }
  Tint.clamp01 = clamp01;

  /* ───────────────────────────────────────────────────────────────────────
     THE LADDER.

     tint(k) is the linear-light colour of the k-th flame: the candle's own
     spectrum, attenuated once per bounce. k = 0 is the candle itself and is
     returned unchanged.

     sigA / sigB in [0,1] are the two mirrors' silvering. They are separate so
     that TAKING A MIRROR AWAY can be a dissolve rather than a switch: drive
     sigB from 1 to 0 and the whole arcade drains instead of vanishing.

     nA / nB are how many times the ray met mirror A and mirror B. The default
     is the alternating word (floor/ceil), which is what a chain starting at A
     actually accumulates; the orbit generator passes the true counts.
     ─────────────────────────────────────────────────────────────────────── */
  Tint.tint = function (k, sigA, sigB, nA, nB) {
    if (sigA === undefined || sigA === null) sigA = 1;
    if (sigB === undefined || sigB === null) sigB = 1;
    if (nA === undefined) nA = Math.floor(k / 2);
    if (nB === undefined) nB = Math.ceil(k / 2);
    var g = Math.pow(sigA, nA) * Math.pow(sigB, nB);
    return [
      FLAME[0] * Math.pow(RHO[0], k) * g,
      FLAME[1] * Math.pow(RHO[1], k) * g,
      FLAME[2] * Math.pow(RHO[2], k) * g
    ];
  };

  /* Attenuation of the k-th flame relative to the candle, by luminance.
     This is the number the visibility floor is measured against. */
  Tint.atten = function (k, sigA, sigB, nA, nB) {
    return luma(Tint.tint(k, sigA, sigB, nA, nB)) / Tint.FLAME_LUMA;
  };

  /* ───────────────────────────────────────────────────────────────────────
     ENCODE — linear light → an 8-bit sRGB triple, with a half-LSB ordered
     dither. `d` is a dither offset in [-0.5, 0.5] LSB; pass a screen-position
     hash for a stable pattern, or omit for none.
     ─────────────────────────────────────────────────────────────────────── */
  Tint.enc1 = function (v, d) {
    var s = 255 * Math.pow(clamp01(v), 1 / 2.2) + (d || 0);
    s = Math.round(s);
    return s < 0 ? 0 : (s > 255 ? 255 : s);
  };

  Tint.css = function (c, alpha, d) {
    var r = Tint.enc1(c[0], d), g = Tint.enc1(c[1], d), b = Tint.enc1(c[2], d);
    if (alpha === undefined || alpha === null) alpha = 1;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + (Math.round(alpha * 1000) / 1000) + ')';
  };

  /* A 4x4 Bayer matrix scaled to ±0.5 LSB. Deterministic, screen-stable. */
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  Tint.dither = function (x, y) {
    var i = ((y | 0) & 3) * 4 + ((x | 0) & 3);
    return BAYER[i] / 16 - 0.46875;   /* [-0.469, +0.469] LSB */
  };

  /* ───────────────────────────────────────────────────────────────────────
     THE VISIBILITY FLOOR.

     There is NO image cap. The train simply recedes until a flame is no
     longer light, and what is left of it is handed to a single throat glow —
     so nothing is ever seen to be cut off. alpha depends ONLY on the bounce
     count k, never on how far apart the mirrors are: pulling the mirrors
     apart buys you no more infinity, only more silence between the lights.
     ─────────────────────────────────────────────────────────────────────── */
  Tint.A_FLOOR = 0.0035;
  Tint.S_MIN = 0.6;

  Tint.smoother = function (a, b, x) {
    if (a === b) return x < a ? 0 : 1;
    var t = clamp01((x - a) / (b - a));
    return t * t * t * (t * (6 * t - 15) + 10);
  };

  /* Visibility of a flame: how much of its light is DRAWN (the rest goes to
     the throat glow). Both gates are C^2, so nothing ever pops. */
  Tint.visibility = function (k, haloRadius, sigA, sigB, nA, nB) {
    var A = Tint.atten(k, sigA, sigB, nA, nB);
    var fA = Tint.smoother(Tint.A_FLOOR, 4 * Tint.A_FLOOR, A);
    var fS = (haloRadius === undefined || haloRadius === null)
      ? 1 : Tint.smoother(Tint.S_MIN, 3 * Tint.S_MIN, haloRadius);
    return fA * fS;
  };

  /* browser global */
  if (root && root.document) root.Tint = Tint;
  root.Tint = Tint;

  /* dual-use module guard (forge strips exactly this braced single line) */
  if (typeof module !== 'undefined' && module.exports) { module.exports = Tint; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
