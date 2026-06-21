// Node twin for The Breathing Star. Zero-dep. Run: `node core.test.mjs`.
// Exit 0 = green; non-zero = red. Prints an explicit PASS/FAIL count.
//
// Proves the polytrope-in-a-spring's claims, INDEPENDENTLY of the page's in-page pill where it
// matters:
//   (a) runs the core's own runBreathingStarSelfTest() — all five legs green;
//   (b) INDEPENDENT Node-only re-derivations NOT routed through the self-test:
//         · FD-vs-FORCE — a finite-difference of the gravitational potential + internal energy
//           recovers the analytic net force on an INDEPENDENT interface at the equilibrium (the
//           balance is a genuine extremum of the total energy, not just a hand-coded zero);
//         · an INDEPENDENT energy-minimum check — perturbing the equilibrium up OR down RAISES the
//           total energy (it sits in a well, the signature of a STABLE balance);
//         · MONOTONE-K reproduced on a FINER K grid than the page's;
//         · the SCALING LAW — for a γ=5/3 polytrope the equilibrium radius scales as R ∝ K^(3/(3γ−4))
//           = K^(3/1) ... checked against the measured R(K) ratios (the dial obeys the right power law);
//         · COLLAPSE-FLOOR reproduced — pressure off ⇒ the inner interface ends pinned at R_FLOOR;
//         · NO-CROSS guard — a hard squeeze never lets an interface pass the one inside it;
//         · determinism — the canonical start relaxes to the SAME equilibrium twice (bit-identical);
//   (c) BYTE-PARITY: the inlined core between the sentinels in index.html is byte-identical
//       (indentation-normalized) to core.mjs's body.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  N, G, GAMMA, DM, K0, R_FLOOR, R_SEP, BEAT_DT, TOL_BALANCE,
  initR, enclosedMass, shellRho, shellP, netAccel, integrate,
  relax, maxAbsAccel, makeStar,
  eqRadius, outerRadius, stepShells, setOuterDisplacement, release, setFusion,
  cutPressure, ringAmplitude,
  runBreathingStarSelfTest,
} from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok){ if (ok) pass++; else { fail++; fails.push(name); } }

// ── (a) the core's own self-test is all-green ──
const st = runBreathingStarSelfTest();
for (const c of st.checks) ck('selftest ' + c.name + '  [' + c.info + ']', c.pass);

// ── (b) INDEPENDENT re-derivations (not via the self-test) ──

// TOTAL ENERGY of a configuration: gravitational + internal (polytropic). This is an INDEPENDENT
// quantity from netAccel — the force should be (minus) its gradient, and the equilibrium should
// minimise it. Gravitational PE of the Lagrangian shells: Σ −G·M_enc(i)·dm/r[i] (each interface
// mass dm in the potential of the mass interior to it). Internal energy of a polytrope:
// U_int = Σ (P_i·V_i)/(γ−1) = Σ K·ρ_i^γ·V_i/(γ−1) per cell.
function totalEnergy(r, K){
  let Eg = 0, Ui = 0;
  for (let i = 0; i < N; i++){
    const ri = r[i] < R_FLOOR ? R_FLOOR : r[i];
    Eg += -G * enclosedMass(i) * DM / ri;
    const rOut = ri, rIn = i === 0 ? 0 : r[i - 1];
    const V = (4 / 3) * Math.PI * (rOut * rOut * rOut - rIn * rIn * rIn);
    const P = shellP(r, i, K);
    Ui += (P * V) / (GAMMA - 1);
  }
  return Eg + Ui;
}

// ENERGY-MINIMUM — perturb the equilibrium of EACH interface up and down: the total energy rises
// both ways (a strict local minimum ⇒ a STABLE balance). Independent of the force code entirely.
ck('energy well: perturbing the equilibrium up OR down strictly raises total energy (stable minimum)', (() => {
  const star = makeStar(K0);
  const eq = star.eq;
  const E0 = totalEnergy(eq, star.K);
  const h = 1e-4;
  for (const i of [2, 5, 8, 11]){            // a spread of independent interfaces
    const up = eq.slice(); up[i] += h;
    const dn = eq.slice(); dn[i] -= h;
    // keep ordering valid for the down-perturbation
    if (i > 0 && dn[i] <= dn[i - 1]) dn[i] = dn[i - 1] + R_SEP;
    if (!(totalEnergy(up, star.K) > E0) || !(totalEnergy(dn, star.K) > E0)) return false;
  }
  return true;
})());

// FD-vs-FORCE — the net force on an interface is (minus) the energy gradient w.r.t. its radius,
// scaled by the interface mass dm. At equilibrium both are ≈0; we check the IDENTITY at a SLIGHTLY
// PERTURBED config (so neither side is trivially zero) at an INDEPENDENT interface.
ck('FD-vs-force: −dE/dr[i] / dm === netAccel(i) at a perturbed config  [<2e-3 rel]', (() => {
  const star = makeStar(K0);
  const r = star.eq.slice();
  r[7] *= 1.03;            // perturb interface 7 outward 3% (force now non-zero there)
  // re-establish ordering just in case
  for (let i = 1; i < N; i++) if (r[i] < r[i - 1] + R_SEP) r[i] = r[i - 1] + R_SEP;
  let worst = 0;
  for (const i of [3, 6, 9]){
    const h = 1e-6;
    const up = r.slice(); up[i] += h;
    const dn = r.slice(); dn[i] -= h;
    const dEdr = (totalEnergy(up, star.K) - totalEnergy(dn, star.K)) / (2 * h);
    const aFD = -dEdr / DM;            // force per unit interface mass = −(1/dm)·dE/dr
    const aAnalytic = netAccel(r, i, star.K, true);
    const rel = Math.abs(aFD - aAnalytic) / (Math.abs(aAnalytic) + 1e-6);
    if (rel > worst) worst = rel;
  }
  return worst < 2e-3;
})());

// MONOTONE-K on a FINER grid than the page — 40 K values, R strictly increasing throughout.
ck('monotone-K (fine grid): R(K) strictly increases over 40 K values in [0.05, 4]', (() => {
  let prev = -1, ok = true;
  for (let j = 0; j <= 40; j++){
    const K = 0.05 + (j / 40) * (4 - 0.05);
    const R = eqRadius(makeStar(K));
    if (!(R > prev)) ok = false;
    prev = R;
  }
  return ok;
})());

// SCALING LAW — the n = 3/2 polytrope mass-radius relation. The standard polytrope result is
// R ∝ K^(n/(3−n)) at fixed mass, with the polytropic index n = 1/(γ−1). For γ = 5/3, n = 3/2, so
// n/(3−n) = (3/2)/(3/2) = 1 ⇒ R ∝ K^1 EXACTLY. We verify it in the well-resolved regime (K ≤ 0.8,
// where the finite-N surface is many shells thick): R/K is CONSTANT to a tight tolerance — the fuel
// dial obeys the textbook power law, not an ad-hoc curve. (At high K the finite shell count under-
// resolves the puffed-up surface and the discrete relation softens away from K^1; that is a
// resolution artifact of N = 12, not a claim, so the scaling leg stays in the resolved band.)
const scaling = (() => {
  const Ks = [0.1, 0.2, 0.4, 0.8];
  const ratios = Ks.map(k => eqRadius(makeStar(k)) / k);    // R/K — constant iff R ∝ K
  const mean = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  let maxDev = 0;
  for (const r of ratios) maxDev = Math.max(maxDev, Math.abs(r - mean) / mean);
  return { ratios, mean, maxDev };
})();
ck('scaling law: R ∝ K^1 (the n=3/2 polytrope law) — R/K constant to <1% over K∈[0.1,0.8]',
   scaling.maxDev < 0.01);

// COLLAPSE-FLOOR reproduced INDEPENDENTLY — pressure off, integrate, the inner interface pins at the
// floor and every interface ends strictly inside where it began.
ck('collapse floor: pressure off ⇒ inner interface ends at R_FLOOR and all fell', (() => {
  const star = makeStar(K0);
  const before = star.r.slice();
  cutPressure(star);
  for (let s = 0; s < 4000; s++) stepShells(star, BEAT_DT);
  const innerAtFloor = star.r[0] <= R_FLOOR + R_SEP * 2;
  const allFell = star.r.every((ri, i) => ri < before[i]);
  return innerAtFloor && allFell;
})());

// NO-CROSS guard — a hard squeeze (90% in) then a few steps never lets an interface cross the one
// inside it; the order is strictly preserved and nothing is non-finite.
ck('no-cross: a hard squeeze keeps interfaces strictly ordered and finite', (() => {
  const star = makeStar(K0);
  setOuterDisplacement(star, 0.85);          // squeeze 85% in (a hard grab)
  for (let s = 0; s < 800; s++) stepShells(star, BEAT_DT);
  for (let i = 0; i < N; i++) if (!Number.isFinite(star.r[i])) return false;
  for (let i = 1; i < N; i++) if (!(star.r[i] >= star.r[i - 1] + R_SEP - 1e-12)) return false;
  return star.r[0] >= R_FLOOR - 1e-12;
})());

// DETERMINISM — the canonical start relaxes to the SAME equilibrium twice (bit-for-bit). This is the
// HONEST determinism claim: a fixed deterministic function, NOT start-independent uniqueness.
ck('determinism: relax(K) from the canonical start is bit-identical across two calls', (() => {
  const a = relax(0.42), b = relax(0.42);
  for (let i = 0; i < N; i++) if (a[i] !== b[i]) return false;
  return true;
})());

// BALANCE residual is genuinely tiny at an INDEPENDENT K (not just the default).
ck('balance (independent K): max|net accel| at the relaxed eq for K=1.1 is < TOL_BALANCE', (() => {
  const star = makeStar(1.1);
  return maxAbsAccel(star.eq, star.K, true) < TOL_BALANCE;
})());

// ── (c) BYTE-PARITY: index.html's inlined core === core.mjs body (indentation-normalized) ──
const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
const BEGIN = '// ===== BREATHING-STAR CORE (byte-identical to core.mjs) =====';
const END = '// ===== END BREATHING-STAR CORE =====';
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
ck('byte-parity: BREATHING-STAR CORE sentinels present in core.mjs', !!coreRegion);
ck('byte-parity: BREATHING-STAR CORE sentinels present in index.html', !!pageRegion);
ck('byte-parity: index.html inlined core === core.mjs body (indentation-normalized)',
   !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion));

// ── report ──
const star = makeStar(K0);
console.log('The Breathing Star — core.test.mjs');
console.log('  core self-test: ' + st.passed + '/' + st.total + ' legs green');
console.log('  equilibrium radius (K=' + K0 + '): R = ' + eqRadius(star).toFixed(4) +
            ' · balance residual = ' + maxAbsAccel(star.eq, star.K, true).toExponential(2));
console.log('  fuel dial R(K): K=0.2→' + eqRadius(makeStar(0.2)).toFixed(3) +
            '  K=0.8→' + eqRadius(makeStar(0.8)).toFixed(3) +
            '  K=3.0→' + eqRadius(makeStar(3.0)).toFixed(3) +
            '  (R∝K: R/K = ' + scaling.mean.toFixed(4) + ' ± ' + (scaling.maxDev * 100).toFixed(3) + '%)');
console.log('  byte-parity: ' + (coreRegion && pageRegion && norm(coreRegion) === norm(pageRegion) ? 'IDENTICAL' : 'DRIFTED'));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING:\n    ' + fails.join('\n    ')); process.exit(1); }
