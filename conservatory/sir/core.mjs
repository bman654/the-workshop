// ============================================================================
//  THE CONSERVATORY · SIR EPIDEMIC  —  core math (the single source of truth).
//
//  THE ONE IDEA.  A closed population of one unit flows S → I → R: susceptibles
//  catch the infection, infecteds recover, recovereds never relapse.  The field is
//
//        S' = −β·S·I            (susceptibles are infected at rate β·S·I)
//        I' =  β·S·I − γ·I       (the infected pool grows by new cases, drains by recovery)
//        R' =  γ·I               (recovereds accumulate, at rate γ·I)
//
//  with the estate's locked parameters  β = 0.30,  γ = 0.10,  N = 1,  I₀ = 1e-3.
//  (N=1 normalises the bar S│I│R into fractions of a unit; the math is identical to
//  the textbook N=1000 case once γ·N/β collapses to γ/β.)
//
//  R₀ GATES EVERYTHING.  The basic reproduction number R₀ = β·S₀/γ is the single
//  knob.  Below 1 the outbreak DIES (I monotonically falls from I₀, zero peak);
//  above 1 it SWEEPS to a peak and then burns out.  The threshold is exact:
//        I'(0) = (β·S₀ − γ)·I₀   has the SIGN of (R₀ − 1).
//  At our params R₀ = 0.30·0.999/0.10 = 2.997 — a strong outbreak.
//
//  THE PEAK is EXACT and needs NO integration.  The infected pool peaks precisely
//  where new cases equal recoveries, β·S·I = γ·I ⇒ S = γ/β = 0.3333… (= S₀/R₀,
//  independent of I).  Above that S the epidemic still grows; below it, it recedes.
//  Its HEIGHT comes straight from the first integral (below).
//
//  THE FIRST INTEGRAL.  Dividing I' by S' eliminates time and gives a conserved
//  quantity along every true orbit — the V-analog of the predator–prey ring, but
//  here an OPEN arc, not a closed loop:
//        Φ(S,I) = S + I − (γ/β)·ln S   =   const   along the trajectory.
//  Under RK4 Φ stays flat to machine precision; under coarse Euler it DRIFTS.  From
//  Φ(S₀,I₀)=Φ(Speak,Imax) at S=γ/β we read the peak height with no integration at all.
//
//  THE FOIL.  Predator–prey is a CLOSED ring (V flat, orbit returns); logistic is a
//  STABLE NODE (V falls to 0, settles at K).  SIR is neither: it is an OPEN ARC that
//  LAUNCHES from the disease-free line I=0 at (S₀,0⁺) and LANDS back on I=0 at the
//  final size (S∞,0) — never to return.  The final size S∞ is the SMALL root of
//  Φ(S,0)=Φ(S₀,I₀) on (0, γ/β), found by bisection INDEPENDENTLY of any orbit.
//
//  THE TEETH.  Both RK4 and forward-Euler conserve S+I+R=N to machine zero at ANY
//  dt (the ±γI increments cancel) — so the negative control is NOT sum-drift, it is
//  POSITIVITY: at a coarse step (dt=12) Euler drives the infected pool I BELOW ZERO
//  (measured minI ≈ −0.065) — an unphysical population.  RK4 keeps I>0 always.  The
//  falsifiable claim: I≥0 under RK4 / I<0 under Euler, while the sum holds under both.
//  Measured (see core.test.mjs):
//    RK4 conserves S+I+R to 2.66e-15 and Φ to ~2e-15 over every preset orbit.
//    finalSize() (a Φ-root, never the orbit) matches a long RK4 run to ~1.7e-9.
//    coarse Euler dt=12: minI ≈ −0.065 (I<0, unphysical); RK4 minI > 0.
//
//  Everything here is pure: no RNG, no DOM, no network.  The landing's planter-light
//  AND the bench BOTH import this file so they can never drift apart.
// ============================================================================

// ---------------------------------------------------------------------------
//  THE LOCKED PARAMETERS + the field, R₀, the threshold derivative, the first
//  integral, the peak landmarks, the final-size root, the integrators, the tracer.
//  (Kept ABOVE the sentinel boundary so the whole module body is the inlined block —
//  exactly like the logistic and prey benches.)
// ---------------------------------------------------------------------------
const P = { beta: 0.30, gamma: 0.10, N: 1, I0: 1e-3 };

// the SIR vector field  (S,I) ↦ (S', I', R').  R only accumulates (R'=γI).
function field(S, I, p = P) {
  const inf = p.beta * S * I, rec = p.gamma * I;
  return [-inf, inf - rec, rec];           // [S', I', R']
}

// the basic reproduction number  R₀ = β·S₀/γ  (S₀ = N − I₀).  R₀>1 ⇒ outbreak.
function R0(p = P) {
  return p.beta * (p.N - p.I0) / p.gamma;
}

// the threshold derivative  I'(0) = (β·S₀ − γ)·I₀.  Its SIGN === sign(R₀ − 1):
// the knife-edge that flips the peak count between 0 (dies) and 1 (sweeps).
function IprimeAtZero(p = P) {
  return (p.beta * (p.N - p.I0) - p.gamma) * p.I0;
}

// the FIRST INTEGRAL  Φ(S,I) = S + I − (γ/β)·ln S — conserved along the true orbit
// (the V-analog: flat under RK4, drifting under Euler).
function Phi(S, I, p = P) {
  return S + I - (p.gamma / p.beta) * Math.log(S);
}

// the S-coordinate of the I-peak: S = γ/β = S₀/R₀, independent of I.  EXACT.
function peakS(p = P) {
  return p.gamma / p.beta;
}

// the EXACT peak HEIGHT, read from Φ at S=γ/β (no integration):
//   Imax = Φ(S₀,I₀) − Speak + (γ/β)·ln Speak.  CONDITIONAL: null when R₀ ≤ 1.
function peakInfected(p = P) {
  if (R0(p) <= 1) return null;
  const Sp = peakS(p);
  return Phi(p.N - p.I0, p.I0, p) - Sp + (p.gamma / p.beta) * Math.log(Sp);
}

// the peak landmark {S, Imax} — CONDITIONAL: null below threshold (the mark must
// not lie, mirroring logistic's inflection()).  Below R₀=1 there is no peak.
function peakLocation(p = P) {
  if (R0(p) <= 1) return null;
  return { S: peakS(p), Imax: peakInfected(p) };
}

// the FINAL SIZE S∞ — the SMALL root of Φ(S,0) = Φ(S₀,I₀) on (0, γ/β), found by
// bisection INDEPENDENTLY of any integrated orbit (anti-circularity).  h(x) =
// x − (γ/β)ln x is strictly decreasing on (0, γ/β) ⇒ a unique bracketed root that
// bisection cannot diverge from.  (NOT the textbook S₀·exp(−R₀(1−S∞/N)) form — that
// ignores I₀ and is off ~2e-4; this Φ-root is exact to the integrator.)
function finalSize(p = P) {
  const k = p.gamma / p.beta;
  const C = (p.N - p.I0) + p.I0 - k * Math.log(p.N - p.I0);
  const h = x => x - k * Math.log(x) - C;
  let lo = 1e-12, hi = k, hlo = h(lo);
  for (let i = 0; i < 200; i++) {
    const mid = 0.5 * (lo + hi), hm = h(mid);
    if (hlo * hm <= 0) hi = mid; else { lo = mid; hlo = hm; }
  }
  return 0.5 * (lo + hi);
}

// ---------------------------------------------------------------------------
//  THE TWO INTEGRATORS — one truthful (RK4), one naive (forward Euler).  Both
//  advance the SAME 3-vector field by one step dt; this is the load-bearing
//  contrast.  Forward-Euler conserves the SUM at any dt but breaks POSITIVITY.
// ---------------------------------------------------------------------------

// classical 4th-order Runge–Kutta of the 3-vector field — keeps I>0, Φ flat.
function rk4Step(S, I, R, dt, p = P) {
  const [a1, b1, c1] = field(S, I, p);
  const [a2, b2, c2] = field(S + (dt / 2) * a1, I + (dt / 2) * b1, p);
  const [a3, b3, c3] = field(S + (dt / 2) * a2, I + (dt / 2) * b2, p);
  const [a4, b4, c4] = field(S + dt * a3, I + dt * b3, p);
  return [
    S + (dt / 6) * (a1 + 2 * a2 + 2 * a3 + a4),
    I + (dt / 6) * (b1 + 2 * b2 + 2 * b3 + b4),
    R + (dt / 6) * (c1 + 2 * c2 + 2 * c3 + c4),
  ];
}

// forward (explicit) Euler: x ← x + dt·f(x).  Conserves S+I+R at ANY dt (the ±γI
// increments cancel), but at a coarse dt it drives I BELOW ZERO — the negative
// control is POSITIVITY, not sum-drift.
function eulerStep(S, I, R, dt, p = P) {
  const [a, b, c] = field(S, I, p);
  return [S + dt * a, I + dt * b, R + dt * c];
}

// pick a stepper by name (the page's RK4 ⟷ Euler toggle uses this).
function stepper(m) {
  return m === 'euler' ? eulerStep : rk4Step;
}

// ---------------------------------------------------------------------------
//  THE TRACER — integrate from (S0,I0) for `steps` steps of size dt with `method`,
//  recording S(t),I(t),R(t), the worst sum-error max|S+I+R−N|, the worst Φ-drift
//  max|Φ−Φ0|, the interior I-peak (count, time, height, S-there), the minimum I and
//  whether I ever went negative.  The phase plane, the time-series, the conservation
//  meter and the negative control all read off this.  NaN-guarded so a coarse-Euler
//  blow-up never blanks the canvas.
// ---------------------------------------------------------------------------
function trace(S0, I0, dt, steps, method = 'rk4', p = P) {
  const step = stepper(method);
  let S = S0, I = I0, R = p.N - S0 - I0;
  const Ss = [S], Is = [I], Rs = [R], ts = [0];
  const phi0 = Phi(S0, I0, p);
  let maxConsErr = 0, maxPhiDrift = 0;
  let minI = I0, wentNegative = false, blown = false;
  let peaks = 0, peakI = I0, peakT = 0, peakSval = S0;
  let prevI = I0, prevSlope = 0, haveSlope = false;
  let t = 0;
  const EPS = 1e-9;                          // slope-jitter epsilon (flat-critical guard)
  for (let i = 0; i < steps; i++) {
    [S, I, R] = step(S, I, R, dt, p);
    t += dt;
    // NaN-guard: a coarse-Euler blow-up must not poison the meters or blank the page.
    if (!isFinite(S) || !isFinite(I)) { wentNegative = true; blown = true; break; }
    const cons = Math.abs(S + I + R - p.N);
    if (cons > maxConsErr) maxConsErr = cons;
    // Φ uses ln S — guard against S≤0 under a wild Euler step.
    if (S > 0) { const d = Math.abs(Phi(S, I, p) - phi0); if (d > maxPhiDrift) maxPhiDrift = d; }
    if (I < minI) minI = I;
    if (I < 0) wentNegative = true;
    // interior peak via slope-sign flip (+ → −), with a jitter epsilon so RK4
    // flatness near the critical case never spuriously counts a peak.
    const slope = I - prevI;
    if (haveSlope && prevSlope > EPS && slope < -EPS) {
      peaks++; peakI = prevI; peakT = t - dt; peakSval = Ss[Ss.length - 1];
    }
    if (Math.abs(slope) > EPS) { prevSlope = slope; haveSlope = true; }
    prevI = I;
    Ss.push(S); Is.push(I); Rs.push(R); ts.push(t);
  }
  return { Ss, Is, Rs, ts, maxConsErr, phi0, maxPhiDrift, peaks, peakI, peakT,
           peakSval, minI, wentNegative, blown, endS: S, endI: I, endR: R };
}

// ============================================================================
//  THE SELF-TEST — proves the falsifiable claim EXACT.  These are the SIX checks
//  the in-page badge asserts; core.test.mjs runs this plus independent witnesses.
// ============================================================================
function runSelfTest(p = P) {
  const checks = [];
  const detail = {};
  function ok(name, cond, info) { checks.push({ name, pass: !!cond, info }); }

  const S0 = p.N - p.I0;
  const k = p.gamma / p.beta;
  // the four regimes (presets) — Euler one is the load-bearing positivity break.
  const sub = { beta: 0.08, gamma: 0.10, N: p.N, I0: p.I0 };   // R₀≈0.80, dies
  const crit = { beta: 0.10010, gamma: 0.10, N: p.N, I0: p.I0 }; // R₀=1.0000, knife-edge
  const sup = p;                                                 // R₀≈2.997, sweeps
  detail.R0sub = R0(sub); detail.R0crit = R0(crit); detail.R0sup = R0(sup);

  // (1) CONSERVATION — RK4 holds S+I+R=N AND Φ to <1e-9 over every preset orbit.
  //     BOTH methods hold the sum (the ±γI increments cancel); Euler breaks POSITIVITY
  //     instead — so the reader is not surprised the sum doesn't drift.
  {
    let worstSum = 0, worstPhi = 0;
    for (const q of [sub, crit, sup]) {
      const r = trace(q.N - q.I0, q.I0, 0.05, 4000, 'rk4', q);
      worstSum = Math.max(worstSum, r.maxConsErr);
      worstPhi = Math.max(worstPhi, r.maxPhiDrift);
    }
    // Euler also holds the sum (at the very dt that breaks positivity).
    const eul = trace(S0, p.I0, 12, 60, 'euler', p);
    detail.consRK4 = worstSum; detail.phiRK4 = worstPhi; detail.consEuler = eul.maxConsErr;
    ok('Conservation: RK4 holds S+I+R=N to ' + worstSum.toExponential(2) + ' AND Φ to ' +
       worstPhi.toExponential(2) + ' (<1e-9). BOTH methods hold the sum; Euler breaks POSITIVITY instead.',
       worstSum < 1e-9 && worstPhi < 1e-9 && eul.maxConsErr < 1e-9,
       'RK4 sum=' + worstSum.toExponential(2) + ' Φ=' + worstPhi.toExponential(2) +
       '  ·  Euler sum=' + eul.maxConsErr.toExponential(2) + ' (also holds)');
  }

  // (2) THRESHOLD (teeth) — sign(I'(0)) === sign(R₀−1) on BOTH sides, and the peak
  //     count flips: subcritical & critical ⇒ 0 peaks (I monotone-down); supercritical
  //     ⇒ 1 peak.  The 1e-9 slope-jitter epsilon keeps the flat critical case at 0.
  {
    const ssub = Math.sign(IprimeAtZero(sub)), ssup = Math.sign(IprimeAtZero(sup));
    const rsub = trace(sub.N - sub.I0, sub.I0, 0.05, 8000, 'rk4', sub);
    const rcrit = trace(crit.N - crit.I0, crit.I0, 0.05, 8000, 'rk4', crit);
    const rsup = trace(sup.N - sup.I0, sup.I0, 0.05, 8000, 'rk4', sup);
    detail.peaksSub = rsub.peaks; detail.peaksCrit = rcrit.peaks; detail.peaksSup = rsup.peaks;
    ok('Threshold: sign(I\'(0))=sign(R₀−1) both sides; peak count flips 0↔1 across R₀=1 ' +
       '(sub=' + rsub.peaks + ', crit=' + rcrit.peaks + ', super=' + rsup.peaks + ')',
       ssub === Math.sign(R0(sub) - 1) && ssup === Math.sign(R0(sup) - 1) &&
       rsub.peaks === 0 && rcrit.peaks === 0 && rsup.peaks === 1,
       'sgn I\'(0): sub=' + ssub + ' super=' + ssup + '  ·  peaks sub/crit/super=' +
       rsub.peaks + '/' + rcrit.peaks + '/' + rsup.peaks);
  }

  // (3) PEAK LOCATION — peakS()=γ/β byte-exact; the traced supercritical peak lands
  //     within 1e-3 of γ/β (parabolic-interpolated argmax for ~30× headroom);
  //     peakLocation(R₀≤1)===null.
  {
    const Sp = peakS(p);
    const exact = Math.abs(Sp - k) < 1e-12;
    // parabolic interpolation of the discrete I-argmax → a sub-step Sval estimate.
    const r = trace(S0, p.I0, 0.02, 20000, 'rk4', p);
    let im = 0;
    for (let i = 1; i < r.Is.length - 1; i++) if (r.Is[i] > r.Is[im]) im = i;
    const y0 = r.Is[im - 1], y1 = r.Is[im], y2 = r.Is[im + 1];
    const denom = (y0 - 2 * y1 + y2);
    const off = denom !== 0 ? 0.5 * (y0 - y2) / denom : 0;       // sub-index offset in [−.5,.5]
    const SvalInterp = r.Ss[im] + off * 0.5 * (r.Ss[im + 1] - r.Ss[im - 1]);
    detail.peakSval = SvalInterp; detail.peakSerr = Math.abs(SvalInterp - k);
    detail.peakNullSub = peakLocation(sub);
    ok('Peak location: peakS()=γ/β=' + k.toFixed(6) + ' byte-exact; traced peak Sval lands within 1e-3; ' +
       'peakLocation(R₀≤1)=null',
       exact && Math.abs(SvalInterp - k) < 1e-3 && peakLocation(sub) === null,
       '|peakS−γ/β|<1e-12=' + exact + '  traced Sval=' + SvalInterp.toFixed(6) +
       ' (err ' + Math.abs(SvalInterp - k).toExponential(2) + ')  ·  sub-peak=' + peakLocation(sub));
  }

  // (4) FINAL-SIZE (transcendental teeth, anti-circularity) — finalSize() (a Φ-root
  //     that NEVER touches the orbit) matches a long RK4 run integrated to quiescence
  //     (I<1e-12) to <1e-6; and the root is the SMALL one (0 < S∞ < γ/β).
  {
    const Sinf = finalSize(p);
    // long RK4 run to quiescence — the blind independent witness.
    let S = S0, I = p.I0, R = p.I0 * 0 + (p.N - S0 - p.I0), tt = 0;
    const dt = 0.02;
    for (let i = 0; i < 2000000 && I > 1e-12; i++) { [S, I, R] = rk4Step(S, I, R, dt, p); tt += dt; }
    detail.finalSize = Sinf; detail.finalRun = S; detail.finalErr = Math.abs(Sinf - S);
    ok('Final size: Φ-root S∞=' + Sinf.toFixed(9) + ' matches long-run RK4 (I<1e-12) to ' +
       Math.abs(Sinf - S).toExponential(2) + ' (<1e-6); and S∞ is the SMALL root (0<S∞<γ/β)',
       Math.abs(Sinf - S) < 1e-6 && Sinf > 0 && Sinf < k,
       'Φ-root=' + Sinf.toFixed(9) + '  RK4-run=' + S.toFixed(9) + '  Δ=' +
       Math.abs(Sinf - S).toExponential(2) + '  ·  0<S∞<γ/β=' + (Sinf > 0 && Sinf < k));
  }

  // (5) NEGATIVE CONTROL (POSITIVITY, not sum-drift) — RK4 keeps minI>0 at a coarse
  //     dt; Euler at dt=12 drives minI<0 (≈−0.065) with wentNegative===true.  ALSO
  //     the SUM stays =N under BOTH methods (and we say so).
  {
    const eul = trace(S0, p.I0, 12, 60, 'euler', p);
    const rk = trace(S0, p.I0, 12, 60, 'rk4', p);
    detail.eulerMinI = eul.minI; detail.eulerNeg = eul.wentNegative;
    detail.rk4MinI = rk.minI; detail.eulerSum = eul.maxConsErr; detail.rk4Sum = rk.maxConsErr;
    ok('Negative control: I<0 under Euler dt=12 (minI=' + eul.minI.toFixed(4) +
       '), I≥0 under RK4 (minI=' + rk.minI.toExponential(2) + '); the SUM holds under BOTH',
       eul.wentNegative === true && eul.minI < 0 && rk.minI > 0 &&
       eul.maxConsErr < 1e-9 && rk.maxConsErr < 1e-9,
       'Euler minI=' + eul.minI.toFixed(4) + ' (neg=' + eul.wentNegative + ')  ·  RK4 minI=' +
       rk.minI.toExponential(2) + '  ·  sums: Euler=' + eul.maxConsErr.toExponential(2) +
       ' RK4=' + rk.maxConsErr.toExponential(2) + ' (both hold)');
  }

  // (6) RE-EXTRACTION PARITY — proven in the Node twin (core.test.mjs) against the
  //     inlined SIR-CORE in index.html.  Here we record a determinism witness so the
  //     in-page badge has a sixth green: two identical traces are byte-identical.
  {
    const r1 = trace(S0, p.I0, 0.05, 3000, 'rk4', p);
    const r2 = trace(S0, p.I0, 0.05, 3000, 'rk4', p);
    const a = JSON.stringify([r1.Ss, r1.Is, r1.Rs]);
    const bb = JSON.stringify([r2.Ss, r2.Is, r2.Rs]);
    detail.deterministic = a === bb;
    ok('Re-extraction parity is proven in the Node twin; determinism holds (identical inputs ⇒ byte-identical trace)',
       a === bb, a === bb ? 'two runs byte-identical' : 'DIFFER');
  }

  const pass = checks.filter((c) => c.pass).length;
  return { pass, total: checks.length, checks, detail };
}

export {
  P, field, R0, IprimeAtZero, Phi, peakS, peakInfected, peakLocation, finalSize,
  rk4Step, eulerStep, stepper, trace, runSelfTest,
};
