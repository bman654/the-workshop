# The Patience Engine — SPEC

*A card-solitaire engine whose dealer ships **only provably-winnable deals**.*

The workshop's signature is "every piece carries a built-in self-test that PROVES
its core claim." The Patience engine is the estate's first card/deck piece, and it
keeps that promise the way **Lantern** does for tales and **Daedalus** does for
mazes: a headless **solver** searches a dealt game for a winning line, and the
**dealer only emits deals the solver has already beaten** (rejection sampling). So
the claim "every deal you are given is winnable" is *true by construction* and
*proven by replay* in the self-test.

---

## §0 — THE CRUX (what is proven, and how)

**Claim (headline).** *Every deal the engine hands you is winnable — and we can
prove it, for that exact deal, by replaying a winning line move-by-move to the
win.*

**How the claim is made true by construction.** The dealer does not deal a random
board and hope. `dealWinnable(seed)` **rejection-samples**:

1. Deal a board deterministically from `seed` (seeded Fisher–Yates shuffle).
2. Run the headless **solver** on it (a deterministic best-first / weighted-A\*
   search over canonical state keys, with a transposition table, the FreeCell
   "safe automove" pruning, and a node budget).
3. If the solver finds a winning move-sequence within budget → **keep this deal**
   and cache its solution (for hints + auto-solve). Otherwise advance the seed and
   retry.

Therefore *every* board the engine ships is one the solver has *already won*. The
solution is recorded and travels with the deal.

**How the claim is proven (the self-test, `runSelfTest`, run identically by
`node tools/patience/patience.test.cjs` and the page's green chip).** Five
load-bearing properties, over a battery of dealt boards:

1. **Solver soundness** — every solution the solver returns is a *legal*
   move-by-move sequence: each recorded move is a member of `legalMoves(state)`
   for the state it is applied to. We replay every shipped deal's line and verify
   each step is legal.
2. **Winnability guarantee** *(the headline)* — every deal the dealer ships is
   solved AND its recorded solution **replays to `isWin`**. (Battery of 40+
   distinct dealt boards, all replayed to a win.)
3. **Determinism** — `seed → identical deal → identical solution` across two runs
   (deep-equal on both the dealt state and the move list). No `Math.random`, no
   wall-clock anywhere in the core.
4. **Move-generator correctness** — every move `legalMoves` generates obeys the
   variant's rules (alternating-colour tableau stacking, foundation order,
   free-cell / empty-column limits); and `applyMove` *throws* on any move that
   would create an illegal state, so **no illegal state is reachable** through the
   legal API. Validated over thousands of generated moves.
5. **Conservation** — every reachable state has *exactly* the deck size of cards,
   with **no duplicates and no losses**, across long random legal play from
   several deals.

**Honest scope.** The proven claim is: *every **dealt (shipped)** game is
winnable* — by construction (the solver-gated dealer) and by replay (the recorded
line reaches the win). It is **not** a claim that *all conceivable* deals of the
variant are winnable (some FreeCell deals are famously unwinnable; the dealer
simply never ships those). It is also not a claim that the player *will* win — you
can still strand yourself by bad play (`Undo` and `Hint` are there for exactly
that). The guarantee is about the *deal*, not the *play*.

---

## §1 — THE VARIANT (data + pure rules)

The shipped variant is a **compact FreeCell**: a reduced **28-card** deck (4 suits
× ranks **A–7**), dealt into **6 columns**, with **3 free cells** and the 4
foundations.

**Why this variant.** FreeCell is the famously-winnable, well-understood,
tractable solitaire (the standard 52-card game is winnable for all but a vanishing
fraction of deals, and has decades of solver literature). It is the *recommended*
target. We deliberately **shrink the deck** rather than ship full 52-card FreeCell
as the everyday game, because:

* **A fast, reliable winnability proof matters more than flash.** The whole point
  is a dealer that *reliably* rejection-samples in the browser without stalling.
  With 28 cards the reachable graph is small, the best-first solver wins
  essentially every dealt board in **a few thousand nodes** (battery average
  ≈ 3.7k nodes, hardest ≈ 47k), and a 40-deal proving battery runs in **well under
  a second**. Full 52-card FreeCell's hard deals can cost orders of magnitude more
  search — flaky for in-page rejection sampling.
* **It is still recognizably, honestly FreeCell** — same rules, same all-open
  information, same "every card visible, free cells as temporary parking" feel —
  just a shorter, brisker game (a hand is ~35–55 moves to solve).

**The variant is data, not hard-code.** `makeVariant({ranks, free, cols})` returns
the rule parameters; the *same* engine deals + solves a full **52-card** FreeCell
(`makeVariant({ranks:13, free:4, cols:8})`) — the self-test proves it does, as a
generality check. The page plays the 28-card variant for snappy, reliably-winnable
hands.

### Model

A **card** is an integer `0..deckSize-1`: `suit = card & 3`, `rank = (card>>2)+1`;
suits `0,1` are red (♦ ♥), `2,3` black (♣ ♠).

A **state** is a plain serialisable object:

```
{ free:  [card|null × FREE],     // the free cells
  found: [topRank × 4],          // foundation top rank per suit (0 = empty)
  cols:  [ [card, …] × COLS ] }   // tableau columns, index 0 = bottom
```

A **move** is `{ from, to, card }` with location tokens `fN` (free cell), `cN`
(column), `F` (foundations). Moves are **atomic single-card** moves — the page's
multi-card "supermove" drag/click is just a replay of several atomic steps, so
soundness is always checkable one card at a time.

### Pure rule functions (the public surface)

* `initialDeal(variant, seed)` — deterministic shuffle + round-robin deal.
* `legalMoves(variant, state)` — every atomic legal move now. Canonicalises
  symmetric targets (only the *first* empty free cell and *first* empty column are
  distinct destinations) to shrink the branching factor.
* `applyMove(variant, state, move)` — a **new** immutable state; **throws** on an
  illegal move.
* `isWin(variant, state)` — all four foundations built to the top rank.
* `key(variant, state)` — canonical hash for the transposition table; free cells
  are order-independent and empty columns interchangeable, so symmetric states
  collapse.

---

## §2 — THE SOLVER

A deterministic **best-first (weighted-A\*)** search: `f = g + W·h`, `g` = moves so
far (so we prefer short, *watchable* lines), `h` = a foundation-distance heuristic
(cards still off the foundations, occupied free cells, buried low cards), `W = 3`
(goal-greedy). A **transposition table** (visited `key(state)` → best `g`) gives
cycle avoidance and dedup; a **node budget** (default 200 000) caps the work.

On entry to every node the solver plays out **forced "safe" foundation automoves**
(a card auto-homes only when it can provably never be needed to host a tableau
move) — a standard, sound FreeCell pruning that collapses huge swaths of the tree.

`solve` returns `{ solved, line, nodes, reason }`. The `line` is the exact atomic
move sequence whose replay reaches `isWin`; on the compact variant it is ~35–55
moves — short enough to **watch it solve itself**. No `Math.random`, no clock.

`shortenLine(variant, deal, line)` is a sound utility that splices any
state-key-recurring loop out of a line (kept for completeness; the best-first
search already returns short lines).

---

## §3 — PLAYERS (the Lantern idiom)

A "player" is `(state, …) → move` over the recorded winning line:

* `hint(variant, state, line)` — the next move on the recorded line that is legal
  right now (drives the **Hint** highlight).
* `linePlayer(line)` — a stateful `(variant, state) → move` that walks the recorded
  line, verifying each move legal before returning it (drives **Watch it solve
  itself** — the auto-play replay). It tolerates re-sync after `Undo`.

---

## §4 — THE PAGE

A dark "felt"-table demonstrator (`patience/index.html`, built by forge from
`index.src.html`):

* **Deal (guaranteed winnable)** — calls `dealWinnable`, shows the kept seed.
* **Click-to-move** play — click a card/run, then a destination; illegal moves are
  rejected (`applyMove` throws → the UI declines).
* **Hint** — highlights the next move from the cached solution.
* **Watch it solve itself** — animated auto-play of the recorded winning line
  (step ▶ or run), via `linePlayer`.
* **Undo**, a **win celebration**, a `← workshop` back-link.
* The **green self-test chip** (`patience verified — N/N ✓`) runs the *same*
  `runSelfTest` core as the Node test, so the chip and the command line are the
  same proof.
* `WS.seen('patience')` is recorded at parse time (the workshop's hidden-growth
  breadcrumb), wrapped in try/catch.

No audio. Single self-contained file, no dependencies, no network.

---

## §5 — FILES

* `tools/patience/patience.js` — the DOM-free dual-use engine (Node-requireable +
  browser global `Patience`). The one source of truth.
* `tools/patience/patience.test.cjs` — the headless self-test (`node …`).
* `patience/index.src.html` → forge → `patience/index.html` — the page (inlines
  `../tools/patience/patience.js` + `../tools/ws/ws.js`).
* `patience/SPEC.md` (this file) + `patience/CHANGELOG.md`.
