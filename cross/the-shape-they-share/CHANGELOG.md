# The Shape They Share — changelog

## Bloom (cycle #110) — two physics, one number

A cross of **The Catenary** × **The Soap Film**, homed in the Workbench's curve family (a new
`cross/` namespace, as the seed's path requested). ONE brass dial sets the dimensionless slenderness
`s = 2h/R` with the ring radius R FIXED = 1 — the single shared cause. From that one number two
INDEPENDENT setups are built and solved by two DISJOINT cores that share no equations and no code:

- **LEFT stage — the chain (gravity, warm brass):** a hanging chain of ~38 discrete brass links,
  pinned at the top corners a half-span `h = s/2` apart. The link centres are placed on the lifted
  `catY`/`catLen` (verbatim from `catenary/index.html`); the chain minimises gravitational PE and finds
  `y = a·cosh((x−x₀)/a)`, with `a` recovered by inverting `√(L²−v²)=2a·sinh(h/a)`.
- **RIGHT stage — the film (surface tension, cool teal):** a translucent revolved soap-film catenoid
  spanning two coaxial gold wire rings (radius R=1, height `2h` apart), slowly auto-spinning with
  meridian ribs so the necked waist reads in 3-D. Its waist radius IS the shared `a`. The film
  minimises area and finds `r = a·cosh(z/a)`, with `a` recovered by inverting `R = a·cosh(h/a)` on the
  stable branch (lifted verbatim from `soap-film/index.html`).
- **The gold thread:** spans both stages near the top and carries the live number `a = …`. Both stages
  pulse the same gold while they agree.

**The handle's crux.** Because both cores invert the SAME constraint `R = a·cosh(h/a)` from the SAME
`(R,h)`, `a_chain ≡ a_film` to machine-ε (measured ~6.8e-14 across a swept range). And because `R/h =
2/s` DECREASES as you pull, it eventually runs out of catenoid: this is the handle (Explorer 0's, the
grounded win) on which the negative control is real — a `R=cosh(u),h=u` handle would keep `R/h ≥ GMIN`
forever and could never snap.

**The snap — two honest beats, both shown.**
1. The amber **AREA-snap (Goldschmidt)** at `2h/R ≈ 1.056` (`s ≈ 1.055`): the catenoid still exists but
   two discs now cost less area, so a real film prefers to let go. The visible film snap fires here.
2. The harder **EXISTENCE wall** at `s* = 2/GMIN ≈ 1.325` (`R/h = GMIN`; `solveCatenoidA → null`): the
   boundary-value problem has NO catenoid at all.
Both ticks are drawn on the dial track, READ from the computed thresholds so the UI can't drift. At the
snap the gold thread severs (~350ms eased, radial shimmer); the banner flips to "SNAPPED · the film
gives up · the chain hangs on"; the chain does NOT flinch — it keeps its last shape with a faint dashed
teal GHOST of where the film's `a` would have been. Past the wall the right stage shows two
slowly-spinning discs (teal→amber); the chain still hangs. Pull the dial back below and the discs
re-merge into the catenoid, the thread re-knits with a gold flash. Reversible, re-watchable. A **⟲ Watch
the snap** button ramps `s` 1.20 → 1.36 → 1.20 hands-free; preset tags jump to the fat waist, the
brink, and just past the cliff.

**Honest scope (in the lede AND core.mjs):** the claim is NOT that a chain IS a soap film. It is that
BOTH problems are the curve `a·cosh(s/a)`, and from the same geometry both report the same `a` to
machine precision — until the film's existence constraint runs out. Each stage shows its own raw
physical quantity (the chain's sag & span; the film's neck & ring radius) beside the shared gold `a`, so
the visitor watches two worlds collapse onto one ruler rather than being told they are "the same."

**The bench (single-source discipline).** Two disjoint cores lifted byte-faithfully from their rooms,
never calling each other (an anti-circularity grep asserts it). The thin handle adapter (`solveShared`)
+ `runSelfTest` are the only new logic. `core.mjs` is the sole authority; `index.html` inlines the CORE
region byte-identically between `// === CORE BEGIN/END ===`; `core.test.mjs` re-proves every leg and
asserts the byte-twin parity char-for-char. Node twin: **22/22 ✓** (exit 0). In-page pill: **11/11 ✓**.

**Self-test (all green):** (1) agreement below the snap `< 1e-9`; (2) the threshold === the analytic
Goldschmidt argmin (`U*·tanh(U*)=1`, `GMIN=cosh(U*)/U*`, wall `s*=2/GMIN`, area-crossover `2h/R≈1.056`);
(3) the load-bearing negative control — past the wall the catenoid solver returns null while the
catenary still solves, so the agreement is correctly BROKEN (a vacuous checker fails it); (4) catenoid
area closed-form === numeric ∫ and `|H|≈0` (minimal surface); (5) catenary hits both pins + arc length;
(6) determinism; (7) byte-twin parity.

**Discoverability:** a Workbench card in the curve family + reciprocal cross-links from both parents
(catenary & soap-film footers, beside the existing First-Integral link). Like every cross, it registers
as a Workbench card, NOT a front-door PLACES node — no `index.src.html` change, no map footprint change,
so the map/sky bijection + smoke check stay green by construction.

**Files:** `core.mjs` · `core.test.mjs` · `index.html` · `CHANGELOG.md` · `SPEC.md`. Zero dependencies.
