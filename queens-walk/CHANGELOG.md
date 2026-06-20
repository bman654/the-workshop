# The Queen's Long Walk — changelog

*A bench of the Numbers Room. Wythoff's game made touchable: a lone queen slides
toward home, and the squares you keep losing from turn out to be the golden ratio.*

---

## #198 — first bloom (BUILD/garden)

**What it is.** One queen on an 11×11 quadrant. She moves like a chess queen but
only toward the home corner (0,0): **left**, **down**, or **diagonally down-left**,
any distance. Land her home and you **win**; a flint AI answers with provably
perfect play. Click a square along one of her rays to slide her there. The board
is secretly two heaps and the move IS Wythoff Nim — the state `{a,b}` is the
queen's (column, row) distances from home, and her three rays are exactly the three
Wythoff moves (remove from a · remove from b · remove an equal amount from both).

**The quiet revelation.** The LOSING "cold" squares — the P-positions you are
forced to hand the opponent — fall exactly on the golden-ratio **Beatty pairs**
`(⌊nφ⌋, ⌊nφ²⌋)`, φ=(1+√5)/2 — two irrational-slope rails climbing the board (and
their reflections across the diagonal, since the board is symmetric). φ is the
GLOW: the cold squares light along the two rails only after the player has lost
twice and felt them as "the squares I keep losing from" (earned, not stamped).
The whole game becomes: shove the queen onto the next cold square and never let go.

**The form.** A real board you operate — not a graph. The queen's three rays draw
as guide-lines with a target ring on every reachable square; click to slide; the AI
answers by sliding to the next cold cell. Winning is the hero verb.

### The math claim (Q3 applies — this leans on math)

A NEW pure dual-use def `tools/game/games/wythoff.js` (state `{a,b}`; `legalMoves`
= the queen's three rays; terminal `{0,0}` = LOSS for the mover) is fed to the
UNTOUCHED shared engine `tools/game/adversary.js` `solve()` / `perfectPlayer` — the
Nim precedent, no new move-authority. A `literatureBattery` (like nim.js's) asserts,
over the FULL reachable table up to board size 40:

- **(A)** `solve()` value is a **LOSS (P-position) IFF the position is a golden
  Beatty pair** `(⌊nφ⌋,⌊nφ²⌋)` — 861 canonical nodes, 16 cold, **0 mismatches, 0
  draws**.
- **(B)** `perfectPlayer` from every WARM square **always lands on the next cold
  cell** (its chosen child is a Beatty pair) — 845 warm squares, 0 misses.
- **(C) NEG-CONTROL:** drop the diagonal ray → plain 2-heap Nim. The cold squares
  **collapse to the XOR=0 anti-diagonal** (a===b, all on the main diagonal) and the
  golden Beatty overlay **mis-predicts 55 squares** — the golden ratio VANISHES.
  The battery asserts the divergence.

The page forge-inlines `adversary.js` + `wythoff.js` **byte-identical**, so the
in-page green pill (4/4) IS the same proof as the Node twin
(`node tools/game/adversary.test.cjs`, which now carries the wythoff def and stays
green at 45/45). The engine itself is untouched.

### Files

- `tools/game/games/wythoff.js` (~270 L) — the pure def + `literatureBattery` +
  `makeWythoff` / `isBeattyPair` / `nimSum2` / φ helpers. Exported for the page glow
  and the engine test.
- `index.src.html` / `index.html` (~720 L) — the playable board (forge-built;
  `adversary.js` + `wythoff.js` + `ws.js` inlined). Self-test pill, the earned
  cold-square reveal, the diagonal-ray toggle (Wythoff ↔ Nim neg-control), perfect
  / random opponent, hint, undo, watch perfect-vs-perfect, three warm openings +
  random, keyboard floor (arrows / l-d-g).
- `CHANGELOG.md` — this file.

### Verified

- Node twin `node tools/game/adversary.test.cjs` — **45/45** (the wythoff def added
  to the roster; engine untouched).
- In-page self-test pill — **4/4 ✓** (byte-twin parity: the inlined `adversary.js`
  + `wythoff.js` bodies appear verbatim in the shipped page; the pill runs the SAME
  `runSelfTest`/`literatureBattery` and reproduces the Node numbers).
- Browser-verified (served :8794, agent-browser session `qw-build198`): a real
  click slides the queen and the AI replies; from the warm opening (7,3) the human
  first-mover WINS in mate-in-5, each move landing on a cold square; the reveal
  lights the golden rails; the neg-control collapses them to the diagonal; 390px
  mobile has 0 h-overflow.
- `forge --check --all` clean; `forge --audit-seen` all green (drops
  `ws:seen:queens-walk`); front-door smoke (exit 0, the pre-existing #103 CROWDED
  warning unchanged — no new POI added), sky 73/73, legibility 19/19.
- Registered: the Numbers Room landing gains a 13th bench card (♛); its self-test
  bumps to thirteen benches; the hero lede + footer counts updated.
