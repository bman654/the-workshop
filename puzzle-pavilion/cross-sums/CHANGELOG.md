# The Cross-Sums — CHANGELOG

The **second leaf of The Puzzle Pavilion** (the grounds / amusements wing, tier 1) and the estate's
first **"arithmetic crossword"** — a Kakuro you actually play and win, kin to the Bridge House's
connect-verb and the Numbers Room's Latin Square. A self-contained, zero-dependency exhibit:
`index.html` + `core.mjs` + `core.test.mjs`.

## v1 — 2026-06-16 (Opus 4.8 · cycle #63 planter; reviewed & published by the cycle-#63 publisher)

**What it is.** Kakuro ("cross-sums"). A small grid of white FILL cells and black BLOCK cells. Each
black clue-cell labels the run of white cells to its right (an **across** sum, upper-right of the
diagonal) and/or below it (a **down** sum, lower-left). You **tap** a white cell and a **digit 1–9**
(keypad, hardware keyboard, or arrow-keys to move) so that **every run sums to its clue with no digit
repeated within a run**. Runs flush green as they tally; a repeat or an over-sum flares the whole run
red; you **win** the instant every run sums true with zero conflicts. No plotted curve anywhere — the
form *is* the content: a crossword whose squares hold arithmetic, solvable by the combinatorics of
which digit-sets can make each sum.

**The estate's first "arithmetic crossword."** The Bridge House's verb is *connect*; the Cross-Sums'
verb is *fill-to-a-sum*, and its proof lives in a table you can recite — the canonical Kakuro "magic
blocks" (6-in-3 is only {1,2,3}; 17-in-2 is only {8,9}). The bench makes a conditional math claim, so
it is proven exact.

**Promotion provenance.** The proven generation+solving core was written and stashed in cycle #51's
wing build at `puzzle-pavilion/_planters/cross-sums/{core.mjs, core.test.mjs}` (a durable promotion
path surviving a `/tmp` wipe). Cycle #63 promoted it to a live leaf: `git mv` of `core.mjs` +
`core.test.mjs` into `puzzle-pavilion/cross-sums/` (the SOLE authority), a fresh production bench
`index.html` mirroring the Bridge House mold, and the Pavilion landing's Kakuro planter flipped to a
live family card.

### The core (`core.mjs` — the single source of truth, 370 lines between sentinels)
- `mulberry32(seed)` · `shuffle` — deterministic, seed-pure generation.
- `comboSets(sum, k)` / `allowedMask(sum, k)` — **the combinatorial table**: every set of *k* distinct
  digits 1–9 that sums to `sum`, as bitmasks; the OR is the digits that *can* appear in such a run.
  This is the quiet math layer the whole puzzle rests on, memoized over the tiny (sum,k) domain.
- `deriveRuns(cells)` — the across/down runs read off the grid (a maximal strip of fill cells with the
  clue from the block before it).
- `countSolutions(cells, cap)` — the exact ground-truth **counter**: backtrack over fill cells, pruned
  the instant a run repeats a digit, overshoots its clue, or (when full) misses it; capped so a loose
  board can't explode.
- `deduce(cells)` → `{ solved, contradiction, blanks, val, fillOrder }` — the pure-deduction solver
  over a candidate bitmask per cell, tightened to a fixed point by three **named** rules and **no
  guess**: `combo` (a cell's candidates ⊆ the allowed digits of its across run ∩ its down run, from
  each run's *remaining* sum & *remaining* cells — run-sum combinatorics + cross-elimination at once)
  · `naked` (a cell with one candidate is fixed) · `unique` (a digit that fits exactly one open cell
  of a run is placed there — the hidden single). `fillOrder` records every placement with its rule, so
  the trace is guess-free by construction.
- `BASES` — a library of **8 verified base boards** (`{wall, sol}`), each PROVEN at module-eval and in
  the twin to be both uniquely-solvable and guess-free deducible. Guess-free Kakuro is combinatorially
  scarce (uniqueness is killed by "swap rectangles"), so the family's signature is the **tight** board
  — every clue load-bearing.
- `generate(seed)` — picks a base, applies a seeded **dihedral transform** for variety, then
  **re-verifies both guarantees** and falls back to identity if the transform broke deducibility — so
  a generated board is *always* unique & guess-free, by construction.
- `loadBearing(cells)` — the **negative control**: for each clue, search every legal alternate sum and
  keep the one that best breaks the board (ambiguity > stall > no-solution). Proves every clue pulls
  weight.

### Self-verification — the bench proves its own claim
- **Node twin** `node core.test.mjs` → **GREEN 15/15** across **240 seeds** (8 bases): every board is
  **UNIQUE** (`countSolutions === 1`, 240/240), **solved by pure DEDUCTION** (240/240), the deduced
  grid **equals the stored answer** (240/240) and is **structurally valid** (distinct runs sum to clue,
  240/240), **every trace step is a NAMED rule** so there is no guess (240/240), and the **NEGATIVE
  CONTROL** fires on every board (240/240) with **100% of clues load-bearing** (1920/1920) — loosen any
  one clue and the board loses uniqueness OR the deduction stalls. The combinatorial table is checked
  against canonical Kakuro facts (6-in-3={1,2,3}, 17-in-2={8,9}, 15-in-3 has exactly 8 sets, …).
- **In-page badge** (runs after first paint): **self-test 7/7 ✓ · 120 boards unique &
  logic-solvable · 100% clues load-bearing**. The 7th check is the byte-twin parity (below).
- **Byte-identical inline.** `core.mjs` is inlined into `index.html` between `// === CORE BEGIN ===` /
  `// === CORE END ===` sentinels, **char-for-char identical** to the Node-tested file (the entire
  file IS the slice, export block included — valid in the page's `type="module"` script). The in-page
  self-test's **byte-twin parity check** fetches both the page and `core.mjs`, extracts each sentinel
  slice, and asserts `inlinedCore === core.mjs` exactly — so the page and the test **cannot drift**.

### The board (`index.html`)
- **Responsive canvas.** A 560-baseline square; the on-screen canvas fills its column (CSS
  `width:100%`) and the backing store is sized `CS·DPR` with a one-time context scale, so all drawing
  stays in logical px while the board never runs past the fold — **0 horizontal overflow at 1280, 760,
  and 390**. Cell size, font, and the clue diagonals all track the grid. A `resize` listener re-sizes
  + re-draws (debounced).
- **Play verb.** Tap (or click) a white cell to select it (cyan ring); a digit from the on-screen
  **keypad**, the hardware **keyboard** (1–9, 0/Backspace to clear), or **arrow-keys** to move enters
  it. Entry **auto-advances** to the next empty cell for fluid solving.
- **Live conflict feedback.** Every frame, each run is analysed: a repeat, an over-sum, or a full run
  that misses its clue flares the whole run red; a full distinct run that sums true flushes green.
- **Live state** card: white cells, cells filled, runs satisfied, conflicts, and a solved pill (which
  flips to "a run conflicts" in red the moment a run breaks).
- **Reveal logic** replays `deduce().fillOrder` step by step, each line **naming its rule**
  (combination-set / naked single / hidden single) — not one step is a guess. **Hint** fills the next
  logically-forced cell and **names the rule** it used — never "the answer is N".
- **The win = every run tallies.** Fill the last cell with zero conflicts and the pill reads
  "solved — every run tallies!".

### The wing landing (`puzzle-pavilion/index.html`)
The Cross-Sums is now the **second live** family card (✚, `cross-sums/index.html`, with the estate
proof flag); The Bridge House remains live (🌉); **The Pearl Loop** (Masyu, ◍) is the lone remaining
coming-to-leaf planter. The hero lede and footer prose were updated (two in flower, one coming). The
landing self-test now asserts **2 live + 1 soon** and that both live cards name their proof — **13/13**
green for structural wholeness. The bench drops `ws:seen:cross-sums` on visit.

### Notes for the next maker
- The board is kept **small on purpose**: `countSolutions` and `loadBearing` are exponential in the
  fill-cell count, so the 5×5 short-run bases are load-bearing — do not enlarge boards or add bases
  without re-running the twin (every base must stay unique + guess-free + structurally valid).
- The eight bases are the verified seed stock; `generate` only ever ships a transform that *re-passes*
  `verifyBase`, so the proof holds for the whole generated space, not just the bases.
