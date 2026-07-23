// ============================================================================
//  THE WEIGHTED LID — the moving-wall CORE (the SOLE new authority).
//
//  Pure, dependency-free. This file owns ONLY the three boundary pieces the lid
//  adds on TOP of the hard-disc gas: (a) the moving-lid reflection (a disc bounces
//  in the lid's rest frame), (b) the semi-implicit lid integrator (the heavy lid
//  feels discrete disc kicks minus its load and accelerates — NO artificial drag),
//  and (c) the stochastic thermal side/floor walls (redraw the perpendicular speed
//  from the Maxwell–Boltzmann wall flux at the setpoint, or stay specular). It also
//  states the two closed-form facts the lid ENACTS: y_rest = N·kT/L and the ideal
//  pressure at the lid P = N·kT/(W·y).
//
//  The COLLISION engine is NOT here — it is single-sourced from ../maxwell-boltzmann/
//  mb-core.mjs and IMPORTED (collideEqual UNTOUCHED, kT_from UNTOUCHED). The lid never
//  re-derives a collision; it derives a HEIGHT from the same proven collisions. The
//  anti-circularity guard in lid-core.test.mjs greps this file: it must define no
//  collision primitive of its own (no collideEqual / no PRNG / no sampler).
//
//  Conventions (M–B's): m = 1, k_B ≡ 1. kT carries energy; W is a width; a "load" L
//  is a downward FORCE; the lid mass M is an inertia. kT_from (imported) returns
//  ⟨½v²⟩, the 2-D temperature, so N·kT/(W·y) is the pressure with no extra factors.
// ============================================================================

// the collision engine lives in M–B's core — we IMPORT it, never re-type it.
import { rng, sampleMB, kT_from, collideEqual, speeds } from '../maxwell-boltzmann/mb-core.mjs';
export { rng, sampleMB, kT_from, collideEqual, speeds };   // re-export so the page & test share one source

// ===== LID CORE (inlined byte-twin) BEGIN =====
  // (a) The moving-lid reflection, computed in the LID'S rest frame. A disc rising
  //     with vertical velocity vy toward a lid moving at vLid has a CLOSING speed
  //     rel = vy − vLid; it must be > 0 for a hit. In the lid frame the disc simply
  //     reverses (elastic off an infinite-mass mirror IN THAT FRAME), so back in the
  //     lab frame vy' = 2·vLid − vy. Momentum is conserved between disc and lid: the
  //     disc's vertical momentum changes by (vy' − vy) = −2·rel, so the lid RECEIVES
  //     +2·rel (m = 1). reflectLid returns [vyNew, impulseToLid].
  function reflectLid(vy, vLid){
    var rel = vy - vLid;                 // closing speed toward the lid (a hit needs rel > 0)
    return [2*vLid - vy, 2*rel];         // [new disc vy, momentum handed up to the lid]
  }

  // (b) The semi-implicit lid acceleration. Over a step of length dt the gas hands the
  //     lid a total upward momentum `impulseSum`; the time-averaged gas FORCE is thus
  //     impulseSum/dt. The load L pulls down, the lid mass M resists. Net acceleration
  //     a = (gas push − load) / mass. There is NO drag term — the settle DAMPS because
  //     a moving lid does work on the discs it strikes (reflectLid thermalises the
  //     lid's ordered kinetic energy into the gas), which is honest, not scripted.
  function lidAccel(impulseSum, dt, L, M){ return (impulseSum/dt - L)/M; }

  // (c) A stochastic thermal wall. On a side or floor bounce the perpendicular SPEED
  //     is REDRAWN from the 2-D Maxwell–Boltzmann wall FLUX at the setpoint Tset — the
  //     flux distribution is Rayleigh, v = √(−2·Tset·ln(1−u)), whose flux-mean of v²
  //     is 2·Tset, exactly the equilibrium wall flux at kT = Tset, so the gas relaxes
  //     to that temperature. A specular wall (thermostat OFF) keeps the incoming speed,
  //     so the gas conserves energy and the lid's work rides it along an ADIABAT.
  //     Returns the OUTGOING perpendicular SPEED (≥ 0); the caller points it inward.
  function thermalPerp(vIn, Tset, thermostat, rand){
    if(!thermostat) return Math.abs(vIn);              // specular: |v⊥| preserved (adiabatic control)
    if(Tset<=0) return 0;                              // frozen: the wall absorbs, no rebound
    var u=rand(); if(u>=1) u=0.999999999;
    return Math.sqrt(-2*Tset*Math.log(1-u));           // Rayleigh flux magnitude at Tset
  }

  // The two facts the lid ENACTS (k = 1, m = 1):
  //   y_rest = N·kT / L        — the height where gas push (P·W) balances the load L,
  //   P      = N·kT / (W·y)     — the ideal 2-D pressure at the lid (area A = W·y).
  // Together they give the isotherm the lid draws: L·y_rest = N·kT = const at fixed T.
  function yRest(N, kT, L){ return L>0 ? N*kT/L : Infinity; }
  function idealPressure(N, kT, W, y){ var A=W*y; return A>0 ? N*kT/A : 0; }
// ===== LID CORE END =====

export { reflectLid, lidAccel, thermalPerp, yRest, idealPressure };
