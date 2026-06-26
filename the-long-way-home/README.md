# The Long Way Home

*the hero's journey, walked*

A new top-level **GROUNDS** room (the Processional Ground, north of the manor house).
You **walk** the twelve stations of the monomyth — Campbell's hero's journey — as a real
ring tipped near **edge-on**: a thin luminous band that **descends below one horizon**
into a frozen star sky and climbs back to a new **dawn**. One road, walked three times.

## What you do

- You are a glowing **mote** with a faint light-trail. **Click** a station roundel, step
  with **← / →**, or press **Space** to walk on along the ring (I → XII).
- As you go, the whole **firmament + the camera's vertical centre TRANSLATE** so the active
  station frames at reading height. Descending into **The Ordeal** (station VIII, the nadir)
  the entire sky **sinks** overhead — the horizon climbs near the top of the frame and you
  hang deep in star-dark, the lit shore a thin warm thread far above. Climbing to **The
  Return** (XII) the horizon drops and the top of the sky glows **sunrise-gold**.
- Two stone **archways** straddle the band where it crosses the horizon, **passed through**,
  not toggled:
  - **Gate A** (descent, after V) — **Inanna's seven-fold lapis underworld lintel**. Cross
    DOWN through it and warm gold bleeds to cold indigo-silver; the drone dims (a low filter
    sweep, the voices drop away).
  - **Gate B** (dawn, after XI) — the pale **Gate of Horn** (the Odyssey's gate of true
    dreams). Cross UP through it and the cold warms to dawn-gold; the drone swells fuller
    than before.
  Both are reversible — walk back and the crossing un-does itself.
- At every station an illuminated **leaf** unfolds: the one archetypal beat read in **three
  flesh**, braided through three coloured ribbons —
  - **Odysseus**' homeward voyage (sea-blue),
  - **Inanna**'s descent to the Great Below (lapis-and-carnelian),
  - the **Prodigal son**'s far country (olive-and-russet).

## The honesty device (the soul of it)

One skeleton, three flesh — and where a body **strains** the skeleton, its ribbon runs
**thin** while the others blaze. Inanna has no true **Refusal** (she opens her ear to the
Below willingly); the Prodigal has no **Mentor**, and *inverts* the Refusal — he refuses
**home**, not the road. Those thin, dim ribbons are not failures of the parallel: that
visible asymmetry **is** the lesson. The room never forces a false parallel.

## The frozen sky

Charted over the **Orrery's** pinned, deterministic star snapshot (seed `987654321`, the
260-star LCG field), baked **once** and never re-derived — no ephemeris. The stars wheel
*with* the camera, a fixed firmament you descend through. `sky.js`'s only role here is
lighting the room's own front-door star (`WS.seen('the-long-way-home')`).

## Files

- `stations.mjs` — the single source of truth: the 12 stations × 3 myths, with elevations,
  arc membership, gate flags, the woven sentence, the keyword, and a per-myth **tautness**.
  The page renders from it; `stations.test.mjs` asserts it is whole and canonical.
- `walk.js` — the hand-rolled pseudo-3D engine (no Three.js): the edge-on ring geometry, the
  vertical camera/sky translate, the gates, the mote, and the illuminated leaves + braid.
- `audio.js` — the shared Web Audio bus: a warm Day drone, a sparse cold Night pad, a fuller
  Dawn chord (gain-lerped on arc membership, dimmed at Gate A, swelled at Gate B), plus a
  mote-glide, a page-chime, and a low stone threshold thud under each arch.
- `index.src.html` → `index.html` (forge `<!-- forge:include -->` of `ws.js`, `stations.mjs`,
  `audio.js`, `walk.js`).

## Content-fidelity check (stands in for a self-test)

This room carries **no numeric claim**, so it owns no math proof. What it promises is
*fidelity*:

```
node the-long-way-home/stations.test.mjs   →  stations content-fidelity: 165/165 PASS
```

asserts shape/completeness only — exactly 12 canonical stations in canonical order, all 3
myths present & non-empty for every one (**36/36, no holes**), every tautness ∈ [0,1], the
unique nadir at #8, and exactly two gate boundaries at the canonical horizon-crossings
(after #5 = descent, after #11 = dawn). Not a math proof — a check that the table is whole.

## Honours reduced motion

`prefers-reduced-motion: reduce` → no translate/parallax (a hard cut between stations), but
the palette **and** the sound still cross at the gates instantly (estate convention).
