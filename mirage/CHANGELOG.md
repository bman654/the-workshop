# The Mirage — changelog

A Hall of Mirrors bench. *The road remembers being wet.* A first-person view straight down a
two-lane desert highway at noon. The air skimming the **baking asphalt** is hot and thin — its
refractive index **dips** near the ground — so a ray grazing toward the tar **bends upward**
before it touches and arrives at your eye from **below** the true horizon. You see a pool of sky
lying on the road: **false water** that was never there, with the distant car smeared into an
inverted, hanging twin. Drag the **HEAT** thermometer up and the wet road blooms and creeps toward
you; drag it to zero and the puddle **vanishes** — proof the mirage *is the gradient*, not a trick
of the renderer.

## Built (cycle #288, BUILD/garden — the planter)

- **`core.mjs`** — the SOLE math authority (zero-dep ESM, no DOM), a continuum-eikonal ray
  marcher. Param shape `p = { profile, dndyScale, n0, H, eyeY, theta0, step }`; coordinates are
  physical (x = metres down the road, y = height above it). The air is horizontally stratified:
  `n(y) = n0 − sign·dndyScale·exp(−y/H)` (inferior dips near the road; superior flips the sign). A
  test-only `'linear'` fixture gives `n(y)=a·y+b` for the closed-form oracle.
  - `nOf`, `gradOf` (ANALYTIC dn/dy, never a finite difference), `nMinRoad`, `invariant(y,θ,p) =
    n(y)·cos(θ)` — the Bouguer / stratified-Snell invariant ξ, conserved along every ray.
  - `rayDeriv` / `rk4` / `marchRay(theta0,p)` — RK4 integration of the eikonal ray ODE in arc
    length: `dx/ds=cosθ, dy/ds=−sinθ, dθ/ds=−(1/n)(dn/dy)cosθ`. The NUMERICAL CARE-POINT: at a
    turning point the ray goes horizontal (dy/ds→0) and a fixed-step RK4 can step *through* it —
    so the marcher DETECTS the turn as the sign change of sin(θ) and **bisects in s** to land the
    state exactly horizontal on n(y*)=ξ, then reflects and continues. A hard step cap means a
    degenerate input can never spin forever.
  - `turningPoint(theta0,p)→{yStar,found}` — solved INDEPENDENTLY of the marcher by bisection on
    n(y)=ξ over [0,eyeY]. `criticalAngle(p)` — θc with n(eyeY)·cos θc = n_min(road): the threshold
    between rays that turn (mirage) and rays that reach the tar. `classifyProfile(p)` — inferior |
    superior | none from the SIGN of dn/dy alone, never from the image. `puddleHorizon(p)` — the
    apparent false-water distance the page prints, derived from the same turning condition;
    returns `null` when no turn exists (uniform air / superior). One number, two uses.
  - `witness()`, `runSelfTest()→{ok,passed,total,checks}` (**8 legs**).
  - The math lives between `// ===== MIRAGE CORE … =====` sentinels; the `export {…}` line is
    OUTSIDE them so the byte-twin slice is identical to the page's.
- **`core.test.mjs`** — the Node twin, three layers: (a) runs the page's `runSelfTest()` (all 8
  green); (b) INDEPENDENT re-derivations at fresh params the page never uses — the **closed-form
  linear oracle** y*=(n₀cosθ₀−b)/a on 40 fresh turning fixtures, the eikonal invariant on a fresh
  fan, the critical-angle pos/neg pair, the puddle-edge turning condition re-marched at half step,
  the dndyScale=0 neg-control, and the sign classifier; (c) **BYTE-PARITY** of the CORE slice
  between `core.mjs` and `index.html` (indentation-normalized). Exit 0 = all green (**16/16**).
- **`index.html`** — the touchable painting (one `<canvas>`), importing the SAME core via the
  inlined byte-identical slice so render and proof are one object.
  - A hand-built first-person desert highway: a graded bleached-blue sky over heat-pale asphalt, a
    cracked perspective centerline running to the vanishing point, telephone poles marching
    smaller, a dark car silhouette near the horizon, dithered asphalt grain.
  - **HEAT** thermometer (the ONE primary gesture, cool indigo → furnace orange) maps to
    `dndyScale`. The three coupled payloads, all driven by `core.mjs`: (1) the **puddle** blooms
    and its hard near edge creeps toward you — the readout *"false water reaches N m ahead"* is the
    certified `puddleHorizon`; (2) the car smears into an **inverted twin** by literal
    mirror-sampling the offscreen scene across the puddle edge with vertical compression + a
    heat-haze ripple; (3) the **shimmer**, a sinusoidal warp above the road scaling with heat.
  - **LAYERS** toggle (hot-below puddle ↔ warm-above Fata Morgana looming) and **SHOW RAYS**
    overlay (the grazing beam arcing and turning before the road, the turn marked with a caret).
  - The **LIVE NEG-CONTROL**: drag HEAT to 0 ⇒ dndyScale=0 ⇒ uniform air ⇒ rays dead straight ⇒
    the puddle/flip vanish, the readout shows no false water. The self-test pill (✓ 8/8) clicks to
    list the named checks. Drops `ws:seen:mirage` on visit.

## Wiring

- One new card in **the Hall of Mirrors** refraction vein, right after *The Lifeguard's Run*
  (glyph 🌅, hue `#f0c070` continuing the desert-ochre ramp past lifeguards-run's `#e8c98a`).

## The physics, briefly

A horizontally-stratified medium conserves ξ = n(y)·cos θ along every ray (θ from horizontal).
A nearly-horizontal ray grazing toward the hot, low-index air near the road reaches a height y*
where n(y*) = ξ and goes momentarily horizontal — the **turning point** — then climbs back, so its
light arrives from below the horizon and the brain places it on the ground as reflected sky. The
critical depression θc (n(eyeY)·cos θc = n_min) divides rays that turn from rays that hit the tar;
the just-grazing ray's turn-range is the near edge of the false water. Kill the gradient
(dndyScale=0) and ξ-conservation forces every θ constant — perfectly straight rays, no turn, no
puddle. The self-test proves all of this to a millionth, including a hand-derivable linear-profile
ground-truth the marcher cannot fake.
