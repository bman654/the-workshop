# The Passing Siren — CHANGELOG

A standalone **grounds** room where the **Doppler effect** becomes a thing you can **see and drag**.
One dark top-down field; drag a buzzing **source** across it and concentric wavefront rings fire at a
fixed cadence — they **bunch tight ahead** of the motion and **stretch behind**, so the pitch shift is
the visible crowding, not a number. A fixed **ear** hears the pitch bend **up** on approach, snap
**down** once the source passes. Push the speed past the wave speed *c* and the rings harden into a
hard red **Mach cone** whose half-angle `sin μ = c/v` reads out live.

Self-contained, zero-dependency: `index.html` + `core.mjs` + `core.test.mjs`. Lives at
`passing-siren/`, back-linked to the estate, reachable from **The Workbench** (the estate's first
acoustics-of-motion piece — no front-door footprint, like Iron Filings).

## v1 — 2026-06-16 (Opus 4.8 · cycle #68 builder)

**What it is — the Doppler effect made visible, dragged live.**
- ONE top-down dark field (`<canvas>`). A **source** (gold buzzing dot, pulsing at the emission
  cadence) fires concentric wavefront **rings** at a fixed rate (FSRC = 12/s = "pitch 1.0"). Each
  ring is a circle centred where the source **was** when it fired, growing at the wave speed *c*. As
  the source moves, the rings **crowd ahead** and **spread behind** — exact geometry, no plotted curve.
- **The ear** (mint glyph) is a fixed listener you can drag. A **right-side pitch ribbon** drives a
  needle that bends **up** (warm) on approach and snaps **down** (cool) past closest approach; the HUD
  echoes speed/Mach and the heard pitch ×factor.
- **Auto-orbit:** the source flies a wide figure-eight so the scene lives without input — drag the
  source (or the ear) to steer it yourself.
- **Supersonic:** past *c* the bunched rings pile into a **Mach cone** drawn from the source apex
  (two tangent edges + a faint shaded interior), with a live `μ = asin(c/v)` read-out chip.

**Two refinements folded in over the prototype.**
- **Exact ring hue (Refinement A).** Each ring stores the **source velocity at emission**
  (`rings.push({x,y,t0,vx,vy})`); it is tinted warm/cool by the radial component of that **stored**
  velocity toward the ear — *not* the current heading. So warm-ahead / cool-behind stays exact even
  through the figure-eight's sharp turns (a ring already fired doesn't care where the source points now).
- **Dramatic supersonic beat (Refinement B).** A **▶ accelerate through Mach 1** button scripts a
  smoothstep ease from rest → 2.0c over ~6s so the cone visibly **snaps shut and tightens**. Alongside
  the existing **pause / run / stop source / reset**, a **freeze** button parks a frame to study.

**The playable negative control.** `stop source` parks the source: a stationary source bunches **no**
rings and bends **no** pitch — the shift is the *motion's*, not arithmetic noise.

**Audio — opt-in, muted by default.** A sawtooth (gain ≤ 0.06, frequency clamped ≤ 3× base so it
never clips), off until you press `sound on`. The **sight** layer — the compressing rings and the cone
snapping shut — stands fully alone when muted, per house courtesy.

**Why the proof is real — a Node twin (`core.test.mjs`, exit 0 green) + an in-page pill.** The heard
pitch is not asserted; it falls out of the geometry. The page and the twin run the SAME three claims
via the inlined core:
1. **Subsonic Doppler** — the rendered ring-arrival rate matches the closed form
   `f_obs = f_src · c/(c − v·cosθ)` across a full pass (approach / abeam / recede), to a relative error
   under `1e-6`, derived two independent ways (the velocity-projection form and the te-derivative of the
   exact arrival map).
2. **Stationary negative control** — a parked source gives `f_obs = f_src` at every angle to machine
   precision (and an arrival-rate identically 1 — the rings don't bunch).
3. **Supersonic Mach cone** — the ring-envelope half-angle equals `asin(c/v)`, checked against a direct
   geometric envelope sweep at several speeds (err < 1e-3).

The twin ALSO re-derives the claim INDEPENDENTLY (not via the bundled self-test): the **head-on**
factor `=== c/(c−v)` and **dead-on recession** `=== c/(c+v)`; **at closest approach** (velocity ⟂ the
sight-line, cosθ=0) `f_obs === f_src` *exactly*; the factor matches `c/(c−v·cosθ)` at sampled θ; the
Mach relation `sin μ · v === c` across supersonic speeds (NaN at/below *c*); the cone half-angle
**tightens monotonically** as *v* grows; and the exact ring geometry `c·(t_arr − te) === |L − X(te)|`.
**14/14 checks green.**

**Byte-parity.** The core inlined in `index.html` between the `PASSING-SIREN CORE` sentinels is
byte-identical (indentation-normalized) to `core.mjs`'s body — the twin proves it, so the inline can
never silently drift.

**Window handle.** `window.PassingSiren = { dopplerFactor, arrivalTime, arrivalRate, machAngle,
runSelfTest }` — the whole core exposed so the page is externally re-auditable from the console.

**Aesthetic.** Estate-dark field (`--bg #070b12`), warm/cool Doppler palette (warm `#ffb24a` crowds,
cool `#5fa8ff` spreads), red Mach cone `#ff5d73`, mint ear, gold source. Mobile-clean (no horizontal
overflow at 390px, 0 console errors at 1280px and 390px). Self-test pill bottom of the controls, click
to expand per-check lines. Back-link `← The Orrery Estate`. Breadcrumb `ws:seen:passing-siren` dropped
on a direct visit.
