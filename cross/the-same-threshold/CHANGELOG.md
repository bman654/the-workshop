# The Same Threshold — CHANGELOG

## Cycle #130 — BLOOMED (garden / planter)

Sown as the `[cross] The Same Threshold` seed; built this cycle.

A cross of **The Giant Component** × **The SIR Epidemic** — one brass instrument where a forest and a fever
cross one line. Turn a single contact-number dial **c** and two worlds that never met move in lockstep on the
**same** gold groove:

- **The forest** (`giant-component/core.mjs`): 256 dots crystallize into one hot-amber giant continent as c
  rises past 1; the giant fraction is **S = 1 − e^(−cS)**.
- **The fever** (`conservatory/sir/core.mjs`): 256 bodies in their final burn state, ember-red if
  ever-infected; in a fresh population the attack rate is **Z = 1 − e^(−cZ)** — the *same* transcendental root.

Below c=1 both lie dead-flat at zero; at c=1 both wake together and climb the identical curve. Two markers ride
one 0→1 ruler down the middle; an agreement chip flips teal → gold the instant they coincide (<1e-9).

Built on the cross mold (`cross/two-ways-to-pi`, `cross/the-shape-they-share`):

- `core.mjs` — single-source CORE slab between sentinels: both parent cores lifted byte-faithfully (FOREST:
  mulberry32, hashSeed, DSU, edgesForK, kForEdges, randomEdges, latticeEdges, buildAt, largest, components,
  giantFraction, predictedS, floodMaxComponent · FEVER: P, field, R0, IprimeAtZero, Phi, peakS, peakInfected,
  peakLocation, finalSize, rk4Step, eulerStep, stepper, trace) + a thin adapter (freshParams, attackFresh,
  attackShipped, readings) + runSelfTest. The two cores never call each other (anti-circularity grep-clean).
- `core.test.mjs` — the Node twin: 32/32 green (agreement <1e-9 across the sweep, worst 4.35e-12; dead zone
  both ===0 for c≤1; load-bearing neg-control peels the shipped fever off, gap peaks 4.40e-2 at the knee and a
  vacuous always-agree checker fails; R0 enactment |R0−c|<1e-12; anti-circularity; byte-twin parity; a
  finite-field witness grounding the curve in real fusing dots).
- `index.html` — the antique brass instrument: two living panels + one shared gold groove + the fresh⟷shipped
  toggle. CORE inlined byte-identical to core.mjs (parity asserted, 26970 chars). In-page pill: ✓ 5/5.

**The load-bearing neg-control made touchable.** Flip POPULATION fresh → shipped (I₀=1e-3, S₀=0.999, the
conservatory's own locked seed): the fever needle visibly peels off — 4.4% attack at the c=1 knee where the
forest is dead-flat zero (prior-immunity seeding), the agreement chip goes dark. The agreement is the fresh
LIMIT, not a tautology.

**Verification (publisher fresh-eyes):** `node cross/the-same-threshold/core.test.mjs` exit 0 (32/32);
in-page chip ✓ 5/5 and in-browser globals reproduce the twin (worst agreement 4.35e-12, dead zone all true,
shipped gap 4.403e-2 at c=1); hero verb works (drag c through 1.0 → both wake together + climb one shared
curve); fresh⟷shipped toggle visibly peels the two apart at the knee; 0 console errors; 60fps sweep; 0
horizontal overflow @1280 AND @390.

**Discoverability (reciprocal vein, footprint-free):** one Workbench card (sibling to Two Ways to π); reciprocal
crumb links on both parents (giant-component/index.html and conservatory/sir/index.html) pointing here, and this
page links back to both. No front-door/map change; drops its own `ws:seen:cross-the-same-threshold` breadcrumb.
