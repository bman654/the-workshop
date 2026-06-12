# Slitherlink — SPEC (the workshop's 2nd logic puzzle)

A generative **Slitherlink** (a.k.a. Fences / Loop the Loop) puzzle, built as a **sibling to Latch**
in the front-door "puzzles" home. New deduction flavour in the logic-puzzle vein Latch opened:
where Latch is **line-run** deduction over a pixel grid, Slitherlink is **loop-topology** deduction —
the answer is a single closed curve, which is a far richer correctness crux.

File: `latch/slitherlink.html` — ONE self-contained vanilla HTML/CSS/JS file, **zero deps, zero
network**. Plays from `file://` AND a served origin. **No audio** (silent piece).

---

## 0. The game (rules)

A Slitherlink board is an **R×C grid of CELLS** with a lattice of **(R+1)×(C+1) DOTS** and the
**edges** between orthogonally-adjacent dots. Some cells carry a **clue** 0..3 (or 4 — but 4 is rare
and we'll allow 0..3 for elegance). The solver draws a subset of edges that must satisfy:

1. **Clue constraint** — each numbered cell has exactly that many of its 4 surrounding edges drawn.
2. **Single-loop constraint** — the drawn edges form **exactly one closed loop**: every dot is
   touched by **0 or 2** drawn edges (degree ∈ {0,2}), and all drawn edges form **one** connected
   cycle (no separate sub-loops, no open chains, no branches).

A well-formed Slitherlink has **exactly one** edge-set satisfying both. That uniqueness — and that
it's reachable by **pure logic, no guessing** — is the workshop crux.

### Player interaction
- The board renders DOTS, faint cell backgrounds, clue numbers centered in cells, and clickable
  EDGE slots between adjacent dots.
- An edge has **3 states**: undecided · **drawn** (a solid loop segment) · **crossed-out** (an ✕ the
  player marks to record "this edge is NOT in the loop"). Mirrors Latch's fill / mark / empty trio.
- **Left-click** an edge cycles undecided → drawn → undecided (primary action = draw the loop).
  **Right-click / Shift-click** toggles the ✕ cross-out. (Match Latch's input grammar closely.)
- Drag-to-paint along a row/column of edges is a nice-to-have (Latch has axis-locked drag) — implement
  if cheap, skip if it risks bugs. Single-click reliability matters more.
- Live feedback: a clue number **dims/greens when its count is exactly satisfied**, and turns a
  **warning colour when exceeded** (more than N drawn edges around it) — analogous to Latch's
  clue-dim-on-satisfied. A dot that has degree > 2 (illegal branch) can subtly flag too.

### Controls / panel (match Latch's panel layout & classes so the two feel like siblings)
- Title "Slitherlink" + `← workshop` back-link AND a `↗ Latch` sibling link (companion pattern).
- Self-test chip (`.selftest`) top of panel — green when 4/4 (or N/N) pass, never ships red.
- Size segmented control: at least **3 sizes** (e.g. 5×5, 7×7, 10×10 cells — tune for fit & solve time).
- Seed input (text) + ⟳ dice / New buttons → seeded reproducibility.
- **Hint** — reveal/assert one logically-forced edge (drawn or crossed) the player hasn't placed.
- **Check** — highlight contradictions (over-satisfied clues, degree-3 dots, premature closed
  sub-loops) and count mistakes vs the unique solution.
- **Reveal** — draw the full solution loop.
- **Reset** — clear the player's marks, same puzzle.
- **3 cosmetic skins** that re-skin the SAME puzzle (reuse Latch's Graphite / Blueprint / Parchment
  CSS-var system verbatim if you can — keeps the pair visually coherent). Skin must be **purely
  cosmetic**: NEVER re-rolls the puzzle.
- Keyboard shortcuts mirroring Latch where sensible (h hint, c check, n new, r reset).

### Win reveal (honest, à la Latch)
When the player's drawn edges == the unique solution AND form the single valid loop, celebrate:
the loop **blooms in the accent colour + glow**, clue numbers fade back, a verdict line shows
("solved — one loop, NN segments", "a clean solve · no mistakes" when mistakes==0). Honest: only a
true correct single-loop solution wins. Revealing or a wrong closure does not falsely win.

---

## 1. THE CRUX — provable uniqueness by pure logic (the heart of this piece)

This is the workshop tradition (Latch proves nonograms unique-by-logic; this proves loops). Two
engines, both pure (no DOM), both exercised by the self-test:

### (a) A LOGIC SOLVER — sound deduction only, never guesses.
Implement Slitherlink deductions as constraint propagation to a fixpoint over edge-states
(each edge ∈ {UNKNOWN, LINE, CROSS}). Apply **only locally-forced rules** (a rule fires only when the
conclusion is logically forced by current state — soundness is mandatory):

- **Clue saturation**: cell clue N with k LINE edges and u UNKNOWN edges around it →
  if k==N, all u become CROSS; if k+u==N, all u become LINE.
- **0-clue**: all 4 edges CROSS. **3-clue / 1-clue adjacency** corner rules are nice extras but the
  generic saturation rule above + the loop rules below already subsume the core.
- **Dot-degree (vertex) rules**: each dot has up to 4 incident edges. A dot's LINE-degree must end at
  0 or 2. So: if 2 incident edges are LINE → all other incident UNKNOWN become CROSS; if 3 incident
  are CROSS (only 1 UNKNOWN can still be LINE) and one is LINE → the lone UNKNOWN must be LINE (degree
  must reach 2); if all-but-one are CROSS and none LINE → the lone UNKNOWN must be CROSS (can't make a
  degree-1 dot). Encode the rule generally: a dot with `line` LINE and `unk` UNKNOWN incident edges →
  if line==2 ⇒ unk all CROSS; if line==1 and unk==1 ⇒ that edge LINE; if line==0 and unk==1 ⇒ CROSS.
- **No-premature-closure / connectivity**: forbid completing a small closed loop that does not include
  all LINE edges (would create a separate sub-loop). The minimal sound form: if adding a LINE edge
  would close a loop while LINE edges remain outside it, that edge is forced CROSS. Track LINE-segment
  endpoints with a **union-find over dots connected by LINE edges**; an UNKNOWN edge whose two dots
  are already in the same LINE-component AND there exist LINE edges not in that path ⇒ CROSS.

Iterate all rules to a fixpoint (`logicSolve(puzzle) → edge-state array`). If every edge is decided
(no UNKNOWN) and the result satisfies all clue + loop constraints, the puzzle is **solved by pure
logic**. Reaching a fully-decided fixpoint that is a valid single loop **IS the logic-solvability
proof** (no branching/guessing was used). Note loop-connectivity is the hard part — a fixpoint may
stall with UNKNOWNs that need a (sound) "this edge would orphan a segment" lookahead; keep the
deduction set rich enough that the *generated* puzzles solve fully (the generator's job, below).

### (b) An independent BRUTE-FORCE SOLUTION COUNTER — the second witness for uniqueness.
A separate, simple, obviously-correct exhaustive solver (DFS over edges with the loop constraints as
pruning, OR a path/loop enumerator). It returns the **count** of valid single-loop solutions matching
the clues. Used by the self-test on small boards to confirm **exactly 1** solution — a true second
witness, independent of the logic solver (exactly Latch's pattern: line-solver + brute-force counter).
Keep it bounded to small boards (it's exponential); the logic solver is what runs at generation time.

### Generation contract (draw → clue → prove → ship)
1. **Generate a random single loop** on the grid (seeded). A clean method: pick a random simple cycle.
   Practical approach — start from a full-grid "snake"/random spanning structure and carve, OR grow a
   loop by random perturbation of a small seed loop, OR use the classic "random solution → derive
   clues" approach: generate a valid loop by a randomized DFS that returns to start, OR fill cells
   with a random 2-colouring and take the boundary between regions (the boundary of any subset of
   cells whose induced region is simply-connected is a single loop — pick a random simply-connected
   blob and its **perimeter is automatically one closed loop**; this is a clean, robust generator).
   **Recommended:** random simply-connected polyomino-ish region via flood-growth from a seed cell,
   reject if it creates holes (a hole would make 2 loops); its boundary edge-set is the solution loop.
2. **Derive full clues**: every cell's clue = number of its 4 edges that are in the loop (0..4).
3. **Reduce to a puzzle**: start with all clues present, then in random (seeded) order try removing
   each clue; after each tentative removal, run `logicSolve` from blank — keep the removal **iff the
   puzzle still solves uniquely by pure logic** (logicSolve reaches the full correct loop). This
   yields a minimal-ish puzzle that is *guaranteed logic-solvable and unique by construction*.
4. **Ship only if** the final puzzle `logicSolve`s to exactly the generated loop with no UNKNOWNs
   left. If a seed somehow fails (shouldn't, given step 3 keeps the all-clues version which is
   trivially solvable), fall back to a denser clue set or the next seeded attempt. **Track fallback
   usage; aim for 0 in the audit** (Latch hit 0/900).

Seed purity: `(seed, size) → byte-identical puzzle` every time. Skin is cosmetic only.

---

## 2. SELF-TEST (runs headless on load; green chip; NEVER ships red)

Mirror Latch's `runSelfTest()` → `{passed,total,allPass}` and the boot chip. Suggested checks:

1. **Logic-solver soundness** — on a handful of hand-crafted tiny boards with known forced edges,
   assert the solver's forced conclusions match (and it never asserts a wrong edge). Include the
   0-clue (all CROSS) and a dot-degree case.
2. **Generation sweep** — generate a batch (e.g. 60–120 puzzles across the sizes); assert EACH is
   (a) fully logic-solvable (logicSolve leaves 0 UNKNOWN) and (b) logicSolve's loop == the generated
   solution loop (0 mismatch), and the solution is a valid single loop (all degrees ∈{0,2}, one
   connected cycle, clues satisfied). 0 guesses, 0 mismatch, 0 fallback ideally.
3. **Uniqueness (second witness)** — on N small boards, the independent brute-force counter returns
   exactly **1** solution each.
4. **Seed purity / style-invariance** — same seed ⇒ byte-identical puzzle (clue fingerprint &
   solution identical); a different seed differs; switching skin leaves the puzzle fingerprint
   identical (cosmetic only).

Log PASS/FAIL per check to console; chip shows e.g. `logic-verified — 4/4 ✓`. If anything fails, the
chip goes red and the console explains — but you must FIX the generator/solver so it ships green.

---

## 3. Validity helpers (must be correct & reused by tests + win-check)
- `isSingleLoop(edgeSet, R, C)` → all touched dots have degree exactly 2, edges form ONE connected
  cycle, no extra components. (degree-0 dots are fine — they're just untouched.)
- `cluesSatisfied(edgeSet, clues)` → every numbered cell has exactly its clue count of loop edges.
- A solution is valid iff `isSingleLoop` ∧ `cluesSatisfied`. The win-check uses the same helpers.

---

## 4. Look & feel (sibling to Latch)
- Reuse Latch's three skins (Graphite default / Blueprint / Parchment) and panel chrome verbatim
  where possible so the two pieces are obviously a matched set.
- The loop should look hand-drawn-elegant: rounded line caps/joins, a soft glow on the accent.
  Crossed-out edges are a small ✕ at the edge midpoint in a muted colour. Clue numbers in a refined
  serif or the UI font, centered, with a satisfied/over state colour.
- Responsive: board scales to viewport; works down to a phone width if cheap.
- 60fps: it's mostly static (SVG or Canvas). SVG is probably cleanest for crisp edges + easy hit
  targets (one `<line>`/`<rect>` hit-zone per edge). Canvas is fine too. No animation loop needed
  except the win bloom.

## 5. Breadcrumbs (hidden-world framework — see /UNLOCK.md; storage all try/catch-guarded)
- On load: `safeSet('ws:seen:slitherlink', Date.now())`.
- On a correct solve: record `ws:best:slitherlink` = largest size solved (raise-only), and on a
  no-mistake solve set `ws:flag:slitherlink-clean = Date.now()`. (Future Undercroft trophy fodder —
  do NOT add an Undercroft secret this run; just drop the breadcrumbs.)
- Everything must degrade gracefully if storage is off / `file://`.

## 6. Wiring (FRONT DOOR UNTOUCHED — still the curated 9 cards)
- The front-door footer already has `puzzles` → `latch/index.html`. Add a `↗ Slitherlink` sibling
  link in **Latch's** panel topbar (next to its `← workshop`), and a `↗ Latch` link in Slitherlink's
  topbar — the companion/sibling pattern, so the two logic puzzles cross-link. Do **NOT** add a 10th
  front-door card, a companion pill, or an Undercroft secret.
- (Optional, only if trivially clean: also add a tiny `· slitherlink` to the front-door footer next to
  `puzzles ·` — but prefer the sibling cross-link inside Latch to avoid touching index.html chrome.)

## 7. Deliverables
- `latch/slitherlink.html` (the piece).
- `latch/CHANGELOG.md` — append a Slitherlink section (Build 1) preserving Latch's entries.
- Leave NOTES.md / README.md / the Latch sibling-link wiring to the lead (report what you changed).
- Keep this SPEC committed.

## 8. Verification you must do (report results)
- Run a static server from repo root (`python3 -m http.server 8765`) and drive
  `http://127.0.0.1:8765/latch/slitherlink.html` with agent-browser (served origin so localStorage
  works). Confirm: self-test chip GREEN + N/N; **0 console errors / warnings / page-errors**; solve a
  small board via real clicks → win bloom fires; Hint adds exactly one forced edge; a deliberate wrong
  edge → Check flags exactly the right contradiction(s); same seed reproduces byte-identical;
  skin-switch is cosmetic (puzzle fingerprint identical). Report the numbers.
- Report any real bugs you found & fixed (Latch's deputy found several — be that rigorous).
