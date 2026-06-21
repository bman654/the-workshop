# The Equal-Area Sweep — CHANGELOG

## #249 — first bloom: Kepler's 2nd law as a touchable drag-instrument

**What it is.** One fixed ellipse, the Sun pinned at the *focus* (visibly off-centre — that asymmetry
is the whole lesson). Grab the glowing planet and drag it round the orbit: the brass arm joining Sun
to planet sweeps a wedge, and you *feel* the planet race when it swings close to the Sun and crawl
when it drifts far away. Let go and it glides one fixed tick of **time** at its real orbital speed,
stamping the swept wedge both on the orbit and as a chip on a specimen rail below. Fire several around
the orbit and the rail fills with wildly different silhouettes — a fat, stubby wedge at perihelion, a
long, thin sliver at aphelion — every one carrying the **same printed area** to machine precision. A
brass equals-rail `= = = =` and a live `all N wedges equal · ε ≈ 1e-15` badge under the chips are the
keystone proof at a glance.

**The law, made exact.** Kepler's 2nd law says the line from Sun to planet sweeps area at a *constant*
rate, `dA/dt = L/2` with `L = √(1−e²)` in these canonical units. The page never integrates pixels: the
wedge area is the **closed-form focal-sector integral**

```
ΔA = (a·b/2)·((E₁ − e·sinE₁) − (E₀ − e·sinE₀)) = (b/2)·(M₁ − M₀) = (L/2)·Δt
```

evaluated exactly from the eccentric anomalies of the tick's endpoints. Because the mean anomaly *is*
time here (`M = t`, mean motion `n = 1`), equal Δt ⇒ equal ΔA. No integration error anywhere.

**The frame (the contract every facet obeys).** Sun at the focus = origin; perihelion along +x; CCW
motion. `x(E) = a(cosE − e)`, `y(E) = b·sinE`, focal radius `r = 1 − e·cosE`. The one screen y-flip
lives only in the render layer; the core is pure and never flips y.

**The soul — the falsifier.** A toggle "How should the planet step each tick?": **⏱ EQUAL TIME** (the
law) vs **∠ EQUAL ANGLE** (the cheat). Equal-angle advances an equal *true-anomaly turn* each tick, so
the perihelion wedge balloons and the aphelion sliver starves — areas wildly unequal, and the
equals-rail flips to an amber `≠ ≠ ≠`. The **same machinery** that proves equal-time equal-area *fails*
equal-angle: that failure is the discriminating negative control. At `e = 0` (circle) both modes give
equal pie-slices — the bite comes specifically from eccentricity.

**The e-dial.** A brass slider `e ∈ [0, 0.85]` (default 0.6, honest engraved cap at 0.85) re-lays the
same orbit live; the Sun visibly slides toward perihelion as `e` grows, and the planet keeps its
current mean anomaly so it doesn't jump. Preset chips `○ circle (e=0)` and `◗ comet (e=0.85)`.

**A clean canonical-radians twin.** `core.mjs` is the sole areal-velocity authority and does **not**
reuse the orrery's degrees-and-epochs `kepler()` (that works in degrees off a J2000 epoch with real
planetary elements). Here everything is dimensionless and in radians: μ = 1, a = 1 ⇒ b = √(1−e²),
period T = 2π, mean motion n = 1 so M = t exactly. The duplication is deliberate — same law, different
register — exactly as the aerodrome's live (r,v) propagator declares its separation from the orrery.

**The landmine guard.** `keplerSolve` only knows one revolution; a naive `M mod 2π` collapses the
wrap-around wedge (the one straddling M = 2π → 0) to zero area. `keplerSolveCumulative(M,e) =
keplerSolve(M mod 2π, e) + 2π·floor(M/2π)` keeps the lap-crossing wedge honest. The firing UI passes
cumulative M; a dedicated twin leg asserts the wrap wedge equals the first, and shows the naive route
would have collapsed it.

**Proved exact, two places + three routes.**
- An **in-page self-test pill** (green, 7/7) runs `SweepCore.runSelfTest()`.
- A **headless Node twin** `node equal-area-sweep/core.test.mjs` (EXIT 0, 56/56) re-derives the
  keystone three independent ways: the closed form, an independent **shoelace** polygon area (focus +
  many arc samples, matched to < 1e-6 — a polygon *approximation*, so the gate is 1e-6, **not** machine
  ε; do not "tighten" it), and a third **Simpson** route `½∫r(θ)²dθ`. Plus: `r²·θ̇ = √(1−e²) = L`
  constant around the orbit via the analytic cross product `x·ẏ − y·ẋ` (no finite differencing, which
  would spike at the periapsis branch jump), the equal-area claim across `e ∈ {0,.2,.6,.85,.967}` ×
  `nTicks ∈ {8,12,13}`, the equal-angle cheat measurably failing (ratio > 5× at e ≥ 0.6, growing with
  e), the wrap-around guard, the M↔E and θ↔t round-trips to < 1e-12, domain guards (e<0 / e≥1 /
  non-finite → NaN), and byte-twin parity of the inlined CORE region.

**A note on tolerances (so a later maker doesn't read a contradiction).** The page *displays*
`ε = (max−min)/mean` over fired wedges (~1e-15, the actual numerical spread). The twin *asserts* guard
tolerances of 1e-12 (claims 1/3, round-trips, wrap) and 1e-6 (claim 2, the polygon approximation).
The 1e-15 readout and the 1e-12 / 1e-6 assertions are **not** contradictory — one is the measured
spread, the others are deliberately-loose guards.

**Honest scope.** Dimensionless — `a` is one orbit-unit, time is in mean-anomaly turns, not years; the
Sun sits at the focus. The law shown is exact; the units are illustrative.

**Registration.** A new observatory-district garden POI (`celestial-mechanics` wing) reusing the
existing `tower` footprint — no new footprint tier, so `bigSwingsBuilt` stays 22. Reciprocal cross-link
with the Orrery (both directions resolve + reciprocate). Sibling to the Orrery, which wheels this very
law for the real planets.
