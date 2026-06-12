# Latch — SPEC

*A generative **nonogram (picross) atelier**. The workshop's first **logic puzzle** — a new
medium alongside the generators, games, sound, and living systems. The signature workshop crux:
every puzzle it hands you is **provably solvable by pure logic alone (no guessing) and has exactly
one solution** — proven, not asserted, by a built-in line-solver that re-derives the picture.*

- **Path:** `latch/index.html` — single, self-contained vanilla HTML/CSS/JS file. **No
  dependencies, no network, no build step.**
- **Home (front door stays at the curated 9 cards):** linked from the front-door **footer** as a
  plain `puzzles ·` text link, exactly like the existing `colophon ·` link. **Not** a 10th card,
  **not** a companion, **not** an Undercroft secret. The 9 cards and 7 companion pills are untouched.

---

## What it is

A nonogram (a.k.a. picross / griddler / hanjie): a grid whose row- and column-clues are runs of
consecutive filled cells. Solve the clues and a small pixel **picture** emerges. Latch *generates*
these from a seed: it draws a coherent little motif, encodes it as clues, and — crucially — only
ships the puzzle if it is **uniquely solvable by logic**.

The name *Latch*: a nonogram solves like a latch falling into place — each forced deduction clicks
the next; when the last latch closes, the picture is revealed.

### The picture source (the motif)
The solved grid should read as a *deliberate little picture*, not noise (noise rarely yields a
clean logic-solvable puzzle anyway). Two ways to get good motifs — pick whichever produces the best
mix of "recognisable + reliably logic-solvable":

1. **A curated motif library** keyed by size: hand-authored pixel bitmaps (heart, key, anchor,
   leaf, fish, cat, bell, crown, star, mushroom, rune, etc.) — several per size bucket. The seed
   selects + may mirror/recolour. Recognisable, charming, on-brand for the workshop.
2. **A structured generator** (symmetric blobs / silhouettes with controlled fill density) as a
   fallback/variety source.

**Recommended:** lead with the curated library (it guarantees charm + high logic-solvable yield),
optionally mix in a generator for larger sizes. Either way, the *picture* is the secret the clues
encode; **a finished solve reveals it** (with a satisfying fill-in / glow finish).

### Sizes
At least three: **5×5 (Tiny)**, **10×10 (Classic)**, **15×15 (Big)**. (Non-square allowed if the
motif library supports it, but square is fine and simplest.)

---

## THE CORRECTNESS CRUX (workshop tradition — this is the whole point)

A nonogram is only *good* if it can be solved by **deduction alone** — never by guessing — and has
**exactly one** solution. Latch must **prove** this for every puzzle it generates, the same way
Ariadne proves its over/under weave and Blazon proves its faithful blazon.

Implement a **pure line-solver** (constraint propagation):

- `solveLine(clue, cells)` — given one line's clue (list of run lengths) and the current known
  state of that line (each cell ∈ {filled, empty(X), unknown}), return the **tightest** state
  forced by logic: a cell becomes known **iff it has the same value in *every* arrangement of the
  runs consistent with the current partial state**. (Standard approach: enumerate / DP over all
  legal placements of the runs and intersect; or left-most/right-most packing overlap. Either is
  fine as long as it is *sound and complete for a single line*.)
- `logicSolve(puzzle)` — iterate: repeatedly run `solveLine` over all rows and columns, applying
  every forced cell, until a full pass makes **no change** (fixpoint). Return the resulting board +
  whether it became fully determined.
- A puzzle is **logic-solvable** iff `logicSolve` fully determines the board with **no guessing**,
  and the determined board equals the original picture.

**Uniqueness:** because the line-solver only ever sets a cell when *every* consistent arrangement
agrees, a fully-determined logic solve is automatically the *unique* solution. (Optionally also run
an independent exhaustive/backtracking uniqueness check on small sizes as a second witness, but the
logic-fixpoint reaching a full board is itself the uniqueness proof — note this reasoning in code.)

**Generation contract:** the generator loops — draw a motif from the seed, build clues, run
`logicSolve`; **if it is not logic-solvable to the exact picture, perturb/redraw and retry** (try
mirror, small edits, or next motif) up to a bounded number of attempts; ship the first that passes.
The puzzle handed to the player is **guaranteed** logic-solvable + unique. (If a given seed's motif
library exhausts attempts, fall back to a guaranteed-solvable simpler motif so it *always* ships a
valid puzzle — never a degenerate one.)

### Built-in self-test (runs on load; green chip; never ships red)
Show a small chip e.g. **"logic-verified — N/N ✓"**. Checks:

1. **Line-solver soundness** on hand-crafted lines with known forced results (e.g. clue `[3]` in a
   width-5 line forces the centre cell filled; clue `[5]` in width-5 fills all; `[]` empties all;
   an overlap case like `[4]` in width-6 forces cells 3–4). Assert exact expected output.
2. **Every generated puzzle (sweep many seeds × all sizes) is logic-solvable AND its logic solve
   equals the original picture** — i.e. the generation contract held. Sweep e.g. 200+ puzzles;
   assert 100% pass (0 require guessing, 0 mismatch).
3. **Uniqueness** — for a sample of generated puzzles, an independent solver finds exactly one
   solution (logic-fixpoint full board ⇒ unique; optionally cross-check small sizes by brute force).
4. **Seed purity / determinism** — same seed ⇒ byte-identical puzzle (same picture, same clues);
   re-roll changes it; cosmetic style switches do **not** change the puzzle (style only re-skins).

Log PASS per check to console; flip the chip green only if all pass. **Never ship a red chip** —
if a check fails, that's a real bug to fix (workshop standard).

---

## Interaction (it's a real, playable puzzle — direct manipulation, not a seed→static-art piece)

- **Grid** with row-clue gutter (left) and column-clue gutter (top). Clues right/bottom-aligned in
  their gutters as the convention dictates.
- **Fill** a cell: left-click / tap. **Mark empty (X)**: right-click, or shift/long-press, or a
  mode toggle button (fill ⊞ / mark ⊠). **Drag** to paint a run (common nonogram UX) — track the
  axis of the first move so a drag stays on one row/column.
- **Live clue feedback:** a row/column clue **dims / checks off** when that line is *correctly
  completed* (matches the clue). Use a non-spoiler rule — dim a clue only when the line's filled
  cells exactly satisfy the clue runs (standard "auto-cross/auto-dim" assist; keep it honest).
- **Check** button: highlight cells that **contradict** the (unique) solution — gentle error
  feedback (a brief shake / red tick), counts mistakes.
- **Hint** button: reveal **one** cell that is *logically* deducible from the current board (run a
  one-step `solveLine` pass, pick a newly-forced cell, reveal it) — teaches the logic, never guesses.
- **Reveal solution** / **Reset** / **New puzzle (re-roll)** / **seed input** (reproducible).
- **Size** selector (Tiny / Classic / Big).
- **Win:** when the board matches the solution, a satisfying **reveal finish** — the picture blooms
  (filled cells get the motif's accent colour + a gentle glow / ripple), the clue gutters fade, a
  small "solved" flourish + the motif's name (e.g. "— a heron"). Honest: only fires on a true,
  complete, correct solve.

### Styles (cosmetic only — must NOT change the puzzle; the crux test asserts this)
At least 2–3 skins, e.g. **Graphite** (clean modern, default), **Blueprint** (cyan-on-navy
drafting), **Parchment** (warm paper + ink). Switching restyles the same puzzle in place.

---

## Persistence / breadcrumb (the `ws:` convention — see /UNLOCK.md)
- Drop `ws:seen:latch` on load (front-door rune eligibility + future hidden-world fodder).
- Optionally record best/solve stats, e.g. `ws:best:latch` = largest size solved, or
  `ws:flag:latch-clean` for a no-mistake solve — a future Undercroft trophy could read it. Keep it
  raise-only / non-destructive. **Guard all storage access** (try/catch; degrade gracefully if
  storage is unavailable — the puzzle must still be fully playable from `file://`).
- **No audio** in this piece (keep it silent; it's the middle of the night). If you ever add SFX,
  default **muted** and verify via the audio-lens — but prefer silent.

---

## Quality bar (workshop standard — verify before shipping)
- **60fps**, **0 console errors / 0 warnings** in a real browser. (Static grid — perf is trivial;
  still confirm.)
- **Seeded + reproducible** (same seed ⇒ same puzzle, proven by self-test #4).
- **Self-test green** (all checks pass; never red).
- **Served-origin** check for any localStorage (`python3 -m http.server` from repo root →
  `http://127.0.0.1:PORT/latch/`), not just `file://`. But the page must also degrade gracefully on
  `file://` (storage may throw).
- Responsive enough to use on a laptop; keyboard niceties welcome but mouse/touch is the priority.
- Aim **under ~1500 lines**; keep it readable. Comment the line-solver clearly (it's the crux).

## Wiring (front door stays the curated 9 cards)
- Add a `puzzles ·` link to the front-door **footer** in `/index.html`, beside `colophon ·`
  (`href="latch/index.html"`, same inline style). **Do not touch the 9 cards or the grid.**
- In `latch/index.html`, a `← workshop` back-link to `../index.html`.
- New `latch/CHANGELOG.md` (Build 1, this file's date).
- This `latch/LATCH.SPEC.md` is the input spec (commit it).
- Update root `README.md` (a brief footer-level mention is fine — the "what's inside" list is the 9
  projects; Latch is an extra like the colophon, so a light touch / footer nod, not a 10th heading)
  and `NOTES.md` (top resume pointer) — the **lead** handles README/NOTES after verifying.
