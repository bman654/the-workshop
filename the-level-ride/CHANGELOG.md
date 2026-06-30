# The Level Ride — changelog

A felt-ride of **constant width**. Slide a flat plank across the top of a tumbling
Reuleaux roller and it glides dead **level** — a marble set on it would never roll —
while the shape beneath has no fixed centre and visibly **bobs and lurches**. The one
secret is *width*: across any direction the shape never changes how wide it is, so the
gap between floor and plank can never change either. Roundness is a red herring; a still
centre is a red herring. On the Midway's rolling run, kin to The Top That Won't Fall,
The Brazil-Nut Box, The Banked Curve, and The Brachistochrone.

## Cycle 366 — planted (BUILD · garden)

**Born.** A new garden exhibit at `the-level-ride/`, joining the EXISTING rolling
cluster in the amusements wing (NOT a new district — M stays 33).

- **`core.mjs`** — the sole DOM-free authority, built on ONE primitive: the arc-aware
  **closed-form support function** (NOT boundary-sampling — sampling caps near 1e-9, the
  verified trap; the closed form hits ~2.2e-16).
  - One tagged shape schema both core + renderer share: `{kind:'reuleaux', n, w, radii?}`
    (radii defaults all-`w` = constant width; a perturbed `r_k` IS the broken morph) and
    `{kind:'ellipse', a, b}`.
  - `reuleauxVerts` / `reuleauxArcs` (centre = opposite vertex, the compass-arc
    construction), `support` (arc-aware closed form / ellipse `√((a·ux)²+(b·uy)²)`),
    `supportHeight`, `widthRange` (THE shared Δwidth predicate the page reads),
    `isConstantWidth`, `plankHeight` (read from the support function INDEPENDENTLY of the
    contact point — C0-continuous through the cusp, so **no corner-pivot tick** at the
    math layer), `pose` (the centroid BOBS while plankHeight stays `w`), `perimeter`
    (Reuleaux Σ rᵢ·arcSpan = π·w exact, Barbier; ellipse Ramanujan LABELED approx),
    `ellipseAmplitude`, `brokenReuleaux`.
  - One shared `THRESH = 1e-3` used by both neg-controls.
- **`core.test.mjs`** — the Node twin. §1 runs the shared `runSelfTest()`; §2 deeper
  Node-only (dense preset×7200-direction grid; rolling-α sweep with a no-tick adjacent-
  jump assertion; Barbier; ellipse amplitude ladder matching the analytic 2(a−b); Δwidth
  monotone in the break; the closed-form-vs-sampled trap; pose centroid-wander + ARC/
  VERTEX contact hand-off); §3 RE-EXTRACTION PARITY — slices the inlined core out of
  `index.html` between the sentinels and proves all 17 functions byte-identical, the
  constants verbatim, and the evaluated slice's `runSelfTest` agrees ok-for-ok AND
  name-for-name with the module. **31/31 GREEN.**
- **`index.html`** (forged from `index.src.html`) — the three stages: (1) the HERO
  Reuleaux roller carries the plank dead level while the centroid bobs (presets n=3,5,7);
  (2) the NEG-CONTROL ellipse spins under the plank and makes it BOB (squeeze toward a
  circle a=b for the level limit); (3) the TRACE-PEN side-rail draws h(φ) — flat for the
  Reuleaux, a wave for the ellipse. A live `Δwidth` readout chip flips green→amber. The
  BREAK-THE-WIDTH slider perturbs one arc and the plank starts to bob. The math core is
  inlined byte-for-byte between the sentinels; the in-page pill calls the SAME
  `runSelfTest()` the twin runs.
- **In-house brass greybox art** — the brass roller silhouette, the faint compass-arc
  construction guides (centres/radii from core), the flat plank + floor, the trace-pen
  side-rail, the ellipse with its two dashed semi-axis guides. No foraged assets, no audio.
- **Registered** on the front-door map INTO the amusements wing (tier 1, footprint
  `level-ride` — a new side-view drawer: a Reuleaux roller carrying a level plank), with
  a companion back-link to The Top, reciprocal cross-links BOTH directions to all four
  rolling kin, a back-link to `../index.html`, and it drops `ws:seen:the-level-ride`.
  Re-baselined `CROWDING_BASELINE` 0.929→0.939 (the documented intentional-room-add path).

### Honesty register
EXACT / machine-ε is claimed ONLY for (1) constant width and (2) Barbier perimeter on
the canonical Reuleaux presets. The broken-morph and the ellipse are LABELED INEQUALITIES
(`Δwidth > THRESH`), never over-claimed. The ellipse perimeter is a labeled Ramanujan
approximation, not asserted. The roll animation, the compass-arc guides, and the
wandering centroid are rendering and enter no tested number.
