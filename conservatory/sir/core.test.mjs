// ============================================================================
//  THE CONSERVATORY · SIR EPIDEMIC — Node twin of the in-page self-test.
//  Run:  node conservatory/sir/core.test.mjs
//  Proves the falsifiable claim EXACT, and that the in-page core is byte-identical
//  to this module (re-extraction parity), so "self-test green" can't drift.
// ============================================================================
import {
  P, field, R0, IprimeAtZero, Phi, peakS, peakInfected, peakLocation, finalSize,
  rk4Step, eulerStep, trace, runSelfTest,
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
  check('locked params β=0.30 γ=0.10 N=1 I₀=1e-3',
        P.beta === 0.30 && P.gamma === 0.10 && P.N === 1 && P.I0 === 1e-3);
}

// (1) R₀ AND THRESHOLD — re-derive the threshold β* = γ/S₀ from scratch and confirm
//     R₀ = β·S₀/γ, R₀=1 exactly at β=β*, and sign(I'(0)) === sign(R₀−1) on both sides.
{
  const S0 = P.N - P.I0;
  const betaStar = P.gamma / S0;                 // β at which R₀ = 1, derived blind
  check('R₀ = β·S₀/γ = 2.997 (strong outbreak)', Math.abs(R0() - P.beta * S0 / P.gamma) < 1e-15 && Math.abs(R0() - 2.997) < 1e-3, 'R₀=' + R0().toFixed(4));
  const Pstar = { beta: betaStar, gamma: P.gamma, N: P.N, I0: P.I0 };
  check('threshold β* = γ/S₀ = ' + betaStar.toFixed(6) + ' gives R₀ = 1 exactly',
        Math.abs(R0(Pstar) - 1) < 1e-12, 'R₀(β*)=' + R0(Pstar).toFixed(12));
  const sub = { beta: 0.08, gamma: 0.10, N: P.N, I0: P.I0 };
  const sup = { beta: 0.30, gamma: 0.10, N: P.N, I0: P.I0 };
  check('sign(I\'(0)) === sign(R₀−1): subcritical −, supercritical +',
        Math.sign(IprimeAtZero(sub)) === Math.sign(R0(sub) - 1) &&
        Math.sign(IprimeAtZero(sup)) === Math.sign(R0(sup) - 1) &&
        Math.sign(IprimeAtZero(sub)) === -1 && Math.sign(IprimeAtZero(sup)) === 1,
        'sub I\'(0)=' + IprimeAtZero(sub).toExponential(2) + '  super I\'(0)=' + IprimeAtZero(sup).toExponential(2));
}

// (2) CONSERVATION — independently re-measure S+I+R=N and Φ flatness under RK4 over a
//     full supercritical orbit; confirm BOTH RK4 and Euler hold the SUM (the ±γI
//     increments cancel) so the discriminating meter is positivity, not sum-drift.
{
  const S0 = P.N - P.I0;
  const rk = trace(S0, P.I0, 0.05, 8000, 'rk4');
  check('RK4 conserves S+I+R=N to < 1e-12 (machine precision)', rk.maxConsErr < 1e-12, rk.maxConsErr.toExponential(2));
  check('RK4 conserves Φ = S+I−(γ/β)ln S to < 1e-9 (the first integral is flat)', rk.maxPhiDrift < 1e-9, rk.maxPhiDrift.toExponential(2));
  const eu = trace(S0, P.I0, 12, 60, 'euler');
  check('Euler ALSO holds the SUM (< 1e-12) at the very dt that breaks positivity',
        eu.maxConsErr < 1e-12, 'Euler sum-err=' + eu.maxConsErr.toExponential(2) + ' (the break is positivity, NOT sum-drift)');
}

// (3) PEAK — independently confirm S=γ/β at the I-peak, re-derive the peak height from
//     Φ, and confirm the peak-count flip across R₀=1.  peakLocation guards null below 1.
{
  const k = P.gamma / P.beta;
  check('peakS() === γ/β === 1/3 byte-exact (= S₀/R₀)', Math.abs(peakS() - k) < 1e-12 && Math.abs(peakS() - 1 / 3) < 1e-12, 'peakS=' + peakS().toFixed(9));
  // independent peak height: Φ(S₀,I₀) evaluated at S=γ/β
  const S0 = P.N - P.I0;
  const ImaxIndep = Phi(S0, P.I0) - k + k * Math.log(k);
  check('peakInfected() matches an independent Φ-evaluation at S=γ/β to 1e-12',
        Math.abs(peakInfected() - ImaxIndep) < 1e-12, 'core=' + peakInfected().toFixed(9) + '  indep=' + ImaxIndep.toFixed(9));
  // the traced supercritical peak lands at S≈γ/β
  const r = trace(S0, P.I0, 0.02, 20000, 'rk4');
  let im = 0; for (let i = 1; i < r.Is.length; i++) if (r.Is[i] > r.Is[im]) im = i;
  check('traced supercritical I-peak sits at S ≈ γ/β (within 1e-3)', Math.abs(r.Ss[im] - k) < 1e-3, 'traced S@peak=' + r.Ss[im].toFixed(6) + '  γ/β=' + k.toFixed(6));
  // peak-count flip: 0 / 0 / 1 across R₀ = {0.80, 1.0000, 2.997}
  const sub = { beta: 0.08, gamma: 0.10, N: P.N, I0: P.I0 };
  const crit = { beta: 0.10010, gamma: 0.10, N: P.N, I0: P.I0 };
  const rsub = trace(sub.N - sub.I0, sub.I0, 0.05, 8000, 'rk4', sub);
  const rcrit = trace(crit.N - crit.I0, crit.I0, 0.05, 8000, 'rk4', crit);
  const rsup = trace(S0, P.I0, 0.05, 8000, 'rk4');
  check('peak count flips 0 (sub) / 0 (critical) / 1 (super) across R₀=1',
        rsub.peaks === 0 && rcrit.peaks === 0 && rsup.peaks === 1,
        'peaks: sub=' + rsub.peaks + ' crit=' + rcrit.peaks + ' super=' + rsup.peaks);
  check('peakLocation(R₀≤1) === null (the mark must not lie)',
        peakLocation(sub) === null && peakLocation(crit) === null && peakLocation() !== null,
        'sub=' + peakLocation(sub) + '  super={S:' + peakLocation().S.toFixed(4) + ', Imax:' + peakLocation().Imax.toFixed(4) + '}');
}

// (4) FINAL SIZE — the Rydberg-style BLIND agreement: two independent derivations of
//     S∞ that never touch each other.  (a) the core's Φ-root bisection; (b) a fresh
//     DENSE re-bisection of the same transcendental in this file; (c) a long RK4 run to
//     quiescence.  All three must agree to <1e-6.  And confirm the textbook closed
//     form (which ignores I₀) DISAGREES by ~2e-4 — so we did NOT use it.
{
  const k = P.gamma / P.beta, S0 = P.N - P.I0;
  const coreSinf = finalSize();
  // (b) independent dense bisection of h(x)=x−k·ln x − C on (0, k)
  const C = S0 + P.I0 - k * Math.log(S0);
  const h = x => x - k * Math.log(x) - C;
  let lo = 1e-14, hi = k, hlo = h(lo);
  for (let i = 0; i < 400; i++) { const m = 0.5 * (lo + hi), hm = h(m); if (hlo * hm <= 0) hi = m; else { lo = m; hlo = hm; } }
  const indepSinf = 0.5 * (lo + hi);
  // (c) long RK4 run to quiescence (I<1e-12)
  let S = S0, I = P.I0, R = 0, dt = 0.02;
  for (let i = 0; i < 2000000 && I > 1e-12; i++) { [S, I, R] = rk4Step(S, I, R, dt); }
  check('final size: core Φ-root === independent dense bisection (two derivations, one S∞) to 1e-9',
        Math.abs(coreSinf - indepSinf) < 1e-9, 'core=' + coreSinf.toFixed(9) + '  indep=' + indepSinf.toFixed(9));
  check('final size: Φ-root === long-run RK4 (I<1e-12) — the blind orbit witness — to 1e-6',
        Math.abs(coreSinf - S) < 1e-6, 'Φ-root=' + coreSinf.toFixed(9) + '  RK4-run=' + S.toFixed(9) + '  Δ=' + Math.abs(coreSinf - S).toExponential(2));
  check('S∞ is the SMALL root: 0 < S∞ < γ/β', coreSinf > 0 && coreSinf < k, '0 < ' + coreSinf.toFixed(6) + ' < ' + k.toFixed(6));
  // the textbook S₀·exp(−R₀(1−S∞/N)) form ignores I₀ ⇒ disagrees ~2e-4 (we did NOT use it).
  const textbook = S0 * Math.exp(-R0() * (1 - coreSinf / P.N));
  check('textbook S₀·exp(−R₀(1−S∞/N)) form DISAGREES by ~2e-4 (it ignores I₀) — so finalSize uses the Φ-root, NOT it',
        Math.abs(textbook - coreSinf) > 1e-5 && Math.abs(textbook - coreSinf) < 1e-2,
        'textbook=' + textbook.toFixed(6) + '  Φ-root=' + coreSinf.toFixed(6) + '  Δ=' + Math.abs(textbook - coreSinf).toExponential(2));
}

// (5) NEGATIVE CONTROL (POSITIVITY) — Euler at dt=12 drives I<0 (minI<0, wentNegative);
//     RK4 keeps minI>0.  And BOTH hold the sum (we already proved that above).
{
  const S0 = P.N - P.I0;
  const eu = trace(S0, P.I0, 12, 60, 'euler');
  const rk = trace(S0, P.I0, 12, 60, 'rk4');
  check('Euler dt=12 drives I < 0 (minI<0, wentNegative=true) — unphysical population',
        eu.minI < 0 && eu.wentNegative === true, 'Euler minI=' + eu.minI.toFixed(4) + ' wentNegative=' + eu.wentNegative);
  check('RK4 at the same coarse dt keeps I > 0 (minI>0, wentNegative=false)',
        rk.minI > 0 && rk.wentNegative === false, 'RK4 minI=' + rk.minI.toExponential(2) + ' wentNegative=' + rk.wentNegative);
}

// (6) DETERMINISM — two full self-test runs are byte-identical.
{
  const a = JSON.stringify(runSelfTest().detail);
  const bb = JSON.stringify(runSelfTest().detail);
  check('two full self-test runs are byte-identical (deterministic)', a === bb);
}

// ---------------------------------------------------------------------------
//  RE-EXTRACTION PARITY — the core inlined in index.html is byte-identical to
//  core.mjs (between the // ===== SIR-CORE sentinels), indentation-normalised.
// ---------------------------------------------------------------------------
{
  const here = dirname(fileURLToPath(import.meta.url));
  const modSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
  const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
  const START = '// ===== SIR-CORE (byte-identical to core.mjs) =====';
  const END = '// ===== END SIR-CORE =====';

  const modBody = modSrc
    .slice(modSrc.indexOf('const P = {'), modSrc.indexOf('export {'))
    .trim();
  const pi = pageSrc.indexOf(START), pj = pageSrc.indexOf(END);
  check('index.html contains the SIR-CORE sentinels', pi >= 0 && pj > pi);
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
