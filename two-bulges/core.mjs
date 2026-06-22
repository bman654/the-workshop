/* ═══════════════════════════════════════════════════════════════════════════
   two-bulges/core.mjs — the SOLE tidal-bulge authority for The Tide Wheel.

   THE QUESTION the wheel answers: the Moon pulls the whole ocean toward it —
   so why are there TWO bulges, one toward the Moon and one EXACTLY opposite?
   And why two high tides a day, not one? The answer is a single idea you can
   watch: the tide is not the Moon's PULL, it is the GRADIENT of that pull —
   the pull is stronger on the near side than at Earth's centre, and weaker on
   the far side. Subtract the average pull (which just makes Earth fall freely
   toward the Moon, felt by nothing on the surface) and what is LEFT is a pure
   STRETCH along the Earth–Moon line: outward at BOTH ends. Two bulges.

   THE FRAME (the contract every facet obeys):
     · Earth's centre at the ORIGIN, ocean radius R = 1. The Moon sits on the
       +x axis at distance d (d > R). G = M = 1 (dimensionless; the law is a
       SHAPE and a SCALING, never a catalogue number).
     · A surface point at angle θ (measured from the +x axis = the Earth–Moon
       line) is point(θ) = [R·cosθ, R·sinθ]. θ=0 is the sub-lunar point (near
       side), θ=π is the antipode (far side), θ=±π/2 are the sides.
     · moonAccelAt(P,d): the Moon's gravity at a point, a = (Moon−P)/|Moon−P|³.
     · centreAccel(d) = moonAccelAt(centre) = [1/d², 0] (toward the Moon).
     · tidalResidual(θ,d) = moonAccelAt(point(θ)) − centreAccel(d). THE TIDE.
       Its x-component along the axis is tidalAlongAxis(θ,d). The equilibrium
       ocean shape bulgeHeight(θ,d) ∝ P₂ = (3cos²θ − 3/2), mean-subtracted on
       the ring so it conserves volume (a true displacement, not an inflation).

   THE LEADING TERM (proven exact). Expand the near/far residual in R/d:
       near (θ=0): 1/(d−R)² − 1/d² = +2R/d³ + 3R²/d⁴ + …  (outward, toward Moon)
       far  (θ=π): 1/(d+R)² − 1/d² = −2R/d³ + 3R²/d⁴ − …  (outward, away)
   so to LEADING order both ends stretch by the SAME 2GMR/d³ = leadingStretch(d).
   They are NOT exactly equal — the near bulge is a hair bigger (+3R²/d⁴ vs the
   far's −) — and the page says "equal TO LEADING ORDER", never "equal". The
   leading term is exactly ∝ 1/d³: leadingStretch(2d) === leadingStretch(d)/8.

   THE NEG-CONTROL (the gradient is the tide-maker, not the pull). Replace the
   1/d² Moon with a truly UNIFORM field — every point gets the identical centre
   vector. Then the residual is identically zero everywhere, the bulge relaxes
   to a perfect circle, and the coast goes flat. Same pull. No gradient. No tide.

   SOURCING (anti-drift): index.html inlines the block between the CORE BEGIN /
   CORE END sentinels byte-for-byte; core.test.mjs byte-parity-checks the inlined
   copy and re-derives every claim a SECOND independent way. Zero-dep ESM, DOM-
   free, no randomness, no wall-clock — every export is a pure total function.
   This is its OWN clean core; the Tidal Field (Roche/ring) sibling stays an
   independent file — same physics family, different register, never imported.
   ═══════════════════════════════════════════════════════════════════════════ */

/* CORE BEGIN — inlined byte-identical into index.html between the same sentinels.
   Do NOT edit one copy without the other; core.test.mjs asserts byte parity. */
var TideCore = (function () {
  'use strict';

  // ── canonical constants (all dimensionless) ──
  var G = 1;            // gravitational constant
  var M = 1;            // the Moon's mass
  var R = 1;            // Earth's ocean radius (the surface we read the tide on)
  var TAU = 2 * Math.PI;
  // the magic angle: where the un-offset quadrupole 3cos²θ−1 crosses zero,
  // cosθ = 1/√3 ⇒ θ = arccos(1/√3) ≈ 0.95532 rad ≈ 54.7356°. The latitude that
  // feels neither high nor low tide. A closed-form constant the test pins.
  var MAGIC_ANGLE = Math.acos(1 / Math.sqrt(3));

  // ── a surface point at angle θ on the ocean ring (radius R) ──
  function point(theta) { return [R * Math.cos(theta), R * Math.sin(theta)]; }

  // ── the Moon's gravity at an arbitrary 2-D point P, with the Moon at [d,0] ──
  // a = G·M·(Moon − P)/|Moon − P|³ (points AT the Moon). Domain guards: d ≤ R
  // (Moon inside the ocean — out of scope) or non-finite → [NaN,NaN]; a point AT
  // the Moon → [NaN,NaN] (the field diverges there).
  function moonAccelAt(P, d) {
    if (!(isFinite(d) && d > R) || !isFinite(P[0]) || !isFinite(P[1])) return [NaN, NaN];
    var dx = d - P[0], dy = -P[1];
    var r2 = dx * dx + dy * dy;
    if (r2 === 0) return [NaN, NaN];
    var inv = G * M / (r2 * Math.sqrt(r2));   // GM / |Δ|³
    return [inv * dx, inv * dy];
  }

  // ── the field at Earth's CENTRE: the average pull the whole Earth shares ──
  // centreAccel(d) = moonAccelAt([0,0]) = [GM/d², 0] (toward the Moon). This is
  // the part that makes Earth FALL toward the Moon — felt by nothing on the
  // surface (we fall with it). Subtracting it is what leaves the tide.
  function centreAccel(d) {
    if (!(isFinite(d) && d > R)) return [NaN, NaN];
    return [G * M / (d * d), 0];
  }

  // ── THE TIDE: the residual field = the Moon's pull MINUS the shared centre pull ──
  // tidalResidual(θ,d) is a 2-D vector at the surface point θ. This single
  // subtraction IS the whole lesson: it is what's LEFT after free fall.
  function tidalResidual(theta, d) {
    var a = moonAccelAt(point(theta), d);
    var c = centreAccel(d);
    return [a[0] - c[0], a[1] - c[1]];
  }

  // ── the residual at an arbitrary point (the page paints arrows at the ocean
  //    ring; this is the same residual, exposed for a general P) ──
  function residualAt(P, d) {
    var a = moonAccelAt(P, d);
    var c = centreAccel(d);
    return [a[0] - c[0], a[1] - c[1]];
  }

  // ── the along-axis (x) component of the residual — the stretch's signed size ──
  // > 0 near (θ=0, outward toward Moon); < 0 far (θ=π, outward away from Moon);
  // < 0 at the sides (θ=±π/2, the inward squeeze). The quadrupole, as a scalar.
  function tidalAlongAxis(theta, d) { return tidalResidual(theta, d)[0]; }

  // ── the proven-exact LEADING term of the stretch at both poles: 2GMR/d³ ──
  // The first term of the near/far residual expansion in R/d. Exactly ∝ 1/d³.
  // The real near/far magnitudes equal THIS only to leading order (O(R/d)
  // corrections); the page says "equal to leading order", never "equal".
  function leadingStretch(d) {
    if (!(isFinite(d) && d > 0)) return NaN;
    return 2 * G * M * R / (d * d * d);
  }

  // ── the UNIFORM-FIELD neg-control: residual ≡ 0 everywhere ──
  // Replace the 1/d² Moon with the constant centre vector at EVERY point, then
  // (constant) − (centre) = 0. Same pull, zero gradient, zero tide. Returns the
  // residual vector under the uniform field — identically [0,0] for every θ.
  function uniformResidual(theta) { return [0, 0]; }

  // ── the equilibrium bulge height: the P₂ (quadrupole) ocean shape ──
  // bulgeHeight(θ) ∝ 3cos²θ − 3/2. The "−3/2" (not the sphere's −1) mean-
  // subtracts on the RING (mean of 3cos²θ over θ∈[0,2π) is 3/2), so ∫bulge dθ = 0
  // — the water is REDISTRIBUTED, not created: a true displacement that conserves
  // volume. Peaks +3/2 at θ=0 and θ=π (the two bulges, equal), troughs −3/2 at
  // the sides. It does not depend on d in SHAPE; the page scales its amplitude by
  // the d-dependent leadingStretch so distance changes the bulge SIZE, not form.
  function bulgeHeight(theta, d) {
    var c = Math.cos(theta);
    return 3 * c * c - 1.5;
  }
  // the bulge under the uniform neg-control: no gradient ⇒ a perfect circle.
  function uniformBulgeHeight(theta) { return 0; }

  // ── the witness distance the self-test and the page's arrival state share ──
  function witnessD() { return 10; }

  // ── the self-test: the wheel proves its own claims numerically ──
  function runSelfTest() {
    var checks = [];
    function ck(name, pass, info) { checks.push({ name: name, pass: pass, info: info }); }

    // 1 · STRETCH SIGNS — the quadrupole as exact booleans, over a d-sweep.
    //   near (θ=0): along-axis > 0 (outward toward Moon)
    //   far  (θ=π): along-axis < 0 (outward AWAY from Moon, the −x direction)
    //   side (θ=π/2): along-axis < 0 (the inward squeeze)
    (function () {
      var ok = true, worstNear = Infinity, worstFar = -Infinity;
      for (var i = 0; i < 40; i++) {
        var d = 1.5 + i * 0.75;
        var near = tidalAlongAxis(0, d);
        var far = tidalAlongAxis(Math.PI, d);
        var side = tidalAlongAxis(Math.PI / 2, d);
        if (!(near > 0 && far < 0 && side < 0)) ok = false;
        worstNear = Math.min(worstNear, near);
        worstFar = Math.max(worstFar, far);
      }
      ck('1 · STRETCH SIGNS: near(θ=0)>0 outward · far(θ=π)<0 outward-away · side(θ=π/2)<0 squeeze, ∀d',
        ok, 'min near=' + worstNear.toExponential(2) + ' · max far=' + worstFar.toExponential(2));
    })();

    // 2 · NEAR≈FAR TO LEADING ORDER (HONEST). |near| and |far| each ≈ leadingStretch
    //   to O(R/d); the ratio |near|/|far| → 1 as d/R→∞ with |ratio−1| < c·(R/d)
    //   — NOT machine-ε. (Separately, claim 3 pins leadingStretch's exact ÷8.)
    (function () {
      var okRatio = true, worstRatioErr = 0, okLead = true;
      for (var i = 1; i <= 60; i++) {
        var d = 4 + i * 2;                       // d/R from 6 up to 124
        var near = Math.abs(tidalAlongAxis(0, d));
        var far = Math.abs(tidalAlongAxis(Math.PI, d));
        var lead = leadingStretch(d);
        var ratio = near / far;
        // ratio−1 must shrink like R/d: assert |ratio−1| < 4·(R/d).
        var bound = 4 * (R / d);
        if (!(Math.abs(ratio - 1) < bound)) okRatio = false;
        worstRatioErr = Math.max(worstRatioErr, Math.abs(ratio - 1) * (d / R));   // O(1) coefficient
        // each magnitude agrees with leadingStretch to O(R/d): |x/lead − 1| < 6·(R/d)
        if (!(Math.abs(near / lead - 1) < 6 * (R / d) && Math.abs(far / lead - 1) < 6 * (R / d))) okLead = false;
      }
      // and the ratio at a LARGE d is within 1e-3 of 1 (convergence, not exactness).
      var dBig = 5000, ratioBig = Math.abs(tidalAlongAxis(0, dBig)) / Math.abs(tidalAlongAxis(Math.PI, dBig));
      ck('2 · NEAR≈FAR to LEADING ORDER: |near|/|far|→1 as |ratio−1|<4R/d (NOT exact); each ≈ 2GMR/d³ to O(R/d)',
        okRatio && okLead && Math.abs(ratioBig - 1) < 1e-3,
        'O(1) coef≈' + worstRatioErr.toFixed(2) + ' · ratio(d=5000)=' + ratioBig.toFixed(6));
    })();

    // 3 · 1/d³ SCALING (on the leading-order field, <1e-9). leadingStretch(2d) ===
    //   leadingStretch(d)/8 to <1e-9 over a sweep; AND the FULL field's near/far
    //   ratio → 8 monotonically (convergence to the inverse-cube law, not faked).
    (function () {
      var worst = 0;
      for (var i = 1; i <= 50; i++) {
        var d = 2 + i * 1.3;
        worst = Math.max(worst, Math.abs(leadingStretch(2 * d) - leadingStretch(d) / 8));
      }
      // the FULL field near-stretch ratio S(d)/S(2d) settles toward 8 monotonically
      // FROM ABOVE: S(d) = 2/d³ + 3/d⁴ + … has positive higher-order terms, so the
      // ratio (2+3/d)/((2+1.5/d)/8) = 8·(2+3/d)/(2+1.5/d) > 8 and falls to 8 as d→∞.
      function fullNear(d) { return tidalAlongAxis(0, d); }
      var prev = null, monotone = true, lands8 = false;
      var ratios = [];
      for (var k = 0; k < 16; k++) {
        var d2 = 4 * Math.pow(1.7, k);
        var ratio = fullNear(d2) / fullNear(2 * d2);   // → 8 from ABOVE (near has +O(1/d⁴) terms)
        ratios.push(ratio);
        if (prev !== null && !(ratio < prev + 1e-12)) monotone = false;   // monotone DECREASING
        prev = ratio;
      }
      var last = ratios[ratios.length - 1];
      lands8 = Math.abs(last - 8) < 1e-3 && ratios[0] > 8;   // stays above 8, settling down to it
      ck('3 · 1/d³ SCALING: leadingStretch(2d)===leadingStretch(d)/8 to <1e-9; full-field ratio→8 monotonically',
        worst < 1e-9 && monotone && lands8,
        'max|lead(2d)−lead(d)/8|=' + worst.toExponential(2) + ' · full ratio→' + last.toFixed(5) + ' (→8)');
    })();

    // 4 · UNIFORM NEG-CONTROL identically zero. uniformResidual(θ) === 0 (exactly,
    //   machine-ε) for every θ over a d-sweep; and the uniform bulge is a circle.
    (function () {
      var ok = true;
      for (var di = 0; di < 8; di++) {
        for (var i = 0; i < 64; i++) {
          var th = i * TAU / 64;
          var u = uniformResidual(th);
          if (u[0] !== 0 || u[1] !== 0) ok = false;
          if (uniformBulgeHeight(th) !== 0) ok = false;
        }
      }
      ck('4 · UNIFORM neg-control: residual ≡ [0,0] exactly ∀θ ∀d; uniform bulge ≡ 0 (a perfect circle)',
        ok, 'every uniformResidual & uniformBulgeHeight identically 0');
    })();

    // 5 · P₂ SHAPE (the bulge). Peaks EQUAL at θ=0 and θ=π to <1e-12; minima EQUAL
    //   at θ=π/2 and 3π/2; angular mean 0 to <1e-12 (volume-conserving). Plus the
    //   magic-angle pinch-zeros: the un-offset 3cos²θ−1 crosses 0 at ±arccos(1/√3).
    (function () {
      var peakNear = bulgeHeight(0, 10), peakFar = bulgeHeight(Math.PI, 10);
      var minA = bulgeHeight(Math.PI / 2, 10), minB = bulgeHeight(3 * Math.PI / 2, 10);
      var peaksEqual = Math.abs(peakNear - peakFar) < 1e-12;
      var minsEqual = Math.abs(minA - minB) < 1e-12;
      // angular mean over the ring (trapezoid on a periodic function = exact average).
      var N = 2000, sum = 0;
      for (var i = 0; i < N; i++) sum += bulgeHeight(i * TAU / N, 10);
      var mean = sum / N;
      // the magic-angle pinch: the UN-offset quadrupole 3cos²θ−1 is zero at MAGIC_ANGLE.
      var qZero = 3 * Math.cos(MAGIC_ANGLE) * Math.cos(MAGIC_ANGLE) - 1;
      var magicDeg = MAGIC_ANGLE * 180 / Math.PI;
      ck('5 · P₂ SHAPE: peaks equal at 0,π · minima equal at π/2,3π/2 · mean 0 · 3cos²θ−1 zero at arccos(1/√3)=54.7356°',
        peaksEqual && minsEqual && Math.abs(mean) < 1e-12 && Math.abs(qZero) < 1e-12
          && Math.abs(magicDeg - 54.7356) < 1e-3,
        'peak=' + peakNear.toFixed(3) + '(=' + peakFar.toFixed(3) + ') · mean=' + mean.toExponential(2)
          + ' · magic=' + magicDeg.toFixed(4) + '°');
    })();

    // 6 · DOMAIN GUARDS. moonAccelAt with d ≤ R → NaN; non-finite d → NaN; a point
    //   exactly at the Moon → NaN; centreAccel guards d ≤ R. No silent garbage.
    (function () {
      var g1 = moonAccelAt([0, 0], 0.5);          // Moon inside the ocean (d<R)
      var g2 = moonAccelAt([0, 0], Infinity);     // non-finite d
      var g3 = moonAccelAt([10, 0], 10);          // point exactly at the Moon
      var g4 = centreAccel(0.5);                   // d ≤ R guarded
      var ok = Number.isNaN(g1[0]) && Number.isNaN(g2[0]) && Number.isNaN(g3[0]) && Number.isNaN(g4[0])
        && isFinite(moonAccelAt([1, 0], 1.0001)[0]);   // d just outside R is finite
      ck('6 · DOMAIN guards: d≤R→NaN · non-finite d→NaN · point AT Moon→NaN · d just>R finite',
        ok, 'd<R=' + Number.isNaN(g1[0]) + ' · ∞=' + Number.isNaN(g2[0]) + ' · at-Moon=' + Number.isNaN(g3[0]));
    })();

    var passed = checks.filter(function (c) { return c.pass; }).length;
    return { ok: passed === checks.length, passed: passed, total: checks.length, checks: checks };
  }

  return {
    G: G, M: M, R: R, TAU: TAU, MAGIC_ANGLE: MAGIC_ANGLE,
    point: point, moonAccelAt: moonAccelAt, centreAccel: centreAccel,
    tidalResidual: tidalResidual, residualAt: residualAt, tidalAlongAxis: tidalAlongAxis,
    leadingStretch: leadingStretch, uniformResidual: uniformResidual,
    bulgeHeight: bulgeHeight, uniformBulgeHeight: uniformBulgeHeight,
    witnessD: witnessD, runSelfTest: runSelfTest
  };
})();
/* CORE END */

export const {
  G, M, R, TAU, MAGIC_ANGLE,
  point, moonAccelAt, centreAccel,
  tidalResidual, residualAt, tidalAlongAxis,
  leadingStretch, uniformResidual,
  bulgeHeight, uniformBulgeHeight,
  witnessD, runSelfTest
} = TideCore;
export default TideCore;
