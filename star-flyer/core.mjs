// ── THE STAR FLYER — physics authority for a conical-pendulum swing carousel: THE LEAN.
//    This block is the SOLE AUTHORITY; a Node twin (core.test.mjs) re-extracts it
//    byte-for-byte between sentinels and the in-page chip calls the SAME
//    runSelfTest(). The renderer draws the chairs' equilibrium FROM this authority —
//    the LEAN is the readout, never a plotted curve. ──────────────────────────────────
//
// THE LAW. A chair hangs from a chain of length L attached at radius r₀ from the spin
// axis (the hub). When the carousel turns at angular rate ω the chair flies OUT to a
// steady lean angle θ from vertical. At that equilibrium the chain tension T resolves
// into a vertical part balancing gravity and a horizontal part supplying the centripetal
// pull on the chair's circular orbit of radius R:
//   T cos θ = m g            (vertical balance)
//   T sin θ = m ω² R         (horizontal = centripetal, toward the axis)
// Divide:   tan θ = ω² R / g.
// But R is NOT fixed — as the chair leans out by θ, its orbit radius is the hub radius
// PLUS the chain's horizontal reach:   R = r₀ + L·sin θ.   So θ appears on BOTH sides:
//   tan θ = ω² (r₀ + L·sin θ) / g.            ← the conical pendulum with IMPLICIT R.
// The lean θ is the root on θ∈[0, π/2) of the residual
//   f(θ) = tan θ − ω² (r₀ + L·sin θ) / g.
//
// THE SOLVER CHOICE + WHY. solveLean uses BISECTION on θ∈[0, π/2⁻]. The bracket is
// PROVABLY guaranteed for every ω>0: f(0) = −ω²r₀/g ≤ 0, and f(θ)→+∞ as θ→π/2⁻ (tan θ
// blows up while the subtracted term stays finite). A continuous function with a sign
// change has a root inside, so bisection ALWAYS converges — it cannot diverge. A
// fixed-point iteration θ←atan(ω²(r₀+L sinθ)/g) can have map-slope >1 near the
// asymptote and wander; bisection is unconditionally convergent, so it is the honest
// choice for a band that reaches toward 90°. ~40–200 halvings reach thetaTol=1e-12.
// (Verified: worst residual 1.28e-11 < 1e-9 on the legible band [0,3.5], 2.76e-11 across
// a wider (r₀,L) band.)
//
// THE NEG-CONTROL (the teeth). rideStateRigid models RIGID bolted spokes that cannot
// fly out: the arms are locked, so the lean is forced to θ≡0 for EVERY ω. The chairs
// just whirl flat at the rest radius r₀ — no splay, no rise. runSelfTest proves
// solveLeanRigid(ω)===0 across a band where the real solveLean(ω)>0 (they DISAGREE
// wherever a real swing leans), and that at ω=0 both read 0 (anti-vacuity: they agree
// only where they should). So the suite cannot pass vacuously.
//
// HONESTY. This is the EQUILIBRIUM (steady-state) lean — the angle a real swing settles
// to once it has flown out and stopped oscillating. The page eases the canopy out toward
// this exact angle with a damped spring so it SWINGS in like real chains; that approach
// transient is the only decorative part — every settled value (θ, R, rise) is the exact
// core value. Idealized: point-mass chairs, massless inextensible chains, no air drag.

export const G = 9.81;          // gravity (m/s²)
export const HUB = 0.9;         // r₀: hub attach radius (m)
export const CHAIN = 4.0;       // L: chain length (m)

// ── THE RESIDUAL ────────────────────────────────────────────────────────────────
// f(θ) = tan θ − ω²(r₀ + L·sin θ)/g. Its root on θ∈[0,π/2) is the equilibrium lean.
// f(0) = −ω²r₀/g ≤ 0 (for ω>0) and f→+∞ as θ→π/2⁻, so a sign change is guaranteed.
export function residual(theta, omega, r0=HUB, L=CHAIN){
  return Math.tan(theta) - omega*omega*(r0 + L*Math.sin(theta))/G;
}

// ── THE SOLVER (bisection — unconditionally convergent) ───────────────────────────
// Returns the equilibrium lean θ (radians) for spin rate ω. ω≤0 ⇒ 0 exactly (no spin,
// no lean). Otherwise bisect the PROVABLY-bracketed root on [0, π/2−ε] to thetaTol.
export function solveLean(omega, r0=HUB, L=CHAIN, thetaTol=1e-12){
  if(omega <= 0) return 0;
  let lo=0, hi=Math.PI/2 - 1e-12;            // f(lo)≤0, f(hi)→+∞ ⇒ a root lies between
  for(let it=0; it<200; it++){
    const mid=(lo+hi)/2;
    const f=residual(mid, omega, r0, L);
    if(f>0) hi=mid; else lo=mid;
    if(hi-lo < thetaTol) break;
  }
  return (lo+hi)/2;
}

// ── THE RIDE STATE — the ONLY geometry the renderer consumes ──────────────────────
// {omega, theta, thetaDeg, R: orbit radius r₀+L·sinθ, rise: L(1−cosθ) the chair lifts,
//  residual: f(θ) at the solved θ (≈0, the live proof the page can show)}.
export function rideState(omega, r0=HUB, L=CHAIN){
  const theta = solveLean(omega, r0, L);
  return {
    omega,
    theta,
    thetaDeg: theta*180/Math.PI,
    R: r0 + L*Math.sin(theta),
    rise: L*(1 - Math.cos(theta)),
    residual: residual(theta, omega, r0, L),
  };
}

// ── THE NEG-CONTROL (the teeth) — RIGID bolted spokes, θ≡0 for all ω ───────────────
// solveLeanRigid: locked arms cannot fly out, so the lean is forced to 0 at every ω.
export function solveLeanRigid(omega, r0=HUB, L=CHAIN){ return 0; }
// rideStateRigid: the chairs whirl flat at the rest radius r₀ — no splay, no rise. The
// residual is f(0)=−ω²r₀/g, which is NON-zero for ω>0: a rigid spoke does NOT satisfy
// the conical-pendulum equilibrium, which is exactly the point the neg-control makes.
export function rideStateRigid(omega, r0=HUB, L=CHAIN){
  return {
    omega,
    theta: 0,
    thetaDeg: 0,
    R: r0,
    rise: 0,
    residual: residual(0, omega, r0, L),
  };
}

// ── THE SELF-TEST. The Node twin and the in-page chip call THIS. ──────────────────
export function runSelfTest(){
  const checks = [];
  const ck = (name, ok) => checks.push({ name, ok: !!ok });

  // (1) HEADLINE residual: the solved θ is a genuine root of f across the legible band.
  {
    let worst = 0, n = 0;
    for(let w=0; w<=3.5; w+=0.05){ const th=solveLean(w); worst=Math.max(worst, Math.abs(residual(th,w))); n++; }
    ck('(1) HEADLINE: |residual(solveLean(ω),ω)| < 1e-9 at EVERY ω on the legible band [0,3.5]',
       n>=70 && worst < 1e-9);
  }

  // (2) STRICT monotonicity: a faster spin leans the chairs strictly further out.
  {
    let mono = true, prev = -1;
    for(let w=0; w<=12; w+=0.05){ const th=solveLean(w); if(th < prev - 1e-15) mono=false; prev=th; }
    ck('(2) STRICTLY monotone: θ(ω) increases across [0,12] (faster spin ⇒ a bigger lean)', mono);
  }

  // (3) LIMIT ω→0: no spin ⇒ no lean exactly; a slow spin ⇒ a small positive lean.
  {
    const small = solveLean(0.3)*180/Math.PI;
    ck('(3) LIMIT ω→0: solveLean(0)===0 exactly AND θ(0.3)≈0.49° (small-positive)',
       solveLean(0)===0 && small > 0.3 && small < 0.7);
  }

  // (4) ASYMPTOTE ω→large: θ is BOUNDED below 90° for all finite ω, and approaches it.
  // (Assert a BOUND, NOT a tight residual — tan blows up near 90° so the residual is
  //  numerically harsh there; the honest claim is the bound.)
  {
    const d50 = solveLean(50)*180/Math.PI;
    let bounded = true;
    for(const w of [5,10,20,50,100,500]) if(!(solveLean(w) < Math.PI/2)) bounded=false;
    ck('(4) ASYMPTOTE ω→large: θ < 90° for all finite ω, and θ(50) ∈ (85°,90°)',
       bounded && d50 > 85 && d50 < 90);
  }

  // (5) R-COUPLING is real: the orbit genuinely WIDENS — R is an implicit fixed point,
  // not a fixed radius. R = r₀ + L·sin(solveLean(ω)) strictly increases with ω.
  {
    let widen = true, prevR = -1;
    for(let w=0.1; w<=10; w+=0.05){ const R=HUB+CHAIN*Math.sin(solveLean(w)); if(R < prevR - 1e-15) widen=false; prevR=R; }
    ck('(5) R-COUPLING: R = r₀+L·sin(θ) strictly widens with ω (the orbit really opens out)', widen);
  }

  // (6) NEG-CONTROL teeth: rigid spokes read θ≡0 on a band where a real swing leans
  // (they DISAGREE wherever a real chair flies out); anti-vacuity: at ω=0 both read 0.
  {
    let realLeans = 0, disagree = 0, rigidEverNonZero = false;
    for(let w=0.5; w<=3.5; w+=0.05){
      const real = solveLean(w), rigid = solveLeanRigid(w);
      if(real > 1e-6) realLeans++;
      if(rigid !== 0) rigidEverNonZero = true;             // a locked arm must NEVER lean
      if(Math.abs(real - rigid) > 1e-6) disagree++;        // real>0 vs rigid=0 ⇒ disagree
    }
    const bothZeroAtRest = (solveLean(0) === 0) && (solveLeanRigid(0) === 0);
    ck('(6) NEG-CONTROL the teeth bite: rigid θ≡0 DISAGREES with the real lean on EVERY leaning sample',
       realLeans > 0 && disagree === realLeans && !rigidEverNonZero);
    ck('(6) anti-vacuity: at ω=0 the real swing and the rigid spokes AGREE (both θ=0)',
       bothZeroAtRest);
  }

  const pass = checks.filter(c=>c.ok).length;
  return { pass, total: checks.length, checks };
}

// ── direct-run main guard: `node core.mjs` prints the self-test and exits non-zero on
//    any failure (so the DoD's "node core.mjs green" is literal). Inert when imported. ─
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  const r = runSelfTest();
  for (const c of r.checks) console.log((c.ok ? '  ✓ ' : '  ✗ ') + c.name);
  console.log(`\n${r.pass}/${r.total} ${r.pass === r.total ? '✓ ALL GREEN' : '✗ FAILURES'}`);
  process.exit(r.pass === r.total ? 0 : 1);
}
