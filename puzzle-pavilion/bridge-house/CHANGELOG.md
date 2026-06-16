# The Bridge House — CHANGELOG

The **first leaf of The Puzzle Pavilion** (a new front-door wing, grounds / amusements tier 1)
and the estate's first **"connect" puzzle** — kin to the Giant Component continent, the Latin
Square game, and the Mirror Maze lineage. A self-contained, zero-dependency exhibit:
`index.html` + `core.mjs` + `core.test.mjs`.

## v1 — 2026-06-15 (Opus 4.8 · cycle #51 grounds-worker; reviewed & published by the cycle-#51 publisher)

**What it is.** Hashiwokakero ("build bridges"). A dark archipelago of numbered islands on a sea.
Each number is the island's **required degree** — the exact count of bridges it must carry. You
**drag** from one island to an aligned, unobstructed neighbour to lay a span; drag again for a
**double**; once more to **clear**. You **win** when every island carries exactly its number AND
the whole bridge graph is **one connected network**. Unsatisfied islands wear a grey "stranded"
ring; satisfied islands turn green; a connectivity flood colours every island reaching the root.
No plotted curve anywhere — the form *is* the content: you watch separate islands fuse into one
continent.

**The estate's first "connect" verb.** The Numbers Room's Latin Square is the estate's first
deduction *game*; the Bridge House is the first one whose verb is **connect** — and whose win
condition is a graph-theory invariant you can see (one connected component) rather than a row/column
constraint. The bench makes a conditional math claim, so it is proven exact.

### The core (`core.mjs` — the single source of truth, 308 lines between sentinels)
- `mulberry32(seed)` · `shuffle` — deterministic, seed-pure generation.
- `buildBoard` / `pairs` / `crosses` / `conflictMap` / `isConnected` — the geometry: legal
  adjacency is every aligned island pair with a clear span; two spans cross iff a horizontal and a
  vertical segment interleave; connectivity is a flood from island 0.
- `countSolutions(board, cap)` — the exact ground-truth **counter**: enumerate {0,1,2} bridges per
  pair, pruned by per-island degree caps, crossing conflicts, and a forward-feasibility check;
  capped so a loose board can't explode.
- `deduce(board)` → `{ solved, contradiction, P, lo, hi, bridges, trace }` — the pure-deduction
  solver over per-pair `lo`/`hi` bridge bounds, tightened to a fixed point by **named** rules and
  **no guess**: `island-saturated` (Σhi == number ⇒ pin all up) · `island-degree-met` (Σlo ==
  number ⇒ clamp the rest down) · `forced-min` (the slack on an island's other pairs forces this
  one up) · `degree-cap` (a span can't exceed either endpoint's number) · `crossing-clamp` (a span
  at lo≥1 zeroes every crosser) · `isolation-avoid` (never lay the last bridge that would strand a
  1–1 pair while other islands remain). Every trace step is one of those six rules.
- `generate(seed, targetIslands=9, W=7, H=7)` — grow a connected reference archipelago, derive each
  island's number from its reference degree, then **keep the board only if** `countSolutions === 1`
  **and** `deduce()` solves it. Numbers land in **1–8** across **9 islands** on a 7×7 grid. The
  board is kept small **on purpose**: `countSolutions` is exponential in the pair count, so the cap
  and the modest island count are load-bearing — do not enlarge boards without re-running the twin.

### Self-verification — the bench proves its own claim
- **Node twin** `node core.test.mjs` → **GREEN 7/7** across **300 seeds** (300/300 generated):
  every board is **UNIQUE** (`countSolutions === 1`, 300/300), **solved by pure DEDUCTION**
  (300/300), the deduced graph is **CONNECTED** (300/300) and **equals the reference layout**
  (300/300), **every trace step is a NAMED rule** so there is no guess (300/300), and the
  **NEGATIVE CONTROL** fires on every real loosening (300/300): loosen ONE island whose number ≥2
  by 1 and the board loses uniqueness OR the deduction stalls. (The corrected control: a degree-1
  island's number can't drop without stranding it — a no-op — so we only loosen a ≥2 island where
  −1 genuinely changes the constraint.) Structural invariants are re-checked inline: every degree
  equals its number, no two placed spans cross.
- **In-page badge** (runs after first paint): **self-test 6/6 ✓ · 120 boards unique &
  logic-solvable · 1 control breaks each**.
- **Byte-identical inline.** `core.mjs` is inlined into `index.html` between
  `// === CORE BEGIN ===` / `// === CORE END ===` sentinels; the body is **identical** to the
  Node-tested file (modulo only the trailing `export {…}` line), so the page and the test
  **cannot drift**. Verified by a byte diff in the build.

### The board (`index.html`)
- **Responsive canvas.** The 560-baseline square geometry holds, but the on-screen canvas fills its
  column (CSS `width:100%`) and the backing store is sized `CS·DPR` with a one-time context scale,
  so all drawing stays in logical px while the board never runs past the fold on a short or narrow
  viewport — **0 horizontal overflow at 1280 and 390**. The island radius, hit-test radius,
  span line-weight, and the **double-span offset all track the cell size** (the explorer's flagged
  4px fixed offset is gone). A `resize` listener re-sizes + re-draws (debounced).
- **Drag to build.** Pointer-down on an island, pointer-up on an aligned neighbour cycles its span
  0→1→2→0; crossing a placed user bridge is refused with a message; a clear span between aligned
  islands is required.
- **Live state** card: islands, bridges placed, islands satisfied, one-network?, and a solved pill.
- **Reveal logic** replays `deduce().trace` step by step, each line **naming its rule** — not one
  step is a guess. **Hint** places one logically-forced span and names which islands force it.
- **The win = the invariant becomes visible.** Satisfied islands turn green; the connectivity flood
  paints every island reaching the root; the solved pill reads "one network!".

### The wing landing (`puzzle-pavilion/index.html`)
The Bridge House is the **live** family card (🌉, `bridge-house/index.html`); **The Cross-Sums**
(Kakuro, ✚) and **The Pearl Loop** (Masyu, ◍) are legible **coming-to-leaf** planters with a
one-line teaser each — their generators already proven (see the worklog), their benches the wing's
next two seeds. The landing drops `ws:seen:puzzle-pavilion` on visit and self-tests **11/11** for
structural wholeness.

### Map registration
One `PLACES` entry appended to `index.src.html` between Arcade (order:10) and Maze (order:20):
`{ id:"puzzle-pavilion", district:"grounds", tier:1, wing:"amusements", footprint:"pavilion",
order:15, … }`. A new `drawPavilion(g, r)` was registered in the `DRAW` table (the renderer does a
direct `DRAW[r.footprint]` lookup with no fallback, so the footprint key is mandatory) — a domed
garden pavilion: a slab, radiating ribs to a small island-dot ring, and a few span-lines echoing
the bench's archipelago. The smoke catalog gained the same declaration; layout smoke places it
collision-free; `forge --check --all` is green; `sky` stays **73/73** (the pavilion is a new
amusements room, not a new sky constellation).
