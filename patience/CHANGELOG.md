# The Patience Engine — Changelog

## 1.0 — first light

The workshop's first **card / deck** piece: a reusable solitaire (patience) engine
whose **dealer ships only provably-winnable deals**. Mirrors Lantern (proves every
*tale* winnable before it ships) and Daedalus (solves its own maze): a headless
solver searches a dealt game for a winning line, and the dealer rejection-samples —
it only emits deals the solver has already beaten — so "every deal you are given is
winnable" is true by construction and proven by replay.

### Engine — `tools/patience/patience.js` (v1.0)
- DOM-free, dual-use (browser `Patience` global / Node `module.exports`), Lantern-
  shaped: one pure core + a headless solver; the variant is declarative data;
  players are functions over the recorded winning line.
- **Variant as data + pure rules.** Compact FreeCell (28-card deck: 4 suits × A–7,
  6 columns, 3 free cells) via `makeVariant({ranks,free,cols})`. Pure model:
  `initialDeal(seed)` (seeded Fisher–Yates + round-robin deal), `legalMoves`,
  `applyMove` (new immutable state; throws on illegal), `isWin`, `key` (canonical
  transposition hash; free cells order-independent, empty columns interchangeable).
  Cards are integers; states are plain serialisable objects. No DOM, no clock, no
  `Math.random`.
- **Solver.** `solve` — deterministic best-first / weighted-A\* (`f = g + 3·h`,
  `h` = foundation-distance heuristic) over canonical keys, with a transposition
  table, cycle avoidance, the FreeCell **safe-automove** pruning, and a node budget
  (default 200k). Returns a winning move sequence (~35–55 moves on the compact
  variant — short enough to watch) or "not found within budget". `shortenLine`
  splices loops out of a line (sound utility).
- **Winnable dealer.** `dealWinnable(seed)` rejection-samples: deal → solve → keep
  iff solved within budget (caching the proven line for hints / auto-solve), else
  advance the seed and retry. Every shipped deal is one the solver has beaten.
- **Players** (Lantern `(state,…)→move`): `hint` (next move on the line) and
  `linePlayer` (auto-solve replay; tolerates re-sync after Undo).
- **The generality proof:** the *same* engine deals + solves a full **52-card**
  FreeCell (`makeVariant({ranks:13,free:4,cols:8})`) — exercised by the self-test.

### Proof — `tools/patience/patience.test.cjs` + the page's green chip
The single `runSelfTest` core both share. Over a 40-deal battery (+ cross-cutting):
1. **Solver soundness** — every recorded line replays move-by-move, each move legal.
2. **Winnability guarantee** *(headline)* — every shipped deal replays to `isWin`.
3. **Determinism** — seed → identical deal → identical solution, twice.
4. **Move-generator correctness** — every generated move obeys the rules;
   `applyMove` rejects illegal moves, so no illegal state is reachable.
5. **Conservation** — exactly 28 cards, no dupes, no losses, across long random play.
Runs in well under a second (`node tools/patience/patience.test.cjs` → 11/11 PASS).

### Page — `patience/index.src.html` → `patience/index.html`
- Dark "felt" table, workshop chrome. **Deal (guaranteed winnable)** (shows the
  seed), **click-to-move** play (illegal moves declined), **Hint** (highlights the
  next move from the cached line), **Watch it solve itself** (animated replay of
  the winning line — step ▶ / run), **Undo**, a win celebration, `← workshop`
  back-link. No audio. The green self-test chip runs the same core as the Node
  test. `WS.seen('patience')` breadcrumb at parse time.
- Built by forge: `node tools/forge/forge.mjs patience/index.src.html` (inlines the
  engine + `ws.js`); ships as one self-contained file, no deps, no network.

See `patience/SPEC.md` §0 for the full crux and honest scope.
