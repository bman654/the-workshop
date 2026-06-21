// Node twin for The Heaviest Dwarfs Are the Smallest. Zero-dep. Run: `node core.test.mjs`.
// Exit 0 = green; non-zero = red. Prints an explicit PASS/FAIL count.
//
// Proves the SIZE story of a white dwarf — a NEGATIVE mass–radius exponent that drives R → 0 at
// the Chandrasekhar mass — against a constant-density NEGATIVE CONTROL with the opposite sign.
// Independent of the page's runSelfTest where it matters:
//   (a) runs the page's own runSelfTest() — all green;
//   (b) INDEPENDENT Node-only re-derivations NOT routed through runSelfTest:
//         · opposite-sign monotone slopes (deg strictly ↓, norm strictly ↑) over ≥500 adjacent pairs,
//         · the Chandrasekhar pinch R_deg(M_CH) === 0 and R_deg(1.43)/R_deg(M₀) ≈ 0.12,
//         · the bodies are dealt EQUAL at M₀ = 0.90 (the chosen meeting point),
//         · the crossing is UNIQUE (sign of R_deg − R_norm flips exactly once, at M₀),
//         · domain guard: the radii throw RangeError on NaN / −1 / Infinity / non-number;
//   (c) the constant-density NEGATIVE CONTROL provably fails the pinch (R_norm stays bounded below
//       by R_norm(M_MIN) > 0 and is positive at/past M_CH; flip the exponent's sign and neither the
//       inversion nor the collapse happens), AND removing the relativistic factor from the
//       degenerate law leaves it strictly positive at M_CH — so the pinch is the factor's doing;
//   (d) BYTE-PARITY: the inlined core between the sentinels in index.html is byte-identical
//       (indentation-normalized) to core.mjs's body.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  M_CH, M_MIN, M0,
  rDegenerate, rNormal, rDegenerateNoRel, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok){ if (ok) pass++; else { fail++; fails.push(name); } }

// ── (a) the page's own self-test is all-green ──
const st = runSelfTest();
for (const c of st.checks) ck('selftest ' + c.name + '  [' + c.info + ']', c.pass);

// ── (b) INDEPENDENT re-derivations (not via runSelfTest) ──
const N = 600;
function sweep(){ const xs = []; for (let i = 0; i <= N; i++) xs.push(M_MIN + (M_CH - M_MIN) * i / N); return xs; }

// OPPOSITE-SIGN MONOTONE SLOPES — degenerate strictly decreasing, normal strictly increasing.
(() => {
  const xs = sweep();
  let degDecr = true, normIncr = true;
  for (let i = 1; i < xs.length; i++){
    if (!(rDegenerate(xs[i]) < rDegenerate(xs[i-1]))) degDecr = false;
    if (!(rNormal(xs[i])     > rNormal(xs[i-1])))     normIncr = false;
  }
  ck('degenerate R strictly DECREASING across ' + N + ' adjacent pairs (negative exponent)', degDecr);
  ck('normal R strictly INCREASING across ' + N + ' adjacent pairs (positive exponent)', normIncr);
})();

// CHANDRASEKHAR PINCH — R_deg(M_CH) === 0 exactly, and R_deg(1.43) already pinched to ≈0.12·R₀.
ck('Chandrasekhar pinch: rDegenerate(M_CH) === 0 exactly  [' + rDegenerate(M_CH) + ']',
   rDegenerate(M_CH) === 0);
ck('already pinched at 1.43: rDegenerate(1.43)/rDegenerate(M₀) ≈ 0.12  [' +
   (rDegenerate(1.43) / rDegenerate(M0)).toFixed(4) + ']',
   Math.abs(rDegenerate(1.43) / rDegenerate(M0) - 0.12) < 0.02);

// the radius keeps falling all the way in — at 0.99·M_CH it is below 1/5 of the M₀ size.
ck('deep pinch near the limit: rDegenerate(0.99·M_CH) < 0.2·rDegenerate(M₀)  [' +
   (rDegenerate(0.99 * M_CH) / rDegenerate(M0)).toFixed(4) + ']',
   rDegenerate(0.99 * M_CH) / rDegenerate(M0) < 0.2);

// DEALT EQUAL AT M₀ — the chosen meeting point: both radii equal 1 (and each other) at M₀=0.90.
ck('dealt equal at M₀=0.90: rDegenerate(M₀) === rNormal(M₀) === 1 (to machine ε)  [' +
   rDegenerate(M0).toFixed(9) + ' / ' + rNormal(M0).toFixed(9) + ']',
   Math.abs(rDegenerate(M0) - 1) < 1e-9 && Math.abs(rNormal(M0) - 1) < 1e-9 &&
   Math.abs(rDegenerate(M0) - rNormal(M0)) < 1e-12);

// THE CROSSING IS UNIQUE — sign(R_deg − R_norm) flips exactly once, near M₀.
(() => {
  const xs = sweep();
  let crossings = 0, crossM = NaN, prev = null;
  for (const M of xs){
    const diff = rDegenerate(M) - rNormal(M);
    const s = diff > 0 ? 1 : diff < 0 ? -1 : 0;
    if (s !== 0){ if (prev !== null && s !== prev){ crossings++; crossM = M; } prev = s; }
  }
  ck('crossing is unique: R_deg − R_norm flips sign exactly once  [count=' + crossings + ']',
     crossings === 1);
  ck('crossing lands at M₀=0.90: |crossM − M₀| < 0.01  [crossM≈' +
     (Number.isNaN(crossM) ? 'none' : crossM.toFixed(4)) + ']',
     Math.abs(crossM - M0) < 0.01);
})();

// below the crossing the dwarf is the BIGGER body; above it the SMALLER — the swap.
ck('below M₀ the dwarf is BIGGER (R_deg > R_norm at M=0.6)  [' +
   rDegenerate(0.6).toFixed(3) + ' > ' + rNormal(0.6).toFixed(3) + ']',
   rDegenerate(0.6) > rNormal(0.6));
ck('above M₀ the dwarf is SMALLER (R_deg < R_norm at M=1.2)  [' +
   rDegenerate(1.2).toFixed(3) + ' < ' + rNormal(1.2).toFixed(3) + ']',
   rDegenerate(1.2) < rNormal(1.2));

// DOMAIN GUARD — a non-physical mass throws RangeError (no silent garbage radius).
function throwsRange(fn){ try { fn(); return false; } catch(e){ return e instanceof RangeError; } }
ck('domain guard: rDegenerate(NaN) throws RangeError', throwsRange(() => rDegenerate(NaN)));
ck('domain guard: rNormal(-1) throws RangeError', throwsRange(() => rNormal(-1)));
ck('domain guard: rDegenerate(Infinity) throws RangeError', throwsRange(() => rDegenerate(Infinity)));
ck('domain guard: rNormal("2") throws RangeError (not a number)', throwsRange(() => rNormal('2')));

// ── (c) the NEGATIVE CONTROL provably fails the pinch ──
// the constant-density body is bounded below by R_norm(M_MIN) > 0 across the sweep AND past M_CH.
(() => {
  const xs = sweep();
  const floor = rNormal(M_MIN);
  let bounded = true;
  for (const M of xs) if (rNormal(M) < floor - 1e-12) bounded = false;
  ck('NEG-CONTROL: R_norm bounded below by R_norm(M_MIN) > 0 across the sweep (never pinches)  [floor=' +
     floor.toFixed(4) + ']', bounded && floor > 0);
})();
ck('NEG-CONTROL: R_norm stays POSITIVE at/past M_CH (a +1/3 body never collapses)  [R_norm(M_CH)=' +
   rNormal(M_CH).toFixed(4) + ', R_norm(1.8)=' + rNormal(1.8).toFixed(4) + ']',
   rNormal(M_CH) > 0 && rNormal(1.8) > 0);
// the sign is load-bearing: at M₀ the two laws agree (1), but their slopes have opposite sign.
ck('NEG-CONTROL: exponent sign is load-bearing — at M₀ both are 1, but R_deg is FALLING while R_norm RISES',
   (() => {
     const eps = 1e-4;
     const degSlope  = (rDegenerate(M0 + eps) - rDegenerate(M0 - eps)) / (2 * eps);
     const normSlope = (rNormal(M0 + eps)     - rNormal(M0 - eps))     / (2 * eps);
     return degSlope < 0 && normSlope > 0;
   })());
// removing the relativistic factor: the degenerate law stays strictly POSITIVE at M_CH — so the
// pinch is the FACTOR's doing, not the negative exponent's and not a magic floor.
ck('NEG-CONTROL: factor-removed degenerate law (pure S·M^−1/3) is POSITIVE at M_CH  [' +
   rDegenerateNoRel(M_CH).toFixed(4) + ' > 0]',
   rDegenerateNoRel(M_CH) > 0);
ck('NEG-CONTROL: the relativistic factor is what zeroes it — full deg(M_CH)=0 but no-rel deg(M_CH)>0',
   rDegenerate(M_CH) === 0 && rDegenerateNoRel(M_CH) > 0);

// ── (d) BYTE-PARITY: index.html's inlined core === core.mjs body (indentation-normalized) ──
const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
const BEGIN = '// ===== MASS-RADIUS CORE (byte-identical to core.mjs) =====';
const END = '// ===== END MASS-RADIUS CORE =====';
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
ck('byte-parity: MASS-RADIUS CORE sentinels present in core.mjs', !!coreRegion);
ck('byte-parity: MASS-RADIUS CORE sentinels present in index.html', !!pageRegion);
ck('byte-parity: index.html inlined core === core.mjs body (indentation-normalized)',
   !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion));

// ── report ──
console.log('The Heaviest Dwarfs Are the Smallest — core.test.mjs');
console.log('  page self-test: ' + st.passed + '/' + st.total + ' checks green');
console.log('  byte-parity: ' + (coreRegion && pageRegion && norm(coreRegion) === norm(pageRegion) ? 'IDENTICAL' : 'DRIFTED'));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
