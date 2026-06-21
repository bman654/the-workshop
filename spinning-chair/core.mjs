// ===== SPINNING-CHAIR CORE (inlined byte-twin) BEGIN =====
// ── THE SPINNING CHAIR — physics authority for "pull your arms in, spin faster".
//    This block is the SOLE AUTHORITY; a Node twin (core.test.mjs) re-extracts it
//    byte-for-byte between sentinels and the in-page chip calls the SAME
//    runSelfTest(). The renderer draws the skater's SPIN from this authority —
//    the motion-blur fan's reach and spread ARE inertia(r) and ω(r), never a
//    plotted curve and never an eased fake momentum. ─────────────────────────────
//
// THE LAW. A figure skater spins on one blade on a free, frictionless pivot,
// arms held straight out holding two brass weights — two point masses m on
// massless rigid arms at radius r about a body of fixed moment I₀. The moment of
// inertia of the whole rotor is
//   I(r) = I₀ + 2·m·r².                                    (inertia of the rotor)
// The pivot is free: no external torque acts, so angular momentum L = I·ω is
// CONSERVED at every instant of the pull. Pin it at the arms-out radius A:
//   L₀ = I(A)·ω_A.                                          (the pinned momentum)
// Therefore the spin at any radius is forced — it is not a knob, it FALLS OUT of
// conservation:
//   ω(r) = L₀ / I(r).                                       (ω is algebraic in r)
// Pull the arms in (r: A→B, B<A) and I shrinks, so ω rises by EXACTLY the inverse
// ratio — the spin-up is a pure consequence of L being kept:
//   ω(B)/ω(A) = I(A)/I(B).                                  (the spin-up ratio)
// "She made herself small, and the world sped up."
//
// THE ENERGY. L is conserved but kinetic energy is NOT — it rises as you pull in:
//   KE(r) = ½·I(r)·ω(r)² = ½·L₀²/I(r).                      (rises as I falls)
//   ΔKE   = ½·L₀²·(1/I(B) − 1/I(A)) > 0  for B < A.         (closed form)
// Nothing was added to the spin; the extra energy is the WORK your arms did,
// pulling the weights inward against their centrifugal fling. At radius r each
// weight demands a centripetal force m·ω(r)²·r to stay on its (shrinking) circle;
// your hands supply it, and the work done retracting BOTH weights from A to B is
//   W = ∫_B^A 2·m·ω(r)²·r dr   (positive — you pull inward, the force resists),
// using the conservation-consistent ω(r)=L₀/I(r) at every r. That integral equals
// ΔKE to machine precision — energy in = energy stored. (claim 3, the one integral
// you must get right: the radial force is the *instantaneous* centripetal demand,
// not a naive constant.)
//
// THE NEG-CONTROL (the teeth) — CLAMP TO A MOTOR. Bolt the pivot to an external
// motor that drives a FIXED ω. Now the pivot is no longer free, an external torque
// acts, and L is NO LONGER YOURS TO KEEP. Pulling the arms in changes the spin NOT
// AT ALL (the motor pins ω), and the momentum
//   L_clamped(r, ω_fix) = I(r)·ω_fix
// VARIES with r — its ratio L_clamped(B)/L_clamped(A) = I(B)/I(A) ≠ 1 by a margin
// bounded from zero for B<A, exactly INVERTING the free-pivot behaviour (where ω
// varied and L held; here ω holds and L varies). The motor is pouring/eating
// angular momentum. runSelfTest proves the clamp does the OPPOSITE of the free
// pivot on a non-empty band — so the suite cannot pass vacuously, with equality
// only at r=A before any pull.
//
// HONESTY. Two point masses m on massless rigid arms, a frictionless bearing,
// quasi-static retraction so L is exactly conserved at every instant. A real
// skater's distributed arm/torso mass means the literal ω-ratio differs — the law
// is exact only for this point-mass model. The motion-blur fan persistence and any
// weight-trail pitch are RENDERING choices and enter NO tested number; ω, L, KE, I
// are all exact core values. ω is reported as illustrative turns/sec for feel.

export const I0 = 1.2;          // I₀: body moment of inertia (kg·m²), fixed
export const M  = 4.0;          // m: each hand weight (kg)
export const A  = 0.78;         // arms-out radius (m) — the start of the pull
export const B  = 0.16;         // arms-tucked radius (m) — the end of the pull
export const OMEGA_A = 1.6;     // ω at arms-out (rad/s) — sets L₀ via conservation

// ── INERTIA — I(r) = I₀ + 2 m r². The rotor's moment at hand-radius r. ──────────
// Strictly increasing in r (arms out = sluggish, arms in = nimble). This single
// function carries the whole story: ω, KE and L all ride on it.
export function inertia(r, i0=I0, m=M){
  return i0 + 2*m*r*r;
}

// ── THE PINNED ANGULAR MOMENTUM — L₀ = I(A)·ω_A on the free pivot. ──────────────
// The conserved invariant of the whole pull. Computed once at the arms-out radius.
export function L0(i0=I0, m=M, a=A, omegaA=OMEGA_A){
  return inertia(a, i0, m) * omegaA;
}

// ── THE SPIN — ω(r) = L₀ / I(r). FORCED by conservation, never a free knob. ─────
// As r shrinks I shrinks so ω rises; this is the SAME number the fan's blur-width
// is drawn from. No integration, no easing — pure algebra in r.
export function omegaAt(r, i0=I0, m=M, a=A, omegaA=OMEGA_A){
  return L0(i0, m, a, omegaA) / inertia(r, i0, m);
}

// ── THE KINETIC ENERGY — KE(r) = ½ I(r) ω(r)² = ½ L₀²/I(r). Rises as you pull. ──
// L is kept but KE is not: the deficit/surplus is the arm-work. Equivalent closed
// form ½L₀²/I(r) used so the algebra is exact and obvious.
export function keOf(r, i0=I0, m=M, a=A, omegaA=OMEGA_A){
  const L = L0(i0, m, a, omegaA);
  return 0.5 * L*L / inertia(r, i0, m);
}

// ── THE ENERGY CHANGE — ΔKE = ½ L₀² (1/I(rb) − 1/I(ra)), closed form. ───────────
// Positive for rb<ra (pulling in). This is the work your arms did; claim 3 checks
// it === keOf(rb)−keOf(ra) AND === the numeric centripetal-arm-work integral.
export function dKE(rb, ra=A, i0=I0, m=M, a=A, omegaA=OMEGA_A){
  const L = L0(i0, m, a, omegaA);
  return 0.5 * L*L * (1/inertia(rb, i0, m) - 1/inertia(ra, i0, m));
}

// ── THE ARM-WORK INTEGRAL — W = ∫ 2 m ω(r)² r dr over the pull (rb→ra). ─────────
// The work done supplying the centripetal demand of BOTH weights as they are
// retracted, using the conservation-consistent ω(r)=L₀/I(r) at every r. Computed
// by composite Simpson on a dense grid; claim 3 asserts it === dKE to <1e-9. This
// is the integral that closes the energy book: force is the INSTANTANEOUS demand
// m·ω(r)²·r, not a naive constant — get this wrong and energy doesn't balance.
export function armWork(rb, ra=A, i0=I0, m=M, a=A, omegaA=OMEGA_A, n=20000){
  // ∫_rb^ra 2 m ω(r)² r dr  (rb<ra ⇒ pulling in ⇒ positive work). We integrate
  // from rb to ra and the result is the work the arms did over the full pull.
  const f = (r) => {
    const w = omegaAt(r, i0, m, a, omegaA);
    return 2*m*w*w*r;
  };
  const N = n % 2 === 0 ? n : n+1;          // Simpson needs an even interval count
  const h = (ra - rb) / N;
  let s = f(rb) + f(ra);
  for(let i=1; i<N; i++){
    const r = rb + i*h;
    s += (i % 2 ? 4 : 2) * f(r);
  }
  return s * h / 3;
}

// ── THE NEG-CONTROL (the teeth) — CLAMP TO A MOTOR: L is NOT yours to keep. ─────
// On a pivot bolted to a motor driving a FIXED ω, L = I(r)·ω_fix VARIES with r.
// The motor pins ω (so the slider does nothing to the spin) while pouring/eating
// angular momentum. The exact inverse of the free pivot, where ω varied and L held.
export function Lclamped(r, omegaFixed, i0=I0, m=M){
  return inertia(r, i0, m) * omegaFixed;
}

// ── illustrative turns/sec (a feel readout, NOT a tested number) ─────────────────
export function turnsPerSec(omega){ return omega / (2*Math.PI); }

// ── THE SELF-TEST. The Node twin and the in-page chip call THIS. ──────────────────
export function runSelfTest(){
  const checks = [];
  const ck = (name, ok) => checks.push({ name, ok: !!ok });
  const EPS = 1e-9;

  // a dense r-sweep across the whole pull A→B, and several model parameterisations.
  const sweep = (a, b, n=400) => { const xs=[]; for(let i=0;i<=n;i++) xs.push(a + (b-a)*i/n); return xs; };
  const PARAMS = [
    // [i0, m, a, b, omegaA]
    [1.2, 4.0, 0.78, 0.16, 1.6],
    [0.6, 2.5, 0.95, 0.20, 2.4],
    [2.0, 6.0, 0.70, 0.10, 1.0],
    [1.0, 3.0, 1.10, 0.30, 3.1],
    [0.4, 1.5, 0.60, 0.05, 0.8],
  ];

  // (1) INVARIANCE: L = I(r)·ω(r) === L₀ for EVERY r across the whole pull (<1e-9).
  {
    let worst = 0, n = 0;
    for(const [i0,m,a,b,wA] of PARAMS){
      const L = L0(i0,m,a,wA);
      for(const r of sweep(a,b)){
        const Lr = inertia(r,i0,m) * omegaAt(r,i0,m,a,wA);
        worst = Math.max(worst, Math.abs(Lr - L));
        n++;
      }
    }
    ck('(1) INVARIANCE: I(r)·ω(r) === L₀ for every r across the full pull A→B (|ΔL|<1e-9, '+n+' radii)', worst < EPS);
  }

  // (2) SPIN-UP RATIO EXACT: ω(B)/ω(A) === I(A)/I(B) to <1e-9, AND it is a real
  // spin-UP (ratio>1) because B<A so I(B)<I(A). Checked over every pair (a, r).
  {
    let worst = 0, everSpedUp = false, n = 0;
    for(const [i0,m,a,b,wA] of PARAMS){
      for(const r of sweep(a,b)){
        if(r >= a) continue;                       // r strictly inside the pull
        const ratioOmega = omegaAt(r,i0,m,a,wA) / omegaAt(a,i0,m,a,wA);
        const ratioInert = inertia(a,i0,m) / inertia(r,i0,m);
        worst = Math.max(worst, Math.abs(ratioOmega - ratioInert));
        if(ratioOmega > 1 + 1e-6) everSpedUp = true;
        n++;
      }
    }
    ck('(2) SPIN-UP RATIO EXACT: ω(r)/ω(A) === I(A)/I(r) to <1e-9, and a true spin-UP (ratio>1) as arms tuck ('+n+' radii)', worst < EPS && everSpedUp);
  }

  // (3) ENERGY === WORK: dKE(B) === keOf(B)−keOf(A) (===, exact closed form) AND
  // === the numeric centripetal arm-work integral (<1e-9) AND strictly >0 for B<A.
  {
    let worstClosed = 0, worstWork = 0, allPositive = true, n = 0;
    for(const [i0,m,a,b,wA] of PARAMS){
      const dk = dKE(b,a,i0,m,a,wA);
      const byKE = keOf(b,i0,m,a,wA) - keOf(a,i0,m,a,wA);
      worstClosed = Math.max(worstClosed, Math.abs(dk - byKE));
      const W = armWork(b,a,i0,m,a,wA,20000);     // ∫ 2 m ω(r)² r dr, rb→ra
      worstWork = Math.max(worstWork, Math.abs(dk - W));
      if(!(dk > 0)) allPositive = false;
      n++;
    }
    ck('(3a) ENERGY closed-form EXACT: dKE(B) === keOf(B)−keOf(A) (|Δ|<1e-9 over '+n+' models)', worstClosed < EPS);
    ck('(3b) ENERGY = WORK: dKE(B) === ∫ 2mω(r)²r dr (the centripetal arm-work, |Δ|<1e-9)', worstWork < EPS);
    ck('(3c) and the spin-up COSTS energy: dKE(B) > 0 strictly for B<A (your arms did the work)', allPositive);
  }

  // (4) NEG-CONTROL TEETH — CLAMP TO A MOTOR. Under a fixed-ω motor: (a) the spin
  // is CONSTANT in r (the slider does nothing, Δω===0 along the pull), exactly
  // INVERTING the free pivot; AND (b) L_clamped VARIES — its ratio === I(B)/I(A)
  // ≠ 1 by a margin bounded from zero for B<A (L measurably NOT pinned), with
  // equality only at r=A. A non-empty disagreement: the suite cannot pass vacuously.
  {
    let omegaFlatAllr = true, ratioMatches = 0, marginBounded = true, equalAtA = true, n = 0;
    let worstRatio = 0;
    for(const [i0,m,a,b,wA] of PARAMS){
      const omegaFix = 4.2;                        // the motor's driven spin (any fixed ω)
      // (a) under the clamp the spin is literally constant — the slider is dead.
      let prevDrawn = null;
      for(const r of sweep(a,b)){
        const drawnOmega = omegaFix;               // motor pins ω regardless of r
        if(prevDrawn !== null && drawnOmega !== prevDrawn) omegaFlatAllr = false;
        prevDrawn = drawnOmega;
      }
      // (b) L_clamped ratio over the pull === I(B)/I(A), and is ≠1 by a real margin.
      const Lb = Lclamped(b, omegaFix, i0, m), La = Lclamped(a, omegaFix, i0, m);
      const ratioL = Lb / La;
      const ratioI = inertia(b,i0,m) / inertia(a,i0,m);
      worstRatio = Math.max(worstRatio, Math.abs(ratioL - ratioI));
      if(Math.abs(ratioL - ratioI) < EPS) ratioMatches++;
      if(!(ratioL < 1 - 1e-3)) marginBounded = false;   // bounded away from 1 (L shrank)
      // equality only at r=A: L_clamped(A)/L_clamped(A) === 1 exactly.
      if(Lclamped(a, omegaFix, i0, m) / La !== 1) equalAtA = false;
      n++;
    }
    ck('(4a) CLAMP kills the slider: under a fixed-ω motor the spin is CONSTANT in r (Δω≡0) — the free-pivot magic vanishes', omegaFlatAllr);
    ck('(4b) CLAMP breaks L: L_clamped(B)/L_clamped(A) === I(B)/I(A) ≠ 1 by a margin bounded from zero ('+ratioMatches+'/'+n+' models, |Δratio|<1e-9)', ratioMatches===n && worstRatio<EPS && marginBounded);
    ck('(4c) equality ONLY at r=A: L_clamped(A)/L_clamped(A) === 1 exactly (the teeth bite only once the pull begins)', equalAtA);
  }

  const pass = checks.filter(c=>c.ok).length;
  return { pass, total: checks.length, checks };
}
// ===== SPINNING-CHAIR CORE (inlined byte-twin) END =====

// ── direct-run main guard: `node core.mjs` prints the self-test and exits non-zero
//    on any failure (so "node core.mjs green" is literal). Inert when imported, and
//    avoids `import.meta` so the SAME file inlines cleanly into a non-module <script>
//    (where `process` is undefined and the guard short-circuits to false). ──────────
if (typeof process !== 'undefined' && process.argv && /(^|\/)core\.mjs$/.test(process.argv[1] || '') && !process.argv[1].includes('core.test')) {
  const r = runSelfTest();
  for (const c of r.checks) console.log((c.ok ? '  ✓ ' : '  ✗ ') + c.name);
  console.log(`\n${r.pass}/${r.total} ${r.pass === r.total ? '✓ ALL GREEN' : '✗ FAILURES'}`);
  process.exit(r.pass === r.total ? 0 : 1);
}
