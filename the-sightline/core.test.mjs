// Node twin for The Sightline (the vantages wing's SECOND room — a figure you
// DRAW by the ORDER you walk). Zero-dep, DOM-free.
// Run: `node the-sightline/core.test.mjs` (or `node core.test.mjs` from the dir).
// Exit 0 = green; non-zero = red.
//
//   (1)  σ — the solution flight C(t) induces the unveil permutation σ === the
//        target figure's star-order (SIGMA). Walk σ and "Argo" draws clean.
//   (2)  ↑t — all 12 slabs first-unoccluded at STRICTLY INCREASING t with an
//        explicit scheduling margin (min gap ≥ MIN_GAP_FLOOR); exactly ONE slab
//        lit at the start (the sealed stack), = SIGMA[0].
//   (3)  ∿ — σ is UNCHANGED under an ease-in/out reparametrization. The order is
//        the GEOMETRY of the walk, not its speed (the headline claim of a PATH).
//   (4)  ±ε — σ holds across an ε-tube of nearby flights (robust, not knife-edge).
//   (5)  ¬a NEG-CONTROL — a depth-collapse foil (co-planar slabs) never swaps
//        occluder ⇒ zero ordered reveals ⇒ the figure can never fill.
//   (6)  ¬b NEG-CONTROL — a dense bath of shuffled flights reproduces σ ~0% of
//        the time: structure + the RIGHT walk spell the figure, not luck.
//   (U)  UNFORKED CAMERA — projectNorm()/backProject() are numerically identical
//        to vantage/core.mjs's own (the camera is one shared law, not a fork).
//   (G)  BYTE-PARITY — the core inlined into index.html (between the SIGHTLINE
//        CORE sentinels) is byte-identical to this module's core body.
//   Also runs the page's own runSelfTest() — all green.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  FOCAL, START, FLIGHT, SIGMA, NSLAB, MIN_GAP_FLOOR, slabs, starOfSlab, FIGURE,
  projectNorm, backProject, exposedSet, poseAt, revealOrder, mulberry32, runSelfTest,
} from './core.mjs';
import { projectNorm as vProject, backProject as vBack } from '../vantage/core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok){ if (ok) pass++; else { fail++; fails.push(name); } }

// ── (page) the bundled self-test is all-green ──
const st = runSelfTest();
for (const c of st.checks) ck('selftest ' + c.mk + '  [' + c.info + ']', c.pass);

// ── (1) σ — solution flight induces σ === SIGMA ──
ck('(1) solution flight C(t) ⇒ σ === target figure star-order (SIGMA)', (() => {
  return revealOrder(slabs, FLIGHT, 800).order.join(',') === SIGMA.join(',');
})());
// and SIGMA actually maps slabs → stroke ranks 0..11 with no gaps (a permutation)
ck('(1) σ is a true permutation of the 12 slabs; starOfSlab inverts it', (() => {
  const seen = new Set(SIGMA);
  if (seen.size !== NSLAB) return false;
  for (let rank = 0; rank < NSLAB; rank++) if (starOfSlab[SIGMA[rank]] !== rank) return false;
  return SIGMA.every(v => v >= 0 && v < NSLAB);
})());

// ── (2) ↑t — strictly increasing peels, scheduling margin, sealed stack ──
ck('(2) all 12 peel at strictly INCREASING t, min gap ≥ ' + MIN_GAP_FLOOR + ' (scheduling margin)', (() => {
  const sol = revealOrder(slabs, FLIGHT, 800);
  const ts = sol.order.map(i => sol.firstT[i]);
  let minGap = Infinity;
  for (let i = 1; i < ts.length; i++){ const g = ts[i] - ts[i - 1]; if (g <= 0) return false; minGap = Math.min(minGap, g); }
  return sol.firstT.every(t => t !== Infinity) && minGap >= MIN_GAP_FLOOR;
})());
ck('(2) sealed stack: exactly ONE slab lit at START, and it is SIGMA[0]', (() => {
  const sol = revealOrder(slabs, FLIGHT, 800);
  const litStart = exposedSet(slabs, START).ex.filter(Boolean).length;
  return sol.pre.length === 1 && sol.pre[0] === SIGMA[0] && litStart === 1;
})());

// ── (3) ∿ — speed-invariance (reparametrization) ──
ck('(3) σ is UNCHANGED under an ease-in/out reparametrization (order = geometry, not speed)', (() => {
  const a = revealOrder(slabs, FLIGHT, 800, false).order.join(',');
  const b = revealOrder(slabs, FLIGHT, 800, true).order.join(',');
  return a === b && a === SIGMA.join(',');
})());
// a stronger reparam: several monotone time-warps (slow-then-fast, fast-then-slow)
ck('(3) σ holds under 4 independent monotone time-warps of the SAME path', (() => {
  const warps = [t => t, t => t * t, t => Math.sqrt(t), t => t * t * (3 - 2 * t)];
  const target = SIGMA.join(',');
  for (const w of warps){
    const firstT = new Array(NSLAB).fill(Infinity);
    let prev = exposedSet(slabs, poseAt(w(0), FLIGHT, false)).ex;
    for (let i = 0; i < NSLAB; i++) if (prev[i]) firstT[i] = 0;
    for (let k = 1; k <= 800; k++){
      const tw = w(k / 800);
      const ex = exposedSet(slabs, poseAt(tw, FLIGHT, false)).ex;
      for (let i = 0; i < NSLAB; i++) if (ex[i] && !prev[i] && firstT[i] === Infinity) firstT[i] = tw;
      prev = ex;
    }
    const order = slabs.map((_, i) => i).sort((a, b) => firstT[a] - firstT[b]).join(',');
    if (order !== target) return false;
  }
  return true;
})());

// ── (4) ±ε — robustness across a tube of nearby flights ──
ck('(4) σ holds across an ε=0.02 tube of 300 nearby flights (robust, not knife-edge)', (() => {
  const target = SIGMA.join(','); const eps = 0.02;
  for (let k = 0; k < 300; k++){
    const r1 = mulberry32(k * 23 + 1), r2 = mulberry32(k * 23 + 2), r3 = mulberry32(k * 23 + 3), r4 = mulberry32(k * 23 + 4);
    const Fp = { yaw0: FLIGHT.yaw0 + (r1() - 0.5) * 2 * eps, yaw1: FLIGHT.yaw1 + (r2() - 0.5) * 2 * eps,
                 pitch: FLIGHT.pitch + (r3() - 0.5) * eps, dolly: FLIGHT.dolly + (r4() - 0.5) * 3 * eps };
    const r = revealOrder(slabs, Fp, 280);
    if (!(r.firstT.every(t => t !== Infinity) && r.order.join(',') === target)) return false;
  }
  return true;
})());

// ── (5) ¬a — depth-collapse foil never fills ──
ck('(5) NEG-CTRL a: a depth-collapse foil (co-planar) yields ZERO ordered reveals', (() => {
  const flat = slabs.map(s => { const cc = projectNorm(s.c, START); return { c: backProject(cc[0], cc[1], 5.0, START), hw:s.hw, hh:s.hh }; });
  const rf = revealOrder(flat, FLIGHT, 500);
  return rf.order.filter(i => rf.firstT[i] > 0 && rf.firstT[i] !== Infinity).length === 0;
})());

// ── (6) ¬b — shuffled flights reproduce σ ~0% ──
ck('(6) NEG-CTRL b: a dense bath of 4000 shuffled flights reproduces σ < 1% of the time', (() => {
  const target = SIGMA.join(','); let match = 0; const TR = 4000, rnd = mulberry32(0xBADF00D);
  for (let k = 0; k < TR; k++){
    const Fr = { yaw0: (rnd() - 0.5) * 3.2, yaw1: (rnd() - 0.5) * 3.2, pitch: (rnd() - 0.5) * 0.9, dolly: 4.0 + rnd() * 2.2 };
    const r = revealOrder(slabs, Fr, 200);
    if (r.firstT.every(t => t !== Infinity) && r.order.join(',') === target) match++;
  }
  return match / TR < 0.01;
})());

// ── (U) UNFORKED CAMERA — our projection IS vantage's, numerically ──
ck('(U) projectNorm/backProject are NUMERICALLY IDENTICAL to vantage/core.mjs (unforked camera)', (() => {
  const rnd = mulberry32(7);
  for (let k = 0; k < 5000; k++){
    const P = [(rnd() - 0.5) * 6, (rnd() - 0.5) * 6, (rnd() - 0.5) * 6];
    const C = { yaw: (rnd() - 0.5) * 6, pitch: (rnd() - 0.5) * 2, dolly: 3 + rnd() * 6 };
    const a = projectNorm(P, C), b = vProject(P, C);
    if (a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2]) return false;
    const u = (rnd() - 0.5) * 2, v = (rnd() - 0.5) * 2, d = 3 + rnd() * 6;
    const ia = backProject(u, v, d, C), ib = vBack(u, v, d, C);
    if (ia[0] !== ib[0] || ia[1] !== ib[1] || ia[2] !== ib[2]) return false;
  }
  return true;
})());
ck('(U) FOCAL matches the vantage constant (2.4)', FOCAL === 2.4);
// inverse∘forward identity (the construction engine is exact)
ck('(U) π(C, backProject(u,v,d,C)) === (u,v) to machine-ε (inverse∘forward identity)', (() => {
  const rnd = mulberry32(11); let maxErr = 0;
  for (let k = 0; k < 2000; k++){
    const C = { yaw: (rnd() - 0.5) * 5, pitch: (rnd() - 0.5) * 1.8, dolly: 3.5 + rnd() * 5 };
    const u = (rnd() - 0.5) * 2, v = (rnd() - 0.5) * 2, d = C.dolly + (rnd() - 0.5) * 3 + 1.6;
    if (d <= 0.1) continue;
    const q = projectNorm(backProject(u, v, d, C), C);
    maxErr = Math.max(maxErr, Math.abs(q[0] - u), Math.abs(q[1] - v));
  }
  return maxErr < 1e-12;
})());

// ── (G) BYTE-PARITY: the inlined core in index.html === core.mjs body ──
const here = dirname(fileURLToPath(import.meta.url));
const BEGIN = '// ===== SIGHTLINE CORE (byte-identical to core.mjs) =====';
const END = '// ===== END SIGHTLINE CORE =====';
function region(text){
  const i = text.indexOf(BEGIN), j = text.indexOf(END);
  if (i < 0 || j < 0 || j < i) return null;
  return text.slice(i + BEGIN.length, j);
}
function norm(s){ return s.split('\n').map(l => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter(l => l.length).join('\n'); }
let coreRegion = null, pageRegion = null;
try { coreRegion = region(readFileSync(join(here, 'core.mjs'), 'utf8')); } catch { /* missing → fail below */ }
try { pageRegion = region(readFileSync(join(here, 'index.html'), 'utf8')); } catch { /* not built yet → fail below */ }
ck('(G) SIGHTLINE CORE sentinels present in core.mjs', !!coreRegion);
ck('(G) SIGHTLINE CORE sentinels present in index.html (forge-inlined)', !!pageRegion);
ck('(G) inlined core in index.html is BYTE-IDENTICAL to core.mjs body (indentation-normalised)',
   !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion));

// ── (sanity) FIGURE is a 12-socket map matching the slab count ──
ck('(sanity) FIGURE has exactly NSLAB sockets', FIGURE.length === NSLAB);

// ── report ──
console.log('The Sightline — core.test.mjs');
console.log('  page self-test: ' + st.checks.filter(c => c.pass).length + '/' + st.checks.length + ' checks green');
console.log('  σ = [' + st.sigma + ']   (min peel gap ' + st.minGap.toFixed(3) + ', floor ' + MIN_GAP_FLOOR + ')');
console.log('  camera: UNFORKED from vantage/core.mjs (FOCAL=' + FOCAL + ', numerically identical)');
console.log('  byte-parity: ' + (coreRegion && pageRegion && norm(coreRegion) === norm(pageRegion) ? 'IDENTICAL' : (pageRegion ? 'DRIFTED' : 'index.html not built yet')));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
