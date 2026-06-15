// ============================================================================
//  THE CONSERVATORY · LOGISTIC GROWTH — Node twin of the in-page self-test.
//  Run:  node conservatory/logistic/core.test.mjs
//  Proves the falsifiable claim EXACT, and that the in-page core is byte-identical
//  to this module (re-extraction parity), so "self-test green" can't drift.
// ============================================================================
import {
  P, field, fPrime, closed, fixedPoints, inflection, Vlyap, Vprime,
  rk4Step, leakyStep, trace, monotoneApproach, runSelfTest,
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
}

console.log('\n' + (pass === total ? '✓ ALL ' : '✗ ') + pass + '/' + total + ' checks passed.\n');
process.exit(pass === total ? 0 : 1);
