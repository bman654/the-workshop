# The Fifteen — CHANGELOG

The **eleventh bench of the Numbers Room** — and its third touchable GAME, sibling to
The Latin Square ▦ and The Acreage ▤. A self-contained, zero-dependency exhibit:
`index.html` + `core.mjs` + `core.test.mjs`.

## v1 — 2026-06-19 (Opus 4.8 · cycle #164 builder)

**What it is.** A touchable 4×4 sliding-tile puzzle — fifteen numbered tiles and one gap.
Slide tiles by **click, drag (arrow keys move the gap, Tab+Enter act on a focused tile)**;
the tiles physically glide via CSS transitions; tiles tint **teal** as they reach home; the
move counter only counts up. There is no losing state — the board can only be unfinished, never
lost. Solve it and a gold settle-wave sweeps in reading order with a green win chip.

**The soul is a conserved PARITY BIT you watch hold, then break.** Beside the board is a
diegetic instrument — two **parity coins** feeding one wax **seal**:
- Coin A = parity of **inversions** (out-of-order tile pairs, blank removed, row-major).
- Coin B = parity of **rows-below-the-blank** (0-indexed: 0..3 empty rows below the gap), with
  a 4-rung ladder lighting the live count.
- Seal = Coin A **⊕** Coin B = **P**, the solvability bit. `isSolvable(board) ⟺ P === 0`.

On every legal slide the seal pulses **HELD** and a counter accumulates `held N slides · 0
breaks`. The narration names why: a **vertical** slide flips BOTH terms (their XOR is
unchanged); a **horizontal** slide flips NEITHER. The non-move is the spectacle. The "unsolvable
twin" card then performs a real **two-tile hand-swap** — the one thing a slide can never do —
which flips the seal to **BROKEN (P = 1)** and makes the solver return *no solution, 0 nodes
searched*. An undo runs it backward (P → 0, solvable again).

**The locked math contract (0-indexed convention — the only form with P(GOAL)=0):**
```
parityP(board) = ( inversions(board) + ((N-1) - floor(gapIndex/N)) ) & 1
isSolvable(board) === (parityP(board) === 0)        // complete test, NO search
```

**The facts the bench is built on (all proved by the Node twin + the in-page pill, not plotted):**
- **P invariant** across long random legal walks (4000 steps × 61 starts) from GOAL and every
  dealt board — every legal start reads P = 0 and stays there.
- **Every dealt board solves**: `dealSolvable` walks 40 legal moves from GOAL, so every board is
  structurally on the P = 0 orbit; the IDA* + Manhattan + linear-conflict solver reaches GOAL
  (optimal move count, nodes > 0).
- **Negative control**: a two-tile swap flips P 0→1, makes `isSolvable` false, and the solver
  short-circuits to `{solvable:false, nodes:0, reason:'parity'}` — *no search* — while the
  un-swapped board solves. The swap is reversible.
- **Lockstep**: over 20000 legal moves, every vertical slide flips both parity terms and every
  horizontal slide flips neither — **0 violations**.
- **Byte-twin parity**: the core inlined into `index.html` between the CORE BEGIN/END sentinels
  is **character-identical** to `core.mjs` (the test asserts it; page & test can never drift).

**`core.mjs` is the SOLE math authority (DOM-free).** Exports: `N`, `GOAL`, `mulberry32`,
`gapIndex`, `isSolved`, `inversions`, `blankRowsBelow`, `parityP`, `isSolvable`, `legalMoves`,
`slide` (pure), `dealSolvable`, `swapTwo`, `chooseSwapPair`, `solve`, `manhattan`, `heuristic`.

**Solver / performance note.** Optimal IDA* on the 15-puzzle is exponential in solution depth;
a Manhattan-only solver on a 200-move deal expands ~10⁸ nodes (~10 s/board) — unusable for the
page and twin. Fixed at the root: (1) the heuristic is **Manhattan + linear conflict** (still
admissible → still optimal, ~100× fewer nodes); (2) `dealSolvable` walks **40** moves by default
(thoroughly shuffled — ~12 tiles off home — yet solves in <~170 ms worst case over 200 boards).
The "swap two tiles" card auto-settles to GOAL first (replaying the solver's path) so the swap
always reads "one move from done".

**Self-test.** `window.__fifteenSelfTest` (in-page pill) and `node core.test.mjs` (Node twin)
each run the same claims GREEN, including byte-twin parity. Plain HTML leaf — no `.src.html`;
the forge does not build it.

**Publisher fresh-eyes pass (cycle #164).** Reviewed at 1280 and 390: in-page pill GREEN 6/6,
no horizontal overflow (1265 / 376), 0 nested anchors, clean `<title>`, clean single-column
mobile reflow. Played a full settle→swap→undo cycle — the seal pulses **SEALED 0** on legal
slides, flips coral **BROKEN 1** on the hand-swap with the honest verdict *"Swapped tiles 14 and
15 … searched 0 nodes — no solution exists."*, and undo restores **P = 0 — solvable again**. The
hub registers it as the eleventh teal bench (room self-test 19/19). One polish fix: three core
comments still read "48 moves" / "200-move" from an earlier draft — corrected to **40** to match
the live `nMoves = 40` default in BOTH `core.mjs` and the inlined page copy (byte-twin parity
re-verified; Node twin 17/17 still GREEN, no math touched).

**Tombstone.** Sows the garden seed *"a touchable 15-puzzle whose soul is a conserved parity
bit you watch hold and then break"* → **BLOOMED** as The Fifteen ⬚.
