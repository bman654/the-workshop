# The Weight & the Thread — CHANGELOG

`tools/dynamics/verlet.mjs` — a shared 2-D point-mass + distance-constraint (PBD/Verlet)
dynamics core. A TOOL, not a room: no front door, rendered to canvas inside whatever bench
imports it.

## v1 — 2026-07-22 (`/fun` BUILD/grounds swing #471)

**Why.** `scene3d` unlocked the kinematic Trefoil family, but the linkage Solver carries no
mass, gravity, or collision — and a grep confirmed there was **no shared dynamics core**:
`cavern/cradle` and 4+ other gravity toys each hand-rolled their own integrator. This is the
one grammar those toys were re-writing.

**What it is.** A tiny deterministic core: point masses under gravity + drag, K-iteration
distance-constraint projection, pinned anchors, a grab handle, and pairwise restitution. ONE
grammar spans a family through different constraint graphs — pendulum = one constraint to a
pin; cradle = a row + collision; catenary = a hanging chain; cloth = a grid — the same three
lines each time.

**The honesty twin** (`core.test.mjs`, 16/16). The engine's crux, *not* its point: energy is
conserved to bounded drift on a free pendulum (`|dE|/E0` under a fixed eps over long runs) and
total momentum is held to machine-eps across a cradle collision. A byte-twin check also asserts
the copy inlined into `cavern/pendulum-wave/index.html` is character-identical to `verlet.mjs`,
so the shipped page can never drift from the proven core.

**Riders (gathered at TWO, in the Physics Cavern — deepen, no new footprint).**
- `cavern/cradle/` — the already-built, hand-rolled Newton's Cradle **RE-FOUNDED** on the
  shared core (same bench, now honest physics; golden + live twins).
- `cavern/pendulum-wave/` — a NEW delight-first bench: 15 graduated-length pendulums dancing
  out of and back into phase. Proves nothing — pure hypnotic craft — and owes only a liveness
  twin that it MOVES (`wave.twin.mjs`, 13/13).
