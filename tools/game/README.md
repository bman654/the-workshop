# `tools/game/` — the Adversary engine (solved combinatorial games)

A reusable, DOM-free combinatorial-game-theory core, shaped exactly like
`adventure/`'s Lantern: **one pure engine**, **games as declarative data**, a
**headless solver** that *proves* a game's value before it ships, and **players**
that are just functions over the solved table. The same `solve()` drives the Node
self-test and the in-page green chip, so the proof and the rendered board can
never drift.

```
tools/game/
  adversary.js          the canonical engine (dual-use: Adversary global / module.exports)
  games/
    nim.js              capped heaps          — first-player WIN iff nim-sum ≠ 0
    ttt333.js           3×3 tic-tac-toe       — DRAW under perfect play
    konane.js           4×4 Kōnane            — first player LOSS (mate in 6)
    hex3.js             Hex on a 3×3 rhombus  — first-player WIN, no draws
    mnk443.js           the (3,4,3) m,n,k game — first-player WIN (mate in 7)
  adversary.test.cjs    the Node self-test (requires the engine + all defs)
  README.md             this file
```

Run the proof: `node tools/game/adversary.test.cjs` (exits 0 iff every check passes).

---

## The game-def DSL — a game is pure data + tiny pure functions

A game-def is a plain object. States are **plain, serialisable objects**; every
function is **pure** (no mutation of the input, no `Math.random`, no DOM, no I/O).
The **side to move is part of the state** and every value is **from the side-to-
move's point of view**.

| field | type | contract |
|---|---|---|
| `id` | string | unique slug (`'nim'`) |
| `title` | string | display name |
| `players` | `[string,string]` | the two side labels, e.g. `['X','O']`; index 0 moves first |
| `boardKind` | `'grid'｜'heaps'｜'hex'｜'board8'` | UI hint only — the engine ignores it |
| `nodeBudget` | int | per-def cap on reachable canonical states (see the budget rule) |
| `literatureValue` | `'WIN'｜'LOSS'｜'DRAW'` | the **known** game-theoretic value of the start position; self-test assertion #1 checks the solver computes exactly this |
| `initState()` | `→ s` | the start state (a fresh object each call) |
| `legalMoves(s)` | `→ [move]` | every legal move from `s`; `[]` iff no move is possible |
| `apply(s, move)` | `→ s'` | a **new immutable** state after `move`; must NOT mutate `s` |
| `terminal(s)` | `→ {over:bool, value?}` | `over:true` + a `value` (`'WIN'｜'LOSS'｜'DRAW'` from the side-to-move POV) when the game is over; else `{over:false}` |
| `key(s)` | `→ string` | a **canonical, symmetry-reduced** key; two positions with the same game value *and* equivalent under the game's symmetries MUST share a key |

### Optional fields (used by the solver / players / page / self-test)

| field | purpose |
|---|---|
| `symmetries(s) → [s,…]` | non-identity symmetry images of `s` (board rotations/reflections that preserve the value). Self-test check #5 asserts `value(key(s)) == value(key(sym·s))`. Omit if `key()` is your only canon. |
| `sideToMove(s) → string` | the label of the side to move (defaults to `players[s.turn]`) |
| `moveLabel(s, move) → string` | a short human label for a move (`'r1c2'`, `'heap 1 −2'`) |
| `render(s) → string` | a plain-text board, used by `describeForAgent` |
| `literatureBattery(solve, V) → {ok, detail}` | an *independent* re-derivation of the literature claim over a battery of positions (e.g. Nim's XOR theorem, Hex's no-draw law). `V = {WIN,LOSS,DRAW}`. |

### The terminal convention (read this twice)

`terminal(s).value` is **from the side-to-move's POV at `s`** — the player who is
*about to move* (or who cannot). For normal-play games where "no move = you lose":
when a line/connection already exists on the board, the player who *just* moved
made it, so the side to move has **LOSS**. When the board is full with no line,
**DRAW**. The engine's win/loss propagation is built on this single convention; get
it wrong and `solve()` will compute a confidently-wrong value (which the self-test
will then catch against `literatureValue`).

---

## The core algorithm — `Adversary.solve(def)`

1. **Enumerate** the reachable state graph by BFS over `key(s)` from `initState()`.
   Abort with `{ok:false, error}` if the canonical node count exceeds
   `def.nodeBudget` (hard ceiling `Adversary.HARD_CAP` = 300 000).
2. **Classify** terminals via `terminal(s).value`.
3. **Retrograde-label** every non-terminal by backward induction to a fixpoint:
   - a node is a **WIN** iff *some* child is a LOSS (move where the opponent loses);
   - a node is a **LOSS** iff *all* children are WIN (every move hands a win away);
   - otherwise **DRAW** (no forced resolution — a draw-cycle).
   Then exact **distances** (a Dijkstra-style relaxation in increasing-distance
   order): a WIN's distance is `1 + min` over its LOSS children, a LOSS's is
   `1 + max` over its (all-WIN) children — "**win fast, lose slow**". `root.dist`
   equals the length of optimal-vs-optimal self-play (asserted by the self-test).

`solve()` returns `{ ok, error, nodeCount, rootKey, table, value, dist, bestMove, def }`.
Solve **once at load and cache it** — every player and the page read the cached table.

### Players — `(state, legalMoves, def, solveTable) → move`

- `Adversary.perfectPlayer` — provably optimal. **Ranks the live legal moves**
  (applies each, canonicalises the child, reads the table) rather than reading a
  move out of a canonical node — this is what keeps it correct under symmetry
  reduction (a move chosen in canonical space would apply to the wrong cell of the
  un-canonicalised live state). Never loses from a non-LOSS position.
- `Adversary.randomPlayer(seed)` — a seeded (mulberry32) legal-move wanderer; no
  `Math.random`, fully deterministic.
- `Adversary.describeForAgent(state, def)` — a plain-text position digest; the hook
  a future `llmPlayer` would hand a model.
- `Adversary.llmPlayer()` — a documented **stub** (throws if invoked unwired).

---

## The node-budget rule

Every def MUST declare a `nodeBudget` and MUST stay under it. The rule exists so a
def's reachable, symmetry-reduced state space is provably **fully enumerable** and
`solve()` finishes **in well under a second in the browser** (the page solves at
load, on the main thread, before the first move).

- Set `nodeBudget` to a comfortable ceiling above the *actual* canonical node
  count (the self-test prints it), not a guess. Self-test check #6 asserts the
  reachable count is under the cap; if a future board change blows it, the test
  goes red instead of the page hanging.
- The absolute hard ceiling is `Adversary.HARD_CAP = 300 000`. A def that needs
  more is **the wrong size for this engine** — shrink the board or the opening.
- This is exactly why the shipped m,n,k game is **(3,4,3)** and not (4,4,3): the
  4×4·3 board's reachable set exceeds 300 000 nodes and takes tens of seconds to
  enumerate — over both the cap and the budget. (3,4,3) is the adjacent,
  fully-enumerable member of the same family and is still a clean first-player win,
  so the genre is preserved with a *provable* result. **A smaller proven game beats
  a larger one with a hung solver or an unverified value.**

---

## Why this is honest

The page's green "self-test" chip calls the **same** `Adversary.runSelfTest(defs)`
the Node harness calls. There is exactly one solver, one set of defs, one proof.
If the chip is green, `node tools/game/adversary.test.cjs` is green, and every
verdict the board reveals (WIN/LOSS/DRAW + "mate in N") is read straight from the
proven table.
