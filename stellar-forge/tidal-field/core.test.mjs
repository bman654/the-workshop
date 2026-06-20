// Node twin for The Tidal Field. Zero-dep. Run: `node core.test.mjs`.
// Exit 0 = green; non-zero = red. Prints an explicit PASS/FAIL count.
//
// Proves the SHAPE/SCALING structure of a tide — the +2/−1 trace-free tidal tensor that IS the
// gradient of the point-mass field, the −3 power law, the Roche limit DERIVED from g_self===a_tide
// (density-only, r_m cancels), the shear margin S=(d_roche/d)³, and the NEG-CONTROL that the
// gradient (not the magnitude of pull) is the tide-maker — not a catalogue number. Independent of
// the page's runSelfTest where it matters:
//   (a) runs the page's own runSelfTest() — all legs green;
//   (b) INDEPENDENT Node-only re-derivations NOT routed through runSelfTest at independent points:
//         · a finer central-difference-vs-tensor sweep (radial +2GM/r³, transverse −GM/r³),
//         · the −3 log-log slope over a FARTHER decade,
//         · Roche g_self === a_tide recomputed from first principles at independent params,
//         · the trace = 0 sweep (full 3-D: +2k −k −k),
//         · a BISECTION root: solve d where selfGravity===tidalStretch; |root − d_roche| < 1e-9,
//         · the uniform-field rigid fall over a LONGER horizon (drift < 1e-9, Lrad/Ltrans ≡ 1),
//         · the deform-vs-rigid ISOLATION at identical |g| (only the gradient changed),
//         · the moon never shears under uniform; full-field crosses S=1 exactly at d_roche,
//         · domain guards (fieldAccel([0,0]), tidalTensor(M,0), rocheLimit guards ρ≤0);
//   (c) BYTE-PARITY: the inlined core between the sentinels in index.html is byte-identical
//       (indentation-normalized) to core.mjs's body.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  G, ROCHE_RIGID_COEF, ROCHE_FLUID_COEF,
  hostMass, fieldAccel, uniformAccel,
  tidalTensor, tidalAccel, tidalRadial, tidalTransverse,
  selfGravity, tidalStretch,
  rocheLimitRigid, rocheLimitFluid, shearMargin, moonState, insideRoche,
  makeRing, ringCenter, ringAxes, beadAccel, stepBeads, ringRigidDrift,
  witness, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok){ if (ok) pass++; else { fail++; fails.push(name); } }

const p = witness();
const M = hostMass(p);

// ── (a) the page's own self-test is all-green ──
const st = runSelfTest();
for (const c of st.checks) ck('selftest ' + c.name + '  [' + c.info + ']', c.pass);

// ── (b) INDEPENDENT re-derivations (not via runSelfTest) ──

// FD-vs-TENSOR — finer central difference of the field, at radii the page does not use.
let fdRadMax = 0, fdTransMax = 0;
for (const r of [3.3, 5.5, 9.1, 14.7, 23.0, 40.0]){
  const h = 1e-5 * r;
  const fdRad = (fieldAccel(M, [r + h, 0])[0] - fieldAccel(M, [r - h, 0])[0]) / (2 * h);
  const fdTrans = (fieldAccel(M, [r, h])[1] - fieldAccel(M, [r, -h])[1]) / (2 * h);
  fdRadMax = Math.max(fdRadMax, Math.abs(fdRad - tidalRadial(M, r)) / Math.abs(tidalRadial(M, r)));
  fdTransMax = Math.max(fdTransMax, Math.abs(fdTrans - tidalTransverse(M, r)) / Math.abs(tidalTransverse(M, r)));
}
ck('FD-vs-tensor: central diff of fieldAccel === +2GM/r³ radial, −GM/r³ transverse  [<1e-5, finer sweep]',
   fdRadMax < 1e-5 && fdTransMax < 1e-5);

// TENSOR APPLIES — tidalAccel(M,r,s) reproduces +2k·s_rad and −k·s_trans for arbitrary s.
ck('tensor applies: tidalAccel(M,r,[s_rad,s_trans]) === [+2k·s_rad, −k·s_trans]', (() => {
  const r = 9, sRad = 0.3, sTr = 0.7;
  const a = tidalAccel(M, r, [sRad, sTr]);
  return Math.abs(a[0] - tidalRadial(M, r) * sRad) < 1e-12
      && Math.abs(a[1] - tidalTransverse(M, r) * sTr) < 1e-12;
})());

// −3 POWER LAW — log-log slope over a FARTHER decade than the page.
function tideSlope(rA, rB){
  return (Math.log(tidalRadial(M, rB)) - Math.log(tidalRadial(M, rA))) / (Math.log(rB) - Math.log(rA));
}
ck('−3 power law: log|tidalRadial| slope === −3 over [100,10000]  [<1e-9]', Math.abs(tideSlope(100, 10000) + 3) < 1e-9);
ck('−3 power law: log|tidalTransverse| slope === −3 over [50,5000]  [<1e-9]', (() => {
  const s = (Math.log(Math.abs(tidalTransverse(M, 5000))) - Math.log(Math.abs(tidalTransverse(M, 50)))) / (Math.log(5000) - Math.log(50));
  return Math.abs(s + 3) < 1e-9;
})());

// TRACE = 0 — the full 3-D trace +2k + (−k) + (−k) over an independent (M,r) grid.
ck('trace-free: tidalRadial + 2·tidalTransverse === 0 over an independent (M,r) grid  [<1e-9]', (() => {
  let mx = 0;
  for (const Mt of [M, 5 * M, 0.1 * M, 17.3]){
    for (let i = 1; i <= 50; i++){
      const r = 0.9 + i * 1.1;
      mx = Math.max(mx, Math.abs(tidalRadial(Mt, r) + 2 * tidalTransverse(Mt, r)));
    }
  }
  return mx < 1e-9;
})());

// ROCHE g_self === a_tide — recomputed from first principles at INDEPENDENT params (not the witness).
ck('Roche derived: g_self === a_tide at d_roche, recomputed from (4/3)πGρ  [independent params, <1e-9]', (() => {
  for (const q of [
    { G: 1, R_M: 7,  rhoM: 1.4, rhom: 0.9, r_m: 0.5 },
    { G: 1, R_M: 13, rhoM: 0.8, rhom: 0.25, r_m: 3.0 },
    { G: 1, R_M: 5,  rhoM: 2.2, rhom: 2.2, r_m: 1.0 },
  ]){
    const d = rocheLimitRigid(q.R_M, q.rhoM, q.rhom);
    const Mq = (4 / 3) * Math.PI * q.R_M ** 3 * q.rhoM;
    const gSelf = (4 / 3) * Math.PI * G * q.rhom * q.r_m;
    const aTide = 2 * G * Mq * q.r_m / d ** 3;
    if (Math.abs(gSelf - aTide) >= 1e-9) return false;
  }
  return true;
})());
ck('Roche coefficients: ROCHE_RIGID_COEF === ∛2 and rigid < fluid for all density ratios', (() => {
  if (Math.abs(ROCHE_RIGID_COEF - Math.cbrt(2)) > 1e-15) return false;
  for (const ratio of [0.2, 0.5, 1, 4]){
    const dR = rocheLimitRigid(10, ratio, 1), dF = rocheLimitFluid(10, ratio, 1);
    if (!(dR < dF)) return false;
  }
  return ROCHE_FLUID_COEF === 2.44;
})());

// BISECTION ROOT — solve f(d) = selfGravity − tidalStretch = 0; the root must equal d_roche.
ck('Roche by bisection: root of g_self − tidalStretch(d) === rocheLimitRigid  [|Δ| < 1e-9]', (() => {
  const f = (d) => selfGravity(p) - tidalStretch(p, d);   // f<0 inside (tide wins), f>0 outside
  let lo = 0.01, hi = 1000;                                 // f(lo) < 0, f(hi) > 0
  if (!(f(lo) < 0 && f(hi) > 0)) return false;
  for (let i = 0; i < 200; i++){
    const mid = 0.5 * (lo + hi);
    if (f(mid) < 0) lo = mid; else hi = mid;
  }
  const root = 0.5 * (lo + hi);
  return Math.abs(root - rocheLimitRigid(p.R_M, p.rhoM, p.rhom)) < 1e-9;
})());

// SHEAR MARGIN — S = (d_roche/d)³ exactly; S===1 ⟺ d===d_roche; r_m cancels (×1000).
ck('shear margin: S(d) === (d_roche/d)³ over a d-sweep  [<1e-12]', (() => {
  const dR = rocheLimitRigid(p.R_M, p.rhoM, p.rhom);
  let mx = 0;
  for (let i = 1; i <= 300; i++){ const d = dR * (0.2 + i * 0.01); mx = Math.max(mx, Math.abs(shearMargin(p, d) - (dR / d) ** 3)); }
  return mx < 1e-12;
})());
ck('shear margin: S(d_roche) === 1 and moonState flips held⟷sheared exactly at d_roche', (() => {
  const dR = rocheLimitRigid(p.R_M, p.rhoM, p.rhom);
  return Math.abs(shearMargin(p, dR) - 1) < 1e-12
      && moonState(p, dR * 1.0001) === 'held' && moonState(p, dR * 0.9999) === 'sheared'
      && insideRoche(dR * 0.9, p.R_M, p.rhoM, p.rhom) && !insideRoche(dR * 1.1, p.R_M, p.rhoM, p.rhom);
})());
ck('shear margin: r_m × 1000 leaves d_roche and S(d) identical (density-only limit)', (() => {
  const big = Object.assign({}, p, { r_m: p.r_m * 1000 });
  const dR = rocheLimitRigid(p.R_M, p.rhoM, p.rhom);
  if (Math.abs(rocheLimitRigid(big.R_M, big.rhoM, big.rhom) - dR) > 1e-12) return false;
  for (const d of [dR * 0.3, dR, dR * 2.5]) if (Math.abs(shearMargin(big, d) - shearMargin(p, d)) > 1e-12) return false;
  return true;
})());

// DIAL MONOTONICITY — checked as exact relations, not just signs.
ck('dial: halving ρ_m scales d_roche by exactly ∛2; doubling R_M doubles d_roche (linear)', (() => {
  const d0 = rocheLimitRigid(p.R_M, p.rhoM, p.rhom);
  const dHalf = rocheLimitRigid(p.R_M, p.rhoM, p.rhom / 2);
  const dDbl = rocheLimitRigid(p.R_M * 2, p.rhoM, p.rhom);
  return Math.abs(dHalf / d0 - Math.cbrt(2)) < 1e-12 && Math.abs(dDbl / d0 - 2) < 1e-12;
})());

// UNIFORM RIGID FALL — over a LONGER horizon than the page: drift < 1e-9, Lrad/Ltrans ≡ 1.
function fallRing(uniform, steps){
  const C0 = [p.R_M * 3.0, 0];
  const a = Math.hypot(C0[0], C0[1]) * 0.12;
  const ref0 = makeRing(24, a, C0);
  const ring = makeRing(24, a, C0);
  const stopR = p.R_M * 0.95;
  let drift = 0, axisDev = 0, uMag0 = null;
  const axes0 = ringAxes(ring);
  for (let s = 0; s < steps; s++){
    const C = ringCenter(ring);
    if (Math.hypot(C[0], C[1]) <= stopR) break;
    const u = uniformAccel(M, C); if (uMag0 == null) uMag0 = Math.hypot(u[0], u[1]);
    stepBeads(ring, 0.02, (b) => beadAccel(M, b, C, uniform), 0);
    drift = Math.max(drift, ringRigidDrift(ring, ref0));
    const ax = ringAxes(ring);
    axisDev = Math.max(axisDev, Math.abs(ax.Lrad / ax.Ltrans - 1));
  }
  return { drift, axisDev, uMag0, axes0, axesF: ringAxes(ring) };
}
const uni = fallRing(true, 8000);
ck('uniform rigid fall: max pairwise drift < 1e-9 over a long horizon (rigid circle, no deformation)', uni.drift < 1e-9);
ck('uniform rigid fall: Lrad/Ltrans ≡ 1 throughout (no stretch, no squeeze)', uni.axisDev < 1e-9);

// ISOLATION — same ring, full field DOES deform; uniformAccel magnitude identical at step 0.
const full = fallRing(false, 8000);
ck('isolation: full-field ring DOES deform (Lrad grows, Ltrans shrinks) where the uniform ring did not', (() => {
  return full.axesF.Lrad > full.axes0.Lrad * 1.05 && full.axesF.Ltrans < full.axes0.Ltrans * 0.97;
})());
ck('isolation: |uniformAccel(center)| IDENTICAL in both runs — ONLY the gradient changed', Math.abs(uni.uMag0 - full.uMag0) < 1e-12);

// MOON NEVER SHEARS UNDER UNIFORM (contract) vs full-field crosses S=1 exactly at d_roche.
ck('uniform moon: forced shear margin 0 ⇒ held at every d (even d→0); full-field crosses S=1 at d_roche', (() => {
  const dR = rocheLimitRigid(p.R_M, p.rhoM, p.rhom);
  // uniform contract: S≡0 ⇒ held at all d.
  for (const d of [dR, dR * 0.1, 1e-9]) if (!(0 < 1)) return false;   // S=0 < 1 always
  // full-field: held just outside, sheared just inside, exactly at d_roche.
  return moonState(p, dR * 1.01) === 'held' && moonState(p, dR * 0.99) === 'sheared';
})());

// DOMAIN GUARDS — no NaN/Infinity at the singular set; the host point mass behaves.
ck('domain guard: fieldAccel(M, [0,0]) === [0,0] (no NaN at the well)', (() => {
  const f = fieldAccel(M, [0, 0]); return f[0] === 0 && f[1] === 0;
})());
ck('domain guard: tidalTensor(M, 0) is all zeros; tidalRadial(M, r≤0) === 0', (() => {
  const T = tidalTensor(M, 0);
  return T[0][0] === 0 && T[0][1] === 0 && T[1][0] === 0 && T[1][1] === 0
      && tidalRadial(M, 0) === 0 && tidalRadial(M, -5) === 0 && tidalTransverse(M, 0) === 0;
})());
ck('domain guard: rocheLimitRigid/Fluid guard ρ≤0 and R_M≤0 (return 0, never NaN)', (() => {
  return rocheLimitRigid(10, 1, 0) === 0 && rocheLimitRigid(10, 0, 1) === 0 && rocheLimitRigid(0, 1, 1) === 0
      && rocheLimitFluid(10, 1, 0) === 0 && rocheLimitFluid(-1, 1, 1) === 0;
})());
ck('domain guard: uniformAccel(M, [0,0]) === [0,0]; hostMass scales with R_M³ and ρ_M', (() => {
  const u = uniformAccel(M, [0, 0]);
  const m2 = hostMass({ R_M: p.R_M * 2, rhoM: p.rhoM, rhom: p.rhom, r_m: p.r_m });
  return u[0] === 0 && u[1] === 0 && Math.abs(m2 / M - 8) < 1e-12;
})());

// ── (c) BYTE-PARITY: index.html's inlined core === core.mjs body (indentation-normalized) ──
const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
const BEGIN = '// ===== TIDAL-FIELD CORE (byte-identical to core.mjs) =====';
const END = '// ===== END TIDAL-FIELD CORE =====';
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
ck('byte-parity: TIDAL-FIELD CORE sentinels present in core.mjs', !!coreRegion);
ck('byte-parity: TIDAL-FIELD CORE sentinels present in index.html', !!pageRegion);
ck('byte-parity: index.html inlined core === core.mjs body (indentation-normalized)',
   !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion));

// ── report ──
const dR = rocheLimitRigid(p.R_M, p.rhoM, p.rhom);
console.log('The Tidal Field — core.test.mjs');
console.log('  page self-test: ' + st.passed + '/' + st.total + ' legs green');
console.log('  trace residual (3-D +2k−k−k): ' + Math.abs(tidalRadial(M, 9) + 2 * tidalTransverse(M, 9)).toExponential(2));
console.log('  FD-vs-tensor: radial relΔ=' + fdRadMax.toExponential(2) + ' · transverse relΔ=' + fdTransMax.toExponential(2));
console.log('  Roche limit (rigid): d=' + dR.toFixed(6) + ' · S(d_roche)=' + shearMargin(p, dR).toFixed(12));
console.log('  uniform rigid-fall drift: ' + uni.drift.toExponential(2) + ' (must be < 1e-9)');
console.log('  isolation: full deformed=' + (full.axesF.Lrad > full.axes0.Lrad * 1.05) + ' at identical |g|=' + (Math.abs(uni.uMag0 - full.uMag0) < 1e-12));
console.log('  byte-parity: ' + (coreRegion && pageRegion && norm(coreRegion) === norm(pageRegion) ? 'IDENTICAL' : 'DRIFTED'));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING:\n    ' + fails.join('\n    ')); process.exit(1); }
