// ============================================================================
//  THE CONSERVATORY · LOGISTIC GROWTH  —  core math (the single source of truth).
//
//  THE ONE IDEA.  A single colony grows under glass against a CARRYING CAPACITY K.
//  Births outrun deaths while there is room; crowding bends the curve over; the
//  colony settles — exactly, forever — at K.  The scalar logistic field is
//
//        N' = r·N·(1 − N/K)              (grow fast when small, stall at K)
//
//  with the estate's locked parameters  r = 0.6,  K = 100.  (Clean landmarks:
//  the growth-rate peak r·K/4 = 15, the stability slope f'(K) = −r = −0.6,
//  f'(0) = +r = +0.6.)
//
//  THE CLOSED FORM is EXACT — the famous S-curve (sigmoid):
//
//        N(t) = K / (1 + ((K − N₀)/N₀)·e^(−r t))     →   K   as t → ∞.
//
//  This is the foil to the predator-prey CENTER next door: there the orbit
//  RETURNS forever on a closed ring and V stays FLAT; here the colony APPROACHES
//  and STAYS, and the Lyapunov V = (N − K)² must FALL to 0.  Flat vs. falling —
//  that contrast IS the difference between a center and a stable node.
//
//  THE STABILITY is read off the slope of the field at each rest point:
//    f'(K) = −r < 0   ⇒   N* = K is STABLE  (perturb it, it returns).
//    f'(0) = +r > 0   ⇒   N  = 0 is UNSTABLE (the empty glass; any spark grows).
//  The eigenvalues ARE these slopes (a 1-D system): byte-exact ±r.
//
//  THE TEETH.  Classical RK4 hugs the closed form to ~machine precision and never
//  overshoots K.  The naive FORWARD-EULER step IS the logistic MAP in a = dt·r —
//  and at coarse dt (a ≥ 1.6) it PROVABLY overshoots K and rings around it, the
//  named logistic-map bifurcation.  Conservation-of-monotonicity vs. overshoot is
//  the falsifiable claim; the negative control (the leaky step) MUST fail.
//  Measured (see core.test.mjs):
//    RK4 dt=0.01 over t∈[0,40] → max|N − N_exact| = 2.98e-10   (and 4th-order)
//    leaky a=dt·r=1.6           → maxN = 100.84, 64 K-crossings  (overshoots, rings)
//
//  THE INFLECTION (the bend of the S) is EXACT at N = K/2, where growth peaks at
//  r·K/4 = 15 and the curve flips concave; it happens at t* = ln((K−N₀)/N₀)/r —
//  but ONLY when the colony STARTS below the bend (N₀ < K/2); start past it and
//  there is no inflection (the mark must not lie — inflection() returns null).
//
//  Everything here is pure: no RNG, no DOM, no network.  The landing's planter-
//  light AND the bench BOTH import this file so they can never drift apart.
// ============================================================================

// ---------------------------------------------------------------------------
//  THE LOCKED PARAMETERS + the field, its slope, the closed form, the fixed
//  points, the Lyapunov function.  (Kept ABOVE the sentinel boundary so the
//  whole module body is the inlined block — exactly like the prey bench.)
// ---------------------------------------------------------------------------
const P = { r: 0.6, K: 100 };

// the scalar logistic field  N ↦ N' = r·N·(1 − N/K).
function field(N, p = P) {
  return p.r * N * (1 - N / p.K);
}

// the slope of the field — the STABILITY eigenvalue at any N.
//   f'(K) = −r (stable node) ;  f'(0) = +r (unstable) ;  f'(K/2) = 0 (growth peak).
function fPrime(N, p = P) {
  return p.r * (1 - 2 * N / p.K);
}

// the EXACT closed-form solution N(t) through N₀ — the sigmoid the bench draws.
function closed(t, N0, p = P) {
  return p.K / (1 + ((p.K - N0) / N0) * Math.exp(-p.r * t));
}

// the two fixed points with their stability classification (eigenvalue = f' there).
function fixedPoints(p = P) {
  return [{ N: 0, stable: false, eig: p.r }, { N: p.K, stable: true, eig: -p.r }];
}

// the inflection of the S-curve — CONDITIONAL: only when the colony starts BELOW
// the bend (N₀ < K/2).  Returns the time t*, the height K/2, and the peak slope
// r·K/4; returns null when N₀ ≥ K/2 (the curve is already concave — no bend).
function inflection(N0, p = P) {
  return N0 < p.K / 2 ? { t: Math.log((p.K - N0) / N0) / p.r, N: p.K / 2, slope: p.r * p.K / 4 } : null;
}

// the Lyapunov function  V = (N − K)²  — a bowl with its floor at the stable node.
function Vlyap(N, p = P) {
  return (N - p.K) ** 2;
}

// its time-derivative along the field:  V̇ = 2(N−K)·field = −(2r/K)·N·(N−K)² ≤ 0,
// zero ONLY at N = K (and the unstable N = 0).  V falls ⇒ N → K is the attractor.
function Vprime(N, p = P) {
  return -2 * p.r / p.K * N * (N - p.K) ** 2;
}

// ---------------------------------------------------------------------------
//  THE TWO INTEGRATORS — one truthful (RK4), one naive (the leaky/coarse step).
//  Both advance the SAME scalar field by one step dt; this is the load-bearing
//  contrast.  The leaky step IS the logistic MAP; a = dt·r is its bifurcation knob.
// ---------------------------------------------------------------------------

// classical 4th-order Runge–Kutta of the scalar field — hugs the closed form.
function rk4Step(N, dt, p = P) {
  const k1 = field(N, p);
  const k2 = field(N + (dt / 2) * k1, p);
  const k3 = field(N + (dt / 2) * k2, p);
  const k4 = field(N + dt * k3, p);
  return N + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
}

// forward (explicit) Euler: N ← N + dt·f(N).  This IS the logistic MAP; at coarse
// dt (a = dt·r ≥ 1.6) it OVERSHOOTS K and rings.  Cheap, naive, and the negative
// control.  (At small a ≤ 0.8 it is clean — that dt-dependence drives the UI.)
function leakyStep(N, dt, p = P) {
  return N + dt * field(N, p);
}

// pick a stepper by name (the page's RK4 ⟷ leaky toggle uses this).
function stepper(method) {
  return method === 'leaky' ? leakyStep : rk4Step;
}

// ---------------------------------------------------------------------------
//  THE TRACER — integrate from N₀ for `steps` steps of size dt with `method`,
//  recording N(t), the worst |N − N_exact| vs the closed form, whether the
//  Lyapunov V = (N−K)² falls monotonically, whether N ever overshoots K, and how
//  many times the trajectory crosses K.  The S-curve, the Lyapunov panel, and the
//  negative control all read off this.
// ---------------------------------------------------------------------------
function trace(N0, dt, steps, method = 'rk4', p = P) {
  let N = N0;
  const step = stepper(method);
  const ts = [0], Ns = [N0], errs = [0];
  let maxErr = 0;
  let V0 = Vlyap(N0, p), prevV = V0, vMonotoneDown = true;
  let overshoot = false, kCross = 0, prevSide = Math.sign(N0 - p.K);
  let t = 0;
  for (let i = 0; i < steps; i++) {
    N = step(N, dt, p);
    t += dt;
    const e = Math.abs(N - closed(t, N0, p));
    if (e > maxErr) maxErr = e;
    const v = Vlyap(N, p);
    // a step UP in V (beyond float jitter) means it is NOT monotone-down.
    if (v > prevV + 1e-9) vMonotoneDown = false;
    prevV = v;
    if (N > p.K + 1e-9) overshoot = true;
    const side = Math.sign(N - p.K);
    if (side !== 0 && prevSide !== 0 && side !== prevSide) kCross++;
    if (side !== 0) prevSide = side;
    ts.push(t); Ns.push(N); errs.push(e);
  }
  return { ts, Ns, errs, N0, V0, maxErr, vMonotoneDown, overshoot, kCross,
           endN: N, endV: Vlyap(N, p) };
}

// ============================================================================
//  THE SELF-TEST — proves the falsifiable claim EXACT.  These are the SIX checks
//  the in-page badge asserts; core.test.mjs runs this plus independent witnesses.
// ============================================================================
function runSelfTest(p = P) {
  const checks = [];
  const detail = {};
  function ok(name, cond, info) { checks.push({ name, pass: !!cond, info }); }

  const fp = fixedPoints(p);
  detail.fixedPoints = fp;

  // (1) STABILITY — f'(K) = −r < 0 ⇒ N* = K STABLE ; f'(0) = +r > 0 ⇒ N = 0
  //     UNSTABLE.  The eigenvalues ARE the field's slope (a 1-D system): ±r exact.
  {
    const eigK = fPrime(p.K, p), eig0 = fPrime(0, p);
    detail.eigK = eigK; detail.eig0 = eig0;
    const okStable = eigK === -p.r && fp[1].stable === true && fp[1].N === p.K;
    const okUnstable = eig0 === p.r && fp[0].stable === false && fp[0].N === 0;
    ok('Stability: f\'(K)=−r=' + eigK + '<0 ⇒ N*=K STABLE; f\'(0)=+r=' + eig0 + '>0 ⇒ N=0 UNSTABLE',
       okStable && okUnstable,
       'eig@K=' + eigK + '  eig@0=' + eig0 + '  (byte-exact ∓r)');
  }

  // (2) CLOSED-FORM ⟷ RK4 to ~machine precision, AND it is 4th-ORDER (dt→dt/4
  //     shrinks the error ≥10×) — proving the agreement is the method's ORDER,
  //     not luck.  HONEST bar: at dt=0.01 max|N_rk4 − N_exact| ≈ 3e-10 (< 1e-9).
  {
    const N0 = 5, T = 40;
    const measure = (dt) => {
      let N = N0, t = 0, m = 0;
      const steps = Math.round(T / dt);
      for (let i = 0; i < steps; i++) { N = rk4Step(N, dt, p); t += dt; m = Math.max(m, Math.abs(N - closed(t, N0, p))); }
      return m;
    };
    const eCoarse = measure(0.01), eFine = measure(0.0025);
    const ratio = eCoarse / Math.max(eFine, 1e-300);
    detail.rk4Err = eCoarse; detail.rk4FineErr = eFine; detail.orderRatio = ratio;
    ok('RK4 and the closed form are visually one line; error ' + eCoarse.toExponential(2) +
       ' at dt=0.01; and it\'s 4th-order (dt→dt/4 shrinks it ' + ratio.toFixed(0) + '×)',
       eCoarse < 1e-9 && ratio >= 10,
       'max|N_rk4−N_exact|=' + eCoarse.toExponential(2) + ' (<1e-9)  ·  /4 ratio ' +
       ratio.toFixed(0) + '× (4th order predicts ~256×)');
  }

  // (3) NEGATIVE CONTROL — the leaky step PROVABLY overshoots.  The naive step is
  //     the logistic MAP in a = dt·r: at a ≥ 1.6 it overshoots K (maxN > K, ≥1
  //     K-crossing); the true RK4 NEVER does.  The tainted control that MUST fail.
  {
    const a = 1.6, dt = a / p.r, N0 = 5, T = 60, steps = Math.round(T / dt);
    const leak = trace(N0, dt, steps, 'leaky', p);
    const rk4 = trace(N0, dt, steps, 'rk4', p);
    detail.leakyMaxN = Math.max(...leak.Ns);
    detail.leakyCross = leak.kCross;
    detail.rk4Overshoot = rk4.overshoot;
    detail.rk4Cross = rk4.kCross;
    ok('Negative control: leaky@a=1.6 PROVABLY overshoots K (maxN>K, ≥1 crossing); RK4 never does',
       leak.overshoot === true && leak.kCross >= 1 && rk4.overshoot === false,
       'leaky maxN=' + detail.leakyMaxN.toFixed(2) + ' crossings=' + leak.kCross +
       '  ·  rk4 overshoot=' + rk4.overshoot + ' crossings=' + rk4.kCross);
  }

  // (4) INFLECTION exact at N = K/2 with growth-rate r·K/4 — and CONDITIONAL: it is
  //     null when the colony starts past the bend (N₀ ≥ K/2).  The mark won't lie.
  {
    const peak = field(p.K / 2, p);           // = r·K/4 = 15
    const slopeAtPeak = fPrime(p.K / 2, p);   // = 0 (growth-rate extremum)
    const inf = inflection(5, p);
    const landed = closed(inf.t, 5, p);       // N(t*) must be exactly K/2
    const past = inflection(p.K / 2 + 10, p); // N₀ ≥ K/2 ⇒ null
    detail.peakGrowth = peak; detail.inflectT = inf.t; detail.inflectLanded = landed;
    detail.inflectPast = past;
    ok('Inflection: f(K/2)=' + peak + '=r·K/4, f\'(K/2)=0; t*=' + inf.t.toFixed(6) +
       ' lands N=K/2; and inflection(N₀≥K/2)=null',
       Math.abs(peak - p.r * p.K / 4) < 1e-12 && Math.abs(slopeAtPeak) < 1e-12 &&
       Math.abs(landed - p.K / 2) < 1e-9 && past === null,
       'f(K/2)=' + peak + '  t*=' + inf.t.toFixed(6) + '  N(t*)=' + landed.toFixed(9) +
       '  ·  past-bend=' + past);
  }

  // (5) MONOTONE APPROACH from BOTH sides (climb from below, descend from above)
  //     under RK4, AND the Lyapunov V = (N−K)² falls monotonically to 0 for many
  //     starts.  predator-prey's V stays FLAT on its ring; here V must FALL — that
  //     IS stability.  Also V̇(K/2) ≤ 0 and V̇(K) = 0.
  {
    const dt = 0.01, T = 60;
    const climb = trace(5, dt, Math.round(T / dt), 'rk4', p);
    const descend = trace(150, dt, Math.round(T / dt), 'rk4', p);
    const climbMono = monotoneApproach(5, dt, T, p);
    const descMono = monotoneApproach(150, dt, T, p);
    let allVDown = true;
    for (const N0 of [5, 40, 99, 150, 200]) {
      const r = trace(N0, dt, Math.round(T / dt), 'rk4', p);
      if (!r.vMonotoneDown) allVDown = false;
    }
    detail.climbMono = climbMono; detail.descMono = descMono; detail.allVDown = allVDown;
    detail.VprimeHalf = Vprime(p.K / 2, p); detail.VprimeK = Vprime(p.K, p);
    ok('Monotone approach from both sides (N₀=5 climbs, N₀=150 descends) & V=(N−K)² falls to 0 — V must FALL (vs prey\'s flat ring)',
       climbMono && descMono && allVDown && Vprime(p.K / 2, p) <= 0 && Vprime(p.K, p) === 0,
       'climb↑=' + climbMono + ' descend↓=' + descMono + ' V↓(all)=' + allVDown +
       '  ·  V̇(K/2)=' + Vprime(p.K / 2, p) + ' V̇(K)=' + Vprime(p.K, p));
  }

  // (6) DETERMINISM — same inputs ⇒ byte-identical trajectory across two runs.
  {
    const r1 = trace(5, 0.01, 2000, 'rk4', p);
    const r2 = trace(5, 0.01, 2000, 'rk4', p);
    const a = JSON.stringify([r1.Ns, r1.errs]);
    const bb = JSON.stringify([r2.Ns, r2.errs]);
    detail.deterministic = a === bb;
    ok('Deterministic — identical inputs ⇒ byte-identical trajectory',
       a === bb, a === bb ? 'two runs byte-identical' : 'DIFFER');
  }

  const pass = checks.filter((c) => c.pass).length;
  return { pass, total: checks.length, checks, detail };
}

// helper: does the true (RK4) solution approach K monotonically from N₀'s side?
function monotoneApproach(N0, dt, T, p = P) {
  let N = N0, prev = N0;
  const dir = N0 < p.K ? 1 : -1;       // below K climbs (+), above K descends (−)
  const steps = Math.round(T / dt);
  for (let i = 0; i < steps; i++) {
    N = rk4Step(N, dt, p);
    if (dir * (N - prev) < -1e-9) return false;
    prev = N;
  }
  return true;
}

export {
  P, field, fPrime, closed, fixedPoints, inflection, Vlyap, Vprime,
  rk4Step, leakyStep, stepper, trace, monotoneApproach, runSelfTest,
};
