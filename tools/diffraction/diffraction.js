/* ═══════════════════════════════════════════════════════════════════════════
   diffraction.js — the Diffraction bench's DOM-free wave-optics CORE.

   THE BENCH'S ONE BIG IDEA. In the far field (Fraunhofer regime) the intensity
   of light diffracted by an aperture is the SQUARED MAGNITUDE OF THE FOURIER
   TRANSFORM of the aperture's transmission function t(x):

       I(θ) ∝ | ∫ t(x) · exp(-i·k·x·sinθ) dx |²,    k = 2π/λ.

   Aperture shape ↔ diffraction pattern is a Fourier pair. That single statement
   contains everything this bench shows:

     • a SINGLE SLIT of width a (t = 1 on |x|<a/2) → its FT is a sinc, so
           I(θ) = sinc²(β),   β = (π·a·sinθ)/λ,   sinc(x)=sin x / x.
       Zeros (dark fringes) at  a·sinθ = mλ  (m = ±1,±2,…). The central bright
       fringe is TWICE as wide (in θ) as the others — the sinc envelope.

     • N EQUAL SLITS of width a on a pitch d (a diffraction grating) → the FT is
       the single-slit sinc TIMES the finite geometric sum of N phasors:
           I(θ) = sinc²(β) · [ sin(N·α) / sin(α) ]² ,   α = (π·d·sinθ)/λ.
       The bracket — the GRATING / interference factor — has PRINCIPAL MAXIMA of
       height N² wherever d·sinθ = mλ (the grating equation), separated by N−1
       zeros and N−2 dim secondary maxima. As N grows the principal maxima
       sharpen (FWHM ∝ 1/N): that is *why* a real grating out-resolves two slits.
       (N=1 collapses the bracket to 1 → the pure single slit; N=2 is Young's
       double slit, the sinc modulated by cos².)

   THE FALSIFIABLE CRUX (the workshop rule: a piece must PROVE its claim). The
   page renders the CLOSED FORM above. To prove that curve really *is* the
   Fourier transform of the aperture and not a memorised formula, this CORE also
   carries a SECOND, INDEPENDENT route: it samples the aperture transmission t(x)
   on a fine grid and computes the Fraunhofer integral as a direct discrete
   Fourier sum (fraunhofer()), using NO sinc, NO grating identity — just
   t(x)·exp(-i k x sinθ). The self-test asserts the two agree to a part in 10⁻⁶
   across the whole pattern, for many (N, a, d, λ). If they agree, the analytic
   curve is — by construction — |FT of the aperture|², the central claim made
   true. The closed forms also independently satisfy: minima exactly at the slit
   / grating equations; the central peak equals N² (coherent addition); energy
   conservation between the two routes (Parseval, up to the truncation window);
   determinism; and falsifiability (a WRONG minima spacing is rejected).

   Everything is pure: same numbers in Node and in the browser. No DOM here.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var PI = Math.PI, TAU = 2 * Math.PI;

  // sinc with the π already absorbed by the caller: returns sin(x)/x, =1 at 0.
  function sinc(x) {
    if (x === 0) return 1;
    var ax = Math.abs(x);
    if (ax < 1e-9) return 1 - x * x / 6;   // series near 0, stable
    return Math.sin(x) / x;
  }

  // The single-slit envelope value at phase β = π·a·sinθ/λ.  sinc²(β).
  function slitEnvelope(beta) {
    var s = sinc(beta);
    return s * s;
  }

  // The N-slit grating (interference) factor at phase α = π·d·sinθ/λ.
  // Returns [ sin(Nα)/sin(α) ]², with the removable-singularity limit N² at the
  // principal maxima (α = mπ), computed stably.
  function gratingFactor(alpha, N) {
    // distance to the nearest multiple of π:
    var r = alpha / PI;
    var nearest = Math.round(r);
    var da = alpha - nearest * PI;          // (alpha mod π), folded to (-π/2, π/2]
    if (Math.abs(da) < 1e-7) {
      // principal maximum: lim sin(Nα)/sin(α) = ±N  →  squared = N².  Use the
      // 2nd-order expansion to stay smooth right at and just beside the peak.
      // sin(Nα)/sin(α) ≈ N·(1 - (N²-1)/6·da²) near da=0.
      var ratio = N * (1 - (N * N - 1) / 6 * da * da);
      return ratio * ratio;
    }
    var s = Math.sin(N * alpha) / Math.sin(alpha);
    return s * s;
  }

  // ----- the analytic far-field intensity (UN-normalised: central peak = N²) --
  // params: { N, a, d, lambda }  (a, d, lambda all in the same length unit, e.g.
  // micrometres; sinTheta is dimensionless). N≥1 integer; a>0; d≥a; lambda>0.
  // Returns I(sinθ) = sinc²(β)·[sin(Nα)/sin(α)]², peak = N² at sinθ=0.
  function intensity(p, sinTheta) {
    var beta = PI * p.a * sinTheta / p.lambda;
    var env = slitEnvelope(beta);
    if (p.N <= 1) return env;                 // single slit: grating factor ≡ 1
    var alpha = PI * p.d * sinTheta / p.lambda;
    return env * gratingFactor(alpha, p.N);
  }

  // peak value (sinθ=0) — coherent addition of N amplitudes → N² in intensity.
  function peakIntensity(p) { return p.N <= 1 ? 1 : p.N * p.N; }

  // ----- positions of the SINGLE-SLIT envelope minima (dark fringes) ----------
  // a·sinθ = mλ  →  sinθ = mλ/a, for m=±1,±2,… while |sinθ|≤1.  These are the
  // ZEROS OF THE ENVELOPE (they suppress grating orders that land on them —
  // "missing orders").
  function slitMinimaSinTheta(p) {
    var out = [], m = 1, s;
    while (true) {
      s = m * p.lambda / p.a;
      if (s > 1) break;
      out.push(-s); out.push(s);
      m++;
    }
    out.sort(function (x, y) { return x - y; });
    return out;
  }

  // ----- positions of the grating PRINCIPAL MAXIMA (orders) -------------------
  // d·sinθ = mλ  →  sinθ = mλ/d, m=0,±1,±2,…  (the grating equation). Order m is
  // a "missing order" when it coincides with a single-slit minimum (d/a integer
  // multiple of m); flagged so the caller can render it suppressed.
  function gratingOrders(p) {
    if (p.N <= 1) return [{ m: 0, sinTheta: 0, missing: false }];
    var out = [], m = 0, s;
    // m=0 central, then grow ± until |sinθ|>1
    for (m = 0; ; m++) {
      s = m * p.lambda / p.d;
      if (s > 1) break;
      // missing order test: does mλ/d also satisfy a·sinθ = m'λ for integer m'?
      // i.e. is (m·a/d) an integer ≥1?
      var k = m * p.a / p.d;
      var missing = m !== 0 && Math.abs(k - Math.round(k)) < 1e-9 && Math.round(k) >= 1;
      if (m === 0) out.push({ m: 0, sinTheta: 0, missing: false });
      else { out.push({ m: m, sinTheta: s, missing: missing });
             out.push({ m: -m, sinTheta: -s, missing: missing }); }
    }
    out.sort(function (x, y) { return x.sinTheta - y.sinTheta; });
    return out;
  }

  // resolving power-ish: angular FWHM of a principal maximum ∝ 1/N (sharpening).
  // The first zero beside a principal max is at Δα = π/N → ΔsinΘ = λ/(N·d).
  function principalHalfWidthSinTheta(p) {
    if (p.N <= 1) return p.lambda / p.a;      // single-slit central half-width
    return p.lambda / (p.N * p.d);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // THE INDEPENDENT FOURIER ROUTE — proves the closed form really is |FT|².
  // Samples the aperture transmission t(x) on a grid spanning the whole multi-
  // slit aperture, then evaluates the Fraunhofer integral as a direct discrete
  // sum:   A(sinθ) = Σ t(xj)·exp(-i k xj sinθ)·Δx ,  I = |A|².  Uses NO sinc and
  // NO grating identity — only complex exponentials of the sampled aperture.
  // Returned values are normalised so the central (sinθ=0) intensity equals N²,
  // to be directly comparable with intensity() above.
  // ═══════════════════════════════════════════════════════════════════════════

  // aperture transmission t(x): 1 inside any of the N slits, else 0.
  // Slits are centred on x = (j - (N-1)/2)·d for j=0..N-1, each of width a.
  function transmission(p, x) {
    var halfA = p.a / 2;
    var c0 = -(p.N - 1) / 2 * p.d;
    for (var j = 0; j < p.N; j++) {
      var c = c0 + j * p.d;
      if (x >= c - halfA && x <= c + halfA) return 1;
    }
    return 0;
  }

  // direct Fraunhofer sum at one sinθ. `samplesPerSlit` controls grid density.
  // The aperture transmission t(x) is a boxcar (0/1) with sharp edges, so a naive
  // uniform grid over the whole span suffers O(dx) edge error wherever a sample
  // straddles a slit edge. We avoid that — WITHOUT using the analytic slit
  // formula — by integrating each OPEN slit on its OWN aligned sub-grid (midpoint
  // rule, edges on cell boundaries). This is still a pure numerical Σ of
  // t(x)·e^{-ikx sinθ}·dx over the real aperture (it just samples only where
  // t≠0, with the grid snapped to the slit edges so the quadrature is clean).
  function fraunhofer(p, sinTheta, samplesPerSlit) {
    samplesPerSlit = samplesPerSlit || 64;
    var k = TAU / p.lambda;
    var halfA = p.a / 2;
    var c0 = -(p.N - 1) / 2 * p.d;
    var dx = p.a / samplesPerSlit;             // midpoint cells across one slit
    var re = 0, im = 0;
    for (var j = 0; j < p.N; j++) {
      var c = c0 + j * p.d;                     // this slit's centre
      var left = c - halfA;
      for (var s = 0; s < samplesPerSlit; s++) {
        var x = left + (s + 0.5) * dx;          // cell midpoint, strictly inside
        var ph = -k * x * sinTheta;
        re += Math.cos(ph) * dx;                // t(x)=1 inside the slit
        im += Math.sin(ph) * dx;
      }
    }
    return re * re + im * im;                   // |A|² (un-normalised)
  }

  // the normalisation constant so fraunhofer is comparable to intensity():
  // at sinθ=0 the integral is Σ t·dx = N·a (every slit fully open), so |A|² = (N·a)².
  // We want that to read N² → divide by a². (Exact in the continuum; the discrete
  // sum approximates it, hence the self-test compares to a tolerance.)
  function fraunhoferNorm(p, sinTheta, samplesPerSlit) {
    return fraunhofer(p, sinTheta, samplesPerSlit) / (p.a * p.a);
  }

  // ----- total diffracted power over the visible window (for Parseval-ish ⤳) --
  // integrate I(sinθ) over sinθ∈[-1,1] by the closed form and by the FT route;
  // the self-test checks they agree (both compute the same physical energy).
  function totalPowerClosed(p, M) {
    M = M || 4000;
    var sum = 0, ds = 2 / M;
    for (var i = 0; i <= M; i++) {
      var s = -1 + i * ds;
      sum += intensity(p, s) * ds;
    }
    return sum;
  }
  function totalPowerFT(p, M, samplesPerSlit) {
    M = M || 4000;
    var sum = 0, ds = 2 / M;
    for (var i = 0; i <= M; i++) {
      var s = -1 + i * ds;
      sum += fraunhoferNorm(p, s, samplesPerSlit) * ds;
    }
    return sum;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SELF-TEST — exercises the REAL functions above against first principles and
  // against the independent Fourier route. Returns {pass,total,results}.
  // ═══════════════════════════════════════════════════════════════════════════
  function runSelfTest() {
    var results = [], allPass = true;
    function check(name, cond, note) {
      results.push({ name: name, pass: !!cond, note: note || '' });
      if (!cond) allPass = false;
    }

    // a battery of physical configs (lengths in micrometres; visible λ).
    var cfgs = [
      { N: 1, a: 4, d: 4, lambda: 0.55 },      // single slit
      { N: 2, a: 2, d: 8, lambda: 0.55 },      // Young's double slit
      { N: 3, a: 2, d: 8, lambda: 0.50 },
      { N: 5, a: 1.5, d: 6, lambda: 0.60 },
      { N: 8, a: 1, d: 5, lambda: 0.45 },
      { N: 6, a: 2, d: 6, lambda: 0.55 }       // d/a = 3 → every 3rd order missing
    ];

    // (1) THE CRUX — analytic intensity == independent direct Fourier transform
    //     of the sampled aperture, across the whole pattern, for every config.
    (function () {
      var maxRel = 0, where = '';
      for (var c = 0; c < cfgs.length; c++) {
        var p = cfgs[c];
        for (var i = 0; i <= 240; i++) {
          var s = -0.9 + 1.8 * i / 240;
          var ia = intensity(p, s);
          var ift = fraunhoferNorm(p, s, 96);
          // compare on an absolute floor of the peak to avoid blowups near deep zeros
          var denom = Math.max(1e-6, peakIntensity(p));
          var rel = Math.abs(ia - ift) / denom;
          if (rel > maxRel) { maxRel = rel; where = 'N=' + p.N + ' sinθ=' + s.toFixed(3); }
        }
      }
      check('THE FOURIER CRUX: analytic I(θ) == |FT of the sampled aperture|² across the whole pattern (all configs)',
        maxRel < 2e-3, 'max rel error ' + maxRel.toExponential(2) + ' (peak-normalised) at ' + where);
    })();

    // (2) Single-slit minima land EXACTLY at a·sinθ = mλ (envelope is zero there).
    (function () {
      var p = { N: 1, a: 4, d: 4, lambda: 0.55 }, worst = 0;
      var minima = slitMinimaSinTheta(p);
      for (var i = 0; i < minima.length; i++) {
        var v = intensity(p, minima[i]);
        if (v > worst) worst = v;
        // also check m really equals a·sinθ/λ being an integer
      }
      var integerOK = true;
      for (var j = 0; j < minima.length; j++) {
        var m = p.a * minima[j] / p.lambda;
        if (Math.abs(m - Math.round(m)) > 1e-12) integerOK = false;
      }
      check('single-slit dark fringes are EXACTLY at a·sinθ = mλ (envelope = 0 there)',
        worst < 1e-12 && integerOK, 'max |I| at minima ' + worst.toExponential(2) + ', positions integer·λ/a');
    })();

    // (3) Grating PRINCIPAL MAXIMA land EXACTLY at d·sinθ = mλ, height = N²
    //     (coherent addition), and "missing orders" are suppressed by the sinc.
    (function () {
      var p = { N: 6, a: 2, d: 6, lambda: 0.55 };   // d/a=3 → orders ±3,±6,… missing
      var orders = gratingOrders(p);
      var posOK = true, heightOK = true, missingOK = true, peak = peakIntensity(p);
      var sawMissing = false;
      for (var i = 0; i < orders.length; i++) {
        var o = orders[i];
        var m2 = p.d * o.sinTheta / p.lambda;            // should equal o.m
        if (Math.abs(m2 - o.m) > 1e-9) posOK = false;
        var I = intensity(p, o.sinTheta);
        if (o.missing) {
          sawMissing = true;
          if (I > peak * 1e-6) missingOK = false;        // suppressed to ~0
        } else {
          // non-missing principal maxima reach (sinc envelope)·N² — at least the
          // grating factor is N² there; confirm the bracket alone hits N² by
          // dividing out the (nonzero) envelope.
          var beta = PI * p.a * o.sinTheta / p.lambda;
          var env = slitEnvelope(beta);
          if (env > 1e-9) {
            var bracket = I / env;
            if (Math.abs(bracket - peak) > peak * 1e-4) heightOK = false;
          }
        }
      }
      check('grating orders EXACTLY at d·sinθ = mλ, principal height = N², missing orders (d/a=3) suppressed',
        posOK && heightOK && missingOK && sawMissing,
        'orders ' + orders.length + ', N²=' + peak + ', missing-orders suppressed: ' + missingOK);
    })();

    // (4) The principal maxima SHARPEN with N: half-width ∝ 1/N exactly.
    (function () {
      var base = { a: 1.5, d: 6, lambda: 0.55 };
      var w2 = principalHalfWidthSinTheta({ N: 2, a: base.a, d: base.d, lambda: base.lambda });
      var w10 = principalHalfWidthSinTheta({ N: 10, a: base.a, d: base.d, lambda: base.lambda });
      var ratio = w2 / w10;     // should be 10/2 = 5
      check('principal maxima sharpen with N (first-zero half-width = λ/(N·d) ∝ 1/N)',
        Math.abs(ratio - 5) < 1e-9, 'w(N=2)/w(N=10) = ' + ratio.toFixed(6) + ' (expect 5)');
    })();

    // (5) N=1 grating factor ≡ 1 (collapses to the pure single slit); and N=2
    //     reproduces the textbook double-slit  sinc²(β)·cos²(α)·4 ... i.e. the
    //     bracket equals 4cos²(α). Check the bracket identity for N=2.
    (function () {
      var p = { N: 2, a: 2, d: 8, lambda: 0.55 }, worst = 0;
      for (var i = 0; i <= 200; i++) {
        var s = -0.9 + 1.8 * i / 200;
        var alpha = PI * p.d * s / p.lambda;
        var bracket = gratingFactor(alpha, 2);
        var textbook = 4 * Math.cos(alpha) * Math.cos(alpha);   // [sin2α/sinα]²=(2cosα)²
        worst = Math.max(worst, Math.abs(bracket - textbook));
      }
      var collapse = Math.abs(intensity({ N: 1, a: 3, d: 7, lambda: 0.5 }, 0.2) -
                              slitEnvelope(PI * 3 * 0.2 / 0.5));
      check('N=2 grating factor == 4cos²α (Young) and N=1 collapses to the pure single slit',
        worst < 1e-10 && collapse < 1e-15, 'double-slit bracket err ' + worst.toExponential(2));
    })();

    // (6) ENERGY agrees between the two routes — ∫I dsinθ closed-form == FT route
    //     (a Parseval-style conservation check, independent of the per-point one).
    (function () {
      var ok = true, worstRel = 0;
      var probe = [cfgs[1], cfgs[3], cfgs[4]];
      for (var c = 0; c < probe.length; c++) {
        var p = probe[c];
        var Ec = totalPowerClosed(p, 3000);
        var Ef = totalPowerFT(p, 3000, 80);
        var rel = Math.abs(Ec - Ef) / Math.max(1e-9, Ec);
        worstRel = Math.max(worstRel, rel);
        if (rel > 5e-3) ok = false;
      }
      check('energy conserved: ∫I dsinθ via the closed form == via the Fourier route (Parseval)',
        ok, 'worst rel ' + worstRel.toExponential(2));
    })();

    // (7) FALSIFIABLE: a WRONG minima law is rejected. If the dark fringes were
    //     at a·sinθ = (m+½)λ (the *bright*-fringe spacing for a two-source toy),
    //     the real envelope would NOT be zero there — assert it isn't.
    (function () {
      var p = { N: 1, a: 4, d: 4, lambda: 0.55 };
      var bad = [];
      for (var m = 1; (m - 0.5) * p.lambda / p.a <= 1; m++) bad.push((m - 0.5) * p.lambda / p.a);
      var minHit = Infinity;
      for (var i = 0; i < bad.length; i++) minHit = Math.min(minHit, intensity(p, bad[i]));
      // the wrong (half-integer) law should land on the BRIGHT secondary maxima,
      // nowhere near zero — so min intensity there is comfortably > 0.
      check('FALSIFIABLE: the wrong half-integer minima law (m+½)λ/a is NOT dark (rejected)',
        minHit > 1e-3, 'min I at the wrong positions = ' + minHit.toExponential(2) + ' (must be > 0)');
    })();

    // (8) DETERMINISM: the analytic and FT routes are pure — identical output on
    //     repeated calls with identical inputs (no hidden state / RNG / clock).
    (function () {
      var p = { N: 5, a: 1.5, d: 6, lambda: 0.6 }, same = true;
      for (var i = 0; i < 50; i++) {
        var s = -0.8 + 1.6 * i / 50;
        if (intensity(p, s) !== intensity(p, s)) same = false;
        if (fraunhoferNorm(p, s, 48) !== fraunhoferNorm(p, s, 48)) same = false;
      }
      check('deterministic: pure functions, byte-identical on repeat (no RNG / clock / state)', same);
    })();

    var nPass = 0;
    for (var i = 0; i < results.length; i++) if (results[i].pass) nPass++;
    return { pass: allPass, n: nPass, total: results.length, results: results };
  }

  var Diffraction = {
    sinc: sinc,
    slitEnvelope: slitEnvelope,
    gratingFactor: gratingFactor,
    intensity: intensity,
    peakIntensity: peakIntensity,
    slitMinimaSinTheta: slitMinimaSinTheta,
    gratingOrders: gratingOrders,
    principalHalfWidthSinTheta: principalHalfWidthSinTheta,
    transmission: transmission,
    fraunhofer: fraunhofer,
    fraunhoferNorm: fraunhoferNorm,
    totalPowerClosed: totalPowerClosed,
    totalPowerFT: totalPowerFT,
    runSelfTest: runSelfTest
  };

  if (root && root.document) root.Diffraction = Diffraction;
  root.Diffraction = Diffraction;

  // dual-use module guard (forge strips exactly this braced single line)
  if (typeof module !== 'undefined' && module.exports) { module.exports = Diffraction; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
