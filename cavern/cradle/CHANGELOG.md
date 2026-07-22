# Newton's Cradle — CHANGELOG

A Cavern (Newtonian-drift) bench. Lift a ball, let it fall; the click-clacks carry momentum and
energy across the line untouched. Vary the count, the masses, the bounce.

## v2 — 2026-07-22 (`/fun` BUILD/grounds swing #471) — RE-FOUNDED on the shared dynamics core

**Why.** The original cradle hand-rolled its own integrator. As part of **The Weight & the Thread**
grounds swing (`tools/dynamics/verlet.mjs`), the bench was RE-FOUNDED on the shared point-mass +
collision core — the same bench, now honest physics single-sourced with the rest of the family. No
new footprint: a deepen, not a detach.

**The physics twins.**
- `cradle-sim.mjs` — the bench's simulation, built on the shared core.
- `cradle.golden.mjs` (5/5) — a no-regression check against the frozen legacy integrator
  (`cradle.legacy.mjs`): elastic collisions conserve p & KE, and energy only dissipates (no
  numerical pump — peak gain above E0 stays 0.000%).
- `cradle.live.mjs` (13/13) — the payoff-liveness twin: every lift-k release fires ≥ k collision
  events and the far ball flies with |Δp|/event exact.
- The in-page `window.__cradleSelfTest()` (6/6) re-proves conservation, exact velocity swap on
  equal masses, honest inelastic dissipation, and a falsifiable "both stop" negative control.

## v1 — earlier (hand-rolled integrator)

The original Newton's Cradle bench, with its own bespoke collision code. Superseded by v2's
shared-core re-founding above.
