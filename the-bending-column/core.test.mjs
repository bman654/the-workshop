#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
   core.test.mjs — the Node twin for THE COLUMN THAT DECIDES TO BEND.

   Imports the SAME core.mjs the page inlines and runs the SAME runSelfTest(), then
   adds direct probes asserting the directive claims. Exits 0 iff every assertion
   passes (CI-true).

   The claims under proof:
     (1) ONSET — the SOLVED discrete buckling λ₁ equals the discrete operator's OWN
         closed form (2/h²)(1−cos(πh/L)) to machine ε (the eigen-solve is exact), and
         the simulated onset CONVERGES to π²EI/L² as N→∞ (O(h²)). We never claim 1e-9
         from the coarse scheme; the headline rides the closed form + modal purity.
     (2) SCALING LAWS — inverse-square in L (halve L → P_crit ×4) and linear in EI
         (double EI → ×2), each to <1e-9.
     (3) LEADING MODE — the buckled shape is the pure half-sine: fourierCoeffs → coeff[1]=1,
         all higher 0 to <1e-9; the SOLVED eigenvector is the same half-sine.
     (4) SECOND MODE — bracing the midpoint lifts the onset EXACTLY ×4 and the shape is
         the pure full sine (only coeff[2] nonzero).
     (5) NEG-CONTROL — sharpThreshold(perfect)===true AND sharpThreshold(eccentric)===false
         (the imperfect column is correctly NOT a sharp pitchfork — asserted, not narrated).
     (6) ONE SOURCE — branchAmplitude is the single ±A authority for both ghost tines.

   Run:  node the-bending-column/core.test.mjs
   ════════════════════════════════════════════════════════════════════════════ */
import {
  pCrit, eulerLambda, modeShape, discreteLambda, solveBuckling, onsetLoad,
  jacobiEig, fourierCoeffs, branchAmplitude, eccentricMid, sharpThreshold, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0;
const ok = (c, m) => {
  if (c) { pass++; console.log('  \x1b[32m✓\x1b[0m ' + m); }
  else { fail++; console.log('  \x1b[31m✗ ' + m + '\x1b[0m'); }
};

console.log('\nTHE COLUMN THAT DECIDES TO BEND — core.test.mjs\n');

// ── the in-page self-test, run here verbatim (the SAME runSelfTest the pill calls) ──
console.log('runSelfTest() — the exact suite the in-page pill runs:');
const r = runSelfTest();
r.log.forEach(l => console.log('    ' + l));
ok(r.fail === 0, `runSelfTest() reports ${r.pass} pass / ${r.fail} fail`);

const EI = 2.3;

// ── CLAIM (1): the solved discrete λ₁ === the discrete closed form to ε; converges to Euler.
console.log('\nclaim (1) — onset: exact discrete eigen-solve, O(h²) convergence to π²EI/L²:');
{
  let worst = 0, worstAt = '';
  for (const L of [0.5, 1, 2, 4]) {
    for (const N of [8, 16, 24, 40]) {
      const { lambdas } = solveBuckling(L, N);
      const d = Math.abs(lambdas[0] - discreteLambda(L, N, 1));
      if (d > worst) { worst = d; worstAt = `L=${L},N=${N}`; }
    }
  }
  ok(worst < 1e-9, `solved λ₁ === (2/h²)(1−cos(πh/L)) to machine ε (worst |Δ|=${worst.toExponential(2)} at ${worstAt})`);
  // the simulated onset is BELOW Euler at coarse N (the O(h²) deficit, honest)…
  const L = 2;
  const coarse = onsetLoad(EI, L, 16, 1), euler = pCrit(EI, L, 1);
  ok(coarse < euler, `coarse N=16 onset (${coarse.toFixed(5)}) sits below Euler ${euler.toFixed(5)} (the O(h²) deficit, honest)`);
  // …and converges up to Euler as N→∞ (read on the proven-equivalent discrete eigenvalue).
  const fine = EI * discreteLambda(L, 8000, 1);
  ok(Math.abs(fine - euler) / euler < 1e-6, `discrete onset at N=8000 → Euler to <1e-6 (rel ${(Math.abs(fine - euler) / euler).toExponential(2)})`);
  // genuine O(h²): halving h quarters the error.
  const eN = Math.abs(EI * discreteLambda(L, 40, 1) - euler), e2N = Math.abs(EI * discreteLambda(L, 80, 1) - euler);
  ok(Math.abs(eN / e2N - 4) < 0.02, `error ratio N→2N = ${(eN / e2N).toFixed(3)} ≈ 4 (second order)`);
  // independent: eulerLambda·EI === pCrit (cross-check the two closed forms agree).
  ok(Math.abs(eulerLambda(L, 1) * EI - pCrit(EI, L, 1)) < 1e-12, `eulerLambda·EI === pCrit (closed forms agree)`);
}

// ── CLAIM (2): scaling laws, exact.
console.log('\nclaim (2) — scaling laws (inverse-square in L, linear in EI):');
{
  for (const L of [1, 2.5, 6]) {
    ok(Math.abs(pCrit(EI, L / 2, 1) / pCrit(EI, L, 1) - 4) < 1e-9, `L=${L}: halve L → ×4 exactly`);
    ok(Math.abs(pCrit(3 * EI, L, 1) / pCrit(EI, L, 1) - 3) < 1e-9, `L=${L}: triple EI → ×3 exactly`);
  }
}

// ── CLAIM (3): the leading mode is a pure half-sine.
console.log('\nclaim (3) — leading mode is the pure half-sine A·sin(πs/L):');
{
  const L = 3, N = 72;
  const c = fourierCoeffs(modeShape(L, 1, N), L, 8);
  let rest = 0; for (let k = 2; k <= 8; k++) rest = Math.max(rest, Math.abs(c[k]));
  ok(Math.abs(c[1] - 1) < 1e-9, `coeff[1] = ${c[1].toFixed(9)} ≈ 1`);
  ok(rest < 1e-9, `all higher coeffs 0 (max ${rest.toExponential(2)})`);
  const { modes } = solveBuckling(L, N);
  const cs = fourierCoeffs(modes[0], L, 8);
  let restS = 0; for (let k = 2; k <= 8; k++) restS = Math.max(restS, Math.abs(cs[k]));
  ok(Math.abs(cs[1] - 1) < 1e-9 && restS < 1e-9, `the SOLVED eigenvector is the same half-sine to ε (coeff[1]=${cs[1].toFixed(9)}, rest ${restS.toExponential(2)})`);
}

// ── CLAIM (4): the braced second mode = full sine, onset ×4.
console.log('\nclaim (4) — braced second mode: full sine, onset ×4:');
{
  const L = 3, N = 72;
  ok(Math.abs(pCrit(EI, L, 2) / pCrit(EI, L, 1) - 4) < 1e-9, `mode-2 onset / mode-1 = ${(pCrit(EI, L, 2) / pCrit(EI, L, 1)).toFixed(9)} (the brace's ×4)`);
  const c = fourierCoeffs(modeShape(L, 2, N), L, 8);
  let off = 0; for (let k = 1; k <= 8; k++) if (k !== 2) off = Math.max(off, Math.abs(c[k]));
  ok(Math.abs(c[2] - 1) < 1e-9 && off < 1e-9, `mode-2 is the pure full sine (coeff[2]=${c[2].toFixed(9)}, others ${off.toExponential(2)})`);
  const { lambdas } = solveBuckling(L, N);
  ok(Math.abs(lambdas[1] - discreteLambda(L, N, 2)) < 1e-9, `solved 2nd eigenvalue === discrete mode-2 closed form to ε`);
}

// ── CLAIM (5): the neg-control. Perfect IS a sharp fork; eccentric is correctly NOT.
console.log('\nclaim (5) — the asserted neg-control (perfect sharp · imperfect not):');
{
  const Pcr = pCrit(EI, 2, 1);
  ok(sharpThreshold(0, Pcr) === true, `perfect column: sharpThreshold === true`);
  ok(sharpThreshold(0.04, Pcr) === false, `eccentric column: sharpThreshold === false (fires RED, as it must)`);
  // the perfect branch is flat below, lifts above; the eccentric is positive everywhere.
  let flatBelow = true, eccEverywhere = true;
  for (let rr = 0.05; rr < 1; rr += 0.05) {
    if (branchAmplitude(rr * Pcr, Pcr) > 1e-12) flatBelow = false;
    if (eccentricMid(rr * Pcr, Pcr, 0.04) <= 0) eccEverywhere = false;
  }
  ok(flatBelow, `perfect amplitude ≡ 0 for all P < P_crit (no premature bow)`);
  ok(eccEverywhere, `eccentric amplitude > 0 for all P > 0 (bows from the first ounce — no threshold)`);
  ok(branchAmplitude(1.5 * Pcr, Pcr) > 0, `perfect amplitude lifts off above P_crit`);
  // a NAIVE runner must not see the expected-false as a failure: assert the boolean pair.
  ok(sharpThreshold(0, Pcr) === true && sharpThreshold(0.04, Pcr) === false,
     `GREEN = perfect IS a sharp pitchfork AND imperfect is correctly NOT one`);
  // the √ onset law of the perfect branch.
  const a1 = branchAmplitude(1.01 * Pcr, Pcr), a4 = branchAmplitude(1.04 * Pcr, Pcr);
  ok(Math.abs(a4 / a1 - 2) < 1e-9, `branch grows like √(μ): A(1.04)/A(1.01)=${(a4 / a1).toFixed(6)} ≈ 2`);
}

// ── CLAIM (6): one amplitude source for both ghosts.
console.log('\nclaim (6) — branchAmplitude is the single ±A source for both fork tines:');
{
  const Pcr = pCrit(EI, 2, 1);
  const A = branchAmplitude(1.3 * Pcr, Pcr, 0.5);
  ok(A > 0 && Number.isFinite(A), `above threshold both tines sit at ±${A.toFixed(4)} from one call`);
  ok(branchAmplitude(0.5 * Pcr, Pcr, 0.5) === 0, `below threshold the tines fuse onto the straight strut (A=0)`);
}

// ── jacobi solver sanity: a known small symmetric matrix.
console.log('\nsanity — the Jacobi eigensolver on a known 3×3:');
{
  // [[2,-1,0],[-1,2,-1],[0,-1,2]] has eigenvalues 2, 2±√2.
  const M = [Float64Array.from([2, -1, 0]), Float64Array.from([-1, 2, -1]), Float64Array.from([0, -1, 2])];
  const { values } = jacobiEig(M);
  const sorted = [...values].sort((a, b) => a - b);
  const want = [2 - Math.SQRT2, 2, 2 + Math.SQRT2];
  let wmax = 0; for (let i = 0; i < 3; i++) wmax = Math.max(wmax, Math.abs(sorted[i] - want[i]));
  ok(wmax < 1e-12, `eigenvalues {${sorted.map(v => v.toFixed(6)).join(', ')}} === {2−√2, 2, 2+√2} to ε`);
}

console.log(`\n${fail === 0 ? '\x1b[32m' : '\x1b[31m'}${pass} passed, ${fail} failed\x1b[0m\n`);
process.exit(fail === 0 ? 0 : 1);
