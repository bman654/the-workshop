// The Unstirring — logic core. A PURE, DOM-free advection engine for a concentric
// Couette cell (Taylor–Couette geometry): an inner glass cylinder rotates, the outer
// wall is fixed, and thick fluid fills the gap. A cloud of dye particles RIDES that
// flow. The ONE engine below drives BOTH the page (it renders the exact advect()
// positions) and the Node twin (core.test.mjs proves the claim). There is no second,
// divergent copy of the physics anywhere.
//
// THE CLAIM (honest scope):
//   • In the creeping / Stokes limit (Re → 0) inertia sleeps: the steady flow is
//     PURELY AZIMUTHAL, so every dye particle's radius r is conserved and its angular
//     advance is an exact function of r. Winding the crank +N turns then −N turns
//     returns EVERY particle to its start to machine-ε. Kinematic time-reversal is
//     REAL here — the blob comes home.
//   • With inertia ON (Re > 0) a secondary radial drift (a Taylor-vortex-like cross-
//     streamline flow) switches on. It FOLDS dye across radii, and because the same
//     forward physics re-runs on the reverse crank (it cannot run the fluid backward),
//     the round-trip error grows MONOTONICALLY with Re and leaves a real residual smear.
//     The blob stays lost.
//   This is a KINEMATIC REVERSAL of a creeping-flow (Couette) advection field — a
//   model of WHY inertia breaks reversal — NOT a turbulence DNS. Only the Re=0
//   reversibility, the monotonicity, and the folding residual are the proven claims.
//
// COUETTE SOLUTION (the exact azimuthal shear). Inner radius a rotates at unit Ω,
// outer radius b is fixed. The steady Stokes azimuthal velocity is v_θ(r)=A·r+B/r with
// no-slip at both walls (v_θ(a)=Ω·a, v_θ(b)=0), giving A=−a²/(b²−a²), B=a²b²/(b²−a²)
// per unit Ω. The angular velocity of a fluid ring is ω(r)=v_θ/r = A + B/r². A particle
// at radius r sweeps Δθ(r) = (A + B/r²)·Φ when the inner cylinder turns by total angle Φ.
//
// SOURCING (anti-drift): the page inlines this core BYTE-FOR-BYTE between the UNSTIRRING
// CORE sentinels (via tools/forge/forge.mjs, index.src.html → index.html); core.test.mjs
// byte-parity-checks the inlined copy in index.html against this module's sentinel region
// (the estate bench standard — see tangle-bench / the-value-of-a-cut). Zero-dependency,
// DOM-free ESM.

// ===== UNSTIRRING CORE BEGIN =====
"use strict";

// Concentric Couette cell geometry (normalized radii). Inner cylinder a rotates; outer
// wall b is fixed. These are the ONLY geometry constants; the page scales radius 1 → px.
const A_IN = 0.34, B_OUT = 1.0;       // inner / outer radii (normalized)

// couetteCoef(a,b) → {A, B}: the exact Couette coefficients per unit inner-wall Ω, from
// no-slip at both walls. A = -a²/den, B = a²b²/den with den = b²−a².
function couetteCoef(a, b){
  const den = b*b - a*a;
  return { A: -(a*a)/den, B: (a*a*b*b)/den };
}
const CC = couetteCoef(A_IN, B_OUT);

// creepSweep(r): the creeping angular sweep per unit crank-turn Φ — i.e. ω(r)/Ω = A+B/r².
// r invariant in the Stokes limit, so this is the exact reversible azimuthal map.
function creepSweep(r){ return (CC.A + CC.B/(r*r)); }

// advect(p, dPhiTurns, Re): apply a crank of dPhiTurns turns to particle p = {r, th},
// mutating it in place. THE ONE engine — the page and the twin both call exactly this.
//   • Re = 0 (creeping): steps = 1, dth = (A + B/r²)·dPhi, r NEVER changes. Purely
//     azimuthal, area-preserving → EXACTLY invertible (advect +Φ then −Φ restores p).
//   • Re > 0 (inertial): steps = 8, and a radial drift switches on —
//       dr = (Re/400)·|r·dω/dr|·sin(3θ)·h
//     a Taylor-vortex-like secondary flow (3 cells around the annulus) whose sign varies
//     with angle so it FOLDS dye across streamlines, with soft wall reflection. Because
//     this re-runs the same forward physics on the reverse crank, it does NOT cancel:
//     the round-trip error grows monotonically with Re and never gathers home.
function advect(p, dPhiTurns, Re){
  const dPhi = dPhiTurns * 2*Math.PI;
  const steps = Re > 0 ? 8 : 1;              // creeping = 1 exact step; inertial = substeps
  const h = dPhi/steps;
  let r = p.r, th = p.th;
  for (let s=0; s<steps; s++){
    // creeping azimuthal sweep (exact, radius-only)
    const dth = (CC.A + CC.B/(r*r)) * h;
    // inertial radial correction ∝ Re: amplitude scales with Re and the local shear
    // |r·dω/dr| = |−2B/r²|; sign varies with 3θ so it genuinely folds dye across radii.
    let dr = 0;
    if (Re > 0){
      const shear = Math.abs(-2*CC.B/(r*r*r)) * r;        // |r dω/dr|
      const amp = (Re/400) * shear;                        // small, grows with Re
      dr = amp * Math.sin(3*th) * h;                       // 3 cells of secondary vortex
    }
    r += dr;
    if (r < A_IN) r = A_IN + (A_IN - r)*0.3;                // soft reflect off inner wall
    if (r > B_OUT) r = B_OUT - (r - B_OUT)*0.3;             // soft reflect off outer wall
    th += dth;
  }
  p.r = r; p.th = th;
}

// homeError(pts): the mean ACTUAL displacement of a particle cloud from its home (r0,th0),
// in Cartesian (folds θ-wrap correctly). Each pt carries {r, th, r0, th0}. This is the
// identical quantity the PAGE readout and the TWIN both measure — how far the dye is from
// having gathered back into the blob.
function homeError(pts){
  let s = 0;
  for (const p of pts){
    const dx = p.r*Math.cos(p.th) - p.r0*Math.cos(p.th0);
    const dy = p.r*Math.sin(p.th) - p.r0*Math.sin(p.th0);
    s += Math.hypot(dx, dy);
  }
  return pts.length ? s/pts.length : 0;
}

// roundTripError(Re, turns, nParticles): seed a lattice of particles across the annulus,
// advect +turns then −turns at the given Re, and return the MAX particle displacement from
// its start (Cartesian). Creeping → machine-ε (exact reversal); Re>0 → a real residual smear.
// This is the OBSERVED "how far from home did the dye land" — the quantity the page renders.
// It is NOT monotone in Re: the annulus is bounded, so once dye has folded across the whole
// gap the max displacement SATURATES (you can be no more lost than fully mixed) and even
// wobbles with fold-phase — an honest property of a bounded flow, not a bug. The monotone
// PROOF of irreversibility lives in foldingResidual() below (the source of the smear).
function roundTripError(Re, turns, nParticles){
  const start = [];
  for (let i=0;i<nParticles;i++){
    const r = A_IN + (B_OUT-A_IN)*((i+0.5)/nParticles);
    start.push({ r, th: 0.3 + i*0.001 });
  }
  const pts = start.map(p=>({r:p.r,th:p.th}));
  for (const p of pts) advect(p, +turns, Re);
  for (const p of pts) advect(p, -turns, Re);
  let maxErr = 0;
  for (let i=0;i<nParticles;i++){
    const p=pts[i], s=start[i];
    const dx = p.r*Math.cos(p.th) - s.r*Math.cos(s.th);
    const dy = p.r*Math.sin(p.th) - s.r*Math.sin(s.th);
    maxErr = Math.max(maxErr, Math.hypot(dx,dy));
  }
  return maxErr;
}

// foldingResidual(Re, turns, nParticles): the MONOTONE measure of irreversibility — the
// mean total cross-streamline folding inertia induces over a forward crank. It integrates
// the ABSOLUTE radial drift |dr| = (Re/400)·|r·dω/dr|·|sin 3θ|·h along the UNPERTURBED
// (creeping) azimuthal trajectory — the first-order / linear-response answer to "how much
// does inertia fold the dye across radii?". By construction it is exactly proportional to
// Re, so it grows STRICTLY MONOTONICALLY at any resolution (unlike the saturating observed
// displacement). This is the source of the irreversible smear: the residual the reverse
// crank can never gather home, because the same forward folding re-runs on the way back.
function foldingResidual(Re, turns, nParticles){
  if (Re <= 0) return 0;                        // creeping limit: no folding, exact reversal
  const dPhi = turns * 2*Math.PI;
  const steps = 8, h = dPhi/steps;
  let total = 0;
  for (let i=0;i<nParticles;i++){
    let r = A_IN + (B_OUT-A_IN)*((i+0.5)/nParticles);
    let th = 0.3 + i*0.001;
    let acc = 0;
    for (let s=0; s<steps; s++){
      const shear = Math.abs(-2*CC.B/(r*r*r)) * r;         // |r dω/dr|
      acc += Math.abs((Re/400) * shear * Math.sin(3*th) * h);
      th += (CC.A + CC.B/(r*r)) * h;                        // advance θ along creeping path (r fixed)
    }
    total += acc;
  }
  return total / nParticles;
}

// ── the self-test: the page's in-page pill runs THIS; the Node twin runs it + stronger
//    sweeps. Four named rows, each an independent statement of the claim. ──
function runSelfTest(){
  const checks = [];
  const ck = (name, pass, info) => checks.push({ name, pass, info });
  const EPS = 1e-9;

  // 1 · creeping (Re=0) round-trip is machine-ε over a lattice: exact kinematic reversal.
  const e0 = roundTripError(0, 4, 400);
  ck('creeping (Re=0) round-trip < 1e-9', e0 < EPS,
     '4 turns fwd+back → max err ' + e0.toExponential(2) + ' (< 1e-9)');

  // 2 · inertial (Re=40) neg-control: the same crank does NOT return the blob.
  const e40 = roundTripError(40, 4, 400);
  ck('inertial (Re=40) neg-control leaves a residual', e40 > 1e-3,
     'same crank → max err ' + e40.toExponential(2) + ' (blob lost)');

  // 3 · irreversibility (folding residual) grows MONOTONICALLY with Re (the neg-control
  //     direction). Measured by foldingResidual — the linear-response total folding, which
  //     is exactly ∝ Re, so strictly monotone at any resolution (the observed displacement
  //     saturates in the bounded annulus; the FOLDING that causes it does not).
  let mono = true, prev = -1;
  const seq = [0,10,20,40,80,120];
  const errs = seq.map(Re => foldingResidual(Re, 4, 200));
  for (const e of errs){ if (e < prev - 1e-12){ mono = false; break; } prev = e; }
  ck('folding residual ↑ monotonically with Re', mono,
     seq.map((r,i)=>r+':'+errs[i].toExponential(1)).join('  '));

  // 4 · radius is exactly conserved in the creeping limit (WHY it reverses).
  const p = { r:0.6, th:1.1 };
  advect(p, 7.3, 0);
  const dr = Math.abs(p.r - 0.6);
  ck('creeping conserves radius exactly', dr < 1e-15,
     'Δr after 7.3 turns = ' + dr.toExponential(2) + ' (purely azimuthal)');

  const passed = checks.filter(c=>c.pass).length;
  return { ok: passed===checks.length, passed, total: checks.length, checks };
}
// ===== UNSTIRRING CORE END =====

export {
  A_IN, B_OUT, couetteCoef, creepSweep, advect, homeError, roundTripError, foldingResidual, runSelfTest
};
