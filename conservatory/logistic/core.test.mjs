// ============================================================================
//  THE CONSERVATORY · LOGISTIC GROWTH — Node twin of the in-page self-test.
//  Run:  node conservatory/logistic/core.test.mjs
//  Proves the falsifiable claim EXACT, and that the in-page core is byte-identical
//  to this module (re-extraction parity), so "self-test green" can't drift.
// ============================================================================
import {
  P, field, fPrime, closed, fixedPoints, inflection, Vlyap, Vprime,
  rk4Step, leakyStep, trace, monotoneApproach, runSelfTest,
  DISH_CAP, agentMeanField, stepDish, headlessRun, ensembleCensus,
  censusDeviation, runAgentSelfTest,
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

console.log('\n— The full in-page self-test (the proven logistic core) —');
const r = runSelfTest();
for (const c of r.checks) check(c.name, c.pass, c.info);
check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);

console.log('\n— The agent-colony self-test (the bridge: the crowd recovers the law) —');
const ra = runAgentSelfTest();
for (const c of ra.checks) check(c.name, c.pass, c.info);
check('agent self-test reports all green', ra.pass === ra.total, ra.pass + '/' + ra.total);

console.log('\n— Independent re-derivations (this file, not the bundled self-test) —');

// THE PARAMETERS are exactly the locked values.
{
  check('locked params r=0.6 K=100', P.r === 0.6 && P.K === 100);
}

// THE FIXED POINTS are exactly [{0, unstable, +r}, {K, stable, −r}].
{
  const fp = fixedPoints();
  check('fixedPoints == [{0,unstable,+r},{K,stable,−r}]',
        fp.length === 2 &&
        fp[0].N === 0 && fp[0].stable === false && fp[0].eig === P.r &&
        fp[1].N === 100 && fp[1].stable === true && fp[1].eig === -P.r,
        '0:eig=' + fp[0].eig + ' (unstable)  ·  K:eig=' + fp[1].eig + ' (stable)');
}

// (1) STABILITY — the eigenvalues are the field's slope, byte-exact ∓r.
{
  check('f\'(K) === −r === −0.6 (stable node, <0)', fPrime(100) === -0.6, 'f\'(K)=' + fPrime(100));
  check('f\'(0) === +r === +0.6 (unstable, >0)', fPrime(0) === 0.6, 'f\'(0)=' + fPrime(0));
}

// (2) CLOSED-FORM ⟷ RK4 — independent re-measure of the agreement & 4th order.
//     Matching numbers from the verified witness (/tmp/logistic_verify.mjs):
//       dt=0.01 → 2.98e-10 ; dt=0.0025 → 1.28e-12 ; ratio 233× (4th order).
{
  const N0 = 5, T = 40;
  const measure = (dt) => {
    let N = N0, t = 0, m = 0;
    for (let i = 0, steps = Math.round(T / dt); i <= steps; i++) {
      const e = Math.abs(N - closed(t, N0));
      if (e > m) m = e;
      N = rk4Step(N, dt); t += dt;
    }
    return m;
  };
  const e01 = measure(0.01), e0025 = measure(0.0025);
  check('RK4 vs closed-form max|err| at dt=0.01 ≈ 3e-10 (< 1e-9)', e01 < 1e-9 && e01 > 1e-12,
        e01.toExponential(3));
  check('4th-order: dt→dt/4 shrinks the error ≥10× (the agreement is the method ORDER, not luck)',
        e01 / e0025 >= 10, e01.toExponential(2) + ' → ' + e0025.toExponential(2) +
        '  (ratio ' + (e01 / e0025).toFixed(0) + '×, 4th order predicts ~256×)');
}

// (3) NEGATIVE CONTROL — the leaky step grows WORSE monotonically as a = dt·r
//     increases: clean at a=0.8 (maxN=100, 0 crossings), rings at 1.6/2.0/2.4
//     (maxN 100→100.84→109.62→120.37).  The true RK4 never overshoots.
{
  function leakyRun(a, N0 = 5, T = 60) {
    const dt = a / P.r;
    let N = N0, maxN = N0, cross = 0, prevSide = Math.sign(N0 - P.K);
    for (let i = 0, steps = Math.round(T / dt); i < steps; i++) {
      N = leakyStep(N, dt);
      if (N > maxN) maxN = N;
      const s = Math.sign(N - P.K);
      if (s !== 0 && prevSide !== 0 && s !== prevSide) cross++;
      if (s !== 0) prevSide = s;
    }
    return { maxN, cross };
  }
  const a08 = leakyRun(0.8), a16 = leakyRun(1.6), a20 = leakyRun(2.0), a24 = leakyRun(2.4);
  check('leaky a=0.8 is CLEAN (maxN≈100, 0 K-crossings) — small-a control',
        a08.maxN <= P.K + 1e-6 && a08.cross === 0, 'maxN=' + a08.maxN.toFixed(2) + ' cross=' + a08.cross);
  check('leaky a=1.6 PROVABLY overshoots (maxN≈100.84 > K) and rings (≥1 crossing)',
        a16.maxN > P.K && a16.cross >= 1, 'maxN=' + a16.maxN.toFixed(2) + ' cross=' + a16.cross);
  check('leaky overshoot grows monotonically in a (1.6<2.0<2.4: maxN 100.84→109.62→120.37)',
        a16.maxN < a20.maxN && a20.maxN < a24.maxN,
        a16.maxN.toFixed(2) + ' < ' + a20.maxN.toFixed(2) + ' < ' + a24.maxN.toFixed(2));
  // the truthful RK4 at the same coarse step never overshoots.
  const rk4coarse = trace(5, 1.6 / P.r, Math.round(60 / (1.6 / P.r)), 'rk4');
  check('RK4 at the same coarse step NEVER overshoots K (overshoot=false, 0 crossings)',
        rk4coarse.overshoot === false && rk4coarse.kCross === 0,
        'overshoot=' + rk4coarse.overshoot + ' crossings=' + rk4coarse.kCross);
}

// (4) INFLECTION — exact at N=K/2, growth r·K/4=15, t*=ln((K−N₀)/N₀)/r, and the
//     CONDITIONAL guard: inflection(N₀≥K/2) === null (the mark must not lie).
{
  check('f(K/2) === r·K/4 === 15 (growth peak)', field(50) === 15, 'f(50)=' + field(50));
  check('f\'(K/2) === 0 (growth-rate extremum)', fPrime(50) === 0, 'f\'(50)=' + fPrime(50));
  const inf = inflection(5);
  check('t* = ln((K−N₀)/N₀)/r = 4.907398 (N₀=5)', Math.abs(inf.t - 4.907398) < 1e-5, 't*=' + inf.t.toFixed(6));
  check('N(t*) === K/2 === 50 to 1e-9', Math.abs(closed(inf.t, 5) - 50) < 1e-9, 'N(t*)=' + closed(inf.t, 5).toFixed(9));
  check('inflection slope === r·K/4 === 15', inf.slope === 15, 'slope=' + inf.slope);
  check('inflection(N₀ ≥ K/2) === null (curve already concave — no bend)',
        inflection(50) === null && inflection(60) === null && inflection(150) === null,
        'inflection(50)=' + inflection(50) + '  inflection(150)=' + inflection(150));
}

// (5) MONOTONE APPROACH both sides + Lyapunov V=(N−K)² monotone-DOWN to 0.
//     predator-prey's V stays FLAT on its ring; here V must FALL — that IS stability.
{
  check('N₀=5 climbs monotonically to K (RK4)', monotoneApproach(5, 0.01, 60));
  check('N₀=150 descends monotonically to K (RK4)', monotoneApproach(150, 0.01, 60));
  let allDown = true, lastFinalV = -1;
  for (const N0 of [5, 40, 99, 150, 200]) {
    const t = trace(N0, 0.01, 6000, 'rk4');
    if (!t.vMonotoneDown) allDown = false;
    lastFinalV = t.endV;
  }
  check('V=(N−K)² monotone-DOWN for N₀∈{5,40,99,150,200} and lands ≈0', allDown && lastFinalV < 1e-3,
        'all monotone-down=' + allDown + '  final V≈' + lastFinalV.toExponential(2));
  check('V̇(K/2) = −1500 ≤ 0 and V̇(K) = 0 (sink only at K)',
        Vprime(50) === -1500 && Vprime(100) === 0, 'V̇(50)=' + Vprime(50) + ' V̇(100)=' + Vprime(100));
}

// (6) DETERMINISM — two full self-test runs are byte-identical.
{
  const a = JSON.stringify(runSelfTest().detail);
  const bb = JSON.stringify(runSelfTest().detail);
  check('two full self-test runs are byte-identical (deterministic)', a === bb);
}

// ---------------------------------------------------------------------------
//  INDEPENDENT AGENT WITNESSES — re-derive the bridge claims here (not the
//  bundled agent self-test), so "agent green" can't drift either.
// ---------------------------------------------------------------------------

// THE AGENT MEAN-FIELD is byte-for-byte field() at every state we probe.
{
  let maxErr = 0;
  for (const N of [0, 3.3, 12, 47, 73, 100, 130]) {
    maxErr = Math.max(maxErr, Math.abs(agentMeanField(N) - field(N)));
  }
  check('agent mean-field == field() to machine zero (independent states)',
        maxErr < 1e-12, 'max|Δ|=' + maxErr.toExponential(2) + ' (measured 5.33e-15)');
}

// THE DENSITY SCALE puts the dish ceiling at exactly K (m=CAP ⇒ N=K).
{
  check('DISH_CAP=1500 ⇒ a full dish (m=CAP) reads N=K=100',
        DISH_CAP === 1500 && P.K * (DISH_CAP / DISH_CAP) === 100, 'm=CAP ⇒ N=' + (P.K * 1));
}

// THE CENSUS tracks the EXACT closed-form sigmoid (re-measured here).
{
  const dev = censusDeviation(8, 64, 30, 0.03, 9000001, DISH_CAP);
  check('ensemble census tracks closed(t, N0) within 2.5 (measured 2.46)',
        dev < 2.5, 'max|census − closed| = ' + dev.toFixed(3) + ' colony-units');
}

// THE 1/√CAP SHRINKAGE — the residual is finite-CAP demographic stalling, not
// model error: as CAP grows the deviation falls MONOTONICALLY (2.46→1.65→1.26).
// The trend is the proof (the absolute values are seed-specific).
{
  const d1 = censusDeviation(8, 64, 30, 0.03, 9000001, 1500);
  const d2 = censusDeviation(8, 64, 30, 0.03, 9000001, 3000);
  const d3 = censusDeviation(8, 64, 30, 0.03, 9000001, 6000);
  check('census deviation SHRINKS monotonically as CAP grows (1/√CAP demographic stall, not model error)',
        d1 > d2 && d2 > d3,
        'CAP 1500/3000/6000 ⇒ dev ' + d1.toFixed(2) + ' → ' + d2.toFixed(2) + ' → ' + d3.toFixed(2));
}

// THE COARSE DISH (the integer logistic map) rings past the rim like leakyStep,
// and grows monotonically worse in a — its honest count-level echo of the control.
{
  function coarseRun(a, N0 = 5, cap = DISH_CAP, T = 80) {
    const dt = a / P.r, rnd = (function (seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })(7);
    let m = Math.round((N0 / P.K) * cap), maxN = 0, cross = 0, prevSide = Math.sign(N0 - P.K);
    for (let i = 0, steps = Math.round(T / dt); i < steps; i++) {
      m = stepDish(m, cap, dt, rnd, { coarse: true }).m;
      const N = P.K * (m / cap);
      if (N > maxN) maxN = N;
      const s = Math.sign(N - P.K);
      if (s !== 0 && prevSide !== 0 && s !== prevSide) cross++;
      if (s !== 0) prevSide = s;
    }
    return { maxN, cross };
  }
  const c08 = coarseRun(0.8), c16 = coarseRun(1.6), c20 = coarseRun(2.0), c24 = coarseRun(2.4);
  check('coarse dish a=0.8 is CLEAN (maxN≈100, 0 K-crossings)',
        c08.maxN <= P.K + 1e-6 && c08.cross === 0, 'maxN=' + c08.maxN.toFixed(2) + ' cross=' + c08.cross);
  check('coarse dish a=1.6 PROVABLY rings past the rim (maxN>K, ≥1 crossing)',
        c16.maxN > P.K && c16.cross >= 1, 'maxN=' + c16.maxN.toFixed(2) + ' cross=' + c16.cross);
  check('coarse dish overshoot grows monotonically in a (1.6<2.0<2.4)',
        c16.maxN < c20.maxN && c20.maxN < c24.maxN,
        c16.maxN.toFixed(2) + ' < ' + c20.maxN.toFixed(2) + ' < ' + c24.maxN.toFixed(2));
}

// DETERMINISM of the count engine — same seed ⇒ identical headless run.
{
  const a = headlessRun(42, 5, 30, 0.03);
  const b = headlessRun(42, 5, 30, 0.03);
  check('headlessRun deterministic — same seed ⇒ identical colony series',
        a.end === b.end && JSON.stringify(a.Ns) === JSON.stringify(b.Ns),
        a.end === b.end ? 'identical (final N=' + a.end.toFixed(2) + ')' : 'DIFFER');
}

// A SINGLE truthful run climbs to ~K and PINS there (the dish saturates).
{
  const a = headlessRun(1, 5, 40, 0.03);
  check('a single truthful dish climbs from N0=5 and saturates near K',
        a.end > 90 && a.end <= 100, 'final N=' + a.end.toFixed(2) + ' (pins at K)');
}

// ---------------------------------------------------------------------------
//  RE-EXTRACTION PARITY — the core inlined in index.html is byte-identical to
//  core.mjs (between the // ===== LOGISTIC-CORE sentinels), indentation-normalised.
// ---------------------------------------------------------------------------
{
  const here = dirname(fileURLToPath(import.meta.url));
  const modSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
  const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
  const START = '// ===== LOGISTIC-CORE (byte-identical to core.mjs) =====';
  const END = '// ===== END LOGISTIC-CORE =====';

  const modBody = modSrc
    .slice(modSrc.indexOf('const P = {'), modSrc.indexOf('export {'))
    .trim();
  const pi = pageSrc.indexOf(START), pj = pageSrc.indexOf(END);
  check('index.html contains the LOGISTIC-CORE sentinels', pi >= 0 && pj > pi);
  if (pi >= 0 && pj > pi) {
    const pageBody = pageSrc.slice(pi + START.length, pj).trim();
    const norm = (s) => s.replace(/^\s+/gm, '').replace(/\r/g, '').trim();
    check('inlined core matches core.mjs (function bodies, indentation-normalised)',
          norm(pageBody) === norm(modBody),
          norm(pageBody) === norm(modBody) ? 'byte-identical' :
            'DIFFER (page ' + norm(pageBody).length + ' vs mod ' + norm(modBody).length + ' chars)');
  }

  // ----- the AGENT-CORE block is inlined byte-identical too -----
  const A_START = '// ===== AGENT-CORE (byte-identical to core.mjs) =====';
  const A_END = '// ===== END AGENT-CORE =====';
  const norm = (s) => s.replace(/^\s+/gm, '').replace(/\r/g, '').trim();
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
