// ============================================================================
//  THE CONSERVATORY · THE REPLICATOR — Node twin of the in-page self-test.
//  Run:  node conservatory/replicator/core.test.mjs
//  Proves the falsifiable claim EXACT, and that the in-page core is byte-identical
//  to this module (re-extraction parity), so "self-test green" can't drift.
// ============================================================================
import {
  P, hawkDoveMatrix, rpsMatrix, matrixFor, payoff, meanPayoff, field,
  essFixedPoint, relEntropy, simplexSum, minCoord, rk4Step, eulerStep,
  trace, runSelfTest,
  ARENA_N, agentMeanField, stepAgentCounts, headlessRun, ensembleCensus, runAgentSelfTest,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

let pass = 0, total = 0;
function check(name, cond, info) {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\n— The full in-page self-test —');
const r = runSelfTest();
for (const c of r.checks) check(c.name, c.pass, c.info);
check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);

console.log('\n— Independent re-derivations (this file, not the bundled self-test) —');

// THE PARAMETERS are exactly the locked values.
{
  check('locked params V=2 C=3 (C>V ⇒ interior ESS), game=hawkdove',
        P.V === 2 && P.C === 3 && P.C > P.V && P.game === 'hawkdove');
}

// (1) SIMPLEX INVARIANT — re-derive Σẋ=0 from scratch at a dense scatter of interior
//     points on BOTH games (the analytic structural law), then confirm Σxᵢ≡1 holds to
//     machine zero under RK4 over a full orbit, on both games.
{
  const Ahd = hawkDoveMatrix(), Arps = rpsMatrix();
  // Σẋ = Σxᵢ(fᵢ−φ) must be 0 at ANY interior x (the identity, re-derived directly here).
  let worstField = 0;
  for (let a = 0.05; a < 1; a += 0.05) {
    const x = [a, 1 - a];
    const fld = field(Ahd, x);
    worstField = Math.max(worstField, Math.abs(fld[0] + fld[1]));
  }
  for (let a = 0.1; a < 0.9; a += 0.1) for (let b = 0.05; b < 1 - a; b += 0.1) {
    const x = [a, b, 1 - a - b];
    const fld = field(Arps, x);
    worstField = Math.max(worstField, Math.abs(fld[0] + fld[1] + fld[2]));
  }
  check('Σẋ = Σxᵢ(fᵢ−φ) = 0 analytically at a dense interior scatter (both games), to machine zero',
        worstField < 1e-15, 'max|Σẋ|=' + worstField.toExponential(2));
  const rhd = trace([0.12, 0.88], 0.05, 8000, 'rk4', 'hawkdove');
  const rrps = trace([0.2, 0.3, 0.5], 0.02, 8000, 'rk4', 'rps');
  check('RK4 conserves Σxᵢ=1 to < 1e-13 on the Hawk–Dove orbit', rhd.maxSumErr < 1e-13, rhd.maxSumErr.toExponential(2));
  check('RK4 conserves Σxᵢ=1 to < 1e-13 on the RPS orbit (game-agnostic invariant)', rrps.maxSumErr < 1e-13, rrps.maxSumErr.toExponential(2));
}

// (2) ESS FIXED POINT — re-derive x*_Hawk=V/C blind from ẋ=0, confirm essFixedPoint()
//     matches it, and that a long RK4 run from THREE interior starts lands on it to 1e-9.
{
  const Ahd = hawkDoveMatrix();
  // solve ẋ_Hawk=0 ⇒ x·(f_H − φ)=0 with x interior; the interior root is f_H=f_D.
  // f_H = (V−C)/2·h + V·(1−h);  f_D = V/2·(1−h).  Setting equal ⇒ h = V/C.  Re-derive:
  const h = P.V / P.C;
  const star = essFixedPoint('hawkdove');
  check('closed-form x*_Hawk = V/C = 2/3 (re-derived from f_H=f_D), x*_Dove = 1/3',
        Math.abs(star[0] - h) < 1e-15 && Math.abs(star[0] - 2 / 3) < 1e-15 && Math.abs(star[1] - 1 / 3) < 1e-15,
        'x*=[' + star[0].toFixed(9) + ', ' + star[1].toFixed(9) + ']');
  // ẋ(x*) = 0 to machine zero (the root, independently evaluated)
  const f = field(Ahd, star);
  check('ẋ(x*) = 0 to machine zero (x* is an exact fixed point)',
        Math.abs(f[0]) < 1e-15 && Math.abs(f[1]) < 1e-15, '|ẋ(x*)|=' + Math.max(Math.abs(f[0]), Math.abs(f[1])).toExponential(2));
  // multiple interior starts → x* to 1e-9
  let worst = 0;
  for (const x0 of [[0.05, 0.95], [0.5, 0.5], [0.95, 0.05]]) {
    const rr = trace(x0, 0.02, 60000, 'rk4', 'hawkdove');
    worst = Math.max(worst, Math.abs(rr.end[0] - star[0]));
  }
  check('long RK4 from 3 interior starts converges to the closed-form x* to < 1e-9 (no integration needed for x*)',
        worst < 1e-9, 'worst |x_Hawk−V/C| = ' + worst.toExponential(2));
  // RPS centre fixed point: ẋ((⅓,⅓,⅓))=0
  const rpsStar = essFixedPoint('rps'), frps = field(rpsMatrix(), rpsStar);
  check('RPS interior fixed point is the barycentre (⅓,⅓,⅓) with ẋ=0',
        Math.abs(rpsStar[0] - 1 / 3) < 1e-15 && Math.max(...frps.map(Math.abs)) < 1e-15,
        'ẋ(centre)=' + Math.max(...frps.map(Math.abs)).toExponential(2));
}

// (3) LYAPUNOV DESCENT vs RPS NEUTRALITY — the headline distinction.  D(x*‖x) strictly
//     descends to 0 under Hawk–Dove (no uptick beyond rounding); D is conserved (flat)
//     around the RPS centre.  Re-measured independently here, not via the bundled test.
{
  const star = essFixedPoint('hawkdove');
  let worstUptick = 0;
  for (const x0 of [[0.06, 0.94], [0.5, 0.5], [0.9, 0.1]]) {
    const rr = trace(x0, 0.02, 30000, 'rk4', 'hawkdove');
    worstUptick = Math.max(worstUptick, rr.maxDuptick);
    // and a clean net descent toward 0
    check('Hawk–Dove D(x*‖x) descends from start to ≈0 (start ' + JSON.stringify(x0) + ')',
          rr.Ds[rr.Ds.length - 1] < rr.Ds[0] - 1e-4 && rr.Ds[rr.Ds.length - 1] < 1e-6,
          'D: ' + rr.Ds[0].toExponential(2) + ' → ' + rr.Ds[rr.Ds.length - 1].toExponential(2));
  }
  check('Hawk–Dove D is MONOTONE (worst uptick ' + worstUptick.toExponential(2) + ' ≈ 0 — a strict Lyapunov function)',
        worstUptick < 1e-9, 'max uptick = ' + worstUptick.toExponential(2));
  // RPS: D conserved around the centre — the neutral ring (a deliberate foil).
  const rrps = trace([0.2, 0.3, 0.5], 0.01, 60000, 'rk4', 'rps');
  let dMin = Infinity, dMax = -Infinity;
  for (const d of rrps.Ds) { if (d < dMin) dMin = d; if (d > dMax) dMax = d; }
  check('RPS D(centre‖x) is CONSERVED (swing ' + (dMax - dMin).toExponential(2) + ' < 1e-3) — a neutrally-stable orbit, NOT settling',
        (dMax - dMin) < 1e-3 && rrps.maxDuptick < 1e-3,
        'D swing = ' + (dMax - dMin).toExponential(2) + ' (the ring, the foil to the node)');
  // the orbit actually MOVES (it is not just sitting at the centre)
  const rrps2 = trace([0.2, 0.3, 0.5], 0.01, 60000, 'rk4', 'rps');
  let travel = 0; for (let i = 0; i < rrps2.xs.length; i++) travel = Math.max(travel, Math.abs(rrps2.xs[i][0] - 1 / 3));
  check('RPS orbit genuinely cycles (max |x_R − ⅓| = ' + travel.toFixed(3) + ' > 0.05 — a real loop, not a fixed point)',
        travel > 0.05, 'amplitude = ' + travel.toFixed(3));
}

// (4) PAYOFF IDENTITIES — φ=xᵀAx=Σxᵢfᵢ, and at the interior ESS f_Hawk=f_Dove=φ.
{
  const Ahd = hawkDoveMatrix();
  const x = [0.4, 0.6];
  const f = payoff(Ahd, x);
  let dot = x[0] * f[0] + x[1] * f[1];
  check('mean payoff φ = xᵀAx = Σxᵢfᵢ (two routes agree to machine zero)',
        Math.abs(dot - meanPayoff(Ahd, x)) < 1e-15, 'Δ=' + Math.abs(dot - meanPayoff(Ahd, x)).toExponential(2));
  const star = essFixedPoint('hawkdove');
  const fStar = payoff(Ahd, star), phiStar = meanPayoff(Ahd, star);
  check('at the interior Hawk–Dove ESS every played strategy earns the same payoff φ (f_H=f_D=φ)',
        Math.abs(fStar[0] - phiStar) < 1e-15 && Math.abs(fStar[1] - phiStar) < 1e-15,
        'f_H=' + fStar[0].toFixed(6) + ' f_D=' + fStar[1].toFixed(6) + ' φ=' + phiStar.toFixed(6));
  // RPS is zero-sum: φ = xᵀAx ≡ 0 for the antisymmetric matrix at ANY x.
  const Arps = rpsMatrix();
  let worstZero = 0;
  for (const xr of [[0.2, 0.3, 0.5], [0.5, 0.25, 0.25], [1 / 3, 1 / 3, 1 / 3]]) worstZero = Math.max(worstZero, Math.abs(meanPayoff(Arps, xr)));
  check('RPS is zero-sum: φ=xᵀAx≡0 for the antisymmetric matrix at any x (so Ḋ=0 ⇒ the ring)',
        worstZero < 1e-15, 'max|φ_rps|=' + worstZero.toExponential(2));
}

// (5) NEGATIVE CONTROL (POSITIVITY) — on the RPS ring, Euler dt=1.2 spirals OUT and
//     punctures an edge (some xᵢ<0, unphysical); RK4 keeps the ring inside the simplex
//     (min xᵢ>0).  And BOTH hold the sum =1 — the break is the boundary, not sum-drift.
{
  const start = [0.45, 0.35, 0.2];
  const eu = trace(start, 1.2, 200, 'euler', 'rps');
  const rk = trace(start, 1.2, 200, 'rk4', 'rps');
  check('RPS Euler dt=1.2 spirals out and drives some xᵢ < 0 (min xᵢ<0, wentNegative=true) — an unphysical frequency',
        eu.minX < 0 && eu.wentNegative === true, 'Euler min xᵢ=' + eu.minX.toExponential(2) + ' wentNegative=' + eu.wentNegative);
  check('RK4 at the same coarse dt keeps the ring inside the simplex (min xᵢ>0, wentNegative=false)',
        rk.minX > 0 && rk.wentNegative === false, 'RK4 min xᵢ=' + rk.minX.toFixed(3) + ' wentNegative=' + rk.wentNegative);
  check('the SUM Σxᵢ=1 holds under BOTH methods (the break is the boundary, NOT sum-drift)',
        eu.maxSumErr < 1e-9 && rk.maxSumErr < 1e-9, 'Euler sum-err=' + eu.maxSumErr.toExponential(2) + '  RK4 sum-err=' + rk.maxSumErr.toExponential(2));
}

// (6) DETERMINISM — two full self-test runs are byte-identical.
{
  const a = JSON.stringify(runSelfTest().detail);
  const bb = JSON.stringify(runSelfTest().detail);
  check('two full self-test runs are byte-identical (deterministic)', a === bb);
}

// ===========================================================================
//  THE ARENA BRIDGE — the agent crowd RECOVERS the proven law, EXACT & seeded.
// ===========================================================================
console.log('\n— The agent-arena self-test (the crowd recovers the law) —');
{
  const ar = runAgentSelfTest();
  for (const c of ar.checks) check(c.name, c.pass, c.info);
  check('agent self-test reports all green', ar.pass === ar.total, ar.pass + '/' + ar.total);
}

console.log('\n— Independent agent re-derivations (this file, not the bundled agent test) —');

// THE MEAN-FIELD IDENTITY — agentMeanField == field() to literal 0 (independent states).
{
  const Ahd = hawkDoveMatrix(), Arps = rpsMatrix();
  let maxErr = 0;
  for (const x of [[0.1, 0.9], [0.5, 0.5], [0.73, 0.27], [0.92, 0.08]]) {
    const a = agentMeanField(Ahd, x), b = field(Ahd, x);
    maxErr = Math.max(maxErr, Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]));
  }
  for (const x of [[0.2, 0.3, 0.5], [1 / 3, 1 / 3, 1 / 3], [0.5, 0.25, 0.25]]) {
    const a = agentMeanField(Arps, x), b = field(Arps, x);
    for (let i = 0; i < 3; i++) maxErr = Math.max(maxErr, Math.abs(a[i] - b[i]));
  }
  check('agent mean-field increment == field() to literal 0 (independent HD+RPS states)',
        maxErr === 0, 'max|Δ| = ' + maxErr);
}

// THE POPULATION IS CONSERVED — stepAgentCounts keeps Σcounts = N exactly, every step.
{
  const A = hawkDoveMatrix();
  const rnd = (() => { let s = 99; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; })();
  let counts = [Math.round(0.3 * ARENA_N), ARENA_N - Math.round(0.3 * ARENA_N)];
  let conserved = true;
  for (let i = 0; i < 300; i++) {
    counts = stepAgentCounts(A, counts, 0.1, rnd).counts;
    if (counts[0] + counts[1] !== ARENA_N || counts[0] < 0 || counts[1] < 0) { conserved = false; break; }
  }
  check('Moran step conserves the population Σcounts = N = ' + ARENA_N + ' exactly (no agent created or lost)',
        conserved, conserved ? 'N held over 300 steps' : 'BROKEN');
}

// THE PHASE-LOCKED CENSUS lands on the EXACT ESS 2/3 (re-measured here, not via the bundle).
{
  const cen = ensembleCensus([0.12, 0.88], 150, 30, 0.1, 9000001, { game: 'hawkdove', N: ARENA_N });
  const hawk = cen.mx.map((v) => v[0]);
  const start = Math.floor(hawk.length * 0.6);
  let tm = 0, c = 0; for (let i = start; i < hawk.length; i++) { tm += hawk[i]; c++; } tm /= c;
  check('Hawk–Dove ensemble census tail-mean → ESS x*=V/C=2/3 within 1.5e-2 (the law from a crowd)',
        Math.abs(tm - 2 / 3) < 1.5e-2, '⟨x_H⟩=' + tm.toFixed(5) + ' err=' + Math.abs(tm - 2 / 3).toExponential(2));
}

// DETERMINISM of the count engine — same seed ⇒ identical headless run.
{
  const a = headlessRun(2024, [0.4, 0.6], 12, 0.1, { game: 'hawkdove', N: ARENA_N });
  const b = headlessRun(2024, [0.4, 0.6], 12, 0.1, { game: 'hawkdove', N: ARENA_N });
  check('headlessRun deterministic — same seed ⇒ identical fraction history',
        JSON.stringify(a.xs) === JSON.stringify(b.xs), JSON.stringify(a.xs) === JSON.stringify(b.xs) ? 'identical' : 'DIFFER');
}

// ---------------------------------------------------------------------------
//  RE-EXTRACTION PARITY — the core inlined in index.html is byte-identical to
//  core.mjs (between the // ===== REPLICATOR-CORE sentinels), indentation-normalised.
// ---------------------------------------------------------------------------
{
  const here = dirname(fileURLToPath(import.meta.url));
  const modSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
  const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
  const START = '// ===== REPLICATOR-CORE (byte-identical to core.mjs) =====';
  const END = '// ===== END REPLICATOR-CORE =====';

  const modBody = modSrc
    .slice(modSrc.indexOf('const P = {'), modSrc.indexOf('export {'))
    .trim();
  const pi = pageSrc.indexOf(START), pj = pageSrc.indexOf(END);
  const norm = (s) => s.replace(/^\s+/gm, '').replace(/\r/g, '').trim();
  check('index.html contains the REPLICATOR-CORE sentinels', pi >= 0 && pj > pi);
  if (pi >= 0 && pj > pi) {
    const pageBody = pageSrc.slice(pi + START.length, pj).trim();
    check('inlined core matches core.mjs (function bodies, indentation-normalised)',
          norm(pageBody) === norm(modBody),
          norm(pageBody) === norm(modBody) ? 'byte-identical' :
            'DIFFER (page ' + norm(pageBody).length + ' vs mod ' + norm(modBody).length + ' chars)');
  }

  // ----- the AGENT-CORE block is inlined byte-identical too -----
  const A_START = '// ===== AGENT-CORE (byte-identical to core.mjs) =====';
  const A_END = '// ===== END AGENT-CORE =====';
  const mi = modSrc.indexOf(A_START), mj = modSrc.indexOf(A_END);
  const ai = pageSrc.indexOf(A_START), aj = pageSrc.indexOf(A_END);
  check('core.mjs & index.html both contain the AGENT-CORE sentinels',
        mi >= 0 && mj > mi && ai >= 0 && aj > ai);
  if (mi >= 0 && mj > mi && ai >= 0 && aj > ai) {
    const modAgent = modSrc.slice(mi + A_START.length, mj).trim();
    const pageAgent = pageSrc.slice(ai + A_START.length, aj).trim();
    check('inlined AGENT-CORE matches core.mjs (indentation-normalised)',
          norm(pageAgent) === norm(modAgent),
          norm(pageAgent) === norm(modAgent) ? 'byte-identical' :
            'DIFFER (page ' + norm(pageAgent).length + ' vs mod ' + norm(modAgent).length + ' chars)');
  }
}

console.log('\n' + (pass === total ? '✓ ALL ' : '✗ ') + pass + '/' + total + ' checks passed.\n');
process.exit(pass === total ? 0 : 1);
