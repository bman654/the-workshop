# The Light That Can't Get Out — changelog

A Hall-of-Mirrors bench: Colladon's fountain (1841), the ancestor of the optical fibre. Light
poured into a falling stream is trapped by **total internal reflection** and bends *with* the
curving water; starve the flow and the crest bends too hard, and the light spills.

## The four files (estate mould)

- **core.mjs** — the DOM-free math authority (single source of truth), between the
  `// === LIGHT-GUIDE CORE BEGIN/END ===` sentinels. Builds the projectile-parabola stream
  geometry, traces the trapped ray, and owns the one exact law.
- **core.test.mjs** — the Node twin (42 assertions incl. byte-parity against index.html).
- **index.src.html → index.html** — the canvas-2D fountain; forge inlines the core byte-identical
  between the sentinels, so the painting, the in-page self-test chip, and the Node twin cannot drift.
- **CHANGELOG.md** — this file.

## The one exact law (facet 0)

Light is trapped in a bend of centre-line radius **R** and half-width **r** iff

    R ≥ R_min = r·(n+1)/(n−1)

For water n≈1.333 ⇒ R_min ≈ 7.006·r ; θc = asin(1/n) ≈ 48.6°. In homogeneous water rays are
straight, so the impact parameter p = ρ·sinθ is conserved; the outer wall (largest ρ = R+r) leaks
first. The worst-case injected ray grazes the inner wall (p = R−r), so sinθ_out = (R−r)/(R+r); TIR
needs ≥ 1/n, giving R ≥ r(n+1)/(n−1). Scale-invariant. For a projectile jet the local bend radius
is R(t) = |v|³/(g·vₓ), **minimised at the apex** (R_apex = vₓ²/g) — so the leak is physically
inevitable at the crest, firing when vₓ < √(g·r·(n+1)/(n−1)). n is a live param (sugar-water
n=1.4 → R_min ≈ 6r).

## Coupling note — the governing worst-case is the crest osculating circle

A finite-width chord ray traced through the parabola is intrinsically ~1.5× more forgiving than the
local osculating-circle law (it bounces just off-crest, where R has already grown — a
scale-invariant gap). So the governing worst-case incidence is computed at the apex osculating
circle, `asin((R_apex−r)/(R_apex+r))`, which is **exact**, matches the circular-arc oracle and
R_min, and crosses θc precisely at R_apex = R_min. The hero ray is drawn grazing the crest and
clipped there on a leak; when trapped, every marched bounce corroborates θ ≥ θc.

## The self-test (mirage-class; in-page pill + Node twin both call runSelfTest)

1. impact-parameter invariant (arc p-drift ~1e-14; parabola straightness ~1e-16)
2. closed-form arc oracle — outer incidence = asin((R−r)/(R+r)) to <1e-9; R_min trap/leak battery
3. critical pair — R=R_min·(1±5%): above all ≥θc (49.5°), below a bounce <θc (47.6°)
4. the claim (trapped) — witness fan, EVERY internal bounce θ ≥ θc, 0 leaks, pool bright
5. **payoff-liveness** — starve flow so R_apex<R_min: a bounce dips <θc, at the crest, a refracted
   ray escapes with a real Snell dir, and the pool darkens (headless, drives the real geometry)
6. neg-control — a shallow/wide jet leaks early, pool ≈ 0
7. monotone flow response — pool weakly ↑ with v; one sharp knee exactly at vₓ_threshold
8. domain guards — v→0, α=90°, r≥R_apex, n=1 all finite, marcher bounded
   plus BYTE-PARITY: the in-page core slice is character-identical to core.mjs.

## The render (facet 2)

Canvas-2D additive glow, no libraries. Cached backdrop; glass water ribbon with a wet-sheen glint;
the hero ray as a 3-pass bloom stack clipped to the ribbon with super-luminous packets that stop
dead at escS; a breathing caustic pool whose brightness ∝ poolI; an edge-triggered spray burst at
the crest with a chromatic fringe (true dispersion), a sustained seep while sub-critical, and a
re-seal shimmer on re-trap. Controls: a gilt nozzle handle (circular drag → aim, pointer-capture,
ref hit-test), a vertical flow throttle (→ the leak trigger), arrow-key a11y on both,
prefers-reduced-motion static fallback. Silent by design.

## Placement

A DEEPEN of the Hall of Mirrors (a bench, not a room): new card under "Rays, lenses & mirrors",
kin-navved to Rainbow (its second TIR bounce) and the Mirror Maze (the guided-bouncing-beam cousin),
reciprocal kin links added on both. Front-door room count unchanged; `ws:seen:light-fountain`
dropped; enrolled in the estate manifest (hall 26→27 within).

## 2026-07-22 — built
Shipped. core.test.mjs 42/42, in-page self-test 8/8 green, forge --check --all clean, manifest OK,
no horizontal overflow at 390/1280, payoff verified trapped→leak→re-seal on the real key-input path.
