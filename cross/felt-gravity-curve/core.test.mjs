// Node twin for The Felt-Gravity Curve core. Zero-dep. Run: `node cross/felt-gravity-curve/core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html, so the page's gold self-test
// pill and this twin can never drift. It re-proves the legs the in-page pill proves, PLUS the byte-twin
// parity + adapter-disjointness leg (Leg 7), reading both foreign cores at the SAME two ../ hops the page does.
//
//   1.  UNION — flyerPoint(ω).thetaDeg === atan(ω²R/g)·180/π === tiltDeg to <1e-9 (worst ~2.0e-11): the
//       flyer's SOLVED equilibrium lean IS the felt-tilt of its own orbit (the chain hangs along tilted g).
//   2.  PIN-TICK — the rotor pins exactly as its felt-tilt crosses the friction tick: holds flips false→true
//       across omegaCrit(); tilt(omegaCrit) === muTickDeg === atan(1/μ) = 65.772255° (gap 0.0).
//   3.  COLLAPSE — both operating points satisfy tiltDeg === atan(Fr)·180/π for each OWN Fr over the sweep;
//       genuine because F.G === R.G === 9.81 (asserted at module load — NO warp).
//   4.  ANTI-VACUITY — at ω=0 both rides AND both neg-controls read tilt 0 (agree only where they must).
//   5.  NEG-CONTROL flyer — flyerRigidPoint(ω).thetaDeg === 0 ∀ ω>0 (peels off the arc) while the real
//       felt-tilt > 0; at ω=0 both 0. Anti-vacuity.
//   6.  NEG-CONTROL rotor — rotorFrictionlessPoint pinned === false ∀ finite ω; omegaC(0) === Infinity; a
//       non-empty band above the real ω_c holds. Anti-vacuity.
//   7.  BYTE-TWIN PARITY + DISJOINTNESS — index.html's inlined CORE region === core.mjs CORE char-for-char;
//       the FLYER-ADAPTER block names no rotor fn and the ROTOR-ADAPTER block names no flyer fn (the two
//       bridges are code-disjoint); runSelfTest passes all legs.
// process.exit(pass === total ? 0 : 1).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as F from '../../star-flyer/core.mjs';
import * as R from '../../rotor/core.mjs';
import {
  G, OMEGA_MAX, muTickDeg,
  flyerPoint, flyerRigidPoint, rotorPoint, rotorFrictionlessPoint, omegaCrit,
  arcTiltDeg, deg,
  runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0; const fails = [];
function ck(name, ok, info) {
  if (ok) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { fail++; fails.push(name); console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\nThe Felt-Gravity Curve — Node twin (a flying chair and a clinging rider ride one φ = atan(Fr))\n');

// ── LEG 1: UNION — the flyer's SOLVED lean IS the felt-tilt of its own orbit ───────────────────────────
console.log('— Leg 1: the flyer\'s solved equilibrium lean θ === atan(ω²R/g) — the chain is a plumb-line for tilted g —');
{
  let worst = 0, worstW = 0, n = 0;
  for (let w = 0; w <= OMEGA_MAX; w += 0.005){
    const p = flyerPoint(w);
    const arc = arcTiltDeg(p.Fr);
    const d = Math.max(Math.abs(p.thetaDeg - arc), Math.abs(p.thetaDeg - p.tiltDeg));
    if (d > worst){ worst = d; worstW = w; }
    n++;
  }
  ck('flyerPoint thetaDeg === atan(ω²R/g)·180/π === tiltDeg over a dense ω sweep < 1e-9', worst < 1e-9 && n >= 800,
    'worst=' + worst.toExponential(2) + ' at ω=' + worstW.toFixed(3) + ' (n=' + n + ')');
  // spot-check a few via flyerPoint (the hero readout the page reads)
  for (const w of [0.5, 2.0, 3.5]){
    const p = flyerPoint(w);
    ck('ω=' + w + ': flyer lean θ=' + p.thetaDeg.toFixed(6) + '° === felt-tilt atan(Fr)=' + arcTiltDeg(p.Fr).toFixed(6) + '°',
      Math.abs(p.thetaDeg - arcTiltDeg(p.Fr)) < 1e-9, '|Δ|=' + Math.abs(p.thetaDeg - arcTiltDeg(p.Fr)).toExponential(2));
  }
}

// ── LEG 2: PIN-TICK — the rotor pins exactly as its felt-tilt reaches the friction angle ───────────────
console.log('\n— Leg 2: the rotor rider pins exactly when its felt-tilt reaches the friction angle atan(1/μ) —');
{
  const wc = omegaCrit();
  const below = rotorPoint(wc * (1 - 1e-7)), above = rotorPoint(wc * (1 + 1e-7));
  ck('holds flips false→true across omegaCrit() (slides below ω_c, pins above)', below.pinned === false && above.pinned === true,
    'below=' + below.pinned + ' above=' + above.pinned + ' ω_c=' + wc.toFixed(6));
  const tiltAtC = arcTiltDeg(wc * wc * R.R_DRUM / G);
  ck('tilt(omegaCrit) === muTickDeg === atan(1/μ) = 65.772255° (gap 0.0)',
    Math.abs(tiltAtC - muTickDeg) < 1e-12 && Math.abs(muTickDeg - 65.77225468204583) < 1e-9,
    'tilt(ω_c)=' + tiltAtC.toFixed(9) + ' muTick=' + muTickDeg.toFixed(9) + ' gap=' + Math.abs(tiltAtC - muTickDeg).toExponential(2));
  ck('muTickDeg === deg(atan(1/MU)) read straight from the rotor core (μ=' + R.MU + ')',
    Math.abs(muTickDeg - deg(Math.atan(1 / R.MU))) < 1e-12);
}

// ── LEG 3: COLLAPSE — both operating points sit on one master arc tilt = atan(Fr); honest, no warp ─────
console.log('\n— Leg 3: both rides are beads on ONE arc tilt = atan(Fr); genuine because the two cores share g —');
{
  let worstF = 0, worstR = 0;
  for (let i = 0; i <= 400; i++){
    const w = OMEGA_MAX * i / 400;
    const fp = flyerPoint(w), rp = rotorPoint(w);
    worstF = Math.max(worstF, Math.abs(fp.tiltDeg - arcTiltDeg(fp.Fr)));
    worstR = Math.max(worstR, Math.abs(rp.tiltDeg - arcTiltDeg(rp.Fr)));
  }
  ck('flyer tiltDeg === atan(Fr)·180/π on the master arc < 1e-9', worstF < 1e-9, 'worst=' + worstF.toExponential(2));
  ck('rotor tiltDeg === atan(Fr)·180/π on the master arc < 1e-9', worstR < 1e-9, 'worst=' + worstR.toExponential(2));
  ck('the collapse is HONEST: F.G === R.G === 9.81 (the same g, so NO warp is needed)', G === R.G && G === 9.81,
    'F.G=' + F.G + ' R.G=' + R.G);
}

// ── LEG 4: ANTI-VACUITY — at ω=0 both rides and both controls read tilt 0 ──────────────────────────────
console.log('\n— Leg 4: at rest (ω=0) everything reads tilt 0 — they agree only where they must —');
{
  const fp = flyerPoint(0), rp = rotorPoint(0), fr = flyerRigidPoint(0), rf = rotorFrictionlessPoint(0);
  ck('at ω=0 flyer, rotor, rigid-flyer and frictionless-rotor ALL read tilt 0 (and θ 0)',
    fp.tiltDeg === 0 && rp.tiltDeg === 0 && fr.tiltDeg === 0 && rf.tiltDeg === 0 && fp.thetaDeg === 0 && fr.thetaDeg === 0,
    'flyer=' + fp.tiltDeg + ' rotor=' + rp.tiltDeg + ' rigid=' + fr.tiltDeg + ' fric=' + rf.tiltDeg);
}

// ── LEG 5: NEG-CONTROL flyer — rigid spokes peel off the arc while a real swing leans ──────────────────
console.log('\n— Leg 5 (load-bearing): rigid bolted spokes hold θ≡0 — the flyer bead peels to the x-axis —');
{
  let realLeans = 0, peels = 0, rigidEver = false;
  for (let w = 0.2; w <= OMEGA_MAX; w += 0.05){
    const real = flyerPoint(w), rigid = flyerRigidPoint(w);
    if (real.thetaDeg > 1e-6) realLeans++;
    if (rigid.thetaDeg !== 0) rigidEver = true;
    if (rigid.thetaDeg === 0 && real.tiltDeg > 1e-6) peels++;
  }
  ck('flyerRigidPoint θ≡0 on EVERY leaning sample (peels off the arc) while the real felt-tilt > 0',
    realLeans > 0 && peels === realLeans && !rigidEver, 'leaning=' + realLeans + ' peeled=' + peels + ' rigidEver=' + rigidEver);
  ck('anti-vacuity: at ω=0 the real flyer and the rigid spokes AGREE (both θ=0)',
    flyerPoint(0).thetaDeg === 0 && flyerRigidPoint(0).thetaDeg === 0);
}

// ── LEG 6: NEG-CONTROL rotor — a frictionless wall never pins; the pin tick slides to 90° ──────────────
console.log('\n— Leg 6 (load-bearing): a frictionless wall NEVER pins — PINNED never lights, ω_c → +∞ —');
{
  const wc = omegaCrit();
  let fricEver = false, bandAbove = 0, samplesAbove = 0;
  for (let w = 0; w <= OMEGA_MAX; w += 0.02){
    if (rotorFrictionlessPoint(w).pinned) fricEver = true;
    if (w > wc){ samplesAbove++; if (rotorPoint(w).pinned && !rotorFrictionlessPoint(w).pinned) bandAbove++; }
  }
  ck('rotorFrictionlessPoint pinned === false for EVERY finite ω (PINNED never lights)', !fricEver);
  ck('omegaC(0) === Infinity (a frictionless wall has no finite pin tick — it slides to 90°)', R.omegaC(0) === Infinity);
  ck('a non-empty band above the real ω_c holds while the frictionless one never does (the disagreement is real)',
    bandAbove > 0 && bandAbove === samplesAbove, 'band=' + bandAbove + '/' + samplesAbove + ' ω_c=' + wc.toFixed(4));
}

// ── LEG 7: BYTE-TWIN PARITY + ADAPTER DISJOINTNESS — the page IS the module; the two bridges disjoint ──
console.log('\n— Leg 7: byte-twin parity (page CORE === core.mjs CORE) + the two adapters are code-disjoint —');
{
  const BEGIN = '// === CORE BEGIN ===', END = '// === CORE END ===';
  const region = (text) => { const i = text.indexOf(BEGIN), j = text.indexOf(END); return (i < 0 || j < 0 || j < i) ? null : text.slice(i, j + END.length); };
  const here = dirname(fileURLToPath(import.meta.url));
  const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
  const coreReg = region(coreSrc);
  const pageReg = region(readFileSync(join(here, 'index.html'), 'utf8'));
  ck('byte-twin: core.mjs CORE region present', !!coreReg);
  ck('byte-twin: index.html CORE region present', !!pageReg);
  ck('byte-twin PARITY: index.html CORE === core.mjs CORE (byte-identical)',
    !!coreReg && !!pageReg && coreReg === pageReg,
    coreReg == null ? 'core sentinels MISSING' : pageReg == null ? 'page sentinels MISSING' :
      (coreReg === pageReg ? 'slice ' + coreReg.length + ' chars identical' : 'DRIFT (core ' + coreReg.length + ' vs page ' + pageReg.length + ')'));

  // adapter disjointness: slice the two sub-sentineled bridges and grep each for the OTHER's fns.
  const slice = (a, b) => { const i = coreSrc.indexOf(a), j = coreSrc.indexOf(b); return (i < 0 || j < 0) ? '' : coreSrc.slice(i, j); };
  const flyerBlock = slice('FLYER-ADAPTER BEGIN', 'FLYER-ADAPTER END');
  const rotorBlock = slice('ROTOR-ADAPTER BEGIN', 'ROTOR-ADAPTER END');
  ck('the FLYER-ADAPTER block names NO rotor fn (R\\.|R_DRUM|holds|MU|riderState|omegaC)',
    flyerBlock.length > 0 && !/\bR\.|R_DRUM|holds|\bMU\b|riderState|omegaC/.test(flyerBlock));
  ck('the ROTOR-ADAPTER block names NO flyer fn (F\\.|rideState|solveLean|CHAIN|HUB)',
    rotorBlock.length > 0 && !/\bF\.|rideState|solveLean|CHAIN|HUB/.test(rotorBlock));
}

// ── LEG 8: PARITY with the shared runSelfTest (the function the page inlines as its pill) ──────────────
console.log('\n— Leg 8: the shared runSelfTest (the page pill) agrees —');
{
  const r = runSelfTest();
  ck('core.mjs runSelfTest passes all legs', r.ok,
    r.passed + '/' + r.total + (r.ok ? '' : ' · ' + r.checks.filter(c => !c.ok).map(c => c.name).join(',')));
}

console.log('\n—— The Felt-Gravity Curve Node twin: ' + pass + '/' + (pass + fail) + ' ——');
if (fail) { console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
console.log('  ALL GREEN ✓\n');
process.exit(0);
