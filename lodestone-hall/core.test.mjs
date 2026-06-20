// ============================================================================
//  Node twin for THE LODESTONE HALL core (Faraday / Lenz / induction).
//  Zero-dep.  Run:  node lodestone-hall/core.test.mjs   (exit 0 = green; non-0 = red)
//
//  Proves the room's CLAIM, not merely that the code runs:
//   [shared] runs the SAME runSelfTest() the in-page pill runs and mirrors its
//            verdict here, so the twin and the pill can never diverge.
//   (1) EMF = −dΦ/dt — the analytic EMF equals −d/dt of the SAME analytic Φ, both
//       on the LINEAR RAIL (position sweep X∈[−3a,3a]) and in the ALTERNATOR (angle
//       sweep θ∈[0,2π]), vs a 5-point Richardson numeric derivative, to <1e-9.
//       DERIVED, never hard-coded.
//   (2) PEAK EMF ∝ ω — peak(c·ω) = c·peak(ω) across an ω-grid, to <1e-9 (linear
//       because EMF = −(dΦ/dθ)·ω and the geometry factor is ω-independent).
//   (3) CLOSED ROUND TRIP ⇒ ∮EMF dt = 0 — Φ returns home, net charge zero, <1e-9.
//   (NEG-a) HOLD STILL / DC — a FROZEN magnet gives EMF ≡ 0 to machine-ε at EVERY
//       position even with Φ large (a naive EMF∝Φ model would light here — RED).
//   (NEG-b) LENZ-OFF — closed-loop hand-work is ≥0 with Lenz ON, STRICTLY <0 with
//       Lenz OFF (energy created): the conservation check goes RED on the cheat.
//   (HERITAGE / ANTI-FORK) — the PORTRAIT reuses iron-filings/core.mjs unforked:
//       iron-filings' CORE sentinels are present, it exports dipoleField + streamline,
//       and the ψ this core derives reproduces iron-filings' dipoleField B EXACTLY
//       (B = (∂ψ/∂y, −∂ψ/∂x)) — the dipole formula byte-matches in effect.
//   (BYTE-TWIN) — index.html's inlined LODESTONE-HALL CORE slab is byte-identical
//       (indentation-normalised) to core.mjs, and the char counts match.
// ============================================================================

import {
  COIL, SCENE,
  streamPsi, momentOf, fluxThroughMouth, fluxGrad,
  emfLinear, emfAlternator, peakEmfAlternator, fluxAtAngle, dFluxdTheta,
  inducedForce, numDeriv,
  checkEmfPositionSweep, checkEmfAngleSweep, checkPeakLinearInOmega,
  closedLoopEmfIntegral, closedLoopHandWork, lineCountProxy,
  runSelfTest,
} from './core.mjs';
import { dipoleField } from '../iron-filings/core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const EPS = 1e-9;
let pass = 0, fail = 0; const fails = [];
function check(name, ok, detail){
  if (ok) pass++; else { fail++; fails.push(name + (detail ? '  [' + detail + ']' : '')); }
  console.log((ok ? '  PASS ' : '  FAIL ') + name + (detail ? '  ' + detail : ''));
}

// ── run the SAME runSelfTest() the page's pill runs; mirror its verdict here so
//    the twin and the in-page pill can never diverge. ──────────────────────────
{
  const r = runSelfTest();
  for (const c of r.checks) check('[shared] ' + c.name, c.pass, c.info);
  check('shared runSelfTest() overall green', r.ok, r.passed + '/' + r.total);
}

// ── (1) re-prove EMF = −dΦ/dt directly here (independent of runSelfTest) ───────
{
  const posWorst = checkEmfPositionSweep(SCENE.m0, SCENE.phi, COIL, SCENE.N);
  const angWorst = checkEmfAngleSweep(SCENE.rig, COIL, SCENE.N);
  check('(1) EMF = −dΦ/dt: analytic vs 5-pt numeric on position + angle sweeps (<1e-9)',
    posWorst < EPS && angWorst < EPS,
    'pos ' + posWorst.toExponential(2) + ' ang ' + angWorst.toExponential(2));

  // and a spot-check at one explicit instant, fully hand-derived: the analytic EMF
  // equals −N·(∂Φ/∂X·vx + ∂Φ/∂Y·vy) — confirm the assembled emfLinear matches the
  // raw gradient·velocity contraction (no hidden hard-coded constant).
  const st = { X: 1.3, Y: 0.4, vx: 0.5, vy: -0.9, m0: SCENE.m0, phi: SCENE.phi };
  const { mx, my } = momentOf(st.m0, st.phi);
  const gr = fluxGrad(st.X, st.Y, mx, my, COIL);
  const hand = -SCENE.N * (gr.dPhidX*st.vx + gr.dPhidY*st.vy);
  check('(1b) emfLinear == −N·(∇Φ·v) assembled by hand (no hard-coded EMF)',
    Math.abs(emfLinear(st, COIL, SCENE.N) - hand) < 1e-12,
    '|Δ| ' + Math.abs(emfLinear(st, COIL, SCENE.N) - hand).toExponential(2));
}

// ── (2) peak EMF ∝ ω, re-proven over a wider grid ─────────────────────────────
{
  const worst = checkPeakLinearInOmega(SCENE.rig, COIL, SCENE.N);
  check('(2) peak EMF ∝ ω: peak(cω) = c·peak(ω) across c∈{2,3,4,5} (<1e-9)',
    worst < EPS, 'worst rel defect ' + worst.toExponential(2));

  // the geometry factor dΦ/dθ is genuinely ω-independent: emfAlternator scales
  // EXACTLY linearly in ω at a fixed angle (the operable surprise, proven exact).
  const th = 1.1;
  const e1 = emfAlternator(th, 0.4, SCENE.rig, COIL, SCENE.N);
  const e3 = emfAlternator(th, 1.2, SCENE.rig, COIL, SCENE.N);
  check('(2b) emfAlternator is exactly linear in ω at a fixed angle (geometry ⊥ rate)',
    Math.abs(e3 - 3*e1) < 1e-12, '|e(3ω)−3e(ω)| ' + Math.abs(e3 - 3*e1).toExponential(2));
}

// ── (3) closed round trip ⇒ ∮EMF dt = 0 ───────────────────────────────────────
{
  const loopInt = closedLoopEmfIntegral(SCENE.m0, SCENE.phi, COIL, SCENE.N);
  check('(3) closed round trip ⇒ ∮EMF dt = 0 (flux returns home, <1e-9)',
    loopInt < EPS, '|∮EMF dt| ' + loopInt.toExponential(2));
}

// ── (NEG-a) HOLD STILL / DC ⇒ EMF ≡ 0 to machine-ε at every frozen position ────
{
  let worstFrozen = 0, maxFlux = 0;
  for (let i = -25; i <= 25; i++){
    for (let j = -12; j <= 12; j++){
      const X = i/8, Y = j/8;
      if (Math.hypot(X - 0, Y - COIL.h/2) < 0.2) continue;
      if (Math.hypot(X - 0, Y + COIL.h/2) < 0.2) continue;
      const { mx, my } = momentOf(SCENE.m0, SCENE.phi);
      const frozen = emfLinear({ X, Y, vx: 0, vy: 0, m0: SCENE.m0, phi: SCENE.phi }, COIL, SCENE.N);
      worstFrozen = Math.max(worstFrozen, Math.abs(frozen));
      maxFlux = Math.max(maxFlux, Math.abs(SCENE.N * fluxThroughMouth(X, Y, mx, my, COIL)));
    }
  }
  check('(NEG-a) HOLD STILL: frozen magnet ⇒ EMF ≡ 0 (== 0 exactly) while Φ large',
    worstFrozen === 0 && maxFlux > 1.0,
    'max|EMF| ' + worstFrozen.toExponential(2) + ' max|Φ| ' + maxFlux.toFixed(1));
}

// ── (NEG-b) LENZ-OFF cheat ⇒ closed-loop hand-work flips sign (free energy) ────
{
  const w = closedLoopHandWork(SCENE.m0, SCENE.phi, COIL, SCENE.N, SCENE.R);
  check('(NEG-b) LENZ-OFF: closed-loop hand-work ≥0 (Lenz ON) but STRICTLY <0 (Lenz OFF)',
    w.on > 0 && w.off < 0, 'ON ∮ ' + w.on.toExponential(2) + ' OFF ∮ ' + w.off.toExponential(2));
  check('(NEG-b′) the two are exact negatives (Lenz ON+OFF = 0): conservation is the hinge',
    Math.abs(w.on + w.off) < EPS, '|ON+OFF| ' + Math.abs(w.on + w.off).toExponential(2));

  // the induced FORCE the UI reads is the REAL computed back-force, not a fudge:
  // Lenz ON opposes velocity, Lenz OFF aids it, magnitude = EMF²/(R·|v|).
  const st = { X: 0.8, Y: 0.3, vx: 0.6, vy: 0.2, m0: SCENE.m0, phi: SCENE.phi };
  const v = Math.hypot(st.vx, st.vy);
  const emf = emfLinear(st, COIL, SCENE.N);
  const expectMag = (emf*emf/SCENE.R) / v;
  const fOn = inducedForce(st, COIL, SCENE.N, SCENE.R, +1);
  const fOff = inducedForce(st, COIL, SCENE.N, SCENE.R, -1);
  const dotOn = fOn.fx*st.vx + fOn.fy*st.vy;     // <0: opposes
  const dotOff = fOff.fx*st.vx + fOff.fy*st.vy;  // >0: aids
  check('(NEG-b″) inducedForce is the REAL back-force |F|=EMF²/(R|v|), Lenz ON opposes / OFF aids',
    Math.abs(Math.hypot(fOn.fx, fOn.fy) - expectMag) < 1e-12 && dotOn < 0 && dotOff > 0,
    '|F| ' + Math.hypot(fOn.fx, fOn.fy).toExponential(2) + ' vs ' + expectMag.toExponential(2));
}

// ── (HERITAGE / ANTI-FORK) the portrait reuses iron-filings unforked ──────────
const here = dirname(fileURLToPath(import.meta.url));
{
  // ψ this core derives reproduces iron-filings' dipoleField EXACTLY: B = (∂ψ/∂y, −∂ψ/∂x).
  let worst = 0;
  for (const [mx, my] of [[0.6, 0.0], [0.3, 0.5], [-0.4, 0.2]]){
    for (const [px, py] of [[0.4, -0.7], [1.1, 0.3], [-0.6, 0.9]]){
      const e = 1e-6;
      const dpsidy = (streamPsi(px, py+e, mx, my) - streamPsi(px, py-e, mx, my)) / (2*e);
      const dpsidx = (streamPsi(px+e, py, mx, my) - streamPsi(px-e, py, mx, my)) / (2*e);
      const B = dipoleField(px, py, { mx, my });
      worst = Math.max(worst, Math.abs(dpsidy - B.bx), Math.abs(-dpsidx - B.by));
    }
  }
  check('(H) ψ reproduces iron-filings dipoleField exactly: B=(∂ψ/∂y,−∂ψ/∂x) (<1e-6 numeric)',
    worst < 1e-6, 'worst |Δ| ' + worst.toExponential(2));

  const ifsrc = readFileSync(join(here, '..', 'iron-filings', 'core.mjs'), 'utf8');
  const hasBegin = ifsrc.includes('// ===== IRON-FILINGS CORE');
  const hasEnd = ifsrc.includes('// ===== END IRON-FILINGS CORE =====');
  const exportsField = /export\s*\{[^}]*dipoleField/.test(ifsrc) && /export\s*\{[^}]*streamline/.test(ifsrc);
  // the exact dipole formula line is present, unchanged (the anti-fork sentinel of the field)
  const hasFormula = ifsrc.includes('(2*mdotr*rx - mag.mx)/r2') && ifsrc.includes('(2*mdotr*ry - mag.my)/r2');
  check('(H′) iron-filings/core.mjs bears its CORE sentinels, exports dipoleField+streamline, formula intact (anti-fork)',
    hasBegin && hasEnd && exportsField && hasFormula,
    'begin=' + hasBegin + ' end=' + hasEnd + ' export=' + exportsField + ' formula=' + hasFormula);
}

// ── BYTE-TWIN PARITY: the page's inlined LODESTONE-HALL CORE slab === core.mjs ─
{
  const BEGIN = '// === LODESTONE-HALL CORE BEGIN ===';
  const END = '// === LODESTONE-HALL CORE END ===';
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
  check('byte-parity: CORE sentinels present in core.mjs', !!coreRegion);
  check('byte-parity: index.html inlined core === core.mjs (indentation-normalised)',
    !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion),
    pageRegion ? ('chars ' + (pageRegion ? norm(pageRegion).length : 0) + ' vs ' + (coreRegion ? norm(coreRegion).length : 0)) : 'index.html not built yet (run forge)');
}

console.log('\nThe Lodestone Hall — core.test.mjs');
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
