// ============================================================================
//  WHERE PRESSURE COMES FROM — the new-math CORE (the SOLE new authority).
//
//  Pure, dependency-free. This file owns ONLY the wall-momentum-flux bookkeeping
//  that turns hard-disc wall bounces into a pressure, plus the ideal-gas law it
//  is measured against and the dimensionless ratio Z = P·extent/(N·kT) used for
//  the head-to-head against Carnot. The COLLISION engine is NOT here — it is
//  single-sourced from ../maxwell-boltzmann/mb-core.mjs and IMPORTED. The
//  anti-circularity guard in pressure-core.test.mjs greps this file: it must
//  define no collision primitive of its own (no collideEqual / no PRNG / no
//  sampler) — this bench derives pressure FROM the proven collisions, it never
//  re-derives the collisions.
//
//  Conventions (M–B's): m = 1, k_B ≡ 1. kT carries energy; A is an area; a "wall"
//  is a perimeter segment. kT_from (imported) already returns ⟨½v²⟩, the 2-D
//  temperature, so idealPressure2D(N, kT, A) is N·kT/A with no extra factors.
// ============================================================================

// the collision engine lives in M–B's core — we IMPORT it, never re-type it.
import { rng, sampleMB, kT_from, speeds } from '../maxwell-boltzmann/mb-core.mjs';
export { rng, sampleMB, kT_from, speeds };   // re-export so the page & test share one source

// ===== PRESSURE CORE (inlined byte-twin) BEGIN =====
  // The machine-exact atom: a wall reflection FLIPS the perpendicular velocity
  // component, so the momentum delivered to the wall is Δp = |(-v⊥) − v⊥| = 2|v⊥|
  // (m = 1). Halve it (one mirror, not two) and PV = NkT fails by a factor of two.
  function wallImpulse(vPerp){ return 2 * Math.abs(vPerp); }

  // A time-averaged pressure meter for a rectangular box. Pressure in 2-D is a
  // FORCE PER UNIT LENGTH = (total momentum delivered to the walls) / (perimeter ·
  // elapsed time). Every wall bounce calls tally(v⊥) with the PRE-flip component;
  // advance(dt) accrues time once per substep. P() reads the running average.
  // RECTANGLE-ready: perimeter & area are recomputed from W,H, so squeezing a
  // movable wall (shrinking A) makes P climb to hold P·A = N·kT.
  function makePressureMeter(W, H){
    return {
      W: W, H: H, perimeter: 2*(W+H), area: W*H, impulseSum: 0, time: 0,
      tally: function(vPerp){ this.impulseSum += wallImpulse(vPerp); },
      advance: function(dt){ this.time += dt; },
      P: function(){ return this.time > 0 ? this.impulseSum/(this.perimeter*this.time) : 0; },
      reset: function(){ this.impulseSum = 0; this.time = 0; },
      // resize the box (movable wall) WITHOUT discarding the running average mid-flight
      resize: function(W2, H2){ this.W = W2; this.H = H2; this.perimeter = 2*(W2+H2); this.area = W2*H2; }
    };
  }

  // The law itself: an ideal 2-D gas of N point particles at temperature kT in
  // area A exerts pressure P = N·kT/A. This is what the wall-tally must reproduce.
  function idealPressure2D(N, kT, A){ return N*kT/A; }

  // The dimensionless ideal-gas ratio Z = P·extent/(particles·kT). For ANY ideal
  // gas in ANY dimension, Z ≡ 1 — it is PV/(NkT) written once. We assert it on
  // BOTH sides of the unit dictionary (N,k_B ↔ n,R): the simulation's measured Z
  // and Carnot's analytic Z must both land on 1, NOT a raw equality of pressures
  // (Carnot's pressure() hardcodes R = 8.314; a literal P=N·kT/A would be off by R).
  function idealZ(P, extent, particles, kT){
    return (particles > 0 && kT > 0) ? (P*extent)/(particles*kT) : 0;
  }

  // Carnot's side of the dictionary, made dimensionless. `pressureFn` is the
  // engine-room's pressure(n,T,V) = n·R·T/V (R hardcoded in ITS body). Dividing by
  // n·R·T/V gives exactly 1 — proving the agreement is the dimensionless law, not a
  // numeric coincidence. R_GAS is passed in (imported by the caller from carnot).
  function zCarnot(pressureFn, R_GAS, n, T, V){
    const P = pressureFn(n, T, V);        // = n·R·T/V  (R lives inside pressureFn)
    return P*V/(n*R_GAS*T);               // ≡ 1 to machine precision, by construction
  }
// ===== PRESSURE CORE END =====

export { wallImpulse, makePressureMeter, idealPressure2D, idealZ, zCarnot };
