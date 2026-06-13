/* ═══════════════════════════════════════════════════════════════════════════
   galton.js — the Galton board's DOM-free probability CORE.

   A Galton board (bean machine, quincunx) drops balls through a triangular
   array of pegs. At each of `rows` rows a ball bounces RIGHT with probability
   `(1 - p)` and LEFT with probability `p`, independently. A ball's final BIN is
   exactly its count of right-bounces, an integer in [0, rows]. Because each ball
   is a sum of `rows` independent Bernoulli trials, the bin is — by definition —
   a **Binomial(rows, 1-p)** random variable, and as balls accumulate the
   histogram converges to that binomial PMF (the bell curve, for symmetric p).

   The workshop's rule is that a piece must PROVE its claim. So this file is not
   "a simulation that looks bell-shaped." It carries:

     • binomialPMF(rows, p) — the EXACT closed-form P(bin = k) for every k, built
       from log-factorials so it is numerically stable for large `rows`. The PMF
       is the GROUND TRUTH the simulation is measured against.
     • normalPDF / normalApprox — the continuous N(μ=rows·q, σ²=rows·p·q)
       approximation (q = 1-p) the page can overlay.
     • simulate(...) — a SEEDED mulberry32 simulation (no Math.random, no
       wall-clock) of N balls; deterministic given (seed, rows, p, N).
     • chiSquare(...) + chiSquareCDF / pValue — a goodness-of-fit statistic of an
       empirical histogram against the binomial PMF, with its p-value, so we can
       state honestly: a large seeded run does NOT reject the binomial at a given
       significance. (Statistical convergence — not an exact identity.)

   The provable claims (see runSelfTest, mirrored by the Node test):
     1. The ideal IS exactly binomial — the PMF sums to 1, has mean rows·q and
        variance rows·p·q, and matches hand-checked small cases (Pascal's row).
     2. The simulation converges to it — a ≥100k seeded run's χ² to the binomial
        does NOT reject at α (statistic < critical value), at p=0.5 AND biased p.
     3. Every path is valid — each ball makes exactly `rows` ±steps, lands in one
        bin ∈ [0,rows], bin == right-bounces; histogram conserves every ball.
     4. Determinism — same (seed,rows,p,N) ⇒ identical paths + identical histogram.
     5. Empirical mean/variance track rows·q and rows·p·q within an N-tightening
        tolerance.

   Vanilla, ES5-ish, zero-dependency, DOM-free. Dual-use: attaches a `Galton`
   global in the browser; exports the same object under Node for the self-test.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Galton = {};

  /* Supported row range for the UI; the math holds for any rows ≥ 0. */
  Galton.ROWS_MIN = 4;
  Galton.ROWS_MAX = 16;

  Galton.clampRows = function (r) {
    r = Math.round(+r);
    if (!isFinite(r)) r = 8;
    if (r < Galton.ROWS_MIN) r = Galton.ROWS_MIN;
    if (r > Galton.ROWS_MAX) r = Galton.ROWS_MAX;
    return r;
  };
  Galton.clampP = function (p) {
    p = +p;
    if (!isFinite(p)) p = 0.5;
    // clamp into (0,1) with a tiny margin so log() and variance stay finite
    if (p < 1e-6) p = 1e-6;
    if (p > 1 - 1e-6) p = 1 - 1e-6;
    return p;
  };

  /* ── Seeded RNG (mulberry32) ──────────────────────────────────────────────
     xmur3 hashes a string to a 32-bit seed; mulberry32 turns that into a
     deterministic [0,1) stream. Same seed string ⇒ identical stream. No
     Math.random, no Date — fully reproducible. */
  function xmur3(str) {
    str = String(str);
    var h = 1779033703 ^ str.length;
    for (var i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      h ^= h >>> 16;
      return h >>> 0;
    };
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  /* makeRng(seed): a fresh deterministic [0,1) generator from a seed string. */
  function makeRng(seed) {
    return mulberry32(xmur3(seed)());
  }
  Galton.makeRng = makeRng;

  /* ── Log-factorial / log-binomial (numerically stable) ────────────────────
     We build the PMF in log-space so binomial coefficients for rows up to the
     hundreds never overflow. logFactorial uses a small memoized table for exact
     small values and the Lanczos log-gamma for larger ones. */
  var LF_CACHE = [0, 0]; // logFactorial(0)=logFactorial(1)=0
  // Lanczos approximation for ln(Γ(z)), z > 0 (g=7, n=9 coefficients).
  var LANCZOS_G = 7;
  var LANCZOS_C = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7
  ];
  function logGamma(z) {
    // reflection for z<0.5 (not hit for our z≥1 uses, but keep it correct)
    if (z < 0.5) {
      return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
    }
    z -= 1;
    var x = LANCZOS_C[0];
    for (var i = 1; i < LANCZOS_G + 2; i++) x += LANCZOS_C[i] / (z + i);
    var t = z + LANCZOS_G + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }
  /* logFactorial(n) = ln(n!) — exact small table, log-gamma beyond. */
  function logFactorial(n) {
    n = Math.round(n);
    if (n < 0) return NaN;
    if (n < LF_CACHE.length) return LF_CACHE[n];
    if (n <= 256) {
      for (var i = LF_CACHE.length; i <= n; i++) {
        LF_CACHE[i] = LF_CACHE[i - 1] + Math.log(i);
      }
      return LF_CACHE[n];
    }
    return logGamma(n + 1);
  }
  Galton.logFactorial = logFactorial;

  /* logChoose(n, k) = ln(C(n,k)). */
  function logChoose(n, k) {
    if (k < 0 || k > n) return -Infinity;
    return logFactorial(n) - logFactorial(k) - logFactorial(n - k);
  }
  Galton.logChoose = logChoose;

  /* choose(n, k) = C(n,k) (rounded; exact for the small `rows` the board uses). */
  Galton.choose = function (n, k) {
    if (k < 0 || k > n) return 0;
    return Math.round(Math.exp(logChoose(n, k)));
  };

  /* ── The EXACT binomial PMF ────────────────────────────────────────────────
     binomialPMF(rows, p) → [P(bin=0), …, P(bin=rows)].

     CONVENTION: a ball goes LEFT with probability `p`, RIGHT with `1-p`, and the
     bin is the number of RIGHT bounces. So bin ~ Binomial(rows, q) with q = 1-p:
         P(bin = k) = C(rows,k) · q^k · p^(rows-k).
     Built in log-space for numerical stability. Returns an array of length
     rows+1 that sums to 1 to ~1e-15. */
  Galton.binomialPMF = function (rows, p) {
    rows = Math.round(rows);
    p = Galton.clampP(p);
    var q = 1 - p;            // right-probability
    var lq = Math.log(q), lp = Math.log(p);
    var out = new Array(rows + 1);
    for (var k = 0; k <= rows; k++) {
      out[k] = Math.exp(logChoose(rows, k) + k * lq + (rows - k) * lp);
    }
    return out;
  };

  /* Mean / variance of Binomial(rows, q), q = 1-p. */
  Galton.binomialMean = function (rows, p) { return rows * (1 - Galton.clampP(p)); };
  Galton.binomialVar = function (rows, p) {
    p = Galton.clampP(p);
    return rows * p * (1 - p);
  };

  /* ── Normal approximation ──────────────────────────────────────────────────
     N(μ = rows·q, σ² = rows·p·q). normalPDF(x, μ, σ) is the density; normalApprox
     samples it on the bin grid 0..rows (a continuous overlay, NOT a PMF — it need
     not sum to 1 on the discrete grid). */
  Galton.normalPDF = function (x, mu, sigma) {
    var z = (x - mu) / sigma;
    return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
  };
  Galton.normalApprox = function (rows, p) {
    var mu = Galton.binomialMean(rows, p);
    var sigma = Math.sqrt(Galton.binomialVar(rows, p));
    var out = new Array(rows + 1);
    for (var k = 0; k <= rows; k++) out[k] = Galton.normalPDF(k, mu, sigma);
    return out;
  };

  /* ── A single ball's path ──────────────────────────────────────────────────
     dropBall(rng, rows, p) → { bin, steps } where steps is an array of length
     `rows` of -1 (left) / +1 (right). bin = count of +1 steps = right-bounces.
     A draw u < p goes LEFT; otherwise RIGHT. */
  Galton.dropBall = function (rng, rows, p) {
    rows = Math.round(rows);
    p = Galton.clampP(p);
    var steps = new Array(rows);
    var bin = 0;
    for (var i = 0; i < rows; i++) {
      if (rng() < p) { steps[i] = -1; }   // left
      else { steps[i] = 1; bin++; }        // right → +1 bin
    }
    return { bin: bin, steps: steps };
  };

  /* ── A seeded run ──────────────────────────────────────────────────────────
     simulate(seed, rows, p, n[, opts]) → {
       hist: int[rows+1],   // counts per bin (sums to n)
       n, rows, p,
       mean, variance,      // empirical (from the histogram)
       paths?                // first opts.keepPaths ball step-arrays (debug/anim)
     }
     Deterministic in (seed, rows, p, n). The histogram is the load-bearing
     output the page grows; paths are kept only for the first few balls (for the
     in-page animation / determinism check) to keep memory bounded for big runs. */
  Galton.simulate = function (seed, rows, p, n, opts) {
    rows = Math.round(rows);
    p = Galton.clampP(p);
    n = Math.max(0, Math.round(n));
    opts = opts || {};
    var keep = opts.keepPaths || 0;
    var rng = makeRng(seed);
    var hist = new Array(rows + 1);
    for (var b = 0; b <= rows; b++) hist[b] = 0;
    var paths = keep ? [] : null;
    var sum = 0, sumSq = 0;
    for (var i = 0; i < n; i++) {
      var ball = Galton.dropBall(rng, rows, p);
      hist[ball.bin]++;
      sum += ball.bin;
      sumSq += ball.bin * ball.bin;
      if (keep && i < keep) paths.push(ball.steps);
    }
    var mean = n ? sum / n : 0;
    var variance = n ? (sumSq / n - mean * mean) : 0;
    var res = { hist: hist, n: n, rows: rows, p: p, mean: mean, variance: variance };
    if (paths) res.paths = paths;
    return res;
  };

  /* ── χ² goodness-of-fit ─────────────────────────────────────────────────────
     chiSquare(hist, pmf) → { stat, df, n } comparing observed counts to the
     binomial expectation. df = (#testable bins) − 1 (no fitted params; rows & p
     are given, not estimated). Bins whose theoretical probability is 0 are
     dropped from both sides (they contribute neither obs nor expectation) — the
     honest thing for an extreme biased p. */
  Galton.chiSquare = function (hist, pmf) {
    var n = 0, k;
    for (k = 0; k < hist.length; k++) n += hist[k];
    var stat = 0, df = 0;
    for (k = 0; k < pmf.length; k++) {
      var expected = pmf[k] * n;
      if (expected <= 0) continue;       // theoretical 0 → not a testable cell
      var obs = hist[k] || 0;
      var d = obs - expected;
      stat += (d * d) / expected;
      df++;
    }
    df = Math.max(1, df - 1);            // −1 for the fixed total
    return { stat: stat, df: df, n: n };
  };

  /* Regularized lower incomplete gamma P(a,x) = γ(a,x)/Γ(a), via series (x<a+1)
     or continued fraction (otherwise). Used for the χ² CDF. */
  function gammaP(a, x) {
    if (x < 0 || a <= 0) return NaN;
    if (x === 0) return 0;
    var gln = logGamma(a);
    if (x < a + 1) {
      var ap = a, sum = 1 / a, del = sum;
      for (var i = 0; i < 1000; i++) {
        ap += 1;
        del *= x / ap;
        sum += del;
        if (Math.abs(del) < Math.abs(sum) * 1e-15) break;
      }
      return sum * Math.exp(-x + a * Math.log(x) - gln);
    } else {
      // Lentz's continued fraction for upper incomplete Q(a,x); P = 1 − Q
      var FPMIN = 1e-300;
      var b = x + 1 - a, c = 1 / FPMIN, d = 1 / b, h = d;
      for (var j = 1; j < 1000; j++) {
        var an = -j * (j - a);
        b += 2;
        d = an * d + b; if (Math.abs(d) < FPMIN) d = FPMIN;
        c = b + an / c; if (Math.abs(c) < FPMIN) c = FPMIN;
        d = 1 / d;
        var delta = d * c;
        h *= delta;
        if (Math.abs(delta - 1) < 1e-15) break;
      }
      var Q = Math.exp(-x + a * Math.log(x) - gln) * h;
      return 1 - Q;
    }
  }
  Galton.gammaP = gammaP;

  /* χ² CDF with `df` degrees of freedom: P(X ≤ x) = gammaP(df/2, x/2). */
  Galton.chiSquareCDF = function (x, df) {
    if (x <= 0) return 0;
    return gammaP(df / 2, x / 2);
  };
  /* p-value for a χ² statistic = upper tail = 1 − CDF. A LARGE p-value means the
     observed histogram is CONSISTENT with the binomial (do NOT reject). */
  Galton.chiSquarePValue = function (stat, df) {
    return 1 - Galton.chiSquareCDF(stat, df);
  };

  /* Critical value: the x with CDF(x,df) = 1−α. Bisection on the monotone CDF. */
  Galton.chiSquareCritical = function (alpha, df) {
    var target = 1 - alpha;
    var lo = 0, hi = Math.max(40, df * 4 + 40);
    while (Galton.chiSquareCDF(hi, df) < target && hi < 1e6) hi *= 2;
    for (var i = 0; i < 200; i++) {
      var mid = 0.5 * (lo + hi);
      if (Galton.chiSquareCDF(mid, df) < target) lo = mid; else hi = mid;
    }
    return 0.5 * (lo + hi);
  };

  /* ── The shared self-test battery ──────────────────────────────────────────
     The EXACT battery the in-page green chip runs; the Node test wraps this and
     adds hardening. Returns { pass, n, total, results:[{name,pass,note}] }. */
  Galton.runSelfTest = function () {
    var results = [];
    var allPass = true;
    var EPS_SUM = 1e-12, EPS_MOM = 1e-9;

    /* Check #1 — the ideal IS exactly binomial: PMF sums to 1, mean = rows·q,
       variance = rows·p·q, and rows=4,p=.5 is Pascal's row 1,4,6,4,1 over 16. */
    (function () {
      var ok = true, fail = '', maxSumErr = 0, maxMomErr = 0;
      var cases = [
        { rows: 4, p: 0.5 }, { rows: 8, p: 0.5 }, { rows: 12, p: 0.5 },
        { rows: 16, p: 0.5 }, { rows: 10, p: 0.3 }, { rows: 13, p: 0.72 }
      ];
      for (var ci = 0; ci < cases.length && ok; ci++) {
        var rows = cases[ci].rows, p = cases[ci].p, q = 1 - p;
        var pmf = Galton.binomialPMF(rows, p);
        var s = 0, m = 0, m2 = 0;
        for (var k = 0; k <= rows; k++) { s += pmf[k]; m += k * pmf[k]; m2 += k * k * pmf[k]; }
        var sumErr = Math.abs(s - 1);
        if (sumErr > maxSumErr) maxSumErr = sumErr;
        if (sumErr > EPS_SUM) { ok = false; fail = 'rows=' + rows + ' p=' + p + ' Σ=' + s; break; }
        var variance = m2 - m * m;
        var mErr = Math.abs(m - rows * q), vErr = Math.abs(variance - rows * p * q);
        if (mErr > maxMomErr) maxMomErr = mErr;
        if (vErr > maxMomErr) maxMomErr = vErr;
        if (mErr > EPS_MOM || vErr > EPS_MOM) {
          ok = false; fail = 'rows=' + rows + ' p=' + p + ' meanErr=' + mErr.toExponential(2) + ' varErr=' + vErr.toExponential(2); break;
        }
      }
      if (ok) {
        var pmf4 = Galton.binomialPMF(4, 0.5);
        var pascal = [1, 4, 6, 4, 1];
        for (var i = 0; i <= 4; i++) {
          if (Math.abs(pmf4[i] - pascal[i] / 16) > 1e-15) { ok = false; fail = 'Pascal[' + i + ']=' + pmf4[i]; break; }
        }
      }
      results.push({ name: 'ideal is exactly Binomial (Σ=1, mean=rows·q, var=rows·p·q, Pascal row)', pass: ok,
        note: ok ? ('Σ-err ≤ ' + maxSumErr.toExponential(1) + ', moment-err ≤ ' + maxMomErr.toExponential(1) + ', 1·4·6·4·1/16 ✓') : fail });
      allPass = allPass && ok;
    })();

    /* Check #2 — the simulation converges: a large seeded run's χ² to the
       binomial does NOT reject at α=0.01, at p=0.5 AND a biased p. (A
       statistical claim — stated as such.) */
    (function () {
      var ok = true, fail = '', noteParts = [];
      var alpha = 0.01;
      var runs = [
        { seed: 'verify-fair', rows: 12, p: 0.5, n: 120000 },
        { seed: 'verify-bias', rows: 12, p: 0.3, n: 120000 }
      ];
      for (var ri = 0; ri < runs.length && ok; ri++) {
        var r = runs[ri];
        var sim = Galton.simulate(r.seed, r.rows, r.p, r.n);
        var pmf = Galton.binomialPMF(r.rows, r.p);
        var cs = Galton.chiSquare(sim.hist, pmf);
        var crit = Galton.chiSquareCritical(alpha, cs.df);
        var pv = Galton.chiSquarePValue(cs.stat, cs.df);
        if (cs.stat >= crit) {
          ok = false;
          fail = r.seed + ' (p=' + r.p + ', N=' + r.n + ') χ²=' + cs.stat.toFixed(2) +
                 ' ≥ crit=' + crit.toFixed(2) + ' df=' + cs.df + ' (p-value ' + pv.toExponential(2) + ')';
          break;
        }
        noteParts.push('p=' + r.p + ': χ²=' + cs.stat.toFixed(1) + '<' + crit.toFixed(1) + ' (pv ' + pv.toFixed(3) + ')');
      }
      results.push({ name: 'simulation converges: χ² does NOT reject Binomial at α=0.01 (fair + biased)', pass: ok,
        note: ok ? noteParts.join(' · ') : fail });
      allPass = allPass && ok;
    })();

    /* Check #3 — every path is valid: each ball makes exactly `rows` ±steps,
       lands in one bin ∈ [0,rows], bin == #right-bounces; Σ hist == N. */
    (function () {
      var ok = true, fail = '';
      var sim = Galton.simulate('paths-check', 10, 0.5, 4000, { keepPaths: 4000 });
      var conserved = 0;
      for (var b = 0; b < sim.hist.length; b++) conserved += sim.hist[b];
      if (conserved !== sim.n) { ok = false; fail = 'Σhist=' + conserved + ' != N=' + sim.n; }
      if (ok) {
        var rng = Galton.makeRng('paths-check'); // SAME seed/stream → same balls
        for (var i = 0; i < sim.n && ok; i++) {
          var ball = Galton.dropBall(rng, 10, 0.5);
          if (ball.steps.length !== 10) { ok = false; fail = 'ball ' + i + ' has ' + ball.steps.length + ' steps'; break; }
          var rights = 0, valid = true;
          for (var s = 0; s < ball.steps.length; s++) {
            if (ball.steps[s] !== 1 && ball.steps[s] !== -1) { valid = false; break; }
            if (ball.steps[s] === 1) rights++;
          }
          if (!valid) { ok = false; fail = 'ball ' + i + ' has a non-±1 step'; break; }
          if (rights !== ball.bin) { ok = false; fail = 'ball ' + i + ' bin=' + ball.bin + ' != rights=' + rights; break; }
          if (ball.bin < 0 || ball.bin > 10) { ok = false; fail = 'ball ' + i + ' bin out of [0,10]'; break; }
        }
      }
      results.push({ name: 'every path valid: rows ±1 steps, bin == right-bounces ∈ [0,rows], Σhist == N', pass: ok,
        note: ok ? '4000 balls × 10 rows: every bin == right-count, all conserved' : fail });
      allPass = allPass && ok;
    })();

    /* Check #4 — determinism: same (seed,rows,p,N) ⇒ identical histogram AND
       identical per-ball path sequence across two independent runs. */
    (function () {
      var ok = true, fail = '';
      var a = Galton.simulate('det', 9, 0.4, 5000, { keepPaths: 200 });
      var b = Galton.simulate('det', 9, 0.4, 5000, { keepPaths: 200 });
      for (var k = 0; k < a.hist.length; k++) {
        if (a.hist[k] !== b.hist[k]) { ok = false; fail = 'hist differs at bin ' + k; break; }
      }
      if (ok) {
        for (var i = 0; i < a.paths.length && ok; i++) {
          for (var s = 0; s < a.paths[i].length; s++) {
            if (a.paths[i][s] !== b.paths[i][s]) { ok = false; fail = 'path ' + i + ' step ' + s + ' differs'; break; }
          }
        }
      }
      if (ok) {
        var c = Galton.simulate('det-other', 9, 0.4, 5000);
        var same = true;
        for (var j = 0; j < a.hist.length; j++) if (a.hist[j] !== c.hist[j]) { same = false; break; }
        if (same) { ok = false; fail = 'distinct seeds produced identical histograms'; }
      }
      results.push({ name: 'deterministic: same (seed,rows,p,N) ⇒ identical paths + histogram', pass: ok,
        note: ok ? 'two runs byte-identical; distinct seed differs' : fail });
      allPass = allPass && ok;
    })();

    /* Check #5 — empirical mean/variance track rows·q and rows·p·q, and the gap
       TIGHTENS with N. Compare a small run to a large run for the mean. */
    (function () {
      var ok = true, fail = '';
      var rows = 12, p = 0.5, q = 1 - p;
      var muT = rows * q, varT = rows * p * q;
      var small = Galton.simulate('moments-s', rows, p, 2000);
      var big = Galton.simulate('moments-b', rows, p, 200000);
      var meanErrBig = Math.abs(big.mean - muT), varErrBig = Math.abs(big.variance - varT);
      if (meanErrBig > 0.05) { ok = false; fail = 'big mean err ' + meanErrBig.toFixed(4) + ' (μ=' + muT + ')'; }
      else if (varErrBig > 0.12) { ok = false; fail = 'big var err ' + varErrBig.toFixed(4) + ' (σ²=' + varT + ')'; }
      if (ok) {
        var meanErrSmall = Math.abs(small.mean - muT);
        if (meanErrBig > meanErrSmall + 0.02) { ok = false; fail = 'mean did not tighten: big ' + meanErrBig.toFixed(4) + ' vs small ' + meanErrSmall.toFixed(4); }
      }
      results.push({ name: 'empirical mean/variance track rows·q & rows·p·q (tightening with N)', pass: ok,
        note: ok ? ('N=200k: mean-err ' + meanErrBig.toExponential(1) + ', var-err ' + varErrBig.toExponential(1) + ' vs μ=' + muT + ', σ²=' + varT) : fail });
      allPass = allPass && ok;
    })();

    var nPass = 0;
    for (var i = 0; i < results.length; i++) if (results[i].pass) nPass++;
    return { pass: allPass, n: nPass, total: results.length, results: results };
  };

  // browser global
  if (root && root.document) root.Galton = Galton;
  // also attach for non-document roots (workers / forge-inlined contexts)
  root.Galton = Galton;

  // dual-use module guard (forge strips exactly this braced single line)
  if (typeof module !== 'undefined' && module.exports) { module.exports = Galton; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
