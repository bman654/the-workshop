# The Equal-Area Sweep

Kepler's 2nd law as a touchable drag-instrument. One fixed ellipse, the Sun pinned at the **focus**
(visibly off-centre). Grab the planet, drag it round, and *feel* it race near the Sun and crawl far
away — yet the brass Sun→planet arm always sweeps **equal areas in equal times**. Let go and it glides
one tick of time, stamping the swept wedge on a specimen rail; fire several around the orbit and watch
a row of wildly different wedge shapes all carry the same printed area. Flip the **equal-angle cheat**
and the law visibly breaks.

## The files (the aerodrome's file grammar)

| file | role |
|------|------|
| `core.mjs` | the **sole** areal-velocity authority — pure, DOM-free, canonical radians (μ=1, a=1, M=t). Inlined byte-true into `index.html` between the `/* CORE BEGIN */ … /* CORE END */` sentinels. |
| `core.test.mjs` | the headless Node twin — `node equal-area-sweep/core.test.mjs` ⇒ EXIT 0 (56/56). Re-derives the keystone three independent ways + byte-parity. |
| `index.src.html` | the authored page (carries the `<!-- forge:include core.mjs -->` directive). |
| `index.html` | forged byte-true from `index.src.html` via `tools/forge/forge.mjs`. **Do not edit by hand.** |
| `verify.sh` | the gate — `bash equal-area-sweep/verify.sh` (all green). |
| `CHANGELOG.md` / `README.md` | this. |

## The math (canonical units)

μ = 1, a = 1 ⇒ b = √(1−e²), period T = 2π, mean motion n = 1, so the **mean anomaly M = t exactly**.
The areal constant `L = √(1−e²) = b` (twice the areal velocity, the specific angular momentum here).

The keystone is the closed-form focal-sector area:

```
sweepArea(e, E₀, E₁) = (a·b/2)·((E₁ − e·sinE₁) − (E₀ − e·sinE₀)) = (L/2)·(M₁ − M₀)
```

Because `M = t`, equal Δt ⇒ equal ΔA — Kepler's 2nd law, exact and closed-form (no integration error).
The single honest number `θ̇ = L/r²` drives every tactile cue: the planet races where r is small
(perihelion) and crawls where r is large (aphelion). The analytic cross product `x·ẏ − y·ẋ = a·b = L`
is constant at every E (computed analytically — **never** finite-differenced, which spikes at the
periapsis branch jump).

## The proof (two places, three routes)

1. **closed form** — `sweepArea` above.
2. **shoelace polygon** — `polygonArea(focus + arc samples)` re-derives the same area independently
   (matched to **< 1e-6**, a polygon *approximation* — that gate is 1e-6, **not** machine ε; do not
   tighten it or the gate breaks).
3. **Simpson quadrature** — `sectorAreaNumeric` = `½∫r(θ)²dθ` over the tick's true-anomaly range.

The **falsifier**: `fireWedge(e, 'angle', …)` advances an equal *angle* each tick — the same machinery
makes **unequal** areas (ratio > 5× at e ≥ 0.6, growing with e). At e = 0 both modes are equal — the
bite is eccentricity. The **landmine guard**: `keplerSolveCumulative` keeps the lap-crossing wedge
honest (a naive `M mod 2π` collapses it to zero).

## Build & verify

```sh
node tools/forge/forge.mjs equal-area-sweep/index.src.html   # forge index.html from src
node equal-area-sweep/core.test.mjs                          # headless twin, EXIT 0
bash equal-area-sweep/verify.sh                              # full gate
```

## Honest scope

Dimensionless — `a` is one orbit-unit, time is in mean-anomaly turns, not years; the Sun sits at the
focus. The law shown is exact; the units are illustrative. A clean canonical-radians twin: it does
**not** reuse the orrery's degrees-and-epochs Kepler core.

Sibling to the [Orrery](../orrery/index.html), which wheels this very law for the real planets.
