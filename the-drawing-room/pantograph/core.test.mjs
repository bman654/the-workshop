// Node twin for THE PANTOGRAPH THAT KEEPS ITS SHAPE (a rigid Scheiner four-bar
// that copies a hand-traced figure at scale s — the open parallelogram carries an
// EXACT affine map P = O + s·(T − O), solved from the dragged tracer). Zero-dep.
// Run: `node core.test.mjs`. Exit 0 = green; non-zero = red.
//
// Mirrors the trammel two-tolerance discipline:
//   [shared] runs the SAME runSelfTest() the in-page pill runs and mirrors its
//            verdict here, so the twin and the pill can never diverge.
//   (1) COLLINEARITY — TIGHT: area(O,T,P) < 1e-12 over a HEAVY master sweep + many
//       random annulus draws, from the closed-form RR-solve (P is DERIVED).
//   (2) RATIO + LOCUS — TIGHT, INDEPENDENT oracle: |OP|/|OT| ≡ s AND P equals the
//       affine oracle O + s·(T − O) (a DIFFERENT computation than the rigid solve)
//       to < 1e-12; the inverse map (s → 1/s) round-trips T to < 1e-12.
//   (3) RIGID 4-BAR + NON-DEGENERACY — all four bars hold to machine-ε; the apex
//       height stays > 1.66 (a REAL open parallelogram, never a collapsed stick).
//   (4) NEG-CONTROL DETUNE — FALSIFIABLE in BOTH directions: f = 1 is clean; every
//       f ≠ 1 (a genuinely wrong short bar) bows area > 1e-2 AND shears the copy
//       off the oracle > 1e-2. Exactness provably dies. Never a faked area.
//   (5) DETERMINISM / SKIN-INVARIANCE: identical inputs → byte-identical joint
//       fingerprint; a far-out drag clamps NaN-free to the annulus boundary.
//   (BYTE-TWIN): the inlined core between the sentinels in index.html is byte-
//       identical (indentation-normalised) to core.mjs's body — the rendered
//       mechanism can never drift from the proof.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  ELBOW, EPS_DETUNE, RIG, MASTER,
  vdist,
  clampTracer, jointA, affineOracle, solve,
  masterPoint, masterPath, swapRatio, makeRng, fingerprint, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok){ if (ok) pass++; else { fail++; fails.push(name); } }

const { O, p, q, s, elbow } = RIG;

// ── (page) the bundled self-test is all-green ──
const st = runSelfTest();
for (const c of st.checks) ck('selftest ' + c.name + '  [' + c.info + ']', c.pass);

// ── a HEAVY independent sweep generator (finer than the core's own grid) ──
function heavySweep(cb){
  const N = 12000;
  for (let i = 0; i <= N; i++) cb(masterPoint(i / N));
  const rng = makeRng(0xC0FFEE);
  for (let i = 0; i < 3000; i++){
    const ang = rng() * 2 * Math.PI;
    const rad = (Math.abs(p - q) + 0.15) + rng() * ((p + q - 0.15) - (Math.abs(p - q) + 0.15));
    cb({ x: O.x + rad * Math.cos(ang), y: O.y + rad * Math.sin(ang) });
  }
}

// ── (1) COLLINEARITY — closed-form RR-solve, P DERIVED, area < 1e-12 ──
ck('(1) COLLINEARITY area(O,T,P) < 1e-12 over a HEAVY master + 3000 random annulus draws', (() => {
  let mx = 0;
  heavySweep(T => { mx = Math.max(mx, solve(O, T, p, q, s, elbow, 1).area); });
  return mx < 1e-12;
})());

// ── (2) RATIO + LOCUS vs the INDEPENDENT affine oracle ──
ck('(2) |OP|/|OT| ≡ s AND P == affine-oracle O+s·(T−O) < 1e-12 (independent computation)', (() => {
  let mxR = 0, mxA = 0;
  heavySweep(T => {
    const r = solve(O, T, p, q, s, elbow, 1);
    mxR = Math.max(mxR, Math.abs(r.ratio - s));
    // re-derive the oracle here, NOT from r, so this is a genuinely separate check
    const orc = affineOracle(O, clampTracer(O, T, p, q), s);
    mxA = Math.max(mxA, vdist(r.P, orc));
  });
  return mxR < 1e-12 && mxA < 1e-12;
})());

// ── (2b) the INVERSE map (s → 1/s) round-trips the tracer to itself ──
ck('(2b) inverse map (tracer↔pen, s→1/s) round-trips T back to itself < 1e-12', (() => {
  let mx = 0;
  heavySweep(T => {
    const r = solve(O, T, p, q, s, elbow, 1);
    // run the SAME machine with pen P as tracer at scaled bars and ratio 1/s
    const inv = solve(O, r.P, s * p, s * q, swapRatio(s), elbow, 1);
    mx = Math.max(mx, vdist(inv.P, r.T));
  });
  return mx < 1e-12;
})());

// ── (3) RIGID 4-BAR (full annulus) + open-parallelogram non-degeneracy (over the
//        MASTER FIGURE the hand traces — the apex floor is a property of the path,
//        and the default rig sits the whole master well off both annulus rings) ──
let barReport = '';
ck('(3) all four bars {p,q,s·p,s·q} hold to machine-ε (full annulus) AND master apex height > 1.66 (open, not a stick)', (() => {
  let maxBarErr = 0;
  heavySweep(T => {
    const r = solve(O, T, p, q, s, elbow, 1);
    maxBarErr = Math.max(maxBarErr,
      Math.abs(r.barLengths.OA - p), Math.abs(r.barLengths.TA - q),
      Math.abs(r.barLengths.OB - s * p), Math.abs(r.barLengths.BP - s * q));
  });
  let minH = Infinity;
  const MN = 16000;
  for (let i = 0; i <= MN; i++) minH = Math.min(minH, solve(O, masterPoint(i / MN), p, q, s, elbow, 1).heightA);
  barReport = 'maxBarErr=' + maxBarErr.toExponential(2) + ' minMasterApexHeight=' + minH.toFixed(3);
  return maxBarErr < 1e-9 && minH > 1.66;
})());

// ── (4) NEG-CONTROL DETUNE — falsifiable in BOTH directions ──
ck('(4a) f=1 is clean: area < 1e-12 AND copy on the oracle < 1e-12', (() => {
  let mxArea = 0, mxAff = 0;
  heavySweep(T => { const r = solve(O, T, p, q, s, elbow, 1); mxArea = Math.max(mxArea, r.area); mxAff = Math.max(mxAff, r.affErr); });
  return mxArea < 1e-12 && mxAff < 1e-12;
})());
let detuneReport = '';
ck('(4b) EVERY detuned f≠1 bows area > 1e-2 AND shears copy off the oracle > 1e-2 (both directions)', (() => {
  let allFail = true, worstArea = Infinity, worstShear = Infinity;
  for (const f of [1.03, 0.95, 1.06, 0.9, 1.1, 0.85]){
    let mxArea = 0, mxShear = 0;
    heavySweep(T => { const r = solve(O, T, p, q, s, elbow, f); mxArea = Math.max(mxArea, r.area); mxShear = Math.max(mxShear, r.affErr); });
    if (!(mxArea > EPS_DETUNE && mxShear > EPS_DETUNE)) allFail = false;
    worstArea = Math.min(worstArea, mxArea); worstShear = Math.min(worstShear, mxShear);
  }
  detuneReport = 'min detuned area=' + worstArea.toFixed(3) + ' shear=' + worstShear.toFixed(3) + ' (all > ' + EPS_DETUNE + ')';
  return allFail;
})());

// ── (5) DETERMINISM / SKIN-INVARIANCE + clamp safety ──
ck('(5) identical inputs ⇒ byte-identical fingerprint AND far drag clamps NaN-free', (() => {
  for (const T of [masterPoint(0.07), masterPoint(0.4), masterPoint(0.93), { x: 2.0, y: -0.5 }]){
    if (fingerprint(O, T, p, q, s, elbow, 1) !== fingerprint(O, T, p, q, s, elbow, 1)) return false;
  }
  const far = solve(O, { x: 120, y: -70 }, p, q, s, elbow, 1);
  for (const v of [far.A.x, far.A.y, far.B.x, far.B.y, far.P.x, far.P.y]) if (!isFinite(v)) return false;
  return far.clamped;
})());

// the master path is closed (first === last) and entirely reachable (already clamped == itself)
ck('(extra) master path is closed AND every master point lies inside the annulus (clamp is identity there)', (() => {
  const pts = masterPath(360);
  if (vdist(pts[0], pts[pts.length - 1]) > 1e-9) return false;
  for (const T of pts){ const c = clampTracer(O, T, p, q); if (vdist(c, T) > 1e-12) return false; }
  return true;
})());

// ── (BYTE-TWIN PARITY) index.html inlined core === core.mjs body ──
const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
let pageSrc = '';
try { pageSrc = readFileSync(join(here, 'index.html'), 'utf8'); } catch { /* page not forged yet */ }
const BEGIN = '// ===== PANTOGRAPH CORE (byte-identical to core.mjs) =====';
const END = '// ===== END PANTOGRAPH CORE =====';
function region(text){
  const i = text.indexOf(BEGIN), j = text.indexOf(END);
  if (i < 0 || j < 0 || j < i) return null;
  return text.slice(i + BEGIN.length, j);
}
function norm(s){
  return s.split('\n').map(l => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter(l => l.length).join('\n');
}
const coreRegion = region(coreSrc);
const pageRegion = pageSrc ? region(pageSrc) : null;
ck('(byte) PANTOGRAPH CORE sentinels present in core.mjs', !!coreRegion);
ck('(byte) PANTOGRAPH CORE sentinels present in index.html', !!pageRegion);
ck('(byte) index.html inlined core === core.mjs body (indentation-normalised)',
   !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion));

// ── report ──
console.log('The Pantograph That Keeps Its Shape — core.test.mjs');
console.log('  page self-test: ' + st.passed + '/' + st.total + ' checks green');
console.log('  ' + barReport);
console.log('  ' + detuneReport);
console.log('  byte-parity: ' + (coreRegion && pageRegion && norm(coreRegion) === norm(pageRegion) ? 'IDENTICAL' : (pageRegion ? 'DRIFTED' : 'page not forged yet')));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
