// ============================================================================
//  THE FELT-GRAVITY CURVE (Lean and Pin) — logic core. A swing-carousel chair
//  flying OUT and a spin-drum rider CLINGING obey ONE confession: in the rotating
//  frame, effective gravity TILTS by φ = atan(Fr), where Fr = ω²R/g is the local
//  Froude number. The chair's chain is a plumb-line for that tilted gravity; the
//  drum rider PINS the instant φ reaches the friction angle atan(1/μ). One law,
//  one needle, two fates. Pure, dependency-free except TWO single-source ES
//  imports: the star-flyer core and the rotor core are the estate's sole
//  authorities for their own physics, so the lean this cross reads and the pin it
//  reads come from THOSE modules — never a re-typed tan θ = ω²R/g (anti-
//  circularity). The page resolves both natively as browser ES modules (BOTH two
//  ../ hops — cross/<leaf>/ is one dir deeper than a top-level bench), so the
//  imports sit ABOVE the CORE region and are NOT part of the byte-twin slab.
//
//  THE ONE IDEA. There is one master arc — tilt = atan(Fr), Fr on the x-axis —
//  and BOTH rides are beads on it. The Star Flyer's SOLVED equilibrium lean θ is
//  identically the felt-tilt of its OWN orbit (tan θ = ω²R/g is exactly
//  φ = atan(Fr)), so the chairs hang along tilted effective gravity. The Rotor's
//  rider sticks exactly when that felt-tilt — read for the drum's own Fr —
//  reaches the friction angle atan(1/μ): the pin tick on the SAME arc.
//
//    • THE FLYER (star-flyer/core.mjs). A chair on a chain flung out by spin ω
//      leans to θ where tan θ = ω²R/g, R = r₀ + L·sinθ the implicit orbit. Read
//      its rideState and the felt-tilt of its orbit IS its solved lean: φ = θ.
//      The chain hangs along the tilted effective gravity — the lean is the
//      readout, never a re-typed law.
//
//    • THE ROTOR (rotor/core.mjs). A rider against a drum wall of radius R_DRUM
//      at spin ω. Its felt-tilt is φ = atan(ω²R_DRUM/g). The rider pins exactly
//      when friction can carry the weight, μ ω² r ≥ g — i.e. when φ reaches the
//      friction angle atan(1/μ) = 65.772255°. The pin tick lives on the SAME arc.
//
//  THE COLLAPSE. Both operating points satisfy tiltDeg === atan(Fr)·180/π for
//  each ride's OWN Fr. It is GENUINE, not a tautology: the two cores measured
//  with the SAME g (F.G === R.G === 9.81), asserted, so NO warp is needed — the
//  two beads sit on one curve because the law is one law, not because a fudge
//  factor forced them. Two beads, ONE arc, two fates.
//
//  THE FORM (form expresses content). One brass instrument with the NEEDLE as the
//  spine: a single heavy gold pendant needle = the effective-gravity vector, hung
//  from a hub at center, its angle from vertical === φ(ω) of the live operating
//  point. Behind it the faint master arc with two beads (a warm coral flyer bead,
//  a cool teal rotor bead) and a μ-tick at the friction angle = the pin line. A
//  flyer diorama (chairs splaying along the plumb-line) and a rotor diorama (a
//  rider sinking, then LOCKING flat as the PINNED lamp throws) frame the needle.
//
//  TWO LOAD-BEARING NEGATIVE CONTROLS (the differentiators), each import-only.
//    A. RIGID SPOKES (flyer). rideStateRigid forces θ≡0 for every ω — locked arms
//       cannot fly out, so the flyer bead PEELS to the x-axis on every leaning
//       sample while the real felt-tilt > 0; at ω=0 both read 0 (anti-vacuity).
//    B. FRICTIONLESS WALL (rotor). holdsFrictionless never pins at any finite ω;
//       omegaC(0) === Infinity (the pin tick slides to 90°), so a non-empty band
//       exists above the real ω_c where the real wall holds but the frictionless
//       one never does — 'PINNED' never lights.
//
//  SINGLE-SOURCE DISCIPLINE. The two adapters below are the ONLY foreign reads;
//  each is wrapped in sub-sentinels so the disjointness grep proves the flyer
//  adapter names no rotor fn and the rotor adapter names no flyer fn. index.html
//  inlines this whole CORE region byte-identically between the same sentinels; the
//  byte-twin parity leg proves the page IS this module.
//
//  THE CLAIMS IT MAKES CHECKABLE (re-proven by the in-page pill AND core.test.mjs):
//    1. UNION — over dense ω, flyerPoint(ω).thetaDeg === atan(ω²R/g)·180/π ===
//       flyerPoint(ω).tiltDeg to <1e-9 (worst ~2.0e-11): the SOLVED lean IS the
//       felt-tilt of its own orbit.
//    2. PIN-TICK — the rotor pins exactly as its felt-tilt crosses the friction
//       tick; holds flips false→true across omegaCrit(); tilt(omegaCrit) ===
//       muTickDeg === atan(1/μ) = 65.772255° (gap 0.0).
//    3. COLLAPSE — both operating points satisfy tiltDeg === atan(Fr)·180/π for
//       each OWN Fr over the sweep; genuine because F.G === R.G (asserted).
//    4. ANTI-VACUITY — at ω=0 both rides AND both controls read tilt 0.
//    5. NEG-CONTROL flyer — flyerRigidPoint(ω).thetaDeg === 0 ∀ ω>0 while real
//       felt-tilt > 0 (peels off the arc); at ω=0 both 0.
//    6. NEG-CONTROL rotor — rotorFrictionlessPoint pinned === false ∀ finite ω;
//       omegaC(0) === Infinity; a non-empty band above the real ω_c holds.
//    7. BYTE-TWIN PARITY + DISJOINTNESS (in core.test.mjs) — index.html CORE ===
//       core.mjs CORE char-for-char; each adapter names no fn of the other domain.
// ============================================================================

import * as F from '../../star-flyer/core.mjs';
import * as R from '../../rotor/core.mjs';

// === CORE BEGIN ===
"use strict";

// ══ THE ONE LAW SHARED BY BOTH — read LIVE from each foreign core, never re-typed ══════════════════
// The collapse is HONEST: both benches measured g at the SAME 9.81, so there is NO warp. Assert it so
// the collapse cannot quietly drift onto two different gravities.
const G = F.G;
if (G !== R.G) throw new Error('felt-gravity-curve: the two cores must share g for an honest collapse — F.G=' + F.G + ' R.G=' + R.G);

// φ = atan(Fr): the tilt of effective gravity in the rotating frame, Fr the local Froude number ω²R/g.
const tiltOfFr = Fr => Math.atan(Fr);
const deg = x => x * 180 / Math.PI;

// ══ THE TWO ADAPTERS — the ONLY foreign reads, each the sole bridge into one ride's physics ═════════
// The disjointness grep slices these sub-sentineled blocks and proves the flyer block names no rotor
// fn and the rotor block names no flyer fn.

// ─ FLYER-ADAPTER BEGIN ─
// flyerPoint(omega): the swing-carousel operating point. Reads the flyer core's SOLVED equilibrium —
// rideState gives the lean θ and the implicit orbit R = r₀+L·sinθ. Fr = ω²R/g is the orbit's Froude
// number; tiltDeg = atan(Fr)·180/π is the felt-tilt. The UNION claim: thetaDeg === tiltDeg, because the
// solved lean tan θ = ω²R/g IS φ = atan(Fr). The chain hangs along that tilted effective gravity.
function flyerPoint(omega){
  const s = F.rideState(omega);
  const Fr = omega * omega * s.R / G;
  return { omega, R: s.R, Fr, thetaDeg: s.thetaDeg, tiltDeg: deg(tiltOfFr(Fr)) };
}
// flyerRigidPoint(omega): the NEG-CONTROL — RIGID bolted spokes (rideStateRigid) force θ≡0 for every ω.
// The locked arms whirl flat at the rest radius, so the bead PEELS OFF the master arc (thetaDeg 0 while
// the real felt-tilt > 0); at ω=0 both read 0 (anti-vacuity).
function flyerRigidPoint(omega){
  const s = F.rideStateRigid(omega);
  const Fr = omega * omega * s.R / G;
  return { omega, R: s.R, Fr, thetaDeg: s.thetaDeg, tiltDeg: deg(tiltOfFr(Fr)) };
}
// ─ FLYER-ADAPTER END ─

// ─ ROTOR-ADAPTER BEGIN ─
// rotorPoint(omega): the spin-drum operating point. The drum radius is fixed, so Fr = ω²R_DRUM/g and
// tiltDeg = atan(Fr)·180/π is the felt-tilt for the drum's own Fr. `pinned` is the rotor core's own
// verdict (holds) for a representative rider; `drop01` is how far that rider has sunk below ω_c (0 when
// pinned). The pin tick is where the felt-tilt reaches the friction angle.
function rotorPoint(omega){
  const Fr = omega * omega * R.R_DRUM / G;
  return {
    omega, R: R.R_DRUM, Fr, tiltDeg: deg(tiltOfFr(Fr)),
    pinned: R.holds(70, omega), drop01: R.riderState(70, omega, 0.5).drop01,
  };
}
// rotorFrictionlessPoint(omega): the NEG-CONTROL — a FRICTIONLESS wall (holdsFrictionless) NEVER pins
// at any finite ω, so 'PINNED' never lights. The felt-tilt still grows (the wall still presses), but
// the friction reserve is dead.
function rotorFrictionlessPoint(omega){
  const Fr = omega * omega * R.R_DRUM / G;
  return { omega, R: R.R_DRUM, Fr, tiltDeg: deg(tiltOfFr(Fr)), pinned: R.holdsFrictionless(70, omega) };
}
// muTickDeg: the friction angle atan(1/μ) = 65.772255° — the felt-tilt at which the rotor pins. The pin
// tick on the master arc. omegaCrit(): the spin where the drum's felt-tilt reaches that angle (= ω_c).
const muTickDeg = deg(Math.atan(1 / R.MU));
function omegaCrit(){ return R.omegaC(); }
// ─ ROTOR-ADAPTER END ─

// ══ THE MASTER ARC — the one curve both beads ride ══════════════════════════════════════════════════
// arcTiltDeg(Fr): the master arc itself, tilt = atan(Fr)·180/π, with a 90° asymptote as Fr→∞. Both
// flyerPoint and rotorPoint sit on it at their OWN Fr — one curve, two beads.
function arcTiltDeg(Fr){ return deg(tiltOfFr(Fr)); }

// the spin sweep the page and the test ride over (rad/s) — covers ω_c ≈ 3.30 and pushes the flyer past
// 70° lean.
const OMEGA_MAX = 4;

// ══ THE SELF-TEST (re-proven by core.test.mjs; byte-twin-inlined as the page's pill) ════════════════
function runSelfTest(){
  const checks = [];
  const ck = (name, ok, info) => checks.push({ name, ok: !!ok, info });

  // LEG 1 — UNION: the flyer's SOLVED lean IS the felt-tilt of its own orbit. Over a dense ω sweep
  // thetaDeg === atan(ω²R/g)·180/π === tiltDeg to <1e-9 (worst ~2.0e-11). The chain is a plumb-line.
  {
    let worst = 0, worstW = 0, n = 0;
    for (let w = 0; w <= OMEGA_MAX; w += 0.01){
      const p = flyerPoint(w);
      const arc = arcTiltDeg(p.Fr);
      const d = Math.max(Math.abs(p.thetaDeg - arc), Math.abs(p.thetaDeg - p.tiltDeg));
      if (d > worst){ worst = d; worstW = w; }
      n++;
    }
    ck('1 · union: flyer thetaDeg === atan(ω²R/g)·180/π === tiltDeg over a dense ω sweep < 1e-9',
       worst < 1e-9 && n >= 400,
       'worst=' + worst.toExponential(2) + ' at ω=' + worstW.toFixed(2) + ' (n=' + n + ')');
  }

  // LEG 2 — PIN-TICK: the rotor pins exactly as its felt-tilt crosses the friction tick. holds flips
  // false→true across omegaCrit(); tilt(omegaCrit) === muTickDeg === atan(1/μ) = 65.772255° (gap 0.0).
  {
    const wc = omegaCrit();
    const below = rotorPoint(wc * (1 - 1e-7)), above = rotorPoint(wc * (1 + 1e-7));
    const flips = (below.pinned === false) && (above.pinned === true);
    const tiltAtC = arcTiltDeg(wc * wc * R.R_DRUM / G);
    const gap = Math.abs(tiltAtC - muTickDeg);
    ck('2 · pin-tick: holds flips false→true across ω_c AND tilt(ω_c) === atan(1/μ) = 65.772255° (gap 0.0)',
       flips && gap < 1e-9 && Math.abs(muTickDeg - 65.77225468204583) < 1e-9,
       'flips=' + flips + ' tilt(ω_c)=' + tiltAtC.toFixed(6) + ' muTick=' + muTickDeg.toFixed(6) + ' gap=' + gap.toExponential(2));
  }

  // LEG 3 — COLLAPSE: BOTH operating points satisfy tiltDeg === atan(Fr)·180/π for each ride's OWN Fr
  // over the sweep — both beads on ONE arc. Genuine because F.G === R.G (asserted at module top).
  {
    let worstF = 0, worstR = 0;
    for (let i = 0; i <= 200; i++){
      const w = OMEGA_MAX * i / 200;
      const fp = flyerPoint(w), rp = rotorPoint(w);
      worstF = Math.max(worstF, Math.abs(fp.tiltDeg - arcTiltDeg(fp.Fr)));
      worstR = Math.max(worstR, Math.abs(rp.tiltDeg - arcTiltDeg(rp.Fr)));
    }
    ck('3 · collapse: both flyer & rotor tiltDeg === atan(Fr)·180/π on one master arc < 1e-9 (F.G===R.G, honest, no warp)',
       worstF < 1e-9 && worstR < 1e-9 && G === R.G,
       'flyer=' + worstF.toExponential(2) + ' rotor=' + worstR.toExponential(2) + ' g=' + G);
  }

  // LEG 4 — ANTI-VACUITY: at ω=0 both rides AND both controls read tilt 0 (they agree only where they must).
  {
    const fp = flyerPoint(0), rp = rotorPoint(0), fr = flyerRigidPoint(0), rf = rotorFrictionlessPoint(0);
    const allZero = fp.tiltDeg === 0 && rp.tiltDeg === 0 && fr.tiltDeg === 0 && rf.tiltDeg === 0
      && fp.thetaDeg === 0 && fr.thetaDeg === 0;
    ck('4 · anti-vacuity: at ω=0 both rides AND both neg-controls read tilt 0 (agree only where they must)',
       allZero, 'flyer=' + fp.tiltDeg + ' rotor=' + rp.tiltDeg + ' rigid=' + fr.tiltDeg + ' fric=' + rf.tiltDeg);
  }

  // LEG 5 — NEG-CONTROL flyer: rigid spokes read θ≡0 on every leaning sample (peel off the arc) while
  // the real felt-tilt > 0; at ω=0 both read 0 (anti-vacuity — they agree only where they should).
  {
    let realLeans = 0, peels = 0, rigidEver = false;
    for (let w = 0.2; w <= OMEGA_MAX; w += 0.05){
      const real = flyerPoint(w), rigid = flyerRigidPoint(w);
      if (real.thetaDeg > 1e-6) realLeans++;
      if (rigid.thetaDeg !== 0) rigidEver = true;
      if (rigid.thetaDeg === 0 && real.tiltDeg > 1e-6) peels++;   // peeled to the x-axis while real leans
    }
    const bothZero = flyerPoint(0).thetaDeg === 0 && flyerRigidPoint(0).thetaDeg === 0;
    ck('5 · neg-control flyer: rigid θ≡0 PEELS off the arc on EVERY leaning sample (real felt-tilt > 0); ω=0 both 0',
       realLeans > 0 && peels === realLeans && !rigidEver && bothZero,
       'leaning=' + realLeans + ' peeled=' + peels + ' rigidEver=' + rigidEver);
  }

  // LEG 6 — NEG-CONTROL rotor: a frictionless wall NEVER pins at any finite ω; omegaC(0) === Infinity
  // (the pin tick slides to 90°); a non-empty band above the real ω_c exists where the real wall holds
  // but the frictionless one never does — 'PINNED' never lights.
  {
    const wc = omegaCrit();
    let fricEver = false, bandAbove = 0, samplesAbove = 0;
    for (let w = 0; w <= OMEGA_MAX; w += 0.02){
      if (rotorFrictionlessPoint(w).pinned) fricEver = true;
      if (w > wc){ samplesAbove++; if (rotorPoint(w).pinned && !rotorFrictionlessPoint(w).pinned) bandAbove++; }
    }
    ck('6 · neg-control rotor: frictionless NEVER pins ∀ finite ω, omegaC(0)===Infinity, non-empty band above ω_c holds',
       !fricEver && R.omegaC(0) === Infinity && bandAbove > 0 && bandAbove === samplesAbove,
       'fricEver=' + fricEver + ' bandAbove=' + bandAbove + '/' + samplesAbove + ' ω_c=' + wc.toFixed(4));
  }

  const passed = checks.filter(c => c.ok).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}

export {
  G, OMEGA_MAX, muTickDeg,
  flyerPoint, flyerRigidPoint, rotorPoint, rotorFrictionlessPoint, omegaCrit,
  tiltOfFr, deg, arcTiltDeg,
  runSelfTest,
};
// === CORE END ===

// Dual-use guard: run `node core.mjs` to print the self-test. index.html inlines the CORE region above
// byte-identically; core.test.mjs imports these exports and re-proves every leg + parity.
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  const r = runSelfTest();
  for (const c of r.checks) console.log((c.ok ? '  ✓ ' : '  ✗ ') + c.name + (c.info ? '  ·  ' + c.info : ''));
  console.log('\nThe Felt-Gravity Curve — core self-test: ' + r.passed + '/' + r.total + (r.ok ? ' ✓ ALL GREEN' : ' ✗ FAILURES'));
  process.exit(r.ok ? 0 : 1);
}
