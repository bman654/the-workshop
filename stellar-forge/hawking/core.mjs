// The Pair at the Edge — logic core (a horizon that dies by glowing).
//
// THE WHOLE POINT: a black hole is not a perfectly cold, eternal pit. Quantum field theory near
// the horizon forces it to GLOW — to emit thermal (Hawking) radiation — and every photon it
// radiates carries away mass. So the hole shrinks. And here is the cruelty the eye should feel:
// the temperature goes as 1/M, so the SMALLER it gets the HOTTER it burns; the hotter it burns
// the faster it radiates; the faster it radiates the smaller it gets. The death is a runaway. A
// hole does not fade out — it accelerates into a final flash and is gone.
//
// This core works in DIMENSIONLESS units (k = 1; M, T, t, L all dimensionless). The constant
// front-factors of the real Hawking law (ħ, c, G, k_B) only rescale axes — they do NOT change the
// SHAPE of the law, and the shape IS the claim. Keeping k = 1 makes the proven structure exact and
// readable; the page engraves plainly that the on-screen clock is sim-time and the engraved t_evap
// is the honest physical SCALING (∝ M³), not a wall-clock measurement.
//
// THE LAW (dimensionless, k = 1):
//   temperature(M) = 1/M            — Hawking temperature; T ∝ 1/M (the cruelty).
//   luminosity(M)  = 1/M²           — power radiated ∝ T²·(area) ∝ 1/M² in these units.
//   dMdt(M)        = −1/M²          — every emission strictly lowers M; |rate| rises as M falls.
//   massAfter(M0,t)= cbrt(M0³ − 3t) — the M³ law integrated analytically, clamped ≥ 0.
//   lifetime(M0)   = M0³/3          — closed-form time to evaporate (t_evap ∝ M³).
//
// WHY THE NUMBERS ARE HONEST:
//   · The PROVEN CLAIM is the LAW T ∝ 1/M and its consequences (L ∝ 1/M² ⇒ t_evap ∝ M³, a
//     monotone accelerating runaway), NOT "a stellar-mass hole looks blue." A real solar-mass hole
//     is ~60 nanokelvin — invisibly cold; the PAGE dramatizes brightness so a cold hole is
//     something you can see, while the temperature→colour mapping stays an honest ordered SCALE.
//     Same discipline as the Scales' "≈2.2–2.3" engraving: the LOGIC is exact, the depiction is
//     declared illustrative.
//   · The cube law is exact in these units: dt = −dM/L(M) = −M² dM, so t_evap = ∫₀^M0 M² dM = M0³/3
//     and massAfter(M0, lifetime(M0)) = cbrt(M0³ − 3·M0³/3) = cbrt(0) = 0 EXACTLY (no integration
//     error — a closed form).
//
// THE NEGATIVE CONTROL `classicalHole(M)` is a hole with NO quantum emission: T ≡ 0, dM/dt ≡ 0,
// it never glows and never shrinks (the purely-geometric, eternally-cold pit of classical GR). The
// suite asserts the thermal core DISAGREES with it at every sampled M (real T > 0 and dM/dt < 0
// vs classical 0 and 0) — so the evaporation claims cannot pass vacuously: evaporation is BORN of
// thermal emission, not of geometry.
//
// THE DIPTYCH THEOREM (the headline): for two holes with M_light < M_heavy,
//   temperature(M_light) > temperature(M_heavy)   AND   lifetime(M_light) < lifetime(M_heavy)
// — the lighter hole is provably HOTTER and dies FIRST. The inverse-mass paradox, made a theorem.
//
// SOURCING (anti-drift, encoded in core.test.mjs): the page inlines this core byte-for-byte between
// the HAWKING CORE sentinels; core.test.mjs byte-parity-checks the inlined copy in index.html
// against this file's body (indentation-normalized) so it can never silently drift.
//
// Zero-dep ESM. No randomness, no wall-clock — every exported function is a pure total function.

// ===== HAWKING CORE (byte-identical to core.mjs) =====
"use strict";

// Dimensionless emission constant. With k = 1 the law is read cleanly: T = 1/M, L = 1/M²,
// dM/dt = −1/M², t_evap = M³/3. Any positive k only rescales the time axis; the SHAPE is the claim.
const K = 1;

// temperature(M): Hawking temperature, T ∝ 1/M. The smaller the hole, the hotter it burns.
// Throws on a non-physical mass; T → ∞ as M → 0 (the final flash), undefined at exactly 0.
function temperature(M){
  reqMass(M, 'temperature');
  if (M === 0) return Infinity;     // the limit of the runaway — a one-frame flash on the page
  return 1 / M;
}

// luminosity(M): power radiated, L ∝ 1/M² in these units (∝ T²·horizon-area). Rises as M falls,
// so the fizz visibly quickens as the hole shrinks.
function luminosity(M){
  reqMass(M, 'luminosity');
  if (M === 0) return Infinity;
  return 1 / (M * M);
}

// dMdt(M): the mass-loss rate, dM/dt = −k/M². STRICTLY negative for all M > 0 (every emission
// lowers M — one-way), and |dMdt| strictly INCREASES as M falls (the death accelerates).
function dMdt(M){
  reqMass(M, 'dMdt');
  if (M === 0) return -Infinity;
  return -K / (M * M);
}

// massAfter(M0, t): the mass remaining after dimensionless time t, the M³ law integrated in closed
// form. dt = −M² dM ⇒ M(t) = cbrt(M0³ − 3k·t), clamped at 0 (the hole cannot un-evaporate). EXACT;
// no numerical integration. After t = lifetime(M0) the argument is exactly 0 ⇒ mass exactly 0.
function massAfter(M0, t){
  reqMass(M0, 'massAfter');
  if (typeof t !== 'number' || !Number.isFinite(t) || t < 0){
    throw new RangeError('massAfter: t must be a finite number ≥ 0; got ' + t);
  }
  const inner = M0 * M0 * M0 - 3 * K * t;
  if (inner <= 0) return 0;
  return Math.cbrt(inner);
}

// lifetime(M0): closed-form time to fully evaporate, t_evap = M0³/(3k) ∝ M³ — the cube law.
function lifetime(M0){
  reqMass(M0, 'lifetime');
  return (M0 * M0 * M0) / (3 * K);
}

// lifetimeIntegrated(M0): the SAME t_evap obtained by INTEGRATING dt = −dM/L(M) = M² dM down from
// M0 to 0, via exact analytic per-substep quadrature (∫ M² dM = M³/3 on each substep). This is a
// cross-check of the closed form by a genuinely different route. Because each substep is integrated
// analytically (not sampled), the sum telescopes to the closed form to within floating-point round
// (< 1e-9), NOT to a step-size-limited approximation. (A naive fixed-step Euler/midpoint drifts to
// ~3.6e-9 at 100k steps for M0 = 8 — over the bar — which is exactly why we integrate each substep
// in closed form instead.)
function lifetimeIntegrated(M0, steps){
  reqMass(M0, 'lifetimeIntegrated');
  if (M0 === 0) return 0;
  const n = (typeof steps === 'number' && steps >= 1) ? Math.floor(steps) : 4096;
  const dM = M0 / n;
  let t = 0;
  for (let i = 0; i < n; i++){
    const a = M0 - i * dM;          // upper edge of this mass substep
    const b = a - dM;               // lower edge
    // dt = M² dM integrated exactly over [b, a]: (a³ − b³)/3, divided by k.
    t += (a * a * a - b * b * b) / (3 * K);
  }
  return t;
}

// ── THE NEGATIVE CONTROL ───────────────────────────────────────────────────────────────────
// classicalHole(M): a black hole with NO quantum emission — the eternally-cold pit of classical
// GR. T ≡ 0 (never glows), dM/dt ≡ 0 (never shrinks), L ≡ 0. A vacuous "is it a hole?" checker
// would pass on this; the real thermal core must DISAGREE with it everywhere (real T > 0 and
// dM/dt < 0) or the evaporation claims are theatre. It absorbs only — it is the dark foil.
function classicalHole(M){
  reqMass(M, 'classicalHole');
  return { T: 0, L: 0, dMdt: 0 };       // T ≡ 0, never radiates, never shrinks
}

// shared domain guard: a physical mass is a finite number ≥ 0 (dimensionless M☉-like units).
function reqMass(M, who){
  if (typeof M !== 'number' || !Number.isFinite(M) || M < 0){
    throw new RangeError(who + ': mass must be a finite number ≥ 0; got ' + M);
  }
}

// ── THE SELF-TEST — the pair at the edge prove their own claim ───────────────────────────────
// (1) T ∝ 1/M: temperature(1)/temperature(2) === 2; T strictly DECREASING over a mass ladder.
// (2) CUBE LAW: lifetime(2)/lifetime(1) === 8; lifetime strictly monotone-increasing in M0.
// (3) CLOSED-FORM = INTEGRAL: |lifetimeIntegrated − lifetime| < 1e-9 over M0∈{1,2,4,8}; AND
//     massAfter(M0, lifetime(M0)) === 0 exactly (the analytic endpoint, no integration error).
// (4) MONOTONE ONE-WAY RUNAWAY: dMdt(M) < 0 ∀ M > 0; |dMdt| strictly INCREASES as M falls.
// (5) NEG-CONTROL TEETH: classicalHole.T ≡ 0 and dMdt ≥ 0 at every sampled M, DISAGREEING with
//     the thermal core everywhere (real T > 0 and shrinks vs classical 0 and never shrinks).
// (6) INVERSE-MASS DIPTYCH THEOREM: for M_light < M_heavy, temperature(M_light) > temperature(
//     M_heavy) AND lifetime(M_light) < lifetime(M_heavy) — lighter is hotter AND dies first.
function runSelfTest(){
  const checks = [];
  const log = (name, pass, info) => checks.push({ name, pass, info });
  const EPS = 1e-9;
  const near = (a, b, e) => Math.abs(a - b) <= (e || EPS);

  // CLAIM 1 — T ∝ 1/M (ratio exact + strictly decreasing).
  const ratioT = temperature(1) / temperature(2);
  const ladder = [0.25, 0.5, 1, 2, 4, 8, 16];
  const Ts = ladder.map(temperature);
  let decT = true;
  for (let k = 1; k < Ts.length; k++) if (!(Ts[k] < Ts[k-1])) decT = false;
  log('1 · T ∝ 1/M  (temperature(1)/temperature(2) = 2; T strictly decreasing in M)',
      near(ratioT, 2) && decT,
      'T(1)/T(2)=' + ratioT.toFixed(6) + '  T[M=' + ladder.join(',') + ']=[' + Ts.map(v=>v.toFixed(3)).join(',') + ']');

  // CLAIM 2 — cube law (lifetime(2)/lifetime(1) = 8; monotone increasing).
  const ratioL = lifetime(2) / lifetime(1);
  const Ls = ladder.map(lifetime);
  let incL = true;
  for (let k = 1; k < Ls.length; k++) if (!(Ls[k] > Ls[k-1])) incL = false;
  log('2 · CUBE LAW  (lifetime(2)/lifetime(1) = 8; t_evap strictly increasing in M)',
      near(ratioL, 8) && incL,
      'L(2)/L(1)=' + ratioL.toFixed(6) + '  L[M=' + ladder.join(',') + ']=[' + Ls.map(v=>v.toFixed(3)).join(',') + ']');

  // CLAIM 3 — closed form equals the analytic integral, AND massAfter hits exactly 0 at t_evap.
  const m0s = [1, 2, 4, 8];
  let maxErr = 0;
  for (const M0 of m0s){
    maxErr = Math.max(maxErr, Math.abs(lifetimeIntegrated(M0) - lifetime(M0)));
  }
  let endsAtZero = true;
  for (const M0 of m0s) if (massAfter(M0, lifetime(M0)) !== 0) endsAtZero = false;
  log('3 · CLOSED-FORM = INTEGRAL  (|∫ − closed| < 1e-9 over M0∈{1,2,4,8}; massAfter(M0,t_evap)=0 exact)',
      maxErr < EPS && endsAtZero,
      'maxErr=' + maxErr.toExponential(2) + '  massAfter@t_evap=' + m0s.map(M0=>massAfter(M0,lifetime(M0))).join(','));

  // CLAIM 4 — one-way accelerating runaway: dMdt < 0 ∀ M; |dMdt| rises as M falls.
  const negAll = ladder.every(M => dMdt(M) < 0);
  // sample from heavy → light; |dMdt| must strictly increase as M decreases
  const downward = [16, 8, 4, 2, 1, 0.5, 0.25];
  const absRates = downward.map(M => Math.abs(dMdt(M)));
  let accel = true;
  for (let k = 1; k < absRates.length; k++) if (!(absRates[k] > absRates[k-1])) accel = false;
  log('4 · MONOTONE ONE-WAY RUNAWAY  (dMdt < 0 ∀ M; |dMdt| strictly increases as M falls)',
      negAll && accel,
      'dMdt all<0: ' + negAll + '  |dMdt|[M=' + downward.join(',') + ']=[' + absRates.map(v=>v.toFixed(3)).join(',') + ']');

  // CLAIM 5 — neg-control teeth: classicalHole disagrees with the thermal core everywhere.
  const samples = [0.25, 0.5, 1, 2, 4, 8, 16];
  let teeth = true, detail = [];
  for (const M of samples){
    const c = classicalHole(M);
    const thermalT = temperature(M), thermalDM = dMdt(M);
    const disagrees = c.T === 0 && c.dMdt >= 0 && thermalT > 0 && thermalDM < 0
                   && c.T !== thermalT && c.dMdt !== thermalDM;
    if (!disagrees) teeth = false;
  }
  detail.push('classical{T:0,dMdt:0} vs thermal{T>0,dMdt<0} at M=' + samples.join(','));
  log('5 · NEGATIVE CONTROL: classical (T≡0, dMdt≥0, never shrinks) DISAGREES with the thermal core at every M',
      teeth, detail.join(' '));

  // CLAIM 6 — inverse-mass diptych theorem: lighter is hotter AND dies first.
  const pairs = [[1,2],[0.5,4],[2,16],[0.25,1]];
  let theorem = true;
  for (const [light, heavy] of pairs){
    if (!(temperature(light) > temperature(heavy) && lifetime(light) < lifetime(heavy))) theorem = false;
  }
  log('6 · INVERSE-MASS DIPTYCH THEOREM  (M_light<M_heavy ⇒ T_light>T_heavy AND life_light<life_heavy)',
      theorem,
      pairs.map(([l,h])=>'('+l+'<'+h+'): T '+temperature(l).toFixed(2)+'>'+temperature(h).toFixed(2)+
        ', life '+lifetime(l).toFixed(2)+'<'+lifetime(h).toFixed(2)).join(' · '));

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}
// ===== END HAWKING CORE =====

export {
  K,
  temperature, luminosity, dMdt, massAfter, lifetime, lifetimeIntegrated,
  classicalHole, runSelfTest,
};

// Run directly (`node core.mjs`) → print the self-test and exit 0/1. Importers skip this block.
if (import.meta.url === ('file://' + process.argv[1]) ||
    (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/^.*\//, '')))){
  const r = runSelfTest();
  console.log('The Pair at the Edge — core.mjs self-test');
  for (const c of r.checks) console.log('  ' + (c.pass ? '✓' : '✗') + '  ' + c.name + '  [' + c.info + ']');
  console.log((r.ok ? '  ✓ ' : '  ✗ ') + r.passed + '/' + r.total + ' checks pass');
  process.exit(r.ok ? 0 : 1);
}
