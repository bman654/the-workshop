# The Stone Heaps — changelog

The twelfth bench of the Numbers Room, and the estate's first **playable combinatorial game**: Nim
made touchable. Three felt rows of brass stones — sweep away any number from **one** row, take the
last stone to win, and a flint AI answers with provably perfect play. The headline is the hidden
invariant: with the balance on, each row groups into binary place-columns (**4s · 2s · 1s**) and a
bar of column-lamps lights each bit of the **nim-sum** (the XOR of the heap sizes). You're losing
iff the nim-sum is zero; the winning move always darkens every lamp. The board literally *is* the
binary.

## Architecture (reuse, not reinvention)

Unlike its sibling benches, this piece has **no `core.mjs` of its own**. Its sole move-authority is
the estate's already-proven game engine — the page only reuses it:

- **`tools/game/adversary.js`** — `Adversary.solve` (memoised minimax), `perfectPlayer`,
  `randomPlayer`. The AI's every move comes from `perfectPlayer` over `solve(def)`; re-solved per
  shape, cached.
- **`tools/game/games/nim.js`** — `GAME_nim.makeNim(heaps)`, the impartial Nim definition.
- **`tools/ws/ws.js`** — the breadcrumb drop (`ws:seen:nim`).

`index.src.html` is the authored source; **`index.html` is the forged artifact** with those three
modules inlined byte-true (`node tools/forge/forge.mjs nim/index.src.html`). No edits were made to
`tools/game/*`; `node tools/game/adversary.test.cjs` stays **38/38 PASS**.

The renderer is a declarative Painter op-list. The VERB is a unified pointer drag-sweep
(`touch-action:none`) with a plain-click shortcut and an arrow+number keyboard floor — every path
resolves to the same `{heap, take}` move object. No audio.

## Claims & self-test (mirrored in the in-page pill and a Node twin)

The green pill reads **self-test 4/4 ✓ · nim-sum=0 ⟺ you lose · misère flips the endgame · lamp
reads the oracle** (click it for the full breakdown; `console.table` on load):

- **(A) NORMAL invariant** — `nim-sum=0 ⟺ LOSS` over the full 48-node reachable tree of
  `solve(makeNim([3,4,5]))`: 0 mismatches, 0 draws.
- **(B) LAMP == ORACLE** — the balance lamp's verdict (nim-sum 0 ⟺ opponent LOSS) agrees with the
  solver over 5 configs / 2862 moves: 0 mismatches.
- **(C) NEG-CONTROL (misère)** — a page-local def = clone of `makeNim` with **only the terminal
  flipped** (last stone *loses*), solved through the same `Adversary.solve`. It diverges from the
  raw XOR oracle **exactly** on the all-(nonempty)-heaps-≤1 set (incl. the empty board) and nowhere
  else: 295 nodes, 23 in-region divergences, 0 out-of-region, 0 region-misses. With the balance on,
  you watch the XOR-to-zero rule visibly *lie* in the endgame — proving the invariant is
  win-condition-specific, not magic.
- **(D) PLUMBING** — back-link to `../numbers-room/index.html`, the `ws:seen:nim` breadcrumb,
  move-authority is `Adversary.perfectPlayer/solve/makeNim`.

A standalone Node twin (built during review, in the session scratchpad) reproduces all four checks
against the real `tools/game/*` and prints **4/4 PASS** independently.

## Discovery arc

The **⚖ show the balance** chip is locked behind a legible dimmed teaser and unlocks after **2
losses** (`onGameEnd`: `if(!unlocked && losses >= 2) unlockBalance()`), with the payoff line
*"The AI isn't clever. It's reading this. Now so can you."*

## Publisher's fresh-eyes review (cycle #190)

- **CAUGHT + FIXED a game-breaking turn-loop bug.** Turn ownership was derived from
  `STATE.history.length % 2`, but `history` holds **one snapshot per human move** for Undo — the
  AI's reply (`engineReply`) pushes nothing. So after the very first round, `history.length` stayed
  odd, `isHumanMover()` returned false forever, and `humanMove`'s guard silently dropped **every
  subsequent move**: the board froze after move one. (The builder's self-test verifies the solver
  oracle, not the page's turn loop, so it didn't surface this.) Root-cause fix: an explicit
  `STATE.ply` counter bumped on **every** ply (human, AI, watch), `isHumanMover()` reads
  `ply % 2 === 0`, `resetPosition` zeroes it, and `undo` restores `ply = history.length * 2` (the
  at-rest invariant `ply === 2 · completed-rounds`). Verified live: full games now play through, the
  AI is unbeatable, losses tally, and the balance unlocks at exactly 2 losses. Re-forged.
- **FIXED the mobile topbar.** At ≤560px the long self-test text shoved the title into a 3-line wrap
  and the green pill overlapped/clipped it. The topbar now wraps: back-link + title share row 1, the
  pill drops to its own full-width ellipsis-clipped row, and `#stage` top-padding clears the taller
  bar. Desktop unchanged.
- Verified: forge `--check --all` all current · adversary 38/38 · Node twin 4/4 · in-page pill 4/4
  green · the Numbers Room landing pill 20/20, 12 bench cards, no nested anchors · no horizontal
  overflow at 390px or 1280px · console clean.
