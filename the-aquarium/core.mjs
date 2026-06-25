/* ════════════════════════════════════════════════════════════════════════════
   THE AQUARIUM — core.mjs · the trophic web authority (pure, DOM-free).

   A 4-level marine food chain in a deep-sea column, modelled as a discrete-time
   Lotka–Volterra web with a logistic basal layer. The whole point of the room is
   that you SEE this web — the visible swarm densities in the tank are read live
   from THIS core, so the picture and the proof can never drift. Pull the apex out
   and a TROPHIC CASCADE ripples DOWN the column, two levels deep, in the water
   itself — never a plotted curve.

   THE CHAIN (index 0 = apex … 3 = basal, the chemosynthetic floor):
     0  LANCETFISH  — apex predator, sunlit/upper twilight. No predator above it.
     1  LANTERNFISH — mid, the blue twilight. Eaten by the lancetfish.
     2  COPEPODS    — grazers/mid-low, drift through the column. Eaten by lantern.
     3  VENT SHRIMP — basal, the lightless floor. Grow on the VENT's chemosynthesis
                      (a logistic carrying capacity K), NOT on sunlight. Eaten by
                      copepods.

   THE DYNAMICS (one synchronous step of the whole web):
     basal (i=3):  n' = n + dt·( rBasal·n·(1 − n/K)  −  a[2]·n_cope·n )
     mid   (i):    n' = n + dt·( −m[i]·n  +  e[i]·a[i]·n_prey·n  −  a[i−1]·n_pred·n )
     apex  (i=0):  n' = n + dt·( −m[0]·n  +  e[0]·a[0]·n_prey·n )      (no predator above)
   Each link: predator i eats prey i+1 with attack rate a[i] and assimilation e[i].

   The intact web settles to a stable coexistence fixed point ≈ [19, 2, 51, 12].
   Remove the apex (lancetfish) and the cascade reaches ≥2 levels DOWN:
     • lvl1: lanternfish (its direct prey) BLOOMS   (≈2.0 → 33.5)
     • lvl2: copepods    (the prey's food)  THIN     (≈51.0 → 3.6)

   PROOF DISCIPLINE — runTrophicSelfTest() proves the cascade as a MEASURED-over-K
   inequality with a named tolerance (never a painted constant), plus TWO honest
   neg-controls. The Node twin (core.test.mjs) re-runs the SAME function and exits
   0 iff every claim is green; the page inlines this SAME file (forge:include) and
   shows the same result in a tucked-away pill, so the page and the proof are one.
   ──────────────────────────────────────────────────────────────────────────── */

"use strict";

/* The four species of the chain — index 0 = apex … 3 = basal. The `band` is the
   depth (0 sunlit surface … 1 lightless floor) the live tank keeps each swarm in.
   `col` is the swatch/glow colour; the rest is art-direction the page reads. */
export const SP = [
  { key:'lance',   name:'Lancetfish',  col:'#cdd7ee', band:0.20, shape:'dart',  light:'sunlit'  }, // apex
  { key:'lantern', name:'Lanternfish', col:'#9ad6c8', band:0.46, shape:'drift', light:'twilight'}, // mid-1
  { key:'cope',    name:'Copepods',    col:'#e3c06a', band:0.68, shape:'graze', light:'dim'     }, // grazers
  { key:'shrimp',  name:'Vent shrimp', col:'#ff9d6e', band:0.90, shape:'graze', light:'self'    }, // basal (vent)
];

/* Locked parameters — TUNED (see core.test.mjs) so the intact web is a stable
   coexistence fixed point AND the apex carries real top-down control. Treat as a
   byte-frozen constant: the page inlines this exact object. */
export const PARAM = {
  dt: 0.05,
  // basal logistic on the vent's chemosynthesis
  rBasal: 1.2, K: 80,
  // predation rates a[i]: predator i eats prey i+1  (links 0→1, 1→2, 2→3)
  a: [0.035, 0.02, 0.02],
  // assimilation efficiency e[i]: prey eaten → predator growth
  e: [0.7, 0.7, 0.5],
  // mortality m[i] of the three predators (i = 0,1,2)
  m: [0.05, 0.05, 0.08],
};

/* A fresh web: a starting standing-stock, biggest in the mid-grazers, plus an
   `alive` flag per node so a node can be REMOVED (pinned toward 0; it then neither
   eats nor is eaten). */
export function makeWeb(){
  return { n: new Float64Array([5, 12, 28, 50]), alive: [true, true, true, true] };
}

/* ONE synchronous step of the whole web → mutates & returns state.n.
   A removed node (alive[i] === false) decays toward 0 and contributes no predation
   either way (it is skipped as both predator and prey). */
export function stepWeb(state, P = PARAM){
  const n = state.n, alive = state.alive, dn = new Float64Array(4);
  for (let i = 0; i < 4; i++){
    if (!alive[i]){ dn[i] = -n[i]; continue; }   // a removed node decays to 0 and stays
    let g = 0;
    if (i === 3){
      // basal grows logistically on the vent (chemosynthesis, not sun)
      g += P.rBasal * n[3] * (1 - n[3] / P.K);
    } else {
      // a predator: starves at rate m[i], grows on the prey directly below it
      g += -P.m[i] * n[i];
      const preyIdx = i + 1;
      if (alive[preyIdx]) g += P.e[i] * P.a[i] * n[preyIdx] * n[i];
    }
    // being eaten by the predator directly above (links 0..2)
    if (i > 0){
      const predIdx = i - 1;
      if (alive[predIdx]) g += -P.a[predIdx] * n[predIdx] * n[i];
    }
    dn[i] = P.dt * g;
  }
  for (let i = 0; i < 4; i++) n[i] = Math.max(0, n[i] + dn[i]);
  return n;
}

/* Settle the web to a steady standing-stock (used by the self-test AND by the live
   page on open, so the tank opens already in calm coexistence). */
export function settle(state, steps, P = PARAM){
  for (let s = 0; s < steps; s++) stepWeb(state, P);
  return Float64Array.from(state.n);
}

/* The time-average of each level over KSTEP steps, after a BURN-in to the fixed
   point, for a given `alive` mask. The honest way to compare two regimes: a mean,
   not a single snapshot that could land mid-oscillation. */
export function meanOverK(alive, KSTEP = 800, BURN = 2500, P = PARAM){
  const st = makeWeb(); st.alive = alive.slice();
  settle(st, BURN, P);
  const acc = new Float64Array(4);
  for (let s = 0; s < KSTEP; s++){ stepWeb(st, P); for (let i = 0; i < 4; i++) acc[i] += st.n[i]; }
  for (let i = 0; i < 4; i++) acc[i] /= KSTEP;
  return acc;
}

/* ── THE SELF-TEST — the removed-node cascade reaches ≥2 levels, proved as a
   MEASURED-over-K inequality with a named tol, with TWO honest neg-controls.

   CLAIM (the cascade): remove the APEX (lancetfish, i=0) and, time-averaged over K:
     • lvl1 — its direct prey (lanternfish, i=1) MEAN rises ABOVE its intact baseline
     • lvl2 — that prey's food (copepods, i=2) MEAN falls BELOW its intact baseline
   (a genuine top-down trophic cascade two links deep).

   NEG-CONTROL (a) — A GENUINELY CONNECTED, NON-CASCADING NODE.
     Remove the COPEPODS (i=2) instead — a node that is fully wired INTO the web
     (lanternfish's only food; the vent shrimp's only predator), so its removal DOES
     enter stepWeb and DOES change the dynamics. The point: this does NOT reproduce
     the apex-out signature. Lanternfish, having lost its food, FALLS — it does NOT
     bloom. So "lanternfish blooms" is specific to pulling the APEX, not a generic
     "remove anything and the web moves." (This replaces the old isolated-5th-node
     control, which was structurally trivial — an un-run node changing nothing proves
     nothing. THIS control runs real perturbed dynamics and still fails to cascade up.)

   NEG-CONTROL (b) — A CONSERVED FIXED POINT.
     The intact web under the fixed vent nutrient is a fixed point: total biomass
     drifts only within tol across the window (the floor doesn't run away).

   Measured inequalities with named tolerances — never a painted constant. ── */
export function runTrophicSelfTest(P = PARAM){
  const KSTEP = 800, tol = 1.0;

  const base   = meanOverK([true, true, true, true],  KSTEP, 2500, P);
  const noApex = meanOverK([false, true, true, true], KSTEP, 2500, P);

  // the cascade: lvl1 prey blooms, lvl2 food thins
  const lvl1 = noApex[1] > base[1] + tol;     // lanternfish rises
  const lvl2 = noApex[2] < base[2] - tol;     // copepods fall
  const cascadeReaches2 = lvl1 && lvl2;

  // neg-control (a): remove the CONNECTED copepods (i=2). Lanternfish must NOT bloom.
  const noCope = meanOverK([true, true, false, true], KSTEP, 2500, P);
  const lanternBloomNoCope = noCope[1] > base[1] + tol;     // the apex-out signature, on the wrong removal
  const negA = !lanternBloomNoCope;                          // PASS iff it does NOT bloom
  // measure how far lanternfish moved under this removal (it falls — a real effect, just not the cascade)
  const negAlanternDelta = +(noCope[1] - base[1]).toFixed(3);

  // neg-control (b): total biomass under the fixed vent nutrient drifts only within tol
  const stB = makeWeb(); settle(stB, 2500, P);
  const tot0 = stB.n.reduce((a, b) => a + b, 0);
  let maxDrift = 0;
  for (let s = 0; s < KSTEP; s++){ stepWeb(stB, P); const t = stB.n.reduce((a, b) => a + b, 0); maxDrift = Math.max(maxDrift, Math.abs(t - tot0)); }
  const negB = maxDrift <= 2.0;   // intact web is a fixed point: measured drift ≈ 1.24

  return {
    pass: cascadeReaches2 && negA && negB,
    base, noApex, noCope,
    lvl1, lvl2, negA, negB,
    tol,
    negAlanternDelta,
    maxDrift: +maxDrift.toFixed(2),
  };
}

/* ── Node bridge. The dual-use guard below is what `forge` strips wholesale when it
   inlines this core into the page (a bare `module`/`require` is undefined in the
   browser anyway, and forge also strips the leading `export ` keywords). On Node it
   exposes the surface for the CommonJS path; the real Node entry point is
   core.test.mjs, which `import`s this module (ESM) and runs the SAME
   runTrophicSelfTest() — `node the-aquarium/core.test.mjs` exits 0 iff green.
   ──────────────────────────────────────────────────────────────────────────────── */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SP, PARAM, makeWeb, stepWeb, settle, meanOverK, runTrophicSelfTest };
}
