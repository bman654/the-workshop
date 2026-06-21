/* ═══════════════════════════════════════════════════════════════════════════
   equal-area-sweep/core.mjs — the SOLE areal-velocity authority for
   The Equal-Area Sweep (Kepler's 2nd law as a touchable drag-instrument).

   This file is the one true source for the exhibit's orbital geometry. It is
   inlined BYTE-IDENTICAL (between the CORE BEGIN / CORE END sentinels) into
   equal-area-sweep/index.html, and a Node twin (core.test.mjs) re-derives the
   one claim this room stakes its name on — that a planet sweeps EQUAL AREAS
   in EQUAL TIMES — three independent ways and exhibits the falsifier that the
   equal-ANGLE cheat does NOT.

   THIS IS ITS OWN CLEAN CANONICAL-RADIANS TWIN. It does NOT reuse the orrery's
   degrees-and-epochs kepler() (that core works in degrees off a J2000 epoch
   with real planetary elements). Here everything is dimensionless and in
   radians: a single ideal two-body ellipse, mean anomaly = time, no epochs.
   The duplication is deliberate — same law, different register — exactly as the
   aerodrome's live (r,v) propagator declares its separation from the orrery.

   CANONICAL UNITS: μ = 1, a = 1  ⇒  b = √(1−e²), period T = 2π, mean motion
   n = √(μ/a³) = 1, so the mean anomaly M = n·t = t EXACTLY. Time IS mean
   anomaly. The "areal constant" L (twice the areal velocity, the specific
   angular momentum in these units) is √(μ·a·(1−e²)) = √(1−e²) = b.

   THE FRAME (the contract every facet obeys):
     · Sun at the FOCUS = origin (0,0). It is visibly OFF-CENTRE — that
       asymmetry IS the lesson; the centre of the ellipse is at (−a·e, 0).
     · Perihelion (closest approach) along +x, at (a(1−e), 0).
     · Motion is counter-clockwise (CCW), so the true anomaly θ increases.
     · Position from eccentric anomaly E:  x(E) = a(cosE − e),  y(E) = b·sinE.
     · Focal radius:  r(E) = a(1 − e·cosE) = 1 − e·cosE.
     · The ONE y-flip for screen coordinates lives in the render layer only;
       this core is pure math, DOM-free, and never flips y.

   Zero-dep ESM. No randomness, no wall-clock — every export is a pure function.
   ═══════════════════════════════════════════════════════════════════════════ */

/* CORE BEGIN — inlined byte-identical into index.html between the same sentinels.
   Do NOT edit one copy without the other; core.test.mjs asserts byte parity. */
var SweepCore = (function () {
  'use strict';

  // ── canonical constants of the reduced model (all dimensionless) ──
  var MU = 1;            // gravitational parameter μ
  var A = 1;             // semi-major axis a
  var PERIOD = 2 * Math.PI;   // orbital period T = 2π·√(a³/μ) = 2π
  var TAU = 2 * Math.PI;
  // default fire-tick: one-twelfth of a period. 12 fires tile the orbit
  // equal-area, the wedge-row reads as a clean dozen.
  var DT_FIRE = PERIOD / 12;

  // ── b = √(1−e²) (semi-minor axis) and L = b (areal constant, = 2·areal velocity) ──
  function semiMinor(e) { return Math.sqrt(1 - e * e); }
  function arealConstant(e) { return Math.sqrt(1 - e * e); }   // L = √(μ·a·(1−e²)) with μ=a=1
  function arealVelocity(e) { return arealConstant(e) / 2; }   // dA/dt = L/2 (Kepler's 2nd law)

  /* ── Kepler's equation: solve M = E − e·sinE for E (radians) ───────────────
     Newton's method. Seed E = M for moderate e, E = π for high e (avoids the
     flat-derivative trap near periapsis on very eccentric orbits). Iterate
     dE = (E − e·sinE − M)/(1 − e·cosE); break when |dE| < 1e-14, cap 30 iters.
     Domain guard: e<0 || e≥1 || non-finite M/e → NaN (parabolic/hyperbolic
     and degenerate inputs are out of scope for this elliptical instrument). */
  function keplerSolve(M, e) {
    if (!(isFinite(M) && isFinite(e))) return NaN;
    if (e < 0 || e >= 1) return NaN;
    var E = (e < 0.8) ? M : Math.PI;
    for (var i = 0; i < 30; i++) {
      var dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
      E -= dE;
      if (Math.abs(dE) < 1e-14) break;
    }
    return E;
  }

  /* ── cumulative Kepler solve — THE LANDMINE GUARD ──────────────────────────
     keplerSolve only knows M on one revolution; a naive `M mod 2π` collapses
     the wrap-around wedge (the one straddling M=2π→0) to zero area. The firing
     UI MUST pass CUMULATIVE M so the last wedge of a lap is honest. We solve on
     the reduced anomaly and add back the whole laps:
        E_cumulative = keplerSolve(M mod 2π, e) + 2π·floor(M/2π). */
  function keplerSolveCumulative(M, e) {
    if (!(isFinite(M) && isFinite(e))) return NaN;
    if (e < 0 || e >= 1) return NaN;
    var laps = Math.floor(M / TAU);
    var Mred = M - laps * TAU;                 // M mod 2π in [0,2π)
    return keplerSolve(Mred, e) + laps * TAU;
  }

  // ── trivial direction of Kepler's equation: mean anomaly from E ──
  function MfromE(e, E) { return E - e * Math.sin(E); }

  // ── focal radius from true anomaly: the conic r(θ) = a(1−e²)/(1+e·cosθ) ──
  function radius(theta, e) { return (1 - e * e) / (1 + e * Math.cos(theta)); }

  // ── Cartesian position from eccentric anomaly (Sun at focus / origin) ──
  function posFromE(e, E) {
    return { x: A * (Math.cos(E) - e), y: semiMinor(e) * Math.sin(E) };
  }

  /* ── full state at time t (= mean anomaly M) on an orbit of eccentricity e ──
     Returns {M,E,theta,r,x,y}. true anomaly uses the STABLE half-angle form
     θ = 2·atan2(√(1+e)·sin(E/2), √(1−e)·cos(E/2)), continuous across periapsis
     and never divides by a quantity that can vanish. theta is unwrapped to
     [0,2π) so it is single-valued. */
  function stateAtTime(t, e) {
    var M = t;
    var E = keplerSolveCumulative(M, e);
    var theta = 2 * Math.atan2(
      Math.sqrt(1 + e) * Math.sin(E / 2),
      Math.sqrt(1 - e) * Math.cos(E / 2)
    );
    if (theta < 0) theta += TAU;
    var p = posFromE(e, ((E % TAU) + TAU) % TAU);
    var r = 1 - e * Math.cos(E);
    return { M: M, E: E, theta: theta, r: r, x: p.x, y: p.y };
  }

  /* ── inverse map: the time (mean anomaly, in [0,2π)) at which the planet is
     at a given true anomaly θ. The GRAB uses this so a drag stays time-honest:
     θ (where the hand points) → E (half-angle inverse) → M = E − e·sinE.
     E = 2·atan2(√(1−e)·sin(θ/2), √(1+e)·cos(θ/2)) (the exact inverse of the
     forward half-angle map above). Result unwrapped to [0,2π). */
  function timeAtTheta(theta, e) {
    var th = ((theta % TAU) + TAU) % TAU;
    var E = 2 * Math.atan2(
      Math.sqrt(1 - e) * Math.sin(th / 2),
      Math.sqrt(1 + e) * Math.cos(th / 2)
    );
    if (E < 0) E += TAU;
    var M = E - e * Math.sin(E);
    return ((M % TAU) + TAU) % TAU;
  }

  /* ── THE KEYSTONE: the exact focal-sector area swept between two eccentric
     anomalies E0→E1. Kepler's area integral over an ellipse focal sector has
     the closed form
        ΔA = (a·b/2)·((E1 − e·sinE1) − (E0 − e·sinE0))
           = (b/2)·(M1 − M0)        [with a=1]
           = (L/2)·(M1 − M0) = arealVelocity·Δt.
     Because M = t, equal Δt ⇒ equal ΔA. THIS is Kepler's 2nd law, exact and
     in closed form — no integration error anywhere. */
  function sweepArea(e, E0, E1) {
    var b = semiMinor(e);
    var M0 = E0 - e * Math.sin(E0);
    var M1 = E1 - e * Math.sin(E1);
    return (A * b / 2) * (M1 - M0);
  }

  /* ── angular speed at a true anomaly θ — the SINGLE honest number that drives
     every tactile cue in the UI. Conservation of angular momentum r²·θ̇ = L gives
        θ̇ = L / r².
     The planet RACES (large θ̇) where r is small (perihelion) and CRAWLS (small
     θ̇) where r is large (aphelion). The drag-feel's per-frame max-step is made
     proportional to this — an honest DIRECTION, not a force law. */
  function angularSpeed(theta, e) {
    var r = radius(theta, e);
    return arealConstant(e) / (r * r);
  }

  /* ── analytic areal rate dA/dt via the cross product x·ẏ − y·ẋ ─────────────
     The instantaneous areal rate (½ the cross product of position and velocity)
     is r²·θ̇/… — actually x·ẏ − y·ẋ = r²·θ̇ = L EXACTLY, constant around the
     whole orbit. We compute it ANALYTICALLY from the eccentric anomaly:
        x = a(cosE − e), y = b·sinE,
        Ė = n/(1 − e·cosE) = 1/(1 − e·cosE)   [n=1],
        ẋ = −a·sinE·Ė,    ẏ = b·cosE·Ė,
        x·ẏ − y·ẋ = a·b·Ė·(cosE·(cosE−e) + sin²E)
                   = a·b·Ė·(1 − e·cosE) = a·b = b = L.
     We deliberately do NOT finite-difference: a naive FD of position spikes
     across the periapsis branch jump and reports garbage there. This is the
     analytic identity, exact at every E. */
  function arealRate(e, E) {
    var b = semiMinor(e);
    var Edot = 1 / (1 - e * Math.cos(E));
    var x = A * (Math.cos(E) - e), y = b * Math.sin(E);
    var xdot = -A * Math.sin(E) * Edot;
    var ydot = b * Math.cos(E) * Edot;
    return x * ydot - y * xdot;    // = a·b = L, for all E
  }

  /* ── shoelace polygon area — the INDEPENDENT cross-check ───────────────────
     ½·|Σ (x_i·y_{i+1} − x_{i+1}·y_i)| over a closed polygon. Used by the twin
     and the page to re-derive a wedge's area a SECOND way (focus + arc samples)
     with no appeal to the closed form. Sign-free (absolute value) so winding
     direction doesn't matter. */
  function polygonArea(pts) {
    var n = pts.length, s = 0;
    for (var i = 0; i < n; i++) {
      var a0 = pts[i], a1 = pts[(i + 1) % n];
      s += a0.x * a1.y - a1.x * a0.y;
    }
    return Math.abs(s) / 2;
  }

  /* ── fire a wedge ──────────────────────────────────────────────────────────
     Build the focus-anchored swept wedge starting at mean anomaly M0.
       mode 'time'  (the TRUTH): advance ΔM = dM  ⇒  equal-area wedges.
       mode 'angle' (the CHEAT): advance equal Δθ_true at the focus  ⇒  unequal
                                 areas (huge at perihelion, slivers at aphelion).
     Returns the polygon (focus + arc samples), the closed-form area, the
     independent shoelace area, the anomaly endpoints and radii, and a label.
     samples = arc points between the two endpoints (default 64). */
  function fireWedge(e, mode, M0, dM, samples) {
    if (samples == null) samples = 64;
    var E0 = keplerSolveCumulative(M0, e);
    var s0 = stateAtTime(M0, e);
    var thetaStart = s0.theta, rStart = s0.r;
    var E1, M1, thetaEnd, rEnd;

    if (mode === 'angle') {
      // advance the SAME true-anomaly increment the equal-time tick would cover
      // at this orbit's average — use the time-tick's Δθ measured at the start
      // wedge so the two modes are comparable, but applied as a FIXED Δθ.
      // We translate dM into an equivalent Δθ via the equal spacing 2π/nTicks:
      // the caller passes dM = 2π/nTicks, and equal-angle advances Δθ = 2π/nTicks
      // in TRUE anomaly. That is THE cheat: equal angle at the focus.
      var dTheta = dM;                        // reuse the tick count as a Δθ step
      thetaEnd = thetaStart + dTheta;
      // map θ_end back to E (one rev; wrap handled by the caller's cumulative M)
      var Erel = 2 * Math.atan2(
        Math.sqrt(1 - e) * Math.sin((((thetaEnd % TAU) + TAU) % TAU) / 2),
        Math.sqrt(1 + e) * Math.cos((((thetaEnd % TAU) + TAU) % TAU) / 2)
      );
      if (Erel < 0) Erel += TAU;
      var laps0 = Math.floor(E0 / TAU);
      E1 = Erel + laps0 * TAU;
      if (E1 < E0) E1 += TAU;                 // keep monotone forward
      M1 = E1 - e * Math.sin(E1);
      var sE = stateAtTime(M1, e);
      rEnd = sE.r;
      thetaEnd = thetaStart + dTheta;
    } else {
      // 'time' (default, the truth): equal Δt = ΔM ⇒ equal area
      M1 = M0 + dM;
      E1 = keplerSolveCumulative(M1, e);
      var s1 = stateAtTime(M1, e);
      thetaEnd = s1.theta;
      // unwrap thetaEnd forward of thetaStart so the arc samples go CCW
      while (thetaEnd < thetaStart) thetaEnd += TAU;
      rEnd = s1.r;
    }

    // build the polygon: focus (origin) + arc of true-anomaly samples
    var pts = [{ x: 0, y: 0 }];
    for (var k = 0; k <= samples; k++) {
      var f = k / samples;
      // interpolate in TRUE anomaly for a faithful boundary regardless of mode
      var th = thetaStart + f * (thetaEnd - thetaStart);
      var rr = radius(th, e);
      pts.push({ x: rr * Math.cos(th), y: rr * Math.sin(th) });
    }

    var areaClosed = sweepArea(e, E0, E1);
    return {
      pts: pts,
      areaClosed: Math.abs(areaClosed),
      areaShoelace: polygonArea(pts),
      M0: M0, M1: M1,
      E0: E0, E1: E1,
      thetaStart: thetaStart, thetaEnd: thetaEnd,
      rStart: rStart, rEnd: rEnd,
      dTheta: thetaEnd - thetaStart,
      label: mode === 'angle' ? 'equal-∠' : 'equal-t'
    };
  }

  /* ── numeric area of a focal sector by ½∫r(θ)²dθ (Simpson) — a THIRD,
     fully-independent route used by the twin. Integrates the polar area
     element over the true-anomaly range of a tick. */
  function sectorAreaNumeric(e, thetaA, thetaB, n) {
    if (n == null) n = 2000;
    if (n % 2) n++;                            // Simpson needs an even count
    var h = (thetaB - thetaA) / n;
    function f(th) { var r = radius(th, e); return 0.5 * r * r; }
    var sum = f(thetaA) + f(thetaB);
    for (var i = 1; i < n; i++) {
      sum += (i % 2 ? 4 : 2) * f(thetaA + i * h);
    }
    return Math.abs(sum * h / 3);
  }

  /* ── in-page self-test (the green pill). Mirrors the twin's spine but cheap. ── */
  function runSelfTest() {
    var checks = [];
    function ck(name, pass, info) { checks.push({ name: name, pass: pass, info: info }); }

    // 1 · EQUAL-AREA: 12 equal-time wedges on an e=0.6 orbit all share one area.
    (function () {
      var e = 0.6, n = 12, areas = [];
      for (var k = 0; k < n; k++) {
        var w = fireWedge(e, 'time', k * TAU / n, TAU / n, 48);
        areas.push(w.areaClosed);
      }
      var mn = Math.min.apply(null, areas), mx = Math.max.apply(null, areas);
      var spread = mx - mn;
      var expected = Math.PI * A * semiMinor(e) / n;   // πab / n
      var rel = Math.abs(areas[0] - expected) / expected;
      ck('equal-area: 12 equal-time wedges (e=0.6) share one area',
        spread < 1e-12 && rel < 1e-12,
        'spread ' + spread.toExponential(1) + ', = πab/12 to ' + rel.toExponential(1));
    })();

    // 2 · SHOELACE ≈ ANALYTIC: independent re-derivation of one wedge's area.
    (function () {
      var w = fireWedge(0.6, 'time', 0.3, TAU / 12, 1500);
      var d = Math.abs(w.areaShoelace - w.areaClosed);
      ck('shoelace = closed-form (independent): one wedge two ways',
        d < 1e-6, '|Δ| ' + d.toExponential(1) + ' (<1e-6, polygon approx)');
    })();

    // 3 · r²·θ̇ CONSTANT and = L: analytic areal rate around the orbit.
    (function () {
      var e = 0.6, L = arealConstant(e), worst = 0;
      for (var k = 0; k < 24; k++) {
        var E = k * TAU / 24;
        worst = Math.max(worst, Math.abs(arealRate(e, E) - L));
      }
      ck('r²·θ̇ = L constant (analytic cross product)',
        worst < 1e-12, 'max|rate − L| ' + worst.toExponential(1));
    })();

    // 4 · NEG-CONTROL: the equal-ANGLE cheat makes WILDLY unequal areas. Tile
    // the orbit into n equal TRUE-anomaly slices (each Δθ = 2π/n) and fire the
    // wedge that starts at the M which puts the planet at θ = k·2π/n.
    (function () {
      var e = 0.6, n = 12, areas = [];
      for (var k = 0; k < n; k++) {
        var M0 = timeAtTheta(k * TAU / n, e);
        areas.push(fireWedge(e, 'angle', M0, TAU / n, 32).areaClosed);
      }
      var mn = Math.min.apply(null, areas), mx = Math.max.apply(null, areas);
      ck('falsifier: equal-angle cheat (e=0.6) gives UNEQUAL areas',
        mx / mn > 5, 'max/min ' + (mx / mn).toFixed(1) + '× (>5 ⇒ the cheat fails)');
    })();

    // 5 · CIRCLE: at e=0 both modes give equal wedges (the bite needs eccentricity).
    (function () {
      var n = 8, t = [], a = [];
      for (var k = 0; k < n; k++) {
        t.push(fireWedge(0, 'time', k * TAU / n, TAU / n, 24).areaClosed);
        a.push(fireWedge(0, 'angle', k * TAU / n, TAU / n, 24).areaClosed);
      }
      function spread(arr) { return Math.max.apply(null, arr) - Math.min.apply(null, arr); }
      ck('circle (e=0): both modes uniform (the bite is eccentricity)',
        spread(t) < 1e-12 && spread(a) < 1e-12,
        'time spread ' + spread(t).toExponential(1) + ', angle spread ' + spread(a).toExponential(1));
    })();

    // 6 · WRAP-AROUND: cumulative solve keeps the lap-crossing wedge honest.
    (function () {
      var e = 0.6, n = 12;
      var first = fireWedge(e, 'time', 0, TAU / n, 24).areaClosed;
      var wrap = fireWedge(e, 'time', (n - 1) * TAU / n, TAU / n, 24).areaClosed;
      ck('wrap-around: lap-crossing wedge equals the first (no collapse)',
        Math.abs(wrap - first) < 1e-12, '|Δ| ' + Math.abs(wrap - first).toExponential(1));
    })();

    // 7 · ROUND-TRIP: Kepler & the θ↔t inverse both round-trip.
    (function () {
      var e = 0.6, worstE = 0, worstT = 0;
      for (var k = 1; k < 24; k++) {
        var E = k * TAU / 24;
        worstE = Math.max(worstE, Math.abs(keplerSolve(MfromE(e, E), e) - E));
        var t = k * TAU / 24;
        var th = stateAtTime(t, e).theta;
        var back = timeAtTheta(th, e);
        var d = Math.abs(back - (((t % TAU) + TAU) % TAU));
        worstT = Math.max(worstT, Math.min(d, TAU - d));
      }
      ck('round-trip: M↔E and θ↔t invert to machine precision',
        worstE < 1e-12 && worstT < 1e-12,
        'M↔E ' + worstE.toExponential(1) + ', θ↔t ' + worstT.toExponential(1));
    })();

    var passed = checks.filter(function (c) { return c.pass; }).length;
    return { allPass: passed === checks.length, passed: passed, total: checks.length, checks: checks };
  }

  return {
    MU: MU, A: A, PERIOD: PERIOD, DT_FIRE: DT_FIRE, TAU: TAU,
    semiMinor: semiMinor, arealConstant: arealConstant, arealVelocity: arealVelocity,
    keplerSolve: keplerSolve, keplerSolveCumulative: keplerSolveCumulative,
    MfromE: MfromE, radius: radius, posFromE: posFromE,
    stateAtTime: stateAtTime, timeAtTheta: timeAtTheta,
    sweepArea: sweepArea, angularSpeed: angularSpeed, arealRate: arealRate,
    polygonArea: polygonArea, fireWedge: fireWedge, sectorAreaNumeric: sectorAreaNumeric,
    runSelfTest: runSelfTest
  };
})();
/* CORE END */

export const {
  MU, A, PERIOD, DT_FIRE, TAU,
  semiMinor, arealConstant, arealVelocity,
  keplerSolve, keplerSolveCumulative, MfromE, radius, posFromE,
  stateAtTime, timeAtTheta, sweepArea, angularSpeed, arealRate,
  polygonArea, fireWedge, sectorAreaNumeric, runSelfTest
} = SweepCore;
export default SweepCore;
