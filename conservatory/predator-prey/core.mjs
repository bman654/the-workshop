// ============================================================================
//  THE CONSERVATORY · PREDATOR–PREY  —  core math (the single source of truth).
//
//  THE ONE IDEA.  Two populations breathe in and out of balance under the glass:
//  HARES x (prey) and LYNX y (predators), governed by the Lotka–Volterra field
//
//        x' =  a·x − b·x·y          (hares grow, lynx eat them)
//        y' = −c·y + d·x·y          (lynx starve, but feast where hares are thick)
//
//  with the estate's locked parameters  a=1.1, b=0.4, c=0.4, d=0.1.
//
//  The orbit is EXACT and CLOSED: there is a conserved quantity — a FIRST INTEGRAL,
//  the same idea the First Integral wing proves for the hanging chain and the
//  fastest slide — that is constant along every true trajectory:
//
//        V(x,y) = d·x − c·ln x + b·y − a·ln y   =   const   forever.
//
//  (The brief writes this δ·x − γ·ln x + β·y − α·ln y; the symbol map is
//   δ=d, γ=c, β=b, α=a.)  The level-sets of V are the closed loops in the
//  hares×lynx plane; a trajectory rides one ring round and round and RETURNS.
//
//  THE TEETH.  A structure-preserving integrator (RK4 at a tight step) keeps V
//  flat to ~machine precision and the loop closes.  A naive FORWARD-EULER step
//  does NOT — it injects energy every step, V climbs MONOTONICALLY, and the bead
//  spirals OUTWARD off its true ring.  Conservation vs. leak is the falsifiable
//  claim; the negative control (Euler) MUST fail.  Measured (see core.test.mjs):
//    RK4 dt=0.004 over one period → max|V−V₀| = 7.9e-12  (machine precision)
//    forward-Euler same dt        → max|V−V₀| = 3.1e-2   (and growing, outward)
//
//  THE FIXED POINT is a CENTER, not a focus: at (x*,y*)=(c/d, a/b)=(4, 2.75) both
//  derivatives vanish, the Jacobian's trace is 0 ⇒ eigenvalues are pure-imaginary
//  ±i·√(ac) ⇒ neither decay nor growth ⇒ orbits neither spiral in nor out.  The
//  LINEARIZED period there is T = 2π/√(ac) = 9.472 (exact only for SMALL loops; a
//  big boom-bust loop runs slower, so we only assert the formula near the centre).
//
//  Everything here is pure: no RNG, no DOM, no network.  The landing's orbit-light
//  AND the bench BOTH import this file so they can never drift apart.
// ============================================================================

// ---------------------------------------------------------------------------
//  THE LOCKED PARAMETERS + the field, the first integral, the fixed point.
// ---------------------------------------------------------------------------
const P = { a: 1.1, b: 0.4, c: 0.4, d: 0.1 };

// the Lotka–Volterra vector field  (x,y) ↦ (x', y').
function field(x, y, p = P) {
  return [p.a * x - p.b * x * y, -p.c * y + p.d * x * y];
}

// the conserved first integral  V(x,y) = d·x − c·ln x + b·y − a·ln y.
function V(x, y, p = P) {
  return p.d * x - p.c * Math.log(x) + p.b * y - p.a * Math.log(y);
}

// the equilibrium (a CENTER): (x*, y*) = (c/d, a/b).
function fixedPoint(p = P) {
  return [p.c / p.d, p.a / p.b];
}

// the linearized period at the centre: T = 2π/√(ac).  (Exact only for small loops.)
function linearPeriod(p = P) {
  return (2 * Math.PI) / Math.sqrt(p.a * p.c);
}

// ---------------------------------------------------------------------------
//  THE TWO INTEGRATORS — one structure-preserving (RK4), one naive (Euler).
//  Both advance the SAME field by one step dt; this is the load-bearing contrast.
// ---------------------------------------------------------------------------

// forward (explicit) Euler: x ← x + dt·f(x).  Cheap, naive, and LEAKS.
function eulerStep(x, y, dt, p = P) {
  const [dx, dy] = field(x, y, p);
  return [x + dt * dx, y + dt * dy];
}

// classical 4th-order Runge–Kutta: 4th-order accurate, near-conserves V.
function rk4Step(x, y, dt, p = P) {
  const [k1x, k1y] = field(x, y, p);
  const [k2x, k2y] = field(x + (dt / 2) * k1x, y + (dt / 2) * k1y, p);
  const [k3x, k3y] = field(x + (dt / 2) * k2x, y + (dt / 2) * k2y, p);
  const [k4x, k4y] = field(x + dt * k3x, y + dt * k3y, p);
  return [
    x + (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x),
    y + (dt / 6) * (k1y + 2 * k2y + 2 * k3y + k4y),
  ];
}

// pick a stepper by name (the page's RK4 ⟷ Euler toggle uses this).
function stepper(method) {
  return method === 'euler' ? eulerStep : rk4Step;
}

// ---------------------------------------------------------------------------
//  THE TRACER — integrate from (x0,y0) for `steps` steps of size dt with `method`,
//  recording the trajectory, the worst |V−V₀| seen, and whether V's drift is
//  MONOTONIC (the Euler leak is one-signed and outward; RK4's is bounded noise).
// ---------------------------------------------------------------------------
function trace(x0, y0, dt, steps, method = 'rk4', p = P) {
  let x = x0, y = y0;
  const V0 = V(x0, y0, p);
  const xs = [x], ys = [y], vs = [0];
  const step = stepper(method);
  let driftMax = 0;
  let prevDrift = 0;
  let monotoneUp = true; // does signed (V−V₀) only ever increase? (Euler: yes)
  let everPositive = false;
  for (let i = 0; i < steps; i++) {
    [x, y] = step(x, y, dt, p);
    const dv = V(x, y, p) - V0;
    xs.push(x); ys.push(y); vs.push(dv);
    if (Math.abs(dv) > driftMax) driftMax = Math.abs(dv);
    if (dv > 1e-9) everPositive = true;
    // monotone-up check only kicks in once drift is meaningfully nonzero,
    // so RK4's ~1e-12 numerical jitter doesn't spuriously count as "monotone".
    if (dv > 1e-6 && dv < prevDrift - 1e-12) monotoneUp = false;
    prevDrift = dv;
  }
  return { xs, ys, vs, V0, driftMax, endDrift: vs[vs.length - 1],
           monotoneOutward: monotoneUp && everPositive, x, y };
}

// ---------------------------------------------------------------------------
//  ORBIT TRACER — one full period of the true (RK4) orbit through (x0,y0),
//  returned as a closed polyline (the level-set V=const drawn HONESTLY: it is
//  computed by integration, not faked as an ellipse).  The PERIOD is measured by
//  a POINCARÉ SECTION: the line y = y* (the centre's lynx-coordinate), counting a
//  full lap as the SECOND upward crossing through it (a closed LV loop crosses
//  y=y* exactly twice per lap — once climbing, once falling — so the second
//  same-direction crossing is one period).  Sub-step linear interpolation makes
//  the period accurate to ~dt², not ~the loop radius (a circle-of-return test was
//  ~12% short on small loops — far too coarse to match 2π/√(ac)).
// ---------------------------------------------------------------------------
function traceOrbit(x0, y0, p = P, dt = 0.004) {
  const [, ystar] = fixedPoint(p);
  // PASS 1 — measure the period by the Poincaré section y = y* (the time between
  // two consecutive UPWARD crossings is exactly one lap), interpolated to sub-dt.
  let x = x0, y = y0;
  let period = 0, crossings = 0, tAccum = 0;
  const maxSteps = Math.ceil((4 * linearPeriod(p)) / dt);
  for (let i = 1; i <= maxSteps; i++) {
    const py = y;
    [x, y] = rk4Step(x, y, dt, p);
    tAccum += dt;
    if (py < ystar && y >= ystar) { // upward crossing
      const frac = (ystar - py) / (y - py);
      const tCross = tAccum - dt + frac * dt;
      crossings++;
      if (crossings === 1) tAccum = -(frac * dt); // restart clock at this crossing
      else { period = tCross; break; }
    }
  }
  // PASS 2 — build the CLOSED drawing polyline by integrating exactly one period
  // from the start.  Because the orbit is periodic, the last point lands back on
  // (x0,y0); we snap it shut so the level-set draws as a true closed loop.
  const nSteps = Math.max(8, Math.round(period / dt));
  const ddt = period / nSteps;          // exact step so n·ddt == period
  let gx = x0, gy = y0;
  const pts = [[gx, gy]];
  for (let i = 0; i < nSteps; i++) { [gx, gy] = rk4Step(gx, gy, ddt, p); pts.push([gx, gy]); }
  const gap = Math.hypot(gx - x0, gy - y0);
  // closure measured RELATIVE to the loop's own size (a big boom-bust loop spans
  // a wide range, so its absolute one-period return-gap is naturally larger).
  let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
  for (const [px, py] of pts) { if (px < xmin) xmin = px; if (px > xmax) xmax = px; if (py < ymin) ymin = py; if (py > ymax) ymax = py; }
  const diag = Math.hypot(xmax - xmin, ymax - ymin) || 1;
  const relGap = gap / diag;
  pts[pts.length - 1] = [x0, y0];        // snap shut (gap reported for the test)
  return { pts, period, gap, relGap, closed: period > 0 && relGap < 5e-3 };
}

// CROSS-CORRELATION lag where x(t) and y(t) align best over one period — proves
// predators TRAIL prey by a quarter cycle.  Returns the lag (in time units) of
// the peak of the (mean-removed) cross-correlation of the two series.
function quarterLag(xs, ys, dt) {
  const n = xs.length;
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  const mx = mean(xs), my = mean(ys);
  const ax = xs.map((v) => v - mx), ay = ys.map((v) => v - my);
  let bestLag = 0, bestCorr = -Infinity;
  // y lags x: correlate x(t) with y(t+lag); positive lag ⇒ y peaks AFTER x.
  for (let lag = 0; lag < n; lag++) {
    let s = 0;
    for (let i = 0; i + lag < n; i++) s += ax[i] * ay[i + lag];
    if (s > bestCorr) { bestCorr = s; bestLag = lag; }
  }
  return bestLag * dt;
}

// ============================================================================
//  THE SELF-TEST — proves the falsifiable claim EXACT.  These are the SIX checks
//  the in-page badge asserts; core.test.mjs runs this plus independent witnesses.
// ============================================================================
function runSelfTest(p = P) {
  const checks = [];
  const detail = {};
  function ok(name, cond, info) { checks.push({ name, pass: !!cond, info }); }

  const [xs0, ys0] = fixedPoint(p);          // the centre (4, 2.75)
  const T = linearPeriod(p);                  // 9.472…
  detail.fixedPoint = [xs0, ys0];
  detail.linearPeriod = T;

  // A standard boom-bust orbit for the conservation tests (well off the centre).
  const X0 = 10, Y0 = 5, dt = 0.004;
  const steps = Math.round(T / dt) * 4; // a few periods, plenty to expose a leak

  // (1) CONSERVED ALONG THE ORBIT — RK4 keeps V flat to ~machine precision and
  //     the loop CLOSES (returns to start).
  {
    const r = trace(X0, Y0, dt, steps, 'rk4', p);
    detail.rk4Drift = r.driftMax;
    const orb = traceOrbit(X0, Y0, p, dt);
    detail.orbitClosed = orb.closed;
    detail.orbitGap = orb.gap;
    detail.orbitRelGap = orb.relGap;
    ok('RK4 conserves V to ~machine precision (max|V−V₀| < 1e-10) and the loop closes',
       r.driftMax < 1e-10 && orb.closed,
       'max|ΔV|=' + r.driftMax.toExponential(2) + '  ·  loop closes to ' + (orb.relGap * 100).toFixed(3) + '% of its span');
  }

  // (2) EULER PROVABLY LEAKS — same dt, forward-Euler drives V up MONOTONICALLY
  //     and OUTWARD, |V−V₀| > 1e-2.  This is the tainted control that MUST fail.
  {
    const r = trace(X0, Y0, dt, steps, 'euler', p);
    detail.eulerDrift = r.driftMax;
    detail.eulerEndDrift = r.endDrift;
    detail.eulerMonotone = r.monotoneOutward;
    ok('Forward-Euler PROVABLY violates V: drift > 1e-2, positive (outward) & monotone',
       r.driftMax > 1e-2 && r.endDrift > 0 && r.monotoneOutward,
       'max|ΔV|=' + r.driftMax.toExponential(2) + '  ·  end ΔV=' + r.endDrift.toExponential(2) +
       ' (>0 ⇒ outward)  ·  monotone=' + r.monotoneOutward);
  }

  // (3) 4th-ORDER CONVERGENCE — RK4 with dt→dt/4 collapses the drift ≥10×: the
  //     ~0 is the method's ORDER, not luck.  (4th order ⇒ ~256× per /4 in theory;
  //     we require a conservative ≥10× so floating-point floor can't spoil it.)
  {
    const rCoarse = trace(X0, Y0, dt, steps, 'rk4', p);
    const rFine = trace(X0, Y0, dt / 4, steps * 4, 'rk4', p);
    const ratio = rCoarse.driftMax / Math.max(rFine.driftMax, 1e-300);
    detail.convergenceRatio = ratio;
    detail.rk4FineDrift = rFine.driftMax;
    ok('RK4 is 4th-order: dt→dt/4 shrinks drift ≥10× (' +
       rCoarse.driftMax.toExponential(2) + ' → ' + rFine.driftMax.toExponential(2) + ')',
       ratio >= 10,
       'ratio ' + ratio.toExponential(1) + '× (4th order predicts ~256×)');
  }

  // (4) FIXED POINT & CENTER — equilibrium is EXACTLY (c/d, a/b)=(4, 2.75); both
  //     derivatives vanish there; the Jacobian's trace is 0 ⇒ pure-imaginary
  //     eigenvalues ±i√(ac) ⇒ a CENTER (neither decays nor grows).
  {
    const [fx, fy] = field(xs0, ys0, p);
    // Jacobian at the fixed point: J = [[a−b y, −b x],[d y, −c+d x]].
    const Jtrace = (p.a - p.b * ys0) + (-p.c + p.d * xs0); // = 0 at the centre
    // off-diagonal product J12·J21 = (−b x*)(d y*) = −b d x* y*; det = −J12·J21
    const det = -(-p.b * xs0) * (p.d * ys0);
    const omega = Math.sqrt(det); // = √(ac) ⇒ eigenvalues ±iω
    detail.fixedDeriv = [fx, fy];
    detail.jacTrace = Jtrace;
    detail.omega = omega;
    const omegaExpected = Math.sqrt(p.a * p.c);
    ok('Fixed point (4, 2.75): both f=0, Jacobian trace=0 ⇒ pure-imaginary ±i√(ac) ⇒ a CENTER',
       Math.abs(xs0 - 4) < 1e-12 && Math.abs(ys0 - 2.75) < 1e-12 &&
       Math.abs(fx) < 1e-12 && Math.abs(fy) < 1e-12 &&
       Math.abs(Jtrace) < 1e-12 && Math.abs(omega - omegaExpected) < 1e-12,
       'f=(' + fx.toExponential(1) + ',' + fy.toExponential(1) + ')  trace=' +
       Jtrace.toExponential(1) + '  ω=√(ac)=' + omega.toFixed(6) + '  T=2π/ω=' + (2 * Math.PI / omega).toFixed(3));
  }

  // (5) QUARTER-LAG — predators provably trail prey by ~T/4.  Seed NEAR the centre
  //     (small amplitude) so the LINEARIZED period applies and the lag is clean.
  {
    const sx = xs0 + 0.25, sy = ys0; // a SMALL loop around the centre
    const orb = traceOrbit(sx, sy, p, dt);
    const Tm = orb.period || T;
    detail.smallPeriod = Tm;
    detail.periodFormulaErr = Math.abs(Tm - T) / T;
    const xs = orb.pts.map((q) => q[0]), ys = orb.pts.map((q) => q[1]);
    const lag = quarterLag(xs, ys, dt);
    detail.quarterLag = lag;
    detail.quarterTarget = Tm / 4;
    // the measured small-loop period should match the formula (small amplitude),
    // and the cross-correlation peak should sit near T/4 (within ±12% of T).
    ok('Predators trail prey by a quarter cycle: cross-corr lag ≈ T/4 (small loop)',
       Math.abs(lag - Tm / 4) < 0.12 * Tm && detail.periodFormulaErr < 0.02,
       'lag=' + lag.toFixed(3) + '  T/4=' + (Tm / 4).toFixed(3) +
       '  ·  small-loop T=' + Tm.toFixed(3) + ' vs 2π/√(ac)=' + T.toFixed(3) +
       ' (' + (detail.periodFormulaErr * 100).toFixed(2) + '%)');
  }

  // (6) DETERMINISM — same inputs ⇒ byte-identical trajectory across two runs.
  {
    const r1 = trace(X0, Y0, dt, 4000, 'rk4', p);
    const r2 = trace(X0, Y0, dt, 4000, 'rk4', p);
    const a = JSON.stringify([r1.xs, r1.ys, r1.vs]);
    const bb = JSON.stringify([r2.xs, r2.ys, r2.vs]);
    detail.deterministic = a === bb;
    ok('Deterministic — identical inputs ⇒ byte-identical trajectory',
       a === bb, a === bb ? 'two runs byte-identical' : 'DIFFER');
  }

  const pass = checks.filter((c) => c.pass).length;
  return { pass, total: checks.length, checks, detail };
}

export {
  P, field, V, fixedPoint, linearPeriod,
  eulerStep, rk4Step, stepper, trace, traceOrbit, quarterLag, runSelfTest,
};
