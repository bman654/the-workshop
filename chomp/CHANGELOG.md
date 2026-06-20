# The Poisoned Bar — changelog

The **sixteenth bench** of the Numbers Room, and a new member of the Adversary family: **Chomp**
made touchable. A molded brass-chocolate slab — **bite** any standing square and everything
up-and-to-the-right of it falls away; the top-left square is **poison ☠**, and forcing the house
onto it wins. The headline is an honest gap between two things math usually serves together:
**a WINNER lamp lights green before your first move** (read straight from the solver — Gale's
strategy-stealing argument *proves* the first player wins every bar but the 1×1), and yet when you
ask *"where's the winning move?"* the drawer can only **shrug** — it lists bites the *search* found,
never a formula, and on a 5×5 the very corner the proof leans on is a *losing* opening. Existence,
proven; construction, withheld.

## Architecture (reuse, not reinvention)

Like its sibling **The Stone Heaps**, this piece has **no `core.mjs` of its own**. Its sole
move-authority and verdict-source is the estate's already-proven solved-games engine:

- **`tools/game/adversary.js`** — `Adversary.solve` (memoised minimax), `perfectPlayer`. Byte
  **UNCHANGED** by this bench (`git diff` empty). The house's every move is `perfectPlayer` over
  `solve(def)`; the WINNER lamp reads `solve()`'s root value before any move.
- **`tools/game/games/chomp.js`** — `GAME_chomp` in the EXACT adversary.js DATA contract (same shape
  as `nim.js`): `state = {cols:[…], W, H}` (column heights), `initState` a 4×6 bar, `legalMoves`
  every standing square *except* the poison, `apply` drops columns, `terminal` ⇒ LOSS when only the
  poison remains, `key` folds the transpose symmetry on SQUARE boards, plus a `makeChomp(W,H)`
  helper. `literatureValue 'WIN'`, `nodeBudget 2000` (4×6 = 209 canonical nodes).
- **`tools/ws/ws.js`** — present for chrome; this is a sub-bench and correctly drops **no** front-door
  `ws:seen` breadcrumb (verified by `forge --audit-seen`).

`index.src.html` is the authored source; **`index.html` is the forged artifact** with those modules
inlined byte-true (`node tools/forge/forge.mjs chomp/index.src.html`). The renderer is a Canvas
painter with a glint animation; the VERB is a tap/click on the slab resolving through `squareAt` →
`humanMove`. The board picker offers **3×4 · 4×6 · 5×5 · 1×6 ▸ Nim · 1×1** (the last two are
neg-controls / a sibling-link to The Stone Heaps).

## Claims & self-test (mirrored in the in-page pill and two Node twins)

The green pill reads **self-test 5/5 ✓**: the literature battery, a 4×6 perfect-vs-perfect mate, the
existence≠construction witness, the 1×1 neg-control, and the plumbing. Its oracle calls the SAME
`Adversary.solve()` / `GAME_chomp` / `literatureBattery` the Node twins run.

- **(A) SHAPE SWEEP** — every non-1×1 board is a first-player **WIN**; the **1×1** is the lone
  **LOSS** (poison alone). Verified over 35 boards through `solve`.
- **(B) STRATEGY-STEAL WITNESS** — the board is a proven WIN, yet the **corner bite's child** is a
  WIN *for the opponent* on 3×3 / 3×4 / 4×4 / 4×6 / 5×5. The proof leans on a lever that is itself
  often a *losing* move — existence without construction, made concrete.
- **(C) NEG-CONTROL (1×1)** — the lone P1-LOSS with **zero** winning bites; the WINNER lamp stays
  dark and the drawer reads "no winning bite — Nothing but the skull."
- **(D) NEG-CONTROL (1×N ≡ one-heap Nim)** — WIN iff N>1, with the unique winning bite reducing the
  row to poison-only; matches one-heap Nim across 1×1..1×6.
- **(E) NODE-COUNT** — the 4×6 board is exactly **209** canonical (transpose-folded) nodes, far under
  `HARD_CAP`.

**Two Node twins** reproduce these against the real `tools/game/*`:
- `tools/game/adversary.test.cjs` runs chomp's `literatureBattery` through the same `Adversary.solve`
  in the house aggregate (**59/59 PASS**; chomp WIN, mate in 11, 209 nodes).
- `tools/game/games/chomp.test.mjs` (focused): shape sweep, the strategy-steal witness, both
  neg-controls, node-count, and **re-extraction parity** (the inlined chomp slab in `index.html`
  byte-matches the module after forge's guard strip) — **6/6 PASS**.

## Publisher's fresh-eyes review (cycle #217)

- **Verified the play loop live** (uncommon port, agent-browser session torn down by name): biting a
  square drops every column ≥col to ≤row — exactly Chomp's "up-and-right falls away" — and the house
  replies from `perfectPlayer`. Played a sub-optimal opening and watched the verdict lamp honestly
  flip to **LOSES** for the mover; tapped the **1×1** poison and reached `gameOver` with "ate the
  poison." The drawer, when opened, shows the search-found bites with the honest caveat *"from trying
  all N bites and keeping the ones the table marks a loss for the house."*
- **Confirmed the busy-guard is correct, not a bug.** The click handler `if(busy||gameOver) return`
  swallows rapid-fire taps during the house's animated reply — a single tap per exchange always
  lands. This is the right behavior (no double-moves mid-animation).
- **Confirmed the builder's `undoStack` rename holds.** The undo array was originally named `history`,
  colliding with the read-only `window.history` whose `.push` threw and froze play after the first
  reply (the *same* trap The Stone Heaps hit at cycle #190). The shipped source uses `undoStack`
  throughout; play runs through cleanly.
- **5×5 sizing pass is good** — square cells, the poison skull sized for the dense board, no
  crowding. The 3×4 / 4×6 boards and the 1×6 ▸ Nim sibling-link all render and switch cleanly.
- **Registration is clean on both hubs.** Numbers Room: the 16th bench card (no overflow, ☠ glyph,
  the "exact" styling of its proven siblings), copy bumped Fifteen→Sixteen / Thirteen→Fourteen, the
  landing pill **25/25 green** with a present-check for the new card. Workbench: a card in "Games of
  perfect information" beside The Adversary, with the blurb's link to The Adversary a **sibling** of
  the card-link overlay (no nested-anchor bug — verified `cardLink.contains(blurbLink) === false`).
- Verified: `forge --check --all` all 56 current · `forge --audit-seen` clean (sub-bench drops no
  breadcrumb) · adversary 59/59 · focused twin 6/6 incl. re-extraction parity · in-page pill 5/5
  green · console clean · sib-trail links (Adversary / Stone Heaps / Matchbox / Queen's Walk) all
  resolve to existing files.
