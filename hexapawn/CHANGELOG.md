# The Matchbox That Learns — changelog

A by-hand Hexapawn board plus a MENACE matchbox machine you can watch teach itself to
stop losing. The machine has no strategy: each position it meets gets a tray of coloured
beads (one per legal reply) and it moves by drawing one at random; when it loses, it
throws that game's beads away. Beat it a few times, then try to win again — the
win-streak meter climbs, then cracks the first match it refuses to lose.

## The 4-file pattern

- **`tools/game/games/hexapawn.js`** — the solved-tree game-def for the shared engine
  (`tools/game/adversary.js`). Dual-use IIFE + module guard, maps 1:1 onto hex3.js.
  Board = `Array(9)` of `0|'W'|'B'`; White (players[0]) moves first, UP; Black moves DOWN.
  Win by reaching the far rank, capturing all enemy pawns, or stalemating the opponent —
  no draws. `key()` canonicalises under the left-right mirror (value-preserving) + the
  side-to-move. Adds `canonicalMoveId()`/`liveMove()` so the learner can index beads by
  canonical id while the UI only ever animates live moves (the mirror round-trip — get
  it wrong and the machine appears to teleport). Registered in `adversary.test.cjs`.
- **`core.mjs`** — the SOLE pure engine (the matchbox learner). Builds the machine boxes
  over the solved tree, runs the MENACE draw/discard loop, and proves convergence. The
  body between the two sentinel lines is inlined byte-identically into `index.html`.
- **`core.test.mjs`** — the Node twin. createRequire pulls the CJS engine + def; runs the
  in-page self-test oracle + four deeper legs (A–E). Exit 0 = GREEN.
- **`index.html`** — self-contained page (forge-built from `index.src.html`): the brass
  board, the matchbox rack (lazily-materialized trays with ghost micro-boards + countable
  bead piles), the discard trough, the win-streak meter, the green proof pill, auto-play,
  the reward-the-loss neg-control, and the solver-reveal overlay. Engine + def inlined by
  forge; the learner core inlined byte-identical between the sentinels.

## Proven (the green pill = `node hexapawn/core.test.mjs`)

- Hexapawn is a **second-player win, mate in 6** (71 reachable canonical nodes, 0 draws) —
  the classic Gardner/Gale result, by full retrograde analysis.
- The naive machine: **19 boxes, 47 beads, 17 losing replies**.
- The discard-on-loss complete trainer shrinks the reachable forced-loss count
  **R: 17 → 0 in exactly 15 strictly-decreasing steps**, monotone non-increasing
  throughout, terminating at a **minimax-optimal subset** (the converged machine reaches
  zero losing terminals over every human line).
- The **reward-the-loss negative control** runs the identical schedule with the sign
  flipped (ADD a bead instead of pulling one): **R: 17 → 32, strictly grows, never 0** —
  divergence is causal (the sign flip is the only difference).
- The inlined learner core in `index.html` is **byte-identical** to `core.mjs`.

## The proof vs honest-stat split

The green pill proves the MECHANISM converges (the in-page complete-trainer enumeration).
The running win/loss tally of your hand-played matches is an **honest live STAT**, never
claimed as the proof — a perfect human's corridor leaves most boxes full, so the UI never
promises "play a few games and every box empties."

## Registration

A new front-door footprint: `index.src.html` PLACES entry (`grounds · tier 2 · number`
wing, footprint `hexapawn`) + a `drawHexapawn` glyph; a sky field star at (1060, 560)
near its games kin The Clack Counter; `smoke.cjs` PLACES; the page drops `ws:seen:hexapawn`.
Reciprocal cross-links to The Adversary (the solved-games showcase, which links back) and
the Numbers Room.

— cycle 208
