// Node twin for The Same Threshold core. Zero-dep. Run: `node cross/the-same-threshold/core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html, so the page's gold self-test
// pill and this twin can never drift. It re-proves the legs the in-page pill proves, PLUS the byte-twin
// parity leg (index.html CORE region === core.mjs CORE char-for-char), an anti-circularity check, and a
// finite-field giant witness that grounds the analytic curve in real fusing dots.
//
//   1.  AGREEMENT (fresh limit) — for c in {1.2,1.5,2.0,2.5,3.0,4.0}: |predictedS(c) − attackFresh(c,1e-12)|
//       < 1e-9 (worst measured 4.35e-12). Two code-disjoint solvers on the SAME transcendental root.
//   2.  DEAD ZONE — for c in {0.5,0.8,1.0}: predictedS(c)===0 AND attackFresh(c)===0 (both pinned to 0).
//   3.  NEG-CONTROL (load-bearing) — at SHIPPED I0=1e-3 the gap |predictedS − attackShipped| is NONZERO
//       across the sweep (≥1e-4, peaks 4.40e-2 at c=1) AND the shipped attack is >0 for some c≤1.
//       A vacuous always-agree checker — or one comparing predictedS to the SHIPPED value — provably FAILS.
//   4.  R0 ENACTMENT — |R0(freshParams(c,1e-12)) − c| < 1e-12 across the sweep (NOT ===).
//   5.  ANTI-CIRCULARITY — the giant solver body never names an SIR fn (finalSize/Phi/rk4Step/R0) and vice
//       versa: two code-disjoint domains landing on one number.
//   6.  BYTE-TWIN PARITY — index.html's inlined CORE region === core.mjs CORE char-for-char.
//   7.  (witness) measured giantFraction from a seeded randomEdges field at large n lands within the
//       parent's tolerance band of predictedS(c) — grounding the curve in real fusing dots.
//   8.  PARITY with the shared runSelfTest (the function the page inlines).
// process.exit(pass === total ? 0 : 1).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  predictedS, randomEdges, giantFraction, edgesForK, mulberry32, hashSeed,
  R0, finalSize, Phi, rk4Step, peakS,
  freshParams, attackFresh, attackShipped, readings, SWEEP, DEAD_ZONE, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0; const fails = [];
function ck(name, ok, info) {
  if (ok) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { fail++; fails.push(name); console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\nThe Same Threshold — Node twin (a forest and a fever cross one line)\n');

// ── LEG 1: AGREEMENT (fresh limit) — same transcendental root, two disjoint solvers ──────────────
console.log('— Leg 1: the forest (giant fraction) and the fever (fresh attack) are the SAME root <1e-9 —');
{
  let worst = 0, worstC = null;
  for (const c of SWEEP) {
    const r = readings(c, 1e-12);
    if (r.diff > worst) { worst = r.diff; worstC = c; }
    ck('c=' + c + ': |predictedS − attackFresh| < 1e-9',
      r.diff < 1e-9,
      'predictedS=' + r.forestS.toFixed(10) + ' attackFresh=' + r.feverZ.toFixed(10) + ' diff=' + r.diff.toExponential(2));
  }
  ck('worst agreement diff over the sweep < 1e-9', worst < 1e-9, 'worst=' + worst.toExponential(2) + ' at c=' + worstC);
}

// ── LEG 2: DEAD ZONE — both EXACTLY 0 below criticality (the shared c=1 threshold) ───────────────
console.log('\n— Leg 2: the dead zone — both pinned to EXACTLY 0 for c ≤ 1 —');
{
  for (const c of DEAD_ZONE) {
    const pS = predictedS(c), aF = attackFresh(c, 1e-12);
    ck('c=' + c + ': predictedS===0 AND attackFresh===0 (both pinned)',
      pS === 0 && aF === 0, 'predictedS=' + pS + ' attackFresh=' + aF);
  }
}

// ── LEG 3: NEG-CONTROL — the shipped seed PEELS the fever away from the forest ───────────────────
console.log('\n— Leg 3 (load-bearing): the SHIPPED seed peels the fever off the forest — agreement is the LIMIT —');
{
  let minGap = Infinity, peakGap = 0, peakC = null;
  for (const c of [0.5, 0.8, 0.95, 1.0, 1.2, 1.5, 2.0, 2.5, 3.0, 4.0]) {
    const gap = Math.abs(predictedS(c) - attackShipped(c, 1e-3));
    minGap = Math.min(minGap, gap);
    if (gap > peakGap) { peakGap = gap; peakC = c; }
  }
  ck('the shipped gap is NONZERO across the whole sweep (≥1e-4)', minGap >= 1e-4, 'minGap=' + minGap.toExponential(2));
  ck('the shipped gap PEAKS at the c=1 knee (~4.40e-2)', peakGap > 4e-2 && peakC === 1.0,
    'peakGap=' + peakGap.toExponential(2) + ' at c=' + peakC);
  // the shipped fever shows attack BELOW criticality (the forest is dead-flat zero there):
  const sub08 = attackShipped(0.8, 1e-3), sub10 = attackShipped(1.0, 1e-3);
  ck('shipped attack is NONZERO for c ≤ 1 while the forest is exactly 0 (prior-immunity seeding)',
    sub08 > 0 && sub10 > 0 && predictedS(0.8) === 0 && predictedS(1.0) === 0,
    'attackShipped(0.8)=' + sub08.toExponential(3) + ' attackShipped(1.0)=' + sub10.toExponential(3) + ' · forest=0');
}

// ── ANTI-VACUITY: a checker that compares predictedS to the SHIPPED value FAILS the agreement gate ─
console.log('\n— Anti-vacuity: a "predictedS === shipped attack" checker FAILS (the control bites) —');
{
  // The honest checker compares predictedS to the FRESH attack and passes; comparing to SHIPPED fails.
  let freshPasses = true, shippedPasses = true;
  for (const c of SWEEP) {
    if (!(Math.abs(predictedS(c) - attackFresh(c, 1e-12)) < 1e-9)) freshPasses = false;
    if (!(Math.abs(predictedS(c) - attackShipped(c, 1e-3)) < 1e-9)) shippedPasses = false;
  }
  ck('the FRESH comparison passes the <1e-9 gate (the real agreement)', freshPasses);
  ck('the SHIPPED comparison FAILS the <1e-9 gate (so the agreement is NOT a tautology)', !shippedPasses,
    'shipped never coincides to 1e-9');
}

// ── LEG 4: R0 ENACTMENT — freshParams(c) really has reproduction number c ────────────────────────
console.log('\n— Leg 4: R0 enactment — freshParams(c) really HAS reproduction number c (|R0−c|<1e-12) —');
{
  let worst = 0;
  for (const c of SWEEP) {
    const e = Math.abs(R0(freshParams(c, 1e-12)) - c);
    worst = Math.max(worst, e);
    ck('c=' + c + ': |R0(freshParams(c)) − c| < 1e-12 (not ===)', e < 1e-12, '|R0−c|=' + e.toExponential(2));
  }
  ck('worst |R0 − c| over the sweep < 1e-12', worst < 1e-12, 'worst=' + worst.toExponential(2));
}

// ── LEG 5: ANTI-CIRCULARITY — the two cores are disjoint (neither solver names the other) ─────────
console.log('\n— Leg 5: anti-circularity — the two solvers are code-disjoint (neither names the other) —');
{
  const here = dirname(fileURLToPath(import.meta.url));
  const src = readFileSync(join(here, 'core.mjs'), 'utf8');
  const HEAD_A = '// ══ CORE A: THE FOREST';
  const HEAD_B = '// ══ CORE B: THE FEVER';
  const HEAD_ADAPTER = '// ══ THE THIN ADAPTER';
  const giantBody = src.slice(src.indexOf(HEAD_A), src.indexOf(HEAD_B));
  const sirBody = src.slice(src.indexOf(HEAD_B), src.indexOf(HEAD_ADAPTER));
  ck('the FOREST (giant) core never names an SIR fn (finalSize/Phi/rk4Step/R0/eulerStep/trace)',
    !/\bfinalSize\b|\bPhi\b|\brk4Step\b|\bR0\b|\beulerStep\b|\btrace\b|IprimeAtZero/.test(giantBody));
  ck('the FEVER (SIR) core never names a giant fn (predictedS/giantFraction/DSU/randomEdges/union)',
    !/predictedS|giantFraction|\bDSU\b|randomEdges|latticeEdges|floodMaxComponent|\bunion\b/.test(sirBody));
}

// ── LEG 6: BYTE-TWIN PARITY — the inlined slab IS the module, byte-for-byte ───────────────────────
console.log('\n— Leg 6: byte-twin parity (index.html CORE slab === core.mjs CORE char-for-char) —');
{
  const BEGIN = '// === CORE BEGIN ===', END = '// === CORE END ===';
  const region = (text) => { const i = text.indexOf(BEGIN), j = text.indexOf(END); return (i < 0 || j < 0 || j < i) ? null : text.slice(i, j + END.length); };
  const here = dirname(fileURLToPath(import.meta.url));
  const coreReg = region(readFileSync(join(here, 'core.mjs'), 'utf8'));
  const pageReg = region(readFileSync(join(here, 'index.html'), 'utf8'));
  ck('byte-twin: core.mjs CORE region present', !!coreReg);
  ck('byte-twin: index.html CORE region present', !!pageReg);
  ck('byte-twin PARITY: index.html CORE === core.mjs CORE (byte-identical)',
    !!coreReg && !!pageReg && coreReg === pageReg,
    coreReg == null ? 'core sentinels MISSING' : pageReg == null ? 'page sentinels MISSING' :
      (coreReg === pageReg ? 'slice ' + coreReg.length + ' chars identical' : 'DRIFT (core ' + coreReg.length + ' vs page ' + pageReg.length + ')'));
}

// ── LEG 7: FINITE-FIELD WITNESS — a measured giant fraction tracks the analytic curve ────────────
console.log('\n— Leg 7: finite-field witness — real fusing dots land within the parent tolerance of predictedS —');
{
  // The parent (giant-component) proves measured-vs-predicted within a tolerance band at finite n.
  // Here we reproduce the parent's own witness at large n so the ANALYTIC curve is grounded in dots.
  const n = 20000;
  const rng = mulberry32(hashSeed('the-same-threshold'));
  const edges = randomEdges(n, rng);
  let worst = 0;
  for (const c of [1.5, 2.0, 3.0]) {
    const m = edgesForK(c, n);
    const measured = giantFraction(edges, m, n);
    const predicted = predictedS(c);
    const err = Math.abs(measured - predicted);
    worst = Math.max(worst, err);
    ck('c=' + c + ': measured giantFraction ≈ predictedS within 0.03 (finite-n band)',
      err < 0.03, 'measured=' + measured.toFixed(5) + ' predicted=' + predicted.toFixed(5) + ' |err|=' + err.toFixed(5));
  }
  ck('worst finite-field error over {1.5,2.0,3.0} < 0.03 (the dots really fuse along the curve)',
    worst < 0.03, 'worst=' + worst.toFixed(5));
}

// ── LEG 8: PARITY with the shared runSelfTest (the function the page inlines) ─────────────────────
console.log('\n— Leg 8: the shared runSelfTest (the function the page inlines as its pill) agrees —');
{
  const r = runSelfTest();
  ck('core.mjs runSelfTest passes all legs', r.ok, r.pass + '/' + r.total + (r.detail.length ? ' · ' + r.detail.join(',') : ''));
}

console.log('\n—— The Same Threshold Node twin: ' + pass + '/' + (pass + fail) + ' ——');
if (fail) { console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
console.log('  ALL GREEN ✓\n');
process.exit(0);
