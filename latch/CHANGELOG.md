# Latch — Changelog

## Build 1 — 2026-06-12

The workshop's first **logic puzzle**: a generative **nonogram (picross) atelier**.
Single self-contained vanilla HTML/CSS/JS file (`latch/index.html`, 1408 lines, no
dependencies / no network / no build step).

### What shipped
- **Seeded generative nonograms** from a curated motif library, three sizes:
  Tiny (5×5), Classic (10×10), Big (15×15). Every motif is a hand-authored pixel
  bitmap; the seed selects one and may horizontally mirror it for variety.
  - **Motif inventory (30 motifs):**
    - 5×5 (12): heart, key, star, sail, fish, house, cup, cross, bell, boat, mug, kite
    - 10×10 (10): cat, key, anchor, mushroom, sailboat, clover, bell, crown, heart, fish
    - 15×15 (8): rocket, tree, heron, butterfly, mug, spiral, cup, fox
  - All 30 motifs are directly logic-solvable (verified 12/12, 10/10, 8/8). The
    guaranteed fallback frame exists for safety but is **never** needed (0/900 in audit).

- **The correctness crux** — a pure constraint-propagation line-solver:
  - `solveLine(clue, cells)` enumerates every run placement consistent with the
    partial state and intersects them: a cell is forced only when EVERY consistent
    arrangement agrees. Sound and complete for a single line. (An overlap-method
    fallback exists for pathological lines but is never hit at these widths.)
  - `logicSolve(rowClues, colClues)` iterates `solveLine` over all rows + columns to
    a fixpoint. A full board ⇒ uniquely solvable by logic alone (the fixpoint reaching
    a full board IS the uniqueness proof, since solveLine only sets agreed cells).
  - **Generation contract:** draw a motif → build clues → `logicSolve` → ship ONLY if
    it solves to the exact picture with no guessing; otherwise mirror / next motif;
    always falls back to a guaranteed-solvable frame so it never ships a degenerate puzzle.

- **Built-in self-test on load** — green chip "logic-verified — 4/4 ✓", never ships red:
  1. **line-solver soundness** — 7 hand-crafted lines with known forced outputs
     (`[3]`/`[5]`/`[]`/`[4]` overlap, `[2,1]`, `[1,1,1]`, and a partial-state case).
  2. **sweep 240 puzzles** (80 × 3 sizes) — 100% logic-solvable AND logic-solve ==
     original picture (0 guesses, 0 mismatch).
  3. **uniqueness** — independent brute-force solution counter confirms exactly one
     solution on 24 Tiny puzzles.
  4. **seed determinism + style-invariance** — same seed ⇒ byte-identical puzzle
     across sizes; re-roll differs; cosmetic skin switch does NOT change the puzzle.

- **Real playable interaction:** left-click fill, right-click / shift / mode-toggle mark,
  axis-locked drag-to-paint, live clue dim/check-off on correctly-completed lines, Check
  (highlights contradictions + counts mistakes), Hint (reveals one logically-forced cell
  via a one-step `solveLine` pass — never a guess), Reveal / Reset / New (re-roll) / seed
  input, size selector. Honest win reveal: the picture blooms in the accent colour with a
  glow, gutters fade, and the motif name shows (e.g. "solved — a kite"). Keyboard niceties
  (f/x/h/c/n/r).

- **Three cosmetic skins** re-skin the same puzzle in place: Graphite (default),
  Blueprint (cyan-on-navy drafting), Parchment (warm paper + ink). Crux test #4 asserts
  the skin never alters the puzzle.

- **Persistence (`ws:` convention, all guarded in try/catch):** drops `ws:seen:latch` on
  load; raises `ws:best:latch` (largest size solved); sets `ws:flag:latch-clean` on a
  no-mistake solve. Fully playable from `file://` even when storage throws. No audio.

### Self-test results (this build)
```
PASS line-solver soundness — 7 lines
PASS sweep 240 puzzles logic-solvable — 240 puzzles, 0 guesses, 0 mismatch
PASS uniqueness (brute-force Tiny) — 24 puzzles, exactly 1 solution each
PASS seed determinism + style-invariance — same seed ⇒ identical; re-roll differs; skin is cosmetic
RESULT 4/4 — chip GREEN
```

### Browser verification (served from repo root, http://127.0.0.1:8770/latch/)
- Self-test chip GREEN "logic-verified — 4/4 ✓"; **0 console errors / 0 warnings / 0 page
  errors** across reloads, size churn, and all interactions.
- Solved a Tiny puzzle (seed `heron-test`, motif "a kite") via real pointer events →
  honest win reveal fired with the motif name and "a clean solve · no mistakes".
- Hint revealed exactly one logically-forced cell (row clue `[3]` forces the centre).
- Check after a deliberate wrong fill highlighted exactly 1 contradiction (shake + count).
- Re-roll changed the puzzle; re-entering `heron-test` reproduced byte-identical clues.
- Style-invariance confirmed: clue fingerprints identical across Graphite/Blueprint/Parchment.
- Drag-to-paint is axis-locked (painted a full row, 0 stray cells).
- `ws:seen:latch` written on load; `ws:best:latch=5` and `ws:flag:latch-clean` set after the
  clean Tiny solve.

### Notes
- Bug found & fixed during build (caught by the Node self-test harness before the browser):
  the picture grid uses `0` for empty while `logicSolve` returns `-1` (crossed-empty), so a
  raw `gridsEqual(solved, picture)` spuriously failed. Added `solvedMatchesPicture()` that
  compares on the filled predicate only. Before the fix the generator fell back to the frame
  on 100% of seeds; after, all real motifs ship. Also corrected two self-test expectations
  (`[2,1]` and `[1,1,1]` lines) that were wrong — the solver was right. Removed a dead
  `feasible()` DP helper that was never called. Replaced 3 non-logic-solvable motifs (two
  leaves, a snail) with solvable redesigns (sail, clover, spiral) so all 30 ship directly.

---

# Slitherlink — Changelog

## Build 1 — 2026-06-12

The workshop's **second logic puzzle** and a sibling to Latch: a generative
**Slitherlink** (Loop-the-Loop / Fences) atelier. Where Latch is line-run
deduction over a pixel grid, Slitherlink is **loop-topology** deduction — the
answer is a single closed curve. Single self-contained vanilla HTML/CSS/JS file
(`latch/slitherlink.html`, 1140 lines, no dependencies / no network / no build
step / **no audio** — a silent piece).

### What shipped
- **Seeded generative Slitherlinks**, three square sizes: Tiny (5×5),
  Classic (7×7), Big (10×10). Boards render as crisp SVG: a (R+1)×(C+1) dot
  lattice, faint cell backgrounds, serif clue numbers, wide invisible edge
  hit-zones, the loop as rounded glowing segments, and a muted ✕ for crossed-out
  edges.

- **The correctness crux** — two independent pure engines (no DOM), both
  exercised by the self-test, proving every shipped puzzle is **uniquely
  solvable by pure logic, no guessing**, the solution being **exactly one
  closed loop**:
  - **(a) A sound LOGIC SOLVER** — constraint propagation to a fixpoint over
    edge states {UNKNOWN, LINE, CROSS}. Three sound rule families, each firing
    only when the conclusion is forced: **clue saturation** (k==N ⇒ rest CROSS;
    k+u==N ⇒ rest LINE; over/under ⇒ contradiction), **dot-degree** (a vertex's
    LINE-degree must end at 0 or 2: 2 LINE ⇒ rest CROSS; 1 LINE + 1 UNKNOWN ⇒
    that UNKNOWN LINE; 0 LINE + 1 UNKNOWN ⇒ CROSS; >2 ⇒ contradiction), and
    **no-premature-closure** (a union-find over dots joined by LINE edges; an
    UNKNOWN edge whose endpoints are already in one LINE-component that does NOT
    yet contain all LINE edges is forced CROSS — it would orphan a sub-loop).
    A fully-decided valid-single-loop fixpoint IS the logic-solvability proof.
  - **(b) An independent BRUTE-FORCE solution counter** (the second witness) —
    an exhaustive DFS over edges in dot-major order with O(1)-incremental degree
    + clue maintenance, accepting a leaf iff `isSingleLoop` ∧ `cluesSatisfied`
    agree (the same helpers the win-check uses). Confirms exactly 1 solution on
    small boards. Built on a different basis than the logic solver.
  - **Generation contract:** grow a random **simply-connected, pinch-free
    region** (flood-growth, rejecting any cell that creates a hole, disconnects
    the blob, or makes a diagonal pinch) → its **perimeter is automatically one
    closed loop** → derive full clues → remove clues in seeded order, keeping a
    removal only while `logicSolve` still solves uniquely to the exact loop →
    ship only if it logic-solves with zero UNKNOWNs. Guaranteed-solvable
    rectangle fallback exists for safety but is **never** hit (0 fallback in the
    audit).

- **Built-in self-test on load** — green chip "logic-verified — 4/4 ✓", never
  ships red (runs headless in ~0.45s):
  1. **logic-solver soundness** — hand-crafted tiny boards: a 0-clue (all
     CROSS), a 1×1 clue-4 tiny loop, a 2×1 dot-degree case, plus 6 generated
     boards where every decided edge must agree with the true loop (never asserts
     a wrong edge).
  2. **generation sweep** — 96 puzzles (32 × {5×5, 7×7, 10×10}): each fully
     logic-solvable AND logicSolve's loop == the generated loop, a valid single
     loop, clues satisfied. **0 guesses, 0 mismatch, 0 fallback.**
  3. **uniqueness** — the independent brute-force counter returns exactly 1 on
     24 small boards (16 × 5×5 + 8 × 7×7).
  4. **seed purity / skin-invariance** — same seed ⇒ byte-identical puzzle
     across sizes; re-roll differs; cosmetic skin switch never changes the puzzle.

- **Real playable interaction:** left-click an edge cycles undecided ↔ drawn;
  right-click / shift-click toggles a ✕ cross-out. Live feedback: a clue dims
  when its LINE count is exactly satisfied and turns a warning colour when
  exceeded; a dot with LINE-degree > 2 (illegal branch) subtly flags. **Hint**
  reveals exactly one logically-forced edge (a single `logicSolve` pass seeded
  with the player's marks — never a guess). **Check** highlights edges that
  contradict the unique solution (+ counts mistakes, + surfaces over-degree
  dots). **Reveal** draws the full loop (honestly: it shows but does not "win").
  **Reset / New / seed input / size selector.** Keyboard: h/c/n/r. Honest win
  reveal: only the true unique single loop wins — the loop blooms in the accent
  with a glow, clues fade, verdict reads "solved — one loop, NN segments · a
  clean solve · no mistakes". A wrong closure (a valid loop that isn't the
  solution) does NOT falsely win.

- **Three cosmetic skins** reused verbatim from Latch — Graphite (default),
  Blueprint (cyan-on-navy drafting), Parchment (warm paper + ink) — re-skin the
  same puzzle in place; crux test #4 asserts the skin never alters the puzzle.

- **Persistence (`ws:` convention, all guarded in try/catch):** drops
  `ws:seen:slitherlink` on load; raises `ws:best:slitherlink` (largest size
  solved); sets `ws:flag:slitherlink-clean` on a no-mistake solve. Fully playable
  from `file://` even when storage throws.

- **Companion cross-link:** a `↗ Latch` link in Slitherlink's topbar and a
  matching `↗ Slitherlink` link added to Latch's topbar — the two logic puzzles
  cross-link. Front door untouched (still the curated 9 cards).

### Self-test results (this build)
```
PASS logic-solver soundness — 0-clue, dot-degree, tiny-loop + 6 boards
PASS sweep 96 puzzles logic-solvable — 96 puzzles, 0 guesses, 0 mismatch, 0 fallback
PASS uniqueness (brute-force witness) — 24 small boards, exactly 1 solution each
PASS seed purity + skin-invariance — same seed ⇒ identical; re-roll differs; skin is cosmetic
RESULT 4/4 — chip GREEN (~0.45s)
```

### Browser verification (served from repo root, http://127.0.0.1:8765/latch/slitherlink.html)
- Self-test chip GREEN "logic-verified — 4/4 ✓"; **0 console errors / 0 warnings /
  0 page-errors** across reloads, size churn, skin switches, and a full
  interaction battery (19 console entries, all `level:log`).
- Solved a 5×5 (seed `demo-A`) via real pointer events on the loop edges → honest
  win bloom fired ("solved — one loop, 20 segments · a clean solve · no mistakes").
  Also solved a 7×7 → `ws:best:slitherlink=7`, `ws:flag:slitherlink-clean` set.
- Hint added exactly one forced edge (a 0-clue cross-out), and it agreed with the
  unique solution.
- A deliberate wrong LINE edge → Check flagged exactly 1 contradiction (mistakes
  0→1, exactly 1 edge shook). Check on a correct partial reported 0. A degree-3
  branch flagged exactly 1 dot.
- Same seed reproduced a byte-identical puzzle (clue + loop fingerprint); skin
  switch (Graphite/Blueprint/Parchment) left the fingerprint identical.
- Reveal showed the loop but did NOT set the clean flag (honest); a non-solution
  valid loop did NOT win.
- Runs from `file://` too (chip green, board renders, storage degrades gracefully).
- Static SVG (no rAF loop, no setInterval) — inherently 60fps; only the CSS win
  bloom and brief class-driven flashes animate.

### Notes
- Real bugs found & fixed during the build (all caught by the Node self-test
  harness before the browser):
  1. **Boolean-coercion perimeter bug (the big one):** `regionPerimeter`'s
     in-region test returned a *boolean* `false` for out-of-bounds cells but a
     *number* `0` for in-bounds empties; `0 !== false` under strict compare
     falsely flagged grid-border edges as perimeter, producing odd-degree dots
     (an impossible "perimeter"). Result: `isSingleLoop` rejected every grown
     region and the generator fell back 100% of the time. Fixed by coercing the
     in-region predicate to a real boolean (`=== 1`). After the fix: 0 fallback.
  2. **Missing pinch rejection:** simply-connected regions can still self-touch
     at a diagonal corner (a degree-4 "pinch" → a figure-eight, not one loop).
     Added `regionNoPinch` (rejects any interior dot with a diagonal-only
     checkerboard of region cells) to the growth acceptance test.
  3. **Brute-counter state corruption:** the incremental `place()` short-circuited
     mid-update on an upper-bound violation, but the paired `unplace()` always
     undid the *full* update — corrupting the shared dot-degree / clue counters
     across sibling DFS branches, so the counter returned 0 solutions for every
     real board. Fixed `place()` to apply the complete update before evaluating
     validity (symmetric with `unplace`). Also re-pointed the counter to
     dot-major edge order with finalize-on-last-edge pruning, taking a 5×5 count
     from "hangs" to ~0.3ms and making 7×7 feasible (~2ms).

---

# Akari — Changelog

## Build 1 — 2026-06-12

The workshop's **third logic puzzle**: a generative **Akari (Light Up)** atelier.
Where Latch is line-run deduction over a pixel grid and Slitherlink is loop-topology,
Akari is a third distinct deduction flavour — **illumination / line-of-sight** reasoning.
Single self-contained vanilla HTML/CSS/JS file (`latch/akari.html`, 1468 lines, no
dependencies / no network / no build step / no audio).

### The game
An N×N grid of white floor cells and black walls (some numbered 0–4). Place **bulbs** on
white cells so (1) every white cell is lit (a bulb lights its row+column until a wall),
(2) no two bulbs light each other, and (3) each numbered wall has exactly that many
orthogonally-adjacent bulbs. The payoff is gorgeous: warm light floods the whole board on
solve, with glowing bulbs and rays running down every row and column.

### What shipped
- **Seeded generative Akari**, three square sizes: Tidy (7×7), Classic (10×10), Big (14×14).
  Size-aware wall density (~32–47%, scaling gently with N) keeps boards open yet reliably
  logic-solvable; no 2×2 all-wall blocks (kept pretty).
- **The correctness crux** — two independent engines, both exercised by the self-test:
  - A **sound LOGIC SOLVER** that never guesses. Cell states ∈ {UNKNOWN, BULB, EMPTY}. An
    inner `propagate()` fixpoint runs two sound rule families — **wall saturation** (a
    numbered wall forces its remaining neighbours when its bulb/unknown counts pin the
    number; 0-walls force all-EMPTY) and **illumination necessity** (an unlit cell whose
    only lighting candidate is a single UNKNOWN forces a BULB there; zero candidates ⇒
    contradiction). Placing a bulb propagates its no-mutual-sight EMPTY shadow. Wrapped
    around that, a **failed-literal probing** layer: tentatively assume each UNKNOWN cell
    is a BULB (then EMPTY) on a copy and propagate; if an assumption provably breaks, the
    cell is forced to the opposite value — a sound, no-guess deduction (the same "if a bulb
    here breaks, it can't be here" a human uses). Reaching a fully-decided valid fixpoint
    IS the logic-solvability proof.
  - An **independent BRUTE-FORCE solution counter** (the second uniqueness witness) — a DFS
    over white cells deciding BULB/EMPTY with the three Akari constraints as pruning,
    accepting a leaf only when the validity helpers agree. It does NOT call `logicSolve`.
    Capped (cap=1 distinguishes exactly-1 from ≥2).
  - **Generation contract (place → number → prove → ship):** place a wall layout → place a
    valid fully-lit, conflict-free bulb solution (greedy least-lit, mutual-sight-forbidden;
    several bulb placements tried per layout) → number all walls from the solution → verify
    the full board logic-solves to that exact solution → drop wall numbers in seeded order
    while `logicSolve` still uniquely reaches the solution. Ship ONLY if the reduced board
    logic-solves to the exact solution; a denser fallback exists but is **never** hit
    (0 fallback in audit).
- **Built-in self-test on load** — green chip "logic-verified — 4/4 ✓", never ships red:
  1. **logic-solver soundness** — hand-crafted tiny boards: a 0-wall forcing all neighbours
     EMPTY, a lone walled-in cell forcing a BULB, mutual-sight propagation + a two-bulb
     mutual-sight contradiction, plus soundness on 6 generated boards (every decided cell
     agrees with the true solution).
  2. **sweep 96 puzzles** (32 × 3 sizes) — 100% logic-solvable AND logicSolve bulbs ==
     generated solution AND the solution independently validates (fully lit / no mutual
     sight / walls satisfied). 0 mismatch, 0 fallback.
  3. **uniqueness** — independent brute-force counter returns exactly 1 on 24 small boards.
  4. **seed purity + skin-invariance** — same seed ⇒ byte-identical (wall+number+solution
     fingerprint); re-roll differs; cosmetic skin switch leaves the fingerprint identical.
- **Real playable interaction:** left-click toggles a bulb; right-click / shift-click cycles
  a ✕ "no bulb" pencil-mark. Live illumination feedback (the soul of Akari): lit floors glow
  warm, rays shoot down rows/columns to the wall, a bulb in mutual sight flashes a warning
  colour, and a numbered wall dims when satisfied / reddens when exceeded. Hint (asserts one
  logically-forced bulb or ✕), Check (flags bulbs/marks that contradict the unique solution
  plus structural mutual-sight / over-counted-wall contradictions, counts mistakes), Reveal
  (the money shot — board fully blooms), Reset, New / seed input, size selector. Keyboard
  h/c/n/r. Honest win: the whole board blooms with warm light and the verdict shows
  ("solved — NN lamps light every cell · a clean solve").
- **Three cosmetic skins** (Graphite / Blueprint / Parchment) reuse Latch's CSS-var system
  verbatim; skin never re-rolls the puzzle (crux test #4 asserts it).
- **Persistence (`ws:` convention, all guarded in try/catch):** drops `ws:seen:akari` on
  load; raises `ws:best:akari` (largest size solved); sets `ws:flag:akari-clean` on a
  no-mistake solve (Reveal records best but NOT the clean flag). Fully playable from
  `file://` even when storage throws.
- **Three-way puzzles cross-link:** `akari.html` links `↗ Latch`, `↗ Slitherlink`,
  `← workshop`; a matching `↗ Akari` link added to both Latch's and Slitherlink's topbars.
  Front door untouched (still the curated 9 cards; footer `puzzles` link unchanged).

### Self-test results (this build)
```
PASS logic-solver soundness — 0-wall, lone-bulb, mutual-sight + 6 boards
PASS sweep 96 puzzles logic-solvable — 96 puzzles, 0 guesses, 0 mismatch, 0 fallback
PASS uniqueness (brute-force witness) — 24 small boards, exactly 1 solution each
PASS seed purity + skin-invariance — same seed ⇒ identical; re-roll differs; skin is cosmetic
RESULT 4/4 — chip GREEN (~0.54s). Extra stress: 300/300 random boards solved (0 fallback,
0 unsound), 40/40 unique (brute counter, incl. cap=5 sanity).
```

### Browser verification (served from repo root, http://127.0.0.1:8771/latch/akari.html)
- Self-test chip GREEN "logic-verified — 4/4 ✓"; **0 console errors / 0 warnings /
  0 page-errors** across a full battery (seed change, all 3 skin switches, Hint, Check,
  both size changes) captured via an in-page console hook.
- Solved a 7×7 (seed `lumen-2024`, 11 lamps) via real pointer events on the solution's
  white cells → honest win bloom fired ("solved — 11 lamps light every cell · a clean
  solve · no mistakes"); wrote `ws:best:akari=7` and `ws:flag:akari-clean`.
- Hint added exactly one forced placement (delta = 1). A deliberate wrong bulb → Check
  flagged exactly 1 contradiction (mistakes 0→1); two mutually-seeing bulbs → Check
  reported "incl. 2 bulbs in mutual sight".
- Same seed reproduced a byte-identical puzzle; skin switch
  (Graphite/Blueprint/Parchment) left the solution fingerprint and seed identical.
- Reveal showed the solution and fully lit the board but did NOT set the clean flag
  (honest); it did record best size.
- Runs from `file://` too (chip green, board renders, storage degrades gracefully).
- Static SVG/DOM (no rAF loop, no setInterval) — measured 61fps idle; only the CSS win
  bloom and brief class-driven flashes animate.

### Notes
- Real bugs found & fixed during the build (all caught by the Node self-test harness
  before the browser):
  1. **Seeded-bulb soundness gap (a correctness hole):** `logicSolve` copied an `initial`
     state verbatim, so two pre-seeded bulbs that light each other were silently accepted
     as a non-contradiction — and `doHint` / probing build exactly such seeded states.
     Fixed by replaying every seeded BULB through the propagation path (which casts its
     EMPTY shadow and surfaces any mutual-sight collision). The self-test's two-bulb
     mutual-sight case now correctly reports a contradiction.
  2. **Logic solver far too weak (the big one):** with only wall-saturation +
     single-candidate illumination, the *fully-numbered* board logic-solved just ~7% at
     7×7, ~0.8% at 10×10, and **0%** at 14×14 — so generation fell back constantly (35/96
     fallbacks, 14 boards unsolved even with every clue). Diagnosed by instrumenting the
     per-stage hit rate. Fixed by (a) adding the **failed-literal probing** layer (sound,
     no-guess lookahead) and (b) discovering wall **density** is the dominant lever
     (frac 0.20 → 0% solvable; 0.42 → ~80%; 0.50 → ~95%) and raising the layout to a
     size-aware ~32–47%. Combined: full-board solve rate jumped to ~70–95% and the sweep
     went to **96/96 logic-solvable, 0 fallback**.
  3. **Wall-free fallback board surfaced the density bug:** the first stalled sweep board
     was a 14×14 with all 196 cells UNKNOWN — the canned last-ditch fallback (a wall-free
     field) had been reached because the main + fallback loops exhausted their tries. This
     made the real problem (solver weakness + low density, above) visible; once fixed, the
     fallback path is never reached.

---

# The Warehouse — Changelog

## Build 1 — 2026-06-18

The wing's **fourth room** and its first that can be **LOST**: a self-contained,
playable **push-only Sokoban**. Where Latch is line-run deduction, Slitherlink is
loop-topology, and Akari is illumination, the Warehouse is the canonical *"the solver
can lose"* puzzle — shove a crate into an unrecoverable corner and the room is dead,
proven so. Three files on the latin-square CORE-sentinel mold (no `.src.html`, so not a
forge target): `latch/warehouse.html` (1276 lines), `latch/warehouse.core.mjs` (313
lines, the DOM-free authority), `latch/warehouse.core.test.mjs` (155 lines, the Node twin).

### What shipped
- **Push-only movement** — the porter can only PUSH a crate, never pull. A crate shoved
  into a corner (or a frozen cluster / wall-line) is welded there forever. Arrows or WASD
  to walk, an on-screen D-pad for touch, U to undo (exact — history carries a `pushed`
  flag so the push count rewinds), R to reset, Esc to blur.
- **Three authored rooms + a dead room:**
  - **L1 The Single Crate** — 2 pushes (the on-ramp).
  - **L2 Two Pads** — 4 pushes (the first room you can soft-lock).
  - **L3 Around the Corner** — 5 pushes.
  - **The dead room (Sealed Pad)** — a hand-authored board that an independent BFS proves
    **unwinnable** (the caption reads "solvable in NONE — every path dies"). It is dead by
    *global* search, not by any local freeze, so it raises **no** deadlock banner and has
    **zero** frozen crates — a deliberately distinct flavour of "lost", kept distinct in
    both the code and the copy.
- **The soul moment — a deadlock you can SEE.** The instant a non-goal crate becomes
  frozen on both axes, it **desaturates** (the warm grain drains to welded grey), recoils
  with a freeze keyframe, and a non-modal `aria-live` banner slides in under the board:
  *"That box can't be pushed back. The room is now unwinnable — press R to reset."* The
  first time ever, a second italic line appears: *"— this is the thing. No other puzzle
  here could do that to you."* The Reset button picks up a pulsing coral **beckon**. No
  other puzzle in the wing can do that to you, and the piece knows it.
- **Honest win bloom.** All pads covered ⇒ the board glows gold and a verdict reads
  e.g. *"solved — every pad covered · Room 1 · 2 pushes · no resets · a clean, tight
  solve"* (the "clean, tight" tail only when the solve hit the proven optimum with zero
  resets/undos). **"Show me"** replays a real BFS solution path (porter walks + shoves)
  but is honest — it announces *"shown — that's one solution in N pushes"* and never sets
  the clean flag; on the dead room it refuses gracefully.
- **Three cosmetic skins** (Graphite default · Blueprint cyan-on-navy · Parchment warm
  paper) re-skin the same board in place — purely cosmetic, identical to the sibling
  puzzles.
- **SVG board with tweened motion** — crates and the porter are positioned by
  `transform: translate`, so every move is a ~130 ms tween; the porter carries a facing
  notch oriented to the last direction.
- **Persistence (`ws:` convention, all guarded):** `ws:seen:warehouse` on load,
  `ws:best:warehouse` (highest room solved), `ws:flag:warehouse-clean` on a no-reset
  no-undo solve, and `ws:seen:warehouse-deadlock` to gate the first-time banner line.
- **Reciprocal cross-links** added in both directions: `↗ Warehouse` now appears in the
  Latch index, Slitherlink, and Akari `.links` blocks, and the Warehouse links back to
  all three plus the Orrery Estate.

### The correctness crux
A DOM-free `warehouse.core.mjs` is the sole authority; the page inlines the CORE block
**byte-for-byte** between `// === CORE BEGIN/END ===` sentinels (verified by `diff`), and
the Node twin imports the *same* module — so the in-page self-test chip runs literally the
same code as `node warehouse.core.test.mjs`.
- **`solve`** runs BFS over canonical `(player-region-min, sorted-crate-set)` states and
  returns `{len, expanded, exhausted}`; `len === -1` (search exhausts without a win) **is**
  the unwinnability proof.
- **`pushSucc` / `step`** generate only push edges — there is never a pull edge (asserted
  by the test sweeping every successor).
- **`deadInfo` / `isDeadlocked`** is a **conservative, sound** static detector: a non-goal
  crate frozen on both axes (a wall or a perpendicular-frozen neighbour on each side, with
  cycles resolving to *not-yet-proven-frozen*) is dead; crates on goals are never flagged.
  Soundness means **every** state it flags is truly dead (it may miss some — that is the
  safe direction).

### Self-test results (this build)
In-page chip GREEN: *"self-test 6/6 ✓ · author-board winnable · neg-control unwinnable ·
deadlock-sound"* — equal to `node latch/warehouse.core.test.mjs` (exits 0):
```
✓ A — positive board winnable in 2 pushes (len=2 exhausted=false)
✓ B — neg-control provably unwinnable (BFS exhausts) (len=-1 exhausted=true)
✓ C — vacuous "always solvable" checker fails the neg-control (real solver catches it)
✓ D — deadlock detector sound (16 states, 5 flagged-dead, 0 false-positives)
✓ E — push-only: every successor pushes one crate one cell (808 successors, 0 pull edges)
✓ F — winnable levels solve at proven optima (L1=2 · L2=4 · L3=5)
```
The full cluster/wall-line detector passed claim D with **zero false positives** on the
exhaustive POS∪NEG1 enumeration, so no corner-only fallback was needed.

### Publisher fresh-eyes review
Served on `127.0.0.1:8997` (torn down by exact PID; Brandon's own servers untouched) and
driven with agent-browser session `wh128pub`. **No bug found — shipped as authored.**
- L1 played to WIN in 2 pushes → clean-solve verdict + gold bloom; `ws:flag:warehouse-clean`,
  `ws:seen`, `ws:best=1` all set.
- L2 driven into a corner via the core-computed shortest deadlock path → the soul moment
  fired exactly: 1 desaturated frozen crate, the non-modal banner with the first-time
  italic line, the beckon Reset, `ws:seen:warehouse-deadlock` set.
- The dead room loaded with optimum NONE, **no** deadlock banner, **zero** frozen crates —
  the global-dead vs locally-frozen distinction held in both code and copy.
- "Show me" on L3 replayed a 5-push solution and stayed honest (no clean flag, no false win).
- All three skins distinct and cohesive; undo exact; **0 horizontal overflow** at 1280 and
  390 px; reciprocal cross-links resolve both directions; **0 runtime errors** across the
  whole session; `forge --check --all` 42/42 current.

### Note
- One review observation (a test-harness artifact, **not** a piece bug): agent-browser's
  `click @ref` on the D-pad / a stray keypress occasionally drifted browser focus; driving
  moves via a DOM `dispatchEvent('keydown')` to the focused board ran the full game cleanly.
  The page's `pointerdown` D-pad + `keydown` board handlers are sound.
