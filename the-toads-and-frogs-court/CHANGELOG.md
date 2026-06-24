# The Toads & Frogs Court — changelog

## #313 — born (2026-06-24)

The Numbers Room's first **partisan** game, the impartial↔partisan sibling to The Nimber Strip.

- A one-lane court of recessed felt slots holds green **Toads** (yours — march right) and coral
  **Frogs** (the flint AI — march left). Two-click select flow: click a Toad → brass selection ring +
  pulsing teal landing-ghosts on each legal destination; click a glow to commit. A **slide** translates
  one square; a **leap** hops parabolically over a single opponent (who is NOT captured — it recoils and
  stays) tracing a dashed brass arc. Keyboard parity (Arrow/Enter/Esc/R/U). Reduced-motion honoured.
- **The brass value loupe** names every position from the live algebra: a number, the star **∗**, an
  infinitesimal **↑/↓**, or a value with no short name (honest raw canonical fallback — never a lie). The
  rim recolours teal/coral/amber so who-wins reads at a glance, and a game-over override confirms the
  abstract value and the played truth agree.
- An on-ramp: a 3-sentence hero lede (impartial Nim → one nimber; here different move-sets → partisan →
  a surreal value) plus a default-closed `<details>` aside, "Why a number, and not a Nim-number?".

### The engine (`core.mjs`) — two independent oracles

- `value(b)` — the canonical-form Conway game value, built bottom-up through the move tree and reduced
  by the simplicity rule (dominated-removal + reversible-bypass to a fixpoint). NOT a closed enum.
- `outcome(b)` → `L|R|N|P` — a CODE-DISJOINT pure-boolean negamax (imports nothing from the value
  algebra). This is the who-wins authority the page reads, because `sign()` alone cannot tell ∗ (class N)
  from 0 (class P): both have sign 0.
- `bestMove(b,side)` — perfect play (a move leaving the opponent-to-move losing if one exists, else
  deterministic best-resistance). The AI plays `bestMove(board,'F')`.

### Self-test (`core.test.mjs`) — `node the-toads-and-frogs-court/core.test.mjs` exits 0 ALL GREEN

Five in-page rows (exhaustive sweep len≤6, 1093 boards):
1. **zero ⟺ mover-loses** — `isZero(value(b)) === (outcome(b)==='P')` ∀ board (two disjoint oracles agree).
2. **sign ⟺ winner** — `sign(value)` maps `+→L −→R 0→P ||→N`, all four classes seen. Census L=335 R=335 P=348 N=75.
3. **textbook canonicals** — TTFF=0 · TF__=1 · __TF=−1 · T_F=∗ · TT_FF=∗ · T_TFF=↑ · TTF_F=↓ (judge-verified set).
4. **neg-control** — `value(mirrorSwap(b)) === negate(value(b))` ∀ board (the partisan direction-signature) +
   the asymmetry control (T___ a positive integer, ___F its negation).
5. **perfect play** — seeded (xorshift32 seed `0x70AD5`) self-play tournament, 400 starts: the side
   `outcome()` says wins never loses, and `bestMove` always lands on a winning child when one exists.

Plus the Node twin's stronger legs: B1 wider zero/sign over len≤7 (3280 boards), B2 canon idempotence +
eq antisymmetry, B3 negate involution + order-reversal, B4 wider neg-control + a value≠its-negative
exhibit (TF__=1), B5 wider tournament len 3..7, and C byte-parity of the inlined core.

> **Bound:** the exhaustive self-test stays ≤ length 7 by design — the board count is 3^len (length 7 =
> 3280 boards). Longer courts are PLAYABLE on the page but not exhaustively self-tested.

### Registration

- Hub card in `numbers-room/index.html` (🐸 · "partisan games · Conway's surreal values"); count 26→27,
  footer "twenty-seven benches", and a matching structural `ck()`.
- Bidirectional impartial↔partisan cross-link with **The Nimber Strip** (a `.bb-sib` each way).
- Drops `ws:seen:the-toads-and-frogs-court`; lens hook `window.__toadsFrogs`.

Built on `nimber-strip/index.src.html` chrome at the structural level. Forge: `node tools/forge/forge.mjs
the-toads-and-frogs-court/index.src.html`.
