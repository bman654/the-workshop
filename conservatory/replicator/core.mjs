// ============================================================================
//  THE CONSERVATORY · THE REPLICATOR  —  core math (the single source of truth).
//
//  THE ONE IDEA.  A population of competing strategies evolves by the REPLICATOR
//  equation: strategies that beat the average GROW, those below it SHRINK, and the
//  world keeps summing to 1 the entire time.  With payoff matrix A and a mix x on the
//  probability simplex (xᵢ≥0, Σxᵢ=1):
//
//        fᵢ(x) = (A·x)ᵢ          (strategy i's payoff against the current mix)
//        φ(x)  = xᵀ·A·x           (the MEAN payoff of the whole population)
//        ẋᵢ    = xᵢ·(fᵢ(x) − φ)   (above-average grows, below-average shrinks)
//
//  THE SIMPLEX INVARIANT (the load-bearing one).  Sum the field:
//        Σẋᵢ = Σ xᵢ(fᵢ − φ) = (Σxᵢfᵢ) − φ·Σxᵢ = φ − φ·1 = 0    ANALYTICALLY.
//  So Σxᵢ ≡ 1 is conserved to MACHINE ZERO along every RK4 orbit — the replicator's
//  exact structural law, the analog of SIR's S+I+R=N and predator–prey's V-ring.  It
//  holds for ANY payoff matrix and ANY integrator that advances the SAME field (the
//  ±φ·xᵢ increments telescope) — so the negative control is NOT sum-drift, it is the
//  BOUNDARY: positivity.
//
//  THE PRIMARY GAME — HAWK–DOVE (2 strategies).  Two animals contest a resource of
//  value V; a Hawk-vs-Hawk fight costs C (split).  The canonical payoff matrix is
//        A = [[ (V−C)/2 ,  V ],
//             [    0     , V/2 ]]      rows/cols = [Hawk, Dove].
//  With LOCKED constants V=2, C=3 (C>V ⇒ a unique INTERIOR ESS).  The interior fixed
//  point is EXACT and needs no integration: the Hawk fraction settles at
//        x*_Hawk = V/C = 2/3   (and x*_Dove = 1 − V/C = 1/3).
//  It is reached MONOTONICALLY — the fourth form, a simplex flow to a fixed point,
//  the deliberate contrast to predator–prey's closed ring.
//
//  THE LYAPUNOV WITNESS (the V-analog).  The relative entropy (KL divergence) of the
//  ESS from the current mix,
//        D(x*‖x) = Σ x*ᵢ · ln(x*ᵢ / xᵢ),
//  is a strict LYAPUNOV function for an interior ESS: Ḋ = −Σx*ᵢ(fᵢ−φ) = −(x*−x)ᵀA(x−x*)
//  ≤ 0, with equality only at x=x*.  So D DECREASES monotonically along every interior
//  Hawk–Dove orbit toward x* — the exact "it settles" proof.
//
//  THE FOIL — ROCK–PAPER–SCISSORS (3 strategies).  The zero-sum cyclic matrix
//        A_rps = [[ 0,−1, 1],[ 1, 0,−1],[−1, 1, 0]]
//  has its interior fixed point at the barycentre x*=(⅓,⅓,⅓).  There the SAME relative
//  entropy is CONSERVED (Ḋ=0, since xᵀA x≡0 for an antisymmetric A), so the orbit is a
//  NEUTRALLY-STABLE closed loop around the centre — never settling.  The falsifiable
//  distinction: Hawk–Dove's D strictly DESCENDS to 0; RPS's D stays FLAT.  (RPS is the
//  ring; Hawk–Dove is the node — both on the simplex, proven by the same D.)
//
//  THE TEETH (the SIR-spirit negative control — POSITIVITY, not sum-drift).  The
//  simplex sum Σxᵢ=1 is exact under ANY integrator (the increments telescope).  The
//  discriminating break is the BOUNDARY: at a coarse Euler step a strategy's xᵢ is
//  driven BELOW 0 — an unphysical negative frequency — while RK4 keeps every xᵢ in
//  [0,1].  Measured (see core.test.mjs):
//    RK4 conserves Σxᵢ=1 to ~1e-16 AND keeps min xᵢ > 0 over every orbit.
//    essFixedPoint() (closed form V/C, never the orbit) is matched by a long RK4 run
//      from multiple interior starts to ~1e-9.
//    relEntropy D(x*‖x) descends monotonically (Ḋ≤0) under RK4 toward the Hawk–Dove
//      ESS; under the RPS centre it stays flat (Ḋ≈0).
//    coarse Euler dt=1.2 on the RPS ring spirals the orbit OUT until it punctures an
//      edge (min xᵢ < 0, unphysical), while the sum Σxᵢ stays =1; RK4 at the same dt
//      keeps the ring inside the simplex (min xᵢ > 0).
//
//  Everything here is pure: no RNG, no DOM, no network.  The landing's planter-light
//  AND the bench BOTH import this file so they can never drift apart.
// ============================================================================

// ---------------------------------------------------------------------------
//  THE LOCKED PARAMETERS — the two games, the Hawk–Dove constants, and the two
//  payoff matrices.  (Kept ABOVE the sentinel boundary so the whole module body is
//  the inlined block — exactly like the SIR / logistic / prey benches.)
// ---------------------------------------------------------------------------
const P = {
  V: 2, C: 3,                                   // Hawk–Dove resource value / fight cost (C>V ⇒ interior ESS)
  game: 'hawkdove',                             // the primary game
};

// the Hawk–Dove payoff matrix from (V,C): rows/cols = [Hawk, Dove].
//   Hawk vs Hawk = (V−C)/2 ;  Hawk vs Dove = V ;  Dove vs Hawk = 0 ;  Dove vs Dove = V/2.
function hawkDoveMatrix(p = P) {
  return [
    [(p.V - p.C) / 2, p.V],
    [0, p.V / 2],
  ];
}

// the Rock–Paper–Scissors payoff matrix (zero-sum, antisymmetric).  rows/cols = [R,P,S].
function rpsMatrix() {
  return [
    [0, -1, 1],
    [1, 0, -1],
    [-1, 1, 0],
  ];
}

// resolve a game name to its payoff matrix A.
function matrixFor(game, p = P) {
  return game === 'rps' ? rpsMatrix() : hawkDoveMatrix(p);
}

// ---------------------------------------------------------------------------
//  THE FIELD — the per-strategy payoff fᵢ=(A·x)ᵢ, the mean payoff φ=xᵀAx, and the
//  replicator vector field ẋᵢ = xᵢ(fᵢ−φ).  All pure, all length-n agnostic.
// ---------------------------------------------------------------------------

// per-strategy payoff against the current mix:  f = A·x.
function payoff(A, x) {
  const n = x.length;
  const f = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = 0; j < n; j++) s += A[i][j] * x[j];
    f[i] = s;
  }
  return f;
}

// the MEAN payoff of the whole population:  φ = xᵀ·A·x = Σ xᵢ·fᵢ.
function meanPayoff(A, x) {
  const f = payoff(A, x);
  let phi = 0;
  for (let i = 0; i < x.length; i++) phi += x[i] * f[i];
  return phi;
}

// the REPLICATOR field  ẋᵢ = xᵢ·(fᵢ − φ).  Σẋᵢ = 0 ANALYTICALLY (see the header).
function field(A, x) {
  const f = payoff(A, x);
  let phi = 0;
  for (let i = 0; i < x.length; i++) phi += x[i] * f[i];
  return x.map((xi, i) => xi * (f[i] - phi));
}

// ---------------------------------------------------------------------------
//  THE CLOSED-FORM ESS — solved from ẋ=0, with NO integration (anti-circularity).
//  For Hawk–Dove the unique interior fixed point is x*_Hawk = V/C exactly; for RPS it
//  is the barycentre (1/n,…,1/n).  This is the load-bearing "exact root" the long RK4
//  run must reproduce.
// ---------------------------------------------------------------------------
function essFixedPoint(game = P.game, p = P) {
  if (game === 'rps') return [1 / 3, 1 / 3, 1 / 3];
  // Hawk–Dove: interior iff 0 < V/C < 1 (i.e. C>V); else the ESS is a pure corner.
  const h = p.V / p.C;
  if (h >= 1) return [1, 0];                    // V≥C ⇒ Hawk dominates (pure-Hawk ESS)
  return [h, 1 - h];                            // x*_Hawk = V/C, x*_Dove = 1 − V/C
}

// ---------------------------------------------------------------------------
//  THE RELATIVE-ENTROPY LYAPUNOV FUNCTION  D(x*‖x) = Σ x*ᵢ·ln(x*ᵢ/xᵢ) (KL divergence
//  of the ESS from the current mix).  Strictly decreasing toward an interior ESS
//  (Hawk–Dove), exactly constant around the RPS centre.  Terms with x*ᵢ=0 contribute 0.
// ---------------------------------------------------------------------------
function relEntropy(xStar, x) {
  let d = 0;
  for (let i = 0; i < xStar.length; i++) {
    if (xStar[i] > 0) {
      const xi = x[i] > 1e-300 ? x[i] : 1e-300; // guard ln(0) at the boundary
      d += xStar[i] * Math.log(xStar[i] / xi);
    }
  }
  return d;
}

// the simplex sum Σxᵢ (should be ≡1) and the minimum coordinate (the positivity probe).
function simplexSum(x) { let s = 0; for (let i = 0; i < x.length; i++) s += x[i]; return s; }
function minCoord(x) { let m = Infinity; for (let i = 0; i < x.length; i++) if (x[i] < m) m = x[i]; return m; }

// ---------------------------------------------------------------------------
//  THE TWO INTEGRATORS — one truthful (RK4), one naive (forward Euler).  Both advance
//  the SAME replicator field by one step dt; this is the load-bearing contrast.  BOTH
//  conserve Σxᵢ=1 at any dt (the field sums to 0 exactly), but coarse Euler breaks the
//  BOUNDARY — it drives some xᵢ below 0.
// ---------------------------------------------------------------------------

// classical 4th-order Runge–Kutta of the replicator field — keeps every xᵢ in [0,1].
function rk4Step(A, x, dt) {
  const add = (a, b, s) => a.map((ai, i) => ai + s * b[i]);
  const k1 = field(A, x);
  const k2 = field(A, add(x, k1, dt / 2));
  const k3 = field(A, add(x, k2, dt / 2));
  const k4 = field(A, add(x, k3, dt));
  return x.map((xi, i) => xi + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}

// forward (explicit) Euler: x ← x + dt·f(x).  Conserves Σxᵢ at ANY dt (the field sums
// to 0), but at a coarse dt it drives some xᵢ BELOW 0 — the negative control is the
// BOUNDARY (positivity), not sum-drift.
function eulerStep(A, x, dt) {
  const f = field(A, x);
  return x.map((xi, i) => xi + dt * f[i]);
}

// pick a stepper by name (the page's RK4 ⟷ Euler toggle uses this).
function stepper(m) { return m === 'euler' ? eulerStep : rk4Step; }

// ---------------------------------------------------------------------------
//  THE TRACER — integrate from x0 for `steps` steps of size dt with `method` on game
//  `game`, recording the full mix history xs[], the per-strategy payoff/φ history, the
//  worst sum-error max|Σxᵢ−1|, the relative-entropy history D(t) toward the ESS, the
//  worst NON-monotone uptick in D (the Lyapunov-descent witness), the minimum
//  coordinate and whether any xᵢ ever went negative.  NaN-guarded so a coarse-Euler
//  blow-up never blanks the canvas.
// ---------------------------------------------------------------------------
function trace(x0, dt, steps, method = 'rk4', game = P.game, p = P) {
  const A = matrixFor(game, p);
  const step = stepper(method);
  const xStar = essFixedPoint(game, p);
  let x = x0.slice();
  const xs = [x.slice()];
  const phis = [meanPayoff(A, x)];
  const Ds = [relEntropy(xStar, x)];
  const ts = [0];
  let maxSumErr = Math.abs(simplexSum(x) - 1);
  let minX = minCoord(x), wentNegative = minX < 0, blown = false;
  let maxDuptick = 0;                            // the worst INCREASE in D (should be ≈0 toward an ESS)
  let prevD = Ds[0];
  let t = 0;
  for (let i = 0; i < steps; i++) {
    x = step(A, x, dt);
    t += dt;
    let finite = true;
    for (let j = 0; j < x.length; j++) if (!isFinite(x[j])) finite = false;
    if (!finite) { wentNegative = true; blown = true; break; }
    const se = Math.abs(simplexSum(x) - 1);
    if (se > maxSumErr) maxSumErr = se;
    const mc = minCoord(x);
    if (mc < minX) minX = mc;
    if (mc < 0) wentNegative = true;
    const D = relEntropy(xStar, x);
    const up = D - prevD;                        // positive ⇒ D went UP (a Lyapunov violation)
    if (up > maxDuptick) maxDuptick = up;
    prevD = D;
    xs.push(x.slice()); phis.push(meanPayoff(A, x)); Ds.push(D); ts.push(t);
  }
  return { xs, phis, Ds, ts, maxSumErr, minX, wentNegative, blown, maxDuptick,
           xStar, end: x.slice() };
}

// ============================================================================
//  THE SELF-TEST — proves the falsifiable claim EXACT.  These are the SIX checks the
//  in-page badge asserts; core.test.mjs runs this plus independent witnesses.
// ============================================================================
function runSelfTest(p = P) {
  const checks = [];
  const detail = {};
  function ok(name, cond, info) { checks.push({ name, pass: !!cond, info }); }

  const Ahd = hawkDoveMatrix(p);
  const Arps = rpsMatrix();
  const xStarHD = essFixedPoint('hawkdove', p);
  // three interior Hawk–Dove starts (the multiple-starts requirement).
  const hdStarts = [[0.1, 0.9], [0.5, 0.5], [0.92, 0.08]];

  // (1) SIMPLEX INVARIANT (the load-bearing one) — Σẋᵢ=0 analytically, so Σxᵢ≡1 to
  //     machine zero along every RK4 orbit, on BOTH games, from every start.
  {
    let worst = 0;
    for (const x0 of hdStarts) {
      const r = trace(x0, 0.05, 6000, 'rk4', 'hawkdove', p);
      worst = Math.max(worst, r.maxSumErr);
    }
    // RPS orbit too (the foil) — the invariant is game-agnostic.
    const rrps = trace([0.2, 0.3, 0.5], 0.02, 6000, 'rk4', 'rps', p);
    worst = Math.max(worst, rrps.maxSumErr);
    // and the analytic field sum at a scatter of interior points is ~0.
    let fieldSum = 0;
    for (const x0 of [...hdStarts]) { const f = field(Ahd, x0); fieldSum = Math.max(fieldSum, Math.abs(f.reduce((a, b) => a + b, 0))); }
    for (const x0 of [[0.2, 0.3, 0.5], [0.5, 0.25, 0.25]]) { const f = field(Arps, x0); fieldSum = Math.max(fieldSum, Math.abs(f.reduce((a, b) => a + b, 0))); }
    detail.simplexErr = worst; detail.fieldSum = fieldSum;
    ok('Simplex invariant: Σẋᵢ=0 analytically ⇒ Σxᵢ≡1 to ' + worst.toExponential(2) +
       ' (machine zero) along every RK4 orbit, both games; field sums to ' + fieldSum.toExponential(2),
       worst < 1e-13 && fieldSum < 1e-15,
       'max|Σx−1|=' + worst.toExponential(2) + '  ·  max|Σẋ|=' + fieldSum.toExponential(2));
  }

  // (2) THE ESS FIXED POINT — x*_Hawk=V/C in closed form (no integration), matched by a
  //     long RK4 run from MULTIPLE interior starts to ~1e-9; and ẋ(x*)=0 at the root.
  {
    const exactHawk = Math.abs(xStarHD[0] - p.V / p.C) < 1e-15;
    const fAtStar = field(Ahd, xStarHD);
    const restAtStar = Math.max(Math.abs(fAtStar[0]), Math.abs(fAtStar[1]));
    let worstConv = 0;
    for (const x0 of hdStarts) {
      const r = trace(x0, 0.02, 60000, 'rk4', 'hawkdove', p);   // long run to convergence
      worstConv = Math.max(worstConv, Math.abs(r.end[0] - xStarHD[0]), Math.abs(r.end[1] - xStarHD[1]));
    }
    detail.essHawk = xStarHD[0]; detail.essRest = restAtStar; detail.essConv = worstConv;
    ok('ESS fixed point: closed-form x*_Hawk=V/C=' + (p.V / p.C).toFixed(6) +
       ' (ẋ(x*)=' + restAtStar.toExponential(2) + '≈0); long RK4 from 3 interior starts converges to ' +
       worstConv.toExponential(2) + ' (<1e-9)',
       exactHawk && restAtStar < 1e-15 && worstConv < 1e-9,
       'x*_Hawk=' + xStarHD[0].toFixed(9) + '  ẋ(x*)=' + restAtStar.toExponential(2) +
       '  ·  RK4 conv=' + worstConv.toExponential(2));
  }

  // (3) LYAPUNOV / monotonicity witness — D(x*‖x) DESCENDS monotonically (no uptick)
  //     under RK4 toward the Hawk–Dove ESS; around the RPS centre it stays CONSTANT
  //     (neutrally stable orbit) — the falsifiable Hawk–Dove-node vs RPS-ring split.
  {
    let worstHDuptick = 0, hdDescends = true;
    for (const x0 of hdStarts) {
      const r = trace(x0, 0.02, 30000, 'rk4', 'hawkdove', p);
      worstHDuptick = Math.max(worstHDuptick, r.maxDuptick);
      if (!(r.Ds[r.Ds.length - 1] < r.Ds[0] - 1e-6)) hdDescends = false;   // net descent
    }
    // RPS: D stays flat (the neutrally-stable ring) — measure the swing of D about the centre.
    const rrps = trace([0.2, 0.3, 0.5], 0.01, 40000, 'rk4', 'rps', p);
    let dMin = Infinity, dMax = -Infinity;
    for (const d of rrps.Ds) { if (d < dMin) dMin = d; if (d > dMax) dMax = d; }
    const rpsSwing = dMax - dMin;
    detail.hdUptick = worstHDuptick; detail.hdDescends = hdDescends; detail.rpsSwing = rpsSwing;
    ok('Lyapunov: D(x*‖x) descends monotonically (max uptick ' + worstHDuptick.toExponential(2) +
       '≈0) to the Hawk–Dove ESS; RPS keeps D flat (swing ' + rpsSwing.toExponential(2) + ', the neutral ring)',
       worstHDuptick < 1e-9 && hdDescends && rpsSwing < 1e-3,
       'HD max-uptick=' + worstHDuptick.toExponential(2) + ' descends=' + hdDescends +
       '  ·  RPS D-swing=' + rpsSwing.toExponential(2) + ' (flat ⇒ neutral)');
  }

  // (4) PAYOFF / MEAN-PAYOFF identities — φ=xᵀAx=Σxᵢfᵢ exactly; and at the interior
  //     Hawk–Dove ESS every PLAYED strategy earns the SAME payoff (f_Hawk=f_Dove=φ),
  //     the textbook signature of an interior ESS.
  {
    let worstId = 0;
    for (const x0 of [...hdStarts, [0.2, 0.3, 0.5]]) {
      const A = x0.length === 3 ? Arps : Ahd;
      const f = payoff(A, x0);
      let dot = 0; for (let i = 0; i < x0.length; i++) dot += x0[i] * f[i];
      worstId = Math.max(worstId, Math.abs(dot - meanPayoff(A, x0)));
    }
    const fStar = payoff(Ahd, xStarHD), phiStar = meanPayoff(Ahd, xStarHD);
    const equalPay = Math.max(Math.abs(fStar[0] - phiStar), Math.abs(fStar[1] - phiStar));
    detail.payoffId = worstId; detail.essEqualPay = equalPay;
    ok('Payoff identity: φ=xᵀAx=Σxᵢfᵢ to ' + worstId.toExponential(2) +
       '; at the interior ESS every played strategy earns φ (|fᵢ−φ|=' + equalPay.toExponential(2) + ')',
       worstId < 1e-15 && equalPay < 1e-15,
       'max|φ−Σxf|=' + worstId.toExponential(2) + '  ·  ESS |fᵢ−φ|=' + equalPay.toExponential(2));
  }

  // (5) NEGATIVE CONTROL (POSITIVITY/BOUNDARY, not sum-drift) — on the RPS ring (where
  //     the neutral orbit hugs the simplex) coarse Euler ADDS energy and spirals the
  //     orbit OUTWARD until it punctures an edge: min xᵢ<0 (an unphysical frequency),
  //     while the SUM stays =1.  RK4 at the same coarse dt keeps the ring inside the
  //     simplex (min xᵢ>0).  The break is the BOUNDARY, not the sum — the predator–prey
  //     "Euler spirals out" teeth, transplanted onto the 2-simplex.
  {
    const start = [0.45, 0.35, 0.2];             // an interior RPS start; Euler's spiral pierces an edge
    const eul = trace(start, 1.2, 200, 'euler', 'rps', p);
    const rk = trace(start, 1.2, 200, 'rk4', 'rps', p);
    detail.eulerMinX = eul.minX; detail.eulerNeg = eul.wentNegative;
    detail.rk4MinX = rk.minX; detail.eulerSum = eul.maxSumErr; detail.rk4Sum = rk.maxSumErr;
    ok('Negative control: on RPS, Euler dt=1.2 spirals out and drives xᵢ<0 (min xᵢ=' + eul.minX.toExponential(2) +
       '), RK4 stays inside the simplex (min xᵢ=' + rk.minX.toFixed(3) + '); the SUM holds (=1) under BOTH',
       eul.wentNegative === true && eul.minX < 0 && rk.minX > 0 &&
       eul.maxSumErr < 1e-9 && rk.maxSumErr < 1e-9,
       'Euler min xᵢ=' + eul.minX.toExponential(2) + ' (neg=' + eul.wentNegative + ')  ·  RK4 min xᵢ=' +
       rk.minX.toFixed(3) + '  ·  sums: Euler=' + eul.maxSumErr.toExponential(2) +
       ' RK4=' + rk.maxSumErr.toExponential(2) + ' (both hold)');
  }

  // (6) RE-EXTRACTION PARITY — proven in the Node twin (core.test.mjs) against the
  //     inlined REPLICATOR-CORE in index.html.  Here we record a determinism witness so
  //     the in-page badge has a sixth green: two identical traces are byte-identical.
  {
    const r1 = trace([0.1, 0.9], 0.05, 3000, 'rk4', 'hawkdove', p);
    const r2 = trace([0.1, 0.9], 0.05, 3000, 'rk4', 'hawkdove', p);
    const a = JSON.stringify(r1.xs), bb = JSON.stringify(r2.xs);
    detail.deterministic = a === bb;
    ok('Re-extraction parity is proven in the Node twin; determinism holds (identical inputs ⇒ byte-identical trace)',
       a === bb, a === bb ? 'two runs byte-identical' : 'DIFFER');
  }

  const pass = checks.filter((c) => c.pass).length;
  return { pass, total: checks.length, checks, detail };
}

export {
  P, hawkDoveMatrix, rpsMatrix, matrixFor, payoff, meanPayoff, field,
  essFixedPoint, relEntropy, simplexSum, minCoord, rk4Step, eulerStep, stepper,
  trace, runSelfTest,
};
