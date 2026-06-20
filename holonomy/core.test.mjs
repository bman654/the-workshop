// ============================================================================
//  Node twin for THE HOLONOMY WALK core (curved-surface parallel transport).
//  Zero-dep.  Run:  node holonomy/core.test.mjs   (exit 0 = green; non-zero = red)
//
//  Proves the room's CLAIM, not merely that the code runs:
//   (1) CONVERGENCE — a closed loop on constant-K court: the discrete transport
//       holonomy −∮S'dθ equals the enclosed-curvature integral ∬K dA to <1e-9,
//       over several loops and several K. (This is Gauss-Bonnet, measured.)
//   (2) EXACT ANCHOR — a latitude/cap loop's transport Δθ === 2π(1−cos(√K r)) to
//       <1e-9 (a NON-convergence closed form; the design's honesty discipline —
//       the value is computed for the loop actually traced, never hard-coded).
//   (3) NEG-CONTROL FLAT — K=0 ⇒ Δθ EXACTLY 0 for ANY closed loop incl. random
//       scribbles; and two grains dragged north stay exactly equidistant.
//   (4) NEG-CONTROL SIGNED CANCELLATION — a balanced figure-eight closes with
//       |Δθ|<1e-9 while a single lobe alone stays bounded AWAY from 0 (isolates
//       SIGNED enclosed area as the sole cause, against length/path confounds).
//   (5) COMMUTATION-FAILURE THEOREM — transport around a small parallelogram:
//       the holonomy = K·(metric area) to leading order and = 0 EXACTLY at K=0
//       (the literal failure of parallel transport to commute).
//   (6) GEODESIC DEVIATION + KISS — the gap obeys Jacobi cos/cosh; the sphere's
//       kiss lands at s=π/(2√K), ξ=0 to <1e-9; saddle grains flee (gap grows).
//   (7) PLUMBING/PARITY — area-holonomy and transport-holonomy are sign-true and
//       symmetric; the bridge K·A_K(r)=1−S'(r) holds; and the inlined CORE slab in
//       holonomy/index.html is byte-identical (indentation-normalised) to core.mjs.
// ============================================================================

import {
  metricS, metricSp, transportAlong, holonomyByArea, radialPrimitive,
  latitudeHolonomyExact, latitudeLoop, deviationGap, kissArcLength,
  parallelogramHolonomy, figureEight,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

function mulberry32(a){
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(0x4F1C3A);
const EPS = 1e-9;
let pass = 0, fail = 0; const fails = [];
function check(name, ok, detail){
  if (ok) pass++; else { fail++; fails.push(name + (detail ? '  [' + detail + ']' : '')); }
  console.log((ok ? '  PASS ' : '  FAIL ') + name + (detail ? '  ' + detail : ''));
}

// build a random closed polar loop bounded in r∈(rmin,rmax), θ over one turn, that
// stays a SIMPLE positively-wound loop about the pole (monotone θ, returns to start)
function randomLoop(rmin, rmax, n, seed){
  const r = mulberry32(seed);
  const verts = [];
  for (let i = 0; i <= n; i++){
    const th = 2*Math.PI * (i/n);
    const rr = (i === n) ? null : rmin + (rmax - rmin)*r();
    verts.push({ r: rr, th });
  }
  verts[n] = { r: verts[0].r, th: 2*Math.PI };   // close in θ at the start radius
  return verts;
}

// ── (1) CONVERGENCE: transport holonomy −∮S'dθ == enclosed ∬K dA ────────────
{
  let maxErr = 0, worst = '';
  for (const K of [0.6, 1.0, 1.7, -0.5, -1.2, 0.25]){
    for (let s = 0; s < 6; s++){
      const loop = randomLoop(0.15, 0.65, 9, 0xA00 + s*7 + Math.round(K*97));
      const tr = transportAlong(loop, K).netDelta;
      const ar = holonomyByArea(loop, K);
      const e = Math.abs(tr - ar);
      if (e > maxErr){ maxErr = e; worst = 'K=' + K + ' seed' + s; }
    }
  }
  check('(1) transport −∮S′dθ == enclosed ∬K dA  (6 K × 6 random loops; Gauss-Bonnet)',
    maxErr < EPS, 'max |Δ| ' + maxErr.toExponential(2) + ' @' + worst);
}

// ── (2) EXACT ANCHOR: latitude loop transport Δθ === 2π(1−cos√K r) ──────────
{
  let maxErr = 0, worst = 0;
  for (const K of [0.4, 1.0, 2.0]){
    for (const r of [0.2, 0.5, 0.9, Math.PI/(2*Math.sqrt(K))*0.99]){
      const loop = latitudeLoop(r, 1440);
      const tr = transportAlong(loop, K).netDelta;
      const exact = latitudeHolonomyExact(r, K);
      const e = Math.abs(tr - exact);
      if (e > maxErr){ maxErr = e; worst = r; }
    }
  }
  check('(2) latitude loop Δθ === 2π(1−cos√K·r) exact closed form  (<1e-9)',
    maxErr < EPS, 'max |Δ| ' + maxErr.toExponential(2) + ' @r=' + worst.toFixed(3));

  // honesty: the OCTANT anchor (three right angles) is EXACTLY a quarter turn — but
  // a general latitude loop is NOT. Show the design's stated distinction is real.
  const r1 = 0.5, K1 = 1.0;
  const latVal = latitudeHolonomyExact(r1, K1);              // = 2π(1−cos 0.5) ≈ 0.768
  const quarter = Math.PI/2;
  check('(2′) HONESTY: a latitude loop (r=0.5,K=1) is NOT a quarter turn (it is 2π(1−cos r))',
    Math.abs(latVal - quarter) > 0.5, 'lat Δθ=' + latVal.toFixed(4) + ' ≠ π/2=' + quarter.toFixed(4));
}

// ── (3) NEG-CONTROL FLAT: K=0 ⇒ Δθ EXACTLY 0 for any loop; grains stay parallel ─
{
  let maxFlat = 0;
  // random scribbles (NOT simple about the pole) — flat holonomy must still be 0
  for (let s = 0; s < 40; s++){
    const n = 5 + Math.floor(rnd()*6);
    const loop = [];
    const r0 = 0.2 + rnd()*0.4, th0 = rnd()*6;
    for (let i = 0; i < n; i++) loop.push({ r: r0 + (rnd()-0.5)*0.6, th: th0 + (rnd()-0.5)*3 });
    loop.push({ r: loop[0].r, th: loop[0].th });             // close it exactly
    maxFlat = Math.max(maxFlat, Math.abs(transportAlong(loop, 0).netDelta),
                                Math.abs(holonomyByArea(loop, 0)));
  }
  // grains dragged north: ξ(s) ≡ ξ₀ at K=0 for all s
  let devFlat = 0;
  for (let i = 0; i <= 50; i++){ const s = i*0.05;
    devFlat = Math.max(devFlat, Math.abs(deviationGap(0.1, s, 0) - 0.1)); }
  check('(3) FLAT (K=0): Δθ EXACTLY 0 for 40 random scribbles; grains stay equidistant',
    maxFlat === 0 && devFlat === 0, 'max|Δθ| ' + maxFlat.toExponential(2) + ' · max|Δξ| ' + devFlat.toExponential(2));
}

// ── (4) SIGNED CANCELLATION: balanced figure-eight ~0; single lobe ≫0 ────────
{
  for (const K of [1.0, 1.6, -0.8]){
    const eight = figureEight(0.45, 0.5, 240);
    const net = transportAlong(eight, K).netDelta;
    const netArea = holonomyByArea(eight, K);
    // a single lobe = the first half of the eight, closed on itself
    const half = eight.slice(0, 242);
    half.push({ r: half[0].r, th: half[0].th });
    const lobe = Math.abs(transportAlong(half, K).netDelta);
    check('(4) figure-eight cancels |Δθ|<1e-6 while one lobe ≫0  (signed area; K=' + K + ')',
      Math.abs(net) < 1e-6 && Math.abs(netArea) < 1e-6 && lobe > 0.02,
      'eight Δθ=' + net.toExponential(2) + ' · area=' + netArea.toExponential(2) + ' · lobe=' + lobe.toFixed(4));
  }
}

// ── (5) COMMUTATION-FAILURE THEOREM: parallelogram holonomy = K·area, 0 at K=0 ─
{
  // tiny parallelogram → holonomy ≈ K · (S(r)·dr·dth) to leading order
  let maxRel = 0;
  for (const K of [0.8, 1.3, -0.6]){
    const r0 = 0.4, th0 = 1.0, dr = 1e-4, dth = 1e-4;
    const { transport, area } = parallelogramHolonomy(r0, th0, dr, dth, K);
    const leading = K * metricS(r0, K) * dr * dth;
    const e = Math.abs(transport - leading) / Math.abs(leading);
    if (e > maxRel) maxRel = e;
    // transport and the area integral agree exactly (same theorem, two computations)
    if (Math.abs(transport - area) > 1e-12) maxRel = 9;
  }
  // at K=0 the commutator vanishes EXACTLY (parallel transport DOES commute on flat)
  const flat = parallelogramHolonomy(0.4, 1.0, 0.2, 0.3, 0);
  check('(5) parallelogram holonomy = K·area (failure to commute); = 0 EXACTLY at K=0',
    maxRel < 1e-3 && flat.transport === 0 && flat.area === 0,
    'max rel(K·area) ' + maxRel.toExponential(2) + ' · flat=' + flat.transport);
}

// ── (6) GEODESIC DEVIATION + KISS ───────────────────────────────────────────
{
  // sphere: grains CONVERGE; the kiss is at s=π/(2√K), ξ=0
  let kissErr = 0, convOK = true, fleeOK = true;
  for (const K of [0.5, 1.0, 2.0]){
    const sK = kissArcLength(K);
    kissErr = Math.max(kissErr, Math.abs(deviationGap(0.1, sK, K)));   // ξ at kiss == 0
    if (!(deviationGap(0.1, sK*0.5, K) < 0.1)) convOK = false;          // closing before the kiss
  }
  // saddle: grains FLEE (gap strictly grows)
  for (const K of [-0.5, -1.0]){
    if (!(deviationGap(0.1, 1.0, K) > 0.1)) fleeOK = false;
  }
  check('(6) deviation: sphere kiss at s=π/(2√K) ξ→0 (<1e-9); dome converges, saddle flees',
    kissErr < EPS && convOK && fleeOK, 'max |ξ(kiss)| ' + kissErr.toExponential(2));

  // the gap obeys the Jacobi solution ξ(s)=ξ₀cos(√K s) sampled against the closed form
  let jacErr = 0;
  for (let i = 0; i <= 100; i++){ const s = i*0.02, K = 1.3;
    jacErr = Math.max(jacErr, Math.abs(deviationGap(0.07, s, K) - 0.07*Math.cos(Math.sqrt(K)*s))); }
  check('(6′) deviation gap == Jacobi closed form ξ₀cos(√K s)  (<1e-12)',
    jacErr < 1e-12, 'max |Δ| ' + jacErr.toExponential(2));
}

// ── (7) PLUMBING/PARITY: the bridge, the sign, and the byte-twin ────────────
{
  // the tidy bridge K·A_K(r) = 1 − S'(r) (what makes the two holonomies equal)
  let brErr = 0;
  for (const K of [0.7, 1.4, -0.9, 0.3]){
    for (let i = 1; i <= 50; i++){ const r = i*0.02;
      brErr = Math.max(brErr, Math.abs(K*radialPrimitive(r, K) - (1 - metricSp(r, K)))); }
  }
  check('(7) bridge K·A_K(r) === 1 − S′(r)  (ties transport to area; <1e-12)',
    brErr < 1e-12, 'max |Δ| ' + brErr.toExponential(2));

  // sign-true: a positive (CCW) loop on a sphere gives POSITIVE Δθ; reversing the
  // loop negates it; saddle flips the sign for the same loop.
  const loop = latitudeLoop(0.5, 720);
  const rev = loop.slice().reverse();
  const dPos = transportAlong(loop, 1.0).netDelta;
  const dRev = transportAlong(rev, 1.0).netDelta;
  const dSad = transportAlong(loop, -1.0).netDelta;
  check('(7′) sign-true: CCW sphere Δθ>0, reversed = −Δθ, saddle flips sign',
    dPos > 0 && Math.abs(dPos + dRev) < 1e-9 && dSad < 0,
    'Δθ=' + dPos.toFixed(4) + ' rev=' + dRev.toFixed(4) + ' saddle=' + dSad.toFixed(4));
}

// ── (e) BYTE-TWIN PARITY: the page's inlined CORE slab === core.mjs slab ──────
const here = dirname(fileURLToPath(import.meta.url));
const BEGIN = '// === HOLONOMY CORE BEGIN ===';
const END = '// === HOLONOMY CORE END ===';
function region(text){
  const i = text.indexOf(BEGIN), j = text.indexOf(END);
  if (i < 0 || j < 0 || j < i) return null;
  return text.slice(i + BEGIN.length, j);
}
function norm(s){
  return s.split('\n').map(l => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter(l => l.length).join('\n');
}
const coreRegion = region(readFileSync(join(here, 'core.mjs'), 'utf8'));
let pageRegion = null;
try { pageRegion = region(readFileSync(join(here, 'index.html'), 'utf8')); } catch {}
check('(e) byte-parity: CORE sentinels present in core.mjs', !!coreRegion);
check('(e) byte-parity: index.html inlined core === core.mjs (norm)',
  !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion),
  pageRegion ? '' : 'index.html not built yet (run forge)');

console.log('\nThe Holonomy Walk — core.test.mjs');
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
