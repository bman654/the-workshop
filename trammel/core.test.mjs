// Node twin for The Trammel of Archimedes (the ellipsograph: two perpendicular
// slots, one rigid rod, a pen forced onto an exact ellipse). Zero-dep.
// Run: `node core.test.mjs`. Exit 0 = green; non-zero = red.
//
// Mirrors the parallax-baseline two-tolerance discipline:
//   (a) WITNESS-1 on-ellipse — TIGHT: every traced point satisfies the public
//       predicate x²/a²+y²/b²=1 to <1e-12 over a HEAVY sweep (more (L,d) pairs,
//       finer θ, 1000+ random draws) so the core isn't grading its own homework.
//   (b) WITNESS-2 focal-string — TIGHT, INDEPENDENT oracle: |P−f₁|+|P−f₂| =
//       2·max(a,b) to <1e-12. Different method than the algebraic predicate, so
//       their agreement is a genuine proof.
//   (c) CIRCLE / LINE detents: d=L/2 ⇒ a===b & c===0; d=0 ⇒ y===0 ∀θ (HARD 0);
//       d=L ⇒ x===0 ∀θ (HARD 0) — via the exact tracedPoint form.
//   (d) NEG-CONTROL TILT — FALSIFIABLE: φ=PERP fits the axis-aligned ellipse;
//       every tilted φ misses it by >1e-6.
//   (e) MONOTONE morph: b↑, a↓, eccentricity strictly ↓ as d:0→L/2.
//   (f) BYTE-TWIN: the inlined core between the sentinels in index.html is
//       byte-identical (indentation-normalised) to core.mjs's body.
//   Also runs the page's own runSelfTest() — all green.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  PERP, EPS_TILT,
  tracedPoint, tracedTilted, semiAxes, station,
  ellipseResidual, foci, focalResidual, makeRng, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok){ if (ok) pass++; else { fail++; fails.push(name); } }

// ── (page) the bundled self-test is all-green ──
const st = runSelfTest();
for (const c of st.checks) ck('selftest ' + c.name + '  [' + c.info + ']', c.pass);

// ── HEAVY independent re-run (not the core's own grid): more pairs, finer θ ──
const HEAVY = [[3,1],[3,1.5],[3,0.4],[5,2.5],[2,0.2],[6,4],[4,2],[7,3.3],[2.5,2.0],[10,1],[10,9],[1,0.25]];

ck('(a) WITNESS-1 on-ellipse < 1e-12 over HEAVY (L,d)×8000-step θ + 1000 random draws', (() => {
  let mx = 0;
  const rng = makeRng(0xC0FFEE);
  for (const [L, d] of HEAVY){
    for (let i = 0; i <= 8000; i++){
      const t = 2 * Math.PI * i / 8000;
      const p = tracedPoint(L, d, t);
      mx = Math.max(mx, Math.abs(ellipseResidual(L, d, p.x, p.y)));
    }
    for (let i = 0; i < 1000; i++){
      const t = rng() * 2 * Math.PI;
      const p = tracedPoint(L, d, t);
      mx = Math.max(mx, Math.abs(ellipseResidual(L, d, p.x, p.y)));
    }
  }
  return mx < 1e-12;
})());

ck('(b) WITNESS-2 focal-string |P−f₁|+|P−f₂| = 2·max(a,b) < 1e-12 (independent oracle)', (() => {
  let mx = 0;
  const rng = makeRng(0xBEEF);
  for (const [L, d] of HEAVY){
    if (d === 0 || d === L) continue;            // foci undefined as a constant on a line
    for (let i = 0; i <= 4000; i++){
      const t = 2 * Math.PI * i / 4000;
      const p = tracedPoint(L, d, t);
      mx = Math.max(mx, Math.abs(focalResidual(L, d, p.x, p.y)));
    }
    for (let i = 0; i < 1000; i++){
      const t = rng() * 2 * Math.PI;
      const p = tracedPoint(L, d, t);
      mx = Math.max(mx, Math.abs(focalResidual(L, d, p.x, p.y)));
    }
  }
  return mx < 1e-12;
})());

// the two witnesses are computed by DIFFERENT methods and must AGREE everywhere
ck('(b) WITNESSES AGREE: at every ellipse sample BOTH residuals < 1e-12', (() => {
  for (const [L, d] of HEAVY){
    if (d === 0 || d === L) continue;
    for (let i = 0; i <= 2000; i++){
      const t = 2 * Math.PI * i / 2000;
      const p = tracedPoint(L, d, t);
      if (!(Math.abs(ellipseResidual(L, d, p.x, p.y)) < 1e-12)) return false;
      if (!(Math.abs(focalResidual(L, d, p.x, p.y)) < 1e-12)) return false;
    }
  }
  return true;
})());

// station() must return the SAME pen as tracedPoint, and a rigid rod |AB|=L
ck('(c) station(): pen===tracedPoint AND |pinA−pinB|===L (rigid rod) over a sweep', (() => {
  for (const [L, d] of HEAVY){
    for (let i = 0; i <= 720; i++){
      const t = 2 * Math.PI * i / 720;
      const g = station(L, d, t);
      const p = tracedPoint(L, d, t);
      if (g.pen.x !== p.x || g.pen.y !== p.y) return false;
      const rod = Math.hypot(g.pinA.x - g.pinB.x, g.pinA.y - g.pinB.y);
      if (Math.abs(rod - L) > 1e-9) return false;
    }
  }
  return true;
})());

// ── (c) CIRCLE detent ──
ck('(c) CIRCLE d=L/2 ⇒ a===b exactly AND c===0 (foci coincide)', (() => {
  for (const L of [2, 3, 4, 5, 6, 7, 10]){
    const { a, b } = semiAxes(L, L / 2);
    if (!(a === b && foci(L, L / 2).c === 0)) return false;
  }
  return true;
})());

// ── (c) LINE detents — HARD 0 via the exact tracedPoint form ──
ck('(c) LINE d=0 ⇒ y===0 ∀θ AND d=L ⇒ x===0 ∀θ (hard 0, via tracedPoint)', (() => {
  for (const L of [2, 3, 5, 7, 10]){
    for (let i = 0; i <= 2000; i++){
      const t = 2 * Math.PI * i / 2000;
      if (tracedPoint(L, 0, t).y !== 0) return false;     // horizontal line
      if (tracedPoint(L, L, t).x !== 0) return false;     // vertical line
    }
  }
  return true;
})());

// ── (d) NEG-CONTROL TILT — FALSIFIABLE in BOTH directions ──
ck('(d) NEG-CONTROL: φ=PERP fits axis-aligned ellipse (<1e-12)', (() => {
  let mx = 0;
  for (const [L, d] of [[3,1],[5,2],[4,1.5]]){
    for (let i = 1; i <= 1500; i++){
      const t = 2 * Math.PI * i / 1500;
      const p = tracedTilted(L, d, t, PERP);
      mx = Math.max(mx, Math.abs(ellipseResidual(L, d, p.x, p.y)));
    }
  }
  return mx < 1e-12;
})());
let tiltReport = '';
ck('(d) NEG-CONTROL: every tilted φ FAILS the axis-aligned fit (residual > 1e-6)', (() => {
  let allFail = true, worst = Infinity;
  for (const phi of [PERP + 0.2, Math.PI / 3, 1.2, PERP - 0.15, PERP + 0.5]){
    let mx = 0;
    for (let i = 1; i <= 1500; i++){
      const t = 2 * Math.PI * i / 1500;
      const p = tracedTilted(3, 1, t, phi);
      mx = Math.max(mx, Math.abs(ellipseResidual(3, 1, p.x, p.y)));
    }
    if (!(mx > EPS_TILT)) allFail = false;
    worst = Math.min(worst, mx);
  }
  tiltReport = 'min tilted residual=' + worst.toExponential(2) + ' (all > ' + EPS_TILT + ')';
  return allFail;
})());

// ── (e) MONOTONE morph ──
ck('(e) MONOTONE morph d:0→L/2 — b↑, a↓, eccentricity strictly ↓', (() => {
  const L = 4;
  let prevB = -Infinity, prevA = Infinity, prevE = Infinity;
  for (let k = 0; k <= 200; k++){
    const d = (L / 2) * k / 200;
    const { a, b } = semiAxes(L, d);
    const A = Math.max(a, b), B = Math.min(a, b);
    const e = Math.sqrt(1 - (B * B) / (A * A));
    if (!(b >= prevB) || !(a <= prevA)) return false;
    if (k > 0 && !(e < prevE)) return false;
    prevB = b; prevA = a; prevE = e;
  }
  return true;
})());

// ── (f) BYTE-TWIN PARITY: index.html inlined core === core.mjs body ──
const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
const BEGIN = '// ===== TRAMMEL CORE (byte-identical to core.mjs) =====';
const END = '// ===== END TRAMMEL CORE =====';
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
ck('(f) byte-parity: TRAMMEL CORE sentinels present in core.mjs', !!coreRegion);
ck('(f) byte-parity: TRAMMEL CORE sentinels present in index.html', !!pageRegion);
ck('(f) byte-parity: index.html inlined core === core.mjs body (indentation-normalised)',
   !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion));

// ── report ──
console.log('The Trammel of Archimedes — core.test.mjs');
console.log('  page self-test: ' + st.passed + '/' + st.total + ' checks green');
console.log('  ' + tiltReport);
console.log('  byte-parity: ' + (coreRegion && pageRegion && norm(coreRegion) === norm(pageRegion) ? 'IDENTICAL' : 'DRIFTED'));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
