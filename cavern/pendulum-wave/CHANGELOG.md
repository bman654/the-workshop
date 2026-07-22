# The Pendulum Wave — CHANGELOG

A Cavern (Newtonian-drift) bench. **Delight-first** — it proves no theorem; it is pure craft.

## v1 — 2026-07-22 (`/fun` BUILD/grounds swing #471)

**What it is.** Fifteen pendulums, each thread a hair shorter than the last, all let go from the
same angle at the same instant. Their periods stand in whole-number ratio, so they drift apart
into a travelling wave, scatter into seeming chaos, briefly braid into a two-strand snake — and
then, all together, fall back into one crest. Then they do it again, forever. A TEMPO toggle
(Contemplative / Lively) and a "Realign" button that snaps them back to a single crest.

**Grounded, claim-free.** No crux, no proof — it owes only a **liveness twin** that its payoff
FIRES: `wave.twin.mjs` (13/13) asserts the measured periods are strictly monotone (long → short),
each sits on its calibration target to <0.3%, and the frozen calibration reproduces a fresh solve
deterministically. `model.mjs` holds the calibration math; the animation reads the shared
`tools/dynamics/verlet.mjs` core (byte-twinned into the page).

**Touchable.** Drag any bob aside and release to perturb the wave — it tangles, then heals back
into phase at the next recurrence (the estate's own emblem, *a cradle you swing*).

**Sound (v1, this cycle's wiring).** Three forged voices live in `art.js` — a per-bob glow, a
per-bob hue, and a marimba that pings on each bob's turn — plus a forged ambient **drone** bed (a
low held open fifth). The page drives glow/hue/marimba directly; the drone is started ONCE, guarded,
on the first sound-enabling gesture and routed into the muted master gain so it fades in with the
Sound toggle and is silenced by the shared estate mute. All audio honours `ws:pref:muted`; the
bench is complete (and silent) if any voice is absent (null-tolerant). Opts OUT until the first
gesture — `Sound: off` by default.
