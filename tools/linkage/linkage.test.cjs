#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   linkage.test.cjs — the Straightedge's headless self-test.

   Calls the REAL kinematics core (tools/linkage/linkage.js) — the SAME functions
   the page's green chip exercises, no parallel copy. Proves the build spec's
   claims; the in-page `runSelfTest()` mirrors these exact checks.

   Run:  node tools/linkage/linkage.test.cjs        → all PASS, exit 0.
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const path = require('path');
const Linkage = require(path.join(__dirname, 'linkage.js'));

let pass = 0, total = 0;
const fails = [];
function check(name, cond, detail) {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (detail ? '  (' + detail + ')' : '')); }
  else { fails.push(name); console.error('  ✗ FAIL: ' + name + (detail ? '  (' + detail + ')' : '')); }
}

const TWO_PI = 2 * Math.PI;

/* ─── 1. PEAUCELLIER DRAWS AN EXACT STRAIGHT LINE ─────────────────────────── */
console.log('\nPeaucellier–Lipkin — exact straight line:');
const pp = Linkage.peaucellierDefaults();
const prange = Linkage.peaucellierRange(pp);
const ppts = Linkage.trace('peaucellier', pp, prange, 600);
const fit = Linkage.lineFit(ppts);
// The line is EXACT, not approximate: max perpendicular deviation ≈ machine eps.
// Scale of the figure ~ a few units; assert maxDev < 1e-9 (we observe ~1e-14).
const HEADLINE_DEV = fit.maxDev;
check('pen locus fits a straight line to machine precision (maxDev < 1e-9·scale)',
  fit.ok && fit.maxDev < 1e-9,
  'maxDev = ' + fit.maxDev.toExponential(4) + ', rms = ' + fit.rms.toExponential(4) +
  ', n = ' + ppts.length);
// And it's genuinely a LINE traversed over a real extent (not a degenerate point).
let extent = 0;
for (let i = 0; i < ppts.length; i++) {
  const d = (ppts[i].x - fit.point.x) * fit.dir.x + (ppts[i].y - fit.point.y) * fit.dir.y;
  if (Math.abs(d) > extent) extent = Math.abs(d);
}
check('the straight line spans a real extent (not a degenerate point)',
  extent > 0.5, 'half-extent = ' + extent.toFixed(4) + ' units');
// Cross-check the line is perpendicular to OC (the inversive-geometry prediction):
// crank centre C is on −x from O, so the line should be vertical (dir ≈ ±(0,1)).
check('the line is perpendicular to OC, as inversive geometry predicts (vertical here)',
  Math.abs(fit.dir.x) < 1e-6, 'dir = (' + fit.dir.x.toExponential(2) + ', ' + fit.dir.y.toFixed(6) + ')');

/* ─── 2. THE INVERSIVE INVARIANT |OP|·|OQ| = L²−ℓ² HOLDS ──────────────────── */
console.log('\nThe inversive invariant |OP|·|OQ| = L²−ℓ²:');
{
  const k2 = pp.L * pp.L - pp.ell * pp.ell;
  let maxErr = 0;
  for (let i = 0; i <= 400; i++) {
    const th = prange.lo + (prange.hi - prange.lo) * (i / 400);
    const s = Linkage.solve('peaucellier', th, pp);
    const inv = s.meta.OP * s.meta.OQ;
    maxErr = Math.max(maxErr, Math.abs(inv - k2));
  }
  check('|OP|·|OQ| stays constant at L²−ℓ² through the whole motion (err < 1e-12)',
    maxErr < 1e-12, 'max |OP·OQ − (L²−ℓ²)| = ' + maxErr.toExponential(4) + ', k2 = ' + k2.toFixed(4));
  // collinearity O, Q, P (the inversion is along the ray)
  let maxCross = 0;
  for (let i = 0; i <= 200; i++) {
    const th = prange.lo + (prange.hi - prange.lo) * (i / 200);
    const s = Linkage.solve('peaucellier', th, pp);
    const O = s.joints.O, Q = s.joints.Q, P = s.joints.P;
    const cross = (Q.x - O.x) * (P.y - O.y) - (Q.y - O.y) * (P.x - O.x);
    maxCross = Math.max(maxCross, Math.abs(cross));
  }
  check('O, Q, P stay collinear (P is the inverse on the ray OQ; |cross| < 1e-12)',
    maxCross < 1e-12, 'max |cross(OQ, OP)| = ' + maxCross.toExponential(4));
}

/* ─── 3. BAR LENGTHS ARE PRESERVED (LOOP CLOSURE) ─────────────────────────── */
console.log('\nLoop closure — every bar keeps its length:');
{
  const ref = Linkage.solve('peaucellier', prange.lo + 0.4, pp);
  const refLens = Linkage.barLengths(ref);
  let maxDrift = 0;
  for (let i = 0; i <= 600; i++) {
    const th = prange.lo + (prange.hi - prange.lo) * (i / 600);
    const lens = Linkage.barLengths(Linkage.solve('peaucellier', th, pp));
    for (let k = 0; k < lens.length; k++) maxDrift = Math.max(maxDrift, Math.abs(lens[k] - refLens[k]));
  }
  check('Peaucellier: all 7 bars hold length across the full crank rotation (drift < 1e-12)',
    maxDrift < 1e-12, 'max bar-length drift = ' + maxDrift.toExponential(4));
  // Spot-check the rhombus really is a rhombus (4 equal sides = ℓ) and long bars = L.
  let rhombOk = true, longOk = true;
  for (let i = 0; i <= 100; i++) {
    const th = prange.lo + (prange.hi - prange.lo) * (i / 100);
    const s = Linkage.solve('peaucellier', th, pp);
    const j = s.joints;
    const sides = [
      Linkage.vec.dist(j.A, j.Q), Linkage.vec.dist(j.Q, j.B),
      Linkage.vec.dist(j.B, j.P), Linkage.vec.dist(j.P, j.A)
    ];
    for (const sd of sides) if (Math.abs(sd - pp.ell) > 1e-9) rhombOk = false;
    if (Math.abs(Linkage.vec.dist(j.O, j.A) - pp.L) > 1e-9) longOk = false;
    if (Math.abs(Linkage.vec.dist(j.O, j.B) - pp.L) > 1e-9) longOk = false;
  }
  check('the rhombus stays a true rhombus (4 sides = ℓ) and both long bars = L', rhombOk && longOk);
}

/* ─── 4. DETERMINISM + SKIN-INVARIANCE ────────────────────────────────────── */
console.log('\nDeterminism + skin-invariance:');
{
  // same params/θ → byte-identical fingerprint
  let detOk = true;
  for (let i = 0; i < 50; i++) {
    const th = (i / 50) * TWO_PI;
    const a = Linkage.fingerprint('peaucellier', th, Linkage.peaucellierDefaults());
    const b = Linkage.fingerprint('peaucellier', th, Linkage.peaucellierDefaults());
    if (a !== b) detOk = false;
  }
  check('deterministic: identical params/θ → identical joint fingerprint', detOk);
  // The core is skin-free by construction: it has no `skin` parameter at all, so a
  // skin can never reach the geometry. We prove invariance by passing the SAME
  // params with an extra (ignored) skin field and confirming the fingerprint is
  // unchanged — geometry depends ONLY on (name, θ, lengths).
  let skinOk = true;
  const base = Linkage.peaucellierDefaults();
  const ref = Linkage.fingerprint('peaucellier', 2.37, base);
  ['oak', 'graphite', 'blueprint'].forEach(function (skin) {
    const tinted = Object.assign({}, base, { skin: skin }); // a skin field the core ignores
    if (Linkage.fingerprint('peaucellier', 2.37, tinted) !== ref) skinOk = false;
  });
  check('skin-invariant: a skin field never reaches the geometry (fingerprint stable)', skinOk);
  // and the full pen trace is stable run-to-run
  const t1 = Linkage.trace('peaucellier', base, prange, 120);
  const t2 = Linkage.trace('peaucellier', base, prange, 120);
  let traceOk = t1.length === t2.length;
  for (let i = 0; i < t1.length && traceOk; i++) if (t1[i].x !== t2[i].x || t1[i].y !== t2[i].y) traceOk = false;
  check('the full pen trace is reproducible bit-for-bit', traceOk);
}

/* ─── 5. FOUR-BAR — Grashof crank-rocker, all bars rigid through a rotation ── */
console.log('\nFour-bar companion — coupler curve + loop closure:');
{
  const fp = Linkage.fourbarDefaults();
  check('the default four-bar is a Grashof crank-rocker (input fully rotates)',
    Linkage.fourbarGrashofCrank(fp));
  // no dead spots: the dyad closes (circle∩circle exists) at every crank angle
  let dead = 0;
  for (let i = 0; i < 720; i++) {
    const th = TWO_PI * i / 720;
    const A = Linkage.vec.fromAngle(fp.O0, fp.a, th);
    if (!Linkage.circleCircle(A, fp.b, fp.O1, fp.c)) dead++;
  }
  check('the four-bar closes at every crank angle (no dead spots over 360°)', dead === 0,
    dead + ' dead spots');
  // all five bars preserve length through a full rotation
  const ref = Linkage.solve('fourbar', 0.5, fp);
  const refLens = Linkage.barLengths(ref);
  let maxDrift = 0;
  for (let i = 0; i <= 720; i++) {
    const th = TWO_PI * i / 720;
    const lens = Linkage.barLengths(Linkage.solve('fourbar', th, fp));
    for (let k = 0; k < lens.length; k++) maxDrift = Math.max(maxDrift, Math.abs(lens[k] - refLens[k]));
  }
  check('four-bar: all five bars hold length through a full crank rotation (drift < 1e-12)',
    maxDrift < 1e-12, 'max bar-length drift = ' + maxDrift.toExponential(4));
  // the coupler curve is a genuine closed curve with 2-D extent (NOT a straight line)
  const cpts = Linkage.trace('fourbar', fp, { lo: 0, hi: TWO_PI }, 400);
  const cfit = Linkage.lineFit(cpts);
  check('the coupler curve is genuinely 2-D — a foil to the straight line (maxDev ≫ 0)',
    cfit.maxDev > 0.05, 'coupler-curve maxDev from best line = ' + cfit.maxDev.toFixed(4) + ' units');
}

/* ─── ROBERTS–CHEBYSHEV COGNATES — three four-bars, one curve ─────────────── */
console.log('\nRoberts–Chebyshev cognates — three four-bars draw the byte-identical curve:');
{
  const cp = Linkage.fourbarDefaults();
  // (1) THE THEOREM: all three pens coincide per-sample to machine precision.
  let maxPen = 0, ref = null, maxBar = 0, dead = 0, samples = 0;
  for (let i = 0; i <= 2000; i++) {
    const th = TWO_PI * i / 2000;
    const g = Linkage.cognates(th, cp);
    if (!g) { dead++; continue; }
    samples++;
    maxPen = Math.max(maxPen,
      Math.hypot(g.Pleft.x - g.P.x, g.Pleft.y - g.P.y),
      Math.hypot(g.Pright.x - g.P.x, g.Pright.y - g.P.y));
    const cur = Linkage.cognateBarLengths(g);
    if (!ref) ref = cur; else for (const k in cur) maxBar = Math.max(maxBar, Math.abs(cur[k] - ref[k]));
  }
  check('cognate theorem: original + left + right pens coincide to <1e-11 over a full sweep',
    maxPen < 1e-11, 'max pen disagreement = ' + maxPen.toExponential(4) + ', samples = ' + samples);
  check('every cognate bar holds its length to machine-ε across the sweep (rigid links)',
    maxBar < 1e-9, 'max cognate bar drift = ' + maxBar.toExponential(4));

  // (2) EXACT UNDER DRAG: move a ground pivot AND slide the pen offset — the
  // direction-form construction recomputes λ,u live, so exactness must survive.
  const dragged = Object.assign({}, cp, { O1: { x: 2.4, y: 0.3 }, cx: 1.5, cy: -0.6 });
  let dragPen = 0;
  for (let i = 0; i <= 720; i++) {
    const g = Linkage.cognates(TWO_PI * i / 720, dragged);
    if (!g) continue;
    dragPen = Math.max(dragPen,
      Math.hypot(g.Pleft.x - g.P.x, g.Pleft.y - g.P.y),
      Math.hypot(g.Pright.x - g.P.x, g.Pright.y - g.P.y));
  }
  check('cognate map stays exact after dragging a ground pivot + sliding the pen (<1e-11)',
    dragPen < 1e-11, 'dragged max pen disagreement = ' + dragPen.toExponential(4));

  // (3) THE CURVE IS REAL: the shared locus has genuine 2-D extent (not a point),
  // and the left/right loci are pointwise within ε of the original.
  const tr = Linkage.cognateTrace(cp, 400);
  const fitL = Linkage.lineFit(tr.original);
  let locusDev = 0;
  for (let i = 0; i < tr.original.length; i++) {
    locusDev = Math.max(locusDev,
      Math.hypot(tr.left[i].x - tr.original[i].x, tr.left[i].y - tr.original[i].y),
      Math.hypot(tr.right[i].x - tr.original[i].x, tr.right[i].y - tr.original[i].y));
  }
  check('the shared coupler curve is genuinely 2-D AND the three loci overlay to <1e-11',
    fitL.maxDev > 0.05 && locusDev < 1e-11,
    'curve maxDev from a line = ' + fitL.maxDev.toFixed(4) + ' units, locus overlay = ' + locusDev.toExponential(2));
}

/* ─── headline number + summary ───────────────────────────────────────────── */
console.log('\n────────────────────────────────────────────────────────────');
console.log('HEADLINE: Peaucellier max perpendicular deviation from a perfect line = '
  + HEADLINE_DEV.toExponential(4) + ' units (machine precision — the line is EXACT).');
console.log('Linkage self-test: ' + pass + '/' + total + ' passed.');
if (fails.length) {
  console.error('FAILURES: ' + fails.join('; '));
  process.exit(1);
}
console.log('ALL PASS ✓');
process.exit(0);
