# The Alchemy Lab — CHANGELOG

The estate's first **chemistry** wing. The grounds had modelled light, motion,
quantum, relativity, waves, heat, number, information — but never **matter
recombining**. Set on the bench-ground just north of the Cavern: *the atoms the
physics drift takes apart are the ones you put back together here.*

## v1 (cycle #41 · BUILD/grounds · big swing #2) — the wing opens, with its first bench

**The native metaphor (form expresses content).** "Nothing is lost." Conservation
of matter **IS** a two-pan balance you operate — not a plotted curve. Atoms ride
into the pans as colored element tokens; the beam swings level only when every
element tallies equal on both sides, and `A·c = 0` is spoken at the instant the
beam reads level. The wing is **a wall of hanging balances**: each future bench is
a law of matter you can feel as weight and level.

**Palette = the apothecary.** Warm-black furnace ground (`--bg #0f0c14`), brass/gold
accent (`--gold #dca74a` — the wing's front-door accent too), glowing-reagent
cyan-green (`--reagent #7be0d0`), furnace ember (`--ember #e2683f`). Iowan-Old-Style
serif for labels, mono for numbers; a faint brushed-brass/soot texture overlay (the
furnace wall) and a candle-glow radial hero. The candle-breathe and any beam-settle
animation are gated behind `prefers-reduced-motion` (instant states when reduced).

**The front door.** A new PLACES entry `alchemy` (glyph ⚗️, accent `#dca74a`,
footprint `laboratory` at x:820 y:560) with a hand-drawn `drawLaboratory()` plan —
an alembic still + swan-neck dripping into a receiver, a two-pan balance-beam at the
heart (tipped slightly off-level), a shelf of glowing reagent jars, a south
door-swing toward the Cavern. Forged via `node tools/forge/forge.mjs index.src.html`
(0 label collisions; the front-door label self-test stays clean; `--audit-seen`
green — the page drops `ws:seen:alchemy`).

**The benches.**
- **The Reaction Balancer** (`reaction-balancer/`) — ONE live bench at launch.
  A brass two-pan balance: LEFT pan = the reactants' atoms, RIGHT = the products',
  as periodic-tinted element tokens (C slate, O ember-red, H bone-white, N indigo,
  Fe copper, …). A reaction RACK (the LIBRARY) loads a reaction; the solver reads
  the smallest-int coefficient vector straight off the **nullspace** of the
  element-count matrix and stamps "balanced · A·c = 0" with the beam level + the
  arrow igniting gold. A per-element conservation ledger (Σleft / Σright) runs
  alongside, green when equal. An optional "show the matrix" drawer makes the proof
  tactile (A, the nullspace vector, A·c as a column of exact zeros).
- **Four planters**, dashed and tipped in gold, named where the wing grows next:
  **Stoichiometry & the Limiting Reagent**, **pH & Titration**, **Equilibrium ·
  Le Chatelier**, **The Periodic Table**. No href — provably growing, not yet ground.
- A reciprocal **cross-wing bridge** (a lit cyan doorway, not a card) down to the
  Cavern's **Hydrogen atom** (`../cavern/hydrogen/`): *the atoms the physics drift
  takes apart are the ones you put back together here* — the bidirectional pairing
  the front-door blurb already promises.

**The math — `core.mjs`, the SOLE authority.** Exact **BigInt-rational nullspace**
(zero floats anywhere in the solve). A recursive nested-group `parseFormula`
(`Ca(OH)2 → {Ca:1,O:2,H:2}`, `Fe2(SO4)3 → {Fe:2,S:3,O:12}`); `buildMatrix` (rows =
elements, cols = species, **product columns negated**); `solve()` (a 1-D-nullspace
demand → **LCM-up then gcd-down** to the smallest positive integers; returns
`ok:false` **with a reason** for the over-determined / ambiguous / no-positive
cases); `verify()` (`A·c=0` exact per element by BigInt equality + gcd=1 + all>0);
`tally()`; and a **LIBRARY** of 10 real reactions + the negative control
`H2+O2→H2O+Na`.

**The proof can't drift.** `index.html` inlines `core.mjs` **byte-identical** between
`// ===== BALANCER-CORE … =====` / `// ===== END BALANCER-CORE =====` sentinels;
the in-page badge and the Node twin both re-extract those bytes and assert they
equal `core.mjs` (export-stripped). `node alchemy/reaction-balancer/core.test.mjs`
is **green at 47/47**: coefficients == known smallest ints, `A·c=0` exact per element
(BigInt), gcd=1 & all>0, the negative control returns `ok:false` with a reason,
perturbation guards reject wrong vectors, the nested-group parser, gcd/lcm
invariants, a 2-D-nullspace ambiguity-honesty case, **and the re-extraction parity
check** (the engine-room/demon precedent: page inline core IS `core.mjs`,
byte-for-byte — proven to have teeth: a one-char drift turns it RED).

**The landing self-test** does both: it tallies its own structure (exactly one live
bench, the bench link bare-relative, four named planters, every card frames a
hanging balance, the Cavern bridge present + relative, the breadcrumb dropped, no
nested anchors) **and** imports the live bench's `core.mjs` to re-run the curated
library proofs — so the pill reads "1 bench · N/N ✓" and the landing genuinely
attests the wing's **math**, not just its frame.

---

### Seedbed provenance

This wing bloomed from the `[room] Alchemy Lab` **grounds** seed in `ROADMAP.md`.
Pruned to a tombstone at ship (cycle #41); the full provenance lives here and in the
cycle-#41 worklog. The gauge recorded `--mode BUILD --track grounds --bloomed 1`
(bigSwingsBuilt 1→2; groundsSince resets).
