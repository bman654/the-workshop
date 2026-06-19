// Node twin for The Vantage (a scene you walk into until ~40 fragments resolve
// into a five-point star from one earned camera pose). Zero-dep, DOM-free.
// Run: `node vantage/core.test.mjs` (or `node core.test.mjs` from vantage/).
// Exit 0 = green; non-zero = red.
//
//   (a)  FORWARD CONSTRUCTION — r(C*) = Σ‖π(C*,Pᵢ)−Tᵢ‖² < 1e-9 (machine-ε). The
//        scene is BUILT by back-projection so the identity inverse∘forward holds;
//        r(C*)=0 is algebra, not a fit.
//   (a′) DETERMINISM — buildScene(SEED) is a pure function of the seed.
//   (b)  NEG-CONTROL 1 (strict minimum) — perturb ANY single DOF (yaw/pitch/dolly)
//        by ±DELTA and r exceeds that axis's CALIBRATED per-axis τ, in BOTH
//        directions, with a fixed 2× margin. The threshold is calibrated to the
//        per-axis slope; the math is never fudged to fit a flat τ.
//   (b′) SLOPES PINNED — the per-axis sensitivity (yaw≈.494 pitch≈.470 dolly≈.132)
//        is a measured projective fact; dolly is strictly the softest (~3.7× under
//        yaw). Pinned so a camera-math drift trips the test.
//   (c)  NEG-CONTROL 2 — a RANDOM cloud admits NO resolving pose over a dense
//        48×24×16 = 18432-pose grid (best r ≫ τ). Structure is what makes a
//        vantage exist; a contrasting (c′) shows the built scene does resolve.
//   (d)  LOCK BAND HONESTY — LOCK_EPS sits below the smallest per-axis τ, so the
//        page "VANTAGE FOUND" lock demands nearness on ALL THREE DOFs.
//   (e)  FELT UI carries NO claim but is well-formed (1 at C*, in [0,1], monotone).
//   (f)  NO ROLL — the pose is exactly {yaw,pitch,dolly}; a stray roll is inert.
//   (g)  BYTE-TWIN — the inlined core between the sentinels in index.html is
//        byte-identical (indentation-normalised) to core.mjs's body.
//   Also runs the page's own runSelfTest() — all green.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  FOCAL, NFRAG, SEED, TARGET, AXIS_SLOPE, TAU_AXIS, DELTA_STRICT, LOCK_EPS,
  starOutline, projectNorm, backProject, buildScene, residual, feltCloseness,
  buildRandomCloud, gridBest, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok){ if (ok) pass++; else { fail++; fails.push(name); } }

// ── (page) the bundled self-test is all-green ──
const st = runSelfTest();
for (const c of st.checks) ck('selftest ' + c.name + '  [' + c.info + ']', c.pass);

// ── (a) FORWARD CONSTRUCTION — r(C*) = 0 to machine-ε ──
ck('(a) r(C*) = Σ‖π(C*,Pᵢ)−Tᵢ‖² < 1e-9 (forward-by-construction)', (() => {
  return residual(buildScene(SEED), TARGET) < 1e-9;
})());
// the construction identity, re-derived by hand: back-project Tᵢ at depth dᵢ,
// project it back through C*, and you land on Tᵢ to machine-ε (π∘π⁻¹ = id).
ck('(a) π(C*, backProject(Tᵢ,dᵢ,C*)) === Tᵢ to machine-ε (inverse∘forward identity)', (() => {
  const anchors = starOutline(NFRAG);
  let maxErr = 0;
  for (let i = 0; i < NFRAG; i++){
    for (const d of [3.2, 5.0, 7.5]){
      const P = backProject(anchors[i][0], anchors[i][1], d, TARGET);
      const q = projectNorm(P, TARGET);
      maxErr = Math.max(maxErr, Math.abs(q[0] - anchors[i][0]), Math.abs(q[1] - anchors[i][1]));
    }
  }
  return maxErr < 1e-12;
})());

// ── (a′) DETERMINISM ──
ck('(a′) buildScene(SEED) is a pure function of the seed (reproducible)', (() => {
  const f1 = buildScene(SEED), f2 = buildScene(SEED);
  for (let i = 0; i < NFRAG; i++)
    for (const k of ['a', 'b'])
      for (let j = 0; j < 3; j++) if (f1[i][k][j] !== f2[i][k][j]) return false;
  return true;
})());
ck('(a′) a different seed makes a different scene (the seed actually drives it)', (() => {
  const f1 = buildScene(SEED), f2 = buildScene(SEED + 1);
  return f1[0].a[0] !== f2[0].a[0];
})());

// ── (b) NEG-CONTROL 1 — strict minimum, per-axis calibrated τ ──
ck('(b) perturb ANY single DOF ±' + DELTA_STRICT + ' ⇒ r > per-axis τ, BOTH dirs', (() => {
  const frags = buildScene(SEED);
  for (const dof of ['yaw', 'pitch', 'dolly']){
    for (const d of [+DELTA_STRICT, -DELTA_STRICT]){
      const C = { ...TARGET }; C[dof] += d;
      if (!(residual(frags, C) > TAU_AXIS[dof])) return false;
    }
  }
  return true;
})());
// the margin is a fixed 2× on EVERY axis (τ = half the perturbed residual) —
// including the soft dolly. This is the whole point of a per-axis τ.
ck('(b) strict-min margin is ≥ 1.8× on every axis (incl. the soft dolly)', (() => {
  const frags = buildScene(SEED);
  let worst = Infinity;
  for (const dof of ['yaw', 'pitch', 'dolly'])
    for (const d of [+DELTA_STRICT, -DELTA_STRICT]){
      const C = { ...TARGET }; C[dof] += d;
      worst = Math.min(worst, residual(frags, C) / TAU_AXIS[dof]);
    }
  return worst >= 1.8;
})());
// a FLAT global τ = 0.05 (the prototype's first guess) FALSELY rejects the soft
// dolly — the bug the per-axis τ fixes. Demonstrate it here so the fix is anchored.
ck('(b) a FLAT τ=0.05 would FALSELY fail the dolly (why per-axis τ is needed)', (() => {
  const frags = buildScene(SEED);
  const C = { ...TARGET }; C.dolly += DELTA_STRICT;
  const r = residual(frags, C);
  return r < 0.05 && r > TAU_AXIS.dolly;   // flat τ rejects it; per-axis τ accepts it
})());

// ── (b′) PIN THE SLOPES ──
ck('(b′) per-axis slopes pinned: yaw≈.494 pitch≈.470 dolly≈.132 (±0.01)', (() => {
  const frags = buildScene(SEED);
  for (const dof of ['yaw', 'pitch', 'dolly']){
    let acc = 0, m = 0;
    for (const d of [0.02, 0.05, 0.1, -0.05, -0.1]){
      const C = { ...TARGET }; C[dof] += d;
      acc += residual(frags, C) / Math.abs(d); m++;
    }
    if (Math.abs(acc / m - AXIS_SLOPE[dof]) > 0.01) return false;
  }
  return true;
})());
ck('(b′) dolly is STRICTLY the softest axis (~3.7× under yaw) — a projective fact', (() => {
  return AXIS_SLOPE.dolly < AXIS_SLOPE.pitch
      && AXIS_SLOPE.dolly < AXIS_SLOPE.yaw
      && AXIS_SLOPE.yaw / AXIS_SLOPE.dolly > 3 && AXIS_SLOPE.yaw / AXIS_SLOPE.dolly < 4.5;
})());

// ── (c) NEG-CONTROL 2 — a random cloud has no vantage ──
ck('(c) random cloud: dense 18432-pose grid best r ≫ τ (no resolving pose exists)', (() => {
  const { best } = gridBest(buildRandomCloud(99999));
  const maxTau = Math.max(TAU_AXIS.yaw, TAU_AXIS.pitch, TAU_AXIS.dolly);
  return best > maxTau * 5 && best > 0.5;
})());
ck('(c) the grid density is the pinned 48×24×16 = 18432 poses', (() => {
  // re-run with the explicit pinned dims and confirm it matches the default.
  const a = gridBest(buildRandomCloud(99999));
  const b = gridBest(buildRandomCloud(99999), 48, 24, 16);
  return a.best === b.best && 48 * 24 * 16 === 18432;
})());
// ── (c′) contrast: the BUILT scene DOES resolve (a vantage exists) ──
ck('(c′) built scene grid-best ≪ random-cloud grid-best (a vantage exists)', (() => {
  return gridBest(buildScene(SEED)).best < 0.1;
})());

// ── (d) LOCK BAND HONESTY ──
ck('(d) LOCK_EPS < min per-axis τ (a page lock needs all 3 DOFs near C*)', (() => {
  return LOCK_EPS < Math.min(TAU_AXIS.yaw, TAU_AXIS.pitch, TAU_AXIS.dolly);
})());

// ── (e) FELT UI (render-only, no claim) is well-formed ──
ck('(e) feltCloseness(C*) === 1 exactly', (() => {
  return feltCloseness(buildScene(SEED), TARGET) === 1;
})());
ck('(e) feltCloseness ∈ [0,1] and monotone DECREASING backing away from C*', (() => {
  const frags = buildScene(SEED);
  let prev = 1;
  for (let k = 0; k <= 30; k++){
    const t = k / 30;
    const C = { yaw: TARGET.yaw + t * 1.6, pitch: TARGET.pitch + t * 0.7, dolly: TARGET.dolly + t * 2.2 };
    const f = feltCloseness(frags, C);
    if (f < 0 || f > 1 || f > prev + 1e-12) return false;
    prev = f;
  }
  return true;
})());

// ── (f) NO ROLL — the camera is two rotations ──
ck('(f) pose is exactly {yaw,pitch,dolly} — no roll DOF', (() => {
  return Object.keys(TARGET).sort().join(',') === 'dolly,pitch,yaw';
})());
ck('(f) a stray roll term is inert (projectNorm ignores it)', (() => {
  const frags = buildScene(SEED);
  const p1 = projectNorm(frags[3].b, TARGET);
  const p2 = projectNorm(frags[3].b, { ...TARGET, roll: -0.9 });
  return p1[0] === p2[0] && p1[1] === p2[1] && p1[2] === p2[2];
})());

// ── (g) BYTE-TWIN PARITY: index.html inlined core === core.mjs body ──
const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
const BEGIN = '// ===== VANTAGE CORE (byte-identical to core.mjs) =====';
const END = '// ===== END VANTAGE CORE =====';
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
ck('(g) byte-parity: VANTAGE CORE sentinels present in core.mjs', !!coreRegion);
ck('(g) byte-parity: VANTAGE CORE sentinels present in index.html', !!pageRegion);
ck('(g) byte-parity: index.html inlined core === core.mjs body (indentation-normalised)',
   !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion));
// pin the twin's line count of the core body so a silent addition is caught.
const coreLines = coreRegion ? norm(coreRegion).split('\n').length : -1;
ck('(g) core body line-count pinned (normalised) — guards a silent core edit', coreLines === EXPECTED_CORE_LINES());
function EXPECTED_CORE_LINES(){ return 302; }   // re-pin if the core legitimately grows

// ── report ──
console.log('The Vantage — core.test.mjs');
console.log('  page self-test: ' + st.passed + '/' + st.total + ' checks green');
console.log('  r(C*) = ' + st.rStar.toExponential(2) + '  (machine-ε, forward-by-construction)');
console.log('  per-axis τ: yaw=' + TAU_AXIS.yaw.toFixed(4) + ' pitch=' + TAU_AXIS.pitch.toFixed(4)
            + ' dolly=' + TAU_AXIS.dolly.toFixed(4) + '  (dolly is the soft axis)');
console.log('  core body lines (normalised): ' + coreLines);
console.log('  byte-parity: ' + (coreRegion && pageRegion && norm(coreRegion) === norm(pageRegion) ? 'IDENTICAL' : 'DRIFTED'));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
