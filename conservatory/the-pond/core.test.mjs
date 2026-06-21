// ============================================================================
//  THE CONSERVATORY · THE POND — Node twin of the in-page self-test.
//  Run:  node conservatory/the-pond/core.test.mjs
//  Proves the saddle-node / MSY / irreversibility EXACT, and that the in-page core
//  is byte-identical to this module (re-extraction parity), so "self-test green"
//  can't drift.
// ============================================================================
import {
  P, field, fPrime,
  harvestField, harvestPrime, rk4StepH, traceH, equilibria,
  H_CRIT, MSY, N_MSY, EPS_EMPTY, runHarvestSelfTest,
} from './core.mjs';
import {
  field as logField, rk4Step as logRk4, trace as logTrace,
} from '../logistic/core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

let pass = 0, total = 0;
function check(name, cond, info) {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\n— The full in-page self-test (the proven harvest core) —');
const r = runHarvestSelfTest();
for (const c of r.checks) check(c.name, c.pass, c.info);
check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);

console.log('\n— Independent re-derivations (this file, not the bundled self-test) —');

// THE PARAMETERS are inherited from the logistic bench, never re-declared.
{
  check('inherited params r=0.6 K=100', P.r === 0.6 && P.K === 100);
  check('H_CRIT === MSY === r·K/4 === 15', H_CRIT === 15 && MSY === 15 && H_CRIT === P.r * P.K / 4);
  check('N_MSY === K/2 === 50', N_MSY === 50);
}

// THE NEG-CONTROL — harvestField at h=0 is BYTE-IDENTICAL to the imported logistic
// field at every probed N (subtracting 0.0 is the IEEE identity).
{
  let exact = true, worst = 0;
  for (let N = 0; N <= 130; N += 0.25) {
    if (harvestField(N, 0) !== logField(N)) exact = false;
    worst = Math.max(worst, Math.abs(harvestField(N, 0) - logField(N)));
  }
  check('harvestField(N,0) === logistic field(N) byte-exact (independent grid)', exact && worst === 0,
        'worst|Δ| = ' + worst + ' (exactly 0)');
  // and one RK4 step at h=0 matches the imported logistic step to the bit
  let stepExact = true;
  for (let N = 1; N <= 120; N += 1) if (rk4StepH(N, 0.01, 0) !== logRk4(N, 0.01)) stepExact = false;
  check('rk4StepH(N,0.01,0) === logistic rk4Step(N,0.01) byte-exact', stepExact);
  // a full trace at h=0 rides to K and byte-matches the logistic trace
  const tH = traceH(5, 0.01, 6000, 0);
  const tL = logTrace(5, 0.01, 6000, 'rk4');
  check('traceH(5,…,h=0).Ns === logistic trace .Ns and endN→K=100',
        JSON.stringify(tH.Ns) === JSON.stringify(tL.Ns) && Math.abs(tH.endN - 100) < 1e-6,
        'endN=' + tH.endN.toFixed(6));
}

// HARVESTPRIME is the logistic slope — re-exported, not rewritten (the −h is
// constant ⇒ stability slope unchanged).
{
  let exact = true;
  for (const N of [0, 10, 50, 73, 100, 120]) if (harvestPrime(N) !== fPrime(N)) exact = false;
  check('harvestPrime === fPrime (slope unchanged by constant harvest)', harvestPrime === fPrime && exact);
}

// THE CLOSED ROOTS satisfy the defining quadratic r·N² − r·K·N + K·h = 0 (an
// independent witness re-derived here over a fine h-grid).
{
  let worst = 0, allOk = true;
  for (let h = 0.5; h < 15; h += 0.5) {
    const e = equilibria(h);
    if (!e) { allOk = false; continue; }
    for (const N of [e.Nplus, e.Nminus]) worst = Math.max(worst, Math.abs(P.r * N * N - P.r * P.K * N + P.K * h));
  }
  check('closed roots N± satisfy rN²−rKN+Kh ≈ 0 over h∈(0,15) (independent witness)', allOk && worst < 1e-7,
        'worst quad residual = ' + worst.toExponential(2));
}

// THE STABILITY SIGNS — upper root stable, lower unstable, eigenvalues opposite.
{
  let allStable = true, allUnstable = true, worstSym = 0;
  for (let h = 1; h < 15; h += 1) {
    const e = equilibria(h);
    if (!(e.eigPlus < 0)) allStable = false;
    if (!(e.eigMinus > 0)) allUnstable = false;
    worstSym = Math.max(worstSym, Math.abs(e.eigPlus + e.eigMinus));
  }
  check('N₊ stable (eig<0), N₋ unstable (eig>0), eigPlus=−eigMinus exact',
        allStable && allUnstable && worstSym < 1e-12, 'worst|eig₊+eig₋|=' + worstSym.toExponential(2));
}

// THE SADDLE-NODE — the two rests collide at K/2 with both eigenvalues 0, and
// vanish for any h above h_crit.
{
  const e = equilibria(15);
  check('equilibria(15): N₊=N₋=K/2=50, disc=0, both eigenvalues 0 (the fold)',
        e.Nplus === 50 && e.Nminus === 50 && e.disc === 0 && e.eigPlus === 0 && e.eigMinus === 0,
        'N=' + e.Nplus + '  disc=' + e.disc + '  eig=' + e.eigPlus);
  check('equilibria(h) === null for every h > h_crit (the refuge has annihilated)',
        equilibria(15.0001) === null && equilibria(16) === null && equilibria(21) === null);
}

// THE KNIFE-EDGE — just below h_crit holds N > 0 forever; just above drains to 0.
{
  const eB = equilibria(14.95);
  const below = traceH(100, 0.01, 80000, 14.95);
  const above = traceH(100, 0.01, 80000, 15.05);
  check('h=14.95 settles to N₊≈52.886751 and HOLDS (collapsed=false)',
        Math.abs(below.endN - eB.Nplus) < 0.05 && below.collapsed === false,
        'endN=' + below.endN.toFixed(6) + ' vs N₊=' + eB.Nplus.toFixed(6));
  check('h=15.05 drains to exactly 0 (collapsed=true)',
        above.endN === 0 && above.collapsed === true, 'endN=' + above.endN);
}

// IRREVERSIBILITY — past the fold the field is negative everywhere (peak rK/4−h<0),
// so N→0 from ANY start; an emptied pond stays empty; and a LATER lower-h re-run
// from N0=0 still gives endN=0 (the dial can never undo collapse).
{
  let allNeg = true, allDrain = true;
  for (const h of [15.5, 18, 21, 30]) {
    if (!(P.r * P.K / 4 - h < 0)) allNeg = false;
    for (const N0 of [5, 50, 95, 100]) if (traceH(N0, 0.01, 60000, h).endN !== 0) allDrain = false;
  }
  check('past the fold dN/dt<0 everywhere (rK/4−h<0) ⇒ N→0 from any start', allNeg && allDrain);
  check('emptied pond stays empty at fixed effort: f_h(0,h)=−h<0', harvestField(0, 10) === -10);
  // collapse then lower the dial: re-run from N0=0 with sub-critical h still → 0.
  const drained = traceH(100, 0.01, 60000, 20).endN;
  const reRun = traceH(0, 0.01, 60000, 5).endN;     // dial back to h=5 from the empty pond
  check('the latch: after collapse, re-running from N0=0 with low h still gives endN=0 (only restock can refill)',
        drained === 0 && reRun === 0, 'drained=' + drained + '  re-run@h=5 endN=' + reRun);
}

// DETERMINISM — two full self-test runs are byte-identical.
{
  const a = JSON.stringify(runHarvestSelfTest().detail);
  const b = JSON.stringify(runHarvestSelfTest().detail);
  check('two full self-test runs are byte-identical (deterministic)', a === b);
}

// EPS_EMPTY is a single shared constant (the collapse threshold).
{
  check('EPS_EMPTY is one shared positive floor', typeof EPS_EMPTY === 'number' && EPS_EMPTY > 0 && EPS_EMPTY < 1e-6);
}

// ---------------------------------------------------------------------------
//  RE-EXTRACTION PARITY — the harvest core inlined in index.html is byte-identical
//  to core.mjs (between the // ===== HARVEST-CORE sentinels), indentation-normalised.
// ---------------------------------------------------------------------------
{
  const here = dirname(fileURLToPath(import.meta.url));
  const modSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
  const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
  const START = '// ===== HARVEST-CORE (byte-identical to core.mjs) =====';
  const END = '// ===== END HARVEST-CORE =====';

  const mi = modSrc.indexOf(START), mj = modSrc.indexOf(END);
  const pi = pageSrc.indexOf(START), pj = pageSrc.indexOf(END);
  check('core.mjs & index.html both contain the HARVEST-CORE sentinels',
        mi >= 0 && mj > mi && pi >= 0 && pj > pi);
  if (mi >= 0 && mj > mi && pi >= 0 && pj > pi) {
    const modBody = modSrc.slice(mi + START.length, mj).trim();
    const pageBody = pageSrc.slice(pi + START.length, pj).trim();
    const norm = (s) => s.replace(/^\s+/gm, '').replace(/\r/g, '').trim();
    check('inlined HARVEST-CORE matches core.mjs (function bodies, indentation-normalised)',
          norm(pageBody) === norm(modBody),
          norm(pageBody) === norm(modBody) ? 'byte-identical' :
            'DIFFER (page ' + norm(pageBody).length + ' vs mod ' + norm(modBody).length + ' chars)');
  }
}

console.log('\n' + (pass === total ? '✓ ALL ' : '✗ ') + pass + '/' + total + ' checks passed.\n');
process.exit(pass === total ? 0 : 1);
