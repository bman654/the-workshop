// ============================================================================
//  THE WAVELENGTH RAMP — the estate's ONE λ(nm) → sRGB colour authority.
//
//  Zero-dependency, DOM-free ESM. Runs in the browser AND in Node. This is the
//  shared source for the wavelength→colour ramp that several light pieces draw:
//  the spectroscope's band, the drifting-star plate, and (via forge:include) the
//  First Light cosmology wing's redshifting photon. It existed COPY-PASTED in each
//  of those pages (each carried its OWN verbatim cie1931 / wavelengthToRGB /
//  visibleIntensity, marked "NOT exported"); First Light is the first piece to
//  inline this single module instead of typing a fresh copy, so no NEW drift is
//  introduced — the ramp lives here once and the page byte-inlines it.
//
//  THE RAMP. cie1931(λ) is the multi-lobe Gaussian fit to the CIE 1931 2° colour-
//  matching functions (Wyman, Sledge & Subramanian 2013); wavelengthToRGB then
//  maps XYZ → linear sRGB (D65) → gamma sRGB, hue-preserving (brightest channel
//  normalised to 1), and returns BLACK ([0,0,0]) for any λ outside the visible
//  band [380, 750] nm — so a photon that redshifts OUT of the band goes dark, the
//  way a real one does. visibleIntensity(λ) is the perceptual edge-falloff used
//  only for continuous-band brightness; it never touches hue.
//
//  These three functions are byte-faithful (indentation-normalised) to the copies
//  in spectroscope/index.html and drifting-star/index.html.
// ============================================================================

// === WAVELENGTH-RAMP CORE BEGIN ===
"use strict";

// The CIE 1931 2° colour-matching functions, multi-lobe Gaussian fit (Wyman,
// Sledge & Subramanian 2013). Returns [X, Y, Z] tristimulus for a wavelength in nm.
function cie1931(lambdaNm){
  function g(x, mu, s1, s2){
    var t = (x - mu) * (x < mu ? s1 : s2);
    return Math.exp(-0.5 * t * t);
  }
  var X = 1.056 * g(lambdaNm, 599.8, 0.0264, 0.0323)
        + 0.362 * g(lambdaNm, 442.0, 0.0624, 0.0374)
        - 0.065 * g(lambdaNm, 501.1, 0.0490, 0.0382);
  var Y = 0.821 * g(lambdaNm, 568.8, 0.0213, 0.0247)
        + 0.286 * g(lambdaNm, 530.9, 0.0613, 0.0322);
  var Z = 1.217 * g(lambdaNm, 437.0, 0.0845, 0.0278)
        + 0.681 * g(lambdaNm, 459.0, 0.0385, 0.0725);
  return [X, Y, Z];
}

// λ(nm) → sRGB [r,g,b] in 0..255. BLACK ([0,0,0]) outside the visible band
// [380, 750] nm (a redshifted-out photon goes dark). Hue-preserving: the brightest
// channel is normalised to 1 before the sRGB gamma transfer.
function wavelengthToRGB(lambdaNm){
  // outside the visible band → black (no contribution)
  if (lambdaNm < 380 || lambdaNm > 750) return [0, 0, 0];
  var xyz = cie1931(lambdaNm);
  var X = xyz[0], Y = xyz[1], Z = xyz[2];
  // XYZ → linear sRGB (sRGB / D65 matrix)
  var rl =  3.2406 * X - 1.5372 * Y - 0.4986 * Z;
  var gl = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
  var bl =  0.0557 * X - 0.2040 * Y + 1.0570 * Z;
  // clamp negative (out-of-gamut) to 0
  rl = Math.max(0, rl); gl = Math.max(0, gl); bl = Math.max(0, bl);
  // normalise so the brightest channel is 1 (preserve hue, full saturation)
  var mx = Math.max(rl, gl, bl);
  if (mx > 0){ rl /= mx; gl /= mx; bl /= mx; }
  // gamma-correct (sRGB transfer)
  function enc(c){
    c = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.round(Math.max(0, Math.min(1, c)) * 255);
  }
  return [enc(rl), enc(gl), enc(bl)];
}

// Perceptual luminance falloff toward the spectrum edges (for continuous band
// brightness only — does NOT affect hue). 1.0 in mid-band, →0 at the rims.
function visibleIntensity(lambdaNm){
  if (lambdaNm < 380 || lambdaNm > 750) return 0;
  if (lambdaNm < 420) return 0.30 + 0.70 * (lambdaNm - 380) / 40;
  if (lambdaNm > 700) return 0.30 + 0.70 * (750 - lambdaNm) / 50;
  return 1.0;
}
// === WAVELENGTH-RAMP CORE END ===

export { cie1931, wavelengthToRGB, visibleIntensity };
