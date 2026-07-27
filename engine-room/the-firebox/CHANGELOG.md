# The Firebox — changelog

## 2026-07-27 · built

`engine-room/the-firebox/` — a fire you light, feed, poke, blow on, and put out.
The Engine Room's other benches all move heat about; this one makes it.

**What runs.** A GPU fluid solver on a 176×224 grid (4.1 mm cells, a 0.72 × 0.92 m
firebox): semi-Lagrangian advection with hand-rolled bilinear, vorticity
confinement, viscosity, and 40 Jacobi iterations of pressure projection with the
throat and the grate open. It carries temperature, volatiles, soot and a detail
field. Logs are capsules that settle on the grate and on each other, heat through
(a fast surface and a slow interior), gasify, char, shrink and burn away.

**The claim.** Every colour in the room is a temperature: Planck's law at the
temperature the solver holds in that cell, integrated against the estate's own
CIE 1931 observer (`tools/spectrum/wavelength.mjs` — not forked), into sRGB.
`tools/blackbody/core.mjs` is new and shared; its twin digs Wien's displacement
law and the Stefan–Boltzmann law back out of the same `planck()` numerically and
checks the chromaticities against the published Planckian locus. The page uploads
that file's own 256-entry table to the card and samples it.

**Two proofs the visitor can run** (`prove it`):
1. all 256 pixels of the temperature strip are read back off the card and
   compared with `bbSwatch255()` — worst channel error **0/255**;
2. the reaction shader is run over 8 known cells for 40 ticks and compared with
   `reactStep()` from `core.mjs` — worst **0.000 K**.

**Node twins.** `node tools/blackbody/core.test.mjs` (71 checks) ·
`node engine-room/the-firebox/core.test.mjs` (44 checks).

### What it took to make a fire that stays lit

Six failures, in order, each one a real thing about fires:

1. **The gas near the wood was replaced 250 times a second**, so nothing could
   heat up. Fixed by no-slip at the wood: a wall holds the gas beside it still,
   which is how a flame anchors to a log instead of being swept off it.
2. **Nothing spread sideways.** Advection carries heat; it never propagates a
   front. A cell now counts its hottest neighbour when it asks whether it is
   alight — one cell per substep, which is a front speed of 0.49 m/s, about what
   a laminar flame in air does.
3. **A hot surface is a pilot.** Gas lying against 1300 K wood is lit by the wood
   whether or not the gas has warmed yet. That is what a burning log *is*.
4. **Wood has thermal mass, and two of them.** A surface that follows the flame
   within a second, an interior that follows the surface over ten. Blow the flame
   flat for half a second and the fire comes back; hold it off for four and it
   does not. The twin runs both.
5. **A 0-D twin with no flush is an oven, not a flame** — every rate is
   mis-scaled by the ten-odd times a second a real cell's contents are replaced.
   `Cell.step()` now flushes, and `FLUSH` is calibrated against the running
   solver.
6. **Shutting the damper made the fire HOTTER** — fuel piled up and burned
   anyway, because no cell knew the whole box shares one chimney. The page now
   runs an integral controller: burning is throttled until it matches the air the
   damper is letting in. Shut it and the fire is out in about twenty seconds.

Two rendering failures worth the same note: a `LINEAR` sampler on an `RGBA32F`
table returns **black** for every fetch in core WebGL2 (the whole room was dark
and there was no error anywhere), and cell-scale ripples in temperature — a few
percent, nothing to look at — are turned by the visible-band luminance curve
into a five-fold ripple in brightness, a picket fence of flame. Thermal
diffusion and a rough wood surface fixed that.

**Verified** at 1440×900 and 390×844 in Chrome: real input-level click on the
gate, a real CDP drag as the poker (the velocity field responds), real clicks on
*add a log*, the damper taken to 0 (fire out, logs cooled to ~360 K) and back
(relit), 60 fps throughout.
