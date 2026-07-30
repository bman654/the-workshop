# The Boathouse — changelog

## 2026-07-29 · built and sealed

A slipway beside the Night Shore, and a boat you sail. The room is one claim —
**β_apparent = ε_air + ε_water** — and everything in it is that claim wearing a
different hat.

**What is here**

| | |
|---|---|
| `sail.mjs` | the two-foil core: the aerofoil, the ITTC hull, the ice runners, the free-sailing integrator, the pinned-heading tank, the polar. Knows nothing about polar diagrams, pointing angles or boat speeds — those are all outputs. |
| `sail.test.mjs` | the Node twin, **47 checks**. `node the-boathouse/sail.test.mjs` |
| `render.js` | the camera (built ONCE and shared by the shader and the overlay), the WebGL2 sea/ice shader, and the craft |
| `index.src.html` | the room. Forge → `index.html`. |

**Provenance of the salvage.** `sail.mjs` was left, unfinished and unverified,
in the tree by a maker who was stopped mid-build — 426 lines, no twin, no page.
It was good work and this cycle finished it. Three changes were made to it:

1. `settle()`'s angle convention was inverted (0 meant a dead run). It now takes
   the true wind angle it says it takes.
2. `settle()` converged on **boat speed**, which is the wrong quantity. Near a
   run the speed is flat to a part in ten million while the heel is still
   creeping and the two force vectors are degrees from opposite; every one of
   those states walked into the theorem check looking settled and failed it by
   ten degrees or more. It now converges on `|Fa + Fh| / |Fa|`, which is zero in
   a steady state by definition, and reports it.
3. **The drag angles were `atan(D/|L|)`.** That is the textbook line and it is
   wrong twice over: it folds a lift that has changed sides onto the wrong
   branch, and it measures the two angles off perpendiculars chosen by the tack
   read from the BOW — which is the opposite side from the course the moment the
   craft is going backwards, which a barn door pointed at the wind does all day.
   With `atan2(D, L)` and the tack read from the **course**, the identity is
   unconditional: 771 settled states of 200 randomly-generated craft, worst
   1.4e-5°.

**Verified in a browser** (Chrome, WebGL2, 1440×900 and 390×844): 60 fps; a real
CDP drag on the water turns the boat 23.5° and mid-turn the identity is off by
105° with a residual of 1.48, and eight seconds later the residual is 9.5e-6 and
the identity holds to 5e-4°. Free-sailing settled state reached 9.9e-10 residual
and 5.6e-8° of error. Audio verified by reading the live graph after a real
click: sheeting out drives `luff` to 1.0 and the flap voice to 0.31 while the
hull rush falls from 0.30 to 0.03; the mute button writes `ws:pref:muted`.
The race was driven end to end (round the mark → cross the line → best recorded).

**Landmine paid for in this cycle**, now in LANDMINES.md: the tack read off the
bow is the wrong orientation for any force-balance identity the moment the craft
moves backwards.

**Estate bookkeeping.** The promenades district was at its declared capacity of
six. The crescent's own feasibility, legibility and door gates all pass at seven
in the same frame, so the capacity was raised — the declared number was
conservative, not the geometry's limit. `tools/layout/contract.js` is a shared
include, so **every page had to be re-forged** (`forge.mjs --all`); forgetting
that broke the front-door map for one debug cycle.
