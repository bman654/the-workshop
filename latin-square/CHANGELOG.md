# The Latin Square — CHANGELOG

The **fifth bench of the Numbers Room** (after The Best Rational ⅗, The Ulam Spiral ✦,
The Collatz Bench 🌳 and The Times-Table Cardioid ♥) — and the room's **first GAME**.
A self-contained, zero-dependency exhibit: `index.html` + `core.mjs` + `core.test.mjs`.

## v1 — 2026-06-15 (Opus 4.8 · cycle #38 builder, reviewed & published by the cycle-#38 publisher)

**What it is.** Five suit-like glyphs — ● circle/gold · ◆ diamond/teal · ▲ triangle/coral ·
✦ star/violet · ■ square/sky (each a distinct **shape *and* hue**, colorblind-safe) — must
each appear **once in every row and once in every column** of a 5×5 board. That is a *Latin
square*: the skeleton under every Sudoku, with the 3×3 box rule peeled away. The estate's
benches mostly PROVE a theorem you watch; this one hands you the theorem to **play** — a
genuinely playable, **winnable** deduction puzzle, the only board in the Numbers Room you win.

**Number theory as PLAY, not an equation.** Brandon's seed asked for "number theory as a
mini-game." The two exact facts the bench is built on are countable, not plotted:
- There are exactly **161,280** distinct 5×5 Latin squares.
- In **reduced** form (first row and first column in natural order) there are exactly **56**,
  and `161280 / (5! · 4!) === 56` — the reduced-count identity, asserted to the integer.

### The core (`core.mjs` — the single source of truth, 138 lines between sentinels)
- `mulberry32(seed)` · `shuffle` — deterministic, seed-pure generation.
- `fullSquare(seed)` — a random valid completed Latin square.
- `countSolutions(givens, cap=9)` — exhaustive backtracking solution count, capped.
- `deduce(givens)` → `{ solved, blanks, val, fillOrder }` — pure-logic solver. Every fill in
  `fillOrder` is **named** by its rule: `naked-single` (only one glyph fits a cell) ·
  `hidden-single-row` · `hidden-single-col` (a glyph fits only one cell of a line). **No step
  is ever a guess** — that is the bench's whole promise.
- `generate(seed)` — the **minimal dig**: remove a cell only if (a) the solution stays
  **unique** (`countSolutions === 1`) AND (b) `deduce()` still solves it from the remaining
  givens. Givens land in the range **6–10**.

### Self-verification — the bench proves its own claim
- **Node twin** `node core.test.mjs` → **GREEN 210/210** across 200 seeds: every generated
  board is **uniquely solvable** (200/200), **solvable by pure deduction** (200/200), the
  deduced grid is a **valid Latin square** (200/200) and equals the full solution (200/200);
  the **negative control** — pull a given — fires on **both** measures (count ≥ 2 AND deduction
  stalls) 200/200. Plus the exact constants 161280 & 56 and the reduced-count identity.
- **In-page badge** (runs after first paint via `requestIdleCallback`): **self-test 9/9 ✓ ·
  120 boards unique & logic-solvable · 1 control breaks both**.
- **Byte-identical inline.** `core.mjs` is inlined into `index.html` between
  `// === CORE BEGIN ===` / `// === CORE END ===` sentinels; the 136-line body is **identical**
  to the Node-tested file, so the page and the test **cannot drift**.

### The board (`index.html`)
- Radial mini-palette + keys **1–5** to place; explicit **pen / pencil** toggle + **auto-pencil**
  (fills candidates from the constraints); first-class corner pencil marks.
- **Live conflict feedback** — a coral cell + a thin twin conflict-line (allowed to sit), with a
  hard **dead** flag only on a zero-candidate contradiction.
- **HINT** places one logically-forced cell and **names its rule** from `fillOrder`
  ("naked single: only teal ◆ fits here — every other color already sits in this row or column").
- **"watch it think"** replays `deduce().fillOrder` step-by-step — no step ever says *guess*.
- **The Tightening** panel: pull any given and watch certainty break — the solution **count spins
  up** (capped "9+") and the **logic stalls** with a blank-count; put it back and it restores.
- **THE WIN = the invariant draws itself.** Per-row L→R and per-column T→B teal light-sweeps
  (10 total) + a ✓ tally ribbon on every row and column edge (10 total), then the exact-counts
  payoff line. All easings are gated behind `prefers-reduced-motion`, which takes an instant,
  complete static reveal instead.
- a11y: a "digits 1–5" overlay; bare-relative back-links to the Numbers Room; the
  `ws:seen:latin-square` breadcrumb on visit.

### Integration into the Numbers Room
`numbers-room/index.html`: `.benches` `repeat(4)`→`repeat(5)`; `max-width` 1180→1400 on the hero /
benches / footer; media queries reflowed (5-across ≥1400 · 3 ≤1280 · 2 ≤860 · 1 ≤560); the 5th
`.bench` card added (glyph ▦, `href ../latin-square/index.html`); lede "Four benches"→"Five
benches"; footer "Four benches…Three prove"→"Five benches…Four prove"; the room self-test grew
to **13/13** (benches.length 5, the Latin Square href check added).

### Publisher fresh-eyes review (cycle #38)
Served on an uncommon port (`:8771`, torn down by exact PID) and opened both surfaces in a
uniquely-named agent-browser session (`ls-review-c38`). The bench: **self-test 9/9 ✓**, **0
console errors**, **0 nested anchors**, **0 horizontal overflow** @1280 (scrollW 1265) & @390
(375); the HINT named its rule correctly; a full hint-driven solve fired the win — **10 sweeps +
10 ribbons + the payoff line** ("one of 161,280 … reduced form exactly 56"), confirming the
builder's win-FX fix (a trailing `render()` no longer stomps the reveal — `drawOverlay()`
early-returns once `won`). Mobile (390) stacks cleanly. The front-door Numbers Room: **self-test
13/13 ✓**, **0 nested anchors**, **0 overflow**, all five benches pack one row @1440, the Latin
Square link resolves, lede/footer updated. The reduced-motion branch was verified by source
(`RM` → instant complete reveal, transitions disabled); CDP media-emulation did not engage in
this agent-browser build (a tooling limitation, not a page defect). No bug filed; no spark.
