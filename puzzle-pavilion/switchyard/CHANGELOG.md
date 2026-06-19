# The Switchyard — CHANGELOG

A Netwalk bench: an R×C lattice of pipe tiles with one glowing **source**. Every tile is a piece
of pipe (a stub · an elbow · a straight · a tee) that you **rotate** a quarter-turn at a time —
by click or arrow-key — until the whole network fuses and every arm drinks from the source. There
is no losing state: an un-powered tile is only half-lit in **slate**, waiting its turn. The instant
the source reaches every tile, the whole lit lattice settles into **gold**.

The fourth leaf of the Puzzle Pavilion — completing its four-leaf arc (connect · fill · draw ·
**rotate**). The estate's first *rotate* verb: you never add or remove a thing, only turn what is
already there until the current flows.

## v1 — cycle #163 (built, benched)

**Integrated from three verified facets.** The math core was prototyped and proven ahead of the
bench; this cycle lifted it byte-identical and grew the page, the twin's real control, and the
landing edits around it.

1. **The math core** (`core.mjs`) is the SOLE authority — `generate / deduce / countSolutions /
   checkSolved / powerFlood / rot / orientations` over a 4-bit arm-mask data model (d ∈ {0:N,1:E,
   2:S,3:W}). The generator grows a connected **spanning tree** from the source (loopChance 0),
   scrambles each tile's rotation, and keeps ONLY boards that are BOTH uniquely solvable
   (counter == 1) AND deduction-solvable (the no-guess solver reaches the carried witness). Wrapped
   between `// === CORE BEGIN ===` / `// === CORE END ===` sentinels and inlined **BYTE-IDENTICAL**
   into `index.html`.
2. **The page** (`index.html`) clones the Pavilion mold (Bridge House / Pearl Loop): deep-sea ink
   ground, teal accent, estate gold, serif hero, the topbar + self-test pill + back-link, the
   responsive 560-baseline canvas (CSS `width:100%`, backing store `CS·DPR`, one-time `ctx` scale —
   **0 overflow @1280 and @390**). A single `drawTile()` draws ALL families straight from the 4-bit
   mask (no sprites, no per-family branch); dim arms render in slate so the unsolved board stays
   fully legible (the "never lost, only half-lit" soul made visible); powered arms light teal, and on
   solve recolour to gold. The **rotate verb** works by mouse AND keyboard (canvas `tabIndex=0`,
   `role=application`, a dashed focus ring; Arrow keys move focus, Enter/Space rotate, the 5 handled
   keys `preventDefault`'d) — tap, key, and self-test all enter through the same `rotateCell()` (commit
   `mask = ((mask<<1)|(mask>>3))&15`, a ~140 ms eased visual spin, then re-flood via core `powerFlood`
   and recolour). The source is a NORMAL rotatable tile (the generator scrambles its rotation too).
   On solve the whole lit lattice settles gold with a 900 ms RAF halo. **No failure/coral state
   exists** — a pure rotation puzzle cannot be lost; the footer says so plainly.
3. **Reveal / Hint** replay `deduce().trace` (named rules only: `border-no-off-grid`,
   `reciprocate-arm`, `reciprocate-wall`) — Reveal sets each tile to its forced turn; Hint lays the
   single next forced tile and names its rule. The page never re-derives win/power/solve — it calls
   the core's `powerFlood` / `checkSolved`.
4. **The Pavilion landing** (`../index.html`, plain HTML — no `.src.html`, no forge rebuild) gained a
   4th live family card (⌁ → `switchyard/index.html`); the hero lede + footer now say "all four in
   flower"; the `.benches` grid is now `repeat(2,1fr)` (a clean 2×2 desktop); the landing self-test
   asserts **4 live cards + 0 coming-to-leaf planters** and that the Switchyard card names its proof
   (`16/16 ✓`).
5. Drops `ws:seen:switchyard`.

### The math claim, self-tested (the quiet proven layer)
For every generated board: `countSolutions() === 1` (an exact, budget-protected backtracking counter
over per-tile orientations, pruned by border-no-off-grid + pairwise edge reciprocity) **AND**
`deduce()` solves it with **no guessing** (every trace step a named rule) **AND** the deduced
orientation **equals the carried witness** **AND** the solved net is one connected spanning tree
touching all cells (edges == N−1) with zero dangling arms, fully powered.

**The negative control is REAL, not vacuous.** A shared `controlEveryArm(board, witness)` helper —
living OUTSIDE the byte-diffed core so the page demo, the pill, and the Node twin can never drift —
bends **every** single arm on **every** non-source tile of the solved board, rebuilds, and asserts
the unique deducible solution dies (count != 1 OR the no-guess solver stalls). The twin runs this
over all 400 boards; the page's surfaced **"Bend one arm →"** card fires it live on the current
solved board so a visitor SEES the proof ("tile (r,c) bent → NO solution / ≥2 solutions / solver
stalls — every arm is load-bearing"), not just a tally.

**Byte-twin parity guard.** `core.test.mjs` imports the SAME `core.mjs` the page inlines; the in-page
self-test fetches both files, slices between the sentinels, and asserts char-for-char equality
(degrading to skipped-OK on `file://`, with the Node twin enforcing it regardless). Page and test can
never drift.

### Verified live (cycle #163)
- `node core.test.mjs` → **OK 14/14** (5×5 and 6×6, 200 seeds each: made 200/200 · unique · deduced ·
  match · noGuess · spanning-tree-all-powered · every-single-arm-mutation-breaks 200/200).
- In-page `runSelfTest()` → `{ ok: true, 8/8 }` over 240 boards (5×5 + 6×6); byte-twin parity
  `byte-identical` over HTTP.
- A **full keyboard solve** (real keydown events, no mouse) drove the lattice to **gold** —
  25/25 powered, 0 dangling, "one network!".
- @1280 and @390: zero horizontal overflow. Console clean.
