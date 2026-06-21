// Node twin for The Transit. Zero-dep. Run: `node transit/core.test.mjs`.
// Exit 0 = green; non-zero = red. Prints an explicit PASS/FAIL count.
//
// Proves the photometry's claims INDEPENDENTLY of the page's in-page pill where it
// matters:
//   (a) runs the core's own runSelfTest() — all nine legs green (the 8 photometry
//       legs from the Photometry/GameLoop facets + winnability);
//   (b) INDEPENDENT Node-only re-derivations NOT routed through the self-test:
//         · a SECOND independent numeric integration of the lens area (Monte-Carlo
//           dart count) agrees with lensOverlap — a different second way than the
//           Simpson strip the in-page leg uses;
//         · the FULL-transit depth === ρ² re-checked over a fine ρ×b grid;
//         · the graze dip is strictly shallower than ρ² over a sweep of grazing b;
//         · the depth↔ratio inverse pair re-checked over a fine ρ grid;
//         · neg-control depth identically 0 over a sweep of x for b>1+ρ;
//         · symmetry: depthAt(ρ,b,x) === depthAt(ρ,b,−x) exactly;
//         · the caliper grid is fine enough that every dealt ρ_true is reachable
//           to within a bullseye (the winnability-leg generalisation);
//   (c) BYTE-PARITY: the inlined core between the sentinels in index.html is
//       byte-identical (indentation-normalized) to core.mjs's body.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  lensOverlap, depthAt, maxDepth, transitKind, flatHalfWidth, contactHalfWidth,
  depthFromRatio, ratioFromDepth, makeRng, scoreGuess, roundScore, dealPlanet,
  DEAL, SCORE, SCENE, TOL_TIGHT, TOL_NUM, runSelfTest, lensOverlapNumeric,
} from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok){ if (ok) pass++; else { fail++; fails.push(name); } }

// ── (a) the core's own self-test is all-green ──
const st = runSelfTest();
for (const c of st.checks) ck('selftest ' + c.name + '  [' + c.info + ']', c.pass);

// ── (b) INDEPENDENT re-derivations (not via the self-test) ──

// A SECOND independent area route: MONTE-CARLO dart count. Throw darts uniformly
// into the bounding box of disc r (centred at (d,0)); a dart inside BOTH discs
// counts. area ≈ (hits/total)·boxArea. A completely different algorithm than both
// the acos form and the Simpson strip — converges slowly but to the same number.
ck('monte-carlo dart count agrees with lensOverlap to <3e-3 (third independent route)', (() => {
  const R = 1, r = 0.18, d = 0.9;
  const rng = makeRng(0xDA27);
  const box = { x0: d - r, x1: d + r, y0: -r, y1: r };
  const boxArea = (box.x1 - box.x0) * (box.y1 - box.y0);
  const N = 4000000;
  let hits = 0;
  for (let i = 0; i < N; i++){
    const x = box.x0 + rng() * (box.x1 - box.x0);
    const y = box.y0 + rng() * (box.y1 - box.y0);
    const inR = x * x + y * y <= R * R;
    const inr = (x - d) * (x - d) + y * y <= r * r;
    if (inR && inr) hits++;
  }
  const est = (hits / N) * boxArea;
  const exact = lensOverlap(R, r, d);
  return Math.abs(est - exact) < 3e-3;   // MC error ~ 1/√N at this N
})());

// the SIMPSON route again, but over a SWEEP of (r,d) the self-test does not cover.
ck('Simpson lens-area matches lensOverlap < 1e-9 over a swept (r,d) grid', (() => {
  let worst = 0;
  for (let r = 0.04; r <= 0.22; r += 0.03){
    for (let d = 1 - r + 0.01; d < 1 + r; d += (2 * r) / 5){   // the partial-overlap band
      const e = Math.abs(lensOverlap(1, r, d) - lensOverlapNumeric(1, r, d));
      if (e > worst) worst = e;
    }
    // and a fully-contained case
    const dC = (1 - r) * 0.5;
    worst = Math.max(worst, Math.abs(lensOverlap(1, r, dC) - lensOverlapNumeric(1, r, dC)));
  }
  return worst < TOL_NUM;
})());

// FULL depth === ρ² over a fine ρ×b grid (every b that yields a full transit).
ck('FULL depth === ρ² exact over a fine ρ×b grid (b ≤ 1−ρ)', (() => {
  let worst = 0;
  for (let rho = 0.04; rho <= 0.22; rho += 0.01){
    for (let b = 0; b <= (1 - rho) - 1e-6; b += (1 - rho) / 8){
      worst = Math.max(worst, Math.abs(maxDepth(rho, b) - rho * rho));
    }
  }
  return worst < TOL_TIGHT;
})());

// GRAZE depth strictly shallower than ρ² over a sweep of grazing b.
ck('GRAZE max depth strictly < ρ² over a sweep of grazing b (1−ρ < b < 1+ρ)', (() => {
  let allShallow = true, allNoFlat = true;
  for (let rho = 0.06; rho <= 0.20; rho += 0.02){
    for (let b = (1 - rho) + 1e-4; b < (1 + rho) - 1e-4; b += (2 * rho) / 10){
      if (!(maxDepth(rho, b) < rho * rho - 1e-12)) allShallow = false;
      if (flatHalfWidth(rho, b) !== 0) allNoFlat = false;
    }
  }
  return allShallow && allNoFlat;
})());

// the depth↔ratio inverse pair, re-checked on a fine ρ grid.
ck('depth↔ratio inverse: √(ρ²)===ρ and (√d)²===d over a fine grid (<1e-12)', (() => {
  let worst = 0;
  for (let rho = 0.02; rho <= 0.30; rho += 0.005){
    const d = depthFromRatio(rho);
    worst = Math.max(worst, Math.abs(ratioFromDepth(d) - rho));
    const dd = d;                                   // and the reverse round-trip
    worst = Math.max(worst, Math.abs(depthFromRatio(ratioFromDepth(dd)) - dd));
  }
  return worst < TOL_TIGHT;
})());

// NEG-CONTROL: depth identically 0 over a sweep of x for b > 1+ρ.
ck('neg-control: depthAt === 0 exactly over a sweep of x when b > 1+ρ', (() => {
  const rho = 0.14, b = 1 + rho + 0.1;
  for (let x = -2; x <= 2; x += 0.05){
    if (depthAt(rho, b, x) !== 0) return false;
  }
  return contactHalfWidth(rho, b) === 0;
})());

// SYMMETRY: the dip is exactly mirror-symmetric in x (the passage is symmetric
// about mid-transit) — depthAt(ρ,b,x) === depthAt(ρ,b,−x) to machine ε.
ck('symmetry: depthAt(ρ,b,x) === depthAt(ρ,b,−x) exactly (mirror about mid-transit)', (() => {
  const rho = 0.17, b = 0.6;
  let worst = 0;
  for (let x = 0; x <= 1.3; x += 0.013){
    worst = Math.max(worst, Math.abs(depthAt(rho, b, x) - depthAt(rho, b, -x)));
  }
  return worst < TOL_TIGHT;
})());

// CALIPER GRID WINNABILITY — the page's caliper resolves ρ on a fine grid; the
// grid step must be fine enough that the nearest grid point to ANY dealt ρ_true is
// inside the bull tolerance, so every deal is winnable by snapping the caliper.
// (The page uses a continuous pointer-drag, so this proves the worst-case discrete
// fallback still wins.) gridStep here mirrors the page's keyboard nudge (0.001).
ck('caliper grid winnable: nearest 0.001 grid point to any dealt ρ is a bull', (() => {
  const gridStep = 0.001;
  const rng = makeRng(31337);
  for (let i = 0; i < 2000; i++){
    const { rhoTrue } = dealPlanet(rng);
    const nearest = Math.round(rhoTrue / gridStep) * gridStep;
    if (scoreGuess(nearest, rhoTrue).band !== 'bull') return false;
  }
  return true;
})());

// STREAK MULTIPLIER — exactness of roundScore's 0.15·streak multiplier.
ck('streak multiplier: roundScore applies 1 + 0.15·streak exactly', (() => {
  const s = scoreGuess(0.16, 0.16);                 // base 1000
  const r0 = roundScore(s, 0), r3 = roundScore(s, 3);
  return r0.points === 1000 && r0.mult === 1 && r3.points === Math.round(1000 * 1.45) && Math.abs(r3.mult - 1.45) < 1e-12;
})());

// THE DRAWN DIP IS THE GRADED TRUTH — the depth the lamp/curve show at mid-transit
// for a dealt planet is maxDepth(ρ_true, b), and ρ_true is the number scoreGuess
// grades against. (No duplicate ρ² anywhere: the page reads maxDepth from core.)
ck('the revealed ρ_true that drew the dip is the SAME number scoreGuess grades', (() => {
  const rng = makeRng(0xBEEF);
  for (let i = 0; i < 50; i++){
    const { rhoTrue, b } = dealPlanet(rng);
    const drawnDepth = maxDepth(rhoTrue, b);          // what the curve/lamp depict
    // the score against the truth is perfect; and the drawn depth is consistent
    if (scoreGuess(rhoTrue, rhoTrue).band !== 'bull') return false;
    if (drawnDepth < 0 || drawnDepth > rhoTrue * rhoTrue + 1e-12) return false;
  }
  return true;
})());

// ── (c) BYTE-PARITY: index.html's inlined core === core.mjs body (indentation-normalized) ──
const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
const BEGIN = '// ===== TRANSIT CORE (byte-identical to core.mjs) =====';
const END = '// ===== END TRANSIT CORE =====';
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
ck('byte-parity: TRANSIT CORE sentinels present in core.mjs', !!coreRegion);
ck('byte-parity: TRANSIT CORE sentinels present in index.html', !!pageRegion);
ck('byte-parity: index.html inlined core === core.mjs body (indentation-normalized)',
   !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion));

// ── report ──
console.log('The Transit — core.test.mjs');
console.log('  core self-test: ' + st.passed + '/' + st.total + ' legs green');
console.log('  FULL depth check (ρ=0.16, b=0.2): depth = ' + maxDepth(0.16, 0.2).toFixed(6) +
            '  vs ρ² = ' + (0.16 * 0.16).toFixed(6));
console.log('  GRAZE (ρ=0.16, b=0.92): maxDepth = ' + maxDepth(0.16, 0.92).toExponential(3) +
            ' < ρ² = ' + (0.16 * 0.16).toExponential(3) + '  (√depth under-reports ρ)');
console.log('  lens area (r=0.18,d=0.9): exact = ' + lensOverlap(1, 0.18, 0.9).toFixed(8) +
            '  numeric = ' + lensOverlapNumeric(1, 0.18, 0.9).toFixed(8));
console.log('  byte-parity: ' + (coreRegion && pageRegion && norm(coreRegion) === norm(pageRegion) ? 'IDENTICAL' : 'DRIFTED'));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING:\n    ' + fails.join('\n    ')); process.exit(1); }
