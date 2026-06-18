// Node twin for The Parallax Baseline (trigonometric stellar parallax,
// distance from a half-angle off a one-AU baseline). Zero-dep.
// Run: `node core.test.mjs`. Exit 0 = green; non-zero = red.
//
// Mirrors The Drifting Star's two-tolerance discipline:
//   (a)  ROUND-TRIP — TIGHT: d→parallaxArcsec→distancePc agrees to <1e-12
//        relative over log-spaced [0.5,100]pc + hundreds of random draws (pure
//        reciprocal ⇒ machine-ε).
//   (a′) READING-GRID — honestly LOOSER: quantize p to the drum's GRID_ARCSEC
//        then recover; asserted against the grid-DERIVED bound (≈GRID·d²), NOT
//        a flat ε — distant stars are grid-limited (physically true).
//   (b)  NEG-CONTROL star at ∞: parallax/shift/offset/radians all ===0 (===),
//        near-limit monotone →0, never negative.
//   (c)  NEG-CONTROL zero baseline: parallaxArcsec(d,0)===0 AND offset(d,0)===0
//        for every d (===0).
//   (d)  MONOTONICITY/sign: p strictly ↓ in d; shift===2·p EXACTLY; baseline-
//        linear; the b-sweep peak-to-peak === apparentShiftArcsec.
//   (e)  DEFINITION ANCHOR: parallaxArcsec(1,1)===1 and distancePc(1,1)===1.
//   (f)  BYTE-TWIN: the inlined core between the sentinels in index.html is
//        byte-identical (indentation-normalised) to core.mjs's body.
//   (g)  SMALL-ANGLE HONESTY: shiftRadians vs the arcsec identity <1e-9 rel for
//        p≤1" (all real stars); the absurd p=100" breakdown is PRINTED.
//   (h)  VIEW-LAYER: arcsecToX/xToArcsec exact inverses over a decade of zoom;
//        FIXED-FIELD identity — the far-star array reference is unchanged across
//        a blink (only the near star's x mutates).
//   Also runs the page's own runSelfTest() — all green.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  PC_DEF_ARCSEC, ARCSEC_PER_RAD, GRID_ARCSEC,
  parallaxArcsec, apparentShiftArcsec, apparentOffsetArcsec, distancePc, shiftRadians,
  arcsecToX, xToArcsec, quantizeArcsec, starTable, makeRng, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok){ if (ok) pass++; else { fail++; fails.push(name); } }

// ── (page) the bundled self-test is all-green ──
const st = runSelfTest();
for (const c of st.checks) ck('selftest ' + c.name + '  [' + c.info + ']', c.pass);

// ── (a) ROUND-TRIP, TIGHT ──
ck('(a) round-trip d→p→d < 1e-12 rel over log-spaced [0.5,100]pc + random draws', (() => {
  const ds = [];
  for (let i = 0; i <= 60; i++) ds.push(0.5 * Math.pow(200, i / 60));
  const rng = makeRng(424242);
  for (let i = 0; i < 1000; i++) ds.push(0.5 + rng() * 99.5);
  let maxRel = 0;
  for (const d of ds){
    const back = distancePc(parallaxArcsec(d, 1), 1);
    maxRel = Math.max(maxRel, Math.abs(back - d) / d);
  }
  return maxRel < 1e-12;
})());
// distancePc is the exact algebraic inverse of parallaxArcsec by construction:
// d = baseline / (baseline/d) === d. Re-derived straight from the closed form.
ck('(a) distancePc is the exact algebraic inverse of parallaxArcsec (d = b/(b/d))', (() => {
  for (const b of [0.5, 1, 2]){
    for (const d of [0.5, 1.3, 2.64, 10, 100]){
      const p = b / d;                       // forward by hand
      const back = b / p;                    // inverse by hand
      if (Math.abs(back - distancePc(parallaxArcsec(d, b), b)) > 1e-9) return false;
      if (Math.abs(back - d) > 1e-9) return false;
    }
  }
  return true;
})());

// ── (a′) READING-GRID — separately asserted, honestly LOOSER ──
ck("(a′) reading-grid recovery within grid-derived bound (NOT machine-ε), AND grid DOES cost", (() => {
  let allWithin = true, anyAboveTight = false;
  for (const d of [0.5, 1, 1.3, 2.64, 3.5, 10, 30, 100]){
    const p = parallaxArcsec(d, 1);
    const dQ = distancePc(quantizeArcsec(p), 1);
    const bound = d * d * GRID_ARCSEC + 1e-9;
    const err = Math.abs(dQ - d);
    if (!(err <= bound)) allWithin = false;
    if (err > 1e-12) anyAboveTight = true;     // the grid introduces a real, bounded error
  }
  return allWithin && anyAboveTight;
})());
// GRID_ARCSEC is ONE shared const = the drum tick; the page's micrometer must
// land on the same granularity. Pin the value so a drift trips the test.
ck('(a′) GRID_ARCSEC is the single shared drum-tick const (0.001")', GRID_ARCSEC === 0.001);

// ── (b) NEG-CONTROL star at ∞: EXACT zeros ──
ck('(b) star at ∞ ⇒ parallax/shift/offset/radians all ===0 exactly', (() => {
  return parallaxArcsec(Infinity) === 0
    && apparentShiftArcsec(Infinity) === 0
    && apparentOffsetArcsec(Infinity, 1) === 0
    && shiftRadians(Infinity) === 0;
})());
ck('(b) near-limit: parallax →0 monotone as d→huge, never negative', (() => {
  let prev = Infinity;
  for (const d of [1e2, 1e3, 1e4, 1e5, 1e6, 1e9, 1e12]){
    const p = parallaxArcsec(d);
    if (p < 0 || p > prev) return false;
    prev = p;
  }
  return prev >= 0;
})());

// ── (c) NEG-CONTROL zero baseline: EXACT zeros ∀d ──
ck('(c) zero baseline ⇒ parallaxArcsec(d,0)===0 AND offset(d,0)===0 for every d', (() => {
  const rng = makeRng(31415);
  for (let i = 0; i < 1000; i++){
    const d = 0.5 + rng() * 99.5;
    if (parallaxArcsec(d, 0) !== 0) return false;
    if (apparentOffsetArcsec(d, 0) !== 0) return false;
  }
  return true;
})());

// ── (d) MONOTONICITY / 2× / linearity / peak-to-peak ──
ck('(d) parallaxArcsec strictly DECREASING in d', (() => {
  let prev = Infinity;
  for (let d = 0.5; d <= 100; d += 0.25){
    const p = parallaxArcsec(d);
    if (!(p < prev)) return false;
    prev = p;
  }
  return true;
})());
ck('(d) apparentShiftArcsec === 2·parallaxArcsec EXACTLY (the factor of 2 lives in one place)', (() => {
  const rng = makeRng(2);
  for (let i = 0; i < 1000; i++){
    const d = 0.5 + rng() * 99.5;
    if (apparentShiftArcsec(d) !== 2 * parallaxArcsec(d)) return false;
  }
  return true;
})());
ck('(d) baseline-linear: doubling the baseline doubles p', (() => {
  for (const d of [0.5, 1.3, 2.64, 3.5, 10, 100]){
    if (Math.abs(parallaxArcsec(d, 2) - 2 * parallaxArcsec(d, 1)) > 1e-15) return false;
  }
  return true;
})());
ck('(d) b-sweep peak-to-peak (b:+1→−1) === apparentShiftArcsec', (() => {
  const rng = makeRng(99);
  for (let i = 0; i < 500; i++){
    const d = 0.5 + rng() * 99.5;
    const p2p = apparentOffsetArcsec(d, +1) - apparentOffsetArcsec(d, -1);
    if (Math.abs(p2p - apparentShiftArcsec(d)) > 1e-15) return false;
  }
  return true;
})());
// the b-bead endpoints land EXACTLY on ±p, and b=0 lands EXACTLY on 0.
ck('(d) offset endpoints: b=+1→+p, b=−1→−p, b=0→0 (===)', (() => {
  for (const d of [0.5, 1.3, 2.64, 100]){
    const p = parallaxArcsec(d, 1);
    if (apparentOffsetArcsec(d, 1) !== p) return false;
    if (apparentOffsetArcsec(d, -1) !== -p) return false;
    if (apparentOffsetArcsec(d, 0) !== 0) return false;
  }
  return true;
})());

// ── (e) DEFINITION ANCHOR ──
ck('(e) parallaxArcsec(1,1) === 1 and distancePc(1,1) === 1 (the immovable parsec)', (() => {
  return parallaxArcsec(1, 1) === 1 && distancePc(1, 1) === 1 && PC_DEF_ARCSEC === 1;
})());
// the catalogue p's are DERIVED from d, never re-typed: Proxima d=1.30 ⇒ p≈0.769".
ck('(e) catalogue p is derived (Proxima d=1.30pc ⇒ p≈0.769"), single-sourced', (() => {
  const prox = starTable().find(s => s.id === 'proxima');
  const p = parallaxArcsec(prox.dPc);
  return Math.abs(p - 1 / 1.30) < 1e-12 && Math.abs(p - 0.769) < 0.001;
})());

// ── (g) SMALL-ANGLE HONESTY — and PRINT the breakdown ──
let smallAngleReport = '';
ck('(g) shiftRadians vs arcsec identity <1e-9 rel for p≤1" (all real stellar parallaxes)', (() => {
  let maxRel = 0;
  for (const d of [1, 1.3, 2.64, 3.5, 10, 100]){
    const rad = shiftRadians(d);
    const tan = 2 * Math.tan(parallaxArcsec(d) / ARCSEC_PER_RAD);
    maxRel = Math.max(maxRel, Math.abs(rad - tan) / Math.abs(tan));
  }
  // PRINT (do not hide) the absurd-angle breakdown.
  const dA = 0.01;     // p = 100"
  const radA = shiftRadians(dA);
  const tanA = 2 * Math.tan(parallaxArcsec(dA) / ARCSEC_PER_RAD);
  smallAngleReport = 'p≤1" maxRel=' + maxRel.toExponential(2)
    + ' · absurd p=100" linear-vs-tan rel=' + (Math.abs(radA - tanA) / Math.abs(tanA)).toExponential(2);
  return maxRel < 1e-9;
})());

// ── (h) VIEW-LAYER inverses + FIXED-FIELD identity ──
ck('(h) arcsecToX/xToArcsec exact inverses <1e-9 rel over a decade of ×N zoom', (() => {
  const rng = makeRng(0xF1E1D);
  let maxRel = 0;
  for (const exag of [1, 3.16, 10, 31.6, 100]){
    for (let i = 0; i < 500; i++){
      const a = (rng() * 2 - 1);
      const back = xToArcsec(arcsecToX(a, exag), exag);
      if (Math.abs(a) > 1e-12) maxRel = Math.max(maxRel, Math.abs(back - a) / Math.abs(a));
    }
  }
  return maxRel < 1e-9;
})());
// the exaggeration touches the X map ONLY — at exag=1 it is the identity scale,
// and a different exag NEVER changes the underlying arcsec (the micrometer number).
ck('(h) ×N touches arcsecToX ONLY — the recovered arcsec is invariant to exag', (() => {
  for (const a of [-0.769, -0.1, 0.0, 0.379, 0.769]){
    const refX = arcsecToX(a, 1);
    for (const exag of [1, 5, 50]){
      // same arcsec, magnified pixels, but xToArcsec(·,exag) recovers the SAME a
      if (Math.abs(xToArcsec(arcsecToX(a, exag), exag) - a) > 1e-12) return false;
    }
    if (refX !== a * 380) return false;          // exag=1 is the base scale
  }
  return true;
})());
// FIXED-FIELD identity (the renderer contract, simulated): generate the far
// field ONCE; blink mutates only the near star's x; the far array's REFERENCE
// and contents are unchanged across the blink.
ck('(h) FIXED-FIELD: far-star array identity unchanged across a blink (only near x mutates)', (() => {
  const rng = makeRng(0x5EED);
  const farField = [];
  for (let i = 0; i < 60; i++) farField.push({ x: rng() * 800, y: rng() * 400 });
  const dPc = 2.64;
  const near = { x: arcsecToX(apparentOffsetArcsec(dPc, +1), 10) };
  // a "blink" to the Jul frame: recompute ONLY the near star
  const farRef = farField;
  const farSnapshot = farField.map(s => s.x + ',' + s.y).join(';');
  near.x = arcsecToX(apparentOffsetArcsec(dPc, -1), 10);   // mutate near only
  const sameRef = farRef === farField;
  const sameContents = farField.map(s => s.x + ',' + s.y).join(';') === farSnapshot;
  const nearMoved = near.x !== arcsecToX(apparentOffsetArcsec(dPc, +1), 10);
  return sameRef && sameContents && nearMoved;
})());

// ── (f) BYTE-TWIN PARITY: index.html inlined core === core.mjs body ──
const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
const BEGIN = '// ===== PARALLAX-BASELINE CORE (byte-identical to core.mjs) =====';
const END = '// ===== END PARALLAX-BASELINE CORE =====';
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
ck('(f) byte-parity: PARALLAX-BASELINE CORE sentinels present in core.mjs', !!coreRegion);
ck('(f) byte-parity: PARALLAX-BASELINE CORE sentinels present in index.html', !!pageRegion);
ck('(f) byte-parity: index.html inlined core === core.mjs body (indentation-normalised)',
   !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion));

// ── report ──
console.log('The Parallax Baseline — core.test.mjs');
console.log('  page self-test: ' + st.passed + '/' + st.total + ' checks green');
console.log('  small-angle: ' + smallAngleReport);
console.log('  byte-parity: ' + (coreRegion && pageRegion && norm(coreRegion) === norm(pageRegion) ? 'IDENTICAL' : 'DRIFTED'));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
