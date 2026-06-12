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
