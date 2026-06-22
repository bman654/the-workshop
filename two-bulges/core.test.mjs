// Node twin for The Tide Wheel. Zero-dep. Run: `node two-bulges/core.test.mjs`.
// Exit 0 = green; non-zero = red. Prints an explicit PASS/FAIL count.
//
// Proves the FIVE claims the wheel stakes its name on, INDEPENDENTLY of the page's
// in-page pill — re-deriving each a SECOND way with hand-rolled vectors (never just
// calling the same helper the core uses), and byte-parity-checking the slab the page
// inlines === core.mjs.
//
//   CLAIM 1 STRETCH SIGNS — over a d-sweep: tidalAlongAxis(0) > 0 (outward near),
//           tidalAlongAxis(π) < 0 (outward-away), tidalAlongAxis(π/2) < 0 (squeeze).
//           Re-derived from a HAND-ROLLED (Moon−P)/|Moon−P|³ minus [1/d²,0].
//   CLAIM 2 NEAR≈FAR TO LEADING ORDER (HONEST) — |near|/|far| → 1 with |ratio−1| < c·R/d
//           (NOT machine-ε — they are NOT exactly equal; near is a hair bigger). Each
//           magnitude agrees with 2GMR/d³ to O(R/d). The in-page copy says "equal to
//           leading order", and this test FORBIDS asserting exact equality.
//   CLAIM 3 1/d³ SCALING <1e-9 — leadingStretch(2d) === leadingStretch(d)/8 to <1e-9
//           (the leading term is EXACTLY inverse-cube), AND the FULL near-field ratio
//           S(d)/S(2d) → 8 monotonically from below (convergence, not faked exactness).
//   CLAIM 4 UNIFORM NEG-CONTROL — uniformResidual(θ) === 0 EXACTLY (machine-ε) ∀θ ∀d,
//           and the uniform bulge is a perfect circle. Re-derived as (centre − centre).
//   CLAIM 5 P₂ SHAPE — bulgeHeight peaks EQUAL at θ=0 and θ=π to <1e-12, minima equal
//           at π/2 and 3π/2, angular mean 0 to <1e-12 (volume-conserving), and the
//           magic-angle pinch: the un-offset 3cos²θ−1 zeros at θ = ±arccos(1/√3) = 54.7356°.
//   DOMAIN GUARDS — d≤R / non-finite d / a point AT the Moon → NaN.
//   BYTE-TWIN PARITY — the CORE region inlined in index.html is byte-identical
//           (indentation-normalized) to core.mjs's CORE region.
//
// NOTE ON TOLERANCES: claim 2's bound is INTENTIONALLY c·(R/d), NOT 1e-12 — asserting
// machine-ε there would be a LIE (near≠far exactly). claim 3's <1e-9 is on the LEADING
// term, which IS exactly ∝1/d³. The two are different objects on purpose.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  R, MAGIC_ANGLE, point, moonAccelAt, centreAccel,
  tidalResidual, tidalAlongAxis, leadingStretch,
  uniformResidual, bulgeHeight, uniformBulgeHeight, runSelfTest
} from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok, info) {
  if (ok) { pass++; console.log('  ok   ' + name + (info ? '  [' + info + ']' : '')); }
  else { fail++; fails.push(name); console.log('  FAIL ' + name + (info ? '  [' + info + ']' : '')); }
}

// ── an INDEPENDENT, hand-rolled residual: (Moon−P)/|Moon−P|³ − [1/d²,0], G=M=R=1.
//    Deliberately NOT calling tidalResidual — a second pair of eyes on the same math.
function handResidual(theta, d) {
  const px = Math.cos(theta), py = Math.sin(theta);   // point on the unit ocean ring
  const dx = d - px, dy = -py;                         // Moon at [d,0] minus the point
  const r = Math.hypot(dx, dy);
  const ax = dx / (r * r * r), ay = dy / (r * r * r);  // Moon's pull at the point
  const cx = 1 / (d * d), cy = 0;                      // the shared centre pull
  return [ax - cx, ay - cy];
}

console.log('The Tide Wheel — core.test.mjs\n');

// ── (a) the core's own self-test is all-green ──
console.log('· core self-test (the same legs the in-page pill runs):');
const st = runSelfTest();
for (const c of st.checks) ck('selftest · ' + c.name, c.pass, c.info);

// ── cross-check: the core's residual === the hand-rolled residual (two implementations) ──
console.log('\n· CROSS-CHECK — core tidalResidual === hand-rolled (Moon−P)/|Δ|³ − centre:');
{
  let worst = 0;
  for (const d of [3, 5, 10, 30, 100]) {
    for (let k = 0; k < 48; k++) {
      const th = k * 2 * Math.PI / 48;
      const a = tidalResidual(th, d), b = handResidual(th, d);
      worst = Math.max(worst, Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]));
    }
  }
  ck('core residual matches an independent hand-rolled vector to machine-ε',
    worst < 1e-12, 'max|Δ| ' + worst.toExponential(2));
}

// ── CLAIM 1 · STRETCH SIGNS (hand-rolled), over a d-sweep ──
console.log('\n· CLAIM 1 — the quadrupole as signs (near out, far out-away, side squeeze):');
{
  let ok = true, worstNear = Infinity, worstFar = -Infinity, worstSide = -Infinity;
  for (let i = 0; i < 50; i++) {
    const d = 1.5 + i * 1.0;
    const near = handResidual(0, d)[0];
    const far = handResidual(Math.PI, d)[0];
    const side = handResidual(Math.PI / 2, d)[0];
    if (!(near > 0 && far < 0 && side < 0)) ok = false;
    worstNear = Math.min(worstNear, near);
    worstFar = Math.max(worstFar, far);
    worstSide = Math.max(worstSide, side);
  }
  ck('hand-rolled: near(0)>0 · far(π)<0 · side(π/2)<0 over d∈[1.5,51]',
    ok, 'min near=' + worstNear.toExponential(2) + ' max far=' + worstFar.toExponential(2)
      + ' max side=' + worstSide.toExponential(2));
  // and the side residual points INWARD toward the axis (its y-component opposes the point's y):
  let inwardOk = true;
  for (const d of [3, 8, 25]) {
    const r = handResidual(Math.PI / 2, d);   // point is at [0,1]; squeeze pulls −y (toward axis)
    if (!(r[1] < 0)) inwardOk = false;
  }
  ck('side squeeze pulls toward the axis (residual y < 0 at θ=π/2)', inwardOk);
}

// ── CLAIM 2 · NEAR≈FAR TO LEADING ORDER — HONEST: a c·R/d bound, NOT exact ──
console.log('\n· CLAIM 2 — near≈far to LEADING ORDER (|ratio−1| shrinks like R/d; NOT machine-ε):');
{
  let okBound = true, worstCoef = 0, okLead = true, exactlyEqualSomewhere = false;
  for (let i = 1; i <= 80; i++) {
    const d = 5 + i * 2;                          // d/R from 7 up to 165
    const near = Math.abs(handResidual(0, d)[0]);
    const far = Math.abs(handResidual(Math.PI, d)[0]);
    const lead = leadingStretch(d);
    const ratio = near / far;
    if (!(Math.abs(ratio - 1) < 5 * (R / d))) okBound = false;
    worstCoef = Math.max(worstCoef, Math.abs(ratio - 1) * (d / R));
    if (!(Math.abs(near / lead - 1) < 6 * (R / d) && Math.abs(far / lead - 1) < 6 * (R / d))) okLead = false;
    if (near === far) exactlyEqualSomewhere = true;     // they must NEVER be exactly equal
  }
  ck('|near|/|far| − 1 < 5·R/d over a sweep (a LEADING-ORDER agreement, not machine-ε)',
    okBound, 'O(1) coef ≈ ' + worstCoef.toFixed(3) + ' (bounded, ≠ 0)');
  ck('each |stretch| agrees with 2GMR/d³ to O(R/d)', okLead);
  // HONESTY GUARD: near and far are NOT exactly equal — assert the difference is REAL.
  ck('HONESTY: near and far are NOT exactly equal (near is a hair bigger) — claim is "to leading order"',
    !exactlyEqualSomewhere && Math.abs(handResidual(0, 10)[0]) > Math.abs(handResidual(Math.PI, 10)[0]),
    '|near(10)|=' + Math.abs(handResidual(0, 10)[0]).toExponential(4)
      + ' > |far(10)|=' + Math.abs(handResidual(Math.PI, 10)[0]).toExponential(4));
  // convergence: at a large d the ratio is within 1e-3 of 1.
  const dBig = 8000;
  const rBig = Math.abs(handResidual(0, dBig)[0]) / Math.abs(handResidual(Math.PI, dBig)[0]);
  ck('ratio → 1 at large d (convergence): |ratio(8000)−1| < 1e-3',
    Math.abs(rBig - 1) < 1e-3, 'ratio(8000)=' + rBig.toFixed(7));
}

// ── CLAIM 3 · 1/d³ SCALING <1e-9 on the leading term; full field → 8 ──
console.log('\n· CLAIM 3 — leadingStretch is exactly ∝1/d³ (÷8 per doubling); full field → 8:');
{
  // re-derive leadingStretch by hand: 2·G·M·R/d³ = 2/d³.
  const handLead = (d) => 2 / (d * d * d);
  let worst = 0, worstVsHand = 0;
  for (let i = 1; i <= 60; i++) {
    const d = 2 + i * 1.7;
    worst = Math.max(worst, Math.abs(leadingStretch(2 * d) - leadingStretch(d) / 8));
    worstVsHand = Math.max(worstVsHand, Math.abs(leadingStretch(d) - handLead(d)));
  }
  ck('leadingStretch(2d) === leadingStretch(d)/8 to <1e-9 (exact inverse-cube)',
    worst < 1e-9, 'max|Δ| ' + worst.toExponential(2));
  ck('leadingStretch(d) === 2GMR/d³ (hand-rolled, machine-ε)',
    worstVsHand < 1e-15, 'max|Δ| ' + worstVsHand.toExponential(2));
  // FULL field near-stretch S(d)/S(2d) settles to 8 monotonically FROM ABOVE: the
  // near stretch S(d) = 2/d³ + 3/d⁴ + … has positive higher-order terms, so the
  // ratio = 8·(2+3/d)/(2+1.5/d) > 8 and DECREASES to 8 as d→∞.
  const S = (d) => handResidual(0, d)[0];
  let prev = null, monotone = true;
  const seq = [];
  for (let k = 0; k < 16; k++) {
    const d = 4 * Math.pow(1.7, k);
    const ratio = S(d) / S(2 * d);
    seq.push(ratio);
    if (prev !== null && !(ratio < prev + 1e-12)) monotone = false;   // monotone DECREASING
    prev = ratio;
  }
  const last = seq[seq.length - 1];
  ck('full near-field ratio S(d)/S(2d) → 8 monotonically from ABOVE (convergence to ∝1/d³, NOT faked)',
    monotone && Math.abs(last - 8) < 1e-3 && seq[0] > 8,
    'first=' + seq[0].toFixed(3) + ' → last=' + last.toFixed(5) + ' (→8 from above)');
}

// ── CLAIM 4 · UNIFORM NEG-CONTROL identically zero (re-derived as centre − centre) ──
console.log('\n· CLAIM 4 — uniform field: residual ≡ 0 exactly, bulge ≡ circle:');
{
  let ok = true, maxAbs = 0;
  for (const d of [3, 7, 20, 100]) {
    const c = centreAccel(d);                  // the constant vector every point gets
    for (let k = 0; k < 64; k++) {
      const th = k * 2 * Math.PI / 64;
      // the core's neg-control:
      const u = uniformResidual(th);
      // an INDEPENDENT re-derivation: under a truly uniform field every point feels
      // exactly the centre vector, so residual = (centre) − (centre) = [0,0] EXACTLY.
      const hand = [c[0] - c[0], c[1] - c[1]];
      if (u[0] !== 0 || u[1] !== 0) ok = false;
      if (hand[0] !== 0 || hand[1] !== 0) ok = false;
      if (uniformBulgeHeight(th) !== 0) ok = false;
      maxAbs = Math.max(maxAbs, Math.abs(u[0]), Math.abs(u[1]), Math.abs(hand[0]), Math.abs(hand[1]));
    }
  }
  ck('uniformResidual ≡ [0,0] exactly AND (centre−centre) ≡ [0,0]; uniform bulge ≡ 0 (circle)',
    ok && maxAbs === 0, 'max|residual| = ' + maxAbs);
}

// ── CLAIM 5 · P₂ SHAPE — peaks/minima equal, mean 0, magic-angle zeros ──
console.log('\n· CLAIM 5 — the equilibrium P₂ bulge (two equal peaks, mean 0, magic angle):');
{
  // re-derive bulgeHeight by hand: 3cos²θ − 3/2.
  const handBulge = (th) => 3 * Math.cos(th) * Math.cos(th) - 1.5;
  let worstVsHand = 0;
  for (let k = 0; k < 360; k++) {
    const th = k * Math.PI / 180;
    worstVsHand = Math.max(worstVsHand, Math.abs(bulgeHeight(th, 10) - handBulge(th)));
  }
  ck('bulgeHeight === 3cos²θ − 3/2 (hand-rolled)', worstVsHand < 1e-15, 'max|Δ| ' + worstVsHand.toExponential(2));
  const pn = bulgeHeight(0, 10), pf = bulgeHeight(Math.PI, 10);
  ck('peaks equal at θ=0 and θ=π (the two bulges) to <1e-12 AND both = +3/2',
    Math.abs(pn - pf) < 1e-12 && Math.abs(pn - 1.5) < 1e-12,
    'peak(0)=' + pn.toFixed(6) + ' peak(π)=' + pf.toFixed(6));
  const ma = bulgeHeight(Math.PI / 2, 10), mb = bulgeHeight(3 * Math.PI / 2, 10);
  ck('minima equal at θ=π/2 and 3π/2 to <1e-12 AND both = −3/2',
    Math.abs(ma - mb) < 1e-12 && Math.abs(ma + 1.5) < 1e-12,
    'min(π/2)=' + ma.toFixed(6) + ' min(3π/2)=' + mb.toFixed(6));
  // angular mean over the ring — compute with a DIFFERENT N than the core (here N=3600).
  let sum = 0; const N = 3600;
  for (let i = 0; i < N; i++) sum += bulgeHeight(i * 2 * Math.PI / N, 10);
  const mean = sum / N;
  ck('angular mean over the ring is 0 to <1e-12 (volume-conserving: water moved, not made)',
    Math.abs(mean) < 1e-12, 'mean = ' + mean.toExponential(2));
  // the magic-angle pinch: closed-form zeros of the UN-offset 3cos²θ−1.
  const magicDeg = MAGIC_ANGLE * 180 / Math.PI;
  const qAtMagic = 3 * Math.cos(MAGIC_ANGLE) ** 2 - 1;
  const qAtNegMagic = 3 * Math.cos(-MAGIC_ANGLE) ** 2 - 1;
  ck('magic angle: 3cos²θ−1 = 0 at θ = ±arccos(1/√3) = ±54.7356° (closed-form zeros)',
    Math.abs(qAtMagic) < 1e-12 && Math.abs(qAtNegMagic) < 1e-12 && Math.abs(magicDeg - 54.7356) < 1e-3,
    'arccos(1/√3) = ' + magicDeg.toFixed(4) + '° · 3cos²−1 = ' + qAtMagic.toExponential(2));
}

// ── DOMAIN GUARDS — out-of-scope inputs return NaN, never silent garbage ──
console.log('\n· DOMAIN GUARDS — d≤R / non-finite / point-at-Moon → NaN:');
ck('moonAccelAt(P, d<R) → NaN (Moon inside the ocean)', Number.isNaN(moonAccelAt([0, 0], 0.5)[0]));
ck('moonAccelAt(P, ∞) → NaN', Number.isNaN(moonAccelAt([0, 0], Infinity)[0]));
ck('moonAccelAt([d,0], d) → NaN (point exactly at the Moon)', Number.isNaN(moonAccelAt([10, 0], 10)[0]));
ck('centreAccel(d≤R) → NaN', Number.isNaN(centreAccel(0.5)[0]));
ck('moonAccelAt just outside R is finite', Number.isFinite(moonAccelAt([1, 0], 1.0001)[0]));

// ── BYTE-TWIN PARITY — index.html's inlined core === core.mjs CORE region ──
console.log('\n· BYTE-TWIN PARITY — the page inlines core.mjs byte-identically:');
const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
let pageSrc = '';
try { pageSrc = readFileSync(join(here, 'index.html'), 'utf8'); } catch (e) { /* forged later */ }
const BEGIN = '/* CORE BEGIN';
const END = '/* CORE END */';
function region(text) {
  const i = text.indexOf(BEGIN), j = text.indexOf(END);
  if (i < 0 || j < 0 || j < i) return null;
  return text.slice(i, j + END.length);
}
function norm(s) {
  return s.split('\n').map(l => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter(l => l.length).join('\n');
}
const coreRegion = region(coreSrc);
const pageRegion = pageSrc ? region(pageSrc) : null;
ck('CORE sentinels present in core.mjs', !!coreRegion);
if (pageSrc) {
  ck('CORE sentinels present in index.html', !!pageRegion);
  ck('index.html inlined core === core.mjs CORE region (indentation-normalized)',
    !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion),
    pageRegion && coreRegion && norm(coreRegion) === norm(pageRegion) ? 'IDENTICAL' : 'DRIFTED');
} else {
  console.log('  ..   index.html not forged yet — skipping page byte-parity (run forge, then re-test)');
}

// ── report ──
console.log('\n' + (fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
console.log('  The tide is the GRADIENT: subtract the average pull and what is LEFT is a stretch, outward at BOTH poles. Two bulges.');
if (fail) { console.log('\n  FAILING:\n    ' + fails.join('\n    ')); process.exit(1); }
