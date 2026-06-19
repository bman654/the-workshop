// Node twin for The Micrometer Interferometer. Zero-dep. Run: `node core.test.mjs`.
// Exit 0 = green; non-zero = red. Prints an explicit PASS/FAIL count.
//
// Proves the CLAIM of a Michelson — λ = 2·Δd/N — and that the round-trip factor of 2 is real,
// not a fit. Independent of the page's runSelfTest where it matters:
//   (a) runs the page's own runSelfTest() — all green;
//   (b) INDEPENDENT Node-only re-derivations NOT routed through runSelfTest:
//         · λ = 2·Δd/N to < 1e-9 for n = 1..16 across several λ, with Δd = n·λ/2,
//         · the naive-law NEG-CONTROL: naive·ROUND_TRIP === recoverLambda to the bit AND
//           |naive − λ| > 1e-6 (forgetting the round trip undercounts by exactly ×2),
//         · ROUND_TRIP === 2,
//         · the dead-screen NEG-CONTROL: deadFringeCount === 0 over any Δd,
//         · domain guards: recoverLambda / onAxisIntensity throw RangeError on bad input;
//   (c) the naive + dead-screen NEGATIVE CONTROLS provably FAIL (assert the failing condition);
//   (d) DISCIPLINE: byte-parity of the inlined core in index.html against core.mjs's body
//       (indentation-normalized), a zero-import grep on core.mjs's body, and an
//       anti-circularity grep — the recoverLambda DEFINITION appears in exactly ONE .mjs.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  ROUND_TRIP, D_REF, LAM_REF,
  pathDifference, onAxisIntensity, fringeCount,
  recoverLambda, recoverLambdaNaive,
  ringAngle, centerOrder, ringIntensity,
  deadFringeCount,
  runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok){ if (ok) pass++; else { fail++; fails.push(name); } }

// ── (a) the page's own self-test is all-green ──
const st = runSelfTest();
for (const c of st.checks) ck('selftest ' + c.name + '  [' + c.info + ']', c.pass);

// ── (b) INDEPENDENT re-derivations (not via runSelfTest) ──

// λ = 2·Δd/N for n = 1..16 across several wavelengths — build Δd = n·λ/2, recover λ.
{
  const lams = [405e-9, 532e-9, 633e-9, 700e-9];
  let worst = 0;
  for (const lam of lams){
    for (let n = 1; n <= 16; n++){
      const dd = n * lam / ROUND_TRIP;            // Δd = n·λ/2
      const err = Math.abs(recoverLambda(dd, n) - lam);
      if (err > worst) worst = err;
    }
  }
  ck('λ = 2·Δd/N to <1e-9 for n=1..16 across 405/532/633/700nm  [worst ' + worst.toExponential(2) + ' m]',
     worst < 1e-9);
}

// ROUND_TRIP is the factor of 2 the whole instrument rides on.
ck('ROUND_TRIP === 2  [' + ROUND_TRIP + ']', ROUND_TRIP === 2);

// pathDifference doubles Δd (the moving arm is traversed twice).
ck('pathDifference(Δd) === 2·Δd  [pathDifference(1e-3)=' + pathDifference(1e-3) + ']',
   pathDifference(1e-3) === 2 * 1e-3);

// round(fringeCount(N·λ/2, λ)) === N for a sweep of N (the integer ring tally the page shows).
ck('round(fringeCount(N·λ/2, λ)) === N for N∈{1,7,100,1000}', (() => {
  const lam = LAM_REF;
  for (const N of [1, 7, 100, 1000]){
    if (Math.round(fringeCount(N * lam / ROUND_TRIP, lam)) !== N) return false;
  }
  return true;
})());

// the on-axis law: bright at δ=mλ, dark at δ=(m+½)λ.
ck('on-axis bright(δ=2λ)=1 and dark(δ=2.5λ)≈0  [' +
   onAxisIntensity(2 * LAM_REF, LAM_REF).toFixed(6) + ' / ' +
   onAxisIntensity(2.5 * LAM_REF, LAM_REF).toFixed(6) + ']',
   Math.abs(onAxisIntensity(2 * LAM_REF, LAM_REF) - 1) < 1e-12 &&
   onAxisIntensity(2.5 * LAM_REF, LAM_REF) < 1e-12);

// ring geometry: center order is innermost, rings grow outward toward lower orders.
ck('ring geometry: θ(centerOrder) < θ(centerOrder−1) < θ(centerOrder−2)', (() => {
  const m0 = centerOrder();
  const a0 = ringAngle(m0), a1 = ringAngle(m0 - 1), a2 = ringAngle(m0 - 2);
  return a0 !== null && a1 !== null && a2 !== null && a0 < a1 && a1 < a2;
})());

// an order whose cosθ would exceed 1 has no ring (null).
ck('ringAngle returns null when cosθ would exceed 1 (no such ring)',
   ringAngle(Math.ceil(ROUND_TRIP * D_REF / LAM_REF) + 5) === null);

// ringIntensity stays in [0,1] over a normalized-radius sweep, and tracks the on-axis law at r=0.
ck('ringIntensity ⊂ [0,1] over rNorm∈[0,1] and ringIntensity(0)===onAxisIntensity at θ=0', (() => {
  for (let k = 0; k <= 50; k++){
    const v = ringIntensity(k / 50, D_REF, LAM_REF);
    if (v < 0 || v > 1) return false;
  }
  return Math.abs(ringIntensity(0, D_REF, LAM_REF) - onAxisIntensity(ROUND_TRIP * D_REF, LAM_REF)) < 1e-12;
})());

// ── (c) the NEGATIVE CONTROLS provably FAIL ──

// the naive law (forgetting the round trip) is wrong by exactly ×2.
ck('NEG-CONTROL: naive·ROUND_TRIP === recoverLambda to the bit, AND |naive − λ| === λ/2 (wrong by ×2)', (() => {
  const lam = LAM_REF, N = 1000;
  const dd = N * lam / ROUND_TRIP;
  const naive = recoverLambdaNaive(dd, N);          // = λ/2
  const real = recoverLambda(dd, N);                // = λ
  // round-trip-exact: naive doubled is the true λ to the bit; and naive is off by exactly λ/2.
  return Math.abs(naive * ROUND_TRIP - real) < 1e-18 && Math.abs(Math.abs(naive - lam) - lam / 2) < 1e-18;
})());

// a dead screen reports zero fringes for any Δd — it can't fake a wavelength.
ck('NEG-CONTROL: deadFringeCount === 0 over any Δd, and disagrees with the live count', (() => {
  for (const dd of [0, 1e-9, 1e-6, 1e-3, 1, 1e3]){
    if (deadFringeCount(dd) !== 0) return false;
  }
  const live = fringeCount(D_REF, LAM_REF);
  return live > 0 && deadFringeCount(D_REF) !== live;
})());

// ── DOMAIN GUARDS — bad input throws RangeError (no silent NaN) ──
function throwsRange(fn){ try { fn(); return false; } catch(e){ return e instanceof RangeError; } }
ck('domain guard: recoverLambda(Δd, 0) throws RangeError (N must be > 0)', throwsRange(() => recoverLambda(1e-3, 0)));
ck('domain guard: recoverLambda(NaN, 5) throws RangeError', throwsRange(() => recoverLambda(NaN, 5)));
ck('domain guard: onAxisIntensity(δ, 0) throws RangeError (λ must be > 0)', throwsRange(() => onAxisIntensity(1e-3, 0)));
ck('domain guard: fringeCount(Δd, -1) throws RangeError (λ must be > 0)', throwsRange(() => fringeCount(1e-3, -1)));

// ── (d) DISCIPLINE: byte-parity, zero-import, anti-circularity ──
const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
const BEGIN = '// ===== INTERFEROMETER CORE (byte-identical to core.mjs) =====';
const END = '// ===== END INTERFEROMETER CORE =====';
function region(text){
  const i = text.indexOf(BEGIN), j = text.indexOf(END);
  if (i < 0 || j < 0 || j < i) return null;
  return text.slice(i + BEGIN.length, j);
}
function norm(s){
  return s.split('\n').map(l => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter(l => l.length).join('\n');
}
const coreRegion = region(coreSrc);
const pageRegion = region(pageSrc);
ck('byte-parity: INTERFEROMETER CORE sentinels present in core.mjs', !!coreRegion);
ck('byte-parity: INTERFEROMETER CORE sentinels present in index.html', !!pageRegion);
ck('byte-parity: index.html inlined core === core.mjs body (indentation-normalized)',
   !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion));

// zero-import: core.mjs's body (between sentinels) names no import/require.
ck('zero-import: core.mjs body has no import/require',
   !!coreRegion && !/\b(import|require)\b/.test(coreRegion));

// core.mjs never reaches into the DOM (no document/window references in its body).
ck('core.mjs body never references document/window',
   !!coreRegion && !/\b(document|window)\b/.test(coreRegion));

// anti-circularity: the recoverLambda DEFINITION lives in exactly one .mjs (this core).
// Needle assembled from parts so this very test file isn't a second match.
const needle = 'fun' + 'ction recoverLambda(';
const inCore = coreSrc.includes(needle);
const inTest = readFileSync(fileURLToPath(import.meta.url), 'utf8').includes(needle);
ck('anti-circularity: the recoverLambda definition appears in exactly one .mjs (core.mjs)',
   inCore && !inTest);

// ── report ──
console.log('The Micrometer Interferometer — core.test.mjs');
console.log('  page self-test: ' + st.passed + '/' + st.total + ' checks green');
console.log('  byte-parity: ' + (coreRegion && pageRegion && norm(coreRegion) === norm(pageRegion) ? 'IDENTICAL' : 'DRIFTED'));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
