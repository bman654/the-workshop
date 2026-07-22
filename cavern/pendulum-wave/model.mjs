/* ============================================================================
 *  THE PENDULUM WAVE — the shared model, riding the estate's dynamics core.
 *
 *  A DELIGHT bench. It proves no theorem. Fifteen pendulums on graduated threads
 *  are released together from the SAME angle; their periods stand in the integer
 *  ratio (M … M+14), so they slide out of phase into a travelling wave, tangle
 *  into apparent chaos, briefly snap into a two-strand snake at half-time, and
 *  fall back into a single unison crest at the recurrence T_cycle — then do it
 *  forever. There is nothing to be right about; there is only the payoff, and the
 *  payoff must FIRE. This module is what makes it fire, and its wave.twin.mjs
 *  asserts that it does.
 *
 *  ONE OPERATOR, NO FORK. This module is imported by BOTH the page (forge-inlined
 *  so the browser runs the same bytes) AND its headless twin (wave.twin.mjs, a
 *  real ESM in Node). The recurrence you watch, the on-page liveness chip, and the
 *  numbers the twin asserts are all THIS code running on tools/dynamics/verlet.mjs.
 *
 *  THE MODEL. Each bob is a point mass in a Verlet World, hung from its OWN pinned
 *  anchor by a single distance constraint (a thread of rest length L_n). Gravity
 *  swings it along its arc; the K Gauss–Seidel projections keep the thread taut.
 *  NO collisions — the bobs never touch (the anchors are spaced wider than any
 *  swing), so the base World.step is the whole physics. Only pins, distance
 *  constraints, and the grab handle are used.
 *
 *  WHY IT RECURS — and why we CALIBRATE. In the ideal small-angle limit a pendulum
 *  of length L has period P = 2π√(L/g); choose L_n = g(P_n/2π)² with P_n =
 *  T_cycle/(M+n) and every bob completes an INTEGER number of swings in T_cycle,
 *  so they realign. But two things bend the ideal period: (1) we release at a BOLD
 *  θ₀ = 0.35 rad for a dramatic amplitude, and the large-angle period carries the
 *  correction (1 + θ₀²/16 + …); (2) position-Verlet PBD has its own tiny quirks.
 *  Both are absorbed by CALIBRATION: calibrate() Newton-iterates each L on the
 *  MEASURED bottom-crossing period in the REAL core until it equals P_n, then we
 *  FREEZE the result (FROZEN_L per tempo preset). Page and twin both read the
 *  frozen table, so the recurrence is exact to the core's integration residue and
 *  can never drift between them. The large-angle correction is a COMMON multiplier
 *  across all fifteen (same θ₀), so equal amplitude is the load-bearing invariant —
 *  release them all from the same angle and the ratios, and the recurrence, hold at
 *  a bold, theatrical swing.
 * ============================================================================ */

import { World } from '../../tools/dynamics/verlet.mjs';

/* geometry + integration — SI-ish (metres / kg / seconds), shared page + twin */
export const N = 15;                    // number of bobs
export const G = 9.81;
export const THETA0 = 0.35;             // bold release angle (rad) — the delight amplitude
export const SUBSTEP = 1 / 3000;        // fixed physics substep (Hz⁻¹); high enough that
                                        //   the O(dt²) energy drift is negligible over T_cycle,
                                        //   so the crest returns crisp (see wave.twin.mjs)
export const ITER = 24;                 // thread stiffness: K Gauss–Seidel projections / substep
export const SPACING = 0.085;           // anchor spacing on the level beam (m); ≫ any bob swing,
                                        //   so no two bobs ever collide

/* tempo presets — each a DIFFERENT recurrence, each its OWN frozen calibrated table.
 * M is the swing count of the LONGEST (n=0) pendulum over one T_cycle; M+14 the shortest. */
export const PRESETS = {
  contemplative: { M: 24, Tcycle: 32, label: 'Contemplative' },  // periods 1.333 → 0.842 s
  lively:        { M: 20, Tcycle: 20, label: 'Lively' },         // periods 1.000 → 0.588 s
};

/* ── the ideal small-angle seed ─────────────────────────────────────────────
 * lengthLaw({g,N,Tcycle,M}) → { Ls, Ps }: P_n = T_cycle/(M+n), L_n = g(P_n/2π)². */
export function lengthLaw(opts){
  opts = opts || {};
  const g = (opts.g != null) ? opts.g : G;
  const n = (opts.N != null) ? opts.N : N;
  const Tcycle = opts.Tcycle, M = opts.M;
  const Ls = [], Ps = [];
  for (let i = 0; i < n; i++){
    const P = Tcycle / (M + i);
    Ps.push(P);
    Ls.push(g * (P / (2 * Math.PI)) * (P / (2 * Math.PI)));
  }
  return { Ls, Ps };
}

/* a fresh World configured exactly as the wave runs (used by calibrate + measure). */
export function makeWorld(g){
  return new World({ gravity: [0, (g != null) ? g : G], drag: 0, iterations: ITER, dt: SUBSTEP });
}

/* ── measurePeriod — the REAL bottom-crossing period of one thread in the core ──
 * Build a single pin+bob+thread, release from θ₀ at rest, and time the bob's
 * crossings of the vertical (x = pivotX). Consecutive crossings are half a period
 * apart; we average several and double. Returns the period in seconds (or null if
 * it never crossed — a dead build). */
export function measurePeriod(mkWorld, L, g, theta0){
  const w = mkWorld(g);
  const pin = w.add(0, 0, { pinned: true });
  const bob = w.add(L * Math.sin(theta0), L * Math.cos(theta0), { mass: 1 });
  w.link(pin, bob, L);
  const dt = w.dt;
  const maxT = Math.max(8, 8 * 2 * Math.PI * Math.sqrt(L / g));  // plenty of swings
  const crossings = [];
  let prevX = w.x[bob];
  let t = 0;
  while (t < maxT && crossings.length < 9){
    w.step();
    t += dt;
    const x = w.x[bob];
    if ((prevX > 0 && x <= 0) || (prevX < 0 && x >= 0)){
      const frac = prevX / (prevX - x);           // linear-interpolate the crossing instant
      crossings.push(t - dt + frac * dt);
    }
    prevX = x;
  }
  if (crossings.length < 3) return null;
  let sum = 0, cnt = 0;
  for (let i = 1; i < crossings.length; i++){ sum += crossings[i] - crossings[i - 1]; cnt++; }
  return 2 * (sum / cnt);
}

/* ── calibrate — Newton-iterate each L so its MEASURED period equals its target ──
 * Because P ∝ √L, one step L ← L·(P_target/P_measured)² is nearly exact; 3 passes
 * nail the residue. Returns { Ls, measured } — Ls is the calibrated table. */
export function calibrate(mkWorld, targetsP, seedL, g, theta0){
  const th = (theta0 != null) ? theta0 : THETA0;
  const gg = (g != null) ? g : G;
  const Ls = seedL.slice();
  let measured = new Array(Ls.length).fill(0);
  for (let pass = 0; pass < 3; pass++){
    for (let i = 0; i < Ls.length; i++){
      const P = measurePeriod(mkWorld, Ls[i], gg, th);
      measured[i] = P;
      if (P && isFinite(P)){
        const ratio = targetsP[i] / P;
        Ls[i] = Ls[i] * ratio * ratio;
      }
    }
  }
  // final measurement of the calibrated table
  for (let i = 0; i < Ls.length; i++) measured[i] = measurePeriod(mkWorld, Ls[i], gg, th);
  return { Ls, measured };
}

/* ── the FROZEN calibrated tables ───────────────────────────────────────────
 * Computed once by calibrate() at authoring time (deterministic — no Math.random,
 * so a fresh calibration reproduces these to integration residue; wave.twin.mjs
 * asserts exactly that). Page AND twin read THESE, never a live recompute, so the
 * recurrence can never differ between what you watch and what the twin proves.
 * FROZEN_P holds the TARGET periods (P_n = T_cycle/(M+n)) — the source of ω_n. */
export const FROZEN_P = {
  contemplative: lengthLaw({ g: G, N: N, Tcycle: PRESETS.contemplative.Tcycle, M: PRESETS.contemplative.M }).Ps,
  lively:        lengthLaw({ g: G, N: N, Tcycle: PRESETS.lively.Tcycle,        M: PRESETS.lively.M        }).Ps,
};

export const FROZEN_L = {
  contemplative: [0.435186, 0.401074, 0.370821, 0.343866, 0.319748, 0.298081, 0.278544, 0.260867, 0.244821, 0.230212, 0.216873, 0.204660, 0.193451, 0.183138, 0.173628],
  lively:        [0.244821, 0.222066, 0.202341, 0.185133, 0.170031, 0.156704, 0.144885, 0.134355, 0.124932, 0.116468, 0.108835, 0.101929, 0.095660, 0.089952, 0.084741],
};

/* ── phase geometry (amplitude/decay-invariant) ─────────────────────────────
 * phaseOf(θ, θ̇, ω) = atan2(θ̇/ω, θ): the angle of the (θ, θ̇/ω) phase-plane vector.
 * At a crest (θ̇=0, θ=+θ₀) it is 0; at the opposite crest (θ=−θ₀) it is ±π; it
 * advances uniformly at ω regardless of amplitude, so decaying swings still read a
 * clean phase. orderParam = |Σ e^{iφ}| / N ∈ [0,1] — 1 when all bobs share a phase
 * (a unison crest), low when the phases are scattered. */
export function phaseOf(theta, thetaDot, omega){
  return Math.atan2(thetaDot / omega, theta);
}
export function orderParam(phases){
  let re = 0, im = 0;
  for (let i = 0; i < phases.length; i++){ re += Math.cos(phases[i]); im += Math.sin(phases[i]); }
  return Math.hypot(re, im) / phases.length;
}

/* ── buildWave — the live fifteen-thread wave on the shared core ─────────────
 * buildWave(Ls, { g, periods, spacing, iterations }) → the wave handle. `periods`
 * (default the ideal 2π√(L/g)) supplies ω_n for the phase read; pass FROZEN_P for
 * the exact target ω. */
export function buildWave(Ls, opts){
  opts = opts || {};
  const g = (opts.g != null) ? opts.g : G;
  const K = (opts.iterations != null) ? opts.iterations : ITER;
  const dt = (opts.dt != null) ? opts.dt : SUBSTEP;
  const spacing = (opts.spacing != null) ? opts.spacing : SPACING;
  const n = Ls.length;
  const periods = opts.periods || Ls.map(L => 2 * Math.PI * Math.sqrt(L / g));
  const omega = periods.map(P => 2 * Math.PI / P);

  const w = new World({ gravity: [0, g], drag: 0, iterations: K, dt });
  const anchors = [], bobs = [], lens = Ls.slice();
  const anchorX = (i) => (i - (n - 1) / 2) * spacing;
  for (let i = 0; i < n; i++){
    const ax = anchorX(i);
    anchors.push(w.add(ax, 0, { pinned: true }));
    bobs.push(w.add(ax, Ls[i], { mass: 1, radius: 0.018 }));
    w.link(anchors[i], bobs[i], Ls[i]);
  }

  /* signed angle from vertical (+x side positive). */
  function angleOf(i){
    const bx = w.x[bobs[i]] - anchorX(i), by = w.y[bobs[i]];
    return Math.atan2(bx, by);
  }
  /* θ̇ from the CORE velocity: project v onto the unit tangent (cosθ,−sinθ)/L. */
  function thetaDot(i){
    const th = angleOf(i);
    const v = w.velocity(bobs[i]);
    return (v[0] * Math.cos(th) - v[1] * Math.sin(th)) / lens[i];
  }
  /* place bob i on its arc at `ang`, dead at rest (zeroVel). */
  function setAngle(i, ang, zeroVel){
    const x = anchorX(i) + lens[i] * Math.sin(ang);
    const y = lens[i] * Math.cos(ang);
    w.setPos(bobs[i], x, y, { zeroVel: (zeroVel !== false) });
  }
  /* release ALL fifteen from the same angle, in phase, dead at rest — the payoff seed. */
  function releaseAll(theta0){
    const th = (theta0 != null) ? theta0 : THETA0;
    for (let i = 0; i < n; i++){ w.release(bobs[i]); setAngle(i, th, true); }
  }
  function stepWave(dt2){ w.step(dt2); }

  function phases(){
    const out = new Array(n);
    for (let i = 0; i < n; i++) out[i] = phaseOf(angleOf(i), thetaDot(i), omega[i]);
    return out;
  }
  function R(){ return orderParam(phases()); }

  /* grab handle (the pointer perturbs one bob) — kinematic while held. */
  function grab(i){ w.grab(bobs[i]); }
  function moveTo(i, x, y){ w.moveTo(bobs[i], x, y); }
  function release(i){ w.release(bobs[i]); }
  function bobPos(i){ return w.pos(bobs[i]); }

  return {
    w, N: n, anchors, bobs, lens, anchorX, omega, periods, spacing,
    angleOf, thetaDot, setAngle, releaseAll, stepWave, phases, R,
    grab, moveTo, release, bobPos,
  };
}
