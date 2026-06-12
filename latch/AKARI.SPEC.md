# Akari (Light Up) — SPEC (the workshop's 3rd logic puzzle)

A generative **Akari** (a.k.a. Light Up) puzzle — the third in the workshop's logic-puzzle family
alongside **Latch** (nonogram, line-run deduction) and **Slitherlink** (loop topology). Akari is a
*third distinct deduction flavour*: **illumination / line-of-sight** reasoning over a grid of cells
and walls. Visually it has a gorgeous payoff — light flooding the whole board on solve.

File: `latch/akari.html` — ONE self-contained vanilla HTML/CSS/JS file, **zero deps, zero network**.
Plays from `file://` AND a served origin. **No audio** (silent piece — middle of the night).

---

## 0. The game (rules)

An Akari board is an N×N grid. Each cell is either **WHITE** (floor, can be lit) or **BLACK** (a
wall). Some black walls carry a **number 0–4**. The player places **bulbs** on white cells subject to:

1. **Illumination**: a bulb lights its own cell and all white cells in the four orthogonal directions
   until a wall blocks the beam. After solving, **every white cell must be lit** (fully illuminated).
2. **No mutual sight**: **no two bulbs may light each other** — i.e. no two bulbs share a row/column
   segment with no wall between them. (Equivalently every bulb's cell is lit by exactly itself along
   each ray, never by another bulb.)
3. **Wall numbers**: a numbered wall must have **exactly that many bulbs** orthogonally adjacent to it
   (up/down/left/right, white neighbours only). Unnumbered walls have no constraint.

A well-formed Akari has **exactly one** bulb placement satisfying all three. That uniqueness — and
reachability by **pure logic, no guessing** — is the workshop crux.

### Player interaction
- The board renders WHITE cells (light floor), BLACK walls (with their number centered if any), and
  lets the player toggle a **bulb** on a white cell. Mirror the workshop's mark/empty grammar:
  - **Left-click** a white cell toggles a **bulb** on/off.
  - **Right-click / Shift-click** places a small **✕ mark** ("I deduce no bulb here") — a pencil-mark
    state, purely for the player's reasoning, like Latch's cross-out. Cycle empty → ✕ → empty.
- Live feedback (the heart of Akari's feel): **lit white cells glow** (a warm light tint) the moment a
  bulb is placed; rays shoot down rows/columns until a wall. A bulb that is **lit by another bulb**
  (illegal mutual sight) flashes a **warning colour**. A numbered wall **turns satisfied/over** colour
  when its adjacent-bulb count equals / exceeds its number. This live illumination is what makes Akari
  delightful — invest in making the glow + rays look great.

### Controls / panel (match Latch & Slitherlink chrome so the three feel like a set)
- Title "Akari" (subtitle e.g. "light up") + `← workshop` back-link + a small **puzzles cluster**
  linking the two siblings: `↗ Latch` and `↗ Slitherlink` (and add a matching link back to Akari in
  each of those two — three-way cross-link; see §6).
- Self-test chip (`.selftest`) — green when N/N, never ships red.
- Size segmented control: at least **3 sizes** (e.g. 7×7, 10×10, 14×14 — tune for fit & solve time;
  Akari boards are typically square with ~20–30% walls).
- Seed input + ⟳ dice / New → seeded reproducibility.
- **Hint** — reveal/assert one logically-forced placement (a forced bulb, or a forced ✕ no-bulb cell).
- **Check** — highlight contradictions (a wall whose count is exceeded, two bulbs in mutual sight, an
  unlit cell that can no longer be lit) and count mistakes vs the unique solution.
- **Reveal** — place the full solution (board fully lights up — the money shot).
- **Reset** — clear the player's bulbs/marks, same puzzle.
- **3 cosmetic skins** — reuse Latch's Graphite / Blueprint / Parchment CSS-var system VERBATIM so the
  three pieces are a matched set. Skin is purely cosmetic; NEVER re-rolls the puzzle.
- Keyboard shortcuts mirroring siblings where sensible (h hint, c check, n new, r reset).

### Win reveal (honest)
When the player's bulbs == the unique solution AND the board is fully lit with no mutual sight and all
wall numbers satisfied: celebrate — the whole board **blooms with warm light + glow**, walls recede, a
verdict line shows ("solved — NN lamps light every cell", "a clean solve · no mistakes"). Honest: only a
true complete correct solution wins; Reveal does NOT count as a clean solve.

---

## 1. THE CRUX — provable uniqueness by pure logic

Two pure (no-DOM) engines, both exercised by the self-test (the Latch/Slitherlink pattern):

### (a) A SOUND LOGIC SOLVER — deduction only, never guesses.
Model each white cell's state ∈ {UNKNOWN, BULB, EMPTY} (EMPTY = proven no-bulb). Propagate to a
fixpoint using only locally-forced rules. A rich-enough sound rule set for generated puzzles:

- **Wall saturation** (analogous to clue-saturation): a numbered wall with b adjacent BULBs and u
  adjacent UNKNOWN white neighbours, target N → if b==N, all u become EMPTY; if b+u==N, all u become
  BULB. (0-walls force all neighbours EMPTY.)
- **Illumination necessity**: if a white cell is currently UNLIT and the only cells that could ever
  light it (itself + the UNKNOWN cells along its 4 rays up to walls) reduce to a single candidate,
  that candidate must be a BULB. In particular: a white cell with no UNKNOWN/BULB anywhere on its rays
  except itself ⇒ it must hold a BULB (nothing else can light it).
- **No-mutual-sight propagation**: when a cell becomes a BULB, every white cell it sees (its rays up to
  walls) becomes EMPTY (placing a bulb there would be mutual sight; also they're now lit).
- **Lit ⇒ can be EMPTY only if still lightable elsewhere**: a cell already lit by a placed bulb can be
  EMPTY; but do not force EMPTY just because it's lit (it may still need to be a bulb to satisfy a wall
  — let wall saturation handle that). Keep rules SOUND: only set a cell when forced.

Iterate to a fixpoint (`logicSolve(puzzle) → cell-state grid`). If every white cell is decided and the
result is a valid Akari solution (fully lit, no mutual sight, walls satisfied), the puzzle is solved by
pure logic. Reaching a fully-decided valid fixpoint IS the logic-solvability proof (no guessing used).

### (b) An INDEPENDENT BRUTE-FORCE SOLUTION COUNTER — the second uniqueness witness.
A separate, obviously-correct exhaustive solver (DFS placing bulbs / marking empties with the three
constraints as pruning) that returns the **count** of valid solutions, capped (e.g. stop at 2). It must
NOT call `logicSolve` — it is the independent witness. Used by the self-test on small boards to confirm
exactly **1** solution each (the Latch line-solver + brute-counter pattern; the Slitherlink
logic-solver + brute-counter pattern).

### Generation contract (place → number → prove → ship)
1. **Generate a valid solved board** (seeded): pick a wall layout (place black walls — e.g. a seeded
   subset of cells, ~18–28% density, optionally with light symmetry for elegance), then place a SET of
   bulbs that (a) fully illuminates every white cell and (b) has no mutual sight. A robust method:
   greedily/randomly place bulbs on the least-lit white cells, each new bulb forbidden from any cell in
   mutual sight of an existing bulb, until every white cell is lit; reject + retry the layout if it
   can't be fully lit without conflict. This yields a guaranteed-valid solution.
2. **Derive wall numbers**: each black wall's number = count of its orthogonally-adjacent bulbs (0–4).
   Then **drop some numbers** (turn numbered walls into plain walls) and/or keep all — clue reduction
   below decides which to keep.
3. **Reduce clues**: start with ALL walls numbered, then in seeded random order try removing each
   number; after each tentative removal run `logicSolve` from blank — keep the removal **iff the puzzle
   still solves uniquely by pure logic** to the exact solution. Yields a minimal-ish puzzle guaranteed
   logic-solvable and unique by construction.
4. **Ship only if** `logicSolve` reaches exactly the generated solution with 0 UNKNOWN white cells.
   Track fallback usage; aim for 0 in the audit (a denser-numbers fallback or next-seed retry exists).

Seed purity: `(seed, size) → byte-identical puzzle` every time. Skin is cosmetic only.

---

## 2. SELF-TEST (runs headless on load; green chip; NEVER ships red)

Mirror the siblings' `runSelfTest()` → `{passed,total,allPass}` + boot chip. Suggested 4 checks:
1. **Logic-solver soundness** — hand-crafted tiny boards with known forced placements (incl. a
   0-wall forcing empties, an "only-this-cell-can-light-it ⇒ forced bulb" case, and a mutual-sight
   propagation case); assert forced conclusions are correct and the solver never asserts a wrong cell.
2. **Generation sweep** — 60–120 puzzles across sizes; each (a) fully logic-solvable (0 UNKNOWN), (b)
   logicSolve's bulbs == generated solution, (c) the solution independently validates (fully lit, no
   mutual sight, walls satisfied). 0 mismatch, 0 fallback ideally.
3. **Uniqueness (second witness)** — N small boards, independent brute-force counter returns exactly 1.
4. **Seed purity / skin-invariance** — same seed ⇒ byte-identical (wall+number+solution fingerprint);
   different seed differs; skin switch leaves fingerprint identical.

Log PASS/FAIL per check; chip shows e.g. `logic-verified — 4/4 ✓`. FIX the generator/solver until green
— never weaken the test to pass.

---

## 3. Validity helpers (correct & reused by tests + win-check)
- `fullyLit(board, bulbs)` → every white cell is lit by some bulb (along clear rays).
- `noMutualSight(board, bulbs)` → no two bulbs share a wall-free row/column segment.
- `wallsSatisfied(board, bulbs, numbers)` → every numbered wall has exactly its number of adjacent bulbs.
- A solution is valid iff all three. The win-check uses the same helpers.

## 4. Look & feel (sibling to Latch & Slitherlink)
- Reuse the three skins + panel chrome verbatim. Walls are solid dark blocks (number centered in a
  refined font); white cells are a soft light floor; bulbs are a warm glowing dot/●; lit cells get a
  warm tint + the rays are subtle. Make the illumination genuinely pretty — it's the soul of Akari.
- Canvas or SVG/DOM grid both fine. A DOM/CSS grid of cells is probably simplest for crisp walls +
  easy click targets + cheap glow via box-shadow. 60fps: mostly static; only the win bloom animates.
- Responsive down to phone width if cheap.

## 5. Breadcrumbs (hidden-world framework — see /UNLOCK.md; storage all try/catch-guarded)
- On load: `safeSet('ws:seen:akari', Date.now())`.
- On a correct solve: `ws:best:akari` = largest size solved (raise-only); on a no-mistake solve set
  `ws:flag:akari-clean = Date.now()`. (Future Undercroft trophy fodder — do NOT add an Undercroft
  secret this run; just drop the breadcrumbs.)
- Degrade gracefully if storage is off / `file://`.

## 6. Wiring (FRONT DOOR UNTOUCHED — still the curated 9 cards)
- The three logic puzzles cross-link in their topbars. In `akari.html`: `← workshop`, `↗ Latch`,
  `↗ Slitherlink`. ALSO add an `↗ Akari` link to **both** `latch/index.html`'s topbar AND
  `latch/slitherlink.html`'s topbar (so all three reference each other — a small three-way puzzles
  cluster). Keep it tidy; match the existing `.back`/link styling.
- Do **NOT** add a 10th front-door card, a front-door companion pill, or an Undercroft secret. The
  front-door footer `puzzles` link continues to point at `latch/index.html` (Latch) — unchanged.

## 7. Deliverables
- `latch/akari.html` (the piece).
- `latch/CHANGELOG.md` — append an **Akari** section (Build 1), PRESERVING Latch's + Slitherlink's
  entries above it.
- Leave NOTES.md / README.md to the lead (report what topbar links you changed in latch/index.html and
  latch/slitherlink.html). Keep this SPEC committed.

## 8. Verification you must do (report results)
- Serve from repo root (`python3 -m http.server <port>`); drive `…/latch/akari.html` with
  agent-browser (served origin so localStorage works). Do NOT use Chrome MCP tools directly.
- Confirm & REPORT: chip GREEN + N/N; **0 console errors / warnings / page-errors** across a full
  battery (seed change, all 3 skins, Hint, Check, both size changes, Reveal); a small board solved via
  REAL clicks fires the win bloom + writes `ws:best:akari`/`ws:flag:akari-clean`; Hint adds exactly one
  forced placement; a deliberate wrong bulb → Check flags the right contradiction; same seed reproduces
  byte-identical; skin-switch is cosmetic (fingerprint identical); Reveal does NOT set the clean flag.
- Report the self-test numbers + the sweep/uniqueness audit counts, and any real bugs you found & fixed.
