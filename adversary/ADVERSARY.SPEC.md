# The Adversary — SPEC

A reusable combinatorial-game-theory engine and a board where a visitor plays
small **solved** games against a **provably perfect** opponent, can reveal the
game-theoretic verdict of every legal move, and can watch perfect-vs-perfect
self-play run to the proven outcome.

---

## §0 — The crux (the claim the piece makes, and how it proves it)

> **In a solved game, the value of every position is known — not guessed, *known*.
> This board plays that knowledge, exactly, and shows you the receipts.**

A *solved game* is one whose game-theoretic value (WIN / LOSS / DRAW under perfect
play) is determined for every reachable position. The Adversary makes that claim
**provable for small games** by *exhaustive* analysis rather than heuristics:

1. **Enumerate** the whole reachable state graph (BFS over canonical, symmetry-
   reduced keys).
2. **Classify** terminal positions by the game's own rule.
3. **Retrograde-label** every non-terminal by backward induction to a fixpoint —
   a node is a WIN iff *some* child is a LOSS, a LOSS iff *all* children are WIN,
   else a DRAW — and compute the **exact distance to mate** ("win fast, lose slow").

The opponent on the board is `perfectPlayer`, which reads that proven table. The
self-test (the workshop signature) **proves the core claim**: for each game the
computed value equals the published literature value, the table is internally
consistent, optimal-vs-optimal self-play reaches the proven outcome in the proven
distance, and **the perfect player never loses from any non-LOSS position** —
checked exhaustively over the whole reachable set. The page's green chip runs the
**same** `runSelfTest()` the Node harness runs, so the proof on screen is the proof
on the command line.

### The architecture (Lantern-shaped)
- **One DOM-free pure core + solver** — `tools/game/adversary.js`. Node-requireable
  (proves a game before it ships) and inlined into the page (so render and proof
  share one solver and can't drift). Dual-use via the `module.exports` guard forge
  strips.
- **Games as declarative data** — `tools/game/games/*.js`. One engine, many games.
- **Players as functions** over the solved table — `perfectPlayer`,
  `randomPlayer(seed)`, the `describeForAgent` / `llmPlayer` agent hook.

See `tools/game/README.md` for the full DSL contract and the node-budget rule.

---

## §1 — The game-def DSL (summary; full table in tools/game/README.md)

A game-def is a plain object of pure functions over plain serialisable states. The
**side to move is part of the state** and every value is **from the side-to-move's
POV**. Required: `id, title, players, boardKind, nodeBudget, literatureValue,
initState(), legalMoves(s), apply(s,move), terminal(s), key(s)`. Optional:
`symmetries(s), sideToMove(s), moveLabel(s,m), render(s), literatureBattery(solve,V)`.

The **terminal convention**: `terminal(s).value` is from the POV of the side *about
to move*. For "no move = you lose" games, when a winning line already exists the
side to move has **LOSS** (the opponent just made it); a full no-line board is
**DRAW**.

---

## §2 — The core algorithm `solve(def)`

1. BFS-enumerate reachable canonical states; abort if the count exceeds
   `def.nodeBudget` (hard cap 300 000).
2. Classify terminals.
3. Retrograde-label values to a fixpoint (WIN/LOSS/DRAW), then exact distances via
   a Dijkstra-style relaxation in increasing-distance order (WIN dist = `1 + min`
   over LOSS children; LOSS dist = `1 + max` over its all-WIN children). Cache
   `{value, dist, bestMoveIndex, moves}` per key. **`root.dist` equals the length
   of optimal-vs-optimal self-play** (asserted).

`perfectPlayer` ranks the **live** legal moves (apply → canonicalise child → read
the table), *not* a move read out of a canonical node — the one subtlety that keeps
it correct under symmetry reduction.

---

## §3 — The node-budget rule

Every def declares a `nodeBudget` and must stay under it, so its reachable
symmetry-reduced space is provably fully enumerable and `solve()` finishes in well
under a second in the browser (the page solves on load, on the main thread). Hard
ceiling 300 000. **Set the budget above the *measured* node count, not a guess.**

This is why the shipped m,n,k game is **(3,4,3)**, not (4,4,3): the 4×4·3 reachable
set exceeds 300 000 nodes and takes tens of seconds — over both the cap and the
budget. (3,4,3) is the adjacent fully-enumerable member of the same family and is
still a clean first-player win. *A smaller proven game beats a larger one with an
unverified value.*

---

## §4 — The shipped games (all proven by the self-test)

| game | board | value | distance | canonical nodes |
|---|---|---|---|---|
| **nim** | heaps [3,4,5] | first-player **WIN** | mate in 11 | 48 |
| **ttt333** | 3×3 tic-tac-toe | **DRAW** | — | 765 |
| **konane** | 4×4 Kōnane (canonical opening) | first-player **LOSS** | mate in 6 | 978 |
| **hex3** | Hex 3×3 rhombus | first-player **WIN** | mate in 5 | 2 781 |
| **mnk443** | (3,4,3) m,n,k | first-player **WIN** | mate in 7 | 28 275 |

Literature anchors: Nim — first-player WIN iff the bitwise XOR (nim-sum) of the
heaps ≠ 0 (proved by an XOR-theorem battery over 15 positions). ttt333 — a draw
under perfect play. Hex — no draws are ever possible (Hex theorem, battery) and the
first player wins (Nash). Kōnane — a loopfree normal-play game (every move strictly
removes a stone) so the value is a definite WIN/LOSS with no draw; full retrograde
proves the first player loses this 4×4 opening. (3,4,3) — a first-player win,
unlike (3,3,3) which draws.

---

## §5 — The page (dark-drafting demonstrator)

Game picker · click to move · the engine replies with a provably-optimal move ·
**Reveal verdicts** (tints each legal move WIN/LOSS/DRAW + exact "mate in N") ·
**Hint** (the proven best move) · **Watch it play** (perfect-vs-perfect; step ▶ or
run; halts at the proven outcome + distance) · an honest "you had a forced win — you
let it slip" callout when the human moves off a WIN node · New game / opponent
toggle · Copy + 2× PNG export of the proof-annotated board · a `← workshop`
back-link. A green chip shows the live self-test pass count, computed by calling the
**same** `Adversary.runSelfTest()` the Node test calls (render and proof can't
drift). No audio.

Self-contained, zero-dependency, single file. Built by forge from
`adversary/index.src.html` (inlines the engine + 5 defs + `ws.js`).

---

## §6 — The self-test (the proof that ships)

`node tools/game/adversary.test.cjs` (target ≥30 checks): **(1)** literature value
per def; **(2)** table self-consistency (WIN ⇒ ≥1 LOSS child & dist = 1+min losing
child; LOSS ⇒ all WIN children & dist = 1+max child; DRAW never has a LOSS child);
**(3)** optimal-vs-optimal reaches the predicted outcome in the predicted distance;
**(4)** perfect player never loses from any non-LOSS reachable node (exhaustive +
random-opponent sweep); **(5)** determinism + symmetry-canon soundness
(`value(canon(s)) == value(canon(sym·s))`); **(6)** budget honoured. Plus
cross-cutting checks (deterministic solve, seeded-PRNG determinism, the agent hook,
the llmPlayer stub).
