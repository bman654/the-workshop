# The Dividing Yard — CHANGELOG

## v1 — planted (cycle #236)

The Numbers Room's **19th bench**, and the second number-shape bench beside The
Squaring Yard — built byte-for-byte in its house grammar (same palette, pebble
renderer, board framing, `.back` topbar, readout, panel, media rules). Only the
verb changes: the Squaring Yard folds **odd numbers into a square**; the Dividing
Yard **folds a whole number across a mirror**.

### The three ideas (each a thing the beads ENACT, not a graph)
- **(1) Conjugation is an n-preserving involution.** A partition of n laid as a
  Ferrers staircase, reflected across the row=col mirror, becomes its
  **conjugate** — another partition of the *same* n. Sum is preserved (no bead
  lost) and `conjugate∘conjugate = identity` (transpose twice = the original):
  fold across the mirror, fold again, the beads retrace home exactly.
- **(2) Euler: #{distinct} = #{odd}.** Two utterly different sieves of the
  partitions of n — into **distinct** parts vs into **odd** parts — land on the
  *same* count, for every n. The equality is **discovered**, not assumed: both
  sets are literally enumerated and their lengths crossed with `===` (no
  generating-function shortcut). The two towers rise to the same level line.
- **(3) The repeats-overshoot neg-control (the honesty floor).** Loosen the
  distinct sieve to allow repeats and it collapses to **all** partitions, whose
  count strictly overshoots the odd count for every n≥2 (cheat = p(n) > #odd).
  Euler's match is *special* to distinct↔odd — not a vacuous "always equal" box.

### Form (touch, no graph)
- A fixed-stage canvas app, sibling to the other Numbers-Room benches. Two facet
  tabs — **fold across a mirror ↔** · **two sieves → equal**.
- **Fold:** a left-justified Ferrers staircase you reshape by dragging a row's
  right end (`transferBead` keeps the count pinned to n; illegal moves spring
  back). A draggable teal **mirror** (the row=col diagonal) with a grab handle +
  tick hatching; drop it / press **fold ↔** / ArrowRight and every gold bead
  glides 1:1 to its **conjugate** cell, tinting green on arrival ("= n, nothing
  lost"). **Fold twice** retraces home (the proven identity); a teal ribbon shows
  the conjugate's column heights *before* you fold (the "second truth"); a
  **self-conjugate** badge lights when p === conjugate(p).
- **Two sieves:** the actual partitions rendered as small **bead figures** (not a
  p(n) curve), distinct on the left, odd on the right, rising to the same level
  line. A **let parts repeat** toggle re-enumerates the left tower as ALL
  partitions so it punches past the line (red OVERSHOOT badge).
- The big top-center readout shows the count **= n** through the whole fold; the
  equation line reads the rows and the conjugate columns off the *same* n.

### The math, proven exact
`core.mjs` (DOM-free, integer-only) is the sole partition authority — one shared
descending-partition enumerator (`_enum`), two sieves crossed by literal `===`:
- `partitionsDistinct` · `partitionsOdd` · `partitionsAll` ·
  `partitionsDistinctCheat` (distinct WITH allowRepeat ⇒ collapses to ALL) ·
  `conjugate` (the Ferrers transpose; descending in, descending out) ·
  `ferrersCells` (the sole source of bead pixel cells) · `defaultPartition`
  (the staircase-iest legible default) · `transferBead` (count-pinned reshape) ·
  `randomPartition` · `isPartition`.
- `runChecks(40)` is the shared battery the in-page chip and the Node twin both
  run: Euler #distinct=#odd over n=1..40 by independent enumeration, hand-tabulated
  literals (the full distinct(7)/odd(7) sets, the [1,1,2,2,3,4,5,6] prefix,
  q(40)=1113), structural soundness of every member, conjugation sum-preservation
  AND involution over all partitions of n=1..24, and the repeats-overshoot
  neg-control.

`core.test.mjs` runs `runChecks()` green **and** independently re-derives each
claim a second way — Euler by filtering ALL partitions; conjugation by building a
boolean Ferrers cell-matrix, transposing it, and reading the row sums (crossing
two implementations, not a mirror); the neg-control as cheat === p(n) > #odd. It
also asserts the **forge byte-parity**: the slab inlined into `index.html` is
byte-identical to the module — **22309 assertions, 0 failed**, exit 0. The page
inlines `core.mjs` byte-faithfully via `forge:include`, so the chip and the twin
can never drift.

### The pill-tamper neg-control
Clicking the self-test pill swaps `countDistinct → partitionsDistinctCheat().length`
so the Euler line AND the neg-control both go **red**, then restores after ~1.2s —
the felt proof the towers aren't a vacuous "always equal" box (matching the
Squaring Yard's drop-a-pebble tamper).
