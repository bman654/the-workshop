# The Board That Cannot Tie — changelog

The **twenty-first bench** of the Numbers Room, and a new member of the Adversary family:
**Hex** made touchable, built to demonstrate one wonder you can WATCH — **a draw is impossible.**
Drop stones on a rhombic board to connect your two walls (gold joins top↔bottom, blue joins
left↔right), or press **Fill it randomly** and a coin-flipped *full* board always lights exactly
one spanning chain — never zero, never two — while a tie counter races up and stays **nailed at
zero**. Flip to a **square** 4-neighbour grid (the same coin-flips, only the diagonals dropped) and
ties start to climb: the no-draw was never the dice, it was the hexagon.

## Architecture (one core, two geometries)

The certified no-draw spine lives in **`tools/game/games/hexfill.js`** (185 lines), DOM-free and
dual-guarded — `(function(root){…})(typeof window!=='undefined'?window:globalThis)` plus
`module.exports` — so the forge-inlined page path and the Node twin run *identical* code.

- **`HEX_NB`** — the 6-neighbour Hex adjacency (≡ `tools/game/games/hex3.js`'s `NB`).
- **`SQ_NB`** — the 4-neighbour square adjacency (the negative control).
- **`makeDSU`** — a weighted union-find (Int32 parents + Uint8 rank, path-halving).
- **`spans` / `spanComponent`** — the spanning test, and the cells of the winning chain. The
  path-finder lives **in the core**, never hand-rolled on the page — the victory glow lights
  exactly the cells `spanComponent()` returns.
- **`classify` / `randomFill` / `battery`** — the per-board winner, a seeded fill, and the batch
  harness (a seeded LCG so the in-page chip ≡ the Node twin **bit-for-bit**).

`NB` is a **parameter**, so hex and square are the *same engine* with one variable swapped — the
neg-control isn't a different code path, it's the same union-find over a different adjacency.

The `3×3` first-player-WIN fact is supplied by the estate's already-proven solved-games engine
(`tools/game/games/hex3.js` + `tools/game/adversary.js`), reused via `Adversary.solve` — byte
unchanged by this bench.

## The claim (self-test is the sole authority)

In-page pill **7/7** (`window.__hexSelfTest`, "hex draw-rate 0 over 5000 fills · square >0") and
`node hex/index.test.mjs` → **8/8 EXIT 0**:

- **(A) NO-DRAW** — 5000 random *full* hex boards: ties = 0, both = 0, x + o = 5000.
- **(B) NEG-CONTROL** — 5000 square-grid fills DO tie (ties > 0).
- **(B′) EXHAUSTIVE** — *all* 512 of the 3×3 boards and *all* 65536 of the 4×4 boards: hex never
  draws and nobody ever double-spans, while the square grid DOES draw (3×3: 118 sq ties; 4×4:
  21150 sq ties).
- **(C) FIRST-PLAYER-WIN** — hex3 3×3 value is a non-draw WIN, mate-in-5.
- **(D) CROSS-CHECK** — `classify(HEX_NB)` ≡ hex3's `connects()`: exactly one winner each.
- **(E) RE-EXTRACTION PARITY** — the inlined 6762-char page slab byte-matches the module after the
  forge's guard strip.
- **(F) PLUMBING** — back-link · `ws:seen:hex` breadcrumb · `HexFill` + `GAME_hex3` + `Adversary`
  inlined.

## An honest framing note

The exhaustive check revealed that **`both`** (both colours span) is **always 0 on *both*
geometries** — on a 4-neighbour square grid, two opposite-colour spanning paths can't cross without
sharing a cell, so the square grid's only failure mode is a **tie** (zero spanning), never a
double-span. So the honest, exhaustively-verified claim the bench makes is: **hex ⇒ exactly one
spans (ties = 0, both = 0); square ⇒ ties > 0, both still 0.** The Brouwer one-liner is explicitly
*framing* — the bench demonstrates the no-draw theorem empirically and exhaustively at small sizes,
and the topology is *why*; no constructive proof is claimed or owed.

## Cycle #265

Shipped (builder + publisher). `hex/index.html` forged from `hex/index.src.html`; the rhombic
board, click-to-play, owner-gutters, and `hitNearest` lifted from the adversary's `modelHex()`.
Registered as the Numbers Room's 21st bench (reciprocal ⬡ card, class `bench exact`, after the
Chomp card; count bumped 20 → 21) and on the Workbench in "Games of perfect information" after The
Poisoned Bar. No front-door PLACES entry (a garden bench, like chomp — `bigSwingsBuilt` unchanged).
Publisher fresh-eyes review drove the full live loop (random-fill win + glow, the square neg-control
climbing ties with a red tally chip, hex staying tie-free with a green chip across 5×5/7×7/11×11,
manual click-to-play flipping the turn) — **no bug found, zero product edits.**
