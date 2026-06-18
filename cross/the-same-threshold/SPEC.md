# The Same Threshold — SPEC

A **cross** exhibit (a garden piece reachable via the Workbench and as a reciprocal vein between two rooms —
no front-door map footprint). It composes two already-built, code-disjoint cores so that **one number — a
transcendental fixed point — is reached two maximally different ways**, and the *agreement* is the thing you watch.

## The one idea (form expresses content)

The giant component of a random graph and the final size of a fresh-population SIR epidemic are the **same
transcendental fixed point**:

- **The forest** (`giant-component/core.mjs`): rain random edges onto n dots; above mean degree ⟨k⟩ = 1 a
  single giant blob seizes a fraction **S = 1 − e^(−cS)** (the survival of a Poisson(c) branching tree).
- **The fever** (`conservatory/sir/core.mjs`): in a fresh population (S₀→1, I₀→0⁺) an SIR epidemic with R₀ = c
  burns through a final fraction **Z = 1 − e^(−cZ)** (the classic final-size relation in the I₀→0 limit).

Turn **one** contact-number dial c. Below c=1 both stay dead-flat at zero; the instant c crosses 1 both wake
together and climb the **identical** curve. Two solvers that share no code (a union-find percolation, a
Φ-bisection on an ODE first integral) compute the very same number.

## The form (one brass instrument, two living panels, one shared gold groove)

- **A single antique-instrument panel**: brass bezel + rivets, dark enamel face, estate gold for the groove.
  The eye reads ONE machine reporting two readings — not two side-by-side charts.
- **LEFT — the forest** (lifted from giant-component): a 16×16 jittered dot-field of N=256 nodes. As c rises
  past 1, edges snap in and scattered specks crystallize into one giant continent recoloured hot-amber. The
  visible giant fraction is the union-find `giantSize/n`.
- **RIGHT — the fever** (drives the lifted SIR final size): a field of N=256 small bodies rendered in the
  FINAL burn state — ember-red if ever-infected (share = attack rate Z), susceptible-green if untouched. A
  one-shot burn animation plays toward the final fraction on each c-change (drama); the marker reads the FINAL Z.
- **THE ONE GOLD GROOVE** (the hero, the two-ways-to-pi discipline): a single 0→1 size-fraction ruler with the
  faint `predictedS(c)` shadow curve behind it. TWO jewelled markers ride it — a forest marker (`predictedS(c)`)
  and a fever marker (the fresh attack `attackFresh(c)`). Identical height for c>1; both pinned at the floor for
  c≤1. A faint dashed c=1 dead-zone line. An agreement chip flips teal → gold the instant both coincide (<1e-9).
- **HERO VERB**: drag ONE brass dial — contact number c (0.5 → 4.5). Both needles wake from flat zero TOGETHER
  at c=1 and climb the one gold groove in lockstep. A "▶ cross the threshold" button sweeps c slowly through 1.

## The negative control (load-bearing, the differentiator)

A brass toggle: **POPULATION fresh ⟷ shipped**.

- **FRESH** (I₀=1e-12, S₀→1): the fever needle pins exactly under the forest needle; markers coincide to <1e-9.
- **SHIPPED** (I₀=1e-3, S₀=0.999 — the conservatory's actual locked seed): the FEVER needle visibly **peels
  away** — the gap peaks **4.40e-2** right at the c=1 knee (where the forest is dead-flat zero but a shipped
  fever already shows a 4.4% attack from prior-immunity seeding), and the fever marker sits nonzero below c=1.
  The agreement chip goes dark. This makes the proof touchable: the agreement is the fresh LIMIT, not a tautology.

## Honest framing (front and center)

- **The shared law is exact**: `predictedS(c)` and `attackFresh(c,1e-12)` are the same iterated transcendental
  root — they agree to **< 1e-9** across the sweep (worst measured **4.35e-12**); the two solvers share no code.
- **The dots and bodies are the finite illustration**: a real seeded field of n dots fuses *within a tolerance
  band* of the analytic curve (reported in the pill), never exactly on it. The markers ride the law; the field
  grounds it.
- **The agreement is the fresh limit, not a tautology** — the shipped toggle peels the fever off (the neg-control).
- **The dead zone is the shared c=1 threshold** gating both to exactly 0.

## Architecture — single-source core

`core.mjs` has a `// === CORE BEGIN ===` / `// === CORE END ===` slab containing BOTH cores lifted byte-faithfully:

- **FOREST slab** (from `giant-component/core.mjs`, verbatim): `mulberry32, hashSeed, DSU, edgesForK, kForEdges,
  randomEdges, latticeEdges, buildAt, largest, components, giantFraction, predictedS, floodMaxComponent`. (Only
  the parent's own inner `// === CORE BEGIN/END ===` banner comment lines are dropped so MY outer sentinels are
  the only pair; all FOREST code is byte-identical to the parent.)
- **FEVER slab** (from `conservatory/sir/core.mjs`, verbatim): `P, field, R0, IprimeAtZero, Phi, peakS,
  peakInfected, peakLocation, finalSize, rk4Step, eulerStep, stepper, trace` (the parent's module body up to —
  but not including — its own `runSelfTest`).

The **thin adapter** (the only new logic, on top of two untouched cores):

- `freshParams(c, I0=1e-12)` → `{ beta: c·γ/(N−I0), gamma:0.1, N:1, I0 }`. R0(p) ≈ c (asserted |R0−c|<1e-12).
- `attackFresh(c, I0=1e-12)` = `c<=1 ? 0 : (N−I0) − finalSize(freshParams(c,I0))` — runs the SIR core's
  finalSize (Φ-bisection) and GATES the dead zone to exactly 0 via the c≤1 threshold so it matches predictedS.
- `attackShipped(c, I0=1e-3)` — the SAME computation, UNGATED and at the shipped seed (the neg-control).
- `readings(c, I0)` → `{ c, forestS: predictedS(c), feverZ: attackFresh(c,I0), diff, bothPinned, coincide }`.
  The two cores NEVER call each other.

`index.html` inlines the CORE slab byte-identically between the same sentinels (the parity leg proves
char-for-char). The page markers ride the ANALYTIC roots; the dot-field/bodies are the living illustration;
the finite-field giant witness is reported in the self-test pill.

## The self-test (`core.test.mjs` Node twin AND in-page chip; chip === twin)

1. **AGREEMENT (fresh limit)** — sweep c ∈ {1.2,1.5,2.0,2.5,3.0,4.0} (avoids the knee): `|predictedS(c) −
   attackFresh(c,1e-12)| < 1e-9` (worst measured 4.35e-12).
2. **DEAD ZONE** — for c ∈ {0.5,0.8,1.0}: `predictedS(c)===0 AND attackFresh(c)===0` (the gate makes both exactly 0).
3. **NEG-CONTROL (load-bearing)** — at SHIPPED I₀=1e-3 the gap `|predictedS(c) − attackShipped(c)|` is NONZERO
   across the sweep (≥1e-4, peaks 4.40e-2 at c=1) AND the shipped attack is >0 for some c≤1. A vacuous
   always-agree checker (or one comparing against the shipped value) provably FAILS.
4. **R₀ enactment** — `|R0(freshParams(c,1e-12)) − c| < 1e-12` for the sweep (NOT ===).
5. **ANTI-CIRCULARITY** — the giant solver body never names an SIR fn (finalSize/Phi/rk4Step/R0) and vice versa.
6. **BYTE-TWIN PARITY** — index.html's inlined CORE region === core.mjs CORE region char-for-char.
7. **(witness)** measured `giantFraction` from a seeded `randomEdges` field at large n lands within the parent's
   tolerance band of `predictedS(c)` — reported in the pill, grounding the curve in real fusing dots.

Run: `node cross/the-same-threshold/core.test.mjs` (exit 0). In-page chip shows N/N and equals the twin.

## Discoverability (reciprocal, footprint-free — a vein, not a room)

- ONE Workbench `.card` (sibling to Two Ways to π / The Shape They Share).
- Reciprocal sib/crumb links on BOTH parents — `giant-component/index.html` and `conservatory/sir/index.html`
  — pointing here; this page links BACK to both via `.crumbs`. Mind the nesting: `conservatory/sir/` is one
  level deeper, so its back-link uses `../../cross/...` while giant-component uses `../cross/...`.
- NO new front-door PLACES/POI node; NO `index.src.html` for the cross page (it inlines the core directly).
- This page drops its own `ws:seen:cross-the-same-threshold` breadcrumb so a direct visit registers.
