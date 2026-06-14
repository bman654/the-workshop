// ============================================================================
//  The Plumbline — the Least Squares bench (CORE)
//  Pure, dependency-free. This file is the SOLE AUTHORITY for the math; the page
//  (plumbline/index.html) inlines a byte-twin of the block below between sentinels
//  (the partition.html pattern), and plumbline-core.test.mjs re-extracts that
//  slice and proves it is byte-for-byte the SAME core (the convex-hull parity
//  harness). Both the in-page pill and the Node twin call the SAME runSelfTest().
//
//  THE CLAIM — once you punish error by its SQUARE, exactly one line is best.
//
//  A best-fit line is not an opinion. Given a cloud of points and the rule "score
//  a line by Σ(vertical residual)²", there is exactly ONE line that wins, and you
//  can reach it three ways that share no code:
//
//    1. THE NORMAL EQUATIONS (closed form). Differentiate Σr² w.r.t. (m,b), set to
//       zero, solve the 2×2 system → m,b in one shot. fitL2().
//    2. GRADIENT DESCENT (from scratch). Start at a deliberately-wrong flat line,
//       step downhill along the Σr² gradient. It CONVERGES to the same (m,b) to
//       machine precision — independent code, identical answer. gdFit().
//    3. A PERTURBATION JURY (a third stranger). Nudge (m,b) every which way; every
//       nudge SCORES WORSE. The closed-form line is the strict floor — no jiggle
//       beats it. perturbAllWorse().
//
//  These three name no shared fit helper (only primitive sum/mean atoms), so their
//  agreement is not a tautology — it is the theorem, witnessed. A .toString() grep
//  test (the convex-hull anti-circularity idiom) enforces the source-disjointness.
//
//  THE R² TRIPLE IDENTITY. The same number arrives two independent routes:
//       R² = 1 − SS_res/SS_tot  (sums of squares)
//          = r² (Pearson)²       (the correlation coefficient, squared)
//  and == 1.0 exactly on collinear points. Two routes, one number; the gilt
//  fraction of the variance bar literally IS R².
//
//  THE TEETH (a CHOICE, not a law). "Best" depended on choosing the SQUARE. fitL1
//  minimises Σ|residual| instead (least absolute deviations) and lands on a
//  DIFFERENT line. Squared loss is what makes the line unique and gives the closed
//  form — but it is NOT robust: drag one point far out and the L2 slope LURCHES
//  toward it while the robust L1 slope barely twitches. What is PROVEN is exact and
//  conditional (given squared loss, THE minimum); what is CHOSEN is the loss itself.
//
//  THE GUARD. With fewer than two points at DISTINCT x, the slope is undefined
//  (a vertical line, infinite m). fitL2 returns {ok:false} rather than a NaN line;
//  the page greys the gauge instead of drawing garbage.
// ============================================================================

// ===== PLUMBLINE CORE (inlined byte-twin) BEGIN =====
// ── THE PRIMITIVE ATOMS — the ONLY shared helpers (sum / mean over an accessor). ─
// These are the "adjacent swap" of this bench: every estimator needs a sum and a
// mean, and sharing them is not sharing a fit. fitL2, gdFit and the perturbation
// jury each call THESE and nothing else of each other's — that disjointness is the
// whole point (the closed form and gradient descent agreeing must be a theorem,
// not a copy). Integer-free, pure, no rounding.
function sum(xs){ let s = 0; for (let i = 0; i < xs.length; i++) s += xs[i]; return s; }
function mean(xs){ return xs.length ? sum(xs) / xs.length : 0; }

// ── distinctXCount(points) — the vertical-data guard's witness. ───────────────
// Counts how many DISTINCT x-values the cloud has. With < 2 the least-squares
// slope is undefined (Σ(x−x̄)² = 0 → divide-by-zero → a vertical line). Both the
// core and the page consult this so a degenerate cloud greys out, never NaNs.
function distinctXCount(points){
  const seen = new Set();
  for (let i = 0; i < points.length; i++) seen.add(points[i].x);
  return seen.size;
}

// ── sse(points, m, b) — the score being minimised: Σ(vertical residual)². ──────
// A residual is VERTICAL: r_i = y_i − (m·x_i + b) (x is assumed known; this is
// ordinary least squares, NOT perpendicular/Deming regression). The square of the
// vertical distance, summed. This is the ONE number the whole bench is about.
function sse(points, m, b){
  let s = 0;
  for (let i = 0; i < points.length; i++){
    const r = points[i].y - (m * points[i].x + b);
    s += r * r;
  }
  return s;
}

// ── ESTIMATOR 1 — THE NORMAL EQUATIONS (closed form). ─────────────────────────
// Differentiate Σ(y−mx−b)² w.r.t. m and b, set both to zero, and the optimum is
// the solution of the 2×2 "normal equations":
//     m = Σ(x−x̄)(y−ȳ) / Σ(x−x̄)²        (covariance over x-variance)
//     b = ȳ − m·x̄                         (the line passes through the centroid)
// Then r² (Pearson²) and R² (1−SS_res/SS_tot) are reported off the same fit. With
// < 2 distinct x the denominator is 0 → {ok:false} (the guard, never a NaN line).
// References ONLY the sum/mean atoms and sse — NO other estimator (anti-circularity).
function fitL2(points){
  const n = points.length;
  if (n < 2 || distinctXCount(points) < 2){
    return { ok: false, m: 0, b: 0, sse: 0, r2: 0, r: 0, n };
  }
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const xbar = mean(xs), ybar = mean(ys);
  let Sxx = 0, Sxy = 0, Syy = 0;
  for (let i = 0; i < n; i++){
    const dx = xs[i] - xbar, dy = ys[i] - ybar;
    Sxx += dx * dx; Sxy += dx * dy; Syy += dy * dy;
  }
  const m = Sxy / Sxx;
  const b = ybar - m * xbar;
  const ssRes = sse(points, m, b);
  const ssTot = Syy;                              // Σ(y−ȳ)² = SS_tot
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  const r = Syy === 0 ? 0 : Sxy / Math.sqrt(Sxx * Syy);   // Pearson correlation (signed)
  return { ok: true, m, b, sse: ssRes, r2, r, n, xbar, ybar, ssTot };
}

// ── ESTIMATOR 2 — GRADIENT DESCENT (from scratch, totally separate code). ─────
// Start at a deliberately-WRONG flat line (m=0, b=ȳ) and step downhill along the
// analytic gradient of Σr²:
//     ∂Σr²/∂m = −2 Σ x·r ,   ∂Σr²/∂b = −2 Σ r ,   r = y − (m x + b)
// The learning rate is scaled by 1/Σx² so the same lr behaves across clouds. It
// returns the full per-iteration trace (the page animates the ghost along it).
// Knows NOTHING of the normal equations — yet converges to the same (m,b) to ≤1e-9.
// References ONLY the sum/mean atoms — NO fitL2, NO closed-form machinery.
function gdFit(points, opts){
  const maxIters = (opts && opts.maxIters) || 4000;
  const n = points.length;
  if (n < 2 || distinctXCount(points) < 2){
    return { ok: false, m: 0, b: 0, trace: [] };
  }
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const ybar = mean(ys);
  const sumXX = sum(xs.map(x => x * x)) || 1;
  // Each coordinate gets a step scaled by its own curvature: ∂²Σr²/∂m² = 2Σx²,
  // ∂²Σr²/∂b² = 2n. Dividing each gradient by its Hessian diagonal makes a single
  // lr converge on every cloud (a diagonal-preconditioned descent) — and lets b
  // (the slow-mixing coordinate when Σx²≫n) reach the floor in the same budget.
  const baseLr = (opts && opts.lr) || 0.5;
  const lrM = baseLr / sumXX;
  const lrB = baseLr / n;
  let m = 0, b = ybar;                            // the deliberately-wrong flat start
  const trace = [{ m, b, sse: sse(points, m, b) }];
  for (let it = 0; it < maxIters; it++){
    let gm = 0, gb = 0;
    for (let i = 0; i < n; i++){
      const r = ys[i] - (m * xs[i] + b);          // residual
      gm += -2 * xs[i] * r;
      gb += -2 * r;
    }
    m -= lrM * gm;
    b -= lrB * gb;
    trace.push({ m, b, sse: sse(points, m, b) });
  }
  return { ok: true, m, b, trace };
}

// ── ESTIMATOR 3 — THE PERTURBATION JURY (a third stranger). ───────────────────
// Take the closed-form line and nudge (m,b) by random ±ε in every direction; EVERY
// nudge must score worse (higher Σr²). If even one perturbation beat the fit, the
// "minimum" would be a lie. Returns {ok, worst, tested} where ok means no nudge
// won. This proves the floor is a strict minimum WITHOUT touching gdFit's code or
// fitL2's solve — it only reads sse. References ONLY sse and a seeded rng.
function perturbAllWorse(points, fit, seed, trials, eps){
  const T = trials || 400;
  const E = eps || 0.25;
  const rng = makeRng(seed || 1);
  const base = fit.sse;
  let worst = Infinity, beaten = 0;               // worst = smallest margin seen
  for (let t = 0; t < T; t++){
    const dm = (rng() * 2 - 1) * E;
    const db = (rng() * 2 - 1) * E;
    if (dm === 0 && db === 0) continue;
    const s = sse(points, fit.m + dm, fit.b + db);
    const margin = s - base;                       // must be ≥ 0
    if (margin < worst) worst = margin;
    if (margin < 0) beaten++;                       // a nudge that BEAT the fit (a bug)
  }
  return { ok: beaten === 0, worst, beaten, tested: T };
}

// ── ESTIMATOR 4 — LEAST ABSOLUTE DEVIATIONS (the teeth; DETERMINISTIC). ───────
// Minimise Σ|residual| instead of Σ(residual)² via IRLS (iteratively reweighted
// least squares): repeatedly solve a WEIGHTED normal-equations fit with weight
// w_i = 1/max(|r_i|, δ). Fixed iteration count + a floor δ → a stable, repeatable
// {m,b} (the teeth caption must not jitter). It lands on a DIFFERENT line than L2
// on a noisy cloud, and — the honest caveat — it barely moves when L2 lurches at an
// outlier (squared loss is unique but NOT robust). Uses the weighted closed form
// internally (its own machinery); references the sum/mean atoms, never fitL2/gdFit.
function fitL1(points){
  const n = points.length;
  if (n < 2 || distinctXCount(points) < 2){
    return { ok: false, m: 0, b: 0, sad: 0, n };
  }
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  // seed from the unweighted (uniform-weight) normal-equations solution.
  let m = 0, b = 0;
  {
    const xbar = mean(xs), ybar = mean(ys);
    let Sxx = 0, Sxy = 0;
    for (let i = 0; i < n; i++){ const dx = xs[i] - xbar; Sxx += dx * dx; Sxy += dx * (ys[i] - ybar); }
    m = Sxy / Sxx; b = ybar - m * xbar;
  }
  const DELTA = 1e-7;
  for (let it = 0; it < 60; it++){                 // fixed cap → deterministic
    let Sw = 0, Swx = 0, Swy = 0, Swxx = 0, Swxy = 0;
    for (let i = 0; i < n; i++){
      const r = ys[i] - (m * xs[i] + b);
      const w = 1 / Math.max(Math.abs(r), DELTA);  // IRLS weight → L1 in the limit
      Sw += w; Swx += w * xs[i]; Swy += w * ys[i];
      Swxx += w * xs[i] * xs[i]; Swxy += w * xs[i] * ys[i];
    }
    // weighted normal equations: [Swxx Swx; Swx Sw] [m;b] = [Swxy; Swy]
    const det = Swxx * Sw - Swx * Swx;
    if (Math.abs(det) < 1e-300) break;
    m = (Swxy * Sw - Swx * Swy) / det;
    b = (Swxx * Swy - Swx * Swxy) / det;
  }
  let sad = 0;
  for (let i = 0; i < n; i++) sad += Math.abs(ys[i] - (m * xs[i] + b));
  return { ok: true, m, b, sad, n };
}

// ── SEEDED RNG + GAUSSIAN — reproducibility (page & Node twin make the SAME cloud).
// mulberry32; gauss via Box–Muller. The Scatter button and the Node twin both call
// THESE with a seed, so a cloud generated in the browser is reproduced bit-for-bit
// headless. This is the ONLY randomness in the bench (everything else is exact).
function makeRng(seed){
  let a = (seed >>> 0) || 1;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(rng){
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ── scatterCloud(seed, opts) — a fresh seeded cloud around a hidden true line. ──
// ~12 points: x on a grid across the WORLD, y = trueM·x + trueB + Gaussian noise,
// all clamped into the world box. Deterministic from the seed (same seed → same
// cloud, browser or Node). The "hidden true line" is just where the noise is hung;
// the FIT recovers its own line from the points, never peeks at trueM/trueB.
function scatterCloud(seed, opts){
  const o = opts || {};
  const n = o.n || 12;
  const W = o.world || 10;
  const margin = 1.2;
  const rng = makeRng(seed || 1);
  const trueM = (o.m !== undefined) ? o.m : (rng() * 1.4 - 0.7);
  const trueB = (o.b !== undefined) ? o.b : (W * 0.5 + (rng() * 2 - 1) * 1.5);
  const noise = (o.noise !== undefined) ? o.noise : 0.9;
  const pts = [];
  for (let i = 0; i < n; i++){
    const x = margin + (i + 0.5) * (W - 2 * margin) / n + (rng() - 0.5) * 0.3;
    let y = trueM * x + trueB + gauss(rng) * noise;
    y = Math.max(margin * 0.5, Math.min(W - margin * 0.5, y));
    pts.push({ x: round2(x), y: round2(y) });
  }
  return pts;
}
function round2(v){ return Math.round(v * 100) / 100; }

// ── THE SOLE AUTHORITATIVE ORACLE — runSelfTest(). ────────────────────────────
// Runs the four numbered claims. Returns { pass, total, lines:[{name,ok,detail}] }.
// The in-page pill and the Node twin both call THIS — one verdict, no second
// opinion. Every detail carries LIVE numbers, never a hardcoded echo.
function runSelfTest(){
  const lines = [];
  const T = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });

  // 1. CLOSED FORM == GRADIENT DESCENT to ≤1e-9 over many seeds (source-disjoint).
  {
    let worstM = 0, worstB = 0, firstBad = -1, tested = 0;
    for (let s = 1; s <= 60; s++){
      const pts = scatterCloud(s * 2654435761 >>> 0, { n: 14, noise: 1.0 });
      const cf = fitL2(pts);
      const gd = gdFit(pts, { maxIters: 8000, lr: 0.5 });
      tested++;
      const dM = Math.abs(cf.m - gd.m), dB = Math.abs(cf.b - gd.b);
      if (dM > worstM) worstM = dM;
      if (dB > worstB) worstB = dB;
      if ((dM > 1e-9 || dB > 1e-9) && firstBad < 0) firstBad = s;
    }
    const ok = worstM <= 1e-9 && worstB <= 1e-9;
    T('CLAIM 1 — closed form == gradient descent (≤1e-9, source-disjoint): the normal equations and a from-scratch GD that share no fit code land on the SAME (m,b)',
      ok, ok ? `${tested} seeds · worst Δm=${worstM.toExponential(2)} Δb=${worstB.toExponential(2)} ≤ 1e-9` :
        `worst Δm=${worstM.toExponential(2)} Δb=${worstB.toExponential(2)} (first @seed ${firstBad})`);
  }

  // 1b. ANTI-CIRCULARITY — fitL2 and gdFit name no shared FIT helper (only atoms).
  {
    const f = fitL2.toString(), g = gdFit.toString();
    const fOk = !f.includes('gdFit') && !f.includes('.trace');
    const gOk = !g.includes('fitL2') && !g.includes('normal') && !g.includes('Sxy');
    const atoms = f.includes('mean(') && g.includes('mean(');
    const ok = fOk && gOk && atoms;
    T('CLAIM 1 (anti-circularity) — fitL2 names no GD machinery and gdFit names no closed-form solve; they share only the sum/mean atoms (the agreement is a theorem, not a copy)',
      ok, ok ? 'fitL2 ⟂ gdFit at the source level; both reference only the primitive atoms' :
        `fitClean=${fOk} gdClean=${gOk} bothUseAtoms=${atoms}`);
  }

  // 2. THE ANALYTIC Σr² IS THE STRICT FLOOR — every perturbation scores worse.
  {
    let beaten = 0, worstMargin = Infinity, firstBad = -1, tested = 0;
    for (let s = 1; s <= 40; s++){
      const pts = scatterCloud(s * 40503 >>> 0, { n: 12, noise: 1.1 });
      const cf = fitL2(pts);
      const jury = perturbAllWorse(pts, cf, s * 7 + 1, 400, 0.3);
      tested++;
      if (!jury.ok) beaten += jury.beaten;
      if (jury.worst < worstMargin) worstMargin = jury.worst;
      if (!jury.ok && firstBad < 0) firstBad = s;
    }
    const ok = beaten === 0 && worstMargin >= 0;
    T('CLAIM 2 — the analytic Σr² is the STRICT floor: across 40 seeds × 400 random ±ε nudges of (m,b), NOT ONE perturbation beats the closed-form line',
      ok, ok ? `${tested} seeds × 400 nudges · 0 beat the fit · smallest worse-margin ${worstMargin.toExponential(2)} ≥ 0` :
        `${beaten} nudge(s) beat the fit (first @seed ${firstBad})`);
  }

  // 3. THE R² TRIPLE IDENTITY — 1−SS_res/SS_tot == r² (Pearson²) to ~1e-12, AND ==1 on collinear.
  {
    let worst = 0, firstBad = -1, tested = 0;
    for (let s = 1; s <= 60; s++){
      const pts = scatterCloud(s * 22695477 >>> 0, { n: 13, noise: 1.0 });
      const cf = fitL2(pts);
      const d = Math.abs(cf.r2 - cf.r * cf.r);     // route A (SS) vs route B (Pearson²)
      tested++;
      if (d > worst) worst = d;
      if (d > 1e-12 && firstBad < 0) firstBad = s;
    }
    // collinear: y = 2x + 1 exactly → R² must be 1.0 EXACTLY.
    const coll = [];
    for (let i = 0; i < 8; i++) coll.push({ x: i + 1, y: 2 * (i + 1) + 1 });
    const cc = fitL2(coll);
    const collOk = cc.ok && Math.abs(cc.r2 - 1) < 1e-12 && Math.abs(cc.r * cc.r - 1) < 1e-12 && cc.sse < 1e-18;
    const ok = worst <= 1e-12 && collOk;
    T('CLAIM 3 — the R² triple identity: 1−SS_res/SS_tot == r² (Pearson)² to ~1e-12 over 60 seeds (two independent routes), AND == 1.0 EXACTLY on collinear points',
      ok, ok ? `${tested} seeds · worst |ΔR²|=${worst.toExponential(2)} ≤ 1e-12 · collinear R²=${cc.r2.toFixed(15)} (Σr²=${cc.sse.toExponential(1)})` :
        `worst |ΔR²|=${worst.toExponential(2)} collinearOK=${collOk}`);
  }

  // 4. THE L1 TEETH — L1 ≠ L2 on a cloud, AND L2 lurches at an outlier while L1 holds.
  {
    // a non-trivial noisy cloud: L1 and L2 must give a DIFFERENT best.
    const cloud = scatterCloud(1234567, { n: 12, noise: 1.4 });
    const l2 = fitL2(cloud), l1 = fitL1(cloud);
    const differ = Math.abs(l2.m - l1.m) > 1e-3 || Math.abs(l2.b - l1.b) > 1e-3;
    // the outlier contrast: take a tame near-collinear cloud, then yank ONE
    // HIGH-LEVERAGE point (the far-right edge — leverage grows with |x−x̄|) far off
    // the line and measure each slope's MOVE. L2 (squared) lurches toward it; the
    // robust L1 barely twitches. A point near the centroid wouldn't show it — the
    // lesson lives at the edge, so the test drags the LAST (rightmost) point.
    const tame = scatterCloud(20260614, { n: 12, noise: 0.35, m: 0.5, b: 5 });
    const l2a = fitL2(tame), l1a = fitL1(tame);
    const last = tame.length - 1;
    const dragged = tame.map((p, i) => i === last ? { x: p.x, y: -6 } : p);  // yank the edge point far DOWN
    const l2b = fitL2(dragged), l1b = fitL1(dragged);
    const l2move = Math.abs(l2b.m - l2a.m);
    const l1move = Math.abs(l1b.m - l1a.m);
    // squared loss is NOT robust: L2 must move strictly, and far more than L1.
    const robust = l2move > l1move * 3 && l2move > 0.1;
    // the NEGATIVE CONTROL (the teeth must bite where expected AND not where not):
    // on a perfectly collinear cloud, L1 and L2 must AGREE (both hit the exact line).
    const coll = [];
    for (let i = 0; i < 8; i++) coll.push({ x: i + 1, y: 1.3 * (i + 1) - 0.7 });
    const cl2 = fitL2(coll), cl1 = fitL1(coll);
    const agreeOnLine = Math.abs(cl2.m - cl1.m) < 1e-3 && Math.abs(cl2.b - cl1.b) < 1e-2;
    const ok = differ && robust && agreeOnLine;
    T('CLAIM 4 — the L1 teeth (control + robustness): L1 ≠ L2 on a noisy cloud, an outlier moves L2 ≫ L1 (squared loss is unique but NOT robust), AND L1 == L2 on a collinear cloud',
      ok, ok ? `Δslope(L2,L1)=${Math.abs(l2.m - l1.m).toFixed(3)}≠0 · outlier moved L2 ${l2move.toFixed(3)} vs L1 ${l1move.toFixed(3)} · collinear: L1==L2 ✓` :
        `differ=${differ} robust=${robust}(L2 ${l2move.toFixed(3)}/L1 ${l1move.toFixed(3)}) agreeOnLine=${agreeOnLine}`);
  }

  const pass = lines.filter(l => l.ok).length;
  return { pass, total: lines.length, lines };
}
// ===== PLUMBLINE CORE END =====

export {
  sum, mean, distinctXCount, sse, fitL2, gdFit, perturbAllWorse, fitL1,
  makeRng, gauss, scatterCloud, round2, runSelfTest,
};
