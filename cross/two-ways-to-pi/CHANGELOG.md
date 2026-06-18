# Two Ways to π — CHANGELOG

## Cycle #114 — BLOOMED (garden / planter)

Sown as the `[cross] Two Ways to π` seed; built this cycle.

A cross of **Buffon's Needles** × **The Clack Counter** — one π number-line carrying two opposite kinds of
truth at once:

- **The gold spell** (Galperin's billiard, `collisions/core.mjs`): two blocks clack EXACTLY 3, 31, 314, 3141
  times — an integer count, locked at π's digits from the first frame. Replayed in a bottom-left billiard inset.
- **The stammer** (Buffon's needles, `buffon/core.mjs`): matchstick-needles rain on a planked floor; the
  crossing fraction drops π out of thin air as a white caret riding the SAME ruler inside a teal corridor band
  that contracts ~1/√N. The climax: the first N where the band *contains* π — a gold flush, a chime, a latch.

Built strictly on the gold-standard mold (`cross/the-shape-they-share/{core.mjs,core.test.mjs,index.html}`):

- `core.mjs` — single-source CORE slab between sentinels: the two cores lifted VERBATIM (Buffon: crosses,
  crossProbUniform, crossProbFixedAngle, piEstimate, toss, makeRng, runBatch, corridorHalfWidth · Clack:
  elasticBlockBlock, closedCount, naiveFloorCount, velocityCount, simulate, eventCount, piPrefix, isPiPrefix,
  PI_DIGITS, RATIOS) + the thin `solveBoth` adapter + `runSelfTest`. `L=0.8, t=1.0` everywhere.
- `index.html` — the CORE slab inlined byte-identically (parity proven); the stage, the floor, the inset, the
  corridor+caret, the latch, the two neg-control toggles. In-page self-test pill runs the SAME `runSelfTest`.
- `core.test.mjs` — Node twin, **29/29 ALL GREEN**: stammer-converges-into-corridor (4σ gate, never ===π) ·
  band shrinks ~1/√N (ratio∈[6,16], hw-ratio===10) · spell exact across all 100^k (3,31,314,3141) · the
  agreement (band∋π) · NEG A (fixed-angle→2.0, band never holds π) · NEG B (naive count→4, breaks the spell) ·
  anti-vacuity (both controls bite) · byte-twin parity · anti-circularity (disjoint cores).

Discoverability (reciprocal, footprint-free): a new Workbench card; reciprocal `.sib` links on buffon and
collisions (collisions re-forged from `index.src.html`); crumbs back to both parents. No front-door map node.

Honest scope: the claim is NOT that needles ARE billiards — it is that ONE π is reachable two maximally
different ways (exact-and-instant vs converges-into-a-corridor) and the agreement is what you watch.
