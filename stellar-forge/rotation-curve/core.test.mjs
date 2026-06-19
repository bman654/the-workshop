// Node twin for The Rotation Bench. Zero-dep. Run: `node core.test.mjs`.
// Exit 0 = green; non-zero = red. Prints an explicit PASS/FAIL count.
//
// Proves the SHAPE/SCALING structure of a galaxy's rotation curve — v=√(GM/r), a Keplerian
// −½ tail from visible mass, a flat tail from an isothermal halo, and the THEOREM that the
// luminous knob alone can never reach the flat tail — not a catalogue number. Independent of
// the page's runSelfTest where it matters:
//   (a) runs the page's own runSelfTest() — all legs green;
//   (b) INDEPENDENT Node-only re-derivations NOT routed through runSelfTest:
//         · the v²·r === G·M(<r) identity swept across r (the orbit law),
//         · the visible-only log-log slope = −½ to <1e-9 over an even farther decade,
//         · isothermal M(<r) ∝ r and v flat (both directions) — independent radii,
//         · the witness fits all 8 pins within σ; the SAME table drives the neg-control sweep,
//         · the catch-as-theorem: full Mdisk sweep with ρ0≡0 never reaches the outer pins,
//         · the ρ0=0 ⇒ vTotal===vVisible EXACT neg-control + the flat-by-hand v²r=GM guard,
//         · the winding bound ω_vis ratio < ω_halo ratio at independent radii,
//         · domain guards: vCirc(Menc, r≤0)===0; MhaloEnc(.,ρ0=0)===0 exactly;
//   (c) BYTE-PARITY: the inlined core between the sentinels in index.html is byte-identical
//       (indentation-normalized) to core.mjs's body.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  G, RD, MDISK_MAX, RHO0_MAX,
  MdiskEnc, MbulgeEnc, MvisEnc, MhaloEnc,
  vCirc, vVisible, vTotal, vDisk, omega, omegaVis, omegaTotal, omegaDisk,
  observedPins, witness, killHalo, maxResidual, resolved,
  bestVisibleOnlyOuterResidual, fakeFlatByHand, impliedMassFromV,
  runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok){ if (ok) pass++; else { fail++; fails.push(name); } }

const p = witness();
const pVis = killHalo(p);

// ── (a) the page's own self-test is all-green ──
const st = runSelfTest();
for (const c of st.checks) ck('selftest ' + c.name + '  [' + c.info + ']', c.pass);

// ── (b) INDEPENDENT re-derivations (not via runSelfTest) ──

// THE ORBIT LAW — v²·r === G·M(<r), swept finely across r and across BOTH curves.
ck('orbit law: vTotal(r)²·r === G·(Mvis+Mhalo)(<r) for all r  [machine-ε]', (() => {
  let maxAbs = 0;
  for (let i = 1; i <= 500; i++){
    const r = i * 0.1;
    const M = MvisEnc(r, p) + MhaloEnc(r, p);
    maxAbs = Math.max(maxAbs, Math.abs(vTotal(r, p) ** 2 * r - G * M));
  }
  return maxAbs < 1e-12;
})());
ck('orbit law: vVisible(r)²·r === G·Mvis(<r) for all r (halo off)', (() => {
  let maxAbs = 0;
  for (let i = 1; i <= 500; i++){
    const r = i * 0.1;
    maxAbs = Math.max(maxAbs, Math.abs(vVisible(r, pVis) ** 2 * r - G * MvisEnc(r, pVis)));
  }
  return maxAbs < 1e-12;
})());

// KEPLERIAN TAIL — disk-only log-log slope = −½ to <1e-9 on an even farther decade than the page.
// (The disk is the clean carrier: MdiskEnc → Mdisk exactly once (1+x)e^−x underflows, so the
// curve is √(1/r) to machine ε. The bulge's O(1/r) approach is reported separately, loosely.)
function diskSlope(rA, rB){
  const vA = vDisk(rA, pVis), vB = vDisk(rB, pVis);
  return (Math.log(vB) - Math.log(vA)) / (Math.log(rB) - Math.log(rA));
}
ck('Keplerian tail: disk-only log-log slope === −0.5 over [200,2000]Rd  [<1e-9]',
   Math.abs(diskSlope(200, 2000) + 0.5) < 1e-9);
ck('Keplerian tail: disk-only log-log slope === −0.5 over [500,5000]Rd  [<1e-9]',
   Math.abs(diskSlope(500, 5000) + 0.5) < 1e-9);
ck('Keplerian tail: disk-only v·√r is constant to <1e-9 once disk saturates  [far decade]', (() => {
  let maxRel = 0; const ref = vDisk(300, pVis) * Math.sqrt(300);
  for (const r of [200, 300, 600, 1200, 2400]){
    const c = vDisk(r, pVis) * Math.sqrt(r);
    maxRel = Math.max(maxRel, Math.abs(c - ref) / ref);
  }
  return maxRel < 1e-9;
})());
ck('Keplerian tail: the FULL visible curve (disk+bulge) also droops toward Kepler  [slope < −0.45]',
   ((Math.log(vVisible(200, pVis)) - Math.log(vVisible(20, pVis))) / (Math.log(200) - Math.log(20))) < -0.45);
// the visible disk mass is BOUNDED — the geometric reason the tail can't be lifted off Kepler.
ck('disk mass is bounded: MdiskEnc(r) → Mdisk as r → ∞ (the catch is geometric)', (() => {
  return Math.abs(MdiskEnc(1e6, p) - p.Mdisk) < 1e-6 && MdiskEnc(1e9, p) <= p.Mdisk;
})());

// HALO FLAT — isothermal M(<r) ∝ r and v flat, BOTH directions, at independent radii.
const pHalo = { rho0: p.rho0, rc: p.rc, Mdisk: 0, Rd: RD, Mbulge: 0, ab: 1 };
const vAsym = Math.sqrt(4 * Math.PI * p.rho0 * p.rc * p.rc);
ck('halo flat: v(isothermal halo alone) → const  [vAsym=' + vAsym.toFixed(4) + ', <1e-3 over [3000,30000]Rd]', (() => {
  let maxRel = 0;
  for (const r of [3000, 6000, 12000, 24000, 30000]){
    const v = vCirc(MhaloEnc(r, pHalo), r);
    maxRel = Math.max(maxRel, Math.abs(v - vAsym) / vAsym);
  }
  return maxRel < 1e-3;
})());
ck('halo flat (other direction): M(<r)/r → 4π·ρ0·rc² (M ∝ r ⟺ v flat)', (() => {
  const asym = 4 * Math.PI * p.rho0 * p.rc * p.rc;
  let maxRel = 0;
  for (const r of [3000, 12000, 30000]){
    maxRel = Math.max(maxRel, Math.abs(MhaloEnc(r, pHalo) / r - asym) / asym);
  }
  return maxRel < 1e-3;
})());

// DATA REACHABLE + the SAME table drives the neg-control — legs 4 & 5 are mutually consistent.
ck('data reachable: witness fits all 8 pins within σ ⇒ resolved()===true  [worst=' + maxResidual(p).toFixed(3) + 'σ]', (() => {
  for (const pin of observedPins()) if (Math.abs(vTotal(pin.r, p) - pin.vObs) >= pin.sigma) return false;
  return resolved(p) === true;
})());

// THE CATCH AS THEOREM — full Mdisk sweep with ρ0≡0 never reaches the outer (flat) pins.
const bestOuter = bestVisibleOnlyOuterResidual(p, 1200);
ck('catch theorem: min over full Mdisk band (ρ0≡0) of worst-outer residual > σ  [' + bestOuter.toFixed(3) + 'σ]',
   bestOuter > 1);
// a SHARPER independent sweep: even with the disk pinned to fit ONE outer pin, the others miss.
ck('catch theorem (sharper): no single Mdisk makes ALL outer pins fit with ρ0≡0', (() => {
  const outer = observedPins().filter(pin => pin.r >= 5.0);
  for (let i = 0; i <= 2000; i++){
    const Mdisk = MDISK_MAX * (i / 2000);
    const q = Object.assign({}, p, { Mdisk, rho0: 0 });
    let allFit = true;
    for (const pin of outer) if (Math.abs(vVisible(pin.r, q) - pin.vObs) >= pin.sigma) allFit = false;
    if (allFit) return false;   // found one that fits all outer pins — theorem would be false
  }
  return true;
})());

// NEG-CONTROL — ρ0=0 ⇒ vTotal === vVisible EXACTLY (===, not <ε), swept across r.
ck('neg-control: ρ0=0 ⇒ vTotal(r) === vVisible(r) EXACTLY for all r  [===]', (() => {
  for (let i = 1; i <= 300; i++){ const r = i * 0.2; if (vTotal(r, pVis) !== vVisible(r, pVis)) return false; }
  return true;
})());
ck('neg-control: ρ0=0 ⇒ MhaloEnc === 0 exactly for all r  [===0]', (() => {
  for (let i = 1; i <= 300; i++){ const r = i * 0.3; if (MhaloEnc(r, pVis) !== 0) return false; }
  return true;
})());
ck('neg-control: ρ0=0 ⇒ resolved()===false (the latch is dead without the halo)', resolved(pVis) === false);
ck('neg-control: ρ0=0 ⇒ the Keplerian tail returns on vTotal (droops below −0.45; disk part is exactly −½)',
   ((Math.log(vTotal(500, pVis)) - Math.log(vTotal(50, pVis))) / (Math.log(500) - Math.log(50))) < -0.45
   && Math.abs(diskSlope(50, 500) + 0.5) < 1e-9);

// FLAT-BY-HAND GUARD — a clamp-to-constant fails v²r=GM and disagrees with the real curve.
ck('flat-by-hand: clamping v to a constant fails v²r=GM (implied mass is a LINE, not real M(<r))', (() => {
  const vFlat = 1.71;
  for (const r of [6, 10, 16]){
    const implied = impliedMassFromV(fakeFlatByHand(r, vFlat), r);   // vFlat²·r — a straight line
    const real = MvisEnc(r, pVis);
    if (Math.abs(implied - real) <= 1e-6) return false;             // must DISAGREE → caught
  }
  return true;
})());
ck('flat-by-hand: hand-painted flatness disagrees with the honest visible curve at the outer radii', (() => {
  const vFlat = 1.71;
  for (const r of [8, 12, 18]) if (Math.abs(fakeFlatByHand(r, vFlat) - vVisible(r, pVis)) <= 1e-6) return false;
  return true;
})());

// WINDING BOUND — ω_vis ratio < ω_halo ratio at independent radii (the smearing is certified).
ck('winding bound: ω_vis(out)/ω_vis(in) < ω_halo(out)/ω_halo(in)  [rIn=3, rOut=15]', (() => {
  const rIn = 3.0, rOut = 15.0;
  return (omegaVis(rOut, pVis) / omegaVis(rIn, pVis)) < (omegaTotal(rOut, p) / omegaTotal(rIn, p));
})());
ck('winding bound: disk-only ω falls as Keplerian ω ∝ r^−3/2 past saturation  [<1e-9]', (() => {
  // ω_disk(r) = vDisk/r ∝ r^−1/2 / r = r^−3/2 once the disk has saturated (exact, machine-ε).
  const slope = (Math.log(omegaDisk(2000, pVis)) - Math.log(omegaDisk(200, pVis))) / (Math.log(2000) - Math.log(200));
  return Math.abs(slope + 1.5) < 1e-9;
})());

// DOMAIN GUARDS — no NaN/Infinity at the singular radius; the halo vanishes exactly when killed.
ck('domain guard: vCirc(Menc, 0) === 0 (no circular orbit at r=0, never NaN)', vCirc(5, 0) === 0);
ck('domain guard: vCirc(Menc, -1) === 0 (negative radius guarded)', vCirc(5, -1) === 0);
ck('domain guard: omega(0,...) === 0 (no singularity at the centre)', omegaVis(0, p) === 0);
ck('sanity: MDISK_MAX and RHO0_MAX are the declared bands and witness is inside them',
   p.Mdisk <= MDISK_MAX && p.Mdisk > 0 && p.rho0 <= RHO0_MAX && p.rho0 > 0);

// ── (c) BYTE-PARITY: index.html's inlined core === core.mjs body (indentation-normalized) ──
const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
const BEGIN = '// ===== ROTATION-CURVE CORE (byte-identical to core.mjs) =====';
const END = '// ===== END ROTATION-CURVE CORE =====';
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
ck('byte-parity: ROTATION-CURVE CORE sentinels present in core.mjs', !!coreRegion);
ck('byte-parity: ROTATION-CURVE CORE sentinels present in index.html', !!pageRegion);
ck('byte-parity: index.html inlined core === core.mjs body (indentation-normalized)',
   !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion));

// ── report ──
console.log('The Rotation Bench — core.test.mjs');
console.log('  page self-test: ' + st.passed + '/' + st.total + ' legs green');
console.log('  witness worst residual: ' + maxResidual(p).toFixed(3) + 'σ (resolved=' + resolved(p) + ')');
console.log('  knob-alone best outer residual: ' + bestOuter.toFixed(3) + 'σ (must be > 1)');
console.log('  byte-parity: ' + (coreRegion && pageRegion && norm(coreRegion) === norm(pageRegion) ? 'IDENTICAL' : 'DRIFTED'));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING:\n    ' + fails.join('\n    ')); process.exit(1); }
