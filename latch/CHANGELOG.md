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
