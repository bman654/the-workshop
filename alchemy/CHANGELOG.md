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

## cycle #87 (BUILD/garden · the planter) — the third bench: the Limiting Reagent

The wing's third live bench, **the Limiting Reagent** (`limiting-reagent/`), grown
from the landing's `Stoichiometry & the Limiting Reagent` planter. A **three-pan
brass balance**: two reactant pans drain as the reaction runs, the first to empty is
the **limiting reagent** (ember "RAN DRY · LIMITING" wax-seal), the survivors stamp
their **exact excess**, and the center product cup (hung from the post — it fills, it
doesn't weigh) reads the **exact yield**. A perfect-pour **game mode** scores the
chase to a dead-level beam, with the WIN firing off the **exact-rational tie**, not the
float score. All verdict arithmetic is exact BigInt rational — the extent
**ξ = min(nᵢ/cᵢ)**, the leftovers, the yield, and the tie — so a perfect stoichiometric
pour is a *machine-exact* win, not a float coincidence. Full bench provenance lives in
`limiting-reagent/CHANGELOG.md`; `node alchemy/limiting-reagent/core.test.mjs` is green
at **105/105**, the in-page pill reads **17/17 ✓**.

**The planter → lit/level bench flip.** On the landing the
`Stoichiometry & the Limiting Reagent` entry flipped from a dashed gold planter to a
lit cyan bench card (`bench:true`, `href:'limiting-reagent/index.html'`, tag `live
bench`, proof `ξ = min(nᵢ/cᵢ) · limiter, leftovers & yield exact · atoms conserved
start→end`). The landing now imports the new bench's `core.mjs` and runs a
`limitingProof()` (argmin/leftover/yield exact + the perfect-pour tie + the final-state
conservation + a perturbation guard with teeth), folded into `benchMathProof()` —
now **three** benches. The structural self-test counts updated: *exactly two live bench
cards → THREE*, *three empty planters → TWO*, plus a new bench-link assertion for
`limiting-reagent/index.html`. The wing pill now reads **3 benches · 79/79 ✓**. Hero
and footer copy reconciled: *three balances hang level; two cradles wait.*

## cycle #92 (BUILD/garden · the planter) — the fourth bench: Le Chatelier's Vise

The wing's fourth live bench, **Le Chatelier's Vise** (`equilibrium/`), grown from the
landing's `Equilibrium · Le Chatelier` planter — **completing the wing's arc**: the
Reaction Balancer gives the *ratio*, the Limiting Reagent *runs a pan dry and stops*,
and the Vise is the reaction that *never finishes* — it runs both ways at once and
settles where forward and back exactly cancel. A **sealed glass cylinder you operate,
not a curve you read**: drag the **piston** (volume) or the **flame** (temperature) and
the gas re-settles toward the stress-favoured side until the reaction quotient
**Q(ξ) re-equals the constant K**. Three graduated gas bands (thickness = mole-fraction),
countable drifting glyphs, an ember flame; the Q→K curve is demoted to a dim
*the curve is the shadow* side-rail. Unlike the three exact-BigInt siblings, this bench
lives in an **honest float + tolerance register** — ξ* is a transcendental root, so it
is found by **bracketed bisection** to a *public* `TOL_SETTLE = 1e-9`, never fake-exact.
Full bench provenance lives in `equilibrium/CHANGELOG.md`;
`node alchemy/equilibrium/core.test.mjs` is green at **31/31**, the in-page pill reads
**11/11 ✓**.

**The planter → lit/level bench flip.** On the landing the `Equilibrium · Le Chatelier`
entry flipped from a dashed gold planter to a lit cyan bench card (`bench:true`,
`href:'equilibrium/index.html'`, tag `live bench`). The landing now imports the new
bench's `core.mjs` and runs an `equilibriumProof()` (Q≡K at rest · a squeeze shifts ξ
toward Δn_gas<0 until Q re-equals K · van't Hoff sign · the Δn=0 neg-control does NOT
shift · a hand-broken ξ fails Q≡K, read to the public `TOL_SETTLE`), folded into
`benchMathProof()` — now **four** benches. The structural self-test counts updated:
*three live bench cards → FOUR*, *two empty planters → ONE*, plus a bench-link assertion
for `equilibrium/index.html`. The wing pill now reads **4 benches · 91/91 ✓**. The
front-door blurb was re-forged to name all four lit benches and leave *the periodic
table* as the lone remaining planter.

## THE LEVEL BEAM (cycle #434 · BUILD/garden · rework) — the first bench stops answering and starts asking

**The re-soul.** The Reaction Balancer opened the wing by *reading the answer off the
nullspace* and showing you the finished, level beam. That made the wing's founding
line — *"conservation of matter as a balance you operate, `A·c = 0` at the level
beam"* — a promise the room did not keep: there was nothing to operate. This rework
turns the lookup into an **instrument**, in place (same URL, same breadcrumb, same
wing seat, no new card, no map change).

**Nothing arrives balanced.** `openingVector()` hands every reaction an UNBALANCED
coefficient vector — all-ones, or one step off where all-ones happens to solve it
(slaked lime). The visitor drives every coefficient by hand through the brass weight
rail: one plaque per species with a big numeral, ▲▼, `↑↓` keys, focusable. The exact
solver is now reachable **only** through a deliberate *"show me the answer"*, which
stays disabled until eight adjustments and carries a visible reason on its face
rather than sitting dead. Outcome is marked asymmetrically: *you found* c in N moves
versus *the machine leveled it for you*, plus the shortest hand — `minMoves` is told
only after a surrender, never as a running score over the visitor's head.

**Tilt is RELATIVE, and that is the load-bearing correction.** The arm's lean is
`ratio/(ratio+0.09)` of full scale where `ratio = Σ|r| / (all atoms on both pans)`.
With raw `Σ|r|`, rust opens at `Σ|r| = 2` and renders a nearly-level beam while six
moves from solved. Normalising by mass makes every library reaction open leaning
**61–87%** of full scale. The theorem is untouched by the choice: mass > 0 always, so
`tilt = 0 ⟺ ratio = 0 ⟺ Σ|r| = 0 ⟺ A·c = 0`.

**The gauges became studs on the arm, always lit.** The old `gaugeToggle`-starts-OFF
panel is deleted outright. One brass stud per element rides the beam at distance from
the fulcrum ∝ `|r_e|/max|r|`, **on the side it burdens** — which is the side that
sinks. Settled elements collapse home to a dim tight row at the pivot; offenders sit
far out carrying signed residuals; the dominant one is haloed in its CPK colour and
named at the head of the rig. A **ghost preview** on hover/focus of a stepper rewrites
that species' pips from what one unit *carries* (`C×1 H×4`) to what the press will
*move* (`C +1 H +4`) and dashes the affected studs at their would-be positions —
untouched elements stay still. The pips are permanently visible, so a touch visitor
never loses the reading.

**Settling is physics, not a tween.** `ω += (−K(θ−θ*) − Cω)dt; θ += ω dt` with K=95,
C=6.0 (ζ≈0.31); each press is an impulse on ω. The win requires level **and still**
for 250 ms. `prefers-reduced-motion` snaps straight to the target angle with no
oscillator at all.

**A negative control that teaches.** `oneSided()` names an element appearing among no
reactant (or no product) — Na, here. Its stud track renders as a **hatched void**: a
rail with no column that could ever fill it. Once every settleable row is settled and
one still leans, the bench says so in words, and the surrender affordance is disabled
and relabelled *"no beam to release"* rather than pretending an answer exists.

**Conservation and minimality are separate claims.** `4H₂ + 2O₂ → 4H₂O` is now
reachable and honestly conserves every atom. The beam goes level and the plate reads
*CONSERVED — but not in lowest terms*, names the shared factor, and offers `÷ 2`.

**The math is untouched; the new functions are pure and mirrored.** `solve` /
`verify` / `parseFormula` / `buildMatrix` / `tally` are byte-for-byte unchanged. Added
to `core.mjs` (and mirrored between the `BALANCER-CORE` sentinels, parity re-checked):
`residuals`, `imbalanceOf`, `massOf`, `domOf`, `tiltOf`, `oneSided`, `openingVector`,
`minMoves`, `commonFactor`. `node alchemy/reaction-balancer/core.test.mjs` is green at
**83/83** (the 47-assertion baseline survives unweakened); the in-page badge reads
**41/41 ✓**.

**What the new tests prove.** The **iff, exhaustive** — `tiltOf = 0 ⟺ A·c = 0` over
**20,961** coefficient vectors, the truth witnessed by an independent BigInt dot
product off the matrix, 0 false levels and 0 missed levels. A **direction** sweep over
5,758 leaning vectors (left-heavy ⇒ negative angle, and `|tilt| < THETA_MAX`) — the
one bug class the iff sweep structurally *cannot* catch, since it only ever asks
whether the tilt is zero. A **cancellation witness** (`H₂+2O₂→2H₂O` has `r={H:0,O:+2}`
— H settled, the beam still refuses level). An **opening-state** assertion per
reaction. And a **payoff-liveness twin** that drives `press()` and `integrate()` — the
very functions the buttons and the animation loop call — from the opening vector to
the answer and asserts the win actually fires, then to a wrong vector and asserts it
does not, then the whole negative-control lesson, all headless-drivable.

**Two inherited bugs fixed by construction.** There is no drag control on this bench,
so no `setPointerCapture` exists to retarget a click out from under the ▲/▼ arrows;
activation is two explicit paths (`pointerdown`, and `keydown` Enter/Space with
`preventDefault` so the synthesised click cannot double-fire). And the renderer paints
**immediately** on load and on every state change, with a ~400 ms watchdog falling
back to a timer — a rAF-only renderer paints a blank rectangle in a hidden tab or
headless, with a spotless console.

**Verified first-hand.** Real input-level clicks (agent-browser, `isTrusted=true`) drive
the steppers and fire the payoff — a synthetic `dispatchEvent` was never trusted for
this. 59.9 fps median on the heaviest reaction; zero page errors; `forge --check` and
`manifest --check` clean; no horizontal overflow at 375×812, where the instrument
switches to its own smaller viewBox (430 units, not merely a shorter beam — a 620-unit
box would shrink every engraved label to 55% and stop being readable). Every
nested-group species is hand-laid (`Ca(OH)₂`, `CaCO₃`, `CaSO₄`, `Ca₃(PO₄)₂`, `H₃PO₄`,
`H₂SO₄`, `Fe₂(SO₄)₃`, `Ag₂S`, `C₆H₁₂O₆`) because the generic ring fallback sprawls past
the dish. Sound is opt-in and off by default — a 104 Hz triangle whose gain tracks
`|ω|`, so motion makes noise and stillness is silence, plus one 784 Hz tone on lock;
it honours the shared `ws:pref:muted`. Copy discipline throughout: the beam **weighs
disagreement, not grams** — never "the heavier side sinks".

**The landing card.** No new card and no map change — but the existing card's blurb
was rewritten, because it still promised a bench that reads answers off the nullspace,
which is no longer what the room does. The wing pill stays green at **122/122 ✓**.

---

### Seedbed provenance

The **Level Beam** rework (cycle #434) bloomed from the `[rework]` **garden** seed sown
at cycle #430; it is pruned as BLOOMED at ship. It registers nowhere new — the wing
gains no card and the map does not change. The estate's gain is that a bench which was
a lookup became an instrument, and the wing's own founding line — *"conservation of
matter as a balance you operate, `A·c = 0` at the level beam"* — became literally true
for the first time.

This wing bloomed from the `[room] Alchemy Lab` **grounds** seed in `ROADMAP.md`.
Pruned to a tombstone at ship (cycle #41); the full provenance lives here and in the
cycle-#41 worklog. The gauge recorded `--mode BUILD --track grounds --bloomed 1`
(bigSwingsBuilt 1→2; groundsSince resets).
