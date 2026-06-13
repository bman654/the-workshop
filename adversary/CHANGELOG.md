# The Adversary — Changelog

## 1.0 — first light

A reusable solved-games engine + a board where a visitor plays small **solved**
games against a **provably perfect** opponent.

### Engine — `tools/game/adversary.js` (v1.0)
- DOM-free, dual-use (browser `Adversary` global / Node `module.exports`), Lantern-
  shaped: one pure core + a headless solver; games are declarative data; players
  are functions over the solved table.
- `solve(def)`: BFS-enumerate the reachable canonical state graph (abort over
  `nodeBudget`, hard cap 300k) → classify terminals → retrograde-label values to a
  fixpoint (WIN iff some child LOSS; LOSS iff all children WIN; else DRAW) → exact
  mate distances via a Dijkstra-style relaxation ("win fast, lose slow"), so
  `root.dist` == optimal-vs-optimal self-play length.
- Players: `perfectPlayer` (ranks **live** moves — correct under symmetry
  reduction), `randomPlayer(seed)` (seeded mulberry32, no `Math.random`),
  `describeForAgent(state,def)` + `llmPlayer()` agent hook (documented stub).
- `runSelfTest(defs)` — the single proof core the page chip and the Node test share.

### Games — `tools/game/games/*.js` (5 defs, all proven)
- **nim** — capped heaps [3,4,5]; first-player WIN (mate in 11). XOR-theorem
  battery over 15 positions.
- **ttt333** — 3×3 tic-tac-toe; DRAW under perfect play (dihedral-8 canon).
- **konane** — 4×4 Kōnane with a canonical opening; first-player LOSS (mate in 6);
  loopfree ⇒ no draws (re-derived by the battery).
- **hex3** — Hex on a 3×3 rhombus; first-player WIN (mate in 5); no-draws battery
  (Hex theorem); 180°-rotation canon only (reflections swap the players' edges).
- **mnk443** — the (3,4,3) m,n,k game; first-player WIN (mate in 7). Shipped as
  (3,4,3) rather than (4,4,3): the 4×4·3 reachable set exceeds the 300k hard cap and
  the <1s budget; (3,4,3) is the adjacent fully-enumerable member of the same family.

### Self-test — `tools/game/adversary.test.cjs`
- **38/38 checks pass**, exit 0, ~0.9s: literature value · table self-consistency ·
  optimal-vs-optimal outcome+distance · perfect-never-loses (exhaustive + sweep) ·
  determinism + symmetry-canon soundness · budget honoured · plus cross-cutting
  (deterministic solve, seeded PRNG, agent hook, llmPlayer stub).

### Page — `adversary/index.src.html` → `adversary/index.html` (forge)
- Dark-drafting demonstrator matching the abacus/scytale chrome: game picker; click
  to move; the engine replies optimally; **Reveal verdicts** (per-move WIN/LOSS/DRAW
  tints + exact "mate in N"); **Hint**; **Watch it play** (perfect-vs-perfect, step
  or run, halts at the proven outcome); an honest "you had a forced win — you let it
  slip" callout; New game / opponent toggle; Copy + abacus-safe 2× PNG export of the
  proof-annotated board; `← workshop` back-link.
- Green self-test chip computed by the SAME `Adversary.runSelfTest()` as Node
  (30/30 per-def checks). Records `WS.seen('adversary')` at parse time.

### Notable bugs caught and fixed during the build (the self-test earned its keep)
- `perfectPlayer` originally returned a move read out of the *canonical* node, which
  applied to the wrong cell/heap of the un-canonicalised live state under symmetry
  reduction — fixed to rank live moves directly. (Caught by self-play distance + the
  never-loses sweep.)
- The retrograde labeling's single-pass distance was order-dependent and inflated;
  replaced with a clean two-phase value-then-distance computation (Dijkstra-style).
- `playFrom`'s outcome-POV translation compared `turn === 0` instead of parity,
  mis-reporting konane's loser as a winner.
