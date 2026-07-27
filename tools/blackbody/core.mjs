// ============================================================================
//  BLACKBODY — the estate's ONE temperature → colour authority.
//
//  Zero-dependency, DOM-free ESM.  Runs in the browser (forge-inlined) AND in
//  Node (`node tools/blackbody/core.test.mjs`).  It answers one question:
//
//      what colour is something that is merely HOT?
//
//  and it answers it the long way round — Planck's law for the spectrum, the
//  estate's existing CIE 1931 observer for the eye, the sRGB matrix for the
//  screen.  Nothing here was colour-picked.  A fire, a filament, a poker, a
//  star, a cooling casting: any of them can ask this file for its colour and
//  get the same answer.
//
//  IT DOES NOT FORK THE OBSERVER.  `cie1931` lives in tools/spectrum/
//  wavelength.mjs and is imported (Node) / inlined beside this file (browser,
//  where the forge drops the import statement).  One observer, estate-wide.
//
//  WHAT IS CLAIMED, AND HOW IT IS CHECKED  (tools/blackbody/core.test.mjs)
//    · `planck` is the real Planck law: its peak obeys Wien's displacement
//      law (λ_max·T = 2.8978e-3 m·K) and its integral over all λ obeys
//      Stefan–Boltzmann (∫πB dλ = σT⁴, σ = 5.6704e-8) — both measured
//      NUMERICALLY out of this very function, not asserted from a table;
//    · the chromaticities that come back trace the published Planckian locus;
//    · `bbLinearSRGB` preserves that chromaticity exactly wherever sRGB can
//      hold it, and where it cannot (everything below ~1900 K is outside the
//      little triangle a monitor can make) it desaturates toward the white
//      point at CONSTANT LUMINANCE by the smallest step that gets inside —
//      the compromise is measured and reported by `bbGamutDistance`, never
//      quietly buried.
//
//  UNITS.  Wavelengths in nanometres at the boundary, metres inside.  T in
//  kelvin.  `planck` returns spectral radiance in W·sr⁻¹·m⁻³.
// ============================================================================

import { cie1931 } from '../spectrum/wavelength.mjs';

// === BLACKBODY CORE BEGIN ===
"use strict";

/* physical constants (CODATA, exact by SI definition where marked) */
const BB_H     = 6.62607015e-34;   // Planck constant, J·s          (exact)
const BB_C     = 299792458;        // speed of light, m/s           (exact)
const BB_KB    = 1.380649e-23;     // Boltzmann constant, J/K       (exact)
const BB_SIGMA = 5.670374419e-8;   // Stefan–Boltzmann, W·m⁻²·K⁻⁴  (derived)
const BB_WIEN  = 2.897771955e-3;   // Wien displacement, m·K        (derived)

/* Planck's law — spectral radiance of a blackbody at temperature T, per unit
   wavelength.  λ in METRES, T in kelvin, result in W·sr⁻¹·m⁻³.
   Guarded at both ends: λ→0 underflows to 0 rather than dividing by ∞-1. */
function planck(lambdaM, T){
  if (!(lambdaM > 0) || !(T > 0)) return 0;
  const x = (BB_H * BB_C) / (lambdaM * BB_KB * T);
  if (x > 700) return 0;                       // exp overflows past here; radiance is ~1e-300 anyway
  const num = 2 * BB_H * BB_C * BB_C;
  return num / (Math.pow(lambdaM, 5) * (Math.expm1(x)));
}

/* the same law with λ in nanometres, which is what every caller here wants */
function planckNm(lambdaNm, T){ return planck(lambdaNm * 1e-9, T); }

/* Wien's displacement law and the Stefan–Boltzmann law, as CLOSED FORMS.
   The test measures both out of `planck` itself and compares — that is the
   whole point of having them here. */
function bbWienPeakNm(T){ return (BB_WIEN / T) * 1e9; }
function bbStefanBoltzmann(T){ return BB_SIGMA * T * T * T * T; }

/* ── the observer ──────────────────────────────────────────────────────────
   Integrate a spectrum against the CIE 1931 2° colour-matching functions.
   `spd(λnm)` is any spectral power distribution; the result is unnormalised
   XYZ in whatever units spd carries (times nm). 1 nm steps over 360–830 nm:
   the CMFs are ~1e-4 of peak outside that, and the fit is smooth, so the
   trapezoid error is far below the fit's own ~1% accuracy. */
const BB_LAMBDA_MIN = 360, BB_LAMBDA_MAX = 830, BB_LAMBDA_STEP = 1;
function bbSpectrumToXYZ(spd){
  let X = 0, Y = 0, Z = 0;
  for (let l = BB_LAMBDA_MIN; l <= BB_LAMBDA_MAX; l += BB_LAMBDA_STEP){
    const p = spd(l);
    if (!p) continue;
    const c = cie1931(l);
    X += p * c[0]; Y += p * c[1]; Z += p * c[2];
  }
  return [X * BB_LAMBDA_STEP, Y * BB_LAMBDA_STEP, Z * BB_LAMBDA_STEP];
}

/* XYZ of a blackbody at T (unnormalised — its magnitude carries the T⁴). */
function bbXYZ(T){ return bbSpectrumToXYZ((l) => planckNm(l, T)); }

/* chromaticity (x, y) — the point on the Planckian locus */
function bbChromaticity(T){
  const [X, Y, Z] = bbXYZ(T), s = X + Y + Z;
  return s > 0 ? [X / s, Y / s] : [0, 0];
}

/* ── the screen ────────────────────────────────────────────────────────────
   sRGB primaries, D65 white.  Forward and inverse, so the gamut walk below
   can move in RGB and read the result back in XYZ. */
function bbXYZtoLinearRGB(X, Y, Z){
  return [
     3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z,
    -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z,
     0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z,
  ];
}
/* the sRGB luminance row of the INVERSE matrix — Y of a linear RGB triple.
   Carried to seven figures so that "luminance 1" below is true to 1e-7 and
   not to 1e-4; the test asserts it. */
function bbLuminance(r, g, b){ return 0.2126729 * r + 0.7151522 * g + 0.0721750 * b; }

/* sRGB transfer function (linear → display), and its inverse */
function bbEncode(c){
  c = Math.max(0, Math.min(1, c));
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}
function bbDecode(c){
  c = Math.max(0, Math.min(1, c));
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/* ── the colour ────────────────────────────────────────────────────────────
   `bbLinearSRGB(T)` — the colour of a blackbody at T as LINEAR sRGB,
   normalised to luminance 1.  Multiply by (T/T₀)⁴ and you have the relative
   radiance too; keep it at 1 and you have pure hue.

   OUT OF GAMUT.  Below about 1900 K the Planckian locus leaves the sRGB
   triangle: the honest answer has a negative blue.  We do NOT clamp (that
   shifts both hue and luminance silently).  We desaturate toward the D65
   white point — the straight line in linear RGB that HOLDS LUMINANCE — and
   we take the smallest step that lands inside, solved exactly rather than
   searched: for each channel that is negative, the mix t that zeroes it is
   t = -c / (w - c), and we take the largest such t.  `bbGamutDistance(T)`
   returns that t, so the room can print how much it had to give up. */
const BB_WHITE = [1, 1, 1];   // D65 in linear sRGB, luminance 1 by construction

function bbLinearSRGBRaw(T){
  const [X, Y, Z] = bbXYZ(T);
  if (!(Y > 0)) return [0, 0, 0];
  return bbXYZtoLinearRGB(X / Y, 1, Z / Y);   // normalise to luminance Y = 1
}
function bbGamutDistance(T){
  const c = bbLinearSRGBRaw(T);
  let t = 0;
  for (let i = 0; i < 3; i++){
    if (c[i] < 0){
      const ti = -c[i] / (BB_WHITE[i] - c[i]);
      if (ti > t) t = ti;
    }
  }
  return Math.min(1, t);
}
function bbLinearSRGB(T){
  const c = bbLinearSRGBRaw(T);
  const t = bbGamutDistance(T);
  if (t <= 0) return c;
  return [
    c[0] + t * (BB_WHITE[0] - c[0]),
    c[1] + t * (BB_WHITE[1] - c[1]),
    c[2] + t * (BB_WHITE[2] - c[2]),
  ];
}

/* display bytes for a swatch: hue at luminance `scale` (0..1), sRGB-encoded */
function bbSwatch255(T, scale){
  const c = bbLinearSRGB(T), s = (scale === undefined ? 1 : scale);
  const mx = Math.max(c[0], c[1], c[2]) || 1;
  return [
    Math.round(255 * bbEncode(c[0] / mx * s)),
    Math.round(255 * bbEncode(c[1] / mx * s)),
    Math.round(255 * bbEncode(c[2] / mx * s)),
  ];
}
function bbSwatchCSS(T, scale){
  const c = bbSwatch255(T, scale);
  return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
}

/* ── a NARROW BAND ─────────────────────────────────────────────────────────
   Not everything that glows is a blackbody.  The blue at the root of a flame
   is not hot soot at all — it is chemiluminescence: excited CH radicals
   emitting at 431 nm and C₂ (the Swan bands) at 473 and 516 nm.  Those go
   through the SAME observer, so the room can be honest about which of its
   colours is temperature and which is chemistry.
   `bandLinearSRGB(λnm, fwhmNm)` → linear sRGB at luminance 1, gamut-fixed
   the same way. */
function bbBandXYZ(lambdaNm, fwhmNm){
  const sig = (fwhmNm || 6) / 2.3548220;
  return bbSpectrumToXYZ((l) => {
    const t = (l - lambdaNm) / sig;
    return Math.exp(-0.5 * t * t);
  });
}
function bbBandLinearSRGB(lambdaNm, fwhmNm){
  const [X, Y, Z] = bbBandXYZ(lambdaNm, fwhmNm);
  if (!(Y > 0)) return [0, 0, 0];
  const c = bbXYZtoLinearRGB(X / Y, 1, Z / Y);
  let t = 0;
  for (let i = 0; i < 3; i++) if (c[i] < 0){
    const ti = -c[i] / (BB_WHITE[i] - c[i]); if (ti > t) t = ti;
  }
  if (t <= 0) return c;
  return [c[0] + t * (1 - c[0]), c[1] + t * (1 - c[1]), c[2] + t * (1 - c[2])];
}

/* ── how BRIGHT, not just what colour ──────────────────────────────────────
   The eye's share of a blackbody's output — the Y of the same integral the
   colour came from.  This is what makes a fire's core white-hot and its
   dying edge a dull red *at the same time*: between 900 K and 1600 K the
   visible output rises by a factor of some hundreds, and that ratio is a
   measured property of Planck's law, not a brightness knob. */
function bbVisibleLuminance(T){ return bbXYZ(T)[1]; }

/* ── the ramp a GPU can hold ───────────────────────────────────────────────
   `bbLUT(n, tMin, tMax, tRef)` → Float32Array(n*4), sampled uniformly in T:
     · rgb   linear sRGB at luminance 1 (hue alone, gamut-repaired)
     · a     log₁₀ of the visible-band luminance relative to tRef
   so a shader reconstructs the whole emission with one fetch:
       emission = rgb · 10^a · exposure
   — the same numbers this file computes, so the picture on the screen and
   the claim in the test are one thing.  Alpha is stored as a LOG because it
   spans many decades across a fire and a log interpolates smoothly where the
   raw ratio would not.  The i-th entry is T = tMin + (i + 0.5)·(tMax − tMin)/n
   (texel CENTRES, which is what a shader samples at). */
function bbLUT(n, tMin, tMax, tRef){
  const out = new Float32Array(n * 4);
  const ref = bbVisibleLuminance(tRef === undefined ? (tMin + tMax) / 2 : tRef);
  for (let i = 0; i < n; i++){
    const T = tMin + (i + 0.5) * (tMax - tMin) / n;
    const c = bbLinearSRGB(T);
    const y = bbVisibleLuminance(T);
    out[i * 4    ] = c[0];
    out[i * 4 + 1] = c[1];
    out[i * 4 + 2] = c[2];
    out[i * 4 + 3] = Math.log10(Math.max(1e-300, y / ref));
  }
  return out;
}
/* the inverse of that indexing — where a shader would land, given T */
function bbLUTCoord(T, n, tMin, tMax){
  return Math.min(1, Math.max(0, (T - tMin) / (tMax - tMin)));
}
// === BLACKBODY CORE END ===

export {
  BB_H, BB_C, BB_KB, BB_SIGMA, BB_WIEN,
  planck, planckNm, bbWienPeakNm, bbStefanBoltzmann,
  bbSpectrumToXYZ, bbXYZ, bbChromaticity, bbVisibleLuminance,
  bbXYZtoLinearRGB, bbLuminance, bbEncode, bbDecode,
  bbLinearSRGBRaw, bbLinearSRGB, bbGamutDistance,
  bbSwatch255, bbSwatchCSS,
  bbBandXYZ, bbBandLinearSRGB,
  bbLUT, bbLUTCoord,
};
