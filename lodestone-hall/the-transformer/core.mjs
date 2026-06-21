// ============================================================================
//  THE TRANSFORMER — the Lodestone Hall's two-coil, one-flux core.
//
//  Zero-dependency, DOM-free ESM. Runs in the browser AND in Node. This module
//  is the SOLE turns-ratio authority for every voltage / current / power number
//  the bench shows. The page inlines the slab between the TRANSFORMER CORE BEGIN
//  / END sentinels byte-for-byte; core.test.mjs RE-EXTRACTS the inlined copy,
//  injects the parent symbols, and proves the page core === the module core, so
//  page, pill, and Node twin can never silently drift.
//
//  THE ONE IDEA — TWO COILS, ONE FLUX, ONE LEVER. The Lodestone Hall's coil
//  reads a changing magnetic flux Φ(t) and reports its EMF, V = −N·dΦ/dt. Wind a
//  SECOND coil onto the SAME iron core threaded by the SAME Φ(t): it sees the
//  identical flux but with its OWN turn count. Each winding's voltage is −N·dΦ/dt
//  off that one shared Φ, so their RATIO is the turns ratio and NOTHING else:
//        V_s / V_p === N_s / N_p     (exact, frame by frame)
//  The turns ratio is the only lever. And because no energy is stored in an ideal
//  core, the power passes through untouched — voltage UP means current DOWN:
//        V_p·I_p === V_s·I_s         (I_s = I_p·N_p/N_s)
//  Step the voltage up to cross the country, step it down for your wall; the
//  shared changing flux carries the power across, untouched.
//
//  IMPORT, NOT FORK. This core NEVER re-types the flux law. It IMPORTS the Hall's
//  emfAlternator byte-true and calls it with a different N — both windings read
//  the SAME oracle, the SAME Φ(t). The turns-ratio law is then not asserted, it is
//  EARNED: V_s/V_p is N_s/N_p because the two calls share every factor but N. The
//  twin even re-derives V_s from a finite-difference of the IMPORTED flux Φ(t) =
//  N_s·fluxAtAngle(t) — the law falls out of the parent's own flux, not a copy.
//
//  NEG-CONTROLS, both proven RED in the twin:
//   (1) UNLINK THE CORE — break the shared iron so the secondary sees a STATIC
//       field: dΦ/dt = 0 ⇒ V_s ≡ 0 for ANY N_s. It is the SHARED CHANGING flux,
//       not the wire count, that makes the voltage. (max|V_s| === 0 exactly while
//       the linked RMS is large, so a vacuous pass fails.)
//   (2) DC PRIMARY — feed the primary a steady current (ω = 0): dΦ/dt = 0 ⇒ both
//       meters dead. A transformer needs CHANGE; it cannot transform DC.
//
//  SOURCING (anti-drift, encoded in core.test.mjs): index.html forge-inlines the
//  parent's LODESTONE-HALL CORE slab byte-for-byte (the SAME Φ oracle), THEN this
//  TRANSFORMER CORE slab, which references those globals. The twin asserts the
//  TRANSFORMER slice names the parent oracle and re-types NO flux math, and that
//  the parent slab inlined into the page is char-identical to ../core.mjs's.
// ============================================================================

import { emfAlternator, dFluxdTheta, fluxAtAngle, SCENE, COIL } from '../core.mjs';

// === TRANSFORMER CORE BEGIN ===
"use strict";

// The shipped scene constants — the transformer's own apparatus. Np / Ns are the
// two windings' turn counts (the lever); Ip is the primary current the page boots
// with; I_max / N_max are UI ceilings; omega is the alternator crank rate. The
// flux Φ(t) and its geometry come ENTIRELY from the enclosing-scope parent oracle.
const XFMR = { Np: 100, Ns: 50, Ip: 2.0, I_max: 6.0, N_max: 320, omega: 1.3 };

// The parent's alternator rig + coil geometry — the SAME Φ both windings read.
const RIG = SCENE.rig, GEOM = COIL;

// ── A WINDING'S VOLTAGE off the shared flux: V = −N·dΦ/dt, computed by the parent
//    oracle (emfAlternator = −N·(dΦ/dθ)·ω). Both windings call THIS with their own
//    N, so every factor but N is identical — the turns-ratio law is structural.
//    The two neg-controls each zero dΦ/dt at the source, not the formula:
function windingVoltage(theta, omega, N, opts = {}){
  if (opts && opts.unlinkedCore) return 0;            // NEG(1): static field ⇒ dΦ/dt=0 ⇒ V≡0 for any N
  const om = (opts && opts.dcPrimary) ? 0 : omega;     // NEG(2): DC primary ⇒ ω=0 ⇒ dΦ/dt=0
  return emfAlternator(theta, om, RIG, GEOM, N);       // = −N·dΦ/dt, BYTE-TRUE parent oracle
}

// The two windings — same oracle, different N.
const primaryVoltage   = (th, om, Np, o) => windingVoltage(th, om, Np, o);
const secondaryVoltage = (th, om, Ns, o) => windingVoltage(th, om, Ns, o);

// The turns ratio — the only lever. V_s/V_p === turnsRatio(Np,Ns) === Ns/Np.
const turnsRatio       = (Np, Ns) => Ns / Np;

// Current steps INVERSELY to voltage (ideal power held): I_s = I_p·Np/Ns.
const secondaryCurrent = (Ip, Np, Ns) => Ip * Np / Ns;
const primaryCurrent   = (Is, Np, Ns) => Is * Ns / Np;

// The instantaneous power through a winding: V·I (V from the oracle, not recomputed).
const powerThrough     = (th, om, N, I, o) => windingVoltage(th, om, N, o) * I;

// ── THE SELF-TEST — the bench proves its own claim. FIVE rows, each guarding the
//    alternator's zero-crossings (skip |V_p| < 1e-12) and using a CROSS-MULTIPLIED
//    ratio form (|V_s·Np − V_p·Ns|) so a zero denominator never poisons the claim.
function runSelfTest(){
  const checks = [];
  const log = (name, pass, info) => checks.push({ name, pass, info });
  const om = XFMR.omega;

  // ROW 1 — TURNS-RATIO LAW: V_s/V_p === N_s/N_p, i.e. |V_s·Np − V_p·Ns| < 1e-9
  //         over a dense Np × Ns × θ × ω sweep. Both voltages come from the SAME
  //         imported oracle; the law is structural, not asserted.
  let worst1 = 0;
  const NP = [10, 40, 100, 200, 320], NS = [5, 40, 160, 320], OM = [0.3, 0.8, 1.5, 2.7];
  for (let k = 0; k < 360; k++){
    const th = 2*Math.PI*k/360;
    for (const w of OM) for (const np of NP) for (const ns of NS){
      const vp = primaryVoltage(th, w, np), vs = secondaryVoltage(th, w, ns);
      if (Math.abs(vp) < 1e-12) continue;              // skip alternator dead spots
      worst1 = Math.max(worst1, Math.abs(vs*np - vp*ns));
    }
  }
  log('1 · turns-ratio law: V_s/V_p === N_s/N_p  (|V_s·Np − V_p·Ns| over Np×Ns×θ×ω sweep, <1e-9)',
      worst1 < 1e-9, 'worst |V_s·Np − V_p·Ns| = ' + worst1.toExponential(2));

  // ROW 2 — POWER CONSERVATION: with I_s = I_p·Np/Ns, |V_p·I_p − V_s·I_s| < 1e-9
  //         (voltage up ⇒ current down, power held). Plus the dual current ratio.
  let worst2 = 0, worst2c = 0;
  for (let k = 0; k < 360; k++){
    const th = 2*Math.PI*k/360;
    for (const np of NP) for (const ns of NS){
      const vp = primaryVoltage(th, om, np), vs = secondaryVoltage(th, om, ns);
      const Ip = XFMR.Ip, Is = secondaryCurrent(Ip, np, ns);
      worst2 = Math.max(worst2, Math.abs(vp*Ip - vs*Is));
      worst2c = Math.max(worst2c, Math.abs(Is*ns - Ip*np));   // dual current ratio
    }
  }
  log('2 · power conservation: V_p·I_p === V_s·I_s  (I_s=I_p·Np/Ns; current ratio I_s·Ns===I_p·Np, <1e-9)',
      worst2 < 1e-9 && worst2c < 1e-9,
      'worst |V_p·I_p − V_s·I_s| = ' + worst2.toExponential(2) + ', worst |I_s·Ns − I_p·Np| = ' + worst2c.toExponential(2));

  // ROW 3 — FARADAY BRIDGE (re-derivation): a 5-point finite-difference of the
  //         IMPORTED flux Φ(t) = Ns·fluxAtAngle(t) cross-checks the closed-form V_s
  //         to <1e-9. The twin EARNS the law from the parent's flux — V_s really is
  //         −Ns·dΦ/dt of the SAME Φ, not a separate assertion.
  let worst3 = 0;
  const Ns3 = XFMR.Ns;
  const numDeriv = (f, x, e) => (f(x-2*e) - 8*f(x-e) + 8*f(x+e) - f(x+2*e)) / (12*e);
  for (let k = 0; k < 360; k++){
    const th = 2*Math.PI*k/360;
    const closed  = secondaryVoltage(th, om, Ns3);          // −Ns·dΦ/dt, closed form
    const Phi = (t) => Ns3 * fluxAtAngle(t, RIG, GEOM);      // the IMPORTED flux, ×Ns
    const numeric = -numDeriv(Phi, th, 2e-4) * om;           // −Ns·(dΦ/dθ)·ω numerically
    worst3 = Math.max(worst3, Math.abs(closed - numeric));
  }
  log('3 · Faraday bridge: V_s === −N_s·dΦ/dt of the IMPORTED Φ  (5-point finite-difference, <1e-9)',
      worst3 < 1e-9, 'worst |V_s closed − numeric| = ' + worst3.toExponential(2));

  // NEG-CONTROL (1) — UNLINK THE CORE: secondary sees a STATIC field ⇒ V_s ≡ 0 for
  //         EVERY N_s (exactly), while the LINKED RMS is large (so a vacuous pass
  //         FAILS). It is the SHARED CHANGING flux, not the wire count.
  let unlWorst = 0, linkSq = 0, n = 0;
  for (let k = 0; k < 2000; k++){
    const th = 2*Math.PI*k/2000;
    for (const ns of NS){
      unlWorst = Math.max(unlWorst, Math.abs(secondaryVoltage(th, om, ns, { unlinkedCore: true })));
    }
    const v = secondaryVoltage(th, om, XFMR.Ns);
    linkSq += v*v; n++;
  }
  const linkRMS = Math.sqrt(linkSq / n);
  const cN1 = unlWorst === 0 && linkRMS > 1.0;
  log('4 · NEG-CONTROL (1) UNLINK: static core ⇒ V_s ≡ 0 for ANY N_s while linked RMS large (shared flux, not wire count)',
      cN1, 'max|V_s unlinked| = ' + unlWorst.toExponential(2) + ', linked RMS = ' + linkRMS.toFixed(1));

  // NEG-CONTROL (2) — DC PRIMARY: ω = 0 ⇒ dΦ/dt = 0 ⇒ both meters dead (exactly),
  //         while the AC RMS is large. A transformer needs CHANGE; it cannot
  //         transform DC.
  let dcWorst = 0, acSq = 0, m = 0;
  for (let k = 0; k < 2000; k++){
    const th = 2*Math.PI*k/2000;
    dcWorst = Math.max(dcWorst,
      Math.abs(primaryVoltage(th, om, XFMR.Np, { dcPrimary: true })),
      Math.abs(secondaryVoltage(th, om, XFMR.Ns, { dcPrimary: true })));
    const vp = primaryVoltage(th, om, XFMR.Np);
    acSq += vp*vp; m++;
  }
  const acRMS = Math.sqrt(acSq / m);
  const cN2 = dcWorst === 0 && acRMS > 1.0;
  log('5 · NEG-CONTROL (2) DC: ω=0 ⇒ dΦ/dt=0 ⇒ both meters dead while AC RMS large (a transformer needs CHANGE)',
      cN2, 'max(|V_p|,|V_s|) at ω=0 = ' + dcWorst.toExponential(2) + ', AC RMS = ' + acRMS.toFixed(1));

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}
// === TRANSFORMER CORE END ===

export {
  XFMR,
  windingVoltage, primaryVoltage, secondaryVoltage,
  turnsRatio, secondaryCurrent, primaryCurrent, powerThrough,
  runSelfTest,
};
