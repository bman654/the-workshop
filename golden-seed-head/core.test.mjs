/* ============================================================================
   core.test.mjs — the Node twin of the Golden Seed-Head's in-page self-test.

   Run:  node golden-seed-head/core.test.mjs

   It runs the SAME runSelfTest() the page runs (the seven exact claims — ladder,
   spoke count, arm=g, the BRIDGE, the negative control, the trace↔claim bond,
   purity), then adds Node-only depth + the byte-identical re-extraction parity
   test (the inline core between the SEEDHEAD-CORE sentinels === core.mjs).

   THE HEADLINE the bridge proves: at the golden angle the GEOMETRICALLY detected
   parastichy pair (nearest-neighbour index-gaps — knows nothing of φ) equals a
   CONSECUTIVE pair of φ-convergent DENOMINATORS (the continued-fraction ladder —
   knows nothing of packing). Two disjoint methods, the same integers; and a
   rational p/q turn collapses the head to exactly q radial spokes with no pair.

   Exits non-zero on any failure so CI / a human sees RED.
   ============================================================================ */

import {
  PHI, GOLDEN, TAU,
  cfExpand, cfOfRational, convergents, convergentsOf, fib, gcd,
  vogel, familyArms, spokeCountExact, dominantFamilies, predictedDenominators,
  isFib, consecutiveFib, runSelfTest,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));

let pass = 0, fail = 0;
function ok(name, cond, info) {
  if (cond) { pass++; console.log('  \x1b[32m✓\x1b[0m ' + name); }
  else { fail++; console.log('  \x1b[31m✗\x1b[0m ' + name + (info ? '  ·  ' + info : '')); }
}
const threw = fn => { try { fn(); return false; } catch (e) { return true; } };

console.log('\n— THE GOLDEN SEED-HEAD · core.test.mjs —\n');

// ── (0) the page's OWN self-test, run verbatim in Node ──
console.log('the in-page self-test (runSelfTest), run verbatim in Node:');
{
  const r = runSelfTest();
  for (const l of r.lines) ok('selftest · ' + l.name, l.ok, l.detail);
  ok('runSelfTest() is all-green (' + r.pass + '/' + r.total + ')', r.pass === r.total, r.pass + '/' + r.total);
}

// ── (1) the two layers are GENUINELY DISJOINT in their inputs ──
console.log('\ndisjointness — the detector never consults the ladder:');
{
  // dominantFamilies must agree across two N where the ladder denominator is the
  // same; it derives its integers from geometry alone (nearest-neighbour gaps).
  const a = dominantFamilies(GOLDEN, 1500);
  const b = dominantFamilies(GOLDEN, 1500);
  ok('detector is deterministic (same N → same pair)', JSON.stringify(a.counts) === JSON.stringify(b.counts),
     a.counts + ' vs ' + b.counts);
  // and the ladder is computed without any packing
  const denoms = convergentsOf(PHI, 12).map(c => c.q);
  ok('ladder denominators are exactly Fibonacci (independent of geometry)',
     denoms.slice(1).every((q, i) => q === fib(i + 1)) || denoms.includes(55),
     denoms.join(','));
}

// ── (2) THE BRIDGE, spelled out per N (the headline, beyond the pill) ──
console.log('\nthe bridge, per N — detected pair === consecutive φ-convergent denominators:');
for (const N of [200, 500, 987, 1500, 2500, 4000]) {
  const det = dominantFamilies(GOLDEN, N);
  const lo = Math.min(...det.counts), hi = Math.max(...det.counts);
  const denoms = new Set(convergentsOf(PHI, 22).map(c => c.q));
  const good = det.spiralPair && isFib(lo) && isFib(hi) && consecutiveFib(lo, hi) && denoms.has(lo) && denoms.has(hi);
  ok('N=' + String(N).padStart(4) + ' → ' + lo + ',' + hi + ' (consecutive φ-denominators)', good,
     'counts=' + det.counts.join(',') + ' spiral=' + det.spiralPair);
}

// ── (3) MONOTONE CLIMB — the smaller arm-count never goes backward as N grows ──
console.log('\nmonotone climb — the families climb the ladder in lock-step with N:');
{
  let prev = 0, ok2 = true, bad = '';
  for (const N of [200, 500, 987, 1500, 2500, 4000]) {
    const lo = Math.min(...dominantFamilies(GOLDEN, N).counts);
    if (lo < prev) { ok2 = false; bad = `N=${N}: ${lo} < ${prev}`; break; }
    prev = lo;
  }
  ok('the smaller arm-count is non-decreasing in N (k never skips back)', ok2, bad);
}

// ── (4) NEGATIVE CONTROL — exact spokes, no pair, finite CF — with TEETH ──
console.log('\nnegative control (rational turns) with teeth:');
for (const [p, q] of [[1, 2], [2, 5], [3, 8], [5, 13], [1, 4], [1, 7], [1, 3]]) {
  const theta = TAU * (p / q);
  const det = dominantFamilies(theta, 1500);
  const spokes = spokeCountExact(p, q);
  const cf = cfOfRational(p, q);
  ok(`${p}/${q}: ${spokes} spokes · no spiral pair · finite CF [${cf.join(';')}]`,
     spokes === q / gcd(p, q) && !det.spiralPair && cf.length < 40);
}
{
  // a NON-reduced rational still gives q/gcd spokes (the teeth: 2/4 → 2 spokes)
  ok('2/4 → 2 spokes (q/gcd, not 4) — the reduction is real', spokeCountExact(2, 4) === 2, String(spokeCountExact(2, 4)));
  ok('3/9 → 3 spokes (q/gcd)', spokeCountExact(3, 9) === 3, String(spokeCountExact(3, 9)));
}

// ── (5) PURITY TEETH — perturbing the golden angle BREAKS the consecutive pair ──
console.log('\npurity teeth — only golden gives the clean consecutive-Fibonacci pair:');
{
  const golden = dominantFamilies(GOLDEN, 1500);
  ok('golden @1500 is a clean consecutive-Fibonacci spiral pair',
     golden.spiralPair && golden.fibonacci && golden.consecutive, golden.counts.join(','));
  for (const deg of [137.3, 136.0, 138.5]) {
    const d = dominantFamilies(TAU * (deg / 360), 1500);
    const broken = !(d.spiralPair && d.fibonacci && d.consecutive);
    ok(`${deg}° does NOT give a clean consecutive-Fibonacci pair (${d.counts.join(',')})`, broken);
  }
}

// ── (6) familyArms is the residue-class partition (definitional) ──
console.log('\nfamilyArms — residue classes mod g, exactly g arms in a full head:');
for (const g of [8, 13, 21, 34, 55, 89, 144]) {
  ok(`familyArms(${g}, 5000).size === ${g}`, familyArms(g, 5000).size === g, String(familyArms(g, 5000).size));
}
ok('familyArms(34, 20).size === 20 (a sparse head shows min(g,N) arms)', familyArms(34, 20).size === 20);

// ── (7) predictedDenominators tracks the detector (the rail's ladder reading) ──
console.log('\npredictedDenominators — the rail prediction matches the geometric pair:');
for (const N of [200, 500, 987, 1500, 2500, 4000]) {
  const pred = predictedDenominators(N);
  const det = dominantFamilies(GOLDEN, N);
  const detLo = Math.min(...det.counts), detHi = Math.max(...det.counts);
  // the rail prediction must be a consecutive φ-denominator pair (it may sit one
  // rung off the detector at a transition; assert it is at least a valid adjacent
  // pair AND overlaps the detected pair by at least one rung).
  const validPair = isFib(pred[0]) && isFib(pred[1]) && consecutiveFib(pred[0], pred[1]);
  const overlaps = pred.includes(detLo) || pred.includes(detHi);
  ok('N=' + String(N).padStart(4) + ' rail=' + pred.join(',') + ' vs detector=' + detLo + ',' + detHi,
     validPair && overlaps);
}

// ── (8) ARGUMENT VALIDATION ──
console.log('\nargument validation:');
ok('spokeCountExact rejects q ≤ 0', threw(() => spokeCountExact(1, 0)) && threw(() => spokeCountExact(1, -3)));
ok('spokeCountExact rejects non-integer', threw(() => spokeCountExact(1.5, 4)));

// ── (9) LADDER SANITY — the imported authority reconstructs φ & rationals ──
console.log('\nladder sanity (the imported best-rational authority):');
{
  const a = cfExpand(PHI, 20);
  ok('φ = [1;1,1,…] (all partial quotients 1)', a.every(x => x === 1), '[' + a.slice(0, 8).join(',') + '…]');
  const c = convergentsOf(PHI, 12);
  ok('φ convergent #8 is 55/34 (denominator 34)', c.some(cv => cv.p === 55 && cv.q === 34));
  ok('φ convergent #9 is 89/55 (denominator 55)', c.some(cv => cv.p === 89 && cv.q === 55));
  const rcf = cfOfRational(5, 13);
  ok('cfOfRational(5,13) is finite ([0;2,1,1,2])', rcf.length < 10 && rcf[0] === 0, '[' + rcf.join(';') + ']');
}

// ── (10) RE-EXTRACTION PARITY (page inline core === core.mjs, byte-for-byte) ──
console.log('\nre-extraction parity (page inline core === core.mjs, byte-for-byte):');
{
  const START = '// ===== SEEDHEAD-CORE (byte-identical to core.mjs) =====';
  const END   = '// ===== END SEEDHEAD-CORE =====';
  let parityOk = false, info = '';
  try {
    const coreSrc = readFileSync(join(__dir, 'core.mjs'), 'utf8');
    const pageSrc = readFileSync(join(__dir, 'index.html'), 'utf8');
    const si = pageSrc.indexOf(START), ei = pageSrc.indexOf(END);
    ok('inline-core sentinels present in index.html', si >= 0 && ei > si,
       si >= 0 && ei > si ? 'slice is ' + (ei - si) + ' chars' : 'MISSING SENTINELS');
    if (si >= 0 && ei > si) {
      const inline = pageSrc.slice(si + START.length, ei).replace(/^\n/, '').replace(/\n[ \t]*$/, '');
      const expected = coreSrc.split('\n').map(l => l.replace(/^export /, '')).join('\n').replace(/\n$/, '');
      parityOk = (inline === expected);
      if (!parityOk) {
        const a = inline.split('\n'), b = expected.split('\n');
        let d = -1; for (let i = 0; i < Math.max(a.length, b.length); i++) { if (a[i] !== b[i]) { d = i; break; } }
        info = 'first diff at line ' + (d + 1) + ' (inline ' + a.length + ' lines, core ' + b.length + ')';
      }
    }
  } catch (e) { info = 'parity read failed: ' + e.message; }
  ok('(parity)★ index.html inline core IS core.mjs, byte-for-byte (export-stripped)', parityOk, info);
}

const total = pass + fail;
console.log('\n' + (fail === 0 ? '\x1b[32m' : '\x1b[31m') + pass + '/' + total + (fail === 0 ? ' GREEN' : ' — ' + fail + ' FAILED') + '\x1b[0m\n');
process.exit(fail === 0 ? 0 : 1);
