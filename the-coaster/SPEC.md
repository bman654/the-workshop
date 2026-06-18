# The Coaster — SPEC

A frictionless point-mass on a player-shaped rail with a vertical loop. The piece's
soul: *you operate a real instrument and sit inside a real body; the motion is the
readout.* The rigor layer proves the textbook loop-survival law exactly.

## The physical model

A bead of mass `m` slides on a rigid, frictionless rail in the vertical plane. The rail
is sampled by arc-length `s` as a polyline `{x, y, θ, κ}`. Gravity `g = 9.81` pulls −y.
The bead is released from rest at height `h` above the loop bottom and runs under gravity
alone.

Frictionless ⇒ mechanical energy is conserved exactly: `E = ½mv² + mgy`. So at any height
the speed obeys the **energy form** `v² = 2g(h − y)` — algebraic, robust as `v → 0` near a
crest (no stiff division at the detach knee).

### The loop

A vertical circular loop of radius `r`, entered/exited at its bottom. With θ measured up
from the bottom (CCW), the inward radial direction is `(−sinθ, cosθ)` and gravity's inward
component is `−g cosθ`. The rail pushes inward with `N`, so the centripetal balance gives:

```
N(θ) = m v²/r + m g cosθ
```

- Bottom (θ=0): `N = mv²/r + mg` (rail pushes hardest).
- Top (θ=π): `N = mv²/r − mg` (the textbook top condition; `N ≥ 0 ⟺ v² ≥ gr`).

### The survival law (derived)

Conserve energy from `h` to the top (height `2r`): `v_top² = 2g(h − 2r)`. Demand
`v_top² ≥ gr`:

```
2g(h − 2r) ≥ gr  ⟺  h ≥ 2.5 r
```

### The detach angle (sub-threshold)

Below threshold the bead leaves the rail where `N → 0` on the upper half. `N = 0` gives
`v² = −g r cosθ`; equate with the energy form:

```
cosθ_d = −(2/3)(h/r − 1)
```

Past `θ_d` the bead is a free projectile (gravity only), launched with `v·tangent` at the
detach point.

## The architecture

- **`core.mjs`** — DOM-free authority (~390 lines, no `export` when inlined). `buildTrack`
  (Catmull-Rom hills/valley + an EXACT circular loop arc, `κ === 1/r`), `integrate` (energy
  form + normal force + first-N<0 detach), `alwaysSlide` (the neg-control), `detectDetach`,
  `survives`, `runSelfTest`.
- **`core.test.mjs`** — Node twin: runs `runSelfTest()` verbatim, deeper Node-only
  assertions, and re-extracts the inlined core from `index.html` between the
  `// ===== COASTER CORE (inlined byte-twin) BEGIN/END =====` sentinels to prove it is
  byte-for-byte identical (the estate parity standard). Exit 0 on all-green.
- **`index.html`** — the flagship instrument. Inlines `core.mjs` byte-identically between
  the sentinels (cradle-weaver mold; **no `.src.html`** so the forge count is unchanged).
  Three organs (track / energy column / needle) render the bead's motion FROM the core.
  The in-page chip calls the SAME `runSelfTest()`; chip count === Node twin count.

## Invariants the self-test guards (chip === twin)

| Claim | Assertion |
|---|---|
| Geometry-lock | `κ === 1/r` on every loop sample (true circle) |
| 1 — conservation | `max|E−E₀|/E₀ < 1e-9` along the integrated track |
| 2 — survival | integrated survival === `h ≥ 2.5r`; bisection → `h*/r = 2.5` |
| 3 — detach angle | integrator φ === `acos(−⅔(h/r−1))`; at detach `v² = −gr cosθ_d` |
| 4 — neg-control | `alwaysSlide` completes every sub-2.5r release the real `integrate` detaches (teeth bite over the whole band); a just-legal release survives (anti-vacuity) |
| 5 — derived | top speed² === `2g(h−2r)`; at `h=2.5r` it === `gr` |

## Honesty (the header in the page + core)

Frictionless point mass; a rigid, exactly circular loop; the rail can only push (N≥0),
never pull (no clamp / no upstop wheels). The claim is precisely `v_top² ≥ gr ⟺ h ≥ 2.5r`
and its felt consequence — not a real clothoid loop, not friction, not a wheeled car.

## Reserved expansion (the Midway's coming-soon stalls)

- **The Loop** — a rider's-frame cockpit (first-person felt-weight) on the same physics.
- **The Rotor** — a gravitron: spin up, the floor drops, friction pins you to the wall.
