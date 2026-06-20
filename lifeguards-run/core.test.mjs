// The Lifeguard's Run — Node twin. Three layers:
//   (a) run the page's runSelfTest() — every leg must be green;
//   (b) INDEPENDENT re-derivations at params the page never uses (the page can't cheat them);
//   (c) BYTE-PARITY: the slice between the LIFEGUARDS-RUN sentinels in core.mjs and in
//       index.html, indentation-normalized, must be IDENTICAL — so the picture can't drift
//       from this test.
// Exit 0 = all green. Run:  node lifeguards-run/core.test.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  travelTime, dtdx, d2tdx2, snellResidual, angles,
  minimizeTime, minimizeBrute, scanTime, witness, runSelfTest,
} from './core.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0;
const ok = (name, cond, info = '') => {
  if (cond) { pass++; console.log('  ✓ ' + name + (info ? '  [' + info + ']' : '')); }
  else { fail++; console.log('  ✗ ' + name + (info ? '  [' + info + ']' : '')); }
};

console.log('\nThe Lifeguard\'s Run — Node twin\n');

// ── (a) the page's own self-test, run here ──────────────────────────────────
console.log('(a) core runSelfTest() — the same checks the in-page pill reports:');
{
  const st = runSelfTest();
  for (const c of st.checks) ok(c.name, c.pass, c.info);
  ok('runSelfTest summary all green', st.ok, st.passed + '/' + st.total);
}

// ── (b) INDEPENDENT re-derivations at FRESH params the page never uses ───────
console.log('\n(b) independent re-derivations (fresh params, methods not in the page path):');
const TOL = 1e-9;

// A reproducible PRNG so the fresh grid is deterministic.
function makeRng(seed){ let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
const rng = makeRng(0x1FE60D);

// Build a grid of valid params: src above the boundary in the fast medium, tgt below in slow.
function freshParams(n){
  const out = [];
  for (let i = 0; i < n; i++){
    const by = (rng() * 4 - 2);
    const sy = by + 1 + rng() * 5;          // strictly above boundary
    const ty = by - 1 - rng() * 5;          // strictly below boundary
    const sx = -8 + rng() * 6;
    const tx = 1 + rng() * 8;
    const v1 = 1 + rng() * 2.5;
    const v2 = 0.5 + rng() * (v1 - 0.4);     // v2 < v1 (slow lower medium)
    out.push({ src: [sx, sy], tgt: [tx, ty], boundaryY: by, v1, v2 });
  }
  return out;
}

// (b1) Newton vs an independent bisection root, on a fresh grid the page never touches.
{
  let maxGap = 0;
  const grid = freshParams(60);
  for (const p of grid){
    maxGap = Math.max(maxGap, Math.abs(minimizeTime(p).x - minimizeBrute(p).x));
  }
  ok('b1 · Newton x* === bisection root on a fresh 60-param grid (<1e-9)', maxGap < TOL,
     'maxGap=' + maxGap.toExponential(2));
}

// (b2) FINITE-DIFFERENCE: central difference of travelTime ≈ analytic dtdx (<1e-6).
// This re-derives the derivative numerically — it does NOT trust the analytic form.
{
  let maxErr = 0;
  const grid = freshParams(40);
  const h = 1e-6;
  for (const p of grid){
    for (const x of [p.src[0], p.tgt[0], 0.5 * (p.src[0] + p.tgt[0]), minimizeTime(p).x + 0.7]){
      const fd = (travelTime(x + h, p) - travelTime(x - h, p)) / (2 * h);
      maxErr = Math.max(maxErr, Math.abs(fd - dtdx(x, p)));
    }
  }
  ok('b2 · finite-diff of travelTime ≈ analytic dt/dx (<1e-6)', maxErr < 1e-6,
     'maxErr=' + maxErr.toExponential(2));
}

// (b3) FINITE-DIFFERENCE: central difference of dtdx ≈ analytic d2tdx2 (<1e-5).
{
  let maxErr = 0;
  const grid = freshParams(40);
  const h = 1e-5;
  for (const p of grid){
    for (const x of [0.4 * p.src[0] + 0.6 * p.tgt[0], minimizeTime(p).x - 0.3]){
      const fd = (dtdx(x + h, p) - dtdx(x - h, p)) / (2 * h);
      maxErr = Math.max(maxErr, Math.abs(fd - d2tdx2(x, p)));
    }
  }
  ok('b3 · finite-diff of dt/dx ≈ analytic d²t/dx² (<1e-5)', maxErr < 1e-5,
     'maxErr=' + maxErr.toExponential(2));
}

// (b4) SNELL RATIO at the root for several fresh sets: sinθ1/sinθ2 === v1/v2 (<1e-9).
{
  let maxErr = 0;
  const grid = freshParams(30);
  for (const p of grid){
    const a = angles(minimizeTime(p).x, p);
    maxErr = Math.max(maxErr, Math.abs(a.sin1 / a.sin2 - p.v1 / p.v2));
  }
  ok('b4 · Snell ratio sinθ1/sinθ2 === v1/v2 at x* on ≥4 fresh sets (<1e-9)', maxErr < TOL,
     'maxErr=' + maxErr.toExponential(2));
}

// (b5) v1===v2 STRAIGHT COLLAPSE on a NON-symmetric chord (the page boots symmetric-ish).
{
  const p = { src: [-9, 6], tgt: [2, -3], boundaryY: 0.5, v1: 1.9, v2: 1.9 };
  const x = minimizeTime(p).x;
  const dy = p.tgt[1] - p.src[1];
  const xStraight = p.src[0] + ((p.boundaryY - p.src[1]) / dy) * (p.tgt[0] - p.src[0]);
  const a = angles(x, p);
  ok('b5 · v1===v2 ⇒ x* === geometric straight crossing & θ1===θ2 (non-symmetric)',
     Math.abs(x - xStraight) < TOL && Math.abs(a.theta1 - a.theta2) < TOL,
     'Δx=' + Math.abs(x - xStraight).toExponential(2) + ' Δθ=' + Math.abs(a.theta1 - a.theta2).toExponential(2));
}

// (b6) MAXIMIZE FOIL returns an edge with strictly-larger t than the minimum.
{
  let allEdge = true, allWorse = true;
  const grid = freshParams(20);
  for (const p of grid){
    const tMin = minimizeTime(p).tMin;
    const r = minimizeTime(Object.assign({}, p, { maximize: true }));
    if (r.edge !== true) allEdge = false;
    if (!(r.tMin > tMin + 1e-9)) allWorse = false;
  }
  ok('b6 · maximize foil returns an edge endpoint with t strictly > t(x*)', allEdge && allWorse,
     'edge=' + allEdge + ' worse=' + allWorse);
}

// (b7) DOMAIN GUARDS independently: x* & t(x*) finite at degeneracies; finite a hair off;
// v≤0 not finite. (Slope/curvature are undefined exactly where a leg has zero length.)
{
  const odd = [
    { src: [-3, 4], tgt: [6, 0], boundaryY: 0, v1: 2.0, v2: 0.9 },   // target on shore
    { src: [-3, 0], tgt: [6, -5], boundaryY: 0, v1: 2.0, v2: 0.9 },  // source on shore
    { src: [1, 4], tgt: [1, -5], boundaryY: 0, v1: 2.0, v2: 0.9 },   // vertical chord
  ];
  let drawn = true, nearby = true;
  for (const p of odd){
    const x = minimizeTime(p).x;
    if (!Number.isFinite(x) || !Number.isFinite(travelTime(x, p))) drawn = false;
    const xo = x + 0.25;
    if (![travelTime(xo, p), snellResidual(xo, p), d2tdx2(xo, p)].every(Number.isFinite)) nearby = false;
  }
  const vGuard = !Number.isFinite(travelTime(0, { src: [-4, 3], tgt: [5, -4], boundaryY: 0, v1: 0, v2: 1 }));
  ok('b7 · domain guards: x*/t finite at degeneracies; finite a hair off; v=0 not finite',
     drawn && nearby && vGuard, 'drawn=' + drawn + ' nearby=' + nearby + ' vGuard=' + vGuard);
}

// (b8) scanTime is a PICTURE only — tested loosely: monotone x, finite t, the sampled
// minimum is near (but not necessarily equal to) the true x* (a value scan can't be exact).
{
  const p = witness();
  const samples = scanTime(p, 400);
  let monotone = true, finite = true;
  for (let i = 1; i < samples.length; i++){
    if (!(samples[i].x > samples[i - 1].x)) monotone = false;
    if (!Number.isFinite(samples[i].t)) finite = false;
  }
  let best = samples[0];
  for (const s of samples) if (s.t < best.t) best = s;
  const xStar = minimizeTime(p).x;
  // loose: the scan's bottom is within a couple grid steps of x* — it is a picture, not a claim.
  const span = (samples[samples.length - 1].x - samples[0].x), step = span / (samples.length - 1);
  ok('b8 · scanTime is a picture: monotone x, finite t, bottom within ~2 steps of x* (NOT a precision claim)',
     monotone && finite && Math.abs(best.x - xStar) < 2.5 * step,
     'gap=' + Math.abs(best.x - xStar).toExponential(2) + ' (2.5·step=' + (2.5 * step).toExponential(2) + ')');
}

// ── (c) BYTE-PARITY between core.mjs and index.html ─────────────────────────
console.log('\n(c) byte-parity: the CORE slice in index.html must match core.mjs exactly:');
{
  const START = '// ===== LIFEGUARDS-RUN CORE (byte-identical to core.mjs) =====';
  const END = '// ===== END LIFEGUARDS-RUN CORE =====';
  const slice = (txt) => {
    const i = txt.indexOf(START), j = txt.indexOf(END);
    if (i < 0 || j < 0) return null;
    return txt.slice(i, j + END.length);
  };
  const normalize = (s) => s.split('\n').map(l => l.trim()).filter(Boolean).join('\n');
  const coreTxt = readFileSync(join(HERE, 'core.mjs'), 'utf8');
  const pageTxt = readFileSync(join(HERE, 'index.html'), 'utf8');
  const a = slice(coreTxt), b = slice(pageTxt);
  if (a == null || b == null){
    ok('c · core sentinels present in both files', false, 'core=' + (a != null) + ' page=' + (b != null));
  } else {
    const same = normalize(a) === normalize(b);
    console.log('  ' + (same ? 'IDENTICAL' : 'DRIFTED'));
    ok('c · index.html CORE slice === core.mjs CORE slice (indentation-normalized)', same);
  }
}

// ── summary ─────────────────────────────────────────────────────────────────
console.log('\n' + (fail === 0 ? 'PASS' : 'FAIL') + ' — ' + pass + ' passed, ' + fail + ' failed.\n');
process.exit(fail === 0 ? 0 : 1);
