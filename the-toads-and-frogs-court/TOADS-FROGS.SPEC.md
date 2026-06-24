# The Toads & Frogs Court — SPEC

A touchable **partisan** combinatorial game, the impartial↔partisan sibling to The Nimber Strip.

## The game

A one-lane strip over `{'T','F','_'}`. **Toads** (`T`, Left, green, yours) move RIGHT; **Frogs**
(`F`, Right, coral, the AI) move LEFT.

- **Slide**: a creature moves into the empty square just ahead of it.
- **Leap**: a creature hops over a single creature of the OTHER colour into the empty square beyond. The
  leapt creature is **NOT captured** — it stays put.
- A side with no legal move **LOSES**.

## The two oracles (the heart of the correctness claim)

A partisan game cannot be summarised by one nimber, so the loupe leans on two **independent** computations
that must agree:

1. **`value(b)`** — the canonical-form Conway combinatorial value `{ Left's options | Right's options }`,
   built bottom-up and reduced by the simplicity rule (dominated-removal + reversible-bypass to a
   fixpoint). From it: `sign()` (order vs 0) and `isZero()`. NOT a closed enum.
2. **`outcome(b)` → `L | R | N | P`** — a **code-disjoint** pure-boolean negamax (`leftToMoveWins` /
   `rightToMoveWins`) that imports nothing from the value algebra. This is the who-wins authority the page
   reads — `sign()` alone cannot distinguish ∗ (class N) from 0 (class P), since both have sign 0.

The page is a pure dressing layer: it never recomputes a value or winner from a formula. The loupe prints
`name(value(b))` and picks its colour/headline from `outcome(b)`.

## The contract (`core.mjs`, between the `// ===== TOADS-FROGS CORE … =====` sentinels)

- `leftMoves(b)`, `rightMoves(b)` → `{from,to,kind:'slide'|'leap',over:int|null}[]`, deterministic order
  (left-to-right by `from`, slide before leap).
- `legalMoves(b,side)`, `apply(b,move,side)`, `isTerminal(b,side)`.
- `value(b)` (canonical Game); `sign`, `isZero`, `name`, `negate`, `eq`, `leq`, `geq`, `gkey`, `canon`.
- `outcome(b)`, `leftToMoveWins`, `rightToMoveWins`, `bestMove(b,side)`.
- `mirrorSwap(b)` (reverse the strip AND swap T↔F — the negation symmetry).
- `runSelfTest()` → `{ok,passed,total,checks:[{name,pass,info}]}` (same shape as nimber-strip).

The board is a **STRING** in the page and an **ARRAY** in the core; the page converts at the boundary
(`b.split('')` / `arr.join('')`).

## Self-test bound (asserted here)

The exhaustive self-test sweeps **stay ≤ length 7 by design** — the board count is `3^len`, so it grows
exponentially (length 7 = 3280 boards). Longer courts are fully **playable** on the page (the algebra and
the negamax both recurse to any length), but they are **not exhaustively self-tested**. The five in-page
rows sweep len≤6 (1093 boards); the Node twin's wider legs sweep len≤7 (3280 boards).

## Census (an invariant, not a target)

Outcome classes over all boards len≤6 (1093 boards): **P=348, L=335, R=335, N=75**. Over len≤7 (3280):
**P=818, L=1110, R=1110, N=242**.

## Build

`node tools/forge/forge.mjs the-toads-and-frogs-court/index.src.html` inlines `core.mjs` byte-for-byte
between the sentinels (plus `tools/ws/ws.js` at the tail). `node the-toads-and-frogs-court/core.test.mjs`
exits 0 ALL GREEN (including leg C, the byte-parity check of the inlined slab).
