/* ═══════════════════════════════════════════════════════════════════════════
   einstein-ring/core.mjs — the SOLE lensing authority for
   The Ring Made of One Star (a touchable gravitational-lens drag-instrument).

   This file is the one true source for the exhibit's lensing geometry. It is
   inlined BYTE-IDENTICAL (between the CORE BEGIN / CORE END sentinels) into
   einstein-ring/index.html, and a Node twin (core.test.mjs) re-derives the one
   claim this room stakes its name on — that when a dark mass slides EXACTLY in
   front of a background star, the star's two images close into ONE complete
   bright RING at the Einstein radius θ_E — and exhibits the falsifier that with
   NO mass (θ_E = 0) there is exactly one un-bent image.

   THE THIN-LENS POINT-MASS MODEL, in illustrative SKY-UNITS (NOT GR
   ray-tracing). Everything is measured in θ_E-units: angles in θ_E-units, β is
   the SCALAR magnitude of the source's angular offset along the source axis
   (β ≥ 0 by convention, so one-image-in / one-image-out holds with no
   sign-flip). The lens equation is

        β = θ − θ_E² / θ        (the point-mass thin lens, scalar form)

   whose two roots are the two images of the one source. At β = 0 the roots are
   θ = ±θ_E — the full Einstein RING.

   CANONICAL UNITS: EINSTEIN_K = 1 is a DECLARED illustrative constant; the
   physical Einstein angle is θ_E = √(4GM/c² · D_LS/(D_L D_S)). Here we declare
   θ_E ∝ √M with constant 1 — heavier lens, fatter ring — and carry the
   hawking-honesty line on the page: "thin-lens point-mass, illustrative
   sky-units, not GR ray-tracing."

   THE FRAME (the contract every facet obeys):
     · θ_E ≥ 0; β ≥ 0 (scalar magnitude along the source axis).
     · θ₊ = ½(β + √(β²+4θ_E²)) is the OUTER image: θ₊ > θ_E, on the +source side.
     · θ₋ = ½(β − √(β²+4θ_E²)) is the INNER image: θ₋ < 0, |θ₋| < θ_E, opposite side.
     · By Vieta: θ₊·θ₋ = −θ_E² and θ₊ + θ₋ = β (both exact).
     · Magnification per image μ(θ) = 1/(1 − (θ_E/θ)⁴) is SIGNED; the BRIGHTNESS
       sum is |μ₊| + |μ₋| ≥ 1 always, with the bonus invariant μ₊ + μ₋ = 1
       (light is redistributed, never created).
     · At β = 0 the source sits dead behind the lens: μ_total → ∞ (the ring is
       infinitely thin in this point model — a finite ring width keeps it
       physical on the page).
     · The render layer owns the sky-angle → pixel transform; this core is pure
       math, DOM-free, and never touches pixels.

   Zero-dep ESM. No randomness, no wall-clock — every export is a pure function.
   ═══════════════════════════════════════════════════════════════════════════ */

/* CORE BEGIN — inlined byte-identical into index.html between the same sentinels.
   Do NOT edit one copy without the other; core.test.mjs asserts byte parity. */
var LensCore = (function () {
  'use strict';

  // ── the DECLARED illustrative constant. Physical θ_E = √(4GM/c²·D_LS/(D_L D_S));
  //    here we declare θ_E = K·√M with K = 1 (illustrative sky-units). ──
  var EINSTEIN_K = 1;

  // ── θ_E ∝ √M: the Einstein angle from the lens mass M (M ≥ 0). ──
  function thetaEinstein(M) {
    if (!(isFinite(M)) || M < 0) return NaN;
    return EINSTEIN_K * Math.sqrt(M);
  }

  /* ── the two images of one source ─────────────────────────────────────────
     Solve the scalar lens equation β = θ − θ_E²/θ ⇒ θ² − βθ − θ_E² = 0, whose
     roots are θ± = ½(β ± √(β²+4θ_E²)).
       θ_E === 0 (no lens): a single un-bent image at θ = β (NEG-CONTROL).
       θ_E  >  0          : θ₊ > θ_E (outer, +side); θ₋ < 0, |θ₋| < θ_E (inner). */
  function imagePositions(beta, thetaE) {
    if (!(isFinite(beta) && isFinite(thetaE)) || thetaE < 0) return null;
    if (thetaE === 0) {
      return { single: true, theta: beta, thetaPlus: beta, thetaMinus: null };
    }
    var disc = Math.sqrt(beta * beta + 4 * thetaE * thetaE);
    return {
      single: false,
      thetaPlus: 0.5 * (beta + disc),
      thetaMinus: 0.5 * (beta - disc)
    };
  }

  /* ── signed magnification of a single image at position θ ──────────────────
     μ(θ) = 1/(1 − (θ_E/θ)⁴). The outer image (|θ|>θ_E) has μ>0; the inner
     image (|θ|<θ_E) has μ<0 (parity-flipped). No lens ⇒ μ = 1 everywhere. */
  function magnification(theta, thetaE) {
    if (thetaE === 0) return 1;
    var r = thetaE / theta;
    var r4 = r * r * r * r;
    return 1 / (1 - r4);
  }

  /* ── total BRIGHTNESS magnification |μ₊| + |μ₋| (≥ 1 always) ────────────────
     Closed form in u = |β|/θ_E:  μ_total = (u²+2) / (u·√(u²+4)).
       No lens ⇒ 1.  Perfect alignment (u = 0) ⇒ Infinity (honest: the
     point-source ring is infinitely thin; the page's finite ring width keeps it
     physical). */
  function totalMag(beta, thetaE) {
    if (thetaE === 0) return 1;
    var u = Math.abs(beta) / thetaE;
    if (u === 0) return Infinity;
    return (u * u + 2) / (u * Math.sqrt(u * u + 4));
  }

  // ── the lens-equation residual readout: β_recovered = θ − θ_E²/θ. ──
  function lensEq(theta, thetaE) {
    return theta - thetaE * thetaE / theta;
  }

  /* ── convenience bundle for the render + meter (one call, one source of truth).
     single-image shape when thetaE === 0; otherwise both images + both
     magnifications + the two total-magnification readings (brightness |μ₊|+|μ₋|
     and the signed conservation sum μ₊+μ₋). */
  function imagePair(beta, thetaE) {
    var p = imagePositions(beta, thetaE);
    if (!p) return null;
    if (p.single) {
      return {
        single: true,
        thetaPlus: p.theta, thetaMinus: null,
        muPlus: 1, muMinus: 0,
        muTotalAbs: 1, muTotalSigned: 1
      };
    }
    var muPlus = magnification(p.thetaPlus, thetaE);
    var muMinus = magnification(p.thetaMinus, thetaE);
    return {
      single: false,
      thetaPlus: p.thetaPlus, thetaMinus: p.thetaMinus,
      muPlus: muPlus, muMinus: muMinus,
      muTotalAbs: Math.abs(muPlus) + Math.abs(muMinus),
      muTotalSigned: muPlus + muMinus
    };
  }

  /* ── SHARED UX CONSTANTS (named exports so meter, snap, and render agree) ──
     SNAP_BAND  : cursor within this β (θ_E-units) snaps the lens to the star.
     LOCK_EPS   : β below this is "aligned" — the full ring closes + flares.
     MU_DISPLAY_CAP : a large finite cap the METER prints instead of Infinity
                  (the render uses the UNCAPPED |μ| for brightness). */
  var SNAP_BAND = 0.06;
  var LOCK_EPS = 0.02;
  var MU_DISPLAY_CAP = 999;

  /* ── in-page self-test (the green pill). Mirrors the twin's spine but cheap. ── */
  function runSelfTest() {
    var checks = [];
    function ck(name, pass, info) { checks.push({ name: name, pass: pass, info: info }); }
    var betas = [0, 0.3, 1, 2, 5];
    var thetaEs = [0.1, 0.5, 1, 2, 5];

    // 1 · EXACT ROOTS + Vieta: θ± solve β = θ − θ_E²/θ, and θ₊·θ₋ = −θ_E², θ₊+θ₋ = β.
    (function () {
      var worstRoot = 0, worstV1 = 0, worstV2 = 0;
      for (var i = 0; i < betas.length; i++) for (var j = 0; j < thetaEs.length; j++) {
        var b = betas[i], tE = thetaEs[j];
        var p = imagePositions(b, tE);
        worstRoot = Math.max(worstRoot,
          Math.abs(lensEq(p.thetaPlus, tE) - b), Math.abs(lensEq(p.thetaMinus, tE) - b));
        worstV1 = Math.max(worstV1, Math.abs(p.thetaPlus * p.thetaMinus - (-tE * tE)));
        worstV2 = Math.max(worstV2, Math.abs(p.thetaPlus + p.thetaMinus - b));
      }
      ck('θ± are exact roots of β = θ − θ_E²/θ (and Vieta holds)',
        worstRoot < 1e-12 && worstV1 < 1e-12 && worstV2 < 1e-12,
        'root ' + worstRoot.toExponential(1) + ', θ₊θ₋=−θ_E² ' + worstV1.toExponential(1));
    })();

    // 2 · RING + SPLIT: β=0 ⇒ θ±=±θ_E; β>0 ⇒ θ₊>θ_E AND |θ₋|<θ_E.
    (function () {
      var ringErr = 0, ok = true;
      for (var j = 0; j < thetaEs.length; j++) {
        var tE = thetaEs[j];
        var r = imagePositions(0, tE);
        ringErr = Math.max(ringErr, Math.abs(r.thetaPlus - tE), Math.abs(r.thetaMinus + tE));
        for (var i = 0; i < betas.length; i++) {
          if (betas[i] <= 0) continue;
          var p = imagePositions(betas[i], tE);
          if (!(p.thetaPlus > tE && Math.abs(p.thetaMinus) < tE)) ok = false;
        }
      }
      ck('β=0 ⇒ full ring at ±θ_E; β>0 ⇒ one out, one in (no violation)',
        ringErr < 1e-12 && ok, 'ring |Δ| ' + ringErr.toExponential(1) + ', split ' + (ok ? 'clean' : 'VIOLATED'));
    })();

    // 3 · θ_E ∝ √M: ratio θ_E(cM)/θ_E(M) = √c; θ_E(0) = 0.
    (function () {
      var worst = 0;
      var cs = [2, 3, 4, 9, 100];
      for (var k = 0; k < cs.length; k++) {
        var c = cs[k];
        var ratio = thetaEinstein(c * 1.7) / thetaEinstein(1.7);
        worst = Math.max(worst, Math.abs(ratio - Math.sqrt(c)));
      }
      ck('θ_E ∝ √M: θ_E(cM)/θ_E(M)=√c and θ_E(0)=0',
        worst < 1e-12 && thetaEinstein(0) === 0, 'max|Δ| ' + worst.toExponential(1));
    })();

    // 4 · MAGNIFICATION: |μ₊|+|μ₋| = totalMag; totalMag ≥ 1; SIGNED μ₊+μ₋ = 1.
    (function () {
      var worstAbs = 0, worstSigned = 0, minTotal = Infinity;
      for (var i = 0; i < betas.length; i++) for (var j = 0; j < thetaEs.length; j++) {
        var b = betas[i], tE = thetaEs[j];
        if (b === 0) continue;                  // β=0 is the honest ∞ case
        var pr = imagePair(b, tE);
        worstAbs = Math.max(worstAbs, Math.abs(pr.muTotalAbs - totalMag(b, tE)));
        worstSigned = Math.max(worstSigned, Math.abs(pr.muTotalSigned - 1));
        minTotal = Math.min(minTotal, pr.muTotalAbs);
      }
      ck('|μ₊|+|μ₋| = totalMag, ≥1, and SIGNED μ₊+μ₋ = 1 (light redistributed)',
        worstAbs < 1e-12 && worstSigned < 1e-12 && minTotal >= 1 - 1e-12,
        '|μ| match ' + worstAbs.toExponential(1) + ', μ₊+μ₋=1 ' + worstSigned.toExponential(1) + ', min ' + minTotal.toFixed(6));
    })();

    // 5 · NEG-CONTROL: θ_E = 0 ⇒ single image at β, μ = 1, no second root.
    (function () {
      var p = imagePositions(1.3, 0);
      var ok = p.single === true && p.theta === 1.3 && p.thetaMinus === null
        && magnification(1.3, 0) === 1 && totalMag(1.3, 0) === 1;
      ck('NEG-CONTROL: θ_E=0 ⇒ one image at β, μ=1, no second image',
        ok, ok ? 'single image, μ=1' : 'FAILED');
    })();

    // 6 · β→0 DIVERGENCE HONEST: totalMag finite for β>0, ===Infinity only at β=0.
    (function () {
      var ok = true;
      var bs = [1, 0.1, 0.01, 1e-4];
      for (var k = 0; k < bs.length; k++) {
        if (!isFinite(totalMag(bs[k], 1))) ok = false;
      }
      ck('β→0 divergence honest: totalMag finite for β>0, ∞ only at β=0',
        ok && totalMag(0, 1) === Infinity, ok ? 'finite then ∞ at 0' : 'FAILED');
    })();

    // 7 · DOMAIN GUARDS: bad inputs → NaN / null, never silent garbage.
    (function () {
      var ok = Number.isNaN(thetaEinstein(-1)) && Number.isNaN(thetaEinstein(NaN))
        && Number.isNaN(thetaEinstein(Infinity))
        && imagePositions(1, -0.5) === null && imagePositions(NaN, 1) === null;
      ck('domain guards: θ_E(−1/NaN/∞)→NaN; imagePositions(θ_E<0/NaN)→null', ok);
    })();

    var passed = checks.filter(function (c) { return c.pass; }).length;
    return { allPass: passed === checks.length, passed: passed, total: checks.length, checks: checks };
  }

  return {
    EINSTEIN_K: EINSTEIN_K,
    thetaEinstein: thetaEinstein,
    imagePositions: imagePositions,
    magnification: magnification,
    totalMag: totalMag,
    lensEq: lensEq,
    imagePair: imagePair,
    SNAP_BAND: SNAP_BAND,
    LOCK_EPS: LOCK_EPS,
    MU_DISPLAY_CAP: MU_DISPLAY_CAP,
    runSelfTest: runSelfTest
  };
})();
/* CORE END */

export const {
  EINSTEIN_K,
  thetaEinstein, imagePositions, magnification, totalMag, lensEq, imagePair,
  SNAP_BAND, LOCK_EPS, MU_DISPLAY_CAP, runSelfTest
} = LensCore;
export default LensCore;
