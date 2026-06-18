# The Squaring Yard — CHANGELOG

## v1 — planted (cycle #120)

The Numbers Room's **9th bench**, and the first that turns figurate-number
identities into shapes you **fold** rather than curves you plot — zero plotted
curves anywhere.

### The three ideas (each a thing the pebbles ENACT, not a graph)
- **(1) Odd gnomons build a square** — Σ_{k=1}^{n}(2k−1) = n². Drag L-shaped odd
  shells (1, 3, 5, …) and nest them; the n-th one snapping home completes an n×n
  square. The running pebble count IS n².
- **(2) Two triangles tile that square** — T_n + T_{n−1} = n². Flip one of two
  consecutive triangular stacks and the pair tiles the *same* n×n square — the
  gnomon square, reached a second way.
- **(3) A hexagonal number is a triangular number** — H_n = T_{2n−1}. Unfold the
  genuine nested-hexagon figure (n hexagons sharing a corner) into a triangle of
  side 2n−1: the same pebbles, laid out two ways.

### Form (touch, no graph)
- A fixed-stage canvas app (sibling to the other Numbers-Room benches). Three
  mode tabs — **odd gnomons → n²** · **two triangles → n²** · **a hexagon is a
  triangle** — each with its own controls (fold next / fold all / drop a pebble /
  reset · flip & tile / separate · unfold / refold) and a big top-center readout.
- Pointer **and** touch **and** keyboard: arrows + Enter fold, +/− adjust n,
  reset. The gnomon shells are tinted warm→cool so each nested L reads as a
  distinct shell; the colour cycle (length 12) never collides at the slider's max
  n = 12.
- A big "= n²" readout turns **green** on a genuine square and the equation line
  spells the identity (e.g. "25 = 5² ✓ (1+3+5+…+9)", "T₅ + T₄ = 5² = 25 ✓",
  "H₅ = T₉ = 45 ✓").
- **Negative control on the same board:** *drop a pebble* removes one from the
  folded square → the count is n²−1, a visible **dashed-red gap** opens in the
  grid, and the readout flips **red** to "24 · not a square — a pebble fell". A
  vacuous "always says square" renderer fails here.

### The math, proven exact
`core.mjs` (~169 lines, DOM-free, integer-only) is the sole arithmetic authority —
because everything is integer arithmetic, "machine precision" here is **literal
integer equality (===)**, not a tolerance:
- `triangular` · `hexagonal` · `gnomon` · `loopGnomonSum` (the honest running sum)
  vs `squareClosed` (the claim n²) · `hexAsTriangle` (the triangle-of-side-(2n−1)
  cells) · `hexFigure` (the **genuine** figurate-hexagon dot generator — n nested
  hexagons sharing one corner, hook k adding 4k−3 dots) · `assembledCount` +
  `isPerfectSquare` (verify-by-squaring — a sound oracle that rejects 24, 26, 2).
- `runChecks(200)` is the shared battery the in-page chip and the Node twin both
  run: all three identities over n = 1..200, the assembled-square is genuinely a
  perfect square, `hexFigure` yields exactly H_n **distinct** lattice points, the
  neg-control (drop one pebble → not a square), and spot constants.

`core.test.mjs` runs `runChecks()` green **and** independently re-derives all three
identities over n = 1..200 plus the contiguous-triangle / distinct-hex-dot
structure checks — **1621 assertions, 0 failed**, exit 0. The in-page chip reads
**1605/1605 · n=1..200** and `window.__squaringYardSelfTest()` === the chip's
`runChecks(200)` (the twin adds independent re-derivations on top, hence 1621 vs
1605). The page inlines `core.mjs` byte-faithfully via `forge:include`, so the
chip and the twin can never drift.

### The hexagon-figure note
`hexFigure` is the one piece worth a second look: it lays the genuine *figurate*
hexagon (nested hexagons sharing a corner), not a triangle dressed as one. Its
dot-count is asserted `=== H_n` AND all dots asserted distinct for n = 1..200
(both in `core.mjs` and the twin), and the rendered figure reads as nested
hexagons; unfolding it to the triangle of side 2n−1 is the proof by construction
that H_n = T_{2n−1}.
