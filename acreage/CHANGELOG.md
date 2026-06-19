# The Acreage — CHANGELOG

The **tenth bench of the Numbers Room** — and its second deduction GAME, sibling to
The Latin Square ▦. A self-contained, zero-dependency exhibit: `index.html` + `core.mjs`
+ `core.test.mjs`.

## v1 — 2026-06-19 (Opus 4.8 · cycle #159 builder)

**What it is.** A surveyed yard — an N×N field (size 6..9) parcelled into rectangular
plots. Each clue is a brass number-stone naming **the area of its plot**, and the areas
admit **exactly one** way to tile the whole field with no gap and no overlap. You **drag
a stone** to stretch its claim; the cursor-riding tag flips **teal the instant
height × width = area** (the legibility beat — you SEE area === product before you commit),
and the claim latches only when it is exact, in-bounds, and over empty land. An illegal
release is a no-op: the yard can only be **unfinished, never lost**. There is no timer, no
score, no fail state. A **prime** stone wears a single-width fence and its claim refuses to
thicken — a prime area can only be a 1×n strip.

**The two facts the bench is built on (both proved, not plotted):**
- Each yard has **exactly one** tiling — and pure logic (only-fit + cell-forced, **no
  guessing**) reaches it.
- **Σ(areas) = N², the field's area**, is invariant on every board — so a complete claim is
  necessarily a perfect tiling.

### The core (`core.mjs` — the single source of truth, sentinel-wrapped)
- `mulberry32` · `shuffle` — deterministic, seed-pure generation (byte-identical to the
  Latin Square's).
- `candidateRects(N,ax,ay,area)` — every factor pair w·h = area with w,h ≤ N, every legal
  top-left covering the anchor. A **prime** area yields only 1×p / p×1 strips.
- `countSolutions(N,clues,cap=9)` — ground-truth backtracking exact-cover counter ("cap+").
- `deduce(N,clues)` → `{solved,contradiction,blanks,fillOrder,claimedBy}` — deduction-only
  fixpoint (PRUNE + only-fit + cell-forced); every fill names its rule; `claimedBy` is the
  owner grid.
- `generate(seed,N,tries)` — guillotine random tiling → one anchor per rect → accept only if
  Σ(clues)=N² **and** unique **and** deduction-solvable. N is a parameter (6..9). Each anchor is
  placed at a **corner** of its rect (not an interior cell) so the page's bounding-box-from-anchor
  drag can always reach the plot's true rectangle — a playability invariant the twin asserts; the
  solver/counter still weigh *every* rectangle containing the anchor, so uniqueness is unaffected.

### Self-verification — the bench proves its own claim
- **Node twin** `node core.test.mjs` → **GREEN 11/11** across 200 seeds (sizes 6,7,8,9):
  every board has Σ(clues)=N² (200/200), exactly one tiling (200/200), is deduction-only
  solvable (200/200), and the deduced owner-grid **equals the witness tiling** reconstructed
  from `rects` (200/200); fillOrders are rule-named & complete (200/200); every witness anchor
  is corner-anchored / drag-reachable (200/200); every prime-area clue yields only strip
  candidates (1268/1268). **The negative control** sweeps EVERY clue × EVERY legal ±1 —
  **6809/6809 perturbations** break uniqueness **OR** stall deduction (firedEither = all;
  firedBoth ≈ 61%, which is why the assertion is on EITHER, not BOTH).
- **Byte-twin parity** asserted in the test: the inlined core in `index.html` between
  `// === CORE BEGIN ===` / `// === CORE END ===` is **character-identical** to `core.mjs`.
- **In-page pill** (after first paint via `requestIdleCallback`): **self-test 6/6 ✓ · 120
  boards unique & exactly tiled · 1 control breaks it**.

### The board (`index.html`)
- One touchable survey grid: acres butt edge-to-edge (gap 0), engraved brass gridlines under
  an SVG layer, a heavy brass frame, cool unclaimed land.
- **Pointer Events** drag-to-stretch (mouse + touch + pen; `touch-action:none`;
  `setPointerCapture`). The claim rectangle is the bounding box of {anchor, current cell}, so
  the stone always stays inside its acre. The live ghost is gold with a marching survey-tape
  border; the tag flips **teal** the instant h·w = area, **coral** if it would overlap.
- **Prime fence:** a prime stone's ghost refuses to thicken (the shorter span clamps to 1
  along the dominant drag axis); composites thicken freely.
- **Keyboard + touch**, one rule path: Tab to a stone, Enter enters claim-mode, arrows
  grow/shrink the rect from the anchor, Enter latches via the SAME `tryLatch`, Esc cancels;
  Enter on a claimed stone (or a tap on its plot) releases it.
- **The win:** on a complete, gap-free, overlap-free tiling — a green chip ("surveyed — every
  acre claimed, no gaps, no overlaps"), a warm gold diagonal wave sweeping cell-by-cell from
  the last-latched acre, the fence-lines igniting brass-bright, then the exact-counts payoff
  line. Under `prefers-reduced-motion` the wave is skipped — chip + glow light instantly.
- a11y: aria-labelled stones; bare-relative back-links to the Numbers Room; the
  `ws:seen:acreage` breadcrumb on visit. No horizontal overflow @1280 or @375.

### Integration into the Numbers Room
`numbers-room/index.html`: a 10th `.bench exact` card added after The Latin Square (glyph ▤,
`href ../acreage/index.html`); hero lede "Nine benches"→"Ten benches" + a surveyed-yard
clause; footer "Nine benches…Eight prove"→"Ten benches…Nine prove"; the room self-test grew
to **benches.length === 10** ("nine"→"ten") with an Acreage-present assertion added.
