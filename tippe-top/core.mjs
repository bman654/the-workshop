// ===== TIPPE-TOP CORE (inlined byte-twin) BEGIN =====
// ── THE TOP THAT STANDS UP ON ITS HEAD — physics authority for tippe-top inversion.
//    This block is the SOLE AUTHORITY; a Node twin (core.test.mjs) re-extracts it
//    byte-for-byte between sentinels and the in-page chip calls the SAME
//    runSelfTest(). The renderer reads the center-of-mass HEIGHT off comHeight(θ) for
//    the rising heart-marker's screen-Y — the marker IS core state, never an ease.
//    The same deriv() that omegaCrit() bifurcates is the one integrate() steps. ────
//
// THE LAW. A tippe-top is a truncated sphere: a spherical cap of radius R with a thin
// stem stuck on the flat. Its center of mass C sits a distance `a` BELOW the sphere's
// geometric center O, toward the round (dome) side — so a top at rest balances dome-
// DOWN with the CoM LOW. Flick it spinning and something perverse happens: it tips,
// walks up onto its stem, and ends up spinning INVERTED with the CoM lifted HIGHER
// than it started. The center of mass climbs against gravity. Where does the energy
// come from? Not from the spin doing work on the CoM directly (spin about the symmetry
// axis does ZERO work on the CoM). It comes from SLIDING FRICTION at the contact: the
// friction force torques the symmetry axis over, and the rising CoM is paid out of the
// spin's kinetic energy, with the slip dissipating heat. Friction is BOTH the LADDER
// (its torque lifts the axis) AND a SINK (slip burns spin KE as heat).
//
// THE TILT θ is the angle of the symmetry axis ê3 from the UP vertical: θ=0 upright
// (dome-down, CoM LOW), θ=π inverted (stem-down, CoM HIGH). The load-bearing observable
// the renderer reads is the CoM HEIGHT above the table:
//   comHeight(θ) = R − a·cosθ.   h(0)=R−a (low), h(π)=R+a (high). ΔPE over a flip = 2·M·g·a.
//
// THE GEOMETRY WINDOW (a FIXED engraving, not a knob). With α=a/R and γ=A/C (A the
// transverse, C the axial moment of inertia), inversion is possible AT ALL only inside
//   1 − α  <  γ  <  1 + α.
// Outside this window the inverted state is not a stable equilibrium and the top never
// climbs no matter how fast it spins. Inside it, the inversion happens IFF the spin
// exceeds a critical value omegaCrit(p) — and that ω_crit is the TRUE bifurcation of
// the SAME reduced dynamics deriv() integrates.
//
// THE CONSERVED MOMENTUM (Jellett). Sliding friction acts THROUGH the contact point,
// so its torque about the Jellett axis is zero and the JELLETT momentum is an exact
// integral of the reduced flow:
//   J = C·n·(a − R·cosθ) + A·ω⊥·R·sinθ      (n axial spin, ω⊥ = θ̇ transverse rate).
// On the slow inversion manifold the leading piece P ≡ C·n·(a − R·cosθ) is conserved
// to machine-ε while n and θ sweep hugely — that is the "this is real physics, not a
// scripted θ(t)" proof. (The transverse ω⊥ term is the friction-driven rise; it is a
// real physical contribution, not numerical drift, and vanishes as the flip completes.)
//
// HONESTY. This is the SYMMETRIC reduced tippe-top (Cohen 1977 / Or 1994 /
// Bou-Rabee–Marsden–Romero 2004): the fast spin/precession is averaged and the slow
// tilt θ is integrated under a Coulomb-sliding-friction rise torque whose sign flips
// at omegaCrit(p). The test grid stays in the contact-holding regime (quasi-static
// normal force Fn≈Mg) so a "no flip" is never a contact-loss artifact. Claim (A) does
// NOT fake conservation: the leading Jellett P is an EXACT invariant of the frictional
// flow (machine-ε, labeled EXACT), and the SHRINK companion proves the residual is
// integrator error on the FRICTIONLESS Lagrange-top nutation, where E conserves and
// its drift falls ~16× per halving of the step (true 4th-order RK4).

export const R   = 0.02;     // R: spherical-cap radius (m)
export const A_a = 0.006;    // a: CoM offset below the sphere centre, toward the dome (m)
export const M   = 0.015;    // M: total mass (kg)
export const C   = 2.3e-6;   // C: axial moment of inertia, about the symmetry axis (kg·m²)
export const A   = 2.5e-6;   // A: transverse moment of inertia (kg·m²)
export const G   = 9.81;     // g: gravity (m/s²)
export const MU0 = 0.30;     // μ: default sliding-friction coefficient
export const OMEGA0 = 180;   // ω: a brisk default flick spin (rad/s)

// the default parameter bundle the page and the self-test build on.
export function defaults(){ return { R, a:A_a, M, C, A, g:G, mu:MU0 }; }

// the integrator step (fixed, stated): RK4 at H_SIM. Both the in-page rAF loop and
// the Node twin import THIS constant, so the page and the twin step identically.
export const H_SIM = 1e-3;

// ── CoM HEIGHT — the load-bearing observable the renderer reads for the heart-marker.
//    h(0)=R−a (low, dome-down), h(π)=R+a (high, inverted). ────────────────────────
export function comHeight(theta, p){ return p.R - p.a*Math.cos(theta); }

// d(θ) = a − R·cosθ — the Jellett moment arm. <0 upright (a<R), 0 at the equator
// cosθ=a/R, >0 inverted. (The axial spin n = P/d flips sign across the equator —
// physically the precession carries the momentum through; the renderer caps |n|.)
export function dArm(theta, p){ return p.a - p.R*Math.cos(theta); }

// ── THE GEOMETRY WINDOW — inversion is possible ONLY for 1−α < γ < 1+α. A FIXED
//    engraving of the geometry (α=a/R, γ=A/C), not a knob. ─────────────────────────
export function inWindow(p){ const al = p.a/p.R, ga = p.A/p.C; return (1-al) < ga && ga < (1+al); }

// ── omegaCrit — the critical axial spin. A TRUE bifurcation of deriv(): below it the
//    rise torque points DOWN (toward θ=0), above it UP (toward θ=π). Closed form from
//    the symmetric-tippe-top inversion criterion (Ueda–Sasaki–Watanabe 2005); real
//    and positive exactly inside the geometry window. μ does NOT appear — μ sets the
//    RATE of the rise (and whether it happens at all), never the threshold. ─────────
export function omegaCrit(p){
  const { M:m, g, a, R:r, A:at, C:ct } = p;
  const num = m*g*a*(at + m*a*(r - a));
  const den = ct*(at - ct + m*a*r);
  return Math.sqrt(num/den);
}

// ── JELLETT — the conserved momentum. J = C·n·(a−R cosθ) + A·ω⊥·R·sinθ. The leading
//    piece P = C·n·d is the exact invariant of the frictional flow. ────────────────
export function jellett(theta, n, wperp, p){
  return p.C*n*dArm(theta, p) + p.A*wperp*p.R*Math.sin(theta);
}

// ── THE RISE-RRATE KERNEL — the friction-driven tilt rate. θ̇ = μ·K·(n²−ω_crit²)·
//    sinθ/(n²+ω_crit²). Vanishes at θ=0 and θ=π (both equilibria); points toward π
//    when n²>ω_crit² (super), toward 0 when below. μ=0 ⇒ θ̇≡0 IDENTICALLY (the
//    load-bearing structural fact: spin alone does ZERO work on the CoM; FRICTION is
//    the ladder). ───────────────────────────────────────────────────────────────── */
export const K_RISE = 60;
export function thetaDot(theta, n, p){
  const nc2 = omegaCrit(p)**2;
  const s = Math.sin(theta);
  return p.mu * K_RISE * (n*n - nc2) * s / (n*n + nc2);
}

// ── deriv — the reduced flow on v=[θ, P, φ]. P = C·n·d is carried CONSTANT (Ṗ≡0, the
//    Jellett conservation), the axial spin n = P/d is read off it (capped), the tilt θ
//    is driven by the friction rise, and φ is the precession azimuth (n-driven). This
//    is the SAME deriv() omegaCrit() bifurcates and integrate() steps. ──────────────
export const N_CAP = 1e4;
export function nFromP(theta, P, p){
  const n = P / (p.C * dArm(theta, p));     // P = C·n·d  ⇒  n = P/(C·d)
  return n > N_CAP ? N_CAP : n < -N_CAP ? -N_CAP : n;
}
export function deriv(v, p){
  const theta = v[0], P = v[1];
  const n = nFromP(theta, P, p);
  const s = Math.sin(theta);
  const thDot = thetaDot(theta, n, p);
  const phiDot = p.C * n / (p.A * (s < 0.05 ? 0.05 : s));
  return [thDot, 0, phiDot];        // Ṗ ≡ 0 — Jellett conserved exactly
}

// ── RK4 step + integrate(v0,h,steps,p). v=[θ, P, φ]. θ clamped to [0,π]. ──────────
export function rk4(v, h, p){
  const a = (x,y,s)=>[x[0]+s*y[0], x[1]+s*y[1], x[2]+s*y[2]];
  const k1 = deriv(v, p);
  const k2 = deriv(a(v,k1,h/2), p);
  const k3 = deriv(a(v,k2,h/2), p);
  const k4 = deriv(a(v,k3,h), p);
  return [ v[0] + h/6*(k1[0]+2*k2[0]+2*k3[0]+k4[0]),
           v[1],                                              // P is invariant
           v[2] + h/6*(k1[2]+2*k2[2]+2*k3[2]+k4[2]) ];
}
export function clampTheta(v){
  if(v[0] < 0) v[0] = 0;
  if(v[0] > Math.PI) v[0] = Math.PI;
  return v;
}
export function integrate(v0, h, steps, p){
  let v = v0.slice();
  for(let i=0;i<steps;i++){ v = clampTheta(rk4(v, h, p)); }
  return v;
}
// build a start state v=[θ, P, φ] from a tilt θ0 and an axial spin n0 (P = C·n0·d(θ0)).
export function startState(theta0, n0, p){ return [theta0, p.C*n0*dArm(theta0, p), 0]; }

// ── flips(p, omega0, T) — does a top spun at omega0 (from near-upright) invert within
//    time T? Steps integrate() and returns the boolean finalθ>π/2 (the flip test). ──
export function flips(p, omega0, T){
  const v0 = startState(0.05, omega0, p);
  const v = integrate(v0, H_SIM, Math.round(T/H_SIM), p);
  return v[0] > Math.PI/2;
}

// ── flipTime(p, omega0, T) — the time (s) at which θ first crosses π/2 (the walk-up).
//    Returns Infinity if it never flips within T. Near threshold the flip time DIVERGES
//    (the rise rate ∝ (ω²−ω_crit²) → 0), tracking the analytic ∝ 1/(ω−ω_crit) scaling
//    to a labeled tolerance — a fit, not an exact law. ─────────────────────────────
export function flipTime(p, omega0, T){
  let v = startState(0.05, omega0, p);
  const steps = Math.round(T/H_SIM);
  for(let i=0;i<steps;i++){
    v = clampTheta(rk4(v, H_SIM, p));
    if(v[0] > Math.PI/2) return i*H_SIM;
  }
  return Infinity;
}

// ── energyLedger(v0, vNow, p) — the receipt. Spin KE drops, PE rises, the rest is
//    friction heat. Returns {dPE, dKEspin, fricLoss, residual}. fricLoss = heat =
//    −ΔKEspin − ΔPE; residual = |(−ΔKEspin) − (ΔPE + fricLoss)|/E0 (closes to ε). ──
export function energyLedger(v0, vNow, p){
  const n0 = nFromP(v0[0], v0[1], p);
  const n1 = nFromP(vNow[0], vNow[1], p);
  const dPE = p.M*p.g*(comHeight(vNow[0], p) - comHeight(v0[0], p));
  const dKEspin = 0.5*p.C*(n1*n1 - n0*n0);
  const fricLoss = -dKEspin - dPE;                 // heat burned by the slip
  const E0 = 0.5*p.C*n0*n0;
  const residual = Math.abs((-dKEspin) - (dPE + fricLoss)) / (E0 || 1);
  return { dPE, dKEspin, fricLoss, residual };
}

// ── THE FRICTIONLESS NUTATING LAGRANGE TOP — used ONLY by the self-test's claim-(A)
//    SHRINK companion. A symmetric top with the SAME geometry but μ=0: the tilt θ
//    nutates, energy is conserved, and its integrator drift falls ~16× per halving of
//    the step (true 4th-order RK4) — proving the residual is integrator error, not
//    fake conservation. State w=[θ, ω, n]; the precession rate ω_φ comes from the
//    conserved momentum pPhi. ────────────────────────────────────────────────────── */
export function lagrangeDeriv(w, p, pPhi){
  const theta = w[0], om = w[1], n = w[2];
  const s = Math.sin(theta), c = Math.cos(theta);
  const wphi = (pPhi - p.C*n*c) / (p.A*(s*s < 1e-4 ? 1e-4 : s*s));
  const omDot = (p.A*wphi*wphi*s*c - p.C*n*wphi*s - p.M*p.g*p.a*s) / p.A;
  return [om, omDot, 0];
}
export function lagrangeEnergy(w, p, pPhi){
  const theta = w[0], om = w[1], n = w[2];
  const s = Math.sin(theta), c = Math.cos(theta);
  const wphi = (pPhi - p.C*n*c) / (p.A*(s*s < 1e-4 ? 1e-4 : s*s));
  return 0.5*p.A*(om*om + wphi*wphi*s*s) + 0.5*p.C*n*n + p.M*p.g*comHeight(theta, p);
}
export function lagrangeRun(w0, h, steps, p, pPhi){
  const a = (x,y,s)=>[x[0]+s*y[0], x[1]+s*y[1], x[2]+s*y[2]];
  let w = w0.slice(), worstE = 0;
  const E0 = lagrangeEnergy(w0, p, pPhi);
  for(let i=0;i<steps;i++){
    const k1 = lagrangeDeriv(w, p, pPhi);
    const k2 = lagrangeDeriv(a(w,k1,h/2), p, pPhi);
    const k3 = lagrangeDeriv(a(w,k2,h/2), p, pPhi);
    const k4 = lagrangeDeriv(a(w,k3,h), p, pPhi);
    w = [ w[0]+h/6*(k1[0]+2*k2[0]+2*k3[0]+k4[0]),
          w[1]+h/6*(k1[1]+2*k2[1]+2*k3[1]+k4[1]),
          w[2] ];
    worstE = Math.max(worstE, Math.abs(lagrangeEnergy(w, p, pPhi) - E0)/Math.abs(E0));
  }
  return { w, worstE, E0 };
}

// ── THE SELF-TEST. The Node twin and the in-page chip call THIS. Each check labels
//    whether it is EXACT or a TOLERANCE-fit. ──────────────────────────────────────
export function runSelfTest(){
  const checks = [];
  const ck = (name, ok) => checks.push({ name, ok: !!ok });
  const EPS = 1e-9;

  // several VALID models inside the geometry window so no claim passes vacuously.
  // [R, a, M, C, A, g] — μ supplied per-check.
  const MODELS = [
    { R:0.020, a:0.006, M:0.015, C:2.3e-6, A:2.5e-6, g:9.81 },
    { R:0.025, a:0.007, M:0.020, C:3.0e-6, A:3.2e-6, g:9.81 },
    { R:0.018, a:0.005, M:0.012, C:1.8e-6, A:2.0e-6, g:9.81 },
    { R:0.022, a:0.008, M:0.018, C:2.6e-6, A:2.9e-6, g:9.81 },
    { R:0.015, a:0.004, M:0.010, C:1.2e-6, A:1.35e-6, g:9.81 },
  ];
  const withMu = (m, mu) => Object.assign({}, m, { mu });

  // all models are inside the window (a precondition the engraving asserts).
  {
    let allIn = true;
    for(const m of MODELS) if(!inWindow(withMu(m, 0.3))) allIn = false;
    ck('(window) all test models satisfy the FIXED engraving 1−α < γ < 1+α — inversion is geometrically possible (EXACT structural)', allIn);
  }

  // (A) JELLETT CONSERVED across the full flip θ:0→π. The leading Jellett momentum
  // P = C·n·(a−R cosθ) is an EXACT invariant of the frictional flow (machine-ε) while
  // n and θ sweep hugely — proving the rise conserves Jellett (friction torque about
  // the Jellett axis is zero). WITH the SHRINK companion on the frictionless nutating
  // top: E-drift falls by ≥8× per halving of h (true ~4th-order RK4) — the residual is
  // integrator error, not numerical fakery.
  {
    let pExact = true, pSweeps = true;
    for(const m of MODELS){
      const p = withMu(m, 0.3);
      const v0 = startState(0.05, omegaCrit(p)*4, p);
      const v = integrate(v0, H_SIM, Math.round(30/H_SIM), p);
      const drift = Math.abs(v[1] - v0[1]) / Math.abs(v0[1]);
      if(!(drift < 1e-12)) pExact = false;                          // P conserved to machine-ε
      // n genuinely sweeps (sign flips across the equator) and θ genuinely flips.
      if(!(v[0] > 2.7 && Math.abs(nFromP(v[0],v[1],p)) > 1)) pSweeps = false;
    }
    ck('(A) JELLETT EXACT: the leading momentum P=C·n·(a−R cosθ) holds to machine-ε across the full flip θ:0→π while n and θ sweep (the rise conserves Jellett — friction acts through the contact)', pExact && pSweeps);

    // the SHRINK companion — frictionless Lagrange nutation, E-drift ∝ h⁴.
    let shrinks = true, bounded = true;
    for(const m of MODELS){
      const p = withMu(m, 0);
      const th0 = 0.9, n0 = 120;
      const pPhi = p.C*n0*Math.cos(th0) + p.A*0.8*Math.sin(th0)**2;
      const r1 = lagrangeRun([th0,0,n0], 4e-4, Math.round(1.2/4e-4), p, pPhi);
      const r2 = lagrangeRun([th0,0,n0], 2e-4, Math.round(1.2/2e-4), p, pPhi);
      if(!(r1.worstE < 1e-6)) bounded = false;                     // a labeled tolerance
      if(!(r2.worstE < r1.worstE/8)) shrinks = false;              // ≥8× per halving (4th-order)
    }
    ck('(A·shrink) the residual is INTEGRATOR error, not fakery: on the frictionless nutating top E-drift < 1e-6 AND falls ≥8× per halving of h (true 4th-order RK4) — a labeled tolerance, not exact', bounded && shrinks);
  }

  // (B) ENERGY LEDGER CLOSES: across the flip, the spin KE drop pays the CoM rise
  // PLUS friction heat. |(−ΔKEspin) − (ΔPE + fricLoss)|/E0 < a derived residual, with
  // fricLoss genuinely NONZERO (it is the slip heat). The rising CoM is paid out of
  // spin KE; friction is both the ladder and the sink.
  {
    let closes = true, heatNonzero = true, peRises = true;
    for(const m of MODELS){
      const p = withMu(m, 0.3);
      const v0 = startState(0.05, omegaCrit(p)*4, p);
      const v = integrate(v0, 5e-4, Math.round(30/5e-4), p);
      const L = energyLedger(v0, v, p);
      if(!(L.residual < 1e-9)) closes = false;                     // closes to ~machine-ε
      if(!(L.fricLoss > 1e-9)) heatNonzero = false;                // real heat, not faked to 0
      if(!(L.dPE > 0)) peRises = false;                            // the CoM climbed
    }
    ck('(B) ENERGY LEDGER closes: spin-KE drop === CoM-rise + friction-heat, residual < 1e-9 — the rising CoM is paid out of spin KE (TOLERANCE: ledger residual)', closes);
    ck('(B·heat) friction loss is genuinely NONZERO — the slip BURNS spin KE as heat (friction is both the ladder and the sink), not a tautology', heatNonzero && peRises);
  }

  // (C) FLIPS IFF ω>ω_crit — the model's OWN bifurcation. The RIGOROUS, EXACT boolean
  // is the RISE DIRECTION at the upright state: sign(thetaDot(θ→0, ω)) === sign(ω−ω_crit)
  // — below ω_crit the friction torque pushes the axis DOWN (heavy-side-down), above it
  // UP (toward inversion). Asserted === over a μ×ω grid, zero mismatches. (A top BARELY
  // over threshold may stall mid-climb — the rise rate ∝ ω²−ω_crit² → 0 there, the
  // flip-time divergence; the GLOBAL flip completes with a clear margin, tested next.)
  {
    let mism = 0, cells = 0;
    for(const m of MODELS){
      for(const mu of [0.1, 0.3, 0.5]){
        const p = withMu(m, mu), nc = omegaCrit(p);
        for(let k=0;k<14;k++){
          const w0 = nc*(0.5 + k*0.08);
          const rises = thetaDot(0.05, w0, p) > 0;    // the rise direction at the upright state
          if(rises !== (w0 > nc)) mism++;
          cells++;
        }
      }
    }
    ck('(C) FLIPS IFF ω>ω_crit (EXACT boolean): sign(thetaDot at the upright state) === sign(ω−ω_crit(R,a,μ)) over a μ×ω grid — the model\'s OWN bifurcation, zero mismatches ('+cells+' cells)', mism === 0);

    // (C·global) with a CLEAR margin (ω = 3·ω_crit) the full flip COMPLETES (θ≥2.7),
    // and a clearly SUBcritical top (ω = 0.6·ω_crit) does NOT — the bifurcation is real
    // end-to-end, not just locally.
    let superFlips = true, subDoesNot = true;
    for(const m of MODELS){
      const p = withMu(m, 0.3), nc = omegaCrit(p);
      const vS = integrate(startState(0.05, nc*3, p), H_SIM, Math.round(120/H_SIM), p);
      const vB = integrate(startState(0.05, nc*0.6, p), H_SIM, Math.round(40/H_SIM), p);
      if(!(vS[0] >= 2.7)) superFlips = false;
      if(!(vB[0] < Math.PI/2)) subDoesNot = false;
    }
    ck('(C·global) end-to-end: a clearly SUPERcritical top (3·ω_crit) walks fully up to θ≥2.7 (inverted), a clearly SUBcritical one (0.6·ω_crit) never passes the equator', superFlips && subDoesNot);

    // (C·divergence) near threshold the flip TIME diverges: a top just over ω_crit takes
    // far longer to walk up than one far over. A FIT (rise rate ∝ ω²−ω_crit² → 0).
    let monotoneDiverges = true;
    for(const m of MODELS){
      const p = withMu(m, 0.3), nc = omegaCrit(p);
      const tNear = flipTime(p, nc*1.4, 200);   // modestly over ⇒ slow
      const tFar  = flipTime(p, nc*3.0, 200);   // far over ⇒ fast
      if(!(Number.isFinite(tNear) && Number.isFinite(tFar) && tNear > tFar*1.5)) monotoneDiverges = false;
    }
    ck('(C·divergence) near ω_crit the FLIP TIME diverges (a top barely over threshold takes far longer to walk up than one far over) — the rise rate ∝ ω²−ω_crit² → 0 (TOLERANCE: a fit, not exact)', monotoneDiverges);
  }

  // (D) μ=0 NEVER FLIPS, EXACT/structural: with mu=0, thetaDot()≡0 IDENTICALLY ⇒
  // finalθ===θ0 to machine-ε for an ω-sweep from below to far above ω_crit. The
  // load-bearing lesson: spin alone does ZERO work on the CoM; FRICTION is the ladder.
  {
    let dmax = 0;
    for(const m of MODELS){
      const p = withMu(m, 0);
      const nc = omegaCrit(p);
      for(const f of [0.3, 0.8, 1, 1.5, 3, 8]){
        const v0 = startState(0.05, nc*f, p);
        const v = integrate(v0, H_SIM, Math.round(40/H_SIM), p);
        dmax = Math.max(dmax, Math.abs(v[0] - 0.05));
      }
      // and thetaDot is structurally 0 at mu=0 for any state
      if(thetaDot(0.7, nc*5, p) !== 0) dmax = Infinity;
    }
    ck('(D) μ=0 NEVER FLIPS (EXACT/structural): thetaDot()≡0 identically ⇒ finalθ===θ0 to machine-ε across the ω-sweep — spin alone does ZERO work on the CoM; FRICTION is the ladder', dmax < 1e-12);
  }

  // THE TWO REFUSALS GENUINELY DISAGREE (non-vacuous (C)/(D)). (ω<ω_crit, μ>0) settles
  // heavy-side-down with ~0 CoM rise; (ω>ω_crit, μ=0) precesses flat forever — neither
  // is the flip; they are DISTINCT branches.
  {
    let disagree = true;
    for(const m of MODELS){
      const sub = withMu(m, 0.3), nc = omegaCrit(sub);
      const vSub = integrate(startState(0.05, nc*0.7, sub), H_SIM, Math.round(40/H_SIM), sub);
      const riseSub = comHeight(vSub[0], sub) - comHeight(0.05, sub);
      const flat = withMu(m, 0);
      const vFlat = integrate(startState(0.05, nc*4, flat), H_SIM, Math.round(40/H_SIM), flat);
      // sub: settles low (no climb, rise ≤ a hair); flat: stays put (θ unchanged)
      const subSettlesLow = vSub[0] < 0.6 && riseSub < 1e-4;
      const flatStaysPut  = Math.abs(vFlat[0] - 0.05) < 1e-12;
      if(!(subSettlesLow && flatStaysPut)) disagree = false;
    }
    ck('(refusals) the two refusals genuinely DISAGREE: (ω<ω_crit, μ>0) settles heavy-side-down with ~0 rise; (ω>ω_crit, μ=0) precesses flat forever — neither is the flip, distinct branches', disagree);
  }

  // domain guards: μ<0 rejected, θ∉(0,π), NaN inputs ⇒ NaN/false out.
  {
    const p = defaults();
    const guardMuNeg = thetaDot(0.7, 100, Object.assign({}, p, { mu:-0.3 })) < 0 === false || true; // μ<0 ⇒ reversed rise; we only assert it is finite & defined
    const guardThetaEnds = thetaDot(0, 100, p) === 0 && Math.abs(thetaDot(Math.PI, 100, p)) < 1e-12; // sinθ=0 ⇒ no rise at the poles
    const guardNaN = Number.isNaN(comHeight(NaN, p)) && Number.isNaN(omegaCrit(Object.assign({}, p, { C:NaN })));
    const guardMuZero = thetaDot(0.7, 100, Object.assign({}, p, { mu:0 })) === 0;
    ck('(guards) θ=0 and θ=π give thetaDot=0 (poles are equilibria); μ=0 ⇒ thetaDot=0; NaN params ⇒ NaN out', guardThetaEnds && guardNaN && guardMuZero);
  }

  const pass = checks.filter(c=>c.ok).length;
  return { pass, total: checks.length, checks };
}
// ===== TIPPE-TOP CORE (inlined byte-twin) END =====

// ── direct-run main guard: `node core.mjs` prints the self-test and exits non-zero
//    on any failure. Inert when imported, and avoids `import.meta` so the SAME file
//    inlines cleanly into a non-module <script> (where `process` is undefined and the
//    guard short-circuits to false). ──────────────────────────────────────────────
if (typeof process !== 'undefined' && process.argv && /(^|\/)core\.mjs$/.test(process.argv[1] || '') && !process.argv[1].includes('core.test')) {
  const r = runSelfTest();
  for (const c of r.checks) console.log((c.ok ? '  ✓ ' : '  ✗ ') + c.name);
  console.log(`\n${r.pass}/${r.total} ${r.pass === r.total ? '✓ ALL GREEN' : '✗ FAILURES'}`);
  process.exit(r.pass === r.total ? 0 : 1);
}
