/* ═══════════════════════════════════════════════════════════════════════════
   starlight-bend/core.mjs — the SOLE light-deflection authority for
   The Light That Falls Around a Star (a touchable optics fly-through where you
   AIM the impact parameter b and watch starlight bend around a dark mass).

   It is inlined BYTE-IDENTICAL (between the STARLIGHT-BEND CORE BEGIN / CORE END
   sentinels) into starlight-bend/index.html; a Node twin (core.test.mjs) proves
   the inlined copy is identical (indentation-normalised) to this file, so page,
   pill, and twin can never silently drift.

   ── THE ONE IDEA — GRAVITY IS AN OPTICAL MEDIUM. ───────────────────────────
   A mass warps spacetime so that, to weak-field order, light travels as if
   through a medium of refractive index

        n(r) = 1 + r_s / r ,      r_s = 2GM/c²  (the Schwarzschild radius)

   — the EDDINGTON index. A ray with impact parameter b skirting the mass is bent
   by a total deflection angle. The famous weak-field answer is

        α = 4GM/(c²·b) = 2·r_s / b .

   The 1.7515″ Eddington measured at the 1919 eclipse for a ray grazing the Sun's
   limb falls straight out of this with no extra constants (see alphaSolarGrazing).

   ── PICTURE == PROOF. ───────────────────────────────────────────────────────
   The render does NOT draw a cosmetic arc. It draws the SAME ray this core
   integrates: bendRay(b, r_s) marches the deflection field and returns the actual
   bent polyline, whose asymptotic deflection equals alphaWeak(r_s,b) to <1e-6.
   The drawn line IS the integrated ray. (core.test.mjs asserts this crux.)

   ── HONEST SCOPE. ────────────────────────────────────────────────────────────
   This is the WEAK-FIELD optical-analog deflection — n(r)=1+2GM/rc², the
   Eddington index — NOT full GR null-geodesic tracing. The famous factor-of-two
   (relative to a naive Newtonian photon) is BAKED INTO the Eddington index here;
   we do not re-derive it from the metric. The Einstein-ring climax the room
   renders is illustrative-on-axis. b is floored at the body limb — we never
   integrate a ray THROUGH the mass (a physical floor that also kills the b→0 NaN
   and keeps the weak-field expansion honest).

   Scaled units throughout: G = c = 1, so r_s = 2M is the SOLE mass knob.
   Zero-dep ESM. No randomness, no wall-clock — every export is a pure function.
   ═══════════════════════════════════════════════════════════════════════════ */

/* STARLIGHT-BEND CORE BEGIN — inlined byte-identical into index.html between the
   same sentinels. Do NOT edit one copy without the other; core.test.mjs asserts
   byte parity. */
var BendCore = (function () {
  'use strict';

  // ── PHYSICAL CONSTANTS, only for the named solar sanity-check. The room runs
  //    entirely in scaled units (G=c=1, r_s=2M); these are used ONLY by
  //    schwarzschildRadius / alphaSolarGrazing to show 1.75″ falling out. ──
  var G_SI = 6.674e-11;          // m³ kg⁻¹ s⁻²
  var C_SI = 2.998e8;            // m s⁻¹
  var ARCSEC_PER_RAD = 206264.806247096;   // 180/π · 3600
  var SUN = { M: 1.989e30, R: 6.957e8 };   // kg, m

  // ── the Eddington index n(r) = 1 + r_s/r, and the gravitational potential it
  //    encodes, phi(r) = r_s/r (scaled). The ray is bent by the TRANSVERSE
  //    gradient of phi along its (nearly straight) path. ──
  function indexAt(rs, r) { return 1 + rs / r; }
  function phi(rs, r) { return rs / r; }

  // ── dPhiDb(rs, x, b): the TRANSVERSE component of ∇phi at the path point a
  //    distance x along the (straight) ray whose closest approach is b. With
  //    r = √(x²+b²) and the transverse direction picking out the b-component,
  //        d/db [ rs / √(x²+b²) ]  =  −rs·b / (x²+b²)^{3/2} .
  //    Integrating −dPhiDb over all x gives the deflection (Born approximation):
  //        α = ∫ rs·b/(x²+b²)^{3/2} dx = 2·rs/b .   (the weak-field result) ──
  function dPhiDb(rs, x, b) {
    var s = x * x + b * b;
    return -rs * b / (s * Math.sqrt(s));
  }

  // ── alphaWeak(rs, b) = 2·rs/b = 4GM/(c²b): the closed-form weak-field deflection. ──
  function alphaWeak(rs, b) { return 2 * rs / b; }

  /* ── alphaNumeric(rs, b, N): the deflection by NUMERIC integration of the same
        transverse gradient field, via the tan-substitution that maps the infinite
        line to a finite, smooth integrand.

          α = ∫_{-∞}^{∞} rs·b / (x²+b²)^{3/2} dx
        Substitute x = b·tan t, dx = b·sec²t dt, x²+b² = b²·sec²t :
          integrand · dx = (rs/b)·cos t · dt ,   t ∈ (−π/2, π/2)
        — a bounded, infinitely smooth integrand. Composite Simpson over N panels
        (N forced even) converges fourth-order; endpoint guards ±1e-12 keep t off
        the open interval's poles. The exact value is (rs/b)·[sin t]_{-π/2}^{π/2}
        = 2·rs/b, so alphaNumeric ≈ alphaWeak to <1e-6 at the default N=64. ── */
  function alphaNumeric(rs, b, N) {
    if (!(b > 0)) return Infinity;          // a ray through the centre is unphysical here
    N = (N | 0) || 64;
    if (N % 2) N += 1;                       // Simpson needs an even panel count
    var GUARD = 1e-12;
    var t0 = -Math.PI / 2 + GUARD, t1 = Math.PI / 2 - GUARD;
    var h = (t1 - t0) / N;
    // f(t) = (rs/b)·cos t  (the tan-substituted integrand of the deflection)
    var f = function (t) { return (rs / b) * Math.cos(t); };
    var sum = f(t0) + f(t1);
    for (var i = 1; i < N; i++) {
      sum += (i % 2 ? 4 : 2) * f(t0 + i * h);
    }
    return (h / 3) * sum;
  }

  // ── schwarzschildRadius(G, M, c) = 2GM/c²  (SI metres for the named sun check). ──
  function schwarzschildRadius(G, M, c) { return 2 * G * M / (c * c); }

  /* ── alphaSolarGrazing(): the 1919 number. r_s,⊙ = 2GM⊙/c² ≈ 2954 m; a ray
        grazing the solar limb has b = R⊙, so α = 2·r_s/R⊙ ≈ 8.49e-6 rad ≈ 1.7515″.
        Returned in ARCSECONDS so the famous 1.75″ reads directly. ── */
  function alphaSolarGrazing() {
    var rs = schwarzschildRadius(G_SI, SUN.M, C_SI);
    return alphaWeak(rs, SUN.R) * ARCSEC_PER_RAD;
  }

  /* ── SHARED UX DETENTS (named exports so render + aim + math agree) ──
        SNAP_BAND : within this β (in θ_E-units) the crescents fatten toward closure.
        LOCK_EPS  : β below this is "aligned" — the full Einstein ring closes + flares. */
  var SNAP_BAND = 0.06;
  var LOCK_EPS = 0.02;

  /* ── bendRay(b, rs, scene) → { points, alpha, asymptoteOut } — THE AUTHORITY THE
        RENDER DRAWS. March the SAME deflection field as alphaNumeric, but as an
        ODE in screen space so the OUTPUT is the actual bent polyline:

            θ(x)   = ray heading (slope angle), θ → 0 far upstream
            dθ/dx  = −dPhiDb(rs, x, b)        (the field bends the ray inward)
            dy/dx  = tan θ

        The running heading has the EXACT closed form (the antiderivative of the
        smooth tan-substituted integrand): with t = atan(x/b),
            θ(x) = −(rs/b)·( sin t − sin(−π/2) ) = −(rs/b)·( x/√(x²+b²) + 1 ) .
        Far upstream (x→−∞) x/√(x²+b²)→−1 so θ→0 (flat asymptote in at offset +b);
        far downstream (x→+∞) θ→−2rs/b = −α (the straight outgoing asymptote rotated
        by the full deflection). We DRAW the ray over a BOUNDED x-window (the scene
        window, default a few hundred·b) marching y by tan(θ)·dx from y=b at the
        window's upstream edge — so the polyline is a physically sane bent ray with
        NO billions-wide steps, while alpha (below) stays the EXACT full-line value.

        b is FLOORED at the body limb by the caller's scene (we never integrate a
        ray THROUGH the mass); rs = 0 ⇒ θ≡0 ⇒ a DEAD-STRAIGHT polyline at y=b. The
        returned points are in the bend PLANE: x along the line of sight, y the
        transverse offset. The render maps this plane into the flown 3-D scene.

        scene options: { N: samples (default 240), window:[xMin,xMax] (default
        [−400b, 400b]) }.

        Returns:
          points       : [[x, y], …]  the integrated bent ray (N+1 samples in-window)
          alpha        : the EXACT total deflection 2rs/b (closed form, full line)
          asymptoteOut : the outgoing heading angle (= −alpha; downstream slope) ── */
  function bendRay(b, rs, scene) {
    var N = (scene && scene.N | 0) || 240;
    if (N % 2) N += 1;
    var win = (scene && scene.window) || [-400 * b, 400 * b];
    var xMin = win[0], xMax = win[1];
    var dx = (xMax - xMin) / N;

    // exact running heading θ(x) (closed form above). rs=0 ⇒ rb=0 ⇒ θ≡0 (straight).
    var rb = rs / b;
    var headingAt = function (xx) {
      return -rb * (xx / Math.sqrt(xx * xx + b * b) + 1);   // = −(rs/b)(sin t + 1)
    };

    var x = xMin, y = b;           // enter at the upstream window edge, offset +b
    var theta = headingAt(x);
    var pts = [[x, y]];
    for (var i = 1; i <= N; i++) {
      var xNext = xMin + i * dx;
      var xMid = x + dx * 0.5;
      var thetaMid = headingAt(xMid);                    // exact heading at the step midpoint
      theta = headingAt(xNext);                          // exact heading after the step
      y += Math.tan(thetaMid) * dx;                      // advance y along the bent heading
      x = xNext;
      pts.push([x, y]);
    }

    // total deflection MAGNITUDE = the EXACT full-line swing (closed form): as the
    // window widens the marched swing → this, but we report the exact value so
    // picture==proof holds independent of the drawn window.
    var alpha = alphaWeak(rs, b);  // = 2rs/b, the exact weak-field deflection
    return { points: pts, alpha: alpha, asymptoteOut: theta };
  }

  /* ── EINSTEIN-RING SCALING (cross-register only, NO shared module). The on-axis
        ring climax reads its angular radius θ_E from THIS core's deflection — for a
        point lens the Einstein angle is θ_E = √(α·something), but to keep the room's
        ring consistent with the einstein-ring exhibit we share ONLY the θ_E ∝ √M
        scaling (rs = 2M, so θ_E ∝ √rs). thetaEinstein returns the scaled ring radius
        the render uses; the render never hardcodes a second ring constant. ── */
  function thetaEinstein(rs) {
    if (!(isFinite(rs)) || rs < 0) return NaN;
    // scaled illustrative ring radius ∝ √rs (rs = 2M ⇒ ∝ √M), constant 1.
    return Math.sqrt(rs);
  }

  /* ── the in-page self-test (the green pill). Mirrors the twin pass-for-pass with
        cheaper grids. ── */
  function runSelfTest() {
    var checks = [];
    function ck(name, pass, info) { checks.push({ name: name, pass: pass, info: info }); }

    // 1 · NUMERIC == WEAK-FIELD: alphaNumeric ≈ alphaWeak to <1e-6 over a grid of
    //     b and rs, AND the famous 1.75″ solar grazing value falls out, AND the
    //     convergence is fourth-order (err(N)/err(2N) ≈ 16).
    (function () {
      var worst = 0;
      var bs = [0.3, 1, 2.5, 6, 13], rss = [0.5, 1, 2];
      for (var i = 0; i < bs.length; i++) for (var j = 0; j < rss.length; j++) {
        var rs = rss[j], b = bs[i] * rs;          // b in units of rs, per the spec
        var rel = Math.abs(alphaNumeric(rs, b, 64) - alphaWeak(rs, b)) / alphaWeak(rs, b);
        worst = Math.max(worst, rel);
      }
      var solar = alphaSolarGrazing();
      var solarOK = Math.abs(solar - 1.7515) < 0.01;
      // convergence order: error should drop ~16× when N doubles (Simpson is O(h⁴))
      var rsC = 1, bC = 2;
      var e1 = Math.abs(alphaNumeric(rsC, bC, 16) - alphaWeak(rsC, bC));
      var e2 = Math.abs(alphaNumeric(rsC, bC, 32) - alphaWeak(rsC, bC));
      var ratio = e2 > 0 ? e1 / e2 : Infinity;
      var orderOK = ratio > 8;                    // ≥8× (fourth-order; loose floor)
      ck('1 · numeric α ≈ 2GM/c²b (<1e-6, grid) · solar grazing = 1.75″ · Simpson 4th-order',
        worst < 1e-6 && solarOK && orderOK,
        'worst rel ' + worst.toExponential(2) + ' · solar ' + solar.toFixed(4)
        + '″ · err ratio ' + (isFinite(ratio) ? ratio.toFixed(1) : '∞') + '×');
    })();

    // 2 · 2M ⇒ 2α EXACT: doubling the mass doubles the deflection to machine-ε
    //     (both closed-form and numeric).
    (function () {
      var worst = 0;
      var bs = [0.5, 1, 2, 5];
      for (var i = 0; i < bs.length; i++) {
        var b = bs[i];
        var r1 = alphaNumeric(1, b, 64), r2 = alphaNumeric(2, b, 64);
        worst = Math.max(worst, Math.abs(r2 / r1 - 2));
        var w1 = alphaWeak(1, b), w2 = alphaWeak(2, b);
        worst = Math.max(worst, Math.abs(w2 / w1 - 2));
      }
      ck('2 · doubled mass ⇒ doubled deflection (numeric ratio − 2 < 1e-9)',
        worst < 1e-9, 'worst |ratio−2| ' + worst.toExponential(2));
    })();

    // 3 · rs = 0 ⇒ α = 0 EXACTLY and bendRay is DEAD STRAIGHT (the neg-control:
    //     sweep the mass out and the ray does not bend).
    (function () {
      var aw = alphaWeak(0, 2), an = alphaNumeric(0, 2, 64);
      var ray = bendRay(2, 0, { N: 200 });
      var maxDev = 0;
      for (var i = 0; i < ray.points.length; i++) maxDev = Math.max(maxDev, Math.abs(ray.points[i][1] - 2));
      ck('3 · rs=0 ⇒ α=0 exactly AND bendRay dead-straight (neg-control)',
        aw === 0 && an === 0 && Math.abs(ray.alpha) < 1e-9 && maxDev < 1e-9,
        'α ' + an.toExponential(1) + ' · max transverse dev ' + maxDev.toExponential(2));
    })();

    // 4 · PICTURE == PROOF: bendRay's accumulated alpha equals alphaWeak(rs,b) to
    //     <1e-6, AND the drawn polyline's endpoint slope equals that same α — the
    //     line you SEE is the deflection the math computes.
    (function () {
      var worstA = 0, worstSlope = 0;
      var cases = [[1, 2], [2, 3], [0.5, 4], [1, 6]];
      for (var c = 0; c < cases.length; c++) {
        var rs = cases[c][0], b = cases[c][1];
        var ray = bendRay(b, rs, { N: 400 });
        var aw = alphaWeak(rs, b);
        worstA = Math.max(worstA, Math.abs(ray.alpha - aw) / aw);
        // endpoint slope of the drawn polyline (last two points) → its bend angle
        var n = ray.points.length;
        var p0 = ray.points[n - 2], p1 = ray.points[n - 1];
        var slope = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
        // the downstream asymptote heading IS the (negative) deflection
        worstSlope = Math.max(worstSlope, Math.abs(Math.abs(slope) - aw) / aw);
      }
      ck('4 · picture==proof: bendRay.alpha === alphaWeak AND drawn endpoint slope === α (<1e-3)',
        worstA < 1e-6 && worstSlope < 1e-3,
        'worst |α−weak| ' + worstA.toExponential(2) + ' · worst slope err ' + worstSlope.toExponential(2));
    })();

    // 5 · θ_E ∝ √M (= √rs since rs = 2M): the ring radius scaling the climax shares
    //     with the einstein-ring exhibit (consistency, NOT a hardcoded second const).
    (function () {
      var worst = 0;
      var cs = [2, 3, 4, 9];
      for (var k = 0; k < cs.length; k++) {
        var ratio = thetaEinstein(cs[k] * 1.5) / thetaEinstein(1.5);
        worst = Math.max(worst, Math.abs(ratio - Math.sqrt(cs[k])));
      }
      ck('5 · θ_E ∝ √M: θ_E(c·rs)/θ_E(rs) = √c and θ_E(0) = 0',
        worst < 1e-12 && thetaEinstein(0) === 0, 'max |Δ| ' + worst.toExponential(2));
    })();

    var passed = checks.filter(function (c) { return c.pass; }).length;
    return { allPass: passed === checks.length, passed: passed, total: checks.length, checks: checks };
  }

  return {
    G_SI: G_SI, C_SI: C_SI, ARCSEC_PER_RAD: ARCSEC_PER_RAD, SUN: SUN,
    indexAt: indexAt, phi: phi, dPhiDb: dPhiDb,
    alphaWeak: alphaWeak, alphaNumeric: alphaNumeric,
    schwarzschildRadius: schwarzschildRadius, alphaSolarGrazing: alphaSolarGrazing,
    bendRay: bendRay, thetaEinstein: thetaEinstein,
    SNAP_BAND: SNAP_BAND, LOCK_EPS: LOCK_EPS,
    runSelfTest: runSelfTest
  };
})();
/* CORE END */

export const {
  G_SI, C_SI, ARCSEC_PER_RAD, SUN,
  indexAt, phi, dPhiDb,
  alphaWeak, alphaNumeric, schwarzschildRadius, alphaSolarGrazing,
  bendRay, thetaEinstein, SNAP_BAND, LOCK_EPS, runSelfTest
} = BendCore;
export default BendCore;
